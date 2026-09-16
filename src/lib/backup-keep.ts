/**
 * 服务端「备份保留份数」这一个数字（1.8.7，对应服务端 `BACKUP_KEEP`，见 nas-fs.server.ts）。
 *
 * 为什么单独一个文件：设置页要告诉用户「旧备份会被清掉、留几份」，但服务端的
 * `backupKeepCount()` 与 `pruneBackups()` 在 nas-fs.server.ts 里（含 node:fs），不能进客户端包。
 * 数字由 `/api/health` 带过来；探测到之前按默认 30 显示（与服务端默认值一致）。
 */
export const DEFAULT_BACKUP_KEEP = 30;

let keep = DEFAULT_BACKUP_KEEP;

export function setBackupKeep(v: unknown): void {
  const n = Number(v);
  keep = Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 1000) : DEFAULT_BACKUP_KEEP;
}

export function backupKeep(): number {
  return keep;
}
