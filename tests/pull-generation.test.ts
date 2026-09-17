/**
 * G1 / G3 回归（专家评审 20260917：架构师 A15「在途 pull 覆盖」、B18「flush 结果没人读」）。
 *
 * **复现的缺陷（A15，评审已跑通）**：切到台账 B 并拉到 B 之后，**A 的迟到响应**才落地 ——
 * 内存被换回 A 的 3 人；500ms 后自动保存的整本 PUT 里带的就是「A 的人员 + 新录入」。
 * 根因：拉取侧既没有代际号也没有串行队列（推送侧早就有 `pushQueue` + `pullDepth`），
 * `dropLocalLedger()` 也不使在途请求失效。修法：`pullGen` 代际 + `pullQueue` 串行 +
 * 切册统一入口 `switchBook`（先 flush、再作废在途、再清本机、再拉）。
 *
 * **复现的缺陷（B18）**：`flushPendingLedger()` 返回 `Promise<void>` 且从不抛错 ⇒ 调用方
 * 分不清成败，切册照旧继续、`dropLocalLedger()` 一执行本机改动就没了。修法：返回
 * `ok / skipped / failed(原因)`，切册/新建/删除/删年度都读它，失败就中止并问用户。
 *
 * 这个文件用 **stub 的 fetch**（不连真服务器、不开浏览器）跑真实的 `nas-sync` + 真实 store：
 * 「A 慢、B 快」的时序由我们自己控制的 deferred 决定，断言最终内存 / 本机缓存 / 整本 PUT 里都是 B。
 */
import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { expectRegexCatches } from "./min-hits";

/* ───────────────────────── 浏览器环境替身（必须在 import 业务模块之前装好） ───────────────────────── */

const ls = new Map<string, string>();
const fakeLocalStorage = {
  getItem: (k: string) => ls.get(k) ?? null,
  setItem: (k: string, v: string) => void ls.set(k, String(v)),
  removeItem: (k: string) => void ls.delete(k),
  clear: () => ls.clear(),
  key: (i: number) => [...ls.keys()][i] ?? null,
  get length() {
    return ls.size;
  },
};
let confirmAnswer = true;
const confirmCalls: string[] = [];
function fakeConfirm(message: string): boolean {
  confirmCalls.push(message);
  return confirmAnswer;
}
// store 的 persist storage 在**模块求值时**看 `typeof window`，所以 window 必须在 import 之前就有
(globalThis as any).localStorage = fakeLocalStorage;
(globalThis as any).window = { setTimeout, clearTimeout, confirm: fakeConfirm, localStorage: fakeLocalStorage };
(globalThis as any).confirm = fakeConfirm;

/* ───────────────────────── fetch 桩：按册子返回数据，PUT 记录在案 ───────────────────────── */

interface Call {
  url: string;
  method: string;
  body: any;
  signal?: AbortSignal;
}
const calls: Call[] = [];
/** 服务器 cookie 现在指着哪本册子（`useBook` 会改它） */
let currentBook = "A";
/** 每本册子的服务器内容 */
const books: Record<string, any> = {};
/** PUT 的返回码（G3 用：让它一直失败） */
let putStatus = 200;
/** ledger GET 的返回码（G1 用：让「切册后拉新册」失败，考「上一本的迟到响应会不会画回屏幕」） */
let ledgerGetStatus = 200;
/**
 * 挂起的 ledger GET（deferred）：用来制造「A 慢」。
 *
 * 注意：这个桩**故意不认 AbortSignal**（虽然 nas-sync 会顺手中断在途请求）——
 * 这样「迟到的响应」一定会真的送回来，代际判断（G1 的核心）才被真正考到；
 * 浏览器里中断通常让它根本回不来（两道保险都在：signal 真的被 abort 也单独断言了）。
 */
let holdLedger = false;
interface Held {
  /** 请求发出那一刻的服务器内容（响应已经在路上，内容就定死了 —— 不能等放行时才读 books） */
  snapshot: any;
  resolve: (res: Response) => void;
}
let heldLedger: Held[] = [];

