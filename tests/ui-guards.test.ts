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
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";

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
  const AROUND_CLOSE = /onClick=\{(onClose|onCancel)\}/g;
  const bad: string[] = [];
  let guarded = 0;
  let requestCloseHits = 0;
  for (const { file, text } of await uiSources()) {
    if (!text.includes("useGuardedClose")) continue;
    guarded += 1;
    requestCloseHits += countHits(text, /requestClose\(/);
    for (const m of text.matchAll(AROUND_CLOSE)) bad.push(`${file}: ${m[0]}`);
  }
  // ── 扫描命中数下限自检（专家评审 C2）：这条守卫失败条件是「命中坏写法」，
  //    所以列表换名 / 正则失效 / 目录读空时它会静默变绿。下面三条把它钉住。
  expectMinHits("ui 守卫：用了 useGuardedClose 的文件数", guarded, 5, "现有 7 个（发放/报销/合同/保险/人员页 + 两个编辑器）");
  expectMinHits("ui 守卫：requestClose( 调用点数（正常关法要有）", requestCloseHits, 3, "现有 4 处");
  expectRegexCatches(AROUND_CLOSE, '<Button onClick={onClose}>关闭</Button>', "防误关守卫的坏写法正则");
  assert.deepEqual(
    bad,
    [],
    `这些按钮直接绑了 onClose/onCancel，绕过脏检查——应改调 requestClose（或保险页的 ModalCancelButton）：\n${bad.join("\n")}`,
  );
});

