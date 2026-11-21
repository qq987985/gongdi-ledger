import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canApplyExpenseBatch,
  expenseBatchMatches,
  expensePayoutBatches,
  expensePayoutDraft,
  planDissolveExpensePayout,
  planExpensePayout,
  type ExpensePayoutDraft,
} from "../src/lib/expense-payout";
import { expenseChanges, parseDetail } from "../src/lib/audit-diff";
import type { Expense } from "../src/lib/types";

const today = "2026-11-21";
function row(id: string, extra: Partial<Expense> = {}): Expense {
  return {
    id, name: `项目${id}`, year: 2026, period: "2026-11-01", date: "2026-11-01", unit: "项",
    qty: 2, price: 50, amount: 0, remark: "原明细", status: "未报销", payMethod: "现金",
    voucherId: "purchase-original", voucherFileName: "购买凭证.pdf", claimant: "合成甲", forWhom: "",
    payBank: "", payCardNo: "", payAccount: "", payoutId: "", payoutFileName: "", payoutDate: "",
    payoutMethod: "转账", reimbursedAt: "", ...extra,
  };
}
function draft(extra: Partial<ExpensePayoutDraft> = {}): ExpensePayoutDraft {
  return { claimant: "补填报销人", forWhom: "合成收款人", payBank: "合成银行", payCardNo: "000012345678",
    payoutMethod: "转账", payoutDate: today, status: "已报销", ...extra };
}
function plan(all: Expense[], extra: Partial<Parameters<typeof planExpensePayout>[0]> = {}) {
  return planExpensePayout({ all, ids: all.map((r) => r.id), draft: draft(), payoutId: "batch-new", fileName: "收款凭证.pdf", ...extra });
}

test("收款批次仅按原payoutId分组：同日同账户不猜合并，跨年完整，金额精确到分", () => {
  const source = [row("a", { payoutId: "g1", amount: 0.1, payoutDate: "2026-11-21", status: "已报销" }),
    row("b", { payoutId: "g1", year: 2025, amount: 0.2, payoutDate: "2026-11-21", status: "已报销" }),
    row("c", { payoutId: "g2", amount: 123, payoutDate: "2026-11-21", status: "已报销" }), row("d", { amount: 999 })];
  const groups = expensePayoutBatches(source);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].rows.map((r) => r.id), ["a", "b"]);
  assert.equal(groups[0].total, 0.3);
  assert.equal(groups[0].status, "已报销");
  assert.equal(expensePayoutBatches([row("a", { payoutId: "g", amount: "1,200" as unknown as number })])[0].total, 1200);
  assert.equal(source[0].amount, 0.1, "分组不改原记录");
});

test("批次按最近真实收款或购买日期排序，显示多位报销人且不把多人视为错误", () => {
  const groups = expensePayoutBatches([row("a", { payoutId: "old", claimant: "合成甲" }), row("b", { payoutId: "new", claimant: "合成乙", date: "2026-11-20" }), row("c", { payoutId: "new", claimant: "合成丙", date: "2026-11-19" })]);
  assert.equal(groups[0].id, "new");
  assert.equal(groups[0].date, "2026-11-20");
  assert.equal(groups[0].claimant, "合成乙、合成丙");
  assert.deepEqual(groups[0].issues, []);
});

test("旧批次混合状态、账户与凭证不一致可见，不伪装为完整的一张凭证", () => {
  const batch = expensePayoutBatches([row("a", { payoutId: "g", status: "已报销", forWhom: "甲", payCardNo: "111", payoutFileName: "old.pdf" }), row("b", { payoutId: "g", forWhom: "乙", payCardNo: "222" })])[0];
  assert.equal(batch.status, "状态不一致");
  assert.equal(batch.fileName, "");
  assert.ok(batch.issues.includes("收款账户不一致"));
  assert.ok(batch.issues.includes("收款凭证不一致"));
});

