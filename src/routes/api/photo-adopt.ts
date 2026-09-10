import { createFileRoute } from "@tanstack/react-router";
import { adoptLegacyAssets, persistOn } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

/**
 * 把历史遗留（全局）影像目录里的照片/文档，按本台账的人员姓名与影像 id
 * 复制进本台账自己的影像目录（只复制、不删除、不覆盖）。
 * 涉及照片与文档两类，所以两个权限都要。
 */
export const Route = createFileRoute("/api/photo-adopt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
        return withTenant(request, async () => Response.json({ ok: true, ...(await adoptLegacyAssets()) }), [
          "photos.edit",
          "files.edit",
        ]);
      },
    },
  },
});
