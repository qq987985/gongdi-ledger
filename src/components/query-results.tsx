import { Button } from "~/components/ui/button";
import { QueryMonthTable } from "~/components/query-month-table";
import { money } from "~/lib/utils";
import { queryTeamResults, type QueryContent, type QueryPersonResult } from "~/lib/query-data";

export function PersonQueryResults({ result, label, content }: {
  result: QueryPersonResult;
  label: string;
  content: QueryContent;
}) {
  const wage = content === "wage";
  if (result.ambiguous) return <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">人员档案存在同名，历史记录按姓名关联，无法可靠区分。请先核对人员档案及历史记录。</p>;
  const { months, totals } = result;
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h3 className="text-sm font-semibold">{label}{wage ? "工资" : "考勤"}汇总</h3>
      <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="个人查询汇总">
        <table className="fit-table query-results-table text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-2">年月</th><th>出勤天数</th><th>加班小时</th>
              {wage ? <><th>补助</th><th>扣款</th><th>加班费</th><th>应发</th></> : null}
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {months.map((row) => (
              <tr className="border-t border-line" key={`${row.year}-${row.month}`}>
                <td className="py-2 whitespace-nowrap">{row.year}年{row.month}月</td>
                <td className="tabular-nums">{row.days || "—"}</td><td className="tabular-nums">{row.otHours || "—"}</td>
                {wage ? <>
                  <td className="tabular-nums">{row.allowance ? `¥${money(row.allowance)}` : "—"}</td>
                  <td className="tabular-nums">{row.deduction ? `¥${money(row.deduction)}` : "—"}</td>
                  <td className="tabular-nums">{row.ot ? `¥${money(row.ot)}` : "—"}</td>
                  <td className="tabular-nums">{row.pay ? `¥${money(row.pay)}` : "—"}</td>
                </> : null}
                <td className="text-muted">{row.remark}</td>
              </tr>
            ))}
            <tr className="border-t border-line font-medium">
              <td className="py-2">合计</td><td className="tabular-nums">{totals.days}</td><td className="tabular-nums">{totals.otHours}</td>
              {wage ? <>
                <td className="tabular-nums">¥{money(totals.allowance)}</td><td className="tabular-nums">¥{money(totals.deduction)}</td>
                <td className="tabular-nums">¥{money(totals.ot)}</td><td className="tabular-nums">¥{money(totals.pay)}</td>
              </> : null}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      {!months.some((month) => month.hasContent) ? <p className="mt-3 text-sm text-muted">该区间没有考勤记录。</p> : null}
      {wage ? <p className="mt-3 text-sm">应发合计 ¥{money(totals.pay)} · 已记入实际收款人 ¥{money(result.paidAsOwner)}（含代发） · 差额 ¥{money(result.difference)}</p> : null}
    </section>
  );
}

export function TeamQueryResults({ summary, label, teamLabel, content, onPerson }: {
  summary: ReturnType<typeof queryTeamResults>;
  label: string;
  teamLabel: string;
  content: QueryContent;
  onPerson: (id: string) => void;
}) {
  const wage = content === "wage";
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h2 className="font-display text-xl font-semibold">{teamLabel} · {wage ? "工资" : "考勤"}</h2>
      <p className="mt-1 text-xs text-muted">{label} · 当前人员档案中的 {summary.members.length} 人。先看各月汇总和本月小计，最后看所选月份合计；点击姓名查看个人汇总。</p>
      {summary.ambiguousCount ? <p className="mt-3 text-sm text-warn">其中 {summary.ambiguousCount} 人存在同名，历史记录无法可靠区分，未计入合计；请先核对人员档案及历史记录。</p> : null}
      {summary.members.length ? <div className="mt-4 space-y-4">
        <h3 className="font-semibold">各月汇总</h3>
        {summary.months.map((month) => <div key={`${month.year}-${month.month}`} className="overflow-x-auto rounded-lg border border-line" tabIndex={0} role="region" aria-label={`${month.year}年${month.month}月班组汇总`}>
          <QueryMonthTable month={month} content={content} teamLabel={teamLabel} onPerson={onPerson} />
        </div>)}
      </div> : null}
      <h3 className="mt-5 font-semibold">{teamLabel} · {label}{wage ? "工资" : "考勤"}汇总</h3>
      <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="班组查询汇总">
        <table className="fit-table query-results-table text-left text-sm">
          <thead className="text-xs text-muted"><tr>
            <th className="py-2">姓名</th><th>出勤天数</th><th>加班小时</th>
            {wage ? <><th>应发</th><th>已记入实际收款人（含代发）</th><th>差额</th></> : null}<th>备注</th>
          </tr></thead>
          <tbody>
            {summary.members.map((row) => (
              <tr className="border-t border-line" key={row.person.id}>
                <td className="py-2"><Button variant="ghost" size="sm" type="button" onClick={() => onPerson(row.person.id)}>{row.person.name}</Button></td>
                <td className="tabular-nums">{row.ambiguous ? "—" : row.totals.days}</td><td className="tabular-nums">{row.ambiguous ? "—" : row.totals.otHours}</td>
                {wage ? <>
                  <td className="tabular-nums">{row.ambiguous ? "—" : `¥${money(row.totals.pay)}`}</td>
                  <td className="tabular-nums">{row.ambiguous ? "—" : `¥${money(row.paidAsOwner)}`}</td>
                  <td className="tabular-nums">{row.ambiguous ? "—" : `¥${money(row.difference)}`}</td>
                </> : null}
                <td className="text-muted">{row.ambiguous ? "姓名重复，历史记录待核对" : row.remark}</td>
              </tr>
            ))}
            {summary.members.length ? <tr className="border-t border-line font-medium">
              <td className="py-2">区间合计</td><td className="tabular-nums">{summary.totals.days}</td><td className="tabular-nums">{summary.totals.otHours}</td>
              {wage ? <><td className="tabular-nums">¥{money(summary.totals.pay)}</td><td className="tabular-nums">¥{money(summary.paidAsOwner)}</td><td className="tabular-nums">¥{money(summary.difference)}</td></> : null}<td />
            </tr> : <tr><td colSpan={wage ? 7 : 4} className="py-6 text-muted">该班组暂无人员。</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
