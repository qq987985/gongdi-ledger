import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bookAssetsRoot, bookRoot, ensureDirs, runWithBook, safeBookId } from "../src/lib/paths.server";

test("并发首次初始化：每个调用返回时台账和影像目录都已就绪", async () => {
  const root = await mkdtemp(join(tmpdir(), "ledger-init-concurrent-"));
  process.env.DATA_DIR = root;
  delete process.env.PHOTO_DIR;
  try {
    await runWithBook("first", async () => {
      const results = await Promise.allSettled(Array.from({ length: 12 }, async () => {
        await ensureDirs();
        assert.ok((await stat(bookRoot())).isDirectory());
        assert.ok((await stat(join(bookAssetsRoot(), "合同扫描件"))).isDirectory());
      }));
      assert.deepEqual(results.filter((r) => r.status === "rejected"), []);
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("目录初始化失败后，排除故障可以重试", async () => {
  const root = await mkdtemp(join(tmpdir(), "ledger-init-retry-"));
  process.env.DATA_DIR = root;
  delete process.env.PHOTO_DIR;
  try {
    await writeFile(join(root, "books"), "阻挡目录创建");
    await runWithBook("retry", async () => {
      await assert.rejects(ensureDirs());
      await rm(join(root, "books"));
      await ensureDirs();
      assert.ok((await stat(bookRoot())).isDirectory());
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("同一台账更换 PHOTO_DIR，新的影像目录也必须初始化", async () => {
  const root = await mkdtemp(join(tmpdir(), "ledger-init-photos-"));
  process.env.DATA_DIR = root;
  delete process.env.PHOTO_DIR;
  try {
    await runWithBook("photos", async () => {
      await ensureDirs();
      process.env.PHOTO_DIR = join(root, "other-photos");
      await ensureDirs();
      assert.ok((await stat(join(bookAssetsRoot(), "id"))).isDirectory());
    });
  } finally {
    delete process.env.PHOTO_DIR;
    await rm(root, { recursive: true, force: true });
  }
});

test("台账路径：拒绝点目录、父目录和控制字符，合法旧 id 保持兼容", () => {
  for (const id of [".", "..", " ../ ", "..\\", "a\0b"]) {
    assert.throws(() => safeBookId(id), /台账编号/);
    assert.throws(() => runWithBook(id, () => assert.fail("不能进入非法台账上下文")));
  }
  assert.equal(safeBookId("default"), "default");
  assert.equal(safeBookId("工程-2026.09"), "工程-2026.09");
  assert.equal(safeBookId(""), "default");
});
