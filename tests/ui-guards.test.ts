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
