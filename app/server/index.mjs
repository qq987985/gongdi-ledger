/**
 * 生产启动器：被 scripts/copy-output.mjs 复制为 app/server/index.mjs。
 * 用 Node 内置 http 起服务：先尝试静态文件（app/public），再交给 TanStack Start 的 fetch 处理器。
 * 不依赖外部 npm 包，保证 Docker 镜像里只需 COPY app 即可运行。
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./server.js";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(join(here, "..", "public"));

// 默认数据目录在 app 同级的 data/；可通过环境变量 DATA_DIR 覆盖
process.env.DATA_DIR ??= join(here, "..", "..", "data");

// 同步创建数据目录（首次运行时）
const dataDir = process.env.DATA_DIR;
const dirs = [
  join(dataDir, "accounts"),
  join(dataDir, "books"),
  join(dataDir, "backups"),
  join(dataDir, "templates"),
  join(dataDir, "photos", "id"),
  join(dataDir, "photos", "bank"),
  join(dataDir, "photos", "ic"),
  join(dataDir, "photos", "报量单"),
  join(dataDir, "photos", "发票"),
  join(dataDir, "photos", "收款回单"),
  join(dataDir, "photos", "考勤影像"),
  join(dataDir, "photos", "合同扫描件"),
  join(dataDir, "photos", "报销凭证"),
  join(dataDir, "photos", "报销打款"),
];
for (const d of dirs) {
  try {
    await mkdir(d, { recursive: true });
  } catch {
    // 忽略已存在或其他错误
  }
}

const fetch = typeof handler === "function" ? handler : handler.fetch;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pdf": "application/pdf",
  ".ofd": "application/ofd",
  ".xml": "application/xml",
};

function mimeType(path) {
  return MIME[extname(path).toLowerCase()] || "application/octet-stream";
}

function isWithin(base, target) {
  // 统一使用正斜杠进行比较，兼容 Windows 反斜杠
  const baseNorm = base.replace(/\\/g, "/");
  const targetNorm = target.replace(/\\/g, "/");
  const rel = targetNorm.slice(baseNorm.length);
  return !rel.includes("..") && rel.startsWith("/");
}

async function serveStatic(req) {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  const filePath = join(publicDir, pathname);
  const resolvedPath = resolve(filePath);
  // 安全检查：确保路径在 publicDir 内
  if (!isWithin(publicDir, resolvedPath)) return null;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return null;
    const body = req.method === "HEAD" ? null : await readFile(filePath);
    const headers = {
      "content-type": mimeType(filePath),
      "content-length": String(s.size),
    };
    if (pathname.includes("/assets/")) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    } else {
      headers["cache-control"] = "public, max-age=3600";
    }
    return new Response(body, { headers });
  } catch {
    // 文件不存在或其他错误，返回 null 让 server.js 处理
    return null;
  }
}

async function nodeFetch(req) {
  const staticRes = await serveStatic(req);
  if (staticRes) return staticRes;
  return fetch(req);
}

function requestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else if (v !== undefined) headers.set(k, v);
    }
    const body = req.method !== "GET" && req.method !== "HEAD" ? await requestBody(req) : null;
    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });
    const response = await nodeFetch(request);
    res.statusCode = response.status;
    res.statusMessage = response.statusText;
    // 正确处理多个相同名称的响应头（如 Set-Cookie）
    const headerMap = new Map();
    response.headers.forEach((v, k) => {
      if (!headerMap.has(k)) headerMap.set(k, []);
      headerMap.get(k).push(v);
    });
    for (const [k, values] of headerMap) {
      if (values.length === 1) {
        res.setHeader(k, values[0]);
      } else {
        res.setHeader(k, values);
      }
    }
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (e) {
    console.error("[server error]", e);
    console.error(e.stack);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("Internal Server Error");
    } else {
      res.end();
    }
  }
});

const port = Number(process.env.PORT || process.env.NITRO_PORT || 8080);
const host = process.env.HOST || process.env.NITRO_HOST || "0.0.0.0";
server.listen(port, host, () => {
  console.log(`➜ Listening on: http://localhost:${port}/ (${host})`);
});
