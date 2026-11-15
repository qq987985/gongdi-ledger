import type { QueryWageCalculation } from "~/lib/query-wage";
import { queryWageTotal, queryWageRoundingNote } from "~/lib/query-wage";
import type { QueryTotals } from "~/lib/query-data";

export function WageCalculation({ title, calculation }: { title: string; calculation?: QueryWageCalculation }) {
  if (!calculation) return null;
  return <div className="wage-calculation space-y-1 whitespace-normal break-words text-left text-sm">
    <div className="font-medium">{title} · 工资计算</div>
    <div>{calculation.standard}</div>
    <div>出勤工资：{calculation.attendance}</div>
    <div>加班工资：{calculation.overtime}</div>
    <div>餐补：{calculation.meal}；{calculation.adjustment}</div>
    <div className="font-medium">应发：{calculation.total}</div>
    <div className="text-xs">{calculation.note}</div>
  </div>;
}

export function WageTotalCalculation({ totals }: { totals: QueryTotals }) {
  return <div className="wage-calculation whitespace-normal break-words text-left text-sm">应发合计：{queryWageTotal(totals)}</div>;
}

/** 标准置于金额行上方，与下一行金额一起阅读，不打印计算长段。 */
export function WageStandardRow({ title, calculation, cellClass }: { title: string; calculation?: QueryWageCalculation; cellClass: string }) {
  if (!calculation) return null;
  const { table } = calculation;
  return <tr className="query-wage-standard">
    <td className={cellClass} colSpan={3}>{title} · {table.wage}</td>
    <td className={cellClass} colSpan={6}>{table.overtime}</td>
  </tr>;
}

export function WagePersonGap() {
  return <tr className="query-person-gap" aria-hidden="true"><td colSpan={9} /></tr>;
}

export function WagePrintRemark({ remark, totals }: { remark?: string; totals: QueryTotals }) {
  const note = queryWageRoundingNote(totals);
  return <>{remark}{note ? <span className="block">{note}</span> : null}</>;
}

/** 窄列按完整词换行，避免把“餐补”“扣款”拆成单字。 */
export function WageAdjustmentHeader({ kind }: { kind: "additions" | "deduction" }) {
  return kind === "additions" ? <>补助<br/><span className="whitespace-nowrap">含餐补</span></> : <>罚款/<br/><span className="whitespace-nowrap">扣款</span></>;
}
