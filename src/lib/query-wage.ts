import { foldDaily, isMonthly, parseOtRule, round2, type MonthPayResult, type WageSource } from "./wage";
import { money } from "./utils";

type WageTotals = Pick<MonthPayResult, "days" | "otHours" | "base" | "ot" | "meal" | "allowance" | "deduction" | "pay">;
const rate = (value: number) => round2(value) === value ? money(value) : String(value);
export interface QueryWageCalculation {
  table: { wage: string; overtimeRate: string; overtimeRule: string };
  standard: string;
  attendance: string;
  overtime: string;
  meal: string;
  adjustment: string;
  total: string;
  note: string;
}

/** 打印将餐补并入补助列，保留原分项计价和应发。 */
export function queryWageAdditions(totals: Pick<WageTotals, "allowance" | "meal">): number {
  return round2(totals.allowance + totals.meal);
}

function roundingDifference(totals: WageTotals): number {
  return round2(totals.pay - round2(totals.base + totals.ot + totals.meal + totals.allowance - totals.deduction));
}

/** 仅在分项取分与逐笔应发存在差额时，给打印备注一个短注。 */
export function queryWageRoundingNote(totals: WageTotals): string {
  const delta = roundingDifference(totals);
  return delta ? `取分差额 ${delta > 0 ? "+" : "−"}¥${money(Math.abs(delta))}` : "";
}

/** 金额复用既有逐笔结果；分项累计的取分差额显式列出，不改应发计算。 */
export function queryWageTotal(totals: WageTotals): string {
  const adjustment = roundingDifference(totals);
  const rounding = adjustment ? ` ${adjustment > 0 ? "+" : "−"} ¥${money(Math.abs(adjustment))}（逐笔取分差额）` : "";
  return `¥${money(totals.base)}（出勤） + ¥${money(totals.ot)}（加班） + ¥${money(totals.meal)}（餐补） + ¥${money(totals.allowance)}（其他补助） − ¥${money(totals.deduction)}（罚款/扣款）${rounding} = ¥${money(totals.pay)}`;
}

/** 解释当月生效的标准及实际计算，不以汇总天数重算重复考勤。 */
export function buildQueryWageCalculation(wage: WageSource, entries: MonthPayResult[], totals: WageTotals): QueryWageCalculation {
  const monthly = isMonthly(wage);
  const daily = wage.dailyWage || 0;
  const fold = foldDaily(wage);
  const ot = parseOtRule(wage.otRule);
  const many = entries.length > 1;
  const count = entries.filter((row) => row.base !== 0).length;
  const standard = monthly
    ? `月工资 ¥${rate(wage.monthWage || 0)}/月；加班折算日工资 ¥${rate(fold)}/天${daily ? "（采用填写的日工资）" : "（月工资÷30，取到分）"}`
    : `日工资 ¥${rate(daily)}/天${daily ? "" : "（未设置日工资）"}`;
  const attendance = !entries.length ? "无考勤记录，出勤工资 ¥0.00"
    : monthly ? (count ? `月工资 ¥${rate(wage.monthWage || 0)} × ${count} 笔计薪考勤 = ¥${money(totals.base)}` : `本月未产生月薪基数，出勤工资 ¥${money(totals.base)}`)
    : many ? `${entries.length} 笔考勤分别按 ¥${rate(daily)}/天计算后合计 ¥${money(totals.base)}（总出勤 ${totals.days} 天）`
    : `${totals.days} 天 × ¥${rate(daily)}/天 = ¥${money(totals.base)}`;
  const method = ot.kind === "hour" ? `¥${rate(ot.param)}/小时` : ot.kind === "fold" ? `每 ${ot.param} 小时折算 1 天，日工资 ¥${rate(fold)}` : ot.label;
  const overtime = ot.kind === "none" ? `${method}；按现行规则不计加班工资，${totals.otHours} 小时 = ¥${money(totals.ot)}`
    : many ? `${entries.length} 笔加班分别按「${method}」计算后合计 ¥${money(totals.ot)}（总加班 ${totals.otHours} 小时）`
    : ot.kind === "hour" ? `${totals.otHours} 小时 × ¥${rate(ot.param)}/小时 = ¥${money(totals.ot)}`
    : `${totals.otHours} 小时 ÷ ${ot.param} 小时/天 × ¥${rate(fold)}/天 = ¥${money(totals.ot)}`;
  const meal = many ? `${entries.length} 笔餐补分别按 ¥${rate(wage.mealAllowance || 0)}/天计算后合计 ¥${money(totals.meal)}`
    : `${totals.days} 天 × ¥${rate(wage.mealAllowance || 0)}/天 = ¥${money(totals.meal)}`;
  return {
    table: {
      wage: monthly ? `月工资 ¥${rate(wage.monthWage || 0)}/月${daily ? `；日工资 ¥${rate(daily)}/天` : ""}` : `日工资 ¥${rate(daily)}/天`,
      overtimeRate: ot.kind === "fold" ? `折算日工资 ¥${rate(fold)}/天` : ot.kind === "hour" ? `加班单价 ¥${rate(ot.param)}/小时` : "不计加班工资",
      overtimeRule: ot.kind === "fold" ? `加班折算 ${ot.param} 小时/天` : ot.kind === "hour" ? "加班按小时" : wage.otRule?.trim() ? ot.label : "加班未设",
    },
    standard, attendance, overtime, meal,
    adjustment: `其他补助 ¥${money(totals.allowance)}；罚款/扣款 ¥${money(totals.deduction)}`,
    total: queryWageTotal(totals),
    note: many ? `${entries.length} 笔考勤逐笔计价、取分后合计，不能用汇总天数或小时重新计价。` : "金额按现行规则取到分。",
  };
}
