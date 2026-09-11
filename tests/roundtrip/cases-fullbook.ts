import { buildFullWorkbook, mergeExpenses, mergePayments, parseAttendanceSheet, parseFullAttendanceWorkbook } from "../../src/lib/excel";
import { check, eq, okv } from "./harness";
import { att, buf, expense, member, payment, person, policy } from "./fixtures";

export function runFullBook() {
  check("整本", "整本导出→整本导入：人员/考勤/发放/报销/保险 一个模块都不丢，数值抽样正确", () => {
    const p1 = person();
    const p2 = person({ name: "李四", personNo: "D2", team: "二班" });
    const pol = policy();
    const wb = buildFullWorkbook({
      year: 2026,
      people: [p1, p2],
      attendance: [att({ name: "张三", month: 4 }), att({ name: "李四", month: 4, days: 18 })],
      payments: [payment(), payment({ id: "p2", owner: "李四", amount: 8000 })],
      expenses: [expense(), expense({ id: "x2", name: "差旅", amount: 1200, qty: 1, price: 1200 })],
      insurancePolicies: [pol],
      insuranceMembers: [member({ policyId: pol.id, name: "张三" }), member({ policyId: pol.id, name: "李四", endDate: "2026-08-31" })],
      months: [{ year: 2026, month: 4 }],
    });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    eq(
      [parsed.people.length, parsed.attendance.length, parsed.payments.length, parsed.expenses.length, parsed.policies.length, parsed.members.length],
      [2, 2, 2, 2, 1, 2],
      "整本模块条数",
    );
    eq([parsed.people[0].name, parsed.people[1].name], ["张三", "李四"], "人员");
    eq(parsed.attendance.map((a) => [a.name, a.month, a.days]), [["张三", 4, 22], ["李四", 4, 18]], "考勤");
    eq(parsed.payments.map((p) => p.amount), [10000, 8000], "发放金额");
    eq(parsed.expenses.map((e) => e.amount), [300, 1200], "报销金额");
    okv(parsed.policies[0].policyNo === "P-2026-001", "保单号");
  });

  check("整本", "整本导出→整本导入：两年考勤 sheet 互不串（2025 的行不能落到 2026）", () => {
    const wb = buildFullWorkbook({
      year: 2025, people: [person()],
      attendance: [att({ year: 2025, month: 3, days: 20 }), att({ year: 2026, month: 3, days: 30 })],
      payments: [],
      months: [{ year: 2025, month: 3 }, { year: 2026, month: 3 }],
    });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2025);
    eq(parsed.attendance.map((a) => [a.year, a.month, a.days]).sort(), [[2025, 3, 20], [2026, 3, 30]], "两年考勤");
  });

  check("整本", "单年度整本备份/考勤导出（sheet 名不带年份）在导入年份不同时，考勤年份不能被改", () => {
    const wb = buildFullWorkbook({
      year: 2025, people: [person()],
      attendance: [att({ year: 2025, month: 3, days: 20 }), att({ year: 2025, month: 7, days: 15 })],
      payments: [],
    });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    const attOnly = buildFullWorkbook({
      year: 2025, people: [person()], attendance: [att({ year: 2025, month: 3, days: 20 })],
      payments: [], skipPeople: true, skipPay: true, skipExp: true,
    });
    const viaAttImport = parseAttendanceSheet(buf(attOnly), 2026);
    eq(
      [[...new Set(parsed.attendance.map((a) => a.year))], [...new Set(viaAttImport.map((a) => a.year))]],
      [[2025], [2025]],
      "整本导入 / 导入考勤 两条入口解析出的年份（fallback=2026，文件标题是「2025年3月考勤」）",
    );
  });

  check("整本", "重复导入同一份整本：发放/报销记录不翻倍（走真实 mergePayments / mergeExpenses）", () => {
    const pwb = buildFullWorkbook({
      year: 2026, people: [person()], attendance: [], payments: [payment(), payment({ id: "p2", owner: "李四", amount: 8000 })],
      months: [{ year: 2026, month: 4 }],
    });
    const ewb = buildFullWorkbook({
      year: 2026, people: [person()], attendance: [], payments: [], expenses: [expense()],
      months: [{ year: 2026, month: 4 }],
    });
    const pp = parseFullAttendanceWorkbook(buf(pwb), 2026);
    const pe = parseFullAttendanceWorkbook(buf(ewb), 2026);
    let pays: any[] = [];
    let exps: any[] = [];
    const merge = () => {
      pays = mergePayments(pays, pp.payments).merged;
      exps = mergeExpenses(exps, pe.expenses || []).merged;
    };
    merge(); merge();
    eq([pays.length, exps.length], [2, 1], "两次导入后的发放/报销条数（第一次 2 条 / 1 条）");
  });
}
