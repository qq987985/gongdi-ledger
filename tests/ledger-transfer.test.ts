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
import { mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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

// ─────────────────────── 1.8.4：解压炸弹防护 / LEDGER_MAX_MB ───────────────────────

/** 当前台账文件（books/{id}/ledger.json）的字节数与内容指纹 */
async function ledgerFileSnapshot(): Promise<{ path: string; bytes: number; hash: string }> {
  const bookId = (await readdir(join(root, "books")))[0];
  const path = join(root, "books", bookId, "ledger.json");
  const buf = await readFile(path);
  return { path, bytes: buf.byteLength, hash: createHash("sha256").update(buf).digest("hex") };
}

async function todayLogText(): Promise<string> {
  const day = new Date().toISOString().slice(0, 10);
  try {
    return await readFile(join(root, "logs", `${day}.log`), "utf8");
  } catch {
    return "";
  }
}

test("解压炸弹：压缩后的 100MB 全零数据 → 413，且 books/*/ledger.json 一个字节都没动", async () => {
  delete process.env.LEDGER_MAX_MB;
  const before = await ledgerFileSnapshot();
  // 100MB 全零压成 ~100KB：content-length 粗筛挡不住，必须靠解压时的 maxOutputLength
  const bomb = gzipSync(Buffer.alloc(100 * 1024 * 1024));
  console.log(`[解压炸弹实测] 100MB 全零 → gzip ${bomb.length} B（${(bomb.length / 1024).toFixed(0)} KB）`);
  assert.ok(bomb.length < 1024 * 1024, "构造前提：压缩后必须远小于 32MB，否则测的就不是解压路径");

  const r = await call("PUT", {
    body: bomb,
    headers: { "content-encoding": "gzip", "if-match": await currentRevision() },
  });
  assert.equal(r.status, 413, "解压后超过上限必须是 413（不是 500，也不是静默成功）");
  const j = (await r.json()) as { error?: string; tooLarge?: boolean };
  assert.match(String(j.error), /超过服务器上限/, "要给用户可读原因");
  assert.equal(j.tooLarge, true);

  const after = await ledgerFileSnapshot();
  assert.equal(after.bytes, before.bytes, "被拒的写入绝不能改台账文件大小");
  assert.equal(after.hash, before.hash, "被拒的写入绝不能改台账内容");
  assert.match(await todayLogText(), /解压\/解析后超过上限/, "拒绝要留 warn 日志（可事后查）");
});

test("上限可用 LEDGER_MAX_MB 覆盖：设 1MB 时 2MB 的未压缩台账 → 413，且不写盘", async () => {
  process.env.LEDGER_MAX_MB = "1";
  try {
    const before = await ledgerFileSnapshot();
    const big = { ...payload, pad: "x".repeat(2 * 1024 * 1024) };
    const body = Buffer.from(JSON.stringify(big), "utf8");
    assert.ok(body.byteLength > 1024 * 1024, `构造数据应超过 1MB 上限，实际 ${body.byteLength} B`);
    const r = await call("PUT", {
      body,
      headers: { "content-type": "application/json", "if-match": await currentRevision() },
    });
    assert.equal(r.status, 413);
    const after = await ledgerFileSnapshot();
    assert.equal(after.hash, before.hash, "超限请求不得写盘");
  } finally {
    delete process.env.LEDGER_MAX_MB;
  }
});

test("正常量级（~1MB）走 gzip 上行 → 200，落盘内容与提交的一致", async () => {
  delete process.env.LEDGER_MAX_MB;
  const pad = "正".repeat(340_000); // 3 字节/字 → ~1MB，加上其余字段略超 1MB
  const body = { ...payload, people: payload.people.slice(0, 5), attendance: [], payments: [], pad };
  const raw = JSON.stringify(body);
  const rawBytes = Buffer.byteLength(raw, "utf8");
  assert.ok(rawBytes > 900 * 1024, `构造数据应接近 1MB，实际 ${rawBytes} B`);
  const put = await call("PUT", {
    body: gzipSync(Buffer.from(raw, "utf8")),
    headers: { "content-encoding": "gzip", "if-match": await currentRevision() },
  });
  assert.equal(put.status, 200, await put.clone().text());

  const onDisk = JSON.parse(await readFile((await ledgerFileSnapshot()).path, "utf8")) as {
    pad?: string;
    people?: unknown[];
  };
  assert.equal(onDisk.pad, pad, "1MB 级内容必须原样落盘（不是被截断/改写）");
  assert.equal(onDisk.people?.length, 5);
});

// ─────────────────────── 1.8.4：LEDGER_GZIP=off 开关 ───────────────────────

test("内置开关解析：只有 off/0/false/no（大小写容忍）关压缩，其余（含乱写）保持默认开", async () => {
  const T = await import("../src/lib/ledger-transfer");
  for (const raw of [undefined, "", "  ", "on", "true", "yes", "随便写"]) {
    assert.equal(T.parseGzipSwitch(raw), true, `${String(raw)} 应保持默认开`);
  }
  for (const raw of ["off", "OFF", " off ", "0", "false", "False", "no", "disable"]) {
    assert.equal(T.parseGzipSwitch(raw), false, `${String(raw)} 应关压缩`);
  }
  assert.equal(T.DEFAULT_LEDGER_MAX_MB, 32, "解压上限默认 32MB");
  assert.equal(T.parseLedgerMaxMb(undefined), 32);
  assert.equal(T.parseLedgerMaxMb("64"), 64);
  assert.equal(T.parseLedgerMaxMb("abc"), 32);
  assert.equal(T.parseLedgerMaxMb("-1"), 32);
  assert.equal(T.parseLedgerMaxMb("999999"), 4096, "上限封顶");
  assert.equal(T.ledgerMaxBytes("32"), 32 * 1024 * 1024);
});

test("LEDGER_GZIP=off：GET 不压缩下发；上行不压缩照常 200；服务端仍接受 gzip 老客户端", async () => {
  const H = await import("../src/routes/api/health");
  type HealthHandler = () => Promise<Response>;
  const health = (H.Route.options.server!.handlers as unknown as { GET: HealthHandler }).GET;
  process.env.LEDGER_GZIP = "off";
  try {
    // 1) health 告诉客户端「上行别压」
    const h = (await (await health()).json()) as { persist?: boolean; ledgerGzip?: boolean };
    assert.equal(h.ledgerGzip, false, "LEDGER_GZIP=off 要如实告诉客户端");

    // 2) 下行：客户端明明接受 gzip，也不压
    const get = await call("GET", { headers: { "accept-encoding": "gzip" } });
    assert.equal(get.status, 200);
    assert.equal(get.headers.get("content-encoding"), null, "off 时下行不得压缩");
    const j = (await get.json()) as { people?: unknown[] };
    assert.ok((j.people?.length ?? 0) > 0, "不压缩也要能正常解析");

    // 3) 上行未压缩：200
    const rev = await currentRevision();
    const plain = await call("PUT", {
      body: JSON.stringify({ ...payload, people: payload.people.slice(0, 4), attendance: [], payments: [] }),
      headers: { "content-type": "application/json", "if-match": rev },
    });
    assert.equal(plain.status, 200, "off 时未压缩上传必须正常");

    // 4) 上行仍带 gzip（老客户端/缓存了旧 JS 的浏览器）：照样 200 —— 开关不能把老客户端打挂
    const gz = await call("PUT", {
      body: gzipSync(Buffer.from(JSON.stringify({ ...payload, people: payload.people.slice(0, 2) }), "utf8")),
      headers: { "content-encoding": "gzip", "if-match": await currentRevision() },
    });
    assert.equal(gz.status, 200, "服务端必须仍然接受 gzip 请求体（新旧客户端互通）");
  } finally {
    delete process.env.LEDGER_GZIP;
  }
  // 恢复默认后立刻又压缩下发（开关是每次调用读环境变量）
  const back = await call("GET", { headers: { "accept-encoding": "gzip" } });
  assert.equal(back.headers.get("content-encoding"), "gzip");
  assert.equal(((await (await health()).json()) as { ledgerGzip?: boolean }).ledgerGzip, true);
});

test("content-length 粗筛：老实报了大体积的请求在读音之前就被挡掉（413）", async () => {
  delete process.env.LEDGER_MAX_MB;
  const before = await ledgerFileSnapshot();
  // 手工指定 content-length（Node 的 fetch 会按真实 body 覆盖，所以这里直接构 Request 的 header 不生效，
  // 改用真实的 33MB 未压缩 body —— 超过默认 32MB 上限）
  const big = Buffer.from(JSON.stringify({ ...payload, pad: "y".repeat(33 * 1024 * 1024) }), "utf8");
  const r = await call("PUT", {
    body: big,
    headers: { "content-type": "application/json", "if-match": await currentRevision() },
  });
  assert.equal(r.status, 413);
  assert.match(String(((await r.json()) as { error?: string }).error), /超过服务器上限/);
  assert.equal((await ledgerFileSnapshot()).hash, before.hash, "超限请求不得写盘");
});
