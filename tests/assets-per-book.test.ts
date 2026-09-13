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
import { fileURLToPath } from "node:url";

const root = await mkdtemp(join(tmpdir(), "gongdi-assets-test-"));
process.env.DATA_DIR = root;
delete process.env.PHOTO_DIR;
delete process.env.PHOTO_ID_DIR;

const F = await import("../src/lib/nas-fs.server");
const P = await import("../src/lib/paths.server");
const A = await import("../src/lib/assets.server");

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
const bookAssets = (book: string, sub: string) => join(root, "photos", book, sub);
const legacyId = join(root, "photos", "id");

async function inBook<T>(book: string, fn: () => Promise<T>): Promise<T> {
  return P.runWithBook(book, fn);
}

test("A1：照片写进本台账自己的目录（不再写全局目录）", async () => {
  await inBook("bookA", () => A.savePhoto("张三", "id", PNG));
  assert.equal(existsSync(join(bookAssets("bookA", "id"), "张三-身份证-正面.png")), true);
  assert.equal(existsSync(join(legacyId, "张三-身份证-正面.png")), false, "不能再往全局目录写");
});

test("A1：台账之间互相看不到对方的照片", async () => {
  const inA = await inBook("bookA", () => A.findPhotoPath("张三", "id"));
  assert.ok(inA, "A 台账应能读到自己的照片");
  const inB = await inBook("bookB", () => A.findPhotoPath("张三", "id"));
  assert.equal(inB, null, "B 台账不能读到 A 台账的身份证照（原漏洞）");
});

test("A1：删台账会连自己的影像目录一起删", async () => {
  await inBook("bookB", () => A.savePhoto("李四", "bank", PNG));
  assert.equal(existsSync(bookAssets("bookB", "bank")), true);
  await F.removeBookDir("bookB");
  assert.equal(existsSync(join(root, "photos", "bookB")), false);
});

test("A2：历史全局目录仍能读到（只读回落，老数据不消失）", async () => {
  await mkdir(legacyId, { recursive: true });
  await writeFile(join(legacyId, "王五-身份证-正面.jpg"), "JPG", "utf8");

  const hit = await inBook("bookA", () => A.findPhotoPath("王五", "id"));
  assert.ok(hit, "遗留目录里的老照片必须还能看到");
  assert.equal(hit?.dir, legacyId);
  // 读到了，但没有被复制/写进本台账目录
  assert.equal(existsSync(join(bookAssets("bookA", "id"), "王五-身份证-正面.jpg")), false);
});

