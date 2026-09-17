/**
 * 台账存储层：ledger.json（CAS + 串行写队列）、audit.json（坏文件保护 + 串行追加）、
 * Excel 备份、台账册（book.json）与版本号文件。
 * 路径与目录初始化在 paths.server，影像/文档在 assets.server；依赖方向单向：
 * paths ← assets ← nas-fs。
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { logServer } from "./log.server";
import { reconcileContractScans } from "./assets.server";
import {
  atomicWriteFile,
  bookRoot,
  currentBookId,
  dataDir,
  ensureDirs,
  listDirSafe,
  persistOn,
  photosRoot,
  safeBookId,
} from "./paths.server";
import type { AuditEntry, LedgerState } from "./types";

function ledgerPath(): string {
  return join(bookRoot(), "ledger.json");
}

/**
 * 台账读取结果：empty = 还没有台账文件；unreadable = 文件在但读不出来（损坏/权限/IO）。
 * 定义已下沉到叶子 `./types`（G2 / 专家评审 A2：影像层要用它 ⇒ 原来与 `assets.server.ts` 互指的环），
 * 这里再导出一次保持调用点不变。
 */
import type { LedgerRead } from "./types";
export type { LedgerRead };

export function ledgerUnreadable(data: LedgerRead): boolean {
  return Boolean(data.unreadable);
}

export async function readLedger(): Promise<LedgerRead> {
  if (!persistOn()) return { empty: true };
  await ensureDirs();
  const p = ledgerPath();
  if (!existsSync(p)) return { empty: true };
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(p, "utf8"));
  } catch (err) {
    // 文件存在却解析不了：绝不能当成「空台账」，否则客户端会把本机（可能也是空的）状态写上去覆盖掉
    await logServer("error", "台账文件读取失败", { path: p, error: String(err) });
    return { unreadable: true };
  }
  if (!raw || typeof raw !== "object") {
    await logServer("error", "台账文件内容不是对象", { path: p });
    return { unreadable: true };
  }
  // 合同扫描件补名：只补「读出来的视图」，不回写——读路径写盘会绕过写队列和 CAS，覆盖并发保存
  // （历史上就出过读路径写回旧快照、把并发 PUT 的新数据盖掉的事）。补出来的值由客户端下次保存落盘。
  await reconcileContractScans(raw as { contracts?: { id?: string; name?: string; scanFileName?: string }[] });
  // A3（1.8.14）：旧字段 accessHash 不再出现在读视图里（它的历史效力见 dropLegacyAccessHash）。
  // 只删内存视图，不回写文件；老文件在下一次保存时被清理掉。
  if ("accessHash" in raw) delete (raw as Record<string, unknown>).accessHash;
  return raw as LedgerRead;
}

