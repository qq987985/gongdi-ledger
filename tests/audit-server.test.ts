/**
 * 操作记录（审计）服务端测试 —— 1.7.2 修复的核心：
 *
 * 1) 并发写不能丢记录。旧实现用固定临时名 `${target}.tmp` 且读—改—写不排队，
 *    两次并发写会互相搬走对方写了一半的临时文件 → rename 抛 ENOENT → 记录丢失，
 *    客户端又把失败静默吞掉，界面表现就是「操作没被记录」。
 * 2) 老版本放在 data/audit.json（不分台账）的记录仍要能看到，并在下次写入时并入。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = await mkdtemp(join(tmpdir(), "gongdi-audit-test-"));
process.env.DATA_DIR = root;

const F = await import("../src/lib/nas-fs.server");

test("并发写操作记录不丢：25 条全部落盘", async () => {
  await F.writeAudit([]);
  await Promise.all(Array.from({ length: 25 }, (_, i) => F.appendAudit({ action: `并发${i}`, module: "压测" })));
  const list = await F.readAudit();
  assert.equal(list.length, 25, "并发 appendAudit 不能丢记录（1.7.1 会丢）");
  assert.equal(new Set(list.map((e) => e.action)).size, 25, "25 条应各不相同");
});

test("写入失败不再写坏文件：临时文件用随机名，且不留残渣", async () => {
  await F.writeAudit([{ id: "a1", at: "2026-01-01T00:00:00.000Z", userId: "u", userName: "管理员", action: "测试", detail: "", module: "测试" }]);
  const entries = await F.readAudit();
  assert.equal(entries.length, 1);
  const dir = await import("node:fs/promises").then((m) => m.readdir(join(root, "books", "default")));
  assert.equal(
    dir.some((f) => f.includes(".tmp")),
    false,
    "不能留下 .tmp 残渣",
  );
});

test("旧位置 data/audit.json 的记录能读回来，并随下一次写入并入", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gongdi-audit-legacy-"));
  const prev = process.env.DATA_DIR;
  process.env.DATA_DIR = dir;
  try {
    await writeFile(
      join(dir, "audit.json"),
      JSON.stringify([
        { id: "old1", at: "2026-01-01T00:00:00.000Z", userId: "u", userName: "管理员", action: "登录", detail: "", module: "账户" },
        { id: "old2", at: "2026-01-02T00:00:00.000Z", userId: "u", userName: "管理员", action: "新增人员", detail: "张三", module: "人员" },
      ]),
      "utf8",
    );
    const rows = await F.readAudit();
    assert.equal(rows.length, 2, "旧位置的记录必须还能看到（否则用户会以为记录丢了）");

    await F.appendAudit({ action: "新增人员", module: "人员" });
    const after = await F.readAudit();
    assert.equal(after.length, 3, "旧记录要一并保留");
    assert.equal(after.some((e) => e.id === "old1"), true);
    await mkdir(join(dir, "books", "default"), { recursive: true });
  } finally {
    process.env.DATA_DIR = prev;
  }
});

test("空文件/坏文件不影响后续写入（读失败不抛给调用方）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gongdi-audit-bad-"));
  const prev = process.env.DATA_DIR;
  process.env.DATA_DIR = dir;
  try {
    await mkdir(join(dir, "books", "default"), { recursive: true });
    await writeFile(join(dir, "books", "default", "audit.json"), "{ 坏文件", "utf8");
    const rows = await F.readAudit();
    assert.deepEqual(rows, []);
    // 坏文件时写不进去也不能崩：appendAudit 应正常返回条目
    const entry = await F.appendAudit({ action: "写入测试", module: "测试" });
    assert.equal(entry.action, "写入测试");
  } finally {
    process.env.DATA_DIR = prev;
  }
});
