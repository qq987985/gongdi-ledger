/**
 * 收款人判定 + 弹窗重置守卫（1.8.8 B 组）。
 *
 * · **G04**：空收款人被标成「代收」，与汇总「其中代发 0 笔」矛盾 → 统一走 `receiverOf()`。
 * · **A14**：「没设加班规则」被显示成「不计加班」，与顶部警示矛盾 → 空规则显示「未设加班规则」。
 * · **E11 / P19**：报销/人员/合同编辑弹窗的本地副本不随目标记录重置，
 *   「编辑 A 时点新增」会把 A 的字段带进新表单并**覆盖 A**（静默丢数据）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isProxyReceiver, receiverOf } from "../src/lib/receiver";
import { isProxyPaid } from "../src/lib/payments-stats";
import { paymentKey } from "../src/lib/excel/common";
import { OT_RULE_UNSET_LABEL, parseOtRule } from "../src/lib/wage";
import { expenseFormFromDraft } from "../src/lib/expense-rules";
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";

const repo = (p: string) => resolve(dirname(fileURLToPath(import.meta.url)), "..", p);
const read = (p: string) => readFile(join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), p), "utf8");

/* ── G04 ── */
test("G04 receiverOf：空收款人 = 本人；有值按去空白后的值算", () => {
  assert.equal(receiverOf({ owner: "钱七", receiver: "" }), "钱七");
  assert.equal(receiverOf({ owner: "钱七", receiver: "  " }), "钱七");
  assert.equal(receiverOf({ owner: "钱七", receiver: "王五的妻子" }), "王五的妻子");
  assert.equal(receiverOf({ owner: "钱七", receiver: "  王五  " }), "王五");
});

test("G04 空收款人既不算「代收」，也不计入「其中代发」（与统计口径一致）", () => {
  const blank = { owner: "钱七", receiver: "", date: "2026-07-01", amount: 0 };
  const realProxy = { owner: "赵六", receiver: "张三", date: "2026-07-02", amount: 50 };
  assert.equal(isProxyReceiver(blank), false, "空收款人不能标成代收");
  assert.equal(isProxyPaid(blank as any), false, "空收款人不能算进「其中代发」");
  assert.equal(isProxyReceiver(realProxy), true);
  assert.equal(isProxyPaid(realProxy as any), true);
  // 两者必须永远一致（列表/打印的标记 vs 汇总的统计）
  for (const p of [blank, realProxy, { owner: "甲", receiver: "甲", date: "2026-01-01", amount: 1 }])
    assert.equal(isProxyReceiver(p), isProxyPaid(p as any), `「代收」标记与「其中代发」统计必须同口径：${JSON.stringify(p)}`);
});

test("G04 空收款人 = 本人：与去重键同口径（键里也是 owner）", () => {
  assert.equal(
    paymentKey({ owner: "钱七", receiver: "", date: "2026-07-01", amount: 2000 }),
    paymentKey({ owner: "钱七", receiver: "钱七", date: "2026-07-01", amount: 2000 }),
  );
});

