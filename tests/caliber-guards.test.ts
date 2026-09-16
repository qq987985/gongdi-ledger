/**
 * 口径一致性守卫（口径一致性专项 20260916）。
 *
 * 这一型缺陷（同一份数据在列表/汇总/分组/下拉/打印里对不上）不会让 typecheck 或单元测试变红：
 * 它靠「两个地方各写一遍同样的过滤」慢慢长出来。所以这里做静态扫描，把唯一实现钉死 ——
 * 以后谁再就地写一份 `filter(Boolean)` 造下拉、再写一份「备注算不算有内容」，
 * `pnpm test` 直接红。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const src = (p: string) => readFile(repo(p), "utf8");

/** 去掉注释再扫：注释里可能正好写着「以前这里 .slice(0, 12)」这类说明 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}
const srcCode = async (p: string) => stripComments(await src(p));

test("守卫：'有内容'（备注也算）只有 work.ts 一份实现，各处只许调用", async () => {
  const work = await src("src/lib/work.ts");
  assert.match(work, /export function hasContent/, "唯一实现必须在 work.ts");
  assert.equal(
    (work.match(/export function hasContent/g) || []).length,
    1,
    "hasContent 只能定义一次",
  );
  // 五处必须调用它（月度卡/年度汇总/工资条/整本导出/导出月份识别）
  const users: [string, RegExp][] = [
    ["src/lib/dates.ts", /hasContent\(r\)/],
    ["src/lib/attendance-summary.ts", /import \{ hasContent \}/],
    ["src/routes/query.tsx", /hasContent\(a\)/],
    ["src/lib/excel/full.ts", /return hasContent\(a\)/],
    ["src/routes/api/file/$kind.ts", /if \(!hasContent\(a\)\) continue/],
  ];
  for (const [file, re] of users) {
    assert.match(await src(file), re, `${file} 必须走 hasContent（不许就地再写一份备注判断）`);
  }
  // 反例：这些文件里不许再出现「hasWork + remark」就地组合
  for (const file of ["src/lib/dates.ts", "src/lib/excel/full.ts", "src/routes/api/file/$kind.ts"]) {
    const text = await src(file);
    assert.equal(
      /hasWork\([^)]*\)\s*(&&|\|\|)[^;\n]*\.remark/.test(text),
      false,
      `${file} 里出现了 hasWork + remark 的就地组合（第二套口径）`,
    );
  }
});

test("守卫：筛选下拉选项必须走 lib/buckets（不许再用 map(...).filter(Boolean) 丢空值桶）", async () => {
  const uses: [string, RegExp][] = [
    ["src/routes/payments.tsx", /sourceBuckets\(/],
    ["src/routes/expenses.tsx", /claimantBuckets\(/],
    ["src/routes/insurance.tsx", /leaderBuckets\(/],
    ["src/routes/index.tsx", /teamRows\(/],
    ["src/routes/people.tsx", /groupBuckets\(/],
    ["src/routes/query.tsx", /groupBuckets\(/],
  ];
  for (const [file, re] of uses) {
    assert.match(await src(file), re, `${file} 的下拉选项必须来自 lib/buckets`);
    const text = await srcCode(file);
    assert.equal(
      /new Set\([^)]*map\([^)]*\)\.filter\(Boolean\)/.test(text),
      false,
      `${file} 又出现了 [...new Set(x.map(...).filter(Boolean))] —— 空值那一桶会再次消失`,
    );
  }
});

test("守卫：发放页的统计与打印只能来自 payments-stats（画面与纸张不许两套数）", async () => {
  const page = await srcCode("src/routes/payments.tsx");
  for (const fn of ["paymentSummary(", "panelRows(", "sourceBuckets(", "detailSections(", "printSummary(", "printTotals("]) {
    assert.match(page, new RegExp(fn.replace("(", "\\(")), `发放页要用 ${fn})`);
  }
  assert.equal(page.includes(".slice(0, 12)"), false, "分组面板不许再截断前 12 人（会与汇总对不上）");
  const sheets = await srcCode("src/components/payment-sheets.tsx");
  assert.match(sheets, /from "~\/lib\/payments-stats"/, "打印件必须吃 lib/payments-stats 的类型/数据");
  assert.equal(sheets.includes(".reduce("), false, "打印件不许自己再算一遍合计（合计只能来自纯函数传进来的 totals）");
  assert.match(sheets, /printCaliberNote\(mode\)/, "打印件表头口径小字必须走唯一实现（1.8.6：两种清单分别写清）");
  // 明细清单必须逐笔标状态 + 小计拆「已发小计 / 待发小计」（1.8.6 用户追加要求）
  assert.match(sheets, /已发小计/, "明细清单要有「已发小计」");
  assert.match(sheets, /待发小计/, "明细清单要有「待发小计」");
  assert.match(sheets, /isPaid\(p\) \? "已发" : "待发"/, "明细清单每一笔要标注「已发 / 待发」");
});

test("守卫：「已发」判定是 isPaid、「本人收款」是 isPaidSelf（两种用途不许再混，1.8.6）", async () => {
  const payLib = await src("src/lib/payments-stats.ts");
  assert.equal((payLib.match(/export function isPaid\(/g) || []).length, 1, "isPaid 只能定义一次");
  assert.equal((payLib.match(/export function isPaidSelf\(/g) || []).length, 1, "isPaidSelf 只能定义一次");
  // 汇总口径（发放统计 / 年度汇总）：已发走 isPaid
  assert.match(payLib, /rows\.filter\(isPaid\)/, "发放统计的已发必须走 isPaid");
  const attSum = await srcCode("src/lib/attendance-summary.ts");
  assert.match(attSum, /yearPay\.filter\(isPaid\)/, "年度汇总的已发必须走 isPaid");
  assert.equal(
    attSum.includes("isPaidSelf"),
    false,
    "年度汇总又拿 isPaidSelf 判已发了 —— 这正是 1.8.5 把代发扣出已发的错",
  );
  // 单人视角（工资条）：本人已打款走 isPaidSelf
  assert.match(await src("src/routes/query.tsx"), /filter\(isPaidSelf\)/, "工资条「已打款（本人）」走 isPaidSelf");
  // 两种清单的口径小字各只有一处定义，且明确不同
  assert.equal((payLib.match(/export const PRINT_CALIBER_NOTE_DETAIL/g) || []).length, 1);
  assert.equal((payLib.match(/export const PRINT_CALIBER_NOTE_SUMMARY/g) || []).length, 1);
  // 页面上不许再就地写「已发 = owner === receiver」
  for (const file of ["src/routes/payments.tsx", "src/routes/attendance.tsx", "src/routes/index.tsx"]) {
    assert.equal(/owner === receiver/.test(await srcCode(file)), false, `${file} 里又出现了 owner === receiver 的就地判定`);
  }
  const insLib = await src("src/lib/insurance.ts");
  assert.equal((insLib.match(/export const COMBINED_POLICY_NOTE/g) || []).length, 1, "组合险标注只能定义一次");
  const insPage = await src("src/routes/insurance.tsx");
  assert.equal(
    (insPage.match(/COMBINED_POLICY_NOTE/g) || []).length >= 2,
    true,
    "保险页屏幕 + 打印件都要带这句组合险标注（决策三）",
  );
  assert.match(await src("src/lib/insurance-stats.ts"), /export function linkedPolicyTargets/, "互挂目标唯一实现");
  assert.match(insPage, /linkedPolicyTargets\(/, "页面 syncLinked 走唯一实现");
});

test("守卫：总览 KPI 与考勤年度汇总共用 lib/attendance-summary（口径构造上一致）", async () => {
  const home = await src("src/routes/index.tsx");
  const att = await src("src/routes/attendance.tsx");
  assert.match(home, /summarizeYear\(/, "总览必须用 summarizeYear");
  assert.match(att, /summarizeYear\(/, "考勤页必须用 summarizeYear");
  assert.match(home, /fallbackPayYear\(/, "无日期发放的归属年份要统一");
  assert.match(att, /fallbackPayYear\(/, "无日期发放的归属年份要统一");
  // 旧的各写一遍的痕迹不许回来
  assert.equal(/paymentsInYear\(/.test(home), false, "总览不再自己筛发放年份");
  assert.equal(/paymentsInYear\(/.test(att), false, "考勤页不再自己筛发放年份");
});

test("守卫：合同的合计只有一个实现（总览 KPI 与合同页表尾同源）", async () => {
  assert.match(await src("src/routes/contracts.tsx"), /sumContractRollups\(/);
  assert.match(await src("src/routes/index.tsx"), /contractPayable\(/);
  assert.equal(
    /acc\.payable \+= r\.payable/.test(await src("src/routes/contracts.tsx")),
    false,
    "合同页不许再就地写一份合计 reduce",
  );
});