/** 服务器上这本台账还没有数据（GET 回 `{ empty: true }`） */
let emptyLedger = false;
function ledgerBody(book: string): any {
  if (emptyLedger) return { empty: true };
  const b = books[book] || { people: [] };
  return { schemaVersion: 2, year: 2026, years: [2026], ...b };
}
function ledgerResponse(book: string): Response {
  return new Response(JSON.stringify(ledgerBody(book)), {
    status: 200,
    headers: { "content-type": "application/json", "x-ledger-revision": `rev-${book}-${calls.length}` },
  });
}
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
/** 放行所有挂起的 ledger GET（响应内容 = 请求发出那一刻的快照，模拟「响应已经在路上」） */
function releaseHeldLedger(): void {
  const held = heldLedger;
  heldLedger = [];
  for (const h of held)
    h.resolve(
      new Response(JSON.stringify(h.snapshot), {
        status: 200,
        headers: { "content-type": "application/json", "x-ledger-revision": `rev-held-${calls.length}` },
      }),
    );
}

/** 等一个条件成立（等「请求真的发出去了」/「排队的拉取开跑了」），超时就抛错，不许永远挂住 */
async function until(cond: () => boolean, what: string, ms = 1500): Promise<void> {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error(`等不到：${what}`);
    await new Promise((r) => setTimeout(r, 1));
  }
}

async function stubFetch(url: unknown, init: RequestInit = {}): Promise<Response> {
  const method = String(init.method || "GET").toUpperCase();
  const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
  calls.push({ url: String(url), method, body, signal: init.signal ?? undefined });
  const u = String(url);
  if (u === "/api/health") return jsonResponse({ persist: true, ledgerGzip: false, backupKeep: 30 });
  if (u === "/api/ledger" && method === "GET") {
    if (ledgerGetStatus !== 200) return jsonResponse({ error: "服务器上的台账文件读取失败" }, ledgerGetStatus);
    if (holdLedger)
      return new Promise<Response>((resolve) => heldLedger.push({ snapshot: ledgerBody(currentBook), resolve }));
    return ledgerResponse(currentBook);
  }
  if (u === "/api/ledger" && method === "PUT") {
    if (putStatus !== 200) return jsonResponse({ error: "服务器上的台账文件读取失败" }, putStatus);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", "x-ledger-revision": `rev-put-${calls.length}` },
    });
  }
  if (u === "/api/audit") return jsonResponse({ ok: true });
  if (u === "/api/auth" && method === "GET")
    return jsonResponse({
      persist: true,
      needSetup: false,
      user: { id: "u1", name: "我", username: "me", role: "admin" },
      books: [
        { id: "A", name: "甲工地" },
        { id: "B", name: "乙工地" },
      ],
      bookId: currentBook,
      users: [],
      perms: ["*"],
      members: [],
    });
  if (u === "/api/auth" && method === "POST") {
    const op = String(body?.op || "");
    if (op === "useBook") currentBook = String(body.id);
    return jsonResponse({ ok: true, bookId: currentBook });
  }
  throw new Error(`stub fetch 没实现：${method} ${u}`);
}
(globalThis as any).fetch = stubFetch;

/* ───────────────────────── 真实业务模块（在环境装好之后 import） ───────────────────────── */

const { useApp, emptyState } = await import("../src/lib/store");
const { setNasEnabled } = await import("../src/lib/nas-flag");
const SYNC = await import("../src/lib/nas-sync");
const { checkCacheOwner } = SYNC;