test("打开下一批从零初始化：空字段不沿用上批账户、日期或收款状态", () => {
  const old = expensePayoutDraft([row("a", { status: "已报销", forWhom: "旧收款人", payBank: "旧银行", payCardNo: "旧卡号", payoutDate: "2026-11-20" })], today);
  assert.equal(old.payBank, "旧银行");
  const fresh = expensePayoutDraft([row("b")], today);
  assert.deepEqual(fresh, { claimant: "合成甲", forWhom: "合成甲", payBank: "", payCardNo: "", payoutMethod: "转账", payoutDate: "", status: "未报销" });
  assert.deepEqual(expensePayoutDraft([], today), { claimant: "", forWhom: "", payBank: "", payCardNo: "", payoutMethod: "转账", payoutDate: "", status: "未报销" });
});

test("账户完整元组有冲突就清空，不能从两张不同卡拼出一个收款账户", () => {
  const value = expensePayoutDraft([row("a", { forWhom: "收款甲", payBank: "银行甲", payCardNo: "111" }), row("b", { forWhom: "收款甲", payBank: "银行乙", payCardNo: "222" })], today);
  assert.equal(value.forWhom, "合成甲");
  assert.equal(value.payBank, "");
  assert.equal(value.payCardNo, "");
  const unnamed = expensePayoutDraft([row("c", { payBank: "未知持卡人的银行", payCardNo: "333" })], today);
  assert.equal(unnamed.forWhom, "合成甲");
  assert.equal(unnamed.payBank, "", "不能把缺收款人的旧卡号拼给默认报销人");
  assert.equal(unnamed.payCardNo, "");
  const paid = expensePayoutDraft([row("a", { status: "已报销", payoutDate: "2026-02-31" })], today);
  assert.equal(paid.payoutDate, today);
});

test("合并不改0金额、数量、单价、购买凭证与未知兼容字段，不覆盖每笔原报销人", () => {
  const all = [row("a", { claimant: " 甲 " }), row("b", { claimant: "乙", amount: 25 }), { ...row("c", { claimant: "" }), legacyField: { keep: "原值" } }];
  const result = plan(all);
  assert.deepEqual(result.after.map((r) => r.claimant), [" 甲 ", "乙", "补填报销人"]);
  assert.equal(result.after[0].amount, 0);
  assert.equal(result.after[0].qty, 2);
  assert.equal(result.after[0].price, 50);
  assert.equal(result.after[0].voucherId, "purchase-original");
  assert.deepEqual((result.after[2] as Expense & { legacyField: unknown }).legacyField, { keep: "原值" });
  assert.deepEqual(all.map((r) => r.payoutId), ["", "", ""]);
});

test("各笔已有报销人时允许多人合批，无需强行填一个共同报销人", () => {
  const all = [row("a", { claimant: "甲" }), row("b", { claimant: "乙" })];
  assert.equal(expensePayoutDraft(all, today).claimant, "");
  assert.deepEqual(plan(all, { draft: draft({ claimant: "" }) }).after.map((r) => r.claimant), ["甲", "乙"]);
  assert.throws(() => plan([row("a", { claimant: "" })], { draft: draft({ claimant: "" }) }), /补填报销人/);
});

test("新建拒绝已分批、重复/丢失ID及被其他明细占用的批号", () => {
  assert.throws(() => plan([row("a", { payoutId: "old" })]), /已有收款批次/);
  assert.throws(() => plan([row("a")], { ids: ["a", "a"] }), /重复/);
  assert.throws(() => plan([row("a")], { ids: ["missing"] }), /变化或被删除/);
  assert.throws(() => plan([row("a")], { ids: [] }), /选择报销明细/);
  assert.throws(() => plan([row("a"), row("b", { payoutId: "batch-new" })], { ids: ["a"] }), /编号已被其他明细使用/);
});

