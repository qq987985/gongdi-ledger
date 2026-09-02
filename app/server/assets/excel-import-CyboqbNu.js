import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { o as uid } from "./utils-DPLvt0U2.js";
import { C as parsePaymentSheet, S as parseFullAttendanceWorkbook, b as parseContractWorkbook, w as parsePeopleSheet, x as parseExpenseSheet, y as parseAttendanceSheet } from "./excel-DljZk7Qw.js";
import { t as useApp } from "./store-C5SZ1jtR.js";
import { n as FilePick } from "./file-pick-sYj_heGl.js";
import { n as toast } from "./dist-DfB6JCQe.js";
import { t as Button } from "./button-CtK1BncN.js";
import { t as Input } from "./input--dJb4stz.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function ExcelBtn({ label, onFile }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "btn inline-flex cursor-pointer items-center rounded-sm border border-line text-xs hover:bg-accent-soft",
		children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "file",
			accept: ".xlsx,.xls",
			className: "hidden",
			onChange: (e) => {
				const f = e.target.files?.[0];
				e.target.value = "";
				if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
			}
		})]
	});
}
function TplLink({ href, filename, label = "下载模板" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		className: "btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft",
		href,
		download: filename,
		children: label
	});
}
function PeopleImport() {
	const store = useApp();
	const [conflicts, setConflicts] = import_react.useState([]);
	const [fresh, setFresh] = import_react.useState([]);
	async function onFile(file) {
		if (!file) return;
		const rows = parsePeopleSheet(await file.arrayBuffer());
		const byName = Object.fromEntries(store.people.map((p) => [p.name, p]));
		const c = [];
		const f = [];
		for (const row of rows) {
			const ex = byName[row.name];
			if (ex) c.push({
				incoming: row,
				existing: ex,
				action: "skip"
			});
			else f.push(row);
		}
		setFresh(f);
		setConflicts(c);
		toast.message(`解析到 ${rows.length} 人：新增 ${f.length}，重复 ${c.length}`);
	}
	function apply() {
		let people = store.people.slice();
		for (const p of fresh) people.push({
			...p,
			id: uid()
		});
		for (const c of conflicts) if (c.action === "overwrite") people = people.map((x) => x.name === c.existing.name ? {
			...c.incoming,
			id: x.id
		} : x);
		store.replacePeople(people);
		toast.success("人员导入完成");
		setConflicts([]);
		setFresh([]);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入人员",
		onFile
	}), fresh.length || conflicts.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "basis-full mt-3 rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "人员导入确认"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					"新增 ",
					fresh.length,
					" 人。重复的请选跳过或覆盖。"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => setConflicts((cs) => cs.map((c) => ({
						...c,
						action: "skip"
					}))),
					children: "全部跳过"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => setConflicts((cs) => cs.map((c) => ({
						...c,
						action: "overwrite"
					}))),
					children: "全部覆盖"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2 text-sm",
				children: conflicts.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						c.incoming.name,
						" · 现有 ",
						c.existing.team || "空",
						" → 导入 ",
						c.incoming.team || "空"
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "field-select h-9",
						value: c.action,
						onChange: (e) => setConflicts((cs) => {
							const n = cs.slice();
							n[i] = {
								...n[i],
								action: e.target.value
							};
							return n;
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "skip",
							children: "跳过"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "overwrite",
							children: "覆盖"
						})]
					})]
				}, c.existing.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				onClick: apply,
				children: "确认导入"
			})
		]
	}) : null] });
}
function AttendanceImport() {
	const store = useApp();
	const [preview, setPreview] = import_react.useState(null);
	async function onFile(file) {
		if (!file) return;
		const rows = parseAttendanceSheet(await file.arrayBuffer(), store.year);
		if (!rows.length) {
			toast.error("没有读到考勤行。模板列：姓名、出勤天数、加班小时、补助、扣款。");
			return;
		}
		const months = [...new Set(rows.map((r) => r.month).filter(Boolean))];
		const years = [...new Set(rows.map((r) => r.year).filter(Boolean))];
		setPreview({
			fileName: file.name,
			rows,
			targetYear: years[0] || store.year,
			targetMonth: store.year === (/* @__PURE__ */ new Date()).getFullYear() ? (/* @__PURE__ */ new Date()).getMonth() + 1 : 1,
			keepMonths: months.length > 1
		});
	}
	function apply() {
		if (!preview) return;
		const { rows, targetYear, targetMonth, keepMonths } = preview;
		if (!targetYear || targetYear < 2e3) {
			toast.error("请选择导入到哪一年");
			return;
		}
		if (!keepMonths && !targetMonth) {
			toast.error("请选择导入到哪一个月");
			return;
		}
		const mapped = rows.map((r) => ({
			...r,
			id: uid(),
			year: targetYear,
			month: keepMonths ? r.month || targetMonth : targetMonth,
			team: r.team || store.people.find((p) => p.name === r.name)?.team || ""
		}));
		store.addYear(targetYear);
		const grouped = /* @__PURE__ */ new Map();
		for (const r of mapped) {
			const k = `${r.year}-${r.month}`;
			grouped.set(k, [...grouped.get(k) || [], r]);
		}
		let att = store.attendance;
		for (const list of grouped.values()) {
			const y = list[0].year;
			const m = list[0].month;
			const names = new Set(list.map((x) => x.name));
			att = [...att.filter((a) => !(a.year === y && a.month === m && names.has(a.name))), ...list];
		}
		store.replaceAttendance(att);
		store.setYear(targetYear);
		toast.success(`已导入 ${mapped.length} 条`);
		setPreview(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入考勤",
		onFile
	}), preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "basis-full mt-3 rounded-xl border border-accent bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "确认考勤导入到哪年哪月"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					preview.fileName,
					" · ",
					preview.rows.length,
					" 条"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "导入到哪一年"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "number",
						value: preview.targetYear,
						onChange: (e) => setPreview({
							...preview,
							targetYear: Number(e.target.value)
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "导入到哪一个月"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select mt-1 w-full",
						value: preview.targetMonth,
						disabled: preview.keepMonths,
						onChange: (e) => setPreview({
							...preview,
							targetMonth: Number(e.target.value)
						}),
						children: Array.from({ length: 12 }, (_, i) => i + 1).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: m,
							children: [m, " 月"]
						}, m))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 flex items-center gap-2 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: preview.keepMonths,
					onChange: (e) => setPreview({
						...preview,
						keepMonths: e.target.checked
					})
				}), "表里有多个月份时，按原月份分别写入"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: apply,
					children: "确认导入"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setPreview(null),
					children: "取消"
				})]
			})
		]
	}) : null] });
}
function PaymentImport() {
	const store = useApp();
	async function onFile(file) {
		if (!file) return;
		const rows = parsePaymentSheet(await file.arrayBuffer());
		store.replacePayments([...store.payments, ...rows]);
		toast.success(`已追加 ${rows.length} 条发放。有日期的记到对应年份，可在右上角切「全部年份」查看。`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入发放",
		onFile
	});
}
function ContractImport() {
	const store = useApp();
	async function onFile(file) {
		if (!file) return;
		const parsed = parseContractWorkbook(await file.arrayBuffer());
		if (!parsed.contracts.length) {
			toast.error("没有读到合同。需要「项目名称」列。");
			return;
		}
		const keep = store.contracts.slice();
		const keepE = store.contractEntries.slice();
		let added = 0;
		for (const c of parsed.contracts) {
			if (keep.find((x) => x.year === c.year && x.name === c.name && x.code === c.code)) continue;
			keep.push(c);
			keepE.push(...parsed.entries.filter((e) => e.contractId === c.id));
			added += 1;
		}
		store.replaceContracts(keep, keepE);
		toast.success(`导入合同 ${added} 个，跳过重复 ${parsed.contracts.length - added} 个`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入合同",
		onFile
	});
}
function ExpenseImport() {
	const store = useApp();
	async function onFile(file) {
		if (!file) return;
		const rows = parseExpenseSheet(await file.arrayBuffer(), store.year);
		if (!rows.length) {
			toast.error("没有读到报销。需要「项目名称」列。");
			return;
		}
		store.replaceExpenses([...store.expenses || [], ...rows]);
		toast.success(`已追加 ${rows.length} 条报销`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入报销",
		onFile
	});
}
function FullBookImport() {
	const store = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePick, {
		accept: ".xlsx,.xls",
		label: "选择整本台账",
		hint: "含人员、12 个月考勤、发放、报销",
		onFile: async (file) => {
			if (!file) return;
			const parsed = parseFullAttendanceWorkbook(await file.arrayBuffer(), store.year);
			if (!parsed.people.length && !parsed.attendance.length && !parsed.payments.length && !(parsed.expenses || []).length) {
				toast.error("没有读到人员、考勤、发放或报销");
				return;
			}
			const byName = Object.fromEntries(store.people.map((p) => [p.name, p]));
			const merged = store.people.slice();
			let added = 0;
			for (const p of parsed.people) if (!byName[p.name]) {
				merged.push({
					...p,
					id: uid()
				});
				added += 1;
			}
			if (added) store.replacePeople(merged);
			if (parsed.payments.length) store.replacePayments([...store.payments, ...parsed.payments]);
			if (parsed.expenses && parsed.expenses.length) store.replaceExpenses([...store.expenses || [], ...parsed.expenses]);
			if (parsed.attendance.length) {
				store.addYear(parsed.year || store.year);
				const names = new Set(parsed.attendance.map((a) => a.name + a.year + a.month));
				const keep = store.attendance.filter((a) => !names.has(a.name + a.year + a.month));
				store.replaceAttendance([...keep, ...parsed.attendance.map((a) => ({
					...a,
					id: uid()
				}))]);
				store.setYear(parsed.year || store.year);
			}
			toast.success(`整本导入完成：人员新增 ${added}，考勤 ${parsed.attendance.length} 条，发放 ${parsed.payments.length} 条，报销 ${(parsed.expenses || []).length} 条`);
		}
	});
}
export { PaymentImport as a, FullBookImport as i, ContractImport as n, PeopleImport as o, ExpenseImport as r, TplLink as s, AttendanceImport as t };
