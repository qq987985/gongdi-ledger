import { createFileRoute } from "@tanstack/react-router";
import { appendAudit, persistOn, readAudit, writeAudit } from "~/lib/nas-fs.server";
import { logServer } from "~/lib/log.server";
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
        const body = (await request.json()) as { action?: string; detail?: string; module?: string };
        if (!body.action?.trim()) return Response.json({ error: "缺少操作" }, { status: 400 });
        const t = await resolveTenant(request);
        // 操作记录记的是「改动」，所以只有能改东西的成员才允许写（只读账号不能伪造/灌水记录）。
        // 用 ledger.write 而不是新造一个权限位：canWriteLedger 已覆盖各类 *.edit / import.use。
        return withTenant(
          request,
          async () => {
            try {
              const entry = await appendAudit({
                userId: t.user?.id || "",
                userName: t.user?.name || t.user?.username || "",
                action: body.action!.trim().slice(0, 80),
                detail: String(body.detail || "").slice(0, 400),
                module: String(body.module || "").slice(0, 40),
              });
              return Response.json({ ok: true, entry });
            } catch (err) {
              // 审计写不进去必须留痕并明确告知，不能让客户端以为记上了
              await logServer("error", "操作记录写入失败", { action: body.action, error: String(err) });
              return Response.json({ error: "操作记录写入失败，请检查 data 目录权限" }, { status: 500 });
            }
          },
          "ledger.write",
        );
      },
      PUT: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        if ((await resolveTenant(request)).user?.role !== "admin")
          return Response.json({ error: "只有管理员能改操作记录" }, { status: 403 });
        const body = (await request.json()) as { id?: string; action?: string; detail?: string; module?: string };
        if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
        return withTenant(request, async () => {
          const list = await readAudit();
          // 读空 + 要改一条已存在的记录 = 大概率是读取失败，绝不能拿空列表覆盖整个文件
          if (!list.length)
            return Response.json({ error: "读取操作记录失败，已拒绝写入（避免清空历史）" }, { status: 409 });
          const next = list.map((e) =>
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
          if (!list.length)
            return Response.json({ error: "读取操作记录失败，已拒绝写入（避免清空历史）" }, { status: 409 });
          await writeAudit(list.filter((e) => !ids.includes(e.id)));
          return Response.json({ ok: true });
        });
      },
    },
  },
});
