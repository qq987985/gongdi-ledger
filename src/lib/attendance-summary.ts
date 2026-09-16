/**
 * 考勤年度汇总与「应发/已发/待发」的唯一实现（口径一致性专项 20260916）。
 *
 * 从 `src/routes/attendance.tsx` 的 YearOverview 与 `src/routes/index.tsx` 的 KPI
 * 按行段机械提取（§12.1）。抽出来的目的很具体：
 *
 * 总览 KPI「应发合计 / 已发放 / 待发放」和考勤页「年度工资汇总」的全年/已发/未发
 * 本来是两段各写一遍的循环，条件稍有差别就会对不上（例如「无日期的旧发放算哪一年」
 * 在两处用的 fallbackYear 不同：总览取整本台账最早的一年，考勤页只用该年+考勤年份，
 * 于是同一年的「待发放」两处数字不一样；已录月份与人员是否入列也曾用两套「有内容」判定）。
 * 现在两处都调用本模块，数字由构造保证一致。
 */
import { derivedYears, monthStatus, paymentsInYear, type YearSources } from "./dates";
import { getWageAt, monthPay } from "./wage";
import { hasContent } from "./work";
import { groupBuckets } from "./buckets";
import type { AttendanceRow, Payment, Person } from "./types";

export interface MonthCell {
  days: number;
  pay: number;
  otHours: number;
  allowance: number;
  deduction: number;
}

export interface YearPersonRow {
  person: Person;
  /** 12 个月（1–12 月，下标 0–11）；同月重复行会累加，与月度表逐行相加一致 */
  months: MonthCell[];
  yearPayAmt: number;
  yearDays: number;
  yearOt: number;
  paid: number;
  unpaid: number;
  /** 本年是否有内容（有工天/加班/补助/扣款，或只有备注） */
  worked: boolean;
}

export interface YearSummary {
  rows: YearPersonRow[];
  /** 应发合计（= 各人全年之和 = 总览 KPI） */
  should: number;
  /** 已发放（只认有发放日期的记录；含发给「本年没有考勤内容」的人） */
  paid: number;
  /** 年度表逐行「已发」之和（是 paid 的子集） */
  rowsPaidSum: number;
  /** 本年有已发、但不在年度表里的人与钱 —— 显式暴露差额，不让它对不上还看不出来 */
  offRowsPaid: { count: number; amount: number };
  /** 待发放（无发放日期） */
  pendingAmt: number;
  proxyCount: number;
  /** 本年有内容的月份数（0–12） */
  filledMonths: number;
}

/** 无日期的旧发放归到哪一年：整本台账里最早的一年（唯一实现，页面不许各写一套） */
export function fallbackPayYear(s: YearSources): number {
  return derivedYears(s)[0] ?? new Date().getFullYear();
}

/** 某年有内容的月份数（月度卡「已录入 / 空表」与「已录月份 X / 12」的唯一口径） */
export function filledMonthsOf(attendance: { year: number; month: number }[], year: number): number {
  return Array.from({ length: 12 }, (_, i) => monthStatus(attendance as any, year, i + 1).filled > 0).filter(Boolean).length;
}

/** 一个人的 12 个月（同月多行累加；工资金额走 wage.ts 的唯一算法） */
export function personMonths(person: Person, attendance: AttendanceRow[], year: number): MonthCell[] {
  const mine = attendance.filter((a) => a.year === year && a.name === person.name);
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const rows = mine.filter((a) => a.month === month);
    if (!rows.length) return { days: 0, pay: 0, otHours: 0, allowance: 0, deduction: 0 };
    const wage = getWageAt(person, year, month);
    return rows.reduce<MonthCell>(
      (acc, a) => {
        const calc = monthPay(a, wage);
        return {
          days: acc.days + calc.days,
          pay: acc.pay + calc.pay,
          otHours: acc.otHours + calc.otHours,
          allowance: acc.allowance + calc.allowance,
          deduction: acc.deduction + calc.deduction,
        };
      },
      { days: 0, pay: 0, otHours: 0, allowance: 0, deduction: 0 },
    );
  });
}

/**
 * 年度汇总：总览 KPI 与考勤页年度表共用。
 * - `rows` 只列本年**有内容**的人（没上班的不显示，页面上是这么写的）；
 * - 不在人员表里的考勤行（已删人员/手写名字）不进 rows，也不进 should —— 与旧口径一致；
 * - `should/paid/pendingAmt/proxyCount` 与该年 `rows` 同源，保证总览与考勤页对得上。
 */
export function summarizeYear(args: {
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  year: number;
  fallbackYear: number;
}): YearSummary {
  const { people, attendance, payments, year, fallbackYear } = args;
  const yearPay = paymentsInYear(payments, year, fallbackYear);
  const rows: YearPersonRow[] = [];
  for (const person of people) {
    const months = personMonths(person, attendance, year);
    const yearPayAmt = months.reduce((s, m) => s + m.pay, 0);
    const yearDays = months.reduce((s, m) => s + m.days, 0);
    const yearOt = months.reduce((s, m) => s + m.otHours, 0);
    const paid = yearPay.filter((x) => x.owner === person.name && x.date).reduce((s, x) => s + x.amount, 0);
    const worked = attendance.some((a) => a.year === year && a.name === person.name && hasContent(a));
    if (!worked) continue;
    rows.push({
      person,
      months,
      yearPayAmt,
      yearDays,
      yearOt,
      paid,
      unpaid: yearPayAmt - paid,
      worked,
    });
  }
  const rowsPaidSum = rows.reduce((s, r) => s + r.paid, 0);
  const paidRows = yearPay.filter((p) => p.date);
  const paidTotal = paidRows.reduce((s, p) => s + p.amount, 0);
  const offRows = paidRows.filter((p) => !rows.some((r) => r.person.name === p.owner));
  return {
    rows,
    should: rows.reduce((s, r) => s + r.yearPayAmt, 0),
    // 已发放 = 本年**全部**有日期的发放（换人不看有没有考勤：钱打出去了就不能从 KPI 里消失）。
    // 年度表逐行的「已发」之和是它的子集，差额用 offRowsPaid 显式暴露，页面会提示一句。
    paid: paidTotal,
    rowsPaidSum,
    offRowsPaid: {
      count: offRows.length,
      amount: offRows.reduce((s, p) => s + p.amount, 0),
    },
    pendingAmt: yearPay.filter((p) => !p.date).reduce((s, p) => s + p.amount, 0),
    proxyCount: yearPay.filter((p) => p.date && p.owner !== p.receiver).length,
    filledMonths: filledMonthsOf(attendance, year),
  };
}

/**
 * 班组面板的分组（含「未分班组」那一桶）。
 * 旧写法 `[...new Set(people.map(p => p.team).filter(Boolean))]` 把没填班组的人从面板里
 * 静默删掉：面板人数之和 < 「在册人员」KPI，分组口径和列表口径对不上。
 */
export function teamRows(people: Pick<Person, "team">[]): { team: string; count: number }[] {
  return groupBuckets(
    people.map((p) => p.team),
    "未分班组",
  )
    .map((b) => ({
      team: b.label,
      count: people.filter((p) => String(p.team ?? "").trim() === b.value).length,
    }))
    .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team, "zh"));
}
