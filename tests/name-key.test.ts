/**
 * 姓名口径统一（专家评审 A-1）回归测试。
 *
 * 现象（评审实测）：同一本台账里姓名 trim 口径不一 ——
 * 人员姓名**从不 trim**（人员表单原样入库）、发放 owner **保存时 trim**、Excel 导入 **trim**，
 * 而年度汇总只 trim 比较的**一侧**。于是「张三 」与「张三」被当成两个人：
 * · 年度表把一个人拆成两行：一行「应发 6000 / 已发 0 / 未发 6000」，
 *   另一行「应发 0 / 已发 6000 / 未发 −6000」+ 备注「本年无考勤记录」；
 * · 更严重：人员名带尾空格、考勤来自 Excel（已 trim）时，该人整年出勤被**静默归零**
 *   （应发 KPI 丢钱），界面上没有任何提示。
 *
 * 修法：唯一实现 `nameKey()`（`src/lib/receiver.ts`）+ 写入口统一 trim + 比较两侧都过键。
 * 本测试先用纯函数钉住「混了空格的同一人只出现一行、出勤与已发都不丢」，
 * 再用源码守卫钉住「写入口 trim」与「比较走键」不会在下次改动里退化。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { nameKey, ownerKey, receiverOf, isProxyReceiver } from "../src/lib/receiver";
import { personMonths, summarizeYear } from "../src/lib/attendance-summary";
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";
import type { AttendanceRow, Payment, Person } from "../src/lib/types";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const read = (p: string) => readFile(repo(p), "utf8");
/** 去掉行注释再扫：注释里会写「以前这里是 x.owner === name」这类历史说明，不该被守卫当成违规 */
const stripLineComments = (s: string) => s.split("\n").map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1")).join("\n");

