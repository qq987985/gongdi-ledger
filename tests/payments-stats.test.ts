/**
 * 发放记录「四口径一致」专项测试（口径一致性专项 20260916；1.8.5 三条口径决策）。
 *
 * 用户报的实例：发放记录页「按实际收款人入账」统计显示不全 —— 空发放方被 `filter(Boolean)`
 * 从下拉里删掉，按发放方取数时漏项。这里把四个口径钉死：①列表条数 ②汇总数字
 * ③按收款人分组面板 ④发放方下拉选项（+ ⑤打印：明细逐笔之和 == 汇总里该人合计 == 总计）。
 *
 * 1.8.5 起还要钉住三维修的恒等式（决策一 + 决策四）：
 * - 已发（本人）A + 代发（代收）B + 待发放 C = 全部合计；
 * - 明细逐笔之和 = 汇总各行之和 = 总计 = A + B + C，在「含待发放」「不含待发放」两种筛选下都成立；
 * - 单人造「本人收款 + 他人代收」混合数据时，该人显示的是已发（本人）金额，代发只进代发合计。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PENDING_LABEL,
  PRINT_CALIBER_NOTE,
  PROXY_LABEL,
  detailSections,
  filterPayments,
  isPaidSelf,
  isPending,
  isProxyPaid,
  ownerTotals,
  panelRows,
  paymentSummary,
  paymentsInRange,
  printOwnerBuckets,
  printSummary,
  printTotals,
  sectionTotals,
  sourceBuckets,
} from "../src/lib/payments-stats";
import { ALL_BUCKETS } from "../src/lib/buckets";
import { ymKey } from "../src/lib/dates";
import type { Payment } from "../src/lib/types";

function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "", receiver: "", date: "", amount: 0, source: "", remark: "", ...over };
}

/**
 * 边界 fixture：空发放方 / 待发放×2 / 非补零日期 / 跨年 / 代收 / 金额 0 / 收款人为空
 * 三维修（2026 区间内）：
 *   A 已发（本人）= 张三 1000+500 + 李四 800 + 王五 300 = 2600（4 笔）
 *   B 代发（代收）= 李四名下 200，王五代收 = 200（1 笔）
 *   C 待发放     = 赵六 900 + 李四 50 = 950（2 笔）
 *   合计 = 3750（7 笔）
 */
const FIXTURE: Payment[] = [
  pay({ id: "p1", owner: "张三", receiver: "张三", date: "2026-03-05", amount: 1000, source: "五冶" }),
  pay({ id: "p2", owner: "张三", receiver: "张三", date: "2026-03-20", amount: 500, source: "五冶" }),
  pay({ id: "p3", owner: "李四", receiver: "李四", date: "2026-06-01", amount: 800, source: "" }), // 空发放方
  pay({ id: "p4", owner: "李四", receiver: "王五", date: "2026-06-02", amount: 200, source: "" }), // 代收：王五代领
  pay({ id: "p5", owner: "王五", receiver: "王五", date: "2026-6-3", amount: 300, source: "一局" }), // 非补零日期
  pay({ id: "p6", owner: "赵六", receiver: "赵六", date: "", amount: 900, source: "一局" }), // 待发放
  pay({ id: "p7", owner: "钱七", receiver: "钱七", date: "2025-12-31", amount: 0, source: "五冶" }), // 金额 0 + 跨年
  pay({ id: "p8", owner: "李四", receiver: "李四", date: "", amount: 50, source: "五冶" }), // 李四的待发放
];

const LO = ymKey(2026, 1);
const HI = ymKey(2026, 12);
const ranged = paymentsInRange(FIXTURE, LO, HI);
const all = filterPayments(ranged, { status: "all", source: ALL_BUCKETS, q: "" });
const paidOnly = filterPayments(ranged, { status: "paid", source: ALL_BUCKETS, q: "" });
const pendingOnly = filterPayments(ranged, { status: "pending", source: ALL_BUCKETS, q: "" });

/** 三维修：A 已发（本人）；B 代发（代收）；C 待发放 */
const A = 2600;
const B = 200;
const C = 950;
const TOTAL = A + B + C;

