/**
 * 「写操作失败必须看得见」的守卫（1.8.14，对应 2026-09-17 专家评审 A11 / B2）。
 *
 * 这两条的共同特点是：**失败了界面一声不响**，用户以为成功了。
 *   · A11：`await authOp(...)` / `await setDoc(...)` / `await removeDoc(...)` 没有 catch ——
 *     authOp、setDoc、removeDoc 失败都是**抛错**，没有 catch 就只剩一条 unhandledrejection，
 *     屏幕上一个字都不显示（保险页那个 413「文件太大，最大 50MB」的文案永远看不到）。
 *   · B2：自动保存失败只在第一次弹 toast，之后全静默；401（登录失效）被写成「请检查网络」。
 *
 * 单元测试测不到（要真实浏览器 + 真实后端），所以钉成静态扫描 + 纯状态机断言。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  resetSyncStatusForTest,
  setSyncFailed,
  setSyncIdle,
  subscribeSyncStatus,
  syncMessageSnapshot,
  syncStateSnapshot,
} from "../src/lib/sync-status";
import { expectMinHits } from "./min-hits";

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

/**
 * 这些调用失败会**抛错**（见各自实现）：没有 catch 时界面完全没反应。
 * 每项写明「防的是什么」，附上评审给的原始行号，方便回溯。
 */
const MUST_CATCH: { file: string; call: string; why: string }[] = [
  { file: "src/components/settings/members-card.tsx", call: 'authOp("removeMember"', why: "A11:73 把成员移出台账失败" },
  { file: "src/components/settings/members-card.tsx", call: 'authOp("setMember"', why: "A11:89 保存成员权限失败" },
  { file: "src/components/settings/members-card.tsx", call: 'authOp("addMember"', why: "A11:125 把成员加进台账失败" },
  { file: "src/routes/insurance.tsx", call: 'setDoc(id, "insurance"', why: "A11:589 保险合同上传（413 文件太大）" },
  { file: "src/components/doc-actions.tsx", call: "setDoc(id, kind, named", why: "A11:374 影像替换/上传" },
  { file: "src/components/doc-actions.tsx", call: "removeDoc(id, kind)", why: "A11:409 影像删除" },
  { file: "src/routes/attendance.tsx", call: "setDoc(id, \"attendance\"", why: "A11:629 考勤影像上传" },
];

