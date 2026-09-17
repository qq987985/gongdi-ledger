function hasWork(a) {
	if (!a) return false;
	return (a.days || 0) > 0 || (a.otHours || 0) > 0 || (a.allowance || 0) !== 0 || (a.deduction || 0) !== 0;
}
function hasContent(a) {
	if (!a) return false;
	return hasWork(a) || Boolean(String(a.remark ?? "").trim());
}
function ymKey(y, m) {
	return y * 12 + m;
}
function isValidYear(y) {
	return typeof y === "number" && Number.isInteger(y) && y >= 2e3 && y <= 2100;
}
function daysInMonth(y, m) {
	if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return 0;
	return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function ymd(y, m, d) {
	if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return "";
	if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return "";
	if (d > daysInMonth(y, m)) return "";
	return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function localToday() {
	const d = /* @__PURE__ */ new Date();
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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
	const filled = rows.filter((r) => hasContent(r));
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
	if (!ymd(Number(m[1].slice(0, 4)), Number(m[1].slice(5, 7)), Number(m[1].slice(8, 10)))) return null;
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
const OT_RULE_UNSET_LABEL = "未设加班规则";
function parseOtRule(rule) {
	const s = (rule || "").trim();
	if (!s) return {
		kind: "none",
		param: 0,
		label: OT_RULE_UNSET_LABEL
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
function padFromDate(v) {
	const m = (v || "").trim().match(/^(\d{4})[-/.年](\d{1,2})[-/.月]?(\d{1,2})日?$/);
	if (!m) return (v || "").trim();
	const y = Number(m[1]);
	const mo = Number(m[2]);
	const d = Number(m[3]);
	const inMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
	if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > inMonth) return "";
	return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function getWageAt(person, year, month) {
	if (!person) return {};
	const lastDay = new Date(year, month, 0).getDate();
	const queryDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
	const history = person.wageHistory || [];
	if (history.length > 0) {
		const sorted = [...history].map((h) => ({
			h,
			from: padFromDate(h.fromDate)
		})).filter((x) => x.from !== "").sort((a, b) => a.from.localeCompare(b.from));
		let matched;
		for (const { h, from } of sorted) if (from <= queryDate) matched = h;
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
function round2(n) {
	if (!Number.isFinite(n)) return 0;
	const sign = n < 0 ? -1 : 1;
	const cents = Math.round(Math.abs(n) * 100 + 1e-6);
	if (cents === 0) return 0;
	return sign * cents / 100;
}
export { ymKey as _, round2 as a, dateYear as c, isValidYear as d, localToday as f, paymentsInYear as g, parseDateYmd as h, parseOtRule as i, daysBetween as l, nextYear as m, getWageAt as n, wageLabel as o, monthStatus as p, monthPay as r, confirmRemoveYear as s, encodeOtRule as t, derivedYears as u, hasContent as v };
