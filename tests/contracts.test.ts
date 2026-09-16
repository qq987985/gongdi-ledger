import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contractEntryChanges,
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

/* ── 1.8.8 D1：合同三类明细的「改」入口 ── */

test("D1 contractEntryChanges：逐项列出改动，格式与合同编辑一致", () => {
  const before = entry({ id: "e1", contractId: "c1", kind: "report", date: "2026-03-31", amount: 180000, no: "2026-03", remark: "3月报量" });
  const after = entry({ ...before, amount: 200000, no: "2026-04" });
  assert.deepEqual(contractEntryChanges(before, after), ["金额：180000 → 200000", "单号：2026-03 → 2026-04"]);
});

test("D1 contractEntryChanges：收款去向用中文标签，空值显示（空）", () => {
  const before = entry({ id: "e2", contractId: "c1", kind: "receipt", date: "2026-04-15", amount: 80000, payTo: "sub" });
  const after = normalizeEntry({ ...before, payTo: "worker", remark: "改代付" });
  assert.deepEqual(contractEntryChanges(before, after), ["收款去向：到分包 → 代付农民工", "备注：（空） → 改代付"]);
});

test("D1 contractEntryChanges：没有改动返回空数组（界面提示「没有改动」而不是空 confirm）", () => {
  const e = entry({ id: "e3", contractId: "c1", kind: "invoice", date: "2026-04-12", amount: 200000, amountExcl: 183486.24, taxRate: 9, no: "1100000001" });
  assert.deepEqual(contractEntryChanges(e, { ...e }), []);
});

test("D1 编辑不改变金额/不含税/税率口径：normalizeEntry(改后) 与原口径一致", () => {
  const original = entry({ id: "e4", contractId: "c1", kind: "invoice", date: "2026-04-12", amount: 218000, amountExcl: 200000, taxRate: 9, no: "1" });
  // 只改备注（编辑表单里金额字段原样带出来）→ 三口径一个不动
  const edited = normalizeEntry({ ...original, remark: "补备注" });
  assert.equal(edited.amount, 218000);
  assert.equal(edited.amountExcl, 200000, "不含税不因编辑被重算");
  assert.equal(edited.taxRate, 9);
  assert.equal(edited.id, "e4", "编辑必须保留原 id（影像文件挂在这条上）");
  assert.equal(edited.kind, "invoice");
});

test("D1 三类明细都有「改」入口（源码守卫：三个 Book 都把 onUpdate 传给了 EntryRows）", async () => {
  const fs = await import("node:fs/promises");
  const { dirname, join, resolve } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const src = await fs.readFile(join(root, "src/components/contract-editor.tsx"), "utf8");
  assert.equal((src.match(/onEdit=\{disabled \? undefined : startEdit\}/g) || []).length, 3, "报量/开票/收款三个明细列表都要有「改」入口");
  assert.equal((src.match(/aria-label="编辑"/g) || []).length, 1, "编辑按钮的唯一实现（EntryRows）");
  assert.match(src, /askEntryEdit\("报量"/);
  assert.match(src, /askEntryEdit\("发票"/);
  assert.match(src, /askEntryEdit\("收款"/);
  // 编辑必须走与新增同一个 normalizeEntry，且要落操作记录（store 的 updateContractEntry）
  assert.match(src, /onUpdate\(normalizeEntry\(/);
  const store = await fs.readFile(join(root, "src/lib/store.ts"), "utf8");
  assert.match(store, /updateContractEntry: \(row\) => \{[\s\S]{0,400}?normalizeEntry\(row\)/, "updateContractEntry 必须与新增同口径");
  assert.match(store, /修改合同明细/, "编辑明细要落操作记录");
});
