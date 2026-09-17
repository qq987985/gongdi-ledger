import { existsSync } from "node:fs";
import { join } from "node:path";
import { mkdir, readFile, rm, writeFile, rename } from "node:fs/promises";
import { randomBytes, scryptSync, createHash, timingSafeEqual } from "node:crypto";
import {
  appendAudit,
  listBookIds,
  readBookMeta,
  writeBookMeta,
} from "./nas-fs.server";
import { dataDir, persistOn, runWithBook } from "./paths.server";
import { ALL_PERMS, PRESETS, canWriteLedger, canManageLedger, hasPerm, type NeedId } from "./perms";
import { maxOwnedBooks, ownedBookCount, ownedBooksLimitMessage } from "./book-quota";
import { logServer } from "./log.server";
import { uid } from "./utils";


export interface UserRecord {
  id: string;
  username: string;
  name: string;
  hash: string;
  role: "admin" | "user";
  disabled?: boolean;
  /** 会话盐（随机）：令牌 = hash(sess:用户id:会话盐)，不随密码推导；改密码时刷新，其他设备自动下线 */
  tokenSalt?: string;
}

export interface BookMember {
  userId: string;
  perms: string[];
}

export interface BookRecord {
  id: string;
  name: string;
  ownerId?: string;
  members?: BookMember[];
}

export interface AccountsFile {
  users: UserRecord[];
  books: BookRecord[];
}

export interface Tenant {
  needSetup: boolean;
  /** 账户库损坏：所有需要账号的操作都应拒绝，并且前端要显示明确提示（不能引导「初始化管理员」） */
  broken?: boolean;
  user: UserRecord | null;
  bookId: string;
  book: BookRecord | null;
  books: BookRecord[];
  perms: string[];
  all: AccountsFile;
  /**
   * 请求**显式指定**的台账（`x-book` 头或 cookie `gongdi_b`）不存在 / 当前用户不可访问（A1，1.8.14）。
   * 这时 `bookId` 为空，且**绝不能**回落成「该用户的第一本台账」——
   * 被移出某册 / 册子被删后客户端还带着旧 cookie，回落会让整本快照写进另一本台账（跨册数据污染）。
   */
  bookDenied?: boolean;
}

function accountsPath(): string {
  return join(dataDir(), "accounts", "accounts.json");
}

function accountsPathCandidates(): string[] {
  const root = dataDir();
  return [join(root, "accounts", "accounts.json"), join(root, "accounts.json")];
}

