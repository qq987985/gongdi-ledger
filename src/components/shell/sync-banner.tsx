import * as React from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { subscribeSyncStatus, syncMessageSnapshot, syncStateSnapshot, setSyncIdle } from "~/lib/sync-status";

/**
 * 顶部「有改动没存到服务器」横幅（1.8.14 / 专家评审 B2）。
 *
 * 背景：自动保存失败原来只在**第一次**弹一条 toast（`pushFailed` 锁存），之后一直静默，
 * 界面上没有任何「未同步」迹象 —— 用户以为存上了，其实只在浏览器内存里。
 *
 * 这里把 nas-sync 记下的失败原因**持续显示**：失败一次就出现，直到保存成功（`syncOk()`）或
 * 换账号/换台账（`dropLocalLedger()`）才消失。打印时不印（`no-print`）。
 */
export function SyncUnsyncedBanner() {
  const state = React.useSyncExternalStore(subscribeSyncStatus, syncStateSnapshot, syncStateSnapshot);
  const message = React.useSyncExternalStore(subscribeSyncStatus, syncMessageSnapshot, syncMessageSnapshot);
  const [busy, setBusy] = React.useState(false);
  if (state !== "failed") return null;
  async function retry() {
    setBusy(true);
    try {
      const m = await import("~/lib/nas-sync");
      await m.pushNasLedger();
    } catch {
      // 失败细节由 nas-sync 写进同一份状态（横幅会继续显示），这里不重复弹
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      data-unsynced-banner
      role="status"
      aria-live="polite"
      className="no-print flex flex-wrap items-center gap-2 border-b border-warn bg-warn-bg px-3 py-2 text-xs text-warn md:px-8"
    >
      <AlertTriangle className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="font-medium">改动还没存到服务器：</span>
        {message || "保存失败，请检查网络"}
      </span>
      <button
        type="button"
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-sm border border-warn px-2 py-0.5 disabled:opacity-60"
        onClick={() => void retry()}
      >
        <RefreshCw className="size-3" /> {busy ? "重试中…" : "立即重试"}
      </button>
      <button type="button" className="inline-flex items-center gap-1 px-1 py-0.5" onClick={() => setSyncIdle()}>
        <X className="size-3" /> 知道了
      </button>
    </div>
  );
}
