import { createFileRoute } from "@tanstack/react-router";
import { persistOn, readLedger, writeLedger } from "~/lib/nas-fs.server";
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
            return Response.json({ persist: true, ...data });
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
            await writeLedger(body);
            return Response.json({ ok: true });
          },
          "ledger.manage",
        );
      },
    },
  },
});