/** 该调用点前后 900 字符里有没有 try + catch + toast.error */
function guarded(text: string, call: string): { ok: boolean; why: string } {
  const at = text.indexOf(call);
  if (at < 0) return { ok: false, why: "找不到这个调用（是不是改名/搬文件了？）" };
  const win = text.slice(Math.max(0, at - 900), at + 900);
  if (!/try\s*\{/.test(win)) return { ok: false, why: "附近没有 try {" };
  if (!/catch\s*\(/.test(win)) return { ok: false, why: "附近没有 catch（失败会静默）" };
  if (!/toast\.error\(/.test(win)) return { ok: false, why: "catch 里没有 toast.error（用户看不到原因）" };
  return { ok: true, why: "" };
}

test("A11：这 7 处写操作必须有 catch + toast.error（失败不许无声无息）", async () => {
  const bad: string[] = [];
  let found = 0;
  for (const item of MUST_CATCH) {
    const text = stripComments(await src(item.file));
    const r = guarded(text, item.call);
    if (r.ok) found += 1;
    if (!r.ok) bad.push(`${item.file} · ${item.call} —— ${item.why}：${r.why}`);
  }
  // 命中数下限自检（专家评审 C2 / tests/min-hits.ts）：调用点被改名、文件被搬家时，
  // guarded() 会「找不到调用」——上面那条 deepEqual 也会红，但这里把下限单独钉死更直白
  expectMinHits("A11：扫描到的写调用点", found, MUST_CATCH.length, "评审列出的 7 处写操作");
  assert.deepEqual(bad, [], `写操作失败必须弹出来（服务端原文 || 可读文案）：\n${bad.join("\n")}`);
});

test("A11 守卫自检：扫描识别得出来（0 命中 / 无 catch 都必须判失败）", () => {
  const good = `try { await authOp("x"); } catch (e) { toast.error("失败"); }`;
  assert.equal(guarded(good, 'authOp("x")').ok, true);
  assert.equal(guarded(`await authOp("x");`, 'authOp("x")').ok, false);
  assert.equal(guarded(`try { await authOp("x"); } finally {}`, 'authOp("x")').ok, false);
  // 找不到被扫的调用 → 必须失败（防「文件改名/删了调用，守卫假绿」）
  assert.equal(guarded(good, 'authOp("不存在")').ok, false);
});

test("B2：「未同步」状态机：失败可见、成功清除、内容变了要通知订阅者", () => {
  resetSyncStatusForTest();
  assert.equal(syncStateSnapshot(), "idle");
  let notices = 0;
  const off = subscribeSyncStatus(() => {
    notices += 1;
  });
  setSyncFailed("保存到服务器失败，请检查网络后重试");
  assert.equal(syncStateSnapshot(), "failed");
  assert.match(syncMessageSnapshot(), /保存到服务器失败/);
  assert.equal(notices, 1);
  // 同一句重复设置不必再通知（避免每次自动保存失败都重渲染）
  setSyncFailed("保存到服务器失败，请检查网络后重试");
  assert.equal(notices, 1);
  setSyncFailed("登录已失效，请重新登录");
  assert.equal(notices, 2);
  assert.match(syncMessageSnapshot(), /登录已失效/);
  setSyncIdle();
  assert.equal(syncStateSnapshot(), "idle");
  assert.equal(syncMessageSnapshot(), "");
  assert.equal(notices, 3);
  off();
});

test("B2：401（会话失效）必须单独文案，不许写成「请检查网络」；成功后必须清除未同步状态", async () => {
  const sync = stripComments(await src("src/lib/nas-sync.ts"));
  // 只看 PUT（pushNasLedgerNow）里的 401 分支：拉取路径的 401 故意不弹（登录页已经在提示）
  const push = sync.slice(sync.indexOf("async function pushNasLedgerNow"));
  const i401 = push.indexOf("r.status === 401");
  assert.ok(i401 > 0, "nas-sync 必须显式处理 push 的 401（会话失效）");
  const seg = push.slice(i401, i401 + 400);
  assert.match(seg, /登录已失效/, "401 的文案必须是「登录已失效，请重新登录」，不是「请检查网络」");
  // 成功路径必须清状态（dirty / 未同步横幅）
  assert.match(sync, /function syncOk\(\)/, "必须有 syncOk()：成功时清 dirty + 未同步状态");
  assert.match(sync, /setSyncIdle\(\)/, "成功后要清「未同步」状态");
  assert.match(sync, /setSyncFailed\(/, "失败要写进「未同步」状态（顶部横幅）");
  // 持久失败只弹一次 toast，靠横幅持续显示
  assert.match(sync, /failedNotified/, "toast 只弹一次（failedNotified），持续可见交给横幅");
});

test("B2：顶部必须有「未同步」横幅，且打印时不印", async () => {
  const banner = stripComments(await src("src/components/shell/sync-banner.tsx"));
  assert.match(banner, /syncStateSnapshot|syncState/, "横幅要读 sync-status 的状态");
  assert.match(banner, /no-print/, "横幅是屏幕内容，打印时必须隐藏（no-print）");
  const shell = stripComments(await src("src/components/shell.tsx"));
  assert.match(shell, /<SyncUnsyncedBanner\s*\/>/, "应用外壳必须挂上横幅，否则状态没人显示");
});

test("B2：换账号/换台账/退出登录清缓存时必须一并清掉未同步提示", async () => {
  const sync = stripComments(await src("src/lib/nas-sync.ts"));
  const drop = sync.slice(sync.indexOf("export function dropLocalLedger"), sync.indexOf("export function checkCacheOwner"));
  assert.match(drop, /setSyncIdle\(\)/, "dropLocalLedger 里要收掉上一本台账留下的「未同步」提示");
});

test("B2：横幅必须挂在应用外壳里（写了不挂 = 等于没修）", async () => {
  const shell = stripComments(await src("src/components/shell.tsx"));
  assert.match(shell, /import \{ SyncUnsyncedBanner \} from "\.\/shell\/sync-banner"/, "shell.tsx 要 import 横幅");
  assert.match(shell, /<SyncUnsyncedBanner\s*\/>/, "shell.tsx 要在页面里渲染横幅");
});
