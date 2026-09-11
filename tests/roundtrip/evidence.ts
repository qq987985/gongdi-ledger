import * as XLSX from "xlsx";
import { buildFullWorkbook, detectWorkbookYear, SKIP_SHEETS } from "../../src/lib/excel";
import { buf, att, person, contract, entry } from "./fixtures";
import { buildContractWorkbook } from "../../src/lib/excel";

// 1) 单年度整本备份：sheet 名 / 标题 / detectWorkbookYear
const wb = buildFullWorkbook({
  year: 2025, people: [person()],
  attendance: [att({ year: 2025, month: 3, days: 20 })],
  payments: [],
});
console.log("A. 单年度整本 sheet 名:", JSON.stringify(wb.SheetNames));
console.log("A. detectWorkbookYear(wb, 2026) =", detectWorkbookYear(wb, 2026), "（期望 2025）");
console.log("A. 3月考勤 A1 标题 =", JSON.stringify((XLSX.utils.sheet_to_json(wb.Sheets["3月考勤"], { header: 1 }) as any[][])[0]));

// 2) 考勤导出（skipPeople/skipPay/skipExp）里有哪些 sheet 会被「导入考勤」扫到
const attWb = buildFullWorkbook({
  year: 2025, people: [person()], attendance: [att({ year: 2025, month: 3 })], payments: [],
  skipPeople: true, skipPay: true, skipExp: true,
});
console.log("B. 考勤导出 sheet 名:", JSON.stringify(attWb.SheetNames));
console.log("B. 不在 SKIP_SHEETS 里的 sheet:", JSON.stringify(attWb.SheetNames.filter((n) => !SKIP_SHEETS.has(n))));
const work = XLSX.utils.sheet_to_json(attWb.Sheets["工天加班"], { header: 1 }) as any[][];
console.log("B. 工天加班表头:", JSON.stringify(work[1]));
console.log("B. 工天加班数据行数:", work.length - 2);

// 3) 合同导出：合同管理表的合计列名 vs 导入识别的列名
const c = contract();
const cwb = buildContractWorkbook({ contracts: [c], entries: [entry({ contractId: c.id, kind: "report", amount: 180000 })] });
const mgmt = XLSX.utils.sheet_to_json(cwb.Sheets["合同管理表"], { header: 1 }) as any[][];
console.log("C. 合同管理表表头:", JSON.stringify(mgmt[1]));
console.log("C. 合同管理表数据行:", JSON.stringify(mgmt[2]));

// 4) 整本：保险人员导出表头（有没有备注列）
const wb4 = buildFullWorkbook({
  year: 2026, people: [person()], attendance: [], payments: [],
  insurancePolicies: [{ id: "p1", policyNo: "P1", buyer: "", name: "", company: "", premiumPerPerson: 0, headcount: 0, coverage: 0, periodStart: "", periodEnd: "", linkedPolicyId: "", contracts: [], remark: "" }],
  insuranceMembers: [{ id: "m1", policyId: "p1", name: "张三", leader: "", startDate: "", endDate: "", remark: "成员备注" }],
  months: [{ year: 2026, month: 4 }],
});
const mem = XLSX.utils.sheet_to_json(wb4.Sheets["保险人员"], { header: 1 }) as any[][];
console.log("D. 保险人员表头:", JSON.stringify(mem[1]));
console.log("D. 保险人员数据行:", JSON.stringify(mem[2]));
const pol = XLSX.utils.sheet_to_json(wb4.Sheets["保险保单"], { header: 1 }) as any[][];
console.log("D. 保险保单表头:", JSON.stringify(pol[1]));
console.log("D. 人员信息表头:", JSON.stringify((XLSX.utils.sheet_to_json(wb4.Sheets["人员信息"], { header: 1 }) as any[][])[1]));
