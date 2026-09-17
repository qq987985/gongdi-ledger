/**
 * 导入入口的写入门禁（工作包 C 续，1.8.15）。
 *
 * 背景（本轮核查发现，与 A 组第 17 项同型）：导入写的是**整本台账** —— 服务端 `PUT /api/ledger`
 * 要 `ledger.manage`，而导入页的门槛只是 `import.use`。自定义权限的账号只勾了「导入」时，
 * 界面会一路弹「导入完成 / 已导入 N 条」而服务端 403：改动只活在本机内存、刷新即丢，
 * 用户以为恢复/导入成功了，其实什么都没落盘（备份恢复场景下这条最致命）。
 *
 * 修法：7 个导入入口（人员 / 考勤 / 发放 / 报销 / 合同 / 保险人员 / 整本）在**写盘之前**统一过
 * `lib/readonly.ts` 的 `blockedImport()`（判据 `canSaveToServer("import.use")` = 与服务端
 * `ledger.manage` 同源；文案也只有 readonly.ts 一处）。上传按钮（`ExcelBtn`）在弹「确认上传」
 * 之前就先拦，只读账号连确认框都看不到。
 *
 * 这份测试做两件事：
 *  ① 源码守卫：7 个入口都有门禁、且在第一次写 store 之前；批量扫描类断言带命中数下限自检；
 *  ② 真实路由断言：拿真账号（只读 / 只勾导入 / 考勤发放）打真实 `PUT /api/ledger`，
 *     断言「客户端门禁 ⟺ 服务端拒绝」且被拒时 ledger.json 一个字节都没变。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerHooks } from "node:module";
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";

const rootDir = await mkdtemp(join(tmpdir(), "gongdi-import-guard-"));
process.env.DATA_DIR = rootDir;

// 组件/路由里用的是 `~/` 别名（与 tests/tenant-book-scope.test.ts 同一套钩子）
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
const LEDGER = await import("../src/routes/api/ledger");
const RO = await import("../src/lib/readonly");
const PERMS = await import("../src/lib/perms");

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const read = (p: string) => readFile(repo(p), "utf8");

/* ───────────── 一、源码守卫：7 个导入入口都要有门禁，且在写盘之前 ───────────── */

