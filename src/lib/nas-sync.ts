import { canManageLedger, livePerms, setLivePerms } from "./perms";
import { authOp, authStatus } from "./auth";
import { emptyState, useApp } from "./store";
import { backupCounts, backupSummaryText, buildBackupWorkbook, type BackupBookInput, type BackupCounts } from "./backup-book";
import { toast } from "sonner";
import { nasEnabled, setNasEnabled } from "./nas-flag";
import { ledgerGzipOn, setLedgerGzip } from "./ledger-gzip-flag";
import { setBackupKeep } from "./backup-keep";
import { runMuted, syncMuted } from "./sync-mute";
import { setSyncFailed, setSyncIdle, syncMessageSnapshot, syncStateSnapshot } from "./sync-status";
import type { LedgerState } from "./types";
import { LEDGER_SCHEMA_VERSION } from "./types";

/** 失败提示是否已经弹过（toast 只弹一次，持续可见的状态在 lib/sync-status.ts，B2）。
 *  「有没有未同步」不再用一个额外的布尔记在本文件里 —— 那会变成写进去没人读的死状态。 */
let failedNotified = false;
let pushQueue: Promise<void> = Promise.resolve();
let ledgerRevision = "";
/** >0 表示正在拉取台账：拉取期间禁止推送，避免把上一本台账的旧状态写进刚切换/新建的台账 */
let pullDepth = 0;
/** 本机有改动还没成功推到服务器（用来在「重新加载」覆盖本机之前先问一声） */
let dirty = false;
/**
 * 服务器明确说「这本台账你读不了」（401 会话失效 / 403 没权限 / 404 册子不存在或已被移出，A1）。
 * 这种状态下**绝不能**把本机数据推回去：目标册子可能已经换了人，推上去就是跨册覆盖。
 * 只有重新拉成功（真的拿到某本台账的数据）才解除。
 */
let bookBlocked = false;
/**
 * 拉取代际号（G1 / 专家评审 A15）。**每一次拉取、每一次「切册/新建/删除/换账号」都会 +1**，
 * 响应回来时代际对不上就**整包丢弃**（不写 store、不写本机缓存）。
 *
 * 为什么必须有：切册时上一本台账的拉取可能还在飞，它落地时会把内存换回**旧册数据**，
 * 500ms 后的自动保存就是一次「整本 PUT 把旧册数据写进新册」。推送侧早有 `pushQueue` + `pullDepth`
 * 保护，拉取侧原来**一点保护都没有**（评审跑通了复现：切到 B 并拉到 B 之后，A 的迟到响应
 * 让内存回到 A 的 3 人，随后 PUT 带的就是 A 的人员 + 新录入）。
 */
let pullGen = 0;
/** 拉取串行队列（与 pushQueue 对称）：同一时刻只有一个拉取在飞，避免同册两次拉取乱序落地 */
let pullQueue: Promise<void> = Promise.resolve();
/** 在途拉取的中断句柄：作废代际时顺手中断它，省掉切册后白等一个慢响应（拿不到也不影响正确性） */
let inflightPull: AbortController | null = null;
/**
 * >0 = 某次 seed 拉取正卡在「把本机数据推上去」这一步。
 *
 * 为什么需要它：串行队列 + **嵌套拉取** = 自己等自己。真实路径：`seed` 拉取 → 服务器上这本是空的
 * → `enqueuePush(true)` → PUT 撞 409 → 用户选「放弃本机」→ **从这次推送里**再 `pullNasLedger()` ——
 * 那次拉取如果老实排队，排的正是「正在等这次推送的这次拉取」，两边互等、永久挂住（开机时卡死）。
 * 所以只在这个窗口里放行「拉取不入队」；窗口之外拉取仍然严格串行。
 */
let awaitingSeedPush = 0;

/**
 * 作废所有在途拉取：代际 +1（迟到响应整包丢弃）+ 尽力中断在途请求。
 * 切册 / 新建 / 删除台账 / 换账号 / 退出登录都要调（现在统一由下面的 switchBook 等入口调）。
 */
export function invalidateInFlightPulls(reason = ""): void {
  pullGen += 1;
  const ac = inflightPull;
  inflightPull = null;
  if (ac) {
    try {
      ac.abort();
    } catch {}
  }
  if (reason) console.warn(`已作废在途台账拉取：${reason}`);
}

