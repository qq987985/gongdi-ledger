import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import { persistOn, findPhotoPath } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

function kindOf(v: string | null) {
  if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
  return null;
}

export const Route = createFileRoute("/api/photo-file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return new Response("no", { status: 404 });
        const url = new URL(request.url);
        const name = url.searchParams.get("name") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!name || !kind) return new Response("no", { status: 404 });
        return withTenant(request, async () => {
          const hit = await findPhotoPath(name, kind);
          if (!hit) return new Response("no", { status: 404 });
          const buf = await readFile(hit.path);
          return new Response(buf, {
            headers: {
              "content-type": hit.mime,
              "cache-control": "private, max-age=30",
              "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(hit.file)}`,
            },
          });
        });
      },
    },
  },
});