test("isPaidSelf：本人收款的唯一判定（有日期 + 收款人即本人；代收不算已发）", () => {
  assert.equal(isPaidSelf(FIXTURE[0]), true, "张三收自己的钱 → 已发（本人）");
  assert.equal(isPaidSelf(FIXTURE[3]), false, "李四的钱由王五代领 → 不算李四已发");
  assert.equal(isProxyPaid(FIXTURE[3]), true);
  assert.equal(isPending(FIXTURE[5]), true, "没有发放日期 → 待发放");
  assert.equal(isPaidSelf(FIXTURE[5]), false);
  assert.equal(isProxyPaid(FIXTURE[5]), false, "待发放不是代发（三维修互不重叠）");
  // 收款人为空 = 同实际收款人（编辑弹窗「空则同实际收款人」，兼容旧数据 / Excel 导入）
  assert.equal(isPaidSelf(pay({ id: "x", owner: "孙八", receiver: "", date: "2026-01-01", amount: 1 })), true);
  // 三个维度互斥且完备
  for (const p of FIXTURE) {
    const hits = [isPaidSelf(p), isProxyPaid(p), isPending(p)].filter(Boolean).length;
    assert.equal(hits, 1, `${p.id} 必须且只能落在一个维度里`);
  }
});

test("paymentSummary：A + B + C = 全部合计（笔数与金额都成立）", () => {
  const s = paymentSummary(all);
  assert.equal(s.count, all.length);
  assert.equal(s.selfAmt, A, "已发（本人）= 2600：代收那 200 不算已发");
  assert.equal(s.selfCount, 4);
  assert.equal(s.proxyAmt, B, "代发 = 李四名下王五代领的 200");
  assert.equal(s.proxyCount, 1);
  assert.equal(s.pendingAmt, C, "待发放 = 赵六 900 + 李四 50");
  assert.equal(s.pendingCount, 2);
  assert.equal(s.total, TOTAL);
  // 恒等式（本次核心不变量）
  assert.equal(s.selfAmt + s.proxyAmt + s.pendingAmt, s.total, "A + B + C == 总计（金额）");
  assert.equal(s.selfCount + s.proxyCount + s.pendingCount, s.count, "A + B + C == 列表条数（笔数）");
});

test("按实际收款人面板：人员行（只算本人）+「代发」+「待发放」，三者之和 == 总计", () => {
  const rows = panelRows(all);
  assert.deepEqual(
    rows.map((r) => `${r.owner}:${r.kind}:${r.count}:${r.amount}`),
    ["张三:person:2:1500", "李四:person:1:800", "王五:person:1:300", `${PROXY_LABEL}:proxy:1:200`, `${PENDING_LABEL}:pending:2:950`],
    "李四那行只有本人收款 800；王五代领的 200 进了「代发」组，不进李四行",
  );
  const s = paymentSummary(all);
  assert.equal(rows.reduce((x, r) => x + r.amount, 0), s.total, "面板各行之和 == 汇总总计");
  assert.equal(rows.reduce((x, r) => x + r.count, 0), s.count, "面板笔数之和 == 列表条数");
  assert.equal(rows.find((r) => r.owner === "李四")?.amount, 800, "该人显示的是已发（本人）金额");
  assert.equal(rows.find((r) => r.owner === "李四")?.proxyCount, 1, "代收笔数只作提示，不进本行金额");
  assert.equal(rows.at(-1)?.kind, "pending", "待发放固定排在最后");
});

test("发放方下拉：空发放方是一个真实桶（用户报的漏项），逐桶本人已发之和 == A", () => {
  const buckets = sourceBuckets(ranged);
  assert.deepEqual(buckets.map((b) => b.value), ["五冶", "一局", ""], "非空发放方按 zh 排序 + 末尾一个「未填发放方」桶");
  assert.equal(buckets.at(-1)?.label, "未填发放方");
  // 旧口径：filter(Boolean) 只有 ["五冶","一局"] → 逐桶取不到空发放方的钱
  const oldBuckets = [...new Set(ranged.map((p) => p.source).filter(Boolean))];
  const selfOf = (b: string) => paymentSummary(filterPayments(ranged, { status: "paid", source: b, q: "" })).selfAmt;
  assert.equal(oldBuckets.reduce((s, b) => s + selfOf(b), 0), 1500 + 300, "旧口径：五冶 1500 + 一局 300，空发放方的 800 取不到");
  assert.equal(buckets.reduce((s, b) => s + selfOf(b.value), 0), A, "新口径：所有桶相加 == 已发（本人）合计");
});

