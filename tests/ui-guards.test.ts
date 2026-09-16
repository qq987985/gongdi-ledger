/**
 * UI 约定守卫（1.7.16）。
 *
 * 2026-09-12 全量复查抓到的问题全是「规范写了、代码悄悄回退」型：
 * 单元测试测不到、构建不报错、人工看页面也不显眼。钉成静态扫描：
 *
 * 1. 用了 useGuardedClose 的弹窗，任何按钮不得直接 onClick={onClose}/{onCancel} ——
 *    那会绕过脏检查（历史上五个编辑器的「取消/关闭/×」全都绕过，只有遮罩和 Esc 生效）。
 * 2. 金额取整只有 src/lib/wage.ts 的 round2 一个来源（带 EPSILON）——
 *    不许在页面/组件里再写 `function round2`，也不许手写 `Math.round(x * 100) / 100`。
 * 3. 当天日期一律 dates.ts 的 localToday() —— 不许在页面/组件里定义本地 today 函数。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

/** 去掉注释，避免把注释里的示例当成真实代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

async function uiSources(): Promise<{ file: string; text: string }[]> {
  const out: { file: string; text: string }[] = [];
  for (const dir of ["src/routes", "src/components"]) {
    for (const name of await readdir(repo(dir))) {
      if (!/\.tsx?$/.test(name)) continue;
      out.push({ file: `${dir}/${name}`, text: stripComments(await readFile(repo(`${dir}/${name}`), "utf8")) });
    }
  }
  return out;
}

test("约定：用了 useGuardedClose 的文件，按钮不得直接 onClick={onClose/onCancel}（防误关绕过）", async () => {
  const bad: string[] = [];
  for (const { file, text } of await uiSources()) {
    if (!text.includes("useGuardedClose")) continue;
    for (const m of text.matchAll(/onClick=\{(onClose|onCancel)\}/g)) bad.push(`${file}: ${m[0]}`);
  }
  assert.deepEqual(
    bad,
    [],
    `这些按钮直接绑了 onClose/onCancel，绕过脏检查——应改调 requestClose（或保险页的 ModalCancelButton）：\n${bad.join("\n")}`,
  );
});

test("约定：金额取整只有 wage.ts 的 round2（页面/组件不得再定义或手写 Math.round(x*100)/100）", async () => {
  const bad: string[] = [];
  for (const { file, text } of await uiSources()) {
    if (/function round2\s*\(/.test(text)) bad.push(`${file}: 本地定义了 round2`);
    for (const m of text.matchAll(/Math\.round\([^)]*\*\s*100\)\s*\/\s*100/g)) bad.push(`${file}: 手写取整 ${m[0]}`);
  }
  assert.deepEqual(bad, [], `金额取整应统一 import { round2 } from "~/lib/wage"：\n${bad.join("\n")}`);
});

test("约定：当天日期一律 localToday()（页面/组件不得定义本地 today 函数）", async () => {
  const bad: string[] = [];
  for (const { file, text } of await uiSources()) {
    for (const m of text.matchAll(/function (today|todayYmd|nowYmd|todayStr)\s*\(/g)) bad.push(`${file}: ${m[0]}`);
  }
  assert.deepEqual(bad, [], `当天日期应统一 import { localToday } from "~/lib/dates"：\n${bad.join("\n")}`);
});

// ───────────────────── 打印件与屏幕内容必须分离（1.8.4） ─────────────────────

/**
 * 背景（用户实测）：发放记录页的「打印明细 / 打印汇总」点下去把**整个页面**都印出来了
 * （左侧导航、台账/年份切换、筛选栏、统计行、明细表格）。根因是 `window.print()` 与打印件都在，
 * 但屏幕内容没有套 `no-print`，而打印规则只有 `@media print { .no-print { display:none } }`。
 *
 * 仓库既有约定（`开发规范.md` §6 打印协议，**唯一范本 `src/routes/query.tsx`**）：
 *   <div className="no-print …">屏幕内容</div>   ← 打印时整块隐藏（屏幕上可见）
 *   <div className="print-only …">打印件</div>   ← 屏幕上隐藏（display:none），只在打印时显示
 * 也就是「屏幕内容 no-print」+「打印件放在它外面」，两者缺一不可。
 *
 * 这条守卫把约定钉死：含 `window.print()` 的页面必须
 * ① 有 `no-print` 包裹；② 有打印件（本文件 `print-only`，或渲染的组件源码里有 `print-only`，
 * 即打印件在屏幕态是隐藏的）；③ 打印件的**渲染点**在 `no-print` 包裹**之外**。
 */

