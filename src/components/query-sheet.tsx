import { QUERY_TEAM_ATTENDANCE_COLS, QUERY_PERSON_ATTENDANCE_COLS, QUERY_TEAM_WAGE_COLS, QUERY_PERSON_WAGE_COLS } from "~/lib/print-cols";
import { money } from "~/lib/utils";
import { QueryMonthTable } from "~/components/query-month-table";
import { Fragment } from "react";
import { WagePrintRemark, WageAdjustmentHeader, WagePersonGap } from "~/components/wage-calculation";
import { WagePrintTable } from "~/components/wage-print-table";
import { queryWageAdditions } from "~/lib/query-wage";
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
  if (person && !person.recordMonths.length && (!wage || !person.pays.length)) return null;
  const widths = team ? (wage ? QUERY_TEAM_WAGE_COLS : QUERY_TEAM_ATTENDANCE_COLS) : (wage ? QUERY_PERSON_WAGE_COLS : QUERY_PERSON_ATTENDANCE_COLS);
  const columns = widths.length;
  const totals = team?.totals || person!.totals;
  const personMonths = person?.months.filter((month) => month.hasRecord) || [];
  return (
    <div className="print-only text-black">
      {team ? team.months.map((month) => <article key={`${month.year}-${month.month}`} className="query-result-sheet print-doc mb-4">
        <QueryMonthTable month={month} content={content} teamLabel={teamLabel} print />
      </article>) : null}
      {!team && wage ? personMonths.map((month) => <article key={`${month.year}-${month.month}`} className="query-result-sheet print-doc mb-4">
        <WagePrintTable title={`${person!.person.name} · ${month.year}年${month.month}月工资汇总`} standardTitle={`${month.year}年${month.month}月`}
          subjectLabel="年月" subject={`${month.year}年${month.month}月`} row={month} />
      </article>) : null}
      <article className="query-result-sheet print-doc">
        <table className={`${wage ? "query-wage-table " : ""}w-full table-fixed border-collapse text-sm`}>
          <colgroup>{widths.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
          <thead>
            <tr><th className={`${TD} text-left`} colSpan={columns}>
              <div className="text-base font-semibold">{team ? teamLabel : person!.person.name} · {label}{wage ? "工资" : "考勤"}汇总</div>
              <div className="mt-1 font-normal">考勤：{label}（按整月统计）{wage ? `；发放：${paymentLabel}（含起止当日）` : ""}</div>
              {team ? <div className="font-normal">按当前人员档案班组，共 {team.members.length} 人。{team.ambiguousCount ? `其中 ${team.ambiguousCount} 人姓名重复，未计入合计，历史记录待核对。` : ""}</div> : <div className="font-normal">班组：{person!.person.team?.trim() || "未分班组"}</div>}
            </th></tr>
            <tr>
              <th className={TD}>{team ? "姓名" : "年月"}</th><th className={TD}>出勤天数</th><th className={TD}>加班小时</th>
              {wage ? team ? <><th className={TD}>出勤工资</th><th className={TD}>加班工资</th><th className={TD}>应发</th><th className={TD}>已记入实际收款人（含代发）</th><th className={TD}>差额</th></> : <><th className={TD}>出勤工资</th><th className={TD}>加班工资</th><th className={TD}><WageAdjustmentHeader kind="additions" /></th><th className={TD}><WageAdjustmentHeader kind="deduction" /></th><th className={TD}>应发</th></> : null}
              <th className={TD}>备注</th>
            </tr>
          </thead>
          <tbody>
            {team ? team.members.map((row, index) => <Fragment key={row.person.id}>{wage && index > 0 ? <WagePersonGap /> : null}<tr>
              <td className={TD}>{row.person.name}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : row.totals.days}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : row.totals.otHours}</td>
              {wage ? <><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.totals.base)}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.totals.ot)}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.totals.pay)}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.paidAsOwner)}</td><td className={`${TD} query-number`}>{row.ambiguous ? "—" : money(row.difference)}</td></> : null}
              <td className={TD}>{row.ambiguous ? "姓名重复，历史记录待核对" : wage ? <WagePrintRemark remark={row.remark} totals={row.totals} /> : row.remark}</td>
            </tr></Fragment>) : wage ? null : personMonths.map((row) => <Fragment key={`${row.year}-${row.month}`}>
              <tr className={wage ? "query-wage-amount" : undefined}>
              <td className={TD}>{row.year}年{row.month}月</td><td className={`${TD} query-number`}>{row.days}</td><td className={`${TD} query-number`}>{row.otHours}</td>
              {wage ? <><td className={`${TD} query-number`}>{money(row.base)}</td><td className={`${TD} query-number`}>{money(row.ot)}</td><td className={`${TD} query-number`}>{money(queryWageAdditions(row))}</td><td className={`${TD} query-number`}>{money(row.deduction)}</td><td className={`${TD} query-number`}>{money(row.pay)}</td></> : null}
              <td className={TD}>{wage ? <WagePrintRemark remark={row.remark} totals={row} /> : row.remark}</td>
            </tr></Fragment>)}
          </tbody>
          <tfoot>
            <tr className="font-medium">
              <td className={TD}>区间合计</td><td className={`${TD} query-number`}>{totals.days}</td><td className={`${TD} query-number`}>{totals.otHours}</td>
              {wage ? team ? <><td className={`${TD} query-number`}>{money(totals.base)}</td><td className={`${TD} query-number`}>{money(totals.ot)}</td><td className={`${TD} query-number`}>{money(totals.pay)}</td><td className={`${TD} query-number`}>{money(team.paidAsOwner)}</td><td className={`${TD} query-number`}>{money(team.difference)}</td></> : <><td className={`${TD} query-number`}>{money(totals.base)}</td><td className={`${TD} query-number`}>{money(totals.ot)}</td><td className={`${TD} query-number`}>{money(queryWageAdditions(totals))}</td><td className={`${TD} query-number`}>{money(totals.deduction)}</td><td className={`${TD} query-number`}>{money(totals.pay)}</td></> : null}
              <td className={TD}>{wage ? <WagePrintRemark totals={totals} /> : null}</td>
            </tr>
            {wage ? <tr><td className={TD} colSpan={columns}>已记入实际收款人 ¥{money(team?.paidAsOwner ?? person!.paidAsOwner)}（含代发）；差额 ¥{money(team?.difference ?? person!.difference)}。应发按整月考勤计算，发放按所选日期区间计算。</td></tr> : null}
          </tfoot>
        </table>
      </article>
    </div>
  );
}
