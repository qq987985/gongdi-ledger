/**
 * 守卫路径元测试（架构优化方案候选 A 的第二半）。
 *
 * 背景：这个项目有一批「按源码路径读源码做约定校验」的守卫测试
 * （`api-guards`、`ui-guards`、`perms`、`update-script`、`assets-per-book` …）。
 * 它们的特点是：**源码文件一搬家/改名，守卫会静默失效** —— 测试还是绿的，
 * 但那条保护已经不存在了（`开发规范.md` §12 末尾专门提醒过这一点）。
 *
 * 所以这里反过来校验一次：**守卫测试里引用的每个源码路径都必须真实存在**。
 * 搬家/改名时这个测试会直接红，逼着人把守卫路径一起改掉。
 *
 * 只做静态检查（不执行被扫描的测试），零依赖，跑得飞快。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testsDir, "..");

/** 哪些目录下的路径算「仓库内源码/脚本/配置」，需要存在 */
const ROOTS = ["src", "scripts", "ci", "win", "app", "tests"];
/** 允许引用的扩展名（避免把 `src/lib/xxx` 这种前缀当成路径去查） */
const EXTS = [".ts", ".tsx", ".mjs", ".js", ".cjs", ".yml", ".yaml", ".json", ".md", ".txt", ".sh"];

/** 该字符串像不像一个「仓库内文件路径」 */
function looksLikeRepoPath(lit: string): boolean {
  if (/[\s"'`()]/.test(lit)) return false;
  if (!EXTS.some((e) => lit.endsWith(e))) return false;
  const body = lit.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
  return ROOTS.some((r) => body === r || body.startsWith(`${r}/`));
}

/** 把 `../src/x.ts` 这类相对路径按所在目录解析成仓库内绝对路径 */
function toAbs(lit: string, fromDir: string): string {
  return lit.startsWith("..") ? resolve(fromDir, lit) : resolve(repoRoot, lit.replace(/^\.\//, ""));
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** 抽出被扫描测试文件里引用的仓库路径：new URL("…", import.meta.url) + 普通字符串字面量 */
function referencedPaths(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/new URL\(\s*"([^"]+)"\s*,\s*import\.meta\.url\s*\)/g))
    if (looksLikeRepoPath(m[1])) out.add(m[1]);
  for (const m of src.matchAll(/"([^"\n]+)"/g)) if (looksLikeRepoPath(m[1])) out.add(m[1]);
  return [...out];
}

test("守卫路径：被守卫测试引用的源码文件都必须存在（搬家/改名不许让守卫静默失效）", async () => {
  const files = (await readdir(testsDir)).filter((f) => f.endsWith(".test.ts"));
  assert.equal(files.length > 5, true, `应扫描到多个守卫测试，实际 ${files.length}`);

  const checked: string[] = [];
  const missing: string[] = [];
  let scannedRefs = 0;

  for (const f of files) {
    const full = join(testsDir, f);
    const src = await readFile(full, "utf8");
    for (const lit of referencedPaths(src)) {
      scannedRefs += 1;
      const abs = toAbs(lit, testsDir);
      checked.push(`${f} → ${lit}`);
      if (!(await exists(abs))) missing.push(`${f} 引用了不存在的路径：${lit}`);
    }
  }

  // 兜底：至少确认扫描真的抓到了东西（否则正则失效会让这个守卫"假绿"）
  assert.equal(scannedRefs >= 10, true, `扫描到的路径引用太少（${scannedRefs}），检查正则是否失效`);

  assert.deepEqual(
    missing,
    [],
    `有守卫测试在引用不存在的源码路径 —— 文件很可能被搬家/改名了，请同步改守卫路径：\n${missing.join("\n")}\n\n实际扫描了 ${scannedRefs} 处引用（含 ${checked.length} 条记录）`,
  );
});

test("守卫路径：本测试自己也要能定位到仓库根（防 `import.meta.url` 用法写错）", async () => {
  assert.equal(await exists(join(repoRoot, "package.json")), true, "应能从 tests/ 定位到仓库根");
  assert.equal(await exists(join(repoRoot, "VERSION.txt")), true, "VERSION.txt 是唯一版本来源，必须存在");
  assert.equal(await exists(join(repoRoot, "开发规范.md")), true, "开发规范.md 是本项目强制约定，必须存在");
});
