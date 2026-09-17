/**
 * F3 / A14：改人名必须跨实体同步（改名事务）。
 *
 * 现场问题：`store.upsertPerson` 只改了 `people` 里的姓名，考勤（按 `attendance.name`）、
 * 发放（按 `payments.owner` / `receiver`）都还挂在旧名字上 —— 年度表该人应发归零、
 * 多出一行「未发 = -已发」的负数、工资条按姓名查不到人。
 *
 * 这里测 `src/lib/rename-person.ts` 的纯函数（唯一实现），并用 `summarizeYear`
 * （年度表的唯一口径）反过来验证「应发不变、没有负数未发行」。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";
import { applyRenameToPeople, planRenamePerson, renameLogDetail } from "../src/lib/rename-person";
import { summarizeYear } from "../src/lib/attendance-summary";
import type { AttendanceRow, Expense, InsuranceMember, Payment, Person } from "../src/lib/types";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

function person(id: string, name: string, dailyWage = 300): Person {
  return {
    id,
    name,
    team: "一班",
    personNo: "",
    idCard: "",
    gender: "男",
    age: 30,
    birthday: "1990-01-01",
    phone: "",
    dailyWage,
    monthWage: 0,
    payType: "day",
    otRule: "",
    mealAllowance: 0,
    wageHistory: [],
    bank: "",
    cardNo: "",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
  };
}

function att(id: string, name: string, month: number, days: number): AttendanceRow {
  return { id, year: 2026, month, name, team: "一班", days, otHours: 0, allowance: 0, deduction: 0, remark: "" };
}

function pay(id: string, owner: string, receiver: string, amount: number, date = "2026-06-10"): Payment {
  return { id, owner, receiver, date, amount, source: "公司", remark: "" };
}

function member(id: string, name: string): InsuranceMember {
  return { id, policyId: "ip1", name, leader: "", startDate: "2026-01-01", endDate: "", remark: "" } as unknown as InsuranceMember;
}

function expense(id: string, claimant: string, itemName: string, amount: number): Expense {
  return {
    id,
    name: itemName, // 报销物品名（不是人，改名不许动）
    year: 2026,
    qty: 0,
    price: 0,
    amount,
    status: "未报销",
    payMethod: "",
    voucherId: "",
    voucherFileName: "",
    claimant,
    forWhom: "",
    payBank: "",
    payCardNo: "",
    payAccount: "",
    payoutId: "",
    payoutFileName: "",
    payoutDate: "",
    payoutMethod: "",
    reimbursedAt: "",
    date: "2026-05-20",
    remark: "",
  };
}

/**
 * 3 条考勤 + 2 笔发放（其中 1 笔是 receiver = 旧名的代收）
 * + 2 位参保人（1 位是旧名）+ 2 条报销（1 条的报销人 = 旧名）
 */
function fixture() {
  return {
    people: [person("p1", "张三"), person("p2", "李四")],
    attendance: [att("a1", "张三", 1, 10), att("a2", "张三", 2, 12), att("a3", "李四", 2, 8)],
    payments: [
      pay("y1", "张三", "", 5000),
      pay("y2", "李四", "张三", 1200), // 张三代收（receiver = 旧名）
    ],
    insuranceMembers: [member("m1", "张三"), member("m2", "李四")],
    expenses: [expense("x1", "张三", "张三牌水泥", 1200), expense("x2", "李四", "李四牌钢筋", 800)],
  };
}

test("改名：考勤 name、发放 owner 与 receiver 里的旧名一起改成新名", () => {
  const input = fixture();
  const plan = planRenamePerson(input, "p1", "张三丰");
  assert.equal(plan.ok, true, plan.error || "");
  assert.equal(plan.oldName, "张三");
  assert.equal(plan.newName, "张三丰");
  assert.deepEqual(plan.counts, { attendance: 2, payments: 2, receivers: 1, insuranceMembers: 1, expenses: 1 });
  assert.deepEqual(
    plan.attendance.map((a) => a.name),
    ["张三丰", "张三丰", "李四"],
  );
  assert.equal(plan.payments[0].owner, "张三丰");
  assert.equal(plan.payments[1].owner, "李四", "别人的 owner 不能动");
  assert.equal(plan.payments[1].receiver, "张三丰");
  // 原数组不被就地改动（纯函数）
  assert.equal(input.people[0].name, "张三");
  assert.equal(input.attendance[0].name, "张三");
  assert.equal(input.payments[0].owner, "张三");
});