export interface PullNasLedgerOptions {
  /**
   * 服务器上这本台账还是空的时，是否把本机数据写上去（仅用于首次把本机旧数据升级进当前台账）。
   * 新建台账、切换到别的台账时必须为 false，否则会把上一本台账整本复制过去。
   */
  seed?: boolean;
  /** 用户已经明确选择放弃本机改动（409 后选「加载服务器版本」），不要再弹确认 */
  discardLocal?: boolean;
}

/** `signal` 用来让「作废代际」时能立刻中断这次请求（超时中断一直都有） */
function timeoutFetch(url: string, ms: number, init?: RequestInit, signal?: AbortSignal): Promise<Response> {
  const c = new AbortController();
  const onAbort = () => c.abort();
  if (signal) {
    if (signal.aborted) c.abort();
    else signal.addEventListener("abort", onAbort);
  }
  const t = window.setTimeout(() => c.abort(), ms);
  return fetch(url, { ...init, credentials: "include", signal: c.signal }).finally(() => {
    window.clearTimeout(t);
    if (signal) signal.removeEventListener("abort", onAbort);
  });
}

export async function detectNas(): Promise<boolean> {
  let on = false;
  try {
    const j = await (await timeoutFetch("/api/health", 2500)).json();
    on = Boolean(j.persist);
    // 服务端 LEDGER_GZIP=off 时上行不压缩（下行由服务端自己决定，客户端无感）
    setLedgerGzip(j.ledgerGzip);
    // 备份保留份数（BACKUP_KEEP）：设置页提示用
    setBackupKeep(j.backupKeep);
  } catch {
    on = false;
  }
  setNasEnabled(on);
  return on;
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
    // A3（1.8.14）：**不再上传 accessHash**。它是开机口令的 sha256，历史上还能当管理员凭据用
    // （服务端已不再保存/使用它）。本机的开机口令仍保存在浏览器 localStorage 里，不影响本机解锁。
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
  // 404 = 服务端说「这本台账不存在或你已经不是它的成员」：A1 起，显式请求的册子不可访问时
  // 服务端不再悄悄换成第一本，而是回 404 + bookDenied。提示必须指向「重新选台账」，
  // 而不是「检查网络」——否则用户会一直重试（而且不知道自己的改动没地方存）。
  else if (r.status === 404) {
    const j = (await r.json().catch(() => null)) as { bookDenied?: boolean } | null;
    toast.error(
      j?.bookDenied
        ? "这本台账不存在或你已不是它的成员（可能已被删除/移除）。请在左上角重新选择台账；当前改动只保留在本机。"
        : "读取台账失败（404），请检查服务地址后重试",
    );
  } else if (r.status === 403) toast.error("当前账号没有读取台账的权限，请联系管理员");
  else if (r.status === 503) toast.error("服务器上的台账文件读取失败，请联系管理员（不要清空 data）");
  else toast.error(`读取台账失败（${r.status}），请检查网络`);
}

/**
 * 清掉本机这份台账（内存 + localStorage 持久化）。
 *
 * 用于「换账号 / 退出登录 / 切换台账」：内存里留着上一份时，一个**没有 people.view 的账号**
 * 打开总览仍会看到上一个账号的在册人数、应发/已发工资（A 组报告第 30 项，实测复现）。
 * 清空后由调用方重新 `pullNasLedger()` 拉本账号该看的（拉不到就是 0，绝不拿别人的数字充数）。
 */
export function dropLocalLedger(reason: string): void {
  // G1：本机都清了，在途拉取（说的是上一本/上一个账号的事）绝不许再落地
  invalidateInFlightPulls(reason);
  const uiStyle = useApp.getState().uiStyle;
  const accessHash = useApp.getState().accessHash;
  applyRemote(() => useApp.getState().setAll({ ...emptyState(), accessHash, uiStyle }));
  dirty = false;
  failedNotified = false;
  ledgerRevision = "";
  // 换了账号/台账：那条「未同步」提示说的是上一本的事，必须收掉
  setSyncIdle();
  console.warn(`已清空本机台账缓存：${reason}`);
}

/** 本机缓存归属哪个「账号::台账」。只记一个字符串，用来判断缓存是不是当前会话的。 */
const CACHE_OWNER_KEY = "gongdi-ledger-v5-owner";

