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
  pay: number;
  monthly: boolean;
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
    pay: round2(base + ot + allowance - deduction),
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