test("编辑必须整批，可附加未分批明细；更换凭证时整批迁移到新编号，不吞其他批次", () => {
  const all = [row("a", { payoutId: "old", payoutFileName: "old.pdf" }), row("b", { payoutId: "old", payoutFileName: "old.pdf" }), row("c"), row("d", { payoutId: "other" })];
  assert.throws(() => plan(all, { ids: ["a"], editingId: "old" }), /本批全部明细/);
  assert.throws(() => plan(all, { editingId: "old" }), /其他收款批次/);
  const result = plan(all, { ids: ["a", "b", "c"], editingId: "old" });
  assert.equal(result.groupId, "old");
  assert.deepEqual(result.after.map((r) => r.payoutId), ["batch-new", "batch-new", "batch-new"]);
  assert.equal(result.before[0].payoutFileName, "old.pdf", "撤销依据必须保留原凭证引用");
  assert.equal(all[3].payoutId, "other");
  assert.throws(() => plan(all, { ids: ["c"], editingId: "gone" }), /批次已变化/);
});

test("待收款清日期；现金允许不填银行/卡号，非现金仍验证账户及真实日期", () => {
  const paid = [row("a", { status: "已报销", payoutDate: "2026-11-01", reimbursedAt: "2026-11-01" })];
  const waiting = plan(paid, { draft: draft({ status: "未报销" }) }).after[0];
  assert.equal(waiting.payoutDate, "");
  assert.equal(waiting.reimbursedAt, "");
  const cash = plan([row("a")], { draft: draft({ payoutMethod: "现金", payBank: "", payCardNo: "" }) });
  assert.equal(cash.after[0].payAccount, "");
  assert.throws(() => plan([row("a")], { draft: draft({ payBank: "" }) }), /非现金收款/);
  assert.throws(() => plan([row("a")], { draft: draft({ payoutDate: "2026-02-30" }) }), /有效的收款日期/);
  assert.throws(() => plan([row("a")], { draft: draft({ payoutDate: "2026-11-21junk" }) }), /有效的收款日期/);
  assert.equal(plan([row("a")], { draft: draft({ payoutDate: "2024-02-29" }) }).after[0].payoutDate, "2024-02-29");
  assert.throws(() => plan([row("a")], { draft: draft({ forWhom: " " }) }), /收款人/);
});

test("只选费用明细即可建立待收款批次，资料可暂空但原报销人和0金额不覆盖", () => {
  const all = [row("a", { claimant: "甲" }), row("b", { claimant: "" })];
  const waiting = draft({ claimant: "", forWhom: "", payBank: "", payCardNo: "", status: "未报销", payoutDate: "2026-02-31" });
  const result = plan(all, { draft: waiting, fileName: "" });
  assert.deepEqual(result.after.map((r) => r.claimant), ["甲", ""]);
  assert.ok(result.after.every((r) => r.payoutId === "batch-new" && !r.payoutDate && !r.reimbursedAt && r.status === "未报销"));
  assert.equal(result.after[0].amount, 0);
  const filled = plan(all, { draft: { ...waiting, claimant: "补填乙" }, fileName: "" });
  assert.deepEqual(filled.after.map((r) => r.claimant), ["甲", "补填乙"], "兜底只补原本未填的报销人");
  assert.throws(() => plan(all, { draft: { ...waiting, payoutMethod: "未知方式" } }), /选择收款方式/);
  assert.throws(() => plan(all, { draft: { ...waiting, status: "其他" as Expense["status"] } }), /选择收款状态/);
});

test("空资料的待收款批次不能直接确认已收款，补齐资料后保留各明细原报销人", () => {
  const blank = draft({ claimant: "", forWhom: "", payBank: "", payCardNo: "", status: "未报销", payoutDate: "" });
  const waiting = plan([row("a", { claimant: "甲" }), row("b", { claimant: "" })], { draft: blank, fileName: "" }).after;
  const confirm = (fields: Partial<ExpensePayoutDraft>) => plan(waiting, { editingId: "batch-new", payoutId: "batch-new", fileName: "", draft: { ...blank, status: "已报销", ...fields } });
  assert.throws(() => confirm({}), /填写收款人/);
  assert.throws(() => confirm({ forWhom: "收款甲" }), /补填报销人/);
  assert.throws(() => confirm({ forWhom: "收款甲", claimant: "乙" }), /非现金收款/);
  assert.throws(() => confirm({ forWhom: "收款甲", claimant: "乙", payBank: "银行", payCardNo: "111" }), /有效的收款日期/);
  const paid = confirm({ forWhom: "收款甲", claimant: "乙", payBank: "银行", payCardNo: "111", payoutDate: today });
  assert.deepEqual(paid.after.map((r) => r.claimant), ["甲", "乙"]);
  assert.ok(paid.after.every((r) => r.status === "已报销" && r.payoutDate === today && r.reimbursedAt === today));
});

