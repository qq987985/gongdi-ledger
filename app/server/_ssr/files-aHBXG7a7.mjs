import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Input, y as useApp } from "./router-DxdzlCp3.mjs";
import { a as receiptSubBase, i as invoiceBase, l as reportBase, n as DocActions, o as receiptWorkerBase, r as attendanceBase, t as DOC_KIND_LABEL } from "./doc-actions-CoPSki7O.mjs";
import { n as Need } from "./can-gkGWV5bu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/files-aHBXG7a7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FilesPage() {
	const { year, attendanceDocs, contracts, contractEntries, patchAttendanceDoc, removeAttendanceDocs, patchContractEntry, upsertContract } = useApp();
	const [kind, setKind] = (0, import_react.useState)("all");
	const [scope, setScope] = (0, import_react.useState)("year");
	const [q, setQ] = (0, import_react.useState)("");
	const taken = [...(attendanceDocs || []).map((d) => d.fileName), ...(contractEntries || []).map((e) => e.fileName), ...(contracts || []).map((c) => c.scanFileName)].filter(Boolean);
	const filtered = (0, import_react.useMemo)(() => {
		const out = [];
		for (const d of attendanceDocs || []) {
			if (scope === "year" && d.year !== year) continue;
			out.push({
				id: d.id,
				kind: "attendance",
				fileName: d.fileName,
				belong: `${d.year}年${d.month}月考勤`,
				extra: d.remark,
				suggest: attendanceBase(d.year, d.month),
				source: "attendance"
			});
		}
		const cmap = Object.fromEntries(contracts.map((c) => [c.id, c]));
		for (const e of contractEntries || []) {
			if (e.kind !== "report" && e.kind !== "invoice" && e.kind !== "receipt") continue;
			const c = cmap[e.contractId];
			if (scope === "year" && c && c.year !== year) continue;
			if (!e.fileName && scope === "year") {}
			if (!e.fileName) continue;
			const name = c?.name || "未命名";
			const suggest = e.kind === "invoice" ? invoiceBase(name, e.date, e.amount) : e.kind === "report" ? reportBase(name, e.date, e.amount) : e.payTo === "worker" ? receiptWorkerBase(name, e.date) : receiptSubBase(name, e.date);
			out.push({
				id: e.id,
				kind: e.kind,
				fileName: e.fileName,
				belong: c ? `${c.year} ${c.name}` : "合同",
				extra: [
					e.date,
					e.payTo === "worker" ? "代付农民工" : e.kind === "receipt" ? "到分包" : "",
					e.no,
					e.remark
				].filter(Boolean).join(" · "),
				suggest,
				source: "contract"
			});
		}
		for (const c of contracts || []) {
			if (!c.scanFileName) continue;
			if (scope === "year" && c.year !== year) continue;
			out.push({
				id: c.id,
				kind: "contract",
				fileName: c.scanFileName,
				belong: `${c.year} ${c.name}`,
				extra: c.hasPaper === false ? c.noContractReason || "无合同" : "合同扫描件",
				suggest: `${(c.name || "未命名").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "") || "未命名"}-合同扫描件`,
				source: "scan"
			});
		}
		return out;
	}, [
		attendanceDocs,
		contractEntries,
		contracts,
		year,
		scope
	]).filter((r) => {
		if (kind !== "all" && r.kind !== kind) return false;
		if (!q.trim()) return true;
		const s = q.trim();
		return [
			r.fileName,
			r.belong,
			r.extra,
			DOC_KIND_LABEL[r.kind]
		].some((x) => x.includes(s));
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "files.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: "影像资料"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "文件在 NAS 的 /vol1/1000/docker/attendance/data/photos 下：报量单、发票、收款回单、考勤影像、合同扫描件。可查看、下载、复制、替换、删除。"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: "类型"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field-select mt-1 w-auto",
								value: kind,
								onChange: (e) => setKind(e.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "all",
										children: "全部"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "attendance",
										children: "考勤影像"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "report",
										children: "报量单"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "invoice",
										children: "电子发票"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "receipt",
										children: "收款回单"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "contract",
										children: "合同扫描件"
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: "年份"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field-select mt-1 w-auto",
								value: scope,
								onChange: (e) => setScope(e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: "year",
									children: [year, "年"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "全部年份"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "min-w-48 flex-1 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: "搜索"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								value: q,
								onChange: (e) => setQ(e.target.value),
								placeholder: "文件名 / 项目 / 月份"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"共 ",
						filtered.length,
						" 份"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-xl border border-line bg-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[48rem] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "border-b border-line text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "类型"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "归属"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "文件"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "说明"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "操作"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 5,
							className: "p-6 text-muted",
							children: "还没有影像资料。到月度考勤、合同流水或合同扫描件里上传。"
						}) }) : null, filtered.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: DOC_KIND_LABEL[r.kind]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: r.belong
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 font-medium",
									children: r.fileName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-muted",
									children: r.extra || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
										id: r.id,
										kind: r.kind,
										fileName: r.fileName,
										suggest: r.suggest,
										taken,
										onReplaced: (name) => {
											if (r.source === "attendance") patchAttendanceDoc(r.id, { fileName: name });
											else if (r.source === "scan") {
												const c = contracts.find((x) => x.id === r.id);
												if (c) upsertContract({
													...c,
													scanFileName: name
												});
											} else patchContractEntry(r.id, { fileName: name });
										},
										onDeleted: () => {
											if (r.source === "attendance") removeAttendanceDocs([r.id]);
											else if (r.source === "scan") {
												const c = contracts.find((x) => x.id === r.id);
												if (c) upsertContract({
													...c,
													scanFileName: ""
												});
											} else patchContractEntry(r.id, { fileName: "" });
										}
									})
								})
							]
						}, `${r.kind}-${r.id}`))] })]
					})
				})
			]
		})
	});
}
//#endregion
export { FilesPage as component };
