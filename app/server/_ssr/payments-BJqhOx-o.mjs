import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { I as dateYear, L as derivedYears, a as Input, f as Button, ft as confirmBatchDelete, ht as toggleSel, mt as money, o as Label, q as parseDateYmd, y as useApp } from "./router-DxdzlCp3.mjs";
import { n as WideTable } from "./wide-table-D8rPvj0E.mjs";
import { i as PaymentImport, o as TplLink } from "./excel-import-BfyfwtjF.mjs";
import { n as Need } from "./can-gkGWV5bu.mjs";
import { t as Badge } from "./badge-U3vNDWCk.mjs";
import { i as ymKey, n as monthsInRange, r as rangeLabel, t as YmPick } from "./ym-pick-CSdNMXnF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments-BJqhOx-o.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
	const [q, setQ] = (0, import_react.useState)("");
	const [fromY, setFromY] = (0, import_react.useState)(year);
	const [fromM, setFromM] = (0, import_react.useState)(1);
	const [toY, setToY] = (0, import_react.useState)(year);
	const [toM, setToM] = (0, import_react.useState)(12);
	const [status, setStatus] = (0, import_react.useState)("all");
	const [batch, setBatch] = (0, import_react.useState)("all");
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [fillDate, setFillDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const yearOpts = (0, import_react.useMemo)(() => {
		const set = /* @__PURE__ */ new Set([
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
	const span = (0, import_react.useMemo)(() => monthsInRange(fromY, fromM, toY, toM), [
		fromY,
		fromM,
		toY,
		toM
	]);
	const lo = ymKey(span[0].year, span[0].month);
	const hi = ymKey(span[span.length - 1].year, span[span.length - 1].month);
	const label = rangeLabel(fromY, fromM, toY, toM);
	const ranged = (0, import_react.useMemo)(() => {
		return payments.filter((p) => {
			const d = parseDateYmd(p.date) || p.date;
			if (!d) return true;
			const y = Number(d.slice(0, 4));
			const m = Number(d.slice(5, 7));
			if (!y || !m) return true;
			const k = ymKey(y, m);
			return k >= lo && k <= hi;
		});
	}, [
		payments,
		lo,
		hi
	]);
	const batches = (0, import_react.useMemo)(() => [...new Set(ranged.map((p) => p.source).filter(Boolean))], [ranged]);
	const filtered = (0, import_react.useMemo)(() => {
		let list = ranged;
		if (status === "pending") list = list.filter((p) => !p.date);
		if (status === "paid") list = list.filter((p) => Boolean(p.date));
		if (batch !== "all") list = list.filter((p) => p.source === batch);
		if (q.trim()) {
			const s = q.trim();
			list = list.filter((p) => [
				p.owner,
				p.receiver,
				p.source,
				p.remark
			].some((x) => x.includes(s)));
		}
		return list;
	}, [
		ranged,
		batch,
		q,
		status
	]);
	const pendingCount = ranged.filter((p) => !p.date).length;
	const pendingAmt = ranged.filter((p) => !p.date).reduce((s, p) => s + p.amount, 0);
	const paidAmt = filtered.filter((p) => p.date).reduce((s, p) => s + p.amount, 0);
	const total = filtered.reduce((s, p) => s + p.amount, 0);
	const proxyCount = filtered.filter((p) => p.owner !== p.receiver).length;
	const ownerNames = [...new Set([...names, ...payments.map((p) => p.owner)].filter(Boolean))];
	const receiverNames = [...new Set([...names, ...payments.map((p) => p.receiver)].filter(Boolean))];
	const sources = [...new Set(payments.map((p) => p.source).filter(Boolean))];
	const allChecked = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));
	const byOwner = (0, import_react.useMemo)(() => {
		const m = /* @__PURE__ */ new Map();
		for (const p of filtered.filter((x) => x.date)) m.set(p.owner, (m.get(p.owner) || 0) + p.amount);
		return [...m.entries()].sort((a, b) => b[1] - a[1]);
	}, [filtered]);
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
						children: "点「新增发放」或行里「更改」才出编辑。点一行是勾选。待发放没有日期，会一直显示在列表里。"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
							href: "/api/file/payment-template",
							filename: "发放记录导入模板.xlsx"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentImport, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: () => {
								setCreating(true);
								setEditing(emptyPayment());
							},
							children: "新增发放"
						})]
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
								value: "all",
								children: "全部发放方"
							}), batches.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: b,
								children: b
							}, b))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex rounded-full border border-line p-0.5 text-xs",
							children: [
								["all", "全部"],
								["pending", `待发放${pendingCount ? ` ${pendingCount}` : ""}`],
								["paid", "已发放"]
							].map(([k, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `h-8 rounded-full px-3 ${status === k ? "bg-accent text-accent-fg" : "text-muted"}`,
								onClick: () => setStatus(k),
								children: label
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
								"· 代收 ",
								proxyCount,
								" 笔"
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
				byOwner.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-x-auto rounded-xl border border-line bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-b border-line px-4 py-2 text-xs text-muted",
						children: "按实际收款人入账（只计已填日期的；待发放不算已发）"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3",
								children: "实际收款人"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "p-3",
								children: "已入账金额"
							})] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: byOwner.slice(0, 12).map(([name, amt]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "p-3",
								children: name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "p-3 text-right tabular-nums",
								children: ["¥", money(amt)]
							})]
						}, name)) })]
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "payments",
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
										onChange: (e) => setSelected(e.target.checked ? filtered.map((p) => p.id) : []),
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
							className: "p-8 text-center text-muted",
							children: "暂无发放记录"
						}) }) : null, filtered.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
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
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												type: "button",
												onClick: () => {
													setCreating(false);
													setEditing(p);
												},
												children: "更改"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "sm",
												type: "button",
												onClick: () => dropIds([p.id], "已删除 1 笔发放"),
												children: "删除"
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 tabular-nums text-muted",
									children: i + 1
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
				}) : null
			]
		})
	});
}
function PaymentEditor({ draft, creating, ownerNames, receiverNames, sources, onCancel, onSave, onDelete }) {
	const [c, setC] = (0, import_react.useState)(() => ({ ...draft }));
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);
	(0, import_react.useEffect)(() => {
		setC({ ...draft });
	}, [draft.id]);
	function patch(key, value) {
		setC((prev) => {
			const next = { ...prev, [key]: value };
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "payment-editor",
		className: "space-y-4 rounded-xl border border-accent bg-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: creating ? "新增发放" : c.owner ? `编辑发放 · ${c.owner}` : "编辑发放"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "btn-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "outline", type: "button", onClick: onCancel, children: "关闭" }),
							!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { variant: "danger", type: "button", onClick: onDelete, children: "删除" }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { type: "button", onClick: save, children: creating ? "确认新增" : "保存发放信息" })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "实际收款人（入账）" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
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
							className: "mt-1",
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "发放日期（空=待发放）" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "date",
							value: parseDateYmd(c.date) || c.date || "",
							onChange: (e) => patch("date", e.target.value)
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "发放金额（元）" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "number",
							value: c.amount || "",
							onChange: (e) => patch("amount", Number(e.target.value) || 0)
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "发放方" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							list: "pay-edit-sources",
							value: c.source,
							placeholder: "如：五冶条钢-钻孔切割8月请款",
							onChange: (e) => patch("source", e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
							id: "pay-edit-sources",
							children: sources.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: n }, n))
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "备注" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: c.remark,
							onChange: (e) => patch("remark", e.target.value)
						})
					] })
				]
			})
		]
	});
}
//#endregion
export { PaymentsPage as component };