export type CacheOwnerState = "same" | "absent" | "changed";

/**
 * 本机缓存的归属检查。
 * - `same`：还是同一个账号 + 同一本台账，别动它；
 * - `absent`：没记过归属（老版本升级上来 / 首次运行）—— 保留本机数据，让 `seed` 路径能把它升级上去；
 * - `changed`：换过账号或换过台账，**必须先清空**再拉。
 */
export function checkCacheOwner(userId: string, bookId: string): CacheOwnerState {
  const next = `${userId}::${bookId}`;
  let prev = "";
  try {
    prev = localStorage.getItem(CACHE_OWNER_KEY) || "";
  } catch {}
  if (!prev) return "absent";
  return prev === next ? "same" : "changed";
}

export function setCacheOwner(userId: string, bookId: string): void {
  try {
    localStorage.setItem(CACHE_OWNER_KEY, `${userId}::${bookId}`);
  } catch {}
}

/**
 * 拉取台账（G1：**串行 + 代际**）。
 *
 * ① 串行：`pullQueue` 保证同一时刻只有一次拉取在飞（与推送对称）；
 * ② 代际：每次拉取占一个 `pullGen`，响应回来时对不上就整包丢弃 —— 切册/新建/删除/换账号之后
 *    迟到的响应不许再碰内存与本机缓存（见 `invalidateInFlightPulls`）。
 */
export async function pullNasLedger(opts: PullNasLedgerOptions = {}): Promise<void> {
  if (!nasEnabled()) return;
  const gen = ++pullGen;
  // seed 推送期间发起的拉取（409 → 「放弃本机」→ 再拉一次）要直接跑：它排队的对象正是
  // 「正在等这次推送的这次拉取」，排队就自锁（见 awaitingSeedPush 的说明）
  if (awaitingSeedPush > 0) return pullNasLedgerOnce(gen, opts);
  const run = () => pullNasLedgerOnce(gen, opts);
  const next = pullQueue.then(run, run);
  // 队列自身不能被一次失败卡死（失败已经在 once 里处理过，这里只是不让它污染后续）
  pullQueue = next.catch(() => {});
  return next;
}

async function pullNasLedgerOnce(gen: number, opts: PullNasLedgerOptions): Promise<void> {
  // 还在排队时就已经被新的一次拉取/切册作废了：连请求都不用发
  if (gen !== pullGen) return;
  /** 这次拉取是否已经被作废（切册/新建/删除/换账号/又来了一次拉取） */
  const stale = () => gen !== pullGen;
  const ac = new AbortController();
  inflightPull = ac;
  pullDepth += 1;
  try {
    const r = await timeoutFetch("/api/ledger", 4e3, undefined, ac.signal);
    // 迟到的响应：整包丢弃（不写 store、不写本机缓存、不弹提示）—— 这就是 G1 的核心
    if (stale()) return;
    if (!r.ok) {
      await reportPullFailure(r);
      if (stale()) return;
      // 401/403/404 = 这个账号本来就不该看到这本台账的数据。这时候留着上一份，
      // 屏幕上就还是上一个账号的工资数字（第 30 项），所以必须清掉；
      // 同时锁住推送（bookBlocked）：服务器说目标册子用不了，本机数据绝不能推回去（A1）。
      if (r.status === 401 || r.status === 403 || r.status === 404) {
        bookBlocked = true;
        dropLocalLedger(`读取台账被拒（${r.status}）`);
      }
      return;
    }
    bookBlocked = false;
    ledgerRevision = r.headers.get("x-ledger-revision") || "";
    const j = await r.json();
    if (stale()) return;
    if (j.empty) {
      // 服务器上这本台账还没有数据
      if (opts.seed) {
        // 只在一开始的「把本机旧数据升级进当前台账」这条路允许写入；这里是有意为之，放行
        // （但要再确认这次 seed 没被切册作废，否则就是把上一本的数据写进新册）
        if (stale()) return;
        // 这次 seed 推送期间若从中再发起拉取（409 → 用户选「放弃本机」→ 再拉一次），
        // 那次拉取必须**绕过串行队列**：它排队的对象正是「正在等这次推送的这次拉取」（自锁）。
        // 只在这一个窗口里放行，别的时候拉取仍然严格串行。
        awaitingSeedPush += 1;
        try {
          await enqueuePush(true);
        } finally {
          awaitingSeedPush -= 1;
        }
        return;
      }
      if (!opts.discardLocal && !confirmDiscardLocal("加载这本空台账")) return;
      if (stale()) return;
      // 新建 / 切换过来的空台账：清掉上一本台账的残留数据，等用户真正改动时再落盘
      applyRemote(() => useApp.getState().setAll({ ...emptyState(), uiStyle: useApp.getState().uiStyle }));
      dirty = false;
      return;
    }
    if (!j.people || !Array.isArray(j.people)) return;
    if (!opts.discardLocal && !confirmDiscardLocal("重新加载服务器上的台账")) return;
    if (stale()) return;
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
        // A3（1.8.14）：服务端不再保存 accessHash（旧文件里还可能有，读到就沿用）。
        // 服务器没有时**保留本机这个值** —— 它是这台设备的开机口令，不该因为一次拉取而丢掉。
        accessHash: j.accessHash || useApp.getState().accessHash,
        // 界面风格是本机偏好，不随台账同步
        uiStyle: useApp.getState().uiStyle,
      }),
    );
    dirty = false;
  } catch (err) {
    // 被作废而中断的请求不是故障：不要弹「读取失败」（用户正在切册，弹了只会更迷惑）
    if (stale() || ac.signal.aborted) return;
    toast.error("读取台账失败，请检查网络");
    console.warn("pullNasLedger failed", err);
  } finally {
    if (inflightPull === ac) inflightPull = null;
    pullDepth -= 1;
  }
}

