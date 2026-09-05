import { createFileRoute } from "@tanstack/react-router";
import { persistOn, readLedger, scanPhotoFolder } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

export const Route = createFileRoute("/api/photo-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
        const body = await request.json().catch(() => ({}));
        return withTenant(
          request,
          async () => {
            let names: string[] = Array.isArray(body.names) ? body.names.map(String).filter(Boolean) : [];
            if (!names.length) {
              const led = await readLedger();
              names = (Array.isArray(led.people) ? led.people : []).map((p: any) => String(p.name || "").trim()).filter(Boolean);
            }
            return Response.json(await scanPhotoFolder(names));
          },
          "photos.view",
        );
      },
    },
  },
});
