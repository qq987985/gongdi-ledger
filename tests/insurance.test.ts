import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  datePart,
  memberDays,
  isActive,
  periodHasNoDays,
  periodUnsetNotice,
  prevDayEnd,
  emptyPolicy,
  emptyMember,
} from "../src/lib/insurance";
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

/* ── B-12①（1.8.14）：保险期算不出天数时，保费全为 0 必须给出原因 ── */

test("B-12① periodUnsetNotice：结束日期为空 / 没开始 / 结束早于开始 → 明确提示；正常保险期 → 空串", () => {
  const today = localToday();
  assert.equal(periodUnsetNotice({ periodStart: `${today} 00:00`, periodEnd: "" }), "保险期结束日期未填：算不出保险期天数，本单每个人的保费都是 0。请先在「编辑保单」里补上结束日期。");
  assert.match(periodUnsetNotice({ periodStart: "", periodEnd: `${today} 23:59` }), /开始日期未填/);
  assert.match(periodUnsetNotice({ periodStart: "2026-03-10", periodEnd: "2026-03-01" }), /早于开始日期/);
  assert.equal(periodUnsetNotice({ periodStart: "2026-03-01", periodEnd: "2026-03-10" }), "", "正常保险期不出提示");
  assert.equal(periodUnsetNotice({ periodStart: "2026-03-01 00:00", periodEnd: "2026-03-01 23:59" }), "", "当天一天也算正常");
  assert.equal(periodUnsetNotice(null), "", "没有选中保单时不出提示");
  // 口径不变：periodEnd 为空时保险期天数就是 0（提示只是把「为什么是 0」写出来）
  assert.equal(daysBetween("2026-03-01 00:00", ""), 0);
  assert.equal(periodHasNoDays({ periodStart: "2026-03-01", periodEnd: "" }), true);
  assert.equal(periodHasNoDays({ periodStart: "2026-03-01", periodEnd: "2026-03-10" }), false);
  // emptyPolicy 的默认值正是「结束日期未填」→ 新建保单就会有这句提示（不是静默 0）
  assert.match(periodUnsetNotice(emptyPolicy()), /结束日期未填/);
});

test("B-12① 源码守卫：屏幕与打印件都必须显示这句提示（不许只有一串 0）", async () => {
  const page = await readFile(fileURLToPath(new URL("../src/routes/insurance.tsx", import.meta.url)), "utf8");
  assert.match(page, /periodUnsetNotice\(selected\)/, "页面要算这句提示");
  const hits = (page.match(/\{periodNotice \?/g) || []).length;
  assert.equal(hits >= 2, true, `屏幕 + 打印件两处都要显示（实际 ${hits} 处）`);
  assert.match(page, /打印件表头也带一句|B-12①/, "打印件那处要有注释说明（可维护性）");
  // 计算口径不许被本次改动改掉：memberCalc 仍按 periodDays <= 0 → 每天保费 0
  const stats = await readFile(fileURLToPath(new URL("../src/lib/insurance-stats.ts", import.meta.url)), "utf8");
  assert.match(stats, /periodDays > 0 \? \(policy\?\.premiumPerPerson \|\| 0\) \/ periodDays : 0/, "每天保费口径不变");
});
