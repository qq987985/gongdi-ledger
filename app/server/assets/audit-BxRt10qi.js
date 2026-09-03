import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-CDZPEZ8n.js";
import { n as authStatus } from "./auth-CTHz_Bd5.js";
import { n as logOp, t as fetchAudit } from "./audit-OJ0X-zkq.js";
import { n as toast } from "./dist-DdkhMw2U.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { t as Input } from "./input-BWJYTTKH.js";
import { n as WideTable, r as usePager } from "./wide-table-DtWSjvOR.js";
import { n as Need, r as useCan } from "./can-D8LQMuEU.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function fmt(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function AuditPage() {
	const [rows, setRows] = import_react.useState([]);
	const [q, setQ] = import_react.useState("");
	const [admin, setAdmin] = import_react.useState(false);
	const [note, setNote] = import_react.useState("");
	const [edit, setEdit] = import_react.useState(null);
	const canView = useCan("audit.view");
	async function load() {
		setRows(await fetchAudit());
		setAdmin((await authStatus()).user?.role === "admin");
	}
	import_react.useEffect(() => {
		load();
	}, []);
	const list = import_react.useMemo(() => {
		const s = q.trim();
		if (!s) return rows;
		return rows.filter((e) => [
			e.userName,
			e.action,
			e.detail,
			e.module,
			fmt(e.at)
		].some((x) => x.includes(s)));
	}, [rows, q]);
	const pager = usePager("audit", list, q);
	const pageRows = pager.rows;
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
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-xs",
						placeholder: "搜姓名 / 操作 / 内容",
						value: q,
						onChange: (e) => setQ(e.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						type: "button",
						onClick: () => void load(),
						children: "刷新"
					})]
				}),
				admin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-sm",
						placeholder: "管理员补记一条说明",
						value: note,
						onChange: (e) => setNote(e.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: async () => {
							if (!note.trim()) return;
							await logOp("备注", note.trim(), "操作记录");
							setNote("");
							await load();
							toast.success("已记下");
						},
						children: "补记"
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "audit",
					pager,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "wide-table text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "border-b border-line text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
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
											await fetch("/api/audit", {
												method: "PUT",
												credentials: "include",
												headers: { "content-type": "application/json" },
												body: JSON.stringify(edit)
											});
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
											if (!confirm("删除这条记录？")) return;
											await fetch(`/api/audit?id=${encodeURIComponent(e.id)}`, {
												method: "DELETE",
												credentials: "include"
											});
											await load();
										},
										children: "删除"
									})] })
								}) : null
							]
						}, e.id)), !list.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: admin ? 6 : 5,
							className: "py-8 text-center text-sm text-muted",
							children: canView ? "还没有记录" : ""
						}) }) : null] })]
					})
				})
			]
		})
	});
}
export { AuditPage as component };
