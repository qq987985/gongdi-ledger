import { canWriteLedger, livePerms } from "./perms";
import { useApp } from "./store";
import { buildFullWorkbook } from "./excel";
import { toast } from "sonner";
import type { LedgerState } from "./types";

let nas = false;
let pushFailed = false;
let pushQueue: Promise<void> = Promise.resolve();
let ledgerRevision = "";

export function nasEnabled(): boolean {
  return nas;
}

function timeoutFetch(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const c = new AbortController();
  const t = window.setTimeout(() => c.abort(), ms);
  return fetch(url, { ...init, credentials: "include", signal: c.signal }).finally(() =>
    window.clearTimeout(t),
  );
}

export async function detectNas(): Promise<boolean> {
  try {
    const j = await (await timeoutFetch("/api/health", 2500)).json();
    nas = Boolean(j.persist);
  } catch {
    nas = false;
  }
  return nas;
}

function sliceState(s: LedgerState) {
  return {
    year: s.year,
    years: s.years,
    people: s.people,
    attendance: s.attendance,
    attendanceDocs: s.attendanceDocs || [],
    payments: s.payments,
    contracts: s.contracts || [],
    contractEntries: s.contractEntries || [],
    expenses: s.expenses || [],
    insurancePolicies: s.insurancePolicies || [],
    insuranceMembers: s.insuranceMembers || [],
    accessHash: s.accessHash || "",
  };
}

export async function pullNasLedger(): Promise<void> {
  if (!nas) return;
  const r = await timeoutFetch("/api/ledger", 4e3);
  if (!r.ok) return;
  ledgerRevision = r.headers.get("x-ledger-revision") || "";
  const j = await r.json();
  if (j.empty) {
    await pushNasLedger();
    return;
  }
  if (!j.people || !Array.isArray(j.people)) return;
  useApp.getState().setAll({
    year: j.year || 2026,
    years: j.years || [j.year || 2026],
    people: j.people,
    attendance: j.attendance || [],
    attendanceDocs: j.attendanceDocs || [],
    payments: j.payments || [],
    contracts: j.contracts || [],
    contractEntries: j.contractEntries || [],
    expenses: j.expenses || [],
    insurancePolicies: j.insurancePolicies || [],
    insuranceMembers: j.insuranceMembers || [],
    accessHash: j.accessHash || "",
    // 界面风格是本机偏好，不随台账同步
    uiStyle: useApp.getState().uiStyle,
  });
}

async function pushNasLedgerNow(): Promise<void> {
  if (!nas) return;
  if (!canWriteLedger(livePerms())) return;
  const body = sliceState(useApp.getState());
  try {
    const r = await fetch("/api/ledger", {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json", "if-match": ledgerRevision },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
      pushFailed = false;
      return;
    }
    if (r.status === 409) {
      pushFailed = true;
      toast.error("服务器上的台账已被其他设备修改，请重新加载后再保存");
      return;
    }
    if (!pushFailed) {
      pushFailed = true;
      toast.error(`保存到服务器失败（${r.status}），请检查网络后重试`);
    }
  } catch {
    if (!pushFailed) {
      pushFailed = true;
      toast.error("保存到服务器失败，请检查网络后重试");
    }
  }
}

/**
 * 自动保存必须串行执行。否则慢请求可能在新请求之后完成，
 * 用旧快照覆盖刚保存的新数据。
 */
export function pushNasLedger(): Promise<void> {
  pushQueue = pushQueue.then(pushNasLedgerNow, pushNasLedgerNow);
  return pushQueue;
}

export async function pushNasBackup(): Promise<string> {
  if (!nas) return "";
  const s = useApp.getState();
  const wb = buildFullWorkbook({
    year: s.year,
    people: s.people,
    attendance: s.attendance,
    payments: s.payments,
    insurancePolicies: s.insurancePolicies || [],
    insuranceMembers: s.insuranceMembers || [],
  });
  const { writeCenteredXlsx } = await import("./xlsx-center");
  const data = await writeCenteredXlsx(wb);
  const r = await fetch("/api/backup", { method: "POST", credentials: "include", body: data });
  if (!r.ok) throw new Error("backup failed");
  return ((await r.json()) as { filename?: string }).filename || "";
}

export async function startNasSync(): Promise<boolean> {
  await detectNas();
  if (!nas) return false;
  await pullNasLedger();
  let t: number | undefined;
  useApp.subscribe(() => {
    window.clearTimeout(t);
    t = window.setTimeout(() => {
      pushNasLedger();
    }, 500);
  });
  return true;
}
