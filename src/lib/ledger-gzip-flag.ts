/**
 * 「服务端是否开着台账 gzip 传输」这一个客户端开关（1.8.4，对应服务端 `LEDGER_GZIP`）。
 *
 * 为什么单独一个文件（与 `nas-flag.ts` 同源做法）：`nas-sync.ts` 的推送链路只需要这一个布尔，
 * 别的模块（如设置页展示开关状态）不该 import 整个同步引擎。
 *
 * 语义：**只影响本机发出去的字节**。关掉后上行不带 `content-encoding`（省掉浏览器压缩开销，
 * 也方便抓包/反代排查），服务端仍然接受 gzip 请求体 —— 老客户端（缓存了旧 JS）继续压缩上传，
 * 一样能存进去。默认开：探测 `/api/health` 之前按「开」处理，压缩只是省流量，不该被延迟生效。
 */
let gzipOn = true;

/** 由 `/api/health` 的响应设置（`ledgerGzip !== false` = 开） */
export function setLedgerGzip(v: unknown): void {
  gzipOn = v !== false;
}

export function ledgerGzipOn(): boolean {
  return gzipOn;
}