test("整批解除只清关联，保留金额0、收款状态/日期与购买资料；撤销收款才改未报销", () => {
  const all = [row("a", { payoutId: "g", payoutFileName: "收款.pdf", status: "已报销", payoutDate: today, reimbursedAt: today, forWhom: "收款甲", payCardNo: "111" }), row("b", { payoutId: "g" })];
  const dissolved = planDissolveExpensePayout(all, ["a", "b"], false);
  assert.equal(dissolved.groupId, "g");
  assert.equal(dissolved.after[0].amount, 0);
  assert.equal(dissolved.after[0].status, "已报销");
  assert.equal(dissolved.after[0].payoutDate, today);
  assert.equal(dissolved.after[0].payCardNo, "111");
  assert.equal(dissolved.after[0].voucherId, "purchase-original");
  assert.equal(dissolved.after[0].payoutId, "");
  assert.equal(dissolved.after[0].payoutFileName, "");
  assert.throws(() => planDissolveExpensePayout(all, ["a"], false), /完整收款批次/);
  const reset = planDissolveExpensePayout(all, ["a", "b"], true).after[0];
  assert.equal(reset.status, "未报销");
  assert.equal(reset.payoutDate, "");
  assert.equal(reset.reimbursedAt, "");
  assert.equal(reset.forWhom, "收款甲");
});

test("多批整批解除与单独未分批的恢复都可计划，不因同日合并不同原批", () => {
  const all = [row("a", { payoutId: "g1" }), row("b", { payoutId: "g2" }), row("c", { status: "已报销" })];
  const result = planDissolveExpensePayout(all, ["a", "b", "c"], true);
  assert.equal(result.groupId, undefined);
  assert.ok(result.after.every((r) => !r.payoutId && r.status === "未报销"));
});

test("CAS比较完整快照且忽略对象键顺序，删除、并发改款或同批新增成员均拒绝", () => {
  const before = [row("a", { payoutId: "g" }), row("b", { payoutId: "g" })];
  assert.ok(expenseBatchMatches(before.map((r) => Object.fromEntries(Object.entries(r).reverse()) as unknown as Expense), before, "g"));
  assert.equal(expenseBatchMatches(before.slice(0, 1), before, "g"), false);
  assert.equal(expenseBatchMatches([{ ...before[0], remark: "另一个编辑器改了" }, before[1]], before, "g"), false);
  assert.equal(expenseBatchMatches([...before, row("c", { payoutId: "g" })], before, "g"), false);
  assert.equal(expenseBatchMatches(before, before.slice(0, 1)), false);
});

test("原子写入拒绝新增/重复目标、修改原单据金额或串入未选的其他批次", () => {
  const all = [row("a"), row("b"), row("other", { payoutId: "foreign" })];
  const { before, after } = plan(all, { ids: ["a", "b"] });
  assert.ok(canApplyExpenseBatch(all, before, after));
  assert.equal(canApplyExpenseBatch(all, before, [{ ...after[0], amount: 100 }, after[1]]), false);
  assert.equal(canApplyExpenseBatch(all, before, [after[0], after[0]]), false);
  assert.equal(canApplyExpenseBatch(all, before, [{ ...after[0], id: "new" }, after[1]]), false);
  assert.equal(canApplyExpenseBatch(all, before, after.map((r) => ({ ...r, payoutId: "foreign" }))), false);
});

