/**
 * `scripts/log-core.mjs` 的类型声明（该文件是纯 JS，为了让启动器也能直接 import 才不写成 TS）。
 *
 * 只声明签名，不含任何逻辑：级别 / 保留期 / 单文件上限 / 滚动 / 慢请求门槛的**唯一实现**
 * 在 `scripts/log-core.mjs` 里，改行为改那一处。
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogEnv = Record<string, string | undefined>;

export const LOG_LEVELS: readonly LogLevel[];
export const DEFAULT_LOG_LEVEL: LogLevel;
export const DEFAULT_LOG_KEEP_DAYS: number;
export const DEFAULT_LOG_MAX_MB: number;
export const DEFAULT_SLOW_MS: number;
export const PROTECTED_LOG_FILES: readonly string[];

export function parseLogLevel(raw: unknown): LogLevel;
export function shouldLog(level: unknown, min?: unknown): boolean;
export function parseKeepDays(raw: unknown): number;
export function parseMaxMb(raw: unknown): number;
export function parseSlowMs(raw: unknown): number;
export function dayString(d: Date): string;
export function logRetentionCutoff(now: Date, keepDays?: number): string;
export function isManagedLogFile(name: unknown): boolean;
export function isExpiredLogFile(name: unknown, now: Date, keepDays?: number): boolean;
export function selectExpiredLogs(names: readonly unknown[], now: Date, keepDays?: number): string[];
export function needsDailyCleanup(lastCleanupDay: string | null | undefined, today: string): boolean;
export function nextRotationName(day: string, existingNames: readonly unknown[] | undefined): string;
export function logMaxBytes(env?: LogEnv): number;
export function formatLogLine(level: LogLevel, event: string, detail?: Record<string, unknown>, now?: Date): string;
export function stdoutLog(level: LogLevel, line: string): void;
export function pruneOldLogs(dir: string, env?: LogEnv, now?: Date): Promise<void>;
export function writeLogLine(dir: string, line: string, opts?: { env?: LogEnv; now?: Date }): Promise<void>;
export function enqueueLogLine(dir: string, line: string, opts?: { env?: LogEnv; now?: Date }): Promise<void>;
export function flushLogs(): Promise<void>;
