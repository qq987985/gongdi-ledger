import { localToday } from "~/lib/dates";
import { MONTH_TEAM_COLS } from "~/lib/print-cols";
import type { MonthTeamTable } from "~/lib/attendance-month";

/** 只排版已经按月表分组的工天/加班，不在打印件里计算或显示工资。 */
export function AttendanceTeamSheet({ year, month, tables, dirty }: {
  year: number; month: number; tables: MonthTeamTable[]; dirty: boolean;
}) {
  if (!tables.length) return null;
  const cell = "border border-black px-2 py-1";
  return <div className="print-only attendance-team-sheet text-black">
    {tables.map((table) => <section key={table.team} className="print-doc mb-4 last:mb-0">
      <table className="w-full table-fixed border-collapse text-center">
        <colgroup>{MONTH_TEAM_COLS.map((width, i) => <col key={i} style={{ width: `${width}%` }} />)}</colgroup>
        <thead>
          <tr><th colSpan={4} className={`${cell} py-2`}>
            <h2 className="text-lg font-semibold">{year}年{month}月班组考勤</h2>
            <p className="mt-1 font-normal">班组：{table.label} · 本表 {table.totals.people} 人 · 打印 {localToday()}</p>
            {dirty && <p className="mt-1 text-sm font-normal">含未保存的修改</p>}
          </th></tr>
          <tr>{["序号", "姓名", "出勤天数（天）", "加班小时（小时）"].map((title) => <th key={title} className={`${cell} font-medium`}>{title}</th>)}</tr>
        </thead>
        <tbody>{table.rows.map((row, i) => <tr key={`${row.name}-${i}`}>
          <td className={cell}>{i + 1}</td><td className={`${cell} break-words`}>{row.name}</td>
          <td className={`${cell} tabular-nums`}>{row.days}</td><td className={`${cell} tabular-nums`}>{row.otHours}</td>
        </tr>)}</tbody>
        <tfoot><tr className="font-semibold"><td colSpan={2} className={cell}>班组合计 {table.totals.people} 人</td>
          <td className={`${cell} tabular-nums`}>{table.totals.days}</td><td className={`${cell} tabular-nums`}>{table.totals.otHours}</td>
        </tr></tfoot>
      </table>
    </section>)}
  </div>;
}
