import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-CYLuVN7r.js";
import { a as toggleSel, n as confirmBatchDelete, o as uid } from "./utils-DPLvt0U2.js";
import { C as parseOtRule, _ as parseDateYmd, c as normalizeIdDate, d as validateIdCard, l as overAgeLabel, u as parseIdCard, w as wageLabel } from "./contracts-Ddv2VxfU.js";
import "./excel-CEulLVmE.js";
import { t as useApp } from "./store-U11L9wsl.js";
import "./nas-sync-CM8UpyNe.js";
import { n as CalendarDays, t as RotateCcwClock } from "./rotate-ccw-clock-1dRRhyJ8.js";
import { i as usePhotoFlags, n as PhotoSlot, r as ScanPhotosButton } from "./photo-slot-BSl_Yg7b.js";
import "./file-pick-sYj_heGl.js";
import { n as toast } from "./dist-DfB6JCQe.js";
import { t as Button } from "./button-3Oociu2t.js";
import { n as Label, t as Input } from "./input-D7JnnlZc.js";
import { n as WideTable, r as usePager } from "./wide-table-DZcTZW_-.js";
import { n as Need, t as Can } from "./can-qr6UNuZ3.js";
import { o as PeopleImport, s as TplLink } from "./excel-import-DMikwNo7.js";
import { t as Badge } from "./badge-Ck_uyNMz.js";
import "./photos-DLVABT93.js";
import { n as PayTypePick, t as OtRulePick } from "./pay-fields-BjdVc6Ho.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function emptyWageHistory() {
	return {
		id: uid(),
		fromDate: "",
		payType: "day",
		dailyWage: 0,
		monthWage: 0,
		otRule: "",
		mealAllowance: 0,
		remark: ""
	};
}
function emptyPerson() {
	return {
		id: uid(),
		name: "",
		team: "",
		personNo: "",
		idCard: "",
		gender: "",
		age: null,
		birthday: "",
		phone: "",
		dailyWage: 0,
		monthWage: 0,
		payType: "day",
		otRule: "",
		mealAllowance: 0,
		wageHistory: [],
		bank: "",
		cardNo: "",
		address: "",
		idIssuer: "",
		idValidFrom: "",
		idValidTo: "",
		remark: ""
	};
}
function PeoplePage() {
	const people = useApp((s) => s.people);
	const upsert = useApp((s) => s.upsertPerson);
	const addPerson = useApp((s) => s.addPerson);
	const removePeople = useApp((s) => s.removePeople);
	const [q, setQ] = import_react.useState("");
	const [team, setTeam] = import_react.useState("全部");
	const [editing, setEditing] = import_react.useState(null);
	const [creating, setCreating] = import_react.useState(false);
	const [selected, setSelected] = import_react.useState([]);
	const [photoTick, setPhotoTick] = import_react.useState(0);
	const flags = usePhotoFlags(import_react.useMemo(() => people.map((p) => p.name), [people]), photoTick);
	const teams = import_react.useMemo(() => ["全部", ...new Set(people.map((p) => p.team).filter(Boolean))], [people]);
	const filtered = people.filter((p) => {
		if (team !== "全部" && p.team !== team) return false;
		if (!q.trim()) return true;
		const s = q.trim();
		return [
			p.name,
			p.team,
			p.idCard,
			p.phone,
			p.personNo
		].some((x) => String(x).includes(s));
	});
	const pager = usePager("people", filtered, [q, team].join("|"));
	const pageRows = pager.rows;
	function closeEditor() {
		setEditing(null);
		setCreating(false);
		setPhotoTick((n) => n + 1);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "people.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-wrap items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: "人员管理"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "带 * 的必须填：姓名、班组。日工资可以填 0。按月计薪才必须填月工资。"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanPhotosButton, {
								names: people.map((p) => p.name),
								onDone: () => setPhotoTick((n) => n + 1)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TplLink, {
								href: "/api/file/people-template",
								filename: "人员导入模板.xlsx"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft",
								href: "/api/file/people-export",
								children: "导出人员名单"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
								perm: "import.use",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PeopleImport, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
								perm: "people.edit",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => {
										setCreating(true);
										setEditing(emptyPerson());
									},
									children: "新增人员"
								})
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-xs",
							placeholder: "搜索姓名 / 身份证 / 电话",
							value: q,
							onChange: (e) => setQ(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "field-select",
							value: team,
							onChange: (e) => setTeam(e.target.value),
							children: teams.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: t }, t))
						}),
						selected.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
							perm: "people.delete",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "danger",
								onClick: () => {
									if (!confirmBatchDelete("人员", selected.length, "只删人员档案。考勤、发放记录里的名字还在，照片文件仍在目录里。")) return;
									removePeople(selected);
									setSelected([]);
									toast.success(`已删除 ${selected.length} 人`);
								},
								children: [
									"删除所选（",
									selected.length,
									"）"
								]
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "勾选左侧方框可多选删除"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WideTable, {
					id: "people",
					pager,
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
										checked: pageRows.length > 0 && pageRows.every((p) => selected.includes(p.id)),
										onChange: (e) => {
											const ids = pageRows.map((p) => p.id);
											setSelected((s) => e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id)));
										},
										"aria-label": "全选人员"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "操作"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "序号"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									className: "p-3",
									children: ["姓名 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-danger",
										children: "*"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									className: "p-3",
									children: ["班组 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-danger",
										children: "*"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "计薪"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									className: "p-3",
									children: ["工资 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-danger",
										children: "*"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "加班"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "餐补"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "年龄"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "电话"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "照片"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 12,
							className: "p-8 text-center text-sm text-muted",
							children: "没有匹配的人员"
						}) }) : null, pageRows.map((p, i) => {
							const f = flags[p.name];
							const n = (f?.id ? 1 : 0) + (f?.idBack ? 1 : 0) + (f?.bank ? 1 : 0) + (f?.ic ? 1 : 0);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: `border-b border-line last:border-0 hover:bg-accent-soft ${selected.includes(p.id) || editing?.id === p.id ? "bg-accent-soft" : ""}`,
								onClick: () => setSelected((s) => toggleSel(s, p.id, !s.includes(p.id))),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										onClick: (e) => e.stopPropagation(),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											className: "size-4",
											checked: selected.includes(p.id),
											onChange: (e) => setSelected((s) => toggleSel(s, p.id, e.target.checked))
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										onClick: (e) => e.stopPropagation(),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "sm",
											type: "button",
											onClick: () => setEditing(p),
											children: "编辑"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 tabular-nums text-muted",
										children: (pager.page - 1) * pager.size + i + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-medium",
											children: p.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-subtle",
											children: p.personNo
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 text-muted",
										children: p.team
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 text-muted",
										children: p.payType === "month" ? "按月" : "按工天"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 tabular-nums",
										children: wageLabel(p)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										children: parseOtRule(p.otRule).label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 tabular-nums",
										children: p.mealAllowance ? `¥${p.mealAllowance}/天` : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "p-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "tabular-nums",
												children: p.age ?? "—"
											}),
											" ",
											overAgeLabel(p.age, p.gender) === "超龄" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "warn",
												children: "超龄"
											}) : null
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 tabular-nums",
										children: p.phone || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										onClick: (e) => e.stopPropagation(),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											className: "text-left text-xs text-accent",
											type: "button",
											onClick: () => setEditing(p),
											children: [n, "/4 已上传"]
										})
									})
								]
							}, p.id);
						})] })]
					})
				}),
				editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonEditor, {
					person: editing,
					creating,
					refresh: photoTick,
					onClose: closeEditor,
					onChanged: () => setPhotoTick((n) => n + 1),
					onSave: (p) => {
						if (creating) {
							if (people.some((x) => x.name === p.name)) {
								toast.error("已有同名人员，请改名或直接编辑原记录");
								return;
							}
							addPerson(p);
							toast.success("已添加");
						} else {
							upsert(p);
							toast.success("已保存");
						}
						closeEditor();
					},
					onDelete: () => {
						if (!confirmBatchDelete("人员", 1, `将删除 ${editing.name} 的档案。考勤和发放记录里的名字还在。`)) return;
						removePeople([editing.id]);
						setSelected((s) => s.filter((id) => id !== editing.id));
						toast.success(`已删除 ${editing.name}`);
						closeEditor();
					}
				}) : null
			]
		})
	});
}
function confirmEdits(kind, name, creating, before, after, labels) {
	if (typeof window === "undefined") return true;
	if (creating) return window.confirm(`确认新增${kind}「${name || "未命名"}」？`);
	const lines = [];
	for (const key of Object.keys(labels)) {
		let a = before?.[key], b = after?.[key];
		if (a === true) a = "是";
		else if (a === false) a = "否";
		if (b === true) b = "是";
		else if (b === false) b = "否";
		if (a === "day") a = "按工天";
		if (b === "day") b = "按工天";
		if (a === "month") a = "按月";
		if (b === "month") b = "按月";
		const as = a == null || a === "" ? "（空）" : String(a);
		const bs = b == null || b === "" ? "（空）" : String(b);
		if (as === bs) continue;
		lines.push(`${labels[key]}：${as} → ${bs}`);
	}
	if (!lines.length) return window.confirm(`没有改动。仍要保存${kind}「${name}」？`);
	const show = lines.slice(0, 8);
	const extra = lines.length > 8 ? `\n…另有 ${lines.length - 8} 项` : "";
	return window.confirm(`确认保存${kind}「${name}」？\n\n改了 ${lines.length} 项：\n${show.join("\n")}${extra}`);
}
function PersonEditor({ person, creating, refresh = 0, onClose, onSave, onDelete, onChanged }) {
	const [form, setForm] = import_react.useState(() => ({
		...person,
		idValidFrom: normalizeIdDate(person.idValidFrom),
		idValidTo: normalizeIdDate(person.idValidTo, true)
	}));
	const [tried, setTried] = import_react.useState(false);
	const [idErr, setIdErr] = import_react.useState("");
	function set(k, v) {
		setForm((f) => ({
			...f,
			[k]: v
		}));
	}
	function onId(idCard) {
		const parsed = parseIdCard(idCard);
		setIdErr(validateIdCard(idCard));
		setForm((f) => ({
			...f,
			idCard,
			gender: parsed.gender || f.gender,
			age: parsed.age,
			birthday: parsed.birthday || f.birthday
		}));
	}
	const errors = {
		name: !form.name.trim() ? "请填写姓名" : "",
		team: !form.team.trim() ? "请填写班组" : "",
		monthWage: form.payType === "month" && (!form.monthWage || form.monthWage <= 0) ? "请填写月工资" : ""
	};
	const missing = Object.values(errors).filter(Boolean);
	function save() {
		setTried(true);
		if (missing.length) {
			toast.error(`必填未完成：${[
				errors.name && "姓名",
				errors.team && "班组",
				errors.monthWage && "月工资"
			].filter(Boolean).join("、")}`);
			return;
		}
		if (idErr) {
			toast.error(`身份证号有误：${idErr}`);
			return;
		}
		const next = {
			...form,
			idValidFrom: normalizeIdDate(form.idValidFrom),
			idValidTo: normalizeIdDate(form.idValidTo, true)
		};
		if (!confirmEdits("人员", next.name, creating, person, next, {
			name: "姓名",
			team: "班组",
			payType: "计薪",
			dailyWage: "日工资",
			monthWage: "月工资",
			otRule: "加班",
			mealAllowance: "餐补",
			idCard: "身份证号",
			idIssuer: "签发机关",
			idValidFrom: "有效期起",
			idValidTo: "有效期止",
			phone: "电话",
			personNo: "IC卡号",
			bank: "开户行",
			cardNo: "银行卡号",
			address: "户籍地址",
			remark: "备注"
		})) return;
		onSave(next);
	}
	import_react.useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 md:items-center md:p-6",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-screen w-full max-w-3xl overflow-y-auto rounded-t-xl bg-surface p-5 shadow-panel md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: creating ? "新增人员" : form.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							!creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "danger",
								size: "sm",
								onClick: () => onDelete?.(),
								children: "删除"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								onClick: onClose,
								children: "取消"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: save,
								children: "保存"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex size-8 items-center justify-center rounded-sm text-xl leading-none text-muted hover:bg-accent-soft hover:text-ink",
								"aria-label": "关闭",
								title: "关闭（Esc）",
								onClick: onClose,
								children: "×"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 md:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "姓名",
							required: true,
							error: tried ? errors.name : "",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.name,
								onChange: (e) => set("name", e.target.value),
								"aria-required": true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "班组",
							required: true,
							error: tried ? errors.team : "",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.team,
								onChange: (e) => set("team", e.target.value),
								"aria-required": true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "计薪方式",
							hint: "大多数人选按工天。按月的人当月有出勤就发月工资，缺勤用扣款。",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayTypePick, {
								value: form.payType === "month" ? "month" : "day",
								onChange: (v) => set("payType", v)
							})
						}),
						form.payType === "month" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "月工资",
							required: true,
							error: tried ? errors.monthWage : "",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: form.monthWage || "",
								onChange: (e) => set("monthWage", Number(e.target.value) || 0),
								"aria-required": true
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "日工资",
							hint: "可以填 0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								value: form.dailyWage,
								onChange: (e) => set("dailyWage", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "加班规则",
							hint: "选按小时填元/小时；选按折算填几小时算一天。可不计加班。",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtRulePick, {
								value: form.otRule,
								onChange: (s) => set("otRule", s)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "餐补/天",
							hint: "按正常出勤天数算，加班折算的工天不算。填0表示没有餐补。",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								value: form.mealAllowance || "",
								onChange: (e) => set("mealAllowance", Number(e.target.value) || 0)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "身份证号（自动生成性别年龄生日）",
							error: idErr,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.idCard,
								onChange: (e) => onId(e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "身份证签发机关",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.idIssuer,
								onChange: (e) => set("idIssuer", e.target.value),
								placeholder: "如 某某县公安局"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "身份证有效期开始",
							hint: "一个框：手填或点右边日历，保存成 2007-04-29",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateFill, {
								value: form.idValidFrom,
								onChange: (v) => set("idValidFrom", v)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "身份证有效期结束",
							hint: "手填、点日历，或点长期",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateFill, {
								value: form.idValidTo,
								onChange: (v) => set("idValidTo", v),
								allowLong: true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "性别",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.gender,
										readOnly: true
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "年龄",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.age ?? "",
										readOnly: true
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: "生日",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.birthday,
										readOnly: true
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "联系电话",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.phone,
								onChange: (e) => set("phone", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "IC卡号",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.personNo,
								onChange: (e) => set("personNo", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "开户行",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.bank,
								onChange: (e) => set("bank", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "银行卡号",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.cardNo,
								onChange: (e) => set("cardNo", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "户籍地址",
							className: "md:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.address,
								onChange: (e) => set("address", e.target.value)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "备注",
							className: "md:col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.remark,
								onChange: (e) => set("remark", e.target.value)
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 border-t border-line pt-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "flex items-center gap-1.5 text-sm font-semibold",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcwClock, { className: "size-4" }),
									"工资变更历史",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-normal text-muted",
										children: "（可选，用于记录工资调整）"
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => {
									const history = [...form.wageHistory || [], emptyWageHistory()];
									setForm((f) => ({
										...f,
										wageHistory: history
									}));
								},
								children: "添加工资记录"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: "设置后，考勤会自动按生效日期匹配对应的工资。不填则一直使用当前工资。"
						}),
						(form.wageHistory || []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 space-y-2",
							children: (form.wageHistory || []).map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-end gap-2 rounded-md border border-line bg-accent-soft/30 p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-[120px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "生效日期"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "date",
											className: "mt-1 h-9",
											value: h.fromDate,
											onChange: (e) => {
												const history = [...form.wageHistory || []];
												history[i] = {
													...h,
													fromDate: e.target.value
												};
												setForm((f) => ({
													...f,
													wageHistory: history
												}));
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-28",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "计薪"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayTypePick, {
											value: h.payType,
											onChange: (v) => {
												const history = [...form.wageHistory || []];
												history[i] = {
													...h,
													payType: v
												};
												setForm((f) => ({
													...f,
													wageHistory: history
												}));
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-28",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: h.payType === "month" ? "月工资" : "日工资"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											className: "mt-1 h-9",
											value: h.payType === "month" ? h.monthWage || "" : h.dailyWage || "",
											onChange: (e) => {
												const history = [...form.wageHistory || []];
												const val = Number(e.target.value) || 0;
												history[i] = {
													...h,
													[h.payType === "month" ? "monthWage" : "dailyWage"]: val
												};
												setForm((f) => ({
													...f,
													wageHistory: history
												}));
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-[150px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "加班规则"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtRulePick, {
											value: h.otRule,
											onChange: (s) => {
												const history = [...form.wageHistory || []];
												history[i] = {
													...h,
													otRule: s
												};
												setForm((f) => ({
													...f,
													wageHistory: history
												}));
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-24",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "餐补/天"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											className: "mt-1 h-9",
											value: h.mealAllowance || "",
											onChange: (e) => {
												const history = [...form.wageHistory || []];
												history[i] = {
													...h,
													mealAllowance: Number(e.target.value) || 0
												};
												setForm((f) => ({
													...f,
													wageHistory: history
												}));
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-[100px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "text-xs",
											children: "备注"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1 h-9",
											value: h.remark,
											placeholder: "如：涨薪、调岗",
											onChange: (e) => {
												const history = [...form.wageHistory || []];
												history[i] = {
													...h,
													remark: e.target.value
												};
												setForm((f) => ({
													...f,
													wageHistory: history
												}));
											}
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										className: "text-danger hover:bg-danger/10",
										onClick: () => {
											const history = (form.wageHistory || []).filter((_, idx) => idx !== i);
											setForm((f) => ({
												...f,
												wageHistory: history
											}));
										},
										children: "删除"
									})
								]
							}, h.id))
						}) : null
					]
				}),
				form.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-4 md:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
							name: form.name,
							kind: "id",
							onChanged
						}, `id-${refresh}`),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
							name: form.name,
							kind: "bank",
							onChanged
						}, `bank-${refresh}`),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
							name: form.name,
							kind: "ic",
							onChanged
						}, `ic-${refresh}`)
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-xs text-muted",
					children: "先填姓名再上传。身份证格子只显示正面，边上可点「查看反面」。也可直接拷到 NAS：data/photos/id，文件名「张三-身份证-正面.jpg」「张三-身份证-反面.jpg」。"
				})
			]
		})
	});
}
function DateFill({ value, onChange, allowLong }) {
	const shown = value === "长期" ? "长期" : normalizeIdDate(value) || value;
	const iso = parseDateYmd(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				className: "pr-10",
				value: shown,
				placeholder: allowLong ? "2007-04-29 或 长期" : "2007-04-29",
				onChange: (e) => {
					const v = e.target.value.trim();
					if (allowLong && /长期/.test(v)) onChange("长期");
					else onChange(v);
				},
				onBlur: (e) => {
					const v = e.target.value.trim();
					if (!v) return;
					if (allowLong && /长期/.test(v)) {
						onChange("长期");
						return;
					}
					const n = normalizeIdDate(v);
					if (n && n !== v) onChange(n);
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink",
				title: "选日期",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					className: "absolute inset-0 cursor-pointer opacity-0",
					value: iso,
					onChange: (e) => onChange(e.target.value),
					"aria-label": "选日期"
				})]
			})]
		}), allowLong ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "outline",
			size: "sm",
			onClick: () => onChange("长期"),
			children: "长期"
		}) : null]
	});
}
function Field({ label, children, className, required, error, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: [label, required ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-0.5 text-danger",
				children: "*"
			}) : null] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1",
				children
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-danger",
				children: error
			}) : hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: hint
			}) : null
		]
	});
}
export { PeoplePage as component };
