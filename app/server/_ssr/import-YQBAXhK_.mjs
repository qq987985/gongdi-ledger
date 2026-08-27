import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as useApp } from "./router-BQbQbUY2.mjs";
import { r as FullBookImport } from "./excel-import-Dd7xGBNE.mjs";
import { t as Can } from "./can-gkGWV5bu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/import-YQBAXhK_.js
var import_jsx_runtime = require_jsx_runtime();
function ImportPage() {
	const store = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: "导入导出"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "这里只做整本。人员、考勤、发放、合同各自页面里有单独导入。"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
				perm: "export.use",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "导出整本"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "考勤表含人员、12 个月、发放。合同是独立一本明细。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									className: "inline-flex h-10 items-center rounded-sm bg-accent px-4 text-sm text-accent-fg hover:opacity-90",
									href: `/api/file/export?year=${store.year}`,
									children: [
										"导出 ",
										store.year,
										" 年考勤表"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									className: "inline-flex h-10 items-center rounded-sm border border-line-strong bg-surface px-4 text-sm hover:bg-accent-soft",
									href: `/api/file/contract-export?year=${store.year}`,
									children: [
										"导出 ",
										store.year,
										" 年合同明细"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: "inline-flex h-10 items-center rounded-sm border border-line-strong bg-surface px-4 text-sm hover:bg-accent-soft",
									href: "/api/file/contract-export",
									children: "导出全部年份合同"
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
				perm: "import.use",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-dashed border-line-strong bg-bg-elevated p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "导入整本考勤表"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "原来的「考勤表.xlsx」：人员、各月考勤、发放一次写入。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullBookImport, {})
						})
					]
				})
			})
		]
	});
}
//#endregion
export { ImportPage as component };
