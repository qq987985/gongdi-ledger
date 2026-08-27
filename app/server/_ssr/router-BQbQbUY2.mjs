import { o as __toESM } from "../_runtime.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as utils, r as writeSync, t as readSync } from "../_libs/xlsx.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { B as require_react, _ as createFileRoute, b as useRouter, d as HeadContent, f as useRouterState, g as lazyRouteComponent, h as Outlet, m as createRouter, u as Scripts, v as createRootRoute, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as require_excel } from "../_libs/exceljs+[...].mjs";
import { C as ClipboardList, D as Camera, O as CalendarDays, T as ChevronLeft, _ as FileText, a as TriangleAlert, c as Plus, d as Menu, f as LogOut, g as FolderOpen, h as History, i as Upload, k as Banknote, n as Users, o as Trash2, p as LayoutDashboard, s as Settings, t as X, w as ChevronRight } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { readFile } from "node:fs/promises";
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
//#region node_modules/.nitro/vite/services/ssr/assets/router-BQbQbUY2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_excel = /* @__PURE__ */ __toESM(require_excel());
var SESSION_KEY = "gongdi-gate-session";
var REMEMBER_KEY = "gongdi-gate-remember";
async function sha256Hex(text) {
	const c = globalThis.crypto;
	if (c?.subtle) {
		const buf = await c.subtle.digest("SHA-256", new TextEncoder().encode(text));
		return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
	}
	return sha256Pure(text);
}
function sha256Pure(message) {
	const bytes = new TextEncoder().encode(message);
	const K = [
		1116352408,
		1899447441,
		3049323471,
		3921009573,
		961987163,
		1508970993,
		2453635748,
		2870763221,
		3624381080,
		310598401,
		607225278,
		1426881987,
		1925078388,
		2162078206,
		2614888103,
		3248222580,
		3835390401,
		4022224774,
		264347078,
		604807628,
		770255983,
		1249150122,
		1555081692,
		1996064986,
		2554220882,
		2821834349,
		2952996808,
		3210313671,
		3336571891,
		3584528711,
		113926993,
		338241895,
		666307205,
		773529912,
		1294757372,
		1396182291,
		1695183700,
		1986661051,
		2177026350,
		2456956037,
		2730485921,
		2820302411,
		3259730800,
		3345764771,
		3516065817,
		3600352804,
		4094571909,
		275423344,
		430227734,
		506948616,
		659060556,
		883997877,
		958139571,
		1322822218,
		1537002063,
		1747873779,
		1955562222,
		2024104815,
		2227730452,
		2361852424,
		2428436474,
		2756734187,
		3204031479,
		3329325298
	];
	function rotr(n, x) {
		return x >>> n | x << 32 - n;
	}
	const l = bytes.length;
	const withPad = new Uint8Array(l + 9 + 63 >> 6 << 6);
	withPad.set(bytes);
	withPad[l] = 128;
	const view = new DataView(withPad.buffer);
	view.setUint32(withPad.length - 4, l * 8, false);
	let h0 = 1779033703, h1 = 3144134277, h2 = 1013904242, h3 = 2773480762, h4 = 1359893119, h5 = 2600822924, h6 = 528734635, h7 = 1541459225;
	const w = /* @__PURE__ */ new Uint32Array(64);
	for (let i = 0; i < withPad.length; i += 64) {
		for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
		for (let t = 16; t < 64; t++) {
			const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ w[t - 15] >>> 3;
			const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ w[t - 2] >>> 10;
			w[t] = w[t - 16] + s0 + w[t - 7] + s1 >>> 0;
		}
		let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
		for (let t = 0; t < 64; t++) {
			const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
			const ch = e & f ^ ~e & g;
			const temp1 = h + S1 + ch + K[t] + w[t] >>> 0;
			const temp2 = (rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) + (a & b ^ a & c ^ b & c) >>> 0;
			h = g;
			g = f;
			f = e;
			e = d + temp1 >>> 0;
			d = c;
			c = b;
			b = a;
			a = temp1 + temp2 >>> 0;
		}
		h0 = h0 + a >>> 0;
		h1 = h1 + b >>> 0;
		h2 = h2 + c >>> 0;
		h3 = h3 + d >>> 0;
		h4 = h4 + e >>> 0;
		h5 = h5 + f >>> 0;
		h6 = h6 + g >>> 0;
		h7 = h7 + h >>> 0;
	}
	return [
		h0,
		h1,
		h2,
		h3,
		h4,
		h5,
		h6,
		h7
	].map((n) => n.toString(16).padStart(8, "0")).join("");
}
async function hashPassword(raw) {
	const t = raw.trim();
	if (!t) return "";
	return sha256Hex(`gongdi-ledger::${t}`);
}
function gateUnlocked(accessHash) {
	if (!accessHash || typeof window === "undefined") return !accessHash;
	return (sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY)) === accessHash;
}
function unlockGate(accessHash, remember) {
	sessionStorage.setItem(SESSION_KEY, accessHash);
	if (remember) localStorage.setItem(REMEMBER_KEY, accessHash);
	else localStorage.removeItem(REMEMBER_KEY);
}
function lockGate() {
	sessionStorage.removeItem(SESSION_KEY);
	localStorage.removeItem(REMEMBER_KEY);
}
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
	const { writeCenteredXlsx } = await import("./xlsx-center-DfQzxMKy.mjs");
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
function lastCol(ws) {
	let last = 1;
	(ws.getRow(2).cellCount > 1 ? ws.getRow(2) : ws.getRow(1)).eachCell({ includeEmpty: false }, (cell) => {
		const c = Number(cell.col);
		if (c > last) last = c;
	});
	return last;
}
/** SheetJS 写不出对齐。把第一行标题按整表列宽合并并水平居中。 */
async function writeCenteredXlsx(wb) {
	const raw = writeSync(wb, {
		bookType: "xlsx",
		type: "array"
	});
	const book = new import_excel.default.Workbook();
	await book.xlsx.load(raw);
	for (const ws of book.worksheets) {
		const last = lastCol(ws);
		let filled = 0;
		ws.getRow(1).eachCell({ includeEmpty: false }, () => {
			filled += 1;
		});
		if (filled > 1) {
			ws.getRow(1).alignment = {
				horizontal: "center",
				vertical: "middle",
				wrapText: true
			};
			continue;
		}
		const title = ws.getCell(1, 1).value;
		if (title == null || last < 2) continue;
		try {
			ws.mergeCells(1, 1, 1, last);
		} catch {}
		const cell = ws.getCell(1, 1);
		cell.value = title;
		cell.alignment = {
			horizontal: "center",
			vertical: "middle"
		};
		cell.font = {
			bold: true,
			size: 14,
			name: "Microsoft YaHei"
		};
		ws.getRow(1).height = 24;
		ws.getRow(2).alignment = {
			horizontal: "center",
			vertical: "middle",
			wrapText: true
		};
	}
	return await book.xlsx.writeBuffer();
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-danger",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "页面出错了"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: error.message || "发生了意外错误，请刷新后重试。"
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			outline: "border border-line-strong bg-surface text-ink hover:bg-accent-soft",
			ghost: "text-ink hover:bg-accent-soft",
			danger: "bg-danger text-danger-fg hover:opacity-90"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-11 px-5",
			icon: "size-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink placeholder:text-subtle outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 md:h-10 md:text-sm", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
function YearSwitcher({ compact }) {
	const year = useApp((s) => s.year);
	const years = useApp((s) => s.years);
	const setYear = useApp((s) => s.setYear);
	const addYear = useApp((s) => s.addYear);
	const removeYear = useApp((s) => s.removeYear);
	const attendance = useApp((s) => s.attendance);
	const list = years?.length ? years : [year || 2026];
	const idx = Math.max(0, list.indexOf(year));
	const prev = list[idx - 1];
	const nxt = list[idx + 1];
	const upcoming = nextYear(list);
	function addNext() {
		const created = addYear(upcoming);
		toast.success(`${created} 年已展开`);
	}
	async function dropYear(y) {
		if (list.length <= 1) {
			toast.error("至少保留一年，不能删光");
			return;
		}
		const filled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, y, i + 1).filled > 0).filter(Boolean).length;
		if (!confirmRemoveYear(y, filled)) return;
		try {
			if (nasEnabled()) await pushNasBackup();
		} catch {}
		removeYear(y);
		toast.success(`已删除 ${y} 年考勤。人员、照片、发放记录都还在。`);
	}
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: "field-select h-9 max-w-[8.5rem] shrink-0 text-sm",
		value: year,
		onChange: (e) => setYear(Number(e.target.value)),
		"aria-label": "选择年度",
		children: list.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
			value: y,
			children: [y, "年"]
		}, y))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !prev,
						type: "button",
						onClick: () => prev && setYear(prev),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select h-9 min-w-0 flex-1",
						value: year,
						onChange: (e) => setYear(Number(e.target.value)),
						"aria-label": "选择年度",
						children: list.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: y,
							children: [y, " 年"]
						}, y))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !nxt,
						type: "button",
						onClick: () => nxt && setYear(nxt),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-accent hover:text-ink",
				onClick: addNext,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }),
					"新增 ",
					upcoming,
					" 年"
				]
			}),
			list.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-danger hover:text-danger",
				onClick: () => void dropYear(year),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }),
					"删除 ",
					year,
					" 年"
				]
			}) : null
		]
	});
}
async function authStatus() {
	const j = await (await fetch("/api/auth", { credentials: "include" })).json();
	return {
		persist: Boolean(j.persist),
		needSetup: Boolean(j.needSetup),
		user: j.user || null,
		books: j.books || [],
		bookId: j.bookId || "",
		users: j.users || [],
		perms: j.perms,
		members: j.members || []
	};
}
async function authOp(op, extra = {}) {
	const r = await fetch("/api/auth", {
		method: "POST",
		credentials: "include",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			op,
			...extra
		})
	});
	const j = await r.json();
	if (!r.ok) throw new Error(j.error || "请求失败");
	return j;
}
function BookSwitcher({ compact }) {
	const [books, setBooks] = (0, import_react.useState)([]);
	const [bookId, setBookId] = (0, import_react.useState)("");
	const [user, setUser] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [renaming, setRenaming] = (0, import_react.useState)(false);
	const [renameTo, setRenameTo] = (0, import_react.useState)("");
	async function load() {
		const s = await authStatus();
		if (!s.persist || !s.user) {
			setBooks([]);
			setUser(null);
			return;
		}
		setBooks(s.books);
		setBookId(s.bookId);
		setUser(s.user);
		const n = s.books.find((b) => b.id === s.bookId)?.name || "";
		window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
		setLivePerms(s.persist ? s.perms || [] : ["*"]);
	}
	(0, import_react.useEffect)(() => {
		load();
		const on = () => void load();
		window.addEventListener("gongdi-books", on);
		return () => window.removeEventListener("gongdi-books", on);
	}, []);
	if (!user || !books.length) return null;
	async function switchTo(id) {
		if (id === bookId) return;
		await authOp("useBook", { id });
		setBookId(id);
		const n = books.find((b) => b.id === id)?.name || id;
		window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
		const s = await authStatus();
		setLivePerms(s.persist ? s.perms || [] : ["*"]);
		await pullNasLedger();
		toast.success(`已切换到「${n}」`);
	}
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: "field-select h-9 max-w-[9rem] text-sm",
		value: bookId,
		onChange: (e) => void switchTo(e.target.value),
		children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: b.id,
			children: b.name
		}, b.id))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				className: "field-select h-9 w-full text-sm",
				value: bookId,
				onChange: (e) => void switchTo(e.target.value),
				"aria-label": "当前台账",
				children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: b.id,
					children: b.name
				}, b.id))
			}),
			user.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] text-muted",
				children: "管理员可进入全部台账"
			}) : null,
			renaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "h-9",
					value: renameTo,
					onChange: (e) => setRenameTo(e.target.value),
					placeholder: "台账名称"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					type: "button",
					onClick: async () => {
						const n = renameTo.trim();
						if (!n) return;
						try {
							await authOp("renameBook", {
								id: bookId,
								name: n
							});
							setRenaming(false);
							await load();
							window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
							toast.success(`已改成「${n}」`);
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "改名失败");
						}
					},
					children: "保存"
				})]
			}) : adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "h-9",
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "新台账名称"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					type: "button",
					onClick: async () => {
						if (!name.trim()) return;
						const r = await authOp("createBook", { name: name.trim() });
						setName("");
						setAdding(false);
						await load();
						if (r.bookId) {
							await pullNasLedger();
							toast.success("已新建空台账");
						}
					},
					children: "建"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted hover:text-ink",
					onClick: () => setAdding(true),
					children: "＋ 新建一套台账"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted hover:text-ink",
					onClick: () => {
						setRenameTo(books.find((b) => b.id === bookId)?.name || "");
						setRenaming(true);
					},
					children: "改名"
				})]
			})
		]
	});
}
var VER = /^\[?(v?\d+)\]?\s*$/i;
function formatVersion(v) {
	const n = String(v || "").replace(/^v/i, "").trim();
	return n ? `VERSION ${n}` : "VERSION";
}
function parseChangelog(text) {
	const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
	const entries = [];
	let current = "";
	let block = null;
	let sawCurrentLine = false;
	for (const raw of lines) {
		const line = raw.trim();
		if (!line || line.startsWith("#") || line.startsWith("当前")) continue;
		const m = line.match(VER);
		if (m && line.length < 12) {
			const version = m[1].toLowerCase().startsWith("v") ? m[1].toLowerCase() : `v${m[1]}`;
			const bracket = line.startsWith("[");
			if (!current) current = version;
			if (!bracket && !sawCurrentLine) {
				sawCurrentLine = true;
				continue;
			}
			sawCurrentLine = true;
			if (block && block.version === version) continue;
			if (block) entries.push(block);
			block = {
				version,
				items: []
			};
			continue;
		}
		if (!block) {
			if (!current) current = line;
			continue;
		}
		block.items.push(line.replace(/^[-*·]\s*/, ""));
	}
	if (block) entries.push(block);
	const merged = [];
	for (const e of entries) {
		const last = merged[merged.length - 1];
		if (last && last.version === e.version) last.items.push(...e.items);
		else merged.push({
			version: e.version,
			items: [...e.items]
		});
	}
	if (!current && merged[0]) current = merged[0].version;
	return {
		current: current || "v55",
		entries: merged
	};
}
var FALLBACK = {
	current: "v55",
	entries: [{
		version: "v55",
		items: ["点此查看更新记录"]
	}]
};
function VersionLog() {
	const [log, setLog] = (0, import_react.useState)(FALLBACK);
	const [open, setOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		fetch("/api/version").then((r) => r.json()).then((d) => {
			if (d?.current) setLog(d);
		}).catch(() => void 0);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "mt-2 block text-[11px] tracking-wide text-subtle underline-offset-2 hover:text-ink hover:underline",
		onClick: () => setOpen(true),
		children: formatVersion(log.current)
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
		onClick: () => setOpen(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "更新记录"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-sm text-muted hover:text-ink",
					onClick: () => setOpen(false),
					children: "关闭"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-4 space-y-4",
				children: log.entries.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-sm font-semibold",
					children: [formatVersion(e.version), e.version === log.current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 text-xs font-normal text-ok",
						children: "当前"
					}) : null]
				}), e.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-1 list-disc space-y-1 pl-5 text-sm text-muted",
					children: e.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-subtle",
					children: "（无说明）"
				})] }, `${e.version}-${i}`))
			})]
		})
	}) : null] });
}
var NAV = [
	{
		to: "/",
		label: "总览",
		icon: LayoutDashboard
	},
	{
		to: "/people",
		label: "人员",
		icon: Users
	},
	{
		to: "/attendance",
		label: "月度考勤",
		icon: CalendarDays
	},
	{
		to: "/payments",
		label: "发放记录",
		icon: Banknote
	},
	{
		to: "/contracts",
		label: "合同管理",
		icon: FileText
	},
	{
		to: "/photos",
		label: "照片",
		icon: Camera
	},
	{
		to: "/files",
		label: "影像资料",
		icon: FolderOpen
	},
	{
		to: "/query",
		label: "个人查询",
		icon: ClipboardList
	},
	{
		to: "/audit",
		label: "操作记录",
		icon: History
	},
	{
		to: "/import",
		label: "导入导出",
		icon: Upload
	},
	{
		to: "/settings",
		label: "设置",
		icon: Settings
	}
];
var TABS = [
	{
		to: "/",
		label: "总览",
		icon: LayoutDashboard
	},
	{
		to: "/attendance",
		label: "考勤",
		icon: CalendarDays
	},
	{
		to: "/contracts",
		label: "合同",
		icon: FileText
	},
	{
		to: "/query",
		label: "查询",
		icon: ClipboardList
	}
];
function useHydrateStore() {
	(0, import_react.useEffect)(() => {
		(async () => {
			try {
				await useApp.persist.rehydrate();
			} catch {}
			try {
				const { startNasSync } = await import("./nas-sync-B-FNBEFu.mjs");
				await startNasSync();
			} catch {}
			const add = Number(new URLSearchParams(window.location.search).get("addYear") || 0);
			if (add >= 2e3 && add <= 2100) {
				useApp.getState().addYear(add);
				window.history.replaceState(null, "", window.location.pathname);
			}
		})();
	}, []);
}
function AppShell() {
	useHydrateStore();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const year = useApp((s) => s.year);
	const accessHash = useApp((s) => s.accessHash);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [unlocked, setUnlocked] = (0, import_react.useState)(() => !accessHash);
	const [gate, setGate] = (0, import_react.useState)("boot");
	const [acct, setAcct] = (0, import_react.useState)("");
	const [who, setWho] = (0, import_react.useState)(null);
	const [, setPermTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => subscribePerms(() => setPermTick((n) => n + 1)), []);
	async function refreshGate() {
		try {
			const s = await authStatus();
			setAcct(s.user?.name || s.user?.username || "");
			setWho(s.user ? {
				name: s.user.name,
				username: s.user.username,
				role: s.user.role
			} : null);
			setLivePerms(s.persist ? s.perms || [] : ["*"]);
			if (!s.persist) setGate("app");
			else if (s.needSetup) setGate("setup");
			else if (!s.user) setGate("login");
			else if (!s.books.length) setGate("nobook");
			else {
				setGate("app");
				try {
					const { detectNas, pullNasLedger } = await import("./nas-sync-B-FNBEFu.mjs");
					await detectNas();
					await pullNasLedger();
				} catch {}
			}
		} catch {
			setGate("app");
		}
	}
	(0, import_react.useEffect)(() => {
		refreshGate();
	}, []);
	(0, import_react.useEffect)(() => {
		setUnlocked(!accessHash || gateUnlocked(accessHash));
	}, [accessHash]);
	(0, import_react.useEffect)(() => {
		setOpen(false);
	}, [pathname]);
	if (gate === "boot") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-bg text-sm text-muted",
		children: "加载中…"
	});
	if (gate === "setup") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupScreen, { onOk: () => void refreshGate() });
	if (gate === "login") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcctLogin, { onOk: () => void refreshGate() });
	if (gate === "nobook") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoBookScreen, { onOut: () => void refreshGate() });
	if (accessHash && !unlocked && gate === "app" && !acct) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginScreen, {
		accessHash,
		onOk: () => setUnlocked(true)
	});
	const visNav = NAV.filter((item) => {
		if (item.to === "/import") return can("import.use") || can("export.use");
		const p = NAV_PERM[item.to];
		return !p || can(p);
	});
	const visTabs = TABS.filter((item) => {
		const p = NAV_PERM[item.to];
		return !p || can(p);
	});
	const tabHit = visTabs.some((t) => t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(t.to));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen min-h-dvh overflow-x-hidden bg-bg text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "no-print hidden w-56 shrink-0 flex-col border-r border-line bg-bg-elevated px-4 py-6 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {
						year,
						pathname
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookSwitcher, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YearSwitcher, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-6 flex flex-col gap-1",
						children: visNav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
							...item,
							active: pathname === item.to
						}, item.to))
					}),
					who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhoCard, { who }) : null,
					accessHash || acct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-ink",
						onClick: () => {
							if (acct) {
								authOp("logout").finally(() => {
									lockGate();
									setGate("login");
									toast.success("已退出登录");
								});
								return;
							}
							lockGate();
							setUnlocked(false);
							toast.success("已退出登录");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-3.5" }), "退出登录"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionLog, {})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur md:hidden",
						style: { paddingTop: "max(0.5rem, env(safe-area-inset-top))" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {
							year,
							compact: true,
							pathname
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1",
							children: [
								who ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mr-1 min-w-0 text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-xs font-medium",
										children: who.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-[10px] text-muted",
										children: who.role === "admin" ? "管理员" : who.username
									})]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookSwitcher, { compact: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YearSwitcher, { compact: true })
							]
						})]
					}),
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "no-print space-y-1 border-b border-line bg-surface p-3 md:hidden",
						children: [
							visNav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								...item,
								active: pathname === item.to,
								onClick: () => setOpen(false)
							}, item.to)),
							who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhoCard, { who }) : null,
							accessHash || acct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-11 w-full items-center gap-2 rounded-sm px-3 text-sm text-muted",
								onClick: () => {
									if (acct) {
										authOp("logout").finally(() => {
											lockGate();
											setGate("login");
											toast.success("已退出登录");
										});
										return;
									}
									lockGate();
									setUnlocked(false);
									toast.success("已退出登录");
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), "退出登录"]
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "px-3 py-4 md:px-8 md:py-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "no-print fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 backdrop-blur md:hidden",
			style: {
				paddingBottom: "env(safe-area-inset-bottom, 0px)",
				gridTemplateColumns: `repeat(${visTabs.length + 1}, minmax(0, 1fr))`
			},
			children: [visTabs.map((item) => {
				const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.to,
					preload: false,
					className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", active ? "text-accent" : "text-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-5" }), item.label]
				}, item.to);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", open || !tabHit ? "text-accent" : "text-muted"),
				onClick: () => setOpen((v) => !v),
				children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" }), "菜单"]
			})]
		})]
	});
}
function SetupScreen({ onOk }) {
	const [username, setUsername] = (0, import_react.useState)("admin");
	const [name, setName] = (0, import_react.useState)("管理员");
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [again, setAgain] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		if (pwd.length < 4) {
			toast.error("密码至少 4 位");
			return;
		}
		if (pwd !== again) {
			toast.error("两次密码不一致");
			return;
		}
		setBusy(true);
		try {
			await authOp("setup", {
				username,
				password: pwd,
				name
			});
			toast.success("管理员已创建");
			onOk();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "创建失败");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "创建管理员"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "第一次使用。原来的数据会放进「默认台账」，不会丢。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "显示名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: name,
							onChange: (e) => setName(e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "登录名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: username,
							onChange: (e) => setUsername(e.target.value),
							autoComplete: "username"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: pwd,
							onChange: (e) => setPwd(e.target.value),
							autoComplete: "new-password"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "再输一次" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: again,
							onChange: (e) => setAgain(e.target.value),
							autoComplete: "new-password"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "submit",
					disabled: busy,
					children: "创建并进入"
				})
			]
		})
	});
}
function NoBookScreen({ onOut }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "还没有台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "这个账户没有自己的台账。请让管理员在「设置 → 这套台账的成员」里把你加进去。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "button",
					variant: "outline",
					onClick: () => {
						authOp("logout").finally(() => onOut());
					},
					children: "退出登录"
				})
			]
		})
	});
}
function AcctLogin({ onOk }) {
	const [username, setUsername] = (0, import_react.useState)("");
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await authOp("login", {
				username,
				password: pwd
			});
			onOk();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "登录失败");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "每个账户各自的数据。以前设过总密码的，用户名填 admin，密码还是原来的。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "用户名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: username,
						onChange: (e) => setUsername(e.target.value),
						autoComplete: "username",
						autoFocus: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "password",
						value: pwd,
						onChange: (e) => setPwd(e.target.value),
						autoComplete: "current-password"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "submit",
					disabled: busy || !username || !pwd,
					children: "登录"
				})
			]
		})
	});
}
function LoginScreen({ accessHash, onOk }) {
	const [pwd, setPwd] = (0, import_react.useState)("");
	const [remember, setRemember] = (0, import_react.useState)(true);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			if (await hashPassword(pwd) !== accessHash) {
				toast.error("密码不对");
				return;
			}
			unlockGate(accessHash, remember);
			onOk();
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		style: { paddingTop: "env(safe-area-inset-top)" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "手机、电脑浏览器都可打开。已开密码时先登录。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gate-login",
						children: "访问密码"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "gate-login",
						className: "mt-1",
						type: "password",
						autoFocus: true,
						value: pwd,
						onChange: (e) => setPwd(e.target.value),
						autoComplete: "current-password",
						enterKeyHint: "done"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-3 flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "size-4",
						checked: remember,
						onChange: (e) => setRemember(e.target.checked)
					}), "本机记住，下次不用再输"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-5 h-11 w-full",
					type: "submit",
					disabled: busy || !pwd,
					children: "进入"
				})
			]
		})
	});
}
function WhoCard({ who }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-lg border border-line bg-surface px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] tracking-wide text-muted",
				children: "当前账户"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "truncate font-medium",
				children: who.name || who.username
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "truncate text-[11px] text-muted",
				children: [who.username, who.role === "admin" ? " · 管理员" : " · 用户"]
			})
		]
	});
}
function Brand({ year, compact, pathname }) {
	const section = (NAV.find((n) => n.to === pathname) || NAV.find((n) => n.to !== "/" && pathname.startsWith(n.to)))?.label || "总览";
	const [book, setBook] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		function apply(name) {
			setBook(name);
		}
		authStatus().then((s) => {
			apply(s.books.find((b) => b.id === s.bookId)?.name || "");
		});
		const on = (e) => apply(e.detail || "");
		window.addEventListener("gongdi-book", on);
		return () => window.removeEventListener("gongdi-book", on);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("font-display truncate font-semibold tracking-tight", compact ? "text-base" : "text-lg"),
			children: book || "台账"
		}), !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-0.5 truncate text-xs text-muted",
			children: [
				year,
				" · ",
				section
			]
		}) : null]
	});
}
function NavLink({ to, label, icon: Icon, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		onClick,
		preload: false,
		className: cn("flex h-11 items-center gap-2 rounded-sm px-3 text-sm transition-colors duration-150 md:h-10", active ? "bg-accent text-accent-fg" : "text-muted hover:bg-accent-soft hover:text-ink"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
	});
}
var styles_default = "/assets/styles-DIWCajj9.css";
var APP_NAME = "台账";
var Route$24 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#2a4a40"
			},
			{
				name: "description",
				content: "人员考勤、工资发放与合同台账"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-title",
				content: APP_NAME
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			}
		],
		links: [{
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon.svg"
		}, {
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-CN",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("noscript", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				style: {
					padding: 16,
					textAlign: "center"
				},
				children: "本系统需要浏览器允许脚本。请关闭拦截后刷新。"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				richColors: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$10 = () => import("./routes-latcMGPP.mjs");
var Route$23 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./attendance-sKyJrHoV.mjs");
var Route$22 = createFileRoute("/attendance")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./audit-Cp0osu97.mjs");
var Route$21 = createFileRoute("/audit")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./contracts-cgqRz6OA.mjs");
var Route$20 = createFileRoute("/contracts")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./files-BeIYWVQS.mjs");
var Route$19 = createFileRoute("/files")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./import-YQBAXhK_.mjs");
var Route$18 = createFileRoute("/import")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./payments-DLFcc4y2.mjs");
var Route$17 = createFileRoute("/payments")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./people-C4wqC7sj.mjs");
var Route$16 = createFileRoute("/people")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./photos-DlN3gXNk.mjs");
var Route$15 = createFileRoute("/photos")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./query-DGYirHuN.mjs");
var Route$14 = createFileRoute("/query")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./settings-Blg8EK74.mjs");
var Route$13 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route$12 = createFileRoute("/api/audit")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, readAudit } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ entries: [] });
		return withTenant(request, async () => Response.json({ entries: await readAudit() }), "audit.view");
	},
	POST: async ({ request }) => {
		const { persistOn, appendAudit } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant, resolveTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const body = await request.json();
		if (!body.action?.trim()) return Response.json({ error: "缺少操作" }, { status: 400 });
		const t = await resolveTenant(request);
		return withTenant(request, async () => {
			const entry = await appendAudit({
				userId: t.user?.id || "",
				userName: t.user?.name || t.user?.username || "",
				action: body.action.trim().slice(0, 80),
				detail: String(body.detail || "").slice(0, 400),
				module: String(body.module || "").slice(0, 40)
			});
			return Response.json({
				ok: true,
				entry
			});
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, readAudit, writeAudit } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant, resolveTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if ((await resolveTenant(request)).user?.role !== "admin") return Response.json({ error: "只有管理员能改操作记录" }, { status: 403 });
		const body = await request.json();
		if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
		return withTenant(request, async () => {
			const next = (await readAudit()).map((e) => e.id === body.id ? {
				...e,
				action: body.action != null ? String(body.action).slice(0, 80) : e.action,
				detail: body.detail != null ? String(body.detail).slice(0, 400) : e.detail,
				module: body.module != null ? String(body.module).slice(0, 40) : e.module
			} : e);
			await writeAudit(next);
			return Response.json({ ok: true });
		});
	},
	DELETE: async ({ request }) => {
		const { persistOn, readAudit, writeAudit } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant, resolveTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if ((await resolveTenant(request)).user?.role !== "admin") return Response.json({ error: "只有管理员能删操作记录" }, { status: 403 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const ids = (url.searchParams.get("ids") || id).split(",").filter(Boolean);
		return withTenant(request, async () => {
			const list = await readAudit();
			await writeAudit(list.filter((e) => !ids.includes(e.id)));
			return Response.json({ ok: true });
		});
	}
} } });
var Route$11 = createFileRoute("/api/auth")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn } = await import("./nas-fs.server-P6o-d4JV.mjs");
		if (!persistOn()) return Response.json({
			persist: false,
			needSetup: false,
			user: null,
			books: []
		});
		const { ensureAccounts, resolveTenant, publicUser, memberList } = await import("./accounts.server-DH_I0P04.mjs");
		const { hasPerm } = await import("../_libs/_.mjs").then((n) => n.l);
		const data = await ensureAccounts();
		const t = await resolveTenant(request);
		const manage = Boolean(t.user && (t.user.role === "admin" || t.book?.ownerId === t.user.id || hasPerm(t.perms, "members.manage")));
		return Response.json({
			persist: true,
			needSetup: t.needSetup,
			user: t.user ? publicUser(t.user) : null,
			books: t.books,
			bookId: t.bookId,
			perms: t.perms,
			members: t.book ? memberList(t.book, data.users) : [],
			users: t.user && (t.user.role === "admin" || manage) ? data.users.map(publicUser) : []
		});
	},
	POST: async ({ request }) => {
		const { persistOn } = await import("./nas-fs.server-P6o-d4JV.mjs");
		if (!persistOn()) return Response.json({ error: "未开启 NAS 持久化" }, { status: 400 });
		const { handleAuthPost } = await import("./accounts.server-DH_I0P04.mjs");
		return handleAuthPost(request);
	}
} } });
var Route$10 = createFileRoute("/api/backup")({ server: { handlers: { POST: async ({ request }) => {
	const { persistOn, saveBackup } = await import("./nas-fs.server-P6o-d4JV.mjs");
	const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
	if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
	const buf = Buffer.from(await request.arrayBuffer());
	return withTenant(request, async () => {
		const stamp = /* @__PURE__ */ new Date();
		const pad = (n) => String(n).padStart(2, "0");
		const fname = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}_考勤表.xlsx`;
		const path = await saveBackup(buf, fname);
		return Response.json({
			ok: true,
			filename: fname,
			path
		});
	});
} } } });
function kindOf$2(v) {
	if (v === "report" || v === "invoice" || v === "receipt" || v === "attendance") return v;
	return null;
}
var MIME = {
	".pdf": "application/pdf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".xml": "application/xml",
	".ofd": "application/ofd",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".xls": "application/vnd.ms-excel"
};
var Route$9 = createFileRoute("/api/doc")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, findDoc } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return new Response("not found", { status: 404 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const kind = kindOf$2(url.searchParams.get("kind"));
		if (!id || !kind) return new Response("bad request", { status: 400 });
		return withTenant(request, async () => {
			const hit = await findDoc(id, kind);
			if (!hit) return new Response("not found", { status: 404 });
			const mime = MIME[`.${(hit.fileName.split(".").pop() || "").toLowerCase()}`] || "application/octet-stream";
			return new Response(new Uint8Array(hit.buf), { headers: {
				"Content-Type": mime,
				"Content-Disposition": `inline; filename="${encodeURIComponent(hit.fileName)}"`,
				"Cache-Control": "no-store"
			} });
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, saveDoc } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const form = await request.formData();
		const id = String(form.get("id") || "");
		const kind = kindOf$2(String(form.get("kind") || ""));
		const file = form.get("file");
		if (!id || !kind || !(file instanceof File)) return Response.json({ ok: false }, { status: 400 });
		const buf = Buffer.from(await file.arrayBuffer());
		return withTenant(request, async () => {
			await saveDoc(id, kind, buf, file.name);
			return Response.json({
				ok: true,
				fileName: file.name
			});
		}, "files.edit");
	},
	DELETE: async ({ request }) => {
		const { persistOn, removeDocFile } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const kind = kindOf$2(url.searchParams.get("kind"));
		if (!id || !kind) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await removeDocFile(id, kind);
			return Response.json({ ok: true });
		}, "files.edit");
	}
} } });
var Route$8 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => {
	const { persistOn } = await import("./nas-fs.server-P6o-d4JV.mjs");
	return Response.json({
		persist: persistOn(),
		ok: true
	});
} } } });
var Route$7 = createFileRoute("/api/ledger")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, readLedger } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({
			persist: false,
			empty: true
		});
		return withTenant(request, async () => {
			const data = await readLedger();
			return Response.json({
				persist: true,
				...data
			});
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, writeLedger } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ persist: false }, { status: 400 });
		const body = await request.json();
		return withTenant(request, async () => {
			await writeLedger(body);
			return Response.json({ ok: true });
		}, "ledger.write");
	}
} } });
function kindOf$1(v) {
	if (v === "id" || v === "bank" || v === "ic") return v;
	return null;
}
var Route$6 = createFileRoute("/api/photo")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, findPhotoPath } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ url: null });
		const url = new URL(request.url);
		const name = url.searchParams.get("name") || "";
		const kind = kindOf$1(url.searchParams.get("kind"));
		if (!name || !kind) return Response.json({ url: null });
		return withTenant(request, async () => {
			const hit = await findPhotoPath(name, kind);
			if (!hit) return Response.json({
				url: null,
				file: null
			});
			return Response.json({
				url: `/api/photo-file?name=${encodeURIComponent(name)}&kind=${kind}&v=${encodeURIComponent(hit.file)}`,
				file: hit.file
			});
		});
	},
	PUT: async ({ request }) => {
		const { persistOn, savePhoto } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const body = await request.json();
		const kind = kindOf$1(body.kind || null);
		if (!body.name || !kind || !body.dataUrl) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await savePhoto(body.name, kind, body.dataUrl);
			return Response.json({ ok: true });
		}, "photos.edit");
	},
	DELETE: async ({ request }) => {
		const { persistOn, removePhoto } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const url = new URL(request.url);
		const name = url.searchParams.get("name") || "";
		const kind = kindOf$1(url.searchParams.get("kind"));
		if (!name || !kind) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await removePhoto(name, kind);
			return Response.json({ ok: true });
		}, "photos.edit");
	}
} } });
function kindOf(v) {
	if (v === "id" || v === "bank" || v === "ic") return v;
	return null;
}
var Route$5 = createFileRoute("/api/photo-file")({ server: { handlers: { GET: async ({ request }) => {
	const { persistOn, findPhotoPath } = await import("./nas-fs.server-P6o-d4JV.mjs");
	const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
	if (!persistOn()) return new Response("no", { status: 404 });
	const url = new URL(request.url);
	const name = url.searchParams.get("name") || "";
	const kind = kindOf(url.searchParams.get("kind"));
	if (!name || !kind) return new Response("no", { status: 404 });
	return withTenant(request, async () => {
		const hit = await findPhotoPath(name, kind);
		if (!hit) return new Response("no", { status: 404 });
		const buf = await readFile(hit.path);
		return new Response(buf, { headers: {
			"content-type": hit.mime,
			"cache-control": "private, max-age=30",
			"content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(hit.file)}`
		} });
	});
} } } });
async function namesFrom(request) {
	const q = (new URL(request.url).searchParams.get("names") || "").split("\n").filter(Boolean);
	if (request.method === "GET") return q;
	const body = await request.json().catch(() => ({}));
	if (Array.isArray(body.names) && body.names.length) return body.names.map(String).filter(Boolean);
	return q;
}
var Route$4 = createFileRoute("/api/photo-flags")({ server: { handlers: {
	GET: async ({ request }) => {
		const { persistOn, photoFlags } = await import("./nas-fs.server-P6o-d4JV.mjs");
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
	},
	POST: async ({ request }) => {
		const { persistOn, photoFlags } = await import("./nas-fs.server-P6o-d4JV.mjs");
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
	}
} } });
var Route$3 = createFileRoute("/api/photo-scan")({ server: { handlers: { POST: async ({ request }) => {
	const { persistOn, scanPhotoFolder, readLedger } = await import("./nas-fs.server-P6o-d4JV.mjs");
	const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
	if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
	const body = await request.json().catch(() => ({}));
	return withTenant(request, async () => {
		let names = Array.isArray(body.names) ? body.names.map(String).filter(Boolean) : [];
		if (!names.length) {
			const led = await readLedger();
			names = (Array.isArray(led.people) ? led.people : []).map((p) => String(p.name || "").trim()).filter(Boolean);
		}
		return Response.json(await scanPhotoFolder(names));
	});
} } } });
var Route$2 = createFileRoute("/api/version")({ server: { handlers: { GET: async () => {
	const { readVersionText } = await import("./nas-fs.server-P6o-d4JV.mjs");
	const text = await readVersionText();
	return Response.json(parseChangelog(text || "v55\n\n[v55]\n左下角点版本号查看更新记录"));
} } } });
async function addYearAndRedirect(request, year) {
	const { persistOn, readLedger, writeLedger } = await import("./nas-fs.server-P6o-d4JV.mjs");
	const referer = request.headers.get("referer");
	let back = "/";
	try {
		if (referer) back = new URL(referer).pathname || "/";
	} catch {
		back = "/";
	}
	if (year < 2e3 || year > 2100) return Response.redirect(new URL(back, request.url), 303);
	if (!persistOn()) {
		const url = new URL(back, request.url);
		url.searchParams.set("addYear", String(year));
		return Response.redirect(url, 303);
	}
	const data = await readLedger();
	const rec = !("empty" in data && data.empty) ? data : {
		year: 2026,
		years: [2026],
		people: [],
		attendance: [],
		payments: [],
		accessHash: ""
	};
	const years = Array.isArray(rec.years) ? [...rec.years] : [2026];
	if (!years.includes(year)) years.push(year);
	years.sort((a, b) => a - b);
	await writeLedger({
		...rec,
		years,
		year
	});
	return Response.redirect(new URL(back, request.url), 303);
}
var Route$1 = createFileRoute("/api/year")({ server: { handlers: {
	GET: async () => Response.json({ error: "请在月度考勤里新增年份" }, { status: 405 }),
	POST: async ({ request }) => {
		const form = await request.formData();
		return addYearAndRedirect(request, Number(form.get("year") || form.get("add") || 0));
	}
} } });
async function xlsxFile(wb, filename) {
	const data = await writeCenteredXlsx(wb);
	const ascii = filename.replace(/[^\x20-\x7e]/g, "_");
	return new Response(data, { headers: {
		"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
		"Cache-Control": "no-store"
	} });
}
var Route = createFileRoute("/api/file/$kind")({ server: { handlers: { GET: async ({ params, request }) => {
	const url = new URL(request.url);
	const year = Number(url.searchParams.get("year") || "2026") || 2026;
	const kind = params.kind;
	if (kind === "people-template") return xlsxFile(peopleTemplateWb(), "人员导入模板.xlsx");
	if (kind === "attendance-template") return xlsxFile(attendanceTemplateWb(year), `${year}年考勤导入模板.xlsx`);
	if (kind === "payment-template") return xlsxFile(paymentTemplateWb(), "发放记录导入模板.xlsx");
	if (kind === "contract-template") return xlsxFile(contractTemplateWb(), "合同导入模板.xlsx");
	if (kind === "contract-export" || kind === "export") {
		const { persistOn, readLedger } = await import("./nas-fs.server-P6o-d4JV.mjs");
		const { withTenant } = await import("./accounts.server-DH_I0P04.mjs");
		const run = async () => {
			const data = persistOn() ? await readLedger() : { empty: true };
			const rec = !("empty" in data && data.empty) ? data : {};
			if (kind === "contract-export") {
				let contracts = rec.contracts || [];
				let contractEntries = rec.contractEntries || [];
				const yearFilter = url.searchParams.get("year");
				const y = Number(yearFilter);
				if (y >= 2e3) {
					contracts = contracts.filter((c) => c.year === y);
					const ids = new Set(contracts.map((c) => c.id));
					contractEntries = contractEntries.filter((e) => ids.has(e.contractId));
				}
				const name = y >= 2e3 ? `${y}年合同明细.xlsx` : "合同明细.xlsx";
				return xlsxFile(buildContractWorkbook({
					contracts,
					entries: contractEntries
				}), name);
			}
			const people = rec.people || [];
			const attendance = rec.attendance || [];
			const payments = rec.payments || [];
			return xlsxFile(buildFullWorkbook({
				year,
				people,
				attendance,
				payments
			}), `${year}年考勤表.xlsx`);
		};
		if (persistOn()) return withTenant(request, run);
		return run();
	}
	return new Response("not found", { status: 404 });
} } } });
var rootRouteChildren = {
	IndexRoute: Route$23.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$24
	}),
	AttendanceRoute: Route$22.update({
		id: "/attendance",
		path: "/attendance",
		getParentRoute: () => Route$24
	}),
	AuditRoute: Route$21.update({
		id: "/audit",
		path: "/audit",
		getParentRoute: () => Route$24
	}),
	ContractsRoute: Route$20.update({
		id: "/contracts",
		path: "/contracts",
		getParentRoute: () => Route$24
	}),
	FilesRoute: Route$19.update({
		id: "/files",
		path: "/files",
		getParentRoute: () => Route$24
	}),
	ImportRoute: Route$18.update({
		id: "/import",
		path: "/import",
		getParentRoute: () => Route$24
	}),
	PaymentsRoute: Route$17.update({
		id: "/payments",
		path: "/payments",
		getParentRoute: () => Route$24
	}),
	PeopleRoute: Route$16.update({
		id: "/people",
		path: "/people",
		getParentRoute: () => Route$24
	}),
	PhotosRoute: Route$15.update({
		id: "/photos",
		path: "/photos",
		getParentRoute: () => Route$24
	}),
	QueryRoute: Route$14.update({
		id: "/query",
		path: "/query",
		getParentRoute: () => Route$24
	}),
	SettingsRoute: Route$13.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route$24
	}),
	ApiAuditRoute: Route$12.update({
		id: "/api/audit",
		path: "/api/audit",
		getParentRoute: () => Route$24
	}),
	ApiAuthRoute: Route$11.update({
		id: "/api/auth",
		path: "/api/auth",
		getParentRoute: () => Route$24
	}),
	ApiBackupRoute: Route$10.update({
		id: "/api/backup",
		path: "/api/backup",
		getParentRoute: () => Route$24
	}),
	ApiDocRoute: Route$9.update({
		id: "/api/doc",
		path: "/api/doc",
		getParentRoute: () => Route$24
	}),
	ApiHealthRoute: Route$8.update({
		id: "/api/health",
		path: "/api/health",
		getParentRoute: () => Route$24
	}),
	ApiLedgerRoute: Route$7.update({
		id: "/api/ledger",
		path: "/api/ledger",
		getParentRoute: () => Route$24
	}),
	ApiPhotoRoute: Route$6.update({
		id: "/api/photo",
		path: "/api/photo",
		getParentRoute: () => Route$24
	}),
	ApiPhotoFileRoute: Route$5.update({
		id: "/api/photo-file",
		path: "/api/photo-file",
		getParentRoute: () => Route$24
	}),
	ApiPhotoFlagsRoute: Route$4.update({
		id: "/api/photo-flags",
		path: "/api/photo-flags",
		getParentRoute: () => Route$24
	}),
	ApiPhotoScanRoute: Route$3.update({
		id: "/api/photo-scan",
		path: "/api/photo-scan",
		getParentRoute: () => Route$24
	}),
	ApiVersionRoute: Route$2.update({
		id: "/api/version",
		path: "/api/version",
		getParentRoute: () => Route$24
	}),
	ApiYearRoute: Route$1.update({
		id: "/api/year",
		path: "/api/year",
		getParentRoute: () => Route$24
	}),
	ApiFileKindRoute: Route.update({
		id: "/api/file/$kind",
		path: "/api/file/$kind",
		getParentRoute: () => Route$24
	})
};
var routeTree = Route$24._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent,
		defaultPreload: false,
		defaultPendingMinMs: 0
	});
}
//#endregion
export { PERM_GROUPS as $, CONTRACT_STATUSES as A, nextYear as B, excel_exports as C, parsePeopleSheet as D, parsePaymentSheet as E, emptyContract as F, parseIdCard as G, normalizeIdDate as H, encodeOtRule as I, round2 as J, parseOtRule as K, hasWork as L, contractRollup as M, dateYear as N, paymentTemplateWb as O, derivedYears as P, NAV_PERM as Q, monthPay as R, contractTemplateWb as S, parseContractWorkbook as T, overAgeLabel as U, normalizeEntry as V, parseDateYmd as W, wageLabel as X, splitTax as Y, ALL_PERMS as Z, fetchAudit as _, Label as a, perms_exports as at, buildContractWorkbook as b, detectNas as c, cn as ct, pushNasBackup as d, money as dt, PRESETS as et, useApp as f, toggleSel as ft, unlockGate as g, lockGate as h, Input as i, livePerms as it, confirmRemoveYear as j, peopleTemplateWb as k, nasEnabled as l, confirmBatchDelete as lt, hashPassword as m, authOp as n, canWriteLedger as nt, Button as o, setLivePerms as ot, startNasSync as p, uid as pt, paymentsInYear as q, authStatus as r, hasPerm as rt, writeCenteredXlsx as s, subscribePerms as st, router_exports as t, can as tt, pullNasLedger as u, copyText as ut, logOp as v, parseAttendanceSheet as w, buildFullWorkbook as x, attendanceTemplateWb as y, monthStatus as z };
