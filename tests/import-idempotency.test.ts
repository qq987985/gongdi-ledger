/**
 * 导入幂等：非补零日期（`2026-9-5` / `2026/9/5`）不能破坏去重键。
 *
 * 背景（1.8.8 缺陷 D5，报告 docs/审查与报告/功能测试-C-…-20260916.md）：
 * 导出把台账里的日期原样写进 Excel（可能是用户手填的 `2026-9-5`），
 * 导入时 `rowToPayment` 又用 `normalizeDate` 把它规范成 `2026-09-05`，
 * 于是「同一条记录」在去重键里一个是不补零、一个是补零 → 键不相等 →
 * **同一份导出文件再导入一次就多记一笔金额**（实测 5 笔 → 6 笔）。
 *
 * 修在根上：去重键里的日期统一先规范化，导出/导入/再导入幂等。
 * 注意：这里只保证「不再新增重复」，不会去动用户已有的数据（历史重复只提示，见 VERSION 1.8.8）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  mergeExpenses,
  mergePayments,
  paymentKey,
  expenseKey,
  findDuplicateGroups,
  duplicateNotice,
} from "../src/lib/excel/common";
import { buildPaymentWorkbook, parsePaymentSheet } from "../src/lib/excel/payments";
import { buildExpenseWorkbook, parseExpenseSheet } from "../src/lib/excel/expenses";
import type { Expense, Payment } from "../src/lib/types";

function pay(over: Partial<Payment> = {}): Payment {
  return {
    id: over.id || `p-${Math.random().toString(36).slice(2, 8)}`,
    owner: "李四",
    receiver: "李四",
    date: "2026-9-5",
    amount: 1200,
    source: "一局",
    remark: "",
    ...over,
  };
}
function exp(over: Partial<Expense> = {}): Expense {
  return {
    id: over.id || `e-${Math.random().toString(36).slice(2, 8)}`,
    year: 2026,
    name: "办公用品",
    period: "",
    date: "2026/9/5",
    unit: "项",
    qty: 1,
    price: 200,
    amount: 200,
    remark: "",
    payMethod: "现金",
    status: "未报销",
    reimbursedAt: "",
    voucherId: "",
    voucherFileName: "",
    claimant: "张三",
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
const sum = (a: { amount: number }[]) => a.reduce((s, x) => s + (x.amount || 0), 0);
const xbuf = (wb: XLSX.WorkBook) => XLSX.write(wb, { type: "array", bookType: "xlsx" });

test("D5 发放：去重键把非补零日期规范化（2026-9-5 == 2026-09-05）", () => {
  assert.equal(paymentKey(pay({ date: "2026-9-5" })), paymentKey(pay({ date: "2026-09-05" })));
  assert.equal(paymentKey(pay({ date: "2026/9/5" })), paymentKey(pay({ date: "2026-09-05" })));
  // 空日期（待发放）不能被规范化成今天，照旧按空比对
  assert.equal(paymentKey(pay({ date: "" })), paymentKey(pay({ date: "" })));
  assert.notEqual(paymentKey(pay({ date: "" })), paymentKey(pay({ date: "2026-09-05" })));
});

test("D5 报销：去重键同样把非补零日期规范化", () => {
  assert.equal(expenseKey(exp({ date: "2026-9-5" })), expenseKey(exp({ date: "2026-09-05" })));
  assert.equal(expenseKey(exp({ date: "2026/9/5" })), expenseKey(exp({ date: "2026-09-05" })));
});

test("D5 发放：导出 → 导入 → 再导入，笔数与金额不变（2026-9-5 与 2026/9/5 两份都覆盖）", () => {
  const existing = [
    pay({ id: "p1", owner: "张三", date: "2026-01-08", amount: 1000 }),
    pay({ id: "p2", owner: "李四", date: "2026-9-5", amount: 1200 }),
    pay({ id: "p3", owner: "王五", date: "2026/9/5", amount: 300 }),
    pay({ id: "p4", owner: "赵六", date: "2026-02-01", amount: 900 }),
  ];
  const buf = xbuf(buildPaymentWorkbook(existing));
  const incoming = parsePaymentSheet(buf);
  const before = { n: existing.length, sum: sum(existing) };

  const once = mergePayments(existing, incoming);
  assert.deepEqual([once.added, once.skipped], [0, 4], "第一次导入同一份导出文件不得新增/不得漏跳");
  assert.deepEqual([once.merged.length, sum(once.merged)], [before.n, before.sum], "笔数与金额不变");

  const twice = mergePayments(once.merged, parsePaymentSheet(buf));
  assert.deepEqual([twice.added, twice.skipped], [0, 4], "第二次导入仍全部跳过");
  assert.deepEqual([twice.merged.length, sum(twice.merged)], [before.n, before.sum], "笔数与金额不变");
});

test("D5 报销：导出 → 导入 → 再导入，条数与金额不变", () => {
  const existing = [exp({ id: "e1", date: "2026-9-5", amount: 200 }), exp({ id: "e2", date: "2026/9/5", amount: 800, name: "差旅费" })];
  const buf = xbuf(buildExpenseWorkbook(existing));
  const incoming = parseExpenseSheet(buf, 2026);
  const once = mergeExpenses(existing, incoming);
  assert.deepEqual([once.added, once.skipped], [0, 2], "第一次导入同一份导出文件不得新增");
  assert.deepEqual([once.merged.length, sum(once.merged)], [2, 1000]);
  const twice = mergeExpenses(once.merged, parseExpenseSheet(buf, 2026));
  assert.deepEqual([twice.added, twice.skipped], [0, 2], "第二次导入仍全部跳过");
  assert.deepEqual([twice.merged.length, sum(twice.merged)], [2, 1000]);
});

test("D5 真-新记录仍然进得来（规范化不能把不同日期误判成重复）", () => {
  const existing = [pay({ id: "p1", owner: "张三", date: "2026-9-5", amount: 1000 })];
  const incoming = [pay({ id: "p2", owner: "张三", date: "2026-9-6", amount: 1000 })];
  const r = mergePayments(existing, incoming);
  assert.deepEqual([r.added, r.skipped], [1, 0], "只差一天的记录不能算重复");
});

/* ── 1.8.8 B 组 D3（Y14）：空收款人回填导致的不幂等（与 D5 同源，同一处键） ── */

