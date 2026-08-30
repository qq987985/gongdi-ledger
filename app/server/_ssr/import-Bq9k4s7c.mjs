import { z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { y as useApp } from "./router-DxdzlCp3.mjs";
import { a as PeopleImport, i as PaymentImport, n as ContractImport, o as TplLink, r as FullBookImport, t as AttendanceImport, e as ExpenseImport } from "./excel-import-BfyfwtjF.mjs";
import { t as Can } from "./can-gkGWV5bu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/import-Bq9k4s7c.js
var import_jsx_runtime = require_jsx_runtime();
var outline = "btn inline-flex items-center rounded-sm border border-line-strong bg-surface text-xs hover:bg-accent-soft";
var primary = "btn inline-flex items-center rounded-sm bg-accent text-xs text-accent-fg hover:opacity-90";
function ImportPage() {
	const store = useApp();
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
							children: "年台账含人员全部字段、12 个月考勤、全部发放、全部报销。也可只导出某一类。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									className: primary,
									href: `/api/file/export?year=${store.year}`,
									children: ["导出 ", store.year, " 年台账"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: "/api/file/people-export", children: "导出人员名单" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: "/api/file/payment-export", children: "导出全部发放" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: "/api/file/expense-export", children: "导出全部报销" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									className: outline,
									href: `/api/file/contract-export?year=${store.year}`,
									children: ["导出 ", store.year, " 年合同"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: outline, href: "/api/file/contract-export", children: "导出全部年份合同" })
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
//#endregion
export { ImportPage as component };
