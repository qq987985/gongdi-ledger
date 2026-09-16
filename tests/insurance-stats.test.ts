/**
 * 保险页「四口径一致」专项测试（口径一致性专项 20260916）。
 *
 * ① 列表（筛选后的成员）② 汇总（在保/已结束人数、累计人天、保费合计）
 * ③ 按班组分组面板 ④ 队长下拉选项 —— 必须来自同一份名单。
 * 边界：空队长（未分班组）、结束日期为空=在保、越出保单期的天数被夹紧、空名单、组合险。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterMembers,
  groupTotals,
  leaderBuckets,
  leaderSummary,
  linkedPolicyTargets,
  memberCalc,
  memberStats,
} from "../src/lib/insurance-stats";
import { COMBINED_POLICY_NOTE } from "../src/lib/insurance";
import { ALL_BUCKETS } from "../src/lib/buckets";
import type { InsuranceMember, InsurancePolicy } from "../src/lib/types";

const POLICY: InsurancePolicy = {
  id: "S1",
  policyNo: "P-2026-001",
  buyer: "",
  name: "",
  company: "",
  premiumPerPerson: 1000, // 保险期 10 天 → 每人每天 100
  headcount: 3,
  coverage: 0,
  periodStart: "2026-01-01 00:00",
  periodEnd: "2026-01-10 23:59",
  linkedPolicyId: "",
  contracts: [],
  remark: "",
};

function member(over: Partial<InsuranceMember> & { id: string; name: string }): InsuranceMember {
  return { policyId: "S1", leader: "", startDate: "2026-01-01 00:00", endDate: "", remark: "", ...over };
}

const MEMBERS: InsuranceMember[] = [
  member({ id: "m1", name: "甲", leader: "张队" }), // 在保，10 天
  member({ id: "m2", name: "乙", leader: "" }), // 未分班组，在保，10 天
  member({ id: "m3", name: "丙", leader: "张队", startDate: "2025-12-01 00:00", endDate: "2025-12-31 23:59" }), // 越界夹紧 → 0 天
  member({ id: "m4", name: "丁", leader: "李队", startDate: "2026-01-10 00:00" }), // 只 1 天，在保
];

const calc = memberCalc(POLICY);

test("人天/保费：按保单期夹紧，越界不计（与 lib/insurance.ts 同一算法）", () => {
  assert.equal(calc.days(MEMBERS[0]), 10);
  assert.equal(calc.settle(MEMBERS[0]), 1000);
  assert.equal(calc.days(MEMBERS[2]), 0, "整段在保单期之外 → 0 天");
  assert.equal(calc.settle(MEMBERS[2]), 0);
  assert.equal(calc.days(MEMBERS[3]), 1, "1/10 到 1/10 当天算 1 天");
  assert.equal(calc.settle(MEMBERS[3]), 100);
});

test("汇总：在保/已结束/人天/保费全部来自同一份名单（筛选后）", () => {
  const all = memberStats(MEMBERS, calc);
  assert.deepEqual(all, {
    count: 4,
    activeCount: 3,
    endedCount: 1,
    personDays: 21,
    settle: 2100,
  });
  // 筛选「张队」：三个数字必须一起变小，不能人数是全量、人天是筛选后
  const zhang = filterMembers(MEMBERS, { leader: "张队", status: "" });
  const zs = memberStats(zhang, calc);
  assert.equal(zs.count, 2);
  assert.equal(zs.activeCount, 1);
  assert.equal(zs.endedCount, 1);
  assert.equal(zs.personDays, 10);
  assert.equal(zs.settle, 1000);
  // 状态筛选
  const ended = memberStats(filterMembers(MEMBERS, { leader: ALL_BUCKETS, status: "ended" }), calc);
  assert.deepEqual(ended, { count: 1, activeCount: 0, endedCount: 1, personDays: 0, settle: 0 });
});

test("队长下拉：含「未分班组」这一桶（空队长的人不在下拉里消失）", () => {
  const buckets = leaderBuckets(MEMBERS);
  assert.deepEqual(
    buckets.map((b) => `${b.value}|${b.label}`),
    ["李队|李队", "张队|张队", "|未分班组"],
  );
  // 逐桶人数之和 == 全部人数 == 列表条数
  const viaBuckets = buckets.reduce((s, b) => s + filterMembers(MEMBERS, { leader: b.value, status: "" }).length, 0);
  assert.equal(viaBuckets, MEMBERS.length, "选「全部队长」时的人 == 逐桶相加");
  // 旧口径：filter(Boolean) 只有两个队长，未分班组的乙取不到
  const oldBuckets = [...new Set(MEMBERS.map((m) => m.leader).filter(Boolean))];
  assert.equal(oldBuckets.length, 2);
  assert.equal(
    oldBuckets.reduce((s, b) => s + filterMembers(MEMBERS, { leader: b, status: "" }).length, 0),
    MEMBERS.length - 1,
    "旧口径少 1 个人（没填队长的）",
  );
});

test("按班组汇总：含「未分班组」一行，各行相加 == 名单合计（打印件表尾同源）", () => {
  const groups = leaderSummary(MEMBERS, calc);
  assert.deepEqual(
    groups.map((g) => `${g.leader}:${g.count}:${g.days}:${g.settle}`),
    ["李队:1:1:100", "张队:2:10:1000", "未分班组:1:10:1000"],
  );
  const totals = groupTotals(groups);
  const stats = memberStats(MEMBERS, calc);
  assert.deepEqual(totals, { count: stats.count, days: stats.personDays, settle: stats.settle });
  // 筛选「张队」后，分组表只剩张队，合计仍等于筛选后的名单合计
  const scoped = leaderSummary(filterMembers(MEMBERS, { leader: "张队", status: "" }), calc);
  assert.deepEqual(groupTotals(scoped), { count: 2, days: 10, settle: 1000 });
});

test("边界：保单期结束为空 → 保险期 0 天、每人每天 0（不按「到今天」算）；空名单全 0", () => {
  const open = memberCalc({ ...POLICY, periodEnd: "" });
  assert.equal(open.settle(MEMBERS[0]), 0);
  assert.deepEqual(memberStats([], calc), { count: 0, activeCount: 0, endedCount: 0, personDays: 0, settle: 0 });
  assert.deepEqual(leaderBuckets([]), []);
  assert.deepEqual(leaderSummary([], calc), []);
});

test("经理/队长带空格的值与桶对齐（trim 后同一桶，不会同一个队长分成两项）", () => {
  const rows = [member({ id: "x1", name: "戊", leader: "张队" }), member({ id: "x2", name: "己", leader: " 张队 " })];
  assert.deepEqual(leaderBuckets(rows).map((b) => b.value), ["张队"], "trim 后是一桶");
  assert.equal(filterMembers(rows, { leader: "张队", status: "" }).length, 2);
  assert.deepEqual(groupTotals(leaderSummary(rows, calc)).count, 2);
});

/* ＝＝ 决策三（1.8.5）：组合险（两张互挂保单）不去重计人/计费 ＝＝ */