function p(name: string, id = name) {
  return {
    id,
    name,
    team: "一班",
    personNo: "",
    idCard: "",
    gender: "",
    age: null,
    birthday: "",
    phone: "",
    dailyWage: 0,
    monthWage: 0,
    payType: "day" as const,
    otRule: "",
    mealAllowance: 0,
    bank: "",
    cardNo: "",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
  };
}
const names = (list: { name: string }[]) => list.map((x) => x.name).join(",");
/** 本机 localStorage 里那份快照里的人员（=「本机缓存」） */
function cachedPeople(): string {
  const raw = fakeLocalStorage.getItem("gongdi-ledger-v5");
  if (!raw) return "(无缓存)";
  const j = JSON.parse(raw);
  return names((j?.state?.people || []) as { name: string }[]);
}
const flush = () => new Promise((r) => setTimeout(r, 0));

before(async () => {
  setNasEnabled(true);
  books.A = { people: [p("A人员0"), p("A人员1"), p("A人员2")] };
  books.B = { people: [p("B人员0"), p("B人员1")] };
  // 自动保存的订阅只装一次（装两次会多一份 dirty 监听）
  await SYNC.startNasSync();
});
beforeEach(async () => {
  // 上一个用例如果断言失败在半路，可能留着「挂起的 ledger 请求」把串行队列堵死 —— 先放行干净，
  // 否则后面每个用例都会连着一个永远不落地的请求（本文件第一版就踩过：4 个用例连着超时）。
  holdLedger = false;
  releaseHeldLedger();
  await flush();
  // 用 dropLocalLedger 重置：它会把 dirty 一起清掉。直接 setAll 会被当成「本机有改动」，
  // 下面 seedA() 的拉取就会弹「会覆盖这些改动」的确认框（假脏标记，让用例误判）。
  SYNC.dropLocalLedger("用例重置");
  calls.length = 0;
  confirmCalls.length = 0;
  confirmAnswer = true;
  putStatus = 200;
  ledgerGetStatus = 200;
  emptyLedger = false;
  holdLedger = false;
  heldLedger = [];
  ls.clear();
});

async function seedA(): Promise<void> {
  books.A = { people: [p("A人员0"), p("A人员1"), p("A人员2")] };
  books.B = { people: [p("B人员0"), p("B人员1")] };
  currentBook = "A";
  useApp.getState().setAll({ ...emptyState(), people: books.A.people });
  await SYNC.pullNasLedger();
  calls.length = 0; // 只数这个用例自己发出去的请求
  confirmCalls.length = 0;
}

test("G1：上一本台账的迟到响应不许覆盖新册（内存 / 本机缓存 / 整本 PUT 都必须是新册）", async () => {
  await seedA();
  assert.equal(names(useApp.getState().people), "A人员0,A人员1,A人员2", "前置：内存里是甲工地的 3 人");

  // ① 一次「甲工地」的拉取还在飞（挂住不放）
  holdLedger = true;
  const slowA = SYNC.pullNasLedger();
  await until(() => heldLedger.length === 1, "慢的这次拉取已经把请求发出去");
  const ledgerGets = () => calls.filter((c) => c.url === "/api/ledger" && c.method === "GET");
  assert.equal(ledgerGets().length, 1, "前置：慢的这次拉取已经发出去");

  // ② 用户切到乙工地：作废在途拉取（代际 +1 + 尽力中断）→ 清本机 → 拉乙工地
  SYNC.invalidateInFlightPulls("切换到台账 B");
  assert.equal(ledgerGets()[0].signal?.aborted, true, "作废时应当顺手中断在途请求（拿不到也不影响正确性）");
  SYNC.dropLocalLedger("切换到台账 B");
  SYNC.setCacheOwner("u1", "B");
  currentBook = "B";
  holdLedger = false;
  const pullB = SYNC.pullNasLedger();

  // ③ 甲工地那次请求此刻才回来（内容还是**请求发出那一刻**的甲工地 3 人）——
  //    修好之前，它会把内存换回甲工地的 3 人
  releaseHeldLedger();
  await slowA;
  await pullB;

  assert.equal(names(useApp.getState().people), "B人员0,B人员1", "迟到的甲工地响应必须整包丢弃（G1 的核心）");
  await flush();
  assert.equal(cachedPeople(), "B人员0,B人员1", "本机缓存同样必须是乙工地的数据");
  assert.equal(checkCacheOwner("u1", "B"), "same", "缓存归属已记成乙工地");

  // ④ 在新册里录一个人 → 整本 PUT 里必须是「乙工地的人 + 新录入」，绝不能出现甲工地的人
  useApp.setState({ people: [...useApp.getState().people, p("乙工地新录入")] } as any);
  await SYNC.pushNasLedger();
  const puts = calls.filter((c) => c.url === "/api/ledger" && c.method === "PUT");
  assert.equal(puts.length, 1, "应当发出一次整本 PUT");
  assert.equal(names(puts[0].body.people), "B人员0,B人员1,乙工地新录入", "自动保存推的必须是当前册的数据");
  assert.ok(
    !puts.some((c) => JSON.stringify(c.body).includes("A人员")),
    "任何一次整本 PUT 都不许带上上一本台账的人员（跨册污染）",
  );
});

