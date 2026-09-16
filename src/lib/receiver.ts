/**
 * 收款人判定的唯一实现（1.8.8）。
 *
 * §12.2：这一小段逻辑被「Excel 去重键」「发放页列表徽标」「打印清单」「个人查询工资条」
 * 多个互不相关的模块需要，所以独立成模块，谁都不许再写第二套 `owner !== receiver`。
 *
 * 背景（B 组报告 D3/D4）：
 * · **D3**：`rowToPayment` 会把**空的收款人回填成实际收款人**，而去重键以前用原值 `receiver`，
 *   于是「导出（receiver 空）→ 导入（receiver 回填成 owner）」两遍键不相等，同一份文件再导入就多一条。
 * · **D4**：列表/打印用裸比较 `owner !== receiver`，空收款人会被标成「代收」，
 *   与汇总里「其中代发 0 笔」（走 `receiverOf`）自相矛盾。
 * 口径只有一句：**空 = 同实际收款人**。
 */
import type { Payment } from "./types";

/** 收款人：填了就按填的算（去空白），空 = 同实际收款人（旧数据 / Excel 导入里 receiver 可能是空的） */
export function receiverOf(p: Pick<Payment, "owner" | "receiver">): string {
  return (p.receiver || "").trim() || (p.owner || "").trim();
}

/** 是否「代收」（收款人是别人）：**空收款人视为本人收款**，与「其中代发」统计同一口径 */
export function isProxyReceiver(p: Pick<Payment, "owner" | "receiver">): boolean {
  return receiverOf(p) !== (p.owner || "").trim();
}
