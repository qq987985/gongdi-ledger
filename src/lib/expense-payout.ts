import { parseDateYmd } from "./dates";
import { PAY_METHODS } from "./expense-rules";
import { numOr, sumQuantity } from "./num";
import { round2 } from "./wage";
import type { Expense } from "./types";

export interface ExpensePayoutDraft {
  /** 仅给原单据中未填报销人的项目补填，不覆盖已有报销人。 */
  claimant: string;
  forWhom: string;
  payBank: string;
  payCardNo: string;
  payoutMethod: string;
  payoutDate: string;
  status: Expense["status"];
}

export interface ExpensePayoutBatch {
  id: string;
  rows: Expense[];
  total: number;
  status: Expense["status"] | "状态不一致";
  date: string;
  claimant: string;
  payee: string;
  fileName: string;
  issues: string[];
}

export interface ExpensePayoutPlan {
  before: Expense[];
  after: Expense[];
  groupId?: string;
}

const text = (value: unknown) => String(value ?? "").trim();
const common = (rows: readonly Expense[], field: keyof Expense): string => {
  const value = text(rows[0]?.[field]);
  return rows.length && rows.every((row) => text(row[field]) === value) ? value : "";
};
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && parseDateYmd(value) === value;
const joined = (values: string[]) => [...new Set(values.filter(Boolean))].join("、");
const snapshot = (row: Expense): Expense => JSON.parse(JSON.stringify(row)) as Expense;

