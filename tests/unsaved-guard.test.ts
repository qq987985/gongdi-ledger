/**
 * F1 / A12：手机端「考勤未保存被静默丢弃」——拦截必须是**一处实现**，且真的接上了。
 *
 * 现场问题：月表是本地编辑、「保存本月」才落盘；原来只有页内「返回总览 / 切月」会问一句，
 * **底部导航、左侧导航、浏览器返回、F5 / 关标签、换台账、换年份全都不拦** ——
 * 手机上填完一个月出勤，随手点底部「总览」，整月输入静默消失。
 *
 * 这里两层保护：
 * ① 纯逻辑（`src/lib/unsaved.ts`：谁 dirty、问什么、用户选丢弃才放行），可在 Node 里直接测；
 * ② 静态守卫：接线确实存在（`useUnsavedChanges` + `useBlocker` + `enableBeforeUnload`），
 *    换台账 / 换年份走同一个 `confirmLeaveUnsaved`，且全库没有第二份 beforeunload 实现。
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  LEAVE_CONFIRM_HINT,
  armUnsaved,
  clearUnsaved,
  confirmLeaveUnsaved,
  hasUnsavedChanges,
  leaveQuestion,
  unsavedMessage,
} from "../src/lib/unsaved";

import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));

/** 把 window.confirm 换成可编程的桩（Node 里没有 confirm） */
function stubConfirm(answer: boolean) {
  const calls: string[] = [];
  (globalThis as unknown as { confirm: (m: string) => boolean }).confirm = (m: string) => {
    calls.push(m);
    return answer;
  };
  return calls;
}

beforeEach(() => {
  clearUnsaved();
  delete (globalThis as unknown as { confirm?: unknown }).confirm;
});

test("未登记 dirty 时：不拦、不问", () => {
  const calls = stubConfirm(false);
  assert.equal(hasUnsavedChanges(), false);
  assert.equal(confirmLeaveUnsaved(), true);
  assert.equal(calls.length, 0, "没有未保存改动时不该弹确认");
});

test("登记 dirty 后：选「继续编辑」不放行、登记保留", () => {
  const calls = stubConfirm(false);
  const token = {};
  armUnsaved(token, "本月考勤有未保存的修改，离开就会丢失");
  assert.equal(hasUnsavedChanges(), true);
  assert.equal(unsavedMessage(), "本月考勤有未保存的修改，离开就会丢失");
  assert.equal(confirmLeaveUnsaved(), false);
  assert.equal(calls.length, 1);
  assert.equal(hasUnsavedChanges(), true, "继续编辑时不能把登记清掉");
});

test("登记 dirty 后：选「丢弃并离开」才放行，并清掉登记", () => {
  stubConfirm(true);
  armUnsaved({}, "本月考勤有未保存的修改，离开就会丢失");
  assert.equal(confirmLeaveUnsaved(), true);
  assert.equal(hasUnsavedChanges(), false);
});

test("问话文案：具体到「谁的什么会丢」+「继续编辑 / 丢弃并离开」两个选项", () => {
  armUnsaved({}, "本月考勤有未保存的修改，离开就会丢失");
  const q = leaveQuestion("换年份后这张月表会重新填");
  assert.match(q, /本月考勤有未保存的修改，离开就会丢失/);
  assert.match(q, /换年份后这张月表会重新填/);
  assert.match(q, /丢弃并离开/);
  assert.match(q, /继续编辑/);
  assert.equal(LEAVE_CONFIRM_HINT.includes("丢弃并离开"), true);
});

test("登记与清理按持有者区分：别人的清理不能把刚登记的拦截清掉", () => {
  stubConfirm(true);
  const a = {};
  const b = {};
  armUnsaved(a, "A 页面");
  clearUnsaved(b);
  assert.equal(hasUnsavedChanges(), true, "B 的清理不该动 A 的登记");
  clearUnsaved(a);
  assert.equal(hasUnsavedChanges(), false);
});

