/**
 * 发放记录的口径唯一实现（口径一致性专项 20260916；1.8.5 三条产品口径决策，1.8.6 纠正「代发」）。
 *
 * 从 `src/routes/payments.tsx` 按行段机械提取（§12.1），**行数、汇总、面板、下拉、打印**
 * 共用同一份计算，不许出现第二套口径。
 *
 * ## 汇总口径（发放页 / 年度表 / 总览 KPI 共用）—— 1.8.6 纠正
 * 一笔发放按「有没有填发放日期」只分成两部分：
 * - **已发放** A：填了发放日期 → 按**实际收款人**（`owner`）计入其名下，**包含代发/代收**。
 *   别人代领 ≠ 没发，钱已经出去了，所以**不从已发里扣**。
 * - **待发放** C：没有发放日期，单独列「待发放 N 笔 ¥X」，不算已发。
 * 恒等式：`已发 ¥A + 待发放 ¥C = 全部合计`。
 *
 * **代发**（收款人非本人）是**已发的子集** B ⊆ A：单列成「其中代发 N 笔 ¥X」（口径行/标注），
 * **不减 A**；明细/清单里每笔仍保留「代收」标记。
 * ⚠️ 1.8.5 曾把代发从已发里扣掉（当时写成 A + B + C = 总计，B 与 A 互斥）—— 那是**错的**，
 * 1.8.6 已纠正为「待发不计，代发计入实际收款人」。
 *
 * ## 两种打印清单的口径**故意不同**（1.8.6）
 * - **明细清单**（`detailSections`）：待发放也**计入对应实际收款人名下**（和已发同一节），
 *   每一笔标注「已发/待发」，节尾小计拆「已发小计 / 待发小计」两行；
 *   要求：已发小计 == 汇总里该人的已发，待发小计 == 汇总「待发放」组里该人的部分，
 *   `已发行数 + 待发行数 == 该筛选下该人的全部记录数`。
 * - **汇总清单**（`printSummary`）：**待发放单列一组、不计入已发**（已发含代发，单列「其中代发」）。
 * - 两种清单表头的小字分别写清差别（`printCaliberNote`）。
 *
 * ## 「本人收款」判定的两个用途（别再拿它判「已发放」）
 * `isPaidSelf()`（有日期 **且** 收款人 = 本人）只用于：
 * 1. **工资条**（`src/routes/query.tsx`）的「已打款合计（本人）」——
 *    单人视角，回答「这笔钱他本人有没有拿到」；
 * 2. 「其中代发」的**子集统计/标注**（`isProxyPaid()` = 有日期 && !isPaidSelf）。
 * 「已发放」的判定是 `isPaid()`（有日期即算），**不是** `isPaidSelf()`。
 *
 * ## 其它既有约定
 * - 汇总/分组/打印都跟随当前筛选（区间 + 状态 + 发放方 + 搜索）。
 * - 发放方为空是**一个真实的分组**（「未填发放方」），不是「不存在」。
 * - 收款人为空 = 同实际收款人（与编辑弹窗「空则同实际收款人」一致，兼容旧数据与 Excel 导入）。
 */
import { parseDateYmd, ymKey } from "./dates";
import { round2 } from "./wage";
import { ALL_BUCKETS, groupBuckets, inBucket, type Bucket } from "./buckets";
import type { Payment } from "./types";

export type PaymentStatus = "all" | "pending" | "paid";

export interface PaymentFilters {
  status: PaymentStatus;
  /** 发放方：`ALL_BUCKETS` = 全部；空串 = 未填发放方那一桶 */
  source: string;
  q: string;
}

/* ＝＝ 两个维度的唯一判定（已发含代发 / 待发放） ＋ 两个「本人收款」标注用途 ＝＝ */

/**
 * 收款人判定（空 = 同实际收款人）已**下沉到 `src/lib/receiver.ts`**：1.8.8 起
 * Excel 去重键、发放页列表徽标、打印清单、工资条共用同一实现（B 组 D3/D4：
 * 以前各写各的 —— 导入多一条、空收款人被标成「代收」）。这里保留转发出口，老引用不用改。
 */
import { ownerKey, receiverOf } from "./receiver";
// 1.8.14（A-1）：`nameKey` / `ownerKey` 也从这个转发出口可见 —— 页面只用一处 import，
// 别再各写 `(x.owner || "").trim()`（姓名比较键唯一实现在 receiver.ts）。
export { receiverOf, isProxyReceiver, nameKey, ownerKey } from "./receiver";

