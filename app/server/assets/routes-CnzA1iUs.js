import { t as Link } from "./link-C8A9580o.js";
import { V as __toESM, c as require_jsx_runtime } from "../server.js";
import { i as money, t as cn } from "./utils-DPLvt0U2.js";
import { S as getWageAt, _ as monthStatus, b as paymentsInYear, h as derivedYears, l as overAgeLabel, n as contractRollup, w as monthPay } from "./contracts-DPSGQfL0.js";
import { t as useApp } from "./store-CCEaHtiU.js";
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function Home() {
	const store = useApp();
	const { year, people, attendance, payments, contracts, contractEntries, setYear } = store;
	const uiStyle = useApp((s) => s.uiStyle);
	const years = derivedYears(store);
	const fallbackYear = years[0] || year;
	const yearAtt = attendance.filter((a) => a.year === year);
	const yearPays = paymentsInYear(payments, year, fallbackYear);
	const map = Object.fromEntries(people.map((p) => [p.name, p]));
	let should = 0;
	for (const a of yearAtt) {
		const p = map[a.name];
		if (!p) continue;
		const wage = getWageAt(p, a.year, a.month);
		should += monthPay(a, wage).pay;
	}
	const paid = yearPays.filter((p) => p.date).reduce((s, p) => s + p.amount, 0);
	const pendingAmt = yearPays.filter((p) => !p.date).reduce((s, p) => s + p.amount, 0);
	const proxy = yearPays.filter((p) => p.date && p.owner !== p.receiver).length;
	const teams = [...new Set(people.map((p) => p.team).filter(Boolean))];
	const over = people.filter((p) => overAgeLabel(p.age, p.gender) === "超龄").length;
	const noWage = people.filter((p) => p.payType === "month" && !p.monthWage).length;
	const monthsFilled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, year, i + 1).filled > 0).filter(Boolean).length;
	const contractPay = contracts.filter((c) => c.year === year).reduce((s, c) => s + contractRollup(c, contractEntries).payable, 0);
	return uiStyle === "classic" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClassicHome, {
		year,
		years,
		peopleCount: people.length,
		teamCount: teams.length,
		monthsFilled,
		should,
		noWage,
		paid,
		pendingAmt,
		proxy,
		contractPay,
		teamRows: teams.map((t) => ({
			team: t,
			count: people.filter((p) => p.team === t).length
		})).sort((a, b) => b.count - a.count),
		over,
		onYear: setYear
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewHome, {
		year,
		years,
		peopleCount: people.length,
		teamCount: teams.length,
		monthsFilled,
		should,
		noWage,
		paid,
		pendingAmt,
		proxy,
		contractPay,
		maxTeam: Math.max(1, ...teams.map((t) => people.filter((p) => p.team === t).length)),
		teamRows: teams.map((t) => ({
			team: t,
			count: people.filter((p) => p.team === t).length
		})).sort((a, b) => b.count - a.count),
		over,
		onYear: setYear
	});
}
function NewHome(p) {
	const unavailable = p.monthsFilled < 12 ? `${12 - p.monthsFilled} 个月没录` : "全年录齐";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "rounded-xl bg-gradient-to-r from-accent-strong via-accent to-violet-500 p-5 text-white shadow-panel",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "font-display text-xl font-semibold",
								children: [p.year, " 年 · 总览"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-white/85",
								children: p.peopleCount ? `在册 ${p.peopleCount} 人 · ${p.teamCount} 个班组 · ${unavailable}${p.pendingAmt ? ` · 待发放 ¥${money(p.pendingAmt)}` : ""}` : "还没有人员。到「导入」下载模板导入吧。"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "min-w-0 flex-1" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								{
									to: "/attendance",
									label: "📅 录入考勤"
								},
								{
									to: "/payments",
									label: "💰 新增发放"
								},
								{
									to: "/export",
									label: "⬇️ 导出台账"
								}
							].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: h.to,
								className: "inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-sm text-white transition-colors hover:bg-white/25",
								children: h.label
							}, h.to))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex flex-wrap items-center gap-2",
				children: p.years.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => p.onYear(y),
					className: cn("chip", y === p.year && "on"),
					children: [y, "年"]
				}, y))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-3 md:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "在册人员",
						value: String(p.peopleCount),
						hint: `${p.teamCount} 个班组 · 各年共用`,
						icon: "👥",
						tone: "bg-pink-100 text-pink-600"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "已录月份",
						value: `${p.monthsFilled} / 12`,
						hint: `${p.year} 年`,
						icon: "📆",
						tone: "bg-cyan-100 text-cyan-600"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "应发合计",
						value: `¥${money(p.should)}`,
						hint: p.noWage ? `${p.noWage} 人未设工资` : "已按规则计算",
						icon: "¥",
						tone: "bg-green-100 text-green-600"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "已发放",
						value: `¥${money(p.paid)}`,
						hint: p.pendingAmt ? `待发 ¥${money(p.pendingAmt)} · 代收 ${p.proxy} 笔` : `代收 ${p.proxy} 笔`,
						icon: "💸",
						tone: "bg-orange-100 text-orange-600"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: `${p.year} 年应收`,
						value: `¥${money(p.contractPay)}`,
						hint: "含税报量 × 合同比例",
						icon: "📄",
						tone: "bg-violet-100 text-violet-600"
					})
				]
			}),
			p.noWage > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-warn-bg bg-warn-bg px-4 py-3 text-sm text-warn",
				children: [
					"还有 ",
					p.noWage,
					" 人没设工资，会算成 0。到「人员」填写，或在「设置」里批量设置。加班选按小时或按折算。"
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface p-5 shadow-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "班组"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 space-y-3",
						children: [p.teamRows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.team }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums text-muted",
								children: [r.count, " 人"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1.5 h-2 overflow-hidden rounded-full bg-bg-elevated",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
								className: "block h-full rounded-full bg-accent",
								style: { width: `${Math.round(r.count / (p.maxTeam || 1) * 100)}%` }
							})
						})] }, r.team)), !p.teamRows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-muted",
							children: "还没有班组。到「人员」给人员填班组。"
						}) : null]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface p-5 shadow-panel lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "快捷入口"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/people",
									title: "人员管理",
									desc: "增减人员、设工资规则、上传证件照"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/attendance",
									title: "月度考勤",
									desc: "12 个月格子，点进去录入"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/payments",
									title: "发放记录",
									desc: "实际收款人入账，收款人只是代收"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/contracts",
									title: "合同管理",
									desc: "报量、开票、收款分开记，保证金独立"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/expenses",
									title: "报销单",
									desc: "未报销可勾选打印，现金不用传凭证"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/export",
									title: "导出",
									desc: "按年导出整本 Excel，WPS 可打开"
								})
							]
						}),
						p.over > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 rounded-lg bg-warn-bg px-3 py-2 text-xs text-warn",
							children: [
								"超龄提醒：",
								p.over,
								" 人（男≥55 / 女≥45）"
							]
						}) : null
					]
				})]
			})
		]
	});
}
function ClassicHome(p) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-medium tracking-widest text-muted",
					children: [p.year, " 年"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display mt-1 text-3xl font-semibold tracking-tight",
					children: "台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted",
					children: p.peopleCount ? `当前工作年 ${p.year}。人员共用；考勤、发放、合同都按年查看。要加新年到「月度考勤」里点新增年。` : "还没有人员。到各模块下载模板导入，或到「导入」导入整本。"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex flex-wrap items-center gap-2",
				children: p.years.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => p.onYear(y),
					className: `h-9 rounded-sm px-3 text-sm transition-colors duration-150 ${y === p.year ? "bg-accent text-accent-fg" : "border border-line bg-surface text-muted hover:text-ink"}`,
					children: [y, "年"]
				}, y))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-3 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "在册人员",
						value: String(p.peopleCount),
						hint: `${p.teamCount} 个班组 · 各年共用`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "已录月份",
						value: `${p.monthsFilled} / 12`,
						hint: `${p.year} 年`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "应发合计",
						value: `¥${money(p.should)}`,
						hint: p.noWage ? `${p.noWage} 人未设工资` : "已按规则计算"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "已发放",
						value: `¥${money(p.paid)}`,
						hint: p.pendingAmt ? `待发放 ¥${money(p.pendingAmt)} · 代收 ${p.proxy} 笔` : `代收 ${p.proxy} 笔 · 记在实际收款人头上`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid grid-cols-1 gap-3 md:grid-cols-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: `${p.year} 年应收`,
					value: `¥${money(p.contractPay)}`,
					hint: "含税报量 × 合同比例"
				})
			}),
			p.noWage > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-line bg-warn-bg px-4 py-3 text-sm text-warn",
				children: [
					"还有 ",
					p.noWage,
					" 人没设工资，会算成 0。到「人员」填写，或在「设置」里批量设置。加班选按小时或按折算。"
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface p-5 shadow-panel",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "班组"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2",
						children: p.teamRows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.team }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums text-muted",
								children: [r.count, " 人"]
							})]
						}, r.team))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface p-5 shadow-panel",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "快捷入口"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/people",
									title: "人员管理",
									desc: "增减人员、设工资规则、上传证件照"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/attendance",
									title: "月度考勤",
									desc: "12 个月格子，点进去录入"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/payments",
									title: "发放记录",
									desc: "实际收款人入账，收款人只是代收"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/contracts",
									title: "合同管理",
									desc: "报量、开票、收款分开记，保证金独立"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/expenses",
									title: "报销单",
									desc: "未报销可勾选打印，现金不用传凭证"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Quick, {
									to: "/export",
									title: "导出",
									desc: "按年导出整本 Excel，WPS 可打开"
								})
							]
						}),
						p.over > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-xs text-warn",
							children: [
								"超龄提醒：",
								p.over,
								" 人（男≥55 / 女≥45）"
							]
						}) : null
					]
				})]
			})
		]
	});
}
function Kpi({ label, value, hint, icon, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-line bg-surface p-4 shadow-panel",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm", tone),
					children: icon
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 font-display text-xl font-semibold tabular-nums tracking-tight",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-subtle",
				children: hint
			})
		]
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 font-display text-xl font-semibold tabular-nums tracking-tight",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-xs text-subtle",
				children: hint
			})
		]
	});
}
function Quick({ to, title, desc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "rounded-xl border border-line bg-bg-elevated p-3 transition-colors duration-150 hover:border-accent hover:bg-accent-soft",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-sm font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 text-xs text-muted",
			children: desc
		})]
	});
}
export { Home as component };
