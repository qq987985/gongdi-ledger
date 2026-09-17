/**
 * 「按应发生成待发放」的回归测试（业务评估 B15，1.8.15）。
 *
 * 现场：30 人发工资要开 30 次弹窗 + 30 次确认，而应发金额系统早就算好了。
 *
 * 要钉住的四件事：
 * ① **口径复用**：生成的金额必须等于年度表那一行的「未发」（应发 − 已发），
 *    也就是总览「应发合计」KPI 的同一份计算 —— 页面重算一遍必然分叉（这条测试会红）；
 * ② **幂等**：该人该年已有待发放记录就不再生成（重复点按钮不会重复记账）；
 * ③ **不发没意义的记录**：0 元 / 已结清 / 没有应发的人不生成，并说清跳过了几人；
 * ④ **静态守卫**：页面不许自己实现「应发」（只能调 lib/pending-batch.ts）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { planPendingBatch, planSkipNote, pendingPaymentsOf } from "../src/lib/pending-batch";
import { summarizeYear } from "../src/lib/attendance-summary";
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";
import type { AttendanceRow, Payment, Person } from "../src/lib/types";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const src = (p: string) => readFile(repo(p), "utf8");
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

/* ＝＝ 数据构造：日薪 / 月薪 / 无工资 / 有考勤没工资的人都在里面 ＝＝ */

function person(over: Partial<Person> & { id: string; name: string }): Person {
  return {
    team: "一班",
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
    wageHistory: [],
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
  return { team: "一班", days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "", ...over };
}

function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "张三", receiver: "张三", date: "2026-08-05", amount: 0, source: "", remark: "", ...over };
}

const YEAR = 2026;

/** 张三（日薪 280 + 加班 25/时 + 餐补 12/天 + 扣款）、李四（月薪 8000，钱由张三代收）、王五（没设工资、没考勤） */
function ledger() {
  const people = [
    person({ id: "p1", name: "张三", dailyWage: 280, otRule: "按小时:25", mealAllowance: 12 }),
    person({ id: "p2", name: "李四", team: "二班", payType: "month", monthWage: 8000 }),
    person({ id: "p3", name: "王五" }),
  ];
  const attendance: AttendanceRow[] = [
    att({ id: "a1", name: "张三", year: YEAR, month: 8, days: 26, otHours: 10, allowance: 200, deduction: 100 }),
    att({ id: "a2", name: "李四", year: YEAR, month: 8, days: 26 }),
  ];
  const payments: Payment[] = [
    pay({ id: "y1", owner: "张三", receiver: "张三", date: "2026-08-05", amount: 5000 }),
    // 李四的钱由 张三代收：代发算李四的「已发」（1.8.6 口径：含代发，不从已发里扣）
    pay({ id: "y2", owner: "李四", receiver: "张三", date: "2026-08-06", amount: 3000 }),
  ];
  return { people, attendance, payments };
}

/** 应发（张三）= 26×280 + 加班 10×25 + 餐补 26×12 + 补助 200 − 扣款 100 = 7742 */
const ZHANG_SHOULD = 26 * 280 + 10 * 25 + 26 * 12 + 200 - 100;

test("B15：生成的金额 = 年度表的「未发」（应发 − 已发），与 summarizeYear 完全同源", () => {
  const { people, attendance, payments } = ledger();
  const plan = planPendingBatch({ people, attendance, payments, year: YEAR });
  const summary = summarizeYear({ people, attendance, payments, year: YEAR, fallbackYear: YEAR });
  const rowOf = (name: string) => summary.rows.find((r) => r.person.name === name)!;

  assert.equal(plan.items.length, 2, "张三、李四要生成；王五没有应发");
  for (const it of plan.items) {
    const row = rowOf(it.owner);
    assert.equal(it.should, row.yearPayAmt, `${it.owner} 的应发必须等于年度表「全年」`);
    assert.equal(it.paid, row.paid, `${it.owner} 的已发必须等于年度表「已发」（含代发）`);
    assert.equal(it.amount, row.unpaid, `${it.owner} 的本次待发放必须等于年度表「未发」`);
  }
  const zhang = plan.items.find((x) => x.owner === "张三")!;
  assert.equal(zhang.should, ZHANG_SHOULD, "应发口径：出勤×日工资 + 加班费 + 餐补 + 补助 − 扣款");
  assert.equal(zhang.paid, 5000);
  assert.equal(zhang.amount, ZHANG_SHOULD - 5000);
  const li = plan.items.find((x) => x.owner === "李四")!;
  assert.equal(li.paid, 3000, "别人代收也是「已发」（按实际收款人李四计入）");
  assert.equal(li.amount, 8000 - 3000);
  assert.equal(plan.total, ZHANG_SHOULD - 5000 + 8000 - 3000);
});

