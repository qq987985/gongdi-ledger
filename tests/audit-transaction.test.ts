/** 真实 handler + 临时 DATA_DIR，覆盖追加与管理员修改/删除交错时的丢记录回归。 */
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";
import type { AuditEntry } from "../src/lib/types";

const root = await mkdtemp(join(tmpdir(), "gongdi-audit-transaction-"));
process.env.DATA_DIR = root;
after(() => rm(root, { recursive: true, force: true }));
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("~/")) {
      const base = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try { return nextResolve(base + ext, context); } catch {}
      }
    }
    return nextResolve(specifier, context);
  },
});
const A = await import("../src/lib/accounts.server");
const F = await import("../src/lib/nas-fs.server");
const P = await import("../src/lib/paths.server");
const { Route } = await import("../src/routes/api/audit");
type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = Route.options.server!.handlers as unknown as Record<"GET" | "POST" | "PUT" | "DELETE", Handler>;
const setup = await A.handleAuthPost(new Request("http://local/api/auth", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ op: "setup", username: "admin", password: "12345678", name: "并发管理员" }),
}));
assert.equal(setup.status, 200);
const cookie = setup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
const tenant = await A.resolveTenant(new Request("http://local/api/audit", { headers: { cookie } }));
assert.ok(tenant.bookId);
const bookId = tenant.bookId;
const auditFile = join(root, "books", bookId, "audit.json");

function request(method: "GET" | "POST" | "PUT" | "DELETE", body?: unknown, query = "") {
  return handlers[method]({ request: new Request(`http://local/api/audit${query}`, {
    method, headers: { cookie, "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }) });
}
function entry(id: string): AuditEntry {
  return { id, at: "2026-09-18T00:00:00.000Z", userId: "seed", userName: "测试", action: id, detail: "旧内容", module: "测试" };
}
async function seed(ids: string[]) {
  await P.runWithBook(bookId, () => F.writeAudit(ids.map(entry)));
}
async function rows() {
  const response = await request("GET");
  assert.equal(response.status, 200);
  return ((await response.json()) as { entries: AuditEntry[] }).entries;
}
function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

test("并发修改不同记录与追加：所有修改和新记录都保留", async () => {
  const ids = Array.from({ length: 12 }, (_, index) => `edit-${index}`);
  await seed(ids);
  const responses = await Promise.all(ids.flatMap((id) => [
    request("PUT", { id, detail: `修改 ${id}` }),
    request("POST", { action: `新增 ${id}`, module: "测试" }),
  ]));
  responses.forEach((response) => assert.equal(response.status, 200));
  const list = await rows();
  assert.equal(list.length, 24, "并发 PUT 不能用过期列表覆盖 POST 新增的记录");
  for (const id of ids) {
    assert.equal(list.find((row) => row.id === id)?.detail, `修改 ${id}`);
    assert.equal(list.filter((row) => row.action === `新增 ${id}`).length, 1);
  }
});

test("删除、修改、追加并发：各自结果保留，删除留痕不被本次删除或后续写覆盖", async () => {
  const ids = Array.from({ length: 6 }, (_, index) => `${index}`);
  await seed(ids.flatMap((id) => [`remove-${id}`, `keep-${id}`]));
  const responses = await Promise.all(ids.flatMap((id) => [
    request("DELETE", undefined, `?ids=remove-${id}`),
    request("PUT", { id: `keep-${id}`, detail: `保留 ${id}` }),
    request("POST", { action: `新增 ${id}`, module: "测试" }),
  ]));
  responses.forEach((response) => assert.equal(response.status, 200));
  const list = await rows();
  assert.equal(list.length, 18, "6 条保留、6 条新增、6 条删除留痕");
  for (const id of ids) {
    assert.equal(list.some((row) => row.id === `remove-${id}`), false);
    assert.equal(list.find((row) => row.id === `keep-${id}`)?.detail, `保留 ${id}`);
    assert.equal(list.filter((row) => row.action === `新增 ${id}`).length, 1);
    const trace = list.filter((row) => row.action === "删除操作记录" && row.detail.includes(`remove-${id}`));
    assert.equal(trace.length, 1);
    assert.equal(trace[0].userName, "并发管理员");
    assert.match(trace[0].detail, /删除 1 条/);
  }
});

test("空/坏审计仍拒绝修改删除；损坏内容不会被覆盖", async () => {
  await seed([]);
  for (const method of ["PUT", "DELETE"] as const)
    assert.equal((await request(method, method === "PUT" ? { id: "missing" } : undefined, "?ids=missing")).status, 409);
  const broken = "{ 损坏的审计文件";
  await writeFile(auditFile, broken);
  for (const method of ["PUT", "DELETE"] as const)
    assert.equal((await request(method, method === "PUT" ? { id: "missing" } : undefined, "?ids=missing")).status, 409);
  assert.equal((await request("POST", { action: "不能覆盖坏文件" })).status, 503);
  assert.equal(await readFile(auditFile, "utf8"), broken);
});

test("排队保持各自台账上下文；损坏台账不会污染另一本空台账", async () => {
  const started = gate();
  const release = gate();
  const first = P.runWithBook("audit-a", () => F.withAuditTransaction(async (tx) => {
    started.resolve();
    await release.promise;
    await tx.append({ action: "只属于 A" });
  }));
  await started.promise;
  const second = P.runWithBook("audit-b", () => F.appendAudit({ action: "只属于 B" }));
  release.resolve();
  await Promise.all([first, second]);
  assert.deepEqual((await P.runWithBook("audit-a", () => F.readAudit())).map((row) => row.action), ["只属于 A"]);
  assert.deepEqual((await P.runWithBook("audit-b", () => F.readAudit())).map((row) => row.action), ["只属于 B"]);

  const brokenPath = join(root, "books", "audit-a", "audit.json");
  await writeFile(brokenPath, "{ 坏 A");
  await P.runWithBook("audit-a", () => F.readAudit());
  assert.equal(P.runWithBook("audit-a", () => F.auditUnreadable()), true);
  await P.runWithBook("audit-empty", () => F.readAudit());
  assert.equal(P.runWithBook("audit-empty", () => F.auditUnreadable()), false);
  assert.equal(P.runWithBook("audit-a", () => F.auditUnreadable()), true, "其他台账读取不能清除 A 的坏文件标志");
  await Promise.all([
    P.runWithBook("audit-a", () => F.appendAudit({ action: "不能盖坏 A" })),
    P.runWithBook("audit-empty", () => F.appendAudit({ action: "空册第一条" })),
  ]);
  assert.equal(await readFile(brokenPath, "utf8"), "{ 坏 A");
  assert.deepEqual((await P.runWithBook("audit-empty", () => F.readAudit())).map((row) => row.action), ["空册第一条"]);
});

test("读取后业务失败不写盘、不阻塞后续队列；事务内追加与替换不死锁", async () => {
  await P.runWithBook("audit-recovery", async () => {
    await F.writeAudit([entry("keep")]);
    const results = await Promise.allSettled([
      F.withAuditTransaction(async (tx) => {
        assert.equal(tx.entries.length, 1);
        throw new Error("模拟读取后的业务失败");
      }),
      F.withAuditTransaction(async (tx) => {
        const trace = await tx.append({ action: "删除留痕" });
        await tx.replace(tx.entries.filter((row) => row.id === trace.id));
      }),
      F.appendAudit({ action: "后续追加" }),
    ]);
    assert.deepEqual(results.map((result) => result.status), ["rejected", "fulfilled", "fulfilled"]);
    assert.deepEqual((await F.readAudit()).map((row) => row.action), ["后续追加", "删除留痕"]);
  });
});
