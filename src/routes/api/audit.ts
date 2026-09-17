import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";
import { appendAudit, auditUnreadable, readAudit, writeAudit } from "~/lib/nas-fs.server";
import { logServer } from "~/lib/log.server";
import { resolveTenant, auditTenantDelete, withTenant } from "~/lib/accounts.server";

export const Route = createFileRoute("/api/audit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!persistOn()) return Response.json({ entries: [] });
        return withTenant(request, async () => Response.json({ entries: await readAudit() }), "audit.view");
      },
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        let body: { action?: string; detail?: string; module?: string };
        try {
          body = (await request.json()) as { action?: string; detail?: string; module?: string };
        } catch {
          return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
        }
        if (!body.action?.trim()) return Response.json({ error: "缺少操作" }, { status: 400 });
        const t = await resolveTenant(request);
        // 操作记录记的是「改动」，所以只有能改东西的成员才允许写（只读账号不能伪造/灌水记录）。
        // 用 ledger.write 而不是新造一个权限位：canWriteLedger 已覆盖各类 *.edit / import.use。
        return withTenant(
          request,
          async () => {
            // 文件在但读不出来（损坏/权限）：绝不能拿空列表覆盖历史（PUT/DELETE 早有这个保护，POST 原来漏了）
            await readAudit();
            if (auditUnreadable())
              return Response.json(
                { error: "操作记录文件读取失败，已拒绝写入以免覆盖历史。请从 data/backups 恢复该文件。", corrupt: true },
                { status: 503 },
              );
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
        let body: { id?: string; action?: string; detail?: string; module?: string };
        try {
          body = (await request.json()) as { id?: string; action?: string; detail?: string; module?: string };
        } catch {
          return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
        }
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
        return withTenant(request, async (t) => {
          const list = await readAudit();
          if (!list.length)
            return Response.json({ error: "读取操作记录失败，已拒绝写入（避免清空历史）" }, { status: 409 });
          const doomed = list.filter((e) => ids.includes(e.id));
          // A5（1.8.14）：删记录这件事本身必须先留痕（谁删了、删了几条、哪些 id），
          // 而且这条留痕不能被同一次请求删掉 —— 先 appendAudit 写进文件，再重新读一遍列表做过滤；
          // 新记录的 id 是服务端刚生成的、不在用户传来的 ids 里。
          await auditTenantDelete(t, {
            action: "删除操作记录",
            module: "审计",
            detail: `删除 ${doomed.length} 条：${doomed
              .map((e) => e.id)
              .join(",")
              .slice(0, 280)}`,
          });
          const after = await readAudit();
          await writeAudit(after.filter((e) => !ids.includes(e.id)));
          return Response.json({ ok: true, removed: doomed.length });
        });
      },
    },
  },
});
