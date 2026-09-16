/**
 * 发放记录「四口径一致」专项测试（口径一致性专项 20260916；1.8.5 三条口径决策，1.8.6 纠正代发/待发口径）。
 *
 * 用户报的实例：发放记录页「按实际收款人入账」统计显示不全 —— 空发放方被 `filter(Boolean)`
 * 从下拉里删掉，按发放方取数时漏项。这里把四个口径钉死：①列表条数 ②汇总数字
 * ③按收款人分组面板 ④发放方下拉选项（+ ⑤打印：明细/汇总各自与总计对得上）。
 *
 * 1.8.6 纠正后的口径（用户原话「待发不计，代发要计入实际收款人」）：
 * - **已发 A** = 所有填了发放日期的记录，按**实际收款人**（owner）计入其名下，**含代发**；
 * - **待发放 C** = 没有日期的记录，不算已发；
 * - **代发 B**（收款人非本人）是已发的**子集**：`B ⊆ A`，单列成「其中代发」，**不减 A**；
 * - 恒等式：`A + C = 全部合计`；明细=汇总=总计。
 * - 1.8.5 曾把代发从 A 里扣掉（A + B + C = 总计）—— 那是错的，本文件锁住纠正后的行为。
 * - `isPaidSelf`（本人收款）只用于工资条与「其中代发」的子集统计，**不用它判已发**（`isPaid`）。
 *
 * 两种打印清单**故意不同**（用户追加要求）：
 * - 明细清单：待发放也计入实际收款人名下（同一节），逐笔标注「已发/待发」，
 *   小计拆「已发小计 / 待发小计」；
 * - 汇总清单：待发放单列一组，不计入已发。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PENDING_LABEL,
  PRINT_CALIBER_NOTE_DETAIL,
  PRINT_CALIBER_NOTE_SUMMARY,
  PROXY_INLINE_LABEL,
  detailSections,
  filterPayments,
  isPaid,
  isPaidSelf,
  isPending,
  isProxyPaid,
  ownerTotals,
  panelRows,
  paymentSummary,
  paymentsInRange,
  printCaliberNote,
  printOwnerBuckets,
  printSummary,
  printTotals,
  sectionTotals,
  sourceBuckets,
} from "../src/lib/payments-stats";
import { ALL_BUCKETS } from "../src/lib/buckets";
import { ymKey } from "../src/lib/dates";
import { round2 } from "../src/lib/wage";
import type { Payment } from "../src/lib/types";

function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "", receiver: "", date: "", amount: 0, source: "", remark: "", ...over };
}

/**
 * 边界 fixture：空发放方 / 待发放×2 / 非补零日期 / 跨年 / 代收 / 金额 0 / 收款人为空
 * 2026 区间内（1.8.6 口径）：
 *   A 已发（按实际收款人，含代发）= 张三 1000+500 + 李四 800 + 李四代发 200 + 王五 300 = 2800（5 笔）
 *   B 其中代发（⊆ A）             = 李四名下王五代领 200（1 笔）
 *   C 待发放                      = 赵六 900 + 李四 50 = 950（2 笔）
 *   合计 = 3750（7 笔）；A + C = 3750
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

/** A 已发（含代发）；B 其中代发（⊆ A）；C 待发放 */
const A = 2800;
const B = 200;
const C = 950;
const TOTAL = A + C;

test("isPaid 是「已发」的唯一判定（有日期即算，含代发）；isPaidSelf 只管本人收款标注", () => {
  assert.equal(isPaid(FIXTURE[0]), true, "本人收款 → 已发");
  assert.equal(isPaid(FIXTURE[3]), true, "**代发也算已发**（钱已经出去了，按实际收款人计入）");
  assert.equal(isPaid(FIXTURE[5]), false, "没有发放日期 → 待发放，不算已发");
  assert.equal(isPaidSelf(FIXTURE[0]), true, "本人收款");
  assert.equal(isPaidSelf(FIXTURE[3]), false, "李四的钱由王五代领 → 不是「本人收款」");
  assert.equal(isProxyPaid(FIXTURE[3]), true, "有日期 + 收款人非本人 → 代发");
  assert.equal(isPending(FIXTURE[5]), true, "没有发放日期 → 待发放");
  assert.equal(isProxyPaid(FIXTURE[5]), false, "待发放不是代发");
  // 收款人为空 = 同实际收款人（编辑弹窗「空则同实际收款人」，兼容旧数据 / Excel 导入）
  assert.equal(isPaidSelf(pay({ id: "x", owner: "孙八", receiver: "", date: "2026-01-01", amount: 1 })), true);
  // 两个维度互斥且完备
  for (const p of FIXTURE) {
    const hits = [isPaid(p), isPending(p)].filter(Boolean).length;
    assert.equal(hits, 1, `${p.id} 必须且只能落在「已发 / 待发放」一个维度里`);
  }
  // 代发是已发的子集（不是第三维）
  for (const p of FIXTURE) {
    if (isProxyPaid(p)) assert.equal(isPaid(p), true, `${p.id}：代发必须同时是已发`);
  }
});

