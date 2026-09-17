/**
 * 「有未保存的改动」拦截的**唯一实现**（F1 / A12）。
 *
 * 背景：考勤月表是本地编辑、「保存本月」才落盘。原来只有页面里那句「返回总览 / 切月」
 * 会问一句，**底部导航、左侧导航、浏览器返回、F5 / 关标签、换台账、换年份全都不拦** ——
 * 手机上填完一个月的出勤，随手点一下底部「总览」，整个月的输入静默消失（现场级数据丢失）。
 *
 * 这里只放**与框架无关**的部分（谁处于 dirty、怎么问、问的文案），
 * React / 路由 / beforeunload 的接线在 `~/components/unsaved-guard.tsx` 的 `useUnsavedChanges`。
 * 需要主动拦一下的动作（换台账 / 换年份）直接调 `confirmLeaveUnsaved()`，
 * 不要在页面里各写一份 `window.confirm`。
 */

/** 「确定 = 丢弃并离开；取消 = 继续编辑」——两句话写清楚，免得用户不敢点 */
export const LEAVE_CONFIRM_HINT = "确定＝丢弃并离开，取消＝继续编辑";

/** dirty 的持有者：用对象身份而不是布尔，避免 A 页面的清理把 B 页面刚登记的拦截清掉 */
let owner: object | null = null;
let message = "";

/** 登记「当前有未保存的改动」（页面挂载 / 变脏时调用） */
export function armUnsaved(token: object, msg: string): void {
  owner = token;
  message = msg;
}

/** 撤销登记（只清自己的，别人的不动）——保存成功或页面卸载时调用 */
export function clearUnsaved(token?: object): void {
  if (token && owner !== token) return;
  owner = null;
  message = "";
}

/** 现在有没有未保存的改动 */
export function hasUnsavedChanges(): boolean {
  return owner !== null;
}

/** 当前那句提示（没有 dirty 时是空串） */
export function unsavedMessage(): string {
  return message;
}

/** 拼出要问的整句话：具体提示 + 「继续编辑 / 丢弃并离开」 */
export function leaveQuestion(extra = ""): string {
  const head = message || "有未保存的改动";
  return [head, extra].filter(Boolean).join("；") + `\n\n${LEAVE_CONFIRM_HINT}`;
}

/**
 * 统一问答：返回 true = 可以离开（用户选了「丢弃并离开」，登记同时清掉）；
 * false = 继续编辑（登记保留，页面不动）。
 * 非浏览器环境（测试 / SSR）没有 confirm：不拦，返回 true。
 */
export function confirmLeaveUnsaved(extra = ""): boolean {
  if (!hasUnsavedChanges()) return true;
  const ask = globalThis.confirm;
  if (typeof ask !== "function") return true;
  if (!ask(leaveQuestion(extra))) return false;
  clearUnsaved();
  return true;
}
