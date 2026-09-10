/**
 * 服务端统一日志（D 项）。
 *
 * 为什么要它：这个项目原来服务端有 18 处 `catch {}`、全库 0 处日志——
 * 写盘失败、台账/账户库解析失败、权限拒绝、CAS 冲突全被吞掉，用户只看到一句 toast，
 * 事后**没有任何地方能查**。这里提供一个最小的落盘 + stdout 日志：
 *
 * - 同时写 `data/logs/YYYY-MM-DD.log`（NAS 上直接打开就能看）和 stdout（docker logs 能收）
 * - 内部串行追加，避免并发写交错；自身失败绝不抛出（日志不能拖垮业务）
 * - 只记「值得事后查」的事件：错误、警告、安全拒绝、冲突、重要维护动作
 */
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export type LogLevel = "info" | "warn" | "error";

function logsDir(): string {
  const root = process.env.DATA_DIR?.trim();
  return root ? join(root, "logs") : "";
}

let queue: Promise<void> = Promise.resolve();

/** 记一条服务端日志。绝不抛出。 */
export function logServer(level: LogLevel, event: string, detail: Record<string, unknown> = {}): Promise<void> {
  let line: string;
  try {
    line = JSON.stringify({ at: new Date().toISOString(), level, event, ...detail });
  } catch {
    line = JSON.stringify({ at: new Date().toISOString(), level, event, detail: "[无法序列化]" });
  }
  try {
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } catch {
    /* stdout 不可用也不影响 */
  }
  const dir = logsDir();
  if (!dir) return Promise.resolve();
  queue = queue.then(
    async () => {
      try {
        await mkdir(dir, { recursive: true });
        await appendFile(join(dir, `${new Date().toISOString().slice(0, 10)}.log`), `${line}\n`, "utf8");
      } catch {
        /* 日志写不进去就放弃，不能影响业务 */
      }
    },
    () => {},
  );
  return queue;
}
