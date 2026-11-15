import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQueryResults, buildQuerySlips, queryAvailableDates, queryMonthRange, queryRange, queryTeamResults } from "../src/lib/query-data";
import { queryWageAdditions, queryWageRoundingNote } from "../src/lib/query-wage";
import type { AttendanceRow, Payment, Person } from "../src/lib/types";

const person = (over: Partial<Person> = {}): Person => ({ id: "a", name: "甲", team: "一组", personNo: "", idCard: "", gender: "男", age: 30, birthday: "", phone: "", dailyWage: 300, monthWage: 0, payType: "day", otRule: "折算:8", mealAllowance: 20, bank: "", cardNo: "", address: "", idIssuer: "", idValidFrom: "", idValidTo: "", remark: "", ...over });
const attendance = (over: Partial<AttendanceRow> = {}): AttendanceRow => ({ id: "row", name: "甲", team: "一组", year: 2026, month: 7, days: 20.5, otHours: 10, allowance: 100, deduction: 50, remark: "", ...over });
const payment = (over: Partial<Payment> = {}): Payment => ({ id: "pay", owner: "甲", receiver: "甲", date: "2026-07-10", amount: 100, source: "", remark: "", ...over });
const range = queryRange({ year: 2026, month: 7, day: 1 }, { year: 2026, month: 7, day: 31 });

test("工资解释逐项展示日工资、出勤、加班折算、餐补补助扣款及最终6985", () => {
  const month = buildQueryResults({ people: [person()], attendance: [attendance()], payments: [], range })[0].months[0];
  assert.deepEqual([month.base, month.ot, month.meal, month.allowance, month.deduction, month.pay], [6150, 375, 410, 100, 50, 6985]);
  const calc = month.calculation!;
  assert.match(calc.standard, /日工资 ¥300.00\/天/);
  assert.match(calc.attendance, /20.5 天 × ¥300.00\/天 = ¥6,150.00/);
  assert.match(calc.overtime, /10 小时 ÷ 8 小时\/天 × ¥300.00\/天 = ¥375.00/);
  assert.match(calc.meal, /20.5 天 × ¥20.00\/天 = ¥410.00/);
  assert.match(calc.adjustment, /其他补助 ¥100.00；罚款\/扣款 ¥50.00/);
  assert.match(calc.total, /= ¥6,985.00$/);
  assert.deepEqual(calc.table, { wage: "日工资 ¥300.00/天", overtime: "加班折算 8 小时/天" });
  assert.equal(queryWageAdditions(month), 510, "打印补助包含100其他补助+410餐补，应发不变");
});

test("工资解释采用历史月标准，日薪改月薪时不套当前日薪/规则", () => {
  const p = person({ dailyWage: 999, otRule: "按小时:999", wageHistory: [
    { id: "old", fromDate: "2025-01-01", payType: "day", dailyWage: 100, monthWage: 0, otRule: "折算:8", mealAllowance: 10, remark: "" },
    { id: "new", fromDate: "2026-01-31", payType: "month", dailyWage: 0, monthWage: 3000, otRule: "折算:8", mealAllowance: 12, remark: "" },
  ] });
  const r = queryRange({ year: 2025, month: 12, day: 1 }, { year: 2026, month: 1, day: 31 });
  const months = buildQueryResults({ people: [p], attendance: [attendance({ year: 2025, month: 12, days: 2, otHours: 8, allowance: 5, deduction: 10 }), attendance({ id: "jan", month: 1, days: 2, otHours: 8, allowance: 5, deduction: 10 })], payments: [], range: r })[0].months;
  assert.equal(months[0].pay, 315);
  assert.equal(months[1].pay, 3119);
  assert.match(months[0].calculation!.standard, /日工资 ¥100.00/);
  assert.match(months[1].calculation!.standard, /月工资 ¥3,000.00.*加班折算按 ¥100.00/);
  assert.match(months[1].calculation!.attendance, /月工资.*1 笔计薪考勤/);
  assert.ok(!JSON.stringify(months.map((m) => m.calculation)).includes("999"));
  assert.equal(months[1].calculation!.table.wage, "月工资 ¥3,000.00/月");
  assert.equal(months[1].calculation!.table.overtime, "加班折算 8 小时/天");
});