test("G1：拉取串行 —— 后一次拉取必须等前一次落地才发请求，迟到的旧数据不进内存", async () => {
  await seedA();
  holdLedger = true;
  const slow = SYNC.pullNasLedger(); // 先发的（慢）
  await until(() => heldLedger.length === 1, "先发的那次已经把请求发出去");
  const queued = SYNC.pullNasLedger(); // 后发的：作废前一次，但自己要在队列里等
  await flush();
  assert.equal(heldLedger.length, 1, "串行：前一次还没落地时，后一次不许发请求（并发拉取会乱序落地）");

  // 服务器上甲工地此刻被别的设备改过 —— 后一次拉取拿到的应该是这份新内容
  books.A = { people: [p("别处改的0"), p("别处改的1"), p("别处改的2"), p("别处改的3")] };
  releaseHeldLedger(); // 放行「慢的这次」（内容=旧的 3 人）
  await slow;
  await until(() => heldLedger.length === 1, "后一次拉取在前一次落地之后才发出请求");
  releaseHeldLedger(); // 放行后一次（内容=新的 4 人）
  await queued;

  const gets = calls.filter((c) => c.url === "/api/ledger" && c.method === "GET");
  assert.equal(gets.length, 2, "两次拉取各发一次请求（前一次被作废的是它的**结果**，不是这次请求）");
  assert.equal(
    names(useApp.getState().people),
    "别处改的0,别处改的1,别处改的2,别处改的3",
    "最终内存必须是后一次（较新）的数据 —— 旧数据整包丢弃",
  );
});

test("G1：新册这次拉起失败时，上一本的迟到响应也不许把它的数据画回屏幕", async () => {
  await seedA();
  holdLedger = true;
  const slowA = SYNC.pullNasLedger();
  await until(() => heldLedger.length === 1, "慢的这次已经把请求发出去");

  // 切到乙工地；乙工地这次拉取**失败**（网络/服务端故障）
  SYNC.invalidateInFlightPulls("切换到台账 B");
  SYNC.dropLocalLedger("切换到台账 B");
  currentBook = "B";
  holdLedger = false;
  ledgerGetStatus = 500;
  const pullB = SYNC.pullNasLedger();

  // 甲工地那次请求此刻才回来（乙工地的拉取还排在它后面 —— 拉取是串行的）
  releaseHeldLedger();
  await slowA;
  await flush();
  assert.equal(
    calls.filter((c) => c.url === "/api/ledger" && c.method === "GET").length,
    2,
    "前一次落地之后，乙工地的这次拉取必须真的发出去了：" + calls.map((c) => c.method + " " + c.url).join(" | "),
  );
  await pullB;

  // 它必须整包丢弃：这时屏幕上该是**空**（新册没拉着），而不是甲工地的 3 个人
  // （那正是评审复现出来的样子：切册后屏幕上还是上一本的人）。
  assert.deepEqual(names(useApp.getState().people), "", "迟到的旧册数据必须整包丢弃，不许画回屏幕");
  assert.equal(cachedPeople(), "", "本机缓存也不许被旧册数据写进去");
});

