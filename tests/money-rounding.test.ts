/**
 * 金额取整（专家评审 B-1）与「金额入库统一取整」（专家评审 A-2）回归测试。
 *
 * B-1：`round2` 的旧实现 `Math.round((n + Number.EPSILON) * 100) / 100` 只在 `0 ≤ n < 2`
 * 生效、负数方向反，实测：
 *   round2(1.005) = 1.01   round2(8.075) = 8.07（应 8.08）   round2(-1.005) = -1（应 -1.01）
 *   同一套「半分进位」规则在同一模块里给出三种结果 —— 对账场景里「差一分」就是可信度问题。
 * 这里把边界锁死：正负对称、量大额、0、多位小数、非有限数。
 *
 * A-2：发放（表单 / Excel 导入）与合同明细入库不取整时，印在界面与打印件上的
 * 「已发 ¥A + 待发放 ¥C = ¥总计」会差 0.01（实测 0.005 + 0.005）。这里断言
 * ①入库端取整；②取整后这条等式恒成立、明细各节之和 == 表尾总计。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { round2 } from "../src/lib/wage";
import {
  detailSections,
  paymentSummary,
  printTotals,
  sectionTotals,
} from "../src/lib/payments-stats";
import { rowToPayment } from "../src/lib/excel/payments";
import { normalizeEntry } from "../src/lib/contracts";
import type { Payment } from "../src/lib/types";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

function pay(over: Partial<Payment>): Payment {
  return { id: "p", owner: "", receiver: "", date: "", amount: 0, source: "", remark: "", ...over };
}

/* ─────────── B-1 round2 边界 ─────────── */

test("B-1 round2：原有的 4 个样例必须保持（1.005 / 2.675 / 0.1+0.2 / 1234.5678）", () => {
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(2.675), 2.68);
  assert.equal(round2(0.1 + 0.2), 0.3);
  assert.equal(round2(1234.5678), 1234.57);
});

test("B-1 round2：半分一律「按十进制直觉」进位，与量级无关（旧实现在这 4 个上给错）", () => {
  assert.equal(round2(8.075), 8.08, "旧实现给 8.07（EPSILON 对 ≥2 的值是恒等操作）");
  assert.equal(round2(1.335), 1.34);
  assert.equal(round2(10.235), 10.24);
  assert.equal(round2(450.995), 451, "大额同样要进位（旧实现靠二进制碰运气）");
  assert.equal(round2(1234567.005), 1234567.01, "旧实现给 1234567（整元，少一分）");
  assert.equal(round2(1005000000.005), 1005000000.01);
});

test("B-1 round2：负数与正数**完全对称**（旧实现负数永远向零退）", () => {
  assert.equal(round2(-1.005), -1.01, "旧实现给 -1");
  assert.equal(round2(-2.675), -2.68, "旧实现给 -2.67");
  assert.equal(round2(-8.075), -8.08);
  assert.equal(round2(-0.005), -0.01);
  assert.equal(round2(-1234567.005), -1234567.01);
  for (const n of [0.005, 1.005, 2.675, 8.075, 450.995]) {
    assert.equal(round2(-n), -round2(n), `round2(-${n}) 必须等于 -round2(${n})`);
  }
});

test("B-1 round2：0 / 近零 / 非有限数不产生脏值（不许 -0、不许 NaN）", () => {
  assert.equal(round2(0), 0);
  assert.equal(Object.is(round2(-0), -0), false, "负零要归一成 0（展示为 -0.00 会被当成异常）");
  assert.equal(Object.is(round2(-0.001), -0), false, "负的不足一分也要回 0，不许 -0");
  assert.equal(round2(-0.001), 0);
  assert.equal(round2(0.004), 0);
  assert.equal(round2(0.004999), 0, "不足半分退位（容差只有 1e-6 分）");
  assert.equal(round2(0.005), 0.01);
  assert.equal(round2(NaN), 0);
  assert.equal(round2(Infinity), 0);
  assert.equal(round2(-Infinity), 0);
});

test("B-1 round2：已是分的值原样返回（幂等，重复取整不变）", () => {
  for (const n of [0, 0.01, 8.07, 8.08, -8.08, 1234.56, 1000000.01, -0.01]) {
    assert.equal(round2(round2(n)), round2(n), `round2(${n}) 不幂等`);
  }
  assert.equal(round2(1234.5678), 1234.57, "再取一次仍是 1234.57");
  assert.equal(round2(round2(1234.5678)), 1234.57);
});

