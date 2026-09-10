import { createFileRoute } from "@tanstack/react-router";
import { ledgerRevision, persistOn, readLedger, writeLedger } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

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
            const response = Response.json({ persist: true, ...data });
            response.headers.set("X-Ledger-Revision", await ledgerRevision());
            return response;
          },
          "people.view",
        );
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ persist: false }, { status: 400 });
        const body = await request.json();
        return withTenant(
          request,
          async () => {
            const expected = request.headers.get("if-match");
            const ok = await writeLedger(body, expected === null ? undefined : expected);
            if (!ok) return Response.json({ error: "台账已被其他设备修改，请重新加载后再保存", conflict: true }, { status: 409 });
            const response = Response.json({ ok: true });
            response.headers.set("X-Ledger-Revision", await ledgerRevision());
            return response;
          },
          "ledger.manage",
        );
      },
    },
  },
});
