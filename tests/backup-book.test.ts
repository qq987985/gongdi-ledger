/**
 * F2 / A13：「立即备份 Excel」必须含**全部实体**，而且条数要能肉眼核对。
 *
 * 现场问题：备份工作簿原来只传了人员 / 考勤 / 发放 / 保险 ——
 * **报销整块漏掉**、**合同（合同管理表 + 报量/开票/收款明细）在任何 Excel 里都没有**。
 * 用户拿到的那份「备份」里根本没有这两块，真出事按它恢复就丢数据。
 *
 * 顺便盯住第二条：备份原来只传当前年（`year: s.year`），别的年份的考勤也不在里面。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { backupCounts, backupMonths, backupSummaryText, buildBackupWorkbook, type BackupBookInput } from "../src/lib/backup-book";
import type { AttendanceRow, Expense, InsuranceMember, InsurancePolicy, Payment, Person } from "../src/lib/types";
import type { ContractEntry, ContractRecord } from "../src/lib/contracts";

function person(name: string): Person {
  return {
    id: `p-${name}`,
    name,
    team: "一班",
    personNo: "",
    idCard: "",
    gender: "男",
    age: 30,
    birthday: "1990-01-01",
    phone: "",
    dailyWage: 300,
    monthWage: 0,
    payType: "day",
    otRule: "",
    mealAllowance: 0,
    wageHistory: [],
    bank: "",
    cardNo: "",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
  };
}

function att(name: string, year: number, month: number, days: number): AttendanceRow {
  return { id: `a-${name}-${year}-${month}`, year, month, name, team: "一班", days, otHours: 0, allowance: 0, deduction: 0, remark: "" };
}

function pay(id: string, owner: string, amount: number): Payment {
  return { id, owner, receiver: "", date: "2026-06-10", amount, source: "公司", remark: "" };
}

function expense(id: string, name: string, amount: number): Expense {
  // 报销结构字段多，这里只填「备份/往返」关心的那几个（其余留空）
  return {
    id,
    name,
    year: 2026,
    period: "",
    unit: "",
    qty: 0,
    price: 0,
    amount,
    status: "未报销",
    payMethod: "公司转账",
    voucherId: "",
    voucherFileName: "",
    claimant: name,
    forWhom: name,
    payBank: "",
    payCardNo: "",
    payAccount: "",
    payoutId: "",
    payoutFileName: "",
    payoutDate: "",
    payoutMethod: "",
    reimbursedAt: "",
    date: "2026-05-20",
    remark: "",
  };
}

function contract(id: string, name: string): ContractRecord {
  return {
    id,
    year: 2026,
    code: `DEMO-${id}`,
    name,
    contractor: "总包",
    subcontractor: "分包",
    contractAmount: 100000,
    taxRate: 9,
    reportTaxMode: "excl",
    payRatio: 80,
    warrantyStart: "",
    warrantyEnd: "",
    hasDeposit: false,
    depositAmount: 0,
    manager: "王经营",
    status: "在建",
    prelimAmount: 0,
    settleReceivable: 0,
    hasPaper: true,
    scanFileName: "",
    noContractReason: "",
    remark: "",
  } as unknown as ContractRecord;
}

function entry(contractId: string, kind: "report" | "invoice" | "receipt", amount: number): ContractEntry {
  return { id: `e-${contractId}-${kind}`, contractId, kind, date: "2026-03-31", amount, payTo: "sub", no: "", fileName: "", remark: "" } as unknown as ContractEntry;
}

function policy(id: string): InsurancePolicy {
  return {
    id,
    policyNo: `P-${id}`,
    name: "团体意外险",
    buyer: "公司",
    company: "某保险公司",
    premiumPerPerson: 100,
    headcount: 2,
    coverage: 500000,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    linkedPolicyId: "",
    contracts: [],
    remark: "",
  } as unknown as InsurancePolicy;
}

function member(id: string, policyId: string, name: string): InsuranceMember {
  return { id, policyId, name, leader: "", startDate: "2026-01-01", endDate: "", remark: "" } as unknown as InsuranceMember;
}

/** 2 条报销 + 1 份合同（含报量/开票/收款各一笔）——正是原来会丢的那些 */
function fixture(): BackupBookInput {
  return {
    year: 2026,
    years: [2025, 2026],
    people: [person("张三"), person("李四")],
    attendance: [att("张三", 2026, 1, 10), att("李四", 2026, 2, 8), att("张三", 2025, 12, 20)],
    payments: [pay("y1", "张三", 5000), pay("y2", "李四", 3000)],
    expenses: [expense("x1", "张三", 1200), expense("x2", "李四", 800)],
    contracts: [contract("c1", "示例住宅A区")],
    contractEntries: [entry("c1", "report", 180000), entry("c1", "invoice", 200000), entry("c1", "receipt", 80000)],
    insurancePolicies: [policy("i1")],
    insuranceMembers: [member("m1", "i1", "张三"), member("m2", "i1", "李四")],
  };
}

