/**
 * 路径层：数据目录、台账上下文（AsyncLocalStorage）、目录初始化/迁移、原子写。
 * 只回答「文件该放哪 / 目录是否就绪」，不涉及任何业务实体（台账、影像、文档）。
 * 依赖方向：paths ← assets ← nas-fs，不允许反向。
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { copyFile, mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";

const bookAls = new AsyncLocalStorage<string>();

/** ensureDirs 已就绪的台账（按 bookId 记，切台账后对新台账会再跑一次） */
let ensuredFor = "";

export function dataDir(): string {
  return process.env.DATA_DIR?.trim() || "";
}

export function persistOn(): boolean {
  return Boolean(dataDir());
}

export function safeBookId(id: string): string {
  return id.replace(/[\\/:*?"<>|]/g, "").trim() || "default";
}

export function currentBookId(): string {
  return bookAls.getStore() || "default";
}

export function runWithBook<T>(id: string, fn: () => T): T {
  return bookAls.run(safeBookId(id), fn);
}

/** 台账数字一律在 data/books/{id}/ ，旧的根目录 ledger.json 启动时迁走 */
export function bookRoot(): string {
  const root = dataDir();
  if (!root) return "";
  return join(root, "books", currentBookId());
}

export function isLegacyDefault(): boolean {
  return currentBookId() === "default" && existsSync(join(dataDir(), "ledger.json"));
}

/** 影像总根目录（默认 data/photos，可用 PHOTO_DIR 指定，例如挂到独立盘） */
export function photosRoot(): string {
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
export function bookAssetsRoot(): string {
  const base = photosRoot();
  return base ? join(base, safeBookId(currentBookId())) : "";
}
export const DOC_CN: Record<string, string> = {
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
export async function ensureDirs(): Promise<void> {
  const root = dataDir();
  if (!root) return;
  // 这些 mkdir/迁移/说明文件对每个「数据目录 × 台账」只做一次：readLedger 在每次 GET 和
  // 每次写前 CAS 读都会走到这里，原来每次都重复 30 来个 mkdir + 重写说明.txt，纯读请求也在写盘。
  // 键必须含数据目录本身：测试/多实例场景会换 DATA_DIR，只按台账 id 会把新目录误判成已就绪。
  const key = `${dataDir()}::${currentBookId()}`;
  if (ensuredFor === key) return;
  ensuredFor = key;
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

export async function migrateIntoDataTree(): Promise<void> {
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

export async function writeDataReadme(): Promise<void> {
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
    // 内容是不变的模板，只在文件缺失时写一次（ensureDirs 已按台账限频，这里再兜一层：
    // 用户手改过说明时不覆盖）
    if (!existsSync(p)) await writeFile(p, text, "utf8");
  } catch {}
}

/**
 * 把最古老的 `data/docs/<kind>` 结构归拢到公共影像目录。
 *
 * 注意：目标必须是**公共**目录（photosRoot/中文分类），不能是 docsDir——
 * docsDir 现在是按台账分目录的，往那里搬会把整个公共影像池复制进当前台账，
 * 既破坏隔离，又会在每次请求（ensureDirs）里重复拷贝。
 */
export async function migrateOldDocs(): Promise<void> {
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

export async function listDirSafe(dir: string): Promise<string[]> {
  if (!dir || !existsSync(dir)) return [];
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

export async function atomicWriteFile(path: string, data: string | Buffer): Promise<void> {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await writeFile(tmp, data);
    await rename(tmp, path);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}
