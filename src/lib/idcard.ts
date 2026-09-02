import { parseDateYmd } from "./dates";

export interface IdCardInfo {
  gender: string;
  age: number | null;
  birthday: string;
}

export function parseIdCard(idCard: string | undefined | null): IdCardInfo {
  const s = (idCard || "").trim().toUpperCase();
  if (s.length < 15) return { gender: "", age: null, birthday: "" };
  try {
    let birth: Date;
    let gcode: number;
    if (s.length === 18) {
      birth = new Date(`${s.slice(6, 10)}-${s.slice(10, 12)}-${s.slice(12, 14)}T00:00:00`);
      gcode = Number(s[16]);
    } else {
      birth = new Date(`19${s.slice(6, 8)}-${s.slice(8, 10)}-${s.slice(10, 12)}T00:00:00`);
      gcode = Number(s[14]);
    }
    if (Number.isNaN(birth.getTime())) return { gender: "", age: null, birthday: "" };
    const gender = gcode % 2 === 1 ? "男" : "女";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const md = today.getMonth() - birth.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age -= 1;
    const y = birth.getFullYear();
    const m = String(birth.getMonth() + 1).padStart(2, "0");
    const d = String(birth.getDate()).padStart(2, "0");
    return { gender, age, birthday: `${y}-${m}-${d}` };
  } catch {
    return { gender: "", age: null, birthday: "" };
  }
}

export function overAgeLabel(age: number | null | undefined, gender: string | undefined): string {
  if (age == null) return "";
  return age >= (gender === "女" ? 45 : 55) ? "超龄" : "未超龄";
}

export function normalizeIdDate(value: unknown, allowLong = false): string {
  const t = String(value ?? "").trim();
  if (!t) return "";
  if (allowLong && /长期/.test(t)) return "长期";
  return parseDateYmd(t) || t;
}
