import { l as livePerms, s as canWriteLedger } from "./perms-DxXw_WvE.js";
import { l as buildFullWorkbook } from "./excel-Dqb16tM-.js";
import { n as useApp, t as emptyState } from "./store-CzoyQsGf.js";
import { n as toast } from "./dist-2eP1hwXK.js";
var nas = false;
var pushFailed = false;
var pushQueue = Promise.resolve();
var ledgerRevision = "";
var pullDepth = 0;
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
		expenses: s.expenses || [],
		insurancePolicies: s.insurancePolicies || [],
		insuranceMembers: s.insuranceMembers || [],
		accessHash: s.accessHash || ""
	};
}
async function pullNasLedger(opts = {}) {
	if (!nas) return;
	pullDepth += 1;
	try {
		const r = await timeoutFetch("/api/ledger", 4e3);
		if (!r.ok) return;
		ledgerRevision = r.headers.get("x-ledger-revision") || "";
		const j = await r.json();
		if (j.empty) {
			if (opts.seed) {
				await enqueuePush(true);
				return;
			}
			useApp.getState().setAll({
				...emptyState(),
				uiStyle: useApp.getState().uiStyle
			});
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
			expenses: j.expenses || [],
			insurancePolicies: j.insurancePolicies || [],
			insuranceMembers: j.insuranceMembers || [],
			accessHash: j.accessHash || "",
			uiStyle: useApp.getState().uiStyle
		});
	} finally {
		pullDepth -= 1;
	}
}
async function pushNasLedgerNow(force = false) {
	if (!nas) return;
	if (!force && pullDepth > 0) return;
	if (!canWriteLedger(livePerms())) return;
	const body = sliceState(useApp.getState());
	try {
		const r = await fetch("/api/ledger", {
			method: "PUT",
			credentials: "include",
			headers: {
				"content-type": "application/json",
				"if-match": ledgerRevision
			},
			body: JSON.stringify(body)
		});
		if (r.ok) {
			ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
			pushFailed = false;
			return;
		}
		if (r.status === 409) {
			pushFailed = true;
			toast.error("服务器上的台账已被其他设备修改，请重新加载后再保存");
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
	const { writeCenteredXlsx } = await import("./xlsx-center--KzXDSVh.js");
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
		window.clearTimeout(t);
		t = window.setTimeout(tick, 500);
	});
	return true;
}
export { pushNasBackup as a, pullNasLedger as i, flushPendingLedger as n, pushNasLedger as o, nasEnabled as r, startNasSync as s, detectNas as t };
