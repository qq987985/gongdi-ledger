import * as XLSX from "xlsx";
import { uid } from "./utils";
import { normalizeIdDate, parseIdCard } from "./idcard";
import { hasWork, monthPay, getWageAt } from "./wage";
import { parseDateYmd, paymentsInYear } from "./dates";
import {
  contractRollup,
  normalizeContractStatus,
  normalizeEntry,
  splitLegacyReceipts,
  splitTax,
  type ContractEntry,
  type ContractRecord,
} from "./contracts";
import type { AttendanceRow, Expense, InsuranceMember, Payment, Person } from "./types";

const { utils } = XLSX;
const readSync = XLSX.read;

export const SKIP_SHEETS = new Set([
  "人员信息",
  "发放记录",
  "报销单",
  "汇总",
  "个人查询",
  "年度",
  "封面",
  "填写说明",
]);

type Row = Record<string, string>;

export function cellStr(v: unknown, header = ""): string {
  if (v == null || v === "") return "";
  const dateCol = /日期|时间|有效期/.test(header);
  if (v instanceof Date && !Number.isNaN(v.getTime())) return parseDateYmd(v);
  if (typeof v === "number") {
    if (dateCol) return parseDateYmd(v) || String(v);
    return String(v);
  }
  const t = String(v).trim();
  if (dateCol) return parseDateYmd(t) || t;
  return t;
}

export function sheetToRows(ws: XLSX.WorkSheet): Row[] {
  return (utils.sheet_to_json(ws, { defval: "", raw: true }) as Record<string, unknown>[]).map((row) => {
    const o: Row = {};
    for (const [k, v] of Object.entries(row)) o[String(k).trim()] = cellStr(v, String(k));
    return o;
  });
}

export function sheetRecords(ws: XLSX.WorkSheet): Row[] {
  const aoa = utils.sheet_to_json(ws, { header: 1, defval: "", raw: true }) as unknown[][];
  const headerIdx = aoa.findIndex((r) =>
    r.some((c) => ["姓名", "实际收款人", "实际入账人", "入账人", "项目名称"].includes(String(c).trim())),
  );
  if (headerIdx < 0) return sheetToRows(ws);
  const headers = aoa[headerIdx].map((c) => String(c).trim());
  const out: Row[] = [];
  for (const row of aoa.slice(headerIdx + 1)) {
    const o: Row = {};
    headers.forEach((h, i) => {
      if (h) o[h] = cellStr(row[i], h);
    });
    if (Object.values(o).some((v) => v)) out.push(o);
  }
  return out;
}

export function pick(row: Row, keys: string[]): string {
  for (const k of keys) if (row[k] != null && String(row[k]).trim() !== "") return String(row[k]).trim();
  return "";
}

export function numPick(row: Row, keys: string[]): number {
  return Number(pick(row, keys)) || 0;
}

export function attFromRow(row: Row, year: number, month: number): AttendanceRow | null {
  const name = pick(row, ["姓名"]);
  if (!name || name === "合计") return null;
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

export function readWb(buf: ArrayBuffer | Uint8Array): XLSX.WorkBook {
  return readSync(buf, { type: "array", cellDates: true });
}

export function detectWorkbookYear(wb: XLSX.WorkBook, fallback: number): number {
  for (const name of wb.SheetNames) {
    const m = name.match(/(20\d{2})/);
    if (m) return Number(m[1]);
  }
  for (const name of wb.SheetNames) {
    const aoa = utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "", raw: false }) as unknown[][];
    for (const row of aoa)
      for (let i = 0; i < row.length; i++) {
        const cell = String(row[i] ?? "");
        const tagged = cell.match(/本年度[：:\s]*?(20\d{2})/);
        if (tagged) return Number(tagged[1]);
        if (cell.includes("本年度") || cell === "年度") {
          const n = Number(row[i + 1]);
          if (n >= 2e3 && n <= 2100) return n;
        }
        if (/^20\d{2}$/.test(cell) && String(row[i - 1] ?? "").includes("年度")) return Number(cell);
      }
  }
  return fallback;
}

