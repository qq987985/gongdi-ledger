/**
 * A2（专家评审 20260917）：PUT 响应头的版本号必须与 GET / CAS **同源**。
 *
 * 复现的缺陷：`PUT /api/ledger` 原来用**请求体**算版本号
 *   `response.headers.set("X-Ledger-Revision", ledgerRevisionValue(body))`
 * 而 GET 与 CAS 基准都走「服务端读视图」（`readLedger()` 会先 `reconcileContractScans()`
 * 把磁盘上存在的合同扫描件名补进视图，只补内存、不回写）。于是只要
 * 「磁盘上有某合同的扫描件、客户端 body 里该合同 scanFileName 为空」，
 * 客户端存下的基准就**永远**对不上 → 下一次保存必然 409「已被其他设备修改」，
 * 而那个弹窗诱导用户点「以本机覆盖」→ 真丢别人的改动。
 *
 * 这里用真实 Route handler 复现整条链路：造出上述 fixture，连续两次 PUT（第二次带第一次
 * 返回的头）必须成功。旧代码在这条用例上必然 409（见文件末尾的注释：本地实测
 * 「PUT#2 用服务端自己刚返回的头 → 409」）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";

const root = await mkdtemp(join(tmpdir(), "gongdi-revision-source-"));
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
const N = await import("../src/lib/nas-fs.server");
const LEDGER = await import("../src/routes/api/ledger");

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = LEDGER.Route.options.server!.handlers as unknown as { GET: Handler; PUT: Handler };

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

/** 磁盘上放一份「甲项目-合同电子版.pdf」扫描件（历史公共目录，读时会被回落认出来） */
const scanDir = join(root, "photos", "合同扫描件");
await mkdir(scanDir, { recursive: true });
await writeFile(join(scanDir, "示例住宅A区-合同电子版.pdf"), "PDF", "utf8");

/** body 里 scanFileName 为空（Excel 导入合同 / 只放了扫描件没点上传，都是这个形状） */
const body = {
  schemaVersion: 2,
  year: 2026,
  years: [2026],
  people: [{ id: "p1", name: "张三" }],
  attendance: [],
  payments: [],
  contracts: [{ id: "c1", name: "示例住宅A区", scanFileName: "" }],
};

function call(method: "GET" | "PUT", opts: { body?: unknown; ifMatch?: string } = {}): Promise<Response> {
  const headers: Record<string, string> = { cookie, "content-type": "application/json" };
  if (opts.ifMatch !== undefined) headers["if-match"] = opts.ifMatch;
  return handlers[method]({
    request: new Request("http://local/api/ledger", {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
  });
}

test("A2：PUT 返回的版本号 == 紧接着 GET 的版本号（同源）,且用的是服务端读视图", async () => {
  const put = await call("PUT", { body, ifMatch: "" });
  assert.equal(put.status, 200, "第一笔保存必须成功（空台账哨兵 \"\"）");
  const rev1 = put.headers.get("x-ledger-revision") || "";
  assert.ok(rev1, "PUT 必须回 X-Ledger-Revision");

  const get = await call("GET");
  assert.equal(get.status, 200);
  const view = (await get.json()) as { contracts?: { scanFileName?: string }[] };
  assert.equal(
    view.contracts?.[0]?.scanFileName,
    "示例住宅A区-合同电子版.pdf",
    "服务端读视图里应该补上扫描件名（视图 ≠ 磁盘内容，这正是原来假冲突的来源）",
  );
  assert.equal(get.headers.get("x-ledger-revision"), rev1, "PUT 与 GET 的版本号必须同源");

  // 反证：如果按**请求体**算，得到的版本号与 rev1 不同 —— 即旧实现必然让客户端存下错基准
  assert.notEqual(
    N.ledgerRevisionOf(body),
    rev1,
    "请求体的 hash 必须与读视图的 hash 不同（否则这条 fixture 复现不了旧缺陷）",
  );

  // 磁盘上该合同的 scanFileName 仍然是空（补名只进内存视图，读路径不回写文件）
  const onDisk = JSON.parse(await readFile(join(root, "books", "default", "ledger.json"), "utf8")) as {
    contracts?: { scanFileName?: string }[];
  };
  assert.equal(onDisk.contracts?.[0]?.scanFileName, "", "读路径不得回写文件（补名只在内存视图）");
});

test("A2：用上一次 PUT 返回的头做 if-match 再存一次 → 200（旧实现必 409）", async () => {
  const first = await call("PUT", { body });
  assert.equal(first.status, 200);
  const rev1 = first.headers.get("x-ledger-revision") || "";
  assert.ok(rev1);

  const second = await call("PUT", { body, ifMatch: rev1 });
  assert.equal(
    second.status,
    200,
    "同一份 body 再存一次必须成功：客户端拿 PUT 返回的头当基准（nas-sync.ts），假冲突会诱导用户覆盖别人的改动",
  );
  assert.equal(second.headers.get("x-ledger-revision"), rev1, "内容没变，版本号也不该变");
});

test("A2：连续保存 5 次都不产生假冲突（模拟自动保存的节奏）", async () => {
  let rev = (await call("PUT", { body })).headers.get("x-ledger-revision") || "";
  assert.ok(rev);
  for (let i = 0; i < 5; i += 1) {
    const r = await call("PUT", { body: { ...body, year: 2026, years: [2025, 2026] }, ifMatch: rev });
    assert.equal(r.status, 200, `第 ${i + 1} 次连续保存不该 409`);
    rev = r.headers.get("x-ledger-revision") || "";
    assert.ok(rev);
  }
});

test("A2：真冲突照旧 409（同源口径没有把 CAS 磨平）", async () => {
  const stale = (await call("PUT", { body })).headers.get("x-ledger-revision") || "";
  const ok = await call("PUT", {
    body: { ...body, people: [{ id: "p1", name: "李四" }] },
    ifMatch: stale,
  });
  assert.equal(ok.status, 200);
  const again = await call("PUT", { body, ifMatch: stale });
  assert.equal(again.status, 409, "旧版本号第二次写必须冲突");
});
