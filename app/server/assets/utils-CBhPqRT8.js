import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	const c = globalThis.crypto;
	if (c && typeof c.randomUUID === "function") return c.randomUUID();
	const bytes = new Uint8Array(16);
	if (c && typeof c.getRandomValues === "function") c.getRandomValues(bytes);
	else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
	bytes[6] = bytes[6] & 15 | 64;
	bytes[8] = bytes[8] & 63 | 128;
	const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function money(n) {
	return n.toLocaleString("zh-CN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}
function copyText(text) {
	const t = String(text ?? "").trim();
	if (!t || typeof document === "undefined") return false;
	const ta = document.createElement("textarea");
	ta.value = t;
	ta.setAttribute("readonly", "true");
	ta.setAttribute("aria-hidden", "true");
	ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;z-index:-1;";
	document.body.appendChild(ta);
	const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	ta.focus({ preventScroll: true });
	ta.select();
	ta.setSelectionRange(0, t.length);
	let ok = false;
	try {
		ok = document.execCommand("copy");
	} catch {
		ok = false;
	}
	document.body.removeChild(ta);
	prev?.focus({ preventScroll: true });
	if (!ok && navigator.clipboard?.writeText) {
		navigator.clipboard.writeText(t);
		return true;
	}
	return ok;
}
function toggleSel(ids, id, on) {
	if (on) return ids.includes(id) ? ids : [...ids, id];
	return ids.filter((x) => x !== id);
}
function confirmBatchDelete(kind, count, extra = "") {
	if (count <= 0 || typeof window === "undefined") return false;
	const more = extra ? `\n${extra}` : "";
	return window.confirm(`确定删除选中的 ${count} 条${kind}？${more}\n删除后不能撤销。`);
}
export { toggleSel as a, money as i, confirmBatchDelete as n, uid as o, copyText as r, cn as t };