export function rowToPerson(row: Row): Person | null {
  const name = pick(row, ["姓名", "name"]);
  if (!name || name === "合计" || name.includes("使用说明") || name === "人员信息表") return null;
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
    dailyWage: Number(pick(row, ["日工资", "dailyWage"])) || 0,
    monthWage: Number(pick(row, ["月工资", "monthWage"])) || 0,
    payType: /月/.test(pick(row, ["计薪方式", "计薪", "payType"])) ? "month" : "day",
    otRule: pick(row, ["加班规则", "计算加班规则", "otRule"]),
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

export function parseAttendanceSheet(buf: ArrayBuffer | Uint8Array, year: number): AttendanceRow[] {
  const wb = readWb(buf);
  const y = detectWorkbookYear(wb, year);
  const out: AttendanceRow[] = [];
  for (const name of wb.SheetNames) {
    if (SKIP_SHEETS.has(name)) continue;
    const monthMatch = name.match(/(\d+)\s*月/);
    const rows = sheetRecords(wb.Sheets[name]);
    for (const row of rows) {
      const month = Number(pick(row, ["月份", "月"])) || (monthMatch ? Number(monthMatch[1]) : 0);
      const sheetYear = name.match(/(20\d{2})/);
      const rec = attFromRow(row, sheetYear ? Number(sheetYear[1]) : y, month);
      if (rec) out.push(rec);
    }
  }
  return out;
}

export function normalizeDate(s: string): string {
  return parseDateYmd(s) || (s || "").trim();
}

export function rowToPayment(row: Row): Payment | null {
  const owner = pick(row, ["实际收款人", "实际入账人", "入账人"]) || pick(row, ["姓名"]);
  if (!owner || owner === "合计") return null;
  const receiver = pick(row, ["收款人"]) || owner;
  return {
    id: uid(),
    owner,
    receiver,
    date: normalizeDate(pick(row, ["发放日期", "日期"])),
    amount: Number(pick(row, ["发放金额(元)", "发放金额", "金额"])) || 0,
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

export interface FullBookParse {
  year: number;
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  expenses: Expense[];
}

export function parseFullAttendanceWorkbook(buf: ArrayBuffer | Uint8Array, fallbackYear: number): FullBookParse {
  const wb = readWb(buf);
  const year = detectWorkbookYear(wb, fallbackYear);
  const peopleName = wb.SheetNames.find((n) => n.includes("人员")) || wb.SheetNames[0];
  const people = sheetRecords(wb.Sheets[peopleName]).map(rowToPerson).filter((x): x is Person => Boolean(x));
  const attendance: AttendanceRow[] = [];
  for (const name of wb.SheetNames) {
    if (SKIP_SHEETS.has(name) && !/\d+\s*月/.test(name)) continue;
    const monthMatch = name.match(/(\d+)\s*月/);
    if (!monthMatch) continue;
    const month = Number(monthMatch[1]);
    for (const row of sheetRecords(wb.Sheets[name])) {
      const rec = attFromRow(row, year, month);
      if (rec) attendance.push(rec);
    }
  }
  const payName = wb.SheetNames.find((n) => n.includes("发放"));
  const expName = wb.SheetNames.find((n) => n.includes("报销"));
  return {
    year,
    people,
    attendance,
    payments: payName
      ? sheetRecords(wb.Sheets[payName]).map(rowToPayment).filter((x): x is Payment => x !== null)
      : [],
    expenses: expName
      ? sheetRecords(wb.Sheets[expName]).map((row) => rowToExpense(row, year)).filter((x): x is Expense => x !== null)
      : [],
  };
}

export const DEMO_PEOPLE: unknown[][] = [
  [
    "姓名", "班组", "IC卡号", "身份证号", "身份证签发机关", "身份证有效期开始",
    "身份证有效期结束", "联系电话", "计薪方式", "日工资", "月工资", "加班规则", "开户行",
    "银行卡号", "户籍地址", "备注",
  ],
  [
    "张三", "一班", "DEMO001", "110101199001011210", "北京市公安局东城分局", "2020-01-01",
    "2040-01-01", "13800001234", "按工天", "280", "", "按小时:25", "中国工商银行北京分行",
    "6222021234567890123", "北京市东城区示例路1号", "示例数据，导入前请改成自己的人",
  ],
  [
    "李四", "二班", "DEMO002", "320106198506154512", "上海市公安局浦东分局", "2018-06-15",
    "长期", "13900005678", "按工天", "260", "", "折算:8", "中国农业银行上海分行",
    "6228481234567890123", "上海市浦东新区示例路8号", "示例数据，导入前请改成自己的人",
  ],
];

export const DEMO_ATT: unknown[][] = [
  ["姓名", "出勤天数", "加班小时", "补助", "扣款"],
  ["张三", 26, 12, 200, 0],
  ["李四", 22, 8, 0, 50],
];

export const DEMO_PAY: unknown[][] = [
  ["实际收款人", "发放日期", "发放金额(元)", "发放方", "收款人", "备注"],
  ["张三", "2026-04-28", 1e4, "示例工程4月请款", "张三", "本人"],
  ["李四", "", 8e3, "示例工程4月请款", "张三", "已上报未发，日期可空"],
];

export function titledSheet(title: string, rows: unknown[][]): XLSX.WorkSheet {
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const aoa = [[title], ...rows];
  const ws = utils.aoa_to_sheet(aoa);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: cols - 1 } }];
  const cell = ws["A1"];
  if (cell)
    (cell as any).s = {
      alignment: { horizontal: "center", vertical: "center" },
      font: { bold: true, sz: 14 },
    };
  return ws;
}