test("paymentSummary：A + C = 全部合计；代发 B ⊆ A（笔数与金额都成立）", () => {
  const s = paymentSummary(all);
  assert.equal(s.count, all.length);
  assert.equal(s.paidAmt, A, "已发 = 2800：**含**李四名下王五代领的 200（1.8.5 曾把它扣掉）");
  assert.equal(s.paidCount, 5, "5 笔有日期的记录（含 1 笔代发）");
  assert.equal(s.proxyAmt, B, "其中代发 = 200");
  assert.equal(s.proxyCount, 1);
  assert.equal(s.pendingAmt, C, "待发放 = 赵六 900 + 李四 50");
  assert.equal(s.pendingCount, 2);
  assert.equal(s.total, TOTAL);
  // 本次核心恒等式：已发 + 待发放 = 总计
  assert.equal(s.paidAmt + s.pendingAmt, s.total, "A + C == 总计（金额）");
  assert.equal(s.paidCount + s.pendingCount, s.count, "A + C == 列表条数（笔数）");
  // 代发是子集，不参与求和
  assert.ok(s.proxyAmt <= s.paidAmt, "B ⊆ A（金额）");
  assert.ok(s.proxyCount <= s.paidCount, "B ⊆ A（笔数）");
  assert.equal(s.paidAmt - s.proxyAmt, 2600, "已发里去掉代发 = 本人收款 2600（只作参考，不是汇总口径）");
});

test("按实际收款人面板：人员行含代发 +「待发放」，两者之和 == 总计；「其中代发」是子集标注", () => {
  const rows = panelRows(all);
  assert.deepEqual(
    rows.map((r) => `${r.owner}:${r.kind}:${r.count}:${r.amount}:${r.proxyCount}:${r.proxyAmt}`),
    [
      "张三:person:2:1500:0:0",
      "李四:person:2:1000:1:200", // 李四行含王五代领的 200（代发），并标注「其中代发」
      "王五:person:1:300:0:0",
      `${PENDING_LABEL}:pending:2:950:0:0`,
    ],
    "李四那行是 1000（本人 800 + 代发 200），不再把 200 扣出去单列成一行",
  );
  const s = paymentSummary(all);
  assert.equal(rows.reduce((x, r) => x + r.amount, 0), s.total, "面板各行之和 == 汇总总计");
  assert.equal(rows.reduce((x, r) => x + r.count, 0), s.count, "面板笔数之和 == 列表条数");
  assert.equal(rows.find((r) => r.owner === "李四")?.amount, 1000, "该人已发含代发");
  assert.equal(rows.find((r) => r.owner === "李四")?.proxyAmt, 200, "其中代发只作标注，不减本行");
  assert.equal(rows.at(-1)?.kind, "pending", "待发放固定排在最后");
  assert.equal(rows.some((r) => r.kind !== "person" && r.kind !== "pending"), false, "没有独立的「代发」分组行");
});

