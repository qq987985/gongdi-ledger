import { canManageLedger, livePerms } from "./perms";
import { emptyState, useApp } from "./store";
import { buildFullWorkbook } from "./excel";
import { toast } from "sonner";
import type { LedgerState } from "./types";
import { LEDGER_SCHEMA_VERSION } from "./types";

let nas = false;
let pushFailed = false;
let pushQueue: Promise<void> = Promise.resolve();
let ledgerRevision = "";
/** >0 表示正在拉取台账：拉取期间禁止推送，避免把上一本台账的旧状态写进刚切换/新建的台账 */
let pullDepth = 0;
/** 本机有改动还没成功推到服务器（用来在「重新加载」覆盖本机之前先问一声） */
let dirty = false;
/** 正在把服务器数据写进本地：这期间的 state 变化不算「本机改动」 */
let applyingRemote = false;

export interface PullNasLedgerOptions {
  /**
   * 服务器上这本台账还是空的时，是否把本机数据写上去（仅用于首次把本机旧数据升级进当前台账）。
   * 新建台账、切换到别的台账时必须为 false，否则会把上一本台账整本复制过去。
   */
  seed?: boolean;
  /** 用户已经明确选择放弃本机改动（409 后选「加载服务器版本」），不要再弹确认 */
  discardLocal?: boolean;
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
    schemaVersion: s.schemaVersion || LEDGER_SCHEMA_VERSION,
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

/** 覆盖本机之前先问一声：本机有没保存上去的改动时，静默覆盖等于丢数据 */
function confirmDiscardLocal(what: string): boolean {
  if (!dirty) return true;
  return window.confirm(`本机有还没保存到服务器的改动。\n\n${what}会覆盖这些改动，确定继续吗？`);
}

/** 拉取失败要说清楚原因：403 说成「检查网络」会让人一直重试 */
async function reportPullFailure(r: Response): Promise<void> {
  // 401 不弹：开机时还没登录就会走到这里，登录页本身已经在提示了
  if (r.status === 401) console.warn("pullNasLedger: 未登录");
  else if (r.status === 403) toast.error("当前账号没有读取台账的权限，请联系管理员");
  else if (r.status === 503) toast.error("服务器上的台账文件读取失败，请联系管理员（不要清空 data）");
  else toast.error(`读取台账失败（${r.status}），请检查网络`);
}

export async function pullNasLedger(opts: PullNasLedgerOptions = {}): Promise<void> {
  if (!nas) return;
  pullDepth += 1;
  try {
    const r = await timeoutFetch("/api/ledger", 4e3);
    if (!r.ok) {
      await reportPullFailure(r);
      return;
    }
    ledgerRevision = r.headers.get("x-ledger-revision") || "";
    const j = await r.json();
    if (j.empty) {
      // 服务器上这本台账还没有数据
      if (opts.seed) {
        // 只在一开始的「把本机旧数据升级进当前台账」这条路允许写入；这里是有意为之，放行
        await enqueuePush(true);
        return;
      }
      if (!opts.discardLocal && !confirmDiscardLocal("加载这本空台账")) return;
      // 新建 / 切换过来的空台账：清掉上一本台账的残留数据，等用户真正改动时再落盘
      applyRemote(() => useApp.getState().setAll({ ...emptyState(), uiStyle: useApp.getState().uiStyle }));
      dirty = false;
      return;
    }
    if (!j.people || !Array.isArray(j.people)) return;
    if (!opts.discardLocal && !confirmDiscardLocal("重新加载服务器上的台账")) return;
    applyRemote(() =>
      useApp.getState().setAll({
        schemaVersion: j.schemaVersion || LEDGER_SCHEMA_VERSION,
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
      }),
    );
    dirty = false;
  } catch (err) {
    toast.error("读取台账失败，请检查网络");
    console.warn("pullNasLedger failed", err);
  } finally {
    pullDepth -= 1;
  }
}

/** 把服务器数据写进本地：期间的 state 变化不算本机改动，也不要触发自动保存 */
function applyRemote(fn: () => void): void {
  applyingRemote = true;
  try {
    fn();
  } finally {
    applyingRemote = false;
  }
}

const PUT_HEADERS = (revision: string) => ({ "content-type": "application/json", "if-match": revision });

function putLedger(revision: string): Promise<Response> {
  const body = sliceState(useApp.getState());
  return fetch("/api/ledger", {
    method: "PUT",
    credentials: "include",
    headers: PUT_HEADERS(revision),
    body: JSON.stringify(body),
  });
}

/** 重新读一次服务器版本号（409 之后要用它做「以本机覆盖」） */
async function refreshRevision(): Promise<string | null> {
  try {
    const r = await timeoutFetch("/api/ledger", 4e3);
    if (!r.ok) return null;
    const rev = r.headers.get("x-ledger-revision") || "";
    ledgerRevision = rev;
    return rev;
  } catch {
    return null;
  }
}

async function pushNasLedgerNow(force = false): Promise<void> {
  if (!nas) return;
  // 正在拉取台账时不要推：此刻内存里可能还是上一本台账的数据，推上去会串本。
  // force=true 仅用于「首次把本机数据升级进空台账」这条明确要走写入的路径。
  if (!force && pullDepth > 0) return;
  if (!canManageLedger(livePerms())) {
    // 与服务端 PUT /api/ledger 的判据保持一致：不够权限就别假装成功
    if (dirty && !pushFailed) {
      pushFailed = true;
      toast.error("当前账号没有保存整本台账的权限，改动只保留在本机，请联系管理员");
    }
    return;
  }
  try {
    let r = await putLedger(ledgerRevision);
    if (!r.ok && r.status === 409) {
      // 冲突不再是死路：拉最新版本号，然后让用户选「以本机覆盖」还是「放弃本机」
      const fresh = await refreshRevision();
      if (fresh === null) {
        pushFailed = true;
        toast.error("同步冲突，且无法读取服务器版本，请检查网络后重试");
        return;
      }
      const overwrite = window.confirm(
        "服务器上的台账已被其他设备修改。\n\n确定：用本机数据覆盖服务器\n取消：放弃本机改动，加载服务器上的版本",
      );
      if (!overwrite) {
        pushFailed = false;
        dirty = false;
        await pullNasLedger({ discardLocal: true });
        toast.success("已加载服务器上的版本");
        return;
      }
      r = await putLedger(ledgerRevision);
      if (r.ok) {
        ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
        pushFailed = false;
        dirty = false;
        toast.success("已用本机数据覆盖服务器");
        return;
      }
      pushFailed = true;
      toast.error(r.status === 409 ? "覆盖失败：服务器又被改动了，请再试一次" : `覆盖失败（${r.status}）`);
      return;
    }
    if (r.ok) {
      ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
      pushFailed = false;
      dirty = false;
      return;
    }
    if (r.status === 503) {
      pushFailed = true;
      toast.error("服务器上的台账文件读取失败，保存已拒绝，请联系管理员（不要清空 data）");
      return;
    }
    if (r.status === 403) {
      pushFailed = true;
      toast.error("当前账号没有保存整本台账的权限，改动只保留在本机");
      return;
    }
    if (r.status === 400) {
      // 服务端结构校验拒绝：把原因原样告诉用户，方便定位是哪份数据坏了
      pushFailed = true;
      const j = (await r.json().catch(() => null)) as { error?: string } | null;
      toast.error(j?.error || "服务器拒绝了这次保存（数据格式不对）");
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
    // 服务器数据写进本地不算本机改动，也不要再推回去
    if (applyingRemote) return;
    dirty = true;
    window.clearTimeout(t);
    t = window.setTimeout(tick, 500);
  });
  return true;
}