export function sheetFromAoa(aoa: unknown[][]): XLSX.WorkSheet {
  if (aoa.length >= 2 && aoa[0].length === 1 && typeof aoa[0][0] === "string")
    return titledSheet(String(aoa[0][0]), aoa.slice(1));
  const ws = utils.aoa_to_sheet(aoa);
  const cols = Math.max(1, ...aoa.map((r) => r.length));
  if (aoa[0] && aoa[0].length === 1) {
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: cols - 1 } }];
    const cell = ws["A1"];
    if (cell)
      (cell as any).s = {
        alignment: { horizontal: "center", vertical: "center" },
        font: { bold: true, sz: 14 },
      };
  }
  return ws;
}

export function noteSheet(lines: string[]): XLSX.WorkSheet {
  return utils.aoa_to_sheet(lines.map((x) => [x]));
}

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

export function rowToExpense(row: Row, fallbackYear?: number): Expense | null {
  const name = pick(row, ["项目名称", "名称", "name"]);
  if (!name || name === "合计") return null;
  const amount = numPick(row, ["金额", "amount"]) || 0;
  const year = Number(pick(row, ["年份"])) || fallbackYear || new Date().getFullYear();
  const qty = numPick(row, ["数量", "qty"]) || 1;
  const price = numPick(row, ["单价", "price"]) || amount;
  return {
    id: uid(),
    year,
    name,
    period: pick(row, ["期间", "购买时间", "日期"]) || "",
    date: normalizeDate(pick(row, ["购买时间", "日期"])) || "",
    unit: pick(row, ["单位"]) || "项",
    qty,
    price,
    amount: amount || qty * price,
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

export function insuranceMemberTemplateWb(): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(
    wb,
    titledSheet("保险人员导入模板", [
      ["姓名", "队长", "开始日期", "结束日期", "备注"],
      ["张三", "王队长", "2026-01-01", "", "示例：在保，结束日期留空"],
      ["李四", "王队长", "2026-03-01", "", "示例：在保，结束日期留空"],
    ]),
    "保险人员",
  );
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "姓名必填；队长手填。",
      "开始日期必填；结束日期留空 = 仍在保（在保人数才会计数）。",
      "结束日期填了 = 已结束（退保/离场），替换时系统会自动填上。",
      "日期写成 2026/1/1 或 2026-01-01 都可以。",
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
      if (!name || name === "合计") return null;
      return {
        id: uid(),
        policyId: "",
        name,
        leader: pick(row, ["队长", "组长"]),
        startDate: normalizeDate(pick(row, ["开始日期", "开始时间", "日期"])),
        endDate: normalizeDate(pick(row, ["结束日期", "结束时间"])),
        remark: pick(row, ["备注"]),
      } as InsuranceMember;
    })
    .filter((x): x is InsuranceMember => x !== null);
}

function peopleSheetAoa(people: Person[]): unknown[][] {
  const peopleAoa: unknown[][] = [
    ["人员信息表"],
    [
      "序号", "姓名", "班组", "IC卡号", "联系电话", "计薪方式", "日工资", "月工资",
      "加班规则", "性别", "年龄", "生日", "身份证号", "身份证签发机关", "身份证有效期开始",
      "身份证有效期结束", "开户行", "银行卡号", "户籍地址", "备注",
    ],
  ];
  people.forEach((p, i) => {
    peopleAoa.push([
      i + 1, p.name, p.team, p.personNo || "", p.phone || "",
      p.payType === "month" ? "按月" : "按工天", p.dailyWage || "", p.monthWage || "",
      p.otRule || "", p.gender || "", p.age ?? "", p.birthday || "", p.idCard || "",
      p.idIssuer || "", p.idValidFrom || "", p.idValidTo || "", p.bank || "", p.cardNo || "",
      p.address || "", p.remark || "",
    ]);
  });
  return peopleAoa;
}

