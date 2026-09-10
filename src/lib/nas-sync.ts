import { canWriteLedger, livePerms } from "./perms";
import { emptyState, useApp } from "./store";
import { buildFullWorkbook } from "./excel";
import { toast } from "sonner";
import type { LedgerState } from "./types";

let nas = false;
let pushFailed = false;
let pushQueue: Promise<void> = Promise.resolve();
let ledgerRevision = "";
/** >0 表示正在拉取台账：拉取期间禁止推送，避免把上一本台账的旧状态写进刚切换/新建的台账 */
let pullDepth = 0;

export interface PullNasLedgerOptions {
  /**
   * 服务器上这本台账还是空的时，是否把本机数据写上去（仅用于首次把本机旧数据升级进当前台账）。
   * 新建台账、切换到别的台账时必须为 false，否则会把上一本台账整本复制过去。
   */
  seed?: boolean;
}

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

export async function pullNasLedger(opts: PullNasLedgerOptions = {}): Promise<void> {
  if (!nas) return;
  pullDepth += 1;
  try {
    const r = await timeoutFetch("/api/ledger", 4e3);
    if (!r.ok) return;
    ledgerRevision = r.headers.get("x-ledger-revision") || "";
    const j = await r.json();
    if (j.empty) {
      // 服务器上这本台账还没有数据
      if (opts.seed) {
        // 只在一开始的「把本机旧数据升级进当前台账」这条路允许写入；这里是有意为之，放行
        await enqueuePush(true);
        return;
      }
      // 新建 / 切换过来的空台账：清掉上一本台账的残留数据，等用户真正改动时再落盘
      useApp.getState().setAll({ ...emptyState(), uiStyle: useApp.getState().uiStyle });
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
  } finally {
    pullDepth -= 1;
  }
}

async function pushNasLedgerNow(force = false): Promise<void> {
  if (!nas) return;
  // 正在拉取台账时不要推：此刻内存里可能还是上一本台账的数据，推上去会串本。
  // force=true 仅用于「首次把本机数据升级进空台账」这条明确要走写入的路径。
  if (!force && pullDepth > 0) return;
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
function enqueuePush(force = false): Promise<void> {
  const run = () => pushNasLedgerNow(force);
  pushQueue = pushQueue.then(run, run);
  return pushQueue;
}

export function pushNasLedger(): Promise<void> {
  return enqueuePush();
}

/**
 * 切换 / 新建 / 删除台账之前调用：先把本机还没推上去的改动推到「当前」台账。
 * 否则切换后 cookie 已指向新台账，这批改动会推错台账或被丢弃。
 */
export async function flushPendingLedger(): Promise<void> {
  if (!nas) return;
  try {
    await pushNasLedger();
  } catch {}
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
  // 开机第一次同步：允许把本机旧数据升级进当前台账（服务器上这本还是空的时）
  await pullNasLedger({ seed: true });
  let t: number | undefined;
  const tick = () => {
    // 拉取还没结束时再等一轮，避免把上一本台账的状态推给新台账
    if (pullDepth > 0) {
      t = window.setTimeout(tick, 500);
      return;
    }
    pushNasLedger();
  };
  useApp.subscribe(() => {
    window.clearTimeout(t);
    t = window.setTimeout(tick, 500);
  });
  return true;
}
