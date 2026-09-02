import { t as cn } from "./utils-CBhPqRT8.js";
import { t as Button } from "./button-Zdwj1dRR.js";
import { t as DropSurface } from "./file-pick-BdsLRyGI.js";
import { a as fileToDataUrl, c as scanPhotoFolder, i as downloadPhoto, l as setPhoto, n as copyPhoto, o as getPhoto, r as deletePhoto, s as listPhotoFlags } from "./photos-CvRcX5fq.js";
import * as React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Camera, Check, Copy, Download, Expand, X } from "lucide-react";
import { toast } from "sonner";
function usePhotoFlags(names, nonce = 0) {
	const [flags, setFlags] = React.useState({});
	const key = names.join("\n");
	React.useEffect(() => {
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
function PhotoFlag({ ok }) {
	return ok ? /* @__PURE__ */ jsxs("span", {
		className: "inline-flex items-center gap-1 text-xs text-ok",
		children: [/* @__PURE__ */ jsx(Check, { className: "size-3" }), " 已上传"]
	}) : /* @__PURE__ */ jsx("span", {
		className: "text-xs text-subtle",
		children: "待上传"
	});
}
function ScanPhotosButton({ names, onDone }) {
	const [busy, setBusy] = React.useState(false);
	return /* @__PURE__ */ jsx(Button, {
		type: "button",
		size: "sm",
		variant: "outline",
		disabled: busy || !names.length,
		onClick: async () => {
			setBusy(true);
			try {
				const r = await scanPhotoFolder(names);
				const n = Object.values(r.flags || {}).filter((f) => f.id || f.idBack || f.bank || f.ic).length;
				if (n) toast.success(`扫描完成：身份证 ${r.matched.id + r.matched.idBack}、银行卡 ${r.matched.bank}、IC卡 ${r.matched.ic}（人员 ${r.people}）。`);
				if (!n && r.dirs?.some((d) => d.count > 0)) toast.message("文件夹有图，但姓名对不上。请用「张三-身份证-正面.jpg」「张三-身份证-反面.jpg」。");
				if (!n && !r.dirs?.some((d) => d.count > 0)) toast.error("这几个目录是空的：data/photos/id、bank、ic");
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
function IdCardSlot({ name, compact, onChanged }) {
	const [front, setFront] = React.useState(null);
	const [back, setBack] = React.useState(null);
	const [busy, setBusy] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const [face, setFace] = React.useState("front");
	const frontRef = React.useRef(null);
	const backRef = React.useRef(null);
	const photoAccept = "image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp";
	React.useEffect(() => {
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
	const compactView = /* @__PURE__ */ jsxs("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-xs font-medium text-muted",
					children: "身份证"
				}), front ? /* @__PURE__ */ jsx(PhotoFlag, { ok: Boolean(front && back) }) : null]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					disabled: busy,
					className: cn(btnFill, !front && "opacity-70"),
					onClick: () => frontRef.current?.click(),
					children: [/* @__PURE__ */ jsx(Camera, { className: "mr-0.5 size-3.5" }), front ? "换正面" : "正面"]
				}), /* @__PURE__ */ jsxs("button", {
					type: "button",
					disabled: busy,
					className: cn(btnFill, !back && "opacity-70"),
					onClick: () => backRef.current?.click(),
					children: [/* @__PURE__ */ jsx(Camera, { className: "mr-0.5 size-3.5" }), back ? "换反面" : "反面"]
				})]
			}),
			/* @__PURE__ */ jsx("input", {
				ref: frontRef,
				type: "file",
				accept: photoAccept,
				className: "sr-only",
				onChange: (e) => {
					const f = e.target.files?.[0];
					e.target.value = "";
					if (f) onFile(f, "id");
				}
			}),
			/* @__PURE__ */ jsx("input", {
				ref: backRef,
				type: "file",
				accept: photoAccept,
				className: "sr-only",
				onChange: (e) => {
					const f = e.target.files?.[0];
					e.target.value = "";
					if (f) onFile(f, "idBack");
				}
			})
		]
	});
	if (compact) return compactView;
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		compactView,
		front || back ? /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => setOpen(true),
			className: "mt-2 block text-xs text-accent hover:underline",
			children: [/* @__PURE__ */ jsx(Expand, { className: "mr-1 inline size-3" }), " 放大查看"]
		}) : null,
		open ? /* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm",
			onClick: (e) => {
				if (e.target === e.currentTarget) setOpen(false);
			},
			children: /* @__PURE__ */ jsxs("div", {
				className: "max-h-full max-w-full overflow-auto rounded-xl border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "mb-2 flex items-center justify-between",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-sm font-medium",
							children: [name, " - 身份证"]
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: btnGhost,
							onClick: () => setOpen(false),
							children: /* @__PURE__ */ jsx(X, { className: "size-4" })
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex gap-2 border-b border-line pb-2",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							className: cn(btnGhost, face === "front" && "text-accent"),
							onClick: () => setFace("front"),
							children: "正面"
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							className: cn(btnGhost, face === "back" && "text-accent"),
							onClick: () => setFace("back"),
							children: "反面"
						})]
					}),
					shown ? /* @__PURE__ */ jsxs("div", {
						className: "mt-2 space-y-2",
						children: [/* @__PURE__ */ jsx("img", {
							src: shown,
							alt: "身份证",
							className: "max-h-[70vh] rounded border border-line"
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex gap-2",
							children: [
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									className: btnGhost,
									onClick: () => copyFace(face),
									children: [/* @__PURE__ */ jsx(Copy, { className: "mr-1 size-3" }), " 复制"]
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									className: btnGhost,
									onClick: () => downloadPhoto(name, face === "back" ? "idBack" : "id", shown),
									children: [/* @__PURE__ */ jsx(Download, { className: "mr-1 size-3" }), " 下载"]
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: cn(btnGhost, "text-danger hover:text-danger"),
									onClick: async () => {
										if (!confirm(`删除 ${name} 的${face === "back" ? "反面" : "正面"}？`)) return;
										await deletePhoto(name, face === "back" ? "idBack" : "id");
										if (face === "back") setBack(null);
										else setFront(null);
										onChanged?.();
										toast.success("已删除");
									},
									children: "删除"
								})
							]
						})]
					}) : /* @__PURE__ */ jsx("div", {
						className: "py-8 text-center text-sm text-muted",
						children: "尚未上传"
					})
				]
			})
		}) : null
	] });
}
function SinglePhotoSlot({ name, kind, label, compact, onChanged }) {
	const [url, setUrl] = React.useState(null);
	const [busy, setBusy] = React.useState(false);
	const [open, setOpen] = React.useState(false);
	const photoAccept = "image/jpeg,image/png,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp";
	React.useEffect(() => {
		let live = true;
		getPhoto(name, kind).then((v) => {
			if (live) setUrl(v);
		});
		return () => {
			live = false;
		};
	}, [name, kind]);
	async function onFile(file) {
		setBusy(true);
		try {
			const dataUrl = await fileToDataUrl(file);
			await setPhoto(name, kind, dataUrl);
			setUrl(await getPhoto(name, kind) || dataUrl);
			onChanged?.();
			toast.success(`${label}已保存`);
		} finally {
			setBusy(false);
		}
	}
	const btnFill = "btn inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm bg-accent text-xs font-medium text-accent-fg";
	const btnGhost = "inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1 text-xs";
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-xs font-medium text-muted",
					children: label
				}), url ? /* @__PURE__ */ jsx(PhotoFlag, { ok: true }) : null]
			}),
			/* @__PURE__ */ jsxs(DropSurface, {
				accept: photoAccept,
				onFiles: (files) => onFile(files[0]),
				className: cn("rounded-lg border border-dashed border-line-strong bg-bg-elevated px-3 py-2 text-center", busy && "opacity-60"),
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: busy,
						className: cn(btnFill, !url && "opacity-70"),
						onClick: (e) => {
							(e.currentTarget.parentElement?.querySelector("input[type=file]"))?.click();
						},
						children: [/* @__PURE__ */ jsx(Camera, { className: "mr-0.5 size-3.5" }), url ? `换${label}` : `上传${label}`]
					}),
					/* @__PURE__ */ jsx("input", {
						type: "file",
						accept: photoAccept,
						className: "sr-only",
						onChange: (e) => {
							const f = e.target.files?.[0];
							e.target.value = "";
							if (f) onFile(f);
						}
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] text-muted",
						children: url ? "点击或拖新图替换" : "点击选择或拖到这里"
					})
				]
			}),
			url && !compact ? /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: () => setOpen(true),
				className: "block text-xs text-accent hover:underline",
				children: [/* @__PURE__ */ jsx(Expand, { className: "mr-1 inline size-3" }), " 放大查看"]
			}) : null,
			open && url ? /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm",
				onClick: (e) => {
					if (e.target === e.currentTarget) setOpen(false);
				},
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-h-full max-w-full overflow-auto rounded-xl border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-2 flex items-center justify-between",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "text-sm font-medium",
								children: [
									name,
									" - ",
									label
								]
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								className: btnGhost,
								onClick: () => setOpen(false),
								children: /* @__PURE__ */ jsx(X, { className: "size-4" })
							})]
						}),
						/* @__PURE__ */ jsx("img", {
							src: url,
							alt: label,
							className: "max-h-[70vh] rounded border border-line"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-2 flex gap-2",
							children: [
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									className: btnGhost,
									onClick: async () => {
										if (await copyPhoto(url, `${name}-${label}.png`) === "clipboard") toast.success("图片已复制，可粘贴到微信 / WPS");
										else toast.message("当前环境不能写剪贴板，已改为下载，从下载里打开再复制");
									},
									children: [/* @__PURE__ */ jsx(Copy, { className: "mr-1 size-3" }), " 复制"]
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									className: btnGhost,
									onClick: () => downloadPhoto(name, kind, url),
									children: [/* @__PURE__ */ jsx(Download, { className: "mr-1 size-3" }), " 下载"]
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: cn(btnGhost, "text-danger hover:text-danger"),
									onClick: async () => {
										if (!confirm(`删除 ${name} 的${label}？`)) return;
										await deletePhoto(name, kind);
										setUrl(null);
										onChanged?.();
										toast.success("已删除");
									},
									children: "删除"
								})
							]
						})
					]
				})
			}) : null
		]
	});
}
var KIND_LABEL = {
	id: "身份证",
	idBack: "身份证-反面",
	bank: "银行卡",
	ic: "IC卡"
};
function PhotoSlot({ name, kind, compact, onChanged }) {
	if (kind === "id") return /* @__PURE__ */ jsx(IdCardSlot, {
		name,
		compact,
		onChanged
	});
	if (kind) return /* @__PURE__ */ jsx(SinglePhotoSlot, {
		name,
		kind,
		label: KIND_LABEL[kind],
		compact,
		onChanged
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ jsx(IdCardSlot, {
			name,
			compact,
			onChanged
		}), /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-2 gap-3",
			children: [/* @__PURE__ */ jsx(SinglePhotoSlot, {
				name,
				kind: "bank",
				label: "银行卡",
				compact,
				onChanged
			}), /* @__PURE__ */ jsx(SinglePhotoSlot, {
				name,
				kind: "ic",
				label: "IC卡",
				compact,
				onChanged
			})]
		})]
	});
}
export { usePhotoFlags as i, PhotoSlot as n, ScanPhotosButton as r, PhotoFlag as t };
