import { S as writeBookMeta, a as listBookIds, h as runWithBook, l as readBookMeta, n as dataDir, o as persistOn, t as appendAudit } from "./nas-fs.server-DpPyUX49.js";
import { i as PRESETS, o as canWriteLedger, s as hasPerm, t as ALL_PERMS } from "./perms-CYLuVN7r.js";
import { o as uid } from "./utils-DPLvt0U2.js";
import { i as hashPassword } from "./auth-CTHz_Bd5.js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
	await mkdir(join(dataDir(), "accounts"), { recursive: true });
	await writeFile(accountsPath(), JSON.stringify(data, null, 2), "utf8");
	for (const b of data.books) try {
		await writeBookMeta({
			id: b.id,
			name: b.name,
			ownerId: b.ownerId || ""
		});
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
		await writeBookMeta({
			id: b.id,
			name: b.name,
			ownerId: b.ownerId || ""
		});
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
function jsonWithCookies(body, cookiesList, status = 200) {
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
		const { removeBookDir } = await import("./nas-fs.server-3YGMmJPi.js");
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
		const { removeBookDir } = await import("./nas-fs.server-3YGMmJPi.js");
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
	return [...new Set([book.ownerId, ...(book.members || []).map((m) => m.userId)])].filter(Boolean).map((id) => {
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
export { resolveTenant as a, publicUser as i, handleAuthPost as n, withTenant as o, memberList as r, ensureAccounts as t };
