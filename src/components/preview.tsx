import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "~/components/ui/button";
export { previewKindOf } from "~/lib/preview-kind";

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
 *
 * `data-modal`：声明「这里还有一个内层弹层」。编辑弹窗（`useGuardedClose`）的 Esc / 点遮罩
 * 会检查它 —— 否则在「编辑报销 → 查看凭证」时按一次 Esc，会先关预览、又弹出「有未保存的更改」
 * 两个框（C3）。
 */
export function PreviewModal({ target, onClose }: { target: PreviewTarget | null; onClose: () => void }) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!target) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLButtonElement>("[data-preview-close]")?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [target]);
  React.useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>("button, iframe, [tabindex='0']");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target, onClose]);
  if (!target) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      ref={dialogRef}
      data-modal="preview"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 p-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`预览：${target.name}`}
    >
      <div className="mb-2 flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 text-white" onClick={stop}>
        <span className="min-w-0 flex-1 truncate text-sm" title={target.name}>{target.name}</span>
        <span className="flex shrink-0 gap-2">
          {target.download ? (
            <Button size="sm" variant="outline" type="button" onClick={target.download}>
              <Download className="mr-1 size-3" /> 下载
            </Button>
          ) : null}
          <Button data-preview-close size="sm" variant="outline" type="button" onClick={onClose}>
            <X className="mr-1 size-3" /> 关闭（Esc）
          </Button>
        </span>
      </div>
      <div className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-lg border border-line bg-surface" onClick={stop}>
        {target.kind === "image" ? (
          <img src={target.url} alt={target.name} className="mx-auto max-h-[82vh] object-contain" />
        ) : target.kind === "pdf" ? (
          // Chrome 内置 PDF 阅读器在 sandbox 中被禁用；kind 必须由明确的 application/pdf MIME 判定。
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
