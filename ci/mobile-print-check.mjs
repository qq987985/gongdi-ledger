/**
 * 移动端布局 + 打印媒体验证（1.8.4 起，**开发用脚本，不参与构建、不引依赖**）。
 *
 * 它做的事：用真实 Chromium 打开**构建产物**（`app/server/index.mjs` 起的服务），
 * ① 在 375×667 / 390×844 两个尺寸下逐个页面量「横向能不能滚、按钮有没有被遮挡、
 *   表格能不能滑、弹窗有没有超出屏幕」；② 在打印媒体（`emulateMedia("print")`）下断言
 *   「屏幕内容全不可见、只剩打印件、`.print-only` 之外没有可见文字」，并截图 + 出 A4 PDF。
 *
 * 为什么不在 `tests/` 里：这套检查要一个正在跑的服务 + 一个真实浏览器，属端到端走查；
 * 而且它**不引任何依赖**（用本机已有的 Chrome 与 playwright-core），
 * 所以刻意不写进 `package.json`，也不会在 CI 里跑。仓库的自动回归在 `pnpm test`
 * （打印分离另有静态守卫：`tests/ui-guards.test.ts`）。
 *
 * 用法（在仓库根目录）：
 *   # 1) 起构建产物（任选临时目录与端口，不要用生产 data）
 *   DATA_DIR=/tmp/gongdi-e2e PORT=4599 node app/server/index.mjs &
 *   # 2) 造一份有内容的台账（12 人 / 108 考勤 / 49 发放 / 2 合同 / 2 保单 / 2 报销）
 *   DATA_DIR=/tmp/gongdi-e2e node ci/mobile-print-check.mjs seed
 *   # 3) 跑检查（截图落在 browser-screenshots/，已在 .gitignore 里）
 *   DATA_DIR=/tmp/gongdi-e2e node ci/mobile-print-check.mjs mobile      # 14 页 × 2 尺寸 + 弹窗
 *   DATA_DIR=/tmp/gongdi-e2e node ci/mobile-print-check.mjs print       # 8 个打印用例（截图 + PDF）
 *   DATA_DIR=/tmp/gongdi-e2e node ci/mobile-print-check.mjs diag /files # 某页为什么横向溢出
 *
 * 环境变量：`PORT`（默认 4599）、`E2E_CHROME`（Chrome 可执行文件）、
 * `PLAYWRIGHT_CORE`（playwright-core 的 index.js；默认找几个常见位置）。
 * 结论与截图清单见 `docs/审查与报告/移动端与打印媒体验证-20260916.md`。
 */
import { existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

import { pdfPageTexts } from "./print-pdf.mjs";

const DATA_DIR = process.env.DATA_DIR;
const PORT = Number(process.env.PORT || 4599);
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME =
  process.env.E2E_CHROME ||
  [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((p) => existsSync(p)) ||
  "google-chrome";
const PW =
  process.env.PLAYWRIGHT_CORE ||
  [
    "/Users/wsir/.dsh/profiles/web/node_modules/playwright-core/index.js",
    join(process.cwd(), "node_modules/playwright-core/index.js"),
  ].find((p) => existsSync(p)) ||
  "playwright-core";

const YEAR = 2026;

function person(i, name, team, dailyWage, extra = {}) {
  return {
    id: `p${i}`,
    name,
    team,
    personNo: String(1000 + i),
    idCard: `11010119900101${String(1000 + i).slice(-4)}`,
    gender: i % 2 === 0 ? "男" : "女",
    age: 30 + (i % 20),
    birthday: "1990-01-01",
    phone: `138${String(i).padStart(8, "0")}`,
    dailyWage,
    monthWage: 0,
    payType: "day",
    otRule: "平时1.5倍/周末2倍",
    mealAllowance: 20,
    wageHistory: [
      {
        id: `w${i}`,
        fromDate: "2025-01-01",
        payType: "day",
        dailyWage: dailyWage - 20,
        monthWage: 0,
        otRule: "平时1.5倍/周末2倍",
        mealAllowance: 20,
        remark: "",
      },
    ],
    bank: "中国建设银行XX支行",
    cardNo: `622700000000${String(i).padStart(4, "0")}`,
    address: "XX省XX市XX区XX路XX号XX小区X栋X单元",
    idIssuer: "XX市公安局XX分局",
    idValidFrom: "2015-01-01",
    idValidTo: "2035-01-01",
    remark: "",
    ...extra,
  };
}

const NAMES = [
  ["张建国", "木工一班"],
  ["李国庆", "木工一班"],
  ["王铁柱", "钢筋二班"],
  ["赵春生", "钢筋二班"],
  ["孙德胜", "混凝土三班"],
  ["周文斌", "混凝土三班"],
  ["吴长发", "架子四班"],
  ["郑海涛", "架子四班"],
  ["冯玉明", "水电五班"],
  ["陈志强", "水电五班"],
  ["褚小龙", ""],
  ["卫红旗", ""],
];
/** 人数：`SEED_PEOPLE=45` 时自动补出「人员13…人员45」这种合成姓名（用来把汇总清单也压到多页） */
const targetPeople = Number(process.env.SEED_PEOPLE || 0) || NAMES.length;
const allNames = [...NAMES];
while (allNames.length < targetPeople) allNames.push([`人员${allNames.length + 1}`, `班组${(allNames.length % 6) + 1}`]);
const people = allNames.slice(0, targetPeople).map(([n, t], i) => person(i + 1, n, t, 300 + (i % 5) * 20));

const attendance = [];
for (const p of people)
  for (let m = 1; m <= 9; m += 1)
    attendance.push({
      id: `a-${p.id}-${m}`,
      year: YEAR,
      month: m,
      name: p.name,
      team: p.team,
      days: 22 + (m % 4),
      otHours: (m % 3) * 8,
      allowance: 440,
      deduction: 0,
      remark: m === 2 ? "春节放假，只出勤几天，其余按事假处理（长备注用来看表格会不会被撑破）" : "",
    });

const payments = [];
let pi = 0;
for (const p of people)
  for (const m of [1, 3, 5, 7]) {
    pi += 1;
    payments.push({
      id: `pay${pi}`,
      owner: p.name,
      receiver: m === 7 && pi % 5 === 0 ? "张建国（代收）" : p.name,
      date: `${YEAR}-${String(m).padStart(2, "0")}-10`,
      amount: 7000 + (pi % 5) * 300,
      source: pi % 3 === 0 ? "五冶" : pi % 3 === 1 ? "一局" : "",
      remark: pi % 7 === 0 ? "含上月补发" : "",
    });
  }
/** `SEED_PAY_COUNT=26`：改成按人轮流铺 26 笔（复现用户「26 条记录打印汇总就分页、第一页还有大片空缺」那条）。
 *  不设这个变量时，发放记录与上面完全一样（12 人 × 4 笔 + 1 条待发放）。 */
const payCount = Number(process.env.SEED_PAY_COUNT || 0);
if (payCount > 0) {
  payments.length = 0;
  const months = [1, 3, 5, 7];
  for (let i = 0; i < payCount; i += 1) {
    const p = people[i % people.length];
    const m = months[Math.floor(i / people.length) % months.length];
    const n = i + 1;
    payments.push({
      id: `pay${n}`,
      owner: p.name,
      receiver: m === 7 && n % 5 === 0 ? "张建国（代收）" : p.name,
      date: `${YEAR}-${String(m).padStart(2, "0")}-${String(10 + (n % 18)).padStart(2, "0")}`,
      amount: 7000 + (n % 5) * 300,
      source: n % 3 === 0 ? "五冶" : n % 3 === 1 ? "一局" : "",
      remark: n % 7 === 0 ? "含上月补发" : "",
    });
  }
}
payments.push({
  id: "pay-wait",
  owner: "张建国",
  receiver: "张建国",
  date: "",
  amount: 1500,
  source: "一局",
  remark: "待发放",
});

const contracts = [
  {
    id: "c1",
    year: YEAR,
    code: "GD-2026-001",
    name: "XX小区二期主体结构劳务分包工程（名称很长很长很长很长很长很长很长很长很长）",
    contractor: "中建某局第一工程有限公司",
    subcontractor: "某某建筑劳务有限公司",
    contractAmount: 1200000,
    taxRate: 9,
    reportTaxMode: "excl",
    payRatio: 80,
    warrantyStart: "2026-01-01",
    warrantyEnd: "2027-01-01",
    hasDeposit: true,
    depositAmount: 36000,
    manager: "张建国",
    status: "在建",
    prelimAmount: 0,
    settleReceivable: 0,
    remark: "",
  },
  {
    id: "c2",
    year: YEAR,
    code: "GD-2026-002",
    name: "XX小区二期装饰装修工程",
    contractor: "五冶集团",
    subcontractor: "某某装饰工程有限公司",
    contractAmount: 860000,
    taxRate: 9,
    reportTaxMode: "incl",
    payRatio: 75,
    warrantyStart: "2026-03-01",
    warrantyEnd: "2027-03-01",
    hasDeposit: false,
    depositAmount: 0,
    manager: "李国庆",
    status: "在建",
    prelimAmount: 0,
    settleReceivable: 0,
    remark: "",
  },
];
const contractEntries = [
  { id: "e1", contractId: "c1", kind: "report", date: "2026-04-10", amount: 320000, amountExcl: 320000, taxRate: 9, workerPay: 120000, workerPayDate: "2026-04-20", payTo: "worker", no: "BL-001", remark: "", fileName: "" },
  { id: "e2", contractId: "c1", kind: "invoice", date: "2026-04-15", amount: 300000, amountExcl: 275229, taxRate: 9, workerPay: 0, workerPayDate: "", payTo: "", no: "FP-001", remark: "", fileName: "" },
  { id: "e3", contractId: "c1", kind: "receipt", date: "2026-05-06", amount: 200000, amountExcl: 200000, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "", no: "HD-001", remark: "", fileName: "" },
  { id: "e4", contractId: "c2", kind: "report", date: "2026-06-10", amount: 150000, amountExcl: 137615, taxRate: 9, workerPay: 60000, workerPayDate: "2026-06-25", payTo: "sub", no: "BL-002", remark: "", fileName: "" },
];

const expenses = [
  { id: "x1", name: "安全帽", year: YEAR, period: "2026-03", unit: "个", qty: 50, price: 35, amount: 1750, status: "已报销", payMethod: "现金", voucherId: "", voucherFileName: "", claimant: "张建国", forWhom: "木工一班", payBank: "", payCardNo: "", payAccount: "", payoutId: "", payoutFileName: "", payoutDate: "2026-03-20", payoutMethod: "现金", reimbursedAt: "2026-03-21", date: "2026-03-01", remark: "" },
  { id: "x2", name: "办公用品（打印纸、墨盒、文件夹等）", year: YEAR, period: "2026-04", unit: "批", qty: 1, price: 860, amount: 860, status: "未报销", payMethod: "", voucherId: "", voucherFileName: "", claimant: "", forWhom: "", payBank: "", payCardNo: "", payAccount: "", payoutId: "", payoutFileName: "", payoutDate: "", payoutMethod: "", reimbursedAt: "", date: "2026-04-02", remark: "" },
];

const insurancePolicies = [
  { id: "ip1", policyNo: "PICC-2026-0001", buyer: "某某建筑劳务有限公司", name: "XX小区二期团体意外险", company: "中国人民保险", premiumPerPerson: 1200, headcount: 5, coverage: 800000, periodStart: "2026-01-01", periodEnd: "2026-12-31", linkedPolicyId: "", contracts: [], remark: "" },
  { id: "ip2", policyNo: "PAIC-2026-0002", buyer: "某某建筑劳务有限公司", name: "补充医疗险", company: "中国平安", premiumPerPerson: 600, headcount: 3, coverage: 200000, periodStart: "2026-03-01", periodEnd: "2026-09-30", linkedPolicyId: "", contracts: [], remark: "" },
];
const insuranceMembers = people.slice(0, 6).map((p, i) => ({
  id: `im${i + 1}`,
  policyId: i < 4 ? "ip1" : "ip2",
  name: p.name,
  leader: i < 2 ? "张建国" : i < 4 ? "王铁柱" : "",
  startDate: "2026-01-01",
  endDate: i === 5 ? "2026-06-30" : "",
  remark: "",
}));

/** 把报销 / 合同明细 / 保险人数也撑到多页（`SEED_EXPENSES=40` 等），用来排查另外 4 个打印入口的分页 */
const extraExpenses = Number(process.env.SEED_EXPENSES || 0);
for (let i = expenses.length; i < extraExpenses; i += 1) {
  expenses.push({
    ...expenses[0],
    id: `x${i + 1}`,
    name: `材料采购-${i + 1}（含税含运费的长名字）`,
    period: `2026-${String((i % 12) + 1).padStart(2, "0")}`,
    status: "未报销",
    payMethod: "",
    reimbursedAt: "",
    amount: 100 + i * 13,
    remark: i % 5 === 0 ? "长备注：含税、含运费、含卸车费，共三行文字，用来看表格会不会被撑破" : "",
  });
}

const extraEntries = Number(process.env.SEED_CONTRACT_ENTRIES || 0);
for (let i = contractEntries.length; i < extraEntries; i += 1) {
  contractEntries.push({
    id: `e${i + 1}`,
    contractId: "c1",
    kind: i % 3 === 0 ? "report" : i % 3 === 1 ? "invoice" : "receipt",
    date: `2026-${String((i % 12) + 1).padStart(2, "0")}-1${i % 10}`,
    amount: 10000 + i * 700,
    amountExcl: 9000 + i * 600,
    taxRate: 9,
    workerPay: 0,
    workerPayDate: "",
    payTo: i % 2 ? "worker" : "sub",
    no: `NO-${i + 1}`,
    remark: i % 6 === 0 ? "长备注：分期结算，按进度付款，附验收单" : "",
    fileName: "",
  });
}

const extraMembers = Number(process.env.SEED_INSURANCE_MEMBERS || 0);
for (let i = insuranceMembers.length; i < extraMembers; i += 1) {
  const p = people[i % people.length];
  insuranceMembers.push({
    id: `im${i + 1}`,
    policyId: i % 4 === 0 ? "ip2" : "ip1",
    name: `${p.name}${i + 1}`,
    leader: i % 3 === 0 ? "张建国" : i % 3 === 1 ? "王铁柱" : "",
    startDate: `2026-${String((i % 12) + 1).padStart(2, "0")}-01`,
    endDate: i % 7 === 0 ? "2026-06-30" : "",
    remark: "",
  });
}

const ledger = {
  schemaVersion: 2,
  year: YEAR,
  years: [2025, YEAR],
  people,
  attendance,
  attendanceDocs: [
    { id: "ad1", year: YEAR, month: 3, fileName: "2026-03考勤表.jpg", remark: "" },
    { id: "ad2", year: YEAR, month: 4, fileName: "2026-04考勤表.jpg", remark: "" },
  ],
  payments,
  contracts,
  contractEntries,
  expenses,
  insurancePolicies,
  insuranceMembers,
  accessHash: "",
  uiStyle: "classic",
};

async function seed() {
  const dir = join(DATA_DIR, "books", "default");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "ledger.json"), JSON.stringify(ledger, null, 2), "utf8");
  console.log(`已写入 ${join(dir, "ledger.json")}：${people.length} 人 / ${attendance.length} 考勤 / ${payments.length} 发放 / ${expenses.length} 报销 / ${contractEntries.length} 合同明细 / ${insuranceMembers.length} 参保人`);
}

