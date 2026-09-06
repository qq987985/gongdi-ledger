import { createFileRoute } from "@tanstack/react-router";
import { persistOn, saveBackup } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";

export const Route = createFileRoute("/api/backup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        // 读 body 前先检查：备份 50MB 上限，且需导出/写入权限，防止任意成员覆盖最新备份
        const len = Number(request.headers.get("content-length") || 0);
        if (len > 50 * 1024 * 1024) return Response.json({ error: "备份太大" }, { status: 413 });
        const buf = Buffer.from(await request.arrayBuffer());
        if (buf.length > 50 * 1024 * 1024) return Response.json({ error: "备份太大" }, { status: 413 });
        return withTenant(
          request,
          async () => {
            const stamp = new Date();
            const pad = (n: number) => String(n).padStart(2, "0");
            const fname = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}_考勤表.xlsx`;
            const path = await saveBackup(buf, fname);
            return Response.json({ ok: true, filename: fname, path });
          },
          "export.use",
        );
      },
    },
  },
});