/** 找到 `openIdx` 处那个 `<div` 的配对 `</div>` 位置（-1 = 没找到闭合） */
function matchingCloseDiv(code: string, openIdx: number): number {
  const re = /<(\/?)div\b[^>]*?(\/?)>/g;
  re.lastIndex = openIdx;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m[1] === "/") {
      depth -= 1;
      if (depth <= 0) return m.index;
      continue;
    }
    if (m[2] === "/") continue; // 自闭合 <div />
    depth += 1;
  }
  return -1;
}

/** className 含 no-print 的那个 div 的字符区间 */
function noPrintRanges(code: string): { open: number; close: number }[] {
  const out: { open: number; close: number }[] = [];
  for (const m of code.matchAll(/className="([^"]*)"/g)) {
    if (!m[1].split(/\s+/).filter(Boolean).includes("no-print")) continue;
    const before = code.slice(0, m.index ?? 0);
    const opens = [...before.matchAll(/<div\b/g)];
    const open = opens.length ? opens[opens.length - 1].index ?? 0 : m.index ?? 0;
    const close = matchingCloseDiv(code, open);
    if (close > open) out.push({ open, close });
  }
  return out;
}

/**
 * 打印件的渲染点（字符位置）。三种来源，任一命中即可：
 * - 本文件定义的打印件组件（`function Foo()` 体内含 print-only）的渲染点 `<Foo`；
 * - import 进来的打印件组件（`sheetNames`）的渲染点 `<Foo`；
 * - 都没有时退回本文件第一处 `print-only`（就地写的打印件）。
 */
