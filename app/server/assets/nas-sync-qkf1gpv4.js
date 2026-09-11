import { l as livePerms, o as canManageLedger } from "./perms-h8QMmoTS.js";
import { l as buildFullWorkbook } from "./excel-B6Z5Ro-W.js";
import { n as useApp, r as LEDGER_SCHEMA_VERSION, t as emptyState } from "./store-7Y3fvtZP.js";
import { i as toast } from "./audit-BAusgva9.js";
var nas = false;
var pushFailed = false;
var pushQueue = Promise.resolve();
var ledgerRevision = "";
var pullDepth = 0;
var dirty = false;
var applyingRemote = false;
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
		insuranceMembers: s.insuranceMembers || [],
		accessHash: s.accessHash || ""
	};
}
function confirmDiscardLocal(what) {
	if (!dirty) return true;
	return window.confirm(`本机有还没保存到服务器的改动。\n\n${what}会覆盖这些改动，确定继续吗？`);
}
async function reportPullFailure(r) {
	if (r.status === 401) console.warn("pullNasLedger: 未登录");
	else if (r.status === 403) toast.error("当前账号没有读取台账的权限，请联系管理员");
	else if (r.status === 503) toast.error("服务器上的台账文件读取失败，请联系管理员（不要清空 data）");
	else toast.error(`读取台账失败（${r.status}），请检查网络`);
}
async function pullNasLedger(opts = {}) {
	if (!nas) return;
	pullDepth += 1;
	try {
		const r = await timeoutFetch("/api/ledger", 4e3);
		if (!r.ok) {
			await reportPullFailure(r);
			return;
		}
		ledgerRevision = r.headers.get("x-ledger-revision") || "";
		const j = await r.json();
		if (j.empty) {
			if (opts.seed) {
				await enqueuePush(true);
				return;
			}
			if (!opts.discardLocal && !confirmDiscardLocal("加载这本空台账")) return;
			applyRemote(() => useApp.getState().setAll({
				...emptyState(),
				uiStyle: useApp.getState().uiStyle
			}));
			dirty = false;
			return;
		}
		if (!j.people || !Array.isArray(j.people)) return;
		if (!opts.discardLocal && !confirmDiscardLocal("重新加载服务器上的台账")) return;
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
			accessHash: j.accessHash || "",
			uiStyle: useApp.getState().uiStyle
		}));
		dirty = false;
	} catch (err) {
		toast.error("读取台账失败，请检查网络");
		console.warn("pullNasLedger failed", err);
	} finally {
		pullDepth -= 1;
	}
}
function applyRemote(fn) {
	applyingRemote = true;
	try {
		fn();
	} finally {
		applyingRemote = false;
	}
}
var PUT_HEADERS = (revision) => ({
	"content-type": "application/json",
	"if-match": revision
});
function putLedger(revision) {
	const body = sliceState(useApp.getState());
	return fetch("/api/ledger", {
		method: "PUT",
		credentials: "include",
		headers: PUT_HEADERS(revision),
		body: JSON.stringify(body)
	});
}
async function refreshRevision() {
	try {
		const r = await timeoutFetch("/api/ledger", 4e3);
		if (!r.ok) return null;
		const rev = r.headers.get("x-ledger-revision") || "";
		ledgerRevision = rev;
		return rev;
	} catch {
		return null;
	}
}
async function pushNasLedgerNow(force = false) {
	if (!nas) return;
	if (!force && pullDepth > 0) return;
	if (!canManageLedger(livePerms())) {
		if (dirty && !pushFailed) {
			pushFailed = true;
			toast.error("当前账号没有保存整本台账的权限，改动只保留在本机，请联系管理员");
		}
		return;
	}
	try {
		let r = await putLedger(ledgerRevision);
		if (!r.ok && r.status === 409) {
			if (await refreshRevision() === null) {
				pushFailed = true;
				toast.error("同步冲突，且无法读取服务器版本，请检查网络后重试");
				return;
			}
			if (!window.confirm("服务器上的台账已被其他设备修改。\n\n确定：用本机数据覆盖服务器\n取消：放弃本机改动，加载服务器上的版本")) {
				pushFailed = false;
				dirty = false;
				await pullNasLedger({ discardLocal: true });
				toast.success("已加载服务器上的版本");
				return;
			}
			r = await putLedger(ledgerRevision);
			if (r.ok) {
				ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
				pushFailed = false;
				dirty = false;
				toast.success("已用本机数据覆盖服务器");
				return;
			}
			pushFailed = true;
			toast.error(r.status === 409 ? "覆盖失败：服务器又被改动了，请再试一次" : `覆盖失败（${r.status}）`);
			return;
		}
		if (r.ok) {
			ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
			pushFailed = false;
			dirty = false;
			return;
		}
		if (r.status === 503) {
			pushFailed = true;
			toast.error("服务器上的台账文件读取失败，保存已拒绝，请联系管理员（不要清空 data）");
			return;
		}
		if (r.status === 403) {
			pushFailed = true;
			toast.error("当前账号没有保存整本台账的权限，改动只保留在本机");
			return;
		}
		if (r.status === 400) {
			pushFailed = true;
			const j = await r.json().catch(() => null);
			toast.error(j?.error || "服务器拒绝了这次保存（数据格式不对）");
			return;
		}
		if (!pushFailed) {
			pushFailed = true;
			toast.error(`保存到服务器失败（${r.status}），请检查网络后重试`);
		}
	} catch {
		if (!pushFailed) {
			pushFailed = true;
			toast.error("保存到服务器失败，请检查网络后重试");
		}
	}
}
function enqueuePush(force = false) {
	const run = () => pushNasLedgerNow(force);
	pushQueue = pushQueue.then(run, run);
	return pushQueue;
}
function pushNasLedger() {
	return enqueuePush();
}
async function flushPendingLedger() {
	if (!nas) return;
	try {
		await pushNasLedger();
	} catch {}
}
async function pushNasBackup() {
	if (!nas) return "";
	const s = useApp.getState();
	const wb = buildFullWorkbook({
		year: s.year,
		people: s.people,
		attendance: s.attendance,
		payments: s.payments,
		insurancePolicies: s.insurancePolicies || [],
		insuranceMembers: s.insuranceMembers || []
	});
	const { writeCenteredXlsx } = await import("./xlsx-center-D9gUE76f.js");
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
	await pullNasLedger({ seed: true });
	let t;
	const tick = () => {
		if (pullDepth > 0) {
			t = window.setTimeout(tick, 500);
			return;
		}
		pushNasLedger();
	};
	useApp.subscribe(() => {
		if (applyingRemote) return;
		dirty = true;
		window.clearTimeout(t);
		t = window.setTimeout(tick, 500);
	});
	return true;
}
export { pushNasBackup as a, pullNasLedger as i, flushPendingLedger as n, pushNasLedger as o, nasEnabled as r, startNasSync as s, detectNas as t };
