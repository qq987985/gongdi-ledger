/** 合成数据性能对拍，不读取生产 data。
 * node --import ./tests/register.mjs ci/summary-benchmark.mjs --save /tmp/summary.json
 * node --import ./tests/register.mjs ci/summary-benchmark.mjs --compare /tmp/summary.json
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { summarizeYear, teamRows } from "../src/lib/attendance-summary.ts";

const people = Array.from({ length: 1000 }, (_, i) => ({
  id: `p${i}`, name: `人员${i}`, team: i % 9 ? `班组${i % 30}` : "", payType: "day",
  dailyWage: 200 + i % 99, monthWage: 0, otRule: "按小时:25", mealAllowance: 12.3,
  wageHistory: [],
}));
const attendance = people.flatMap((p, i) => [2024, 2025, 2026].flatMap((year) =>
  Array.from({ length: 12 }, (_, m) => ({
    id: `a-${p.id}-${year}-${m}`, name: `${p.name} `, year, month: m + 1, team: p.team,
    days: i % 31, otHours: i % 4, allowance: 0.1, deduction: 0.2, remark: i % 3 ? "" : "备注",
  })),
));
const payments = people.flatMap((p, i) => Array.from({ length: 12 }, (_, m) => ({
  id: `pay-${p.id}-${m}`, owner: p.name, receiver: i % 3 ? p.name : "代收人",
  date: m % 5 ? `2026-${String(m + 1).padStart(2, "0")}-20` : "", amount: 1234.56,
  source: "测试", remark: "",
})));
const args = { people, attendance, payments, year: 2026, fallbackYear: 2026 };
summarizeYear(args); // 预热
const times = [];
let result;
for (let n = 0; n < 5; n++) {
  const start = performance.now();
  result = { summary: summarizeYear(args), teams: teamRows(people) };
  times.push(performance.now() - start);
}
const [mode, path] = process.argv.slice(2);
if (mode === "--save") await writeFile(path, JSON.stringify(result));
if (mode === "--compare") assert.deepEqual(result, JSON.parse(await readFile(path, "utf8")));
console.log(JSON.stringify({ people: people.length, attendance: attendance.length, payments: payments.length,
  medianMs: times.sort((a, b) => a - b)[2], samplesMs: times,
  compared: mode === "--compare",
}, null, 2));
