const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/xlsx-center-nSN794kD.js","assets/rolldown-runtime-Dd_uD5pT.js","assets/xlsx-Cul4fuIT.js"])))=>i.map(i=>d[i]);
import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";
import{r as t}from"./audit-K39-jiKA.js";
import{t as n}from"./jsx-runtime-DREnUpxT.js";
import{a as receiptSubBase,c as renameFile,d as uniqueBase,i as invoiceBase,l as reportBase,n as DocActions,o as receiptWorkerBase,s as removeDoc,u as setDoc}from"./doc-actions-CmcTaqrK.js";
import{n as FilePick}from"./file-pick-Sh_I8IQI.js";
import{a as toggleSel,i as money,n as confirmBatchDelete,o as uid}from"./utils-BSPq25aB.js";
import{i as contractRollup,n as CONTRACT_STATUSES,o as splitTax,r as emptyContract,t as normalizeEntry,_ as round2}from"./contracts-D6qZj01d.js";
import{t as buildContractWorkbook}from"./excel-BYSb_v_l.js";
import{S as Plus,_ as Label,g as Input,h as toast,u as preload,v as Button,x as Trash2,y as useApp}from"./index-ghxum7yZ.js";
import{n as WideTable,t as ThHint,a as PageBar,o as usePager}from"./wide-table-BtpzsvMP.js";
import{n as ContractImport}from"./excel-import-CV73N9jL.js";
import{n as Need}from"./can-9AzYldNF.js";
import{t as Badge}from"./badge-_ctqz85I.js";
var import_react=e(t()),import_jsx_runtime=n();
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
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-lg font-semibold tracking-widest",
								children: "台账 · 项目对账单"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-base font-medium",
								children: c.name || "未命名项目"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-0.5 text-xs",
								children: [
									c.year,
									" 年",
									c.code ? ` · 项目号 ${c.code}` : "",
									c.status ? ` · ${c.status}` : ""
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold",
								children: "概况"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "总包：",
										value: c.contractor
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "分包：",
										value: c.subcontractor
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "合同金额：",
										value: c.contractAmount ? `¥${money(c.contractAmount)}` : ""
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "税率：",
										value: c.taxRate ? `${c.taxRate}%` : ""
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "报量按：",
										value: c.reportTaxMode === "incl" ? "含税" : "不含税"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "付款比例：",
										value: c.payRatio ? `${c.payRatio}%` : ""
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "保证金：",
										value: c.hasDeposit ? `¥${money(c.depositAmount)}` : "无"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
										label: "质保期：",
										value: c.warrantyStart || c.warrantyEnd ? `${c.warrantyStart || "—"} 至 ${c.warrantyEnd || "—"}` : ""
									})
								]
							}),
							c.remark ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs",
								children: ["备注：", c.remark]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "mt-3 w-full border-collapse text-center text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
									reportLabel,
									"应收（含税报量×比例）",
									"开票金额",
									"已付",
									"代付农民工",
									"到分包公司",
									"合同未付",
									"剩余款"
								].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "border border-black px-1 py-1 font-medium",
									children: h
								}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
									money(reportVal),
									money(roll.payable),
									money(roll.invoice),
									money(roll.receipt),
									money(roll.workerPay),
									money(roll.subPay),
									money(roll.dueRemain),
									money(roll.remain)
								].map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1 tabular-nums",
									children: v
								}, i)) }) })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniTable, {
						title: "报量记录",
						heads: [
							"日期",
							reportLabel,
							"期次",
							"影像",
							"备注"
						],
						empty: "暂无报量",
						rows: reports.map((e) => {
							const tax = splitTax(e.amount, c.taxRate, c.reportTaxMode || "excl");
							return [
								e.date || "—",
								money(reportInclMode ? tax.incl : tax.excl),
								e.no || "",
								e.fileName || "",
								e.remark || ""
							];
						}).concat(reports.length ? [[
							"合计",
							money(reportVal),
							"",
							"",
							""
						]] : [])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniTable, {
						title: "付款记录",
						heads: [
							"日期",
							"去向",
							"金额",
							"回单号",
							"影像",
							"备注"
						],
						empty: "暂无付款",
						rows: receipts.map((e) => [
							e.date || "—",
							e.payTo === "worker" ? "总包代付农民工" : "到分包公司",
							money(e.amount),
							e.no || "",
							e.fileName || "",
							e.remark || ""
						]).concat(receipts.length ? [[
							"合计",
							"",
							money(roll.receipt),
							"",
							"",
							""
						]] : [])
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniTable, {
						title: "开票记录",
						heads: [
							"日期",
							"开票金额",
							"税率",
							"发票号",
							"影像",
							"备注"
						],
						empty: "暂无开票",
						rows: invoices.map((e) => [
							e.date || "—",
							money(e.amount),
							e.taxRate ? `${e.taxRate}%` : "",
							e.no || "",
							e.fileName || "",
							e.remark || ""
						]).concat(invoices.length ? [[
							"合计",
							money(roll.invoice),
							"",
							"",
							"",
							""
						]] : [])
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
	const [q, setQ] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [scope, setScope] = (0, import_react.useState)("year");
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const list = (0, import_react.useMemo)(() => {
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
	const pager = usePager("contracts", list, [scope, status, q, year].join("|"));
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
	const printItems = (0, import_react.useMemo)(() => {
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
	(0, import_react.useEffect)(() => {
		if (!editing) return;
		const t = window.setTimeout(() => (document.getElementById("contract-scan") || document.getElementById("contract-editor"))?.scrollIntoView({
			behavior: "smooth",
			block: "start"
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
								className: "btn inline-flex items-center rounded-sm border border-line text-xs",
								href: "/api/file/contract-template",
								children: "下载模板"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractImport, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								className: "btn inline-flex items-center rounded-sm border border-line text-xs",
								href: `/api/file/contract-export?year=${year}`,
								children: [
									"导出 ",
									year,
									" 年合同"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "btn inline-flex items-center rounded-sm border border-line text-xs",
								href: "/api/file/contract-export",
								children: "导出全部合同"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								onClick: async () => {
									const wb = buildContractWorkbook({
										contracts,
										entries: contractEntries
									});
									const { writeCenteredXlsx } = await import("./xlsx-center-nSN794kD.js");
									const data = await writeCenteredXlsx(wb);
									const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
									const a = document.createElement("a");
									a.href = URL.createObjectURL(blob);
									a.download = "合同明细.xlsx";
									a.click();
									URL.revokeObjectURL(a.href);
								},
								children: "导出当前页"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								type: "button",
								onClick: printStatement,
								children: ["打印对账单", printItems.length ? `（${printItems.length}）` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => {
									setCreating(true);
									setEditing(emptyContract(year));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "新增合同"]
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
								children: "进度"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field-select mt-1 w-auto",
								value: status,
								onChange: (e) => setStatus(e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "全部"
								}), CONTRACT_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: s }, s))]
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
								placeholder: "项目名 / 项目号 / 总包 / 经营人员"
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-lg border border-line bg-bg-elevated px-4 py-3 text-xs leading-6 text-muted",
					children: [
						"两条线分开算，互不顶替：",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"报量线：含税报量 → ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-ink",
							children: "应收（含税报量×比例）"
						}),
						" → 已付（代付农民工+到分包）→",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-ink",
							children: "合同未付（应收−已付）"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"开票线：开票金额 → 已付 → ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-ink",
							children: "剩余款（开票金额−已付）"
						}),
						"。保证金、结算金额手填，不进这两条自动账。"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "合同金额",
							value: totals.amount
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
							label: "含税报量",
							value: totals.reportIncl
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
					onRemoveEntries: removeContractEntries
				}, editing.id) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageBar, {
					size: pager.size,
					onSize: pager.setSize,
					page: pager.page,
					onPage: pager.setPage,
					pages: pager.pages,
					total: pager.total
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "contracts",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "wide-table text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
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
									className: "sticky left-0 z-10 bg-surface p-3",
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
									className: "sticky left-14 z-10 bg-surface p-3 shadow-[2px_0_0_var(--color-line)]",
									children: "项目名称"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "min-w-[5.5rem] whitespace-nowrap p-3",
									"data-col-lock": "1",
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
									children: "代付农民工"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "到分包公司"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThHint, {
									hint: "应收−已付",
									children: "合同未付"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThHint, {
									hint: "开票金额−已付",
									children: "剩余款"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "保证金"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "经营人员"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "进度"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "备注"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 25,
							className: "p-6 text-muted",
							children: "还没有合同。点右上角新增，或到「导入导出」导入原来的合同管理表。"
						}) }) : null, pageRows.map((c, i) => {
							const r = contractRollup(c, contractEntries);
							const on = editing?.id === c.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: `group border-b border-line last:border-0 hover:bg-accent-soft ${on || selected.includes(c.id) ? "bg-accent-soft" : ""}`,
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
											children: "更改"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `sticky left-0 z-10 p-2 tabular-nums text-muted ${on ? "bg-accent-soft" : "bg-surface"} group-hover:bg-accent-soft`,
										children: (pager.page - 1) * pager.size + i + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 tabular-nums",
										children: c.year
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 font-mono text-xs",
										children: c.code || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `sticky left-14 z-10 p-2 font-medium shadow-[2px_0_0_var(--color-line)] ${on ? "bg-accent-soft" : "bg-surface"} group-hover:bg-accent-soft`,
										children: c.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "min-w-[5.5rem] whitespace-nowrap p-2",
										children: c.scanFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "ok",
											children: "有合同"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted",
											children: "无合同"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-muted",
										children: c.contractor || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-muted",
										children: c.subcontractor || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(c.contractAmount)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-2 text-right tabular-nums",
										children: [c.taxRate || 0, "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2",
										children: c.reportTaxMode === "incl" ? "含税" : "不含税"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(c.reportTaxMode === "incl" ? r.reportIncl : r.reportExcl)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-2 text-right tabular-nums",
										children: [c.payRatio || 0, "%"]
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
										children: money(r.workerPay)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(r.subPay)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right tabular-nums",
										children: money(r.dueRemain)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2 text-right font-medium tabular-nums",
										children: money(r.remain)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2",
										children: c.hasDeposit ? `¥${money(c.depositAmount)}` : "无"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2",
										children: c.manager || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: ["在建", "完工", "结算完成", "结算已开票", "完成"].includes(c.status) ? "ok" : ["总版图", "初审", "终审", "分包结算", "质保期", "退质保金"].includes(c.status) ? "warn" : void 0,
											children: CONTRACT_STATUSES.includes(c.status) ? c.status : c.status === "审计" ? "终审" : c.status === "结算" ? "分包结算" : c.status
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "max-w-40 truncate p-2 text-muted",
										children: c.remark
									})
								]
							}, c.id);
						})] })]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractStatementSheets, { items: printItems })] })
	});
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
function ContractEditor({ draft, creating, entries, onCancel, onSave, onAddEntry, onRemoveEntries }) {
	const [c, setC] = (0, import_react.useState)(draft);
	const roll = contractRollup(c, entries);
	function patch(key, value) {
		setC((prev) => ({
			...prev,
			[key]: value
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "contract-editor",
		className: "space-y-4 rounded-xl border border-accent bg-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
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
									hasDeposit: "保证金",
									depositAmount: "保证金金额",
									manager: "经营人员",
									status: "项目进度",
									prelimAmount: "初审金额",
									settleReceivable: "结算金额",
									remark: "备注",
									scanFileName: "合同电子版"
								})) return;
								onSave({
									...c,
									id: c.id || uid()
								});
							},
							children: "保存合同信息"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContractScanBox, {
				contract: c,
				onFileName: (name) => {
					setC((prev) => {
						const next = {
							...prev,
							scanFileName: name,
							id: prev.id || uid()
						};
						queueMicrotask(() => onSave(next));
						return next;
					});
				}
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
						label: "项目进度",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "field-select w-full",
							value: CONTRACT_STATUSES.includes(c.status) ? c.status : c.status === "审计" ? "终审" : c.status === "结算" ? "分包结算" : "在建",
							onChange: (e) => patch("status", e.target.value),
							children: CONTRACT_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: s }, s))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "合同金额 / 结算金额",
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
						label: "报量按",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field-select w-full",
							value: c.reportTaxMode || "excl",
							onChange: (e) => patch("reportTaxMode", e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "excl",
								children: "不含税金额"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "incl",
								children: "含税金额"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "合同付款比例 %",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							step: "0.01",
							value: c.payRatio,
							onChange: (e) => patch("payRatio", Number(e.target.value) || 0)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "应收（含税报量×合同比例）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							readOnly: true,
							value: money(roll.payable)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "已付（代付+到分包）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							readOnly: true,
							value: money(roll.receipt)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "合同未付（应收−已付）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							readOnly: true,
							value: money(roll.dueRemain)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "剩余款（开票金额−已付）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							readOnly: true,
							value: money(roll.remain)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "质保期开始",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: c.warrantyStart,
							onChange: (e) => patch("warrantyStart", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "质保期结束",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: c.warrantyEnd,
							onChange: (e) => patch("warrantyEnd", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "是否有保证金",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field-select w-full",
							value: c.hasDeposit ? "yes" : "no",
							onChange: (e) => patch("hasDeposit", e.target.value === "yes"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "no",
								children: "无"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "yes",
								children: "有"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "保证金金额",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							step: "0.01",
							disabled: !c.hasDeposit,
							value: c.depositAmount,
							onChange: (e) => patch("depositAmount", Number(e.target.value) || 0)
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
	const named = renameFile(file, uniqueBase(base, taken));
	const saved = await setDoc(id, kind, named) || named.name;
	return saved;
}
function useTakenNames() {
	const entries = useApp((s) => s.contractEntries);
	const docs = useApp((s) => s.attendanceDocs);
	return [
		...entries.map((e) => e.fileName),
		...entries.map((e) => e.workerFileName),
		...(docs || []).map((d) => d.fileName)
	].filter(Boolean);
}
function ReportBook({ contract, entries, disabled, onAdd, onRemove }) {
	const [date, setDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [amount, setAmount] = (0, import_react.useState)(0);
	const [no, setNo] = (0, import_react.useState)("");
	const [remark, setRemark] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)();
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
						fileName: file?.name || "",
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
	const [date, setDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [incl, setIncl] = (0, import_react.useState)(0);
	const [excl, setExcl] = (0, import_react.useState)(0);
	const [rate, setRate] = (0, import_react.useState)(contract.taxRate || 9);
	const [no, setNo] = (0, import_react.useState)("");
	const [remark, setRemark] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)();
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
						fileName: file?.name || "",
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
	const [date, setDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [amount, setAmount] = (0, import_react.useState)(0);
	const [payTo, setPayTo] = (0, import_react.useState)("sub");
	const [no, setNo] = (0, import_react.useState)("");
	const [remark, setRemark] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)();
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-muted",
				children: [
					"代付农民工和到分包公司分开记、日期可以不同。文件名：项目名-月份。代付 ¥",
					money(workers),
					" · 分包 ¥",
					money(subs),
					"。"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "field-select w-full",
						value: payTo,
						disabled,
						onChange: (e) => setPayTo(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "sub",
							children: "到分包公司"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "worker",
							children: "总包代付农民工"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: date,
						onChange: (e) => setDate(e.target.value),
						disabled
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						step: "0.01",
						value: amount || "",
						onChange: (e) => setAmount(Number(e.target.value) || 0),
						disabled,
						placeholder: "金额"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: no,
						onChange: (e) => setNo(e.target.value),
						disabled,
						placeholder: "回单号"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: remark,
						onChange: (e) => setRemark(e.target.value),
						disabled,
						placeholder: "备注"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocPick, {
						label: `影像资料（将存为 ${base}）`,
						fileName: file?.name || "",
						disabled,
						onFile: setFile
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
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
							toast.success(payTo === "worker" ? "已记代付农民工" : "已记到分包公司");
						},
						children: ["记一笔", payTo === "worker" ? "代付农民工" : "到分包"]
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
							e.payTo === "worker" ? "代付农民工" : "到分包",
							" ¥",
							money(e.amount)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-muted",
						children: e.remark
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileLink, {
						id: e.id,
						kind: "receipt",
						fileName: e.fileName,
						suggest: e.payTo === "worker" ? receiptWorkerBase(contract.name, e.date) : receiptSubBase(contract.name, e.date)
					})
				] })
			})
		]
	});
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
		}) : null, entries.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "contract-scan",
		className: "rounded-lg border-2 border-dashed border-accent bg-accent-soft p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex flex-wrap items-center justify-between gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-semibold",
							children: "合同电子版（扫描件）"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs text-muted",
							children: "点绿色按钮或把 PDF / 照片拖进来。上传后立刻算有合同，不用再点保存。文件名是「项目名称-合同电子版」。没传就是无合同，原因写备注。"
						})
					] }),
					contract.scanFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "ok",
						children: "有合同"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "无合同" })
				]
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
					const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".pdf";
					const named = new File([file], `${base}${ext}`, {
						type: file.type,
						lastModified: file.lastModified
					});
					const saved = await setDoc(contract.id, "contract", named) || named.name;
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
					taken: [],
					onDeleted: () => onFileName("")
				})
			})
		]
	});
}
export { ContractsPage as component };
