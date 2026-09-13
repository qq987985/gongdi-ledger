import type { MonthAttendance } from "./wage";

/**
 * 一条考勤记录是否「有内容」（出勤/加班/补助/扣款任一非零）。
 *
 * 为什么单独一个文件：它同时被工资、日期统计、Excel 导入导出、页面用到，
 * 放 wage.ts 会让 dates.ts 反向依赖 wage（历史上为了避免成环，wage 连
 * dates 的日期解析都不能用）。抽出来后依赖方向变成：work → wage(仅类型)，环消失。
 */
export function hasWork(a: MonthAttendance | null | undefined): boolean {
  if (!a) return false;
  return (
    (a.days || 0) > 0 ||
    (a.otHours || 0) > 0 ||
    (a.allowance || 0) !== 0 ||
    (a.deduction || 0) !== 0
  );
}
