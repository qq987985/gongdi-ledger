import { QUERY_TEAM_ATTENDANCE_COLS, QUERY_PERSON_ATTENDANCE_COLS, QUERY_TEAM_WAGE_COLS, QUERY_PERSON_WAGE_COLS } from "~/lib/print-cols";
import { money } from "~/lib/utils";
import { QueryMonthTable } from "~/components/query-month-table";
import type { QueryContent, QueryPersonResult, queryTeamResults } from "~/lib/query-data";

const TD = "border border-black px-1 py-1";

/** 当前核对对象的精简清单，数据和合计直接复用屏幕结果。 */
export function QuerySheet({ content, label, paymentLabel, person, team, teamLabel }: {
  content: QueryContent;
  label: string;
  paymentLabel: string;
  person?: QueryPersonResult;
  team?: ReturnType<typeof queryTeamResults>;
  teamLabel: string;
}) {
  const wage = content === "wage";
  if ((!person || person.ambiguous) && !team) return null;
  if (team && !team.members.length) return null;
  const widths = team ? (wage ? QUERY_TEAM_WAGE_COLS : QUERY_TEAM_ATTENDANCE_COLS) : (wage ? QUERY_PERSON_WAGE_COLS : QUERY_PERSON_ATTENDANCE_COLS);
  const columns = team ? (wage ? 7 : 4) : (wage ? 8 : 4);
  const totals = team?.totals || person!.totals;
  return (
    <div className="print-only text-black">
      {team ? team.months.map((month) => <article key={`${month.year}-${month.month}`} className="query-result-sheet print-doc mb-4">
        <QueryMonthTable month={month} content={content} teamLabel={teamLabel} print />
      </article>) : null}
      <article className="query-result-sheet print-doc">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>{widths.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
          <thead>
            <tr><th className={`${TD} text-left`} colSpan={columns}>
              <div className="text-base font-semibold">{team ? teamLabel : person!.person.name} · {wage ? "工资核对清单" : "考勤核对清单"}{team ? " · 区间汇总" : ""}</div>
              <div className="mt-1 font-normal">考勤：{label}（按整月统计）{wage ? `；发放：${paymentLabel}（含起止当日）` : ""}</div>
              {team ? <div className="font-normal">按当前人员档案班组，共 {team.members.length} 人。{team.ambiguousCount ? `其中 ${team.ambiguousCount} 人姓名重复，未计入合计，历史记录待核对。` : ""}</div> : <div className="font-normal">班组：{person!.person.team?.trim() || "未分班组"}</div>}
            </th></tr>
            <tr>
              <th className={TD}>{team ? "姓名" : "年月"}</th><th className={TD}>出勤天数</th><th className={TD}>加班小时</th>
              {wage ? team ? <><th className={TD}>应发</th><th className={TD}>已记入实际收款人（含代发）</th><th className={TD}>差额</th></> : <><th className={TD}>补助</th><th className={TD}>扣款</th><th className={TD}>加班费</th><th className={TD}>应发</th></> : null}
              <th className={TD}>备注</th>
            </tr>
          </thead>
          <tbody>
            {team ? team.members.map((row) => <tr key={row.person.id}>
              <td className={TD}>{row.person.name}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : row.totals.days}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : row.totals.otHours}</td>
              {wage ? <><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.totals.pay)}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.paidAsOwner)}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.difference)}</td></> : null}
              <td className={TD}>{row.ambiguous ? "姓名重复，历史记录待核对" : row.remark}</td>
            </tr>) : person!.months.map((row) => <tr key={`${row.year}-${row.month}`}>
              <td className={TD}>{row.year}年{row.month}月</td><td className={`${TD} query-number`}>{row.days}</td><td className={`${TD} query-number`}>{row.otHours}</td>
              {wage ? <><td className={`${TD} query-number`}>{money(row.allowance)}</td><td className={`${TD} query-number`}>{money(row.deduction)}</td><td className={`${TD} query-number`}>{money(row.ot)}</td><td className={`${TD} query-number`}>{money(row.pay)}</td></> : null}
              <td className={TD}>{row.remark}</td>
            </tr>)}
          </tbody>
          <tfoot>
            <tr className="font-medium">
              <td className={TD}>区间合计</td><td className={`${TD} query-number`}>{totals.days}</td><td className={`${TD} query-number`}>{totals.otHours}</td>
              {wage ? team ? <><td className={`${TD} query-number`}>{money(totals.pay)}</td><td className={`${TD} query-number`}>{money(team.paidAsOwner)}</td><td className={`${TD} query-number`}>{money(team.difference)}</td></> : <><td className={`${TD} query-number`}>{money(totals.allowance)}</td><td className={`${TD} query-number`}>{money(totals.deduction)}</td><td className={`${TD} query-number`}>{money(totals.ot)}</td><td className={`${TD} query-number`}>{money(totals.pay)}</td></> : null}
              <td className={TD} />
            </tr>
            {wage ? <tr><td className={TD} colSpan={columns}>已记入实际收款人 ¥{money(team?.paidAsOwner ?? person!.paidAsOwner)}（含代发）；差额 ¥{money(team?.difference ?? person!.difference)}。应发按整月考勤计算，发放按所选日期区间计算。</td></tr> : null}
          </tfoot>
        </table>
      </article>
    </div>
  );
}