/**
 * 核心不变量：
 * - 明细各节之和 = 汇总各行之和 = 总计 = A + C；
 * - 明细每节：已发行数 + 待发行数 = 该人全部记录数，已发小计 == 汇总里该人的已发；
 * - 明细各人待发小计之和 == 汇总「待发放」组的金额；B ⊆ A。
 */
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
  assert.equal(totals.amount, s.total, `总计 != 全部合计（owner=${owner}）`);
  assert.equal(totals.count, s.count);
  assert.equal(totals.amount, s.paidAmt + s.pendingAmt, "总计 == A + C");
  assert.ok(s.proxyAmt <= s.paidAmt, `B ⊆ A（owner=${owner}）`);
  // 明细：每节 = 该人全部记录（已发 + 待发），逐笔之和 == 节合计；行数拆分成立
  let paidRows = 0;
  let pendingRows = 0;
  for (const sec of detail) {
    assert.equal(sec.rows.length, sec.count);
    assert.equal(sec.count, sec.paidCount + sec.pendingCount, `${sec.owner}：已发+待发行数 == 全部`);
    assert.equal(sec.amount, round2(sec.paidAmt + sec.pendingAmt), `${sec.owner}：合计 == 已发小计 + 待发小计`);
    assert.equal(sec.rows.reduce((x, p) => x + (p.amount || 0), 0), sec.amount, `${sec.owner} 节逐笔之和 != 节合计`);
    assert.equal(sec.rows.filter(isPaid).length, sec.paidCount);
    assert.equal(sec.rows.filter(isPending).length, sec.pendingCount);
    assert.equal(sec.rows.filter(isProxyPaid).length, sec.proxyCount);
    assert.ok(sec.proxyAmt <= sec.paidAmt, `${sec.owner} 的「其中代发」必须是已发小计的子集`);
    paidRows += sec.paidCount;
    pendingRows += sec.pendingCount;
  }
  assert.equal(paidRows + pendingRows, totals.count, "明细里 已发行数 + 待发行数 = 全部记录数");
  assert.equal(paidRows, s.paidCount, "明细里已发行数 == A 的笔数");
  assert.equal(pendingRows, s.pendingCount, "明细里待发行数 == C 的笔数");
  // 汇总里每个人部分行：金额 == 明细里该人的已发小计（含代发），数字必须一一对应
  for (const r of summary.filter((x) => x.kind === "person")) {
    const sec = detail.find((x) => x.owner === r.owner);
    assert.equal(sec?.paidAmt, r.amount, `${r.owner}：明细已发小计 == 汇总该人已发`);
    assert.equal(sec?.paidCount, r.count);
    assert.equal(sec?.proxyAmt, r.proxyAmt, `${r.owner}：「其中代发」明细与汇总一致`);
    assert.equal(sec?.proxyCount, r.proxyCount);
  }
  // 汇总「待发放」组的金额 == 明细里各人待发小计之和
  const detailPending = round2(detail.reduce((x, sec) => x + sec.pendingAmt, 0));
  const summaryPending = round2(summary.filter((r) => r.kind === "pending").reduce((x, r) => x + r.amount, 0));
  assert.equal(detailPending, summaryPending, "明细各人待发小计之和 == 汇总「待发放」组");
  assert.equal(detailPending, s.pendingAmt);
  return { detail, summary, totals };
}

test("打印明细-含待发放（状态=全部）：待发计入实际收款人名下，已发+待发行数 = 全部", () => {
  const { detail, totals } = assertPrintInvariant(all, ALL_BUCKETS);
  assert.deepEqual(detail.map((s) => s.owner), ["张三", "李四", "王五", "赵六"], "每人一节，按已发金额降序");
  const li = detail.find((s) => s.owner === "李四");
  assert.equal(li?.count, 3, "李四 3 笔：本人 1 + 代发 1 + 待发 1");
  assert.equal(li?.paidAmt, 1000, "已发小计含代发 200");
  assert.equal(li?.pendingAmt, 50, "待发小计单列");
  assert.equal(li?.amount, 1050);
  assert.equal(li?.proxyCount, 1);
  assert.equal(li?.proxyAmt, 200);
  const zhao = detail.find((s) => s.owner === "赵六");
  assert.equal(zhao?.paidAmt, 0, "只有待发的人：已发小计 0");
  assert.equal(zhao?.pendingAmt, 900, "待发小计 900（明细里他也有一节）");
  assert.deepEqual(totals, { count: 7, amount: TOTAL });
  // 代收笔仍留在本人节里并保留标记
  assert.equal(li?.rows.some((p) => isProxyPaid(p)), true, "代收笔留在该人节里");
  assert.equal(li?.rows.some((p) => isPending(p)), true, "待发笔也在该人节里");
});

test("打印汇总-含待发放（状态=全部）：待发放单列一组，不进任何人的已发", () => {
  const { summary, totals } = assertPrintInvariant(all, ALL_BUCKETS);
  assert.deepEqual(
    summary.map((r) => `${r.owner}:${r.kind}:${r.amount}`),
    ["张三:person:1500", "李四:person:1000", "王五:person:300", `${PENDING_LABEL}:pending:950`],
    "汇总里李四只有已发 1000（含代发），待发 950 单列在末尾一组",
  );
  assert.equal(summary.find((r) => r.owner === "李四")?.proxyAmt, B, "其中代发 200");
  assert.deepEqual(totals, { count: 7, amount: TOTAL });
});

