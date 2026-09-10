import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contractRollup,
  normalizeContractStatus,
  normalizeEntry,
  splitLegacyReceipts,
  splitTax,
  type ContractEntry,
} from "../src/lib/contracts";

function entry(over: Partial<ContractEntry> & { contractId: string; kind: ContractEntry["kind"] }): ContractEntry {
  return normalizeEntry(over);
}

test("splitTax：不含税录入 → 含税 = 不含税 × (1+税率)", () => {
  const t = splitTax(180000, 9, "excl");
  assert.equal(t.excl, 180000);
  assert.equal(t.incl, 196200);
});

test("splitTax：含税录入 → 不含税 = 含税 ÷ (1+税率)", () => {
  const t = splitTax(196200, 9, "incl");
  assert.equal(t.incl, 196200);
  assert.equal(t.excl, 180000);
});

test("splitTax：税率为 0 时含税与不含税相同", () => {
  const t = splitTax(1000, 0, "excl");
  assert.equal(t.incl, 1000);
  assert.equal(t.excl, 1000);
});

test("normalizeEntry：开票未填不含税时按税率反算", () => {
  const e = normalizeEntry({ contractId: "c1", kind: "invoice", amount: 200000, taxRate: 9 });
  assert.equal(e.amount, 200000);
  assert.equal(e.amountExcl, 183486.24);
});

test("normalizeEntry：代付/去向只对收款生效", () => {
  assert.equal(normalizeEntry({ contractId: "c1", kind: "report", amount: 1, payTo: "worker" }).payTo, "");
  assert.equal(normalizeEntry({ contractId: "c1", kind: "receipt", amount: 1 }).payTo, "sub");
  assert.equal(normalizeEntry({ contractId: "c1", kind: "receipt", amount: 1, payTo: "worker" }).payTo, "worker");
});

test("contractRollup：报量含税换算、应收、已付、合同未付、剩余款", () => {
  const c = { id: "c1", taxRate: 9, reportTaxMode: "excl", payRatio: 80 };
  const entries: ContractEntry[] = [
    entry({ contractId: "c1", kind: "report", amount: 180000 }),
    entry({ contractId: "c1", kind: "invoice", amount: 200000, amountExcl: 183486.24, taxRate: 9 }),
    entry({ contractId: "c1", kind: "receipt", amount: 70000, payTo: "worker" }),
    entry({ contractId: "c1", kind: "receipt", amount: 80000, payTo: "sub" }),
  ];
  const r = contractRollup(c, entries);
  assert.equal(r.report, 180000);
  assert.equal(r.reportIncl, 196200);
  assert.equal(r.reportExcl, 180000);
  assert.equal(r.payable, 156960, "应收 = 含税报量 × 付款比例");
  assert.equal(r.invoice, 200000);
  assert.equal(r.workerPay, 70000);
  assert.equal(r.subPay, 80000);
  assert.equal(r.receipt, 150000);
  assert.equal(r.remain, 50000, "剩余款 = 开票 − 已付");
  assert.equal(r.dueRemain, 6960, "合同未付 = 应收 − 已付");
});

test("contractRollup：只统计本合同的明细", () => {
  const r = contractRollup({ id: "c1", taxRate: 9, reportTaxMode: "excl", payRatio: 80 }, [
    entry({ contractId: "c1", kind: "report", amount: 100 }),
    entry({ contractId: "c2", kind: "report", amount: 999 }),
  ]);
  assert.equal(r.report, 100);
});

test("splitLegacyReceipts：一笔收款含代付时拆成到分包 + 代付农民工两笔", () => {
  const out = splitLegacyReceipts([
    { contractId: "c1", kind: "receipt", amount: 150000, workerPay: 70000, payTo: "" as const, workerPayDate: "2026-04-20" },
  ]);
  assert.equal(out.length, 2);
  const sub = out.find((e) => e.payTo === "sub");
  const worker = out.find((e) => e.payTo === "worker");
  assert.equal(sub?.amount, 80000);
  assert.equal(worker?.amount, 70000);
  assert.equal(worker?.date, "2026-04-20");
});

test("normalizeContractStatus：中文状态归一", () => {
  assert.equal(normalizeContractStatus("审计"), "终审");
  assert.equal(normalizeContractStatus("退质保"), "退质保金");
  assert.equal(normalizeContractStatus("结算已开票"), "结算已开票");
  assert.equal(normalizeContractStatus("看不懂的状态"), "在建");
});
