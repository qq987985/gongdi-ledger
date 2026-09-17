/**
 * 影像资产层：照片（证件照/IC卡）与文档（报量单/发票/回单/合同扫描件等）的
 * 查找、写入、删除、跨目录迁移。只依赖路径层（paths.server），不依赖台账/审计；
 * 需要台账内容时由调用方传入（如 adoptLegacyAssets(led)）。
 */
import { existsSync } from "node:fs";
import { extname, join, sep } from "node:path";
import { copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { logServer } from "./log.server";
// 影像层**不 import 台账存储**（§12.2）：这个类型在叶子 `./types` 里定义。
// 要台账内容时由调用方传入（`adoptLegacyAssets(led)`），不是反向依赖 nas-fs.server（G2 / 评审 A2）。
import type { LedgerRead } from "./types";
import {
  atomicWriteFile,
  bookAssetsRoot,
  bookRoot,
  dataDir,
  DOC_CN,
  ensureDirs,
  isLegacyDefault,
  listDirSafe,
  persistOn,
  photosRoot,
} from "./paths.server";

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

/**
 * 照片写入要求的 data URL 形状（**唯一来源**：savePhoto 与本文件的判定函数共用同一份正则）。
 *
 * 名称/内容不合规时 savePhoto 会静默不写盘，路由必须在调用前用下面三个判定函数先返回 400，
 * 否则「没写盘却回 200」又是一类静默失败（与 §5 上传/下载必须检查结果同源）。
 */
const PHOTO_DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

/** 名字去掉非法字符后还能落盘吗（空 = savePhoto/removePhoto 会静默跳过） */
export function photoNameWritable(name: unknown): boolean {
  return Boolean(safeName(String(name ?? "")));
}

/** 是「data:image/…;base64,…」形状吗（否则 savePhoto 会静默跳过） */
export function isWritablePhotoDataUrl(dataUrl: unknown): boolean {
  return PHOTO_DATA_URL_RE.test(String(dataUrl ?? ""));
}

/** 文档 id 去掉非法字符后还能落盘吗（空 = saveDoc 会静默跳过） */
export function docIdWritable(id: unknown): boolean {
  return Boolean(safeId(String(id ?? "")));
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
 * 目录项缓存（性能）。
 *
 * 为什么需要：影像查找是「列目录 + 文件名匹配」，而一次页面渲染会对同一批目录反复 readdir
 * （photoFlags 是 人数 × 4 类 × ~14 个回落目录；每次 GET 台账还会调 reconcileContractScans 全扫一遍）。
 * 这里只缓存**目录项列表**（绝不缓存文件内容），键 = 目录绝对路径。
 *
 * 失效有三条路，缺一不可：
 * 1. mtime 校验：每次取用都 stat 目录取 mtimeMs，与缓存记录不同就重新 readdir（外部改动也能看到）；
 * 2. TTL 兜底：默认 3000ms（`ASSETS_CACHE_MS` 可配，0 = 完全关闭），避免 stat 开销和文件系统
 *    mtime 精度不足（同一毫秒内两次改动）导致的漏刷；
 * 3. 主动失效：上传/删除/改名等写路径调用 invalidateDirCache，保证「刚上传的立刻能查到、
 *    刚删除的立刻查不到」——不依赖 mtime 精度。
 *
 * stat 失败（目录不存在/不可读）时**不缓存**并返回空，与 listDirSafe 的既有行为一致。
 */
interface DirEntryCache {
  names: string[];
  mtimeMs: number;
  at: number;
}

const dirEntryCache = new Map<string, DirEntryCache>();

/** 缓存 TTL（ms）：0 = 关闭缓存；未配置/非法值用默认 3000ms */
export function assetsCacheMs(): number {
  const raw = process.env.ASSETS_CACHE_MS;
  if (raw === undefined || raw.trim() === "") return 3000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 3000;
}

/** 主动失效某个目录的缓存（写路径必须调用；空串忽略） */
export function invalidateDirCache(dir: string): void {
  if (dir) dirEntryCache.delete(dir);
}

/** 清空全部目录缓存（测试与迁移场景用） */
export function clearAssetDirCache(): void {
  dirEntryCache.clear();
}

/** 当前缓存的目录数（仅用于测试/诊断：TTL=0 时必须恒为 0） */
export function assetsDirCacheSize(): number {
  return dirEntryCache.size;
}

/** 带失效的目录项列表：缓存未过期且目录 mtime 未变时直接返回，否则重新 readdir */
export async function listDirCached(dir: string): Promise<string[]> {
  if (!dir) return [];
  const ttl = assetsCacheMs();
  if (ttl <= 0) return listDirSafe(dir);
  let mtimeMs: number;
  try {
    mtimeMs = (await stat(dir)).mtimeMs;
  } catch {
    // 目录不存在/读不到：不缓存、返回空（与 listDirSafe 一致）
    dirEntryCache.delete(dir);
    return [];
  }
  const now = Date.now();
  const hit = dirEntryCache.get(dir);
  if (hit && hit.mtimeMs === mtimeMs && now - hit.at < ttl) return hit.names;
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    dirEntryCache.delete(dir);
    return [];
  }
  dirEntryCache.set(dir, { names, mtimeMs, at: now });
  return names;
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
    const hits = (await listDirCached(loc.dir)).filter((f) => photoFileMatches(f, n, kind, loc.mixed));
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
  const m = dataUrl.match(PHOTO_DATA_URL_RE);
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
    // 新文件先 rename 就位，再清旧文件（与 saveDoc 同一原则：先就位后清旧）。
    // 原顺序（先删旧再 rename）在 rename 失败时会两头空：旧照片已删、新照片还是临时名被清掉。
    await rename(tmp, dest);
    // 只清理本台账目录里的旧文件（换类型/改名留下的）；公共回落目录是只读的，不动
    if (hit && join(hit.dir, hit.file) !== dest && isInsideBookAssets(hit.dir))
      await rm(join(hit.dir, hit.file), { force: true }).catch(async (e) => {
        // 清旧失败只是留下一份旧副本（新文件已就位），记日志即可，不能让保存报错
        await logServer("warn", "旧照片清理失败（新照片已保存）", { file: join(hit.dir, hit.file), error: String(e) });
      });
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
  // 写路径主动失效：新照片立即可查、被清掉的旧照片立即不可查（不依赖 mtime 精度）
  invalidateDirCache(dir);
  if (hit) invalidateDirCache(hit.dir);
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
    let touched = false;
    for (const f of files)
      if (photoFileMatches(f, n, kind, true)) {
        removed.add(f);
        await rm(join(d, f), { force: true });
        touched = true;
      }
    if (touched) invalidateDirCache(d);
  }
  // 公共回落目录里「本台账归入过的同名副本」一起清掉，避免删了还显示；
  // 只删同名的，别的台账的历史文件一律不动（原实现会把公共目录里所有同名文件删光）
  if (!legacyFallbackOn() || !removed.size) return;
  for (const loc of photoSearchDirs(kind)) {
    if (isInsideBookAssets(loc.dir)) continue;
    const files = await listDirSafe(loc.dir);
    let touched = false;
    for (const f of files)
      if (removed.has(f) && photoFileMatches(f, n, kind, loc.mixed)) {
        await rm(join(loc.dir, f), { force: true });
        touched = true;
      }
    if (touched) invalidateDirCache(loc.dir);
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
    // 本地 map 只是同一次调用内的 memo（省掉重复 stat），真正的缓存与失效在 listDirCached
    if (!cache.has(dir)) cache.set(dir, await listDirCached(dir));
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
      const files = (await listDirCached(loc.dir)).filter((f) => PHOTO_EXT.has(extname(f).toLowerCase()));
      dirs.push({ dir: loc.dir, kind, count: files.length, samples: files.slice(0, 8) });
    }
  return { flags, matched, dirs, people: names.length };
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
  const files = await listDirCached(dir);
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

/**
 * 清理本台账自己目录里的旧文件，绝不动公共回落目录（那是别人的历史数据）。
 *
 * 调用时机有讲究：必须在「新文件已经 rename 就位之后」再调（saveDoc），
 * 不能在新文件就位之前删旧——否则崩溃窗口内旧文件已删、新文件还是隐藏临时名，影像就丢了。
 * opts.prev / opts.sharedPrev 由调用方在改指针**之前**读好传进来：
 * 扫的时候若指针已指向新名，旧文件名将再也算不出来，旧文件就成了删不掉的孤儿。
 */
async function sweepDocFiles(
  kind: string,
  sid: string,
  opts: { keep?: string; prev?: string; sharedPrev?: boolean; dropPointer?: boolean } = {},
): Promise<void> {
  const { keep = "", prev = "", sharedPrev = false, dropPointer = true } = opts;
  for (const d of bookDocDirs(kind)) {
    const files = await listDirSafe(d);
    let touched = false;
    for (const f of files) {
      if (keep && f === keep) continue;
      if (f.startsWith(`${sid}--`) || f === `${sid}.name.txt`) {
        if (f !== `${sid}.name.txt` || dropPointer) {
          await rm(join(d, f), { force: true });
          touched = true;
        }
      } else if (prev && f === prev && !sharedPrev) {
        await rm(join(d, f), { force: true });
        touched = true;
      }
    }
    if (touched) invalidateDirCache(d);
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
  // 改指针之前先读出旧指针与共享情况（sweep 要用；扫的时候指针已换新名就算不出旧名了）
  const prev = await readPointerName(dir, sid);
  const sharedPrev = prev ? await otherPointersUse(dir, sid, prev) : false;
  if (!opts.replace) orig = uniqueFileName(dir, orig, prev && !sharedPrev ? prev : "");
  const tmp = `${dir}/.${sid}.upload-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  // 合同/报销/打款三类按「指针 + 原始文件名」存（同名可多人共用，靠指针找回）；
  // 其余按「id--文件名」前缀存（findDoc 直接前缀匹配）。
  const pointed = kind === "contract" || kind === "expense" || kind === "payout";
  const dest = join(dir, pointed ? orig : `${sid}--${orig}`);
  try {
    await writeFile(tmp, buf);
    // 1) 新文件先就位（原子 rename）；此后任何一步崩溃，旧文件/旧指针都还在，不会丢影像
    await rename(tmp, dest);
    // 2) 指针指向新文件（同样是原子写）
    if (pointed) await atomicWriteFile(join(dir, `${sid}.name.txt`), orig);
    // 3) 新文件就位后才清旧：同名前缀的旧文件、未被其它 id 共享的旧指针目标
    //    （keep 传文件名——sweep 比较的是 readdir 出来的 basename，传全路径会匹配不上）
    await sweepDocFiles(kind, sid, { keep: pointed ? orig : `${sid}--${orig}`, prev, sharedPrev, dropPointer: false });
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
  // 写路径主动失效：新文档立即可查（sweep 掉旧文件的目录在 sweepDocFiles 里也已失效）
  for (const d of bookDocDirs(kind)) invalidateDirCache(d);
  return orig;
}

export async function removeDocFile(id: string, kind: string): Promise<void> {
  if (!persistOn()) return;
  const sid = safeId(id);
  if (!sid) return;
  // 逐目录先读旧指针再清（与 saveDoc 同一口径：删也要删指针指向的那个文件，共享的除外）
  for (const d of bookDocDirs(kind)) {
    const prev = await readPointerName(d, sid);
    const sharedPrev = prev ? await otherPointersUse(d, sid, prev) : false;
    const files = await listDirSafe(d);
    let touched = false;
    for (const f of files) {
      if (f.startsWith(`${sid}--`) || f === `${sid}.name.txt`) {
        await rm(join(d, f), { force: true });
        touched = true;
      } else if (prev && f === prev && !sharedPrev) {
        await rm(join(d, f), { force: true });
        touched = true;
      }
    }
    if (touched) invalidateDirCache(d);
  }
}

/** 找到文档所在的目录与文件名（供读取和「历史影像归入本台账」共用同一套匹配口径） */
async function findDocLocation(id: string, kind: string): Promise<{ dir: string; file: string; fileName: string } | null> {
  if (!persistOn()) return null;
  const sid = safeId(id);
  for (const d of docSearchDirs(kind)) {
    const files = await listDirCached(d);
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
 *
 * 台账内容必须由调用方传入（assets 不依赖台账存储）：调用方先 readLedger()，
 * 坏台账（unreadable）直接跳过，不要把空结果当成「没有影像」。
 */
export async function adoptLegacyAssets(led: LedgerRead): Promise<AdoptResult> {
  const out: AdoptResult = { photos: 0, docs: 0, skipped: 0 };
  if (!persistOn()) return out;
  await ensureDirs();
  const bookDir = bookAssetsRoot();
  if (!bookDir) return out;

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
      // 归入是写路径：目标目录缓存要失效，否则「刚归入的影像」在 TTL 内查不到
      invalidateDirCache(destDir);
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

export async function reconcileContractScans(raw: { contracts?: { id?: string; name?: string; scanFileName?: string }[] }): Promise<boolean> {
  const list = raw?.contracts;
  if (!Array.isArray(list) || !list.length) return false;
  // 快速路径：没有缺扫描件名的合同时，连目录都不扫（这个函数在每次 readLedger 都被调，
  // 原来无条件 readdir 约 10 个影像目录，大目录下每次读台账都全扫一遍）
  if (list.every((c) => c.scanFileName)) return false;
  const dirs = docSearchDirs("contract");
  const all: string[] = [];
  for (const d of dirs)
    for (const f of await listDirCached(d)) {
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