function paymentSheetAoa(payments: Payment[]): unknown[][] {
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

function expenseSheetAoa(expenses: Expense[]): unknown[][] {
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
        e.qty || "", e.price || "", e.amount || "", e.payMethod || "", e.payoutMethod || "",
        e.status || "", e.claimant || "", e.forWhom || "", e.payBank || "",
        e.payCardNo || e.payAccount || "", e.payoutDate || "", e.remark || "",
        e.voucherFileName || "", e.payoutFileName || "",
      ]);
    });
  return expAoa;
}

export function buildPeopleWorkbook(people: Person[]): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheetFromAoa(peopleSheetAoa(people || [])), "人员信息");
  return wb;
}

export function buildPaymentWorkbook(payments: Payment[]): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheetFromAoa(paymentSheetAoa(payments || [])), "发放记录");
  return wb;
}

export function buildExpenseWorkbook(expenses: Expense[]): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, sheetFromAoa(expenseSheetAoa(expenses || [])), "报销单");
  return wb;
}

export interface FullWorkbookArgs {
  year: number;
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  expenses?: Expense[];
  months?: { year: number; month: number }[];
  skipPeople?: boolean;
  skipPay?: boolean;
  skipExp?: boolean;
}

export function buildFullWorkbook(args: FullWorkbookArgs): XLSX.WorkBook {
  const { year, people, attendance, payments, expenses = [], months: monthArg, skipPeople = false, skipPay = false, skipExp = false } = args;
  const wb = utils.book_new();
  const monthList =
    Array.isArray(monthArg) && monthArg.length
      ? monthArg
      : Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
  const yearSet = [...new Set(monthList.map((x) => x.year))].sort((a, b) => a - b);
  const singleYear = yearSet.length <= 1;
  if (!skipPeople) utils.book_append_sheet(wb, sheetFromAoa(peopleSheetAoa(people)), "人员信息");
  for (const { year: y, month: m } of monthList) {
    const monthRows = attendance.filter(
      (a) => a.year === y && a.month === m && a.name.trim() && hasWork(a),
    );
    const aoa: unknown[][] = [
      [`${y}年${m}月考勤`],
      ["序号", "姓名", "班组", "出勤天数", "加班小时", "补助", "扣款", "餐补", "计薪", "工资", "加班费", "应发工资", "加班规则", "备注"],
    ];
    monthRows.forEach((a, i) => {
      const p = people.find((x) => x.name === a.name);
      const wage = getWageAt(p, y, m);
      const calc = monthPay(a, wage);
      aoa.push([
        i + 1, a.name, a.team || p?.team || "", calc.days || "", calc.otHours || "",
        calc.allowance || "", calc.deduction || "", calc.meal || "", wage.payType === "month" ? "按月" : "按工天",
        wage.payType === "month" ? wage.monthWage || "" : wage.dailyWage || "", calc.ot || "",
        calc.pay || "", wage.otRule || "", a.remark || "",
      ]);
    });
    const sheetName = singleYear ? `${m}月考勤` : `${y}年${m}月考勤`;
    utils.book_append_sheet(wb, sheetFromAoa(aoa), sheetName);
  }
  if (!skipPay) utils.book_append_sheet(wb, sheetFromAoa(paymentSheetAoa(payments)), "发放记录");
  if (!skipExp) utils.book_append_sheet(wb, sheetFromAoa(expenseSheetAoa(expenses)), "报销单");
  for (const y of yearSet) {
    const yearPays = paymentsInYear(payments, y, y);
    const sumAoa: unknown[][] = [
      [`${y}年度工资汇总表`],
      [
        "序号", "姓名", "班组", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月",
        "9月", "10月", "11月", "12月", "全年合计", "已发放金额", "未发放金额", "发放状态",
      ],
    ];
    const workers = people.filter((p) =>
      attendance.some((a) => a.year === y && a.name === p.name && hasWork(a)),
    );
    workers.forEach((p, i) => {
      const months: (number | string)[] = [];
      for (let m = 1; m <= 12; m++) {
        const a = attendance.find((x) => x.year === y && x.month === m && x.name === p.name);
        const wage = getWageAt(p, y, m);
        months.push(monthPay(a, wage).pay);
      }
      const total = months.reduce<number>((s, n) => s + (n as number), 0);
      const paid = yearPays.filter((x) => x.owner === p.name && x.date).reduce((s, x) => s + x.amount, 0);
      const unpaid = total - paid;
      const status = total === 0 ? "未计" : unpaid <= 0 ? "已结清" : paid > 0 ? "部分发放" : "未发放";
      sumAoa.push([
        i + 1, p.name, p.team, ...months.map((n) => n || ""), total || "", paid || "",
        unpaid || "", status,
      ]);
    });
    utils.book_append_sheet(wb, sheetFromAoa(sumAoa), singleYear ? "汇总" : `${y}年汇总`);
    const workAoa: unknown[][] = [
      [`${y}年度工天加班汇总表`],
      [
        "序号", "姓名", "班组", "1月工天", "1月加班", "2月工天", "2月加班", "3月工天", "3月加班",
        "4月工天", "4月加班", "5月工天", "5月加班", "6月工天", "6月加班", "7月工天", "7月加班",
        "8月工天", "8月加班", "9月工天", "9月加班", "10月工天", "10月加班", "11月工天", "11月加班",
        "12月工天", "12月加班", "全年工天", "全年加班",
      ],
    ];
    workers.forEach((p, i) => {
      const cells: (number | string)[] = [];
      let daysSum = 0;
      let otSum = 0;
      for (let m = 1; m <= 12; m++) {
        const a = attendance.find((x) => x.year === y && x.month === m && x.name === p.name);
        const d = a?.days || 0;
        const o = a?.otHours || 0;
        daysSum += d;
        otSum += o;
        cells.push(d || "", o || "");
      }
      workAoa.push([i + 1, p.name, p.team, ...cells, daysSum || "", otSum || ""]);
    });
    utils.book_append_sheet(wb, sheetFromAoa(workAoa), singleYear ? "工天加班" : `${y}年工天加班`);
  }
  return wb;
}

