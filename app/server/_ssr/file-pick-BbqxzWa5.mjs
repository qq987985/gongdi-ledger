import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as ImagePlus, u as Paperclip, v as FileSpreadsheet } from "../_libs/lucide-react.mjs";
import { dt as cn } from "./router-DxdzlCp3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/file-pick-BbqxzWa5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function acceptMatch(file, accept) {
	if (!accept) return true;
	const name = file.name.toLowerCase();
	const type = (file.type || "").toLowerCase();
	return accept.split(",").some((raw) => {
		const p = raw.trim().toLowerCase();
		if (!p) return false;
		if (p.startsWith(".")) return name.endsWith(p);
		if (p.endsWith("/*")) return type.startsWith(p.slice(0, -1));
		return type === p;
	});
}
function pickFiles(list, accept, multiple = false) {
	const files = (list ? [...list] : []).filter((f) => acceptMatch(f, accept));
	return multiple ? files : files.slice(0, 1);
}
function confirmUpload(files) {
	const list = !files ? [] : files instanceof File ? [files] : [...files].filter(Boolean);
	if (!list.length) return false;
	const names = list.map((f) => f.name).join("、");
	return confirm(list.length > 1 ? `确认上传这 ${list.length} 个文件？\n${names}` : `确认上传「${names}」？`);
}
function DropSurface({ accept = "", multiple, disabled, className, activeClassName = "border-accent bg-accent-soft", confirmDrop = true, onFiles, children }) {
	const [over, setOver] = (0, import_react.useState)(false);
	function give(list) {
		if (disabled) return;
		const files = pickFiles(list, accept, multiple);
		if (!files.length) return;
		if (confirmDrop && !confirmUpload(files)) return;
		onFiles(files);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(className, over && !disabled && activeClassName),
		onDragEnter: (e) => {
			e.preventDefault();
			if (!disabled) setOver(true);
		},
		onDragOver: (e) => {
			e.preventDefault();
			if (!disabled) setOver(true);
		},
		onDragLeave: (e) => {
			if (e.currentTarget.contains(e.relatedTarget)) return;
			setOver(false);
		},
		onDrop: (e) => {
			e.preventDefault();
			setOver(false);
			give(e.dataTransfer.files);
		},
		children
	});
}
function FilePick({ accept, label, hint, kind = "excel", multiple, disabled, compact, inline, onFile, onFiles }) {
	const ref = (0, import_react.useRef)(null);
	const [name, setName] = (0, import_react.useState)("");
	const Icon = kind === "image" ? ImagePlus : kind === "file" ? Paperclip : FileSpreadsheet;
	function take(files) {
		if (!files.length || disabled) return;
		if (!confirmUpload(files)) return;
		setName(files.map((f) => f.name).join("、"));
		onFiles?.(files);
		onFile?.(files[0]);
		if (ref.current) ref.current.value = "";
	}
	const btn = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		disabled,
		title: hint,
		className: "btn inline-flex items-center gap-1 rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50",
		onClick: () => ref.current?.click(),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
	});
	const input = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref,
		type: "file",
		accept,
		multiple,
		disabled,
		className: "sr-only",
		onChange: (e) => take(pickFiles(e.target.files, accept, multiple))
	});
	if (inline) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropSurface, {
		accept,
		multiple,
		disabled,
		confirmDrop: false,
		onFiles: take,
		className: cn("inline-flex", disabled && "opacity-50"),
		children: [input, btn]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropSurface, {
		accept,
		multiple,
		disabled,
		confirmDrop: false,
		onFiles: take,
		className: cn("rounded-lg border border-dashed transition-colors duration-150", compact ? "px-3 py-2" : "px-4 py-4", disabled ? "opacity-50" : "border-line-strong bg-bg-elevated"),
		children: [
			input,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled,
				className: "btn inline-flex items-center gap-1 rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50",
				onClick: () => ref.current?.click(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), label]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: name ? `已选：${name}` : hint || "点击选择，也可把文件拖到这里"
			})
		]
	});
}
//#endregion
export { FilePick as n, DropSurface as t, confirmUpload as a };
