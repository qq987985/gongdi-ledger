import { V as __toESM, c as require_jsx_runtime } from "../server.js";
import { S as parseOtRule, v as encodeOtRule } from "./contracts-CQ-BNIxn.js";
import { t as Input } from "./input--dJb4stz.js";
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function PayTypePick({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
		className: "field-select w-full",
		value,
		onChange: (e) => onChange(e.target.value === "month" ? "month" : "day"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: "day",
			children: "按工天"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: "month",
			children: "按月"
		})]
	});
}
function OtRulePick({ value, onChange }) {
	const p = parseOtRule(value);
	const kind = p.kind;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "field-select w-auto",
				value: kind,
				onChange: (e) => {
					const k = e.target.value;
					if (k === "none") onChange("");
					else onChange(encodeOtRule(k, p.param || (k === "hour" ? 25 : 8)));
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "none",
						children: "不计加班"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "hour",
						children: "按小时"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "fold",
						children: "按折算"
					})
				]
			}),
			kind === "hour" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-1 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "w-24",
					type: "number",
					value: p.param || "",
					onChange: (e) => onChange(encodeOtRule("hour", Number(e.target.value) || 0))
				}), "元/小时"]
			}) : null,
			kind === "fold" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-1 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "w-24",
					type: "number",
					value: p.param || "",
					onChange: (e) => onChange(encodeOtRule("fold", Number(e.target.value) || 0))
				}), "小时折一天"]
			}) : null
		]
	});
}
export { PayTypePick as n, OtRulePick as t };
