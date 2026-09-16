/**
 * 服务端日志与可观测性（1.8.1）——级别开关 / 保留策略 / 单文件上限 / 慢请求观测。
 *
 * 背景：原来 data/logs 只写不删（NAS 迟早被日志撑爆）、没有级别开关（生产没法静音 debug）、
 * 单天日志无限增长、请求慢/500 只在 stdout 里（NAS 上按日期翻日志看不到）。
 *
 * 这里锁住三件事：
 * 1) 判断逻辑抽成纯函数（级别、保留窗口、哪些文件名可删、该不该清理），边界逐个钉死；
 * 2) `update.log` **永远**不在删除范围内（用户的「查看更新日志」入口不能没了）；
 * 3) `logServer` 的开关行为：低于 LOG_LEVEL 不写文件也不打 stdout；超过单文件上限停写并提示一次；
 *    自身失败绝不抛出（日志不能拖垮业务）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ENV_KEYS = ["LOG_LEVEL", "LOG_KEEP_DAYS", "LOG_MAX_MB", "DATA_DIR"];
const savedEnv: Record<string, string | undefined> = {};
for (const k of ENV_KEYS) savedEnv[k] = process.env[k];

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function restoreEnv(): void {
  for (const k of ENV_KEYS) setEnv(k, savedEnv[k]);
}

const ROOT = await mkdtemp(join(tmpdir(), "gongdi-log-test-"));
process.env.DATA_DIR = ROOT;

const L = await import("../src/lib/log.server");

/** 相对今天偏移 n 天的 YYYY-MM-DD（测试里独立算，不复用被测实现） */
function shiftDay(n: number, from: Date = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function freshDir(tag: string): Promise<string> {
  return mkdtemp(join(tmpdir(), `gongdi-log-${tag}-`));
}

/** 临时接管 console.*，看 logServer 到底有没有打 stdout */
function captureConsole() {
  const orig = { log: console.log, warn: console.warn, error: console.error, debug: console.debug };
  const lines: string[] = [];
  const push = (...args: unknown[]) => {
    lines.push(args.map((a) => String(a)).join(" "));
  };
  console.log = push as unknown as typeof console.log;
  console.warn = push as unknown as typeof console.warn;
  console.error = push as unknown as typeof console.error;
  console.debug = push as unknown as typeof console.debug;
  return {
    lines,
    restore() {
      console.log = orig.log;
      console.warn = orig.warn;
      console.error = orig.error;
      console.debug = orig.debug;
    },
  };
}

async function readToday(dir: string): Promise<string[]> {
  const file = join(dir, "logs", `${shiftDay(0)}.log`);
  const text = await readFile(file, "utf8");
  return text.trimEnd().split("\n");
}

// ───────────────────────────── 级别开关（纯函数） ─────────────────────────────

test("parseLogLevel：非法值（空/乱写/undefined）走默认 info", () => {
  assert.equal(L.DEFAULT_LOG_LEVEL, "info");
  assert.equal(L.parseLogLevel(undefined), "info");
  assert.equal(L.parseLogLevel(null), "info");
  assert.equal(L.parseLogLevel(""), "info");
  assert.equal(L.parseLogLevel("   "), "info");
  assert.equal(L.parseLogLevel("verbose"), "info");
  assert.equal(L.parseLogLevel("1"), "info");
});

test("parseLogLevel：大小写与空白容忍", () => {
  assert.equal(L.parseLogLevel("DEBUG"), "debug");
  assert.equal(L.parseLogLevel(" Warn "), "warn");
  assert.equal(L.parseLogLevel("Error"), "error");
  assert.equal(L.parseLogLevel("info"), "info");
});

test("shouldLog：等于阈值要记，低于阈值一律丢弃", () => {
  assert.equal(L.shouldLog("debug", "debug"), true);
  assert.equal(L.shouldLog("debug", "info"), false);
  assert.equal(L.shouldLog("info", "info"), true);
  assert.equal(L.shouldLog("info", "warn"), false);
  assert.equal(L.shouldLog("warn", "error"), false);
  assert.equal(L.shouldLog("error", "error"), true);
  assert.equal(L.shouldLog("error", "debug"), true);
});

test("shouldLog：未知 level 不记；未知 min 按默认 info 兜底（环境变量写错不该让日志全静音）", () => {
  assert.equal(L.shouldLog("trace", "debug"), false);
  assert.equal(L.shouldLog(undefined, "debug"), false);
  assert.equal(L.shouldLog("warn", "verbose"), true);
  assert.equal(L.shouldLog("debug", "verbose"), false);
});

// ───────────────────────────── 保留策略（纯函数） ─────────────────────────────

test("parseKeepDays：非法 LOG_KEEP_DAYS 一律走默认 14", () => {
  assert.equal(L.DEFAULT_LOG_KEEP_DAYS, 14);
  for (const bad of [undefined, null, "", "  ", "abc", "0", "-3", "NaN", "Infinity", 0, -1, Number.NaN, Infinity, 0.5]) {
    assert.equal(L.parseKeepDays(bad), 14, `${String(bad)} 应回落到默认 14`);
  }
});

test("parseKeepDays：合法值取整；超大值封顶（防环境变量写错删空）", () => {
  assert.equal(L.parseKeepDays("1"), 1);
  assert.equal(L.parseKeepDays("30"), 30);
  assert.equal(L.parseKeepDays("7.9"), 7);
  assert.equal(L.parseKeepDays(21), 21);
  assert.equal(L.parseKeepDays("999999"), 3650);
});

test("parseMaxMb：非法值走默认 8，允许小数", () => {
  assert.equal(L.DEFAULT_LOG_MAX_MB, 8);
  for (const bad of [undefined, "", "abc", "0", "-1", Number.NaN]) {
    assert.equal(L.parseMaxMb(bad), 8, `${String(bad)} 应回落到默认 8`);
  }
  assert.equal(L.parseMaxMb("16"), 16);
  assert.equal(L.parseMaxMb("0.0005"), 0.0005, "小数要保留：测试要靠它造一个「小文件上限」");
  assert.equal(L.parseMaxMb("999999"), 10240);
});

test("logRetentionCutoff：默认窗口 14 天，今天算第 1 天", () => {
  const now = new Date("2026-09-16T10:30:00.000Z");
  assert.equal(L.logRetentionCutoff(now), "2026-09-03");
  assert.equal(L.logRetentionCutoff(now, 1), "2026-09-16");
  assert.equal(L.logRetentionCutoff(now, 3), "2026-09-14");
  assert.equal(L.logRetentionCutoff(now, 14), "2026-09-03");
});

test("isManagedLogFile：只认 YYYY-MM-DD.log，update.log 与其它名字都不算", () => {
  assert.equal(L.isManagedLogFile("2026-09-16.log"), true);
  assert.equal(L.isManagedLogFile("update.log"), false, "更新日志不在保留策略的管辖范围内");
  assert.equal(L.PROTECTED_LOG_FILES.includes("update.log"), true);
  assert.equal(L.isManagedLogFile("2026-09-16.log.1"), false);
  assert.equal(L.isManagedLogFile("2026-9-1.log"), false);
  assert.equal(L.isManagedLogFile("20260916.log"), false);
  assert.equal(L.isManagedLogFile("2026-09-16.log.bak"), false);
  assert.equal(L.isManagedLogFile("notes.txt"), false);
  assert.equal(L.isManagedLogFile(undefined), false);
});

test("isExpiredLogFile：边界——窗口内第 1 天保留，再早一天才算过期", () => {
  const now = new Date("2026-09-16T23:59:00.000Z");
  // 14 天窗口 = 2026-09-03 ~ 2026-09-16
  assert.equal(L.isExpiredLogFile("2026-09-16.log", now), false, "今天");
  assert.equal(L.isExpiredLogFile("2026-09-04.log", now), false, "窗口内倒数第二天");
  assert.equal(L.isExpiredLogFile("2026-09-03.log", now), false, "刚好到期（窗口第一天）仍保留");
  assert.equal(L.isExpiredLogFile("2026-09-02.log", now), true, "比窗口早一天即过期");
  assert.equal(L.isExpiredLogFile("2020-01-01.log", now), true);
});

test("isExpiredLogFile：update.log 永远不过期（保留策略不得误删更新日志）", () => {
  const now = new Date("2026-09-16T00:00:00.000Z");
  for (const keep of [1, 14, 3650]) {
    assert.equal(L.isExpiredLogFile("update.log", now, keep), false);
    assert.equal(L.isExpiredLogFile("update.log", new Date("2030-01-01T00:00:00.000Z"), keep), false);
  }
  assert.equal(L.isExpiredLogFile("UPDATE.LOG", now), false, "大小写不同也不在管辖范围");
});

test("isExpiredLogFile：认不出日期的怪文件名不动手（宁可留着也不误删）", () => {
  const now = new Date("2026-09-16T00:00:00.000Z");
  assert.equal(L.isExpiredLogFile("9999-99-99.log", now), false);
  assert.equal(L.isExpiredLogFile("0000-00-00.log", now), false);
  assert.equal(L.isExpiredLogFile("", now), false);
});

test("selectExpiredLogs：混合目录只挑该删的，且不返回受保护文件", () => {
  const now = new Date("2026-09-16T00:00:00.000Z");
  const names = [
    "2026-09-16.log",
    "2026-09-03.log",
    "2026-09-02.log",
    "2024-12-31.log",
    "update.log",
    "2026-09-16.log.1",
    "2026-9-1.log",
    "notes.txt",
    undefined,
  ];
  const dead = L.selectExpiredLogs(names, now, 14);
  assert.deepEqual(dead, ["2026-09-02.log", "2024-12-31.log"]);
  assert.equal(dead.includes("update.log"), false);
  assert.equal(L.selectExpiredLogs(names, now, 3650).length, 0, "保留期放到 10 年就一个都不删");
});

test("needsDailyCleanup：进程启动（null）与跨天为 true，同一天为 false", () => {
  assert.equal(L.needsDailyCleanup(null, "2026-09-16"), true);
  assert.equal(L.needsDailyCleanup(undefined, "2026-09-16"), true);
  assert.equal(L.needsDailyCleanup("2026-09-16", "2026-09-16"), false);
  assert.equal(L.needsDailyCleanup("2026-09-15", "2026-09-16"), true);
});

// ───────────────────────────── logServer 实际行为 ─────────────────────────────

test("LOG_LEVEL=error：info/warn 既不写文件也不打 stdout", async () => {
  const dir = await freshDir("level-off");
  process.env.DATA_DIR = dir;
  setEnv("LOG_LEVEL", "error");
  const cap = captureConsole();
  try {
    await L.logServer("info", "不该出现的信息", { a: 1 });
    await L.logServer("warn", "不该出现的警告", { a: 2 });
    assert.equal(cap.lines.length, 0, `低于 LOG_LEVEL 的事件不能打 stdout：${cap.lines.join("|")}`);
    assert.equal(existsSync(join(dir, "logs", `${shiftDay(0)}.log`)), false, "低于 LOG_LEVEL 的事件不能写文件");
    await L.logServer("error", "该出现的错误", { a: 3 });
    assert.equal(cap.lines.length, 1, "达到级别的事件要打 stdout");
    assert.equal((await readToday(dir)).length, 1, "达到级别的事件要落盘");
  } finally {
    cap.restore();
    restoreEnv();
  }
});

test("LOG_LEVEL=debug：debug 也能落盘；默认（info）会吞掉 debug", async () => {
  const dir = await freshDir("level-debug");
  process.env.DATA_DIR = dir;
  setEnv("LOG_LEVEL", "debug");
  const cap = captureConsole();
  try {
    await L.logServer("debug", "调试细节", { step: 1 });
    assert.equal(cap.lines.length, 1);
    const rows = await readToday(dir);
    assert.equal(rows.length, 1);
    assert.equal(JSON.parse(rows[0]).event, "调试细节");
  } finally {
    cap.restore();
  }
  setEnv("LOG_LEVEL", undefined);
  const cap2 = captureConsole();
  try {
    await L.logServer("debug", "默认级别下的调试细节", {});
    assert.equal(cap2.lines.length, 0, "不设 LOG_LEVEL 时默认 info，debug 应被吞掉");
  } finally {
    cap2.restore();
    restoreEnv();
  }
});

test("LOG_LEVEL 非法值按 info 兜底（不静音、也不全开）", async () => {
  const dir = await freshDir("level-bad");
  process.env.DATA_DIR = dir;
  setEnv("LOG_LEVEL", "verbose");
  const cap = captureConsole();
  try {
    await L.logServer("debug", "被吞掉", {});
    await L.logServer("info", "留下", {});
    assert.equal(cap.lines.length, 1);
    assert.match(cap.lines[0], /"event":"留下"/);
  } finally {
    cap.restore();
    restoreEnv();
  }
});

test("落盘：文件名是当天日期，行内带 level/event/detail 与 ISO 时间戳", async () => {
  const dir = await freshDir("shape");
  restoreEnv();
  process.env.DATA_DIR = dir;
  const cap = captureConsole();
  try {
    await L.logServer("warn", "台账保存冲突", { payload: { n: 3 } });
  } finally {
    cap.restore();
  }
  const rows = await readToday(dir);
  assert.equal(rows.length, 1);
  const row = JSON.parse(rows[0]);
  assert.equal(row.level, "warn");
  assert.equal(row.event, "台账保存冲突");
  assert.deepEqual(row.payload, { n: 3 });
  assert.match(row.at, /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  assert.equal((await readdir(join(dir, "logs"))).length, 1, "logs 目录里只有当天一个文件");
});

test("detail 不可序列化（循环引用）时仍落盘并标注", async () => {
  const dir = await freshDir("circular");
  restoreEnv();
  process.env.DATA_DIR = dir;
  const cap = captureConsole();
  try {
    const a: Record<string, unknown> = { name: "环形" };
    a.self = a;
    await L.logServer("error", "序列化失败也要有记录", { payload: a });
  } finally {
    cap.restore();
  }
  const rows = await readToday(dir);
  assert.equal(rows.length, 1);
  const row = JSON.parse(rows[0]);
  assert.equal(row.event, "序列化失败也要有记录");
  assert.equal(row.detail, "[无法序列化]");
});

test("并发写不丢行（50 条并发日志一行不少）", async () => {
  const dir = await freshDir("concurrent");
  restoreEnv();
  process.env.DATA_DIR = dir;
  const cap = captureConsole();
  try {
    await Promise.all(Array.from({ length: 50 }, (_, i) => L.logServer("info", `并发 ${i}`, { i })));
  } finally {
    cap.restore();
  }
  const rows = await readToday(dir);
  assert.equal(rows.length, 50, "并发 logServer 不能丢行");
  assert.equal(new Set(rows).size, 50, "每行都应各不相同");
});

test("logServer 绝不抛出：DATA_DIR 指向没法写的地方也照常 resolve", async () => {
  const cap = captureConsole();
  try {
    process.env.DATA_DIR = "/dev/null/不可能的子目录";
    await L.logServer("error", "写盘一定失败", {});
    assert.equal(cap.lines.length, 1, "写盘失败但 stdout 仍要有");
  } finally {
    cap.restore();
    restoreEnv();
  }
});

test("DATA_DIR 未设置：只打 stdout，不写文件", async () => {
  const cap = captureConsole();
  try {
    setEnv("DATA_DIR", undefined);
    await L.logServer("info", "没有数据目录", {});
    assert.equal(cap.lines.length, 1);
  } finally {
    cap.restore();
    restoreEnv();
  }
});

test("首次写入顺手清理过期日志：删过期文件，保留 update.log / 非法名 / 窗口内文件", async () => {
  const dir = await freshDir("prune");
  const logs = join(dir, "logs");
  await mkdir(logs, { recursive: true });
  const expired1 = `${shiftDay(-100)}.log`;
  const expired2 = `${shiftDay(-15)}.log`;
  const keptInside = `${shiftDay(-13)}.log`;
  const keptBoundary = `${shiftDay(-1)}.log`;
  const keepers = [keptInside, keptBoundary, "update.log", "notes.txt", `${shiftDay(0)}.log.1`, "2026-9-1.log"];
  await writeFile(join(logs, expired1), "旧日志\n", "utf8");
  await writeFile(join(logs, expired2), "旧日志\n", "utf8");
  for (const f of keepers) await writeFile(join(logs, f), "留\n", "utf8");

  restoreEnv();
  process.env.DATA_DIR = dir;
  setEnv("LOG_KEEP_DAYS", "14");
  const cap = captureConsole();
  try {
    await L.logServer("info", "触发首次写入清理", {});
  } finally {
    cap.restore();
  }
  const left = await readdir(logs);
  assert.equal(left.includes(expired1), false, `${expired1} 超过 14 天应被清理`);
  assert.equal(left.includes(expired2), false, `${expired2} 超过 14 天应被清理`);
  assert.equal(left.includes("update.log"), true, "update.log 绝不能被删");
  for (const k of keepers) assert.equal(left.includes(k), true, `${k} 不该被删`);
  assert.equal(left.includes(`${shiftDay(0)}.log`), true, "当天日志已写入");
  restoreEnv();
});

test("LOG_KEEP_DAYS=3：窗口最后一天保留，再早一天删除（边界按保留期走）", async () => {
  const dir = await freshDir("prune3");
  const logs = join(dir, "logs");
  await mkdir(logs, { recursive: true });
  const boundary = `${shiftDay(-2)}.log`;
  const gone = `${shiftDay(-3)}.log`;
  await writeFile(join(logs, boundary), "恰好第 3 天，保留\n", "utf8");
  await writeFile(join(logs, gone), "第 4 天，删除\n", "utf8");

  restoreEnv();
  process.env.DATA_DIR = dir;
  setEnv("LOG_KEEP_DAYS", "3");
  const cap = captureConsole();
  try {
    await L.logServer("info", "按 3 天保留", {});
  } finally {
    cap.restore();
  }
  const left = await readdir(logs);
  assert.equal(left.includes(boundary), true, "keepDays=3 时今天-2 天仍在窗口内");
  assert.equal(left.includes(gone), false, "keepDays=3 时今天-3 天已过期");
  restoreEnv();
});

test("LOG_KEEP_DAYS 非法值走默认：30 天前的日志在默认 14 天下会被清", async () => {
  const dir = await freshDir("prune-bad-keep");
  const logs = join(dir, "logs");
  await mkdir(logs, { recursive: true });
  const expired = `${shiftDay(-30)}.log`;
  await writeFile(join(logs, expired), "旧\n", "utf8");

  restoreEnv();
  process.env.DATA_DIR = dir;
  setEnv("LOG_KEEP_DAYS", "abc");
  const cap = captureConsole();
  try {
    await L.logServer("info", "非法保留天数", {});
  } finally {
    cap.restore();
  }
  assert.equal((await readdir(logs)).includes(expired), false);
  restoreEnv();
});

test("单文件上限：超过 LOG_MAX_MB 就停写当天文件，并只提示一次", async () => {
  const dir = await freshDir("cap");
  restoreEnv();
  process.env.DATA_DIR = dir;
  setEnv("LOG_MAX_MB", "0.0005"); // 524 字节
  const cap = captureConsole();
  try {
    for (let i = 0; i < 30; i++) {
      await L.logServer("warn", `填充第 ${i} 行`, { pad: "x".repeat(200) });
    }
  } finally {
    cap.restore();
  }
  const rows = await readToday(dir);
  assert.ok(rows.length >= 1, "上限内至少要先写进去一条");
  assert.ok(rows.length < 30, `超过上限后必须停止写当天文件（实际写了 ${rows.length} 行）`);
  const hinted = cap.lines.filter((l) => l.includes("当天日志已达上限"));
  assert.equal(hinted.length, 1, "上限提示只打一条，别刷屏");
  assert.match(hinted[0], /"level":"warn"/);
  const size = Buffer.byteLength(rows.join("\n"), "utf8");
  assert.ok(size <= 524, `文件不该超过上限（实际 ${size} 字节）`);

  // 恢复默认上限后不再受这个目录的历史状态影响（新目录 → 重新探测）
  restoreEnv();
  const dir2 = await freshDir("cap-after");
  process.env.DATA_DIR = dir2;
  restoreEnv();
  process.env.DATA_DIR = dir2;
  const cap2 = captureConsole();
  try {
    await L.logServer("info", "默认上限下正常写", {});
  } finally {
    cap2.restore();
  }
  assert.equal((await readToday(dir2)).length, 1);
  restoreEnv();
});

test("await logServer 之后文件一定已落盘（调用方不用猜时序）", async () => {
  const dir = await freshDir("await");
  restoreEnv();
  process.env.DATA_DIR = dir;
  const cap = captureConsole();
  try {
    const p = L.logServer("error", "等我就是写完了", {});
    await p;
    const file = join(dir, "logs", `${shiftDay(0)}.log`);
    const text = await readFile(file, "utf8");
    assert.match(text, /等我就是写完了/);
  } finally {
    cap.restore();
    restoreEnv();
  }
});

test("保留策略不会把当天正在写的日志删掉（清理前后当天文件都在）", async () => {
  const dir = await freshDir("keep-today");
  restoreEnv();
  process.env.DATA_DIR = dir;
  const cap = captureConsole();
  try {
    await L.logServer("info", "第一行", {});
    await mkdir(join(dir, "logs"), { recursive: true });
    await L.logServer("info", "第二行", {});
  } finally {
    cap.restore();
  }
  const rows = await readToday(dir);
  assert.equal(rows.length, 2);
  assert.match(rows[0], /第一行/);
  assert.match(rows[1], /第二行/);
  restoreEnv();
});

test("保留期计算用的是 UTC 日期：跨本地时区也不会把当天算错", () => {
  const now = new Date("2026-01-01T00:30:00.000Z"); // 本地可能是 2025-12-31
  assert.equal(L.logRetentionCutoff(now, 1), "2026-01-01");
  assert.equal(L.isExpiredLogFile("2025-12-31.log", now, 1), true);
  assert.equal(L.isExpiredLogFile("2026-01-01.log", now, 1), false);
});

test("保留天数上限 10 年：环境变量写成 999999 也只删 10 年以外的", () => {
  const now = new Date("2026-09-16T00:00:00.000Z");
  const keep = L.parseKeepDays("999999");
  assert.equal(keep, 3650);
  assert.equal(L.logRetentionCutoff(now, keep), "2016-09-19");
  assert.equal(L.isExpiredLogFile("2016-09-19.log", now, keep), false, "窗口第一天仍在");
  assert.equal(L.isExpiredLogFile("2016-09-18.log", now, keep), true);
});

test("级别/保留/上限三个开关都随调用读取环境变量（运行中改也生效）", async () => {
  const dir = await freshDir("live-env");
  restoreEnv();
  process.env.DATA_DIR = dir;
  const cap = captureConsole();
  try {
    setEnv("LOG_LEVEL", "error");
    await L.logServer("info", "被静音", {});
    assert.equal(cap.lines.length, 0);
    setEnv("LOG_LEVEL", "debug");
    await L.logServer("info", "放开后就能写", {});
    assert.equal(cap.lines.length, 1);
    assert.equal(existsSync(join(dir, "logs", `${shiftDay(0)}.log`)), true);
  } finally {
    cap.restore();
    restoreEnv();
  }
});

test("logServer 返回 Promise（兼容旧调用：不 await 也不会抛出未处理拒绝）", () => {
  const dir = ROOT;
  process.env.DATA_DIR = dir;
  const cap = captureConsole();
  try {
    const p = L.logServer("info", "不 await 也不会炸", {});
    assert.equal(typeof p.then, "function");
    void p.catch(() => {});
  } finally {
    cap.restore();
    restoreEnv();
  }
});

test("纯函数不会被脏输入带崩（字符串/数字/怪对象都安全）", () => {
  const now = new Date();
  assert.equal(L.isManagedLogFile({} as unknown), false);
  assert.equal(L.isExpiredLogFile(["2026-01-01.log"] as unknown, now, 14), false);
  assert.equal(L.selectExpiredLogs([], now, 14).length, 0);
  assert.equal(L.needsDailyCleanup("", ""), false);
  assert.equal(L.parseKeepDays({} as unknown), 14);
  assert.equal(L.parseMaxMb([] as unknown), 8);
  assert.equal(L.parseLogLevel(["info"] as unknown), "info");
  assert.equal(L.shouldLog({} as unknown, "info"), false);
});
