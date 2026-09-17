import { uid } from "./utils";
import { round2 } from "./wage";
import { numOrWarn } from "./num";
// 合同三型（ContractRecord / EntryKind / ContractEntry）的定义在 `./types`（唯一模型来源，§3）。
// 为什么定义放那边（G2 / 专家评审 A2）：本文件要 wage 的 round2（值），wage 要 types 的 Person（类型），
// types 原来又要本文件的合同类型 —— 三者互指形成 import 环（§12 红线）。
// 类型下沉到叶子 types.ts 之后三个方向都是单向；这里再导出一次，调用点（~/lib/contracts / ./contracts）不受影响。
import type { ContractEntry, ContractRecord, EntryKind } from "./types";
export type { ContractEntry, ContractRecord, EntryKind } from "./types";

export const CONTRACT_STATUSES = [
  "在建",
  "完工",
  "总版图",
  "初审",
  "终审",
  "分包结算",
  "结算完成",
  "结算已开票",
  "质保期",
  "退质保金",
  "完成",
] as const;

export function normalizeContractStatus(raw: unknown): string {
  const s = String(raw || "").trim();
  if ((CONTRACT_STATUSES as readonly string[]).includes(s)) return s;
  if (/退质保/.test(s)) return "退质保金";
  if (/质保/.test(s)) return "质保期";
  if (/结算已开票|已开票/.test(s)) return "结算已开票";
  if (/结算完成/.test(s)) return "结算完成";
  if (/分包结算/.test(s)) return "分包结算";
  if (/总版图/.test(s)) return "总版图";
  if (/终审|审计/.test(s)) return "终审";
  if (/初审/.test(s)) return "初审";
  if (/完工/.test(s)) return "完工";
  if (/完成/.test(s)) return "完成";
  if (/结算/.test(s)) return "分包结算";
  return "在建";
}

export function emptyContract(year: number): ContractRecord {
  return {
    id: uid(),
    year,
    code: "",
    name: "",
    contractor: "",
    subcontractor: "",
    contractAmount: 0,
    taxRate: 9,
    reportTaxMode: "excl",
    payRatio: 80,
    warrantyStart: "",
    warrantyEnd: "",
    hasDeposit: false,
    depositAmount: 0,
    manager: "",
    status: "在建",
    prelimAmount: 0,
    settleReceivable: 0,
    remark: "",
    hasPaper: true,
    noContractReason: "",
    scanFileName: "",
  };
}

export interface TaxSplit {
  entered: number;
  incl: number;
  excl: number;
}

/** 按合同设定，把录入的报量拆成含税 / 不含税 */
export function splitTax(amount: number, taxRate: number, mode: string): TaxSplit {
  const rate = (taxRate || 0) / 100;
  const n = amount || 0;
  if (mode === "incl") return { entered: n, incl: n, excl: rate > 0 ? round2(n / (1 + rate)) : n };
  return { entered: n, excl: n, incl: round2(n * (1 + rate)) };
}

export function normalizeEntry(e: Partial<ContractEntry> & { kind: EntryKind; contractId: string }): ContractEntry {
  // 明细金额可能来自 Excel 单元格 / 表单 / 旧版持久化数据（运行时是字符串），
  // 用容错解析：读不出来才按 0，并留一条 warn，不再静默把「1,200」写成 0。
  // 入库统一取整到分（专家评审 A-2，与报销/发放/工资同口径）：亚分金额会让
  // 明细逐行之和与合同表尾合计差 0.01。这里是合同明细的唯一入口 ——
  // store.addContractEntry / updateContractEntry 与 Excel 导入三条路径都经它。
  const amount = round2(numOrWarn(e.amount, 0, "合同明细.金额"));
  const taxRate = numOrWarn(e.taxRate, 0, "合同明细.税率");
  let amountExcl = numOrWarn(e.amountExcl, 0, "合同明细.不含税金额");
  if (e.kind === "invoice" && amount && !amountExcl && taxRate > 0)
    amountExcl = round2(amount / (1 + taxRate / 100));
  const payTo = e.kind === "receipt" ? (e.payTo === "worker" ? "worker" : "sub") : "";
  return {
    id: e.id || uid(),
    contractId: e.contractId,
    kind: e.kind,
    date: e.date || "",
    amount,
    amountExcl,
    taxRate,
    workerPay: numOrWarn(e.workerPay, 0, "合同明细.代付金额"),
    workerPayDate: e.workerPayDate || "",
    payTo,
    no: e.no || "",
    remark: e.remark || "",
    fileName: e.fileName || "",
    workerFileName: e.workerFileName || "",
  };
}

