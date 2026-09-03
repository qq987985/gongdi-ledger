/**
 * 构建后整理产物为部署目录 app/：
 *   dist/server/**  -> app/server/**（server.js 保持不变，并放入启动器 index.mjs）
 *   dist/client/**  -> app/public/**
 * 运行：vite build 之后自动执行（package.json 的 postbuild）。
 */
import { cp, mkdir, rm, rename, copyFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const appDir = join(root, "app");

if (!existsSync(join(dist, "server", "server.js"))) {
  console.error("dist/server/server.js 不存在，先运行 vite build");
  process.exit(1);
}

await rm(join(appDir, "server"), { recursive: true, force: true });
await rm(join(appDir, "public"), { recursive: true, force: true });
await mkdir(appDir, { recursive: true });

await cp(join(dist, "server"), join(appDir, "server"), { recursive: true });
await mkdir(join(root, "data"), { recursive: true });
await copyFile(
  join(root, "scripts", "app-server-index.mjs"),
  join(appDir, "server", "index.mjs"),
);

// 复制 VERSION.txt 到 app 根目录，供 Windows 打包使用
await copyFile(
  join(root, "VERSION.txt"),
  join(appDir, "VERSION.txt"),
).catch(() => {});

await cp(join(dist, "client"), join(appDir, "public"), { recursive: true });

const files = await readdir(join(appDir, "public"));
console.log("app/ 已更新，public 顶层：", files.join(", "));
