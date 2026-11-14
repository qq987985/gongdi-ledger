import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { u as permLabel } from "./perms-VCrRIaso.js";
import { a as money, r as copyText } from "./utils-DqsA5Dz5.js";
import { a as round2, b as hasContent, d as derivedYears, g as parseDateYmd, i as parseOtRule, n as getWageAt, o as wageLabel, r as monthPay, u as daysInMonth, v as ymKey, y as ymd } from "./wage-D-bTg5Yy.js";
import { g as receiverOf, h as ownerKey, m as nameKey, p as isProxyReceiver, u as overAgeLabel, x as sumQuantity } from "./contracts-Ibl_Yvgh.js";
import { n as useApp } from "./store-CioKNrWY.js";
import { v as toast } from "./audit-diff-CNCK6-Uk.js";
import { t as createLucideIcon } from "./createLucideIcon-C8gAEEmk.js";
import { a as Check, n as PhotoSlot } from "./photo-slot-Dx9nbaH6.js";
import { r as Copy, t as X } from "./x-l1bDvsYR.js";
import { n as DocActions } from "./doc-actions-_HUrzTDK.js";
import "./file-pick-C7mO9xHH.js";
import { t as Button } from "./button-GV790FWO.js";
import { a as useCanSave, i as useCan, n as Need, s as blockedWrite } from "./can-i_6nnWve.js";
import { t as Badge } from "./badge-BNUZf0BR.js";
import { a as QUERY_PERSON_WAGE_COLS, i as QUERY_PERSON_ATTENDANCE_COLS, o as QUERY_TEAM_ATTENDANCE_COLS, s as QUERY_TEAM_WAGE_COLS } from "./print-cols-D1zio1mt.js";
import { i as inBucket, r as groupBuckets } from "./buckets-DVNckTqM.js";
import { a as isPaidSelf, i as isPaid } from "./payments-stats-XjF2gZYj.js";
import { r as rangeLabel, t as YmPick } from "./ym-pick-B5SfA9Uu.js";
import "./photos-BWzYphOb.js";
var ChevronDown = createLucideIcon("chevron-down", [["path", {
	d: "m6 9 6 6 6-6",
	key: "qrunsl"
}]]);
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function QueryMonthTable({ month, content, teamLabel, print = false, onPerson }) {
	const wage = content === "wage";
	const widths = wage ? QUERY_PERSON_WAGE_COLS : QUERY_TEAM_ATTENDANCE_COLS;
	const cell = print ? "border border-black px-1 py-1" : "";
	const number = `${cell} tabular-nums query-number`;
	const totals = month.totals;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		"data-query-month": `${month.year}-${String(month.month).padStart(2, "0")}`,
		className: print ? "w-full table-fixed border-collapse text-sm" : "fit-table query-results-table text-left text-sm",
		children: [
			print ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: widths.map((width, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: `${width}%` } }, index)) }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				colSpan: wage ? 8 : 4,
				className: `${cell} text-left`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-semibold",
					children: [
						teamLabel,
						" · ",
						month.year,
						"年",
						month.month,
						"月",
						wage ? "工资" : "考勤",
						"汇总"
					]
				})
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: print ? "" : "text-xs text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: cell,
						children: "姓名"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: cell,
						children: "出勤天数"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: cell,
						children: "加班小时"
					}),
					wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: cell,
							children: "补助"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: cell,
							children: "扣款"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: cell,
							children: "加班费"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: cell,
							children: "应发"
						})
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: cell,
						children: "备注"
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: month.rows.map(({ person, ambiguous, month: row }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: print ? "" : "border-t border-line",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: cell,
						children: onPerson ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							type: "button",
							onClick: () => onPerson(person.id),
							children: person.name
						}) : person.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: number,
						children: ambiguous ? "—" : row.days
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: number,
						children: ambiguous ? "—" : row.otHours
					}),
					wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: ambiguous ? "—" : money(row.allowance)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: ambiguous ? "—" : money(row.deduction)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: ambiguous ? "—" : money(row.ot)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: ambiguous ? "—" : money(row.pay)
						})
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: cell,
						children: ambiguous ? "姓名重复，历史记录待核对" : row.remark
					})
				]
			}, person.id)) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: print ? "font-medium" : "border-t border-line font-medium",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: cell,
						children: "本月小计"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: number,
						children: totals.days
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: number,
						children: totals.otHours
					}),
					wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: money(totals.allowance)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: money(totals.deduction)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: money(totals.ot)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: number,
							children: money(totals.pay)
						})
					] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: cell })
				]
			}) })
		]
	});
}
function PersonQueryResults({ result, label, content }) {
	const wage = content === "wage";
	if (result.ambiguous) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-xl border border-line bg-surface p-4 text-sm text-muted",
		children: "人员档案存在同名，历史记录按姓名关联，无法可靠区分。请先核对人员档案及历史记录。"
	});
	const { months, totals } = result;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "text-sm font-semibold",
				children: [
					label,
					wage ? "工资" : "考勤",
					"汇总"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 overflow-x-auto",
				tabIndex: 0,
				role: "region",
				"aria-label": "个人查询汇总",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "fit-table query-results-table text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-xs text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2",
								children: "年月"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "出勤天数" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "加班小时" }),
							wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "补助" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "扣款" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "加班费" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "应发" })
							] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "备注" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [months.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-2 whitespace-nowrap",
								children: [
									row.year,
									"年",
									row.month,
									"月"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: row.days || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: row.otHours || "—"
							}),
							wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "tabular-nums",
									children: row.allowance ? `¥${money(row.allowance)}` : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "tabular-nums",
									children: row.deduction ? `¥${money(row.deduction)}` : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "tabular-nums",
									children: row.ot ? `¥${money(row.ot)}` : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "tabular-nums",
									children: row.pay ? `¥${money(row.pay)}` : "—"
								})
							] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-muted",
								children: row.remark
							})
						]
					}, `${row.year}-${row.month}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line font-medium",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2",
								children: "合计"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: totals.days
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: totals.otHours
							}),
							wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "tabular-nums",
									children: ["¥", money(totals.allowance)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "tabular-nums",
									children: ["¥", money(totals.deduction)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "tabular-nums",
									children: ["¥", money(totals.ot)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "tabular-nums",
									children: ["¥", money(totals.pay)]
								})
							] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {})
						]
					})] })]
				})
			}),
			!months.some((month) => month.hasContent) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "该区间没有考勤记录。"
			}) : null,
			wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm",
				children: [
					"应发合计 ¥",
					money(totals.pay),
					" · 已记入实际收款人 ¥",
					money(result.paidAsOwner),
					"（含代发） · 差额 ¥",
					money(result.difference)
				]
			}) : null
		]
	});
}
function TeamQueryResults({ summary, label, teamLabel, content, onPerson }) {
	const wage = content === "wage";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-display text-xl font-semibold",
				children: [
					teamLabel,
					" · ",
					wage ? "工资" : "考勤"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-muted",
				children: [
					label,
					" · 当前人员档案中的 ",
					summary.members.length,
					" 人。先看各月汇总和本月小计，最后看所选月份合计；点击姓名查看个人汇总。"
				]
			}),
			summary.ambiguousCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-warn",
				children: [
					"其中 ",
					summary.ambiguousCount,
					" 人存在同名，历史记录无法可靠区分，未计入合计；请先核对人员档案及历史记录。"
				]
			}) : null,
			summary.members.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-semibold",
					children: "各月汇总"
				}), summary.months.map((month) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-lg border border-line",
					tabIndex: 0,
					role: "region",
					"aria-label": `${month.year}年${month.month}月班组汇总`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryMonthTable, {
						month,
						content,
						teamLabel,
						onPerson
					})
				}, `${month.year}-${month.month}`))]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "mt-5 font-semibold",
				children: [
					teamLabel,
					" · ",
					label,
					wage ? "工资" : "考勤",
					"汇总"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 overflow-x-auto",
				tabIndex: 0,
				role: "region",
				"aria-label": "班组查询汇总",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "fit-table query-results-table text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-xs text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2",
								children: "姓名"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "出勤天数" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "加班小时" }),
							wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "应发" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "已记入实际收款人（含代发）" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "差额" })
							] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "备注" })
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [summary.members.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									type: "button",
									onClick: () => onPerson(row.person.id),
									children: row.person.name
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: row.ambiguous ? "—" : row.totals.days
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: row.ambiguous ? "—" : row.totals.otHours
							}),
							wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "tabular-nums",
									children: row.ambiguous ? "—" : `¥${money(row.totals.pay)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "tabular-nums",
									children: row.ambiguous ? "—" : `¥${money(row.paidAsOwner)}`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "tabular-nums",
									children: row.ambiguous ? "—" : `¥${money(row.difference)}`
								})
							] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "text-muted",
								children: row.ambiguous ? "姓名重复，历史记录待核对" : row.remark
							})
						]
					}, row.person.id)), summary.members.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-line font-medium",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2",
								children: "区间合计"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: summary.totals.days
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular-nums",
								children: summary.totals.otHours
							}),
							wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "tabular-nums",
									children: ["¥", money(summary.totals.pay)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "tabular-nums",
									children: ["¥", money(summary.paidAsOwner)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "tabular-nums",
									children: ["¥", money(summary.difference)]
								})
							] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: wage ? 7 : 4,
						className: "py-6 text-muted",
						children: "该班组暂无人员。"
					}) })] })]
				})
			})
		]
	});
}
var TD = "border border-black px-1 py-1";
function QuerySheet({ content, label, paymentLabel, person, team, teamLabel }) {
	const wage = content === "wage";
	if ((!person || person.ambiguous) && !team) return null;
	if (team && !team.members.length) return null;
	const widths = team ? wage ? QUERY_TEAM_WAGE_COLS : QUERY_TEAM_ATTENDANCE_COLS : wage ? QUERY_PERSON_WAGE_COLS : QUERY_PERSON_ATTENDANCE_COLS;
	const columns = team ? wage ? 7 : 4 : wage ? 8 : 4;
	const totals = team?.totals || person.totals;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "print-only text-black",
		children: [team ? team.months.map((month) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
			className: "query-result-sheet print-doc mb-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryMonthTable, {
				month,
				content,
				teamLabel,
				print: true
			})
		}, `${month.year}-${month.month}`)) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
			className: "query-result-sheet print-doc",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full table-fixed border-collapse text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: widths.map((width, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: `${width}%` } }, index)) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
						className: `${TD} text-left`,
						colSpan: columns,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-base font-semibold",
								children: [
									team ? teamLabel : person.person.name,
									" · ",
									label,
									wage ? "工资" : "考勤",
									"汇总"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 font-normal",
								children: [
									"考勤：",
									label,
									"（按整月统计）",
									wage ? `；发放：${paymentLabel}（含起止当日）` : ""
								]
							}),
							team ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-normal",
								children: [
									"按当前人员档案班组，共 ",
									team.members.length,
									" 人。",
									team.ambiguousCount ? `其中 ${team.ambiguousCount} 人姓名重复，未计入合计，历史记录待核对。` : ""
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-normal",
								children: ["班组：", person.person.team?.trim() || "未分班组"]
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: TD,
							children: team ? "姓名" : "年月"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: TD,
							children: "出勤天数"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: TD,
							children: "加班小时"
						}),
						wage ? team ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TD,
								children: "应发"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TD,
								children: "已记入实际收款人（含代发）"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TD,
								children: "差额"
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TD,
								children: "补助"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TD,
								children: "扣款"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TD,
								children: "加班费"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TD,
								children: "应发"
							})
						] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: TD,
							children: "备注"
						})
					] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: team ? team.members.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: TD,
							children: row.person.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `${TD} query-number`,
							children: row.ambiguous ? "—" : row.totals.days
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `${TD} query-number`,
							children: row.ambiguous ? "—" : row.totals.otHours
						}),
						wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: row.ambiguous ? "—" : money(row.totals.pay)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: row.ambiguous ? "—" : money(row.paidAsOwner)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: row.ambiguous ? "—" : money(row.difference)
							})
						] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: TD,
							children: row.ambiguous ? "姓名重复，历史记录待核对" : row.remark
						})
					] }, row.person.id)) : person.months.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: TD,
							children: [
								row.year,
								"年",
								row.month,
								"月"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `${TD} query-number`,
							children: row.days
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: `${TD} query-number`,
							children: row.otHours
						}),
						wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: money(row.allowance)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: money(row.deduction)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: money(row.ot)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: money(row.pay)
							})
						] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: TD,
							children: row.remark
						})
					] }, `${row.year}-${row.month}`)) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tfoot", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "font-medium",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: "区间合计"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: totals.days
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} query-number`,
								children: totals.otHours
							}),
							wage ? team ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `${TD} query-number`,
									children: money(totals.pay)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `${TD} query-number`,
									children: money(team.paidAsOwner)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `${TD} query-number`,
									children: money(team.difference)
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `${TD} query-number`,
									children: money(totals.allowance)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `${TD} query-number`,
									children: money(totals.deduction)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `${TD} query-number`,
									children: money(totals.ot)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `${TD} query-number`,
									children: money(totals.pay)
								})
							] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: TD })
						]
					}), wage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: TD,
						colSpan: columns,
						children: [
							"已记入实际收款人 ¥",
							money(team?.paidAsOwner ?? person.paidAsOwner),
							"（含代发）；差额 ¥",
							money(team?.difference ?? person.difference),
							"。应发按整月考勤计算，发放按所选日期区间计算。"
						]
					}) }) : null] })
				]
			})
		})]
	});
}
function queryRange(from, to) {
	const dateOf = (v) => ymd(v.year, v.month, Math.min(v.day, daysInMonth(v.year, v.month)));
	const a = dateOf(from);
	const b = dateOf(to);
	if (!a || !b) return {
		span: [],
		startDate: "",
		endDate: "",
		swapped: false
	};
	const swapped = a > b;
	const startDate = swapped ? b : a;
	const endDate = swapped ? a : b;
	const lo = swapped ? to : from;
	const hi = swapped ? from : to;
	const span = [];
	for (let key = ymKey(lo.year, lo.month); key <= ymKey(hi.year, hi.month); key++) span.push({
		year: Math.floor((key - 1) / 12),
		month: (key - 1) % 12 + 1
	});
	return {
		span,
		startDate,
		endDate,
		swapped
	};
}
var emptyTotals = () => ({
	days: 0,
	otHours: 0,
	base: 0,
	ot: 0,
	meal: 0,
	allowance: 0,
	deduction: 0,
	pay: 0
});
function sumTotals(rows) {
	const out = rows.reduce((sum, row) => {
		for (const field of Object.keys(sum)) sum[field] += row[field];
		return sum;
	}, emptyTotals());
	out.days = sumQuantity(rows.map((row) => row.days));
	out.otHours = sumQuantity(rows.map((row) => row.otHours));
	for (const field of [
		"base",
		"ot",
		"meal",
		"allowance",
		"deduction",
		"pay"
	]) out[field] = round2(out[field]);
	return out;
}
var sumPayments = (rows) => round2(rows.reduce((sum, row) => sum + (row.amount || 0), 0));
function buildQueryResults(args) {
	const { people, attendance, payments, range } = args;
	const counts = /* @__PURE__ */ new Map();
	for (const person of people) counts.set(nameKey(person.name), (counts.get(nameKey(person.name)) || 0) + 1);
	const monthKeys = new Set(range.span.map(({ year, month }) => ymKey(year, month)));
	const attendanceByName = /* @__PURE__ */ new Map();
	for (const row of attendance) {
		if (!monthKeys.has(ymKey(row.year, row.month))) continue;
		const key = nameKey(row.name);
		const mine = attendanceByName.get(key) || [];
		mine.push(row);
		attendanceByName.set(key, mine);
	}
	const datedPayments = payments.flatMap((row) => {
		const date = parseDateYmd(row.date);
		if (!isPaid(row) || !date || date < range.startDate || date > range.endDate) return [];
		return [{
			...row,
			date
		}];
	}).sort((a, b) => a.date.localeCompare(b.date));
	const paymentsByName = /* @__PURE__ */ new Map();
	for (const row of datedPayments) for (const key of new Set([ownerKey(row), receiverOf(row)])) {
		const mine = paymentsByName.get(key) || [];
		mine.push(row);
		paymentsByName.set(key, mine);
	}
	return people.map((person) => {
		const key = nameKey(person.name);
		const ambiguous = !key || (counts.get(key) || 0) > 1;
		const mine = ambiguous ? [] : attendanceByName.get(key) || [];
		const months = ambiguous ? [] : range.span.map(({ year, month }) => {
			const rows = mine.filter((row) => row.year === year && row.month === month);
			const wage = getWageAt(person, year, month);
			return {
				year,
				month,
				...sumTotals(rows.map((row) => monthPay(row, wage))),
				remark: rows.map((row) => row.remark || "").filter((remark) => remark.trim()).join("；"),
				hasContent: rows.some((a) => hasContent(a))
			};
		});
		const pays = ambiguous ? [] : paymentsByName.get(key) || [];
		const totals = sumTotals(months);
		const ownerPays = pays.filter((row) => ownerKey(row) === key);
		const paidAsOwner = sumPayments(ownerPays);
		return {
			person,
			ambiguous,
			months,
			totals,
			pays,
			paidAsOwner,
			difference: round2(totals.pay - paidAsOwner),
			paidSelf: sumPayments(ownerPays.filter(isPaidSelf)),
			collected: sumPayments(pays.filter((row) => ownerKey(row) !== key)),
			proxyOut: sumPayments(ownerPays.filter((row) => !isPaidSelf(row))),
			remark: months.filter((row) => row.remark).map((row) => `${row.year}年${row.month}月：${row.remark}`).join("；")
		};
	});
}
function queryTeamResults(results, team, span = results.find((row) => row.months.length)?.months || []) {
	const members = results.filter((row) => inBucket(row.person.team, team));
	const totals = sumTotals(members.map((row) => row.totals));
	const paidAsOwner = round2(members.reduce((sum, row) => sum + row.paidAsOwner, 0));
	return {
		members,
		months: span.map(({ year, month }) => {
			const rows = members.map((row) => ({
				person: row.person,
				ambiguous: row.ambiguous,
				month: row.months.find((item) => item.year === year && item.month === month) || {
					year,
					month,
					...emptyTotals(),
					remark: "",
					hasContent: false
				}
			}));
			return {
				year,
				month,
				rows,
				totals: sumTotals(rows.map((row) => row.month))
			};
		}),
		totals,
		paidAsOwner,
		difference: round2(totals.pay - paidAsOwner),
		ambiguousCount: members.filter((row) => row.ambiguous).length
	};
}
function queryPrintResults(results, ids, team) {
	const selected = new Set(ids);
	return results.filter((row) => selected.has(row.person.id) && !row.ambiguous && (team === void 0 || inBucket(row.person.team, team)));
}
function buildQuerySlips(results) {
	return results.flatMap((row) => {
		const months = row.months.filter((month) => month.hasContent);
		if (row.ambiguous || !months.length && !row.pays.length) return [];
		return [{
			person: row.person,
			hasHistory: (row.person.wageHistory || []).some((history) => (history.fromDate || "").trim() !== ""),
			months,
			totals: row.totals,
			total: row.totals.pay,
			pays: row.pays,
			paid: row.paidSelf,
			unpaidSelf: round2(row.totals.pay - row.paidSelf),
			collected: row.collected,
			proxyOut: row.proxyOut
		}];
	});
}
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
function groupSlips(slips, showMonths, showPays) {
	const groups = [];
	const isBig = (s) => {
		return (showMonths ? s.months.length : 0) + (showPays ? s.pays.length : 0) > 8;
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
function PayslipSheets({ slips, rangeLabel: label, printMode }) {
	const showMonths = printMode !== "pays";
	const showPays = printMode !== "wage";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only text-black",
		children: import_react.useMemo(() => groupSlips(slips, showMonths, showPays), [
			slips,
			showMonths,
			showPays
		]).map((group, gi) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "payslip-page",
			children: group.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "payslip border border-black p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "border-b border-black pb-2 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-semibold tracking-widest",
							children: printMode === "pays" ? "台账 · 打款记录" : "台账 · 工资条"
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
							printMode === "pays" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["工资：", s.hasHistory ? "按各月生效工资（见明细）" : wageLabel(s.person)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["加班：", parseOtRule(s.person.otRule).label || "—"] })] })
						]
					}),
					showMonths ? s.months.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
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
								children: s.totals.days
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.totals.base)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: s.totals.otHours || ""
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.totals.ot)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.totals.allowance)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "border border-black px-1 py-1",
								children: money(s.totals.deduction)
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
					}) : null,
					showMonths ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs",
						children: [
							s.person.payType === "month" ? "按月：当月有出勤发月工资 + 加班费 + 补助 − 扣款。" : "按工天：应发 = 出勤×日工资 + 加班费 + 补助 − 扣款。",
							"本区间应发合计 ¥",
							money(s.total),
							"。"
						]
					}) : null,
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
							}, h)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
								s.pays.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
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
										children: receiverOf(x) === nameKey(s.person.name) ? "本人" : `${receiverOf(x)}代收`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border border-black px-1 py-1",
										children: x.source
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border border-black px-1 py-1 text-left",
										children: x.remark
									})
								] }, `${x.date}-${i}`)),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border border-black px-1 py-1 font-medium",
										children: "已打款合计（本人）"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border border-black px-1 py-1 font-semibold",
										children: money(s.paid)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "border border-black px-1 py-1",
										colSpan: 3,
										children: showMonths ? `未打款 ¥${money(s.unpaidSelf)}` : ""
									})
								] }),
								s.collected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "border border-black px-1 py-1",
									colSpan: 5,
									children: [
										"另代收他人 ¥",
										money(s.collected),
										"，不计入本人应发、也不算本人已打款。"
									]
								}) }) : null,
								s.proxyOut ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "border border-black px-1 py-1",
									colSpan: 5,
									children: [
										"其中本人名下 ¥",
										money(s.proxyOut),
										" 由他人代领（收款人非本人），按口径不算本人已打款，单列。"
									]
								}) }) : null
							] })]
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
	const canEditPhotos = useCanSave("photos.edit");
	const canEditDocs = useCanSave("attendance.edit");
	const canPrint = useCan("query.print");
	const [scope, setScope] = import_react.useState("person");
	const [content, setContent] = import_react.useState("attendance");
	const [team, setTeam] = import_react.useState("");
	const [name, setName] = import_react.useState("");
	const [selectedId, setSelectedId] = import_react.useState("");
	const [printIds, setPrintIds] = import_react.useState([]);
	const [printMode, setPrintMode] = import_react.useState("both");
	const [showPicker, setShowPicker] = import_react.useState(false);
	const [printKind, setPrintKind] = import_react.useState("query");
	const [printRequest, setPrintRequest] = import_react.useState(0);
	import_react.useEffect(() => {
		if (printRequest) window.print();
	}, [printRequest]);
	const [fromY, setFromY] = import_react.useState(year);
	const [fromM, setFromM] = import_react.useState(1);
	const [fromD, setFromD] = import_react.useState(1);
	const [toY, setToY] = import_react.useState(year);
	const [toM, setToM] = import_react.useState(12);
	const [toD, setToD] = import_react.useState(31);
	const range = import_react.useMemo(() => queryRange({
		year: fromY,
		month: fromM,
		day: fromD
	}, {
		year: toY,
		month: toM,
		day: toD
	}), [
		fromY,
		fromM,
		fromD,
		toY,
		toM,
		toD
	]);
	const { span, startDate, endDate, swapped } = range;
	const rangeLabelText = rangeLabel(fromY, fromM, toY, toM);
	const paymentRangeLabel = `${startDate} 至 ${endDate}`;
	const results = import_react.useMemo(() => buildQueryResults({
		people,
		attendance,
		payments,
		range
	}), [
		people,
		attendance,
		payments,
		range
	]);
	const matches = results.filter((row) => nameKey(row.person.name) === nameKey(name));
	const result = (selectedId ? matches.find((row) => row.person.id === selectedId) : void 0) || (matches.length === 1 ? matches[0] : void 0);
	const p = result?.person;
	const pays = result?.pays || [];
	const teams = groupBuckets(people.map((person) => person.team), "未分班组");
	const activeTeam = teams.some((bucket) => bucket.value === team) ? team : teams[0]?.value ?? "";
	const teamLabel = teams.find((bucket) => bucket.value === activeTeam)?.label || "未分班组";
	const teamSummary = import_react.useMemo(() => queryTeamResults(results, activeTeam, range.span), [
		results,
		activeTeam,
		range.span
	]);
	const printablePeople = scope === "team" ? teamSummary.members : results;
	const printableSelection = queryPrintResults(results, printIds, scope === "team" ? activeTeam : void 0);
	const effectiveSlips = import_react.useMemo(() => buildQuerySlips(printableSelection), [printableSelection]).filter((slip) => printMode === "pays" ? slip.pays.length > 0 : printMode === "wage" ? slip.months.length > 0 : true);
	const selectedCount = printableSelection.length;
	function chooseScope(next) {
		setScope(next);
		setPrintKind("query");
		setPrintIds([]);
		setShowPicker(false);
	}
	function showPerson(id) {
		const row = results.find((item) => item.person.id === id);
		if (!row) return;
		setName(row.person.name);
		setSelectedId(id);
		chooseScope("person");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "query.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "no-print space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-2xl font-semibold",
								children: "查询"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "按个人或班组查询区间考勤、工资。考勤按整月统计，发放按起止日期筛选。"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-end gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "space-y-1 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs text-muted",
											children: "查询方式"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "field-select w-auto",
											"aria-label": "查询方式",
											value: scope,
											onChange: (e) => chooseScope(e.target.value),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "person",
												children: "按个人"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "team",
												children: "按班组"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "space-y-1 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs text-muted",
											children: "查询内容"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "field-select w-auto",
											"aria-label": "查询内容",
											value: content,
											onChange: (e) => {
												setContent(e.target.value);
												setPrintKind("query");
												setShowPicker(false);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "attendance",
												children: "考勤"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "wage",
												children: "工资"
											})]
										})]
									}),
									scope === "team" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "min-w-0 space-y-1 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs text-muted",
											children: "班组"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "field-select max-w-full",
											"aria-label": "查询班组",
											value: activeTeam,
											onChange: (e) => {
												setTeam(e.target.value);
												setPrintKind("query");
												setPrintIds([]);
											},
											children: [teams.map((bucket) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: bucket.value,
												children: bucket.label
											}, bucket.value)), !teams.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "未分班组"
											}) : null]
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex min-w-0 max-w-full items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												list: "query-people-list",
												"aria-label": "查询姓名",
												className: "field-select min-w-0 w-48 max-w-full",
												value: name,
												placeholder: "输入或选择姓名",
												onChange: (e) => {
													setName(e.target.value);
													setSelectedId("");
													setPrintKind("query");
												}
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
												id: "query-people-list",
												children: people.map((person) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: person.name,
													children: person.team || "未分班组"
												}, person.id))
											}),
											name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												className: "size-9 shrink-0",
												type: "button",
												onClick: () => {
													setName("");
													setSelectedId("");
												},
												"aria-label": "清空姓名",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
											}) : null
										]
									})
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
									onD: content === "wage" ? setFromD : void 0
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
									onD: content === "wage" ? setToD : void 0
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "w-full text-xs text-muted",
									children: [
										"考勤：",
										rangeLabelText,
										"，按整月统计，共 ",
										span.length,
										" 个月",
										swapped ? "（起止已自动对调）" : "",
										"。",
										content === "wage" ? `发放：${paymentRangeLabel}，含起止当日。` : ""
									]
								})
							]
						}),
						canPrint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								disabled: scope === "team" ? !teamSummary.members.length : !result || result.ambiguous,
								onClick: () => {
									setPrintKind("query");
									setPrintRequest((value) => value + 1);
								},
								children: "打印查询结果"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: [
									"仅打印当前",
									scope === "team" ? `班组「${teamLabel}」` : "个人",
									"的",
									content === "wage" ? "工资" : "考勤",
									"核对清单。"
								]
							})]
						}) : null,
						content === "wage" && canPrint ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-line bg-surface p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-sm font-semibold",
									children: "打印工资条"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted",
									children: [
										"考勤 ",
										rangeLabelText,
										"；打款 ",
										paymentRangeLabel,
										"。",
										scope === "team" ? `仅限当前班组「${teamLabel}」。` : "可勾选人员与打印内容。"
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											size: "sm",
											type: "button",
											onClick: () => setShowPicker((value) => !value),
											children: [
												"选择人员",
												selectedCount ? `（已选 ${selectedCount}）` : "",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-3.5 transition-transform ${showPicker ? "rotate-180" : ""}` })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "inline-flex items-center gap-1.5 text-sm",
											children: ["打印", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												className: "field-select w-auto px-2 py-1.5",
												"aria-label": "工资条打印内容",
												value: printMode,
												onChange: (e) => setPrintMode(e.target.value),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "both",
														children: "工资 + 打款记录"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "wage",
														children: "仅工资"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "pays",
														children: "仅打款记录"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											size: "sm",
											type: "button",
											onClick: () => {
												if (!selectedCount) {
													toast.error("先勾选要打印的人");
													return;
												}
												if (!effectiveSlips.length) {
													toast.error(printMode === "pays" ? "所选人在该区间没有打款记录" : "所选人在该区间没有出勤或打款，没有工资条");
													return;
												}
												setPrintKind("slips");
												setPrintRequest((value) => value + 1);
											},
											children: [
												"打印工资条 ",
												effectiveSlips.length,
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
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											size: "sm",
											type: "button",
											onClick: () => setPrintIds(printablePeople.filter((row) => !row.ambiguous).map((row) => row.person.id)),
											children: ["全选", scope === "team" ? "本班组" : ""]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "sm",
											type: "button",
											onClick: () => setPrintIds([]),
											children: "清空"
										}),
										scope === "person" ? teams.map((bucket) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "sm",
											type: "button",
											onClick: () => setPrintIds(results.filter((row) => !row.ambiguous && inBucket(row.person.team, bucket.value)).map((row) => row.person.id)),
											children: bucket.label
										}, bucket.value)) : null
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm",
									children: printablePeople.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "inline-flex items-center gap-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												className: "size-4",
												disabled: row.ambiguous,
												checked: printableSelection.some((item) => item.person.id === row.person.id),
												onChange: (e) => setPrintIds((ids) => e.target.checked ? [...new Set([...ids, row.person.id])] : ids.filter((id) => id !== row.person.id))
											}),
											row.person.name,
											row.ambiguous ? "（同名待核对）" : ""
										]
									}, row.person.id))
								})]
							}) : null]
						}) : null,
						scope === "team" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TeamQueryResults, {
							summary: teamSummary,
							label: rangeLabelText,
							teamLabel,
							content,
							onPerson: showPerson
						}) : p && result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							content === "wage" && !result.ambiguous ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
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
											kind: "id",
											readOnly: !canEditPhotos
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
											name: p.name,
											kind: "bank",
											readOnly: !canEditPhotos
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
											name: p.name,
											kind: "ic",
											readOnly: !canEditPhotos
										})
									]
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-xl font-semibold",
									children: p.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: p.team?.trim() || "未分班组" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonQueryResults, {
								result,
								label: rangeLabelText,
								content
							}),
							content === "wage" && !result.ambiguous ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "rounded-xl border border-line bg-surface p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-sm font-semibold",
									children: [paymentRangeLabel, " 相关发放"]
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
											isProxyReceiver(x) ? ` · ${receiverOf(x)}代收` : " · 本人收",
											x.source ? ` · ${x.source}` : ""
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "tabular-nums",
											children: ["¥", money(x.amount)]
										})]
									}, x.id))]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
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
												readOnly: !canEditDocs,
												suggest: `考勤-${d.year}年${d.month}月`,
												taken: (attendanceDocs || []).map((x) => x.fileName),
												onReplaced: (name$1) => {
													if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
													patchAttendanceDoc(d.id, { fileName: name$1 });
												},
												onDeleted: () => {
													if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
													removeAttendanceDocs([d.id]);
												}
											})]
										}, d.id)), (attendanceDocs || []).filter((d) => span.some((x) => x.year === d.year && x.month === d.month)).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
											className: "text-muted",
											children: "该区间没有考勤影像。到「月度考勤」里上传。"
										}) : null]
									})
								]
							})] }) : null
						] }) : people.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "还没有人员。先在「人员」里添加。"
						}) : matches.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-warn",
							children: "人员档案存在同名，历史记录无法按姓名可靠区分。请先核对人员档案及历史记录。"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: name ? "未找到该姓名，请选择已有人员。" : content === "attendance" ? "选择人员后显示出勤天数、加班小时和备注。" : "选择人员后显示工资、考勤、发放和影像；也可先选择人员打印工资条。"
						})
					]
				}),
				canPrint && (printKind === "query" || content === "attendance") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuerySheet, {
					content,
					label: rangeLabelText,
					paymentLabel: paymentRangeLabel,
					person: scope === "person" ? result : void 0,
					team: scope === "team" ? teamSummary : void 0,
					teamLabel
				}) : null,
				content === "wage" && canPrint && printKind === "slips" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayslipSheets, {
					slips: effectiveSlips,
					rangeLabel: `考勤：${rangeLabelText}；打款：${paymentRangeLabel}`,
					printMode
				}) : null
			]
		})
	});
}
export { QueryPage as component };
