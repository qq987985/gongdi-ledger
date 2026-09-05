import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { o as uid } from "./utils-DPLvt0U2.js";
import { C as parseFullAttendanceWorkbook, E as parsePeopleSheet, S as parseExpenseSheet, T as parsePaymentSheet, b as parseAttendanceSheet, w as parseInsuranceMembersSheet, x as parseContractWorkbook } from "./excel-BlBPgw8h.js";
import { t as useApp } from "./store-hEylUgmu.js";
import { n as toast } from "./dist-CqIYJTgr.js";
import { n as FilePick } from "./file-pick-BeL05MzS.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { t as Input } from "./input-BWJYTTKH.js";
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
	const [mode, setMode] = import_react.useState("add");
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
		if (mode === "replace") {
			const incomingNames = new Set([...fresh.map((p) => p.name), ...conflicts.filter((c) => c.action === "overwrite").map((c) => c.incoming.name)]);
			people = people.filter((p) => !incomingNames.has(p.name));
		}
		for (const p of fresh) people.push({
			...p,
			id: uid()
		});
		for (const c of conflicts) if (c.action === "overwrite") people = people.map((x) => x.name === c.existing.name ? {
			...c.incoming,
			id: x.id
		} : x);
		store.replacePeople(people);
		toast.success(mode === "replace" ? "人员已替换导入" : "人员导入完成");
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
					" 人，重复 ",
					conflicts.length,
					" 人。",
					mode === "replace" ? "替换模式：会清空原有重复人员后重新导入。" : "增加模式：在现有人员基础上追加。"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "people-mode",
						checked: mode === "add",
						onChange: () => setMode("add")
					}), " 增加"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "people-mode",
						checked: mode === "replace",
						onChange: () => setMode("replace")
					}), " 替换"]
				})]
			}),
			conflicts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
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
			})] }) : null,
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
	const [mode, setMode] = import_react.useState("add");
	const [preview, setPreview] = import_react.useState(null);
	async function onFile(file) {
		if (!file) return;
		const rows = parseAttendanceSheet(await file.arrayBuffer(), store.year);
		if (!rows.length) {
			toast.error("没有读到考勤行。模板列：姓名、出勤天数、加班小时、补助、扣款。");
			return;
		}
		const months = [...new Set(rows.map((r) => r.month).filter(Boolean))];
		const targetYear = [...new Set(rows.map((r) => r.year).filter(Boolean))][0] || store.year;
		const targetMonth = store.year === (/* @__PURE__ */ new Date()).getFullYear() ? (/* @__PURE__ */ new Date()).getMonth() + 1 : 1;
		const conflicts = [];
		for (const r of rows) {
			const y = targetYear;
			const m = months.length > 1 ? r.month || targetMonth : targetMonth;
			const ex = store.attendance.find((a) => a.year === y && a.month === m && a.name === r.name);
			if (ex) conflicts.push({
				name: r.name,
				existing: ex,
				incoming: r
			});
		}
		setPreview({
			fileName: file.name,
			rows,
			targetYear,
			targetMonth,
			keepMonths: months.length > 1,
			conflicts
		});
	}
	function apply() {
		if (!preview) return;
		const { rows, targetYear, targetMonth, keepMonths, conflicts } = preview;
		if (!targetYear || targetYear < 2e3) {
			toast.error("请选择导入到哪一年");
			return;
		}
		if (!keepMonths && !targetMonth) {
			toast.error("请选择导入到哪一个月");
			return;
		}
		const skipNames = mode === "replace" ? /* @__PURE__ */ new Set() : new Set(conflicts.map((c) => c.name));
		const mapped = rows.filter((r) => !skipNames.has(r.name)).map((r) => ({
			...r,
			id: uid(),
			year: targetYear,
			month: keepMonths ? r.month || targetMonth : targetMonth,
			team: r.team || store.people.find((p) => p.name === r.name)?.team || ""
		}));
		store.addYear(targetYear);
		let att = store.attendance;
		if (mode === "replace") {
			const importNames = new Set(mapped.map((r) => r.name));
			const importMonths = new Set(mapped.map((r) => `${r.year}-${r.month}`));
			att = att.filter((a) => !(importMonths.has(`${a.year}-${a.month}`) && importNames.has(a.name)));
		}
		att = [...att, ...mapped];
		store.replaceAttendance(att);
		store.setYear(targetYear);
		toast.success(`已导入 ${mapped.length} 条${mode === "replace" ? "（替换模式）" : ""}`);
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
				children: "确认考勤导入"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					preview.fileName,
					" · ",
					preview.rows.length,
					" 条",
					preview.conflicts.length > 0 ? ` · 冲突 ${preview.conflicts.length} 人` : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "att-mode",
						checked: mode === "add",
						onChange: () => setMode("add")
					}), " 增加"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "att-mode",
						checked: mode === "replace",
						onChange: () => setMode("replace")
					}), " 替换"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: mode === "replace" ? "替换模式：同名同月原有记录会被删除，只保留导入的。" : "增加模式：在现有考勤基础上追加，同名同月会冲突。"
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
			preview.conflicts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 rounded-md border border-warn bg-warn-bg p-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-medium",
					children: [
						"以下人员在该月已有考勤记录，导入时会",
						mode === "replace" ? "被替换" : "冲突跳过",
						"："
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-muted",
					children: preview.conflicts.map((c) => c.name).join("、")
				})]
			}) : null,
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
	const [mode, setMode] = import_react.useState("add");
	const [preview, setPreview] = import_react.useState(null);
	async function onFile(file) {
		if (!file) return;
		const rows = parsePaymentSheet(await file.arrayBuffer());
		if (!rows.length) {
			toast.error("没有读到发放记录");
			return;
		}
		setPreview({
			rows,
			fileName: file.name
		});
	}
	function apply() {
		if (!preview) return;
		if (mode === "replace") {
			store.replacePayments(preview.rows);
			toast.success(`已替换为 ${preview.rows.length} 条发放记录`);
		} else {
			store.replacePayments([...store.payments, ...preview.rows]);
			toast.success(`已追加 ${preview.rows.length} 条发放记录`);
		}
		setPreview(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入发放",
		onFile
	}), preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "basis-full mt-3 rounded-xl border border-accent bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "发放导入确认"
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
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "pay-mode",
						checked: mode === "add",
						onChange: () => setMode("add")
					}), " 增加"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "pay-mode",
						checked: mode === "replace",
						onChange: () => setMode("replace")
					}), " 替换"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: mode === "replace" ? "替换模式：会清空所有原有发放记录，只保留导入的。" : "增加模式：在现有发放记录后追加。"
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
function ContractImport() {
	const store = useApp();
	const [mode, setMode] = import_react.useState("add");
	const [preview, setPreview] = import_react.useState(null);
	async function onFile(file) {
		if (!file) return;
		const parsed = parseContractWorkbook(await file.arrayBuffer());
		if (!parsed.contracts.length) {
			toast.error("没有读到合同。需要「项目名称」列。");
			return;
		}
		const conflicts = [];
		for (const c of parsed.contracts) {
			const ex = store.contracts.find((x) => x.year === c.year && x.name === c.name && x.code === c.code);
			if (ex) conflicts.push({
				incoming: c,
				existing: ex
			});
		}
		setPreview({
			contracts: parsed.contracts,
			entries: parsed.entries,
			conflicts,
			fileName: file.name
		});
	}
	function apply() {
		if (!preview) return;
		const { contracts, entries, conflicts } = preview;
		const skipIds = new Set(conflicts.map((c) => c.existing.id));
		let keep = store.contracts.slice();
		let keepE = store.contractEntries.slice();
		if (mode === "replace") {
			keep = keep.filter((c) => !skipIds.has(c.id));
			keepE = keepE.filter((e) => !skipIds.has(e.contractId));
		}
		let added = 0;
		for (const c of contracts) {
			if (keep.find((x) => x.year === c.year && x.name === c.name && x.code === c.code)) continue;
			keep.push(c);
			keepE.push(...entries.filter((e) => e.contractId === c.id));
			added += 1;
		}
		store.replaceContracts(keep, keepE);
		toast.success(mode === "replace" ? `导入合同 ${added} 个，替换冲突 ${conflicts.length} 个` : `导入合同 ${added} 个，跳过重复 ${conflicts.length} 个`);
		setPreview(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入合同",
		onFile
	}), preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "basis-full mt-3 rounded-xl border border-accent bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "合同导入确认"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					preview.fileName,
					" · ",
					preview.contracts.length,
					" 个合同",
					preview.conflicts.length > 0 ? ` · 冲突 ${preview.conflicts.length} 个` : ""
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "contract-mode",
						checked: mode === "add",
						onChange: () => setMode("add")
					}), " 增加"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "contract-mode",
						checked: mode === "replace",
						onChange: () => setMode("replace")
					}), " 替换"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: mode === "replace" ? "替换模式：同名同年的冲突合同会被删除后重新导入。" : "增加模式：跳过已有合同，只导入新的。"
			}),
			preview.conflicts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 rounded-md border border-warn bg-warn-bg p-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-medium",
					children: [
						"以下合同已存在，导入时会",
						mode === "replace" ? "被替换" : "跳过",
						"："
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-1 text-muted",
					children: preview.conflicts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						c.incoming.year,
						" ",
						c.incoming.name,
						"（",
						c.incoming.code,
						"）"
					] }, c.existing.id))
				})]
			}) : null,
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
function ExpenseImport() {
	const store = useApp();
	const [mode, setMode] = import_react.useState("add");
	const [preview, setPreview] = import_react.useState(null);
	async function onFile(file) {
		if (!file) return;
		const rows = parseExpenseSheet(await file.arrayBuffer(), store.year);
		if (!rows.length) {
			toast.error("没有读到报销。需要「项目名称」列。");
			return;
		}
		setPreview({
			rows,
			fileName: file.name
		});
	}
	function apply() {
		if (!preview) return;
		if (mode === "replace") {
			store.replaceExpenses(preview.rows);
			toast.success(`已替换为 ${preview.rows.length} 条报销`);
		} else {
			store.replaceExpenses([...store.expenses || [], ...preview.rows]);
			toast.success(`已追加 ${preview.rows.length} 条报销`);
		}
		setPreview(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExcelBtn, {
		label: "导入报销",
		onFile
	}), preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "basis-full mt-3 rounded-xl border border-accent bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "报销导入确认"
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
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "exp-mode",
						checked: mode === "add",
						onChange: () => setMode("add")
					}), " 增加"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "exp-mode",
						checked: mode === "replace",
						onChange: () => setMode("replace")
					}), " 替换"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: mode === "replace" ? "替换模式：会清空所有原有报销记录，只保留导入的。" : "增加模式：在现有报销记录后追加。"
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
function InsuranceMemberImport({ policyId, onImported }) {
	const store = useApp();
	const [mode, setMode] = import_react.useState("add");
	const [conflicts, setConflicts] = import_react.useState([]);
	const [fresh, setFresh] = import_react.useState([]);
	async function onFile(file) {
		if (!file) return;
		const policy = store.insurancePolicies.find((p) => p.id === policyId);
		const rows = parseInsuranceMembersSheet(await file.arrayBuffer()).map((m) => ({
			...m,
			startDate: m.startDate || policy?.periodStart || "",
			endDate: m.endDate || policy?.periodEnd || ""
		}));
		if (!rows.length) {
			toast.error("没有读到保险人员。模板列：姓名、队长、备注。");
			return;
		}
		const byName = Object.fromEntries(store.insuranceMembers.filter((m) => m.policyId === policyId).map((m) => [m.name, m]));
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
		const others = store.insuranceMembers.filter((m) => m.policyId !== policyId);
		let here = store.insuranceMembers.filter((m) => m.policyId === policyId);
		if (mode === "replace") {
			const incomingNames = new Set([...fresh.map((m) => m.name), ...conflicts.filter((c) => c.action === "overwrite").map((c) => c.incoming.name)]);
			here = here.filter((m) => !incomingNames.has(m.name));
		}
		const result = [...others, ...here];
		for (const m of fresh) result.push({
			...m,
			id: uid(),
			policyId
		});
		for (const c of conflicts) if (c.action === "overwrite") {
			for (let i = 0; i < result.length; i++) if (result[i].id === c.existing.id) result[i] = {
				...c.incoming,
				id: c.existing.id,
				policyId
			};
		}
		store.replaceMembers(result);
		if (onImported) onImported();
		toast.success(mode === "replace" ? "保险人员已替换导入" : "保险人员导入完成");
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
				children: "保险人员导入确认"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					"新增 ",
					fresh.length,
					" 人，重复 ",
					conflicts.length,
					" 人。",
					mode === "replace" ? "替换模式：会清空本保单重复人员后重新导入。" : "增加模式：在本保单现有人员基础上追加。"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "ins-member-mode",
						checked: mode === "add",
						onChange: () => setMode("add")
					}), " 增加"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "inline-flex items-center gap-1.5 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "radio",
						name: "ins-member-mode",
						checked: mode === "replace",
						onChange: () => setMode("replace")
					}), " 替换"]
				})]
			}),
			conflicts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2 text-sm",
				children: conflicts.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						c.incoming.name,
						" · 现有 ",
						c.existing.leader || "无队长",
						" → 导入 ",
						c.incoming.leader || "无队长"
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
			})] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				onClick: apply,
				children: "确认导入"
			})
		]
	}) : null] });
}
export { InsuranceMemberImport as a, TplLink as c, FullBookImport as i, ContractImport as n, PaymentImport as o, ExpenseImport as r, PeopleImport as s, AttendanceImport as t };
