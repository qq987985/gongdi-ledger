/** 发布不能抢在独立的 check workflow 之前：同次运行、同一 SHA、失败必须阻断两个发布 job。 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expectMinHits, expectRegexCatches } from "./min-hits";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workflows = ["ci/docker.workflow.yml", ".github/workflows/docker.yml"];
const read = (path: string) => readFileSync(join(root, path), "utf8");
const active = (text: string) => text.replace(/\r\n/g, "\n").split("\n")
  .filter((line) => line.trim() && !line.trimStart().startsWith("#")).join("\n");

/** 按本仓库的两空格 job / 四空格属性约定分块；结构变化时明确失败，不默默漏扫。 */
function jobsOf(text: string): Map<string, string> {
  const source = active(text);
  const start = source.indexOf("\njobs:\n");
  assert.ok(start >= 0, "发布 workflow 必须有 jobs");
  const jobs = new Map<string, string>();
  for (const match of source.slice(start).matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/gm))
    jobs.set(match[1], match[2]);
  expectMinHits("发布 job 分块", jobs.size, 3, "quality、image、windows 三个 job");
  return jobs;
}

const BYPASS = /\bcontinue-on-error\s*:|\b(?:always|failure|cancelled)\s*\(/;
const QUALITY_IF = /^\s+(?:-\s+)?if\s*:/m;
const COMMANDS = ["pnpm install --frozen-lockfile", "pnpm run typecheck", "pnpm test", "pnpm run test:roundtrip"];

function checkReleaseGate(text: string): void {
  const jobs = jobsOf(text);
  const quality = jobs.get("quality");
  assert.ok(quality, "缺少 quality job");
  assert.doesNotMatch(quality, QUALITY_IF, "质量检查不允许按触发类型跳过 job 或步骤");
  assert.match(quality, /^    permissions:\n      contents: read$/m, "检查 job 只需读取代码");
  const commands = [...quality.matchAll(/^        run: (.+)$/gm)].map((match) => match[1]);
  expectMinHits("质量检查实际命令", commands.length, 4, "安装、类型、回归、Excel 往返");
  assert.deepEqual(commands, COMMANDS, "四个命令必须独立运行并传播非零退出码，不能 || true 或后台执行");

  for (const name of ["quality", "image", "windows"]) {
    const job = jobs.get(name);
    assert.ok(job, `缺少 ${name} job`);
    assert.doesNotMatch(job, BYPASS, `${name} 不得忽略失败或通过状态函数绕开依赖`);
    assert.match(job, /uses: actions\/checkout@v4\n        with:\n          ref: \$\{\{ github\.sha \}\}/,
      `${name} 必须检出本次触发的固定 SHA，防止检查与发布不同提交`);
    assert.match(job, /uses: pnpm\/action-setup@v4\n        with:\n          version: 12\b/);
    assert.match(job, /uses: actions\/setup-node@v4\n        with:\n          node-version: 24\b/);
    if (name !== "quality") assert.match(job, /^    needs: quality$/m, `${name} 必须等待 quality 成功`);
  }
  assert.match(active(text), /branches: \[main\]/);
  assert.match(active(text), /tags: \["v\*"\]/);
  assert.match(active(text), /^  workflow_dispatch:$/m);
}

test("镜像和 Windows 发布必须等待同一提交的类型、回归、Excel 检查通过", () => {
  expectMinHits("发布工作流检查份数", workflows.length, 2, "模板与生效文件各一份");
  for (const path of workflows) checkReleaseGate(read(path));
});

test("发布门禁模板与生效配置一致，质量命令与 check 主流程对应", () => {
  assert.equal(active(read(workflows[0])), active(read(workflows[1])), "允许注释/空行不同，执行配置必须同步");
  const check = read("ci/check.workflow.yml");
  for (const command of COMMANDS) assert.ok(check.includes(`run: ${command}\n`), `主检查缺少 ${command}`);
  expectMinHits("与主流程比对的命令", COMMANDS.length, 4, "安装及三项发布前验证");
});

test("发布守卫坏样本：漏依赖、漏测试、换提交、跳过检查、吞失败都必须报错", () => {
  expectRegexCatches(BYPASS, "    continue-on-error: true", "不能吞掉质量失败");
  expectRegexCatches(BYPASS, "    if: always()", "不能绕开失败依赖");
  expectRegexCatches(QUALITY_IF, "        if: false", "不能跳过质量步骤");
  const good = read(workflows[0]);
  const bad = [
    good.replace("  quality:", "  other:"),
    good.replace("  image:\n    needs: quality", "  image:"),
    good.replace("  windows:\n    needs: quality", "  windows:"),
    good.replace("run: pnpm test", "run: echo skipped"),
    good.replace("run: pnpm run test:roundtrip", "run: pnpm run test:roundtrip || true"),
    good.replace("ref: ${{ github.sha }}", "ref: main"),
    good.replace("  quality:\n", "  quality:\n    if: false\n"),
    good.replace("        run: pnpm test", "        if: false\n        run: pnpm test"),
    good.replace("  quality:\n", "  quality:\n    continue-on-error: true\n"),
    good.replace("  image:\n", "  image:\n    if: always()\n"),
  ];
  expectMinHits("发布守卫坏样本", bad.length, 10, "覆盖独立发布、跳过检查与失败放行");
  for (const sample of bad) {
    assert.notEqual(sample, good, "坏样本变换必须实际命中配置");
    assert.throws(() => checkReleaseGate(sample), "发布门禁被绕过时守卫必须变红");
  }
});
