import { test } from "node:test";
import assert from "node:assert/strict";
import { personMonths } from "../src/lib/attendance-summary";
import { groupBuckets } from "../src/lib/buckets";
import { round2 } from "../src/lib/wage";
import { buildQueryResults, buildQuerySlips, queryPrintResults, queryRange, queryTeamResults } from "../src/lib/query-data";
import type { AttendanceRow, Payment, Person } from "../src/lib/types";

function person(over: Partial<Person> & { id: string; name: string }): Person {
  return {
    team: "一组", personNo: "", idCard: "", gender: "男", age: 30, birthday: "", phone: "",
    dailyWage: 100, monthWage: 0, payType: "day", otRule: "按小时:20", mealAllowance: 10,
    bank: "", cardNo: "", address: "", idIssuer: "", idValidFrom: "", idValidTo: "", remark: "", ...over,
  };
}
function att(over: Partial<AttendanceRow> & { id: string; name: string; year: number; month: number }): AttendanceRow {
  return { team: "旧班组", days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "", ...over };
}
function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "张三", receiver: "", date: "", amount: 0, source: "", remark: "", ...over };
}
const range = queryRange({ year: 2025, month: 12, day: 31 }, { year: 2026, month: 1, day: 5 });
const people = [
  person({ id: "p1", name: " 张三 ", team: " 新组 ", wageHistory: [
    { id: "w1", remark: "", fromDate: "2025-01-01", payType: "day", dailyWage: 100, monthWage: 0, otRule: "按小时:20", mealAllowance: 10 },
    { id: "w2", remark: "", fromDate: "2026-01-31", payType: "day", dailyWage: 200, monthWage: 0, otRule: "按小时:20", mealAllowance: 10 },
  ] }),
  person({ id: "p2", name: "李四", team: "旧组" }),
];
const attendance = [
  att({ id: "a1", name: "张三", year: 2025, month: 12, days: 2, otHours: 1, allowance: 0.1, remark: "年末" }),
  att({ id: "a2", name: " 张三", year: 2026, month: 1, days: 1, otHours: 0.5, allowance: 0.2, remark: "前半月" }),
  att({ id: "a3", name: "张三 ", year: 2026, month: 1, days: 2, otHours: 1, deduction: 0.1, remark: "后半月" }),
  att({ id: "excluded", name: "张三", year: 2026, month: 2, days: 30 }),
];
const payments = [
  pay({ id: "self", date: "2025-12-31", amount: 100.1 }),
  pay({ id: "proxy", date: "2026-1-5", amount: 50.2, owner: "张三 ", receiver: " 李四" }),
  pay({ id: "collected", date: "2026/1/5", amount: 75.3, owner: "李四", receiver: "张三" }),
  pay({ id: "pending", amount: 900 }),
  pay({ id: "early", date: "2025-12-30", amount: 10 }),
  pay({ id: "late", date: "2026-01-06", amount: 20 }),
  pay({ id: "invalid", date: "2026-02-31", amount: 30 }),
];

test("查询区间：跨年、整月与按日范围各自正确，反向年月日一起对调", () => {
  assert.deepEqual(range.span, [{ year: 2025, month: 12 }, { year: 2026, month: 1 }]);
  const reversed = queryRange({ year: 2026, month: 1, day: 5 }, { year: 2025, month: 12, day: 31 });
  assert.deepEqual(reversed, { ...range, swapped: true });
  assert.deepEqual(queryRange({ year: 2026, month: 1, day: 20 }, { year: 2026, month: 1, day: 2 }), {
    span: [{ year: 2026, month: 1 }], startDate: "2026-01-02", endDate: "2026-01-20", swapped: true,
  });
});

test("查询区间：日夹到真实月末，闰年与非法年月不溢出", () => {
  assert.equal(queryRange({ year: 2024, month: 2, day: 31 }, { year: 2024, month: 3, day: 1 }).startDate, "2024-02-29");
  assert.equal(queryRange({ year: 2026, month: 2, day: 31 }, { year: 2026, month: 3, day: 1 }).startDate, "2026-02-28");
  assert.deepEqual(queryRange({ year: 2026, month: 13, day: 1 }, { year: 2026, month: 3, day: 1 }).span, []);
});

