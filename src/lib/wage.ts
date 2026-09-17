import type { Person, WageHistory } from "./types";

export interface OtRule {
  kind: "none" | "hour" | "fold";
  param: number;
  label: string;
}

/**
 * 没设加班规则时的显示文案（1.8.8 修 B 组 A14）。
 *
 * 之前空规则也显示「不计加班」，与考勤页顶部警示「有 N 人**还没在人员表设加班规则**」
 * 自相矛盾 —— 用户分不清「没设（视为不计加班）」和「明确选了不计加班」。
 * 现在：空规则 → 本常量；非空但认不出的老文本（如手写的「不计加班」）→ 原文照显。
 * 唯一实现，月表 / 人员页 / 个人查询 / 批量改工资预览共用。
 */
export const OT_RULE_UNSET_LABEL = "未设加班规则";

export function parseOtRule(rule: string | undefined | null): OtRule {
  const s = (rule || "").trim();
  if (!s) return { kind: "none", param: 0, label: OT_RULE_UNSET_LABEL };
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

/**
 * 把调薪生效日补成 `YYYY-MM-DD`，供字符串比较用。
 *
 * 历史数据里有 `2026-7-1` 这种没补零的写法，直接比较会得到
 * `"2026-7-1" > "2026-07-31"` —— 那条调薪当月读不到，工资静默回退成当前工资。
 * 解析不了的原样返回（保持旧行为：比较结果自然不匹配 → 回退当前工资）。
 *
 * 这里没有用 `dates.ts` 的 `parseDateYmd`：本文件只该被「工资计算」依赖，
 * 不反向依赖工具模块（hasWork 已抽到 work.ts，dates ↔ wage 的环随之解开）。
 */
function padFromDate(v: string | undefined): string {
  const m = (v || "").trim().match(/^(\d{4})[-/.年](\d{1,2})[-/.月]?(\d{1,2})日?$/);
  if (!m) return (v || "").trim();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const inMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > inMonth) return "";
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 根据年月获取人员当时的工资配置 */
export function getWageAt(person: Person | null | undefined, year: number, month: number): WageSource {
  if (!person) return {};
  
  // 构建查询日期 = 该月最后一天（29/30/31 号生效的调薪当月即生效，不会延迟到下月）
  const lastDay = new Date(year, month, 0).getDate();
  const queryDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  
  // 如果有工资历史，找匹配的记录
  const history = person.wageHistory || [];
  if (history.length > 0) {
    // 按生效日期排序（从早到晚）
    const sorted = [...history]
      .map((h) => ({ h, from: padFromDate(h.fromDate) }))
      .filter((x) => x.from !== "")
      .sort((a, b) => a.from.localeCompare(b.from));
    // 找最后一条生效日期 <= 查询日期的记录
    let matched: WageHistory | undefined;
    for (const { h, from } of sorted) {
      if (from <= queryDate) {
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

/**
 * 金额取整到分（**全库唯一实现**：展示 / 打印 / Excel / 工资计算都靠它）。
 *
 * 1.8.14 修（专家评审 B-1）：旧写法 `Math.round((n + Number.EPSILON) * 100) / 100`
 * 的 EPSILON「修正」只在 `0 ≤ n < 2` 生效（`Number.EPSILON` 是绝对量，而浮点间距 ULP(n)
 * 随量级增长 —— 实测 `2.675 + Number.EPSILON === 2.675`），且负数方向反
 * （`Math.round(-100.5) === -100`，向 +∞ 取整）→ 半分进位在同一处给出三种结果：
 *
 *   round2(1.005) = 1.01    round2(8.075) = 8.07（应为 8.08）    round2(-1.005) = -1（应为 -1.01）
 *
 * 现在：取绝对值放大到「分」，补一个**半分钱量级**的容差 `1e-6`，再按符号还原 ——
 * 与量级无关、负数对称（-1.005 → -1.01），并顺手消掉 `-0`
 * （负数金额是常态：扣款 > 应发、开票 − 已付、未发为负）。
 *
 * 取舍：`1e-6`（= 1e-8 元）是「按十进制直觉半个分进位」的容差，代价是真值恰好
 * `8.074999x` 也会进位成 8.08 —— 二进制浮点没有完美解，两害相权取「与十进制直觉一致」。
 * 非有限数（NaN / Infinity）一律回 0，别让 NaN 传进金额链。
 */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const sign = n < 0 ? -1 : 1;
  const cents = Math.round(Math.abs(n) * 100 + 1e-6);
  if (cents === 0) return 0;
  return (sign * cents) / 100;
}
