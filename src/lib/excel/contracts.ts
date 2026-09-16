import type * as XLSX from "xlsx";
import { uid } from "../utils";
import {
  contractRollup,
  normalizeContractStatus,
  normalizeEntry,
  splitLegacyReceipts,
  splitTax,
  type ContractEntry,
  type ContractRecord,
} from "../contracts";
import {
  isDerivedSheet,
  isTotalRow,
  noteSheet,
  numOr,
  numOut,
  numPick,
  parseNum,
  parseNumber,
  pick,
  readWb,
  sheetFromAoa,
  sheetRecords,
  titledSheet,
  utils,
} from "./common";

/** normalizeEntry 入参别名，避免 4 处重复断言 */
type EntryInput = Parameters<typeof normalizeEntry>[0];

/** 「有无合同」列：缺列/留空时默认有合同（向后兼容），填 无/否/没有 才是无合同 */
function contractHasPaper(raw: string): boolean {
  const t = (raw || "").trim();
  if (!t) return true;
  return !(/^(无|否|没有|没|no|n|0)$/i.test(t) || /无合同|没有合同/.test(t));
}
function yesNo(s: string): boolean {
  const t = (s || "").trim();
  if (!t) return false;
  if (/^(无|否|没有|n|no|0)$/i.test(t)) return false;
  if (/^(有|是|保证金|押金|y|yes|1)$/i.test(t)) return true;
  // 有的表直接在「保证金」列填金额（「1,200」「¥1200」）：能读出正数就算有保证金。
  // 老写法 `Number("1,200") > 0` 是 false，会把有保证金的合同判成没有。
  return (parseNum(t) ?? 0) > 0;
}

function parseTaxMode(s: string): "incl" | "excl" {
  const t = (s || "").replace(/\s/g, "");
  if (/含税/.test(t) && !/不含/.test(t)) return "incl";
  if (/不含/.test(t)) return "excl";
  if (/^incl$/i.test(t)) return "incl";
  return "excl";
}

