import { test } from "node:test";
import assert from "node:assert/strict";
import { cn, uid, money, formatCardNo, copyText, toggleSel, confirmBatchDelete } from "../src/lib/utils";

test("uid：UUID 格式且互不重复", () => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const ids = new Set(Array.from({ length: 500 }, () => uid()));
  assert.equal(ids.size, 500, "500 个 id 应全不同");
  for (const id of ids) assert.match(id, re);
});

test("money：千分位 + 两位小数", () => {
  assert.equal(money(1234567.891), "1,234,567.89");
  assert.equal(money(0), "0.00");
  assert.equal(money(-350.5), "-350.50");
});

test("formatCardNo：每 4 位分组，仅展示用", () => {
  assert.equal(formatCardNo("6222020200112233"), "6222 0202 0011 2233");
  assert.equal(formatCardNo("6222 0202 0011 2233"), "6222 0202 0011 2233", "已分组的原样返回");
  assert.equal(formatCardNo("12345"), "1234 5");
  assert.equal(formatCardNo(""), "");
  assert.equal(formatCardNo(null), "");
  assert.equal(formatCardNo("abc123"), "abc123", "非纯数字不动");
});

test("toggleSel：勾选去重、取消移除、不改原数组", () => {
  const base = ["a", "b"];
  assert.deepEqual(toggleSel(base, "c", true), ["a", "b", "c"]);
  assert.deepEqual(toggleSel(base, "a", true), ["a", "b"], "已选中的再勾不变");
  assert.deepEqual(toggleSel(base, "a", false), ["b"]);
  assert.deepEqual(base, ["a", "b"], "原数组不被修改");
});

test("cn：tailwind 类合并冲突取后者", () => {
  assert.equal(cn("px-2", "px-4"), "px-4");
  assert.equal(cn("btn", false && "hidden", "x"), "btn x");
});

test("copyText / confirmBatchDelete：无浏览器环境安全返回 false（不抛）", () => {
  assert.equal(copyText("anything"), false);
  assert.equal(copyText(""), false);
  assert.equal(confirmBatchDelete("报销", 3), false);
  assert.equal(confirmBatchDelete("报销", 0), false);
});
