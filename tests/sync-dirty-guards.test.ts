/**
 * 同步脏标记与弹窗交互的守卫（1.8.14，对应 2026-09-17 专家评审 A10 / B3 / B9 / C3）。
 *
 * 这四条都是「行为对了没人发现、悄悄回退也没人发现」的前端约定，单元测试测不到：
 *   · A10：查询页对只读账号仍开着「传照片 / 替换考勤影像」入口（服务端必 403）；
 *   · B3 ：只读账号切年份被当成「本机有改动」→ 弹「没有保存整本台账的权限」，
 *          而且 dirty 永久为真，之后新建/切台账都被问「本机改动会被覆盖」；
 *   · B9 ：保存成功后弹窗不关，再点「关闭」仍被问「有未保存的更改」（假脏标记）；
 *   · C3 ：弹窗内预览按 Esc 连带触发外层的未保存确认；`[data-modal]` 没人赋值＝死代码。
 *
 * 扫描写死「必须长什么样」，另有一条自检保证扫描本身抓得住坏样本（防假绿）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { runMuted, syncMuted } from "../src/lib/sync-mute";
import { expectMinHits } from "./min-hits";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

async function src(p: string): Promise<string> {
  return readFile(repo(p), "utf8");
}

/**
 * 「只有存下去了才复位脏标记」：文件里既要调 resetDirty()，又要判断 onSave 的返回值。
 * （onSave 的实参里可能带对象字面量，所以不能用 `[^)]*`；这里允许最多 160 字符的实参。）
 */
