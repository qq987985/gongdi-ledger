/** 班组/个人核对与月度班组打印：只使用专用临时 DATA_DIR、构建产物和已有浏览器。
 * 先 DATA_DIR=/tmp/gongdi-team-query.XXXX node ci/mobile-print-check.mjs seed，启动 app 后执行本文件。
 * 环境：DATA_DIR、PORT（默认4700）、PLAYWRIGHT_CORE、E2E_CHROME。
 */
import assert from "node:assert/strict";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pdfPageTexts } from "./print-pdf.mjs";

assert.ok(process.env.DATA_DIR && resolve(process.env.DATA_DIR).startsWith("/tmp/gongdi-team-query."), "仅允许专用临时数据目录");
assert.ok(process.env.PLAYWRIGHT_CORE && process.env.E2E_CHROME, "请指定已有浏览器工具路径");
const driver = await import(process.env.PLAYWRIGHT_CORE);
const browser = await (driver.chromium || driver.default?.chromium).launch({ executablePath: process.env.E2E_CHROME, headless: true });
const ctx = await browser.newContext({ baseURL: `http://127.0.0.1:${process.env.PORT || 4700}`, viewport: { width: 1440, height: 1000 } });
await ctx.addInitScript(() => {
  window.__printCount = 0;
  window.print = () => { window.__printCount++; window.__printSnapshot = [...document.querySelectorAll(".print-only")].map((el) => el.textContent).join("\n"); };
});
const page = await ctx.newPage();
const out = "browser-screenshots/query-attendance-20261113";
await mkdir(out, { recursive: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const report = [];
const clean = (s) => s.normalize("NFKC").replace(/⻓/g, "长").replace(/\s/g, "");
try {
  const status = await (await ctx.request.get("/api/auth")).json();
  const auth = await ctx.request.post("/api/auth", { data: { op: status.needSetup ? "setup" : "login", username: "admin", password: "12345678", name: "合成核对测试" } });
  assert.equal(auth.status(), 200);
  const seed = await (await ctx.request.get("/api/ledger")).json();
  const names = ["核对甲", "核对乙", "核对丙", "核对丁"];
  const teams = ["乙组", "甲组", "乙组", ""];
  const people = names.map((name, i) => ({ ...seed.people[0], id: `q-p${i}`, name, team: teams[i], dailyWage: 100, mealAllowance: 0, wageHistory: [], otRule: "按小时:20", idCard: "ID-SYNTHETIC-SECRET", cardNo: "BANK-SYNTHETIC-SECRET" }));
  const attendance = names.map((name, i) => ({ ...seed.attendance[0], id: `q-a${i}`, name, year: 2026, month: 11, team: ["甲组", "甲组", "乙组", ""][i], days: [20.5, 10, 5, 3][i], otHours: [2.25, 1, 0, 4][i], allowance: 0, deduction: 0, remark: `合成备注${i}` }));
  attendance.push({ ...attendance[0], id: "q-previous", year: 2025, month: 12, days: 2, otHours: 0, remark: "跨年记录" });
  const payments = [
    { ...seed.payments[0], id: "q-self", owner: names[0], receiver: names[0], date: "2026-11-01", amount: 500 },
    { ...seed.payments[0], id: "q-proxy", owner: names[0], receiver: names[1], date: "2026-11-02", amount: 200 },
    { ...seed.payments[0], id: "q-pending", owner: names[0], receiver: names[0], date: "", amount: 900 },
  ];
  const sample = { ...seed, year: 2026, people, attendance, payments, attendanceDocs: [] };
  async function put(data) {
    const old = await ctx.request.get("/api/ledger");
    const response = await ctx.request.put("/api/ledger", { headers: { "if-match": old.headers()["x-ledger-revision"] || "" }, data });
    assert.equal(response.status(), 200, await response.text());
  }
  async function load(data = sample, route = "/query") {
    await page.goto("about:blank");
    await put(data);
    await page.goto(route, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: route === "/query" ? "查询" : "2026年考勤", exact: true }).waitFor();
  }
  async function print(button = "打印查询结果") {
    const before = await page.evaluate(() => window.__printCount);
    await page.getByRole("button", { name: button, exact: true }).click();
    await page.waitForFunction((count) => window.__printCount > count, before);
    return clean(await page.evaluate(() => window.__printSnapshot));
  }
  function attendanceOnly(text) {
    for (const banned of ["应发", "工资", "已记入", "ID-SYNTHETIC", "BANK-SYNTHETIC", "银行卡", "身份证"]) assert.ok(!text.includes(banned), `考勤件泄漏 ${banned}`);
  }
  async function range(fy = 2026, fm = 11, ty = 2026, tm = 11) {
    await page.getByLabel("从年", { exact: true }).selectOption(String(fy));
    await page.getByLabel("从月", { exact: true }).selectOption(String(fm));
    await page.getByLabel("到年", { exact: true }).selectOption(String(ty));
    await page.getByLabel("到月", { exact: true }).selectOption(String(tm));
  }
  async function pdf(file, expected, forbidden = []) {
    const viewport = page.viewportSize();
    // 按 A4 减去 24mm 页边距后的约 703px 内容宽测量，不沿用手机屏宽。
    await page.setViewportSize({ width: 703, height: 1000 });
    await page.emulateMedia({ media: "print" });
    const clipped = await page.locator(".query-number").evaluateAll((cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).map((cell) => cell.textContent));
    assert.deepEqual(clipped, [], `${file} 数值超出列宽`);
    const bytes = await page.pdf({ path: `${out}/${file}.pdf`, preferCSSPageSize: true, displayHeaderFooter: false });
    const pages = pdfPageTexts(bytes);
    const text = clean(pages.flatMap((p) => p.lines.map((l) => l.text)).join(""));
    assert.ok(pages.length && pages.every((p) => !p.blank));
    for (const word of expected) assert.ok(text.includes(clean(word)), `${file} PDF 缺 ${word}`);
    for (const word of forbidden) assert.ok(!text.includes(clean(word)), `${file} PDF 多出 ${word}`);
    report.push({ file, pages: pages.length, bytes: bytes.length });
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize(viewport);
    return pages;
  }
  await load();
  await range();
  assert.equal(await page.getByLabel("查询内容", { exact: true }).inputValue(), "attendance");
  await page.getByLabel("查询姓名", { exact: true }).fill(names[0]);
  let text = await print();
  assert.ok(text.includes("20.5") && text.includes("2.25"));
  attendanceOnly(text);
  attendanceOnly(await page.getByRole("region", { name: "个人查询明细", exact: true }).innerText());
  assert.ok(!(await page.locator("main").innerText()).includes("SYNTHETIC-SECRET"));
  await pdf("person-attendance", [names[0], "20.5", "2.25"], [names[1], "应发", "银行卡"]);
  await page.getByLabel("查询方式", { exact: true }).selectOption("team");
  await page.getByLabel("查询班组", { exact: true }).selectOption("乙组");
  text = await print();
  assert.ok(text.includes(names[0]) && text.includes(names[2]) && !text.includes(names[1]));
  assert.ok(text.includes("25.5")); attendanceOnly(text);
  await pdf("team-attendance", ["乙组", names[0], names[2], "25.5"], [names[1], "应发", "身份证"]);
  await page.getByLabel("查询内容", { exact: true }).selectOption("wage");
  text = await print();
  assert.ok(text.includes("2,095.00") && text.includes("700.00"), text);
  assert.ok(!text.includes("900.00"), "待发不能计入已发");
  await pdf("team-wage", ["工资核对", "2,095.00", "700.00"], ["ID-SYNTHETIC", "BANK-SYNTHETIC"]);
  await page.getByRole("button", { name: "选择人员", exact: true }).click();
  await page.getByRole("button", { name: "全选本班组", exact: true }).click();
  text = await print("打印工资条 2 张");
  assert.ok(text.includes("工资条") && !text.includes("工资核对清单"));
  assert.equal(await page.locator(".payslip").count(), 2);
  assert.ok(!text.includes(`姓名:${names[1]}`), "代领人可出现在打款明细，但不能多印其工资条");
  text = await print(); assert.ok(text.includes("工资核对清单") && !text.includes("台账·工资条"));
  await page.getByLabel("查询班组", { exact: true }).selectOption("甲组");
  assert.ok(await page.getByRole("button", { name: "打印工资条 0 张", exact: true }).count());
  await page.getByLabel("查询班组", { exact: true }).selectOption("");
  text = await print(); assert.ok(text.includes(names[3]) && !text.includes(names[0]));
  await page.getByLabel("查询方式", { exact: true }).selectOption("person");
  await page.getByLabel("查询姓名", { exact: true }).fill(names[0]);
  await range(2026, 11, 2025, 12);
  text = await print(); assert.ok(text.includes("2025年12月") && text.includes("22.5"));
  await pdf("person-wage", [names[0], "工资核对", "2025年12月", "22.5"], [names[1], "身份证"]);
  for (const width of [1440, 375, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const scope of ["person", "team"]) for (const content of ["attendance", "wage"]) {
      await page.getByLabel("查询方式", { exact: true }).selectOption(scope);
      await page.getByLabel("查询内容", { exact: true }).selectOption(content);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width} ${scope} ${content} 溢出`);
      const narrowHeaders = await page.locator(".query-results-table th").evaluateAll((cells) => cells.filter((cell) => cell.clientHeight > 50).map((cell) => cell.textContent));
      assert.deepEqual(narrowHeaders, [], `${width} ${scope} ${content} 表头不应逐字挤成竖排`);
    }
    await page.screenshot({ path: `${out}/query-${width}.png`, fullPage: true });
  }
  console.log("PASS 四种查询、日期范围、工资条互斥、1440/375/390布局");
  await load(sample, "/attendance");
  await page.getByRole("button", { name: /^11月/ }).first().click();
  await page.getByRole("button", { name: "按班组打印考勤", exact: true }).waitFor();
  text = await print("按班组打印考勤"); attendanceOnly(text);
  assert.ok(text.includes("30.5") && text.includes("3.25") && text.includes("未分班组"));
  await pdf("month-teams", ["甲组", "乙组", "未分班组", "30.5", "3.25"], ["应发", "工资", "身份证"]);
  await page.getByLabel("打印班组", { exact: true }).selectOption("甲组");
  text = await print("按班组打印考勤");
  assert.ok(text.includes(names[0]) && text.includes(names[1]) && !text.includes(names[2]));
  text = await print("打印月表"); assert.ok(text.includes("应发"));
  text = await print("按班组打印考勤"); attendanceOnly(text);
  const firstRow = page.locator(".no-print tbody tr").filter({ hasText: names[0] }).first();
  await firstRow.locator('input[type="number"]').first().fill("21.5");
  text = await print("按班组打印考勤"); assert.ok(text.includes("31.5") && text.includes("含未保存"));
  await page.getByLabel("考勤月份", { exact: true }).selectOption("10");
  await page.getByRole("heading", { name: "2026年10月考勤", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "按班组打印考勤", exact: true }).isDisabled(), true);
  text = clean((await page.locator(".print-only").allTextContents()).join(""));
  assert.ok(!text.includes("31.5") && !text.includes("20.5"));
  for (const width of [1440, 375, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width} 月表溢出`);
    await page.screenshot({ path: `${out}/month-${width}.png`, fullPage: true });
  }
  console.log("PASS 月表班组范围、当前编辑、切空月份、1440/375/390布局");
  // 在构建后的同一模块实例上触发同步，覆盖仅靠页面刷新无法验证的发布时序。
  const refreshSample = { ...sample, attendance: sample.attendance.map((row) => row.id === "q-a0" ? { ...row, team: "" } : row) };
  await load(refreshSample, "/attendance");
  await page.getByRole("button", { name: /^11月/ }).first().click();
  await print("按班组打印考勤");
  await page.evaluate(async () => {
    const src = [...document.scripts].find((s) => /\/assets\/index-[^/]+\.js/.test(s.src))?.src;
    if (!src) throw Error("找不到构建入口");
    const mod = await import(src);
    const candidates = Object.values(mod).filter((fn) => typeof fn === "function" && /\.seed/.test(fn.toString()) && /\.then/.test(fn.toString()) && /\.catch/.test(fn.toString()));
    if (candidates.length !== 1) throw Error(`同步入口识别失败 ${candidates.length}`);
    window.__pullLedger = candidates[0];
  });
  await put({ ...refreshSample, people: people.map((p, i) => i ? p : { ...p, team: "刷新组", dailyWage: 110 }) });
  await page.evaluate(() => window.__pullLedger({ discardLocal: true }));
  await page.getByLabel("打印班组", { exact: true }).selectOption("刷新组");
  text = await print("按班组打印考勤");
  assert.ok(text.includes(names[0]) && text.includes("刷新组") && !text.includes(names[2]));
  text = await print("打印月表"); assert.ok(text.includes("2,300.00"), "同册工资变更须重新发布月表");
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  let requestStarted;
  const started = new Promise((resolve) => { requestStarted = resolve; });
  const failPull = async (route) => { requestStarted(); await blocked; await route.abort("failed"); };
  await page.route("**/api/ledger", failPull);
  await page.evaluate(() => { window.__pullPromise = window.__pullLedger({ discardLocal: true }); });
  await started;
  assert.equal(await page.getByRole("button", { name: "按班组打印考勤", exact: true }).isDisabled(), true);
  await page.locator(".no-print tbody tr").filter({ hasText: names[0] }).first().locator('input[type="number"]').first().fill("22.5");
  release();
  await page.evaluate(() => window.__pullPromise);
  await page.unroute("**/api/ledger", failPull);
  text = await print("按班组打印考勤");
  assert.ok(text.includes("22.5") && text.includes("含未保存"), "失败恢复不能丢修改或永久禁用打印");
  report.push({ scenario: "same-book-refresh-and-failed-pull", passed: true });
  const longName = "长姓名测试工友甲";
  await load({ ...sample, people: [{ ...people[0], name: longName, team: "超长名称班组核对测试", dailyWage: 456789 }], attendance: [{ ...attendance[0], name: longName, remark: "现场核对备注及工时调整说明。".repeat(12) }], payments: [] });
  await range();
  await page.getByLabel("查询方式", { exact: true }).selectOption("team");
  await page.getByLabel("查询内容", { exact: true }).selectOption("wage");
  await print();
  assert.equal(await page.locator(".query-result-sheet tbody td").first().textContent(), longName);
  // 名字正常折成两行，PDF按纵坐标抽取时会被相邻金额行隔开；分别核对两段及完整DOM姓名。
  await pdf("team-wage-long", ["长姓名测", "试工友甲", "9,364,219.50", "现场核对备注"], ["ID-SYNTHETIC", "BANK-SYNTHETIC"]);
  await page.getByLabel("查询方式", { exact: true }).selectOption("person");
  await page.getByLabel("查询姓名", { exact: true }).fill(longName);
  await print();
  await pdf("person-wage-long", [longName, "9,364,219.50", "现场核对备注"], ["ID-SYNTHETIC", "BANK-SYNTHETIC"]);
  const manyPeople = Array.from({ length: 60 }, (_, i) => ({ ...people[0], id: `many-p${i}`, name: `测试工友${String(i + 1).padStart(2, "0")}`, team: "长表班组" }));
  const manyRows = manyPeople.map((p, i) => ({ ...attendance[0], id: `many-a${i}`, name: p.name, team: p.team, days: 1, otHours: 0.5 }));
  await load({ ...sample, people: manyPeople, attendance: manyRows, payments: [] }, "/attendance");
  await page.getByRole("button", { name: /^11月/ }).first().click();
  await print("按班组打印考勤");
  const pages = await pdf("month-team-multipage", ["测试工友01", "测试工友60", "60", "30"], ["应发", "工资"]);
  assert.ok(pages.length > 1);
  assert.ok(pages.every((p) => clean(p.lines.map((l) => l.text).join("")).includes("长表班组")), "跨页重复班组抬头");
  assert.equal((clean(pages.flatMap((p) => p.lines.map((l) => l.text)).join("")).match(/班组合计/g) || []).length, 1);
  await page.goto("about:blank");
  const created = await ctx.request.post("/api/auth", { data: { op: "createBook", name: "合成空册验证" } });
  assert.equal(created.status(), 200);
  const bookB = (await created.json()).bookId;
  assert.equal((await ctx.request.post("/api/auth", { data: { op: "useBook", id: "default" } })).status(), 200);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/attendance", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^11月/ }).first().click();
  await print("按班组打印考勤");
  let releaseBook;
  const bookGate = new Promise((resolve) => { releaseBook = resolve; });
  let reachedBook;
  const bookReached = new Promise((resolve) => { reachedBook = resolve; });
  const holdBook = async (route) => { reachedBook(); await bookGate; await route.continue(); };
  await page.route("**/api/ledger", holdBook);
  await page.getByLabel("当前台账", { exact: true }).first().selectOption(bookB);
  await bookReached;
  assert.equal(await page.getByRole("button", { name: "按班组打印考勤", exact: true }).isDisabled(), true);
  releaseBook();
  await page.waitForFunction((id) => document.querySelector('select[aria-label="当前台账"]')?.value === id, bookB);
  await page.unroute("**/api/ledger", holdBook);
  await page.waitForFunction(() => ![...document.querySelectorAll('select[aria-label="打印班组"] option')].some((o) => o.textContent.includes("长表班组")));
  assert.equal(await page.getByRole("button", { name: "按班组打印考勤", exact: true }).isDisabled(), true);
  assert.ok(!(await page.locator(".print-only").allTextContents()).join("").includes("测试工友"), "切空册不得沿用前册打印数据");
  report.push({ scenario: "book-switch-pending-and-empty", passed: true });
  await page.goto("about:blank");
  assert.equal((await ctx.request.post("/api/auth", { data: { op: "useBook", id: "default" } })).status(), 200);
  const username = `query-read-${Date.now()}`;
  assert.equal((await ctx.request.post("/api/auth", { data: { op: "createUser", username, password: "12345678", perms: "people.view attendance.view query.view query.print" } })).status(), 200);
  const readonly = await browser.newContext({ baseURL: `http://127.0.0.1:${process.env.PORT || 4700}`, viewport: { width: 375, height: 900 } });
  assert.equal((await readonly.request.post("/api/auth", { data: { op: "login", username, password: "12345678" } })).status(), 200);
  const readPage = await readonly.newPage();
  let writes = 0;
  let uploads = 0;
  let dialogs = 0;
  readPage.on("pageerror", (e) => errors.push(e.message));
  readPage.on("dialog", async (dialog) => { dialogs++; await dialog.accept(); });
  readPage.on("request", (request) => { if (request.method() === "PUT" && request.url().includes("/api/ledger")) writes++; });
  readPage.on("request", (request) => { if (request.method() === "POST" && request.url().includes("/api/images")) uploads++; });
  await readPage.addInitScript(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await readPage.goto("/query", { waitUntil: "networkidle" });
  await readPage.getByLabel("查询姓名", { exact: true }).fill(manyPeople[0].name);
  await readPage.getByRole("button", { name: "打印查询结果", exact: true }).click();
  await readPage.waitForFunction(() => window.__printed);
  await readPage.getByLabel("查询内容", { exact: true }).selectOption("wage");
  assert.equal(await readPage.locator('input[type="file"]').count(), 0, "只读查询不能上传影像");
  const dropAreas = readPage.locator("main div.rounded-lg.border-dashed");
  assert.equal(await dropAreas.count(), 2, "银行/IC拖放区域必须实际被覆盖");
  const transfer = await readPage.evaluateHandle(() => {
    const data = new DataTransfer();
    const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFZkAAAAASUVORK5CYII="), (char) => char.charCodeAt(0));
    data.items.add(new File([bytes], "synthetic.png", { type: "image/png" }));
    return data;
  });
  for (let index = 0; index < 2; index++) await dropAreas.nth(index).dispatchEvent("drop", { dataTransfer: transfer });
  await readPage.waitForTimeout(300);
  assert.equal(dialogs, 0, "只读拖放不应询问上传");
  assert.equal(uploads, 0, "只读拖放不应发起影像上传");
  assert.equal(writes, 0, "查询与打印不能写台账");
  await readonly.close();
  report.push({ scenario: "readonly-query-print-no-write", passed: true });
  assert.deepEqual(errors, []);
  await mkdir("output/pdf", { recursive: true });
  await copyFile(`${out}/team-attendance.pdf`, "output/pdf/班组考勤核对样例.pdf");
  await writeFile(`${out}/result.json`, JSON.stringify({ pdf: report, screenWidths: [1440, 375, 390], runtimeErrors: errors.length }, null, 2));
  console.log(JSON.stringify({ pdf: report, screenWidths: [1440, 375, 390], runtimeErrors: errors.length }, null, 2));
} finally { await browser.close(); }
