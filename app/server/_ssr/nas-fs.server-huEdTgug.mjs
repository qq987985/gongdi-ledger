import { existsSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/nas-fs.server-huEdTgug.js
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
		const excel = await import("../_libs/_2.mjs").then((n) => n.a);
		const { writeCenteredXlsx } = await import("./xlsx-center-D2Fy6Xuo.mjs");
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
		if (!statSync(p).isFile()) continue;
		return await readFile(p, "utf8");
	} catch {}
	return "";
}
//#endregion
export { appendAudit, dataDir, findDoc, findPhotoPath, listBookIds, persistOn, photoFlags, readAudit, readBookMeta, readLedger, readVersionText, removeBookDir, removeDocFile, removePhoto, runWithBook, saveBackup, saveDoc, savePhoto, scanPhotoFolder, writeAudit, writeBookMeta, writeLedger };