test("B-1 round2 仍是全库唯一实现，且实现里不许再用 Number.EPSILON（旧写法）", async () => {
  const wage = await readFile(repo("src/lib/wage.ts"), "utf8");
  assert.equal((wage.match(/export function round2/g) || []).length, 1, "round2 只能定义一次");
  const body = wage.slice(wage.indexOf("export function round2"));
  const fn = body.slice(0, body.indexOf("\n}"));
  assert.equal(/Number\.EPSILON/.test(fn), false, "带 EPSILON 的旧写法不许回来（注释里的说明不算）");
  assert.match(fn, /Math\.abs\(n\)/, "要按绝对值放大到分（否则负数向零退）");
});

/* ─────────── A-2 金额入库取整 ─────────── */

test("A-2 发放表单入库取整：payments.tsx 的 amount 必须过 round2", async () => {
  const page = await readFile(repo("src/routes/payments.tsx"), "utf8");
  assert.match(
    page,
    /amount: round2\(Number\(c\.amount\) \|\| 0\)/,
    "发放表单保存要取整（否则 0.005 会让「已发 + 待发 = 总计」差一分）",
  );
  assert.match(page, /import \{ round2 \} from "~\/lib\/wage"/, "取整走 wage.ts 的唯一实现");
});

test("A-2 Excel 导入发放取整：单元格是公式结果（1234.567 / 0.005）也落到分", () => {
  const r = rowToPayment({
    实际收款人: "张三",
    发放日期: "2026-03-10",
    "发放金额(元)": "0.005",
  });
  assert.equal(r?.amount, 0.01, "0.005 → 0.01");
  const r2 = rowToPayment({ 实际收款人: "李四", 发放日期: "2026-03-11", "发放金额(元)": "1234.567" });
  assert.equal(r2?.amount, 1234.57);
});

test("A-2 合同明细入库取整：normalizeEntry 是唯一入口（表单 + Excel 两条路径都经它）", () => {
  const e = normalizeEntry({ kind: "report", contractId: "c1", amount: 0.005 });
  assert.equal(e.amount, 0.01, "合同报量 0.005 → 0.01");
  const e2 = normalizeEntry({ kind: "invoice", contractId: "c1", amount: "1234.5678" as unknown as number, taxRate: 0 });
  assert.equal(e2.amount, 1234.57);
  // 不含税派生值本来就取整，别被本次改动改回未取整
  const e3 = normalizeEntry({ kind: "invoice", contractId: "c1", amount: 109, taxRate: 9 });
  assert.equal(e3.amountExcl, 100);
});

test("A-2 取整后「已发 + 待发 = 总计」与「明细各节之和 = 表尾」恒成立（旧行为差 0.01）", () => {
  // 亚分输入（表单直填 / Excel 公式结果）经入库取整后是干净的分数
  const rows: Payment[] = [
    pay({ id: "p1", owner: "甲", receiver: "甲", date: "2026-01-05", amount: round2(0.005) }),
    pay({ id: "p2", owner: "乙", receiver: "乙", date: "", amount: round2(0.005) }),
  ];
  const s = paymentSummary(rows);
  assert.equal(s.paidAmt, 0.01);
  assert.equal(s.pendingAmt, 0.01);
  assert.equal(s.total, 0.02);
  assert.equal(round2(s.paidAmt + s.pendingAmt), s.total, "印在界面/打印件上的等式必须逐分相等");
  // 明细清单：各节小计之和 == 表尾总计（旧行为 0.02 ≠ 0.01）
  const sections = detailSections(rows, "__all__");
  assert.deepEqual(sectionTotals(sections), printTotals(rows), "明细各节之和必须等于表尾总计");
  assert.deepEqual(sectionTotals(sections), { count: 2, amount: 0.02 });
  // 未取整的裸输入仍然会差一分 —— 这就是必须在入库端取整的原因（坏样本自检）
  const raw = rows.map((r) => ({ ...r, amount: 0.005 }));
  const rs = paymentSummary(raw);
  assert.equal(round2(rs.paidAmt + rs.pendingAmt) !== rs.total, true, "未取整时等式确实不成立");
});
