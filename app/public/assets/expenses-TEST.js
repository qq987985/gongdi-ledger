import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";
import{r as t}from"./audit-K39-jiKA.js";
import{t as n}from"./jsx-runtime-DREnUpxT.js";
import{d as setDoc,t as DocActions}from"./doc-actions-CmcTaqrK.js";
import{a as toggleSel,i as money,n as confirmBatch,o as uid}from"./utils-BSPq25aB.js";
import{S as Plus,_ as Label,g as Input,h as toast,v as Button,y as useApp}from"./index-ghxum7yZ.js";
import{n as WideTable,a as PageBar,o as usePager}from"./wide-table-BtpzsvMP.js";
import{n as Need}from"./can-9AzYldNF.js";
import{t as Badge}from"./badge-_ctqz85I.js";
var L=e(t()),R=n();
var PAY_METHODS = ["现金", "转账", "微信", "支付宝", "对公", "其他"];

function safeBase(s) {
	return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
function needsVoucher(method) {
	return (method || "现金") !== "现金";
}
function todayYmd() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function emptyExpense(year) {
	const today = todayYmd();
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
function voucherBase(items) {
	if (!items.length) return "报销凭证";
	if (items.length === 1) return `${safeBase(items[0].name)}-${items[0].amount}`;
	const bits = items.slice(0, 3).map((e) => `${safeBase(e.name)}-${e.amount}`);
	let n = bits.join("+");
	if (items.length > 3) n += `等${items.length}笔`;
	return n.slice(0, 80);
}
function payoutBase(items) {
	if (!items.length) return "报销打款";
	const who = safeBase(items[0].forWhom || items[0].claimant || "收款");
	const acc = safeBase(items[0].payAccount || "账户");
	const total = round2(items.reduce((s, e) => s + (e.amount || 0), 0));
	const n = items.length > 1 ? `${who}-${acc}-${total}等${items.length}笔` : `${who}-${acc}-${total}`;
	return n.slice(0, 80);
}
function round2(n) {
	return Math.round((Number(n) || 0) * 100) / 100;
}
function uniqueNames(people, expenses) {
	const s = new Set();
	for (const p of people || []) if (p.name) s.add(p.name);
	for (const e of expenses || []) {
		if (e.claimant) s.add(e.claimant);
	}
	return [...s];
}
function formatPayAccount(bank, card) {
	return [bank, card].map((s) => (s || "").trim()).filter(Boolean).join(" ");
}
function accountOf(e) {
	return formatPayAccount(e?.payBank, e?.payCardNo) || (e?.payAccount || "");
}
function listPayees(expenses) {
	const map = /* @__PURE__ */ new Map();
	const rows = (expenses || []).slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.payoutDate || "").localeCompare(b.payoutDate || ""));
	for (const e of rows) {
		const name = (e.forWhom || "").trim();
		if (!name) continue;
		map.set(name, {
			name,
			bank: (e.payBank || "").trim(),
			card: (e.payCardNo || "").trim()
		});
	}
	return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "zh"));
}
function applyPayee(row, payees, name) {
	const n = (name || "").trim();
	const hit = (payees || []).find((p) => p.name === n);
	if (!hit) return {
		...row,
		forWhom: name,
		payAccount: formatPayAccount(row.payBank, row.payCardNo)
	};
	return {
		...row,
		forWhom: name,
		payBank: hit.bank || row.payBank || "",
		payCardNo: hit.card || row.payCardNo || "",
		payAccount: formatPayAccount(hit.bank || row.payBank, hit.card || row.payCardNo)
	};
}
function Field({ label, children, className }) {
	return /* @__PURE__ */ (0, R.jsxs)("label", {
		className,
		children: [
			/* @__PURE__ */ (0, R.jsx)(Label, { children: label }),
			/* @__PURE__ */ (0, R.jsx)("div", { className: "mt-1", children })
		]
	});
}
function Mini({ label, value, hint }) {
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, R.jsx)("div", { className: "text-xs text-muted", children: label }),
			hint ? /* @__PURE__ */ (0, R.jsx)("div", { className: "text-[10px] text-subtle", children: hint }) : null,
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "mt-1 font-display text-lg font-semibold tabular-nums",
				children: ["¥", money(value)]
			})
		]
	});
}
function NameInput({ value, onChange, names, listId, placeholder }) {
	return /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
		/* @__PURE__ */ (0, R.jsx)(Input, {
			value: value || "",
			list: listId,
			placeholder,
			onChange: (e) => onChange(e.target.value)
		}),
		/* @__PURE__ */ (0, R.jsx)("datalist", {
			id: listId,
			children: (names || []).map((n) => /* @__PURE__ */ (0, R.jsx)("option", { value: n }, n))
		})
	] });
}


function VoucherSlot({ title, hint, id, kind, fileName, optional, extra, onFile, onDeleted }) {
	const ref = (0, L.useRef)(null);
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "flex flex-wrap items-center gap-1.5 py-1.5",
		onDragOver: (e) => e.preventDefault(),
		onDrop: (e) => {
			e.preventDefault();
			const f = e.dataTransfer.files?.[0];
			if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
		},
		children: [
			/* @__PURE__ */ (0, R.jsx)("span", {
				className: "w-14 shrink-0 text-xs font-medium",
				children: title
			}),
			fileName ? /* @__PURE__ */ (0, R.jsx)(Badge, {
				tone: "ok",
				children: "已传"
			}) : /* @__PURE__ */ (0, R.jsx)(Badge, {
				children: optional ? "选填" : "待传"
			}),
			extra || null,
			/* @__PURE__ */ (0, R.jsx)("span", {
				className: "min-w-0 flex-1 truncate text-[11px] text-muted",
				title: fileName || hint,
				children: fileName || hint || "点上传，或把文件拖到这一行"
			}),
			/* @__PURE__ */ (0, R.jsx)("input", {
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
			/* @__PURE__ */ (0, R.jsx)("button", {
				type: "button",
				className: "btn inline-flex items-center rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90",
				onClick: () => ref.current?.click(),
				children: fileName ? "更换" : "上传"
			}),
			fileName ? /* @__PURE__ */ (0, R.jsx)(DocActions, {
				id: id || "pending",
				kind,
				fileName,
				onDeleted
			}) : null
		]
	});
}

