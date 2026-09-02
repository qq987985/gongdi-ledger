import "./perms-DQTE-mZW.js";
import "./utils-CBhPqRT8.js";
import { n as authStatus } from "./auth-eu_OLOze.js";
import { n as logOp, t as fetchAudit } from "./audit-WIrQfSBV.js";
import { t as Button } from "./button-Zdwj1dRR.js";
import { t as Input } from "./input-D73Q2_mj.js";
import { n as WideTable } from "./wide-table-BUKe7FLR.js";
import { n as Need, r as useCan } from "./can-BfltFJNf.js";
import * as React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
function fmt(iso) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function AuditPage() {
	const [rows, setRows] = React.useState([]);
	const [q, setQ] = React.useState("");
	const [admin, setAdmin] = React.useState(false);
	const [note, setNote] = React.useState("");
	const [edit, setEdit] = React.useState(null);
	const canView = useCan("audit.view");
	async function load() {
		setRows(await fetchAudit());
		setAdmin((await authStatus()).user?.role === "admin");
	}
	React.useEffect(() => {
		load();
	}, []);
	const list = React.useMemo(() => {
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
	return /* @__PURE__ */ jsx(Need, {
		perm: "audit.view",
		children: /* @__PURE__ */ jsxs("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ jsxs("header", { children: [/* @__PURE__ */ jsx("h1", {
					className: "font-display text-2xl font-semibold",
					children: "操作记录"
				}), /* @__PURE__ */ jsxs("p", {
					className: "mt-1 text-sm text-muted",
					children: ["人员、考勤、发放、合同、登录、权限都会记下来。", admin ? "只有管理员能改或删记录。" : "不能改记录，有问题找管理员。"]
				})] }),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ jsx(Input, {
						className: "max-w-xs",
						placeholder: "搜姓名 / 操作 / 内容",
						value: q,
						onChange: (e) => setQ(e.target.value)
					}), /* @__PURE__ */ jsx(Button, {
						variant: "outline",
						type: "button",
						onClick: () => void load(),
						children: "刷新"
					})]
				}),
				admin ? /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ jsx(Input, {
						className: "max-w-sm",
						placeholder: "管理员补记一条说明",
						value: note,
						onChange: (e) => setNote(e.target.value)
					}), /* @__PURE__ */ jsx(Button, {
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
				/* @__PURE__ */ jsx(WideTable, {
					id: "audit",
					children: /* @__PURE__ */ jsxs("table", {
						className: "wide-table text-sm",
						children: [/* @__PURE__ */ jsx("thead", {
							className: "border-b border-line text-xs text-muted",
							children: /* @__PURE__ */ jsxs("tr", { children: [
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "时间"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "操作人"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "模块"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "操作"
								}),
								/* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "内容"
								}),
								admin ? /* @__PURE__ */ jsx("th", {
									className: "p-3",
									children: "管理"
								}) : null
							] })
						}), /* @__PURE__ */ jsxs("tbody", { children: [list.map((e) => /* @__PURE__ */ jsxs("tr", {
							className: "border-b border-line last:border-0",
							children: [
								/* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap p-3",
									children: fmt(e.at)
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3",
									children: e.userName
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3",
									children: e.module
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3",
									children: edit?.id === e.id ? /* @__PURE__ */ jsx(Input, {
										className: "h-8",
										value: edit.action,
										onChange: (ev) => setEdit({
											...edit,
											action: ev.target.value
										})
									}) : e.action
								}),
								/* @__PURE__ */ jsx("td", {
									className: "p-3",
									children: edit?.id === e.id ? /* @__PURE__ */ jsx(Input, {
										className: "h-8",
										value: edit.detail,
										onChange: (ev) => setEdit({
											...edit,
											detail: ev.target.value
										})
									}) : e.detail
								}),
								admin ? /* @__PURE__ */ jsx("td", {
									className: "whitespace-nowrap p-3",
									children: edit?.id === e.id ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Button, {
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
									}), /* @__PURE__ */ jsx(Button, {
										size: "sm",
										variant: "ghost",
										type: "button",
										onClick: () => setEdit(null),
										children: "取消"
									})] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Button, {
										size: "sm",
										variant: "outline",
										type: "button",
										onClick: () => setEdit(e),
										children: "改"
									}), /* @__PURE__ */ jsx(Button, {
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
										children: "删"
									})] })
								}) : null
							]
						}, e.id)), !list.length ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
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
