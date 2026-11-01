import * as React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { money } from "~/lib/utils";
import { round2 } from "~/lib/wage";
import { receiverOf } from "~/lib/receiver";
import { paymentImportChoice, paymentImportSummary, type PaymentImportChoices, type PaymentImportMode, type PaymentImportPlan } from "~/lib/payment-import";
import type { Payment } from "~/lib/types";

const labelOf = (p: Payment) => `${p.owner} · ${p.date || "待发放"} · ${money(p.amount)} 元 · 发放方：${p.source || "未填"} · 收款人：${receiverOf(p)}`;
const total = (rows: Payment[]) => `${money(round2(rows.reduce((n, p) => n + p.amount, 0)))} 元`;

export function PaymentImportPreview(props: {
  fileName: string; rows: Payment[]; existing: Payment[]; mode: PaymentImportMode;
  choices: PaymentImportChoices; plan: PaymentImportPlan; stale: boolean;
  onMode: (mode: PaymentImportMode) => void; onChoices: (choices: PaymentImportChoices) => void;
  onApply: () => void; onCancel: () => void;
}) {
  const { fileName, rows, existing, mode, choices, plan, stale, onMode, onChoices, onApply, onCancel } = props;
  const [page, setPage] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [confirmedAll, setConfirmedAll] = React.useState(false);
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages - 1);
  const matches = existing.filter((p) => labelOf(p).includes(query.trim()));
  const options = matches.slice(0, 200);
  const blocked = stale || plan.errors.length > 0 || (mode === "update" && plan.unresolved.length > 0);
  return (
    <section aria-label="发放导入确认" className="basis-full min-w-0 mt-3 rounded-xl border border-accent bg-surface p-4">
      <h2 className="font-semibold">发放导入确认</h2>
      <p className="mt-1 break-all text-sm text-muted">{fileName} · 文件 {rows.length} 条，金额 {total(rows)}；当前台账 {existing.length} 条，金额 {total(existing)}</p>
      <fieldset className="mt-3 flex flex-wrap gap-3">
        <legend className="mb-2 text-sm font-medium">导入方式</legend>
        {([['add', '增加记录'], ['update', '本次替换'], ['replaceAll', '全部替换']] as const).map(([value, label]) => (
          <label key={value} className="inline-flex items-center gap-1.5 text-sm">
            <input type="radio" name="pay-mode" checked={mode === value} onChange={() => { onMode(value); setPage(0); setConfirmedAll(false); }} />{label}
          </label>
        ))}
      </fieldset>
      <p className="mt-2 text-sm text-muted">
        {mode === 'add' ? '只追加新记录；同编号或内容重复的跳过。修改已有记录请选择“本次替换”。'
          : mode === 'update' ? '只更新本次文件对应的记录，其他记录全部保留。按记录编号自动匹配；无匹配的行请手动选择原记录、明确新增或跳过。'
          : '覆盖当前台账所有年份、所有发放方的全部发放记录，只保留本文件内容。不受页面筛选条件限制；人员、考勤等其他模块不变。'}
      </p>
      {mode === 'add' && plan.sameIdChanged > 0 && <p role="status" className="mt-2 text-sm text-warn">有 {plan.sameIdChanged} 条同编号记录已被修改，增加模式会跳过；要修正原记录请选择“本次替换”。</p>}
      {stale && <p role="alert" className="mt-2 text-sm text-danger">预览后发放数据或台账已改变。请取消后重新选择文件，避免覆盖新改动。</p>}
      {plan.errors.length > 0 && <ul role="alert" className="mt-2 space-y-1 text-sm text-danger">{plan.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}{plan.errors.length > 10 && <li>另有 {plan.errors.length - 10} 项，请先修正文件后重新导入。</li>}</ul>}
      {mode === 'update' && <>
        <p className="mt-3 text-sm font-medium">逐条核对 · 还有 {plan.unresolved.length} 条未选择处理方式</p>
        <label className="mt-2 block text-sm">
          查找可替换的原记录（姓名、日期、发放方）
          <Input className="mt-1 w-full" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="旧文件无编号时，可先搜索再选择" />
        </label>
        {matches.length > 200 && <p className="mt-1 text-xs text-muted">原记录选项暂列前 200 条，请输入姓名或日期缩小范围。</p>}
        <ol className="mt-3 space-y-3">
          {rows.slice(currentPage * 10, currentPage * 10 + 10).map((row, offset) => {
            const i = currentPage * 10 + offset;
            const automatic = paymentImportChoice(existing, row);
            const choice = choices[i] ?? automatic;
            const old = choice?.kind === 'replace' ? existing.find((p) => p.id === choice.id) : undefined;
            const candidates = automatic?.kind === 'replace' ? existing.filter((p) => p.id === automatic.id) : options;
            const listed = old && !candidates.some((p) => p.id === old.id) ? [old, ...candidates] : candidates;
            const value = choice?.kind === 'replace' ? `replace:${choice.id}` : choice?.kind || '';
            return <li key={i} className="min-w-0 rounded-md border border-line p-3 text-sm">
              <p className="break-words"><strong>第 {i + 1} 条导入：</strong>{labelOf(row)}{row.remark ? ` · 备注：${row.remark}` : ' · 备注：空'}</p>
              {old && <p className="mt-1 break-words text-muted">原记录：{labelOf(old)}{old.remark ? ` · 备注：${old.remark}` : ' · 备注：空'}</p>}
              <label className="mt-2 block">
                {automatic ? '已按记录编号匹配，可替换或跳过' : '未匹配记录编号，请选择处理方式'}
                <select aria-label={`第 ${i + 1} 条处理方式`} className="field-select mt-1 w-full min-w-0 max-w-full" value={value} onChange={(e) => {
                  const v = e.target.value;
                  const next = { ...choices };
                  if (!v) delete next[i];
                  else next[i] = v.startsWith('replace:') ? { kind: 'replace', id: v.slice(8) } : { kind: v as 'add' | 'skip' };
                  onChoices(next);
                }}>
                  <option value="">请选择，不会自动覆盖</option>
                  {!automatic && <option value="add">作为新记录增加</option>}
                  <option value="skip">跳过本条</option>
                  {listed.map((p) => <option key={p.id} value={`replace:${p.id}`}>替换：{labelOf(p)}</option>)}
                </select>
              </label>
            </li>;
          })}
        </ol>
        {pages > 1 && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Button size="sm" variant="outline" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>上一页</Button>
          <span>{currentPage + 1} / {pages} 页（每页 10 条）</span>
          <Button size="sm" variant="outline" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>下一页</Button>
        </div>}
      </>}
      <p aria-live="polite" className="mt-3 break-words text-sm font-medium">{paymentImportSummary(plan, mode)}</p>
      {!blocked && <p className="mt-1 text-sm">确认后：{plan.rows.length} 条，金额 {total(plan.rows)}</p>}
      {mode === 'replaceAll' && <div className="mt-3 rounded-md border border-danger p-3 text-sm">
        <p>原有 {existing.length} 条 → 文件 {rows.length} 条；其中 {plan.removed} 条原记录编号不在文件中，将被删除。请先导出全部发放记录留作备份，勿使用筛选后的部分文件覆盖全台账。</p>
        <label className="mt-2 flex items-start gap-2"><input className="mt-1" type="checkbox" checked={confirmedAll} onChange={(e) => setConfirmedAll(e.target.checked)} />我确认覆盖当前台账所有年份的发放记录，并已保留备份</label>
      </div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant={mode === 'replaceAll' ? 'danger' : 'default'} disabled={blocked || (mode === 'replaceAll' && !confirmedAll)} onClick={onApply}>{mode === 'replaceAll' ? '确认全部替换' : '确认导入'}</Button>
        <Button variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </section>
  );
}
