import * as React from "react";
import { Camera, Check, Copy, Download, Expand, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { DropSurface } from "~/components/file-pick";
import { copyPhoto, deletePhoto, downloadPhoto, fileToDataUrl, getPhoto, listPhotoFlags, scanPhotoFolder, setPhoto } from "~/lib/photos";
import { cn } from "~/lib/utils";
import { nasEnabled } from "~/lib/nas-sync";

const LABELS: Record<string, string> = {
  id: "身份证-正面",
  idFront: "身份证-正面",
  idBack: "身份证-反面",
  bank: "银行卡",
  ic: "IC卡",
};

export function usePhotoFlags(names: string[], nonce = 0) {
  const [flags, setFlags] = React.useState<Record<string, import("~/lib/photos").PhotoFlags>>({});
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

export function PhotoFlag({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs text-ok">
      <Check className="size-3" /> 已上传
    </span>
  ) : (
    <span className="text-xs text-subtle">待上传</span>
  );
}

export function ScanPhotosButton({
  names,
  onDone,
}: {
  names: string[];
  onDone?: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={busy || !names.length}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await scanPhotoFolder(names);
          const flags = Object.values(r.flags || {}) as import("~/lib/photos").PhotoFlags[];
          const n = flags.filter((f) => f.id || f.idBack || f.bank || f.ic).length;
          if (n) toast.success(`扫描完成：身份证 ${r.matched.id + r.matched.idBack}、银行卡 ${r.matched.bank}、IC卡 ${r.matched.ic}（人员 ${r.people}）。`);
          if (!n && r.dirs?.some((d: any) => d.count > 0)) toast.message("文件夹有图，但姓名对不上。请用「张三-身份证-正面.jpg」「张三-身份证-反面.jpg」。");
          if (!n && !r.dirs?.some((d: any) => d.count > 0)) toast.error("这几个目录是空的：data/photos/id、bank、ic");
          onDone?.();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "扫描失败");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "扫描中…" : "扫描文件夹"}
    </Button>
  );
}