function rows(wb: XLSX.WorkBook, sheet: string): unknown[][] {
  const ws = wb.Sheets[sheet];
  assert.ok(ws, `工作簿里没有「${sheet}」这张表（现有：${wb.SheetNames.join("、")}）`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
}

/** 表里有没有某一行「这一列等于某值」的记录 */
function hasCell(wb: XLSX.WorkBook, sheet: string, value: string | number): boolean {
  return rows(wb, sheet).some((r) => r.some((c) => c === value));
}

test("备份工作簿含全部实体：人员 / 考勤 / 发放 / 报销 / 合同+明细 / 保险+参保人", () => {
  const wb = buildBackupWorkbook(fixture());
  for (const sheet of ["人员信息", "2026年1月考勤", "2026年2月考勤", "发放记录", "报销单", "合同管理表", "月报量明细", "开票明细", "收款明细", "保险保单", "保险人员"])
    assert.ok(wb.SheetNames.includes(sheet), `缺少 sheet：${sheet}（现有：${wb.SheetNames.join("、")}）`);
});

test("备份工作簿真的写进了报销（2 条）与合同（1 份 + 明细 3 笔）", () => {
  const wb = buildBackupWorkbook(fixture());
  // 每张表的结构：标题行 + 表头行 + 数据行（与既有导出函数的版式一致）
  const expRows = rows(wb, "报销单");
  assert.equal(expRows.length, 2 + 2, "报销单应为标题 + 表头 + 2 条");
  assert.ok(hasCell(wb, "报销单", 1200), "报销金额应写进备份");
  const conRows = rows(wb, "合同管理表");
  assert.equal(conRows.length, 1 + 2, "合同管理表应为标题 + 表头 + 1 份合同");
  assert.ok(hasCell(wb, "合同管理表", "示例住宅A区"), "合同名称应写进备份");
  assert.equal(hasCell(wb, "合同管理表", "DEMO-c1"), true, "合同编号应写进备份");
  assert.equal(rows(wb, "月报量明细").length, 1 + 2, "月报量明细应为标题 + 表头 + 1 笔");
  assert.equal(rows(wb, "开票明细").length, 1 + 2, "开票明细应为标题 + 表头 + 1 笔");
  assert.equal(rows(wb, "收款明细").length, 1 + 2, "收款明细应为标题 + 表头 + 1 笔");
});

test("备份工作簿覆盖台账里所有年份的考勤，不只是当前年", () => {
  const input = fixture();
  const months = backupMonths(input);
  assert.deepEqual([...new Set(months.map((m) => m.year))], [2025, 2026]);
  const wb = buildBackupWorkbook(input);
  // 多年时 sheet 名带年份（与 parseFullAttendanceWorkbook 的识别口径一致）
  assert.ok(wb.SheetNames.includes("2025年12月考勤"), `缺 2025 年考勤表：${wb.SheetNames.join("、")}`);
  assert.ok(wb.SheetNames.includes("2026年1月考勤"));
  assert.ok(hasCell(wb, "2025年12月考勤", "张三"), "2025 年的考勤行要真的在里面");
});

test("备份工作簿落回 Excel 导入解析：人员/考勤/发放/报销/保险都读得回来", async () => {
  const input = fixture();
  const wb = buildBackupWorkbook(input);
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const { parseFullAttendanceWorkbook } = await import("../src/lib/excel");
  const parsed = parseFullAttendanceWorkbook(buf, 2026);
  assert.equal(parsed.people.length, 2);
  assert.equal(parsed.payments.length, 2);
  assert.equal(parsed.expenses.length, 2);
  assert.equal(parsed.policies.length, 1);
  assert.equal(parsed.members.length, 2);
  assert.deepEqual(
    [...new Set(parsed.attendance.map((a) => a.year))].sort(),
    [2025, 2026],
    "跨年考勤要按 sheet 名里的年份落位",
  );
});

test("备份条数（纯函数）与工作簿内容一致，界面文案含四项关键条数", () => {
  const c = backupCounts(fixture());
  assert.deepEqual(c, {
    people: 2,
    attendance: 3,
    payments: 2,
    expenses: 2,
    contracts: 1,
    contractEntries: 3,
    policies: 1,
    insuranceMembers: 2,
  });
  const text = backupSummaryText(c);
  assert.match(text, /已备份 2 人/);
  assert.match(text, /2 笔发放/);
  assert.match(text, /2 条报销/);
  assert.match(text, /1 份合同/);
});

test("静态守卫：备份必须走 backup-book（nas-sync 不得再自己拼 buildFullWorkbook）", async () => {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const src = await readFile(fileURLToPath(new URL("../src/lib/nas-sync.ts", import.meta.url)), "utf8");
  const fn = src.slice(src.indexOf("export async function pushNasBackup"), src.indexOf("export async function startNasSync"));
  assert.ok(fn.length > 0, "找不到 pushNasBackup");
  assert.match(fn, /buildBackupWorkbook\(input\)/, "备份工作簿必须由 lib/backup-book.ts 组装");
  // 全实体：报销与合同必须传进去（原来就是漏了这两个）
  for (const key of ["expenses", "contracts", "contractEntries", "insurancePolicies", "insuranceMembers"])
    assert.match(fn, new RegExp(`${key}:`), `备份必须传 ${key}`);
  assert.match(fn, /backupSummaryText/, "备份要带回条数给界面显示");
});