test("查询按整月累加重复考勤，工资历史按月末生效，与年度 personMonths 同口径", () => {
  const result = buildQueryResults({ people, attendance, payments, range })[0];
  assert.equal(result.totals.days, 5, "月末到月初的日期范围仍查询两个完整考勤月份");
  assert.equal(result.totals.otHours, 2.5);
  assert.equal(result.months[0].pay, 240.1, "200 底薪 + 20 加班 + 20 餐补 + 0.1 补助");
  assert.equal(result.months[1].pay, 660.1, "两个同月原始行分别算薪后累加：220.2 + 439.9");
  assert.equal(result.totals.pay, 900.2);
  assert.equal(result.months[1].remark, "前半月；后半月");
  assert.equal(result.months[1].pay, round2(personMonths(people[0], attendance, 2026)[0].pay));
  const slips = buildQuerySlips([result]);
  assert.equal(slips[0].total, 900.2);
  assert.deepEqual(slips[0].months, result.months);
});

test("月薪的同月重复行逐行计算，保留既有 personMonths 口径而不静默去重", () => {
  const p = person({ id: "month", name: "王五", payType: "month", monthWage: 6000, mealAllowance: 0 });
  const rows = [att({ id: "m1", name: "王五", year: 2026, month: 1, days: 1 }), att({ id: "m2", name: "王五", year: 2026, month: 1, days: 2 })];
  const result = buildQueryResults({ people: [p], attendance: rows, payments: [], range })[0];
  assert.equal(result.months[1].pay, 12000);
  assert.equal(result.months[1].pay, personMonths(p, rows, 2026)[0].pay);
});

test("发放按规范化起止日筛选：owner 已发含代发，工资条本人/代收/他人代领分列", () => {
  const results = buildQueryResults({ people, attendance, payments, range });
  const row = results[0];
  assert.deepEqual(row.pays.map((item) => item.id), ["self", "proxy", "collected"], "同日记录保留原顺序");
  assert.deepEqual(row.pays.map((item) => item.date), ["2025-12-31", "2026-01-05", "2026-01-05"]);
  assert.equal(row.paidAsOwner, 150.3, "100.1 本人 + 50.2 代发，不计代收他人的钱");
  assert.equal(row.difference, 749.9);
  assert.equal(row.paidSelf, 100.1);
  assert.equal(row.collected, 75.3);
  assert.equal(row.proxyOut, 50.2);
  const slip = buildQuerySlips([row])[0];
  assert.equal(slip.paid, 100.1);
  assert.equal(slip.unpaidSelf, 800.1);
  assert.equal(slip.collected, 75.3);
  assert.equal(slip.proxyOut, 50.2);
  assert.equal(results[1].paidAsOwner, 75.3, "代领张三的钱不能再计入李四 owner 金额");
});

test("班组按当前人员档案 trim 分桶，含未分组和无记录成员，合计舍入到分", () => {
  const currentPeople = [...people, person({ id: "empty1", name: "赵六", team: " " }), person({ id: "empty2", name: "钱七", team: "" })];
  const results = buildQueryResults({ people: currentPeople, attendance, payments, range });
  const teams = groupBuckets(currentPeople.map((item) => item.team), "未分班组");
  assert.ok(teams.some((bucket) => bucket.value === "" && bucket.label === "未分班组"));
  const current = queryTeamResults(results, "新组");
  assert.deepEqual(current.members.map((row) => row.person.id), ["p1"]);
  assert.equal(current.totals.days, 5);
  assert.equal(current.totals.pay, 900.2);
  assert.equal(current.paidAsOwner, 150.3);
  assert.equal(current.difference, 749.9);
  const empty = queryTeamResults(results, "");
  assert.deepEqual(empty.members.map((row) => row.person.id), ["empty1", "empty2"]);
  assert.equal(empty.totals.pay, 0);
  assert.equal(empty.totals.days, 0);
  assert.deepEqual(queryTeamResults(results, "不存在").members, []);
});

test("同名歧义保留不同人员行，但不猜测历史归属或重复计入班组合计/工资条", () => {
  const currentPeople = [...people, person({ id: "duplicate", name: "张三", team: "旧组" })];
  const results = buildQueryResults({ people: currentPeople, attendance, payments, range });
  assert.equal(results[0].ambiguous, true);
  assert.equal(results[2].ambiguous, true);
  assert.deepEqual(results[0].months, []);
  assert.deepEqual(results[0].pays, []);
  assert.equal(results[0].paidAsOwner, 0);
  assert.equal(queryTeamResults(results, "新组").ambiguousCount, 1);
  assert.equal(queryTeamResults(results, "新组").totals.pay, 0);
  assert.deepEqual(queryPrintResults(results, ["p1", "duplicate"]), []);
  assert.deepEqual(buildQuerySlips([results[0], results[2]]), []);
});

