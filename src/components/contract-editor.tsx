/**
 * 合同编辑器（弹窗）+ 明细账本（报量/开票/收款）+ 合同扫描件上传盒。
 * 从合同页拆出，与列表页通过 props 通信；明细文件操作经 store 的 patchContractEntry。
 */
import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { FilePick } from "~/components/file-pick";
import { DocActions, prepareNamedFile, setDoc, removeDoc, invoiceBase, reportBase, receiptSubBase, receiptWorkerBase } from "~/components/doc-actions";
import { useApp } from "~/lib/store";
import { contractRollup, contractEntryChanges, emptyContract, normalizeEntry, CONTRACT_STATUSES } from "~/lib/contracts";
import { money, uid } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { round2 } from "~/lib/wage";
import { useGuardedClose } from "~/lib/confirm-close";
import type { ContractRecord, ContractEntry } from "~/lib/types";

function confirmEdits(kind: string, name: string, creating: boolean, before: any, after: any, labels: Record<string, string>) {
  if (typeof window === "undefined") return true;
  if (creating) return window.confirm(`确认新增${kind}「${name || "未命名"}」？`);
  const lines: string[] = [];
  for (const key of Object.keys(labels)) {
    let a = before?.[key],
      b = after?.[key];
    if (a === true) a = "是";
    else if (a === false) a = "否";
    if (b === true) b = "是";
    else if (b === false) b = "否";
    if (a === "incl") a = "含税";
    if (b === "incl") b = "含税";
    if (a === "excl") a = "不含税";
    if (b === "excl") b = "不含税";
    const as = a == null || a === "" ? "（空）" : String(a);
    const bs = b == null || b === "" ? "（空）" : String(b);
    if (as === bs) continue;
    lines.push(`${labels[key]}：${as} → ${bs}`);
  }
  if (!lines.length) return window.confirm(`没有改动。仍要保存${kind}「${name}」？`);
  const show = lines.slice(0, 8);
  const extra = lines.length > 8 ? `\n…另有 ${lines.length - 8} 项` : "";
  return window.confirm(`确认保存${kind}「${name}」？\n\n改了 ${lines.length} 项：\n${show.join("\n")}${extra}`);
}

