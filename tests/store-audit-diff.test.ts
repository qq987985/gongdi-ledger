/**
 * 操作记录前后值的**集成测试**（业务评估 B17，1.8.15）。
 *
 * tests/audit-diff.test.ts 测的是纯函数与「源码里有没有调 diffDetail」；
 * 这里再往前一步：用 **stub 的 fetch** 跑**真实 store**，断言「改了发放金额 / 考勤天数 /
 * 人员工资 / 合同金额 / 报销金额 / 删了一笔」之后，真正发给 `/api/audit` 的那条 detail 里
 * 带没带「改动前 → 改动后」、能不能被操作记录页反解出来。
 *
 * 为什么值得单独跑一遍：静态守卫只能证明「写了 diffDetail(」，证明不了参数拼对了
 * （传错对象、先 set 再取值拿到的是新值、批量时只记了第一条……都是绿的类型错误）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DIFF_MARK, MAX_DIFF_CHARS, parseDetail } from "../src/lib/audit-diff";

/* ── 浏览器替身（store 的 persist storage 在模块求值时看 typeof window） ── */
const ls = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => ls.get(k) ?? null,
  setItem: (k: string, v: string) => void ls.set(k, String(v)),
  removeItem: (k: string) => void ls.delete(k),
  clear: () => ls.clear(),
};
(globalThis as any).window = { setTimeout, clearTimeout, localStorage: (globalThis as any).localStorage };
(globalThis as any).confirm = () => true;

