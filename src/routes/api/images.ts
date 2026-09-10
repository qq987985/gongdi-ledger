import { createFileRoute } from "@tanstack/react-router";
import { hasDockerSock, listLocalImages, pruneLocalImages, checkSameOrigin } from "~/lib/update.server";
import { resolveTenant } from "~/lib/accounts.server";
import { persistOn } from "~/lib/nas-fs.server";
import { logServer } from "~/lib/log.server";

/**
 * 本地镜像体检与清理（只针对本项目自己的镜像）。
 *
 * 为什么需要它：每次「一键更新」都会拉一份新镜像，旧镜像留在 NAS 的 Docker 里，
 * 越积越多（一份几百 MB）。更新流程本身现在会自动删掉上一个版本（见 UPDATER_SCRIPT），
 * 这里再给一个手动入口，把历史上积攒的那几份一次清掉。
 *
 * 安全边界（`pickRemovableImages`）：只删名字里带 gongdi-ledger 的镜像，
 * 且必须「不是当前镜像、没有被任何容器引用」——不会动到 NAS 上其它容器的镜像。
 */
export const Route = createFileRoute("/api/images")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const t = await resolveTenant(request);
        if (persistOn() && !t.user) return Response.json({ error: "请先登录" }, { status: 401 });
        if (persistOn() && t.user?.role !== "admin") return Response.json({ error: "只有管理员能清理镜像" }, { status: 403 });
        if (!(await hasDockerSock()))
          return Response.json({ ok: true, available: false, images: [], removable: [], totalBytes: 0, note: "本机没有挂载 docker.sock，无法清理" });
        try {
          const r = await listLocalImages();
          return Response.json({ ok: true, available: true, ...r });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "读取镜像列表失败" }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        if (!checkSameOrigin(request.headers)) return Response.json({ error: "来源不一致，已拒绝" }, { status: 403 });
        const t = await resolveTenant(request);
        if (persistOn() && !t.user) return Response.json({ error: "请先登录" }, { status: 401 });
        if (persistOn() && t.user?.role !== "admin") return Response.json({ error: "只有管理员能清理镜像" }, { status: 403 });
        if (!(await hasDockerSock()))
          return Response.json({ error: "本机没有挂载 docker.sock，无法清理" }, { status: 400 });
        try {
          const r = await pruneLocalImages();
          return Response.json({ ok: true, count: r.removed.length, freed: r.freed, errors: r.errors });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "清理失败";
          await logServer("error", "清理旧镜像异常", { error: msg });
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
