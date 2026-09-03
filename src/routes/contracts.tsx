import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, PageBar, usePager, ThHint } from "~/components/wide-table";
import { Need } from "~/components/can";
import { FilePick } from "~/components/file-pick";
import { ContractImport } from "~/components/excel-import";
import { DocActions, prepareNamedFile, setDoc, removeDoc, invoiceBase, reportBase, receiptSubBase, receiptWorkerBase } from "~/components/doc-actions";
import { useApp } from "~/lib/store";
import { emptyContract, contractRollup, splitTax, normalizeEntry, CONTRACT_STATUSES } from "~/lib/contracts";
import { buildContractWorkbook } from "~/lib/excel";
import { money, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
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
    <section className="mt-4">
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
  const today = new Date().toISOString().slice(0, 10);
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
          <article key={c.id} className="statement border border-black p-4">
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
                  const wb = buildContractWorkbook({ contracts, entries: contractEntries });
                  const buf = await wb.xlsx.writeBuffer();
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
                  <option key={s.id} value={s.id}>
                    {s.label}
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
                    <td colSpan={20} className="p-6 text-muted">
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
                        <Badge tone={c.status === "finished" ? "ok" : c.status === "aborted" ? "danger" : "warn"}>
                          {CONTRACT_STATUSES.find((s) => s.id === c.status)?.label || c.status}
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
                      {totals.reportIncl ? money(totals.reportIncl) : money(totals.reportExcl)}
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

function ContractEditor({
  draft,
  creating,
  entries,
  onCancel,
  onSave,
  onDelete,
  onAddEntry,
  onRemoveEntries,
}: {
  draft: ContractRecord;
  creating: boolean;
  entries: ContractEntry[];
  onCancel: () => void;
  onSave: (c: ContractRecord) => void;
  onDelete?: () => void;
  onAddEntry: (e: ContractEntry) => void;
  onRemoveEntries: (ids: string[]) => void;
}) {
  const [c, setC] = React.useState(draft);
  const roll = contractRollup(c, entries);
  function patch(key: keyof ContractRecord, value: any) {
    setC((prev) => ({ ...prev, [key]: value }));
  }
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6" onClick={onCancel}>
      <section
        id="contract-editor"
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-5 shadow-panel md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
          <h2 className="font-semibold">{creating ? "新增合同" : c.name || "编辑合同"}</h2>
          <div className="btn-row">
            {c.scanFileName ? <Badge tone="ok">有合同</Badge> : <Badge>无合同</Badge>}
            <Button variant="outline" type="button" onClick={onCancel}>
              关闭
            </Button>
            {!creating ? (
              <Button variant="outline" type="button" onClick={() => window.print()}>
                打印对账单
              </Button>
            ) : null}
            {!creating ? (
              <Button variant="danger" type="button" onClick={() => onDelete?.()}>
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
                onSave(c);
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
                <option value={s.id} key={s.id}>
                  {s.label}
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
            const next = { ...c, scanFileName: name };
            setC(next);
            onSave(next);
          }}
        />
        <div className="grid gap-4 xl:grid-cols-3">
          <ReportBook
            contract={c}
            entries={entries.filter((e) => e.kind === "report")}
            disabled={creating}
            onAdd={onAddEntry}
            onRemove={onRemoveEntries}
          />
          <InvoiceBook
            contract={c}
            entries={entries.filter((e) => e.kind === "invoice")}
            disabled={creating}
            onAdd={onAddEntry}
            onRemove={onRemoveEntries}
          />
          <ReceiptBook
            contract={c}
            entries={entries.filter((e) => e.kind === "receipt")}
            disabled={creating}
            onAdd={onAddEntry}
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
  return [...entries.map((e) => e.fileName), ...(docs || []).map((d) => d.fileName)].filter(Boolean);
}

function ReportBook({
  contract,
  entries,
  disabled,
  onAdd,
  onRemove,
}: {
  contract: ContractRecord;
  entries: ContractEntry[];
  disabled: boolean;
  onAdd: (e: ContractEntry) => void;
  onRemove: (ids: string[]) => void;
}) {
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = React.useState(0);
  const [no, setNo] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const taken = useTakenNames();
  const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
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
        <Button
          size="sm"
          className="w-full"
          disabled={disabled || !amount}
          type="button"
          onClick={async () => {
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
          }}
        >
          记一笔报量
        </Button>
      </div>
      <EntryRows
        entries={entries}
        title="报量"
        onRemove={onRemove}
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
  onRemove,
}: {
  contract: ContractRecord;
  entries: ContractEntry[];
  disabled: boolean;
  onAdd: (e: ContractEntry) => void;
  onRemove: (ids: string[]) => void;
}) {
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [incl, setIncl] = React.useState(0);
  const [excl, setExcl] = React.useState(0);
  const [rate, setRate] = React.useState(contract.taxRate || 9);
  const [no, setNo] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const taken = useTakenNames();
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
        <Button
          size="sm"
          className="w-full"
          disabled={disabled || !incl}
          type="button"
          onClick={async () => {
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
          }}
        >
          记一张发票
        </Button>
      </div>
      <EntryRows
        entries={entries}
        title="发票"
        onRemove={onRemove}
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
  onRemove,
}: {
  contract: ContractRecord;
  entries: ContractEntry[];
  disabled: boolean;
  onAdd: (e: ContractEntry) => void;
  onRemove: (ids: string[]) => void;
}) {
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = React.useState(0);
  const [payTo, setPayTo] = React.useState("sub");
  const [no, setNo] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [file, setFile] = React.useState<File>();
  const taken = useTakenNames();
  const workers = entries.filter((e) => e.payTo === "worker").reduce((s, e) => s + (e.amount || 0), 0);
  const subs = entries.filter((e) => e.payTo !== "worker").reduce((s, e) => s + (e.amount || 0), 0);
  const base = payTo === "worker" ? receiptWorkerBase(contract.name, date) : receiptSubBase(contract.name, date);
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
        <select className="field-select w-full" value={payTo} onChange={(e) => setPayTo(e.target.value)} disabled={disabled}>
          <option value="sub">到分包</option>
          <option value="worker">代付农民工</option>
        </select>
        <Input value={no} onChange={(e) => setNo(e.target.value)} disabled={disabled} placeholder="银行回单号" />
        <Input value={remark} onChange={(e) => setRemark(e.target.value)} disabled={disabled} placeholder="备注" />
        <DocPick label="收款回单" fileName={file?.name} disabled={disabled} onFile={setFile} />
        <Button
          size="sm"
          className="w-full"
          disabled={disabled || !amount}
          type="button"
          onClick={async () => {
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
          }}
        >
          记一笔收款
        </Button>
      </div>
      <EntryRows
        entries={entries}
        title="收款"
        onRemove={onRemove}
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

function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
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
  render,
}: {
  entries: ContractEntry[];
  title: string;
  onRemove: (ids: string[]) => void;
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
  const taken = (scans || []).map((c) => c.scanFileName).filter(Boolean);
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

export const Route = createFileRoute("/contracts")({
  component: ContractsPage,
});
