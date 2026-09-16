/**
 * 发放记录的口径唯一实现（口径一致性专项 20260916）。
 *
 * 从 `src/routes/payments.tsx` 按行段机械提取（§12.1），**行为逐字不变**，
 * 只是把「区间筛选 / 状态与发放方筛选 / 汇总 / 按实际收款人分组 / 下拉选项 /
 * 打印数据」搬成纯函数，让屏幕上的四个口径（列表条数、汇总数字、按收款人面板、
 * 发放方下拉）**和打印纸**共用同一份计算，不许出现第二套口径。
 *
 * 口径（三条硬约定，改动=改数字，必须在 VERSION.txt 写明）：
 * 1. 「已发」只认**填了发放日期**的记录；待发放（无日期）不算已发，只进待发放汇总。
 * 2. 汇总/分组/打印都跟随当前筛选（区间 + 状态 + 发放方 + 搜索）。
 * 3. 发放方为空是**一个真实的分组**（「未填发放方」），不是「不存在」——
 *    以前下拉用 `filter(Boolean)` 把它删掉，选了任一发放方就取不到这些钱。
 */
import { parseDateYmd, ymKey } from "./dates";
import { ALL_BUCKETS, groupBuckets, inBucket, type Bucket } from "./buckets";
import type { Payment } from "./types";

export type PaymentStatus = "all" | "pending" | "paid";

export interface PaymentFilters {
  status: PaymentStatus;
  /** 发放方：`ALL_BUCKETS` = 全部；空串 = 未填发放方那一桶 */
  source: string;
  q: string;
}

/**
 * 按「年-月」区间筛（lo/hi 来自 dates.ts 的 ymKey）。
 * 无日期（待发放）与日期残缺的记录**一直留在列表里**（原注释：待发放没有日期，会一直显示在列表里），
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

export interface PaymentSummary {
  /** 列表条数（当前筛选后的笔数） */
  count: number;
  /** 合计（含待发放） */
  total: number;
  /** 已发放金额（只认有日期的） */
  paidAmt: number;
  /** 待发放笔数与金额 */
  pendingCount: number;
  pendingAmt: number;
  /** 代收笔数（实际收款人 ≠ 收款人） */
  proxyCount: number;
}

/** 汇总数字（与列表、面板、下拉同一份 rows） */
export function paymentSummary(rows: Payment[]): PaymentSummary {
  const pending = rows.filter((p) => !p.date);
  const paid = rows.filter((p) => p.date);
  return {
    count: rows.length,
    total: rows.reduce((s, p) => s + (p.amount || 0), 0),
    paidAmt: paid.reduce((s, p) => s + p.amount, 0),
    pendingCount: pending.length,
    pendingAmt: pending.reduce((s, p) => s + p.amount, 0),
    proxyCount: rows.filter((p) => p.owner !== p.receiver).length,
  };
}

export interface OwnerRow {
  /** 实际收款人（入账人） */
  owner: string;
  /** 笔数（只计已填日期的） */
  count: number;
  /** 合计金额（只计已填日期的） */
  amount: number;
  /** 其中代收笔数（owner ≠ receiver） */
  proxyCount: number;
}

/** 按实际收款人分组（口径：只计已填日期的，待发放不算已发） */
export function byOwnerRows(rows: Payment[]): OwnerRow[] {
  const map = new Map<string, OwnerRow>();
  for (const p of rows) {
    if (!p.date) continue;
    const cur = map.get(p.owner) || { owner: p.owner, count: 0, amount: 0, proxyCount: 0 };
    cur.count += 1;
    cur.amount += p.amount || 0;
    if (p.owner !== p.receiver) cur.proxyCount += 1;
    map.set(p.owner, cur);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount || a.owner.localeCompare(b.owner, "zh"));
}

/** 发放方下拉选项：真实存在的桶（含「未填发放方」） */
export function sourceBuckets(ranged: { source?: string }[]): Bucket[] {
  return groupBuckets(ranged.map((p) => p.source), "未填发放方");
}

/** 打印时可选的「实际收款人」下拉：只列当前筛选下**真有已发记录**的人 */
export function printOwnerBuckets(rows: Payment[]): Bucket[] {
  return groupBuckets(byOwnerRows(rows).map((r) => r.owner), "（未填实际收款人）");
}

export interface DetailSection {
  owner: string;
  rows: Payment[];
  count: number;
  amount: number;
  proxyCount: number;
}

/**
 * 模式一：按实际收款人的明细清单（按人分节）。
 * `owner` 为 `ALL_BUCKETS` = 全部人；否则只出这一节（不存在就是空数组 → 页面禁用打印，不弹空白页）。
 */
export function detailSections(rows: Payment[], owner: string): DetailSection[] {
  const byOwner = byOwnerRows(rows);
  const wanted = owner === ALL_BUCKETS ? byOwner.map((r) => r.owner) : byOwner.filter((r) => inBucket(r.owner, owner)).map((r) => r.owner);
  const order = new Map(byOwner.map((r, i) => [r.owner, i]));
  return wanted
    .map((name) => {
      const mine = rows
        .filter((p) => p.date && inBucket(p.owner, name))
        .slice()
        .sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
      return {
        owner: name,
        rows: mine,
        count: mine.length,
        amount: mine.reduce((s, p) => s + (p.amount || 0), 0),
        proxyCount: mine.filter((p) => p.owner !== p.receiver).length,
      };
    })
    .filter((s) => s.rows.length > 0)
    .sort((a, b) => (order.get(a.owner) ?? 0) - (order.get(b.owner) ?? 0));
}

/** 模式二：按实际收款人的汇总清单（每人一行 + 总计） */
export function printSummary(rows: Payment[], owner: string): OwnerRow[] {
  const list = byOwnerRows(rows);
  return owner === ALL_BUCKETS ? list : list.filter((r) => inBucket(r.owner, owner));
}

export interface PrintTotals {
  count: number;
  amount: number;
}

/** 明细/汇总/总计三者互等的唯一算法：都是这份 rows 的已发部分 */
export function printTotals(rows: Payment[]): PrintTotals {
  const paid = rows.filter((p) => p.date);
  return { count: paid.length, amount: paid.reduce((s, p) => s + (p.amount || 0), 0) };
}

/** 明细各节之和 = 明细清单表尾的总计（选单人时就是那个人的合计） */
export function sectionTotals(sections: DetailSection[]): PrintTotals {
  return {
    count: sections.reduce((s, x) => s + x.count, 0),
    amount: sections.reduce((s, x) => s + x.amount, 0),
  };
}

/** 汇总各行之和 = 汇总清单表尾的总计（选单人时就是那个人的合计） */
export function ownerTotals(rows: OwnerRow[]): PrintTotals {
  return {
    count: rows.reduce((s, x) => s + x.count, 0),
    amount: rows.reduce((s, x) => s + x.amount, 0),
  };
}
