import * as React from "react";
import { can, permLabel, subscribePerms, type PermId } from "~/lib/perms";
import { canSaveToServer, readonlyHint } from "~/lib/readonly";

export function useCan(perm: PermId): boolean {
  const [, bump] = React.useState(0);
  React.useEffect(() => subscribePerms(() => bump((n) => n + 1)), []);
  return can(perm);
}

/** 这次改动能不能真的存到服务器（= 整本台账写权限 + 该模块 .edit 权限，见 lib/readonly.ts） */
export function useCanSave(perm: PermId): boolean {
  const [, bump] = React.useState(0);
  React.useEffect(() => subscribePerms(() => bump((n) => n + 1)), []);
  return canSaveToServer(perm);
}

export function Can({ perm, children }: { perm: PermId; children: React.ReactNode }) {
  if (!useCan(perm)) return null;
  return <>{children}</>;
}

export function Need({ perm, children }: { perm: PermId; children: React.ReactNode }) {
  if (!useCan(perm))
    return (
      <p className="text-sm text-muted">没有此项权限。请让管理员或这套台账的创建人给你开通。</p>
    );
  return <>{children}</>;
}

/**
 * 只读提示条（1.8.7）：账号缺该模块的编辑权限时，页面顶部明确写「改动不会保存」，
 * 而不是让用户改完才从「已保存」的假象里发现（A 组报告第 17 项）。
 */
export function ReadonlyNotice({ perm }: { perm: PermId }) {
  if (useCanSave(perm)) return null;
  return (
    <p className="rounded-lg border border-line bg-warn-bg px-3 py-2 text-sm text-warn">
      {readonlyHint(permLabel(perm))}
    </p>
  );
}
