/**
 * 合同「逐行 × 合计」口径测试（口径一致性专项 20260916）。
 *
 * 页面上是逐行 `contractRollup`、表尾是 `sumContractRollups`、总览 KPI 是 `contractPayable`：
 * 三者必须同源。边界：含税/不含税混用、合同金额 0、没有明细、只有管理表（无明细）、
 * 代付与到分包分列、跨年筛选。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { contractRollup, normalizeEntry, type ContractEntry } from "../src/lib/contracts";
import { contractPayable, sumContractRollups, type ContractLike } from "../src/lib/contracts-totals";

function entry(over: Partial<ContractEntry> & { contractId: string; kind: ContractEntry["kind"] }): ContractEntry {
  return normalizeEntry(over);
}
function contract(over: Partial<ContractLike> & { id: string }): ContractLike {
  return { contractAmount: 0, taxRate: 9, reportTaxMode: "excl", payRatio: 80, ...over };
}

const C1 = contract({ id: "c1", contractAmount: 200000, taxRate: 9, reportTaxMode: "excl" });
const C2 = contract({ id: "c2", contractAmount: 0, taxRate: 9, reportTaxMode: "incl" }); // 合同金额 0
const C3 = contract({ id: "c3", contractAmount: 50000, taxRate: 0, reportTaxMode: "excl" }); // 没有明细

const ENTRIES: ContractEntry[] = [
  entry({ contractId: "c1", kind: "report", amount: 180000 }),
  entry({ contractId: "c1", kind: "invoice", amount: 200000, amountExcl: 183486.24, taxRate: 9 }),
  entry({ contractId: "c1", kind: "receipt", amount: 70000, payTo: "worker" }),
  entry({ contractId: "c1", kind: "receipt", amount: 80000, payTo: "sub" }),
  entry({ contractId: "c2", kind: "report", amount: 109000 }), // 含税录入
  entry({ contractId: "c2", kind: "receipt", amount: 0, payTo: "sub" }), // 金额 0
];

test("表尾合计 == 逐行之和（页面每列都能对上）", () => {
  const totals = sumContractRollups([C1, C2, C3], ENTRIES);
  const perRow = [C1, C2, C3].map((c) => contractRollup(c, ENTRIES));
  const sum = (pick: (r: ReturnType<typeof contractRollup>) => number) => perRow.reduce((s, r) => s + pick(r), 0);
  assert.equal(totals.amount, 250000, "合同金额 200000 + 0 + 50000");
  assert.equal(totals.report, sum((r) => r.report));
  assert.equal(totals.reportIncl, sum((r) => r.reportIncl));
  assert.equal(totals.reportExcl, sum((r) => r.reportExcl));
  assert.equal(totals.invoice, sum((r) => r.invoice));
  assert.equal(totals.invoiceExcl, sum((r) => r.invoiceExcl));
  assert.equal(totals.receipt, sum((r) => r.receipt));
  assert.equal(totals.workerPay, sum((r) => r.workerPay));
  assert.equal(totals.subPay, sum((r) => r.subPay));
  assert.equal(totals.payable, sum((r) => r.payable));
  assert.equal(totals.remain, sum((r) => r.remain));
  assert.equal(totals.dueRemain, sum((r) => r.dueRemain));
});

test("含税/不含税混用：表格里逐行显示的那一列相加 == 表尾列的合计", () => {
  const list = [C1, C2, C3];
  const rolls = list.map((c) => contractRollup(c, ENTRIES));
  // 表格「报量金额」列：含税合同显示 reportIncl、不含税合同显示 reportExcl
  const visible = rolls.reduce((s, r, i) => s + (list[i].reportTaxMode === "incl" ? r.reportIncl : r.reportExcl), 0);
  const totals = sumContractRollups(list, ENTRIES);
  assert.equal(visible, 180000 + 109000, "c1 不含税 180000 + c2 含税 109000（录入值原样）");
  assert.equal(totals.report, visible, "表尾「报量金额」= 逐行可见列之和（不会混口径相加出错）");
  assert.equal(totals.reportIncl, 196200 + 109000, "含税口径合计：c1 含税 196200 + c2 含税 109000");
  assert.equal(totals.reportExcl, 180000 + 100000, "不含税口径合计：c1 180000 + c2 109000÷1.09=100000");
  // 应收用「含税报量 × 付款比例」
  assert.equal(totals.payable, 196200 * 0.8 + 109000 * 0.8 + 0, "c3 无明细 → 0");
});

test("已付 = 代付农民工 + 到分包（分列保留）；剩余款 = 开票 − 已付", () => {
  const t = sumContractRollups([C1], ENTRIES);
  assert.equal(t.workerPay, 70000);
  assert.equal(t.subPay, 80000);
  assert.equal(t.receipt, 150000);
  assert.equal(t.invoice, 200000);
  assert.equal(t.remain, 50000);
  assert.equal(t.dueRemain, 196200 * 0.8 - 150000);
});

test("只有管理表（没有任何明细）时合计为 0，不报错、不丢行", () => {
  const t = sumContractRollups([C3], []);
  assert.equal(t.amount, 50000);
  assert.equal(t.report, 0);
  assert.equal(t.payable, 0);
  assert.equal(t.receipt, 0);
  assert.deepEqual(sumContractRollups([], ENTRIES), {
    amount: 0,
    report: 0,
    reportIncl: 0,
    reportExcl: 0,
    invoice: 0,
    invoiceExcl: 0,
    receipt: 0,
    workerPay: 0,
    subPay: 0,
    remain: 0,
    payable: 0,
    dueRemain: 0,
  });
});

test("总览 KPI 应收 == 同年合同页「应收」合计（同一算法，跨年只算本年的合同）", () => {
  const yearOf = new Map([
    ["c1", 2026],
    ["c2", 2026],
    ["c3", 2025],
  ]);
  const list = [C1, C2, C3];
  const kpi = contractPayable(
    list.filter((c) => yearOf.get(c.id) === 2026),
    ENTRIES,
  );
  const pageTotals = sumContractRollups(
    list.filter((c) => yearOf.get(c.id) === 2026),
    ENTRIES,
  );
  assert.equal(kpi, pageTotals.payable, "KPI 与页面表尾同一个数");
  assert.equal(kpi, 196200 * 0.8 + 109000 * 0.8, "2025 的 c3 不进 2026");
});
