import { c as livePerms, o as canWriteLedger } from "./perms-C-hDVhes.js";
import { l as buildFullWorkbook } from "./excel-BlBPgw8h.js";
import { t as useApp } from "./store-RypB8bd6.js";
import { n as toast } from "./dist-CqIYJTgr.js";
var nas = false;
var pushFailed = false;
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
		expenses: j.expenses || [],
		insurancePolicies: j.insurancePolicies || [],
		insuranceMembers: j.insuranceMembers || [],
		accessHash: j.accessHash || "",
		uiStyle: useApp.getState().uiStyle
	});
}
async function pushNasLedger() {
	if (!nas) return;
	if (!canWriteLedger(livePerms())) return;
	const body = sliceState(useApp.getState());
	try {
		const r = await fetch("/api/ledger", {
			method: "PUT",
			credentials: "include",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body)
		});
		if (r.ok) {
			pushFailed = false;
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
	const { writeCenteredXlsx } = await import("./xlsx-center-CnaZE0cp.js");
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
export { pushNasLedger as a, pushNasBackup as i, nasEnabled as n, startNasSync as o, pullNasLedger as r, detectNas as t };
