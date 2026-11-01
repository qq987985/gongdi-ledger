import type { Payment } from "./types";
import { mergePayments, paymentKey } from "./excel/common";

export type PaymentImportMode = "add" | "replaceAll";
export interface PaymentImportPlan {
  rows: Payment[];
  added: number;
  updated: number;
  skipped: number;
  preserved: number;
  removed: number;
  errors: string[];
  sameIdChanged: number;
}

/** 纯预演；不改传入数组。调用方在确认时须核对预览快照仍有效，并检查权限。 */
export function planPaymentImport(
  existing: Payment[], incoming: Payment[], mode: PaymentImportMode,
): PaymentImportPlan {
  const plan: PaymentImportPlan = { rows: existing, added: 0, updated: 0, skipped: 0, preserved: existing.length,
    removed: 0, errors: [], sameIdChanged: 0 };
  if (mode !== "add" && mode !== "replaceAll") {
    plan.errors.push("导入方式无效，请重新选择新增导入或全部替换。");
    return plan;
  }
  const originals = new Map(existing.map((row) => [row.id, row]));
  const seen = new Set<string>();
  for (const [i, row] of incoming.entries()) {
    if (!row.id || seen.has(row.id)) plan.errors.push(`第 ${i + 1} 条记录编号为空或重复。复制新增行时请清空编号后重新导入。`);
    seen.add(row.id);
    const old = originals.get(row.id);
    if (old && (paymentKey(old) !== paymentKey(row) || old.source !== row.source || old.remark !== row.remark))
      plan.sameIdChanged++;
  }
  if (!incoming.length) plan.errors.push("文件中没有可导入的发放记录，不能替换。");
  if (plan.errors.length) return plan;
  if (mode === "add") {
    const result = mergePayments(existing, incoming);
    return { ...plan, rows: result.merged, added: result.added, skipped: result.skipped };
  }
  return { ...plan, rows: [...incoming], preserved: 0,
    removed: existing.filter((p) => !seen.has(p.id)).length,
    updated: incoming.filter((p) => originals.has(p.id)).length,
    added: incoming.filter((p) => !originals.has(p.id)).length };
}

export function paymentImportSummary(plan: PaymentImportPlan, mode: PaymentImportMode): string {
  return mode === "add"
    ? `新增导入：新增 ${plan.added} 条，跳过重复 ${plan.skipped} 条，保留原有 ${plan.preserved} 条`
    : `全部替换：确认后仅保留文件中的 ${plan.rows.length} 条发放记录`;
}
