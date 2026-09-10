/**
 * 服务端台账读写测试（B1 读路径不写盘 / D2 坏文件不当空库 / CAS 版本号口径）。
 *
 * 用真实模块 + 临时 DATA_DIR 跑，不是重写逻辑：这些是数据安全的最后一道闸。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { LedgerState } from "../src/lib/types";

const root = await mkdtemp(join(tmpdir(), "gongdi-ledger-test-"));
process.env.DATA_DIR = root;

const F = await import("../src/lib/nas-fs.server");

const bookDir = join(root, "books", "default");
const ledgerFile = join(bookDir, "ledger.json");
const contractScanDir = join(root, "photos", "合同扫描件");

/** 测试只关心个别字段，这里统一放宽类型 */
const partial = (v: Record<string, unknown>): Partial<LedgerState> => v as unknown as Partial<LedgerState>;

async function writeLedgerFile(value: unknown): Promise<void> {
  await mkdir(bookDir, { recursive: true });
  await writeFile(ledgerFile, typeof value === "string" ? value : JSON.stringify(value, null, 2), "utf8");
}

test("空台账：版本哨兵为 \"\"，第一笔写入成功（1.7.1 修的 409 回归）", async () => {
  const data = await F.readLedger();
  assert.equal(data.empty, true);
  assert.equal(F.ledgerRevisionValue(data), "");
  assert.equal(await F.writeLedger(partial({ people: [{ id: "p1", name: "张三" }] }), ""), "ok");
  const after = await F.readLedger();
  assert.equal((after.people as { name: string }[])[0]?.name, "张三");
});

test("CAS：用旧版本号写入被拒，用当前版本号成功", async () => {
  const rev = F.ledgerRevisionValue(await F.readLedger());
  assert.equal(await F.writeLedger(partial({ people: [] }), rev), "ok");
  assert.equal(await F.writeLedger(partial({ people: [] }), rev), "conflict", "旧版本号必须冲突");
  assert.notEqual(F.ledgerRevisionValue(await F.readLedger()), rev);
});

test("B1：读台账不会回写文件（合同扫描件补名只存在于内存视图）", async () => {
  await writeLedgerFile({ contracts: [{ id: "c1", name: "示例住宅A区", scanFileName: "" }], people: [] });
  await mkdir(contractScanDir, { recursive: true });
  await writeFile(join(contractScanDir, "示例住宅A区-合同电子版.pdf"), "PDF", "utf8");

  const before = await readFile(ledgerFile, "utf8");
  const mtimeBefore = (await stat(ledgerFile)).mtimeMs;

  const data = await F.readLedger();
  assert.equal(
    (data.contracts as { scanFileName?: string }[])[0]?.scanFileName,
    "示例住宅A区-合同电子版.pdf",
    "视图里应补上扫描件名（界面靠它显示「有合同」）",
  );

  assert.equal(await readFile(ledgerFile, "utf8"), before, "读路径不允许改文件——回写会绕过写队列和 CAS");
  assert.equal((await stat(ledgerFile)).mtimeMs, mtimeBefore);
});

test("D2：损坏的台账文件判为 unreadable，不当空台账、不给可用版本号", async () => {
  await writeLedgerFile("{ 这不是合法 JSON");
  const data = await F.readLedger();
  assert.equal(F.ledgerUnreadable(data), true);
  assert.equal(data.empty, undefined, "损坏 ≠ 空：被当成空台账就会被客户端覆盖");
  assert.equal(await F.ledgerRevision(), "unreadable");
});

test("D2：损坏时拒绝写入，文件保持原样（给人工恢复留机会）", async () => {
  const broken = "{ 这不是合法 JSON";
  assert.equal(await F.writeLedger(partial({ people: [{ id: "p9", name: "不该写进去" }] }), "unreadable"), "unreadable");
  assert.equal(await readFile(ledgerFile, "utf8"), broken);
});

test("D2：文件修好后恢复正常读写", async () => {
  await writeLedgerFile({ people: [], attendance: [] });
  const data = await F.readLedger();
  assert.equal(F.ledgerUnreadable(data), false);
  assert.equal(await F.writeLedger(partial({ people: [{ id: "p1", name: "张三" }] })), "ok");
});

test("文件不存在 ≠ 损坏（全新安装仍能建台账）", async () => {
  const prev = process.env.DATA_DIR;
  process.env.DATA_DIR = await mkdtemp(join(tmpdir(), "gongdi-empty-"));
  try {
    const data = await F.readLedger();
    assert.equal(data.empty, true);
    assert.equal(F.ledgerUnreadable(data), false);
    assert.equal(F.ledgerRevisionValue(data), "");
  } finally {
    process.env.DATA_DIR = prev;
  }
});