test("G3：本机改动推不上去时，切册被拦下、提示原因、本机改动保留", async () => {
  await seedA();
  putStatus = 500; // 让所有 PUT 都失败

  // 造一个「本机有改动还没保存」的状态
  useApp.setState({ people: [...useApp.getState().people, p("还没保存的人")] } as any);
  await flush();

  confirmAnswer = false; // 用户在确认框里选「取消」= 留在当前台账
  const r = await SYNC.switchBook("B", { action: "切换到「乙工地」" });

  assert.equal(r.status, "cancelled", "推不上去时必须中止切换（不能默默继续）");
  assert.equal(names(useApp.getState().people), "A人员0,A人员1,A人员2,还没保存的人", "本机改动必须保留");
  assert.ok(confirmCalls.some((m) => /本机还有改动没能保存到服务器/.test(m)), "必须把失败原因告诉用户");
  assert.ok(confirmCalls.some((m) => /留在当前台账/.test(m)), "确认框要写清「取消＝留在当前台账」");
  assert.ok(calls.some((c) => c.url === "/api/ledger" && c.method === "PUT"), "前置：确实试过推送");
  assert.equal(
    calls.filter((c) => c.url === "/api/auth" && c.body?.op === "useBook").length,
    0,
    "被拦下时不许已经切走（useBook 都不能发）",
  );
});

test("G3：推得上去时正常切册 —— 先 flush 再 useBook，然后清本机 + 拉新册", async () => {
  await seedA();
  useApp.setState({ people: [...useApp.getState().people, p("先推上去的人")] } as any);
  await flush();
  calls.length = 0;

  const r = await SYNC.switchBook("B", { action: "切换到「乙工地」" });
  assert.deepEqual(r, { status: "ok", bookId: "B" }, "切换成功要带回新的台账 id");
  assert.equal(confirmCalls.length, 0, "推送成功时不该问用户任何问题");

  const putAt = calls.findIndex((c) => c.url === "/api/ledger" && c.method === "PUT");
  const useBookAt = calls.findIndex((c) => c.url === "/api/auth" && c.body?.op === "useBook");
  assert.ok(putAt >= 0, "切册前必须先 flush（把本机改动推给**当前**这本）");
  assert.ok(useBookAt > putAt, "顺序必须是「先 flush 再切 cookie」，反了就把改动落到新册了");
  assert.equal(
    names(calls[putAt].body.people),
    "A人员0,A人员1,A人员2,先推上去的人",
    "flush 推的是切册前那本的人员",
  );
  assert.equal(names(useApp.getState().people), "B人员0,B人员1", "切完内存是新册的数据");
  await flush();
  assert.equal(cachedPeople(), "B人员0,B人员1", "本机缓存也跟着换成新册");
});

test("G3：flushPendingLedger 的三种结果（没连服务器 / 没改动 / 推不上去）都能分辨", async () => {
  await seedA();
  assert.deepEqual(await SYNC.flushPendingLedger(), { status: "ok" }, "没有本机改动 → ok");

  useApp.setState({ people: [...useApp.getState().people, p("改动甲")] } as any);
  setNasEnabled(false);
  const skipped = await SYNC.flushPendingLedger();
  assert.equal(skipped.status, "skipped", "本机没连服务器 → skipped（没有「推不上去」这回事，调用方照常继续）");
  setNasEnabled(true);

  putStatus = 500;
  const failed = await SYNC.flushPendingLedger();
  assert.equal(failed.status, "failed", "推不上去 → failed");
  assert.match((failed as { reason: string }).reason, /保存到服务器失败|没保存|500/, "failed 必须带原因");
});

/* ───────────────────────── 静态守卫：切册/新建/删除只能走唯一入口 ───────────────────────── */

