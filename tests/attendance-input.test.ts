/**
 * 负出勤天数不许静默（专家评审 B-12②，1.8.14）回归测试。
 *
 * 现象：出勤天数能填负数（表单只 warn「> 31」，不 warn 负数），后果两个都不显眼：
 * ① 月表页脚照样求和 → **负工资**（`days × 日薪` 是负的）；
 * ② `hasWork` 只认 `days > 0` → 这条记录不算「有内容」→ 年度汇总 `worked` 判 false →
 *    **这个人在年度表里整年漏掉**（应发 KPI 少算他）。
 *
 * 处理方式（评审给的两种任选，这里选「展示层明确拒绝/提示」，判定与文案收在
 * `src/lib/attendance-input.ts`，页面只负责显示与拦截）：
 * · 一填成负数就提示；保存前再拦一道（负数的月份不落盘）；存量负数据由月表上方的警示条列名字。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { canSaveMonthDays, negativeDayRows, negativeDaysNotice } from "../src/lib/attendance-input";
import { monthPay } from "../src/lib/wage";
import { hasContent } from "../src/lib/work";
import { countHits, expectMinHits } from "./min-hits";

const read = (p: string) => readFile(fileURLToPath(new URL(`../${p}`, import.meta.url)), "utf8");

test("B-12② negativeDayRows：只挑负天数的行（0 / 正数 / 缺字段都不算）", () => {
  const rows = [
    { name: "张三", days: 20 },
    { name: "李四", days: -3 },
    { name: "王五", days: 0 },
    { name: "赵六", days: -0.5 },
    { name: "钱七" },
  ];
  assert.deepEqual(negativeDayRows(rows), [
    { name: "李四", days: -3 },
    { name: "赵六", days: -0.5 },
  ]);
  assert.deepEqual(negativeDayRows([]), []);
  assert.deepEqual(negativeDayRows(null), []);
  assert.deepEqual(negativeDayRows(undefined), []);
  // 姓名去掉首尾空白（与 lib/receiver.ts 的 nameKey 同口径）
  assert.deepEqual(negativeDayRows([{ name: " 李四 ", days: -1 }]), [{ name: "李四", days: -1 }]);
});

test("B-12② 文案：说清会出负工资 + 年度汇总漏人，并列出是谁（最多 5 个）", () => {
  assert.equal(negativeDaysNotice([{ name: "张三", days: 20 }]), "", "没有负数时不出提示");
  assert.equal(negativeDaysNotice([]), "");
  const one = negativeDaysNotice([{ name: "李四", days: -3 }]);
  assert.match(one, /李四 -3/);
  assert.match(one, /负工资/);
  assert.match(one, /年度汇总/);
  assert.match(one, /改成 0 或正数/);
  const many = negativeDaysNotice(
    Array.from({ length: 7 }, (_, i) => ({ name: `人${i}`, days: -1 })),
  );
  assert.match(many, /有 7 人/, "要先说总人数");
  assert.match(many, /等 7 人/, "超过 5 个只列前 5 个 + 总数");
  assert.equal(canSaveMonthDays([{ name: "张三", days: 1 }]), true);
  assert.equal(canSaveMonthDays([{ name: "张三", days: -1 }]), false);
  assert.equal(canSaveMonthDays([]), true, "空表当然能保存");
});

test("B-12② 坏行为的证据（口径本身不改）：负天数确实是负工资、且不算「有内容」", () => {
  const wage = { dailyWage: 300, payType: "day", otRule: "", mealAllowance: 0 };
  const calc = monthPay({ days: -3, otHours: 0, allowance: 0, deduction: 0 }, wage);
  assert.equal(calc.pay, -900, "月表页脚会出负工资（这就是不改计算、改拦截的原因）");
  assert.equal(hasContent({ days: -3, otHours: 0, allowance: 0, deduction: 0, remark: "" }), false, "负天数不算「有内容」→ 年度汇总会漏掉这个人");
  assert.equal(hasContent({ days: 3, otHours: 0, allowance: 0, deduction: 0, remark: "" }), true);
});

test("B-12② 源码守卫：月表必须显示警示条，且保存前拦住（判定走唯一实现）", async () => {
  const page = await read("src/routes/attendance.tsx");
  assert.match(page, /from "~\/lib\/attendance-input"/, "判定与文案走 lib（页面不许自己写一套负数判断）");
  expectMinHits("B-12② 月表里 negativeDayRows/negativeDaysNotice/canSaveMonthDays 的调用点", countHits(page, /negativeDayRows\(|negativeDaysNotice\(|canSaveMonthDays\(/), 4, "现有 5 处：警示条 2 + 输入提示 1 + 保存拦截 2");
  assert.match(page, /\{negativeRows\.length > 0 \? <p className="text-sm text-warn">\{negativeNotice\}<\/p> : null\}/, "月表上方要有警示条");
  assert.match(page, /if \(!canSaveMonthDays\(rows\)\) \{\s*toast\.error\(negativeDaysNotice\(rows\)\);\s*return;\s*\}/, "保存前必须拦住并给出原因");
  assert.match(page, /key === "days" && Number\(value\) < 0/, "输入时就该提示（不必等到保存）");
});
