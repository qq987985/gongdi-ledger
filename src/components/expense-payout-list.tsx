import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { ExpensePayoutBatch } from "~/lib/expense-payout";
import { money } from "~/lib/utils";

export function ExpensePayoutList({ batches, shownIds, onOpen }: {
  batches: ExpensePayoutBatch[];
  shownIds: Set<string>;
  onOpen: (id: string) => void;
}) {
  return <section aria-label="收款批次列表" className="space-y-3">
    <div className="rounded-xl border border-line bg-bg-elevated p-4 text-sm">
      <h2 className="font-semibold">一笔收款，对应一批费用</h2>
      <p className="mt-1 leading-relaxed text-muted">共 {batches.length} 批。打开后可核对整批明细、登记收款或一次解除合并。费用不会因收款人或日期相同而自动合并。</p>
    </div>
    {batches.map((batch) => {
      const hidden = batch.rows.filter((row) => !shownIds.has(row.id)).length;
      return <article key={batch.id} data-payout-id={batch.id} className="rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-semibold">{batch.payee || "未填收款人"}</h3><Badge tone={batch.status === "已报销" ? "ok" : "warn"}>{batch.status === "已报销" ? "已收款" : batch.status === "未报销" ? "待收款" : "状态待核对"}</Badge>{batch.issues.length ? <Badge tone="warn">需核对</Badge> : null}</div>
            <p className="mt-2 text-sm"><span className="font-medium tabular-nums">¥{money(batch.total)}</span> · {batch.rows.length} 笔 · {batch.date || "未填日期"}</p>
            <p className="mt-1 break-words text-xs text-muted">报销人：{batch.claimant || "未填"}</p>
            <p className="mt-1 break-words text-xs text-muted">{batch.rows.slice(0, 3).map((row) => row.name).join("、")}{batch.rows.length > 3 ? ` 等${batch.rows.length}笔` : ""}</p>
            {batch.fileName ? <p className="mt-2 break-all text-xs text-muted">凭证：{batch.fileName}</p> : <p className="mt-2 text-xs text-muted">未关联共同收款凭证</p>}
            {batch.issues.length ? <p className="mt-2 text-xs text-warn">{batch.issues.join("；")}</p> : null}
            {hidden ? <p className="mt-2 text-xs text-muted">另含 {hidden} 笔在当前筛选范围外，打开后按完整批次核对。</p> : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpen(batch.id)}>查看批次</Button>
        </div>
      </article>;
    })}
    {!batches.length ? <p className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-muted">当前筛选下没有收款批次。到“报销明细”选费用，或点击“登记收款”开始。</p> : null}
  </section>;
}