test("筛选口径一致：发放方 = 未填发放方（空串）时，列表/汇总/面板同时只剩这两笔", () => {
  const rows = filterPayments(ranged, { status: "all", source: "", q: "" });
  assert.equal(rows.length, 2);
  assert.equal(paymentSummary(rows).selfAmt, 800, "只有李四本人那 800 是已发");
  assert.equal(paymentSummary(rows).proxyAmt, 200, "同桶里的王五代领 200 走代发");
  assert.equal(paymentSummary(rows).total, 1000, "待发放属于「五冶」/「一局」，被这一桶筛掉");
  assert.deepEqual(panelRows(rows).map((r) => r.owner), ["李四", PROXY_LABEL]);
});

test("筛选口径一致：状态=待发放时不混进已发；状态=已发时没有待发放", () => {
  assert.equal(pendingOnly.length, 2);
  const sp = paymentSummary(pendingOnly);
  assert.equal(sp.selfAmt, 0);
  assert.equal(sp.proxyAmt, 0);
  assert.equal(sp.total, sp.pendingAmt, "只有待发放时 总计 == C");
  assert.equal(paidOnly.length, 5);
  const sd = paymentSummary(paidOnly);
  assert.equal(sd.pendingCount, 0, "状态=已发时不带待发放");
  assert.equal(sd.total, sd.selfAmt + sd.proxyAmt, "不含待发放时 总计 == A + B");
  assert.equal(sd.total, A + B);
});

/** 核心不变量：明细逐笔之和 = 汇总各行之和 = 总计 = A + B + C */
function assertPrintInvariant(rows: Payment[], owner: string) {
  const scope = owner === ALL_BUCKETS ? rows : rows.filter((p) => (p.owner || "").trim() === owner);
  const s = paymentSummary(scope);
  const detail = detailSections(rows, owner);
  const summary = printSummary(rows, owner);
  const totals = printTotals(rows, owner);
  const dt = sectionTotals(detail);
  const st = ownerTotals(summary);
  assert.deepEqual(dt, totals, `明细各节之和 != 总计（owner=${owner}）`);
  assert.deepEqual(st, totals, `汇总各行之和 != 总计（owner=${owner}）`);
  assert.equal(totals.amount, s.total, `总计 != A+B+C（owner=${owner}）`);
  assert.equal(totals.count, s.count);
  assert.equal(dt.amount, s.selfAmt + s.proxyAmt + s.pendingAmt, "总计 == A + B + C");
  // 明细各节内部：逐笔之和 == 该节小计
  for (const sec of detail) {
    assert.equal(sec.rows.length, sec.count);
    assert.equal(sec.rows.reduce((x, p) => x + (p.amount || 0), 0), sec.amount, `${sec.owner} 节逐笔之和 != 小计`);
  }
  // 汇总里每个人员行都能在明细里找到同名同额的一节
  for (const r of summary.filter((x) => x.kind === "person")) {
    const sec = detail.find((x) => x.kind === "person" && x.owner === r.owner);
    assert.equal(sec?.amount, r.amount, `${r.owner}：明细小计 == 汇总合计`);
    assert.equal(sec?.count, r.count);
  }
  return { detail, summary, totals };
}

test("打印-含待发放（状态=全部）：明细=汇总=总计=A+B+C，且三组各自成节", () => {
  const { detail, totals } = assertPrintInvariant(all, ALL_BUCKETS);
  assert.deepEqual(detail.map((s) => s.kind), ["person", "person", "person", "proxy", "pending"]);
  assert.equal(detail.find((s) => s.kind === "proxy")?.amount, B);
  assert.equal(detail.find((s) => s.kind === "pending")?.amount, C);
  assert.equal(totals.count, 7);
  assert.equal(totals.amount, TOTAL);
  // 明细里的人名节里不许混进代收/待发放的行
  for (const sec of detail.filter((s) => s.kind === "person")) {
    assert.equal(sec.rows.every((p) => isPaidSelf(p)), true, "人员节只能有本人收款");
  }
  assert.equal(detail.find((s) => s.kind === "pending")?.rows.every((p) => isPending(p)), true);
  assert.equal(detail.find((s) => s.kind === "proxy")?.rows.every((p) => isProxyPaid(p)), true);
});

