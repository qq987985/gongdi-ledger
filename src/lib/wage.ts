import type { Person, WageHistory } from "./types";

export interface OtRule {
  kind: "none" | "hour" | "fold";
  param: number;
  label: string;
}

export function parseOtRule(rule: string | undefined | null): OtRule {
  const s = (rule || "").trim();
  if (!s) return { kind: "none", param: 0, label: "不计加班" };
  const [head, tail] = s.includes(":") ? s.split(":", 2) : [s, ""];
  const param = Number(tail);
  if (head.startsWith("按小时") && param > 0)
    return { kind: "hour", param, label: `按小时 ${param} 元` };
  if (head.startsWith("折算") && param > 0)
    return { kind: "fold", param, label: `折算 ${param} 小时/天` };
  return { kind: "none", param: 0, label: s };
}

export function encodeOtRule(kind: string, param: number): string {
  if (kind === "hour" && param > 0) return `按小时:${param}`;
  if (kind === "fold" && param > 0) return `折算:${param}`;
  return "";
}

/** 人员或工资来源的最小形状 */
export interface WageSource {
  payType?: string;
  dailyWage?: number;
  monthWage?: number;
  otRule?: string;
  mealAllowance?: number; // 餐补/天
}

export interface MonthAttendance {
  days?: number;
  otHours?: number;
  allowance?: number;
  deduction?: number;
}

export interface MonthPayResult {
  days: number;
  otHours: number;
  allowance: number;
  deduction: number;
  ot: number;
  base: number;
  meal: number; // 餐补
  pay: number;
  monthly: boolean;
}

/** 根据年月获取人员当时的工资配置 */
export function getWageAt(person: Person | null | undefined, year: number, month: number): WageSource {
  if (!person) return {};
  
  // 构建查询日期（该月最后一天）
  const queryDate = `${year}-${String(month).padStart(2, "0")}-28`;
  
  // 如果有工资历史，找匹配的记录
  const history = person.wageHistory || [];
  if (history.length > 0) {
    // 按生效日期排序（从早到晚）
    const sorted = [...history]
      .filter((h) => (h.fromDate || "").trim() !== "")
      .sort((a, b) => a.fromDate.localeCompare(b.fromDate));
    // 找最后一条生效日期 <= 查询日期的记录
    let matched: WageHistory | undefined;
    for (const h of sorted) {
      if (h.fromDate <= queryDate) {
        matched = h;
      } else {
        break;
      }
    }
    if (matched) {
      return {
        payType: matched.payType,
        dailyWage: matched.dailyWage,
        monthWage: matched.monthWage,
        otRule: matched.otRule,
        mealAllowance: matched.mealAllowance,
      };
    }
  }
  
  // 没有历史记录，返回当前工资字段（兼容旧数据）
  return {
    payType: person.payType,
    dailyWage: person.dailyWage,
    monthWage: person.monthWage,
    otRule: person.otRule,
    mealAllowance: person.mealAllowance,
  };
}

export function isMonthly(p: WageSource | null | undefined): boolean {
  return p?.payType === "month";
}

export function wageLabel(p: WageSource | null | undefined): string {
  if (!p) return "—";
  if (isMonthly(p)) return p.monthWage ? `¥${p.monthWage}/月` : "未设月薪";
  return p.dailyWage ? `¥${p.dailyWage}/天` : "未设日薪";
}

export function foldDaily(p: WageSource): number {
  if (p.dailyWage) return p.dailyWage;
  if (isMonthly(p) && p.monthWage) return round2(p.monthWage / 30);
  return 0;
}

export function overtimePay(otHours: number, dailyWage: number, rule: string): number {
  const p = parseOtRule(rule);
  if (!otHours || p.kind === "none") return 0;
  if (p.kind === "hour") return round2(otHours * p.param);
  if (p.kind === "fold" && p.param > 0) return round2((otHours / p.param) * dailyWage);
  return 0;
}

export function monthPay(
  a: MonthAttendance | null | undefined,
  src: WageSource | number = 0,
  otRule = "",
): MonthPayResult {
  const p: WageSource =
    typeof src === "number" ? { dailyWage: src, otRule, payType: "day" } : src || {};
  const days = a?.days || 0;
  const otHours = a?.otHours || 0;
  const allowance = a?.allowance || 0;
  const deduction = a?.deduction || 0;
  const monthly = isMonthly(p);
  const ot = overtimePay(otHours, foldDaily(p), p.otRule || otRule || "");
  // 餐补 = 正常出勤天数 × 餐补标准（加班折算的工天不算）
  const meal = round2(days * (p.mealAllowance || 0));
  const base = monthly
    ? days > 0 || otHours > 0 || allowance !== 0 || deduction !== 0
      ? p.monthWage || 0
      : 0
    : round2(days * (p.dailyWage || 0));
  return {
    days,
    otHours,
    allowance,
    deduction,
    ot,
    base,
    meal,
    pay: round2(base + ot + meal + allowance - deduction),
    monthly,
  };
}

export function hasWork(a: MonthAttendance | null | undefined): boolean {
  if (!a) return false;
  return (
    (a.days || 0) > 0 ||
    (a.otHours || 0) > 0 ||
    (a.allowance || 0) !== 0 ||
    (a.deduction || 0) !== 0
  );
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