function sheetRenderSites(code: string, sheetNames: readonly string[]): number[] {
  const inline: string[] = [];
  const fns = [...code.matchAll(/(?:export\s+)?function\s+([A-Z]\w*)\s*[({]/g)];
  fns.forEach((m, i) => {
    const start = m.index ?? 0;
    const end = i + 1 < fns.length ? fns[i + 1].index ?? code.length : code.length;
    if (/\bprint-only\b/.test(code.slice(start, end))) inline.push(m[1]);
  });
  const sites: number[] = [];
  for (const name of [...inline, ...sheetNames]) {
    const m = new RegExp(`<${name}\\b`).exec(code);
    if (m) sites.push(m.index);
  }
  if (!sites.length) {
    const idx = code.search(/\bprint-only\b/);
    if (idx >= 0) sites.push(idx);
  }
  return sites;
}

/**
 * 检查一个页面源码的打印分离；返回 null = 合规，否则返回原因。
 * `sheetNames` = 该文件 import 的、源码里含 `print-only` 的组件名（打印件由组件渲染的情况）。
 */
function printSeparationIssue(src: string, sheetNames: readonly string[]): string | null {
  const code = stripComments(src);
  if (!/window\.print\s*\(/.test(code)) return null; // 不打印的页面不管

  const wrappers = noPrintRanges(code);
  if (!wrappers.length) return "屏幕内容没有 no-print 包裹，打印会把整页（导航/筛选/表格）一起印出来";

  const sites = sheetRenderSites(code, sheetNames);
  if (!sites.length) return "没有任何打印件（print-only / 打印件组件）：点打印只会把屏幕内容印出来";

  // 只要有一个打印件的渲染点在所有 no-print 包裹之外，就说明它打印时能出现（query.tsx 范本）
  const outside = sites.some((i) => !wrappers.some((w) => i > w.open && i < w.close));
  if (!outside) return "打印件的渲染点都在 no-print 包裹之内——打印时会被一起隐藏，印出来是空白";
  return null;
}

test("守卫自检：printSeparationIssue 能抓出「打印件在包裹内」与「没有 no-print」两种坏样本", () => {
  const sheet = 'import { PaymentSheets } from "~/components/payment-sheets";\n';
  const good = `${sheet}const a = () => { window.print(); };\nreturn (<><div className="no-print space-y-5"><table/></div><PaymentSheets mode="detail"/></>);`;
  const noWrap = `${sheet}const a = () => { window.print(); };\nreturn (<div className="space-y-5"><table/><PaymentSheets/></div>);`;
  const inside = `${sheet}const a = () => { window.print(); };\nreturn (<div className="no-print space-y-5"><table/><PaymentSheets/></div>);`;
  const noSheet = `const a = () => { window.print(); };\nreturn (<div className="no-print"><table/></div>);`;
  const notPrinting = `return (<div className="space-y-5"><table/></div>);`;

  assert.equal(printSeparationIssue(good, ["PaymentSheets"]), null, "正确写法必须判合规");
  assert.match(String(printSeparationIssue(noWrap, ["PaymentSheets"])), /no-print/);
  assert.match(String(printSeparationIssue(inside, ["PaymentSheets"])), /之内|之前/);
  assert.match(String(printSeparationIssue(noSheet, [])), /打印件/);
  assert.equal(printSeparationIssue(notPrinting, []), null, "不调用 window.print 的页面不归它管");
  // 本文件直接写 print-only 的情况
  const inlineSheet = `const a = () => { window.print(); };\nreturn (<><div className="no-print"><table/></div><div className="print-only">清单</div></>);`;
  assert.equal(printSeparationIssue(inlineSheet, []), null);
  const inlineInside = `const a = () => { window.print(); };\nreturn (<div className="no-print"><table/><div className="print-only">清单</div></div>);`;
  assert.match(String(printSeparationIssue(inlineInside, [])), /之内|之前/);
});

test("约定：含 window.print() 的页面必须「屏幕内容 no-print + 打印件在外」（防整页被印出来）", async () => {
  const bad: string[] = [];
  let checked = 0;
  for (const { file, text } of await uiSources()) {
    if (!/window\.print\s*\(/.test(text)) continue;
    checked += 1;
    // 本文件 import 的组件里，哪些源码含 print-only（打印件由组件渲染）
    const sheetNames: string[] = [];
    for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"~\/components\/([\w\-/]+)"/g)) {
      const names = m[1].split(",").map((n) => n.trim().split(/\s+as\s+/).pop()?.trim() || "");
      const comp = m[2];
      let dep = "";
      try {
        dep = await readFile(fileURLToPath(new URL(`../src/components/${comp}.tsx`, import.meta.url)), "utf8");
      } catch {
        continue; // 目录/barrel：不在本守卫的范围内
      }
      if (!/\bprint-only\b/.test(dep)) continue;
      for (const n of names) if (n) sheetNames.push(n);
    }
    const issue = printSeparationIssue(text, sheetNames);
    if (!issue) continue;
    // 例外（有明确理由，不是放水）：`src/components/` 下的**弹窗**自己不打印
    // （外层 `print:hidden`），打印件由所属页面提供 —— 例：contract-editor 的「打印对账单」
    // 打的是 contracts.tsx 的 `print-only` 对账单，弹窗在打印态必须消失。
    if (file.startsWith("src/components/") && /\bprint:hidden\b/.test(text)) continue;
    bad.push(`${file}: ${issue}`);
  }
  assert.equal(checked >= 5, true, `应扫描到多个打印入口，实际 ${checked} 个（正则可能失效）`);
  assert.deepEqual(
    bad,
    [],
    `这些页面打印时会连屏幕内容一起印（或打印件被藏起来）：\n${bad.join("\n")}`,
  );
});

test("约定：弹窗面板不许用裸 max-h-screen（375×667 下 100vh 高于可视区，顶部按钮被裁，1.8.8 D6）", async () => {
  const bad: string[] = [];
  let checked = 0;
  for (const { file, text } of await uiSources()) {
    // 只审「弹窗面板」：文件里同时出现 fixed inset-0 遮罩
    if (!/fixed inset-0/.test(text)) continue;
    checked += 1;
    for (const m of text.matchAll(/className="([^"]*\bmax-h-screen\b[^"]*)"/g)) bad.push(`${file}: ${m[1]}`);
  }
  assert.equal(checked >= 4, true, `应扫描到多个弹窗文件，实际 ${checked} 个（正则可能失效）`);
  assert.deepEqual(
    bad,
    [],
    `这些弹窗面板用了 max-h-screen（100vh），小屏会被裁；改用 max-h-[calc(100dvh-4rem)] + md:max-h-[calc(100dvh-3rem)]：\n${bad.join("\n")}`,
  );
  // 反向自检：改造前的写法必须能被这条守卫抓出来（否则守卫是假绿）
  const sample = `<div className="fixed inset-0 z-50 flex items-end"><section className="max-h-screen w-full" /></div>`;
  assert.equal((sample.match(/className="([^"]*\bmax-h-screen\b[^"]*)"/g) || []).length, 1);
});
