import * as XLSX from "xlsx";
import type { AttendanceRow, Expense, InsuranceMember, InsurancePolicy, Payment, Person } from "../../src/lib/types";
import type { ContractEntry, ContractRecord } from "../../src/lib/contracts";
import { uid } from "../../src/lib/utils";

export function buf(wb: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

/** 手工造一个单 sheet 工作簿（模拟用户手填/别的系统导出的表） */
export function handWb(sheetName: string, aoa: unknown[][]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetName);
  return wb;
}

export function person(over: Partial<Person> = {}): Person {
  return {
    id: uid(),
    name: "张三",
    team: "一班",
    personNo: "DEMO001",
    idCard: "110101199001011210",
    gender: "男",
    age: 36,
    birthday: "1990-01-01",
    phone: "13900000000",
    dailyWage: 300,
    monthWage: 0,
    payType: "day",
    otRule: "按小时:25",
    mealAllowance: 12,
    wageHistory: [],
    bank: "中国工商银行北京分行",
    cardNo: "6222021234567890123",
    address: "北京市东城区示例路1号",
    idIssuer: "北京市公安局东城分局",
    idValidFrom: "2020-01-01",
    idValidTo: "2040-01-01",
    remark: "备注甲",
    ...over,
  };
}

export function att(over: Partial<AttendanceRow> = {}): AttendanceRow {
  return {
    id: uid(),
    year: 2026,
    month: 4,
    name: "张三",
    team: "一班",
    days: 22,
    otHours: 10,
    allowance: 200,
    deduction: 50,
    remark: "",
    ...over,
  };
}

export function payment(over: Partial<Payment> = {}): Payment {
  return {
    id: uid(),
    owner: "张三",
    receiver: "张三",
    date: "2026-04-28",
    amount: 10000,
    source: "示例工程4月请款",
    remark: "本人",
    ...over,
  };
}

export function expense(over: Partial<Expense> = {}): Expense {
  return {
    id: uid(),
    name: "办公用品",
    year: 2026,
    period: "2026-04",
    unit: "项",
    qty: 2,
    price: 150,
    amount: 300,
    status: "未报销",
    payMethod: "现金",
    voucherId: "",
    voucherFileName: "发票-办公用品.pdf",
    claimant: "李四",
    forWhom: "李四",
    payBank: "中国建设银行北京支行",
    payCardNo: "6217001234567890123",
    payAccount: "6217001234567890123",
    payoutId: "",
    payoutFileName: "打款凭证.png",
    payoutDate: "2026-04-20",
    payoutMethod: "转账",
    reimbursedAt: "2026-04-20",
    date: "2026-04-01",
    remark: "报销备注",
    ...over,
  };
}

export function contract(over: Partial<ContractRecord> = {}): ContractRecord {
  return {
    id: uid(),
    year: 2026,
    code: "A-1",
    name: "示例住宅A区",
    contractor: "示例建设集团",
    subcontractor: "示例劳务公司",
    contractAmount: 1200000,
    taxRate: 9,
    reportTaxMode: "excl",
    payRatio: 80,
    warrantyStart: "2026-06-01",
    warrantyEnd: "2027-06-01",
    hasDeposit: true,
    depositAmount: 50000,
    manager: "王经营",
    status: "在建",
    prelimAmount: 0,
    settleReceivable: 0,
    remark: "合同备注",
    hasPaper: true,
    noContractReason: "",
    scanFileName: "示例住宅A区-合同电子版.pdf",
    ...over,
  };
}

export function entry(over: Partial<ContractEntry> & { contractId: string; kind: ContractEntry["kind"] }): ContractEntry {
  return {
    id: uid(),
    date: "2026-03-31",
    amount: 0,
    amountExcl: 0,
    taxRate: 0,
    workerPay: 0,
    workerPayDate: "",
    payTo: "",
    no: "",
    remark: "",
    fileName: "",
    workerFileName: "",
    ...over,
  };
}

export function policy(over: Partial<InsurancePolicy> = {}): InsurancePolicy {
  return {
    id: uid(),
    policyNo: "P-2026-001",
    buyer: "示例建设集团",
    name: "示例住宅A区团意险",
    company: "平安保险",
    premiumPerPerson: 300,
    headcount: 20,
    coverage: 1000000,
    periodStart: "2026-03-01",
    periodEnd: "2027-02-28",
    linkedPolicyId: "",
    contracts: [{ id: uid(), fileName: "团意险保单.pdf" }],
    remark: "保单备注",
    ...over,
  };
}

export function member(over: Partial<InsuranceMember> = {}): InsuranceMember {
  return {
    id: uid(),
    policyId: "",
    name: "张三",
    leader: "王队长",
    startDate: "2026-03-01",
    endDate: "",
    remark: "成员备注",
    ...over,
  };
}
