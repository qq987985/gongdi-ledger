import { createFileRoute } from "@tanstack/react-router";
import { persistOn, saveDoc, removeDocFile, findDoc } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

function kindOf(v: string | null) {
  if (v === "report" || v === "invoice" || v === "receipt" || v === "attendance" || v === "contract" || v === "expense" || v === "payout") return v;
  return null;
}

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".ofd": "application/ofd",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
};

export const Route = createFileRoute("/api/doc")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return new Response("not found", { status: 404 });
        const url = new URL(request.url);
        const id = url.searchParams.get("id") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!id || !kind) return new Response("bad request", { status: 400 });
        return withTenant(request, async () => {
          const hit = await findDoc(id, kind);
          if (!hit) return new Response("not found", { status: 404 });
          const mime = MIME[`.${(hit.fileName.split(".").pop() || "").toLowerCase()}`] || "application/octet-stream";
          return new Response(new Uint8Array(hit.buf), {
            headers: {
              "Content-Type": mime,
              "Content-Disposition": `inline; filename="${encodeURIComponent(hit.fileName)}"`,
              "Cache-Control": "no-store",
            },
          });
        });
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        const form = await request.formData();
        const id = String(form.get("id") || "");
        const kind = kindOf(String(form.get("kind") || ""));
        const file = form.get("file");
        if (!id || !kind || !(file instanceof File)) return Response.json({ ok: false }, { status: 400 });
        const buf = Buffer.from(await file.arrayBuffer());
        const replace = String(form.get("replace") || "") === "1";
        return withTenant(
          request,
          async () => {
            const saved = await saveDoc(id, kind, buf, file.name, { replace });
            return Response.json({ ok: true, fileName: saved || file.name });
          },
          "files.edit",
        );
      },
      DELETE: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        const url = new URL(request.url);
        const id = url.searchParams.get("id") || "";
        const kind = kindOf(url.searchParams.get("kind"));
        if (!id || !kind) return Response.json({ ok: false }, { status: 400 });
        return withTenant(
          request,
          async () => {
            await removeDocFile(id, kind);
            return Response.json({ ok: true });
          },
          "files.edit",
        );
      },
    },
  },
});
