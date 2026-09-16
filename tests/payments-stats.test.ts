/**
 * 发放记录「四口径一致」专项测试（口径一致性专项 20260916）。
 *
 * 用户报的实例：发放记录页「按实际收款人入账（只计已填日期的；待发放不算已发）」
 * 统计显示不全 —— 空发放方被 `filter(Boolean)` 从下拉里删掉，按发放方取数时漏项。
 * 这里把四个口径钉死：①列表条数 ②汇总数字 ③按收款人分组面板 ④发放方下拉选项
 * （+ ⑤打印：明细逐笔之和 == 汇总里该人合计 == 总计）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  byOwnerRows,
  detailSections,
  filterPayments,
  paymentSummary,
  paymentsInRange,
  printOwnerBuckets,
  printSummary,
  printTotals,
  ownerTotals,
  sectionTotals,
  sourceBuckets,
} from "../src/lib/payments-stats";
import { ALL_BUCKETS } from "../src/lib/buckets";
import { ymKey } from "../src/lib/dates";
import type { Payment } from "../src/lib/types";

function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "", receiver: "", date: "", amount: 0, source: "", remark: "", ...over };
}

/** 边界 fixture：空发放方 / 待发放 / 非补零日期 / 跨年 / 代收 / 金额 0 */
const FIXTURE: Payment[] = [
  pay({ id: "p1", owner: "张三", receiver: "张三", date: "2026-03-05", amount: 1000, source: "五冶" }),
  pay({ id: "p2", owner: "张三", receiver: "张三", date: "2026-03-20", amount: 500, source: "五冶" }),
  pay({ id: "p3", owner: "李四", receiver: "李四", date: "2026-06-01", amount: 800, source: "" }), // 空发放方
  pay({ id: "p4", owner: "李四", receiver: "王五", date: "2026-06-02", amount: 200, source: "" }), // 空发放方 + 代收
  pay({ id: "p5", owner: "王五", receiver: "王五", date: "2026-6-3", amount: 300, source: "一局" }), // 非补零日期
  pay({ id: "p6", owner: "赵六", receiver: "赵六", date: "", amount: 900, source: "一局" }), // 待发放
  pay({ id: "p7", owner: "钱七", receiver: "钱七", date: "2025-12-31", amount: 0, source: "五冶" }), // 金额 0 + 跨年
];

const LO = ymKey(2026, 1);
const HI = ymKey(2026, 12);
const ranged = paymentsInRange(FIXTURE, LO, HI);
const all = filterPayments(ranged, { status: "all", source: ALL_BUCKETS, q: "" });

test("paymentSummary：待发放不计入已发（金额与笔数分开）", () => {
  const s = paymentSummary(all);
  assert.equal(s.count, all.length);
  assert.equal(s.paidAmt, 1000 + 500 + 800 + 200 + 300, "已发 = 有日期的 5 笔；跨年那笔不在区间内");
  assert.equal(s.pendingCount, 1);
  assert.equal(s.pendingAmt, 900);
  assert.equal(s.total, s.paidAmt + s.pendingAmt);
  assert.equal(s.proxyCount, 1, "只有 p4 是代收");
});

test("按实际收款人面板：金额 = 逐笔之和，且覆盖「全部」里的每一个人", () => {
  const rows = byOwnerRows(all);
  assert.deepEqual(
    rows.map((r) => `${r.owner}:${r.count}:${r.amount}`),
    ["张三:2:1500", "李四:2:1000", "王五:1:300"],
  );
  const panelSum = rows.reduce((s, r) => s + r.amount, 0);
  assert.equal(panelSum, paymentSummary(all).paidAmt, "面板之和必须等于汇总的已发金额");
  assert.equal(
    rows.reduce((s, r) => s + r.count, 0),
    paymentSummary(all).count - paymentSummary(all).pendingCount,
    "面板笔数之和 = 列表条数 − 待发放笔数",
  );
});

test("发放方下拉：空发放方是一个真实桶（用户报的漏项），逐桶金额相加 == 已发合计", () => {
  const buckets = sourceBuckets(ranged);
  assert.deepEqual(
    buckets.map((b) => b.value),
    ["五冶", "一局", ""],
    "非空发放方按 zh 排序 + 末尾一个「未填发放方」桶",
  );
  assert.equal(buckets.at(-1)?.label, "未填发放方");
  // 旧口径：filter(Boolean) 只有 ["五冶","一局"] → 逐桶取不到空发放方的钱
  const oldBuckets = [...new Set(ranged.map((p) => p.source).filter(Boolean))];
  const sumOf = (list: string[]) =>
    list.reduce((s, b) => s + filterPayments(ranged, { status: "all", source: b, q: "" }).reduce((a, p) => a + (p.date ? p.amount : 0), 0), 0);
  const paidTotal = paymentSummary(all).paidAmt;
  assert.equal(sumOf(oldBuckets.map(String)), 300 + 1500, "旧口径：五冶 1500 + 一局 300，空发放方的 1000 取不到");
  assert.equal(sumOf(buckets.map((b) => b.value)), paidTotal, "新口径：四个桶相加 = 已发合计");
});

test("筛选口径一致：发放方 = 未填发放方（空串）时，列表/汇总/面板同时只剩这两笔", () => {
  const rows = filterPayments(ranged, { status: "all", source: "", q: "" });
  assert.equal(rows.length, 2);
  assert.equal(paymentSummary(rows).paidAmt, 1000);
  assert.equal(paymentSummary(rows).total, 1000, "待发放属于「一局」，也被这一桶筛掉");
  assert.deepEqual(byOwnerRows(rows).map((r) => r.owner), ["李四"]);
});

