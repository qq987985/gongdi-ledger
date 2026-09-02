import { n as WinUpdate } from "./shell-BilkdacW.js";
import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { i as PRESETS, r as PERM_GROUPS } from "./perms-CYLuVN7r.js";
import { a as lockGate, i as hashPassword, n as authStatus, o as unlockGate, t as authOp } from "./auth-CTHz_Bd5.js";
import { S as wageLabel, d as confirmRemoveYear, h as nextYear, m as monthStatus, p as derivedYears, x as parseOtRule } from "./contracts-C1vBmiZ8.js";
import "./excel-DljZk7Qw.js";
import { t as useApp } from "./store-C5SZ1jtR.js";
import { i as pushNasBackup, n as nasEnabled, r as pullNasLedger } from "./nas-sync-YEjyDlzb.js";
import { n as toast } from "./dist-DfB6JCQe.js";
import { t as Button } from "./button-CtK1BncN.js";
import { n as Label, t as Input } from "./input--dJb4stz.js";
import { r as useCan, t as Can } from "./can-qr6UNuZ3.js";
import { t as clearAllPhotos } from "./photos-DEnDYmxo.js";
import { n as PayTypePick, t as OtRulePick } from "./pay-fields-qSGr-9eH.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function SettingsPage() {
	const store = useApp();
	const { year, setYear, addYear, removeYear, people, replacePeople, resetToSeed, clearAll, attendance } = store;
	const years = derivedYears(store);
	const [custom, setCustom] = import_react.useState(nextYear(years));
	const [wage, setWage] = import_react.useState(200);
	const [monthWage, setMonthWage] = import_react.useState(8e3);
	const [payType, setPayType] = import_react.useState("day");
	const [rule, setRule] = import_react.useState("按小时:25");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-3xl space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: "设置"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "年度、访问密码、批量工资。反代到公网请先设密码。"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountsCard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinUpdate, { compact: true }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MembersCard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordCard, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
				perm: "settings.year",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "已展开的年度"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: [
								"当前工作年 ",
								year,
								"。新增年份不会改人员。删除年份只去掉该年考勤，人员、照片、发放记录保留。至少留一年。"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-2",
							children: years.map((y) => {
								const filled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, y, i + 1).filled > 0).filter(Boolean).length;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: "text-left text-sm",
										onClick: () => setYear(y),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-medium",
											children: [y, " 年"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "ml-2 text-xs text-muted",
											children: [
												filled,
												"/12 月已录",
												y === year ? " · 当前" : ""
											]
										})]
									}), years.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										onClick: async () => {
											if (!confirmRemoveYear(y, filled)) return;
											try {
												if (nasEnabled()) await pushNasBackup();
											} catch {}
											removeYear(y);
											toast.success(`已删除 ${y} 年考勤。人员与发放记录仍在。`);
										},
										children: "删除"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-subtle",
										children: "至少留一年"
									})]
								}, y);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									className: "w-28",
									value: custom,
									onChange: (e) => setCustom(Number(e.target.value)),
									"aria-label": "要新增的年份"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => {
										if (custom < 2e3 || custom > 2100) {
											toast.error("请输入 2000–2100 的年份");
											return;
										}
										const created = addYear(custom);
										toast.success(`${created} 年已展开`);
										setCustom(created + 1);
									},
									children: "展开该年"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => {
										const created = addYear();
										toast.success(`${created} 年已展开`);
										setCustom(created + 1);
									},
									children: "新增下一年"
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
				perm: "settings.rules",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "批量工资 / 加班规则"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "勾选人再应用。计薪选按工天或按月。加班选按小时或按折算。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BatchRules, {
							people,
							replacePeople,
							wage,
							setWage,
							monthWage,
							setMonthWage,
							payType,
							setPayType,
							rule,
							setRule
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Can, {
				perm: "settings.data",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "数据"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: ["清空后用模板自己导入。也可以恢复为 2 个示例人员，用来核对功能。", nasEnabled() ? " 全部个人数据只在 NAS 的 data 目录：accounts、books、photos、backups、templates。软件删了重装，只要 data 还在就能恢复。" : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [
								nasEnabled() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									onClick: async () => {
										try {
											const fname = await pushNasBackup();
											toast.success(`已备份到 data/backups/${fname}`);
										} catch {
											toast.error("备份失败");
										}
									},
									children: "立即备份 Excel"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "danger",
									type: "button",
									onClick: async () => {
										if (!confirm("确定清空全部人员、考勤、发放和照片？")) return;
										clearAll();
										await clearAllPhotos();
										toast.success("已清空");
									},
									children: "清空全部数据"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									type: "button",
									onClick: () => {
										if (confirm("确定恢复 2 个示例人员？当前人员、考勤、发放会被覆盖。")) {
											resetToSeed();
											toast.success("已放入张三、李四两个虚构示例");
										}
									},
									children: "恢复 2 个示例"
								})
							]
						})
					]
				})
			})
		]
	});
}
function PasswordCard() {
	const accessHash = useApp((s) => s.accessHash);
	const setAccessHash = useApp((s) => s.setAccessHash);
	const [current, setCurrent] = import_react.useState("");
	const [next, setNext] = import_react.useState("");
	const [again, setAgain] = import_react.useState("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "访问密码"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: ["第一次到「设置」里设密码。设好后打开页面要登录；勾了「本机记住」就不用每次输。以后要换密码：先填当前密码，再填新密码两次，点「修改密码」。", accessHash ? " 当前已开启。" : " 当前未设，任何人打开链接都能进。"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3",
				children: [
					accessHash ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gate-current",
						children: "当前密码"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "gate-current",
						className: "mt-1",
						type: "password",
						value: current,
						onChange: (e) => setCurrent(e.target.value)
					})] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gate-next",
						children: accessHash ? "新密码" : "设置密码"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "gate-next",
						className: "mt-1",
						type: "password",
						value: next,
						onChange: (e) => setNext(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gate-again",
						children: "再输一次"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "gate-again",
						className: "mt-1",
						type: "password",
						value: again,
						onChange: (e) => setAgain(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: async () => {
								if (accessHash) {
									if (await hashPassword(current) !== accessHash) {
										toast.error("当前密码不对");
										return;
									}
								}
								if (next.trim().length < 4) {
									toast.error("密码至少 4 位");
									return;
								}
								if (next !== again) {
									toast.error("两次输入不一致");
									return;
								}
								const hash = await hashPassword(next);
								setAccessHash(hash);
								unlockGate(hash, true);
								toast.success("访问密码已保存");
								setCurrent("");
								setNext("");
								setAgain("");
							},
							children: accessHash ? "修改密码" : "开启密码"
						}), accessHash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: async () => {
								if (await hashPassword(current) !== accessHash) {
									toast.error("关闭前请输入当前密码");
									return;
								}
								setAccessHash("");
								lockGate();
								toast.success("已关闭访问密码");
								setCurrent("");
							},
							children: "关闭密码"
						}) : null]
					})
				]
			})
		]
	});
}
function MembersCard() {
	const [ready, setReady] = import_react.useState(false);
	const [members, setMembers] = import_react.useState([]);
	const [users, setUsers] = import_react.useState([]);
	const [me, setMe] = import_react.useState(null);
	const [bookId, setBookId] = import_react.useState("");
	const [pick, setPick] = import_react.useState("");
	const [preset, setPreset] = import_react.useState("read");
	const [editId, setEditId] = import_react.useState("");
	const [checks, setChecks] = import_react.useState([]);
	const managePerm = useCan("members.manage");
	async function load() {
		const s = await authStatus();
		setMe(s.user);
		setBookId(s.bookId);
		setMembers(s.members || []);
		setUsers(s.users || []);
		setReady(true);
	}
	import_react.useEffect(() => {
		load();
	}, []);
	if (!ready || !me) return null;
	if (!(me.role === "admin" || members.some((m) => m.isOwner && m.userId === me.id) || managePerm)) return null;
	const others = users.filter((u) => !members.some((m) => m.userId === u.id));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-line bg-surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "这套台账的成员"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "管理员和创建人可以把别人加进来一起管。权限尽量勾细：只能看、能改、能删分开。"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 space-y-2",
				children: members.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-md border border-line px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							m.name || m.username,
							" · ",
							m.username,
							m.isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-1 text-xs text-muted",
								children: "创建人"
							}) : null
						] }), !m.isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "sm",
								type: "button",
								onClick: () => {
									setEditId(m.userId);
									setChecks(m.perms.includes("*") ? [...PERM_GROUPS.flatMap((g) => g.items.map((i) => i.id))] : m.perms);
								},
								children: "编辑权限"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								type: "button",
								onClick: async () => {
									if (!confirm(`把 ${m.name} 移出这套台账？`)) return;
									await authOp("removeMember", {
										id: bookId,
										userId: m.userId
									});
									await load();
									toast.success("已移除");
								},
								children: "删除"
							})]
						}) : null]
					}), editId === m.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemberChecks, {
						checks,
						setChecks,
						onSave: async () => {
							await authOp("setMember", {
								id: bookId,
								userId: m.userId,
								perms: checks.join(",")
							});
							setEditId("");
							await load();
							toast.success("权限已保存");
						},
						onCancel: () => setEditId("")
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-xs text-muted",
						children: m.isOwner || m.perms.includes("*") ? "全部权限" : m.perms.length ? m.perms.join("、") : "无"
					})]
				}, m.userId))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-2 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "field-select h-10",
						value: pick,
						onChange: (e) => setPick(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "选择用户加入"
						}), others.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: u.id,
							children: [
								u.name,
								" · ",
								u.username
							]
						}, u.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select h-10",
						value: preset,
						onChange: (e) => setPreset(e.target.value),
						children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: p.id,
							children: [
								p.label,
								"（",
								p.hint,
								"）"
							]
						}, p.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: async () => {
							if (!pick) return;
							await authOp("addMember", {
								id: bookId,
								userId: pick,
								preset
							});
							setPick("");
							await load();
							toast.success("已加入这套台账");
						},
						children: "加入"
					})
				]
			})
		]
	});
}
function MemberChecks({ checks, setChecks, onSave, onCancel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-3",
		children: [PERM_GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-xs font-medium text-muted",
			children: g.label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-1 flex flex-wrap gap-3",
			children: g.items.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "inline-flex items-center gap-1 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: checks.includes(i.id),
					onChange: (e) => {
						setChecks(e.target.checked ? [...checks, i.id] : checks.filter((x) => x !== i.id));
					}
				}), i.label]
			}, i.id))
		})] }, g.key)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				type: "button",
				onClick: onSave,
				children: "保存权限"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				type: "button",
				onClick: onCancel,
				children: "取消"
			})]
		})]
	});
}
function AccountsCard() {
	const [ready, setReady] = import_react.useState(false);
	const [persist, setPersist] = import_react.useState(false);
	const [me, setMe] = import_react.useState(null);
	const [books, setBooks] = import_react.useState([]);
	const [users, setUsers] = import_react.useState([]);
	const [bookName, setBookName] = import_react.useState("");
	const [renaming, setRenaming] = import_react.useState("");
	const [renameTo, setRenameTo] = import_react.useState("");
	const [uName, setUName] = import_react.useState("");
	const [uUser, setUUser] = import_react.useState("");
	const [uPwd, setUPwd] = import_react.useState("");
	const [joinCur, setJoinCur] = import_react.useState(true);
	const [joinPreset, setJoinPreset] = import_react.useState("read");
	const [resets, setResets] = import_react.useState({});
	const [edits, setEdits] = import_react.useState({});
	const [oldPwd, setOldPwd] = import_react.useState("");
	const [newPwd, setNewPwd] = import_react.useState("");
	async function load() {
		const s = await authStatus();
		setPersist(s.persist);
		setMe(s.user);
		setBooks(s.books);
		setUsers(s.users || []);
		setEdits(Object.fromEntries((s.users || []).map((u) => [u.id, {
			name: u.name,
			username: u.username
		}])));
		setReady(true);
	}
	import_react.useEffect(() => {
		load();
	}, []);
	if (!ready || !persist || !me) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: me.role === "admin" ? "全部台账" : "我的台账"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							me.role === "admin" ? "管理员能看见并进入任何一套，改数据、改名都可以。" : "一套台账一套数据。",
							"当前登录：",
							me.name,
							"（",
							me.username,
							"）"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2 text-sm",
						children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2",
							children: renaming === b.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 flex-1 flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: "h-9 max-w-xs",
										value: renameTo,
										onChange: (e) => setRenameTo(e.target.value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										type: "button",
										onClick: async () => {
											try {
												const name = renameTo.trim();
												if (!name) return;
												await authOp("renameBook", {
													id: b.id,
													name
												});
												setRenaming("");
												await load();
												window.dispatchEvent(new CustomEvent("gongdi-book", { detail: name }));
												window.dispatchEvent(new Event("gongdi-books"));
												toast.success(`已改成「${name}」`);
											} catch (err) {
												toast.error(err instanceof Error ? err.message : "改名失败");
											}
										},
										children: "保存"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										type: "button",
										onClick: () => setRenaming(""),
										children: "取消"
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								b.name,
								b.id === "default" ? " · 原数据" : "",
								me.role === "admin" && b.ownerId && b.ownerId !== me.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-1 text-xs text-muted",
									children: ["· ", users.find((u) => u.id === b.ownerId)?.name || "他人"]
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										type: "button",
										onClick: async () => {
											await authOp("useBook", { id: b.id });
											window.dispatchEvent(new CustomEvent("gongdi-book", { detail: b.name }));
											window.dispatchEvent(new Event("gongdi-books"));
											await pullNasLedger();
											toast.success(`已进入「${b.name}」`);
										},
										children: "进入"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										type: "button",
										onClick: () => {
											setRenaming(b.id);
											setRenameTo(b.name);
										},
										children: "改名"
									}),
									b.id !== "default" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "ghost",
										size: "sm",
										type: "button",
										onClick: async () => {
											if (!confirm(`删除台账「${b.name}」？该套数据会删掉。`)) return;
											await authOp("deleteBook", { id: b.id });
											await load();
											window.dispatchEvent(new Event("gongdi-books"));
											await pullNasLedger();
											toast.success("已删除这套台账");
										},
										children: "删除"
									}) : null
								]
							})] })
						}, b.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-xs",
							value: bookName,
							onChange: (e) => setBookName(e.target.value),
							placeholder: "新台账名称，如 二工地"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							onClick: async () => {
								if (!bookName.trim()) return;
								await authOp("createBook", { name: bookName.trim() });
								setBookName("");
								await load();
								await pullNasLedger();
								toast.success("已新建空台账，可在左侧切换");
							},
							children: "新建台账"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: "修改我的密码"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid gap-3 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "当前密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: oldPwd,
							onChange: (e) => setOldPwd(e.target.value)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "新密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: newPwd,
							onChange: (e) => setNewPwd(e.target.value)
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3",
						type: "button",
						onClick: async () => {
							await authOp("changePassword", {
								old: oldPwd,
								password: newPwd
							});
							setOldPwd("");
							setNewPwd("");
							toast.success("密码已改");
						},
						children: "保存新密码"
					})
				]
			}),
			me.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: "账户"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "新建账户默认不给自己的空台账。勾选后加入你当前这套，也可以之后在「成员」里加。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "显示名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								value: uName,
								onChange: (e) => setUName(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "登录名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								value: uUser,
								onChange: (e) => setUUser(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "初始密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								type: "password",
								value: uPwd,
								onChange: (e) => setUPwd(e.target.value)
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: joinCur,
							onChange: (e) => setJoinCur(e.target.checked)
						}), " 同时加入当前这套台账"]
					}),
					joinCur ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select mt-2 h-10 max-w-xs",
						value: joinPreset,
						onChange: (e) => setJoinPreset(e.target.value),
						children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: p.id,
							children: [
								p.label,
								"（",
								p.hint,
								"）"
							]
						}, p.id))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3",
						type: "button",
						onClick: async () => {
							try {
								if (!uUser.trim() || uPwd.trim().length < 4) {
									toast.error("登录名必填，密码至少 4 位");
									return;
								}
								setUsers((await authOp("createUser", {
									name: uName || uUser,
									username: uUser,
									password: uPwd,
									joinCurrent: joinCur ? "1" : "0",
									preset: joinPreset
								})).users || []);
								setUName("");
								setUUser("");
								setUPwd("");
								toast.success(joinCur ? "账户已建，并加入当前台账" : "账户已建，还没有台账，需要在成员里加");
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "新建失败");
							}
						},
						children: "新建账户"
					}),
					users.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-3",
						children: users.map((u) => {
							const ed = edits[u.id] || {
								name: u.name,
								username: u.username
							};
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "space-y-2 rounded-md border border-line px-3 py-3 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted",
											children: u.role === "admin" ? "管理员" : "用户"
										}), u.disabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted",
											children: "已停用"
										}) : null]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "显示名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1 h-9",
											value: ed.name,
											onChange: (e) => setEdits((s) => ({
												...s,
												[u.id]: {
													...ed,
													name: e.target.value
												}
											}))
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "登录名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											className: "mt-1 h-9",
											value: ed.username,
											onChange: (e) => setEdits((s) => ({
												...s,
												[u.id]: {
													...ed,
													username: e.target.value
												}
											}))
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											type: "button",
											onClick: async () => {
												try {
													await authOp("updateUser", {
														id: u.id,
														name: ed.name,
														username: ed.username
													});
													await load();
													toast.success("资料已保存");
												} catch (err) {
													toast.error(err instanceof Error ? err.message : "保存失败");
												}
											},
											children: "保存资料"
										}), u.id !== me.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												className: "h-9 max-w-36",
												type: "password",
												placeholder: "新密码",
												value: resets[u.id] || "",
												onChange: (e) => setResets((s) => ({
													...s,
													[u.id]: e.target.value
												}))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												type: "button",
												onClick: async () => {
													const password = (resets[u.id] || "").trim();
													if (password.length < 4) {
														toast.error("新密码至少 4 位");
														return;
													}
													try {
														await authOp("resetPassword", {
															id: u.id,
															password
														});
														setResets((s) => ({
															...s,
															[u.id]: ""
														}));
														toast.success(`已重置 ${ed.name || u.name} 的密码`);
													} catch (err) {
														toast.error(err instanceof Error ? err.message : "失败");
													}
												},
												children: "重置密码"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "outline",
												size: "sm",
												type: "button",
												onClick: async () => {
													try {
														await authOp("setDisabled", {
															id: u.id,
															disabled: u.disabled ? "0" : "1"
														});
														await load();
														toast.success(u.disabled ? "已启用" : "已停用");
													} catch (err) {
														toast.error(err instanceof Error ? err.message : "失败");
													}
												},
												children: u.disabled ? "启用" : "停用"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "sm",
												type: "button",
												onClick: async () => {
													if (!confirm(`删除账户「${u.name}」？他名下自建的台账也会删（默认台账保留）。`)) return;
													try {
														await authOp("deleteUser", { id: u.id });
														await load();
														toast.success("账户已删除");
													} catch (err) {
														toast.error(err instanceof Error ? err.message : "删除失败");
													}
												},
												children: "删除"
											})
										] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-subtle",
											children: "自己的密码在上面改"
										})]
									})
								]
							}, u.id);
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "还没有列出其他账户。新建后会出现在这里。"
					})
				]
			}) : null
		]
	});
}
function BatchRules({ people, replacePeople, wage, setWage, monthWage, setMonthWage, payType, setPayType, rule, setRule }) {
	const teams = import_react.useMemo(() => ["全部", ...new Set(people.map((p) => p.team).filter(Boolean))], [people]);
	const [team, setTeam] = import_react.useState("全部");
	const [q, setQ] = import_react.useState("");
	const [ids, setIds] = import_react.useState([]);
	const visible = people.filter((p) => {
		if (team !== "全部" && p.team !== team) return false;
		if (q.trim() && !p.name.includes(q.trim()) && !p.team.includes(q.trim())) return false;
		return true;
	});
	const visibleIds = visible.map((p) => p.id);
	const selectedVisible = ids.filter((id) => visibleIds.includes(id));
	function apply(idsToUse, onlyBlank) {
		if (!idsToUse.length) {
			toast.error("请先勾选人员");
			return;
		}
		const set = new Set(idsToUse);
		let n = 0;
		replacePeople(people.map((p) => {
			if (!set.has(p.id)) return p;
			if (onlyBlank && (payType === "month" ? p.monthWage : p.dailyWage)) return p;
			n += 1;
			return payType === "month" ? {
				...p,
				payType: "month",
				monthWage,
				otRule: rule
			} : {
				...p,
				payType: "day",
				dailyWage: wage,
				otRule: rule
			};
		}));
		toast.success(`已更新 ${n} 人`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 grid gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "计薪方式" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PayTypePick, {
							value: payType,
							onChange: setPayType
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: payType === "month" ? "月工资" : "日工资" }), payType === "month" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "number",
						value: monthWage,
						onChange: (e) => setMonthWage(Number(e.target.value) || 0)
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "number",
						value: wage,
						onChange: (e) => setWage(Number(e.target.value) || 0)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "加班规则" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OtRulePick, {
								value: rule,
								onChange: setRule
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "max-w-xs",
						placeholder: "搜索姓名",
						value: q,
						onChange: (e) => setQ(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select w-auto",
						value: team,
						onChange: (e) => setTeam(e.target.value),
						children: teams.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: t }, t))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: () => setIds([...new Set([...ids, ...visibleIds])]),
						children: "全选当前列表"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: () => setIds(ids.filter((id) => !visibleIds.includes(id))),
						children: "取消当前列表"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-56 overflow-auto rounded-md border border-line",
				children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "p-3 text-sm text-muted",
					children: "没有人员。先在人员表添加或导入。"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "divide-y divide-line text-sm",
					children: visible.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "size-4",
								checked: ids.includes(p.id),
								onChange: (e) => setIds((s) => e.target.checked ? [...s, p.id] : s.filter((id) => id !== p.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: p.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: p.team || "无班组"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-auto tabular-nums text-xs text-muted",
								children: [
									wageLabel(p),
									" · ",
									parseOtRule(p.otRule).label
								]
							})
						]
					}, p.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted",
				children: [
					"已选 ",
					ids.length,
					" 人（当前列表中 ",
					selectedVisible.length,
					" 人）"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => apply(ids, false),
						children: "应用到所选"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: () => apply(ids, true),
						children: "只填所选里的空白"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: () => apply(people.map((p) => p.id), false),
						children: "应用到所有人"
					})
				]
			})
		]
	});
}
export { SettingsPage as component };
