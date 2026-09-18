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
 *
 * 1.8.5 三条产品口径决策落在这里的部分：
 * - 决策一：无日期的待发放记录按**当前工作年**归集（`fallbackPayYear` 不再取整本最早年）。
 * - 决策二：本年没有考勤记录、但有已发记录的人**补一行**（备注「本年无考勤记录」），
 *   使年度表逐行「已发」之和 == 总览「已发放」KPI。
 *
 * 1.8.6 纠正（「待发不计，代发要计入实际收款人」）：
 * - 「已发放」= 本年**所有填了发放日期**的记录，按**实际收款人**（`owner`）计入其名下，**含代发**（`isPaid`）；
 *   1.8.5 曾把它限定成「本人收款」（`isPaidSelf`），把代发从已发放里扣掉 —— 那是错的。
 * - 代发（收款人非本人）是**已发的子集** `proxyAmt ⊆ paid`，单列标注，不减 `paid`；
 *   待发放 `pendingAmt` 仍单列不计已发：`paid + pendingAmt = 本年全部发放金额`。
 */
import { derivedYears, monthStatus, paymentsInYear, type YearSources } from "./dates";
import { getWageAt, monthPay, round2 } from "./wage";
import { hasContent } from "./work";
import { groupBuckets } from "./buckets";
import { isPaid, isPending, isProxyPaid } from "./payments-stats";
// 姓名比较键的唯一实现（A-1）：比较**两侧**都要过 nameKey —— 存量数据里「张三 」与「张三」
// 本来是同一个人的两行（年度表拆行、出勤静默归零），本文件不许再写裸 `a.name === person.name`
import { nameKey, ownerKey } from "./receiver";
import type { AttendanceRow, Payment, Person } from "./types";

/** 年度表里「本年没有考勤记录、但有已发记录」那一行的备注（决策二） */
export const NO_ATTENDANCE_REMARK = "本年无考勤记录";

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
  /** 已发（按实际收款人计入，**含代发**）：所有填了发放日期的记录都算 */
  paid: number;
  unpaid: number;
  /** 本年是否有内容（有工天/加班/补助/扣款，或只有备注） */
  worked: boolean;
  /** 本行是不是「本年无考勤记录」的补行（决策二）：工天加班表不列它 */
  noAttendance: boolean;
  /** 表格备注列：普通行空串；补行写 `NO_ATTENDANCE_REMARK` */
  remark: string;
}

export interface YearSummary {
  rows: YearPersonRow[];
  /** 应发合计（= 各人全年之和 = 总览 KPI） */
  should: number;
  /** 已发放 = 本年所有填了发放日期的记录（按实际收款人，**含代发**；1.8.6 纠正） */
  paid: number;
  /** 年度表逐行「已发」之和（决策二起必须 == paid） */
  rowsPaidSum: number;
  /** 安全网：本年有已发记录、但没能落到任何一行的人与钱（决策二后恒为 0） */
  offRowsPaid: { count: number; amount: number };
  /** 代发（代收）：有发放日期但收款人非本人 —— **已发的子集**（⊆ paid），单列标注，不减 paid */
  proxyAmt: number;
  proxyCount: number;
  /** 待发放（无发放日期）—— 不算已发 */
  pendingAmt: number;
  /** 本年有内容的月份数（0–12） */
  filledMonths: number;
}

/**
 * 无日期的待发放记录归到哪一年：**当前工作年**（= `store.year`，决策一 1.8.5）。
 * 旧口径取「整本台账最早的一年」：同一笔待发放会跑到用户看不见的年份，
 * 与「当前工作年」不一致。唯一实现，页面不许各写一套。
 */
export function fallbackPayYear(s: YearSources): number {
  const y = Number(s.year);
  if (y >= 2000 && y <= 2100) return y;
  const years = derivedYears(s);
  return years[years.length - 1] ?? new Date().getFullYear();
}

/** 某年有内容的月份数（月度卡「已录入 / 空表」与「已录月份 X / 12」的唯一口径） */
export function filledMonthsOf(attendance: { year: number; month: number }[], year: number): number {
  return Array.from({ length: 12 }, (_, i) => monthStatus(attendance as any, year, i + 1).filled > 0).filter(Boolean).length;
}