function cookies(request: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/* ── 密码哈希：scrypt + 随机盐（服务端账户库使用，抗离线破解） ── */
function scryptHash(raw: string): string {
  const t = raw.trim(); // 与旧 hashPassword 口径一致：首尾空格不参与哈希
  if (!t) return "";
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(t, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$16384$8$1$${salt}$${key}`;
}

/** 校验密码：新格式 scrypt；旧格式（无盐 sha256）兼容，并在登录成功后静默升级 */
async function verifyStoredHash(stored: string, raw: string): Promise<boolean> {
  const t = raw.trim(); // 与登录/改密 trim 口径一致，避免首尾空格导致锁死
  if (!stored || !t) return false;
  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length < 6) return false;
    const [, n, r, p, salt, key] = parts;
    try {
      const calc = scryptSync(t, salt, 64, { N: Number(n), r: Number(r), p: Number(p) });
      const expect = Buffer.from(key, "hex");
      return calc.length === expect.length && timingSafeEqual(calc, expect);
    } catch {
      return false;
    }
  }
  // 旧格式：sha256("gongdi-ledger::" + pwd)。**只为「已经是旧 hash 的账号」兼容**（A3）：
  // 首启不再由台账 accessHash 造新账号，且用户登录成功后会被静默升级成加盐 scrypt。
  return createHash("sha256").update(`gongdi-ledger::${t}`).digest("hex") === stored;
}

async function sessionToken(user: UserRecord): Promise<string> {
  return createHash("sha256").update(`sess:${user.id}:${user.tokenSalt || user.hash}`).digest("hex");
}

/* ── 登录限速：同一用户名连续失败 5 次，锁 5 分钟 ── */
const authRate = new Map<string, { fails: number; until: number }>();
/** 超过这个条数就顺手淘汰 idle/过期的记录，防止 Map 只增不减（不同用户名的失败记录会无限累积） */
const AUTH_RATE_SWEEP_AT = 500;
function rateSweep(): void {
  const now = Date.now();
  for (const [k, rec] of authRate)
    if (rec.until <= now && rec.fails === 0) authRate.delete(k);
}
function rateKey(kind: string, username: string) {
  return `${kind}:${username.toLowerCase()}`;
}
function rateLocked(kind: string, username: string): boolean {
  const rec = authRate.get(rateKey(kind, username));
  return Boolean(rec && rec.until > Date.now());
}
function rateFail(kind: string, username: string): void {
  if (authRate.size >= AUTH_RATE_SWEEP_AT) rateSweep();
  const k = rateKey(kind, username);
  const rec = authRate.get(k) || { fails: 0, until: 0 };
  rec.fails += 1;
  if (rec.fails >= 5) {
    rec.until = Date.now() + 5 * 60e3;
    rec.fails = 0;
  }
  authRate.set(k, rec);
}
function rateOk(kind: string, username: string): void {
  authRate.delete(rateKey(kind, username));
}

/** accounts.json 存在但读不出来（损坏/权限/IO）。这时绝不能当成「还没有账户」，否则会走进初始化流程覆盖掉真库 */
let accountsBroken = false;

export function accountsUnreadable(): boolean {
  return accountsBroken;
}

export const ACCOUNTS_BROKEN_MSG =
  "服务器上的账户数据（data/accounts/accounts.json）读取失败，已停止自动修复与初始化，避免覆盖现有账号。请从备份恢复该文件。";

async function readFileShape(): Promise<AccountsFile> {
  if (!persistOn()) return { users: [], books: [] };
  accountsBroken = false;
  for (const p of accountsPathCandidates()) {
    if (!existsSync(p)) continue;
    try {
      const raw = JSON.parse(await readFile(p, "utf8"));
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("账户库内容不是对象");
      return { users: raw.users || [], books: (raw.books || []).map(normBook) };
    } catch (err) {
      accountsBroken = true;
      await logServer("error", "账户库读取失败：已停止自动修复", { path: p, error: String(err) });
      return { users: [], books: [] };
    }
  }
  return { users: [], books: [] };
}

let shapeQueue: Promise<void> = Promise.resolve();

async function writeFileShapeNow(data: AccountsFile): Promise<void> {
  if (!persistOn()) return;
  const dir = join(dataDir(), "accounts");
  await mkdir(dir, { recursive: true });
  // 原子写：先写临时文件再改名，避免断电/强杀留下截断的凭据库。
  // 临时名必须带 pid + 随机后缀：固定 `${target}.tmp` 时并发写会互相搬走对方写了一半的文件。
  const target = accountsPath();
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await rename(tmp, target);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    await logServer("error", "账户库写入失败", { error: String(err) });
    throw err;
  }
  for (const b of data.books)
    try {
      await writeBookMeta({ id: b.id, name: b.name, ownerId: b.ownerId || "" });
    } catch {}
}

/** 账户库写入串行化：每个 auth 操作都会读改写一次，并发时否则会丢账号/丢 owner */
function writeFileShape(data: AccountsFile): Promise<void> {
  const run = () => writeFileShapeNow(data);
  const next = shapeQueue.then(run, run);
  shapeQueue = next.catch(() => {});
  return next;
}

export async function ensureAccounts(): Promise<AccountsFile> {
  let data = await readFileShape();
  // 坏库：直接返回，不补 tokenSalt、不从旧台账造管理员、不写盘
  if (accountsBroken) return { users: [], books: [] };
  let salted = false;
  for (const u of data.users)
    if (!u.tokenSalt) {
      u.tokenSalt = randomBytes(16).toString("hex");
      salted = true;
    }
  if (salted) await writeFileShape(data);
  // A3（1.8.14）：不再从旧台账的 accessHash 造管理员 —— 那个值是
  // sha256("gongdi-ledger::" + 开机口令)，能读到台账的人就能拿它登录成管理员（CWE-916/759/522）。
  // 现在一律要求显式创建管理员（前端 needSetup → 「创建管理员」），或走「已是旧 hash 的账号」的兼容登录；
  // 这里只留一条可读日志，说明升级后为什么没有自动建号。
  if (!data.users.length) await logLegacyAccessHashNotice();
  const next = await recoverBooksFromDisk(data);
  if ((persistOn() && !existsSync(accountsPath())) || JSON.stringify(data) !== JSON.stringify(next))
    await writeFileShape(next);
  else
    for (const b of next.books)
      try {
        await writeBookMeta({ id: b.id, name: b.name, ownerId: b.ownerId || "" });
      } catch {}
  return next;
}

/**
 * 老升级路径的提示（A3，1.8.14）：台账里还留着旧字段 `accessHash`、而账户库为空时，
 * 记一条**可读**的日志，而不是拿它自动建管理员。升级引导由前端 needSetup（「创建管理员」页）负责，
 * 这里只保证排查现场时能看出原因 —— `accessHash` 不再具备任何凭据效力。
 */
async function logLegacyAccessHashNotice(): Promise<void> {
  const root = dataDir();
  if (!root) return;
  for (const f of [join(root, "books", "default", "ledger.json"), join(root, "ledger.json")]) {
    if (!existsSync(f)) continue;
    try {
      const raw = JSON.parse(await readFile(f, "utf8")) as { accessHash?: unknown };
      if (raw?.accessHash)
        await logServer("warn", "检测到旧版台账里的 accessHash：已不再自动创建管理员", {
          path: f,
          hint: "请在「创建管理员」页面显式设置账号；已有账号可用原口令登录（成功后自动升级为加盐哈希）",
        });
    } catch {}
  }
}

async function recoverBooksFromDisk(cur: AccountsFile): Promise<AccountsFile> {
  if (!persistOn()) return cur;
  let ids: string[] = [];
  try {
    ids = await listBookIds();
  } catch {
    return cur;
  }
  if (!ids.length) return cur;
  const books = cur.books.slice();
  const known = new Set(books.map((b) => b.id));
  let changed = false;
  const adminId = cur.users.find((u) => u.role === "admin")?.id || "";
  for (const id of ids) {
    if (known.has(id)) continue;
    const meta = await readBookMeta(id);
    books.push(
      normBook({
        id,
        name: meta?.name || (id === "default" ? "默认台账" : `台账-${id.slice(0, 8)}`),
        ownerId: meta?.ownerId || adminId,
      }),
    );
    known.add(id);
    changed = true;
  }
  return changed ? { users: cur.users, books } : cur;
}

export function publicUser(u: UserRecord) {
  return { id: u.id, username: u.username, name: u.name, role: u.role, disabled: Boolean(u.disabled) };
}

function normBook(b: BookRecord): BookRecord {
  const members = b.members?.length ? b.members : b.ownerId ? [{ userId: b.ownerId, perms: ["*"] }] : [];
  return { ...b, members };
}

function permsOf(user: UserRecord | null, book: BookRecord | null): string[] {
  if (!user || !book) return [];
  if (user.role === "admin" || user.id === book.ownerId) return ["*"];
  const m = (book.members || []).find((x) => x.userId === user.id);
  return m?.perms?.length ? m.perms : [];
}

function booksOf(user: UserRecord, all: BookRecord[]): BookRecord[] {
  if (user.role === "admin") return all;
  return all.filter((b) => b.ownerId === user.id || (b.members || []).some((m) => m.userId === user.id));
}

export async function resolveTenant(request: Request): Promise<Tenant> {
  const data = await ensureAccounts();
  const c = cookies(request);
  const userId = request.headers.get("x-user") || c.gongdi_u || "";
  const token = request.headers.get("x-token") || c.gongdi_t || "";
  // 「显式指定了哪本册子」与「完全没指定」必须区别对待（A1，1.8.14）：
  // 没指定（老 cookie / 老客户端）才允许回落第一本；指定了却不可访问时一律拒绝，
  // 不回落 —— 否则被移出某册后，带着旧 cookie 的整本快照会静默写进另一本台账。
  const requestedBook = (request.headers.get("x-book") || c.gongdi_b || "").trim();
  const user = data.users.find((u) => u.id === userId) || null;
  const ok = Boolean(user && !user.disabled && token && token === (await sessionToken(user)));
  const mine = ok && user ? booksOf(user, data.books) : [];
  const explicit = requestedBook ? mine.find((b) => b.id === requestedBook) || null : null;
  const book = requestedBook ? explicit : mine[0] || null;
  const perms = ok && user ? permsOf(user, book) : [];
  return {
    needSetup: !accountsBroken && data.users.length === 0,
    broken: accountsBroken,
    user: ok ? user : null,
    bookId: book?.id || "",
    book,
    books: mine,
    perms,
    all: data,
    bookDenied: Boolean(ok && user && requestedBook && !explicit),
  };
}

function cookieHeaders(user: UserRecord, bookId: string, token: string): string[] {
  // HttpOnly：JS 不可读，只能随请求发送（防 XSS 偷 cookie）；旧 token 因会话盐刷新自动失效
  const base = "Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000";
  return [
    `gongdi_u=${encodeURIComponent(user.id)}; ${base}`,
    `gongdi_t=${encodeURIComponent(token)}; ${base}`,
    `gongdi_b=${encodeURIComponent(bookId)}; ${base}`,
  ];
}

function clearCookieHeaders(): string[] {
  const base = "Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
  return [`gongdi_u=; ${base}`, `gongdi_t=; ${base}`, `gongdi_b=; ${base}`];
}

function jsonWithCookies(body: unknown, cookiesList: string[], status = 200): Response {
  const headers = new Headers({ "content-type": "application/json" });
  for (const c of cookiesList) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(body), { status, headers });
}

async function logAuth(
  bookId: string,
  user: UserRecord | null,
  action: string,
  detail = "",
  module = "账户",
): Promise<void> {
  if (!bookId || !user) return;
  try {
    await runWithBook(bookId, () =>
      appendAudit({ userId: user.id, userName: user.name || user.username, action, detail, module }),
    );
  } catch (e) {
    // 审计写失败**不能**让登录/建号失败（否则用户被锁在门外），但必须留痕：
    // 这里原来是空 catch —— 账号操作没记进操作记录时，事后完全查不出原因（架构方案 P0 #2）。
    void logServer("error", "操作记录写入失败（账户操作）", {
      action,
      module,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * 删除类操作的服务端留痕（A5，1.8.14）。
 *
 * 为什么在服务端也要记一条：客户端的 `logOp()` 会漏报 —— 会话过期、网络失败、前端某个
 * 删除入口忘了调，事后就查不出「谁把证件照/单据影像删了」。留痕里写清是谁（tenant）、删了什么。
 *
 * 留痕失败**不能**让删除本身变成 500（用户会以为没删掉）：只记日志 ——
 * 审计文件读不出来时 `appendAudit` 内部也会再记一条「写入被拒」。
 */
export async function auditTenantDelete(
  t: Tenant,
  row: { action: string; module: string; detail: string },
): Promise<void> {
  try {
    await appendAudit({
      userId: t.user?.id || "",
      userName: t.user?.name || t.user?.username || "",
      action: row.action,
      module: row.module,
      detail: row.detail,
    });
  } catch (err) {
    await logServer("error", "删除操作留痕失败", { action: row.action, error: String(err) });
  }
}

export async function handleAuthPost(request: Request): Promise<Response> {
  // 非 JSON / 空 body 以前会抛到框架层变成 500（未登录也能打出 500）——那只是客户端发错了，400
  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const body = {
    op: String(raw.op || ""),
    id: String(raw.id || ""),
    name: String(raw.name || ""),
    username: String(raw.username || ""),
    password: String(raw.password || ""),
    old: String(raw.old || ""),
    role: String(raw.role || ""),
    userId: String(raw.userId || ""),
    perms: String(raw.perms || ""),
    preset: String(raw.preset || ""),
    joinCurrent: String(raw.joinCurrent || ""),
    disabled: String(raw.disabled || ""),
  };
  const op = body.op;
  const data = await ensureAccounts();
  // 账户库损坏：一律拒绝。否则 setup 会看到 users=[] 并「初始化管理员」，把真库覆盖掉
  if (accountsUnreadable()) return Response.json({ error: ACCOUNTS_BROKEN_MSG, broken: true }, { status: 503 });
  if (op === "setup") {
    if (data.users.length) return Response.json({ error: "已有账户" }, { status: 400 });
    const username = (body.username || "admin").trim().toLowerCase();
    const password = (body.password || "").trim();
    const name = (body.name || "管理员").trim() || "管理员";
    if (!username || password.length < 8)
      return Response.json({ error: "用户名必填，密码至少 8 位" }, { status: 400 });
    const user: UserRecord = { id: "admin", username, name, hash: scryptHash(password), role: "admin", tokenSalt: randomBytes(16).toString("hex") };
    const books = data.books.length
      ? data.books.map((b) => {
          const ownerId = b.ownerId || user.id;
          return { ...b, ownerId, members: b.members?.length ? b.members : [{ userId: ownerId, perms: ["*"] }] };
        })
      : [{ id: "default", name: "默认台账", ownerId: user.id, members: [{ userId: user.id, perms: ["*"] }] }];
    await writeFileShape({ users: [user], books });
    const token = await sessionToken(user);
    await logAuth(books[0].id, user, "创建管理员", username, "账户");
    return jsonWithCookies(
      { ok: true, user: publicUser(user), token, books, bookId: books[0].id },
      cookieHeaders(user, books[0].id, token),
    );
  }
  if (op === "login") {
    const username = (body.username || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    if (rateLocked("login", username))
      return Response.json({ error: "尝试次数太多，请 5 分钟后再试" }, { status: 429 });
    const user = data.users.find((u) => u.username === username);
    if (!user || !(await verifyStoredHash(user.hash, password))) {
      rateFail("login", username);
      return Response.json({ error: "用户名或密码不对" }, { status: 401 });
    }
    if (user.disabled) return Response.json({ error: "账户已停用" }, { status: 403 });
    rateOk("login", username);
    // 旧格式哈希静默升级为 scrypt
    if (user.hash && !user.hash.startsWith("scrypt$")) {
      user.hash = scryptHash(password);
      data.users = data.users.map((u) => (u.id === user.id ? user : u));
      await writeFileShape(data);
    }
    const books = booksOf(user, data.books);
    const token = await sessionToken(user);
    await logAuth(books[0]?.id || "", user, "登录", "", "账户");
    return jsonWithCookies(
      { ok: true, user: publicUser(user), token, books, bookId: books[0]?.id || "" },
      cookieHeaders(user, books[0]?.id || "", token),
    );
  }
  if (op === "verify") {
    // 验证密码，返回用户信息（用于敏感操作确认）
    const password = (body.password || "").trim();
    const c = cookies(request);
    const userId = c.gongdi_u || "";
    const user = data.users.find((u) => u.id === userId);
    if (rateLocked("verify", userId))
      return Response.json({ error: "尝试次数太多，请 5 分钟后再试" }, { status: 429 });
    if (!user || !(await verifyStoredHash(user.hash, password))) {
      rateFail("verify", userId);
      return Response.json({ error: "密码错误" }, { status: 401 });
    }
    if (user.disabled) return Response.json({ error: "账户已停用" }, { status: 403 });
    rateOk("verify", userId);
    if (user.hash && !user.hash.startsWith("scrypt$")) {
      user.hash = scryptHash(password);
      data.users = data.users.map((u) => (u.id === user.id ? user : u));
      await writeFileShape(data);
    }
    return Response.json({ ok: true, user: publicUser(user) });
  }
  const tenant = await resolveTenant(request);
  if (!tenant.user) return Response.json({ error: "请先登录" }, { status: 401 });
  const me = tenant.user;
  if (op === "logout") {
    await logAuth(tenant.bookId, me, "退出登录", "", "账户");
    return jsonWithCookies({ ok: true }, clearCookieHeaders());
  }
  if (op === "useBook") {
    const book = tenant.books.find((b) => b.id === body.id);
    if (!book) return Response.json({ error: "没有这套台账" }, { status: 404 });
    const token = await sessionToken(me);
    return jsonWithCookies(
      { ok: true, bookId: book.id, books: tenant.books, user: publicUser(me) },
      cookieHeaders(me, book.id, token),
    );
  }
  if (op === "createBook") {
    const name = (body.name || "").trim();
    if (!name) return Response.json({ error: "请填写台账名称" }, { status: 400 });
    // 成员可以自建（有自己的数据空间，也看不到别人的），但普通成员限数量：
    // 最多 N 本「自己作为 owner」的台账（默认 5，MAX_OWNED_BOOKS 覆盖）；管理员/超管不受限。
    // 只统计 owner —— 被管理员加为成员的台账不算他创建的（1.8.9，口径见 src/lib/book-quota.ts）。
    if (me.role !== "admin") {
      const limit = maxOwnedBooks();
      const owned = ownedBookCount(data.books, me.id);
      if (owned >= limit)
        return Response.json({ error: ownedBooksLimitMessage(limit), limit, owned }, { status: 400 });
    }
    const book: BookRecord = { id: uid(), name, ownerId: me.id, members: [{ userId: me.id, perms: ["*"] }] };
    data.books.push(book);
    await writeFileShape(data);
    const token = await sessionToken(me);
    const books = booksOf(me, data.books);
    await logAuth(book.id, me, "新建台账", book.name, "台账");
    return jsonWithCookies(
      { ok: true, book, books, bookId: book.id },
      cookieHeaders(me, book.id, token),
    );
  }
  if (op === "renameBook") {
    const book = data.books.find((b) => b.id === body.id);
    if (!book || (me.role !== "admin" && book.ownerId !== me.id))
      return Response.json({ error: "不能改这套台账" }, { status: 403 });
    book.name = (body.name || "").trim() || book.name;
    await writeFileShape(data);
    await logAuth(book.id, me, "改台账名称", book.name, "台账");
    return Response.json({ ok: true, books: booksOf(me, data.books) });
  }
  if (op === "deleteBook") {
    const book = data.books.find((b) => b.id === body.id);
    if (!book || (me.role !== "admin" && book.ownerId !== me.id))
      return Response.json({ error: "不能删这套台账" }, { status: 403 });
    if (booksOf(me, data.books).length <= 1 && me.role !== "admin")
      return Response.json({ error: "至少保留一套台账" }, { status: 400 });
    if (book.id === "default")
      return Response.json({ error: "默认台账请留着，里面是原来的数据" }, { status: 400 });
    data.books = data.books.filter((b) => b.id !== book.id);
    await writeFileShape(data);
    const { removeBookDir } = await import("./nas-fs.server");
    await removeBookDir(book.id);
    const rest = booksOf(me, data.books);
    const nextId = rest[0]?.id || "default";
    const token = await sessionToken(me);
    await logAuth(nextId, me, "删除台账", book.name, "台账");
    return jsonWithCookies({ ok: true, books: rest, bookId: nextId }, cookieHeaders(me, nextId, token));
  }
  if (op === "changePassword") {
    if (!(await verifyStoredHash(me.hash, body.old || "")))
      return Response.json({ error: "当前密码不对" }, { status: 400 });
    if ((body.password || "").trim().length < 8)
      return Response.json({ error: "新密码至少 8 位" }, { status: 400 });
    me.hash = scryptHash(body.password);
    // 改密码刷新会话盐：所有设备重新登录，旧会话全部失效
    me.tokenSalt = randomBytes(16).toString("hex");
    data.users = data.users.map((u) => (u.id === me.id ? me : u));
    await writeFileShape(data);
    const token = await sessionToken(me);
    await logAuth(tenant.bookId || "default", me, "修改自己的密码", "", "账户");
    return jsonWithCookies(
      { ok: true, user: publicUser(me) },
      cookieHeaders(me, tenant.bookId || "default", token),
    );
  }
  if (op === "resetPassword") {
    if (me.role !== "admin") return Response.json({ error: "只有管理员能重置别人密码" }, { status: 403 });
    const target = data.users.find((u) => u.id === body.id);
    if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
    if ((body.password || "").trim().length < 8)
      return Response.json({ error: "新密码至少 8 位" }, { status: 400 });
    target.hash = scryptHash(body.password);
    target.tokenSalt = randomBytes(16).toString("hex");
    data.users = data.users.map((u) => (u.id === target.id ? target : u));
    await writeFileShape(data);
    await logAuth(tenant.bookId || "default", me, "重置他人密码", target.username, "账户");
    return Response.json({ ok: true, users: data.users.map(publicUser) });
  }
  if (op === "updateUser") {
    if (me.role !== "admin") return Response.json({ error: "只有管理员能改账户" }, { status: 403 });
    const target = data.users.find((u) => u.id === body.id);
    if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
    const username = (body.username || target.username).trim().toLowerCase();
    const name = (body.name || target.name).trim() || target.name;
    if (!username) return Response.json({ error: "登录名必填" }, { status: 400 });
    if (data.users.some((u) => u.username === username && u.id !== target.id))
      return Response.json({ error: "登录名已存在" }, { status: 400 });
    target.username = username;
    target.name = name;
    data.users = data.users.map((u) => (u.id === target.id ? target : u));
    await writeFileShape(data);
    await logAuth(tenant.bookId || "default", me, "改账户资料", `${name} ${username}`, "账户");
    return Response.json({ ok: true, users: data.users.map(publicUser) });
  }
  if (op === "setDisabled") {
    if (me.role !== "admin") return Response.json({ error: "只有管理员能停用账户" }, { status: 403 });
    const target = data.users.find((u) => u.id === body.id);
    if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
    if (target.id === me.id) return Response.json({ error: "不能停用自己" }, { status: 400 });
    const off = body.disabled === "1" || body.disabled === "true";
    if (off && target.role === "admin" && data.users.filter((u) => u.role === "admin" && !u.disabled).length <= 1)
      return Response.json({ error: "至少留一个可用的管理员" }, { status: 400 });
    target.disabled = off;
    data.users = data.users.map((u) => (u.id === target.id ? target : u));
    await writeFileShape(data);
    await logAuth(tenant.bookId || "default", me, off ? "停用账户" : "启用账户", target.username, "账户");
    return Response.json({ ok: true, users: data.users.map(publicUser) });
  }
  if (op === "createUser") {
    if (me.role !== "admin") return Response.json({ error: "只有管理员能新建账户" }, { status: 403 });
    const username = (body.username || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    const name = (body.name || username).trim();
    if (!username || password.length < 8)
      return Response.json({ error: "用户名必填，密码至少 8 位" }, { status: 400 });
    if (data.users.some((u) => u.username === username))
      return Response.json({ error: "用户名已存在" }, { status: 400 });
    const user: UserRecord = {
      id: uid(),
      username,
      name,
      hash: scryptHash(password),
      role: body.role === "admin" ? "admin" : "user",
      tokenSalt: randomBytes(16).toString("hex"),
    };
    data.users.push(user);
    const book = body.joinCurrent !== "0" ? data.books.find((b) => b.id === (body.id || tenant.bookId)) : null;
    if (book && user.id !== book.ownerId) {
      // 显式传了 perms 就按 perms（以前完全忽略它，一律套 preset，导致"只想给考勤权限"实际给了整套只读）
      const explicit = String(body.perms || "")
        .split(/[,\s]+/)
        .map((x) => x.trim())
        .filter((x) => x === "*" || ALL_PERMS.includes(x));
      const preset = PRESETS.find((x) => x.id === (body.preset || "read"));
      const perms = explicit.length ? explicit : preset ? [...preset.perms] : ["people.view"];
      book.members = (book.members || []).filter((m) => m.userId !== user.id);
      book.members.push({ userId: user.id, perms });
    }
    await writeFileShape(data);
    await logAuth(
      tenant.bookId || "default",
      me,
      "新建账户",
      `${name} ${username}${book ? " · 加入当前台账" : ""}`,
      "账户",
    );
    return Response.json({
      ok: true,
      users: data.users.map(publicUser),
      books: data.books,
      members: book ? publicMembers(book, data.users) : [],
    });
  }
  if (op === "deleteUser") {
    if (me.role !== "admin") return Response.json({ error: "只有管理员能删账户" }, { status: 403 });
    if (body.id === me.id) return Response.json({ error: "不能删自己" }, { status: 400 });
    const target = data.users.find((u) => u.id === body.id);
    if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
    if (target.role === "admin" && data.users.filter((u) => u.role === "admin").length <= 1)
      return Response.json({ error: "至少留一个管理员" }, { status: 400 });
    data.users = data.users.filter((u) => u.id !== target.id);
    data.books = data.books.map((b) => ({
      ...b,
      members: (b.members || []).filter((m) => m.userId !== target.id),
    }));
    const drop = data.books.filter((b) => b.ownerId === target.id && b.id !== "default");
    data.books = data.books.filter((b) => b.ownerId !== target.id || b.id === "default");
    await writeFileShape(data);
    const { removeBookDir } = await import("./nas-fs.server");
    for (const b of drop) await removeBookDir(b.id);
    return Response.json({ ok: true, users: data.users.map(publicUser) });
  }
  function parsePerms(): string[] {
    if (body.preset) {
      const p = PRESETS.find((x) => x.id === body.preset);
      if (p) return [...p.perms];
    }
    const list = body.perms
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s === "*" || ALL_PERMS.includes(s));
    return list.length ? list : [...(PRESETS.find((x) => x.id === "read")?.perms || [])];
  }
  function canManageMembers(): boolean {
    return me.role === "admin" || tenant.book?.ownerId === me.id || hasPerm(tenant.perms, "members.manage");
  }
  if (op === "addMember" || op === "setMember") {
    if (!canManageMembers()) return Response.json({ error: "没有分配权限" }, { status: 403 });
    const book = data.books.find((b) => b.id === (body.id || tenant.bookId));
    if (!book) return Response.json({ error: "没有这套台账" }, { status: 404 });
    if (me.role !== "admin" && book.ownerId !== me.id && !hasPerm(permsOf(me, book), "members.manage"))
      return Response.json({ error: "只能管理自己的台账成员" }, { status: 403 });
    const target = data.users.find((u) => u.id === body.userId || u.username === body.username.toLowerCase());
    if (!target) return Response.json({ error: "没有这个用户" }, { status: 404 });
    if (target.id === book.ownerId) return Response.json({ error: "创建人权限不能改" }, { status: 400 });
    const perms = parsePerms();
    // 只有"创建人/管理员"能自由分配权限。普通 members.manage 成员：
    //   ① 不能给自己改权限（否则 addMember 自己 + "*" 就提权成管理员级）；
    //   ② 不能授予自己没有的权限。
    const actingIsOwner = me.role === "admin" || book.ownerId === me.id;
    if (!actingIsOwner) {
      if (target.id === me.id) return Response.json({ error: "不能修改自己的权限" }, { status: 403 });
      const mine = new Set<string>(permsOf(me, book));
      if (!mine.has("*")) {
        const want = perms.includes("*") ? ALL_PERMS : perms;
        const over = want.filter((p) => !mine.has(p));
        if (over.length)
          return Response.json({ error: `不能授予自己没有的权限：${over.slice(0, 4).join("、")}` }, { status: 403 });
      }
    }
    book.members = (book.members || []).filter((m) => m.userId !== target.id);
    book.members.push({ userId: target.id, perms });
    await writeFileShape(data);
    await logAuth(
      book.id,
      me,
      op === "addMember" ? "加入成员" : "修改成员权限",
      `${target.name} ${target.username}`,
      "成员",
    );
    return Response.json({ ok: true, books: booksOf(me, data.books), members: publicMembers(book, data.users) });
  }
  if (op === "removeMember") {
    if (!canManageMembers()) return Response.json({ error: "没有分配权限" }, { status: 403 });
    const book = data.books.find((b) => b.id === (body.id || tenant.bookId));
    if (!book) return Response.json({ error: "没有这套台账" }, { status: 404 });
    // 与 addMember/setMember 一致：非管理员只能操作自己有权限管理的台账，禁止越权动别人的台账
    if (me.role !== "admin" && book.ownerId !== me.id && !hasPerm(permsOf(me, book), "members.manage"))
      return Response.json({ error: "只能管理自己的台账成员" }, { status: 403 });
    if (body.userId === book.ownerId) return Response.json({ error: "不能移除创建人" }, { status: 400 });
    book.members = (book.members || []).filter((m) => m.userId !== body.userId);
    await writeFileShape(data);
    await logAuth(book.id, me, "移除成员", body.userId, "成员");
    return Response.json({ ok: true, books: booksOf(me, data.books), members: publicMembers(book, data.users) });
  }
  return Response.json({ error: "未知操作" }, { status: 400 });
}

function publicMembers(book: BookRecord, users: UserRecord[]) {
  return [...new Set([book.ownerId, ...(book.members || []).map((m) => m.userId)])]
    .filter(Boolean)
    .map((id) => {
      const u = users.find((x) => x.id === id);
      const m = (book.members || []).find((x) => x.userId === id);
      return {
        userId: id,
        username: u?.username || "",
        name: u?.name || "",
        isOwner: id === book.ownerId,
        perms: id === book.ownerId ? ["*"] : m?.perms || [],
      };
    });
}

/** 单个权限、或需要同时满足的多个权限（如导出敏感表：export.use + people.view） */
export type NeedSpec = NeedId | NeedId[];

function checkNeed(perms: string[] | undefined, need: string): boolean {
  if (need === "ledger.write") return canWriteLedger(perms);
  if (need === "ledger.manage") return canManageLedger(perms);
  return hasPerm(perms, need);
}

/**
 * 租户 + 权限门禁（**不读请求体**，A4/1.8.14）。
 *
 * 为什么单独抽出来：`PUT /api/photo`、`PUT /api/doc` 这类上传接口的权限位取决于 body 里的
 * `kind`，原来只能「先 `await request.formData()` 把最多 50MB 读进内存、再鉴权」——
 * 未登录的人可以反复灌内存（CWE-770/400）。现在拆成两段：
 *   ① `gateTenant(request)`：先做鉴权与台账上下文（不碰 body），拿到 tenant；
 *   ② 读完 body 拿到 kind 后，用 `needDenied(request, tenant, need)` 补判具体权限。
 * 返回值是 `Response` 表示已拒绝，调用方直接 `return` 它。
 */
export async function gateTenant(request: Request, need?: NeedSpec): Promise<Tenant | Response> {
  if (!persistOn()) return {} as Tenant;
  const t = await resolveTenant(request);
  if (t.broken) return Response.json({ error: ACCOUNTS_BROKEN_MSG, broken: true }, { status: 503 });
  if (t.needSetup) return Response.json({ error: "need setup", needSetup: true }, { status: 401 });
  if (!t.user) return Response.json({ error: "login" }, { status: 401 });
  if (!t.bookId) {
    // A1：显式请求的台账不可访问/不存在时**不回落**，明确告诉客户端「这本册子用不了」。
    // 客户端据此提示并让用户重新选台账（并停止把本机数据推回服务器）。
    if (t.bookDenied)
      return Response.json(
        {
          error: "这本台账不存在或你已不是它的成员（可能已被删除或移除），请重新选择台账",
          bookDenied: true,
        },
        { status: 404 },
      );
    return Response.json({ error: "还没有台账，请让管理员把你加入", noBook: true }, { status: 403 });
  }
  const denied = await permReject(request, t, need);
  if (denied) return denied;
  return t;
}

/** 权限位检查（供 `gateTenant` 与「读完 body 再判权限」的接口复用） */
async function permReject(request: Request, t: Tenant, need?: NeedSpec): Promise<Response | null> {
  const needs = need === undefined ? [] : Array.isArray(need) ? need : [need];
  for (const n of needs) {
    if (checkNeed(t.perms, n)) continue;
    await logServer("warn", "权限拒绝", {
      need: n,
      route: new URL(request.url).pathname,
      method: request.method,
      user: t.user?.username,
      book: t.bookId,
    });
    const msg = n === "ledger.manage" ? "没有修改整本台账的权限" : n === "ledger.write" ? "没有修改权限" : "没有权限";
    return Response.json({ error: msg, need: n }, { status: 403 });
  }
  return null;
}

/** 想先 `gateTenant()` 再按 body 判权限的接口用这个补判；通过返回 null，否则返回可直接回给客户端的 403 */
export function needDenied(request: Request, t: Tenant, need: NeedSpec): Promise<Response | null> {
  return permReject(request, t, need);
}

/** 在已解析的 tenant 上下文里执行（与 `withTenant` 的上下文语义一致） */
export function runInTenant<T>(t: Tenant, fn: () => T): T {
  return runWithBook(t.bookId, fn);
}

/**
 * 权限门禁 + 台账上下文。
 *
 * `fn` 会拿到解析好的 tenant（1.8.7 起）：导出这类「先鉴权、再写操作记录」的路由
 * 需要知道是谁在导（原来只能再 resolveTenant 一次，白读一遍 accounts.json）。
 * 老调用点写 `async () => …` 依然合法（参数少写不影响类型）。
 *
 * **鉴权在调用方的第一行**：需要读 body 的接口要把整个 body 处理放进 `fn` 里
 * （或改用 `gateTenant` + `needDenied` + `runInTenant`），否则未登录的人能先灌满内存（A4）。
 */
export async function withTenant(
  request: Request,
  fn: (tenant: Tenant) => Response | Promise<Response>,
  need?: NeedSpec,
): Promise<Response> {
  if (!persistOn()) return fn({} as Tenant);
  const t = await gateTenant(request, need);
  if (t instanceof Response) return t;
  return runWithBook(t.bookId, () => fn(t));
}

export function memberList(book: BookRecord | null, users: UserRecord[]) {
  if (!book) return [];
  return publicMembers(book, users);
}
