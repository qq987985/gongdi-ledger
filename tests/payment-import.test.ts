import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { buildPaymentWorkbook, mergePayments, parsePaymentSheet, inspectPaymentSheet, buildFullWorkbook, parseFullAttendanceWorkbook } from "../src/lib/excel";
import { planPaymentImport } from "../src/lib/payment-import";
import type { Payment } from "../src/lib/types";

const pay = (id: string, amount = 100): Payment => ({ id, owner: "测试甲", receiver: "测试甲", date: "2026-11-01", amount, source: "测试工程", remark: "" });
function editedExport(rows: Payment[], edits: Record<string, unknown> = {}): Payment[] {
  const wb = buildPaymentWorkbook(rows);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  for (const [header, value] of Object.entries(edits)) {
    const column = aoa[1].indexOf(header);
    assert.ok(column >= 0, header);
    aoa[2][column] = value;
  }
  wb.Sheets[wb.SheetNames[0]] = XLSX.utils.aoa_to_sheet(aoa);
  return parsePaymentSheet(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
}

test("发放导出带稳定记录编号，修正金额和日期后仍对应原记录", () => {
  const [row] = editedExport([pay("pay-origin")], { "发放金额(元)": 120, "发放日期": "2026-11-02" });
  assert.equal(row.id, "pay-origin");
  assert.equal(row.amount, 120);
  assert.equal(row.date, "2026-11-02");
});

test("增加模式不能把同编号的修正记录追加成第二笔", () => {
  const current = [pay("pay-origin")];
  const incoming = [{ ...pay("pay-origin", 120), date: "2026-11-02" }];
  const result = mergePayments(current, incoming);
  assert.equal(result.added, 0);
  assert.equal(result.skipped, 1);
  assert.deepEqual(result.merged, current);
});

test("本次替换：仅更正导出行的金额日期及收款人，跨年和待发记录保留，重复执行幂等", () => {
  const current = [pay("old-year", 200), pay("target"), { ...pay("pending", 300), date: "" }];
  current[0].date = "2025-01-01";
  const before = structuredClone(current);
  const rows = editedExport([current[1]], { "发放金额(元)": 120.12, "发放日期": "2026-11-02", "收款人": "测试乙", "备注": "更正" });
  const plan = planPaymentImport(current, rows, "update");
  assert.deepEqual([plan.updated, plan.added, plan.preserved, plan.removed, plan.errors.length, plan.unresolved.length], [1, 0, 2, 0, 0, 0]);
  assert.deepEqual(plan.rows, [current[0], { ...rows[0], id: "target" }, current[2]]);
  assert.deepEqual(current, before, "不得修改输入数组或记录");
  assert.deepEqual(planPaymentImport(plan.rows, rows, "update").rows, plan.rows);
});

test("旧文件即使姓名日期金额相同也不猜对应关系，手工匹配保留原编号", () => {
  const current = [pay("same-a"), pay("same-b")];
  const rows = [pay("parsed-generated-id", 120)];
  const blocked = planPaymentImport(current, rows, "update");
  assert.deepEqual(blocked.unresolved, [0]);
  assert.equal(blocked.rows, current);
  const plan = planPaymentImport(current, rows, "update", { 0: { kind: "replace", id: "same-b" } });
  assert.deepEqual(plan.rows.map((p) => [p.id, p.amount]), [["same-a", 100], ["same-b", 120]]);
});

test("本次替换可同时更正、新增及跳过，任何未决行都不产生部分写入", () => {
  const current = [pay("a"), pay("keep")];
  const incoming = [pay("a", 110), pay("new", 200), pay("skip", 300)];
  const blocked = planPaymentImport(current, incoming, "update", { 1: { kind: "add" } });
  assert.deepEqual(blocked.unresolved, [2]);
  assert.equal(blocked.rows, current);
  const plan = planPaymentImport(current, incoming, "update", { 1: { kind: "add" }, 2: { kind: "skip" } });
  assert.deepEqual([plan.updated, plan.added, plan.skipped, plan.preserved], [1, 1, 1, 1]);
  assert.deepEqual(plan.rows.map((p) => [p.id, p.amount]), [["a", 110], ["keep", 100], ["new", 200]]);
});

test("重复编号、多人选择同一原记录、已知编号转配其它记录都拒绝且保留原数据", () => {
  const current = [pay("a"), pay("b")];
  const cases = [
    planPaymentImport(current, [pay("a"), pay("a")], "replaceAll"),
    planPaymentImport(current, [pay("x"), pay("y")], "update", { 0: { kind: "replace", id: "a" }, 1: { kind: "replace", id: "a" } }),
    planPaymentImport(current, [pay("a")], "update", { 0: { kind: "replace", id: "b" } }),
    planPaymentImport(current, [pay("a")], "update", { 0: { kind: "add" } }),
    planPaymentImport(current, [pay("x")], "update", { 0: { kind: "replace", id: "missing" } }),
  ];
  for (const plan of cases) { assert.ok(plan.errors.length); assert.equal(plan.rows, current); }
  const duplicateOriginals = [pay("a"), pay("a")];
  const duplicatePlan = planPaymentImport(duplicateOriginals, [pay("a")], "update", { 0: { kind: "replace", id: "a" } });
  assert.ok(duplicatePlan.errors.length);
  assert.equal(duplicatePlan.rows, duplicateOriginals);
});

test("全部替换覆盖所有年份，保留文件中的重复内容独立记录，空文件不能清空", () => {
  const current = [{ ...pay("last-year"), date: "2025-01-01" }, pay("a"), pay("gone")];
  const incoming = [pay("a", 120), pay("new", 120)];
  const plan = planPaymentImport(current, incoming, "replaceAll");
  assert.deepEqual(plan.rows, incoming);
  assert.deepEqual([plan.updated, plan.added, plan.preserved, plan.removed], [1, 1, 0, 2]);
  const empty = planPaymentImport(current, [], "replaceAll");
  assert.ok(empty.errors.length);
  assert.equal(empty.rows, current);
});

test("增加模式保留旧内容去重规则，修正提示包含发放方和备注变化", () => {
  const current = [pay("a")];
  const plan = planPaymentImport(current, [{ ...pay("a"), source: "改发放方", remark: "新备注" }, pay("content-duplicate"), pay("new", 500)], "add");
  assert.deepEqual([plan.added, plan.skipped, plan.sameIdChanged], [1, 2, 1]);
  assert.deepEqual(plan.rows, [...current, pay("new", 500)]);
});

function workbook(rows: unknown[][]): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "发放记录");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
const heads = ["序号", "实际收款人", "发放日期", "发放金额(元)", "记录编号（勿修改）"];

