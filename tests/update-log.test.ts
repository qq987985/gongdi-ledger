/**
 * 「查看更新日志」的服务端支撑（1.7.7）。
 *
 * 背景：更新失败时日志只落在 NAS 的 data/logs/update.log 与 data/.gongdi-update-error.txt，
 * 用户得开文件管理器一层层点进去才看得到原因，界面只能提示「详情见 data/logs」。
 * 现在把日志读回界面（GET /api/update-log），这几条锁住它的关键性质：
 * 追加不丢行、读不到不报错、只回尾部（别把整份日志刷进响应）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = await mkdtemp(join(tmpdir(), "gongdi-updlog-test-"));
process.env.DATA_DIR = root;

const U = await import("../src/lib/update.server");

const LOG = join(root, "logs", "update.log");
const D = String.fromCharCode(46); // ASCII "."
const H = String.fromCharCode(45); // ASCII "-"
const ERROR_FILE = join(root, D + "gondi" + H + "update" + H + "error" + D + "txt");

test("appendUpdateLog：写进 data/logs/update.log，并带 ISO 时间戳", async () => {
  await U.appendUpdateLog("[应用] 开始更新（Docker）：当前镜像 x:latest");
  const text = await readFile(LOG, "utf8");
  assert.match(text, /^\d{4}-\d{2}-\d{2}T[\d:.]+Z \[应用\] 开始更新（Docker）/);
});

test("appendUpdateLog：并发追加不丢行（日志掉了就没法排查）", async () => {
  await Promise.all(Array.from({ length: 30 }, (_, i) => U.appendUpdateLog(`[压测] 第 ${i} 行`)));
  const lines = (await readFile(LOG, "utf8")).trim().split("\n");
  const hit = lines.filter((l) => l.includes("[压测] 第 "));
  assert.equal(hit.length, 30, "30 条并发日志应一行不少");
  assert.equal(new Set(hit).size, 30, "每行都应各不相同");
});

test("readUpdateLog：读回日志与错误文件；没有错误文件时只回日志", async () => {
  await writeFile(ERROR_FILE, "2026-09-10T00:00:00.000Z\n新容器启动失败，已回滚到原容器\n", "utf8");
  const r = await U.readUpdateLog();
  assert.match(r.errorText, /已回滚到原容器/);
  assert.match(r.log, /\[应用\] 开始更新/);
  assert.equal(r.note, "", "有内容时不该再给「还没有更新记录」的提示");
});

test("readUpdateLog：只回最后 120 行（日志再长也不会把响应刷爆）", async () => {
  const many = Array.from({ length: 300 }, (_, i) => `2026-09-10T00:00:00.000Z [长日志] ${i}`).join("\n");
  await writeFile(LOG, `${many}\n`, "utf8");
  const r = await U.readUpdateLog();
  const lines = r.log.split("\n");
  assert.equal(lines.length, 120, `只回尾部 120 行（实际 ${lines.length}）`);
  assert.match(lines[lines.length - 1], /\[长日志\] 299$/, "回的必须是最后一行");
  assert.equal(r.log.includes("[长日志] 0\n"), false, "最老的行不该出现");
});

test("readUpdateLog：超过 64KB 时按行截断，不回半行（截断点要落在换行处）", async () => {
  const many = Array.from({ length: 3000 }, (_, i) => `2026-09-10T00:00:00.000Z [大日志] ${i} 填充填充填充填充填充填充填充填充`).join("\n");
  await writeFile(LOG, `${many}\n`, "utf8");
  const r = await U.readUpdateLog();
  const lines = r.log.split("\n");
  assert.equal(lines.length, 120);
  assert.match(lines[0], /^\d{4}-\d{2}-\d{2}T[\d:.]+Z \[大日志\] \d+ /, "第一行必须是一行完整日志，不能是被腰斩的半行");
  assert.match(lines[lines.length - 1], /\[大日志\] 2999 /, "最后一行必须是最新的那行");
});

test("readUpdateLog：没有数据目录时给提示、不抛（本机跑没开持久化）", async () => {
  const prev = process.env.DATA_DIR;
  delete process.env.DATA_DIR;
  try {
    const r = await U.readUpdateLog();
    assert.equal(r.log, "");
    assert.match(r.note, /未开启 NAS 持久化/);
    await U.appendUpdateLog("不该写盘也不该抛");
    assert.equal(r.note.includes("未开启"), true);
  } finally {
    process.env.DATA_DIR = prev;
  }
});
