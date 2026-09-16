/**
 * 影像目录缓存测试（性能：目录列表 + 文件名匹配，每次都 readdir、无缓存）。
 *
 * 缓存最容易出的事故是「刚上传的读不到、已删除的还能读到」，所以这里按正确性优先写用例：
 * 新增立即可见、删除立即不可见、mtime 变化触发刷新、TTL=0 完全关闭、目录不存在时保持原行为。
 * 缓存条目数（assetsDirCacheSize）用来证明缓存真的在工作/真的被关掉，而不是只测到 mtime 兜底。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = await mkdtemp(join(tmpdir(), "gongdi-assets-cache-"));
process.env.DATA_DIR = root;
delete process.env.PHOTO_DIR;
delete process.env.PHOTO_ID_DIR;
delete process.env.PHOTO_BANK_DIR;
delete process.env.PHOTO_IC_DIR;
delete process.env.PHOTO_LEGACY_FALLBACK;
delete process.env.ASSETS_CACHE_MS;

const A = await import("../src/lib/assets.server");
const P = await import("../src/lib/paths.server");

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

async function inBook<T>(book: string, fn: () => Promise<T>): Promise<T> {
  return P.runWithBook(book, fn);
}

test("TTL 配置：默认 3000ms，ASSETS_CACHE_MS 可配，0 = 关闭，非法值回退默认", () => {
  assert.equal(A.assetsCacheMs(), 3000);
  process.env.ASSETS_CACHE_MS = "500";
  assert.equal(A.assetsCacheMs(), 500);
  process.env.ASSETS_CACHE_MS = "0";
  assert.equal(A.assetsCacheMs(), 0);
  process.env.ASSETS_CACHE_MS = "abc";
  assert.equal(A.assetsCacheMs(), 3000);
  delete process.env.ASSETS_CACHE_MS;
});

test("新增立即可见：空目录缓存预热后，savePhoto 仍能立刻查到", async () => {
  await inBook("cacheBook", async () => {
    // 先查一次：ensureDirs 已建好空目录，缓存里记的是空列表
    assert.equal(await A.findPhotoPath("张三", "id"), null);
    assert.ok(A.assetsDirCacheSize() > 0, "空目录也应被缓存（否则这条用例证明不了失效逻辑）");
    await A.savePhoto("张三", "id", PNG);
    const hit = await A.findPhotoPath("张三", "id");
    assert.ok(hit, "刚上传的照片必须立刻能查到（写路径主动失效）");
    assert.equal(hit.file, "张三-身份证-正面.png");
  });
});

test("删除立即可见：removePhoto 后立刻查不到（不被缓存留住）", async () => {
  await inBook("cacheBook", async () => {
    assert.ok(await A.findPhotoPath("张三", "id"), "前置：照片还在");
    await A.removePhoto("张三", "id");
    assert.equal(await A.findPhotoPath("张三", "id"), null, "刚删除的照片不能还能查到");
  });
});

test("mtime 变化触发刷新：外部直接写盘（不走写路径）也能看到新文件", async () => {
  const dir = join(root, "photos", "mtimeBook", "id");
  await mkdir(dir, { recursive: true });
  A.clearAssetDirCache();
  assert.deepEqual(await A.listDirCached(dir), [], "预热：空目录");
  await writeFile(join(dir, "外部新增-身份证-正面.jpg"), "JPG", "utf8");
  // 显式把目录 mtime 拨到与缓存记录不同的值：不依赖文件系统 mtime 精度
  const future = new Date(Date.now() + 5000);
  await utimes(dir, future, future);
  const names = await A.listDirCached(dir);
  assert.ok(names.includes("外部新增-身份证-正面.jpg"), "mtime 变了就必须重新 readdir");
});

test("TTL=0 完全不缓存：即使 mtime 未变也每次真实 readdir", async () => {
  const dir = join(root, "photos", "ttlBook", "id");
  await mkdir(dir, { recursive: true });
  process.env.ASSETS_CACHE_MS = "0";
  try {
    A.clearAssetDirCache();
    const before = (await stat(dir)).mtimeMs;
    assert.deepEqual(await A.listDirCached(dir), []);
    assert.equal(A.assetsDirCacheSize(), 0, "TTL=0 时不得写入任何缓存");
    await writeFile(join(dir, "新增-身份证-正面.jpg"), "JPG", "utf8");
    const back = new Date(before);
    await utimes(dir, back, back); // 把 mtime 拨回去：实现若走缓存就会读到旧列表
    const names = await A.listDirCached(dir);
    assert.ok(names.includes("新增-身份证-正面.jpg"), "关闭缓存后必须每次真实 readdir");
    assert.equal(A.assetsDirCacheSize(), 0);
  } finally {
    delete process.env.ASSETS_CACHE_MS;
  }
});

test("目录不存在：不缓存、返回空、不抛异常（保持 listDirSafe 行为）", async () => {
  A.clearAssetDirCache();
  const dir = join(root, "photos", "不存在的台账", "id");
  assert.deepEqual(await A.listDirCached(dir), []);
  assert.equal(A.assetsDirCacheSize(), 0, "取不到 mtime 就不该缓存");
  assert.deepEqual(await A.listDirCached(""), []);
});

test("同一次页面渲染的重复取用被合并：缓存条目数不随调用次数增长", async () => {
  A.clearAssetDirCache();
  const names = Array.from({ length: 60 }, (_, i) => `工人${i}`);
  // photoFlags 是「人数 × 4 类 × 每个回落目录」的重复扫描，原来每次都 readdir
  await inBook("cacheBook", () => A.photoFlags(names));
  const sizeAfterFirst = A.assetsDirCacheSize();
  assert.ok(sizeAfterFirst > 0, "预热后应有缓存条目");
  await inBook("cacheBook", () => A.photoFlags(names));
  assert.equal(A.assetsDirCacheSize(), sizeAfterFirst, "第二次取用应命中缓存，不再新增条目");
});