/** 一个人的 12 个月（同月多行累加；工资金额走 wage.ts 的唯一算法） */
export function personMonths(person: Person, attendance: AttendanceRow[], year: number): MonthCell[] {
  const mine = attendance.filter((a) => a.year === year && nameKey(a.name) === nameKey(person.name));
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
 * - `rows` 列本年**有内容**的人 **+ 本年有已发记录但一次考勤都没有的人**
 *   （决策二：补一行、备注写「本年无考勤记录」，让逐行之和 == 总览「已发放」KPI）；
 * - 不在人员表里的考勤行（已删人员/手写名字）不进 rows，也不进 should —— 与旧口径一致；
 * - `should/paid/pendingAmt/proxyAmt/proxyCount` 与该年 `rows` 同源，保证总览与考勤页对得上。
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
  // 已发的唯一判定：lib/payments-stats.ts 的 isPaid（有发放日期即算，按实际收款人，**含代发** —— 1.8.6）
  const paidRows = yearPay.filter(isPaid);
  // 每次汇总只建一次索引，避免每个人都扫描整本多年考勤/发放。
  // 桶内保留原顺序与重复行，金额相加顺序和历史口径保持一致。
  const attendanceByName = new Map<string, AttendanceRow[]>();
  for (const a of attendance) {
    if (a.year !== year) continue;
    const key = nameKey(a.name);
    const bucket = attendanceByName.get(key);
    if (bucket) bucket.push(a);
    else attendanceByName.set(key, [a]);
  }
  const paidByName = new Map<string, number>();
  for (const p of paidRows) {
    const key = ownerKey(p);
    paidByName.set(key, (paidByName.get(key) ?? 0) + p.amount);
  }
  const peopleByName = new Map<string, Person>();
  for (const p of people) {
    const key = nameKey(p.name);
    if (!peopleByName.has(key)) peopleByName.set(key, p);
  }
  const rows: YearPersonRow[] = [];
  for (const person of people) {
    const key = nameKey(person.name);
    const mine = attendanceByName.get(key) ?? [];
    const worked = mine.some(hasContent);
    if (!worked) continue;
    const months = personMonths(person, mine, year);
    const yearPayAmt = months.reduce((s, m) => s + m.pay, 0);
    const yearDays = months.reduce((s, m) => s + m.days, 0);
    const yearOt = months.reduce((s, m) => s + m.otHours, 0);
    const paid = paidByName.get(key) ?? 0;
    rows.push({
      person,
      months,
      yearPayAmt,
      yearDays,
      yearOt,
      paid,
      unpaid: yearPayAmt - paid,
      worked,
      noAttendance: false,
      remark: "",
    });
  }
  // 决策二：本年没有考勤内容、却有已发记录的人，补一行（全年 0、已发照实列、未发为负数）
  const rowNames = new Set(rows.map((r) => nameKey(r.person.name)));
  const orphans = new Map<string, number>();
  for (const p of paidRows) {
    const name = ownerKey(p);
    if (rowNames.has(name)) continue;
    orphans.set(name, (orphans.get(name) || 0) + (p.amount || 0));
  }
  const zeroMonths = (): MonthCell[] => Array.from({ length: 12 }, () => ({ days: 0, pay: 0, otHours: 0, allowance: 0, deduction: 0 }));
  const orphanRows: YearPersonRow[] = [...orphans.entries()]
    .map(([name, amount]) => {
      const paid = round2(amount);
      const known = peopleByName.get(name);
      const person: Person =
        known ?? {
          id: `pay-only:${name}`,
          name,
          team: "",
          personNo: "",
          idCard: "",
          gender: "",
          age: 0,
          birthday: "",
          phone: "",
          dailyWage: 0,
          monthWage: 0,
          payType: "day",
          otRule: "",
          mealAllowance: 0,
          bank: "",
          cardNo: "",
          address: "",
          idIssuer: "",
          idValidFrom: "",
          idValidTo: "",
          remark: "",
        };
      return {
        person,
        months: zeroMonths(),
        yearPayAmt: 0,
        yearDays: 0,
        yearOt: 0,
        paid,
        unpaid: -paid,
        worked: false,
        noAttendance: true,
        remark: NO_ATTENDANCE_REMARK,
      };
    })
    .sort((a, b) => b.paid - a.paid || a.person.name.localeCompare(b.person.name, "zh"));
  rows.push(...orphanRows);
  const rowsPaidSum = round2(rows.reduce((s, r) => s + r.paid, 0));
  const paidTotal = round2(paidRows.reduce((s, p) => s + p.amount, 0));
  // 安全网（决策二后恒为空）：已发记录没能落到任何一行的人与钱。正常不再触发，留着兜底。
  const includedNames = new Set(rows.map((r) => nameKey(r.person.name)));
  const offRows = paidRows.filter((p) => !includedNames.has(ownerKey(p)));
  const proxyRows = paidRows.filter(isProxyPaid);
  return {
    rows,
    should: round2(rows.reduce((s, r) => s + r.yearPayAmt, 0)),
    // 已发放 = 本年所有有日期的发放（按实际收款人，含代发；1.8.6 纠正）。
    // 代发 proxyAmt 是它的**子集**（⊆ paid），待发放 pendingAmt 单列不计已发：
    // paid + pendingAmt = 本年全部发放金额。
    paid: paidTotal,
    rowsPaidSum,
    offRowsPaid: {
      count: offRows.length,
      amount: round2(offRows.reduce((s, p) => s + p.amount, 0)),
    },
    proxyAmt: round2(proxyRows.reduce((s, p) => s + p.amount, 0)),
    proxyCount: proxyRows.length,
    pendingAmt: round2(yearPay.filter(isPending).reduce((s, p) => s + p.amount, 0)),
    filledMonths: filledMonthsOf(attendance, year),
  };
}

/**
 * 班组面板的分组（含「未分班组」那一桶）。
 * 旧写法 `[...new Set(people.map(p => p.team).filter(Boolean))]` 把没填班组的人从面板里
 * 静默删掉：面板人数之和 < 「在册人员」KPI，分组口径和列表口径对不上。
 */
export function teamRows(people: Pick<Person, "team">[]): { team: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of people) {
    const key = String(p.team ?? "").trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return groupBuckets(
    people.map((p) => p.team),
    "未分班组",
  )
    .map((b) => ({
      team: b.label,
      count: counts.get(b.value) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team, "zh"));
}
