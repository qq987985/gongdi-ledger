/**
 * 团体保险结算纯函数：在保判定、人天计算（含保单期夹紧）、替换边界、空记录。
 * 从 src/routes/insurance.tsx 原样搬出（1.7.20），口径见 开发规范.md §4「保险结算」。
 */
import { daysBetween, localToday } from "./dates";
import type { InsuranceMember, InsurancePolicy } from "./types";

const today = localToday;

/**
 * 组合险（互挂保单）的展示标注（决策三，1.8.5）。
 * 业务事实：两张互挂保单各自一份名单、各自计费 —— **不跨保单去重**（去重会改人数与保费口径）。
 * 保险页与保险合同清单/打印件都必须带上这句，让看数的人知道人数/保费为什么会在两张保单上重复出现。
 */
export const COMBINED_POLICY_NOTE =
  "组合险（互挂保单）：同一个人可能同时出现在两张保单上，人数与保费按各保单分别计算，不合并去重。";

export function datePart(dt: string): string {
  return (dt || "").slice(0, 10);
}

export function memberDays(m: InsuranceMember, clampTo?: { start: string; end: string }): number {
  let start = m.startDate;
  let end = m.endDate || today();
  if (clampTo) {
    // 手填或残留日期越出保单期的部分不计，避免结算超过保费本身
    if (clampTo.start && (!start || start < clampTo.start)) start = clampTo.start;
    if (clampTo.end && (!end || end > clampTo.end)) end = clampTo.end;
  }
  if (start && end && start > end) return 0;
  return daysBetween(start, end);
}

/** 是否仍在保：没有结束日期，或结束日期还没到今天。 */
export function isActive(m: InsuranceMember): boolean {
  if (!m.endDate) return true;
  const end = datePart(m.endDate);
  return end ? end >= today() : true;
}

/** 给定某天，返回前一天 23:59（用于被替换人的结束时间）。 */
export function prevDayEnd(dt: string): string {
  const d = datePart(dt);
  if (!d) return "";
  const t = new Date(`${d}T00:00:00`);
  t.setDate(t.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} 23:59`;
}

export function emptyPolicy(): InsurancePolicy {
  return {
    id: "",
    policyNo: "",
    buyer: "",
    name: "",
    company: "",
    premiumPerPerson: 0,
    headcount: 0,
    coverage: 0,
    periodStart: `${today()} 00:00`,
    periodEnd: "",
    linkedPolicyId: "",
    contracts: [],
    remark: "",
  };
}

export function emptyMember(policyId: string): InsuranceMember {
  return { id: "", policyId, name: "", leader: "", startDate: `${today()} 00:00`, endDate: "", remark: "" };
}