export function ledgerRevisionOf(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

/**
 * 台账版本号：空台账（ledger.json 还不存在）用 "" 作为哨兵。
 * GET 的 X-Ledger-Revision 响应头与 PUT 的 CAS 基准必须都走这里：
 * 两边口径不一致时空台账第一笔保存会被误判成「已被其他设备修改」，永远写不进去。
 */
export function ledgerRevisionValue(data: LedgerRead): string {
  return "empty" in data && data.empty ? "" : ledgerRevisionOf(data);
}

export async function ledgerRevision(): Promise<string> {
  const data = await readLedger();
  // 损坏时不返回任何可用版本号：任何 expectedRevision 都对不上，写入会被拒
  return ledgerUnreadable(data) ? "unreadable" : ledgerRevisionValue(data);
}

export type LedgerWriteResult = "ok" | "conflict" | "unreadable";

/** 写盘结果 + 「写成功后的服务端版本号」（与 GET 同源，见 writeLedgerEx） */
export interface LedgerWriteOutcome {
  result: LedgerWriteResult;
  /** 只有 result === "ok" 时有效：服务端读视图的版本号；失败时为空串（不要拿它当基准） */
  revision: string;
}

/**
 * A3（1.8.14）：丢弃旧台账字段 `accessHash`。
 *
 * 它的值是 `sha256("gongdi-ledger::" + 开机口令)`，历史上既当过「开机口令」也当管理员口令 hash
 * （`adminFromOldLedger` 直接拿它建 admin）→ 任何能读到 ledger.json 的路径都等于拿到管理员凭据
 * （CWE-916/759/522）。现在：写入一律丢弃；有值时才记一条日志（老客户端仍会带着空串发，
 * 不值得每个保存都写一行噪音）。
 */
function dropLegacyAccessHash(data: Partial<LedgerState>): { payload: Partial<LedgerState>; hadValue: boolean } {
  if (!data || typeof data !== "object" || !("accessHash" in data)) return { payload: data, hadValue: false };
  const clone = { ...(data as Record<string, unknown>) };
  const value = clone.accessHash;
  delete clone.accessHash;
  return { payload: clone as Partial<LedgerState>, hadValue: Boolean(value) };
}

let ledgerWriteQueue: Promise<LedgerWriteOutcome> = Promise.resolve({ result: "ok", revision: "" });

async function writeLedgerNow(
  data: Partial<LedgerState>,
  expectedRevision?: string,
): Promise<LedgerWriteOutcome> {
  if (!persistOn()) return { result: "ok", revision: "" };
  await ensureDirs();
  // 一次读取同时用于「坏文件保护」和「CAS 比对」，避免读写之间再插入一次读
  const cur = await readLedger();
  if (ledgerUnreadable(cur)) return { result: "unreadable", revision: "" };
  if (expectedRevision !== undefined && ledgerRevisionValue(cur) !== expectedRevision)
    return { result: "conflict", revision: "" };
  const { payload, hadValue } = dropLegacyAccessHash(data);
  if (hadValue)
    await logServer("warn", "台账写入已丢弃旧字段 accessHash", { path: ledgerPath() });
  // 原子写：先写临时文件再 rename，避免写一半崩溃导致文件损坏
  const p = ledgerPath();
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
    await rename(tmp, p);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    await logServer("error", "台账写入失败", { path: p, error: String(err) });
    throw err;
  }
  // A2（1.8.14）：版本号必须与 GET / CAS 同源 —— 都用**服务端读视图**。
  // 原来 PUT 响应头是拿请求体算的（`ledgerRevisionValue(body)`），而 readLedger() 会补合同扫描件名
  // 等只在视图里的字段 → 客户端存下的基准永远对不上，下一次保存必然假冲突 409，弹窗还诱导用户
  // 「以本机覆盖」（真丢别人的改动）。写完后在同一个串行队列里再读一次、按同一口径算，客户端拿到的
  // 头就一定等于它随后 GET 到的头。
  const after = await readLedger();
  return { result: "ok", revision: ledgerUnreadable(after) ? "" : ledgerRevisionValue(after) };
}

/**
 * 将版本检查和替换放在同一串行队列，避免两个请求同时通过 CAS 检查。
 * 返回结果 + 写成功后的服务端版本号（PUT /api/ledger 用它设 `X-Ledger-Revision` 响应头）。
 */
export function writeLedgerEx(
  data: Partial<LedgerState>,
  expectedRevision?: string,
): Promise<LedgerWriteOutcome> {
  const run = () => writeLedgerNow(data, expectedRevision);
  ledgerWriteQueue = ledgerWriteQueue.then(run, run);
  return ledgerWriteQueue;
}

/** 只关心结果的调用方（year.ts 等）用这个；口径与 writeLedgerEx 完全一致 */
export async function writeLedger(
  data: Partial<LedgerState>,
  expectedRevision?: string,
): Promise<LedgerWriteResult> {
  return (await writeLedgerEx(data, expectedRevision)).result;
}

function auditPath(): string {
  return join(bookRoot(), "audit.json");
}

function parseAuditFile(raw: unknown): AuditEntry[] {
  return ((Array.isArray(raw) ? raw : (raw as { entries?: AuditEntry[] })?.entries || []) as AuditEntry[]).filter(
    (x) => x && x.id && x.action,
  );
}

/** 老版本把操作记录放在 data/audit.json（没有按台账分）。这里作为只读兜底，避免「一条都看不到」 */
function legacyAuditPaths(): string[] {
  const root = dataDir();
  if (!root) return [];
  const out: string[] = [];
  if (currentBookId() === "default") out.push(join(root, "audit.json"));
  return out;
}

/**
 * 操作记录文件「存在但读不出来」的标志。
 *
 * 为什么要单独标出来：`readAudit()` 读坏文件时返回 `[]`，而 `appendAudit` 是「读—改—写」，
 * 拿到 `[]` 就会把整份历史覆盖成刚写的这一条（实测 97 条 → 1 条）。
 * 写之前必须能区分「本来就没有记录」和「读不出来」。
 */
let auditBroken = false;

