/**
 * 操作记录「改动前 → 改动后」的回归测试（业务评估 B17，1.8.15）。
 *
 * 要钉住的三件事：
 * ① 纯函数口径：只记变化的字段、无变化不产生噪音、金额/日期格式化统一、超长截断并标注、
 *    序列化能被 `parseDetail` 反解回来（操作记录页就靠它折叠展示）；
 * ② 已删记录要留「改动前」（误删能凭记录知道删了什么、多少钱）；
 * ③ **静态守卫**：store 里的关键改写动作必须带前后值（谁把 diffDetail 删了，`pnpm test` 直接红）；
 *    页面/组件不许自己拼前后值字符串（唯一实现在 lib/audit-diff.ts）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  DIFF_MARK,
  MAX_DIFF_CHARS,
  attendanceChanges,
  batchChanges,
  compareFields,
  contractChanges,
  diffDetail,
  entryChanges,
  expenseChanges,
  expenseDeletedChanges,
  fmtDate,
  fmtMoney,
  fmtSensitive,
  formatChanges,
  hasDiff,
  parseDetail,
  paymentChanges,
  paymentDeletedChanges,
  personChanges,
  personDeletedChanges,
  type FieldChange,
} from "../src/lib/audit-diff";
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";
import type { AttendanceRow, ContractEntry, ContractRecord, Expense, Payment, Person } from "../src/lib/types";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const src = (p: string) => readFile(repo(p), "utf8");
/** 去掉注释：注释里写着「以前怎么拼字符串」不算代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

/* ＝＝ 测试数据构造（只用关键字段） ＝＝ */

function person(over: Partial<Person> & { name: string }): Person {
  return {
    id: `p-${over.name}`,
    team: "一班",
    personNo: "D001",
    idCard: "110101199001011210",
    gender: "男",
    age: 36,
    birthday: "1990-01-01",
    phone: "13900000000",
    dailyWage: 280,
    monthWage: 0,
    payType: "day",
    otRule: "按小时:25",
    mealAllowance: 12,
    wageHistory: [],
    bank: "中国工商银行",
    cardNo: "6222021234567890123",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
    ...over,
  };
}

function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "张三", receiver: "张三", date: "2026-08-05", amount: 5000, source: "8月请款", remark: "", ...over };
}

