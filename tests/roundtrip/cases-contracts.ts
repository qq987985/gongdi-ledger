import * as XLSX from "xlsx";
import { buildContractWorkbook, contractTemplateWb, parseContractWorkbook } from "../../src/lib/excel";
import { contractRollup } from "../../src/lib/contracts";
import { check, eq, okv } from "./harness";
import { buf, contract, entry } from "./fixtures";

function aoaOf(wb: XLSX.WorkBook, name: string, headerCell: string): Record<string, string> {
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" }) as unknown[][];
  const hi = aoa.findIndex((r) => r.some((c) => String(c).trim() === headerCell));
  const headers = aoa[hi].map((c) => String(c).trim());
  const row = aoa[hi + 1];
  const o: Record<string, string> = {};
  headers.forEach((h, i) => (o[h] = String(row[i] ?? "")));
  return o;
}

function baseEntries(cid: string) {
  return [
    entry({ contractId: cid, kind: "report", date: "2026-03-31", amount: 180000, no: "2026-03", fileName: "报量单.pdf", remark: "3月报量" }),
    entry({ contractId: cid, kind: "invoice", date: "2026-04-12", amount: 200000, amountExcl: 183486.24, taxRate: 9, no: "1100000001", fileName: "发票.pdf" }),
    entry({ contractId: cid, kind: "receipt", date: "2026-04-15", amount: 80000, payTo: "worker", no: "HD-001", fileName: "回单.pdf" }),
    entry({ contractId: cid, kind: "receipt", date: "2026-04-28", amount: 70000, payTo: "sub", no: "HD-002", fileName: "回单2.pdf" }),
  ];
}

/** 造一份「合同 + 明细」并导出成 xlsx */
function wbOf() {
  const c = contract();
  const es = baseEntries(c.id);
  return { c, es, wb: buildContractWorkbook({ contracts: [c], entries: es }) };
}

