import { o as __toESM } from "../_runtime.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { r as writeSync } from "../_libs/xlsx.mjs";
import { B as require_react, _ as createFileRoute, b as useRouter, d as HeadContent, f as useRouterState, g as lazyRouteComponent, h as Outlet, m as createRouter, u as Scripts, v as createRootRoute, y as Link, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as require_excel } from "../_libs/exceljs+[...].mjs";
import { C as ClipboardList, D as Camera, O as CalendarDays, T as ChevronLeft, _ as FileText, a as TriangleAlert, c as Plus, d as Menu, f as LogOut, g as FolderOpen, h as History, i as Upload, k as Banknote, n as Users, o as Trash2, p as LayoutDashboard, s as Settings, t as X, w as ChevronRight } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { $ as uid, B as PRESETS, E as nextYear, H as canWriteLedger, J as cn, K as setLivePerms, L as ALL_PERMS, R as NAV_PERM, T as monthStatus, U as hasPerm, V as can, W as livePerms, _ as confirmRemoveYear, a as attendanceTemplateWb, at as readBookMeta, c as contractTemplateWb, ct as writeBookMeta, et as appendAudit, h as peopleTemplateWb, it as persistOn, lt as __exportAll, m as paymentTemplateWb, n as useApp, nt as listBookIds, o as buildContractWorkbook, ot as readVersionText, q as subscribePerms, s as buildFullWorkbook, st as runWithBook, tt as dataDir } from "./router-D_p-605U2.mjs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
//#region node_modules/.nitro/vite/services/ssr/assets/gate-G21CaRmB.js
var SESSION_KEY = "gongdi-gate-session";
var REMEMBER_KEY = "gongdi-gate-remember";
async function sha256Hex(text) {
	const c = globalThis.crypto;
	if (c?.subtle) {
		const buf = await c.subtle.digest("SHA-256", new TextEncoder().encode(text));
		return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
	}
	return sha256Pure(text);
}
function sha256Pure(message) {
	const bytes = new TextEncoder().encode(message);
	const K = [
		1116352408,
		1899447441,
		3049323471,
		3921009573,
		961987163,
		1508970993,
		2453635748,
		2870763221,
		3624381080,
		310598401,
		607225278,
		1426881987,
		1925078388,
		2162078206,
		2614888103,
		3248222580,
		3835390401,
		4022224774,
		264347078,
		604807628,
		770255983,
		1249150122,
		1555081692,
		1996064986,
		2554220882,
		2821834349,
		2952996808,
		3210313671,
		3336571891,
		3584528711,
		113926993,
		338241895,
		666307205,
		773529912,
		1294757372,
		1396182291,
		1695183700,
		1986661051,
		2177026350,
		2456956037,
		2730485921,
		2820302411,
		3259730800,
		3345764771,
		3516065817,
		3600352804,
		4094571909,
		275423344,
		430227734,
		506948616,
		659060556,
		883997877,
		958139571,
		1322822218,
		1537002063,
		1747873779,
		1955562222,
		2024104815,
		2227730452,
		2361852424,
		2428436474,
		2756734187,
		3204031479,
		3329325298
	];
	function rotr(n, x) {
		return x >>> n | x << 32 - n;
	}
	const l = bytes.length;
	const withPad = new Uint8Array(l + 9 + 63 >> 6 << 6);
	withPad.set(bytes);
	withPad[l] = 128;
	const view = new DataView(withPad.buffer);
	view.setUint32(withPad.length - 4, l * 8, false);
	let h0 = 1779033703, h1 = 3144134277, h2 = 1013904242, h3 = 2773480762, h4 = 1359893119, h5 = 2600822924, h6 = 528734635, h7 = 1541459225;
	const w = /* @__PURE__ */ new Uint32Array(64);
	for (let i = 0; i < withPad.length; i += 64) {
		for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
		for (let t = 16; t < 64; t++) {
			const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ w[t - 15] >>> 3;
			const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ w[t - 2] >>> 10;
			w[t] = w[t - 16] + s0 + w[t - 7] + s1 >>> 0;
		}
		let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
		for (let t = 0; t < 64; t++) {
			const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
			const ch = e & f ^ ~e & g;
			const temp1 = h + S1 + ch + K[t] + w[t] >>> 0;
			const temp2 = (rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) + (a & b ^ a & c ^ b & c) >>> 0;
			h = g;
			g = f;
			f = e;
			e = d + temp1 >>> 0;
			d = c;
			c = b;
			b = a;
			a = temp1 + temp2 >>> 0;
		}
		h0 = h0 + a >>> 0;
		h1 = h1 + b >>> 0;
		h2 = h2 + c >>> 0;
		h3 = h3 + d >>> 0;
		h4 = h4 + e >>> 0;
		h5 = h5 + f >>> 0;
		h6 = h6 + g >>> 0;
		h7 = h7 + h >>> 0;
	}
	return [
		h0,
		h1,
		h2,
		h3,
		h4,
		h5,
		h6,
		h7
	].map((n) => n.toString(16).padStart(8, "0")).join("");
}
async function hashPassword(raw) {
	const t = raw.trim();
	if (!t) return "";
	return sha256Hex(`gongdi-ledger::${t}`);
}
function gateUnlocked(accessHash) {
	if (!accessHash || typeof window === "undefined") return !accessHash;
	return (sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY)) === accessHash;
}
function unlockGate(accessHash, remember) {
	sessionStorage.setItem(SESSION_KEY, accessHash);
	if (remember) localStorage.setItem(REMEMBER_KEY, accessHash);
	else localStorage.removeItem(REMEMBER_KEY);
}
function lockGate() {
	sessionStorage.removeItem(SESSION_KEY);
	localStorage.removeItem(REMEMBER_KEY);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/button-Ku4MoRaK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			outline: "border border-line-strong bg-surface text-ink hover:bg-accent-soft",
			ghost: "text-ink hover:bg-accent-soft",
			danger: "bg-danger text-danger-fg hover:opacity-90"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-11 px-5",
			icon: "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-D_p-605U.js
var import_excel = /* @__PURE__ */ __toESM(require_excel());
function accountsPath() {
	return join(dataDir(), "accounts", "accounts.json");
}
function accountsPathCandidates() {
	const root = dataDir();
	return [join(root, "accounts", "accounts.json"), join(root, "accounts.json")];
}
function cookies(request) {
	const out = {};
	for (const part of (request.headers.get("cookie") || "").split(";")) {
		const i = part.indexOf("=");
		if (i < 0) continue;
		out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
	}
	return out;
}
async function sessionToken(user) {
	return hashPassword(`sess:${user.id}:${user.hash}`);
}
async function readFileShape() {
	if (!persistOn()) return {
		users: [],
		books: []
	};
	for (const p of accountsPathCandidates()) {
		if (!existsSync(p)) continue;
		try {
			const raw = JSON.parse(await readFile(p, "utf8"));
			return {
				users: raw.users || [],
				books: (raw.books || []).map(normBook)
			};
		} catch {}
	}
	return {
		users: [],
		books: []
	};
}
async function writeFileShape(data) {
	if (!persistOn()) return;
	const dir = join(dataDir(), "accounts");
	await mkdir(dir, { recursive: true });
	await writeFile(accountsPath(), JSON.stringify(data, null, 2), "utf8");
	for (const b of data.books) try {
		await writeBookMeta(b);
	} catch {}
}
async function ensureAccounts() {
	let data = await readFileShape();
	if (!data.users.length) {
		const admin = await adminFromOldLedger();
		if (admin) {
			const books = data.books.length ? data.books.map((b) => ({
				...b,
				ownerId: b.ownerId || admin.id
			})) : [{
				id: "default",
				name: "默认台账",
				ownerId: admin.id
			}];
			data = {
				users: [admin],
				books: books.map(normBook)
			};
		}
	}
	const next = await recoverBooksFromDisk(data);
	if (persistOn() && !existsSync(accountsPath()) || JSON.stringify(data) !== JSON.stringify(next)) await writeFileShape(next);
	else for (const b of next.books) try {
		await writeBookMeta(b);
	} catch {}
	return next;
}
async function adminFromOldLedger() {
	const root = dataDir();
	if (!root) return null;
	for (const f of [join(root, "books", "default", "ledger.json"), join(root, "ledger.json")]) {
		if (!existsSync(f)) continue;
		try {
			const raw = JSON.parse(await readFile(f, "utf8"));
			if (raw.accessHash) return {
				id: "admin",
				username: "admin",
				name: "管理员",
				hash: raw.accessHash,
				role: "admin"
			};
		} catch {}
	}
	return null;
}
async function recoverBooksFromDisk(cur) {
	if (!persistOn()) return cur;
	let ids = [];
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
		books.push(normBook({
			id,
			name: meta?.name || (id === "default" ? "默认台账" : `台账-${id.slice(0, 8)}`),
			ownerId: meta?.ownerId || adminId
		}));
		known.add(id);
		changed = true;
	}
	return changed ? {
		users: cur.users,
		books
	} : cur;
}
function publicUser(u) {
	return {
		id: u.id,
		username: u.username,
		name: u.name,
		role: u.role,
		disabled: Boolean(u.disabled)
	};
}
function normBook(b) {
	const members = b.members?.length ? b.members : b.ownerId ? [{
		userId: b.ownerId,
		perms: ["*"]
	}] : [];
	return {
		...b,
		members
	};
}
function permsOf(user, book) {
	if (!user || !book) return [];
	if (user.role === "admin" || user.id === book.ownerId) return ["*"];
	const m = (book.members || []).find((x) => x.userId === user.id);
	return m?.perms?.length ? m.perms : [];
}
function booksOf(user, all) {
	if (user.role === "admin") return all;
	return all.filter((b) => b.ownerId === user.id || (b.members || []).some((m) => m.userId === user.id));
}
async function resolveTenant(request) {
	const data = await ensureAccounts();
	const c = cookies(request);
	const userId = request.headers.get("x-user") || c.gongdi_u || "";
	const token = request.headers.get("x-token") || c.gongdi_t || "";
	const bookId = request.headers.get("x-book") || c.gongdi_b || "default";
	const user = data.users.find((u) => u.id === userId) || null;
	const ok = Boolean(user && !user.disabled && token && token === await sessionToken(user));
	const mine = ok && user ? booksOf(user, data.books) : [];
	const book = mine.find((b) => b.id === bookId) || mine[0] || null;
	const perms = ok && user ? permsOf(user, book) : [];
	return {
		needSetup: data.users.length === 0,
		user: ok ? user : null,
		bookId: book?.id || "",
		book,
		books: mine,
		perms,
		all: data
	};
}
function cookieHeaders(user, bookId, token) {
	const base = "Path=/; SameSite=Lax; Max-Age=2592000";
	return [
		`gongdi_u=${encodeURIComponent(user.id)}; ${base}`,
		`gongdi_t=${encodeURIComponent(token)}; ${base}`,
		`gongdi_b=${encodeURIComponent(bookId)}; ${base}`
	];
}
function clearCookieHeaders() {
	const base = "Path=/; SameSite=Lax; Max-Age=0";
	return [
		`gongdi_u=; ${base}`,
		`gongdi_t=; ${base}`,
		`gongdi_b=; ${base}`
	];
}
async function jsonWithCookies(body, cookiesList, status = 200) {
	const headers = new Headers({ "content-type": "application/json" });
	for (const c of cookiesList) headers.append("Set-Cookie", c);
	return new Response(JSON.stringify(body), {
		status,
		headers
	});
}
async function logAuth(bookId, user, action, detail = "", module = "账户") {
	if (!bookId || !user) return;
	try {
		await runWithBook(bookId, () => appendAudit({
			userId: user.id,
			userName: user.name || user.username,
			action,
			detail,
			module
		}));
	} catch {}
}
async function handleAuthPost(request) {
	const raw = await request.json();
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
		disabled: String(raw.disabled || "")
	};
	const op = body.op;
	const data = await ensureAccounts();
	if (op === "setup") {
		if (data.users.length) return Response.json({ error: "已有账户" }, { status: 400 });
		const username = (body.username || "admin").trim().toLowerCase();
		const password = (body.password || "").trim();
		const name = (body.name || "管理员").trim() || "管理员";
		if (!username || password.length < 4) return Response.json({ error: "用户名必填，密码至少 4 位" }, { status: 400 });
		const user = {
			id: "admin",
			username,
			name,
			hash: await hashPassword(password),
			role: "admin"
		};
		const books = data.books.length ? data.books.map((b) => {
			const ownerId = b.ownerId || user.id;
			return {
				...b,
				ownerId,
				members: b.members?.length ? b.members : [{
					userId: ownerId,
					perms: ["*"]
				}]
			};
		}) : [{
			id: "default",
			name: "默认台账",
			ownerId: user.id,
			members: [{
				userId: user.id,
				perms: ["*"]
			}]
		}];
		await writeFileShape({
			users: [user],
			books
		});
		const token = await sessionToken(user);
		await logAuth(books[0].id, user, "创建管理员", username, "账户");
		return jsonWithCookies({
			ok: true,
			user: publicUser(user),
			token,
			books,
			bookId: books[0].id
		}, cookieHeaders(user, books[0].id, token));
	}
	if (op === "login") {
		const username = (body.username || "").trim().toLowerCase();
		const password = (body.password || "").trim();
		const user = data.users.find((u) => u.username === username);
		if (!user || user.hash !== await hashPassword(password)) return Response.json({ error: "用户名或密码不对" }, { status: 401 });
		if (user.disabled) return Response.json({ error: "账户已停用" }, { status: 403 });
		const books = booksOf(user, data.books);
		const token = await sessionToken(user);
		await logAuth(books[0]?.id || "", user, "登录", "", "账户");
		return jsonWithCookies({
			ok: true,
			user: publicUser(user),
			token,
			books,
			bookId: books[0]?.id || ""
		}, cookieHeaders(user, books[0]?.id || "", token));
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
		return jsonWithCookies({
			ok: true,
			bookId: book.id,
			books: tenant.books,
			user: publicUser(me)
		}, cookieHeaders(me, book.id, token));
	}
	if (op === "createBook") {
		const name = (body.name || "").trim();
		if (!name) return Response.json({ error: "请填写台账名称" }, { status: 400 });
		const book = {
			id: uid(),
			name,
			ownerId: me.id,
			members: [{
				userId: me.id,
				perms: ["*"]
			}]
		};
		data.books.push(book);
		await writeFileShape(data);
		const token = await sessionToken(me);
		const books = booksOf(me, data.books);
		await logAuth(book.id, me, "新建台账", book.name, "台账");
		return jsonWithCookies({
			ok: true,
			book,
			books,
			bookId: book.id
		}, cookieHeaders(me, book.id, token));
	}
	if (op === "renameBook") {
		const book = data.books.find((b) => b.id === body.id);
		if (!book || me.role !== "admin" && book.ownerId !== me.id) return Response.json({ error: "不能改这套台账" }, { status: 403 });
		book.name = (body.name || "").trim() || book.name;
		await writeFileShape(data);
		await logAuth(book.id, me, "改台账名称", book.name, "台账");
		return Response.json({
			ok: true,
			books: booksOf(me, data.books)
		});
	}
	if (op === "deleteBook") {
		const book = data.books.find((b) => b.id === body.id);
		if (!book || me.role !== "admin" && book.ownerId !== me.id) return Response.json({ error: "不能删这套台账" }, { status: 403 });
		if (booksOf(me, data.books).length <= 1 && me.role !== "admin") return Response.json({ error: "至少保留一套台账" }, { status: 400 });
		if (book.id === "default") return Response.json({ error: "默认台账请留着，里面是原来的数据" }, { status: 400 });
		data.books = data.books.filter((b) => b.id !== book.id);
		await writeFileShape(data);
		const { removeBookDir } = await import("../_libs/_.mjs").then((n) => n.i);
		await removeBookDir(book.id);
		const rest = booksOf(me, data.books);
		const nextId = rest[0]?.id || "default";
		const token = await sessionToken(me);
		await logAuth(nextId, me, "删除台账", book.name, "台账");
		return jsonWithCookies({
			ok: true,
			books: rest,
			bookId: nextId
		}, cookieHeaders(me, nextId, token));
	}
	if (op === "changePassword") {
		if (me.hash !== await hashPassword(body.old || "")) return Response.json({ error: "当前密码不对" }, { status: 400 });
		if ((body.password || "").trim().length < 4) return Response.json({ error: "新密码至少 4 位" }, { status: 400 });
		me.hash = await hashPassword(body.password);
		data.users = data.users.map((u) => u.id === me.id ? me : u);
		await writeFileShape(data);
		const token = await sessionToken(me);
		await logAuth(tenant.bookId || "default", me, "修改自己的密码", "", "账户");
		return jsonWithCookies({
			ok: true,
			user: publicUser(me)
		}, cookieHeaders(me, tenant.bookId || "default", token));
	}
	if (op === "resetPassword") {
		if (me.role !== "admin") return Response.json({ error: "只有管理员能重置别人密码" }, { status: 403 });
		const target = data.users.find((u) => u.id === body.id);
		if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
		if ((body.password || "").trim().length < 4) return Response.json({ error: "新密码至少 4 位" }, { status: 400 });
		target.hash = await hashPassword(body.password);
		data.users = data.users.map((u) => u.id === target.id ? target : u);
		await writeFileShape(data);
		await logAuth(tenant.bookId || "default", me, "重置他人密码", target.username, "账户");
		return Response.json({
			ok: true,
			users: data.users.map(publicUser)
		});
	}
	if (op === "updateUser") {
		if (me.role !== "admin") return Response.json({ error: "只有管理员能改账户" }, { status: 403 });
		const target = data.users.find((u) => u.id === body.id);
		if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
		const username = (body.username || target.username).trim().toLowerCase();
		const name = (body.name || target.name).trim() || target.name;
		if (!username) return Response.json({ error: "登录名必填" }, { status: 400 });
		if (data.users.some((u) => u.username === username && u.id !== target.id)) return Response.json({ error: "登录名已存在" }, { status: 400 });
		target.username = username;
		target.name = name;
		data.users = data.users.map((u) => u.id === target.id ? target : u);
		await writeFileShape(data);
		await logAuth(tenant.bookId || "default", me, "改账户资料", `${name} ${username}`, "账户");
		return Response.json({
			ok: true,
			users: data.users.map(publicUser)
		});
	}
	if (op === "setDisabled") {
		if (me.role !== "admin") return Response.json({ error: "只有管理员能停用账户" }, { status: 403 });
		const target = data.users.find((u) => u.id === body.id);
		if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
		if (target.id === me.id) return Response.json({ error: "不能停用自己" }, { status: 400 });
		const off = body.disabled === "1" || body.disabled === "true";
		if (off && target.role === "admin" && data.users.filter((u) => u.role === "admin" && !u.disabled).length <= 1) return Response.json({ error: "至少留一个可用的管理员" }, { status: 400 });
		target.disabled = off;
		data.users = data.users.map((u) => u.id === target.id ? target : u);
		await writeFileShape(data);
		await logAuth(tenant.bookId || "default", me, off ? "停用账户" : "启用账户", target.username, "账户");
		return Response.json({
			ok: true,
			users: data.users.map(publicUser)
		});
	}
	if (op === "createUser") {
		if (me.role !== "admin") return Response.json({ error: "只有管理员能新建账户" }, { status: 403 });
		const username = (body.username || "").trim().toLowerCase();
		const password = (body.password || "").trim();
		const name = (body.name || username).trim();
		if (!username || password.length < 4) return Response.json({ error: "用户名必填，密码至少 4 位" }, { status: 400 });
		if (data.users.some((u) => u.username === username)) return Response.json({ error: "用户名已存在" }, { status: 400 });
		const user = {
			id: uid(),
			username,
			name,
			hash: await hashPassword(password),
			role: body.role === "admin" ? "admin" : "user"
		};
		data.users.push(user);
		const book = body.joinCurrent !== "0" ? data.books.find((b) => b.id === (body.id || tenant.bookId)) : null;
		if (book && user.id !== book.ownerId) {
			const preset = PRESETS.find((x) => x.id === (body.preset || "read"));
			book.members = (book.members || []).filter((m) => m.userId !== user.id);
			book.members.push({
				userId: user.id,
				perms: preset ? [...preset.perms] : ["people.view"]
			});
		}
		await writeFileShape(data);
		await logAuth(tenant.bookId || "default", me, "新建账户", `${name} ${username}${book ? " · 加入当前台账" : ""}`, "账户");
		return Response.json({
			ok: true,
			users: data.users.map(publicUser),
			books: data.books,
			members: book ? publicMembers(book, data.users) : []
		});
	}
	if (op === "deleteUser") {
		if (me.role !== "admin") return Response.json({ error: "只有管理员能删账户" }, { status: 403 });
		if (body.id === me.id) return Response.json({ error: "不能删自己" }, { status: 400 });
		const target = data.users.find((u) => u.id === body.id);
		if (!target) return Response.json({ error: "没有这个人" }, { status: 404 });
		if (target.role === "admin" && data.users.filter((u) => u.role === "admin").length <= 1) return Response.json({ error: "至少留一个管理员" }, { status: 400 });
		data.users = data.users.filter((u) => u.id !== target.id);
		data.books = data.books.map((b) => ({
			...b,
			members: (b.members || []).filter((m) => m.userId !== target.id)
		}));
		const drop = data.books.filter((b) => b.ownerId === target.id && b.id !== "default");
		data.books = data.books.filter((b) => b.ownerId !== target.id || b.id === "default");
		await writeFileShape(data);
		const { removeBookDir } = await import("../_libs/_.mjs").then((n) => n.i);
		for (const b of drop) await removeBookDir(b.id);
		return Response.json({
			ok: true,
			users: data.users.map(publicUser)
		});
	}
	function parsePerms() {
		if (body.preset) {
			const p = PRESETS.find((x) => x.id === body.preset);
			if (p) return [...p.perms];
		}
		const list = body.perms.split(/[,\s]+/).map((s) => s.trim()).filter((s) => s === "*" || ALL_PERMS.includes(s));
		return list.length ? list : [...PRESETS.find((x) => x.id === "read")?.perms || []];
	}
	function canManageMembers() {
		return me.role === "admin" || tenant.book?.ownerId === me.id || hasPerm(tenant.perms, "members.manage");
	}
	if (op === "addMember" || op === "setMember") {
		if (!canManageMembers()) return Response.json({ error: "没有分配权限" }, { status: 403 });
		const book = data.books.find((b) => b.id === (body.id || tenant.bookId));
		if (!book) return Response.json({ error: "没有这套台账" }, { status: 404 });
		if (me.role !== "admin" && book.ownerId !== me.id && !hasPerm(permsOf(me, book), "members.manage")) return Response.json({ error: "只能管理自己的台账成员" }, { status: 403 });
		const target = data.users.find((u) => u.id === body.userId || u.username === body.username.toLowerCase());
		if (!target) return Response.json({ error: "没有这个用户" }, { status: 404 });
		if (target.id === book.ownerId) return Response.json({ error: "创建人权限不能改" }, { status: 400 });
		const perms = parsePerms();
		book.members = (book.members || []).filter((m) => m.userId !== target.id);
		book.members.push({
			userId: target.id,
			perms
		});
		await writeFileShape(data);
		await logAuth(book.id, me, op === "addMember" ? "加入成员" : "修改成员权限", `${target.name} ${target.username}`, "成员");
		return Response.json({
			ok: true,
			books: booksOf(me, data.books),
			members: publicMembers(book, data.users)
		});
	}
	if (op === "removeMember") {
		if (!canManageMembers()) return Response.json({ error: "没有分配权限" }, { status: 403 });
		const book = data.books.find((b) => b.id === (body.id || tenant.bookId));
		if (!book) return Response.json({ error: "没有这套台账" }, { status: 404 });
		if (body.userId === book.ownerId) return Response.json({ error: "不能移除创建人" }, { status: 400 });
		book.members = (book.members || []).filter((m) => m.userId !== body.userId);
		await writeFileShape(data);
		await logAuth(book.id, me, "移除成员", body.userId, "成员");
		return Response.json({
			ok: true,
			books: booksOf(me, data.books),
			members: publicMembers(book, data.users)
		});
	}
	return Response.json({ error: "未知操作" }, { status: 400 });
}
function publicMembers(book, users) {
	return [.../* @__PURE__ */ new Set([book.ownerId, ...(book.members || []).map((m) => m.userId)])].filter(Boolean).map((id) => {
		const u = users.find((x) => x.id === id);
		const m = (book.members || []).find((x) => x.userId === id);
		return {
			userId: id,
			username: u?.username || "",
			name: u?.name || "",
			isOwner: id === book.ownerId,
			perms: id === book.ownerId ? ["*"] : m?.perms || []
		};
	});
}
async function withTenant(request, fn, need) {
	if (!persistOn()) return fn();
	const t = await resolveTenant(request);
	if (t.needSetup) return Response.json({
		error: "need setup",
		needSetup: true
	}, { status: 401 });
	if (!t.user) return Response.json({ error: "login" }, { status: 401 });
	if (!t.bookId) return Response.json({
		error: "还没有台账，请让管理员把你加入",
		noBook: true
	}, { status: 403 });
	if (need === "ledger.write" && !canWriteLedger(t.perms)) return Response.json({ error: "没有修改权限" }, { status: 403 });
	if (need && need !== "ledger.write" && !hasPerm(t.perms, need)) return Response.json({ error: "没有权限" }, { status: 403 });
	return runWithBook(t.bookId, fn);
}
function memberList(book, users) {
	if (!book) return [];
	return publicMembers(book, users);
}
var nas = false;
function nasEnabled() {
	return nas;
}
function timeoutFetch(url, ms, init) {
	const c = new AbortController();
	const t = window.setTimeout(() => c.abort(), ms);
	return fetch(url, {
		...init,
		credentials: "include",
		signal: c.signal
	}).finally(() => window.clearTimeout(t));
}
async function detectNas() {
	try {
		const j = await (await timeoutFetch("/api/health", 2500)).json();
		nas = Boolean(j.persist);
	} catch {
		nas = false;
	}
	return nas;
}
function sliceState(s) {
	return {
		year: s.year,
		years: s.years,
		people: s.people,
		attendance: s.attendance,
		attendanceDocs: s.attendanceDocs || [],
		payments: s.payments,
		contracts: s.contracts || [],
		contractEntries: s.contractEntries || [],
		accessHash: s.accessHash || ""
	};
}
async function pullNasLedger() {
	if (!nas) return;
	const r = await timeoutFetch("/api/ledger", 4e3);
	if (!r.ok) return;
	const j = await r.json();
	if (j.empty) {
		await pushNasLedger();
		return;
	}
	if (!j.people || !Array.isArray(j.people)) return;
	useApp.getState().setAll({
		year: j.year || 2026,
		years: j.years || [j.year || 2026],
		people: j.people,
		attendance: j.attendance || [],
		attendanceDocs: j.attendanceDocs || [],
		payments: j.payments || [],
		contracts: j.contracts || [],
		contractEntries: j.contractEntries || [],
		accessHash: j.accessHash || ""
	});
}
async function pushNasLedger() {
	if (!nas) return;
	if (!canWriteLedger(livePerms())) return;
	const body = sliceState(useApp.getState());
	await fetch("/api/ledger", {
		method: "PUT",
		credentials: "include",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body)
	});
}
async function pushNasBackup() {
	if (!nas) return "";
	const s = useApp.getState();
	const wb = buildFullWorkbook({
		year: s.year,
		people: s.people,
		attendance: s.attendance,
		payments: s.payments
	});
	const { writeCenteredXlsx } = await import("./xlsx-center-Dn_5qFK1.mjs");
	const data = await writeCenteredXlsx(wb);
	const r = await fetch("/api/backup", {
		method: "POST",
		credentials: "include",
		body: data
	});
	if (!r.ok) throw new Error("backup failed");
	return (await r.json()).filename || "";
}
async function startNasSync() {
	await detectNas();
	if (!nas) return false;
	await pullNasLedger();
	let t;
	useApp.subscribe(() => {
		window.clearTimeout(t);
		t = window.setTimeout(() => {
			pushNasLedger();
		}, 500);
	});
	return true;
}
function lastCol(ws) {
	let last = 1;
	(ws.getRow(2).cellCount > 1 ? ws.getRow(2) : ws.getRow(1)).eachCell({ includeEmpty: false }, (cell) => {
		const c = Number(cell.col);
		if (c > last) last = c;
	});
	return last;
}
/** SheetJS 写不出对齐。把第一行标题按整表列宽合并并水平居中。 */
async function writeCenteredXlsx(wb) {
	const raw = writeSync(wb, {
		bookType: "xlsx",
		type: "array"
	});
	const book = new import_excel.default.Workbook();
	await book.xlsx.load(raw);
	for (const ws of book.worksheets) {
		const last = lastCol(ws);
		let filled = 0;
		ws.getRow(1).eachCell({ includeEmpty: false }, () => {
			filled += 1;
		});
		if (filled > 1) {
			ws.getRow(1).alignment = {
				horizontal: "center",
				vertical: "middle",
				wrapText: true
			};
			continue;
		}
		const title = ws.getCell(1, 1).value;
		if (title == null || last < 2) continue;
		try {
			ws.mergeCells(1, 1, 1, last);
		} catch {}
		const cell = ws.getCell(1, 1);
		cell.value = title;
		cell.alignment = {
			horizontal: "center",
			vertical: "middle"
		};
		cell.font = {
			bold: true,
			size: 14,
			name: "Microsoft YaHei"
		};
		ws.getRow(1).height = 24;
		ws.getRow(2).alignment = {
			horizontal: "center",
			vertical: "middle",
			wrapText: true
		};
	}
	return await book.xlsx.writeBuffer();
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "页面出错了"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: error.message || "发生了意外错误，请刷新后重试。"
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink placeholder:text-subtle outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 md:h-10 md:text-sm", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
function YearSwitcher({ compact }) {
	const year = useApp((s) => s.year);
	const years = useApp((s) => s.years);
	const setYear = useApp((s) => s.setYear);
	const addYear = useApp((s) => s.addYear);
	const removeYear = useApp((s) => s.removeYear);
	const attendance = useApp((s) => s.attendance);
	const list = years?.length ? years : [year || 2026];
	const idx = Math.max(0, list.indexOf(year));
	const prev = list[idx - 1];
	const nxt = list[idx + 1];
	const upcoming = nextYear(list);
	function addNext() {
		const created = addYear(upcoming);
		toast.success(`${created} 年已展开`);
	}
	async function dropYear(y) {
		if (list.length <= 1) {
			toast.error("至少保留一年，不能删光");
			return;
		}
		const filled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, y, i + 1).filled > 0).filter(Boolean).length;
		if (!confirmRemoveYear(y, filled)) return;
		try {
			if (nasEnabled()) await pushNasBackup();
		} catch {}
		removeYear(y);
		toast.success(`已删除 ${y} 年考勤。人员、照片、发放记录都还在。`);
	}
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: "field-select h-9 max-w-[8.5rem] shrink-0 text-sm",
		value: year,
		onChange: (e) => setYear(Number(e.target.value)),
		"aria-label": "选择年度",
		children: list.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
			value: y,
			children: [y, "年"]
		}, y))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !prev,
						type: "button",
						onClick: () => prev && setYear(prev),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select h-9 min-w-0 flex-1",
						value: year,
						onChange: (e) => setYear(Number(e.target.value)),
						"aria-label": "选择年度",
						children: list.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: y,
							children: [y, " 年"]
						}, y))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !nxt,
						type: "button",
						onClick: () => nxt && setYear(nxt),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-accent hover:text-ink",
				onClick: addNext,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }),
					"新增 ",
					upcoming,
					" 年"
				]
			}),
			list.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-danger hover:text-danger",
				onClick: () => void dropYear(year),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }),
					"删除 ",
					year,
					" 年"
				]
			}) : null
		]
	});
}
async function authStatus() {
	const j = await (await fetch("/api/auth", { credentials: "include" })).json();
	return {
		persist: Boolean(j.persist),
		needSetup: Boolean(j.needSetup),
		user: j.user || null,
		books: j.books || [],
		bookId: j.bookId || "",
		users: j.users || [],
		perms: j.perms,
		members: j.members || []
	};
}
async function authOp(op, extra = {}) {
	const r = await fetch("/api/auth", {
		method: "POST",
		credentials: "include",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			op,
			...extra
		})
	});
	const j = await r.json();
	if (!r.ok) throw new Error(j.error || "请求失败");
	return j;
}
function BookSwitcher({ compact }) {
	const [books, setBooks] = (0, import_react.useState)([]);
	const [bookId, setBookId] = (0, import_react.useState)("");
	const [user, setUser] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [renaming, setRenaming] = (0, import_react.useState)(false);
	const [renameTo, setRenameTo] = (0, import_react.useState)("");
	async function load() {
		const s = await authStatus();
		if (!s.persist || !s.user) {
			setBooks([]);
			setUser(null);
			return;
		}
		setBooks(s.books);
		setBookId(s.bookId);
		setUser(s.user);
		const n = s.books.find((b) => b.id === s.bookId)?.name || "";
		window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
		setLivePerms(s.persist ? s.perms || [] : ["*"]);
	}
	(0, import_react.useEffect)(() => {
		load();
		const on = () => void load();
		window.addEventListener("gongdi-books", on);
		return () => window.removeEventListener("gongdi-books", on);
	}, []);
	if (!user || !books.length) return null;
	async function switchTo(id) {
		if (id === bookId) return;
		await authOp("useBook", { id });
		setBookId(id);
		const n = books.find((b) => b.id === id)?.name || id;
		window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
		const s = await authStatus();
		setLivePerms(s.persist ? s.perms || [] : ["*"]);
		await pullNasLedger();
		toast.success(`已切换到「${n}」`);
	}
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: "field-select h-9 max-w-[9rem] text-sm",
		value: bookId,
		onChange: (e) => void switchTo(e.target.value),
		children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: b.id,
			children: b.name
		}, b.id))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				className: "field-select h-9 w-full text-sm",
				value: bookId,
				onChange: (e) => void switchTo(e.target.value),
				"aria-label": "当前台账",
				children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: b.id,
					children: b.name
				}, b.id))
			}),
			user.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] text-muted",
				children: "管理员可进入全部台账"
			}) : null,
			renaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "h-9",
					value: renameTo,
					onChange: (e) => setRenameTo(e.target.value),
					placeholder: "台账名称"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					type: "button",
					onClick: async () => {
						const n = renameTo.trim();
						if (!n) return;
						try {
							await authOp("renameBook", {
								id: bookId,
								name: n
							});
							setRenaming(false);
							await load();
							window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
							toast.success(`已改成「${n}」`);
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "改名失败");
						}
					},
					children: "保存"
				})]
			}) : adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "h-9",
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "新台账名称"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					type: "button",
					onClick: async () => {
						if (!name.trim()) return;
						const r = await authOp("createBook", { name: name.trim() });
						setName("");
						setAdding(false);
						await load();
						if (r.bookId) {
							await pullNasLedger();
							toast.success("已新建空台账");
						}
					},
					children: "建"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted hover:text-ink",
					onClick: () => setAdding(true),
					children: "＋ 新建一套台账"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted hover:text-ink",
					onClick: () => {
						setRenameTo(books.find((b) => b.id === bookId)?.name || "");
						setRenaming(true);
					},
					children: "改名"
				})]
			})
		]
	});
}
var VER = /^\[?(v?\d+(?:\.\d+){0,3})\]?\s*$/i;
function normalizeVersion(v) {
	const s = String(v || "").trim().replace(/^v/i, "");
	if (!s) return "0.0.0";
	if (/^\d+$/.test(s)) return Number(s) >= 10 ? `0.0.${s}` : `${s}.0.0`;
	return s;
}
function formatVersion(v) {
	const n = normalizeVersion(v);
	if (n.startsWith("0.0.") && Number(n.slice(4)) >= 10) return n.slice(4);
	return n;
}
function isNewerVersion(remote, local) {
	const a = normalizeVersion(remote).split(".").map((x) => parseInt(x, 10) || 0);
	const b = normalizeVersion(local).split(".").map((x) => parseInt(x, 10) || 0);
	while (a.length < 3) a.push(0);
	while (b.length < 3) b.push(0);
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return false;
}
function parseChangelog(text) {
	const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
	const entries = [];
	let current = "";
	let block = null;
	let sawCurrentLine = false;
	for (const raw of lines) {
		const line = raw.trim();
		if (!line || line.startsWith("#") || line.startsWith("当前")) continue;
		const m = line.match(VER);
		if (m && line.length < 24) {
			const version = normalizeVersion(m[1]);
			const bracket = line.startsWith("[");
			if (!current) current = version;
			if (!bracket && !sawCurrentLine) {
				sawCurrentLine = true;
				continue;
			}
			sawCurrentLine = true;
			if (block && block.version === version) continue;
			if (block) entries.push(block);
			block = {
				version,
				items: []
			};
			continue;
		}
		if (!block) {
			if (!current) current = line;
			continue;
		}
		block.items.push(line.replace(/^[-*·]\s*/, ""));
	}
	if (block) entries.push(block);
	const merged = [];
	for (const e of entries) {
		const last = merged[merged.length - 1];
		if (last && last.version === e.version) last.items.push(...e.items);
		else merged.push({
			version: e.version,
			items: [...e.items]
		});
	}
	if (!current && merged[0]) current = merged[0].version;
	return {
		current: current || "1.0.0",
		entries: merged
	};
}
function WinUpdate({ compact }) {
	const [info, setInfo] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function load() {
		try {
			const d = await (await fetch("/api/update")).json();
			setInfo(d);
			return d;
		} catch {
			setInfo({ error: "检查失败" });
			return null;
		}
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	if (!info?.portable) return null;
	async function apply() {
		if (!confirm("将下载新版本并重启。data 台账不会动。")) return;
		setBusy(true);
		try {
			const r = await fetch("/api/update", { method: "POST" });
			const d = await r.json();
			if (!r.ok || d.error) {
				toast.error(d.error || "更新失败");
				setBusy(false);
				return;
			}
			toast.success("正在更新并重启…");
		} catch {
			toast.error("更新失败");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: compact ? "mt-3" : "rounded-xl border border-line bg-surface p-5",
		children: [
			compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "软件更新"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "从 GitHub 下载 Windows 包并替换程序。data 不覆盖。"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex flex-wrap items-center gap-2 ${compact ? "" : "mt-3"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					disabled: busy,
					onClick: () => void load(),
					children: "检查更新"
				}), info.newer && info.remote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					disabled: busy,
					onClick: () => void apply(),
					children: busy ? "更新中…" : `更新到 ${formatVersion(info.remote)}`
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: info.error || "已是最新"
				})]
			}),
			info.remote ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-subtle",
				children: [
					"GitHub ",
					formatVersion(info.remote),
					" · 本机 ",
					formatVersion(info.local || "")
				]
			}) : null
		]
	});
}
var FALLBACK = {
	current: "1.0.0",
	entries: [{
		version: "1.0.0",
		items: ["点此查看更新记录"]
	}]
};
function VersionLog() {
	const [log, setLog] = (0, import_react.useState)(FALLBACK);
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		fetch("/api/version").then((r) => r.json()).then((d) => {
			if (d?.current) setLog(d);
		}).catch(() => void 0);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "mt-2 block text-[11px] tracking-wide text-subtle underline-offset-2 hover:text-ink hover:underline",
		onClick: () => setOpen(true),
		children: formatVersion(log.current)
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
		onClick: () => setOpen(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "更新记录"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm text-muted hover:text-ink",
						onClick: () => setOpen(false),
						children: "关闭"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinUpdate, { compact: true }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-4 space-y-4",
					children: log.entries.slice(0, 10).map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm font-semibold",
						children: [formatVersion(e.version), e.version === log.current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-xs font-normal text-ok",
							children: "当前"
						}) : null]
					}), e.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-1 list-disc space-y-1 pl-5 text-sm text-muted",
						children: e.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-subtle",
						children: "（无说明）"
					})] }, `${e.version}-${i}`))
				})
			]
		})
	}) : null] });
}
var NAV = [
	{
		to: "/",
		label: "总览",
		icon: LayoutDashboard
	},
	{
		to: "/people",
		label: "人员",
		icon: Users
	},
	{
		to: "/attendance",
		label: "月度考勤",
		icon: CalendarDays
	},
	{
		to: "/payments",
		label: "发放记录",
		icon: Banknote
	},
	{
		to: "/contracts",
		label: "合同管理",
		icon: FileText
	},
	{
		to: "/photos",
		label: "照片",
		icon: Camera
	},
	{
		to: "/files",
		label: "影像资料",
		icon: FolderOpen
	},
	{
		to: "/query",
		label: "个人查询",
		icon: ClipboardList
	},
	{
		to: "/audit",
		label: "操作记录",
		icon: History
	},
	{
		to: "/import",
		label: "导入导出",
		icon: Upload
	},
	{
		to: "/settings",
		label: "设置",
		icon: Settings
	}
];
var TABS = [
	{
		to: "/",
		label: "总览",
		icon: LayoutDashboard
	},
	{
		to: "/attendance",
		label: "考勤",
		icon: CalendarDays
	},
	{
		to: "/contracts",
		label: "合同",
		icon: FileText
	},
	{
		to: "/query",
		label: "查询",
		icon: ClipboardList
	}
];
function useHydrateStore() {
	(0, import_react.useEffect)(() => {
		(async () => {
			try {
				await useApp.persist.rehydrate();
			} catch {}
			try {
				const { startNasSync } = await import("./nas-sync-hvA0Bnfb.mjs");
				await startNasSync();
			} catch {}
			const add = Number(new URLSearchParams(window.location.search).get("addYear") || 0);
			if (add >= 2e3 && add <= 2100) {
				useApp.getState().addYear(add);
				window.history.replaceState(null, "", window.location.pathname);
			}
		})();
	}, []);
}
function AppShell() {
	useHydrateStore();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const year = useApp((s) => s.year);
	const accessHash = useApp((s) => s.accessHash);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [unlocked, setUnlocked] = (0, import_react.useState)(() => !accessHash);
	const [gate, setGate] = (0, import_react.useState)("boot");
	const [acct, setAcct] = (0, import_react.useState)("");
	const [who, setWho] = (0, import_react.useState)(null);
	const [, setPermTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => subscribePerms(() => setPermTick((n) => n + 1)), []);
	async function refreshGate() {
		try {
			const s = await authStatus();
			setAcct(s.user?.name || s.user?.username || "");
			setWho(s.user ? {
				name: s.user.name,
				username: s.user.username,
				role: s.user.role
			} : null);
			setLivePerms(s.persist ? s.perms || [] : ["*"]);
			if (!s.persist) setGate("app");
			else if (s.needSetup) setGate("setup");
			else if (!s.user) setGate("login");
			else if (!s.books.length) setGate("nobook");
			else {
				setGate("app");
				try {
					const { detectNas, pullNasLedger } = await import("./nas-sync-hvA0Bnfb.mjs");
					await detectNas();
					await pullNasLedger();
				} catch {}
			}
		} catch {
			setGate("app");
		}
	}
	(0, import_react.useEffect)(() => {
		refreshGate();
	}, []);
	(0, import_react.useEffect)(() => {
		setUnlocked(!accessHash || gateUnlocked(accessHash));
	}, [accessHash]);
	(0, import_react.useEffect)(() => {
		setOpen(false);
	}, [pathname]);
	if (gate === "boot") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-bg text-sm text-muted",
		children: "加载中…"
	});
	if (gate === "setup") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupScreen, { onOk: () => void refreshGate() });
	if (gate === "login") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcctLogin, { onOk: () => void refreshGate() });
	if (gate === "nobook") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoBookScreen, { onOut: () => void refreshGate() });
	if (accessHash && !unlocked && gate === "app" && !acct) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginScreen, {
		accessHash,
		onOk: () => setUnlocked(true)
	});
	const visNav = NAV.filter((item) => {
		if (item.to === "/import") return can("import.use") || can("export.use");
		const p = NAV_PERM[item.to];
		return !p || can(p);
	});
	const visTabs = TABS.filter((item) => {
		const p = NAV_PERM[item.to];
		return !p || can(p);
	});
	const tabHit = visTabs.some((t) => t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(t.to));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen min-h-dvh overflow-x-hidden bg-bg text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "no-print hidden w-56 shrink-0 flex-col border-r border-line bg-bg-elevated px-4 py-6 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {
						year,
						pathname
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookSwitcher, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YearSwitcher, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-6 flex flex-col gap-1",
						children: visNav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
							...item,
							active: pathname === item.to
						}, item.to))
					}),
					who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhoCard, { who }) : null,
					accessHash || acct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-ink",
						onClick: () => {
							if (acct) {
								authOp("logout").finally(() => {
									lockGate();
									setGate("login");
									toast.success("已退出登录");
								});
								return;
							}
							lockGate();
							setUnlocked(false);
							toast.success("已退出登录");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-3.5" }), "退出登录"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionLog, {})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur md:hidden",
						style: { paddingTop: "max(0.5rem, env(safe-area-inset-top))" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {
							year,
							compact: true,
							pathname
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1",
							children: [
								who ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mr-1 min-w-0 text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-xs font-medium",
										children: who.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-[10px] text-muted",
										children: who.role === "admin" ? "管理员" : who.username
									})]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookSwitcher, { compact: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YearSwitcher, { compact: true })
							]
						})]
					}),
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "no-print space-y-1 border-b border-line bg-surface p-3 md:hidden",
						children: [
							visNav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								...item,
								active: pathname === item.to,
								onClick: () => setOpen(false)
							}, item.to)),
							who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhoCard, { who }) : null,
							accessHash || acct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-11 w-full items-center gap-2 rounded-sm px-3 text-sm text-muted",
								onClick: () => {
									if (acct) {
										authOp("logout").finally(() => {
											lockGate();
											setGate("login");
											toast.success("已退出登录");
										});
										return;
									}
									lockGate();
									setUnlocked(false);
									toast.success("已退出登录");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "退出登录"]
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "px-3 py-4 md:px-8 md:py-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "no-print fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 backdrop-blur md:hidden",
			style: {
				paddingBottom: "env(safe-area-inset-bottom, 0px)",
				gridTemplateColumns: `repeat(${visTabs.length + 1}, minmax(0, 1fr))`
			},
			children: [visTabs.map((item) => {
				const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.to,
					preload: false,
					className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", active ? "text-accent" : "text-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-5" }), item.label]
				}, item.to);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", open || !tabHit ? "text-accent" : "text-muted"),
				onClick: () => setOpen((v) => !v),
				children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" }), "菜单"]
			})]
		})]
	});
}
function SetupScreen({ onOk }) {
	const [username, setUsername] = (0, import_react.useState)("admin");
	const [name, setName] = (0, import_react.useState)("管理员");
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [again, setAgain] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		if (pwd.length < 4) {
			toast.error("密码至少 4 位");
			return;
		}
		if (pwd !== again) {
			toast.error("两次密码不一致");
			return;
		}
		setBusy(true);
		try {
			await authOp("setup", {
				username,
				password: pwd,
				name
			});
			toast.success("管理员已创建");
			onOk();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "创建失败");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "创建管理员"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "第一次使用。原来的数据会放进「默认台账」，不会丢。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "显示名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: name,
							onChange: (e) => setName(e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "登录名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: username,
							onChange: (e) => setUsername(e.target.value),
							autoComplete: "username"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: pwd,
							onChange: (e) => setPwd(e.target.value),
							autoComplete: "new-password"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "再输一次" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: again,
							onChange: (e) => setAgain(e.target.value),
							autoComplete: "new-password"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "submit",
					disabled: busy,
					children: "创建并进入"
				})
			]
		})
	});
}
function NoBookScreen({ onOut }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "还没有台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "这个账户没有自己的台账。请让管理员在「设置 → 这套台账的成员」里把你加进去。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "button",
					variant: "outline",
					onClick: () => {
						authOp("logout").finally(() => onOut());
					},
					children: "退出登录"
				})
			]
		})
	});
}
function AcctLogin({ onOk }) {
	const [username, setUsername] = (0, import_react.useState)("");
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await authOp("login", {
				username,
				password: pwd
			});
			onOk();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "登录失败");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "每个账户各自的数据。以前设过总密码的，用户名填 admin，密码还是原来的。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "用户名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: username,
						onChange: (e) => setUsername(e.target.value),
						autoComplete: "username",
						autoFocus: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "password",
						value: pwd,
						onChange: (e) => setPwd(e.target.value),
						autoComplete: "current-password"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "submit",
					disabled: busy || !username || !pwd,
					children: "登录"
				})
			]
		})
	});
}
function LoginScreen({ accessHash, onOk }) {
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [remember, setRemember] = (0, import_react.useState)(true);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			if (await hashPassword(pwd) !== accessHash) {
				toast.error("密码不对");
				return;
			}
			unlockGate(accessHash, remember);
			onOk();
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		style: { paddingTop: "env(safe-area-inset-top)" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "手机、电脑浏览器都可打开。已开密码时先登录。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gate-login",
						children: "访问密码"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "gate-login",
						className: "mt-1",
						type: "password",
						autoFocus: true,
						value: pwd,
						onChange: (e) => setPwd(e.target.value),
						autoComplete: "current-password",
						enterKeyHint: "done"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-3 flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "size-4",
						checked: remember,
						onChange: (e) => setRemember(e.target.checked)
					}), "本机记住，下次不用再输"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "submit",
					disabled: busy || !pwd,
					children: "进入"
				})
			]
		})
	});
}
function WhoCard({ who }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-lg border border-line bg-surface px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] tracking-wide text-muted",
				children: "当前账户"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "truncate font-medium",
				children: who.name || who.username
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "truncate text-[11px] text-muted",
				children: [who.username, who.role === "admin" ? " · 管理员" : " · 用户"]
			})
		]
	});
}
function Brand({ year, compact, pathname }) {
	const section = (NAV.find((n) => n.to === pathname) || NAV.find((n) => n.to !== "/" && pathname.startsWith(n.to)))?.label || "总览";
	const [book, setBook] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		function apply(name) {
			setBook(name);
		}
		authStatus().then((s) => {
			apply(s.books.find((b) => b.id === s.bookId)?.name || "");
		});
		const on = (e) => apply(e.detail || "");
		window.addEventListener("gongdi-book", on);
		return () => window.removeEventListener("gongdi-book", on);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("font-display truncate font-semibold tracking-tight", compact ? "text-base" : "text-lg"),
			children: book || "台账"
		}), !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-0.5 truncate text-xs text-muted",
			children: [
				year,
				" · ",
				section
			]
		}) : null]
	});
}
function NavLink({ to, label, icon: Icon, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		onClick,
		preload: false,
		className: cn("flex h-11 items-center gap-2 rounded-sm px-3 text-sm transition-colors duration-150 md:h-10", active ? "bg-accent text-accent-fg" : "text-muted hover:bg-accent-soft hover:text-ink"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
	});
}
var styles_default = "/assets/styles-DIWCajj9.css";
var APP_NAME = "台账";
var Route$25 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#2a4a40"
			},
			{
				name: "description",
				content: "人员考勤、工资发放与合同台账"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-title",
				content: APP_NAME
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			}
		],
		links: [{
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon.svg"
		}, {
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-CN",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("noscript", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				style: {
					padding: 16,
					textAlign: "center"
				},
				children: "本系统需要浏览器允许脚本。请关闭拦截后刷新。"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				richColors: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$10 = () => import("./routes-latcMGPP.mjs");
var Route$24 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./attendance-BBZxE-U6.mjs");
var Route$23 = createFileRoute("/attendance")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./audit-hJnzT2XM.mjs");
var Route$22 = createFileRoute("/audit")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./contracts-BKh9xPXP.mjs");
var Route$21 = createFileRoute("/contracts")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./files-CfQGkgf1.mjs");
var Route$20 = createFileRoute("/files")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./import-DAwEWc7E.mjs");
var Route$19 = createFileRoute("/import")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./payments-D2B4HhHU.mjs");
var Route$18 = createFileRoute("/payments")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./people-DomT8X2x.mjs");
var Route$17 = createFileRoute("/people")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./photos-BazJgMD0.mjs");
var Route$16 = createFileRoute("/photos")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./query-BEE7HdFh.mjs");
var Route$15 = createFileRoute("/query")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./settings-BEuqBdx4.mjs");
var Route$14 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route$13 = createFileRoute("/api/audit")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, readAudit } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ entries: [] });
		return withTenant(request, async () => Response.json({ entries: await readAudit() }), "audit.view");
	},
	POST: async ({ request }) => {
		const { persistOn, appendAudit } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant, resolveTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const body = await request.json();
		if (!body.action?.trim()) return Response.json({ error: "缺少操作" }, { status: 400 });
		const t = await resolveTenant(request);
		return withTenant(request, async () => {
			const entry = await appendAudit({
				userId: t.user?.id || "",
				userName: t.user?.name || t.user?.username || "",
				action: body.action.trim().slice(0, 80),
				detail: String(body.detail || "").slice(0, 400),
				module: String(body.module || "").slice(0, 40)
			});
			return Response.json({
				ok: true,
				entry
			});
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, readAudit, writeAudit } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant, resolveTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if ((await resolveTenant(request)).user?.role !== "admin") return Response.json({ error: "只有管理员能改操作记录" }, { status: 403 });
		const body = await request.json();
		if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
		return withTenant(request, async () => {
			const next = (await readAudit()).map((e) => e.id === body.id ? {
				...e,
				action: body.action != null ? String(body.action).slice(0, 80) : e.action,
				detail: body.detail != null ? String(body.detail).slice(0, 400) : e.detail,
				module: body.module != null ? String(body.module).slice(0, 40) : e.module
			} : e);
			await writeAudit(next);
			return Response.json({ ok: true });
		});
	},
	DELETE: async ({ request }) => {
		const { persistOn, readAudit, writeAudit } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant, resolveTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if ((await resolveTenant(request)).user?.role !== "admin") return Response.json({ error: "只有管理员能删操作记录" }, { status: 403 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const ids = (url.searchParams.get("ids") || id).split(",").filter(Boolean);
		return withTenant(request, async () => {
			const list = await readAudit();
			await writeAudit(list.filter((e) => !ids.includes(e.id)));
			return Response.json({ ok: true });
		});
	}
} } });
var Route$12 = createFileRoute("/api/auth")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn } = await import("../_libs/_.mjs").then((n) => n.i);
		if (!persistOn()) return Response.json({
			persist: false,
			needSetup: false,
			user: null,
			books: []
		});
		const { ensureAccounts, resolveTenant, publicUser, memberList } = await import("./accounts.server-CaMFf-P9.mjs");
		const { hasPerm } = await import("../_libs/_2.mjs").then((n) => n.l);
		const data = await ensureAccounts();
		const t = await resolveTenant(request);
		const manage = Boolean(t.user && (t.user.role === "admin" || t.book?.ownerId === t.user.id || hasPerm(t.perms, "members.manage")));
		return Response.json({
			persist: true,
			needSetup: t.needSetup,
			user: t.user ? publicUser(t.user) : null,
			books: t.books,
			bookId: t.bookId,
			perms: t.perms,
			members: t.book ? memberList(t.book, data.users) : [],
			users: t.user && (t.user.role === "admin" || manage) ? data.users.map(publicUser) : []
		});
	},
	POST: async ({ request }) => {
		const { persistOn } = await import("../_libs/_.mjs").then((n) => n.i);
		if (!persistOn()) return Response.json({ error: "未开启 NAS 持久化" }, { status: 400 });
		const { handleAuthPost } = await import("./accounts.server-CaMFf-P9.mjs");
		return handleAuthPost(request);
	}
} } });
var Route$11 = createFileRoute("/api/backup")({ server: { handlers: { POST: async ({ request }) => {
	const { persistOn, saveBackup } = await import("../_libs/_.mjs").then((n) => n.i);
	const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
	if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
	const buf = Buffer.from(await request.arrayBuffer());
	return withTenant(request, async () => {
		const stamp = /* @__PURE__ */ new Date();
		const pad = (n) => String(n).padStart(2, "0");
		const fname = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}_考勤表.xlsx`;
		const path = await saveBackup(buf, fname);
		return Response.json({
			ok: true,
			filename: fname,
			path
		});
	});
} } } });
function kindOf$2(v) {
	if (v === "report" || v === "invoice" || v === "receipt" || v === "attendance") return v;
	return null;
}
var MIME = {
	".pdf": "application/pdf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".xml": "application/xml",
	".ofd": "application/ofd",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".xls": "application/vnd.ms-excel"
};
var Route$10 = createFileRoute("/api/doc")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, findDoc } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return new Response("not found", { status: 404 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const kind = kindOf$2(url.searchParams.get("kind"));
		if (!id || !kind) return new Response("bad request", { status: 400 });
		return withTenant(request, async () => {
			const hit = await findDoc(id, kind);
			if (!hit) return new Response("not found", { status: 404 });
			const mime = MIME[`.${(hit.fileName.split(".").pop() || "").toLowerCase()}`] || "application/octet-stream";
			return new Response(new Uint8Array(hit.buf), { headers: {
				"Content-Type": mime,
				"Content-Disposition": `inline; filename="${encodeURIComponent(hit.fileName)}"`,
				"Cache-Control": "no-store"
			} });
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, saveDoc } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const form = await request.formData();
		const id = String(form.get("id") || "");
		const kind = kindOf$2(String(form.get("kind") || ""));
		const file = form.get("file");
		if (!id || !kind || !(file instanceof File)) return Response.json({ ok: false }, { status: 400 });
		const buf = Buffer.from(await file.arrayBuffer());
		return withTenant(request, async () => {
			await saveDoc(id, kind, buf, file.name);
			return Response.json({
				ok: true,
				fileName: file.name
			});
		}, "files.edit");
	},
	DELETE: async ({ request }) => {
		const { persistOn, removeDocFile } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const kind = kindOf$2(url.searchParams.get("kind"));
		if (!id || !kind) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await removeDocFile(id, kind);
			return Response.json({ ok: true });
		}, "files.edit");
	}
} } });
var Route$9 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => {
	const { persistOn } = await import("../_libs/_.mjs").then((n) => n.i);
	return Response.json({
		persist: persistOn(),
		ok: true
	});
} } } });
var Route$8 = createFileRoute("/api/ledger")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, readLedger } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({
			persist: false,
			empty: true
		});
		return withTenant(request, async () => {
			const data = await readLedger();
			return Response.json({
				persist: true,
				...data
			});
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, writeLedger } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ persist: false }, { status: 400 });
		const body = await request.json();
		return withTenant(request, async () => {
			await writeLedger(body);
			return Response.json({ ok: true });
		}, "ledger.write");
	}
} } });
function kindOf$1(v) {
	if (v === "id" || v === "bank" || v === "ic") return v;
	return null;
}
var Route$7 = createFileRoute("/api/photo")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, findPhotoPath } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ url: null });
		const url = new URL(request.url);
		const name = url.searchParams.get("name") || "";
		const kind = kindOf$1(url.searchParams.get("kind"));
		if (!name || !kind) return Response.json({ url: null });
		return withTenant(request, async () => {
			const hit = await findPhotoPath(name, kind);
			if (!hit) return Response.json({
				url: null,
				file: null
			});
			return Response.json({
				url: `/api/photo-file?name=${encodeURIComponent(name)}&kind=${kind}&v=${encodeURIComponent(hit.file)}`,
				file: hit.file
			});
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, savePhoto } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const body = await request.json();
		const kind = kindOf$1(body.kind || null);
		if (!body.name || !kind || !body.dataUrl) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await savePhoto(body.name, kind, body.dataUrl);
			return Response.json({ ok: true });
		}, "photos.edit");
	},
	DELETE: async ({ request }) => {
		const { persistOn, removePhoto } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const url = new URL(request.url);
		const name = url.searchParams.get("name") || "";
		const kind = kindOf$1(url.searchParams.get("kind"));
		if (!name || !kind) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await removePhoto(name, kind);
			return Response.json({ ok: true });
		}, "photos.edit");
	}
} } });
function kindOf(v) {
	if (v === "id" || v === "bank" || v === "ic") return v;
	return null;
}
var Route$6 = createFileRoute("/api/photo-file")({ server: { handlers: { GET: async ({ request }) => {
	const { persistOn, findPhotoPath } = await import("../_libs/_.mjs").then((n) => n.i);
	const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
	if (!persistOn()) return new Response("no", { status: 404 });
	const url = new URL(request.url);
	const name = url.searchParams.get("name") || "";
	const kind = kindOf(url.searchParams.get("kind"));
	if (!name || !kind) return new Response("no", { status: 404 });
	return withTenant(request, async () => {
		const hit = await findPhotoPath(name, kind);
		if (!hit) return new Response("no", { status: 404 });
		const buf = await readFile(hit.path);
		return new Response(buf, { headers: {
			"content-type": hit.mime,
			"cache-control": "private, max-age=30",
			"content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(hit.file)}`
		} });
	});
} } } });
async function namesFrom(request) {
	const q = (new URL(request.url).searchParams.get("names") || "").split("\n").filter(Boolean);
	if (request.method === "GET") return q;
	const body = await request.json().catch(() => ({}));
	if (Array.isArray(body.names) && body.names.length) return body.names.map(String).filter(Boolean);
	return q;
}
var Route$5 = createFileRoute("/api/photo-flags")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, photoFlags } = await import("../_libs/_.mjs").then((n) => n.i);
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
	},
	POST: async ({ request }) => {
		const { persistOn, photoFlags } = await import("../_libs/_.mjs").then((n) => n.i);
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
	}
} } });
var Route$4 = createFileRoute("/api/photo-scan")({ server: { handlers: { POST: async ({ request }) => {
	const { persistOn, scanPhotoFolder, readLedger } = await import("../_libs/_.mjs").then((n) => n.i);
	const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
	if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
	const body = await request.json().catch(() => ({}));
	return withTenant(request, async () => {
		let names = Array.isArray(body.names) ? body.names.map(String).filter(Boolean) : [];
		if (!names.length) {
			const led = await readLedger();
			names = (Array.isArray(led.people) ? led.people : []).map((p) => String(p.name || "").trim()).filter(Boolean);
		}
		return Response.json(await scanPhotoFolder(names));
	});
} } } });
var REPO = (process.env.UPDATE_REPO || "qq987985/gongdi-ledger").trim();
function portableHome() {
	const h = process.env.GONGDI_HOME?.trim();
	if (h) return h;
	if (process.env.GONGDI_PORTABLE === "1") return process.cwd();
	return "";
}
function isPortable() {
	return Boolean(portableHome());
}
async function localVersion() {
	return parseChangelog(await readVersionText() || "1.0.1").current;
}
async function fetchLatest() {
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": "gongdi-ledger"
		} });
		if (res.status === 404) return { error: "GitHub 上还没有 Windows 安装包（需要先发一次 Release）" };
		if (!res.ok) return { error: `GitHub ${res.status}` };
		const data = await res.json();
		const asset = (data.assets || []).find((a) => /windows/i.test(a.name) && a.name.endsWith(".zip")) || (data.assets || []).find((a) => a.name.endsWith(".zip"));
		let remote = String(data.tag_name || data.name || "").replace(/^win-/, "");
		if (!/v?\d+(?:\.\d+)*/.test(remote)) {
			const m = String(data.body || "").match(/\d+\.\d+\.\d+/) || String(data.body || "").match(/v?\d+/);
			if (m) remote = m[0];
		}
		return {
			remote: remote || "latest",
			url: asset?.browser_download_url || "",
			name: asset?.name || "",
			size: asset?.size || 0,
			notes: data.body || "",
			page: data.html_url || ""
		};
	} catch {
		return { error: "无法连接 GitHub，稍后再试" };
	}
}
async function checkUpdate() {
	const local = await localVersion();
	if (!isPortable()) {
		return { portable: false, local, remote: "", newer: false, error: "" };
	}
	const latest = await fetchLatest();
	if ("error" in latest && latest.error) return {
		portable: isPortable(),
		local,
		remote: "",
		newer: false,
		error: latest.error
	};
	const remote = "remote" in latest ? String(latest.remote || "") : "";
	const url = "url" in latest ? String(latest.url || "") : "";
	return {
		portable: isPortable(),
		local,
		remote,
		newer: isNewerVersion(remote, local),
		url,
		name: "name" in latest ? latest.name : "",
		size: "size" in latest ? latest.size : 0,
		notes: "notes" in latest ? latest.notes : "",
		page: "page" in latest ? latest.page : "",
		error: url ? "" : "Release 里没有 Windows zip"
	};
}
async function applyUpdate() {
	const home = portableHome();
	if (!home) return {
		ok: false,
		error: "只有 Windows 解压版能点更新。Docker 请在 NAS 上 pull 镜像。"
	};
	const info = await checkUpdate();
	if (info.error || !info.url) return {
		ok: false,
		error: info.error || "没有下载地址"
	};
	const tmp = join(tmpdir(), "gongdi-upd");
	await rm(tmp, {
		recursive: true,
		force: true
	});
	await mkdir(tmp, { recursive: true });
	const zipPath = join(tmp, "gongdi-windows.zip");
	const res = await fetch(info.url, {
		headers: {
			"User-Agent": "gongdi-ledger",
			Accept: "application/octet-stream"
		},
		redirect: "follow"
	});
	if (!res.ok) return {
		ok: false,
		error: `下载失败 ${res.status}`
	};
	await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
	const bat = join(home, "正在更新.bat");
	const unpack = join(tmp, "out");
	const script = `@echo off
chcp 65001 >nul
cd /d "${home.replace(/"/g, "")}"
timeout /t 2 /nobreak >nul
if exist "${unpack}" rd /s /q "${unpack}"
mkdir "${unpack}"
tar -xf "${zipPath}" -C "${unpack}"
if exist "${unpack}\\Windows解压即用" (
  set SRC=${unpack}\\Windows解压即用
) else if exist "${unpack}\\app" (
  set SRC=${unpack}
) else (
  for /d %%D in ("${unpack}\\*") do set SRC=%%D
)
if not defined SRC set SRC=${unpack}
xcopy /E /Y /I "%SRC%\\app" "app\\" >nul
if exist "%SRC%\\node\\node.exe" xcopy /E /Y /I "%SRC%\\node" "node\\" >nul
if exist "%SRC%\\启动.bat" copy /Y "%SRC%\\启动.bat" "启动.bat" >nul
if exist "%SRC%\\停止.bat" copy /Y "%SRC%\\停止.bat" "停止.bat" >nul
if exist "%SRC%\\VERSION.txt" copy /Y "%SRC%\\VERSION.txt" "VERSION.txt" >nul
if exist "%SRC%\\说明.txt" copy /Y "%SRC%\\说明.txt" "说明.txt" >nul
start "" "%~dp0启动.bat"
del /q "%~f0"
`;
	await writeFile(bat, script.replace(/\n/g, "\r\n"), "utf8");
	spawn("cmd.exe", ["/c", bat], {
		detached: true,
		stdio: "ignore",
		cwd: home,
		windowsHide: false
	}).unref();
	setTimeout(() => process.exit(0), 800);
	return { ok: true };
}
var Route$3 = createFileRoute("/api/update")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!(await resolveTenant(request)).user) return Response.json({ error: "请先登录" }, { status: 401 });
		const info = await checkUpdate();
		return Response.json({
			...info,
			portable: isPortable()
		});
	},
	POST: async ({ request }) => {
		if (!(await resolveTenant(request)).user) return Response.json({ error: "请先登录" }, { status: 401 });
		if (!isPortable()) return Response.json({ error: "只有 Windows 解压版能点更新" }, { status: 400 });
		try {
			const result = await applyUpdate();
			return Response.json(result, { status: result.ok ? 200 : 400 });
		} catch (e) {
			return Response.json({ error: e instanceof Error ? e.message : "更新失败" }, { status: 500 });
		}
	}
} } });
var Route$2 = createFileRoute("/api/version")({ server: { handlers: { GET: async () => {
	const { readVersionText } = await import("../_libs/_.mjs").then((n) => n.i);
	const text = await readVersionText();
	return Response.json(parseChangelog(text || "1.0.0\n\n[1.0.0]\n左下角点版本号查看更新记录"));
} } } });
async function addYearAndRedirect(request, year) {
	const { persistOn, readLedger, writeLedger } = await import("../_libs/_.mjs").then((n) => n.i);
	const referer = request.headers.get("referer");
	let back = "/";
	try {
		if (referer) back = new URL(referer).pathname || "/";
	} catch {
		back = "/";
	}
	if (year < 2e3 || year > 2100) return Response.redirect(new URL(back, request.url), 303);
	if (!persistOn()) {
		const url = new URL(back, request.url);
		url.searchParams.set("addYear", String(year));
		return Response.redirect(url, 303);
	}
	const data = await readLedger();
	const rec = !("empty" in data && data.empty) ? data : {
		year: 2026,
		years: [2026],
		people: [],
		attendance: [],
		payments: [],
		accessHash: ""
	};
	const years = Array.isArray(rec.years) ? [...rec.years] : [2026];
	if (!years.includes(year)) years.push(year);
	years.sort((a, b) => a - b);
	await writeLedger({
		...rec,
		years,
		year
	});
	return Response.redirect(new URL(back, request.url), 303);
}
var Route$1 = createFileRoute("/api/year")({ server: { handlers: {
	GET: async () => Response.json({ error: "请在月度考勤里新增年份" }, { status: 405 }),
	POST: async ({ request }) => {
		const form = await request.formData();
		return addYearAndRedirect(request, Number(form.get("year") || form.get("add") || 0));
	}
} } });
async function xlsxFile(wb, filename) {
	const data = await writeCenteredXlsx(wb);
	const ascii = filename.replace(/[^\x20-\x7e]/g, "_");
	return new Response(data, { headers: {
		"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
		"Cache-Control": "no-store"
	} });
}
var Route = createFileRoute("/api/file/$kind")({ server: { handlers: { GET: async ({ params, request }) => {
	const url = new URL(request.url);
	const year = Number(url.searchParams.get("year") || "2026") || 2026;
	const kind = params.kind;
	if (kind === "people-template") return xlsxFile(peopleTemplateWb(), "人员导入模板.xlsx");
	if (kind === "attendance-template") return xlsxFile(attendanceTemplateWb(year), `${year}年考勤导入模板.xlsx`);
	if (kind === "payment-template") return xlsxFile(paymentTemplateWb(), "发放记录导入模板.xlsx");
	if (kind === "contract-template") return xlsxFile(contractTemplateWb(), "合同导入模板.xlsx");
	if (kind === "contract-export" || kind === "export") {
		const { persistOn, readLedger } = await import("../_libs/_.mjs").then((n) => n.i);
		const { withTenant } = await import("./accounts.server-CaMFf-P9.mjs");
		const run = async () => {
			const data = persistOn() ? await readLedger() : { empty: true };
			const rec = !("empty" in data && data.empty) ? data : {};
			if (kind === "contract-export") {
				let contracts = rec.contracts || [];
				let contractEntries = rec.contractEntries || [];
				const yearFilter = url.searchParams.get("year");
				const y = Number(yearFilter);
				if (y >= 2e3) {
					contracts = contracts.filter((c) => c.year === y);
					const ids = new Set(contracts.map((c) => c.id));
					contractEntries = contractEntries.filter((e) => ids.has(e.contractId));
				}
				const name = y >= 2e3 ? `${y}年合同明细.xlsx` : "合同明细.xlsx";
				return xlsxFile(buildContractWorkbook({
					contracts,
					entries: contractEntries
				}), name);
			}
			const people = rec.people || [];
			const attendance = rec.attendance || [];
			const payments = rec.payments || [];
			return xlsxFile(buildFullWorkbook({
				year,
				people,
				attendance,
				payments
			}), `${year}年考勤表.xlsx`);
		};
		if (persistOn()) return withTenant(request, run);
		return run();
	}
	return new Response("not found", { status: 404 });
} } } });
var rootRouteChildren = {
	IndexRoute: Route$24.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$25
	}),
	AttendanceRoute: Route$23.update({
		id: "/attendance",
		path: "/attendance",
		getParentRoute: () => Route$25
	}),
	AuditRoute: Route$22.update({
		id: "/audit",
		path: "/audit",
		getParentRoute: () => Route$25
	}),
	ContractsRoute: Route$21.update({
		id: "/contracts",
		path: "/contracts",
		getParentRoute: () => Route$25
	}),
	FilesRoute: Route$20.update({
		id: "/files",
		path: "/files",
		getParentRoute: () => Route$25
	}),
	ImportRoute: Route$19.update({
		id: "/import",
		path: "/import",
		getParentRoute: () => Route$25
	}),
	PaymentsRoute: Route$18.update({
		id: "/payments",
		path: "/payments",
		getParentRoute: () => Route$25
	}),
	PeopleRoute: Route$17.update({
		id: "/people",
		path: "/people",
		getParentRoute: () => Route$25
	}),
	PhotosRoute: Route$16.update({
		id: "/photos",
		path: "/photos",
		getParentRoute: () => Route$25
	}),
	QueryRoute: Route$15.update({
		id: "/query",
		path: "/query",
		getParentRoute: () => Route$25
	}),
	SettingsRoute: Route$14.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$25
	}),
	ApiAuditRoute: Route$13.update({
		id: "/api/audit",
		path: "/api/audit",
		getParentRoute: () => Route$25
	}),
	ApiAuthRoute: Route$12.update({
		id: "/api/auth",
		path: "/api/auth",
		getParentRoute: () => Route$25
	}),
	ApiBackupRoute: Route$11.update({
		id: "/api/backup",
		path: "/api/backup",
		getParentRoute: () => Route$25
	}),
	ApiDocRoute: Route$10.update({
		id: "/api/doc",
		path: "/api/doc",
		getParentRoute: () => Route$25
	}),
	ApiHealthRoute: Route$9.update({
		id: "/api/health",
		path: "/api/health",
		getParentRoute: () => Route$25
	}),
	ApiLedgerRoute: Route$8.update({
		id: "/api/ledger",
		path: "/api/ledger",
		getParentRoute: () => Route$25
	}),
	ApiPhotoRoute: Route$7.update({
		id: "/api/photo",
		path: "/api/photo",
		getParentRoute: () => Route$25
	}),
	ApiPhotoFileRoute: Route$6.update({
		id: "/api/photo-file",
		path: "/api/photo-file",
		getParentRoute: () => Route$25
	}),
	ApiPhotoFlagsRoute: Route$5.update({
		id: "/api/photo-flags",
		path: "/api/photo-flags",
		getParentRoute: () => Route$25
	}),
	ApiPhotoScanRoute: Route$4.update({
		id: "/api/photo-scan",
		path: "/api/photo-scan",
		getParentRoute: () => Route$25
	}),
	ApiUpdateRoute: Route$3.update({
		id: "/api/update",
		path: "/api/update",
		getParentRoute: () => Route$25
	}),
	ApiVersionRoute: Route$2.update({
		id: "/api/version",
		path: "/api/version",
		getParentRoute: () => Route$25
	}),
	ApiYearRoute: Route$1.update({
		id: "/api/year",
		path: "/api/year",
		getParentRoute: () => Route$25
	}),
	ApiFileKindRoute: Route.update({
		id: "/api/file/$kind",
		path: "/api/file/$kind",
		getParentRoute: () => Route$25
	})
};
var routeTree = Route$25._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent,
		defaultPreload: false,
		defaultPendingMinMs: 0
	});
}
//#endregion
export { startNasSync as C, hashPassword as D, Button as E, lockGate as O, sessionToken as S, writeCenteredXlsx as T, pullNasLedger as _, authStatus as a, resolveTenant as b, detectNas as c, handleAuthPost as d, jsonWithCookies as f, publicUser as g, permsOf as h, authOp as i, unlockGate as k, ensureAccounts as l, nasEnabled as m, Label as n, booksOf as o, memberList as p, WinUpdate as r, clearCookieHeaders as s, Input as t, getRouter as u, pushNasBackup as v, withTenant as w, router_exports as x, pushNasLedger as y };
