import { money } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { ALL_BUCKETS } from "~/lib/buckets";
import { PROXY_INLINE_LABEL, isPaid, isProxyReceiver, printCaliberNote, receiverOf } from "~/lib/payments-stats";
import type { DetailSection, OwnerRow, PaymentSummary, PrintTotals } from "~/lib/payments-stats";
import type { Payment } from "~/lib/types";

/**
 * 发放记录的两张打印件（口径一致性专项 20260916；1.8.5 决策一 + 1.8.6 纠正代发/待发口径）。
 *
 * 数据全部来自 `src/lib/payments-stats.ts` 的**同一份**纯函数结果（路由只负责传进来），
 * 所以屏幕上看到的数字与打印纸上的一模一样：
 * - 模式一「明细清单」：按实际收款人分节 —— 节内是该人的**全部记录（已发 + 待发）**，
 *   每笔标注「已发 / 待发」（代收笔另有「（代收）」标记），节尾小计拆
 *   「已发小计」+「待发小计」两行；整节 `break-inside-avoid` 不拆页。
 * - 模式二「汇总清单」：每人一行（已发含代发）+「待发放」**单列一组** + 总计。
 * 口径（1.8.6）：**已发 A + 待发放 C = 总计**；代发是已发的**子集**（B ⊆ A），
 * 单列成「其中代发」标注，**不减 A**。两种清单表头小字分别写清差别（`printCaliberNote`）。
 *
 * 样式沿用报销单打印件（`.print-only` / `.statement`，字号 text-xs、边框 border-black）：§6.6。
 * 合计只能来自传进来的 `totals` / `breakdown`，本组件**不自己再算一遍**（守卫测试会查 `.reduce(`）。
 */
