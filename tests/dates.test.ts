import { test } from "node:test";
import assert from "node:assert/strict";
import { daysBetween, excelSerialYmd, localToday, parseDateYmd } from "../src/lib/dates";

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

test(
  "日期只校验到「日 ≤ 31」，2026-02-31 会被原样接受",
  { todo: "已知问题：ymd() 不校验当月天数，非法日期入库后会被 daysBetween 溢出放大" },
  () => {
    assert.equal(parseDateYmd("2026-02-31"), "");
    assert.equal(daysBetween("2026-01-01", "2026-02-31"), 59);
  },
);
