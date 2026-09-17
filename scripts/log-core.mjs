/**
 * 服务端日志核心 —— **唯一实现**（1.8.14 起）。
 *
 * 为什么抽这一份：日志原来有两套实现 —— 应用进程走 `src/lib/log.server.ts`（1.8.4 起超限**滚动**
 * `YYYY-MM-DD.log.N`），生产启动器 `scripts/app-server-index.mjs` 自己复刻了一份（超限**停写**当天文件，
 * 且认不出 `.log.N`、不参与保留策略）。于是「撞上限后当天还剩什么」取决于谁先撞：
 * 启动器那条路（5xx / 慢请求 / 请求体被拒 / 服务启动）到 8MB 后当天不再留证 ——
 * 与 `AGENTS.md`、`开发规范.md` §337、使用说明书写的「1.8.4 起不再停写」直接冲突。
 *
 * 现在两处共用本文件：启动器 `import { … } from "./log-core.mjs"`（构建时由
 * `scripts/copy-output.mjs` 一并复制成 `app/server/log-core.mjs`），应用侧 `src/lib/log.server.ts`
 * 只做一层「读 DATA_DIR / 串行化 / 打 stdout」的薄封装。**禁止再各写一套级别/上限/滚动/保留逻辑。**
 *
 * 语义（与 1.8.4 定的口径一致，不要改）：
 * - 级别：`LOG_LEVEL=debug|info|warn|error`（默认 info），低于该级别的事件既不写文件也不打 stdout；
 * - 保留：`LOG_KEEP_DAYS`（默认 14）只删 `YYYY-MM-DD.log` 与滚动件 `YYYY-MM-DD.log.N`，**绝不删 `update.log`**；
 * - 上限：`LOG_MAX_MB`（默认 8）超了就**滚动**到 `YYYY-MM-DD.log.N`（编号取最大+1），不停写；
 * - 慢请求门槛：`SLOW_MS`（默认 2000，**必须为正数** —— 未设置时解析成 0 会让每个请求都记一条「慢请求」）；
 * - 清理不在每次写的热路径上扫目录：每进程首次写（等价「启动时一次」）+ 每天首次写各一次。
 *
 * 本文件是**零依赖纯 JS**（只 import node: 内置模块），因为启动器在 Docker 里只带 `app/`，
 * 不能 import `src/` 下的 TypeScript。类型声明见 `scripts/log-core.d.mts`。
 */
