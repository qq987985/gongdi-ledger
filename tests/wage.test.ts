import { test } from "node:test";
import assert from "node:assert/strict";
import { getWageAt, hasWork, monthPay, overtimePay, parseOtRule, round2 } from "../src/lib/wage";
import type { Person } from "../src/lib/types";

function person(over: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "张三",
    team: "",
    personNo: "",
    idCard: "",
    gender: "",
    age: null,
    birthday: "",
    phone: "",
    dailyWage: 0,
    monthWage: 0,
    payType: "day",
    otRule: "",
    mealAllowance: 0,
    wageHistory: [],
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

test("round2：带 EPSILON，边界值不进位丢失", () => {
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(2.675), 2.68);
  assert.equal(round2(0.1 + 0.2), 0.3);
  assert.equal(round2(1234.5678), 1234.57);
});

test("monthPay：日薪 = 出勤天数 × 日工资", () => {
  const r = monthPay({ days: 26 }, { dailyWage: 300 });
  assert.equal(r.base, 7800);
  assert.equal(r.pay, 7800);
  assert.equal(r.monthly, false);
});

test("monthPay：餐补按正常出勤天数算", () => {
  const r = monthPay({ days: 26 }, { dailyWage: 300, mealAllowance: 12 });
  assert.equal(r.meal, 312);
  assert.equal(r.pay, 8112);
});

test("monthPay：补助与扣款参与合计", () => {
  const r = monthPay({ days: 22, allowance: 200, deduction: 50 }, { dailyWage: 300 });
  assert.equal(r.base, 6600);
  assert.equal(r.pay, 6750);
});

test("monthPay：加班按小时 / 折算两种规则", () => {
  assert.equal(monthPay({ otHours: 10 }, { dailyWage: 300, otRule: "按小时:25" }).ot, 250);
  assert.equal(monthPay({ otHours: 10 }, { dailyWage: 320, otRule: "折算:8" }).ot, 400);
  assert.equal(overtimePay(10, 300, ""), 0);
});

test("monthPay：按月计薪有出勤发月薪，无任何记录不发", () => {
  assert.equal(monthPay({ days: 20 }, { payType: "month", monthWage: 8000 }).base, 8000);
  assert.equal(monthPay({ days: 0 }, { payType: "month", monthWage: 8000 }).base, 0);
  // 注：按月计薪「0 出勤但填了补助/扣款」时仍发整月月薪（wage.ts 现有口径），此处不锁定该行为
});

test("getWageAt：29/30/31 号生效的调薪当月即生效", () => {
  const p = person({ dailyWage: 100, wageHistory: [{ id: "w", fromDate: "2026-03-31", payType: "day", dailyWage: 200, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" }] });
  assert.equal(getWageAt(p, 2026, 3).dailyWage, 200, "3/31 生效应影响 3 月");
  assert.equal(getWageAt(p, 2026, 4).dailyWage, 200);
});

test("getWageAt：次月生效的调薪不影响当月（回退到当前工资字段）", () => {
  const p = person({ dailyWage: 100, wageHistory: [{ id: "w", fromDate: "2026-04-01", payType: "day", dailyWage: 200, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" }] });
  assert.equal(getWageAt(p, 2026, 3).dailyWage, 100);
});

test("getWageAt：多条历史取查询日之前最后一条", () => {
  const p = person({
    dailyWage: 999,
    wageHistory: [
      { id: "a", fromDate: "2025-01-01", payType: "day", dailyWage: 260, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" },
      { id: "b", fromDate: "2026-06-10", payType: "day", dailyWage: 300, monthWage: 0, otRule: "", mealAllowance: 12, remark: "" },
    ],
  });
  assert.equal(getWageAt(p, 2026, 5).dailyWage, 260);
  assert.equal(getWageAt(p, 2026, 6).dailyWage, 300);
  assert.equal(getWageAt(p, 2026, 6).mealAllowance, 12);
  assert.equal(getWageAt(p, 2026, 3).dailyWage, 260);
});

test("getWageAt：2 月按实际天数（28 天）取月末", () => {
  const p = person({ dailyWage: 100, wageHistory: [{ id: "w", fromDate: "2026-02-28", payType: "day", dailyWage: 7, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" }] });
  assert.equal(getWageAt(p, 2026, 2).dailyWage, 7);
});

test("getWageAt：没有人员时返回空", () => {
  assert.deepEqual(getWageAt(null, 2026, 3), {});
});

test("parseOtRule：中文规则解析", () => {
  assert.equal(parseOtRule("按小时:25").kind, "hour");
  assert.equal(parseOtRule("按小时:25").param, 25);
  assert.equal(parseOtRule("折算:8").kind, "fold");
  assert.equal(parseOtRule("").kind, "none");
});

test("hasWork：只填补助也算有记录", () => {
  assert.equal(hasWork({ days: 0, allowance: 200 }), true);
  assert.equal(hasWork({ days: 0 }), false);
  assert.equal(hasWork(null), false);
});

test("getWageAt：fromDate 没补零（2026-7-1）也要当月生效，不再静默回退当前工资", () => {
  const p = person({ dailyWage: 100, wageHistory: [{ id: "w", fromDate: "2026-7-1", payType: "day", dailyWage: 200, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" }] });
  assert.equal(getWageAt(p, 2026, 7).dailyWage, 200, "2026-7-1 生效的调薪，2026 年 7 月就该用新工资");
  assert.equal(getWageAt(p, 2026, 6).dailyWage, 100, "生效前的月份仍用旧工资");
});

test("getWageAt：fromDate 能容忍 年/月/日、点号、空格等写法", () => {
  const mk = (fromDate: string) =>
    person({ dailyWage: 100, wageHistory: [{ id: "w", fromDate, payType: "day", dailyWage: 300, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" }] });
  for (const d of ["2026-07-01", "2026-7-1", "2026.7.1", "2026/07/01", "2026年7月1日", " 2026-07-01 "]) {
    assert.equal(getWageAt(mk(d), 2026, 7).dailyWage, 300, `${d} 应能被识别为 2026-07-01 生效`);
  }
  assert.equal(getWageAt(mk("2026-02-31"), 2026, 7).dailyWage, 100, "不存在的日期按无效处理，回退当前工资");
});

test("getWageAt：乱写的 fromDate 不参与比较（保持旧的「回退当前工资」行为）", () => {
  const p = person({ dailyWage: 100, wageHistory: [{ id: "w", fromDate: "长期", payType: "day", dailyWage: 999, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" }] });
  assert.equal(getWageAt(p, 2026, 7).dailyWage, 100);
});
