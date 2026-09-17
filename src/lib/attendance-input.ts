/**
 * 月考勤**输入口径**的校验（专家评审 B-12②，1.8.14）。
 *
 * 现象：出勤天数可以填负数（表单是 `type="number"`，只 warn「> 31」不 warn 负数）。
 * 负天数的两个后果都不显眼：
 * ① 月表页脚照样求和 → 出现**负工资**（`monthPay` 里 `days × 日薪` 是负的）；
 * ② `hasWork` 只认 `days > 0`，所以这条记录**不算「有内容」** →
 *    年度汇总的 `worked` 判 false → **这个人在年度表里整年漏掉**（应发 KPI 少算他）。
 *
 * 处理方式（按评审建议选「展示层明确拒绝/提示」）：
 * · 值一填成负数就提示（`negativeDaysNotice`）；
 * · 保存前再拦一次（页面按钮），负数的月份不落盘，用户改成 0 或正数即可；
 * · 已有的存量负数据（Excel 导入等）由月表上方的警示条显式列名字。
 * 这里只做**判定与文案**（纯函数，便于测试），页面负责显示与拦截。
 */

export interface NegativeDayRow {
  name: string;
  days: number;
}

/** 出勤天数为负的行（name 去空白、保持原顺序） */
export function negativeDayRows(rows: { name?: string; days?: number }[] | null | undefined): NegativeDayRow[] {
  return (rows || [])
    .filter((r) => Number(r?.days) < 0)
    .map((r) => ({ name: String(r.name ?? "").trim(), days: Number(r.days) }));
}

/** 警示/拒绝文案：没有负数时返回空串（调用方用它决定要不要出提示） */
export function negativeDaysNotice(rows: { name?: string; days?: number }[] | null | undefined): string {
  const bad = negativeDayRows(rows);
  if (!bad.length) return "";
  const who = bad
    .slice(0, 5)
    .map((r) => `${r.name || "（未填姓名）"} ${r.days}`)
    .join("、");
  const more = bad.length > 5 ? ` 等 ${bad.length} 人` : "";
  return (
    `有 ${bad.length} 人的出勤天数是负数（${who}${more}）：负数会算成负工资，` +
    `而且这条记录不算「有内容」——年度汇总里这个人会整年漏掉。请改成 0 或正数。`
  );
}

/** 这批行能不能落盘：有负数就不许保存（保存前拦一道，避免把负工资写进台账） */
export function canSaveMonthDays(rows: { name?: string; days?: number }[] | null | undefined): boolean {
  return negativeDayRows(rows).length === 0;
}
