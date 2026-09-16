/**
 * 发放记录的口径唯一实现（口径一致性专项 20260916；1.8.5 三条产品口径决策）。
 *
 * 从 `src/routes/payments.tsx` 按行段机械提取（§12.1），**行数、汇总、面板、下拉、打印**
 * 共用同一份计算，不许出现第二套口径。
 *
 * ## 三个互不重叠的维度（1.8.5 决策一 + 决策四）
 * 一笔发放**只能**落到其中一维：
 * - **已发（本人）** A：填了发放日期，且**收款人就是本人**（`isPaidSelf`）。
 * - **代发（代收）** B：填了发放日期，但**收款人不是本人**（别人代领）——
 *   **不计入「已发放」**，单独列「代发 N 笔 ¥X」；记录本身照常出现在列表/清单里（保留「代收」标注）。
 * - **待发放** C：没有发放日期。不算已发。
 * 恒等式：`A + B + C = 全部合计`（金额与笔数都成立），
 * 且「明细逐笔之和 = 汇总各行之和 = 总计」在**含待发放 / 不含待发放**两种筛选下都成立。
 *
 * ## 「本人收款」只有一处判定
 * `isPaidSelf()` 是全库唯一实现（工资条打印的「已打款合计（本人）」也走它），
 * 不许在页面里再写 `owner === receiver` 这类第二套判断。
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

/* ＝＝ 三个维度的唯一判定（决策一 / 决策四） ＝＝ */

/** 收款人：空 = 同实际收款人（旧数据 / Excel 导入里 receiver 可能是空的） */
export function receiverOf(p: Pick<Payment, "owner" | "receiver">): string {
  return (p.receiver || "").trim() || (p.owner || "").trim();
}

/**
 * 「已发（本人）」= 有发放日期 **且** 收款人就是本人 —— 全库唯一判定（决策四）。
 * 代收（收款人非本人）**不算已发**，只进「代发」。
 * 工资条打印的「已打款合计（本人）」也调用本函数，两边不允许各写一套。
 */
export function isPaidSelf(p: Pick<Payment, "date" | "owner" | "receiver">): boolean {
  return Boolean(p.date) && (p.owner || "").trim() === receiverOf(p);
}

/** 代发（代收）= 有发放日期但收款人非本人（别人代领），不计入已发 */
export function isProxyPaid(p: Pick<Payment, "date" | "owner" | "receiver">): boolean {
  return Boolean(p.date) && !isPaidSelf(p);
}

/** 待发放 = 没有发放日期，一直留在列表里，不算已发 */
export function isPending(p: Pick<Payment, "date">): boolean {
  return !p.date;
}

/** 分组面板/清单里「代发」「待发放」两组的固定名字 */
export const PROXY_LABEL = "代发";
export const PENDING_LABEL = "待发放";

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

/** 金额求和（统一 round2，保证 A+B+C 与总计逐分相等） */
function sumAmount(rows: Payment[]): number {
  return round2(rows.reduce((s, p) => s + (p.amount || 0), 0));
}

export interface PaymentSummary {
  /** 列表条数（当前筛选后的全部笔数 = A + B + C） */
  count: number;
  /** 合计（含代发与待发放）= A + B + C */
  total: number;
  /** A：已发放（本人收款，只认有发放日期的） */
  selfCount: number;
  selfAmt: number;
  /** B：代发（代收，有发放日期但收款人非本人）—— 不计入已发 */
  proxyCount: number;
  proxyAmt: number;
  /** C：待发放（无发放日期）—— 不算已发 */
  pendingCount: number;
  pendingAmt: number;
}

/** 汇总数字（与列表、面板、下拉、打印同一份 rows）；三维修为互不重叠 */
export function paymentSummary(rows: Payment[]): PaymentSummary {
  const self = rows.filter(isPaidSelf);
  const proxy = rows.filter(isProxyPaid);
  const pending = rows.filter(isPending);
  return {
    count: rows.length,
    total: sumAmount(rows),
    selfCount: self.length,
    selfAmt: sumAmount(self),
    proxyCount: proxy.length,
    proxyAmt: sumAmount(proxy),
    pendingCount: pending.length,
    pendingAmt: sumAmount(pending),
  };
}

export type RowKind = "person" | "proxy" | "pending";

export interface OwnerRow {
  /** 实际收款人（入账人）；或 `PROXY_LABEL` / `PENDING_LABEL` 两组固定行 */
  owner: string;
  kind: RowKind;
  /** 笔数（person 行只计本人收款） */
  count: number;
  /** 金额（person 行只计本人收款，即该人「已发（本人）」） */
  amount: number;
  /** person 行专用提示：该人名下有多少笔是「他人代收」（只作提示，**不计入**本行金额/笔数） */
  proxyCount: number;
}

