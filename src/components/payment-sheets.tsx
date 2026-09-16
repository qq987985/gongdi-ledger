import { money } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { ALL_BUCKETS } from "~/lib/buckets";
import type { DetailSection, OwnerRow, PrintTotals } from "~/lib/payments-stats";
import type { Payment } from "~/lib/types";

/**
 * 发放记录的两张打印件（口径一致性专项 20260916）。
 *
 * 数据全部来自 `src/lib/payments-stats.ts` 的**同一份**纯函数结果（路由只负责传进来），
 * 所以屏幕上看到的数字与打印纸上的一模一样：
 * - 模式一「明细清单」：按实际收款人分节，每笔一行 + 该人小计；整节 `break-inside-avoid` 不拆页。
 * - 模式二「汇总清单」：每人一行（笔数 + 合计 + 含代收 N 笔）+ 总计。
 * 两者都只计**已填发放日期**的记录（待发放不算已发），并在表头写明口径与当前筛选。
 *
 * 样式沿用报销单打印件（`.print-only` / `.statement`，字号 text-xs、边框 border-black）：§6.6。
 */
export function PaymentSheets({
  mode,
  label,
  filterText,
  sections,
  summary,
  totals,
  printOwner,
}: {
  mode: "detail" | "summary";
  label: string;
  filterText: string;
  sections: DetailSection[];
  summary: OwnerRow[];
  totals: PrintTotals;
  printOwner: string;
}) {
  if (!totals.count) return null;
  const today = localToday();
  const heads =
    mode === "detail"
      ? ["序号", "发放日期", "实际收款人", "收款人", "发放方", "金额（元）", "备注"]
      : ["序号", "实际收款人", "笔数", "合计金额（元）", "备注"];
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
          <div className="mt-0.5 text-[11px]">口径：只计已填发放日期的记录；待发放不算已发。</div>
        </header>
        {mode === "detail" ? (
          sections.map((s) => (
            <section key={s.owner || "__empty__"} className="mt-3 break-inside-avoid">
              <div className="text-sm font-semibold">
                实际收款人：{s.owner || "（未填）"} · {s.count} 笔 · ¥{money(s.amount)}
              </div>
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
                      <td className="border border-black px-1 py-1">{p.date}</td>
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
                      小计{s.proxyCount ? `（含代收 ${s.proxyCount} 笔）` : ""}
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
                <tr key={r.owner || "__empty__"}>
                  <td className="border border-black px-1 py-1">{i + 1}</td>
                  <td className="border border-black px-1 py-1">{r.owner || "（未填）"}</td>
                  <td className="border border-black px-1 py-1 tabular-nums">{r.count}</td>
                  <td className="border border-black px-1 py-1 tabular-nums">{money(r.amount)}</td>
                  <td className="border border-black px-1 py-1 text-left">{r.proxyCount ? `含代收 ${r.proxyCount} 笔` : ""}</td>
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
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}
