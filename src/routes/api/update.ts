import { createFileRoute } from "@tanstack/react-router";
import { checkUpdate, applyUpdate, isPortable } from "~/lib/update.server";
import { resolveTenant } from "~/lib/accounts.server";

export const Route = createFileRoute("/api/update")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          if (url.searchParams.has("apply")) {
            if (!(await resolveTenant(request)).user) return Response.json({ error: "请先登录" }, { status: 401 });
            const result = await applyUpdate();
            return Response.json(result, { status: result.ok ? 200 : 400 });
          }
          const fresh = url.searchParams.has("fresh");
          const info = await checkUpdate(fresh);
          return Response.json({ ...info, portable: isPortable() });
        } catch (e) {
          return Response.json({ portable: false, error: e instanceof Error ? e.message : "检查失败" }, { status: 200 });
        }
      },
      POST: async ({ request }) => {
        try {
          try {
            await request.json();
          } catch {
            /* body 为空或非 JSON 时忽略 */
          }
          if (!(await resolveTenant(request)).user) return Response.json({ error: "请先登录" }, { status: 401 });
          const result = await applyUpdate();
          return Response.json(result, { status: result.ok ? 200 : 400 });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "更新失败" }, { status: 500 });
        }
      },
    },
  },
});