test("打印-不含待发放（状态=已发）：明细/汇总/总计都 = A，待发一节都没有", () => {
  const { detail, summary, totals } = assertPrintInvariant(paidOnly, ALL_BUCKETS);
  assert.deepEqual(totals, { count: 5, amount: A }, "已发筛选下：总计 = A（含代发），没有 C");
  assert.equal(detail.every((s) => s.pendingCount === 0), true, "不含待发放时明细里没有待发行");
  assert.equal(summary.some((r) => r.kind === "pending"), false, "汇总里没有待发放组");
  const { totals: t2 } = assertPrintInvariant(pendingOnly, ALL_BUCKETS);
  assert.deepEqual(t2, { count: 2, amount: C }, "只筛选待发放时 总计 == C");
});

test("打印-单人造混合数据（本人+代发+待发）：小计拆分与面板/汇总三处数字一致", () => {
  const { detail, summary, totals } = assertPrintInvariant(all, "李四");
  assert.deepEqual(
    detail.map((s) => `${s.owner}:${s.paidAmt}:${s.pendingAmt}:${s.proxyAmt}`),
    ["李四:1000:50:200"],
    "李四一节：已发小计 1000（本人 800 + 王五代领 200）、待发小计 50",
  );
  assert.deepEqual(
    summary.map((r) => `${r.owner}:${r.amount}`),
    ["李四:1000", `${PENDING_LABEL}:50`],
    "汇总里待发单列，不计入李四已发",
  );
  assert.deepEqual(totals, { count: 3, amount: 1050 }, "选单人时 总计 = 已发 1000（含代发 200）+ 待发放 50");
  // 面板（屏幕）/明细/汇总三处的「其中代发」必须同数字
  const panel = panelRows(all).find((r) => r.owner === "李四");
  assert.deepEqual(
    [panel?.proxyCount, detail[0].proxyCount, summary[0].proxyCount],
    [1, 1, 1],
    "面板/明细/汇总三处的「其中代发」笔数一致",
  );
  assert.deepEqual([panel?.proxyAmt, detail[0].proxyAmt, summary[0].proxyAmt], [B, B, B], "三处金额一致");
  assert.equal(panel?.amount, detail[0].paidAmt, "面板人员行金额 == 明细已发小计 == 已发（含代发）");
  assert.equal(panel?.amount, summary[0].amount);
  // 单人时「总计」不能变成全部人的
  assert.notEqual(totals.amount, TOTAL);
  assert.deepEqual(detailSections(all, "不存在"), []);
  assert.deepEqual(printSummary(all, "不存在"), []);
  assert.deepEqual(printTotals(all, "不存在"), { count: 0, amount: 0 });
});

test("发放方下拉：空发放方是一个真实桶（用户报的漏项），逐桶已发之和 == A", () => {
  const buckets = sourceBuckets(ranged);
  assert.deepEqual(buckets.map((b) => b.value), ["五冶", "一局", ""], "非空发放方按 zh 排序 + 末尾一个「未填发放方」桶");
  assert.equal(buckets.at(-1)?.label, "未填发放方");
  // 旧口径：filter(Boolean) 只有 ["五冶","一局"] → 逐桶取不到空发放方的钱
  const oldBuckets = [...new Set(ranged.map((p) => p.source).filter(Boolean))];
  const paidOf = (b: string) => paymentSummary(filterPayments(ranged, { status: "paid", source: b, q: "" })).paidAmt;
  assert.equal(oldBuckets.reduce((s, b) => s + paidOf(b), 0), 1500 + 300, "旧口径：五冶 1500 + 一局 300，空发放方的 1000 取不到");
  assert.equal(buckets.reduce((s, b) => s + paidOf(b.value), 0), A, "新口径：所有桶相加 == 已发合计 A");
});

test("筛选口径一致：发放方 = 未填发放方（空串）时，列表/汇总/面板同时只剩这两笔", () => {
  const rows = filterPayments(ranged, { status: "all", source: "", q: "" });
  assert.equal(rows.length, 2);
  assert.equal(paymentSummary(rows).paidAmt, 1000, "李四本人 800 + 代发 200 都算已发");
  assert.equal(paymentSummary(rows).proxyAmt, 200, "其中代发 200");
  assert.equal(paymentSummary(rows).total, 1000, "待发放属于「五冶」/「一局」，被这一桶筛掉");
  assert.deepEqual(panelRows(rows).map((r) => `${r.owner}:${r.amount}:${r.proxyAmt}`), ["李四:1000:200"]);
});

