import type { AuditEntry } from "./types";

export async function logOp(action: string, detail = "", module = ""): Promise<void> {
  try {
    await fetch("/api/audit", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, detail, module }),
    });
  } catch {}
}

export async function fetchAudit(): Promise<AuditEntry[]> {
  const r = await fetch("/api/audit", { credentials: "include" });
  if (!r.ok) return [];
  return ((await r.json()) as { entries?: AuditEntry[] }).entries || [];
}
