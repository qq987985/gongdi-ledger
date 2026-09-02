/**
 * 生产启动器：被 scripts/copy-output.mjs 复制为 app/server/index.mjs。
 * 用 srvx 起 node 服务：先尝试静态文件（app/public），再交给 TanStack Start 的 fetch 处理器。
 * 端口/地址读环境变量 PORT / HOST（srvx 默认行为），兼容 NITRO_PORT / NITRO_HOST。
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "srvx/node";
import { staticMiddleware } from "srvx/static";
import handler from "./server.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "public");

// 默认数据目录在 app 同级的 data/；可通过环境变量 DATA_DIR 覆盖
process.env.DATA_DIR ??= join(here, "..", "..", "data");

const fetch = typeof handler === "function" ? handler : handler.fetch;

serve({
  middleware: [
    staticMiddleware({
      dir: publicDir,
      // 构建产物带 hash，长缓存；其余静态文件短缓存
      cache: (path) =>
        path.includes("/assets/")
          ? { "cache-control": "public, max-age=31536000, immutable" }
          : { "cache-control": "public, max-age=3600" },
    }),
  ],
  fetch,
  port: process.env.PORT || process.env.NITRO_PORT || 8080,
  hostname: process.env.HOST || process.env.NITRO_HOST || "0.0.0.0",
});
