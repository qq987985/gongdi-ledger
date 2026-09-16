/**
 * 台账传输压缩测试（性能：整本台账每次改动全量上传）。
 *
 * 为什么直接跑路由 handler 而不是只做文本守卫：压缩/解压是有真有假的字节流行为
 * （gzip 头、多重编码、坏字节），只有拿真实 Request/Response 跑一遍才算验证过。
 * Route.options.server.handlers 是 TanStack 生成的真实 handler，这里用 `~/*` 别名解析钩子
 * 把源码当模块 import（与打包器口径一致），账户/权限走真实的 handleAuthPost。
 *
 * 覆盖：gzip 上行、gzip 下行、未压缩向后兼容、坏 gzip → 400（不是 500）、
 * 未知编码 → 400、反代多重 gzip 头安全回退、CAS 409、坏文件 503 不受影响。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";
import { gunzipSync, gzipSync } from "node:zlib";

const root = await mkdtemp(join(tmpdir(), "gongdi-ledger-transfer-"));
process.env.DATA_DIR = root;

// 源码里用 `~/*` 别名（打包器习惯），node 直接跑测试要映射到 src/ 并补扩展名
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("~/")) {
      const base = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try {
          return nextResolve(base + ext, context);
        } catch {
          // 试下一个后缀
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

const A = await import("../src/lib/accounts.server");
const { Route } = await import("../src/routes/api/ledger");

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = Route.options.server!.handlers as unknown as { GET: Handler; PUT: Handler };

/** 100 人 × 3 年考勤量级：接近中等工地的真实台账体积 */
function buildLedger() {
  const YEARS = [2023, 2024, 2025];
  const PEOPLE = 100;
  const people = Array.from({ length: PEOPLE }, (_, i) => ({
    id: `p${i + 1}`,
    name: `张三${i + 1}`,
    team: `木工${(i % 8) + 1}班`,
    personNo: String(1000 + i),
    idCard: `11010119900101${String(1000 + i).slice(-4)}`,
    gender: i % 2 === 0 ? "男" : "女",
    age: 30 + (i % 20),
    birthday: "1990-01-01",
    phone: `138${String(i).padStart(8, "0")}`,
    dailyWage: 320 + (i % 5) * 10,
    monthWage: 0,
    payType: "day",
    otRule: "平时1.5倍/周末2倍",
    mealAllowance: 20,
    wageHistory: [
      {
        id: `w${i + 1}`,
        fromDate: "2023-01-01",
        payType: "day",
        dailyWage: 300 + (i % 5) * 10,
        monthWage: 0,
        otRule: "平时1.5倍/周末2倍",
        mealAllowance: 20,
        remark: "",
      },
    ],
    bank: "中国建设银行XX支行",
    cardNo: `622700000000${String(i).padStart(4, "0")}`,
    address: "XX省XX市XX区XX路XX号XX小区X栋X单元",
    idIssuer: "XX市公安局XX分局",
    idValidFrom: "2015-01-01",
    idValidTo: "2035-01-01",
    remark: "",
  }));
  const attendance: Record<string, unknown>[] = [];
  const payments: Record<string, unknown>[] = [];
  for (const year of YEARS)
    for (const p of people)
      for (let month = 1; month <= 12; month += 1) {
        attendance.push({
          id: `${p.id}-${year}-${month}`,
          year,
          month,
          name: p.name,
          team: p.team,
          days: 22 + (month % 4),
          otHours: (month % 3) * 8,
          allowance: 440,
          deduction: 0,
          remark: month === 2 ? "春节放假" : "",
        });
        payments.push({
          id: `pay-${p.id}-${year}-${month}`,
          owner: p.name,
          receiver: p.name,
          date: `${year}-${String(month).padStart(2, "0")}-10`,
          amount: 7000 + (month % 5) * 300,
          source: "中国建设银行XX支行",
          remark: "",
        });
      }
  return {
    schemaVersion: 2,
    year: 2025,
    years: YEARS,
    people,
    attendance,
    attendanceDocs: [],
    payments,
    contracts: [],
    contractEntries: [],
    expenses: [],
    insurancePolicies: [],
    insuranceMembers: [],
    accessHash: "",
  };
}

