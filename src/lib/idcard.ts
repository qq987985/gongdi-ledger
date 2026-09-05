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

/** 校验身份证号（18 位），返回错误提示；未输满 18 位或空返回空字符串。 */
export function validateIdCard(idCard: string | undefined | null): string {
  const s = (idCard || "").trim().toUpperCase();
  if (!s) return "";
  if (s.length < 18) return ""; // 输入中，先不校验
  // 15 位老身份证：只校验出生日期（无校验码）
  if (/^\d{15}$/.test(s)) {
    const yy = Number(s.slice(6, 8));
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    const birth = new Date(`${year}-${s.slice(8, 10)}-${s.slice(10, 12)}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return "身份证号中的出生日期无效";
    return "";
  }
  if (s.length > 18) return "身份证号应为 18 位";
  if (!/^\d{17}[\dX]$/.test(s)) return "身份证号格式不对：前 17 位数字，末位数字或 X";
  const birth = new Date(`${s.slice(6, 10)}-${s.slice(10, 12)}-${s.slice(12, 14)}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "身份证号中的出生日期无效";
  const w = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = "10X98765432";
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += Number(s[i]) * w[i];
  if (codes[sum % 11] !== s[17]) return "身份证号校验码不对，请核对";
  return "";
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
