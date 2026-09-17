/**
 * A1（专家评审 20260917）：**显式请求的台账不可访问时不许静默回落**。
 *
 * 复现的缺陷：`resolveTenant` 原来是
 *   `const book = mine.find((b) => b.id === bookId) || mine[0] || null;`
 * —— 客户端 cookie（`gongdi_b`）指着一本已经不可访问的册子时，服务端不报错，改用「这个用户的
 * 第一本可访问台账」，**读和写都落到那本**。被移出某册 / 册子被删后 cookie 不会自动刷新，
 * 于是一次自动保存就把「以为在编辑的甲册」整本写进乙册（跨册数据污染，最难恢复的一类）。
 *
 * 这里用**真实 Route handler + 真实登录**跑完整链路：登录 → 加成员 → 切册子 → 移出成员 →
 * 用旧 cookie 读 / 写，断言 4xx、断言两个册子的 ledger.json 一个字节都没变。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";

const root = await mkdtemp(join(tmpdir(), "gongdi-tenant-scope-"));
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
const LEDGER = await import("../src/routes/api/ledger");

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = LEDGER.Route.options.server!.handlers as unknown as { GET: Handler; PUT: Handler };

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

function call(method: "GET" | "PUT", opts: { cookie: string; book?: string; body?: unknown }): Promise<Response> {
  const headers: Record<string, string> = { cookie: opts.cookie, "content-type": "application/json" };
  if (opts.book) headers["x-book"] = opts.book;
  return handlers[method]({
    request: new Request("http://local/api/ledger", {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
  });
}

/** 册子文件的字节指纹（不存在 → "(无)"）：用来断言「一个字节都没变」 */
async function ledgerFingerprint(bookId: string): Promise<string> {
  const p = join(root, "books", bookId, "ledger.json");
  if (!existsSync(p)) return "(无)";
  const buf = await readFile(p);
  return `${buf.byteLength}:${createHash("sha256").update(buf).digest("hex")}`;
}

// ───────────────────────── 前置：一本默认册 + 一本二号册 + 一个成员 ─────────────────────────

const setup = await authPost({ op: "setup", username: "admin", password: "12345678", name: "管理员" });
assert.equal(setup.status, 200, "前置：建管理员");
const adminCookie = await cookieOf(setup);

const created = await authPost({ op: "createBook", name: "二号册" }, adminCookie);
assert.equal(created.status, 200, "前置：新建台账");
const book2 = String(((await created.json()) as { bookId?: string }).bookId || "");
assert.ok(book2, "前置：新建台账要返回 id");

// 两本册子各写一份可区分的数据（管理员用 x-book 显式指定，不依赖 cookie）
for (const [id, name] of [
  ["default", "DEFAULT-人"],
  [book2, "COPY1-人"],
] as const) {
  const put = await call("PUT", {
    cookie: adminCookie,
    book: id,
    body: { year: 2026, years: [2026], people: [{ id: `p-${id}`, name }], attendance: [], payments: [] },
  });
  assert.equal(put.status, 200, `前置：往 ${id} 写台账`);
}

const member = await authPost(
  { op: "createUser", name: "成员甲", username: "u_member", password: "12345678", joinCurrent: "0" },
  adminCookie,
);
assert.equal(member.status, 200, "前置：建普通成员");
const memberId = String(
  ((await member.json()) as { users?: { id: string; username: string }[] }).users?.find(
    (u) => u.username === "u_member",
  )?.id || "",
);
assert.ok(memberId, "前置：新建成员要能查到 id");

// 成员同时是「默认册」和「二号册」的成员（都是全权限）：这样旧代码的「回落第一本」会真的写进去
for (const id of ["default", book2]) {
  const add = await authPost({ op: "addMember", id, userId: memberId, perms: "*" }, adminCookie);
  assert.equal(add.status, 200, `前置：把成员加入 ${id}`);
}

const login = await authPost({ op: "login", username: "u_member", password: "12345678" });
assert.equal(login.status, 200, "前置：成员登录");
let memberCookie = await cookieOf(login);

