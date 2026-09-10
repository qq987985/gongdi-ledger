import * as React from "react";
import { can, subscribePerms, type PermId } from "~/lib/perms";

export function useCan(perm: PermId): boolean {
  const [, bump] = React.useState(0);
  React.useEffect(() => subscribePerms(() => bump((n) => n + 1)), []);
  return can(perm);
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
