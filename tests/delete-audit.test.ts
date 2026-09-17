/**
 * A5（专家评审 20260917）：删除操作必须留痕（审计不可否认性）。
 *
 * 复现的缺陷：
 * 1. `DELETE /api/audit` 直接 `writeAudit(list.filter(...))` —— **删记录这件事本身不留痕**，
 *    管理员（或被冒用的管理员会话）删掉 100 条操作记录后，历史里一点痕迹都没有；
 * 2. `DELETE /api/doc`、`DELETE /api/photo` 服务端**零审计**：只有客户端 `logOp()` 会记一条，
 *    会话过期/网络失败/前端漏报时，「谁把证件照删了」事后完全查不出。
 *
 * 这里用真实 Route handler 跑：删影像、删照片、批量删操作记录，断言审计里出现对应记录，
 * 且那条「删除操作记录」的留痕不会被同一次请求删掉。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";

const root = await mkdtemp(join(tmpdir(), "gongdi-delete-audit-"));
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
const AUDIT = await import("../src/routes/api/audit");
const DOC = await import("../src/routes/api/doc");
const PHOTO = await import("../src/routes/api/photo");

type Handler = (ctx: { request: Request }) => Promise<Response>;
const audit = AUDIT.Route.options.server!.handlers as unknown as {
  GET: Handler;
  POST: Handler;
  DELETE: Handler;
};
const doc = DOC.Route.options.server!.handlers as unknown as { PUT: Handler; DELETE: Handler };
const photo = PHOTO.Route.options.server!.handlers as unknown as { PUT: Handler; DELETE: Handler };

const setup = await A.handleAuthPost(
  new Request("http://local/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "setup", username: "admin", password: "12345678", name: "管理员" }),
  }),
);
assert.equal(setup.status, 200, "前置：建管理员");
const cookie = (setup.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .filter(Boolean)
  .join("; ");
assert.ok(cookie, "前置：要拿到会话 cookie");

interface Row {
  id: string;
  action: string;
  module: string;
  detail: string;
  userName: string;
}

async function rows(): Promise<Row[]> {
  const r = await audit.GET({ request: new Request("http://local/api/audit", { headers: { cookie } }) });
  assert.equal(r.status, 200, "读操作记录");
  return ((await r.json()) as { entries?: Row[] }).entries || [];
}

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

test("A5：删除照片 → 服务端审计里出现「删除照片 / 照片 / 张三 身份证正面」", async () => {
  const saved = await photo.PUT({
    request: new Request("http://local/api/photo", {
      method: "PUT",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ name: "张三", kind: "id", dataUrl: PNG }),
    }),
  });
  assert.equal(saved.status, 200, "前置：先传一张照片");

  const del = await photo.DELETE({
    request: new Request("http://local/api/photo?name=%E5%BC%A0%E4%B8%89&kind=id", {
      method: "DELETE",
      headers: { cookie },
    }),
  });
  assert.equal(del.status, 200, "删除照片");

  const list = await rows();
  const hit = list.filter((e) => e.module === "照片" && e.action === "删除照片");
  assert.equal(hit.length >= 1, true, "删除照片必须在服务端留痕（原来只有客户端 logOp，漏报就查不出来）");
  assert.equal(hit[0].userName, "管理员", "要记清是谁删的");
  assert.match(hit[0].detail, /张三/, "内容要能看出删了谁的照片");
  assert.match(hit[0].detail, /身份证正面/, "内容要能看出删的是哪一类影像");
});

test("A5：删除单据影像 → 服务端审计里出现「删除影像 / 影像资料 / 合同扫描件」", async () => {
  const form = new FormData();
  form.set("id", "c1");
  form.set("kind", "contract");
  form.set("file", new File(["PDF"], "合同.pdf", { type: "application/pdf" }));
  const saved = await doc.PUT({ request: new Request("http://local/api/doc", { method: "PUT", headers: { cookie }, body: form }) });
  assert.equal(saved.status, 200, "前置：先传一份合同影像");

  const del = await doc.DELETE({
    request: new Request("http://local/api/doc?id=c1&kind=contract", { method: "DELETE", headers: { cookie } }),
  });
  assert.equal(del.status, 200, "删除影像");

  const hit = (await rows()).filter((e) => e.module === "影像资料" && e.action === "删除影像");
  assert.equal(hit.length >= 1, true, "删除单据影像必须在服务端留痕");
  assert.equal(hit[0].userName, "管理员");
  assert.match(hit[0].detail, /合同扫描件/, "内容里要有单据类别");
  assert.match(hit[0].detail, /c1/, "内容里要有记录 id");
});

test("A5：批量删操作记录 → 必须留下一条「删除操作记录」，且写清删了几条/哪些 id", async () => {
  const seeded: string[] = [];
  for (const action of ["测试甲", "测试乙", "测试丙"]) {
    const r = await audit.POST({
      request: new Request("http://local/api/audit", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ action, detail: "", module: "测试" }),
      }),
    });
    assert.equal(r.status, 200, `前置：写入操作记录 ${action}`);
    seeded.push(((await r.json()) as { entry: { id: string } }).entry.id);
  }

  const del = await audit.DELETE({
    request: new Request(`http://local/api/audit?ids=${seeded[0]},${seeded[1]}`, { method: "DELETE", headers: { cookie } }),
  });
  assert.equal(del.status, 200, "批量删除");
  assert.equal(((await del.json()) as { removed?: number }).removed, 2, "要回真实的删除条数");

  const list = await rows();
  const ids = list.map((e) => e.id);
  assert.equal(ids.includes(seeded[0]), false, "被删的记录要真的没了");
  assert.equal(ids.includes(seeded[1]), false);
  assert.equal(ids.includes(seeded[2]), true, "没点名的记录不许被连带删掉");

  const trace = list.filter((e) => e.action === "删除操作记录" && e.module === "审计");
  assert.equal(trace.length, 1, "删记录本身必须留痕（不可否认性），而且**没有被同一次请求删掉**");
  assert.equal(trace[0].userName, "管理员", "要记是谁删的");
  assert.match(trace[0].detail, /2 条/, "要写清删了几条");
  assert.match(trace[0].detail, new RegExp(seeded[0]), "要写清删了哪些 id（可追）");
});

test("A5：删除不存在/空 ids 时不留假记录（removed 为 0 也算如实记录）", async () => {
  const before = (await rows()).filter((e) => e.action === "删除操作记录").length;
  const del = await audit.DELETE({
    request: new Request("http://local/api/audit?ids=不存在的记录", { method: "DELETE", headers: { cookie } }),
  });
  assert.equal(del.status, 200);
  assert.equal(((await del.json()) as { removed?: number }).removed, 0);
  const after = (await rows()).filter((e) => e.action === "删除操作记录");
  assert.equal(after.length, before + 1, "即使一条都没删掉，也要如实记一次（0 条）");
  assert.match(after[0].detail, /0 条/);
});
