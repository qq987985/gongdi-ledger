import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, usePager, ThHint } from "~/components/wide-table";
import { Need } from "~/components/can";
import { ContractImport } from "~/components/excel-import";
import { ContractEditor } from "~/components/contract-editor";
import { useApp } from "~/lib/store";
import { contractRollup, emptyContract, CONTRACT_STATUSES } from "~/lib/contracts";

/** 完成类状态（绿） */
const CONTRACT_DONE = new Set(["完工", "结算完成", "结算已开票", "退质保金", "完成"]);

import { buildContractWorkbook } from "~/lib/excel";
import { money, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { round2 } from "~/lib/wage";
import { useGuardedClose } from "~/lib/confirm-close";
import type { ContractRecord, ContractEntry } from "~/lib/types";

function sortByDate(a: any, b: any) {
  return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 text-neutral-600">{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}

function MiniTable({ title, heads, rows, empty }: { title: string; heads: string[]; rows: any[][]; empty: string }) {
  return (
    <section className="mt-4 break-inside-avoid">
      <div className="text-sm font-semibold">{title}</div>
      {rows.length ? (
        <table className="mt-1 w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              {heads.map((h) => (
                <th key={h} className="border border-black px-1 py-1 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className={`border border-black px-1 py-1 ${j === r.length - 1 ? "text-left" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-1 text-xs">
          （{empty}）
        </p>
      )}
    </section>
  );
}

function ContractStatementSheets({ items }: { items: { contract: ContractRecord; entries: ContractEntry[] }[] }) {
  if (!items.length) return null;
  const today = localToday();
  return (
    <div className="print-only space-y-8 text-black">
      {items.map(({ contract: c, entries }) => {
        const roll = contractRollup(c, entries);
        const reportInclMode = c.reportTaxMode === "incl";
        const reportLabel = reportInclMode ? "含税金额" : "不含税金额";
        const reportVal = reportInclMode ? roll.reportIncl : roll.reportExcl;
        const reports = entries.filter((e) => e.kind === "report").slice().sort(sortByDate);
        const invoices = entries.filter((e) => e.kind === "invoice").slice().sort(sortByDate);
        const receipts = entries.filter((e) => e.kind === "receipt").slice().sort(sortByDate);
        return (
          <article key={c.id} className="statement break-inside-avoid border border-black p-4">
            <header className="border-b border-black pb-2 text-center">
              <div className="text-2xl font-semibold tracking-widest">合同对账单</div>
              <div className="mt-1 text-xs">
                {c.code} · {c.name}
              </div>
            </header>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="年份" value={c.year} />
              <Row label="项目号" value={c.code} />
              <Row label="项目名称" value={c.name} />
              <Row label="总包" value={c.contractor} />
              <Row label="分包" value={c.subcontractor} />
              <Row label="合同金额" value={`¥${money(c.contractAmount || 0)}`} />
              <Row label="税率" value={`${c.taxRate || 0}%`} />
              <Row label="付款比例" value={`${c.payRatio || 0}%`} />
              <Row label="质保" value={`${c.warrantyStart || "—"} 至 ${c.warrantyEnd || "—"}`} />
              <Row label="经理" value={c.manager} />
            </div>
            <MiniTable
              title={reportLabel}
              heads={["日期", reportLabel, "期次", "备注"]}
              rows={reports.map((e) => [e.date, money(e.amount), e.no || "", e.remark || ""])}
              empty="无报量"
            />
            <MiniTable
              title="开票"
              heads={["日期", "开票金额", "不含税", "税率", "发票号", "备注"]}
              rows={invoices.map((e) => [e.date, money(e.amount), money(e.amountExcl || 0), `${e.taxRate || 0}%`, e.no || "", e.remark || ""])}
              empty="无开票"
            />
            <MiniTable
              title="收款"
              heads={["日期", "金额", "类型", "备注"]}
              rows={receipts.map((e) => [e.date, money(e.amount), e.payTo === "worker" ? "代付农民工" : "到分包", e.remark || ""])}
              empty="无收款"
            />
            <div className="mt-4 space-y-1 text-sm">
              <div>
                <strong>{reportLabel}合计：</strong>¥{money(reportVal)}
              </div>
              <div>
                <strong>应收：</strong>¥{money(roll.payable)}
              </div>
              <div>
                <strong>开票合计：</strong>¥{money(roll.invoice)}（不含税¥{money(roll.invoiceExcl)}）
              </div>
              <div>
                <strong>已付：</strong>¥{money(roll.receipt)}（代付¥{money(roll.workerPay)} + 到分包¥{money(roll.subPay)}）
              </div>
              <div>
                <strong>合同未付：</strong>¥{money(roll.dueRemain)}
              </div>
              <div>
                <strong>剩余款：</strong>¥{money(roll.remain)}
              </div>
            </div>
            <p className="mt-4 text-right text-xs">打印日期 {today}</p>
          </article>
        );
      })}
    </div>
  );
}

function ContractsPage() {
  const { year, contracts, contractEntries, upsertContract, removeContracts, addContractEntry, removeContractEntries } = useApp();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [scope, setScope] = React.useState("year");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<ContractRecord | null>(null);
  const [creating, setCreating] = React.useState(false);
  const list = React.useMemo(() => {
    let rows = contracts;
    if (scope === "year") rows = rows.filter((c) => c.year === year);
    if (status !== "all") rows = rows.filter((c) => c.status === status);
    if (q.trim()) {
      const s = q.trim();
      rows = rows.filter((c) => [c.name, c.code, c.contractor, c.subcontractor, c.manager].some((x) => x.includes(s)));
    }
    return rows.slice().sort((a, b) => a.year - b.year || a.code.localeCompare(b.code) || a.name.localeCompare(b.name));
  }, [contracts, year, scope, status, q]);
  const pager = usePager("contracts", list, [scope, status, q, year].join("|"));
  const pageRows = pager.rows;
  const allChecked = pageRows.length > 0 && pageRows.every((c) => selected.includes(c.id));
  const totals = list.reduce(
    (acc, c) => {
      const r = contractRollup(c, contractEntries);
      acc.amount += c.contractAmount || 0;
      acc.report += r.report;
      acc.reportIncl += r.reportIncl;
      acc.reportExcl += r.reportExcl;
      acc.invoice += r.invoice;
      acc.invoiceExcl += r.invoiceExcl;
      acc.receipt += r.receipt;
      acc.workerPay += r.workerPay;
      acc.subPay += r.subPay;
      acc.remain += r.remain;
      acc.payable += r.payable;
      acc.dueRemain += r.dueRemain;
      return acc;
    },
    {
      amount: 0,
      report: 0,
      reportIncl: 0,
      reportExcl: 0,
      invoice: 0,
      invoiceExcl: 0,
      receipt: 0,
      workerPay: 0,
      subPay: 0,
      remain: 0,
      payable: 0,
      dueRemain: 0,
    },
  );
  function dropIds(ids: string[]) {
    if (!ids.length) return;
    if (!confirmBatchDelete("合同", ids.length, "会同时删掉这些合同的报量、开票、收款流水。考勤人员不受影响。")) return;
    removeContracts(ids);
    setSelected((s) => s.filter((id) => !ids.includes(id)));
    if (editing && ids.includes(editing.id)) {
      setEditing(null);
      setCreating(false);
    }
    toast.success("已删除合同");
  }
  const printItems = React.useMemo(() => {
    return (selected.length ? selected : editing && !creating ? [editing.id] : [])
      .map((id) => contracts.find((c) => c.id === id))
      .filter((c): c is ContractRecord => Boolean(c))
      .map((contract) => ({
        contract,
        entries: contractEntries.filter((e) => e.contractId === contract.id),
      }));
  }, [selected, editing, creating, contracts, contractEntries]);
  React.useEffect(() => {
    if (!editing) return;
    const t = window.setTimeout(() => document.getElementById("contract-scan")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    return () => window.clearTimeout(t);
  }, [editing?.id]);
  function printStatement() {
    if (!printItems.length) {
      toast.error("先点开一个合同，或勾选要打印的合同");
      return;
    }
    window.print();
  }
  return (
    <Need perm="contracts.view">
      <>
        <div className="no-print space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">合同管理</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                点表格里的合同名称，页面滚到下方，<strong>保存合同信息正下方有虚线框「合同电子版」</strong>。有文件就是有合同，没传就是无合同；原因写在备注里。报量可选<strong>含税</strong>或<strong>不含税</strong>。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft" href="/api/file/contract-export">
                导出合同表
              </a>
              <ContractImport />
              <Button
                type="button"
                onClick={async () => {
                  const { writeCenteredXlsx } = await import("~/lib/xlsx-center");
                  const buf = await writeCenteredXlsx(buildContractWorkbook({ contracts, entries: contractEntries }));
                  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `合同台账-${year}.xlsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("已生成合同台账 Excel");
                }}
              >
                导出对账表
              </Button>
              <Button type="button" variant="outline" onClick={printStatement}>
                打印对账单{printItems.length ? `（${printItems.length}）` : ""}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setEditing(emptyContract(year));
                }}
              >
                <Plus className="size-4" /> 新增合同
              </Button>
            </div>
          </header>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
            <label className="text-sm">
              <span className="text-xs text-muted">年份</span>
              <select className="field-select mt-1 w-auto" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="year">{year}年</option>
                <option value="all">全部年份</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-xs text-muted">状态</span>
              <select className="field-select mt-1 w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">全部</option>
                {CONTRACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-48 flex-1 text-sm">
              <span className="text-xs text-muted">搜索</span>
              <Input className="mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="项目号 / 项目名称 / 总包 / 分包 / 经理" />
            </label>
            {selected.length ? (
              <Button variant="danger" type="button" onClick={() => dropIds(selected)}>
                删除所选（{selected.length}）
              </Button>
            ) : null}
          </div>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
            <Mini label="合同金额" value={totals.amount} />
            <Mini label="报量金额" value={totals.report} />
            <Mini label="应收" hint="含税报量×比例" value={totals.payable} />
            <Mini label="开票金额" value={totals.invoice} />
            <Mini label="已付" hint="代付+到分包" value={totals.receipt} />
            <Mini label="合同未付" hint="应收−已付" value={totals.dueRemain} />
            <Mini label="剩余款" hint="开票金额−已付" value={totals.remain} />
          </section>
          {editing ? (
            <ContractEditor
              draft={editing}
              creating={creating}
              entries={contractEntries.filter((e) => e.contractId === editing.id)}
              onCancel={() => {
                setEditing(null);
                setCreating(false);
              }}
              onSave={(c) => {
                upsertContract(c);
                setEditing(c);
                setCreating(false);
                toast.success("合同已保存");
              }}
              onAddEntry={(e) => addContractEntry(e)}
              onRemoveEntries={removeContractEntries}
              onDelete={() => {
                if (!confirmBatchDelete("合同", 1, `将删除 ${editing.name} 的合同及所有报量、发票、收款记录。`)) return;
                dropIds([editing.id]);
                setEditing(null);
                setCreating(false);
              }}
            />
          ) : null}
          <WideTable id="contracts" pager={pager as any}>
            <table className="wide-table text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="w-10 p-3">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={allChecked}
                      onChange={(e) => {
                        const ids = pageRows.map((c) => c.id);
                        setSelected((s) => (e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id))));
                      }}
                      aria-label="全选合同"
                    />
                  </th>
                  <th className="p-3">操作</th>
                  <th className="sticky left-0 z-10 bg-bg-elevated p-3">序号</th>
                  <th className="p-3">年份</th>
                  <th className="p-3">项目号</th>
                  <th className="sticky left-14 z-10 bg-bg-elevated p-3 shadow-[2px_0_0_var(--color-line)]">项目名称</th>
                  <th className="min-w-[5.5rem] whitespace-nowrap p-3">扫描件</th>
                  <th className="p-3">总包</th>
                  <th className="p-3">分包</th>
                  <th className="p-3">合同金额</th>
                  <th className="p-3">税率</th>
                  <th className="p-3">报量计税</th>
                  <th className="p-3">报量金额</th>
                  <th className="p-3">付款比例</th>
                  <ThHint hint="含税报量×比例">应收</ThHint>
                  <th className="p-3">开票金额</th>
                  <ThHint hint="代付+到分包">已付</ThHint>
                  <th className="p-3">合同未付</th>
                  <th className="p-3">剩余款</th>
                  <th className="p-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="py-8 text-center text-sm text-muted">
                      还没有合同。点右上角「新增合同」，或在 Excel 导入后刷新。
                    </td>
                  </tr>
                ) : null}
                {pageRows.map((c: ContractRecord, i: number) => {
                  const r = contractRollup(c, contractEntries);
                  const on = editing?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={`group border-b border-line last:border-0 hover:bg-accent-soft ${on || selected.includes(c.id) ? "bg-accent-soft" : ""}`}
                      onClick={() => setSelected((s) => toggleSel(s, c.id, !s.includes(c.id)))}
                    >
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={selected.includes(c.id)}
                          onChange={(e) => setSelected((s) => toggleSel(s, c.id, e.target.checked))}
                          aria-label={`选择 ${c.name}`}
                        />
                      </td>
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            setCreating(false);
                            setEditing(c);
                          }}
                        >
                          编辑
                        </Button>
                      </td>
                      <td className="sticky left-0 z-10 bg-surface p-2 tabular-nums text-muted">{(pager.page - 1) * pager.size + i + 1}</td>
                      <td className="p-2">{c.year}</td>
                      <td className="p-2">{c.code}</td>
                      <td className="sticky left-14 z-10 bg-surface p-2">
                        <button
                          type="button"
                          className="text-left font-medium hover:text-accent"
                          onClick={() => {
                            setCreating(false);
                            setEditing(c);
                          }}
                        >
                          {c.name}
                        </button>
                        {c.remark ? <div className="text-[11px] text-muted">{c.remark}</div> : null}
                      </td>
                      <td className="p-2 text-center">
                        {c.scanFileName ? <Badge tone="ok">有</Badge> : <Badge>无</Badge>}
                      </td>
                      <td className="p-2">{c.contractor}</td>
                      <td className="p-2">{c.subcontractor}</td>
                      <td className="p-2 text-right tabular-nums">{money(c.contractAmount)}</td>
                      <td className="p-2 text-right tabular-nums">{c.taxRate}%</td>
                      <td className="p-2">{c.reportTaxMode === "incl" ? "含税" : "不含税"}</td>
                      <td className="p-2 text-right tabular-nums">
                        {c.reportTaxMode === "incl" ? money(r.reportIncl) : money(r.reportExcl)}
                      </td>
                      <td className="p-2 text-right tabular-nums">{c.payRatio}%</td>
                      <td className="p-2 text-right tabular-nums">{money(r.payable)}</td>
                      <td className="p-2 text-right tabular-nums">{money(r.invoice)}</td>
                      <td className="p-2 text-right tabular-nums">{money(r.receipt)}</td>
                      <td className="p-2 text-right tabular-nums">{money(r.dueRemain)}</td>
                      <td className="p-2 text-right tabular-nums">{money(r.remain)}</td>
                      <td className="p-2">
                        <Badge tone={CONTRACT_DONE.has(c.status) ? "ok" : "warn"}>
                          {CONTRACT_STATUSES.find((s) => s === c.status) || c.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {list.length ? (
                <tfoot>
                  <tr className="border-t-2 border-ink bg-bg-elevated text-sm font-medium">
                    <td className="p-2" colSpan={9}>
                      合计（{sumTip(list.length)}）
                    </td>
                    <td className="p-2 text-right tabular-nums">{money(totals.amount)}</td>
                    <td className="p-2" colSpan={2} />
                    <td className="p-2 text-right tabular-nums">
                      <div>
                        {money(totals.reportIncl)} <span className="text-xs text-muted">含税</span>
                      </div>
                      <div className="text-xs text-muted">不含税 {money(totals.reportExcl)}</div>
                    </td>
                    <td className="p-2" />
                    <td className="p-2 text-right tabular-nums">{money(totals.payable)}</td>
                    <td className="p-2 text-right tabular-nums">{money(totals.invoice)}</td>
                    <td className="p-2 text-right tabular-nums">{money(totals.receipt)}</td>
                    <td className="p-2 text-right tabular-nums">{money(totals.dueRemain)}</td>
                    <td className="p-2 text-right tabular-nums">{money(totals.remain)}</td>
                    <td className="p-2" />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </WideTable>
        </div>
        <ContractStatementSheets items={printItems} />
      </>
    </Need>
  );
}

function sumTip(n: number) {
  return `本表 ${n} 笔`;
}

function Mini({ label, hint, value }: { label: string; hint?: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      {hint ? <div className="text-[10px] text-subtle">{hint}</div> : null}
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">¥{money(value)}</div>
    </div>
  );
}


export const Route = createFileRoute("/contracts")({
  component: ContractsPage,
});