test("A2：PHOTO_LEGACY_FALLBACK=off 后不再回落（迁移完成后可彻底关闭）", async () => {
  process.env.PHOTO_LEGACY_FALLBACK = "off";
  try {
    const hit = await inBook("bookA", () => A.findPhotoPath("王五", "id"));
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

  const r = await inBook("bookA", async () => A.adoptLegacyAssets(await F.readLedger()));
  assert.equal(r.photos, 1, "应归入 1 张照片");
  const adopted = join(bookAssets("bookA", "id"), "王五-身份证-正面.jpg");
  assert.equal(existsSync(adopted), true, "归入后应在台账目录里");
  assert.equal(existsSync(join(legacyId, "王五-身份证-正面.jpg")), true, "原文件必须保留（可回退）");

  // 再跑一次：已在台账目录里，应原地不动（不覆盖），也不重复计入
  await writeFile(join(legacyId, "王五-身份证-正面.jpg"), "旧内容", "utf8");
  const again = await inBook("bookA", async () => A.adoptLegacyAssets(await F.readLedger()));
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

  const r = await inBook("bookA", async () => A.adoptLegacyAssets(await F.readLedger()));
  assert.equal(r.docs, 1);
  assert.equal(existsSync(join(bookAssets("bookA", "合同扫描件"), "c1--示例住宅-合同电子版.pdf")), true);
});

test("A1：文档写入目录是本台账的（不是全局）", async () => {
  const dirs = await inBook("bookA", async () => {
    await A.saveDoc("c9", "contract", Buffer.from("PDF"), "新合同-合同电子版.pdf");
    return readdir(bookAssets("bookA", "合同扫描件"));
  });
  assert.equal(
    dirs.some((f) => f.includes("c9")),
    true,
    "新上传的合同扫描件要落在本台账目录",
  );
  assert.equal(existsSync(join(root, "photos", "合同扫描件", "c9--新合同-合同电子版.pdf")), false);
});

test("B9：合同扫描件覆盖写是先就位后清旧（崩溃也不会两头空）", async () => {
  const dir = bookAssets("bookA", "合同扫描件");
  await inBook("bookA", () => A.saveDoc("c10", "contract", Buffer.from("第一版"), "方案.pdf"));
  assert.equal(await inBook("bookA", async () => (await A.findDoc("c10", "contract"))?.buf.toString()), "第一版");

  // 同名覆盖：新内容就位后旧文件才被清掉（目录里还有别的用例的文件，只校验 c10 名下）
  await inBook("bookA", () => A.saveDoc("c10", "contract", Buffer.from("第二版"), "方案.pdf", { replace: true }));
  assert.equal(await inBook("bookA", async () => (await A.findDoc("c10", "contract"))?.buf.toString()), "第二版");
  assert.equal(await readFile(join(dir, "方案.pdf"), "utf8"), "第二版");
  assert.equal(await readFile(join(dir, "c10.name.txt"), "utf8"), "方案.pdf", "指针应指向新文件");

  // 换名上传（不替换）：指针指向新文件，旧文件属于本 id 的历史版本被清，新文件内容可读
  await inBook("bookA", () => A.saveDoc("c10", "contract", Buffer.from("第三版"), "终版.pdf"));
  assert.equal(await inBook("bookA", async () => (await A.findDoc("c10", "contract"))?.buf.toString()), "第三版");
  assert.equal(await inBook("bookA", async () => (await A.findDoc("c10", "contract"))?.fileName), "终版.pdf");
  assert.equal(existsSync(join(dir, "方案.pdf")), false, "被替换的旧文件应已清掉");
  assert.equal(await readFile(join(dir, "终版.pdf"), "utf8"), "第三版");
});

test("B9：前缀类文档（考勤影像）覆盖写后只剩新文件、能按 id 读回", async () => {
  const dir = bookAssets("bookA", "考勤影像");
  await inBook("bookA", () => A.saveDoc("a1", "attendance", Buffer.from("一月"), "1月.jpg"));
  await inBook("bookA", () => A.saveDoc("a1", "attendance", Buffer.from("一月修订"), "1月.jpg"));
  const hit = await inBook("bookA", () => A.findDoc("a1", "attendance"));
  assert.equal(hit?.buf.toString(), "一月修订");
  assert.equal(hit?.fileName, "1月.jpg");
  const files = (await readdir(dir)).filter((f) => f.startsWith("a1--"));
  assert.equal(files.length, 1, "同一 id 的旧前缀文件应被清掉，只留新文件");
});

test("B9：共享文件不被清（别的 id 指针还指着它）", async () => {
  const dir = bookAssets("bookA", "合同扫描件");
  // 两个合同 id 指向同一份扫描件（共用文件名）
  await inBook("bookA", () => A.saveDoc("s1", "contract", Buffer.from("共享件"), "共用扫描.pdf"));
  await inBook("bookA", () => A.saveDoc("s2", "contract", Buffer.from("共享件"), "共用扫描.pdf", { replace: true }));
  // s2 换文件时，旧文件仍被 s1 的指针引用，不能删
  await inBook("bookA", () => A.saveDoc("s2", "contract", Buffer.from("自己的"), "s2专用.pdf"));
  assert.equal(existsSync(join(dir, "共用扫描.pdf")), true, "s1 还在用的共享文件不能被 s2 的清理删掉");
  assert.equal(await inBook("bookA", async () => (await A.findDoc("s1", "contract"))?.buf.toString()), "共享件");
  assert.equal(await inBook("bookA", async () => (await A.findDoc("s2", "contract"))?.buf.toString()), "自己的");
});

/** 源码守卫：saveDoc 必须是「rename 就位 → 写指针 → 清旧」，顺序一换，崩溃窗口就会两头空 */
test("B9 守卫：saveDoc 里 rename 必须先于 sweepDocFiles", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/assets.server.ts", import.meta.url)), "utf8");
  const body = src.slice(src.indexOf("export async function saveDoc"));
  const renameAt = body.indexOf("await rename(tmp, dest)");
  const sweepAt = body.indexOf("await sweepDocFiles(");
  assert.ok(renameAt > 0, "saveDoc 必须先 rename 临时文件就位");
  assert.ok(sweepAt > renameAt, "清旧文件必须在新文件就位之后（防「先删后写」回归）");
});

/** 源码守卫：ensureDirs 的一次性缓存键必须含数据目录本身（只按台账 id 会在换 DATA_DIR 后误判已就绪） */
test("读路径守卫：ensureDirs 缓存键含数据目录 + 台账 id", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/paths.server.ts", import.meta.url)), "utf8");
  assert.match(src, /\$\{dataDir\(\)\}::\$\{currentBookId\(\)\}/, "缓存键必须同时含 DATA_DIR 与台账 id");
});
