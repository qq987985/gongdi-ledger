import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-D5IsG1Md.js";
import { n as utils, r as writeFileSync } from "./xlsx-B0OoRtYU.js";
import { i as toast, n as logOp, t as fetchAudit } from "./audit-menbPLKJ.js";
import { n as authStatus } from "./auth-C2v32faz.js";
import { t as Button } from "./button-CTGswd-b.js";
import { t as Input } from "./input-BbLLN7y8.js";
import { i as useCan, n as Need } from "./can-CfY6WY0l.js";
import { n as WideTable, r as usePager } from "./wide-table-Ch3PuPH-.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function fmt(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function datePart(iso) {
	return fmt(iso).slice(0, 10);
}
function exportAudit(rows, from, to) {
	const aoa = [["操作记录"], [
		"序号",
		"时间",
		"操作人",
		"模块",
		"操作",
		"内容"
	]];
	[...rows].sort((a, b) => (a.at || "").localeCompare(b.at || "")).forEach((e, i) => {
		aoa.push([
			i + 1,
			fmt(e.at),
			e.userName,
			e.module,
			e.action,
			e.detail
		]);
	});
	const ws = utils.aoa_to_sheet(aoa);
	ws["!cols"] = [
		{ wch: 6 },
		{ wch: 20 },
		{ wch: 12 },
		{ wch: 12 },
		{ wch: 16 },
		{ wch: 50 }
	];
	const wb = utils.book_new();
	utils.book_append_sheet(wb, ws, "操作记录");
	writeFileSync(wb, from || to ? `操作记录_${from || "起始"}_${to || "至今"}.xlsx` : "操作记录_全部.xlsx");
}
function AuditPage() {
	const [rows, setRows] = import_react.useState([]);
	const [q, setQ] = import_react.useState("");
	const [from, setFrom] = import_react.useState("");
	const [to, setTo] = import_react.useState("");
	const [admin, setAdmin] = import_react.useState(false);
	const [note, setNote] = import_react.useState("");
	const [edit, setEdit] = import_react.useState(null);
	const [selected, setSelected] = import_react.useState([]);
	const canView = useCan("audit.view");
	async function load() {
		const next = await fetchAudit();
		setRows(next);
		setSelected((s) => s.filter((id) => next.some((e) => e.id === id)));
		setAdmin((await authStatus()).user?.role === "admin");
	}
	import_react.useEffect(() => {
		load();
	}, []);
	const list = import_react.useMemo(() => {
		const s = q.trim();
		let out = rows;
		if (from) out = out.filter((e) => datePart(e.at) >= from);
		if (to) out = out.filter((e) => datePart(e.at) <= to);
		if (s) out = out.filter((e) => [
			e.userName,
			e.action,
			e.detail,
			e.module,
			fmt(e.at)
		].some((x) => x.includes(s)));
		return out;
	}, [
		rows,
		q,
		from,
		to
	]);
	const pager = usePager("audit", list, [
		q,
		from,
		to
	].join("|"));
	const pageRows = pager.rows;
	function doExport() {
		if (!list.length) {
			toast.error("当前没有可导出的记录");
			return;
		}
		exportAudit(list, from, to);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "audit.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: "操作记录"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: ["人员、考勤、发放、合同、登录、权限都会记下来。", admin ? "只有管理员能改或删记录。" : "不能改记录，有问题找管理员。"]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-xs",
							placeholder: "搜姓名 / 操作 / 内容",
							value: q,
							onChange: (e) => setQ(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							className: "h-9 w-40",
							value: from,
							onChange: (e) => setFrom(e.target.value),
							"aria-label": "开始日期"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted",
							children: "至"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							className: "h-9 w-40",
							value: to,
							onChange: (e) => setTo(e.target.value),
							"aria-label": "结束日期"
						}),
						(from || to) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-muted hover:text-ink",
							onClick: () => {
								setFrom("");
								setTo("");
							},
							children: "清除区间"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							type: "button",
							onClick: () => void load(),
							children: "刷新"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: doExport,
							children: "导出"
						})
					]
				}),
				admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-sm",
							placeholder: "管理员补记一条说明",
							value: note,
							onChange: (e) => setNote(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: async () => {
								if (!note.trim()) return;
								await logOp("备注", note.trim(), "操作记录");
								setNote("");
								await load();
								toast.success("已记下");
							},
							children: "补记"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "danger",
							type: "button",
							disabled: !selected.length,
							onClick: async () => {
								if (!selected.length) return;
								if (!confirm(`删除选中的 ${selected.length} 条操作记录？\n\n删除后无法恢复，之后查不到这些操作。`)) return;
								const r = await fetch(`/api/audit?ids=${encodeURIComponent(selected.join(","))}`, {
									method: "DELETE",
									credentials: "include"
								});
								if (!r.ok) {
									toast.error(`删除失败（${r.status}）`);
									return;
								}
								const n = selected.length;
								setSelected([]);
								await load();
								toast.success(`已删除 ${n} 条操作记录`);
							},
							children: [
								"删除所选（",
								selected.length,
								"）"
							]
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "audit",
					pager,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "wide-table text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "border-b border-line text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "w-10 p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "size-4",
										"aria-label": "全选本页操作记录",
										checked: pageRows.length > 0 && pageRows.every((e) => selected.includes(e.id)),
										onChange: (ev) => {
											const ids = pageRows.map((e) => e.id);
											setSelected((s) => ev.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id)));
										}
									})
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "时间"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "操作人"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "模块"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "操作"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "内容"
								}),
								admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "管理"
								}) : null
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [pageRows.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-line last:border-0",
							children: [
								admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "size-4",
										"aria-label": `选择 ${fmt(e.at)} 的操作记录`,
										checked: selected.includes(e.id),
										onChange: (ev) => setSelected((s) => ev.target.checked ? [...s, e.id] : s.filter((id) => id !== e.id))
									})
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap p-3",
									children: fmt(e.at)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: e.userName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: e.module
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: edit?.id === e.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "h-8",
										value: edit.action,
										onChange: (ev) => setEdit({
											...edit,
											action: ev.target.value
										})
									}) : e.action
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3",
									children: edit?.id === e.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "h-8",
										value: edit.detail,
										onChange: (ev) => setEdit({
											...edit,
											detail: ev.target.value
										})
									}) : e.detail
								}),
								admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "whitespace-nowrap p-3",
									children: edit?.id === e.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										type: "button",
										onClick: async () => {
											const r = await fetch("/api/audit", {
												method: "PUT",
												credentials: "include",
												headers: { "content-type": "application/json" },
												body: JSON.stringify(edit)
											});
											if (!r.ok) {
												toast.error(`保存失败（${r.status}）`);
												return;
											}
											setEdit(null);
											await load();
											toast.success("已保存");
										},
										children: "保存"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										type: "button",
										onClick: () => setEdit(null),
										children: "取消"
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										type: "button",
										onClick: () => setEdit(e),
										children: "编辑"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										type: "button",
										onClick: async () => {
											if (!confirm(`删除这条操作记录？\n\n${fmt(e.at)}  ${e.userName}  ${e.action}\n\n删除后无法恢复，之后查不到这次操作。`)) return;
											const r = await fetch(`/api/audit?id=${encodeURIComponent(e.id)}`, {
												method: "DELETE",
												credentials: "include"
											});
											if (!r.ok) {
												toast.error(`删除失败（${r.status}）`);
												return;
											}
											await load();
										},
										children: "删除"
									})] })
								}) : null
							]
						}, e.id)), !list.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: admin ? 6 : 5,
							className: "py-8 text-center text-sm text-muted",
							children: canView ? "还没有操作记录。" : ""
						}) }) : null] })]
					})
				})
			]
		})
	});
}
export { AuditPage as component };