/**
 * 已发放（汇总口径，1.8.6）：**有发放日期即算**，按实际收款人计入其名下，含代发/代收。
 * 发放统计 / 年度汇总 / 总览 KPI 都用它。**不要**用 `isPaidSelf` 判已发。
 */
export function isPaid(p: Pick<Payment, "date">): boolean {
  return Boolean(p.date);
}

/** 待发放 = 没有发放日期，一直留在列表里，不算已发 */
export function isPending(p: Pick<Payment, "date">): boolean {
  return !p.date;
}

/**
 * 「本人收款」= 有发放日期 **且** 收款人就是本人 —— 全库唯一判定。
 * **只用于**：① 工资条「已打款合计（本人）」（单人视角：这笔钱他本人有没有拿到）；
 * ② 「其中代发」的子集统计（见 `isProxyPaid`）。**不用它判「已发放」**（用 `isPaid`）。
 */
export function isPaidSelf(p: Pick<Payment, "date" | "owner" | "receiver">): boolean {
  return Boolean(p.date) && ownerKey(p) === receiverOf(p);
}

/**
 * 代发（代收）= 有发放日期但收款人非本人（别人代领）。
 * 它是**已发的子集**（B ⊆ A），只作「其中代发」的标注/统计，**不从已发里扣**。
 */
export function isProxyPaid(p: Pick<Payment, "date" | "owner" | "receiver">): boolean {
  return Boolean(p.date) && !isPaidSelf(p);
}

/** 「待发放」在面板/清单里那一组的固定名字 */
export const PENDING_LABEL = "待发放";
/** 「其中代发」口径行的固定前缀（面板/明细/汇总三处共用同一句） */
export const PROXY_INLINE_LABEL = "其中代发";
/** 兼容旧引用的代发短标签 */
export const PROXY_LABEL = "代发";

/**
 * 按「年-月」区间筛（lo/hi 来自 dates.ts 的 ymKey）。
 * 无日期（待发放）与日期残缺的记录**一直留在列表里**（待发放没有日期，会一直显示在列表里），
 * 否则待发放会随区间一起消失。
 */
export function paymentsInRange<T extends { date?: string }>(payments: T[], lo: number, hi: number): T[] {
  return payments.filter((p) => {
    const d = parseDateYmd(p.date) || p.date;
    if (!d) return true;
    const y = Number(d.slice(0, 4));
    const m = Number(d.slice(5, 7));
    if (!y || !m) return true;
    const k = ymKey(y, m);
    return k >= lo && k <= hi;
  });
}

/** 状态 + 发放方 + 搜索（逐字搬运原 filtered） */
export function filterPayments<T extends Payment>(ranged: T[], f: PaymentFilters): T[] {
  let list = ranged;
  if (f.status === "pending") list = list.filter((p) => !p.date);
  if (f.status === "paid") list = list.filter((p) => Boolean(p.date));
  // 发放方筛选：ALL_BUCKETS = 全部；空串 = 「未填发放方」那一桶（以前这里没有这一桶）
  if (f.source !== ALL_BUCKETS) list = list.filter((p) => inBucket(p.source, f.source));
  if (f.q.trim()) {
    const s = f.q.trim();
    list = list.filter((p) => [p.owner, p.receiver].some((x) => (x || "").includes(s)));
  }
  return list;
}

/** 金额求和（统一 round2，保证 A + C 与总计逐分相等） */
function sumAmount(rows: Payment[]): number {
  return round2(rows.reduce((s, p) => s + (p.amount || 0), 0));
}

export interface PaymentSummary {
  /** 列表条数（当前筛选后的全部笔数） */
  count: number;
  /** 合计 = 已发（含代发）+ 待发放 */
  total: number;
  /** A：已发放（所有已填发放日期的记录，按实际收款人计入，含代发） */
  paidCount: number;
  paidAmt: number;
  /** B：其中代发（收款人非本人）—— **已发的子集**，B ⊆ A，不从 A 里扣 */
  proxyCount: number;
  proxyAmt: number;
  /** C：待发放（无发放日期）—— 不算已发 */
  pendingCount: number;
  pendingAmt: number;
}

/** 汇总数字（与列表、面板、下拉、打印同一份 rows） */
export function paymentSummary(rows: Payment[]): PaymentSummary {
  const paid = rows.filter(isPaid);
  const proxy = rows.filter(isProxyPaid);
  const pending = rows.filter(isPending);
  return {
    count: rows.length,
    total: sumAmount(rows),
    paidCount: paid.length,
    paidAmt: sumAmount(paid),
    proxyCount: proxy.length,
    proxyAmt: sumAmount(proxy),
    pendingCount: pending.length,
    pendingAmt: sumAmount(pending),
  };
}