export function runContracts() {
  check("合同", "合同字段逐项往返（项目号/名称/总包/分包/金额/税率/报量含税/付款比例/质保/保证金/经营人/进度/初审/结算应收/备注）", () => {
    const c = contract();
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [c], entries: [] })));
    const back = parsed.contracts[0];
    eq(
      {
        year: back.year, code: back.code, name: back.name, contractor: back.contractor, subcontractor: back.subcontractor,
        contractAmount: back.contractAmount, taxRate: back.taxRate, reportTaxMode: back.reportTaxMode, payRatio: back.payRatio,
        warrantyStart: back.warrantyStart, warrantyEnd: back.warrantyEnd, hasDeposit: back.hasDeposit,
        depositAmount: back.depositAmount, manager: back.manager, status: back.status,
        prelimAmount: back.prelimAmount, settleReceivable: back.settleReceivable, remark: back.remark,
      },
      {
        year: 2026, code: "A-1", name: "示例住宅A区", contractor: "示例建设集团", subcontractor: "示例劳务公司",
        contractAmount: 1200000, taxRate: 9, reportTaxMode: "excl", payRatio: 80,
        warrantyStart: "2026-06-01", warrantyEnd: "2027-06-01", hasDeposit: true, depositAmount: 50000,
        manager: "王经营", status: "在建", prelimAmount: 0, settleReceivable: 0, remark: "合同备注",
      },
      "合同字段",
    );
  });

  check("合同", "报量明细金额不被换成含税金额（180000 → 仍 180000）", () => {
    const parsed = parseContractWorkbook(buf(wbOf().wb));
    eq(parsed.entries.filter((e) => e.kind === "report").map((e) => e.amount), [180000], "报量金额");
  });

  check("合同", "开票/收款明细不重复，发票号/回单号/影像文件名/备注/代付去向全部保留", () => {
    const parsed = parseContractWorkbook(buf(wbOf().wb));
    const inv = parsed.entries.filter((e) => e.kind === "invoice");
    const rec = parsed.entries.filter((e) => e.kind === "receipt");
    eq([inv.length, rec.length], [1, 2], "明细条数");
    eq([inv[0].amount, inv[0].amountExcl, inv[0].taxRate, inv[0].no, inv[0].fileName, inv[0].date],
      [200000, 183486.24, 9, "1100000001", "发票.pdf", "2026-04-12"], "开票明细");
    eq(rec.map((e) => [e.amount, e.no, e.fileName, e.payTo]),
      [[80000, "HD-001", "回单.pdf", "worker"], [70000, "HD-002", "回单2.pdf", "sub"]], "收款明细");
  });

  check("合同", "合同条数与明细条数都不重复（资金对照/影像资料派生表不参与导入）", () => {
    const parsed = parseContractWorkbook(buf(wbOf().wb));
    eq([parsed.contracts.length, parsed.entries.length], [1, 4], "合同/明细条数");
  });

  check("合同", "页面口径往返不变：应收=含税报量×付款比例、合同未付=应收−已付、剩余款=开票−已付", () => {
    const { c, es, wb } = wbOf();
    const before = contractRollup(c, es);
    eq(
      [before.reportExcl, before.reportIncl, before.payable, before.invoice, before.receipt, before.workerPay, before.subPay, before.dueRemain, before.remain],
      [180000, 196200, 156960, 200000, 150000, 80000, 70000, 6960, 50000],
      "导出前的口径",
    );
    const mgmt = aoaOf(wb, "合同管理表", "项目名称");
    eq([mgmt["报量金额"], mgmt["应收（含税报量×比例）"], mgmt["合同未付（应收−已付）"], mgmt["剩余款（开票金额−已付）"], mgmt["已付（代付+到分包）"]],
      ["180000", "156960", "6960", "50000", "150000"], "导出表口径");
    const cmp = aoaOf(wb, "资金对照", "项目名称");
    eq([cmp["含税报量"], cmp["应收（含税报量×比例）"], cmp["合同未付（应收−已付）"], cmp["剩余款（开票金额−已付）"]],
      ["196200", "156960", "6960", "50000"], "资金对照口径");
    const parsed = parseContractWorkbook(buf(wb));
    const after = contractRollup(parsed.contracts[0], parsed.entries);
    eq(after, before, "往返后的口径");
  });

  check("合同", "只保留「合同管理表」（用户删掉明细 sheet）时，报量/已付合计仍能导入", () => {
    const { wb } = wbOf();
    const only = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(only, wb.Sheets["合同管理表"] as XLSX.WorkSheet, "合同管理表");
    const parsed = parseContractWorkbook(buf(only));
    eq(parsed.entries.map((e) => e.kind).sort(), ["invoice", "receipt", "report"],
      `只从合计列拆出的明细（实际 ${JSON.stringify(parsed.entries.map((e) => [e.kind, e.amount]))}）`);
  });

  check("合同", "合同扫描件 scanFileName + 有无合同 + 无合同原因 往返保留", () => {
    const a = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [contract()], entries: [] }))).contracts[0];
    const c = contract({ name: "无合同项目", code: "B-2", hasPaper: false, noContractReason: "甲方直签", scanFileName: "", remark: "催办中" });
    const b = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [c], entries: [] }))).contracts[0];
    eq([a.scanFileName, b.hasPaper, b.noContractReason], ["示例住宅A区-合同电子版.pdf", false, "甲方直签"], "扫描件/有无合同/无合同原因");
  });

  check("合同", "同年同名、不同项目号的两个合同：明细不串（各自挂到自己的合同）", () => {
    const c1 = contract({ code: "A-1", name: "同名项目" });
    const c2 = contract({ code: "A-2", name: "同名项目" });
    const es = [
      entry({ contractId: c1.id, kind: "report", amount: 100000 }),
      entry({ contractId: c2.id, kind: "report", amount: 200000 }),
    ];
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [c1, c2], entries: es })));
    const byCode = Object.fromEntries(parsed.contracts.map((c) => [c.code, c]));
    eq([contractRollup(byCode["A-1"], parsed.entries).report, contractRollup(byCode["A-2"], parsed.entries).report],
      [100000, 200000], "两个同名合同的报量");
  });

  check("合同", "合同模板仍可导入（1 合同 + 4 条明细）", () => {
    const parsed = parseContractWorkbook(buf(contractTemplateWb()));
    okv(parsed.contracts.length === 1, `合同数 ${parsed.contracts.length}`);
    eq(parsed.entries.length, 4, "模板明细条数");
  });

  check("合同", "空明细的合同往返不凭空造明细", () => {
    const parsed = parseContractWorkbook(buf(buildContractWorkbook({ contracts: [contract()], entries: [] })));
    eq(parsed.entries.length, 0, "明细条数");
  });
}
