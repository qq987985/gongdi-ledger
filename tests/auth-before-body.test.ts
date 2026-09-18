/**
 * A4（专家评审 20260917）：鉴权必须在**读请求体之前**。
 *
 * 复现的缺陷：`POST /api/backup`、`PUT /api/doc`、`PUT /api/photo`、`PUT /api/ledger`
 * 都是「先把 body 读进内存、再 `withTenant()`」。未登录的人反复发 20–50MB 的 body
 * 就能把进程内存吃满（CWE-770/400）——实测 40MB 全吃进去之后才回 401。
 *
 * 两种断言互补：
 * ① 静态：源码里鉴权出现在第一次读 body **之前**（防止以后有人把顺序改回去）；
 * ② 真实路由：未登录发大 body，必须 4xx，且 **`request.bodyUsed === false`**
 *    —— 这是「body 根本没被读」的直接证据，比看状态码更硬。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerHooks } from "node:module";
import { expectMinHits } from "./min-hits";

const root = await mkdtemp(join(tmpdir(), "gongdi-auth-before-body-"));
process.env.DATA_DIR = root;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("~/")) {
      const base = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try {
          return nextResolve(base + ext, context);
        } catch {}
      }
    }
    return nextResolve(specifier, context);
  },
});

const A = await import("../src/lib/accounts.server");
const BACKUP = await import("../src/routes/api/backup");
const DOC = await import("../src/routes/api/doc");
const PHOTO = await import("../src/routes/api/photo");
const LEDGER = await import("../src/routes/api/ledger");

type Handler = (ctx: { request: Request }) => Promise<Response>;
const backupPost = (BACKUP.Route.options.server!.handlers as unknown as { POST: Handler }).POST;
const docPut = (DOC.Route.options.server!.handlers as unknown as { PUT: Handler }).PUT;
const docGet = (DOC.Route.options.server!.handlers as unknown as { GET: Handler }).GET;
const docDelete = (DOC.Route.options.server!.handlers as unknown as { DELETE: Handler }).DELETE;
const photoPut = (PHOTO.Route.options.server!.handlers as unknown as { PUT: Handler }).PUT;
const ledgerPut = (LEDGER.Route.options.server!.handlers as unknown as { PUT: Handler }).PUT;

async function cookieOf(res: Response): Promise<string> {
  return (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function authPost(body: Record<string, unknown>, cookie = ""): Promise<Response> {
  return A.handleAuthPost(
    new Request("http://local/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
}

const setup = await authPost({ op: "setup", username: "admin", password: "12345678", name: "管理员" });
assert.equal(setup.status, 200, "前置：建管理员");
const adminCookie = await cookieOf(setup);

async function uploadDoc(id: string, name: string, content: string, replace = false) {
  const form = new FormData();
  form.set("id", id);
  form.set("kind", "contract");
  form.set("file", new File([content], name));
  if (replace) form.set("replace", "1");
  return docPut({ request: new Request("http://local/api/doc", {
    method: "PUT", headers: { cookie: adminCookie }, body: form,
  }) });
}

function downloadDoc(id: string) {
  return docGet({ request: new Request(`http://local/api/doc?kind=contract&id=${id}`, {
    headers: { cookie: adminCookie },
  }) });
}

test("文档：拒绝空文件替换，旧文件仍然可读", async () => {
  assert.equal((await uploadDoc("nonempty-test", "原合同.pdf", "original-pdf")).status, 200);
  assert.equal((await uploadDoc("nonempty-test", "空合同.pdf", "", true)).status, 400);
  assert.equal(await (await downloadDoc("nonempty-test")).text(), "original-pdf");
});

test("文档：XML 强制下载并禁止嗅探；PDF 保留内联预览", async () => {
  assert.equal((await uploadDoc("xml-test", "发票.XML", "<invoice />")).status, 200);
  const xml = await downloadDoc("xml-test");
  assert.match(xml.headers.get("Content-Disposition") || "", /^attachment;/);
  assert.equal(xml.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(xml.headers.get("Cache-Control"), "no-store");
  assert.equal((await uploadDoc("pdf-test", "合同.pdf", "pdf")).status, 200);
  const pdf = await downloadDoc("pdf-test");
  assert.match(pdf.headers.get("Content-Disposition") || "", /^inline;/);
  assert.equal(pdf.headers.get("Content-Type"), "application/pdf");
});

// ───────────────────────── ② 真实路由：未登录的大 body 必须连读都不读 ─────────────────────────

/** 2MB 的垃圾数据（够大到「如果真读了」会明显吃内存，又不会拖慢测试） */
const BIG = "x".repeat(2 * 1024 * 1024);

test("A4：未登录 PUT /api/ledger 发 2MB body → 401，且 body 从未被读取", async () => {
  const req = new Request("http://local/api/ledger", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ people: [], filler: BIG }),
  });
  const r = await ledgerPut({ request: req });
  assert.equal(r.status, 401);
  await r.arrayBuffer();
  assert.equal(req.bodyUsed, false, "鉴权发生在读 body 之前：body 不该被消费");
});

test("A4：未登录 POST /api/backup 发 2MB body → 401，且 body 从未被读取", async () => {
  const req = new Request("http://local/api/backup", { method: "POST", body: BIG });
  const r = await backupPost({ request: req });
  assert.equal(r.status, 401);
  await r.arrayBuffer();
  assert.equal(req.bodyUsed, false);
});

test("A4：未登录 PUT /api/photo 发 2MB body → 401，且 body 从未被读取", async () => {
  const req = new Request("http://local/api/photo", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "张三", kind: "id", dataUrl: `data:image/png;base64,${BIG}` }),
  });
  const r = await photoPut({ request: req });
  assert.equal(r.status, 401);
  await r.arrayBuffer();
  assert.equal(req.bodyUsed, false);
});

