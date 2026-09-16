/**
 * 报销单「四口径一致」专项测试（口径一致性专项 20260916）。
 *
 * ① 列表条数 ② 合计/未报销/已报销/缺凭证 ③ 打印行与打印合计 ④ 报销人下拉选项。
 * 边界：空报销人、空收款人、金额 0、跨年、状态筛选、勾选后打印。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { claimantBuckets, expensePrintRows, expenseTotals, filterExpenses } from "../src/lib/expenses-stats";
import { ALL_BUCKETS } from "../src/lib/buckets";
import { needsVoucher } from "../src/lib/expense-rules";
import type { Expense } from "../src/lib/types";

function exp(over: Partial<Expense> & { id: string }): Expense {
  return {
    name: "项目",
    year: 2026,
    period: "2026-03-01",
    date: "2026-03-01",
    unit: "项",
    qty: 1,
    price: 0,
    amount: 0,
    remark: "",
    payMethod: "现金",
    status: "未报销",
    reimbursedAt: "",
    voucherId: "",
    voucherFileName: "",
    claimant: "",
    forWhom: "",
    payAccount: "",
    payBank: "",
    payCardNo: "",
    payoutId: "",
    payoutFileName: "",
    payoutDate: "",
    payoutMethod: "转账",
    ...over,
  };
}

const LIST: Expense[] = [
  exp({ id: "e1", name: "甲", year: 2026, amount: 100, claimant: "张三", status: "未报销", payMethod: "现金" }),
  exp({ id: "e2", name: "乙", year: 2026, amount: 0, claimant: "", status: "未报销", payMethod: "现金" }), // 空报销人 + 金额 0
  exp({
    id: "e3",
    name: "丙",
    year: 2026,
    amount: 500,
    claimant: "李四",
    status: "已报销",
    payMethod: "转账",
    voucherFileName: "v.pdf",
    payoutMethod: "转账",
    payoutFileName: "p.pdf",
  }), // 已报销、凭证齐
  exp({
    id: "e4",
    name: "丁",
    year: 2026,
    amount: 300,
    claimant: "李四",
    status: "已报销",
    payMethod: "转账",
    voucherFileName: "",
    payoutMethod: "转账",
    payoutFileName: "",
  }), // 已报销、缺两张凭证
  exp({ id: "e5", name: "戊", year: 2025, amount: 999, claimant: "王五", status: "未报销", payMethod: "现金" }), // 跨年
];

const base = { scope: "year" as const, year: 2026, status: "all", claimant: ALL_BUCKETS, q: "" };

test("列表 == 范围筛选后的行；合计 == 逐行之和；未报销/已报销分开", () => {
  const shown = filterExpenses(LIST, base);
  assert.equal(shown.length, 4, "2025 那笔不算 2026");
  const t = expenseTotals(shown);
  assert.deepEqual(t, { amount: 900, count: 4, open: 100, done: 800, missing: 1, missPay: 1 });
  assert.equal(t.amount, shown.reduce((s, e) => s + (e.amount || 0), 0), "合计 = 逐行相加（含金额 0 的行）");
  assert.equal(t.open + t.done, t.amount);
  // 跨范围
  assert.equal(filterExpenses(LIST, { ...base, scope: "all" }).length, 5);
  assert.equal(expenseTotals(filterExpenses(LIST, { ...base, scope: "all" })).amount, 1899);
});

test("状态筛选：未报销/已报销各管各的，合计随之变化", () => {
  const open = expenseTotals(filterExpenses(LIST, { ...base, status: "未报销" }));
  assert.deepEqual(open, { amount: 100, count: 2, open: 100, done: 0, missing: 0, missPay: 0 });
  const done = expenseTotals(filterExpenses(LIST, { ...base, status: "已报销" }));
  assert.deepEqual(done, { amount: 800, count: 2, open: 0, done: 800, missing: 1, missPay: 1 });
});

test("报销人下拉：来自当前范围的真实桶 + 「未填报销人」（空报销人的记录选得到）", () => {
  const scoped = filterExpenses(LIST, base);
  const buckets = claimantBuckets(scoped);
  assert.deepEqual(
    buckets.map((b) => `${b.value}|${b.label}`),
    ["李四|李四", "张三|张三", "|未填报销人"],
  );
  // 旧口径：所有年份 + filter(Boolean) → 会多出一个本年没有的「王五」，并且少了「未填」
  const oldOpts = [...new Set(LIST.map((e) => e.claimant).filter(Boolean))];
  assert.equal(oldOpts.includes("王五"), true, "旧口径有跨年死选项（选了 0 行）");
  assert.equal(oldOpts.includes(""), false, "旧口径没有空报销人这一桶");
  // 逐桶相加 == 全部
  const viaBuckets = buckets.reduce((s, b) => s + filterExpenses(LIST, { ...base, claimant: b.value }).length, 0);
  assert.equal(viaBuckets, scoped.length);
  // 选「未填报销人」真的只剩那一笔
  const none = filterExpenses(LIST, { ...base, claimant: "" });
  assert.deepEqual(none.map((e) => e.id), ["e2"]);
  assert.equal(expenseTotals(none).amount, 0, "金额 0 也照常计数");
});

test("打印行：默认跟随列表；勾选了就只用勾选的；按打印状态再过滤", () => {
  const shown = filterExpenses(LIST, base);
  assert.deepEqual(
    expensePrintRows({ list: LIST, selected: [], shown, printStatus: "all" }).map((e) => e.id),
    shown.map((e) => e.id),
    "默认打印行与列表同一顺序（按日期/期间排）",
  );
  const picked = expensePrintRows({ list: LIST, selected: ["e1", "e3"], shown, printStatus: "all" });
  assert.deepEqual(picked.map((e) => e.id), ["e1", "e3"]);
  const openOnly = expensePrintRows({ list: LIST, selected: [], shown, printStatus: "未报销" });
  assert.deepEqual(openOnly.map((e) => e.id), ["e1", "e2"]);
  const openPicked = expensePrintRows({ list: LIST, selected: ["e1", "e3"], shown, printStatus: "未报销" });
  assert.deepEqual(openPicked.map((e) => e.id), ["e1"], "勾选 + 状态过滤同时生效");
  // 打印合计与打印行同源
  assert.equal(openOnly.reduce((s, e) => s + (e.amount || 0), 0), expenseTotals(openOnly).amount);
});

test("空列表：一切归零，不产生打印行", () => {
  const empty = filterExpenses([], base);
  assert.deepEqual(empty, []);
  assert.deepEqual(expenseTotals(empty), { amount: 0, count: 0, open: 0, done: 0, missing: 0, missPay: 0 });
  assert.deepEqual(claimantBuckets(empty), []);
  assert.deepEqual(expensePrintRows({ list: [], selected: [], shown: [], printStatus: "all" }), []);
});

test("needsVoucher：现金不用凭证，其余都要（唯一实现在 lib/expense-rules.ts）", () => {
  assert.equal(needsVoucher("现金"), false);
  assert.equal(needsVoucher(""), false, "空按现金处理（与旧行为一致）");
  assert.equal(needsVoucher("转账"), true);
});