test("工资条范围绑定当前班组，陈旧勾选与重复ID不能打印其他班组人员", () => {
  const results = buildQueryResults({ people, attendance, payments, range });
  assert.deepEqual(queryPrintResults(results, ["p1", "p2", "p1"], "新组").map((row) => row.person.id), ["p1"]);
  assert.deepEqual(queryPrintResults(results, ["p1"], "旧组"), []);
  assert.deepEqual(queryPrintResults(results, ["p1", "p2"]).map((row) => row.person.id), ["p1", "p2"]);
});

test("只有备注仍显示、打印，无内容与空人员不会生成工资空单，查询不修改输入", () => {
  const p = person({ id: "remark", name: "工友" });
  const rows = [att({ id: "r", name: "工友", year: 2026, month: 1, remark: "工伤休息" })];
  const before = JSON.stringify({ people: [p], attendance: rows, payments });
  const result = buildQueryResults({ people: [p], attendance: rows, payments, range })[0];
  assert.equal(result.months[1].hasContent, true);
  assert.equal(result.totals.days, 0);
  assert.equal(result.totals.pay, 0);
  assert.equal(buildQuerySlips([result])[0].months[0].remark, "工伤休息");
  assert.equal(JSON.stringify({ people: [p], attendance: rows, payments }), before);
  const noData = buildQueryResults({ people: [p], attendance: [], payments: [], range });
  assert.equal(noData[0].months.length, 2);
  assert.equal(noData[0].totals.pay, 0);
  assert.deepEqual(buildQuerySlips(noData), []);
  assert.deepEqual(buildQueryResults({ people: [], attendance: rows, payments, range }), []);
});

test("班组逐月列出每个人、当月小计和区间汇总，跨年与重复考勤不串月", () => {
  const members = [...people, person({ id: "p3", name: "王五", team: "新组" })];
  const rows = [...attendance, att({ id: "p3-dec", name: "王五", year: 2025, month: 12, days: 3 })];
  const results = buildQueryResults({ people: members, attendance: rows, payments, range });
  const before = JSON.stringify(results);
  const summary = queryTeamResults(results, "新组", range.span);
  assert.deepEqual(summary.months.map(({ year, month }) => [year, month]), [[2025, 12], [2026, 1]]);
  assert.deepEqual(summary.months[0].rows.map((row) => [row.person.id, row.month.days]), [["p1", 2], ["p3", 3]]);
  assert.deepEqual(summary.months[1].rows.map((row) => [row.person.id, row.month.days]), [["p1", 3], ["p3", 0]]);
  assert.equal(summary.months[0].totals.days, 5);
  assert.equal(summary.months[0].totals.pay, 570.1);
  assert.equal(summary.months[1].totals.otHours, 1.5);
  assert.equal(summary.months[1].totals.pay, 660.1);
  assert.equal(summary.totals.days, 8);
  assert.equal(summary.totals.pay, round2(summary.months.reduce((sum, month) => sum + month.totals.pay, 0)));
  assert.equal(summary.paidAsOwner, 150.3, "逐月工资不会改变按发放日期统计的区间已发");
  assert.equal(JSON.stringify(results), before);
});

test("逐月班组保留零记录月份与同名提示，空册按显式范围返回空月份而不猜测归属", () => {
  const duplicate = person({ id: "duplicate", name: "张三", team: "新组" });
  const results = buildQueryResults({ people: [...people, duplicate], attendance, payments, range });
  const summary = queryTeamResults(results, "新组", range.span);
  assert.equal(summary.months.length, 2);
  assert.equal(summary.ambiguousCount, 2);
  for (const month of summary.months) {
    assert.equal(month.rows.length, 2);
    assert.ok(month.rows.every((row) => row.ambiguous));
    assert.equal(month.totals.days, 0);
    assert.equal(month.totals.pay, 0);
  }
  const noRows = buildQueryResults({ people, attendance: [], payments: [], range });
  assert.ok(queryTeamResults(noRows, "新组", range.span).months.every((month) => month.rows.length === 1 && month.totals.days === 0));
  assert.ok(queryTeamResults([], "新组", range.span).months.every((month) => !month.rows.length && month.totals.pay === 0));
});
