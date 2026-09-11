import { test } from "node:test";
import assert from "node:assert/strict";
import { daysBetween, daysInMonth, excelSerialYmd, isValidYear, localToday, parseDateYmd, ymd } from "../src/lib/dates";

test("daysBetween：只写日期时按含首尾的整天算", () => {
  assert.equal(daysBetween("2026-01-01", "2026-01-01"), 1, "当天算 1 天");
  assert.equal(daysBetween("2026-01-01", "2026-01-10"), 10);
  assert.equal(daysBetween("2026-02-01", "2026-03-01"), 29, "2 月 + 3/1，含首尾");
  assert.equal(daysBetween("2026-01-01", "2026-12-31"), 365, "2026 不是闰年");
});

test("daysBetween：带时间时按实际时长折算（保留 2 位）", () => {
  assert.equal(daysBetween("2026-01-01 00:00", "2026-01-02 00:00"), 1);
  assert.equal(daysBetween("2026-01-01 08:00", "2026-01-01 18:00"), 0.42);
});

test("daysBetween：非法或空输入返回 0", () => {
  assert.equal(daysBetween("", "2026-01-01"), 0);
  assert.equal(daysBetween("2026-01-01", "不是日期"), 0);
});

test("parseDateYmd：常见写法归一为 YYYY-MM-DD", () => {
  assert.equal(parseDateYmd("2026-1-5"), "2026-01-05");
  assert.equal(parseDateYmd("2026/01/05"), "2026-01-05");
  assert.equal(parseDateYmd("2026年1月5日"), "2026-01-05");
  assert.equal(parseDateYmd("2026-01-05 13:20:00"), "2026-01-05");
});

test("parseDateYmd：Excel 序列号与空值", () => {
  assert.equal(parseDateYmd(45000), "2023-03-15");
  assert.equal(parseDateYmd(""), "");
  assert.equal(parseDateYmd("长期"), "");
});

test("parseDateYmd：月份越界直接判空", () => {
  assert.equal(parseDateYmd("2026-13-05"), "");
  assert.equal(parseDateYmd("2026-00-05"), "");
});

test("excelSerialYmd：1954 年之前的序列号不支持（返回空）", () => {
  assert.equal(excelSerialYmd(18264), "");
  assert.equal(excelSerialYmd(45000), "2023-03-15");
});

test("localToday：返回本地 YYYY-MM-DD（东八区 0-8 点不差一天）", () => {
  assert.match(localToday(), /^\d{4}-\d{2}-\d{2}$/);
});

test("日期校验：不存在的日期一律判空（不再被 daysBetween 进位放大）", () => {
  assert.equal(parseDateYmd("2026-02-31"), "", "2 月没有 31 日");
  assert.equal(parseDateYmd("2026-04-31"), "", "4 月没有 31 日");
  assert.equal(parseDateYmd("2026-02-29"), "", "2026 不是闰年");
  assert.equal(parseDateYmd("2024-02-29"), "2024-02-29", "2024 是闰年，2/29 合法");
  assert.equal(parseDateYmd("2026-12-31"), "2026-12-31", "年末正常日期不受影响");
  assert.equal(daysBetween("2026-01-01", "2026-02-31"), 0, "非法日期不再被当成 3/3 算成 59 天");
});

test("daysInMonth：闰年与大小月", () => {
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2026, 2), 28);
  assert.equal(daysInMonth(2026, 4), 30);
  assert.equal(daysInMonth(2026, 12), 31);
  assert.equal(daysInMonth(2026, 13), 0);
  assert.equal(ymd(2026, 13, 1), "");
  assert.equal(ymd(2026, 2, 29), "");
  assert.equal(ymd(2024, 2, 29), "2024-02-29");
});

test("isValidYear：NaN / 非整数 / 越界都要挡住（NaN 曾绕过范围比较写坏台账）", () => {
  assert.equal(isValidYear(2026), true);
  assert.equal(isValidYear(2000), true);
  assert.equal(isValidYear(2100), true);
  for (const bad of [NaN, undefined, null, "2026", 2026.5, 0, 1999, 2101, Infinity, -1]) {
    assert.equal(isValidYear(bad), false, `${String(bad)} 不该通过`);
  }
  assert.equal(Number("abc") < 2000 || Number("abc") > 2100, false, "旧写法确实挡不住 NaN");
});
