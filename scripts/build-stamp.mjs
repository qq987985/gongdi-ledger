/**
 * 构建指纹（A8）：回答「仓库里的 `app/` 到底是不是当前源码构建出来的」。
 *
 * 为什么需要它：第四道闸原来只比 `app/VERSION.txt` 与 `VERSION.txt`、以及几个关键文件是否存在 ——
 * 而 VERSION.txt 是构建时**复制**过去的，所以「先构建再比较」在结构上永远相等：
 * 唯一的判据（`git diff --quiet -- app/`）被降级成了 `::warning`。
 * 结果是「改了 src/ 忘了重建 app/」没有任何闸门拦得住，而镜像/Windows 包恰恰用这个产物目录发布。
 *
 * 为什么不直接用 `git diff --exit-code app/`：**不同操作系统/Node 版本构建出的字节不同**
 * （打包器的产物受环境影响），把它当硬失败会让 CI 常红，于是它才被降级成警告。
 *
 * 所以这里用「源码指纹」：`pnpm run build` 时把**参与构建的输入**（src/、public/、启动器、
 * 日志核心、vite/tsconfig/package/lockfile/VERSION）按「路径 + 内容」算一个 sha256 写进
 * `app/.build-inputs`；CI 在构建**之前**重算一遍并比对：
 * - 一致 → 仓库里的 app/ 就是当前源码构建的（跟在哪台机器上构建无关）；
 * - 不一致 / 没有指纹文件 → 硬失败，提示「本地跑 pnpm run build，把 app/ 一起提交」。
 *
 * 指纹只覆盖构建输入，所以改文档、改测试不会让闸门变红。
 * 换行统一按 LF 归一（Windows 检出 CRLF 时不会误报）。类型声明见 build-stamp.d.mts。
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** 指纹文件放在 app/ 根目录（与 VERSION.txt 同级）。 */
export const STAMP_FILE = ".build-inputs";

/** 参与构建的输入：相对仓库根。只有它们变了才需要重建 app/。 */
export const BUILD_INPUTS = [
  "src",
  "public",
  "scripts/app-server-index.mjs",
  "scripts/log-core.mjs",
  "vite.config.ts",
  "tsconfig.json",
  "package.json",
  "pnpm-lock.yaml",
  "VERSION.txt",
];

/** 永远不参与指纹的目录名（免得 node_modules 拖慢 CI，或 .git 内容变化引起误报） */
const SKIP_DIRS = new Set(["node_modules", ".git"]);

function collect(root, abs, out) {
  let st;
  try {
    st = statSync(abs);
  } catch {
    return; // 可选输入不存在（如没有 public/）就跳过
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(abs).sort()) {
      if (SKIP_DIRS.has(name) || name === ".DS_Store") continue;
      collect(root, join(abs, name), out);
    }
    return;
  }
  if (st.isFile()) out.push(relative(root, abs).split(sep).join("/"));
}

/** 参与指纹的文件列表（排序后，便于测试与排查） */
export function buildInputFiles(root = process.cwd()) {
  const files = [];
  for (const entry of BUILD_INPUTS) collect(root, join(root, entry), files);
  return files.sort();
}

/**
 * 源码指纹：`sha256(路径 + 归一化后的内容 ...)`。与操作系统、Node 版本无关
 * （内容相同就相同），所以能当硬闸门。
 */
export function buildInputDigest(root = process.cwd()) {
  const hash = createHash("sha256");
  for (const rel of buildInputFiles(root)) {
    // 按 latin1 读：二进制文件也能安全参与（只做 CRLF 归一），不改变「内容相同则指纹相同」
    const content = readFileSync(join(root, rel)).toString("latin1").replace(/\r\n/g, "\n");
    hash.update(rel);
    hash.update("\0");
    hash.update(content, "latin1");
    hash.update("\0");
  }
  return hash.digest("hex");
}

/** 指纹文件的内容（带一行注释说明「谁写的、怎么校验」）。 */
export function stampContent(root = process.cwd()) {
  const version = readFileSync(join(root, "VERSION.txt"), "utf8").split("\n")[0].trim();
  return (
    "# 这个 app/ 是下面这版源码构建出来的（由 scripts/copy-output.mjs 写入，勿手改）。\n" +
    `# 校验：node scripts/build-stamp.mjs --verify\n${buildInputDigest(root)}  ${version}\n`
  );
}

/** 从指纹文件里取出指纹（跳过注释行）。 */
export function parseStamp(raw) {
  for (const line of String(raw ?? "").split("\n")) {
    const text = line.trim();
    if (!text || text.startsWith("#")) continue;
    const digest = text.split(/\s+/)[0];
    if (/^[0-9a-f]{64}$/.test(digest)) return digest;
  }
  return "";
}

/**
 * 校验：`app/.build-inputs` 里的指纹必须等于当前源码的指纹。
 * 返回 `{ ok, digest, recorded, reason }`（不抛出，调用方决定怎么报）。
 */
export function verifyStamp(root = process.cwd()) {
  const path = join(root, "app", STAMP_FILE);
  const digest = buildInputDigest(root);
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return {
      ok: false,
      digest,
      recorded: "",
      reason: `仓库里没有 app/${STAMP_FILE}（或是旧的、没有这个文件）`,
    };
  }
  const recorded = parseStamp(raw);
  if (!recorded) return { ok: false, digest, recorded, reason: `app/${STAMP_FILE} 内容不合法（读不出指纹）` };
  if (recorded !== digest) return { ok: false, digest, recorded, reason: "app/ 与当前源码不一致" };
  return { ok: true, digest, recorded, reason: "" };
}

const short = (hex) => (hex ? hex.slice(0, 12) : "（无）");

/** CLI：`node scripts/build-stamp.mjs --verify [仓库根]`。不一致就 exit 1 并说清修法。 */
function main(argv) {
  const args = argv.slice(2);
  const verify = args.includes("--verify");
  if (!verify) {
    console.log("用法：node scripts/build-stamp.mjs --verify [仓库根]");
    console.log("（写入指纹由 pnpm run build → scripts/copy-output.mjs 自动完成，不用手跑）");
    return 0;
  }
  const root = resolve(args.find((a) => !a.startsWith("--")) || process.cwd());
  const result = verifyStamp(root);
  if (result.ok) {
    console.log(`✓ app/ 与源码一致（源码指纹 ${short(result.digest)}）`);
    return 0;
  }
  console.error(`✗ ${result.reason}`);
  console.error(`  app/ 记录的指纹：${short(result.recorded)}`);
  console.error(`  当前源码指纹：  ${short(result.digest)}`);
  console.error("  修法：本地跑 `pnpm run build`（会重新生成 app/ 与 app/.build-inputs），把 app/ 一起提交。");
  console.error("  说明：只改了文档/测试不会触发这条；改了 src/、启动器、VERSION.txt 等构建输入才会。");
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv));
}