test("多笔考勤逐笔取分，不打印按月汇总重算的错误等式，保留小于分的单价", () => {
  const p = person({ dailyWage: 0.05, mealAllowance: 0.05, otRule: "" });
  const rows = [attendance({ days: 0.1, otHours: 0, allowance: 0, deduction: 0 }), attendance({ id: "second", days: 0.1, otHours: 0, allowance: 0, deduction: 0 })];
  const month = buildQueryResults({ people: [p], attendance: rows, payments: [], range })[0].months[0];
  assert.equal(month.pay, 0.04);
  assert.match(month.calculation!.attendance, /2 笔考勤分别/);
  assert.match(month.calculation!.note, /逐笔计价、取分/);
  const fractional = buildQueryResults({ people: [person({ dailyWage: 0.005, mealAllowance: 0 })], attendance: [attendance({ days: 1, otHours: 0, allowance: 0, deduction: 0 })], payments: [], range })[0].months[0];
  assert.match(fractional.calculation!.standard, /¥0.005\/天/);
});

test("展示分项存在取分差额时显式调节，不改既有应发", () => {
  const month = buildQueryResults({ people: [person()], attendance: [attendance({ days: 0, otHours: 0, allowance: 0.005, deduction: 0.001 })], payments: [], range })[0].months[0];
  assert.equal(month.pay, 0);
  assert.match(month.calculation!.total, /− ¥0.01（逐笔取分差额） = ¥0.00$/);
  assert.equal(queryWageRoundingNote(month), "取分差额 −¥0.01");
});

test("打印表格区分按小时、未设与明确不计加班，不引入长计算式", () => {
  const result = (otRule: string) => buildQueryResults({ people: [person({ otRule })], attendance: [attendance()], payments: [], range })[0].months[0];
  assert.deepEqual(result("按小时:20").calculation!.table, { wage: "日工资 ¥300.00/天", overtime: "加班按小时 ¥20.00/小时" });
  assert.equal(result("").calculation!.table.overtime, "加班未设");
  assert.equal(result("不计加班").calculation!.table.overtime, "不计加班");
});

test("考勤自动日期只取本对象有内容月份，含纯备注，保留跨年与闰年月末", () => {
  const people = [person(), person({ id: "b", name: "乙", team: "二组" })];
  const rows = [attendance({ year: 2024, month: 2 }), attendance({ year: 2025, month: 1, days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "请假" }), attendance({ year: 2026, month: 5, days: 0, otHours: 0, allowance: 0, deduction: 0 }), attendance({ name: "乙", year: 2023 })];
  assert.deepEqual(queryAvailableDates({ people, attendance: rows, payments: [payment({ date: "2020-01-01" })], scope: "person", content: "attendance", name: " 甲 " }), { from: { year: 2024, month: 2, day: 1 }, to: { year: 2025, month: 1, day: 31 } });
  assert.deepEqual(queryAvailableDates({ people, attendance: rows, payments: [], scope: "team", content: "attendance", team: "一组" })?.to, { year: 2025, month: 1, day: 31 });
});

test("工资自动日期按owner/receiver有效发放所在月份取月初/月末，待发及其他人不扩范围", () => {
  const people = [person()];
  const payments = [payment({ date: "2023/5/8", owner: "外部乙", receiver: "甲" }), payment({ id: "latest", date: "2026-08-09" }), payment({ id: "pending", date: "" }), payment({ id: "invalid", date: "2027-02-31" }), payment({ id: "other", owner: "丙", receiver: "丙", date: "2030-01-01" })];
  assert.deepEqual(queryAvailableDates({ people, attendance: [attendance()], payments, scope: "person", content: "wage", name: "甲" }), { from: { year: 2023, month: 5, day: 1 }, to: { year: 2026, month: 8, day: 31 } });
  assert.deepEqual(queryAvailableDates({ people, attendance: [], payments: [payments[0]], scope: "person", content: "wage", name: "甲" }), { from: { year: 2023, month: 5, day: 1 }, to: { year: 2023, month: 5, day: 31 } });
});

