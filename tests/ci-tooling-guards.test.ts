/**
 * ci/ 工具链守卫（专家评审 C4③④，1.8.14）。
 *
 * 两件事都属于「不会在 `pnpm test` 里被发现的工具链缺陷」：
 *
 * · **C4③** `ci/*.mjs` 是本机的量测脚本（起真 Chrome + playwright-core 出 A4 PDF），
 *   原先 `PLAYWRIGHT_CORE` 直接写死作者机器的绝对路径 `/Users/wsir/.dsh/...` ——
 *   换一台机器就静默失效（`node_modules` 里也没有 playwright，仓库不装它）。
 *   现在要求：**环境变量优先 + 多个候选 + 找不到时报「该设哪个变量」**。
 * · **C4④** `ci/docker.workflow.yml` 是 `.github/workflows/docker.yml` 的模板（规范禁止本地改工作流），
 *   Release 步骤原来没有 `if:` 守卫 → **任何一次推 main 都会移动一次 Release**。
 *
 * 这些文件都不会被 `pnpm test` 执行，所以只能靠静态守卫盯着「约定还在不在」。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { countHits, expectMinHits } from "./min-hits";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFile(resolve(root, p), "utf8");

/** 取出 `const NAME = [ ... ];` 里的字符串字面量个数（用来数候选路径） */
function arrayLen(src: string, name: string): number {
  const m = src.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
  if (!m) return -1;
  return countHits(m[1], /"/);
}

test("C4③ ci/*.mjs：浏览器与 playwright 的位置必须「环境变量优先 + 候选回退 + 清晰报错」", async () => {
  const mpc = await read("ci/mobile-print-check.mjs");

  // ① 环境变量必须被读（不然换机器只能改源码）；解析统一走 resolveTool(envName, …)
  assert.match(mpc, /process\.env\[envName\]/, "工具位置要走统一的 resolveTool(envName, …)（内部读 process.env[envName]）");
  for (const env of ["E2E_CHROME", "PLAYWRIGHT_CORE"]) {
    assert.match(mpc, new RegExp(`"${env}"`), `必须支持环境变量 ${env}`);
  }
  // ② 必须有多个候选（含跨机器的通用位置），不能只有一个作者机器的绝对路径
  expectMinHits("C4③ Chrome 候选路径数", arrayLen(mpc, "CHROME_CANDIDATES"), 3, "macOS + 两个 Linux 常见位置");
  expectMinHits("C4③ playwright-core 候选路径数", arrayLen(mpc, "PW_CANDIDATES"), 2, "本目录 node_modules + -g 安装位置");
  const wsir = countHits(mpc, /\/Users\/wsir\//);
  assert.equal(
    wsir,
    0,
    "不许再把作者机器的绝对路径写进脚本（换机器即失效）——用候选列表 + PLAYWRIGHT_CORE 环境变量",
  );
  // ③ 失败时报错必须点出「该设哪个变量、怎么设」
  for (const env of ["E2E_CHROME", "PLAYWRIGHT_CORE"]) {
    assert.match(mpc, new RegExp(`${env}=`), `启动失败/加载失败时的报错要写出 \`${env}=...\` 的用法示例`);
  }
  assert.match(mpc, /启动浏览器失败/, "启动浏览器失败要有中文说明 + 原始错误");
  assert.match(mpc, /加载 playwright-core 失败/, "加载驱动失败要有中文说明（别抛一句看不懂的 MODULE_NOT_FOUND）");

  // ④ 自检：量不出结果时不能装成「通过」（0 页 / 0mm 留白与「排版很好」长得一样）
  assert.match(mpc, /一页都没解析出来/, "pages 子命令要自检「PDF 一页都没解析出来」");
  assert.match(mpc, /process\.exitCode = 1/, "量不出结果 / 有不合格用例时必须非 0 退出");
  assert.match(mpc, /没有任何用例量出结果/, "所有用例都失败时要有明确结论（不是安静收场）");

  // ⑤ print-pdf.mjs 保持「零依赖纯解析」：不许引浏览器
  const pdf = await read("ci/print-pdf.mjs");
  assert.doesNotMatch(pdf, /playwright/i, "ci/print-pdf.mjs 是纯 PDF 解析（只用 node:zlib），不许引浏览器");
  assert.match(pdf, /node:zlib/, "print-pdf.mjs 只允许用 node:zlib 解压内容流");
});

test("C4④ ci/docker.workflow.yml：Release 必须只由 tag / 手动触发（windows job 带 if: 守卫）", async () => {
  const yml = await read("ci/docker.workflow.yml");
  const READY = /if:\s*startsWith\(github\.ref,\s*'refs\/tags\/v'\)\s*\|\|\s*github\.event_name\s*==\s*'workflow_dispatch'/;

  const at = yml.indexOf("\n  windows:");
  assert.ok(at > 0, "模板里找不到 windows job —— 本守卫按它解析");
  const win = yml.slice(at);
  const stepsAt = win.indexOf("steps:");
  assert.ok(stepsAt > 0, "windows job 里找不到 steps:");
  const head = win.slice(0, stepsAt);
  assert.match(
    head,
    READY,
    "windows job 缺 `if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'workflow_dispatch'`" +
      " —— 没有它，推 main（哪怕只改文档）也会移动一次 Release",
  );
  // tag 名优先：tag 是 v1.8.14 而 VERSION.txt 首行若是别的版本，也不能把 Release 发到别的 tag 上
  assert.match(win, /github\.ref_name/, "version 步骤要读 github.ref_name（打 tag 时以 tag 名为准）");

  // 同一个 job 里 pack + 发 Release 都要在守卫之后（不能有绕过 if 的第二个发版入口）
  const releases = countHits(yml, /action-gh-release@/);
  assert.equal(releases, 1, `模板里只应有一处发 Release（实际 ${releases} 处），否则守卫可能只挡住了其中一处`);
  assert.equal(
    countHits(yml, /^on:$/m),
    1,
    "模板要有且只有一段 on: 触发条件（漏了 tags: [\"v*\"] 的话 tag 根本不会触发工作流）",
  );
  assert.match(yml, /tags: \["v\*"\]/, "on: 里必须有 tags: [\"v*\"]（否则打 tag 不触发，if: 守卫也没意义）");

  // 文档侧：ci/README.md 必须说明这份模板已经带了守卫（两份说明口径一致）
  const readme = await read("ci/README.md");
  assert.match(readme, /refs\/tags\/v/, "ci/README.md 要写明发版守卫的内容（否则下次「按模板装一遍」又要重新解释）");
  assert.match(readme, /已并入 §1b 的模板|已写进/, "ci/README.md §2 要说明该建议已并入模板，不用做第二遍");
});