/** 人员行（只计本人收款）：金额即该人「已发（本人）」；代收部分不进这里 */
export function byOwnerRows(rows: Payment[]): OwnerRow[] {
  const map = new Map<string, OwnerRow>();
  const proxySeen = new Map<string, number>();
  for (const p of rows) {
    const owner = (p.owner || "").trim();
    if (isPaidSelf(p)) {
      const cur = map.get(owner) || { owner, kind: "person" as RowKind, count: 0, amount: 0, proxyCount: 0 };
      cur.count += 1;
      cur.amount += p.amount || 0;
      map.set(owner, cur);
    } else if (isProxyPaid(p)) {
      proxySeen.set(owner, (proxySeen.get(owner) || 0) + 1);
    }
  }
  const out = [...map.values()];
  for (const r of out) {
    r.amount = round2(r.amount);
    r.proxyCount = proxySeen.get(r.owner) || 0;
  }
  return out.sort((a, b) => b.amount - a.amount || a.owner.localeCompare(b.owner, "zh"));
}

/**
 * 打印/面板的可见范围：`ALL_BUCKETS` = 全部；否则 = 该实际收款人名下
 * （含他本人的已发、他名下的代发、他名下的待发放）。
 */
export function scopeRows(rows: Payment[], owner: string): Payment[] {
  return owner === ALL_BUCKETS ? rows : rows.filter((p) => inBucket((p.owner || "").trim(), owner));
}

/** 把「代发」「待发放」两组接到人员行后面（金额与笔数单列，不进任何人已发合计） */
function appendGroups(persons: OwnerRow[], scope: Payment[]): OwnerRow[] {
  const out = [...persons];
  const proxy = scope.filter(isProxyPaid);
  if (proxy.length) {
    out.push({ owner: PROXY_LABEL, kind: "proxy", count: proxy.length, amount: sumAmount(proxy), proxyCount: 0 });
  }
  const pending = scope.filter(isPending);
  if (pending.length) {
    out.push({ owner: PENDING_LABEL, kind: "pending", count: pending.length, amount: sumAmount(pending), proxyCount: 0 });
  }
  return out;
}

/** 模式二：按实际收款人的汇总清单（人员行 + 代发 + 待发放） */
export function printSummary(rows: Payment[], owner: string): OwnerRow[] {
  const scope = scopeRows(rows, owner);
  return appendGroups(byOwnerRows(scope), scope);
}

/**
 * 屏幕上的「按实际收款人」分组面板：与「全部实际收款人」的打印汇总**同一份数据**
 * （人员行 + 「代发」+ 「待发放」）。
 */
export function panelRows(rows: Payment[]): OwnerRow[] {
  return printSummary(rows, ALL_BUCKETS);
}

/** 发放方下拉选项：真实存在的桶（含「未填发放方」） */
export function sourceBuckets(ranged: { source?: string }[]): Bucket[] {
  return groupBuckets(ranged.map((p) => p.source), "未填发放方");
}

/** 打印时可选的「实际收款人」下拉：只列当前筛选下**真有本人收款记录**的人 */
export function printOwnerBuckets(rows: Payment[]): Bucket[] {
  return groupBuckets(byOwnerRows(rows).map((r) => r.owner), "（未填实际收款人）");
}

export interface DetailSection {
  owner: string;
  kind: RowKind;
  rows: Payment[];
  count: number;
  amount: number;
  /** person 节：该人还有几笔是他人代收（提示用，不在本节的金额里） */
  proxyCount: number;
}

/** 按日期排序（同日按 id），明细/代发/待发放三处共用 */
function byDateThenId(a: Payment, b: Payment): number {
  return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id);
}

/**
 * 模式一：按实际收款人的明细清单（按人分节 + 「代发」节 + 「待发放」节）。
 * `owner` 为 `ALL_BUCKETS` = 全部人；否则只出这个人的范围（不存在就是空数组 → 页面禁用打印，不弹空白页）。
 */
export function detailSections(rows: Payment[], owner: string): DetailSection[] {
  const scope = scopeRows(rows, owner);
  const byOwner = byOwnerRows(scope);
  const order = new Map(byOwner.map((r, i) => [r.owner, i]));
  const sections: DetailSection[] = byOwner
    .map((r) => {
      const mine = scope
        .filter((p) => isPaidSelf(p) && (p.owner || "").trim() === r.owner)
        .slice()
        .sort(byDateThenId);
      return {
        owner: r.owner,
        kind: "person" as RowKind,
        rows: mine,
        count: mine.length,
        amount: sumAmount(mine),
        proxyCount: r.proxyCount,
      };
    })
    .filter((s) => s.rows.length > 0)
    .sort((a, b) => (order.get(a.owner) ?? 0) - (order.get(b.owner) ?? 0));
  const proxy = scope.filter(isProxyPaid).slice().sort(byDateThenId);
  if (proxy.length) {
    sections.push({ owner: PROXY_LABEL, kind: "proxy", rows: proxy, count: proxy.length, amount: sumAmount(proxy), proxyCount: 0 });
  }
  const pending = scope.filter(isPending).slice().sort(byDateThenId);
  if (pending.length) {
    sections.push({ owner: PENDING_LABEL, kind: "pending", rows: pending, count: pending.length, amount: sumAmount(pending), proxyCount: 0 });
  }
  return sections;
}

export interface PrintTotals {
  count: number;
  amount: number;
}

/** 打印范围的总计 = 已发（本人）+ 代发 + 待发放（选单人时就是那个人的三者之和） */
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

/** 打印件表头口径小字（决策一 + 决策四）：三维修都写全，页面直接引这一份 */
export const PRINT_CALIBER_NOTE =
  "只计已填发放日期的记录；代收（收款人非本人）不计入已发，单列代发；待发放不算已发。";
