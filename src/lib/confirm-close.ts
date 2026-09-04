import * as React from "react";

/**
 * 编辑弹窗的「防误关」：当用户改过内容（dirty）后，点遮罩 / 按 Esc 会先问一句，
 * 避免鼠标滑出窗口把填到一半的内容直接丢掉。
 */
export function useGuardedClose(onClose: () => void) {
  const dirtyRef = React.useRef(false);
  const requestClose = React.useCallback(() => {
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
  return { markDirty, requestClose };
}
