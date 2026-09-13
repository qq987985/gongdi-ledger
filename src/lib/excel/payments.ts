import type * as XLSX from "xlsx";
import { uid } from "../utils";
import type { Payment } from "../types";
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

export function rowToPayment(row: Row): Payment | null {
  const owner = pick(row, ["实际收款人", "实际入账人", "入账人"]) || pick(row, ["姓名"]);
  if (!owner || isTotalRow(owner)) return null;
  const receiver = pick(row, ["收款人"]) || owner;
  return {
    id: uid(),
    owner,
    receiver,
    date: normalizeDate(pick(row, ["发放日期", "日期"])),
    amount: parseNumber(pick(row, ["发放金额(元)", "发放金额", "金额"])),
    source: pick(row, ["发放方", "来源"]),
    remark: pick(row, ["备注"]),
  };
}

export function parsePaymentSheet(buf: ArrayBuffer | Uint8Array): Payment[] {
  const wb = readWb(buf);
  const preferred = wb.SheetNames.find((n) => n.includes("发放")) || wb.SheetNames[0];
  return sheetRecords(wb.Sheets[preferred])
    .map(rowToPayment)
    .filter((x): x is Payment => x !== null);
}
export const DEMO_PAY: unknown[][] = [
  ["实际收款人", "发放日期", "发放金额(元)", "发放方", "收款人", "备注"],
  ["张三", "2026-04-28", 1e4, "示例工程4月请款", "张三", "本人"],
  ["李四", "", 8e3, "示例工程4月请款", "张三", "已上报未发，日期可空"],
];
export function paymentTemplateWb(): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, titledSheet("发放记录导入模板", DEMO_PAY), "发放记录");
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "实际收款人 = 入账人（钱记在谁头上）。",
      "收款人 = 去银行领钱的人，可以帮实际收款人代收。",
      "发放日期可空：空=已上报还没发，以后在软件里勾选再统一补日期。",
      "日期写成 2026/4/28 或 2026-04-28 都可以。",
      "请把张三、李四改成自己的人再导入。",
    ]),
    "填写说明",
  );
  return wb;
}
export function paymentSheetAoa(payments: Payment[]): unknown[][] {
  const payAoa: unknown[][] = [
    ["发放记录表"],
    ["序号", "实际收款人", "发放日期", "发放金额(元)", "发放方", "收款人", "备注"],
  ];
  const payRows = [...payments].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  payRows.forEach((p, i) => {
    payAoa.push([i + 1, p.owner, p.date, p.amount, p.source, p.receiver, p.remark]);
  });
  return payAoa;
}
export function buildPaymentWorkbook(payments: Payment[]): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheetFromAoa(paymentSheetAoa(payments || [])), "发放记录");
  return wb;
}