function parsePct(s: string): number {
  return parseNumber((s || "").replace(/%/g, "").trim());
}
export function parseContractWorkbook(buf: ArrayBuffer | Uint8Array): {
  contracts: ContractRecord[];
  entries: ContractEntry[];
} {
  const wb = readWb(buf);
  const contracts: ContractRecord[] = [];
  const entries: Parameters<typeof splitLegacyReceipts>[0] = [];
  const byKey = new Map<string, ContractRecord>();
  const keyOf = (c: ContractRecord) => `${c.year}|${c.code}|${c.name}`;
  const isEntrySheet = (n: string) => /报量|开票|收款/.test(n) && !n.includes("合同");
  // 导出文件里的派生表：资金对照是公式结果、影像资料只是文件名清单，都按数据表解析会重复生成合同/明细
  const sheets = wb.SheetNames.filter((n) => !n.includes("填写说明") && !isDerivedSheet(n));
  const lookup = (project: string, year: number, code: string) =>
    [...byKey.values()].find((x) => x.name === project && (!year || x.year === year) && (!code || x.code === code)) ||
    contracts.find((x) => x.name === project);

  // 第一趟：先把所有合同收齐 —— 明细 sheet 可能排在「合同管理表」前面，单趟遍历会整批丢明细
  for (const name of sheets) {
    if (isEntrySheet(name)) continue;
    for (const row of sheetRecords(wb.Sheets[name])) {
      if (pick(row, ["流水类型", "类型", "kind"])) continue; // 混排表里带类型的是明细行
      const project = pick(row, ["项目名称"]);
      if (!project || isTotalRow(project)) continue;
      const year = parseNumber(pick(row, ["年份"])) || new Date().getFullYear();
      const code = pick(row, ["项目号"]);
      const depositRaw = pick(row, ["保证金", "是否有保证金", "是否有押金", "押金"]);
      const paperCol = ["有无合同", "合同原件", "有无合同原件"].some((k) => k in row);
      const reasonCol = ["无合同原因", "没有合同原因"].some((k) => k in row);
      const reason = reasonCol ? pick(row, ["无合同原因", "没有合同原因"]) : "";
      const c: ContractRecord = {
        id: uid(),
        year,
        code,
        name: project,
        contractor: pick(row, ["总包"]),
        subcontractor: pick(row, ["分包"]),
        contractAmount: numPick(row, ["合同金额/结算金额", "合同金额", "结算金额"]),
        taxRate: parsePct(pick(row, ["税率"])),
        reportTaxMode: parseTaxMode(pick(row, ["报量含税", "报量计税", "报量按"])),
        payRatio: parsePct(pick(row, ["合同付款比例", "付款比例"])),
        warrantyStart: pick(row, ["质保期开始时间", "质保期开始"]),
        warrantyEnd: pick(row, ["质保期结束时间", "质保期结束"]),
        hasDeposit: yesNo(depositRaw),
        depositAmount: numPick(row, ["保证金金额", "押金金额"]) || (parseNumber(depositRaw) > 1 ? parseNumber(depositRaw) : 0),
        manager: pick(row, ["项目部经营人员", "经营人员", "项目部\n经营人员"]),
        status: normalizeContractStatus(pick(row, ["项目进度", "进度"])),
        prelimAmount: numPick(row, ["初审金额"]),
        settleReceivable: numPick(row, ["结算应收金额"]),
        // 专用列优先；老文件把无合同原因写在备注里，那就保持备注原样
        remark: pick(row, ["备注"]),
        hasPaper: paperCol ? contractHasPaper(pick(row, ["有无合同", "合同原件", "有无合同原件"])) : true,
        noContractReason: reason,
        scanFileName: pick(row, ["合同扫描件", "扫描件", "合同电子版"]),
      };
      if (c.hasDeposit && !c.depositAmount && parseNumber(depositRaw) > 1) c.depositAmount = parseNumber(depositRaw);
      contracts.push(c);
      byKey.set(keyOf(c), c);
    }
  }

  // 第二趟：解析明细 sheet，并从「合同管理表」的合计列补出「导入合计」（仅在明细表缺失时）
  const hasDetail = (kw: string) => wb.SheetNames.some((n) => !n.includes("合同") && n.includes(kw));
  for (const name of sheets) {
    const entrySheet = isEntrySheet(name);
    for (const row of sheetRecords(wb.Sheets[name])) {
      const kindRaw = pick(row, ["流水类型", "类型", "kind"]);
      if (entrySheet || kindRaw) {
        const kindLabel = kindRaw || (name.includes("开票") ? "开票" : name.includes("收款") ? "收款" : "报量");
        const kind = kindLabel.includes("开票") ? "invoice" : kindLabel.includes("收款") ? "receipt" : "report";
        const project = pick(row, ["项目名称", "项目"]);
        if (!project || isTotalRow(project)) continue;
        const year = numOr(pick(row, ["年份"]), 0);
        const c = lookup(project, year, pick(row, ["项目号"]));
        if (!c) continue;
        const taxCol = ["开票税率", "税率"].some((k) => k in row);
        entries.push(
          normalizeEntry({
            contractId: c.id,
            kind,
            date: pick(row, ["日期", "发放日期"]),
            amount: numPick(row, [
              "录入金额", // 明细表（月报量明细/合同管理表导出）用的是这一列；漏了会退到「含税金额」，导出再导入金额被放大
              "金额",
              "含税金额",
              "收款总金额",
              "月报量金额",
              "报量金额",
              "开票金额",
              "收款账金额",
              "收款金额",
            ]),
            amountExcl: numPick(row, ["不含税金额", "开票不含税"]),
            // 列存在就按单元格值用（0 = 未记税率）；只有整列缺失的老文件才回落到合同税率
            taxRate: taxCol ? parsePct(pick(row, ["开票税率", "税率"])) : kind === "invoice" ? c.taxRate : 0,
            workerPay: numPick(row, ["代付农民工", "总包代付农民工", "农民工代付"]),
            payTo: /代付|农民工/.test(pick(row, ["收款去向", "去向"]))
              ? "worker"
              : kind === "receipt"
                ? "sub"
                : "",
            no: pick(row, ["发票号", "期次", "单号", "回单号"]),
            fileName: pick(row, ["影像文件", "文件名"]),
            remark: pick(row, ["备注"]),
          } as EntryInput),
        );
        continue;
      }
      const project = pick(row, ["项目名称"]);
      if (!project || isTotalRow(project)) continue;
      const year = numOr(pick(row, ["年份"]), 0);
      const c = lookup(project, year, pick(row, ["项目号"]));
      if (!c) continue;
      const report = numPick(row, ["月报量金额", "月报量", "报量金额"]);
      const invoice = numPick(row, ["开票金额"]);
      const receipt = numPick(row, ["收款账金额", "收款金额", "已付（代付+到分包）", "已付(代付+到分包)"]);
      // 明细 sheet 已经带了逐笔数据时，不能再从合同管理表的合计列再造一笔，
      // 否则同一份导出文件再导入，开票/报量/收款会翻倍。
      if (report && !hasDetail("报量"))
        entries.push(
          normalizeEntry({
            contractId: c.id, kind: "report", date: `${c.year}-01-31`, amount: report,
            no: "导入合计", remark: "从表合计拆出，可再拆明细",
          } as EntryInput),
        );
      if (invoice && !hasDetail("开票"))
        entries.push(
          normalizeEntry({
            contractId: c.id, kind: "invoice", date: `${c.year}-01-31`, amount: invoice,
            taxRate: c.taxRate, no: "导入合计", remark: "从表合计拆出，可再拆明细",
          } as EntryInput),
        );
      if (receipt && !hasDetail("收款"))
        entries.push(
          normalizeEntry({
            // 合计列是「代付+到分包」的总数，只能还原成一笔，不能再按代付拆开
            contractId: c.id, kind: "receipt", date: `${c.year}-01-31`, amount: receipt, payTo: "sub",
            no: "导入合计", remark: "从表合计拆出，可再拆明细",
          } as EntryInput),
        );
    }
  }
  return { contracts, entries: splitLegacyReceipts(entries) };
}
export function contractTemplateWb(): XLSX.WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(
    wb,
    titledSheet("合同导入模板", [
      [
        "序号", "年份", "项目号", "项目名称", "总包", "分包", "合同金额/结算金额", "税率",
        "报量含税", "报量金额", "合同付款比例", "开票金额", "已付（代付+到分包）",
        "质保期开始时间", "质保期结束时间", "是否有保证金",
        "保证金金额", "项目部经营人员", "项目进度", "初审金额", "结算应收金额", "备注",
      ],
      [
        1, 2026, "DEMO-A-2026", "示例住宅A区", "示例建设集团", "示例劳务公司", 12e5, "9%",
        "不含税", "", "80%", "", "", "", "", "有", 5e4, "王经营", "在建", 0, 0, "示例，导入前请改",
      ],
    ]),
    "合同管理表",
  );
  utils.book_append_sheet(
    wb,
    utils.aoa_to_sheet([
      ["年份", "项目号", "项目名称", "流水类型", "收款去向", "日期", "金额", "不含税金额", "开票税率", "发票号", "期次", "备注"],
      [2026, "DEMO-A-2026", "示例住宅A区", "报量", "", "2026-03-31", 18e4, "", "", "", "2026-03", "3月报量"],
      [2026, "DEMO-A-2026", "示例住宅A区", "开票", "", "2026-04-12", 2e5, 183486.24, 9, "1100000001", "", ""],
      [2026, "DEMO-A-2026", "示例住宅A区", "收款", "总包代付农民工", "2026-04-15", 8e4, "", "", "", "", ""],
      [2026, "DEMO-A-2026", "示例住宅A区", "收款", "到分包公司", "2026-04-28", 7e4, "", "", "", "", ""],
    ]),
    "报量开票收款",
  );
  utils.book_append_sheet(
    wb,
    noteSheet([
      "填写说明（此表不会导入）",
      "合同管理是独立模块。月报量、开票、收款请在第二张表按笔填写。",
      "如果只填第一张表里的月报量/开票/收款合计，导入时会各生成一笔「导入合计」，之后可再拆明细。",
      "「是否有押金」已改为保证金：填 有/无，金额填在保证金金额。",
      "项目进度只能是：在建 / 完工 / 总版图 / 初审 / 终审 / 分包结算 / 结算完成 / 结算已开票 / 质保期 / 退质保金 / 完成。旧表里的「结算」当作分包结算，「审计」当作终审。",
      "报量含税列填「含税」或「不含税」。每个合同可以不同。开票、收款仍按实际金额。",
      "两条线：① 应收 = 含税报量 × 付款比例；合同未付 = 应收 − 已付。② 剩余款 = 开票金额 − 已付。已付 = 代付农民工 + 到分包公司。",
      "收款请拆成两笔：去向填「到分包公司」或「总包代付农民工」，日期可以不同。",
      "合同扫描件在软件里上传，文件名是「项目名称-合同电子版」，存到 data/photos/合同扫描件。有文件即有合同，没传即无合同；原因写在备注。",
    ]),
    "填写说明",
  );
  return wb;
}
export function buildContractWorkbook(args: {
  contracts: ContractRecord[];
  entries: ContractEntry[];
}): XLSX.WorkBook {
  const { contracts, entries } = args;
  const wb = utils.book_new();
  const aoa: unknown[][] = [
    ["合同管理表"],
    [
      "序号", "年份", "项目号", "项目名称", "总包", "分包", "合同金额/结算金额", "税率", "报量含税",
      "报量金额", "合同付款比例", "应收（含税报量×比例）", "开票金额", "已付（代付+到分包）",
      "代付农民工", "到分包公司", "合同未付（应收−已付）", "剩余款（开票金额−已付）",
      "质保期开始时间", "质保期结束时间", "是否有保证金", "保证金金额", "项目部经营人员",
      "项目进度", "初审金额", "结算应收金额", "有无合同", "合同扫描件", "无合同原因", "备注",
    ],
  ];
  contracts.forEach((c, i) => {
    const r = contractRollup(c, entries);
    aoa.push([
      i + 1, c.year, c.code, c.name, c.contractor, c.subcontractor, c.contractAmount || "",
      c.taxRate ? `${c.taxRate}%` : "", c.reportTaxMode === "incl" ? "含税" : "不含税",
      (c.reportTaxMode === "incl" ? r.reportIncl : r.reportExcl) || "",
      c.payRatio ? `${c.payRatio}%` : "", r.payable || "", r.invoice || "", r.receipt || "",
      r.workerPay || "", r.subPay || "", r.dueRemain || "", r.remain || "", c.warrantyStart,
      c.warrantyEnd, c.hasDeposit ? "有" : "无", c.hasDeposit ? c.depositAmount || "" : "",
      c.manager, c.status, c.prelimAmount || "", c.settleReceivable || "",
      c.hasPaper === false ? "无" : "有", c.scanFileName || "", c.noContractReason || "", c.remark,
    ]);
  });
  utils.book_append_sheet(wb, sheetFromAoa(aoa), "合同管理表");
  const reportRows: unknown[][] = [
    ["年份", "项目号", "项目名称", "日期", "录入金额", "报量按", "税率", "含税金额", "不含税金额", "期次", "影像文件", "备注"],
  ];
  const invoiceRows: unknown[][] = [
    ["年份", "项目号", "项目名称", "日期", "含税金额", "不含税金额", "开票税率", "发票号", "影像文件", "备注"],
  ];
  const receiptRows: unknown[][] = [
    ["年份", "项目号", "项目名称", "日期", "收款去向", "金额", "回单号", "影像文件", "备注"],
  ];
  const filesRows: unknown[][] = [["类型", "年份", "项目号", "项目名称", "日期", "文件名", "说明"]];
  for (const e of entries) {
    const c = contracts.find((x) => x.id === e.contractId);
    if (!c) continue;
    if (e.kind === "report") {
      const tax = splitTax(e.amount, c.taxRate, c.reportTaxMode || "excl");
      reportRows.push([
        c.year, c.code, c.name, e.date, numOut(e.amount),
        c.reportTaxMode === "incl" ? "含税" : "不含税", numOut(c.taxRate), numOut(tax.incl),
        numOut(tax.excl), e.no, e.fileName, e.remark,
      ]);
    } else if (e.kind === "invoice")
      invoiceRows.push([
        c.year, c.code, c.name, e.date, numOut(e.amount), numOut(e.amountExcl),
        numOut(e.taxRate), e.no, e.fileName, e.remark,
      ]);
    else if (e.kind === "receipt")
      receiptRows.push([
        c.year, c.code, c.name, e.date,
        e.payTo === "worker" ? "总包代付农民工" : "到分包公司",
        numOut(e.amount), e.no, e.fileName, e.remark,
      ]);
    if (e.fileName)
      filesRows.push([
        e.kind === "invoice" ? "开票" : e.kind === "receipt" ? "收款" : "报量",
        c.year, c.code, c.name, e.date, e.fileName,
        e.payTo === "worker" ? "代付农民工" : e.remark,
      ]);
  }
  utils.book_append_sheet(wb, titledSheet("月报量明细", reportRows), "月报量明细");
  utils.book_append_sheet(wb, titledSheet("开票明细", invoiceRows), "开票明细");
  utils.book_append_sheet(wb, titledSheet("收款明细", receiptRows), "收款明细");
  const cmp: unknown[][] = [
    [
      "年份", "项目号", "项目名称", "含税报量", "应收（含税报量×比例）", "开票金额",
      "已付（代付+到分包）", "代付农民工", "到分包公司", "合同未付（应收−已付）", "剩余款（开票金额−已付）",
    ],
  ];
  contracts.forEach((c) => {
    const r = contractRollup(c, entries);
    cmp.push([
      c.year, c.code, c.name, r.reportIncl || "", r.payable || "", r.invoice || "",
      r.receipt || "", r.workerPay || "", r.subPay || "", r.dueRemain || "", r.remain || "",
    ]);
  });
  utils.book_append_sheet(wb, titledSheet("资金对照", cmp), "资金对照");
  utils.book_append_sheet(wb, titledSheet("影像资料", filesRows), "影像资料");
  utils.book_append_sheet(
    wb,
    noteSheet([
      "导出说明（此表不会导入）",
      "合同管理表是汇总。明细在：月报量 / 开票 / 收款。资金对照是公式结果。",
      "应收 = 含税报量 × 付款比例。合同未付 = 应收 − 已付。剩余款 = 开票金额 − 已付。",
      "已付 = 代付农民工 + 到分包公司。收款明细里两笔日期可以不同。",
      "影像资料列出已上传文件名，原件在 NAS 的 data/photos（报量单、发票、收款回单、合同扫描件）。",
    ]),
    "填写说明",
  );
  return wb;
}
