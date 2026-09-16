/**
 * 台账传输压缩的「上限」与「开关」（纯函数，可单测，1.8.4）。
 *
 * 为什么单独一个文件：`src/routes/api/ledger.ts` 只该管路由编排，而这里的判断
 * （解压炸弹上限、gzip 开关、accept-encoding 解析）都是**纯逻辑**，
 * 需要能脱离 Request/Response 直接单测（§12.2「功能开关/小值独立成模块」）。
 *
 * 三件事：
 * 1. `LEDGER_MAX_MB`（默认 32）：一次 PUT 解压/解析后允许的台账字节上限。
 *    gzip 是压缩炸弹的载体：100MB 全零压成 ~100KB，content-length 粗筛挡不住，
 *    必须靠 zlib 的 `maxOutputLength` 在**解压过程中**就掐断（不落地、不整份展开）。
 * 2. `LEDGER_GZIP=off`：下行不再压缩；上行**客户端**不压缩；
 *    但服务端**仍然接受** `content-encoding: gzip` 的请求（新旧客户端互通，
 *    见 §5「兼容性不做无谓的破坏」）。
 * 3. `content-encoding` / `accept-encoding` 的解析（含反代重复追加头、q=0、identity）。
 */
import { gunzipSync } from "node:zlib";

export const DEFAULT_LEDGER_MAX_MB = 32;

/** 上限封顶：环境变量写错（如 LEDGER_MAX_MB=999999）不该让一台 NAS 被一份台账打爆 */
const MAX_LEDGER_MB_CAP = 4096;

/** 允许出现的 gzip 编码写法（identity 在解析层就被过滤掉） */
export const GZIP_ENCODINGS: ReadonlySet<string> = new Set(["gzip", "x-gzip"]);

/** 关掉 gzip 的写法：off / 0 / false / no（大小写、空白容忍） */
const OFF_VALUES = new Set(["off", "0", "false", "no", "disable", "disabled"]);

function parsePositiveNumber(raw: unknown, fallback: number, max: number): number {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

/** LEDGER_MAX_MB 解析：非法（空/非数字/0/负数/NaN/Infinity）走默认 32；允许小数。 */
export function parseLedgerMaxMb(raw: unknown = process.env.LEDGER_MAX_MB): number {
  return parsePositiveNumber(raw, DEFAULT_LEDGER_MAX_MB, MAX_LEDGER_MB_CAP);
}

/** 解析后的字节上限（向下取整，最小 1 字节 —— 0 会让任何请求都被拒） */
export function ledgerMaxBytes(raw: unknown = process.env.LEDGER_MAX_MB): number {
  return Math.max(1, Math.floor(parseLedgerMaxMb(raw) * 1024 * 1024));
}

/** 上行客户端是否该压缩（下行要不要压缩由路由配合 accept-encoding 决定） */
export function parseGzipSwitch(raw: unknown): boolean {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return !OFF_VALUES.has(v);
}

/** `LEDGER_GZIP` 开关：默认开；`off/0/false/no` 关。 */
export function ledgerGzipEnabled(raw: unknown = process.env.LEDGER_GZIP): boolean {
  return parseGzipSwitch(raw);
}

/** 按逗号拆 content-encoding / accept-encoding，去空去 identity，统一小写 */
export function encodingTokens(header: string | null): string[] {
  return (header || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && t !== "identity");
}

/** 客户端是否接受 gzip：显式 q=0 视为不接受（`*` 也算接受） */
export function acceptsGzip(header: string | null): boolean {
  for (const part of (header || "").split(",")) {
    const [rawToken, ...params] = part.split(";");
    const token = rawToken.trim().toLowerCase();
    if (token !== "gzip" && token !== "*") continue;
    const q = params.map((p) => p.trim().toLowerCase()).find((p) => p.startsWith("q="));
    if (q) {
      const val = Number.parseFloat(q.slice(2));
      if (Number.isFinite(val) && val <= 0) continue;
    }
    return true;
  }
  return false;
}

export type DecodeResult =
  | { ok: true; text: string }
  | { ok: false; status: 400 | 413; error: string; reason: "unknown-encoding" | "bad-gzip" | "too-large" };

/** zlib 用 maxOutputLength 掐断时抛的错误码（Node 15+） */
function isTooLarge(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException | undefined)?.code;
  return code === "ERR_BUFFER_TOO_LARGE" || code === "ERR_OUT_OF_RANGE";
}

function tooLargeMessage(maxBytes: number, raw: unknown = process.env.LEDGER_MAX_MB): string {
  return (
    `台账内容超过服务器上限（解压后 > ${parseLedgerMaxMb(raw)}MB）` +
    "，已拒绝保存。请确认上传的是一本工地台账，必要时请管理员调整 LEDGER_MAX_MB。"
  );
}

/**
 * 解 PUT 的请求体：返回文本，或一句可直接回给用户的错误（结构校验/CAS 语义不受影响）。
 *
 * 顺序：不认识的编码 → 解压（带 maxOutputLength 的解压炸弹防护）→ 文本。
 * 超限返回 **413**（不是 400）：语义是「内容太大」，与「格式不对」区分开；
 * 两种都带可读原因，两种都**不写盘**。
 */
export function decodeRequestBody(buf: Buffer, header: string | null, maxBytes: number = ledgerMaxBytes()): DecodeResult {
  const tokens = encodingTokens(header);
  if (!tokens.length) {
    if (buf.length > maxBytes) return { ok: false, status: 413, error: tooLargeMessage(maxBytes), reason: "too-large" };
    return { ok: true, text: buf.toString("utf8") };
  }
  const unknown = [...new Set(tokens.filter((t) => !GZIP_ENCODINGS.has(t)))];
  if (unknown.length) {
    return {
      ok: false,
      status: 400,
      error: `不支持的请求压缩格式（content-encoding: ${unknown.join(", ")}）`,
      reason: "unknown-encoding",
    };
  }
  let cur = buf;
  for (let i = 0; i < tokens.length; i += 1) {
    let next: Buffer;
    try {
      // maxOutputLength：解压输出超过上限直接抛 ERR_BUFFER_TOO_LARGE，不会把 100MB 展开到内存里
      next = gunzipSync(cur, { maxOutputLength: maxBytes });
    } catch (err) {
      if (isTooLarge(err)) {
        return { ok: false, status: 413, error: tooLargeMessage(maxBytes), reason: "too-large" };
      }
      if (i === 0) return { ok: false, status: 400, error: "解压失败：请求体不是合法的 gzip 数据", reason: "bad-gzip" };
      // 头里有多个 gzip 但实际只压了一层（某些反代会重复追加 content-encoding）：
      // 用上一层已解开的结果继续，不要因为代理行为拒绝一次正常保存
      break;
    }
    cur = next;
  }
  if (cur.length > maxBytes) return { ok: false, status: 413, error: tooLargeMessage(maxBytes), reason: "too-large" };
  return { ok: true, text: cur.toString("utf8") };
}