/** 只有原始 payoutId 相同才属于同批，不按姓名、日期、金额推测关系。 */
export function expensePayoutBatches(expenses: readonly Expense[]): ExpensePayoutBatch[] {
  const groups = new Map<string, Expense[]>();
  for (const row of expenses) {
    if (!row.payoutId) continue;
    const rows = groups.get(row.payoutId) || [];
    rows.push(row);
    groups.set(row.payoutId, rows);
  }
  return [...groups].map(([id, rows]) => {
    const dates = rows.map((row) => parseDateYmd(row.payoutDate) || parseDateYmd(row.reimbursedAt) || parseDateYmd(row.date) || parseDateYmd(row.period));
    const status = rows.every((row) => row.status === rows[0].status) ? rows[0].status : "状态不一致";
    const issues: string[] = [];
    if (status === "状态不一致") issues.push("收款状态不一致");
    for (const [field, label] of [["forWhom", "收款人"], ["payBank", "开户行"], ["payCardNo", "收款账户"], ["payoutDate", "收款日期"], ["payoutMethod", "收款方式"], ["payoutFileName", "收款凭证"]] as const) {
      if (new Set(rows.map((row) => text(row[field]))).size > 1) issues.push(`${label}不一致`);
    }
    return {
      id,
      rows,
      total: round2(sumQuantity(rows.map((row) => numOr(row.amount, 0)))),
      status,
      date: dates.sort().at(-1) || "",
      claimant: joined(rows.map((row) => text(row.claimant))),
      payee: joined(rows.map((row) => text(row.forWhom))),
      fileName: common(rows, "payoutFileName"),
      issues,
    } satisfies ExpensePayoutBatch;
  }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

/** 每次打开只取这批单据，不沿用上一次编辑的账户、日期或批次。 */
export function expensePayoutDraft(rows: readonly Expense[], today: string): ExpensePayoutDraft {
  const claimant = common(rows, "claimant");
  const status = rows.length && rows.every((row) => row.status === "已报销") ? "已报销" : "未报销";
  const sameAccount = rows.length > 0 && rows.every((row) =>
    ["forWhom", "payBank", "payCardNo"].every((field) => text(row[field as keyof Expense]) === text(rows[0][field as keyof Expense])),
  );
  const forWhom = sameAccount ? common(rows, "forWhom") : "";
  const completeAccount = sameAccount && !!forWhom && !!common(rows, "payBank") && !!common(rows, "payCardNo");
  const date = common(rows, "payoutDate");
  return {
    claimant,
    forWhom: forWhom || claimant,
    payBank: completeAccount ? common(rows, "payBank") : "",
    payCardNo: completeAccount ? common(rows, "payCardNo") : "",
    payoutMethod: common(rows, "payoutMethod") || "转账",
    payoutDate: status === "已报销" ? validDate(date) ? date : validDate(today) ? today : "" : "",
    status,
  };
}

function selectedRows(all: readonly Expense[], ids: readonly string[]): Expense[] {
  if (!ids.length) throw new Error("请先选择报销明细");
  if (new Set(ids).size !== ids.length || ids.some((id) => !id)) throw new Error("所选明细重复或编号无效，请重新选择");
  const selected = new Set(ids);
  const rows = all.filter((row) => selected.has(row.id));
  if (rows.length !== ids.length || new Set(rows.map((row) => row.id)).size !== ids.length) throw new Error("所选明细已变化或被删除，请重新打开");
  return rows;
}

function assertCompleteGroups(all: readonly Expense[], rows: readonly Expense[]): void {
  const selected = new Set(rows.map((row) => row.id));
  const groups = new Set(rows.map((row) => row.payoutId).filter(Boolean));
  if (all.some((row) => groups.has(row.payoutId) && !selected.has(row.id))) throw new Error("必须打开完整收款批次后操作，不能只修改其中几笔");
}

export function planExpensePayout(args: {
  all: readonly Expense[];
  ids: readonly string[];
  editingId?: string;
  draft: ExpensePayoutDraft;
  payoutId: string;
  fileName: string;
}): ExpensePayoutPlan {
  const { all, ids, editingId, draft, payoutId, fileName } = args;
  const rows = selectedRows(all, ids);
  if (editingId) {
    const existing = all.filter((row) => row.payoutId === editingId);
    if (!existing.length) throw new Error("该收款批次已变化，请重新打开");
    const selected = new Set(ids);
    if (existing.some((row) => !selected.has(row.id))) throw new Error("请保留本批全部明细，解除批次需单独操作");
    if (rows.some((row) => row.payoutId && row.payoutId !== editingId)) throw new Error("不能把其他收款批次并入本批");
  } else if (rows.some((row) => row.payoutId)) throw new Error("所选明细已有收款批次，请从该批次打开，不要重新合并");
  if (!text(payoutId)) throw new Error("收款批次编号为空，请重新打开");
  const selected = new Set(ids);
  if (all.some((row) => row.payoutId === payoutId && !selected.has(row.id))) throw new Error("收款批次编号已被其他明细使用，请重新打开");
  if (draft.status !== "已报销" && draft.status !== "未报销") throw new Error("请选择收款状态");
  if (!PAY_METHODS.includes(draft.payoutMethod)) throw new Error("请选择收款方式");
  const date = text(draft.payoutDate);
  // 整理待收款批次只确定哪些费用放在一起；真正确认收款时才需要完整资料。
  if (draft.status === "已报销") {
    if (!text(draft.forWhom)) throw new Error("请填写收款人");
    if (rows.some((row) => !text(row.claimant) && !text(draft.claimant))) throw new Error("请给未填报销人的明细补填报销人");
    if (draft.payoutMethod !== "现金" && (!text(draft.payBank) || !text(draft.payCardNo))) throw new Error("非现金收款需填写开户行和账户");
    if (!validDate(date)) throw new Error("请填写有效的收款日期");
  }
  return {
    before: rows.map(snapshot),
    after: rows.map((row) => ({
      ...snapshot(row),
      claimant: text(row.claimant) ? row.claimant : text(draft.claimant),
      forWhom: text(draft.forWhom),
      payBank: text(draft.payBank),
      payCardNo: text(draft.payCardNo),
      payAccount: [draft.payBank, draft.payCardNo].map(text).filter(Boolean).join(" "),
      payoutMethod: draft.payoutMethod,
      payoutDate: draft.status === "已报销" ? date : "",
      reimbursedAt: draft.status === "已报销" ? date : "",
      status: draft.status,
      payoutId,
      payoutFileName: text(fileName),
    })),
    ...(editingId ? { groupId: editingId } : {}),
  };
}

/** 解除合并不等于撤销收款；原金额、账户、购买凭证不随批次操作重算。 */
export function planDissolveExpensePayout(all: readonly Expense[], ids: readonly string[], resetPaid: boolean): ExpensePayoutPlan {
  const rows = selectedRows(all, ids);
  assertCompleteGroups(all, rows);
  const groups = [...new Set(rows.map((row) => row.payoutId).filter(Boolean))];
  return {
    before: rows.map(snapshot),
    after: rows.map((row) => ({
      ...snapshot(row),
      payoutId: "",
      payoutFileName: "",
      ...(resetPaid ? { status: "未报销" as const, payoutDate: "", reimbursedAt: "" } : {}),
    })),
    ...(groups.length === 1 ? { groupId: groups[0] } : {}),
  };
}

/** JSON 台账快照比较忽略对象键顺序，保留所有业务字段及未知兼容字段。 */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

/** 上传前后及 store 共用 CAS 判据：完整快照一致，且涉及的原批成员一个都不能遗漏。 */
export function expenseBatchMatches(all: readonly Expense[], before: readonly Expense[], groupId?: string): boolean {
  if (!before.length || before.some((row) => !row.id) || new Set(before.map((row) => row.id)).size !== before.length) return false;
  const current = new Map<string, Expense>();
  for (const row of all) {
    if (current.has(row.id)) return false;
    current.set(row.id, row);
  }
  if (before.some((row) => !current.has(row.id) || stable(current.get(row.id)) !== stable(row))) return false;
  const groups = new Set(before.map((row) => row.payoutId).filter(Boolean));
  if (groupId) groups.add(groupId);
  for (const id of groups) {
    const expected = new Set(before.filter((row) => row.payoutId === id).map((row) => row.id));
    const actual = all.filter((row) => row.payoutId === id);
    if (actual.length !== expected.size || actual.some((row) => !expected.has(row.id))) return false;
  }
  return true;
}

const PAYOUT_FIELDS = new Set(["claimant", "forWhom", "payBank", "payCardNo", "payAccount", "payoutId", "payoutFileName", "payoutMethod", "payoutDate", "reimbursedAt", "status"]);

/** 原子收款操作只能改收款关系；金额、项目等字段由原单据编辑器负责。 */
export function canApplyExpenseBatch(all: readonly Expense[], before: readonly Expense[], after: readonly Expense[], groupId?: string): boolean {
  if (!expenseBatchMatches(all, before, groupId) || before.length !== after.length) return false;
  const originals = new Map(before.map((row) => [row.id, row]));
  const selected = new Set(before.map((row) => row.id));
  const otherGroups = new Set(all.filter((row) => !selected.has(row.id)).map((row) => row.payoutId).filter(Boolean));
  if (new Set(after.map((row) => row.id)).size !== after.length) return false;
  return after.every((row) => {
    const original = originals.get(row.id);
    if (!original || (row.status !== "已报销" && row.status !== "未报销")) return false;
    const withoutPayout = (value: Expense) => Object.fromEntries(Object.entries(value).filter(([field]) => !PAYOUT_FIELDS.has(field)));
    if (stable(withoutPayout(original)) !== stable(withoutPayout(row))) return false;
    return !row.payoutId || !otherGroups.has(row.payoutId);
  });
}