export function ContractEditor({
  draft,
  creating,
  entries,
  onCancel,
  onSave,
  onDelete,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntries,
}: {
  draft: ContractRecord;
  creating: boolean;
  entries: ContractEntry[];
  onCancel: () => void;
  /** 返回 false = 这次没存下去（只读账号被拦下）。此时**不许**复位脏标记 */
  onSave: (c: ContractRecord) => void | boolean;
  onDelete?: () => void;
  onAddEntry: (e: ContractEntry) => void;
  onUpdateEntry: (e: ContractEntry) => void;
  onRemoveEntries: (ids: string[]) => void;
}) {
  const [c, setC] = React.useState(draft);
  const roll = contractRollup(c, entries);
  const { markDirty, resetDirty, requestClose } = useGuardedClose(onCancel);
  const dirtyRef = React.useRef(false);
  /** 合同表单存下去了：两层脏标记一起复位（本组件的 dirtyRef 管扫描件上传确认，B9 管关闭确认） */
  function markSaved() {
    dirtyRef.current = false;
    resetDirty();
  }
  // 1.8.8（B 组 E11/P19 同类排查）：随 draft 重置本地副本。
  // 原来只在挂载时取一次初值 —— 「编辑合同 A 时点新增合同」会把 A 的项目名/金额带进新表单，
  // 保存后按同一个 id 覆盖，A 整条丢失。目标记录 id 变了（新增每次 uid() 都是新的）就重新取初值。
  React.useEffect(() => {
    setC(draft);
    dirtyRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id]);
  function patch(key: keyof ContractRecord, value: any) {
    dirtyRef.current = true;
    setC((prev) => ({ ...prev, [key]: value }));
  }
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6" onClick={requestClose}>
      <section
        id="contract-editor"
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onChange={markDirty}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
          <h2 className="font-semibold">{creating ? "新增合同" : c.name || "编辑合同"}</h2>
          <div className="btn-row">
            {c.scanFileName ? <Badge tone="ok">有合同</Badge> : <Badge>无合同</Badge>}
            {!creating ? (
              <Button variant="danger" type="button" onClick={() => onDelete?.()}>
                删除
              </Button>
            ) : null}
            {!creating ? (
              <Button variant="outline" type="button" onClick={() => window.print()}>
                打印对账单
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
                if (
                  !confirmEdits("合同", c.name, creating, draft, c, {
                    year: "年份",
                    code: "项目号",
                    name: "项目名称",
                    contractor: "总包",
                    subcontractor: "分包",
                    contractAmount: "合同金额",
                    taxRate: "税率",
                    reportTaxMode: "报量计税",
                    payRatio: "付款比例",
                    warrantyStart: "质保开始",
                    warrantyEnd: "质保结束",
                    status: "状态",
                    manager: "经理",
                    prelimAmount: "初审金额",
                    settleReceivable: "结算金额",
                    hasDeposit: "有质保金",
                    depositAmount: "质保金",
                    remark: "备注",
                  })
                )
                  return;
                if (onSave(c) !== false) markSaved();
              }}
            >
              保存合同信息
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="年份">
            <Input type="number" value={c.year} onChange={(e) => patch("year", Number(e.target.value) || 0)} />
          </Field>
          <Field label="项目号">
            <Input value={c.code} onChange={(e) => patch("code", e.target.value)} />
          </Field>
          <Field label="项目名称 *">
            <Input value={c.name} onChange={(e) => patch("name", e.target.value)} />
          </Field>
          <Field label="总包">
            <Input value={c.contractor} onChange={(e) => patch("contractor", e.target.value)} />
          </Field>
          <Field label="分包">
            <Input value={c.subcontractor} onChange={(e) => patch("subcontractor", e.target.value)} />
          </Field>
          <Field label="项目部经营人员">
            <Input value={c.manager} onChange={(e) => patch("manager", e.target.value)} />
          </Field>
          <Field label="合同金额">
            <Input type="number" step="0.01" value={c.contractAmount} onChange={(e) => patch("contractAmount", Number(e.target.value) || 0)} />
          </Field>
          <Field label="税率 %">
            <Input type="number" step="0.01" value={c.taxRate} onChange={(e) => patch("taxRate", Number(e.target.value) || 0)} />
          </Field>
          <Field label="付款比例 %">
            <Input type="number" step="0.01" value={c.payRatio} onChange={(e) => patch("payRatio", Number(e.target.value) || 0)} />
          </Field>
          <Field label="报量计税">
            <select className="field-select w-full" value={c.reportTaxMode} onChange={(e) => patch("reportTaxMode", e.target.value)}>
              <option value="incl">含税金额</option>
              <option value="excl">不含税金额</option>
            </select>
          </Field>
          <Field label="状态">
            <select className="field-select w-full" value={c.status} onChange={(e) => patch("status", e.target.value)}>
              {CONTRACT_STATUSES.map((s) => (
                <option value={s} key={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="质保开始">
            <Input type="date" value={c.warrantyStart} onChange={(e) => patch("warrantyStart", e.target.value)} />
          </Field>
          <Field label="质保结束">
            <Input type="date" value={c.warrantyEnd} onChange={(e) => patch("warrantyEnd", e.target.value)} />
          </Field>
          <Field label="有质保金">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={c.hasDeposit} onChange={(e) => patch("hasDeposit", e.target.checked)} />
              {c.hasDeposit ? "有" : "无"}
            </label>
          </Field>
          <Field label="质保金金额">
            <Input
              type="number"
              step="0.01"
              disabled={!c.hasDeposit}
              value={c.depositAmount}
              onChange={(e) => patch("depositAmount", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="初审金额">
            <Input type="number" step="0.01" value={c.prelimAmount} onChange={(e) => patch("prelimAmount", Number(e.target.value) || 0)} />
          </Field>
          <Field label="结算金额（手填）">
            <Input type="number" step="0.01" value={c.settleReceivable} onChange={(e) => patch("settleReceivable", Number(e.target.value) || 0)} />
          </Field>
          <Field label="备注" className="md:col-span-3">
            <Input value={c.remark} onChange={(e) => patch("remark", e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-muted">
          {c.reportTaxMode === "incl" ? "含税金额 ¥" : "不含税金额 ¥"}
          {money(c.reportTaxMode === "incl" ? roll.reportIncl : roll.reportExcl)} · 应收 ¥{money(roll.payable)} · 开票金额 ¥
          {money(roll.invoice)} · 已付 ¥{money(roll.receipt)}（代付 ¥{money(roll.workerPay)} + 到分包 ¥{money(roll.subPay)}）· 合同未付 ¥
          {money(roll.dueRemain)} · 剩余款 ¥{money(roll.remain)}。报量按{c.reportTaxMode === "incl" ? "含税" : "不含税"}录入。
        </p>
        <ContractScanBox
          contract={c}
          onFileName={(name) => {
            // 上传扫描件会保存表单：若编辑器里有未保存改动，先明示，避免绕过「保存」确认
            if (dirtyRef.current && !confirm("刚才改的合同信息（金额/税率等）还没保存。上传扫描件会把它们一并保存，确定继续吗？")) return;
            const next = { ...c, scanFileName: name };
            setC(next);
            if (onSave(next) !== false) markSaved();
          }}
        />
        <div className="grid gap-4 xl:grid-cols-3">
          <ReportBook
            contract={c}
            entries={entries.filter((e) => e.kind === "report")}
            disabled={creating}
            onAdd={onAddEntry}
            onUpdate={onUpdateEntry}
            onRemove={onRemoveEntries}
          />
          <InvoiceBook
            contract={c}
            entries={entries.filter((e) => e.kind === "invoice")}
            disabled={creating}
            onAdd={onAddEntry}
            onUpdate={onUpdateEntry}
            onRemove={onRemoveEntries}
          />
          <ReceiptBook
            contract={c}
            entries={entries.filter((e) => e.kind === "receipt")}
            disabled={creating}
            onAdd={onAddEntry}
            onUpdate={onUpdateEntry}
            onRemove={onRemoveEntries}
          />
        </div>
        {creating ? <p className="text-sm text-warn">先保存合同信息，才能记报量、开票、收款。</p> : null}
      </section>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function DocPick({ label, fileName, disabled, onFile }: { label: string; fileName?: string; disabled?: boolean; onFile: (file: File) => void }) {
  return (
    <FilePick
      kind="file"
      compact
      disabled={disabled}
      accept=".pdf,.ofd,.xml,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
      label={label}
      hint={fileName ? `已选：${fileName}，可再点或拖入替换` : "点击选择，或把文件拖到这里"}
      onFile={onFile}
    />
  );
}

async function attachNamed(id: string, kind: string, file: File | undefined, base: string, taken: string[]) {
  if (!file) return "";
  const pack = await prepareNamedFile(file, base, taken, "");
  if (!pack) return "";
  const saved = (await setDoc(id, kind, pack.file, { replace: pack.replace })) || pack.file.name;
  return saved;
}

function useTakenNames() {
  const entries = useApp((s) => s.contractEntries);
  const docs = useApp((s) => s.attendanceDocs);
  return [...entries.map((e) => e.fileName), ...(docs || []).map((d) => d.fileName)].filter(
    (x): x is string => Boolean(x),
  );
}

/**
 * 明细行「改一笔」的确认文案（1.8.8 D1）。
 * 无改动返回 null；有改动返回 { changes }，调用方据此弹 confirm。
 */
function askEntryEdit(kindLabel: string, before: ContractEntry, after: ContractEntry): boolean {
  const changes = contractEntryChanges(before, after);
  if (!changes.length) {
    toast.message(`这笔${kindLabel}没有改动`);
    return false;
  }
  return window.confirm(`确认保存这笔${kindLabel}的修改？\n\n${changes.join("\n")}`);
}

function ReportBook({
  contract,
  entries,
  disabled,
  onAdd,
  onUpdate,
  onRemove,
}: {
  contract: ContractRecord;
  entries: ContractEntry[];
  disabled: boolean;
  onAdd: (e: ContractEntry) => void;
  onUpdate: (e: ContractEntry) => void;
  onRemove: (ids: string[]) => void;
}) {
  const [editId, setEditId] = React.useState("");
  const [date, setDate] = React.useState(localToday());
  const [amount, setAmount] = React.useState(0);
  const [no, setNo] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const taken = useTakenNames();
  const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
  const editing = entries.find((e) => e.id === editId) || null;
  function resetForm() {
    setEditId("");
    setDate(localToday());
    setAmount(0);
    setNo("");
    setRemark("");
    setFile(undefined);
  }
  function startEdit(e: ContractEntry) {
    setEditId(e.id);
    setDate(e.date || "");
    setAmount(e.amount || 0);
    setNo(e.no || "");
    setRemark(e.remark || "");
    setFile(undefined);
  }
  async function submit() {
    if (editing) {
      const fileName = file ? file.name || "（已选新文件）" : editing.fileName;
      const draftEntry = { ...editing, date, amount, no, remark, fileName };
      if (!askEntryEdit("报量", editing, draftEntry)) return;
      const saved = file
        ? await attachNamed(editing.id, "report", file, reportBase(contract.name, date, amount), taken)
        : editing.fileName;
      onUpdate(normalizeEntry({ ...editing, date, amount, no, remark, fileName: saved }));
      toast.success("已保存这笔报量的修改");
      resetForm();
      return;
    }
    const id = uid();
    const fileName = await attachNamed(id, "report", file, reportBase(contract.name, date, amount), taken);
    onAdd(
      normalizeEntry({
        id,
        contractId: contract.id,
        kind: "report",
        date,
        amount,
        no,
        remark,
        fileName,
      }),
    );
    setAmount(0);
    setNo("");
    setRemark("");
    setFile(undefined);
    toast.success("已记一笔报量");
  }
  return (
    <div className="rounded-lg border border-line bg-bg-elevated p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">月报量</h3>
        <span className="text-xs tabular-nums text-muted">
          {entries.length} 笔 · ¥{money(total)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        按{contract.reportTaxMode === "incl" ? "含税" : "不含税"}记。上传后自动命名：项目名报量-月份-金额。
      </p>
      <div className="mt-3 space-y-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={disabled} />
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          disabled={disabled}
          placeholder={contract.reportTaxMode === "incl" ? "含税金额" : "不含税金额"}
        />
        <Input value={no} onChange={(e) => setNo(e.target.value)} disabled={disabled} placeholder="期次" />
        <Input value={remark} onChange={(e) => setRemark(e.target.value)} disabled={disabled} placeholder="备注" />
        <DocPick label="报量单" fileName={file?.name} disabled={disabled} onFile={setFile} />
        <Button size="sm" className="w-full" disabled={disabled || !amount} type="button" onClick={submit}>
          {editing ? "保存这笔报量的修改" : "记一笔报量"}
        </Button>
        {editing ? (
          <Button size="sm" variant="outline" className="w-full" type="button" onClick={resetForm}>
            取消修改
          </Button>
        ) : null}
      </div>
      <EntryRows
        entries={entries}
        title="报量"
        onRemove={onRemove}
        onEdit={disabled ? undefined : startEdit}
        editingId={editId}
        render={(e: any) => (
          <>
            <div className="tabular-nums">
              {e.date || "—"}
              {contract.reportTaxMode === "incl" ? " · 含税金额 ¥" : " · 不含税金额 ¥"}
              {money(e.amount)}
            </div>
            <div className="text-muted">
              {e.no ? `${e.no} ` : ""}
              {e.remark}
            </div>
            <FileLink id={e.id} kind="report" fileName={e.fileName} suggest={reportBase(contract.name, e.date, e.amount)} />
          </>
        )}
      />
    </div>
  );
}

function InvoiceBook({
  contract,
  entries,
  disabled,
  onAdd,
  onUpdate,
  onRemove,
}: {
  contract: ContractRecord;
  entries: ContractEntry[];
  disabled: boolean;
  onAdd: (e: ContractEntry) => void;
  onUpdate: (e: ContractEntry) => void;
  onRemove: (ids: string[]) => void;
}) {
  const [editId, setEditId] = React.useState("");
  const [date, setDate] = React.useState(localToday());
  const [incl, setIncl] = React.useState(0);
  const [excl, setExcl] = React.useState(0);
  const [rate, setRate] = React.useState(contract.taxRate || 9);
  const [no, setNo] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const taken = useTakenNames();
  const editing = entries.find((e) => e.id === editId) || null;
  // 切换合同（编辑器复用同一组件）时重置开票表单，避免上一份合同的税率/编号残留
  React.useEffect(() => {
    setRate(contract.taxRate || 9);
    setIncl(0);
    setExcl(0);
    setNo("");
    setRemark("");
    setFile(undefined);
    setEditId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.id]);
  const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
  function fromIncl(n: number) {
    setIncl(n);
    if (rate > 0) setExcl(round2(n / (1 + rate / 100)));
  }
  function fromExcl(n: number) {
    setExcl(n);
    if (rate > 0) setIncl(round2(n * (1 + rate / 100)));
  }
  function fromRate(n: number) {
    setRate(n);
    if (excl > 0) setIncl(round2(excl * (1 + n / 100)));
    else if (incl > 0 && n > 0) setExcl(round2(incl / (1 + n / 100)));
  }
  function resetForm() {
    setEditId("");
    setIncl(0);
    setExcl(0);
    setNo("");
    setRemark("");
    setFile(undefined);
  }
  function startEdit(e: ContractEntry) {
    setEditId(e.id);
    setDate(e.date || "");
    setIncl(e.amount || 0);
    setExcl(e.amountExcl || 0);
    setRate(e.taxRate || 0);
    setNo(e.no || "");
    setRemark(e.remark || "");
    setFile(undefined);
  }
  async function submit() {
    if (editing) {
      const fileName = file ? file.name || "（已选新文件）" : editing.fileName;
      const draftEntry = { ...editing, date, amount: incl, amountExcl: excl, taxRate: rate, no, remark, fileName };
      if (!askEntryEdit("发票", editing, draftEntry)) return;
      const saved = file
        ? await attachNamed(editing.id, "invoice", file, invoiceBase(contract.name, date, incl), taken)
        : editing.fileName;
      onUpdate(normalizeEntry({ ...editing, date, amount: incl, amountExcl: excl, taxRate: rate, no, remark, fileName: saved }));
      toast.success("已保存这张发票的修改");
      resetForm();
      return;
    }
    const id = uid();
    const fileName = await attachNamed(id, "invoice", file, invoiceBase(contract.name, date, incl), taken);
    onAdd(
      normalizeEntry({
        id,
        contractId: contract.id,
        kind: "invoice",
        date,
        amount: incl,
        amountExcl: excl,
        taxRate: rate,
        no,
        remark,
        fileName,
      }),
    );
    setIncl(0);
    setExcl(0);
    setNo("");
    setRemark("");
    setFile(undefined);
    toast.success("已记一张发票");
  }
  return (
    <div className="rounded-lg border border-line bg-bg-elevated p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">开票</h3>
        <span className="text-xs tabular-nums text-muted">
          {entries.length} 张 · 开票金额 ¥{money(total)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">填含税或不含税，按税率互算。上传后自动命名：合同名-开票月份-金额。</p>
      <div className="mt-3 space-y-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={disabled} />
        <Input type="number" step="0.01" value={incl || ""} onChange={(e) => fromIncl(Number(e.target.value) || 0)} disabled={disabled} placeholder="含税金额" />
        <Input type="number" step="0.01" value={excl || ""} onChange={(e) => fromExcl(Number(e.target.value) || 0)} disabled={disabled} placeholder="不含税金额" />
        <Input type="number" step="0.01" value={rate} onChange={(e) => fromRate(Number(e.target.value) || 0)} disabled={disabled} placeholder="税率 %" />
        <Input value={no} onChange={(e) => setNo(e.target.value)} disabled={disabled} placeholder="发票号" />
        <Input value={remark} onChange={(e) => setRemark(e.target.value)} disabled={disabled} placeholder="备注" />
        <DocPick label="电子发票" fileName={file?.name} disabled={disabled} onFile={setFile} />
        <Button size="sm" className="w-full" disabled={disabled || !incl} type="button" onClick={submit}>
          {editing ? "保存这张发票的修改" : "记一张发票"}
        </Button>
        {editing ? (
          <Button size="sm" variant="outline" className="w-full" type="button" onClick={resetForm}>
            取消修改
          </Button>
        ) : null}
      </div>
      <EntryRows
        entries={entries}
        title="发票"
        onRemove={onRemove}
        onEdit={disabled ? undefined : startEdit}
        editingId={editId}
        render={(e: any) => (
          <>
            <div className="tabular-nums">
              {e.date || "—"} · 开票金额 ¥{money(e.amount)}
            </div>
            <div className="text-muted">
              不含税 ¥{money(e.amountExcl)} · {e.taxRate || 0}% {e.no}
            </div>
            <FileLink id={e.id} kind="invoice" fileName={e.fileName} suggest={invoiceBase(contract.name, e.date, e.amount)} />
          </>
        )}
      />
    </div>
  );
}

function ReceiptBook({
  contract,
  entries,
  disabled,
  onAdd,
  onUpdate,
  onRemove,
}: {
  contract: ContractRecord;
  entries: ContractEntry[];
  disabled: boolean;
  onAdd: (e: ContractEntry) => void;
  onUpdate: (e: ContractEntry) => void;
  onRemove: (ids: string[]) => void;
}) {
  const [editId, setEditId] = React.useState("");
  const [date, setDate] = React.useState(localToday());
  const [amount, setAmount] = React.useState(0);
  const [payTo, setPayTo] = React.useState<"" | "worker" | "sub">("sub");
  const [no, setNo] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const taken = useTakenNames();
  const workers = entries.filter((e) => e.payTo === "worker").reduce((s, e) => s + (e.amount || 0), 0);
  const subs = entries.filter((e) => e.payTo !== "worker").reduce((s, e) => s + (e.amount || 0), 0);
  const editing = entries.find((e) => e.id === editId) || null;
  const base = payTo === "worker" ? receiptWorkerBase(contract.name, date) : receiptSubBase(contract.name, date);
  function resetForm() {
    setEditId("");
    setAmount(0);
    setNo("");
    setRemark("");
    setFile(undefined);
  }
  function startEdit(e: ContractEntry) {
    setEditId(e.id);
    setDate(e.date || "");
    setAmount(e.amount || 0);
    setPayTo(e.payTo === "worker" ? "worker" : "sub");
    setNo(e.no || "");
    setRemark(e.remark || "");
    setFile(undefined);
  }
  async function submit() {
    if (editing) {
      const fileName = file ? file.name || "（已选新文件）" : editing.fileName;
      const draftEntry = { ...editing, date, amount, payTo, no, remark, fileName };
      if (!askEntryEdit("收款", editing, draftEntry)) return;
      const saved = file ? await attachNamed(editing.id, "receipt", file, base, taken) : editing.fileName;
      onUpdate(normalizeEntry({ ...editing, date, amount, payTo, no, remark, fileName: saved }));
      toast.success("已保存这笔收款的修改");
      resetForm();
      return;
    }
    const id = uid();
    const fileName = await attachNamed(id, "receipt", file, base, taken);
    onAdd(
      normalizeEntry({
        id,
        contractId: contract.id,
        kind: "receipt",
        date,
        amount,
        payTo,
        no,
        remark,
        fileName,
      }),
    );
    setAmount(0);
    setNo("");
    setRemark("");
    setFile(undefined);
    toast.success("已记一笔收款");
  }
  return (
    <div className="rounded-lg border border-line bg-bg-elevated p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">收款</h3>
        <span className="text-xs tabular-nums text-muted">{entries.length} 笔</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        类型选「代付农民工」会把金额单独汇总；「到分包」是正常收款。上传后自动命名。
      </p>
      <div className="mt-3 space-y-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={disabled} />
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} disabled={disabled} placeholder="金额" />
        <select className="field-select w-full" value={payTo} onChange={(e) => setPayTo(e.target.value as "" | "sub" | "worker")} disabled={disabled}>
          <option value="sub">到分包</option>
          <option value="worker">代付农民工</option>
        </select>
        <Input value={no} onChange={(e) => setNo(e.target.value)} disabled={disabled} placeholder="银行回单号" />
        <Input value={remark} onChange={(e) => setRemark(e.target.value)} disabled={disabled} placeholder="备注" />
        <DocPick label="收款回单" fileName={file?.name} disabled={disabled} onFile={setFile} />
        <Button size="sm" className="w-full" disabled={disabled || !amount} type="button" onClick={submit}>
          {editing ? "保存这笔收款的修改" : "记一笔收款"}
        </Button>
        {editing ? (
          <Button size="sm" variant="outline" className="w-full" type="button" onClick={resetForm}>
            取消修改
          </Button>
        ) : null}
      </div>
      <EntryRows
        entries={entries}
        title="收款"
        onRemove={onRemove}
        onEdit={disabled ? undefined : startEdit}
        editingId={editId}
        render={(e: any) => (
          <>
            <div className="tabular-nums">
              {e.date || "—"} · {money(e.amount)} · {e.payTo === "worker" ? "代付农民工" : "到分包"}
            </div>
            <div className="text-muted">{[e.no, e.remark].filter(Boolean).join(" · ")}</div>
            <FileLink
              id={e.id}
              kind="receipt"
              fileName={e.fileName}
              suggest={e.payTo === "worker" ? receiptWorkerBase(contract.name, e.date) : receiptSubBase(contract.name, e.date)}
            />
          </>
        )}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          到分包：¥{money(subs)} · {entries.filter((e) => e.payTo !== "worker").length} 笔
        </div>
        <div>
          代付农民工：¥{money(workers)} · {entries.filter((e) => e.payTo === "worker").length} 笔
        </div>
      </div>
    </div>
  );
}

function FileLink({ id, kind, fileName, suggest }: { id: string; kind: string; fileName: string; suggest: string }) {
  const patch = useApp((s) => s.patchContractEntry);
  const taken = useTakenNames();
  return (
    <div className="mt-0.5">
      {fileName ? <div className="truncate text-muted">{fileName}</div> : null}
      <DocActions
        id={id}
        kind={kind}
        fileName={fileName}
        suggest={suggest}
        taken={taken}
        onReplaced={(name) => patch(id, { fileName: name })}
        onDeleted={() => patch(id, { fileName: "" })}
      />
    </div>
  );
}

function EntryRows({
  entries,
  title,
  onRemove,
  onEdit,
  editingId,
  render,
}: {
  entries: ContractEntry[];
  title: string;
  onRemove: (ids: string[]) => void;
  /** 有「改」入口时传：点铅笔把这一笔带进上面的表单（1.8.8 D1 明细可改） */
  onEdit?: (e: ContractEntry) => void;
  editingId?: string;
  render: (e: ContractEntry) => React.ReactNode;
}) {
  return (
    <ul className="mt-3 max-h-64 space-y-1 overflow-auto text-xs">
      {entries.length === 0 ? <li className="text-muted">暂无</li> : null}
      {entries
        .slice()
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
        .map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-2 border-b border-line py-1.5 last:border-0">
            <div className="min-w-0">{render(e)}</div>
            <div className="flex shrink-0 items-center gap-1.5">
              {onEdit ? (
                <button
                  type="button"
                  className="text-muted hover:text-accent"
                  aria-label="编辑"
                  title="改这一笔"
                  data-editing={editingId === e.id ? "1" : undefined}
                  onClick={() => onEdit(e)}
                >
                  <Pencil className="size-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                className="text-muted hover:text-danger"
                aria-label="删除"
                onClick={async () => {
                  if (!confirm(`删除这笔${title}？`)) return;
                  if (e.kind === "report" || e.kind === "invoice" || e.kind === "receipt") await removeDoc(e.id, e.kind);
                  onRemove([e.id]);
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
    </ul>
  );
}

function contractScanName(name: string) {
  const base = (name || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "");
  return base ? `${base}-合同电子版` : "";
}

function ContractScanBox({ contract, onFileName }: { contract: ContractRecord; onFileName: (name: string) => void }) {
  const scans = useApp((s) => s.contracts);
  const taken = (scans || []).map((c) => c.scanFileName).filter((x): x is string => Boolean(x));
  return (
    <div id="contract-scan" className="rounded-lg border-2 border-dashed border-accent bg-accent-soft p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">合同电子版（扫描件）</div>
          <p className="mt-0.5 text-xs text-muted">
            点绿色按钮或把 PDF / 照片拖进来。上传后立刻算有合同，不用再点保存。文件名是「项目名称-合同电子版」。没传就是无合同，原因写备注。
          </p>
        </div>
        {contract.scanFileName ? <Badge tone="ok">有合同</Badge> : <Badge>无合同</Badge>}
      </div>
      <FilePick
        kind="file"
        accept=".pdf,.ofd,.jpg,.jpeg,.png,.webp"
        label={contract.scanFileName ? "更换合同电子版" : "上传合同电子版"}
        hint={contract.scanFileName ? `已选：${contract.scanFileName}，可再点或拖入替换` : "支持 PDF、照片。请先填项目名称。"}
        onFile={async (file) => {
          if (!file) return;
          const base = contractScanName(contract.name);
          if (!base) {
            toast.error("先填项目名称，扫描件按 项目名称-合同电子版 保存");
            return;
          }
          const pack = await prepareNamedFile(file, base, taken, contract.scanFileName);
          if (!pack) return;
          const saved = (await setDoc(contract.id, "contract", pack.file, { replace: pack.replace })) || pack.file.name;
          onFileName(saved);
          toast.success(`已保存 ${saved}`);
        }}
      />
      {contract.scanFileName ? <div className="mt-2 truncate text-xs text-muted">{contract.scanFileName}</div> : null}
      <div className="mt-2">
        <DocActions
          id={contract.id}
          kind="contract"
          fileName={contract.scanFileName}
          suggest={contractScanName(contract.name) || "合同电子版"}
          taken={taken}
          onReplaced={onFileName}
          onDeleted={() => onFileName("")}
        />
      </div>
    </div>
  );
}
