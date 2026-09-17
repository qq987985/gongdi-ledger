/**
 * 依赖精度守卫（1.8.15「功能四件 + 依赖锁版本」的 D 包；用户拍板：改成**精确版本 + 提交 lockfile**）。
 *
 * 背景：1.8.14 时 21 个依赖里 **19 个写 `latest`**（`vite` 是 `npm:rolldown-vite@latest`，
 * `@vitejs/plugin-react` 是 `^6.1.1`），唯一钉住版本的是 `pnpm-lock.yaml`。安全评审（F-13）指出的缺口是：
 * `latest` 语义下，任何**不加 `--frozen-lockfile`** 的安装 —— 新机器 `pnpm install`、`pnpm update`、
 * lockfile 冲突后重解 —— 都会重解一套全新的传递依赖图。结果是「CI 今天绿、某天因为装了新版依赖变红」，
 * 而且**无法复现线上镜像里到底是什么依赖版本**（镜像里的 `app/` 本身就是构建产物）。
 *
 * 这条守卫把新口径钉成可执行的（与 `开发规范.md` §2「依赖与 lockfile」同源）：
 *   ① `package.json` 的依赖值只能是**精确版本**（或 `npm:<真名>@<精确版本>` 别名、自带版本号的 tarball 直链）——
 *      出现 `latest` / `^` / `~` / `*` / `x` / 范围 / `||` 直接失败；
 *   ② lockfile 里每个依赖的 `specifier` 必须与 `package.json` **逐字一致**，解析出的 `version` 必须落在该精确版本上
 *      （挡住「改了 package.json 忘了跑 pnpm install」——否则 CI 的 `--frozen-lockfile` 会在别人的机器上炸）；
 *   ③ `node_modules` 里实际装的版本必须等于 pin（挡住「pin 一个谁都没装过的版本号」这种假精确）；
 *   ④ `pnpm-lock.yaml` 必须存在、不被 `.gitignore` 忽略、且已入库（否则 CI 上根本没有 lockfile 可用）；
 *   ⑤ CI 的安装步骤必须真的是 `pnpm install --frozen-lockfile`，且 lockfile 参与构建指纹；
 *   ⑥ 口径必须写进文档（`开发规范.md` / `ci/README.md` / `AGENTS.md`），含显式升级步骤，且不留旧说法。
 *
 * 取舍说明：精确版本 = **没有自动安全补丁**，升级必须显式做（改 package.json → `pnpm install` → 三道闸 → 两个文件一起提交）。
 * 这是用户拍板接受的代价，换来的是「本机 / CI / 镜像三者依赖图完全一致、可复现」。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_INPUTS } from "../scripts/build-stamp.mjs";
import { expectMinHits, expectRegexCatches } from "./min-hits";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

/** 1.8.15 时的依赖条数：13 dependencies + 8 devDependencies。低于它 = 清单没被扫到（假的绿） */
const DEP_FLOOR = 20;

interface Manifest {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const pkg = JSON.parse(read("package.json")) as Manifest;
const declared: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
const depNames = Object.keys(declared);

/** 合法写法：精确 `x.y.z`（可带预发布/构建号）/ `npm:<真名>@x.y.z` / 自带版本号的 tarball 直链 */
const EXACT =
  /^(?:\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?|npm:[^@\s]+@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?|https?:\/\/\S+\.tgz)$/;

/** 会漂移的写法（负向守卫 —— 靠下面的坏样本自检证明它不是一条「匹配不到任何东西」的正则） */
const DRIFTABLE = /(?:^|:|\s)(?:latest|next|canary|beta|\*|x)(?:\s|$)|[\^~]|\|\||>=|<=/;

/** tarball 直链里写死的版本号（`…/xlsx-0.20.3.tgz` → `0.20.3`） */
function versionInTarball(spec: string): string | null {
  const m = spec.match(/-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)[^/]*\.tgz$/);
  return m ? m[1] : null;
}

/** lockfile 里那个解析结果是否真的落在精确版本上（peer 依赖会带 `(...)` 后缀；别名带 `<真名>@` 前缀） */
function versionMatches(spec: string, resolved: string): boolean {
  if (/^https?:/.test(spec)) return resolved === spec; // 直链：lockfile 的 version 就是整条 URL
  const want = spec.startsWith("npm:") ? spec.slice(4) : spec;
  return resolved === want || resolved.startsWith(`${want}(`);
}

