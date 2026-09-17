/**
 * 生产启动器：被 scripts/copy-output.mjs 复制为 app/server/index.mjs。
 * 用 Node 内置 http 起服务：先尝试静态文件（app/public），再交给 TanStack Start 的 fetch 处理器。
 * 不依赖外部 npm 包，保证 Docker 镜像里只需 COPY app 即可运行。
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./server.js";
// 日志核心与应用侧（src/lib/log.server.ts）**共用同一份实现**：级别 / 保留天数 / 单文件上限 /
// 滚动 / 慢请求门槛只在这里读环境变量，两边不许再各复刻一套（见 scripts/log-core.mjs 顶部注释）。
import {
  enqueueLogLine,
  flushLogs,
  formatLogLine,
  parseLogLevel,
  parseSlowMs,
  pruneOldLogs,
  shouldLog,
  stdoutLog,
} from "./log-core.mjs";

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
  join(dataDir, "photos", "保险合同"),
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
  // 用 path.relative 做真实层级校验，防止 ../、%2e%2e 等逃逸出 publicDir
  const rel = relative(resolve(base), resolve(target));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

async function serveStatic(req) {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Bad Request", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  if (pathname.endsWith("/")) pathname += "index.html";
  const filePath = join(publicDir, pathname);
  const resolvedPath = resolve(filePath);
  // 安全检查：确保路径在 publicDir 内
  if (!isWithin(publicDir, resolvedPath)) return null;
  try {
    const s = await stat(resolvedPath);
    if (!s.isFile()) return null;
    const body = req.method === "HEAD" ? null : await readFile(resolvedPath);
    const headers = {
      "content-type": mimeType(resolvedPath),
      "content-length": String(s.size),
      "x-content-type-options": "nosniff",
    };
    if (pathname.includes("/assets/")) {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    } else {
      // 页面本身不缓存：升级后能立即看到新版
      headers["cache-control"] = "no-cache";
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

/** 请求体上限：默认 64MB（DATA_DIR 里的备份上传走 50MB 上限，这里留余量） */
/**
 * 请求体上限：默认 52MB。
 *
 * 应用自己的上限是 50MB（备份/文件上传），这里留 2MB 给 multipart 边界等开销。
 * 关键在于：**声明**超过上限的请求会在读 body 之前就被拒（413）——
 * 否则一个伪造 `Content-Length: 60MB` 却只发 2 字节的请求会把连接挂到超时。
 */
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 52 * 1024 * 1024);

// ───────────────── 日志（与应用侧共用 scripts/log-core.mjs 的同一份实现） ─────────────────
// 启动器在 Docker 里只带 app/（不能 import src/ 下的 TypeScript），所以核心逻辑放在 log-core.mjs：
// 级别 / 保留天数 / 单文件上限 / 滚动 / 慢请求门槛都在那里定义，**这里不许再复刻第二套**
// （曾经就是两套：应用侧 1.8.4 起超限滚动 .log.N，启动器却停写当天文件且不认 .log.N）。

const logsDir = join(dataDir, "logs");

/** 唯一的日志出口：stdout + data/logs/YYYY-MM-DD.log（NAS 上直接能看，超限滚动不停写） */
function logLine(level, event, detail = {}) {
  if (!shouldLog(level, parseLogLevel(process.env.LOG_LEVEL))) return;
  const line = formatLogLine(level, event, detail);
  stdoutLog(level, line);
  try {
    mkdirSync(logsDir, { recursive: true });
  } catch {}
  // 落盘走 log-core：进程内串行、达上限滚动到 .log.N、跨天/首次写触发保留策略清理。
  // 不 await（日志不能挡请求），但绝不抛出。
  return enqueueLogLine(logsDir, line).catch(() => {});
}

/** 只取路径：丢掉查询串（台账查询里可能带身份证/关键字）与 Cookie，绝不记录敏感值 */
function safePath(rawUrl) {
  try {
    return new URL(String(rawUrl ?? ""), "http://localhost").pathname;
  } catch {
    return "<非法URL>";
  }
}

/** 请求收尾观测：5xx 必记一条；耗时达到 SLOW_MS 记「慢请求」（不记请求体/查询串/Cookie） */
function recordRequest(req, res, startedAt) {
  try {
    const ms = Date.now() - startedAt;
    const status = res.statusCode || 0;
    const method = req.method || "-";
    const path = safePath(req.url);
    if (status >= 500) logLine("error", "HTTP 5xx", { method, path, status, ms });
    // SLOW_MS 必须为正数：未设置时它曾经被解析成 0（Number("") === 0），
    // 于是每个请求（含静态资源）都记一条「慢请求」，把真正要看的 5xx/真慢请求淹没。
    else if (ms >= parseSlowMs(process.env.SLOW_MS)) logLine("warn", "慢请求", { method, path, status, ms });
  } catch {}
}

