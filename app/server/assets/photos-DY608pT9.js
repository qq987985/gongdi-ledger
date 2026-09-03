import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import "./perms-BlHKQb24.js";
import "./excel-BRkrzoxa.js";
import { t as useApp } from "./store-Dl6VldK8.js";
import "./nas-sync-D4EOa45g.js";
import { i as usePhotoFlags, n as PhotoSlot, r as ScanPhotosButton, t as PhotoFlag } from "./photo-slot-qBfnrqsr.js";
import "./file-pick-BCv2SWUM.js";
import "./dist-DdkhMw2U.js";
import { t as Button } from "./button-CvAvwlYd.js";
import { t as Input } from "./input-BWJYTTKH.js";
import { n as Need } from "./can-zSnmIuUg.js";
import { t as Badge } from "./badge-Dj5bEQZ9.js";
import "./photos-BCUJDCy1.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function PhotosPage() {
	const people = useApp((s) => s.people);
	const [q, setQ] = import_react.useState("");
	const [filter, setFilter] = import_react.useState("all");
	const [picked, setPicked] = import_react.useState(null);
	const [tick, setTick] = import_react.useState(0);
	const names = import_react.useMemo(() => people.map((p) => p.name), [people]);
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
					children: "点「编辑」弹出编辑。点遮罩或 Esc 关闭。人员照片：张三-身份证-正面.jpg、张三-身份证-反面.jpg。"
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
									children: "操作"
								}),
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
							colSpan: 7,
							className: "p-8 text-center text-muted",
							children: "没有匹配的人员"
						}) }) : null, filtered.map((p) => {
							const f = flags[p.name] || {
								id: false,
								idBack: false,
								bank: false,
								ic: false
							};
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: `border-b border-line last:border-0 hover:bg-accent-soft ${picked === p.name ? "bg-accent-soft" : ""}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "sm",
											type: "button",
											onClick: () => setPicked(p.name),
											children: "编辑"
										})
									}),
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
				pickedPerson ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoEditor, {
					person: pickedPerson,
					tick,
					onClose: () => setPicked(null),
					onChanged: () => setTick((n) => n + 1)
				}) : null
			]
		})
	});
}
function PhotoEditor({ person, tick, onClose, onChanged }) {
	import_react.useEffect(() => {
		const onKey = (e) => {
			if (e.key !== "Escape") return;
			if (document.querySelector("[data-modal]")) return;
			onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "max-h-screen w-full max-w-5xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-6 shadow-panel md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3 border-b border-line py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-display text-lg font-semibold",
						children: ["编辑照片 · ", person.name]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: person.team })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "btn-row",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						type: "button",
						onClick: onClose,
						children: "关闭"
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
						name: person.name,
						kind: "id",
						onChanged
					}, `id-${tick}`),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
						name: person.name,
						kind: "bank",
						onChanged
					}, `bank-${tick}`),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoSlot, {
						name: person.name,
						kind: "ic",
						onChanged
					}, `ic-${tick}`)
				]
			})]
		})
	});
}
export { PhotosPage as component };
