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
