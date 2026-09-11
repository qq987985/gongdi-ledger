import * as XLSX from "xlsx";
import { buildContractWorkbook, buildFullWorkbook, parseAttendanceSheet, parseContractWorkbook, parseExpenseSheet, parseFullAttendanceWorkbook, parsePaymentSheet, parsePeopleSheet, planAttendanceImport } from "../../src/lib/excel";
import { contractRollup } from "../../src/lib/contracts";
import { check, eq, okv } from "./harness";
import { att, buf, contract, entry, expense, handWb, member, payment, person, policy } from "./fixtures";

function aoaOf(wb: XLSX.WorkBook, name: string, headerCell: string): Record<string, string>[] {
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" }) as unknown[][];
  const hi = aoa.findIndex((r) => r.some((c) => String(c).trim() === headerCell));
  const headers = aoa[hi].map((c) => String(c).trim());
  return aoa.slice(hi + 1).map((row) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = String(row[i] ?? "")));
    return o;
  });
}

export function runMore() {
  check("合计行", "「总计」行在考勤/发放/报销/合同里都不能被当成一条真实记录（只认「合计」不够）", () => {
    const bad: string[] = [];
    const attRows = parseAttendanceSheet(buf(handWb("3月考勤", [["姓名", "出勤天数", "加班小时", "补助", "扣款"], ["总计", 46, 20, 200, 0]])), 2026);
    if (attRows.length !== 0) bad.push(`考勤「总计」行被导入成 ${attRows.length} 条考勤（${attRows.map((r) => r.name).join(",")}）`);
    const payRows = parsePaymentSheet(buf(handWb("发放记录", [["实际收款人", "发放日期", "发放金额(元)"], ["张三", "2026-04-28", 10000], ["总计", "总计", 10000]])));
    if (payRows.length !== 1) bad.push(`发放「总计」行被导入成第 ${payRows.length} 条记录（凭空多发 10000 元）`);
    const expRows = parseExpenseSheet(buf(handWb("报销单", [["年份", "项目名称", "金额"], [2026, "办公用品", 300], [2026, "总计", 300]])), 2026);
    if (expRows.length !== 1) bad.push(`报销「总计」行被导入成第 ${expRows.length} 条记录（凭空多报 300 元）`);
    const cs = parseContractWorkbook(buf(handWb("合同管理表", [["年份", "项目号", "项目名称", "合同金额/结算金额"], [2026, "A-1", "示例住宅A区", 1200000], [2026, "总计", "总计", 1200000]]))).contracts;
    if (cs.length !== 1) bad.push(`合同「总计」行被导入成一个合同：${cs.map((c) => c.name).join(",")}`);
    eq(bad, [], "被当成真实记录的「总计」行");
  });

  check("数值格式", "手填带格式的数值（千分位 1,200 / ¥300 / 300元 / 22天 / 1,200,000）在人员/考勤/发放/报销/合同里都不能变成 0", () => {
    const bad: string[] = [];
    const bad1 = parseExpenseSheet(buf(handWb("报销单", [["年份", "项目名称", "金额", "数量", "单价"], [2026, "差旅", "1,200", 1, "1,200"]])), 2026)[0];
    if (bad1.amount !== 1200) bad.push(`报销金额 "1,200"→${bad1.amount}（期望 1200）`);
    const bad2 = parsePaymentSheet(buf(handWb("发放记录", [["实际收款人", "发放日期", "发放金额(元)"], ["张三", "2026-04-28", "10,000"]])))[0];
    if (bad2.amount !== 10000) bad.push(`发放金额 "10,000"→${bad2.amount}（期望 10000）`);
    const bad3 = parseAttendanceSheet(buf(handWb("4月考勤", [["姓名", "出勤天数"], ["张三", "22天"]])), 2026)[0];
    if (bad3.days !== 22) bad.push(`出勤天数 "22天"→${bad3.days}（期望 22）`);
    const bad4 = parseContractWorkbook(buf(handWb("合同管理表", [["年份", "项目号", "项目名称", "合同金额/结算金额"], [2026, "A-1", "示例住宅A区", "1,200,000"]]))).contracts[0];
    if (bad4.contractAmount !== 1200000) bad.push(`合同金额 "1,200,000"→${bad4.contractAmount}（期望 1200000）`);
    const bad5 = parsePeopleSheet(buf(handWb("人员信息", [
      ["姓名", "日工资", "月工资", "餐补/天"],
      ["甲", "1,200", "", ""],
      ["乙", "¥300", "", ""],
      ["丙", "300元", "", ""],
    ])));
    const want = [1200, 300, 300];
    bad5.forEach((r, i) => { if (r.dailyWage !== want[i]) bad.push(`人员 ${r.name} 日工资→${r.dailyWage}（期望 ${want[i]}）`); });
    eq(bad, [], "被静默变成 0 的字段");
  });

  check("合同", "报量按「含税」口径往返后 含税报量/应收/未付 不变", () => {
    const c = contract({ reportTaxMode: "incl", taxRate: 9, payRatio: 80 });
    const es = [
      entry({ contractId: c.id, kind: "report", amount: 196200, date: "2026-03-31" }),
      entry({ contractId: c.id, kind: "receipt", amount: 100000, payTo: "sub", date: "2026-04-20" }),
    ];
    const before = contractRollup(c, es);
    eq([before.reportIncl, before.reportExcl, before.payable, before.dueRemain], [196200, 180000, 156960, 56960], "含税口径");
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [c], entries: es })));
    const after = contractRollup(parsed.contracts[0], parsed.entries);
    eq(after, before, "含税口径往返");
  });

  check("合同", "合同二次往返（导出→导入→再导出→再导入）金额不放大（防复利）", () => {
    const c = contract();
    const es = [
      entry({ contractId: c.id, kind: "report", amount: 180000 }),
      entry({ contractId: c.id, kind: "invoice", amount: 200000, amountExcl: 183486.24, taxRate: 9 }),
      entry({ contractId: c.id, kind: "receipt", amount: 80000, payTo: "worker" }),
      entry({ contractId: c.id, kind: "receipt", amount: 70000, payTo: "sub" }),
    ];
    const p1 = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [c], entries: es })));
    const r1 = contractRollup(p1.contracts[0], p1.entries);
    const p2 = parseContractWorkbook(buf(buildContractWorkbook({ contracts: p1.contracts, entries: p1.entries })));
    const r2 = contractRollup(p2.contracts[0], p2.entries);
    eq(r2, r1, "二次往返口径");
    eq(p2.entries.map((e) => [e.kind, e.amount]).sort(), p1.entries.map((e) => [e.kind, e.amount]).sort(), "二次往返明细");
  });

  check("整本", "整本二次往返（导出→导入→再导出→再导入）人员/考勤/发放/报销 稳定", () => {
    const args = () => ({
      year: 2026, people: [person()],
      attendance: [att({ month: 4 }), att({ month: 5, days: 18 })],
      payments: [payment(), payment({ owner: "李四", amount: 8000 })],
      expenses: [expense()],
      months: [{ year: 2026, month: 4 }, { year: 2026, month: 5 }],
    });
    const p1 = parseFullAttendanceWorkbook(buf(buildFullWorkbook(args())), 2026);
    const p2 = parseFullAttendanceWorkbook(
      buf(buildFullWorkbook({ ...args(), people: p1.people, attendance: p1.attendance, payments: p1.payments, expenses: p1.expenses })),
      2026,
    );
    eq(
      [p2.people.length, p2.attendance.length, p2.payments.length, p2.expenses.length],
      [p1.people.length, p1.attendance.length, p1.payments.length, p1.expenses.length],
      "二次往返条数",
    );
    eq(p2.attendance.map((a) => [a.year, a.month, a.days]).sort(), p1.attendance.map((a) => [a.year, a.month, a.days]).sort(), "二次往返考勤");
    eq(p2.payments.reduce((s, p) => s + p.amount, 0), p1.payments.reduce((s, p) => s + p.amount, 0), "二次往返发放合计");
    eq(p2.expenses.reduce((s, e) => s + e.amount, 0), p1.expenses.reduce((s, e) => s + e.amount, 0), "二次往返报销合计");
  });

  check("考勤", "「导入考勤」增加模式：只有冲突月份该跳过，同一人的其它月份不能跟着丢（走真实 planAttendanceImport）", () => {
    // store 里已有 张三 2026-04；导入的 12 个月考试表里 张三 还有 05 月，李四 有 04 月
    const rows = [
      { year: 2026, month: 4, name: "张三" },
      { year: 2026, month: 5, name: "张三" },
      { year: 2026, month: 4, name: "李四" },
    ];
    const store = [{ year: 2026, month: 4, name: "张三" }];
    const targetMonth = 4;
    const months = [4, 5];
    const plan = planAttendanceImport(rows, store, 2026, targetMonth, months.length > 1);
    const mapped = plan.filter((p) => !p.conflict).map((p) => p.row);
    const after = [...store, ...mapped];
    eq(after.map((a) => `${a.name}-${a.month}`).sort(), ["张三-4", "张三-5", "李四-4"], "导入后的考勤");
  });

  check("合同", "明细 sheet 排在「合同管理表」前面时，明细不能整批丢", () => {
    const c = contract();
    const es = [entry({ contractId: c.id, kind: "report", amount: 180000 })];
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [c], entries: es })));
    const src = buildContractWorkbook({ contracts: [c], entries: es });
    const reordered = XLSX.utils.book_new();
    const order = ["月报量明细", "开票明细", "收款明细", "合同管理表"];
    order.forEach((n) => XLSX.utils.book_append_sheet(reordered, src.Sheets[n] as XLSX.WorkSheet, n));
    const p2 = parseContractWorkbook(buf(reordered));
    eq([p2.contracts.length, p2.entries.length], [parsed.contracts.length, parsed.entries.length], "重排 sheet 后的合同/明细条数");
  });

  check("合同", "明细日期为空时往返后仍是空（不被填成 YYYY-01-01）", () => {
    const c = contract();
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({
      contracts: [c],
      entries: [entry({ contractId: c.id, kind: "receipt", amount: 5000, payTo: "sub", date: "" })],
    })));
    eq(parsed.entries.filter((e) => e.kind === "receipt")[0].date, "", "收款日期");
  });

  check("合同", "未记税率的开票明细往返后不凭空生成不含税金额", () => {
    const c = contract({ taxRate: 9 });
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({
      contracts: [c],
      entries: [entry({ contractId: c.id, kind: "invoice", amount: 200000, amountExcl: 0, taxRate: 0 })],
    })));
    const inv = parsed.entries.filter((e) => e.kind === "invoice")[0];
    eq([inv.taxRate, inv.amountExcl], [0, 0], "开票税率/不含税金额");
  });
}
