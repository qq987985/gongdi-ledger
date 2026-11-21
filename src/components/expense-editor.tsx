/**
 * 报销单编辑器（弹窗）：从报销页拆出，与列表页通过 props 通信（draft/onSave/onDelete/…）。
 */
import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { DocActions, prepareNamedFile, setDoc } from "~/components/doc-actions";
import { uid } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { round2 } from "~/lib/wage";
import { numOr } from "~/lib/num";
import { expenseFormFromDraft } from "~/lib/expense-rules";
import { useGuardedClose } from "~/lib/confirm-close";
import {
  dateFromPeriod,
  Field,
  NameInput,
  needsVoucher,
  PAY_METHODS,
  VoucherSlot,
  voucherBase,
} from "./expense-bits";

export function ExpenseEditor({
  draft,
  creating,
  all,
  selectedIds,
  names,
  onCancel,
  onSave,
  onDelete,
  onPrintSingle,
  onManagePayout,
  isCurrent,
}: {
  draft: any;
  creating: boolean;
  all: any[];
  selectedIds: string[];
  names: string[];
  onCancel: () => void;
  /** 返回 false = 这次没存下去（只读账号被拦下）。此时**不许**复位脏标记 */
  onSave: (row: any) => void | boolean;
  onDelete: () => void;
  onPrintSingle: (row: any) => void;
  onManagePayout: (id: string) => void;
  isCurrent: () => boolean;
}) {
  const [c, setC] = React.useState(() => expenseFormFromDraft(draft));
  const [uploading, setUploading] = React.useState(false);
  const uploadingRef = React.useRef(false);
  const { markDirty, resetDirty, requestClose } = useGuardedClose(onCancel);
  // 1.8.8 E11：随 draft 重置本地副本。原来只在挂载时取一次初值，
  // 于是「编辑 A 时点新增报销」会把 A 的项目/金额带进新表单，保存后 A 被同 id 覆盖而消失。
  // 只要目标记录的 id 变了（新增每次 uid() 都是新的）就重新取初值。
  React.useEffect(() => {
    setC(expenseFormFromDraft(draft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploadingRef.current) requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);
  function patch(key: string, value: any) {
    setC((prev: any) => {
      const next = { ...prev, [key]: value };
      if (key === "qty" || key === "price") next.amount = round2((key === "qty" ? value : next.qty) * (key === "price" ? value : next.price));
      if (key === "period") next.date = dateFromPeriod(value, prev.date);
      return next;
    });
  }
  const existingVouchers: any[] = [];
  const seen = new Set<string>();
  for (const e of all) {
    if (!e.voucherId || !e.voucherFileName || e.voucherId === c.voucherId) continue;
    if (seen.has(e.voucherId)) continue;
    seen.add(e.voucherId);
    existingVouchers.push(e);
  }
  const shareTargets = (all || []).filter((e: any) => selectedIds.includes(e.id) || e.id === c.id);
  const siblings = c.payoutId ? (all || []).filter((e: any) => e.payoutId === c.payoutId) : [];
  async function uploadVoucher(file: File) {
    if (!file || uploadingRef.current || !currentOrWarn()) return;
    uploadingRef.current = true; setUploading(true);
    try {
      if (!c.name.trim()) {
        toast.error("先填项目名称，凭证按「项目名称-金额」保存");
        return;
      }
      const group = shareTargets.length > 1 ? shareTargets.map((e: any) => (e.id === c.id ? c : e)) : [c];
      const vid = c.voucherId || uid();
      const pack = await prepareNamedFile(
        file,
        voucherBase(group),
        (all || []).map((e: any) => e.voucherFileName).filter(Boolean),
        c.voucherFileName,
      );
      if (!pack || !currentOrWarn()) return;
      const saved = (await setDoc(vid, "expense", pack.file, { replace: pack.replace })) || pack.file.name;
      if (!currentOrWarn()) return;
      const next = payload({ ...c, id: c.id || uid(), voucherId: vid, voucherFileName: saved });
      setC(next);
      // 一张凭证可能挂到同批多笔上：整批都存下去了才复位脏标记（B9）
      let ok = true;
      if (onSave(next) === false) ok = false;
      for (const e of group) {
        if (e.id === next.id) continue;
        if (onSave({ ...e, voucherId: vid, voucherFileName: saved }) === false) ok = false;
      }
      if (ok) resetDirty();
      toast.success(group.length > 1 ? `已保存购买凭证，并挂到勾选的 ${group.length} 笔` : `已保存 ${saved}`);
    } catch (failure) { toast.error(failure instanceof Error ? failure.message : "购买凭证上传失败，已保留填写内容"); }
    finally { uploadingRef.current = false; setUploading(false); }
  }
  function currentOrWarn() {
    if (isCurrent()) return true;
    toast.error("台账或编辑对象已改变，请重新打开；本次内容没有写入。"); return false;
  }
  function payload(row: any) {
    const next = { ...row, amount: round2(numOr(row.amount, 0)) };
    // 收款信息统一在批次窗口办理，编辑费用不重写已有收款关系。
    for (const key of ["forWhom", "payBank", "payCardNo", "payAccount", "payoutId", "payoutFileName", "payoutDate", "payoutMethod", "reimbursedAt", "status"]) next[key] = draft[key];
    return next;
  }
  function submit() {
    if (uploadingRef.current || !currentOrWarn()) return null;
    if (!c.name.trim()) { toast.error("项目名称必填"); return null; }
    if (needsVoucher(c.payMethod) && !c.voucherFileName && !confirm("购买不是现金，还没上传凭证。仍要保存？")) return null;
    const next = payload({ ...c, id: c.id || uid() });
    if (onSave(next) === false) return null;
    setC(next); resetDirty(); return next;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6" onClick={() => { if (!uploadingRef.current) requestClose(); }}>
      <section
        id="expense-editor"
        className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onChange={markDirty}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
          <h2 className="font-semibold">{creating ? "新增报销" : c.name || "编辑报销"}</h2>
          <div className="btn-row">
            <Badge tone={c.status === "已报销" ? "ok" : "warn"}>{c.status}</Badge>
            {!creating ? (
              <Button variant="danger" type="button" disabled={uploading} onClick={onDelete}>
                删除
              </Button>
            ) : null}
            {!creating ? (
              <Button variant="outline" type="button" disabled={uploading} onClick={() => onPrintSingle(c)}>
                打印报销单
              </Button>
            ) : null}
            <Button variant="outline" type="button" disabled={uploading} onClick={requestClose}>
              关闭
            </Button>
            <Button
              type="button"
              disabled={uploading}
              onClick={() => { submit(); }}
            >
              保存报销信息
            </Button>
          </div>
        </div>
        {siblings.length > 1 ? (
          <p className="rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs text-muted">
            同批打款共 {siblings.length} 笔：{siblings.map((e: any) => e.name).join("、")}
          </p>
        ) : null}
        {uploading ? <p role="status" className="mb-3 rounded-lg bg-accent-soft p-3 text-sm">正在上传购买凭证，请稍候；本次填写已锁定，避免迟到结果覆盖新改动。</p> : null}
        <fieldset disabled={uploading} className="min-w-0">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="年份">
            <Input type="number" value={c.year} onChange={(e) => patch("year", Number(e.target.value) || 0)} />
          </Field>
          <Field label="项目 *">
            <Input value={c.name} onChange={(e) => patch("name", e.target.value)} />
          </Field>
          <Field label="购买时间">
            <Input value={c.period} onChange={(e) => patch("period", e.target.value)} placeholder="如 2026/3月-12月 或 2026/4/9" />
          </Field>
          <Field label="单位">
            <Input value={c.unit} onChange={(e) => patch("unit", e.target.value)} />
          </Field>
          <Field label="数量">
            <Input type="number" step="0.01" value={c.qty} onChange={(e) => patch("qty", Number(e.target.value) || 0)} />
          </Field>
          <Field label="单价">
            <Input type="number" step="0.01" value={c.price} onChange={(e) => patch("price", Number(e.target.value) || 0)} />
          </Field>
          <Field label="金额">
            <Input type="number" step="0.01" value={c.amount} onChange={(e) => patch("amount", Number(e.target.value) || 0)} />
          </Field>
          <Field label="购买支付方式">
            <select className="field-select w-full" value={c.payMethod || "现金"} onChange={(e) => patch("payMethod", e.target.value)}>
              {PAY_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="报销人（谁来报）">
            <NameInput value={c.claimant} names={names} listId="ed-claimant" placeholder="人员名单或手填" onChange={(v) => patch("claimant", v)} />
          </Field>
          <Field label="备注" className="md:col-span-3">
            <Input value={c.remark} onChange={(e) => patch("remark", e.target.value)} />
          </Field>
        </div>
        <div className="divide-y divide-line rounded-md border border-line bg-bg-elevated px-3">
          <VoucherSlot
            title="购买凭证"
            hint="现金也可以传。文件名「项目名称-金额」。"
            id={c.voucherId || c.id}
            kind="expense"
            fileName={c.voucherFileName}
            optional={c.payMethod === "现金"}
            extra={
              existingVouchers.length ? (
                <select
                  className="h-8 max-w-40 rounded-sm border border-line bg-surface px-2 text-[11px]"
                  value={c.voucherId || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) {
                      patch("voucherId", "");
                      patch("voucherFileName", "");
                      return;
                    }
                    const hit = existingVouchers.find((x: any) => x.voucherId === id);
                    setC((prev: any) => ({ ...prev, voucherId: id, voucherFileName: hit?.voucherFileName || prev.voucherFileName }));
                  }}
                >
                  <option value="">单独上传</option>
                  {existingVouchers.map((e: any) => (
                    <option value={e.voucherId} key={e.voucherId}>
                      {e.voucherFileName}
                    </option>
                  ))}
                </select>
              ) : null
            }
            onFile={uploadVoucher}
            onDeleted={() => {
              const next = { ...c, voucherFileName: "", voucherId: "" };
              setC(next);
              onSave(next);
            }}
          />
          <section className="py-4">
            <h3 className="text-sm font-medium">收款信息按批次办理</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{siblings.length ? `当前收款批次共 ${siblings.length} 笔。` : "本条费用尚未分批。"}保存费用后进入收款窗口，可核对清单、登记收款或整批解除合并。</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { const next = submit(); if (next) onManagePayout(next.id); }}>保存后办理收款</Button>
          </section>
        </div>
        </fieldset>
      </section>
    </div>
  );
}