test("B15：应发/已发/未发三处数字在页面与总览上不许对不上（KPI 同源）", () => {
  const { people, attendance, payments } = ledger();
  const plan = planPendingBatch({ people, attendance, payments, year: YEAR });
  const summary = summarizeYear({ people, attendance, payments, year: YEAR, fallbackYear: YEAR });
  // 计划里各人的应发之和 = 年度表这些人应发之和；合计 = 未发之和
  assert.equal(
    plan.items.reduce((s, x) => s + x.should, 0),
    summary.rows.reduce((s, r) => s + r.yearPayAmt, 0) - 0,
  );
  assert.equal(
    plan.total,
    summary.rows.reduce((s, r) => s + r.unpaid, 0),
    "全部人的未发之和 == 本次要生成的合计（已结清的人未发为 0，不影响）",
  );
});

test("B15 幂等：该人该年已有待发放记录就不再生成（重复点按钮不会重复记账）", () => {
  const { people, attendance, payments } = ledger();
  const withPending: Payment[] = [
    ...payments,
    // 张三已经有待发放（日期留空 = 待发放）
    pay({ id: "y3", owner: "张三", receiver: "张三", date: "", amount: 2742 }),
  ];
  const plan = planPendingBatch({ people, attendance, payments: withPending, year: YEAR });
  assert.deepEqual(plan.hasPending, ["张三"]);
  assert.deepEqual(plan.items.map((x) => x.owner), ["李四"], "只有李四还没登记待发放");
  assert.equal(plan.total, 5000);
  assert.match(planSkipNote(plan), /已有待发放记录 1 人/, "预览里要说清跳过了几人、为什么");
});

test("B15 幂等闭环：把生成的记录落盘后再点一次，一个人都不生成", () => {
  const { people, attendance, payments } = ledger();
  const first = planPendingBatch({ people, attendance, payments, year: YEAR });
  const rows = pendingPaymentsOf(first);
  assert.deepEqual(rows.map((r) => r.date), ["", ""], "生成的记录日期留空 = 待发放");
  assert.deepEqual(rows.map((r) => r.receiver), ["张三", "李四"], "待发放还没定谁领，收款人先按本人");
  const stored: Payment[] = [...payments, ...rows.map((r, i) => ({ ...r, id: `new${i}` }))];
  const second = planPendingBatch({ people, attendance, payments: stored, year: YEAR });
  assert.deepEqual(second.items, [], "再点一次不生成任何记录");
  assert.deepEqual(second.hasPending.sort(), ["张三", "李四"]);
  assert.equal(second.total, 0);
});

