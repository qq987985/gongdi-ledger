/**
 * src/lib/num.ts（外部输入数值的容错解析）与它替换掉的两类老写法：
 *
 * 1. `Number(x) || 0`：`Number("1,200")` 是 NaN → 「1,200」被静默写成 0（钱最怕这个）；
 * 2. `catch {}` / 静默兜底：读不出来不留痕。
 *
 * 这里既测解析本身，也测「换了实现之后外部输入这条路真的变了、且只在这个方向上变」。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { numOr, numOrWarn, parseNum, parseNumber } from "../src/lib/num";
// Excel barrel 仍导出 parseNumber（1.7.13 起的导入路径不许变）
import { parseAttendanceSheet, parseContractWorkbook, parseNumber as parseNumberViaExcel } from "../src/lib/excel";
import { normalizeEntry, splitLegacyReceipts } from "../src/lib/contracts";
import type { ContractEntry } from "../src/lib/contracts";

/**
 * 表单 / Excel 传到这些函数的值：类型上写着 number，运行时是用户填的字符串。
 * 这里如实模拟这种「外部输入」，而不是把类型改松。
 */
const rawField = (v: unknown) => v as number;

test("parseNum：number 直通；NaN/Infinity 读不出来", () => {
  assert.equal(parseNum(0), 0);
  assert.equal(parseNum(1234.56), 1234.56);
  assert.equal(parseNum(-7), -7);
  assert.equal(Object.is(parseNum(-0), 0), true, "-0 归一化成 0");
  assert.equal(parseNum(NaN), null);
  assert.equal(parseNum(Infinity), null);
  assert.equal(parseNum(-Infinity), null);
});

test("parseNum：空值读不出来（null 而不是 0 —— 这就是「读不出来」可知的地方）", () => {
  for (const v of [null, undefined, "", "   ", "\t\n"]) assert.equal(parseNum(v), null, String(v));
  assert.equal(parseNum("abc"), null);
  assert.equal(parseNum("12.3.4"), null);
  assert.equal(parseNum("-"), null);
  // 注意：`false`/`true` 不是数字（老写法 `Number(true) || 0` 会给 1，这里给 null）
  assert.equal(parseNum(true), null);
});

test("parseNum：千分位逗号、货币符号、首尾空格", () => {
  assert.equal(parseNum("1,200"), 1200);
  assert.equal(parseNum(" 1,234,567.89 "), 1234567.89);
  assert.equal(parseNum("¥1,200.50"), 1200.5);
  assert.equal(parseNum("￥300"), 300);
  assert.equal(parseNum("$1,000"), 1000);
  assert.equal(parseNum("¥ 1,200 元"), 1200);
});

test("parseNum：全角数字/逗号/括号、括号负数、单位后缀", () => {
  assert.equal(parseNum("１２３４"), 1234, "全角数字");
  assert.equal(parseNum("１，２００"), 1200, "全角数字 + 全角逗号");
  assert.equal(parseNum("(1,200)"), -1200, "会计括号负数");
  assert.equal(parseNum("（300）"), -300, "全角括号负数");
  assert.equal(parseNum("12元"), 12);
  assert.equal(parseNum("12天"), 12);
  assert.equal(parseNum("3个"), 3);
  assert.equal(parseNum("2次"), 2);
  assert.equal(parseNum("5人"), 5);
  assert.equal(parseNum("6月"), 6);
  assert.equal(parseNum("2026年"), 2026);
  assert.equal(parseNum("9%"), 9);
  assert.equal(parseNum("9％"), 9, "全角百分号");
  // 「(0)」不能产出 -0（-0 会被 Object.is/序列化当成另一个值）
  assert.equal(Object.is(parseNum("(0)"), 0), true);
  assert.equal(Object.is(parseNum("-0"), 0), true);
});

test("numOr：读不出来才用兜底值；读出来的 0 保留", () => {
  assert.equal(numOr("1,200"), 1200);
  assert.equal(numOr("abc"), 0);
  assert.equal(numOr("abc", -1), -1);
  assert.equal(numOr("", 42), 42);
  assert.equal(numOr("0", 42), 0, "0 是读出来了的，不能被兜底顶掉");
  assert.equal(numOr(null, 7), 7);
});

test("numOrWarn：填了东西却读不出数要留痕；空值不打扰", () => {
  const warns: unknown[][] = [];
  const orig = console.warn;
  console.warn = (...a: unknown[]) => void warns.push(a);
  try {
    assert.equal(numOrWarn("1,200", 0, "报销.金额"), 1200);
    assert.equal(numOrWarn("", 0, "报销.金额"), 0);
    assert.equal(numOrWarn(null, 0, "报销.金额"), 0);
    assert.equal(numOrWarn(undefined, 0, "报销.金额"), 0);
    assert.equal(numOrWarn("   ", 0, "报销.金额"), 0);
    assert.equal(warns.length, 0, "正常值/空值不该产生 warn");
    assert.equal(numOrWarn("一万二", -1, "报销.金额"), -1);
    assert.equal(warns.length, 1, "乱字符串必须留一条痕");
    assert.match(String(warns[0][0]), /报销\.金额/);
  } finally {
    console.warn = orig;
  }
});