test("Y14 发放：收款人为空 = 本人（键与导入端回填后的值一致）", () => {
  assert.equal(paymentKey(pay({ receiver: "" })), paymentKey(pay({ receiver: "李四" })), "空收款人必须与 owner 同键");
  assert.notEqual(paymentKey(pay({ receiver: "王五" })), paymentKey(pay({ receiver: "" })), "真代收不能和本人同键");
});

test("Y14 发放：导出 → 导入 → 再导入，空收款人不新增（笔数/金额不变）", () => {
  const existing = [
    pay({ id: "p1", owner: "钱七", receiver: "", date: "2026-07-01", amount: 2000 }),
    pay({ id: "p2", owner: "李四", receiver: "", date: "2026-07-02", amount: 800 }),
  ];
  const buf = xbuf(buildPaymentWorkbook(existing));
  const incoming = parsePaymentSheet(buf);
  assert.equal(incoming[0].receiver, "钱七", "导入端确实会把空收款人回填成 owner（这正是旧键不等的根因）");
  const once = mergePayments(existing, incoming);
  assert.deepEqual([once.added, once.skipped], [0, 2], "空收款人记录不得被复制一份");
  assert.deepEqual([once.merged.length, sum(once.merged)], [2, 2800]);
  const twice = mergePayments(once.merged, parsePaymentSheet(buf));
  assert.deepEqual([twice.added, twice.skipped], [0, 2]);
  assert.deepEqual([twice.merged.length, sum(twice.merged)], [2, 2800]);
});

test("Y14 三类叠加：非补零日期 + 空收款人 + 两者叠加，导出→导入→再导入都不变", () => {
  const existing = [
    pay({ id: "a", owner: "钱七", receiver: "", date: "2026-7-1", amount: 2000 }), // 两者叠加
    pay({ id: "b", owner: "李四", receiver: "", date: "2026-07-02", amount: 800 }), // 只空收款人
    pay({ id: "c", owner: "周九", receiver: "周九", date: "2026/7/3", amount: 300 }), // 只非补零
    pay({ id: "d", owner: "赵六", receiver: "张三", date: "2026-09-05", amount: 50 }), // 真代收，必须保留
  ];
  const buf = xbuf(buildPaymentWorkbook(existing));
  const before = { n: existing.length, sum: sum(existing) };
  let rows = existing;
  for (const round of [1, 2]) {
    const r = mergePayments(rows, parsePaymentSheet(buf));
    assert.deepEqual([r.added, r.skipped], [0, 4], `第 ${round} 次导入应全部跳过`);
    assert.deepEqual([r.merged.length, sum(r.merged)], [before.n, before.sum], `第 ${round} 次导入后笔数/金额不变`);
    rows = r.merged;
  }
  assert.equal(rows.filter((p) => p.receiver === "张三").length, 1, "真代收那笔没有被丢掉也没被复制");
});

test("D5 历史重复只做提示：findDuplicateGroups 找出规范化键相同的记录且不改数据", () => {
  const legacy = [
    pay({ id: "p1", owner: "李四", date: "2026-9-5", amount: 1200 }),
    pay({ id: "p2", owner: "李四", date: "2026-09-05", amount: 1200 }), // 修版前重复导入留下的
    pay({ id: "p3", owner: "张三", date: "2026-01-08", amount: 1000 }),
  ];
  const groups = findDuplicateGroups(legacy, paymentKey);
  assert.equal(groups.length, 1, "只应报出 1 组重复");
  assert.deepEqual(
    groups[0].items.map((p) => p.id),
    ["p1", "p2"],
  );
  assert.equal(legacy.length, 3, "检测不得改动原数组（不自动删用户数据）");
  assert.equal(findDuplicateGroups([legacy[2]], paymentKey).length, 0, "没有重复就不报");
});

test("D5 提示文案：没有重复不提示；有重复提示组数/条数并写明不会自动删数据", () => {
  assert.equal(duplicateNotice([], "发放记录"), "");
  const groups = findDuplicateGroups(
    [
      pay({ id: "p1", owner: "李四", date: "2026-9-5", amount: 1200 }),
      pay({ id: "p2", owner: "李四", date: "2026-09-05", amount: 1200 }),
    ],
    paymentKey,
  );
  const text = duplicateNotice(groups, "发放记录");
  assert.match(text, /1 组重复/, text);
  assert.match(text, /共 2 条/, text);
  assert.match(text, /不会自动删你的数据/, text);
});
