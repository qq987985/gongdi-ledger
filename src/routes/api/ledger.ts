import { createFileRoute } from "@tanstack/react-router";
import { gunzipSync, gzipSync } from "node:zlib";
import { persistOn } from "~/lib/paths.server";
import { ledgerRevisionValue, ledgerUnreadable, readLedger, writeLedger } from "~/lib/nas-fs.server";
import { ledgerPayloadSummary, validateLedgerPayload } from "~/lib/ledger-schema.server";
import { logServer } from "~/lib/log.server";
import { withTenant } from "~/lib/accounts.server";

const CORRUPT_MSG = "服务器上的台账文件读取失败，已拒绝读写。请从 data/backups 恢复或联系管理员（不要手动清空 data）。";

/**
 * 传输压缩（性能）：
 * - 下行：GET 在客户端接受 gzip 时压缩响应体（一本中等工地台账 JSON ~1.45MB → ~200KB），
 *   浏览器/fetch 会自动解压，客户端代码无感。
 * - 上行：PUT 接受 `content-encoding: gzip`（浏览器 CompressionStream 压出来的），先解压再 JSON.parse。
 * - 兼容：不认识的编码 → 400（可读原因，不 500）；多重 gzip 头（反代重复追加 content-encoding）→
 *   多解一层失败就回退到上一层结果，绝不因为反代行为把用户的保存请求打挂。
 */

/** content-encoding / accept-encoding 里允许出现的 gzip 写法（identity 由解析层过滤掉） */
const GZIP_ENCODINGS = new Set(["gzip", "x-gzip"]);

/** 按逗号拆 content-encoding，去空去 identity，统一小写 */
function encodingTokens(header: string | null): string[] {
  return (header || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && t !== "identity");
}

/** 客户端是否接受 gzip：显式 q=0 视为不接受（* 也算接受） */
function acceptsGzip(header: string | null): boolean {
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

/** JSON 响应：客户端接受 gzip 就压；压缩自身失败也退回未压缩，绝不让一次读取变成错误 */
function jsonResponse(body: unknown, init: { acceptEncoding: string | null; status?: number }): Response {
  const bytes = Buffer.from(JSON.stringify(body), "utf8");
  const headers = new Headers({ "content-type": "application/json; charset=utf-8", vary: "Accept-Encoding" });
  const status = init.status ?? 200;
  if (acceptsGzip(init.acceptEncoding)) {
    try {
      const gz = gzipSync(bytes);
      headers.set("content-encoding", "gzip");
      headers.set("content-length", String(gz.length));
      return new Response(gz, { status, headers });
    } catch {
      // 压缩不可用（极少见）时走下面的未压缩分支
    }
  }
  headers.set("content-length", String(bytes.length));
  return new Response(bytes, { status, headers });
}

/** 解 PUT 的请求体：返回文本，或一句可直接回给用户的错误（结构校验/CAS 语义不受影响） */
function decodeRequestBody(buf: Buffer, header: string | null): { text: string } | { error: string } {
  const tokens = encodingTokens(header);
  if (!tokens.length) return { text: buf.toString("utf8") };
  const unknown = [...new Set(tokens.filter((t) => !GZIP_ENCODINGS.has(t)))];
  if (unknown.length) return { error: `不支持的请求压缩格式（content-encoding: ${unknown.join(", ")}）` };
  let cur = buf;
  for (let i = 0; i < tokens.length; i += 1) {
    try {
      cur = gunzipSync(cur);
    } catch {
      if (i === 0) return { error: "请求体不是合法的 gzip 数据" };
      // 头里有多个 gzip 但实际只压了一层（某些反代会重复追加 content-encoding）：
      // 用上一层已解开的结果继续，不要因为代理行为拒绝一次正常保存
      break;
    }
  }
  return { text: cur.toString("utf8") };
}

export const Route = createFileRoute("/api/ledger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ persist: false, empty: true });
        const acceptEncoding = request.headers.get("accept-encoding");
        // 全量台账含身份证/银行卡等敏感字段：只有能看「人员」的成员才能拉取
        return withTenant(
          request,
          async () => {
            const data = await readLedger();
            // 文件坏了不能返回「空台账」——客户端会拿本机（可能也是空）状态把服务器上的数据覆盖掉
            if (ledgerUnreadable(data)) return Response.json({ error: CORRUPT_MSG, corrupt: true }, { status: 503 });
            const response = jsonResponse({ persist: true, ...data }, { acceptEncoding });
            response.headers.set("X-Ledger-Revision", ledgerRevisionValue(data));
            return response;
          },
          "people.view",
        );
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ persist: false }, { status: 400 });
        const encoding = request.headers.get("content-encoding");
        const unknown = [...new Set(encodingTokens(encoding).filter((t) => !GZIP_ENCODINGS.has(t)))];
        if (unknown.length) {
          // 不认识的编码是「客户端发错了」：回 400 并说清楚，不让它进到解压/解析里变成 500
          await logServer("warn", "台账写入被拒：不支持的 content-encoding", { encoding });
          return Response.json(
            {
              error: `不支持的请求压缩格式（content-encoding: ${unknown.join(", ")}），请用 gzip 或不压缩`,
              invalid: true,
            },
            { status: 400 },
          );
        }
        let buf: Buffer;
        try {
          buf = Buffer.from(await request.arrayBuffer());
        } catch {
          return Response.json({ error: "读取请求体失败", invalid: true }, { status: 400 });
        }
        const decoded = decodeRequestBody(buf, encoding);
        if ("error" in decoded) {
          // 解压失败是客户端发错了（或链路坏了），400 而不是 500
          await logServer("warn", "台账写入被拒：请求体解压失败", { encoding, error: decoded.error });
          return Response.json({ error: `请求体解压失败：${decoded.error}`, invalid: true }, { status: 400 });
        }
        // 非 JSON / 空 body 以前会直接抛到框架层变成 500；这里是"客户端发错了"，应该 400
        let body: Record<string, unknown> & Partial<import("~/lib/types").LedgerState>;
        try {
          body = JSON.parse(decoded.text) as Record<string, unknown> & Partial<import("~/lib/types").LedgerState>;
        } catch {
          return Response.json({ error: "请求体不是合法 JSON", invalid: true }, { status: 400 });
        }
        // 结构校验：服务端过去只查权限、不看内容，一个客户端 bug 就能把整本台账写成 {}
        const bad = validateLedgerPayload(body);
        if (bad) {
          await logServer("error", "台账写入被拒：结构不合法", { reason: bad, payload: ledgerPayloadSummary(body) });
          return Response.json({ error: bad, invalid: true }, { status: 400 });
        }
        return withTenant(
          request,
          async () => {
            const expected = request.headers.get("if-match");
            const result = await writeLedger(body, expected === null ? undefined : expected);
            if (result === "unreadable") {
              await logServer("error", "拒绝覆盖损坏的台账文件", {});
              return Response.json({ error: CORRUPT_MSG, corrupt: true }, { status: 503 });
            }
            if (result === "conflict") {
              await logServer("warn", "台账保存冲突", { payload: ledgerPayloadSummary(body) });
              return Response.json({ error: "台账已被其他设备修改，请重新加载后再保存", conflict: true }, { status: 409 });
            }
            const response = Response.json({ ok: true });
            response.headers.set("X-Ledger-Revision", ledgerRevisionValue(body));
            return response;
          },
          "ledger.manage",
        );
      },
    },
  },
});