test("改名：参保人（保险清单）与报销人（claimant）一起改，报销物品名不动", () => {
  const input = fixture();
  const plan = planRenamePerson(input, "p1", "张三丰");
  assert.equal(plan.ok, true, plan.error || "");
  assert.deepEqual(
    plan.insuranceMembers.map((m) => m.name),
    ["张三丰", "李四"],
  );
  assert.deepEqual(
    plan.expenses.map((e) => e.claimant),
    ["张三丰", "李四"],
  );
  // expenses.name 是报销物品名（不是人）：一个字都不能动
  assert.deepEqual(
    plan.expenses.map((e) => e.name),
    ["张三牌水泥", "李四牌钢筋"],
  );
  // 自由文本不动
  assert.equal(plan.expenses[0].remark, input.expenses[0].remark);
  // 原数组不被就地改动
  assert.equal(input.insuranceMembers[0].name, "张三");
  assert.equal(input.expenses[0].claimant, "张三");
});

test("改名：自由文本（remark）不跟着改", () => {
  const input = fixture();
  input.attendance[0].remark = "和张三一起干";
  input.payments[0].remark = "张三经手";
  const plan = planRenamePerson(input, "p1", "张三丰");
  assert.equal(plan.attendance[0].remark, "和张三一起干");
  assert.equal(plan.payments[0].remark, "张三经手");
});

test("改名：同名冲突被拒绝，且什么都不改", () => {
  const input = fixture();
  const plan = planRenamePerson(input, "p1", "李四");
  assert.equal(plan.ok, false);
  assert.match(plan.error || "", /已有同名人员/);
  // 五张表都原样返回（引用相同 = 一个都没新建/改动）
  assert.equal(plan.attendance, input.attendance);
  assert.equal(plan.payments, input.payments);
  assert.equal(plan.insuranceMembers, input.insuranceMembers);
  assert.equal(plan.expenses, input.expenses);
  assert.deepEqual(plan.counts, { attendance: 0, payments: 0, receivers: 0, insuranceMembers: 0, expenses: 0 });
});

test("改名：空名同样整笔拒绝且零改动（含参保人/报销人）", () => {
  const input = fixture();
  const plan = planRenamePerson(input, "p1", "   ");
  assert.equal(plan.ok, false);
  assert.equal(plan.attendance, input.attendance);
  assert.equal(plan.payments, input.payments);
  assert.equal(plan.insuranceMembers, input.insuranceMembers);
  assert.equal(plan.expenses, input.expenses);
});

test("改名：姓名空白 / 人员不存在都拒绝", () => {
  const input = fixture();
  assert.equal(planRenamePerson(input, "p1", "   ").ok, false);
  assert.equal(planRenamePerson(input, "不存在", "张三丰").ok, false);
});

test("改名：改成同名（含空格）算没变，不动任何记录", () => {
  const input = fixture();
  const plan = planRenamePerson(input, "p1", " 张三 ");
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.counts, { attendance: 0, payments: 0, receivers: 0, insuranceMembers: 0, expenses: 0 });
  assert.equal(plan.attendance, input.attendance);
  assert.equal(plan.insuranceMembers, input.insuranceMembers);
  assert.equal(plan.expenses, input.expenses);
});

test("改名：applyRenameToPeople 只换姓名、其它字段原样", () => {
  const input = fixture();
  const next = applyRenameToPeople(input.people, "p1", " 张三丰 ");
  assert.equal(next[0].name, "张三丰");
  assert.equal(next[0].dailyWage, 300);
  assert.equal(next[1].name, "李四");
});

test("改名：操作记录写明旧名 → 新名与同步条数（含参保人/报销人）", () => {
  const plan = planRenamePerson(fixture(), "p1", "张三丰");
  const detail = renameLogDetail(plan);
  assert.match(detail, /张三 → 张三丰/);
  assert.match(detail, /同步 2 条考勤/);
  assert.match(detail, /2 笔发放/);
  assert.match(detail, /1 笔是代收人/);
  assert.match(detail, /1 位参保人/);
  assert.match(detail, /1 条报销人/);
});

