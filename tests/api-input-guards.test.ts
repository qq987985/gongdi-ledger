/**
 * F 项 · 写接口输入口径守卫（1.8.1）。
 *
 * 盯的是一类「接口回 200，实际什么都没发生」的问题：
 * 服务端的写函数（savePhoto / saveDoc …）对不合规入参是**静默跳过**的，
 * 如果路由不在调用前拒掉，用户就会看到「上传成功」而磁盘上什么都没有 ——
 * 与 §5 的「上传/下载必须检查结果、禁止显示成功但没落盘」同源。
 *
 * 已修的具体两处（本轮补的最小校验，接口语义对其余入参不变）：
 * 1. `PUT /api/photo`：dataUrl 不是 `data:image/…;base64,…`、或 name 去掉非法字符后为空 → 400（原先 200 {ok:true}）
 * 2. `PUT /api/doc`：id 去掉非法字符后为空 → 400（原先 200 {ok:true}）
 *
 * 另有两条「结构」守卫，防止以后新增写接口又漏掉：
 * 3. 每个会写盘的 handler 必须有鉴权（withTenant / resolveTenant）；
 * 4. 每个会写盘的 handler 必须在**第一个写调用之前**出现过拒绝路径（4xx，表单类接口允许 302/303 重定向）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expectMinHits } from "./min-hits";

const cwd = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

// 与 assets-per-book.test.ts 同一套隔离手法：先把 DATA_DIR 指到临时目录再 import（模块加载时读环境变量）
const root = await mkdtemp(join(tmpdir(), "gongdi-input-guard-"));
process.env.DATA_DIR = root;
delete process.env.PHOTO_DIR;
delete process.env.DOC_DIR;

const A = await import("../src/lib/assets.server");
const P = await import("../src/lib/paths.server");

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

/** 递归列出临时目录里的所有文件（相对路径），用来断言「确实没写盘」 */
async function filesUnder(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await filesUnder(p)));
    else out.push(p.slice(root.length + 1));
  }
  return out;
}

// ───────────────────────── 判定函数：与真实写入同口径 ─────────────────────────

test("口径：photoNameWritable 与 savePhoto 的落盘条件一致（空名/纯非法字符 = 不写）", () => {
  assert.equal(A.photoNameWritable("张三"), true);
  assert.equal(A.photoNameWritable("张三-身份证"), true);
  assert.equal(A.photoNameWritable("///"), false, "全是非法字符 → 清理后为空，savePhoto 不会写");
  assert.equal(A.photoNameWritable("   "), false);
  assert.equal(A.photoNameWritable(""), false);
  assert.equal(A.photoNameWritable(undefined), false);
});

test("口径：isWritablePhotoDataUrl 只认 data:image/…;base64,…（savePhoto 的正则同源）", () => {
  assert.equal(A.isWritablePhotoDataUrl(PNG), true);
  assert.equal(A.isWritablePhotoDataUrl("data:image/jpeg;base64,AAAA"), true);
  assert.equal(A.isWritablePhotoDataUrl("data:image/webp;base64,AAAA"), true);
  assert.equal(A.isWritablePhotoDataUrl("not-a-data-url"), false, "普通字符串：原实现会静默不写");
  assert.equal(A.isWritablePhotoDataUrl(""), false);
  assert.equal(A.isWritablePhotoDataUrl("data:text/plain;base64,AAAA"), false, "非图片 mime 不写");
  assert.equal(A.isWritablePhotoDataUrl("data:image/png,AAAA"), false, "缺 base64 段不写");
  assert.equal(A.isWritablePhotoDataUrl("data:image/png;base64,"), false, "base64 段为空不写");
  assert.equal(A.isWritablePhotoDataUrl(undefined), false);
});

test("口径：docIdWritable 与 saveDoc 的落盘条件一致（空 id = 不写）", () => {
  assert.equal(A.docIdWritable("c1"), true);
  assert.equal(A.docIdWritable("cont/2026"), true, "非法字符会被清掉后仍非空 → 还能落盘");
  assert.equal(A.docIdWritable("   "), false);
  assert.equal(A.docIdWritable(""), false);
  assert.equal(A.docIdWritable(undefined), false);
});

