/**
 * 保险结算的「列表 / 汇总 / 按班组分组 / 队长下拉」四口径唯一实现
 * （口径一致性专项 20260916，从 src/routes/insurance.tsx 按行段机械提取，§12.1）。
 *
 * 改动的口径（只有一处）：队长下拉以前是 `[...new Set(members.map(m => m.leader).filter(Boolean))]`
 * —— 空队长那一桶被删掉，而打印件的「按班组汇总」里明明有「未分班组」一行：同一份数据，
 * 分组面板有、下拉里选不到；下拉还是从**所有保单**的成员里取的（会列出当前保单一个也没有的队长）。
 * 现在下拉来自当前保单的真实分组，并且「未分班组」可选。
 *
 * 金额与人天继续用 lib/insurance.ts 的 memberDays / 保单期夹紧（唯一算法），本模块只做分组与汇总。
 */
import { daysBetween } from "./dates";
import { isActive, memberDays } from "./insurance";
import { ALL_BUCKETS, groupBuckets, inBucket, type Bucket } from "./buckets";
import { round2 } from "./wage";
import type { InsuranceMember, InsurancePolicy } from "./types";

export interface MemberCalc {
  days: (m: InsuranceMember) => number;
  settle: (m: InsuranceMember) => number;
}

/** 人天/保费的计算器（由保单的每人保费与保险期决定） */
export function memberCalc(policy: Pick<InsurancePolicy, "periodStart" | "periodEnd" | "premiumPerPerson"> | null): MemberCalc {
  const clamp = { start: policy?.periodStart || "", end: policy?.periodEnd || "" };
  // 与页面原来一样：保险期天数用 daysBetween（结束日期为空 → 0 天，不按「到今天」算）
  const periodDays = policy ? daysBetween(policy.periodStart, policy.periodEnd) : 0;
  const perPersonDaily = periodDays > 0 ? (policy?.premiumPerPerson || 0) / periodDays : 0;
  const days = (m: InsuranceMember) => memberDays(m, clamp);
  return { days, settle: (m: InsuranceMember) => round2(perPersonDaily * days(m)) };
}

/** 队长筛选（`ALL_BUCKETS` = 全部；空串 = 未分班组）；状态筛选同上（空串 = 全部） */
export function filterMembers(
  members: InsuranceMember[],
  f: { leader: string; status: string },
): InsuranceMember[] {
  let list = members;
  if (f.leader !== ALL_BUCKETS) list = list.filter((m) => inBucket(m.leader, f.leader));
  if (f.status === "active") list = list.filter((m) => isActive(m));
  if (f.status === "ended") list = list.filter((m) => !isActive(m));
  return list;
}

export interface MemberStats {
  count: number;
  activeCount: number;
  endedCount: number;
  personDays: number;
  settle: number;
}

/** 一份成员名单的人数（在保/已结束）与人天/保费合计——同源，不许一部分过滤一部分不过滤 */
export function memberStats(members: InsuranceMember[], calc: MemberCalc): MemberStats {
  return {
    count: members.length,
    activeCount: members.filter((m) => isActive(m)).length,
    endedCount: members.filter((m) => !isActive(m)).length,
    personDays: round2(members.reduce((s, m) => s + calc.days(m), 0)),
    settle: round2(members.reduce((s, m) => s + calc.settle(m), 0)),
  };
}

export interface LeaderGroup {
  leader: string;
  count: number;
  days: number;
  settle: number;
}

/** 按班组（队长）汇总：空队长归「未分班组」，与打印件的分组表一致 */
export function leaderSummary(members: InsuranceMember[], calc: MemberCalc): LeaderGroup[] {
  const map = new Map<string, LeaderGroup>();
  for (const m of members) {
    const k = (m.leader || "").trim() || "未分班组";
    const cur = map.get(k) ?? { leader: k, count: 0, days: 0, settle: 0 };
    cur.count += 1;
    cur.days += calc.days(m);
    cur.settle += calc.settle(m);
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => {
    if (a.leader === "未分班组") return 1;
    if (b.leader === "未分班组") return -1;
    return a.leader.localeCompare(b.leader, "zh");
  });
}

/** 队长下拉选项：当前保单里真实存在的桶（含「未分班组」），空串是该桶的 value */
export function leaderBuckets(members: InsuranceMember[]): Bucket[] {
  return groupBuckets(members.map((m) => m.leader), "未分班组");
}

/** 分组表合计（与明细各自相加必须相等，打印件表尾用） */
export function groupTotals(groups: LeaderGroup[]): { count: number; days: number; settle: number } {
  return {
    count: groups.reduce((s, g) => s + g.count, 0),
    days: round2(groups.reduce((s, g) => s + g.days, 0)),
    settle: round2(groups.reduce((s, g) => s + g.settle, 0)),
  };
}