test("查询整月范围含首月1日和末月最后一天，反选跨年与闰年正确", () => {
  const start = { year: 2025, month: 12 }, end = { year: 2026, month: 2 };
  const range = queryMonthRange(start, end);
  assert.equal(range.startDate, "2025-12-01");
  assert.equal(range.endDate, "2026-02-28");
  assert.deepEqual(range.span, [{ year: 2025, month: 12 }, { year: 2026, month: 1 }, { year: 2026, month: 2 }]);
  assert.deepEqual(queryMonthRange(end, start), { ...range, swapped: true });
  assert.deepEqual(queryMonthRange({ year: 2024, month: 2 }, { year: 2024, month: 2 }), { span: [{ year: 2024, month: 2 }], startDate: "2024-02-01", endDate: "2024-02-29", swapped: false });
  assert.equal(queryMonthRange({ year: 2026, month: 4 }, { year: 2026, month: 4 }).endDate, "2026-04-30");
  assert.deepEqual(queryMonthRange({ year: 2026, month: 13 }, end).span, []);
});

test("整月工资查询纳入首末当日的发放，排除区间外和待发，个人/班组/工资条一致", () => {
  const payments = [payment({ id: "first", date: "2024-02-01", amount: 100 }), payment({ id: "last", date: "2024-02-29", amount: 200 }), payment({ id: "early", date: "2024-01-31", amount: 400 }), payment({ id: "late", date: "2024-03-01", amount: 800 }), payment({ id: "pending", date: "", amount: 1600 })];
  const range = queryMonthRange({ year: 2024, month: 2 }, { year: 2024, month: 2 });
  const result = buildQueryResults({ people: [person()], attendance: [], payments, range })[0];
  assert.deepEqual(result.pays.map((row) => row.id), ["first", "last"]);
  assert.equal(result.paidAsOwner, 300);
  assert.equal(queryTeamResults([result], "一组").paidAsOwner, 300);
  assert.deepEqual(buildQuerySlips([result])[0].pays, result.pays);
});

test("无记录、未知人员及同名关联歧义不给伪造的自动日期", () => {
  assert.equal(queryAvailableDates({ people: [person()], attendance: [], payments: [], scope: "person", content: "attendance", name: "甲" }), null);
  assert.equal(queryAvailableDates({ people: [person()], attendance: [attendance()], payments: [], scope: "person", content: "attendance", name: "未知" }), null);
  assert.equal(queryAvailableDates({ people: [person(), person({ id: "duplicate" })], attendance: [attendance()], payments: [payment()], scope: "team", content: "wage", team: "一组" }), null);
});

test("空月份保留零值行，但不重复输出无记录的工资计算块", () => {
  const r = queryRange({ year: 2026, month: 6, day: 1 }, { year: 2026, month: 7, day: 31 });
  const months = buildQueryResults({ people: [person()], attendance: [attendance()], payments: [], range: r })[0].months;
  assert.equal(months.length, 2);
  assert.equal(months[0].pay, 0);
  assert.equal(months[0].calculation, undefined);
  assert.ok(months[1].calculation);
  const blank = attendance({ days: 0, otHours: 0, allowance: 0, deduction: 0 });
  for (const payType of ["day", "month"] as const) {
    const month = buildQueryResults({ people: [person({ payType })], attendance: [blank], payments: [], range })[0].months[0];
    assert.equal(month.pay, 0);
    assert.equal(month.calculation, undefined, "空白行或月薪标记不能触发说明");
  }
});

test("历史负出勤或负加班的金额仍有解释，不改变有内容/自动范围口径", () => {
  for (const values of [{ days: -1, otHours: 0 }, { days: 0, otHours: -8 }]) {
    const a = attendance({ ...values, allowance: 0, deduction: 0 });
    const month = buildQueryResults({ people: [person()], attendance: [a], payments: [], range })[0].months[0];
    assert.equal(month.hasContent, false);
    assert.ok(month.calculation);
    assert.ok(month.pay < 0);
    assert.equal(queryAvailableDates({ people: [person()], attendance: [a], payments: [], scope: "person", content: "wage", name: "甲" }), null);
  }
});