test("改名后年度表：应发不变，没有「未发」负数行（年度表口径 summarizeYear）", () => {
  const input = fixture();
  const before = summarizeYear({ people: input.people, attendance: input.attendance, payments: input.payments, year: 2026, fallbackYear: 2026 });
  const beforeZhang = before.rows.find((r) => r.person.name === "张三");
  assert.ok(beforeZhang, "改名前应有一行张三");
  const plan = planRenamePerson(input, "p1", "张三丰");
  const after = summarizeYear({
    people: applyRenameToPeople(input.people, "p1", plan.newName),
    attendance: plan.attendance,
    payments: plan.payments,
    year: 2026,
    fallbackYear: 2026,
  });
  const afterZhang = after.rows.find((r) => r.person.name === "张三丰");
  assert.ok(afterZhang, "改名后应有一行张三丰");
  // 应发（全年工资）不因改名变化；已发也照着实际收款人走
  assert.equal(afterZhang.yearPayAmt, beforeZhang.yearPayAmt);
  assert.equal(afterZhang.paid, beforeZhang.paid);
  assert.equal(afterZhang.unpaid, beforeZhang.unpaid);
  // 改名后不该再冒出旧名字的「未发」孤儿行（负数未发就是这么来的）
  assert.equal(after.rows.some((r) => r.person.name === "张三"), false);
  assert.equal(after.rows.some((r) => r.unpaid < 0), false);
  // 总览 KPI 与年度表同源：金额不因改名变化
  assert.equal(after.paid, before.paid);
});

test("store 层：renamePerson 与 upsertPerson 都走同一条改名事务（真跑 zustand store）", async () => {
  const { emptyState, useApp } = await import("../src/lib/store");
  const input = fixture();
  useApp.getState().setAll({
    ...emptyState(),
    year: 2026,
    years: [2026],
    people: input.people,
    attendance: input.attendance,
    payments: input.payments,
    insuranceMembers: input.insuranceMembers,
    expenses: input.expenses,
  });

  // 显式改名动作
  const r = useApp.getState().renamePerson("p1", "张三丰");
  assert.equal(r.ok, true, r.error || "");
  let st = useApp.getState();
  assert.equal(st.people.find((p) => p.id === "p1")?.name, "张三丰");
  assert.equal(st.attendance.filter((a) => a.name === "张三丰").length, 2);
  assert.equal(st.attendance.some((a) => a.name === "张三"), false);
  assert.equal(st.payments.find((p) => p.id === "y1")?.owner, "张三丰");
  assert.equal(st.payments.find((p) => p.id === "y2")?.receiver, "张三丰");
  assert.equal(st.payments.find((p) => p.id === "y2")?.owner, "李四");
  // 参保人（保险清单）与报销人（claimant）也要跟着改；报销物品名不动
  assert.equal(st.insuranceMembers.find((m) => m.id === "m1")?.name, "张三丰");
  assert.equal(st.insuranceMembers.find((m) => m.id === "m2")?.name, "李四");
  assert.equal(st.expenses.find((e) => e.id === "x1")?.claimant, "张三丰");
  assert.equal(st.expenses.find((e) => e.id === "x2")?.claimant, "李四");
  assert.equal(st.expenses.find((e) => e.id === "x1")?.name, "张三牌水泥", "报销物品名不是人，不许改");

  // 同名冲突：拒绝，且一个字都不改
  const clash = useApp.getState().renamePerson("p1", "李四");
  assert.equal(clash.ok, false);
  assert.match(clash.error || "", /已有同名人员/);
  st = useApp.getState();
  assert.equal(st.people.find((p) => p.id === "p1")?.name, "张三丰");
  assert.equal(st.insuranceMembers.find((m) => m.id === "m1")?.name, "张三丰", "冲突时参保人也不能被改");
  assert.equal(st.expenses.find((e) => e.id === "x1")?.claimant, "张三丰", "冲突时报销人也不能被改");

  // 空名同样整笔拒绝
  const blank = useApp.getState().renamePerson("p1", "   ");
  assert.equal(blank.ok, false);
  assert.equal(useApp.getState().expenses.find((e) => e.id === "x1")?.claimant, "张三丰");

  // 人员编辑弹窗走的是 upsertPerson：它必须同样同步考勤/发放/参保人/报销人
  useApp.getState().upsertPerson({ ...input.people[0], name: "张老三" });
  st = useApp.getState();
  assert.equal(st.people.find((p) => p.id === "p1")?.name, "张老三");
  assert.equal(st.attendance.filter((a) => a.name === "张老三").length, 2, "改姓名后考勤要跟着改");
  assert.equal(st.payments.find((p) => p.id === "y1")?.owner, "张老三", "改姓名后发放要跟着改");
  assert.equal(st.insuranceMembers.find((m) => m.id === "m1")?.name, "张老三", "改姓名后参保人要跟着改");
  assert.equal(st.expenses.find((e) => e.id === "x1")?.claimant, "张老三", "改姓名后报销人要跟着改");

  // 冲突时整笔保存不落（不做半截写入）
  useApp.getState().upsertPerson({ ...input.people[0], name: "李四" });
  st = useApp.getState();
  assert.equal(st.people.find((p) => p.id === "p1")?.name, "张老三", "冲突时不能改名");
  assert.equal(st.attendance.filter((a) => a.name === "张老三").length, 2, "冲突时考勤也不能被改动");
  assert.equal(st.insuranceMembers.find((m) => m.id === "m1")?.name, "张老三", "冲突时参保人也不能被改动");
  assert.equal(st.expenses.find((e) => e.id === "x1")?.claimant, "张老三", "冲突时报销人也不能被改动");
});

