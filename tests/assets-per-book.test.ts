/**
 * A 项：影像按台账隔离 + 历史目录只读回落 + 一次性归入。
 *
 * 背景（原本的漏洞）：数字数据按台账分目录，影像却全放在全局 photos/ 下，
 * 台账 B 的成员能读到、覆盖、删除台账 A 的身份证照与合同扫描件；
 * 删台账也只删 books/{id}，影像残留。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = await mkdtemp(join(tmpdir(), "gongdi-assets-test-"));
process.env.DATA_DIR = root;
delete process.env.PHOTO_DIR;
delete process.env.PHOTO_ID_DIR;

const F = await import("../src/lib/nas-fs.server");

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
const bookAssets = (book: string, sub: string) => join(root, "photos", book, sub);
const legacyId = join(root, "photos", "id");

async function inBook<T>(book: string, fn: () => Promise<T>): Promise<T> {
  return F.runWithBook(book, fn);
}

test("A1：照片写进本台账自己的目录（不再写全局目录）", async () => {
  await inBook("bookA", () => F.savePhoto("张三", "id", PNG));
  assert.equal(existsSync(join(bookAssets("bookA", "id"), "张三-身份证-正面.png")), true);
  assert.equal(existsSync(join(legacyId, "张三-身份证-正面.png")), false, "不能再往全局目录写");
});

test("A1：台账之间互相看不到对方的照片", async () => {
  const inA = await inBook("bookA", () => F.findPhotoPath("张三", "id"));
  assert.ok(inA, "A 台账应能读到自己的照片");
  const inB = await inBook("bookB", () => F.findPhotoPath("张三", "id"));
  assert.equal(inB, null, "B 台账不能读到 A 台账的身份证照（原漏洞）");
});

test("A1：删台账会连自己的影像目录一起删", async () => {
  await inBook("bookB", () => F.savePhoto("李四", "bank", PNG));
  assert.equal(existsSync(bookAssets("bookB", "bank")), true);
  await F.removeBookDir("bookB");
  assert.equal(existsSync(join(root, "photos", "bookB")), false);
});

test("A2：历史全局目录仍能读到（只读回落，老数据不消失）", async () => {
  await mkdir(legacyId, { recursive: true });
  await writeFile(join(legacyId, "王五-身份证-正面.jpg"), "JPG", "utf8");

  const hit = await inBook("bookA", () => F.findPhotoPath("王五", "id"));
  assert.ok(hit, "遗留目录里的老照片必须还能看到");
  assert.equal(hit?.dir, legacyId);
  // 读到了，但没有被复制/写进本台账目录
  assert.equal(existsSync(join(bookAssets("bookA", "id"), "王五-身份证-正面.jpg")), false);
});

test("A2：PHOTO_LEGACY_FALLBACK=off 后不再回落（迁移完成后可彻底关闭）", async () => {
  process.env.PHOTO_LEGACY_FALLBACK = "off";
  try {
    const hit = await inBook("bookA", () => F.findPhotoPath("王五", "id"));
    assert.equal(hit, null);
  } finally {
    process.env.PHOTO_LEGACY_FALLBACK = "on";
  }
});

test("A3：历史影像归入本台账（只复制、不删除、不覆盖）", async () => {
  // 本台账里要有「王五」这个人，才会被归入
  await inBook("bookA", async () => {
    await F.writeLedger({ schemaVersion: 2, year: 2026, years: [2026], people: [{ id: "p1", name: "王五" }] } as never);
  });

  const r = await inBook("bookA", () => F.adoptLegacyAssets());
  assert.equal(r.photos, 1, "应归入 1 张照片");
  const adopted = join(bookAssets("bookA", "id"), "王五-身份证-正面.jpg");
  assert.equal(existsSync(adopted), true, "归入后应在台账目录里");
  assert.equal(existsSync(join(legacyId, "王五-身份证-正面.jpg")), true, "原文件必须保留（可回退）");

  // 再跑一次：已在台账目录里，应原地不动（不覆盖），也不重复计入
  await writeFile(join(legacyId, "王五-身份证-正面.jpg"), "旧内容", "utf8");
  const again = await inBook("bookA", () => F.adoptLegacyAssets());
  assert.equal(again.photos, 0);
  assert.equal(await readFile(adopted, "utf8"), "JPG", "已归入的文件不能被再次覆盖");
});

test("A3：合同扫描件也按合同 id 归入（文档走同一套匹配口径）", async () => {
  const contractDir = join(root, "photos", "合同扫描件");
  await mkdir(contractDir, { recursive: true });
  await writeFile(join(contractDir, "c1--示例住宅-合同电子版.pdf"), "PDF", "utf8");
  await inBook("bookA", async () => {
    const led = await F.readLedger();
    await F.writeLedger({
      ...(led as Record<string, unknown>),
      year: 2026,
      years: [2026],
      contracts: [{ id: "c1", year: 2026, code: "A-1", name: "示例住宅A区", scanFileName: "" }],
      people: [{ id: "p1", name: "王五" }],
    } as never);
  });

  const r = await inBook("bookA", () => F.adoptLegacyAssets());
  assert.equal(r.docs, 1);
  assert.equal(existsSync(join(bookAssets("bookA", "合同扫描件"), "c1--示例住宅-合同电子版.pdf")), true);
});

test("A1：文档写入目录是本台账的（不是全局）", async () => {
  const dirs = await inBook("bookA", async () => {
    await F.saveDoc("c9", "contract", Buffer.from("PDF"), "新合同-合同电子版.pdf");
    return readdir(bookAssets("bookA", "合同扫描件"));
  });
  assert.equal(
    dirs.some((f) => f.includes("c9")),
    true,
    "新上传的合同扫描件要落在本台账目录",
  );
  assert.equal(existsSync(join(root, "photos", "合同扫描件", "c9--新合同-合同电子版.pdf")), false);
});
