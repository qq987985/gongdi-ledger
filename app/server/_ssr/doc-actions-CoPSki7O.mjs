import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { S as Copy, l as Pencil, o as Trash2, x as Download, y as Eye } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as nasEnabled, pt as copyText } from "./router-DxdzlCp3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/doc-actions-CoPSki7O.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DB_NAME = "gongdi-docs";
var STORE = "docs";
var DOC_KIND_LABEL = {
	report: "报量单",
	invoice: "电子发票",
	receipt: "收款回单",
	attendance: "考勤影像",
	contract: "合同扫描件",
	expense: "报销凭证",
	payout: "报销打款"
};
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
function key(id, kind) {
	return `${kind}::${id}`;
}
async function idbGet(id, kind) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key(id, kind));
		req.onsuccess = () => resolve(req.result || null);
		req.onerror = () => reject(req.error);
	});
}
async function idbSet(id, kind, blob, fileName) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put({
			blob,
			fileName
		}, key(id, kind));
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function idbDel(id, kind) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).delete(key(id, kind));
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function setDoc(id, kind, file, opts) {
	await idbSet(id, kind, file, file.name);
	if (!nasEnabled()) return file.name;
	const body = new FormData();
	body.set("id", id);
	body.set("kind", kind);
	body.set("file", file, file.name);
	if (opts && opts.replace) body.set("replace", "1");
	const res = await fetch("/api/doc", {
		method: "PUT",
		credentials: "include",
		body
	});
	let name = file.name;
	try {
		const j = await res.json();
		if (j?.fileName) name = j.fileName;
	} catch {}
	if (name !== file.name) await idbSet(id, kind, file, name);
	return name;
}
async function removeDoc(id, kind) {
	await idbDel(id, kind);
	if (!nasEnabled()) return;
	await fetch(`/api/doc?id=${encodeURIComponent(id)}&kind=${kind}`, {
		method: "DELETE",
		credentials: "include"
	});
}
async function getDocBlob(id, kind, fileName) {
	if (nasEnabled()) try {
		const r = await fetch(`/api/doc?id=${encodeURIComponent(id)}&kind=${kind}`, { credentials: "include" });
		if (r.ok) return {
			blob: await r.blob(),
			fileName: fileName || decodeURIComponent(/filename="?([^";]+)"?/.exec(r.headers.get("content-disposition") || "")?.[1] || "") || "file"
		};
	} catch {}
	return idbGet(id, kind);
}
function triggerDownload(blob, fileName) {
	const href = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = href;
	a.download = fileName || "file";
	a.click();
	window.setTimeout(() => URL.revokeObjectURL(href), 3e4);
}
async function downloadDoc(id, kind, fileName) {
	const hit = await getDocBlob(id, kind, fileName);
	if (!hit) return false;
	triggerDownload(hit.blob, hit.fileName || fileName || "file");
	return true;
}
async function openDoc(id, kind, fileName) {
	const hit = await getDocBlob(id, kind, fileName);
	if (!hit) return false;
	const href = URL.createObjectURL(hit.blob);
	window.open(href, "_blank", "noopener,noreferrer");
	window.setTimeout(() => URL.revokeObjectURL(href), 6e4);
	return true;
}
async function copyDoc(id, kind, fileName) {
	const hit = await getDocBlob(id, kind, fileName);
	if (!hit) return false;
	const name = hit.fileName || fileName || "file";
	const type = hit.blob.type || "";
	if (type.startsWith("image/") && navigator.clipboard && "ClipboardItem" in window) try {
		await navigator.clipboard.write([new ClipboardItem({ [type]: hit.blob })]);
		return "image";
	} catch {}
	copyText(name);
	triggerDownload(hit.blob, name);
	return "name";
}
function fileExt(name) {
	const n = name || "";
	const i = n.lastIndexOf(".");
	return i >= 0 ? n.slice(i) : "";
}
function monthLabel(dateOrYear, month) {
	if (typeof dateOrYear === "number") return `${dateOrYear}年${month || 1}月`;
	const d = String(dateOrYear || "");
	const y = d.slice(0, 4);
	const m = Number(d.slice(5, 7));
	if (/^\d{4}$/.test(y) && m >= 1 && m <= 12) return `${y}年${m}月`;
	return "未填月份";
}
function amountTag(n) {
	const x = Number(n) || 0;
	if (Number.isInteger(x)) return String(x);
	return String(Math.round(x * 100) / 100);
}
function safeBase(s) {
	return (s || "未命名").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
function uniqueBase(base, taken) {
	const stems = taken.map((t) => t.replace(/\.[^.]+$/, ""));
	if (!stems.includes(base)) return base;
	let i = 2;
	while (stems.includes(`${base}-${i}`)) i += 1;
	return `${base}-${i}`;
}
function renameFile(file, base) {
	const name = `${base}${fileExt(file.name) || ""}`;
	return new File([file], name, {
		type: file.type,
		lastModified: file.lastModified
	});
}
function escapeHtml(s) {
	return String(s || "").replace(/[&<>"']/g, (c) => "&#" + ({ "&": "38", "<": "60", ">": "62", '"': "34", "'": "39" }[c]) + ";");
}
function stemOf(name) {
	return String(name || "").replace(/\.[^.]+$/, "");
}
function askDupAction(fileName) {
	return new Promise((resolve) => {
		if (typeof document === "undefined") {
			resolve("add");
			return;
		}
		const wrap = document.createElement("div");
		wrap.style.cssText = "position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(28,25,21,.4);padding:16px";
		wrap.innerHTML = `<div role="dialog" aria-modal="true" style="width:100%;max-width:26rem;border-radius:12px;background:#f4efe6;padding:1.25rem 1.25rem 1rem;border:1px solid #d7cfc2;box-shadow:0 18px 50px rgba(28,25,21,.25)"><div style="font-size:15px;font-weight:600;color:#1c1915">已有同名文件</div><p style="margin:8px 0 16px;font-size:13px;line-height:1.55;color:#5c564c">重命名后的「${escapeHtml(fileName)}」已经存在。替换会盖掉现有文件；增加会另存为同名后加 -2、-3。</p><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end"><button type="button" data-act="cancel" style="border:1px solid #d7cfc2;background:#fff;padding:6px 12px;border-radius:4px;font-size:13px;cursor:pointer">取消</button><button type="button" data-act="add" style="border:1px solid #d7cfc2;background:#fff;padding:6px 12px;border-radius:4px;font-size:13px;cursor:pointer">增加</button><button type="button" data-act="replace" style="background:#2f4f3e;color:#f4efe6;padding:6px 12px;border-radius:4px;font-size:13px;cursor:pointer;border:0">替换</button></div></div>`;
		const finish = (act) => {
			wrap.remove();
			resolve(act);
		};
		wrap.addEventListener("click", (e) => {
			const btn = e.target.closest("[data-act]");
			if (btn) finish(btn.getAttribute("data-act"));
			else if (e.target === wrap) finish("cancel");
		});
		document.body.appendChild(wrap);
		wrap.querySelector("[data-act='replace']")?.focus();
	});
}
async function prepareNamedFile(file, base, taken, currentName) {
	if (!file) return null;
	const cur = currentName ? stemOf(currentName) : "";
	const conflict = (taken || []).map(stemOf).includes(base) && base !== cur;
	let useBase = base;
	let replace = false;
	if (conflict) {
		const act = await askDupAction(`${base}${fileExt(file.name) || ""}`);
		if (act === "cancel") return null;
		if (act === "replace") replace = true;
		else useBase = uniqueBase(base, taken);
	}
	return {
		file: renameFile(file, useBase),
		replace
	};
}
/** 合同名-开票月份-金额 */
function invoiceBase(contractName, date, amount) {
	return `${safeBase(contractName)}-${monthLabel(date)}-${amountTag(amount)}`;
}
/** 项目名称报量-月份-金额 */
function reportBase(projectName, date, amount) {
	return `${safeBase(projectName)}报量-${monthLabel(date)}-${amountTag(amount)}`;
}
/** 考勤-考勤月份 */
function attendanceBase(year, month) {
	return `考勤-${monthLabel(year, month)}`;
}
/** 项目名称-月份（到分包） */
function receiptSubBase(projectName, date) {
	return `${safeBase(projectName)}-${monthLabel(date)}`;
}
/** 项目名称-月份-代付农民工 */
function receiptWorkerBase(projectName, date) {
	return `${safeBase(projectName)}-${monthLabel(date)}-代付农民工`;
}
function DocActions({ id, kind, fileName, suggest, taken = [], onDeleted, onReplaced }) {
	const ref = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap gap-1",
		onClick: (e) => e.stopPropagation(),
		children: [
			fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent",
					onClick: async () => {
						if (!await openDoc(id, kind, fileName)) toast.error("文件不在，可能还没上传成功");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "mr-1 inline size-3" }), "查看"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent",
					onClick: async () => {
						if (await downloadDoc(id, kind, fileName)) toast.success(`已下载 ${fileName}`);
						else toast.error("下载失败");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-1 inline size-3" }), "下载"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent",
					onClick: async () => {
						const r = await copyDoc(id, kind, fileName);
						if (r === "image") toast.success("图片已复制，可粘贴到微信/QQ");
						else if (r === "name") toast.success(`文件名已复制，并开始下载：${fileName}`);
						else toast.error("复制失败");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "mr-1 inline size-3" }), "复制"]
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "self-center text-[11px] text-subtle",
				children: "未上传"
			}),
			onReplaced ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref,
				type: "file",
				accept: ".pdf,.ofd,.xml,.jpg,.jpeg,.png,.webp,.xlsx,.xls",
				className: "sr-only",
				onChange: async (e) => {
					const f = e.target.files?.[0];
					e.target.value = "";
					if (!f) return;
					const tip = fileName ? `用「${f.name}」替换影像资料「${fileName}」？` : `上传影像资料「${f.name}」？`;
					if (!confirm(tip)) return;
					let named = f;
					let replace = false;
					if (suggest) {
						const pack = await prepareNamedFile(f, suggest, taken.filter((n) => n !== fileName), fileName);
						if (!pack) return;
						named = pack.file;
						replace = pack.replace;
					}
					const saved = await setDoc(id, kind, named, { replace }) || named.name;
					onReplaced(saved);
					toast.success(fileName ? `已替换为 ${saved}` : `已上传 ${saved}`);
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent",
				onClick: () => ref.current?.click(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "mr-1 inline size-3" }), fileName ? "替换" : "上传"]
			})] }) : null,
			onDeleted && fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "rounded-sm border border-line px-1.5 py-0.5 text-[11px] text-muted hover:text-danger",
				onClick: async () => {
					if (!confirm(`确认删除影像资料「${fileName}」？删除后无法从这里找回。`)) return;
					await removeDoc(id, kind);
					onDeleted();
					toast.success("已删除影像资料");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1 inline size-3" }), "删除"]
			}) : null
		]
	});
}
//#endregion
export { receiptSubBase as a, renameFile as c, uniqueBase as d, getDocBlob as g, invoiceBase as i, reportBase as l, DocActions as n, receiptWorkerBase as o, prepareNamedFile as p, attendanceBase as r, removeDoc as s, DOC_KIND_LABEL as t, setDoc as u };
