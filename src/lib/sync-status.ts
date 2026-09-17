/**
 * 「台账有没有存到服务器」的可见状态（1.8.14 / 专家评审 B2）。
 *
 * 背景：自动保存失败只在**第一次**弹一条 toast（`pushFailed` 锁存），之后全静默；
 * 界面上没有任何「未同步」指示 —— 用户会以为改的东西已经存上去了（典型「以为存了其实没落盘」）。
 * 这里做唯一的一份状态：nas-sync 写、顶部横幅读（`components/shell/sync-banner.tsx`）。
 *
 * 纯模块（不引 React / toast / DOM），所以能直接进 `tests/*.test.ts` 断言状态机。
 */
export type SyncState = "idle" | "failed";

let state: SyncState = "idle";
let message = "";
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

/** 有改动没存上去（横幅显示 message） */
export function setSyncFailed(msg: string): void {
  const next = msg.trim();
  if (state === "failed" && message === next) return;
  state = "failed";
  message = next;
  emit();
}

/** 存上去了 / 本机缓存被清空：把横幅收掉 */
export function setSyncIdle(): void {
  if (state === "idle" && !message) return;
  state = "idle";
  message = "";
  emit();
}

export function subscribeSyncStatus(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** useSyncExternalStore 的快照：必须是稳定值（这里是两个字符串） */
export function syncStateSnapshot(): SyncState {
  return state;
}

export function syncMessageSnapshot(): string {
  return message;
}

/** 供测试/兜底屏复位（正常流程不要调） */
export function resetSyncStatusForTest(): void {
  state = "idle";
  message = "";
  listeners.clear();
}
