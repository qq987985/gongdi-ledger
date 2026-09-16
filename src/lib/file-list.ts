/**
 * 影像资料列表的纯数据整理（1.8.8 §12.1：页面只留骨架）。
 *
 * 背景（报告 `docs/审查与报告/功能测试-C-…-20260916.md`）：
 * · D2 —— 保单里上传的「保险合同」PDF 在影像资料页**既看不到也筛不出**（页面只收集了
 *   考勤/合同明细/合同扫描件/报销凭证/报销打款，漏了 `insurancePolicies[].contracts`）；
 * · D3 —— 缺 `year/month` 的老数据（或异常数据）归属列显示成 `undefined年undefined月考勤`。
 *
 * 这两件都是「数据 → 显示字段」的映射，按规范抽成纯函数放 `src/lib/`，页面只负责渲染。
 */
import type { InsuranceContract, InsurancePolicy } from "./types";

/**
 * 考勤影像的归属文案。
 * 年月齐全 → 「2026年3月考勤」；缺任一项（老数据/异常数据）→ 「未标注年月」，绝不出现 undefined。
 */
export function attendanceDocBelong(d: { year?: number; month?: number } | null | undefined): string {
  const y = Number(d?.year);
  const m = Number(d?.month);
  if (Number.isFinite(y) && y >= 1900 && y <= 2100 && Number.isFinite(m) && m >= 1 && m <= 12) {
    return `${y}年${m}月考勤`;
  }
  return "未标注年月";
}

/** 保单里的一份保险合同文件（影像资料页要用保单信息做归属与命名） */
export interface InsuranceContractFile {
  id: string;
  fileName: string;
  policyNo: string;
  name: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * 摊平所有保单的「保险合同」文件。
 * 文件名/文件 id 缺失的条目跳过（同 doc-actions 的 isSafeFileName 口径：空名不进列表）。
 * 同一 id 只出一条（组合险互挂等异常数据里可能重复挂同一份文件）。
 */
export function insuranceContractFiles(policies: InsurancePolicy[] | undefined | null): InsuranceContractFile[] {
  const out: InsuranceContractFile[] = [];
  const seen = new Set<string>();
  for (const p of policies || []) {
    const contracts: InsuranceContract[] = Array.isArray(p?.contracts) ? p.contracts : [];
    for (const c of contracts) {
      const fileName = (c?.fileName || "").trim();
      const id = (c?.id || "").trim();
      if (!fileName || !id || seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        fileName,
        policyNo: p.policyNo || "",
        name: p.name || "",
        periodStart: p.periodStart || "",
        periodEnd: p.periodEnd || "",
      });
    }
  }
  return out;
}
