/**
 * 「这次 state 变化不算本机改动」的静音开关（1.8.14 / 专家评审 B3）。
 *
 * 为什么要有它：自动保存的订阅是**整个 store**（`useApp.subscribe`），任何 set 都会置 dirty 并排队推送。
 * 于是只读账号在侧栏切一下年份，就被判成「本机有改动」→ 弹「没有保存整本台账的权限」，
 * 而且 dirty 从此永久为真，之后新建/切台账都被问「本机改动会被覆盖」（实测）。
 *
 * 约定：**只有真的改了台账数据的动作才置 dirty**。纯界面状态（切年份、换主题）用
 * `runMuted(() => set(...))` 包起来：既不置 dirty，也不触发一次整本上传。
 *
 * 放在独立第三模块（不写进 store 或 nas-sync）：nas-sync 依赖 store，
 * store 再回头引 nas-sync 就是循环依赖（开发规范 §12 红线）。
 */
let depth = 0;

/** true = 正处于「不算本机改动」的 state 变化中 */
export function syncMuted(): boolean {
  return depth > 0;
}

/** 在静音窗口里执行一次 state 变化（同步执行 set；订阅回调在 set 内同步触发） */
export function runMuted<T>(fn: () => T): T {
  depth += 1;
  try {
    return fn();
  } finally {
    depth -= 1;
  }
}
