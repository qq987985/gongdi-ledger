import { uid } from "./utils";
import { round2 } from "./wage";

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

export interface ContractRecord {
  id: string;
  year: number;
  code: string;
  name: string;
  contractor: string;
  subcontractor: string;
  contractAmount: number;
  taxRate: number;
  reportTaxMode: string;
  payRatio: number;
  warrantyStart: string;
  warrantyEnd: string;
  hasDeposit: boolean;
  depositAmount: number;
  manager: string;
  status: string;
  prelimAmount: number;
  settleReceivable: number;
  remark: string;
  hasPaper?: boolean;
  noContractReason?: string;
  scanFileName?: string;
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

export type EntryKind = "report" | "invoice" | "receipt";

export interface ContractEntry {
  id: string;
  contractId: string;
  kind: EntryKind;
  date: string;
  amount: number;
  amountExcl: number;
  taxRate: number;
  workerPay: number;
  workerPayDate: string;
  payTo: "" | "worker" | "sub";
  no: string;
  remark: string;
  fileName: string;
  workerFileName: string;
}

export function normalizeEntry(e: Partial<ContractEntry> & { kind: EntryKind; contractId: string }): ContractEntry {
  const amount = Number(e.amount) || 0;
  const taxRate = Number(e.taxRate) || 0;
  let amountExcl = Number(e.amountExcl) || 0;
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
    workerPay: Number(e.workerPay) || 0,
    workerPayDate: e.workerPayDate || "",
    payTo,
    no: e.no || "",
    remark: e.remark || "",
    fileName: e.fileName || "",
    workerFileName: e.workerFileName || "",
  };
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
    const w = Number(raw.workerPay) || 0;
    const sub = round2((Number(raw.amount) || 0) - w);
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
