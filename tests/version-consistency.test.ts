/**
 * 版本「四处一致」守卫（专家评审 C4②，1.8.14）。
 *
 * 背景：`开发规范.md` §2 明确写了「**版本四处必须一致**：`VERSION.txt` 第 1 行 / `package.json` /
 * `app/VERSION.txt` / `README.md` 当前版本行 —— 发版时逐一对齐（曾有 README 接连落后两个版本的教训）」，
 * 但在此之前**只有 `app/VERSION.txt` 那一处**有守卫（CI 的 check 步骤比它和 VERSION.txt）。
 * 于是「改了 VERSION.txt 忘了改 package.json / README」这类漏项，只能靠人眼看出来。
 *
 * 这里把四处**全部**对一遍。注意 `app/` 是构建产物（`.gitattributes` 标了生成物）：
 * · 文件不存在 → **跳过并说明**（没构建过是正常状态，例如刚 clone）；
 * · 文件存在但版本不同 → **失败**（说明构建产物是旧源码构建的，正是「版本变了行为没变」那一类事故）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => readFile(join(root, p), "utf8");
const firstLine = (s: string) => (s.split(/\r?\n/)[0] || "").trim();

test("C4② 版本四处一致：VERSION.txt 第 1 行 / package.json / README 当前版本 / app/VERSION.txt", async (t) => {
  const fromVersionTxt = firstLine(await read("VERSION.txt"));
  assert.match(fromVersionTxt, /^\d+\.\d+\.\d+$/, `VERSION.txt 第 1 行必须是 X.Y.Z，实际「${fromVersionTxt}」`);

  const pkg = JSON.parse(await read("package.json")) as { version?: string };
  assert.equal(pkg.version, fromVersionTxt, "package.json 的 version 必须与 VERSION.txt 第 1 行一致");

  const readme = await read("README.md");
  const inReadme = readme.match(/当前版本：\*\*([\d.]+)\*\*/);
  assert.ok(inReadme, "README 必须有「当前版本：**X.Y.Z**」这一行（发版要改的就是它）");
  assert.equal(inReadme![1], fromVersionTxt, "README 的「当前版本」必须与 VERSION.txt 一致（曾有落后两个版本的教训）");

  // README 正文里「## 当前版本（每次发版改这里）」下面第一个 ### X.Y.Z 也要对上
  const section = readme.slice(readme.indexOf("## 当前版本"));
  const firstH3 = section.match(/###\s*(\d+\.\d+\.\d+)/);
  assert.ok(firstH3, "「## 当前版本」下面要有「### X.Y.Z」的更新记录小节");
  assert.equal(firstH3![1], fromVersionTxt, "「## 当前版本」里的第一条更新记录必须是当前版本");

  // app/VERSION.txt 是构建时复制的产物：不存在就跳过（没构建过），存在就必须一致
  if (!existsSync(join(root, "app/VERSION.txt"))) {
    t.diagnostic("app/VERSION.txt 不存在 —— 已跳过这一项（app/ 是构建产物，跑过 pnpm build 才会有）");
    return;
  }
  const built = firstLine(await read("app/VERSION.txt"));
  assert.equal(
    built,
    fromVersionTxt,
    "app/VERSION.txt 与源码版本不一致 —— 这份产物是旧源码构建的（发版前要重新 pnpm run build，把 app/ 一起提交）",
  );
});

test("C4① engines：Node ≥ 22.18（测试依赖 registerHooks 与类型擦除，不是随便写的）", async (t) => {
  const pkg = JSON.parse(await read("package.json")) as { engines?: { node?: string } };
  const range = pkg.engines?.node;
  assert.ok(range, "package.json 缺 engines.node —— 在不达标的 Node 上跑 pnpm test 只会得到「registerHooks 不是函数」这类怪错误");

  // 只认「>= X.Y[.Z]」这种写法（要放宽也要先把下限写清楚，别用 ^ / ~ 之类把 22.0 也放进来）
  const m = String(range).match(/^>=\s*(\d+)\.(\d+)(?:\.(\d+))?$/);
  assert.ok(m, `engines.node 应写成「>= 22.18」这种形式，实际「${range}」`);
  const [major, minor] = [Number(m![1]), Number(m![2])];
  assert.equal(major >= 22, true, `engines.node 下限的 Node 主版本不能低于 22（实际 ${major}）`);
  if (major === 22) {
    assert.equal(minor >= 18, true, `Node 22 要 ≥ 22.18（22.18 起默认支持 TypeScript 类型擦除；实际 22.${minor}）`);
  }

  // 事实侧：测试确实用了 Node ≥ 22.15 才有的 registerHooks（下限不是拍脑袋写的）
  const reg = await read("tests/register.mjs");
  assert.match(reg, /registerHooks/, "tests/register.mjs 必须用 node:module 的 registerHooks（这正是 Node ≥ 22.18 的原因）");
  t.diagnostic(`engines.node = ${range}，与 tests/register.mjs 的 registerHooks 用法一致`);
});
