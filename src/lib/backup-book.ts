import type * as XLSX from "xlsx";
import { buildFullWorkbook } from "./excel";
import { hasContent } from "./work";
import type {
  AttendanceRow,
  ContractEntry,
  ContractRecord,
  Expense,
  InsuranceMember,
  InsurancePolicy,
  Payment,
  Person,
} from "./types";

/**
 * 「立即备份 Excel」工作簿的**唯一组装处**（F2 / A13）。
 *
 * 原来 `nas-sync.pushNasBackup()` 直接调 `buildFullWorkbook`，只传了
 * 人员 / 考勤 / 发放 / 保险 —— **报销整块漏掉**、**合同（合同管理表 + 报量/开票/收款明细）
 * 在任何 Excel 里都没有**。也就是：用户点「立即备份」，拿到的那份文件里没有报销和合同，
 * 事后真出事按备份恢复，这两块数据就没了（现场级）。
 *
 * 这里做三件事，别处不要再拼一遍：
 * 1. `buildBackupWorkbook` —— 复用既有导出函数（`buildFullWorkbook` + `buildContractWorkbook`）
 *    拼出**全实体**工作簿：人员 / 各年各月考勤 / 发放 / 报销 / 合同+合同明细 / 保险+参保人。
 * 2. 考勤覆盖**台账里所有年份**（原来是「只传当前年」，换年度后备份就少了别的年份）。
 * 3. `backupCounts` + `backupSummaryText` —— 纯函数，备份完在界面上写「已备份 N 人 / M 笔发放 /
 *    K 条报销 / J 份合同」，让用户肉眼就能核对这份备份到底装了什么。
 */

export interface BackupBookInput {
  /** 当前工作年（没有任何年份信息时的兜底） */
  year: number;
  /** 台账里展开过的年份（可选；会与考勤里出现的年份合并） */
  years?: number[];
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  expenses?: Expense[];
  contracts?: ContractRecord[];
  contractEntries?: ContractEntry[];
  insurancePolicies?: InsurancePolicy[];
  insuranceMembers?: InsuranceMember[];
}

/** 备份要覆盖的月份：设置里展开的年份 ∪ 考勤里出现过的年份 ∪ 当前工作年，每年 12 个月 */
export function backupMonths(input: BackupBookInput): { year: number; month: number }[] {
  const years = new Set<number>();
  for (const y of input.years || []) if (y >= 2e3 && y <= 2100) years.add(Math.round(y));
  for (const a of input.attendance) if (a.year >= 2e3 && a.year <= 2100) years.add(Math.round(a.year));
  if (input.year >= 2e3 && input.year <= 2100) years.add(Math.round(input.year));
  if (!years.size) years.add(input.year);
  const list: { year: number; month: number }[] = [];
  for (const y of [...years].sort((a, b) => a - b)) for (let m = 1; m <= 12; m += 1) list.push({ year: y, month: m });
  return list;
}

export function buildBackupWorkbook(input: BackupBookInput): XLSX.WorkBook {
  return buildFullWorkbook({
    year: input.year,
    people: input.people,
    attendance: input.attendance,
    payments: input.payments,
    expenses: input.expenses || [],
    insurancePolicies: input.insurancePolicies || [],
    insuranceMembers: input.insuranceMembers || [],
    contracts: input.contracts || [],
    contractEntries: input.contractEntries || [],
    months: backupMonths(input),
  });
}

export interface BackupCounts {
  people: number;
  /** 真正会写进月表的考勤行（有姓名 + 有内容，与导出同口径） */
  attendance: number;
  payments: number;
  expenses: number;
  contracts: number;
  contractEntries: number;
  policies: number;
  insuranceMembers: number;
}

export function backupCounts(input: BackupBookInput): BackupCounts {
  return {
    people: input.people.length,
    attendance: input.attendance.filter((a) => (a.name || "").trim() && hasContent(a)).length,
    payments: input.payments.length,
    expenses: (input.expenses || []).length,
    contracts: (input.contracts || []).length,
    contractEntries: (input.contractEntries || []).length,
    policies: (input.insurancePolicies || []).length,
    insuranceMembers: (input.insuranceMembers || []).length,
  };
}

/** 界面上那句「已备份 …」，供备份成功后显示（肉眼核对用） */
export function backupSummaryText(c: BackupCounts): string {
  const parts = [
    `已备份 ${c.people} 人`,
    `${c.attendance} 条考勤`,
    `${c.payments} 笔发放`,
    `${c.expenses} 条报销`,
    `${c.contracts} 份合同（含 ${c.contractEntries} 条明细）`,
    `${c.policies} 份保单`,
    `${c.insuranceMembers} 位参保人`,
  ];
  return parts.join(" / ");
}
