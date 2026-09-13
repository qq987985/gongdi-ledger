/** 一键更新模块共享常量（原 update.server.ts 头部）。 */
export const REPO = (process.env.UPDATE_REPO || "qq987985/gongdi-ledger").trim();
export const DEFAULT_IMAGE = (process.env.GONGDI_IMAGE || "ghcr.1ms.run/qq987985/gongdi-ledger:latest").trim();
export const SOCK = "/var/run/docker.sock";
export const HELPER_NAME = "gongdi-updater"; // 专门跑替换容器的临时容器名
