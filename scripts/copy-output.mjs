/**
 * 构建后整理产物为部署目录 app/：
 *   dist/server/**  -> app/server/**（server.js 保持不变，并放入启动器 index.mjs）
 *   dist/client/**  -> app/public/**
 * 运行：vite build 之后自动执行（package.json 的 postbuild）。
 *
 * 先完整写入 app/.stage，再整体替换，避免中途失败留下半成品 app/。
 */
import { cp, mkdir, rm, rename, copyFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
// 构建指纹（A8）：把「这版 app/ 是哪版源码构建出来的」写进 app/.build-inputs，
// CI 的漂移闸门（ci/check.workflow.yml）在**构建之前**重算它 —— 这是唯一跨环境稳定、能当硬失败的判据。
import { STAMP_FILE, stampContent } from "./build-stamp.mjs";

const root = process.cwd();
const dist = join(root, "dist");
const appDir = join(root, "app");
const stage = join(appDir, ".stage");

if (!existsSync(join(dist, "server", "server.js"))) {
  console.error("dist/server/server.js 不存在，先运行 vite build");
  process.exit(1);
}

// 1) 全部产物先写入暂存目录
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });

await cp(join(dist, "server"), join(stage, "server"), { recursive: true });
await mkdir(join(root, "data"), { recursive: true });
await copyFile(
  join(root, "scripts", "app-server-index.mjs"),
  join(stage, "server", "index.mjs"),
);
// 日志核心：启动器（app/server/index.mjs）`import "./log-core.mjs"`，必须一起复制进 app/server/，
// 否则容器起来就 ERR_MODULE_NOT_FOUND。应用侧 src/lib/log.server.ts 也 import 同一份（打进 server.js），
// 所以「级别 / 保留 / 单文件上限 / 滚动」两侧语义不会再分叉。
await copyFile(
  join(root, "scripts", "log-core.mjs"),
  join(stage, "server", "log-core.mjs"),
);

// 复制 VERSION.txt 到 app 根目录，供 Windows 打包使用
await copyFile(join(root, "VERSION.txt"), join(stage, "VERSION.txt")).catch(() => {});

await cp(join(dist, "client"), join(stage, "public"), { recursive: true });

// 2) 逐个替换：旧目录先改名留底，再放入新目录，最后删留底
const swap = async (name) => {
  const target = join(appDir, name);
  const old = target + ".old";
  await rm(old, { recursive: true, force: true });
  const from = join(stage, name);
  if (!existsSync(from)) await rm(target, { recursive: true, force: true });
  else {
    if (existsSync(target)) await rename(target, old);
    await rename(from, target);
    await rm(old, { recursive: true, force: true }).catch(() => {});
  }
};

await swap("server");
await swap("public");
await swap("VERSION.txt");
await rm(stage, { recursive: true, force: true });

// 3) 写构建指纹：放在所有 swap 之后，保证 app/ 已经是最终状态对应的输入集合。
//    （指纹只算「构建输入」，所以它自己进 app/ 不会影响自身。）
await writeFile(join(appDir, STAMP_FILE), stampContent(root), "utf8");

const files = await readdir(join(appDir, "public"));
console.log("app/ 已更新，public 顶层：", files.join(", "));
