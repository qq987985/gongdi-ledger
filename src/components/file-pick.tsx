import * as React from "react";
import { FileSpreadsheet, ImagePlus, Paperclip } from "lucide-react";
import { cn } from "~/lib/utils";

function acceptMatch(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return accept.split(",").some((raw) => {
    const p = raw.trim().toLowerCase();
    if (!p) return false;
    if (p.startsWith(".")) return name.endsWith(p);
    if (p.endsWith("/*")) return type.startsWith(p.slice(0, -1));
    return type === p;
  });
}

function pickFiles(list: FileList | File[] | null, accept?: string, multiple = false): File[] {
  const files = (list ? [...list] : []).filter((f) => acceptMatch(f, accept));
  return multiple ? files : files.slice(0, 1);
}

export function confirmUpload(files?: File | File[] | null): boolean {
  const list = !files ? [] : files instanceof File ? [files] : [...files].filter(Boolean);
  if (!list.length) return false;
  const names = list.map((f) => f.name).join("、");
  return confirm(
    list.length > 1 ? `确认上传这 ${list.length} 个文件？\n${names}` : `确认上传「${names}」？`,
  );
}

export function DropSurface({
  accept = "",
  multiple,
  disabled,
  className,
  activeClassName = "border-accent bg-accent-soft",
  confirmDrop = true,
  onFiles,
  children,
}: {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
  confirmDrop?: boolean;
  onFiles: (files: File[]) => void;
  children: React.ReactNode;
}) {
  const [over, setOver] = React.useState(false);
  function give(list: FileList | null) {
    if (disabled) return;
    const files = pickFiles(list, accept, multiple);
    if (!files.length) return;
    if (confirmDrop && !confirmUpload(files)) return;
    onFiles(files);
  }
  return (
    <div
      className={cn(className, over && !disabled && activeClassName)}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        give(e.dataTransfer.files);
      }}
    >
      {children}
    </div>
  );
}

export function FilePick({
  accept,
  label,
  hint,
  kind = "excel",
  multiple,
  disabled,
  compact,
  inline,
  onFile,
  onFiles,
}: {
  accept?: string;
  label: React.ReactNode;
  hint?: string;
  kind?: "excel" | "image" | "file";
  multiple?: boolean;
  disabled?: boolean;
  compact?: boolean;
  inline?: boolean;
  onFile?: (f: File) => void;
  onFiles?: (files: File[]) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [name, setName] = React.useState("");
  const Icon = kind === "image" ? ImagePlus : kind === "file" ? Paperclip : FileSpreadsheet;
  function take(files: File[]) {
    if (!files.length || disabled) return;
    if (!confirmUpload(files)) return;
    setName(files.map((f) => f.name).join("、"));
    onFiles?.(files);
    onFile?.(files[0]);
    if (ref.current) ref.current.value = "";
  }
  const btn = (
    <button
      type="button"
      disabled={disabled}
      title={hint}
      className="btn inline-flex items-center gap-1 rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
      onClick={() => ref.current?.click()}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
  const input = (
    <input
      ref={ref}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      className="sr-only"
      onChange={(e) => take(pickFiles(e.target.files, accept, multiple))}
    />
  );
  if (inline)
    return (
      <DropSurface
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        confirmDrop={false}
        onFiles={take}
        className={cn("inline-flex", disabled && "opacity-50")}
      >
        {input}
        {btn}
      </DropSurface>
    );
  return (
    <DropSurface
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      confirmDrop={false}
      onFiles={take}
      className={cn(
        "rounded-lg border border-dashed transition-colors duration-150",
        compact ? "px-3 py-2" : "px-4 py-4",
        disabled ? "opacity-50" : "border-line-strong bg-bg-elevated",
      )}
    >
      {input}
      <button
        type="button"
        disabled={disabled}
        className="btn inline-flex items-center gap-1 rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
        onClick={() => ref.current?.click()}
      >
        <Icon className="size-4" />
        {label}
      </button>
      <p className="mt-2 text-xs text-muted">{name ? `已选：${name}` : hint || "点击选择，也可把文件拖到这里"}</p>
    </DropSurface>
  );
}
