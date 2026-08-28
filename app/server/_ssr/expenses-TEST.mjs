import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Plus, o as Trash2, t as X } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as Input, f as Button, ft as confirmBatchDelete, gt as uid, ht as toggleSel, mt as money, o as Label, y as useApp } from "./router-DxdzlCp3.mjs";
import { n as DocActions, s as removeDoc, u as setDoc } from "./doc-actions-CoPSki7O.mjs";
import { n as WideTable } from "./wide-table-D8rPvj0E.mjs";
import { n as FilePick } from "./file-pick-BbqxzWa5.mjs";
import { n as Need } from "./can-gkGWV5bu.mjs";
import { t as Badge } from "./badge-U3vNDWCk.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();

var PAY_METHODS = ["现金", "转账", "微信", "支付宝", "对公", "其他"];
var SAMPLE = [
	["房租", "2026/3月-12月", "2026-03-01", "月", 1000, 10, 1e4, ""],
	["打印机", "2026/4/9", "2026-04-09", "台", 1, 2649, 2649, ""],
	["水果", "2026/5/12", "2026-05-12", "项", 1, 336.95, 336.95, ""],
	["阀门检测费用", "2026/5/18", "2026-05-18", "项", 1, 3070, 3070, ""],
	["阀门合格证", "2026/5/18", "2026-05-18", "项", 1, 260, 260, ""],
	["水果", "2026/5/22", "2026-05-22", "项", 1, 338.98, 338.98, ""],
	["水果", "2026/5/23", "2026-05-23", "项", 1, 413.47, 413.47, ""],
	["圣女果", "2026/6/15", "2026-06-15", "项", 1, 509, 509, ""],
	["冰淇淋", "2026/8/3", "2026-08-03", "项", 1, 614, 614, ""],
	["张钰", "2026/8/2", "2026-08-02", "项", 1, 1e3, 1e3, ""],
	["标书（精整修磨）", "2026/8/3", "2026-08-03", "项", 4, 1e3, 4e3, ""]
];