/**
 * 明细编辑的改动清单（合同三类明细的「改」入口用；无改动返回 []）。
 *
 * 纯函数，确认文案与测试共用；口径与 `normalizeEntry` 的字段一一对应，
 * 不在编辑路径另造一套金额/税额算法（金额、不含税、税率仍是既有语义）。
 */
export function contractEntryChanges(before: ContractEntry, after: ContractEntry): string[] {
  const labels: [keyof ContractEntry, string][] = [
    ["date", "日期"],
    ["amount", "金额"],
    ["amountExcl", "不含税"],
    ["taxRate", "税率"],
    ["payTo", "收款去向"],
    ["no", "单号"],
    ["remark", "备注"],
    ["fileName", "影像文件"],
  ];
  const show = (k: keyof ContractEntry, v: unknown): string => {
    if (k === "payTo") return v === "worker" ? "代付农民工" : v === "sub" ? "到分包" : "";
    if (v === undefined || v === null || v === "") return "";
    return String(v);
  };
  const out: string[] = [];
  for (const [k, label] of labels) {
    const a = show(k, before?.[k]);
    const b = show(k, after?.[k]);
    if (a !== b) out.push(`${label}：${a || "（空）"} → ${b || "（空）"}`);
  }
  return out;
}

/** 旧数据：一笔收款里同时填了代付，拆成两笔（日期可以不同） */
export function splitLegacyReceipts(
  entries: (Partial<ContractEntry> & { kind: EntryKind; contractId: string })[],
): ContractEntry[] {
  const out: ContractEntry[] = [];
  for (const raw of entries) {
    const e = normalizeEntry(raw);
    if (e.kind !== "receipt") {
      out.push(e);
      continue;
    }
    if (raw.payTo === "worker" || raw.payTo === "sub") {
      out.push(e);
      continue;
    }
    const w = numOrWarn(raw.workerPay, 0, "收款.代付金额");
    const sub = round2(numOrWarn(raw.amount, 0, "收款.金额") - w);
    if (w > 0 && sub > 0) {
      out.push(normalizeEntry({ ...e, payTo: "sub", amount: sub, workerPay: 0 }));
      out.push(
        normalizeEntry({
          ...e,
          id: uid(),
          payTo: "worker",
          amount: w,
          date: raw.workerPayDate || e.date,
          fileName: raw.workerFileName || "",
          workerPay: 0,
        }),
      );
    } else if (w > 0)
      out.push(normalizeEntry({ ...e, payTo: "worker", amount: w, date: raw.workerPayDate || e.date }));
    else out.push(normalizeEntry({ ...e, payTo: "sub" }));
  }
  return out;
}

export interface ContractRollupResult {
  report: number;
  reportIncl: number;
  reportExcl: number;
  invoice: number;
  invoiceExcl: number;
  receipt: number;
  workerPay: number;
  subPay: number;
  payable: number;
  remain: number;
  dueRemain: number;
}

export function contractRollup(
  c: Pick<ContractRecord, "id" | "taxRate" | "reportTaxMode" | "payRatio">,
  entries: ContractEntry[],
): ContractRollupResult {
  const mine = entries.filter((e) => e.contractId === c.id);
  const report = round2(
    mine.filter((e) => e.kind === "report").reduce((s, e) => s + (e.amount || 0), 0),
  );
  const invoice = round2(
    mine.filter((e) => e.kind === "invoice").reduce((s, e) => s + (e.amount || 0), 0),
  );
  const invoiceExcl = round2(
    mine.filter((e) => e.kind === "invoice").reduce((s, e) => s + (e.amountExcl || 0), 0),
  );
  const recs = mine.filter((e) => e.kind === "receipt");
  const workerPay = round2(
    recs.filter((e) => e.payTo === "worker").reduce((s, e) => s + (e.amount || 0), 0),
  );
  const subPay = round2(
    recs.filter((e) => e.payTo !== "worker").reduce((s, e) => s + (e.amount || 0), 0),
  );
  const paid = round2(workerPay + subPay);
  const tax = splitTax(report, c.taxRate, c.reportTaxMode || "excl");
  const receivable = round2(tax.incl * ((c.payRatio || 0) / 100));
  const remain = round2(invoice - paid);
  const dueRemain = round2(receivable - paid);
  return {
    report,
    reportIncl: tax.incl,
    reportExcl: tax.excl,
    invoice,
    invoiceExcl,
    receipt: paid,
    workerPay,
    subPay,
    payable: receivable,
    remain,
    dueRemain,
  };
}
