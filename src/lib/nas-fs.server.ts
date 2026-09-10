import { existsSync, statSync } from "node:fs";
import { dirname, extname, join, sep } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { logServer } from "./log.server";
import type { AuditEntry, LedgerState } from "./types";

const bookAls = new AsyncLocalStorage<string>();

export function dataDir(): string {
  return process.env.DATA_DIR?.trim() || "";
}

export function persistOn(): boolean {
  return Boolean(dataDir());
}

export function safeBookId(id: string): string {
  return id.replace(/[\\/:*?"<>|]/g, "").trim() || "default";
}

function currentBookId(): string {
  return bookAls.getStore() || "default";
}

export function runWithBook<T>(id: string, fn: () => T): T {
  return bookAls.run(safeBookId(id), fn);
}

/** 台账数字一律在 data/books/{id}/ ，旧的根目录 ledger.json 启动时迁走 */
function bookRoot(): string {
  const root = dataDir();
  if (!root) return "";
  return join(root, "books", currentBookId());
}

function isLegacyDefault(): boolean {
  return currentBookId() === "default" && existsSync(join(dataDir(), "ledger.json"));
}

/** 影像总根目录（默认 data/photos，可用 PHOTO_DIR 指定，例如挂到独立盘） */
function photosRoot(): string {
  const shared = process.env.PHOTO_DIR?.trim();
  if (shared) return shared;
  const root = dataDir();
  return root ? join(root, "photos") : "";
}

/**
 * 当前台账的影像目录：`<影像根>/<台账id>/`（A 项）。
 *
 * 为什么必须分段：影像原来全放在 `<影像根>/id`、`<影像根>/合同扫描件` 这类全局目录里，
 * 台账之间**互相能读到、能覆盖、能删除**对方成员的身份证照/银行卡/合同扫描件——
 * 数字数据按台账隔离，二进制资产却没有，租户边界等于漏了一半。
 */
function bookAssetsRoot(): string {
  const base = photosRoot();
  return base ? join(base, safeBookId(currentBookId())) : "";
}

function labelOf(kind: string): string {
  if (kind === "idBack") return "身份证-反面";
  if (kind === "id" || kind === "idFront") return "身份证-正面";
  return kind === "bank" ? "银行卡" : "IC卡";
}

/** 历史遗留的按类型指定的目录（只读回落，不再作为写入目标） */
function kindEnv(kind: string): string {
  const k = kind === "idBack" || kind === "idFront" ? "id" : kind;
  return (
    (k === "id" ? process.env.PHOTO_ID_DIR : k === "bank" ? process.env.PHOTO_BANK_DIR : process.env.PHOTO_IC_DIR) || ""
  );
}

function kindFolder(kind: string): string {
  return kind === "idBack" || kind === "idFront" || kind === "id" ? "id" : kind;
}

/** 写入目标：当前台账的影像目录下按类型分文件夹 */
function kindDir(kind: string): string {
  const root = bookAssetsRoot();
  return root ? join(root, kindFolder(kind)) : "";
}

function safeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "").trim();
}

function compactName(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/[\s　._\-－—–·•]/g, "")
    .toLowerCase();
}

interface PhotoSearchDir {
  dir: string;
  mixed: boolean;
}

/**
 * 是否允许回落到「历史遗留的公共影像目录」读取（默认允许）。
 *
 * 为什么默认允许：不加回落的话，升级后所有老照片/合同扫描件会在界面里凭空消失。
 * 代价：在把遗留影像归入各台账（设置 → 影像归入本台账）之前，公共目录里的文件仍可被各台账读到。
 * 全部归入并把旧目录归档后，设 `PHOTO_LEGACY_FALLBACK=off` 即可彻底关闭回落。
 */
function legacyFallbackOn(): boolean {
  return process.env.PHOTO_LEGACY_FALLBACK?.trim().toLowerCase() !== "off";
}

/**
 * 照片查找目录（按优先级）。
 * 第一位是「当前台账」自己的目录；后面全是**历史遗留 / 只读回落**目录：
 * 换成本台账分目录以前，文件散在全局 photos/、PHOTO_ID_DIR 等地方，老数据仍要能看到。
 * 只读回落目录永远不会被写入（写入只看 kindDir）。
 */