/** 面板/清单里的行：人员行（该人已发，含代发）或「待发放」固定行 */
export type RowKind = "person" | "pending";

export interface OwnerRow {
  /** 实际收款人（入账人）；或 `PENDING_LABEL` 固定行 */
  owner: string;
  kind: RowKind;
  /** person 行：该人已发笔数（**含代发**） */
  count: number;
  /** person 行：该人已发金额（**含代发**，即该人「已发放」） */
  amount: number;
  /** person 行：其中代发笔数（⊆ count，只作「其中代发」标注，不减本行） */
  proxyCount: number;
  /** person 行：其中代发金额（⊆ amount） */
  proxyAmt: number;
}

/**
 * 人员行（按实际收款人入账，**含代发**）：金额即该人「已发放」；
 * 代发部分同时记在 `proxyCount/proxyAmt` 里作「其中代发」标注。
 */
export function byOwnerRows(rows: Payment[]): OwnerRow[] {
  const map = new Map<string, OwnerRow>();
  for (const p of rows) {
    if (!isPaid(p)) continue;
    const owner = ownerKey(p);
    const cur = map.get(owner) || { owner, kind: "person" as RowKind, count: 0, amount: 0, proxyCount: 0, proxyAmt: 0 };
    cur.count += 1;
    cur.amount += p.amount || 0;
    if (isProxyPaid(p)) {
      cur.proxyCount += 1;
      cur.proxyAmt += p.amount || 0;
    }
    map.set(owner, cur);
  }
  const out = [...map.values()];
  for (const r of out) {
    r.amount = round2(r.amount);
    r.proxyAmt = round2(r.proxyAmt);
  }
  return out.sort((a, b) => b.amount - a.amount || a.owner.localeCompare(b.owner, "zh"));
}

/**
 * 打印/面板的可见范围：`ALL_BUCKETS` = 全部；否则 = 该实际收款人名下
 * （含他的已发、他名下的代发、他名下的待发放 —— 代发本来就算在他已发里）。
 */
export function scopeRows(rows: Payment[], owner: string): Payment[] {
  return owner === ALL_BUCKETS ? rows : rows.filter((p) => inBucket(ownerKey(p), owner));
}

/** 把「待发放」一组接到人员行后面（单列，不进任何人的已发） */
function appendPending(persons: OwnerRow[], scope: Payment[]): OwnerRow[] {
  const out = [...persons];
  const pending = scope.filter(isPending);
  if (pending.length) {
    out.push({ owner: PENDING_LABEL, kind: "pending", count: pending.length, amount: sumAmount(pending), proxyCount: 0, proxyAmt: 0 });
  }
  return out;
}

/** 模式二：按实际收款人的汇总清单（人员行 + 待发放） */
export function printSummary(rows: Payment[], owner: string): OwnerRow[] {
  const scope = scopeRows(rows, owner);
  return appendPending(byOwnerRows(scope), scope);
}

/**
 * 屏幕上的「按实际收款人」分组面板：与「全部实际收款人」的打印汇总**同一份数据**
 * （人员行 + 「待发放」）。
 */
export function panelRows(rows: Payment[]): OwnerRow[] {
  return printSummary(rows, ALL_BUCKETS);
}

/** 发放方下拉选项：真实存在的桶（含「未填发放方」） */
export function sourceBuckets(ranged: { source?: string }[]): Bucket[] {
  return groupBuckets(ranged.map((p) => p.source), "未填发放方");
}

/**
 * 打印时可选的「实际收款人」下拉：列当前筛选下**有任何记录**（已发或待发）的人 ——
 * 明细清单把待发放也归到实际收款人名下，所以只存在待发的人也要能单独打。
 */
export function printOwnerBuckets(rows: Payment[]): Bucket[] {
  return groupBuckets(rows.map((p) => ownerKey(p)), "（未填实际收款人）");
}

/**
 * 明细清单的一节 = 一个实际收款人的**全部记录**（已发 + 待发），逐笔带「已发/待发」状态。
 * 小计拆成两行：`paidAmt`（已发小计，**含代发**，== 汇总清单里该人的已发）与
 * `pendingAmt`（待发小计，== 汇总清单「待发放」组里该人的部分）。
 */
