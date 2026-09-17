import { F as require_react, V as __toESM, c as require_jsx_runtime, o as useRouter } from "../server.js";
import { u as permLabel } from "./perms-D5IsG1Md.js";
import { a as money, n as confirmBatchDelete, o as toggleSel, s as uid } from "./utils-DqsA5Dz5.js";
import { a as round2, i as parseOtRule, m as nextYear, n as getWageAt, o as wageLabel, p as monthStatus, r as monthPay, u as derivedYears } from "./wage-BVBIWt51.js";
import "./excel-kgejXfpm.js";
import { n as useApp } from "./store-SQXLJqfK.js";
import { v as toast } from "./audit-diff-BCw9WhZ-.js";
import { t as createLucideIcon } from "./createLucideIcon-C8gAEEmk.js";
import { a as prepareNamedFile, d as setDoc, f as Trash, n as DocActions, r as attendanceBase } from "./doc-actions-BGXaHSWv.js";
import { n as FilePick } from "./file-pick-C7mO9xHH.js";
import { t as Plus } from "./plus-GYFU6XQK.js";
import { t as Button } from "./button-GV790FWO.js";
import { t as Input } from "./input-zpuDUNdP.js";
import { i as hasUnsavedChanges, n as clearUnsaved, r as confirmLeaveUnsaved, t as armUnsaved } from "./unsaved-CcfZec5E.js";
import { a as useCanSave, n as Need, r as ReadonlyNotice, s as blockedWrite, t as Can } from "./can-Cjz25VK8.js";
import { n as WideTable } from "./wide-table-Bxe7VpCV.js";
import { n as AttendanceMonthsYearSheet, r as PayrollYearSheet, t as AttendanceMonthSheet } from "./ledger-print-sheets-TwgnUCO7.js";
import { c as TplLink, t as AttendanceImport } from "./excel-import-B1XcuBh9.js";
import { n as summarizeYear, t as fallbackPayYear } from "./attendance-summary-iUExKhQj.js";
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function _resolveBlockerOpts(opts, condition) {
	if (opts === void 0) return {
		shouldBlockFn: () => true,
		withResolver: false
	};
	if ("shouldBlockFn" in opts) return opts;
	if (typeof opts === "function") {
		const shouldBlock$1 = Boolean(condition ?? true);
		const _customBlockerFn$1 = async () => {
			if (shouldBlock$1) return await opts();
			return false;
		};
		return {
			shouldBlockFn: _customBlockerFn$1,
			enableBeforeUnload: shouldBlock$1,
			withResolver: false
		};
	}
	const shouldBlock = Boolean(opts.condition ?? true);
	const fn = opts.blockerFn;
	const _customBlockerFn = async () => {
		if (shouldBlock && fn !== void 0) return await fn();
		return shouldBlock;
	};
	return {
		shouldBlockFn: _customBlockerFn,
		enableBeforeUnload: shouldBlock,
		withResolver: fn === void 0
	};
}
function useBlocker(opts, condition) {
	const { shouldBlockFn, enableBeforeUnload = true, disabled = false, withResolver = false } = _resolveBlockerOpts(opts, condition);
	const router = useRouter();
	const { history } = router;
	const [resolver, setResolver] = import_react.useState({
		status: "idle",
		current: void 0,
		next: void 0,
		action: void 0,
		proceed: void 0,
		reset: void 0
	});
	import_react.useEffect(() => {
		const blockerFnComposed = async (blockerFnArgs) => {
			function getLocation(location) {
				const parsedLocation = router.parseLocation(location);
				const [, rawParams, foundRoute] = router.getMatchedRoutes(parsedLocation.pathname);
				if (foundRoute === void 0) return {
					routeId: "__notFound__",
					fullPath: parsedLocation.pathname,
					pathname: parsedLocation.pathname,
					params: rawParams,
					search: router.options.parseSearch(location.search)
				};
				return {
					routeId: foundRoute.id,
					fullPath: foundRoute.fullPath,
					pathname: parsedLocation.pathname,
					params: rawParams,
					search: router.options.parseSearch(location.search)
				};
			}
			const current = getLocation(blockerFnArgs.currentLocation);
			const next = getLocation(blockerFnArgs.nextLocation);
			if (current.routeId === "__notFound__" && next.routeId !== "__notFound__") return false;
			const shouldBlock = await shouldBlockFn({
				action: blockerFnArgs.action,
				current,
				next
			});
			if (!withResolver) return shouldBlock;
			if (!shouldBlock) return false;
			const canNavigateAsync = await new Promise((resolve) => {
				setResolver({
					status: "blocked",
					current,
					next,
					action: blockerFnArgs.action,
					proceed: () => resolve(false),
					reset: () => resolve(true)
				});
			});
			setResolver({
				status: "idle",
				current: void 0,
				next: void 0,
				action: void 0,
				proceed: void 0,
				reset: void 0
			});
			return canNavigateAsync;
		};
		return disabled ? void 0 : history.block({
			blockerFn: blockerFnComposed,
			enableBeforeUnload
		});
	}, [
		shouldBlockFn,
		enableBeforeUnload,
		disabled,
		withResolver,
		history,
		router
	]);
	return resolver;
}
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
function negativeDayRows(rows) {
	return (rows || []).filter((r) => Number(r?.days) < 0).map((r) => ({
		name: String(r.name ?? "").trim(),
		days: Number(r.days)
	}));
}
function negativeDaysNotice(rows) {
	const bad = negativeDayRows(rows);
	if (!bad.length) return "";
	const who = bad.slice(0, 5).map((r) => `${r.name || "（未填姓名）"} ${r.days}`).join("、");
	const more = bad.length > 5 ? ` 等 ${bad.length} 人` : "";
	return `有 ${bad.length} 人的出勤天数是负数（${who}${more}）：负数会算成负工资，而且这条记录不算「有内容」——年度汇总里这个人会整年漏掉。请改成 0 或正数。`;
}
function canSaveMonthDays(rows) {
	return negativeDayRows(rows).length === 0;
}
function monthTotals(rows) {
	const sum = (pick) => round2(rows.reduce((s, r) => s + (pick(r) || 0), 0));
	return {
		people: rows.length,
		days: sum((r) => r.days),
		ot: sum((r) => r.ot),
		meal: sum((r) => r.meal),
		allowance: sum((r) => r.allowance),
		deduction: sum((r) => r.deduction),
		pay: sum((r) => r.pay)
	};
}
function monthPrintTables(rows, months = 12) {
	const out = [];
	for (let month = 1; month <= months; month += 1) {
		const list = [];
		for (const r of rows) {
			const cell = r.months[month - 1];
			if (!cell) continue;
			if (!cell.days && !cell.otHours && !cell.pay) continue;
			list.push({
				name: r.person.name,
				team: r.person.team || "",
				days: cell.days,
				otHours: cell.otHours,
				pay: cell.pay
			});
		}
		if (list.length) out.push({
			month,
			rows: list
		});
	}
	return out;
}
function useUnsavedChanges(dirty, message, enabled = true) {
	const armed = Boolean(dirty && enabled);
	const token = import_react.useMemo(() => ({}), []);
	import_react.useEffect(() => {
		if (!armed) return;
		armUnsaved(token, message);
		return () => clearUnsaved(token);
	}, [
		armed,
		message,
		token
	]);
	useBlocker({
		shouldBlockFn: () => hasUnsavedChanges() && !confirmLeaveUnsaved(),
		enableBeforeUnload: () => hasUnsavedChanges(),
		disabled: !armed
	});
}
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var UNSAVED_MSG = "本月考勤有未保存的修改，离开就会丢失";
function AttendancePage() {
	const store = useApp();
	const { year, people, attendance, saveAttendanceMonth, addYear } = store;
	const [month, setMonth] = import_react.useState(null);
	const existing = attendance.filter((a) => a.year === year && a.month === (month || 0));
	const upcoming = nextYear(derivedYears(store));
	const canEditMonth = useCanSave("attendance.edit");
	const [monthDirty, setMonthDirty] = import_react.useState(false);
	const [monthSheet, setMonthSheet] = import_react.useState({
		rows: [],
		totals: monthTotals([]),
		dirty: false
	});
	useUnsavedChanges(monthDirty, UNSAVED_MSG, canEditMonth);
	const leaveMonth = (action) => {
		if (!confirmLeaveUnsaved()) return;
		action();
	};
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
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadonlyNotice, { perm: "attendance.edit" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink",
								onClick: () => leaveMonth(() => setMonth(null)),
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
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								type: "button",
								disabled: !monthSheet.rows.length,
								onClick: () => window.print(),
								children: "打印月表"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "field-select w-auto",
								value: month,
								onChange: (e) => leaveMonth(() => setMonth(Number(e.target.value))),
								children: Array.from({ length: 12 }, (_, i) => i + 1).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: m,
									children: [m, "月"]
								}, m))
							})]
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
						onDirtyChange: (d) => {
							setMonthDirty(Boolean(d) && canEditMonth);
						},
						onData: setMonthSheet,
						onSave: (rows) => {
							if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
							saveAttendanceMonth(year, month, rows);
							toast.success("本月考勤已保存");
						}
					}, `${year}-${month}-${people.length}`)
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceMonthSheet, {
				year,
				month,
				rows: monthSheet.rows,
				totals: monthSheet.totals,
				dirty: monthSheet.dirty
			})]
		})
	});
}
function YearOverview({ onOpen, onAddYear, upcoming }) {
	const store = useApp();
	const { year, people, attendance, attendanceDocs = [], payments } = store;
	const { rows, filledMonths, offRowsPaid, paid, proxyAmt, proxyCount, pendingAmt, should } = summarizeYear({
		people,
		attendance,
		payments,
		year,
		fallbackYear: fallbackPayYear(store)
	});
	const personRows = rows.map((r) => ({
		p: r.person,
		...r
	}));
	const workRows = personRows.filter((r) => !r.noAttendance);
	const [sumTab, setSumTab] = import_react.useState("pay");
	const [printMode, setPrintMode] = import_react.useState("pay");
	const monthTables = import_react.useMemo(() => monthPrintTables(rows), [rows]);
	const unpaidTotal = round2(should - paid);
	function runPrint(mode) {
		if (mode === "pay") setSumTab("pay");
		setPrintMode(mode);
		setTimeout(() => window.print(), 0);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print space-y-6",
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
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
									perm: "import.use",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceImport, {})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									type: "button",
									disabled: !personRows.length,
									onClick: () => runPrint("pay"),
									children: "打印年度工资汇总"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									type: "button",
									disabled: !monthTables.length,
									onClick: () => runPrint("months"),
									children: "打印全年月表"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
									perm: "settings.year",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							"本年应发 ¥",
							money(should),
							" · 已发 ¥",
							money(paid),
							"（含代发",
							proxyAmt ? ` ¥${money(proxyAmt)}` : "",
							"）",
							pendingAmt ? ` · 待发放 ¥${money(pendingAmt)}` : "",
							" · 未发 ¥",
							money(unpaidTotal),
							"。已发按实际收款人计入（代发不减）； 无日期的待发放记录按当前年份（",
							year,
							"）显示，不计入已发。"
						]
					}),
					offRowsPaid.count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-warn",
						children: [
							"另有 ",
							offRowsPaid.count,
							" 笔 ¥",
							money(offRowsPaid.amount),
							" 发给本年没有考勤记录的人（不列入下表；总览「已发放」含这部分，别对着差额找错账）。"
						]
					}) : null,
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
								children: sumTab === "pay" ? "只列出本年有出勤的人；本年收到「本人收款」却没有考勤记录的，补一行并在备注注明。加班规则没填时加班费按 0。" : "每月工天和加班小时。只显示本年有出勤的人。"
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
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
											className: "p-3",
											children: "备注"
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [personRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 17,
									className: "py-8 text-center text-sm text-muted",
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
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-3 text-xs text-warn",
											children: r.remark
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
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [workRows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 16,
									className: "py-8 text-center text-sm text-muted",
									children: "这一年还没有人出勤。点上面某个月，把实际上班的人加进去。"
								}) }) : null, workRows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
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
			}),
			printMode === "pay" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayrollYearSheet, {
				year,
				rows,
				peopleCount: people.length,
				filledMonths,
				should,
				paid,
				proxyAmt,
				proxyCount,
				pendingAmt,
				unpaidTotal,
				offRows: offRowsPaid
			}) : null,
			printMode === "months" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AttendanceMonthsYearSheet, {
				year,
				tables: monthTables,
				peopleCount: people.length,
				filledMonths
			}) : null
		]
	});
}
function MonthTable({ year, month, people, existing, onDirtyChange, onData, onSave }) {
	const byName = Object.fromEntries(existing.map((a) => [a.name, a]));
	const canEditMonth = useCanSave("attendance.edit");
	const initialRows = existing.filter((a) => a.name.trim()).map((a) => ({
		name: a.name,
		team: a.team || byName[a.name]?.team || "",
		days: a.days ?? 0,
		otHours: a.otHours ?? 0,
		allowance: a.allowance ?? 0,
		deduction: a.deduction ?? 0,
		remark: a.remark ?? ""
	}));
	const [rows, setRows] = import_react.useState(() => initialRows);
	const dirty = JSON.stringify(rows) !== JSON.stringify(initialRows);
	import_react.useEffect(() => {
		onDirtyChange?.(dirty);
	}, [dirty, onDirtyChange]);
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
		if (!name) return;
		if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
		if (!confirm(`从本月考勤里去掉「${name}」？\n\n人员档案和发放记录不动，本月会立即保存。`)) return;
		const keep = rows.filter((_, idx) => idx !== i);
		setRows(keep);
		setSelected((s) => s.filter((n) => n !== name));
		onSave(keep);
		toast.success(`已从本月去掉 ${name}`);
	}
	function removeSelected() {
		if (!selected.length) return;
		if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
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
			teamLabel: r.team || p?.team || "",
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
	const totals = monthTotals(calcRows);
	const missingRule = calcRows.filter((r) => r.known && !r.rule).length;
	const unknown = calcRows.filter((r) => !r.known).length;
	const sheetRows = calcRows.map((r) => ({
		name: r.name,
		team: r.teamLabel,
		days: r.days,
		otHours: r.otHours,
		allowance: r.allowance,
		deduction: r.deduction,
		remark: r.remark,
		wageLabel: r.wageLabel,
		ot: r.ot,
		meal: r.meal,
		pay: r.pay
	}));
	const reportRef = import_react.useRef(onData);
	reportRef.current = onData;
	import_react.useEffect(() => {
		reportRef.current?.({
			rows: sheetRows,
			totals,
			dirty
		});
	}, [rows, dirty]);
	const negativeRows = negativeDayRows(rows);
	const negativeNotice = negativeDaysNotice(rows);
	function patch(i, key, value) {
		if (key === "days" && Number(value) > 31) toast.warning(`${rows[i]?.name || ""} 的出勤天数填了 ${value}，一个月最多 31 天，请核对`);
		if (key === "days" && Number(value) < 0) toast.warning(`${rows[i]?.name || ""} 的出勤天数是负数（${value}）：会算成负工资，也不会被年度汇总算作有内容`);
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
		negativeRows.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-warn",
			children: negativeNotice
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"本月 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "tabular-nums",
								children: totals.people
							}),
							" 人"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"出勤 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "tabular-nums",
								children: totals.days
							}),
							" 天"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["加班费 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
							className: "tabular-nums",
							children: ["¥", money(totals.ot)]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["餐补 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
							className: "tabular-nums",
							children: ["¥", money(totals.meal)]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["补助 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
							className: "tabular-nums",
							children: ["¥", money(totals.allowance)]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["扣款 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
							className: "tabular-nums",
							children: ["¥", money(totals.deduction)]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["应发 ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", {
							className: "tabular-nums",
							children: ["¥", money(totals.pay)]
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
				}),
				dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-warn",
					children: "有未保存的修改"
				}) : null,
				canEditMonth ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						if (!canSaveMonthDays(rows)) {
							toast.error(negativeDaysNotice(rows));
							return;
						}
						onSave(rows);
					},
					children: "保存本月"
				}) : null
			]
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
					className: "py-8 text-center text-sm text-muted",
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
							children: r.teamLabel || "—"
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
	const [uploading, setUploading] = import_react.useState(false);
	const canUpload = useCanSave("attendance.edit");
	const autoName = `考勤-${year}年${month}月`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold",
					children: "本月考勤影像资料"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted",
					children: [
						"可上传多份。自动命名为「",
						autoName,
						"」。文件落在 data/photos/考勤影像。删除、替换前会确认。"
					]
				})] }), canUpload ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilePick, {
					kind: "file",
					compact: true,
					multiple: true,
					disabled: uploading,
					accept: ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls",
					label: uploading ? "上传中…" : "上传影像",
					hint: "点击选择，或把文件拖到这里，可一次多份",
					onFiles: async (files) => {
						if (!files.length || uploading) return;
						if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
						setUploading(true);
						try {
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
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "上传失败，请检查网络后重试");
						} finally {
							setUploading(false);
						}
					}
				}) : null]
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
						readOnly: !canUpload,
						onReplaced: (name) => patch(d.id, { fileName: name }),
						onDeleted: () => remove([d.id])
					})]
				}, d.id))
			})
		]
	});
}
export { AttendancePage as component };