function ExpensesPage() {
	const { year, expenses, upsertExpense, removeExpenses, people } = useApp();
	const list = expenses || [];
	const names = uniqueNames(people, list);
	const payees = listPayees(list);
	const [q, setQ] = (0, L.useState)("");
	const [status, setStatus] = (0, L.useState)("all");
	const [claimant, setClaimant] = (0, L.useState)("all");
	const [scope, setScope] = (0, L.useState)("year");
	const [selected, setSelected] = (0, L.useState)([]);
	const [editing, setEditing] = (0, L.useState)(null);
	const [creating, setCreating] = (0, L.useState)(false);
	const [printFrom, setPrintFrom] = (0, L.useState)("");
	const [printTo, setPrintTo] = (0, L.useState)("");
	const [printStatus, setPrintStatus] = (0, L.useState)("未报销");
	const [printImages, setPrintImages] = (0, L.useState)(false);
	const [batch, setBatch] = (0, L.useState)({
		claimant: "",
		forWhom: "",
		payAccount: "",
		payBank: "",
		payCardNo: "",
		payoutDate: "",
		payoutMethod: "转账",
		payoutId: "",
		payoutFileName: ""
	});
	(0, L.useEffect)(() => {
		const rows = list.filter((e) => selected.includes(e.id));
		if (!rows.length) return;
		const first = rows[0];
		const same = (k) => rows.every((e) => (e[k] || "") === (first[k] || ""));
		setBatch((prev) => ({
			...prev,
			claimant: same("claimant") ? first.claimant || prev.claimant : prev.claimant,
			forWhom: same("forWhom") ? first.forWhom || prev.forWhom : "",
			payBank: same("payBank") ? first.payBank || prev.payBank : prev.payBank,
			payCardNo: same("payCardNo") ? first.payCardNo || prev.payCardNo : prev.payCardNo,
			payAccount: same("payAccount") ? first.payAccount || prev.payAccount : prev.payAccount,
			payoutDate: same("payoutDate") ? first.payoutDate || prev.payoutDate : prev.payoutDate,
			payoutMethod: same("payoutMethod") ? first.payoutMethod || prev.payoutMethod : prev.payoutMethod,
			payoutId: same("payoutId") ? first.payoutId || "" : "",
			payoutFileName: same("payoutId") && first.payoutId ? first.payoutFileName || "" : ""
		}));
	}, [selected.join(","), list.length]);
	const shown = (0, L.useMemo)(() => {
		let rows = list;
		if (scope === "year") rows = rows.filter((e) => e.year === year);
		if (status !== "all") rows = rows.filter((e) => e.status === status);
		if (claimant !== "all") rows = rows.filter((e) => (e.claimant || "") === claimant);
		if (q.trim()) {
			const s = q.trim();
			rows = rows.filter((e) => [e.name, e.period, e.remark, e.payMethod, e.claimant, e.forWhom, e.payAccount, e.payBank, e.payCardNo, e.payoutFileName, e.voucherFileName].some((x) => (x || "").includes(s)));
		}
		return rows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
	}, [list, year, scope, status, claimant, q]);
	const pager = usePager("expenses", shown, [scope, status, claimant, q, year].join("|"));
	const pageRows = pager.rows;
	const claimantOpts = [...new Set((list || []).map((e) => e.claimant).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh"));
	const allChecked = pageRows.length > 0 && pageRows.every((e) => selected.includes(e.id));
	const picked = shown.filter((e) => selected.includes(e.id));
	const sumRows = picked.length ? picked : shown;
	const totals = sumRows.reduce((s, e) => {
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
	const sumTip = picked.length ? `已选 ${picked.length} 笔` : `本表 ${shown.length} 笔`;
	const printRows = (0, L.useMemo)(() => {
		let rows = selected.length ? list.filter((e) => selected.includes(e.id)) : shown;
		if (printStatus !== "all") rows = rows.filter((e) => e.status === printStatus);
		if (printFrom) rows = rows.filter((e) => (e.date || "") >= printFrom);
		if (printTo) rows = rows.filter((e) => (e.date || "") <= printTo);
		return rows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
	}, [selected, list, shown, printStatus, printFrom, printTo]);
	const batchRows = list.filter((e) => selected.includes(e.id));
	const batchTotal = round2(batchRows.reduce((s, e) => s + (e.amount || 0), 0));
	function del(ids) {
		if (!ids.length) return;
		if (!confirmBatch("报销", ids.length, "会同时去掉这些报销记录。凭证文件还在目录里，可到「影像资料」里清。")) return;
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
	function saveOne(row, extra) {
		upsertExpense({
			...row,
			...extra,
			id: row.id || uid(),
			amount: round2(row.amount || row.qty * row.price)
		});
	}
	function applyBatch(markDone) {
		if (!batchRows.length) {
			toast.error("先勾选要一起报销的几笔");
			return;
		}
		if (!batch.claimant.trim()) {
			toast.error("报销人必填：这几笔是谁来报的");
			return;
		}
		if (!batch.forWhom.trim()) {
			toast.error("收款人必填：钱打给谁");
			return;
		}
		if (!(batch.payBank || "").trim() || !(batch.payCardNo || "").trim()) {
			toast.error("开户行和打款账户都要填");
			return;
		}
		if (markDone && needsVoucher(batch.payoutMethod) && !batch.payoutFileName && !confirm("打款不是现金，还没上传打款凭证。仍要记为已报销？")) return;
		const pid = batch.payoutId || uid();
		const acc = formatPayAccount(batch.payBank, batch.payCardNo);
		const day = markDone ? batch.payoutDate || todayYmd() : "";
		for (const e of batchRows) {
			saveOne(e, {
				claimant: batch.claimant.trim(),
				forWhom: (batch.forWhom || e.forWhom).trim(),
				payBank: batch.payBank.trim(),
				payCardNo: batch.payCardNo.trim(),
				payAccount: acc,
				payoutMethod: batch.payoutMethod || "转账",
				payoutDate: markDone ? day : e.status === "已报销" ? e.payoutDate : "",
				payoutId: pid,
				payoutFileName: batch.payoutFileName || e.payoutFileName || "",
				status: markDone ? "已报销" : e.status,
				reimbursedAt: markDone ? day : e.reimbursedAt
			});
		}
		setBatch((b) => ({
			...b,
			payoutId: pid
		}));
		toast.success(markDone ? `已把 ${batchRows.length} 笔记为已报销，挂到同一笔打款` : `已把 ${batchRows.length} 笔挂到同一笔打款`);
	}
	async function uploadPayout(file) {
		if (!file) return;
		if (!batchRows.length) {
			toast.error("先勾选要一起报销的几笔");
			return;
		}
		if (!batch.claimant.trim() || !batch.forWhom.trim() || !(batch.payBank || "").trim() || !(batch.payCardNo || "").trim()) {
			toast.error("先填报销人、收款人、开户行和打款账户，打款凭证按这个命名");
			return;
		}
		const acc = formatPayAccount(batch.payBank, batch.payCardNo);
		const group = batchRows.map((e) => ({
			...e,
			claimant: batch.claimant,
			forWhom: batch.forWhom || e.forWhom,
			payBank: batch.payBank,
			payCardNo: batch.payCardNo,
			payAccount: acc
		}));
		const pid = batch.payoutId || uid();
		const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".pdf";
		const named = new File([file], `${payoutBase(group)}${ext}`, {
			type: file.type,
			lastModified: file.lastModified
		});
		const saved = await setDoc(pid, "payout", named) || named.name;
		setBatch((b) => ({
			...b,
			payoutId: pid,
			payoutFileName: saved
		}));
		for (const e of batchRows) saveOne(e, {
			claimant: batch.claimant.trim(),
			forWhom: (batch.forWhom || e.forWhom || batch.claimant).trim(),
			payBank: batch.payBank.trim(),
			payCardNo: batch.payCardNo.trim(),
			payAccount: acc,
			payoutMethod: batch.payoutMethod || "转账",
			payoutDate: e.status === "已报销" ? e.payoutDate || batch.payoutDate : "",
			payoutId: pid,
			payoutFileName: saved
		});
		toast.success(`已保存打款凭证，挂到勾选的 ${batchRows.length} 笔`);
	}
	return /* @__PURE__ */ (0, R.jsx)(Need, {
		perm: "expenses.view",
		children: /* @__PURE__ */ (0, R.jsxs)(R.Fragment, { children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "no-print space-y-5",
				children: [
					/* @__PURE__ */ (0, R.jsxs)("header", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [
							/* @__PURE__ */ (0, R.jsxs)("div", { children: [
								/* @__PURE__ */ (0, R.jsx)("h1", {
									className: "font-display text-2xl font-semibold",
									children: "报销单"
								}),
								/* @__PURE__ */ (0, R.jsx)("p", {
									className: "mt-1 max-w-2xl text-sm text-muted",
									children: "每笔记下报销人、收款人、开户行和打款账户。几笔一起报就勾选后填打款，共用一张打款凭证。收款人填过一次下次能选，不跟人员名单挂钩。"
								})
							] }),
							/* @__PURE__ */ (0, R.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, R.jsxs)(Button, {
										type: "button",
										onClick: () => {
											setCreating(true);
											setEditing(emptyExpense(year));
										},
										children: [
											/* @__PURE__ */ (0, R.jsx)(Plus, { className: "size-4" }),
											"新增报销"
										]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, R.jsxs)("div", {
						className: "flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "年份" }),
									/* @__PURE__ */ (0, R.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: scope,
										onChange: (e) => setScope(e.target.value),
										children: [
											/* @__PURE__ */ (0, R.jsxs)("option", { value: "year", children: [year, "年"] }),
											/* @__PURE__ */ (0, R.jsx)("option", { value: "all", children: "全部年份" })
										]
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "状态" }),
									/* @__PURE__ */ (0, R.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: status,
										onChange: (e) => setStatus(e.target.value),
										children: [
											/* @__PURE__ */ (0, R.jsx)("option", { value: "all", children: "全部" }),
											/* @__PURE__ */ (0, R.jsx)("option", { value: "未报销", children: "未报销" }),
											/* @__PURE__ */ (0, R.jsx)("option", { value: "已报销", children: "已报销" })
										]
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "报销人" }),
									/* @__PURE__ */ (0, R.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: claimant,
										onChange: (e) => setClaimant(e.target.value),
										children: [
											/* @__PURE__ */ (0, R.jsx)("option", { value: "all", children: "全部" }),
											claimantOpts.map((n) => /* @__PURE__ */ (0, R.jsx)("option", { value: n, children: n }, n))
										]
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "min-w-48 flex-1 text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "搜索" }),
									/* @__PURE__ */ (0, R.jsx)(Input, {
										className: "mt-1",
										value: q,
										onChange: (e) => setQ(e.target.value),
										placeholder: "项目 / 报销人 / 收款人 / 开户行 / 打款账户 / 凭证"
									})
								]
							}),
							selected.length ? /* @__PURE__ */ (0, R.jsxs)(Button, {
								variant: "danger",
								type: "button",
								onClick: () => del(selected),
								children: ["删除所选（", selected.length, "）"]
							}) : null
						]
					}),
					selected.length ? /* @__PURE__ */ (0, R.jsxs)("div", {
						className: "space-y-3 rounded-xl border-2 border-dashed border-accent bg-accent-soft p-4",
						children: [
							/* @__PURE__ */ (0, R.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [
									/* @__PURE__ */ (0, R.jsxs)("div", { children: [
										/* @__PURE__ */ (0, R.jsx)("div", { className: "text-sm font-semibold", children: "这几笔一起报销" }),
										/* @__PURE__ */ (0, R.jsx)("p", {
											className: "mt-0.5 text-xs text-muted",
											children: `已勾 ${batchRows.length} 笔，合计 ¥${money(batchTotal)}。同一报销人、打到同一个账户，共用一张打款凭证。`
										})
									] }),
									/* @__PURE__ */ (0, R.jsxs)("div", {
										className: "flex flex-wrap gap-2",
										children: [
										/* @__PURE__ */ (0, R.jsx)(Button, {
												variant: "outline",
																							type: "button",
												onClick: () => applyBatch(false),
												children: "只挂打款，先不改状态"
											}),
											/* @__PURE__ */ (0, R.jsx)(Button, {
												type: "button",
												onClick: () => applyBatch(true),
												children: "记为已报销"
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsxs)("div", {
								className: "grid gap-3 md:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, R.jsx)(Field, {
										label: "报销人 *（谁来报）",
										children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
											value: batch.claimant,
											names,
											listId: "exp-claimant",
											placeholder: "人员名单里选，也可手填",
											onChange: (v) => setBatch((b) => ({ ...b, claimant: v }))
										})
									}),
									/* @__PURE__ */ (0, R.jsx)(Field, {
										label: "收款人 *（打到谁的账户）",
										children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
											value: batch.forWhom,
											names: payees.map((p) => p.name),
											listId: "exp-payee",
											placeholder: "填过的可下拉选，不跟人员名单关联",
											onChange: (v) => setBatch((b) => applyPayee(b, payees, v))
										})
									}),
									/* @__PURE__ */ (0, R.jsx)(Field, {
										label: "开户行 *",
										children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
											value: batch.payBank,
											names: [...new Set(payees.map((p) => p.bank).filter(Boolean))],
											listId: "exp-bank",
											placeholder: "如 工商银行XX支行",
											onChange: (v) => setBatch((b) => ({ ...b, payBank: v, payAccount: formatPayAccount(v, b.payCardNo) }))
										})
									}),
									/* @__PURE__ */ (0, R.jsx)(Field, {
										label: "打款账户 *",
										children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
											value: batch.payCardNo,
											names: [...new Set(payees.map((p) => p.card).filter(Boolean))],
											listId: "exp-card",
											placeholder: "银行卡号，填过可下拉选",
											onChange: (v) => setBatch((b) => ({ ...b, payCardNo: v, payAccount: formatPayAccount(b.payBank, v) }))
										})
									}),
									/* @__PURE__ */ (0, R.jsx)(Field, {
										label: "打款日期（记为已报销后填）",
										children: /* @__PURE__ */ (0, R.jsx)(Input, {
											type: "date",
											value: batch.payoutDate,
											onChange: (e) => setBatch((b) => ({ ...b, payoutDate: e.target.value }))
										})
									}),
									/* @__PURE__ */ (0, R.jsx)(Field, {
										label: "打款方式",
										children: /* @__PURE__ */ (0, R.jsx)("select", {
											className: "field-select w-full",
											value: batch.payoutMethod,
											onChange: (e) => setBatch((b) => ({ ...b, payoutMethod: e.target.value })),
											children: PAY_METHODS.map((m) => /* @__PURE__ */ (0, R.jsx)("option", { children: m }, m))
										})
									}),
									/* @__PURE__ */ (0, R.jsxs)("div", {
										className: "rounded-lg border border-line bg-surface p-3 text-sm",
										children: [
											/* @__PURE__ */ (0, R.jsx)("div", { className: "text-xs text-muted", children: "这批合计" }),
											/* @__PURE__ */ (0, R.jsxs)("div", {
												className: "font-display text-lg font-semibold tabular-nums",
												children: ["¥", money(batchTotal)]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsx)("p", {
								className: "text-xs text-muted",
								children: batch.payoutFileName ? `已挂打款凭证：${batch.payoutFileName}。要换图，点开其中一笔，在下面「打款凭证」上传，勾选的几笔共用。` : "打款凭证请点开其中一笔，在下面「打款凭证」上传。勾选的几笔共用一张。"
							})
						]
					}) : null,
					/* @__PURE__ */ (0, R.jsxs)("div", {
						className: "flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-accent bg-accent-soft p-4",
						children: [
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "打印哪些" }),
									/* @__PURE__ */ (0, R.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: printStatus,
										onChange: (e) => setPrintStatus(e.target.value),
										children: [
											/* @__PURE__ */ (0, R.jsx)("option", { value: "未报销", children: "未报销" }),
											/* @__PURE__ */ (0, R.jsx)("option", { value: "已报销", children: "已报销" }),
											/* @__PURE__ */ (0, R.jsx)("option", { value: "all", children: "全部状态" })
										]
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "购买时间从" }),
									/* @__PURE__ */ (0, R.jsx)(Input, {
										className: "mt-1",
										type: "date",
										value: printFrom,
										onChange: (e) => setPrintFrom(e.target.value)
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "到" }),
									/* @__PURE__ */ (0, R.jsx)(Input, {
										className: "mt-1",
										type: "date",
										value: printTo,
										onChange: (e) => setPrintTo(e.target.value)
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsxs)(Button, {
								variant: "outline",
								type: "button",
								onClick: doPrint,
								children: ["打印报销单", printRows.length ? `（${printRows.length}）` : ""]
							}),
							/* @__PURE__ */ (0, R.jsxs)("label", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, R.jsx)("span", { className: "text-xs text-muted", children: "影像资料" }),
									/* @__PURE__ */ (0, R.jsxs)("select", {
										className: "field-select mt-1 w-auto",
										value: printImages ? "yes" : "no",
										onChange: (e) => setPrintImages(e.target.value === "yes"),
										children: [
											/* @__PURE__ */ (0, R.jsx)("option", { value: "no", children: "不打印" }),
											/* @__PURE__ */ (0, R.jsx)("option", { value: "yes", children: "打印" })
										]
									})
								]
							}),
							/* @__PURE__ */ (0, R.jsx)("p", {
								className: "w-full text-xs text-muted",
								children: selected.length ? `已勾选 ${selected.length} 笔，打印时只用勾选的。` : "没勾选就打印当前列表里符合条件的。"
							})
						]
					}),
					/* @__PURE__ */ (0, R.jsxs)("section", {
						className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, R.jsx)(Mini, { label: picked.length ? "已选合计" : "本表合计", hint: sumTip, value: totals.amount }),
							/* @__PURE__ */ (0, R.jsx)(Mini, { label: "未报销", value: totals.open }),
							/* @__PURE__ */ (0, R.jsx)(Mini, { label: "已报销", value: totals.done }),
							/* @__PURE__ */ (0, R.jsx)(Mini, {
								label: "缺凭证",
								hint: "购买或缺打款",
								value: totals.missing + totals.missPay
							})
						]
					}),
					editing ? /* @__PURE__ */ (0, R.jsx)(ExpenseEditor, {
						draft: editing,
						creating,
						all: list,
						payees,
						selectedIds: selected,
						names,
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
					}, editing.id) : null,
					/* @__PURE__ */ (0, R.jsx)(WideTable, {
						id: "expenses",
						pager,
						children: /* @__PURE__ */ (0, R.jsxs)("table", {
							className: "wide-table text-sm",
							children: [
								/* @__PURE__ */ (0, R.jsx)("thead", {
									className: "border-b border-line text-xs text-muted",
									children: /* @__PURE__ */ (0, R.jsxs)("tr", { children: [
										/* @__PURE__ */ (0, R.jsx)("th", {
											className: "w-10 p-3",
											children: /* @__PURE__ */ (0, R.jsx)("input", {
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
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "操作" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "序号" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "项目" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "购买时间" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "金额" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "报销人" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "收款人" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "打款账户" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "状态" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "购买凭证" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "打款凭证" }),
										/* @__PURE__ */ (0, R.jsx)("th", { className: "p-3", children: "备注" })
									] })
								}),
								/* @__PURE__ */ (0, R.jsxs)("tbody", { children: [
									shown.length === 0 ? /* @__PURE__ */ (0, R.jsx)("tr", { children: /* @__PURE__ */ (0, R.jsx)("td", {
										colSpan: 13,
										className: "p-6 text-muted",
										children: "还没有报销。点右上角「新增报销」。勾几笔可一起报销、记打款。"
									}) }) : null,
									pageRows.map((e, i) => {
										const on = editing?.id === e.id;
										const sib = e.payoutId ? list.filter((x) => x.payoutId === e.payoutId).length : 0;
										return /* @__PURE__ */ (0, R.jsxs)("tr", {
											className: `group border-b border-line last:border-0 hover:bg-accent-soft ${on || selected.includes(e.id) ? "bg-accent-soft" : ""}`,
											onClick: () => setSelected((s) => toggleSel(s, e.id, !s.includes(e.id))),
											children: [
												/* @__PURE__ */ (0, R.jsx)("td", {
													className: "p-2",
												onClick: (ev) => ev.stopPropagation(),
													children: /* @__PURE__ */ (0, R.jsx)("input", {
														type: "checkbox",
														className: "size-4",
														checked: selected.includes(e.id),
														onChange: (ev) => setSelected((s) => toggleSel(s, e.id, ev.target.checked)),
														"aria-label": `选择 ${e.name}`
													})
												}),
												/* @__PURE__ */ (0, R.jsx)("td", {
													className: "p-2",
													onClick: (ev) => ev.stopPropagation(),
													children: /* @__PURE__ */ (0, R.jsx)(Button, {
														variant: "outline",
														size: "sm",
														type: "button",
														onClick: () => {
															setCreating(false);
															setEditing(e);
														},
														children: "更改"
													})
												}),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "p-2 tabular-nums text-muted", children: (pager.page - 1) * pager.size + i + 1 }),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "p-2 font-medium", children: e.name }),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "p-2", children: e.period || e.date }),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "p-2 text-right tabular-nums font-medium", children: money(e.amount) }),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "p-2", children: e.claimant || "—" }),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "p-2", children: e.forWhom || "—" }),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "p-2 text-xs", children: accountOf(e) || "—" }),
												/* @__PURE__ */ (0, R.jsx)("td", {
													className: "p-2",
													children: /* @__PURE__ */ (0, R.jsx)(Badge, {
														tone: e.status === "已报销" ? "ok" : "warn",
														children: e.status
													})
												}),
												/* @__PURE__ */ (0, R.jsx)("td", {
													className: "p-2 text-xs",
													children: e.voucherFileName || (e.payMethod === "现金" ? "—" : /* @__PURE__ */ (0, R.jsx)("span", { className: "text-warn", children: "缺" }))
												}),
												/* @__PURE__ */ (0, R.jsx)("td", {
													className: "p-2 text-xs",
													children: e.payoutFileName ? /* @__PURE__ */ (0, R.jsxs)("span", { children: [e.payoutFileName, sib > 1 ? ` ·${sib}笔` : ""] }) : e.status === "已报销" && (e.payoutMethod || "转账") !== "现金" ? /* @__PURE__ */ (0, R.jsx)("span", { className: "text-warn", children: "缺打款" }) : "—"
												}),
												/* @__PURE__ */ (0, R.jsx)("td", { className: "max-w-40 truncate p-2 text-muted", children: e.remark })
											]
										}, e.id);
									})
								] }),
								shown.length ? /* @__PURE__ */ (0, R.jsx)("tfoot", {
									children: /* @__PURE__ */ (0, R.jsxs)("tr", {
										className: "border-t-2 border-ink bg-bg-elevated text-sm font-medium",
										children: [
											/* @__PURE__ */ (0, R.jsx)("td", {
												className: "p-2",
												colSpan: 5,
												children: `合计（${sumTip}）`
											}),
											/* @__PURE__ */ (0, R.jsx)("td", {
												className: "p-2 text-right tabular-nums",
												children: money(totals.amount)
											}),
											/* @__PURE__ */ (0, R.jsx)("td", {
												className: "p-2 text-xs font-normal text-muted",
												colSpan: 7,
												children: `未报销 ¥${money(totals.open)}　已报销 ¥${money(totals.done)}`
											})
										]
									})
								}) : null
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, R.jsx)(ExpenseSheets, {
				rows: printRows,
				withImages: printImages
			})
		] })
	});
}

