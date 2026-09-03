import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, usePager } from "~/components/wide-table";
import { Need } from "~/components/can";
import { ExpenseImport, TplLink } from "~/components/excel-import";
import { DocActions, prepareNamedFile, setDoc } from "~/components/doc-actions";
import { useApp } from "~/lib/store";
import { money, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";

const PAY_METHODS = ["现金", "转账", "微信", "支付宝", "对公", "其他"];

function safeBase(s: string) {
  return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim() || "未命名";
}
function needsVoucher(method: string) {
  return (method || "现金") !== "现金";
}
function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}
function emptyExpense(year: number): any {
  const today = todayYmd();
  return {
    id: uid(),
    year,
    name: "",
    period: today,
    date: today,
    unit: "项",
    qty: 1,
    price: 0,
    amount: 0,
    remark: "",
    payMethod: "现金",
    status: "未报销",
    reimbursedAt: "",
    voucherId: "",
    voucherFileName: "",
    claimant: "",
    forWhom: "",
    payAccount: "",
    payBank: "",
    payCardNo: "",
    payoutId: "",
    payoutFileName: "",
    payoutDate: "",
    payoutMethod: "转账",
  };
}
function amountTag(n: number) {
  const x = Number(n) || 0;
  return String(Number.isInteger(x) ? x : Math.round(x * 100) / 100);
}
function dateFromPeriod(period: string, fallback: string) {
  const p = String(period || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  const m = p.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  return fallback || todayYmd();
}
function voucherBase(items: any[]) {
  if (!items.length) return "报销凭证";
  if (items.length === 1) return `${safeBase(items[0].name)}-${amountTag(items[0].amount)}`;
  const bits = items.slice(0, 3).map((e) => `${safeBase(e.name)}-${amountTag(e.amount)}`);
  let n = bits.join("+");
  if (items.length > 3) n += `等${items.length}笔`;
  return n.slice(0, 80);
}
function payoutBase(items: any[]) {
  if (!items.length) return "收报销款-0-0笔";
  const total = round2(items.reduce((s, e) => s + (e.amount || 0), 0));
  return `收报销款-${amountTag(total)}-${items.length}笔`;
}
function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function uniqueNames(people: any[], expenses: any[]) {
  const s = new Set<string>();
  for (const p of people || []) if (p.name) s.add(p.name);
  for (const e of expenses || []) {
    if (e.claimant) s.add(e.claimant);
  }
  return [...s];
}
function formatPayAccount(bank?: string, card?: string) {
  return [bank, card].map((s) => (s || "").trim()).filter(Boolean).join(" ");
}
function accountOf(e: any) {
  return formatPayAccount(e?.payBank, e?.payCardNo) || e?.payAccount || "";
}
function accountParts(e: any) {
  const name = (e.forWhom || "").trim();
  const bank = (e.payBank || "").trim();
  const card = (e.payCardNo || "").trim();
  if (!name && !bank && !card) return null;
  return { name, bank, card };
}
function listPayees(expenses: any[]) {
  const map = new Map<string, { name: string; bank: string; card: string }>();
  const rows = (expenses || [])
    .slice()
    .sort(
      (a: any, b: any) =>
        (a.date || "").localeCompare(b.date || "") || (a.payoutDate || "").localeCompare(b.payoutDate || ""),
    );
  for (const e of rows) {
    const name = (e.forWhom || "").trim();
    if (!name) continue;
    map.set(name, { name, bank: (e.payBank || "").trim(), card: (e.payCardNo || "").trim() });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "zh"));
}
function applyPayee(row: any, payees: any[], name: string) {
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Mini({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      {hint ? <div className="text-[10px] text-subtle">{hint}</div> : null}
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">¥{money(value)}</div>
    </div>
  );
}

function NameInput({
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

function VoucherSlot({
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

function ExpensesPage() {
  const { year, expenses, upsertExpense, removeExpenses, people } = useApp();
  const list = expenses || [];
  const names = uniqueNames(people, list);
  const payees = listPayees(list);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [claimant, setClaimant] = React.useState("all");
  const [scope, setScope] = React.useState("year");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [printStatus, setPrintStatus] = React.useState("未报销");
  const [printVoucher, setPrintVoucher] = React.useState(false);
  const [printSingle, setPrintSingle] = React.useState<any | null>(null);
  const [batch, setBatch] = React.useState<any>({
    claimant: "",
    forWhom: "",
    payAccount: "",
    payBank: "",
    payCardNo: "",
    payoutDate: "",
    payoutMethod: "转账",
    payoutId: "",
    payoutFileName: "",
  });
  React.useEffect(() => {
    const rows = list.filter((e: any) => selected.includes(e.id));
    if (!rows.length) return;
    const first = rows[0];
    const same = (k: keyof typeof batch) => rows.every((e: any) => (e[k] || "") === (first[k] || ""));
    setBatch((prev: any) => ({
      ...prev,
      claimant: same("claimant") ? first.claimant || prev.claimant : prev.claimant,
      forWhom: same("forWhom") ? first.forWhom || prev.forWhom : "",
      payBank: same("payBank") ? first.payBank || prev.payBank : prev.payBank,
      payCardNo: same("payCardNo") ? first.payCardNo || prev.payCardNo : prev.payCardNo,
      payAccount: same("payAccount") ? first.payAccount || prev.payAccount : prev.payAccount,
      payoutDate: same("payoutDate") ? first.payoutDate || prev.payoutDate : prev.payoutDate,
      payoutMethod: same("payoutMethod") ? first.payoutMethod || prev.payoutMethod : prev.payoutMethod,
      payoutId: same("payoutId") ? first.payoutId || "" : "",
      payoutFileName: same("payoutId") && first.payoutId ? first.payoutFileName || "" : "",
    }));
  }, [selected.join(","), list.length]);
  const shown = React.useMemo(() => {
    let rows = list;
    if (scope === "year") rows = rows.filter((e: any) => e.year === year);
    if (status !== "all") rows = rows.filter((e: any) => e.status === status);
    if (claimant !== "all") rows = rows.filter((e: any) => (e.claimant || "") === claimant);
    if (q.trim()) {
      const s = q.trim();
      rows = rows.filter((e: any) =>
        [
          e.name,
          e.period,
          e.remark,
          e.payMethod,
          e.claimant,
          e.forWhom,
          e.payAccount,
          e.payBank,
          e.payCardNo,
          e.payoutFileName,
          e.voucherFileName,
        ].some((x) => (x || "").includes(s)),
      );
    }
    return rows.slice().sort((a: any, b: any) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
  }, [list, year, scope, status, claimant, q]);
  const pager = usePager("expenses", shown, [scope, status, claimant, q, year].join("|"));
  const pageRows = pager.rows;
  const claimantOpts = [...new Set((list || []).map((e: any) => e.claimant).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh"),
  );
  const allChecked = pageRows.length > 0 && pageRows.every((e: any) => selected.includes(e.id));
  const picked = shown.filter((e: any) => selected.includes(e.id));
  const sumRows = picked.length ? picked : shown;
  const totals = sumRows.reduce(
    (s: any, e: any) => {
      s.amount += e.amount || 0;
      s.count += 1;
      if (e.status === "未报销") s.open += e.amount || 0;
      else s.done += e.amount || 0;
      if (needsVoucher(e.payMethod) && !e.voucherFileName) s.missing += 1;
      if (e.status === "已报销" && needsVoucher(e.payoutMethod || "转账") && !e.payoutFileName) s.missPay += 1;
      return s;
    },
    { amount: 0, count: 0, open: 0, done: 0, missing: 0, missPay: 0 },
  );
  const sumTip = picked.length ? `已选 ${picked.length} 笔` : `本表 ${shown.length} 笔`;
  const printRows = React.useMemo(() => {
    let rows: any[] = selected.length ? list.filter((e: any) => selected.includes(e.id)) : shown;
    if (printStatus !== "all") rows = rows.filter((e: any) => e.status === printStatus);
    return rows
      .slice()
      .sort(
        (a: any, b: any) =>
          (a.date || "").localeCompare(b.date || "") || (a.period || "").localeCompare(b.period || ""),
      );
  }, [selected, list, shown, printStatus]);
  const batchRows = list.filter((e: any) => selected.includes(e.id));
  const batchTotal = round2(batchRows.reduce((s, e: any) => s + (e.amount || 0), 0));
  const anyHung = batchRows.some((e: any) => e.payoutId);
  const anyDone = batchRows.some((e: any) => e.status === "已报销");
  function del(ids: string[]) {
    if (!ids.length) return;
    if (!confirmBatchDelete("报销", ids.length, "会同时去掉这些报销记录。凭证文件还在目录里，可到「影像资料」里清。")) return;
    removeExpenses(ids);
    setSelected((s) => s.filter((id) => !ids.includes(id)));
    if (editing && ids.includes(editing.id)) {
      setEditing(null);
      setCreating(false);
    }
    toast.success("已删除报销");
  }
  function doPrint() {
    if (!printRows.length) {
      toast.error("当前没有可打印的报销。可勾选几笔，或把打印范围改成「未报销」。");
      return;
    }
    window.print();
  }
  function saveOne(row: any, extra?: any) {
    upsertExpense({
      ...row,
      ...extra,
      id: row.id || uid(),
      amount: round2(row.amount || row.qty * row.price),
    });
  }
  function applyBatch(markDone: boolean) {
    if (!batchRows.length) {
      toast.error("先勾选要一起报销的几笔");
      return;
    }
    if (!batch.claimant.trim()) {
      toast.error("报销人必填：这几笔是谁来报的");
      return;
    }
    if (!batch.forWhom.trim()) {
      toast.error("收款人必填：钱打给谁");
      return;
    }
    if (!(batch.payBank || "").trim() || !(batch.payCardNo || "").trim()) {
      toast.error("开户行和打款账户都要填");
      return;
    }
    if (
      markDone &&
      needsVoucher(batch.payoutMethod) &&
      !batch.payoutFileName &&
      !confirm("打款不是现金，还没上传打款凭证。仍要记为已报销？")
    )
      return;
    const pid = batch.payoutId || uid();
    const acc = formatPayAccount(batch.payBank, batch.payCardNo);
    const day = markDone ? batch.payoutDate || todayYmd() : "";
    for (const e of batchRows) {
      saveOne(e, {
        claimant: batch.claimant.trim(),
        forWhom: (batch.forWhom || e.forWhom).trim(),
        payBank: batch.payBank.trim(),
        payCardNo: batch.payCardNo.trim(),
        payAccount: acc,
        payoutMethod: batch.payoutMethod || "转账",
        payoutDate: markDone ? day : e.status === "已报销" ? e.payoutDate : "",
        payoutId: pid,
        payoutFileName: batch.payoutFileName || e.payoutFileName || "",
        status: markDone ? "已报销" : e.status,
        reimbursedAt: markDone ? day : e.reimbursedAt,
      });
    }
    setBatch((b: any) => ({ ...b, payoutId: pid }));
    toast.success(markDone ? `已把 ${batchRows.length} 笔记为已报销，挂到同一笔打款` : `已把 ${batchRows.length} 笔挂账`);
  }
  function unhangBatch() {
    if (!batchRows.length) {
      toast.error("先勾选要取消挂账的几笔");
      return;
    }
    if (!confirm(`取消这 ${batchRows.length} 笔的挂账？打款凭证不再共用，报销人账户还留着。`)) return;
    for (const e of batchRows) saveOne(e, { payoutId: "", payoutFileName: "" });
    setBatch((b: any) => ({ ...b, payoutId: "", payoutFileName: "" }));
    toast.success(`已取消 ${batchRows.length} 笔挂账`);
  }
  function markOpen() {
    if (!batchRows.length) {
      toast.error("先勾选要改回未报销的几笔");
      return;
    }
    if (!confirm(`把这 ${batchRows.length} 笔标为未报销？`)) return;
    for (const e of batchRows) saveOne(e, { status: "未报销", payoutDate: "", reimbursedAt: "" });
    toast.success(`已把 ${batchRows.length} 笔标为未报销`);
  }
  async function uploadPayout(file: File) {
    if (!file) return;
    if (!batchRows.length) {
      toast.error("先勾选要一起报销的几笔");
      return;
    }
    if (!(batch.claimant || "").trim() || !(batch.forWhom || "").trim() || !(batch.payBank || "").trim() || !(batch.payCardNo || "").trim()) {
      toast.error("先填报销人、收款人、开户行和打款账户，打款凭证按这个命名");
      return;
    }
    const acc = formatPayAccount(batch.payBank, batch.payCardNo);
    const group = batchRows.map((e: any) => ({
      ...e,
      claimant: batch.claimant,
      forWhom: batch.forWhom || e.forWhom,
      payBank: batch.payBank,
      payCardNo: batch.payCardNo,
      payAccount: acc,
    }));
    const pid = batch.payoutId || uid();
    const pack = await prepareNamedFile(
      file,
      payoutBase(group),
      list.map((e: any) => e.payoutFileName).filter(Boolean),
      batch.payoutFileName,
    );
    if (!pack) return;
    const saved = (await setDoc(pid, "payout", pack.file, { replace: pack.replace })) || pack.file.name;
    setBatch((b: any) => ({ ...b, payoutId: pid, payoutFileName: saved }));
    for (const e of batchRows)
      saveOne(e, {
        claimant: batch.claimant.trim(),
        forWhom: (batch.forWhom || e.forWhom || batch.claimant).trim(),
        payBank: batch.payBank.trim(),
        payCardNo: batch.payCardNo.trim(),
        payAccount: acc,
        payoutMethod: batch.payoutMethod || "转账",
        payoutDate: e.status === "已报销" ? e.payoutDate || batch.payoutDate : "",
        payoutId: pid,
        payoutFileName: saved,
      });
    toast.success(`已保存打款凭证，挂到勾选的 ${batchRows.length} 笔`);
  }
  return (
    <Need perm="expenses.view">
      <>
        <div className="no-print space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">报销单</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                点「编辑」编辑。点一行勾选。勾几笔可一起报销、记打款。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TplLink href="/api/file/expense-template" filename="报销单导入模板.xlsx" />
              <ExpenseImport />
              <a className="btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft" href="/api/file/expense-export">
                导出全部报销
              </a>
              <Button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setEditing(emptyExpense(year));
                }}
              >
                <Plus className="size-4" /> 新增报销
              </Button>
            </div>
          </header>
          <div className="flex flex-wrap items-end gap-2">
            <select className="field-select w-auto" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="year">{year}年</option>
              <option value="all">全部年份</option>
            </select>
            <select className="field-select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">全部状态</option>
              <option value="未报销">未报销</option>
              <option value="已报销">已报销</option>
            </select>
            <select className="field-select w-auto" value={claimant} onChange={(e) => setClaimant(e.target.value)}>
              <option value="all">全部报销人</option>
              {claimantOpts.map((n) => (
                <option value={n} key={n}>
                  {n}
                </option>
              ))}
            </select>
            <Input className="max-w-xs" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索项目 / 报销人 / 收款人 / 账户" />
            {selected.length ? (
              <Button variant="danger" size="sm" type="button" onClick={() => del(selected)}>
                删除所选（{selected.length}）
              </Button>
            ) : null}
            <span className="ml-auto text-sm text-muted">
              {shown.length} 笔 · 合计 ¥{money(totals.amount)} · 未报销 ¥{money(totals.open)} · 已报销 ¥{money(totals.done)}
              {totals.missing + totals.missPay ? ` · 缺凭证 ${totals.missing + totals.missPay}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="field-select w-auto" value={printStatus} onChange={(e) => setPrintStatus(e.target.value)}>
              <option value="未报销">打印未报销</option>
              <option value="已报销">打印已报销</option>
              <option value="all">打印全部</option>
            </select>
            <Button variant="outline" size="sm" type="button" onClick={doPrint}>
              打印报销单{printRows.length ? `（${printRows.length}）` : ""}
            </Button>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={printVoucher} onChange={(e) => setPrintVoucher(e.target.checked)} />
              打印票据列
            </label>
            {selected.length ? <span className="text-xs text-muted">已勾选 {selected.length} 笔，打印时只用勾选的</span> : null}
          </div>
          {selected.length ? (
            <div className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">已勾选 {batchRows.length} 笔 · 合计 ¥{money(batchTotal)}</div>
                  <p className="text-xs text-muted">同一报销人、打到同一个账户，可共用一张打款凭证。</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => applyBatch(false)}>
                    挂账
                  </Button>
                  {anyHung ? (
                    <Button variant="outline" size="sm" type="button" onClick={unhangBatch}>
                      取消挂账
                    </Button>
                  ) : null}
                  <Button size="sm" type="button" onClick={() => applyBatch(true)}>
                    记为已报销
                  </Button>
                  {anyDone ? (
                    <Button variant="outline" size="sm" type="button" onClick={markOpen}>
                      标为未报销
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Field label="报销人 *">
                  <NameInput
                    value={batch.claimant}
                    names={names}
                    listId="exp-claimant"
                    placeholder="选或填"
                    onChange={(v) => setBatch((b: any) => ({ ...b, claimant: v }))}
                  />
                </Field>
                <Field label="收款人 *">
                  <NameInput
                    value={batch.forWhom}
                    names={payees.map((p) => p.name)}
                    listId="exp-payee"
                    placeholder="填过可下拉"
                    onChange={(v) => setBatch((b: any) => applyPayee(b, payees, v))}
                  />
                </Field>
                <Field label="开户行 *">
                  <NameInput
                    value={batch.payBank}
                    names={[...new Set(payees.map((p) => p.bank).filter(Boolean))]}
                    listId="exp-bank"
                    placeholder="如 工商银行XX支行"
                    onChange={(v) => setBatch((b: any) => ({ ...b, payBank: v, payAccount: formatPayAccount(v, b.payCardNo) }))}
                  />
                </Field>
                <Field label="打款账户 *">
                  <NameInput
                    value={batch.payCardNo}
                    names={[...new Set(payees.map((p) => p.card).filter(Boolean))]}
                    listId="exp-card"
                    placeholder="银行卡号"
                    onChange={(v) => setBatch((b: any) => ({ ...b, payCardNo: v, payAccount: formatPayAccount(b.payBank, v) }))}
                  />
                </Field>
                <Field label="打款日期">
                  <Input type="date" value={batch.payoutDate} onChange={(e) => setBatch((b: any) => ({ ...b, payoutDate: e.target.value }))} />
                </Field>
                <Field label="打款方式">
                  <select className="field-select w-full" value={batch.payoutMethod} onChange={(e) => setBatch((b: any) => ({ ...b, payoutMethod: e.target.value }))}>
                    {PAY_METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-end rounded-lg border border-line bg-bg-elevated p-3 text-sm">
                  <div>
                    <div className="text-xs text-muted">这批合计</div>
                    <div className="font-display text-lg font-semibold tabular-nums">¥{money(batchTotal)}</div>
                  </div>
                </div>
              </div>
              <VoucherSlot
                title="打款凭证"
                hint={`文件名「${payoutBase(batchRows.length ? batchRows : [{ amount: batchTotal }])}」。勾选的几笔共用一张。`}
                id={batch.payoutId || "pending"}
                kind="payout"
                fileName={batch.payoutFileName}
                optional={(batch.payoutMethod || "转账") === "现金"}
                onFile={uploadPayout}
                onDeleted={() => {
                  setBatch((b: any) => ({ ...b, payoutFileName: "" }));
                  for (const e of batchRows) saveOne(e, { payoutFileName: "" });
                }}
              />
            </div>
          ) : null}
          {editing ? (
            <ExpenseEditor
              draft={editing}
              creating={creating}
              all={list}
              payees={payees}
              selectedIds={selected}
              names={names}
              onCancel={() => {
                setEditing(null);
                setCreating(false);
              }}
              onSave={(row: any) => {
                upsertExpense(row);
                setEditing(row);
                setCreating(false);
                toast.success("报销已保存");
              }}
              onDelete={() => del([editing.id])}
              onPrintSingle={(row: any) => {
                setPrintSingle(row);
                setTimeout(() => {
                  window.print();
                  setPrintSingle(null);
                }, 0);
              }}
            />
          ) : null}
          <WideTable id="expenses" pager={pager as any}>
            <table className="wide-table text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="w-10 py-2 px-3">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={allChecked}
                      onChange={(e) => {
                        const ids = pageRows.map((r: any) => r.id);
                        setSelected((s) => (e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id))));
                      }}
                      aria-label="全选报销"
                    />
                  </th>
                  <th className="py-2 px-3">操作</th>
                  <th className="py-2 px-3">序号</th>
                  <th className="py-2 px-3">项目</th>
                  <th className="py-2 px-3">购买时间</th>
                  <th className="py-2 px-3">金额</th>
                  <th className="py-2 px-3">报销人</th>
                  <th className="py-2 px-3">打款账户</th>
                  <th className="py-2 px-3">状态</th>
                  <th className="py-2 px-3">凭证</th>
                  <th className="py-2 px-3">备注</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-muted">
                      还没有报销。点右上角「新增报销」。勾几笔可一起报销、记打款。
                    </td>
                  </tr>
                ) : null}
                {pageRows.map((e: any, i: number) => {
                  const on = editing?.id === e.id;
                  const sib = e.payoutId ? list.filter((x: any) => x.payoutId === e.payoutId).length : 0;
                  return (
                    <tr
                      key={e.id}
                      className={`group border-b border-line last:border-0 hover:bg-accent-soft ${on || selected.includes(e.id) ? "bg-accent-soft" : ""}`}
                      onClick={() => setSelected((s) => toggleSel(s, e.id, !s.includes(e.id)))}
                    >
                      <td className="p-2" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={selected.includes(e.id)}
                          onChange={(ev) => setSelected((s) => toggleSel(s, e.id, ev.target.checked))}
                          aria-label={`选择 ${e.name}`}
                        />
                      </td>
                      <td className="py-2 px-3" onClick={(ev) => ev.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setCreating(false);
                            setEditing(e);
                          }}
                        >
                          编辑
                        </Button>
                      </td>
                      <td className="py-2 px-3 tabular-nums text-muted">{(pager.page - 1) * pager.size + i + 1}</td>
                      <td className="py-2 px-3 font-medium">{e.name}</td>
                      <td className="py-2 px-3">{e.period || e.date}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-medium">{money(e.amount)}</td>
                      <td className="py-2 px-3">{e.claimant || "—"}</td>
                      <td className="py-2 px-3">
                        {(() => {
                          const parts = accountParts(e);
                          if (!parts) return "—";
                          return (
                            <div className="text-xs leading-snug">
                              {parts.name ? <div className="font-medium">{parts.name}</div> : null}
                              {parts.bank ? <div className="text-muted">{parts.bank}</div> : null}
                              {parts.card ? <div className="tabular-nums text-muted">{parts.card}</div> : null}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-3">
                        <Badge tone={e.status === "已报销" ? "ok" : "warn"}>{e.status}</Badge>
                      </td>
                      <td className="py-2 px-3 text-xs" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex flex-col gap-0.5">
                          {e.voucherFileName ? (
                            <DocActions id={e.voucherId || e.id} kind="expense" fileName={e.voucherFileName} />
                          ) : e.payMethod === "现金" ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <span className="text-warn">缺购买</span>
                          )}
                          {e.payoutFileName ? (
                            <div className="flex items-center gap-1">
                              <DocActions id={e.payoutId || e.id} kind="payout" fileName={e.payoutFileName} />
                              {sib > 1 ? <span className="text-muted">·{sib}笔</span> : null}
                            </div>
                          ) : e.status === "已报销" && (e.payoutMethod || "转账") !== "现金" ? (
                            <span className="text-warn">缺打款</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-32 truncate py-2 px-3 text-xs text-muted">{e.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
              {shown.length ? (
                <tfoot>
                  <tr className="border-t-2 border-ink bg-bg-elevated text-sm font-medium">
                    <td className="py-2 px-3" colSpan={5}>
                      合计（{sumTip}）
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{money(totals.amount)}</td>
                    <td className="py-2 px-3 text-xs font-normal text-muted" colSpan={5}>
                      未报销 ¥{money(totals.open)}　已报销 ¥{money(totals.done)}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </WideTable>
        </div>
        <ExpenseSheets rows={printSingle ? [printSingle] : printRows} showVoucher={printVoucher} />
      </>
    </Need>
  );
}

function ExpenseEditor({
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
  const [c, setC] = React.useState(() => ({
    ...draft,
    payBank: draft.payBank || (!draft.payCardNo ? draft.payAccount : "") || "",
    payCardNo: draft.payCardNo || "",
    payoutDate: draft.status === "已报销" ? draft.payoutDate || "" : "",
  }));
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
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
          next.payoutDate = prev.payoutDate || todayYmd();
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
      payoutDate: c.status === "已报销" ? c.payoutDate || todayYmd() : "",
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6" onClick={onCancel}>
      <section
        id="expense-editor"
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
          <h2 className="font-semibold">{creating ? "新增报销" : c.name || "编辑报销"}</h2>
          <div className="btn-row">
            <Badge tone={c.status === "已报销" ? "ok" : "warn"}>{c.status}</Badge>
            <Button variant="outline" type="button" onClick={onCancel}>
              关闭
            </Button>
            {!creating ? (
              <Button variant="outline" type="button" onClick={() => onPrintSingle(c)}>
                打印报销单
              </Button>
            ) : null}
            {!creating ? (
              <Button variant="danger" type="button" onClick={onDelete}>
                删除
              </Button>
            ) : null}
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
                  payoutDate: c.status === "已报销" ? c.payoutDate || todayYmd() : "",
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
  const today = todayYmd();
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
              {[claimants.join("、") || "—", forWhoms.join("、") || "—", banks.join("、") || "—", cards.join("、") || "—"].map(
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

export const Route = createFileRoute("/expenses")({
  component: ExpensesPage,
});
