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
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { countHits, expectMinHits } from "./min-hits";

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

/** 有编辑/新增/删除入口的模块页面：都必须走 blockedWrite（或 DocActions/PhotoSlot 的 readOnly） */
const EDIT_PAGES = [
  "src/routes/people.tsx",
  "src/routes/attendance.tsx",
  "src/routes/payments.tsx",
  "src/routes/contracts.tsx",
  "src/routes/expenses.tsx",
  "src/routes/insurance.tsx",
  "src/routes/photos.tsx",
  // 1.8.14（专家评审 A10）：查询页也有写入口（传证件照 / 替换·删除考勤影像），
  // 原来不在扫描清单里 —— 页面只判 query.view，只读账号点得动而服务端必 403（守卫假绿）
  "src/routes/query.tsx",
];

/** 写入口在子组件里（DocActions / PhotoSlot）的页面：必须显式按权限传 readOnly */
const READONLY_PROP_PAGES = ["src/routes/files.tsx", "src/routes/query.tsx"];

test("第 1 项：有编辑入口的页面必须调用 blockedWrite（只读账号不许再弹「已保存」）", async () => {
  const bad: string[] = [];
  let hitBlockedWrite = 0;
  for (const f of EDIT_PAGES) {
    const text = stripComments(await src(f));
    if (!text.includes("blockedWrite(")) bad.push(`${f}: 没有 blockedWrite( 守卫`);
    if (!/from "~\/lib\/readonly"/.test(text)) bad.push(`${f}: 没有 import readonly 守卫`);
    hitBlockedWrite += countHits(text, /blockedWrite\(/);
  }
  // 影像资料页用 DocActions 的 readOnly 隐藏「替换/删除」，同样要求显式传入
  const files = stripComments(await src("src/routes/files.tsx"));
  if (!/readOnly=\{!canEdit/.test(files)) bad.push("src/routes/files.tsx: DocActions 没有按权限传 readOnly");
  // ── 扫描命中数下限自检（专家评审 C2）：清单漏了页面 / 文件被搬家 / 正则失效时，
  //    上面两个 if 会一条都不触发而「假绿」。这里把「该扫到多少」钉死。
  expectMinHits("只读守卫：EDIT_PAGES 清单里的页面数", EDIT_PAGES.length, 8, "有编辑入口的页面现有 8 个");
  expectMinHits(
    "只读守卫：实际含 blockedWrite( 的调用点数",
    hitBlockedWrite,
    8,
    "8 个页面每页至少一处，实际 10+ 处",
  );
  assert.deepEqual(bad, [], `只读账号的改动存不下去，必须拦在入口：\n${bad.join("\n")}`);
});

test("扫描清单自检：源码里有写入口的页面不许漏出 EDIT_PAGES（防清单漏项假绿）", async () => {
  // 这条专治「清单漏项」：A10 的查询页当时就是**用了 blockedWrite 却没在清单里**，
  // 于是守卫扫不到它、只读账号的编辑入口全开（评审实测到的假绿之一）。
  // 规则：src/routes 下任何调用了 blockedWrite( 的页面，都必须出现在 EDIT_PAGES 里。
  const routes = (await readdir(repo("src/routes"))).filter((f) => /\.tsx$/.test(f));
  expectMinHits("扫描清单自检：扫描到的路由文件数", routes.length, 12, "src/routes 下现有 15 个页面（api/ 在子目录里）");
  const withBlockedWrite: string[] = [];
  for (const f of routes) {
    const text = stripComments(await src(`src/routes/${f}`));
    if (countHits(text, /blockedWrite\(/)) withBlockedWrite.push(`src/routes/${f}`);
  }
  expectMinHits(
    "扫描清单自检：含 blockedWrite( 的页面数",
    withBlockedWrite.length,
    6,
    "写入口收在子组件里的页面（如 files.tsx）不算，现有 8 个",
  );
  const missing = withBlockedWrite.filter((f) => !EDIT_PAGES.includes(f));
  assert.deepEqual(
    missing,
    [],
    `这些页面已经用了 blockedWrite(，却不在 EDIT_PAGES 里 —— 守卫扫不到它们（假绿）：\n` +
      `${missing.join("\n")}\n把它加进 tests/readonly-guards.test.ts 的 EDIT_PAGES。`,
  );
});

test("第 1 项：DocActions / PhotoSlot 的写入口必须按权限传 readOnly（查询页 A10）", async () => {
  const bad: string[] = [];
  for (const f of READONLY_PROP_PAGES) {
    const text = stripComments(await src(f));
    if (!/readOnly=\{!canEdit/.test(text)) bad.push(`${f}: 没有任何 readOnly={!canEdit…} 传入`);
  }
  // 查询页两类入口分别是 photos.edit（照片）与 attendance.edit（考勤影像）：
  // 都必须走 canSaveToServer 同源判定（useCanSave 内部就是它，且随权限变化重渲染）
  const query = stripComments(await src("src/routes/query.tsx"));
  for (const perm of ["photos.edit", "attendance.edit"]) {
    if (!query.includes(`useCanSave("${perm}")`))
      bad.push(`src/routes/query.tsx: 没有用 useCanSave("${perm}") 判定可写`);
  }
  assert.match(
    stripComments(await src("src/components/can.tsx")),
    /canSaveToServer\(perm\)/,
    "useCanSave 的判据必须是 lib/readonly 的 canSaveToServer（不许另写一套判据）",
  );
  if (!/readOnly=\{!canEditPhotos\}/.test(query)) bad.push("src/routes/query.tsx: PhotoSlot 没有传 readOnly");
  if (!/readOnly=\{!canEditDocs\}/.test(query)) bad.push("src/routes/query.tsx: DocActions 没有传 readOnly");
  // PhotoSlot 组件本身必须真的支持这个入参（否则传了也没用）
  const slot = stripComments(await src("src/components/photo-slot.tsx"));
  assert.match(slot, /readOnly\?: boolean/, "PhotoSlot 必须声明 readOnly 入参（A10）");
  assert.match(slot, /readOnly = false/, "PhotoSlot 的 readOnly 要有默认值（老调用点不受影响）");
  assert.deepEqual(bad, [], `只读账号不该看到编辑入口：\n${bad.join("\n")}`);
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
  // G1（1.8.14）：切册的「作废在途拉取 + 清本机 + 拉新册」下沉到 nas-sync 的唯一入口 switchBook ——
  // 这里改成「调用点必须走那个入口」+「入口（enterBookAfterTransition）真的做了这三步」，
  // 比原来只认调用点里出现 dropLocalLedger( 更强（原来只要文件里出现这个词就绿）。
  assert.match(switcher, /switchBook\(/, "左侧下拉切台账必须走 nas-sync.switchBook（顺序唯一实现）");
  const switchBody = sync.slice(sync.indexOf("async function enterBookAfterTransition"), sync.indexOf("export async function switchBook"));
  assert.match(switchBody, /invalidateInFlightPulls\(/, "切册必须作废在途拉取（G1：迟到响应不许覆盖新册）");
  assert.match(switchBody, /dropLocalLedger\(/, "切换台账要先丢掉上一本的残留");
  assert.match(switchBody, /await pullNasLedger\(\)/, "切完必须拉目标台账");
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
  // G1（1.8.14）：createBook 的 authOp 调用下沉到 nas-sync.createBookAndEnter，
  // 这里改认「走唯一入口」+「入口之后真的广播了 gongdi-books」（原来按 authOp("createBook" 定位，
  // 下沉后会 indexOf = -1，守卫会静默扫了个空片段 —— 属于评审点名的「假绿」）。
  assert.match(card, /createBookAndEnter\(/, "设置页新建台账必须走 nas-sync.createBookAndEnter");
  const create = card.slice(card.indexOf("createBookAndEnter("), card.indexOf("createBookAndEnter(") + 500);
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
