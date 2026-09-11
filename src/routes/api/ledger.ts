import { createFileRoute } from "@tanstack/react-router";
import { ledgerRevisionValue, ledgerUnreadable, persistOn, readLedger, writeLedger } from "~/lib/nas-fs.server";
import { ledgerPayloadSummary, validateLedgerPayload } from "~/lib/ledger-schema.server";
import { logServer } from "~/lib/log.server";
import { withTenant } from "~/lib/accounts.server";

const CORRUPT_MSG = "服务器上的台账文件读取失败，已拒绝读写。请从 data/backups 恢复或联系管理员（不要手动清空 data）。";

export const Route = createFileRoute("/api/ledger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ persist: false, empty: true });
        // 全量台账含身份证/银行卡等敏感字段：只有能看「人员」的成员才能拉取
        return withTenant(
          request,
          async () => {
            const data = await readLedger();
            // 文件坏了不能返回「空台账」——客户端会拿本机（可能也是空）状态把服务器上的数据覆盖掉
            if (ledgerUnreadable(data)) return Response.json({ error: CORRUPT_MSG, corrupt: true }, { status: 503 });
            const response = Response.json({ persist: true, ...data });
            response.headers.set("X-Ledger-Revision", ledgerRevisionValue(data));
            return response;
          },
          "people.view",
        );
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ persist: false }, { status: 400 });
        // 非 JSON / 空 body 以前会直接抛到框架层变成 500；这里是"客户端发错了"，应该 400
        let body: Record<string, unknown> & Partial<import("~/lib/types").LedgerState>;
        try {
          body = (await request.json()) as Record<string, unknown> & Partial<import("~/lib/types").LedgerState>;
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
