import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";
import { saveBackup } from "~/lib/nas-fs.server";
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
        // 空 body（0 字节）不能当备份写：saveBackup 会把它同时写成
        // `backups/<时间戳>_考勤表.xlsx` 和**固定名** `backups/考勤表.xlsx`（「最新备份」入口），
        // 于是一次失败的请求会把用户手上唯一的「最新备份」清成 0 字节。这里在写盘前拒掉。
        if (buf.length === 0) {
          return Response.json(
            { error: "备份内容为空（0 字节），已拒绝写入，现有备份未被改动", invalid: true },
            { status: 400 },
          );
        }
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