export function IdCardSlot({
  name,
  compact,
  onChanged,
}: {
  name: string;
  compact?: boolean;
  onChanged?: () => void;
}) {
  const [front, setFront] = React.useState<string | null>(null);
  const [back, setBack] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [face, setFace] = React.useState<"front" | "back">("front");
  const frontRef = React.useRef<HTMLInputElement>(null);
  const backRef = React.useRef<HTMLInputElement>(null);
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
  async function onFile(file: File, kind: "id" | "idBack") {
    if (!file || !name) return;
    setBusy(true);
    try {
      const url = await fileToDataUrl(file);
      await setPhoto(name, kind, url);
      const saved = (await getPhoto(name, kind)) || url;
      if (kind === "idBack") setBack(saved);
      else setFront(saved);
      onChanged?.();
      toast.success(kind === "idBack" ? `反面已保存为「${name}-身份证-反面」` : `正面已保存为「${name}-身份证-正面」`);
    } finally {
      setBusy(false);
    }
  }
  async function copyFace(which: "front" | "back") {
    const pic = which === "back" ? back : front;
    if (!pic) return;
    if ((await copyPhoto(pic, `${name}-身份证-${which === "back" ? "反面" : "正面"}.png`)) === "clipboard")
      toast.success("图片已复制，可粘贴到微信 / WPS");
    else toast.message("当前环境不能写剪贴板，已改为下载，从下载里打开再复制");
  }
  const shown = face === "back" && back ? back : front;
  const btnFill = "btn inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm bg-accent text-xs font-medium text-accent-fg";
  const btnGhost = "inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1 text-xs";
  const compactView = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">身份证</span>
        {front ? <PhotoFlag ok={Boolean(front && back)} /> : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          className={cn(btnFill, !front && "opacity-70")}
          onClick={() => frontRef.current?.click()}
        >
          <Camera className="mr-0.5 size-3.5" />
          {front ? "换正面" : "正面"}
        </button>
        <button
          type="button"
          disabled={busy}
          className={cn(btnFill, !back && "opacity-70")}
          onClick={() => backRef.current?.click()}
        >
          <Camera className="mr-0.5 size-3.5" />
          {back ? "换反面" : "反面"}
        </button>
      </div>
      <input
        ref={frontRef}
        type="file"
        accept={photoAccept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f, "id");
        }}
      />
      <input
        ref={backRef}
        type="file"
        accept={photoAccept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f, "idBack");
        }}
      />
    </div>
  );
  if (compact) return compactView;
  return (
    <>
      {compactView}
      {front || back ? (
        <div className="mt-2 flex items-center justify-center gap-3">
          {front ? (
            <button type="button" onClick={() => { setFace("front"); setOpen(true); }} className="block text-center">
              <img src={front} alt="身份证正面" className="h-20 rounded border border-line object-contain hover:border-accent" />
              <span className="mt-1 block text-[10px] text-muted">正面</span>
            </button>
          ) : null}
          {back ? (
            <button type="button" onClick={() => { setFace("back"); setOpen(true); }} className="block text-center">
              <img src={back} alt="身份证反面" className="h-20 rounded border border-line object-contain hover:border-accent" />
              <span className="mt-1 block text-[10px] text-muted">反面</span>
            </button>
          ) : null}
        </div>
      ) : null}
      {front || back ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 block text-xs text-accent hover:underline"
        >
          <Expand className="mr-1 inline size-3" /> 放大查看
        </button>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-full max-w-full overflow-auto rounded-xl border border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{name} - 身份证</span>
              <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <div className="flex gap-2 border-b border-line pb-2">
              <button type="button" className={cn(btnGhost, face === "front" && "text-accent")} onClick={() => setFace("front")}>
                正面
              </button>
              <button type="button" className={cn(btnGhost, face === "back" && "text-accent")} onClick={() => setFace("back")}>
                反面
              </button>
            </div>
            {shown ? (
              <div className="mt-2 space-y-2">
                <img src={shown} alt="身份证" className="max-h-[70vh] rounded border border-line" />
                <div className="flex gap-2">
                  <button type="button" className={btnGhost} onClick={() => copyFace(face)}>
                    <Copy className="mr-1 size-3" /> 复制
                  </button>
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => downloadPhoto(name, face === "back" ? "idBack" : "id", shown)}
                  >
                    <Download className="mr-1 size-3" /> 下载
                  </button>
                  <button
                    type="button"
                    className={cn(btnGhost, "text-danger hover:text-danger")}
                    onClick={async () => {
                      if (!confirm(`删除 ${name} 的${face === "back" ? "反面" : "正面"}？`)) return;
                      await deletePhoto(name, face === "back" ? "idBack" : "id");
                      if (face === "back") setBack(null);
                      else setFront(null);
                      onChanged?.();
                      toast.success("已删除");
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted">尚未上传</div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SinglePhotoSlot({
  name,
  kind,
  label,
  compact,
  onChanged,
}: {
  name: string;
  kind: string;
  label: string;
  compact?: boolean;
  onChanged?: () => void;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
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
  async function onFile(file: File) {
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await setPhoto(name, kind, dataUrl);
      const saved = (await getPhoto(name, kind)) || dataUrl;
      setUrl(saved);
      onChanged?.();
      toast.success(`${label}已保存`);
    } finally {
      setBusy(false);
    }
  }
  const btnFill = "btn inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm bg-accent text-xs font-medium text-accent-fg";
  const btnGhost = "inline-flex h-9 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-1 text-xs";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {url ? <PhotoFlag ok={true} /> : null}
      </div>
      <DropSurface
        accept={photoAccept}
        onFiles={(files) => onFile(files[0])}
        className={cn(
          "rounded-lg border border-dashed border-line-strong bg-bg-elevated px-3 py-2 text-center",
          busy && "opacity-60",
        )}
      >
        {url ? (
          <img
            src={url}
            alt={label}
            className="mx-auto mb-2 h-24 cursor-pointer rounded border border-line object-contain"
            onClick={() => setOpen(true)}
          />
        ) : null}
        <button
          type="button"
          disabled={busy}
          className={cn(btnFill, !url && "opacity-70")}
          onClick={(e) => {
            const input = e.currentTarget.parentElement?.querySelector("input[type=file]") as HTMLInputElement | null;
            input?.click();
          }}
        >
          <Camera className="mr-0.5 size-3.5" />
          {url ? `换${label}` : `上传${label}`}
        </button>
        <input
          type="file"
          accept={photoAccept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />
        <p className="mt-1 text-[11px] text-muted">{url ? "点击或拖新图替换" : "点击选择或拖到这里"}</p>
      </DropSurface>
      {url && !compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block text-xs text-accent hover:underline"
        >
          <Expand className="mr-1 inline size-3" /> 放大查看
        </button>
      ) : null}
      {open && url ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-full max-w-full overflow-auto rounded-xl border border-line bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{name} - {label}</span>
              <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
                <X className="size-4" />
              </button>
            </div>
            <img src={url} alt={label} className="max-h-[70vh] rounded border border-line" />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={async () => {
                  if ((await copyPhoto(url, `${name}-${label}.png`)) === "clipboard")
                    toast.success("图片已复制，可粘贴到微信 / WPS");
                  else toast.message("当前环境不能写剪贴板，已改为下载，从下载里打开再复制");
                }}
              >
                <Copy className="mr-1 size-3" /> 复制
              </button>
              <button type="button" className={btnGhost} onClick={() => downloadPhoto(name, kind, url)}>
                <Download className="mr-1 size-3" /> 下载
              </button>
              <button
                type="button"
                className={cn(btnGhost, "text-danger hover:text-danger")}
                onClick={async () => {
                  if (!confirm(`删除 ${name} 的${label}？`)) return;
                  await deletePhoto(name, kind);
                  setUrl(null);
                  onChanged?.();
                  toast.success("已删除");
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const KIND_LABEL: Record<string, string> = { id: "身份证", idBack: "身份证-反面", bank: "银行卡", ic: "IC卡" };

export function PhotoSlot({
  name,
  kind,
  compact,
  onChanged,
}: {
  name: string;
  kind?: "id" | "idBack" | "bank" | "ic";
  compact?: boolean;
  onChanged?: () => void;
}) {
  if (kind === "id") return <IdCardSlot name={name} compact={compact} onChanged={onChanged} />;
  if (kind)
    return <SinglePhotoSlot name={name} kind={kind} label={KIND_LABEL[kind]} compact={compact} onChanged={onChanged} />;
  return (
    <div className="space-y-3">
      <IdCardSlot name={name} compact={compact} onChanged={onChanged} />
      <div className="grid grid-cols-2 gap-3">
        <SinglePhotoSlot name={name} kind="bank" label="银行卡" compact={compact} onChanged={onChanged} />
        <SinglePhotoSlot name={name} kind="ic" label="IC卡" compact={compact} onChanged={onChanged} />
      </div>
    </div>
  );
}
