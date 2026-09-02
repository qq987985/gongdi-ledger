import { createFileRoute } from "@tanstack/react-router";
import { persistOn, readLedger, writeLedger } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

export const Route = createFileRoute("/api/ledger")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ persist: false, empty: true });
        return withTenant(request, async () => {
          const data = await readLedger();
          return Response.json({ persist: true, ...data });
        });
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
          "ledger.write",
        );
      },
    },
  },
});
