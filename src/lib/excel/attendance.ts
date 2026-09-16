import type * as XLSX from "xlsx";
import { uid } from "../utils";
import type { AttendanceRow } from "../types";
import {
  detectWorkbookYear,
  isDerivedSheet,
  isTotalRow,
  noteSheet,
  numOr,
  numPick,
  pick,
  readWb,
  sheetRecords,
  titledSheet,
  utils,
  type Row,
} from "./common";

export function attFromRow(row: Row, year: number, month: number): AttendanceRow | null {
  const name = pick(row, ["姓名"]);
  if (!name || isTotalRow(name)) return null;
  return {
    id: uid(),
    year,
    month,
    name,
    team: pick(row, ["班组"]),
    days: numPick(row, ["出勤天数", "出勤"]),
    otHours: numPick(row, ["加班小时", "加班"]),
    allowance: numPick(row, ["补助", "补贴", "津贴"]),
    deduction: numPick(row, ["扣款", "罚款"]),
    remark: pick(row, ["备注"]),
  };
}
export function parseAttendanceSheet(buf: ArrayBuffer | Uint8Array, year: number): AttendanceRow[] {
  const wb = readWb(buf);
  const y = detectWorkbookYear(wb, year);
  const out: AttendanceRow[] = [];
  for (const name of wb.SheetNames) {
    if (isDerivedSheet(name)) continue;
    const monthMatch = name.match(/(\d+)\s*月/);
    const rows = sheetRecords(wb.Sheets[name]);
    for (const row of rows) {
      // 「月份」列是手填的（可能是「3月」「３」这种），用容错解析：读不出来才回落到 sheet 名里的月份。
      // 老写法 `Number("3月")` 是 NaN → 静默按 sheet 月份/0 处理，会造出月份错的幽灵考勤。
      const month = numOr(pick(row, ["月份", "月"]), 0) || (monthMatch ? Number(monthMatch[1]) : 0);
      const sheetYear = name.match(/(20\d{2})/);
      const rec = attFromRow(row, sheetYear ? Number(sheetYear[1]) : y, month);
      if (rec) out.push(rec);
    }
  }
  return out;
}
export const DEMO_ATT: unknown[][] = [
  ["姓名", "出勤天数", "加班小时", "补助", "扣款"],
  ["张三", 26, 12, 200, 0],
  ["李四", 22, 8, 0, 50],
];
export function attendanceTemplateWb(year: number): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, titledSheet("考勤导入模板", DEMO_ATT), "考勤");
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "只填当月实际出勤的人，不必把全员都写上。",
      "列：姓名、出勤天数、加班小时、补助、扣款。",
      "应发：按工天 = 出勤×日工资 + 加班费 + 补助 − 扣款。按月 = 有出勤则月工资 + 加班费 + 补助 − 扣款。",
      "示例张三、李四请改成自己的姓名。",
      `导入时会询问写入哪一年哪一月。当前默认年：${year}`,
    ]),
    "填写说明",
  );
  return wb;
}
