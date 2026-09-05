/**
 * 构建后整理产物为部署目录 app/：
 *   dist/server/**  -> app/server/**（server.js 保持不变，并放入启动器 index.mjs）
 *   dist/client/**  -> app/public/**
 * 运行：vite build 之后自动执行（package.json 的 postbuild）。
 *
 * 先完整写入 app/.stage，再整体替换，避免中途失败留下半成品 app/。
 */
import { cp, mkdir, rm, rename, copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";

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

const files = await readdir(join(appDir, "public"));
console.log("app/ 已更新，public 顶层：", files.join(", "));