function photoSearchDirs(kind: string): PhotoSearchDir[] {
  const out: PhotoSearchDir[] = [];
  const seen = new Set<string>();
  const add = (dir: string, mixed = false) => {
    const d = (dir || "").trim();
    if (!d || seen.has(d)) return;
    seen.add(d);
    out.push({ dir: d, mixed });
  };
  const cn = kind === "idBack" || kind === "id" || kind === "idFront" ? "身份证" : labelOf(kind);
  const folder = kindFolder(kind);
  const book = bookRoot();
  const root = dataDir();
  const shared = photosRoot();
  add(join(bookAssetsRoot(), folder));
  if (book) {
    add(join(book, "photos", folder));
    add(join(book, "photos", cn));
    add(join(book, "photos", "id"));
    add(join(book, cn));
  }
  if (!legacyFallbackOn()) return out;
  add(kindEnv(kind));
  add(join(shared, folder));
  add(join(shared, "id"));
  add(join(shared, cn));
  add(root ? join(root, "photos", folder) : "");
  add(root ? join(root, "photos", "id") : "");
  add(root ? join(root, "photos", cn) : "");
  add(root ? join(root, folder) : "");
  add(root ? join(root, cn) : "");
  add(shared, true);
  add(root ? join(root, "photos") : "", true);
  return out;
}

function idSide(base: string): "back" | "front" | "plain" {
  const b = compactName(base);
  if (/反面|背面|back/.test(b)) return "back";
  if (/正面|人像|头像|front/.test(b)) return "front";
  return "plain";
}

/** 精确匹配姓名+标签，避免"张"误匹配"张三-身份证"（删除越权/误删） */
function labelledMatch(b: string, n: string, labels: string[]): boolean {
  if (b === n) return true;
  if (labels.some((lab) => b.startsWith(n + compactName(lab)))) return true;
  const rest = b.slice(n.length);
  if (rest && /^[^一-龥A-Za-z0-9]/.test(rest) && labels.some((lab) => b.includes(compactName(lab)))) return true;
  return false;
}

function photoFileMatches(file: string, name: string, kind: string, requireLabel: boolean): boolean {
  const ext = extname(file).toLowerCase();
  if (!PHOTO_EXT.has(ext)) return false;
  const base = file.slice(0, file.length - ext.length);
  const n = compactName(name);
  const b = compactName(base);
  if (!n || !b) return false;
  const side = idSide(base);
  if (kind === "idBack") {
    if (side !== "back") return false;
    if (!requireLabel && b === n) return true;
    return labelledMatch(b, n, ["身份证", "身份"]);
  }
  if (kind === "id" || kind === "idFront") {
    if (side === "back") return false;
    if (!requireLabel && b === n) return true;
    return labelledMatch(b, n, ["身份证", "身份"]);
  }
  if (!requireLabel && b === n) return true;
  return labelledMatch(b, n, kind === "bank" ? ["银行卡", "银行"] : ["ic卡", "ic", "工卡"]);
}

const PHOTO_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);

const DOC_CN: Record<string, string> = {
  report: "报量单",
  invoice: "发票",
  receipt: "收款回单",
  attendance: "考勤影像",
  contract: "合同扫描件",
  expense: "报销凭证",
  payout: "报销打款",
  insurance: "保险合同",
};

const PHOTO_SUBS = [
  "id",
  "bank",
  "ic",
  "报量单",
  "发票",
  "收款回单",
  "考勤影像",
  "合同扫描件",
  "报销凭证",
  "报销打款",
  "保险合同",
];

async function ensureDirs(): Promise<void> {
  const root = dataDir();
  if (!root) return;
  await mkdir(root, { recursive: true });
  await mkdir(join(root, "accounts"), { recursive: true });
  await mkdir(join(root, "books"), { recursive: true });
  await mkdir(join(root, "backups"), { recursive: true });
  await mkdir(join(root, "templates"), { recursive: true });
  const photos = photosRoot() || join(root, "photos");
  // 历史遗留的全局影像目录（只读回落用，保留以免老文件找不到）
  for (const sub of PHOTO_SUBS) await mkdir(join(photos, sub), { recursive: true });
  // 当前台账自己的影像目录（新文件写这里）
  const bookAssets = bookAssetsRoot();
  if (bookAssets) for (const sub of PHOTO_SUBS) await mkdir(join(bookAssets, sub), { recursive: true });
  const book = bookRoot();
  if (book) await mkdir(book, { recursive: true });
  await migrateIntoDataTree();
  await writeDataReadme();
  seedTemplates();
}

