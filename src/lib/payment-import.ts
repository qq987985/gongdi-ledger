import type { Payment } from "./types";
import { mergePayments, paymentKey } from "./excel/common";

export type PaymentImportMode = "add" | "update" | "replaceAll";
export type PaymentImportChoice = { kind: "replace"; id: string } | { kind: "add" } | { kind: "skip" };
export type PaymentImportChoices = Record<number, PaymentImportChoice>;
export interface PaymentImportPlan {
  rows: Payment[];
  added: number;
  updated: number;
  skipped: number;
  preserved: number;
  removed: number;
  unresolved: number[];
  errors: string[];
  sameIdChanged: number;
}

/** 本次替换仅按稳定编号自动定位；旧文件/未匹配编号必须人工选择，不按姓名/日期/金额猜。 */
export function paymentImportChoice(existing: Payment[], row: Payment): PaymentImportChoice | undefined {
  return existing.filter((p) => p.id === row.id).length === 1 ? { kind: "replace", id: row.id } : undefined;
}

/** 纯预演；不改传入数组。调用方在确认时须核对预览快照仍有效，并检查权限。 */
export function planPaymentImport(
  existing: Payment[], incoming: Payment[], mode: PaymentImportMode, choices: PaymentImportChoices = {},
): PaymentImportPlan {
  const plan: PaymentImportPlan = { rows: existing, added: 0, updated: 0, skipped: 0, preserved: existing.length,
    removed: 0, unresolved: [], errors: [], sameIdChanged: 0 };
  const originals = new Map<string, Payment>();
  const ambiguous = new Set<string>();
  for (const row of existing) {
    if (originals.has(row.id)) ambiguous.add(row.id);
    originals.set(row.id, row);
  }
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
  if (mode === "replaceAll") {
    return { ...plan, rows: [...incoming], preserved: 0,
      removed: existing.filter((p) => !seen.has(p.id)).length,
      updated: incoming.filter((p) => originals.has(p.id)).length,
      added: incoming.filter((p) => !originals.has(p.id)).length };
  }
  const replacements = new Map<string, Payment>();
  const additions: Payment[] = [];
  const reserved = new Set(existing.map((p) => p.id));
  for (const [i, row] of incoming.entries()) {
    const choice = choices[i] ?? (originals.has(row.id) && !ambiguous.has(row.id) ? { kind: "replace", id: row.id } : undefined);
    if (!choice) { plan.unresolved.push(i); continue; }
    if (choice.kind === "skip") { plan.skipped++; continue; }
    if (choice.kind === "add") {
      if (reserved.has(row.id)) {
        plan.errors.push(`第 ${i + 1} 条编号已存在，不能新增为另一笔。请选替换原记录，或清空文件编号后重新导入。`);
      } else { additions.push(row); reserved.add(row.id); }
      continue;
    }
    if (!originals.has(choice.id) || ambiguous.has(choice.id)) { plan.errors.push(`第 ${i + 1} 条选择的原记录不存在或编号不唯一，请重新选择。`); continue; }
    if (replacements.has(choice.id)) { plan.errors.push(`多条导入记录选择了同一笔原记录（第 ${i + 1} 条），请核对。`); continue; }
    // 新文件有已知编号时不允许另选其他记录，防止复制编号造成错配。
    if (row.id !== choice.id && originals.has(row.id)) {
      plan.errors.push(`第 ${i + 1} 条已有对应编号，不能覆盖另一笔记录。`); continue;
    }
    replacements.set(choice.id, { ...row, id: choice.id });
  }
  plan.updated = replacements.size;
  plan.added = additions.length;
  plan.preserved = existing.length - replacements.size;
  // 未完成匹配的预演不能产生可误用的部分写入结果。
  if (!plan.errors.length && !plan.unresolved.length)
    plan.rows = [...existing.map((p) => replacements.get(p.id) ?? p), ...additions];
  return plan;
}

export function paymentImportSummary(plan: PaymentImportPlan, mode: PaymentImportMode): string {
  const label = mode === "add" ? "增加记录" : mode === "update" ? "本次替换" : "全部替换";
  return `${label}：更新 ${plan.updated} 条，新增 ${plan.added} 条，跳过 ${plan.skipped} 条，保留其他 ${plan.preserved} 条，删除 ${plan.removed} 条`;
}
