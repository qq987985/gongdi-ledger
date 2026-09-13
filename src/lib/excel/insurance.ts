import type * as XLSX from "xlsx";
import { uid } from "../utils";
import type { InsuranceMember } from "../types";
import {
  isTotalRow,
  normalizeDate,
  normalizeEndDate,
  noteSheet,
  pick,
  readWb,
  sheetRecords,
  titledSheet,
  utils,
} from "./common";

export function insuranceMemberTemplateWb(): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(
    wb,
    titledSheet("保险人员导入模板", [
      ["姓名", "队长", "备注"],
      ["张三", "王队长", "示例，导入前请改"],
      ["李四", "王队长", "示例，导入前请改"],
    ]),
    "保险人员",
  );
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "姓名必填；队长手填。",
      "不用填开始/结束日期，导入时会自动用保单的保险期起止。",
      "请把张三、李四改成自己的人再导入。",
    ]),
    "填写说明",
  );
  return wb;
}

export function parseInsuranceMembersSheet(buf: ArrayBuffer | Uint8Array): InsuranceMember[] {
  const wb = readWb(buf);
  const preferred = wb.SheetNames.find((n) => n.includes("保险")) || wb.SheetNames[0];
  return sheetRecords(wb.Sheets[preferred])
    .map((row) => {
      const name = pick(row, ["姓名", "name"]);
      if (!name || isTotalRow(name)) return null;
      return {
        id: uid(),
        policyId: "",
        name,
        leader: pick(row, ["队长", "组长"]),
        startDate: normalizeDate(pick(row, ["开始日期", "开始时间", "日期"])),
        endDate: normalizeEndDate(pick(row, ["结束日期", "结束时间"])),
        remark: pick(row, ["备注"]),
      } as InsuranceMember;
    })
    .filter((x): x is InsuranceMember => x !== null);
}
