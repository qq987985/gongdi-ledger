/**
 * 守卫「扫描命中数下限」自检工具（专家评审 C2，1.8.14 起）。
 *
 * 背景：这个项目有一批守卫测试靠**正则扫源码**（`readonly-guards` / `ui-guards` /
 * `guards-paths` / `receiver-and-editor-guards` …）。它们的失败条件是「命中了不该命中的东西」，
 * 于是**命中 0 处**也是绿的 —— 但 0 命中可能意味着：
 *   ① 代码真的干净（好）；
 *   ② 文件被搬家/改名、清单里少写了页面（守卫扫了个寂寞）；
 *   ③ 正则写坏了（永远匹配不上）；
 *   ④ 被扫文件是空文件 / 路径写错（正则没问题，但没内容可扫）。
 * ②③④ 都表现为「守卫假绿」：什么都没检查，却每次全绿，比没有守卫更危险（评审实测到两处）。
 *
 * 所以每个扫描类守卫都要**自己证明自己扫到了东西**，用下面两个工具：
 *   · `expectMinHits(what, hits, min)` —— 命中数低于下限直接失败，错误信息里写清「该有多少、为什么」；
 *   · `expectRegexCatches(re, badSample)` —— 把**坏样本**喂给这条正则，必须能命中：
 *     这证明「0 命中」是代码干净，而不是正则失灵（负向守卫的正样本对照）。
 *
 * 用法示范见 `tests/readonly-guards.test.ts` / `tests/ui-guards.test.ts` /
 * `tests/receiver-and-editor-guards.test.ts` / `tests/guards-paths.test.ts`。
 */
import assert from "node:assert/strict";

/**
 * 命中数下限自检：`hits` 必须 ≥ `min`。
 * `hint` 用来写清「这个下限是怎么来的」（例如「有编辑入口的页面现有 8 个」），
 * 将来页面增删时改动下限也有据可依。
 */
export function expectMinHits(what: string, hits: number, min: number, hint = ""): number {
  assert.equal(
    hits >= min,
    true,
    `[守卫自检] ${what}：只命中 ${hits} 处，低于应有的下限 ${min} 处` +
      ` —— 正则失效 / 清单漏项 / 文件被搬家改名 / 被扫文件为空，都会让这条守卫「假绿」` +
      `${hint ? `（${hint}）` : ""}`,
  );
  return hits;
}

/**
 * 正则正样本自检：把「坏样本」喂给它必须命中。
 * 负向守卫（断言「不许出现 X」）在命中 0 处时是绿的，所以必须用一个已知的坏样本证明
 * 这条正则本身是好的 —— 否则它可能早就匹配不上任何东西了（评审实测到 `receiver` 那条 0 命中）。
 */
export function expectRegexCatches(re: RegExp, badSample: string, what: string): number {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const hits = [...badSample.matchAll(new RegExp(re.source, flags))].length;
  assert.equal(
    hits >= 1,
    true,
    `[守卫自检] ${what}：正则 /${re.source}/ 连「坏样本」都抓不到 —— 这条守卫的 0 命中没有意义（假绿）。` +
      `坏样本：${badSample}`,
  );
  return hits;
}

/** 数一个正则在一段文本里的命中数（守卫里到处都要用，统一实现避免各写各的 matchAll） */
export function countHits(text: string, re: RegExp): number {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  return [...text.matchAll(new RegExp(re.source, flags))].length;
}