test("parseNumber（旧名字）：行为与 1.7.13 一致，读不出来返回 0", () => {
  for (const v of [null, undefined, "", "abc", NaN, Infinity, true]) assert.equal(parseNumber(v), 0, String(v));
  assert.equal(parseNumber(0), 0);
  assert.equal(parseNumber("1,200"), 1200);
  assert.equal(parseNumber("(300)"), -300);
  assert.equal(parseNumber("12天"), 12);
  assert.equal(parseNumber("１２"), 12);
  // 换了实现、但导入路径 `~/lib/excel` 的 parseNumber 还是同一个函数
  assert.equal(parseNumberViaExcel, parseNumber);
});

test("normalizeEntry：字符串金额走容错解析（老写法会把「1,200」静默写成 0）", () => {
  const warns: unknown[][] = [];
  const orig = console.warn;
  console.warn = (...a: unknown[]) => void warns.push(a);
  let e: ContractEntry;
  try {
    e = normalizeEntry({ kind: "report", contractId: "c1", amount: rawField("1,200"), taxRate: rawField("9%") });
  } finally {
    console.warn = orig;
  }
  assert.equal(e.amount, 1200, "「1,200」不能再变 0");
  assert.equal(e.taxRate, 9);
  assert.equal(warns.length, 0, "能读出来的值不留痕");

  console.warn = () => {};
  let bad: ContractEntry;
  try {
    bad = normalizeEntry({ kind: "report", contractId: "c1", amount: rawField("待定") });
  } finally {
    console.warn = orig;
  }
  assert.equal(bad.amount, 0, "读不出来仍然按 0（行为不变）");
});

test("normalizeEntry：开票明细税额仍按 含税/(1+税率) 折算（行为不变）", () => {
  const inv = normalizeEntry({ kind: "invoice", contractId: "c1", amount: 218, taxRate: 9 });
  assert.equal(inv.amountExcl, 200);
});

test("splitLegacyReceipts：括号负数/货币符号的代付金额能拆对（老写法会算错）", () => {
  const out = splitLegacyReceipts([
    { kind: "receipt", contractId: "c1", amount: rawField("¥1,200"), workerPay: rawField("200") },
  ]);
  assert.equal(out.length, 2, "代付 + 到分包 拆两笔");
  assert.equal(out[0].payTo, "sub");
  assert.equal(out[0].amount, 1000);
  assert.equal(out[1].payTo, "worker");
  assert.equal(out[1].amount, 200);
});

test("store：报销表单里的「1,200 / ¥2.5」不再被当成 0（行为变化点）", async () => {
  // 只测 store 动作本身：把审计 POST 的 fetch 换掉，避免测试输出噪音
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({ ok: true, text: async () => "" })) as unknown as typeof fetch;
  try {
    const { useApp } = await import("../src/lib/store");
    useApp.getState().upsertExpense({
      name: "测试报销",
      qty: rawField("1,200"),
      price: rawField("¥2.5"),
      amount: rawField("3,000"),
    });
    const e = useApp.getState().expenses.at(-1)!;
    assert.equal(e.qty, 1200);
    assert.equal(e.price, 2.5);
    assert.equal(e.amount, 3000);

    useApp.getState().saveAttendanceMonth(2026, 5, [
      { name: "张三", days: 26, otHours: 0, allowance: rawField("1,200"), deduction: rawField("(50)") },
    ]);
    const a = useApp.getState().attendance.find((r) => r.year === 2026 && r.month === 5)!;
    assert.equal(a.allowance, 1200);
    assert.equal(a.deduction, -50, "括号负数");
  } finally {
    globalThis.fetch = origFetch;
  }
});

/** 用最小工作簿走真实导入解析（不造 mock，避免「测试通过但真文件读不出来」） */
function workbookBuf(aoa: unknown[][], sheetName: string): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetName);
  return XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

test("Excel 导入：保证金列直接填「1,200」也算有保证金（老写法 Number(\"1,200\")>0 是 false）", () => {
  const buf = workbookBuf(
    [
      ["项目名称", "年份", "保证金"],
      ["示例住宅A区", 2026, "1,200"],
    ],
    "合同管理表",
  );
  const { contracts } = parseContractWorkbook(buf);
  assert.equal(contracts.length, 1);
  assert.equal(contracts[0].hasDeposit, true);
  assert.equal(contracts[0].depositAmount, 1200, "保证金列填了金额时也当金额读");
});

test("Excel 导入：考勤「月份」列填「3月」不再落成 0（sheet 名里没有月份时）", () => {
  const buf = workbookBuf(
    [
      ["姓名", "月份", "出勤天数"],
      ["张三", "3月", 26],
    ],
    "2026年考勤",
  );
  const rows = parseAttendanceSheet(buf, 2026);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].month, 3);
  assert.equal(rows[0].days, 26);
});

