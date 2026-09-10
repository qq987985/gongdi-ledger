import { createFileRoute } from "@tanstack/react-router";
import { checkSameOrigin, checkUpdate, isPortable, startUpdateJob, updateJobStatus } from "~/lib/update.server";
import { resolveTenant } from "~/lib/accounts.server";
import { persistOn } from "~/lib/nas-fs.server";
import { logServer } from "~/lib/log.server";

export const Route = createFileRoute("/api/update")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          // 已开启账户时需登录才能查询/触发外联，避免未登录者反复打 GitHub
          const t = await resolveTenant(request);
          if (persistOn() && !t.user)
            return Response.json({ portable: false, error: "请先登录" }, { status: 401 });
          const url = new URL(request.url);
          // 只查后台更新任务的进度（前端轮询用），不去打 GitHub
          if (url.searchParams.has("status")) return Response.json({ status: updateJobStatus() });
          const info = await checkUpdate(url.searchParams.has("fresh"));
          return Response.json({ ...info, portable: isPortable(), status: updateJobStatus() });
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
          if (!checkSameOrigin(request.headers)) {
            await logServer("warn", "更新请求被同源校验拒绝", {
              origin: request.headers.get("origin") || request.headers.get("referer") || "",
              host: request.headers.get("host") || "",
              forwardedHost: request.headers.get("x-forwarded-host") || "",
            });
            return Response.json(
              { error: "来源不一致，已拒绝。若通过反向代理访问，请让代理透传 Host（或设置 X-Forwarded-Host）。" },
              { status: 403 },
            );
          }
          const t = await resolveTenant(request);
          if (!t.user) return Response.json({ error: "请先登录" }, { status: 401 });
          if (t.user.role !== "admin") return Response.json({ error: "只有管理员能更新" }, { status: 403 });
          // 立刻返回、后台执行：反代（nginx 默认 60s）会掐断长请求，同步等待就会变成
          // 「更新失败」而实际还在拉镜像。进度用 GET /api/update?status=1 轮询。
          const status = startUpdateJob();
          return Response.json({ ok: true, started: true, accepted: true, status });
        } catch (e) {
          // 错误信息不能是空的：客户端把空 error 显示成没头没脑的「更新失败」，看不出原因
          const msg =
            e instanceof Error && e.message
              ? e.message
              : "更新过程出错（详情见 data/logs/ 或 data/.gongdi-update-error.txt）";
          await logServer("error", "一键更新异常", { error: msg });
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
