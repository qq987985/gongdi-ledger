import type * as XLSX from "xlsx";
import { uid } from "../utils";
import { normalizeIdDate, parseIdCard } from "../idcard";
import type { Person, WageHistory } from "../types";
import {
  isTotalRow,
  normalizeDate,
  noteSheet,
  parseNumber,
  pick,
  readWb,
  sheetFromAoa,
  sheetRecords,
  titledSheet,
  utils,
  type Row,
} from "./common";

/** 调薪历史在表里存成一段 JSON（列名「工资历史」）：导出/导入必须无损，否则覆盖导入会静默清空它 */
function parseWageHistoryCell(raw: string): WageHistory[] {
  const t = (raw || "").trim();
  if (!t || t === "[]") return [];
  let arr: unknown;
  try {
    arr = JSON.parse(t);
  } catch {
    return []; // 手改坏了就当没有，不能让整行人员解析失败
  }
  if (!Array.isArray(arr)) return [];
  const out: WageHistory[] = [];
  for (const x of arr) {
    if (!x || typeof x !== "object") continue;
    const e = x as Record<string, unknown>;
    const fromDate = normalizeDate(String(e.fromDate || ""));
    if (!fromDate) continue;
    out.push({
      id: String(e.id || uid()),
      fromDate,
      payType: String(e.payType || "") === "month" ? "month" : "day",
      dailyWage: parseNumber(e.dailyWage),
      monthWage: parseNumber(e.monthWage),
      otRule: String(e.otRule || ""),
      mealAllowance: parseNumber(e.mealAllowance),
      remark: String(e.remark || ""),
    });
  }
  return out.sort((a, b) => a.fromDate.localeCompare(b.fromDate));
}

/** 导出一段 JSON（字段名保持可读，方便直接在表里核对） */
function wageHistoryCell(list: WageHistory[] | undefined): string {
  const arr = (list || []).filter((h) => (h.fromDate || "").trim() !== "");
  if (!arr.length) return "";
  return JSON.stringify(
    arr.map((h) => ({
      id: h.id,
      fromDate: h.fromDate,
      payType: h.payType,
      dailyWage: h.dailyWage,
      monthWage: h.monthWage,
      otRule: h.otRule,
      mealAllowance: h.mealAllowance,
      remark: h.remark,
    })),
  );
}
export function rowToPerson(row: Row): Person | null {
  const name = pick(row, ["姓名", "name"]);
  if (!name || isTotalRow(name) || name.includes("使用说明") || name === "人员信息表") return null;
  const idCard = pick(row, ["身份证号", "身份证", "idCard"]);
  const parsed = parseIdCard(idCard);
  return {
    id: uid(),
    name,
    team: pick(row, ["班组", "team"]),
    personNo: pick(row, ["IC卡号", "IC卡", "人员编号", "personNo"]),
    idCard,
    gender: parsed.gender || pick(row, ["性别"]),
    age: parsed.age,
    birthday: parsed.birthday,
    phone: pick(row, ["联系电话", "手机号", "电话"]),
    dailyWage: parseNumber(pick(row, ["日工资", "dailyWage"])),
    monthWage: parseNumber(pick(row, ["月工资", "monthWage"])),
    payType: /月/.test(pick(row, ["计薪方式", "计薪", "payType"])) ? "month" : "day",
    otRule: pick(row, ["加班规则", "计算加班规则", "otRule"]),
    mealAllowance: parseNumber(pick(row, ["餐补/天", "餐补", "mealAllowance"])),
    wageHistory: parseWageHistoryCell(pick(row, ["工资历史", "调薪历史", "wageHistory"])),
    bank: pick(row, ["开户行", "bank"]),
    cardNo: pick(row, ["银行卡号", "卡号", "cardNo"]),
    address: pick(row, ["户籍地址", "户籍地地址", "户籍地", "address"]),
    idIssuer: pick(row, ["身份证签发机关", "签发机关"]),
    idValidFrom: normalizeIdDate(pick(row, ["身份证有效期开始时间", "身份证有效期开始", "有效期开始"])),
    idValidTo: normalizeIdDate(
      pick(row, ["身份证有效期结束时间", "身份证有效期结束", "有效期结束", "有效期截止"]),
      true,
    ),
    remark: pick(row, ["备注"]),
  };
}

export function parsePeopleSheet(buf: ArrayBuffer | Uint8Array): Person[] {
  const wb = readWb(buf);
  const preferred = wb.SheetNames.find((n) => n.includes("人员")) || wb.SheetNames[0];
  return sheetRecords(wb.Sheets[preferred]).map(rowToPerson).filter((x): x is Person => Boolean(x));
}
export const DEMO_PEOPLE: unknown[][] = [
  [
    "姓名", "班组", "IC卡号", "身份证号", "身份证签发机关", "身份证有效期开始",
    "身份证有效期结束", "联系电话", "计薪方式", "日工资", "月工资", "加班规则", "餐补/天", "开户行",
    "银行卡号", "户籍地址", "备注",
  ],
  [
    "张三", "一班", "DEMO001", "110101199001011210", "北京市公安局东城分局", "2020-01-01",
    "2040-01-01", "13800001234", "按工天", "280", "", "按小时:25", "10", "中国工商银行北京分行",
    "6222021234567890123", "北京市东城区示例路1号", "示例数据，导入前请改成自己的人",
  ],
  [
    "李四", "二班", "DEMO002", "320106198506154512", "上海市公安局浦东分局", "2018-06-15",
    "长期", "13900005678", "按工天", "260", "", "折算:8", "0", "中国农业银行上海分行",
    "6228481234567890123", "上海市浦东新区示例路8号", "示例数据，导入前请改成自己的人",
  ],
];
export function peopleTemplateWb(): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, titledSheet("人员导入模板", DEMO_PEOPLE), "人员导入");
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "1. 第二行起是虚构示例：张三、李四，请改成你自己的人再导入。",
      "2. 带 * 必填：姓名、班组。按工天填日工资，按月填月工资。",
      "3. 计薪方式填「按工天」或「按月」。加班规则：按小时:25 或 折算:8，也可空。",
      "4. 身份证号会自动生成性别、年龄、生日。",
    ]),
    "填写说明",
  );
  return wb;
}
export function peopleSheetAoa(people: Person[]): unknown[][] {
  const peopleAoa: unknown[][] = [
    ["人员信息表"],
    [
      "序号", "姓名", "班组", "IC卡号", "联系电话", "计薪方式", "日工资", "月工资",
      "加班规则", "餐补/天", "性别", "年龄", "生日", "身份证号", "身份证签发机关", "身份证有效期开始",
      "身份证有效期结束", "开户行", "银行卡号", "户籍地址", "备注", "工资历史",
    ],
  ];
  people.forEach((p, i) => {
    peopleAoa.push([
      i + 1, p.name, p.team, p.personNo || "", p.phone || "",
      p.payType === "month" ? "按月" : "按工天", p.dailyWage || "", p.monthWage || "",
      p.otRule || "", p.mealAllowance || "", p.gender || "", p.age ?? "", p.birthday || "", p.idCard || "",
      p.idIssuer || "", p.idValidFrom || "", p.idValidTo || "", p.bank || "", p.cardNo || "",
      p.address || "", p.remark || "", wageHistoryCell(p.wageHistory),
    ]);
  });
  return peopleAoa;
}
export function buildPeopleWorkbook(people: Person[]): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheetFromAoa(peopleSheetAoa(people || [])), "人员信息");
  return wb;
}