async function migrateIntoDataTree(): Promise<void> {
  const root = dataDir();
  if (!root) return;
  async function moveFile(from: string, to: string) {
    if (!existsSync(from) || existsSync(to)) return;
    await mkdir(dirname(to), { recursive: true });
    try {
      await copyFile(from, to);
    } catch {}
  }
  const defaultDir = join(root, "books", "default");
  await mkdir(defaultDir, { recursive: true });
  await mkdir(join(root, "accounts"), { recursive: true });
  await mkdir(join(root, "backups"), { recursive: true });
  await moveFile(join(root, "accounts.json"), join(root, "accounts", "accounts.json"));
  await moveFile(join(root, "ledger.json"), join(defaultDir, "ledger.json"));
  await moveFile(join(root, "audit.json"), join(defaultDir, "audit.json"));
  await moveFile(join(root, "考勤表.xlsx"), join(root, "backups", "考勤表.xlsx"));
  await migrateOldDocs();
}

async function writeDataReadme(): Promise<void> {
  const root = dataDir();
  if (!root) return;
  const p = join(root, "说明.txt");
  const text = `这是台账的全部数据。软件删了重装，只要这个 data 目录还在，账号、台账、照片、合同影像都能恢复。

accounts/     登录账号、密码、台账名单、权限
books/        每本台账的数字（人员、考勤、发放、合同、操作记录）
photos/       全部影像
  id          身份证正反面（张三-身份证-正面.jpg / 张三-身份证-反面.jpg）
  bank        银行卡
  ic          IC卡
  报量单
  发票
  收款回单
  考勤影像
  合同扫描件
  报销凭证
  报销打款
backups/      Excel 备份（含最新「考勤表.xlsx」）
templates/    导入模板

不要删 books 和 accounts。
`;
  try {
    await writeFile(p, text, "utf8");
  } catch {}
}

/**
 * 把最古老的 `data/docs/<kind>` 结构归拢到公共影像目录。
 *
 * 注意：目标必须是**公共**目录（photosRoot/中文分类），不能是 docsDir——
 * docsDir 现在是按台账分目录的，往那里搬会把整个公共影像池复制进当前台账，
 * 既破坏隔离，又会在每次请求（ensureDirs）里重复拷贝。
 */
async function migrateOldDocs(): Promise<void> {
  const base = photosRoot();
  if (!base) return;
  for (const kind of ["report", "invoice", "receipt", "attendance", "contract", "expense", "payout"]) {
    const dest = join(base, DOC_CN[kind]);
    const root = dataDir();
    const sources = [root ? join(root, "docs", kind) : "", root ? join(root, "docs", DOC_CN[kind]) : ""];
    for (const dir of sources) {
      if (!dir || dir === dest || !existsSync(dir)) continue;
      await mkdir(dest, { recursive: true });
      for (const f of await listDirSafe(dir)) {
        if (f.startsWith(".")) continue;
        const to = join(dest, f);
        if (existsSync(to)) continue;
        try {
          await copyFile(join(dir, f), to);
        } catch {}
      }
    }
  }
}

async function seedTemplates(): Promise<void> {
  const root = dataDir();
  if (!root) return;
  const dir = join(root, "templates");
  await mkdir(dir, { recursive: true });
  const needed: [string, string][] = [
    ["人员导入模板.xlsx", "people"],
    ["发放记录导入模板.xlsx", "payment"],
    ["合同导入模板.xlsx", "contract"],
    ["考勤导入模板.xlsx", "attendance"],
  ];
  if (needed.every(([name]) => existsSync(join(dir, name)))) return;
  try {
    const excel = await import("./excel");
    const { writeCenteredXlsx } = await import("./xlsx-center");
    const year = new Date().getFullYear();
    const wbs: Record<string, () => unknown> = {
      people: () => excel.peopleTemplateWb(),
      payment: () => excel.paymentTemplateWb(),
      contract: () => excel.contractTemplateWb(),
      attendance: () => excel.attendanceTemplateWb(year),
    };
    for (const [name, key] of needed) {
      const p = join(dir, name);
      if (existsSync(p)) continue;
      const buf = await writeCenteredXlsx(wbs[key]() as Parameters<typeof writeCenteredXlsx>[0]);
      await writeFile(p, Buffer.from(buf));
    }
  } catch {}
}

