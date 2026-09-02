import { createFileRoute } from "@tanstack/react-router";
import { readVersionText } from "~/lib/nas-fs.server";
import { parseChangelog } from "~/lib/changelog";

export const Route = createFileRoute("/api/version")({
  server: {
    handlers: {
      GET: async () => {
        const text = await readVersionText();
        return Response.json(parseChangelog(text || "1.0.2\n\n[1.0.2]\n左下角点版本号查看更新记录"));
      },
    },
  },
});
