import { createFileRoute } from "@tanstack/react-router";
import { gzipSync } from "node:zlib";
import { persistOn } from "~/lib/paths.server";
import { ledgerRevisionValue, ledgerUnreadable, readLedger, writeLedgerEx } from "~/lib/nas-fs.server";
import { ledgerPayloadSummary, validateLedgerPayload } from "~/lib/ledger-schema.server";
import { logServer } from "~/lib/log.server";
import { withTenant } from "~/lib/accounts.server";
import {
  acceptsGzip,
  decodeRequestBody,
  encodingTokens,
  GZIP_ENCODINGS,
  ledgerGzipEnabled,
  ledgerMaxBytes,
} from "~/lib/ledger-transfer";

const CORRUPT_MSG = "服务器上的台账文件读取失败，已拒绝读写。请从 data/backups 恢复或联系管理员（不要手动清空 data）。";

/**
 * 传输压缩（性能）：
 * - 下行：GET 在客户端接受 gzip 时压缩响应体（一本中等工地台账 JSON ~1.45MB → ~200KB），
 *   浏览器/fetch 会自动解压，客户端代码无感。
 * - 上行：PUT 接受 `content-encoding: gzip`（浏览器 CompressionStream 压出来的），先解压再 JSON.parse。
 * - 兼容：不认识的编码 → 400（可读原因，不 500）；多重 gzip 头（反代重复追加 content-encoding）→
 *   多解一层失败就回退到上一层结果，绝不因为反代行为把用户的保存请求打挂。
 *
 * 1.8.4 补两件事（上限/开关的纯逻辑在 `~/lib/ledger-transfer`，可脱离 Request 单测）：
 * - **解压炸弹防护**：content-length 粗筛 + 解压时 `maxOutputLength` 限制*解压后*大小
 *   （`LEDGER_MAX_MB`，默认 32MB）。超限 → 413、**绝不写盘**、记 `logServer("warn", …)`。
 * - **`LEDGER_GZIP=off`**：下行不再压缩；上行客户端不压缩。
 *   服务端**仍然接受** gzip 请求体 —— 开关只影响我们自己发出去的字节，旧的压缩客户端照常能存。
 */

/** JSON 响应：客户端接受 gzip 就压（LEDGER_GZIP=off 时一律不压）；压缩自身失败也退回未压缩 */
function jsonResponse(body: unknown, init: { acceptEncoding: string | null; status?: number }): Response {
  const bytes = Buffer.from(JSON.stringify(body), "utf8");
  const headers = new Headers({ "content-type": "application/json; charset=utf-8", vary: "Accept-Encoding" });
  const status = init.status ?? 200;
  if (ledgerGzipEnabled() && acceptsGzip(init.acceptEncoding)) {
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
        // A4（1.8.14）：鉴权必须发生在**读 body 之前**。原来先 `await request.arrayBuffer()`
        // 把最多 32MB 读进内存、之后才 withTenant —— 未登录的人反复发大 body 就能吃满内存
        // （CWE-770/400）。现在整个请求体处理都在鉴权后的回调里；权限位与 4xx 语义不变。
        return withTenant(
          request,
          async () => {
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
            // content-length 粗筛：压缩后的字节数已经超过上限时（gzip 不可能把数据压得比原样还大多少），
            // 连 body 都不用读进来 —— 先挡住「客户端老实报了大体积」的情况
            const maxBytes = ledgerMaxBytes();
            const declared = Number(request.headers.get("content-length") || 0);
            if (Number.isFinite(declared) && declared > maxBytes) {
              await logServer("warn", "台账写入被拒：content-length 超过上限", {
                contentLength: declared,
                maxMb: Math.floor(maxBytes / 1024 / 1024),
              });
              return Response.json(
                { error: `请求体超过服务器上限（${Math.floor(maxBytes / 1024 / 1024)}MB），已拒绝保存`, invalid: true },
                { status: 413 },
              );
            }
            try {
              buf = Buffer.from(await request.arrayBuffer());
            } catch {
              return Response.json({ error: "读取请求体失败", invalid: true }, { status: 400 });
            }
            // 解压时用 maxOutputLength 限制**解压后**大小：100MB 全零压成 ~100KB 也进不来（解压炸弹）
            const decoded = decodeRequestBody(buf, encoding, maxBytes);
            if (!decoded.ok) {
              // 超限是「内容太大」（413），格式错是「客户端发错了」（400）—— 两种都带可读原因、都不写盘
              await logServer("warn", `台账写入被拒：${decoded.reason === "too-large" ? "解压/解析后超过上限" : "请求体解压失败"}`, {
                encoding,
                status: decoded.status,
                maxMb: Math.floor(maxBytes / 1024 / 1024),
                receivedBytes: buf.length,
              });
              return Response.json({ error: decoded.error, invalid: true, tooLarge: decoded.reason === "too-large" }, {
                status: decoded.status,
              });        }
            // 非 JSON / 空 body 以前会直接抛到框架层变成 500；这里是"客户端发错了"，应该 400
            const text = decoded.text;
            let body: Record<string, unknown> & Partial<import("~/lib/types").LedgerState>;
            try {
              body = JSON.parse(text) as Record<string, unknown> & Partial<import("~/lib/types").LedgerState>;
            } catch {
              return Response.json({ error: "请求体不是合法 JSON", invalid: true }, { status: 400 });
            }
            // 结构校验：服务端过去只查权限、不看内容，一个客户端 bug 就能把整本台账写成 {}
            const bad = validateLedgerPayload(body);
            if (bad) {
              await logServer("error", "台账写入被拒：结构不合法", { reason: bad, payload: ledgerPayloadSummary(body) });
              return Response.json({ error: bad, invalid: true }, { status: 400 });
            }
            const expected = request.headers.get("if-match");
            // A2（1.8.14）：写成功后用**服务端读视图**的版本号当响应头（与 GET / CAS 同源）。
            // 原来这里算的是 `ledgerRevisionValue(body)`（请求体的 hash），而 readLedger() 会补合同扫描件名
            // 等只在视图里的字段 → 客户端存下的基准对不上，下一次保存必然假冲突 409，弹窗还诱导
            // 用户点「以本机覆盖」（真丢别人的改动）。
            const { result, revision } = await writeLedgerEx(body, expected === null ? undefined : expected);
            if (result === "unreadable") {
              await logServer("error", "拒绝覆盖损坏的台账文件", {});
              return Response.json({ error: CORRUPT_MSG, corrupt: true }, { status: 503 });
            }
            if (result === "conflict") {
              await logServer("warn", "台账保存冲突", { payload: ledgerPayloadSummary(body) });
              return Response.json({ error: "台账已被其他设备修改，请重新加载后再保存", conflict: true }, { status: 409 });
            }
            const response = Response.json({ ok: true });
            if (revision) response.headers.set("X-Ledger-Revision", revision);
            return response;
          },
          "ledger.manage",
        );
      },
    },
  },
});
