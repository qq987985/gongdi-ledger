/**
 * 报销模块共享件：页面列表与编辑器都在用的字段组件（Field/NameInput/VoucherSlot）
 * 和领域小助手（金额标签、凭证文件名、收款人回填、期间→日期等）。
 */
import * as React from "react";
import { Badge } from "~/components/ui/badge";
import { Input, Label } from "~/components/ui/input";
import { DocActions } from "~/components/doc-actions";
import { localToday } from "~/lib/dates";
import { round2 } from "~/lib/wage";

export const PAY_METHODS = ["现金", "转账", "微信", "支付宝", "对公", "其他"];
export function safeBase(s: string) {
  return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
export function needsVoucher(method: string) {
  return (method || "现金") !== "现金";
}
export function amountTag(n: number) {
  const x = Number(n) || 0;
  return String(Number.isInteger(x) ? x : round2(x));
}
export function dateFromPeriod(period: string, fallback: string) {
  const p = String(period || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const m = p.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return fallback || localToday();
}
export function voucherBase(items: any[]) {
  if (!items.length) return "报销凭证";
  if (items.length === 1) return `${safeBase(items[0].name)}-${amountTag(items[0].amount)}`;
  const bits = items.slice(0, 3).map((e) => `${safeBase(e.name)}-${amountTag(e.amount)}`);
  let n = bits.join("+");
  if (items.length > 3) n += `等${items.length}笔`;
  return n.slice(0, 80);
}
export function payoutBase(items: any[]) {
  if (!items.length) return "收报销款-0-0笔";
  const total = round2(items.reduce((s, e) => s + (e.amount || 0), 0));
  return `收报销款-${amountTag(total)}-${items.length}笔`;
}
export function formatPayAccount(bank?: string, card?: string) {
  return [bank, card].map((s) => (s || "").trim()).filter(Boolean).join(" ");
}
export function applyPayee(row: any, payees: any[], name: string) {
  const n = (name || "").trim();
  const hit = (payees || []).find((p) => p.name === n);
  if (!hit)
    return {
      ...row,
      forWhom: name,
      payAccount: formatPayAccount(row.payBank, row.payCardNo),
    };
  return {
    ...row,
    forWhom: name,
    payBank: hit.bank || row.payBank || "",
    payCardNo: hit.card || row.payCardNo || "",
    payAccount: formatPayAccount(hit.bank || row.payBank, hit.card || row.payCardNo),
  };
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </label>
  );
}
export function NameInput({
  value,
  onChange,
  names,
  listId,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  names: string[];
  listId: string;
  placeholder?: string;
}) {
  return (
    <>
      <Input value={value || ""} list={listId} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>
        {(names || []).map((n) => (
          <option value={n} key={n} />
        ))}
      </datalist>
    </>
  );
}
export function VoucherSlot({
  title,
  hint,
  id,
  kind,
  fileName,
  optional,
  extra,
  onFile,
  onDeleted,
}: {
  title: string;
  hint: string;
  id: string;
  kind: string;
  fileName?: string;
  optional?: boolean;
  extra?: React.ReactNode;
  onFile: (file: File) => void;
  onDeleted: () => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 py-1.5"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
      }}
    >
      <span className="w-14 shrink-0 text-xs font-medium">{title}</span>
      {fileName ? <Badge tone="ok">已传</Badge> : <Badge>{optional ? "选填" : "待传"}</Badge>}
      {extra || null}
      <span className="min-w-0 flex-1 truncate text-[11px] text-muted" title={fileName || hint}>
        {fileName || hint || "点上传，或把文件拖到这一行"}
      </span>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.ofd,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f && confirm(`确认上传「${f.name}」？`)) onFile(f);
        }}
      />
      <button
        type="button"
        className="btn inline-flex items-center rounded-sm bg-accent text-xs font-medium text-accent-fg hover:opacity-90"
        onClick={() => ref.current?.click()}
      >
        {fileName ? "更换" : "上传"}
      </button>
      {fileName ? <DocActions id={id || "pending"} kind={kind} fileName={fileName} onDeleted={onDeleted} /> : null}
    </div>
  );
}