test("B15 不发没意义的记录：0 元 / 已结清 / 本年无应发 分别跳过并说清原因", () => {
  const { people, attendance, payments } = ledger();
  const paidUp: Payment[] = [
    ...payments,
    // 张三的钱已经全额发过（应发 7742，已发 5000 + 2742 = 7742）→ 没有可发的
    pay({ id: "y3", owner: "张三", receiver: "张三", date: "2026-09-01", amount: ZHANG_SHOULD - 5000 }),
  ];
  const plan = planPendingBatch({ people, attendance, payments: paidUp, year: YEAR });
  assert.deepEqual(plan.settled, ["张三"], "已结清（应发 − 已发 = 0）→ 不生成");
  assert.deepEqual(plan.noShould, ["王五"], "没设工资、没考勤 → 没有应发 → 不生成");
  assert.deepEqual(plan.items.map((x) => x.owner), ["李四"]);
  const note = planSkipNote(plan);
  assert.match(note, /应发已结清 1 人/);
  assert.match(note, /本年无应发 1 人/);
  // 差一分钱也要生成（别把真实欠款当 0 吃掉），但浮点尾数（< 0.005 元）不算
  const tiny: Payment[] = [...payments, pay({ id: "y4", owner: "李四", receiver: "李四", date: "2026-08-06", amount: 4999.999 })];
  assert.deepEqual(planPendingBatch({ people, attendance, payments: tiny, year: YEAR }).items.map((x) => x.owner), ["张三"], "只差 0.001 元的尾数不生成");
  const oneCent: Payment[] = [...payments, pay({ id: "y5", owner: "李四", receiver: "李四", date: "2026-08-06", amount: 4999.99 })];
  const plan2 = planPendingBatch({ people, attendance, payments: oneCent, year: YEAR });
  assert.equal(plan2.items.find((x) => x.owner === "李四")!.amount, 0.01, "真差 0.01 元要生成");
});

test("B15 年份与筛选：当前年份决定应发；搜索关键词只生成匹配的人；无日期记录按当前年归集", () => {
  const { people, attendance, payments } = ledger();
  // 搜索「李」→ 只生成李四；张三是「不在当前搜索范围」被排除，不是「已结清」
  const filtered = planPendingBatch({ people, attendance, payments, year: YEAR, q: "李" });
  assert.deepEqual(filtered.items.map((x) => x.owner), ["李四"]);
  assert.equal(filtered.filteredOut, 2, "张三、王五被搜索排除（王五是没应发，但先被搜索挡掉）");
  assert.equal(filtered.headcount, 1, "参与判定的人数 = 搜索命中的人数");
  // 换年份：2025 年没有考勤 → 一个人都不生成
  const other = planPendingBatch({ people, attendance, payments, year: 2025 });
  assert.deepEqual(other.items, []);
  assert.deepEqual(other.noShould.sort(), ["张三", "李四", "王五"]);
  assert.equal(other.headcount, 3);
  // 无日期的待发放记录按**当前工作年**归集：fallbackYear 决定它算哪一年
  const undated: Payment[] = [...payments, pay({ id: "y6", owner: "张三", receiver: "张三", date: "", amount: 1000 })];
  assert.deepEqual(planPendingBatch({ people, attendance, payments: undated, year: YEAR, fallbackYear: YEAR }).hasPending, ["张三"]);
  assert.deepEqual(planPendingBatch({ people, attendance, payments: undated, year: YEAR, fallbackYear: 2027 }).hasPending, [], "归到别的年份就不算这一年的待发放");
});

test("B15 落盘记录：金额已 round2、发放方可跟随筛选、备注默认不写", () => {  const { people, attendance, payments } = ledger();
  const plan = planPendingBatch({ people, attendance, payments, year: YEAR });
  const rows = pendingPaymentsOf(plan, { source: "五冶8月请款" });
  assert.deepEqual(rows[0], {
    owner: "张三",
    receiver: "张三",
    date: "",
    amount: plan.items[0].amount,
    source: "五冶8月请款",
    remark: "",
  });
  for (const r of rows) {
    assert.equal(r.amount, Math.round(r.amount * 100) / 100, "金额必须是分（round2）");
  }
});

test("B15 脏数据：人员表里有同名行时只生成一条（宁可少一条，也不把这笔钱记两遍）", () => {
  const { people, attendance, payments } = ledger();
  const dup = [...people, person({ id: "p1-dup", name: "张三", dailyWage: 999 })];
  const plan = planPendingBatch({ people: dup, attendance, payments, year: YEAR });
  assert.equal(plan.items.filter((x) => x.owner === "张三").length, 1, "同名只生成一条待发放");
  assert.equal(plan.items.length, 2);
});

/* ＝＝ 静态守卫：页面不许自己实现「应发」 ＝＝ */

