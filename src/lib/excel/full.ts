import type * as XLSX from "xlsx";
import { uid } from "../utils";
import { getWageAt, monthPay } from "../wage";
import { hasContent } from "../work";
import { daysBetween, paymentsInYear } from "../dates";
// 姓名比较键的唯一实现（A-1）：导出件的「汇总 / 工天加班」按姓名匹配人员与发放，
// 两侧都要过 nameKey（否则同一个人年度表一行、这张 sheet 又是另一套数字）
import { nameKey, ownerKey } from "../receiver";
import type {
  AttendanceRow,
  Expense,
  InsuranceMember,
  InsurancePolicy,
  Payment,
  Person,
} from "../types";
import type { ContractEntry, ContractRecord } from "../contracts";
import {
  cellStr,
  contractFilesCell,
  detectWorkbookYear,
  isDerivedSheet,
  isTotalRow,
  normalizeDate,
  normalizeEndDate,
  parseContractFiles,
  parseNumber,
  pick,
  readWb,
  sheetFromAoa,
  sheetRecords,
  utils,
  type Row,
} from "./common";
import { attFromRow } from "./attendance";
import { expenseSheetAoa, rowToExpense } from "./expenses";
import { paymentSheetAoa, rowToPayment } from "./payments";
import { peopleSheetAoa, rowToPerson } from "./people";
import { buildContractWorkbook } from "./contracts";

export interface FullBookParse {
  year: number;
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  expenses: Expense[];
  policies: InsurancePolicy[];
  members: InsuranceMember[];
}

export function parseFullAttendanceWorkbook(buf: ArrayBuffer | Uint8Array, fallbackYear: number): FullBookParse {
  const wb = readWb(buf);
  const year = detectWorkbookYear(wb, fallbackYear);
  const peopleName = wb.SheetNames.find((n) => n.includes("人员")) || wb.SheetNames[0];
  const people = sheetRecords(wb.Sheets[peopleName]).map(rowToPerson).filter((x): x is Person => Boolean(x));
  const attendance: AttendanceRow[] = [];
  for (const name of wb.SheetNames) {
    if (isDerivedSheet(name) && !/\d+\s*月/.test(name)) continue;
    const monthMatch = name.match(/(\d+)\s*月/);
    if (!monthMatch) continue;
    const month = Number(monthMatch[1]);
    // sheet 名里带年份（如「2025年3月考勤」）时以它为准，否则跨年度总台账会把所有年份都算成第一年
    const sheetYear = name.match(/(20\d{2})/);
    for (const row of sheetRecords(wb.Sheets[name])) {
      const rec = attFromRow(row, sheetYear ? Number(sheetYear[1]) : year, month);
      if (rec) attendance.push(rec);
    }
  }
  const payName = wb.SheetNames.find((n) => n.includes("发放"));
  const expName = wb.SheetNames.find((n) => n.includes("报销"));
  // 保险 sheet：整本备份/恢复（保单按保单号去重；成员挂回对应保单；组合险按保单号回填）
  const policies: InsurancePolicy[] = [];
  const members: InsuranceMember[] = [];
  const polName = wb.SheetNames.find((n) => n.includes("保险保单"));
  if (polName) {
    const aoa = utils.sheet_to_json(wb.Sheets[polName], { header: 1, defval: "", raw: true }) as unknown[][];
    const hi = aoa.findIndex((r) => r.some((c) => String(c).trim() === "保单号"));
    if (hi >= 0) {
      const headers = aoa[hi].map((c) => String(c).trim());
      const rows: Row[] = [];
      for (const row of aoa.slice(hi + 1)) {
        const o: Row = {};
        headers.forEach((h, i) => {
          if (h) o[h] = cellStr(row[i], h);
        });
        if (Object.values(o).some((v) => v)) rows.push(o);
      }
      const byNo = new Map<string, string>();
      for (const row of rows) {
        const no = pick(row, ["保单号"]);
        if (!no) continue;
        const id = uid();
        byNo.set(no, id);
        policies.push({
          id,
          policyNo: no,
          name: pick(row, ["名称"]),
          buyer: pick(row, ["购买公司"]),
          company: pick(row, ["保险公司"]),
          premiumPerPerson: parseNumber(pick(row, ["每人保费"])),
          headcount: parseNumber(pick(row, ["人数"])),
          coverage: parseNumber(pick(row, ["保额/人"])),
          periodStart: normalizeDate(pick(row, ["保险期开始"])),
          periodEnd: normalizeDate(pick(row, ["保险期结束"])),
          linkedPolicyId: "",
          contracts: parseContractFiles(pick(row, ["合同文件", "保险合同", "保单文件"])),
          remark: pick(row, ["备注"]),
        });
      }
      // 组合险：按「组合保单号」互挂
      for (const row of rows) {
        const p = policies.find((x) => x.policyNo === pick(row, ["保单号"]));
        const linked = byNo.get(pick(row, ["组合保单号"]));
        if (p && linked) p.linkedPolicyId = linked;
      }
      const memName = wb.SheetNames.find((n) => n.includes("保险人员"));
      if (memName) {
        for (const row of sheetRecords(wb.Sheets[memName])) {
          const name = pick(row, ["姓名"]);
          if (!name || isTotalRow(name)) continue;
          members.push({
            id: uid(),
            policyId: byNo.get(pick(row, ["保单号"])) || "",
            name,
            leader: pick(row, ["队长", "组长"]),
            startDate: normalizeDate(pick(row, ["开始日期"])),
            endDate: normalizeEndDate(pick(row, ["结束日期"])),
            remark: pick(row, ["备注"]),
          });
        }
      }
    }
  }
  return {
    year,
    people,
    attendance,
    payments: payName
      ? sheetRecords(wb.Sheets[payName]).map(rowToPayment).filter((x): x is Payment => x !== null)
      : [],
    expenses: expName
      ? sheetRecords(wb.Sheets[expName]).map((row) => rowToExpense(row, year)).filter((x): x is Expense => x !== null)
      : [],
    policies,
    members,
  };
}
export interface FullWorkbookArgs {
  year: number;
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  expenses?: Expense[];
  insurancePolicies?: InsurancePolicy[];
  insuranceMembers?: InsuranceMember[];
  // 合同（合同管理表 + 报量/开票/收款/资金对照/影像明细）——F2：备份必须含合同，
  // 复用 buildContractWorkbook，不在备份里另写一份拼表逻辑
  contracts?: ContractRecord[];
  contractEntries?: ContractEntry[];
  months?: { year: number; month: number }[];
  skipPeople?: boolean;
  skipPay?: boolean;
  skipExp?: boolean;
}


