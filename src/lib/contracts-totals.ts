/**
 * 合同的「逐行 × 合计」口径唯一实现（口径一致性专项 20260916）。
 *
 * 从 `src/routes/contracts.tsx` 的 totals reduce 与 `src/routes/index.tsx` 的
 * 「应收」KPI 按行段机械提取（§12.1）：两处原来各写一遍合同金额的加总，
 * 页面上是逐行 `contractRollup` 之和、总览是 `contractRollup(...).payable` 之和，
 * 条件一旦分叉（比如一边忘了 year 过滤）就会对不上。现在都走这里。
 *
 * 口径没有改变：报量金额按合同设定的含税/不含税分别累加（`reportIncl`/`reportExcl`），
 * 顶部「报量金额」用的是「录入值之和」`report`，与表格里逐行显示的列相加相等
 * （见 tests/contracts-totals.test.ts 的对拍断言）。
 */
import { contractRollup, type ContractEntry, type ContractRecord } from "./contracts";

export interface ContractTotals {
  /** 合同金额之和 */
  amount: number;
  /** 录入报量之和（含税/不含税按各合同设定各自保留） */
  report: number;
  reportIncl: number;
  reportExcl: number;
  invoice: number;
  invoiceExcl: number;
  /** 已付 = 代付农民工 + 到分包 */
  receipt: number;
  workerPay: number;
  subPay: number;
  remain: number;
  payable: number;
  dueRemain: number;
}

export type ContractLike = Pick<ContractRecord, "id" | "taxRate" | "reportTaxMode" | "payRatio" | "contractAmount">;

export function sumContractRollups(list: ContractLike[], entries: ContractEntry[]): ContractTotals {
  return list.reduce<ContractTotals>(
    (acc, c) => {
      const r = contractRollup(c, entries);
      acc.amount += c.contractAmount || 0;
      acc.report += r.report;
      acc.reportIncl += r.reportIncl;
      acc.reportExcl += r.reportExcl;
      acc.invoice += r.invoice;
      acc.invoiceExcl += r.invoiceExcl;
      acc.receipt += r.receipt;
      acc.workerPay += r.workerPay;
      acc.subPay += r.subPay;
      acc.remain += r.remain;
      acc.payable += r.payable;
      acc.dueRemain += r.dueRemain;
      return acc;
    },
    {
      amount: 0,
      report: 0,
      reportIncl: 0,
      reportExcl: 0,
      invoice: 0,
      invoiceExcl: 0,
      receipt: 0,
      workerPay: 0,
      subPay: 0,
      remain: 0,
      payable: 0,
      dueRemain: 0,
    },
  );
}

/** 某个筛选范围（通常是某一年）的应收合计 —— 总览 KPI 与合同页用同一个算法 */
export function contractPayable(list: ContractLike[], entries: ContractEntry[]): number {
  return list.reduce((s, c) => s + contractRollup(c, entries).payable, 0);
}
