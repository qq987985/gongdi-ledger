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

/**
 * 一条考勤记录是否「有内容」（口径一致性专项 20260916）。
 *
 * `hasWork` 只认工天/加班/补助/扣款，那是**工资计算**的口径（月薪只在这些字段非零时才发）。
 * 但「这个人本月有没有记录」是另一回事：只有备注的行（如整月「工伤休息」）也是一条要看的
 * 记录 —— 1.8.0 起整本导出的月份识别已经改成「备注也算有内容」，而月度卡/年度汇总/工资条
 * 还在用 hasWork，于是同一份数据两套口径：Excel 月表有这一行，年度汇总却没这个人；
 * 月度卡写「空表」，已录月份也不计。
 *
 * 这里给「有没有内容」一个**唯一实现**，月表/年度汇总/工资条/Excel 各表都用它；
 * 工资计算继续用 hasWork（本函数只多认备注，不影响任何金额）。
 */
export function hasContent(a: (MonthAttendance & { remark?: string }) | null | undefined): boolean {
  if (!a) return false;
  return hasWork(a) || Boolean(String(a.remark ?? "").trim());
}
