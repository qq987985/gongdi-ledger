/**
 * 考勤/总览「四口径一致」专项测试（口径一致性专项 20260916）。
 *
 * 要钉住的是同一份数据在四个地方对不上：
 * ① 总览 KPI「应发合计 / 已发放 / 待发放」 ② 考勤页年度汇总的逐行「全年/已发/未发」
 * ③ 月度卡的「已录入 / 空表」与「已录月份 X / 12」 ④ Excel 整本导出的月表与汇总表。
 * 边界：纯备注行（工伤休息）、跨年、无发放日期、代收、金额 0、未设加班规则、没填班组的人。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { fallbackPayYear, filledMonthsOf, personMonths, summarizeYear, teamRows } from "../src/lib/attendance-summary";
import { monthStatus } from "../src/lib/dates";
import { buildFullWorkbook } from "../src/lib/excel/full";
import { hasContent, hasWork } from "../src/lib/work";
import type { AttendanceRow, Payment, Person } from "../src/lib/types";

function person(over: Partial<Person> & { id: string; name: string }): Person {
  return {
    team: "一组",
    personNo: "",
    idCard: "",
    gender: "男",
    age: 30,
    birthday: "",
    phone: "",
    dailyWage: 0,
    monthWage: 0,
    payType: "day",
    otRule: "",
    mealAllowance: 0,
    bank: "",
    cardNo: "",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
    ...over,
  };
}
function att(over: Partial<AttendanceRow> & { id: string; name: string; year: number; month: number }): AttendanceRow {
  return { team: "一组", days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "", ...over };
}
function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "", receiver: "", date: "", amount: 0, source: "", remark: "", ...over };
}

const PEOPLE: Person[] = [
  person({ id: "u1", name: "张三", dailyWage: 300 }),
  person({ id: "u2", name: "李四", dailyWage: 200 }),
  person({ id: "u3", name: "王五", dailyWage: 100 }),
  person({ id: "u4", name: "赵六", dailyWage: 100, team: "" }), // 没填班组
  person({ id: "u5", name: "钱七", payType: "month", monthWage: 6000, team: "二组" }),
];

const ATTENDANCE: AttendanceRow[] = [
  att({ id: "a1", name: "张三", year: 2026, month: 3, days: 20 }), // 20×300 = 6000
  att({ id: "a2", name: "李四", year: 2026, month: 3, days: 0, remark: "工伤休息" }), // 只有备注
  att({ id: "a3", name: "王五", year: 2026, month: 4, days: 10, allowance: 100, deduction: 50 }), // 1000+100-50
  att({ id: "a4", name: "钱七", year: 2026, month: 5, days: 0, allowance: 200, deduction: 0, remark: "" }), // 月薪+补助
  att({ id: "a5", name: "已删的人", year: 2026, month: 3, days: 30 }), // 不在人员表
  att({ id: "a6", name: "张三", year: 2025, month: 12, days: 5 }), // 跨年
];

const PAYMENTS: Payment[] = [
  pay({ id: "p1", owner: "张三", receiver: "张三", date: "2026-03-10", amount: 1000 }),
  pay({ id: "p2", owner: "张三", receiver: "李四", date: "2026-03-11", amount: 500 }), // 代收
  pay({ id: "p3", owner: "赵六", receiver: "赵六", date: "", amount: 900 }), // 待发放（无日期）
  pay({ id: "p4", owner: "钱七", receiver: "钱七", date: "2025-12-31", amount: 700 }), // 跨年
];

const y2026 = summarizeYear({ people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS, year: 2026, fallbackYear: 2026 });

test("纯备注行（工伤休息）：算「有内容」，金额 0（hasWork 与 hasContent 的分工）", () => {
  const a = ATTENDANCE[1];
  assert.equal(hasWork(a), false, "工资计算口径：没有工天/加班/补助/扣款 → 不发钱");
  assert.equal(hasContent(a), true, "「有没有记录」口径：只有备注也算有内容");
  assert.equal(personMonths(PEOPLE[1], ATTENDANCE, 2026)[2].pay, 0, "金额不受影响");
});

test("月度卡与「已录月份」：纯备注月份从「空表」变「已录入」", () => {
  const st = monthStatus(ATTENDANCE, 2026, 3);
  assert.equal(st.total, 3, "3 月有 3 行（张三/李四/已删的人）");
  assert.equal(st.filled, 3, "含只有备注的李四 → 已录入；以前是 2");
  assert.equal(st.days, 50, "逐行天数相加：张三 20 + 李四 0 + 已删的人 30（月表是原始记录，纯备注行加 0）");
  assert.equal(filledMonthsOf(ATTENDANCE, 2026), 3, "3月(含纯备注)、4月、5月(钱七空行不算)");
});

test("年度汇总逐行之和 == 总览 KPI 应发合计（含纯备注的人列出但金额 0）", () => {
  const names = y2026.rows.map((r) => r.person.name);
  assert.deepEqual(names.slice().sort(), ["张三", "李四", "王五", "钱七"], "已删人员不进；纯备注的李四要列出来");
  const rowsSum = y2026.rows.reduce((s, r) => s + r.yearPayAmt, 0);
  assert.equal(rowsSum, y2026.should, "KPI 应发合计 = 逐行全年之和");
  // 张三 20×300=6000；李四只有备注=0；王五 10×100+100−50=1050；钱七 月薪 6000+补助 200=6200
  assert.equal(y2026.should, 6000 + 0 + 1050 + 6200);
  assert.equal(y2026.rows.find((r) => r.person.name === "李四")?.yearPayAmt, 0, "只有备注 → 0 元但人在表里");
  assert.equal(y2026.rows.find((r) => r.person.name === "钱七")?.yearPayAmt, 6200, "月薪：有出勤/补助才发月薪");
});

test("已发放只认有日期的记录；待发放单独统计；代收按笔数；发给无考勤者的钱显式暴露", () => {
  assert.equal(y2026.paid, 1500, "本年全部有日期的发放：张三 1000 + 代收 500");
  assert.equal(y2026.rowsPaidSum, 1500, "本年这几笔都属于有考勤的人");
  assert.deepEqual(y2026.offRowsPaid, { count: 0, amount: 0 });
  assert.equal(y2026.pendingAmt, 900, "无日期的 900 只进待发放");
  assert.equal(y2026.proxyCount, 1);
  assert.equal(
    y2026.rows.reduce((s, r) => s + r.paid, 0),
    y2026.rowsPaidSum,
    "逐行已发之和 == rowsPaidSum",
  );
  assert.equal(y2026.rows.find((r) => r.person.name === "张三")?.unpaid, 6000 - 1500);
});

test("跨年：2025 的发放/考勤不进 2026；发给「本年无考勤」的人仍然计入 KPI 已发放（不静默消失）", () => {
  const y2025 = summarizeYear({ people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS, year: 2025, fallbackYear: 2025 });
  assert.equal(y2025.paid, 700, "2025-12-31 那笔算 2025（钱七 2025 年没有考勤行）");
  assert.deepEqual(y2025.offRowsPaid, { count: 1, amount: 700 }, "差额必须显式暴露，页面会提示一行");
  assert.equal(y2025.rowsPaidSum, 0, "年度表里没有钱七 → 逐行之和为 0");
  assert.equal(y2025.pendingAmt, 900, "无日期那笔归 fallbackYear=2025，所以算在 2025 的待发放里");
  const y2026b = summarizeYear({ people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS, year: 2026, fallbackYear: 2025 });
  assert.equal(y2026b.pendingAmt, 0, "同一笔不能既算 2025 又算 2026：fallbackYear 决定归属");
  // 唯一实现：所有页面都用这个函数取「最早的一年」
  const store = { year: 2026, years: [2024, 2026], attendance: [{ year: 2026 }] };
  assert.equal(fallbackPayYear(store), 2024);
  assert.equal(
    fallbackPayYear({ year: 2026, years: [2026], attendance: [{ year: 2026 }] }),
    2026,
    "旧写法在考勤页只用该年，会得到不同年份 → 同一年两处「待发放」不一样",
  );
});

test("班组面板的分组要覆盖所有人（含「未分班组」）", () => {
  const rows = teamRows(PEOPLE);
  assert.deepEqual(rows.map((r) => `${r.team}:${r.count}`), ["一组:3", "二组:1", "未分班组:1"]);
  assert.equal(rows.reduce((s, r) => s + r.count, 0), PEOPLE.length, "面板人数之和 == 在册人员 KPI");
});

test("Excel 整本导出：月表与汇总/工天加班表的人口径一致（纯备注的人不能只在月表里）", () => {
  const wb = buildFullWorkbook({ year: 2026, people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS });
  const rows = (name: string) => XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1, blankrows: false });
  const month = rows("3月考勤");
  assert.ok(wb.Sheets["3月考勤"], "3 月要生成月表（纯备注也算有内容）");
  const monthNames = month.slice(2).map((r) => r[1]);
  assert.equal(monthNames.includes("李四"), true, "月表里有李四（只有备注的行不能丢）");
  const sumNames = rows("汇总").slice(2).map((r) => r[1]);
  assert.equal(sumNames.includes("李四"), true, "汇总表里也要有李四（以前月表有、汇总没有）");
  assert.equal(sumNames.includes("已删的人"), false, "不在人员表的人不进汇总");
  const workNames = rows("工天加班").slice(2).map((r) => r[1]);
  assert.deepEqual(workNames.slice().sort(), sumNames.slice().sort(), "工天加班与汇总的人列完全一致");
});
