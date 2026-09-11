import { buildContractWorkbook, buildFullWorkbook, parseAttendanceSheet, parseContractWorkbook, parseFullAttendanceWorkbook, parsePeopleSheet, buildPeopleWorkbook } from "../../src/lib/excel";
import { check, eq, okv } from "./harness";
import { att, buf, contract, entry, expense, payment, person } from "./fixtures";

export function runEdge() {
  check("边界", "空台账（无人员/无考勤/无发放/无报销）导出不崩，导入回来仍是空", () => {
    const wb = buildFullWorkbook({ year: 2026, people: [], attendance: [], payments: [] });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    eq([parsed.people.length, parsed.attendance.length, parsed.payments.length, parsed.expenses.length], [0, 0, 0, 0], "空台账解析");
  });

  check("边界", "空人员名单导出不崩（只有表头）", () => {
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([])));
    eq(back.length, 0, "人员数");
  });

  check("边界", "只有一个人、没有任何考勤：整本往返人员不丢", () => {
    const wb = buildFullWorkbook({ year: 2026, people: [person()], attendance: [], payments: [] });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    eq([parsed.people.length, parsed.people[0].name, parsed.attendance.length], [1, "张三", 0], "单人无考勤");
  });

  check("边界", "考勤里出现人员名单上没有的姓名：不丢、不炸", () => {
    const wb = buildFullWorkbook({
      year: 2026, people: [person()], attendance: [att({ name: "临时工老王", month: 4 })], payments: [],
      months: [{ year: 2026, month: 4 }],
    });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    eq(parsed.attendance.map((a) => a.name), ["临时工老王"], "考勤姓名");
  });

  check("边界", "姓名含 emoji：人员表与考勤表都往返一致", () => {
    const wb = buildFullWorkbook({
      year: 2026, people: [person({ name: "张三😀" })], attendance: [att({ name: "张三😀", month: 4 })], payments: [payment({ owner: "张三😀" })],
      months: [{ year: 2026, month: 4 }],
    });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    eq([parsed.people[0].name, parsed.attendance[0].name, parsed.payments[0].owner], ["张三😀", "张三😀", "张三😀"], "emoji 姓名");
  });

  check("边界", "金额 1e9 在合同明细里往返不丢精度", () => {
    const c = contract();
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({
      contracts: [c],
      entries: [entry({ contractId: c.id, kind: "report", amount: 1e9 })],
    })));
    eq(parsed.entries.filter((e) => e.kind === "report")[0].amount, 1e9, "报量金额");
  });

  check("边界", "金额为 0 的合同明细往返后仍然存在（0 元行不能消失）", () => {
    const c2 = contract();
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({
      contracts: [c2],
      entries: [entry({ contractId: c2.id, kind: "report", amount: 0, no: "零报量" })],
    })));
    eq(parsed.entries.filter((e) => e.kind === "report").map((e) => e.amount), [0], "0 元明细");
  });

  check("边界", "日期非法（2026-13-01）在整本发放里原样保留、不丢记录、不崩", () => {
    const wb = buildFullWorkbook({ year: 2026, people: [person()], attendance: [], payments: [payment({ date: "2026-13-01" })], months: [{ year: 2026, month: 4 }] });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    eq([parsed.payments.length, parsed.payments[0].date], [1, "2026-13-01"], "非法日期发放");
  });

  check("边界", "整本导出时的空考勤 sheet 不会被读成幽灵人员", () => {
    const wb = buildFullWorkbook({ year: 2026, people: [person()], attendance: [], payments: [], months: [{ year: 2026, month: 4 }] });
    const rows = parseAttendanceSheet(buf(wb), 2026);
    eq(rows.length, 0, "考勤行数");
  });

  check("边界", "报销金额 0 / 负数在整本里往返不变", () => {
    const wb = buildFullWorkbook({
      year: 2026, people: [person()], attendance: [], payments: [],
      expenses: [expense({ amount: 0, qty: 0, price: 0 }), expense({ id: "x2", name: "退款", amount: -200, qty: 1, price: -200 })],
      months: [{ year: 2026, month: 4 }],
    });
    const rows = parseFullAttendanceWorkbook(buf(wb), 2026).expenses;
    eq(rows.map((e) => e.amount), [0, -200], "报销金额");
  });

  check("边界", "超长姓名（60 字）与超长备注往返不截断", () => {
    const longName = "张".repeat(60);
    const back = parsePeopleSheet(buf(buildPeopleWorkbook([person({ name: longName })])))[0];
    eq(back.name.length, 60, "姓名长度");
  });
}
