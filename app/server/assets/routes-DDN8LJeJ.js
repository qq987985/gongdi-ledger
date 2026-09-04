import { t as Link } from "./link-C8A9580o.js";
import { V as __toESM, c as require_jsx_runtime } from "../server.js";
import { i as money } from "./utils-DPLvt0U2.js";
import { C as monthPay, g as monthStatus, h as derivedYears, l as overAgeLabel, n as contractRollup, x as getWageAt, y as paymentsInYear } from "./contracts-DHzcdfHV.js";
import { t as useApp } from "./store-DN67JpqK.js";
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function Home() {
	const store = useApp();
	const { year, people, attendance, payments, contracts, contractEntries, setYear } = store;
	const years = derivedYears(store);
	const fallbackYear = years[0] || year;
	const yearAtt = attendance.filter((a) => a.year === year);
	const yearPays = paymentsInYear(payments, year, fallbackYear);
	const map = Object.fromEntries(people.map((p) => [p.name, p]));
	let should = 0;
	for (const a of yearAtt) {
		const p = map[a.name];
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
	const teamRows = teams.map((t) => ({
		team: t,
		count: people.filter((p) => p.team === t).length
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs font-medium tracking-widest text-muted",
					children: [year, " 年"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display mt-1 text-3xl font-semibold tracking-tight",
					children: "台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-xl text-sm text-muted",
					children: people.length ? `当前工作年 ${year}。人员共用；考勤、发放、合同都按年查看。要加新年到「月度考勤」里点新增年。` : "还没有人员。到各模块下载模板导入，或到「导入」导入整本。"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex flex-wrap items-center gap-2",
				children: years.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setYear(y),
					className: `h-9 rounded-sm px-3 text-sm transition-colors duration-150 ${y === year ? "bg-accent text-accent-fg" : "border border-line bg-surface text-muted hover:text-ink"}`,
					children: [y, "年"]
				}, y))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid grid-cols-2 gap-3 md:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "在册人员",
						value: String(people.length),
						hint: `${teams.length} 个班组 · 各年共用`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "已录月份",
						value: `${monthsFilled} / 12`,
						hint: `${year} 年`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "应发合计",
						value: `¥${money(should)}`,
						hint: noWage ? `${noWage} 人未设工资` : "已按规则计算"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "已发放",
						value: `¥${money(paid)}`,
						hint: pendingAmt ? `待发放 ¥${money(pendingAmt)} · 代收 ${proxy} 笔` : `代收 ${proxy} 笔 · 记在实际收款人头上`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: `${year} 年应收`,
						value: `¥${money(contractPay)}`,
						hint: "含税报量 × 合同比例"
					})
				]
			}),
			noWage > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-line bg-warn-bg px-4 py-3 text-sm text-warn",
				children: [
					"还有 ",
					noWage,
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
						children: teamRows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
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
						over > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-4 text-xs text-warn",
							children: [
								"超龄提醒：",
								over,
								" 人（男≥55 / 女≥45）"
							]
						}) : null
					]
				})]
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
		className: "rounded-md border border-line bg-bg-elevated p-3 transition-colors duration-150 hover:border-accent",
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
