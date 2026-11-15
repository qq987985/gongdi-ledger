/** 创建班组、自动日期及工资计算解释的真实浏览器回归。仅使用专用临时 DATA_DIR。
 * 准备及环境同 query-attendance-check.mjs；顺序执行，不能与其它写入脚本共用目录并跑。
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
await ctx.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
const page = await ctx.newPage();
page.on("dialog", (dialog) => dialog.accept());
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const out = process.env.E2E_OUTPUT_DIR || "browser-screenshots/teams-query-wage-20261115";
await mkdir(out, { recursive: true });
const report = [];
const clean = (text) => text.normalize("NFKC").replace(/⻓/g, "长").replace(/\s/g, "");
async function authOp(op, args = {}) {
  const response = await ctx.request.post("/api/auth", { data: { op, ...args } });
  assert.equal(response.status(), 200, await response.text());
  return response.json();
}
async function ledger() { return (await ctx.request.get("/api/ledger")).json(); }
async function put(data) {
  const old = await ctx.request.get("/api/ledger");
  const response = await ctx.request.put("/api/ledger", { headers: { "if-match": old.headers()["x-ledger-revision"] || "" }, data });
  assert.equal(response.status(), 200, await response.text());
}
async function dates(expected) {
  for (const [label, value] of Object.entries(expected)) assert.equal(await page.getByLabel(label, { exact: true }).inputValue(), String(value), label);
}
async function printPdf(button, file, expected, forbidden = []) {
  const before = await page.evaluate(() => window.__printed || 0);
  await page.getByRole("button", { name: button, exact: true }).click();
  await page.waitForFunction((count) => window.__printed > count, before);
  await page.setViewportSize({ width: 703, height: 1000 });
  await page.emulateMedia({ media: "print" });
  assert.ok(await page.locator(".print-only .query-wage-standard").evaluateAll((notes) => notes.every((note) => note.tagName === "CAPTION" && note.getBoundingClientRect().bottom <= note.parentElement.querySelector("thead").getBoundingClientRect().top + 1)), "工资备注必须在表头上方");
  assert.ok(await page.locator(".print-only .query-wage-table .query-wage-amount").evaluateAll((rows) => rows.every((row) => row.parentElement.tagName === "TBODY" && row.parentElement.previousElementSibling?.tagName === "THEAD" && row.parentElement.previousElementSibling.lastElementChild?.classList.contains("query-wage-columns"))), "列标题和金额之间不得插入备注");
  for (const headers of await page.locator(".print-only .query-wage-table thead tr:last-child").evaluateAll((rows) => rows.map((row) => [...row.cells].map((cell) => cell.textContent.replace(/\s/g, ""))))) {
    const base = headers.indexOf("出勤工资");
    assert.equal(headers[base + 1], "加班工资", "打印加班工资必须紧跟出勤工资");
    if (headers.some((header) => header.startsWith("补助"))) assert.ok(headers[base + 2].startsWith("补助"), "补助必须在加班工资之后");
  }
  assert.ok(await page.locator(".print-only .query-wage-person + .query-wage-person").evaluateAll((people) => people.every((person) => person.getBoundingClientRect().top - person.previousElementSibling.getBoundingClientRect().bottom >= 10)), "独立人员表之间必须留白");
  assert.ok(await page.locator(".print-only .query-person-gap td").evaluateAll((cells) => cells.every((cell) => cell.getBoundingClientRect().height >= 10)), "人员之间必须有实际打印留白");
  assert.deepEqual(await page.locator(".query-number").evaluateAll((cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).map((cell) => cell.textContent)), []);
  const bytes = await page.pdf({ path: `${out}/${file}.pdf`, preferCSSPageSize: true, displayHeaderFooter: false });
  const pages = pdfPageTexts(bytes);
  assert.ok(pages.length && pages.every((p) => !p.blank), "不得有空白页");
  const text = clean(pages.flatMap((p) => p.lines.map((line) => line.text)).join(""));
  for (const value of expected) assert.ok(text.includes(clean(value)), `${file} 缺少 ${value}`);
  for (const value of forbidden) assert.ok(!text.includes(clean(value)), `${file} 包含 ${value}`);
  report.push({ file, pages: pages.length, bytes: bytes.length });
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  return text;
}
try {
  const status = await (await ctx.request.get("/api/auth")).json();
  await authOp(status.needSetup ? "setup" : "login", { username: "admin", password: "12345678", name: "合成班组工资核对" });
  const seed = await ledger();
  const person = (id, name, team, extra = {}) => ({ ...seed.people[0], id, name, team, dailyWage: 300, monthWage: 0, payType: "day", otRule: "折算:8", mealAllowance: 20, wageHistory: [], idCard: "", cardNo: "", ...extra });
  const people = [person("calc-a", "工资核对甲", "一组"), person("calc-b", "历史核对乙", "一组", { dailyWage: 999, wageHistory: [
    { id: "history-day", fromDate: "2025-01-01", payType: "day", dailyWage: 100, monthWage: 0, otRule: "折算:8", mealAllowance: 10, remark: "" },
    { id: "history-month", fromDate: "2026-01-31", payType: "month", dailyWage: 0, monthWage: 3000, otRule: "折算:8", mealAllowance: 12, remark: "" },
  ] }), person("calc-c", "仅发放丙", "二组"), person("calc-d", "未填写丁", "")];
  const row = (id, name, year, month, extra = {}) => ({ id, name, team: "一组", year, month, days: 2, otHours: 8, allowance: 5, deduction: 10, remark: "合成核对备注", ...extra });
  const sample = { ...seed, schemaVersion: 3, year: 2026, teams: [], people, attendance: [
    row("calc-att-a", people[0].name, 2026, 7, { days: 20.5, otHours: 10, allowance: 100, deduction: 50 }),
    row("calc-att-b", people[1].name, 2025, 12), row("calc-att-c", people[1].name, 2026, 1),
  ], payments: [
    { id: "calc-pay-a", owner: "外部人员", receiver: people[2].name, date: "2023-05-08", amount: 100, source: "", remark: "" },
    { id: "calc-pay-b", owner: people[2].name, receiver: people[2].name, date: "2026-08-09", amount: 200, source: "", remark: "" },
    ...[
      ["2024-01-31", 400, "二月范围前"], ["2024-02-01", 31, "二月首日"],
      ["2024-02-29", 29, "二月末日"], ["2024-03-01", 800, "二月范围后"], ["", 1600, "无日期待发"],
    ].map(([date, amount, remark], index) => ({ id: `boundary-${index}`, owner: people[2].name, receiver: people[2].name, date, amount, source: remark, remark })),
  ], attendanceDocs: [] };
  await put(sample);
  await page.goto("/query", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "查询", exact: true }).waitFor();
  await page.getByLabel("查询姓名", { exact: true }).fill(people[0].name);
  await dates({ 从年: 2026, 从月: 7, 到年: 2026, 到月: 7 });
  await page.getByLabel("查询姓名", { exact: true }).fill(people[1].name);
  await dates({ 从年: 2025, 从月: 12, 到年: 2026, 到月: 1 });
  await page.getByLabel("查询姓名", { exact: true }).fill(people[3].name);
  assert.ok((await page.locator("main").innerText()).includes("当前对象暂无可自动选择的记录"));
  assert.ok(await page.getByRole("button", { name: "按数据日期", exact: true }).isDisabled());
  await page.getByLabel("查询姓名", { exact: true }).fill(people[1].name);
  await page.getByLabel("从月", { exact: true }).selectOption("11");
  await page.getByLabel("查询姓名", { exact: true }).fill(people[0].name);
  await page.getByLabel("查询内容", { exact: true }).selectOption("wage");
  await dates({ 从年: 2025, 从月: 11, 到年: 2026, 到月: 1 });
  await page.getByRole("button", { name: "按数据日期", exact: true }).click();
  await dates({ 从年: 2026, 从月: 7, 到年: 2026, 到月: 7 });
  assert.equal(await page.getByLabel("从日", { exact: true }).count(), 0);
  assert.equal(await page.getByLabel("到日", { exact: true }).count(), 0);
  assert.ok((await page.locator("main").innerText()).includes("2026-07-01 至 2026-07-31"));
  const calc = page.locator(".no-print .wage-calculation").first();
  const formula = clean(await calc.innerText());
  assert.deepEqual(await page.getByRole("region", { name: "个人查询汇总", exact: true }).locator("thead th").allTextContents(), ["年月", "出勤天数", "加班小时", "出勤工资", "加班工资", "其他补助", "罚款/扣款", "应发", "备注"]);
  assert.deepEqual((await page.getByRole("region", { name: "个人查询汇总", exact: true }).locator("tbody tr").first().locator("td").allTextContents()).slice(3, 8), ["¥6,150.00", "¥375.00", "¥100.00", "¥50.00", "¥6,985.00"], "个人金额跟随各自表头");
  for (const value of ["日工资¥300.00/天", "20.5天×¥300.00/天=¥6,150.00", "10小时÷8小时/天×¥300.00/天=¥375.00", "餐补", "¥410.00", "其他补助¥100.00", "罚款/扣款¥50.00", "=¥6,985.00"]) assert.ok(formula.includes(value), value);
  assert.ok((await page.locator(".print-only").textContent()).includes("罚款/扣款"), "完整表头由DOM核验，PDF另核对换行后的片段");
  await printPdf("打印查询结果", "person-wage-table", [people[0].name, "日工资", "加班折算", "8 小时/天", "出勤工资", "6,150.00", "375.00", "510.00", "罚款", "扣款", "6,985.00"], ["工资计算", "逐笔取分", "金额按现行规则", "= ¥", "折算工资", "折算日工资"]);
  assert.deepEqual((await page.locator(".print-only .query-wage-amount").first().locator("td").allTextContents()).slice(3, 8), ["6,150.00", "375.00", "510.00", "50.00", "6,985.00"], "打印金额跟随各自表头，补助仍含餐补");
  assert.equal(await page.locator(".print-only .wage-calculation").count(), 0);
  assert.equal(await page.locator(".print-only .query-wage-standard").count(), 1);
  assert.equal(await page.locator(".print-only tbody .query-wage-standard").count(), 0);
  await mkdir("output/pdf", { recursive: true });
  for (const width of [1440, 375, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width} 查询页面溢出`);
    await calc.scrollIntoViewIfNeeded();
    assert.equal(await calc.evaluate((element) => element.scrollWidth > element.clientWidth + 1), false, `${width} 工资计算说明须直接换行`);
    const bounds = await calc.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    await page.screenshot({ path: `${out}/wage-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByLabel("查询姓名", { exact: true }).fill(people[1].name);
  await dates({ 从年: 2025, 从月: 12, 到年: 2026, 到月: 1 });
  await printPdf("打印查询结果", "history-wage-table", ["日工资", "100.00", "加班折算", "月工资", "3,000.00", "315.00", "3,119.00", "29.00"], ["999.00", "工资计算", "= ¥", "折算工资", "折算日工资"]);
  await page.getByRole("button", { name: "选择人员", exact: true }).click();
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await page.getByRole("checkbox", { name: people[1].name, exact: true }).check();
  await printPdf("打印工资条 1 张", "history-slip", ["工资条", "日工资", "加班折算", "出勤工资", "加班工资", "3,119.00", "餐补", "罚款", "扣款"], ["999.00", "工资计算", "= ¥", "折算工资", "折算日工资"]);
  await page.getByLabel("查询姓名", { exact: true }).fill(people[2].name);
  await dates({ 从年: 2023, 从月: 5, 到年: 2026, 到月: 8 });
  assert.ok((await page.locator("main").innerText()).includes("2023-05-01 至 2026-08-31"));
  await page.getByLabel("从年", { exact: true }).selectOption("2024");
  await page.getByLabel("从月", { exact: true }).selectOption("2");
  await page.getByLabel("到年", { exact: true }).selectOption("2024");
  await page.getByLabel("到月", { exact: true }).selectOption("2");
  const februaryText = await page.locator("main").innerText();
  assert.ok(februaryText.includes("2024-02-01 至 2024-02-29"));
  assert.ok(februaryText.includes("二月首日") && februaryText.includes("二月末日"));
  for (const excluded of ["二月范围前", "二月范围后", "无日期待发"]) assert.ok(!februaryText.includes(excluded));
  await printPdf("打印查询结果", "leap-month-boundaries", ["2024-02-01 至 2024-02-29", "60.00"], ["工资计算"]);
  await page.getByLabel("从年", { exact: true }).selectOption("2025");
  await page.getByLabel("到年", { exact: true }).selectOption("2025");
  assert.ok((await page.locator("main").innerText()).includes("2025-02-01 至 2025-02-28"));
  await page.getByRole("button", { name: "按数据日期", exact: true }).click();
  await page.getByLabel("查询方式", { exact: true }).selectOption("team");
  await page.getByLabel("查询班组", { exact: true }).selectOption("一组");
  await dates({ 从年: 2025, 从月: 12, 到年: 2026, 到月: 7 });
  await page.getByLabel("从年", { exact: true }).selectOption("2026");
  await page.getByLabel("从月", { exact: true }).selectOption("7");
  await printPdf("打印查询结果", "team-wage-table", ["一组", "日工资", "加班折算", "8 小时/天", "6,985.00"], ["工资计算", "折算工资", "折算日工资"]);
  await page.getByRole("button", { name: "按数据日期", exact: true }).click();
  await page.getByLabel("从月", { exact: true }).selectOption("10");
  // 普通同册刷新必须保留手动范围。
  await put({ ...sample, people: people.map((person, index) => index ? person : { ...person, dailyWage: 301 }) });
  await page.evaluate(async () => {
    const src = [...document.scripts].find((script) => /\/assets\/index-[^/]+\.js/.test(script.src))?.src;
    if (!src) throw Error("找不到构建入口");
    const mod = await import(src);
    const candidates = Object.values(mod).filter((fn) => typeof fn === "function" && /\.seed/.test(fn.toString()) && /\.then/.test(fn.toString()) && /\.catch/.test(fn.toString()));
    if (candidates.length !== 1) throw Error(`同步入口识别失败 ${candidates.length}`);
    await candidates[0]({ discardLocal: true });
  });
  await dates({ 从年: 2025, 从月: 10 });
  report.push({ scenario: "whole-month-auto-manual-leap-boundaries-and-preservation", passed: true });

  await page.goto("/people", { waitUntil: "networkidle" });
  for (const width of [1440, 375, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "创建班组", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "创建班组", exact: true });
    await dialog.getByRole("button", { name: "创建班组", exact: true }).click();
    assert.ok((await dialog.innerText()).includes("请填写班组名称"));
    await page.getByLabel("班组名称", { exact: false }).fill(`待进场${width}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    const submit = dialog.getByRole("button", { name: "创建班组", exact: true });
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await submit.scrollIntoViewIfNeeded();
    assert.ok(await submit.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return rect.top >= 0 && rect.bottom <= innerHeight && (button === hit || button.contains(hit));
    }), "创建班组按钮滚动后必须可见且可点击");
    await page.screenshot({ path: `${out}/team-editor-${width}.png` });
    await dialog.getByRole("button", { name: "创建班组", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    await page.waitForFunction(() => document.body.textContent.includes("已创建班组"));
    await page.waitForResponse((response) => response.url().endsWith("/api/ledger") && response.request().method() === "PUT" && response.status() === 200);
    assert.ok((await ledger()).teams.some((team) => team.name === `待进场${width}`));
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload({ waitUntil: "networkidle" });
  assert.ok((await page.getByRole("region", { name: "班组列表", exact: true }).innerText()).includes("待进场390 · 0 人"));
  await page.getByRole("button", { name: "创建班组", exact: true }).click();
  await page.getByLabel("班组名称", { exact: false }).fill(" 待进场390 ");
  await page.getByRole("dialog").getByRole("button", { name: "创建班组", exact: true }).click();
  assert.ok((await page.getByRole("dialog").innerText()).includes("已有同名班组"));
  await page.getByRole("dialog").getByRole("button", { name: "取消", exact: true }).click();
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "新增人员", exact: true }).click();
    await page.getByLabel("人员班组", { exact: true }).selectOption("待进场390");
    const save = page.getByRole("button", { name: "保存", exact: true });
    await save.scrollIntoViewIfNeeded();
    const box = await save.boundingBox();
    assert.ok(box && box.y >= 0 && box.y + box.height <= 901, "手机新增人员保存按钮必须可达");
    await page.screenshot({ path: `${out}/person-editor-${width}.png` });
    await page.getByRole("button", { name: "取消", exact: true }).click();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "新增人员", exact: true }).click();
  const editor = page.locator("div.fixed").filter({ has: page.getByRole("heading", { name: "新增人员", exact: true }) });
  await editor.locator("label").filter({ hasText: /^姓名/ }).locator("..").locator("input").fill("新进核对人员");
  await page.getByLabel("人员班组", { exact: true }).selectOption("待进场390");
  await editor.getByRole("button", { name: "保存", exact: true }).click();
  await page.waitForResponse((response) => response.url().endsWith("/api/ledger") && response.request().method() === "PUT" && response.status() === 200);
  assert.equal((await ledger()).people.find((person) => person.name === "新进核对人员")?.team, "待进场390");
  const username = `teams-readonly-${Date.now()}`;
  await authOp("createUser", { username, password: "12345678", perms: "people.view query.view query.print" });
  const readonly = await browser.newContext({ baseURL: `http://127.0.0.1:${process.env.PORT || 4700}`, viewport: { width: 375, height: 900 } });
  const readonlyLogin = await readonly.request.post("/api/auth", { data: { op: "login", username, password: "12345678" } });
  assert.equal(readonlyLogin.status(), 200);
  const readPage = await readonly.newPage();
  await readPage.goto("/people", { waitUntil: "networkidle" });
  assert.equal(await readPage.getByRole("button", { name: "创建班组", exact: true }).count(), 0);
  assert.equal((await readonly.request.put("/api/ledger", { data: sample })).status(), 403);
  await readonly.close();
  report.push({ scenario: "create-empty-team-blank-duplicate-reload-and-new-person-selection", passed: true });
  report.push({ scenario: "readonly-team-creation-hidden-and-ledger-write-denied", passed: true });

  // 两人均有工资的真实打印样例：上方工资/折算、下方金额，人员之间有留白。
  await page.goto("about:blank");
  await put({ ...sample, people: people.slice(0, 2), attendance: [sample.attendance[0], row("layout-person-b", people[1].name, 2026, 7)], payments: [] });
  await page.goto("/query", { waitUntil: "networkidle" });
  await page.getByLabel("查询方式", { exact: true }).selectOption("team");
  await page.getByLabel("查询内容", { exact: true }).selectOption("wage");
  assert.equal(await page.locator(".print-only [data-query-month] .query-wage-person").count(), 2);
  await printPdf("打印查询结果", "two-person-wage-gaps", [people[0].name, people[1].name, "日工资", "月工资", "加班折算", "6,985.00", "3,119.00"], ["工资计算", "折算日工资"]);
  assert.equal(await page.locator(".print-only [data-query-month] .query-wage-columns").count(), 2, "每人的表头必须紧贴自己的数据");
  report.push({ scenario: "wage-standards-above-amounts-and-person-gaps", passed: true });

  // 用户场景：打印3–10月，10月新进人员不可出现在3–9月；空白占位不算考勤。
  const latePeople = [person("early", "三月在场甲", "一组"), person("late", "十月新进乙", "一组")];
  const lateRows = [row("early-march", latePeople[0].name, 2026, 3), row("late-october", latePeople[1].name, 2026, 10),
    ...Array.from({ length: 7 }, (_, index) => row(`blank-${index}`, latePeople[1].name, 2026, index + 3, { days: 0, otHours: 0, allowance: 0, deduction: 0, remark: "" }))];
  await page.goto("about:blank");
  await put({ ...sample, people: latePeople, attendance: lateRows, payments: [] });
  await page.goto("/query", { waitUntil: "networkidle" });
  await page.getByLabel("从月", { exact: true }).selectOption("2");
  await page.getByLabel("从月", { exact: true }).selectOption("3");
  await page.getByLabel("到月", { exact: true }).selectOption("10");
  await page.getByLabel("查询方式", { exact: true }).selectOption("team");
  const march = page.getByRole("region", { name: "2026年3月班组汇总", exact: true });
  const october = page.getByRole("region", { name: "2026年10月班组汇总", exact: true });
  assert.ok((await march.innerText()).includes(latePeople[0].name) && !(await march.innerText()).includes(latePeople[1].name));
  assert.ok((await october.innerText()).includes(latePeople[1].name) && !(await october.innerText()).includes(latePeople[0].name));
  assert.equal(await page.getByRole("region", { name: "2026年9月班组汇总", exact: true }).count(), 0);
  await printPdf("打印查询结果", "late-team-attendance", [latePeople[0].name, latePeople[1].name, "2026年10月"], ["工资"]);
  assert.deepEqual(await page.locator(".print-only [data-query-month]").evaluateAll((months) => months.map((month) => month.dataset.queryMonth)), ["2026-03", "2026-10"]);
  assert.ok(!(await page.locator('.print-only [data-query-month="2026-03"]').textContent()).includes(latePeople[1].name));
  await page.getByLabel("查询内容", { exact: true }).selectOption("wage");
  await printPdf("打印查询结果", "late-team-wage", [latePeople[0].name, latePeople[1].name, "日工资", "加班折算"], ["工资计算", "折算日工资"]);
  assert.ok(!(await page.locator('.print-only [data-query-month="2026-03"]').textContent()).includes(latePeople[1].name));
  await copyFile(`${out}/late-team-wage.pdf`, "output/pdf/工资打印列序样例-1.9.10.pdf");
  await page.getByLabel("查询方式", { exact: true }).selectOption("person");
  await page.getByLabel("查询姓名", { exact: true }).fill(latePeople[1].name);
  const actualRows = await page.getByRole("region", { name: "个人查询汇总", exact: true }).locator("tbody tr").allTextContents();
  assert.equal(actualRows.length, 2, "只列10月及合计，不补3–9月零值行");
  assert.ok(actualRows[0].includes("2026年10月"));
  await printPdf("打印查询结果", "late-person-wage", [latePeople[1].name, "2026年10月"], [latePeople[0].name]);
  assert.equal(await page.locator(".print-only .query-wage-standard").count(), 1);
  report.push({ scenario: "late-arrival-only-actual-months-on-screen-and-print", passed: true });

  // 切册通过真实下拉完成：旧手动日期、班组/人员草稿不能串到新册。
  const oldBook = (await (await ctx.request.get("/api/auth")).json()).bookId;
  await authOp("createBook", { name: "自动日期隔离合成台账" });
  const nextBook = (await (await ctx.request.get("/api/auth")).json()).bookId;
  await put({ ...sample, people: [latePeople[0]], attendance: [row("isolated-row", latePeople[0].name, 2024, 2)], payments: [], teams: [{ id: "isolated-team", name: "独立班组" }] });
  await authOp("useBook", { id: oldBook });
  await page.reload({ waitUntil: "networkidle" });
  await page.goto("/query", { waitUntil: "networkidle" });
  await page.getByLabel("查询姓名", { exact: true }).fill(latePeople[0].name);
  await page.getByLabel("从月", { exact: true }).selectOption("6");
  await page.getByLabel("当前台账", { exact: true }).filter({ visible: true }).selectOption(nextBook);
  await page.waitForFunction(() => document.body.textContent.includes("已自动选择有数据的月份"));
  await dates({ 从年: 2024, 从月: 2, 到年: 2024, 到月: 2 });
  report.push({ scenario: "book-switch-resets-manual-date-range", passed: true });
  assert.deepEqual(errors, []);
  await writeFile(`${out}/result.json`, JSON.stringify({ checks: report, screenWidths: [1440, 375, 390], runtimeErrors: errors.length }, null, 2));
  console.log(JSON.stringify({ checks: report, screenWidths: [1440, 375, 390], runtimeErrors: errors.length }, null, 2));
} finally { await browser.close(); }
