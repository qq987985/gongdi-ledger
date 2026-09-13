import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { t as cn } from "./utils-DAXmXjMk.js";
import { i as toast } from "./audit-menbPLKJ.js";
import { t as Button } from "./button-CTGswd-b.js";
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
	async function pollVersion(tries) {
		for (let i = 0; i < tries; i++) {
			await new Promise((r) => setTimeout(r, 3e3));
			try {
				const r = await fetch("/api/version", { cache: "no-store" });
				if (!r.ok) continue;
				const j = await r.json();
				return {
					back: true,
					version: String(j?.current || "")
				};
			} catch {}
		}
		return {
			back: false,
			version: ""
		};
	}
	async function finishUpdate(target, pulled = "") {
		const p = await pollVersion(40);
		if (!p.back) {
			toast.error("服务 2 分钟内没有恢复。请到 NAS 执行 docker ps -a | grep attendance 查看容器状态");
			setBusy(false);
			return;
		}
		if (target && p.version && formatVersion(p.version) !== formatVersion(target)) {
			toast.error(pulled ? `已重启，但版本还是 ${formatVersion(p.version)}（期望 ${formatVersion(target)}）：本次拉到的镜像就是 ${formatVersion(pulled)}，是镜像加速站还在发旧镜像。等 5–10 分钟再点一次「更新」即可（详情见「查看更新日志」）。` : `已重启，但版本还是 ${formatVersion(p.version)}（期望 ${formatVersion(target)}）；点「查看更新日志」能看到本次拉到的镜像版本。`);
			setBusy(false);
			return;
		}
		location.reload();
	}
	async function pollJob() {
		for (let i = 0; i < 150; i++) {
			await new Promise((r) => setTimeout(r, 2e3));
			try {
				const r = await fetch("/api/update?status=1", { cache: "no-store" });
				if (!r.ok) continue;
				const s = (await r.json()).status;
				if (!s) continue;
				if (s.running) continue;
				return {
					settled: true,
					ok: Boolean(s.ok),
					error: String(s.error || ""),
					imageVersion: String(s.imageVersion || "")
				};
			} catch {
				return {
					settled: false,
					ok: false,
					error: "",
					imageVersion: ""
				};
			}
		}
		return {
			settled: false,
			ok: false,
			error: "",
			imageVersion: ""
		};
	}
	async function apply() {
		const docker = info?.mode === "docker";
		const target = String(info?.remote || "");
		if (!confirm(docker ? "将拉取新镜像并重启容器。data 台账不会动。大约一两分钟。" : "将下载新版本并重启。data 台账不会动。")) return;
		setBusy(true);
		try {
			const r = await fetch("/api/update?apply=1", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: "{}"
			});
			const d = await r.json().catch(() => ({}));
			if (!r.ok || d.error) {
				toast.error(d.error || `更新未执行（HTTP ${r.status}；详情见 data/logs）`);
				setBusy(false);
				return;
			}
			toast.success("已开始更新（拉镜像/替换容器），请稍候…");
			const job$1 = await pollJob();
			if (job$1.settled && !job$1.ok) {
				toast.error(job$1.error || "更新失败；详情见 data/logs/update.log");
				setBusy(false);
				return;
			}
			finishUpdate(target, job$1.imageVersion);
		} catch {
			toast.message("更新请求中断，正在确认服务状态…");
			const p = await pollVersion(10);
			if (p.back && (!target || formatVersion(p.version) === formatVersion(target))) {
				toast.success(`已更新到 ${formatVersion(p.version)}`);
				location.reload();
				return;
			}
			toast.error(p.back ? `更新似乎没有生效，当前仍是 ${formatVersion(p.version)}；请查看 data/logs/update.log` : "更新请求中断且服务未响应；请查看 data/logs/update.log，或用「一键拉取 / 解压新包」手动更新");
			setBusy(false);
		}
	}
	const job = info?.status;
	const stamp = (t) => t && t > 0 ? new Date(t).toLocaleString("zh-CN", { hour12: false }) : "";
	const [jobLog, setJobLog] = import_react.useState(null);
	const [logBusy, setLogBusy] = import_react.useState(false);
	async function toggleLog() {
		if (jobLog) {
			setJobLog(null);
			return;
		}
		setLogBusy(true);
		try {
			const r = await fetch("/api/update-log", {
				cache: "no-store",
				signal: AbortSignal.timeout(2e4)
			});
			const d = await r.json().catch(() => ({}));
			if (!r.ok || d.error) {
				toast.error(d.error || `读取日志失败（HTTP ${r.status}）`);
				return;
			}
			setJobLog(d);
		} catch {
			toast.error("读取日志失败（服务未响应）");
		} finally {
			setLogBusy(false);
		}
	}
	const [pruneBusy, setPruneBusy] = import_react.useState(false);
	async function prune() {
		setPruneBusy(true);
		try {
			const r = await fetch("/api/images", {
				cache: "no-store",
				signal: AbortSignal.timeout(2e4)
			});
			const d = await r.json().catch(() => ({}));
			if (!r.ok || d.error) {
				toast.error(d.error || `读取镜像失败（HTTP ${r.status}）`);
				return;
			}
			if (d.available === false) {
				toast.error(d.note || "本机没有挂载 docker.sock，无法清理");
				return;
			}
			const n = d.removable?.length || 0;
			if (!n && !d.helperContainer) {
				toast.success("没有可清理的旧镜像（当前版本和正在用的镜像不会被删）");
				return;
			}
			const mb = Math.round((d.totalBytes || 0) / 1048576);
			const helper = d.helperContainer ? "\n顺带删掉「更新容器 gongdi-updater」（它只是更新时的临时容器，删了不影响台账）。" : "";
			if (!confirm(`将删除 ${n} 个不再使用的旧镜像，约释放 ${mb} MB。\n当前运行的镜像与其它容器的镜像不会被删除。${helper}继续？`)) return;
			const p = await fetch("/api/images", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: "{}"
			});
			const j = await p.json().catch(() => ({}));
			if (!p.ok || j.error) {
				toast.error(j.error || `清理失败（HTTP ${p.status}）`);
				return;
			}
			const freedMb = Math.round((j.freed || 0) / 1048576);
			const tail = j.helperRemoved ? "，并删掉了临时更新容器" : "";
			toast.success(j.count ? `已清理 ${j.count} 个旧镜像，释放约 ${freedMb} MB${tail}` : `没有旧镜像要清理${j.helperRemoved ? "（已删掉临时更新容器）" : ""}`);
			if (j.errors?.length) toast.error(`有 ${j.errors.length} 个没删掉：${j.errors[0]}`);
		} catch {
			toast.error("清理失败（服务未响应）");
		} finally {
			setPruneBusy(false);
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
			}) : null,
			job && (job.startedAt || job.running) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("mt-3 rounded-lg border px-3 py-2 text-xs", job.running ? "border-warn/40 bg-warn-bg" : job.ok ? "border-ok/40 bg-ok-bg" : "border-danger/40 bg-danger-bg"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-x-2 gap-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: "上次更新"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("font-medium", job.running ? "text-warn" : job.ok ? "text-ok" : "text-danger"),
								children: job.running ? "进行中…" : job.ok ? "成功" : "失败"
							}),
							stamp(job.startedAt) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-subtle",
								children: [stamp(job.startedAt), job.doneAt && !job.running ? ` → ${stamp(job.doneAt)}` : ""]
							}) : null
						]
					}),
					job.running && job.step ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-subtle",
						children: job.step
					}) : null,
					!job.running && !job.ok && job.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 break-words text-muted",
						children: ["原因：", job.error]
					}) : null,
					!job.running && !job.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-subtle",
						children: "容器还在旧版本上跑着，台账数据没动。可再点一次「更新」，或到 NAS 运行 ./一键拉取.sh。"
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted underline underline-offset-2 hover:text-danger disabled:opacity-60",
					disabled: logBusy,
					onClick: () => void toggleLog(),
					children: logBusy ? "读取中…" : jobLog ? "收起更新日志" : "查看更新日志"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted underline underline-offset-2 hover:text-danger disabled:opacity-60",
					disabled: pruneBusy,
					onClick: () => void prune(),
					children: pruneBusy ? "清理中…" : "清理旧镜像"
				})]
			}),
			jobLog ? jobLog.log || jobLog.errorText || jobLog.helper ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-line bg-surface p-2 text-[11px] leading-relaxed text-muted",
				children: [
					jobLog.errorText,
					jobLog.helper,
					jobLog.log
				].filter(Boolean).join(String.fromCharCode(10, 10))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-subtle",
				children: jobLog.note || "没有日志内容"
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
export { WinUpdate as n, parseChangelog as r, VersionLog as t };
