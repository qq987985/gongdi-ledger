import { createFileRoute } from "@tanstack/react-router";
import { persistOn, photoFlags } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

async function namesFrom(request: Request) {
  const q = (new URL(request.url).searchParams.get("names") || "").split("\n").filter(Boolean);
  if (request.method === "GET") return q;
  const body = await request.json().catch(() => ({}));
  if (Array.isArray(body.names) && body.names.length) return body.names.map(String).filter(Boolean);
  return q;
}

export const Route = createFileRoute("/api/photo-flags")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ flags: {} });
        const names = await namesFrom(request);
        return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
      },
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ flags: {} });
        const names = await namesFrom(request);
        return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
      },
    },
  },
});
