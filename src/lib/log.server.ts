/**
 * 服务端统一日志（D 项 + 可观测性补齐）。
 *
 * 为什么要它：这个项目原来服务端有 18 处 `catch {}`、全库 0 处日志——
 * 写盘失败、台账/账户库解析失败、权限拒绝、CAS 冲突全被吞掉，用户只看到一句 toast，
 * 事后**没有任何地方能查**。这里提供一个最小的落盘 + stdout 日志：
 *
 * - 同时写 `data/logs/YYYY-MM-DD.log`（NAS 上直接打开就能看）和 stdout（docker logs 能收）
 * - 内部串行追加，避免并发写交错；自身失败绝不抛出（日志不能拖垮业务）
 * - 只记「值得事后查」的事件：错误、警告、安全拒绝、冲突、重要维护动作
 *
 * **1.8.14 起本文件只是薄封装**：级别 / 保留期 / 单文件上限 / 滚动 / 慢请求门槛的**唯一实现**
 * 在 `scripts/log-core.mjs`（生产启动器 `scripts/app-server-index.mjs` 也 import 同一份）。
 * 抽出去的原因：两边各写一套时已经在「到上限怎么办」上分叉 —— 应用侧 1.8.4 起**滚动**
 * `YYYY-MM-DD.log.N`，启动器却**停写当天文件**且不认 `.log.N`（不受保留策略管辖），
 * 于是「撞上限后当天还剩什么」取决于谁先撞，与文档写的「不再停写」冲突。
 * 本文件负责的只有：读 `DATA_DIR`、stdout、进程内串行化。**改语义去 log-core.mjs 改。**
 *
 * 四个环境变量（全部有安全默认值，语义见 log-core.mjs 顶部注释）：
 * `LOG_LEVEL`（默认 `info`）、`LOG_KEEP_DAYS`（默认 `14`，`update.log` 永不在删除范围）、
 * `LOG_MAX_MB`（默认 `8`，超了滚动不停写）、`SLOW_MS`（默认 `2000`，**必须为正数**）。
 *
 * 纯函数（级别 / 保留窗口 / 哪些文件名可删 / 该不该清理 / 下一个滚动编号）从 log-core 原样再导出，
 * 见 tests/log-server.test.ts；启动器那条路的回归见 tests/launcher-log.test.ts。
 */
import { join } from "node:path";
import {
  DEFAULT_LOG_KEEP_DAYS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_MAX_MB,
  DEFAULT_SLOW_MS,
  LOG_LEVELS,
  PROTECTED_LOG_FILES,
  enqueueLogLine,
  formatLogLine,
  isExpiredLogFile,
  isManagedLogFile,
  logRetentionCutoff,
  needsDailyCleanup,
  nextRotationName,
  parseKeepDays,
  parseLogLevel,
  parseMaxMb,
  parseSlowMs,
  selectExpiredLogs,
  shouldLog,
  stdoutLog,
  type LogLevel,
} from "../../scripts/log-core.mjs";

export type { LogLevel };

export {
  LOG_LEVELS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_KEEP_DAYS,
  DEFAULT_LOG_MAX_MB,
  DEFAULT_SLOW_MS,
  PROTECTED_LOG_FILES,
  parseLogLevel,
  shouldLog,
  parseKeepDays,
  parseMaxMb,
  parseSlowMs,
  logRetentionCutoff,
  isManagedLogFile,
  isExpiredLogFile,
  selectExpiredLogs,
  needsDailyCleanup,
  nextRotationName,
};

function logsDir(): string {
  const root = process.env.DATA_DIR?.trim();
  return root ? join(root, "logs") : "";
}

/** 记一条服务端日志。绝不抛出。签名保持 `(level, event, detail)` 不变。 */
export function logServer(level: LogLevel, event: string, detail: Record<string, unknown> = {}): Promise<void> {
  if (!shouldLog(level, parseLogLevel(process.env.LOG_LEVEL))) return Promise.resolve();
  const line = formatLogLine(level, event, detail);
  stdoutLog(level, line);
  const dir = logsDir();
  if (!dir) return Promise.resolve();
  return enqueueLogLine(dir, line);
}
