/**
 * 构建指纹（A8）：`app/.build-inputs` 必须等于当前源码的指纹。
 *
 * 背景（专家评审 A8）：第四道闸原来先 `pnpm run build` 再比 `app/VERSION.txt` 与 `VERSION.txt` ——
 * 而 VERSION.txt 是构建时复制过去的、结构上永远相等；唯一能看出漂移的 `git diff --quiet -- app/`
 * 被降级成 `::warning`。于是「改了 src/ 忘了重建 app/」全绿发版，而 `latest` 镜像与 Windows 包
 * 恰恰用这个产物目录发布（`Dockerfile` 只 COPY app，`win/pack.sh` 也拷 app）。
 * 修法不能是「git diff 硬失败」：不同 OS / Node 版本构建出的字节不同，那样 CI 会常红
 * （正是它当年被降级的原因）。所以改成**源码指纹**：只跟内容有关，跨环境稳定。
 *
 * 这里测纯函数（指纹的稳定性/敏感性/换行归一）与「构建时必须写指纹」的约定。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILD_INPUTS,
  STAMP_FILE,
  buildInputDigest,
  buildInputFiles,
  parseStamp,
  stampContent,
  verifyStamp,
} from "../scripts/build-stamp.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** 造一棵最小源码树：只放会被指纹覆盖的输入 */
const SRC = "src"; // 单独一个变量：下面用模板串拼测试路径，免得被 guards-paths 当成真实源码路径扫描
function makeTree(extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "gongdi-stamp-"));
  mkdirSync(join(dir, SRC, "lib"), { recursive: true });
  mkdirSync(join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, "app"), { recursive: true });
  const files: Record<string, string> = {
    [`${SRC}/lib/a.ts`]: "export const a = 1;\n",
    "scripts/app-server-index.mjs": "// 启动器\n",
    "scripts/log-core.mjs": "// 日志核心\n",
    "vite.config.ts": "export default {};\n",
    "package.json": '{ "name": "x" }\n',
    "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
    "VERSION.txt": "1.8.13\n更新记录…\n",
    ...extra,
  };
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text, "utf8");
  }
  return dir;
}

test("指纹：同一棵树两次算一致；改 src 内容就变（否则拦不住漂移）", () => {
  const dir = makeTree();
  const first = buildInputDigest(dir);
  assert.equal(first, buildInputDigest(dir), "同一棵树必须得到同一个指纹");
  assert.match(first, /^[0-9a-f]{64}$/);

  writeFileSync(join(dir, SRC, "lib", "a.ts"), "export const a = 2;\n", "utf8");
  assert.notEqual(buildInputDigest(dir), first, "src 改了指纹必须变");

  const dir2 = makeTree({ "VERSION.txt": "1.8.14\n" });
  assert.notEqual(buildInputDigest(dir2), first, "版本号也是构建输入（会进 app/VERSION.txt）");
});

test("指纹只覆盖构建输入：改文档/测试不会让闸门变红（避免误报把闸门逼回 warning）", () => {
  const dir = makeTree({ "docs/使用与部署/x.md": "文档\n", [`tests/x.test.ts`]: "// 测试\n" });
  const before = buildInputDigest(dir);
  writeFileSync(join(dir, "docs/使用与部署/x.md"), "文档改了\n", "utf8");
  writeFileSync(join(dir, "tests", "x.test.ts"), "// 测试也改了\n", "utf8");
  assert.equal(buildInputDigest(dir), before, "文档/测试不属于构建输入");
  assert.equal(buildInputFiles(dir).includes("docs/使用与部署/x.md"), false);
});

test("指纹覆盖启动器与日志核心（它们是被原样复制进 app/server/ 的）", () => {
  const files = buildInputFiles(ROOT);
  assert.equal(files.includes("scripts/app-server-index.mjs"), true, "启动器必须参与指纹");
  assert.equal(files.includes("scripts/log-core.mjs"), true, "日志核心必须参与指纹");
  assert.equal(files.some((f) => f.startsWith("src/")), true, "src/ 必须参与指纹");
  assert.equal(BUILD_INPUTS.includes("VERSION.txt"), true);
});

test("指纹按 LF 归一：Windows 检出（CRLF）不该造成误报", () => {
  const lf = makeTree({ [`${SRC}/lib/b.ts`]: "line1\nline2\n" });
  const crlf = makeTree({ [`${SRC}/lib/b.ts`]: "line1\r\nline2\r\n" });
  assert.equal(buildInputDigest(crlf), buildInputDigest(lf));
});

test("指纹文件内容：带一行注释说明来源与校验方式，且带版本号", () => {
  const dir = makeTree();
  const text = stampContent(dir);
  assert.match(text, /^#/m, "要有注释行，避免有人以为它是构建产物里的垃圾文件");
  assert.match(text, /node scripts\/build-stamp\.mjs --verify/, "注释里写清怎么校验");
  assert.match(text, /1\.8\.13/, "带上版本号，方便人肉确认");
  assert.equal(parseStamp(text), buildInputDigest(dir));
});

test("parseStamp：跳过注释与空行，脏内容返回空（不抛）", () => {
  assert.equal(parseStamp("# 注释\n\n"), "");
  assert.equal(parseStamp(""), "");
  assert.equal(parseStamp(undefined), "");
  assert.equal(parseStamp("短东西\n"), "");
  assert.equal(parseStamp("# x\n" + "a".repeat(64) + "  1.0.0\n"), "a".repeat(64));
});

test("verifyStamp：相符 → ok；缺指纹文件/指纹不符 → 失败并给出修法", () => {
  const dir = makeTree();
  const missing = verifyStamp(dir);
  assert.equal(missing.ok, false);
  assert.match(missing.reason, new RegExp(STAMP_FILE.replace(".", "\\.")), "要说清缺的是哪个文件");

  writeFileSync(join(dir, "app", STAMP_FILE), stampContent(dir), "utf8");
  const good = verifyStamp(dir);
  assert.equal(good.ok, true);
  assert.equal(good.recorded, good.digest);

  writeFileSync(join(dir, "src", "lib", "a.ts"), "export const a = 3;\n", "utf8");
  const stale = verifyStamp(dir);
  assert.equal(stale.ok, false, "源码改了但没重建 app/ —— 这正是要拦住的");
  assert.equal(stale.recorded !== stale.digest, true);
  assert.match(stale.reason, /app\/ 与当前源码不一致/);
});

test("约定：pnpm run build（scripts/copy-output.mjs）必须写 app/.build-inputs", () => {
  const src = readFileSync(join(ROOT, "scripts", "copy-output.mjs"), "utf8");
  assert.match(src, /from "\.\/build-stamp\.mjs"/, "构建脚本要用同一份指纹实现（不许另算一套）");
  assert.match(src, /writeFile\(join\(appDir, STAMP_FILE\)/, "产物 app/ 里必须写入指纹文件");
  assert.match(src, /stampContent\(root\)/);
});
