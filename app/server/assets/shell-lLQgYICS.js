import { a as can, l as setLivePerms, n as NAV_PERM, u as subscribePerms } from "./perms-DQTE-mZW.js";
import { t as cn } from "./utils-CBhPqRT8.js";
import { a as lockGate, i as hashPassword, n as authStatus, o as unlockGate, r as gateUnlocked, t as authOp } from "./auth-eu_OLOze.js";
import { d as confirmRemoveYear, h as nextYear, m as monthStatus } from "./contracts-BSLoZOKY.js";
import { t as useApp } from "./store-CJN683BW.js";
import { n as nasEnabled, r as pullNasLedger } from "./nas-sync-Y5Puwv5e.js";
import { t as Button } from "./button-Zdwj1dRR.js";
import { n as Label, t as Input } from "./input-D73Q2_mj.js";
import * as React from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Banknote, CalendarDays, Camera, ChevronLeft, ChevronRight, ClipboardList, FileText, FolderOpen, History, LayoutDashboard, LogOut, Menu, Plus, Settings, Trash2, Upload, Users, X } from "lucide-react";
import { toast } from "sonner";
var VER = /^\[?(v?\d+(?:\.\d+){0,3})\]?\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})?\s*$/i;
function normalizeVersion(v) {
	const s = String(v || "").trim().replace(/^v/i, "").replace(/\s+\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s*$/, "").split(/\s+/)[0] || "";
	if (!s) return "0.0.0";
	if (/^\d+$/.test(s)) return Number(s) >= 10 ? `0.0.${s}` : `${s}.0.0`;
	return s;
}
function formatVersion(v) {
	const n = normalizeVersion(v);
	if (n.startsWith("0.0.") && Number(n.slice(4)) >= 10) return n.slice(4);
	return n;
}
function formatReleaseDate(s) {
	const m = String(s || "").match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
	if (!m) return "";
	return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}