/** 把服务器数据写进本地：期间的 state 变化不算本机改动，也不要触发自动保存 */
function applyRemote(fn: () => void): void {
  // 静音开关下沉在 lib/sync-mute.ts：store 的纯界面动作（切年份/换主题）与这里共用同一个，
  // 且不让 store 反向 import nas-sync（循环依赖是 §12 红线，B3）
  runMuted(fn);
}

/**
 * 保存失败：① 设「未同步」状态给顶部横幅（持续可见）；② toast **只弹一次**
 * （整本台账每改一处都会自动保存，失败时反复弹会盖满屏幕 —— B2）。
 */
function syncFailed(msg: string): void {
  setSyncFailed(msg);
  if (!failedNotified) {
    failedNotified = true;
    toast.error(msg);
  }
}

/** 保存成功（或本机内容已被服务器版本取代）：清掉「未同步」状态 */
function syncOk(): void {
  failedNotified = false;
  dirty = false;
  setSyncIdle();
}

const PUT_HEADERS = (revision: string) => ({ "content-type": "application/json", "if-match": revision });

/**
 * 浏览器端 gzip。
 *
 * 为什么用 CompressionStream：浏览器里没有 node:zlib，整本台账（中等工地 ~1.45MB）每次改动全量上传，
 * 是最大的一个性能项。旧浏览器 / 非安全上下文里 CompressionStream 可能不存在，**必须**能退回不压缩：
 * 压缩只是省流量，绝不能因为它不可用就让用户保存失败。
 * @returns 压缩后的字节；不可用或压缩失败时返回 null（调用方按未压缩上传）
 */
async function gzipJson(text: string): Promise<ArrayBuffer | null> {
  if (typeof CompressionStream !== "function") return null;
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    return await new Response(stream).arrayBuffer();
  } catch (err) {
    console.warn("台账压缩失败，改用未压缩上传", err);
    return null;
  }
}

