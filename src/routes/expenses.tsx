import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, usePager } from "~/components/wide-table";
import { Need, ReadonlyNotice, useCanSave } from "~/components/can";
import { ExpenseImport, TplLink } from "~/components/excel-import";
import { DocActions } from "~/components/doc-actions";
import { ExpensePayoutEditor } from "~/components/expense-payout-editor";
import { ExpensePayoutList } from "~/components/expense-payout-list";
import { useExpensePayout } from "~/components/use-expense-payout";
import { expensePayoutBatches } from "~/lib/expense-payout";
import { ledgerContextSnapshot } from "~/lib/nas-sync";
import { ExpenseEditor } from "~/components/expense-editor";
import { useApp } from "~/lib/store";
import { money, formatCardNo, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { permLabel } from "~/lib/perms";
import { blockedWrite } from "~/lib/readonly";
import { ALL_BUCKETS } from "~/lib/buckets";
import { claimantBuckets, expensePrintRows, expenseTotals, filterExpenses } from "~/lib/expenses-stats";

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
function accountParts(e: any) {
  const name = (e.forWhom || "").trim();
  const bank = (e.payBank || "").trim();
  const card = (e.payCardNo || "").trim();
  if (!name && !bank && !card) return null;
  return { name, bank, card };
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
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [claimant, setClaimant] = React.useState(ALL_BUCKETS);
  const [scope, setScope] = React.useState("year");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [view, setView] = React.useState<"details" | "batches">("details");
  const [editingContext, setEditingContext] = React.useState<string | null>(null);
  const [editingKey, setEditingKey] = React.useState("");
  const editingKeyRef = React.useRef("");
  const clearSelection = React.useCallback(() => setSelected([]), []);
  const payout = useExpensePayout(clearSelection);
  React.useEffect(() => {
    setSelected([]); setEditing(null); setCreating(false); editingKeyRef.current = "";
  }, [payout.context]);
  function startEditing(row: any, isNew: boolean) {
    if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return;
    const scope = ledgerContextSnapshot();
    if (scope === null) { toast.error("台账正在读取，请稍后编辑"); return; }
    const key = uid(); editingKeyRef.current = key; setEditingKey(key);
    setEditingContext(scope); setCreating(isNew); setEditing(row);
  }
  // 只读账号：新增/编辑/保存/删除/批量挂账入口一律拦（A 组报告第 17 项同源）
  const canEditExpense = useCanSave("expenses.edit");
  const [printStatus, setPrintStatus] = React.useState("未报销");
  const [printVoucher, setPrintVoucher] = React.useState(false);
  const [printSingle, setPrintSingle] = React.useState<any | null>(null);
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
  const batchTotal = expenseTotals(batchRows).amount;
  const shownIds = new Set(shown.map((row) => row.id));
  const batches = React.useMemo(() => expensePayoutBatches(list), [list]);
  const visibleBatches = batches.filter((batch) => batch.rows.some((row) => shownIds.has(row.id)));
  const pending = shown.filter((row) => row.status === "未报销" && !row.payoutId);
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
  return (
    <Need perm="expenses.view">
      <>
        <div className="no-print space-y-5">
          <ReadonlyNotice perm="expenses.edit" />
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">报销单</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                费用明细各自保留；多笔一起收款，在“收款批次”统一核对、登记和解除合并。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={!canEditExpense || payout.context === null || payout.busy} onClick={() => payout.open([])}>登记收款</Button>
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
                  startEditing(emptyExpense(year), true);
                }}
              >
                <Plus className="size-4" /> 新增报销
              </Button>
            </div>
          </header>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-line bg-bg-elevated p-1" aria-label="报销查看方式">
              <Button type="button" variant={view === "details" ? "default" : "ghost"} aria-pressed={view === "details"} onClick={() => { setView("details"); setSelected([]); }}>报销明细</Button>
              <Button type="button" variant={view === "batches" ? "default" : "ghost"} aria-pressed={view === "batches"} onClick={() => { setView("batches"); setSelected([]); }}>收款批次</Button>
            </div>
            {payout.undo && canEditExpense ? <Button type="button" variant="outline" size="sm" disabled={payout.busy} onClick={() => void payout.restoreLast()}>撤销上次批次操作</Button> : null}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <select aria-label="报销年份范围" className="field-select w-auto" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="year">{year}年</option>
              <option value="all">全部年份</option>
            </select>
            <select aria-label="报销状态筛选" className="field-select w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">全部状态</option>
              <option value="未报销">未报销</option>
              <option value="已报销">已报销</option>
            </select>
            <select aria-label="报销人筛选" className="field-select w-auto" value={claimant} onChange={(e) => setClaimant(e.target.value)}>
              <option value={ALL_BUCKETS}>全部报销人</option>
              {claimantOpts.map((b) => (
                <option value={b.value} key={b.value}>
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
          {view === "details" ? <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!pending.length} onClick={() => setSelected(pending.map((row) => row.id))}>全选待收款（{pending.length}笔）</Button>
            <span className="text-xs text-muted">选择当前筛选下全部未报销、未分批的费用，可跨页办理。</span>
          </div> : null}
          {selected.length && view === "details" ? <section aria-label="报销选择操作" className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-surface p-3 shadow-panel md:sticky md:inset-x-auto md:bottom-auto md:top-3">
            <div><p className="text-sm font-semibold">已选 {batchRows.length} 笔 · ¥{money(batchTotal)}</p>{batchRows.some((row) => !shownIds.has(row.id)) ? <p className="mt-1 text-xs text-warn">包含当前筛选外的已选明细，办理前请核对完整清单。</p> : null}</div>
            <div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" size="sm" disabled={payout.busy} onClick={() => setSelected([])}>清空选择</Button><Button type="button" size="sm" disabled={!canEditExpense || payout.busy || payout.context === null} onClick={() => payout.open(selected)}>办理所选（{batchRows.length}笔）</Button></div>
          </section> : null}
          {payout.session ? <ExpensePayoutEditor key={payout.session.key} session={payout.session} canEdit={canEditExpense} busy={payout.busy} onClose={payout.close} onSave={payout.save} onDissolve={payout.dissolve} /> : null}
          {editing ? (
            <ExpenseEditor
              key={editingKey}
              draft={editing}
              isCurrent={() => editingKeyRef.current === editingKey && ledgerContextSnapshot() === editingContext}
              onManagePayout={(id) => { editingKeyRef.current = ""; setEditing(null); setCreating(false); payout.open([id]); }}
              creating={creating}
              all={list}
              selectedIds={selected}
              names={names}
              onCancel={() => {
                editingKeyRef.current = "";
                setEditing(null);
                setCreating(false);
              }}
              onSave={(row: any) => {
                if (blockedWrite("expenses.edit", permLabel("expenses.edit"))) return false;
                if (editingKeyRef.current !== editingKey || ledgerContextSnapshot() !== editingContext) { toast.error("台账或编辑对象已改变，请重新打开，旧内容没有写入。"); return false; }
                upsertExpense(row);
                if (row.id === editing.id) { setEditing(row); setCreating(false); }
                toast.success("报销已在本机保存，正在同步");
                return true;
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
          {view === "batches" ? <ExpensePayoutList batches={visibleBatches} shownIds={shownIds} onOpen={(id) => payout.open([], id)} /> : <WideTable id="expenses" pager={pager as any}>
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
                            startEditing(e, false);
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
                        <div className="space-y-1"><Badge tone={e.status === "已报销" ? "ok" : "warn"}>{e.status}</Badge>{e.payoutId ? <button type="button" className="block text-xs text-accent underline underline-offset-2" onClick={(event) => { event.stopPropagation(); payout.open([], e.payoutId); }}>查看同批（{sib}笔）</button> : <span className="block text-xs text-muted">未分批</span>}</div>
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
          </WideTable>}
          {selected.length ? <div aria-hidden="true" className="h-32 md:hidden" /> : null}
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
  const columnWidths = showVoucher ? [9, 27, 18, 17, 17, 12] : [9, 33, 18, 17, 23];
  const emptyCells = showVoucher ? 2 : 1;
  /** 报销单抬头（1.8.11）：写进表头第一行，跨页时第 2 页顶上也会重复（原来只印在第 1 页） */
  const identity = [
    `报销人：${claimants.join("、") || "—"}`,
    `收款人：${forWhoms.join("、") || "—"}`,
    `开户行：${banks.join("、") || "—"}`,
    `打款账户：${cards.map(formatCardNo).join("、") || "—"}`,
  ].join(" · ");
  return (
    <div className="print-only space-y-8 text-black">
      <article className="statement expense-statement border border-black p-4">
        <header className="border-b border-black pb-2 text-center">
          <div className="text-2xl font-semibold tracking-widest">报销单</div>
        </header>
        <table className="mt-2 w-full border-collapse text-center text-xs">
          <colgroup>
            {columnWidths.map((width, i) => <col key={i} style={{ width: `${width}%` }} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="border border-black px-1 py-1 text-left font-medium" colSpan={cols.length}>
                {identity}
              </th>
            </tr>
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
