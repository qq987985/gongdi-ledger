import "./perms-DQTE-mZW.js";
import "./utils-CBhPqRT8.js";
import "./contracts-BSLoZOKY.js";
import "./excel-D3rRBCuB.js";
import { t as useApp } from "./store-CJN683BW.js";
import "./nas-sync-Y5Puwv5e.js";
import { t as Input } from "./input-D73Q2_mj.js";
import { n as Need } from "./can-BfltFJNf.js";
import { i as invoiceBase, l as reportBase, n as DocActions, o as receiptSubBase, r as attendanceBase, s as receiptWorkerBase, t as DOC_KIND_LABEL } from "./doc-actions-CSEe6Rec.js";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function safeBase(s) {
	return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
function FilesPage() {
	const { year, attendanceDocs, contracts, contractEntries, expenses, patchAttendanceDoc, removeAttendanceDocs, patchContractEntry, upsertContract, upsertExpense } = useApp();
	const [kind, setKind] = React.useState("all");
	const [scope, setScope] = React.useState("year");
	const [q, setQ] = React.useState("");
	const taken = [
		...(attendanceDocs || []).map((d) => d.fileName),
		...(contractEntries || []).map((e) => e.fileName),
		...(contracts || []).map((c) => c.scanFileName),
		...(expenses || []).map((e) => e.voucherFileName),
		...(expenses || []).map((e) => e.payoutFileName)
	].filter(Boolean);
	const filtered = React.useMemo(() => {
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
				extra: "合同扫描件",
				suggest: `${safeBase(c.name)}-合同电子版`,
				source: "scan"
			});
		}
		const seenV = /* @__PURE__ */ new Set();
		for (const e of expenses || []) {
			if (!e.voucherFileName || !e.voucherId) continue;
			if (scope === "year" && e.year !== year) continue;
			if (seenV.has(e.voucherId)) continue;
			seenV.add(e.voucherId);
			out.push({
				id: e.voucherId,
				kind: "expense",
				fileName: e.voucherFileName,
				belong: `${e.year} ${e.name}`,
				extra: [e.payMethod, e.status].filter(Boolean).join(" · "),
				suggest: `${safeBase(e.name)}-${e.amount}`,
				source: "expense"
			});
		}
		const seenP = /* @__PURE__ */ new Set();
		for (const e of expenses || []) {
			if (!e.payoutFileName || !e.payoutId) continue;
			if (scope === "year" && e.year !== year) continue;
			if (seenP.has(e.payoutId)) continue;
			seenP.add(e.payoutId);
			const group = (expenses || []).filter((x) => x.payoutId === e.payoutId);
			const sib = group.length;
			const total = group.reduce((s, x) => s + (x.amount || 0), 0);
			const amt = Number.isInteger(total) ? String(total) : String(Math.round(total * 100) / 100);
			out.push({
				id: e.payoutId,
				kind: "payout",
				fileName: e.payoutFileName,
				belong: `${e.year} ${e.claimant || e.name}`,
				extra: [
					e.payAccount,
					e.forWhom || e.claimant,
					sib > 1 ? `${sib}笔一起` : "",
					e.payoutDate,
					e.status
				].filter(Boolean).join(" · "),
				suggest: `收报销款-${amt}-${sib}笔`,
				source: "payout"
			});
		}
		return out;
	}, [
		attendanceDocs,
		contractEntries,
		contracts,
		expenses,
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
	return /* @__PURE__ */ jsx(Need, {
		perm: "files.view",
		children: /* @__PURE__ */ jsxs("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ jsxs("header", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-2xl font-semibold",
					children: "影像资料"
				}), /* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted",
					children: "文件在 NAS 的 data/photos 下：报量单、发票、收款回单、考勤影像、合同扫描件、报销凭证、报销打款。可查看、下载、复制、替换、删除。"
				})] }),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ jsxs("label", {
							className: "text-sm",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs text-muted",
								children: "类型"
							}), /* @__PURE__ */ jsxs("select", {
								className: "field-select mt-1 w-auto",
								value: kind,
								onChange: (e) => setKind(e.target.value),
								children: [
									/* @__PURE__ */ jsx("option", {
										value: "all",
										children: "全部"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "attendance",
										children: "考勤影像"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "report",
										children: "报量单"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "invoice",
										children: "电子发票"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "receipt",
										children: "收款回单"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "contract",
										children: "合同扫描件"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "expense",
										children: "报销凭证"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "payout",
										children: "报销打款"
									})
								]
							})]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "text-sm",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs text-muted",
								children: "年份"
							}), /* @__PURE__ */ jsxs("select", {
								className: "field-select mt-1 w-auto",
								value: scope,
								onChange: (e) => setScope(e.target.value),
								children: [/* @__PURE__ */ jsxs("option", {
									value: "year",
									children: [year, "年"]
								}), /* @__PURE__ */ jsx("option", {
									value: "all",
									children: "全部年份"
								})]
							})]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "min-w-48 flex-1 text-sm",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-xs text-muted",
								children: "搜索"
							}), /* @__PURE__ */ jsx(Input, {
								className: "mt-1",
								value: q,
								onChange: (e) => setQ(e.target.value),
								placeholder: "文件名 / 项目 / 报销人 / 账户"
							})]
						})
					]
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted",
					children: [
						"共 ",
						filtered.length,
						" 份"
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "overflow-x-auto rounded-xl border border-line bg-surface",
					children: /* @__PURE__ */ jsxs("table", {
						className: "w-full min-w-[48rem] text-left text-sm",
						children: [/* @__PURE__ */ jsx("thead", {
							className: "border-b border-line text-xs text-muted",
							children: /* @__PURE__ */ jsxs("tr", { children: [
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "类型"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "归属"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "文件"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "说明"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "操作"
								})
							] })
						}), /* @__PURE__ */ jsxs("tbody", { children: [filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
							colSpan: 5,
							className: "p-6 text-muted",
							children: "还没有影像资料。到月度考勤、合同流水或合同扫描件里上传。"
						}) }) : null, filtered.map((r) => /* @__PURE__ */ jsxs("tr", {
							className: "border-b border-line last:border-0",
							children: [
								/* @__PURE__ */ jsx("td", {
									className: "p-3",
									children: DOC_KIND_LABEL[r.kind]
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3",
									children: r.belong
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3 font-medium",
									children: r.fileName
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3 text-muted",
									children: r.extra || "—"
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3",
									children: /* @__PURE__ */ jsx(DocActions, {
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
											} else if (r.source === "expense") {
												for (const e of expenses || []) if (e.voucherId === r.id) upsertExpense({
													...e,
													voucherFileName: name
												});
											} else if (r.source === "payout") {
												for (const e of expenses || []) if (e.payoutId === r.id) upsertExpense({
													...e,
													payoutFileName: name
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
											} else if (r.source === "expense") {
												for (const e of expenses || []) if (e.voucherId === r.id) upsertExpense({
													...e,
													voucherFileName: "",
													voucherId: ""
												});
											} else if (r.source === "payout") {
												for (const e of expenses || []) if (e.payoutId === r.id) upsertExpense({
													...e,
													payoutFileName: "",
													payoutId: ""
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
export { FilesPage as component };
