import type { QueryWageCalculation } from "~/lib/query-wage";
import { queryWageTotal } from "~/lib/query-wage";
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
