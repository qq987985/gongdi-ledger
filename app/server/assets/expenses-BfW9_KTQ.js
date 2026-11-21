import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { u as permLabel } from "./perms-VCrRIaso.js";
import { a as money, i as formatCardNo, n as confirmBatchDelete, o as toggleSel, s as uid } from "./utils-DqsA5Dz5.js";
import { h as localToday, s as round2 } from "./wage-BjPg8C56.js";
import { x as numOr } from "./teams-COFVEpEW.js";
import "./excel-D_9GRUXo.js";
import { a as expensePayoutDraft, c as PAY_METHODS, i as expensePayoutBatches, l as expenseFormFromDraft, n as useApp, o as planDissolveExpensePayout, r as expenseBatchMatches, s as planExpensePayout, u as needsVoucher } from "./store-B4oguYN-.js";
import { v as toast } from "./audit-diff-Dq6lg3_A.js";
import { _ as subscribeLedgerContext, c as ledgerContextSnapshot, o as flushPendingLedger } from "./nas-sync-B6_UAfEd.js";
import { a as prepareNamedFile, d as setDoc, f as uniqueBase, l as renameFile, n as DocActions } from "./doc-actions-Z_-0mkjx.js";
import "./file-pick-BVn5Qy83.js";
import { t as Plus } from "./plus-DxobgIow.js";
import { t as Button } from "./button-DUPRk21k.js";
import { n as Label, t as Input } from "./input-Bg6qxekg.js";
import { a as useCanSave, n as Need, r as ReadonlyNotice, s as blockedWrite } from "./can-DxicSlvV.js";
import { n as WideTable, r as usePager } from "./wide-table-Cmcn8_On.js";
import { c as TplLink, r as ExpenseImport } from "./excel-import-fcx-ELM4.js";
import { i as inBucket, r as groupBuckets, t as ALL_BUCKETS } from "./buckets-DVNckTqM.js";
import { t as Badge } from "./badge-DpzIwGxC.js";
import { t as useGuardedClose } from "./confirm-close-D0r1rz3e.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
function filterExpenses(list, f) {
	let rows = list;
	if (f.scope === "year") rows = rows.filter((e) => e.year === f.year);
	if (f.status !== "all") rows = rows.filter((e) => e.status === f.status);
	if (f.claimant !== "__all__") rows = rows.filter((e) => inBucket(e.claimant, f.claimant));
	if (f.q.trim()) {
		const s = f.q.trim();
		rows = rows.filter((e) => [
			e.name,
			e.period,
			e.remark,
			e.payMethod,
			e.claimant,
			e.forWhom,
			e.payAccount,
			e.payBank,
			e.payCardNo,
			e.payoutFileName,
			e.voucherFileName
		].some((x) => (x || "").includes(s)));
	}
	return rows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
}
function expenseTotals(rows) {
	return rows.reduce((s, e) => {
		s.amount += e.amount || 0;
		s.count += 1;
		if (e.status === "未报销") s.open += e.amount || 0;
		else s.done += e.amount || 0;
		if (needsVoucher(e.payMethod) && !e.voucherFileName) s.missing += 1;
		if (e.status === "已报销" && needsVoucher(e.payoutMethod || "转账") && !e.payoutFileName) s.missPay += 1;
		return s;
	}, {
		amount: 0,
		count: 0,
		open: 0,
		done: 0,
		missing: 0,
		missPay: 0
	});
}
function claimantBuckets(rows) {
	return groupBuckets(rows.map((e) => e.claimant), "未填报销人");
}
function expensePrintRows(args) {
	const { list, selected, shown, printStatus } = args;
	let rows = selected.length ? list.filter((e) => selected.includes(e.id)) : shown;
	if (printStatus !== "all") rows = rows.filter((e) => e.status === printStatus);
	return rows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.period || "").localeCompare(b.period || ""));
}
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function FormField({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-medium text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block",
			children
		})]
	});
}
function ExpensePayoutEditor({ session, canEdit, busy, onClose, onSave, onDissolve }) {
	const original = session.all.filter((row) => session.ids.includes(row.id));
	const existing = expensePayoutBatches(session.all).find((batch) => batch.id === session.editingId);
	const [ids, setIds] = import_react.useState(session.ids);
	const [draft, setDraft] = import_react.useState(() => expensePayoutDraft(original, localToday()));
	const [q, setQ] = import_react.useState("");
	const [candidateStatus, setCandidateStatus] = import_react.useState("未报销");
	const [showAdd, setShowAdd] = import_react.useState(!session.editingId && session.ids.length === 0);
	const [showAccount, setShowAccount] = import_react.useState(original.some((row) => row.forWhom || row.payBank || row.payCardNo));
	const [file, setFile] = import_react.useState(null);
	const [clearFile, setClearFile] = import_react.useState(false);
	const [checkedIssues, setCheckedIssues] = import_react.useState(false);
	const [explicitStatus, setExplicitStatus] = import_react.useState(false);
	const [error, setError] = import_react.useState("");
	const editedForm = import_react.useRef(false);
	const { markDirty, requestClose } = useGuardedClose(onClose);
	const rows = session.all.filter((row) => ids.includes(row.id));
	const total = expenseTotals(rows).amount;
	const missingClaimant = rows.filter((row) => !(row.claimant || "").trim()).length;
	const requireStatusChoice = rows.some((row) => row.status !== rows[0]?.status) || !!existing?.issues.includes("收款日期不一致");
	const requireIssuesCheck = !!existing?.issues.some((issue) => !["收款状态不一致", "收款日期不一致"].includes(issue));
	const locked = new Set(existing?.rows.map((row) => row.id) || []);
	const candidates = session.all.filter((row) => !row.payoutId && (candidateStatus === "all" || row.status === candidateStatus) && (!q.trim() || [
		row.name,
		row.claimant,
		row.period,
		row.remark
	].some((value) => (value || "").includes(q.trim()))));
	const accountMap = /* @__PURE__ */ new Map();
	for (const row of session.all) if (row.forWhom?.trim() && (row.payBank?.trim() || row.payCardNo?.trim())) {
		const account = {
			name: row.forWhom.trim(),
			bank: row.payBank?.trim() || "",
			card: row.payCardNo?.trim() || ""
		};
		accountMap.set(JSON.stringify(account), account);
	}
	const accounts = [...accountMap.values()];
	const allCandidates = candidates.length > 0 && candidates.every((row) => ids.includes(row.id));
	const effectiveClaimants = rows.map((row) => (row.claimant || "").trim() || draft.claimant.trim());
	const commonClaimant = effectiveClaimants.length && effectiveClaimants.every((name) => name === effectiveClaimants[0]) ? effectiveClaimants[0] : "";
	const accountVisible = draft.status === "已报销" || showAccount;
	import_react.useEffect(() => {
		if (!editedForm.current && !session.editingId) setDraft(expensePayoutDraft(rows, localToday()));
	}, [ids.join("|"), session.key]);
	import_react.useEffect(() => {
		const onKey = (event) => {
			if (event.key === "Escape" && !busy) requestClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [requestClose, busy]);
	function patch(key, value) {
		editedForm.current = true;
		markDirty();
		setError("");
		setDraft((previous) => ({
			...previous,
			[key]: value
		}));
	}
	function changePayee(name) {
		editedForm.current = true;
		markDirty();
		setError("");
		const hits = accounts.filter((account) => account.name === name.trim());
		setDraft((previous) => ({
			...previous,
			forWhom: name,
			payBank: hits.length === 1 ? hits[0].bank : "",
			payCardNo: hits.length === 1 ? hits[0].card : ""
		}));
	}
	function selectStatus(status) {
		setExplicitStatus(true);
		editedForm.current = true;
		markDirty();
		setError("");
		setDraft((previous) => ({
			...previous,
			status,
			payoutDate: status === "已报销" ? previous.payoutDate || localToday() : ""
		}));
	}
	function toggle(id, checked) {
		if (!canEdit || busy || locked.has(id)) return;
		setIds((previous) => checked ? [...new Set([...previous, id])] : previous.filter((item) => item !== id));
		markDirty();
		setError("");
	}
	async function save() {
		if (busy || !canEdit) return;
		setError("");
		try {
			await onSave({
				ids,
				draft,
				file,
				clearFile,
				checkedIssues,
				statusConfirmed: explicitStatus
			});
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : "保存失败，已保留本次填写和所选文件，请重试。");
		}
	}
	async function dissolve(reset) {
		try {
			await onDissolve(reset);
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : "操作失败，请核对当前批次。");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-5",
		onClick: () => {
			if (!busy) requestClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "登记报销收款",
			className: "flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-panel md:rounded-2xl",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 md:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: existing ? "收款批次" : "登记报销收款"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted",
						children: existing ? "本批整批办理，原费用明细各自保留。" : "选好费用明细，再统一登记这一次收款。"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [existing && canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							disabled: busy,
							onClick: () => void dissolve(false),
							children: "解除本批合并"
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							disabled: busy,
							onClick: requestClose,
							children: "关闭"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [rows.length, " 笔费用 · 本次收款合计"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								"data-testid": "expense-payout-total",
								className: "mt-1 font-display text-2xl font-semibold tabular-nums",
								children: ["¥", money(total)]
							})] }), existing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border border-line bg-surface px-3 py-1 text-xs",
								children: existing.status === "已报销" ? "已收款" : existing.status === "未报销" ? "待收款" : "状态待核对"
							}) : null]
						}),
						existing?.issues.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-5 rounded-xl border border-warn/40 bg-bg-elevated p-3 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-warn",
									children: "这批记录需要核对"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-muted",
									children: [existing.issues.join("；"), "。请按实际收款信息统一确认，原凭证文件不会删除。"]
								}),
								canEdit && requireIssuesCheck ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "mt-3 flex items-start gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "mt-1 size-4 shrink-0",
										checked: checkedIssues,
										disabled: busy,
										onChange: (event) => {
											setCheckedIssues(event.target.checked);
											markDirty();
										}
									}), "已核对本批异常，按本次填写的信息统一"]
								}) : null
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold",
											children: "1. 核对费用清单"
										}), canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											disabled: busy,
											onClick: () => setShowAdd(!showAdd),
											children: showAdd ? "收起选择" : "添加未分批明细"
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										"data-testid": "expense-payout-members",
										className: "max-h-64 overflow-y-auto rounded-xl border border-line",
										children: rows.length ? rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											"data-expense-id": row.id,
											className: "flex items-start gap-3 border-b border-line p-3 last:border-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "break-words text-sm font-medium",
														children: row.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "mt-1 text-xs text-muted",
														children: [
															row.period || row.date || "未填购买日期",
															" · ",
															row.claimant || "未填报销人",
															" · ",
															row.status
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "shrink-0 text-sm tabular-nums",
													children: ["¥", money(row.amount)]
												}),
												canEdit && !locked.has(row.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													"aria-label": `移除 ${row.name}`,
													disabled: busy,
													className: "text-xs text-muted hover:text-danger",
													onClick: () => toggle(row.id, false),
													children: "移除"
												}) : null
											]
										}, row.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "p-4 text-sm text-muted",
											children: "先在下方选择要一起收款的费用。"
										})
									}),
									canEdit && showAdd ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2 rounded-xl border border-line bg-bg-elevated p-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												"aria-label": "搜索可加入的报销",
												value: q,
												placeholder: "搜索项目、报销人或购买时间",
												disabled: busy,
												onChange: (event) => setQ(event.target.value)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													"aria-label": "可加入报销状态",
													className: "field-select w-auto",
													value: candidateStatus,
													disabled: busy,
													onChange: (event) => setCandidateStatus(event.target.value),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "未报销",
														children: "未报销、未分批"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "all",
														children: "全部未分批"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "button",
													variant: "ghost",
													size: "sm",
													disabled: busy || !candidates.length,
													onClick: () => {
														setIds((previous) => allCandidates ? previous.filter((id) => !candidates.some((row) => row.id === id)) : [...new Set([...previous, ...candidates.map((row) => row.id)])]);
														markDirty();
													},
													children: allCandidates ? "取消筛选结果选择" : "全选筛选结果"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "max-h-56 space-y-1 overflow-y-auto",
												children: [candidates.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "flex cursor-pointer items-center gap-3 rounded-lg bg-surface p-2 text-sm",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															"aria-label": `加入 ${row.name}`,
															type: "checkbox",
															className: "size-4 shrink-0",
															checked: ids.includes(row.id),
															disabled: busy,
															onChange: (event) => toggle(row.id, event.target.checked)
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "min-w-0 flex-1 break-words",
															children: [row.name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "mt-1 block text-xs text-muted",
																children: [
																	row.claimant || "未填报销人",
																	" · ",
																	row.period || row.date
																]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "shrink-0 tabular-nums",
															children: ["¥", money(row.amount)]
														})
													]
												}, row.id)), !candidates.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "p-2 text-sm text-muted",
													children: "当前没有可加入的未分批费用。"
												}) : null]
											})
										]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs leading-relaxed text-muted",
										children: "每笔费用的项目、金额、报销人和购买凭证独立保留。已分批记录从原批次整批办理，避免把不同收款混到一起。"
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold",
										children: "2. 登记这一次收款"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-2",
										"aria-label": "本次收款状态",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: draft.status === "未报销" ? "default" : "outline",
											"aria-pressed": draft.status === "未报销",
											disabled: !canEdit || busy,
											onClick: () => selectStatus("未报销"),
											children: "待收款"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: draft.status === "已报销" ? "default" : "outline",
											"aria-pressed": draft.status === "已报销",
											disabled: !canEdit || busy,
											onClick: () => selectStatus("已报销"),
											children: "已收到报销款"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: draft.status === "未报销" ? "只选费用就能先保存为一批，收款资料可稍后补；收到款后再打开本批确认。" : "确认款项已收到后，整批记为已报销；这里仅登记，不执行银行转账。"
									}),
									requireStatusChoice && !explicitStatus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										role: "alert",
										className: "text-sm text-warn",
										children: "所选明细的状态或收款日期不一致，请明确选择本次收款状态与日期。"
									}) : null,
									draft.status === "未报销" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										size: "sm",
										disabled: busy,
										"aria-expanded": showAccount,
										onClick: () => setShowAccount(!showAccount),
										children: showAccount ? "收起收款资料" : "提前填写收款资料（选填）"
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
										disabled: !canEdit || busy,
										className: accountVisible ? "min-w-0 space-y-3" : "hidden",
										children: [
											missingClaimant ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
												label: `报销人（补齐 ${missingClaimant} 笔未填写的明细）`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													"aria-label": "报销人（补未填写的明细）",
													value: draft.claimant,
													onChange: (event) => patch("claimant", event.target.value),
													placeholder: "只补空白，不覆盖原报销人"
												})
											}) : null,
											accounts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
												label: "选择已用过的收款账户",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													"aria-label": "已用收款账户",
													className: "field-select w-full",
													defaultValue: "",
													onChange: (event) => {
														const account = accounts[Number(event.target.value)];
														if (!event.target.value || !account) return;
														editedForm.current = true;
														markDirty();
														setDraft((previous) => ({
															...previous,
															forWhom: account.name,
															payBank: account.bank,
															payCardNo: account.card
														}));
													},
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "",
														children: "手动填写，或选择已有账户"
													}), accounts.map((account, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
														value: index,
														children: [
															account.name,
															" · ",
															account.bank,
															" · 尾号",
															account.card.slice(-4)
														]
													}, JSON.stringify(account)))]
												})
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
												label: "收款人",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													"aria-label": "收款人",
													value: draft.forWhom,
													onChange: (event) => changePayee(event.target.value),
													placeholder: "这一次款项由谁收到"
												})
											}),
											commonClaimant ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: "ghost",
												size: "sm",
												onClick: () => changePayee(commonClaimant),
												children: "收款人同报销人"
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
												label: "收款方式",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
													"aria-label": "收款方式",
													className: "field-select w-full",
													value: draft.payoutMethod,
													onChange: (event) => patch("payoutMethod", event.target.value),
													children: PAY_METHODS.map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: method }, method))
												})
											}),
											draft.payoutMethod !== "现金" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
												label: "开户行",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													"aria-label": "开户行",
													value: draft.payBank,
													onChange: (event) => patch("payBank", event.target.value),
													placeholder: "银行及支行"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
												label: "收款账户",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													"aria-label": "收款账户",
													inputMode: "text",
													autoComplete: "off",
													value: draft.payCardNo,
													onChange: (event) => patch("payCardNo", event.target.value),
													placeholder: "银行卡号或实际收款账号"
												})
											})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted",
												children: "现金收款不用填写开户行和账号。"
											}),
											draft.status === "已报销" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
												label: "收款日期",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													"aria-label": "收款日期",
													type: "date",
													value: draft.payoutDate,
													onChange: (event) => patch("payoutDate", event.target.value)
												})
											}) : null
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2 rounded-xl border border-line p-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-sm font-medium",
												children: "收款凭证（本批共用一张）"
											}),
											existing?.fileName && !clearFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
														id: existing.id,
														kind: "payout",
														fileName: existing.fileName,
														readOnly: true
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "break-all text-xs text-muted",
														children: existing.fileName
													}),
													canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "ghost",
														size: "sm",
														disabled: busy,
														onClick: () => {
															setClearFile(true);
															markDirty();
														},
														children: "不再关联原凭证"
													}) : null
												]
											}) : null,
											canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													"aria-label": "选择收款凭证",
													type: "file",
													accept: "image/*,.pdf",
													className: "block w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-accent",
													disabled: busy,
													onChange: (event) => {
														setFile(event.target.files?.[0] || null);
														markDirty();
														setError("");
													}
												}),
												file ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-center gap-2 text-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "break-all",
														children: ["待保存：", file.name]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "ghost",
														size: "sm",
														disabled: busy,
														onClick: () => {
															setFile(null);
															markDirty();
														},
														children: "移除待上传凭证"
													})]
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted",
													children: "选文件不会立即修改单据；点击下方保存后才上传并关联整批。"
												})
											] }) : !existing?.fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted",
												children: "本批未关联共同收款凭证。"
											}) : null,
											clearFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-warn",
												children: "保存后整批不再关联旧凭证，原文件保留。"
											}) : null
										]
									})
								]
							})]
						}),
						existing && canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-6 rounded-xl border border-line p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-semibold",
									children: "批次合并错了？整批处理"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs leading-relaxed text-muted",
									children: [
										"本批已保存 ",
										existing.rows.length,
										" 笔，合计 ¥",
										money(existing.total),
										"。解除合并只取消批次关联；撤销收款会另外恢复未报销。原单据金额和购买凭证都保留，操作前会显示确认范围。"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs leading-relaxed text-muted",
									children: "已经被旧操作覆盖的原批次关系不能自动推断；需要准确恢复原分批时，请使用事故前的可靠台账备份。"
								})
							]
						}) : null,
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "mt-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger",
							children: error
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							rows.length,
							" 笔 · ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
								className: "tabular-nums",
								children: ["¥", money(total)]
							})
						]
					}), canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [existing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "danger",
							size: "sm",
							disabled: busy,
							onClick: () => void dissolve(true),
							children: "撤销本批收款"
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							disabled: busy || !ids.length || requireStatusChoice && !explicitStatus || requireIssuesCheck && !checkedIssues,
							onClick: () => void save(),
							children: busy ? "正在保存…" : draft.status === "已报销" ? "确认收款并保存" : "保存待收款批次"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "只读查看，不可修改收款记录"
					})]
				})
			]
		})
	});
}
function ExpensePayoutList({ batches, shownIds, onOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": "收款批次列表",
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-bg-elevated p-4 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-semibold",
					children: "一笔收款，对应一批费用"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 leading-relaxed text-muted",
					children: [
						"共 ",
						batches.length,
						" 批。打开后可核对整批明细、登记收款或一次解除合并。费用不会因收款人或日期相同而自动合并。"
					]
				})]
			}),
			batches.map((batch) => {
				const hidden = batch.rows.filter((row) => !shownIds.has(row.id)).length;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
					"data-payout-id": batch.id,
					className: "rounded-xl border border-line bg-surface p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "break-words font-semibold",
											children: batch.payee || "未填收款人"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: batch.status === "已报销" ? "ok" : "warn",
											children: batch.status === "已报销" ? "已收款" : batch.status === "未报销" ? "待收款" : "状态待核对"
										}),
										batch.issues.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "warn",
											children: "需核对"
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-medium tabular-nums",
											children: ["¥", money(batch.total)]
										}),
										" · ",
										batch.rows.length,
										" 笔 · ",
										batch.date || "未填日期"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 break-words text-xs text-muted",
									children: ["报销人：", batch.claimant || "未填"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 break-words text-xs text-muted",
									children: [batch.rows.slice(0, 3).map((row) => row.name).join("、"), batch.rows.length > 3 ? ` 等${batch.rows.length}笔` : ""]
								}),
								batch.fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 break-all text-xs text-muted",
									children: ["凭证：", batch.fileName]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted",
									children: "未关联共同收款凭证"
								}),
								batch.issues.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-warn",
									children: batch.issues.join("；")
								}) : null,
								hidden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-xs text-muted",
									children: [
										"另含 ",
										hidden,
										" 笔在当前筛选范围外，打开后按完整批次核对。"
									]
								}) : null
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							onClick: () => onOpen(batch.id),
							children: "查看批次"
						})]
					})
				}, batch.id);
			}),
			!batches.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl border border-line bg-surface p-6 text-center text-sm text-muted",
				children: "当前筛选下没有收款批次。到“报销明细”选费用，或点击“登记收款”开始。"
			}) : null
		]
	});
}
function safeBase(s) {
	return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
function amountTag(n) {
	const x = Number(n) || 0;
	return String(Number.isInteger(x) ? x : round2(x));
}
function dateFromPeriod(period, fallback) {
	const p = String(period || "").trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
	const m = p.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
	if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
	return fallback || localToday();
}
function voucherBase(items) {
	if (!items.length) return "报销凭证";
	if (items.length === 1) return `${safeBase(items[0].name)}-${amountTag(items[0].amount)}`;
	let n = items.slice(0, 3).map((e) => `${safeBase(e.name)}-${amountTag(e.amount)}`).join("+");
	if (items.length > 3) n += `等${items.length}笔`;
	return n.slice(0, 80);
}
function payoutBase(items) {
	if (!items.length) return "收报销款-0-0笔";
	return `收报销款-${amountTag(round2(items.reduce((s, e) => s + (e.amount || 0), 0)))}-${items.length}笔`;
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
function NameInput({ value, onChange, names, listId, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
		value: value || "",
		list: listId,
		placeholder,
		onChange: (e) => onChange(e.target.value)
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
		id: listId,
		children: (names || []).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: n }, n))
	})] });
}
function VoucherSlot({ title, hint, id, kind, fileName, optional, extra, onFile, onDeleted }) {
	const ref = import_react.useRef(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-1.5 py-1.5",
		onDragOver: (e) => e.preventDefault(),
		onDrop: (e) => {
			e.preventDefault();
			const f = e.dataTransfer.files?.[0];
			if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-14 shrink-0 text-xs font-medium",
				children: title
			}),
			fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: "ok",
				children: "已传"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: optional ? "选填" : "待传" }),
			extra || null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 truncate text-[11px] text-muted",
				title: fileName || hint,
				children: fileName || hint || "点上传，或把文件拖到这一行"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref,
				type: "file",
				accept: ".pdf,.ofd,.jpg,.jpeg,.png,.webp",
				className: "sr-only",
				onChange: (e) => {
					const f = e.target.files?.[0];
					e.target.value = "";
					if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn inline-flex items-center rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90",
				onClick: () => ref.current?.click(),
				children: fileName ? "更换" : "上传"
			}),
			fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
				id: id || "pending",
				kind,
				fileName,
				onDeleted
			}) : null
		]
	});
}
function useExpensePayout(onApplied) {
	const context = import_react.useSyncExternalStore(subscribeLedgerContext, ledgerContextSnapshot, () => null);
	const [session, setSession] = import_react.useState(null);
	const sessionRef = import_react.useRef(null);
	const [busy, setBusy] = import_react.useState(false);
	const working = import_react.useRef(false);
	const mounted = import_react.useRef(true);
	const [undo, setUndo] = import_react.useState(null);
	import_react.useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
			sessionRef.current = null;
		};
	}, []);
	import_react.useEffect(() => {
		sessionRef.current = null;
		setSession(null);
		setUndo(null);
	}, [context]);
	function open(ids, editingId) {
		const scope = ledgerContextSnapshot();
		if (scope === null || working.current) {
			toast.error("台账正在读取或保存，请稍后再办理");
			return;
		}
		const all = JSON.parse(JSON.stringify(useApp.getState().expenses || []));
		const picked = all.filter((row) => ids.includes(row.id));
		const groups = [...new Set(picked.map((row) => row.payoutId).filter(Boolean))];
		if (!editingId && groups.length) {
			if (groups.length !== 1 || picked.some((row) => !row.payoutId)) {
				toast.error("所选记录属于不同批次。请打开原收款批次整批办理，再添加未分批明细。");
				return;
			}
			editingId = groups[0];
		}
		const initial = editingId ? all.filter((row) => row.payoutId === editingId).map((row) => row.id) : ids;
		if (editingId && !initial.length) {
			toast.error("该批次已变化，请刷新后重新打开");
			return;
		}
		const next = {
			key: uid(),
			context: scope,
			all,
			ids: initial,
			...editingId ? { editingId } : {}
		};
		sessionRef.current = next;
		setSession(next);
	}
	function close() {
		if (!working.current) {
			sessionRef.current = null;
			setSession(null);
		}
	}
	function assertSession(current, plan) {
		if (!mounted.current || sessionRef.current?.key !== current.key || ledgerContextSnapshot() !== current.context) throw new Error("台账或办理对象已改变，本次操作已取消，请重新打开。");
		if (blockedWrite("expenses.edit", "报销收款")) throw new Error("当前账号不能修改报销收款。");
		if (plan && !expenseBatchMatches(useApp.getState().expenses, plan.before, plan.groupId)) throw new Error("本批明细已被修改、删除或新增，请重新打开核对；没有覆盖最新记录。");
	}
	async function commit(plan, scope, label) {
		if (!useApp.getState().applyExpenseBatch(plan.before, plan.after, plan.groupId)) throw new Error("记录已变化，本次没有写入，请重新打开核对。");
		setUndo({
			plan,
			context: scope,
			label
		});
		sessionRef.current = null;
		setSession(null);
		onApplied();
		const result = await flushPendingLedger();
		if (!mounted.current || ledgerContextSnapshot() !== scope || !expenseBatchMatches(useApp.getState().expenses, plan.after)) {
			toast.message("台账内容已更新，请以当前列表为准，本次操作未被确认为已保存。");
			return;
		}
		if (result.status === "failed") toast.error(`本机已${label}，服务器尚未保存。请在顶部重试同步，或撤销上次批次操作。${result.reason}`);
		else toast.success(`已${label}（${plan.after.length}笔）`);
	}
	async function save(input) {
		if (working.current) return;
		const current = sessionRef.current;
		if (!current) throw new Error("请重新打开收款窗口。");
		assertSession(current);
		const batch = expensePayoutBatches(current.all).find((item) => item.id === current.editingId);
		const selectedRows = current.all.filter((row) => input.ids.includes(row.id));
		if ((selectedRows.some((row) => row.status !== selectedRows[0]?.status) || batch?.issues.includes("收款日期不一致")) && !input.statusConfirmed) throw new Error("本批收款状态或日期不同，请明确选择本次状态与日期。");
		if (batch?.issues.some((issue) => !["收款状态不一致", "收款日期不一致"].includes(issue)) && !input.checkedIssues) throw new Error("请先核对本批不一致的信息，再选择本次统一的收款信息。");
		const payoutId = input.file ? uid() : current.editingId || uid();
		let fileName = input.clearFile ? "" : batch?.fileName || "";
		let plan = planExpensePayout({
			all: current.all,
			ids: input.ids,
			editingId: current.editingId,
			draft: input.draft,
			payoutId,
			fileName
		});
		assertSession(current, plan);
		const alreadyPaid = plan.before.filter((row) => row.status === "已报销").length;
		if (input.draft.status === "未报销" && alreadyPaid && !confirm(`这 ${plan.after.length} 笔合计¥${money(expensePayoutBatches(plan.after)[0].total)}，其中 ${alreadyPaid} 笔原为已报销。\n保存待收款将整批改为未报销并清除收款日期，保留本批关联。确认继续？`)) return;
		if (input.draft.status === "已报销" && input.draft.payoutMethod !== "现金" && !input.file && !fileName && !confirm(`这 ${plan.after.length} 笔将登记为已收到报销款，尚无收款凭证。确认继续？`)) return;
		working.current = true;
		setBusy(true);
		try {
			if (input.file) {
				const taken = useApp.getState().expenses.map((row) => row.payoutFileName).filter(Boolean);
				const named = renameFile(input.file, uniqueBase(payoutBase(plan.before), taken));
				assertSession(current, plan);
				fileName = await setDoc(payoutId, "payout", named);
				assertSession(current, plan);
				plan = planExpensePayout({
					all: current.all,
					ids: input.ids,
					editingId: current.editingId,
					draft: input.draft,
					payoutId,
					fileName
				});
			}
			assertSession(current, plan);
			await commit(plan, current.context, input.draft.status === "已报销" ? "登记收款" : "保存待收款批次");
		} finally {
			working.current = false;
			if (mounted.current) setBusy(false);
		}
	}
	async function dissolve(resetPaid) {
		if (working.current) return;
		const current = sessionRef.current;
		if (!current) return;
		assertSession(current);
		const ids = current.editingId ? current.all.filter((row) => row.payoutId === current.editingId).map((row) => row.id) : current.ids;
		const plan = planDissolveExpensePayout(current.all, ids, resetPaid);
		assertSession(current, plan);
		const total = expensePayoutBatches(plan.before)[0]?.total;
		const summary = `${plan.before.length}笔${total === void 0 ? "" : `，合计¥${money(total)}`}`;
		const description = resetPaid ? "这些记录将恢复未报销，清除收款日期并解除合并。单据金额、购买凭证及收款账户保留。" : "只解除合并及共用收款凭证的关联；单据金额、收款状态、日期和账户保持不变。原凭证文件保留在影像资料。";
		if (!confirm(`${resetPaid ? "撤销本批收款" : "解除本批合并"}：${summary}？\n\n${description}`)) return;
		assertSession(current, plan);
		working.current = true;
		setBusy(true);
		try {
			await commit(plan, current.context, resetPaid ? "撤销收款，恢复未报销" : "解除合并");
		} finally {
			working.current = false;
			if (mounted.current) setBusy(false);
		}
	}
	async function restoreLast() {
		if (!undo || working.current || ledgerContextSnapshot() !== undo.context) return;
		if (blockedWrite("expenses.edit", "报销收款")) return;
		if (!confirm(`撤销上次“${undo.label}”操作，恢复这 ${undo.plan.before.length} 笔操作前的收款关系？\n仅本次会话的上一步可以撤销；已另行修改的单据不会被覆盖。`)) return;
		working.current = true;
		setBusy(true);
		try {
			if (!useApp.getState().applyExpenseBatch(undo.plan.after, undo.plan.before)) throw new Error("这些记录已另行修改，不能直接撤销；请重新核对批次。");
			setUndo(null);
			onApplied();
			const result = await flushPendingLedger();
			if (result.status === "failed") toast.error(`撤销已在本机完成，服务器尚未保存：${result.reason}`);
			else if (ledgerContextSnapshot() === undo.context) toast.success("已恢复上次操作前的收款关系");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "撤销失败，请核对当前记录");
		} finally {
			working.current = false;
			if (mounted.current) setBusy(false);
		}
	}
	return {
		context,
		session,
		busy,
		undo,
		open,
		close,
		save,
		dissolve,
		restoreLast
	};
}
function ExpenseEditor({ draft, creating, all, selectedIds, names, onCancel, onSave, onDelete, onPrintSingle, onManagePayout, isCurrent }) {
	const [c, setC] = import_react.useState(() => expenseFormFromDraft(draft));
	const [uploading, setUploading] = import_react.useState(false);
	const uploadingRef = import_react.useRef(false);
	const { markDirty, resetDirty, requestClose } = useGuardedClose(onCancel);
	import_react.useEffect(() => {
		setC(expenseFormFromDraft(draft));
	}, [draft.id]);
	import_react.useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape" && !uploadingRef.current) requestClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [requestClose]);
	function patch(key, value) {
		setC((prev) => {
			const next = {
				...prev,
				[key]: value
			};
			if (key === "qty" || key === "price") next.amount = round2((key === "qty" ? value : next.qty) * (key === "price" ? value : next.price));
			if (key === "period") next.date = dateFromPeriod(value, prev.date);
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
	const siblings = c.payoutId ? (all || []).filter((e) => e.payoutId === c.payoutId) : [];
	async function uploadVoucher(file) {
		if (!file || uploadingRef.current || !currentOrWarn()) return;
		uploadingRef.current = true;
		setUploading(true);
		try {
			if (!c.name.trim()) {
				toast.error("先填项目名称，凭证按「项目名称-金额」保存");
				return;
			}
			const group = shareTargets.length > 1 ? shareTargets.map((e) => e.id === c.id ? c : e) : [c];
			const vid = c.voucherId || uid();
			const pack = await prepareNamedFile(file, voucherBase(group), (all || []).map((e) => e.voucherFileName).filter(Boolean), c.voucherFileName);
			if (!pack || !currentOrWarn()) return;
			const saved = await setDoc(vid, "expense", pack.file, { replace: pack.replace }) || pack.file.name;
			if (!currentOrWarn()) return;
			const next = payload({
				...c,
				id: c.id || uid(),
				voucherId: vid,
				voucherFileName: saved
			});
			setC(next);
			let ok = true;
			if (onSave(next) === false) ok = false;
			for (const e of group) {
				if (e.id === next.id) continue;
				if (onSave({
					...e,
					voucherId: vid,
					voucherFileName: saved
				}) === false) ok = false;
			}
			if (ok) resetDirty();
			toast.success(group.length > 1 ? `已保存购买凭证，并挂到勾选的 ${group.length} 笔` : `已保存 ${saved}`);
		} catch (failure) {
			toast.error(failure instanceof Error ? failure.message : "购买凭证上传失败，已保留填写内容");
		} finally {
			uploadingRef.current = false;
			setUploading(false);
		}
	}
	function currentOrWarn() {
		if (isCurrent()) return true;
		toast.error("台账或编辑对象已改变，请重新打开；本次内容没有写入。");
		return false;
	}
	function payload(row) {
		const next = {
			...row,
			amount: round2(numOr(row.amount, 0))
		};
		for (const key of [
			"forWhom",
			"payBank",
			"payCardNo",
			"payAccount",
			"payoutId",
			"payoutFileName",
			"payoutDate",
			"payoutMethod",
			"reimbursedAt",
			"status"
		]) next[key] = draft[key];
		return next;
	}
	function submit() {
		if (uploadingRef.current || !currentOrWarn()) return null;
		if (!c.name.trim()) {
			toast.error("项目名称必填");
			return null;
		}
		if (needsVoucher(c.payMethod) && !c.voucherFileName && !confirm("购买不是现金，还没上传凭证。仍要保存？")) return null;
		const next = payload({
			...c,
			id: c.id || uid()
		});
		if (onSave(next) === false) return null;
		setC(next);
		resetDirty();
		return next;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6",
		onClick: () => {
			if (!uploadingRef.current) requestClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "expense-editor",
			className: "max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			onChange: markDirty,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: creating ? "新增报销" : c.name || "编辑报销"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "btn-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: c.status === "已报销" ? "ok" : "warn",
								children: c.status
							}),
							!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "danger",
								type: "button",
								disabled: uploading,
								onClick: onDelete,
								children: "删除"
							}) : null,
							!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								disabled: uploading,
								onClick: () => onPrintSingle(c),
								children: "打印报销单"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								disabled: uploading,
								onClick: requestClose,
								children: "关闭"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								disabled: uploading,
								onClick: () => {
									submit();
								},
								children: "保存报销信息"
							})
						]
					})]
				}),
				siblings.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs text-muted",
					children: [
						"同批打款共 ",
						siblings.length,
						" 笔：",
						siblings.map((e) => e.name).join("、")
					]
				}) : null,
				uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "status",
					className: "mb-3 rounded-lg bg-accent-soft p-3 text-sm",
					children: "正在上传购买凭证，请稍候；本次填写已锁定，避免迟到结果覆盖新改动。"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					disabled: uploading,
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
								label: "购买时间",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: c.period,
									onChange: (e) => patch("period", e.target.value),
									placeholder: "如 2026/3月-12月 或 2026/4/9"
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
								label: "购买支付方式",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "field-select w-full",
									value: c.payMethod || "现金",
									onChange: (e) => patch("payMethod", e.target.value),
									children: PAY_METHODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: m }, m))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "报销人（谁来报）",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NameInput, {
									value: c.claimant,
									names,
									listId: "ed-claimant",
									placeholder: "人员名单或手填",
									onChange: (v) => patch("claimant", v)
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
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "divide-y divide-line rounded-md border border-line bg-bg-elevated px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoucherSlot, {
							title: "购买凭证",
							hint: "现金也可以传。文件名「项目名称-金额」。",
							id: c.voucherId || c.id,
							kind: "expense",
							fileName: c.voucherFileName,
							optional: c.payMethod === "现金",
							extra: existingVouchers.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "h-8 max-w-40 rounded-sm border border-line bg-surface px-2 text-[11px]",
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
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "单独上传"
								}), existingVouchers.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: e.voucherId,
									children: e.voucherFileName
								}, e.voucherId))]
							}) : null,
							onFile: uploadVoucher,
							onDeleted: () => {
								const next = {
									...c,
									voucherFileName: "",
									voucherId: ""
								};
								setC(next);
								onSave(next);
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "py-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-medium",
									children: "收款信息按批次办理"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs leading-relaxed text-muted",
									children: [siblings.length ? `当前收款批次共 ${siblings.length} 笔。` : "本条费用尚未分批。", "保存费用后进入收款窗口，可核对清单、登记收款或整批解除合并。"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									size: "sm",
									className: "mt-3",
									onClick: () => {
										const next = submit();
										if (next) onManagePayout(next.id);
									},
									children: "保存后办理收款"
								})
							]
						})]
					})]
				})
			]
		})
	});
}
function emptyExpense(year) {
	const today = localToday();
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
		voucherFileName: "",
		claimant: "",
		forWhom: "",
		payAccount: "",
		payBank: "",
		payCardNo: "",
		payoutId: "",
		payoutFileName: "",
		payoutDate: "",
		payoutMethod: "转账"
	};
}
function uniqueNames(people, expenses) {
	const s = /* @__PURE__ */ new Set();
	for (const p of people || []) if (p.name) s.add(p.name);
	for (const e of expenses || []) if (e.claimant) s.add(e.claimant);
	return [...s];
}
function accountParts(e) {
	const name = (e.forWhom || "").trim();
	const bank = (e.payBank || "").trim();
	const card = (e.payCardNo || "").trim();
	if (!name && !bank && !card) return null;
	return {
		name,
		bank,
		card
	};
}
function ExpensesPage() {
	const { year, expenses, upsertExpense, removeExpenses, people } = useApp();
	const list = expenses || [];
	const names = uniqueNames(people, list);
	const [q, setQ] = import_react.useState("");
	const [status, setStatus] = import_react.useState("all");
	const [claimant, setClaimant] = import_react.useState(ALL_BUCKETS);
	const [scope, setScope] = import_react.useState("year");
	const [selected, setSelected] = import_react.useState([]);
	const [editing, setEditing] = import_react.useState(null);
	const [creating, setCreating] = import_react.useState(false);
	const [view, setView] = import_react.useState("details");
	const [editingContext, setEditingContext] = import_react.useState(null);
	const [editingKey, setEditingKey] = import_react.useState("");
	const editingKeyRef = import_react.useRef("");
	const payout = useExpensePayout(import_react.useCallback(() => setSelected([]), []));
	import_react.useEffect(() => {
		setSelected([]);
		setEditing(null);
		setCreating(false);
		editingKeyRef.current = "";
	}, [payout.context]);
	function startEditing(row, isNew) {
		if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
		const scope$1 = ledgerContextSnapshot();
		if (scope$1 === null) {
			toast.error("台账正在读取，请稍后编辑");
			return;
		}
		const key = uid();
		editingKeyRef.current = key;
		setEditingKey(key);
		setEditingContext(scope$1);
		setCreating(isNew);
		setEditing(row);
	}
	const canEditExpense = useCanSave("expenses.edit");
	const [printStatus, setPrintStatus] = import_react.useState("未报销");
	const [printVoucher, setPrintVoucher] = import_react.useState(false);
	const [printSingle, setPrintSingle] = import_react.useState(null);
	const shown = import_react.useMemo(() => filterExpenses(list, {
		scope,
		year,
		status,
		claimant,
		q
	}), [
		list,
		year,
		scope,
		status,
		claimant,
		q
	]);
	const pager = usePager("expenses", shown, [
		scope,
		status,
		claimant,
		q,
		year
	].join("|"));
	const pageRows = pager.rows;
	const claimantOpts = import_react.useMemo(() => claimantBuckets(filterExpenses(list, {
		scope,
		year,
		status,
		claimant: ALL_BUCKETS,
		q
	})), [
		list,
		scope,
		year,
		status,
		q
	]);
	const allChecked = pageRows.length > 0 && pageRows.every((e) => selected.includes(e.id));
	const picked = shown.filter((e) => selected.includes(e.id));
	const totals = expenseTotals(picked.length ? picked : shown);
	const sumTip = picked.length ? `已选 ${picked.length} 笔` : `本表 ${shown.length} 笔`;
	const printRows = import_react.useMemo(() => expensePrintRows({
		list,
		selected,
		shown,
		printStatus
	}), [
		list,
		selected,
		shown,
		printStatus
	]);
	const batchRows = list.filter((e) => selected.includes(e.id));
	const batchTotal = expenseTotals(batchRows).amount;
	const shownIds = new Set(shown.map((row) => row.id));
	const visibleBatches = import_react.useMemo(() => expensePayoutBatches(list), [list]).filter((batch) => batch.rows.some((row) => shownIds.has(row.id)));
	const pending = shown.filter((row) => row.status === "未报销" && !row.payoutId);
	function del(ids) {
		if (!ids.length) return;
		if (blockedWrite("expenses.delete", permLabel("expenses.delete"))) return;
		if (!confirmBatchDelete("报销", ids.length, "会同时去掉这些报销记录。凭证文件还在目录里，可到「影像资料」里清。")) return;
		removeExpenses(ids);
		setSelected((s) => s.filter((id) => !ids.includes(id)));
		if (editing && ids.includes(editing.id)) {
			setEditing(null);
			setCreating(false);
		}
		toast.success("已删除报销");
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
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-print space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadonlyNotice, { perm: "expenses.edit" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: "报销单"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 max-w-2xl text-sm text-muted",
						children: "费用明细各自保留；多笔一起收款，在“收款批次”统一核对、登记和解除合并。"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								disabled: !canEditExpense || payout.context === null || payout.busy,
								onClick: () => payout.open([]),
								children: "登记收款"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
								href: "/api/file/expense-template",
								filename: "报销单导入模板.xlsx"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseImport, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft",
								href: "/api/file/expense-export",
								children: "导出全部报销"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								disabled: !canEditExpense,
								title: canEditExpense ? void 0 : `你是只读账号（缺「${permLabel("expenses.edit")}」权限），改动不会保存。`,
								onClick: () => {
									if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
									startEditing(emptyExpense(year), true);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " 新增报销"]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "inline-flex rounded-lg border border-line bg-bg-elevated p-1",
						"aria-label": "报销查看方式",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: view === "details" ? "default" : "ghost",
							"aria-pressed": view === "details",
							onClick: () => {
								setView("details");
								setSelected([]);
							},
							children: "报销明细"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: view === "batches" ? "default" : "ghost",
							"aria-pressed": view === "batches",
							onClick: () => {
								setView("batches");
								setSelected([]);
							},
							children: "收款批次"
						})]
					}), payout.undo && canEditExpense ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						disabled: payout.busy,
						onClick: () => void payout.restoreLast(),
						children: "撤销上次批次操作"
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"aria-label": "报销年份范围",
							className: "field-select w-auto",
							value: scope,
							onChange: (e) => setScope(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: "year",
								children: [year, "年"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "全部年份"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"aria-label": "报销状态筛选",
							className: "field-select w-auto",
							value: status,
							onChange: (e) => setStatus(e.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "全部状态"
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
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							"aria-label": "报销人筛选",
							className: "field-select w-auto",
							value: claimant,
							onChange: (e) => setClaimant(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: ALL_BUCKETS,
								children: "全部报销人"
							}), claimantOpts.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: b.value,
								children: b.label
							}, b.value))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-xs",
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "搜索项目 / 报销人 / 收款人 / 账户"
						}),
						selected.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "danger",
							size: "sm",
							type: "button",
							onClick: () => del(selected),
							children: [
								"删除所选（",
								selected.length,
								"）"
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-auto text-sm text-muted",
							children: [
								shown.length,
								" 笔 · 合计 ¥",
								money(totals.amount),
								" · 未报销 ¥",
								money(totals.open),
								" · 已报销 ¥",
								money(totals.done),
								totals.missing + totals.missPay ? ` · 缺凭证 ${totals.missing + totals.missPay}` : ""
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "field-select w-auto",
							value: printStatus,
							onChange: (e) => setPrintStatus(e.target.value),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "未报销",
									children: "打印未报销"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "已报销",
									children: "打印已报销"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "打印全部"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							type: "button",
							onClick: doPrint,
							children: ["打印报销单", printRows.length ? `（${printRows.length}）` : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "inline-flex items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: printVoucher,
								onChange: (e) => setPrintVoucher(e.target.checked)
							}), "打印票据列"]
						}),
						selected.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [
								"已勾选 ",
								selected.length,
								" 笔，打印时只用勾选的"
							]
						}) : null
					]
				}),
				view === "details" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						disabled: !pending.length,
						onClick: () => setSelected(pending.map((row) => row.id)),
						children: [
							"全选待收款（",
							pending.length,
							"笔）"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "选择当前筛选下全部未报销、未分批的费用，可跨页办理。"
					})]
				}) : null,
				selected.length && view === "details" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"aria-label": "报销选择操作",
					className: "fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-surface p-3 shadow-panel md:sticky md:inset-x-auto md:bottom-auto md:top-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-semibold",
						children: [
							"已选 ",
							batchRows.length,
							" 笔 · ¥",
							money(batchTotal)
						]
					}), batchRows.some((row) => !shownIds.has(row.id)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-warn",
						children: "包含当前筛选外的已选明细，办理前请核对完整清单。"
					}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							disabled: payout.busy,
							onClick: () => setSelected([]),
							children: "清空选择"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							size: "sm",
							disabled: !canEditExpense || payout.busy || payout.context === null,
							onClick: () => payout.open(selected),
							children: [
								"办理所选（",
								batchRows.length,
								"笔）"
							]
						})]
					})]
				}) : null,
				payout.session ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpensePayoutEditor, {
					session: payout.session,
					canEdit: canEditExpense,
					busy: payout.busy,
					onClose: payout.close,
					onSave: payout.save,
					onDissolve: payout.dissolve
				}, payout.session.key) : null,
				editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseEditor, {
					draft: editing,
					isCurrent: () => editingKeyRef.current === editingKey && ledgerContextSnapshot() === editingContext,
					onManagePayout: (id) => {
						editingKeyRef.current = "";
						setEditing(null);
						setCreating(false);
						payout.open([id]);
					},
					creating,
					all: list,
					selectedIds: selected,
					names,
					onCancel: () => {
						editingKeyRef.current = "";
						setEditing(null);
						setCreating(false);
					},
					onSave: (row) => {
						if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return false;
						if (editingKeyRef.current !== editingKey || ledgerContextSnapshot() !== editingContext) {
							toast.error("台账或编辑对象已改变，请重新打开，旧内容没有写入。");
							return false;
						}
						upsertExpense(row);
						if (row.id === editing.id) {
							setEditing(row);
							setCreating(false);
						}
						toast.success("报销已在本机保存，正在同步");
						return true;
					},
					onDelete: () => del([editing.id]),
					onPrintSingle: (row) => {
						setPrintSingle(row);
						setTimeout(() => {
							window.print();
							setPrintSingle(null);
						}, 0);
					}
				}, editingKey) : null,
				view === "batches" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpensePayoutList, {
					batches: visibleBatches,
					shownIds,
					onOpen: (id) => payout.open([], id)
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "expenses",
					pager,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "wide-table text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "border-b border-line text-xs text-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "w-10 py-2 px-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "size-4",
											checked: allChecked,
											onChange: (e) => {
												const ids = pageRows.map((r) => r.id);
												setSelected((s) => e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id)));
											},
											"aria-label": "全选报销"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "操作"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "序号"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "项目"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "购买时间"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "金额"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "报销人"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "打款账户"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "状态"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "凭证"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "py-2 px-3",
										children: "备注"
									})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 11,
								className: "py-8 text-center text-sm text-muted",
								children: "还没有报销。点右上角「新增报销」。勾几笔可一起报销、记打款。"
							}) }) : null, pageRows.map((e, i) => {
								const on = editing?.id === e.id;
								const sib = e.payoutId ? list.filter((x) => x.payoutId === e.payoutId).length : 0;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: `group border-b border-line last:border-0 hover:bg-accent-soft ${on || selected.includes(e.id) ? "bg-accent-soft" : ""}`,
									onClick: () => setSelected((s) => toggleSel(s, e.id, !s.includes(e.id))),
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
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3",
											onClick: (ev) => ev.stopPropagation(),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												type: "button",
												className: "h-7 px-2 text-[11px]",
												disabled: !canEditExpense,
												title: canEditExpense ? void 0 : `你是只读账号（缺「${permLabel("expenses.edit")}」权限），改动不会保存。`,
												onClick: () => {
													if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
													startEditing(e, false);
												},
												children: "编辑"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3 tabular-nums text-muted",
											children: (pager.page - 1) * pager.size + i + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3 font-medium",
											children: e.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3",
											children: e.period || e.date
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3 text-right tabular-nums font-medium",
											children: money(e.amount)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3",
											children: e.claimant || "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3",
											children: (() => {
												const parts = accountParts(e);
												if (!parts) return "—";
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-xs leading-snug",
													children: [
														parts.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "font-medium",
															children: parts.name
														}) : null,
														parts.bank ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "text-muted",
															children: parts.bank
														}) : null,
														parts.card ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "tabular-nums text-muted",
															children: parts.card
														}) : null
													]
												});
											})()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													tone: e.status === "已报销" ? "ok" : "warn",
													children: e.status
												}), e.payoutId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													className: "block text-xs text-accent underline underline-offset-2",
													onClick: (event) => {
														event.stopPropagation();
														payout.open([], e.payoutId);
													},
													children: [
														"查看同批（",
														sib,
														"笔）"
													]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block text-xs text-muted",
													children: "未分批"
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 px-3 text-xs",
											onClick: (ev) => ev.stopPropagation(),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col gap-0.5",
												children: [e.voucherFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
													id: e.voucherId || e.id,
													kind: "expense",
													fileName: e.voucherFileName
												}) : e.payMethod === "现金" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted",
													children: "—"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-warn",
													children: "缺购买"
												}), e.payoutFileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
														id: e.payoutId || e.id,
														kind: "payout",
														fileName: e.payoutFileName
													}), sib > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-muted",
														children: [
															"·",
															sib,
															"笔"
														]
													}) : null]
												}) : e.status === "已报销" && (e.payoutMethod || "转账") !== "现金" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-warn",
													children: "缺打款"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted",
													children: "—"
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "max-w-32 truncate py-2 px-3 text-xs text-muted",
											children: e.remark
										})
									]
								}, e.id);
							})] }),
							shown.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t-2 border-ink bg-bg-elevated text-sm font-medium",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-2 px-3",
										colSpan: 5,
										children: [
											"合计（",
											sumTip,
											"）"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-right tabular-nums",
										children: money(totals.amount)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-2 px-3 text-xs font-normal text-muted",
										colSpan: 5,
										children: [
											"未报销 ¥",
											money(totals.open),
											"　已报销 ¥",
											money(totals.done)
										]
									})
								]
							}) }) : null
						]
					})
				}),
				selected.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": "true",
					className: "h-32 md:hidden"
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseSheets, {
			rows: printSingle ? [printSingle] : printRows,
			showVoucher: printVoucher
		})] })
	});
}
function ExpenseSheets({ rows, showVoucher }) {
	if (!rows.length) return null;
	const today = localToday();
	const total = rows.reduce((s, e) => s + (e.amount || 0), 0);
	const claimants = [...new Set(rows.map((e) => e.claimant).filter(Boolean))];
	const forWhoms = [...new Set(rows.map((e) => e.forWhom).filter(Boolean))];
	const banks = [...new Set(rows.map((e) => (e.payBank || "").trim()).filter(Boolean))];
	const cards = [...new Set(rows.map((e) => (e.payCardNo || "").trim()).filter(Boolean))];
	const cols = showVoucher ? [
		"序号",
		"项目",
		"购买时间",
		"金额",
		"备注",
		"票据"
	] : [
		"序号",
		"项目",
		"购买时间",
		"金额",
		"备注"
	];
	const columnWidths = showVoucher ? [
		9,
		27,
		18,
		17,
		17,
		12
	] : [
		9,
		33,
		18,
		17,
		23
	];
	const emptyCells = showVoucher ? 2 : 1;
	const identity = [
		`报销人：${claimants.join("、") || "—"}`,
		`收款人：${forWhoms.join("、") || "—"}`,
		`开户行：${banks.join("、") || "—"}`,
		`打款账户：${cards.map(formatCardNo).join("、") || "—"}`
	].join(" · ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only space-y-8 text-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "statement expense-statement border border-black p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "border-b border-black pb-2 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl font-semibold tracking-widest",
						children: "报销单"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-2 w-full border-collapse text-center text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: columnWidths.map((width, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: `${width}%` } }, i)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "border border-black px-1 py-1 text-left font-medium",
							colSpan: cols.length,
							children: identity
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: cols.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "border border-black px-1 py-1 font-medium",
							children: col
						}, col)) })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [rows.map((e, i) => {
							const cells = [
								i + 1,
								e.name,
								e.period || e.date,
								money(e.amount),
								e.remark || ""
							];
							if (showVoucher) cells.push(e.voucherFileName || (e.payMethod === "现金" ? "现金" : "—"));
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: cells.map((v, k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: v
							}, k)) }, e.id);
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
							"合计",
							"",
							"",
							money(total),
							...Array(emptyCells).fill("")
						].map((v, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "border border-black px-1 py-1 font-medium",
							children: v
						}, i)) })] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-right text-xs",
					children: ["打印日期 ", today]
				})
			]
		})
	});
}
export { ExpensesPage as component };
