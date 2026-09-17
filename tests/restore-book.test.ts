/**
 * 备份「恢复入口」（工作包 C，业务评估 B4）+ 「备份工作簿能不能真的落回全部实体」的核查。
 *
 * 背景：设置页一直**只有备份入口、没有恢复入口**，而 FAQ 第 5 / 10 节把备份当成恢复依据 ——
 * 用户误删、换机时不知道该点哪里。这次的改动有两块，各自钉在这份测试里：
 *
 * ① **恢复入口**（`设置 → 数据 → 从备份恢复`）：必须写明覆盖/合并语义、不在 Excel 口径内的东西
 *    （影像原文件 / 账号 / 操作记录）、恢复前先备份、恢复后核对清单，并给出「去整本导入」的直达路径；
 *    只读账号 / 缺权限时禁用并写明原因（判据 = `lib/readonly.ts` 的 `canSaveToServer`）。
 * ② **核查出的缺口 + 修法**：备份工作簿里含合同 5 张表，但「整本导入」原来**不解析合同** ——
 *    按备份恢复会整块丢合同。修法：整本导入里复用 `parseContractWorkbook` + `mergeContracts`
 *    （不另写解析），同键（年份+项目号+项目名称）跳过。
 *
 * 真文件往返（导出 → 导入 → 再导出）也在这里断言：真实工作簿走一遍，条数与金额不许变。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { backupCounts, buildBackupWorkbook, type BackupBookInput } from "../src/lib/backup-book";
import { buildFullWorkbook, mergeContracts, parseContractWorkbook, parseFullAttendanceWorkbook } from "../src/lib/excel";
import { contractRollup, type ContractEntry, type ContractRecord } from "../src/lib/contracts";
import { setLivePerms } from "../src/lib/perms";
import {
  RESTORE_AFTER_CHECK,
  RESTORE_BEFORE,
  RESTORE_COVERED,
  RESTORE_MERGE_NOTE,
  RESTORE_NOT_COVERED,
  RESTORE_PATH,
  restoreGate,
} from "../src/lib/restore";
import type { AttendanceRow, Expense, InsuranceMember, InsurancePolicy, Payment, Person } from "../src/lib/types";
import { countHits, expectMinHits, expectRegexCatches } from "./min-hits";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const read = (p: string) => readFile(repo(p), "utf8");

/* ───────────── 造一本「什么都有」的台账 ───────────── */

function person(name: string, over: Partial<Person> = {}): Person {
  return {
    id: `p-${name}`,
    name,
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
    // 调薪历史：备份丢了它，过去月份就会按新工资重算（历史上出过）
    wageHistory: [
      { id: "w1", fromDate: "2026-01-01", payType: "day", dailyWage: 320, monthWage: 0, otRule: "", mealAllowance: 0, remark: "" },
    ],
    bank: "中国工商银行北京分行",
    cardNo: "6222021234567890123",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
    ...over,
  };
}

