/**
 * 1.8.7「权限与账户体验」修复的静态守卫（对应 A 组逐项测试报告第 1/2/3/4/5/6/7/9/10/11 条）。
 *
 * 这些缺陷共同的特点是：**行为对了没人发现、悄悄回退也没人发现**
 * （前端弹「已保存」但服务端 403、换账号不清缓存、导出不留痕、备份只增不减…）。
 * 单元测试测不到（要真实浏览器 + 真实账号），所以把「必须写成什么样」钉成静态扫描：
 * 谁把守卫删了，`pnpm test` 立刻红。
 *
 * 命名约定：每条断言都写明「防的是什么」，出错信息里带上 A 组报告的项号。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

async function src(p: string): Promise<string> {
  return readFile(repo(p), "utf8");
}

/** 去掉注释：注释里写着「以前怎么错的」不算代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

/** 有编辑/新增/删除入口的模块页面：都必须走 blockedWrite（或 DocActions 的 readOnly） */
const EDIT_PAGES = [
  "src/routes/people.tsx",
  "src/routes/attendance.tsx",
  "src/routes/payments.tsx",
  "src/routes/contracts.tsx",
  "src/routes/expenses.tsx",
  "src/routes/insurance.tsx",
  "src/routes/photos.tsx",
];

test("第 1 项：有编辑入口的页面必须调用 blockedWrite（只读账号不许再弹「已保存」）", async () => {
  const bad: string[] = [];
  for (const f of EDIT_PAGES) {
    const text = stripComments(await src(f));
    if (!text.includes("blockedWrite(")) bad.push(`${f}: 没有 blockedWrite( 守卫`);
    if (!/from "~\/lib\/readonly"/.test(text)) bad.push(`${f}: 没有 import readonly 守卫`);
  }
  // 影像资料页用 DocActions 的 readOnly 隐藏「替换/删除」，同样要求显式传入
  const files = stripComments(await src("src/routes/files.tsx"));
  if (!/readOnly=\{!canEdit/.test(files)) bad.push("src/routes/files.tsx: DocActions 没有按权限传 readOnly");
  assert.deepEqual(bad, [], `只读账号的改动存不下去，必须拦在入口：\n${bad.join("\n")}`);
});

test("第 1 项：出现「已保存/已添加/已删除」成功提示的页面必须有写入守卫", async () => {
  const bad: string[] = [];
  for (const f of EDIT_PAGES) {
    const text = stripComments(await src(f));
    const saysSuccess = /toast\.success\(\s*[`"]?[^)]*?(已保存|已添加|已删除|已上传|已记到)/.test(text);
    if (saysSuccess && !text.includes("blockedWrite(")) bad.push(`${f}: 会弹成功提示，却没有 blockedWrite( 守卫`);
  }
  assert.deepEqual(bad, [], `有成功提示就必须先过守卫（否则只读账号会看到假成功）：\n${bad.join("\n")}`);
});

test("第 1 项补充：只读提示文案必须写清「改动不会保存」", async () => {
  const ro = await src("src/lib/readonly.ts");
  assert.match(ro, /你是只读账号/);
  assert.match(ro, /改动不会保存/);
  // 判据必须与服务端 PUT /api/ledger 一致：canManageLedger（ledger.manage）且模块 .edit
  assert.match(ro, /canManageLedger/);
  assert.match(ro, /hasPerm/);
});

test("第 2 项：换账号/换台账/退出登录必须清本机台账缓存，且拉取 401/403 时也要清", async () => {
  const sync = stripComments(await src("src/lib/nas-sync.ts"));
  assert.match(sync, /export function dropLocalLedger/, "nas-sync 必须导出 dropLocalLedger");
  assert.match(sync, /checkCacheOwner/, "必须有「本机缓存属于哪个账号::台账」的归属检查");
  // 拉取被拒（401/403）时清空：不这么做，没有 people.view 的账号会看到上一个账号的工资数字
  assert.match(sync, /r\.status === 401 \|\| r\.status === 403/, "拉取 401/403 必须清空本机缓存");
  assert.match(sync, /dropLocalLedger\(`读取台账被拒/);

  const shell = stripComments(await src("src/components/shell.tsx"));
  assert.match(shell, /dropLocalLedger\("退出登录"\)/, "退出登录要清缓存");
  assert.match(shell, /checkCacheOwner/, "进系统时要按「账号::台账」判断缓存归属");

  const switcher = stripComments(await src("src/components/shell/book-switcher.tsx"));
  assert.match(switcher, /dropLocalLedger\(/, "切换台账要先丢掉上一本的残留");
});

test("第 3 项：改密码失败必须有界面提示（不许静默 unhandledrejection）", async () => {
  const card = stripComments(await src("src/components/settings/accounts-card.tsx"));
  const seg = card.slice(card.indexOf('authOp("changePassword"'));
  assert.ok(seg.length > 0, "找不到 changePassword 调用");
  const around = card.slice(Math.max(0, card.indexOf('authOp("changePassword"') - 300), card.indexOf('authOp("changePassword"') + 300);
  assert.match(around, /catch/, "changePassword 必须 try/catch");
  assert.match(around, /toast\.error/, "失败必须 toast.error（服务端返回 400「当前密码不对」）");
});

test("第 4 项：新建/改名/删除台账后必须派发 gongdi-books（左侧下拉立即同步）", async () => {
  const card = stripComments(await src("src/components/settings/accounts-card.tsx"));
  const create = card.slice(card.indexOf('authOp("createBook"') - 200, card.indexOf('authOp("createBook"') + 500);
  assert.match(create, /gongdi-books/, "新建台账后必须 dispatchEvent(new Event(\"gongdi-books\"))");
  const switcher = stripComments(await src("src/components/shell/book-switcher.tsx"));
  assert.match(switcher, /gongdi-books/, "台账下拉自己的建/改名也要广播");
});

test("第 5 项：导出必须写操作记录（模块/操作/内容）", async () => {
  const kind = stripComments(await src("src/routes/api/file/$kind.ts"));
  assert.match(kind, /appendAudit\(/, "导出路由必须 appendAudit");
  assert.match(kind, /module: "导出"/, "模块名必须是「导出」");
  assert.match(kind, /action,/, "要有操作名");
  assert.match(kind, /detail: filename/, "内容要写文件名");
  // 六种导出都要留痕（xlsxFile 直出 = 漏记）
  const direct = [...kind.matchAll(/return xlsxFile\(build\w+/g)].map((m) => m[0]);
  assert.deepEqual(direct, [], `这些导出绕过了留痕，直接 return xlsxFile：\n${direct.join("\n")}`);
});

test("第 6 项：操作记录页必须有批量删（接口 ?ids= + 说明删几条/不可恢复）", async () => {
  const audit = stripComments(await src("src/routes/audit.tsx"));
  assert.match(audit, /\?ids=/, "界面必须调用批量删接口 DELETE /api/audit?ids=");
  assert.match(audit, /删除所选/, "必须有批量删除入口");
  assert.match(audit, /删除后无法恢复/, "确认框必须写明不可恢复");
  assert.match(audit, /条操作记录/, "确认框必须写明删几条");
});

test("第 7 项：备份必须有保留策略（saveBackup 调 pruneBackups + 设置页提示）", async () => {
  const nas = stripComments(await src("src/lib/nas-fs.server.ts"));
  assert.match(nas, /export function backupKeepCount/, "必须有保留份数（BACKUP_KEEP，默认 30）");
  assert.match(nas, /export function isManagedBackupFile/, "必须只删自己生成的文件名形状");
  assert.match(nas, /export async function pruneBackups/, "必须有清理实现");
  const save = nas.slice(nas.indexOf("export async function saveBackup"), nas.indexOf("export async function listBookIds"));
  assert.match(save, /await pruneBackups\(\)/, "saveBackup 写完必须清理旧备份");

  const health = stripComments(await src("src/routes/api/health.ts"));
  assert.match(health, /backupKeep/, "/api/health 要回 backupKeep 给设置页");
  const settings = stripComments(await src("src/routes/settings.tsx"));
  assert.match(settings, /备份保留策略/, "设置页要有保留策略提示");
  assert.match(settings, /BACKUP_KEEP/);
});

test("第 9 项：首页快捷入口必须按权限过滤", async () => {
  const home = stripComments(await src("src/routes/index.tsx"));
  const quicks = [...home.matchAll(/<Quick [^>]*\/>/g)].map((m) => m[0]);
  assert.equal(quicks.length, 12, "经典/新版各 6 个入口");
  const missing = quicks.filter((q) => !/perm="/.test(q));
  assert.deepEqual(missing, [], `这些快捷入口没有权限声明：\n${missing.join("\n")}`);
  assert.match(home, /useCan\(perm/, "Quick 必须用 useCan 判断可见性");
});

test("第 10 项：删除台账的确认文案必须写明影像资料一起删", async () => {
  const card = stripComments(await src("src/components/settings/accounts-card.tsx"));
  const seg = card.slice(card.indexOf("删除台账「"), card.indexOf("删除台账「") + 400);
  assert.match(seg, /影像资料/, "确认框要说明影像资料（证件照/合同扫描件等）也一起删");
  assert.match(seg, /一起删除/);
  assert.match(seg, /无法恢复/);
});

test("第 11 项：考勤影像上传提示必须是当前年月（不许写死）", async () => {
  const att = stripComments(await src("src/routes/attendance.tsx"));
  assert.doesNotMatch(att, /考勤-20\d\d年\d+月/, "上传提示里不许再出现写死的年月（原来写死 2026年3月）");
  assert.match(att, /考勤-\$\{year\}年\$\{month\}月/, "提示要按当前正在编辑的年月生成");
});

test("账号/台账切换的入口守卫：只读账号看不到「新增/删除年度」", async () => {
  const ys = stripComments(await src("src/components/shell/year-switcher.tsx"));
  assert.match(ys, /<Can perm="settings\.year">/, "年增删按钮必须包在 settings.year 权限里");
  assert.match(ys, /blockedWrite\("settings\.year"/, "addNext/dropYear 也要有守卫兜底");
});