async function listDirSafe(dir: string): Promise<string[]> {
  if (!dir || !existsSync(dir)) return [];
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

async function atomicWriteFile(path: string, data: string | Buffer): Promise<void> {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(tmp, data);
    await rename(tmp, path);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

function ledgerPath(): string {
  return join(bookRoot(), "ledger.json");
}

/** 台账读取结果：empty = 还没有台账文件；unreadable = 文件在但读不出来（损坏/权限/IO） */
export interface LedgerRead extends Partial<LedgerState> {
  empty?: boolean;
  unreadable?: boolean;
}

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

let ledgerWriteQueue: Promise<LedgerWriteResult> = Promise.resolve("ok");

async function writeLedgerNow(data: Partial<LedgerState>, expectedRevision?: string): Promise<LedgerWriteResult> {
  if (!persistOn()) return "ok";
  await ensureDirs();
  // 一次读取同时用于「坏文件保护」和「CAS 比对」，避免读写之间再插入一次读
  const cur = await readLedger();
  if (ledgerUnreadable(cur)) return "unreadable";
  if (expectedRevision !== undefined && ledgerRevisionValue(cur) !== expectedRevision) return "conflict";
  // 原子写：先写临时文件再 rename，避免写一半崩溃导致文件损坏
  const p = ledgerPath();
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await rename(tmp, p);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    await logServer("error", "台账写入失败", { path: p, error: String(err) });
    throw err;
  }
  return "ok";
}

/** 将版本检查和替换放在同一串行队列，避免两个请求同时通过 CAS 检查。 */
export function writeLedger(data: Partial<LedgerState>, expectedRevision?: string): Promise<LedgerWriteResult> {
  const run = () => writeLedgerNow(data, expectedRevision);
  ledgerWriteQueue = ledgerWriteQueue.then(run, run);
  return ledgerWriteQueue;
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

export async function readAudit(): Promise<AuditEntry[]> {
  if (!persistOn()) return [];
  await ensureDirs();
  const p = auditPath();
  if (existsSync(p)) {
    try {
      return parseAuditFile(JSON.parse(await readFile(p, "utf8")));
    } catch (err) {
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
  await atomicWriteFile(auditPath(), JSON.stringify({ entries: entries.slice(0, 2e3) }, null, 2));
}

/** 审计写入串行化：appendAudit 是「读—改—写」，并发不排队必然丢记录 */
let auditQueue: Promise<unknown> = Promise.resolve();

export function appendAudit(row: Partial<AuditEntry>): Promise<AuditEntry> {
  const task = async (): Promise<AuditEntry> => {
    const list = await readAudit();
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

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

export interface PhotoHit {
  path: string;
  file: string;
  dir: string;
  mime: string;
}

export async function findPhotoPath(name: string, kind: string): Promise<PhotoHit | null> {
  if (!persistOn()) return null;
  await ensureDirs();
  const hit = await findPhotoHit(name, kind);
  if (!hit) return null;
  const ext = extname(hit.file).toLowerCase();
  return {
    path: join(hit.dir, hit.file),
    file: hit.file,
    dir: hit.dir,
    mime: MIME[ext] || "image/jpeg",
  };
}

async function findPhotoHit(name: string, kind: string): Promise<{ dir: string; file: string } | null> {
  const n = safeName(name);
  if (!n) return null;
  for (const loc of photoSearchDirs(kind)) {
    const hits = (await listDirSafe(loc.dir)).filter((f) => photoFileMatches(f, n, kind, loc.mixed));
    if (!hits.length) continue;
    hits.sort((a, b) => photoRank(b, n, kind) - photoRank(a, n, kind));
    return { dir: loc.dir, file: hits[0] };
  }
  return null;
}

function photoRank(file: string, name: string, kind: string): number {
  const ext = extname(file).toLowerCase();
  const base = file.slice(0, file.length - ext.length);
  const b = compactName(base);
  const want = compactName(name) + compactName(labelOf(kind));
  if (b === want) return 6;
  const side = idSide(base);
  if (kind === "idBack") return side === "back" ? 5 : 1;
  if (kind === "id" || kind === "idFront") {
    if (side === "front") return 5;
    if (side === "plain") return 3;
    return 1;
  }
  return 2;
}

export async function savePhoto(name: string, kind: string, dataUrl: string): Promise<void> {
  if (!persistOn()) return;
  await ensureDirs();
  const n = safeName(name);
  if (!n) return;
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return;
  const mime = m[1];
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("bmp") ? "bmp" : "jpg";
  const dir = kindDir(kind);
  const destName = `${n}-${labelOf(kind)}.${ext}`;
  const dest = join(dir, destName);
  const hit = await findPhotoHit(n, kind);
  await mkdir(dir, { recursive: true });
  const tmp = `${dest}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(tmp, Buffer.from(m[2], "base64"));
    // 只清理本台账目录里的旧文件（换类型/改名留下的）；公共回落目录是只读的，不动
    if (hit && join(hit.dir, hit.file) !== dest && isInsideBookAssets(hit.dir)) await rm(join(hit.dir, hit.file), { force: true });
    await rename(tmp, dest);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

/** 本台账自己的照片目录（写入与删除都只针对这些；公共回落目录不动） */
function bookPhotoDirs(kind: string): string[] {
  const out: string[] = [];
  const book = bookRoot();
  const folder = kindFolder(kind);
  const cn = kind === "idBack" || kind === "id" || kind === "idFront" ? "身份证" : labelOf(kind);
  const add = (d: string) => {
    const v = (d || "").trim();
    if (v && !out.includes(v)) out.push(v);
  };
  add(kindDir(kind));
  if (book) {
    add(join(book, "photos", folder));
    add(join(book, "photos", cn));
    add(join(book, "photos", "id"));
    add(join(book, cn));
  }
  return out;
}

/** 本台账自己的文档目录 */
function bookDocDirs(kind: string): string[] {
  const out: string[] = [];
  const book = bookRoot();
  const add = (d: string) => {
    const v = (d || "").trim();
    if (v && !out.includes(v)) out.push(v);
  };
  add(docsDir(kind));
  if (book) {
    add(join(book, "docs", kind));
    add(join(book, "docs", DOC_CN[kind]));
  }
  return out;
}

export async function removePhoto(name: string, kind: string): Promise<void> {
  if (!persistOn()) return;
  const n = safeName(name);
  if (!n) return;
  // 先删本台账自己的，并记下删掉了哪些文件名
  const removed = new Set<string>();
  for (const d of bookPhotoDirs(kind)) {
    const files = await listDirSafe(d);
    for (const f of files)
      if (photoFileMatches(f, n, kind, true)) {
        removed.add(f);
        await rm(join(d, f), { force: true });
      }
  }
  // 公共回落目录里「本台账归入过的同名副本」一起清掉，避免删了还显示；
  // 只删同名的，别的台账的历史文件一律不动（原实现会把公共目录里所有同名文件删光）
  if (!legacyFallbackOn() || !removed.size) return;
  for (const loc of photoSearchDirs(kind)) {
    if (isInsideBookAssets(loc.dir)) continue;
    const files = await listDirSafe(loc.dir);
    for (const f of files) if (removed.has(f) && photoFileMatches(f, n, kind, loc.mixed)) await rm(join(loc.dir, f), { force: true });
  }
}

export interface PhotoFlagRow {
  id: boolean;
  idBack: boolean;
  bank: boolean;
  ic: boolean;
}

export async function photoFlags(names: string[]): Promise<Record<string, PhotoFlagRow>> {
  const kinds = ["id", "idBack", "bank", "ic"];
  const cache = new Map<string, string[]>();
  async function filesOf(dir: string): Promise<string[]> {
    if (!cache.has(dir)) cache.set(dir, await listDirSafe(dir));
    return cache.get(dir)!;
  }
  const out: Record<string, PhotoFlagRow> = {};
  for (const name of names) {
    const row: PhotoFlagRow = { id: false, idBack: false, bank: false, ic: false };
    for (const kind of kinds)
      for (const loc of photoSearchDirs(kind))
        if ((await filesOf(loc.dir)).some((f) => photoFileMatches(f, name, kind, loc.mixed))) {
          row[kind as keyof PhotoFlagRow] = true;
          break;
        }
    out[name] = row;
  }
  return out;
}

export interface ScanResult {
  flags: Record<string, PhotoFlagRow>;
  matched: Record<keyof PhotoFlagRow, number>;
  dirs: { dir: string; kind: string; count: number; samples: string[] }[];
  people: number;
}

export async function scanPhotoFolder(names: string[]): Promise<ScanResult> {
  await ensureDirs();
  const flags = await photoFlags(names);
  const matched = { id: 0, idBack: 0, bank: 0, ic: 0 };
  for (const n of names) {
    if (flags[n]?.id) matched.id += 1;
    if (flags[n]?.idBack) matched.idBack += 1;
    if (flags[n]?.bank) matched.bank += 1;
    if (flags[n]?.ic) matched.ic += 1;
  }
  const dirs: ScanResult["dirs"] = [];
  const seen = new Set<string>();
  for (const kind of ["id", "bank", "ic"])
    for (const loc of photoSearchDirs(kind)) {
      if (seen.has(loc.dir)) continue;
      seen.add(loc.dir);
      const files = (await listDirSafe(loc.dir)).filter((f) => PHOTO_EXT.has(extname(f).toLowerCase()));
      dirs.push({ dir: loc.dir, kind, count: files.length, samples: files.slice(0, 8) });
    }
  return { flags, matched, dirs, people: names.length };
}

export async function saveBackup(buf: Buffer, filename: string): Promise<string> {
  if (!persistOn()) return "";
  await ensureDirs();
  const root = dataDir();
  const safe = filename.replace(/[\\/]/g, "") || "backup.xlsx";
  const dest = join(root, "backups", safe);
  await mkdir(join(root, "backups"), { recursive: true });
  await writeFile(dest, buf);
  await writeFile(join(root, "backups", "考勤表.xlsx"), buf);
  return dest;
}

/** 文档写入目标：当前台账影像目录下的中文分类（写入只看这里） */
function docsDir(kind: string): string {
  const root = bookAssetsRoot();
  return root ? join(root, DOC_CN[kind]) : "";
}

/** 文档查找目录：当前台账优先，其后全是历史遗留 / 只读回落 */
function docSearchDirs(kind: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (d: string) => {
    const p = (d || "").trim();
    if (!p || seen.has(p)) return;
    seen.add(p);
    out.push(p);
  };
  const root = dataDir();
  const book = bookRoot();
  const photos = photosRoot();
  add(docsDir(kind));
  if (book) {
    add(join(book, "docs", kind));
    add(join(book, "docs", DOC_CN[kind]));
  }
  if (!legacyFallbackOn()) return out;
  // 老版本的全局目录：`photos/<英文kind>` 与 `photos/合同扫描件` 这种中文分类都要回落，
  // 否则升级后已上传的合同扫描件会在界面里凭空消失
  add(photos ? join(photos, kind) : "");
  add(photos ? join(photos, DOC_CN[kind]) : "");
  add(root ? join(root, "docs", kind) : "");
  add(root ? join(root, "docs", DOC_CN[kind]) : "");
  if (isLegacyDefault() && process.env.DOC_DIR?.trim()) add(join(process.env.DOC_DIR.trim(), kind));
  return out;
}

function safeId(id: string): string {
  return id.replace(/[\\/:*?"<>|]/g, "").trim();
}

async function readPointerName(dir: string, sid: string): Promise<string> {
  const ptr = join(dir, `${sid}.name.txt`);
  if (!existsSync(ptr)) return "";
  try {
    return (await readFile(ptr, "utf8")).trim();
  } catch {
    return "";
  }
}

async function otherPointersUse(dir: string, sid: string, fileName: string): Promise<boolean> {
  if (!fileName) return false;
  const files = await listDirSafe(dir);
  for (const f of files) {
    if (!f.endsWith(".name.txt") || f === `${sid}.name.txt`) continue;
    try {
      if ((await readFile(join(dir, f), "utf8")).trim() === fileName) return true;
    } catch {}
  }
  return false;
}

function uniqueFileName(dir: string, orig: string, allow: string): string {
  if (!orig) return orig;
  if (!existsSync(dir) || orig === allow) return orig;
  if (!existsSync(join(dir, orig))) return orig;
  const ext = extname(orig);
  const stem = ext ? orig.slice(0, orig.length - ext.length) : orig;
  let i = 2;
  while (existsSync(join(dir, `${stem}-${i}${ext}`))) i += 1;
  return `${stem}-${i}${ext}`;
}

/** 扫描/删除只在本台账自己的目录里进行，绝不动公共回落目录（那是别人的历史数据） */
async function sweepDocFiles(kind: string, sid: string): Promise<void> {
  for (const d of bookDocDirs(kind)) {
    const files = await listDirSafe(d);
    const prev = await readPointerName(d, sid);
    const shared = prev ? await otherPointersUse(d, sid, prev) : false;
    for (const f of files) {
      if (f.startsWith(`${sid}--`) || f === `${sid}.name.txt`) await rm(join(d, f), { force: true });
      else if (prev && f === prev && !shared) await rm(join(d, f), { force: true });
    }
  }
}

export async function saveDoc(
  id: string,
  kind: string,
  buf: Buffer,
  fileName: string,
  opts: { replace?: boolean } = {},
): Promise<string> {
  if (!persistOn()) return fileName || "";
  await ensureDirs();
  const dir = docsDir(kind);
  if (!dir) return fileName || "";
  await mkdir(dir, { recursive: true });
  const sid = safeId(id);
  if (!sid) return fileName || "";
  const ext = extname(fileName || "").slice(0, 8) || ".bin";
  let orig = (fileName || `file${ext}`).replace(/[\\/]/g, "");
  const prev = await readPointerName(dir, sid);
  const sharedPrev = prev ? await otherPointersUse(dir, sid, prev) : false;
  if (!opts.replace) orig = uniqueFileName(dir, orig, prev && !sharedPrev ? prev : "");
  const tmp = `${dir}/.${sid}.upload-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (kind === "contract" || kind === "expense" || kind === "payout") {
    const dest = join(dir, orig);
    try {
      await writeFile(tmp, buf);
      await sweepDocFiles(kind, sid);
      await rename(tmp, dest);
      await atomicWriteFile(join(dir, `${sid}.name.txt`), orig);
    } catch (err) {
      await rm(tmp, { force: true }).catch(() => {});
      throw err;
    }
  } else {
    try {
      await writeFile(tmp, buf);
      await sweepDocFiles(kind, sid);
      await rename(tmp, join(dir, `${sid}--${orig}`));
    } catch (err) {
      await rm(tmp, { force: true }).catch(() => {});
      throw err;
    }
  }
  return orig;
}

export async function removeDocFile(id: string, kind: string): Promise<void> {
  if (!persistOn()) return;
  await sweepDocFiles(kind, safeId(id));
}

/** 找到文档所在的目录与文件名（供读取和「历史影像归入本台账」共用同一套匹配口径） */
async function findDocLocation(id: string, kind: string): Promise<{ dir: string; file: string; fileName: string } | null> {
  if (!persistOn()) return null;
  const sid = safeId(id);
  for (const d of docSearchDirs(kind)) {
    const files = await listDirSafe(d);
    const hit = files.find((f) => f.startsWith(`${sid}--`));
    if (hit) return { dir: d, file: hit, fileName: hit.slice(`${sid}--`.length) || hit };
    const orig = await readPointerName(d, sid);
    if (orig && files.includes(orig)) return { dir: d, file: orig, fileName: orig };
  }
  return null;
}

export async function findDoc(id: string, kind: string): Promise<{ buf: Buffer; fileName: string } | null> {
  const loc = await findDocLocation(id, kind);
  if (!loc) return null;
  return { buf: await readFile(join(loc.dir, loc.file)), fileName: loc.fileName };
}

function isInsideBookAssets(dir: string): boolean {
  const bookDir = bookAssetsRoot();
  return Boolean(bookDir) && (dir === bookDir || dir.startsWith(bookDir + sep));
}

export interface AdoptResult {
  photos: number;
  docs: number;
  skipped: number;
}

/**
 * A 项迁移动作：把历史遗留（全局）目录里的影像，按**本台账的人员姓名 / 影像 id**
 * 复制进本台账自己的影像目录。
 *
 * 只复制、不删除、不覆盖；遗留目录原样保留，因此随时可以回退（读取本来就有回落）。
 * 复用应用自身的匹配口径（findPhotoHit / findDocLocation），不另外写一套判断。
 */
export async function adoptLegacyAssets(): Promise<AdoptResult> {
  const out: AdoptResult = { photos: 0, docs: 0, skipped: 0 };
  if (!persistOn()) return out;
  await ensureDirs();
  const bookDir = bookAssetsRoot();
  if (!bookDir) return out;
  const led = await readLedger();
  if (ledgerUnreadable(led)) return out;

  const names = (Array.isArray(led.people) ? led.people : [])
    .map((p) => safeName(String((p as { name?: string })?.name || "")))
    .filter(Boolean);

  const copyInto = async (fromDir: string, file: string, destDir: string): Promise<void> => {
    const dest = join(destDir, file);
    if (existsSync(dest)) {
      out.skipped += 1;
      return;
    }
    try {
      await mkdir(destDir, { recursive: true });
      await copyFile(join(fromDir, file), dest);
      out.photos += 1;
    } catch (err) {
      await logServer("warn", "影像归入失败", { from: join(fromDir, file), error: String(err) });
    }
  };

  for (const kind of ["id", "idBack", "bank", "ic"]) {
    const destDir = join(bookDir, kindFolder(kind));
    for (const name of names) {
      const hit = await findPhotoHit(name, kind);
      if (!hit || isInsideBookAssets(hit.dir)) continue;
      await copyInto(hit.dir, hit.file, destDir);
    }
  }

  const idsFor = (kind: string): string[] => {
    const ids: string[] = [];
    const push = (v: unknown) => {
      const s = safeId(String(v || ""));
      if (s) ids.push(s);
    };
    if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract")
      for (const c of Array.isArray(led.contracts) ? led.contracts : []) push((c as { id?: string })?.id);
    if (kind === "attendance")
      for (const d of Array.isArray(led.attendanceDocs) ? led.attendanceDocs : []) push((d as { id?: string })?.id);
    if (kind === "expense")
      for (const e of Array.isArray(led.expenses) ? led.expenses : []) {
        push((e as { id?: string })?.id);
        push((e as { voucherId?: string })?.voucherId);
      }
    if (kind === "payout")
      for (const e of Array.isArray(led.expenses) ? led.expenses : []) push((e as { payoutId?: string })?.payoutId);
    if (kind === "insurance")
      for (const p of Array.isArray(led.insurancePolicies) ? led.insurancePolicies : []) {
        push((p as { id?: string })?.id);
        for (const f of (p as { contracts?: { id?: string }[] })?.contracts || []) push(f?.id);
      }
    return [...new Set(ids)];
  };

  for (const kind of Object.keys(DOC_CN)) {
    const destDir = join(bookDir, DOC_CN[kind]);
    for (const sid of idsFor(kind)) {
      const loc = await findDocLocation(sid, kind);
      if (!loc || isInsideBookAssets(loc.dir)) continue;
      const dest = join(destDir, loc.file);
      if (existsSync(dest)) {
        out.skipped += 1;
        continue;
      }
      try {
        await mkdir(destDir, { recursive: true });
        await copyFile(join(loc.dir, loc.file), dest);
        out.docs += 1;
      } catch (err) {
        await logServer("warn", "文档归入失败", { from: join(loc.dir, loc.file), error: String(err) });
      }
    }
  }
  await logServer("info", "历史影像归入本台账完成", { ...out });
  return out;
}

function contractScanBase(name: string): string {
  return (name || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "");
}

async function reconcileContractScans(raw: { contracts?: { id?: string; name?: string; scanFileName?: string }[] }): Promise<boolean> {
  const list = raw?.contracts;
  if (!Array.isArray(list) || !list.length) return false;
  const dirs = docSearchDirs("contract");
  const all: string[] = [];
  for (const d of dirs)
    for (const f of await listDirSafe(d)) {
      if (f.endsWith(".name.txt") || f.startsWith(".")) continue;
      all.push(f);
    }
  let changed = false;
  for (const c of list) {
    if (c.scanFileName) continue;
    const sid = safeId(c.id || "");
    let found = "";
    const prefixed = all.find((f) => sid && f.startsWith(`${sid}--`));
    if (prefixed) found = prefixed.slice(`${sid}--`.length);
    if (!found && sid) {
      for (const d of dirs) {
        const orig = await readPointerName(d, sid);
        if (orig && all.includes(orig)) {
          found = orig;
          break;
        }
      }
    }
    if (!found) {
      const base = contractScanBase(c.name || "");
      if (base) {
        const prefix = `${base}-合同电子版`;
        const hit = all.find((f) => f === prefix || f.startsWith(`${prefix}.`));
        if (hit) found = hit;
      }
    }
    if (found) {
      c.scanFileName = found;
      changed = true;
    }
  }
  return changed;
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