export interface DetailSection {
  owner: string;
  /** 该人全部记录（已发 + 待发），已按日期排序 */
  rows: Payment[];
  /** 全部笔数 = paidCount + pendingCount */
  count: number;
  /** 全部金额 = paidAmt + pendingAmt */
  amount: number;
  /** 已发小计（含代发） */
  paidCount: number;
  paidAmt: number;
  /** 待发小计 */
  pendingCount: number;
  pendingAmt: number;
  /** 其中代发（⊆ 已发小计，标注用） */
  proxyCount: number;
  proxyAmt: number;
}

/** 按日期排序（同日按 id）；待发（无日期）排在最后 */
function byDateThenId(a: Payment, b: Payment): number {
  if (!a.date && b.date) return 1;
  if (a.date && !b.date) return -1;
  return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id);
}

/**
 * 模式一：按实际收款人的明细清单 —— **每个实际收款人一节，节内含他的全部记录**
 * （已发 + 待发，逐笔标注「已发/待发」；代收笔保留「代收」标记），节尾小计拆成
 * 「已发小计」与「待发小计」两行。
 * `owner` 为 `ALL_BUCKETS` = 全部人；否则只出这个人的范围（不存在就是空数组 → 页面禁用打印，不弹空白页）。
 * 硬约束：各节 `amount` 之和 == `printTotals`（该筛选下的全部记录）；各节 `paidAmt` 之和 == A。
 */
export function detailSections(rows: Payment[], owner: string): DetailSection[] {
  const scope = scopeRows(rows, owner);
  const groups = new Map<string, Payment[]>();
  for (const p of scope) {
    const key = ownerKey(p);
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }
  return [...groups.entries()]
    .map(([owner, mine]) => {
      const sorted = mine.slice().sort(byDateThenId);
      const paid = sorted.filter(isPaid);
      const pending = sorted.filter(isPending);
      const proxy = paid.filter(isProxyPaid);
      return {
        owner,
        rows: sorted,
        count: sorted.length,
        amount: sumAmount(sorted),
        paidCount: paid.length,
        paidAmt: sumAmount(paid),
        pendingCount: pending.length,
        pendingAmt: sumAmount(pending),
        proxyCount: proxy.length,
        proxyAmt: sumAmount(proxy),
      };
    })
    .sort((a, b) => b.paidAmt - a.paidAmt || b.pendingAmt - a.pendingAmt || a.owner.localeCompare(b.owner, "zh"));
}

export interface PrintTotals {
  count: number;
  amount: number;
}

/** 打印范围的总计 = 已发（含代发）+ 待发放（选单人时就是那个人的两者之和） */
export function printTotals(rows: Payment[], owner: string = ALL_BUCKETS): PrintTotals {
  const scope = scopeRows(rows, owner);
  return { count: scope.length, amount: sumAmount(scope) };
}

/** 明细各节之和 = 明细清单表尾的总计（必须等于 printTotals） */
export function sectionTotals(sections: DetailSection[]): PrintTotals {
  return {
    count: sections.reduce((s, x) => s + x.count, 0),
    amount: round2(sections.reduce((s, x) => s + x.amount, 0)),
  };
}

/** 汇总各行之和 = 汇总清单表尾的总计（必须等于 printTotals） */
export function ownerTotals(rows: OwnerRow[]): PrintTotals {
  return {
    count: rows.reduce((s, x) => s + x.count, 0),
    amount: round2(rows.reduce((s, x) => s + x.amount, 0)),
  };
}

/**
 * 明细/汇总两种清单**口径不同**，表头小字必须分别写清（不许共用一句含糊的话）：
 * - 明细清单：把待发放也列入实际收款人名下、逐笔标注「已发/待发」，小计拆「已发小计 / 待发小计」；
 * - 汇总清单：待发放**单列一组**、不计入已发（已发含代发，单列「其中代发」）。
 */
export const PRINT_CALIBER_NOTE_DETAIL =
  "明细清单：已填发放日期的按实际收款人计入已发；待发放也列入实际收款人名下，逐笔标注「已发 / 待发」，小计拆「已发小计 / 待发小计」；代发（收款人非本人）已计入实际收款人名下，小计单列「其中代发」。";
export const PRINT_CALIBER_NOTE_SUMMARY =
  "汇总清单：已发 = 只计已填发放日期的记录，按实际收款人计入（含代发，单列「其中代发」）；待发放单列一组，不计入已发。";

/** 按打印模式取口径小字（页面/打印件都走这里，不许各写一句） */
export function printCaliberNote(mode: "detail" | "summary"): string {
  return mode === "detail" ? PRINT_CALIBER_NOTE_DETAIL : PRINT_CALIBER_NOTE_SUMMARY;
}

