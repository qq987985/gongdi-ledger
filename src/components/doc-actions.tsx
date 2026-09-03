import * as React from "react";
import { Copy, Download, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { nasEnabled } from "~/lib/nas-sync";
import { copyText } from "~/lib/utils";

const DB_NAME = "gongdi-docs";
const STORE = "docs";

export const DOC_KIND_LABEL: Record<string, string> = {
  report: "报量单",
  invoice: "电子发票",
  receipt: "收款回单",
  attendance: "考勤影像",
  contract: "合同扫描件",
  expense: "报销凭证",
  payout: "报销打款",
  insurance: "保险合同",
};

interface DocBlob {
  blob: Blob;
  fileName: string;
}

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

function key(id: string, kind: string): string {
  return `${kind}::${id}`;
}

async function idbGet(id: string, kind: string): Promise<DocBlob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key(id, kind));
    req.onsuccess = () => resolve((req.result as DocBlob) || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(id: string, kind: string, blob: Blob, fileName: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ blob, fileName }, key(id, kind));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(id: string, kind: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key(id, kind));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function setDoc(
  id: string,
  kind: string,
  file: File,
  opts?: { replace?: boolean },
): Promise<string> {
  await idbSet(id, kind, file, file.name);
  if (!nasEnabled()) return file.name;
  const body = new FormData();
  body.set("id", id);
  body.set("kind", kind);
  body.set("file", file, file.name);
  if (opts && opts.replace) body.set("replace", "1");
  const res = await fetch("/api/doc", { method: "PUT", credentials: "include", body });
  let name = file.name;
  try {
    const j = await res.json();
    if (j?.fileName) name = j.fileName;
  } catch {}
  if (name !== file.name) await idbSet(id, kind, file, name);
  return name;
}

export async function removeDoc(id: string, kind: string): Promise<void> {
  await idbDel(id, kind);
  if (!nasEnabled()) return;
  await fetch(`/api/doc?id=${encodeURIComponent(id)}&kind=${kind}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function getDocBlob(id: string, kind: string, fileName?: string): Promise<DocBlob | null> {
  if (nasEnabled())
    try {
      const r = await fetch(`/api/doc?id=${encodeURIComponent(id)}&kind=${kind}`, {
        credentials: "include",
      });
      if (r.ok)
        return {
          blob: await r.blob(),
          fileName:
            fileName ||
            decodeURIComponent(/filename="?([^";]+)"?/.exec(r.headers.get("content-disposition") || "")?.[1] || "") ||
            "file",
        };
    } catch {}
  return idbGet(id, kind);
}

function triggerDownload(blob: Blob, fileName?: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName || "file";
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 3e4);
}

async function downloadDoc(id: string, kind: string, fileName?: string): Promise<boolean> {
  const hit = await getDocBlob(id, kind, fileName);
  if (!hit) return false;
  triggerDownload(hit.blob, hit.fileName || fileName || "file");
  return true;
}

async function openDoc(id: string, kind: string, fileName?: string): Promise<boolean> {
  const hit = await getDocBlob(id, kind, fileName);
  if (!hit) return false;
  const href = URL.createObjectURL(hit.blob);
  window.open(href, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(href), 6e4);
  return true;
}

async function copyDoc(id: string, kind: string, fileName?: string): Promise<"image" | "name" | false> {
  const hit = await getDocBlob(id, kind, fileName);
  if (!hit) return false;
  const name = hit.fileName || fileName || "file";
  const type = hit.blob.type || "";
  if (type.startsWith("image/") && navigator.clipboard && "ClipboardItem" in window)
    try {
      await navigator.clipboard.write([new ClipboardItem({ [type]: hit.blob })]);
      return "image";
    } catch {}
  copyText(name);
  triggerDownload(hit.blob, name);
  return "name";
}

function fileExt(name: string): string {
  const n = name || "";
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i) : "";
}

function monthLabel(dateOrYear: string | number, month?: number): string {
  if (typeof dateOrYear === "number") return `${dateOrYear}年${month || 1}月`;
  const d = String(dateOrYear || "");
  const y = d.slice(0, 4);
  const m = Number(d.slice(5, 7));
  if (/^\d{4}$/.test(y) && m >= 1 && m <= 12) return `${y}年${m}月`;
  return "未填月份";
}

function amountTag(n: unknown): string {
  const x = Number(n) || 0;
  if (Number.isInteger(x)) return String(x);
  return String(Math.round(x * 100) / 100);
}

function safeBase(s: string): string {
  return (s || "未命名").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}

export function uniqueBase(base: string, taken: string[]): string {
  const stems = taken.map((t) => t.replace(/\.[^.]+$/, ""));
  if (!stems.includes(base)) return base;
  let i = 2;
  while (stems.includes(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function renameFile(file: File, base: string): File {
  const name = `${base}${fileExt(file.name) || ""}`;
  return new File([file], name, { type: file.type, lastModified: file.lastModified });
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = { "&": "38", "<": "60", ">": "62", '"': "34", "'": "39" };
  return String(s || "").replace(/[&<>"']/g, (c) => "&#" + map[c] + ";");
}

function stemOf(name: string): string {
  return String(name || "").replace(/\.[^.]+$/, "");
}

function askDupAction(fileName: string): Promise<"cancel" | "add" | "replace"> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve("add");
      return;
    }
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(28,25,21,.4);padding:16px";
    wrap.innerHTML = `<div role="dialog" aria-modal="true" style="width:100%;max-width:26rem;border-radius:14px;background:#ffffff;padding:1.25rem 1.25rem 1rem;border:1px solid #e3e7ee;box-shadow:0 18px 50px rgba(27,36,48,.28)"><div style="font-size:15px;font-weight:600;color:#1b2430">已有同名文件</div><p style="margin:8px 0 16px;font-size:13px;line-height:1.55;color:#4b5563">重命名后的「${escapeHtml(fileName)}」已经存在。替换会盖掉现有文件；增加会另存为同名后加 -2、-3。</p><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end"><button type="button" data-act="cancel" style="border:1px solid #c9d2dd;background:#ffffff;color:#1b2430;padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer">取消</button><button type="button" data-act="add" style="border:1px solid #c9d2dd;background:#ffffff;color:#1b2430;padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer">增加</button><button type="button" data-act="replace" style="background:#1e56a0;color:#ffffff;padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer;border:0">替换</button></div></div>`;
    const finish = (act: "cancel" | "add" | "replace") => {
      wrap.remove();
      resolve(act);
    };
    wrap.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-act]");
      if (btn) finish(btn.getAttribute("data-act") as "cancel" | "add" | "replace");
      else if (e.target === wrap) finish("cancel");
    });
    document.body.appendChild(wrap);
    (wrap.querySelector("[data-act='replace']") as HTMLElement | null)?.focus();
  });
}