function att(over: Partial<AttendanceRow> & { name: string; year: number; month: number }): AttendanceRow {
  return { id: `a-${over.name}-${over.year}-${over.month}`, team: "一班", days: 26, otHours: 0, allowance: 0, deduction: 0, remark: "", ...over };
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

function entry(over: Partial<ContractEntry> = {}): ContractEntry {
  return {
    id: "e1",
    contractId: "c1",
    kind: "report",
    date: "2026-03-31",
    amount: 180000,
    amountExcl: 0,
    taxRate: 0,
    workerPay: 0,
    workerPayDate: "",
    payTo: "",
    no: "2026-03",
    remark: "",
    fileName: "",
    workerFileName: "",
    ...over,
  };
}

function expense(over: Partial<Expense> & { name: string }): Expense {
  return { id: `e-${over.name}`, qty: 1, price: 100, amount: 100, status: "未报销", claimant: "张三", ...over } as Expense;
}

/* ＝＝ ① 格式化与比较 ＝＝ */

test("B17 格式化：金额走 round2 + 千分位，日期规范成 YYYY-MM-DD，空值有明确写法", () => {
  assert.equal(fmtMoney(280), "280.00");
  assert.equal(fmtMoney(1234.5), "1,234.50");
  assert.equal(fmtMoney(1000.005), "1,000.01", "半分按十进制直觉进位（round2）");
  assert.equal(fmtMoney(Number.NaN), "0.00", "非数字按 0.00，不许输出 NaN");
  assert.equal(fmtDate("2026-9-5"), "2026-09-05", "没补零的日期要规范化，否则同一件事两种写法");
  assert.equal(fmtDate(""), "待发放", "发放日期为空 = 待发放（与发放页/打印同一口径）");
  assert.equal(fmtDate("乱写"), "乱写", "认不出来的日期原样显示，不静默丢信息");
  assert.equal(fmtSensitive("110101199001011210"), "已填（值不记录）", "身份证/银行卡号只记「改过了」，不记值");
  assert.equal(fmtSensitive(""), "（空）");
});

test("B17 比较：只记变化的字段，没改的字段不进记录（无变化 = 空数组）", () => {
  const before = person({ name: "张三" });
  const after = person({ name: "张三", dailyWage: 300, team: "二班" });
  const changes = personChanges(before, after);
  assert.deepEqual(
    changes.map((c) => c.label),
    ["班组", "日工资"],
  );
  assert.deepEqual(changes[1], { label: "日工资", before: "280.00", after: "300.00" });
  assert.deepEqual(personChanges(before, person({ name: "张三" })), [], "完全没改 → 空数组（不产生噪音）");
  // 值没变但引用变了（编辑弹窗回填）同样不算改
  assert.deepEqual(personChanges(before, { ...before, wageHistory: [] }), []);
});

test("B17 比较：计薪方式/调薪历史/敏感字段都有可读的前后值（值不记录的那种只写「已填」）", () => {
  const before = person({ name: "张三", wageHistory: [] });
  const after = person({
    name: "张三",
    payType: "month",
    monthWage: 8000,
    wageHistory: [{ id: "w1", fromDate: "2026-07-01", payType: "month", dailyWage: 0, monthWage: 8000, otRule: "", mealAllowance: 0, remark: "" }],
    idCard: "320106198506154512",
    cardNo: "6228481234567890123",
  });
  const byLabel = new Map(personChanges(before, after).map((c) => [c.label, c]));
  assert.equal(byLabel.get("计薪方式")?.after, "按月");
  assert.equal(byLabel.get("调薪历史")?.before, "0 条");
  assert.match(byLabel.get("调薪历史")!.after, /^1 条（最新 ¥8,000\.00\/月）$/);
  assert.deepEqual(byLabel.get("身份证"), { label: "身份证", before: "已填（值不记录）", after: "已填（值不记录）" });
  assert.equal(byLabel.get("银行卡号")?.after, "已填（值不记录）");
  assert.equal(byLabel.has("320106198506154512"), false, "记录里不许出现身份证原文");
});

test("B17 比较：金额 280 → 280.4 这种「显示一样、其实改了」也要记下来", () => {
  const changes = compareFields({ amount: 280 }, { amount: 280.4 }, [{ key: "amount", label: "金额", fmt: fmtMoney }]);
  assert.equal(changes.length, 1, "比较用原始值，不能被四舍五入后「看起来一样」骗过去");
});

test("B17 发放/合同/报销/合同明细：金额、日期、收款人改动都有前后值", () => {
  const paid = paymentChanges(pay({ id: "x1" }), pay({ id: "x1", amount: 6000, date: "", receiver: "李四" }));
  assert.deepEqual(paid, [
    { label: "金额", before: "5,000.00", after: "6,000.00" },
    { label: "发放日期", before: "2026-08-05", after: "待发放" },
    { label: "收款人", before: "张三", after: "李四" },
  ]);
  assert.deepEqual(paymentChanges(pay({ id: "x1" }), pay({ id: "x1", remark: "改了备注" })), [], "备注不在关键字段里（不产生噪音）");

  const c = contractChanges(contract(), contract({ contractAmount: 1200000, status: "完工" }));
  assert.deepEqual(
    c.map((x) => `${x.label}:${x.before}→${x.after}`),
    ["合同金额:1,000,000.00→1,200,000.00", "状态:在建→完工"],
  );

  const e = expenseChanges(expense({ name: "水泥" }), expense({ name: "水泥", amount: 250, status: "已报销" }));
  assert.deepEqual(
    e.map((x) => x.label),
    ["金额", "状态"],
  );

  const en = entryChanges(entry(), entry({ amount: 200000, amountExcl: 183486.24, taxRate: 9 }));
  assert.deepEqual(
    en.map((x) => x.label),
    ["金额", "不含税金额", "税率%"],
  );

  const enDel = entryChanges(entry(), entry({ kind: "invoice" }));
  assert.equal(enDel[0].label, "明细类型", "报量↔开票的串味（历史缺陷）能看出改动前是哪一类");
});

test("B17 考勤：只列真的变了的人与字段；首次录入整月不逐个记「（空）→ 26」；删掉的人写已删除", () => {
  const before = [att({ name: "张三", year: 2026, month: 8, days: 26 }), att({ name: "李四", year: 2026, month: 8, days: 20 })];
  const after = [att({ name: "张三", year: 2026, month: 8, days: 25 }), att({ name: "王五", year: 2026, month: 8, days: 22 })];
  const changes = attendanceChanges(before, after);
  assert.deepEqual(
    changes.map((c) => `${c.label}：${c.before} → ${c.after}`),
    ["张三 出勤：26 → 25", "李四：出勤 20 / 加班 0 → 已删除", "王五：（未录入） → 出勤 22 / 加班 0"],
  );
  assert.deepEqual(attendanceChanges([], after), [], "首次录入没有对比基准 → 不写（摘要里的「N 人」够了）");
  assert.deepEqual(
    attendanceChanges(before, [att({ name: "张三", year: 2026, month: 8, days: 26 }), att({ name: "李四", year: 2026, month: 8, days: 20 })]),
    [],
    "原样保存 → 空数组（不产生噪音）",
  );
});

/* ＝＝ ② 序列化 / 截断 / 反解 ＝＝ */

test("B17 序列化：无变化时 detail 就是摘要（不写标记、不产生噪音）", () => {
  assert.equal(diffDetail("修改人员 张三", []), "修改人员 张三");
  assert.equal(hasDiff("修改人员 张三"), false);
  const withDiff = diffDetail("修改人员 张三", [{ label: "日工资", before: "280.00", after: "300.00" }]);
  assert.equal(withDiff, `修改人员 张三${DIFF_MARK}日工资：280.00 → 300.00`);
  assert.equal(hasDiff(withDiff), true);
});

test("B17 反解：parseDetail 能把 detail 还原成摘要 + 前后值（操作记录页靠它折叠展示）", () => {
  const changes: FieldChange[] = [
    { label: "张三 金额", before: "5,000.00", after: "6,000.00" },
    { label: "张三 发放日期", before: "待发放", after: "2026-09-05" },
    { label: "李四 金额", before: "2,000.00", after: "2,500.00" },
  ];
  const detail = diffDetail("3 条", changes);
  const back = parseDetail(detail);
  assert.equal(back.summary, "3 条");
  assert.deepEqual(back.changes, changes);
  // 历史记录（只写了摘要、没有标记）也必须能读
  assert.deepEqual(parseDetail("修改发放 3条"), { summary: "修改发放 3条", changes: [] });
  assert.deepEqual(parseDetail(""), { summary: "", changes: [] });
});

test("B17 截断：改动太多就截断并标注「…（另有 N 项）」，反解不会多出一条半截的改动", () => {
  const many: FieldChange[] = Array.from({ length: 30 }, (_, i) => ({
    label: `王${i} 金额`,
    before: "1,000.00",
    after: "2,000.00",
  }));
  const text = formatChanges(many);
  assert.ok(text.length <= MAX_DIFF_CHARS, `截断后长度必须受控，实际 ${text.length}`);
  assert.match(text, /…（另有 \d+ 项）$/, "截断必须标注还剩几项，否则看的人以为只有这些");
  const back = parseDetail(diffDetail("30 条", many));
  assert.ok(back.changes.length > 0, "截断后仍要能读出前面几条");
  assert.ok(back.changes.length < many.length);
  const dropped = Number(text.match(/…（另有 (\d+) 项）$/)![1]);
  assert.equal(back.changes.length + dropped, many.length, "读出来的条数 + 未记录的条数 = 总条数");
  for (const c of back.changes) assert.match(c.after, /^2,000\.00$/, "不许出现被截断的半截 value");
  // 单条本身超长（例如一句超长的名单）：硬截断并标注，不能留半截让人误读
  const one = formatChanges([{ label: "名单", before: "（无）", after: "张".repeat(400) }]);
  assert.match(one, /…（已截断）$/);
  assert.ok(one.length <= MAX_DIFF_CHARS, `单条超长也要受控，实际 ${one.length}`);
});

test("B17 长度纪律：客户端截断上限必须小于服务端 400 字上限（否则会被服务端拦腰截断）", async () => {
  const api = await src("src/routes/api/audit.ts");
  expectMinHits("api/audit.ts 里 detail 的 400 字上限", countHits(api, /slice\(0, 400\)/g), 2, "POST 与 PUT 各一处");
  assert.ok(MAX_DIFF_CHARS + 40 < 400, `客户端上限 ${MAX_DIFF_CHARS} 要留出摘要空间，且小于服务端 400`);
});

/* ＝＝ ③ 删除留痕（只记改动前） ＝＝ */

test("B17 删除发放/人员/报销：只记改动前（谁、什么时候、多少钱），不写无用的「改动后」", () => {
  const del = paymentDeletedChanges([pay({ id: "x1", owner: "张三", date: "2026-08-05", amount: 5000 })]);
  assert.deepEqual(del, [{ label: "张三 2026-08-05", before: "¥5,000.00", after: "已删除" }]);
  const delPending = paymentDeletedChanges([pay({ id: "x2", owner: "李四", date: "", amount: 1200 })]);
  assert.equal(delPending[0].label, "李四 待发放", "无日期的记录标「待发放」，与列表同一个说法");

  const ppl = personDeletedChanges([person({ name: "王五" })]);
  assert.deepEqual(ppl, [{ label: "王五", before: "一班 ¥280/天", after: "已删除" }]);

  const exp = expenseDeletedChanges([expense({ name: "水泥", amount: 250, claimant: "张三", status: "未报销" })]);
  assert.deepEqual(exp, [{ label: "水泥", before: "张三 ¥250.00 未报销", after: "已删除" }]);
});

test("B17 批量改写：只保留真的改了的记录，label 带记录识别名", () => {
  const changes = batchChanges(
    [
      { before: pay({ id: "a", owner: "张三", amount: 100 }), after: pay({ id: "a", owner: "张三", amount: 200 }) },
      { before: pay({ id: "b", owner: "李四", amount: 300 }), after: pay({ id: "b", owner: "李四", amount: 300 }) },
    ],
    paymentChanges,
    (p) => p.owner,
  );
  assert.deepEqual(changes, [{ label: "张三 金额", before: "100.00", after: "200.00" }], "没变的李四不进记录");
});

/* ＝＝ ④ 静态守卫：关键动作必须带前后值；页面不许自己拼 ＝＝ */

/** 关键改写/删除动作（store.ts 里的 logOp 动作名）：必须带前后值 */
const REQUIRED_ACTIONS = [
  "修改人员",
  "修改发放",
  "保存月考勤",
  "修改合同",
  "修改合同明细",
  "修改报销",
  "删除发放",
  "删除人员",
  "删除报销",
];

test("B17 守卫：store.ts 里的关键改写动作必须带上「改动前 → 改动后」（删了 diffDetail 立刻红）", async () => {
  const store = stripComments(await src("src/lib/store.ts"));
  const bad: string[] = [];
  for (const action of REQUIRED_ACTIONS) {
    const i = store.indexOf(`"${action}"`);
    if (i < 0) {
      bad.push(`${action}: store.ts 里找不到这个动作（改名了？守卫要同步改）`);
      continue;
    }
    // 这条动作后面的 logOp 调用里必须出现 diffDetail（前后值唯一入口）
    const window = store.slice(i, i + 300);
    if (!window.includes("diffDetail(")) bad.push(`${action}: 只记了「改了」，没记改动前/改动后（缺 diffDetail(）`);
  }
  // 命中数下限自检：动作清单漏项 / store.ts 被搬家 / 正则失效时，上面循环会一条都不触发而假绿
  expectMinHits("B17 守卫：受管的关键动作数", REQUIRED_ACTIONS.length, 9, "现有 9 个改写/删除动作");
  expectMinHits("B17 守卫：store.ts 里 diffDetail( 调用点数", countHits(store, /diffDetail\(/g), 9, "9 个动作各一处");
  expectRegexCatches(/diffDetail\(/, 'logOp("修改发放", diffDetail("1条", []));', "前后值入口");
  assert.deepEqual(bad, [], `误改误删要能凭操作记录重建，这些动作必须记前后值：\n${bad.join("\n")}`);
});

test("B17 守卫：前后值只有 lib/audit-diff.ts 一份实现，页面/组件不许自己拼字符串", async () => {
  const files = [
    ...(await readdir(repo("src/routes"))).filter((f) => /\.tsx$/.test(f)).map((f) => `src/routes/${f}`),
    ...(await readdir(repo("src/components"))).filter((f) => /\.tsx$/.test(f)).map((f) => `src/components/${f}`),
  ];
  expectMinHits("B17 守卫：扫描到的页面/组件数", files.length, 25, "src/routes + src/components 现有 31 个 .tsx");
  const offenders: string[] = [];
  for (const f of files) {
    if (f === "src/routes/audit.tsx") continue; // 操作记录页是**读**这个标记（折叠展示），不算拼字符串
    const text = stripComments(await src(f));
    if (text.includes(DIFF_MARK)) offenders.push(f);
  }
  // 坏样本自检：把标记贴进页面必须能被这条判据抓到
  expectRegexCatches(new RegExp(DIFF_MARK), `detail = "修改人员 张三${DIFF_MARK}日工资：280 → 300"`, "前后值标记");
  assert.deepEqual(
    offenders,
    [],
    `前后值字符串只许由 lib/audit-diff.ts 生成（否则格式立刻分叉、操作记录页解析不出来）：\n${offenders.join("\n")}`,
  );
  // 唯一实现自检：DIFF_MARK 在整个 src/ 里只能定义一次
  let defs = 0;
  for (const dir of ["src/lib", "src/routes", "src/components"]) {
    for (const f of await readdir(repo(dir))) {
      if (!/\.tsx?$/.test(f)) continue;
      defs += countHits(await src(`${dir}/${f}`), /export const DIFF_MARK/g);
    }
  }
  assert.equal(defs, 1, "DIFF_MARK 只许在 lib/audit-diff.ts 定义一次");
});

test("B17 可见性守卫：操作记录页必须把前后值显示出来（写了不展示 = 等于没修）", async () => {
  const page = stripComments(await src("src/routes/audit.tsx"));
  assert.match(page, /parseDetail\(/, "操作记录页必须用 parseDetail 反解前后值");
  assert.match(page, /<details/, "前后值要能折叠/展开查看（不破坏现有「内容」列）");
  expectMinHits("B17 守卫：操作记录页解析前后值的调用点数", countHits(page, /parseDetail\(/g), 1, "组件里一次 + 测试一次");
});
