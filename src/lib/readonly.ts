/**
 * 只读账号的写入守卫（1.8.7）。
 *
 * 背景（A 组逐项测试报告第 17 项，实测复现）：只读账号（`u_read`）在人员页点「编辑」改电话，
 * 界面弹**「已保存」**、表格立刻显示新号码，而服务端 PUT /api/ledger 回 403 ——
 * 改动只活在本机内存里，刷新即丢。服务端口径是对的，错在客户端把「本机改了一下」渲染成了成功。
 *
 * 判据与服务端 PUT /api/ledger 完全一致，两个条件缺一不可：
 * ① `canManageLedger`（整本台账 PUT 的门槛，服务端 `withTenant(..., "ledger.manage")`）；
 * ② 该模块自己的 `.edit` 权限（例如 `people.edit`）。
 * 只有「能真的落盘」才允许弹成功提示；否则入口就拦下并说明原因。
 *
 * 唯一实现，页面与守卫测试都引用这里（test/readonly.test.ts + tests/ui-guards.test.ts）。
 */
import { toast } from "sonner";
import { canManageLedger, hasPerm, livePerms } from "./perms";

/** 这次改动能不能真的保存到服务器（不能 = 只读，改了也白改） */
export function canSaveToServer(perm: string): boolean {
  const perms = livePerms();
  return canManageLedger(perms) && hasPerm(perms, perm);
}

/** 只读账号：没有任何能落盘的编辑权限（界面上要给明确提示，而不是等用户白改一通） */
export function isReadOnlyAccount(): boolean {
  const perms = livePerms();
  if (!perms.length) return true;
  return !canManageLedger(perms);
}

/**
 * 写入入口的统一守卫。返回 true = **已拦下**，调用方必须立刻 return（不许再弹成功提示）。
 * @param perm 该操作需要的模块权限 id（如 `people.edit`）
 * @param what 给用户看的动作名（如「人员 新增/修改」），用来解释缺哪一项权限
 */
export function blockedWrite(perm: string, what: string): boolean {
  if (canSaveToServer(perm)) return false;
  toast.error(`你是只读账号（缺「${what}」权限），改动不会保存。请联系管理员开通权限。`);
  return true;
}

/** 只读提示的统一文案（界面上的横幅/禁用按钮 title 都引用这里） */
export const READONLY_MSG = "你是只读账号，改动不会保存。请联系管理员开通权限。";

export function readonlyHint(what: string): string {
  return `你是只读账号（缺「${what}」权限），改动不会保存。请联系管理员开通权限。`;
}
