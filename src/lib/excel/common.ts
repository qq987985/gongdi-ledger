import * as XLSX from "xlsx";
import { uid } from "../utils";
import { parseDateYmd } from "../dates";
import type { Expense, Payment } from "../types";

export const { utils } = XLSX;

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

/**
 * 软件自己导出的派生表 / 纯展示表：带不带年份前缀都要排除在数据解析之外。
 * 「工天加班」「汇总」是整本导出算出来的结果，不是考勤；「资金对照」「影像资料」
 * 是合同导出算出来的结果，不是合同/明细。以前只按 sheet 名精确匹配，多年度导出
 * 的「2025年汇总」「2025年工天加班」就漏进来了，被当成月=0 的幽灵考勤。
 */
export function isDerivedSheet(name: string): boolean {
  const n = String(name || "").trim().replace(/^\d{4}\s*年\s*/, "");
  if (SKIP_SHEETS.has(n)) return true;
  return /^(汇总|工天加班|资金对照|影像资料)/.test(n);
}

/** 「合计/总计/小计/累计/总数」这类汇总行，不能当成一条真实记录 */
const TOTAL_ROW_RE = /^(合计|总计|小计|累计|总数|total|sum)$/i;
export function isTotalRow(name: unknown): boolean {
  return TOTAL_ROW_RE.test(String(name ?? "").replace(/\s/g, ""));
}

/**
 * 手填数值的容错解析：千分位逗号、货币符号、全角数字/括号、常见单位后缀
 * （元/天/个/次/人/月…）、(300) 括号负数都能读；读不出来返回 0。
 * 注意：必须保留 0 —— 报销金额 0 不能被 `|| 0` 之外的兜底重算掉。
 */
export function parseNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  let s = String(v).trim();
  if (!s) return 0;
  // 全角 → 半角：数字、逗号、圆括号、正负号等
  s = s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  let neg = false;
  const paren = s.match(/^\((.*)\)$/);
  if (paren) {
    neg = true;
    s = paren[1];
  }
  s = s
    .replace(/[,\s]/g, "")
    .replace(/[¥￥$]/g, "")
    .replace(/(元|天|个|次|人|月|年|日|项|台|套|小时|时|%|％)$/, "");
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return neg ? -n : n;
}

export type Row = Record<string, string>;

/** 该列是否存在于表头（用于区分「老模板整列缺失」和「填了 0/留空」） */
function hasCol(row: Row, keys: string[]): boolean {
  return keys.some((k) => k in row);
}

interface NumCell {
  has: boolean;
  n: number;
}

/** 取值 + 列是否存在；金额 0 与空单元格都返回 n=0，靠 has 区分 */
export function numCell(row: Row, keys: string[]): NumCell {
  return { has: hasCol(row, keys), n: parseNumber(pick(row, keys)) };
}

/** 导出数值单元格：0 要写成 0（区别于空），否则往返时 0 会被当成缺失而被重算 */
export function numOut(n: unknown): number | "" {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (n == null || n === "") return "";
  const v = parseNumber(n);
  return Number.isFinite(v) ? v : "";
}

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
  return parseNumber(pick(row, keys));
}

export function readWb(buf: ArrayBuffer | Uint8Array): XLSX.WorkBook {
  // 不用 cellDates：日期保持为 Excel 序列号，由 excelSerialYmd 用 UTC 解析，
  // 避免 SheetJS 把日期转成 Date 时因时区差一天（导入后日期提前/延后一天）。
  return XLSX.read(buf, { type: "array" });
}

export function detectWorkbookYear(wb: XLSX.WorkBook, fallback: number): number {
  for (const name of wb.SheetNames) {
    const m = name.match(/(20\d{2})/);
    if (m) return Number(m[1]);
  }
  for (const name of wb.SheetNames) {
    const aoa = utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "", raw: false }) as unknown[][];
    // 单年度导出时 sheet 名不带年份，但首行标题带（「2025年3月考勤」「2025年度工资汇总表」）。
    // 只看每张表开头的标题行，避免把身份证有效期之类的日期当成工作簿年份。
    for (const row of aoa.slice(0, 3)) {
      const m = String(row[0] ?? "").match(/(20\d{2})\s*年/);
      if (m) return Number(m[1]);
    }
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

