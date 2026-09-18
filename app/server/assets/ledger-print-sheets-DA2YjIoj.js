import { V as __toESM, c as require_jsx_runtime } from "../server.js";
import { a as money } from "./utils-DqsA5Dz5.js";
import { f as localToday, i as parseOtRule, o as wageLabel } from "./wage-BVBIWt51.js";
import { u as overAgeLabel } from "./contracts-FU2UPdFm.js";
const MONTH_SHEET_COLS = [
	4,
	6,
	8,
	5,
	5,
	8,
	8,
	8,
	8,
	8,
	11,
	21
];
const YEAR_MONTHS_COLS = [
	8,
	15,
	17,
	15,
	15,
	30
];
const PAYROLL_COLS = [
	7,
	16,
	18,
	15,
	15,
	15,
	14
];
const ROSTER_COLS = [
	6,
	10,
	10,
	12,
	8,
	10,
	13,
	9,
	6,
	12,
	4
];
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var PCT = (w) => `${w}%`;
var TD = "border border-black px-1 py-1";
var TH = `${TD} font-medium`;
var MONTH_MONEY_TD = "border border-black px-0.5 py-1 tabular-nums text-right whitespace-nowrap";
var CAPTION = `${TD} text-left font-semibold`;
function AttendanceMonthSheet({ year, month, rows, totals, dirty }) {
	if (!rows.length) return null;
	const today = localToday();
	const heads = [
		"序号",
		"姓名",
		"班组",
		"出勤天数",
		"加班小时",
		"补助",
		"扣款",
		"工资（人员表）",
		"加班费",
		"餐补",
		"应发",
		"备注"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only text-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "statement border border-black p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "border-b border-black pb-2 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xl font-semibold tracking-widest",
						children: [
							year,
							" 年 ",
							month,
							" 月考勤月表"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-[11px]",
						children: [
							"与屏幕「",
							year,
							"年",
							month,
							"月考勤」月表同一份数据",
							dirty ? "（含未保存的修改）" : "",
							"： 出勤天数、加班小时、补助、扣款、工资（人员表）与应发都取自同一套计算。 加班规则（按小时 / 折算）请看屏幕月表或人员表 —— 这一格文字长、上纸只会把整张表挤到第二页。"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-3 w-full table-fixed border-collapse text-center text-[10px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: MONTH_SHEET_COLS.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: PCT(w) } }, i)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							className: CAPTION,
							colSpan: heads.length,
							children: [
								year,
								"年",
								month,
								"月 · 本表 ",
								totals.people,
								" 人"
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: heads.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: TH,
							children: h
						}, h)) })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: r.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: r.team || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: r.days
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: r.otHours
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: MONTH_MONEY_TD,
								children: money(r.allowance)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: MONTH_MONEY_TD,
								children: money(r.deduction)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: r.wageLabel
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: MONTH_MONEY_TD,
								children: money(r.ot)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: MONTH_MONEY_TD,
								children: money(r.meal)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${MONTH_MONEY_TD} font-medium`,
								children: money(r.pay)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} text-left`,
								children: r.remark || ""
							})
						] }, `${r.name}__${i}`)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "font-semibold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: TD,
									colSpan: 3,
									children: [
										"合计 ",
										totals.people,
										" 人"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: totals.days
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: TD }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: MONTH_MONEY_TD,
									children: money(totals.allowance)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: MONTH_MONEY_TD,
									children: money(totals.deduction)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: TD }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: MONTH_MONEY_TD,
									children: money(totals.ot)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: MONTH_MONEY_TD,
									children: money(totals.meal)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: MONTH_MONEY_TD,
									children: money(totals.pay)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: TD })
							]
						}) })
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
function AttendanceMonthsYearSheet({ year, tables, peopleCount, filledMonths }) {
	if (!tables.length) return null;
	const today = localToday();
	const heads = [
		"序号",
		"姓名",
		"班组",
		"出勤天数",
		"加班小时",
		"应发（元）"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only text-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "statement border border-black p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "border-b border-black pb-2 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xl font-semibold tracking-widest",
							children: [year, " 年 · 全年月表（分月）"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-sm",
							children: [
								"在册 ",
								peopleCount,
								" 人 · 已录入 ",
								filledMonths,
								" / 12 个月"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-0.5 text-[11px]",
							children: [
								"每月一块，只列该月有出勤/加班记录的人；出勤天数、加班小时、应发与屏幕「",
								year,
								"年度工资汇总 / 工天加班汇总」 是同一份数据，纸上不另算。"
							]
						})
					]
				}),
				tables.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-3 print-doc",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full table-fixed border-collapse text-center text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: YEAR_MONTHS_COLS.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: PCT(w) } }, i)) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
								className: CAPTION,
								colSpan: heads.length,
								children: [
									year,
									"年",
									t.month,
									"月 · 考勤月表 · 本表 ",
									t.rows.length,
									" 人"
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: heads.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: TH,
								children: h
							}, h)) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: t.rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: i + 1
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: r.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: r.team || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: r.days
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: r.otHours
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: money(r.pay)
								})
							] }, `${r.name}__${i}`)) })
						]
					})
				}, t.month)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-right text-xs",
					children: ["打印日期 ", today]
				})
			]
		})
	});
}
function PayrollYearSheet({ year, rows, peopleCount, filledMonths, should, paid, proxyAmt, proxyCount, pendingAmt, unpaidTotal, offRows }) {
	if (!rows.length) return null;
	const today = localToday();
	const heads = [
		"序号",
		"姓名",
		"班组",
		"全年应发（元）",
		"已发（元）",
		"未发（元）",
		"备注"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only text-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "statement border border-black p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "border-b border-black pb-2 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xl font-semibold tracking-widest",
							children: [year, " 年度工资汇总"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-sm",
							children: [
								peopleCount,
								" 人在册 · 已录入 ",
								filledMonths,
								" / 12 个月"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-0.5 text-[11px] font-medium",
							children: [
								"本年应发 ¥",
								money(should),
								" · 已发放 ¥",
								money(paid),
								"（含代发",
								proxyCount ? `，其中代发 ¥${money(proxyAmt)}（${proxyCount} 笔）` : "",
								"） · 未发 ¥",
								money(unpaidTotal),
								" · 待发放 ¥",
								money(pendingAmt)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-0.5 text-[11px]",
							children: [
								"口径与屏幕「",
								year,
								"年度工资汇总」一致：已发按实际收款人计入、含代发；待发放不计入已发。 12 个月的应发明细在屏幕上是横向表，要按月看请用考勤页的「打印全年月表」。"
							]
						}),
						offRows.count ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-0.5 text-[11px]",
							children: [
								"另有 ",
								offRows.count,
								" 笔 ¥",
								money(offRows.amount),
								" 发给本年没有考勤记录的人（不列入下表）。"
							]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-3 w-full table-fixed border-collapse text-center text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: PAYROLL_COLS.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: PCT(w) } }, i)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							className: CAPTION,
							colSpan: heads.length,
							children: [
								year,
								" 年 · 应发 / 已发 / 未发 汇总 · 本表 ",
								rows.length,
								" 人"
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: heads.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: TH,
							children: h
						}, h)) })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: r.person.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: r.person.team || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: money(r.yearPayAmt)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: money(r.paid)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: money(r.unpaid)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} text-left`,
								children: r.remark || ""
							})
						] }, r.person.id)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "font-semibold",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: TD,
									colSpan: 3,
									children: [
										"合计 ",
										rows.length,
										" 人"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: money(should)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: money(paid)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: TD,
									children: money(unpaidTotal)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { className: TD })
							]
						}) })
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
function PeopleRosterSheet({ rows, filterText, total }) {
	if (!rows.length) return null;
	const today = localToday();
	const heads = [
		"序号",
		"姓名",
		"工号",
		"班组",
		"计薪",
		"工资",
		"加班",
		"餐补",
		"年龄",
		"电话",
		"备注"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-only text-black",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "statement border border-black p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "border-b border-black pb-2 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xl font-semibold tracking-widest",
							children: "人员名单"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-sm",
							children: [
								"范围：",
								filterText,
								" · 共 ",
								total,
								" 人"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-0.5 text-[11px]",
							children: "计薪/工资/加班规则/餐补/年龄取自人员档案（与屏幕同一套显示口径）；男 ≥55、女 ≥45 岁在备注标「超龄」。 本表不含身份证号与银行卡号。"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "mt-3 w-full table-fixed border-collapse text-center text-[10px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("colgroup", { children: ROSTER_COLS.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("col", { style: { width: PCT(w) } }, i)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("thead", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
							className: CAPTION,
							colSpan: heads.length,
							children: [
								"人员名单 · ",
								filterText,
								" · 共 ",
								total,
								" 人"
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: heads.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: TH,
							children: h
						}, h)) })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: i + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: p.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: p.personNo || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: p.team || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: p.payType === "month" ? "按月" : "按工天"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: wageLabel(p)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: parseOtRule(p.otRule).label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: p.mealAllowance ? `¥${p.mealAllowance}/天` : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: p.age ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: TD,
								children: p.phone || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: `${TD} text-left`,
								children: overAgeLabel(p.age, p.gender) === "超龄" ? "超龄" : ""
							})
						] }, p.id)) })
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
export { PeopleRosterSheet as i, AttendanceMonthsYearSheet as n, PayrollYearSheet as r, AttendanceMonthSheet as t };