const POLICY2: InsurancePolicy = { ...POLICY, id: "S2", policyNo: "P-2026-002", linkedPolicyId: "S1" };
const LINKED: InsurancePolicy[] = [{ ...POLICY, linkedPolicyId: "S2" }, POLICY2];

test("决策三：互挂目标的双向计算走唯一实现（页面 syncLinked 只调不算）", () => {
  assert.deepEqual(linkedPolicyTargets(LINKED, "S1"), ["S2"], "S1 指向 S2");
  assert.deepEqual(linkedPolicyTargets(LINKED, "S2"), ["S1"], "反向也认（双向挂钩）");
  assert.deepEqual(linkedPolicyTargets([{ ...POLICY, linkedPolicyId: "" }], "S1"), [], "没挂钩就不动别人");
  assert.deepEqual(
    linkedPolicyTargets(
      [
        { id: "A", linkedPolicyId: "B" },
        { id: "B", linkedPolicyId: "A" },
        { id: "C", linkedPolicyId: "" },
      ],
      "A",
    ),
    ["B"],
    "不相关的保单不进来",
  );
});

test("决策三：互挂两张保单时各自人数/保费与「单张时」一致（不去重），标注文案存在", () => {
  const calc2 = memberCalc(POLICY2);
  // 互挂后名单被**复制**一份到另一张保单（syncLinked 的行为），同一个人同时出现在两张保单上
  const copied = MEMBERS.map((m) => ({ ...m, id: `${m.id}-copy`, policyId: "S2" }));
  const s1 = memberStats(MEMBERS, calc);
  const s2 = memberStats(copied, calc2);
  assert.deepEqual(s2, s1, "两张保单各自的人数/人天/保费与「单张时」逐项一致（不去重、不合并）");
  assert.equal(s1.settle + s2.settle, s1.settle * 2, "合计 = 各保单分别计算后相加（不是去重后的一份）");
  const names1 = new Set(MEMBERS.map((m) => m.name));
  assert.equal(copied.every((m) => names1.has(m.name)), true, "同一个人同时在两张保单上");
  assert.equal(memberStats([...MEMBERS, ...copied], calc).count, 8, "把两张保单的人员合起来数就会翻倍 —— 这正是要标注的原因");
  // 标注文案（唯一一份，保险页与打印件都引它）
  assert.match(COMBINED_POLICY_NOTE, /组合险（互挂保单）/);
  assert.match(COMBINED_POLICY_NOTE, /同一个人可能同时出现在两张保单上/);
  assert.match(COMBINED_POLICY_NOTE, /人数与保费按各保单分别计算，不合并去重/);
});
