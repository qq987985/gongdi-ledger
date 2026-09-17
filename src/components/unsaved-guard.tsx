import * as React from "react";
import { useBlocker } from "@tanstack/react-router";
import { armUnsaved, clearUnsaved, confirmLeaveUnsaved, hasUnsavedChanges } from "~/lib/unsaved";

/**
 * 页面级的「未保存改动」接线（F1 / A12）——全库只此一处接路由与浏览器。
 *
 * 一个 `useUnsavedChanges(dirty, message, enabled)` 同时覆盖：
 * ① 路由跳转（底部导航 / 左侧导航 / 面包屑 / 任何 `<Link>`）——`useBlocker`；
 * ② 浏览器返回 / 前进 —— 同样走 history 拦截；
 * ③ 刷新 / 关标签 —— `enableBeforeUnload` 让浏览器弹原生确认（原生文案由浏览器提供）；
 * ④ 换台账 / 换年份 —— 那两个动作不是路由跳转，由调用方 `confirmLeaveUnsaved()` 拦（同一处文案）。
 *
 * 只读账号（`enabled=false`）不拦：他们本来就存不下去，拦了只会让人以为有东西没保存（A 组报告第 17 项口径）。
 */
export function useUnsavedChanges(dirty: boolean, message: string, enabled = true): void {
  const armed = Boolean(dirty && enabled);
  const token = React.useMemo(() => ({}), []);
  React.useEffect(() => {
    if (!armed) return;
    armUnsaved(token, message);
    return () => clearUnsaved(token);
  }, [armed, message, token]);
  useBlocker({
    // 返回 true = 拦下这次跳转；用户选「丢弃并离开」才放行
    shouldBlockFn: () => hasUnsavedChanges() && !confirmLeaveUnsaved(),
    // 刷新 / 关标签 / 真实卸载：交给浏览器原生确认
    enableBeforeUnload: () => hasUnsavedChanges(),
    disabled: !armed,
  });
}
