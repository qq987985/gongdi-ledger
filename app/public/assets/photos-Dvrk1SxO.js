import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";
import{r as t}from"./audit-K39-jiKA.js";
import{t as n}from"./jsx-runtime-DREnUpxT.js";
import{i as usePhotoFlags,n as PhotoSlot,r as ScanPhotosButton,t as PhotoFlag}from"./photo-slot-D71m3Ysb.js";
import{g as Input,v as Button,y as useApp}from"./index-ghxum7yZ.js";
import{n as Need}from"./can-9AzYldNF.js";
import{t as Badge}from"./badge-_ctqz85I.js";
var import_react=e(t()),import_jsx_runtime=n();
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
	return (0, import_jsx_runtime.jsx)(Need, {
		perm: "photos.view",
		children: (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				(0, import_jsx_runtime.jsxs)("header", { children: [
					(0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-semibold",
						children: "照片管理"
					}),
					(0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "点「更改」弹出编辑。点遮罩或 Esc 关闭。人员照片：张三-身份证-正面.jpg、张三-身份证-反面.jpg。"
					})
				] }),
				(0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						(0, import_jsx_runtime.jsx)(Input, {
							className: "max-w-sm",
							placeholder: "筛选姓名或班组",
							value: q,
							onChange: (e) => setQ(e.target.value)
						}),
						(0, import_jsx_runtime.jsx)(ScanPhotosButton, {
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
						].map(([k, label]) => (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFilter(k),
							className: `h-11 rounded-full border px-3 text-sm ${filter === k ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted"}`,
							children: label
						}, k))
					]
				}),
				(0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto rounded-xl border border-line bg-surface",
					children: (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-ledger text-left text-sm",
						children: [
							(0, import_jsx_runtime.jsx)("thead", {
								className: "border-b border-line text-xs text-muted",
								children: (0, import_jsx_runtime.jsxs)("tr", { children: [
									(0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "操作" }),
									(0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "姓名" }),
									(0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "班组" }),
									(0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "身份证正面" }),
									(0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "身份证反面" }),
									(0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "银行卡" }),
									(0, import_jsx_runtime.jsx)("th", { className: "p-3", children: "IC卡" })
								] })
							}),
							(0, import_jsx_runtime.jsxs)("tbody", { children: [
								filtered.length === 0 ? (0, import_jsx_runtime.jsx)("tr", { children: (0, import_jsx_runtime.jsx)("td", {
									colSpan: 7,
									className: "p-8 text-center text-muted",
									children: "没有匹配的人员"
								}) }) : null,
								filtered.map((p) => {
									const f = flags[p.name] || {
										id: false,
										idBack: false,
										bank: false,
										ic: false
									};
									const on = picked === p.name;
									return (0, import_jsx_runtime.jsxs)("tr", {
										className: `border-b border-line last:border-0 hover:bg-accent-soft ${on ? "bg-accent-soft" : ""}`,
										children: [
											(0, import_jsx_runtime.jsx)("td", {
												className: "p-3",
												children: (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													size: "sm",
													type: "button",
													onClick: () => setPicked(p.name),
													children: "更改"
												})
											}),
											(0, import_jsx_runtime.jsx)("td", { className: "p-3 font-medium", children: p.name }),
											(0, import_jsx_runtime.jsx)("td", { className: "p-3 text-muted", children: p.team }),
											(0, import_jsx_runtime.jsx)("td", { className: "p-3", children: (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.id }) }),
											(0, import_jsx_runtime.jsx)("td", { className: "p-3", children: (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.idBack }) }),
											(0, import_jsx_runtime.jsx)("td", { className: "p-3", children: (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.bank }) }),
											(0, import_jsx_runtime.jsx)("td", { className: "p-3", children: (0, import_jsx_runtime.jsx)(PhotoFlag, { ok: f.ic }) })
										]
									}, p.id);
								})
							] })
						]
					})
				}),
				pickedPerson ? (0, import_jsx_runtime.jsx)(PhotoEditor, {
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
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key !== "Escape") return;
			if (document.querySelector("[data-modal]")) return;
			onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6",
		onClick: onClose,
		children: (0, import_jsx_runtime.jsxs)("section", {
			className: "max-h-screen w-full max-w-5xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-6 shadow-panel md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			children: [
				(0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3 border-b border-line py-3",
					children: [
						(0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								(0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-lg font-semibold",
									children: `编辑照片 · ${person.name}`
								}),
								(0, import_jsx_runtime.jsx)(Badge, { children: person.team })
							]
						}),
						(0, import_jsx_runtime.jsx)("div", {
							className: "btn-row",
							children: (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								type: "button",
								onClick: onClose,
								children: "关闭"
							})
						})
					]
				}),
				(0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 grid gap-4 md:grid-cols-3",
					children: [
						(0, import_jsx_runtime.jsx)(PhotoSlot, {
							name: person.name,
							kind: "id",
							onChanged
						}, `id-${tick}`),
						(0, import_jsx_runtime.jsx)(PhotoSlot, {
							name: person.name,
							kind: "bank",
							onChanged
						}, `bank-${tick}`),
						(0, import_jsx_runtime.jsx)(PhotoSlot, {
							name: person.name,
							kind: "ic",
							onChanged
						}, `ic-${tick}`)
					]
				})
			]
		})
	});
}
export { PhotosPage as component };
