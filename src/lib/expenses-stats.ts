/**
 * 报销单的「列表 / 合计 / 报销人下拉 / 打印」口径唯一实现
 * （口径一致性专项 20260916，从 src/routes/expenses.tsx 按行段机械提取，§12.1）。
 *
 * 改动的口径（只有下拉选项这一处）：报销人下拉原来是
 * `[...new Set((list || []).map(e => e.claimant).filter(Boolean))]`
 * —— ① 从**所有年份**取（选「2026年」时会列出只有 2025 年才有的报销人，选了 0 行）；
 * ② 空报销人那一桶被删掉（没填报销人的记录在列表/合计里都算数，下拉里选不到）。
 * 现在下拉来自当前范围（年份/状态/搜索）的真实分桶，并带「未填报销人」一项。
 *
 * 合计依旧是逐行相加：合计 == 列表逐行之和（`expenseTotals` 只吃一份 rows）。
 */
import { ALL_BUCKETS, groupBuckets, inBucket, type Bucket } from "./buckets";
import { needsVoucher } from "./expense-rules";
import type { Expense } from "./types";

export interface ExpenseFilters {
  scope: "year" | "all";
  year: number;
  status: string;
  /** 报销人：`ALL_BUCKETS` = 全部；空串 = 未填报销人 */
  claimant: string;
  q: string;
}

/** 范围 + 状态 + 报销人 + 搜索（逐字搬运原 shown） */
export function filterExpenses(list: Expense[], f: ExpenseFilters): Expense[] {
  let rows = list;
  if (f.scope === "year") rows = rows.filter((e) => e.year === f.year);
  if (f.status !== "all") rows = rows.filter((e) => e.status === f.status);
  if (f.claimant !== ALL_BUCKETS) rows = rows.filter((e) => inBucket(e.claimant, f.claimant));
  if (f.q.trim()) {
    const s = f.q.trim();
    rows = rows.filter((e) =>
      [
        e.name,
        e.period,
        e.remark,
        e.payMethod,
        e.claimant,
        e.forWhom,
        e.payAccount,
        e.payBank,
        e.payCardNo,
        e.payoutFileName,
        e.voucherFileName,
      ].some((x) => (x || "").includes(s)),
    );
  }
  return rows.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id));
}

export interface ExpenseTotals {
  /** 合计金额（= 列表逐行之和） */
  amount: number;
  count: number;
  /** 未报销 / 已报销 */
  open: number;
  done: number;
  /** 缺购买凭证 / 缺打款凭证的笔数 */
  missing: number;
  missPay: number;
}

export function expenseTotals(rows: Expense[]): ExpenseTotals {
  return rows.reduce<ExpenseTotals>(
    (s, e) => {
      s.amount += e.amount || 0;
      s.count += 1;
      if (e.status === "未报销") s.open += e.amount || 0;
      else s.done += e.amount || 0;
      if (needsVoucher(e.payMethod) && !e.voucherFileName) s.missing += 1;
      if (e.status === "已报销" && needsVoucher(e.payoutMethod || "转账") && !e.payoutFileName) s.missPay += 1;
      return s;
    },
    { amount: 0, count: 0, open: 0, done: 0, missing: 0, missPay: 0 },
  );
}

/** 报销人下拉：当前范围里真实存在的桶（含「未填报销人」） */
export function claimantBuckets(rows: Expense[]): Bucket[] {
  return groupBuckets(rows.map((e) => e.claimant), "未填报销人");
}

/**
 * 打印用的行：勾选了就只用勾选的（即使已切换到别的范围，勾选的仍照打），
 * 否则用当前列表；再按「打印未报销/已报销/全部」过滤，最后按日期排序。
 */
export function expensePrintRows(args: {
  list: Expense[];
  selected: string[];
  shown: Expense[];
  printStatus: string;
}): Expense[] {
  const { list, selected, shown, printStatus } = args;
  let rows: Expense[] = selected.length ? list.filter((e) => selected.includes(e.id)) : shown;
  if (printStatus !== "all") rows = rows.filter((e) => e.status === printStatus);
  return rows
    .slice()
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.period || "").localeCompare(b.period || ""));
}
