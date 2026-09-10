import { createFileRoute } from "@tanstack/react-router";
import { resolveTenant } from "~/lib/accounts.server";
import { persistOn } from "~/lib/nas-fs.server";
import { readUpdateLog } from "~/lib/update.server";

/**
 * 把「一键更新」的现场日志读回界面（只读）。
 *
 * 为什么加它：更新失败时日志只留在 NAS 的 data/logs/update.log 和
 * data/.gongdi-update-error.txt 里，用户得开文件管理器一层层点进去才能看到原因。
 * 界面上点一下「查看更新日志」就能看到，省掉这一趟。
 * 权限口径和触发更新一致：登录 + 管理员。
 */
export const Route = createFileRoute("/api/update-log")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const t = await resolveTenant(request);
        if (persistOn() && !t.user) return Response.json({ error: "请先登录" }, { status: 401 });
        if (persistOn() && t.user?.role !== "admin")
          return Response.json({ error: "只有管理员能看更新日志" }, { status: 403 });
        return Response.json({ ok: true, ...(await readUpdateLog()) });
      },
    },
  },
});