function yesNo(s: string): boolean {
  const t = (s || "").trim();
  if (!t) return false;
  if (/^(无|否|没有|n|no|0)$/i.test(t)) return false;
  if (/^(有|是|保证金|押金|y|yes|1)$/i.test(t)) return true;
  return Number(t) > 0;
}

function parseTaxMode(s: string): "incl" | "excl" {
  const t = (s || "").replace(/\s/g, "");
  if (/含税/.test(t) && !/不含/.test(t)) return "incl";
  if (/不含/.test(t)) return "excl";
  if (/^incl$/i.test(t)) return "incl";
  return "excl";
}

function parsePct(s: string): number {
  const t = (s || "").replace(/%/g, "").trim();
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

export function parseContractWorkbook(buf: ArrayBuffer | Uint8Array): {
  contracts: ContractRecord[];
  entries: ContractEntry[];
} {
  const wb = readWb(buf);
  const contracts: ContractRecord[] = [];
  const entries: Parameters<typeof splitLegacyReceipts>[0] = [];
  const byKey = new Map<string, ContractRecord>();
  function keyOf(c: ContractRecord) {
    return `${c.year}|${c.code}|${c.name}`;
  }
  for (const name of wb.SheetNames) {
    if (name.includes("填写说明")) continue;
    const rows = sheetRecords(wb.Sheets[name]);
    const isEntrySheet = /报量|开票|收款/.test(name) && !name.includes("合同");
    for (const row of rows) {
      if (isEntrySheet || pick(row, ["流水类型", "类型", "kind"])) {
        const kindRaw =
          pick(row, ["流水类型", "类型", "kind"]) ||
          (name.includes("开票") ? "开票" : name.includes("收款") ? "收款" : "报量");
        const kind = kindRaw.includes("开票") ? "invoice" : kindRaw.includes("收款") ? "receipt" : "report";
        const project = pick(row, ["项目名称", "项目"]);
        if (!project) continue;
        const year = Number(pick(row, ["年份"])) || 0;
        const code = pick(row, ["项目号"]);
        const c =
          [...byKey.values()].find(
            (x) => x.name === project && (!year || x.year === year) && (!code || x.code === code),
          ) || contracts.find((x) => x.name === project);
        if (!c) continue;
        entries.push(
          normalizeEntry({
            contractId: c.id,
            kind,
            date: pick(row, ["日期", "发放日期"]) || `${c.year}-01-01`,
            amount: numPick(row, ["金额", "含税金额", "收款总金额", "月报量金额", "开票金额", "收款账金额", "收款金额"]),
            amountExcl: numPick(row, ["不含税金额", "开票不含税"]),
            taxRate: parsePct(pick(row, ["开票税率", "税率"])) || (kind === "invoice" ? c.taxRate : 0),
            workerPay: numPick(row, ["代付农民工", "总包代付农民工", "农民工代付"]),
            payTo: /代付|农民工/.test(pick(row, ["收款去向", "去向"]))
              ? "worker"
              : kind === "receipt"
                ? "sub"
                : "",
            no: pick(row, ["发票号", "期次", "单号"]),
            remark: pick(row, ["备注"]),
          } as Parameters<typeof normalizeEntry>[0]),
        );
        continue;
      }
      const project = pick(row, ["项目名称"]);
      if (!project || project === "合计") continue;
      const year = Number(pick(row, ["年份"])) || new Date().getFullYear();
      const code = pick(row, ["项目号"]);
      const depositRaw = pick(row, ["保证金", "是否有保证金", "是否有押金", "押金"]);
      const c: ContractRecord = {
        id: uid(),
        year,
        code,
        name: project,
        contractor: pick(row, ["总包"]),
        subcontractor: pick(row, ["分包"]),
        contractAmount: numPick(row, ["合同金额/结算金额", "合同金额", "结算金额"]),
        taxRate: parsePct(pick(row, ["税率"])),
        reportTaxMode: parseTaxMode(pick(row, ["报量含税", "报量计税", "报量按"])),
        payRatio: parsePct(pick(row, ["合同付款比例", "付款比例"])),
        warrantyStart: pick(row, ["质保期开始时间", "质保期开始"]),
        warrantyEnd: pick(row, ["质保期结束时间", "质保期结束"]),
        hasDeposit: yesNo(depositRaw),
        depositAmount: numPick(row, ["保证金金额", "押金金额"]) || (Number(depositRaw) > 1 ? Number(depositRaw) : 0),
        manager: pick(row, ["项目部经营人员", "经营人员", "项目部\n经营人员"]),
        status: normalizeContractStatus(pick(row, ["项目进度", "进度"])),
        prelimAmount: numPick(row, ["初审金额"]),
        settleReceivable: numPick(row, ["结算应收金额"]),
        remark: (() => {
          const note = pick(row, ["备注"]);
          const reason = pick(row, ["无合同原因", "没有合同原因"]);
          return reason ? (note ? `${note}；无合同：${reason}` : `无合同：${reason}`) : note;
        })(),
        hasPaper: !/无合同|没有合同/.test(pick(row, ["有无合同", "合同原件"])),
        noContractReason: "",
        scanFileName: "",
      };
      if (c.hasDeposit && !c.depositAmount && Number(depositRaw) > 1) c.depositAmount = Number(depositRaw);
      contracts.push(c);
      byKey.set(keyOf(c), c);
      const report = numPick(row, ["月报量金额", "月报量"]);
      const invoice = numPick(row, ["开票金额"]);
      const receipt = numPick(row, ["收款账金额", "收款金额"]);
      if (report)
        entries.push(
          normalizeEntry({
            contractId: c.id, kind: "report", date: `${year}-01-31`, amount: report,
            no: "导入合计", remark: "从表合计拆出，可再拆明细",
          } as Parameters<typeof normalizeEntry>[0]),
        );
      if (invoice)
        entries.push(
          normalizeEntry({
            contractId: c.id, kind: "invoice", date: `${year}-01-31`, amount: invoice,
            taxRate: c.taxRate, no: "导入合计", remark: "从表合计拆出，可再拆明细",
          } as Parameters<typeof normalizeEntry>[0]),
        );
      if (receipt)
        entries.push(
          normalizeEntry({
            contractId: c.id, kind: "receipt", date: `${year}-01-31`, amount: receipt,
            workerPay: numPick(row, ["代付农民工", "总包代付农民工"]),
            no: "导入合计", remark: "从表合计拆出，可再拆明细",
          } as Parameters<typeof normalizeEntry>[0]),
        );
    }
  }
  return { contracts, entries: splitLegacyReceipts(entries) };
}

export function contractTemplateWb(): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(
    wb,
    titledSheet("合同导入模板", [
      [
        "序号", "年份", "项目号", "项目名称", "总包", "分包", "合同金额/结算金额", "税率",
        "报量含税", "合同付款比例", "质保期开始时间", "质保期结束时间", "是否有保证金",
        "保证金金额", "项目部经营人员", "项目进度", "初审金额", "结算应收金额", "备注",
      ],
      [
        1, 2026, "DEMO-A-2026", "示例住宅A区", "示例建设集团", "示例劳务公司", 12e5, "9%",
        "不含税", "80%", "", "", "有", 5e4, "王经营", "在建", 0, 0, "示例，导入前请改",
      ],
    ]),
    "合同管理表",
  );
  utils.book_append_sheet(
    wb,
    utils.aoa_to_sheet([
      ["年份", "项目号", "项目名称", "流水类型", "收款去向", "日期", "金额", "不含税金额", "开票税率", "发票号", "期次", "备注"],
      [2026, "DEMO-A-2026", "示例住宅A区", "报量", "", "2026-03-31", 18e4, "", "", "", "2026-03", "3月报量"],
      [2026, "DEMO-A-2026", "示例住宅A区", "开票", "", "2026-04-12", 2e5, 183486.24, 9, "1100000001", "", ""],
      [2026, "DEMO-A-2026", "示例住宅A区", "收款", "总包代付农民工", "2026-04-15", 8e4, "", "", "", "", ""],
      [2026, "DEMO-A-2026", "示例住宅A区", "收款", "到分包公司", "2026-04-28", 7e4, "", "", "", "", ""],
    ]),
    "报量开票收款",
  );
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "合同管理是独立模块。月报量、开票、收款请在第二张表按笔填写。",
      "如果只填第一张表里的月报量/开票/收款合计，导入时会各生成一笔「导入合计」，之后可再拆明细。",
      "「是否有押金」已改为保证金：填 有/无，金额填在保证金金额。",
      "项目进度只能是：在建 / 完工 / 总版图 / 初审 / 终审 / 分包结算 / 结算完成 / 结算已开票 / 质保期 / 退质保金 / 完成。旧表里的「结算」当作分包结算，「审计」当作终审。",
      "报量含税列填「含税」或「不含税」。每个合同可以不同。开票、收款仍按实际金额。",
      "两条线：① 应收 = 含税报量 × 付款比例；合同未付 = 应收 − 已付。② 剩余款 = 开票金额 − 已付。已付 = 代付农民工 + 到分包公司。",
      "收款请拆成两笔：去向填「到分包公司」或「总包代付农民工」，日期可以不同。",
      "合同扫描件在软件里上传，文件名是「项目名称-合同电子版」，存到 data/photos/合同扫描件。有文件即有合同，没传即无合同；原因写在备注。",
    ]),
    "填写说明",
  );
  return wb;
}

