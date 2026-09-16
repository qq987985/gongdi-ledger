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
 * 1.8.1 补齐四个可观测性开关（全部走环境变量，都有安全默认值）：
 * - `LOG_LEVEL=debug|info|warn|error`（默认 `info`）：低于该级别的事件**既不写文件也不打 stdout**；
 * - `LOG_KEEP_DAYS`（默认 `14`）：`data/logs/` 只保留最近 N 天，且只删 `YYYY-MM-DD.log`，
 *   **绝不删 `update.log`**（更新日志是用户排查「一键更新失败」的入口）；
 * - `LOG_MAX_MB`（默认 `8`）：某天日志超过上限就停止写当天文件，并打一条 stdout 提示（防撑爆 NAS）；
 * - 清理**不在每次写的热路径上扫目录**：每进程首次写（等价「启动时一次」）+ 每天首次写各跑一次。
 *
 * 级别 / 保留期 / 该不该清理 / 哪些文件名可删，全部抽成纯函数并导出，见 tests/log-server.test.ts。
 */
import { appendFile, mkdir, readdir, stat, unlink } from "node:fs/promises";
import { join } from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

/** 级别由低到高。LOG_LEVEL 取其中一档，低于它的事件整体丢弃。 */
export const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

export const DEFAULT_LOG_LEVEL: LogLevel = "info";
export const DEFAULT_LOG_KEEP_DAYS = 14;
export const DEFAULT_LOG_MAX_MB = 8;

/** 受管日志文件名：只认 `YYYY-MM-DD.log`。`update.log`、`x.log.1`、`2026-9-1.log` 都不算。 */
const DATED_LOG_RE = /^\d{4}-\d{2}-\d{2}\.log$/;
/** 永不删除的日志文件（更新日志是用户排查「一键更新失败」的入口，不能被保留策略清掉）。 */
export const PROTECTED_LOG_FILES: readonly string[] = ["update.log"];

/** 保留天数上限 / 单文件上限（MB），防止环境变量写错把 NAS 撑爆或删空。 */
const MAX_KEEP_DAYS = 3650;
const MAX_LOG_MB = 10240;

// ───────────────────────────── 纯函数（可单测） ─────────────────────────────

/** 级别解析：大小写/空白容忍，非法值（含 undefined、空串、乱写）回落到默认 `info`。 */
export function parseLogLevel(raw: unknown): LogLevel {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (LOG_LEVELS as readonly string[]).includes(v) ? (v as LogLevel) : DEFAULT_LOG_LEVEL;
}

function levelRank(raw: unknown): number {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (LOG_LEVELS as readonly string[]).indexOf(v);
}

/**
 * 该不该记：`level` 低于 `min` 一律丢弃。
 * - 未知的 `level` → false（不认识的事件宁可不记，也不猜级别）；
 * - 未知的 `min` → 按默认 `info` 处理（环境变量写错不该让日志全静音）。
 */
export function shouldLog(level: unknown, min: unknown = DEFAULT_LOG_LEVEL): boolean {
  const l = levelRank(level);
  if (l < 0) return false;
  const m = levelRank(min);
  return l >= (m < 0 ? levelRank(DEFAULT_LOG_LEVEL) : m);
}

