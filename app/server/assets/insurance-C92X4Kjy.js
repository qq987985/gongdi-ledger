import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-BlHKQb24.js";
import { o as uid } from "./utils-DPLvt0U2.js";
import { m as daysBetween } from "./contracts-Bm8eyOQk.js";
import "./excel-BRkrzoxa.js";
import { t as useApp } from "./store-Dl6VldK8.js";
import "./file-pick-BCv2SWUM.js";
import { n as toast } from "./dist-DdkhMw2U.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { n as Label, t as Input } from "./input-BWJYTTKH.js";
import { n as WideTable, r as usePager } from "./wide-table-DtWSjvOR.js";
import { n as Need, r as useCan, t as Can } from "./can-zSnmIuUg.js";
import { a as InsuranceMemberImport, c as TplLink } from "./excel-import-CQmyUK9g.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function today() {
	const d = /* @__PURE__ */ new Date();
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function memberDays(m) {
	return daysBetween(m.startDate, m.endDate || today());
}
function emptyPolicy() {
	return {
		id: "",
		policyNo: "",
		name: "",
		company: "",
		periodStart: today(),
		periodEnd: "",
		remark: ""
	};
}
function emptyMember(policyId) {
	return {
		id: "",
		policyId,
		name: "",
		leader: "",
		startDate: today(),
		endDate: "",
		remark: ""
	};
}
function Field({ label, children, required }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [label, required ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "ml-0.5 text-danger",
		children: "*"
	}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1",
		children
	})] });
}
function Modal({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[85vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-sm text-muted hover:text-ink",
					onClick: onClose,
					children: "关闭"
				})]
			}), children]
		})
	});
}
function InsurancePage() {
	const policies = useApp((s) => s.insurancePolicies || []);
	const members = useApp((s) => s.insuranceMembers || []);
	const upsertPolicy = useApp((s) => s.upsertPolicy);
	const removePolicies = useApp((s) => s.removePolicies);
	const upsertMember = useApp((s) => s.upsertMember);
	const removeMembers = useApp((s) => s.removeMembers);
	const canEdit = useCan("insurance.edit");
	const [selectedId, setSelectedId] = import_react.useState("");
	const [leader, setLeader] = import_react.useState("");
	const [policyEdit, setPolicyEdit] = import_react.useState(null);
	const [memberEdit, setMemberEdit] = import_react.useState(null);
	const [replaceState, setReplaceState] = import_react.useState(null);
	const selected = policies.find((p) => p.id === selectedId) || policies[0] || null;
	const selId = selected?.id || "";
	const policyMembers = import_react.useMemo(() => members.filter((m) => m.policyId === selId), [members, selId]);
	const leaders = import_react.useMemo(() => [...new Set(members.map((m) => m.leader).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh")), [members]);
	const shownMembers = import_react.useMemo(() => leader ? policyMembers.filter((m) => m.leader === leader) : policyMembers, [policyMembers, leader]);
	const memberPager = usePager("insurance-members", shownMembers, [selId, leader].join("|"));
	const periodDays = selected ? daysBetween(selected.periodStart, selected.periodEnd) : 0;
	const activeCount = policyMembers.filter((m) => !m.endDate).length;
	const totalPersonDays = policyMembers.reduce((s, m) => s + memberDays(m), 0);
	function savePolicy() {
		if (!policyEdit) return;
		if (!policyEdit.policyNo.trim()) {
			toast.error("保单号必填");
			return;
		}
		const id = policyEdit.id || uid();
		upsertPolicy({
			...policyEdit,
			id,
			policyNo: policyEdit.policyNo.trim()
		});
		setSelectedId(id);
		setPolicyEdit(null);
		toast.success("已保存保单");
	}
	function saveMember() {
		if (!memberEdit) return;
		if (!memberEdit.name.trim()) {
			toast.error("姓名必填");
			return;
		}
		upsertMember({
			...memberEdit,
			id: memberEdit.id || uid(),
			policyId: selId
		});
		setMemberEdit(null);
		toast.success("已保存人员");
	}
	function confirmReplace() {
		if (!replaceState) return;
		if (!replaceState.name.trim()) {
			toast.error("新姓名必填");
			return;
		}
		if (!replaceState.startDate) {
			toast.error("开始日期必填");
			return;
		}
		const { target } = replaceState;
		upsertMember({
			...target,
			endDate: replaceState.startDate
		});
		upsertMember({
			id: uid(),
			policyId: target.policyId,
			name: replaceState.name.trim(),
			leader: replaceState.leader,
			startDate: replaceState.startDate,
			endDate: "",
			remark: replaceState.remark
		});
		setReplaceState(null);
		toast.success(`已用「${replaceState.name.trim()}」替换「${target.name}」`);
	}
	function delPolicy(p) {
		if (!confirm(`删除保单「${p.policyNo}」？\n\n会同时删除该保单下的所有保险人员。`)) return;
		removePolicies([p.id]);
		toast.success("已删除保单");
	}
	function delMember(m) {
		if (!confirm(`删除被保人「${m.name}」？`)) return;
		removeMembers([m.id]);
		toast.success("已删除");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "insurance.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: "团体保险"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "保单、被保人、替换与天数统计。这里的人员与「人员」模块完全隔离。"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
						perm: "insurance.edit",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: () => setPolicyEdit(emptyPolicy()),
							children: "新增保单"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "保单"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "点一行查看该保单下的被保人。一个保单一个保险期，天数 = 结束 − 开始 + 1。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
							id: "insurance-policies",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "wide-table text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "border-b border-line text-xs text-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "序号"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "保单号"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "名称"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "保险公司"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "保险期"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "天数"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "在保/总"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "备注"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
											perm: "insurance.edit",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "p-3",
												children: "操作"
											})
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [policies.map((p, i) => {
									const pm = members.filter((m) => m.policyId === p.id);
									const active = pm.filter((m) => !m.endDate).length;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: `cursor-pointer border-b border-line last:border-0 hover:bg-accent-soft ${selId === p.id ? "bg-accent-soft" : ""}`,
										onClick: () => setSelectedId(p.id),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3 tabular-nums text-muted",
												children: i + 1
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3 font-medium",
												children: p.policyNo
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3",
												children: p.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3",
												children: p.company
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "p-3 whitespace-nowrap",
												children: [
													p.periodStart || "—",
													" ~ ",
													p.periodEnd || "—"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3 tabular-nums",
												children: daysBetween(p.periodStart, p.periodEnd) || ""
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "p-3 tabular-nums",
												children: [
													active,
													" / ",
													pm.length
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3 text-muted",
												children: p.remark
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
												perm: "insurance.edit",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "whitespace-nowrap p-3",
													onClick: (e) => e.stopPropagation(),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														type: "button",
														onClick: () => setPolicyEdit(p),
														children: "编辑"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "ghost",
														type: "button",
														onClick: () => delPolicy(p),
														children: "删除"
													})]
												})
											})
										]
									}, p.id);
								}), !policies.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: canEdit ? 9 : 8,
									className: "py-8 text-center text-sm text-muted",
									children: "还没有保单。点右上角「新增保单」。"
								}) }) : null] })]
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-semibold",
						children: ["被保人", selected ? ` · ${selected.policyNo}` : ""]
					}), selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["保险期天数 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									className: "tabular-nums text-ink",
									children: periodDays || "—"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"在保 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: activeCount
									}),
									" / ",
									policyMembers.length
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["累计人天 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									className: "tabular-nums text-ink",
									children: totalPersonDays
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "field-select h-9 w-auto",
								value: leader,
								onChange: (e) => setLeader(e.target.value),
								"aria-label": "按队长筛选",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "全部队长"
								}), leaders.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: l,
									children: l
								}, l))]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Can, {
								perm: "insurance.edit",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "outline",
										type: "button",
										onClick: () => setMemberEdit(emptyMember(selId)),
										children: "新增人员"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
										href: "/api/file/insurance-member-template",
										filename: "保险人员导入模板.xlsx"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InsuranceMemberImport, { policyId: selId })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
							id: "insurance-members",
							pager: memberPager,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "wide-table text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
									className: "border-b border-line text-xs text-muted",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "序号"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "姓名"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "队长"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "开始日期"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "结束日期"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "使用天数"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "备注"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
											perm: "insurance.edit",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
												className: "p-3",
												children: "操作"
											})
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [memberPager.rows.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-line last:border-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 tabular-nums text-muted",
											children: (memberPager.page - 1) * memberPager.size + i + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 font-medium",
											children: m.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3",
											children: m.leader
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 whitespace-nowrap",
											children: m.startDate || "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 whitespace-nowrap",
											children: m.endDate || /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-ok",
												children: "在保"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 tabular-nums",
											children: memberDays(m) || ""
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 text-muted",
											children: m.remark
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
											perm: "insurance.edit",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "whitespace-nowrap p-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														type: "button",
														onClick: () => setMemberEdit(m),
														children: "编辑"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "outline",
														type: "button",
														onClick: () => setReplaceState({
															target: m,
															name: "",
															leader: m.leader,
															startDate: today(),
															remark: ""
														}),
														children: "替换"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														size: "sm",
														variant: "ghost",
														type: "button",
														onClick: () => delMember(m),
														children: "删除"
													})
												]
											})
										})
									]
								}, m.id)), !shownMembers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: canEdit ? 8 : 7,
									className: "py-8 text-center text-sm text-muted",
									children: leader ? "这个队长下面还没有人" : "还没有被保人。点「新增人员」或「导入人员」。"
								}) }) : null] })]
							})
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "先新增保单，再往保单里加被保人。"
					})]
				}),
				policyEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
					title: policyEdit.id ? "编辑保单" : "新增保单",
					onClose: () => setPolicyEdit(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "保单号",
								required: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: policyEdit.policyNo,
									onChange: (e) => setPolicyEdit({
										...policyEdit,
										policyNo: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "名称（团体/项目）",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: policyEdit.name,
									onChange: (e) => setPolicyEdit({
										...policyEdit,
										name: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "保险公司",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: policyEdit.company,
									onChange: (e) => setPolicyEdit({
										...policyEdit,
										company: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "保险期开始",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: policyEdit.periodStart,
										onChange: (e) => setPolicyEdit({
											...policyEdit,
											periodStart: e.target.value
										})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "保险期结束",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: policyEdit.periodEnd,
										onChange: (e) => setPolicyEdit({
											...policyEdit,
											periodEnd: e.target.value
										})
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "备注",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: policyEdit.remark,
									onChange: (e) => setPolicyEdit({
										...policyEdit,
										remark: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-end gap-2 pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									type: "button",
									onClick: () => setPolicyEdit(null),
									children: "取消"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									onClick: savePolicy,
									children: "保存"
								})]
							})
						]
					})
				}) : null,
				memberEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Modal, {
					title: memberEdit.id ? "编辑被保人" : "新增被保人",
					onClose: () => setMemberEdit(null),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "姓名",
								required: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: memberEdit.name,
									onChange: (e) => setMemberEdit({
										...memberEdit,
										name: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
								label: "队长",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									list: "ins-leader-list",
									value: memberEdit.leader,
									onChange: (e) => setMemberEdit({
										...memberEdit,
										leader: e.target.value
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
									id: "ins-leader-list",
									children: leaders.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: l }, l))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "开始日期",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: memberEdit.startDate,
										onChange: (e) => setMemberEdit({
											...memberEdit,
											startDate: e.target.value
										})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "结束日期（空=在保）",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "date",
										value: memberEdit.endDate,
										onChange: (e) => setMemberEdit({
											...memberEdit,
											endDate: e.target.value
										})
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "备注",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: memberEdit.remark,
									onChange: (e) => setMemberEdit({
										...memberEdit,
										remark: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-end gap-2 pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									type: "button",
									onClick: () => setMemberEdit(null),
									children: "取消"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									onClick: saveMember,
									children: "保存"
								})]
							})
						]
					})
				}) : null,
				replaceState ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
					title: `替换「${replaceState.target.name}」`,
					onClose: () => setReplaceState(null),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							"新加入的人从 ",
							replaceState.startDate || "所选日期",
							" 起保；原「",
							replaceState.target.name,
							"」的结束日期会自动填成这一天。"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "新姓名",
								required: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: replaceState.name,
									onChange: (e) => setReplaceState({
										...replaceState,
										name: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
								label: "队长",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									list: "ins-leader-list",
									value: replaceState.leader,
									onChange: (e) => setReplaceState({
										...replaceState,
										leader: e.target.value
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
									id: "ins-leader-list",
									children: leaders.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: l }, l))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "开始日期（也是原人员的结束日期）",
								required: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: replaceState.startDate,
									onChange: (e) => setReplaceState({
										...replaceState,
										startDate: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "备注",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: replaceState.remark,
									onChange: (e) => setReplaceState({
										...replaceState,
										remark: e.target.value
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-end gap-2 pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									type: "button",
									onClick: () => setReplaceState(null),
									children: "取消"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									onClick: confirmReplace,
									children: "确认替换"
								})]
							})
						]
					})]
				}) : null
			]
		})
	});
}
export { InsurancePage as component };