function safeBase(s) {
	return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
function needsVoucher(method) {
	return (method || "现金") !== "现金";
}
function emptyExpense(year) {
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	return {
		id: uid(),
		year,
		name: "",
		period: today,
		date: today,
		unit: "项",
		qty: 1,
		price: 0,
		amount: 0,
		remark: "",
		payMethod: "现金",
		status: "未报销",
		reimbursedAt: "",
		voucherId: "",
		voucherFileName: ""
	};
}
function voucherBase(items) {
	if (!items.length) return "报销凭证";
	if (items.length === 1) return `${safeBase(items[0].name)}-${items[0].amount}`;
	const bits = items.slice(0, 3).map((e) => `${safeBase(e.name)}-${e.amount}`);
	let n = bits.join("+");
	if (items.length > 3) n += `等${items.length}笔`;
	return n.slice(0, 80);
}
function round2(n) {
	return Math.round((Number(n) || 0) * 100) / 100;
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: label }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1",
				children
			})
		]
	});
}
function Mini({ label, value, hint }) {
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

function ExpensesPage() {
	const { year, expenses, upsertExpense, removeExpenses, replaceExpenses } = useApp();
	const list = expenses || [];
	const [q, setQ] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [scope, setScope] = (0, import_react.useState)("year");
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [printFrom, setPrintFrom] = (0, import_react.useState)("");
	const [printTo, setPrintTo] = (0, import_react.useState)("");
	const [printStatus, setPrintStatus] = (0, import_react.useState)("未报销");
	const [printImages, setPrintImages] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!editing) return;
		const t = window.setTimeout(() => document.getElementById("expense-editor")?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		}), 50);
		return () => window.clearTimeout(t);
	}, [editing && editing.id]);
	const shown = (0, import_react.useMemo)(() => {
		let rows = list;
		if (scope === "year") rows = rows.filter((e) => e.year === year);
		if (status !== "all") rows = rows.filter((e) => e.status === status);
		if (q.trim()) {
			const s = q.trim();
			rows = rows.filter((e) => [e.name, e.period, e.remark, e.payMethod].some((x) => (x || "").includes(s)));
		}
		return rows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
	}, [list, year, scope, status, q]);
	const allChecked = shown.length > 0 && shown.every((e) => selected.includes(e.id));
	const totals = shown.reduce((s, e) => {
		s.amount += e.amount || 0;
		if (e.status === "未报销") s.open += e.amount || 0;
		else s.done += e.amount || 0;
		if (needsVoucher(e.payMethod) && !e.voucherFileName) s.missing += 1;
		return s;
	}, {
		amount: 0,
		open: 0,
		done: 0,
		missing: 0
	});
	const printRows = (0, import_react.useMemo)(() => {
		let rows = selected.length ? list.filter((e) => selected.includes(e.id)) : shown;
		if (printStatus !== "all") rows = rows.filter((e) => e.status === printStatus);
		if (printFrom) rows = rows.filter((e) => (e.date || "") >= printFrom);
		if (printTo) rows = rows.filter((e) => (e.date || "") <= printTo);
		return rows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
	}, [selected, list, shown, printStatus, printFrom, printTo]);
	function del(ids) {
		if (!ids.length) return;
		if (!confirmBatchDelete("报销", ids.length, "会同时去掉这些报销记录。凭证文件还在目录里，可到「影像资料」里清。")) return;
		removeExpenses(ids);
		setSelected((s) => s.filter((id) => !ids.includes(id)));
		if (editing && ids.includes(editing.id)) {
			setEditing(null);
			setCreating(false);
		}
		toast.success("已删除报销");
	}
	function loadSample() {
		if (!confirm("载入 11 笔示例（房租、打印机、水果等），方便试打印。不会删你已有的记录。")) return;
		SAMPLE.forEach((row) => {
			upsertExpense({
				...emptyExpense(year),
				name: row[0],
				period: row[1],
				date: row[2],
				unit: row[3],
				qty: row[4],
				price: row[5],
				amount: row[6],
				remark: row[7],
				payMethod: "现金",
				status: "未报销"
			});
		});
		toast.success("已加入 11 笔示例，可勾选后点打印");
	}
	function doPrint() {
		if (!printRows.length) {
			toast.error("当前没有可打印的报销。可勾选几笔，或把打印范围改成「未报销」。");
			return;
		}
		window.print();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "expenses.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-2xl font-semibold",
									children: "报销单"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 max-w-2xl text-sm text-muted",
									children: "现金不用传凭证，转账/微信等要传。几笔可以共用一张凭证，文件名按「项目名称-金额」。未报销的可以勾选后打印。这是测试版，先试用再定细节。"
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										type: "button",
										onClick: loadSample,
										children: "载入示例 11 笔"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										onClick: () => {
											setCreating(true);
											setEditing(emptyExpense(year));
										},
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }),
											"新增报销"
										]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "年份"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: scope,
										onChange: (e) => setScope(e.target.value),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
												value: "year",
												children: [year, "年"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "all",
												children: "全部年份"
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "状态"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: status,
										onChange: (e) => setStatus(e.target.value),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "all",
												children: "全部"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "未报销",
												children: "未报销"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "已报销",
												children: "已报销"
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "min-w-48 flex-1 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "搜索"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "mt-1",
										value: q,
										onChange: (e) => setQ(e.target.value),
										placeholder: "项目 / 备注 / 支付方式"
									})
								]
							}),
							selected.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "danger",
								type: "button",
								onClick: () => del(selected),
								children: ["删除所选（", selected.length, "）"]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-accent bg-accent-soft p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "打印哪些"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: printStatus,
										onChange: (e) => setPrintStatus(e.target.value),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "未报销",
												children: "未报销"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "已报销",
												children: "已报销"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "all",
												children: "全部状态"
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "购买时间从"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "mt-1",
										type: "date",
										value: printFrom,
										onChange: (e) => setPrintFrom(e.target.value)
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "到"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "mt-1",
										type: "date",
										value: printTo,
										onChange: (e) => setPrintTo(e.target.value)
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								type: "button",
								onClick: doPrint,
								children: ["打印报销单", printRows.length ? `（${printRows.length}）` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted",
										children: "影像资料"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: printImages ? "yes" : "no",
										onChange: (e) => setPrintImages(e.target.value === "yes"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "no",
												children: "不打印"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "yes",
												children: "打印"
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "w-full text-xs text-muted",
								children: selected.length ? `已勾选 ${selected.length} 笔，打印时只用勾选的（再按上面的状态和日期过滤）。` : "没勾选就打印当前列表里符合条件的。建议先筛「未报销」。"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								label: "本表合计",
								value: totals.amount
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								label: "未报销",
								value: totals.open
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								label: "已报销",
								value: totals.done
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
								label: "缺凭证",
								hint: "非现金且还没传",
								value: totals.missing
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
						id: "expenses",
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
												onChange: (e) => setSelected(e.target.checked ? shown.map((r) => r.id) : []),
												"aria-label": "全选报销"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "序号" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "项目" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "购买时间" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "单位" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "数量" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "单价" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "金额" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "支付" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "状态" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "票据" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "备注" })
									] })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
									shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 12,
										className: "p-6 text-muted",
										children: "还没有报销。点右上角新增，或先「载入示例 11 笔」试打印。"
									}) }) : null,
									shown.map((e, i) => {
										const on = editing?.id === e.id;
										const miss = needsVoucher(e.payMethod) && !e.voucherFileName;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: `group cursor-pointer border-b border-line last:border-0 hover:bg-accent-soft ${on ? "bg-accent-soft" : ""}`,
											onClick: () => {
												setCreating(false);
												setEditing(e);
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "p-2",
													onClick: (ev) => ev.stopPropagation(),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "checkbox",
														className: "size-4",
														checked: selected.includes(e.id),
														onChange: (ev) => setSelected((s) => toggleSel(s, e.id, ev.target.checked)),
														"aria-label": `选择 ${e.name}`
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2 tabular-nums text-muted", children: i + 1 }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2 font-medium", children: e.name }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2", children: e.period || e.date }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2", children: e.unit }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2 text-right tabular-nums", children: e.qty }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2 text-right tabular-nums", children: money(e.price) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2 text-right tabular-nums font-medium", children: money(e.amount) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "p-2", children: e.payMethod }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "p-2",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														tone: e.status === "已报销" ? "ok" : "warn",
														children: e.status
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "p-2 text-xs",
													children: e.payMethod === "现金" ? "现金无需凭证" : e.voucherFileName ? e.voucherFileName : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-warn",
														children: "缺凭证"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "max-w-40 truncate p-2 text-muted", children: e.remark })
											]
										}, e.id);
									})
								] })
							]
						})
					}),
					editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseEditor, {
						draft: editing,
						creating,
						all: list,
						selectedIds: selected,
						onCancel: () => {
							setEditing(null);
							setCreating(false);
						},
						onSave: (row) => {
							upsertExpense(row);
							setEditing(row);
							setCreating(false);
							toast.success("报销已保存");
						},
						onDelete: () => del([editing.id])
					}, editing.id) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseSheets, {
				rows: printRows,
				withImages: printImages
			})
		] })
	});
}

