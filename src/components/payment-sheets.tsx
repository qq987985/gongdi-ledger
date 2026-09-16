import { money } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { ALL_BUCKETS } from "~/lib/buckets";
import { PRINT_CALIBER_NOTE, PROXY_LABEL } from "~/lib/payments-stats";
import type { DetailSection, OwnerRow, PaymentSummary, PrintTotals } from "~/lib/payments-stats";
import type { Payment } from "~/lib/types";

/**
 * 发放记录的两张打印件（口径一致性专项 20260916；1.8.5 决策一 + 决策四）。
 *
 * 数据全部来自 `src/lib/payments-stats.ts` 的**同一份**纯函数结果（路由只负责传进来），
 * 所以屏幕上看到的数字与打印纸上的一模一样：
 * - 模式一「明细清单」：按实际收款人分节，+「代发」节 +「待发放」节；整节 `break-inside-avoid` 不拆页。
 * - 模式二「汇总清单」：每人一行 + 「代发」+「待发放」两组 + 总计。
 * 三维修互不重叠：**已发（本人）A + 代发 B + 待发放 C = 总计**；
 * 明细逐笔之和 = 汇总各行之和 = 总计（含待发放 / 不含待发放两种筛选下都成立）。
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
  /** 三维修的笔数/金额（已发本人 / 代发 / 待发放），与 totals 同源 */
  breakdown: PaymentSummary;
  /** 无日期的待发放记录归到哪一年（当前工作年，决策一） */
  pendingYear: number;
  printOwner: string;
}) {
  if (!totals.count) return null;
  const today = localToday();
  const heads =
    mode === "detail"
      ? ["序号", "发放日期", "实际收款人", "收款人", "发放方", "金额（元）", "备注"]
      : ["序号", "实际收款人", "笔数", "合计金额（元）", "备注"];
  const sectionTitle = (s: DetailSection): string => {
    if (s.kind === "proxy") return `代发（代收：收款人非本人，不计入已发） · ${s.count} 笔 · ¥${money(s.amount)}`;
    if (s.kind === "pending") return `待发放（无发放日期，不计入已发） · ${s.count} 笔 · ¥${money(s.amount)}`;
    return `实际收款人：${s.owner || "（未填）"} · ${s.count} 笔 · ¥${money(s.amount)}`;
  };
  const rowNote = (r: OwnerRow): string => {
    if (r.kind === "proxy") return "代收，不计入已发";
    if (r.kind === "pending") return "待发放，不计入已发";
    return r.proxyCount ? `另有 ${r.proxyCount} 笔代收（单列「代发」）` : "";
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
          <div className="mt-0.5 text-[11px]">口径：{PRINT_CALIBER_NOTE}</div>
          <div className="mt-0.5 text-[11px]">无日期的待发放记录按当前年份（{pendingYear}）显示。</div>
          <div className="mt-1 text-[11px] font-medium">
            已发（本人）{breakdown.selfCount} 笔 ¥{money(breakdown.selfAmt)} · 代发 {breakdown.proxyCount} 笔 ¥
            {money(breakdown.proxyAmt)} · 待发放 {breakdown.pendingCount} 笔 ¥{money(breakdown.pendingAmt)} · 合计{" "}
            {totals.count} 笔 ¥{money(totals.amount)}
          </div>
        </header>
        {mode === "detail" ? (
          sections.map((s) => (
            <section key={s.kind === "person" ? s.owner || "__empty__" : s.kind} className="mt-3 break-inside-avoid">
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
                      <td className="border border-black px-1 py-1">{p.date || "待发放"}</td>
                      <td className="border border-black px-1 py-1">{p.owner || "—"}</td>
                      <td className="border border-black px-1 py-1">
                        {p.receiver || p.owner || "—"}
                        {p.owner !== p.receiver ? "（代收）" : ""}
                      </td>
                      <td className="border border-black px-1 py-1">{p.source || "未填发放方"}</td>
                      <td className="border border-black px-1 py-1 tabular-nums">{money(p.amount || 0)}</td>
                      <td className="border border-black px-1 py-1 text-left">{p.remark || ""}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-black px-1 py-1 font-medium" colSpan={5}>
                      {s.kind === "person" ? "小计" : `${s.owner}合计`}
                      {s.proxyCount ? `（另有 ${s.proxyCount} 笔代收，见「${PROXY_LABEL}」节）` : ""}
                    </td>
                    <td className="border border-black px-1 py-1 font-semibold tabular-nums">{money(s.amount)}</td>
                    <td className="border border-black px-1 py-1">{s.count} 笔</td>
                  </tr>
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
            其中：已发（本人）¥{money(breakdown.selfAmt)} · 代发 ¥{money(breakdown.proxyAmt)}（{breakdown.proxyCount} 笔，
            不计入已发） · 待发放 ¥{money(breakdown.pendingAmt)}（{breakdown.pendingCount} 笔，不算已发）
          </p>
        ) : null}
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}