export function normalizeDate(s: string): string {
  return parseDateYmd(s) || (s || "").trim();
}

/** 结束日期里的非日期标记（在保/是/无…）：空 = 在保，不能原样读回来把状态改成「已结束」 */
const NON_DATE_MARK = /^(在保|是|有|无|否|长期|无期限|--?|—|\/|n\/a|na|none)$/i;
export function normalizeEndDate(s: string): string {
  const t = (s || "").trim();
  if (!t || NON_DATE_MARK.test(t)) return "";
  return normalizeDate(t);
}

/** 保险合同文件名不合法（带路径/空）时忽略，避免把「../x」这种值当文件名存进来 */
export function isSafeFileName(name: string): boolean {
  const n = (name || "").trim();
  if (!n || n.length > 200) return false;
  if (/[\\/]/.test(n) || n === "." || n === "..") return false;
  // eslint-disable-next-line no-control-regex
  return !/[\u0000-\u001f]/.test(n);
}

/** 保险保单的「合同文件」列：多个文件名用 、/；/, 连接 */
export function parseContractFiles(raw: string): { id: string; fileName: string }[] {
  return String(raw || "")
    .split(/[、;；,，\n]/)
    .map((x) => x.trim())
    .filter(isSafeFileName)
    .map((fileName) => ({ id: uid(), fileName }));
}

export function contractFilesCell(list: { fileName: string }[] | undefined): string {
  return (list || [])
    .map((c) => (c?.fileName || "").trim())
    .filter(isSafeFileName)
    .join("、");
}

/* ───────────── 导入合并：按内容去重，重复导入不翻倍 ───────────── */

/** 发放去重键：实际收款人 + 日期 + 金额 + 收款人 */
export function paymentKey(p: { owner: string; date?: string; amount: number; receiver?: string }): string {
  return [p.owner, p.date || "", p.amount || 0, p.receiver || ""].join("\u0001");
}

/** 报销去重键：项目 + 日期 + 金额 + 报销人 */
export function expenseKey(e: { name: string; date?: string; period?: string; amount: number; claimant?: string }): string {
  return [e.name, e.date || e.period || "", e.amount || 0, e.claimant || ""].join("\u0001");
}

export interface MergeResult<T> {
  merged: T[];
  added: number;
  skipped: number;
}

/** 保留 existing；incoming 里键已存在（含文件内重复）的跳过 */
export function mergeUnique<T>(existing: T[], incoming: T[], keyOf: (x: T) => string): MergeResult<T> {
  const seen = new Set(existing.map(keyOf));
  const merged = [...existing];
  let skipped = 0;
  for (const x of incoming) {
    const k = keyOf(x);
    if (seen.has(k)) {
      skipped += 1;
      continue;
    }
    seen.add(k);
    merged.push(x);
  }
  return { merged, added: merged.length - existing.length, skipped };
}

export function mergePayments(existing: Payment[], incoming: Payment[]): MergeResult<Payment> {
  return mergeUnique(existing, incoming, paymentKey);
}

export function mergeExpenses(existing: Expense[], incoming: Expense[]): MergeResult<Expense> {
  return mergeUnique(existing, incoming, expenseKey);
}

/* ───────────── 考勤导入：按 姓名+年+月 精确跳过冲突行 ───────────── */

export interface AttendanceImportPlanRow<T> {
  row: T;
  year: number;
  month: number;
  conflict: boolean;
}

/**
 * 把导入行解析到目标年月，并标出哪些行与现有考勤冲突。
 * 冲突判定按「姓名 + 年 + 月」——只按姓名跳过会把同一人的其它月份一起丢掉。
 */
export function planAttendanceImport<T extends { year?: number; month?: number; name: string }>(
  rows: T[],
  existing: { year: number; month: number; name: string }[],
  targetYear: number,
  targetMonth: number,
  keepMonths: boolean,
): AttendanceImportPlanRow<T>[] {
  return rows.map((row) => {
    const year = row.year || targetYear;
    const month = keepMonths ? row.month || targetMonth : targetMonth;
    const conflict = existing.some((a) => a.year === year && a.month === month && a.name === row.name);
    return { row, year, month, conflict };
  });
}

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
