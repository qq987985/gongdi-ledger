import type { ContractRecord, ContractEntry } from "./contracts";

export type { ContractRecord, ContractEntry, EntryKind } from "./contracts";

export interface WageHistory {
  id: string;
  fromDate: string; // 生效日期，格式 YYYY-MM-DD
  payType: "day" | "month";
  dailyWage: number;
  monthWage: number;
  otRule: string;
  remark: string;
}

export interface Person {
  id: string;
  name: string;
  team: string;
  personNo: string;
  idCard: string;
  gender: string;
  age: number | null;
  birthday: string;
  phone: string;
  // 兼容旧数据：保留当前工资字段作为最新值
  dailyWage: number;
  monthWage: number;
  payType: "day" | "month";
  otRule: string;
  // 工资历史记录
  wageHistory?: WageHistory[];
  bank: string;
  cardNo: string;
  address: string;
  idIssuer: string;
  idValidFrom: string;
  idValidTo: string;
  remark: string;
}

export interface AttendanceRow {
  id: string;
  year: number;
  month: number;
  name: string;
  team: string;
  days: number;
  otHours: number;
  allowance: number;
  deduction: number;
  remark: string;
}

export interface AttendanceDoc {
  id: string;
  year?: number;
  month?: number;
  fileName: string;
  remark: string;
}

export interface Payment {
  id: string;
  owner: string;
  receiver: string;
  date: string;
  amount: number;
  source: string;
  remark: string;
}

export interface Expense {
  id: string;
  name: string;
  year?: number;
  period?: string;
  unit?: string;
  qty: number;
  price: number;
  amount: number;
  status: "已报销" | "未报销";
  payMethod: string;
  voucherId: string;
  voucherFileName: string;
  claimant: string;
  forWhom: string;
  payBank: string;
  payCardNo: string;
  payAccount: string;
  payoutId: string;
  payoutFileName: string;
  payoutDate: string;
  payoutMethod: string;
  reimbursedAt: string;
  /** 购买时间等其余字段随数据保留 */
  date?: string;
  remark?: string;
}

export interface LedgerState {
  year: number;
  years: number[];
  people: Person[];
  attendance: AttendanceRow[];
  attendanceDocs: AttendanceDoc[];
  payments: Payment[];
  contracts: ContractRecord[];
  contractEntries: ContractEntry[];
  expenses: Expense[];
  accessHash: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  module: string;
}