test("静态守卫：考勤页必须接上统一拦截（不是页内自己写 window.confirm）", async () => {
  const src = await readFile(repo("src/routes/attendance.tsx"), "utf8");
  assert.match(src, /from "~\/components\/unsaved-guard"/, "考勤页必须用统一拦截组件");
  assert.match(src, /useUnsavedChanges\(/, "考勤页必须调 useUnsavedChanges");
  assert.match(src, /const UNSAVED_MSG = "本月考勤有未保存的修改，离开就会丢失"/, "提示要说清楚会丢什么");
  // 只读账号不该被拦：dirty 要按「能不能保存」门控
  assert.match(src, /useUnsavedChanges\(monthDirty, UNSAVED_MSG, canEditMonth\)/, "只读账号不拦");
  assert.match(src, /setMonthDirty\(Boolean\(d\) && canEditMonth\)/, "读不了盘的账号不进入 dirty");
  // 老的页内写法（自己的 dirty ref + 自己的 confirm）必须消失，否则就有两套判定。
  // 负向守卫命中 0 处也是绿的 → 先用坏样本证明这两条正则抓得到（1.8.14 专家评审 C2 自检）
  const refRe = /monthDirtyRef/;
  expectRegexCatches(refRe, "  const monthDirtyRef = React.useRef(false);", "考勤页旧的页内 dirty ref");
  assert.doesNotMatch(src, refRe, "不许再留一份页内 dirty 判定");
  const localConfirmRe = /window\.confirm\("本月考勤有未保存的修改/;
  expectRegexCatches(
    localConfirmRe,
    'if (monthDirtyRef.current && !window.confirm("本月考勤有未保存的修改，确定离开吗？未保存的修改会丢失。")) return;',
    "考勤页旧的页内 confirm",
  );
  assert.doesNotMatch(src, localConfirmRe, "不许页内自己弹确认");
  // 文案唯一：只有一处（命中数下限自检，防止哪天正则失效）
  expectMinHits("考勤页里那句未保存提示的出处数", countHits(src, /本月考勤有未保存的修改，离开就会丢失/g), 1);
});

test("静态守卫：统一拦截同时盖住路由跳转（useBlocker）与刷新/关标签（enableBeforeUnload）", async () => {
  const src = await readFile(repo("src/components/unsaved-guard.tsx"), "utf8");
  assert.match(src, /useBlocker\(/, "路由跳转（底部导航/左侧导航/返回）必须被拦");
  assert.match(src, /shouldBlockFn: \(\) => hasUnsavedChanges\(\) && !confirmLeaveUnsaved\(\)/, "拦截要走同一处问答");
  assert.match(src, /enableBeforeUnload: \(\) => hasUnsavedChanges\(\)/, "刷新 / 关标签必须被拦");
  assert.match(src, /disabled: !armed/, "没有未保存改动时不注册拦截");
});

test("静态守卫：换台账 / 换年份 / 新建台账也要先问一句（同一处问答）", async () => {
  const year = await readFile(repo("src/components/shell/year-switcher.tsx"), "utf8");
  assert.match(year, /confirmLeaveUnsaved\(/, "换年份要先问");
  assert.doesNotMatch(year, /window\.confirm\(/, "换年份不许自己弹一个别的确认框");
  const book = await readFile(repo("src/components/shell/book-switcher.tsx"), "utf8");
  assert.equal((book.match(/confirmLeaveUnsaved\(/g) || []).length >= 2, true, "切台账与新建台账都要先问");
  const settings = await readFile(repo("src/routes/settings.tsx"), "utf8");
  assert.match(settings, /confirmLeaveUnsaved\(/, "设置页换年份同样要问");
});

test("静态守卫：全库 beforeunload 只有统一拦截一处实现", async () => {
  const hits: string[] = [];
  let scanned = 0;
  const walk = async (dir: string) => {
    for (const name of await readdir(repo(dir), { withFileTypes: true })) {
      if (name.isDirectory()) {
        await walk(`${dir}/${name.name}`);
        continue;
      }
      if (!/\.tsx?$/.test(name.name)) continue;
      const text = await readFile(repo(`${dir}/${name.name}`), "utf8");
      scanned += 1;
      if (/addEventListener\(\s*"beforeunload"/.test(text)) hits.push(`${dir}/${name.name}`);
    }
  };
  await walk("src");
  // 「一处都没有」也可能是「一个文件都没扫到」——先把扫描规模钉住（1.8.14 专家评审 C2 假绿）
  expectMinHits("全库 beforeunload 扫描的文件数", scanned, 60, "src 下有 120+ 个 .ts/.tsx");
  expectRegexCatches(/addEventListener\(\s*"beforeunload"/, 'window.addEventListener("beforeunload", onUnload);', "别人偷偷挂 beforeunload");
  assert.deepEqual(hits, [], "beforeunload 交给 unsaved-guard 的 enableBeforeUnload，不要在别处再挂一份");
});