const payload = buildLedger();
const RAW = Buffer.from(JSON.stringify(payload), "utf8");
const GZ = gzipSync(RAW);

/** 建管理员 + 登录（与浏览器第一次打开时的 setup 同一入口） */
const setupRes = await A.handleAuthPost(
  new Request("http://local/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "setup", username: "admin", password: "12345678", name: "管理员" }),
  }),
);
assert.equal(setupRes.status, 200, "测试前置：建管理员必须成功");
const cookie = (setupRes.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .filter(Boolean)
  .join("; ");
assert.ok(cookie, "测试前置：setup 必须返回会话 cookie");

interface CallOpts {
  body?: string | Uint8Array;
  headers?: Record<string, string>;
}
function call(method: "GET" | "PUT", opts: CallOpts = {}): Promise<Response> {
  const headers: Record<string, string> = { cookie, ...(opts.headers || {}) };
  const init: RequestInit = { method, headers };
  // Uint8Array<ArrayBufferLike> 与 BodyInit 在新版 TS 里不完全兼容，这里做一次显式收窄
  if (opts.body !== undefined) init.body = opts.body as BodyInit;
  return handlers[method]({ request: new Request("http://local/api/ledger", init) });
}

async function currentRevision(): Promise<string> {
  const r = await call("GET");
  assert.equal(r.status, 200);
  await r.arrayBuffer();
  return r.headers.get("x-ledger-revision") || "";
}

test("压缩实测：100 人 × 3 年台账 JSON 的原始/压缩字节数", () => {
  const ratio = (GZ.length / RAW.length) * 100;
  console.log(
    `[台账压缩实测] 原始 ${RAW.length} B（${(RAW.length / 1024 / 1024).toFixed(2)} MB）` +
      ` → gzip ${GZ.length} B（${(GZ.length / 1024).toFixed(0)} KB），` +
      `压缩率 ${ratio.toFixed(1)}%，省掉 ${(100 - ratio).toFixed(1)}%`,
  );
  assert.ok(RAW.length > 1024 * 1024, `构造数据应达到中等工地量级（>1MB），实际 ${RAW.length} B`);
  assert.ok(GZ.length < RAW.length / 2, "gzip 至少应省掉一半以上");
});

test("上行 gzip + 下行 gzip：PUT 200 → GET 200 且解压后人数/条数正确", async () => {
  const put = await call("PUT", { body: GZ, headers: { "content-encoding": "gzip", "if-match": "" } });
  assert.equal(put.status, 200);
  const rev = put.headers.get("x-ledger-revision") || "";
  assert.ok(rev, "PUT 必须回 X-Ledger-Revision");

  const get = await call("GET", { headers: { "accept-encoding": "gzip" } });
  assert.equal(get.status, 200);
  assert.equal(get.headers.get("content-encoding"), "gzip", "客户端接受 gzip 时必须压缩下发");
  assert.equal(get.headers.get("x-ledger-revision"), rev, "压缩不能丢掉 X-Ledger-Revision");
  assert.equal(get.headers.get("vary"), "Accept-Encoding");
  const decoded = JSON.parse(gunzipSync(Buffer.from(await get.arrayBuffer())).toString("utf8")) as typeof payload & {
    persist?: boolean;
  };
  assert.equal(decoded.persist, true);
  assert.equal(decoded.people.length, 100);
  assert.equal(decoded.attendance.length, 3600);
  assert.equal(decoded.payments.length, 3600);

  // 同一次读取走未压缩分支，内容必须一致（老客户端兼容）
  const plain = await call("GET");
  assert.equal(plain.status, 200);
  assert.equal(plain.headers.get("content-encoding"), null);
  const plainJson = (await plain.json()) as typeof payload;
  assert.equal(plainJson.people.length, 100);
  assert.equal(plainJson.attendance.length, 3600);
});

test("下行：accept-encoding 缺省或 gzip;q=0 时不压缩，内容照样可读", async () => {
  const none = await call("GET");
  assert.equal(none.headers.get("content-encoding"), null);
  const q0 = await call("GET", { headers: { "accept-encoding": "gzip;q=0" } });
  assert.equal(q0.status, 200);
  assert.equal(q0.headers.get("content-encoding"), null, "q=0 = 明确不要 gzip");
  const j = (await q0.json()) as typeof payload;
  assert.equal(j.people.length, 100);
  // * 也视为接受
  const star = await call("GET", { headers: { "accept-encoding": "*" } });
  assert.equal(star.headers.get("content-encoding"), "gzip");
});

test("未压缩 PUT 仍然 200（向后兼容老客户端/老浏览器）", async () => {
  const rev = await currentRevision();
  const small = { ...payload, people: payload.people.slice(0, 3), attendance: [], payments: [] };
  const put = await call("PUT", {
    body: JSON.stringify(small),
    headers: { "content-type": "application/json", "if-match": rev },
  });
  assert.equal(put.status, 200);
  assert.ok(put.headers.get("x-ledger-revision"));
});

test("CAS 语义不变：旧 revision 保存 → 409", async () => {
  const stale = await currentRevision();
  const ok = await call("PUT", {
    body: JSON.stringify({ ...payload, people: payload.people.slice(0, 1) }),
    headers: { "content-type": "application/json", "if-match": stale },
  });
  assert.equal(ok.status, 200);
  const again = await call("PUT", {
    body: JSON.stringify({ ...payload, people: payload.people.slice(0, 2) }),
    headers: { "content-type": "application/json", "if-match": stale },
  });
  assert.equal(again.status, 409, "同一个旧 revision 第二次写必须冲突");
});

test("坏 gzip：content-encoding 说是 gzip 但字节不是 → 400（可读原因，不是 500）", async () => {
  const r = await call("PUT", {
    body: Buffer.from('{"people":[]}', "utf8"),
    headers: { "content-encoding": "gzip", "if-match": await currentRevision() },
  });
  assert.equal(r.status, 400);
  const j = (await r.json()) as { error?: string; invalid?: boolean };
  assert.match(String(j.error), /解压失败/);
  assert.equal(j.invalid, true);
});

test("未知编码（br）→ 400，不崩、不误写", async () => {
  const r = await call("PUT", { body: Buffer.from("{}"), headers: { "content-encoding": "br" } });
  assert.equal(r.status, 400);
  assert.match(String(((await r.json()) as { error?: string }).error), /content-encoding/);
});

test("反代重复追加 content-encoding（gzip, gzip）但只压了一层 → 仍 200", async () => {
  const put = await call("PUT", {
    body: GZ,
    headers: { "content-encoding": "gzip, gzip", "if-match": await currentRevision() },
  });
  assert.equal(put.status, 200, "反代行为不能让保存失败");
});

test("gzip 解压后内容不过结构校验 → 仍然 400（校验语义未变）", async () => {
  const put = await call("PUT", {
    body: gzipSync(Buffer.from("{}", "utf8")),
    headers: { "content-encoding": "gzip", "if-match": await currentRevision() },
  });
  assert.equal(put.status, 400);
  assert.match(String(((await put.json()) as { error?: string }).error), /台账/);
});

test("坏台账文件：GET 仍 503（压缩不影响坏文件保护），且不压缩下发", async () => {
  const booksDir = join(root, "books");
  const bookId = (await readdir(booksDir))[0];
  const ledgerFile = join(booksDir, bookId, "ledger.json");
  await writeFile(ledgerFile, "{ 这不是合法 JSON", "utf8");
  try {
    const get = await call("GET", { headers: { "accept-encoding": "gzip" } });
    assert.equal(get.status, 503);
    assert.equal(get.headers.get("content-encoding"), null);
    const j = (await get.json()) as { corrupt?: boolean };
    assert.equal(j.corrupt, true);
  } finally {
    await writeFile(ledgerFile, JSON.stringify(payload, null, 2), "utf8");
  }
});