/* ── fetch 桩：只收 POST /api/audit（其余一律 200 空响应） ── */
interface AuditCall {
  action: string;
  detail: string;
  module: string;
}
const audits: AuditCall[] = [];
(globalThis as any).fetch = async (url: unknown, init?: { method?: string; body?: unknown }) => {
  const u = String(url);
  if (u.includes("/api/audit")) {
    if (init?.method === "POST") audits.push(JSON.parse(String(init.body)) as AuditCall);
    else return new Response(JSON.stringify({ entries: [] }), { status: 200 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

const { useApp, emptyState } = await import("../src/lib/store");
import type { AttendanceRow, ContractRecord, Expense, Payment, Person } from "../src/lib/types";

const tick = () => new Promise((r) => setTimeout(r, 0));

function person(name: string, over: Partial<Person> = {}): Person {
  return {
    id: `p-${name}`,
    name,
    team: "一班",
    personNo: "",
    idCard: "",
    gender: "男",
    age: 30,
    birthday: "",
    phone: "",
    dailyWage: 280,
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
function payment(over: Partial<Payment> = {}): Payment {
  return { id: "y1", owner: "张三", receiver: "张三", date: "2026-08-05", amount: 5000, source: "8月请款", remark: "", ...over };
}
function attendance(over: Partial<AttendanceRow> = {}): AttendanceRow {
  return { id: "a1", year: 2026, month: 8, name: "张三", team: "一班", days: 26, otHours: 0, allowance: 0, deduction: 0, remark: "", ...over };
}
function contract(over: Partial<ContractRecord> = {}): ContractRecord {
  return {
    id: "c1",
    year: 2026,
    code: "C-2026-001",
    name: "示范工程A",
    contractor: "总包",
    subcontractor: "分包",
    contractAmount: 1000000,
    taxRate: 9,
    reportTaxMode: "excl",
    payRatio: 80,
    warrantyStart: "",
    warrantyEnd: "",
    hasDeposit: false,
    depositAmount: 0,
    manager: "王经营",
    status: "在建",
    prelimAmount: 0,
    settleReceivable: 0,
    remark: "",
    ...over,
  };
}
function expense(over: Partial<Expense> = {}): Expense {
  return { id: "e1", name: "水泥", qty: 1, price: 100, amount: 100, status: "未报销", claimant: "张三", ...over } as Expense;
}

/** 每个用例开跑前：把台账换成本用例的数据，并清空已捕获的操作记录 */
function seed(state: Partial<ReturnType<typeof emptyState>>) {
  audits.length = 0;
  useApp.getState().setAll({ ...emptyState(), people: [person("张三")], ...state } as any);
}
const last = () => audits[audits.length - 1];
const changesOf = (action: string) => {
  const call = audits.filter((a) => a.action === action).pop();
  assert.ok(call, `没有写出「${action}」这条操作记录（实际写了：${audits.map((a) => a.action).join("、")}）`);
  return parseDetail(call.detail);
};

test("B17 集成：改发放金额/日期/收款人 → 操作记录里带「改动前 → 改动后」", async () => {
  seed({ payments: [payment()] });
  useApp.getState().patchPayments(["y1"], { amount: 6000, date: "", receiver: "李四" });
  await tick();
  const { summary, changes } = changesOf("修改发放");
  assert.equal(summary, "1条");
  assert.deepEqual(changes, [
    { label: "张三 金额", before: "5,000.00", after: "6,000.00" },
    { label: "张三 发放日期", before: "2026-08-05", after: "待发放" },
    { label: "张三 收款人", before: "张三", after: "李四" },
  ]);
  // 列表/打印不认这些字段，操作记录页得能反解 —— 反解出来的必须是**可以照着改回去**的值
  assert.equal(useApp.getState().payments[0].amount, 6000, "数据本身当然要改到");
});

test("B17 集成：没改动就不写标记（操作记录不许被「改了 0 个字段」刷屏）", async () => {
  seed({ payments: [payment()] });
  useApp.getState().patchPayments(["y1"], { amount: 5000, source: "8月请款" });
  await tick();
  const call = last();
  assert.equal(call.action, "修改发放");
  assert.equal(call.detail, "1条", "无变化 → detail 只有摘要");
  assert.equal(call.detail.includes(DIFF_MARK), false);
});

test("B17 集成：保存月考勤 → 天数改动有前后值；首次录入整月不逐个记", async () => {
  seed({ attendance: [attendance()] });
  useApp.getState().saveAttendanceMonth(2026, 8, [{ name: "张三", days: 25 }]);
  await tick();
  const { summary, changes } = changesOf("保存月考勤");
  assert.equal(summary, "2026年8月 1人");
  assert.deepEqual(changes, [{ label: "张三 出勤", before: "26", after: "25" }]);

  // 首次录入（这个月原来一行都没有）→ 只写人数，不逐个记「（空）→ 26」
  seed({ attendance: [] });
  useApp.getState().saveAttendanceMonth(2026, 8, [{ name: "张三", days: 26 }, { name: "李四", days: 20 }]);
  await tick();
  const first = changesOf("保存月考勤");
  assert.equal(first.summary, "2026年8月 2人");
  assert.deepEqual(first.changes, []);
});

test("B17 集成：改人员工资/班组 → 前后值；身份证只记「改过了」不记值", async () => {
  seed({ people: [person("张三")] });
  useApp.getState().upsertPerson({
    ...person("张三"),
    dailyWage: 300,
    team: "二班",
    idCard: "110101199001011210",
  });
  await tick();
  const { summary, changes } = changesOf("修改人员");
  assert.equal(summary, "张三");
  assert.deepEqual(changes, [
    { label: "班组", before: "一班", after: "二班" },
    { label: "日工资", before: "280.00", after: "300.00" },
    { label: "身份证", before: "（空）", after: "已填（值不记录）" },
  ]);
  assert.equal(JSON.stringify(audits).includes("110101199001011210"), false, "操作记录里不许出现身份证原文");
});

test("B17 集成：改合同金额 / 报销金额 → 前后值", async () => {
  seed({ contracts: [contract()], expenses: [expense()] });
  useApp.getState().upsertContract(contract({ contractAmount: 1200000 }));
  useApp.getState().upsertExpense(expense({ amount: 250, qty: 2 }));
  await tick();
  assert.deepEqual(changesOf("修改合同").changes, [
    { label: "合同金额", before: "1,000,000.00", after: "1,200,000.00" },
  ]);
  const exp = changesOf("修改报销").changes;
  assert.deepEqual(
    exp.map((c) => `${c.label}:${c.before}→${c.after}`),
    ["数量:1→2", "金额:100.00→250.00"],
  );
});

test("B17 集成：删除发放 / 人员 → 只记改动前（误删能凭记录还原）", async () => {
  seed({ payments: [payment()], people: [person("张三")] });
  useApp.getState().removePayments(["y1"]);
  useApp.getState().removePeople(["p-张三"]);
  await tick();
  assert.deepEqual(changesOf("删除发放").changes, [
    { label: "张三 2026-08-05", before: "¥5,000.00", after: "已删除" },
  ]);
  assert.deepEqual(changesOf("删除人员").changes, [{ label: "张三", before: "一班 ¥280/天", after: "已删除" }]);
  assert.equal(useApp.getState().payments.length, 0);
});

test("B17 集成：批量生成待发放只写一条记录，名单（谁、多少钱）在前后值里", async () => {
  seed({ payments: [] });
  const n = useApp.getState().addPayments([
    { owner: "张三", receiver: "张三", date: "", amount: 2280, source: "", remark: "" },
    { owner: "李四", receiver: "李四", date: "", amount: 5000, source: "", remark: "" },
  ]);
  await tick();
  assert.equal(n, 2);
  assert.equal(useApp.getState().payments.length, 2, "两笔都落盘");
  const { summary, changes } = changesOf("批量生成待发放");
  assert.equal(summary, "2 笔");
  const list = changes.find((c) => c.label === "名单");
  assert.ok(list, "名单要在记录里（否则事后不知道这次生成了谁）");
  assert.match(list!.after, /张三 ¥2,280\.00/);
  assert.match(list!.after, /李四 ¥5,000\.00/);
  assert.equal(changes.find((c) => c.label === "待发放合计")!.after, "7,280.00");
});

test("B17 集成：一次批量删 60 笔时 detail 仍受控（服务端只收 400 字），且能反解", async () => {
  const rows = Array.from({ length: 60 }, (_, i) => payment({ id: `y${i}`, amount: 1000 + i }));
  seed({ payments: rows });
  useApp.getState().removePayments(rows.map((r) => r.id));
  await tick();
  const call = last();
  assert.equal(call.action, "删除发放");
  assert.ok(call.detail.length <= 400, `detail 必须短于服务端 400 字上限，实际 ${call.detail.length}`);
  assert.match(call.detail, /…（另有 \d+ 项）/, "超出部分要标注还剩几项");
  const { changes } = parseDetail(call.detail);
  assert.ok(changes.length > 0);
  for (const c of changes) assert.equal(c.after, "已删除", "不许出现半截的改动");
  assert.ok(MAX_DIFF_CHARS < 400);
});
