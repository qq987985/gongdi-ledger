import { createFileRoute } from "@tanstack/react-router";
import { chatCompletion, streamChatCompletion } from "./volcano-chat";
import { isVolcanoConfigValid } from "~/lib/volcano";

export const Route = createFileRoute("/api/volcano-chat-route")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 检查配置
        if (!isVolcanoConfigValid()) {
          return Response.json(
            { error: "火山引擎 API 未配置，请检查 .env 文件" },
            { status: 500 }
          );
        }

        try {
          const body = await request.json();
          const { messages, stream = false, temperature, max_tokens } = body;

          if (!messages || !Array.isArray(messages)) {
            return Response.json(
              { error: "缺少 messages 参数" },
              { status: 400 }
            );
          }

          // 流式响应
          if (stream) {
            const encoder = new TextEncoder();
            const readable = new ReadableStream({
              async start(controller) {
                try {
                  for await (const chunk of streamChatCompletion({
                    messages,
                    temperature,
                    max_tokens,
                  })) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
                    );
                  }
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                } catch (error) {
                  controller.error(error);
                }
              },
            });

            return new Response(readable, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }

          // 普通响应
          const response = await chatCompletion({
            messages,
            temperature,
            max_tokens,
          });

          return Response.json(response);
        } catch (error) {
          console.error("火山引擎 API 调用错误:", error);
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "调用火山引擎 API 失败",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});