test("B15 守卫：发放页必须走 lib/pending-batch.ts，且落盘走 store 动作 + blockedWrite 拦只读账号", async () => {
  const page = stripComments(await src("src/routes/payments.tsx"));
  assert.match(page, /planPendingBatch\(/, "预览计划必须来自唯一实现");
  assert.match(page, /pendingPaymentsOf\(/, "落盘记录必须由唯一实现转换（日期留空 = 待发放）");
  // 只读账号 / 无 payments.edit：批量生成入口也要拦下（存量 10+ 处 blockedWrite 之一）
  const confirm = page.slice(page.indexOf("function confirmPendingBatch"));
  assert.match(confirm.slice(0, 400), /blockedWrite\("payments\.edit"/, "批量生成落盘前必须走 blockedWrite");
  // 落盘走 store 既有动作（整批只写一条操作记录），不直接改状态
  assert.match(confirm.slice(0, 600), /addPayments\(/, "落盘必须调 store 的 addPayments（一条操作记录）");
  expectMinHits("B15 守卫：发放页里 blockedWrite( 的调用点数", countHits(page, /blockedWrite\(/g), 5, "编辑/新增/删除/补日期/批量生成各有守卫");
  expectRegexCatches(/blockedWrite\("payments\.edit"/, 'if (blockedWrite("payments.edit", permLabel("payments.edit"))) return;', "只读守卫");
});

test("B15 守卫：页面与批量模块都不许自己算应发（应发只有 attendance-summary 一份）", async () => {
  const page = stripComments(await src("src/routes/payments.tsx"));
  const batch = stripComments(await src("src/lib/pending-batch.ts"));
  const bad: string[] = [];
  for (const [file, text] of [
    ["src/routes/payments.tsx", page],
    ["src/lib/pending-batch.ts", batch],
  ] as const) {
    for (const re of [/summarizeYear\(\s*\{?[^)]*\}\s*\)\s*\.rows\s*\.map\(.*monthPay/, /dailyWage\s*\*/, /monthWage\s*\//, /yearPayAmt\s*[-+*/]=/, /getWageAt\(/]) {
      if (re.test(text)) bad.push(`${file}: ${re}`);
    }
  }
  // 批量模块必须**复用** summarizeYear（而不是自己遍历考勤算工资）
  assert.match(batch, /from "\.\/attendance-summary"/, "应发口径必须来自 attendance-summary.ts");
  assert.match(batch, /summarizeYear\(/, "必须调用 summarizeYear");
  assert.equal(
    countHits(batch, /dailyWage|monthWage|otHours|mealAllowance/),
    0,
    "批量模块里不许出现工资字段（应发口径只有 wage.ts / attendance-summary.ts 一份实现）",
  );
  expectMinHits("B15 守卫：发放页里计划/落盘唯一实现的引用点数", countHits(page, /planPendingBatch\(|pendingPaymentsOf\(/g), 2, "预览 + 落盘各一处");
  expectRegexCatches(/dailyWage\s*\*/, "const should = p.dailyWage * att.days;", "「自己算应发」");
  assert.deepEqual(bad, [], `应发/工资金额不许在页面或批量模块里重算（会与总览 KPI 分叉）：\n${bad.join("\n")}`);
});

test("B15 守卫：必须先预览再落盘（名单 + 每人金额 + 合计都要给用户看见）", async () => {
  const page = stripComments(await src("src/routes/payments.tsx"));
  assert.match(page, /openPendingPreview\(/, "入口按钮必须先开预览");
  assert.match(page, /pendingOpen/, "预览弹窗要有独立状态");
  assert.match(page, /将新增/, "预览要写明「将新增 N 笔」");
  assert.match(page, /本次待发放/, "预览要给出每人的金额列");
  assert.match(page, /planSkipNote\(/, "预览要说明跳过了几人、为什么");
  // 落盘必须发生在预览之后：addPayments 只许出现在 confirmPendingBatch 里
  const firstAdd = page.indexOf("addPayments(");
  const confirmAt = page.indexOf("function confirmPendingBatch");
  assert.ok(confirmAt > 0 && firstAdd > confirmAt, "addPayments( 只许出现在确认生成的处理函数里（不许在打开预览时就写盘）");
  assert.equal(page.slice(0, confirmAt).includes("addPayments("), false, "预览阶段不许落盘");
});