export async function prepareNamedFile(
  file: File | null,
  base: string,
  taken: string[],
  currentName?: string,
): Promise<{ file: File; replace: boolean } | null> {
  if (!file) return null;
  const cur = currentName ? stemOf(currentName) : "";
  const conflict = (taken || []).map(stemOf).includes(base) && base !== cur;
  let useBase = base;
  let replace = false;
  if (conflict) {
    const act = await askDupAction(`${base}${fileExt(file.name) || ""}`);
    if (act === "cancel") return null;
    if (act === "replace") replace = true;
    else useBase = uniqueBase(base, taken);
  }
  return { file: renameFile(file, useBase), replace };
}

/** 合同名-开票月份-金额 */
export function invoiceBase(contractName: string, date: string, amount: number): string {
  return `${safeBase(contractName)}-${monthLabel(date)}-${amountTag(amount)}`;
}

/** 项目名称报量-月份-金额 */
export function reportBase(projectName: string, date: string, amount: number): string {
  return `${safeBase(projectName)}报量-${monthLabel(date)}-${amountTag(amount)}`;
}

/** 考勤-考勤月份 */
export function attendanceBase(year: number, month: number): string {
  return `考勤-${monthLabel(year, month)}`;
}

/** 项目名称-月份（到分包） */
export function receiptSubBase(projectName: string, date: string): string {
  return `${safeBase(projectName)}-${monthLabel(date)}`;
}

/** 项目名称-月份-代付农民工 */
export function receiptWorkerBase(projectName: string, date: string): string {
  return `${safeBase(projectName)}-${monthLabel(date)}-代付农民工`;
}

export function DocActions({
  id,
  kind,
  fileName,
  suggest,
  taken = [],
  onDeleted,
  onReplaced,
}: {
  id: string;
  kind: string;
  fileName?: string;
  suggest?: string;
  taken?: string[];
  onDeleted?: () => void;
  onReplaced?: (saved: string) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
      {fileName ? (
        <>
          <button
            type="button"
            className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent"
            onClick={async () => {
              if (!(await openDoc(id, kind, fileName))) toast.error("文件不在，可能还没上传成功");
            }}
          >
            <Eye className="mr-1 inline size-3" />
            查看
          </button>
          <button
            type="button"
            className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent"
            onClick={async () => {
              if (await downloadDoc(id, kind, fileName)) toast.success(`已下载 ${fileName}`);
              else toast.error("下载失败");
            }}
          >
            <Download className="mr-1 inline size-3" />
            下载
          </button>
          <button
            type="button"
            className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent"
            onClick={async () => {
              const r = await copyDoc(id, kind, fileName);
              if (r === "image") toast.success("图片已复制，可粘贴到微信/QQ");
              else if (r === "name") toast.success(`文件名已复制，并开始下载：${fileName}`);
              else toast.error("复制失败");
            }}
          >
            <Copy className="mr-1 inline size-3" />
            复制
          </button>
        </>
      ) : (
        <span className="self-center text-[11px] text-subtle">未上传</span>
      )}
      {onReplaced ? (
        <>
          <input
            ref={ref}
            type="file"
            accept=".pdf,.ofd,.xml,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const tip = fileName
                ? `用「${f.name}」替换影像资料「${fileName}」？`
                : `上传影像资料「${f.name}」？`;
              if (!confirm(tip)) return;
              let named = f;
              let replace = false;
              if (suggest) {
                const pack = await prepareNamedFile(f, suggest, taken.filter((n) => n !== fileName), fileName);
                if (!pack) return;
                named = pack.file;
                replace = pack.replace;
              }
              const saved = (await setDoc(id, kind, named, { replace })) || named.name;
              onReplaced(saved);
              toast.success(fileName ? `已替换为 ${saved}` : `已上传 ${saved}`);
            }}
          />
          <button
            type="button"
            className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] hover:border-accent"
            onClick={() => ref.current?.click()}
          >
            <Pencil className="mr-1 inline size-3" />
            {fileName ? "替换" : "上传"}
          </button>
        </>
      ) : null}
      {onDeleted && fileName ? (
        <button
          type="button"
          className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] text-muted hover:text-danger"
          onClick={async () => {
            if (!confirm(`确认删除影像资料「${fileName}」？删除后无法从这里找回。`)) return;
            await removeDoc(id, kind);
            onDeleted();
            toast.success("已删除影像资料");
          }}
        >
          <Trash2 className="mr-1 inline size-3" />
          删除
        </button>
      ) : null}
    </div>
  );
}