// 进程启动时清理一次过期日志（另一次在「每天第一次写日志」时，由 log-core 判断）
try {
  mkdirSync(logsDir, { recursive: true });
} catch {}
void pruneOldLogs(logsDir).catch(() => {});

// 未捕获异常原来只进 stdout：NAS 上按日期翻 data/logs 是空的，事后查不到任何 500
process.on("uncaughtException", (err) => logLine("error", "未捕获异常", { error: String((err && err.stack) || err) }));
process.on("unhandledRejection", (reason) =>
  logLine("error", "未处理的 Promise 拒绝", { error: String((reason && reason.stack) || reason) }),
);

/** 读请求体；超过上限立刻拒绝（伪造的超大 content-length 也不会再把连接挂住） */
function requestBody(req) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] || 0);
    if (declared > MAX_BODY_BYTES) {
      // 这里**不能** req.destroy()：那会把还没发出去的 413 响应一起掐掉（客户端只看到"无响应"）
      const e = new Error("请求体太大");
      e.tooLarge = true;
      return reject(e);
    }
    const chunks = [];
    let size = 0;
    let rejected = false;
    req.on("data", (c) => {
      // 已拒绝后再来的数据直接丢弃：否则一个慢速灌数据的连接会让内存一直涨，
      // 直到 res.finish 后 req.destroy() 才停（拒绝后 chunks 不再接收，但仍受 TCP 背压）
      if (rejected) return;
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        rejected = true;
        const e = new Error("请求体太大");
        e.tooLarge = true;
        return reject(e);
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  // 请求耗时观测：挂在 finish 上，所有出口（正常/413/500/早退）都覆盖，且不阻塞响应
  const startedAt = Date.now();
  res.on("finish", () => recordRequest(req, res, startedAt));
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else if (v !== undefined) headers.set(k, v);
    }
    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      try {
        body = await requestBody(req);
      } catch (e) {
        const tooLarge = Boolean(e && e.tooLarge);
        logLine("warn", "请求体被拒", { path: safePath(req.url), tooLarge, error: String((e && e.message) || e) });
        res.statusCode = tooLarge ? 413 : 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: tooLarge ? "请求体太大（上限 52MB）" : "读取请求体失败" }));
        // 响应发完之后再断开：客户端可能还在灌数据，但先把 413 送出去
        res.on("finish", () => {
          try {
            req.destroy();
          } catch {}
        });
        return;
      }
    }
    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });
    const response = await nodeFetch(request);
    res.statusCode = response.status;
    res.statusMessage = response.statusText;
    // 安全响应头：防 MIME 嗅探
    if (!response.headers.has("x-content-type-options")) res.setHeader("x-content-type-options", "nosniff");
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
    // 请求级 500 也要落 data/logs：uncaughtException 只兜「逃出事件循环」的异常，
    // 被这里接住的请求错误原来只进 stdout，NAS 上按日期翻日志看不到任何 500
    logLine("error", "请求处理失败", { url: req.url, method: req.method, error: String((e && e.stack) || e) });
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
  // 启动留痕：NAS 上翻当天日志时能看到「服务什么时候起过」，也顺带证明日志通道是通的
  logLine("info", "服务启动", {
    port,
    host,
    node: process.version,
    // 这两个值都从 log-core 的解析函数来：启动行自报的阈值必须与实际判定一致
    // （曾经自报 slowMs:0 还照记每一条请求为「慢请求」）
    slowMs: parseSlowMs(process.env.SLOW_MS),
    logLevel: parseLogLevel(process.env.LOG_LEVEL),
  });
});

// 优雅退出：Dockerfile 的 CMD 用 `exec node …` 让 PID 1 是 node，`docker stop` 的 SIGTERM 才到得了这里。
// 不做这件事时：进程被直接终止 → 在飞的整本快照保存被中断（数据不会写坏：临时文件 + rename 是原子的，
// 但那次保存丢失、临时文件可能残留），最后几条日志（往往是最关键的 5xx/异常）也随进程一起消失。
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logLine("info", "收到退出信号，停止接收新请求并等待在途请求结束", { signal });
  // keep-alive 的空闲连接会拖住 server.close，主动断掉它们（在途请求不受影响）
  try {
    server.closeIdleConnections?.();
  } catch {}
  // 先把日志队列排干，再退出；5 秒兜底防止某个挂住的连接把容器卡在退出中
  const done = () => void flushLogs().finally(() => process.exit(0));
  try {
    server.close(done);
  } catch {
    done();
  }
  setTimeout(done, 5000).unref();
}
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => shutdown(signal));