interface LockEntry {
  group: string;
  specifier: string;
  version: string;
}

/**
 * 只解析 `pnpm-lock.yaml` 的 `importers:` → `.` 段（够用且零依赖：不引 yaml 解析器）。
 * 缩进约定（lockfileVersion 9.0）：2 = importer（`.:`）/ 4 = dependencies|devDependencies /
 * 6 = 包名 / 8 = specifier|version。解析不到就是结构变了，测试会红（不是静默 0 命中）。
 */
function parseRootImporter(lockText: string): Map<string, LockEntry> {
  const lines = lockText.split("\n");
  const start = lines.indexOf("importers:");
  assert.ok(start >= 0, "pnpm-lock.yaml 里没有顶层的 `importers:` 段 —— lockfile 结构变了？");
  const out = new Map<string, LockEntry>();
  let inRoot = false;
  let group = "";
  let name = "";
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // 到 `packages:` 等下一个顶层段，结束
    if (line.trim() === "") continue;
    const indent = line.length - line.trimStart().length;
    const text = line.trim();
    if (indent === 2) {
      inRoot = text === ".:";
      group = "";
      name = "";
      continue;
    }
    if (!inRoot) continue;
    if (indent === 4) {
      group = text.replace(/:$/, "");
      name = "";
      continue;
    }
    if (indent === 6) {
      const m = text.match(/^(?:'([^']+)'|([^:]+)):$/);
      if (m) name = m[1] ?? (m[2] ?? "").trim();
      continue;
    }
    if (indent === 8 && name) {
      const m = text.match(/^(specifier|version):\s*(.+)$/);
      if (!m) continue;
      const entry = out.get(name) ?? { group, specifier: "", version: "" };
      entry.group = group;
      if (m[1] === "specifier") entry.specifier = m[2].trim();
      else entry.version = m[2].trim();
      out.set(name, entry);
    }
  }
  return out;
}

const lockText = read("pnpm-lock.yaml");
const lockRoot = parseRootImporter(lockText);

/** git 子命令的退出码（0/1 是有意义的；拿不到 git 时返回 -1，调用方自己决定要不要跳过） */
function gitExit(args: string[]): number {
  try {
    execFileSync("git", args, { cwd: root, stdio: "ignore" });
    return 0;
  } catch (err) {
    const status = (err as { status?: unknown }).status;
    return typeof status === "number" ? status : -1;
  }
}

test("① package.json 的依赖值必须全部是精确版本（禁止 latest / ^ / ~ / * / x / 范围）", () => {
  expectMinHits(
    "package.json 声明的依赖项数",
    depNames.length,
    DEP_FLOOR,
    "1.8.14 时是 21 个（13 dependencies + 8 devDependencies）——少于此说明依赖清单没被扫到",
  );

  // 正样本自检：证明 DRIFTABLE 抓得住各种漂移写法（否则「0 命中」可能是正则坏了，不是代码干净）
  expectRegexCatches(
    DRIFTABLE,
    'react: latest\nreact-dom: ^19.2.8\nzod: ~4.5.4\nclsx: *\nzustand: 5.x\nvite: npm:rolldown-vite@latest\nfoo: >=2.0.0\nbar: 1.0.0 || 2.0.0',
    "① 漂移写法（latest / ^ / ~ / * / x / 范围 / ||）",
  );

  const drift = depNames.filter((name) => DRIFTABLE.test(declared[name]));
  assert.deepEqual(
    drift.map((name) => `${name}: "${declared[name]}"`),
    [],
    "依赖值里出现了会漂移的写法 —— 改成当前实际安装的精确版本（见 开发规范.md §2「依赖与 lockfile」）：\n" +
      drift.map((name) => `  ${name}: "${declared[name]}"`).join("\n"),
  );

  const notExact = depNames.filter((name) => !EXACT.test(declared[name]));
  assert.deepEqual(
    notExact.map((name) => `${name}: "${declared[name]}"`),
    [],
    "依赖值不是「精确版本 / npm:<真名>@<精确版本> / 自带版本号的 tarball 直链」这三种合法形状之一：\n" +
      notExact.map((name) => `  ${name}: "${declared[name]}"`).join("\n"),
  );
});