function dpart(dt: string): string {
  return (dt || "").slice(0, 10);
}

/**
 * 整本导出用：有没有内容走 work.ts 的 hasContent 唯一实现
 * （有工天/加班/补助/扣款，或只有备注如「工伤休息」也算），否则这一行导出即丢。
 * 工资计算继续用 hasWork。1.8.2 起月度卡/年度汇总/工资条也改用 hasContent，
 * 不再各留一份「备注算不算」的判断。
 */
function hasAttContent(a: AttendanceRow): boolean {
  return hasContent(a);
}
export function buildFullWorkbook(args: FullWorkbookArgs): XLSX.WorkBook {
  const { year, people, attendance, payments, expenses = [], insurancePolicies = [], insuranceMembers = [], contracts = [], contractEntries = [], months: monthArg, skipPeople = false, skipPay = false, skipExp = false } = args;
  const wb = utils.book_new();
  const monthList =
    Array.isArray(monthArg) && monthArg.length
      ? monthArg
      : Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));
  const yearSet = [...new Set(monthList.map((x) => x.year))].sort((a, b) => a - b);
  const singleYear = yearSet.length <= 1;
  if (!skipPeople) utils.book_append_sheet(wb, sheetFromAoa(peopleSheetAoa(people)), "人员信息");
  for (const { year: y, month: m } of monthList) {
    const monthRows = attendance.filter(
      (a) => a.year === y && a.month === m && a.name.trim() && hasAttContent(a),
    );
    const aoa: unknown[][] = [
      [`${y}年${m}月考勤`],
      ["序号", "姓名", "班组", "出勤天数", "加班小时", "补助", "扣款", "餐补", "计薪", "工资", "加班费", "应发工资", "加班规则", "备注"],
    ];
    monthRows.forEach((a, i) => {
      const p = people.find((x) => nameKey(x.name) === nameKey(a.name));
      const wage = getWageAt(p, y, m);
      const calc = monthPay(a, wage);
      aoa.push([
        i + 1, a.name, a.team || p?.team || "", calc.days || "", calc.otHours || "",
        calc.allowance || "", calc.deduction || "", calc.meal || "", wage.payType === "month" ? "按月" : "按工天",
        wage.payType === "month" ? wage.monthWage || "" : wage.dailyWage || "", calc.ot || "",
        calc.pay || "", wage.otRule || "", a.remark || "",
      ]);
    });
    const sheetName = singleYear ? `${m}月考勤` : `${y}年${m}月考勤`;
    utils.book_append_sheet(wb, sheetFromAoa(aoa), sheetName);
  }
  if (!skipPay) utils.book_append_sheet(wb, sheetFromAoa(paymentSheetAoa(payments)), "发放记录");
  if (!skipExp) utils.book_append_sheet(wb, sheetFromAoa(expenseSheetAoa(expenses)), "报销单");
  if (insurancePolicies.length) {
    const paoa: unknown[][] = [
      ["保险保单"],
      ["保单号", "名称", "购买公司", "保险公司", "每人保费", "人数", "保额/人", "保险期开始", "保险期结束", "保险期天数", "总保费", "组合保单号", "合同文件", "备注"],
    ];
    for (const p of insurancePolicies) {
      const linked = insurancePolicies.find((x) => x.id === p.linkedPolicyId);
      paoa.push([
        p.policyNo, p.name, p.buyer, p.company, p.premiumPerPerson || "",
        p.headcount || "", p.coverage || "", dpart(p.periodStart), dpart(p.periodEnd),
        daysBetween(p.periodStart, p.periodEnd) || "", (p.premiumPerPerson || 0) * (p.headcount || 0) || "",
        linked?.policyNo || "", contractFilesCell(p.contracts), p.remark,
      ]);
    }
    utils.book_append_sheet(wb, sheetFromAoa(paoa), "保险保单");
    const iaoa: unknown[][] = [
      ["保险人员"],
      ["保单号", "姓名", "队长", "开始日期", "结束日期", "状态", "备注"],
    ];
    for (const m of insuranceMembers) {
      const pol = insurancePolicies.find((p) => p.id === m.policyId);
      // 日期列只写日期：空 = 在保（状态列写「在保」）；不能把「在保」写进日期列，
      // 否则导入回读成字符串，二次导出状态就变成「已结束」。
      iaoa.push([pol?.policyNo || "", m.name, m.leader, dpart(m.startDate), dpart(m.endDate), m.endDate ? "已结束" : "在保", m.remark || ""]);
    }
    utils.book_append_sheet(wb, sheetFromAoa(iaoa), "保险人员");
  }
  // 合同：整块交给既有导出函数，把它的 sheet 原样并进本工作簿（别处不再拼一份）。
  // 这样备份文件同时是一份合法的**合同导入文件**：出事时把备份丢回「导入 → 合同」也能还原。
  if (contracts.length || contractEntries.length) {
    const cwb = buildContractWorkbook({ contracts, entries: contractEntries });
    for (const name of cwb.SheetNames) utils.book_append_sheet(wb, cwb.Sheets[name], name);
  }
  const earliestYear = yearSet.length ? Math.min(...yearSet) : year;
  for (const y of yearSet) {
    // 无日期的旧发放只归最早一年，避免每年汇总重复出现
    const yearPays = paymentsInYear(payments, y, earliestYear);
    const sumAoa: unknown[][] = [
      [`${y}年度工资汇总表`],
      [
        "序号", "姓名", "班组", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月",
        "9月", "10月", "11月", "12月", "全年合计", "已发放金额", "未发放金额", "发放状态",
      ],
    ];
    // 汇总/工天加班的人列必须与月表同口径（hasAttContent）：只填备注的人
    // 在月表里有这一行，汇总表里也得有他，否则同一个工作簿里两处对不上
    const workers = people.filter((p) =>
      attendance.some((a) => a.year === y && nameKey(a.name) === nameKey(p.name) && hasAttContent(a)),
    );
    workers.forEach((p, i) => {
      const months: (number | string)[] = [];
      for (let m = 1; m <= 12; m++) {
        const a = attendance.find((x) => x.year === y && x.month === m && nameKey(x.name) === nameKey(p.name));
        const wage = getWageAt(p, y, m);
        months.push(monthPay(a, wage).pay);
      }
      const total = months.reduce<number>((s, n) => s + (n as number), 0);
      const paid = yearPays.filter((x) => ownerKey(x) === nameKey(p.name) && x.date).reduce((s, x) => s + x.amount, 0);
      const unpaid = total - paid;
      const status = total === 0 ? "未计" : unpaid <= 0 ? "已结清" : paid > 0 ? "部分发放" : "未发放";
      sumAoa.push([
        i + 1, p.name, p.team, ...months.map((n) => n || ""), total || "", paid || "",
        unpaid || "", status,
      ]);
    });
    utils.book_append_sheet(wb, sheetFromAoa(sumAoa), singleYear ? "汇总" : `${y}年汇总`);
    const workAoa: unknown[][] = [
      [`${y}年度工天加班汇总表`],
      [
        "序号", "姓名", "班组", "1月工天", "1月加班", "2月工天", "2月加班", "3月工天", "3月加班",
        "4月工天", "4月加班", "5月工天", "5月加班", "6月工天", "6月加班", "7月工天", "7月加班",
        "8月工天", "8月加班", "9月工天", "9月加班", "10月工天", "10月加班", "11月工天", "11月加班",
        "12月工天", "12月加班", "全年工天", "全年加班",
      ],
    ];
    workers.forEach((p, i) => {
      const cells: (number | string)[] = [];
      let daysSum = 0;
      let otSum = 0;
      for (let m = 1; m <= 12; m++) {
        const a = attendance.find((x) => x.year === y && x.month === m && nameKey(x.name) === nameKey(p.name));
        const d = a?.days || 0;
        const o = a?.otHours || 0;
        daysSum += d;
        otSum += o;
        cells.push(d || "", o || "");
      }
      workAoa.push([i + 1, p.name, p.team, ...cells, daysSum || "", otSum || ""]);
    });
    utils.book_append_sheet(wb, sheetFromAoa(workAoa), singleYear ? "工天加班" : `${y}年工天加班`);
  }
  return wb;
}
