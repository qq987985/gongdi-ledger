import * as React from "react";

/**
 * 编辑弹窗的「防误关」：当用户改过内容（dirty）后，点遮罩 / 按 Esc 会先问一句，
 * 避免鼠标滑出窗口把填到一半的内容直接丢掉。
 *
 * 两条补充约定（2026-09-17 专家评审 B9 / C3）：
 * ① **保存成功后要 `resetDirty()`**：内容已经进库，再问「有未保存的更改」是误报
 *    （实测：报销/合同/发放保存完弹窗不关，点「关闭」仍被拦一次）。
 * ② 弹窗里再叠一层预览（带 `[data-modal]` 的节点，见 components/preview.tsx、
 *    photo-slot 的全屏预览）时，一次 Esc 属于**内层预览**，不许连带触发外层的未保存确认
 *    （原来按一次 Esc 会连弹两个框）。
 */
export function useGuardedClose(onClose: () => void) {
  const dirtyRef = React.useRef(false);
  const requestClose = React.useCallback(() => {
    // 内层还有弹层（预览）：遮罩 / Esc 交给内层处理，别把外层编辑器关掉
    if (typeof document !== "undefined" && document.querySelector("[data-modal]")) return;
    if (
      dirtyRef.current &&
      typeof window !== "undefined" &&
      !window.confirm("有未保存的更改，确定关闭吗？已填内容会丢失。")
    )
      return;
    onClose();
  }, [onClose]);
  const markDirty = React.useCallback(() => {
    dirtyRef.current = true;
  }, []);
  /** 保存成功后复位：内容已经进库，关闭时不该再问「有未保存的更改」 */
  const resetDirty = React.useCallback(() => {
    dirtyRef.current = false;
  }, []);
  return { markDirty, resetDirty, requestClose };
}
