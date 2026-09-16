/**
 * 报销单编辑器（弹窗）：从报销页拆出，与列表页通过 props 通信（draft/onSave/onDelete/…）。
 */
import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { DocActions, prepareNamedFile, setDoc } from "~/components/doc-actions";
import { money, formatCardNo, uid } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { round2 } from "~/lib/wage";
import { expenseFormFromDraft } from "~/lib/expense-rules";
import { useGuardedClose } from "~/lib/confirm-close";
import {
  applyPayee,
  dateFromPeriod,
  Field,
  formatPayAccount,
  NameInput,
  needsVoucher,
  PAY_METHODS,
  payoutBase,
  VoucherSlot,
  voucherBase,
} from "./expense-bits";

export function ExpenseEditor({
  draft,
  creating,
  all,
  selectedIds,
  names,
  payees,
  onCancel,
  onSave,
  onDelete,
  onPrintSingle,
}: {
  draft: any;
  creating: boolean;
  all: any[];
  selectedIds: string[];
  names: string[];
  payees: any[];
  onCancel: () => void;
  onSave: (row: any) => void;
  onDelete: () => void;
  onPrintSingle: (row: any) => void;
}) {
  const [c, setC] = React.useState(() => expenseFormFromDraft(draft));
  const { markDirty, requestClose } = useGuardedClose(onCancel);
  // 1.8.8 E11：随 draft 重置本地副本。原来只在挂载时取一次初值，
  // 于是「编辑 A 时点新增报销」会把 A 的项目/金额带进新表单，保存后 A 被同 id 覆盖而消失。
  // 只要目标记录的 id 变了（新增每次 uid() 都是新的）就重新取初值。
  React.useEffect(() => {
    setC(expenseFormFromDraft(draft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);
  function patch(key: string, value: any) {
    setC((prev: any) => {
      const next = { ...prev, [key]: value };
      if (key === "qty" || key === "price") next.amount = round2((key === "qty" ? value : next.qty) * (key === "price" ? value : next.price));
      if (key === "period") next.date = dateFromPeriod(value, prev.date);
      if (key === "forWhom") {
        const filled = applyPayee(next, payees, value);
        next.payBank = filled.payBank;
        next.payCardNo = filled.payCardNo;
        next.payAccount = filled.payAccount;
      }
      if (key === "payBank" || key === "payCardNo") next.payAccount = formatPayAccount(next.payBank, next.payCardNo);
      if (key === "status") {
        if (value === "已报销") {
          next.payoutDate = prev.payoutDate || localToday();
          next.reimbursedAt = prev.reimbursedAt || next.payoutDate;
        } else {
          next.payoutDate = "";
          next.reimbursedAt = "";
        }
      }
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
  const existingPayouts: any[] = [];
  const seenP = new Set<string>();
  for (const e of all) {
    if (!e.payoutId || !e.payoutFileName || e.payoutId === c.payoutId) continue;
    if (seenP.has(e.payoutId)) continue;
    seenP.add(e.payoutId);
    existingPayouts.push(e);
  }
  const shareTargets = (all || []).filter((e: any) => selectedIds.includes(e.id) || e.id === c.id);
  const siblings = c.payoutId ? (all || []).filter((e: any) => e.payoutId === c.payoutId) : [];
  async function uploadVoucher(file: File) {
    if (!file) return;
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
    if (!pack) return;
    const saved = (await setDoc(vid, "expense", pack.file, { replace: pack.replace })) || pack.file.name;
    const next = { ...c, id: c.id || uid(), voucherId: vid, voucherFileName: saved };
    setC(next);
    onSave(next);
    for (const e of group) {
      if (e.id === next.id) continue;
      onSave({ ...e, voucherId: vid, voucherFileName: saved });
    }
    toast.success(group.length > 1 ? `已保存购买凭证，并挂到勾选的 ${group.length} 笔` : `已保存 ${saved}`);
  }
  async function uploadPayout(file: File) {
    if (!file) return;
    if (!c.claimant.trim() || !(c.forWhom || "").trim() || !(c.payBank || "").trim() || !(c.payCardNo || "").trim()) {
      toast.error("先填报销人、收款人、开户行和打款账户");
      return;
    }
    const group = siblings.length > 1 ? siblings.map((e: any) => (e.id === c.id ? c : e)) : [c];
    const pid = c.payoutId || uid();
    const pack = await prepareNamedFile(
      file,
      payoutBase(group),
      (all || []).map((e: any) => e.payoutFileName).filter(Boolean),
      c.payoutFileName,
    );
    if (!pack) return;
    const savedPay = (await setDoc(pid, "payout", pack.file, { replace: pack.replace })) || pack.file.name;
    const next = {
      ...c,
      id: c.id || uid(),
      payoutId: pid,
      payoutFileName: savedPay,
      payoutDate: c.status === "已报销" ? c.payoutDate || localToday() : "",
    };
    setC(next);
    onSave(next);
    for (const e of group) {
      if (e.id === next.id) continue;
      onSave({ ...e, payoutId: pid, payoutFileName: savedPay });
    }
    toast.success(group.length > 1 ? `已保存打款凭证，同批 ${group.length} 笔共用` : `已保存 ${savedPay}`);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6" onClick={requestClose}>
      <section
        id="expense-editor"
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onChange={markDirty}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
          <h2 className="font-semibold">{creating ? "新增报销" : c.name || "编辑报销"}</h2>
          <div className="btn-row">
            <Badge tone={c.status === "已报销" ? "ok" : "warn"}>{c.status}</Badge>
            {!creating ? (
              <Button variant="danger" type="button" onClick={onDelete}>
                删除
              </Button>
            ) : null}
            {!creating ? (
              <Button variant="outline" type="button" onClick={() => onPrintSingle(c)}>
                打印报销单
              </Button>
            ) : null}
            <Button variant="outline" type="button" onClick={requestClose}>
              关闭
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!c.name.trim()) {
                  toast.error("项目名称必填");
                  return;
                }
                if (c.status === "已报销" && (!(c.forWhom || "").trim() || !(c.payBank || "").trim() || !(c.payCardNo || "").trim())) {
                  toast.error("已报销要填收款人、开户行和打款账户");
                  return;
                }
                if (needsVoucher(c.payMethod) && !c.voucherFileName && !confirm("购买不是现金，还没上传凭证。仍要保存？")) return;
                onSave({
                  ...c,
                  id: c.id || uid(),
                  payAccount: formatPayAccount(c.payBank, c.payCardNo),
                  payoutDate: c.status === "已报销" ? c.payoutDate || localToday() : "",
                  amount: round2(c.amount || c.qty * c.price),
                });
              }}
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
          <Field label="收款人（打到谁的账户）">
            <NameInput
              value={c.forWhom}
              names={(payees || []).map((p) => p.name)}
              listId="ed-payee"
              placeholder="填过的可下拉选，不跟人员名单关联"
              onChange={(v) => patch("forWhom", v)}
            />
          </Field>
          <Field label="开户行">
            <NameInput
              value={c.payBank || ""}
              names={[...new Set((payees || []).map((p) => p.bank).filter(Boolean))]}
              listId="ed-bank"
              placeholder="选收款人会带出上次账户，也可手填"
              onChange={(v) => patch("payBank", v)}
            />
          </Field>
          <Field label="打款账户">
            <NameInput
              value={c.payCardNo || ""}
              names={[...new Set((payees || []).map((p) => p.card).filter(Boolean))]}
              listId="ed-card"
              placeholder="银行卡号，填过可下拉选"
              onChange={(v) => patch("payCardNo", v)}
            />
          </Field>
          <Field label="打款方式">
            <select className="field-select w-full" value={c.payoutMethod || "转账"} onChange={(e) => patch("payoutMethod", e.target.value)}>
              {PAY_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label={c.status === "已报销" ? "打款日期" : "打款日期（未报销为空）"}>
            <Input type="date" value={c.status === "已报销" ? c.payoutDate || "" : ""} disabled={c.status !== "已报销"} onChange={(e) => patch("payoutDate", e.target.value)} />
          </Field>
          <Field label="报销状态">
            <select className="field-select w-full" value={c.status} onChange={(e) => patch("status", e.target.value)}>
              <option>未报销</option>
              <option>已报销</option>
            </select>
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
          <VoucherSlot
            title="打款凭证"
            hint={siblings.length > 1 ? `同批 ${siblings.length} 笔共用` : "几笔一起报时共用一张。"}
            id={c.payoutId || c.id}
            kind="payout"
            fileName={c.payoutFileName}
            optional={(c.payoutMethod || "转账") === "现金"}
            extra={
              existingPayouts.length ? (
                <select
                  className="h-8 max-w-40 rounded-sm border border-line bg-surface px-2 text-[11px]"
                  value={c.payoutId || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) {
                      setC((prev: any) => ({ ...prev, payoutId: "", payoutFileName: "" }));
                      return;
                    }
                    const hit = existingPayouts.find((x: any) => x.payoutId === id);
                    setC((prev: any) => ({
                      ...prev,
                      payoutId: id,
                      payoutFileName: hit?.payoutFileName || prev.payoutFileName,
                      claimant: prev.claimant || hit?.claimant || "",
                      forWhom: prev.forWhom || hit?.forWhom || "",
                      payBank: prev.payBank || hit?.payBank || "",
                      payCardNo: prev.payCardNo || hit?.payCardNo || "",
                      payAccount: prev.payAccount || hit?.payAccount || "",
                      payoutMethod: prev.payoutMethod || hit?.payoutMethod || "转账",
                      payoutDate: prev.status === "已报销" ? prev.payoutDate || hit?.payoutDate || "" : "",
                    }));
                  }}
                >
                  <option value="">单独上传</option>
                  {existingPayouts.map((e: any) => (
                    <option value={e.payoutId} key={e.payoutId}>
                      {e.payoutFileName}（{e.claimant || "未填人"}）
                    </option>
                  ))}
                </select>
              ) : null
            }
            onFile={uploadPayout}
            onDeleted={() => {
              setC((prev: any) => ({ ...prev, payoutFileName: "" }));
              onSave({ ...c, payoutFileName: "" });
            }}
          />
        </div>
      </section>
    </div>
  );
}

function ExpenseSheets({ rows, showVoucher }: { rows: any[]; showVoucher?: boolean }) {
  if (!rows.length) return null;
  const today = localToday();
  const total = rows.reduce((s, e) => s + (e.amount || 0), 0);
  const claimants = [...new Set(rows.map((e) => e.claimant).filter(Boolean))];
  const forWhoms = [...new Set(rows.map((e) => e.forWhom).filter(Boolean))];
  const banks = [...new Set(rows.map((e) => (e.payBank || "").trim()).filter(Boolean))];
  const cards = [...new Set(rows.map((e) => (e.payCardNo || "").trim()).filter(Boolean))];
  const cols = showVoucher ? ["序号", "项目", "购买时间", "金额", "备注", "票据"] : ["序号", "项目", "购买时间", "金额", "备注"];
  const emptyCells = showVoucher ? 2 : 1;
  return (
    <div className="print-only space-y-8 text-black">
      <article className="statement border border-black p-4">
        <header className="border-b border-black pb-2 text-center">
          <div className="text-2xl font-semibold tracking-widest">报销单</div>
        </header>
        <table className="mt-2 w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              {["报销人", "收款人", "开户行", "打款账户"].map((col) => (
                <th key={col} className="border border-black px-1 py-1 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[claimants.join("、") || "—", forWhoms.join("、") || "—", banks.join("、") || "—", cards.map(formatCardNo).join("、") || "—"].map(
                (v, i) => (
                  <td key={i} className="border border-black px-1 py-1">
                    {v}
                  </td>
                ),
              )}
            </tr>
          </tbody>
        </table>
        <table className="mt-2 w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              {cols.map((col) => (
                <th key={col} className="border border-black px-1 py-1 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const cells = [i + 1, e.name, e.period || e.date, money(e.amount), e.remark || ""];
              if (showVoucher) cells.push(e.voucherFileName || (e.payMethod === "现金" ? "现金" : "—"));
              return (
                <tr key={e.id}>
                  {cells.map((v, k) => (
                    <td key={k} className="border border-black px-1 py-1">
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr>
              {["合计", "", "", money(total), ...Array(emptyCells).fill("")].map((v, i) => (
                <td key={i} className="border border-black px-1 py-1 font-medium">
                  {v}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}

