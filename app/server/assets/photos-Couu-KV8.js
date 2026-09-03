import { n as nasEnabled } from "./nas-sync-qEji0zfO.js";
var DB_NAME = "gongdi-photos";
var STORE = "photos";
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
function photoKey(name, kind) {
	return `${name.trim()}::${kind}`;
}
function photoFileName(name, kind, ext = "jpg") {
	const label = kind === "idBack" ? "身份证-反面" : kind === "id" || kind === "idFront" ? "身份证-正面" : kind === "bank" ? "银行卡" : "IC卡";
	return `${name.trim()}-${label}.${ext}`;
}
async function idbGet(name, kind) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).get(photoKey(name, kind));
		req.onsuccess = () => resolve(req.result || null);
		req.onerror = () => reject(req.error);
	});
}
async function idbSet(name, kind, dataUrl) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(dataUrl, photoKey(name, kind));
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function idbDel(name, kind) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).delete(photoKey(name, kind));
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function getPhoto(name, kind) {
	if (nasEnabled()) try {
		const j = await (await fetch(`/api/photo?name=${encodeURIComponent(name)}&kind=${kind}`, { credentials: "include" })).json();
		if (j.url) return j.url;
		if (j.dataUrl) return j.dataUrl;
	} catch {}
	return idbGet(name, kind);
}
async function setPhoto(name, kind, dataUrl) {
	await idbSet(name, kind, dataUrl);
	if (nasEnabled()) await fetch("/api/photo", {
		method: "PUT",
		credentials: "include",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			name,
			kind,
			dataUrl
		})
	});
}
async function deletePhoto(name, kind) {
	await idbDel(name, kind);
	if (nasEnabled()) await fetch(`/api/photo?name=${encodeURIComponent(name)}&kind=${kind}`, {
		method: "DELETE",
		credentials: "include"
	});
}
async function listPhotoFlags(names) {
	if (nasEnabled() && names.length) try {
		const j = await (await fetch("/api/photo-flags", {
			method: "POST",
			credentials: "include",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ names })
		})).json();
		if (j.flags) return j.flags;
	} catch {}
	const db = await openDb();
	const flags = {};
	await new Promise((resolve, reject) => {
		const store = db.transaction(STORE, "readonly").objectStore(STORE);
		let pending = names.length * 4;
		if (pending === 0) {
			resolve();
			return;
		}
		for (const name of names) {
			flags[name] = {
				id: false,
				idBack: false,
				bank: false,
				ic: false
			};
			[
				"id",
				"idBack",
				"bank",
				"ic"
			].forEach((kind) => {
				const req = store.get(photoKey(name, kind));
				req.onsuccess = () => {
					flags[name][kind] = Boolean(req.result);
					pending -= 1;
					if (pending === 0) resolve();
				};
				req.onerror = () => reject(req.error);
			});
		}
	});
	return flags;
}
async function clearAllPhotos() {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).clear();
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
function extOf(dataUrl) {
	if (dataUrl.includes("image/png")) return "png";
	if (dataUrl.includes("image/webp")) return "webp";
	if (dataUrl.includes("image/bmp")) return "bmp";
	return "jpg";
}
async function scanPhotoFolder(names) {
	const r = await fetch("/api/photo-scan", {
		method: "POST",
		credentials: "include",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ names: names || [] })
	});
	if (!r.ok) throw new Error("扫描失败");
	return await r.json();
}
function dataUrlToBlob(dataUrl) {
	const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
	if (!m) return new Blob([dataUrl], { type: "application/octet-stream" });
	const bin = atob(m[2]);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return new Blob([bytes], { type: m[1] });
}
async function srcToBlob(src) {
	if (src.startsWith("data:")) return dataUrlToBlob(src);
	return (await fetch(src, { credentials: "include" })).blob();
}
function downloadPhoto(name, kind, dataUrl) {
	srcToBlob(dataUrl).then((blob) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = photoFileName(name, kind, extOf(dataUrl) === "jpg" && !dataUrl.startsWith("data:") ? "png" : extOf(dataUrl));
		a.style.display = "none";
		document.body.appendChild(a);
		a.dispatchEvent(new MouseEvent("click", {
			bubbles: true,
			cancelable: true,
			view: window
		}));
		window.setTimeout(() => {
			a.remove();
			URL.revokeObjectURL(url);
		}, 2e3);
	});
}
async function copyPhoto(dataUrl, filename = "photo.png") {
	const blob = await srcToBlob(dataUrl);
	const png = blob.type === "image/png" ? blob : await new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const c = document.createElement("canvas");
			c.width = img.naturalWidth || img.width;
			c.height = img.naturalHeight || img.height;
			const ctx = c.getContext("2d");
			if (!ctx) {
				resolve(blob);
				return;
			}
			ctx.drawImage(img, 0, 0);
			c.toBlob((b) => resolve(b || blob), "image/png");
		};
		img.onerror = () => reject(/* @__PURE__ */ new Error("decode"));
		img.src = dataUrl;
	});
	try {
		if (navigator.clipboard && "ClipboardItem" in window) {
			await navigator.clipboard.write([new ClipboardItem({ [png.type]: png })]);
			return "clipboard";
		}
	} catch {}
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 2e3);
	return "download";
}
export { fileToDataUrl as a, scanPhotoFolder as c, downloadPhoto as i, setPhoto as l, copyPhoto as n, getPhoto as o, deletePhoto as r, listPhotoFlags as s, clearAllPhotos as t };
