import { createFileRoute } from "@tanstack/react-router";
import { persistOn, savePhoto, removePhoto, findPhotoPath } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

function kindOf(v: string | null) {
  if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
  return null;
}

export const Route = createFileRoute("/api/photo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ url: null });
        const url = new URL(request.url);
        const name = url.searchParams.get("name") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!name || !kind) return Response.json({ url: null });
        return withTenant(
          request,
          async () => {
            const hit = await findPhotoPath(name, kind);
            if (!hit) return Response.json({ url: null, file: null });
            return Response.json({
              url: `/api/photo-file?name=${encodeURIComponent(name)}&kind=${kind}&v=${encodeURIComponent(hit.file)}`,
              file: hit.file,
            });
          },
          "people.view",
        );
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        // 照片走 base64 JSON，限制 20MB（原图过大先压缩再传）
        const len = Number(request.headers.get("content-length") || 0);
        if (len > 20 * 1024 * 1024) return Response.json({ error: "照片太大，最大 20MB" }, { status: 413 });
        const body = (await request.json()) as any;
        const kind = kindOf(body.kind || null);
        if (!body.name || !kind || !body.dataUrl) return Response.json({ ok: false }, { status: 400 });
        if (body.dataUrl.length > 20 * 1024 * 1024) return Response.json({ error: "照片太大，最大 20MB" }, { status: 413 });
        return withTenant(
          request,
          async () => {
            await savePhoto(body.name, kind, body.dataUrl);
            return Response.json({ ok: true });
          },
          "photos.edit",
        );
      },
      DELETE: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        const url = new URL(request.url);
        const name = url.searchParams.get("name") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!name || !kind) return Response.json({ ok: false }, { status: 400 });
        return withTenant(
          request,
          async () => {
            await removePhoto(name, kind);
            return Response.json({ ok: true });
          },
          "photos.edit",
        );
      },
    },
  },
});