function ExpenseEditor({ draft, creating, all, selectedIds, onCancel, onSave, onDelete }) {
	const [c, setC] = (0, import_react.useState)(draft);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);
	function patch(key, value) {
		setC((prev) => {
			const next = {
				...prev,
				[key]: value
			};
			if (key === "qty" || key === "price") next.amount = round2((key === "qty" ? value : next.qty) * (key === "price" ? value : next.price));
			return next;
		});
	}
	const existingVouchers = [];
	const seen = /* @__PURE__ */ new Set();
	for (const e of all) {
		if (!e.voucherId || !e.voucherFileName || e.voucherId === c.voucherId) continue;
		if (seen.has(e.voucherId)) continue;
		seen.add(e.voucherId);
		existingVouchers.push(e);
	}
	const shareTargets = (all || []).filter((e) => selectedIds.includes(e.id) || e.id === c.id);
	async function uploadVoucher(file) {
		if (!file) return;
		if (!c.name.trim()) {
			toast.error("先填项目名称，凭证按「项目名称-金额」保存");
			return;
		}
		const group = shareTargets.length > 1 ? shareTargets.map((e) => e.id === c.id ? c : e) : [c];
		const vid = c.voucherId || uid();
		const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".pdf";
		const named = new File([file], `${voucherBase(group)}${ext}`, {
			type: file.type,
			lastModified: file.lastModified
		});
		await setDoc(vid, "expense", named);
		const next = {
			...c,
			id: c.id || uid(),
			voucherId: vid,
			voucherFileName: named.name
		};
		setC(next);
		onSave(next);
		for (const e of group) {
			if (e.id === next.id) continue;
			onSave({
				...e,
				voucherId: vid,
				voucherFileName: named.name
			});
		}
		toast.success(group.length > 1 ? `已保存凭证，并挂到勾选的 ${group.length} 笔` : `已保存 ${named.name}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "expense-editor",
		className: "space-y-4 rounded-xl border border-accent bg-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: creating ? "新增报销" : c.name || "编辑报销"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: c.status === "已报销" ? "ok" : "warn",
								children: c.status
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex size-10 items-center justify-center rounded-sm text-2xl leading-none text-muted hover:bg-accent-soft hover:text-ink",
								"aria-label": "关闭",
								title: "关闭（Esc）",
								onClick: onCancel,
								children: "×"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								onClick: onCancel,
								children: "关闭"
							}),
							!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "danger",
								type: "button",
								onClick: onDelete,
								children: "删除"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: () => {
									if (!c.name.trim()) {
										toast.error("项目名称必填");
										return;
									}
									if (needsVoucher(c.payMethod) && !c.voucherFileName && !confirm("这不是现金，还没上传凭证。仍要保存？")) return;
									onSave({
										...c,
										id: c.id || uid(),
										amount: round2(c.amount || c.qty * c.price)
									});
								},
								children: "保存报销信息"
							})
						]
					})
				]
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
						label: "项目 *",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: c.name,
							onChange: (e) => patch("name", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "购买时间（显示）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: c.period,
							onChange: (e) => patch("period", e.target.value),
							placeholder: "如 2026/3月-12月 或 2026/4/9"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "筛选/打印用日期",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: c.date,
							onChange: (e) => {
								const v = e.target.value;
								setC((prev) => ({
									...prev,
									date: v,
									period: prev.period && prev.period !== prev.date ? prev.period : v
								}));
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "单位",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: c.unit,
							onChange: (e) => patch("unit", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "数量",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							step: "0.01",
							value: c.qty,
							onChange: (e) => patch("qty", Number(e.target.value) || 0)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "单价",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							step: "0.01",
							value: c.price,
							onChange: (e) => patch("price", Number(e.target.value) || 0)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "金额",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							step: "0.01",
							value: c.amount,
							onChange: (e) => patch("amount", Number(e.target.value) || 0)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "支付方式",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "field-select w-full",
							value: c.payMethod || "现金",
							onChange: (e) => patch("payMethod", e.target.value),
							children: PAY_METHODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: m }, m))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "报销状态",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field-select w-full",
							value: c.status,
							onChange: (e) => patch("status", e.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "未报销" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "已报销" })
							]
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border-2 border-dashed border-accent bg-accent-soft p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex flex-wrap items-center justify-between gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-semibold",
									children: "报销凭证"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs text-muted",
									children: c.payMethod === "现金" ? "现金支付不需要电子凭证，可以不传。" : "转账/微信等需要凭证。勾选多笔再上传，会共用这一张。文件名是「项目名称-金额」。存在 data/photos/报销凭证/。"
								})
							] }),
							c.payMethod === "现金" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "现金无需凭证" }) : c.voucherFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "ok",
								children: "已有凭证"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "warn",
								children: "缺凭证"
							})
						]
					}),
					existingVouchers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mb-2 block text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: "挂到已有凭证（几笔一张）"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field-select mt-1 w-full",
								value: c.voucherId || "",
								onChange: (e) => {
									const id = e.target.value;
									if (!id) {
										patch("voucherId", "");
										patch("voucherFileName", "");
										return;
									}
									const hit = existingVouchers.find((x) => x.voucherId === id);
									setC((prev) => ({
										...prev,
										voucherId: id,
										voucherFileName: hit?.voucherFileName || prev.voucherFileName
									}));
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "不挂，单独上传"
									}),
									existingVouchers.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: e.voucherId,
										children: e.voucherFileName
									}, e.voucherId))
								]
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePick, {
						kind: "file",
						accept: ".pdf,.ofd,.jpg,.jpeg,.png,.webp",
						label: c.voucherFileName ? "更换报销凭证" : "上传报销凭证",
						hint: c.voucherFileName ? `已选：${c.voucherFileName}` : shareTargets.length > 1 ? `将挂到勾选的 ${shareTargets.length} 笔` : "支持 PDF、照片",
						onFile: uploadVoucher
					}),
					c.voucherFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
							id: c.voucherId || c.id,
							kind: "expense",
							fileName: c.voucherFileName,
							suggest: voucherBase([c]),
							taken: [],
							onDeleted: () => {
								const next = {
									...c,
									voucherFileName: "",
									voucherId: ""
								};
								setC(next);
								onSave(next);
							}
						})
					}) : null
				]
			})
		]
	});
}

function ExpenseSheets({ rows, withImages }) {
	if (!rows.length) return null;
	const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const total = rows.reduce((s, e) => s + (e.amount || 0), 0);
	const images = withImages ? rows.filter((e) => e.voucherId && e.voucherFileName && !/\.pdf$/i.test(e.voucherFileName)) : [];
	const seen = /* @__PURE__ */ new Set();
	const uniqImgs = [];
	for (const e of images) {
		if (seen.has(e.voucherId)) continue;
		seen.add(e.voucherId);
		uniqImgs.push(e);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "print-only space-y-8 text-black",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "statement border border-black p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
						className: "border-b border-black pb-2 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-semibold tracking-widest",
							children: "报销单"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "mt-3 w-full border-collapse text-center text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: ["序号", "项目", "购买时间", "单位", "数量", "单价", "金额", "备注", "票据"].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "border border-black px-1 py-1 font-medium",
								children: h
							}, h)) }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
								rows.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
									i + 1,
									e.name,
									e.period || e.date,
									e.unit,
									e.qty,
									money(e.price),
									money(e.amount),
									e.remark || "",
									e.payMethod === "现金" ? "现金" : e.voucherFileName || "—"
								].map((v, k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1",
									children: v
								}, k)) }, e.id)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
									"合计",
									"",
									"",
									"",
									"",
									"",
									money(total),
									"",
									""
								].map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1 font-medium",
									children: v
								}, i)) })
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-right text-xs",
						children: ["打印日期 ", today]
					})
				]
			}),
			uniqImgs.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "statement border border-black p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 text-sm font-semibold",
						children: e.voucherFileName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: `/api/doc?id=${encodeURIComponent(e.voucherId)}&kind=expense`,
						alt: e.voucherFileName,
						className: "max-h-[240mm] w-full object-contain"
					})
				]
			}, e.voucherId))
		]
	});
}
export { ExpensesPage as component };
