import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";
import { saveBackup } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";
import { backupRejectReason } from "~/lib/backup-check";

export const Route = createFileRoute("/api/backup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
        // A4（1.8.14）：鉴权在读 body **之前** —— 原来先 `arrayBuffer()` 把最多 50MB 读进内存再
        // withTenant，未登录的人可以反复灌内存（CWE-770/400）。权限位（export.use）与 4xx 语义不变。
        return withTenant(
          request,
          async () => {
            // 备份 50MB 上限：这个口子能覆盖「最新备份」，体积和权限都要卡
            const len = Number(request.headers.get("content-length") || 0);
            if (len > 50 * 1024 * 1024) return Response.json({ error: "备份太大" }, { status: 413 });
            const buf = Buffer.from(await request.arrayBuffer());
            if (buf.length > 50 * 1024 * 1024) return Response.json({ error: "备份太大" }, { status: 413 });
            // 空 body（0 字节）不能当备份写：saveBackup 会把它同时写成
            // `backups/<时间戳>_考勤表.xlsx` 和**固定名** `backups/考勤表.xlsx`（「最新备份」入口），
            // 于是一次失败的请求会把用户手上唯一的「最新备份」清成 0 字节。这里在写盘前拒掉。
            // B-12③（1.8.14）：非 0 字节的**垃圾内容**同样会毁掉最新备份（一段 JSON / HTML 错误页 /
            // 传输中断被截断的 xlsx），所以 0 字节之外还要判「像不像 xlsx」——
            // 判据是纯函数 `backupRejectReason()`（src/lib/backup-check.ts，带单测）。
            const bad = backupRejectReason(buf);
            if (bad) {
              return Response.json(
                { error: `${bad}，已拒绝写入，现有备份未被改动`, invalid: true },
                { status: 400 },
              );
            }
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