test("静态守卫：store 里改姓名的动作必须同时改考勤/发放/参保人/报销人（禁止只改 people）", async () => {
  const src = await readFile(repo("src/lib/store.ts"), "utf8");
  const upsert = src.slice(src.indexOf("upsertPerson: (p) => {"), src.indexOf("addPerson: (p) =>"));
  assert.ok(upsert.length > 0, "store.ts 里找不到 upsertPerson 动作");
  assert.match(upsert, /planRenamePerson\(/, "upsertPerson 必须走 lib/rename-person.ts 的改名事务");
  assert.match(upsert, /attendance: plan\.attendance/, "upsertPerson 必须把同步后的考勤一起落盘");
  assert.match(upsert, /payments: plan\.payments/, "upsertPerson 必须把同步后的发放一起落盘");
  assert.match(upsert, /insuranceMembers: plan\.insuranceMembers/, "upsertPerson 必须把同步后的参保人一起落盘");
  assert.match(upsert, /expenses: plan\.expenses/, "upsertPerson 必须把同步后的报销人一起落盘");
  // 只改 people 的老写法（next[i] = { ...nextP, id: people[i].id }; 后面只 set({ people })) 必须没了。
  // 负向守卫命中 0 处也是绿的 → 先用坏样本证明正则抓得到，再数一遍四张表（1.8.14 专家评审 C2 自检）
  const onlyPeopleRe = /set\(\{\s*people: next\s*\}\);/;
  expectRegexCatches(onlyPeopleRe, "          set({ people: next });", "store「改名只 set people」的旧写法");
  expectMinHits(
    "store 改名事务里同步的关联表数",
    countHits(upsert, /plan\.(attendance|payments|insuranceMembers|expenses)/g),
    4,
    "考勤 / 发放 / 参保人 / 报销人 四张表",
  );
  assert.doesNotMatch(upsert, /set\(\{\s*people: next\s*\}\);/, "改名不能只 set people");
  // 事务式改名动作存在，且同名冲突时拒绝（返回 ok:false）
  assert.match(src, /renamePerson: \(id, name\) => \{/, "store 必须有 renamePerson 动作");
  assert.match(src, /if \(!plan\.ok\) return \{ ok: false, error: plan\.error \};/, "改名冲突必须被拦住");
  // 唯一实现：改名只允许通过 rename-person.ts
  assert.match(src, /from "\.\/rename-person"/, "store 必须复用 lib/rename-person.ts");
});
