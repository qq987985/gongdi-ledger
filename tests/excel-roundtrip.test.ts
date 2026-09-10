/**
 * Excel 往返测试：导出 → 再导入，断言字段不丢、金额不变。
 *
 * 这是本项目最容易悄悄改坏的地方——台账的备份/恢复、模板导入全靠这条链路，
 * 而且历史上已经出过 3 次「导出再导入静默改数」（报量按含税放大、开票翻倍、跨年考勤年份错位）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  buildContractWorkbook,
  buildFullWorkbook,
  buildPeopleWorkbook,
  contractTemplateWb,
  normalizeDate,
  parseContractWorkbook,
  parseFullAttendanceWorkbook,
  parsePeopleSheet,
} from "../src/lib/excel";
import { contractRollup, type ContractEntry, type ContractRecord } from "../src/lib/contracts";
import type { AttendanceRow, Expense, Payment, Person } from "../src/lib/types";

function person(over: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "张三",
    team: "一班",
    personNo: "DEMO001",
    idCard: "",
    gender: "男",
    age: 36,
    birthday: "1990-03-07",
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
    idValidTo: "长期",
    remark: "",
    ...over,
  };
}

function att(over: Partial<AttendanceRow> = {}): AttendanceRow {
  return { id: "a1", year: 2026, month: 4, name: "张三", team: "一班", days: 22, otHours: 0, allowance: 0, deduction: 0, remark: "", ...over };
}

function payment(over: Partial<Payment> = {}): Payment {
  return { id: "pay1", owner: "张三", receiver: "张三", date: "2026-04-28", amount: 10000, source: "示例工程4月请款", remark: "", ...over };
}

function expense(over: Partial<Expense> = {}): Expense {
  return {
    id: "x1",
    name: "办公用品",
    qty: 1,
    price: 500,
    amount: 500,
    status: "未报销",
    payMethod: "现金",
    voucherId: "",
    voucherFileName: "",
    claimant: "李四",
    forWhom: "李四",
    payBank: "",
    payCardNo: "",
    payAccount: "",
    payoutId: "",
    payoutFileName: "",
    payoutDate: "",
    payoutMethod: "",
    reimbursedAt: "",
    ...over,
  };
}

const contract: ContractRecord = {
  id: "c1",
  year: 2026,
  code: "A-1",
  name: "示例住宅A区",
  contractor: "总包",
  subcontractor: "分包",
  contractAmount: 1200000,
  taxRate: 9,
  reportTaxMode: "excl",
  payRatio: 80,
  warrantyStart: "",
  warrantyEnd: "",
  hasDeposit: true,
  depositAmount: 50000,
  manager: "王",
  status: "在建",
  prelimAmount: 0,
  settleReceivable: 0,
  remark: "",
};

function entry(over: Partial<ContractEntry> & { contractId: string; kind: ContractEntry["kind"] }): ContractEntry {
  return {
    id: `e-${over.kind}`,
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

function xlsxBuf(wb: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

test("normalizeDate：导入时解析不了就原样保留", () => {
  assert.equal(normalizeDate("2026-1-5"), "2026-01-05");
  assert.equal(normalizeDate("说不清"), "说不清");
});

test("人员导出 → 导入：姓名/工资/餐补/加班规则/银行信息保留", () => {
  const back = parsePeopleSheet(xlsxBuf(buildPeopleWorkbook([person()])))[0];
  assert.equal(back.name, "张三");
  assert.equal(back.dailyWage, 300);
  assert.equal(back.mealAllowance, 12, "餐补列必须进出都不丢（1.6.15/1.6.18 修过）");
  assert.equal(back.otRule, "按小时:25");
  assert.equal(back.bank, "中国工商银行北京分行");
  assert.equal(back.cardNo, "6222021234567890123");
});

test(
  "人员导出 → 导入：调薪历史(wageHistory)目前会丢",
  { todo: "已知问题：peopleSheetAoa 没有工资历史列，覆盖导入会静默清空调薪历史" },
  () => {
    const p = person({
      wageHistory: [{ id: "w1", fromDate: "2025-01-01", payType: "day", dailyWage: 260, monthWage: 0, otRule: "", mealAllowance: 10, remark: "" }],
    });
    assert.equal(parsePeopleSheet(xlsxBuf(buildPeopleWorkbook([p])))[0].wageHistory?.length, 1);
  },
);

test("合同导出 → 导入：报量金额不被按含税放大", () => {
  const entries = [entry({ contractId: "c1", kind: "report", amount: 180000, no: "2026-03", fileName: "报量单.pdf" })];
  const parsed = parseContractWorkbook(xlsxBuf(buildContractWorkbook({ contracts: [contract], entries })));
  const reports = parsed.entries.filter((e) => e.kind === "report");
  assert.equal(reports.length, 1, "报量明细不应重复生成");
  assert.equal(reports[0].amount, 180000, "录入金额必须原样回来，不能被换成含税金额");
  assert.equal(reports[0].fileName, "报量单.pdf", "影像文件名不能丢");
});

test("合同导出 → 导入：开票金额不翻倍、单号保留", () => {
  const entries = [
    entry({ contractId: "c1", kind: "invoice", amount: 200000, amountExcl: 183486.24, taxRate: 9, no: "1100000001", fileName: "发票.pdf", date: "2026-04-12" }),
    entry({ contractId: "c1", kind: "receipt", amount: 80000, payTo: "worker", no: "HD-001", fileName: "回单.pdf", date: "2026-04-15" }),
  ];
  const parsed = parseContractWorkbook(xlsxBuf(buildContractWorkbook({ contracts: [contract], entries })));
  const invoices = parsed.entries.filter((e) => e.kind === "invoice");
  assert.equal(invoices.length, 1, "明细表已在时，不应再从合同管理表合计列造一笔「导入合计」");
  assert.equal(invoices[0].amount, 200000);
  assert.equal(invoices[0].no, "1100000001");
  const receipts = parsed.entries.filter((e) => e.kind === "receipt");
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].no, "HD-001", "收款「回单号」列必须解析");
  assert.equal(receipts[0].fileName, "回单.pdf");
});

test("合同导出 → 导入：合同与明细条数都不重复（导出派生表不再被当数据）", () => {
  const entries = [
    entry({ contractId: "c1", kind: "report", amount: 180000 }),
    entry({ contractId: "c1", kind: "invoice", amount: 200000, taxRate: 9 }),
    entry({ contractId: "c1", kind: "receipt", amount: 80000, payTo: "worker" }),
  ];
  const parsed = parseContractWorkbook(xlsxBuf(buildContractWorkbook({ contracts: [contract], entries })));
  assert.equal(parsed.contracts.length, 1, "「资金对照」派生表会重复生成合同");
  assert.equal(parsed.entries.length, 3, "「影像资料」派生表会重复生成 0 元明细");
});

test("合同导出 → 导入 → 汇总金额不变（防复利式放大）", () => {
  const entries = [entry({ contractId: "c1", kind: "report", amount: 180000 })];
  const parsed = parseContractWorkbook(xlsxBuf(buildContractWorkbook({ contracts: [contract], entries })));
  const before = contractRollup(contract, entries);
  const after = contractRollup({ ...contract, id: parsed.contracts[0].id }, parsed.entries);
  assert.equal(after.report, before.report);
  assert.equal(after.reportIncl, before.reportIncl, "含税报量口径必须一致");
  assert.equal(after.payable, before.payable);
});

test("合同导入模板仍可导入（模板路径不能被跳过逻辑误伤）", () => {
  const parsed = parseContractWorkbook(xlsxBuf(contractTemplateWb()));
  assert.equal(parsed.contracts.length, 1);
  assert.equal(parsed.entries.length, 4, "模板自带 1 报量 + 1 开票 + 2 收款");
});

test("整本导出 → 整本导入：跨年度考勤按各自年份入库", () => {
  const attendance = [att({ id: "a1", year: 2025, month: 3, days: 20 }), att({ id: "a2", year: 2026, month: 4, days: 22 })];
  const wb = buildFullWorkbook({
    year: 2026,
    people: [person()],
    attendance,
    payments: [],
    months: [
      { year: 2025, month: 3 },
      { year: 2026, month: 4 },
    ],
  });
  const parsed = parseFullAttendanceWorkbook(xlsxBuf(wb), 2026);
  const got = parsed.attendance.map((a) => `${a.year}-${a.month}/${a.days}`).sort();
  assert.deepEqual(got, ["2025-3/20", "2026-4/22"], "sheet 名里的年份必须覆盖工作簿级年份");
});

test("整本导出 → 整本导入：人员/发放/报销都能回来", () => {
  const wb = buildFullWorkbook({
    year: 2026,
    people: [person()],
    attendance: [att()],
    payments: [payment(), payment({ id: "pay2", owner: "李四", receiver: "张三", amount: 8000, date: "" })],
    expenses: [expense(), expense({ id: "x2", name: "差旅", amount: 1200 })],
  });
  const parsed = parseFullAttendanceWorkbook(xlsxBuf(wb), 2026);
  assert.equal(parsed.people.length, 1);
  assert.equal(parsed.people[0].name, "张三");
  assert.equal(parsed.people[0].mealAllowance, 12);
  assert.equal(parsed.attendance.length, 1);
  assert.equal(parsed.payments.length, 2, "「立即备份 Excel」依赖这条链路");
  assert.equal(parsed.payments[0].amount, 10000);
  assert.equal(parsed.expenses.length, 2);
  assert.equal(parsed.expenses.reduce((s, e) => s + e.amount, 0), 1700);
});
