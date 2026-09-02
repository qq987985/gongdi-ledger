import { createFileRoute } from "@tanstack/react-router";
import { isVolcanoConfigValid, VOLCANO_CONFIG } from "~/lib/volcano";

export const Route = createFileRoute("/api/volcano-health")({
  server: {
    handlers: {
      GET: async () => {
        const configValid = isVolcanoConfigValid();

        return Response.json({
          ok: configValid,
          configured: configValid,
          region: VOLCANO_CONFIG.region,
          baseUrl: VOLCANO_CONFIG.baseUrl,
          model: VOLCANO_CONFIG.model,
          apiKeyPrefix: VOLCANO_CONFIG.apiKey
            ? VOLCANO_CONFIG.apiKey.substring(0, 10) + "..."
            : null,
          message: configValid
            ? "火山引擎配置正常"
            : "火山引擎配置不完整，请检查 .env 文件",
        });
      },
    },
  },
});