function resetsOnlyWhenSaved(text: string): boolean {
  return /onSave\([\s\S]{0,160}?(?:!==|===) false/.test(text);
}

async function code(p: string): Promise<string> {
  const s = await src(p);
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

test("B3：静音开关本身 —— 窗口内 true、窗口外 false、异常也要复位", () => {
  assert.equal(syncMuted(), false);
  let inside = false;
  const r = runMuted(() => {
    inside = syncMuted();
    return 42;
  });
  assert.equal(inside, true, "runMuted 里必须处于静音状态");
  assert.equal(r, 42, "runMuted 要透传返回值");
  assert.equal(syncMuted(), false, "走出 runMuted 必须复位（否则之后所有改动都不落盘）");
  assert.throws(() => runMuted(() => {
    throw new Error("boom");
  }));
  assert.equal(syncMuted(), false, "抛错也必须复位（finally）");
});

test("B3：纯界面状态（切年份 / 换风格）不得置 dirty，也不能触发整本上传", async () => {
  const store = await code("src/lib/store.ts");
  const setYear = store.slice(store.indexOf("setYear: (year)"), store.indexOf("addYear: (y)"));
  assert.match(setYear, /runMuted\(/, "setYear 必须用 runMuted 包住：切年份不是改台账数据");
  const uiAt = store.lastIndexOf("setUiStyle:");
  const style = store.slice(uiAt, store.indexOf("setAll", uiAt));
  assert.match(style, /runMuted\(/, "setUiStyle 是本机偏好，同样不许置 dirty/推整本台账");
  // 真的改数据的动作必须**保持**置 dirty（不能被顺手静音掉）
  const DATA_ACTIONS = ["upsertPerson:", "addPerson:", "saveAttendanceMonth:", "addPayment:", "upsertExpense:"];
  let checked = 0;
  for (const action of DATA_ACTIONS) {
    const at = store.indexOf(action);
    assert.ok(at > 0, `store 里找不到 ${action}`);
    checked += 1;
    const seg = store.slice(at, at + 400);
    assert.doesNotMatch(seg, /runMuted\(/, `${action} 是真改台账数据，不许静音（静音了就不自动保存了）`);
  }
  // 命中数下限自检（C2）：store 改名/拆文件后 indexOf 全 -1 会一路红，但下限单独钉死更直白
  expectMinHits("B3：抽查的「真改数据」动作数", checked, DATA_ACTIONS.length, "至少 5 个写数据的 action");
  // 订阅侧：静音窗口里既不置 dirty、也不排队推送
  const sync = await code("src/lib/nas-sync.ts");
  assert.match(sync, /if \(syncMuted\(\)\) return;/, "startNasSync 的订阅必须先问 syncMuted()");
  assert.match(sync, /import \{ runMuted, syncMuted \} from "\.\/sync-mute"/, "静音开关唯一实现在 lib/sync-mute.ts");
  const applyRemote = sync.slice(sync.indexOf("function applyRemote"), sync.indexOf("const PUT_HEADERS"));
  assert.match(applyRemote, /runMuted\(fn\)/, "拉取期间也走同一个静音开关（原来是一份本地的 applyingRemote）");
});

test("B3：只读账号切年份不许弹「没有保存整本台账的权限」（权限分支必须先看 dirty）", async () => {
  const sync = await code("src/lib/nas-sync.ts");
  const at = sync.indexOf("if (!canManageLedger(livePerms()))");
  assert.ok(at > 0, "找不到权限分支");
  const seg = sync.slice(at, at + 300);
  assert.match(seg, /if \(dirty\)/, "没权限时只在**真的有本机改动**时才提示 / 记失败状态");
});

test("B9：useGuardedClose 必须有 resetDirty，保存成功后要复位（点关闭不再被误问）", async () => {
  const lib = await code("src/lib/confirm-close.ts");
  assert.match(lib, /resetDirty/, "useGuardedClose 必须提供 resetDirty（原来没有复位入口）");
  assert.match(lib, /return \{ markDirty, resetDirty, requestClose \}/);
  // 四类「本地副本」编辑器：保存成功路径必须复位
  const PAIRS: [string, string][] = [
    ["src/routes/payments.tsx", "resetDirty();"],
    ["src/routes/people.tsx", "resetDirty();"],
    ["src/components/expense-editor.tsx", "resetDirty();"],
    ["src/components/contract-editor.tsx", "markSaved();"],
  ];
  const bad: string[] = [];
  for (const [file, call] of PAIRS) {
    const text = await code(file);
    if (!text.includes("resetDirty")) bad.push(`${file}: 没有从 useGuardedClose 取 resetDirty`);
    else if (!text.includes(call)) bad.push(`${file}: 保存成功后没有调 ${call}`);
    // 只有「存下去了」才复位：onSave 返回 false（只读账号被拦）时不许复位
    if (!resetsOnlyWhenSaved(text)) bad.push(`${file}: 复位前没有判断 onSave(...) !== false`);
  }
  assert.deepEqual(bad, [], `保存成功后必须复位脏标记（B9）：\n${bad.join("\n")}`);
});

test("B9 守卫自检：扫描抓得住「没复位」与「无条件复位」两种坏样本", () => {
  const good = `const { markDirty, resetDirty, requestClose } = useGuardedClose(onCancel);\nif (onSave(next) !== false) resetDirty();`;
  assert.match(good, /resetDirty/);
  assert.equal(resetsOnlyWhenSaved(good), true);
  const noReset = `const { markDirty, requestClose } = useGuardedClose(onCancel);\nonSave(next);`;
  assert.doesNotMatch(noReset, /resetDirty/);
  const unconditional = `const { markDirty, resetDirty, requestClose } = useGuardedClose(onCancel);\nonSave(next);\nresetDirty();`;
  assert.match(unconditional, /resetDirty/);
  assert.equal(resetsOnlyWhenSaved(unconditional), false, "无条件复位（只读账号被拦也复位）必须判失败");
});

test("C3：内层预览必须带 data-modal，useGuardedClose 的关闭入口必须检查它", async () => {
  const preview = await code("src/components/preview.tsx");
  assert.match(preview, /data-modal/, "预览弹窗必须声明 data-modal（否则同一次 Esc 会连弹两个框）");
  assert.match(preview, /e\.key === "Escape"/, "预览弹窗自己要吃 Esc（关掉最内层）");
  const slot = await code("src/components/photo-slot.tsx");
  assert.equal((slot.match(/data-modal/g) || []).length >= 2, true, "照片全屏预览（身份证 / 银行卡·IC卡）也要声明 data-modal");
  assert.equal((slot.match(/e\.key === "Escape"/g) || []).length >= 2, true, "照片全屏预览要自己吃 Esc，不许穿透到外层编辑器");
  const lib = await code("src/lib/confirm-close.ts");
  assert.match(lib, /querySelector\("\[data-modal\]"\)/, "requestClose 必须先看内层有没有弹层");
});

test("C3：409 弹窗文案必须写明「取消 / Esc = 放弃本机改动」", async () => {
  const sync = await code("src/lib/nas-sync.ts");
  const at = sync.indexOf("服务器上的台账已被其他设备修改");
  assert.ok(at > 0, "找不到 409 的确认框文案");
  const seg = sync.slice(at, at + 400);
  assert.match(seg, /取消 \/ Esc/, "要写明「取消 / Esc」这一路");
  assert.match(seg, /放弃本机/, "要写明后果是放弃本机改动（服务器上别处改的那份会被丢掉 / 改不回本机了）");
});