export function PaymentSheets({
  mode,
  label,
  filterText,
  sections,
  summary,
  totals,
  breakdown,
  pendingYear,
  printOwner,
}: {
  mode: "detail" | "summary";
  label: string;
  filterText: string;
  sections: DetailSection[];
  summary: OwnerRow[];
  totals: PrintTotals;
  /** 笔数/金额（已发含代发 / 其中代发 / 待发放），与 totals 同源 */
  breakdown: PaymentSummary;
  /** 无日期的待发放记录归到哪一年（当前工作年，决策一） */
  pendingYear: number;
  printOwner: string;
}) {
  if (!totals.count) return null;
  const today = localToday();
  const heads =
    mode === "detail"
      ? ["序号", "发放日期", "状态", "实际收款人", "收款人", "发放方", "金额（元）", "备注"]
      : ["序号", "实际收款人", "笔数", "合计金额（元）", "备注"];
  const proxyNote = (count: number, amount: number): string => `${PROXY_INLINE_LABEL} ${count} 笔 ¥${money(amount)}`;
  const sectionTitle = (s: DetailSection): string => {
    const base = `实际收款人：${s.owner || "（未填）"} · ${s.count} 笔 · ¥${money(s.amount)}`;
    const bits = [`已发 ${s.paidCount} 笔 ¥${money(s.paidAmt)}`];
    if (s.proxyCount) bits.push(proxyNote(s.proxyCount, s.proxyAmt));
    if (s.pendingCount) bits.push(`待发 ${s.pendingCount} 笔 ¥${money(s.pendingAmt)}`);
    return `${base}（${bits.join(" · ")}）`;
  };
  const rowNote = (r: OwnerRow): string => {
    if (r.kind === "pending") return "待发放，不计入已发";
    return r.proxyCount ? `${proxyNote(r.proxyCount, r.proxyAmt)}（收款人非本人，已计入本行）` : "";
  };
  return (
    <div className="print-only space-y-8 text-black">
      <article className="statement border border-black p-4">
        <header className="border-b border-black pb-2 text-center">
          <div className="text-xl font-semibold tracking-widest">
            发放记录 · {mode === "detail" ? "明细清单" : "汇总清单"}
          </div>
          <div className="mt-1 text-sm">
            {label} · {filterText}
          </div>
          <div className="mt-0.5 text-[11px]">口径：{printCaliberNote(mode)}</div>
          <div className="mt-0.5 text-[11px]">无日期的待发放记录按当前年份（{pendingYear}）显示。</div>
          <div className="mt-1 text-[11px] font-medium">
            已发 {breakdown.paidCount} 笔 ¥{money(breakdown.paidAmt)}（{PROXY_INLINE_LABEL} {breakdown.proxyCount} 笔 ¥
            {money(breakdown.proxyAmt)}） · 待发放 {breakdown.pendingCount} 笔 ¥{money(breakdown.pendingAmt)} · 合计{" "}
            {totals.count} 笔 ¥{money(totals.amount)}
          </div>
        </header>
        {mode === "detail" ? (
          sections.map((s) => (
            <section key={s.owner || "__empty__"} className="mt-3 break-inside-avoid">
              <div className="text-sm font-semibold">{sectionTitle(s)}</div>
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
                  {s.rows.map((p: Payment, i: number) => (
                    <tr key={p.id}>
                      <td className="border border-black px-1 py-1">{i + 1}</td>
                      <td className="border border-black px-1 py-1">{p.date || "—"}</td>
                      <td className="border border-black px-1 py-1 font-medium">{isPaid(p) ? "已发" : "待发"}</td>
                      <td className="border border-black px-1 py-1">{p.owner || "—"}</td>
                      <td className="border border-black px-1 py-1">
                        {receiverOf(p) || "—"}
                        {isProxyReceiver(p) ? "（代收）" : ""}
                      </td>
                      <td className="border border-black px-1 py-1">{p.source || "未填发放方"}</td>
                      <td className="border border-black px-1 py-1 tabular-nums">{money(p.amount || 0)}</td>
                      <td className="border border-black px-1 py-1 text-left">{p.remark || ""}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-black px-1 py-1 text-right font-medium" colSpan={6}>
                      已发小计 {s.paidCount} 笔
                      {s.proxyCount ? `（${proxyNote(s.proxyCount, s.proxyAmt)}，已计入）` : ""}
                    </td>
                    <td className="border border-black px-1 py-1 font-semibold tabular-nums">{money(s.paidAmt)}</td>
                    <td className="border border-black px-1 py-1" />
                  </tr>
                  {s.pendingCount ? (
                    <tr>
                      <td className="border border-black px-1 py-1 text-right" colSpan={6}>
                        待发小计 {s.pendingCount} 笔
                      </td>
                      <td className="border border-black px-1 py-1 tabular-nums">{money(s.pendingAmt)}</td>
                      <td className="border border-black px-1 py-1" />
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>
          ))
        ) : (
          <table className="mt-3 w-full border-collapse text-center text-xs">
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
              {summary.map((r, i) => (
                <tr key={r.kind === "person" ? r.owner || "__empty__" : r.kind}>
                  <td className="border border-black px-1 py-1">{i + 1}</td>
                  <td className="border border-black px-1 py-1">
                    {r.kind === "person" ? r.owner || "（未填）" : r.owner}
                  </td>
                  <td className="border border-black px-1 py-1 tabular-nums">{r.count}</td>
                  <td className="border border-black px-1 py-1 tabular-nums">{money(r.amount)}</td>
                  <td className="border border-black px-1 py-1 text-left">{rowNote(r)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="border border-black px-1 py-1 font-semibold" colSpan={2}>
                  总计{printOwner === ALL_BUCKETS ? "（全部实际收款人）" : ""}
                </td>
                <td className="border border-black px-1 py-1 font-semibold tabular-nums">{totals.count}</td>
                <td className="border border-black px-1 py-1 font-semibold tabular-nums">{money(totals.amount)}</td>
                <td className="border border-black px-1 py-1" />
              </tr>
            </tfoot>
          </table>
        )}
        {mode === "detail" ? (
          <p className="mt-3 text-right text-sm font-medium">
            总计 {totals.count} 笔 · ¥{money(totals.amount)}
          </p>
        ) : null}
        {breakdown.proxyCount || breakdown.pendingCount ? (
          <p className="mt-1 text-right text-[11px]">
            其中：已发 ¥{money(breakdown.paidAmt)}（{PROXY_INLINE_LABEL} ¥{money(breakdown.proxyAmt)}，
            {breakdown.proxyCount} 笔，已计入实际收款人名下） + 待发放 ¥{money(breakdown.pendingAmt)}（
            {breakdown.pendingCount} 笔，不算已发） = 合计 ¥{money(totals.amount)}
          </p>
        ) : null}
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}