function parsePositiveNumber(raw: unknown, fallback: number, max: number): number {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

/** LOG_KEEP_DAYS 解析：非法（空/非数字/0/负数/NaN/Infinity）走默认 14；小于 1 的小数也走默认。 */
export function parseKeepDays(raw: unknown): number {
  const n = Math.floor(parsePositiveNumber(raw, DEFAULT_LOG_KEEP_DAYS, MAX_KEEP_DAYS));
  return n >= 1 ? n : DEFAULT_LOG_KEEP_DAYS;
}

/** LOG_MAX_MB 解析：非法走默认 8；允许小数（测试里用 0.0005 造「小文件」）。 */
export function parseMaxMb(raw: unknown): number {
  return parsePositiveNumber(raw, DEFAULT_LOG_MAX_MB, MAX_LOG_MB);
}

function dayString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * 保留窗口的第一天（含）：`now` 当天算第 1 天，回退 keepDays-1 天。
 * 也就是 keepDays=14 表示「今天 + 往前 13 天」共 14 个文件；比这更早的日期日志算过期。
 * 正好落在 cutoff 当天的文件**保留**（边界：当天是窗口内的第 N 天）。
 */
export function logRetentionCutoff(now: Date, keepDays: number = DEFAULT_LOG_KEEP_DAYS): string {
  const days = Number.isFinite(keepDays) && Math.floor(keepDays) >= 1 ? Math.floor(keepDays) : DEFAULT_LOG_KEEP_DAYS;
  const base = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return dayString(d);
}

/** 是不是「受管的日期日志文件」：只有 `YYYY-MM-DD.log`，且不在保护名单里（update.log）。 */
export function isManagedLogFile(name: unknown): boolean {
  if (typeof name !== "string") return false;
  if (PROTECTED_LOG_FILES.includes(name)) return false;
  return DATED_LOG_RE.test(name);
}

/**
 * 是否过期（可删）：文件名合规 + 日期早于保留窗口第一天。
 * 认不出日期的名字（如 `9999-99-99.log`）一律**不删**——宁可留一个怪文件，也不误删。
 */
export function isExpiredLogFile(name: unknown, now: Date, keepDays: number = DEFAULT_LOG_KEEP_DAYS): boolean {
  if (!isManagedLogFile(name)) return false;
  const day = String(name).slice(0, 10);
  if (!Number.isFinite(Date.parse(`${day}T00:00:00.000Z`))) return false;
  // ISO 日期串的字典序 === 时间序
  return day < logRetentionCutoff(now, keepDays);
}

/** 从目录里的文件名列表中挑出该删的（纯函数，不碰文件系统）。 */
export function selectExpiredLogs(
  names: readonly unknown[],
  now: Date,
  keepDays: number = DEFAULT_LOG_KEEP_DAYS,
): string[] {
  return names.filter((n): n is string => isExpiredLogFile(n, now, keepDays));
}

/** 是否需要跑一次清理：进程启动后的第一次写入（lastCleanupDay=null），或跨天后的第一次写入。 */
export function needsDailyCleanup(lastCleanupDay: string | null | undefined, today: string): boolean {
  return lastCleanupDay !== today;
}

// ───────────────────────────── 落盘实现（非纯） ─────────────────────────────

function logsDir(): string {
  const root = process.env.DATA_DIR?.trim();
  return root ? join(root, "logs") : "";
}

/** 每个「目录 + 当天」一份状态：避免每次写都 stat、每次写都扫目录。 */
type DirDayState = {
  dir: string;
  day: string;
  bytes: number;
  lastCleanupDay: string | null;
  cappedNotified: boolean;
};

let state: DirDayState = { dir: "", day: "", bytes: -1, lastCleanupDay: null, cappedNotified: false };

function stateFor(dir: string, today: string): DirDayState {
  if (state.dir !== dir || state.day !== today) {
    // 换目录（等价「进程启动」）或跨天：重置缓存，顺带让首次写入触发一次清理
    state = { dir, day: today, bytes: -1, lastCleanupDay: null, cappedNotified: false };
  }
  return state;
}

let queue: Promise<void> = Promise.resolve();

function currentLevel(): LogLevel {
  return parseLogLevel(process.env.LOG_LEVEL);
}

function currentMaxBytes(): number {
  return Math.floor(parseMaxMb(process.env.LOG_MAX_MB) * 1024 * 1024);
}

/** 删掉过期的 `YYYY-MM-DD.log`。只删文件（目录/软链不算），单个失败不影响其它。 */
async function pruneOldLogs(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const names = entries.filter((e) => e.isFile()).map((e) => e.name);
    for (const name of selectExpiredLogs(names, new Date(), parseKeepDays(process.env.LOG_KEEP_DAYS))) {
      try {
        await unlink(join(dir, name));
      } catch {
        /* 被别的进程删了 / 权限不足：跳过 */
      }
    }
  } catch {
    /* 目录还不存在或读不到：忽略 */
  }
}

async function writeLine(dir: string, line: string): Promise<void> {
  const now = new Date();
  const today = dayString(now);
  const st = stateFor(dir, today);
  // 清理只在这里触发（O(1) 判断），不在每次写的热路径上扫目录
  if (needsDailyCleanup(st.lastCleanupDay, today)) {
    st.lastCleanupDay = today;
    await pruneOldLogs(dir);
  }
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${today}.log`);
  const size = Buffer.byteLength(line, "utf8") + 1;
  const max = currentMaxBytes();
  if (st.bytes < 0) {
    try {
      st.bytes = (await stat(file)).size;
    } catch {
      st.bytes = 0;
    }
  }
  if (st.bytes + size > max) {
    // 单文件上限：停止写当天文件（不轮转出 .log.1——那会在 NAS 上再堆一份没人清的日志）
    // 这条提示是保险丝，不随 LOG_LEVEL 静音（否则文件被撑满时一点痕迹都没有）
    if (!st.cappedNotified) {
      st.cappedNotified = true;
      try {
        console.warn(
          JSON.stringify({
            at: now.toISOString(),
            level: "warn",
            event: "当天日志已达上限，今天不再写文件",
            file,
            maxMb: parseMaxMb(process.env.LOG_MAX_MB),
          }),
        );
      } catch {
        /* stdout 不可用也不影响 */
      }
    }
    return;
  }
  await appendFile(file, `${line}\n`, "utf8");
  st.bytes += size;
}

/** 记一条服务端日志。绝不抛出。签名保持 `(level, event, detail)` 不变。 */
export function logServer(level: LogLevel, event: string, detail: Record<string, unknown> = {}): Promise<void> {
  if (!shouldLog(level, currentLevel())) return Promise.resolve();

  let line: string;
  try {
    line = JSON.stringify({ at: new Date().toISOString(), level, event, ...detail });
  } catch {
    line = JSON.stringify({ at: new Date().toISOString(), level, event, detail: "[无法序列化]" });
  }
  try {
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else if (level === "debug") console.debug(line);
    else console.log(line);
  } catch {
    /* stdout 不可用也不影响 */
  }
  const dir = logsDir();
  if (!dir) return Promise.resolve();
  queue = queue.then(
    async () => {
      try {
        await writeLine(dir, line);
      } catch {
        /* 日志写不进去就放弃，不能影响业务 */
      }
    },
    () => {},
  );
  return queue;
}