export function buildContractWorkbook(args: {
  contracts: ContractRecord[];
  entries: ContractEntry[];
}): XLSX.WorkBook {
  const { contracts, entries } = args;
  const wb = utils.book_new();
  const aoa: unknown[][] = [
    ["合同管理表"],
    [
      "序号", "年份", "项目号", "项目名称", "总包", "分包", "合同金额/结算金额", "税率", "报量含税",
      "报量金额", "合同付款比例", "应收（含税报量×比例）", "开票金额", "已付（代付+到分包）",
      "代付农民工", "到分包公司", "合同未付（应收−已付）", "剩余款（开票金额−已付）",
      "质保期开始时间", "质保期结束时间", "是否有保证金", "保证金金额", "项目部经营人员",
      "项目进度", "初审金额", "结算应收金额", "备注",
    ],
  ];
  contracts.forEach((c, i) => {
    const r = contractRollup(c, entries);
    aoa.push([
      i + 1, c.year, c.code, c.name, c.contractor, c.subcontractor, c.contractAmount || "",
      c.taxRate ? `${c.taxRate}%` : "", c.reportTaxMode === "incl" ? "含税" : "不含税",
      (c.reportTaxMode === "incl" ? r.reportIncl : r.reportExcl) || "",
      c.payRatio ? `${c.payRatio}%` : "", r.payable || "", r.invoice || "", r.receipt || "",
      r.workerPay || "", r.subPay || "", r.dueRemain || "", r.remain || "", c.warrantyStart,
      c.warrantyEnd, c.hasDeposit ? "有" : "无", c.hasDeposit ? c.depositAmount || "" : "",
      c.manager, c.status, c.prelimAmount || "", c.settleReceivable || "", c.remark,
    ]);
  });
  utils.book_append_sheet(wb, sheetFromAoa(aoa), "合同管理表");
  const reportRows: unknown[][] = [
    ["年份", "项目号", "项目名称", "日期", "录入金额", "报量按", "税率", "含税金额", "不含税金额", "期次", "影像文件", "备注"],
  ];
  const invoiceRows: unknown[][] = [
    ["年份", "项目号", "项目名称", "日期", "含税金额", "不含税金额", "开票税率", "发票号", "影像文件", "备注"],
  ];
  const receiptRows: unknown[][] = [
    ["年份", "项目号", "项目名称", "日期", "收款去向", "金额", "回单号", "影像文件", "备注"],
  ];
  const filesRows: unknown[][] = [["类型", "年份", "项目号", "项目名称", "日期", "文件名", "说明"]];
  for (const e of entries) {
    const c = contracts.find((x) => x.id === e.contractId);
    if (!c) continue;
    if (e.kind === "report") {
      const tax = splitTax(e.amount, c.taxRate, c.reportTaxMode || "excl");
      reportRows.push([
        c.year, c.code, c.name, e.date, e.amount || "",
        c.reportTaxMode === "incl" ? "含税" : "不含税", c.taxRate || "", tax.incl || "",
        tax.excl || "", e.no, e.fileName, e.remark,
      ]);
    } else if (e.kind === "invoice")
      invoiceRows.push([
        c.year, c.code, c.name, e.date, e.amount || "", e.amountExcl || "",
        e.taxRate || "", e.no, e.fileName, e.remark,
      ]);
    else if (e.kind === "receipt")
      receiptRows.push([
        c.year, c.code, c.name, e.date,
        e.payTo === "worker" ? "总包代付农民工" : "到分包公司",
        e.amount || "", e.no, e.fileName, e.remark,
      ]);
    if (e.fileName)
      filesRows.push([
        e.kind === "invoice" ? "开票" : e.kind === "receipt" ? "收款" : "报量",
        c.year, c.code, c.name, e.date, e.fileName,
        e.payTo === "worker" ? "代付农民工" : e.remark,
      ]);
  }
  utils.book_append_sheet(wb, titledSheet("月报量明细", reportRows), "月报量明细");
  utils.book_append_sheet(wb, titledSheet("开票明细", invoiceRows), "开票明细");
  utils.book_append_sheet(wb, titledSheet("收款明细", receiptRows), "收款明细");
  const cmp: unknown[][] = [
    [
      "年份", "项目号", "项目名称", "含税报量", "应收（含税报量×比例）", "开票金额",
      "已付（代付+到分包）", "代付农民工", "到分包公司", "合同未付（应收−已付）", "剩余款（开票金额−已付）",
    ],
  ];
  contracts.forEach((c) => {
    const r = contractRollup(c, entries);
    cmp.push([
      c.year, c.code, c.name, r.reportIncl || "", r.payable || "", r.invoice || "",
      r.receipt || "", r.workerPay || "", r.subPay || "", r.dueRemain || "", r.remain || "",
    ]);
  });
  utils.book_append_sheet(wb, titledSheet("资金对照", cmp), "资金对照");
  utils.book_append_sheet(wb, titledSheet("影像资料", filesRows), "影像资料");
  utils.book_append_sheet(
    wb,
    noteSheet([
      "导出说明（此表不会导入）",
      "合同管理表是汇总。明细在：月报量 / 开票 / 收款。资金对照是公式结果。",
      "应收 = 含税报量 × 付款比例。合同未付 = 应收 − 已付。剩余款 = 开票金额 − 已付。",
      "已付 = 代付农民工 + 到分包公司。收款明细里两笔日期可以不同。",
      "影像资料列出已上传文件名，原件在 NAS 的 data/photos（报量单、发票、收款回单、合同扫描件）。",
    ]),
    "填写说明",
  );
  return wb;
}
