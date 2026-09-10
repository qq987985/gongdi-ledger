import { parseDateYmd } from "./dates";

export interface IdCardInfo {
  gender: string;
  age: number | null;
  birthday: string;
}

export function parseIdCard(idCard: string | undefined | null): IdCardInfo {
  const s = (idCard || "").trim().toUpperCase();
  // 只认 15 位（老证）与 18 位；16/17 位是漏打/多打，按「未知」处理，
  // 否则会走 15 位分支解析出一个错误生日与性别。
  if (s.length !== 15 && s.length !== 18) return { gender: "", age: null, birthday: "" };
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
    // 防 Date 溢出进位（如 2 月 31 日 → 3 月 3 日）：回读比对年月日
    const yIn = Number(s.length === 18 ? s.slice(6, 10) : "19" + s.slice(6, 8));
    const mIn = Number(s.slice(s.length === 18 ? 10 : 8, s.length === 18 ? 12 : 10));
    const dIn = Number(s.slice(s.length === 18 ? 12 : 10, s.length === 18 ? 14 : 12));
    if (birth.getFullYear() !== yIn || birth.getMonth() + 1 !== mIn || birth.getDate() !== dIn)
      return { gender: "", age: null, birthday: "" };
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
  // 15 位老身份证：只校验出生日期（无校验码）。注意必须在「不足 18 位不校验」之前，
  // 否则 15 位证永远被长度判断提前返回。
  if (/^\d{15}$/.test(s)) {
    const yy = Number(s.slice(6, 8));
    const year = yy >= 70 ? 1900 + yy : 2000 + yy;
    const birth = new Date(`${year}-${s.slice(8, 10)}-${s.slice(10, 12)}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return "身份证号中的出生日期无效";
    // 防 Date 溢出进位（如 2 月 31 日）：回读比对
    if (birth.getMonth() + 1 !== Number(s.slice(8, 10)) || birth.getDate() !== Number(s.slice(10, 12)))
      return "身份证号中的出生日期无效";
    return "";
  }
  if (s.length < 18) {
    // 15 位已在上面处理。16/17 位只可能是漏打或多打，不再当成「还没输完」静默放行
    // （以前会被放过存库，且 parseIdCard 按 15 位解析出一个错误生日）。
    return `身份证号应为 15 位或 18 位（现在是 ${s.length} 位）`;
  }
  if (s.length > 18) return "身份证号应为 18 位";
  if (!/^\d{17}[\dX]$/.test(s)) return "身份证号格式不对：前 17 位数字，末位数字或 X";
  const birth = new Date(`${s.slice(6, 10)}-${s.slice(10, 12)}-${s.slice(12, 14)}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "身份证号中的出生日期无效";
  // 防 Date 溢出进位（如 2 月 31 日）：回读比对
  if (birth.getMonth() + 1 !== Number(s.slice(10, 12)) || birth.getDate() !== Number(s.slice(12, 14)))
    return "身份证号中的出生日期无效";
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
