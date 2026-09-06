import { hasWork } from "./wage";

export function ymd(y: number, m: number, d: number): string {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 本地时区的今天（YYYY-MM-DD），比 toISOString 安全（东八区 0–8 点不差一天） */
export function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function excelSerialYmd(n: number): string {
  if (!Number.isFinite(n)) return "";
  const whole = Math.floor(n);
  if (whole < 2e4 || whole > 8e4) return "";
  const utc = Date.UTC(1899, 11, 30) + whole * 864e5;
  const dt = new Date(utc);
  return ymd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** 把 Excel / 手填的各种日期收成 YYYY-MM-DD */
export function parseDateYmd(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return ymd(value.getFullYear(), value.getMonth() + 1, value.getDate());
  if (typeof value === "number") return excelSerialYmd(value);
  let t = String(value).trim();
  if (!t || /^长期/.test(t)) return "";
  t = t.replace(/[T ]\d{1,2}:\d{2}(:\d{2})?.*$/, "").trim();
  if (/^\d{5}(\.\d+)?$/.test(t)) return excelSerialYmd(Number(t));
  let m = t.match(/^(20\d{2}|19\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
  m = t.match(/^(20\d{2}|19\d{2})[/.](\d{2})(\d{2})$/);
  if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
  m = t.match(/^(20\d{2}|19\d{2})(\d{2})(\d{2})$/);
  if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|19\d{2}|\d{2})/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += y >= 70 ? 1900 : 2e3;
    if (a > 12 && b <= 12) return ymd(y, b, a);
    return ymd(y, a, b);
  }
  m = t.match(/(20\d{2}|19\d{2})\D+(\d{1,2})\D+(\d{1,2})/);
  if (m) return ymd(Number(m[1]), Number(m[2]), Number(m[3]));
  return "";
}

export function dateYearOf(value: unknown): number | null {
  const m = (parseDateYmd(value) || String(value || "")).match(/(20\d{2}|19\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 2e3 && y <= 2100 ? y : null;
}

interface YearSources {
  year?: number;
  years?: number[];
  attendance?: { year: number }[];
}

export function derivedYears(s: YearSources): number[] {
  const set = new Set<number>();
  if (s.year) set.add(s.year);
  for (const y of s.years || []) if (y >= 2e3 && y <= 2100) set.add(y);
  for (const a of s.attendance || []) if (a.year >= 2e3 && a.year <= 2100) set.add(a.year);
  if (!set.size) set.add(new Date().getFullYear());
  return [...set].sort((a, b) => a - b);
}

export function dateYear(date: unknown): number | null {
  return dateYearOf(date);
}

/** 无日期的旧发放记到台账里最早的一年，避免从汇总里消失 */
export function paymentYear(
  p: { date?: string },
  fallbackYear: number | undefined,
): number | null | undefined {
  return dateYear(p.date) ?? fallbackYear;
}

export function paymentsInYear<T extends { date?: string }>(
  payments: T[],
  year: number,
  fallbackYear: number | undefined,
): T[] {
  return payments.filter((p) => paymentYear(p, fallbackYear) === year);
}

export interface MonthStatusResult {
  total: number;
  filled: number;
  days: number;
  otHours: number;
  allowance: number;
  deduction: number;
}

export function monthStatus(
  attendance: ({
    year: number;
    month: number;
  } & import("./wage").MonthAttendance)[],
  year: number,
  month: number,
): MonthStatusResult {
  const rows = attendance.filter((a) => a.year === year && a.month === month);
  const filled = rows.filter((r) => hasWork(r));
  return {
    total: rows.length,
    filled: filled.length,
    days: filled.reduce((s, r) => s + (r.days || 0), 0),
    otHours: filled.reduce((s, r) => s + (r.otHours || 0), 0),
    allowance: filled.reduce((s, r) => s + (r.allowance || 0), 0),
    deduction: filled.reduce((s, r) => s + (r.deduction || 0), 0),
  };
}

export function confirmRemoveYear(y: number, filledMonths: number): boolean {
  if (typeof window === "undefined") return false;
  if (
    !window.confirm(
      `删除 ${y} 年？\n\n会删除：${y} 年 1–12 月考勤（已录 ${filledMonths} 个月）\n不会删除：人员名单、照片、发放记录、其他年份\n\n至少保留一年。删除后不能撤销。`,
    )
  )
    return false;
  return window.confirm(`最后确认：确定删除 ${y} 年的考勤吗？`);
}

export function nextYear(years: number[]): number {
  return (years.length ? Math.max(...years) : new Date().getFullYear()) + 1;
}

/** 解析 YYYY-MM-DD 或 YYYY-MM-DD HH:mm；缺时间时用 defaultTime（from 用 00:00，to 用 23:59）。 */
function parseDateTime(s: string, defaultTime: string): Date | null {
  const t = String(s || "").trim();
  if (!t) return null;
  const m = t.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}:\d{2}))?/);
  if (!m) return null;
  const d = new Date(`${m[1]}T${m[2] || defaultTime}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 两个时间点之间的天数（带小数，保留 2 位）。开始缺时间按 00:00，结束缺时间按 23:59。 */
export function daysBetween(from: string, to: string): number {
  const a = parseDateTime(from, "00:00");
  const b = parseDateTime(to, "23:59");
  if (!a || !b) return 0;
  const days = (b.getTime() - a.getTime()) / 864e5;
  return Math.max(0, Math.round(days * 100) / 100);
}
