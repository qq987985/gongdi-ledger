/**
 * 火山引擎 API 配置
 * 用于 DeepSeek Harness 的火山方舟大模型服务
 */

// 从环境变量读取配置
function getEnv(key: string): string | undefined {
  // 服务端环境
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  // 客户端环境 (Vite)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
}

export const VOLCANO_CONFIG = {
  // API 认证
  apiKey: getEnv("VOLCANO_API_KEY") || "",
  apiSecret: getEnv("VOLCANO_API_SECRET") || "",

  // 服务配置
  baseUrl:
    getEnv("VOLCANO_BASE_URL") ||
    "https://ark.cn-beijing.volces.com/api/v3",
  region: getEnv("VOLCANO_REGION") || "cn-beijing",

  // 模型配置
  model:
    getEnv("VOLCANO_MODEL") ||
    "deepseek-r1-250120",
} as const;

/**
 * 检查配置是否完整
 */
export function isVolcanoConfigValid(): boolean {
  return !!VOLCANO_CONFIG.apiKey && !!VOLCANO_CONFIG.apiSecret;
}

/**
 * 获取请求头
 */
export function getVolcanoHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${VOLCANO_CONFIG.apiKey}`,
  };
}

/**
 * 火山引擎 API 端点
 */
export const VOLCANO_ENDPOINTS = {
  // 聊天/补全
  chat: `${VOLCANO_CONFIG.baseUrl}/chat/completions`,
  // 模型列表
  models: `${VOLCANO_CONFIG.baseUrl}/models`,
} as const;
