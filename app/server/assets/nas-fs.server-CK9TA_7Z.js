import { AsyncLocalStorage } from "node:async_hooks";
import { existsSync, statSync } from "node:fs";
import { dirname, extname, join, sep } from "node:path";
import { appendFile, copyFile, mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const LOG_LEVELS = [
	"debug",
	"info",
	"warn",
	"error"
];
const DEFAULT_LOG_LEVEL = "info";
var DATED_LOG_RE = /^\d{4}-\d{2}-\d{2}\.log(\.\d+)?$/;
const PROTECTED_LOG_FILES = ["update.log"];
var MAX_KEEP_DAYS = 3650;
var MAX_LOG_MB = 10240;
var MAX_ROTATION_INDEX = 999;
function parseLogLevel(raw) {
	const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
	return LOG_LEVELS.includes(v) ? v : DEFAULT_LOG_LEVEL;
}
function levelRank(raw) {
	const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
	return LOG_LEVELS.indexOf(v);
}
function shouldLog(level, min = DEFAULT_LOG_LEVEL) {
	const l = levelRank(level);
	if (l < 0) return false;
	const m = levelRank(min);
	return l >= (m < 0 ? levelRank(DEFAULT_LOG_LEVEL) : m);
}
function parsePositiveNumber(raw, fallback, max) {
	const n = typeof raw === "number" ? raw : Number(String(raw == null ? "" : raw).trim());
	if (!Number.isFinite(n) || n <= 0) return fallback;
	return Math.min(n, max);
}
function parseKeepDays(raw) {
	const n = Math.floor(parsePositiveNumber(raw, 14, MAX_KEEP_DAYS));
	return n >= 1 ? n : 14;
}
function parseMaxMb(raw) {
	return parsePositiveNumber(raw, 8, MAX_LOG_MB);
}
function dayString(d) {
	return d.toISOString().slice(0, 10);
}
function logRetentionCutoff(now, keepDays = 14) {
	const days = Number.isFinite(keepDays) && Math.floor(keepDays) >= 1 ? Math.floor(keepDays) : 14;
	const base = now instanceof Date && Number.isFinite(now.getTime()) ? now : /* @__PURE__ */ new Date();
	const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
	d.setUTCDate(d.getUTCDate() - (days - 1));
	return dayString(d);
}
function isManagedLogFile(name) {
	if (typeof name !== "string") return false;
	if (PROTECTED_LOG_FILES.includes(name)) return false;
	return DATED_LOG_RE.test(name);
}
function isExpiredLogFile(name, now, keepDays = 14) {
	if (!isManagedLogFile(name)) return false;
	const day = String(name).slice(0, 10);
	if (!Number.isFinite(Date.parse(`${day}T00:00:00.000Z`))) return false;
	return day < logRetentionCutoff(now, keepDays);
}
function selectExpiredLogs(names, now, keepDays = 14) {
	return names.filter((n) => isExpiredLogFile(n, now, keepDays));
}
function needsDailyCleanup(lastCleanupDay, today) {
	return lastCleanupDay !== today;
}
function nextRotationName(day, existingNames) {
	const base = `${day}.log`;
	let max = 0;
	for (const n of existingNames || []) {
		if (typeof n !== "string") continue;
		const m = /^(\d{4}-\d{2}-\d{2})\.log\.(\d+)$/.exec(n);
		if (!m || m[1] !== day) continue;
		const idx = Number.parseInt(m[2], 10);
		if (Number.isFinite(idx) && idx > max) max = idx;
	}
	return `${base}.${Math.min(max + 1, MAX_ROTATION_INDEX)}`;
}
function logMaxBytes(env = process.env) {
	return Math.floor(parseMaxMb(env.LOG_MAX_MB) * 1024 * 1024);
}
function formatLogLine(level, event, detail = {}, now = /* @__PURE__ */ new Date()) {
	try {
		return JSON.stringify({
			at: now.toISOString(),
			level,
			event,
			...detail
		});
	} catch {
		return JSON.stringify({
			at: now.toISOString(),
			level,
			event,
			detail: "[无法序列化]"
		});
	}
}
function stdoutLog(level, line) {
	try {
		if (level === "error") console.error(line);
		else if (level === "warn") console.warn(line);
		else if (level === "debug") console.debug(line);
		else console.log(line);
	} catch {}
}
var state = {
	dir: "",
	day: "",
	bytes: -1,
	lastCleanupDay: null
};
function stateFor(dir, today) {
	if (state.dir !== dir || state.day !== today) state = {
		dir,
		day: today,
		bytes: -1,
		lastCleanupDay: null
	};
	return state;
}
var queue = Promise.resolve();
async function pruneOldLogs(dir, env = process.env, now = /* @__PURE__ */ new Date()) {
	const keep = parseKeepDays(env.LOG_KEEP_DAYS);
	try {
		const names = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isFile()).map((e) => e.name);
		for (const name of selectExpiredLogs(names, now, keep)) try {
			await unlink(join(dir, name));
		} catch {}
	} catch {}
}
async function writeLogLine(dir, line, opts = {}) {
	const env = opts.env || process.env;
	const now = opts.now instanceof Date ? opts.now : /* @__PURE__ */ new Date();
	const today = dayString(now);
	const st = stateFor(dir, today);
	if (needsDailyCleanup(st.lastCleanupDay, today)) {
		st.lastCleanupDay = today;
		await pruneOldLogs(dir, env, now);
	}
	await mkdir(dir, { recursive: true });
	const file = join(dir, `${today}.log`);
	const size = Buffer.byteLength(line, "utf8") + 1;
	const max = logMaxBytes(env);
	if (st.bytes < 0) try {
		st.bytes = (await stat(file)).size;
	} catch {
		st.bytes = 0;
	}
	if (st.bytes > 0 && st.bytes + size > max) try {
		const target = join(dir, nextRotationName(today, (await readdir(dir, { withFileTypes: true })).filter((e) => e.isFile()).map((e) => e.name)));
		await rename(file, target);
		st.bytes = 0;
		stdoutLog("warn", JSON.stringify({
			at: now.toISOString(),
			level: "warn",
			event: "当天日志已达上限，已滚动到下一份",
			file: target,
			maxMb: parseMaxMb(env.LOG_MAX_MB)
		}));
	} catch {
		stdoutLog("warn", JSON.stringify({
			at: now.toISOString(),
			level: "warn",
			event: "日志滚动失败，本次不写文件",
			file
		}));
		return;
	}
	await appendFile(file, `${line}\n`, "utf8");
	st.bytes += size;
}
function enqueueLogLine(dir, line, opts = {}) {
	queue = queue.then(() => writeLogLine(dir, line, opts).catch(() => {}), () => {});
	return queue;
}
function logsDir() {
	const root = process.env.DATA_DIR?.trim();
	return root ? join(root, "logs") : "";
}
function logServer(level, event, detail = {}) {
	if (!shouldLog(level, parseLogLevel(process.env.LOG_LEVEL))) return Promise.resolve();
	const line = formatLogLine(level, event, detail);
	stdoutLog(level, line);
	const dir = logsDir();
	if (!dir) return Promise.resolve();
	return enqueueLogLine(dir, line);
}
var bookAls = new AsyncLocalStorage();
var ensuredFor = "";
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
const DOC_CN = {
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
	const key = `${dataDir()}::${currentBookId()}`;
	if (ensuredFor === key) return;
	ensuredFor = key;
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
		if (!existsSync(p)) await writeFile(p, text, "utf8");
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
		const excel = await import("./excel-CgSwmTl8.js");
		const { writeCenteredXlsx } = await import("./xlsx-center-fYk3httj.js");
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
var PHOTO_DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;
function photoNameWritable(name) {
	return Boolean(safeName(String(name ?? "")));
}
function isWritablePhotoDataUrl(dataUrl) {
	return PHOTO_DATA_URL_RE.test(String(dataUrl ?? ""));
}
function docIdWritable(id) {
	return Boolean(safeId(String(id ?? "")));
}
function compactName(s) {
	return s.normalize("NFC").replace(/[\\/:*?"<>|]/g, "").replace(/[\s　._\-－—–·•]/g, "").toLowerCase();
}
var dirEntryCache = /* @__PURE__ */ new Map();
function assetsCacheMs() {
	const raw = process.env.ASSETS_CACHE_MS;
	if (raw === void 0 || raw.trim() === "") return 3e3;
	const n = Number(raw);
	return Number.isFinite(n) && n >= 0 ? n : 3e3;
}
function invalidateDirCache(dir) {
	if (dir) dirEntryCache.delete(dir);
}
async function listDirCached(dir) {
	if (!dir) return [];
	const ttl = assetsCacheMs();
	if (ttl <= 0) return listDirSafe(dir);
	let mtimeMs;
	try {
		mtimeMs = (await stat(dir)).mtimeMs;
	} catch {
		dirEntryCache.delete(dir);
		return [];
	}
	const now = Date.now();
	const hit = dirEntryCache.get(dir);
	if (hit && hit.mtimeMs === mtimeMs && now - hit.at < ttl) return hit.names;
	let names;
	try {
		names = await readdir(dir);
	} catch {
		dirEntryCache.delete(dir);
		return [];
	}
	dirEntryCache.set(dir, {
		names,
		mtimeMs,
		at: now
	});
	return names;
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
		const hits = (await listDirCached(loc.dir)).filter((f) => photoFileMatches(f, n, kind, loc.mixed));
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
	const m = dataUrl.match(PHOTO_DATA_URL_RE);
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
		await rename(tmp, dest);
		if (hit && join(hit.dir, hit.file) !== dest && isInsideBookAssets(hit.dir)) await rm(join(hit.dir, hit.file), { force: true }).catch(async (e) => {
			await logServer("warn", "旧照片清理失败（新照片已保存）", {
				file: join(hit.dir, hit.file),
				error: String(e)
			});
		});
	} catch (err) {
		await rm(tmp, { force: true }).catch(() => {});
		throw err;
	}
	invalidateDirCache(dir);
	if (hit) invalidateDirCache(hit.dir);
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
		let touched = false;
		for (const f of files) if (photoFileMatches(f, n, kind, true)) {
			removed.add(f);
			await rm(join(d, f), { force: true });
			touched = true;
		}
		if (touched) invalidateDirCache(d);
	}
	if (!legacyFallbackOn() || !removed.size) return;
	for (const loc of photoSearchDirs(kind)) {
		if (isInsideBookAssets(loc.dir)) continue;
		const files = await listDirSafe(loc.dir);
		let touched = false;
		for (const f of files) if (removed.has(f) && photoFileMatches(f, n, kind, loc.mixed)) {
			await rm(join(loc.dir, f), { force: true });
			touched = true;
		}
		if (touched) invalidateDirCache(loc.dir);
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
		if (!cache.has(dir)) cache.set(dir, await listDirCached(dir));
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
		const files = (await listDirCached(loc.dir)).filter((f) => PHOTO_EXT.has(extname(f).toLowerCase()));
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
	const files = await listDirCached(dir);
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
async function sweepDocFiles(kind, sid, opts = {}) {
	const { keep = "", prev = "", sharedPrev = false, dropPointer = true } = opts;
	for (const d of bookDocDirs(kind)) {
		const files = await listDirSafe(d);
		let touched = false;
		for (const f of files) {
			if (keep && f === keep) continue;
			if (f.startsWith(`${sid}--`) || f === `${sid}.name.txt`) {
				if (f !== `${sid}.name.txt` || dropPointer) {
					await rm(join(d, f), { force: true });
					touched = true;
				}
			} else if (prev && f === prev && !sharedPrev) {
				await rm(join(d, f), { force: true });
				touched = true;
			}
		}
		if (touched) invalidateDirCache(d);
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
	const pointed = kind === "contract" || kind === "expense" || kind === "payout";
	const dest = join(dir, pointed ? orig : `${sid}--${orig}`);
	try {
		await writeFile(tmp, buf);
		await rename(tmp, dest);
		if (pointed) await atomicWriteFile(join(dir, `${sid}.name.txt`), orig);
		await sweepDocFiles(kind, sid, {
			keep: pointed ? orig : `${sid}--${orig}`,
			prev,
			sharedPrev,
			dropPointer: false
		});
	} catch (err) {
		await rm(tmp, { force: true }).catch(() => {});
		throw err;
	}
	for (const d of bookDocDirs(kind)) invalidateDirCache(d);
	return orig;
}
async function removeDocFile(id, kind) {
	if (!persistOn()) return;
	const sid = safeId(id);
	if (!sid) return;
	for (const d of bookDocDirs(kind)) {
		const prev = await readPointerName(d, sid);
		const sharedPrev = prev ? await otherPointersUse(d, sid, prev) : false;
		const files = await listDirSafe(d);
		let touched = false;
		for (const f of files) if (f.startsWith(`${sid}--`) || f === `${sid}.name.txt`) {
			await rm(join(d, f), { force: true });
			touched = true;
		} else if (prev && f === prev && !sharedPrev) {
			await rm(join(d, f), { force: true });
			touched = true;
		}
		if (touched) invalidateDirCache(d);
	}
}
async function findDocLocation(id, kind) {
	if (!persistOn()) return null;
	const sid = safeId(id);
	for (const d of docSearchDirs(kind)) {
		const files = await listDirCached(d);
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
async function adoptLegacyAssets(led) {
	const out = {
		photos: 0,
		docs: 0,
		skipped: 0
	};
	if (!persistOn()) return out;
	await ensureDirs();
	const bookDir = bookAssetsRoot();
	if (!bookDir) return out;
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
			invalidateDirCache(destDir);
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
	if (list.every((c) => c.scanFileName)) return false;
	const dirs = docSearchDirs("contract");
	const all = [];
	for (const d of dirs) for (const f of await listDirCached(d)) {
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
	if ("accessHash" in raw) delete raw.accessHash;
	return raw;
}
function ledgerRevisionOf(data) {
	return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}
function ledgerRevisionValue(data) {
	return "empty" in data && data.empty ? "" : ledgerRevisionOf(data);
}
function dropLegacyAccessHash(data) {
	if (!data || typeof data !== "object" || !("accessHash" in data)) return {
		payload: data,
		hadValue: false
	};
	const clone = { ...data };
	const value = clone.accessHash;
	delete clone.accessHash;
	return {
		payload: clone,
		hadValue: Boolean(value)
	};
}
var ledgerWriteQueue = Promise.resolve({
	result: "ok",
	revision: ""
});
async function writeLedgerNow(data, expectedRevision) {
	if (!persistOn()) return {
		result: "ok",
		revision: ""
	};
	await ensureDirs();
	const cur = await readLedger();
	if (ledgerUnreadable(cur)) return {
		result: "unreadable",
		revision: ""
	};
	if (expectedRevision !== void 0 && ledgerRevisionValue(cur) !== expectedRevision) return {
		result: "conflict",
		revision: ""
	};
	const { payload, hadValue } = dropLegacyAccessHash(data);
	if (hadValue) await logServer("warn", "台账写入已丢弃旧字段 accessHash", { path: ledgerPath() });
	const p = ledgerPath();
	const tmp = `${p}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	try {
		await writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
		await rename(tmp, p);
	} catch (err) {
		await rm(tmp, { force: true }).catch(() => {});
		await logServer("error", "台账写入失败", {
			path: p,
			error: String(err)
		});
		throw err;
	}
	const after = await readLedger();
	return {
		result: "ok",
		revision: ledgerUnreadable(after) ? "" : ledgerRevisionValue(after)
	};
}
function writeLedgerEx(data, expectedRevision) {
	const run = () => writeLedgerNow(data, expectedRevision);
	ledgerWriteQueue = ledgerWriteQueue.then(run, run);
	return ledgerWriteQueue;
}
async function writeLedger(data, expectedRevision) {
	return (await writeLedgerEx(data, expectedRevision)).result;
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
var auditBroken = false;
function auditUnreadable() {
	return auditBroken;
}
async function readAudit() {
	if (!persistOn()) return [];
	await ensureDirs();
	const p = auditPath();
	if (existsSync(p)) try {
		const rows = parseAuditFile(JSON.parse(await readFile(p, "utf8")));
		auditBroken = false;
		return rows;
	} catch (err) {
		auditBroken = true;
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
	const MAX_AUDIT_ENTRIES = 2e4;
	if (entries.length > MAX_AUDIT_ENTRIES) {
		await logServer("warn", "操作记录超出上限，最老的记录将被丢弃", {
			count: entries.length,
			keep: MAX_AUDIT_ENTRIES
		});
		entries = entries.slice(0, MAX_AUDIT_ENTRIES);
	}
	await atomicWriteFile(auditPath(), JSON.stringify({ entries }, null, 2));
}
var auditQueue = Promise.resolve();
function appendAudit(row) {
	const task = async () => {
		const list = await readAudit();
		if (auditBroken) {
			await logServer("error", "操作记录写入被拒：文件读不出来", { path: auditPath() });
			return {
				id: row.id || "",
				at: row.at || (/* @__PURE__ */ new Date()).toISOString(),
				userId: row.userId || "",
				userName: row.userName || "",
				action: row.action || "",
				detail: row.detail || "",
				module: row.module || ""
			};
		}
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
const DEFAULT_BACKUP_KEEP = 30;
function backupKeepCount() {
	const raw = Number(process.env.BACKUP_KEEP);
	if (!Number.isFinite(raw) || raw < 1) return 30;
	return Math.min(Math.floor(raw), 1e3);
}
function isManagedBackupFile(name) {
	if (name === "考勤表.xlsx") return true;
	return /^\d{8}_\d{6}_考勤表\.xlsx$/.test(name);
}
async function pruneBackups(keep = backupKeepCount()) {
	if (!persistOn()) return 0;
	const dir = join(dataDir(), "backups");
	const files = (await listDirSafe(dir)).filter((f) => isManagedBackupFile(f) && f !== "考勤表.xlsx");
	if (files.length <= keep) return 0;
	files.sort();
	const doomed = files.slice(0, files.length - keep);
	let removed = 0;
	for (const f of doomed) try {
		await rm(join(dir, f), { force: true });
		removed += 1;
	} catch (err) {
		await logServer("warn", "旧备份删除失败", {
			file: f,
			error: String(err)
		});
	}
	if (removed) await logServer("info", "备份保留策略：清理旧备份", {
		removed,
		keep
	});
	return removed;
}
async function saveBackup(buf, filename) {
	if (!persistOn()) return "";
	await ensureDirs();
	const root = dataDir();
	const dest = join(root, "backups", filename.replace(/[\\/]/g, "") || "backup.xlsx");
	await mkdir(join(root, "backups"), { recursive: true });
	if (buf.length === 0) {
		await logServer("warn", "备份写入被拒：内容为 0 字节", { dest });
		return "";
	}
	await atomicWriteFile(dest, buf);
	await atomicWriteFile(join(root, "backups", "考勤表.xlsx"), buf);
	await pruneBackups();
	return dest;
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
export { saveDoc as A, findDoc as C, photoNameWritable as D, photoFlags as E, persistOn as F, runWithBook as I, logServer as L, scanPhotoFolder as M, DOC_CN as N, removeDocFile as O, dataDir as P, docIdWritable as S, isWritablePhotoDataUrl as T, writeAudit as _, isManagedBackupFile as a, writeLedgerEx as b, ledgerUnreadable as c, readAudit as d, readBookMeta as f, saveBackup as g, removeBookDir as h, backupKeepCount as i, savePhoto as j, removePhoto as k, listBookIds as l, readVersionText as m, appendAudit as n, ledgerRevisionOf as o, readLedger as p, auditUnreadable as r, ledgerRevisionValue as s, DEFAULT_BACKUP_KEEP as t, pruneBackups as u, writeBookMeta as v, findPhotoPath as w, adoptLegacyAssets as x, writeLedger as y };