function att(over: Partial<AttendanceRow>): AttendanceRow {
  return {
    id: `a-${over.name}-${over.year}-${over.month}`,
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

function pay(over: Partial<Payment>): Payment {
  return { id: `pay-${over.owner}-${over.date}-${over.amount}`, owner: "张三", receiver: "", date: "2026-06-10", amount: 10000, source: "公司", remark: "", ...over };
}

function expense(over: Partial<Expense>): Expense {
  return {
    id: `x-${over.name}`,
    name: "办公用品",
    year: 2026,
    period: "2026-04",
    unit: "项",
    qty: 1,
    price: 300,
    amount: 300,
    status: "未报销",
    payMethod: "公司转账",
    voucherId: "",
    voucherFileName: "",
    claimant: "张三",
    forWhom: "张三",
    payBank: "",
    payCardNo: "",
    payAccount: "",
    payoutId: "",
    payoutFileName: "",
    payoutDate: "",
    payoutMethod: "",
    reimbursedAt: "",
    date: "2026-04-20",
    remark: "",
    ...over,
  } as Expense;
}

function contract(over: Partial<ContractRecord>): ContractRecord {
  const name = over.name || "示范工程A";
  return {
    // id 由 name 派生（明细用 contractId 挂着合同，id 写错整批明细会在导出时被丢掉）
    id: `c-${name}`,
    year: 2026,
    code: "C1",
    name: "示范工程A",
    contractor: "总包",
    subcontractor: "分包",
    contractAmount: 100000,
    taxRate: 9,
    reportTaxMode: "excl",
    payRatio: 80,
    warrantyStart: "2026-01-01",
    warrantyEnd: "2027-01-01",
    hasDeposit: true,
    depositAmount: 5000,
    manager: "王经营",
    status: "在建",
    prelimAmount: 1000,
    settleReceivable: 2000,
    hasPaper: true,
    scanFileName: "示范工程A-合同电子版.jpg",
    noContractReason: "",
    remark: "合同备注",
    ...over,
  } as ContractRecord;
}

function entry(kind: ContractEntry["kind"], amount: number, over: Partial<ContractEntry> = {}): ContractEntry {
  return {
    id: `e-${kind}-${amount}`,
    contractId: "c-示范工程A",
    kind,
    date: "2026-03-31",
    amount,
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
  } as ContractEntry;
}

const polA: InsurancePolicy = {
  id: "polA",
  policyNo: "P-2026-A",
  name: "团意险",
  buyer: "公司",
  company: "人保",
  premiumPerPerson: 120,
  headcount: 2,
  coverage: 500000,
  periodStart: "2026-03-01",
  periodEnd: "2026-08-31",
  linkedPolicyId: "polB", // 组合险：两张保单互挂，恢复时要认回来
  contracts: [],
  remark: "主险",
};
const polB: InsurancePolicy = { ...polA, id: "polB", policyNo: "P-2026-B", name: "雇主险", linkedPolicyId: "polA", remark: "组合" };
const members: InsuranceMember[] = [
  { id: "m1", policyId: "polA", name: "张三", leader: "李四", startDate: "2026-03-01", endDate: "", remark: "在保" },
  { id: "m2", policyId: "polA", name: "李四", leader: "", startDate: "2026-03-01", endDate: "2026-06-30", remark: "已结束" },
];

function bookInput(): BackupBookInput {
  const c1 = contract({});
  const c2 = contract({ name: "示范工程B", year: 2025, code: "C2", taxRate: 3, reportTaxMode: "incl", hasDeposit: false, depositAmount: 0, remark: "" });
  const entries: ContractEntry[] = [
    entry("report", 180000, { amountExcl: 180000, taxRate: 9, fileName: "报量单.jpg", remark: "第一期" }),
    entry("invoice", 100000, { amountExcl: 91743.12, taxRate: 9, no: "FP001", fileName: "发票.jpg" }),
    entry("receipt", 80000, { no: "HD001", payTo: "sub", fileName: "回单.jpg", remark: "首款" }),
    { ...entry("report", 50000), id: "e-c2-report", contractId: "c-示范工程B" },
  ];
  return {
    year: 2026,
    years: [2025, 2026],
    people: [person("张三"), person("李四", { payType: "month", monthWage: 9000, dailyWage: 0 })],
    attendance: [
      att({ name: "张三", year: 2025, month: 3, days: 20 }), // 跨年：备份必须带上别的年份
      att({ name: "张三", year: 2026, month: 4, days: 22 }),
      att({ name: "李四", year: 2026, month: 4, days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "工伤休息" }), // 只有备注也算一条
    ],
    payments: [
      pay({ owner: "张三", amount: 10000 }),
      pay({ owner: "李四", amount: 8000, date: "", remark: "待发放" }), // 无日期 = 待发放
      pay({ owner: "张三", receiver: "李四", amount: 5000, date: "2026-07-01", remark: "代发" }),
    ],
    expenses: [expense({}), expense({ name: "零元报销", amount: 0, qty: 0, price: 0 })],
    contracts: [c1, c2],
    contractEntries: entries,
    insurancePolicies: [polA, polB],
    insuranceMembers: members,
  };
}

const buf = (wb: XLSX.WorkBook) => XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

/* ───────────── ① 真文件往返：备份 → 整本导入（含合同）→ 再导出 ───────────── */

test("恢复核查：备份工作簿导出→导入→再导出，全部实体条数与金额不变（含合同+明细）", () => {
  const src = bookInput();
  const wb = buf(buildBackupWorkbook(src));
  const p1 = parseFullAttendanceWorkbook(wb, 2026);
  const c1 = parseContractWorkbook(wb);

  // 逐实体条数：与备份回执（backupCounts）同一口径
  const counts = backupCounts(src);
  assert.deepEqual(
    {
      people: p1.people.length,
      attendance: p1.attendance.length,
      payments: p1.payments.length,
      expenses: p1.expenses.length,
      policies: p1.policies.length,
      members: p1.members.length,
    },
    {
      people: counts.people,
      attendance: counts.attendance,
      payments: counts.payments,
      expenses: counts.expenses,
      policies: counts.policies,
      members: counts.insuranceMembers,
    },
    "备份回执上写的条数，必须与恢复时读到的条数一致（回执就是给用户肉眼核对用的）",
  );
  assert.deepEqual(
    [c1.contracts.length, c1.entries.length],
    [counts.contracts, counts.contractEntries],
    "合同与明细条数（回执里的「合同 N 份（含 M 条明细）」）",
  );

  // 金额与关键字段
  assert.deepEqual(
    p1.payments.map((p) => [p.owner, p.receiver, p.date, p.amount]).sort(),
    [
      ["张三", "张三", "2026-06-10", 10000],
      ["张三", "李四", "2026-07-01", 5000],
      ["李四", "李四", "", 8000],
    ].sort(),
    "发放金额/收款人/日期（含无日期的待发放与代发）",
  );
  assert.deepEqual(p1.expenses.map((e) => e.amount), [300, 0], "报销金额（0 元也不许被丢掉）");
  assert.deepEqual(
    p1.attendance.map((a) => [a.year, a.month, a.name, a.days, a.remark]).sort(),
    [
      [2025, 3, "张三", 20, ""],
      [2026, 4, "张三", 22, ""],
      [2026, 4, "李四", 0, "工伤休息"],
    ].sort(),
    "考勤跨年 + 只有备注的行",
  );
  assert.equal((p1.people.find((p) => p.name === "张三")?.wageHistory || []).length, 1, "调薪历史");
  assert.equal(c1.contracts.length, 2, "合同（合同管理表）");
  assert.deepEqual(
    c1.contracts.map((c) => [c.year, c.name, c.contractAmount, c.taxRate, c.reportTaxMode, c.scanFileName]).sort(),
    [
      [2025, "示范工程B", 100000, 3, "incl", "示范工程A-合同电子版.jpg"],
      [2026, "示范工程A", 100000, 9, "excl", "示范工程A-合同电子版.jpg"],
    ].sort(),
    "合同字段（年份/税率/报量口径/扫描件名）",
  );
  assert.deepEqual(
    c1.entries.map((e) => [e.kind, e.amount]).sort(),
    [
      ["report", 180000],
      ["report", 50000],
      ["invoice", 100000],
      ["receipt", 80000],
    ].sort(),
    "合同明细：报量/开票/收款各笔金额",
  );
  const rollA = contractRollup(c1.contracts.find((c) => c.name === "示范工程A")!, c1.entries);
  assert.deepEqual([rollA.report, rollA.invoice, rollA.receipt], [180000, 100000, 80000], "合同合计");
  // 组合险互挂：按保单号认回来（两张保单各指对方）
  const linkedNo = (p: { linkedPolicyId: string }) => p1.policies.find((x) => x.id === p.linkedPolicyId)?.policyNo || "";
  assert.deepEqual(p1.policies.map((p) => [p.policyNo, linkedNo(p)]).sort(), [["P-2026-A", "P-2026-B"], ["P-2026-B", "P-2026-A"]].sort());
  assert.deepEqual(
    p1.members.map((m) => [m.name, m.startDate, m.endDate]).sort(),
    [["张三", "2026-03-01", ""], ["李四", "2026-03-01", "2026-06-30"]].sort(),
    "参保人（在保的人结束日期必须留空，不然二次导出会变成「已结束」）",
  );

  // 再导出一次（用导入结果当数据源），第二次解析必须完全一致 = 往返稳定
  const wb2 = buf(
    buildBackupWorkbook({
      year: p1.year,
      years: [2025, 2026],
      people: p1.people,
      attendance: p1.attendance,
      payments: p1.payments,
      expenses: p1.expenses,
      contracts: c1.contracts,
      contractEntries: c1.entries,
      insurancePolicies: p1.policies,
      insuranceMembers: p1.members,
    }),
  );
  const p2 = parseFullAttendanceWorkbook(wb2, 2026);
  const c2 = parseContractWorkbook(wb2);
  assert.deepEqual(
    [p2.people.length, p2.attendance.length, p2.payments.length, p2.expenses.length, p2.policies.length, p2.members.length, c2.contracts.length, c2.entries.length],
    [p1.people.length, p1.attendance.length, p1.payments.length, p1.expenses.length, p1.policies.length, p1.members.length, c1.contracts.length, c1.entries.length],
    "二次导出→再解析的条数",
  );
  assert.deepEqual(p2.payments.map((p) => p.amount).sort(), p1.payments.map((p) => p.amount).sort(), "二次导出→再解析的发放金额");
  assert.deepEqual(
    c2.entries.map((e) => [e.kind, e.amount]).sort(),
    c1.entries.map((e) => [e.kind, e.amount]).sort(),
    "二次导出→再解析的合同明细金额",
  );
});

test("恢复核查：不含合同的「总台账导出」走整本导入时，合同口径为空（不会凭空造合同）", () => {
  const src = bookInput();
  const wb = buf(
    buildFullWorkbook({
      year: 2026,
      people: src.people,
      attendance: src.attendance,
      payments: src.payments,
      expenses: src.expenses,
      insurancePolicies: src.insurancePolicies,
      insuranceMembers: src.insuranceMembers,
      months: [{ year: 2026, month: 4 }],
    }),
  );
  assert.deepEqual(parseContractWorkbook(wb).contracts, [], "导出页的总台账没有合同 sheet，解析结果必须是空");
  assert.equal(parseFullAttendanceWorkbook(wb, 2026).payments.length, 3, "同一份文件里其他实体照常解析");
});

/* ───────────── ② 整本导入补上的合同合并语义 ───────────── */

test("恢复核查：合同按「年份+项目号+项目名称」去重——同一份备份导两次不翻倍", () => {
  const wb = buf(buildBackupWorkbook(bookInput()));
  const c = parseContractWorkbook(wb);
  const first = mergeContracts([], [], c.contracts, c.entries);
  assert.equal(first.added, 2);
  assert.equal(first.entries.length, c.entries.length, "新合同的明细要一起落");

  const again = mergeContracts(first.contracts, first.entries, c.contracts, c.entries);
  assert.equal(again.added, 0, "第二次导入不该再新增合同");
  assert.equal(again.skipped, c.contracts.length);
  assert.equal(again.contracts.length, first.contracts.length, "合同条数不许翻倍");
  assert.equal(again.entries.length, first.entries.length, "明细条数不许翻倍");
});

test("恢复核查：同键合同整份跳过——现场改过的数据不被旧备份冲掉（恢复是「补齐」不是「覆盖」）", () => {
  const wb = buf(buildBackupWorkbook(bookInput()));
  const c = parseContractWorkbook(wb);
  const base = mergeContracts([], [], c.contracts, c.entries);
  // 现场把 A 的合同金额改大、并删掉一条明细
  const edited = base.contracts.map((x) => (x.name === "示范工程A" ? { ...x, contractAmount: 999999 } : x));
  const editedEntries = base.entries.filter((e) => e.contractId !== edited[0].id);
  const merged = mergeContracts(edited, editedEntries, c.contracts, c.entries);
  assert.equal(merged.contracts.length, edited.length, "两份合同都在，一份都不新增");
  assert.equal(merged.contracts.find((x) => x.name === "示范工程A")!.contractAmount, 999999, "现场改过的金额必须保留");
  assert.equal(
    merged.entries.filter((e) => e.contractId === edited[0].id).length,
    0,
    "被跳过的那份合同，它的明细也不许被旧备份塞回来（用户删过的就是删过了）",
  );
  // 新合同（不同项目号）照常补进来
  const fresh = mergeContracts(merged.contracts, merged.entries, [{ ...c.contracts[0], id: "new", code: "C9" }], []);
  assert.equal(fresh.added, 1);
});

/* ───────────── ③ 恢复入口门禁（只读账号 / 缺权限） ───────────── */

const HR = [
  "people.view",
  "people.edit",
  "attendance.view",
  "attendance.edit",
  "import.use",
  "export.use",
];
const READ_ONLY = ["people.view", "attendance.view", "payments.view", "export.use"];
const CONTRACT_ONLY = ["contracts.view", "contracts.edit", "expenses.view", "export.use"];

test("恢复入口：只读账号 / 缺 import.use 时禁用并给出原因，能落盘的账号才放行", () => {
  setLivePerms(HR);
  assert.equal(restoreGate(HR).ok, true, "考勤发放预设（people.edit + import.use）可以恢复");

  setLivePerms(READ_ONLY);
  const ro = restoreGate(READ_ONLY);
  assert.equal(ro.ok, false);
  assert.match(ro.reason, /只读账号/, "要写明是只读账号");
  assert.match(ro.reason, /改动不会保存/, "要写明改动不会保存");
  assert.match(ro.reason, /导入/, "缺哪一项权限要说清（导入）");

  setLivePerms(CONTRACT_ONLY);
  const co = restoreGate(CONTRACT_ONLY);
  assert.equal(co.ok, false, "有 import.use 但账号改不了整本台账时也不许放行");
  setLivePerms(["*"]);
  assert.equal(restoreGate(["*"]).ok, true, "管理员/创建人（*）可以恢复");
});

/* ───────────── ④ 静态守卫：入口必须在设置页上，且内容/路径/门禁不许回退 ───────────── */

test("恢复入口：设置页必须有入口、写明覆盖语义、指向整本导入、走只读门禁", async () => {
  const settings = await read("src/routes/settings.tsx");
  assert.match(settings, /data-testid="restore-entry"/, "设置页要有恢复入口（稳定标记，供人工/无头核对）");
  assert.match(settings, /从备份恢复/, "入口文案要写「从备份恢复…」");
  // 「数据」卡片里也要有一句指向恢复：只写「备份」不写「恢复」，用户出事还是找不到入口
  const card = settings.slice(settings.indexOf('perm="settings.data"'), settings.indexOf('data-testid="restore-entry"'));
  expectMinHits("「数据」卡片里的段落长度", card.length, 500, "从 Can perm=settings.data 到恢复入口之间是该卡片全部内容");
  assert.match(card, /立即备份 Excel/, "「数据」卡片要有备份按钮（恢复前先备份指的就是它）");
  assert.match(card, /从备份恢复/, "「数据」卡片里要写出恢复去处");
  assert.match(card, /导入整本台账/, "「数据」卡片里的恢复要去向整本导入（复用既有流程）");
  // 覆盖语义（合并口径）必须来自唯一实现，而不是页面里再写一段
  assert.match(settings, /RESTORE_MERGE_NOTE/, "必须渲染覆盖/合并语义（RESTORE_MERGE_NOTE）");
  assert.match(settings, /RESTORE_NOT_COVERED/, "必须写明不在 Excel 口径内的东西（影像/账号/操作记录）");
  assert.match(settings, /RESTORE_BEFORE/, "必须提示恢复前先做一次备份");
  assert.match(settings, /RESTORE_AFTER_CHECK/, "必须给出恢复后的核对清单");
  // 直达路径：复用既有整本导入，不另写一套
  assert.match(settings, /to=\{RESTORE_PATH\}/, "按钮要指向 RESTORE_PATH");
  assert.equal(RESTORE_PATH, "/import", "RESTORE_PATH 必须是导入页");
  const importPage = await read("src/routes/import.tsx");
  assert.match(importPage, /<FullBookImport \/>/, "导入页必须挂着既有整本导入组件（恢复复用它）");
  const comp = await read("src/components/excel-import.tsx");
  assert.match(comp, /blockedImport\(\)/, "整本导入要有只读兜底（唯一实现 lib/readonly.ts 的 blockedImport）");
  // 门禁：与只读账号同一判据
  assert.match(settings, /useCanSave\("import\.use"\)/, "入口的可用性要用 useCanSave（= lib/readonly 的 canSaveToServer）");
  assert.match(settings, /restoreGate\(\)/, "禁用原因要来自 restoreGate（唯一实现）");
  assert.match(settings, /disabled title=\{restoreReason\}/, "禁用时按钮要 disabled 并带原因 title");
  const can = await read("src/components/can.tsx");
  assert.match(can, /canSaveToServer\(perm\)/, "useCanSave 的判据必须是 lib/readonly 的 canSaveToServer");
  const restoreLib = await read("src/lib/restore.ts");
  assert.match(restoreLib, /from "\.\/readonly"/, "restore.ts 的原因文案必须复用 readonly.ts（不许另写一套）");
});

test("恢复入口：文案必须真的把「会恢复什么/不会恢复什么/先备份/恢复后核对」写清", () => {
  const joined = RESTORE_COVERED.join("\n");
  for (const kw of ["人员", "考勤", "发放", "报销", "合同", "保险"])
    assert.match(joined, new RegExp(kw), `「会恢复」里少了 ${kw}`);
  const notCovered = RESTORE_NOT_COVERED.join("\n");
  for (const kw of ["影像", "证件照", "账号", "权限", "操作记录"])
    assert.match(notCovered, new RegExp(kw), `「不会恢复」里少了 ${kw}（用户最容易踩的坑）`);
  assert.equal(RESTORE_BEFORE.some((x) => /立即备份/.test(x)), true, "恢复前必须先备份");
  assert.equal(RESTORE_AFTER_CHECK.length >= 4, true, "恢复后核对清单至少 4 条");
  assert.match(RESTORE_MERGE_NOTE, /跳过/, "合并语义要写明「同键跳过」");
  assert.match(RESTORE_MERGE_NOTE, /追加|保留/, "要写明现有数据保留");
  expectRegexCatches(/覆盖|补齐/, RESTORE_MERGE_NOTE, "合并语义文案（覆盖/补齐）");
});

test("恢复核查：整本导入必须解析合同（否则按备份恢复会整块丢合同）", async () => {
  const comp = await read("src/components/excel-import.tsx");
  const start = comp.indexOf("export function FullBookImport()");
  expectMinHits("整本导入组件在源码里的位置", start >= 0 ? 1 : 0, 1, "excel-import.tsx 里必须有 FullBookImport");
  const end = comp.indexOf("/* ───────────── 保险人员导入", start);
  expectMinHits("整本导入组件的代码边界标记", end > start ? 1 : 0, 1, "组件后面就是「保险人员导入」小节");
  const body = comp.slice(start, end);
  // 每条都拿「坏样本」证明正则本身是好的（命中 0 处也可能是正则坏了 / 代码搬了家）
  const checks: [string, RegExp, string][] = [
    ["调用 parseContractWorkbook 解析备份文件里的合同表", /parseContractWorkbook\(/, "const cparsed = parseContractWorkbook(buf);"],
    ["调用 mergeContracts 做同键去重", /mergeContracts\(/, "const m = mergeContracts(a, b, c, d);"],
    ["把合并结果写回台账（replaceContracts 带明细）", /replaceContracts\(/, "store.replaceContracts(m.contracts, m.entries);"],
    ["早退判据要认合同（只含合同的备份不许被拒）", /!cparsed\.contracts\.length/, "if (!parsed.people.length && !cparsed.contracts.length) return;"],
  ];
  for (const [what, re, sample] of checks) {
    expectMinHits(`整本导入：${what}`, countHits(body, re), 1, "备份恢复会把合同整块丢掉");
    expectRegexCatches(re, sample, `整本导入守卫：${what}`);
  }
  // 合同导入弹窗也走同一个去重键实现，别再各写一份
  assert.match(comp, /const merged = mergeContracts\(keep, keepE, contracts, entries\);/, "合同导入的「增加」合并要走 mergeContracts（去重键唯一实现）");
  const lib = await read("src/lib/excel/contracts.ts");
  assert.match(lib, /export function contractKey\(/, "去重键唯一实现 contractKey 必须在 excel/contracts.ts");
});

test("恢复入口：FAQ 与使用说明书都必须写到「从备份恢复」这一条路", async () => {
  const faq = await read("docs/使用与部署/常见问题解答(FAQ).md");
  assert.match(faq, /从备份恢复/, "FAQ 要有恢复入口（原来只写「备份」）");
  assert.match(faq, /导入整本台账/, "FAQ 要给出直达路径（导入 → 导入整本台账）");
  assert.match(faq, /不在 Excel 口径内/, "FAQ 要写明 Excel 备份恢复不了的东西（影像/账号/操作记录）");
  // 「导出 → 总台账」那份文件里没有合同表（合同是单独导出的），要提醒别拿错文件
  assert.match(faq, /没有合同表/, "FAQ 要写明「导出总台账」那份 Excel 不含合同，别当成完整备份");
  assert.match(faq, /清空全部数据[\s\S]{0,600}从备份恢复/, "「清空数据还能恢复吗」一节要指向这个入口");
  const manual = await read("docs/使用与部署/使用说明书.md");
  assert.match(manual, /从备份恢复/, "使用说明书第 6 节也要有恢复入口");
  assert.match(manual, /影像原文件/, "使用说明书要写明影像不在 Excel 口径内");
  // 说明文档统一以 VERSION.txt 为准（docs-consistency 守卫的前提，别在本轮改动里弄丢）
  assert.match(faq, /VERSION\.txt/);
  assert.match(manual, /VERSION\.txt/);
});
