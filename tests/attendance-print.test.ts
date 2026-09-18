/**
 * 打印入口专项（B16，1.8.15）：考勤月表 / 全年月表 / 年度工资汇总 / 人员名单。
 *
 * 两个必须钉住的东西：
 * ① **纸上不许自己算**（口径一致性专项 20260916 的同一理由）：屏幕月表页脚与打印月表表尾
 *    的合计走 `monthTotals()` 同一个函数；「打印全年月表」的分月表由 `monthPrintTables()`
 *    只搬运 `summarizeYear()` 已经算好的 `MonthCell`。这里逐格断言两张表对得上，
 *    合计 == 各行相加（`round2` 口径），空月份不出现。
 * ② **新入口真的接上了打印分离**（屏幕内容 no-print / 打印件在包裹外 / 按钮不受编辑权限限制）：
 *    这部分在 `tests/ui-guards.test.ts`（那里已有打印分离的判据与命中数下限），
 *    本文件管数据口径与「同名不同源」这类数字问题。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { monthPrintTables, monthTotals } from "../src/lib/attendance-month";
import { MONTH_SHEET_COLS, PAYROLL_COLS, ROSTER_COLS, YEAR_MONTHS_COLS } from "../src/lib/print-cols";
import { summarizeYear } from "../src/lib/attendance-summary";
import { round2 } from "../src/lib/wage";
import { expectMinHits, expectRegexCatches } from "./min-hits";
import type { AttendanceRow, Payment, Person } from "../src/lib/types";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const read = (p: string) => readFile(repo(p), "utf8");

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
  person({ id: "u1", name: "张三", dailyWage: 300, mealAllowance: 20, otRule: "按小时:25" }),
  person({ id: "u2", name: "李四", dailyWage: 200 }),
  person({ id: "u3", name: "王五", team: "二组" }), // 全年没有考勤，只有一笔已发 → 决策二的补行
];

const ATTENDANCE: AttendanceRow[] = [
  att({ id: "a1", name: "张三", year: 2026, month: 3, days: 20, otHours: 8 }), // 6000 + 加班 + 餐补
  att({ id: "a2", name: "李四", year: 2026, month: 3, days: 10, allowance: 100, deduction: 50 }),
  att({ id: "a3", name: "李四", year: 2026, month: 4, days: 12 }),
  att({ id: "a4", name: "张三", year: 2026, month: 4, days: 0, remark: "只写了备注" }),
];

const PAYMENTS: Payment[] = [pay({ id: "p1", owner: "王五", receiver: "王五", date: "2026-06-01", amount: 800 })];

const YEAR = summarizeYear({ people: PEOPLE, attendance: ATTENDANCE, payments: PAYMENTS, year: 2026, fallbackYear: 2026 });

test("monthTotals：屏幕月表页脚与打印表尾的合计唯一实现（round2，逐项相加）", () => {
  const rows = [
    { days: 20, allowance: 440, deduction: 0, ot: 200.5, meal: 400, pay: 7040.5 },
    { days: 10.5, allowance: 100, deduction: 50.25, ot: 0, meal: 210, pay: 3260.25 },
  ];
  assert.deepEqual(monthTotals(rows), {
    people: 2,
    days: 30.5,
    ot: 200.5,
    meal: 610,
    allowance: 540,
    deduction: 50.25,
    pay: round2(7040.5 + 3260.25),
  });
  // 空表：人数 0、金额 0（打印件据此不渲染，页面按钮也是 disabled）
  assert.deepEqual(monthTotals([]), { people: 0, days: 0, ot: 0, meal: 0, allowance: 0, deduction: 0, pay: 0 });
  // 浮点尾差不许漏到纸上：0.1 + 0.2 必须印成 0.30 而不是 0.30000000000000004
  const dust = monthTotals([{ days: 0, allowance: 0, deduction: 0, ot: 0, meal: 0, pay: 0.1 }, { days: 0, allowance: 0, deduction: 0, ot: 0, meal: 0, pay: 0.2 }]);
  assert.equal(dust.pay, 0.3);
});

test("monthPrintTables：逐格 == 年度汇总行（同一份 MonthCell），只列有记录的月份与人员", () => {
  const tables = monthPrintTables(YEAR.rows);
  assert.deepEqual(
    tables.map((t) => t.month),
    [3, 4],
    "只有 3 月、4 月有出勤记录；5–12 月与 1–2 月不许凭空出现",
  );
  const march = tables[0];
  assert.deepEqual(
    march.rows.map((r) => r.name),
    ["张三", "李四"],
    "3 月只有这两个人有记录（王五本年没有考勤，不进分月表）",
  );
  // 逐格与年度表屏幕上的数字同源：rows[i].months[month-1]
  for (const t of tables) {
    for (const r of t.rows) {
      const cell = YEAR.rows.find((x) => x.person.name === r.name)!.months[t.month - 1];
      assert.equal(r.days, cell.days, `${t.month} 月 ${r.name} 的出勤天数必须与年度表一致`);
      assert.equal(r.otHours, cell.otHours, `${t.month} 月 ${r.name} 的加班小时必须与年度表一致`);
      assert.equal(r.pay, cell.pay, `${t.month} 月 ${r.name} 的应发必须与年度表一致`);
    }
  }
  // 只写了备注的行（4 月张三：0 工天 + 备注）在这份「分月月表」里不出现 —— 备注没有列，
  // 列出来会是一行全 0 的空行；月份本身仍在（李四 4 月有工天）
  assert.deepEqual(tables[1].rows.map((r) => r.name), ["李四"]);
});

test("monthPrintTables：每月应发之和 == 年度表该月逐行之和（不许出现第二套口径）", () => {
  const tables = monthPrintTables(YEAR.rows);
  for (const t of tables) {
    const inSheet = round2(t.rows.reduce((s, r) => s + r.pay, 0));
    const inYear = round2(YEAR.rows.reduce((s, r) => s + r.months[t.month - 1].pay, 0));
    assert.equal(inSheet, inYear, `${t.month} 月：分月表合计 ${inSheet} 必须等于年度表该月之和 ${inYear}`);
  }
  // 全年：所有分月表的应发之和 == 年度表「应发合计」（summarizeYear.should）
  const all = round2(tables.reduce((s, t) => s + t.rows.reduce((x, r) => x + r.pay, 0), 0));
  assert.equal(all, YEAR.should, "分月表逐月相加 == 年度表的应发合计");
});

test("年度工资汇总的「未发合计」= 应发合计 − 已发放（页面与打印件同一个数）", () => {
  // 页面 attendance.tsx 的写法：round2(should - paid)，表尾印的就是它 —— 这里钉住口径
  const unpaidTotal = round2(YEAR.should - YEAR.paid);
  assert.equal(unpaidTotal, round2(YEAR.rows.reduce((s, r) => s + r.unpaid, 0)), "逐行未发之和 == 应发合计 − 已发放");
  const att = read("src/routes/attendance.tsx");
  return att.then((src) => {
    assert.match(src, /const unpaidTotal = round2\(should - paid\)/, "页面上必须有这一句（打印件不许自己算）");
    assert.match(src, /unpaidTotal=\{unpaidTotal\}/, "未发合计要传给打印件");
  });
});

test("源码守卫：打印件自己不算数（不许出现 reduce/Math 汇总，合计只能靠 props）", async () => {
  const sheet = await read("src/components/ledger-print-sheets.tsx");
  const code = sheet
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
  const reduceRe = /\.reduce\(/;
  const round2Re = /round2\(/;
  // 反向自检：这两个正则在坏样本上必须命中（否则「0 命中」没有意义）
  expectRegexCatches(reduceRe, "const total = rows.reduce((s, r) => s + r.pay, 0);", "打印件「自己算合计」的坏写法");
  expectRegexCatches(round2Re, "const pay = round2(days * wage);", "打印件「自己取整」的坏写法");
  assert.doesNotMatch(code, reduceRe, "打印件里出现了 .reduce( —— 合计必须由页面（lib/attendance-month.ts）算好传进来");
  assert.doesNotMatch(code, round2Re, "打印件里出现了 round2( —— 金额取整属于计算，不属于排版");
  // 正面证据：四个打印件都在、都用 .print-only，并且抬头都写在 <thead> 里（跨页重复，1.8.11）
  expectMinHits("打印件数量（AttendanceMonthSheet / AttendanceMonthsYearSheet / PayrollYearSheet / PeopleRosterSheet）", (sheet.match(/export function [A-Z]\w+Sheet\(/g) || []).length, 4, "现有 4 个（1.8.15 新增）");
  expectMinHits("打印件里的 .print-only 包裹数", (sheet.match(/className="print-only/g) || []).length, 4, "每个打印件一个，屏幕态隐藏");
  expectMinHits("写在 <thead> 第一行的单据抬头数（colSpan，跨页重复、裁开也认得出）", (sheet.match(/CAPTION\} colSpan=/g) || []).length, 4, "四个打印件各一处（1.8.15 新增）");
});

test("源码守卫：人员名单不印身份证与银行卡（纸面会贴墙、会交出去）", async () => {
  const sheet = await read("src/components/ledger-print-sheets.tsx");
  const seg = sheet.slice(sheet.indexOf("export function PeopleRosterSheet"));
  assert.doesNotMatch(seg, /\bp\.idCard\b/, "人员名单里不许出现身份证号");
  assert.doesNotMatch(seg, /\bp\.cardNo\b/, "人员名单里不许出现银行卡号");
  assert.doesNotMatch(seg, /\bp\.bank\b/, "人员名单里不许出现开户行");
  assert.match(seg, /本表不含身份证号与银行卡号/, "抬头要写明为什么不印（用户看得见的口径）");
});

test("打印表格列宽必须正好加满 100%，且单列不低于 4%（打印纸不能横向滚动）", () => {
  // 背景：这几张新表会出现长文本（考勤备注、加班规则）。默认自动列宽会被长文本撑到纸面之外，
  // 右侧几列**静默被裁**；所以组件用 table-layout:fixed + <colgroup>，列宽加满 100% 才不溢出、
  // 4% 仅是短列下限；金额还需单独留足合计宽度，并以真实 PDF 验证。
  const groups: [string, number[], number][] = [
    ["考勤月表（12 列）", MONTH_SHEET_COLS, 12],
    ["全年月表·每月一块（6 列）", YEAR_MONTHS_COLS, 6],
    ["年度工资汇总（7 列）", PAYROLL_COLS, 7],
    ["人员名单（11 列）", ROSTER_COLS, 11],
  ];
  for (const [what, cols, count] of groups) {
    assert.equal(cols.length, count, `${what} 的列宽个数必须等于列数`);
    assert.equal(round2(cols.reduce((s, x) => s + x, 0)), 100, `${what} 的列宽百分比必须正好加满 100（少了右边留空，多了溢出被裁）`);
    assert.equal(Math.min(...cols) >= 4, true, `${what} 的单列不许低于 4%（短列的基础可读性）`);
  }
  // 组件必须真的用上这些常量（改了 lib 却忘了接 = 纸面照旧溢出）
  return read("src/components/ledger-print-sheets.tsx").then((sheet) => {
    for (const name of ["MONTH_SHEET_COLS", "YEAR_MONTHS_COLS", "PAYROLL_COLS", "ROSTER_COLS"]) {
      assert.match(sheet, new RegExp(`\\{${name}\\.map\\(`), `${name} 没有接进打印件`);
    }
    expectMinHits("打印件里 table-fixed 的表数（长文本必须在自己格子里换行，不许把表撑出纸面）", (sheet.match(/table-fixed/g) || []).length, 4, "四个打印件各一处");
    expectMinHits("打印件里 <colgroup> 数", (sheet.match(/<colgroup>/g) || []).length, 4, "四个打印件各一处");
  });
});

test("考勤月表金额列为合计留宽，行内与页脚共用紧凑金额样式（真实 PDF 曾出现合计串列）", async () => {
  const moneyColumns = [5, 6, 8, 9];
  expectMinHits("月表普通金额列", moneyColumns.length, 4, "补助、扣款、加班费、餐补");
  for (const column of moneyColumns)
    assert.ok(MONTH_SHEET_COLS[column] >= 8, `第 ${column + 1} 列需留足含千位符的合计宽度`);
  assert.ok(MONTH_SHEET_COLS[10] >= 11, "应发合计 101,760.00 等长金额不能沿用单人金额列宽");

  const sheet = await read("src/components/ledger-print-sheets.tsx");
  const style = sheet.match(/const MONTH_MONEY_TD = "([^"]+)"/)?.[1] ?? "";
  assert.match(style, /\bpx-0\.5\b/, "月表金额两侧仅留 2px，保留字号与千位符");
  assert.match(style, /\btabular-nums\b/);
  assert.match(style, /\btext-right\b/);
  assert.match(style, /\bwhitespace-nowrap\b/, "金额不可在逗号处折成两行");
  const month = sheet.slice(sheet.indexOf("export function AttendanceMonthSheet"), sheet.indexOf("export function AttendanceMonthsYearSheet"));
  const moneyCell = /<td className=[^\n>]*\bMONTH_MONEY_TD\b[^\n>]*>\{money\((r|totals)\.(allowance|deduction|ot|meal|pay)\)\}<\/td>/g;
  const cells = [...month.matchAll(moneyCell)];
  expectMinHits("月表紧凑金额格", cells.length, 10, "5 个行内金额 + 5 个合计金额，均保持 money 格式化");
  for (const source of ["r", "totals"])
    assert.deepEqual(cells.filter((cell) => cell[1] === source).map((cell) => cell[2]).sort(), ["allowance", "deduction", "meal", "ot", "pay"]);
});