// ───────────────────────── 行为：非法入参确实不写盘 ─────────────────────────

test("不写盘：非法 dataUrl / 空名字调 savePhoto 时目录里不会多出任何文件", async () => {
  const before = await filesUnder(join(root, "photos"));
  await P.runWithBook("bookG", async () => {
    await A.savePhoto("张三", "id", "not-a-data-url");
    await A.savePhoto("张三", "id", "");
    await A.savePhoto("///", "id", PNG);
  });
  const after = await filesUnder(join(root, "photos"));
  assert.deepEqual(after, before, "这三种入参都不该落盘（正是路由必须先 400 的原因）");
});

test("正向对照：合法入参确实落盘（证明上面的「不写盘」不是因为功能坏了）", async () => {
  await P.runWithBook("bookG", () => A.savePhoto("张三", "id", PNG));
  const files = await filesUnder(join(root, "photos"));
  assert.equal(files.length, 1, `应恰好写了一张照片，实际：${files.join("、")}`);
  assert.match(files[0], /张三-身份证-正面\.png$/);
});

test("不写盘：空 id 调 saveDoc 时不会写文件，也查不到记录", async () => {
  // 只比较影像/文档区（photos/ 下，文档也在这里）：第一次调用会顺带懒建目录与空白模板，
  // 先让它发生再拍快照，否则「没写盘」会被这些与本次入参无关的文件创建掩盖
  const assets = () => filesUnder(join(root, "photos"));
  await P.runWithBook("bookG", () => A.saveDoc("   ", "contract", Buffer.from("PDF"), "合同.pdf"));
  const before = await assets();
  await P.runWithBook("bookG", async () => {
    const ret = await A.saveDoc("   ", "contract", Buffer.from("PDF"), "合同.pdf");
    // 返回值看着像成功（回显文件名）——所以路由必须在调用前拒掉，否则界面会以为传上去了
    assert.equal(ret, "合同.pdf");
  });
  assert.deepEqual(await assets(), before, "空 id 不该落盘");
  const hit = await P.runWithBook("bookG", () => A.findDoc("   ", "contract"));
  assert.equal(hit, null, "查不到任何文件");
});

test("正向对照：合法 id 调 saveDoc 确实落盘并可查回", async () => {
  await P.runWithBook("bookG", () => A.saveDoc("c1", "contract", Buffer.from("PDF"), "合同.pdf"));
  const hit = await P.runWithBook("bookG", () => A.findDoc("c1", "contract"));
  assert.ok(hit, "合法 id 应能查回刚上传的文件");
  assert.match(hit!.fileName, /合同\.pdf$/);
});

// ───────────────────────── 结构守卫：写接口必须「先校验、后写盘」 ─────────────────────────

/** 去掉注释，避免把注释里的示例当成真实代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

/** 会真正写盘/改数据的调用（服务端 write 类函数的唯一清单） */
const WRITE_CALLS = [
  "savePhoto",
  "saveDoc",
  "removePhoto",
  "removeDocFile",
  "writeLedger",
  // 1.8.14（A2）：写台账并拿到「写后服务端版本号」的入口，与 writeLedger 共用同一份实现
  "writeLedgerEx",
  "saveBackup",
  "appendAudit",
  "writeAudit",
  // 事务入口只读快照；实际写点在回调中的 append/replace，拒绝路径可以位于回调内。
  "tx\\.append",
  "tx\\.replace",
  "adoptLegacyAssets",
  "pruneLocalImages",
  "startUpdateJob",
];

const API_FILES = [
  "src/routes/api/audit.ts",
  "src/routes/api/auth.ts",
  "src/routes/api/backup.ts",
  "src/routes/api/doc.ts",
  "src/routes/api/images.ts",
  "src/routes/api/ledger.ts",
  "src/routes/api/photo-adopt.ts",
  "src/routes/api/photo.ts",
  "src/routes/api/update.ts",
  "src/routes/api/year.ts",
];

interface Handler {
  file: string;
  method: string;
  body: string;
  /** 同文件里「handler 之外的部分」：写盘发生在本文件的辅助函数里时用它做位置比较 */
  nonHandler: string;
}

