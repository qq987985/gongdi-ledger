import { VOLCANO_CONFIG, getVolcanoHeaders, VOLCANO_ENDPOINTS } from "../../lib/volcano";

/**
 * 火山引擎 DeepSeek API 调用示例
 * 用于服务端 API 路由
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 发送聊天请求到火山引擎 DeepSeek
 */
export async function chatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const response = await fetch(VOLCANO_ENDPOINTS.chat, {
    method: "POST",
    headers: getVolcanoHeaders(),
    body: JSON.stringify({
      model: request.model || VOLCANO_CONFIG.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2048,
      stream: request.stream ?? false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`火山引擎 API 错误: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * 简单的流式聊天请求
 */
export async function* streamChatCompletion(
  request: ChatCompletionRequest
): AsyncGenerator<string> {
  const response = await fetch(VOLCANO_ENDPOINTS.chat, {
    method: "POST",
    headers: getVolcanoHeaders(),
    body: JSON.stringify({
      model: request.model || VOLCANO_CONFIG.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2048,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`火山引擎 API 错误: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
