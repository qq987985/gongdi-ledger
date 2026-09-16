/**
 * 考勤/总览「四口径一致」专项测试（口径一致性专项 20260916；1.8.5 三条口径决策，1.8.6 纠正代发口径）。
 *
 * 要钉住的是同一份数据在四个地方对不上：
 * ① 总览 KPI「应发合计 / 已发放 / 待发放」 ② 考勤页年度汇总的逐行「全年/已发/未发」
 * ③ 月度卡的「已录入 / 空表」与「已录月份 X / 12」 ④ Excel 整本导出的月表与汇总表。
 * 边界：纯备注行（工伤休息）、跨年、无发放日期、代收、金额 0、未设加班规则、没填班组的人。
 *
 * 1.8.5 三条决策 + 1.8.6 纠正：
 * - 决策一：无日期的待发放记录按**当前工作年**归集（不再取整本最早年）。
 * - 决策二：本年没有考勤记录、却有已发记录的人**补一行**（备注「本年无考勤记录」），
 *   使**年度表逐行「已发」之和 == 总览「已发放」KPI**。
 * - 1.8.6（用户原话「待发不计，代发要计入实际收款人」）：**已发放** = 本年所有填了发放日期的记录，
 *   按**实际收款人**计入其名下、**含代发**（1.8.5 曾把代发扣出去，是错的）；
 *   代发 `proxyAmt` 是它的**子集**（B ⊆ A），待发放 `pendingAmt` 单列不计已发：
 *   `paid + pendingAmt = 本年全部发放金额`，`proxyAmt ≤ paid`。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  NO_ATTENDANCE_REMARK,
  fallbackPayYear,
  filledMonthsOf,
  personMonths,
  summarizeYear,
  teamRows,
} from "../src/lib/attendance-summary";
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
  person({ id: "u4", name: "赵六", dailyWage: 100, team: "" }), // 没填班组，且 2026 年一次考勤都没有
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

/**
 * 2026 年三维修（1.8.6）：
 *   A 已发（按实际收款人，含代发）= 张三 1000+500 + 王五 400 + 赵六 600 + 已删的人 250 + 李四 120 = 2870（6 笔）
 *   B 其中代发（⊆ A）             = 张三名下 500，李四代领（1 笔）
 *   C 待发放                      = 赵六 900
 *   A + C = 3770
 * 其中「赵六」「已删的人」2026 年**没有考勤记录**却有已发记录（决策二的补行对象）。
 */
const PAYMENTS: Payment[] = [
  pay({ id: "p1", owner: "张三", receiver: "张三", date: "2026-03-10", amount: 1000 }),
  pay({ id: "p2", owner: "张三", receiver: "李四", date: "2026-03-11", amount: 500 }), // 代收（李四代领）
  pay({ id: "p3", owner: "赵六", receiver: "赵六", date: "", amount: 900 }), // 待发放（无日期）
  pay({ id: "p4", owner: "钱七", receiver: "钱七", date: "2025-12-31", amount: 700 }), // 跨年
  pay({ id: "p5", owner: "王五", receiver: "王五", date: "2026-07-01", amount: 400 }),
  pay({ id: "p6", owner: "赵六", receiver: "赵六", date: "2026-08-01", amount: 600 }), // 本年无考勤者收款
  pay({ id: "p7", owner: "已删的人", receiver: "已删的人", date: "2026-09-01", amount: 250 }), // 已删人员收款
  pay({ id: "p8", owner: "李四", receiver: "李四", date: "2026-10-01", amount: 120 }),
];

const A = 2870;
const B = 500;
const C = 900;

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
  assert.deepEqual(
    names.slice(0, 4),
    ["张三", "李四", "王五", "钱七"],
    "有考勤的人按人员表顺序；纯备注的李四要列出来",
  );
  assert.equal(y2026.rows.reduce((s, r) => s + r.yearPayAmt, 0), y2026.should, "KPI 应发合计 = 逐行全年之和");
  // 张三 20×300=6000；李四只有备注=0；王五 10×100+100−50=1050；钱七 月薪 6000+补助 200=6200
  assert.equal(y2026.should, 6000 + 0 + 1050 + 6200);
  assert.equal(y2026.rows.find((r) => r.person.name === "李四")?.yearPayAmt, 0, "只有备注 → 0 元但人在表里");
  assert.equal(y2026.rows.find((r) => r.person.name === "钱七")?.yearPayAmt, 6200, "月薪：有出勤/补助才发月薪");
});

test("决策二：本年无考勤记录却有已发记录的人 → 补一行（备注写清），且逐行已发之和 == KPI 已发放", () => {
  const extra = y2026.rows.filter((r) => r.noAttendance);
  assert.deepEqual(
    extra.map((r) => `${r.person.name}:${r.paid}:${r.remark}`),
    [`赵六:600:${NO_ATTENDANCE_REMARK}`, `已删的人:250:${NO_ATTENDANCE_REMARK}`],
    "补行按金额降序：赵六 600、已删的人 250（都不在人员表里的也有行，钱不会凭空消失）",
  );
  for (const r of extra) {
    assert.equal(r.yearPayAmt, 0, "没考勤 → 全年应发 0");
    assert.equal(r.unpaid, -r.paid, "未发 = 0 − 已发，照实列负数（超发）");
    assert.equal(r.worked, false);
  }
  assert.equal(y2026.rowsPaidSum, A, "年度表逐行「已发」之和");
  assert.equal(y2026.rowsPaidSum, y2026.paid, "**决策二的核心等式**：逐行之和 == 总览「已发放」KPI");
  assert.deepEqual(y2026.offRowsPaid, { count: 0, amount: 0 }, "补行之后差额为 0，不再需要「差额提示」救场");
});