test("② lockfile 的 specifier 与 package.json 逐字一致，解析版本落在那个精确版本上", () => {
  expectMinHits(
    "lockfile 根 importer 解析出的依赖条数",
    lockRoot.size,
    DEP_FLOOR,
    "同 ①：1.8.15 时是 21 个",
  );

  const missing: string[] = [];
  const mismatched: string[] = [];
  for (const [name, spec] of Object.entries(declared)) {
    const entry = lockRoot.get(name);
    if (!entry) {
      missing.push(`${name}: "${spec}"`);
      continue;
    }
    if (entry.specifier !== spec) {
      mismatched.push(
        `${name}: lockfile specifier "${entry.specifier}" ≠ package.json "${spec}" —— 跑一下 pnpm install 重新生成 lockfile`,
      );
    }
    if (!versionMatches(spec, entry.version)) {
      mismatched.push(`${name}: lockfile 解析成 "${entry.version}"，与精确版本 "${spec}" 不符`);
    }
    const wantGroup = name in (pkg.dependencies ?? {}) ? "dependencies" : "devDependencies";
    if (entry.group !== wantGroup) {
      mismatched.push(`${name}: 在 lockfile 的 ${entry.group} 段，应该在 ${wantGroup} 段`);
    }
  }

  assert.deepEqual(missing, [], "这些依赖在 lockfile 里查不到（改了 package.json 没跑 pnpm install？）：");
  assert.deepEqual(mismatched, [], "lockfile 与 package.json 不同源 —— CI 的 --frozen-lockfile 会在别人机器上失败：");
});

test("③ node_modules 里实际装的就是 pin 的版本（pin 一个没装过的版本号 = 假精确）", () => {
  const nm = join(root, "node_modules");
  assert.equal(existsSync(nm), true, "没有 node_modules 就跑 pnpm test？先 `pnpm install --frozen-lockfile`");

  const bad: string[] = [];
  let checked = 0;
  for (const [name, spec] of Object.entries(declared)) {
    const manifestPath = join(nm, name, "package.json");
    if (!existsSync(manifestPath)) {
      bad.push(`${name}: node_modules 里没有这个包（pin 了 "${spec}" 但没装）`);
      continue;
    }
    const installed = JSON.parse(readFileSync(manifestPath, "utf8")) as { version?: string };
    const want = spec.startsWith("npm:")
      ? (spec.slice(4).split("@").pop() ?? "")
      : (versionInTarball(spec) ?? spec);
    if (installed.version !== want) {
      bad.push(`${name}: package.json pin "${spec}"（应为 ${want}），实际装的是 ${installed.version}`);
    }
    checked += 1;
  }

  expectMinHits("node_modules 里逐包核对到的依赖数", checked, DEP_FLOOR, "同 ①：1.8.15 时是 21 个");
  assert.deepEqual(bad, [], "package.json 的 pin 与 node_modules 实际安装不一致：");
});

test("④ pnpm-lock.yaml 必须存在、不被 .gitignore 忽略、且已入库（CI --frozen-lockfile 的前提）", () => {
  assert.equal(
    existsSync(join(root, "pnpm-lock.yaml")),
    true,
    "没有 lockfile —— 精确版本也拦不住传递依赖漂移，CI 的 --frozen-lockfile 更是直接失败",
  );

  const ignoreRules = read(".gitignore");
  assert.doesNotMatch(
    ignoreRules,
    /^\s*\/?pnpm-lock\.yaml\s*$/m,
    ".gitignore 把 pnpm-lock.yaml 忽略了 —— checkout 时拿不到 lockfile（这是这套机制里最隐蔽的失效方式）",
  );
  assert.doesNotMatch(
    ignoreRules,
    /^\s*[^\n]*lock[^\n]*\.yaml\s*$/m,
    ".gitignore 里有一条会覆盖 lockfile 的忽略规则（形如 `*lock*.yaml`）",
  );

  // 真正的判据不靠读 .gitignore：让 git 自己回答「有没有被忽略」「在不在跟踪列表里」
  if (gitExit(["rev-parse", "--is-inside-work-tree"]) === 0) {
    assert.equal(
      gitExit(["check-ignore", "-q", "pnpm-lock.yaml"]),
      1,
      "git check-ignore 命中了 pnpm-lock.yaml（1 = 没被忽略才是期望值，0 = 被忽略）",
    );
    assert.equal(
      gitExit(["ls-files", "--error-unmatch", "pnpm-lock.yaml"]),
      0,
      "pnpm-lock.yaml 没入库 —— CI 上 `pnpm install --frozen-lockfile` 会因缺 lockfile 失败",
    );
  }
});

