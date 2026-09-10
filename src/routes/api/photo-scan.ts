import { createFileRoute } from "@tanstack/react-router";
import { ledgerUnreadable, persistOn, readLedger, scanPhotoFolder } from "~/lib/nas-fs.server";
import { withTenant, type NeedSpec } from "~/lib/accounts.server";

/** 一次最多扫描多少个姓名：photoFlags 对每个姓名 × 4 类 × 约 10 个目录做匹配，无上限会被一个请求打满单线程 */
const MAX_NAMES = 500;

export const Route = createFileRoute("/api/photo-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
        const body = await request.json().catch(() => ({}));
        const given: string[] = Array.isArray(body.names) ? body.names.map(String).filter(Boolean).slice(0, MAX_NAMES) : [];
        // 不给名单时要读全量台账取人员姓名，那就必须同时有 people.view（否则等于用低权限拿到全员名单）
        const need: NeedSpec = given.length ? "photos.view" : ["photos.view", "people.view"];
        return withTenant(
          request,
          async () => {
            let names = given;
            if (!names.length) {
              const led = await readLedger();
              if (ledgerUnreadable(led)) return Response.json({ error: "台账文件读取失败" }, { status: 503 });
              names = (Array.isArray(led.people) ? led.people : [])
                .map((p: { name?: string }) => String(p.name || "").trim())
                .filter(Boolean)
                .slice(0, MAX_NAMES);
            }
            return Response.json(await scanPhotoFolder(names));
          },
          need,
        );
      },
    },
  },
});