/** 上一次 readAudit() 是否遇到了坏文件（只在写入路径上用，防止覆盖历史） */
export function auditUnreadable(): boolean {
  return auditBroken;
}

export async function readAudit(): Promise<AuditEntry[]> {
  if (!persistOn()) return [];
  await ensureDirs();
  const p = auditPath();
  if (existsSync(p)) {
    try {
      const rows = parseAuditFile(JSON.parse(await readFile(p, "utf8")));
      auditBroken = false;
      return rows;
    } catch (err) {
      auditBroken = true;
      await logServer("error", "操作记录文件读取失败", { path: p, error: String(err) });
      return [];
    }
  }
  // 没有本台账的记录文件时，回落到旧位置（只读）；下一次写入会把它们一起并入新文件
  for (const legacy of legacyAuditPaths()) {
    try {
      if (!existsSync(legacy)) continue;
      const rows = parseAuditFile(JSON.parse(await readFile(legacy, "utf8")));
      if (rows.length) {
        await logServer("info", "操作记录从旧位置读取", { legacy, count: rows.length });
        return rows;
      }
    } catch {}
  }
  return [];
}

export async function writeAudit(entries: AuditEntry[]): Promise<void> {
  if (!persistOn()) return;
  await ensureDirs();
  // 原子写（临时名带随机后缀）：原来固定用 `${target}.tmp`，两次并发写会互相搬走对方写了一半的文件，
  // rename 抛 ENOENT → 这条记录就丢了；客户端又把失败静默吞掉，界面表现为「操作没被记录」。
  // 上限 2 万条：超出后从最老的开始丢，但必须留痕——以前静默 slice， oldest 记录悄悄消失。
  const MAX_AUDIT_ENTRIES = 2e4;
  if (entries.length > MAX_AUDIT_ENTRIES) {
    await logServer("warn", "操作记录超出上限，最老的记录将被丢弃", { count: entries.length, keep: MAX_AUDIT_ENTRIES });
    entries = entries.slice(0, MAX_AUDIT_ENTRIES);
  }
  await atomicWriteFile(auditPath(), JSON.stringify({ entries }, null, 2));
}

/** 审计写入串行化：appendAudit 是「读—改—写」，并发不排队必然丢记录 */
let auditQueue: Promise<unknown> = Promise.resolve();

export function appendAudit(row: Partial<AuditEntry>): Promise<AuditEntry> {
  const task = async (): Promise<AuditEntry> => {
    const list = await readAudit();
    if (auditBroken) {
      // 读不出来就只记日志、不写盘：宁可少一条记录，也不能把整份历史覆盖掉
      await logServer("error", "操作记录写入被拒：文件读不出来", { path: auditPath() });
      return {
        id: row.id || "",
        at: row.at || new Date().toISOString(),
        userId: row.userId || "",
        userName: row.userName || "",
        action: row.action || "",
        detail: row.detail || "",
        module: row.module || "",
      };
    }
    const entry: AuditEntry = {
      id: row.id || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      at: row.at || new Date().toISOString(),
      userId: row.userId || "",
      userName: row.userName || "",
      action: row.action || "",
      detail: row.detail || "",
      module: row.module || "",
    };
    await writeAudit([entry, ...list]);
    return entry;
  };
  const next = auditQueue.then(task, task);
  auditQueue = next.catch(() => {});
  return next;
}
/**
 * 备份保留策略（1.8.7）。
 *
 * 背景（A 组逐项测试报告第 46 项，实测复现）：`data/backups/` 只增不减 —— 日志有
 * `LOG_KEEP_DAYS`、操作记录有 2 万条上限，备份什么策略都没有，点几次「立即备份 Excel」
 * 就多几份，长期运行会把数据盘写满。
 *
 * 规则：带时间戳的备份文件最多留最近 N 份（默认 **30**，`BACKUP_KEEP` 可覆盖，1–1000，非法回落默认）；
 * 固定名「考勤表.xlsx」（最新备份入口）**永不删**。
 * 删除范围用 `isManagedBackupFile` 卡死 —— 只删这个程序自己生成的名字形状，
 * 用户手放进 backups 目录的其它文件（自己的对账表等）一个都不动。
 */
export const DEFAULT_BACKUP_KEEP = 30;

export function backupKeepCount(): number {
  const raw = Number(process.env.BACKUP_KEEP);
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_BACKUP_KEEP;
  return Math.min(Math.floor(raw), 1000);
}