test("筛选口径一致：状态=待发放时不混进已发；状态=已发时没有待发放", () => {
  const pending = filterPayments(ranged, { status: "pending", source: ALL_BUCKETS, q: "" });
  assert.equal(pending.length, 1);
  assert.equal(paymentSummary(pending).paidAmt, 0);
  const paid = filterPayments(ranged, { status: "paid", source: ALL_BUCKETS, q: "" });
  assert.equal(paid.length, 5);
  assert.equal(paymentSummary(paid).pendingCount, 0);
});

test("搜索筛选：命中 owner 或 receiver；结果与汇总同源", () => {
  const rows = filterPayments(ranged, { status: "all", source: ALL_BUCKETS, q: "王五" });
  assert.deepEqual(rows.map((r) => r.id).sort(), ["p4", "p5"]);
  assert.equal(paymentSummary(rows).paidAmt, 500);
});

test("跨年：2026 区间只含 2026 的已发 + 全部待发放；2025 那笔不进 2026", () => {
  assert.equal(all.some((p) => p.id === "p7"), false, "2025-12-31 在 2026 区间外");
  assert.equal(all.some((p) => p.id === "p6"), true, "待发放没有日期，一直留在列表里");
  const y25 = paymentsInRange(FIXTURE, ymKey(2025, 1), ymKey(2025, 12));
  assert.deepEqual(y25.map((p) => p.id), ["p6", "p7"]);
});

test("打印-模式一明细：逐笔之和 == 该人小计 == 总计；待发放被排除", () => {
  const sections = detailSections(all, ALL_BUCKETS);
  assert.deepEqual(sections.map((s) => s.owner), ["张三", "李四", "王五"], "按面板顺序分节，每人一节");
  for (const s of sections) {
    assert.equal(s.rows.length, s.count);
    assert.equal(s.rows.reduce((a, p) => a + p.amount, 0), s.amount);
    assert.equal(s.rows.every((p) => Boolean(p.date)), true, "明细里不许出现待发放");
  }
  const totals = printTotals(all);
  assert.equal(sections.reduce((s, x) => s + x.count, 0), totals.count);
  assert.equal(sections.reduce((s, x) => s + x.amount, 0), totals.amount);
  assert.equal(totals.count, 5);
  assert.equal(totals.amount, 2800);
  // 代收标注跟着节走
  assert.equal(sections.find((s) => s.owner === "李四")?.proxyCount, 1);
});

test("打印-模式二汇总：每人一行 + 总计；与明细同一份数据", () => {
  const rows = printSummary(all, ALL_BUCKETS);
  const totals = printTotals(all);
  assert.deepEqual(rows.map((r) => `${r.owner}:${r.count}:${r.amount}`), ["张三:2:1500", "李四:2:1000", "王五:1:300"]);
  assert.equal(rows.reduce((s, r) => s + r.count, 0), totals.count);
  assert.equal(rows.reduce((s, r) => s + r.amount, 0), totals.amount);
  const detail = detailSections(all, ALL_BUCKETS);
  for (const r of rows) {
    const d = detail.find((x) => x.owner === r.owner);
    assert.equal(d?.amount, r.amount, `${r.owner}：明细小计 == 汇总合计`);
    assert.equal(d?.count, r.count);
  }
});

test("打印-单人筛选：只出这一节/这一行，表尾总计 = 该人合计（不是全部人的）", () => {
  assert.deepEqual(detailSections(all, "李四").map((s) => s.owner), ["李四"]);
  assert.equal(detailSections(all, "李四")[0].amount, 1000);
  assert.deepEqual(printSummary(all, "张三").map((r) => r.amount), [1500]);
  // 选单人时「总计」只能算这个人：明细节之和 == 汇总行之和 == 该人合计
  assert.deepEqual(sectionTotals(detailSections(all, "李四")), { count: 2, amount: 1000 });
  assert.deepEqual(ownerTotals(printSummary(all, "李四")), { count: 2, amount: 1000 });
  // 全部人时三者互等
  assert.deepEqual(sectionTotals(detailSections(all, ALL_BUCKETS)), printTotals(all));
  assert.deepEqual(ownerTotals(printSummary(all, ALL_BUCKETS)), printTotals(all));
  assert.deepEqual(detailSections(all, "不存在"), []);
  assert.deepEqual(printSummary(all, "不存在"), []);
  assert.equal(printTotals(filterPayments(ranged, { status: "pending", source: ALL_BUCKETS, q: "" })).count, 0, "只有待发放 → 打印数据为空");
});

test("打印-可选实际收款人下拉：来自当前筛选的已发记录，不含待发放的人", () => {
  const buckets = printOwnerBuckets(all);
  assert.deepEqual(buckets.map((b) => b.value), ["李四", "王五", "张三"]);
  assert.equal(buckets.some((b) => b.value === "赵六"), false, "赵六只有待发放，不该出现在打印下拉里");
  const scoped = printOwnerBuckets(filterPayments(ranged, { status: "all", source: "", q: "" }));
  assert.deepEqual(scoped.map((b) => b.value), ["李四"]);
});

test("金额 0 的记录照常计数与入账（不被过滤掉）", () => {
  const rows = filterPayments(ranged, { status: "paid", source: ALL_BUCKETS, q: "" });
  const zero = pay({ id: "z1", owner: "孙八", receiver: "孙八", date: "2026-02-01", amount: 0, source: "五冶" });
  const withZero = filterPayments(paymentsInRange([...rows, zero], LO, HI), { status: "paid", source: ALL_BUCKETS, q: "" });
  assert.equal(paymentSummary(withZero).count, 6);
  assert.equal(paymentSummary(withZero).paidAmt, 2800);
  assert.equal(byOwnerRows(withZero).some((r) => r.owner === "孙八" && r.count === 1), true);
});