test("G04 源码守卫：列表/打印/工资条不许再用裸比较 owner !== receiver", async () => {
  const files = [
    "src/routes/payments.tsx",
    "src/components/payment-sheets.tsx",
    "src/routes/query.tsx",
  ];
  const NAKED_OWNER_RECEIVER = /\b[\w.]*owner\b\s*!==?\s*\b[\w.]*receiver\b/g;
  const NAKED_RECEIVER_OWNER = /\b[\w.]*receiver\b\s*!==?\s*\b[\w.]*owner\b/g;
  const bad: string[] = [];
  let receiverHits = 0;
  for (const f of files) {
    const src = await read(f);
    // 被扫文件必须真的在处理收款人（否则「0 命中」可能是扫了个空文件/换名后的文件）
    receiverHits += countHits(src, /receiverOf\(|isProxyReceiver\(/);
    for (const m of src.matchAll(NAKED_OWNER_RECEIVER)) bad.push(`${f}: ${m[0]}`);
    for (const m of src.matchAll(NAKED_RECEIVER_OWNER)) bad.push(`${f}: ${m[0]}`);
  }
  // ── 自检（专家评审 C2）：这条守卫的失败条件是「命中坏写法」，命中 0 处时是绿的 ——
  //    Code Reviewer 实测这里的正则**三份文件 0 命中**，谁都不知道是干净还是失效。
  //    ① 坏样本必须能被这两条正则抓到（正则本身是好的）；② 被扫文件必须真的在判收款人。
  expectRegexCatches(NAKED_OWNER_RECEIVER, "const mark = p.owner !== p.receiver;", "G04 裸比较正则（owner !== receiver）");
  expectRegexCatches(NAKED_RECEIVER_OWNER, "const mark = p.receiver !== p.owner;", "G04 裸比较正则（receiver !== owner）");
  expectMinHits("G04 守卫：三份受管文件里 receiverOf/isProxyReceiver 的调用点数", receiverHits, 3, "每份文件至少一处");
  assert.deepEqual(bad, [], `「代收」判定必须统一走 receiverOf()/isProxyReceiver()：\n${bad.join("\n")}`);
  const sheets = await read("src/components/payment-sheets.tsx");
  assert.match(sheets, /isProxyReceiver\(p\)/, "打印明细的「（代收）」标记要走同一判定");
});

/* ── A14 ── */
test("A14 没设加班规则 vs 显式不计加班：两种文案必须能区分", () => {
  assert.equal(parseOtRule("").label, OT_RULE_UNSET_LABEL);
  assert.equal(parseOtRule(undefined).label, OT_RULE_UNSET_LABEL);
  assert.equal(parseOtRule(null).label, OT_RULE_UNSET_LABEL);
  assert.equal(parseOtRule("   ").label, OT_RULE_UNSET_LABEL);
  // 老数据里手写的「不计加班」不是空规则，照原文显示（能看出是明确选过的）
  assert.equal(parseOtRule("不计加班").label, "不计加班");
  assert.notEqual(parseOtRule("").label, parseOtRule("不计加班").label, "两者不能显示成同一句话");
  // 计算口径不变：两种都是 kind=none（加班费 0）
  assert.equal(parseOtRule("").kind, "none");
  assert.equal(parseOtRule("不计加班").kind, "none");
  // 正常规则照旧
  assert.equal(parseOtRule("按小时:25").label, "按小时 25 元");
  assert.equal(parseOtRule("折算:8").label, "折算 8 小时/天");
});

test("A14 月表/人员页显示的文案与顶部警示同口径（空规则 = 未设）", async () => {
  const attendance = await read("src/routes/attendance.tsx");
  assert.match(attendance, /还没在人员表设加班规则/, "警示文案在");
  assert.match(attendance, /parsed: parseOtRule\(wage\.otRule \|\| ""\)/, "月表列取同一实现的解析结果");
  assert.match(attendance, /r\.parsed\.label/, "月表列渲染 label");
  const people = await read("src/routes/people.tsx");
  assert.match(people, /parseOtRule\(p\.otRule\)\.label/, "人员页列取同一实现的 label");
});

/* ── E11 / P19 ── */
test("E11 expenseFormFromDraft：初值可复用，且不会把上一条的字段带进来", () => {
  const a = { id: "a", name: "覆盖测试A", amount: 11, payAccount: "工行-123", payCardNo: "", payBank: "", status: "未报销", payoutDate: "2026-01-01" };
  const b = { id: "b", name: "", amount: 0, payAccount: "", payCardNo: "", payBank: "", status: "未报销", payoutDate: "" };
  const fa = expenseFormFromDraft(a);
  const fb = expenseFormFromDraft(b);
  assert.equal(fa.payBank, "工行-123", "没有卡号时回落到打款账户");
  assert.equal(fa.payoutDate, "", "未报销不留打款日期");
  assert.deepEqual([fb.name, fb.amount, fb.payAccount, fb.payBank], ["", 0, "", ""], "新增项必须是空表单");
  assert.notEqual(expenseFormFromDraft({ ...b, payCardNo: "6222" }).payBank, "工行-123", "有卡号时不再回落到账户");
  assert.deepEqual(fb, expenseFormFromDraft(b), "纯函数：同一输入同一输出");
  assert.equal(a.name, "覆盖测试A", "不得改动原 draft");
});

test("E11/P19 源码守卫：编辑弹窗的本地副本必须随目标记录 id 变化重置", async () => {
  // 4 个「本地副本」型编辑弹窗：挂载时取一份 draft/person 的副本，必须再有 [id] 同步 effect。
  // 少了它，点「新增」会把上一条的字段带进新表单 → 保存按同 id 覆盖，整条静默丢失（E11/P19 实测）。
  const editors: [string, RegExp][] = [
    ["src/routes/payments.tsx", /setC\(\{ \.\.\.draft \}\)[\s\S]{0,200}?\}, \[draft\.id\]\)/],
    ["src/components/expense-editor.tsx", /setC\(expenseFormFromDraft\(draft\)\)[\s\S]{0,200}?\}, \[draft\.id\]\)/],
    ["src/components/contract-editor.tsx", /setC\(draft\)[\s\S]{0,200}?\}, \[draft\.id\]\)/],
    ["src/routes/people.tsx", /setForm\(personForm\(person\)\)[\s\S]{0,200}?\}, \[person\.id\]\)/],
  ];
  for (const [file, re] of editors) {
    const src = await read(file);
    assert.match(src, re, `${file} 缺「随目标记录 id 重置本地副本」的同步 effect`);
  }
  expectMinHits("E11/P19 守卫：受管的编辑弹窗文件数", editors.length, 4, "现有 4 个本地副本型编辑器");
  // 初值只准有一处实现（挂载与重置共用），避免两边漂移
  const expense = await read("src/components/expense-editor.tsx");
  assert.equal((expense.match(/expenseFormFromDraft\(draft\)/g) || []).length, 2, "挂载 + 重置都走同一函数");
  assert.ok(!/payBank: draft\.payBank \|\|/.test(expense), "组件里不许再留第二份初值逻辑");
});