test("约定：金额取整只有 wage.ts 的 round2（页面/组件不得再定义或手写 Math.round(x*100)/100）", async () => {
  const bad: string[] = [];
  const sources = await uiSources();
  let round2Uses = 0;
  for (const { file, text } of sources) {
    if (/function round2\s*\(/.test(text)) bad.push(`${file}: 本地定义了 round2`);
    round2Uses += countHits(text, /round2\s*\(/);
    for (const m of text.matchAll(/Math\.round\([^)]*\*\s*100\)\s*\/\s*100/g)) bad.push(`${file}: 手写取整 ${m[0]}`);
  }
  // 自检：扫到的文件数与「真在用 round2 的地方」都不能是 0，否则这条守卫什么都没看
  expectMinHits("ui 守卫：扫到的页面/组件文件数", sources.length, 20, "src/routes + src/components 共 29 个");
  expectMinHits("ui 守卫：round2( 的使用点数（唯一实现的正面证据）", round2Uses, 10, "现有 30+ 处");
  assert.deepEqual(bad, [], `金额取整应统一 import { round2 } from "~/lib/wage"：\n${bad.join("\n")}`);
});

test("约定：当天日期一律 localToday()（页面/组件不得定义本地 today 函数）", async () => {
  const bad: string[] = [];
  const sources = await uiSources();
  let localTodayHits = 0;
  for (const { file, text } of sources) {
    localTodayHits += countHits(text, /localToday\(/);
    for (const m of text.matchAll(/function (today|todayYmd|nowYmd|todayStr)\s*\(/g)) bad.push(`${file}: ${m[0]}`);
  }
  expectMinHits("ui 守卫：localToday( 的使用点数（唯一实现的正面证据）", localTodayHits, 10, "现有 30+ 处");
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
  expectMinHits(
    "ui 守卫：扫描到的打印入口页面数",
    checked,
    8,
    "现有 8 处 window.print()：发放 / 保险 / 合同 / 报销（2 个按钮）/ 个人查询 / 合同编辑弹窗 + 1.8.15 新增的考勤页、人员页",
  );
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
  expectMinHits("ui 守卫：扫描到的弹窗文件数", checked, 4, "现有 8 个含 fixed inset-0 的弹窗");
  assert.deepEqual(
    bad,
    [],
    `这些弹窗面板用了 max-h-screen（100vh），小屏会被裁；改用 max-h-[calc(100dvh-4rem)] + md:max-h-[calc(100dvh-3rem)]：\n${bad.join("\n")}`,
  );
  // 反向自检：改造前的写法必须能被这条守卫抓出来（否则守卫是假绿）
  const sample = `<div className="fixed inset-0 z-50 flex items-end"><section className="max-h-screen w-full" /></div>`;
  assert.equal((sample.match(/className="([^"]*\bmax-h-screen\b[^"]*)"/g) || []).length, 1);
});

// ───────────────────── 打印分页（1.8.10） ─────────────────────

/**
 * 背景（用户实测）：发放记录「打印汇总」26 条就分页，**第一页还有很多空缺**，
 * 尾巴被整体推到第二页。实测到的三条根因（证据见 VERSION.txt [1.8.10]）：
 *  ① 打印件里用了**容器级** `break-inside-avoid`（每个人的明细 `section`、小表外层 `div`、
 *     整张对账单 `article`）：页底放不下就把整块推走 → 上一页留一大片空白
 *     （实测 26 笔 / 2 人 + 代收折行：第一页留白 **112.3mm**）；
 *  ② 外壳 `.app-bg` 的 `min-h-screen min-h-dvh` 在打印媒体里按纸张高度把容器撑到至少一屏，
 *     制造「提前断页 / 多一张空白页」；
 *  ③ 打印表格没有跨页表头规则，第二页起没有 `<thead>`。
 *
 * 约定（`src/styles.css` 的「打印分页协议」一处集中，`开发规范.md` §6.6 同步）：
 *  · 打印态一屏高一律清零（`.min-h-screen`/`.min-h-dvh`/`h-screen` → `min-height:0`），
 *    外壳 `.app-bg` 还要 `overflow:visible`（`overflow-x-hidden` 在打印态等于滚动容器，会裁内容）；
 *  · 整块不拆只允许这四种：`tr`（行）、`.print-keep`（小单元，如单据抬头）、
 *    `.print-doc`（**一条 = 一个人 / 一份单据**：发放明细里每个人的整节、合同对账单里每份合同 ——
 *    1.8.12 用户口径「整条放得下就并排塞满，放不下才另起一页」）、`.payslip`（裁切设计的单张工资条）；
 *    **组件里不许再出现写死的容器级 break-inside-avoid**；
 *  · 打印表格必须 `thead { display: table-header-group }`（第二页起照样有表头）。
 */

/** 取 CSS 里所有 `@media print { ... }` 块的正文（大括号配平，含嵌在 @layer 里的） */
function printMediaBlocks(css: string): string[] {
  const out: string[] = [];
  const re = /@media\s+print\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") depth -= 1;
      i += 1;
    }
    out.push(css.slice(m.index, i));
  }
  return out;
}

/** 打印块里所有带 break-inside:avoid 的规则选择器 */
function avoidSelectors(blocks: readonly string[]): string[] {
  const out: string[] = [];
  for (const block of blocks) {
    for (const rule of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = rule[2];
      if (/break-inside\s*:\s*avoid|page-break-inside\s*:\s*avoid/.test(body)) out.push(rule[1].trim());
    }
  }
  return out;
}

/** 白名单：整块不拆只允许在「行 / 一条单据 / 小单元」上（理由写在 styles.css 的注释里） */
const BREAK_AVOID_ALLOW = /(^|[\s,>])(tr|\.print-keep|\.print-doc|\.payslip)(\s|,|:|$)/;

test("约定：打印分页——打印态一屏高清零 + 打印表格表头跨页重复（styles.css）", async () => {
  const css = await readFile(repo("src/styles.css"), "utf8");
  const blocks = printMediaBlocks(css);
  assert.equal(blocks.length >= 2, true, `styles.css 里应有多处 @media print（现有 ${blocks.length} 处）`);
  const printCss = blocks.join("\n");

  // ① 一屏高清零：Min-h-screen / min-h-dvh / h-screen 必须在打印媒体里归零
  for (const cls of ["min-h-screen", "min-h-dvh"]) {
    const zeroed = new RegExp(`\\.${cls}[^{}]*\\{[^{}]*min-height\\s*:\\s*0`).test(printCss);
    assert.equal(zeroed, true, `打印态必须把 .${cls} 的 min-height 清零（否则外壳至少一屏高 → 提前分页/多一张空白页）`);
  }
  assert.match(printCss, /\.app-bg[^{}]*\{[^{}]*overflow\s*:\s*visible/, "打印态 .app-bg 必须 overflow:visible（overflow-x-hidden 在打印态是滚动容器，会裁掉超出内容）");

  // ② 表格跨页：表头每页重复
  assert.match(
    printCss,
    /\.print-only\s+thead[^{}]*\{[^{}]*display\s*:\s*table-header-group/,
    "打印表格必须有 `.print-only thead { display: table-header-group }`（第二页起要有表头）",
  );

  // ③ 整块不拆只许落在行/小单元上，不许再出现容器级
  const bad = avoidSelectors(blocks).filter((sel) => !BREAK_AVOID_ALLOW.test(sel));
  assert.deepEqual(
    bad,
    [],
    `打印件里这些选择器用了整块不拆，会把上一页留白（只允许 tr / .print-keep / .print-doc / .payslip）：\n${bad.join("\n")}`,
  );
  // 行级不拆必须在（否则一行会被腰斩）
  assert.match(printCss, /\.print-only\s+tr[^{}]*\{[^{}]*break-inside\s*:\s*avoid/, "打印表格的行必须 `break-inside: avoid`（不许把一行拆到两页）");
});

test("约定：打印件容器不许用 min-h-screen/min-h-dvh，也不许用容器级 break-inside-avoid（1.8.10 分页缺陷）", async () => {
  const bad: string[] = [];
  let sheets = 0;
  for (const { file, text } of await uiSources()) {
    const isSheet = /\bprint-only\b/.test(text);
    if (isSheet) sheets += 1;
    // 打印件（含 print-only 的文件）不许有一屏高的类
    if (isSheet) {
      for (const m of text.matchAll(/className="([^"]*)"/g)) {
        const hit = m[1].match(/\b(min-h-screen|min-h-dvh|h-screen)\b/);
        if (hit) bad.push(`${file}: 打印件用了 ${hit[1]}（打印态至少一屏高 → 提前分页）`);
      }
    }
    // 全库：不许再出现写死的容器级 break-inside-avoid（改由 styles.css 的 tr / .print-keep / .print-doc 承担）
    for (const m of text.matchAll(/className="([^"]*break-inside-avoid[^"]*)"/g)) bad.push(`${file}: 容器级 break-inside-avoid（class）`);
    for (const m of text.matchAll(/break-inside\s*:\s*avoid|breakInside\s*:\s*["']avoid["']/g)) bad.push(`${file}: 内联 ${m[0]}`);
  }
  expectMinHits("ui 守卫：扫描到的打印件文件数（含 print-only）", sheets, 4, "现有 5 个");
  assert.deepEqual(
    bad,
    [],
    `打印分页协议要求「整块不拆」只出现在行/一条/小单元上（tr、.print-keep、.print-doc，见 styles.css）：\n${bad.join("\n")}`,
  );
});

test("守卫自检：打印分页三条判据能抓出坏样本（改回旧写法必须变红）", () => {
  const oldCss = `
@media print {
  .no-print { display: none !important; }
  .print-only { display: block; }
  .payslip { break-inside: avoid; page-break-inside: avoid; }
}
@layer components { @media print { .print-only section { break-inside: avoid; } } }`;
  const blocks = printMediaBlocks(oldCss);
  assert.equal(blocks.length, 2, "嵌套在 @layer 里的 @media print 也要能被取到");
  const sel = avoidSelectors(blocks);
  assert.deepEqual(sel.filter((s) => !BREAK_AVOID_ALLOW.test(s)), [".print-only section"], "容器级 section 必须被白名单拦下");
  assert.equal(sel.some((s) => BREAK_AVOID_ALLOW.test(s)), true, "行/小单元白名单要能放行");
  assert.equal(BREAK_AVOID_ALLOW.test(".print-only .print-doc"), true, "一条单据（.print-doc）要在白名单里");
  const printCss = blocks.join("\n");
  assert.equal(/\.min-h-screen[^{}]*\{[^{}]*min-height\s*:\s*0/.test(printCss), false, "旧写法（没清零一屏高）必须判不合格");
  assert.equal(/\.print-only\s+thead[^{}]*\{[^{}]*display\s*:\s*table-header-group/.test(printCss), false, "旧写法（没跨页表头）必须判不合格");
  // 组件侧坏样本
  const sheetBad = `<div className="print-only min-h-screen"><section className="mt-3 break-inside-avoid">x</section></div>`;
  assert.equal((sheetBad.match(/(min-h-screen|min-h-dvh|h-screen)/g) || []).length, 1);
  assert.equal((sheetBad.match(/break-inside-avoid/g) || []).length, 1);
});

// ───────────────────── 打印件「续页认得出」与「合计只印一次」（1.8.11） ─────────────────────

/**
 * 用户口径（1.8.11）：「除非放不下下一个人或下一条记录才允许大空白；能塞下就省纸；
 * **我可以拆开分发**。」→ 拆开分发的前提是**每一页都认得出这是哪张单、哪个人**。
 *
 * 1.8.10 把「容器级 break-inside:avoid」清掉之后，单据会被拆到两页：
 *  · 保险清单第 2 页顶上只剩列标题（没有保单号/项目名）；
 *  · 合同对账单第 2 页顶上只剩「收款」两字（没有合同编号）；
 *  · 报销单第 2 页顶上只剩列标题（没有报销人）。
 * 实测（45 人 / 30 条明细，Chrome 出 A4 PDF）：这三处的续页首行就是上面那些残缺内容。
 *
 * 修法：把**单据抬头**从「表外的小标题 / 页头」搬进 `<thead>` 的第一行 ——
 * 表头本来就跨页重复（1.8.10 的 `thead { display: table-header-group }`），
 * 于是第一页不多占行（抬头原来也在），续页顶上多一行（≈4mm，续页本来就空着）。
 *
 * 同批的第二条：`tfoot` 的 UA 默认值是 `table-footer-group`，跨页时浏览器会在**每页**页脚
 * 重复合计行 —— 45 人汇总第 1 页只有前 32 人却印着「总计 46 笔 ¥343,500.00」，
 * 保险清单第 1 页只有 29 人却印着全单合计。拆开分发时会被当成「这一页的小计」，
 * 所以显式改回 `table-row-group`：整单合计只在表格结束时出现一次。
 */

/** 取出文件里所有 `<thead>…</thead>` 的正文 */
function theadBodies(text: string): string[] {
  return [...text.matchAll(/<thead>([\s\S]*?)<\/thead>/g)].map((m) => m[1]);
}

test("约定：打印分页——合计只在最后一页印一次（tfoot 不许每页重复）", async () => {
  const css = await readFile(repo("src/styles.css"), "utf8");
  const printCss = printMediaBlocks(css).join("\n");
  assert.match(
    printCss,
    /\.print-only\s+tfoot[^{}]*\{[^{}]*display\s*:\s*table-row-group/,
    "打印态必须 `.print-only tfoot { display: table-row-group }`：tfoot 默认 table-footer-group 会在每页页脚重复合计，半页下面印着整单合计会被当成这一页的小计",
  );
  // 坏样本自检：旧写法（没有这条规则）必须判不合格
  const oldCss = "@media print { .print-only thead { display: table-header-group; } .print-only tr { break-inside: avoid; } }";
  assert.equal(
    /\.print-only\s+tfoot[^{}]*\{[^{}]*display\s*:\s*table-row-group/.test(oldCss),
    false,
    "旧写法（没有 tfoot 规则）必须被判不合格",
  );
});

test("约定：单据抬头必须写在跨页重复的表头里（保险清单 / 合同对账单 / 报销单）", async () => {
  const cases: { file: string; token: RegExp; what: string }[] = [
    { file: "src/routes/insurance.tsx", token: /policyCaption\(/, what: "保单抬头（哪张保单/哪个班组/在保状态）" },
    { file: "src/routes/contracts.tsx", token: /\{label\}/, what: "合同抬头（合同编号 + 表名）" },
    { file: "src/routes/expenses.tsx", token: /\{identity\}/, what: "报销单抬头（报销人/收款人/开户行/打款账户）" },
  ];
  const bad: string[] = [];
  for (const c of cases) {
    const text = stripComments(await readFile(repo(c.file), "utf8"));
    const heads = theadBodies(text);
    if (!heads.length) {
      bad.push(`${c.file}: 找不到 <thead>（跨页表头本身就没有，续页更认不出）`);
      continue;
    }
    if (!heads.some((h) => c.token.test(h))) bad.push(`${c.file}: 表头里没有${c.what} —— 拆到第 2 页就认不出是哪张单`);
  }
  assert.deepEqual(bad, [], `单据抬头必须放进 thead 第一行（跟着表头每页重复）：\n${bad.join("\n")}`);

  // 坏样本自检：抬头写回「表外小标题」必须被抓出来
  const badSample = `<section><div className="print-title">{label}</div><table><thead><tr>{heads.map((h) => <th>{h}</th>)}</tr></thead><tbody /></table></section>`;
  assert.equal(theadBodies(badSample).some((h) => /\{label\}/.test(h)), false, "抬头在表外时必须判不合格");
  const goodSample = `<table><thead><tr><th colSpan={4}>{label}</th></tr><tr>{heads.map((h) => <th>{h}</th>)}</tr></thead></table>`;
  assert.equal(theadBodies(goodSample).some((h) => /\{label\}/.test(h)), true, "抬头在 thead 里时必须放行");
});

test("约定：一条 = 一个人 / 一份单据，必须带 .print-doc（整条放得下就并排、放不下才另起一页）", async () => {
  const cases: { file: string; token: RegExp; what: string }[] = [
    { file: "src/components/payment-sheets.tsx", token: /className="[^"]*\bprint-doc\b[^"]*"/, what: "发放明细里每个人的一整节" },
    { file: "src/routes/contracts.tsx", token: /className="[^"]*\bprint-doc\b[^"]*"/, what: "每份合同的对账单" },
  ];
  const bad: string[] = [];
  for (const c of cases) {
    const text = stripComments(await readFile(repo(c.file), "utf8"));
    if (!c.token.test(text)) bad.push(`${c.file}: ${c.what}没有 .print-doc —— 会被劈到两页/与别的单据混在一起`);
  }
  assert.deepEqual(bad, [], `用户口径「整条放得下就并排、放不下才另起一页」需要 .print-doc：\n${bad.join("\n")}`);
  const css = await readFile(repo("src/styles.css"), "utf8");
  const printCss = printMediaBlocks(css).join("\n");
  assert.match(printCss, /\.print-only\s+\.print-doc[^{}]*\{[^{}]*break-inside\s*:\s*avoid/, "打印态 .print-doc 必须 break-inside:avoid（整条不拆）");
  assert.equal(
    /\.print-doc[^{}]*\{[^{}]*break-before\s*:\s*page/.test(printCss),
    false,
    "不许给 .print-doc 用 break-before:page —— 那是「宁可留白也不并排」，与用户口径相反",
  );
  // 坏样本自检
  const goodCss = "@media print { .print-only .print-doc { break-inside: avoid; } }";
  const badCss = "@media print { .print-only .print-doc { break-before: page; } }";
  assert.equal(/\.print-only\s+\.print-doc[^{}]*\{[^{}]*break-inside\s*:\s*avoid/.test(goodCss), true);
  assert.equal(/\.print-doc[^{}]*\{[^{}]*break-before\s*:\s*page/.test(badCss), true, "坏样本（强制换页）必须能被抓到");
});

test("约定：打印态必须压行高与纸面留白（1.8.13：屏幕上舒服的留白会把最后一行挤到第 2 页）", async () => {
  const printCss = printMediaBlocks(await readFile(repo("src/styles.css"), "utf8")).join("\n");
  assert.match(
    printCss,
    /\.print-only\s+table\s+th[\s\S]{0,80}\.print-only\s+table\s+td[\s\S]{0,160}padding-top\s*:\s*1px/,
    "打印态表格单元格必须压到 `padding-top/bottom: 1px`：屏幕上每格上下 4px，31 行的汇总表光行内留白就吃掉 ~33mm，正好把尾部挤出第一页",
  );
  assert.match(
    printCss,
    /\.print-only\s+article[^{}]*\{[^{}]*padding\s*:\s*2mm/,
    "打印件 article 必须 `padding: 2mm …`：@page 已有 12mm 页边距，单据再加一层 p-4 会把尾部挤走",
  );
  assert.match(
    printCss,
    /\.print-only\s+article\s*>\s*p:last-child[^{}]*\{[^{}]*break-before\s*:\s*avoid/,
    "尾部「打印日期」必须 `break-before: avoid`：不许它单独占一页",
  );
  // 坏样本自检：回到「每格上下 4px、article p-4」必须被抓出来
  const bad = "@media print { .print-only table td { padding-top: 4px; padding-bottom: 4px; } .print-only article { padding: 1rem; } }";
  assert.equal(/padding-top\s*:\s*1px/.test(bad), false, "坏样本（4px 行高留白）必须判不合格");
  assert.equal(/\.print-only\s+article[^{}]*\{[^{}]*padding\s*:\s*2mm/.test(bad), false, "坏样本（article p-4）必须判不合格");
});

test("约定：没有待发放记录时不印「无日期的待发放记录按当前年份显示」那一行（它就是被挤到第 2 页的临界量）", async () => {
  const text = stripComments(await readFile(repo("src/components/payment-sheets.tsx"), "utf8"));
  assert.match(
    text,
    /breakdown\.pendingCount\s*\?[\s\S]{0,200}无日期的待发放记录按当前年份/,
    "那句提示必须用 `breakdown.pendingCount` 包起来：没有待发放记录时它纯占一行（实测正好把「打印日期」挤到第 2 页）",
  );
});

// ───────────────────── B16 新打印入口（1.8.15）：考勤月表 / 全年月表 / 年度工资汇总 / 人员名单 ─────────────────────

/**
 * 背景（业务评估 B16）：打印入口原来只有发放 / 合同 / 保险 / 报销 / 工资条五处，
 * **考勤月表、年度工资汇总、人员名单印不出来**（现场要贴墙、交财务、存档）。
 * 新增打印入口最容易漏的两件事：
 *  ① 忘记把屏幕内容包进 `.no-print`（点打印把导航、筛选、月表一起印出来 —— 1.8.4 用户实测的缺陷）。
 *     这一条由上面的「打印分离」守卫统一管（含 `window.print()` 的页面自动入清单，命中数下限已提到 8）；
 *  ② 顺手把打印按钮放进 `<Can perm="….edit">` 或 `disabled={!canEdit}`：打印是**只读操作**，
 *     只读账号也要能印（A 组报告第 17 项同一类问题 —— 只读账号被挡在只读功能之外）。
 * 这里补的就是 ②，以及「打印件的单据抬头必须写在 thead 第一行」（1.8.11：跨页重复，
 * 裁开分发时续页也认得出是哪张单）。
 */

const NEW_PRINT_ENTRIES: { file: string; label: string; why: string }[] = [
  { file: "src/routes/attendance.tsx", label: "打印月表", why: "考勤月表（当前月：贴墙 / 存档）" },
  { file: "src/routes/attendance.tsx", label: "打印全年月表", why: "全年 12 个月的月表（每月一块，按月贴/存档）" },
  { file: "src/routes/attendance.tsx", label: "打印年度工资汇总", why: "年度工资汇总（交财务）" },
  { file: "src/routes/people.tsx", label: "打印人员名单", why: "人员名单（现场贴墙 / 存档）" },
];

test("约定：B16 新打印入口必须存在，且按钮不受编辑权限限制（打印是只读操作）", async () => {
  const bad: string[] = [];
  let checked = 0;
  for (const c of NEW_PRINT_ENTRIES) {
    const code = stripComments(await readFile(repo(c.file), "utf8"));
    const at = code.indexOf(c.label);
    if (at < 0) {
      bad.push(`${c.file}: 找不到「${c.label}」按钮（${c.why}）`);
      continue;
    }
    checked += 1;
    const open = code.lastIndexOf("<Button", at);
    const close = code.indexOf("</Button>", at);
    if (open < 0 || close < 0) {
      bad.push(`${c.file}:「${c.label}」不是一个 Button`);
      continue;
    }
    const btn = code.slice(open, close);
    if (/disabled=\{!(can|useCan|canSave|canEdit)/.test(btn))
      bad.push(`${c.file}:「${c.label}」被编辑权限禁用 —— 打印是只读操作，只读账号也要能印`);
    if (!/onClick=/.test(btn)) bad.push(`${c.file}:「${c.label}」没有 onClick`);
    if (!/variant="outline"/.test(btn)) bad.push(`${c.file}:「${c.label}」的样式要与其他页的「打印…」按钮一致（outline）`);
  }
  expectMinHits("ui 守卫：B16 新打印入口数", checked, 4, "现有 4 个（考勤页 3 + 人员页 1）");
  assert.deepEqual(bad, [], `B16 打印入口不齐 / 不只读 / 样式不一致：\n${bad.join("\n")}`);

  // 反向自检：把打印按钮按编辑权限禁用的坏样本必须被这条正则抓到（否则「0 命中」没有意义）
  const byPerm = /disabled=\{!(can|useCan|canSave|canEdit)/;
  expectRegexCatches(
    byPerm,
    '<Button variant="outline" disabled={!canEditPeople} onClick={() => window.print()}>打印人员名单</Button>',
    "「打印按钮按编辑权限禁用」的坏写法",
  );

  // 打印件必须渲染在 .no-print 包裹**之外**（否则打印时被一起隐藏，印出来是空白）：
  // 这条与上面的通用守卫同源，但那里认的是「任一渲染点在包裹外」，这里要求四个入口都真的接了打印件。
  const att = stripComments(await readFile(repo("src/routes/attendance.tsx"), "utf8"));
  const ppl = stripComments(await readFile(repo("src/routes/people.tsx"), "utf8"));
  const sheets: [string, string, RegExp][] = [
    ["src/routes/attendance.tsx", att, /<AttendanceMonthSheet\b/],
    ["src/routes/attendance.tsx", att, /<AttendanceMonthsYearSheet\b/],
    ["src/routes/attendance.tsx", att, /<PayrollYearSheet\b/],
    ["src/routes/people.tsx", ppl, /<PeopleRosterSheet\b/],
  ];
  const broken: string[] = [];
  for (const [file, code, re] of sheets) {
    const m = re.exec(code);
    if (!m) broken.push(`${file}: 缺打印件渲染点 ${re.source}`);
    else {
      const ranges = noPrintRanges(code);
      if (ranges.some((w) => (m.index ?? 0) > w.open && (m.index ?? 0) < w.close))
        broken.push(`${file}: ${re.source} 渲染在 .no-print 之内 —— 打印时会被藏起来`);
    }
  }
  expectMinHits("ui 守卫：B16 打印件渲染点数", sheets.length, 4, "4 个打印件各一处");
  assert.deepEqual(broken, [], `B16 打印件没有接在 no-print 之外：\n${broken.join("\n")}`);
});

test("约定：B16 打印件的单据抬头写在 thead 第一行 + 尾部打印日期（1.8.11 / 1.8.13 协议）", async () => {
  const code = stripComments(await readFile(repo("src/components/ledger-print-sheets.tsx"), "utf8"));
  const sheets = ["AttendanceMonthSheet", "AttendanceMonthsYearSheet", "PayrollYearSheet", "PeopleRosterSheet"];
  const bad: string[] = [];
  for (const name of sheets) {
    const start = code.indexOf(`export function ${name}(`);
    const next = code.indexOf("export function ", start + 1);
    const seg = code.slice(start, next < 0 ? code.length : next);
    if (start < 0) {
      bad.push(`${name}: 打印件不见了（被搬家/改名？守卫路径要同步改）`);
      continue;
    }
    const theadFrom = seg.indexOf("<thead>");
    const theadTo = seg.indexOf("</thead>");
    if (theadFrom < 0 || theadTo < 0) {
      bad.push(`${name}: 没有 <thead> —— 第 2 页起会没有表头`);
      continue;
    }
    // 抬头 = <thead> 里的第一个 <tr> 里的 colSpan th（跨页重复，裁开也认得出是哪张单）
    if (!/<thead>\s*<tr>\s*<th[^>]*colSpan=/.test(seg.slice(theadFrom, theadTo + 8)))
      bad.push(`${name}: thead 第一行不是单据抬头（应该是 <th colSpan> 写清年份/月份/筛选范围）`);
    if (!/打印日期 \{today\}/.test(seg)) bad.push(`${name}: 尾部缺「打印日期 {today}」`);
    if (!/className="print-only/.test(seg)) bad.push(`${name}: 没有 .print-only（屏幕态就藏不住）`);
  }
  expectMinHits("ui 守卫：检查了抬头 / 打印日期的打印件数", sheets.length, 4, "现有 4 个（1.8.15 新增）");
  assert.deepEqual(bad, [], `打印件协议不满足（抬头要在 thead 里、尾部要打印日期）：\n${bad.join("\n")}`);

  // 坏样本自检：抬头写在 <thead> 之外（旧写法：只放在页眉 div 里）必须判不合格
  const captionFirst = /<thead>\s*<tr>\s*<th[^>]*colSpan=/;
  expectRegexCatches(
    captionFirst,
    '<thead><tr><th colSpan={7}>2026年3月 · 本表 12 人</th></tr><tr><th>序号</th></tr></thead>',
    "「抬头写在 thead 第一行」的正样本",
  );
  assert.equal(captionFirst.test('<div class="text-center">2026年3月</div><thead><tr><th>序号</th></tr></thead>'), false, "抬头放在 thead 之外必须判不合格");

  // 合计只放 tfoot（1.8.11：tfoot 在打印态是普通行组，只在最后一页印一次）
  expectMinHits(
    "ui 守卫：写在 <tfoot> 里的合计（月度表 / 年度汇总表）",
    (code.match(/<tfoot>[\s\S]{0,400}?合计/g) || []).length,
    2,
    "现有 2 处（打印月表、年度工资汇总）",
  );
});