test("收款审计包含批次/凭证/收款关系变化，银行/卡号/组合账户只记填写状态", () => {
  const changes = expenseChanges(row("a"), plan([row("a")]).after[0]);
  assert.ok(changes.some((c) => c.label === "收款批次" && c.after === "batch-new"));
  assert.ok(changes.some((c) => c.label === "收款人" && c.after === "合成收款人"));
  assert.ok(changes.some((c) => c.label === "收款凭证"));
  for (const label of ["收款开户行", "收款账户", "收款账户资料"]) assert.equal(changes.find((c) => c.label === label)?.after, "已填（值不记录）");
  assert.ok(!JSON.stringify(changes).includes("000012345678"));
  assert.ok(!JSON.stringify(changes).includes("合成银行"));
});

const memory = new Map<string, string>();
const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => void memory.set(k, v), removeItem: (k: string) => void memory.delete(k) };
Object.assign(globalThis, { localStorage: storage, window: { localStorage: storage, setTimeout, clearTimeout, confirm: () => true } });
const audits: { action: string; detail: string; module: string }[] = [];
globalThis.fetch = async (_url, init) => {
  if (init?.method === "POST") audits.push(JSON.parse(String(init.body)));
  return Response.json({ ok: true });
};
const { useApp, emptyState } = await import("../src/lib/store");
const seed = (expenses: Expense[]) => { useApp.setState({ ...emptyState(), expenses }); audits.length = 0; };

test("store整批只触发一次更新，不出现中间半批，金额0不被qty*price变成100；可完整撤销", () => {
  const source = [row("a"), row("b", { amount: 25 }), row("other", { amount: 99 })];
  seed(source);
  const value = plan(source, { ids: ["a", "b"] });
  const snapshots: Expense[][] = [];
  const stop = useApp.subscribe((state, previous) => { if (state.expenses !== previous.expenses) snapshots.push(state.expenses); });
  assert.equal(useApp.getState().applyExpenseBatch(value.before, value.after), true);
  stop();
  assert.equal(snapshots.length, 1);
  assert.deepEqual(snapshots[0].map((r) => r.payoutId), ["batch-new", "batch-new", ""]);
  assert.equal(snapshots[0][0].amount, 0);
  assert.equal(snapshots[0][2], source[2]);
  assert.equal(audits.length, 1);
  assert.ok(parseDetail(audits[0].detail).changes.some((c) => c.label.includes("收款批次")));
  assert.ok(!audits[0].detail.includes("000012345678"));
  assert.equal(useApp.getState().applyExpenseBatch(value.after, value.before, "batch-new"), true);
  assert.deepEqual(useApp.getState().expenses, source);
});

test("store某一成员已修改或删除时整批拒绝，任何其他成员都不提前改写", () => {
  const source = [row("a"), row("b")];
  const value = plan(source);
  seed([source[0], { ...source[1], amount: 70 }]);
  const latest = useApp.getState().expenses;
  assert.equal(useApp.getState().applyExpenseBatch(value.before, value.after), false);
  assert.equal(useApp.getState().expenses, latest);
  assert.equal(audits.length, 0);
  seed([source[0]]);
  assert.equal(useApp.getState().applyExpenseBatch(value.before, value.after), false);
  assert.equal(useApp.getState().expenses[0].payoutId, "");
});

test("store同批新增成员或原批号被别组占用后拒绝保存/撤销，避免再次所有单据挂到一批", () => {
  const source = [row("a", { payoutId: "old" }), row("b", { payoutId: "old" })];
  const value = plan(source, { editingId: "old" });
  seed([...source, row("late", { payoutId: "old" })]);
  assert.equal(useApp.getState().applyExpenseBatch(value.before, value.after, "old"), false);
  seed(source);
  assert.equal(useApp.getState().applyExpenseBatch(value.before, value.after, "old"), true);
  useApp.setState({ expenses: [...useApp.getState().expenses, row("new-owner", { payoutId: "old" })] });
  const latest = useApp.getState().expenses;
  assert.equal(useApp.getState().applyExpenseBatch(value.after, value.before, "batch-new"), false);
  assert.equal(useApp.getState().expenses, latest);
});
