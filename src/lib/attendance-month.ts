/**
 * 考勤月表的**合计口径**与「年度汇总行 → 分月表」的重排（1.8.15 三处打印入口专项）。
 *
 * 为什么单独成模块（口径一致性专项 20260916 的同一套理由）：
 * 打印件不许自己算 —— 纸上出现屏幕以外的数字，用户就会在两份东西上看到不一致。
 * 所以：
 *  · 屏幕月表页脚与「打印月表」表尾的合计，走 `monthTotals()` **同一个函数、同一份 rows**；
 *  · 「打印全年月表」的分月表走 `monthPrintTables()` —— 它**只搬运** `summarizeYear()`
 *    已经算好的 `MonthCell`（就是屏幕上「年度工资汇总 / 工天加班汇总」那张表里的数字），
 *    不重新算工天、加班、工资（金额取整仍统一走 wage.ts 的 round2）。
 * 这两条由 `tests/attendance-print.test.ts` 钉住：分月表逐格 == 年度表的逐格，
 * 合计 == 各行相加（不许出现两套口径）。
 */
import { round2 } from "./wage";
import type { YearPersonRow } from "./attendance-summary";

/** 月表页脚 / 打印表尾的合计（人数、工天、加班费、餐补、补助、扣款、应发） */
export interface MonthTotals {
  people: number;
  days: number;
  ot: number;
  meal: number;
  allowance: number;
  deduction: number;
  pay: number;
}

/** `monthTotals` 只需要这几个字段：屏幕的月表行与打印件的月表行都能直接喂进来 */
export interface MonthTotalRow {
  days: number;
  allowance: number;
  deduction: number;
  ot: number;
  meal: number;
  pay: number;
}

/**
 * 一张月表的合计（唯一实现）。
 * 屏幕月表页脚的「本月 N 人 / 出勤 X 天 / 加班费 / 餐补 / 补助 / 扣款 / 应发」与
 * 打印月表 `<tfoot>` 的合计行都由它给出 —— 屏幕上有什么，纸上就是什么。
 */
export function monthTotals(rows: readonly MonthTotalRow[]): MonthTotals {
  const sum = (pick: (r: MonthTotalRow) => number) => round2(rows.reduce((s, r) => s + (pick(r) || 0), 0));
  return {
    people: rows.length,
    days: sum((r) => r.days),
    ot: sum((r) => r.ot),
    meal: sum((r) => r.meal),
    allowance: sum((r) => r.allowance),
    deduction: sum((r) => r.deduction),
    pay: sum((r) => r.pay),
  };
}

/** 分月表的一行：只搬年度汇总 `MonthCell` 里屏幕上可见的三项（天数、加班时数、应发） */
export interface MonthSheetTableRow {
  name: string;
  team: string;
  days: number;
  otHours: number;
  pay: number;
}

/** 分月表的一块 = 一个月 */
export interface MonthSheetTable {
  /** 1–12 */
  month: number;
  rows: MonthSheetTableRow[];
}

/**
 * 「年度汇总的一行」→「每月一张表」（打印全年月表用）。
 *
 * 数据来自 `summarizeYear().rows`（屏幕年度表的那一份），只看 `months[month-1]`：
 * 出勤天数 / 加班小时 / 应发 —— 正好是屏幕上「工天加班」与「工资」两个页签里每个月的那几个数字，
 * 本函数**不做任何算术**（不 reduce、不 round），所以纸上不可能与屏幕对不上。
 *
 * 只列该月有记录的人（天数/加班/应发有任意一项非 0）；整月都没有记录的月份直接不出现，
 * 抬头会写明「已录入 X / 12 个月」，用户不会以为漏印。
 */
export function monthPrintTables(rows: readonly YearPersonRow[], months = 12): MonthSheetTable[] {
  const out: MonthSheetTable[] = [];
  for (let month = 1; month <= months; month += 1) {
    const list: MonthSheetTableRow[] = [];
    for (const r of rows) {
      const cell = r.months[month - 1];
      if (!cell) continue;
      if (!cell.days && !cell.otHours && !cell.pay) continue;
      list.push({
        name: r.person.name,
        team: r.person.team || "",
        days: cell.days,
        otHours: cell.otHours,
        pay: cell.pay,
      });
    }
    if (list.length) out.push({ month, rows: list });
  }
  return out;
}