function parseChangelog(text) {
	const lines = text.replace(/^﻿/, "").split(/\r?\n/);
	const entries = [];
	let current = "";
	let currentDate = "";
	let block = null;
	let sawCurrentLine = false;
	for (const raw of lines) {
		const line = raw.trim();
		if (!line || line.startsWith("#") || line.startsWith("当前")) continue;
		const m = line.match(VER);
		if (m && line.length < 36) {
			const version = normalizeVersion(m[1]);
			const date = formatReleaseDate(m[2] || "");
			const bracket = line.startsWith("[");
			if (!current) current = version;
			if (date && !currentDate) currentDate = date;
			if (!bracket && !sawCurrentLine) {
				sawCurrentLine = true;
				if (date && !currentDate) currentDate = date;
				continue;
			}
			sawCurrentLine = true;
			if (block && block.version === version) {
				if (date && !block.date) block.date = date;
				continue;
			}
			if (block) entries.push(block);
			block = {
				version,
				date,
				items: []
			};
			continue;
		}
		if (!block) {
			if (!current) current = line;
			continue;
		}
		block.items.push(line.replace(/^[-*·]\s*/, ""));
	}
	if (block) entries.push(block);
	const merged = [];
	for (const e of entries) {
		const last = merged[merged.length - 1];
		if (last && last.version === e.version) {
			last.items.push(...e.items);
			if (e.date && !last.date) last.date = e.date;
		} else merged.push({
			version: e.version,
			date: e.date || "",
			items: [...e.items]
		});
	}
	if (!current && merged[0]) current = merged[0].version;
	if (!currentDate && merged[0]) currentDate = merged[0].date || "";
	return {
		current: current || "1.0.2",
		date: currentDate,
		entries: merged
	};
}
var APP_NAME = "台账";
var NAV = [
	{
		to: "/",
		label: "总览",
		icon: LayoutDashboard
	},
	{
		to: "/people",
		label: "人员",
		icon: Users
	},
	{
		to: "/attendance",
		label: "月度考勤",
		icon: CalendarDays
	},
	{
		to: "/payments",
		label: "发放记录",
		icon: Banknote
	},
	{
		to: "/contracts",
		label: "合同管理",
		icon: FileText
	},
	{
		to: "/expenses",
		label: "报销单",
		icon: FileText
	},
	{
		to: "/photos",
		label: "照片",
		icon: Camera
	},
	{
		to: "/files",
		label: "影像资料",
		icon: FolderOpen
	},
	{
		to: "/query",
		label: "个人查询",
		icon: ClipboardList
	},
	{
		to: "/audit",
		label: "操作记录",
		icon: History
	},
	{
		to: "/import",
		label: "导入导出",
		icon: Upload
	},
	{
		to: "/settings",
		label: "设置",
		icon: Settings
	}
];
var TABS = [
	{
		to: "/",
		label: "总览",
		icon: LayoutDashboard
	},
	{
		to: "/attendance",
		label: "考勤",
		icon: CalendarDays
	},
	{
		to: "/contracts",
		label: "合同",
		icon: FileText
	},
	{
		to: "/expenses",
		label: "报销",
		icon: FileText
	},
	{
		to: "/query",
		label: "查询",
		icon: ClipboardList
	}
];
function useHydrateStore() {
	React.useEffect(() => {
		(async () => {
			try {
				await useApp.persist.rehydrate();
			} catch {}
			try {
				const { startNasSync } = await import("./nas-sync-D8mNZlyQ.js");
				await startNasSync();
			} catch {}
			const add = Number(new URLSearchParams(window.location.search).get("addYear") || 0);
			if (add >= 2e3 && add <= 2100) {
				useApp.getState().addYear(add);
				window.history.replaceState(null, "", window.location.pathname);
			}
		})();
	}, []);
}
function YearSwitcher({ compact }) {
	const year = useApp((s) => s.year);
	const years = useApp((s) => s.years);
	const setYear = useApp((s) => s.setYear);
	const addYear = useApp((s) => s.addYear);
	const removeYear = useApp((s) => s.removeYear);
	const attendance = useApp((s) => s.attendance);
	const list = years?.length ? years : [year || 2026];
	const idx = Math.max(0, list.indexOf(year));
	const prev = list[idx - 1];
	const nxt = list[idx + 1];
	const upcoming = nextYear(list);
	function addNext() {
		const created = addYear(upcoming);
		toast.success(`${created} 年已展开`);
	}
	async function dropYear(y) {
		if (list.length <= 1) {
			toast.error("至少保留一年，不能删光");
			return;
		}
		const filled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, y, i + 1).filled > 0).filter(Boolean).length;
		if (!confirmRemoveYear(y, filled)) return;
		try {
			if (nasEnabled()) await pullNasLedger();
		} catch {}
		removeYear(y);
		toast.success(`已删除 ${y} 年考勤。人员、照片、发放记录都还在。`);
	}
	if (compact) return /* @__PURE__ */ jsx("select", {
		className: "field-select h-9 max-w-[8.5rem] shrink-0 text-sm",
		value: year,
		onChange: (e) => setYear(Number(e.target.value)),
		"aria-label": "选择年度",
		children: list.map((y) => /* @__PURE__ */ jsxs("option", {
			value: y,
			children: [y, "年"]
		}, y))
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-4 space-y-2",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !prev,
						type: "button",
						onClick: () => prev && setYear(prev),
						children: /* @__PURE__ */ jsx(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ jsx("select", {
						className: "field-select h-9 min-w-0 flex-1",
						value: year,
						onChange: (e) => setYear(Number(e.target.value)),
						"aria-label": "选择年度",
						children: list.map((y) => /* @__PURE__ */ jsxs("option", {
							value: y,
							children: [y, " 年"]
						}, y))
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !nxt,
						type: "button",
						onClick: () => nxt && setYear(nxt),
						children: /* @__PURE__ */ jsx(ChevronRight, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-accent hover:text-ink",
				onClick: addNext,
				children: [
					/* @__PURE__ */ jsx(Plus, { className: "size-3.5" }),
					" 新增 ",
					upcoming,
					" 年"
				]
			}),
			list.length > 1 ? /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-danger hover:text-danger",
				onClick: () => dropYear(year),
				children: [
					/* @__PURE__ */ jsx(Trash2, { className: "size-3.5" }),
					" 删除 ",
					year,
					" 年"
				]
			}) : null
		]
	});
}
function BookSwitcher({ compact }) {
	const [books, setBooks] = React.useState([]);
	const [bookId, setBookId] = React.useState("");
	const [user, setUser] = React.useState(null);
	const [name, setName] = React.useState("");
	const [adding, setAdding] = React.useState(false);
	const [renaming, setRenaming] = React.useState(false);
	const [renameTo, setRenameTo] = React.useState("");
	async function load() {
		const s = await authStatus();
		if (!s.persist || !s.user) {
			setBooks([]);
			setUser(null);
			return;
		}
		setBooks(s.books);
		setBookId(s.bookId);
		setUser(s.user);
		const n = s.books.find((b) => b.id === s.bookId)?.name || "";
		window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
		setLivePerms(s.persist ? s.perms || [] : ["*"]);
	}
	React.useEffect(() => {
		load();
		const on = () => void load();
		window.addEventListener("gongdi-books", on);
		return () => window.removeEventListener("gongdi-books", on);
	}, []);
	if (!user || !books.length) return null;
	async function switchTo(id) {
		if (id === bookId) return;
		await authOp("useBook", { id });
		setBookId(id);
		const n = books.find((b) => b.id === id)?.name || id;
		window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
		const s = await authStatus();
		setLivePerms(s.persist ? s.perms || [] : ["*"]);
		await pullNasLedger();
		toast.success(`已切换到「${n}」`);
	}
	if (compact) return /* @__PURE__ */ jsx("select", {
		className: "field-select h-9 max-w-[9rem] text-sm",
		value: bookId,
		onChange: (e) => void switchTo(e.target.value),
		children: books.map((b) => /* @__PURE__ */ jsx("option", {
			value: b.id,
			children: b.name
		}, b.id))
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-3 space-y-2",
		children: [
			/* @__PURE__ */ jsx("select", {
				className: "field-select h-9 w-full text-sm",
				value: bookId,
				onChange: (e) => void switchTo(e.target.value),
				"aria-label": "当前台账",
				children: books.map((b) => /* @__PURE__ */ jsx("option", {
					value: b.id,
					children: b.name
				}, b.id))
			}),
			user.role === "admin" ? /* @__PURE__ */ jsx("div", {
				className: "text-[11px] text-muted",
				children: "管理员可进入全部台账"
			}) : null,
			renaming ? /* @__PURE__ */ jsxs("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ jsx(Input, {
					className: "h-9",
					value: renameTo,
					onChange: (e) => setRenameTo(e.target.value),
					placeholder: "台账名称"
				}), /* @__PURE__ */ jsx(Button, {
					size: "sm",
					type: "button",
					onClick: async () => {
						const n = renameTo.trim();
						if (!n) return;
						try {
							await authOp("renameBook", {
								id: bookId,
								name: n
							});
							setRenaming(false);
							await load();
							window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
							toast.success(`已改成「${n}」`);
						} catch (err) {
							toast.error(err instanceof Error ? err.message : "改名失败");
						}
					},
					children: "保存"
				})]
			}) : adding ? /* @__PURE__ */ jsxs("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ jsx(Input, {
					className: "h-9",
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "新台账名称"
				}), /* @__PURE__ */ jsx(Button, {
					size: "sm",
					type: "button",
					onClick: async () => {
						if (!name.trim()) return;
						const r = await authOp("createBook", { name: name.trim() });
						setName("");
						setAdding(false);
						await load();
						if (r.bookId) {
							await pullNasLedger();
							toast.success("已新建空台账");
						}
					},
					children: "建"
				})]
			}) : /* @__PURE__ */ jsxs("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					className: "text-xs text-muted hover:text-ink",
					onClick: () => setAdding(true),
					children: "＋ 新建一套台账"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					className: "text-xs text-muted hover:text-ink",
					onClick: () => {
						setRenameTo(books.find((b) => b.id === bookId)?.name || "");
						setRenaming(true);
					},
					children: "改名"
				})]
			})
		]
	});
}
function WhoCard({ who }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-4 rounded-lg border border-line bg-surface px-3 py-2",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "text-[10px] tracking-wide text-muted",
				children: "当前账户"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "truncate font-medium",
				children: who.name || who.username
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "truncate text-[11px] text-muted",
				children: [
					who.username,
					" ",
					who.role === "admin" ? "· 管理员" : "· 用户"
				]
			})
		]
	});
}
function WinUpdate({ compact }) {
	const [info, setInfo] = React.useState(null);
	const [busy, setBusy] = React.useState(false);
	async function load(fresh) {
		try {
			const d = await (await fetch(fresh ? "/api/update?fresh=1" : "/api/update", {
				cache: "no-store",
				signal: AbortSignal.timeout(2e4)
			})).json();
			setInfo(d);
			return d;
		} catch {
			setInfo({ error: "检查失败" });
			return null;
		}
	}
	React.useEffect(() => {
		load(true);
	}, []);
	async function waitRestart() {
		for (let i = 0; i < 40; i++) {
			await new Promise((r) => setTimeout(r, 3e3));
			try {
				if ((await fetch("/api/version", { cache: "no-store" })).ok) {
					location.reload();
					return;
				}
			} catch {}
		}
		location.reload();
	}
	async function apply() {
		const docker = info?.mode === "docker";
		if (!confirm(docker ? "将拉取新镜像并重启容器。data 台账不会动。大约一两分钟。" : "将下载新版本并重启。data 台账不会动。")) return;
		setBusy(true);
		try {
			const r = await fetch("/api/update", { method: "POST" });
			const d = await r.json();
			if (!r.ok || d.error) {
				toast.error(d.error || "更新失败");
				setBusy(false);
				return;
			}
			toast.success("正在更新并重启…");
			waitRestart();
		} catch {
			toast.error("更新失败");
			setBusy(false);
		}
	}
	const desc = info?.mode === "windows" ? "从 GitHub 下载 Windows 包并替换程序。data 不覆盖。" : info?.mode === "docker" ? "GitHub 有新版时点更新，会拉镜像并重启。data 台账不会动。" : "GitHub 有新版会在这里提醒。飞牛第一次请先运行一次「一键拉取」，以后就能点更新。";
	const status = !info ? "检查中…" : info.error && !info.remote ? info.error : info.canApply ? "" : info.hint || info.error || (info.newer ? "有新版本，请先在飞牛运行一次一键拉取" : "已是最新");
	return /* @__PURE__ */ jsxs("div", {
		className: compact ? "mt-3" : "rounded-xl border border-line bg-surface p-5",
		children: [
			compact ? null : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("h2", {
				className: "font-semibold",
				children: "软件更新"
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-sm text-muted",
				children: desc
			})] }),
			/* @__PURE__ */ jsxs("div", {
				className: `flex flex-wrap items-center gap-2 ${compact ? "" : "mt-3"}`,
				children: [/* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					disabled: busy,
					onClick: () => void load(true),
					children: "检查更新"
				}), info?.canApply ? /* @__PURE__ */ jsx(Button, {
					type: "button",
					size: "sm",
					disabled: busy,
					onClick: () => void apply(),
					children: busy ? "更新中…" : `更新到 ${formatVersion(info.remote)}`
				}) : /* @__PURE__ */ jsx("span", {
					className: "text-xs text-muted",
					children: status
				})]
			}),
			info?.hint && info.canApply ? /* @__PURE__ */ jsx("p", {
				className: "mt-2 text-xs text-subtle",
				children: info.hint
			}) : null,
			info?.remote ? /* @__PURE__ */ jsxs("p", {
				className: "mt-2 text-xs text-subtle",
				children: [
					"GitHub ",
					formatVersion(info.remote),
					" · 本机 ",
					formatVersion(info.local || "")
				]
			}) : null
		]
	});
}
var FALLBACK = {
	current: "1.0.2",
	entries: [{
		version: "1.0.2",
		items: ["点此查看更新记录"]
	}]
};
function VersionLog() {
	const [log, setLog] = React.useState(FALLBACK);
	const [open, setOpen] = React.useState(false);
	const [hasNew, setHasNew] = React.useState(false);
	React.useEffect(() => {
		fetch("/api/version").then((r) => r.json()).then((d) => {
			if (d?.current) setLog(d);
		}).catch(() => void 0);
		fetch("/api/update", { cache: "no-store" }).then((r) => r.json()).then((d) => {
			if (d?.newer) setHasNew(true);
		}).catch(() => void 0);
	}, []);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("button", {
		type: "button",
		className: "text-xs text-muted hover:text-ink",
		onClick: () => setOpen(true),
		children: [
			"版本号：",
			/* @__PURE__ */ jsxs("span", {
				className: "tabular-nums",
				children: [
					formatVersion(log.current),
					" ",
					log.date ? ` ${log.date}` : ""
				]
			}),
			hasNew ? /* @__PURE__ */ jsx("span", {
				className: "ml-2 text-xs font-normal text-ok",
				children: "有新版本"
			}) : null
		]
	}), open ? /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
		onClick: () => setOpen(false),
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "font-display text-lg font-semibold",
						children: "更新记录"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "text-sm text-muted hover:text-ink",
						onClick: () => setOpen(false),
						children: "关闭"
					})]
				}),
				/* @__PURE__ */ jsx(WinUpdate, { compact: true }),
				/* @__PURE__ */ jsx("ol", {
					className: "mt-4 space-y-4",
					children: log.entries.slice(0, 10).map((e, i) => /* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsxs("div", {
						className: "text-sm font-semibold",
						children: [
							formatVersion(e.version),
							" ",
							e.date ? ` ${e.date}` : "",
							e.version === log.current ? /* @__PURE__ */ jsx("span", {
								className: "ml-2 text-xs font-normal text-ok",
								children: "当前"
							}) : null
						]
					}), e.items.length ? /* @__PURE__ */ jsx("ul", {
						className: "mt-1 list-disc space-y-1 pl-5 text-sm text-muted",
						children: e.items.map((item) => /* @__PURE__ */ jsx("li", { children: item }, item))
					}) : /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-sm text-subtle",
						children: "（无说明）"
					})] }, `${e.version}-${i}`))
				})
			]
		})
	}) : null] });
}
function Brand({ year, compact, pathname }) {
	const section = (NAV.find((n) => n.to === pathname) || NAV.find((n) => n.to !== "/" && pathname.startsWith(n.to)))?.label || "总览";
	const [book, setBook] = React.useState("");
	React.useEffect(() => {
		function apply(name) {
			setBook(name);
		}
		authStatus().then((s) => {
			apply(s.books.find((b) => b.id === s.bookId)?.name || "");
		});
		const on = (e) => apply(e.detail || "");
		window.addEventListener("gongdi-book", on);
		return () => window.removeEventListener("gongdi-book", on);
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ jsx("div", {
			className: cn("font-display truncate font-semibold tracking-tight", compact ? "text-base" : "text-lg"),
			children: book || APP_NAME
		}), !compact ? /* @__PURE__ */ jsxs("div", {
			className: "mt-0.5 truncate text-xs text-muted",
			children: [
				year,
				" · ",
				section
			]
		}) : null]
	});
}
function NavLink({ to, label, icon: Icon, active, onClick }) {
	return /* @__PURE__ */ jsxs(Link, {
		to,
		onClick,
		preload: false,
		className: cn("flex h-9 items-center gap-1 rounded-sm px-2.5 text-xs transition-colors duration-150 md:h-8", active ? "bg-accent text-accent-fg" : "text-muted hover:bg-accent-soft hover:text-ink"),
		children: [/* @__PURE__ */ jsx(Icon, { className: "size-4" }), label]
	});
}
function LoginScreen({ accessHash, onOk }) {
	const [pwd, setPwd] = React.useState("");
	const [remember, setRemember] = React.useState(true);
	const [busy, setBusy] = React.useState(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			if (await hashPassword(pwd) !== accessHash) {
				toast.error("密码不对");
				return;
			}
			unlockGate(accessHash, remember);
			onOk();
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		style: { paddingTop: "env(safe-area-inset-top)" },
		children: /* @__PURE__ */ jsxs("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-xl font-semibold",
					children: APP_NAME
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted",
					children: "手机、电脑浏览器都可打开。已开密码时先登录。"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "gate-login",
						children: "访问密码"
					}), /* @__PURE__ */ jsx(Input, {
						id: "gate-login",
						className: "mt-1",
						type: "password",
						autoFocus: true,
						value: pwd,
						onChange: (e) => setPwd(e.target.value),
						autoComplete: "current-password",
						enterKeyHint: "done"
					})]
				}),
				/* @__PURE__ */ jsxs("label", {
					className: "mt-3 flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ jsx("input", {
						type: "checkbox",
						className: "size-4",
						checked: remember,
						onChange: (e) => setRemember(e.target.checked)
					}), " 本机记住，下次不用再输"]
				}),
				/* @__PURE__ */ jsx(Button, {
					className: "btn-lg mt-5 w-full",
					type: "submit",
					disabled: busy || !pwd,
					children: "进入"
				})
			]
		})
	});
}
function SetupScreen({ onOk }) {
	const [username, setUsername] = React.useState("admin");
	const [name, setName] = React.useState("管理员");
	const [pwd, setPwd] = React.useState("");
	const [again, setAgain] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	async function submit(e) {
		e.preventDefault();
		if (pwd.length < 4) {
			toast.error("密码至少 4 位");
			return;
		}
		if (pwd !== again) {
			toast.error("两次密码不一致");
			return;
		}
		setBusy(true);
		try {
			await authOp("setup", {
				username,
				password: pwd,
				name
			});
			toast.success("管理员已创建");
			onOk();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "创建失败");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ jsxs("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-xl font-semibold",
					children: "创建管理员"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted",
					children: "第一次使用。原来的数据会放进「默认台账」，不会丢。"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "显示名" }), /* @__PURE__ */ jsx(Input, {
							className: "mt-1",
							value: name,
							onChange: (e) => setName(e.target.value)
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "登录名" }), /* @__PURE__ */ jsx(Input, {
							className: "mt-1",
							value: username,
							onChange: (e) => setUsername(e.target.value),
							autoComplete: "username"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "密码" }), /* @__PURE__ */ jsx(Input, {
							className: "mt-1",
							type: "password",
							value: pwd,
							onChange: (e) => setPwd(e.target.value),
							autoComplete: "new-password"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "再输一次" }), /* @__PURE__ */ jsx(Input, {
							className: "mt-1",
							type: "password",
							value: again,
							onChange: (e) => setAgain(e.target.value),
							autoComplete: "new-password"
						})] })
					]
				}),
				/* @__PURE__ */ jsx(Button, {
					className: "btn-lg mt-5 w-full",
					type: "submit",
					disabled: busy,
					children: "创建并进入"
				})
			]
		})
	});
}
function NoBookScreen({ onOut }) {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-xl font-semibold",
					children: "还没有台账"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted",
					children: "这个账户没有自己的台账。请让管理员在「设置 → 这套台账的成员」里把你加进去。"
				}),
				/* @__PURE__ */ jsx(Button, {
					className: "btn-lg mt-5 w-full",
					type: "button",
					variant: "outline",
					onClick: () => {
						authOp("logout").finally(() => onOut());
					},
					children: "退出登录"
				})
			]
		})
	});
}
function AcctLogin({ onOk }) {
	const [username, setUsername] = React.useState("");
	const [pwd, setPwd] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		try {
			await authOp("login", {
				username,
				password: pwd
			});
			onOk();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "登录失败");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ jsxs("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-xl font-semibold",
					children: APP_NAME
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted",
					children: "每个账户各自的数据。以前设过总密码的，用户名填 admin，密码还是原来的。"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ jsx(Label, { children: "用户名" }), /* @__PURE__ */ jsx(Input, {
						className: "mt-1",
						value: username,
						onChange: (e) => setUsername(e.target.value),
						autoComplete: "username",
						autoFocus: true
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ jsx(Label, { children: "密码" }), /* @__PURE__ */ jsx(Input, {
						className: "mt-1",
						type: "password",
						value: pwd,
						onChange: (e) => setPwd(e.target.value),
						autoComplete: "current-password"
					})]
				}),
				/* @__PURE__ */ jsx(Button, {
					className: "btn-lg mt-5 w-full",
					type: "submit",
					disabled: busy || !username || !pwd,
					children: "登录"
				})
			]
		})
	});
}
function AppShell() {
	useHydrateStore();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const year = useApp((s) => s.year);
	const accessHash = useApp((s) => s.accessHash);
	const [open, setOpen] = React.useState(false);
	const [unlocked, setUnlocked] = React.useState(() => !accessHash);
	const [gate, setGate] = React.useState("boot");
	const [acct, setAcct] = React.useState("");
	const [who, setWho] = React.useState(null);
	const [, setPermTick] = React.useState(0);
	React.useEffect(() => subscribePerms(() => setPermTick((n) => n + 1)), []);
	async function refreshGate() {
		try {
			const s = await authStatus();
			setAcct(String(s.user?.name || s.user?.username || ""));
			setWho(s.user ? {
				name: String(s.user.name),
				username: String(s.user.username),
				role: String(s.user.role)
			} : null);
			setLivePerms(s.persist ? s.perms || [] : ["*"]);
			if (!s.persist) setGate("app");
			else if (s.needSetup) setGate("setup");
			else if (!s.user) setGate("login");
			else if (!s.books.length) setGate("nobook");
			else {
				setGate("app");
				try {
					const { detectNas, pullNasLedger: pullNasLedger$1 } = await import("./nas-sync-D8mNZlyQ.js");
					await detectNas();
					await pullNasLedger$1();
				} catch {}
			}
		} catch {
			setGate("app");
		}
	}
	React.useEffect(() => {
		refreshGate();
	}, []);
	React.useEffect(() => {
		setUnlocked(!accessHash || gateUnlocked(accessHash));
	}, [accessHash]);
	React.useEffect(() => {
		setOpen(false);
	}, [pathname]);
	if (gate === "boot") return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-bg text-sm text-muted",
		children: "加载中…"
	});
	if (gate === "setup") return /* @__PURE__ */ jsx(SetupScreen, { onOk: () => void refreshGate() });
	if (gate === "login") return /* @__PURE__ */ jsx(AcctLogin, { onOk: () => void refreshGate() });
	if (gate === "nobook") return /* @__PURE__ */ jsx(NoBookScreen, { onOut: () => void refreshGate() });
	if (accessHash && !unlocked && gate === "app" && !acct) return /* @__PURE__ */ jsx(LoginScreen, {
		accessHash,
		onOk: () => setUnlocked(true)
	});
	const visNav = NAV.filter((item) => {
		if (item.to === "/import") return can("import.use") || can("export.use");
		const p = NAV_PERM[item.to];
		return !p || can(p);
	});
	const visTabs = TABS.filter((item) => {
		const p = NAV_PERM[item.to];
		return !p || can(p);
	});
	const tabHit = visTabs.some((t) => t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(t.to));
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen min-h-dvh overflow-x-hidden bg-bg text-ink",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex max-w-7xl",
			children: [/* @__PURE__ */ jsxs("aside", {
				className: "no-print hidden w-56 shrink-0 flex-col border-r border-line bg-bg-elevated px-4 py-6 md:flex",
				children: [
					/* @__PURE__ */ jsx(Brand, {
						year,
						pathname
					}),
					/* @__PURE__ */ jsx(BookSwitcher, {}),
					/* @__PURE__ */ jsx(YearSwitcher, {}),
					/* @__PURE__ */ jsx("nav", {
						className: "mt-6 flex flex-col gap-1",
						children: visNav.map((item) => /* @__PURE__ */ jsx(NavLink, {
							...item,
							active: pathname === item.to
						}, item.to))
					}),
					who ? /* @__PURE__ */ jsx(WhoCard, { who }) : null,
					accessHash || acct ? /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-ink",
						onClick: () => {
							if (acct) {
								authOp("logout").finally(() => {
									lockGate();
									setGate("login");
									toast.success("已退出登录");
								});
								return;
							}
							lockGate();
							setUnlocked(false);
							toast.success("已退出登录");
						},
						children: [/* @__PURE__ */ jsx(LogOut, { className: "size-3.5" }), " 退出登录"]
					}) : null,
					/* @__PURE__ */ jsx("div", {
						className: "mt-6",
						children: /* @__PURE__ */ jsx(VersionLog, {})
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ jsxs("header", {
						className: "no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur md:hidden",
						style: { paddingTop: "max(0.5rem, env(safe-area-inset-top))" },
						children: [/* @__PURE__ */ jsx(Brand, {
							year,
							compact: true,
							pathname
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex min-w-0 items-center gap-1",
							children: [
								who ? /* @__PURE__ */ jsxs("div", {
									className: "mr-1 min-w-0 text-right",
									children: [/* @__PURE__ */ jsx("div", {
										className: "truncate text-xs font-medium",
										children: who.name
									}), /* @__PURE__ */ jsx("div", {
										className: "truncate text-[10px] text-muted",
										children: who.role === "admin" ? "管理员" : who.username
									})]
								}) : null,
								/* @__PURE__ */ jsx(BookSwitcher, { compact: true }),
								/* @__PURE__ */ jsx(YearSwitcher, { compact: true })
							]
						})]
					}),
					open ? /* @__PURE__ */ jsxs("nav", {
						className: "no-print space-y-1 border-b border-line bg-surface p-3 md:hidden",
						children: [
							visNav.map((item) => /* @__PURE__ */ jsx(NavLink, {
								...item,
								active: pathname === item.to,
								onClick: () => setOpen(false)
							}, item.to)),
							who ? /* @__PURE__ */ jsx(WhoCard, { who }) : null,
							accessHash || acct ? /* @__PURE__ */ jsxs("button", {
								type: "button",
								className: "flex h-11 w-full items-center gap-2 rounded-sm px-3 text-sm text-muted",
								onClick: () => {
									if (acct) {
										authOp("logout").finally(() => {
											lockGate();
											setGate("login");
											toast.success("已退出登录");
										});
										return;
									}
									lockGate();
									setUnlocked(false);
									toast.success("已退出登录");
								},
								children: [/* @__PURE__ */ jsx(LogOut, { className: "size-4" }), " 退出登录"]
							}) : null
						]
					}) : null,
					/* @__PURE__ */ jsxs("main", {
						className: "px-3 py-4 md:px-8 md:py-8",
						children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx("div", {
							className: "no-print mt-10 md:hidden",
							children: /* @__PURE__ */ jsx(VersionLog, {})
						})]
					})
				]
			})]
		}), /* @__PURE__ */ jsxs("nav", {
			className: "no-print fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 backdrop-blur md:hidden",
			style: {
				paddingBottom: "env(safe-area-inset-bottom, 0px)",
				gridTemplateColumns: `repeat(${visTabs.length + 1}, minmax(0, 1fr))`
			},
			children: [visTabs.map((item) => {
				const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to);
				return /* @__PURE__ */ jsxs(Link, {
					to: item.to,
					preload: false,
					className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", active ? "text-accent" : "text-muted"),
					children: [/* @__PURE__ */ jsx(item.icon, { className: "size-5" }), item.label]
				}, item.to);
			}), /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", open || !tabHit ? "text-accent" : "text-muted"),
				onClick: () => setOpen((v) => !v),
				children: [open ? /* @__PURE__ */ jsx(X, { className: "size-5" }) : /* @__PURE__ */ jsx(Menu, { className: "size-5" }), " 菜单"]
			})]
		})]
	});
}
export { WinUpdate as n, parseChangelog as r, AppShell as t };