test("⑤ CI 真的按 lockfile 装（--frozen-lockfile），且 lockfile 参与构建指纹", () => {
  const template = read("ci/check.workflow.yml");
  assert.match(
    template,
    /pnpm install --frozen-lockfile/,
    "ci/check.workflow.yml 必须用 --frozen-lockfile（否则精确版本也挡不住传递依赖被重解）",
  );
  assert.match(template, /version:\s*12\b/, "pnpm 大版本要写死（lockfile 格式与它配套）");
  assert.match(
    lockText,
    /^lockfileVersion: '9\.0'$/m,
    "lockfile 格式版本变了 —— 要同步 CI 里的 pnpm 大版本，否则 --frozen-lockfile 可能直接失败",
  );

  // 已贴到 GitHub 的那份（本地能看到时）也不能丢这一步 —— 否则「模板对了、线上没对」照样漂
  if (existsSync(join(root, ".github/workflows/check.yml"))) {
    assert.match(
      read(".github/workflows/check.yml"),
      /pnpm install --frozen-lockfile/,
      ".github/workflows/check.yml（线上那份）没有 --frozen-lockfile —— 它是模板的副本，两边要一致",
    );
  }

  // package.json / lockfile 都在构建指纹的输入里：换依赖不重建 app/ 会被 CI 第 4 道闸拦下
  assert.equal(BUILD_INPUTS.includes("package.json"), true, "package.json 必须参与构建指纹");
  assert.equal(
    BUILD_INPUTS.includes("pnpm-lock.yaml"),
    true,
    "pnpm-lock.yaml 必须参与构建指纹 —— 否则换依赖不重建 app/ 不会被拦（镜像里还是旧依赖）",
  );
});

test("⑥ 口径写进文档：显式升级步骤 + 不留「依赖全用 latest」的旧说法", () => {
  const spec = read("开发规范.md");
  const ciReadme = read("ci/README.md");
  const agents = read("AGENTS.md");

  assert.match(spec, /依赖与 lockfile/, "开发规范 §2 要有「依赖与 lockfile」小节（口径与升级步骤的唯一出处）");
  assert.match(spec, /pnpm-lock\.yaml/, "开发规范要写清 lockfile 必须随包提交");
  assert.match(spec, /--frozen-lockfile/, "开发规范要写清 CI 用 pnpm install --frozen-lockfile");
  assert.match(spec, /pnpm install/, "开发规范要写清升级依赖时怎么重新生成 lockfile");
  assert.doesNotMatch(
    spec,
    /package\.json 保留 latest/,
    "开发规范里还留着「package.json 保留 latest」的旧口径（1.8.15 已反过来）",
  );
  assert.doesNotMatch(
    spec,
    /本项目 `package\.json` 里所有依赖都写 `latest`/,
    "开发规范里还留着「本项目所有依赖都写 latest」的现在时说法 —— 要写明是历史原因",
  );

  assert.match(ciReadme, /--frozen-lockfile/, "ci/README.md 要写明 CI 就是按 lockfile 装的");
  assert.match(ciReadme, /精确版本/, "ci/README.md 要写明依赖是精确版本");

  assert.doesNotMatch(
    agents,
    /因为 `package\.json` 里全是 `latest`/,
    "AGENTS.md 还留着「因为 package.json 里全是 latest」的现在时说法",
  );
  assert.match(agents, /依赖只写精确版本/, "AGENTS.md 要写明「依赖只写精确版本 + lockfile 必须入库」");
});
