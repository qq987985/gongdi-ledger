import type * as XLSX from "xlsx";
import { uid } from "../utils";
import { round2 } from "../wage";
import { parseDateYmd } from "../dates";
import { parseNum } from "../num";
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
    id: pick(row, ["记录编号（勿修改）", "记录编号"]) || uid(),
    owner,
    receiver,
    date: normalizeDate(pick(row, ["发放日期", "日期"])),
    // 导入端也取整到分（专家评审 A-2）：Excel 里是公式结果（如 1234.567）时，
    // 不取整会让「已发小计 + 待发小计」与表尾总计差 0.01
    amount: round2(parseNumber(pick(row, ["发放金额(元)", "发放金额", "金额"]))),
    source: pick(row, ["发放方", "来源"]),
    remark: pick(row, ["备注"]),
  };
}

export function parsePaymentSheet(buf: ArrayBuffer | Uint8Array): Payment[] {
  return paymentRecords(buf).map(rowToPayment).filter((x): x is Payment => x !== null);
}

function paymentRecords(buf: ArrayBuffer | Uint8Array): Row[] {
  const wb = readWb(buf);
  const preferred = wb.SheetNames.find((n) => n.includes("发放")) || wb.SheetNames[0];
  return sheetRecords(wb.Sheets[preferred]);
}

/** 交互导入先完整校验；有问题时不允许以“有效的部分”覆盖台账。旧解析入口保持兼容。 */
export function inspectPaymentSheet(buf: ArrayBuffer | Uint8Array): { rows: Payment[]; errors: string[] } {
  const records = paymentRecords(buf);
  const rows: Payment[] = [];
  const errors: string[] = [];
  const ownerKeys = ["实际收款人", "实际入账人", "入账人", "姓名"];
  const amountKeys = ["发放金额(元)", "发放金额", "金额"];
  if (records.length && (!ownerKeys.some((k) => k in records[0]) || !amountKeys.some((k) => k in records[0])))
    return { rows, errors: ["缺少实际收款人（或姓名）、发放金额列，请使用发放模板或软件导出的发放文件。"] };
  for (const [i, row] of records.entries()) {
    const owner = pick(row, ownerKeys);
    if (isTotalRow(owner) || (!owner && isTotalRow(pick(row, ["序号"])))) continue;
    if (!owner) errors.push(`第 ${i + 1} 条数据缺少实际收款人，请补全后重新导入。`);
    const amount = parseNum(pick(row, amountKeys));
    if (amount === null || !Number.isFinite(round2(amount))) errors.push(`第 ${i + 1} 条发放金额为空或不是有效数字，请修正后重新导入。`);
    const date = pick(row, ["发放日期", "日期"]);
    if (date && !parseDateYmd(date)) errors.push(`第 ${i + 1} 条发放日期无效；待发放请留空，其余请填真实日期。`);
    const parsed = rowToPayment(row);
    if (parsed) rows.push(parsed);
  }
  return { rows: errors.length ? [] : rows, errors };
}
export const DEMO_PAY: unknown[][] = [
  ["实际收款人", "发放日期", "发放金额(元)", "发放方", "收款人", "备注", "记录编号（勿修改）"],
  ["张三", "2026-04-28", 1e4, "示例工程4月请款", "张三", "本人", ""],
  ["李四", "", 8e3, "示例工程4月请款", "张三", "已上报未发，日期可空", ""],
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
      "修正已有发放请先从软件导出，保留「记录编号（勿修改）」列，再选「本次替换」。旧文件无编号时需手动选择原记录。",
      "新增记录请用空白编号；不要复制其他记录的编号。全部替换会覆盖当前台账所有年份的发放记录。",
    ]),
    "填写说明",
  );
  return wb;
}
export function paymentSheetAoa(payments: Payment[]): unknown[][] {
  const payAoa: unknown[][] = [
    ["发放记录表"],
    ["序号", "实际收款人", "发放日期", "发放金额(元)", "发放方", "收款人", "备注", "记录编号（勿修改）"],
  ];
  const payRows = [...payments].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  payRows.forEach((p, i) => {
    payAoa.push([i + 1, p.owner, p.date, p.amount, p.source, p.receiver, p.remark, p.id]);
  });
  return payAoa;
}
export function buildPaymentWorkbook(payments: Payment[]): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheetFromAoa(paymentSheetAoa(payments || [])), "发放记录");
  return wb;
}
