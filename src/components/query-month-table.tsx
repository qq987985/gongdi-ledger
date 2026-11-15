import { Button } from "~/components/ui/button";
import { Fragment } from "react";
import { WageCalculation, WageTotalCalculation } from "~/components/wage-calculation";
import type { QueryContent, QueryTeamMonth } from "~/lib/query-data";
import { QUERY_PERSON_WAGE_COLS, QUERY_TEAM_ATTENDANCE_COLS } from "~/lib/print-cols";
import { money } from "~/lib/utils";

/** 班组各月汇总的屏幕与打印共用表；只排版纯函数给出的行和本月小计。 */
export function QueryMonthTable({ month, content, teamLabel, print = false, onPerson }: {
  month: QueryTeamMonth;
  content: QueryContent;
  teamLabel: string;
  print?: boolean;
  onPerson?: (id: string) => void;
}) {
  const wage = content === "wage";
  const widths = wage ? QUERY_PERSON_WAGE_COLS : QUERY_TEAM_ATTENDANCE_COLS;
  const cell = print ? "border border-black px-1 py-1" : "";
  const number = `${cell} tabular-nums query-number`;
  const totals = month.totals;
  return <><table data-query-month={`${month.year}-${String(month.month).padStart(2, "0")}`} className={`${wage ? "query-wage-table " : ""}${print ? "w-full table-fixed border-collapse text-sm" : "fit-table query-results-table text-left text-sm"}`}>
    {print ? <colgroup>{widths.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup> : null}
    <thead>
      <tr><th colSpan={wage ? 9 : 4} className={`${cell} text-left`}>
        <span className="font-semibold">{teamLabel} · {month.year}年{month.month}月{wage ? "工资" : "考勤"}汇总</span>
      </th></tr>
      <tr className={print ? "" : "text-xs text-muted"}>
        <th className={cell}>姓名</th><th className={cell}>出勤天数</th><th className={cell}>加班小时</th>
        {wage ? <><th className={cell}>出勤工资</th><th className={cell}>其他补助</th><th className={cell}>罚款/扣款</th><th className={cell}>加班工资</th><th className={cell}>应发</th></> : null}
        <th className={cell}>备注</th>
      </tr>
    </thead>
    <tbody>{month.rows.map(({ person, ambiguous, month: row }) => <Fragment key={person.id}><tr className={print ? "" : "border-t border-line"}>
      <td className={cell}>{onPerson ? <Button variant="ghost" size="sm" type="button" onClick={() => onPerson(person.id)}>{person.name}</Button> : person.name}</td>
      <td className={number}>{ambiguous ? "—" : row.days}</td><td className={number}>{ambiguous ? "—" : row.otHours}</td>
      {wage ? <><td className={number}>{ambiguous ? "—" : money(row.base)}</td><td className={number}>{ambiguous ? "—" : money(row.allowance)}</td><td className={number}>{ambiguous ? "—" : money(row.deduction)}</td><td className={number}>{ambiguous ? "—" : money(row.ot)}</td><td className={number}>{ambiguous ? "—" : money(row.pay)}</td></> : null}
      <td className={cell}>{ambiguous ? "姓名重复，历史记录待核对" : row.remark}</td>
    </tr>{wage && print && !ambiguous && row.calculation ? <tr><td className={cell} colSpan={9}><WageCalculation title={`${person.name} · ${month.year}年${month.month}月`} calculation={row.calculation} /></td></tr> : null}</Fragment>)}</tbody>
    <tfoot><tr className={print ? "font-medium" : "border-t border-line font-medium"}>
      <td className={cell}>本月小计</td><td className={number}>{totals.days}</td><td className={number}>{totals.otHours}</td>
      {wage ? <><td className={number}>{money(totals.base)}</td><td className={number}>{money(totals.allowance)}</td><td className={number}>{money(totals.deduction)}</td><td className={number}>{money(totals.ot)}</td><td className={number}>{money(totals.pay)}</td></> : null}
      <td className={cell} />
    </tr>{wage && print ? <tr><td className={cell} colSpan={9}><WageTotalCalculation totals={totals} /></td></tr> : null}</tfoot>
  </table>{wage && !print ? <div className="space-y-4 p-3">{month.rows.filter(({ ambiguous, month: row }) => !ambiguous && row.calculation).map(({ person, month: row }) => <WageCalculation key={person.id} title={`${person.name} · ${month.year}年${month.month}月`} calculation={row.calculation} />)}<WageTotalCalculation totals={totals} /></div> : null}</>;
}
