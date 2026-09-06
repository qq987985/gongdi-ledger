import { existsSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
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

function photosRoot(): string {
  const shared = process.env.PHOTO_DIR?.trim();
  if (shared) return shared;
  const root = dataDir();
  return root ? join(root, "photos") : "";
}

function labelOf(kind: string): string {
  if (kind === "idBack") return "身份证-反面";
  if (kind === "id" || kind === "idFront") return "身份证-正面";
  return kind === "bank" ? "银行卡" : "IC卡";
}

function kindEnv(kind: string): string {
  const k = kind === "idBack" || kind === "idFront" ? "id" : kind;
  return (
    (k === "id" ? process.env.PHOTO_ID_DIR : k === "bank" ? process.env.PHOTO_BANK_DIR : process.env.PHOTO_IC_DIR) || ""
  );
}

function kindDir(kind: string): string {
  const env = kindEnv(kind).trim();
  if (env) return env;
  const root = photosRoot();
  const folder = kind === "idBack" || kind === "idFront" || kind === "id" ? "id" : kind;
  return root ? join(root, folder) : "";
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
  const folder = kind === "idBack" || kind === "idFront" || kind === "id" ? "id" : kind;
  const book = bookRoot();
  const root = dataDir();
  const shared = process.env.PHOTO_DIR?.trim() || (root ? join(root, "photos") : "");
  add(kindDir(kind));
  if (book) {
    add(join(book, "photos", folder));
    add(join(book, "photos", cn));
    add(join(book, "photos", "id"));
    add(join(book, cn));
  }
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

function photosBase(): string {
  const shared = process.env.PHOTO_DIR?.trim();
  if (shared) return shared;
  const root = dataDir();
  return root ? join(root, "photos") : "";
}

async function ensureDirs(): Promise<void> {
  const root = dataDir();
  if (!root) return;
  await mkdir(root, { recursive: true });
  await mkdir(join(root, "accounts"), { recursive: true });
  await mkdir(join(root, "books"), { recursive: true });
  await mkdir(join(root, "backups"), { recursive: true });
  await mkdir(join(root, "templates"), { recursive: true });
  const photos = photosBase() || join(root, "photos");
  for (const sub of [
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
  ])
    await mkdir(join(photos, sub), { recursive: true });
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

async function migrateOldDocs(): Promise<void> {
  for (const kind of ["report", "invoice", "receipt", "attendance", "contract", "expense", "payout"]) {
    const dest = docsDir(kind);
    if (!dest) continue;
    await mkdir(dest, { recursive: true });
    for (const dir of docSearchDirs(kind)) {
      if (dir === dest || !existsSync(dir)) continue;
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

function ledgerPath(): string {
  return join(bookRoot(), "ledger.json");
}

export async function readLedger(): Promise<Partial<LedgerState> & { empty?: boolean }> {
  if (!persistOn()) return { empty: true };
  await ensureDirs();
  const p = ledgerPath();
  if (!existsSync(p)) return { empty: true };
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    if (!raw || typeof raw !== "object") return { empty: true };
    if (await reconcileContractScans(raw))
      try {
        await writeFile(p, JSON.stringify(raw, null, 2), "utf8");
      } catch {}
    return raw;
  } catch {
    return { empty: true };
  }
}

export async function writeLedger(data: Partial<LedgerState>): Promise<void> {
  if (!persistOn()) return;
  await ensureDirs();
  // 原子写：先写临时文件再 rename，避免写一半崩溃导致文件损坏
  const p = ledgerPath();
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, p);
}

function auditPath(): string {
  return join(bookRoot(), "audit.json");
}

export async function readAudit(): Promise<AuditEntry[]> {
  if (!persistOn()) return [];
  await ensureDirs();
  const p = auditPath();
  if (!existsSync(p)) return [];
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    return ((Array.isArray(raw) ? raw : raw.entries || []) as AuditEntry[]).filter(
      (x) => x && x.id && x.action,
    );
  } catch {
    return [];
  }
}

export async function writeAudit(entries: AuditEntry[]): Promise<void> {
  if (!persistOn()) return;
  await ensureDirs();
  // 原子写，避免断电/强杀留下截断的审计文件
  const target = auditPath();
  const tmp = `${target}.tmp`;
  await writeFile(tmp, JSON.stringify({ entries: entries.slice(0, 2e3) }, null, 2), "utf8");
  await rename(tmp, target);
}

export async function appendAudit(row: Partial<AuditEntry>): Promise<AuditEntry> {
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
  if (hit && join(hit.dir, hit.file) !== dest) await rm(join(hit.dir, hit.file), { force: true });
  await mkdir(dir, { recursive: true });
  await writeFile(dest, Buffer.from(m[2], "base64"));
}

export async function removePhoto(name: string, kind: string): Promise<void> {
  if (!persistOn()) return;
  const n = safeName(name);
  if (!n) return;
  for (const loc of photoSearchDirs(kind)) {
    const files = await listDirSafe(loc.dir);
    for (const f of files)
      if (photoFileMatches(f, n, kind, loc.mixed)) await rm(join(loc.dir, f), { force: true });
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

function docsDir(kind: string): string {
  const photos = photosBase();
  return photos ? join(photos, DOC_CN[kind]) : "";
}

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
  const photos = photosBase();
  add(docsDir(kind));
  add(photos ? join(photos, kind) : "");
  add(root ? join(root, "docs", kind) : "");
  add(root ? join(root, "docs", DOC_CN[kind]) : "");
  add(book ? join(book, "docs", kind) : "");
  add(book ? join(book, "docs", DOC_CN[kind]) : "");
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

async function sweepDocFiles(kind: string, sid: string): Promise<void> {
  for (const d of docSearchDirs(kind)) {
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
  await sweepDocFiles(kind, sid);
  if (kind === "contract" || kind === "expense" || kind === "payout") {
    await writeFile(join(dir, orig), buf);
    await writeFile(join(dir, `${sid}.name.txt`), orig, "utf8");
  } else await writeFile(join(dir, `${sid}--${orig}`), buf);
  return orig;
}

export async function removeDocFile(id: string, kind: string): Promise<void> {
  if (!persistOn()) return;
  await sweepDocFiles(kind, safeId(id));
}

export async function findDoc(id: string, kind: string): Promise<{ buf: Buffer; fileName: string } | null> {
  if (!persistOn()) return null;
  const sid = safeId(id);
  for (const d of docSearchDirs(kind)) {
    const files = await listDirSafe(d);
    const hit = files.find((f) => f.startsWith(`${sid}--`));
    if (hit) return { buf: await readFile(join(d, hit)), fileName: hit.slice(`${sid}--`.length) || hit };
    const orig = await readPointerName(d, sid);
    if (orig && files.includes(orig)) return { buf: await readFile(join(d, orig)), fileName: orig };
  }
  return null;
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
}

export async function readVersionText(): Promise<string> {
  // 只读程序目录内的 VERSION.txt；data/ 里的旧文件不再读取（防旧版本号带偏）
  const candidates = [join(process.cwd(), "VERSION.txt"), "/app/VERSION.txt"].filter(Boolean);
  for (const p of candidates)
    try {
      if (!existsSync(p)) continue;
      if (!statSync(p).isFile()) continue;
      return await readFile(p, "utf8");
    } catch {}
  return "";
}
