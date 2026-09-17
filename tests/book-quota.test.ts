/**
 * 普通成员自建台账数量上限（1.8.9，CTO 拍板口径）。
 *
 * 背景：A 组逐项测试报告第 22 项复现到 `POST /api/auth` 的 `op=createBook` **无任何门禁** ——
 * 只有 `*.view` 的只读账号也能无限创建台账，且建的台账里他自己是 owner、拿 `*`。
 *
 * 拍板口径：**允许成员自建**（他能有自己的数据空间、看不到别人的），但**限数量**：
 * 普通成员最多 5 本「自己作为 owner」的台账（管理员/超管不受限；`MAX_OWNED_BOOKS` 覆盖默认 5）。
 * 超限返回 **400 + 可读提示**，不创建成功；只统计 owner，被别人加为成员的不算。
 *
 * 本文件既有纯函数用例（数量/文案/边界），也有**真实路由**用例（登录普通成员连续建到上限，
 * 断言 HTTP 状态、文案与台账总数不变）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
/** 去掉注释：注释里写着「以前怎么错的」不算代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

const root = await mkdtemp(join(tmpdir(), "gongdi-book-quota-"));
process.env.DATA_DIR = root;
delete process.env.MAX_OWNED_BOOKS;

const Q = await import("../src/lib/book-quota");
const A = await import("../src/lib/accounts.server");

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

/* ── 一、纯函数 ── */

test("上限默认 5；MAX_OWNED_BOOKS 可覆盖；非法值回落默认", () => {
  delete process.env.MAX_OWNED_BOOKS;
  assert.equal(Q.DEFAULT_MAX_OWNED_BOOKS, 5);
  assert.equal(Q.maxOwnedBooks(), 5, "默认必须是 5");

  process.env.MAX_OWNED_BOOKS = "12";
  assert.equal(Q.maxOwnedBooks(), 12, "环境变量可覆盖");

  for (const bad of ["", "0", "-3", "abc", "NaN"]) {
    process.env.MAX_OWNED_BOOKS = bad;
    assert.equal(Q.maxOwnedBooks(), 5, `非法值 ${JSON.stringify(bad)} 应回落默认 5`);
  }
  delete process.env.MAX_OWNED_BOOKS;
});

test("只统计「他作为 owner」的台账；被别人加为成员的不算", () => {
  const books = [
    { id: "b1", name: "甲", ownerId: "u1" },
    { id: "b2", name: "乙", ownerId: "u1" },
    { id: "b3", name: "丙", ownerId: "u2", members: [{ userId: "u1", perms: ["*"] }] },
    { id: "b4", name: "丁" }, // 没有 ownerId 的老数据不算任何人的
  ];
  assert.equal(Q.ownedBookCount(books, "u1"), 2, "u1 只 owner 了两本（成员关系不算）");
  assert.equal(Q.ownedBookCount(books, "u2"), 1);
  assert.equal(Q.ownedBookCount(books, "nobody"), 0);
});

test("超限提示可读：带上限数字、说明已达上限、指向管理员", () => {
  const msg = Q.ownedBooksLimitMessage(5);
  assert.match(msg, /已达上限/, "必须明说已达上限");
  assert.match(msg, /5/, "要带上限数字");
  assert.match(msg, /联系管理员/, "要指路联系管理员");
});

/* ── 二、真实路由 ── */

const setup = await authPost({ op: "setup", username: "admin", password: "12345678", name: "管理员" });
assert.equal(setup.status, 200, "测试前置：建管理员必须成功");
const adminCookie = await cookieOf(setup);
assert.ok(adminCookie, "测试前置：拿到管理员会话");

test("管理员连续建 6 本不受限（每本都 200，且都归他 owner）", async () => {
  const me = (await A.ensureAccounts()).users.find((u) => u.role === "admin")!;
  const before = Q.ownedBookCount((await A.ensureAccounts()).books, me.id);
  for (let i = 1; i <= 6; i++) {
    const res = await authPost({ op: "createBook", name: `管理员台账${i}` }, adminCookie);
    assert.equal(res.status, 200, `管理员建第 ${i} 本必须成功`);
    const j = await res.json();
    assert.equal(j.book.ownerId, me.id);
  }
  const data = await A.ensureAccounts();
  assert.equal(Q.ownedBookCount(data.books, me.id), before + 6, "管理员 6 本全部计入 owner（默认台账之外）");
});

test("普通成员：建到第 5 本成功、第 6 本 400 且提示可读、台账总数不变", async () => {
  const created = await authPost(
    { op: "createUser", username: "member", password: "12345678", name: "普通成员", preset: "read", joinCurrent: "0" },
    adminCookie,
  );
  assert.equal(created.status, 200, "测试前置：建普通成员账户必须成功");

  const login = await authPost({ op: "login", username: "member", password: "12345678" });
  assert.equal(login.status, 200, "测试前置：普通成员登录必须成功");
  const memberCookie = await cookieOf(login);
  assert.ok(memberCookie);
  const memberId = (await login.json()).user.id;

  for (let i = 1; i <= 5; i++) {
    const before = (await A.ensureAccounts()).books.length;
    const res = await authPost({ op: "createBook", name: `成员台账${i}` }, memberCookie);
    assert.equal(res.status, 200, `普通成员建第 ${i} 本必须成功（上限 5）`);
    const after = (await A.ensureAccounts()).books.length;
    assert.equal(after, before + 1, `第 ${i} 本应真的多一本`);
  }

  const beforeTotal = (await A.ensureAccounts()).books.length;
  const sixth = await authPost({ op: "createBook", name: "成员台账6" }, memberCookie);
  assert.equal(sixth.status, 400, "第 6 本必须被拦下（400，不是 200）");
  const body = await sixth.json();
  assert.match(String(body.error), /已达上限/, "提示必须写明已达上限");
  assert.match(String(body.error), /5/, "提示必须带上限数字");
  assert.match(String(body.error), /联系管理员/, "提示必须指路联系管理员");

  const data = await A.ensureAccounts();
  assert.equal(data.books.length, beforeTotal, "被拦下的第 6 本不能写进台账（总数不变）");
  assert.equal(Q.ownedBookCount(data.books, memberId), 5, "该成员 owner 的台账仍是 5 本");
  assert.equal(
    data.books.some((b) => b.name === "成员台账6"),
    false,
    "被拦下的台账不能真的落盘",
  );
});

