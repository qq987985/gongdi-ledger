import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-CYLuVN7r.js";
import { m as derivedYears } from "./contracts-Ddv2VxfU.js";
import "./excel-CEulLVmE.js";
import { t as useApp } from "./store-U11L9wsl.js";
import "./file-pick-sYj_heGl.js";
import "./dist-DfB6JCQe.js";
import "./button-3Oociu2t.js";
import "./input-D7JnnlZc.js";
import { t as Can } from "./can-qr6UNuZ3.js";
import { a as PaymentImport, i as FullBookImport, n as ContractImport, o as PeopleImport, r as ExpenseImport, s as TplLink, t as AttendanceImport } from "./excel-import-DMikwNo7.js";
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
function ImportPage() {
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
	const outline = "btn inline-flex items-center rounded-sm border border-line-strong bg-surface text-xs hover:bg-accent-soft";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl font-semibold",
			children: "导入导出"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "人员、考勤、发放、报销、合同都能从这里进出。导出按台账里实际有的字段全部写出。"
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Can, {
			perm: "export.use",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "导出"
						}),
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
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: outline,
									href: href("ledger-export"),
									children: "导出总台账"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: outline,
									href: href("attendance-export"),
									children: "导出考勤表"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: outline,
									href: href("payment-export"),
									children: "导出发放记录"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: outline,
									href: href("expense-export"),
									children: "导出一键报销"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: outline,
									href: href("contract-export"),
									children: "导出合同表"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: outline,
									href: href("people-export"),
									children: "导出人员名单"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "导入"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "先下模板、按模板填好，再上传。年份在文件名里，或自动按当前年份。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid gap-4 md:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-line bg-surface p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold",
											children: "人员"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: "姓名、班组、身份证、工资、加班等。按姓名去重。"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
												href: "/api/file/people-template",
												filename: "人员导入模板.xlsx"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleImport, {})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-line bg-surface p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold",
											children: "考勤"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: "月份、姓名、工天、加班、补助、扣款。"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
												href: "/api/file/attendance-template",
												filename: "考勤导入模板.xlsx"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceImport, {})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-line bg-surface p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold",
											children: "发放"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: "实际收款人、金额、日期、发放方、收款人。"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
												href: "/api/file/payment-template",
												filename: "发放记录导入模板.xlsx"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentImport, {})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-line bg-surface p-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold",
											children: "报销"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: "项目、金额、支付方式、报销人、收款人、开户行、打款账户。"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
												href: "/api/file/expense-template",
												filename: "报销单导入模板.xlsx"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseImport, {})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-line bg-surface p-5 md:col-span-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold",
											children: "合同"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: "项目名称、金额、进度、报量 / 开票 / 收款。按年+名称+编号去重。"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
												href: "/api/file/contract-template",
												filename: "合同导入模板.xlsx"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractImport, {})]
										})
									]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-dashed border-line-strong bg-bg-elevated p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "导入整本台账"
						}),
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
		})]
	});
}
export { ImportPage as component };
