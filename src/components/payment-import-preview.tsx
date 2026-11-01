import * as React from "react";
import { Button } from "./ui/button";
import { money } from "~/lib/utils";
import { round2 } from "~/lib/wage";
import { paymentImportSummary, type PaymentImportMode, type PaymentImportPlan } from "~/lib/payment-import";
import type { Payment } from "~/lib/types";

const total = (rows: Payment[]) => `${money(round2(rows.reduce((n, p) => n + p.amount, 0)))} 元`;

export function PaymentImportPreview(props: {
  fileName: string; rows: Payment[]; existing: Payment[]; mode: PaymentImportMode;
  plan: PaymentImportPlan; stale: boolean;
  onMode: (mode: PaymentImportMode) => void;
  onApply: () => void; onCancel: () => void;
}) {
  const { fileName, rows, existing, mode, plan, stale, onMode, onApply, onCancel } = props;
  const [confirmedAll, setConfirmedAll] = React.useState(false);
  const blocked = stale || plan.errors.length > 0;
  return (
    <section aria-label="发放导入确认" className="basis-full min-w-0 mt-3 rounded-xl border border-accent bg-surface p-4">
      <h2 className="font-semibold">发放导入确认</h2>
      <p className="mt-1 break-all text-sm text-muted">{fileName} · 文件 {rows.length} 条，金额 {total(rows)}；当前台账 {existing.length} 条，金额 {total(existing)}</p>
      <p className="mt-2 text-sm text-muted">改错流程：导出全部发放 → 保留备份并修改 → 全部替换。导出后如又录入或修改了数据，请重新导出。</p>
      <fieldset className="mt-3 flex flex-wrap gap-3">
        <legend className="mb-2 text-sm font-medium">导入方式</legend>
        {([['add', '新增导入'], ['replaceAll', '全部替换']] as const).map(([value, label]) => (
          <label key={value} className="inline-flex items-center gap-1.5 text-sm">
            <input type="radio" name="pay-mode" checked={mode === value} onChange={() => { onMode(value); setConfirmedAll(false); }} />{label}
          </label>
        ))}
      </fieldset>
      <p className="mt-2 text-sm text-muted">
        {mode === 'add' ? '只追加新记录；同编号或内容重复的跳过。修改已有记录请先导出全部发放，修改后选择“全部替换”。'
          : '覆盖当前台账所有年份、所有发放方的全部发放记录，只保留本文件内容。不受页面筛选条件限制；人员、考勤等其他模块不变。'}
      </p>
      {mode === 'add' && plan.sameIdChanged > 0 && <p role="status" className="mt-2 text-sm text-warn">有 {plan.sameIdChanged} 条同编号记录已被修改，新增导入会跳过。要修正记录，请先导出全部发放，修改后选择“全部替换”。</p>}
      {stale && <p role="alert" className="mt-2 text-sm text-danger">预览后发放数据或台账已改变。请取消后重新选择文件，避免覆盖新改动。</p>}
      {plan.errors.length > 0 && <ul role="alert" className="mt-2 space-y-1 text-sm text-danger">{plan.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}{plan.errors.length > 10 && <li>另有 {plan.errors.length - 10} 项，请先修正文件后重新导入。</li>}</ul>}
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
