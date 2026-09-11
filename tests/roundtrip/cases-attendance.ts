import { buildFullWorkbook, parseAttendanceSheet, parseFullAttendanceWorkbook } from "../../src/lib/excel";
import { check, eq, okv } from "./harness";
import { att, buf, handWb, person } from "./fixtures";

export function runAttendance() {
  check("考勤", "单月 sheet（无年份）按传入年份入库，月/天/加班/补助/扣款正确", () => {
    const wb = handWb("3月考勤", [
      ["2026年3月考勤"],
      ["序号", "姓名", "班组", "出勤天数", "加班小时", "补助", "扣款", "备注"],
      [1, "张三", "一班", 26, 12, 200, 0, "满勤"],
    ]);
    const rows = parseAttendanceSheet(buf(wb), 2026);
    eq(rows.map((r) => [r.year, r.month, r.name, r.team, r.days, r.otHours, r.allowance, r.deduction, r.remark]),
      [[2026, 3, "张三", "一班", 26, 12, 200, 0, "满勤"]], "考勤行");
  });

  check("考勤", "sheet 名带年份「2025年3月考勤」必须落到 2025（即使传入年份是 2026）", () => {
    const wb = handWb("2025年3月考勤", [
      ["姓名", "出勤天数", "加班小时", "补助", "扣款"],
      ["张三", 20, 0, 0, 0],
    ]);
    const rows = parseAttendanceSheet(buf(wb), 2026);
    eq(rows.map((r) => [r.year, r.month]), [[2025, 3]], "年月");
  });

  check("考勤", "整本导出→整本导入：跨年考勤各归各年（2025-3 / 2026-4）", () => {
    const attendance = [att({ year: 2025, month: 3, days: 20 }), att({ year: 2026, month: 4, days: 22 })];
    const wb = buildFullWorkbook({
      year: 2026, people: [person()], attendance, payments: [],
      months: [{ year: 2025, month: 3 }, { year: 2026, month: 4 }],
    });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    eq(parsed.attendance.map((a) => `${a.year}-${a.month}/${a.days}`).sort(), ["2025-3/20", "2026-4/22"], "跨年考勤");
  });

  check("考勤", "整本导出→整本导入：单月数值（天数/加班/补助/扣款/备注）不丢", () => {
    const wb = buildFullWorkbook({
      year: 2026, people: [person()],
      attendance: [att({ days: 21.5, otHours: 8.5, allowance: 300, deduction: 66.66, remark: "含雨天" })],
      payments: [],
    });
    const a = parseFullAttendanceWorkbook(buf(wb), 2026).attendance[0];
    eq([a.days, a.otHours, a.allowance, a.deduction, a.remark], [21.5, 8.5, 300, 66.66, "含雨天"], "考勤数值");
  });

  check("考勤", "重复导入同一份整本考勤不翻倍（复刻 FullBookImport 的按 姓名+年+月 去重）", () => {
    const wb = buildFullWorkbook({
      year: 2026, people: [person()], attendance: [att(), att({ month: 5, days: 18 })], payments: [],
      months: [{ year: 2026, month: 4 }, { year: 2026, month: 5 }],
    });
    const parsed = parseFullAttendanceWorkbook(buf(wb), 2026);
    let store: any[] = [];
    const merge = () => {
      const names = new Set(parsed.attendance.map((a) => a.name + a.year + a.month));
      store = [...store.filter((a) => !names.has(a.name + a.year + a.month)), ...parsed.attendance];
    };
    merge(); merge();
    eq(store.length, 2, "两次导入后的考勤条数");
  });

  check("考勤", "导入软件自己导出的「考勤表」（含 12 个月 + 汇总 + 工天加班）不得产生月=0 的幽灵考勤行", () => {
    const wb = buildFullWorkbook({
      year: 2025, people: [person(), person({ name: "李四", personNo: "D2" })],
      attendance: [att({ year: 2025, month: 3, name: "张三" }), att({ year: 2025, month: 3, name: "李四", days: 10 })],
      payments: [], skipPeople: true, skipPay: true, skipExp: true,
    });
    const rows = parseAttendanceSheet(buf(wb), 2025);
    const ghost = rows.filter((r) => !(r.month >= 1 && r.month <= 12));
    okv(ghost.length === 0, `产生了 ${ghost.length} 条幽灵行（month=0），例：${JSON.stringify(ghost[0] || {})}；总行数 ${rows.length}`);
  });

  check("考勤", "只有备注、没有工天的考勤行（如「工伤休息」）导出→导入后不丢", () => {
    const wb = buildFullWorkbook({
      year: 2026, people: [person()],
      attendance: [att({ days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "工伤休息" })],
      payments: [],
    });
    const rows = parseFullAttendanceWorkbook(buf(wb), 2026).attendance;
    eq(rows.map((r) => r.remark), ["工伤休息"], "考勤备注行");
  });

  check("考勤", "「合计」行不算一条考勤记录", () => {
    const wb = handWb("3月考勤", [["姓名", "出勤天数", "加班小时", "补助", "扣款"], ["合计", 46, 20, 200, 0]]);
    eq(parseAttendanceSheet(buf(wb), 2026).length, 0, "考勤行数");
  });


}