async function browser() {
  const mod = await import(PW);
  const chromium = mod.chromium || mod.default?.chromium;
  return chromium.launch({ executablePath: CHROME, headless: true });
}

/** 用 /api/auth login 拿到的 cookie 直接进已登录态（headless 里不用走登录界面） */
async function loggedInContext(b, viewport) {
  const res = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "login", username: "admin", password: "12345678" }),
  });
  const body = await res.json();
  if (!body.token) throw new Error("登录失败：" + JSON.stringify(body));
  const token = body.token;
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addCookies([
    { name: "gongdi_u", value: "admin", domain: "127.0.0.1", path: "/" },
    { name: "gongdi_t", value: token, domain: "127.0.0.1", path: "/" },
    { name: "gongdi_b", value: body.bookId || "default", domain: "127.0.0.1", path: "/" },
  ]);
  return ctx;
}

const ROUTES = [
  ["/", "总览"],
  ["/people", "人员"],
  ["/attendance", "考勤"],
  ["/payments", "发放"],
  ["/contracts", "合同"],
  ["/expenses", "报销"],
  ["/insurance", "保险"],
  ["/photos", "照片"],
  ["/files", "影像资料"],
  ["/query", "个人查询"],
  ["/audit", "操作记录"],
  ["/import", "导入"],
  ["/export", "导出"],
  ["/settings", "设置"],
];