/** 本程序生成的备份文件名：`YYYYMMDD_HHMMSS_考勤表.xlsx` 或固定名「考勤表.xlsx」 */
export function isManagedBackupFile(name: string): boolean {
  if (name === "考勤表.xlsx") return true;
  return /^\d{8}_\d{6}_考勤表\.xlsx$/.test(name);
}

/** 按保留份数清理旧备份，返回删掉的份数。只删自己生成的时间戳备份，固定名不动。 */
export async function pruneBackups(keep = backupKeepCount()): Promise<number> {
  if (!persistOn()) return 0;
  const dir = join(dataDir(), "backups");
  const files = (await listDirSafe(dir)).filter((f) => isManagedBackupFile(f) && f !== "考勤表.xlsx");
  if (files.length <= keep) return 0;
  // 文件名前缀就是 YYYYMMDD_HHMMSS，字典序 = 时间序（同一秒内会互相覆盖，不会重复）
  files.sort();
  const doomed = files.slice(0, files.length - keep);
  let removed = 0;
  for (const f of doomed) {
    try {
      await rm(join(dir, f), { force: true });
      removed += 1;
    } catch (err) {
      await logServer("warn", "旧备份删除失败", { file: f, error: String(err) });
    }
  }
  if (removed) await logServer("info", "备份保留策略：清理旧备份", { removed, keep });
  return removed;
}

export async function saveBackup(buf: Buffer, filename: string): Promise<string> {
  if (!persistOn()) return "";
  await ensureDirs();
  const root = dataDir();
  const safe = filename.replace(/[\\/]/g, "") || "backup.xlsx";
  const dest = join(root, "backups", safe);
  await mkdir(join(root, "backups"), { recursive: true });
  // 0 字节不是备份：它会把「最新备份」固定名覆盖成空文件（路由已先 400，这里再兜一层 ——
  // 函数是唯一的写入口，将来多一个调用方也不会漏）。
  if (buf.length === 0) {
    await logServer("warn", "备份写入被拒：内容为 0 字节", { dest });
    return "";
  }
  // 原子写：temp + rename。先落带时间戳的那份，再更新固定名「考勤表.xlsx」——
  // 顺序反了的话，中途崩溃会留下「最新备份指向一份不存在/半截的文件」。
  await atomicWriteFile(dest, buf);
  await atomicWriteFile(join(root, "backups", "考勤表.xlsx"), buf);
  // 写完再清理：新备份一定在保留范围内，不会被自己刚写的那份挤掉
  await pruneBackups();
  return dest;
}
export async function listBookIds(): Promise<string[]> {
  const dir = join(dataDir(), "books");
  if (!dir || !existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of await listDirSafe(dir)) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    if (existsSync(join(p, "ledger.json")) || existsSync(join(p, "book.json"))) out.push(name);
  }
  return out;
}

export interface BookMeta {
  id: string;
  name: string;
  ownerId?: string;
}

export async function readBookMeta(id: string): Promise<BookMeta | null> {
  const p = join(dataDir(), "books", safeBookId(id), "book.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return null;
  }
}

export async function writeBookMeta(book: BookMeta): Promise<void> {
  const root = dataDir();
  if (!root) return;
  const dir = join(root, "books", safeBookId(book.id));
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "book.json"),
    JSON.stringify({ id: book.id, name: book.name, ownerId: book.ownerId || "" }, null, 2),
    "utf8",
  );
}

export async function removeBookDir(id: string): Promise<void> {
  const sid = safeBookId(id);
  if (sid === "default") return;
  const dir = join(dataDir(), "books", sid);
  if (existsSync(dir)) await rm(dir, { recursive: true, force: true });
  // 这本台账自己的影像目录也要删掉，否则「删了台账但证件照还在」
  const assets = photosRoot();
  if (assets) {
    const assetsDir = join(assets, sid);
    if (existsSync(assetsDir)) await rm(assetsDir, { recursive: true, force: true });
  }
}

export async function readVersionText(): Promise<string> {
  // 只读程序目录内的 VERSION.txt；data/ 里的旧文件不再读取（防旧版本号带偏）
  const candidates = [join(process.cwd(), "VERSION.txt"), "/app/VERSION.txt"];
  for (const p of candidates)
    try {
      if (!existsSync(p)) continue;
      if (!statSync(p).isFile()) continue;
      return await readFile(p, "utf8");
    } catch {}
  return "";
}
