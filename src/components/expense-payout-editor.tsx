import * as React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DocActions } from "./doc-actions";
import { PAY_METHODS } from "~/lib/expense-rules";
import { expensePayoutBatches, expensePayoutDraft, type ExpensePayoutDraft } from "~/lib/expense-payout";
import { expenseTotals } from "~/lib/expenses-stats";
import { localToday } from "~/lib/dates";
import { money } from "~/lib/utils";
import { useGuardedClose } from "~/lib/confirm-close";
import type { ExpensePayoutInput, ExpensePayoutSession } from "./use-expense-payout";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="text-xs font-medium text-muted">{label}</span><span className="mt-1 block">{children}</span></label>;
}

/** 费用归费用，收款归批次。选文件只暂存，确认保存时才统一登记。 */
export function ExpensePayoutEditor({ session, canEdit, busy, onClose, onSave, onDissolve }: {
  session: ExpensePayoutSession;
  canEdit: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (input: ExpensePayoutInput) => Promise<void>;
  onDissolve: (resetPaid: boolean) => Promise<void>;
}) {
  const original = session.all.filter((row) => session.ids.includes(row.id));
  const existing = expensePayoutBatches(session.all).find((batch) => batch.id === session.editingId);
  const [ids, setIds] = React.useState(session.ids);
  const [draft, setDraft] = React.useState(() => expensePayoutDraft(original, localToday()));
  const [q, setQ] = React.useState("");
  const [candidateStatus, setCandidateStatus] = React.useState("未报销");
  const [showAdd, setShowAdd] = React.useState(!session.editingId && session.ids.length === 0);
  const [showAccount, setShowAccount] = React.useState(original.some((row) => row.forWhom || row.payBank || row.payCardNo));
  const [file, setFile] = React.useState<File | null>(null);
  const [clearFile, setClearFile] = React.useState(false);
  const [checkedIssues, setCheckedIssues] = React.useState(false);
  const [explicitStatus, setExplicitStatus] = React.useState(false);
  const [error, setError] = React.useState("");
  const editedForm = React.useRef(false);
  const { markDirty, requestClose } = useGuardedClose(onClose);
  const rows = session.all.filter((row) => ids.includes(row.id));
  const total = expenseTotals(rows).amount;
  const missingClaimant = rows.filter((row) => !(row.claimant || "").trim()).length;
  const mixedStatus = rows.some((row) => row.status !== rows[0]?.status);
  const requireStatusChoice = mixedStatus || !!existing?.issues.includes("收款日期不一致");
  const requireIssuesCheck = !!existing?.issues.some((issue) => !["收款状态不一致", "收款日期不一致"].includes(issue));
  const locked = new Set(existing?.rows.map((row) => row.id) || []);
  const candidates = session.all.filter((row) => !row.payoutId &&
    (candidateStatus === "all" || row.status === candidateStatus) &&
    (!q.trim() || [row.name, row.claimant, row.period, row.remark].some((value) => (value || "").includes(q.trim()))));
  const accountMap = new Map<string, { name: string; bank: string; card: string }>();
  for (const row of session.all) {
    if (row.forWhom?.trim() && (row.payBank?.trim() || row.payCardNo?.trim())) {
      const account = { name: row.forWhom.trim(), bank: row.payBank?.trim() || "", card: row.payCardNo?.trim() || "" };
      accountMap.set(JSON.stringify(account), account);
    }
  }
  const accounts = [...accountMap.values()];
  const allCandidates = candidates.length > 0 && candidates.every((row) => ids.includes(row.id));
  const effectiveClaimants = rows.map((row) => (row.claimant || "").trim() || draft.claimant.trim());
  const commonClaimant = effectiveClaimants.length && effectiveClaimants.every((name) => name === effectiveClaimants[0]) ? effectiveClaimants[0] : "";
  const accountVisible = draft.status === "已报销" || showAccount;

  React.useEffect(() => {
    if (!editedForm.current && !session.editingId) setDraft(expensePayoutDraft(rows, localToday()));
  }, [ids.join("|"), session.key]);
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, busy]);
  function patch<K extends keyof ExpensePayoutDraft>(key: K, value: ExpensePayoutDraft[K]) {
    editedForm.current = true; markDirty(); setError("");
    setDraft((previous) => ({ ...previous, [key]: value }));
  }
  function changePayee(name: string) {
    editedForm.current = true; markDirty(); setError("");
    const hits = accounts.filter((account) => account.name === name.trim());
    setDraft((previous) => ({ ...previous, forWhom: name, payBank: hits.length === 1 ? hits[0].bank : "", payCardNo: hits.length === 1 ? hits[0].card : "" }));
  }
  function selectStatus(status: ExpensePayoutDraft["status"]) {
    setExplicitStatus(true); editedForm.current = true; markDirty(); setError("");
    setDraft((previous) => ({ ...previous, status, payoutDate: status === "已报销" ? previous.payoutDate || localToday() : "" }));
  }
  function toggle(id: string, checked: boolean) {
    if (!canEdit || busy || locked.has(id)) return;
    setIds((previous) => checked ? [...new Set([...previous, id])] : previous.filter((item) => item !== id));
    markDirty(); setError("");
  }
  async function save() {
    if (busy || !canEdit) return;
    setError("");
    try { await onSave({ ids, draft, file, clearFile, checkedIssues, statusConfirmed: explicitStatus }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "保存失败，已保留本次填写和所选文件，请重试。"); }
  }
  async function dissolve(reset: boolean) {
    try { await onDissolve(reset); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "操作失败，请核对当前批次。"); }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-5" onClick={() => { if (!busy) requestClose(); }}>
    <section role="dialog" aria-modal="true" aria-label="登记报销收款" className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-panel md:rounded-2xl" onClick={(event) => event.stopPropagation()}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 md:px-6">
        <div><h2 className="font-semibold">{existing ? "收款批次" : "登记报销收款"}</h2><p className="mt-1 text-xs text-muted">{existing ? "本批整批办理，原费用明细各自保留。" : "选好费用明细，再统一登记这一次收款。"}</p></div>
        <div className="flex flex-wrap gap-2">{existing && canEdit ? <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void dissolve(false)}>解除本批合并</Button> : null}<Button type="button" variant="outline" size="sm" disabled={busy} onClick={requestClose}>关闭</Button></div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4">
          <div><p className="text-xs text-muted">{rows.length} 笔费用 · 本次收款合计</p><p data-testid="expense-payout-total" className="mt-1 font-display text-2xl font-semibold tabular-nums">¥{money(total)}</p></div>
          {existing ? <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs">{existing.status === "已报销" ? "已收款" : existing.status === "未报销" ? "待收款" : "状态待核对"}</span> : null}
        </div>
        {existing?.issues.length ? <div className="mb-5 rounded-xl border border-warn/40 bg-bg-elevated p-3 text-sm">
          <p className="font-medium text-warn">这批记录需要核对</p><p className="mt-1 text-muted">{existing.issues.join("；")}。请按实际收款信息统一确认，原凭证文件不会删除。</p>
          {canEdit && requireIssuesCheck ? <label className="mt-3 flex items-start gap-2"><input type="checkbox" className="mt-1 size-4 shrink-0" checked={checkedIssues} disabled={busy} onChange={(event) => { setCheckedIssues(event.target.checked); markDirty(); }} />已核对本批异常，按本次填写的信息统一</label> : null}
        </div> : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">1. 核对费用清单</h3>{canEdit ? <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setShowAdd(!showAdd)}>{showAdd ? "收起选择" : "添加未分批明细"}</Button> : null}</div>
            <div data-testid="expense-payout-members" className="max-h-64 overflow-y-auto rounded-xl border border-line">
              {rows.length ? rows.map((row) => <div key={row.id} data-expense-id={row.id} className="flex items-start gap-3 border-b border-line p-3 last:border-0">
                <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{row.name}</p><p className="mt-1 text-xs text-muted">{row.period || row.date || "未填购买日期"} · {row.claimant || "未填报销人"} · {row.status}</p></div>
                <span className="shrink-0 text-sm tabular-nums">¥{money(row.amount)}</span>
                {canEdit && !locked.has(row.id) ? <button type="button" aria-label={`移除 ${row.name}`} disabled={busy} className="text-xs text-muted hover:text-danger" onClick={() => toggle(row.id, false)}>移除</button> : null}
              </div>) : <p className="p-4 text-sm text-muted">先在下方选择要一起收款的费用。</p>}
            </div>
            {canEdit && showAdd ? <div className="space-y-2 rounded-xl border border-line bg-bg-elevated p-3">
              <Input aria-label="搜索可加入的报销" value={q} placeholder="搜索项目、报销人或购买时间" disabled={busy} onChange={(event) => setQ(event.target.value)} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <select aria-label="可加入报销状态" className="field-select w-auto" value={candidateStatus} disabled={busy} onChange={(event) => setCandidateStatus(event.target.value)}><option value="未报销">未报销、未分批</option><option value="all">全部未分批</option></select>
                <Button type="button" variant="ghost" size="sm" disabled={busy || !candidates.length} onClick={() => {
                  setIds((previous) => allCandidates ? previous.filter((id) => !candidates.some((row) => row.id === id)) : [...new Set([...previous, ...candidates.map((row) => row.id)])]); markDirty();
                }}>{allCandidates ? "取消筛选结果选择" : "全选筛选结果"}</Button>
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {candidates.map((row) => <label key={row.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-surface p-2 text-sm"><input aria-label={`加入 ${row.name}`} type="checkbox" className="size-4 shrink-0" checked={ids.includes(row.id)} disabled={busy} onChange={(event) => toggle(row.id, event.target.checked)} /><span className="min-w-0 flex-1 break-words">{row.name}<span className="mt-1 block text-xs text-muted">{row.claimant || "未填报销人"} · {row.period || row.date}</span></span><span className="shrink-0 tabular-nums">¥{money(row.amount)}</span></label>)}
                {!candidates.length ? <p className="p-2 text-sm text-muted">当前没有可加入的未分批费用。</p> : null}
              </div>
            </div> : null}
            <p className="text-xs leading-relaxed text-muted">每笔费用的项目、金额、报销人和购买凭证独立保留。已分批记录从原批次整批办理，避免把不同收款混到一起。</p>
          </div>
          <div className="min-w-0 space-y-4">
            <h3 className="font-semibold">2. 登记这一次收款</h3>
            <div className="grid grid-cols-2 gap-2" aria-label="本次收款状态">
              <Button type="button" variant={draft.status === "未报销" ? "default" : "outline"} aria-pressed={draft.status === "未报销"} disabled={!canEdit || busy} onClick={() => selectStatus("未报销")}>待收款</Button>
              <Button type="button" variant={draft.status === "已报销" ? "default" : "outline"} aria-pressed={draft.status === "已报销"} disabled={!canEdit || busy} onClick={() => selectStatus("已报销")}>已收到报销款</Button>
            </div>
            <p className="text-xs text-muted">{draft.status === "未报销" ? "只选费用就能先保存为一批，收款资料可稍后补；收到款后再打开本批确认。" : "确认款项已收到后，整批记为已报销；这里仅登记，不执行银行转账。"}</p>
            {requireStatusChoice && !explicitStatus ? <p role="alert" className="text-sm text-warn">所选明细的状态或收款日期不一致，请明确选择本次收款状态与日期。</p> : null}
            {draft.status === "未报销" ? <Button type="button" variant="outline" size="sm" disabled={busy} aria-expanded={showAccount} onClick={() => setShowAccount(!showAccount)}>{showAccount ? "收起收款资料" : "提前填写收款资料（选填）"}</Button> : null}
            <fieldset disabled={!canEdit || busy} className={accountVisible ? "min-w-0 space-y-3" : "hidden"}>
              {missingClaimant ? <FormField label={`报销人（补齐 ${missingClaimant} 笔未填写的明细）`}><Input aria-label="报销人（补未填写的明细）" value={draft.claimant} onChange={(event) => patch("claimant", event.target.value)} placeholder="只补空白，不覆盖原报销人" /></FormField> : null}
              {accounts.length ? <FormField label="选择已用过的收款账户"><select aria-label="已用收款账户" className="field-select w-full" defaultValue="" onChange={(event) => {
                const account = accounts[Number(event.target.value)];
                if (!event.target.value || !account) return;
                editedForm.current = true; markDirty(); setDraft((previous) => ({ ...previous, forWhom: account.name, payBank: account.bank, payCardNo: account.card }));
              }}><option value="">手动填写，或选择已有账户</option>{accounts.map((account, index) => <option value={index} key={JSON.stringify(account)}>{account.name} · {account.bank} · 尾号{account.card.slice(-4)}</option>)}</select></FormField> : null}
              <FormField label="收款人"><Input aria-label="收款人" value={draft.forWhom} onChange={(event) => changePayee(event.target.value)} placeholder="这一次款项由谁收到" /></FormField>
              {commonClaimant ? <Button type="button" variant="ghost" size="sm" onClick={() => changePayee(commonClaimant)}>收款人同报销人</Button> : null}
              <FormField label="收款方式"><select aria-label="收款方式" className="field-select w-full" value={draft.payoutMethod} onChange={(event) => patch("payoutMethod", event.target.value)}>{PAY_METHODS.map((method) => <option key={method}>{method}</option>)}</select></FormField>
              {draft.payoutMethod !== "现金" ? <><FormField label="开户行"><Input aria-label="开户行" value={draft.payBank} onChange={(event) => patch("payBank", event.target.value)} placeholder="银行及支行" /></FormField><FormField label="收款账户"><Input aria-label="收款账户" inputMode="text" autoComplete="off" value={draft.payCardNo} onChange={(event) => patch("payCardNo", event.target.value)} placeholder="银行卡号或实际收款账号" /></FormField></> : <p className="text-xs text-muted">现金收款不用填写开户行和账号。</p>}
              {draft.status === "已报销" ? <FormField label="收款日期"><Input aria-label="收款日期" type="date" value={draft.payoutDate} onChange={(event) => patch("payoutDate", event.target.value)} /></FormField> : null}
            </fieldset>
            <div className="space-y-2 rounded-xl border border-line p-3">
              <h4 className="text-sm font-medium">收款凭证（本批共用一张）</h4>
              {existing?.fileName && !clearFile ? <div className="flex flex-wrap items-center gap-2"><DocActions id={existing.id} kind="payout" fileName={existing.fileName} readOnly /><span className="break-all text-xs text-muted">{existing.fileName}</span>{canEdit ? <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setClearFile(true); markDirty(); }}>不再关联原凭证</Button> : null}</div> : null}
              {canEdit ? <><input aria-label="选择收款凭证" type="file" accept="image/*,.pdf" className="block w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-accent" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] || null); markDirty(); setError(""); }} />
                {file ? <div className="flex flex-wrap items-center gap-2 text-xs"><span className="break-all">待保存：{file.name}</span><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => { setFile(null); markDirty(); }}>移除待上传凭证</Button></div> : null}
                <p className="text-xs text-muted">选文件不会立即修改单据；点击下方保存后才上传并关联整批。</p></> : !existing?.fileName ? <p className="text-xs text-muted">本批未关联共同收款凭证。</p> : null}
              {clearFile ? <p className="text-xs text-warn">保存后整批不再关联旧凭证，原文件保留。</p> : null}
            </div>
          </div>
        </div>
        {existing && canEdit ? <section className="mt-6 rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold">批次合并错了？整批处理</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">本批已保存 {existing.rows.length} 笔，合计 ¥{money(existing.total)}。解除合并只取消批次关联；撤销收款会另外恢复未报销。原单据金额和购买凭证都保留，操作前会显示确认范围。</p>
          <p className="mt-3 text-xs leading-relaxed text-muted">已经被旧操作覆盖的原批次关系不能自动推断；需要准确恢复原分批时，请使用事故前的可靠台账备份。</p>
        </section> : null}
        {error ? <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p> : null}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
        <p className="text-sm">{rows.length} 笔 · <strong className="tabular-nums">¥{money(total)}</strong></p>
        {canEdit ? <div className="flex flex-wrap gap-2">{existing ? <Button type="button" variant="danger" size="sm" disabled={busy} onClick={() => void dissolve(true)}>撤销本批收款</Button> : null}<Button type="button" disabled={busy || !ids.length || (requireStatusChoice && !explicitStatus) || (requireIssuesCheck && !checkedIssues)} onClick={() => void save()}>{busy ? "正在保存…" : draft.status === "已报销" ? "确认收款并保存" : "保存待收款批次"}</Button></div> : <span className="text-xs text-muted">只读查看，不可修改收款记录</span>}
      </footer>
    </section>
  </div>;
}
