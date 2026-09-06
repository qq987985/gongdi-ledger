import { createFileRoute } from "@tanstack/react-router";
import { checkUpdate, applyUpdate, isPortable } from "~/lib/update.server";
import { resolveTenant } from "~/lib/accounts.server";

/** 同源校验：请求带有 Origin 且与本站不同源时拒绝（防跨站触发更新） */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin") || request.headers.get("referer");
  if (!origin) return true; // 无浏览器上下文（脚本）时依赖登录态
  try {
    const o = new URL(origin);
    const host = request.headers.get("host") || "";
    return o.host === host;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/update")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const fresh = new URL(request.url).searchParams.has("fresh");
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
          if (!sameOrigin(request))
            return Response.json({ error: "来源不一致，已拒绝" }, { status: 403 });
          const t = await resolveTenant(request);
          if (!t.user) return Response.json({ error: "请先登录" }, { status: 401 });
          if (t.user.role !== "admin") return Response.json({ error: "只有管理员能更新" }, { status: 403 });
          const result = await applyUpdate();
          return Response.json(result, { status: result.ok ? 200 : 400 });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "更新失败" }, { status: 500 });
        }
      },
    },
  },
});
