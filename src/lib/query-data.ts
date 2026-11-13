import { daysInMonth, parseDateYmd, ymKey, ymd } from "./dates";
import { inBucket } from "./buckets";
import { isPaid, isPaidSelf, nameKey, ownerKey, receiverOf } from "./payments-stats";
import { getWageAt, monthPay, round2, type MonthPayResult } from "./wage";
import { hasContent } from "./work";
import type { AttendanceRow, Payment, Person } from "./types";

export type QueryContent = "attendance" | "wage";
export interface QueryDate { year: number; month: number; day: number }
export interface QueryMonthRef { year: number; month: number }
export interface QueryRange {
  span: QueryMonthRef[];
  startDate: string;
  endDate: string;
  swapped: boolean;
}

/** 考勤取整月；发放取规范化后的闭区间，连同日一起对调反向范围。 */
export function queryRange(from: QueryDate, to: QueryDate): QueryRange {
  const dateOf = (v: QueryDate) => ymd(v.year, v.month, Math.min(v.day, daysInMonth(v.year, v.month)));
  const a = dateOf(from);
  const b = dateOf(to);
  if (!a || !b) return { span: [], startDate: "", endDate: "", swapped: false };
  const swapped = a > b;
  const startDate = swapped ? b : a;
  const endDate = swapped ? a : b;
  const lo = swapped ? to : from;
  const hi = swapped ? from : to;
  const span: QueryMonthRef[] = [];
  for (let key = ymKey(lo.year, lo.month); key <= ymKey(hi.year, hi.month); key++) {
    span.push({ year: Math.floor((key - 1) / 12), month: ((key - 1) % 12) + 1 });
  }
  return { span, startDate, endDate, swapped };
}

export type QueryTotals = Pick<MonthPayResult, "days" | "otHours" | "base" | "ot" | "meal" | "allowance" | "deduction" | "pay">;
export interface QueryMonth extends QueryTotals, QueryMonthRef {
  remark: string;
  hasContent: boolean;
}
export interface QueryPersonResult {
  person: Person;
  /** 同名人员的历史姓名关联不能可靠区分，保留人员行但不猜测分摊。 */
  ambiguous: boolean;
  months: QueryMonth[];
  totals: QueryTotals;
  pays: Payment[];
  paidAsOwner: number;
  difference: number;
  paidSelf: number;
  collected: number;
  proxyOut: number;
  remark: string;
}

const emptyTotals = (): QueryTotals => ({ days: 0, otHours: 0, base: 0, ot: 0, meal: 0, allowance: 0, deduction: 0, pay: 0 });

function sumTotals(rows: QueryTotals[]): QueryTotals {
  const out = rows.reduce((sum, row) => {
    for (const field of Object.keys(sum) as (keyof QueryTotals)[]) sum[field] += row[field];
    return sum;
  }, emptyTotals());
  for (const field of ["base", "ot", "meal", "allowance", "deduction", "pay"] as const) out[field] = round2(out[field]);
  return out;
}

const sumPayments = (rows: Payment[]) => round2(rows.reduce((sum, row) => sum + (row.amount || 0), 0));

/** 屏幕与工资条共用结果；同月重复行逐行 monthPay 后累加，与 personMonths 一致。 */
export function buildQueryResults(args: {
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  range: QueryRange;
}): QueryPersonResult[] {
  const { people, attendance, payments, range } = args;
  const counts = new Map<string, number>();
  for (const person of people) counts.set(nameKey(person.name), (counts.get(nameKey(person.name)) || 0) + 1);
  const monthKeys = new Set(range.span.map(({ year, month }) => ymKey(year, month)));
  const attendanceByName = new Map<string, AttendanceRow[]>();
  for (const row of attendance) {
    if (!monthKeys.has(ymKey(row.year, row.month))) continue;
    const key = nameKey(row.name);
    const mine = attendanceByName.get(key) || [];
    mine.push(row);
    attendanceByName.set(key, mine);
  }
  const datedPayments = payments.flatMap((row) => {
    const date = parseDateYmd(row.date);
    if (!isPaid(row) || !date || date < range.startDate || date > range.endDate) return [];
    return [{ ...row, date }];
  }).sort((a, b) => a.date.localeCompare(b.date));
  const paymentsByName = new Map<string, Payment[]>();
  for (const row of datedPayments) {
    for (const key of new Set([ownerKey(row), receiverOf(row)])) {
      const mine = paymentsByName.get(key) || [];
      mine.push(row);
      paymentsByName.set(key, mine);
    }
  }
  return people.map((person) => {
    const key = nameKey(person.name);
    const ambiguous = !key || (counts.get(key) || 0) > 1;
    const mine = ambiguous ? [] : attendanceByName.get(key) || [];
    const months = ambiguous ? [] : range.span.map(({ year, month }): QueryMonth => {
      const rows = mine.filter((row) => row.year === year && row.month === month);
      const wage = getWageAt(person, year, month);
      return {
        year, month,
        ...sumTotals(rows.map((row) => monthPay(row, wage))),
        remark: rows.map((row) => row.remark || "").filter((remark) => remark.trim()).join("；"),
        hasContent: rows.some((a) => hasContent(a)),
      };
    });
    const pays = ambiguous ? [] : paymentsByName.get(key) || [];
    const totals = sumTotals(months);
    const ownerPays = pays.filter((row) => ownerKey(row) === key);
    const paidAsOwner = sumPayments(ownerPays);
    return {
      person, ambiguous, months, totals, pays, paidAsOwner,
      difference: round2(totals.pay - paidAsOwner),
      paidSelf: sumPayments(ownerPays.filter(isPaidSelf)),
      collected: sumPayments(pays.filter((row) => ownerKey(row) !== key)),
      proxyOut: sumPayments(ownerPays.filter((row) => !isPaidSelf(row))),
      remark: months.filter((row) => row.remark).map((row) => `${row.year}年${row.month}月：${row.remark}`).join("；"),
    };
  });
}

export function queryTeamResults(results: QueryPersonResult[], team: string) {
  const members = results.filter((row) => inBucket(row.person.team, team));
  const totals = sumTotals(members.map((row) => row.totals));
  const paidAsOwner = round2(members.reduce((sum, row) => sum + row.paidAsOwner, 0));
  return {
    members, totals, paidAsOwner,
    difference: round2(totals.pay - paidAsOwner),
    ambiguousCount: members.filter((row) => row.ambiguous).length,
  };
}

/** 打印范围每次由当前班组重新约束，不能携带前一班组的勾选。 */
export function queryPrintResults(results: QueryPersonResult[], ids: string[], team?: string): QueryPersonResult[] {
  const selected = new Set(ids);
  return results.filter((row) => selected.has(row.person.id) && !row.ambiguous && (team === undefined || inBucket(row.person.team, team)));
}

export function buildQuerySlips(results: QueryPersonResult[]) {
  return results.flatMap((row) => {
    const months = row.months.filter((month) => month.hasContent);
    if (row.ambiguous || (!months.length && !row.pays.length)) return [];
    return [{
      person: row.person,
      hasHistory: (row.person.wageHistory || []).some((history) => (history.fromDate || "").trim() !== ""),
      months,
      totals: row.totals,
      total: row.totals.pay,
      pays: row.pays,
      paid: row.paidSelf,
      unpaidSelf: round2(row.totals.pay - row.paidSelf),
      collected: row.collected,
      proxyOut: row.proxyOut,
    }];
  });
}
export type QuerySlip = ReturnType<typeof buildQuerySlips>[number];