test("MAX_OWNED_BOOKS 覆盖：设成 2 时普通成员第 3 本即 400", async () => {
  const created = await authPost(
    { op: "createUser", username: "member2", password: "12345678", name: "限额成员", joinCurrent: "0" },
    adminCookie,
  );
  assert.equal(created.status, 200);
  const login = await authPost({ op: "login", username: "member2", password: "12345678" });
  const cookie = await cookieOf(login);
  assert.ok(cookie);

  process.env.MAX_OWNED_BOOKS = "2";
  try {
    assert.equal((await authPost({ op: "createBook", name: "限2-1" }, cookie)).status, 200);
    assert.equal((await authPost({ op: "createBook", name: "限2-2" }, cookie)).status, 200);
    const third = await authPost({ op: "createBook", name: "限2-3" }, cookie);
    assert.equal(third.status, 400, "设成 2 后第 3 本必须被拦下");
    assert.match(String((await third.json()).error), /已达上限/);
  } finally {
    delete process.env.MAX_OWNED_BOOKS;
  }
});

test("管理员不受 MAX_OWNED_BOOKS 影响（设成 1 仍可继续建）", async () => {
  process.env.MAX_OWNED_BOOKS = "1";
  try {
    const res = await authPost({ op: "createBook", name: "管理员超额台账" }, adminCookie);
    assert.equal(res.status, 200, "管理员不限额");
  } finally {
    delete process.env.MAX_OWNED_BOOKS;
  }
});

/* ── 三、静态守卫（防悄悄回退） ── */

test("守卫：createBook 门禁必须走 book-quota 的唯一实现，且只对非管理员生效", async () => {
  const src = stripComments(await readFile(repo("src/lib/accounts.server.ts"), "utf8"));
  const block = src.slice(src.indexOf('if (op === "createBook")'));
  const end = block.indexOf('if (op === "renameBook")');
  const createBook = end > 0 ? block.slice(0, end) : block;
  assert.match(createBook, /me\.role !== "admin"/, "管理员/超管必须豁免");
  assert.match(createBook, /ownedBookCount\(/, "数量必须按 owner 统计（唯一实现）");
  assert.match(createBook, /ownedBooksLimitMessage\(/, "超限文案必须来自唯一实现");
  assert.match(createBook, /status: 400/, "超限必须 400，绝不能创建成功");
  assert.ok(
    createBook.indexOf("ownedBookCount(") < createBook.indexOf("data.books.push(book)"),
    "门禁必须在 push 之前，超限时不能先写进去再回滚",
  );
});

test("守卫：两个新建台账入口都要原样显示服务端文案（1.8.14：下沉到 createBookAndEnter）", async () => {
  for (const file of ["src/components/settings/accounts-card.tsx", "src/components/shell/book-switcher.tsx"]) {
    const src = stripComments(await readFile(repo(file), "utf8"));
    const idx = src.indexOf("createBookAndEnter(");
    assert.ok(idx > 0, `${file} 里必须有新建台账入口（nas-sync.createBookAndEnter）`);
    const around = src.slice(Math.max(0, idx - 400), idx + 700);
    // 超限 400 的文案要**原样**显示：读结果里的 reason（它来自 authOp 抛出的 err.message）
    assert.match(around, /status === "failed"/, `${file} 必须读新建结果（失败就不许当成功继续）`);
    assert.match(around, /toast\.error\(r\.reason\)/, `${file} 必须把服务端文案原样 toast 出来（否则超限 400 界面什么都不显示）`);
    assert.doesNotMatch(around, /已达上限/, `${file} 不许自己拼一句超限文案`);
  }
  // 文案原样传递的唯一实现：createBookAndEnter 把 authOp 的 err.message 原样带回
  const sync = stripComments(await readFile(repo("src/lib/nas-sync.ts"), "utf8"));
  const body = sync.slice(sync.indexOf("export async function createBookAndEnter"), sync.indexOf("export async function deleteBook"));
  assert.match(body, /err instanceof Error \? err\.message/, "createBookAndEnter 必须把服务端文案（err.message）原样带回");
  assert.doesNotMatch(body, /已达上限/, "不许自己拼文案（唯一来源是服务端 book-quota.ownedBooksLimitMessage）");
  // 文案唯一来源：除 book-quota.ts 外，源码里不许再写死「已达上限」这句
  const src = stripComments(await readFile(repo("src/lib/accounts.server.ts"), "utf8"));
  assert.equal(src.includes("已达上限"), false, "服务端不得再手写一份超限文案（要用 ownedBooksLimitMessage）");
});