test("筛选口径一致：状态=待发放时不混进已发；状态=已发时没有待发放", () => {
  assert.equal(pendingOnly.length, 2);
  const sp = paymentSummary(pendingOnly);
  assert.equal(sp.paidAmt, 0);
  assert.equal(sp.proxyAmt, 0);
  assert.equal(sp.total, sp.pendingAmt, "只有待发放时 总计 == C");
  assert.equal(paidOnly.length, 5);
  const sd = paymentSummary(paidOnly);
  assert.equal(sd.pendingCount, 0, "状态=已发时不带待发放");
  assert.equal(sd.total, sd.paidAmt, "不含待发放时 总计 == A（A 已含代发）");
  assert.equal(sd.total, A);
  assert.equal(sd.proxyAmt, B, "代发仍在 A 里面");
});

test("打印-可选实际收款人下拉：含只有待发放的人（明细要能单独打他），不含无关的人", () => {
  const names = printOwnerBuckets(all).map((b) => b.value);
  assert.equal(names.includes("李四"), true);
  assert.equal(names.includes("赵六"), true, "赵六只有待发放，但明细清单要能单独打他的节");
  assert.equal(names.length, 4, "张三/李四/王五/赵六 —— 当前筛选下全部有记录的人");
  const scoped = printOwnerBuckets(filterPayments(ranged, { status: "all", source: "", q: "" }));
  assert.deepEqual(scoped.map((b) => b.value), ["李四"], "空发放方那一桶里只有李四（他的两笔都已发）");
});

test("搜索筛选：命中 owner 或 receiver；结果与汇总同源", () => {
  const rows = filterPayments(ranged, { status: "all", source: ALL_BUCKETS, q: "王五" });
  assert.deepEqual(rows.map((r) => r.id).sort(), ["p4", "p5"]);
  const s = paymentSummary(rows);
  assert.equal(s.paidAmt, 500, "王五本人 300 + 李四名下王五代领的 200，都算已发");
  assert.equal(s.proxyAmt, 200, "其中 p4 是王五代领李四的");
  assert.equal(s.paidAmt - s.proxyAmt, 300, "去掉代发才是王五本人收到的");
});

test("跨年：2026 区间只含 2026 的已发 + 全部待发放；2025 那笔不进 2026", () => {
  assert.equal(all.some((p) => p.id === "p7"), false, "2025-12-31 在 2026 区间外");
  assert.equal(all.some((p) => p.id === "p6"), true, "待发放没有日期，一直留在列表里");
  const y25 = paymentsInRange(FIXTURE, ymKey(2025, 1), ymKey(2025, 12));
  assert.deepEqual(y25.map((p) => p.id), ["p6", "p7", "p8"], "两笔待发放一直留着 + 2025 那笔在区间内，顺序按原数组");
});

test("金额 0 的已发照常计数与入账（不被过滤掉）", () => {
  const zero = pay({ id: "z1", owner: "孙八", receiver: "孙八", date: "2026-02-01", amount: 0, source: "五冶" });
  const withZero = filterPayments(paymentsInRange([...paidOnly, zero], LO, HI), { status: "paid", source: ALL_BUCKETS, q: "" });
  assert.equal(paymentSummary(withZero).count, 6);
  assert.equal(paymentSummary(withZero).paidAmt, A, "0 元不改变金额");
  assert.equal(panelRows(withZero).some((r) => r.owner === "孙八" && r.count === 1), true);
});

test("两种清单的口径小字分别写清差别（明细含待发并逐笔标注；汇总待发单列）", () => {
  assert.match(PRINT_CALIBER_NOTE_DETAIL, /待发放也列入实际收款人名下/);
  assert.match(PRINT_CALIBER_NOTE_DETAIL, /已发 \/ 待发/);
  assert.match(PRINT_CALIBER_NOTE_DETAIL, /已发小计 \/ 待发小计/);
  assert.match(PRINT_CALIBER_NOTE_DETAIL, /代发（收款人非本人）已计入实际收款人名下/);
  assert.match(PRINT_CALIBER_NOTE_SUMMARY, /待发放单列一组，不计入已发/);
  assert.match(PRINT_CALIBER_NOTE_SUMMARY, /含代发/);
  assert.equal(printCaliberNote("detail"), PRINT_CALIBER_NOTE_DETAIL);
  assert.equal(printCaliberNote("summary"), PRINT_CALIBER_NOTE_SUMMARY);
  assert.notEqual(PRINT_CALIBER_NOTE_DETAIL, PRINT_CALIBER_NOTE_SUMMARY);
  assert.equal(PROXY_INLINE_LABEL, "其中代发", "「其中代发」的固定前缀只有一处");
});
