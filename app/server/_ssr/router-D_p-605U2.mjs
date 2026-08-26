import { x as router_exports } from "./router-D_p-605U.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as utils, t as readSync } from "../_libs/xlsx.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/rolldown-runtime-D7D4PA-g.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/nas-fs.server-C7Ms1G3j.js
var nas_fs_server_exports = /* @__PURE__ */ __exportAll({
	appendAudit: () => appendAudit,
	bookRoot: () => bookRoot,
	currentBookId: () => currentBookId,
	dataDir: () => dataDir,
	ensureDirs: () => ensureDirs,
	findDoc: () => findDoc,
	findPhotoPath: () => findPhotoPath,
	listBookIds: () => listBookIds,
	persistOn: () => persistOn,
	photoFlags: () => photoFlags,
	readAudit: () => readAudit,
	readBookMeta: () => readBookMeta,
	readLedger: () => readLedger,
	readVersionText: () => readVersionText,
	removeBookDir: () => removeBookDir,
	removeDocFile: () => removeDocFile,
	removePhoto: () => removePhoto,
	runWithBook: () => runWithBook,
	saveBackup: () => saveBackup,
	saveDoc: () => saveDoc,
	savePhoto: () => savePhoto,
	scanPhotoFolder: () => scanPhotoFolder,
	writeAudit: () => writeAudit,
	writeBookMeta: () => writeBookMeta,
	writeLedger: () => writeLedger
});
var bookAls = new AsyncLocalStorage();
function dataDir() {
	return process.env.DATA_DIR?.trim() || "";
}
function persistOn() {
	return Boolean(dataDir());
}
function safeBookId(id) {
	return id.replace(/[\\/:*?"<>|]/g, "").trim() || "default";
}
function currentBookId() {
	return bookAls.getStore() || "default";
}
function runWithBook(id, fn) {
	return bookAls.run(safeBookId(id), fn);
}
/** 台账数字一律在 data/books/{id}/ ，旧的根目录 ledger.json 启动时迁走 */
function bookRoot() {
	const root = dataDir();
	if (!root) return "";
	return join(root, "books", currentBookId());
}
function isLegacyDefault() {
	return currentBookId() === "default" && existsSync(join(dataDir(), "ledger.json"));
}
function photosRoot() {
	const shared = process.env.PHOTO_DIR?.trim();
	if (shared) return shared;
	const root = dataDir();
	return root ? join(root, "photos") : "";
}
function kindDir(kind) {
	const env = kindEnv(kind).trim();
	if (env) return env;
	const root = photosRoot();
	return root ? join(root, kind) : "";
}
function labelOf(kind) {
	return kind === "id" ? "身份证" : kind === "bank" ? "银行卡" : "IC卡";
}
function kindEnv(kind) {
	return (kind === "id" ? process.env.PHOTO_ID_DIR : kind === "bank" ? process.env.PHOTO_BANK_DIR : process.env.PHOTO_IC_DIR) || "";
}
function safeName(name) {
	return name.replace(/[\\/:*?"<>|]/g, "").trim();
}
function compactName(s) {
	return s.normalize("NFC").replace(/[\\/:*?"<>|]/g, "").replace(/[\s　._\-－—–·•]/g, "").toLowerCase();
}
function photoSearchDirs(kind) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (dir, mixed = false) => {
		const d = (dir || "").trim();
		if (!d || seen.has(d)) return;
		seen.add(d);
		out.push({
			dir: d,
			mixed
		});
	};
	const cn = labelOf(kind);
	const book = bookRoot();
	const root = dataDir();
	const shared = process.env.PHOTO_DIR?.trim() || (root ? join(root, "photos") : "");
	add(kindDir(kind));
	if (book) {
		add(join(book, "photos", kind));
		add(join(book, "photos", cn));
		add(join(book, cn));
	}
	add(kindEnv(kind));
	add(join(shared, kind));
	add(join(shared, cn));
	add(root ? join(root, "photos", kind) : "");
	add(root ? join(root, "photos", cn) : "");
	add(root ? join(root, kind) : "");
	add(root ? join(root, cn) : "");
	add(shared, true);
	add(root ? join(root, "photos") : "", true);
	return out;
}
function photoFileMatches(file, name, kind, requireLabel) {
	const ext = extname(file).toLowerCase();
	if (!PHOTO_EXT.has(ext)) return false;
	const base = file.slice(0, file.length - ext.length);
	const n = compactName(name);
	const b = compactName(base);
	if (!n || !b) return false;
	if (b === n) return !requireLabel;
	return (kind === "id" ? ["身份证", "身份"] : kind === "bank" ? ["银行卡", "银行"] : [
		"ic卡",
		"ic",
		"工卡"
	]).some((lab) => {
		const L = compactName(lab);
		return b.startsWith(n + L) || b.startsWith(n) && b.includes(L);
	});
}
var PHOTO_EXT = /* @__PURE__ */ new Set([
	".jpg",
	".jpeg",
	".png",
	".webp",
	".bmp"
]);
var DOC_CN = {
	report: "报量单",
	invoice: "发票",
	receipt: "收款回单",
	attendance: "考勤影像"
};
function photosBase() {
	const shared = process.env.PHOTO_DIR?.trim();
	if (shared) return shared;
	const root = dataDir();
	return root ? join(root, "photos") : "";
}
async function ensureDirs() {
	const root = dataDir();
	if (!root) return;
	await mkdir(root, { recursive: true });
	await mkdir(join(root, "accounts"), { recursive: true });
	await mkdir(join(root, "books"), { recursive: true });
	await mkdir(join(root, "backups"), { recursive: true });
	await mkdir(join(root, "templates"), { recursive: true });
	const photos = photosBase() || join(root, "photos");
	for (const sub of [
		"id",
		"bank",
		"ic",
		"报量单",
		"发票",
		"收款回单",
		"考勤影像"
	]) await mkdir(join(photos, sub), { recursive: true });
	const book = bookRoot();
	if (book) await mkdir(book, { recursive: true });
	await migrateIntoDataTree();
	await writeDataReadme();
	seedTemplates();
}
async function migrateIntoDataTree() {
	const root = dataDir();
	if (!root) return;
	async function moveFile(from, to) {
		if (!existsSync(from) || existsSync(to)) return;
		await mkdir(dirname(to), { recursive: true });
		try {
			await copyFile(from, to);
		} catch {}
	}
	const defaultDir = join(root, "books", "default");
	await mkdir(defaultDir, { recursive: true });
	await mkdir(join(root, "accounts"), { recursive: true });
	await mkdir(join(root, "backups"), { recursive: true });
	await moveFile(join(root, "accounts.json"), join(root, "accounts", "accounts.json"));
	await moveFile(join(root, "ledger.json"), join(defaultDir, "ledger.json"));
	await moveFile(join(root, "audit.json"), join(defaultDir, "audit.json"));
	await moveFile(join(root, "考勤表.xlsx"), join(root, "backups", "考勤表.xlsx"));
	await migrateOldDocs();
}
async function writeDataReadme() {
	const root = dataDir();
	if (!root) return;
	const p = join(root, "说明.txt");
	const text = `这是台账的全部数据。软件删了重装，只要这个 data 目录还在，账号、台账、照片、合同影像都能恢复。

accounts/     登录账号、密码、台账名单、权限
books/        每本台账的数字（人员、考勤、发放、合同、操作记录）
photos/       全部影像
  id          身份证
  bank        银行卡
  ic          IC卡
  报量单
  发票
  收款回单
  考勤影像
backups/      Excel 备份（含最新「考勤表.xlsx」）
templates/    导入模板

不要删 books 和 accounts。
`;
	try {
		await writeFile(p, text, "utf8");
	} catch {}
}
async function migrateOldDocs() {
	for (const kind of [
		"report",
		"invoice",
		"receipt",
		"attendance"
	]) {
		const dest = docsDir(kind);
		if (!dest) continue;
		await mkdir(dest, { recursive: true });
		for (const dir of docSearchDirs(kind)) {
			if (dir === dest || !existsSync(dir)) continue;
			for (const f of await listDirSafe(dir)) {
				if (f.startsWith(".")) continue;
				const to = join(dest, f);
				if (existsSync(to)) continue;
				try {
					await copyFile(join(dir, f), to);
				} catch {}
			}
		}
	}
}
async function seedTemplates() {
	const root = dataDir();
	if (!root) return;
	const dir = join(root, "templates");
	await mkdir(dir, { recursive: true });
	const needed = [
		["人员导入模板.xlsx", "people"],
		["发放记录导入模板.xlsx", "payment"],
		["合同导入模板.xlsx", "contract"],
		["考勤导入模板.xlsx", "attendance"]
	];
	if (needed.every(([name]) => existsSync(join(dir, name)))) return;
	try {
		const excel = await import("../_libs/_3.mjs").then((n) => n.a);
		const { writeCenteredXlsx } = await import("./xlsx-center-Dn_5qFK1.mjs");
		const year = (/* @__PURE__ */ new Date()).getFullYear();
		const wbs = {
			people: () => excel.peopleTemplateWb(),
			payment: () => excel.paymentTemplateWb(),
			contract: () => excel.contractTemplateWb(),
			attendance: () => excel.attendanceTemplateWb(year)
		};
		for (const [name, key] of needed) {
			const p = join(dir, name);
			if (existsSync(p)) continue;
			const buf = await writeCenteredXlsx(wbs[key]());
			await writeFile(p, Buffer.from(buf));
		}
	} catch {}
}
async function listDirSafe(dir) {
	if (!dir || !existsSync(dir)) return [];
	try {
		return await readdir(dir);
	} catch {
		return [];
	}
}
function ledgerPath() {
	return join(bookRoot(), "ledger.json");
}
async function readLedger() {
	if (!persistOn()) return { empty: true };
	await ensureDirs();
	const p = ledgerPath();
	if (!existsSync(p)) return { empty: true };
	try {
		const raw = JSON.parse(await readFile(p, "utf8"));
		if (!raw || typeof raw !== "object") return { empty: true };
		return raw;
	} catch {
		return { empty: true };
	}
}
async function writeLedger(data) {
	if (!persistOn()) return;
	await ensureDirs();
	await writeFile(ledgerPath(), JSON.stringify(data, null, 2), "utf8");
}
function auditPath() {
	return join(bookRoot(), "audit.json");
}
async function readAudit() {
	if (!persistOn()) return [];
	await ensureDirs();
	const p = auditPath();
	if (!existsSync(p)) return [];
	try {
		const raw = JSON.parse(await readFile(p, "utf8"));
		return (Array.isArray(raw) ? raw : raw.entries || []).filter((x) => x && x.id && x.action);
	} catch {
		return [];
	}
}
async function writeAudit(entries) {
	if (!persistOn()) return;
	await ensureDirs();
	await writeFile(auditPath(), JSON.stringify({ entries: entries.slice(0, 2e3) }, null, 2), "utf8");
}
async function appendAudit(row) {
	const list = await readAudit();
	const entry = {
		id: row.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
		at: row.at || (/* @__PURE__ */ new Date()).toISOString(),
		userId: row.userId || "",
		userName: row.userName || "",
		action: row.action || "",
		detail: row.detail || "",
		module: row.module || ""
	};
	await writeAudit([entry, ...list]);
	return entry;
}
var MIME = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".bmp": "image/bmp"
};
async function findPhotoPath(name, kind) {
	if (!persistOn()) return null;
	await ensureDirs();
	const hit = await findPhotoHit(name, kind);
	if (!hit) return null;
	const ext = extname(hit.file).toLowerCase();
	return {
		path: join(hit.dir, hit.file),
		file: hit.file,
		dir: hit.dir,
		mime: MIME[ext] || "image/jpeg"
	};
}
async function findPhotoHit(name, kind) {
	const n = safeName(name);
	if (!n) return null;
	for (const loc of photoSearchDirs(kind)) {
		const hits = (await listDirSafe(loc.dir)).filter((f) => photoFileMatches(f, n, kind, loc.mixed));
		if (!hits.length) continue;
		hits.sort((a, b) => photoRank(b, n, kind) - photoRank(a, n, kind));
		return {
			dir: loc.dir,
			file: hits[0]
		};
	}
	return null;
}
function photoRank(file, name, kind) {
	const ext = extname(file).toLowerCase();
	const base = compactName(file.slice(0, file.length - ext.length));
	if (base === compactName(name) + compactName(labelOf(kind))) return 4;
	if (base.includes("正面") || base.includes("front")) return 3;
	if (base.includes("反面") || base.includes("back")) return 2;
	return 1;
}
async function savePhoto(name, kind, dataUrl) {
	if (!persistOn()) return;
	await ensureDirs();
	const n = safeName(name);
	if (!n) return;
	const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
	if (!m) return;
	const mime = m[1];
	const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("bmp") ? "bmp" : "jpg";
	const dir = kindDir(kind);
	const files = existsSync(dir) ? await readdir(dir) : [];
	for (const f of files) if (photoFileMatches(f, n, kind, false)) await rm(join(dir, f), { force: true });
	await writeFile(join(dir, `${n}-${labelOf(kind)}.${ext}`), Buffer.from(m[2], "base64"));
}
async function removePhoto(name, kind) {
	if (!persistOn()) return;
	const n = safeName(name);
	if (!n) return;
	for (const loc of photoSearchDirs(kind)) {
		const files = await listDirSafe(loc.dir);
		for (const f of files) if (photoFileMatches(f, n, kind, loc.mixed)) await rm(join(loc.dir, f), { force: true });
	}
}
async function photoFlags(names) {
	const kinds = [
		"id",
		"bank",
		"ic"
	];
	const cache = /* @__PURE__ */ new Map();
	async function filesOf(dir) {
		if (!cache.has(dir)) cache.set(dir, await listDirSafe(dir));
		return cache.get(dir);
	}
	const out = {};
	for (const name of names) {
		const row = {
			id: false,
			bank: false,
			ic: false
		};
		for (const kind of kinds) for (const loc of photoSearchDirs(kind)) if ((await filesOf(loc.dir)).some((f) => photoFileMatches(f, name, kind, loc.mixed))) {
			row[kind] = true;
			break;
		}
		out[name] = row;
	}
	return out;
}
async function scanPhotoFolder(names) {
	await ensureDirs();
	const flags = await photoFlags(names);
	const matched = {
		id: 0,
		bank: 0,
		ic: 0
	};
	for (const n of names) {
		if (flags[n]?.id) matched.id += 1;
		if (flags[n]?.bank) matched.bank += 1;
		if (flags[n]?.ic) matched.ic += 1;
	}
	const dirs = [];
	const seen = /* @__PURE__ */ new Set();
	for (const kind of [
		"id",
		"bank",
		"ic"
	]) for (const loc of photoSearchDirs(kind)) {
		if (seen.has(loc.dir)) continue;
		seen.add(loc.dir);
		const files = (await listDirSafe(loc.dir)).filter((f) => PHOTO_EXT.has(extname(f).toLowerCase()));
		dirs.push({
			dir: loc.dir,
			kind,
			count: files.length,
			samples: files.slice(0, 8)
		});
	}
	return {
		flags,
		matched,
		dirs,
		people: names.length
	};
}
async function saveBackup(buf, filename) {
	if (!persistOn()) return "";
	await ensureDirs();
	const root = dataDir();
	const safe = filename.replace(/[\\/]/g, "") || "backup.xlsx";
	const dest = join(root, "backups", safe);
	await mkdir(join(root, "backups"), { recursive: true });
	await writeFile(dest, buf);
	await writeFile(join(root, "backups", "考勤表.xlsx"), buf);
	return dest;
}
function docsDir(kind) {
	const photos = photosBase();
	return photos ? join(photos, DOC_CN[kind]) : "";
}
function docSearchDirs(kind) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (d) => {
		const p = (d || "").trim();
		if (!p || seen.has(p)) return;
		seen.add(p);
		out.push(p);
	};
	const root = dataDir();
	const book = bookRoot();
	const photos = photosBase();
	add(docsDir(kind));
	add(photos ? join(photos, kind) : "");
	add(root ? join(root, "docs", kind) : "");
	add(root ? join(root, "docs", DOC_CN[kind]) : "");
	add(book ? join(book, "docs", kind) : "");
	add(book ? join(book, "docs", DOC_CN[kind]) : "");
	if (isLegacyDefault() && process.env.DOC_DIR?.trim()) add(join(process.env.DOC_DIR.trim(), kind));
	return out;
}
function safeId(id) {
	return id.replace(/[\\/:*?"<>|]/g, "").trim();
}
async function saveDoc(id, kind, buf, fileName) {
	if (!persistOn()) return;
	await ensureDirs();
	const dir = docsDir(kind);
	if (!dir) return;
	await mkdir(dir, { recursive: true });
	const sid = safeId(id);
	if (!sid) return;
	const ext = extname(fileName || "").slice(0, 8) || ".bin";
	const orig = (fileName || `file${ext}`).replace(/[\\/]/g, "");
	for (const d of docSearchDirs(kind)) for (const f of await listDirSafe(d)) if (f.startsWith(`${sid}--`) || f === `${sid}.name.txt`) await rm(join(d, f), { force: true });
	await writeFile(join(dir, `${sid}--${orig}`), buf);
}
async function removeDocFile(id, kind) {
	if (!persistOn()) return;
	const sid = safeId(id);
	for (const d of docSearchDirs(kind)) for (const f of await listDirSafe(d)) if (f.startsWith(`${sid}--`)) await rm(join(d, f), { force: true });
}
async function findDoc(id, kind) {
	if (!persistOn()) return null;
	const sid = safeId(id);
	for (const d of docSearchDirs(kind)) {
		const hit = (await listDirSafe(d)).find((f) => f.startsWith(`${sid}--`));
		if (!hit) continue;
		const fileName = hit.slice(`${sid}--`.length) || hit;
		return {
			buf: await readFile(join(d, hit)),
			fileName
		};
	}
	return null;
}
async function listBookIds() {
	const dir = join(dataDir(), "books");
	if (!dir || !existsSync(dir)) return [];
	const out = [];
	for (const name of await listDirSafe(dir)) {
		if (name.startsWith(".")) continue;
		const p = join(dir, name);
		if (existsSync(join(p, "ledger.json")) || existsSync(join(p, "book.json"))) out.push(name);
	}
	return out;
}
async function readBookMeta(id) {
	const p = join(dataDir(), "books", safeBookId(id), "book.json");
	if (!existsSync(p)) return null;
	try {
		return JSON.parse(await readFile(p, "utf8"));
	} catch {
		return null;
	}
}
async function writeBookMeta(book) {
	const root = dataDir();
	if (!root) return;
	const dir = join(root, "books", safeBookId(book.id));
	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "book.json"), JSON.stringify({
		id: book.id,
		name: book.name,
		ownerId: book.ownerId || ""
	}, null, 2), "utf8");
}
async function removeBookDir(id) {
	const sid = safeBookId(id);
	if (sid === "default") return;
	const dir = join(dataDir(), "books", sid);
	if (existsSync(dir)) await rm(dir, {
		recursive: true,
		force: true
	});
}
async function readVersionText() {
	const candidates = [
		dataDir() ? join(dataDir(), "VERSION.txt") : "",
		join(process.cwd(), "VERSION.txt"),
		"/app/VERSION.txt",
		"/data/VERSION.txt"
	].filter(Boolean);
	for (const p of candidates) try {
		if (!existsSync(p)) continue;
		return await readFile(p, "utf8");
	} catch {}
	return "";
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/utils-jzhBn2u2.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	const c = globalThis.crypto;
	if (c && typeof c.randomUUID === "function") return c.randomUUID();
	const bytes = /* @__PURE__ */ new Uint8Array(16);
	if (c && typeof c.getRandomValues === "function") c.getRandomValues(bytes);
	else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
	bytes[6] = bytes[6] & 15 | 64;
	bytes[8] = bytes[8] & 63 | 128;
	const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function money(n) {
	return n.toLocaleString("zh-CN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}
function copyText(text) {
	const t = String(text ?? "").trim();
	if (!t || typeof document === "undefined") return false;
	const ta = document.createElement("textarea");
	ta.value = t;
	ta.setAttribute("readonly", "true");
	ta.setAttribute("aria-hidden", "true");
	ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;z-index:-1;";
	document.body.appendChild(ta);
	const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	ta.focus({ preventScroll: true });
	ta.select();
	ta.setSelectionRange(0, t.length);
	let ok = false;
	try {
		ok = document.execCommand("copy");
	} catch {
		ok = false;
	}
	document.body.removeChild(ta);
	prev?.focus({ preventScroll: true });
	if (!ok && navigator.clipboard?.writeText) {
		navigator.clipboard.writeText(t);
		return true;
	}
	return ok;
}
function toggleSel(ids, id, on) {
	if (on) return ids.includes(id) ? ids : [...ids, id];
	return ids.filter((x) => x !== id);
}
function confirmBatchDelete(kind, count, extra = "") {
	if (count <= 0 || typeof window === "undefined") return false;
	const more = extra ? `\n${extra}` : "";
	return window.confirm(`确定删除选中的 ${count} 条${kind}？${more}\n删除后不能撤销。`);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/perms-QS1gZapD.js
var perms_exports = /* @__PURE__ */ __exportAll({
	ALL_PERMS: () => ALL_PERMS,
	NAV_PERM: () => NAV_PERM,
	PERM_GROUPS: () => PERM_GROUPS,
	PRESETS: () => PRESETS,
	can: () => can,
	canWriteLedger: () => canWriteLedger,
	hasPerm: () => hasPerm,
	livePerms: () => livePerms,
	setLivePerms: () => setLivePerms,
	subscribePerms: () => subscribePerms
});
var PERM_GROUPS = [
	{
		key: "people",
		label: "人员",
		items: [
			{
				id: "people.view",
				label: "查看"
			},
			{
				id: "people.edit",
				label: "新增/修改"
			},
			{
				id: "people.delete",
				label: "删除"
			}
		]
	},
	{
		key: "attendance",
		label: "月度考勤",
		items: [
			{
				id: "attendance.view",
				label: "查看"
			},
			{
				id: "attendance.edit",
				label: "录入/修改"
			},
			{
				id: "attendance.delete",
				label: "删除"
			}
		]
	},
	{
		key: "payments",
		label: "发放记录",
		items: [
			{
				id: "payments.view",
				label: "查看"
			},
			{
				id: "payments.edit",
				label: "新增/修改"
			},
			{
				id: "payments.delete",
				label: "删除"
			}
		]
	},
	{
		key: "contracts",
		label: "合同",
		items: [
			{
				id: "contracts.view",
				label: "查看"
			},
			{
				id: "contracts.edit",
				label: "新增/修改"
			},
			{
				id: "contracts.delete",
				label: "删除"
			},
			{
				id: "contracts.print",
				label: "打印对账单"
			}
		]
	},
	{
		key: "photos",
		label: "照片",
		items: [{
			id: "photos.view",
			label: "查看"
		}, {
			id: "photos.edit",
			label: "上传/删除"
		}]
	},
	{
		key: "files",
		label: "影像资料",
		items: [{
			id: "files.view",
			label: "查看"
		}, {
			id: "files.edit",
			label: "上传/删除"
		}]
	},
	{
		key: "query",
		label: "个人查询",
		items: [{
			id: "query.view",
			label: "查看"
		}, {
			id: "query.print",
			label: "打印工资条"
		}]
	},
	{
		key: "io",
		label: "导入导出",
		items: [{
			id: "import.use",
			label: "导入"
		}, {
			id: "export.use",
			label: "导出"
		}]
	},
	{
		key: "settings",
		label: "设置",
		items: [
			{
				id: "settings.year",
				label: "增减年度"
			},
			{
				id: "settings.rules",
				label: "批量工资规则"
			},
			{
				id: "settings.data",
				label: "清空/示例数据"
			}
		]
	},
	{
		key: "audit",
		label: "操作记录",
		items: [{
			id: "audit.view",
			label: "查看"
		}]
	},
	{
		key: "members",
		label: "成员",
		items: [{
			id: "members.manage",
			label: "分配权限"
		}]
	}
];
var ALL_PERMS = PERM_GROUPS.flatMap((g) => g.items.map((i) => i.id));
var PRESETS = [
	{
		id: "all",
		label: "全部权限",
		hint: "和创建人一样",
		perms: [...ALL_PERMS]
	},
	{
		id: "read",
		label: "只读",
		hint: "只能看，不能改",
		perms: ALL_PERMS.filter((p) => p.endsWith(".view") || p === "query.view" || p === "export.use" || p === "audit.view")
	},
	{
		id: "hr",
		label: "考勤发放",
		hint: "人员、考勤、发放、照片、查询",
		perms: [
			"people.view",
			"people.edit",
			"people.delete",
			"attendance.view",
			"attendance.edit",
			"attendance.delete",
			"payments.view",
			"payments.edit",
			"payments.delete",
			"photos.view",
			"photos.edit",
			"query.view",
			"query.print",
			"import.use",
			"export.use",
			"audit.view"
		]
	},
	{
		id: "contract",
		label: "合同财务",
		hint: "合同、影像、导出",
		perms: [
			"contracts.view",
			"contracts.edit",
			"contracts.delete",
			"contracts.print",
			"files.view",
			"files.edit",
			"export.use",
			"audit.view"
		]
	}
];
function hasPerm(perms, id) {
	const list = perms || [];
	if (!list.length) return false;
	if (list.includes("*")) return true;
	if (list.includes(id)) return true;
	if (id.endsWith(".view")) {
		const prefix = id.slice(0, -5);
		if (list.some((p) => p.startsWith(prefix))) return true;
	}
	return false;
}
function canWriteLedger(perms) {
	const list = perms || [];
	if (list.includes("*")) return true;
	return list.some((p) => p.endsWith(".edit") || p.endsWith(".delete") || p === "import.use" || p.startsWith("settings.") || p === "photos.edit" || p === "files.edit");
}
var NAV_PERM = {
	"/": "",
	"/people": "people.view",
	"/attendance": "attendance.view",
	"/payments": "payments.view",
	"/contracts": "contracts.view",
	"/photos": "photos.view",
	"/files": "files.view",
	"/query": "query.view",
	"/audit": "audit.view",
	"/import": "export.use",
	"/settings": ""
};
var live = ["*"];
var listeners = /* @__PURE__ */ new Set();
function setLivePerms(perms) {
	live = perms.length ? perms : [];
	listeners.forEach((fn) => fn());
}
function livePerms() {
	return live;
}
function subscribePerms(fn) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}
function can(id) {
	if (!id) return true;
	return hasPerm(live, id);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/contracts-Du-k7Jy-.js
function parseIdCard(idCard) {
	const s = (idCard || "").trim().toUpperCase();
	if (s.length < 15) return {
		gender: "",
		age: null,
		birthday: ""
	};
	try {
		let birth;
		let gcode;
		if (s.length === 18) {
			birth = /* @__PURE__ */ new Date(`${s.slice(6, 10)}-${s.slice(10, 12)}-${s.slice(12, 14)}T00:00:00`);
			gcode = Number(s[16]);
		} else {
			birth = /* @__PURE__ */ new Date(`19${s.slice(6, 8)}-${s.slice(8, 10)}-${s.slice(10, 12)}T00:00:00`);
			gcode = Number(s[14]);
		}
		if (Number.isNaN(birth.getTime())) return {
			gender: "",
			age: null,
			birthday: ""
		};
		const gender = gcode % 2 === 1 ? "男" : "女";
		const today = /* @__PURE__ */ new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const md = today.getMonth() - birth.getMonth();
		if (md < 0 || md === 0 && today.getDate() < birth.getDate()) age -= 1;
		const y = birth.getFullYear();
		const m = String(birth.getMonth() + 1).padStart(2, "0");
		const d = String(birth.getDate()).padStart(2, "0");
		return {
			gender,
			age,
			birthday: `${y}-${m}-${d}`
		};
	} catch {
		return {
			gender: "",
			age: null,
			birthday: ""
		};
	}
}
function overAgeLabel(age, gender) {
	if (age == null) return "";
	return age >= (gender === "女" ? 45 : 55) ? "超龄" : "未超龄";
}
function parseOtRule(rule) {
	const s = (rule || "").trim();
	if (!s) return {
		kind: "none",
		param: 0,
		label: "不计加班"
	};
	const [head, tail] = s.includes(":") ? s.split(":", 2) : [s, ""];
	const param = Number(tail);
	if (head.startsWith("按小时") && param > 0) return {
		kind: "hour",
		param,
		label: `按小时 ${param} 元`
	};
	if (head.startsWith("折算") && param > 0) return {
		kind: "fold",
		param,
		label: `折算 ${param} 小时/天`
	};
	return {
		kind: "none",
		param: 0,
		label: s
	};
}
function encodeOtRule(kind, param) {
	if (kind === "hour" && param > 0) return `按小时:${param}`;
	if (kind === "fold" && param > 0) return `折算:${param}`;
	return "";
}
function isMonthly(p) {
	return p?.payType === "month";
}
function wageLabel(p) {
	if (!p) return "—";
	if (isMonthly(p)) return p.monthWage ? `¥${p.monthWage}/月` : "未设月薪";
	return p.dailyWage ? `¥${p.dailyWage}/天` : "未设日薪";
}
function foldDaily(p) {
	if (p.dailyWage) return p.dailyWage;
	if (isMonthly(p) && p.monthWage) return round2(p.monthWage / 30);
	return 0;
}
function overtimePay(otHours, dailyWage, rule) {
	const p = parseOtRule(rule);
	if (!otHours || p.kind === "none") return 0;
	if (p.kind === "hour") return round2(otHours * p.param);
	if (p.kind === "fold" && p.param > 0) return round2(otHours / p.param * dailyWage);
	return 0;
}
function monthPay(a, src = 0, otRule = "") {
	const p = typeof src === "number" ? {
		dailyWage: src,
		otRule,
		payType: "day"
	} : src || {};
	const days = a?.days || 0;
	const otHours = a?.otHours || 0;
	const allowance = a?.allowance || 0;
	const deduction = a?.deduction || 0;
	const monthly = isMonthly(p);
	const ot = overtimePay(otHours, foldDaily(p), p.otRule || otRule || "");
	const base = monthly ? days > 0 || otHours > 0 || allowance !== 0 || deduction !== 0 ? p.monthWage || 0 : 0 : round2(days * (p.dailyWage || 0));
	return {
		days,
		otHours,
		allowance,
		deduction,
		ot,
		base,
		pay: round2(base + ot + allowance - deduction),
		monthly
	};
}
function hasWork(a) {
	if (!a) return false;
	return (a.days || 0) > 0 || (a.otHours || 0) > 0 || (a.allowance || 0) !== 0 || (a.deduction || 0) !== 0;
}
function round2(n) {
	return Math.round((n + Number.EPSILON) * 100) / 100;
}
function ymd(y, m, d) {
	if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return "";
	return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function excelSerialYmd(n) {
	if (!Number.isFinite(n)) return "";
	const whole = Math.floor(n);
	if (whole < 2e4 || whole > 8e4) return "";
	const utc = Date.UTC(1899, 11, 30) + whole * 864e5;
	const dt = new Date(utc);
	return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}
/** 把 Excel / 手填的各种日期收成 YYYY-MM-DD */
function parseDateYmd(value) {
	if (value == null || value === "") return "";
	if (value instanceof Date && !Number.isNaN(value.getTime())) return ymd(value.getFullYear(), value.getMonth() + 1, value.getDate());
	if (typeof value === "number") return excelSerialYmd(value);
	let t = String(value).trim();
	if (!t || /^长期/.test(t)) return "";
	t = t.replace(/[T ]\d{1,2}:\d{2}(:\d{2})?.*$/, "").trim();
	if (/^\d{5}(\.\d+)?$/.test(t)) return excelSerialYmd(Number(t));
	let m = t.match(/^(20\d{2}|19\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
	if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
	m = t.match(/^(20\d{2}|19\d{2})[/.](\d{2})(\d{2})$/);
	if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
	m = t.match(/^(20\d{2}|19\d{2})(\d{2})(\d{2})$/);
	if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
	m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|19\d{2}|\d{2})/);
	if (m) {
		let a = Number(m[1]);
		let b = Number(m[2]);
		let y = Number(m[3]);
		if (y < 100) y += y >= 70 ? 1900 : 2e3;
		if (a > 12 && b <= 12) return ymd(y, b, a);
		return ymd(y, a, b);
	}
	m = t.match(/(20\d{2}|19\d{2})\D+(\d{1,2})\D+(\d{1,2})/);
	if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
	return "";
}
function normalizeIdDate(value, allowLong = false) {
	const t = String(value ?? "").trim();
	if (!t) return "";
	if (allowLong && /长期/.test(t)) return "长期";
	return parseDateYmd(t) || t;
}
function dateYearOf(value) {
	const m = (parseDateYmd(value) || String(value || "")).match(/(20\d{2}|19\d{2})/);
	if (!m) return null;
	const y = Number(m[1]);
	return y >= 2e3 && y <= 2100 ? y : null;
}
function derivedYears(s) {
	const set = /* @__PURE__ */ new Set();
	if (s.year) set.add(s.year);
	for (const y of s.years || []) if (y >= 2e3 && y <= 2100) set.add(y);
	for (const a of s.attendance || []) if (a.year >= 2e3 && a.year <= 2100) set.add(a.year);
	if (!set.size) set.add((/* @__PURE__ */ new Date()).getFullYear());
	return [...set].sort((a, b) => a - b);
}
function dateYear(date) {
	return dateYearOf(date);
}
/** 无日期的旧发放记到台账里最早的一年，避免从汇总里消失 */
function paymentYear(p, fallbackYear) {
	return dateYear(p.date) ?? fallbackYear;
}
function paymentsInYear(payments, year, fallbackYear) {
	return payments.filter((p) => paymentYear(p, fallbackYear) === year);
}
function monthStatus(attendance, year, month) {
	const rows = attendance.filter((a) => a.year === year && a.month === month);
	const filled = rows.filter((r) => hasWork(r));
	return {
		total: rows.length,
		filled: filled.length,
		days: filled.reduce((s, r) => s + (r.days || 0), 0),
		otHours: filled.reduce((s, r) => s + (r.otHours || 0), 0),
		allowance: filled.reduce((s, r) => s + (r.allowance || 0), 0),
		deduction: filled.reduce((s, r) => s + (r.deduction || 0), 0)
	};
}
function confirmRemoveYear(y, filledMonths) {
	if (typeof window === "undefined") return false;
	if (!window.confirm(`删除 ${y} 年？\n\n会删除：${y} 年 1–12 月考勤（已录 ${filledMonths} 个月）\n不会删除：人员名单、照片、发放记录、其他年份\n\n至少保留一年。删除后不能撤销。`)) return false;
	return window.confirm(`最后确认：确定删除 ${y} 年的考勤吗？`);
}
function nextYear(years) {
	return (years.length ? Math.max(...years) : (/* @__PURE__ */ new Date()).getFullYear()) + 1;
}
var CONTRACT_STATUSES = [
	"在建",
	"结算",
	"审计"
];
function emptyContract(year) {
	return {
		id: uid(),
		year,
		code: "",
		name: "",
		contractor: "",
		subcontractor: "",
		contractAmount: 0,
		taxRate: 9,
		reportTaxMode: "excl",
		payRatio: 80,
		warrantyStart: "",
		warrantyEnd: "",
		hasDeposit: false,
		depositAmount: 0,
		manager: "",
		status: "在建",
		prelimAmount: 0,
		settleReceivable: 0,
		remark: ""
	};
}
/** 按合同设定，把录入的报量拆成含税 / 不含税 */
function splitTax(amount, taxRate, mode) {
	const rate = (taxRate || 0) / 100;
	const n = amount || 0;
	if (mode === "incl") return {
		entered: n,
		incl: n,
		excl: rate > 0 ? round2(n / (1 + rate)) : n
	};
	return {
		entered: n,
		excl: n,
		incl: round2(n * (1 + rate))
	};
}
function normalizeEntry(e) {
	const amount = Number(e.amount) || 0;
	const taxRate = Number(e.taxRate) || 0;
	let amountExcl = Number(e.amountExcl) || 0;
	if (e.kind === "invoice" && amount && !amountExcl && taxRate > 0) amountExcl = round2(amount / (1 + taxRate / 100));
	const payTo = e.kind === "receipt" ? e.payTo === "worker" ? "worker" : "sub" : "";
	return {
		id: e.id || uid(),
		contractId: e.contractId,
		kind: e.kind,
		date: e.date || "",
		amount,
		amountExcl,
		taxRate,
		workerPay: Number(e.workerPay) || 0,
		workerPayDate: e.workerPayDate || "",
		payTo,
		no: e.no || "",
		remark: e.remark || "",
		fileName: e.fileName || "",
		workerFileName: e.workerFileName || ""
	};
}
/** 旧数据：一笔收款里同时填了代付，拆成两笔（日期可以不同） */
function splitLegacyReceipts(entries) {
	const out = [];
	for (const raw of entries) {
		const e = normalizeEntry(raw);
		if (e.kind !== "receipt") {
			out.push(e);
			continue;
		}
		if (raw.payTo === "worker" || raw.payTo === "sub") {
			out.push(e);
			continue;
		}
		const w = Number(raw.workerPay) || 0;
		const sub = round2((Number(raw.amount) || 0) - w);
		if (w > 0 && sub > 0) {
			out.push(normalizeEntry({
				...e,
				payTo: "sub",
				amount: sub,
				workerPay: 0
			}));
			out.push(normalizeEntry({
				...e,
				id: uid(),
				payTo: "worker",
				amount: w,
				date: raw.workerPayDate || e.date,
				fileName: raw.workerFileName || "",
				workerPay: 0
			}));
		} else if (w > 0) out.push(normalizeEntry({
			...e,
			payTo: "worker",
			amount: w,
			date: raw.workerPayDate || e.date
		}));
		else out.push(normalizeEntry({
			...e,
			payTo: "sub"
		}));
	}
	return out;
}
function contractRollup(c, entries) {
	const mine = entries.filter((e) => e.contractId === c.id);
	const report = round2(mine.filter((e) => e.kind === "report").reduce((s, e) => s + (e.amount || 0), 0));
	const invoice = round2(mine.filter((e) => e.kind === "invoice").reduce((s, e) => s + (e.amount || 0), 0));
	const invoiceExcl = round2(mine.filter((e) => e.kind === "invoice").reduce((s, e) => s + (e.amountExcl || 0), 0));
	const recs = mine.filter((e) => e.kind === "receipt");
	const workerPay = round2(recs.filter((e) => e.payTo === "worker").reduce((s, e) => s + (e.amount || 0), 0));
	const subPay = round2(recs.filter((e) => e.payTo !== "worker").reduce((s, e) => s + (e.amount || 0), 0));
	const paid = round2(workerPay + subPay);
	const tax = splitTax(report, c.taxRate, c.reportTaxMode || "excl");
	const receivable = round2(tax.incl * ((c.payRatio || 0) / 100));
	const remain = round2(invoice - paid);
	const dueRemain = round2(receivable - paid);
	return {
		report,
		reportIncl: tax.incl,
		reportExcl: tax.excl,
		invoice,
		invoiceExcl,
		receipt: paid,
		workerPay,
		subPay,
		payable: receivable,
		remain,
		dueRemain
	};
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/excel-rxvuak20.js
var excel_exports = /* @__PURE__ */ __exportAll({
	attendanceTemplateWb: () => attendanceTemplateWb,
	buildContractWorkbook: () => buildContractWorkbook,
	buildFullWorkbook: () => buildFullWorkbook,
	contractTemplateWb: () => contractTemplateWb,
	detectWorkbookYear: () => detectWorkbookYear,
	parseAttendanceSheet: () => parseAttendanceSheet,
	parseContractWorkbook: () => parseContractWorkbook,
	parseFullAttendanceWorkbook: () => parseFullAttendanceWorkbook,
	parsePaymentSheet: () => parsePaymentSheet,
	parsePeopleSheet: () => parsePeopleSheet,
	paymentTemplateWb: () => paymentTemplateWb,
	peopleTemplateWb: () => peopleTemplateWb
});
var SKIP_SHEETS = /* @__PURE__ */ new Set([
	"人员信息",
	"发放记录",
	"汇总",
	"个人查询",
	"年度",
	"封面",
	"填写说明"
]);
function cellStr(v, header = "") {
	if (v == null || v === "") return "";
	const dateCol = /日期|时间|有效期/.test(header);
	if (v instanceof Date && !Number.isNaN(v.getTime())) return parseDateYmd(v);
	if (typeof v === "number") {
		if (dateCol) return parseDateYmd(v) || String(v);
		return String(v);
	}
	const t = String(v).trim();
	if (dateCol) return parseDateYmd(t) || t;
	return t;
}
function sheetToRows(ws) {
	return utils.sheet_to_json(ws, {
		defval: "",
		raw: true
	}).map((row) => {
		const o = {};
		for (const [k, v] of Object.entries(row)) o[String(k).trim()] = cellStr(v, String(k));
		return o;
	});
}
function sheetRecords(ws) {
	const aoa = utils.sheet_to_json(ws, {
		header: 1,
		defval: "",
		raw: true
	});
	const headerIdx = aoa.findIndex((r) => r.some((c) => [
		"姓名",
		"实际收款人",
		"实际入账人",
		"入账人",
		"项目名称"
	].includes(String(c).trim())));
	if (headerIdx < 0) return sheetToRows(ws);
	const headers = aoa[headerIdx].map((c) => String(c).trim());
	const out = [];
	for (const row of aoa.slice(headerIdx + 1)) {
		const o = {};
		headers.forEach((h, i) => {
			if (h) o[h] = cellStr(row[i], h);
		});
		if (Object.values(o).some((v) => v)) out.push(o);
	}
	return out;
}
function pick(row, keys) {
	for (const k of keys) if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
	return "";
}
function numPick(row, keys) {
	return Number(pick(row, keys)) || 0;
}
function attFromRow(row, year, month) {
	const name = pick(row, ["姓名"]);
	if (!name || name === "合计") return null;
	return {
		id: uid(),
		year,
		month,
		name,
		team: pick(row, ["班组"]),
		days: numPick(row, ["出勤天数", "出勤"]),
		otHours: numPick(row, ["加班小时", "加班"]),
		allowance: numPick(row, [
			"补助",
			"补贴",
			"津贴"
		]),
		deduction: numPick(row, ["扣款", "罚款"]),
		remark: pick(row, ["备注"])
	};
}
function readWb(buf) {
	return readSync(buf, {
		type: "array",
		cellDates: true
	});
}
function detectWorkbookYear(wb, fallback) {
	for (const name of wb.SheetNames) {
		const m = name.match(/(20\d{2})/);
		if (m) return Number(m[1]);
	}
	for (const name of wb.SheetNames) {
		const aoa = utils.sheet_to_json(wb.Sheets[name], {
			header: 1,
			defval: "",
			raw: false
		});
		for (const row of aoa) for (let i = 0; i < row.length; i++) {
			const cell = String(row[i] ?? "");
			const tagged = cell.match(/本年度[：:\s]*?(20\d{2})/);
			if (tagged) return Number(tagged[1]);
			if (cell.includes("本年度") || cell === "年度") {
				const n = Number(row[i + 1]);
				if (n >= 2e3 && n <= 2100) return n;
			}
			if (/^20\d{2}$/.test(cell) && String(row[i - 1] ?? "").includes("年度")) return Number(cell);
		}
	}
	return fallback;
}
function rowToPerson(row) {
	const name = pick(row, ["姓名", "name"]);
	if (!name || name === "合计" || name.includes("使用说明") || name === "人员信息表") return null;
	const idCard = pick(row, [
		"身份证号",
		"身份证",
		"idCard"
	]);
	const parsed = parseIdCard(idCard);
	return {
		id: uid(),
		name,
		team: pick(row, ["班组", "team"]),
		personNo: pick(row, [
			"IC卡号",
			"IC卡",
			"人员编号",
			"personNo"
		]),
		batchNo: pick(row, ["批单号", "batchNo"]),
		cardType: pick(row, ["卡类别", "cardType"]),
		idCard,
		gender: parsed.gender || pick(row, ["性别"]),
		age: parsed.age,
		birthday: parsed.birthday,
		phone: pick(row, [
			"联系电话",
			"手机号",
			"电话"
		]),
		dailyWage: Number(pick(row, ["日工资", "dailyWage"])) || 0,
		monthWage: Number(pick(row, ["月工资", "monthWage"])) || 0,
		payType: /月/.test(pick(row, [
			"计薪方式",
			"计薪",
			"payType"
		])) ? "month" : "day",
		otRule: pick(row, [
			"加班规则",
			"计算加班规则",
			"otRule"
		]),
		bank: pick(row, ["开户行", "bank"]),
		cardNo: pick(row, [
			"银行卡号",
			"卡号",
			"cardNo"
		]),
		address: pick(row, [
			"户籍地址",
			"户籍地地址",
			"户籍地",
			"address"
		]),
		idIssuer: pick(row, ["身份证签发机关", "签发机关"]),
		idValidFrom: normalizeIdDate(pick(row, [
			"身份证有效期开始时间",
			"身份证有效期开始",
			"有效期开始"
		])),
		idValidTo: normalizeIdDate(pick(row, [
			"身份证有效期结束时间",
			"身份证有效期结束",
			"有效期结束",
			"有效期截止"
		]), true),
		remark: pick(row, ["备注"]),
		nation: pick(row, ["民族"]),
		nativePlace: pick(row, ["籍贯"]),
		livePlace: pick(row, ["实际居住地"]),
		icValidFrom: pick(row, ["有效期起始日期"]),
		icValidTo: pick(row, ["有效期截止日期", "ic卡有效期"])
	};
}
function parsePeopleSheet(buf) {
	const wb = readWb(buf);
	const preferred = wb.SheetNames.find((n) => n.includes("人员")) || wb.SheetNames[0];
	return sheetRecords(wb.Sheets[preferred]).map(rowToPerson).filter((x) => Boolean(x));
}
function parseAttendanceSheet(buf, year) {
	const wb = readWb(buf);
	const y = detectWorkbookYear(wb, year);
	const out = [];
	for (const name of wb.SheetNames) {
		if (SKIP_SHEETS.has(name)) continue;
		const monthMatch = name.match(/(\d+)\s*月/);
		const rows = sheetRecords(wb.Sheets[name]);
		for (const row of rows) {
			const month = Number(pick(row, ["月份", "月"])) || (monthMatch ? Number(monthMatch[1]) : 0);
			const sheetYear = name.match(/(20\d{2})/);
			const rec = attFromRow(row, sheetYear ? Number(sheetYear[1]) : y, month);
			if (rec) out.push(rec);
		}
	}
	return out;
}
function normalizeDate(s) {
	return parseDateYmd(s) || (s || "").trim();
}
function rowToPayment(row) {
	const owner = pick(row, [
		"实际收款人",
		"实际入账人",
		"入账人"
	]) || pick(row, ["姓名"]);
	if (!owner || owner === "合计") return null;
	const receiver = pick(row, ["收款人"]) || owner;
	return {
		id: uid(),
		owner,
		receiver,
		date: normalizeDate(pick(row, ["发放日期", "日期"])),
		amount: Number(pick(row, [
			"发放金额(元)",
			"发放金额",
			"金额"
		])) || 0,
		source: pick(row, ["发放方", "来源"]),
		remark: pick(row, ["备注"])
	};
}
function parsePaymentSheet(buf) {
	const wb = readWb(buf);
	const preferred = wb.SheetNames.find((n) => n.includes("发放")) || wb.SheetNames[0];
	return sheetRecords(wb.Sheets[preferred]).map(rowToPayment).filter((x) => x !== null);
}
function parseFullAttendanceWorkbook(buf, fallbackYear) {
	const wb = readWb(buf);
	const year = detectWorkbookYear(wb, fallbackYear);
	const peopleName = wb.SheetNames.find((n) => n.includes("人员")) || wb.SheetNames[0];
	const people = sheetRecords(wb.Sheets[peopleName]).map(rowToPerson).filter((x) => Boolean(x));
	const attendance = [];
	for (const name of wb.SheetNames) {
		if (SKIP_SHEETS.has(name) && !/\d+\s*月/.test(name)) continue;
		const monthMatch = name.match(/(\d+)\s*月/);
		if (!monthMatch) continue;
		const month = Number(monthMatch[1]);
		for (const row of sheetRecords(wb.Sheets[name])) {
			const rec = attFromRow(row, year, month);
			if (rec) attendance.push(rec);
		}
	}
	const payName = wb.SheetNames.find((n) => n.includes("发放"));
	return {
		year,
		people,
		attendance,
		payments: payName ? sheetRecords(wb.Sheets[payName]).map(rowToPayment).filter((x) => x !== null) : []
	};
}
var DEMO_PEOPLE = [
	[
		"姓名",
		"班组",
		"IC卡号",
		"批单号",
		"身份证号",
		"身份证签发机关",
		"身份证有效期开始",
		"身份证有效期结束",
		"联系电话",
		"计薪方式",
		"日工资",
		"月工资",
		"加班规则",
		"开户行",
		"银行卡号",
		"户籍地址",
		"备注"
	],
	[
		"张三",
		"一班",
		"DEMO001",
		"",
		"110101199001011210",
		"北京市公安局东城分局",
		"2020-01-01",
		"2040-01-01",
		"13800001234",
		"按工天",
		"280",
		"",
		"按小时:25",
		"中国工商银行北京分行",
		"6222021234567890123",
		"北京市东城区示例路1号",
		"示例数据，导入前请改成自己的人"
	],
	[
		"李四",
		"二班",
		"DEMO002",
		"",
		"320106198506154512",
		"上海市公安局浦东分局",
		"2018-06-15",
		"长期",
		"13900005678",
		"按工天",
		"260",
		"",
		"折算:8",
		"中国农业银行上海分行",
		"6228481234567890123",
		"上海市浦东新区示例路8号",
		"示例数据，导入前请改成自己的人"
	]
];
var DEMO_ATT = [
	[
		"姓名",
		"出勤天数",
		"加班小时",
		"补助",
		"扣款"
	],
	[
		"张三",
		26,
		12,
		200,
		0
	],
	[
		"李四",
		22,
		8,
		0,
		50
	]
];
var DEMO_PAY = [
	[
		"实际收款人",
		"发放日期",
		"发放金额(元)",
		"发放方",
		"收款人",
		"备注"
	],
	[
		"张三",
		"2026-04-28",
		1e4,
		"示例工程4月请款",
		"张三",
		"本人"
	],
	[
		"李四",
		"",
		8e3,
		"示例工程4月请款",
		"张三",
		"已上报未发，日期可空"
	]
];
function titledSheet(title, rows) {
	const cols = Math.max(1, ...rows.map((r) => r.length));
	const aoa = [[title], ...rows];
	const ws = utils.aoa_to_sheet(aoa);
	ws["!merges"] = [{
		s: {
			r: 0,
			c: 0
		},
		e: {
			r: 0,
			c: cols - 1
		}
	}];
	const cell = ws["A1"];
	if (cell) cell.s = {
		alignment: {
			horizontal: "center",
			vertical: "center"
		},
		font: {
			bold: true,
			sz: 14
		}
	};
	return ws;
}
function sheetFromAoa(aoa) {
	if (aoa.length >= 2 && aoa[0].length === 1 && typeof aoa[0][0] === "string") return titledSheet(String(aoa[0][0]), aoa.slice(1));
	const ws = utils.aoa_to_sheet(aoa);
	const cols = Math.max(1, ...aoa.map((r) => r.length));
	if (aoa[0] && aoa[0].length === 1) {
		ws["!merges"] = [{
			s: {
				r: 0,
				c: 0
			},
			e: {
				r: 0,
				c: cols - 1
			}
		}];
		const cell = ws["A1"];
		if (cell) cell.s = {
			alignment: {
				horizontal: "center",
				vertical: "center"
			},
			font: {
				bold: true,
				sz: 14
			}
		};
	}
	return ws;
}
function noteSheet(lines) {
	return utils.aoa_to_sheet(lines.map((x) => [x]));
}
function peopleTemplateWb() {
	const wb = utils.book_new();
	utils.book_append_sheet(wb, titledSheet("人员导入模板", DEMO_PEOPLE), "人员导入");
	utils.book_append_sheet(wb, noteSheet([
		"填写说明（此表不会导入）",
		"1. 第二行起是虚构示例：张三、李四，请改成你自己的人再导入。",
		"2. 带 * 必填：姓名、班组。按工天填日工资，按月填月工资。",
		"3. 计薪方式填「按工天」或「按月」。加班规则：按小时:25 或 折算:8，也可空。",
		"4. 身份证号会自动生成性别、年龄、生日。"
	]), "填写说明");
	return wb;
}
function attendanceTemplateWb(year) {
	const wb = utils.book_new();
	utils.book_append_sheet(wb, titledSheet("考勤导入模板", DEMO_ATT), "考勤");
	utils.book_append_sheet(wb, noteSheet([
		"填写说明（此表不会导入）",
		"只填当月实际出勤的人，不必把全员都写上。",
		"列：姓名、出勤天数、加班小时、补助、扣款。",
		"应发：按工天 = 出勤×日工资 + 加班费 + 补助 − 扣款。按月 = 有出勤则月工资 + 加班费 + 补助 − 扣款。",
		"示例张三、李四请改成自己的姓名。",
		`导入时会询问写入哪一年哪一月。当前默认年：${year}`
	]), "填写说明");
	return wb;
}
function paymentTemplateWb() {
	const wb = utils.book_new();
	utils.book_append_sheet(wb, titledSheet("发放记录导入模板", DEMO_PAY), "发放记录");
	utils.book_append_sheet(wb, noteSheet([
		"填写说明（此表不会导入）",
		"实际收款人 = 入账人（钱记在谁头上）。",
		"收款人 = 去银行领钱的人，可以帮实际收款人代收。",
		"发放日期可空：空=已上报还没发，以后在软件里勾选再统一补日期。",
		"日期写成 2026/4/28 或 2026-04-28 都可以。",
		"请把张三、李四改成自己的人再导入。"
	]), "填写说明");
	return wb;
}
function buildFullWorkbook(args) {
	const { year, people, attendance, payments } = args;
	const wb = utils.book_new();
	const yearPays = paymentsInYear(payments, year, year);
	const peopleAoa = [["人员信息表"], [
		"序号",
		"姓名",
		"班组",
		"计薪方式",
		"日工资",
		"月工资",
		"计算加班规则",
		"性别",
		"年龄",
		"生日",
		"身份证号",
		"身份证有效期开始",
		"身份证有效期结束",
		"户籍地地址",
		"身份证签发机关",
		"开户行",
		"卡号",
		"备注"
	]];
	people.forEach((p, i) => {
		peopleAoa.push([
			i + 1,
			p.name,
			p.team,
			p.payType === "month" ? "按月" : "按工天",
			p.dailyWage || "",
			p.monthWage || "",
			p.otRule,
			p.gender,
			p.age ?? "",
			p.birthday,
			p.idCard,
			p.idValidFrom,
			p.idValidTo,
			p.address,
			p.idIssuer,
			p.bank,
			p.cardNo,
			p.remark
		]);
	});
	utils.book_append_sheet(wb, sheetFromAoa(peopleAoa), "人员信息");
	for (let m = 1; m <= 12; m++) {
		const monthRows = attendance.filter((a) => a.year === year && a.month === m && a.name.trim() && hasWork(a));
		const aoa = [[`${year}年${m}月考勤`], [
			"序号",
			"姓名",
			"班组",
			"出勤天数",
			"加班小时",
			"补助",
			"扣款",
			"计薪",
			"工资",
			"加班费",
			"应发工资",
			"加班规则",
			"备注"
		]];
		monthRows.forEach((a, i) => {
			const p = people.find((x) => x.name === a.name);
			const calc = monthPay(a, p);
			aoa.push([
				i + 1,
				a.name,
				a.team || p?.team || "",
				calc.days || "",
				calc.otHours || "",
				calc.allowance || "",
				calc.deduction || "",
				p?.payType === "month" ? "按月" : "按工天",
				p?.payType === "month" ? p.monthWage || "" : p?.dailyWage || "",
				calc.ot || "",
				calc.pay || "",
				p?.otRule || "",
				a.remark || ""
			]);
		});
		utils.book_append_sheet(wb, sheetFromAoa(aoa), `${m}月考勤`);
	}
	const payAoa = [["发放记录表"], [
		"序号",
		"实际收款人",
		"发放日期",
		"发放金额(元)",
		"发放方",
		"收款人",
		"备注"
	]];
	yearPays.forEach((p, i) => {
		payAoa.push([
			i + 1,
			p.owner,
			p.date,
			p.amount,
			p.source,
			p.receiver,
			p.remark
		]);
	});
	utils.book_append_sheet(wb, sheetFromAoa(payAoa), "发放记录");
	const sumAoa = [[`${year}年度工资汇总表`], [
		"序号",
		"姓名",
		"班组",
		"1月",
		"2月",
		"3月",
		"4月",
		"5月",
		"6月",
		"7月",
		"8月",
		"9月",
		"10月",
		"11月",
		"12月",
		"全年合计",
		"已发放金额",
		"未发放金额",
		"发放状态"
	]];
	const workers = people.filter((p) => attendance.some((a) => a.year === year && a.name === p.name && hasWork(a)));
	workers.forEach((p, i) => {
		const months = [];
		for (let m = 1; m <= 12; m++) {
			const a = attendance.find((x) => x.year === year && x.month === m && x.name === p.name);
			months.push(monthPay(a, p).pay);
		}
		const total = months.reduce((s, n) => s + n, 0);
		const paid = yearPays.filter((x) => x.owner === p.name && x.date).reduce((s, x) => s + x.amount, 0);
		const unpaid = total - paid;
		const status = total === 0 ? "未计" : unpaid <= 0 ? "已结清" : paid > 0 ? "部分发放" : "未发放";
		sumAoa.push([
			i + 1,
			p.name,
			p.team,
			...months.map((n) => n || ""),
			total || "",
			paid || "",
			unpaid || "",
			status
		]);
	});
	utils.book_append_sheet(wb, sheetFromAoa(sumAoa), "汇总");
	const workAoa = [[`${year}年度工天加班汇总表`], [
		"序号",
		"姓名",
		"班组",
		"1月工天",
		"1月加班",
		"2月工天",
		"2月加班",
		"3月工天",
		"3月加班",
		"4月工天",
		"4月加班",
		"5月工天",
		"5月加班",
		"6月工天",
		"6月加班",
		"7月工天",
		"7月加班",
		"8月工天",
		"8月加班",
		"9月工天",
		"9月加班",
		"10月工天",
		"10月加班",
		"11月工天",
		"11月加班",
		"12月工天",
		"12月加班",
		"全年工天",
		"全年加班"
	]];
	workers.forEach((p, i) => {
		const cells = [];
		let daysSum = 0;
		let otSum = 0;
		for (let m = 1; m <= 12; m++) {
			const a = attendance.find((x) => x.year === year && x.month === m && x.name === p.name);
			const d = a?.days || 0;
			const o = a?.otHours || 0;
			daysSum += d;
			otSum += o;
			cells.push(d || "", o || "");
		}
		workAoa.push([
			i + 1,
			p.name,
			p.team,
			...cells,
			daysSum || "",
			otSum || ""
		]);
	});
	utils.book_append_sheet(wb, sheetFromAoa(workAoa), "工天加班");
	return wb;
}
function yesNo(s) {
	const t = (s || "").trim();
	if (!t) return false;
	if (/^(无|否|没有|n|no|0)$/i.test(t)) return false;
	if (/^(有|是|保证金|押金|y|yes|1)$/i.test(t)) return true;
	return Number(t) > 0;
}
function parseTaxMode(s) {
	const t = (s || "").replace(/\s/g, "");
	if (/含税/.test(t) && !/不含/.test(t)) return "incl";
	if (/不含/.test(t)) return "excl";
	if (/^incl$/i.test(t)) return "incl";
	return "excl";
}
function parsePct(s) {
	const t = (s || "").replace(/%/g, "").trim();
	const n = Number(t);
	return Number.isFinite(n) ? n : 0;
}
function parseContractWorkbook(buf) {
	const wb = readWb(buf);
	const contracts = [];
	const entries = [];
	const byKey = /* @__PURE__ */ new Map();
	function keyOf(c) {
		return `${c.year}|${c.code}|${c.name}`;
	}
	for (const name of wb.SheetNames) {
		if (name.includes("填写说明")) continue;
		const rows = sheetRecords(wb.Sheets[name]);
		const isEntrySheet = /报量|开票|收款/.test(name) && !name.includes("合同");
		for (const row of rows) {
			if (isEntrySheet || pick(row, [
				"流水类型",
				"类型",
				"kind"
			])) {
				const kindRaw = pick(row, [
					"流水类型",
					"类型",
					"kind"
				]) || (name.includes("开票") ? "开票" : name.includes("收款") ? "收款" : "报量");
				const kind = kindRaw.includes("开票") ? "invoice" : kindRaw.includes("收款") ? "receipt" : "report";
				const project = pick(row, ["项目名称", "项目"]);
				if (!project) continue;
				const year = Number(pick(row, ["年份"])) || 0;
				const code = pick(row, ["项目号"]);
				const c = [...byKey.values()].find((x) => x.name === project && (!year || x.year === year) && (!code || x.code === code)) || contracts.find((x) => x.name === project);
				if (!c) continue;
				entries.push(normalizeEntry({
					contractId: c.id,
					kind,
					date: pick(row, ["日期", "发放日期"]) || `${c.year}-01-01`,
					amount: numPick(row, [
						"金额",
						"含税金额",
						"收款总金额",
						"月报量金额",
						"开票金额",
						"收款账金额",
						"收款金额"
					]),
					amountExcl: numPick(row, ["不含税金额", "开票不含税"]),
					taxRate: parsePct(pick(row, ["开票税率", "税率"])) || (kind === "invoice" ? c.taxRate : 0),
					workerPay: numPick(row, [
						"代付农民工",
						"总包代付农民工",
						"农民工代付"
					]),
					payTo: /代付|农民工/.test(pick(row, ["收款去向", "去向"])) ? "worker" : kind === "receipt" ? "sub" : "",
					no: pick(row, [
						"发票号",
						"期次",
						"单号"
					]),
					remark: pick(row, ["备注"])
				}));
				continue;
			}
			const project = pick(row, ["项目名称"]);
			if (!project || project === "合计") continue;
			const year = Number(pick(row, ["年份"])) || (/* @__PURE__ */ new Date()).getFullYear();
			const code = pick(row, ["项目号"]);
			const depositRaw = pick(row, [
				"保证金",
				"是否有保证金",
				"是否有押金",
				"押金"
			]);
			const c = {
				id: uid(),
				year,
				code,
				name: project,
				contractor: pick(row, ["总包"]),
				subcontractor: pick(row, ["分包"]),
				contractAmount: numPick(row, [
					"合同金额/结算金额",
					"合同金额",
					"结算金额"
				]),
				taxRate: parsePct(pick(row, ["税率"])),
				reportTaxMode: parseTaxMode(pick(row, [
					"报量含税",
					"报量计税",
					"报量按"
				])),
				payRatio: parsePct(pick(row, ["合同付款比例", "付款比例"])),
				warrantyStart: pick(row, ["质保期开始时间", "质保期开始"]),
				warrantyEnd: pick(row, ["质保期结束时间", "质保期结束"]),
				hasDeposit: yesNo(depositRaw),
				depositAmount: numPick(row, ["保证金金额", "押金金额"]) || (Number(depositRaw) > 1 ? Number(depositRaw) : 0),
				manager: pick(row, [
					"项目部经营人员",
					"经营人员",
					"项目部\n经营人员"
				]),
				status: /审计/.test(pick(row, ["项目进度", "进度"])) ? "审计" : /结算/.test(pick(row, ["项目进度", "进度"])) ? "结算" : "在建",
				prelimAmount: numPick(row, ["初审金额"]),
				settleReceivable: numPick(row, ["结算应收金额"]),
				remark: pick(row, ["备注"])
			};
			if (c.hasDeposit && !c.depositAmount && Number(depositRaw) > 1) c.depositAmount = Number(depositRaw);
			contracts.push(c);
			byKey.set(keyOf(c), c);
			const report = numPick(row, ["月报量金额", "月报量"]);
			const invoice = numPick(row, ["开票金额"]);
			const receipt = numPick(row, ["收款账金额", "收款金额"]);
			if (report) entries.push(normalizeEntry({
				contractId: c.id,
				kind: "report",
				date: `${year}-01-31`,
				amount: report,
				no: "导入合计",
				remark: "从表合计拆出，可再拆明细"
			}));
			if (invoice) entries.push(normalizeEntry({
				contractId: c.id,
				kind: "invoice",
				date: `${year}-01-31`,
				amount: invoice,
				taxRate: c.taxRate,
				no: "导入合计",
				remark: "从表合计拆出，可再拆明细"
			}));
			if (receipt) entries.push(normalizeEntry({
				contractId: c.id,
				kind: "receipt",
				date: `${year}-01-31`,
				amount: receipt,
				workerPay: numPick(row, ["代付农民工", "总包代付农民工"]),
				no: "导入合计",
				remark: "从表合计拆出，可再拆明细"
			}));
		}
	}
	return {
		contracts,
		entries: splitLegacyReceipts(entries)
	};
}
function contractTemplateWb() {
	const wb = utils.book_new();
	utils.book_append_sheet(wb, titledSheet("合同导入模板", [[
		"序号",
		"年份",
		"项目号",
		"项目名称",
		"总包",
		"分包",
		"合同金额/结算金额",
		"税率",
		"报量含税",
		"合同付款比例",
		"质保期开始时间",
		"质保期结束时间",
		"是否有保证金",
		"保证金金额",
		"项目部经营人员",
		"项目进度",
		"初审金额",
		"结算应收金额",
		"备注"
	], [
		1,
		2026,
		"DEMO-A-2026",
		"示例住宅A区",
		"示例建设集团",
		"示例劳务公司",
		12e5,
		"9%",
		"不含税",
		"80%",
		"",
		"",
		"有",
		5e4,
		"王经营",
		"在建",
		0,
		0,
		"示例，导入前请改"
	]]), "合同管理表");
	utils.book_append_sheet(wb, utils.aoa_to_sheet([
		[
			"年份",
			"项目号",
			"项目名称",
			"流水类型",
			"收款去向",
			"日期",
			"金额",
			"不含税金额",
			"开票税率",
			"发票号",
			"期次",
			"备注"
		],
		[
			2026,
			"DEMO-A-2026",
			"示例住宅A区",
			"报量",
			"",
			"2026-03-31",
			18e4,
			"",
			"",
			"",
			"2026-03",
			"3月报量"
		],
		[
			2026,
			"DEMO-A-2026",
			"示例住宅A区",
			"开票",
			"",
			"2026-04-12",
			2e5,
			183486.24,
			9,
			"1100000001",
			"",
			""
		],
		[
			2026,
			"DEMO-A-2026",
			"示例住宅A区",
			"收款",
			"总包代付农民工",
			"2026-04-15",
			8e4,
			"",
			"",
			"",
			"",
			""
		],
		[
			2026,
			"DEMO-A-2026",
			"示例住宅A区",
			"收款",
			"到分包公司",
			"2026-04-28",
			7e4,
			"",
			"",
			"",
			"",
			""
		]
	]), "报量开票收款");
	utils.book_append_sheet(wb, noteSheet([
		"填写说明（此表不会导入）",
		"合同管理是独立模块。月报量、开票、收款请在第二张表按笔填写。",
		"如果只填第一张表里的月报量/开票/收款合计，导入时会各生成一笔「导入合计」，之后可再拆明细。",
		"「是否有押金」已改为保证金：填 有/无，金额填在保证金金额。",
		"项目进度只能是：在建 / 结算 / 审计。",
		"报量含税列填「含税」或「不含税」。每个合同可以不同。开票、收款仍按实际金额。",
		"两条线：① 应收 = 含税报量 × 付款比例；合同未付 = 应收 − 已付。② 剩余款 = 开票含税 − 已付。已付 = 代付农民工 + 到分包公司。",
		"收款请拆成两笔：去向填「到分包公司」或「总包代付农民工」，日期可以不同。"
	]), "填写说明");
	return wb;
}
function buildContractWorkbook(args) {
	const { contracts, entries } = args;
	const wb = utils.book_new();
	const aoa = [["合同管理表"], [
		"序号",
		"年份",
		"项目号",
		"项目名称",
		"总包",
		"分包",
		"合同金额/结算金额",
		"税率",
		"报量含税",
		"月报量(录入)",
		"月报量含税",
		"月报量不含税",
		"合同付款比例",
		"应收（含税报量×比例）",
		"开票含税",
		"开票不含税",
		"已付（代付+到分包）",
		"代付农民工",
		"到分包公司",
		"合同未付（应收−已付）",
		"剩余款（开票含税−已付）",
		"质保期开始时间",
		"质保期结束时间",
		"是否有保证金",
		"保证金金额",
		"项目部经营人员",
		"项目进度",
		"初审金额",
		"结算应收金额",
		"备注"
	]];
	contracts.forEach((c, i) => {
		const r = contractRollup(c, entries);
		aoa.push([
			i + 1,
			c.year,
			c.code,
			c.name,
			c.contractor,
			c.subcontractor,
			c.contractAmount || "",
			c.taxRate ? `${c.taxRate}%` : "",
			c.reportTaxMode === "incl" ? "含税" : "不含税",
			r.report || "",
			r.reportIncl || "",
			r.reportExcl || "",
			c.payRatio ? `${c.payRatio}%` : "",
			r.payable || "",
			r.invoice || "",
			r.invoiceExcl || "",
			r.receipt || "",
			r.workerPay || "",
			r.subPay || "",
			r.dueRemain || "",
			r.remain || "",
			c.warrantyStart,
			c.warrantyEnd,
			c.hasDeposit ? "有" : "无",
			c.hasDeposit ? c.depositAmount || "" : "",
			c.manager,
			c.status,
			c.prelimAmount || "",
			c.settleReceivable || "",
			c.remark
		]);
	});
	utils.book_append_sheet(wb, sheetFromAoa(aoa), "合同管理表");
	const reportRows = [[
		"年份",
		"项目号",
		"项目名称",
		"日期",
		"录入金额",
		"报量按",
		"税率",
		"含税金额",
		"不含税金额",
		"期次",
		"影像文件",
		"备注"
	]];
	const invoiceRows = [[
		"年份",
		"项目号",
		"项目名称",
		"日期",
		"含税金额",
		"不含税金额",
		"开票税率",
		"发票号",
		"影像文件",
		"备注"
	]];
	const receiptRows = [[
		"年份",
		"项目号",
		"项目名称",
		"日期",
		"收款去向",
		"金额",
		"回单号",
		"影像文件",
		"备注"
	]];
	const filesRows = [[
		"类型",
		"年份",
		"项目号",
		"项目名称",
		"日期",
		"文件名",
		"说明"
	]];
	for (const e of entries) {
		const c = contracts.find((x) => x.id === e.contractId);
		if (!c) continue;
		if (e.kind === "report") {
			const tax = splitTax(e.amount, c.taxRate, c.reportTaxMode || "excl");
			reportRows.push([
				c.year,
				c.code,
				c.name,
				e.date,
				e.amount || "",
				c.reportTaxMode === "incl" ? "含税" : "不含税",
				c.taxRate || "",
				tax.incl || "",
				tax.excl || "",
				e.no,
				e.fileName,
				e.remark
			]);
		} else if (e.kind === "invoice") invoiceRows.push([
			c.year,
			c.code,
			c.name,
			e.date,
			e.amount || "",
			e.amountExcl || "",
			e.taxRate || "",
			e.no,
			e.fileName,
			e.remark
		]);
		else if (e.kind === "receipt") receiptRows.push([
			c.year,
			c.code,
			c.name,
			e.date,
			e.payTo === "worker" ? "总包代付农民工" : "到分包公司",
			e.amount || "",
			e.no,
			e.fileName,
			e.remark
		]);
		if (e.fileName) filesRows.push([
			e.kind === "invoice" ? "开票" : e.kind === "receipt" ? "收款" : "报量",
			c.year,
			c.code,
			c.name,
			e.date,
			e.fileName,
			e.payTo === "worker" ? "代付农民工" : e.remark
		]);
	}
	utils.book_append_sheet(wb, titledSheet("月报量明细", reportRows), "月报量明细");
	utils.book_append_sheet(wb, titledSheet("开票明细", invoiceRows), "开票明细");
	utils.book_append_sheet(wb, titledSheet("收款明细", receiptRows), "收款明细");
	const cmp = [[
		"年份",
		"项目号",
		"项目名称",
		"含税报量",
		"应收（含税报量×比例）",
		"开票含税",
		"已付（代付+到分包）",
		"代付农民工",
		"到分包公司",
		"合同未付（应收−已付）",
		"剩余款（开票含税−已付）"
	]];
	contracts.forEach((c) => {
		const r = contractRollup(c, entries);
		cmp.push([
			c.year,
			c.code,
			c.name,
			r.reportIncl || "",
			r.payable || "",
			r.invoice || "",
			r.receipt || "",
			r.workerPay || "",
			r.subPay || "",
			r.dueRemain || "",
			r.remain || ""
		]);
	});
	utils.book_append_sheet(wb, titledSheet("资金对照", cmp), "资金对照");
	utils.book_append_sheet(wb, titledSheet("影像资料", filesRows), "影像资料");
	utils.book_append_sheet(wb, noteSheet([
		"导出说明（此表不会导入）",
		"合同管理表是汇总。明细在：月报量 / 开票 / 收款。资金对照是公式结果。",
		"应收 = 含税报量 × 付款比例。合同未付 = 应收 − 已付。剩余款 = 开票含税 − 已付。",
		"已付 = 代付农民工 + 到分包公司。收款明细里两笔日期可以不同。",
		"影像资料列出已上传文件名，原件在 NAS 的 data/docs。"
	]), "填写说明");
	return wb;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/audit-CoPwf0Sy.js
async function logOp(action, detail = "", module = "") {
	try {
		await fetch("/api/audit", {
			method: "POST",
			credentials: "include",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				action,
				detail,
				module
			})
		});
	} catch {}
}
async function fetchAudit() {
	const r = await fetch("/api/audit", { credentials: "include" });
	if (!r.ok) return [];
	return (await r.json()).entries || [];
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/store-bvgN4KiS.js
function emptyState() {
	const year = 2026;
	return {
		year,
		years: [year],
		people: [],
		attendance: [],
		attendanceDocs: [],
		payments: [],
		contracts: [],
		contractEntries: [],
		accessHash: ""
	};
}
function person(partial) {
	const parsed = parseIdCard(partial.idCard || "");
	return {
		id: uid(),
		name: partial.name,
		team: partial.team || "",
		personNo: partial.personNo || "",
		batchNo: partial.batchNo || "",
		cardType: partial.cardType || "",
		idCard: partial.idCard || "",
		gender: parsed.gender || partial.gender || "",
		age: parsed.age,
		birthday: parsed.birthday || "",
		phone: partial.phone || "",
		dailyWage: partial.dailyWage || 0,
		monthWage: partial.monthWage || 0,
		payType: partial.payType === "month" ? "month" : "day",
		otRule: partial.otRule || "",
		bank: partial.bank || "",
		cardNo: partial.cardNo || "",
		address: partial.address || "",
		idIssuer: partial.idIssuer || "",
		idValidFrom: normalizeIdDate(partial.idValidFrom),
		idValidTo: normalizeIdDate(partial.idValidTo, true),
		remark: partial.remark || "示例人员，可删",
		nation: partial.nation || "",
		nativePlace: partial.nativePlace || "",
		livePlace: partial.livePlace || "",
		icValidFrom: partial.icValidFrom || "",
		icValidTo: partial.icValidTo || ""
	};
}
function att(year, month, name, team, days, otHours, allowance = 0, deduction = 0) {
	return {
		id: uid(),
		year,
		month,
		name,
		team,
		days,
		otHours,
		allowance,
		deduction,
		remark: ""
	};
}
function pay(owner, receiver, date, amount, source, remark) {
	return {
		id: uid(),
		owner,
		receiver,
		date,
		amount,
		source,
		remark
	};
}
/** 两个完整示例，方便核对人员 / 考勤 / 代收 / 查询 */
function demoState() {
	const people = [person({
		name: "张三",
		team: "一班",
		personNo: "DEMO001",
		idCard: "110101199001011210",
		phone: "13800001234",
		dailyWage: 280,
		otRule: "按小时:25",
		bank: "中国工商银行北京分行",
		cardNo: "6222021234567890123",
		address: "北京市东城区示例路1号",
		remark: "虚构示例，可删"
	}), person({
		name: "李四",
		team: "二班",
		personNo: "DEMO002",
		idCard: "320106198506154512",
		phone: "13900005678",
		dailyWage: 260,
		otRule: "折算:8",
		bank: "中国农业银行上海分行",
		cardNo: "6228481234567890123",
		address: "上海市浦东新区示例路8号",
		remark: "虚构示例，可删"
	})];
	const attendance = [
		att(2026, 3, "张三", "一班", 26, 12, 200, 0),
		att(2026, 3, "李四", "二班", 22, 8, 0, 50),
		att(2026, 4, "张三", "一班", 24, 8, 150, 0),
		att(2026, 4, "李四", "二班", 20, 4, 0, 0),
		att(2026, 7, "张三", "一班", 27, 14.5, 300, 80),
		att(2026, 7, "李四", "二班", 27, 10, 0, 100)
	];
	const payments = [
		pay("张三", "张三", "2026-04-28", 1e4, "示例工程4月请款", "本人"),
		pay("李四", "张三", "2026-04-28", 8e3, "示例工程4月请款", "张三代收"),
		pay("张三", "张三", "2026-07-21", 5e3, "示例工程7月请款", "本人"),
		pay("李四", "李四", "2026-07-21", 5e3, "示例工程7月请款", "本人")
	];
	const contracts = [{
		id: "c-demo-a",
		year: 2026,
		code: "DEMO-A-2026",
		name: "示例住宅A区",
		contractor: "示例建设集团",
		subcontractor: "示例劳务公司",
		contractAmount: 12e5,
		taxRate: 9,
		reportTaxMode: "excl",
		payRatio: 80,
		warrantyStart: "",
		warrantyEnd: "",
		hasDeposit: true,
		depositAmount: 5e4,
		manager: "王经营",
		status: "在建",
		prelimAmount: 0,
		settleReceivable: 0,
		remark: "虚构示例，可删"
	}, {
		id: "c-demo-b",
		year: 2026,
		code: "DEMO-B-2026",
		name: "示例市政道路",
		contractor: "示例建设集团",
		subcontractor: "示例市政公司",
		contractAmount: 8e5,
		taxRate: 9,
		reportTaxMode: "incl",
		payRatio: 85,
		warrantyStart: "2026-06-01",
		warrantyEnd: "2028-05-31",
		hasDeposit: false,
		depositAmount: 0,
		manager: "李经营",
		status: "结算",
		prelimAmount: 78e4,
		settleReceivable: 12e4,
		remark: "虚构示例，可删"
	}];
	const contractEntries = [
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "report",
			date: "2026-03-31",
			amount: 18e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "2026-03",
			remark: "3月报量",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "report",
			date: "2026-04-30",
			amount: 16e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "2026-04",
			remark: "4月报量",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "invoice",
			date: "2026-04-12",
			amount: 2e5,
			amountExcl: 183486.24,
			taxRate: 9,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "1100000001",
			remark: "",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "receipt",
			date: "2026-04-15",
			amount: 8e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "worker",
			no: "",
			remark: "总包代付农民工",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-a",
			kind: "receipt",
			date: "2026-04-28",
			amount: 7e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "sub",
			no: "",
			remark: "到分包公司",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "report",
			date: "2026-02-28",
			amount: 8e5,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "完工报量",
			remark: "",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "invoice",
			date: "2026-03-05",
			amount: 8e5,
			amountExcl: 733944.95,
			taxRate: 9,
			workerPay: 0,
			workerPayDate: "",
			payTo: "",
			no: "1100000002",
			remark: "",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "receipt",
			date: "2026-03-10",
			amount: 2e5,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "worker",
			no: "",
			remark: "总包代付农民工",
			fileName: "",
			workerFileName: ""
		},
		{
			id: uid(),
			contractId: "c-demo-b",
			kind: "receipt",
			date: "2026-03-25",
			amount: 48e4,
			amountExcl: 0,
			taxRate: 0,
			workerPay: 0,
			workerPayDate: "",
			payTo: "sub",
			no: "",
			remark: "到分包公司",
			fileName: "",
			workerFileName: ""
		}
	];
	const year = 2026;
	return {
		year,
		years: derivedYears({
			year,
			years: [year],
			attendance,
			payments
		}),
		people,
		attendance,
		attendanceDocs: [],
		payments,
		contracts,
		contractEntries,
		accessHash: ""
	};
}
var emptyStorage = {
	getItem: () => null,
	setItem: () => {},
	removeItem: () => {}
};
var useApp = create()(persist((set, get) => ({
	...emptyState(),
	resetToSeed: () => {
		set({
			...demoState(),
			accessHash: get().accessHash
		});
		logOp("恢复示例数据", "", "设置");
	},
	clearAll: () => {
		set({
			...emptyState(),
			accessHash: get().accessHash
		});
		logOp("清空全部数据", "", "设置");
	},
	setYear: (year) => {
		set({
			year,
			years: derivedYears({
				...get(),
				year
			})
		});
	},
	addYear: (y) => {
		const existing = derivedYears(get());
		const next = y && y >= 2e3 && y <= 2100 ? Math.round(y) : nextYear(existing);
		set({
			years: existing.includes(next) ? existing : [...existing, next].sort((a, b) => a - b),
			year: next
		});
		logOp("新增年度", String(next), "设置");
		return next;
	},
	removeYear: (y) => {
		const restYears = (get().years || []).filter((x) => x !== y);
		const attendance = get().attendance.filter((a) => a.year !== y);
		if (!restYears.length && !attendance.length) return;
		const fallback = restYears.length ? restYears[restYears.length - 1] : attendance[0]?.year || (/* @__PURE__ */ new Date()).getFullYear();
		const years = derivedYears({
			...get(),
			attendance,
			years: restYears,
			year: fallback
		}).filter((x) => x !== y);
		set({
			years: years.length ? years : [fallback],
			attendance,
			year: get().year === y ? fallback : get().year
		});
		logOp("删除年度", String(y), "设置");
	},
	upsertPerson: (p) => {
		const people = get().people;
		const nextP = {
			...p,
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		};
		const i = people.findIndex((x) => x.id === nextP.id || x.name === nextP.name);
		if (i >= 0) {
			const next = people.slice();
			next[i] = {
				...nextP,
				id: people[i].id
			};
			set({ people: next });
			logOp("修改人员", nextP.name, "人员");
		} else {
			set({ people: [...people, {
				...nextP,
				id: nextP.id || uid()
			}] });
			logOp("新增人员", nextP.name, "人员");
		}
	},
	addPerson: (p) => {
		set({ people: [...get().people, {
			...p,
			id: uid(),
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		}] });
		logOp("新增人员", p.name, "人员");
	},
	removePeople: (ids) => {
		const names = get().people.filter((p) => ids.includes(p.id)).map((p) => p.name).join("、");
		set({ people: get().people.filter((p) => !ids.includes(p.id)) });
		logOp("删除人员", names || `${ids.length}人`, "人员");
	},
	replacePeople: (people) => {
		set({ people: people.map((p) => ({
			...p,
			idValidFrom: normalizeIdDate(p.idValidFrom),
			idValidTo: normalizeIdDate(p.idValidTo, true)
		})) });
		logOp("导入/替换人员", `${people.length}人`, "人员");
	},
	saveAttendanceMonth: (year, month, rows) => {
		const rest = get().attendance.filter((r) => !(r.year === year && r.month === month));
		const next = rows.filter((r) => r.name.trim()).map((r) => ({
			...r,
			allowance: Number(r.allowance) || 0,
			deduction: Number(r.deduction) || 0,
			id: uid(),
			year,
			month
		}));
		const attendance = [...rest, ...next];
		set({
			attendance,
			years: derivedYears({
				...get(),
				attendance,
				year
			})
		});
		logOp("保存月考勤", `${year}年${month}月 ${next.length}人`, "考勤");
	},
	replaceAttendance: (attendance) => {
		set({
			attendance,
			years: derivedYears({
				...get(),
				attendance
			})
		});
		logOp("导入/替换考勤", `${attendance.length}条`, "考勤");
	},
	addAttendanceDoc: (d) => set({ attendanceDocs: [...get().attendanceDocs || [], {
		...d,
		id: d.id || uid(),
		fileName: d.fileName || "",
		remark: d.remark || ""
	}] }),
	patchAttendanceDoc: (id, patch) => set({ attendanceDocs: (get().attendanceDocs || []).map((d) => d.id === id ? {
		...d,
		...patch
	} : d) }),
	removeAttendanceDocs: (ids) => set({ attendanceDocs: (get().attendanceDocs || []).filter((d) => !ids.includes(d.id)) }),
	addPayment: (p) => {
		set({ payments: [...get().payments, {
			...p,
			id: uid()
		}] });
		logOp("新增发放", `${p.owner} ${p.amount}`, "发放");
	},
	patchPayments: (ids, patch) => {
		const idset = new Set(ids);
		set({ payments: get().payments.map((p) => idset.has(p.id) ? {
			...p,
			...patch,
			id: p.id
		} : p) });
		logOp("修改发放", `${ids.length}条`, "发放");
	},
	replacePayments: (payments) => {
		set({ payments });
		logOp("导入/替换发放", `${payments.length}条`, "发放");
	},
	removePayment: (id) => set({ payments: get().payments.filter((p) => p.id !== id) }),
	removePayments: (ids) => {
		set({ payments: get().payments.filter((p) => !ids.includes(p.id)) });
		logOp("删除发放", `${ids.length}条`, "发放");
	},
	upsertContract: (c) => {
		const list = get().contracts;
		const i = list.findIndex((x) => x.id === c.id || c.code && x.code === c.code && x.year === c.year && x.name === c.name);
		if (i >= 0) {
			const next = list.slice();
			next[i] = {
				...c,
				id: list[i].id
			};
			set({ contracts: next });
			logOp("修改合同", c.name, "合同");
		} else {
			set({ contracts: [...list, {
				...c,
				id: c.id || uid()
			}] });
			logOp("新增合同", c.name, "合同");
		}
	},
	removeContracts: (ids) => {
		set({
			contracts: get().contracts.filter((c) => !ids.includes(c.id)),
			contractEntries: get().contractEntries.filter((e) => !ids.includes(e.contractId))
		});
		logOp("删除合同", `${ids.length}份`, "合同");
	},
	addContractEntry: (e) => set({ contractEntries: [...get().contractEntries, normalizeEntry(e)] }),
	patchContractEntry: (id, patch) => set({ contractEntries: get().contractEntries.map((e) => e.id === id ? {
		...e,
		...patch
	} : e) }),
	removeContractEntries: (ids) => set({ contractEntries: get().contractEntries.filter((e) => !ids.includes(e.id)) }),
	replaceContracts: (contracts, entries) => set({
		contracts,
		contractEntries: entries ?? get().contractEntries
	}),
	setAccessHash: (accessHash) => set({ accessHash }),
	setAll: (s) => set({
		...s,
		years: derivedYears(s)
	})
}), {
	name: "gongdi-ledger-v5",
	version: 9,
	skipHydration: true,
	storage: createJSONStorage(() => typeof window === "undefined" ? emptyStorage : localStorage),
	migrate: (persisted, _version) => {
		const s = persisted;
		const attendance = (s.attendance || []).map((a) => ({
			...a,
			allowance: Number(a.allowance) || 0,
			deduction: Number(a.deduction) || 0
		}));
		const contracts = (s.contracts || []).map((c) => ({
			...c,
			reportTaxMode: c.reportTaxMode === "incl" ? "incl" : "excl"
		}));
		const contractEntries = splitLegacyReceipts((s.contractEntries || []).map((e) => ({
			...e,
			amountExcl: Number(e.amountExcl) || 0,
			taxRate: Number(e.taxRate) || 0,
			workerPay: Number(e.workerPay) || 0,
			workerPayDate: e.workerPayDate || "",
			payTo: e.payTo === "worker" || e.payTo === "sub" ? e.payTo : "",
			fileName: e.fileName || "",
			workerFileName: e.workerFileName || ""
		})));
		const attendanceDocs = s.attendanceDocs || [];
		const people = (s.people || []).map((p) => ({
			...p,
			payType: p.payType === "month" ? "month" : "day",
			monthWage: Number(p.monthWage) || 0,
			dailyWage: Number(p.dailyWage) || 0
		}));
		return {
			...s,
			people,
			attendance,
			contracts,
			contractEntries,
			attendanceDocs,
			years: derivedYears({
				...s,
				attendance,
				years: s.years || []
			}),
			accessHash: s.accessHash || ""
		};
	},
	partialize: (s) => ({
		year: s.year,
		years: s.years,
		people: s.people,
		attendance: s.attendance,
		attendanceDocs: s.attendanceDocs || [],
		payments: s.payments,
		contracts: s.contracts || [],
		contractEntries: s.contractEntries || [],
		accessHash: s.accessHash || ""
	})
}));
//#endregion
export { uid as $, parseDateYmd as A, PRESETS as B, hasWork as C, normalizeEntry as D, nextYear as E, splitTax as F, perms_exports as G, canWriteLedger as H, wageLabel as I, cn as J, setLivePerms as K, ALL_PERMS as L, parseOtRule as M, paymentsInYear as N, normalizeIdDate as O, round2 as P, toggleSel as Q, NAV_PERM as R, encodeOtRule as S, monthStatus as T, hasPerm as U, can as V, livePerms as W, copyText as X, confirmBatchDelete as Y, money as Z, confirmRemoveYear as _, attendanceTemplateWb as a, readBookMeta as at, derivedYears as b, contractTemplateWb as c, writeBookMeta as ct, parseContractWorkbook as d, appendAudit as et, parsePaymentSheet as f, CONTRACT_STATUSES as g, peopleTemplateWb as h, logOp as i, persistOn as it, parseIdCard as j, overAgeLabel as k, excel_exports as l, __exportAll as lt, paymentTemplateWb as m, useApp as n, listBookIds as nt, buildContractWorkbook as o, readVersionText as ot, parsePeopleSheet as p, subscribePerms as q, fetchAudit as r, nas_fs_server_exports as rt, buildFullWorkbook as s, runWithBook as st, router_exports as t, dataDir as tt, parseAttendanceSheet as u, contractRollup as v, monthPay as w, emptyContract as x, dateYear as y, PERM_GROUPS as z };
