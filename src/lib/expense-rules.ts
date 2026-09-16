/**
 * 报销的领域小规则（唯一实现）。
 *
 * 从 `src/components/expense-bits.tsx` 机械搬出（§12）：`needsVoucher` 被页面、编辑器和
 * 统计模块同时用到，留在组件里会让 lib 层的统计去 import 组件（依赖方向反了）。
 * `expense-bits.tsx` 继续 re-export 这两个名字，现有调用方零改动。
 */

export const PAY_METHODS = ["现金", "转账", "微信", "支付宝", "对公", "其他"];

/** 非现金支付方式才需要票据/打款凭证 */
export function needsVoucher(method: string) {
  return (method || "现金") !== "现金";
}

/**
 * 报销 draft → 编辑弹窗的本地表单初值（1.8.8 修 B 组 E11）。
 *
 * **打开「新增报销」和切到另一条记录都必须走它**：本地副本一旦沿用上一条的字段，
 * 点「新增报销」后保存会按同一个 id 覆盖**正在编辑的那条**，整条报销单静默消失（实测）。
 * 抽到 lib 是为了能单测（§12.1）—— 以前这段初值逻辑藏在组件里，只在挂载时跑一次。
 */
export function expenseFormFromDraft<T extends Record<string, any>>(draft: T): T {
  return {
    ...draft,
    // 有卡号时账户就按卡号走；没有卡号才回落到「打款账户」
    payBank: draft.payBank || (!draft.payCardNo ? draft.payAccount : "") || "",
    payCardNo: draft.payCardNo || "",
    // 未报销的行不该留着打款日期
    payoutDate: draft.status === "已报销" ? draft.payoutDate || "" : "",
  };
}
