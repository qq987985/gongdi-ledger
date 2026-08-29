import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as Camera, E as Check, S as Copy, b as Expand, t as X, x as Download } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { f as Button } from "./router-DxdzlCp3.mjs";
import { t as DropSurface } from "./file-pick-BbqxzWa5.mjs";
import { t as Badge } from "./badge-U3vNDWCk.mjs";
import { a as fileToDataUrl, c as scanPhotoFolder, i as downloadPhoto, l as setPhoto, n as copyPhoto, o as getPhoto, r as deletePhoto, s as listPhotoFlags } from "./photos-p9XRTJ79.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/photo-slot--a6wKkGX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LABELS = {
	id: "身份证-正面",
	idFront: "身份证-正面",
	idBack: "身份证-反面",
	bank: "银行卡",
	ic: "IC卡"
};
function usePhotoFlags(names, nonce = 0) {
	const [flags, setFlags] = (0, import_react.useState)({});
	const key = names.join("\n");
	(0, import_react.useEffect)(() => {
		let live = true;
		const list = key ? key.split("\n") : [];
		if (!list.length) {
			setFlags({});
			return;
		}
		listPhotoFlags(list).then((v) => {
			if (live) setFlags(v);
		});
		return () => {
			live = false;
		};
	}, [key, nonce]);
	return flags;
}
function IdCardSlot({ name, compact, onChanged }) {
	const [front, setFront] = (0, import_react.useState)(null);
	const [back, setBack] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [face, setFace] = (0, import_react.useState)("front");
	const frontRef = (0, import_react.useRef)(null);
	const backRef = (0, import_react.useRef)(null);
	const photoAccept = "image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp";
	(0, import_react.useEffect)(() => {
		let live = true;
		Promise.all([getPhoto(name, "id"), getPhoto(name, "idBack")]).then(([f, b]) => {
			if (live) {
				setFront(f);
				setBack(b);
			}
		});
		return () => {
			live = false;
		};
	}, [name]);
	async function onFile(file, kind) {
		if (!file || !name) return;
		setBusy(true);
		try {
			const url = await fileToDataUrl(file);
			await setPhoto(name, kind, url);
			const saved = await getPhoto(name, kind) || url;
			if (kind === "idBack") setBack(saved);
			else setFront(saved);
			onChanged?.();
			toast.success(kind === "idBack" ? `反面已保存为「${name}-身份证-反面」` : `正面已保存为「${name}-身份证-正面」`);
		} finally {
			setBusy(false);
		}
	}
	async function copyFace(which) {
		const pic = which === "back" ? back : front;
		if (!pic) return;
		if (await copyPhoto(pic, `${name}-身份证-${which === "back" ? "反面" : "正面"}.png`) === "clipboard") toast.success("图片已复制，可粘贴到微信 / WPS");
		else toast.message("当前环境不能写剪贴板，已改为下载，从下载里打开再复制");
	}
	const shown = face === "back" && back ? back : front;
	const btnFill = "btn inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm bg-accent text-xs font-medium text-accent-fg";
	const btnGhost = "inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1 text-xs";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium text-muted",
					children: "身份证"
				}), front ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "ok",
					children: back ? "正反面齐全" : "仅正面"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "待上传正面" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropSurface, {
				accept: photoAccept,
				disabled: !name || busy,
				onFiles: (files) => void onFile(files[0], "id"),
				className: "overflow-hidden rounded-md border border-dashed border-line bg-bg",
				activeClassName: "border-accent bg-accent-soft",
				children: front ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "block w-full",
					onClick: () => {
						setFace("front");
						setOpen(true);
					},
					title: "点击看正面大图，拖入可更换正面",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: front,
						alt: `${name}身份证正面`,
						className: compact ? "h-28 w-full object-cover" : "h-40 w-full object-contain"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `flex w-full flex-col items-center justify-center gap-1 text-subtle ${compact ? "h-28" : "h-40"}`,
					disabled: !name || busy,
					onClick: () => frontRef.current?.click(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-5" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs",
							children: busy ? "上传中…" : "点击上传正面"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-2 text-center text-[11px] text-muted",
							children: "文件名：姓名-身份证-正面"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: frontRef,
				type: "file",
				accept: photoAccept,
				className: "hidden",
				disabled: !name || busy,
				onChange: (e) => {
					const f = e.target.files?.[0];
					e.target.value = "";
					if (f && confirm(`确认上传「${f.name}」？`)) onFile(f, "id");
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: backRef,
				type: "file",
				accept: photoAccept,
				className: "hidden",
				disabled: !name || busy,
				onChange: (e) => {
					const f = e.target.files?.[0];
					e.target.value = "";
					if (f && confirm(`确认上传「${f.name}」？`)) onFile(f, "idBack");
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				children: [
					front ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: btnFill,
						onClick: () => frontRef.current?.click(),
						children: "更换正面"
					}) : null,
					back ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: btnFill,
						onClick: () => {
							setFace("back");
							setOpen(true);
						},
						children: "查看反面"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: btnFill,
						disabled: !name || busy,
						onClick: () => backRef.current?.click(),
						children: "上传反面"
					}),
					back ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: btnFill,
						onClick: () => backRef.current?.click(),
						children: "更换反面"
					}) : null
				]
			}),
			front ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-4 gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: btnGhost,
						onClick: () => {
							setFace("front");
							setOpen(true);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Expand, { className: "size-3.5 shrink-0" }), "放大"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: btnGhost,
						onClick: () => void copyFace("front"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5 shrink-0" }), "复制"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: btnGhost,
						onClick: () => downloadPhoto(name, "id", front),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5 shrink-0" }), "下载"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${btnGhost} text-danger`,
						onClick: async () => {
							await deletePhoto(name, "id");
							setFront(null);
							setOpen(false);
							onChanged?.();
						},
						children: "清除"
					})
				]
			}) : null,
			open && shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoLightbox, {
				src: shown,
				title: `${name} · 身份证${face === "back" ? "反面" : "正面"}`,
				onClose: () => setOpen(false),
				onCopy: async () => {
					if (await copyPhoto(shown, `${name}-身份证-${face === "back" ? "反面" : "正面"}.png`) === "clipboard") toast.success("图片已复制，可粘贴到微信 / WPS");
					else toast.message("当前环境不能写剪贴板，已改为下载，从下载里打开再复制");
				},
				onDownload: () => downloadPhoto(name, face === "back" ? "idBack" : "id", shown),
				extra: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-sm px-3 py-1 text-xs ${face === "front" ? "bg-accent text-accent-fg" : "bg-surface text-ink"}`,
						onClick: () => setFace("front"),
						children: "正面"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `rounded-sm px-3 py-1 text-xs ${face === "back" ? "bg-accent text-accent-fg" : "bg-surface text-ink"}`,
						disabled: !back,
						onClick: () => setFace("back"),
						children: back ? "反面" : "暂无反面"
					})]
				})
			}) : null
		]
	});
}
function PhotoSlot({ name, kind, compact, onChanged }) {
	if (kind === "id" || kind === "idFront") return IdCardSlot({
		name,
		compact,
		onChanged
	});
	return PhotoSlotPlain({
		name,
		kind,
		compact,
		onChanged
	});
}
function PhotoSlotPlain({ name, kind, compact, onChanged }) {
	const [src, setSrc] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [open, setOpen] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const photoAccept = "image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp";
	(0, import_react.useEffect)(() => {
		let live = true;
		getPhoto(name, kind).then((v) => {
			if (live) setSrc(v);
		});
		return () => {
			live = false;
		};
	}, [name, kind]);
	async function onFile(file) {
		if (!file || !name) return;
		setBusy(true);
		try {
			const url = await fileToDataUrl(file);
			await setPhoto(name, kind, url);
			const saved = await getPhoto(name, kind) || url;
			setSrc(saved);
			onChanged?.();
			toast.success(`${LABELS[kind]}已保存为「${name}-${LABELS[kind]}」`);
		} finally {
			setBusy(false);
		}
	}
	async function onCopy() {
		if (!src) return;
		if (await copyPhoto(src, `${name}-${LABELS[kind]}.png`) === "clipboard") toast.success("图片已复制，可粘贴到微信 / WPS");
		else toast.message("当前环境不能写剪贴板，已改为下载，从下载里打开再复制");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium text-muted",
					children: LABELS[kind]
				}), src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "ok",
					children: "已上传"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "待上传" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropSurface, {
				accept: photoAccept,
				disabled: !name || busy,
				onFiles: (files) => void onFile(files[0]),
				className: "overflow-hidden rounded-md border border-dashed border-line bg-bg",
				activeClassName: "border-accent bg-accent-soft",
				children: src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "block w-full",
					onClick: () => setOpen(true),
					title: "点击放大，拖入可更换",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src,
						alt: `${name}${LABELS[kind]}`,
						className: compact ? "h-28 w-full object-cover" : "h-40 w-full object-contain"
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `flex w-full flex-col items-center justify-center gap-1 text-subtle ${compact ? "h-28" : "h-40"}`,
					disabled: !name || busy,
					onClick: () => inputRef.current?.click(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-5" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs",
							children: busy ? "上传中…" : "点击上传"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-2 text-center text-[11px] text-muted",
							children: "或把照片拖到这里"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					type: "file",
					accept: photoAccept,
					className: "hidden",
					disabled: !name || busy,
					onChange: (e) => {
						const f = e.target.files?.[0];
						e.target.value = "";
						if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
					}
				}), src ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn inline-flex w-full items-center justify-center whitespace-nowrap rounded-sm bg-accent text-xs font-medium text-accent-fg",
					disabled: !name || busy,
					onClick: () => inputRef.current?.click(),
					children: "更换照片"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-4 gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1 text-xs",
							onClick: () => setOpen(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Expand, { className: "size-3.5 shrink-0" }), "放大"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1 text-xs",
							onClick: () => void onCopy(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5 shrink-0" }), "复制"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1 text-xs",
							onClick: () => downloadPhoto(name, kind, src),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5 shrink-0" }), "下载"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-sm px-1 text-xs text-danger",
							onClick: async () => {
								await deletePhoto(name, kind);
								setSrc(null);
								setOpen(false);
								onChanged?.();
							},
							children: "清除"
						})
					]
				})] }) : null]
			}),
			open && src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoLightbox, {
				src,
				title: `${name} · ${LABELS[kind]}`,
				onClose: () => setOpen(false),
				onCopy: () => void onCopy(),
				onDownload: () => downloadPhoto(name, kind, src)
			}) : null
		]
	});
}
function PhotoLightbox({ src, title, onClose, onCopy, onDownload, extra }) {
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-modal": true,
		className: "fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-h-full w-full max-w-5xl flex-col gap-3",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2 text-accent-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-medium",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							extra || null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-9 items-center gap-1 rounded-sm bg-surface px-2.5 text-xs text-ink",
								onClick: onCopy,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3.5" }), "复制图片"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-9 items-center gap-1 rounded-sm bg-surface px-2.5 text-xs text-ink",
								onClick: onDownload,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "下载"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-9 items-center gap-1 rounded-sm bg-surface px-2.5 text-xs text-ink",
								onClick: onClose,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), "关闭"]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src,
					alt: title,
					className: "max-h-[80vh] w-full rounded-md bg-bg object-contain"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-xs text-accent-fg/80",
					children: "可右键复制图片。Esc 或点空白处关闭。"
				})
			]
		})
	});
}
function ScanPhotosButton({ names, onDone }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		type: "button",
		variant: "outline",
		disabled: busy,
		onClick: async () => {
			setBusy(true);
			try {
				const r = await scanPhotoFolder(names);
				const n = r.matched.id + r.matched.bank + r.matched.ic + (r.matched.idBack || 0);
				const hit = r.dirs.filter((d) => d.count > 0);
				toast.success(`已扫描。正面 ${r.matched.id}、反面 ${r.matched.idBack || 0}、银行卡 ${r.matched.bank}、IC卡 ${r.matched.ic}（人员 ${r.people}）。`);
				if (!n && hit.length) toast.message("文件夹有图，但姓名对不上。请用「张三-身份证-正面.jpg」「张三-身份证-反面.jpg」。");
				if (!hit.length) toast.error("这几个目录是空的：data/photos/id、bank、ic");
				onDone?.();
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "扫描失败");
			} finally {
				setBusy(false);
			}
		},
		children: busy ? "扫描中…" : "扫描文件夹"
	});
}
function PhotoFlag({ ok }) {
	return ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1 text-xs text-ok",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }), " 已上传"]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-xs text-subtle",
		children: "待上传"
	});
}
//#endregion
export { usePhotoFlags as i, PhotoSlot as n, ScanPhotosButton as r, PhotoFlag as t };
