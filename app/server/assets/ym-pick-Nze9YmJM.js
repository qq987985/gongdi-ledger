import { jsx, jsxs } from "react/jsx-runtime";
function ymKey(y, m) {
	return y * 12 + m;
}
function monthsInRange(fromY, fromM, toY, toM) {
	let a = ymKey(fromY, fromM);
	let b = ymKey(toY, toM);
	if (a > b) [a, b] = [b, a];
	const out = [];
	for (let k = a; k <= b; k++) {
		const year = Math.floor((k - 1) / 12);
		const month = (k - 1) % 12 + 1;
		out.push({
			year,
			month
		});
	}
	return out;
}
function rangeLabel(fromY, fromM, toY, toM) {
	const span = monthsInRange(fromY, fromM, toY, toM);
	const start = span[0];
	const end = span[span.length - 1];
	if (!start || !end) return "";
	if (start.year === end.year && start.month === end.month) return `${start.year}年${start.month}月`;
	return `${start.year}年${start.month}月 至 ${end.year}年${end.month}月`;
}
function YmPick({ label, years, y, m, onY, onM }) {
	const extra = years.includes(y) ? years : [...years, y].sort((a, b) => a - b);
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
		className: "text-xs text-muted",
		children: label
	}), /* @__PURE__ */ jsxs("div", {
		className: "mt-1 flex gap-1",
		children: [/* @__PURE__ */ jsx("select", {
			className: "field-select w-auto",
			value: y,
			onChange: (e) => onY(Number(e.target.value)),
			"aria-label": `${label}年`,
			children: extra.map((n) => /* @__PURE__ */ jsxs("option", {
				value: n,
				children: [n, "年"]
			}, n))
		}), /* @__PURE__ */ jsx("select", {
			className: "field-select w-auto",
			value: m,
			onChange: (e) => onM(Number(e.target.value)),
			"aria-label": `${label}月`,
			children: Array.from({ length: 12 }, (_, i) => i + 1).map((n) => /* @__PURE__ */ jsxs("option", {
				value: n,
				children: [n, "月"]
			}, n))
		})]
	})] });
}
export { ymKey as i, monthsInRange as n, rangeLabel as r, YmPick as t };
