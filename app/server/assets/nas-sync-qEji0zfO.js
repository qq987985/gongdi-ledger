import { c as livePerms, o as canWriteLedger } from "./perms-CDZPEZ8n.js";
import { l as buildFullWorkbook } from "./excel-CetUkWGx.js";
import { t as useApp } from "./store-U11L9wsl.js";
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
		expenses: s.expenses || [],
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
	const { writeCenteredXlsx } = await import("./xlsx-center-DmiNFhAt.js");
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
