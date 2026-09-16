import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, usePager } from "~/components/wide-table";
import { Need, ReadonlyNotice, useCanSave } from "~/components/can";
import { ExpenseImport, TplLink } from "~/components/excel-import";
import { DocActions, prepareNamedFile, setDoc } from "~/components/doc-actions";
import { ExpenseEditor } from "~/components/expense-editor";
import {
  applyPayee,
  Field,
  formatPayAccount,
  NameInput,
  needsVoucher,
  PAY_METHODS,
  payoutBase,
  VoucherSlot,
  voucherBase,
} from "~/components/expense-bits";
import { useApp } from "~/lib/store";
import { money, formatCardNo, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { round2 } from "~/lib/wage";
import { permLabel } from "~/lib/perms";
import { blockedWrite } from "~/lib/readonly";
import { ALL_BUCKETS } from "~/lib/buckets";
import { claimantBuckets, expensePrintRows, expenseTotals, filterExpenses } from "~/lib/expenses-stats";
import { useGuardedClose } from "~/lib/confirm-close";

function emptyExpense(year: number): any {
  const today = localToday();
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
function uniqueNames(people: any[], expenses: any[]) {
  const s = new Set<string>();
  for (const p of people || []) if (p.name) s.add(p.name);
  for (const e of expenses || []) {
    if (e.claimant) s.add(e.claimant);
  }
  return [...s];
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
function Mini({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      {hint ? <div className="text-[10px] text-subtle">{hint}</div> : null}
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">¥{money(value)}</div>
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
  const [claimant, setClaimant] = React.useState(ALL_BUCKETS);
  const [scope, setScope] = React.useState("year");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [creating, setCreating] = React.useState(false);
  // 只读账号：新增/编辑/保存/删除/批量挂账入口一律拦（A 组报告第 17 项同源）
  const canEditExpense = useCanSave("expenses.edit");
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
    const same = (k: keyof typeof batch) => rows.every((e: any) => (e[k] || "") === ((first as any)[k] || ""));
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
  const shown = React.useMemo(
    () => filterExpenses(list, { scope: scope as "year" | "all", year, status, claimant, q }),
    [list, year, scope, status, claimant, q],
  );
  const pager = usePager("expenses", shown, [scope, status, claimant, q, year].join("|"));
  const pageRows = pager.rows;
  // 报销人下拉 = 当前范围（年份/状态/搜索）里真实存在的桶 + 「未填报销人」；
  // 以前从所有年份取且丢掉空值桶：既会出现选了 0 行的死选项，又选不到没填报销人的记录
  const claimantOpts = React.useMemo(
    () => claimantBuckets(filterExpenses(list, { scope: scope as "year" | "all", year, status, claimant: ALL_BUCKETS, q })),
    [list, scope, year, status, q],
  );
  const allChecked = pageRows.length > 0 && pageRows.every((e: any) => selected.includes(e.id));
  const picked = shown.filter((e: any) => selected.includes(e.id));
  const sumRows = picked.length ? picked : shown;
  const totals = expenseTotals(sumRows);
  const sumTip = picked.length ? `已选 ${picked.length} 笔` : `本表 ${shown.length} 笔`;
  const printRows = React.useMemo(
    () => expensePrintRows({ list, selected, shown, printStatus }),
    [list, selected, shown, printStatus],
  );
  const batchRows = list.filter((e: any) => selected.includes(e.id));
  const batchTotal = round2(batchRows.reduce((s, e: any) => s + (e.amount || 0), 0));
  const anyHung = batchRows.some((e: any) => e.payoutId);
  const anyDone = batchRows.some((e: any) => e.status === "已报销");
  function del(ids: string[]) {
    if (!ids.length) return;
    if (blockedWrite("expenses.delete", permLabel("expenses.delete"))) return;
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
    if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
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
    const day = markDone ? batch.payoutDate || localToday() : "";
    for (const e of batchRows) {
      // 打款凭证按 (payoutId, payout) 存；换新 pid 时旧文件名不能再引用（否则找不到文件）
      const keepFile = batch.payoutFileName || (batch.payoutId && batch.payoutId === e.payoutId ? e.payoutFileName : "");
      saveOne(e, {
        claimant: batch.claimant.trim(),
        forWhom: (batch.forWhom || e.forWhom).trim(),
        payBank: batch.payBank.trim(),
        payCardNo: batch.payCardNo.trim(),
        payAccount: acc,
        payoutMethod: batch.payoutMethod || "转账",
        payoutDate: markDone ? day : e.status === "已报销" ? e.payoutDate : "",
        payoutId: pid,
        payoutFileName: keepFile,
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
    if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
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
    if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
    if (!confirm(`把这 ${batchRows.length} 笔标为未报销？\n\n会同时取消打款挂账和打款日期。`)) return;
    for (const e of batchRows) saveOne(e, { status: "未报销", payoutDate: "", reimbursedAt: "", payoutId: "", payoutFileName: "" });
    toast.success(`已把 ${batchRows.length} 笔标为未报销`);
  }
  async function uploadPayout(file: File) {
    if (!file) return;
    if (!batchRows.length) {
      toast.error("先勾选要一起报销的几笔");
      return;
    }
    if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
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
          <ReadonlyNotice perm="expenses.edit" />
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
                disabled={!canEditExpense}
                title={canEditExpense ? undefined : `你是只读账号（缺「${permLabel("expenses.edit")}」权限），改动不会保存。`}
                onClick={() => {
                  if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
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
              <option value={ALL_BUCKETS}>全部报销人</option>
              {claimantOpts.map((b) => (
                <option value={b.value} key={b.value || "__empty__"}>
                  {b.label}
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
                if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
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
                    <td colSpan={11} className="py-8 text-center text-sm text-muted">
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
                          disabled={!canEditExpense}
                          title={canEditExpense ? undefined : `你是只读账号（缺「${permLabel("expenses.edit")}」权限），改动不会保存。`}
                          onClick={() => {
                            if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
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

export const Route = createFileRoute("/expenses")({
  component: ExpensesPage,
});
