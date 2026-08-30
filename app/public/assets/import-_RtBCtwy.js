import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";
import{r as t}from"./audit-K39-jiKA.js";
import{t as n}from"./jsx-runtime-DREnUpxT.js";
import{y as useApp}from"./index-ghxum7yZ.js";
import{a as PeopleImport,i as PaymentImport,n as ContractImport,o as TplLink,r as FullBookImport,t as AttendanceImport,e as ExpenseImport}from"./excel-import-CV73N9jL.js";
import{t as Can}from"./can-9AzYldNF.js";
import{t as YmPick}from"./ym-pick-DyiGGoH2.js";
import{l as derivedYears}from"./contracts-D6qZj01d.js";
var import_react=e(t());
var import_jsx_runtime=n();
var outline=`btn inline-flex items-center rounded-sm border border-line-strong bg-surface text-xs hover:bg-accent-soft`;
var primary=`btn inline-flex items-center rounded-sm bg-accent text-xs text-accent-fg hover:opacity-90`;
function exportHref(kind, scope, year, fromY, fromM, toY, toM) {
	const p = new URLSearchParams();
	p.set("scope", scope);
	if (scope === "year") p.set("year", String(year));
	if (scope === "range") {
		p.set("fromY", String(fromY));
		p.set("fromM", String(fromM));
		p.set("toY", String(toY));
		p.set("toM", String(toM));
	}
	const q = p.toString();
	return `/api/file/${kind}${q ? `?${q}` : ""}`;
}
function ImportPage() {
	const store = useApp();
	const years = derivedYears(store);
	const now = new Date();
	const [scope, setScope] = (0, import_react.useState)("year");
	const [year, setYear] = (0, import_react.useState)(store.year);
	const [fromY, setFromY] = (0, import_react.useState)(store.year);
	const [fromM, setFromM] = (0, import_react.useState)(1);
	const [toY, setToY] = (0, import_react.useState)(store.year);
	const [toM, setToM] = (0, import_react.useState)(store.year === now.getFullYear() ? now.getMonth() + 1 : 12);
	const yearList = years.includes(year) ? years : [...years, year].sort((a, b) => a - b);
	const rangeText = scope === "all" ? "全部年份" : scope === "year" ? `${year}年` : fromY === toY && fromM === toM ? `${fromY}年${fromM}月` : `${fromY}年${fromM}月至${toY}年${toM}月`;
	const href = (kind) => exportHref(kind, scope, year, fromY, fromM, toY, toM);
	return (0, import_jsx_runtime.jsxs)("div", { className: "space-y-5", children: [
		(0, import_jsx_runtime.jsxs)("header", { children: [
			(0, import_jsx_runtime.jsx)("h1", { className: "font-display text-2xl font-semibold", children: "导入导出" }),
			(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "人员、考勤、发放、报销、合同都能从这里进出。导出按台账里实际有的字段全部写出。" })
		] }),
		(0, import_jsx_runtime.jsx)(Can, { perm: "export.use", children: (0, import_jsx_runtime.jsxs)("section", { className: "rounded-xl border border-line bg-surface p-5", children: [
			(0, import_jsx_runtime.jsx)("h2", { className: "font-semibold", children: "导出" }),
			(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "先选全部年份、某一年或起止月份，再点要导出的项。总台账含人员、各月考勤、发放、报销。合同单独一份。人员名单不按年份筛。" }),
			(0, import_jsx_runtime.jsx)("div", { className: "mt-3 flex flex-wrap gap-2", children: [
				["all", "全部年份"],
				["year", "按年"],
				["range", "按区间"]
			].map(([k, label]) => (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setScope(k),
				className: `h-11 rounded-full border px-3 text-sm ${scope === k ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted"}`,
				children: label
			}, k)) }),
			scope === "year" ? (0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
				(0, import_jsx_runtime.jsx)("span", { className: "text-xs text-muted", children: "年份" }),
				(0, import_jsx_runtime.jsx)("select", {
					className: "field-select w-auto",
					value: year,
					onChange: (e) => setYear(Number(e.target.value)),
					"aria-label": "导出年份",
					children: yearList.map((y) => (0, import_jsx_runtime.jsxs)("option", { value: y, children: [y, "年"] }, y))
				})
			] }) : null,
			scope === "range" ? (0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap items-center gap-4", children: [
				(0, import_jsx_runtime.jsx)(YmPick, { label: "起始", years, y: fromY, m: fromM, onY: setFromY, onM: setFromM }),
				(0, import_jsx_runtime.jsx)(YmPick, { label: "结束", years, y: toY, m: toM, onY: setToY, onM: setToM })
			] }) : null,
			(0, import_jsx_runtime.jsxs)("p", { className: "mt-3 text-sm text-muted", children: ["将导出：", rangeText] }),
			(0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap gap-2", children: [
				(0, import_jsx_runtime.jsx)("a", { className: primary, href: href("export"), children: "导出总台账" }),
				(0, import_jsx_runtime.jsx)("a", { className: outline, href: "/api/file/people-export", children: "导出人员名单" }),
				(0, import_jsx_runtime.jsx)("a", { className: outline, href: href("attendance-export"), children: "导出考勤" }),
				(0, import_jsx_runtime.jsx)("a", { className: outline, href: href("payment-export"), children: "导出发放" }),
				(0, import_jsx_runtime.jsx)("a", { className: outline, href: href("expense-export"), children: "导出报销" }),
				(0, import_jsx_runtime.jsx)("a", { className: outline, href: href("contract-export"), children: "导出合同" })
			] })
		] }) }),
		(0, import_jsx_runtime.jsx)(Can, { perm: "import.use", children: (0, import_jsx_runtime.jsxs)("div", { className: "space-y-5", children: [
			(0, import_jsx_runtime.jsxs)("section", { children: [
				(0, import_jsx_runtime.jsx)("h2", { className: "font-semibold", children: "分项导入" }),
				(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "先下载模板填好再导入。人员重复会让你选跳过或覆盖。发放、报销是追加。" }),
				(0, import_jsx_runtime.jsxs)("div", { className: "mt-3 grid gap-4 md:grid-cols-2", children: [
					(0, import_jsx_runtime.jsxs)("div", { className: "rounded-xl border border-line bg-surface p-5", children: [
						(0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "人员" }),
						(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "姓名、班组、身份证、银行卡、民族、籍贯、居住地等全部字段。" }),
						(0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap gap-2", children: [
							(0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/people-template", filename: "人员导入模板.xlsx" }),
							(0, import_jsx_runtime.jsx)(PeopleImport, {})
						] })
					] }),
					(0, import_jsx_runtime.jsxs)("div", { className: "rounded-xl border border-line bg-surface p-5", children: [
						(0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "考勤" }),
						(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "出勤天数、加班、补助、扣款。导入时选择写入哪年哪月。" }),
						(0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap gap-2", children: [
							(0, import_jsx_runtime.jsx)(TplLink, { href: `/api/file/attendance-template?year=${store.year}`, filename: `${store.year}年考勤导入模板.xlsx` }),
							(0, import_jsx_runtime.jsx)(AttendanceImport, {})
						] })
					] }),
					(0, import_jsx_runtime.jsxs)("div", { className: "rounded-xl border border-line bg-surface p-5", children: [
						(0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "发放" }),
						(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "实际收款人、收款人、日期、金额、发放方、备注。日期可空=待发放。" }),
						(0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap gap-2", children: [
							(0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/payment-template", filename: "发放记录导入模板.xlsx" }),
							(0, import_jsx_runtime.jsx)(PaymentImport, {})
						] })
					] }),
					(0, import_jsx_runtime.jsxs)("div", { className: "rounded-xl border border-line bg-surface p-5", children: [
						(0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "报销" }),
						(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "项目、金额、支付方式、报销人、收款人、开户行、打款账户。" }),
						(0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap gap-2", children: [
							(0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/expense-template", filename: "报销单导入模板.xlsx" }),
							(0, import_jsx_runtime.jsx)(ExpenseImport, {})
						] })
					] }),
					(0, import_jsx_runtime.jsxs)("div", { className: "rounded-xl border border-line bg-surface p-5 md:col-span-2", children: [
						(0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "合同" }),
						(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "项目名称、金额、进度、报量 / 开票 / 收款。按年+名称+编号去重。" }),
						(0, import_jsx_runtime.jsxs)("div", { className: "mt-3 flex flex-wrap gap-2", children: [
							(0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/contract-template", filename: "合同导入模板.xlsx" }),
							(0, import_jsx_runtime.jsx)(ContractImport, {})
						] })
					] })
				] })
			] }),
			(0, import_jsx_runtime.jsxs)("section", { className: "rounded-xl border border-dashed border-line-strong bg-bg-elevated p-5", children: [
				(0, import_jsx_runtime.jsx)("h2", { className: "font-semibold", children: "导入整本台账" }),
				(0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "一次写入人员、各月考勤、发放、报销。合同仍用上面单独导入。" }),
				(0, import_jsx_runtime.jsx)("div", { className: "mt-3", children: (0, import_jsx_runtime.jsx)(FullBookImport, {}) })
			] })
		] }) })
	] });
}
export{ImportPage as component};