function person(over: Partial<Person> & { id: string; name: string }): Person {
  return {
    team: "一组",
    personNo: "",
    idCard: "",
    gender: "男",
    age: 30,
    birthday: "",
    phone: "",
    dailyWage: 300,
    monthWage: 0,
    payType: "day",
    otRule: "",
    mealAllowance: 0,
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
  return { team: "一组", days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "", ...over };
}
function pay(over: Partial<Payment> & { id: string }): Payment {
  return { owner: "", receiver: "", date: "", amount: 0, source: "", remark: "", ...over };
}

/* ─────────── nameKey / ownerKey 本身 ─────────── */

test("A-1 nameKey：只去首尾空白，不改写内容（null/undefined/数字都安全）", () => {
  assert.equal(nameKey("张三"), "张三");
  assert.equal(nameKey("张三 "), "张三");
  assert.equal(nameKey(" 张三"), "张三");
  assert.equal(nameKey("  张三  "), "张三");
  assert.equal(nameKey("\t张三\n"), "张三");
  assert.equal(nameKey(""), "");
  assert.equal(nameKey("   "), "");
  assert.equal(nameKey(null), "");
  assert.equal(nameKey(undefined), "");
  assert.equal(nameKey(0), "0");
  // 中间的空格是姓名的一部分，不能动（「王 小明」≠「王小明」）
  assert.equal(nameKey("王 小明"), "王 小明");
  // 同名不同写法必须同键（这就是「一个人两行」的根因）
  assert.equal(nameKey("张三"), nameKey("张三 "));
});

test("A-1 ownerKey / receiverOf：都走同一个 trim（空收款人 = 本人不变）", () => {
  assert.equal(ownerKey({ owner: "张三 " }), "张三");
  assert.equal(receiverOf({ owner: "张三 ", receiver: "" }), "张三");
  assert.equal(receiverOf({ owner: "张三 ", receiver: " 李四 " }), "李四");
  assert.equal(isProxyReceiver({ owner: "张三 ", receiver: "" }), false, "空收款人不算代收");
  assert.equal(isProxyReceiver({ owner: "张三", receiver: "李四" }), true);
});

/* ─────────── 年度表：混空格也只出一行，出勤与已发都不丢 ─────────── */

test("A-1 混用「张三」与「张三 」：年度表只有一行，出勤天数与已发金额都不丢", () => {
  const people = [person({ id: "p1", name: "张三 ", dailyWage: 300 })]; // 人员表里带尾空格（历史数据）
  const attendance = [
    att({ id: "a1", name: "张三 ", year: 2026, month: 3, days: 20 }), // 手动/旧数据：带空格
    att({ id: "a2", name: "张三", year: 2026, month: 4, days: 5 }), // Excel 导入：已 trim
  ];
  const payments = [
    pay({ id: "y1", owner: "张三", receiver: "张三", date: "2026-03-10", amount: 6000 }),
  ];
  const s = summarizeYear({ people, attendance, payments, year: 2026, fallbackYear: 2026 });

  assert.equal(s.rows.length, 1, `同一个人只能一行，实际 ${s.rows.length} 行：${s.rows.map((r) => r.person.name).join(" / ")}`);
  const row = s.rows[0];
  assert.equal(row.noAttendance, false, "不该出现「本年无考勤记录」的补行");
  assert.equal(row.remark, "");
  assert.equal(row.yearDays, 25, "两个月的出勤都要算进来（旧行为：整年出勤静默归零）");
  assert.equal(row.yearPayAmt, 7500);
  assert.equal(row.paid, 6000, "已发金额必须落在这一行上");
  assert.equal(row.unpaid, 1500, "不能出现 −6000 的「未发」");
  assert.equal(s.should, 7500, "应发 KPI 不许被静默归零");
  assert.equal(s.paid, 6000);
  assert.equal(s.rowsPaidSum, 6000, "逐行已发之和 == 已发放 KPI");
  assert.deepEqual(s.offRowsPaid, { count: 0, amount: 0 }, "没有落不到行上的钱");
});

test("A-1 反向：人员表干净、考勤带空格（老数据），同样只出一行且出勤不丢", () => {
  const people = [person({ id: "p1", name: "李四", dailyWage: 200 })];
  const attendance = [att({ id: "a1", name: "李四 ", year: 2026, month: 5, days: 10 })];
  const payments = [pay({ id: "y1", owner: "李四 ", receiver: "", date: "2026-05-31", amount: 2000 })];
  const s = summarizeYear({ people, attendance, payments, year: 2026, fallbackYear: 2026 });
  assert.equal(s.rows.length, 1);
  assert.equal(s.rows[0].yearDays, 10);
  assert.equal(s.should, 2000);
  assert.equal(s.rows[0].paid, 2000, "owner 带空格也要计入本人");
  assert.equal(s.rows[0].unpaid, 0);
});

test("A-1 代收人也带空格时：核对等式仍成立（代发 ⊆ 已发、逐行之和 == KPI）", () => {
  const people = [person({ id: "p1", name: "张三 " }), person({ id: "p2", name: "李四" })];
  const attendance = [
    att({ id: "a1", name: "张三", year: 2026, month: 3, days: 20 }),
    att({ id: "a2", name: "李四", year: 2026, month: 3, days: 10 }),
  ];
  const payments = [
    pay({ id: "y1", owner: "张三 ", receiver: "李四 ", date: "2026-03-10", amount: 1000 }), // 李四代收
    pay({ id: "y2", owner: "张三", receiver: "", date: "", amount: 500 }), // 待发放
  ];
  const s = summarizeYear({ people, attendance, payments, year: 2026, fallbackYear: 2026 });
  assert.equal(s.rows.length, 2);
  assert.equal(s.paid, 1000, "已发（含代发）= 1000");
  assert.equal(s.rowsPaidSum, s.paid);
  assert.equal(s.proxyAmt, 1000, "代发是已发的子集");
  assert.equal(s.pendingAmt, 500);
  assert.deepEqual(s.offRowsPaid, { count: 0, amount: 0 });
});

test("A-1 personMonths 也按姓名键取行（同月多行累加不受空格影响）", () => {
  const p = person({ id: "p1", name: "张三 ", dailyWage: 100 });
  const rows = [
    att({ id: "a1", name: "张三 ", year: 2026, month: 6, days: 3 }),
    att({ id: "a2", name: "张三", year: 2026, month: 6, days: 2 }),
  ];
  const months = personMonths(p, rows, 2026);
  assert.equal(months[5].days, 5, "两行都要落到同一个月（旧行为：只认带空格那一行）");
  assert.equal(months[5].pay, 500);
});

/* ─────────── 源码守卫：入库 trim + 比较走键 ─────────── */

test("A-1 源码守卫：姓名写入口必须统一 trim（store 是唯一写入口）", async () => {
  const store = await read("src/lib/store.ts");
  const WRITE_TRIM = /name: nameKey\(/g;
  const hits = countHits(store, WRITE_TRIM);
  expectRegexCatches(WRITE_TRIM, "name: nameKey(p.name),", "A-1 入库 trim 正则");
  expectMinHits(
    "A-1 store 的姓名字段写入口（upsertPerson / addPerson / replacePeople / saveAttendanceMonth / replaceAttendance）",
    hits,
    5,
    "现有 5 处姓名写入口",
  );
  assert.match(store, /import \{ nameKey \} from "\.\/receiver"/, "trim 走唯一实现 nameKey（不许自己写 trim()）");
});

test("A-1 源码守卫：年度汇总/Excel 汇总/工资条的姓名比较必须走 nameKey/ownerKey/receiverOf", async () => {
  // 年度汇总：4 处比较（人月、已发、worked、补行/安全网）
  const attSum = await read("src/lib/attendance-summary.ts");
  const attHits = countHits(attSum, /nameKey\(|ownerKey\(/);
  expectMinHits("A-1 attendance-summary 的姓名键调用点", attHits, 6, "现有 7 处（人月 2 + 已发 1 + worked 1 + rowNames 1 + orphans 2 + offRows 2）");
  assert.equal(
    /\.name === person\.name|person\.name === \(p\.owner/.test(attSum.slice(attSum.indexOf("export function"))),
    false,
    "年度汇总里不许再出现裸的姓名比较",
  );
  // Excel 整本导出的汇总/工天加班：按姓名匹配人员与发放
  const full = await read("src/lib/excel/full.ts");
  expectMinHits("A-1 excel/full 的姓名键调用点", countHits(full, /nameKey\(|ownerKey\(/), 5, "现有 5 处");
  assert.equal(/x\.name === p\.name|x\.owner === p\.name/.test(full), false, "full.ts 里不许再出现裸姓名比较");
  // 工资条（单人视角）：第 3/4 套收款人判定已收敛
  const query = stripLineComments(await read("src/routes/query.tsx"));
  expectMinHits("A-1/B-10 query 页的姓名键/收款人判定调用点", countHits(query, /nameKey\(|ownerKey\(|receiverOf\(/), 6, "现有 8 处");
  const BARE_OWNER_NAME = /\.(?:owner|receiver)\s*(?:===|!==)\s*[\w.]*\bname\b/;
  expectRegexCatches(BARE_OWNER_NAME, "const mine = pays.filter((x) => x.owner !== name);", "B-10 裸 owner/name 比较正则");
  assert.equal(BARE_OWNER_NAME.test(query), false, "工资条不许再用裸 owner/name 比较（走 ownerKey/receiverOf）");
  // Excel 导入：按姓名匹配人员/考勤
  const imp = await read("src/components/excel-import.tsx");
  expectMinHits("A-1 excel-import 的姓名键调用点", countHits(imp, /nameKey\(/), 4, "现有 5 处");
});
