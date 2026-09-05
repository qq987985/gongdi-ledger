import { o as uid } from "./utils-DPLvt0U2.js";
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
function getWageAt(person, year, month) {
	if (!person) return {};
	const queryDate = `${year}-${String(month).padStart(2, "0")}-28`;
	const history = person.wageHistory || [];
	if (history.length > 0) {
		const sorted = [...history].filter((h) => (h.fromDate || "").trim() !== "").sort((a, b) => a.fromDate.localeCompare(b.fromDate));
		let matched;
		for (const h of sorted) if (h.fromDate <= queryDate) matched = h;
		else break;
		if (matched) return {
			payType: matched.payType,
			dailyWage: matched.dailyWage,
			monthWage: matched.monthWage,
			otRule: matched.otRule,
			mealAllowance: matched.mealAllowance
		};
	}
	return {
		payType: person.payType,
		dailyWage: person.dailyWage,
		monthWage: person.monthWage,
		otRule: person.otRule,
		mealAllowance: person.mealAllowance
	};
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
	const meal = round2(days * (p.mealAllowance || 0));
	const base = monthly ? days > 0 || otHours > 0 || allowance !== 0 || deduction !== 0 ? p.monthWage || 0 : 0 : round2(days * (p.dailyWage || 0));
	return {
		days,
		otHours,
		allowance,
		deduction,
		ot,
		base,
		meal,
		pay: round2(base + ot + meal + allowance - deduction),
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
		const a = Number(m[1]);
		const b = Number(m[2]);
		let y = Number(m[3]);
		if (y < 100) y += y >= 70 ? 1900 : 2e3;
		if (a > 12 && b <= 12) return ymd(y, b, a);
		return ymd(y, a, b);
	}
	m = t.match(/(20\d{2}|19\d{2})\D+(\d{1,2})\D+(\d{1,2})/);
	if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
	return "";
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
function parseDateTime(s, defaultTime) {
	const t = String(s || "").trim();
	if (!t) return null;
	const m = t.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}:\d{2}))?/);
	if (!m) return null;
	const d = /* @__PURE__ */ new Date(`${m[1]}T${m[2] || defaultTime}:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}
function daysBetween(from, to) {
	const a = parseDateTime(from, "00:00");
	const b = parseDateTime(to, "23:59");
	if (!a || !b) return 0;
	const days = (b.getTime() - a.getTime()) / 864e5;
	return Math.max(0, Math.round(days * 100) / 100);
}
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
function validateIdCard(idCard) {
	const s = (idCard || "").trim().toUpperCase();
	if (!s) return "";
	if (s.length < 18) return "";
	if (s.length > 18) return "身份证号应为 18 位";
	if (!/^\d{17}[\dX]$/.test(s)) return "身份证号格式不对：前 17 位数字，末位数字或 X";
	const birth = /* @__PURE__ */ new Date(`${s.slice(6, 10)}-${s.slice(10, 12)}-${s.slice(12, 14)}T00:00:00`);
	if (Number.isNaN(birth.getTime())) return "身份证号中的出生日期无效";
	const w = [
		7,
		9,
		10,
		5,
		8,
		4,
		2,
		1,
		6,
		3,
		7,
		9,
		10,
		5,
		8,
		4,
		2
	];
	const codes = "10X98765432";
	let sum = 0;
	for (let i = 0; i < 17; i++) sum += Number(s[i]) * w[i];
	if (codes[sum % 11] !== s[17]) return "身份证号校验码不对，请核对";
	return "";
}
function overAgeLabel(age, gender) {
	if (age == null) return "";
	return age >= (gender === "女" ? 45 : 55) ? "超龄" : "未超龄";
}
function normalizeIdDate(value, allowLong = false) {
	const t = String(value ?? "").trim();
	if (!t) return "";
	if (allowLong && /长期/.test(t)) return "长期";
	return parseDateYmd(t) || t;
}
const CONTRACT_STATUSES = [
	"在建",
	"完工",
	"总版图",
	"初审",
	"终审",
	"分包结算",
	"结算完成",
	"结算已开票",
	"质保期",
	"退质保金",
	"完成"
];
function normalizeContractStatus(raw) {
	const s = String(raw || "").trim();
	if (CONTRACT_STATUSES.includes(s)) return s;
	if (/退质保/.test(s)) return "退质保金";
	if (/质保/.test(s)) return "质保期";
	if (/结算已开票|已开票/.test(s)) return "结算已开票";
	if (/结算完成/.test(s)) return "结算完成";
	if (/分包结算/.test(s)) return "分包结算";
	if (/总版图/.test(s)) return "总版图";
	if (/终审|审计/.test(s)) return "终审";
	if (/初审/.test(s)) return "初审";
	if (/完工/.test(s)) return "完工";
	if (/完成/.test(s)) return "完成";
	if (/结算/.test(s)) return "分包结算";
	return "在建";
}
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
		remark: "",
		hasPaper: true,
		noContractReason: "",
		scanFileName: ""
	};
}
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
export { monthPay as C, hasWork as S, wageLabel as T, nextYear as _, normalizeEntry as a, encodeOtRule as b, normalizeIdDate as c, validateIdCard as d, confirmRemoveYear as f, monthStatus as g, derivedYears as h, normalizeContractStatus as i, overAgeLabel as l, daysBetween as m, contractRollup as n, splitLegacyReceipts as o, dateYear as p, emptyContract as r, splitTax as s, CONTRACT_STATUSES as t, parseIdCard as u, parseDateYmd as v, parseOtRule as w, getWageAt as x, paymentsInYear as y };
