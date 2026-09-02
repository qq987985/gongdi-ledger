import { nasEnabled } from "./nas-sync";

const DB_NAME = "gongdi-photos";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
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

function photoKey(name: string, kind: string): string {
  return `${name.trim()}::${kind}`;
}

function photoFileName(name: string, kind: string, ext = "jpg"): string {
  const label =
    kind === "idBack" ? "身份证-反面" : kind === "id" || kind === "idFront" ? "身份证-正面" : kind === "bank" ? "银行卡" : "IC卡";
  return `${name.trim()}-${label}.${ext}`;
}

async function idbGet(name: string, kind: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(photoKey(name, kind));
    req.onsuccess = () => resolve((req.result as string) || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(name: string, kind: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, photoKey(name, kind));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(name: string, kind: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(photoKey(name, kind));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPhoto(name: string, kind: string): Promise<string | null> {
  if (nasEnabled())
    try {
      const j = await (
        await fetch(`/api/photo?name=${encodeURIComponent(name)}&kind=${kind}`, { credentials: "include" })
      ).json();
      if (j.url) return j.url;
      if (j.dataUrl) return j.dataUrl;
    } catch {}
  return idbGet(name, kind);
}

export async function setPhoto(name: string, kind: string, dataUrl: string): Promise<void> {
  await idbSet(name, kind, dataUrl);
  if (nasEnabled())
    await fetch("/api/photo", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, kind, dataUrl }),
    });
}

export async function deletePhoto(name: string, kind: string): Promise<void> {
  await idbDel(name, kind);
  if (nasEnabled())
    await fetch(`/api/photo?name=${encodeURIComponent(name)}&kind=${kind}`, {
      method: "DELETE",
      credentials: "include",
    });
}

export interface PhotoFlags {
  id: boolean;
  idBack: boolean;
  bank: boolean;
  ic: boolean;
}

export async function listPhotoFlags(names: string[]): Promise<Record<string, PhotoFlags>> {
  if (nasEnabled() && names.length)
    try {
      const j = await (
        await fetch("/api/photo-flags", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ names }),
        })
      ).json();
      if (j.flags) return j.flags;
    } catch {}
  const db = await openDb();
  const flags: Record<string, PhotoFlags> = {};
  await new Promise<void>((resolve, reject) => {
    const store = db.transaction(STORE, "readonly").objectStore(STORE);
    let pending = names.length * 4;
    if (pending === 0) {
      resolve();
      return;
    }
    for (const name of names) {
      flags[name] = { id: false, idBack: false, bank: false, ic: false };
      (["id", "idBack", "bank", "ic"] as const).forEach((kind) => {
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

export async function clearAllPhotos(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function extOf(dataUrl: string): string {
  if (dataUrl.includes("image/png")) return "png";
  if (dataUrl.includes("image/webp")) return "webp";
  if (dataUrl.includes("image/bmp")) return "bmp";
  return "jpg";
}

export async function scanPhotoFolder(names: string[]): Promise<any> {
  const r = await fetch("/api/photo-scan", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ names: names || [] }),
  });
  if (!r.ok) throw new Error("扫描失败");
  return await r.json();
}

function dataUrlToBlob(dataUrl: string): Blob {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return new Blob([dataUrl], { type: "application/octet-stream" });
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: m[1] });
}

async function srcToBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) return dataUrlToBlob(src);
  return (await fetch(src, { credentials: "include" })).blob();
}

export function downloadPhoto(name: string, kind: string, dataUrl: string): void {
  srcToBlob(dataUrl).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = photoFileName(name, kind, extOf(dataUrl) === "jpg" && !dataUrl.startsWith("data:") ? "png" : extOf(dataUrl));
    a.style.display = "none";
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    window.setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 2e3);
  });
}

export async function copyPhoto(dataUrl: string, filename = "photo.png"): Promise<"clipboard" | "download"> {
  const blob = await srcToBlob(dataUrl);
  const png =
    blob.type === "image/png"
      ? blob
      : await new Promise<Blob>((resolve, reject) => {
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
          img.onerror = () => reject(new Error("decode"));
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
