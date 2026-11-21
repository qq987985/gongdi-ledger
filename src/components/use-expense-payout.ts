import * as React from "react";
import { toast } from "sonner";
import { renameFile, setDoc, uniqueBase } from "./doc-actions";
import { payoutBase } from "./expense-bits";
import { blockedWrite } from "~/lib/readonly";
import { flushPendingLedger, ledgerContextSnapshot, subscribeLedgerContext } from "~/lib/nas-sync";
import { expenseBatchMatches, expensePayoutBatches, planDissolveExpensePayout, planExpensePayout, type ExpensePayoutDraft, type ExpensePayoutPlan } from "~/lib/expense-payout";
import { useApp } from "~/lib/store";
import type { Expense } from "~/lib/types";
import { money, uid } from "~/lib/utils";

export interface ExpensePayoutSession {
  key: string;
  context: string;
  all: Expense[];
  ids: string[];
  editingId?: string;
}
export interface ExpensePayoutInput {
  ids: string[];
  draft: ExpensePayoutDraft;
  file: File | null;
  clearFile: boolean;
  checkedIssues: boolean;
  statusConfirmed: boolean;
}

/** 收款操作绑定打开时的台账与完整记录；文件成功前不写记录，整批一次提交。 */
export function useExpensePayout(onApplied: () => void) {
  const context = React.useSyncExternalStore(subscribeLedgerContext, ledgerContextSnapshot, () => null);
  const [session, setSession] = React.useState<ExpensePayoutSession | null>(null);
  const sessionRef = React.useRef<ExpensePayoutSession | null>(null);
  const [busy, setBusy] = React.useState(false);
  const working = React.useRef(false);
  const mounted = React.useRef(true);
  const [undo, setUndo] = React.useState<{ plan: ExpensePayoutPlan; context: string; label: string } | null>(null);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; sessionRef.current = null; }; }, []);
  React.useEffect(() => {
    sessionRef.current = null;
    setSession(null);
    setUndo(null);
  }, [context]);

  function open(ids: string[], editingId?: string) {
    const scope = ledgerContextSnapshot();
    if (scope === null || working.current) { toast.error("台账正在读取或保存，请稍后再办理"); return; }
    const all = JSON.parse(JSON.stringify(useApp.getState().expenses || [])) as Expense[];
    const picked = all.filter((row) => ids.includes(row.id));
    const groups = [...new Set(picked.map((row) => row.payoutId).filter(Boolean))];
    if (!editingId && groups.length) {
      if (groups.length !== 1 || picked.some((row) => !row.payoutId)) {
        toast.error("所选记录属于不同批次。请打开原收款批次整批办理，再添加未分批明细。"); return;
      }
      editingId = groups[0];
    }
    const initial = editingId ? all.filter((row) => row.payoutId === editingId).map((row) => row.id) : ids;
    if (editingId && !initial.length) { toast.error("该批次已变化，请刷新后重新打开"); return; }
    const next = { key: uid(), context: scope, all, ids: initial, ...(editingId ? { editingId } : {}) };
    sessionRef.current = next;
    setSession(next);
  }
  function close() { if (!working.current) { sessionRef.current = null; setSession(null); } }
  function assertSession(current: ExpensePayoutSession, plan?: ExpensePayoutPlan) {
    if (!mounted.current || sessionRef.current?.key !== current.key || ledgerContextSnapshot() !== current.context)
      throw new Error("台账或办理对象已改变，本次操作已取消，请重新打开。");
    if (blockedWrite("expenses.edit", "报销收款")) throw new Error("当前账号不能修改报销收款。");
    if (plan && !expenseBatchMatches(useApp.getState().expenses, plan.before, plan.groupId))
      throw new Error("本批明细已被修改、删除或新增，请重新打开核对；没有覆盖最新记录。");
  }
  async function commit(plan: ExpensePayoutPlan, scope: string, label: string) {
    if (!useApp.getState().applyExpenseBatch(plan.before, plan.after, plan.groupId))
      throw new Error("记录已变化，本次没有写入，请重新打开核对。");
    setUndo({ plan, context: scope, label });
    sessionRef.current = null;
    setSession(null);
    onApplied();
    const result = await flushPendingLedger();
    if (!mounted.current || ledgerContextSnapshot() !== scope || !expenseBatchMatches(useApp.getState().expenses, plan.after)) {
      toast.message("台账内容已更新，请以当前列表为准，本次操作未被确认为已保存。"); return;
    }
    if (result.status === "failed") toast.error(`本机已${label}，服务器尚未保存。请在顶部重试同步，或撤销上次批次操作。${result.reason}`);
    else toast.success(`已${label}（${plan.after.length}笔）`);
  }
  async function save(input: ExpensePayoutInput) {
    if (working.current) return;
    const current = sessionRef.current;
    if (!current) throw new Error("请重新打开收款窗口。");
    assertSession(current);
    const batch = expensePayoutBatches(current.all).find((item) => item.id === current.editingId);
    const selectedRows = current.all.filter((row) => input.ids.includes(row.id));
    const mixedStatus = selectedRows.some((row) => row.status !== selectedRows[0]?.status);
    if ((mixedStatus || batch?.issues.includes("收款日期不一致")) && !input.statusConfirmed)
      throw new Error("本批收款状态或日期不同，请明确选择本次状态与日期。");
    if (batch?.issues.some((issue) => !["收款状态不一致", "收款日期不一致"].includes(issue)) && !input.checkedIssues)
      throw new Error("请先核对本批不一致的信息，再选择本次统一的收款信息。");
    const payoutId = input.file ? uid() : current.editingId || uid();
    let fileName = input.clearFile ? "" : batch?.fileName || "";
    let plan = planExpensePayout({ all: current.all, ids: input.ids, editingId: current.editingId, draft: input.draft, payoutId, fileName });
    assertSession(current, plan);
    const alreadyPaid = plan.before.filter((row) => row.status === "已报销").length;
    if (input.draft.status === "未报销" && alreadyPaid &&
      !confirm(`这 ${plan.after.length} 笔合计¥${money(expensePayoutBatches(plan.after)[0].total)}，其中 ${alreadyPaid} 笔原为已报销。\n保存待收款将整批改为未报销并清除收款日期，保留本批关联。确认继续？`)) return;
    if (input.draft.status === "已报销" && input.draft.payoutMethod !== "现金" && !input.file && !fileName &&
      !confirm(`这 ${plan.after.length} 笔将登记为已收到报销款，尚无收款凭证。确认继续？`)) return;
    working.current = true; setBusy(true);
    try {
      if (input.file) {
        // 新文件使用新批次锚点且另存，保留旧文件，失败或本次撤销不会破坏旧批凭证。
        const taken = useApp.getState().expenses.map((row) => row.payoutFileName).filter(Boolean);
        const named = renameFile(input.file, uniqueBase(payoutBase(plan.before), taken));
        assertSession(current, plan);
        fileName = await setDoc(payoutId, "payout", named);
        assertSession(current, plan);
        plan = planExpensePayout({ all: current.all, ids: input.ids, editingId: current.editingId, draft: input.draft, payoutId, fileName });
      }
      assertSession(current, plan);
      await commit(plan, current.context, input.draft.status === "已报销" ? "登记收款" : "保存待收款批次");
    } finally { working.current = false; if (mounted.current) setBusy(false); }
  }
  async function dissolve(resetPaid: boolean) {
    if (working.current) return;
    const current = sessionRef.current;
    if (!current) return;
    assertSession(current);
    const ids = current.editingId ? current.all.filter((row) => row.payoutId === current.editingId).map((row) => row.id) : current.ids;
    const plan = planDissolveExpensePayout(current.all, ids, resetPaid);
    assertSession(current, plan);
    const total = expensePayoutBatches(plan.before)[0]?.total;
    const summary = `${plan.before.length}笔${total === undefined ? "" : `，合计¥${money(total)}`}`;
    const description = resetPaid
      ? "这些记录将恢复未报销，清除收款日期并解除合并。单据金额、购买凭证及收款账户保留。"
      : "只解除合并及共用收款凭证的关联；单据金额、收款状态、日期和账户保持不变。原凭证文件保留在影像资料。";
    if (!confirm(`${resetPaid ? "撤销本批收款" : "解除本批合并"}：${summary}？\n\n${description}`)) return;
    assertSession(current, plan);
    working.current = true; setBusy(true);
    try { await commit(plan, current.context, resetPaid ? "撤销收款，恢复未报销" : "解除合并"); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  }
  async function restoreLast() {
    if (!undo || working.current || ledgerContextSnapshot() !== undo.context) return;
    if (blockedWrite("expenses.edit", "报销收款")) return;
    if (!confirm(`撤销上次“${undo.label}”操作，恢复这 ${undo.plan.before.length} 笔操作前的收款关系？\n仅本次会话的上一步可以撤销；已另行修改的单据不会被覆盖。`)) return;
    working.current = true; setBusy(true);
    try {
      if (!useApp.getState().applyExpenseBatch(undo.plan.after, undo.plan.before)) throw new Error("这些记录已另行修改，不能直接撤销；请重新核对批次。");
      setUndo(null); onApplied();
      const result = await flushPendingLedger();
      if (result.status === "failed") toast.error(`撤销已在本机完成，服务器尚未保存：${result.reason}`);
      else if (ledgerContextSnapshot() === undo.context) toast.success("已恢复上次操作前的收款关系");
    } catch (error) { toast.error(error instanceof Error ? error.message : "撤销失败，请核对当前记录"); }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  }
  return { context, session, busy, undo, open, close, save, dissolve, restoreLast };
}