const VIEWPORTS = [
  [375, 667],
  [390, 844],
];

/** 页面里跑：横向溢出 / 点不到的按钮 / 表格能不能滑 / 弹窗是否超出屏幕 */
const PROBE = `(() => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const out = { vw, vh, docScrollW: document.documentElement.scrollWidth, overflow: [], deadButtons: [], tables: [], modals: [] };
  window.scrollTo(9999, 0);
  out.maxScrollX = window.scrollX;
  window.scrollTo(0, 0);
  const scrollable = (el) => {
    let n = el;
    while (n && n !== document.body) {
      const s = getComputedStyle(n);
      if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && n.scrollWidth > n.clientWidth + 1) return n;
      n = n.parentElement;
    }
    return null;
  };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24);
  const desc = (el) => ({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 50), text: (el.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 18) });
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    if (s.position === 'fixed' || s.position === 'sticky') continue;   // 固定元素本来就会伸出滚动容器
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    // 横向溢出：只看「没有可横滑祖先」的元素 —— 表格放在 overflow-x-auto 里是刻意设计
    if (r.right > vw + 1 && !scrollable(el) && !scrollable(el.parentElement || el)) {
      out.overflow.push({ ...desc(el), right: Math.round(r.right) });
    }
    if (el.tagName === 'TABLE') {
      const sc = scrollable(el);
      if (el.scrollWidth > el.clientWidth + 1 && !sc)
        out.tables.push({ cls: String(el.className).slice(0, 40), scrollW: el.scrollWidth, clientW: el.clientWidth });
    }
    // 点不到的按钮：只查**当前视口内**的元素（视口外的不该被 clamp 成「被底栏遮挡」）
    if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.getAttribute('href'))) {
      const r2 = el.getBoundingClientRect();
      if (r2.top < 0 || r2.bottom > vh) continue;
      if (r2.width < 4 || r2.height < 4) { out.deadButtons.push({ ...desc(el), why: '尺寸为 0' }); continue; }
      const hit = document.elementFromPoint(r2.left + r2.width / 2, r2.top + r2.height / 2);
      if (!hit) continue;
      if (!(el === hit || el.contains(hit) || hit.contains(el)))
        out.deadButtons.push({ ...desc(el), why: '被遮挡', by: hit.tagName.toLowerCase() + '.' + String(hit.className).slice(0, 26) });
    }
  }
  for (const el of document.querySelectorAll('[role="dialog"], #contract-editor')) {
    const r = el.getBoundingClientRect();
    out.modals.push({ cls: String(el.className).slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), fitsW: r.width <= vw + 1 });
  }
  const seen = new Set();
  out.overflow = out.overflow.filter((o) => { const k = o.tag + o.cls + o.right; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
  out.deadButtons = out.deadButtons.filter((o, i, a) => a.findIndex((x) => x.text === o.text && x.cls === o.cls) === i).slice(0, 6);
  out.deadButtons = out.deadButtons.slice(0, 6);
  return out;
})()`;

/** 等应用把台账拉下来（首屏有「加载中…」占位），最多 8 秒 */
async function waitReady(page) {
  try {
    await page.waitForFunction("!document.body.innerText.includes('加载中')", null, { timeout: 8000 });
  } catch {
    /* 超时就按现状继续，探测结果会说明问题 */
  }
  await page.waitForTimeout(250);
}

