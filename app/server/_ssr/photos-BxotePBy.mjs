import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Input, y as useApp } from "./router-DxdzlCp3.mjs";
import { n as Need } from "./can-gkGWV5bu.mjs";
import { t as Badge } from "./badge-U3vNDWCk.mjs";
import { i as usePhotoFlags, n as PhotoSlot, r as ScanPhotosButton, t as PhotoFlag } from "./photo-slot--a6wKkGX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/photos-BxotePBy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PhotosPage() {
	const people = useApp((s) => s.people);
	const [q, setQ] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [tick, setTick] = (0, import_react.useState)(0);
	const names = (0, import_react.useMemo)(() => people.map((p) => p.name), [people]);
	const flags = usePhotoFlags(names, tick);
	const filtered = people.filter((p) => {
		if (q && !p.name.includes(q) && !p.team.includes(q)) return false;
		const f = flags[p.name] || {
			id: false,
			idBack: false,
			bank: false,
			ic: false
		};
		if (filter === "missing") return !(f.id && f.idBack && f.bank && f.ic);
		if (filter === "id") return !f.id;
		if (filter === "idBack") return !f.idBack;
		if (filter === "bank") return !f.bank;
		if (filter === "ic") return !f.ic;
		return true;
	});
	const pickedPerson = people.find((p) => p.name === picked);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Need, {
		perm: "photos.view",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold",
					children: "照片管理"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "人员和合同影像都在 data/photos。人员照片：张三-身份证-正面.jpg、张三-身份证-反面.jpg。显示正面，点「查看反面」。"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-sm",
							placeholder: "筛选姓名或班组",
							value: q,
							onChange: (e) => setQ(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScanPhotosButton, {
							names,
							onDone: () => setTick((n) => n + 1)
						}),
						[
							["all", "全部"],
							["missing", "缺任意"],
							["id", "缺正面"],
							["idBack", "缺反面"],
							["bank", "缺银行卡"],
							["ic", "缺IC卡"]
						].map(([k, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFilter(k),
							className: `h-11 rounded-full border px-3 text-sm ${filter === k ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted"}`,
							children: label
						}, k))
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-xl border border-line bg-surface",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-ledger text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "border-b border-line text-xs text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "姓名"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "班组"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "身份证正面"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "身份证反面"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "银行卡"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "p-3",
									children: "IC卡"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 6,
							className: "p-8 text-center text-muted",
							children: "没有匹配的人员"
						}) }) : null, filtered.map((p) => {
							const f = flags[p.name] || {
								id: false,
								idBack: false,
								bank: false,
								ic: false
							};
							const on = picked === p.name;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: `cursor-pointer border-b border-line last:border-0 ${on ? "bg-accent-soft" : "hover:bg-bg-elevated"}`,
								onClick: () => setPicked((s) => s === p.name ? null : p.name),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 font-medium",
										children: p.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 text-muted",
										children: p.team
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.id })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.idBack })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.bank })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.ic })
									})
								]
							}, p.id);
						})] })]
					})
				}),
				pickedPerson ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: pickedPerson.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: pickedPerson.team })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 md:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
								name: pickedPerson.name,
								kind: "id",
								onChanged: () => setTick((n) => n + 1)
							}, `id-${tick}`),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
								name: pickedPerson.name,
								kind: "bank",
								onChanged: () => setTick((n) => n + 1)
							}, `bank-${tick}`),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
								name: pickedPerson.name,
								kind: "ic",
								onChanged: () => setTick((n) => n + 1)
							}, `ic-${tick}`)
						]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "点选表格中的姓名，查看或上传照片。"
				})
			]
		})
	});
}
//#endregion
export { PhotosPage as component };
