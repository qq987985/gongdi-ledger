import { test } from "node:test";
import assert from "node:assert/strict";
import { datePart, memberDays, isActive, prevDayEnd, emptyPolicy, emptyMember } from "../src/lib/insurance";
import { daysBetween, localToday } from "../src/lib/dates";
import type { InsuranceMember } from "../src/lib/types";

function m(partial: Partial<InsuranceMember>): InsuranceMember {
  return { id: "m1", policyId: "p1", name: "张三", leader: "", startDate: "", endDate: "", remark: "", ...partial };
}

test("datePart：取年月日，空值安全", () => {
  assert.equal(datePart("2026-09-14 18:00"), "2026-09-14");
  assert.equal(datePart("2026-09-14"), "2026-09-14");
  assert.equal(datePart(""), "");
});

test("memberDays：当天算 1 天，区间含首尾", () => {
  assert.equal(memberDays(m({ startDate: "2026-03-01", endDate: "2026-03-01" })), 1);
  assert.equal(memberDays(m({ startDate: "2026-03-01", endDate: "2026-03-10" })), 10);
});

test("memberDays：结束为空算到今天", () => {
  const md = memberDays(m({ startDate: "2026-03-01", endDate: "" }));
  assert.equal(md, daysBetween("2026-03-01", localToday()));
  assert.ok(md >= 1);
});

test("memberDays：夹紧到保单期，越界部分不计（防结算超保费）", () => {
  const clamp = { start: "2026-03-05 00:00", end: "2026-03-20 23:59" };
  // 开始早于保单期 → 从保单期起算
  assert.equal(memberDays(m({ startDate: "2026-02-01", endDate: "2026-03-31" }), clamp), 16);
  // 结束晚于保单期 → 截到保单期末
  assert.equal(memberDays(m({ startDate: "2026-03-10", endDate: "2026-04-30" }), clamp), 11);
  // 两头都越界 → 整个保单期
  assert.equal(memberDays(m({ startDate: "2026-01-01", endDate: "2026-12-31" }), clamp), 16);
  // 开始为空 → 用保单期开始
  assert.equal(memberDays(m({ startDate: "", endDate: "2026-03-10" }), clamp), 6);
  // 完全在保单期外 → 夹紧后 start > end，为 0
  assert.equal(memberDays(m({ startDate: "2026-05-01", endDate: "2026-05-31" }), clamp), 0);
});

test("memberDays：开始晚于结束为 0", () => {
  assert.equal(memberDays(m({ startDate: "2026-03-10", endDate: "2026-03-01" })), 0);
});

test("isActive：无结束日期恒在保；有结束日期按天比较（不看时分）", () => {
  const today = localToday();
  assert.equal(isActive(m({ endDate: "" })), true);
  assert.equal(isActive(m({ endDate: `${today} 23:59` })), true, "今天结束仍在保");
  const tomorrow = new Date(`${today}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.toISOString().slice(0, 10);
  assert.equal(isActive(m({ endDate: y })), true);
  const yesterday = new Date(`${today}T00:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const z = yesterday.toISOString().slice(0, 10);
  assert.equal(isActive(m({ endDate: z })), false);
  assert.equal(isActive(m({ endDate: z + " 23:59" })), false, "昨天 23:59 也已过期");
});

test("prevDayEnd：前一天 23:59，跨月跨年对，空值返回空", () => {
  assert.equal(prevDayEnd("2026-03-01"), "2026-02-28 23:59");
  assert.equal(prevDayEnd("2026-01-01"), "2025-12-31 23:59");
  assert.equal(prevDayEnd("2026-03-01 08:00"), "2026-02-28 23:59", "带时间只看日期");
  assert.equal(prevDayEnd(""), "");
});

test("emptyPolicy / emptyMember：默认值齐全，开始时间为今天 00:00", () => {
  const p = emptyPolicy();
  assert.equal(p.id, "");
  assert.equal(p.premiumPerPerson, 0);
  assert.equal(p.headcount, 0);
  assert.equal(p.periodStart, `${localToday()} 00:00`);
  assert.equal(p.periodEnd, "");
  assert.deepEqual(p.contracts, []);
  assert.equal(p.linkedPolicyId, "");
  const mem = emptyMember("p9");
  assert.equal(mem.policyId, "p9");
  assert.equal(mem.startDate, `${localToday()} 00:00`);
  assert.equal(mem.endDate, "");
});
