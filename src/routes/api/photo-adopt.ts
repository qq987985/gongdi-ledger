import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";
import { adoptLegacyAssets } from "~/lib/assets.server";
import { ledgerUnreadable, readLedger } from "~/lib/nas-fs.server";
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
        return withTenant(request, async () => {
          // 台账由调用方读出传入：影像层不依赖台账存储；坏台账跳过而不是当成「无影像」
          const led = await readLedger();
          if (ledgerUnreadable(led)) return Response.json({ error: "台账不可读" }, { status: 500 });
          return Response.json({ ok: true, ...(await adoptLegacyAssets(led)) });
        }, [
          "photos.edit",
          "files.edit",
        ]);
      },
    },
  },
});
