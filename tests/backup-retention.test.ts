/**
 * 备份保留策略（1.8.7，对应 A 组逐项测试报告第 46 项）。
 *
 * 复现到的缺陷：`data/backups/` 只增不减 —— 日志有 `LOG_KEEP_DAYS`、操作记录有 2 万条上限，
 * 备份什么策略都没有（实测：预置 35 份 + 备份一次 → 37 → 38 个文件，永不清理），
 * 长期运行会把数据盘写满，而「最新备份」固定名 `考勤表.xlsx` 每次都被覆盖、历史只剩最近若干份才合理。
 *
 * 现在的规则：带时间戳的备份最多留最近 N 份（默认 30，`BACKUP_KEEP` 可覆盖 1–1000）；
 * 固定名「考勤表.xlsx」永不删；**只删自己生成的名字形状**，用户手放进 backups 的文件一个不动。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = await mkdtemp(join(tmpdir(), "gongdi-backup-keep-"));
process.env.DATA_DIR = root;

const nas = await import("../src/lib/nas-fs.server");

const BACKUPS = join(root, "backups");
const stamp = (i: number) => `20260101_0000${String(i).padStart(2, "0")}_考勤表.xlsx`;

/** 造 n 份「程序自己生成的」时间戳备份（内容带序号，方便验证留下来的就是最新的那批） */
async function seed(n: number): Promise<void> {
  await rm(BACKUPS, { recursive: true, force: true });
  await nas.saveBackup(Buffer.from("seed-fixed"), "考勤表.xlsx");
  for (let i = 1; i <= n; i++) await writeFile(join(BACKUPS, stamp(i)), `backup-${i}`, "utf8");
}

test("backupKeepCount：默认 30，BACKUP_KEEP 可覆盖，非法值回落、封顶 1000", () => {
  delete process.env.BACKUP_KEEP;
  assert.equal(nas.backupKeepCount(), 30);
  assert.equal(nas.DEFAULT_BACKUP_KEEP, 30);
  process.env.BACKUP_KEEP = "5";
  assert.equal(nas.backupKeepCount(), 5);
  process.env.BACKUP_KEEP = "0";
  assert.equal(nas.backupKeepCount(), 30, "0 不合法，回落默认");
  process.env.BACKUP_KEEP = "abc";
  assert.equal(nas.backupKeepCount(), 30);
  process.env.BACKUP_KEEP = "-3";
  assert.equal(nas.backupKeepCount(), 30);
  process.env.BACKUP_KEEP = "99999";
  assert.equal(nas.backupKeepCount(), 1000, "封顶 1000");
  process.env.BACKUP_KEEP = "3.7";
  assert.equal(nas.backupKeepCount(), 3);
  delete process.env.BACKUP_KEEP;
});

test("isManagedBackupFile：只认自己生成的两种名字，别的一律不动", () => {
  assert.equal(nas.isManagedBackupFile("20260916_205234_考勤表.xlsx"), true);
  assert.equal(nas.isManagedBackupFile("考勤表.xlsx"), true);
  // 用户自己放进 backups 的文件：不是我们生成的名字形状 → 永不删
  assert.equal(nas.isManagedBackupFile("我的对账表.xlsx"), false);
  assert.equal(nas.isManagedBackupFile("20260916_考勤表.xlsx"), false, "缺时分秒，不是我们写的");
  assert.equal(nas.isManagedBackupFile("20260916_205234_别的表.xlsx"), false);
  assert.equal(nas.isManagedBackupFile("20260916_205234_考勤表.xlsx.bak"), false);
  assert.equal(nas.isManagedBackupFile(".."), false);
});

test("pruneBackups：N 份之外的最旧备份被删，最新的 N 份与固定名都在", async () => {
  process.env.BACKUP_KEEP = "5";
  await seed(9);
  const removed = await nas.pruneBackups();
  assert.equal(removed, 4, "9 份保留 5 份 → 删 4 份");
  const left = (await readdir(BACKUPS)).sort();
  assert.deepEqual(left, ["20260101_000005_考勤表.xlsx", "20260101_000006_考勤表.xlsx", "20260101_000007_考勤表.xlsx", "20260101_000008_考勤表.xlsx", "20260101_000009_考勤表.xlsx", "考勤表.xlsx"].sort());
  // 留下的必须是最新的（文件名时间戳字典序）
  assert.equal(await readFile(join(BACKUPS, "20260101_000009_考勤表.xlsx"), "utf8"), "backup-9");
  assert.equal(await readFile(join(BACKUPS, "考勤表.xlsx"), "utf8"), "seed-fixed");
  delete process.env.BACKUP_KEEP;
});

test("pruneBackups：用户自己放进 backups 的文件绝不删", async () => {
  await seed(9);
  await writeFile(join(BACKUPS, "我的对账表.xlsx"), "mine", "utf8");
  process.env.BACKUP_KEEP = "3";
  await nas.pruneBackups();
  const left = (await readdir(BACKUPS)).sort();
  assert.ok(left.includes("我的对账表.xlsx"), "非本程序生成的文件必须原样留着");
  assert.equal(left.filter((f) => /^\d{8}_\d{6}_考勤表\.xlsx$/.test(f)).length, 3);
  delete process.env.BACKUP_KEEP;
});

test("saveBackup：写新备份后自动按 N 份清理（造 N+5 份只剩 N 份 + 固定名）", async () => {
  process.env.BACKUP_KEEP = "4";
  await seed(0); // 只有固定名
  for (let i = 1; i <= 9; i++) await nas.saveBackup(Buffer.from(`new-${i}`), stamp(i));
  const files = (await readdir(BACKUPS)).sort();
  const stamped = files.filter((f) => /^\d{8}_\d{6}_考勤表\.xlsx$/.test(f));
  assert.equal(stamped.length, 4, "写了 9 份，只留 4 份");
  assert.deepEqual(stamped, [stamp(6), stamp(7), stamp(8), stamp(9)], "留下的必须是最新的 4 份");
  assert.ok(files.includes("考勤表.xlsx"), "固定名「最新备份」必须一直在");
  assert.equal(await readFile(join(BACKUPS, "考勤表.xlsx"), "utf8"), "new-9", "固定名永远是最新一份");
  delete process.env.BACKUP_KEEP;
});

test("saveBackup：0 字节仍然拒写（1.8.4 的老约定没被这次改动碰坏）", async () => {
  delete process.env.BACKUP_KEEP;
  await nas.saveBackup(Buffer.from("ok"), "考勤表.xlsx");
  const before = await readFile(join(BACKUPS, "考勤表.xlsx"), "utf8");
  const ret = await nas.saveBackup(Buffer.alloc(0), "20260101_000001_考勤表.xlsx");
  assert.equal(ret, "", "0 字节必须返回空字符串（= 没写）");
  assert.equal(await readFile(join(BACKUPS, "考勤表.xlsx"), "utf8"), before);
});