// 成员切到「二号册」（服务端下发 gongdi_b=book2，与真实使用一致）
const useBook = await authPost({ op: "useBook", id: book2 }, memberCookie);
assert.equal(useBook.status, 200, "前置：切到二号册");
memberCookie = await cookieOf(useBook);
assert.match(memberCookie, /gongdi_b=/, "前置：切换后 cookie 里要带上册子");

test("前置：成员拿着 gongdi_b=二号册 读得到二号册的数据", async () => {
  const r = await call("GET", { cookie: memberCookie });
  assert.equal(r.status, 200);
  const j = (await r.json()) as { people?: { name: string }[] };
  assert.equal(j.people?.[0]?.name, "COPY1-人", "读到的必须是二号册");
});

// ───────────────────────── 被移出二号册之后 ─────────────────────────

const removed = await authPost({ op: "removeMember", id: book2, userId: memberId }, adminCookie);
assert.equal(removed.status, 200, "前置：把成员移出二号册");

test("A1：被移出后旧 cookie 请求二号册 → 4xx（不再静默换成第一本）", async () => {
  const r = await call("GET", { cookie: memberCookie });
  assert.equal(r.status, 404, "显式请求的册子不可访问必须明确拒绝，不能回落");
  const j = (await r.json()) as { bookDenied?: boolean; error?: string };
  assert.equal(j.bookDenied, true, "要带 bookDenied 标记，客户端据此提示「重新选择台账」");
});

test("A1：同一 cookie 保存整本 → 4xx，且两本册子的 ledger.json 一个字节都没变", async () => {
  const beforeDefault = await ledgerFingerprint("default");
  const beforeBook2 = await ledgerFingerprint(book2);

  const put = await call("PUT", {
    cookie: memberCookie,
    body: { year: 2031, years: [2031], people: [{ id: "x1", name: "M1以为的COPY1" }], attendance: [], payments: [] },
  });
  assert.equal(put.status, 404, "写入必须被拒（旧代码：200，且写进了 default）");

  assert.equal(await ledgerFingerprint("default"), beforeDefault, "默认册的台账文件不许被动过");
  assert.equal(await ledgerFingerprint(book2), beforeBook2, "二号册的台账文件不许被动过");

  const def = await readFile(join(root, "books", "default", "ledger.json"), "utf8");
  assert.equal(def.includes("M1以为的COPY1"), false, "跨册污染的那笔数据绝不能写进别的册子");
});

test("A1：兼容老 cookie —— 完全不带册子时，仍回落该用户的第一本可访问台账", async () => {
  // 只带账号/令牌，不带 gongdi_b（老客户端 / 老 cookie 的形态）
  const withoutBook = memberCookie
    .split("; ")
    .filter((c) => !c.startsWith("gongdi_b="))
    .join("; ");
  const r = await call("GET", { cookie: withoutBook });
  assert.equal(r.status, 200, "没指定册子时必须保持老行为（否则老客户端全废）");
  const j = (await r.json()) as { people?: { name: string }[] };
  assert.equal(j.people?.[0]?.name, "DEFAULT-人", "回落的是该用户的第一本可访问台账");
});

test("A1：显式指定一本根本不存在的册子 → 4xx（不是回落到别处）", async () => {
  const r = await call("GET", { cookie: memberCookie, book: "no-such-book" });
  assert.equal(r.status, 404);
  assert.equal(((await r.json()) as { bookDenied?: boolean }).bookDenied, true);
});

test("A1：重新成为成员后，同一 cookie 立刻又能读写（提示可恢复）", async () => {
  const add = await authPost({ op: "addMember", id: book2, userId: memberId, perms: "*" }, adminCookie);
  assert.equal(add.status, 200);
  const r = await call("GET", { cookie: memberCookie });
  assert.equal(r.status, 200, "重新加回成员就应恢复，不需要改代码/换 cookie");
  assert.equal(((await r.json()) as { people?: { name: string }[] }).people?.[0]?.name, "COPY1-人");
});
