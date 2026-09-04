import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-BlHKQb24.js";
import { i as money, o as uid } from "./utils-DPLvt0U2.js";
import { m as daysBetween } from "./contracts-DHzcdfHV.js";
import "./excel-DhiGrJhW.js";
import { t as useApp } from "./store-DN67JpqK.js";
import "./nas-sync-Cy8ykiI9.js";
import { d as setDoc, l as renameFile, n as DocActions } from "./doc-actions-DclyOIga.js";
import "./file-pick-BCv2SWUM.js";
import { n as toast } from "./dist-DdkhMw2U.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { n as Label, t as Input } from "./input-BWJYTTKH.js";
import { n as WideTable, r as usePager } from "./wide-table-DtWSjvOR.js";
import { n as Need, r as useCan, t as Can } from "./can-zSnmIuUg.js";
import { a as InsuranceMemberImport, c as TplLink } from "./excel-import-COK6b0GC.js";
import { t as useGuardedClose } from "./confirm-close-D2cQFNgP.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function today() {
	const d = /* @__PURE__ */ new Date();
	const p = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function datePart(dt) {
	return (dt || "").slice(0, 10);
}
function timePart(dt) {
	return (dt || "").slice(11, 16);
}
function safeFileBase(s) {
	return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim();
}
function memberDays(m) {
	return daysBetween(m.startDate, m.endDate || today());
}
function isActive(m) {
	if (!m.endDate) return true;
	const end = datePart(m.endDate);
	return end ? end >= today() : true;
}
function prevDayEnd(dt) {
	const d = datePart(dt);
	if (!d) return "";
	const t = /* @__PURE__ */ new Date(`${d}T00:00:00`);
	t.setDate(t.getDate() - 1);
	const p = (n) => String(n).padStart(2, "0");
	return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} 23:59`;
}
function emptyPolicy() {
	return {
		id: "",
		policyNo: "",
		buyer: "",
		name: "",
		company: "",
		premiumPerPerson: 0,
		headcount: 0,
		coverage: 0,
		periodStart: `${today()} 00:00`,
		periodEnd: "",
		linkedPolicyId: "",
		contracts: [],
		remark: ""
	};
}
function emptyMember(policyId) {
	return {
		id: "",
		policyId,
		name: "",
		leader: "",
		startDate: `${today()} 00:00`,
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
function DateTimeField({ label, value, defaultTime, onChange, required }) {
	const date = datePart(value);
	const time = timePart(value) || defaultTime;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
		label,
		required,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				type: "date",
				className: "flex-1",
				value: date,
				onChange: (e) => {
					const d = e.target.value;
					onChange(d ? `${d} ${time}` : "");
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				type: "time",
				className: "w-28",
				value: time,
				onChange: (e) => {
					const t = e.target.value;
					onChange(date ? `${date} ${t}` : "");
				}
			})]
		})
	});
}
function Modal({ title, onClose, children }) {
	const { markDirty, requestClose } = useGuardedClose(onClose);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
		onClick: requestClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[85vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel",
			onClick: (e) => e.stopPropagation(),
			onChange: markDirty,
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
	useApp((s) => s.replaceMembers);
	const canEdit = useCan("insurance.edit");
	function syncLinked(fromPolicyId) {
		const st = useApp.getState();
		const all = st.insurancePolicies || [];
		const members$1 = st.insuranceMembers || [];
		const fromMembers = members$1.filter((m) => m.policyId === fromPolicyId);
		const targets = /* @__PURE__ */ new Set();
		const from = all.find((p) => p.id === fromPolicyId);
		if (from?.linkedPolicyId && from.linkedPolicyId !== fromPolicyId) targets.add(from.linkedPolicyId);
		for (const p of all) if (p.linkedPolicyId === fromPolicyId && p.id !== fromPolicyId) targets.add(p.id);
		if (!targets.size) return;
		const result = [...members$1.filter((m) => m.policyId !== fromPolicyId && !targets.has(m.policyId))];
		for (const linkedId of targets) for (const m of fromMembers) result.push({
			...m,
			id: uid(),
			policyId: linkedId
		});
		st.replaceMembers(result);
	}
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
	const premiumPerPerson = selected?.premiumPerPerson || 0;
	const headcount = selected?.headcount || 0;
	const coverage = selected?.coverage || 0;
	const totalPremium = premiumPerPerson * headcount;
	const perPersonDaily = periodDays > 0 ? premiumPerPerson / periodDays : 0;
	const activeCount = policyMembers.filter((m) => isActive(m)).length;
	const totalPersonDays = policyMembers.reduce((s, m) => s + memberDays(m), 0);
	const totalSettle = policyMembers.reduce((s, m) => s + perPersonDaily * memberDays(m), 0);
	const settleOf = (m) => Math.round(perPersonDaily * memberDays(m) * 100) / 100;
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
		syncLinked(selId);
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
		const startDay = datePart(replaceState.startDate);
		const policy = policies.find((p) => p.id === target.policyId);
		upsertMember({
			...target,
			endDate: prevDayEnd(replaceState.startDate)
		});
		upsertMember({
			id: uid(),
			policyId: target.policyId,
			name: replaceState.name.trim(),
			leader: replaceState.leader,
			startDate: `${startDay} 00:00`,
			endDate: policy?.periodEnd || "",
			remark: replaceState.remark
		});
		syncLinked(target.policyId);
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
		syncLinked(m.policyId);
		toast.success("已删除");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Need, {
		perm: "insurance.view",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-print space-y-5",
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
											children: "总保费"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "在保/已结束"
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
									const active = pm.filter((m) => isActive(m)).length;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
										className: `cursor-pointer border-b border-line last:border-0 hover:bg-accent-soft ${selId === p.id ? "bg-accent-soft" : ""}`,
										onClick: () => setSelectedId(p.id),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3 tabular-nums text-muted",
												children: i + 1
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "p-3 font-medium",
												children: [p.policyNo, p.linkedPolicyId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] font-normal text-muted",
													children: ["↔ 挂钩 ", policies.find((x) => x.id === p.linkedPolicyId)?.policyNo || ""]
												}) : null]
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
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
												className: "p-3 tabular-nums",
												children: (p.premiumPerPerson || 0) * (p.headcount || 0) ? money((p.premiumPerPerson || 0) * (p.headcount || 0)) : ""
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
												className: "p-3 tabular-nums",
												children: [
													active,
													" / ",
													pm.length - active
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
									colSpan: canEdit ? 10 : 9,
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
							className: "mt-2 grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["保险期天数 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									className: "tabular-nums text-ink",
									children: periodDays || "—"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"每人保费 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: money(premiumPerPerson)
									}),
									" 元"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["人数 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									className: "tabular-nums text-ink",
									children: headcount
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"保额/人 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: money(coverage)
									}),
									" 元"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"总保费 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: money(totalPremium)
									}),
									" 元"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"每人每天 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: money(Math.round(perPersonDaily * 100) / 100)
									}),
									" 元"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"在保 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: activeCount
									}),
									" 人 · 已结束 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: policyMembers.length - activeCount
									}),
									" 人"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["累计人天 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
									className: "tabular-nums text-ink",
									children: totalPersonDays
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"保费合计 ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "tabular-nums text-ink",
										children: money(Math.round(totalSettle * 100) / 100)
									}),
									" 元"
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-subtle",
							children: "每人每天 = 每人保费 ÷ 保险期天数；每人保费 = 每人每天 × 使用天数。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-subtle",
							children: "同一人被替换后又回来会分成多段，各段实际天数、保费自动累加（下表按段显示）。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
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
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									type: "button",
									onClick: () => window.print(),
									children: "打印清单"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Can, {
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
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InsuranceMemberImport, {
											policyId: selId,
											onImported: () => syncLinked(selId)
										})
									]
								})
							]
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
											children: "保费(元)"
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
											children: m.endDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [m.endDate, isActive(m) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-1 text-ok",
												children: "在保"
											}) : null] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-ok",
												children: "在保"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 tabular-nums",
											children: memberDays(m) || ""
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 tabular-nums",
											children: money(settleOf(m))
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
									colSpan: canEdit ? 9 : 8,
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
								label: "购买保险的公司",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: policyEdit.buyer,
									onChange: (e) => setPolicyEdit({
										...policyEdit,
										buyer: e.target.value
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "挂钩保单（人员同步，替换一起替换）",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "field-select w-full",
									value: policyEdit.linkedPolicyId,
									onChange: (e) => setPolicyEdit({
										...policyEdit,
										linkedPolicyId: e.target.value
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "不挂钩"
									}), policies.filter((p) => p.id !== policyEdit.id).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: p.id,
										children: [p.policyNo, p.name ? ` · ${p.name}` : ""]
									}, p.id))]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-3 gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "每人保费(元)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: 0,
											value: policyEdit.premiumPerPerson || "",
											onChange: (e) => setPolicyEdit({
												...policyEdit,
												premiumPerPerson: Number(e.target.value)
											})
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "人数",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: 0,
											value: policyEdit.headcount || "",
											onChange: (e) => setPolicyEdit({
												...policyEdit,
												headcount: Number(e.target.value)
											})
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "保额/人(元)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: 0,
											value: policyEdit.coverage || "",
											onChange: (e) => setPolicyEdit({
												...policyEdit,
												coverage: Number(e.target.value)
											})
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateTimeField, {
								label: "保险期开始",
								value: policyEdit.periodStart,
								defaultTime: "00:00",
								onChange: (v) => setPolicyEdit({
									...policyEdit,
									periodStart: v
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateTimeField, {
								label: "保险期结束",
								value: policyEdit.periodEnd,
								defaultTime: "23:59",
								onChange: (v) => setPolicyEdit({
									...policyEdit,
									periodEnd: v
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "保险合同（可多份）",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [policyEdit.contracts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
										id: c.id,
										kind: "insurance",
										fileName: c.fileName,
										onDeleted: () => setPolicyEdit({
											...policyEdit,
											contracts: policyEdit.contracts.filter((x) => x.id !== c.id)
										}),
										onReplaced: (saved) => setPolicyEdit({
											...policyEdit,
											contracts: policyEdit.contracts.map((x) => x.id === c.id ? {
												...x,
												fileName: saved
											} : x)
										})
									}, c.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "btn inline-flex cursor-pointer items-center rounded-sm border border-line bg-surface text-xs hover:bg-accent-soft",
										children: ["上传合同", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "file",
											accept: ".pdf,.ofd,.xml,.jpg,.jpeg,.png,.webp",
											className: "hidden",
											onChange: async (e) => {
												const f = e.target.files?.[0];
												e.target.value = "";
												if (!f) return;
												const named = renameFile(f, [
													policyEdit.policyNo,
													policyEdit.buyer,
													datePart(policyEdit.periodStart).replace(/-/g, "")
												].map((s) => safeFileBase(s)).filter(Boolean).join("-") || "保险合同");
												const id = uid();
												const saved = await setDoc(id, "insurance", named) || named.name;
												setPolicyEdit({
													...policyEdit,
													contracts: [...policyEdit.contracts, {
														id,
														fileName: saved
													}]
												});
												toast.success(`已上传 ${saved}`);
											}
										})]
									})]
								})
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateTimeField, {
								label: "开始时间",
								value: memberEdit.startDate,
								defaultTime: "00:00",
								onChange: (v) => setMemberEdit({
									...memberEdit,
									startDate: v
								}),
								required: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateTimeField, {
								label: "结束时间（空=在保）",
								value: memberEdit.endDate,
								defaultTime: "23:59",
								onChange: (v) => setMemberEdit({
									...memberEdit,
									endDate: v
								})
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
							"新加入的人从「",
							replaceState.startDate || "所选日期",
							" 00:00」起保，到保险到期结束；原「",
							replaceState.target.name,
							"」的结束时间自动填成前一天 23:59。"
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
								label: "替换生效日期（当天 00:00 起）",
								required: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: datePart(replaceState.startDate),
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
		}), selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "print-only text-black",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "p-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "border-b-2 border-black pb-2 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xl font-semibold",
						children: "团体保险人员清单"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-sm",
						children: [
							selected.policyNo,
							selected.name ? ` · ${selected.name}` : "",
							leader ? ` · 队长：${leader}` : ""
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-3 w-full border-collapse text-center text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
						"序号",
						"姓名",
						"队长",
						"开始时间",
						"结束时间",
						"使用天数",
						"保费(元)"
					].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "border border-black px-2 py-1 font-semibold",
						children: h
					}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: [...shownMembers].sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "") || a.name.localeCompare(b.name, "zh")).map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-2 py-1",
							children: i + 1
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-2 py-1",
							children: m.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-2 py-1",
							children: m.leader
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-2 py-1 whitespace-nowrap",
							children: m.startDate || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-2 py-1 whitespace-nowrap",
							children: m.endDate || "在保"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-2 py-1",
							children: memberDays(m) || ""
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-2 py-1",
							children: money(settleOf(m))
						})
					] }, m.id)) })]
				})]
			})
		}) : null]
	});
}
export { InsurancePage as component };