test("打印-不含待发放（状态=已发）：明细=汇总=总计=A+B", () => {
  const { detail, totals } = assertPrintInvariant(paidOnly, ALL_BUCKETS);
  assert.equal(totals.amount, A + B);
  assert.equal(totals.count, 5);
  assert.equal(detail.some((s) => s.kind === "pending"), false, "不含待发放时没有待发放节");
  assert.equal(detail.some((s) => s.kind === "proxy"), true, "代发仍然单列");
  const { totals: t2 } = assertPrintInvariant(pendingOnly, ALL_BUCKETS);
  assert.deepEqual(t2, { count: 2, amount: C }, "只筛选待发放时 总计 == C");
});

test("打印-单人造混合数据：该人只显示已发（本人），代发只进代发合计；等式仍成立", () => {
  const { detail, summary, totals } = assertPrintInvariant(all, "李四");
  assert.deepEqual(
    detail.map((s) => `${s.owner}:${s.amount}`),
    [`李四:800`, `${PROXY_LABEL}:200`, `${PENDING_LABEL}:50`],
    "李四的节只有本人 800；王五代领的 200 走「代发」节；他名下待发放 50 单列",
  );
  assert.deepEqual(
    summary.map((r) => `${r.owner}:${r.amount}`),
    [`李四:800`, `${PROXY_LABEL}:200`, `${PENDING_LABEL}:50`],
  );
  assert.deepEqual(totals, { count: 3, amount: 1050 }, "选单人时 总计 = 本人 800 + 代发 200 + 待发放 50");
  // 单人时「总计」不能变成全部人的
  assert.notEqual(totals.amount, TOTAL);
  assert.deepEqual(detailSections(all, "不存在"), []);
  assert.deepEqual(printSummary(all, "不存在"), []);
  assert.deepEqual(printTotals(all, "不存在"), { count: 0, amount: 0 });
});

test("打印-可选实际收款人下拉：来自当前筛选的本人收款记录，不含只有代收/待发放的人", () => {
  const buckets = printOwnerBuckets(all);
  assert.deepEqual(buckets.map((b) => b.value), ["李四", "王五", "张三"], "下拉按 zh 排序；李四有本人收款（800），王五只出现在代发里也有本人 300");
  assert.equal(buckets.some((b) => b.value === "赵六"), false, "赵六只有待发放，不该出现在打印下拉里");
  const scoped = printOwnerBuckets(filterPayments(ranged, { status: "all", source: "", q: "" }));
  assert.deepEqual(scoped.map((b) => b.value), ["李四"], "空发放方那一桶里只有李四有本人收款（王五那笔是代领）");
});

test("搜索筛选：命中 owner 或 receiver；结果与汇总同源", () => {
  const rows = filterPayments(ranged, { status: "all", source: ALL_BUCKETS, q: "王五" });
  assert.deepEqual(rows.map((r) => r.id).sort(), ["p4", "p5"]);
  assert.equal(paymentSummary(rows).selfAmt, 300, "王五本人那 300");
  assert.equal(paymentSummary(rows).proxyAmt, 200, "p4 是王五代领李四的");
});

test("跨年：2026 区间只含 2026 的已发 + 全部待发放；2025 那笔不进 2026", () => {
  assert.equal(all.some((p) => p.id === "p7"), false, "2025-12-31 在 2026 区间外");
  assert.equal(all.some((p) => p.id === "p6"), true, "待发放没有日期，一直留在列表里");
  const y25 = paymentsInRange(FIXTURE, ymKey(2025, 1), ymKey(2025, 12));
  assert.deepEqual(y25.map((p) => p.id), ["p6", "p7", "p8"], "两笔待发放一直留着 + 2025 那笔在区间内，顺序按原数组");
});

test("金额 0 的本人收款照常计数与入账（不被过滤掉）", () => {
  const zero = pay({ id: "z1", owner: "孙八", receiver: "孙八", date: "2026-02-01", amount: 0, source: "五冶" });
  const withZero = filterPayments(paymentsInRange([...paidOnly, zero], LO, HI), { status: "paid", source: ALL_BUCKETS, q: "" });
  assert.equal(paymentSummary(withZero).count, 6);
  assert.equal(paymentSummary(withZero).selfAmt, A, "0 元不改变金额");
  assert.equal(panelRows(withZero).some((r) => r.owner === "孙八" && r.count === 1), true);
});

test("打印口径小字（决策一 + 决策四）：代收与待发放都要写清", () => {
  assert.match(PRINT_CALIBER_NOTE, /已填发放日期/);
  assert.match(PRINT_CALIBER_NOTE, /代收（收款人非本人）不计入已发，单列代发/);
  assert.match(PRINT_CALIBER_NOTE, /待发放不算已发/);
});
