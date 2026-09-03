import { V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-BlHKQb24.js";
import "./excel-BRkrzoxa.js";
import "./store-Dl6VldK8.js";
import "./file-pick-BCv2SWUM.js";
import "./dist-DdkhMw2U.js";
import "./button-CvAvwlYd.js";
import "./input-BWJYTTKH.js";
import { n as Need } from "./can-zSnmIuUg.js";
import { c as TplLink, i as FullBookImport, n as ContractImport, o as PaymentImport, r as ExpenseImport, s as PeopleImport, t as AttendanceImport } from "./excel-import-CQmyUK9g.js";
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function ImportPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "import.use",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: "导入"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "先下模板、按模板填好，再上传。年份在文件名里，或自动按当前年份。要导出请到「导出」页。"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "分模块导入"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "人员、考勤、发放、报销、合同都可以单独导入，导入时可选择「增加」或「替换」。"
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
		})
	});
}
export { ImportPage as component };