test("1.8.6：已发放 = 按实际收款人计入的已发记录（**含代发**）；代发是子集、待发放单列", () => {
  assert.equal(
    y2026.paid,
    A,
    "已发 = 张三 1500（1000 本人 + 500 李四代领）+ 王五 400 + 赵六 600 + 已删的人 250 + 李四 120",
  );
  assert.equal(y2026.proxyAmt, B, "其中代发：李四代领张三的 500（**含在 paid 里，不扣出去**）");
  assert.equal(y2026.proxyCount, 1);
  assert.ok(y2026.proxyAmt <= y2026.paid, "B ⊆ A：代发是已发的子集");
  assert.equal(y2026.pendingAmt, C, "待发放：赵六 900（不算已发）");
  assert.equal(y2026.paid + y2026.pendingAmt, A + C, "paid + pendingAmt = 本年全部发放金额");
  // 该年发放总额必须等于台账里该年每一笔的金额之和
  const yearRows = PAYMENTS.filter((p) => (p.date || "").startsWith("2026") || !p.date);
  assert.equal(yearRows.reduce((s, p) => s + p.amount, 0), A + C, "已发 + 待发 不重不漏地覆盖该年全部发放");
  assert.equal(y2026.rows.find((r) => r.person.name === "张三")?.paid, 1500, "张三行含代发（1.8.5 时是 1000）");
  assert.equal(y2026.rows.find((r) => r.person.name === "张三")?.unpaid, 6000 - 1500);
  assert.equal(y2026.rows.reduce((s, r) => s + r.paid, 0), y2026.rowsPaidSum, "逐行已发之和 == rowsPaidSum");
});

test("决策一：无日期的待发放记录按「当前工作年」归集（不是整本最早年）", () => {
  const store = { year: 2026, years: [2024, 2026], attendance: [{ year: 2026 }] };
  assert.equal(fallbackPayYear(store), 2026, "取当前工作年 2026，不再取整本最早年 2024");
  assert.equal(fallbackPayYear({ years: [2024, 2026], attendance: [{ year: 2026 }] }), 2026, "没有 year 时取最近的一年");
  assert.equal(fallbackPayYear({ year: 2026, years: [2026] }), 2026);
  // 同一笔待发放跟着当前工作年走：2026 年看得到，2024 年看不到
  const y2024 = summarizeYear({ people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS, year: 2024, fallbackYear: fallbackPayYear(store) });
  assert.equal(y2024.pendingAmt, 0, "待发放不会跑到 2024 年去");
  const y2026b = summarizeYear({ people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS, year: 2026, fallbackYear: fallbackPayYear(store) });
  assert.equal(y2026b.pendingAmt, C, "2026（当前工作年）能看到全部待发放");
});

test("跨年：2025 的发放/考勤不进 2026；2025 发给无考勤者的钱也补行，逐行之和仍 == KPI", () => {
  const y2025 = summarizeYear({ people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS, year: 2025, fallbackYear: 2026 });
  assert.equal(y2025.paid, 700, "2025-12-31 那笔算 2025（钱七 2025 年没有考勤行）");
  assert.equal(y2025.proxyAmt, 0, "这笔是本人收款，没有代发");
  assert.deepEqual(y2025.offRowsPaid, { count: 0, amount: 0 });
  assert.equal(y2025.rowsPaidSum, 700, "钱七被补了一行（备注「本年无考勤记录」），逐行之和 == KPI");
  assert.equal(y2025.rowsPaidSum, y2025.paid);
  assert.equal(y2025.rows.filter((r) => r.noAttendance).map((r) => r.person.name).join(","), "钱七");
  assert.equal(y2025.pendingAmt, 0, "待发放跟当前工作年（2026）走，不落在 2025（决策一）");
});

test("班组面板的分组要覆盖所有人（含「未分班组」）", () => {
  const rows = teamRows(PEOPLE);
  assert.deepEqual(rows.map((r) => `${r.team}:${r.count}`), ["一组:3", "二组:1", "未分班组:1"]);
  assert.equal(rows.reduce((s, r) => s + r.count, 0), PEOPLE.length, "面板人数之和 == 在册人员 KPI");
});

test("Excel 整本导出：月表与汇总/工天加班表的人口径一致，汇总「已发放金额」含代发", () => {
  const wb = buildFullWorkbook({ year: 2026, people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS });
  const rows = (name: string) => XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1, blankrows: false });
  const month = rows("3月考勤");
  assert.ok(wb.Sheets["3月考勤"], "3 月要生成月表（纯备注也算有内容）");
  const monthNames = month.slice(2).map((r) => r[1]);
  assert.equal(monthNames.includes("李四"), true, "月表里有李四（只有备注的行不能丢）");
  const sum = rows("汇总");
  const sumNames = sum.slice(2).map((r) => r[1]);
  assert.equal(sumNames.includes("李四"), true, "汇总表里也要有李四（以前月表有、汇总没有）");
  assert.equal(sumNames.includes("已删的人"), false, "不在人员表的人不进汇总（Excel 是原样导出，与本页年度表口径不同）");
  // 汇总表的「已发放金额」列（序号/姓名/班组 + 12 个月 + 全年合计 之后）与年度表同口径：按实际收款人、含代发
  const zhang = sum.find((r) => r[1] === "张三");
  assert.equal(Number(zhang?.[16]), 1500, "张三 已发放金额 = 1000 + 代发 500（1.8.5 时是 1000）");
  const workNames = rows("工天加班").slice(2).map((r) => r[1]);
  assert.deepEqual(workNames.slice().sort(), sumNames.slice().sort(), "工天加班与汇总的人列完全一致");
});