async function mobile() {
  const b = await browser();
  const problems = [];
  const outDir = "browser-screenshots/mobile";
  await mkdir(outDir, { recursive: true });
  const onlyModals = process.argv.includes("--modals");
  for (const [w, h] of VIEWPORTS) {
    if (onlyModals) break;
    const ctx = await loggedInContext(b, { width: w, height: h });
    const page = await ctx.newPage();
    for (const [route, name] of ROUTES) {
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await waitReady(page);
      const file = `${outDir}/${w}x${h}-${name}.png`;
      await page.screenshot({ path: file, fullPage: true });
      const issues = [];
      const check = (probe, where) => {
        if (probe.maxScrollX > 0)
          issues.push(`${where} 页面能真的横向滚动 maxScrollX=${probe.maxScrollX}（docScrollW=${probe.docScrollW} vw=${probe.vw}）`);
        if (probe.overflow.length) issues.push(`${where} 元素超出右边界: ${JSON.stringify(probe.overflow)}`);
        if (probe.deadButtons.length) issues.push(`${where} 按钮被遮挡: ${JSON.stringify(probe.deadButtons)}`);
        if (probe.tables.length) issues.push(`${where} 表格不可滑: ${JSON.stringify(probe.tables)}`);
        for (const m of probe.modals) if (!m.fitsW) issues.push(`${where} 弹窗超出屏幕宽: ${JSON.stringify(m)}`);
      };
      check(await page.evaluate(PROBE), "首屏");
      // 再滚到底看一遍：最后一行会不会被底部 fixed 导航永久压住
      await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
      await page.waitForTimeout(250);
      const bottom = await page.evaluate(PROBE);
      await page.screenshot({ path: file.replace(/\.png$/, "-底部.png"), fullPage: true });
      if (bottom.maxScrollX > 0) issues.push("滚到底 页面能真的横向滚动");
      if (bottom.deadButtons.length) issues.push(`滚到底 按钮被遮挡: ${JSON.stringify(bottom.deadButtons)}`);
      if (bottom.tables.length) issues.push(`滚到底 表格不可滑: ${JSON.stringify(bottom.tables)}`);
      if (issues.length) problems.push({ route: name, size: `${w}x${h}`, issues, shot: file });
      else console.log(`OK  ${w}x${h} ${name}`);
    }
    await ctx.close();
  }

  // 弹窗（新增/编辑）在手机上都放得下吗？
  const MODALS = [
    ["/people", "新增人员"],
    ["/payments", "新增发放"],
    ["/expenses", "新增报销"],
    ["/insurance", "新增保单"],
    ["/contracts", "新增合同"],
  ];
  for (const [w, h] of VIEWPORTS) {
    const ctx = await loggedInContext(b, { width: w, height: h });
    const page = await ctx.newPage();
    for (const [route, label] of MODALS) {
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await waitReady(page);
      const btn = page.getByRole("button", { name: new RegExp(label) }).first();
      if (!(await btn.count())) {
        const texts = await page.evaluate(
          "document.body.innerText.replace(/\\n+/g,' | ').slice(0,200) + ' || BTNS: ' + [...document.querySelectorAll('button,a.btn')].map((b) => (b.textContent||'').trim().slice(0,14)).filter(Boolean).join(' | ') + ' || URL: ' + location.pathname",
        );
        console.log(`跳过 ${w}x${h} ${label}（页面上没有这个按钮）现有按钮：${texts}`);
        continue;
      }
      await btn.click();
      await page.waitForTimeout(500);
      const info = await page.evaluate(`(() => {
        const overlay = document.querySelector('.fixed.inset-0');
        if (!overlay) return { found: false };
        const vw = window.innerWidth, vh = window.innerHeight;
        const scrollableIn = (root) => [...root.querySelectorAll('*')].find((el) => {
          const s = getComputedStyle(el);
          return ['auto','scroll'].includes(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
        });
        // 面板 = 覆盖层里可见的、带边框的卡片（没有就退回第一个子元素）
        const panel = overlay.querySelector('section, [id$="-editor"], .rounded-t-xl, .rounded-xl') || overlay.firstElementChild;
        const pr = panel.getBoundingClientRect();
        const scroller = ['auto','scroll'].includes(getComputedStyle(panel).overflowY) && panel.scrollHeight > panel.clientHeight + 1
          ? panel : scrollableIn(overlay);
        const btns = [...panel.querySelectorAll('button')].map((b) => { const br = b.getBoundingClientRect(); return { t: (b.textContent||'').trim().slice(0,8), visible: br.bottom > 0 && br.top < vh && br.width > 0 }; });
        return {
          found: true,
          panelW: Math.round(pr.width), panelH: Math.round(pr.height), panelTop: Math.round(pr.top),
          vw, vh,
          fitsW: pr.width <= vw + 1,
          panelOverflowsTop: pr.top < -1,
          canScroll: !!scroller,
          scrollerCls: scroller ? String(scroller.className).slice(0, 40) : null,
          hiddenButtons: btns.filter((b) => !b.visible).map((b) => b.t),
        };
      })()`);
      const shot = `${outDir}/${w}x${h}-弹窗-${label}.png`;
      await page.screenshot({ path: shot });
      if (!info.found) problems.push({ route: `${label} 弹窗`, size: `${w}x${h}`, issues: ["点开后找不到弹窗节点"], shot: null });
      else {
        const iss = [];
        if (!info.fitsW) iss.push(`弹窗宽度超出屏幕 ${info.panelW} > ${info.vw}`);
        // 面板高于屏幕时，只要内部能滚就够用（手机弹窗常见做法）；滚不了才是真缺陷
        if (info.panelOverflowsTop && !info.canScroll) iss.push(`弹窗顶部超出屏幕 top=${info.panelTop} 且不能内部滚动`);
        if (info.hiddenButtons.length && !info.canScroll) iss.push(`这些按钮既不在视口内、弹窗也不能滚动: ${info.hiddenButtons.join("/")}`);
        if (iss.length) problems.push({ route: `${label} 弹窗`, size: `${w}x${h}`, issues: iss, shot });
        else
          console.log(
            `OK  ${w}x${h} ${label} 弹窗 ${info.panelW}x${info.panelH}${info.canScroll ? "（内容可内部滚动，底部按钮滚一下就能点到）" : "（内容一屏放得下）"}`,
          );
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
    await ctx.close();
  }

  await b.close();
  console.log("\n=== 移动端问题清单 ===");
  console.log(JSON.stringify(problems, null, 1));
}

/**
 * 打印媒体验证：emulateMedia('print') 之后
 * ① 屏幕内容（导航/筛选/统计/明细表/分页）必须不可见；② 只剩清单（标题+口径小字+表格+合计）。
 * window.print 被 stub 掉（只记录被调用），这样不会弹打印对话框、也不影响 DOM 断言。
 *
 * 判据用的是「可见文本是否落在 .print-only 子树之外」（leakedText）——
 * 比词表可靠：清单自己的口径小字里出现「待发放」「全部发放方」是**应该的**，
 * 而任何不在 .print-only 里的可见文字（导航项、按钮、屏幕表格）都是漏印。
 */
const PRINT_PROBE = `(() => {
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    return el.getClientRects().length > 0;
  };
  const sheet = document.querySelector('.print-only');
  const leaked = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = (n.textContent || '').trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || !visible(el)) continue;
    if (el.closest('.print-only')) continue;               // 清单内部：正常
    if (el.closest('script, style, noscript')) continue;
    leaked.push(t.slice(0, 40));
    if (leaked.length >= 12) break;
  }
  return {
    printCalled: window.__printCalled === true,
    bodyText: (document.body.innerText || '').trim(),
    noPrintVisible: [...document.querySelectorAll('.no-print')].filter(visible).length,
    navVisible: [...document.querySelectorAll('aside, nav, header')].filter(visible).length,
    visibleButtons: [...document.querySelectorAll('button')].filter(visible).map((b) => (b.textContent || '').trim().slice(0, 10)),
    visibleTables: [...document.querySelectorAll('table')].filter(visible).length,
    sheetVisible: sheet ? visible(sheet) : false,
    sheetText: sheet ? (sheet.innerText || '').trim().slice(0, 300) : null,
    leakedText: leaked,
  };
})()`;

async function printCase(b, outDir, results, kase) {
  const ctx = await loggedInContext(b, { width: 1280, height: 900 });
  const page = await ctx.newPage();
  await page.addInitScript("window.__printCalled = false; window.print = function () { window.__printCalled = true; };");
  const record = { name: kase.name, route: kase.route };
  try {
    await page.goto(BASE + kase.route, { waitUntil: "networkidle" });
    await waitReady(page);
    if (kase.setup) await kase.setup(page);

    // 屏幕态：打印件必须不可见（与 query 页范本一致）
    record.screen = await page.evaluate(`(() => { const s = document.querySelector('.print-only'); const st = s ? getComputedStyle(s) : null; return { printOnlyDisplay: st ? st.display : null, visible: s ? s.getClientRects().length > 0 : null }; })()`);
    record.owner = kase.picked || "";

    await page.getByRole("button", { name: new RegExp(kase.button) }).first().click();
    await page.waitForTimeout(600);
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(300);
    const probe = await page.evaluate(PRINT_PROBE);
    const shotFull = `${outDir}/${kase.file}.png`;
    await page.screenshot({ path: shotFull, fullPage: true });
    try {
      const pdf = await page.pdf({ format: "A4", path: `${outDir}/${kase.file}.pdf` });
      record.pdfBytes = pdf.length;
    } catch (e) {
      record.pdfError = String(e).slice(0, 120);
    }
    await page.emulateMedia({ media: "screen" });
    record.printCalled = probe.printCalled;
    record.noPrintVisibleInPrint = probe.noPrintVisible;
    record.navVisibleInPrint = probe.navVisible;
    record.visibleTablesInPrint = probe.visibleTables;
    record.sheetVisibleInPrint = probe.sheetVisible;
    record.sheetHead = (probe.sheetText || "").slice(0, 120).replace(/\n+/g, " | ");
    record.leakedText = probe.leakedText;
    record.printTextLen = probe.bodyText.length;
    record.shot = shotFull;
    record.ok =
      probe.printCalled === true &&
      probe.noPrintVisible === 0 &&
      probe.sheetVisible === true &&
      record.leakedText.length === 0;
  } catch (err) {
    record.error = String(err).slice(0, 200);
    record.ok = false;
  }
  await ctx.close();
  results.push(record);
  console.log(`${record.ok ? "OK " : "!! "} ${kase.name} → ${record.shot || record.error}`);
  return record;
}

/** 发放页「打印的实际收款人」下拉里挑第 index 个（台账是异步拉的，要等选项出来） */
async function pickOwner(page, index) {
  const sel = page.getByLabel("打印的实际收款人");
  for (let i = 0; i < 20; i += 1) {
    const values = await sel.locator("option").evaluateAll((os) => os.map((o) => o.value));
    if (Array.isArray(values) && values.length > index) {
      await sel.selectOption(values[index]);
      await page.waitForTimeout(200);
      return values[index];
    }
    await page.waitForTimeout(300);
  }
  return "";
}

/**
 * 全部打印入口（`printCheck` 查「印出了什么」、`pageAudit` 查「分了几页 / 留了多少白」，共用这一份清单）：
 * 以后加打印入口只改这里，两处检查一起覆盖，不会只补一边。
 */
function printCases() {
  return [
    // ① 发放记录：明细/汇总 × 全部人/单人（用户报的那个缺陷）
    { name: "发放记录-明细-全部人", route: "/payments", button: "打印明细", file: "payments-明细-全部人", picked: "全部实际收款人" },
    {
      name: "发放记录-明细-单人",
      route: "/payments",
      button: "打印明细",
      file: "payments-明细-单人",
      picked: "（动态选第一个实际收款人）",
      setup: (page) => pickOwner(page, 1),
    },
    { name: "发放记录-汇总-全部人", route: "/payments", button: "打印汇总", file: "payments-汇总-全部人", picked: "全部实际收款人" },
    {
      name: "发放记录-汇总-单人",
      route: "/payments",
      button: "打印汇总",
      file: "payments-汇总-单人",
      picked: "（动态选第一个实际收款人）",
      setup: (page) => pickOwner(page, 1),
    },
    // ② 其它打印入口：同一个尺子
    { name: "报销单-打印全部", route: "/expenses", button: "打印报销单", file: "expenses-all" },
    { name: "保险合同清单", route: "/insurance", button: "打印清单", file: "insurance-list" },
    {
      name: "合同对账单",
      route: "/contracts",
      button: "打印对账单",
      file: "contracts-statement",
      setup: async (page) => {
        // 对账单必须先选中合同（勾表格里的复选框，按钮才会 enable）
        const chk = page.locator('table input[type="checkbox"]').first();
        for (let i = 0; i < 20 && (await chk.count()) === 0; i += 1) await page.waitForTimeout(300);
        if (await chk.count()) await chk.check().catch(() => {});
        await page.waitForTimeout(400);
      },
    },
    {
      name: "个人查询-工资条",
      route: "/query",
      button: "打印",
      file: "query-payslips",
      setup: async (page) => {
        const btn = page.getByRole("button", { name: "选择人员" });
        if (await btn.count()) {
          await btn.click();
          await page.waitForTimeout(300);
        }
        const boxes = page.locator('input[type="checkbox"]');
        const n = await boxes.count();
        for (let i = 0; i < Math.min(n, 2); i += 1) await boxes.nth(i).check().catch(() => {});
        await page.waitForTimeout(300);
      },
    },
  ];
}

async function printCheck() {
  const b = await browser();
  const outDir = "browser-screenshots/print";
  await mkdir(outDir, { recursive: true });
  const results = [];

  for (const kase of printCases()) await printCase(b, outDir, results, kase);

  await b.close();
  console.log("\n=== 打印媒体验证 ===");
  console.log(JSON.stringify(results, null, 1));
  const bad = results.filter((r) => !r.ok);
  console.log(`\n合格 ${results.length - bad.length}/${results.length}` + (bad.length ? `，不合格：${bad.map((x) => x.name).join("、")}` : ""));
}

/** 调试：看某页为什么停在「加载中…」（打印 console 与失败请求） */
async function debugPage() {
  const b = await browser();
  const ctx = await loggedInContext(b, { width: 390, height: 844 });
  const page = await ctx.newPage();
  page.on("console", (m) => console.log("  [console]", m.type(), m.text().slice(0, 160)));
  page.on("pageerror", (e) => console.log("  [pageerror]", String(e).slice(0, 200)));
  page.on("requestfailed", (r) => console.log("  [reqfail]", r.url().slice(-60), r.failure()?.errorText));
  page.on("response", (r) => {
    if (r.url().includes("/api/")) console.log("  [resp]", r.status(), r.url().slice(-60));
  });
  for (const route of process.argv.slice(3)) {
    console.log("== ", route);
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    console.log("   text:", (await page.evaluate("document.body.innerText")).replace(/\n+/g, " | ").slice(0, 160));
  }
  await b.close();
}

/** 诊断：为什么某页会横向溢出 —— 输出视口/文档宽度与溢出元素的祖先链 */
async function diag() {
  const b = await browser();
  const ctx = await loggedInContext(b, { width: 390, height: 844 });
  const page = await ctx.newPage();
  for (const route of process.argv.slice(3)) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const info = await page.evaluate(`(() => {
      const vw = window.innerWidth;
      window.scrollTo(9999, 0);
      const maxScrollX = window.scrollX;
      window.scrollTo(0, 0);
      let maxRight = 0, maxRightEl = '';
      for (const el of document.querySelectorAll('body *')) {
        const s2 = getComputedStyle(el);
        if (s2.display === 'none' || s2.visibility === 'hidden') continue;
        const r2 = el.getBoundingClientRect();
        if (r2.width === 0 && r2.height === 0) continue;
        if (r2.right > maxRight) { maxRight = Math.round(r2.right); maxRightEl = el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 40) + ' pos=' + s2.position; }
      }
      const out = { route: location.pathname, vw, docScrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, bodyScrollW: document.body.scrollWidth, maxScrollX, maxRight, maxRightEl, offenders: [] };
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.position === 'fixed') continue;
        const r = el.getBoundingClientRect();
        if (r.right <= vw + 1) continue;
        const chain = [];
        let n = el;
        while (n && n !== document.body) {
          const st = getComputedStyle(n);
          chain.push(n.tagName.toLowerCase() + '.' + String(n.className).slice(0, 34) + ' w=' + Math.round(n.getBoundingClientRect().width) + ' ov=' + st.overflowX);
          n = n.parentElement;
        }
        out.offenders.push({ cls: String(el.className).slice(0, 40), right: Math.round(r.right), width: Math.round(r.width), chain: chain.slice(0, 6), text: (el.textContent||'').trim().slice(0,20) });
      }
      out.offenders = out.offenders.slice(0, 3);
      return out;
    })()`);
    console.log(JSON.stringify(info, null, 1));
  }
  await b.close();
}

/** 打印分页体检：8 个打印入口各出一份 A4 PDF，量页数与每页白边 */
async function pageAudit() {
  const b = await browser();
  const outDir = "browser-screenshots/print";
  await mkdir(outDir, { recursive: true });
  const only = process.argv.slice(3);
  const rows = [];
  for (const kase of printCases()) {
    if (only.length && !only.some((k) => kase.name.includes(k))) continue;
    const ctx = await loggedInContext(b, { width: 1280, height: 900 });
    const page = await ctx.newPage();
    await page.addInitScript("window.print = function () {};");
    try {
      await page.goto(BASE + kase.route, { waitUntil: "networkidle" });
      await waitReady(page);
      if (kase.setup) await kase.setup(page);
      await page.getByRole("button", { name: new RegExp(kase.button) }).first().click();
      await page.waitForTimeout(700);
      await page.emulateMedia({ media: "print" });
      await page.waitForTimeout(300);
      const pdf = await page.pdf({
        preferCSSPageSize: true,
        // 与浏览器打印对话框默认一致（不勾「背景图形」）：否则页面底色会让每页都显得印满了
        printBackground: false,
        margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
        path: `${outDir}/${kase.file}.pdf`,
      });
      const detail = pdfPageTexts(pdf);
      rows.push({
        name: kase.name,
        pages: detail.length,
        pdf: `${outDir}/${kase.file}.pdf`,
        detail: detail.map((pg) => ({
          page: pg.page,
          blankBottomMm: pg.blankBottomMm,
          blankTopMm: pg.blankTopMm,
          blank: pg.blank,
          head: (pg.lines[0] || {}).text || "",
          tail: (pg.lines[pg.lines.length - 1] || {}).text || "",
        })),
      });
    } catch (err) {
      rows.push({ name: kase.name, error: String(err).slice(0, 160) });
    }
    await ctx.close();
  }
  await b.close();
  console.log("\n=== 打印分页体检（底部空白 = 该页最后一行到纸底可打印区的距离，mm）===");
  for (const r of rows) {
    if (r.error) {
      console.log(`!! ${r.name} → ${r.error}`);
      continue;
    }
    const bottoms = r.detail.map((pg) => (pg.blank ? "整页空白" : `${pg.blankBottomMm}mm`)).join(" | ");
    const waste = r.detail.reduce((acc, pg) => acc + (pg.blank ? 273 : pg.blankBottomMm), 0);
    console.log(`${r.name}：${r.pages} 页，底部空白 ${bottoms}；累计白边 ${waste.toFixed(0)}mm`);
    for (const pg of r.detail) console.log(`    第${pg.page}页 首行「${String(pg.head).slice(0, 60)}」/ 末行「${String(pg.tail).slice(0, 40)}」`);
  }
  console.log("\n" + JSON.stringify(rows, null, 1));
}

const cmd = process.argv[2];
if (cmd === "seed") await seed();
else if (cmd === "mobile") await mobile();
else if (cmd === "print") await printCheck();
else if (cmd === "pages") await pageAudit();
else if (cmd === "diag") await diag();
else if (cmd === "debug") await debugPage();
else console.log("用法见文件头注释：seed / mobile / print / pages [用例名…] / diag <路径> / debug <路径>");
