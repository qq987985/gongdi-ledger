import type * as XLSX from "xlsx";
import { uid } from "../utils";
import type { Expense } from "../types";
import {
  isTotalRow,
  normalizeDate,
  noteSheet,
  numCell,
  numOut,
  numPick,
  parseNumber,
  pick,
  readWb,
  sheetFromAoa,
  sheetRecords,
  titledSheet,
  utils,
  type Row,
} from "./common";

export function rowToExpense(row: Row, fallbackYear?: number): Expense | null {
  const name = pick(row, ["项目名称", "名称", "name"]);
  if (!name || isTotalRow(name)) return null;
  // 单元格有值（哪怕 0）就按值用；只有整列缺失（老模板）才回落到 数量×单价 / 1
  const amt = numCell(row, ["金额", "amount"]);
  const qtyCell = numCell(row, ["数量", "qty"]);
  const priceCell = numCell(row, ["单价", "price"]);
  const amount = amt.n;
  const year = parseNumber(pick(row, ["年份"])) || fallbackYear || new Date().getFullYear();
  const qty = qtyCell.has ? qtyCell.n : 1;
  const price = priceCell.has ? priceCell.n : amount;
  return {
    id: uid(),
    year,
    name,
    period: pick(row, ["期间", "购买时间", "日期"]) || "",
    date: normalizeDate(pick(row, ["购买时间", "日期"])) || "",
    unit: pick(row, ["单位"]) || "项",
    qty,
    price,
    amount: amt.has ? amount : qty * price,
    remark: pick(row, ["备注"]),
    payMethod: pick(row, ["支付方式"]) || "现金",
    status: /已报销/.test(pick(row, ["状态"])) ? "已报销" : "未报销",
    reimbursedAt: pick(row, ["打款日期"]) || "",
    voucherId: "",
    voucherFileName: pick(row, ["凭证文件"]),
    claimant: pick(row, ["报销人"]),
    forWhom: pick(row, ["收款人"]),
    payAccount: pick(row, ["打款账户", "开户行"]),
    payBank: pick(row, ["开户行"]),
    payCardNo: pick(row, ["打款账户", "卡号"]),
    payoutId: "",
    payoutFileName: pick(row, ["打款凭证"]),
    payoutDate: pick(row, ["打款日期"]),
    payoutMethod: pick(row, ["打款方式"]) || pick(row, ["支付方式"]) || "转账",
  };
}

export function parseExpenseSheet(buf: ArrayBuffer | Uint8Array, fallbackYear?: number): Expense[] {
  const wb = readWb(buf);
  const preferred = wb.SheetNames.find((n) => n.includes("报销")) || wb.SheetNames[0];
  return sheetRecords(wb.Sheets[preferred])
    .map((row) => rowToExpense(row, fallbackYear))
    .filter((x): x is Expense => x !== null);
}
export function expenseTemplateWb(): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(
    wb,
    titledSheet("报销单导入模板", [
      [
        "年份", "项目名称", "购买时间", "期间", "单位", "数量", "单价", "金额", "支付方式",
        "打款方式", "状态", "报销人", "收款人", "开户行", "打款账户", "打款日期", "备注",
      ],
      [2026, "示例材料", "2026-04-01", "2026-04-01", "项", 1, 100, 100, "现金", "转账", "未报销", "张三", "张三", "", "", "", "示例，导入前请改"],
    ]),
    "报销单",
  );
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "项目名称、金额必填。状态填「未报销」或「已报销」。",
      "凭证文件名只作对照，原件仍在 data/photos。",
    ]),
    "填写说明",
  );
  return wb;
}
export function expenseSheetAoa(expenses: Expense[]): unknown[][] {
  const expAoa: unknown[][] = [
    ["报销单"],
    [
      "序号", "年份", "项目名称", "购买时间", "期间", "单位", "数量", "单价", "金额", "支付方式",
      "打款方式", "状态", "报销人", "收款人", "开户行", "打款账户", "打款日期", "备注", "凭证文件", "打款凭证",
    ],
  ];
  [...expenses]
    .sort((a, b) => String(a.date || a.period || "").localeCompare(String(b.date || b.period || "")))
    .forEach((e, i) => {
      expAoa.push([
        i + 1, e.year || "", e.name || "", e.date || "", e.period || "", e.unit || "",
        numOut(e.qty), numOut(e.price), numOut(e.amount), e.payMethod || "", e.payoutMethod || "",
        e.status || "", e.claimant || "", e.forWhom || "", e.payBank || "",
        e.payCardNo || e.payAccount || "", e.payoutDate || "", e.remark || "",
        e.voucherFileName || "", e.payoutFileName || "",
      ]);
    });
  return expAoa;
}
export function buildExpenseWorkbook(expenses: Expense[]): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheetFromAoa(expenseSheetAoa(expenses || [])), "报销单");
  return wb;
}