/** 七类导入：人员 / 考勤 / 发放 / 报销 / 合同 / 保险人员 / 整本 */
const IMPORT_COMPONENTS = ["PeopleImport", "AttendanceImport", "PaymentImport", "ExpenseImport", "ContractImport", "InsuranceMemberImport", "FullBookImport"];
/** 组件里对 store 的写调用（读 `store.year` 之类不算） */
const STORE_WRITE = /store\.(replace|add|set|upsert|remove)\w*\(/;

test("导入门禁：7 个导入入口都必须在写盘前调用 blockedImport()（唯一实现）", async () => {
  const src = await read("src/components/excel-import.tsx");
  const comps = [...src.matchAll(/export function (\w+Import)\(/g)];
  expectMinHits("导入组件数", comps.length, 7, "人员/考勤/发放/报销/合同/保险人员/整本 共 7 个");
  const found = comps.map((m) => m[1]);
  for (const name of IMPORT_COMPONENTS)
    assert.ok(found.includes(name), `少了导入入口 ${name}（清单与源码对不上）`);

  const missing: string[] = [];
  const tooLate: string[] = [];
  let withWrite = 0;
  for (const [i, m] of comps.entries()) {
    const start = m.index ?? 0;
    const end = i + 1 < comps.length ? comps[i + 1].index ?? src.length : src.length;
    const body = src.slice(start, end);
    const gate = body.indexOf("blockedImport()");
    const write = body.search(STORE_WRITE);
    if (write >= 0) withWrite += 1;
    if (gate < 0) missing.push(m[1]);
    else if (write >= 0 && gate > write) tooLate.push(m[1]);
  }
  expectMinHits("含 store 写调用的导入组件数", withWrite, 7, "7 个入口都会往 store 里写合并结果");
  assert.deepEqual(missing, [], `这些导入入口没有门禁 —— 只读账号会看到「导入完成」而服务端 403：${missing.join("、")}`);
  assert.deepEqual(tooLate, [], `门禁必须在第一笔写盘之前（否则数据已经改在本机内存里了）：${tooLate.join("、")}`);
  // 自检：调用点数不能是 0（文件改名/正则失效时上面两条会一条都不触发 = 假绿）
  expectMinHits("blockedImport() 调用点数", countHits(src, /blockedImport\(\)/), 7, "7 个入口各一处 + 上传按钮前置门禁，实际 8 处");
  expectRegexCatches(/blockedImport\(\)/, "if (blockedImport()) return;", "导入门禁调用正则");
});

test("导入门禁：上传按钮在弹「确认上传」之前就拦下（只读账号不该先看到确认框）", async () => {
  const src = await read("src/components/excel-import.tsx");
  const start = src.indexOf("function ExcelBtn(");
  expectMinHits("ExcelBtn 定义位置", start >= 0 ? 1 : 0, 1, "导入按钮是 excel-import.tsx 里的 ExcelBtn");
  const seg = src.slice(start, src.indexOf("export function TplLink("));
  const gate = seg.indexOf("blockedImport()");
  // 只在「真的调用确认框」上比顺序（注释里也会提到确认框，用调用形态定位，别被注释骗了）
  const confirmAt = seg.indexOf("confirm(`确认上传");
  expectMinHits("ExcelBtn 里的门禁调用", gate >= 0 ? 1 : 0, 1, "按钮级前置门禁");
  expectMinHits("ExcelBtn 里真的调用确认框", confirmAt >= 0 ? 1 : 0, 1, "正则失效时这条守卫要红，不能静默通过");
  assert.ok(gate < confirmAt, "顺序必须是 blockedImport() → confirm()：只读账号连确认框都不弹");
});

test("导入门禁：判据与文案只有一处实现（excel-import / import 页不许再写一份）", async () => {
  const ro = await read("src/lib/readonly.ts");
  assert.match(ro, /export function blockedImport\(\)/, "唯一实现是 lib/readonly.ts 的 blockedImport");
  assert.match(ro, /blockedWrite\("import\.use", permLabel\("import\.use"\)\)/, "内部必须走 blockedWrite + permLabel（判据与文案同一份）");
  const roTest = await read("tests/readonly.test.ts");
  expectMinHits("readonly 判据被测试引用", countHits(roTest, /canSaveToServer/), 1, "只读判据早就有单测（tests/readonly.test.ts）");
  // 导入相关文件里不许出现自己拼的只读文案（原来整本导入就是自己写了一段）
  for (const f of ["src/components/excel-import.tsx", "src/routes/import.tsx"]) {
    assert.equal(
      (await read(f)).includes("你是只读账号"),
      false,
      `${f} 里自己拼了只读文案 —— 文案与判据都要走 lib/readonly.ts 的 blockedImport`,
    );
  }
});

/* ───────────── 二、真实路由断言：界面拦下的，服务端也必须拒（且不落盘） ───────────── */

const ledgerPath = join(rootDir, "books", "default", "ledger.json");

/** ledger.json 的字节指纹（不存在 → "(无)"）：用来断言「一个字节都没变」 */
async function fingerprint(): Promise<string> {
  if (!existsSync(ledgerPath)) return "(无)";
  const buf = await readFile(ledgerPath);
  return `${buf.byteLength}:${createHash("sha256").update(buf).digest("hex")}`;
}

async function cookieOf(res: Response): Promise<string> {
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).filter(Boolean).join("; ");
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

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = LEDGER.Route.options.server!.handlers as unknown as { GET: Handler; PUT: Handler };

function callLedger(method: "GET" | "PUT", cookie: string, body?: unknown): Promise<Response> {
  return handlers[method]({
    request: new Request("http://local/api/ledger", {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  });
}

const payload = (tag: string) => ({
  year: 2026,
  years: [2026],
  people: [{ id: `p-${tag}`, name: tag }],
  attendance: [],
  payments: [],
});

/** 三种真实账号：只读 / 只勾了「导入」 / 真的能改台账（控制组） */
const ACCOUNTS = [
  { username: "u_read", name: "只读", perms: "people.view,attendance.view", expect: 403, why: "只读账号" },
  { username: "u_imp", name: "只勾导入", perms: "import.use", expect: 403, why: "有 import.use 但改不了整本（假成功的来源）" },
  {
    username: "u_hr",
    name: "考勤发放",
    perms: "people.view,people.edit,attendance.view,attendance.edit,import.use",
    expect: 200,
    why: "控制组：真能落盘的人不许被拦",
  },
] as const;

// ── 前置：管理员 + 三个账号（真实登录） + 一份已有台账 ──
const setup = await authPost({ op: "setup", username: "admin", password: "12345678", name: "管理员" });
assert.equal(setup.status, 200, "前置：建管理员");
const adminCookie = await cookieOf(setup);

const cookies: Record<string, string> = {};
for (const a of ACCOUNTS) {
  const created = await authPost(
    { op: "createUser", name: a.name, username: a.username, password: "12345678", joinCurrent: "0" },
    adminCookie,
  );
  assert.equal(created.status, 200, `前置：建账号 ${a.username}`);
  const list = (await created.json()) as { users?: { id: string; username: string }[] };
  const id = list.users?.find((u) => u.username === a.username)?.id || "";
  assert.ok(id, `前置：${a.username} 要有 id`);
  const added = await authPost({ op: "addMember", id: "default", userId: id, perms: a.perms }, adminCookie);
  assert.equal(added.status, 200, `前置：把 ${a.username} 加进默认台账（perms=${a.perms}）`);
  const login = await authPost({ op: "login", username: a.username, password: "12345678" });
  assert.equal(login.status, 200, `前置：${a.username} 登录`);
  cookies[a.username] = await cookieOf(login);
}
const seeded = await callLedger("PUT", adminCookie, payload("SEED"));
assert.equal(seeded.status, 200, "前置：管理员先写一份台账（这样「没被动过」才有指纹可比）");

test("前置：有 people.view 的成员读得到台账（说明后面的 403 是权限判定，不是台账不可见）", async () => {
  const ok = await callLedger("GET", cookies["u_read"]);
  assert.equal(ok.status, 200, "u_read 有 people.view，读得到");
  const denied = await callLedger("GET", cookies["u_imp"]);
  assert.equal(denied.status, 403, "u_imp 只有 import.use，连读都读不到（本轮只处理写入门禁）");
});

for (const a of ACCOUNTS) {
  test(`导入门禁（真实路由）：${a.username}（perms=${a.perms}）整本写入 = ${a.expect}，客户端门禁与服务端判定一致`, async () => {
    const before = await fingerprint();
    const put = await callLedger("PUT", cookies[a.username], payload(`TRY-${a.username}`));
    assert.equal(put.status, a.expect, `${a.why}`);

    // 界面在「点确认」那一刻用的就是 blockedImport()：必须与服务端判定完全一致
    PERMS.setLivePerms(a.perms.split(","));
    assert.equal(
      RO.blockedImport(),
      put.status === 403,
      "客户端拦下 ⟺ 服务端拒绝（不许出现「界面说导入完成、服务端 403」的假成功）",
    );

    if (put.status === 403) {
      assert.equal(await fingerprint(), before, "被拒的导入不许改动 ledger.json（一个字节都不行）");
      const j = (await put.json()) as { error?: string };
      assert.match(String(j.error || ""), /权限/, "服务端的 403 要给出可读原因");
      const hint = RO.readonlyHint(PERMS.permLabel("import.use"));
      assert.match(hint, /你是只读账号/, "界面原因：说清是只读账号");
      assert.match(hint, /改动不会保存/, "界面原因：说清改动不会保存");
      assert.match(hint, /导入/, "界面原因：说清缺的是「导入」权限");
    }
  });
}

test("导入门禁（真实路由）：真能落盘的账号写进去的就是他导入的那份数据（门禁不是把所有人都拦死）", async () => {
  const j = JSON.parse(await readFile(ledgerPath, "utf8")) as { people?: { name: string }[] };
  assert.equal(j.people?.[0]?.name, "TRY-u_hr", "u_hr（people.edit + import.use）的写入必须真的落盘");
});

test("导入门禁：守卫本身要真的会拦（拿坏样本证明判据不是永远 false）", () => {
  PERMS.setLivePerms(["people.view", "attendance.view"]);
  assert.equal(RO.blockedImport(), true, "只读权限必须拦下");
  PERMS.setLivePerms(["people.view", "people.edit", "import.use"]);
  assert.equal(RO.blockedImport(), false, "能落盘的账号必须放行（否则就是「谁都不能导入」的假绿）");
  PERMS.setLivePerms(["*"]);
  assert.equal(RO.blockedImport(), false, "管理员/创建人（*）放行");
});
