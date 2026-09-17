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

/**
 * 保险期算不出天数时的**明确提示**（专家评审 B-12①，1.8.14）。
 *
 * 现象：`periodEnd` 没填（或结束早于开始）时 `daysBetween()` 回 0 →
 * 「每人每天 = 每人保费 ÷ 保险期天数」算不出来 → **整张保单每个人的保费静默变成 0**；
 * 界面只是「每人每天 ¥0.00 / 保费合计 ¥0.00」，分不清是「没填期限」还是「本来就该 0」。
 *
 * 口径**不改**（`memberCalc` 仍是 periodDays ≤ 0 → 0，测试锁着），只把原因说出来：
 * 返回空串 = 保险期正常；返回文案 = 屏幕与打印件都必须原样显示这句。
 */
export function periodUnsetNotice(
  policy: Pick<InsurancePolicy, "periodStart" | "periodEnd"> | null | undefined,
): string {
  if (!policy) return "";
  const start = datePart(policy.periodStart);
  const end = datePart(policy.periodEnd);
  if (!end) return "保险期结束日期未填：算不出保险期天数，本单每个人的保费都是 0。请先在「编辑保单」里补上结束日期。";
  if (!start) return "保险期开始日期未填：算不出保险期天数，本单每个人的保费都是 0。请先补上开始日期。";
  if (end < start)
    return `保险期结束日期（${end}）早于开始日期（${start}）：算不出天数，本单每个人的保费都是 0。请核对保险期。`;
  return "";
}

/** 保险期是否算不出天数（= 本单保费全为 0 的原因）：展示层用它决定要不要出这句提示 */
export function periodHasNoDays(policy: Pick<InsurancePolicy, "periodStart" | "periodEnd"> | null | undefined): boolean {
  return periodUnsetNotice(policy) !== "";
}
