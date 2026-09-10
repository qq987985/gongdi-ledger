import { test } from "node:test";
import assert from "node:assert/strict";
import { overAgeLabel, parseIdCard, validateIdCard } from "../src/lib/idcard";

// 校验码按 GB 11643 算法算出来的可用测试号
const MALE_18 = "110101199003076173"; // 生日 1990-03-07，顺序码第 17 位为奇数 → 男
const FEMALE_18 = "110101199003076288"; // 同生日，第 17 位为偶数 → 女
const BAD_BIRTH_18 = "11010119900231001X"; // 2 月 31 日
const MALE_15 = "110101900307617"; // 15 位老证，1990-03-07
const BAD_BIRTH_15 = "110101900231617"; // 15 位，2 月 31 日

test("parseIdCard：18 位解析生日与性别", () => {
  const m = parseIdCard(MALE_18);
  assert.equal(m.birthday, "1990-03-07");
  assert.equal(m.gender, "男");
  assert.ok(typeof m.age === "number" && m.age! >= 30 && m.age! < 60, `年龄应是合理数值，实际 ${m.age}`);

  const f = parseIdCard(FEMALE_18);
  assert.equal(f.birthday, "1990-03-07");
  assert.equal(f.gender, "女");
});

test("parseIdCard：出生日期溢出（2 月 31 日）判为无效", () => {
  assert.deepEqual(parseIdCard(BAD_BIRTH_18), { gender: "", age: null, birthday: "" });
});

test("parseIdCard：输入太短不打扰（返回空信息）", () => {
  assert.deepEqual(parseIdCard("123"), { gender: "", age: null, birthday: "" });
  assert.deepEqual(parseIdCard(""), { gender: "", age: null, birthday: "" });
});

test("validateIdCard：合法的 18 位返回空字符串", () => {
  assert.equal(validateIdCard(MALE_18), "");
  assert.equal(validateIdCard(FEMALE_18), "");
});

test("validateIdCard：校验码不对要报错", () => {
  assert.match(validateIdCard("110101199003076174"), /校验码/);
});

test("validateIdCard：2 月 31 日报「出生日期无效」", () => {
  assert.match(validateIdCard(BAD_BIRTH_18), /出生日期无效/);
});

test("validateIdCard：15 位老证校验可达（曾经被长度判断挡住）", () => {
  assert.equal(validateIdCard(MALE_15), "");
  assert.match(validateIdCard(BAD_BIRTH_15), /出生日期无效/);
});

test("validateIdCard：超过 18 位报错，空值不报错", () => {
  assert.match(validateIdCard("1101011990030761731"), /18 位/);
  assert.equal(validateIdCard(""), "");
});

test("overAgeLabel：男 ≥55、女 ≥45 为超龄", () => {
  assert.equal(overAgeLabel(55, "男"), "超龄");
  assert.equal(overAgeLabel(54, "男"), "未超龄");
  assert.equal(overAgeLabel(45, "女"), "超龄");
  assert.equal(overAgeLabel(44, "女"), "未超龄");
  assert.equal(overAgeLabel(null, "男"), "");
});

test("validateIdCard：16~17 位报错（不再当成「还没输完」静默放行）", () => {
  const err = validateIdCard("1101011990010112");
  assert.match(err, /15 位或 18 位/);
  assert.match(err, /16 位/, "提示里带上实际位数，边打边看也知道差多少");
  assert.match(validateIdCard("11010119900307617"), /17 位/);
});

test("parseIdCard：16/17 位不再按 15 位解析出错误生日", () => {
  assert.deepEqual(parseIdCard("1101011990010112"), { gender: "", age: null, birthday: "" });
  assert.deepEqual(parseIdCard("11010119900307617"), { gender: "", age: null, birthday: "" });
});
