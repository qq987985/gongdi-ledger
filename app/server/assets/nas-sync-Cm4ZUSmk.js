import { d as setLivePerms, l as livePerms, o as canManageLedger } from "./perms-D5IsG1Md.js";
import { v as hasContent } from "./wage-BVBIWt51.js";
import { t as buildFullWorkbook } from "./excel-kgejXfpm.js";
import { n as authStatus, t as authOp } from "./auth-vJcuvblQ.js";
import { a as syncMuted, i as runMuted, n as useApp, r as LEDGER_SCHEMA_VERSION, t as emptyState } from "./store-SQXLJqfK.js";
import { v as toast } from "./audit-diff-BCw9WhZ-.js";
import { n as setNasEnabled, t as nasEnabled } from "./nas-flag-0jlzrHLn.js";
function backupMonths(input) {
	const years = /* @__PURE__ */ new Set();
	for (const y of input.years || []) if (y >= 2e3 && y <= 2100) years.add(Math.round(y));
	for (const a of input.attendance) if (a.year >= 2e3 && a.year <= 2100) years.add(Math.round(a.year));
	if (input.year >= 2e3 && input.year <= 2100) years.add(Math.round(input.year));
	if (!years.size) years.add(input.year);
	const list = [];
	for (const y of [...years].sort((a, b) => a - b)) for (let m = 1; m <= 12; m += 1) list.push({
		year: y,
		month: m
	});
	return list;
}
function buildBackupWorkbook(input) {
	return buildFullWorkbook({
		year: input.year,
		people: input.people,
		attendance: input.attendance,
		payments: input.payments,
		expenses: input.expenses || [],
		insurancePolicies: input.insurancePolicies || [],
		insuranceMembers: input.insuranceMembers || [],
		contracts: input.contracts || [],
		contractEntries: input.contractEntries || [],
		months: backupMonths(input)
	});
}
function backupCounts(input) {
	return {
		people: input.people.length,
		attendance: input.attendance.filter((a) => (a.name || "").trim() && hasContent(a)).length,
		payments: input.payments.length,
		expenses: (input.expenses || []).length,
		contracts: (input.contracts || []).length,
		contractEntries: (input.contractEntries || []).length,
		policies: (input.insurancePolicies || []).length,
		insuranceMembers: (input.insuranceMembers || []).length
	};
}
function backupSummaryText(c) {
	return [
		`已备份 ${c.people} 人`,
		`${c.attendance} 条考勤`,
		`${c.payments} 笔发放`,
		`${c.expenses} 条报销`,
		`${c.contracts} 份合同（含 ${c.contractEntries} 条明细）`,
		`${c.policies} 份保单`,
		`${c.insuranceMembers} 位参保人`
	].join(" / ");
}
var gzipOn = true;
function setLedgerGzip(v) {
	gzipOn = v !== false;
}
function ledgerGzipOn() {
	return gzipOn;
}
var keep = 30;
function setBackupKeep(v) {
	const n = Number(v);
	keep = Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 1e3) : 30;
}
function backupKeep() {
	return keep;
}
var state = "idle";
var message = "";
var listeners = /* @__PURE__ */ new Set();
function emit() {
	for (const fn of listeners) fn();
}
function setSyncFailed(msg) {
	const next = msg.trim();
	if (state === "failed" && message === next) return;
	state = "failed";
	message = next;
	emit();
}
function setSyncIdle() {
	if (state === "idle" && !message) return;
	state = "idle";
	message = "";
	emit();
}
function subscribeSyncStatus(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
function syncStateSnapshot() {
	return state;
}
function syncMessageSnapshot() {
	return message;
}
var failedNotified = false;
var pushQueue = Promise.resolve();
var ledgerRevision = "";
var pullDepth = 0;
var dirty = false;
var syncReady = false;
var syncEpoch = 0;
var subscribed = false;
var saveTimer;
function pauseNasSync() {
	syncReady = false;
	syncEpoch += 1;
	window.clearTimeout(saveTimer);
	saveTimer = void 0;
	invalidateInFlightPulls();
}
function resumeNasSync() {
	syncReady = true;
}
var bookBlocked = false;
var pullGen = 0;
var pullQueue = Promise.resolve();
var inflightPull = null;
var awaitingSeedPush = 0;
function invalidateInFlightPulls(reason = "") {
	pullGen += 1;
	const ac = inflightPull;
	inflightPull = null;
	if (ac) try {
		ac.abort();
	} catch {}
	if (reason) console.warn(`已作废在途台账拉取：${reason}`);
}
function timeoutFetch(url, ms, init, signal) {
	const c = new AbortController();
	const onAbort = () => c.abort();
	if (signal) if (signal.aborted) c.abort();
	else signal.addEventListener("abort", onAbort);
	const t = window.setTimeout(() => c.abort(), ms);
	return fetch(url, {
		...init,
		credentials: "include",
		signal: c.signal
	}).finally(() => {
		window.clearTimeout(t);
		if (signal) signal.removeEventListener("abort", onAbort);
	});
}
async function detectNas() {
	try {
		const r = await timeoutFetch("/api/health", 2500);
		if (!r.ok) return nasEnabled();
		const j = await r.json();
		if (typeof j?.persist !== "boolean") return nasEnabled();
		setNasEnabled(j.persist);
		setLedgerGzip(j.ledgerGzip);
		setBackupKeep(j.backupKeep);
	} catch {}
	return nasEnabled();
}
function sliceState(s) {
	return {
		schemaVersion: s.schemaVersion || 2,
		year: s.year,
		years: s.years,
		people: s.people,
		attendance: s.attendance,
		attendanceDocs: s.attendanceDocs || [],
		payments: s.payments,
		contracts: s.contracts || [],
		contractEntries: s.contractEntries || [],
		expenses: s.expenses || [],
		insurancePolicies: s.insurancePolicies || [],
		insuranceMembers: s.insuranceMembers || []
	};
}
function confirmDiscardLocal(what) {
	if (!dirty) return true;
	return window.confirm(`本机有还没保存到服务器的改动。\n\n${what}会覆盖这些改动，确定继续吗？`);
}
async function reportPullFailure(r) {
	if (r.status === 401) console.warn("pullNasLedger: 未登录");
	else if (r.status === 404) {
		const j = await r.json().catch(() => null);
		toast.error(j?.bookDenied ? "这本台账不存在或你已不是它的成员（可能已被删除/移除）。请在左上角重新选择台账；当前改动只保留在本机。" : "读取台账失败（404），请检查服务地址后重试");
	} else if (r.status === 403) toast.error("当前账号没有读取台账的权限，请联系管理员");
	else if (r.status === 503) toast.error("服务器上的台账文件读取失败，请联系管理员（不要清空 data）");
	else toast.error(`读取台账失败（${r.status}），请检查网络`);
}
function dropLocalLedger(reason) {
	invalidateInFlightPulls(reason);
	const uiStyle = useApp.getState().uiStyle;
	const accessHash = useApp.getState().accessHash;
	applyRemote(() => useApp.getState().setAll({
		...emptyState(),
		accessHash,
		uiStyle
	}));
	dirty = false;
	failedNotified = false;
	ledgerRevision = "";
	setSyncIdle();
	console.warn(`已清空本机台账缓存：${reason}`);
}
var CACHE_OWNER_KEY = "gongdi-ledger-v5-owner";
function checkCacheOwner(userId, bookId) {
	const next = `${userId}::${bookId}`;
	let prev = "";
	try {
		prev = localStorage.getItem(CACHE_OWNER_KEY) || "";
	} catch {}
	if (!prev) return "absent";
	return prev === next ? "same" : "changed";
}
function setCacheOwner(userId, bookId) {
	try {
		localStorage.setItem(CACHE_OWNER_KEY, `${userId}::${bookId}`);
	} catch {}
}
async function pullNasLedger(opts = {}) {
	if (!nasEnabled()) return;
	if (opts.seed && !syncReady) return;
	const gen = ++pullGen;
	if (awaitingSeedPush > 0) return pullNasLedgerOnce(gen, opts);
	const run = () => pullNasLedgerOnce(gen, opts);
	const next = pullQueue.then(run, run);
	pullQueue = next.catch(() => {});
	return next;
}
async function pullNasLedgerOnce(gen, opts) {
	if (gen !== pullGen) return;
	const stale = () => gen !== pullGen;
	const ac = new AbortController();
	inflightPull = ac;
	pullDepth += 1;
	try {
		const r = await timeoutFetch("/api/ledger", 4e3, void 0, ac.signal);
		if (stale()) return;
		if (!r.ok) {
			await reportPullFailure(r);
			if (stale()) return;
			if (r.status === 401 || r.status === 403 || r.status === 404) {
				bookBlocked = true;
				dropLocalLedger(`读取台账被拒（${r.status}）`);
			}
			return;
		}
		bookBlocked = false;
		ledgerRevision = r.headers.get("x-ledger-revision") || "";
		const j = await r.json();
		if (stale()) return;
		if (j.empty) {
			if (opts.seed) {
				if (stale()) return;
				awaitingSeedPush += 1;
				try {
					await enqueuePush(true);
				} finally {
					awaitingSeedPush -= 1;
				}
				return;
			}
			if (!opts.discardLocal && !confirmDiscardLocal("加载这本空台账")) return;
			if (stale()) return;
			applyRemote(() => useApp.getState().setAll({
				...emptyState(),
				uiStyle: useApp.getState().uiStyle
			}));
			dirty = false;
			return;
		}
		if (!j.people || !Array.isArray(j.people)) return;
		if (!opts.discardLocal && !confirmDiscardLocal("重新加载服务器上的台账")) return;
		if (stale()) return;
		applyRemote(() => useApp.getState().setAll({
			schemaVersion: j.schemaVersion || 2,
			year: j.year || 2026,
			years: j.years || [j.year || 2026],
			people: j.people,
			attendance: j.attendance || [],
			attendanceDocs: j.attendanceDocs || [],
			payments: j.payments || [],
			contracts: j.contracts || [],
			contractEntries: j.contractEntries || [],
			expenses: j.expenses || [],
			insurancePolicies: j.insurancePolicies || [],
			insuranceMembers: j.insuranceMembers || [],
			accessHash: j.accessHash || useApp.getState().accessHash,
			uiStyle: useApp.getState().uiStyle
		}));
		dirty = false;
	} catch (err) {
		if (stale() || ac.signal.aborted) return;
		toast.error("读取台账失败，请检查网络");
		console.warn("pullNasLedger failed", err);
	} finally {
		if (inflightPull === ac) inflightPull = null;
		pullDepth -= 1;
	}
}
function applyRemote(fn) {
	runMuted(fn);
}
function syncFailed(msg) {
	setSyncFailed(msg);
	if (!failedNotified) {
		failedNotified = true;
		toast.error(msg);
	}
}
function syncOk() {
	failedNotified = false;
	dirty = false;
	setSyncIdle();
}
var PUT_HEADERS = (revision) => ({
	"content-type": "application/json",
	"if-match": revision
});
async function gzipJson(text) {
	if (typeof CompressionStream !== "function") return null;
	try {
		const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
		return await new Response(stream).arrayBuffer();
	} catch (err) {
		console.warn("台账压缩失败，改用未压缩上传", err);
		return null;
	}
}
async function putLedger(revision, epoch) {
	const body = sliceState(useApp.getState());
	const json = JSON.stringify(body);
	const gz = ledgerGzipOn() ? await gzipJson(json) : null;
	if (!syncReady || epoch !== syncEpoch) throw new Error("台账身份已改变，本次保存已取消");
	const headers = { ...PUT_HEADERS(revision) };
	if (gz) headers["content-encoding"] = "gzip";
	return fetch("/api/ledger", {
		method: "PUT",
		credentials: "include",
		headers,
		body: gz ?? json
	});
}
async function refreshRevision() {
	try {
		const r = await timeoutFetch("/api/ledger", 4e3);
		if (!r.ok) return null;
		return r.headers.get("x-ledger-revision") || "";
	} catch {
		return null;
	}
}
async function pushNasLedgerNow(force = false, epoch = syncEpoch) {
	if (!nasEnabled()) return;
	if (!syncReady || epoch !== syncEpoch) return;
	if (!force && pullDepth > 0) return;
	if (!canManageLedger(livePerms())) {
		if (dirty) syncFailed("当前账号没有保存整本台账的权限，改动只保留在本机，请联系管理员");
		return;
	}
	if (bookBlocked) {
		if (dirty) syncFailed("这本台账对你已不可用（可能已被移除或删除），改动只保留在本机；请重新登录或在左上角选择台账");
		return;
	}
	try {
		let r = await putLedger(ledgerRevision, epoch);
		if (!syncReady || epoch !== syncEpoch) return;
		if (!r.ok && r.status === 409) {
			const fresh = await refreshRevision();
			if (!syncReady || epoch !== syncEpoch) return;
			if (fresh === null) {
				syncFailed("同步冲突，且无法读取服务器版本，请检查网络后重试");
				return;
			}
			ledgerRevision = fresh;
			if (!window.confirm("服务器上的台账已被其他设备修改。\n\n【确定】用本机数据覆盖服务器（服务器上别处改的那份会被丢掉）\n【取消 / Esc】放弃本机这批改动（改不回本机了），改用服务器上的版本")) {
				syncOk();
				await pullNasLedger({ discardLocal: true });
				toast.success("已加载服务器上的版本");
				return;
			}
			r = await putLedger(ledgerRevision, epoch);
			if (!syncReady || epoch !== syncEpoch) return;
			if (r.ok) {
				ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
				syncOk();
				toast.success("已用本机数据覆盖服务器");
				return;
			}
			syncFailed(r.status === 409 ? "覆盖失败：服务器又被改动了，请再试一次" : `覆盖失败（${r.status}）`);
			return;
		}
		if (r.ok) {
			ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
			syncOk();
			return;
		}
		if (r.status === 503) {
			syncFailed("服务器上的台账文件读取失败，保存已拒绝，请联系管理员（不要清空 data）");
			return;
		}
		if (r.status === 401) {
			syncFailed("登录已失效，请重新登录（改动还留在本机，先别关页面）");
			return;
		}
		if (r.status === 403) {
			syncFailed("当前账号没有保存整本台账的权限，改动只保留在本机");
			return;
		}
		if (r.status === 400) {
			syncFailed((await r.json().catch(() => null))?.error || "服务器拒绝了这次保存（数据格式不对）");
			return;
		}
		syncFailed(`保存到服务器失败（${r.status}），请检查网络后重试`);
	} catch {
		if (!syncReady || epoch !== syncEpoch) return;
		syncFailed("保存到服务器失败，请检查网络后重试");
	}
}
function enqueuePush(force = false) {
	const epoch = syncEpoch;
	const run = () => pushNasLedgerNow(force, epoch);
	pushQueue = pushQueue.then(run, run);
	return pushQueue;
}
function pushNasLedger() {
	return enqueuePush();
}
async function flushPendingLedger() {
	if (!nasEnabled()) return {
		status: "skipped",
		reason: "本机没连服务器：台账只在浏览器里"
	};
	if (!dirty) return { status: "ok" };
	await pushNasLedger();
	if (dirty) return {
		status: "failed",
		reason: syncStateSnapshot() === "failed" ? syncMessageSnapshot() || "改动还没保存到服务器" : "正在读取台账，本机改动还没推上去"
	};
	return { status: "ok" };
}
function askConfirm(message$1) {
	const ask = globalThis.confirm;
	if (typeof ask !== "function") return true;
	return Boolean(ask(message$1));
}
async function flushBeforeTransition(what, ask) {
	const flushed = await flushPendingLedger();
	if (flushed.status !== "failed") return "ok";
	return ask(`本机还有改动没能保存到服务器：\n\n${flushed.reason}\n\n现在${what}的话，这批改动会丢（只留在本机的那份会被清掉）。\n【确定】放弃这批改动，继续　【取消】留在当前台账，先把改动保存成功再切`) ? "ok" : "cancelled";
}
async function enterBookAfterTransition(what) {
	invalidateInFlightPulls(what);
	const s = await authStatus().catch(() => null);
	const bookId = String(s?.bookId || "");
	if (s) {
		setLivePerms(s.persist ? s.perms || ["*"] : ["*"]);
		setCacheOwner(String(s.user?.id || ""), bookId);
	}
	dropLocalLedger(what);
	await pullNasLedger();
	return bookId;
}
async function switchBook(id, opts = {}) {
	const what = opts.action || "切换台账";
	if (await flushBeforeTransition(what, opts.ask || askConfirm) === "cancelled") return { status: "cancelled" };
	try {
		await authOp("useBook", { id });
	} catch (err) {
		return {
			status: "failed",
			reason: err instanceof Error ? err.message : `${what}失败`
		};
	}
	return {
		status: "ok",
		bookId: await enterBookAfterTransition(`${what} ${id}`)
	};
}
async function createBookAndEnter(name, opts = {}) {
	const what = opts.action || "新建台账";
	if (await flushBeforeTransition(what, opts.ask || askConfirm) === "cancelled") return { status: "cancelled" };
	try {
		await authOp("createBook", { name });
	} catch (err) {
		return {
			status: "failed",
			reason: err instanceof Error ? err.message : `${what}失败`
		};
	}
	return {
		status: "ok",
		bookId: await enterBookAfterTransition(what)
	};
}
async function deleteBook(id, opts = {}) {
	const what = opts.action || "删除台账";
	const ask = opts.ask || askConfirm;
	const before = await authStatus().catch(() => null);
	const currentBefore = String(before?.bookId || "");
	if (currentBefore === id && await flushBeforeTransition(`${what}（当前这一本）`, ask) === "cancelled") return { status: "cancelled" };
	try {
		await authOp("deleteBook", { id });
	} catch (err) {
		return {
			status: "failed",
			reason: err instanceof Error ? err.message : `${what}失败`
		};
	}
	const after = await authStatus().catch(() => null);
	const currentAfter = String(after?.bookId || "");
	if (currentAfter && currentBefore && currentAfter === currentBefore) {
		invalidateInFlightPulls(what);
		return {
			status: "ok",
			bookId: currentAfter
		};
	}
	return {
		status: "ok",
		bookId: await enterBookAfterTransition(what)
	};
}
async function pushNasBackup() {
	const s = useApp.getState();
	const input = {
		year: s.year,
		years: s.years,
		people: s.people,
		attendance: s.attendance,
		payments: s.payments,
		expenses: s.expenses || [],
		contracts: s.contracts || [],
		contractEntries: s.contractEntries || [],
		insurancePolicies: s.insurancePolicies || [],
		insuranceMembers: s.insuranceMembers || []
	};
	const counts = backupCounts(input);
	if (!nasEnabled()) return {
		filename: "",
		counts,
		summary: ""
	};
	const wb = buildBackupWorkbook(input);
	const { writeCenteredXlsx } = await import("./xlsx-center-CYABF9J5.js");
	const data = await writeCenteredXlsx(wb);
	const r = await fetch("/api/backup", {
		method: "POST",
		credentials: "include",
		body: data
	});
	if (!r.ok) throw new Error("backup failed");
	return {
		filename: (await r.json()).filename || "",
		counts,
		summary: backupSummaryText(counts)
	};
}
async function startNasSync() {
	if (subscribed) return nasEnabled();
	subscribed = true;
	const tick = () => {
		if (!syncReady || !nasEnabled()) return;
		if (pullDepth > 0) {
			saveTimer = window.setTimeout(tick, 500);
			return;
		}
		pushNasLedger();
	};
	useApp.subscribe(() => {
		if (syncMuted()) return;
		if (!syncReady || !nasEnabled()) return;
		dirty = true;
		window.clearTimeout(saveTimer);
		saveTimer = window.setTimeout(tick, 500);
	});
	return true;
}
export { subscribeSyncStatus as _, dropLocalLedger as a, backupKeep as b, pauseNasSync as c, pushNasLedger as d, resumeNasSync as f, setSyncIdle as g, switchBook as h, detectNas as i, pullNasLedger as l, startNasSync as m, createBookAndEnter as n, flushPendingLedger as o, setCacheOwner as p, deleteBook as r, invalidateInFlightPulls as s, checkCacheOwner as t, pushNasBackup as u, syncMessageSnapshot as v, syncStateSnapshot as y };
