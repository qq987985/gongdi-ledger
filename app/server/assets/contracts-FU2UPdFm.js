import { s as uid } from "./utils-DqsA5Dz5.js";
import { a as round2, h as parseDateYmd } from "./wage-BVBIWt51.js";
function parseNum(v) {
	if (typeof v === "number") return Number.isFinite(v) ? v === 0 ? 0 : v : null;
	if (v == null) return null;
	let s = String(v).trim();
	if (!s) return null;
	s = s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 65248));
	let neg = false;
	const paren = s.match(/^\((.*)\)$/);
	if (paren) {
		neg = true;
		s = paren[1];
	}
	s = s.replace(/[,\s]/g, "").replace(/[¥￥$]/g, "").replace(/(元|天|个|次|人|月|年|日|项|台|套|小时|时|%|％)$/, "");
	if (!s) return null;
	const n = Number(s);
	if (!Number.isFinite(n)) return null;
	const r = neg ? -n : n;
	return r === 0 ? 0 : r;
}
function numOr(v, d = 0) {
	return parseNum(v) ?? d;
}
function numOrWarn(v, d, what) {
	const n = parseNum(v);
	if (n !== null) return n;
	if (!(v == null || typeof v === "string" && v.trim() === "")) console.warn(`[数值] ${what} 读不出数字，按 ${d} 处理：`, v);
	return d;
}
function parseNumber(v) {
	return numOr(v, 0);
}
function nameKey(v) {
	return String(v ?? "").trim();
}
function receiverOf(p) {
	return nameKey(p.receiver) || nameKey(p.owner);
}
function ownerKey(p) {
	return nameKey(p.owner);
}
function isProxyReceiver(p) {
	return receiverOf(p) !== ownerKey(p);
}
function parseIdCard(idCard) {
	const s = (idCard || "").trim().toUpperCase();
	if (s.length !== 15 && s.length !== 18) return {
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
		const yIn = Number(s.length === 18 ? s.slice(6, 10) : "19" + s.slice(6, 8));
		const mIn = Number(s.slice(s.length === 18 ? 10 : 8, s.length === 18 ? 12 : 10));
		const dIn = Number(s.slice(s.length === 18 ? 12 : 10, s.length === 18 ? 14 : 12));
		if (birth.getFullYear() !== yIn || birth.getMonth() + 1 !== mIn || birth.getDate() !== dIn) return {
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
	if (/^\d{15}$/.test(s)) {
		const yy = Number(s.slice(6, 8));
		const year = yy >= 70 ? 1900 + yy : 2e3 + yy;
		const birth$1 = /* @__PURE__ */ new Date(`${year}-${s.slice(8, 10)}-${s.slice(10, 12)}T00:00:00`);
		if (Number.isNaN(birth$1.getTime())) return "身份证号中的出生日期无效";
		if (birth$1.getMonth() + 1 !== Number(s.slice(8, 10)) || birth$1.getDate() !== Number(s.slice(10, 12))) return "身份证号中的出生日期无效";
		return "";
	}
	if (s.length < 18) return `身份证号应为 15 位或 18 位（现在是 ${s.length} 位）`;
	if (s.length > 18) return "身份证号应为 18 位";
	if (!/^\d{17}[\dX]$/.test(s)) return "身份证号格式不对：前 17 位数字，末位数字或 X";
	const birth = /* @__PURE__ */ new Date(`${s.slice(6, 10)}-${s.slice(10, 12)}-${s.slice(12, 14)}T00:00:00`);
	if (Number.isNaN(birth.getTime())) return "身份证号中的出生日期无效";
	if (birth.getMonth() + 1 !== Number(s.slice(10, 12)) || birth.getDate() !== Number(s.slice(12, 14))) return "身份证号中的出生日期无效";
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
	const amount = round2(numOrWarn(e.amount, 0, "合同明细.金额"));
	const taxRate = numOrWarn(e.taxRate, 0, "合同明细.税率");
	let amountExcl = numOrWarn(e.amountExcl, 0, "合同明细.不含税金额");
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
		workerPay: numOrWarn(e.workerPay, 0, "合同明细.代付金额"),
		workerPayDate: e.workerPayDate || "",
		payTo,
		no: e.no || "",
		remark: e.remark || "",
		fileName: e.fileName || "",
		workerFileName: e.workerFileName || ""
	};
}
function contractEntryChanges(before, after) {
	const labels = [
		["date", "日期"],
		["amount", "金额"],
		["amountExcl", "不含税"],
		["taxRate", "税率"],
		["payTo", "收款去向"],
		["no", "单号"],
		["remark", "备注"],
		["fileName", "影像文件"]
	];
	const show = (k, v) => {
		if (k === "payTo") return v === "worker" ? "代付农民工" : v === "sub" ? "到分包" : "";
		if (v === void 0 || v === null || v === "") return "";
		return String(v);
	};
	const out = [];
	for (const [k, label] of labels) {
		const a = show(k, before?.[k]);
		const b = show(k, after?.[k]);
		if (a !== b) out.push(`${label}：${a || "（空）"} → ${b || "（空）"}`);
	}
	return out;
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
		const w = numOrWarn(raw.workerPay, 0, "收款.代付金额");
		const sub = round2(numOrWarn(raw.amount, 0, "收款.金额") - w);
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
export { numOr as _, normalizeContractStatus as a, parseNumber as b, splitTax as c, parseIdCard as d, validateIdCard as f, receiverOf as g, ownerKey as h, emptyContract as i, normalizeIdDate as l, nameKey as m, contractEntryChanges as n, normalizeEntry as o, isProxyReceiver as p, contractRollup as r, splitLegacyReceipts as s, CONTRACT_STATUSES as t, overAgeLabel as u, numOrWarn as v, parseNum as y };
