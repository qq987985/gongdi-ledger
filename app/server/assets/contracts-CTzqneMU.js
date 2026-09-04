import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-BlHKQb24.js";
import { a as toggleSel, i as money, n as confirmBatchDelete, o as uid } from "./utils-DPLvt0U2.js";
import { a as normalizeEntry, n as contractRollup, r as emptyContract, t as CONTRACT_STATUSES } from "./contracts-Bm8eyOQk.js";
import { s as buildContractWorkbook } from "./excel-BRkrzoxa.js";
import { t as useApp } from "./store-CJtv_oh6.js";
import "./nas-sync-6SIAArMJ.js";
import { a as prepareNamedFile, c as removeDoc, i as invoiceBase, l as reportBase, n as DocActions, o as receiptSubBase, s as receiptWorkerBase, u as setDoc } from "./doc-actions-CSStwuTU.js";
import { n as FilePick } from "./file-pick-BCv2SWUM.js";
import { t as Plus } from "./plus-lB1rlNS-.js";
import { t as Trash2 } from "./trash-2-Beo1lUOQ.js";
import { n as toast } from "./dist-DdkhMw2U.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { n as Label, t as Input } from "./input-BWJYTTKH.js";
import { n as WideTable, r as usePager, t as ThHint } from "./wide-table-DtWSjvOR.js";
import { n as Need } from "./can-zSnmIuUg.js";
import { n as ContractImport } from "./excel-import-Dep7oXYn.js";
import { t as Badge } from "./badge-Dj5bEQZ9.js";
import { t as useGuardedClose } from "./confirm-close-D2cQFNgP.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function sortByDate(a, b) {
	return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id);
}
function Row({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 text-neutral-600",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: value || "—" })]
	});
}
function MiniTable({ title, heads, rows, empty }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-sm font-semibold",
			children: title
		}), rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "mt-1 w-full border-collapse text-center text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: heads.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				className: "border border-black px-1 py-1 font-medium",
				children: h
			}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: r.map((cell, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: `border border-black px-1 py-1 ${j === r.length - 1 ? "text-left" : ""}`,
				children: cell
			}, j)) }, i)) })]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-xs",
			children: [
				"（",
				empty,
				"）"
			]
		})]
	});
}
function ContractStatementSheets({ items }) {
	if (!items.length) return null;
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only space-y-8 text-black",
		children: items.map(({ contract: c, entries }) => {
			const roll = contractRollup(c, entries);
			const reportInclMode = c.reportTaxMode === "incl";
			const reportLabel = reportInclMode ? "含税金额" : "不含税金额";
			const reportVal = reportInclMode ? roll.reportIncl : roll.reportExcl;
			const reports = entries.filter((e) => e.kind === "report").slice().sort(sortByDate);
			const invoices = entries.filter((e) => e.kind === "invoice").slice().sort(sortByDate);
			const receipts = entries.filter((e) => e.kind === "receipt").slice().sort(sortByDate);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "statement border border-black p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "border-b border-black pb-2 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-semibold tracking-widest",
							children: "合同对账单"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xs",
							children: [
								c.code,
								" · ",
								c.name
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 space-y-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "年份",
								value: c.year
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "项目号",
								value: c.code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "项目名称",
								value: c.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "总包",
								value: c.contractor
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "分包",
								value: c.subcontractor
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "合同金额",
								value: `¥${money(c.contractAmount || 0)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "税率",
								value: `${c.taxRate || 0}%`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "付款比例",
								value: `${c.payRatio || 0}%`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "质保",
								value: `${c.warrantyStart || "—"} 至 ${c.warrantyEnd || "—"}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "经理",
								value: c.manager
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniTable, {
						title: reportLabel,
						heads: [
							"日期",
							reportLabel,
							"期次",
							"备注"
						],
						rows: reports.map((e) => [
							e.date,
							money(e.amount),
							e.no || "",
							e.remark || ""
						]),
						empty: "无报量"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniTable, {
						title: "开票",
						heads: [
							"日期",
							"开票金额",
							"不含税",
							"税率",
							"发票号",
							"备注"
						],
						rows: invoices.map((e) => [
							e.date,
							money(e.amount),
							money(e.amountExcl || 0),
							`${e.taxRate || 0}%`,
							e.no || "",
							e.remark || ""
						]),
						empty: "无开票"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniTable, {
						title: "收款",
						heads: [
							"日期",
							"金额",
							"类型",
							"备注"
						],
						rows: receipts.map((e) => [
							e.date,
							money(e.amount),
							e.payTo === "worker" ? "代付农民工" : "到分包",
							e.remark || ""
						]),
						empty: "无收款"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-1 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [reportLabel, "合计："] }),
								"¥",
								money(reportVal)
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "应收：" }),
								"¥",
								money(roll.payable)
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "开票合计：" }),
								"¥",
								money(roll.invoice),
								"（不含税¥",
								money(roll.invoiceExcl),
								"）"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "已付：" }),
								"¥",
								money(roll.receipt),
								"（代付¥",
								money(roll.workerPay),
								" + 到分包¥",
								money(roll.subPay),
								"）"
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "合同未付：" }),
								"¥",
								money(roll.dueRemain)
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "剩余款：" }),
								"¥",
								money(roll.remain)
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-right text-xs",
						children: ["打印日期 ", today]
					})
				]
			}, c.id);
		})
	});
}
function ContractsPage() {
	const { year, contracts, contractEntries, upsertContract, removeContracts, addContractEntry, removeContractEntries } = useApp();
	const [q, setQ] = import_react.useState("");
	const [status, setStatus] = import_react.useState("all");
	const [scope, setScope] = import_react.useState("year");
	const [selected, setSelected] = import_react.useState([]);
	const [editing, setEditing] = import_react.useState(null);
	const [creating, setCreating] = import_react.useState(false);
	const list = import_react.useMemo(() => {
		let rows = contracts;
		if (scope === "year") rows = rows.filter((c) => c.year === year);
		if (status !== "all") rows = rows.filter((c) => c.status === status);
		if (q.trim()) {
			const s = q.trim();
			rows = rows.filter((c) => [
				c.name,
				c.code,
				c.contractor,
				c.subcontractor,
				c.manager
			].some((x) => x.includes(s)));
		}
		return rows.slice().sort((a, b) => a.year - b.year || a.code.localeCompare(b.code) || a.name.localeCompare(b.name));
	}, [
		contracts,
		year,
		scope,
		status,
		q
	]);
	const pager = usePager("contracts", list, [
		scope,
		status,
		q,
		year
	].join("|"));
	const pageRows = pager.rows;
	const allChecked = pageRows.length > 0 && pageRows.every((c) => selected.includes(c.id));
	const totals = list.reduce((acc, c) => {
		const r = contractRollup(c, contractEntries);
		acc.amount += c.contractAmount || 0;
		acc.report += r.report;
		acc.reportIncl += r.reportIncl;
		acc.reportExcl += r.reportExcl;
		acc.invoice += r.invoice;
		acc.invoiceExcl += r.invoiceExcl;
		acc.receipt += r.receipt;
		acc.workerPay += r.workerPay;
		acc.subPay += r.subPay;
		acc.remain += r.remain;
		acc.payable += r.payable;
		acc.dueRemain += r.dueRemain;
		return acc;
	}, {
		amount: 0,
		report: 0,
		reportIncl: 0,
		reportExcl: 0,
		invoice: 0,
		invoiceExcl: 0,
		receipt: 0,
		workerPay: 0,
		subPay: 0,
		remain: 0,
		payable: 0,
		dueRemain: 0
	});
	function dropIds(ids) {
		if (!ids.length) return;
		if (!confirmBatchDelete("合同", ids.length, "会同时删掉这些合同的报量、开票、收款流水。考勤人员不受影响。")) return;
		removeContracts(ids);
		setSelected((s) => s.filter((id) => !ids.includes(id)));
		if (editing && ids.includes(editing.id)) {
			setEditing(null);
			setCreating(false);
		}
		toast.success("已删除合同");
	}
	const printItems = import_react.useMemo(() => {
		return (selected.length ? selected : editing && !creating ? [editing.id] : []).map((id) => contracts.find((c) => c.id === id)).filter((c) => Boolean(c)).map((contract) => ({
			contract,
			entries: contractEntries.filter((e) => e.contractId === contract.id)
		}));
	}, [
		selected,
		editing,
		creating,
		contracts,
		contractEntries
	]);
	import_react.useEffect(() => {
		if (!editing) return;
		const t = window.setTimeout(() => document.getElementById("contract-scan")?.scrollIntoView({
			behavior: "smooth",
			block: "nearest"
		}), 50);
		return () => window.clearTimeout(t);
	}, [editing?.id]);
	function printStatement() {
		if (!printItems.length) {
			toast.error("先点开一个合同，或勾选要打印的合同");
			return;
		}
		window.print();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "contracts.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-print space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: "合同管理"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 max-w-2xl text-sm text-muted",
						children: [
							"点表格里的合同名称，页面滚到下方，",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "保存合同信息正下方有虚线框「合同电子版」" }),
							"。有文件就是有合同，没传就是无合同；原因写在备注里。报量可选",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "含税" }),
							"或",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "不含税" }),
							"。"
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft",
								href: "/api/file/contract-export",
								children: "导出合同表"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractImport, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: async () => {
									const buf = await buildContractWorkbook({
										contracts,
										entries: contractEntries
									}).xlsx.writeBuffer();
									const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
									const url = URL.createObjectURL(blob);
									const a = document.createElement("a");
									a.href = url;
									a.download = `合同台账-${year}.xlsx`;
									a.click();
									URL.revokeObjectURL(url);
									toast.success("已生成合同台账 Excel");
								},
								children: "导出对账表"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								onClick: printStatement,
								children: ["打印对账单", printItems.length ? `（${printItems.length}）` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								onClick: () => {
									setCreating(true);
									setEditing(emptyContract(year));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " 新增合同"]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4",
					children: [
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
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: "状态"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field-select mt-1 w-auto",
								value: status,
								onChange: (e) => setStatus(e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "全部"
								}), CONTRACT_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s.id,
									children: s.label
								}, s.id))]
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
								placeholder: "项目号 / 项目名称 / 总包 / 分包 / 经理"
							})]
						}),
						selected.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "danger",
							type: "button",
							onClick: () => dropIds(selected),
							children: [
								"删除所选（",
								selected.length,
								"）"
							]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "合同金额",
							value: totals.amount
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "报量金额",
							value: totals.report
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "应收",
							hint: "含税报量×比例",
							value: totals.payable
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "开票金额",
							value: totals.invoice
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "已付",
							hint: "代付+到分包",
							value: totals.receipt
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "合同未付",
							hint: "应收−已付",
							value: totals.dueRemain
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "剩余款",
							hint: "开票金额−已付",
							value: totals.remain
						})
					]
				}),
				editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractEditor, {
					draft: editing,
					creating,
					entries: contractEntries.filter((e) => e.contractId === editing.id),
					onCancel: () => {
						setEditing(null);
						setCreating(false);
					},
					onSave: (c) => {
						upsertContract(c);
						setEditing(c);
						setCreating(false);
						toast.success("合同已保存");
					},
					onAddEntry: (e) => addContractEntry(e),
					onRemoveEntries: removeContractEntries,
					onDelete: () => {
						if (!confirmBatchDelete("合同", 1, `将删除 ${editing.name} 的合同及所有报量、发票、收款记录。`)) return;
						dropIds([editing.id]);
						setEditing(null);
						setCreating(false);
					}
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "contracts",
					pager,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "wide-table text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "border-b border-line text-xs text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "w-10 p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "size-4",
											checked: allChecked,
											onChange: (e) => {
												const ids = pageRows.map((c) => c.id);
												setSelected((s) => e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id)));
											},
											"aria-label": "全选合同"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "操作"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "sticky left-0 z-10 bg-bg-elevated p-3",
										children: "序号"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "年份"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "项目号"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "sticky left-14 z-10 bg-bg-elevated p-3 shadow-[2px_0_0_var(--color-line)]",
										children: "项目名称"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "min-w-[5.5rem] whitespace-nowrap p-3",
										children: "扫描件"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "总包"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "分包"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "合同金额"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "税率"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "报量计税"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "报量金额"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "付款比例"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThHint, {
										hint: "含税报量×比例",
										children: "应收"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "开票金额"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThHint, {
										hint: "代付+到分包",
										children: "已付"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "合同未付"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "剩余款"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "p-3",
										children: "状态"
									})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 20,
								className: "p-6 text-muted",
								children: "还没有合同。点右上角「新增合同」，或在 Excel 导入后刷新。"
							}) }) : null, pageRows.map((c, i) => {
								const r = contractRollup(c, contractEntries);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: `group border-b border-line last:border-0 hover:bg-accent-soft ${editing?.id === c.id || selected.includes(c.id) ? "bg-accent-soft" : ""}`,
									onClick: () => setSelected((s) => toggleSel(s, c.id, !s.includes(c.id))),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											onClick: (e) => e.stopPropagation(),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												className: "size-4",
												checked: selected.includes(c.id),
												onChange: (e) => setSelected((s) => toggleSel(s, c.id, e.target.checked)),
												"aria-label": `选择 ${c.name}`
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											onClick: (e) => e.stopPropagation(),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												type: "button",
												onClick: () => {
													setCreating(false);
													setEditing(c);
												},
												children: "编辑"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "sticky left-0 z-10 bg-surface p-2 tabular-nums text-muted",
											children: (pager.page - 1) * pager.size + i + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											children: c.year
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											children: c.code
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "sticky left-14 z-10 bg-surface p-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "text-left font-medium hover:text-accent",
												onClick: () => {
													setCreating(false);
													setEditing(c);
												},
												children: c.name
											}), c.remark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] text-muted",
												children: c.remark
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-center",
											children: c.scanFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "ok",
												children: "有"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "无" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											children: c.contractor
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											children: c.subcontractor
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-right tabular-nums",
											children: money(c.contractAmount)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "p-2 text-right tabular-nums",
											children: [c.taxRate, "%"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											children: c.reportTaxMode === "incl" ? "含税" : "不含税"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-right tabular-nums",
											children: c.reportTaxMode === "incl" ? money(r.reportIncl) : money(r.reportExcl)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "p-2 text-right tabular-nums",
											children: [c.payRatio, "%"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-right tabular-nums",
											children: money(r.payable)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-right tabular-nums",
											children: money(r.invoice)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-right tabular-nums",
											children: money(r.receipt)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-right tabular-nums",
											children: money(r.dueRemain)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2 text-right tabular-nums",
											children: money(r.remain)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: c.status === "finished" ? "ok" : c.status === "aborted" ? "danger" : "warn",
												children: CONTRACT_STATUSES.find((s) => s.id === c.status)?.label || c.status
											})
										})
									]
								}, c.id);
							})] }),
							list.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t-2 border-ink bg-bg-elevated text-sm font-medium",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-2",
										colSpan: 9,
										children: [
											"合计（",
											sumTip(list.length),
											"）"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(totals.amount)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2",
										colSpan: 2
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: totals.reportIncl ? money(totals.reportIncl) : money(totals.reportExcl)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(totals.payable)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(totals.invoice)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(totals.receipt)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(totals.dueRemain)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(totals.remain)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2" })
								]
							}) }) : null
						]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractStatementSheets, { items: printItems })] })
	});
}
function sumTip(n) {
	return `本表 ${n} 笔`;
}
function Mini({ label, hint, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: label
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] text-subtle",
				children: hint
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 font-display text-lg font-semibold tabular-nums",
				children: ["¥", money(value)]
			})
		]
	});
}
function confirmEdits(kind, name, creating, before, after, labels) {
	if (typeof window === "undefined") return true;
	if (creating) return window.confirm(`确认新增${kind}「${name || "未命名"}」？`);
	const lines = [];
	for (const key of Object.keys(labels)) {
		let a = before?.[key], b = after?.[key];
		if (a === true) a = "是";
		else if (a === false) a = "否";
		if (b === true) b = "是";
		else if (b === false) b = "否";
		if (a === "incl") a = "含税";
		if (b === "incl") b = "含税";
		if (a === "excl") a = "不含税";
		if (b === "excl") b = "不含税";
		const as = a == null || a === "" ? "（空）" : String(a);
		const bs = b == null || b === "" ? "（空）" : String(b);
		if (as === bs) continue;
		lines.push(`${labels[key]}：${as} → ${bs}`);
	}
	if (!lines.length) return window.confirm(`没有改动。仍要保存${kind}「${name}」？`);
	const show = lines.slice(0, 8);
	const extra = lines.length > 8 ? `\n…另有 ${lines.length - 8} 项` : "";
	return window.confirm(`确认保存${kind}「${name}」？\n\n改了 ${lines.length} 项：\n${show.join("\n")}${extra}`);
}
function ContractEditor({ draft, creating, entries, onCancel, onSave, onDelete, onAddEntry, onRemoveEntries }) {
	const [c, setC] = import_react.useState(draft);
	const roll = contractRollup(c, entries);
	const { markDirty, requestClose } = useGuardedClose(onCancel);
	function patch(key, value) {
		setC((prev) => ({
			...prev,
			[key]: value
		}));
	}
	import_react.useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") requestClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [requestClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6",
		onClick: requestClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "contract-editor",
			className: "max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			onChange: markDirty,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: creating ? "新增合同" : c.name || "编辑合同"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "btn-row",
						children: [
							c.scanFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "ok",
								children: "有合同"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "无合同" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								onClick: onCancel,
								children: "关闭"
							}),
							!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								onClick: () => window.print(),
								children: "打印对账单"
							}) : null,
							!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "danger",
								type: "button",
								onClick: () => onDelete?.(),
								children: "删除"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: () => {
									if (!c.name.trim()) {
										toast.error("项目名称必填");
										return;
									}
									if (!confirmEdits("合同", c.name, creating, draft, c, {
										year: "年份",
										code: "项目号",
										name: "项目名称",
										contractor: "总包",
										subcontractor: "分包",
										contractAmount: "合同金额",
										taxRate: "税率",
										reportTaxMode: "报量计税",
										payRatio: "付款比例",
										warrantyStart: "质保开始",
										warrantyEnd: "质保结束",
										status: "状态",
										manager: "经理",
										prelimAmount: "初审金额",
										settleReceivable: "结算金额",
										hasDeposit: "有质保金",
										depositAmount: "质保金",
										remark: "备注"
									})) return;
									onSave(c);
								},
								children: "保存合同信息"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 md:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "年份",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: c.year,
								onChange: (e) => patch("year", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "项目号",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: c.code,
								onChange: (e) => patch("code", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "项目名称 *",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: c.name,
								onChange: (e) => patch("name", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "总包",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: c.contractor,
								onChange: (e) => patch("contractor", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "分包",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: c.subcontractor,
								onChange: (e) => patch("subcontractor", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "项目部经营人员",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: c.manager,
								onChange: (e) => patch("manager", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "合同金额",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								value: c.contractAmount,
								onChange: (e) => patch("contractAmount", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "税率 %",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								value: c.taxRate,
								onChange: (e) => patch("taxRate", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "付款比例 %",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								value: c.payRatio,
								onChange: (e) => patch("payRatio", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "报量计税",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field-select w-full",
								value: c.reportTaxMode,
								onChange: (e) => patch("reportTaxMode", e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "incl",
									children: "含税金额"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "excl",
									children: "不含税金额"
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "状态",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field-select w-full",
								value: c.status,
								onChange: (e) => patch("status", e.target.value),
								children: CONTRACT_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: s.id,
									children: s.label
								}, s.id))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "质保开始",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: c.warrantyStart,
								onChange: (e) => patch("warrantyStart", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "质保结束",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: c.warrantyEnd,
								onChange: (e) => patch("warrantyEnd", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "有质保金",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: c.hasDeposit,
									onChange: (e) => patch("hasDeposit", e.target.checked)
								}), c.hasDeposit ? "有" : "无"]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "质保金金额",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								disabled: !c.hasDeposit,
								value: c.depositAmount,
								onChange: (e) => patch("depositAmount", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "初审金额",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								value: c.prelimAmount,
								onChange: (e) => patch("prelimAmount", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "结算金额（手填）",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								step: "0.01",
								value: c.settleReceivable,
								onChange: (e) => patch("settleReceivable", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "备注",
							className: "md:col-span-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: c.remark,
								onChange: (e) => patch("remark", e.target.value)
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						c.reportTaxMode === "incl" ? "含税金额 ¥" : "不含税金额 ¥",
						money(c.reportTaxMode === "incl" ? roll.reportIncl : roll.reportExcl),
						" · 应收 ¥",
						money(roll.payable),
						" · 开票金额 ¥",
						money(roll.invoice),
						" · 已付 ¥",
						money(roll.receipt),
						"（代付 ¥",
						money(roll.workerPay),
						" + 到分包 ¥",
						money(roll.subPay),
						"）· 合同未付 ¥",
						money(roll.dueRemain),
						" · 剩余款 ¥",
						money(roll.remain),
						"。报量按",
						c.reportTaxMode === "incl" ? "含税" : "不含税",
						"录入。"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractScanBox, {
					contract: c,
					onFileName: (name) => {
						const next = {
							...c,
							scanFileName: name
						};
						setC(next);
						onSave(next);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 xl:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportBook, {
							contract: c,
							entries: entries.filter((e) => e.kind === "report"),
							disabled: creating,
							onAdd: onAddEntry,
							onRemove: onRemoveEntries
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceBook, {
							contract: c,
							entries: entries.filter((e) => e.kind === "invoice"),
							disabled: creating,
							onAdd: onAddEntry,
							onRemove: onRemoveEntries
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptBook, {
							contract: c,
							entries: entries.filter((e) => e.kind === "receipt"),
							disabled: creating,
							onAdd: onAddEntry,
							onRemove: onRemoveEntries
						})
					]
				}),
				creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-warn",
					children: "先保存合同信息，才能记报量、开票、收款。"
				}) : null
			]
		})
	});
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
function DocPick({ label, fileName, disabled, onFile }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePick, {
		kind: "file",
		compact: true,
		disabled,
		accept: ".pdf,.ofd,.xml,.jpg,.jpeg,.png,.webp,.xlsx,.xls",
		label,
		hint: fileName ? `已选：${fileName}，可再点或拖入替换` : "点击选择，或把文件拖到这里",
		onFile
	});
}
async function attachNamed(id, kind, file, base, taken) {
	if (!file) return "";
	const pack = await prepareNamedFile(file, base, taken, "");
	if (!pack) return "";
	return await setDoc(id, kind, pack.file, { replace: pack.replace }) || pack.file.name;
}
function useTakenNames() {
	const entries = useApp((s) => s.contractEntries);
	const docs = useApp((s) => s.attendanceDocs);
	return [...entries.map((e) => e.fileName), ...(docs || []).map((d) => d.fileName)].filter(Boolean);
}
function ReportBook({ contract, entries, disabled, onAdd, onRemove }) {
	const [date, setDate] = import_react.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [amount, setAmount] = import_react.useState(0);
	const [no, setNo] = import_react.useState("");
	const [remark, setRemark] = import_react.useState("");
	const [file, setFile] = import_react.useState();
	const taken = useTakenNames();
	const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-bg-elevated p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-semibold",
					children: "月报量"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs tabular-nums text-muted",
					children: [
						entries.length,
						" 笔 · ¥",
						money(total)
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-muted",
				children: [
					"按",
					contract.reportTaxMode === "incl" ? "含税" : "不含税",
					"记。上传后自动命名：项目名报量-月份-金额。"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value),
						disabled
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "0.01",
						value: amount,
						onChange: (e) => setAmount(Number(e.target.value) || 0),
						disabled,
						placeholder: contract.reportTaxMode === "incl" ? "含税金额" : "不含税金额"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: no,
						onChange: (e) => setNo(e.target.value),
						disabled,
						placeholder: "期次"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: remark,
						onChange: (e) => setRemark(e.target.value),
						disabled,
						placeholder: "备注"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocPick, {
						label: "报量单",
						fileName: file?.name,
						disabled,
						onFile: setFile
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "w-full",
						disabled: disabled || !amount,
						type: "button",
						onClick: async () => {
							const id = uid();
							const fileName = await attachNamed(id, "report", file, reportBase(contract.name, date, amount), taken);
							onAdd(normalizeEntry({
								id,
								contractId: contract.id,
								kind: "report",
								date,
								amount,
								no,
								remark,
								fileName
							}));
							setAmount(0);
							setNo("");
							setRemark("");
							setFile(void 0);
							toast.success("已记一笔报量");
						},
						children: "记一笔报量"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryRows, {
				entries,
				title: "报量",
				onRemove,
				render: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tabular-nums",
						children: [
							e.date || "—",
							contract.reportTaxMode === "incl" ? " · 含税金额 ¥" : " · 不含税金额 ¥",
							money(e.amount)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-muted",
						children: [e.no ? `${e.no} ` : "", e.remark]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileLink, {
						id: e.id,
						kind: "report",
						fileName: e.fileName,
						suggest: reportBase(contract.name, e.date, e.amount)
					})
				] })
			})
		]
	});
}
function InvoiceBook({ contract, entries, disabled, onAdd, onRemove }) {
	const [date, setDate] = import_react.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [incl, setIncl] = import_react.useState(0);
	const [excl, setExcl] = import_react.useState(0);
	const [rate, setRate] = import_react.useState(contract.taxRate || 9);
	const [no, setNo] = import_react.useState("");
	const [remark, setRemark] = import_react.useState("");
	const [file, setFile] = import_react.useState();
	const taken = useTakenNames();
	const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
	function fromIncl(n) {
		setIncl(n);
		if (rate > 0) setExcl(round2(n / (1 + rate / 100)));
	}
	function fromExcl(n) {
		setExcl(n);
		if (rate > 0) setIncl(round2(n * (1 + rate / 100)));
	}
	function fromRate(n) {
		setRate(n);
		if (excl > 0) setIncl(round2(excl * (1 + n / 100)));
		else if (incl > 0 && n > 0) setExcl(round2(incl / (1 + n / 100)));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-bg-elevated p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-semibold",
					children: "开票"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs tabular-nums text-muted",
					children: [
						entries.length,
						" 张 · 开票金额 ¥",
						money(total)
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "填含税或不含税，按税率互算。上传后自动命名：合同名-开票月份-金额。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value),
						disabled
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "0.01",
						value: incl || "",
						onChange: (e) => fromIncl(Number(e.target.value) || 0),
						disabled,
						placeholder: "含税金额"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "0.01",
						value: excl || "",
						onChange: (e) => fromExcl(Number(e.target.value) || 0),
						disabled,
						placeholder: "不含税金额"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "0.01",
						value: rate,
						onChange: (e) => fromRate(Number(e.target.value) || 0),
						disabled,
						placeholder: "税率 %"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: no,
						onChange: (e) => setNo(e.target.value),
						disabled,
						placeholder: "发票号"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: remark,
						onChange: (e) => setRemark(e.target.value),
						disabled,
						placeholder: "备注"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocPick, {
						label: "电子发票",
						fileName: file?.name,
						disabled,
						onFile: setFile
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "w-full",
						disabled: disabled || !incl,
						type: "button",
						onClick: async () => {
							const id = uid();
							const fileName = await attachNamed(id, "invoice", file, invoiceBase(contract.name, date, incl), taken);
							onAdd(normalizeEntry({
								id,
								contractId: contract.id,
								kind: "invoice",
								date,
								amount: incl,
								amountExcl: excl,
								taxRate: rate,
								no,
								remark,
								fileName
							}));
							setIncl(0);
							setExcl(0);
							setNo("");
							setRemark("");
							setFile(void 0);
							toast.success("已记一张发票");
						},
						children: "记一张发票"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryRows, {
				entries,
				title: "发票",
				onRemove,
				render: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tabular-nums",
						children: [
							e.date || "—",
							" · 开票金额 ¥",
							money(e.amount)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-muted",
						children: [
							"不含税 ¥",
							money(e.amountExcl),
							" · ",
							e.taxRate || 0,
							"% ",
							e.no
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileLink, {
						id: e.id,
						kind: "invoice",
						fileName: e.fileName,
						suggest: invoiceBase(contract.name, e.date, e.amount)
					})
				] })
			})
		]
	});
}
function ReceiptBook({ contract, entries, disabled, onAdd, onRemove }) {
	const [date, setDate] = import_react.useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [amount, setAmount] = import_react.useState(0);
	const [payTo, setPayTo] = import_react.useState("sub");
	const [no, setNo] = import_react.useState("");
	const [remark, setRemark] = import_react.useState("");
	const [file, setFile] = import_react.useState();
	const taken = useTakenNames();
	const workers = entries.filter((e) => e.payTo === "worker").reduce((s, e) => s + (e.amount || 0), 0);
	const subs = entries.filter((e) => e.payTo !== "worker").reduce((s, e) => s + (e.amount || 0), 0);
	const base = payTo === "worker" ? receiptWorkerBase(contract.name, date) : receiptSubBase(contract.name, date);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-bg-elevated p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-semibold",
					children: "收款"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs tabular-nums text-muted",
					children: [entries.length, " 笔"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "类型选「代付农民工」会把金额单独汇总；「到分包」是正常收款。上传后自动命名。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value),
						disabled
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "0.01",
						value: amount,
						onChange: (e) => setAmount(Number(e.target.value) || 0),
						disabled,
						placeholder: "金额"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "field-select w-full",
						value: payTo,
						onChange: (e) => setPayTo(e.target.value),
						disabled,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "sub",
							children: "到分包"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "worker",
							children: "代付农民工"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: no,
						onChange: (e) => setNo(e.target.value),
						disabled,
						placeholder: "银行回单号"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: remark,
						onChange: (e) => setRemark(e.target.value),
						disabled,
						placeholder: "备注"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocPick, {
						label: "收款回单",
						fileName: file?.name,
						disabled,
						onFile: setFile
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "w-full",
						disabled: disabled || !amount,
						type: "button",
						onClick: async () => {
							const id = uid();
							const fileName = await attachNamed(id, "receipt", file, base, taken);
							onAdd(normalizeEntry({
								id,
								contractId: contract.id,
								kind: "receipt",
								date,
								amount,
								payTo,
								no,
								remark,
								fileName
							}));
							setAmount(0);
							setNo("");
							setRemark("");
							setFile(void 0);
							toast.success("已记一笔收款");
						},
						children: "记一笔收款"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryRows, {
				entries,
				title: "收款",
				onRemove,
				render: (e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "tabular-nums",
						children: [
							e.date || "—",
							" · ",
							money(e.amount),
							" · ",
							e.payTo === "worker" ? "代付农民工" : "到分包"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-muted",
						children: [e.no, e.remark].filter(Boolean).join(" · ")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileLink, {
						id: e.id,
						kind: "receipt",
						fileName: e.fileName,
						suggest: e.payTo === "worker" ? receiptWorkerBase(contract.name, e.date) : receiptSubBase(contract.name, e.date)
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-2 gap-2 text-[11px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"到分包：¥",
					money(subs),
					" · ",
					entries.filter((e) => e.payTo !== "worker").length,
					" 笔"
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"代付农民工：¥",
					money(workers),
					" · ",
					entries.filter((e) => e.payTo === "worker").length,
					" 笔"
				] })]
			})
		]
	});
}
function round2(n) {
	return Math.round((Number(n) || 0) * 100) / 100;
}
function FileLink({ id, kind, fileName, suggest }) {
	const patch = useApp((s) => s.patchContractEntry);
	const taken = useTakenNames();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-0.5",
		children: [fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "truncate text-muted",
			children: fileName
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
			id,
			kind,
			fileName,
			suggest,
			taken,
			onReplaced: (name) => patch(id, { fileName: name }),
			onDeleted: () => patch(id, { fileName: "" })
		})]
	});
}
function EntryRows({ entries, title, onRemove, render }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
		className: "mt-3 max-h-64 space-y-1 overflow-auto text-xs",
		children: [entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: "text-muted",
			children: "暂无"
		}) : null, entries.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-start justify-between gap-2 border-b border-line py-1.5 last:border-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-w-0",
				children: render(e)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-muted hover:text-danger",
				"aria-label": "删除",
				onClick: async () => {
					if (!confirm(`删除这笔${title}？`)) return;
					if (e.kind === "report" || e.kind === "invoice" || e.kind === "receipt") await removeDoc(e.id, e.kind);
					onRemove([e.id]);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
			})]
		}, e.id))]
	});
}
function contractScanName(name) {
	const base = (name || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "");
	return base ? `${base}-合同电子版` : "";
}
function ContractScanBox({ contract, onFileName }) {
	const taken = (useApp((s) => s.contracts) || []).map((c) => c.scanFileName).filter(Boolean);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "contract-scan",
		className: "rounded-lg border-2 border-dashed border-accent bg-accent-soft p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex flex-wrap items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-semibold",
					children: "合同电子版（扫描件）"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 text-xs text-muted",
					children: "点绿色按钮或把 PDF / 照片拖进来。上传后立刻算有合同，不用再点保存。文件名是「项目名称-合同电子版」。没传就是无合同，原因写备注。"
				})] }), contract.scanFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "ok",
					children: "有合同"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "无合同" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePick, {
				kind: "file",
				accept: ".pdf,.ofd,.jpg,.jpeg,.png,.webp",
				label: contract.scanFileName ? "更换合同电子版" : "上传合同电子版",
				hint: contract.scanFileName ? `已选：${contract.scanFileName}，可再点或拖入替换` : "支持 PDF、照片。请先填项目名称。",
				onFile: async (file) => {
					if (!file) return;
					const base = contractScanName(contract.name);
					if (!base) {
						toast.error("先填项目名称，扫描件按 项目名称-合同电子版 保存");
						return;
					}
					const pack = await prepareNamedFile(file, base, taken, contract.scanFileName);
					if (!pack) return;
					const saved = await setDoc(contract.id, "contract", pack.file, { replace: pack.replace }) || pack.file.name;
					onFileName(saved);
					toast.success(`已保存 ${saved}`);
				}
			}),
			contract.scanFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 truncate text-xs text-muted",
				children: contract.scanFileName
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
					id: contract.id,
					kind: "contract",
					fileName: contract.scanFileName,
					suggest: contractScanName(contract.name) || "合同电子版",
					taken,
					onReplaced: onFileName,
					onDeleted: () => onFileName("")
				})
			})
		]
	});
}
export { ContractsPage as component };