/** 把每个文件的 handlers 按方法切成段（够用的正则：handler 键只出现在 handlers 对象里） */
function handlersOf(file: string, source: string): Handler[] {
  const s = stripComments(source);
  const segs = [...s.matchAll(/\b(GET|POST|PUT|DELETE|PATCH):\s*async/g)].map((m, i, all) => ({
    method: m[1],
    start: m.index ?? 0,
    end: i + 1 < all.length ? all[i + 1].index ?? s.length : s.length,
  }));
  // 用等长空格盖掉 handler 段，保留字符偏移，便于和 handler 体做同一套「位置先后」比较
  let nonHandler = s;
  for (const seg of segs) {
    nonHandler = `${nonHandler.slice(0, seg.start)}${" ".repeat(seg.end - seg.start)}${nonHandler.slice(seg.end)}`;
  }
  return segs.map((seg) => ({ file, method: seg.method, body: s.slice(seg.start, seg.end), nonHandler }));
}

/** 第一次出现写调用的位置（找不到 → Infinity） */
function firstWriteAt(text: string): number {
  return Math.min(
    ...WRITE_CALLS.map((fn) => {
      const m = new RegExp(`\\b${fn}\\(`).exec(text);
      return m ? m.index ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
    }),
  );
}

/** 第一次出现拒绝路径的位置（4xx，或表单类接口的 302/303 重定向） */
function firstRejectAt(text: string): number {
  return Math.min(
    ...[...text.matchAll(/status:\s*4\d\d|Response\.redirect\(/g)].map(
      (m) => m.index ?? Number.POSITIVE_INFINITY,
    ),
    Number.POSITIVE_INFINITY,
  );
}

const handlers: Handler[] = [];
{
  const { readFile } = await import("node:fs/promises");
  for (const f of API_FILES) handlers.push(...handlersOf(f, await readFile(cwd(f), "utf8")));
}

/**
 * 写盘发生在本文件的辅助函数里时（现例 year.ts 的 addYearAndRedirect），
 * handler 体里只有一次委托调用；这时改看被委托的那个函数体做位置比较。
 * 只认「本文件定义的 function」且确实调用了它的 handler —— 否则同为 year.ts 的 GET（405 桩）
 * 会被误判成写接口。
 */
function helperWriteRegions(nonHandler: string): Map<string, string> {
  const marks = [...nonHandler.matchAll(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[(<]/g)];
  const out = new Map<string, string>();
  marks.forEach((m, i) => {
    const start = m.index ?? 0;
    const end = i + 1 < marks.length ? marks[i + 1].index ?? nonHandler.length : nonHandler.length;
    const seg = nonHandler.slice(start, end);
    if (Number.isFinite(firstWriteAt(seg))) out.set(m[1], seg);
  });
  return out;
}

/** 这个 handler 的写盘发生在哪段代码里（不是写接口 → null） */
function regionOf(h: Handler): string | null {
  if (Number.isFinite(firstWriteAt(h.body))) return h.body;
  for (const [name, seg] of helperWriteRegions(h.nonHandler)) {
    if (h.body.includes(`${name}(`)) return seg;
  }
  return null;
}

const mutating = handlers.filter((h) => regionOf(h) !== null);

test("守卫：写接口清单非空（守卫本身不能因为解析失败而空转）", () => {
  expectMinHits(
    "写接口守卫：解析到的写 handler 数（正则/文件清单失效时会空转）",
    mutating.length,
    8,
    "现有 12 个以上（各接口的 PUT/DELETE）",
  );
  const where = mutating.map((h) => `${h.file.replace("src/routes/api/", "")} ${h.method}`);
  for (const expect of ["photo.ts PUT", "photo.ts DELETE", "doc.ts PUT", "doc.ts DELETE", "ledger.ts PUT", "year.ts POST", "audit.ts PUT", "audit.ts DELETE"]) {
    assert.equal(where.includes(expect), true, `少了解析到的写接口：${expect}（现有：${where.join("、")}）`);
  }
});

test("守卫自检：审计事务内写入不会漏出写接口清单", () => {
  for (const sample of ["withAuditTransaction(async (tx) => { await tx.replace(rows); })", "await tx.append(row)", "await tx.replace(rows)"])
    assert.ok(Number.isFinite(firstWriteAt(sample)), `漏识别审计写入：${sample}`);
  assert.equal(firstWriteAt("withAuditTransaction(async (tx) => tx.entries)"), Infinity, "仅打开事务读取不算写入");
  assert.equal(firstWriteAt("await readAudit()"), Infinity, "普通读取不算写入");
});

test("守卫：每个写 handler 都必须有鉴权（withTenant / resolveTenant / gateTenant）", () => {
  // 1.8.14（A4）：doc/photo 的 PUT 要按 body 里的 kind 判模块权限，拆成了
  // `gateTenant()`（先鉴权、不读 body）+ `needDenied()`（读完 body 补判）两段 ——
  // gateTenant 就是 withTenant 的第一段，口径不变，同样算「做了租户/权限校验」。
  const bad = mutating
    .filter((h) => !/withTenant\(|resolveTenant\(|gateTenant\(/.test(h.body))
    .map((h) => `${h.file} ${h.method}`);
  assert.deepEqual(bad, [], `这些写接口没有做租户/权限校验：${bad.join("、")}`);
});

test("守卫：每个写 handler 都要在「第一次写盘之前」出现拒绝路径（4xx，表单接口允许重定向）", () => {
  const bad: string[] = [];
  for (const h of mutating) {
    const text = regionOf(h) ?? "";
    const writeAt = firstWriteAt(text);
    const rejectAt = firstRejectAt(text);
    if (!(rejectAt < writeAt)) bad.push(`${h.file} ${h.method}（拒绝路径位置 ${rejectAt}，写盘位置 ${writeAt}）`);
  }
  assert.deepEqual(
    bad,
    [],
    `这些写接口在写盘前没有任何 4xx/重定向拒绝路径，非法入参会直接写进去：\n${bad.join("\n")}`,
  );
});

test("守卫：所有解析请求体的地方都要 try/catch 或 .catch() 兜底（非 JSON 不能变 500）", async () => {
  const { readFile } = await import("node:fs/promises");
  const bad: string[] = [];
  for (const f of API_FILES) {
    const s = stripComments(await readFile(cwd(f), "utf8"));
    for (const m of s.matchAll(/await request\.(json|formData)\(\)/g)) {
      const before = s.slice(Math.max(0, (m.index ?? 0) - 220), m.index ?? 0);
      const after = s.slice(m.index ?? 0, (m.index ?? 0) + 40);
      const guarded = /\btry\s*\{/.test(before) || /\)\s*\.catch\(/.test(after);
      if (!guarded) bad.push(`${f}: ${m[0]}`);
    }
  }
  assert.deepEqual(bad, [], `这些地方直接 await 解析 body，非 JSON 请求会 500：\n${bad.join("\n")}`);
});

test("守卫：photo/doc 路由必须在调用写函数前用同口径判定函数挡掉「静默不写盘」的入参", async () => {
  const { readFile } = await import("node:fs/promises");
  const photo = stripComments(await readFile(cwd("src/routes/api/photo.ts"), "utf8"));
  const doc = stripComments(await readFile(cwd("src/routes/api/doc.ts"), "utf8"));
  assert.match(photo, /photoNameWritable\(/, "PUT/DELETE /api/photo 必须校验名字清理后非空");
  assert.match(photo, /isWritablePhotoDataUrl\(/, "PUT /api/photo 必须校验 dataUrl 形状");
  assert.match(doc, /docIdWritable\(/, "PUT /api/doc 必须校验 id 清理后非空");
  const putPhoto = photo.slice(photo.indexOf("PUT: async"), photo.indexOf("DELETE: async"));
  assert.equal(
    (putPhoto.indexOf("isWritablePhotoDataUrl(") < putPhoto.indexOf("savePhoto(") &&
      putPhoto.indexOf("photoNameWritable(") < putPhoto.indexOf("savePhoto(")),
    true,
    "校验必须出现在 savePhoto 之前",
  );
});