function ExpenseEditor({ draft, creating, all, selectedIds, names, payees, onCancel, onSave, onDelete }) {
	const [c, setC] = (0, L.useState)(() => ({
		...draft,
		payBank: draft.payBank || (!draft.payCardNo ? draft.payAccount : "") || "",
		payCardNo: draft.payCardNo || "",
		payoutDate: draft.status === "已报销" ? draft.payoutDate || "" : ""
	}));
	(0, L.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onCancel]);
	function patch(key, value) {
		setC((prev) => {
			const next = { ...prev, [key]: value };
			if (key === "qty" || key === "price") next.amount = round2((key === "qty" ? value : next.qty) * (key === "price" ? value : next.price));
			if (key === "forWhom") {
				const filled = applyPayee(next, payees, value);
				next.payBank = filled.payBank;
				next.payCardNo = filled.payCardNo;
				next.payAccount = filled.payAccount;
			}
			if (key === "payBank" || key === "payCardNo") next.payAccount = formatPayAccount(next.payBank, next.payCardNo);
			if (key === "status") {
				if (value === "已报销") {
					next.payoutDate = prev.payoutDate || todayYmd();
					next.reimbursedAt = prev.reimbursedAt || next.payoutDate;
				} else {
					next.payoutDate = "";
					next.reimbursedAt = "";
				}
			}
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
	const existingPayouts = [];
	const seenP = /* @__PURE__ */ new Set();
	for (const e of all) {
		if (!e.payoutId || !e.payoutFileName || e.payoutId === c.payoutId) continue;
		if (seenP.has(e.payoutId)) continue;
		seenP.add(e.payoutId);
		existingPayouts.push(e);
	}
	const shareTargets = (all || []).filter((e) => selectedIds.includes(e.id) || e.id === c.id);
	const siblings = c.payoutId ? (all || []).filter((e) => e.payoutId === c.payoutId) : [];
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
		const saved = await setDoc(vid, "expense", named) || named.name;
		const next = { ...c, id: c.id || uid(), voucherId: vid, voucherFileName: saved };
		setC(next);
		onSave(next);
		for (const e of group) {
			if (e.id === next.id) continue;
			onSave({ ...e, voucherId: vid, voucherFileName: saved });
		}
		toast.success(group.length > 1 ? `已保存购买凭证，并挂到勾选的 ${group.length} 笔` : `已保存 ${saved}`);
	}
	async function uploadPayout(file) {
		if (!file) return;
		if (!c.claimant.trim() || !(c.forWhom || "").trim() || !(c.payBank || "").trim() || !(c.payCardNo || "").trim()) {
			toast.error("先填报销人、收款人、开户行和打款账户");
			return;
		}
		const group = siblings.length > 1 ? siblings.map((e) => e.id === c.id ? c : e) : [c];
		const pid = c.payoutId || uid();
		const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".pdf";
		const named = new File([file], `${payoutBase(group)}${ext}`, {
			type: file.type,
			lastModified: file.lastModified
		});
		const savedPay = await setDoc(pid, "payout", named) || named.name;
		const next = {
			...c,
			id: c.id || uid(),
			payoutId: pid,
			payoutFileName: savedPay,
			payoutDate: c.status === "已报销" ? c.payoutDate || todayYmd() : ""
		};
		setC(next);
		onSave(next);
		for (const e of group) {
			if (e.id === next.id) continue;
			onSave({ ...e, payoutId: pid, payoutFileName: savedPay });
		}
		toast.success(group.length > 1 ? `已保存打款凭证，同批 ${group.length} 笔共用` : `已保存 ${savedPay}`);
	}
	return /* @__PURE__ */ (0, R.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6",
		onClick: onCancel,
		children: /* @__PURE__ */ (0, R.jsxs)("section", {
		id: "expense-editor",
		className: "max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl",
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3",
				children: [
					/* @__PURE__ */ (0, R.jsx)("h2", {
						className: "font-semibold",
						children: creating ? "新增报销" : c.name || "编辑报销"
					}),
					/* @__PURE__ */ (0, R.jsxs)("div", {
						className: "btn-row",
						children: [
							/* @__PURE__ */ (0, R.jsx)(Badge, {
								tone: c.status === "已报销" ? "ok" : "warn",
								children: c.status
							}),
							/* @__PURE__ */ (0, R.jsx)(Button, { variant: "outline", type: "button", onClick: onCancel, children: "关闭" }),
							!creating ? /* @__PURE__ */ (0, R.jsx)(Button, { variant: "outline", type: "button", onClick: () => window.print(), children: "打印报销单" }) : null,
							!creating ? /* @__PURE__ */ (0, R.jsx)(Button, { variant: "danger", type: "button", onClick: onDelete, children: "删除" }) : null,
							/* @__PURE__ */ (0, R.jsx)(Button, {
								type: "button",
								onClick: () => {
									if (!c.name.trim()) {
										toast.error("项目名称必填");
										return;
									}
									if (c.status === "已报销" && (!(c.forWhom || "").trim() || !(c.payBank || "").trim() || !(c.payCardNo || "").trim())) {
										toast.error("已报销要填收款人、开户行和打款账户");
										return;
									}
									if (needsVoucher(c.payMethod) && !c.voucherFileName && !confirm("购买不是现金，还没上传凭证。仍要保存？")) return;
									onSave({
										...c,
										id: c.id || uid(),
										payAccount: formatPayAccount(c.payBank, c.payCardNo),
										payoutDate: c.status === "已报销" ? c.payoutDate || todayYmd() : "",
										amount: round2(c.amount || c.qty * c.price)
									});
								},
								children: "保存报销信息"
							})
						]
					})
				]
			}),
			siblings.length > 1 ? /* @__PURE__ */ (0, R.jsxs)("p", {
				className: "rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs text-muted",
				children: ["同批打款共 ", siblings.length, " 笔：", siblings.map((e) => e.name).join("、")]
			}) : null,
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, R.jsx)(Field, { label: "年份", children: /* @__PURE__ */ (0, R.jsx)(Input, { type: "number", value: c.year, onChange: (e) => patch("year", Number(e.target.value) || 0) }) }),
					/* @__PURE__ */ (0, R.jsx)(Field, { label: "项目 *", children: /* @__PURE__ */ (0, R.jsx)(Input, { value: c.name, onChange: (e) => patch("name", e.target.value) }) }),
					/* @__PURE__ */ (0, R.jsx)(Field, { label: "购买时间（显示）", children: /* @__PURE__ */ (0, R.jsx)(Input, { value: c.period, onChange: (e) => patch("period", e.target.value), placeholder: "如 2026/3月-12月 或 2026/4/9" }) }),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "筛选/打印用日期",
						children: /* @__PURE__ */ (0, R.jsx)(Input, {
							type: "date",
							value: c.date,
							onChange: (e) => {
								const v = e.target.value;
								setC((prev) => ({ ...prev, date: v, period: prev.period && prev.period !== prev.date ? prev.period : v }));
							}
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, { label: "单位", children: /* @__PURE__ */ (0, R.jsx)(Input, { value: c.unit, onChange: (e) => patch("unit", e.target.value) }) }),
					/* @__PURE__ */ (0, R.jsx)(Field, { label: "数量", children: /* @__PURE__ */ (0, R.jsx)(Input, { type: "number", step: "0.01", value: c.qty, onChange: (e) => patch("qty", Number(e.target.value) || 0) }) }),
					/* @__PURE__ */ (0, R.jsx)(Field, { label: "单价", children: /* @__PURE__ */ (0, R.jsx)(Input, { type: "number", step: "0.01", value: c.price, onChange: (e) => patch("price", Number(e.target.value) || 0) }) }),
					/* @__PURE__ */ (0, R.jsx)(Field, { label: "金额", children: /* @__PURE__ */ (0, R.jsx)(Input, { type: "number", step: "0.01", value: c.amount, onChange: (e) => patch("amount", Number(e.target.value) || 0) }) }),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "购买支付方式",
						children: /* @__PURE__ */ (0, R.jsx)("select", {
							className: "field-select w-full",
							value: c.payMethod || "现金",
							onChange: (e) => patch("payMethod", e.target.value),
							children: PAY_METHODS.map((m) => /* @__PURE__ */ (0, R.jsx)("option", { children: m }, m))
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "报销人（谁来报）",
						children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
							value: c.claimant,
							names,
							listId: "ed-claimant",
							placeholder: "人员名单或手填",
							onChange: (v) => patch("claimant", v)
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "收款人（打到谁的账户）",
						children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
							value: c.forWhom,
							names: (payees || []).map((p) => p.name),
							listId: "ed-payee",
							placeholder: "填过的可下拉选，不跟人员名单关联",
							onChange: (v) => patch("forWhom", v)
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "开户行",
						children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
							value: c.payBank || "",
							names: [...new Set((payees || []).map((p) => p.bank).filter(Boolean))],
							listId: "ed-bank",
							placeholder: "选收款人会带出上次账户，也可手填",
							onChange: (v) => patch("payBank", v)
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "打款账户",
						children: /* @__PURE__ */ (0, R.jsx)(NameInput, {
							value: c.payCardNo || "",
							names: [...new Set((payees || []).map((p) => p.card).filter(Boolean))],
							listId: "ed-card",
							placeholder: "银行卡号，填过可下拉选",
							onChange: (v) => patch("payCardNo", v)
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "打款方式",
						children: /* @__PURE__ */ (0, R.jsx)("select", {
							className: "field-select w-full",
							value: c.payoutMethod || "转账",
							onChange: (e) => patch("payoutMethod", e.target.value),
							children: PAY_METHODS.map((m) => /* @__PURE__ */ (0, R.jsx)("option", { children: m }, m))
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: c.status === "已报销" ? "打款日期" : "打款日期（未报销为空）",
						children: /* @__PURE__ */ (0, R.jsx)(Input, {
							type: "date",
							value: c.status === "已报销" ? c.payoutDate || "" : "",
							disabled: c.status !== "已报销",
							onChange: (e) => patch("payoutDate", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "报销状态",
						children: /* @__PURE__ */ (0, R.jsxs)("select", {
							className: "field-select w-full",
							value: c.status,
							onChange: (e) => patch("status", e.target.value),
							children: [
								/* @__PURE__ */ (0, R.jsx)("option", { children: "未报销" }),
								/* @__PURE__ */ (0, R.jsx)("option", { children: "已报销" })
							]
						})
					}),
					/* @__PURE__ */ (0, R.jsx)(Field, {
						label: "备注",
						className: "md:col-span-3",
						children: /* @__PURE__ */ (0, R.jsx)(Input, { value: c.remark, onChange: (e) => patch("remark", e.target.value) })
					})
				]
			}),
			/* @__PURE__ */ (0, R.jsxs)("div", {
				className: "divide-y divide-line rounded-md border border-line bg-bg-elevated px-3",
				children: [
					/* @__PURE__ */ (0, R.jsx)(VoucherSlot, {
						title: "购买凭证",
						hint: "现金也可以传。文件名「项目名称-金额」。",
						id: c.voucherId || c.id,
						kind: "expense",
						fileName: c.voucherFileName,
						optional: c.payMethod === "现金",
						extra: existingVouchers.length ? /* @__PURE__ */ (0, R.jsxs)("select", {
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
								setC((prev) => ({ ...prev, voucherId: id, voucherFileName: hit?.voucherFileName || prev.voucherFileName }));
							},
							children: [
								/* @__PURE__ */ (0, R.jsx)("option", { value: "", children: "单独上传" }),
								existingVouchers.map((e) => /* @__PURE__ */ (0, R.jsx)("option", { value: e.voucherId, children: e.voucherFileName }, e.voucherId))
							]
						}) : null,
						onFile: uploadVoucher,
						onDeleted: () => {
							const next = { ...c, voucherFileName: "", voucherId: "" };
							setC(next);
							onSave(next);
						}
					}),
					/* @__PURE__ */ (0, R.jsx)(VoucherSlot, {
						title: "打款凭证",
						hint: siblings.length > 1 ? `同批 ${siblings.length} 笔共用` : "几笔一起报时共用一张。",
						id: c.payoutId || c.id,
						kind: "payout",
						fileName: c.payoutFileName,
						optional: (c.payoutMethod || "转账") === "现金",
						extra: existingPayouts.length ? /* @__PURE__ */ (0, R.jsxs)("select", {
							className: "h-8 max-w-40 rounded-sm border border-line bg-surface px-2 text-[11px]",
							value: c.payoutId || "",
							onChange: (e) => {
								const id = e.target.value;
								if (!id) {
									setC((prev) => ({ ...prev, payoutId: "", payoutFileName: "" }));
									return;
								}
								const hit = existingPayouts.find((x) => x.payoutId === id);
								setC((prev) => ({
									...prev,
									payoutId: id,
									payoutFileName: hit?.payoutFileName || prev.payoutFileName,
									claimant: prev.claimant || hit?.claimant || "",
									forWhom: prev.forWhom || hit?.forWhom || "",
									payBank: prev.payBank || hit?.payBank || "",
									payCardNo: prev.payCardNo || hit?.payCardNo || "",
									payAccount: prev.payAccount || hit?.payAccount || "",
									payoutMethod: prev.payoutMethod || hit?.payoutMethod || "转账",
									payoutDate: prev.status === "已报销" ? prev.payoutDate || hit?.payoutDate || "" : ""
								}));
							},
							children: [
								/* @__PURE__ */ (0, R.jsx)("option", { value: "", children: "单独上传" }),
								existingPayouts.map((e) => /* @__PURE__ */ (0, R.jsx)("option", {
									value: e.payoutId,
									children: `${e.payoutFileName}（${e.claimant || "未填人"}）`
								}, e.payoutId))
							]
						}) : null,
						onFile: uploadPayout,
						onDeleted: () => {
							setC((prev) => ({ ...prev, payoutFileName: "" }));
							onSave({ ...c, payoutFileName: "" });
						}
					})
				]
			})
		]
	})
	});
}

