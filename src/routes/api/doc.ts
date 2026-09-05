import { createFileRoute } from "@tanstack/react-router";
import { persistOn, saveDoc, removeDocFile, findDoc } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

function kindOf(v: string | null) {
  if (v === "report" || v === "invoice" || v === "receipt" || v === "attendance" || v === "contract" || v === "expense" || v === "payout" || v === "insurance") return v;
  return null;
}

/** 文件类型 → 查看权限：与 UI 的入口模块一致，避免权限错配 */
function kindView(kind: string): string {
  if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract") return "contracts.view";
  if (kind === "expense" || kind === "payout") return "expenses.view";
  if (kind === "insurance") return "insurance.view";
  return "attendance.view";
}

function kindEdit(kind: string): string {
  if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract") return "contracts.edit";
  if (kind === "expense" || kind === "payout") return "expenses.edit";
  if (kind === "insurance") return "insurance.edit";
  return "attendance.edit";
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
        return withTenant(
          request,
          async () => {
            const hit = await findDoc(id, kind);
            if (!hit) return new Response("not found", { status: 404 });
            const mime = MIME[`.${(hit.fileName.split(".").pop() || "").toLowerCase()}`] || "application/octet-stream";
            return new Response(new Uint8Array(hit.buf), {
              headers: {
                "Content-Type": mime,
                "Content-Disposition": `inline; filename="${encodeURIComponent(hit.fileName.replace(/[\r\n]/g, ""))}"`,
                "Cache-Control": "no-store",
              },
            });
          },
          kindView(kind),
        );
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
          kindEdit(kind),
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
          kindEdit(kind),
        );
      },
    },
  },
});
