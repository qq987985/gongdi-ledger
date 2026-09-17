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
 *
 * 1.8.14 增（专家评审 A-1）：这里的 `nameKey()` 同时是**姓名的唯一比较键**。
 * 姓名是考勤（`attendance.name`）、发放（`payments.owner`）、人员表之间的关联键，
 * 但各处 trim 口径不一：人员姓名从不 trim、发放 owner 保存时 trim、Excel 导入 trim，
 * 而年度汇总只在一侧 trim —— 于是同一本台账里「张三」与「张三 」（尾空格）被当成两个人：
 * 年度表同一个人拆成两行（一行「已发 0 / 未发 = 全额」，一行「未发 = 负数」），
 * 或整年出勤静默归零（应发 KPI 丢钱）。比较两侧都必须过 `nameKey()`。
 */
import type { Payment } from "./types";

/**
 * 姓名的**唯一比较键**：去掉首尾空白（不区分大小写之外不做任何改写）。
 *
 * 用途有二，都不许再写第二份：
 * · 入库前规范化（`store.upsertPerson` / `addPerson` / `replacePeople` / `saveAttendanceMonth`、
 *   人员表单）—— 新数据一律不带头尾空格；
 * · 比较两侧（年度汇总、Excel 汇总 sheet、人员表查找、工资条），
 *   存量数据里已经带空格的历史记录也能与干净姓名对上。
 */
export function nameKey(v: unknown): string {
  return String(v ?? "").trim();
}

/** 收款人：填了就按填的算（去空白），空 = 同实际收款人（旧数据 / Excel 导入里 receiver 可能是空的） */
export function receiverOf(p: Pick<Payment, "owner" | "receiver">): string {
  return nameKey(p.receiver) || nameKey(p.owner);
}

/** 实际收款人（owner）的比较键：也是姓名比较键，避免各处再写 `(x.owner || "").trim()` */
export function ownerKey(p: Pick<Payment, "owner">): string {
  return nameKey(p.owner);
}

/** 是否「代收」（收款人是别人）：**空收款人视为本人收款**，与「其中代发」统计同一口径 */
export function isProxyReceiver(p: Pick<Payment, "owner" | "receiver">): boolean {
  return receiverOf(p) !== ownerKey(p);
}