test("G1 守卫：切册 / 新建 / 删除台账只能走 nas-sync 的唯一入口（调用点不许各写一套顺序）", async () => {
  const repo = new URL("../", import.meta.url);
  const code = async (p: string) =>
    (
      await readFile(new URL(p, repo), "utf8")
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((l) => l.replace(/(^|[^:"'\\])\/\/.*$/, "$1"))
      .join("\n");
  const sync = await code("src/lib/nas-sync.ts");

  // 三个入口都存在，并且**都经过同一个「切完之后的顺序」**（作废在途拉取 → 清本机 → 拉新册）
  for (const fn of ["switchBook", "createBookAndEnter", "deleteBook"]) {
    assert.match(sync, new RegExp(`export async function ${fn}\\(`), `nas-sync 必须有 ${fn} 这个唯一入口`);
  }
  const enterBody = sync.slice(sync.indexOf("async function enterBookAfterTransition"), sync.indexOf("export async function switchBook"));
  assert.match(enterBody, /invalidateInFlightPulls\(/, "唯一顺序里必须作废在途拉取（G1）");
  assert.match(enterBody, /dropLocalLedger\(/, "唯一顺序里必须清本机（不许留上一册的残留）");
  assert.match(enterBody, /await pullNasLedger\(\)/, "唯一顺序里必须拉目标册");
  const users = [sync.slice(sync.indexOf("export async function switchBook"), sync.indexOf("export async function createBookAndEnter")),
                 sync.slice(sync.indexOf("export async function createBookAndEnter"), sync.indexOf("export async function deleteBook")),
                 sync.slice(sync.indexOf("export async function deleteBook"))];
  for (const body of users)
    assert.match(body, /enterBookAfterTransition\(/, "入口函数必须复用同一段顺序（不许自己重写一遍）");

  // 调用点不许再直接调「底层三件套」——那正是「各调用点各写一套」的来源
  const FORBIDDEN = /(dropLocalLedger|pullNasLedger|flushPendingLedger)\s*\(/;
  const callSites = ["src/components/shell/book-switcher.tsx", "src/components/settings/accounts-card.tsx"];
  const bad: string[] = [];
  for (const f of callSites) {
    const text = await code(f);
    if (FORBIDDEN.test(text)) bad.push(`${f}：直接调了底层同步三件套，请改走 switchBook / createBookAndEnter / deleteBook`);
  }
  assert.deepEqual(bad, [], `切册/新建/删除只许走唯一入口：\n${bad.join("\n")}`);
  // 守卫自检（C2）：正则必须真能抓到坏样本，否则上面的 0 命中没有意义
  expectRegexCatches(FORBIDDEN, "await flushPendingLedger();", "「调用点不许直接调底层三件套」这条正则");
  for (const f of callSites)
    assert.match(await code(f), /(switchBook|createBookAndEnter|deleteBook)\(/, `${f} 必须走唯一入口`);
});

test("G1：seed 推送撞 409 时的「嵌套拉取」不许自锁（串行队列不能把自己等死）", async () => {
  // 真实路径：登录后首次拉取（seed）→ 服务器上这本是空的 → 把本机数据推上去 → PUT 撞 409
  // → 用户选「取消 / Esc」＝放弃本机 → 再拉一次服务器版本。这次拉取是**从拉取里发起**的，
  // 如果它老实排队，就得等「正在等这次推送的那次拉取」跑完 —— 两边互等，永久挂住。
  currentBook = "A";
  books.A = {};
  emptyLedger = true; // 服务器上这本是空的（seed 的前提）
  putStatus = 409; // 推送冲突
  confirmAnswer = false; // 409 的确认框里选「取消」＝放弃本机 → 走「再拉一次」

  await Promise.race([
    SYNC.pullNasLedger({ seed: true }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("超时：拉取队列自锁了（嵌套拉取排队等自己）")), 2000)),
  ]);
  assert.equal(emptyLedger, true, "前置没变：服务器上这本仍是空的");
  assert.deepEqual(names(useApp.getState().people), "", "放弃本机之后，内存是空台账（不是上一本的数据）");
});
