import { createFileRoute } from "@tanstack/react-router";
import { persistOn } from "~/lib/paths.server";
import { ledgerGzipEnabled } from "~/lib/ledger-transfer";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      // ledgerGzip：客户端据此决定上行要不要压缩（LEDGER_GZIP=off 时不压；下行由服务端自己决定）
      GET: async () => Response.json({ persist: persistOn(), ok: true, ledgerGzip: ledgerGzipEnabled() }),
    },
  },
});