test("严格导入校验拒绝缺列、缺姓名、空金额、错误金额/日期；不返回可误用的部分数据", () => {
  for (const bad of [
    [2, "", "2026-11-01", 120, "b"],
    [2, "测试乙", "2026-02-30", 120, "b"],
    [2, "测试乙", "2026-11-01", "写错了", "b"],
    [2, "测试乙", "2026-11-01", "", "b"],
    [2, "测试乙", "2026-11-01", "Infinity", "b"],
  ]) {
    const r = inspectPaymentSheet(workbook([heads, [1, "测试甲", "2026-11-01", 100, "a"], bad]));
    assert.ok(r.errors.length);
    assert.deepEqual(r.rows, []);
  }
  assert.ok(inspectPaymentSheet(workbook([["姓名", "备注"], ["测试甲", "金额缺列"]])).errors.length);
});

test("旧模板与新增空编号兼容：生成不同编号，允许零/负数/千分位金额、待发日期和合计", () => {
  const r = inspectPaymentSheet(workbook([heads,
    [1, "测试甲", "", 0, ""], [2, "测试乙", "2026/11/1", "-1,200.25", ""],
    ["合计", "", "", -1200.25, ""], ["", "总计", "", -1200.25, ""],
  ]));
  assert.deepEqual(r.errors, []);
  assert.equal(r.rows.length, 2);
  assert.ok(r.rows[0].id && r.rows[1].id && r.rows[0].id !== r.rows[1].id);
  assert.deepEqual(r.rows.map((p) => [p.date, p.amount]), [["", 0], ["2026-11-01", -1200.25]]);
});

test("整本导出与解析也保留发放编号，再次增加导入不重复", () => {
  const current = [pay("full-a"), pay("full-b", 200)];
  const wb = buildFullWorkbook({ year: 2026, people: [], attendance: [], payments: current });
  const back = parseFullAttendanceWorkbook(XLSX.write(wb, { type: "array", bookType: "xlsx" }), 2026).payments;
  assert.deepEqual(back.map((p) => p.id), current.map((p) => p.id));
  assert.equal(mergePayments(current, back).added, 0);
});
