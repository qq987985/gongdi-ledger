import * as React from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, usePager } from "~/components/wide-table";
import { Need, ReadonlyNotice, useCanSave } from "~/components/can";
import { PaymentImport, TplLink } from "~/components/excel-import";
import { YmPick, ymKey, monthsInRange, rangeLabel } from "~/components/ym-pick";
import { useApp } from "~/lib/store";
import { dateYear, derivedYears, parseDateYmd, localToday } from "~/lib/dates";
import { money, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import { permLabel } from "~/lib/perms";
import { blockedWrite } from "~/lib/readonly";
import { useGuardedClose } from "~/lib/confirm-close";
import { ALL_BUCKETS } from "~/lib/buckets";
import { round2 } from "~/lib/wage";
import {
  PROXY_INLINE_LABEL,
  panelRows,
  detailSections,
  filterPayments,
  paymentSummary,
  paymentsInRange,
  printOwnerBuckets,
  printSummary,
  printTotals,
  ownerTotals,
  scopeRows,
  sectionTotals,
  sourceBuckets,
  isProxyReceiver,
  receiverOf,
} from "~/lib/payments-stats";
import { PaymentSheets } from "~/components/payment-sheets";
// B15（1.8.15）：批量「按应发生成待发放」的应发口径、跳过判据、落盘记录全在 lib/pending-batch.ts
// （页面**不许**自己算应发：那是总览 KPI / 考勤页年度表同一份计算，两处算法必然分叉）
import { pendingPaymentsOf, planPendingBatch, planSkipNote } from "~/lib/pending-batch";
import type { Payment } from "~/lib/types";

function emptyPayment(): Payment {
  return { id: "", owner: "", receiver: "", date: "", amount: 0, source: "", remark: "" };
}

function PaymentsPage() {
  const store = useApp();
  const { year, people, payments, addPayment, addPayments, patchPayments, removePayments } = store;
  const names = people.map((p) => p.name);
  const years = derivedYears(store);
  const [q, setQ] = React.useState("");
  const [fromY, setFromY] = React.useState(year);
  const [fromM, setFromM] = React.useState(1);
  const [toY, setToY] = React.useState(year);
  const [toM, setToM] = React.useState(12);
  const [status, setStatus] = React.useState<"all" | "pending" | "paid">("all");
  const [batch, setBatch] = React.useState(ALL_BUCKETS);
  const [printOwner, setPrintOwner] = React.useState(ALL_BUCKETS);
  const [printMode, setPrintMode] = React.useState<"detail" | "summary">("detail");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<Payment | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [fillDate, setFillDate] = React.useState(() => localToday());
  /** B15：批量「按应发生成待发放」的预览弹窗 */
  const [pendingOpen, setPendingOpen] = React.useState(false);
  // 只读账号：编辑/新增/删除/保存入口一律拦在入口（A 组报告第 17 项同源）
  const canEditPay = useCanSave("payments.edit");
  const yearOpts = React.useMemo(() => {
    const set = new Set([...years, year, fromY, toY]);
    for (const p of payments) {
      const y = dateYear(p.date);
      if (y) set.add(y);
    }
    return [...set].sort((a, b) => a - b);
  }, [years, year, fromY, toY, payments]);
  const span = React.useMemo(() => monthsInRange(fromY, fromM, toY, toM), [fromY, fromM, toY, toM]);
  const lo = ymKey(span[0].year, span[0].month);
  const hi = ymKey(span[span.length - 1].year, span[span.length - 1].month);
  const label = rangeLabel(fromY, fromM, toY, toM);
  // 区间 / 状态+发放方+搜索 / 汇总 / 分组 / 下拉 / 打印 全部走 src/lib/payments-stats.ts 一套口径
  const ranged = React.useMemo(() => paymentsInRange(payments, lo, hi), [payments, lo, hi]);
  const batches = React.useMemo(() => sourceBuckets(ranged), [ranged]);
  const filtered = React.useMemo(() => filterPayments(ranged, { status, source: batch, q }), [ranged, batch, q, status]);
  const pager = usePager("payments", filtered, [status, batch, q, lo, hi].join("|"));
  const pageRows = pager.rows;
  // 汇总口径与当前筛选一致（全部用 filtered），避免待发放按区间、已发放按筛选导致对不上。
  // 1.8.6：已发（含代发）+ 待发放 = 合计；代发是已发的**子集**（「其中代发」），不减已发。
  const { paidAmt, paidCount, proxyAmt, proxyCount, pendingAmt, pendingCount, total } = paymentSummary(filtered);
  const ownerNames = [...new Set([...names, ...payments.map((p) => p.owner)].filter(Boolean))];
  const receiverNames = [...new Set([...names, ...payments.map((p) => p.receiver)].filter(Boolean))];
  const sources = [...new Set(payments.map((p) => p.source).filter(Boolean))];
  const allChecked = pageRows.length > 0 && pageRows.every((p) => selected.includes(p.id));
  // 分组面板（人员行含代发 + 「待发放」）与「全部实际收款人」的打印汇总同一份数据。
  // 以前这里 `.slice(0, 12)`，超过 12 个人就不显示，面板金额之和 < 汇总（用户报的「统计显示不全」）。
  const panel = React.useMemo(() => panelRows(filtered), [filtered]);
  const printOwners = React.useMemo(() => printOwnerBuckets(filtered), [filtered]);
  const printOwnerLabel = printOwner === ALL_BUCKETS ? "全部实际收款人" : printOwner || "（未填实际收款人）";
  const detail = React.useMemo(() => detailSections(filtered, printOwner), [filtered, printOwner]);
  const summary = React.useMemo(() => printSummary(filtered, printOwner), [filtered, printOwner]);
  // 打印表尾的「总计」必须与打印出来的行同源：选单人时是该人的合计（已发含代发 + 待发放），不是全部人的
  const detailTotal = React.useMemo(() => sectionTotals(detail), [detail]);
  const summaryTotal = React.useMemo(() => ownerTotals(summary), [summary]);
  const printTotal = React.useMemo(() => printTotals(filtered, printOwner), [filtered, printOwner]);
  // 打印件表头的口径小字与汇总数字也走同一份计算（打印件自己不许再算一遍合计）
  const printBreakdown = React.useMemo(() => paymentSummary(scopeRows(filtered, printOwner)), [filtered, printOwner]);
  function runPrint(kind: "detail" | "summary") {
    if (!printTotal.count) {
      toast.error("当前筛选没有可打印的记录");
      return;
    }
    if (kind === "detail" && !detail.length) {
      toast.error("当前筛选没有可打印的记录");
      return;
    }
    // 先落模式再打印（与报销单「打印单张」同一写法：setTimeout 让 DOM 先渲染出打印件）
    setPrintMode(kind);
    setTimeout(() => window.print(), 0);
  }
  function dropIds(ids: string[], hint: string) {
    if (!ids.length) return;
    if (blockedWrite("payments.delete", permLabel("payments.delete"))) return;
    if (!confirmBatchDelete("发放记录", ids.length, "只删发放流水。人员档案和考勤不动。")) return;
    removePayments(ids);
    setSelected((s) => s.filter((id) => !ids.includes(id)));
    toast.success(hint);
  }
  function applyDate(ids: string[], raw: string) {
    if (!ids.length) return;
    if (blockedWrite("payments.edit", permLabel("payments.edit"))) return;
    const d = parseDateYmd(raw) || raw.trim();
    if (!d) {
      toast.error("请选择或填写发放日期");
      return;
    }
    // 这个按钮会把**已有日期**的记录一并改写（store 是无条件覆盖），且改完不可撤销：
    // 按 §6.11 批量操作必须有确认，并把「会改写几笔已有日期」写清楚（1.8.1）
    const overwrite = store.payments.filter((p) => ids.includes(p.id) && (p.date || "").trim() && p.date !== d).length;
    const msg = overwrite
      ? `给所选的 ${ids.length} 笔填发放日期「${d}」？\n\n其中 ${overwrite} 笔原来已有日期，会被一并改写成 ${d}，改完不能撤销（已发/待发汇总会跟着变）。`
      : `给所选的 ${ids.length} 笔填发放日期「${d}」？`;
    if (!confirm(msg)) return;
    patchPayments(ids, { date: d } as any);
    setSelected([]);
    toast.success(`已给 ${ids.length} 笔补上日期 ${d}`);
  }
  /**
   * B15：批量「按应发生成待发放」的预览计划（纯函数，不写盘）。
   * 口径全在 lib/pending-batch.ts 里复用现有唯一实现：
   * 应发 = 年度表的「全年」（总览「应发合计」KPI 同一份计算）、已发 = 该行「已发」（含代发），
   * 本次要生成 = 应发 − 已发（= 年度表的「未发」）；该年已有待发放记录的人跳过（幂等）。
   * 年份 = 当前工作年；搜索框有关键词时只生成姓名匹配的人（与列表筛选同口径）。
   */
  const pendingPlan = React.useMemo(
    () =>
      planPendingBatch({
        people,
        attendance: store.attendance,
        payments,
        year,
        fallbackYear: year,
        q,
      }),
    [people, store.attendance, payments, year, q],
  );
  /** 生成时带上的发放方：跟随当前「发放方」筛选（全部发放方时不填） */
  const pendingSource = batch === ALL_BUCKETS ? "" : batch;
  // 预览弹窗自己吃 Esc（与 components/preview.tsx 同一写法）：
  // 带 data-modal 后，外层编辑弹窗的「有未保存的更改」不会因为一次 Esc 被连带触发（C3）
  React.useEffect(() => {
    if (!pendingOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingOpen]);
  function openPendingPreview() {
    if (blockedWrite("payments.edit", permLabel("payments.edit"))) return;
    if (!pendingPlan.items.length) {
      toast.error(`没有可生成的待发放记录${planSkipNote(pendingPlan) ? `（${planSkipNote(pendingPlan)}）` : ""}`);
      return;
    }
    setPendingOpen(true);
  }
  function confirmPendingBatch() {
    if (blockedWrite("payments.edit", permLabel("payments.edit"))) return;
    // 预览已经列了名单/金额/合计；这里再确认一次（§6.11：批量操作必须有确认，文案写明数量与影响）
    const rows = pendingPaymentsOf(pendingPlan, { source: pendingSource });
    if (
      !confirm(
        `按应发为这 ${rows.length} 人生成待发放记录（合计 ¥${money(pendingPlan.total)}）？\n\n` +
          `记录的发放日期留空 = 待发放；发钱后补上发放日期即算已发。\n` +
          `该年已有待发放记录的人不会再生成，已有的发放记录不会被动到。`,
      )
    )
      return;
    // 一次性落盘：store 的 addPayments 只写一条操作记录（逐笔写会灌 30 条记录刷屏）
    const n = addPayments(rows);
    setPendingOpen(false);
    if (!n) {
      toast.error("没有生成任何记录（名单已变化，请重试）");
      return;
    }
    toast.success(`已生成 ${n} 笔待发放（合计 ¥${money(pendingPlan.total)}），补发放日期后即算已发`);
  }
  return (
    <Need perm="payments.view">
      <>
        {/* 屏幕内容全部 no-print：打印只能出下面的 PaymentSheets，不能把导航/筛选/明细表格印出来 */}
        <div className="no-print space-y-5">
          <ReadonlyNotice perm="payments.edit" />
          <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">发放记录</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">点「编辑」弹出编辑。点一行是勾选。点遮罩或 Esc 关闭。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TplLink href="/api/file/payment-template" filename="发放记录导入模板.xlsx" />
            <a className="btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft" href="/api/file/payment-export">
              导出全部发放
            </a>
            <PaymentImport />
            {/* B15：30 人发工资不用开 30 次弹窗 —— 按当前年份的应发一次生成「待发放」（日期留空），
                先出预览（名单 + 每人金额 + 合计）再落盘；只读账号 / 无 payments.edit 直接拦下 */}
            <Button
              variant="outline"
              type="button"
              disabled={!canEditPay}
              title={
                canEditPay
                  ? "按本年应发（考勤×工资口径）为还没登记的每个人生成一条待发放记录，日期留空"
                  : `你是只读账号（缺「${permLabel("payments.edit")}」权限），改动不会保存。`
              }
              onClick={openPendingPreview}
            >
              按应发生成待发放
            </Button>
            <Button
              type="button"
              disabled={!canEditPay}
              title={canEditPay ? undefined : `你是只读账号（缺「${permLabel("payments.edit")}」权限），改动不会保存。`}
              onClick={() => {
                if (blockedWrite("payments.edit", permLabel("payments.edit"))) return;
                setCreating(true);
                setEditing(emptyPayment());
              }}
            >
              新增发放
            </Button>
          </div>
        </header>
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
          <YmPick label="从" years={yearOpts} y={fromY} m={fromM} onY={setFromY} onM={setFromM} />
          <span className="pb-2 text-sm text-muted">到</span>
          <YmPick label="到" years={yearOpts} y={toY} m={toM} onY={setToY} onM={setToM} />
          <p className="w-full text-xs text-muted">
            当前查询：{label} · 共 {span.length} 个月。待发放没有日期，会一直显示在列表里。
            <br />
            无日期的待发放记录按当前年份（{year}）显示。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="max-w-xs" placeholder="搜索实际收款人 / 收款人" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field-select w-auto max-w-xs" value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value={ALL_BUCKETS}>全部发放方</option>
            {batches.map((b) => (
              <option value={b.value} key={b.value || "__empty__"}>
                {b.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-full border border-line p-0.5 text-xs">
            {[
              ["all", "全部"],
              ["pending", `待发放${pendingCount ? ` ${pendingCount}` : ""}`],
              ["paid", "已发放"],
            ].map(([k, label]) => (
              <button
                type="button"
                key={k}
                className={`h-8 rounded-full px-3 ${status === k ? "bg-accent text-accent-fg" : "text-muted"}`}
                onClick={() => setStatus(k as any)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted">
            {filtered.length} 笔 · 合计 ¥{money(total)} · 已发 ¥{money(paidAmt)}（{paidCount} 笔，含代发） ·{" "}
            {PROXY_INLINE_LABEL} ¥{money(proxyAmt)}（{proxyCount} 笔） · 待发放 ¥{money(pendingAmt)}（{pendingCount} 笔）
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <select
              className="field-select h-9 w-auto max-w-xs"
              value={printOwner}
              onChange={(e) => setPrintOwner(e.target.value)}
              aria-label="打印的实际收款人"
            >
              <option value={ALL_BUCKETS}>全部实际收款人</option>
              {printOwners.map((b) => (
                <option value={b.value} key={b.value || "__empty__"}>
                  {b.label}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" type="button" onClick={() => runPrint("detail")} disabled={!printTotal.count}>
              打印明细{detail.length ? `（${printTotal.count} 笔）` : ""}
            </Button>
            <Button size="sm" variant="outline" type="button" onClick={() => runPrint("summary")} disabled={!printTotal.count}>
              打印汇总
            </Button>
          </span>
          {selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input type="date" className="w-40" value={fillDate} onChange={(e) => setFillDate(e.target.value)} />
              <Button size="sm" type="button" onClick={() => applyDate(selected, fillDate)}>
                给所选补日期（{selected.length}）
              </Button>
              <Button variant="danger" size="sm" type="button" onClick={() => dropIds(selected, `已删除 ${selected.length} 笔发放`)}>
                删除所选（{selected.length}）
              </Button>
            </div>
          ) : null}
        </div>
        <WideTable id="payments" pager={pager as any}>
          <table className="wide-table text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={allChecked}
                    onChange={(e) => {
                      const ids = pageRows.map((p) => p.id);
                      setSelected((s) => (e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id))));
                    }}
                    aria-label="全选发放记录"
                  />
                </th>
                <th className="p-3">操作</th>
                <th className="p-3">序号</th>
                <th className="p-3">实际收款人</th>
                <th className="p-3">发放日期</th>
                <th className="p-3">发放金额（元）</th>
                <th className="p-3">发放方</th>
                <th className="p-3">收款人</th>
                <th className="p-3">备注</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-sm text-muted">
                    还没有发放记录。点右上角「新增发放」。
                  </td>
                </tr>
              ) : null}
              {pageRows.map((p, i) => (
                <tr
                  key={p.id}
                  className={`group border-b border-line last:border-0 hover:bg-accent-soft ${editing?.id === p.id || selected.includes(p.id) ? "bg-accent-soft" : ""}`}
                  onClick={() => setSelected((s) => toggleSel(s, p.id, !s.includes(p.id)))}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={selected.includes(p.id)}
                      onChange={(e) => setSelected((s) => toggleSel(s, p.id, e.target.checked))}
                      aria-label={`选择 ${p.owner} ${p.date}`}
                    />
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled={!canEditPay}
                      title={canEditPay ? undefined : `你是只读账号（缺「${permLabel("payments.edit")}」权限），改动不会保存。`}
                      onClick={() => {
                        if (blockedWrite("payments.edit", permLabel("payments.edit"))) return;
                        setCreating(false);
                        setEditing(p);
                      }}
                    >
                      编辑
                    </Button>
                  </td>
                  <td className="p-3 tabular-nums text-muted">{(pager.page - 1) * pager.size + i + 1}</td>
                  <td className="p-3 font-medium">{p.owner}</td>
                  <td className="p-3">{p.date || <Badge tone="warn">待发放</Badge>}</td>
                  <td className="p-3 tabular-nums">¥{money(p.amount)}</td>
                  <td className="p-3 text-muted">{p.source}</td>
                  <td className="p-3">
                    {p.receiver}
                    {isProxyReceiver(p) ? (
                      <Badge tone="warn" className="ml-2">
                        代收
                      </Badge>
                    ) : (
                      <Badge className="ml-2">本人</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted">{p.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </WideTable>
        {editing ? (
          <PaymentEditor
            draft={editing}
            creating={creating}
            ownerNames={ownerNames}
            receiverNames={receiverNames}
            sources={sources}
            onCancel={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSave={(row) => {
              if (blockedWrite("payments.edit", permLabel("payments.edit"))) return false;
              if (creating) {
                addPayment({
                  owner: row.owner,
                  receiver: row.receiver,
                  date: row.date,
                  amount: row.amount,
                  source: row.source,
                  remark: row.remark,
                });
                toast.success(
                  row.date
                    ? isProxyReceiver(row)
                      ? `已记到 ${row.owner} 头上，${receiverOf(row)} 代收`
                      : `已记到 ${row.owner} 头上`
                    : `已上报 ${row.owner}，待发放`,
                );
                setEditing(null);
                setCreating(false);
                return;
              }
              patchPayments([row.id], {
                owner: row.owner,
                receiver: row.receiver,
                date: row.date,
                amount: row.amount,
                source: row.source,
                remark: row.remark,
              });
              setEditing(row);
              toast.success("发放已保存");
            }}
            onDelete={() => {
              dropIds([editing.id], "已删除 1 笔发放");
              setEditing(null);
              setCreating(false);
            }}
          />
        ) : null}
        {panel.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
              <span className="text-xs text-muted">
                按实际收款人入账（已填发放日期的都计入实际收款人名下，含代发；待发放单列，不算已发）
              </span>
              <span className="text-xs text-muted">
                共 {panel.length} 行 · 已发 ¥{money(paidAmt)}（{PROXY_INLINE_LABEL} ¥{money(proxyAmt)}） + 待发放 ¥
                {money(pendingAmt)} = ¥{money(total)}
              </span>
            </div>
            <table className="fit-table text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="p-3">实际收款人</th>
                  <th className="p-3">笔数</th>
                  <th className="p-3">已发金额（含代发）</th>
                  <th className="p-3">备注</th>
                </tr>
              </thead>
              <tbody>
                {panel.map((r) => (
                  <tr
                    className={`border-t border-line ${r.kind === "person" ? "" : "bg-bg-elevated"}`}
                    key={r.kind === "person" ? r.owner || "__empty__" : r.kind}
                  >
                    <td className="p-3">{r.kind === "person" ? r.owner || "（未填实际收款人）" : r.owner}</td>
                    <td className="p-3 tabular-nums text-muted">{r.count}</td>
                    <td className="p-3 text-right tabular-nums">¥{money(r.amount)}</td>
                    <td className="p-3 text-xs text-muted">
                      {r.kind === "person"
                        ? r.proxyCount
                          ? `${PROXY_INLINE_LABEL} ${r.proxyCount} 笔 ¥${money(r.proxyAmt)}（收款人非本人，已计入本行）`
                          : ""
                        : "没有发放日期，不计入已发"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {pendingOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6"
            data-modal="pending-batch-preview"
            onClick={() => setPendingOpen(false)}
          >
            <section
              id="pending-batch-preview"
              // 小屏（375×667）不许用裸 max-h-screen（1.8.8 D6）：面板比可视区高、顶部按钮会被裁
              className="max-h-[calc(100dvh-4rem)] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-6 shadow-panel md:max-h-[calc(100dvh-3rem)] md:rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <h2 className="font-display text-lg font-semibold">按应发生成待发放 · {year} 年</h2>
                <div className="btn-row">
                  <Button variant="outline" type="button" onClick={() => setPendingOpen(false)}>
                    取消
                  </Button>
                  <Button type="button" disabled={!pendingPlan.items.length} onClick={confirmPendingBatch}>
                    确认生成 {pendingPlan.items.length} 笔
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-xs text-muted">
                  应发 = 本年考勤按工资口径算出的「全年」（与总览「应发合计」、考勤页年度表同一份计算）；
                  本次生成金额 = 应发 − 已发（已发按实际收款人计入、含代发）。生成出来的记录
                  <b>日期留空 = 待发放</b>，发钱后给它们补上日期即算已发。
                  {q.trim() ? `只生成姓名包含「${q.trim()}」的人（跟随当前搜索）。` : ""}
                  {pendingSource ? `发放方跟随当前筛选：${pendingSource}。` : ""}
                </p>
                <p className="text-sm">
                  将新增 <b>{pendingPlan.items.length}</b> 笔 · 合计 <b>¥{money(pendingPlan.total)}</b>
                  {planSkipNote(pendingPlan) ? <span className="text-xs text-muted"> · 跳过：{planSkipNote(pendingPlan)}</span> : null}
                </p>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="fit-table text-left text-sm">
                    <thead className="text-xs text-muted">
                      <tr>
                        <th className="p-3">姓名</th>
                        <th className="p-3">班组</th>
                        <th className="p-3 text-right">本年应发</th>
                        <th className="p-3 text-right">本年已发（含代发）</th>
                        <th className="p-3 text-right">本次待发放</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPlan.items.map((it) => (
                        <tr key={it.owner} className="border-t border-line">
                          <td className="p-3 font-medium">{it.owner}</td>
                          <td className="p-3 text-muted">{it.team || "未分班组"}</td>
                          <td className="p-3 text-right tabular-nums">¥{money(it.should)}</td>
                          <td className="p-3 text-right tabular-nums">¥{money(it.paid)}</td>
                          <td className="p-3 text-right tabular-nums font-medium">¥{money(it.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        ) : null}
        </div>
        <PaymentSheets
          mode={printMode}
          label={label}
          filterText={`${batch === ALL_BUCKETS ? "全部发放方" : batch ? `发放方：${batch}` : "发放方：未填发放方"} · ${printOwnerLabel}`}
          sections={detail}
          summary={summary}
          totals={printMode === "detail" ? detailTotal : summaryTotal}
          breakdown={printBreakdown}
          pendingYear={year}
          printOwner={printOwner}
        />
      </>
    </Need>
  );
}

function PaymentEditor({
  draft,
  creating,
  ownerNames,
  receiverNames,
  sources,
  onCancel,
  onSave,
  onDelete,
}: {
  draft: Payment;
  creating: boolean;
  ownerNames: string[];
  receiverNames: string[];
  sources: string[];
  onCancel: () => void;
  /** 返回 false = 这次没存下去（只读账号被拦下）。此时**不许**复位脏标记 */
  onSave: (row: Payment) => void | boolean;
  onDelete: () => void;
}) {
  const [c, setC] = React.useState<Payment>(() => ({ ...draft }));
  const { markDirty, resetDirty, requestClose } = useGuardedClose(onCancel);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);
  React.useEffect(() => {
    setC({ ...draft });
  }, [draft.id]);
  function patch(key: keyof Payment, value: any) {
    setC((prev) => {
      const next = { ...prev, [key]: value } as Payment;
      if (key === "owner" && (!prev.receiver || prev.receiver === prev.owner)) next.receiver = value;
      return next;
    });
  }
  function save() {
    const who = (c.owner || "").trim();
    if (!who || !(Number(c.amount) > 0)) {
      toast.error("请填写实际收款人和金额");
      return;
    }
    const recv = (c.receiver || "").trim() || who;
    const date = parseDateYmd(c.date) || (c.date || "").trim();
    const next: Payment = {
      ...c,
      owner: who,
      receiver: recv,
      date,
      // 金额入库统一取整到分（专家评审 A-2）：亚分金额会让「已发 + 待发 = 总计」这条
      // 印在界面/打印件上的等式差 0.01 —— 与报销/工资同口径，都走 wage.ts 的 round2
      amount: round2(Number(c.amount) || 0),
      source: (c.source || "").trim(),
      remark: (c.remark || "").trim(),
    };
    if (creating) {
      if (!confirm(`确认新增发放给「${who}」¥${next.amount}？`)) return;
      // 存下去了才复位脏标记：B9 实测「保存成功后点关闭仍被问『有未保存的更改』」
      if (onSave(next) !== false) resetDirty();
      return;
    }
    const lines: string[] = [];
    if (next.owner !== draft.owner) lines.push(`实际收款人：「${draft.owner}」→「${next.owner}」`);
    if (next.receiver !== (draft.receiver || "")) lines.push(`收款人：「${draft.receiver || ""}」→「${next.receiver}」`);
    if ((next.date || "") !== (draft.date || "")) lines.push(`发放日期：「${draft.date || "待发放"}」→「${next.date || "待发放"}」`);
    if (Number(next.amount) !== Number(draft.amount)) lines.push(`金额：${draft.amount} → ${next.amount}`);
    if (next.source !== (draft.source || "")) lines.push(`发放方：「${draft.source || ""}」→「${next.source}」`);
    if (next.remark !== (draft.remark || "")) lines.push("备注已改");
    if (!lines.length) {
      toast.success("没有改动");
      return;
    }
    if (!confirm(`确认保存这些修改？\n${lines.join("\n")}`)) return;
    if (onSave(next) !== false) resetDirty();
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6"
      onClick={requestClose}
    >
      <section
        id="payment-editor"
        // 1.8.8 D6：小屏（375×667）下 max-h-screen（=100vh）比可视区高 20px，面板贴底后顶部按钮被裁。
        // 改用 dvh 并留出余量：手机 4rem、桌面 3rem（= md:p-6 的内边距）。
        className="max-h-[calc(100dvh-4rem)] w-full max-w-5xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-6 shadow-panel md:max-h-[calc(100dvh-3rem)] md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onChange={markDirty}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
          <h2 className="font-display text-lg font-semibold">{creating ? "新增发放" : c.owner ? `编辑发放 · ${c.owner}` : "编辑发放"}</h2>
          <div className="btn-row">
            {!creating ? (
              <Button variant="danger" type="button" onClick={onDelete}>
                删除
              </Button>
            ) : null}
            <Button variant="outline" type="button" onClick={requestClose}>
              关闭
            </Button>
            <Button type="button" onClick={save}>
              {creating ? "确认新增" : "保存发放信息"}
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <Label>实际收款人（入账）</Label>
            <Input className="mt-2 h-11" list="pay-edit-owners" value={c.owner} placeholder="工资记在谁头上" onChange={(e) => patch("owner", e.target.value)} />
            <datalist id="pay-edit-owners">
              {ownerNames.map((n) => (
                <option value={n} key={n} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>收款人（代收可填别人）</Label>
            <Input className="mt-2 h-11" list="pay-edit-receivers" value={c.receiver} placeholder="空则同实际收款人" onChange={(e) => patch("receiver", e.target.value)} />
            <datalist id="pay-edit-receivers">
              {receiverNames.map((n) => (
                <option value={n} key={n} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>发放日期（空=待发放）</Label>
            <Input className="mt-2 h-11" type="date" value={parseDateYmd(c.date) || c.date || ""} onChange={(e) => patch("date", e.target.value)} />
          </div>
          <div>
            <Label>发放金额（元）</Label>
            <Input className="mt-2 h-11" type="number" value={c.amount || ""} onChange={(e) => patch("amount", Number(e.target.value) || 0)} />
          </div>
          <div className="md:col-span-2">
            <Label>发放方</Label>
            <Input
              className="mt-2 h-11"
              list="pay-edit-sources"
              value={c.source}
              placeholder="如：五冶条钢-钻孔切割8月请款"
              onChange={(e) => patch("source", e.target.value)}
            />
            <datalist id="pay-edit-sources">
              {sources.map((n) => (
                <option value={n} key={n} />
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2">
            <Label>备注</Label>
            <Input className="mt-2 h-11" value={c.remark} onChange={(e) => patch("remark", e.target.value)} />
          </div>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});