async function putLedger(revision: string): Promise<Response> {
  const body = sliceState(useApp.getState());
  const json = JSON.stringify(body);
  // LEDGER_GZIP=off：上行不压缩（服务端照旧接受 gzip，老客户端不受影响）
  const gz = ledgerGzipOn() ? await gzipJson(json) : null;
  // gz 为 null = 未压缩：不带 content-encoding，服务端按原样解析（向后兼容老客户端/老浏览器）
  const headers: Record<string, string> = { ...PUT_HEADERS(revision) };
  if (gz) headers["content-encoding"] = "gzip";
  return fetch("/api/ledger", {
    method: "PUT",
    credentials: "include",
    headers,
    body: gz ?? json,
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
  if (!nasEnabled()) return;
  // 正在拉取台账时不要推：此刻内存里可能还是上一本台账的数据，推上去会串本。
  // force=true 仅用于「首次把本机数据升级进空台账」这条明确要走写入的路径。
  if (!force && pullDepth > 0) return;
  if (!canManageLedger(livePerms())) {
    // 与服务端 PUT /api/ledger 的判据保持一致：不够权限就别假装成功
    if (dirty) syncFailed("当前账号没有保存整本台账的权限，改动只保留在本机，请联系管理员");
    return;
  }
  if (bookBlocked) {
    // A1：服务器刚说过「这本台账你读不了」。这时把本机（上一本册子的）数据推上去，
    // 就是往别的/不可用的册子里写整本快照 —— 宁可只留在本机，并让用户重新选台账。
    if (dirty)
      syncFailed("这本台账对你已不可用（可能已被移除或删除），改动只保留在本机；请重新登录或在左上角选择台账");
    return;
  }
  try {
    let r = await putLedger(ledgerRevision);
    if (!r.ok && r.status === 409) {
      // 冲突不再是死路：拉最新版本号，然后让用户选「以本机覆盖」还是「放弃本机」
      const fresh = await refreshRevision();
      if (fresh === null) {
        syncFailed("同步冲突，且无法读取服务器版本，请检查网络后重试");
        return;
      }
      // 409 的「取消 / Esc」= 放弃本机改动（C3）：文案把后果写明白，别让用户以为只是「稍后再说」
      const overwrite = window.confirm(
        "服务器上的台账已被其他设备修改。\n\n【确定】用本机数据覆盖服务器（服务器上别处改的那份会被丢掉）\n【取消 / Esc】放弃本机这批改动（改不回本机了），改用服务器上的版本",
      );
      if (!overwrite) {
        syncOk();
        await pullNasLedger({ discardLocal: true });
        toast.success("已加载服务器上的版本");
        return;
      }
      r = await putLedger(ledgerRevision);
      if (r.ok) {
        ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
        syncOk();
        toast.success("已用本机数据覆盖服务器");
        return;
      }
      syncFailed(r.status === 409 ? "覆盖失败：服务器又被改动了，请再试一次" : `覆盖失败（${r.status}）`);
      return;
    }
    if (r.ok) {
      ledgerRevision = r.headers.get("x-ledger-revision") || ledgerRevision;
      syncOk();
      return;
    }
    if (r.status === 503) {
      syncFailed("服务器上的台账文件读取失败，保存已拒绝，请联系管理员（不要清空 data）");
      return;
    }
    if (r.status === 401) {
      // 401 = 会话失效（accounts.server.ts 的 withTenant 回 401），**不是**网络问题：
      // 原来被写成「请检查网络」，用户会一直重试（B2）
      syncFailed("登录已失效，请重新登录（改动还留在本机，先别关页面）");
      return;
    }
    if (r.status === 403) {
      syncFailed("当前账号没有保存整本台账的权限，改动只保留在本机");
      return;
    }
    if (r.status === 400) {
      // 服务端结构校验拒绝：把原因原样告诉用户，方便定位是哪份数据坏了
      const j = (await r.json().catch(() => null)) as { error?: string } | null;
      syncFailed(j?.error || "服务器拒绝了这次保存（数据格式不对）");
      return;
    }
    syncFailed(`保存到服务器失败（${r.status}），请检查网络后重试`);
  } catch {
    syncFailed("保存到服务器失败，请检查网络后重试");
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
 * flush 的结果（G3 / 专家评审 B18）。
 *
 * 原来这里返回 `Promise<void>` 且**从不抛错**（`pushNasLedgerNow` 内部把失败都吞成 `syncFailed()`），
 * 于是调用方**无从区分成败** —— 切册/换年份照旧继续，`dropLocalLedger()` 一执行，
 * 本机改动就没了（横幅会显示「未同步」，可流程根本没读它）。现在把结果显式带出来：
 *   · `ok`      本机改动已经在服务器上（或本来就没有本机改动）；
 *   · `skipped` 本机没连服务器 —— 没有「推不上去」这回事，调用方照常继续；
 *   · `failed`  推不上去，`reason` 说清原因；**调用方必须让用户决定**，不许静默继续。
 */
export type FlushOutcome = { status: "ok" } | { status: "skipped"; reason: string } | { status: "failed"; reason: string };

/**
 * 切换 / 新建 / 删除台账 / 换年份之前调用：先把本机还没推上去的改动推到「当前」台账。
 * 否则切换后 cookie 已指向新台账，这批改动会推错台账或被丢弃。
 *
 * 判据用 `dirty`（「本机有改动还没成功推上去」，与 `confirmDiscardLocal` 同源），
 * 不看「刚才有没有弹过错误」—— 有的失败路径（拉取进行中时禁推）不会弹错误，但改动同样没上去。
 */
export async function flushPendingLedger(): Promise<FlushOutcome> {
  if (!nasEnabled()) return { status: "skipped", reason: "本机没连服务器：台账只在浏览器里" };
  if (!dirty) return { status: "ok" }; // 没有本机改动可丢
  await pushNasLedger();
  if (dirty)
    return {
      status: "failed",
      // 有具体原因（网络/401/403/409/503…）就用它；没有就是「拉取进行中禁推」这类静默跳过
      reason: syncStateSnapshot() === "failed" ? syncMessageSnapshot() || "改动还没保存到服务器" : "正在读取台账，本机改动还没推上去",
    };
  return { status: "ok" };
}

/** 台账切换类动作的返回值（G1/G3）：`cancelled` = 用户选了「留在当前台账」 */
export type BookTransitionResult =
  | { status: "ok"; bookId: string }
  | { status: "cancelled" }
  | { status: "failed"; reason: string };

/** 问用户一句（默认 window.confirm；测试 / SSR 环境没有 confirm 时按「不拦」处理，与 lib/unsaved.ts 同口径） */
export type AskFn = (message: string) => boolean;
function askConfirm(message: string): boolean {
  const ask = globalThis.confirm;
  if (typeof ask !== "function") return true;
  return Boolean(ask(message));
}

/** 切换前统一的一步：flush 推不上去就得**用户点头**才继续（G3），否则返回 cancelled 中止切换 */
async function flushBeforeTransition(what: string, ask: AskFn): Promise<"ok" | "cancelled"> {
  const flushed = await flushPendingLedger();
  if (flushed.status !== "failed") return "ok";
  const go = ask(
    `本机还有改动没能保存到服务器：\n\n${flushed.reason}\n\n` +
      `现在${what}的话，这批改动会丢（只留在本机的那份会被清掉）。\n` +
      `【确定】放弃这批改动，继续　【取消】留在当前台账，先把改动保存成功再切`,
  );
  return go ? "ok" : "cancelled";
}

/**
 * 切到目标册之后的统一一步（G1 的核心顺序，别再让调用点各记一套）：
 * 作废在途拉取 → 记下新的缓存归属 → 清空本机（不许留上一册的残留）→ 拉目标册。
 */
async function enterBookAfterTransition(what: string): Promise<string> {
  invalidateInFlightPulls(what);
  const s = await authStatus().catch(() => null);
  const bookId = String(s?.bookId || "");
  if (s) {
    setLivePerms(s.persist ? s.perms || ["*"] : ["*"]);
    setCacheOwner(String(s.user?.id || ""), bookId);
  }
  dropLocalLedger(what);
  await pullNasLedger();
  return bookId;
}

/**
 * **切到另一本已存在的台账的唯一入口**（G1 / G3）：flush → useBook → 作废在途拉取 → 清本机 → 拉新册。
 *
 * 顺序在这里只写一遍（原来左侧下拉、设置页「进入」各自抄了一遍：任何一处漏了
 * `dropLocalLedger` 或漏了作废在途拉取，就会出现「屏幕上还是上一本的数据」或「旧册数据被推给新册」）。
 * 「有没有没保存的月表改动」仍由调用方先问（`confirmLeaveUnsaved`，文案唯一在 lib/unsaved.ts）。
 */
export async function switchBook(id: string, opts: { action?: string; ask?: AskFn } = {}): Promise<BookTransitionResult> {
  const what = opts.action || "切换台账";
  const ask = opts.ask || askConfirm;
  if ((await flushBeforeTransition(what, ask)) === "cancelled") return { status: "cancelled" };
  try {
    await authOp("useBook", { id });
  } catch (err) {
    return { status: "failed", reason: err instanceof Error ? err.message : `${what}失败` };
  }
  return { status: "ok", bookId: await enterBookAfterTransition(`${what} ${id}`) };
}

/**
 * **新建一套台账并进入它**（唯一入口）：flush → createBook → 作废在途拉取 → 清本机 → 拉空册。
 * 目标册是空的 ⇒ 拉到 `emptyState()`，本机旧数据不会被推过去（§台账同步硬约束 2/3）。
 */
export async function createBookAndEnter(name: string, opts: { action?: string; ask?: AskFn } = {}): Promise<BookTransitionResult> {
  const what = opts.action || "新建台账";
  const ask = opts.ask || askConfirm;
  if ((await flushBeforeTransition(what, ask)) === "cancelled") return { status: "cancelled" };
  try {
    await authOp("createBook", { name });
  } catch (err) {
    // 普通成员自建有数量上限：服务端 400 的文案原样带回，调用方 toast 出来（1.8.9）
    return { status: "failed", reason: err instanceof Error ? err.message : `${what}失败` };
  }
  return { status: "ok", bookId: await enterBookAfterTransition(what) };
}

/**
 * **删除一套台账**（唯一入口）。
 *
 * 删的正好是当前这本时：必须先 flush（本机改动只在当前册里有意义），删完作废在途拉取 + 清本机 + 拉
 * 服务器指定的下一本 —— 否则屏幕上还是已删册的数据，一次自动保存又会把它写回去。
 * 删的是别的册子且当前册没变：本机数据照旧（只作废在途拉取，免得删册期间回来的旧响应把已删的东西画回屏幕）。
 */
export async function deleteBook(id: string, opts: { action?: string; ask?: AskFn } = {}): Promise<BookTransitionResult> {
  const what = opts.action || "删除台账";
  const ask = opts.ask || askConfirm;
  const before = await authStatus().catch(() => null);
  const currentBefore = String(before?.bookId || "");
  if (currentBefore === id && (await flushBeforeTransition(`${what}（当前这一本）`, ask)) === "cancelled")
    return { status: "cancelled" };
  try {
    await authOp("deleteBook", { id });
  } catch (err) {
    return { status: "failed", reason: err instanceof Error ? err.message : `${what}失败` };
  }
  const after = await authStatus().catch(() => null);
  const currentAfter = String(after?.bookId || "");
  if (currentAfter && currentBefore && currentAfter === currentBefore) {
    invalidateInFlightPulls(what);
    return { status: "ok", bookId: currentAfter };
  }
  return { status: "ok", bookId: await enterBookAfterTransition(what) };
}

/**
 * 立即备份（F2 / A13）：工作簿的组装唯一在 `lib/backup-book.ts`，
 * **全实体**都在里面（人员 / 各年各月考勤 / 发放 / 报销 / 合同+明细 / 保险+参保人），
 * 这里只负责写盘，并把「这份备份里装了什么」的条数带回界面（肉眼校对用）。
 */
export async function pushNasBackup(): Promise<{ filename: string; counts: BackupCounts; summary: string }> {
  const s = useApp.getState();
  const input: BackupBookInput = {
    year: s.year,
    years: s.years,
    people: s.people,
    attendance: s.attendance,
    payments: s.payments,
    expenses: s.expenses || [],
    contracts: s.contracts || [],
    contractEntries: s.contractEntries || [],
    insurancePolicies: s.insurancePolicies || [],
    insuranceMembers: s.insuranceMembers || [],
  };
  const counts = backupCounts(input);
  if (!nasEnabled()) return { filename: "", counts, summary: "" };
  const wb = buildBackupWorkbook(input);
  const { writeCenteredXlsx } = await import("./xlsx-center");
  const data = await writeCenteredXlsx(wb);
  const r = await fetch("/api/backup", { method: "POST", credentials: "include", body: data });
  if (!r.ok) throw new Error("backup failed");
  return {
    filename: ((await r.json()) as { filename?: string }).filename || "",
    counts,
    summary: backupSummaryText(counts),
  };
}

export async function startNasSync(): Promise<boolean> {
  await detectNas();
  if (!nasEnabled()) return false;
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
    // 服务器数据写进本地、以及纯界面动作（切年份/换主题走 store 的 runMuted）都不算本机改动：
    // 前者不能回推，后者根本不该落盘（B3：只读账号切年份原来会被判成「有改动」）
    if (syncMuted()) return;
    dirty = true;
    window.clearTimeout(t);
    t = window.setTimeout(tick, 500);
  });
  return true;
}
