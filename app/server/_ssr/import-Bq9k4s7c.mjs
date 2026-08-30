import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as derivedYears, y as useApp } from "./router-DxdzlCp3.mjs";
import { a as PeopleImport, i as PaymentImport, n as ContractImport, o as TplLink, r as FullBookImport, t as AttendanceImport, e as ExpenseImport } from "./excel-import-BfyfwtjF.mjs";
import { t as Can } from "./can-gkGWV5bu.mjs";
import { t as YmPick } from "./ym-pick-CSdNMXnF.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var outline = "btn inline-flex items-center rounded-sm border border-line-strong bg-surface text-xs hover:bg-accent-soft";
var primary = "btn inline-flex items-center rounded-sm bg-accent text-xs text-accent-fg hover:opacity-90";
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
	const now = /* @__PURE__ */ new Date();
	const [scope, setScope] = (0, import_react.useState)("year");
	const [year, setYear] = (0, import_react.useState)(store.year);
	const [fromY, setFromY] = (0, import_react.useState)(store.year);
	const [fromM, setFromM] = (0, import_react.useState)(1);
	const [toY, setToY] = (0, import_react.useState)(store.year);
	const [toM, setToM] = (0, import_react.useState)(store.year === now.getFullYear() ? now.getMonth() + 1 : 12);
	const yearList = years.includes(year) ? years : [...years, year].sort((a, b) => a - b);
	const rangeText = scope === "all" ? "全部年份" : scope === "year" ? `${year}年` : fromY === toY && fromM === toM ? `${fromY}年${fromM}月` : `${fromY}年${fromM}月至${toY}年${toM}月`;
	const href = (kind) => exportHref(kind, scope, year, fromY, fromM, toY, toM);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: "导入导出"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "人员、考勤、发放、报销、合同都能从这里进出。导出按台账里实际有的字段全部写出。"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
				perm: "export.use",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "font-semibold", children: "导出" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "先选全部年份、某一年或起止月份，再点要导出的项。总台账含人员、各月考勤、发放、报销。合同单独一份。人员名单不按年份筛。"
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
						scope === "year" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-xs text-muted", children: "年份" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "field-select w-auto",
									value: year,
									onChange: (e) => setYear(Number(e.target.value)),
									"aria-label": "导出年份",
									children: yearList.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: y,
										children: [y, "年"]
									}, y))
								})
							]
						}) : null,
						scope === "range" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap items-center gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YmPick, {
									label: "起始",
									years,
									y: fromY,
									m: fromM,
									onY: setFromY,
									onM: setFromM
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YmPick, {
									label: "结束",
									years,
									y: toY,
									m: toM,
									onY: setToY,
									onM: setToM
								})
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: ["将导出：", rangeText]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: primary, href: href("export"), children: "导出总台账" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: "/api/file/people-export", children: "导出人员名单" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: href("attendance-export"), children: "导出考勤" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: href("payment-export"), children: "导出发放" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: href("expense-export"), children: "导出报销" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: href("contract-export"), children: "导出合同" })
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
				perm: "import.use",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "font-semibold", children: "分项导入" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "先下载模板填好再导入。人员重复会让你选跳过或覆盖。发放、报销是追加。"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid gap-4 md:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-line bg-surface p-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "人员" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "姓名、班组、身份证、银行卡、民族、籍贯、居住地等全部字段。" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/people-template", filename: "人员导入模板.xlsx" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleImport, {})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-line bg-surface p-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "考勤" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "出勤天数、加班、补助、扣款。导入时选择写入哪年哪月。" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, { href: `/api/file/attendance-template?year=${store.year}`, filename: `${store.year}年考勤导入模板.xlsx` }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceImport, {})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-line bg-surface p-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "发放" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "实际收款人、收款人、日期、金额、发放方、备注。日期可空=待发放。" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/payment-template", filename: "发放记录导入模板.xlsx" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentImport, {})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-line bg-surface p-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "报销" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "项目、金额、支付方式、报销人、收款人、开户行、打款账户。" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/expense-template", filename: "报销单导入模板.xlsx" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseImport, {})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-line bg-surface p-5 md:col-span-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: "font-semibold", children: "合同" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "mt-1 text-sm text-muted", children: "项目名称、金额、进度、报量 / 开票 / 收款。按年+名称+编号去重。" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, { href: "/api/file/contract-template", filename: "合同导入模板.xlsx" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractImport, {})
												]
											})
										]
									})
								]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-dashed border-line-strong bg-bg-elevated p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "font-semibold", children: "导入整本台账" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: "一次写入人员、各月考勤、发放、报销。合同仍用上面单独导入。"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullBookImport, {})
								})
							]
						})
					]
				})
			})
		]
	});
}
export { ImportPage as component };
