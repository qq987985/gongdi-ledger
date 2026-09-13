import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => Response.json({ persist: persistOn(), ok: true }),
    },
  },
});
