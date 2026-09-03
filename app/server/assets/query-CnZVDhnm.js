import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-CDZPEZ8n.js";
import { i as money, r as copyText } from "./utils-DPLvt0U2.js";
import { C as parseOtRule, S as monthPay, b as getWageAt, l as overAgeLabel, m as derivedYears, w as wageLabel, x as hasWork } from "./contracts-Ddv2VxfU.js";
import "./excel-CEulLVmE.js";
import { t as useApp } from "./store-U11L9wsl.js";
import "./nas-sync-Cnqpeegh.js";
import { t as createLucideIcon } from "./createLucideIcon-DiDjOefB.js";
import { t as X } from "./x-CnbYULR9.js";
import { a as Check, n as PhotoSlot } from "./photo-slot-BHam5hgU.js";
import { t as Copy } from "./copy-CwPuJKIP.js";
import { n as DocActions } from "./doc-actions-DgdxgwCN.js";
import "./file-pick-BCv2SWUM.js";
import { n as toast } from "./dist-DdkhMw2U.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { n as Need } from "./can-D8LQMuEU.js";
import { t as Badge } from "./badge-Dj5bEQZ9.js";
import { i as ymKey, n as monthsInRange, r as rangeLabel, t as YmPick } from "./ym-pick-Djpt4Mx-.js";
import "./photos-DLiOUttF.js";
var ChevronDown = createLucideIcon("chevron-down", [["path", {
	d: "m6 9 6 6 6-6",
	key: "qrunsl"
}]]);
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function CopyField({ label, value, mono = false }) {
	const text = value == null || value === "" ? "" : String(value);
	const [ok, setOk] = import_react.useState(false);
	function onCopy(e) {
		e.preventDefault();
		e.stopPropagation();
		if (!text) {
			toast.error(`${label}是空的，没有可复制的内容`);
			return;
		}
		if (copyText(text)) {
			setOk(true);
			toast.success(`已复制${label}：${text}`);
			window.setTimeout(() => setOk(false), 1600);
		} else toast.error("复制失败，请长按文字手动选择");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onCopy,
		"aria-label": `复制${label}`,
		title: text ? `复制${label}` : `${label}为空`,
		className: "flex w-full items-start justify-between gap-3 rounded-md border border-line bg-bg-elevated px-3 py-2 text-left hover:border-accent",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs font-medium tracking-wide text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `mt-0.5 break-all text-sm ${mono ? "font-mono tabular-nums" : ""}`,
				children: text || "—"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink",
			children: ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
		})]
	});
}
function buildSlips({ people, names, span, attendance, payments }) {
	return names.map((name) => {
		const p = people.find((x) => x.name === name);
		if (!p) return null;
		const months = [];
		for (const { year, month } of span) {
			const a = attendance.find((x) => x.year === year && x.month === month && x.name === name);
			if (!hasWork(a)) continue;
			const calc = monthPay(a, getWageAt(p, year, month));
			months.push({
				year,
				month,
				days: calc.days,
				base: calc.base,
				otHours: calc.otHours,
				ot: calc.ot,
				allowance: calc.allowance,
				deduction: calc.deduction,
				pay: calc.pay,
				remark: a?.remark || ""
			});
		}
		const pays = payments.filter((x) => x.owner === name && x.date).slice().sort((a, b) => a.date.localeCompare(b.date)).map((x) => ({
			date: x.date,
			amount: x.amount || 0,
			receiver: x.receiver || x.owner,
			source: x.source || "",
			remark: x.remark || ""
		}));
		if (!months.length && !pays.length) return null;
		return {
			person: p,
			months,
			total: months.reduce((s, m) => s + m.pay, 0),
			pays,
			paid: pays.reduce((s, x) => s + x.amount, 0)
		};
	}).filter(Boolean);
}
function groupSlips(slips, showPays) {
	const groups = [];
	const isBig = (s) => {
		return s.months.length + (showPays ? s.pays.length : 0) > 8;
	};
	let i = 0;
	while (i < slips.length) {
		const first = slips[i];
		if (isBig(first) || i + 1 >= slips.length) {
			groups.push([first]);
			i += 1;
		} else {
			const second = slips[i + 1];
			if (isBig(second)) {
				groups.push([first]);
				i += 1;
			} else {
				groups.push([first, second]);
				i += 2;
			}
		}
	}
	return groups;
}
function PayslipSheets({ slips, rangeLabel: label, showPays }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only text-black",
		children: import_react.useMemo(() => groupSlips(slips, showPays), [slips, showPays]).map((group, gi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "payslip-page",
			children: group.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "payslip border border-black p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "border-b border-black pb-2 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-semibold tracking-widest",
							children: "台账 · 工资条"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-sm",
							children: label
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["姓名：", s.person.name] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["班组：", s.person.team || "—"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["工资：", wageLabel(s.person)] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["加班：", parseOtRule(s.person.otRule).label || "—"] })
						]
					}),
					s.months.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "mt-3 w-full border-collapse text-center text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
							"年月",
							"出勤",
							"底薪",
							"加班小时",
							"加班费",
							"补助",
							"扣款",
							"应发",
							"备注"
						].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "border border-black px-1 py-1 font-medium",
							children: h
						}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [s.months.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "border border-black px-1 py-1",
								children: [
									m.year,
									"年",
									m.month,
									"月"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: m.days
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(m.base)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: m.otHours || ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: m.ot ? money(m.ot) : ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: m.allowance ? money(m.allowance) : ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: m.deduction ? money(m.deduction) : ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 font-medium",
								children: money(m.pay)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 text-left",
								children: m.remark
							})
						] }, `${m.year}-${m.month}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 font-medium",
								children: "合计"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: s.months.reduce((n, m) => n + m.days, 0)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.months.reduce((n, m) => n + m.base, 0))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: s.months.reduce((n, m) => n + m.otHours, 0) || ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.months.reduce((n, m) => n + m.ot, 0))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.months.reduce((n, m) => n + m.allowance, 0))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.months.reduce((n, m) => n + m.deduction, 0))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1 font-semibold",
								children: money(s.total)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: "border border-black px-1 py-1" })
						] })] })]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs",
						children: "本区间无出勤记录。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs",
						children: [
							s.person.payType === "month" ? "按月：当月有出勤发月工资 + 加班费 + 补助 − 扣款。" : "按工天：应发 = 出勤×日工资 + 加班费 + 补助 − 扣款。",
							"本区间应发合计 ¥",
							money(s.total),
							"。"
						]
					}),
					showPays ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: "打款记录"
						}), s.pays.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "mt-1 w-full border-collapse text-center text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: [
								"日期",
								"金额",
								"收款人",
								"来源",
								"备注"
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "border border-black px-1 py-1 font-medium",
								children: h
							}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [s.pays.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1",
									children: x.date
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1",
									children: money(x.amount)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1",
									children: x.receiver === s.person.name ? "本人" : `${x.receiver}代收`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1",
									children: x.source
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1 text-left",
									children: x.remark
								})
							] }, `${x.date}-${i}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1 font-medium",
									children: "已打款合计"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "border border-black px-1 py-1 font-semibold",
									children: money(s.paid)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "border border-black px-1 py-1",
									colSpan: 3,
									children: ["未打款 ¥", money(s.total - s.paid)]
								})
							] })] })]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs",
							children: ["本区间无打款记录。已打款 ¥0 · 未打款 ¥", money(s.total)]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-2 gap-8 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "领款人签字：________________" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "日期：______年____月____日" })]
					})
				]
			}, s.person.id))
		}, gi))
	});
}
function QueryPage() {
	const store = useApp();
	const { year, people, attendance, attendanceDocs, payments, patchAttendanceDoc, removeAttendanceDocs } = store;
	const years = derivedYears(store);
	const yearOpts = years.length ? years : [year];
	const [name, setName] = import_react.useState("");
	const [printNames, setPrintNames] = import_react.useState([]);
	const [printPays, setPrintPays] = import_react.useState(true);
	const [showPicker, setShowPicker] = import_react.useState(false);
	const [fromY, setFromY] = import_react.useState(year);
	const [fromM, setFromM] = import_react.useState(1);
	const [fromD, setFromD] = import_react.useState(1);
	const [toY, setToY] = import_react.useState(year);
	const [toM, setToM] = import_react.useState(12);
	const [toD, setToD] = import_react.useState(31);
	const p = people.find((x) => x.name === name);
	const span = import_react.useMemo(() => monthsInRange(fromY, fromM, toY, toM), [
		fromY,
		fromM,
		toY,
		toM
	]);
	const swapped = ymKey(fromY, fromM) > ymKey(toY, toM);
	const startDate = import_react.useMemo(() => {
		const d = new Date(fromY, fromM - 1, fromD);
		return isNaN(d.getTime()) ? new Date(fromY, fromM - 1, 1) : d;
	}, [
		fromY,
		fromM,
		fromD
	]);
	const endDate = import_react.useMemo(() => {
		const d = new Date(toY, toM - 1, toD);
		return isNaN(d.getTime()) ? new Date(toY, toM - 1, 28) : d;
	}, [
		toY,
		toM,
		toD
	]);
	const rows = span.map(({ year: y, month: m }) => {
		const a = attendance.find((x) => x.year === y && x.month === m && x.name === name);
		const calc = monthPay(a, getWageAt(p, y, m));
		return {
			year: y,
			month: m,
			days: calc.days,
			otHours: calc.otHours,
			allowance: calc.allowance,
			deduction: calc.deduction,
			ot: calc.ot,
			pay: calc.pay,
			remark: a?.remark || ""
		};
	});
	const should = rows.reduce((s, r) => s + r.pay, 0);
	span[0];
	span[span.length - 1];
	const pays = payments.filter((x) => {
		if (x.owner !== name && x.receiver !== name) return false;
		const d = x.date ? new Date(x.date) : null;
		if (!d || isNaN(d.getTime())) return false;
		return d >= startDate && d <= endDate;
	});
	const paidAsOwner = pays.filter((x) => x.owner === name).reduce((s, x) => s + x.amount, 0);
	const rangeLabelText = rangeLabel(fromY, fromM, toY, toM);
	const slips = import_react.useMemo(() => buildSlips({
		people,
		names: printNames,
		span,
		attendance,
		payments
	}), [
		people,
		printNames,
		span,
		attendance,
		payments
	]);
	const teams = [...new Set(people.map((x) => x.team).filter(Boolean))];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "query.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex flex-wrap items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-2xl font-semibold",
							children: "个人查询"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "按月份区间查。查单月就把起止设成同一个月，例如 7月到7月。"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									list: "query-people-list",
									className: "field-select w-auto min-w-[8rem]",
									value: name,
									placeholder: "输入或选择姓名",
									onChange: (e) => setName(e.target.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
									id: "query-people-list",
									children: people.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: x.name }, x.id))
								}),
								name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "size-9",
									type: "button",
									onClick: () => setName(""),
									"aria-label": "清空",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
								}) : null
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YmPick, {
								label: "从",
								years: yearOpts,
								y: fromY,
								m: fromM,
								d: fromD,
								onY: setFromY,
								onM: setFromM,
								onD: setFromD
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "pb-2 text-sm text-muted",
								children: "到"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YmPick, {
								label: "到",
								years: yearOpts,
								y: toY,
								m: toM,
								d: toD,
								onY: setToY,
								onM: setToM,
								onD: setToD
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "w-full text-xs text-muted",
								children: [
									"当前查询：",
									rangeLabelText,
									swapped ? "（起止已自动对调）" : "",
									" · 共 ",
									span.length,
									" 个月 · ",
									fromD,
									"日 至 ",
									toD,
									"日"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-xl border border-line bg-surface p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: "打印工资条"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted",
								children: [
									"按上面查的 ",
									rangeLabelText,
									" 生成，每人一张。可勾选是否附带打款记录。"
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										type: "button",
										onClick: () => setShowPicker((v) => !v),
										children: [
											"选择人员",
											printNames.length ? `（已选 ${printNames.length}）` : "",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-3.5 transition-transform ${showPicker ? "rotate-180" : ""}` })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "inline-flex items-center gap-1.5 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "size-4",
											checked: printPays,
											onChange: (e) => setPrintPays(e.target.checked)
										}), " 打印打款记录"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										size: "sm",
										type: "button",
										onClick: () => {
											if (!printNames.length) {
												toast.error("先勾选要打印的人");
												return;
											}
											if (!slips.length) {
												toast.error("所选人在该区间没有出勤或打款，没有工资条");
												return;
											}
											window.print();
										},
										children: [
											"打印 ",
											slips.length,
											" 张"
										]
									})
								]
							})]
						}), showPicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-lg border border-line bg-bg-elevated p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										type: "button",
										onClick: () => setPrintNames(people.map((x) => x.name)),
										children: "全选"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										type: "button",
										onClick: () => setPrintNames([]),
										children: "清空"
									}),
									teams.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										type: "button",
										onClick: () => setPrintNames(people.filter((x) => x.team === t).map((x) => x.name)),
										children: t
									}, t))
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm",
								children: people.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "inline-flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										className: "size-4",
										checked: printNames.includes(x.name),
										onChange: (e) => setPrintNames((s) => e.target.checked ? [...new Set([...s, x.name])] : s.filter((n) => n !== x.name))
									}), x.name]
								}, x.id))
							})]
						}) : null]
					}),
					p ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl font-semibold",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: p.team }),
								overAgeLabel(p.age, p.gender) === "超龄" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "warn",
									children: "超龄"
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 md:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "身份证号",
									value: p.idCard,
									mono: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "身份证签发机关",
									value: p.idIssuer
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "身份证有效期开始",
									value: p.idValidFrom
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "身份证有效期结束",
									value: p.idValidTo
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "联系电话",
									value: p.phone,
									mono: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "开户行",
									value: p.bank
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "银行卡号",
									value: p.cardNo,
									mono: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "户籍地址",
									value: p.address
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "IC卡号",
									value: p.personNo,
									mono: true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "计薪方式",
									value: p.payType === "month" ? "按月" : "按工天"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "工资",
									value: wageLabel(p)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyField, {
									label: "加班规则",
									value: parseOtRule(p.otRule).label
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 md:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
									name: p.name,
									kind: "id"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
									name: p.name,
									kind: "bank"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
									name: p.name,
									kind: "ic"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-line bg-surface p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-sm font-semibold",
									children: [rangeLabelText, " 考勤"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
											className: "text-xs text-muted",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "py-2",
													children: "年月"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "出勤" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "加班小时" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "补助" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "扣款" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "加班费" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "应发" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "备注" })
											] })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-t border-line",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "py-2",
													children: [
														r.year,
														"年",
														r.month,
														"月"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: r.days || "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: r.otHours || "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: r.allowance ? `¥${money(r.allowance)}` : "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: r.deduction ? `¥${money(r.deduction)}` : "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: r.ot ? `¥${money(r.ot)}` : "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: r.pay ? `¥${money(r.pay)}` : "—"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "text-muted",
													children: r.remark
												})
											]
										}, `${r.year}-${r.month}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-t border-line font-medium",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "py-2",
													children: "合计"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: rows.reduce((s, r) => s + r.days, 0)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "tabular-nums",
													children: rows.reduce((s, r) => s + r.otHours, 0)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "tabular-nums",
													children: ["¥", money(rows.reduce((s, r) => s + r.allowance, 0))]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "tabular-nums",
													children: ["¥", money(rows.reduce((s, r) => s + r.deduction, 0))]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "tabular-nums",
													children: ["¥", money(rows.reduce((s, r) => s + r.ot, 0))]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "tabular-nums",
													children: ["¥", money(should)]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {})
											]
										})] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-sm",
									children: [
										"应发合计 ¥",
										money(should),
										" · 已记入实际收款人 ¥",
										money(paidAsOwner),
										" · 差额 ¥",
										money(should - paidAsOwner)
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-line bg-surface p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-sm font-semibold",
								children: [rangeLabelText, " 相关发放"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-3 space-y-2 text-sm",
								children: [pays.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-muted",
									children: "该区间暂无"
								}) : null, pays.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex flex-wrap justify-between gap-2 border-b border-line pb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										x.date,
										" · 实际收款人 ",
										x.owner,
										x.receiver !== x.owner ? ` · ${x.receiver}代收` : " · 本人收",
										x.source ? ` · ${x.source}` : ""
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "tabular-nums",
										children: ["¥", money(x.amount)]
									})]
								}, x.id))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-line bg-surface p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-sm font-semibold",
									children: [rangeLabelText, " 考勤影像资料"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-muted",
									children: "月份上的现场考勤表/文件，可查看、下载、复制、替换、删除。"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-3 space-y-2",
									children: [(attendanceDocs || []).filter((d) => span.some((x) => x.year === d.year && x.month === d.month)).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											d.year,
											"年",
											d.month,
											"月 · ",
											d.fileName,
											d.remark ? ` · ${d.remark}` : ""
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocActions, {
											id: d.id,
											kind: "attendance",
											fileName: d.fileName,
											suggest: `考勤-${d.year}年${d.month}月`,
											taken: (attendanceDocs || []).map((x) => x.fileName),
											onReplaced: (name$1) => patchAttendanceDoc(d.id, { fileName: name$1 }),
											onDeleted: () => removeAttendanceDocs([d.id])
										})]
									}, d.id)), (attendanceDocs || []).filter((d) => span.some((x) => x.year === d.year && x.month === d.month)).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "text-muted",
										children: "该区间没有考勤影像。到「月度考勤」里上传。"
									}) : null]
								})
							]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "暂无人员"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayslipSheets, {
				slips,
				rangeLabel: rangeLabelText,
				showPays: printPays
			})]
		})
	});
}
export { QueryPage as component };
