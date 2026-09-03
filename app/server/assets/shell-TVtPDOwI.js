import { t as Link } from "./link-C8A9580o.js";
import { F as require_react, V as __toESM, a as useStore, c as require_jsx_runtime, g as isServer, i as useStructuralSharing, n as Outlet, o as useRouter } from "../server.js";
import { a as can, l as setLivePerms, n as NAV_PERM, u as subscribePerms } from "./perms-CYLuVN7r.js";
import { t as cn } from "./utils-DPLvt0U2.js";
import { a as lockGate, i as hashPassword, n as authStatus, o as unlockGate, r as gateUnlocked, t as authOp } from "./auth-CTHz_Bd5.js";
import { f as confirmRemoveYear, g as nextYear, h as monthStatus } from "./contracts-Ddv2VxfU.js";
import { t as useApp } from "./store-U11L9wsl.js";
import { n as nasEnabled, r as pullNasLedger } from "./nas-sync-CM8UpyNe.js";
import { t as createLucideIcon } from "./createLucideIcon-DiDjOefB.js";
import { n as CalendarDays, t as RotateCcwClock } from "./rotate-ccw-clock-1dRRhyJ8.js";
import { n as Camera, t as X } from "./x-CnbYULR9.js";
import { t as Plus } from "./plus-CXb5tOUj.js";
import { t as Trash2 } from "./trash-2-BU0RbMP7.js";
import { n as toast } from "./dist-DfB6JCQe.js";
import { t as Button } from "./button-3Oociu2t.js";
import { n as Label, t as Input } from "./input-D7JnnlZc.js";
function useRouterState(opts) {
	const contextRouter = useRouter({ warn: opts?.router === void 0 });
	const router = opts?.router || contextRouter;
	{
		const state = router.stores.__store.get();
		return opts?.select ? opts.select(state) : state;
	}
	return useStore(router.stores.__store, useStructuralSharing(opts, router));
}
var Banknote = createLucideIcon("banknote", [
	["rect", {
		width: "20",
		height: "12",
		x: "2",
		y: "6",
		rx: "2",
		key: "9lu3g6"
	}],
	["circle", {
		cx: "12",
		cy: "12",
		r: "2",
		key: "1c9p78"
	}],
	["path", {
		d: "M6 12h.01M18 12h.01",
		key: "113zkx"
	}]
]);
var ChevronLeft = createLucideIcon("chevron-left", [["path", {
	d: "m15 18-6-6 6-6",
	key: "1wnfg3"
}]]);
var ChevronRight = createLucideIcon("chevron-right", [["path", {
	d: "m9 18 6-6-6-6",
	key: "mthhwq"
}]]);
var ClipboardList = createLucideIcon("clipboard-list", [
	["rect", {
		width: "8",
		height: "4",
		x: "8",
		y: "2",
		rx: "1",
		ry: "1",
		key: "tgr4d6"
	}],
	["path", {
		d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
		key: "116196"
	}],
	["path", {
		d: "M12 11h4",
		key: "1jrz19"
	}],
	["path", {
		d: "M12 16h4",
		key: "n85exb"
	}],
	["path", {
		d: "M8 11h.01",
		key: "1dfujw"
	}],
	["path", {
		d: "M8 16h.01",
		key: "18s6g9"
	}]
]);
var FileText = createLucideIcon("file-text", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M10 9H8",
		key: "b1mrlr"
	}],
	["path", {
		d: "M16 13H8",
		key: "t4e002"
	}],
	["path", {
		d: "M16 17H8",
		key: "z1uh3a"
	}]
]);
var FolderOpen = createLucideIcon("folder-open", [["path", {
	d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
	key: "usdka0"
}]]);
var LayoutDashboard = createLucideIcon("layout-dashboard", [
	["rect", {
		width: "7",
		height: "9",
		x: "3",
		y: "3",
		rx: "1",
		key: "10lvy0"
	}],
	["rect", {
		width: "7",
		height: "5",
		x: "14",
		y: "3",
		rx: "1",
		key: "16une8"
	}],
	["rect", {
		width: "7",
		height: "9",
		x: "14",
		y: "12",
		rx: "1",
		key: "1hutg5"
	}],
	["rect", {
		width: "7",
		height: "5",
		x: "3",
		y: "16",
		rx: "1",
		key: "ldoo1y"
	}]
]);
var LogOut = createLucideIcon("log-out", [
	["path", {
		d: "m16 17 5-5-5-5",
		key: "1bji2h"
	}],
	["path", {
		d: "M21 12H9",
		key: "dn1m92"
	}],
	["path", {
		d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
		key: "1uf3rs"
	}]
]);
var Menu = createLucideIcon("menu", [
	["path", {
		d: "M4 5h16",
		key: "1tepv9"
	}],
	["path", {
		d: "M4 12h16",
		key: "1lakjw"
	}],
	["path", {
		d: "M4 19h16",
		key: "1djgab"
	}]
]);
var Settings = createLucideIcon("settings", [["path", {
	d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
	key: "1i5ecw"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]);
var Upload = createLucideIcon("upload", [
	["path", {
		d: "M12 3v12",
		key: "1x0j5s"
	}],
	["path", {
		d: "m17 8-5-5-5 5",
		key: "7q97r8"
	}],
	["path", {
		d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
		key: "ih7n3h"
	}]
]);
var Users = createLucideIcon("users", [
	["path", {
		d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
		key: "1yyitq"
	}],
	["path", {
		d: "M16 3.128a4 4 0 0 1 0 7.744",
		key: "16gr8j"
	}],
	["path", {
		d: "M22 21v-2a4 4 0 0 0-3-3.87",
		key: "kshegd"
	}],
	["circle", {
		cx: "9",
		cy: "7",
		r: "4",
		key: "nufk8"
	}]
]);
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
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
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
		icon: RotateCcwClock
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
	import_react.useEffect(() => {
		(async () => {
			try {
				await useApp.persist.rehydrate();
			} catch {}
			try {
				const { startNasSync } = await import("./nas-sync-DwECG8Xt.js");
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
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: "field-select h-9 max-w-[8.5rem] shrink-0 text-sm",
		value: year,
		onChange: (e) => setYear(Number(e.target.value)),
		"aria-label": "选择年度",
		children: list.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
			value: y,
			children: [y, "年"]
		}, y))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !prev,
						type: "button",
						onClick: () => prev && setYear(prev),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select h-9 min-w-0 flex-1",
						value: year,
						onChange: (e) => setYear(Number(e.target.value)),
						"aria-label": "选择年度",
						children: list.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: y,
							children: [y, " 年"]
						}, y))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-8",
						disabled: !nxt,
						type: "button",
						onClick: () => nxt && setYear(nxt),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-accent hover:text-ink",
				onClick: addNext,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }),
					" 新增 ",
					upcoming,
					" 年"
				]
			}),
			list.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-danger hover:text-danger",
				onClick: () => dropYear(year),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }),
					" 删除 ",
					year,
					" 年"
				]
			}) : null
		]
	});
}
function BookSwitcher({ compact }) {
	const [books, setBooks] = import_react.useState([]);
	const [bookId, setBookId] = import_react.useState("");
	const [user, setUser] = import_react.useState(null);
	const [name, setName] = import_react.useState("");
	const [adding, setAdding] = import_react.useState(false);
	const [renaming, setRenaming] = import_react.useState(false);
	const [renameTo, setRenameTo] = import_react.useState("");
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
	import_react.useEffect(() => {
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
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		className: "field-select h-9 max-w-[9rem] text-sm",
		value: bookId,
		onChange: (e) => void switchTo(e.target.value),
		children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: b.id,
			children: b.name
		}, b.id))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3 space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				className: "field-select h-9 w-full text-sm",
				value: bookId,
				onChange: (e) => void switchTo(e.target.value),
				"aria-label": "当前台账",
				children: books.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: b.id,
					children: b.name
				}, b.id))
			}),
			user.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] text-muted",
				children: "管理员可进入全部台账"
			}) : null,
			renaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "h-9",
					value: renameTo,
					onChange: (e) => setRenameTo(e.target.value),
					placeholder: "台账名称"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
			}) : adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "h-9",
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "新台账名称"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted hover:text-ink",
					onClick: () => setAdding(true),
					children: "＋ 新建一套台账"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 rounded-lg border border-line bg-surface px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] tracking-wide text-muted",
				children: "当前账户"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "truncate font-medium",
				children: who.name || who.username
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
	const [info, setInfo] = import_react.useState(null);
	const [busy, setBusy] = import_react.useState(false);
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
	import_react.useEffect(() => {
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
			const r = await fetch("/api/update?apply=1", {
				method: "GET",
				cache: "no-store"
			});
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: compact ? "mt-3" : "rounded-xl border border-line bg-surface p-5",
		children: [
			compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-semibold",
				children: "软件更新"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: desc
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex flex-wrap items-center gap-2 ${compact ? "" : "mt-3"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					disabled: busy,
					onClick: () => void load(true),
					children: "检查更新"
				}), info?.canApply ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "sm",
					disabled: busy,
					onClick: () => void apply(),
					children: busy ? "更新中…" : `更新到 ${formatVersion(info.remote)}`
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: status
				})]
			}),
			info?.hint && info.canApply ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-subtle",
				children: info.hint
			}) : null,
			info?.remote ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
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
	const [log, setLog] = import_react.useState(FALLBACK);
	const [open, setOpen] = import_react.useState(false);
	const [hasNew, setHasNew] = import_react.useState(false);
	import_react.useEffect(() => {
		fetch("/api/version").then((r) => r.json()).then((d) => {
			if (d?.current) setLog(d);
		}).catch(() => void 0);
		fetch("/api/update", { cache: "no-store" }).then((r) => r.json()).then((d) => {
			if (d?.newer) setHasNew(true);
		}).catch(() => void 0);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "text-xs text-muted hover:text-ink",
		onClick: () => setOpen(true),
		children: [
			"版本号：",
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "tabular-nums",
				children: [
					formatVersion(log.current),
					" ",
					log.date ? ` ${log.date}` : ""
				]
			}),
			hasNew ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-2 text-xs font-normal text-ok",
				children: "有新版本"
			}) : null
		]
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
		onClick: () => setOpen(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "更新记录"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-sm text-muted hover:text-ink",
						onClick: () => setOpen(false),
						children: "关闭"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinUpdate, { compact: true }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-4 space-y-4",
					children: log.entries.slice(0, 10).map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm font-semibold",
						children: [
							formatVersion(e.version),
							" ",
							e.date ? ` ${e.date}` : "",
							e.version === log.current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 text-xs font-normal text-ok",
								children: "当前"
							}) : null
						]
					}), e.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-1 list-disc space-y-1 pl-5 text-sm text-muted",
						children: e.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
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
	const [book, setBook] = import_react.useState("");
	import_react.useEffect(() => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("font-display truncate font-semibold tracking-tight", compact ? "text-base" : "text-lg"),
			children: book || APP_NAME
		}), !compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		onClick,
		preload: false,
		className: cn("flex h-9 items-center gap-1 rounded-sm px-2.5 text-xs transition-colors duration-150 md:h-8", active ? "bg-accent text-accent-fg" : "text-muted hover:bg-accent-soft hover:text-ink"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
	});
}
function LoginScreen({ accessHash, onOk }) {
	const [pwd, setPwd] = import_react.useState("");
	const [remember, setRemember] = import_react.useState(true);
	const [busy, setBusy] = import_react.useState(false);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		style: { paddingTop: "env(safe-area-inset-top)" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: APP_NAME
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "手机、电脑浏览器都可打开。已开密码时先登录。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "gate-login",
						children: "访问密码"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-3 flex items-center gap-2 text-sm text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						className: "size-4",
						checked: remember,
						onChange: (e) => setRemember(e.target.checked)
					}), " 本机记住，下次不用再输"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
	const [username, setUsername] = import_react.useState("");
	const [name, setName] = import_react.useState("");
	const [pwd, setPwd] = import_react.useState("");
	const [again, setAgain] = import_react.useState("");
	const [busy, setBusy] = import_react.useState(false);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "创建管理员"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "第一次使用。原来的数据会放进「默认台账」，不会丢。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "显示名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: name,
							onChange: (e) => setName(e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "登录名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: username,
							onChange: (e) => setUsername(e.target.value),
							autoComplete: "username"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: pwd,
							onChange: (e) => setPwd(e.target.value),
							autoComplete: "new-password"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "再输一次" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "password",
							value: again,
							onChange: (e) => setAgain(e.target.value),
							autoComplete: "new-password"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: "还没有台账"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "这个账户没有自己的台账。请让管理员在「设置 → 这套台账的成员」里把你加进去。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
	const [username, setUsername] = import_react.useState("");
	const [pwd, setPwd] = import_react.useState("");
	const [busy, setBusy] = import_react.useState(false);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold",
					children: APP_NAME
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "每个账户各自的数据。以前设过总密码的，用户名填 admin，密码还是原来的。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "用户名" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: username,
						onChange: (e) => setUsername(e.target.value),
						autoComplete: "username",
						autoFocus: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "密码" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "password",
						value: pwd,
						onChange: (e) => setPwd(e.target.value),
						autoComplete: "current-password"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
	const [open, setOpen] = import_react.useState(false);
	const [unlocked, setUnlocked] = import_react.useState(() => !accessHash);
	const [gate, setGate] = import_react.useState("boot");
	const [acct, setAcct] = import_react.useState("");
	const [who, setWho] = import_react.useState(null);
	const [, setPermTick] = import_react.useState(0);
	import_react.useEffect(() => subscribePerms(() => setPermTick((n) => n + 1)), []);
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
					const { detectNas, pullNasLedger: pullNasLedger$1 } = await import("./nas-sync-DwECG8Xt.js");
					await detectNas();
					await pullNasLedger$1();
				} catch {}
			}
		} catch {
			setGate("app");
		}
	}
	import_react.useEffect(() => {
		refreshGate();
	}, []);
	import_react.useEffect(() => {
		setUnlocked(!accessHash || gateUnlocked(accessHash));
	}, [accessHash]);
	import_react.useEffect(() => {
		setOpen(false);
	}, [pathname]);
	if (gate === "boot") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-bg text-sm text-muted",
		children: "加载中…"
	});
	if (gate === "setup") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SetupScreen, { onOk: () => void refreshGate() });
	if (gate === "login") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AcctLogin, { onOk: () => void refreshGate() });
	if (gate === "nobook") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoBookScreen, { onOut: () => void refreshGate() });
	if (accessHash && !unlocked && gate === "app" && !acct) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginScreen, {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen min-h-dvh overflow-x-hidden bg-bg text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "no-print hidden w-56 shrink-0 flex-col border-r border-line bg-bg-elevated px-4 py-6 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {
						year,
						pathname
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookSwitcher, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YearSwitcher, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-6 flex flex-col gap-1",
						children: visNav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
							...item,
							active: pathname === item.to
						}, item.to))
					}),
					who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhoCard, { who }) : null,
					accessHash || acct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
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
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-3.5" }), " 退出登录"]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionLog, {})
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur md:hidden",
						style: { paddingTop: "max(0.5rem, env(safe-area-inset-top))" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Brand, {
							year,
							compact: true,
							pathname
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-1",
							children: [
								who ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mr-1 min-w-0 text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-xs font-medium",
										children: who.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-[10px] text-muted",
										children: who.role === "admin" ? "管理员" : who.username
									})]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookSwitcher, { compact: true }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YearSwitcher, { compact: true })
							]
						})]
					}),
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "no-print space-y-1 border-b border-line bg-surface p-3 md:hidden",
						children: [
							visNav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								...item,
								active: pathname === item.to,
								onClick: () => setOpen(false)
							}, item.to)),
							who ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhoCard, { who }) : null,
							accessHash || acct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
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
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " 退出登录"]
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "px-3 py-4 md:px-8 md:py-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "no-print mt-10 md:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionLog, {})
						})]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "no-print fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 backdrop-blur md:hidden",
			style: {
				paddingBottom: "env(safe-area-inset-bottom, 0px)",
				gridTemplateColumns: `repeat(${visTabs.length + 1}, minmax(0, 1fr))`
			},
			children: [visTabs.map((item) => {
				const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: item.to,
					preload: false,
					className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", active ? "text-accent" : "text-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-5" }), item.label]
				}, item.to);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", open || !tabHit ? "text-accent" : "text-muted"),
				onClick: () => setOpen((v) => !v),
				children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" }), " 菜单"]
			})]
		})]
	});
}
export { WinUpdate as n, parseChangelog as r, AppShell as t };
