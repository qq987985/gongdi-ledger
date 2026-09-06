import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-DxXw_WvE.js";
import { a as toggleSel, i as money, n as confirmBatchDelete, o as uid } from "./utils-DPLvt0U2.js";
import { C as hasWork, E as wageLabel, S as getWageAt, T as parseOtRule, _ as monthStatus, b as paymentsInYear, h as derivedYears, v as nextYear, w as monthPay } from "./contracts-DPSGQfL0.js";
import "./excel-fjK0RDg-.js";
import { t as useApp } from "./store-CCEaHtiU.js";
import { n as toast } from "./dist-CqIYJTgr.js";
import "./nas-sync-CnKaWA1y.js";
import { t as createLucideIcon } from "./createLucideIcon-C8gAEEmk.js";
import { a as prepareNamedFile, d as setDoc, n as DocActions, r as attendanceBase } from "./doc-actions-CWmHyUVN.js";
import { n as FilePick } from "./file-pick-CkpQhi3p.js";
import { t as Plus } from "./plus-DxobgIow.js";
import { t as Trash } from "./trash-uWb7gVC9.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { t as Input } from "./input-BWJYTTKH.js";
import { n as WideTable } from "./wide-table-DtWSjvOR.js";
import { n as Need } from "./can-Bjs-wC4y.js";
import { c as TplLink, t as AttendanceImport } from "./excel-import-DUyJ5PQS.js";
var ArrowLeft = createLucideIcon("arrow-left", [["path", {
	d: "m12 19-7-7 7-7",
	key: "1l729n"
}], ["path", {
	d: "M19 12H5",
	key: "x3x0zl"
}]]);
var UserPlus = createLucideIcon("user-plus", [
	["path", {
		d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
		key: "1yyitq"
	}],
	["circle", {
		cx: "9",
		cy: "7",
		r: "4",
		key: "nufk8"
	}],
	["line", {
		x1: "19",
		x2: "19",
		y1: "8",
		y2: "14",
		key: "1bvyxn"
	}],
	["line", {
		x1: "22",
		x2: "16",
		y1: "11",
		y2: "11",
		key: "1shjgl"
	}]
]);
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function AttendancePage() {
	const store = useApp();
	const { year, people, attendance, saveAttendanceMonth, addYear } = store;
	const [month, setMonth] = import_react.useState(null);
	const existing = attendance.filter((a) => a.year === year && a.month === (month || 0));
	const upcoming = nextYear(derivedYears(store));
	if (month == null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YearOverview, {
		onOpen: setMonth,
		onAddYear: () => {
			const created = addYear(upcoming);
			toast.success(`${created} 年已展开，12 个月空表已铺好`);
		},
		upcoming
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "attendance.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink",
							onClick: () => setMonth(null),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }),
								" 返回 ",
								year,
								" 年总览"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "font-display text-2xl font-semibold",
							children: [
								year,
								"年",
								month,
								"月考勤"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "只填本月实际出勤的人。下面可上传几份考勤表照片或 PDF，以后在「影像资料」里查、下、复制、替换、删除。"
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select w-auto",
						value: month,
						onChange: (e) => setMonth(Number(e.target.value)),
						children: Array.from({ length: 12 }, (_, i) => i + 1).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: m,
							children: [m, "月"]
						}, m))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthFiles, {
					year,
					month
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthTable, {
					year,
					month,
					people,
					existing,
					onSave: (rows) => {
						saveAttendanceMonth(year, month, rows);
						toast.success("本月考勤已保存");
					}
				}, `${year}-${month}-${people.length}`)
			]
		})
	});
}
function YearOverview({ onOpen, onAddYear, upcoming }) {
	const { year, people, attendance, attendanceDocs = [], payments } = useApp();
	const yearPay = paymentsInYear(payments, year, derivedYears({
		year,
		years: [year],
		attendance
	})[0] || year);
	const personRows = people.map((p) => {
		const months = Array.from({ length: 12 }, (_, i) => {
			const calc = monthPay(attendance.find((x) => x.year === year && x.month === i + 1 && x.name === p.name), getWageAt(p, year, i + 1));
			return {
				days: calc.days,
				pay: calc.pay,
				otHours: calc.otHours,
				allowance: calc.allowance,
				deduction: calc.deduction
			};
		});
		const yearPayAmt = months.reduce((s, m) => s + m.pay, 0);
		const yearDays = months.reduce((s, m) => s + m.days, 0);
		const yearOt = months.reduce((s, m) => s + m.otHours, 0);
		const paid = yearPay.filter((x) => x.owner === p.name && x.date).reduce((s, x) => s + x.amount, 0);
		const worked = months.some((m) => hasWork(m));
		return {
			p,
			months,
			yearPayAmt,
			yearDays,
			yearOt,
			paid,
			unpaid: yearPayAmt - paid,
			worked
		};
	}).filter((r) => r.worked);
	const filledMonths = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, year, i + 1).filled > 0).filter(Boolean).length;
	const [sumTab, setSumTab] = import_react.useState("pay");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "font-display text-2xl font-semibold",
					children: [year, "年考勤"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-xl text-sm text-muted",
					children: "和 Excel 一样，一年 12 个月。点某个月填写天数、加班、补助和扣款。加班规则在「人员」里设好，这里自动带入。"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
							href: `/api/file/attendance-template?year=${year}`,
							filename: `${year}年考勤导入模板.xlsx`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceImport, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							type: "button",
							onClick: onAddYear,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }),
								" 新增 ",
								upcoming,
								" 年"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"已录入 ",
					filledMonths,
					" / 12 个月 · 在册 ",
					people.length,
					" 人"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
				children: Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
					const st = monthStatus(attendance, year, m);
					const filled = st.filled > 0;
					const files = attendanceDocs.filter((d) => d.year === year && d.month === m).length;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onOpen(m),
						className: "rounded-xl border border-line bg-surface p-4 text-left shadow-panel transition-colors duration-150 hover:border-accent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-lg font-semibold",
								children: [m, "月"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-xs ${filled ? "text-ok" : "text-subtle"}`,
								children: filled ? "已录入" : "空表"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 text-xs text-muted",
							children: filled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								st.filled,
								" 人 · 出勤 ",
								st.days,
								" 天",
								files ? ` · ${files} 份影像` : ""
							] }) : files ? `${files} 份影像，点此补录出勤` : "点此填写实际出勤"
						})]
					}, m);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-line bg-surface",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-sm font-semibold",
						children: [
							year,
							"年度",
							sumTab === "pay" ? "工资汇总" : "工天加班汇总"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-0.5 text-xs text-muted",
						children: sumTab === "pay" ? "只列出本年有出勤的人。没上班的不显示。加班规则没填时加班费按 0。" : "每月工天和加班小时。只显示本年有出勤的人。"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex rounded-full border border-line p-0.5 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `h-8 rounded-full px-3 ${sumTab === "pay" ? "bg-accent text-accent-fg" : "text-muted"}`,
							onClick: () => setSumTab("pay"),
							children: "工资"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `h-8 rounded-full px-3 ${sumTab === "work" ? "bg-accent text-accent-fg" : "text-muted"}`,
							onClick: () => setSumTab("work"),
							children: "工天加班"
						})]
					})]
				}), sumTab === "pay" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "attendance-year",
					className: "rounded-none border-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "wide-table text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "姓名"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "班组"
								}),
								Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									className: "p-3",
									children: [i + 1, "月"]
								}, i)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "全年"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "已发"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "未发"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [personRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 16,
							className: "p-4 text-muted",
							children: "这一年还没有人出勤。点上面某个月，把实际上班的人加进去。"
						}) }) : null, personRows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 font-medium",
									children: r.p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-muted",
									children: r.p.team
								}),
								r.months.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right tabular-nums text-muted",
									children: m.pay ? money(m.pay) : "—"
								}, i)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right font-medium tabular-nums",
									children: money(r.yearPayAmt)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right tabular-nums",
									children: money(r.paid)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right tabular-nums",
									children: money(r.unpaid)
								})
							]
						}, r.p.id))] })]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "attendance-year-work",
					className: "rounded-none border-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "wide-table text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "姓名"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "班组"
								}),
								Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									className: "p-3",
									children: [i + 1, "月"]
								}, i)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "全年工天"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "全年加班"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [personRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 16,
							className: "p-4 text-muted",
							children: "这一年还没有人出勤。点上面某个月，把实际上班的人加进去。"
						}) }) : null, personRows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 font-medium",
									children: r.p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-muted",
									children: r.p.team
								}),
								r.months.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right tabular-nums",
									children: m.days || m.otHours ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: m.days || "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted",
										children: m.otHours ? `${m.otHours}时` : "—"
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: "—"
									})
								}, i)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right font-medium tabular-nums",
									children: r.yearDays || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "p-3 text-right tabular-nums",
									children: r.yearOt ? `${r.yearOt}时` : "—"
								})
							]
						}, r.p.id))] })]
					})
				})]
			})
		]
	});
}
function MonthTable({ year, month, people, existing, onSave }) {
	const byName = Object.fromEntries(existing.map((a) => [a.name, a]));
	const [rows, setRows] = import_react.useState(() => existing.filter((a) => a.name.trim()).map((a) => ({
		name: a.name,
		team: a.team || byName[a.name]?.team || "",
		days: a.days ?? 0,
		otHours: a.otHours ?? 0,
		allowance: a.allowance ?? 0,
		deduction: a.deduction ?? 0,
		remark: a.remark ?? ""
	})));
	const [pick, setPick] = import_react.useState("");
	const [selected, setSelected] = import_react.useState([]);
	const pmap = Object.fromEntries(people.map((p) => [p.name, p]));
	const used = new Set(rows.map((r) => r.name));
	const unused = people.filter((p) => p.name && !used.has(p.name));
	function addNames(names) {
		setRows((prev) => {
			const have = new Set(prev.map((r) => r.name));
			const extra = names.filter((n) => n && !have.has(n)).map((n) => {
				const p = pmap[n];
				const old = byName[n];
				return {
					name: n,
					team: old?.team || p?.team || "",
					days: old?.days ?? 0,
					otHours: old?.otHours ?? 0,
					allowance: old?.allowance ?? 0,
					deduction: old?.deduction ?? 0,
					remark: old?.remark ?? ""
				};
			});
			return extra.length ? [...prev, ...extra] : prev;
		});
	}
	function removeAt(i) {
		const name = rows[i]?.name;
		setRows((prev) => prev.filter((_, idx) => idx !== i));
		if (name) setSelected((s) => s.filter((n) => n !== name));
	}
	function removeSelected() {
		if (!selected.length) return;
		if (!confirmBatchDelete("本月考勤", selected.length, "只从本月名单里去掉这些人。人员档案和发放记录不动。保存后生效。")) return;
		const keep = rows.filter((r) => !selected.includes(r.name));
		setRows(keep);
		setSelected([]);
		onSave(keep);
		toast.success(`已从本月去掉 ${selected.length} 人`);
	}
	const calcRows = rows.map((r) => {
		const p = pmap[r.name];
		const wage = getWageAt(p, year, month);
		const calc = monthPay(r, wage);
		return {
			...r,
			wageLabel: wageLabel(wage),
			rule: wage.otRule || "",
			ot: calc.ot,
			meal: calc.meal,
			pay: calc.pay,
			parsed: parseOtRule(wage.otRule || ""),
			known: Boolean(p),
			monthly: wage.payType === "month"
		};
	});
	const totalPay = calcRows.reduce((s, r) => s + r.pay, 0);
	const totalOt = calcRows.reduce((s, r) => s + r.ot, 0);
	const totalMeal = calcRows.reduce((s, r) => s + (r.meal || 0), 0);
	const totalDays = calcRows.reduce((s, r) => s + r.days, 0);
	const totalAllowance = calcRows.reduce((s, r) => s + (r.allowance || 0), 0);
	const totalDeduction = calcRows.reduce((s, r) => s + (r.deduction || 0), 0);
	const missingRule = calcRows.filter((r) => r.known && !r.rule).length;
	const unknown = calcRows.filter((r) => !r.known).length;
	function patch(i, key, value) {
		setRows((prev) => {
			const next = prev.slice();
			const row = { ...next[i] };
			if (key === "remark") row[key] = value;
			else row[key] = Number(value) || 0;
			next[i] = row;
			return next;
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface px-4 py-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-40 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted",
						children: "从人员表加入本月出勤"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "field-select mt-1 w-full",
						value: pick,
						onChange: (e) => setPick(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: unused.length ? "选择姓名" : "在册人员都已加入"
						}), unused.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: p.name,
							children: [
								p.name,
								" ",
								p.team ? ` · ${p.team}` : ""
							]
						}, p.id))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: () => {
						if (!pick) return;
						addNames([pick]);
						setPick("");
					},
					disabled: !pick,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-4" }), " 加入"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => addNames(unused.map((p) => p.name)),
					disabled: !unused.length,
					children: "加入全部在册"
				})
			]
		}),
		missingRule > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-warn",
			children: [
				"有 ",
				missingRule,
				" 人还没在人员表设加班规则，加班费会算成 0。到「人员」里填「按小时:25」或「折算:8」。"
			]
		}) : null,
		unknown > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-warn",
			children: [
				"有 ",
				unknown,
				" 人不在人员表，无法带入加班规则。请先在人员里添加。"
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"本月 ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "tabular-nums",
							children: rows.length
						}),
						" 人"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"出勤 ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "tabular-nums",
							children: totalDays
						}),
						" 天"
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["加班费 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
						className: "tabular-nums",
						children: ["¥", money(totalOt)]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["餐补 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
						className: "tabular-nums",
						children: ["¥", money(totalMeal)]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["补助 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
						className: "tabular-nums",
						children: ["¥", money(totalAllowance)]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["扣款 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
						className: "tabular-nums",
						children: ["¥", money(totalDeduction)]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["应发 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
						className: "tabular-nums",
						children: ["¥", money(totalPay)]
					})] }),
					selected.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "danger",
						size: "sm",
						type: "button",
						onClick: removeSelected,
						children: [
							"删除所选（",
							selected.length,
							"）"
						]
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => onSave(rows),
				children: "保存本月"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
			id: "attendance-month",
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
								checked: rows.length > 0 && rows.every((r) => selected.includes(r.name)),
								onChange: (e) => setSelected(e.target.checked ? rows.map((r) => r.name) : []),
								"aria-label": "全选本月考勤"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "姓名"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "班组"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "出勤天数"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "加班小时"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "补助"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "扣款"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "工资（人员表）"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "加班规则（人员表）"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "加班费"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "餐补"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "应发"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "p-3",
							children: "备注"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "p-3" })
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [calcRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					colSpan: 14,
					className: "p-6 text-muted",
					children: "本月还没人。从上方人员表把实际出勤的人加进来，填出勤天数、加班小时、补助、扣款。"
				}) }) : null, calcRows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-line last:border-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "size-4",
								checked: selected.includes(r.name),
								onChange: (e) => setSelected((s) => toggleSel(s, r.name, e.target.checked)),
								"aria-label": `选择 ${r.name}`
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2 font-medium",
							children: r.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2 text-muted",
							children: r.team || pmap[r.name]?.team || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "h-9 w-24",
								type: "number",
								step: "0.5",
								value: r.days,
								onChange: (e) => patch(i, "days", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "h-9 w-24",
								type: "number",
								step: "0.5",
								value: r.otHours,
								onChange: (e) => patch(i, "otHours", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "h-9 w-24",
								type: "number",
								step: "0.01",
								value: r.allowance,
								onChange: (e) => patch(i, "allowance", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "h-9 w-24",
								type: "number",
								step: "0.01",
								value: r.deduction,
								onChange: (e) => patch(i, "deduction", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2 tabular-nums",
							children: r.wageLabel
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2 text-xs",
							children: r.parsed.label || "未设"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "p-2 tabular-nums",
							children: ["¥", money(r.ot)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "p-2 tabular-nums",
							children: ["¥", money(r.meal)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "p-2 font-medium tabular-nums",
							children: ["¥", money(r.pay)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "h-9 w-36",
								value: r.remark,
								onChange: (e) => patch(i, "remark", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "p-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "size-9",
								onClick: () => removeAt(i),
								"aria-label": `移出 ${r.name}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash, { className: "size-4" })
							})
						})
					]
				}, r.name))] })]
			})
		})
	] });
}
function MonthFiles({ year, month }) {
	const docs = useApp((s) => s.attendanceDocs || []);
	const add = useApp((s) => s.addAttendanceDoc);
	const patch = useApp((s) => s.patchAttendanceDoc);
	const remove = useApp((s) => s.removeAttendanceDocs);
	const list = docs.filter((d) => d.year === year && d.month === month);
	const [remark, setRemark] = import_react.useState("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold",
					children: "本月考勤影像资料"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "可上传多份。自动命名为「考勤-2026年3月」。文件落在 data/photos/考勤影像。删除、替换前会确认。"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePick, {
					kind: "file",
					compact: true,
					multiple: true,
					accept: ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls",
					label: "上传影像",
					hint: "点击选择，或把文件拖到这里，可一次多份",
					onFiles: async (files) => {
						if (!files.length) return;
						const taken = docs.map((d) => d.fileName);
						let uploaded = 0;
						for (const file of files) {
							const id = uid();
							const pack = await prepareNamedFile(file, attendanceBase(year, month), taken, "");
							if (!pack) continue;
							const saved = await setDoc(id, "attendance", pack.file, { replace: pack.replace }) || pack.file.name;
							taken.push(saved);
							add({
								id,
								year,
								month,
								fileName: saved,
								remark
							});
							uploaded += 1;
						}
						setRemark("");
						if (uploaded) toast.success(`已上传 ${uploaded} 份`);
					}
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "mt-3",
				value: remark,
				onChange: (e) => setRemark(e.target.value),
				placeholder: "备注（选填，会写在接下来上传的文件上）"
			}),
			list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "还没有影像资料。"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: list.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "truncate font-medium",
							children: d.fileName
						}), d.remark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: d.remark
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
						id: d.id,
						kind: "attendance",
						fileName: d.fileName,
						suggest: attendanceBase(year, month),
						taken: docs.map((x) => x.fileName),
						onReplaced: (name) => patch(d.id, { fileName: name }),
						onDeleted: () => remove([d.id])
					})]
				}, d.id))
			})
		]
	});
}
export { AttendancePage as component };
