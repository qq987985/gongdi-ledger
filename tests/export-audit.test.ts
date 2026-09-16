/**
 * 导出必须留痕（1.8.7，对应 A 组逐项测试报告第 37 项）。
 *
 * 复现到的缺陷：连续导出两次（人员名单 + 整本），`/api/audit` 条数 **63 → 63**，
 * `src/routes/api/file/$kind.ts` 里没有任何审计写入 —— 「导出」是要求留痕的操作之一
 * （身份证、银行卡、工资表被谁导走了，事后要能查）。
 *
 * 用真实 Route handler 跑：管理员导一次、只读账号导一次，检查操作记录里的
 * 模块 / 操作 / 内容（文件名）与人。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";

const root = await mkdtemp(join(tmpdir(), "gongdi-export-audit-"));
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
const KIND = await import("../src/routes/api/file/$kind");
const AUDIT = await import("../src/routes/api/audit");
const LEDGER = await import("../src/routes/api/ledger");

type Handler = (ctx: { request: Request; params?: Record<string, string> }) => Promise<Response>;
const kindGet = (KIND.Route.options.server!.handlers as unknown as { GET: Handler }).GET;
const auditGet = (AUDIT.Route.options.server!.handlers as unknown as { GET: Handler }).GET;
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
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
    }),
  );
}

const setup = await authPost({ op: "setup", username: "admin", password: "12345678", name: "管理员" });
assert.equal(setup.status, 200, "测试前置：建管理员必须成功");
const adminCookie = await cookieOf(setup);
assert.ok(adminCookie);

// 一本有人员的台账（导出人员名单得有内容）
const put = await ledgerPut({
  request: new Request("http://local/api/ledger", {
    method: "PUT",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({
      people: [{ id: "p1", name: "张三", team: "一班", dailyWage: 300 }],
      payments: [],
      attendance: [],
    }),
  }),
});
assert.equal(put.status, 200, "测试前置：写台账必须成功");

async function auditRows(cookie: string): Promise<any[]> {
  const r = await auditGet({ request: new Request("http://local/api/audit", { headers: { cookie } }) });
  assert.equal(r.status, 200);
  return ((await r.json()) as { entries?: any[] }).entries || [];
}

test("管理员导出人员名单 → 操作记录里出现「导出 / 导出人员名单 / 文件名」", async () => {
  const before = (await auditRows(adminCookie)).filter((e) => e.module === "导出").length;
  const r = await kindGet({
    request: new Request("http://local/api/file/people-export", { headers: { cookie: adminCookie } }),
    params: { kind: "people-export" },
  });
  assert.equal(r.status, 200, "导出本身要成功");
  assert.match(String(r.headers.get("content-disposition")), /xlsx/);

  const rows = await auditRows(adminCookie);
  const mine = rows.filter((e) => e.module === "导出");
  assert.equal(mine.length, before + 1, "每导出一次必须正好多一条记录（不多不少）");
  const last = mine[0];
  assert.equal(last.action, "导出人员名单");
  assert.equal(last.detail, "人员名单.xlsx", "内容要写文件名，事后能看出导的是哪份表");
  assert.equal(last.userName, "管理员", "要记清是谁导的");
});

test("导出整本总台账也会留痕（六种导出都要记）", async () => {
  const before = (await auditRows(adminCookie)).filter((e) => e.module === "导出").length;
  const r = await kindGet({
    request: new Request("http://local/api/file/export?scope=year&year=2026", { headers: { cookie: adminCookie } }),
    params: { kind: "export" },
  });
  assert.equal(r.status, 200);
  const mine = (await auditRows(adminCookie)).filter((e) => e.module === "导出");
  assert.equal(mine.length, before + 1);
  assert.equal(mine[0].action, "导出总台账");
});

test("只读账号导出也留痕，且记的是他自己的名字", async () => {
  const created = await authPost(
    { op: "createUser", name: "只读用户", username: "u_read", password: "12345678", joinCurrent: "1", preset: "read" },
    adminCookie,
  );
  assert.equal(created.status, 200, "测试前置：建只读账号必须成功");

  const login = await authPost({ op: "login", username: "u_read", password: "12345678" });
  assert.equal(login.status, 200);
  const userCookie = await cookieOf(login);

  const r = await kindGet({
    request: new Request("http://local/api/file/people-export", { headers: { cookie: userCookie } }),
    params: { kind: "people-export" },
  });
  assert.equal(r.status, 200, "只读账号有 export.use + people.view，导出应放行");

  const rows = await auditRows(adminCookie);
  const last = rows.filter((e) => e.module === "导出")[0];
  assert.equal(last.userName, "只读用户", "留痕要记实际导出人，而不是管理员");
  assert.equal(last.action, "导出人员名单");
});

test("模板下载不算「导出」，不写入操作记录（避免噪音）", async () => {
  const before = (await auditRows(adminCookie)).filter((e) => e.module === "导出").length;
  const r = await kindGet({
    request: new Request("http://local/api/file/people-template", { headers: { cookie: adminCookie } }),
    params: { kind: "people-template" },
  });
  assert.equal(r.status, 200);
  const after = (await auditRows(adminCookie)).filter((e) => e.module === "导出").length;
  assert.equal(after, before, "下载空白模板不是数据导出");
});
