import type { AuditEntry } from "./types";
import { toast } from "sonner";

/** 只在第一次失败时提醒，避免连续操作时刷屏 */
let warned = false;

/**
 * 记一条操作记录。
 *
 * 注意：这里**不能静默失败**。原来 fetch 不看返回值、异常也吞掉，
 * 结果审计写不进去（NAS 权限、并发写坏、会话过期）时用户完全无感，
 * 打开「操作记录」只看到空白，却以为是自己没操作。
 */
export async function logOp(action: string, detail = "", module = ""): Promise<void> {
  try {
    const r = await fetch("/api/audit", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, detail, module }),
    });
    if (!r.ok) {
      const why = await r.text().catch(() => "");
      console.warn(`操作记录未写入（${r.status}）`, action, why.slice(0, 200));
      if (!warned) {
        warned = true;
        toast.warning("操作记录没能写入服务器，请在「操作记录」页确认；反复失败请联系管理员");
      }
      return;
    }
    warned = false;
  } catch (err) {
    console.warn("操作记录未写入（网络）", action, err);
    if (!warned) {
      warned = true;
      toast.warning("操作记录没能写入服务器（网络问题），恢复后请重试");
    }
  }
}

export async function fetchAudit(): Promise<AuditEntry[]> {
  const r = await fetch("/api/audit", { credentials: "include" });
  if (!r.ok) {
    console.warn(`读取操作记录失败（${r.status}）`);
    return [];
  }
  return ((await r.json()) as { entries?: AuditEntry[] }).entries || [];
}
