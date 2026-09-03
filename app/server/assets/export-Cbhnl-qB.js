import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-BlHKQb24.js";
import { h as derivedYears } from "./contracts-Bm8eyOQk.js";
import { t as useApp } from "./store-Dl6VldK8.js";
import { n as Need } from "./can-zSnmIuUg.js";
import { t as YmPick } from "./ym-pick-Djpt4Mx-.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
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
var EXPORT_ITEMS = [
	{
		kind: "ledger-export",
		title: "总台账",
		desc: "人员、各月考勤、发放、报销合在一本。"
	},
	{
		kind: "attendance-export",
		title: "考勤表",
		desc: "按月列出出勤、加班、补助、扣款、餐补。"
	},
	{
		kind: "payment-export",
		title: "发放记录",
		desc: "实际收款人、金额、日期、发放方、收款人。"
	},
	{
		kind: "expense-export",
		title: "报销单",
		desc: "项目、金额、支付方式、报销人、打款账户。"
	},
	{
		kind: "contract-export",
		title: "合同表",
		desc: "报量、开票、收款，含应收应付明细。"
	},
	{
		kind: "people-export",
		title: "人员名单",
		desc: "不按年份筛，全部人员信息。"
	}
];
function ExportPage() {
	const store = useApp();
	const years = derivedYears(store);
	const now = /* @__PURE__ */ new Date();
	const [scope, setScope] = import_react.useState("year");
	const [year, setYear] = import_react.useState(store.year);
	const [fromY, setFromY] = import_react.useState(store.year);
	const [fromM, setFromM] = import_react.useState(1);
	const [toY, setToY] = import_react.useState(store.year);
	const [toM, setToM] = import_react.useState(store.year === now.getFullYear() ? now.getMonth() + 1 : 12);
	const yearList = years.includes(year) ? years : [...years, year].sort((a, b) => a - b);
	const rangeText = scope === "all" ? "全部年份" : scope === "year" ? `${year}年` : fromY === toY && fromM === toM ? `${fromY}年${fromM}月` : `${fromY}年${fromM}月至${toY}年${toM}月`;
	const href = (kind) => exportHref(kind, scope, year, fromY, fromM, toY, toM);
	const outline = "btn inline-flex cursor-pointer items-center rounded-sm border border-line bg-surface text-xs hover:bg-accent-soft";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "export.use",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: "导出"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "按台账里实际有的字段全部写出。先选范围，再点下面的项导出。"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "导出范围"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "先选全部年份、某一年或起止月份，下面每一项都按这个范围导出。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								["all", "全部年份"],
								["year", "按年"],
								["range", "按区间"]
							].map(([k, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setScope(k),
								className: `h-11 rounded-full border px-3 text-sm ${scope === k ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted"}`,
								children: label
							}, k))
						}),
						scope === "year" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field-select",
								value: year,
								onChange: (e) => setYear(Number(e.target.value)),
								children: yearList.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: y,
									children: [y, " 年"]
								}, y))
							})
						}) : scope === "range" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap items-end gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YmPick, {
									label: "从",
									years: yearList,
									y: fromY,
									m: fromM,
									onY: setFromY,
									onM: setFromM
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pb-2 text-sm text-muted",
									children: "到"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YmPick, {
									label: "到",
									years: yearList,
									y: toY,
									m: toM,
									onY: setToY,
									onM: setToM
								})
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: ["导出范围：", rangeText]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "导出内容"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "按台账里实际有的字段全部写出。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid gap-4 md:grid-cols-2",
							children: EXPORT_ITEMS.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-line bg-surface p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold",
										children: it.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted",
										children: it.desc
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3 flex flex-wrap gap-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											className: outline,
											href: href(it.kind),
											children: "导出"
										})
									})
								]
							}, it.kind))
						})
					]
				})
			]
		})
	});
}
export { ExportPage as component };