import { appendFile, mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import { join } from "node:path";

/** 级别由低到高。LOG_LEVEL 取其中一档，低于它的事件整体丢弃。 */
export const LOG_LEVELS = ["debug", "info", "warn", "error"];

export const DEFAULT_LOG_LEVEL = "info";
export const DEFAULT_LOG_KEEP_DAYS = 14;
export const DEFAULT_LOG_MAX_MB = 8;
/** 慢请求门槛默认值（毫秒）—— FAQ「超过 2 秒的慢请求会记进日志」说的就是它。 */
export const DEFAULT_SLOW_MS = 2000;

/**
 * 受管日志文件名：`YYYY-MM-DD.log` 与滚动出来的 `YYYY-MM-DD.log.N`（1.8.4 起）。
 * `update.log`、`x.log.1`（日期段不是日期）、`2026-9-1.log` 都不算。
 */
const DATED_LOG_RE = /^\d{4}-\d{2}-\d{2}\.log(\.\d+)?$/;
/** 永不删除的日志文件（更新日志是用户排查「一键更新失败」的入口，不能被保留策略清掉）。 */
export const PROTECTED_LOG_FILES = ["update.log"];

/** 保留天数上限 / 单文件上限（MB），防止环境变量写错把 NAS 撑爆或删空。 */
const MAX_KEEP_DAYS = 3650;
const MAX_LOG_MB = 10240;
/** 滚动编号上限：一天的日志滚动到 999 份已经远超任何正常场景，封顶防病态目录拖慢扫描。 */
const MAX_ROTATION_INDEX = 999;

// ───────────────────────────── 纯函数（可单测） ─────────────────────────────

/** 级别解析：大小写/空白容忍，非法值（含 undefined、空串、乱写）回落到默认 `info`。 */
export function parseLogLevel(raw) {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return LOG_LEVELS.includes(v) ? v : DEFAULT_LOG_LEVEL;
}

function levelRank(raw) {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return LOG_LEVELS.indexOf(v);
}

/**
 * 该不该记：`level` 低于 `min` 一律丢弃。
 * - 未知的 `level` → false（不认识的事件宁可不记，也不猜级别）；
 * - 未知的 `min` → 按默认 `info` 处理（环境变量写错不该让日志全静音）。
 */
export function shouldLog(level, min = DEFAULT_LOG_LEVEL) {
  const l = levelRank(level);
  if (l < 0) return false;
  const m = levelRank(min);
  return l >= (m < 0 ? levelRank(DEFAULT_LOG_LEVEL) : m);
}

function parsePositiveNumber(raw, fallback, max) {
  const n = typeof raw === "number" ? raw : Number(String(raw == null ? "" : raw).trim());
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

/** LOG_KEEP_DAYS 解析：非法（空/非数字/0/负数/NaN/Infinity）走默认 14；小于 1 的小数也走默认。 */
export function parseKeepDays(raw) {
  const n = Math.floor(parsePositiveNumber(raw, DEFAULT_LOG_KEEP_DAYS, MAX_KEEP_DAYS));
  return n >= 1 ? n : DEFAULT_LOG_KEEP_DAYS;
}

/** LOG_MAX_MB 解析：非法走默认 8；允许小数（测试里用 0.0005 造「小文件」）。 */
export function parseMaxMb(raw) {
  return parsePositiveNumber(raw, DEFAULT_LOG_MAX_MB, MAX_LOG_MB);
}

/**
 * SLOW_MS 解析：非法走默认 2000，**且必须是正数**。
 *
 * 1.8.13 及之前这里写的是 `n >= 0`，而 `Number("") === 0` —— 也就是「没设 SLOW_MS」时门槛变成 0，
 * 于是**每个请求**（含静态资源）都写一条 `慢请求` warn：日志被请求流水灌满、每请求多一次写盘，
 * 真正要看的 5xx/真慢请求被淹没（现场实测 46ms 的 /api/health 也记 warn，文档写的是 2000ms）。
 */
export function parseSlowMs(raw) {
  const n = typeof raw === "number" ? raw : Number(String(raw == null ? "" : raw).trim());
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_SLOW_MS;
}

export function dayString(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * 保留窗口的第一天（含）：`now` 当天算第 1 天，回退 keepDays-1 天。
 * 也就是 keepDays=14 表示「今天 + 往前 13 天」共 14 个文件；比这更早的日期日志算过期。
 * 正好落在 cutoff 当天的文件**保留**（边界：当天是窗口内的第 N 天）。
 */
export function logRetentionCutoff(now, keepDays = DEFAULT_LOG_KEEP_DAYS) {
  const days = Number.isFinite(keepDays) && Math.floor(keepDays) >= 1 ? Math.floor(keepDays) : DEFAULT_LOG_KEEP_DAYS;
  const base = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return dayString(d);
}

/** 是不是「受管的日期日志文件」：`YYYY-MM-DD.log` 或滚动件 `.log.N`，且不在保护名单里（update.log）。 */
export function isManagedLogFile(name) {
  if (typeof name !== "string") return false;
  if (PROTECTED_LOG_FILES.includes(name)) return false;
  return DATED_LOG_RE.test(name);
}

/**
 * 是否过期（可删）：文件名合规 + 日期早于保留窗口第一天。
 * 认不出日期的名字（如 `9999-99-99.log`）一律**不删**——宁可留一个怪文件，也不误删。
 */
export function isExpiredLogFile(name, now, keepDays = DEFAULT_LOG_KEEP_DAYS) {
  if (!isManagedLogFile(name)) return false;
  const day = String(name).slice(0, 10);
  if (!Number.isFinite(Date.parse(`${day}T00:00:00.000Z`))) return false;
  // ISO 日期串的字典序 === 时间序
  return day < logRetentionCutoff(now, keepDays);
}

/** 从目录里的文件名列表中挑出该删的（纯函数，不碰文件系统）。 */
export function selectExpiredLogs(names, now, keepDays = DEFAULT_LOG_KEEP_DAYS) {
  return names.filter((n) => isExpiredLogFile(n, now, keepDays));
}

/** 是否需要跑一次清理：进程启动后的第一次写入（lastCleanupDay=null），或跨天后的第一次写入。 */
export function needsDailyCleanup(lastCleanupDay, today) {
  return lastCleanupDay !== today;
}

/**
 * 滚动目标文件名（纯函数）：`YYYY-MM-DD.log` → `YYYY-MM-DD.log.<下一个空闲编号>`。
 *
 * 编号规则：取目录里**已有的最大编号 + 1**（第一次滚动就是 `.1`；已有 `.1` 就写 `.2`，依次递增）。
 * 不搬移已有文件 —— 把 `.1` 改名成 `.2` 的链式搬移在一次崩溃后就可能丢文件，
 * 而「编号越大越新」对排查日志的人一样直观。
 */
export function nextRotationName(day, existingNames) {
  const base = `${day}.log`;
  let max = 0;
  for (const n of existingNames || []) {
    if (typeof n !== "string") continue;
    const m = /^(\d{4}-\d{2}-\d{2})\.log\.(\d+)$/.exec(n);
    if (!m || m[1] !== day) continue;
    const idx = Number.parseInt(m[2], 10);
    if (Number.isFinite(idx) && idx > max) max = idx;
  }
  return `${base}.${Math.min(max + 1, MAX_ROTATION_INDEX)}`;
}

/** 单天单文件上限（字节）。 */
export function logMaxBytes(env = process.env) {
  return Math.floor(parseMaxMb(env.LOG_MAX_MB) * 1024 * 1024);
}

/** 一行日志的文本（含时间戳）；detail 不可序列化（循环引用）时降级标注，绝不抛出。 */
export function formatLogLine(level, event, detail = {}, now = new Date()) {
  try {
    return JSON.stringify({ at: now.toISOString(), level, event, ...detail });
  } catch {
    return JSON.stringify({ at: now.toISOString(), level, event, detail: "[无法序列化]" });
  }
}

/** stdout 出口：应用与启动器同一套（docker logs 能收）。stdout 不可用也不影响业务。 */
export function stdoutLog(level, line) {
  try {
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else if (level === "debug") console.debug(line);
    else console.log(line);
  } catch {
    /* stdout 不可用也不影响 */
  }
}

// ───────────────────────────── 落盘实现（非纯） ─────────────────────────────

/** 每个「目录 + 当天」一份状态：避免每次写都 stat、每次写都扫目录。 */
let state = { dir: "", day: "", bytes: -1, lastCleanupDay: null };

function stateFor(dir, today) {
  if (state.dir !== dir || state.day !== today) {
    // 换目录（等价「进程启动」）或跨天：重置缓存，顺带让首次写入触发一次清理
    state = { dir, day: today, bytes: -1, lastCleanupDay: null };
  }
  return state;
}

let queue = Promise.resolve();

/** 删掉过期的 `YYYY-MM-DD.log` 与滚动件。只删文件（目录/软链不算），单个失败不影响其它。 */
export async function pruneOldLogs(dir, env = process.env, now = new Date()) {
  const keep = parseKeepDays(env.LOG_KEEP_DAYS);
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const names = entries.filter((e) => e.isFile()).map((e) => e.name);
    for (const name of selectExpiredLogs(names, now, keep)) {
      try {
        await unlink(join(dir, name));
      } catch {
        /* 被别的进程删了 / 权限不足：跳过 */
      }
    }
  } catch {
    /* 目录还不存在或读不到：忽略 */
  }
}

/**
 * 一次落盘：跨天/换目录重置、首次写入触发清理、达上限**滚动**（不停写）。
 * 并发写请走 `enqueueLogLine`（进程内串行，避免交错）。
 */
export async function writeLogLine(dir, line, opts = {}) {
  const env = opts.env || process.env;
  const now = opts.now instanceof Date ? opts.now : new Date();
  const today = dayString(now);
  const st = stateFor(dir, today);
  // 清理只在这里触发（O(1) 判断），不在每次写的热路径上扫目录
  if (needsDailyCleanup(st.lastCleanupDay, today)) {
    st.lastCleanupDay = today;
    await pruneOldLogs(dir, env, now);
  }
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${today}.log`);
  const size = Buffer.byteLength(line, "utf8") + 1;
  const max = logMaxBytes(env);
  if (st.bytes < 0) {
    try {
      st.bytes = (await stat(file)).size;
    } catch {
      st.bytes = 0;
    }
  }
  // 达到上限 → 滚动到 `.log.N`（1.8.4）。`st.bytes > 0` 保证「单行就超过上限」时不会无限滚动。
  if (st.bytes > 0 && st.bytes + size > max) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      const names = entries.filter((e) => e.isFile()).map((e) => e.name);
      const target = join(dir, nextRotationName(today, names));
      await rename(file, target);
      st.bytes = 0;
      // 这条提示是保险丝，不随 LOG_LEVEL 静音（否则文件被滚动时一点痕迹都没有）
      stdoutLog(
        "warn",
        JSON.stringify({
          at: now.toISOString(),
          level: "warn",
          event: "当天日志已达上限，已滚动到下一份",
          file: target,
          maxMb: parseMaxMb(env.LOG_MAX_MB),
        }),
      );
    } catch {
      // 滚动失败（权限/被占用）：退回「停写」而不是抛错 —— 日志不能拖垮业务
      stdoutLog(
        "warn",
        JSON.stringify({ at: now.toISOString(), level: "warn", event: "日志滚动失败，本次不写文件", file }),
      );
      return;
    }
  }
  await appendFile(file, `${line}\n`, "utf8");
  st.bytes += size;
}

/** 进程内串行写：并发写不能丢行、也不能交错。绝不抛出。 */
export function enqueueLogLine(dir, line, opts = {}) {
  queue = queue.then(
    () => writeLogLine(dir, line, opts).catch(() => {}),
    () => {},
  );
  return queue;
}

/**
 * 等在飞的日志写盘完成（退出前调用）。
 *
 * 为什么要它：落盘是异步的（不挡请求），进程直接退出就会丢掉最后几条 ——
 * 而「退出前那几条」往往是 5xx / 未捕获异常这类最需要留下的。Dockerfile 里 `exec node …`
 * 让 PID 1 是 node（SIGTERM 能到应用），启动器收到信号时用它把队列排干再 exit。
 */
export function flushLogs() {
  return queue.catch(() => {});
}