test("A4：未登录 PUT /api/doc 发 2MB multipart → 401，且 body 从未被读取", async () => {
  const form = new FormData();
  form.set("id", "c1");
  form.set("kind", "contract");
  form.set("file", new File([BIG], "合同.pdf", { type: "application/pdf" }));
  const req = new Request("http://local/api/doc", { method: "PUT", body: form });
  const r = await docPut({ request: req });
  assert.equal(r.status, 401);
  await r.arrayBuffer();
  assert.equal(req.bodyUsed, false, "50MB 上限的接口更要注意：不能先读再鉴权");
});

// ───────────────────────── 权限语义没有被两段式鉴权改掉 ─────────────────────────

test("A4：上传接口的模块级权限仍然生效（hr 账号传合同影像 → 403，传照片 → 200）", async () => {
  const created = await authPost(
    { op: "createUser", name: "考勤员", username: "u_hr", password: "12345678", joinCurrent: "1", preset: "hr" },
    adminCookie,
  );
  assert.equal(created.status, 200, "前置：建 hr 账号");
  const login = await authPost({ op: "login", username: "u_hr", password: "12345678" });
  assert.equal(login.status, 200);
  const cookie = await cookieOf(login);

  const form = new FormData();
  form.set("id", "c1");
  form.set("kind", "contract");
  form.set("file", new File(["PDF"], "合同.pdf", { type: "application/pdf" }));
  const denied = await docPut({ request: new Request("http://local/api/doc", { method: "PUT", headers: { cookie }, body: form }) });
  assert.equal(denied.status, 403, "hr 没有 contracts.edit，上传合同影像必须 403（读完 body 后的第二段权限判定）");

  const del = await docDelete({
    request: new Request("http://local/api/doc?id=c1&kind=contract", { method: "DELETE", headers: { cookie } }),
  });
  assert.equal(del.status, 403, "删除同理");

  const photo = await photoPut({
    request: new Request("http://local/api/photo", {
      method: "PUT",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        name: "张三",
        kind: "id",
        dataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
      }),
    }),
  });
  assert.equal(photo.status, 200, "hr 有 photos.edit，传照片要放行");
});

// ───────────────────────── ① 静态守卫：顺序不许改回去 ─────────────────────────

const HANDLERS: { file: string; method: string }[] = [
  { file: "src/routes/api/ledger.ts", method: "PUT" },
  { file: "src/routes/api/backup.ts", method: "POST" },
  { file: "src/routes/api/doc.ts", method: "PUT" },
  { file: "src/routes/api/photo.ts", method: "PUT" },
];

/** 去掉注释，避免注释里的示例被当成真实代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

/** 按 handler 切段（与 tests/api-input-guards.test.ts 同一套手法） */
function handlerSegments(source: string): Map<string, string> {
  const s = stripComments(source);
  const segs = [...s.matchAll(/\b(GET|POST|PUT|DELETE|PATCH):\s*async/g)].map((m, i, all) => ({
    method: m[1],
    start: m.index ?? 0,
    end: i + 1 < all.length ? all[i + 1].index ?? s.length : s.length,
  }));
  const out = new Map<string, string>();
  for (const seg of segs) out.set(seg.method, s.slice(seg.start, seg.end));
  return out;
}

/** 第一次鉴权的位置（withTenant / gateTenant 都算，后者是「先鉴权、读完 body 再判模块权限」） */
function authAt(text: string): number {
  const m = /\b(withTenant|gateTenant)\(/.exec(text);
  return m ? m.index ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
}

/** 第一次读请求体的位置 */
function bodyReadAt(text: string): number {
  const m = /await request\.(arrayBuffer|formData|json)\(/.exec(text);
  return m ? m.index ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
}

test("A4 守卫：4 个写接口的鉴权都排在「读 body」之前（顺序被改回去直接红）", async () => {
  const bad: string[] = [];
  let checked = 0;
  for (const { file, method } of HANDLERS) {
    const src = await readFile(fileURLToPath(new URL(`../${file}`, import.meta.url)), "utf8");
    const seg = handlerSegments(src).get(method);
    assert.ok(seg, `${file} 里没解析到 ${method} handler（守卫正则失效？）`);
    const a = authAt(seg!);
    const b = bodyReadAt(seg!);
    assert.equal(Number.isFinite(a), true, `${file} ${method}：没找到 withTenant/gateTenant`);
    // 顺序守卫是「比较大小」，命中不到就会拿 Infinity 比 Infinity —— 必须自检
    expectMinHits(`${file} ${method} 读 body 的位置`, Number.isFinite(b) ? 1 : 0, 1, "该 handler 里应有 await request.json/formData/arrayBuffer");
    checked += 1;
    if (!(a < b)) bad.push(`${file} ${method}（鉴权 @${a}，读 body @${b}）`);
  }
  expectMinHits("检查到的写接口数", checked, 4, "这 4 个接口是评审点名的：ledger/backup/doc/photo");
  assert.deepEqual(bad, [], `这些接口在鉴权之前读了请求体（未登录可灌内存）：\n${bad.join("\n")}`);
});

test("A4 守卫：PUT /api/doc 与 PUT /api/photo 读 body 后必须补判一次模块权限", async () => {
  for (const file of ["src/routes/api/doc.ts", "src/routes/api/photo.ts"]) {
    const src = stripComments(await readFile(fileURLToPath(new URL(`../${file}`, import.meta.url)), "utf8"));
    const put = handlerSegments(src).get("PUT") || "";
    assert.match(put, /needDenied\(/, `${file}：读完 body 拿到 kind 后必须补判模块权限，不能只做「登录就算过」`);
  }
});
