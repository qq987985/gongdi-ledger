import { createFileRoute } from "@tanstack/react-router";
import { appendAudit, persistOn, readAudit, writeAudit } from "~/lib/nas-fs.server";
import { resolveTenant, withTenant } from "~/lib/accounts.server";

export const Route = createFileRoute("/api/audit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ entries: [] });
        return withTenant(request, async () => Response.json({ entries: await readAudit() }), "audit.view");
      },
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        const body = (await request.json()) as any;
        if (!body.action?.trim()) return Response.json({ error: "缺少操作" }, { status: 400 });
        const t = await resolveTenant(request);
        return withTenant(request, async () => {
          const entry = await appendAudit({
            userId: t.user?.id || "",
            userName: t.user?.name || t.user?.username || "",
            action: body.action.trim().slice(0, 80),
            detail: String(body.detail || "").slice(0, 400),
            module: String(body.module || "").slice(0, 40),
          });
          return Response.json({ ok: true, entry });
        });
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        if ((await resolveTenant(request)).user?.role !== "admin")
          return Response.json({ error: "只有管理员能改操作记录" }, { status: 403 });
        const body = (await request.json()) as any;
        if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
        return withTenant(request, async () => {
          const next = (await readAudit()).map((e) =>
            e.id === body.id
              ? {
                  ...e,
                  action: body.action != null ? String(body.action).slice(0, 80) : e.action,
                  detail: body.detail != null ? String(body.detail).slice(0, 400) : e.detail,
                  module: body.module != null ? String(body.module).slice(0, 40) : e.module,
                }
              : e,
          );
          await writeAudit(next);
          return Response.json({ ok: true });
        });
      },
      DELETE: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        if ((await resolveTenant(request)).user?.role !== "admin")
          return Response.json({ error: "只有管理员能删操作记录" }, { status: 403 });
        const url = new URL(request.url);
        const id = url.searchParams.get("id") || "";
        const ids = (url.searchParams.get("ids") || id).split(",").filter(Boolean);
        return withTenant(request, async () => {
          const list = await readAudit();
          await writeAudit(list.filter((e) => !ids.includes(e.id)));
          return Response.json({ ok: true });
        });
      },
    },
  },
});
