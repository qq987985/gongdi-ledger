import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";
import{r as t}from"./audit-K39-jiKA.js";
import{t as n}from"./jsx-runtime-DREnUpxT.js";
import{t as cn}from"./utils-BSPq25aB.js";
var import_react=e(t(),1),import_jsx_runtime=n();
var PREFIX = "ledger-colw:";
var MIN_W = 48;
var PAGE_SIZES = [10, 20, 30, 40, 50];
var PAGE_KEY = "ledger-pagesize:";
function readPageSize(id) {
	try {
		const n = Number(localStorage.getItem(PAGE_KEY + id));
		return PAGE_SIZES.includes(n) ? n : 20;
	} catch {
		return 20;
	}
}
function usePager(id, list, resetKey) {
	const [size, setSize] = (0, import_react.useState)(() => readPageSize(id));
	const [page, setPage] = (0, import_react.useState)(1);
	const key = resetKey == null ? String(list.length) : String(resetKey);
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [key, size]);
	function changeSize(n) {
		setSize(n);
		try {
			localStorage.setItem(PAGE_KEY + id, String(n));
		} catch {}
	}
	const total = list.length;
	const pages = Math.max(1, Math.ceil(total / size) || 1);
	const p = Math.min(Math.max(1, page), pages);
	return {
		size,
		setSize: changeSize,
		page: p,
		setPage,
		pages,
		rows: list.slice((p - 1) * size, p * size),
		total
	};
}
function PageBar({ size, onSize, page, onPage, pages, total }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-1.5 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "field-select w-auto min-w-[4.5rem]",
						value: size,
						onChange: (e) => onSize(Number(e.target.value)),
						"aria-label": "每页条数",
						children: PAGE_SIZES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: n,
							children: n
						}, n))
					}),
					"条/页"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs tabular-nums text-muted",
				children: ["共 ", total, " 条"]
			}),
			pages > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn",
					disabled: page <= 1,
					onClick: () => onPage(page - 1),
					children: "上一页"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs tabular-nums text-muted",
					children: [page, " / ", pages]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn",
					disabled: page >= pages,
					onClick: () => onPage(page + 1),
					children: "下一页"
				})
			] }) : null
		]
	});
}
function readWidths(id) {
	try {
		const raw = localStorage.getItem(PREFIX + id);
		const arr = raw ? JSON.parse(raw) : [];
		return Array.isArray(arr) ? arr.map((n) => Number(n) || 0) : [];
	} catch {
		return [];
	}
}
function writeWidths(id, host) {
	const ths = [...host.querySelectorAll("thead th")];
	if (!ths.length) return;
	localStorage.setItem(PREFIX + id, JSON.stringify(ths.map((th) => Math.round(th.getBoundingClientRect().width))));
}
function applyWidths(host, widths) {
	const ths = [...host.querySelectorAll("thead th")];
	if (!widths.length || widths.length !== ths.length) return;
	ths.forEach((th, i) => {
		if (th.dataset.colLock) return;
		const w = widths[i];
		if (w >= MIN_W) {
			th.style.width = `${w}px`;
			th.style.minWidth = `${w}px`;
			th.style.maxWidth = `${w}px`;
		}
	});
}
function setThWidth(th, w) {
	if (th.dataset.colLock) return;
	const n = Math.max(MIN_W, w);
	th.style.width = `${n}px`;
	th.style.minWidth = `${n}px`;
	th.style.maxWidth = `${n}px`;
}
function onResizer(e, host) {
	const th = e.target.closest("th");
	if (!th || !host.contains(th)) return null;
	if (th.dataset.colLock) return null;
	if (th.getBoundingClientRect().right - e.clientX > 10) return null;
	return th;
}
function ThHint({ children, hint, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
		className: cn("p-3 text-center", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "th-title w-full text-center",
			children
		}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "th-hint w-full text-center",
			children: hint
		}) : null]
	});
}
function WideTable({ id, children, className }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const node = ref.current;
		if (!node) return;
		const host = node;
		applyWidths(host, readWidths(id));
		function down(e) {
			const th = onResizer(e, host);
			if (!th) return;
			e.preventDefault();
			e.stopPropagation();
			const startX = e.clientX;
			const startW = th.getBoundingClientRect().width;
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
			const move = (ev) => setThWidth(th, startW + ev.clientX - startX);
			const up = () => {
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
				writeWidths(id, host);
				window.removeEventListener("mousemove", move);
				window.removeEventListener("mouseup", up);
			};
			window.addEventListener("mousemove", move);
			window.addEventListener("mouseup", up);
		}
		function dbl(e) {
			const th = onResizer(e, host);
			if (!th) return;
			e.preventDefault();
			e.stopPropagation();
			setThWidth(th, MIN_W);
			writeWidths(id, host);
		}
		host.addEventListener("mousedown", down);
		host.addEventListener("dblclick", dbl);
		return () => {
			host.removeEventListener("mousedown", down);
			host.removeEventListener("dblclick", dbl);
		};
	}, [id]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1 hidden text-[11px] text-muted md:block",
			children: "底部左右滑动；拖表头右边线调列宽，双击收至最窄。调完会记住。"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1 text-[11px] text-muted md:hidden",
			children: "宽表请左右滑动。「更改」在勾选框右边。点一行是勾选。"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref,
			className: cn("wide-scroll overflow-x-scroll rounded-xl border border-line bg-surface", className),
			children
		})
	] });
}
export { WideTable as n, ThHint as t, PageBar as a, usePager as o };
