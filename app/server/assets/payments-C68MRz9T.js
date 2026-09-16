import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-DmHFMYGr.js";
import { a as money, n as confirmBatchDelete, o as toggleSel } from "./utils-DAXmXjMk.js";
import { A as parseDateYmd, C as dateYear, D as localToday, M as ymKey, T as derivedYears } from "./contracts-C16PbAcF.js";
import "./excel-DwZvPPDs.js";
import { n as useApp } from "./store-Etc-JQR_.js";
import { i as toast } from "./audit-menbPLKJ.js";
import "./file-pick-CeHp-goj.js";
import { t as Button } from "./button-CTGswd-b.js";
import { n as Label, t as Input } from "./input-BbLLN7y8.js";
import { t as Badge } from "./badge-CuXWhVV4.js";
import { n as WideTable, r as usePager } from "./wide-table-BuOwqDCU.js";
import { n as Need } from "./can-Dcxfj09G.js";
import { c as TplLink, o as PaymentImport } from "./excel-import-D-dR3IWn.js";
import { t as useGuardedClose } from "./confirm-close-DxIuW849.js";
import { n as monthsInRange, r as rangeLabel, t as YmPick } from "./ym-pick-Dcjwoxd1.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
const ALL_BUCKETS = "__all__";
function groupBuckets(values, emptyLabel) {
	const seen = /* @__PURE__ */ new Set();
	let hasEmpty = false;
	for (const raw of values) {
		const v = String(raw ?? "").trim();
		if (!v) hasEmpty = true;
		else seen.add(v);
	}
	const out = [...seen].sort((a, b) => a.localeCompare(b, "zh")).map((value) => ({
		value,
		label: value,
		empty: false
	}));
	if (hasEmpty) out.push({
		value: "",
		label: emptyLabel,
		empty: true
	});
	return out;
}
function inBucket(value, bucket) {
	if (bucket === "__all__") return true;
	return String(value ?? "").trim() === bucket;
}
function paymentsInRange(payments, lo, hi) {
	return payments.filter((p) => {
		const d = parseDateYmd(p.date) || p.date;
		if (!d) return true;
		const y = Number(d.slice(0, 4));
		const m = Number(d.slice(5, 7));
		if (!y || !m) return true;
		const k = ymKey(y, m);
		return k >= lo && k <= hi;
	});
}
function filterPayments(ranged, f) {
	let list = ranged;
	if (f.status === "pending") list = list.filter((p) => !p.date);
	if (f.status === "paid") list = list.filter((p) => Boolean(p.date));
	if (f.source !== "__all__") list = list.filter((p) => inBucket(p.source, f.source));
	if (f.q.trim()) {
		const s = f.q.trim();
		list = list.filter((p) => [p.owner, p.receiver].some((x) => (x || "").includes(s)));
	}
	return list;
}
function paymentSummary(rows) {
	const pending = rows.filter((p) => !p.date);
	const paid = rows.filter((p) => p.date);
	return {
		count: rows.length,
		total: rows.reduce((s, p) => s + (p.amount || 0), 0),
		paidAmt: paid.reduce((s, p) => s + p.amount, 0),
		pendingCount: pending.length,
		pendingAmt: pending.reduce((s, p) => s + p.amount, 0),
		proxyCount: rows.filter((p) => p.owner !== p.receiver).length
	};
}
function byOwnerRows(rows) {
	const map = /* @__PURE__ */ new Map();
	for (const p of rows) {
		if (!p.date) continue;
		const cur = map.get(p.owner) || {
			owner: p.owner,
			count: 0,
			amount: 0,
			proxyCount: 0
		};
		cur.count += 1;
		cur.amount += p.amount || 0;
		if (p.owner !== p.receiver) cur.proxyCount += 1;
		map.set(p.owner, cur);
	}
	return [...map.values()].sort((a, b) => b.amount - a.amount || a.owner.localeCompare(b.owner, "zh"));
}
function sourceBuckets(ranged) {
	return groupBuckets(ranged.map((p) => p.source), "未填发放方");
}
function printOwnerBuckets(rows) {
	return groupBuckets(byOwnerRows(rows).map((r) => r.owner), "（未填实际收款人）");
}
function detailSections(rows, owner) {
	const byOwner = byOwnerRows(rows);
	const wanted = owner === "__all__" ? byOwner.map((r) => r.owner) : byOwner.filter((r) => inBucket(r.owner, owner)).map((r) => r.owner);
	const order = new Map(byOwner.map((r, i) => [r.owner, i]));
	return wanted.map((name) => {
		const mine = rows.filter((p) => p.date && inBucket(p.owner, name)).slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
		return {
			owner: name,
			rows: mine,
			count: mine.length,
			amount: mine.reduce((s, p) => s + (p.amount || 0), 0),
			proxyCount: mine.filter((p) => p.owner !== p.receiver).length
		};
	}).filter((s) => s.rows.length > 0).sort((a, b) => (order.get(a.owner) ?? 0) - (order.get(b.owner) ?? 0));
}
function printSummary(rows, owner) {
	const list = byOwnerRows(rows);
	return owner === "__all__" ? list : list.filter((r) => inBucket(r.owner, owner));
}
function printTotals(rows) {
	const paid = rows.filter((p) => p.date);
	return {
		count: paid.length,
		amount: paid.reduce((s, p) => s + (p.amount || 0), 0)
	};
}
function sectionTotals(sections) {
	return {
		count: sections.reduce((s, x) => s + x.count, 0),
		amount: sections.reduce((s, x) => s + x.amount, 0)
	};
}
function ownerTotals(rows) {
	return {
		count: rows.reduce((s, x) => s + x.count, 0),
		amount: rows.reduce((s, x) => s + x.amount, 0)
	};
}
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function PaymentSheets({ mode, label, filterText, sections, summary, totals, printOwner }) {
	if (!totals.count) return null;
	const today = localToday();
	const heads = mode === "detail" ? [
		"序号",
		"发放日期",
		"实际收款人",
		"收款人",
		"发放方",
		"金额（元）",
		"备注"
	] : [
		"序号",
		"实际收款人",
		"笔数",
		"合计金额（元）",
		"备注"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only space-y-8 text-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "statement border border-black p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "border-b border-black pb-2 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xl font-semibold tracking-widest",
							children: ["发放记录 · ", mode === "detail" ? "明细清单" : "汇总清单"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-sm",
							children: [
								label,
								" · ",
								filterText
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-0.5 text-[11px]",
							children: "口径：只计已填发放日期的记录；待发放不算已发。"
						})
					]
				}),
				mode === "detail" ? sections.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-3 break-inside-avoid",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm font-semibold",
						children: [
							"实际收款人：",
							s.owner || "（未填）",
							" · ",
							s.count,
							" 笔 · ¥",
							money(s.amount)
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "mt-1 w-full border-collapse text-center text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: heads.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "border border-black px-1 py-1 font-medium",
							children: h
						}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [s.rows.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: p.date
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: p.owner || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "border border-black px-1 py-1",
								children: [p.receiver || p.owner || "—", p.owner !== p.receiver ? "（代收）" : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: p.source || "未填发放方"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 tabular-nums",
								children: money(p.amount || 0)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 text-left",
								children: p.remark || ""
							})
						] }, p.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "border border-black px-1 py-1 font-medium",
								colSpan: 5,
								children: ["小计", s.proxyCount ? `（含代收 ${s.proxyCount} 笔）` : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 font-semibold tabular-nums",
								children: money(s.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "border border-black px-1 py-1",
								children: [s.count, " 笔"]
							})
						] })] })]
					})]
				}, s.owner || "__empty__")) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-3 w-full border-collapse text-center text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: heads.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "border border-black px-1 py-1 font-medium",
							children: h
						}, h)) }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: summary.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: r.owner || "（未填）"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 tabular-nums",
								children: r.count
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 tabular-nums",
								children: money(r.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 text-left",
								children: r.proxyCount ? `含代收 ${r.proxyCount} 笔` : ""
							})
						] }, r.owner || "__empty__")) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "border border-black px-1 py-1 font-semibold",
								colSpan: 2,
								children: ["总计", printOwner === "__all__" ? "（全部实际收款人）" : ""]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 font-semibold tabular-nums",
								children: totals.count
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 font-semibold tabular-nums",
								children: money(totals.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "border border-black px-1 py-1" })
						] }) })
					]
				}),
				mode === "detail" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-right text-sm font-medium",
					children: [
						"总计 ",
						totals.count,
						" 笔 · ¥",
						money(totals.amount)
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-right text-xs",
					children: ["打印日期 ", today]
				})
			]
		})
	});
}
function emptyPayment() {
	return {
		id: "",
		owner: "",
		receiver: "",
		date: "",
		amount: 0,
		source: "",
		remark: ""
	};
}
function PaymentsPage() {
	const store = useApp();
	const { year, people, payments, addPayment, patchPayments, removePayments } = store;
	const names = people.map((p) => p.name);
	const years = derivedYears(store);
	const [q, setQ] = import_react.useState("");
	const [fromY, setFromY] = import_react.useState(year);
	const [fromM, setFromM] = import_react.useState(1);
	const [toY, setToY] = import_react.useState(year);
	const [toM, setToM] = import_react.useState(12);
	const [status, setStatus] = import_react.useState("all");
	const [batch, setBatch] = import_react.useState(ALL_BUCKETS);
	const [printOwner, setPrintOwner] = import_react.useState(ALL_BUCKETS);
	const [printMode, setPrintMode] = import_react.useState("detail");
	const [selected, setSelected] = import_react.useState([]);
	const [editing, setEditing] = import_react.useState(null);
	const [creating, setCreating] = import_react.useState(false);
	const [fillDate, setFillDate] = import_react.useState(() => localToday());
	const yearOpts = import_react.useMemo(() => {
		const set = new Set([
			...years,
			year,
			fromY,
			toY
		]);
		for (const p of payments) {
			const y = dateYear(p.date);
			if (y) set.add(y);
		}
		return [...set].sort((a, b) => a - b);
	}, [
		years,
		year,
		fromY,
		toY,
		payments
	]);
	const span = import_react.useMemo(() => monthsInRange(fromY, fromM, toY, toM), [
		fromY,
		fromM,
		toY,
		toM
	]);
	const lo = ymKey(span[0].year, span[0].month);
	const hi = ymKey(span[span.length - 1].year, span[span.length - 1].month);
	const label = rangeLabel(fromY, fromM, toY, toM);
	const ranged = import_react.useMemo(() => paymentsInRange(payments, lo, hi), [
		payments,
		lo,
		hi
	]);
	const batches = import_react.useMemo(() => sourceBuckets(ranged), [ranged]);
	const filtered = import_react.useMemo(() => filterPayments(ranged, {
		status,
		source: batch,
		q
	}), [
		ranged,
		batch,
		q,
		status
	]);
	const pager = usePager("payments", filtered, [
		status,
		batch,
		q,
		lo,
		hi
	].join("|"));
	const pageRows = pager.rows;
	const { pendingCount, pendingAmt, paidAmt, total, proxyCount } = paymentSummary(filtered);
	const ownerNames = [...new Set([...names, ...payments.map((p) => p.owner)].filter(Boolean))];
	const receiverNames = [...new Set([...names, ...payments.map((p) => p.receiver)].filter(Boolean))];
	const sources = [...new Set(payments.map((p) => p.source).filter(Boolean))];
	const allChecked = pageRows.length > 0 && pageRows.every((p) => selected.includes(p.id));
	const byOwner = import_react.useMemo(() => byOwnerRows(filtered), [filtered]);
	const printOwners = import_react.useMemo(() => printOwnerBuckets(filtered), [filtered]);
	const printOwnerLabel = printOwner === "__all__" ? "全部实际收款人" : printOwner || "（未填实际收款人）";
	const detail = import_react.useMemo(() => detailSections(filtered, printOwner), [filtered, printOwner]);
	const summary = import_react.useMemo(() => printSummary(filtered, printOwner), [filtered, printOwner]);
	const detailTotal = import_react.useMemo(() => sectionTotals(detail), [detail]);
	const summaryTotal = import_react.useMemo(() => ownerTotals(summary), [summary]);
	const printTotal = printOwner === "__all__" ? printTotals(filtered) : summaryTotal.count ? summaryTotal : detailTotal;
	function runPrint(kind) {
		if (!printTotal.count) {
			toast.error("当前筛选没有可打印的记录（待发放不算已发，只打已填日期的）");
			return;
		}
		if (kind === "detail" && !detail.length) {
			toast.error("当前筛选没有可打印的记录");
			return;
		}
		setPrintMode(kind);
		setTimeout(() => window.print(), 0);
	}
	function dropIds(ids, hint) {
		if (!ids.length) return;
		if (!confirmBatchDelete("发放记录", ids.length, "只删发放流水。人员档案和考勤不动。")) return;
		removePayments(ids);
		setSelected((s) => s.filter((id) => !ids.includes(id)));
		toast.success(hint);
	}
	function applyDate(ids, raw) {
		if (!ids.length) return;
		const d = parseDateYmd(raw) || raw.trim();
		if (!d) {
			toast.error("请选择或填写发放日期");
			return;
		}
		const overwrite = store.payments.filter((p) => ids.includes(p.id) && (p.date || "").trim() && p.date !== d).length;
		const msg = overwrite ? `给所选的 ${ids.length} 笔填发放日期「${d}」？\n\n其中 ${overwrite} 笔原来已有日期，会被一并改写成 ${d}，改完不能撤销（已发/待发汇总会跟着变）。` : `给所选的 ${ids.length} 笔填发放日期「${d}」？`;
		if (!confirm(msg)) return;
		patchPayments(ids, { date: d });
		setSelected([]);
		toast.success(`已给 ${ids.length} 笔补上日期 ${d}`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "payments.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: "发放记录"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-xl text-sm text-muted",
						children: "点「编辑」弹出编辑。点一行是勾选。点遮罩或 Esc 关闭。"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
								href: "/api/file/payment-template",
								filename: "发放记录导入模板.xlsx"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft",
								href: "/api/file/payment-export",
								children: "导出全部发放"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentImport, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: () => {
									setCreating(true);
									setEditing(emptyPayment());
								},
								children: "新增发放"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YmPick, {
							label: "从",
							years: yearOpts,
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
							years: yearOpts,
							y: toY,
							m: toM,
							onY: setToY,
							onM: setToM
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "w-full text-xs text-muted",
							children: [
								"当前查询：",
								label,
								" · 共 ",
								span.length,
								" 个月。待发放没有日期，会一直显示在列表里。"
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-xs",
							placeholder: "搜索实际收款人 / 收款人",
							value: q,
							onChange: (e) => setQ(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field-select w-auto max-w-xs",
							value: batch,
							onChange: (e) => setBatch(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: ALL_BUCKETS,
								children: "全部发放方"
							}), batches.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: b.value,
								children: b.label
							}, b.value || "__empty__"))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex rounded-full border border-line p-0.5 text-xs",
							children: [
								["all", "全部"],
								["pending", `待发放${pendingCount ? ` ${pendingCount}` : ""}`],
								["paid", "已发放"]
							].map(([k, label$1]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `h-8 rounded-full px-3 ${status === k ? "bg-accent text-accent-fg" : "text-muted"}`,
								onClick: () => setStatus(k),
								children: label$1
							}, k))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm text-muted",
							children: [
								filtered.length,
								" 笔 · 合计 ¥",
								money(total),
								status === "all" ? ` · 待发放 ¥${money(pendingAmt)}` : "",
								status === "paid" ? ` · 已发 ¥${money(paidAmt)}` : "",
								" · 代收 ",
								proxyCount,
								" 笔"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "field-select h-9 w-auto max-w-xs",
									value: printOwner,
									onChange: (e) => setPrintOwner(e.target.value),
									"aria-label": "打印的实际收款人",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: ALL_BUCKETS,
										children: "全部实际收款人"
									}), printOwners.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: b.value,
										children: b.label
									}, b.value || "__empty__"))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									type: "button",
									onClick: () => runPrint("detail"),
									disabled: !printTotal.count,
									children: ["打印明细", detail.length ? `（${printTotal.count} 笔）` : ""]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									type: "button",
									onClick: () => runPrint("summary"),
									disabled: !printTotal.count,
									children: "打印汇总"
								})
							]
						}),
						selected.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									className: "w-40",
									value: fillDate,
									onChange: (e) => setFillDate(e.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									type: "button",
									onClick: () => applyDate(selected, fillDate),
									children: [
										"给所选补日期（",
										selected.length,
										"）"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "danger",
									size: "sm",
									type: "button",
									onClick: () => dropIds(selected, `已删除 ${selected.length} 笔发放`),
									children: [
										"删除所选（",
										selected.length,
										"）"
									]
								})
							]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "payments",
					pager,
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
											const ids = pageRows.map((p) => p.id);
											setSelected((s) => e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id)));
										},
										"aria-label": "全选发放记录"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "操作"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "序号"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "实际收款人"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "发放日期"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "发放金额（元）"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "发放方"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "收款人"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "备注"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 9,
							className: "p-8 text-center text-sm text-muted",
							children: "还没有发放记录。点右上角「新增发放」。"
						}) }) : null, pageRows.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: `group border-b border-line last:border-0 hover:bg-accent-soft ${editing?.id === p.id || selected.includes(p.id) ? "bg-accent-soft" : ""}`,
							onClick: () => setSelected((s) => toggleSel(s, p.id, !s.includes(p.id))),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									onClick: (e) => e.stopPropagation(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "size-4",
										checked: selected.includes(p.id),
										onChange: (e) => setSelected((s) => toggleSel(s, p.id, e.target.checked)),
										"aria-label": `选择 ${p.owner} ${p.date}`
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									onClick: (e) => e.stopPropagation(),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										type: "button",
										onClick: () => {
											setCreating(false);
											setEditing(p);
										},
										children: "编辑"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 tabular-nums text-muted",
									children: (pager.page - 1) * pager.size + i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 font-medium",
									children: p.owner
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: p.date || /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "warn",
										children: "待发放"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "p-3 tabular-nums",
									children: ["¥", money(p.amount)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-muted",
									children: p.source
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "p-3",
									children: [p.receiver, p.owner !== p.receiver ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "warn",
										className: "ml-2",
										children: "代收"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "ml-2",
										children: "本人"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-muted",
									children: p.remark
								})
							]
						}, p.id))] })]
					})
				}),
				editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentEditor, {
					draft: editing,
					creating,
					ownerNames,
					receiverNames,
					sources,
					onCancel: () => {
						setEditing(null);
						setCreating(false);
					},
					onSave: (row) => {
						if (creating) {
							addPayment({
								owner: row.owner,
								receiver: row.receiver,
								date: row.date,
								amount: row.amount,
								source: row.source,
								remark: row.remark
							});
							toast.success(row.date ? row.receiver !== row.owner ? `已记到 ${row.owner} 头上，${row.receiver} 代收` : `已记到 ${row.owner} 头上` : `已上报 ${row.owner}，待发放`);
							setEditing(null);
							setCreating(false);
							return;
						}
						patchPayments([row.id], {
							owner: row.owner,
							receiver: row.receiver,
							date: row.date,
							amount: row.amount,
							source: row.source,
							remark: row.remark
						});
						setEditing(row);
						toast.success("发放已保存");
					},
					onDelete: () => {
						dropIds([editing.id], "已删除 1 笔发放");
						setEditing(null);
						setCreating(false);
					}
				}) : null,
				byOwner.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-x-auto rounded-xl border border-line bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "按实际收款人入账（只计已填日期的；待发放不算已发）"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [
								"共 ",
								byOwner.length,
								" 人 · ",
								byOwner.reduce((s, r) => s + r.count, 0),
								" 笔 · ¥",
								money(byOwner.reduce((s, r) => s + r.amount, 0))
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "fit-table text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "实际收款人"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "笔数"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "已入账金额"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "备注"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: byOwner.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: r.owner
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 tabular-nums text-muted",
									children: r.count
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "p-3 text-right tabular-nums",
									children: ["¥", money(r.amount)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-xs text-muted",
									children: r.proxyCount ? `含代收 ${r.proxyCount} 笔` : ""
								})
							]
						}, r.owner || "__empty__")) })]
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentSheets, {
					mode: printMode,
					label,
					filterText: `${batch === "__all__" ? "全部发放方" : batch ? `发放方：${batch}` : "发放方：未填发放方"} · ${printOwnerLabel}`,
					sections: detail,
					summary,
					totals: printMode === "detail" ? detailTotal : summaryTotal,
					printOwner
				})
			]
		})
	});
}
function PaymentEditor({ draft, creating, ownerNames, receiverNames, sources, onCancel, onSave, onDelete }) {
	const [c, setC] = import_react.useState(() => ({ ...draft }));
	const { markDirty, requestClose } = useGuardedClose(onCancel);
	import_react.useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") requestClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [requestClose]);
	import_react.useEffect(() => {
		setC({ ...draft });
	}, [draft.id]);
	function patch(key, value) {
		setC((prev) => {
			const next = {
				...prev,
				[key]: value
			};
			if (key === "owner" && (!prev.receiver || prev.receiver === prev.owner)) next.receiver = value;
			return next;
		});
	}
	function save() {
		const who = (c.owner || "").trim();
		if (!who || !(Number(c.amount) > 0)) {
			toast.error("请填写实际收款人和金额");
			return;
		}
		const recv = (c.receiver || "").trim() || who;
		const date = parseDateYmd(c.date) || (c.date || "").trim();
		const next = {
			...c,
			owner: who,
			receiver: recv,
			date,
			amount: Number(c.amount) || 0,
			source: (c.source || "").trim(),
			remark: (c.remark || "").trim()
		};
		if (creating) {
			if (!confirm(`确认新增发放给「${who}」¥${next.amount}？`)) return;
			onSave(next);
			return;
		}
		const lines = [];
		if (next.owner !== draft.owner) lines.push(`实际收款人：「${draft.owner}」→「${next.owner}」`);
		if (next.receiver !== (draft.receiver || "")) lines.push(`收款人：「${draft.receiver || ""}」→「${next.receiver}」`);
		if ((next.date || "") !== (draft.date || "")) lines.push(`发放日期：「${draft.date || "待发放"}」→「${next.date || "待发放"}」`);
		if (Number(next.amount) !== Number(draft.amount)) lines.push(`金额：${draft.amount} → ${next.amount}`);
		if (next.source !== (draft.source || "")) lines.push(`发放方：「${draft.source || ""}」→「${next.source}」`);
		if (next.remark !== (draft.remark || "")) lines.push("备注已改");
		if (!lines.length) {
			toast.success("没有改动");
			return;
		}
		if (!confirm(`确认保存这些修改？\n${lines.join("\n")}`)) return;
		onSave(next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6",
		onClick: requestClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "payment-editor",
			className: "max-h-screen w-full max-w-5xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-6 shadow-panel md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			onChange: markDirty,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3 border-b border-line py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: creating ? "新增发放" : c.owner ? `编辑发放 · ${c.owner}` : "编辑发放"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "btn-row",
					children: [
						!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							type: "button",
							onClick: onDelete,
							children: "删除"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							type: "button",
							onClick: requestClose,
							children: "关闭"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: save,
							children: creating ? "确认新增" : "保存发放信息"
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "实际收款人（入账）" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2 h-11",
							list: "pay-edit-owners",
							value: c.owner,
							placeholder: "工资记在谁头上",
							onChange: (e) => patch("owner", e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
							id: "pay-edit-owners",
							children: ownerNames.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: n }, n))
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "收款人（代收可填别人）" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2 h-11",
							list: "pay-edit-receivers",
							value: c.receiver,
							placeholder: "空则同实际收款人",
							onChange: (e) => patch("receiver", e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
							id: "pay-edit-receivers",
							children: receiverNames.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: n }, n))
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "发放日期（空=待发放）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-2 h-11",
						type: "date",
						value: parseDateYmd(c.date) || c.date || "",
						onChange: (e) => patch("date", e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "发放金额（元）" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-2 h-11",
						type: "number",
						value: c.amount || "",
						onChange: (e) => patch("amount", Number(e.target.value) || 0)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "md:col-span-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "发放方" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-2 h-11",
								list: "pay-edit-sources",
								value: c.source,
								placeholder: "如：五冶条钢-钻孔切割8月请款",
								onChange: (e) => patch("source", e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
								id: "pay-edit-sources",
								children: sources.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: n }, n))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "md:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "备注" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-2 h-11",
							value: c.remark,
							onChange: (e) => patch("remark", e.target.value)
						})]
					})
				]
			})]
		})
	});
}
export { PaymentsPage as component };
