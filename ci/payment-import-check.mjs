/** 发放导入浏览器回归。仅允许临时 DATA_DIR，先用 mobile-print-check.mjs seed 并启动构建产物。
 * DATA_DIR=/tmp/gongdi-payment-e2e.XXXX PORT=4698 PLAYWRIGHT_CORE=/.../index.js
 * E2E_CHROME=/.../Chrome node ci/payment-import-check.mjs
 */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";
import * as XLSX from "xlsx";

assert.ok(process.env.DATA_DIR && [resolve(tmpdir()), "/tmp"].some((dir) => resolve(process.env.DATA_DIR).startsWith(`${dir}${sep}gongdi-payment-e2e.`)), "仅允许专用临时测试目录，禁止生产数据");
assert.ok(process.env.PLAYWRIGHT_CORE && process.env.E2E_CHROME, "请指定已有的浏览器与 playwright-core 路径");
const driver = await import(process.env.PLAYWRIGHT_CORE);
const chromium = driver.chromium || driver.default?.chromium;
const browser = await chromium.launch({ executablePath: process.env.E2E_CHROME, headless: true });
const baseURL = `http://127.0.0.1:${process.env.PORT || 4698}`;
const ctx = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let rejectAll = false;
page.on("dialog", (d) => rejectAll && d.message().startsWith("全部替换") ? d.dismiss() : d.accept());
const report = [];
const shotDir = "browser-screenshots/payment-import-simple-20261101";
await mkdir(shotDir, { recursive: true });
const p = (id, amount, date = "2026-11-01") => ({ id, amount, date, owner: "合成测试甲", receiver: "合成测试甲", source: "合成工程", remark: "" });
const originals = [p("synthetic-a", 100), p("synthetic-b", 200), p("synthetic-last-year", 300, "2025-11-01")];
const header = ["序号", "实际收款人", "发放日期", "发放金额(元)", "发放方", "收款人", "备注", "记录编号（勿修改）"];
const xlsx = (rows) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "发放记录");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
};
const fileFor = (rows, ids = true) => xlsx([header.slice(0, ids ? 8 : 7), ...rows.map((r, i) => [i + 1, r.owner, r.date, r.amount, r.source, r.receiver, r.remark, ...(ids ? [r.id] : [])])]);
const preview = () => page.getByRole("region", { name: "发放导入确认" });
const read = async () => { const r = await ctx.request.get("/api/ledger"); assert.equal(r.status(), 200); return r.json(); };
async function upload(buffer, name = "合成发放.xlsx") {
  await page.getByLabel("导入发放", { exact: true }).setInputFiles({ name, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer });
}
async function mode(name) { await preview().getByRole("radio", { name, exact: true }).check(); }
async function save(name = "确认导入") {
  const written = page.waitForResponse((r) => r.url().endsWith("/api/ledger") && r.request().method() === "PUT");
  await preview().getByRole("button", { name, exact: true }).click();
  assert.equal((await written).status(), 200, "应实际保存至临时服务器");
}
async function loaded() {
  await page.getByRole("heading", { name: "发放记录", exact: true }).waitFor();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("gongdi-ledger-v5") || "{}").state?.payments?.some((r) => r.id === "synthetic-a"));
}
let seed;
async function reset() {
  await page.goto("about:blank");
  const before = await ctx.request.get("/api/ledger");
  const res = await ctx.request.put("/api/ledger", { headers: { "if-match": before.headers()["x-ledger-revision"] || "" }, data: { ...seed, payments: originals } });
  assert.equal(res.status(), 200);
  await page.goto("/payments");
  await loaded();
}
try {
  const status = await (await ctx.request.get("/api/auth")).json();
  const auth = await ctx.request.post("/api/auth", { data: { op: status.needSetup ? "setup" : "login", username: "admin", password: "12345678", name: "隔离测试管理员" } });
  assert.equal(auth.status(), 200);
  seed = await read();
  const unrelated = (s) => Object.fromEntries(["people", "attendance", "expenses", "contracts", "contractEntries", "insurancePolicies", "insuranceMembers"].map((k) => [k, s[k]]));

  await reset();
  const changed = fileFor([p("synthetic-a", 120, "2026-11-02")]);
  await upload(changed);
  await preview().waitFor();
  assert.equal(await preview().getByRole("radio").count(), 2);
  assert.equal(await preview().getByRole("radio", { name: "新增导入", exact: true }).isChecked(), true);
  assert.equal(await preview().getByRole("combobox").count(), 0);
  assert.match(await preview().innerText(), /有 1 条同编号记录已被修改/);
  await save();
  assert.deepEqual((await read()).payments, originals);
  await upload(fileFor([p("synthetic-new", 80)])); await save();
  assert.deepEqual((await read()).payments, [...originals, p("synthetic-new", 80)]);
  report.push("仅有新增导入/全部替换，无逐人匹配；新增跳过同编号修正且可追加新记录");

  await reset();
  await upload(fileFor([p("legacy-a", 120), p("legacy-b", 240)], false));
  await mode("全部替换"); await preview().getByRole("checkbox").check(); await save("确认全部替换");
  const legacy = (await read()).payments;
  assert.deepEqual(legacy.map((r) => r.amount), [120, 240]);
  assert.ok(legacy.every((r) => r.id) && legacy[0].id !== legacy[1].id);
  report.push("旧文件无编号可直接全部替换，无需逐人选择");
  await reset();

  await upload(fileFor([p("synthetic-a", 222)])); await mode("全部替换");
  assert.equal(await preview().getByRole("button", { name: "确认全部替换" }).isDisabled(), true);
  await preview().getByRole("checkbox").check();
  rejectAll = true;
  await preview().getByRole("button", { name: "确认全部替换" }).click();
  assert.equal((await read()).payments.length, 3);
  rejectAll = false;
  await save("确认全部替换");
  assert.deepEqual((await read()).payments, [p("synthetic-a", 222)]);
  assert.deepEqual(unrelated(await read()), unrelated(seed));
  report.push("全部替换需勾选及最终确认；取消不变，确认仅替换发放，其他模块不变");

  await reset();
  const exported = await ctx.request.get("/api/file/payment-export");
  assert.equal(exported.status(), 200);
  const wb = XLSX.read(await exported.body(), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  assert.ok(rows[1].includes("记录编号（勿修改）"));
  rows[2][3] = 330;
  rows.push([4, "合成新增", "2026-11-03", 80, "合成工程", "合成新增", "追加", ""]);
  await upload(xlsx(rows)); await mode("全部替换"); await preview().getByRole("checkbox").check(); await save("确认全部替换");
  const appended = (await read()).payments;
  assert.equal(appended.length, 4);
  for (const original of originals) assert.deepEqual(appended.find((r) => r.id === original.id), original.id === "synthetic-last-year" ? { ...original, amount: 330 } : original);
  assert.equal(appended.reduce((n, r) => n + r.amount, 0), 710);
  report.push("真实接口导出全部→追加空编号新行→全部替换，改正金额并保留原3笔编号，总额710");

  await upload(fileFor([p("copied-id", 100), p("copied-id", 200)])); await mode("全部替换");
  assert.match(await preview().innerText(), /编号为空或重复/);
  assert.equal(await preview().getByRole("button", { name: "确认全部替换" }).isDisabled(), true);
  await preview().getByRole("button", { name: "取消", exact: true }).click();
  await upload(fileFor([p("bad-number", "错误金额")]));
  await page.getByText(/发放金额为空或不是有效数字/).waitFor();
  assert.equal(await preview().count(), 0);
  assert.equal((await read()).payments.length, 4);
  report.push("复制编号与错误金额均阻止写入");

  for (const width of [1440, 375, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await reset();
    await upload(fileFor([{ ...p("synthetic-a", 125), remark: "合成超长备注".repeat(20), source: "合成长工程名".repeat(10) }]), "合成长文件名".repeat(30) + ".xlsx");
    await mode("全部替换");
    await preview().getByRole("checkbox").check();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, `${width}px 页面不能横向溢出`);
    await preview().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shotDir}/${width}.png`, fullPage: true });
    await save("确认全部替换");
    assert.equal((await read()).payments[0].amount, 125);
    report.push(`${width}px 长文件名布局无横向溢出，确认按钮可操作且实际保存`);
  }

  // 把 authStatus 的响应悬停，重现 cookie 已切换但 payments 仍是旧数组的窗口。
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("about:blank");
  const created = await ctx.request.post("/api/auth", { data: { op: "createBook", name: "隔离切册验证" } });
  assert.equal(created.status(), 200);
  const bookStatus = await (await ctx.request.get("/api/auth")).json();
  const bookB = bookStatus.bookId;
  assert.notEqual(bookB, "default");
  assert.equal((await ctx.request.post("/api/auth", { data: { op: "useBook", id: "default" } })).status(), 200);
  await reset(); await upload(changed); await mode("全部替换"); await preview().getByRole("checkbox").check();
  let releaseAuth;
  const gate = new Promise((resolve) => { releaseAuth = resolve; });
  let reachedAuth;
  const reached = new Promise((resolve) => { reachedAuth = resolve; });
  let puts = 0;
  page.on("request", (r) => { if (r.url().endsWith("/api/ledger") && r.method() === "PUT") puts++; });
  await page.route("**/api/auth", async (route) => {
    if (route.request().method() === "GET") { reachedAuth(); await gate; }
    await route.continue();
  });
  await page.getByRole("combobox", { name: "当前台账", exact: true }).first().selectOption(bookB);
  await reached;
  await preview().getByRole("alert").filter({ hasText: "已改变" }).waitFor();
  assert.equal(await preview().getByRole("button", { name: "确认全部替换", exact: true }).isDisabled(), true);
  assert.equal(puts, 0);
  releaseAuth();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("gongdi-ledger-v5") || "{}").state?.payments?.length === 0);
  assert.equal(puts, 0);
  await page.unroute("**/api/auth");
  assert.equal((await read()).empty, true);
  report.push("真实切册在途预览即时失效，禁止确认，全程0 PUT，目标空册保持空");
  assert.deepEqual(errors, [], "浏览器不能有运行时错误");
  console.log(JSON.stringify({ passed: report.length, checks: report, screenshots: shotDir }, null, 2));
} finally { await browser.close(); }
