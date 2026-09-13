import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { C as localToday, f as round2 } from "./contracts-DcuNu2WZ.js";
import { n as DocActions } from "./doc-actions-qNyVRfrs.js";
import { n as Label, t as Input } from "./input-BbLLN7y8.js";
import { t as Badge } from "./badge-CuXWhVV4.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
const PAY_METHODS = [
	"现金",
	"转账",
	"微信",
	"支付宝",
	"对公",
	"其他"
];
function safeBase(s) {
	return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
function needsVoucher(method) {
	return (method || "现金") !== "现金";
}
function amountTag(n) {
	const x = Number(n) || 0;
	return String(Number.isInteger(x) ? x : round2(x));
}
function dateFromPeriod(period, fallback) {
	const p = String(period || "").trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
	const m = p.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
	if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
	return fallback || localToday();
}
function voucherBase(items) {
	if (!items.length) return "报销凭证";
	if (items.length === 1) return `${safeBase(items[0].name)}-${amountTag(items[0].amount)}`;
	let n = items.slice(0, 3).map((e) => `${safeBase(e.name)}-${amountTag(e.amount)}`).join("+");
	if (items.length > 3) n += `等${items.length}笔`;
	return n.slice(0, 80);
}
function payoutBase(items) {
	if (!items.length) return "收报销款-0-0笔";
	return `收报销款-${amountTag(round2(items.reduce((s, e) => s + (e.amount || 0), 0)))}-${items.length}笔`;
}
function formatPayAccount(bank, card) {
	return [bank, card].map((s) => (s || "").trim()).filter(Boolean).join(" ");
}
function applyPayee(row, payees, name) {
	const n = (name || "").trim();
	const hit = (payees || []).find((p) => p.name === n);
	if (!hit) return {
		...row,
		forWhom: name,
		payAccount: formatPayAccount(row.payBank, row.payCardNo)
	};
	return {
		...row,
		forWhom: name,
		payBank: hit.bank || row.payBank || "",
		payCardNo: hit.card || row.payCardNo || "",
		payAccount: formatPayAccount(hit.bank || row.payBank, hit.card || row.payCardNo)
	};
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1",
			children
		})]
	});
}
function NameInput({ value, onChange, names, listId, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
		value: value || "",
		list: listId,
		placeholder,
		onChange: (e) => onChange(e.target.value)
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
		id: listId,
		children: (names || []).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: n }, n))
	})] });
}
function VoucherSlot({ title, hint, id, kind, fileName, optional, extra, onFile, onDeleted }) {
	const ref = import_react.useRef(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-1.5 py-1.5",
		onDragOver: (e) => e.preventDefault(),
		onDrop: (e) => {
			e.preventDefault();
			const f = e.dataTransfer.files?.[0];
			if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-14 shrink-0 text-xs font-medium",
				children: title
			}),
			fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: "ok",
				children: "已传"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: optional ? "选填" : "待传" }),
			extra || null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 truncate text-[11px] text-muted",
				title: fileName || hint,
				children: fileName || hint || "点上传，或把文件拖到这一行"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref,
				type: "file",
				accept: ".pdf,.ofd,.jpg,.jpeg,.png,.webp",
				className: "sr-only",
				onChange: (e) => {
					const f = e.target.files?.[0];
					e.target.value = "";
					if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn inline-flex items-center rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90",
				onClick: () => ref.current?.click(),
				children: fileName ? "更换" : "上传"
			}),
			fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
				id: id || "pending",
				kind,
				fileName,
				onDeleted
			}) : null
		]
	});
}
export { applyPayee as a, needsVoucher as c, VoucherSlot as i, payoutBase as l, NameInput as n, dateFromPeriod as o, PAY_METHODS as r, formatPayAccount as s, Field as t, voucherBase as u };
