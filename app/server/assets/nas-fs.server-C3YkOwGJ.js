import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, statSync } from "node:fs";
import { dirname, extname, join, sep } from "node:path";
import { appendFile, copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
function logsDir() {
	const root = process.env.DATA_DIR?.trim();
	return root ? join(root, "logs") : "";
}
var queue = Promise.resolve();
function logServer(level, event, detail = {}) {
	let line;
	try {
		line = JSON.stringify({
			at: (/* @__PURE__ */ new Date()).toISOString(),
			level,
			event,
			...detail
		});
	} catch {
		line = JSON.stringify({
			at: (/* @__PURE__ */ new Date()).toISOString(),
			level,
			event,
			detail: "[无法序列化]"
		});
	}
	try {
		if (level === "error") console.error(line);
		else if (level === "warn") console.warn(line);
		else console.log(line);
	} catch {}
	const dir = logsDir();
	if (!dir) return Promise.resolve();
	queue = queue.then(async () => {
		try {
			await mkdir(dir, { recursive: true });
			await appendFile(join(dir, `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.log`), `${line}\n`, "utf8");
		} catch {}
	}, () => {});
	return queue;
}
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
function bookAssetsRoot() {
	const base = photosRoot();
	return base ? join(base, safeBookId(currentBookId())) : "";
}
function labelOf(kind) {
	if (kind === "idBack") return "身份证-反面";
	if (kind === "id" || kind === "idFront") return "身份证-正面";
	return kind === "bank" ? "银行卡" : "IC卡";
}
function kindEnv(kind) {
	const k = kind === "idBack" || kind === "idFront" ? "id" : kind;
	return (k === "id" ? process.env.PHOTO_ID_DIR : k === "bank" ? process.env.PHOTO_BANK_DIR : process.env.PHOTO_IC_DIR) || "";
}
function kindFolder(kind) {
	return kind === "idBack" || kind === "idFront" || kind === "id" ? "id" : kind;
}
function kindDir(kind) {
	const root = bookAssetsRoot();
	return root ? join(root, kindFolder(kind)) : "";
}
function safeName(name) {
	return name.replace(/[\\/:*?"<>|]/g, "").trim();
}
function compactName(s) {
	return s.normalize("NFC").replace(/[\\/:*?"<>|]/g, "").replace(/[\s　._\-－—–·•]/g, "").toLowerCase();
}
function legacyFallbackOn() {
	return process.env.PHOTO_LEGACY_FALLBACK?.trim().toLowerCase() !== "off";
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
	const cn = kind === "idBack" || kind === "id" || kind === "idFront" ? "身份证" : labelOf(kind);
	const folder = kindFolder(kind);
	const book = bookRoot();
	const root = dataDir();
	const shared = photosRoot();
	add(join(bookAssetsRoot(), folder));
	if (book) {
		add(join(book, "photos", folder));
		add(join(book, "photos", cn));
		add(join(book, "photos", "id"));
		add(join(book, cn));
	}
	if (!legacyFallbackOn()) return out;
	add(kindEnv(kind));
	add(join(shared, folder));
	add(join(shared, "id"));
	add(join(shared, cn));
	add(root ? join(root, "photos", folder) : "");
	add(root ? join(root, "photos", "id") : "");
	add(root ? join(root, "photos", cn) : "");
	add(root ? join(root, folder) : "");
	add(root ? join(root, cn) : "");
	add(shared, true);
	add(root ? join(root, "photos") : "", true);
	return out;
}
function idSide(base) {
	const b = compactName(base);
	if (/反面|背面|back/.test(b)) return "back";
	if (/正面|人像|头像|front/.test(b)) return "front";
	return "plain";
}
function labelledMatch(b, n, labels) {
	if (b === n) return true;
	if (labels.some((lab) => b.startsWith(n + compactName(lab)))) return true;
	const rest = b.slice(n.length);
	if (rest && /^[^一-龥A-Za-z0-9]/.test(rest) && labels.some((lab) => b.includes(compactName(lab)))) return true;
	return false;
}
function photoFileMatches(file, name, kind, requireLabel) {
	const ext = extname(file).toLowerCase();
	if (!PHOTO_EXT.has(ext)) return false;
	const base = file.slice(0, file.length - ext.length);
	const n = compactName(name);
	const b = compactName(base);
	if (!n || !b) return false;
	const side = idSide(base);
	if (kind === "idBack") {
		if (side !== "back") return false;
		if (!requireLabel && b === n) return true;
		return labelledMatch(b, n, ["身份证", "身份"]);
	}
	if (kind === "id" || kind === "idFront") {
		if (side === "back") return false;
		if (!requireLabel && b === n) return true;
		return labelledMatch(b, n, ["身份证", "身份"]);
	}
	if (!requireLabel && b === n) return true;
	return labelledMatch(b, n, kind === "bank" ? ["银行卡", "银行"] : [
		"ic卡",
		"ic",
		"工卡"
	]);
}
var PHOTO_EXT = new Set([
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
	attendance: "考勤影像",
	contract: "合同扫描件",
	expense: "报销凭证",
	payout: "报销打款",
	insurance: "保险合同"
};
var PHOTO_SUBS = [
	"id",
	"bank",
	"ic",
	"报量单",
	"发票",
	"收款回单",
	"考勤影像",
	"合同扫描件",
	"报销凭证",
	"报销打款",
	"保险合同"
];
async function ensureDirs() {
	const root = dataDir();
	if (!root) return;
	await mkdir(root, { recursive: true });
	await mkdir(join(root, "accounts"), { recursive: true });
	await mkdir(join(root, "books"), { recursive: true });
	await mkdir(join(root, "backups"), { recursive: true });
	await mkdir(join(root, "templates"), { recursive: true });
	const photos = photosRoot() || join(root, "photos");
	for (const sub of PHOTO_SUBS) await mkdir(join(photos, sub), { recursive: true });
	const bookAssets = bookAssetsRoot();
	if (bookAssets) for (const sub of PHOTO_SUBS) await mkdir(join(bookAssets, sub), { recursive: true });
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
  id          身份证正反面（张三-身份证-正面.jpg / 张三-身份证-反面.jpg）
  bank        银行卡
  ic          IC卡
  报量单
  发票
  收款回单
  考勤影像
  合同扫描件
  报销凭证
  报销打款
backups/      Excel 备份（含最新「考勤表.xlsx」）
templates/    导入模板

不要删 books 和 accounts。
`;
	try {
		await writeFile(p, text, "utf8");
	} catch {}
}
async function migrateOldDocs() {
	const base = photosRoot();
	if (!base) return;
	for (const kind of [
		"report",
		"invoice",
		"receipt",
		"attendance",
		"contract",
		"expense",
		"payout"
	]) {
		const dest = join(base, DOC_CN[kind]);
		const root = dataDir();
		const sources = [root ? join(root, "docs", kind) : "", root ? join(root, "docs", DOC_CN[kind]) : ""];
		for (const dir of sources) {
			if (!dir || dir === dest || !existsSync(dir)) continue;
			await mkdir(dest, { recursive: true });
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
		const excel = await import("./excel-BKvRxldk.js");
		const { writeCenteredXlsx } = await import("./xlsx-center-D9gUE76f.js");
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
async function atomicWriteFile(path, data) {
	const tmp = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	try {
		await writeFile(tmp, data);
		await rename(tmp, path);
	} catch (err) {
		await rm(tmp, { force: true }).catch(() => {});
		throw err;
	}
}
function ledgerPath() {
	return join(bookRoot(), "ledger.json");
}
function ledgerUnreadable(data) {
	return Boolean(data.unreadable);
}
async function readLedger() {
	if (!persistOn()) return { empty: true };
	await ensureDirs();
	const p = ledgerPath();
	if (!existsSync(p)) return { empty: true };
	let raw;
	try {
		raw = JSON.parse(await readFile(p, "utf8"));
	} catch (err) {
		await logServer("error", "台账文件读取失败", {
			path: p,
			error: String(err)
		});
		return { unreadable: true };
	}
	if (!raw || typeof raw !== "object") {
		await logServer("error", "台账文件内容不是对象", { path: p });
		return { unreadable: true };
	}
	await reconcileContractScans(raw);
	return raw;
}
function ledgerRevisionOf(data) {
	return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
function ledgerRevisionValue(data) {
	return "empty" in data && data.empty ? "" : ledgerRevisionOf(data);
}
var ledgerWriteQueue = Promise.resolve("ok");
async function writeLedgerNow(data, expectedRevision) {
	if (!persistOn()) return "ok";
	await ensureDirs();
	const cur = await readLedger();
	if (ledgerUnreadable(cur)) return "unreadable";
	if (expectedRevision !== void 0 && ledgerRevisionValue(cur) !== expectedRevision) return "conflict";
	const p = ledgerPath();
	const tmp = `${p}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	try {
		await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
		await rename(tmp, p);
	} catch (err) {
		await rm(tmp, { force: true }).catch(() => {});
		await logServer("error", "台账写入失败", {
			path: p,
			error: String(err)
		});
		throw err;
	}
	return "ok";
}
function writeLedger(data, expectedRevision) {
	const run = () => writeLedgerNow(data, expectedRevision);
	ledgerWriteQueue = ledgerWriteQueue.then(run, run);
	return ledgerWriteQueue;
}
function auditPath() {
	return join(bookRoot(), "audit.json");
}
function parseAuditFile(raw) {
	return (Array.isArray(raw) ? raw : raw?.entries || []).filter((x) => x && x.id && x.action);
}
function legacyAuditPaths() {
	const root = dataDir();
	if (!root) return [];
	const out = [];
	if (currentBookId() === "default") out.push(join(root, "audit.json"));
	return out;
}
async function readAudit() {
	if (!persistOn()) return [];
	await ensureDirs();
	const p = auditPath();
	if (existsSync(p)) try {
		return parseAuditFile(JSON.parse(await readFile(p, "utf8")));
	} catch (err) {
		await logServer("error", "操作记录文件读取失败", {
			path: p,
			error: String(err)
		});
		return [];
	}
	for (const legacy of legacyAuditPaths()) try {
		if (!existsSync(legacy)) continue;
		const rows = parseAuditFile(JSON.parse(await readFile(legacy, "utf8")));
		if (rows.length) {
			await logServer("info", "操作记录从旧位置读取", {
				legacy,
				count: rows.length
			});
			return rows;
		}
	} catch {}
	return [];
}
async function writeAudit(entries) {
	if (!persistOn()) return;
	await ensureDirs();
	await atomicWriteFile(auditPath(), JSON.stringify({ entries: entries.slice(0, 2e3) }, null, 2));
}
var auditQueue = Promise.resolve();
function appendAudit(row) {
	const task = async () => {
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
	};
	const next = auditQueue.then(task, task);
	auditQueue = next.catch(() => {});
	return next;
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
	const base = file.slice(0, file.length - ext.length);
	if (compactName(base) === compactName(name) + compactName(labelOf(kind))) return 6;
	const side = idSide(base);
	if (kind === "idBack") return side === "back" ? 5 : 1;
	if (kind === "id" || kind === "idFront") {
		if (side === "front") return 5;
		if (side === "plain") return 3;
		return 1;
	}
	return 2;
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
	const dest = join(dir, `${n}-${labelOf(kind)}.${ext}`);
	const hit = await findPhotoHit(n, kind);
	await mkdir(dir, { recursive: true });
	const tmp = `${dest}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	try {
		await writeFile(tmp, Buffer.from(m[2], "base64"));
		if (hit && join(hit.dir, hit.file) !== dest && isInsideBookAssets(hit.dir)) await rm(join(hit.dir, hit.file), { force: true });
		await rename(tmp, dest);
	} catch (err) {
		await rm(tmp, { force: true }).catch(() => {});
		throw err;
	}
}
function bookPhotoDirs(kind) {
	const out = [];
	const book = bookRoot();
	const folder = kindFolder(kind);
	const cn = kind === "idBack" || kind === "id" || kind === "idFront" ? "身份证" : labelOf(kind);
	const add = (d) => {
		const v = (d || "").trim();
		if (v && !out.includes(v)) out.push(v);
	};
	add(kindDir(kind));
	if (book) {
		add(join(book, "photos", folder));
		add(join(book, "photos", cn));
		add(join(book, "photos", "id"));
		add(join(book, cn));
	}
	return out;
}
function bookDocDirs(kind) {
	const out = [];
	const book = bookRoot();
	const add = (d) => {
		const v = (d || "").trim();
		if (v && !out.includes(v)) out.push(v);
	};
	add(docsDir(kind));
	if (book) {
		add(join(book, "docs", kind));
		add(join(book, "docs", DOC_CN[kind]));
	}
	return out;
}
async function removePhoto(name, kind) {
	if (!persistOn()) return;
	const n = safeName(name);
	if (!n) return;
	const removed = /* @__PURE__ */ new Set();
	for (const d of bookPhotoDirs(kind)) {
		const files = await listDirSafe(d);
		for (const f of files) if (photoFileMatches(f, n, kind, true)) {
			removed.add(f);
			await rm(join(d, f), { force: true });
		}
	}
	if (!legacyFallbackOn() || !removed.size) return;
	for (const loc of photoSearchDirs(kind)) {
		if (isInsideBookAssets(loc.dir)) continue;
		const files = await listDirSafe(loc.dir);
		for (const f of files) if (removed.has(f) && photoFileMatches(f, n, kind, loc.mixed)) await rm(join(loc.dir, f), { force: true });
	}
}
async function photoFlags(names) {
	const kinds = [
		"id",
		"idBack",
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
			idBack: false,
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
		idBack: 0,
		bank: 0,
		ic: 0
	};
	for (const n of names) {
		if (flags[n]?.id) matched.id += 1;
		if (flags[n]?.idBack) matched.idBack += 1;
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
	const dest = join(root, "backups", filename.replace(/[\\/]/g, "") || "backup.xlsx");
	await mkdir(join(root, "backups"), { recursive: true });
	await writeFile(dest, buf);
	await writeFile(join(root, "backups", "考勤表.xlsx"), buf);
	return dest;
}
function docsDir(kind) {
	const root = bookAssetsRoot();
	return root ? join(root, DOC_CN[kind]) : "";
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
	const photos = photosRoot();
	add(docsDir(kind));
	if (book) {
		add(join(book, "docs", kind));
		add(join(book, "docs", DOC_CN[kind]));
	}
	if (!legacyFallbackOn()) return out;
	add(photos ? join(photos, kind) : "");
	add(photos ? join(photos, DOC_CN[kind]) : "");
	add(root ? join(root, "docs", kind) : "");
	add(root ? join(root, "docs", DOC_CN[kind]) : "");
	if (isLegacyDefault() && process.env.DOC_DIR?.trim()) add(join(process.env.DOC_DIR.trim(), kind));
	return out;
}
function safeId(id) {
	return id.replace(/[\\/:*?"<>|]/g, "").trim();
}
async function readPointerName(dir, sid) {
	const ptr = join(dir, `${sid}.name.txt`);
	if (!existsSync(ptr)) return "";
	try {
		return (await readFile(ptr, "utf8")).trim();
	} catch {
		return "";
	}
}
async function otherPointersUse(dir, sid, fileName) {
	if (!fileName) return false;
	const files = await listDirSafe(dir);
	for (const f of files) {
		if (!f.endsWith(".name.txt") || f === `${sid}.name.txt`) continue;
		try {
			if ((await readFile(join(dir, f), "utf8")).trim() === fileName) return true;
		} catch {}
	}
	return false;
}
function uniqueFileName(dir, orig, allow) {
	if (!orig) return orig;
	if (!existsSync(dir) || orig === allow) return orig;
	if (!existsSync(join(dir, orig))) return orig;
	const ext = extname(orig);
	const stem = ext ? orig.slice(0, orig.length - ext.length) : orig;
	let i = 2;
	while (existsSync(join(dir, `${stem}-${i}${ext}`))) i += 1;
	return `${stem}-${i}${ext}`;
}
async function sweepDocFiles(kind, sid) {
	for (const d of bookDocDirs(kind)) {
		const files = await listDirSafe(d);
		const prev = await readPointerName(d, sid);
		const shared = prev ? await otherPointersUse(d, sid, prev) : false;
		for (const f of files) if (f.startsWith(`${sid}--`) || f === `${sid}.name.txt`) await rm(join(d, f), { force: true });
		else if (prev && f === prev && !shared) await rm(join(d, f), { force: true });
	}
}
async function saveDoc(id, kind, buf, fileName, opts = {}) {
	if (!persistOn()) return fileName || "";
	await ensureDirs();
	const dir = docsDir(kind);
	if (!dir) return fileName || "";
	await mkdir(dir, { recursive: true });
	const sid = safeId(id);
	if (!sid) return fileName || "";
	const ext = extname(fileName || "").slice(0, 8) || ".bin";
	let orig = (fileName || `file${ext}`).replace(/[\\/]/g, "");
	const prev = await readPointerName(dir, sid);
	const sharedPrev = prev ? await otherPointersUse(dir, sid, prev) : false;
	if (!opts.replace) orig = uniqueFileName(dir, orig, prev && !sharedPrev ? prev : "");
	const tmp = `${dir}/.${sid}.upload-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	if (kind === "contract" || kind === "expense" || kind === "payout") {
		const dest = join(dir, orig);
		try {
			await writeFile(tmp, buf);
			await sweepDocFiles(kind, sid);
			await rename(tmp, dest);
			await atomicWriteFile(join(dir, `${sid}.name.txt`), orig);
		} catch (err) {
			await rm(tmp, { force: true }).catch(() => {});
			throw err;
		}
	} else try {
		await writeFile(tmp, buf);
		await sweepDocFiles(kind, sid);
		await rename(tmp, join(dir, `${sid}--${orig}`));
	} catch (err) {
		await rm(tmp, { force: true }).catch(() => {});
		throw err;
	}
	return orig;
}
async function removeDocFile(id, kind) {
	if (!persistOn()) return;
	await sweepDocFiles(kind, safeId(id));
}
async function findDocLocation(id, kind) {
	if (!persistOn()) return null;
	const sid = safeId(id);
	for (const d of docSearchDirs(kind)) {
		const files = await listDirSafe(d);
		const hit = files.find((f) => f.startsWith(`${sid}--`));
		if (hit) return {
			dir: d,
			file: hit,
			fileName: hit.slice(`${sid}--`.length) || hit
		};
		const orig = await readPointerName(d, sid);
		if (orig && files.includes(orig)) return {
			dir: d,
			file: orig,
			fileName: orig
		};
	}
	return null;
}
async function findDoc(id, kind) {
	const loc = await findDocLocation(id, kind);
	if (!loc) return null;
	return {
		buf: await readFile(join(loc.dir, loc.file)),
		fileName: loc.fileName
	};
}
function isInsideBookAssets(dir) {
	const bookDir = bookAssetsRoot();
	return Boolean(bookDir) && (dir === bookDir || dir.startsWith(bookDir + sep));
}
async function adoptLegacyAssets() {
	const out = {
		photos: 0,
		docs: 0,
		skipped: 0
	};
	if (!persistOn()) return out;
	await ensureDirs();
	const bookDir = bookAssetsRoot();
	if (!bookDir) return out;
	const led = await readLedger();
	if (ledgerUnreadable(led)) return out;
	const names = (Array.isArray(led.people) ? led.people : []).map((p) => safeName(String(p?.name || ""))).filter(Boolean);
	const copyInto = async (fromDir, file, destDir) => {
		const dest = join(destDir, file);
		if (existsSync(dest)) {
			out.skipped += 1;
			return;
		}
		try {
			await mkdir(destDir, { recursive: true });
			await copyFile(join(fromDir, file), dest);
			out.photos += 1;
		} catch (err) {
			await logServer("warn", "影像归入失败", {
				from: join(fromDir, file),
				error: String(err)
			});
		}
	};
	for (const kind of [
		"id",
		"idBack",
		"bank",
		"ic"
	]) {
		const destDir = join(bookDir, kindFolder(kind));
		for (const name of names) {
			const hit = await findPhotoHit(name, kind);
			if (!hit || isInsideBookAssets(hit.dir)) continue;
			await copyInto(hit.dir, hit.file, destDir);
		}
	}
	const idsFor = (kind) => {
		const ids = [];
		const push = (v) => {
			const s = safeId(String(v || ""));
			if (s) ids.push(s);
		};
		if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract") for (const c of Array.isArray(led.contracts) ? led.contracts : []) push(c?.id);
		if (kind === "attendance") for (const d of Array.isArray(led.attendanceDocs) ? led.attendanceDocs : []) push(d?.id);
		if (kind === "expense") for (const e of Array.isArray(led.expenses) ? led.expenses : []) {
			push(e?.id);
			push(e?.voucherId);
		}
		if (kind === "payout") for (const e of Array.isArray(led.expenses) ? led.expenses : []) push(e?.payoutId);
		if (kind === "insurance") for (const p of Array.isArray(led.insurancePolicies) ? led.insurancePolicies : []) {
			push(p?.id);
			for (const f of p?.contracts || []) push(f?.id);
		}
		return [...new Set(ids)];
	};
	for (const kind of Object.keys(DOC_CN)) {
		const destDir = join(bookDir, DOC_CN[kind]);
		for (const sid of idsFor(kind)) {
			const loc = await findDocLocation(sid, kind);
			if (!loc || isInsideBookAssets(loc.dir)) continue;
			const dest = join(destDir, loc.file);
			if (existsSync(dest)) {
				out.skipped += 1;
				continue;
			}
			try {
				await mkdir(destDir, { recursive: true });
				await copyFile(join(loc.dir, loc.file), dest);
				out.docs += 1;
			} catch (err) {
				await logServer("warn", "文档归入失败", {
					from: join(loc.dir, loc.file),
					error: String(err)
				});
			}
		}
	}
	await logServer("info", "历史影像归入本台账完成", { ...out });
	return out;
}
function contractScanBase(name) {
	return (name || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "");
}
async function reconcileContractScans(raw) {
	const list = raw?.contracts;
	if (!Array.isArray(list) || !list.length) return false;
	const dirs = docSearchDirs("contract");
	const all = [];
	for (const d of dirs) for (const f of await listDirSafe(d)) {
		if (f.endsWith(".name.txt") || f.startsWith(".")) continue;
		all.push(f);
	}
	let changed = false;
	for (const c of list) {
		if (c.scanFileName) continue;
		const sid = safeId(c.id || "");
		let found = "";
		const prefixed = all.find((f) => sid && f.startsWith(`${sid}--`));
		if (prefixed) found = prefixed.slice(`${sid}--`.length);
		if (!found && sid) for (const d of dirs) {
			const orig = await readPointerName(d, sid);
			if (orig && all.includes(orig)) {
				found = orig;
				break;
			}
		}
		if (!found) {
			const base = contractScanBase(c.name || "");
			if (base) {
				const prefix = `${base}-合同电子版`;
				const hit = all.find((f) => f === prefix || f.startsWith(`${prefix}.`));
				if (hit) found = hit;
			}
		}
		if (found) {
			c.scanFileName = found;
			changed = true;
		}
	}
	return changed;
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
	const assets = photosRoot();
	if (assets) {
		const assetsDir = join(assets, sid);
		if (existsSync(assetsDir)) await rm(assetsDir, {
			recursive: true,
			force: true
		});
	}
}
async function readVersionText() {
	const candidates = [join(process.cwd(), "VERSION.txt"), "/app/VERSION.txt"];
	for (const p of candidates) try {
		if (!existsSync(p)) continue;
		if (!statSync(p).isFile()) continue;
		return await readFile(p, "utf8");
	} catch {}
	return "";
}
export { savePhoto as C, writeLedger as D, writeBookMeta as E, logServer as O, saveDoc as S, writeAudit as T, removeDocFile as _, findPhotoPath as a, safeBookId as b, ledgerUnreadable as c, photoFlags as d, readAudit as f, removeBookDir as g, readVersionText as h, findDoc as i, listBookIds as l, readLedger as m, appendAudit as n, ledgerRevisionOf as o, readBookMeta as p, dataDir as r, ledgerRevisionValue as s, adoptLegacyAssets as t, persistOn as u, removePhoto as v, scanPhotoFolder as w, saveBackup as x, runWithBook as y };
