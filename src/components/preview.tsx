import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "~/components/ui/button";

export interface PreviewTarget {
  /** object URL（用完要 revoke） */
  url: string;
  name: string;
  kind: "image" | "pdf" | "other";
  download?: () => void;
}

/**
 * 应用内预览弹窗。
 *
 * 为什么要有它：原来「查看」是 `window.open(blobUrl, "_blank")` —— 新开一个浏览器标签页，
 * 看完还得手动切回列表再点下一次，而且 blob URL 60 秒后失效，回来再点常提示"文件不在"。
 * 现在改成弹窗：点遮罩 / Esc / 「关闭」都能关，弹窗里还能直接下载，不用来回切页面。
 */
export function PreviewModal({ target, onClose }: { target: PreviewTarget | null; onClose: () => void }) {
  React.useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);
  if (!target) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="mb-2 flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 text-white" onClick={stop}>
        <span className="truncate text-sm">{target.name}</span>
        <span className="flex shrink-0 gap-2">
          {target.download ? (
            <Button size="sm" variant="outline" type="button" onClick={target.download}>
              <Download className="mr-1 size-3" /> 下载
            </Button>
          ) : null}
          <Button size="sm" variant="outline" type="button" onClick={onClose}>
            <X className="mr-1 size-3" /> 关闭（Esc）
          </Button>
        </span>
      </div>
      <div className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-lg border border-line bg-surface" onClick={stop}>
        {target.kind === "image" ? (
          <img src={target.url} alt={target.name} className="mx-auto max-h-[82vh] object-contain" />
        ) : target.kind === "pdf" ? (
          <iframe src={target.url} title={target.name} className="h-[82vh] w-full border-0" />
        ) : (
          <div className="p-8 text-center text-sm text-muted">
            这类文件不能在页面里直接预览（Excel、Word 等），请点上面的「下载」用本机软件打开。
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-white/70">点空白处或按 Esc 关闭</p>
    </div>
  );
}

/** 按扩展名/类型判断怎么预览 */
export function previewKindOf(name: string, mime = ""): PreviewTarget["kind"] {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "bmp", "gif"].includes(ext)) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  // 图片/PDF 之外的常见办公文件交给本机软件：不要再新开标签页（浏览器会直接下载或白页）
  return "other";
}