function ExpenseSheets({ rows, withImages }) {
	if (!rows.length) return null;
	const today = todayYmd();
	const total = rows.reduce((s, e) => s + (e.amount || 0), 0);
	const claimants = [...new Set(rows.map((e) => e.claimant).filter(Boolean))];
	const forWhoms = [...new Set(rows.map((e) => e.forWhom).filter(Boolean))];
	const banks = [...new Set(rows.map((e) => (e.payBank || "").trim()).filter(Boolean))];
	const cards = [...new Set(rows.map((e) => (e.payCardNo || "").trim()).filter(Boolean))];
	const images = [];
	if (withImages) {
		const seenV = /* @__PURE__ */ new Set();
		const seenP = /* @__PURE__ */ new Set();
		for (const e of rows) {
			if (e.voucherId && e.voucherFileName && !/\.pdf$/i.test(e.voucherFileName) && !seenV.has(e.voucherId)) {
				seenV.add(e.voucherId);
				images.push({ id: e.voucherId, kind: "expense", name: e.voucherFileName });
			}
			if (e.payoutId && e.payoutFileName && !/\.pdf$/i.test(e.payoutFileName) && !seenP.has(e.payoutId)) {
				seenP.add(e.payoutId);
				images.push({ id: e.payoutId, kind: "payout", name: e.payoutFileName });
			}
		}
	}
	return /* @__PURE__ */ (0, R.jsxs)("div", {
		className: "print-only space-y-8 text-black",
		children: [
			/* @__PURE__ */ (0, R.jsxs)("article", {
				className: "statement border border-black p-4",
				children: [
					/* @__PURE__ */ (0, R.jsx)("header", {
						className: "border-b border-black pb-2 text-center",
						children: /* @__PURE__ */ (0, R.jsx)("div", {
							className: "text-2xl font-semibold tracking-widest",
							children: "报销单"
						})
					}),
					/* @__PURE__ */ (0, R.jsxs)("table", {
						className: "mt-2 w-full border-collapse text-center text-xs",
						children: [
							/* @__PURE__ */ (0, R.jsx)("thead", { children: /* @__PURE__ */ (0, R.jsx)("tr", { children: ["报销人", "收款人", "开户行", "打款账户"].map((col) => /* @__PURE__ */ (0, R.jsx)("th", {
								className: "border border-black px-1 py-1 font-medium",
								children: col
							}, col)) }) }),
							/* @__PURE__ */ (0, R.jsx)("tbody", { children: /* @__PURE__ */ (0, R.jsx)("tr", { children: [
								claimants.join("、") || "—",
								forWhoms.join("、") || "—",
								banks.join("、") || "—",
								cards.join("、") || "—"
							].map((v, i) => /* @__PURE__ */ (0, R.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: v
							}, i)) }) })
						]
					}),
					/* @__PURE__ */ (0, R.jsxs)("table", {
						className: "mt-2 w-full border-collapse text-center text-xs",
						children: [
							/* @__PURE__ */ (0, R.jsx)("thead", { children: /* @__PURE__ */ (0, R.jsx)("tr", { children: ["序号", "项目", "购买时间", "金额", "备注", "票据"].map((col) => /* @__PURE__ */ (0, R.jsx)("th", {
								className: "border border-black px-1 py-1 font-medium",
								children: col
							}, col)) }) }),
							/* @__PURE__ */ (0, R.jsxs)("tbody", { children: [
								rows.map((e, i) => /* @__PURE__ */ (0, R.jsx)("tr", { children: [
									i + 1,
									e.name,
									e.period || e.date,
									money(e.amount),
									e.remark || "",
									e.voucherFileName || (e.payMethod === "现金" ? "现金" : "—")
								].map((v, k) => /* @__PURE__ */ (0, R.jsx)("td", {
									className: "border border-black px-1 py-1",
									children: v
								}, k)) }, e.id)),
								/* @__PURE__ */ (0, R.jsx)("tr", { children: ["合计", "", "", money(total), "", ""].map((v, i) => /* @__PURE__ */ (0, R.jsx)("td", {
									className: "border border-black px-1 py-1 font-medium",
									children: v
								}, i)) })
							] })
						]
					}),
					/* @__PURE__ */ (0, R.jsxs)("p", {
						className: "mt-4 text-right text-xs",
						children: ["打印日期 ", today]
					})
				]
			}),
			images.map((e) => /* @__PURE__ */ (0, R.jsxs)("article", {
				className: "statement border border-black p-4",
				children: [
					/* @__PURE__ */ (0, R.jsx)("div", { className: "mb-2 text-sm font-semibold", children: e.name }),
					/* @__PURE__ */ (0, R.jsx)("img", {
						src: `/api/doc?id=${encodeURIComponent(e.id)}&kind=${e.kind}`,
						alt: e.name,
						className: "max-h-[240mm] w-full object-contain"
					})
				]
			}, `${e.kind}-${e.id}`))
		]
	});
}
export { ExpensesPage as component };
