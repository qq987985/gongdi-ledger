/** 报销打印可读性回归：临时 DATA_DIR + 构建产物 + 已有 Chrome/Playwright。
 * DATA_DIR=/tmp/gongdi-expense-print.XXXX PORT=4699 PLAYWRIGHT_CORE=/.../index.js
 * E2E_CHROME=/.../Chrome node ci/expense-print-check.mjs
 */
import assert from "node:assert/strict";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pdfPageTexts } from "./print-pdf.mjs";

assert.ok(process.env.DATA_DIR && resolve(process.env.DATA_DIR).startsWith("/tmp/gongdi-expense-print."), "仅允许专用临时数据目录");
assert.ok(process.env.PLAYWRIGHT_CORE && process.env.E2E_CHROME, "请指定已有浏览器工具路径");
const driver = await import(process.env.PLAYWRIGHT_CORE);
const chromium = driver.chromium || driver.default?.chromium;
const browser = await chromium.launch({ executablePath: process.env.E2E_CHROME, headless: true });
const ctx = await browser.newContext({ baseURL: `http://127.0.0.1:${process.env.PORT || 4699}`, viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const out = "browser-screenshots/expense-print-medium-20261110";
await mkdir(out, { recursive: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => { window.print = () => {}; });
const report = [];
try {
  const status = await (await ctx.request.get("/api/auth")).json();
  const auth = await ctx.request.post("/api/auth", { data: { op: status.needSetup ? "setup" : "login", username: "admin", password: "12345678", name: "合成打印测试" } });
  assert.equal(auth.status(), 200);
  const seed = await (await ctx.request.get("/api/ledger")).json();
  const sample = (i) => ({ ...seed.expenses[1], id: `print-${i}`, name: `材料采购-${String(i).padStart(2, "0")}（含税及运输费用）`, period: "2026-11-10", date: "2026-11-10", year: 2026,
    amount: 100 + i * 13.25, status: "未报销", claimant: "合成测试甲", forWhom: "合成测试乙", payBank: "合成测试银行", payCardNo: "0000000000000000", remark: i % 3 === 0 ? "含运输及卸车费用，现场验收后凭票报销。" : "现场验收完成", voucherFileName: `合成票据-${i}-abcdefghijklmnopqrstuv.pdf` });
  async function load(count) {
    await page.goto("about:blank");
    const old = await ctx.request.get("/api/ledger");
    const written = await ctx.request.put("/api/ledger", { headers: { "if-match": old.headers()["x-ledger-revision"] || "" }, data: { ...seed, year: 2026, expenses: Array.from({ length: count }, (_, i) => sample(i + 1)) } });
    assert.equal(written.status(), 200);
    await page.goto("/expenses");
    await page.waitForFunction((n) => document.querySelectorAll(".expense-statement tbody tr").length === n + 1, count);
  }
  for (const [count, voucher, file] of [[1, false, "single"], [4, false, "sample"], [45, false, "multipage"], [45, true, "multipage-voucher"]]) {
    await load(count);
    if (voucher) await page.getByRole("checkbox", { name: "打印票据列" }).check();
    await page.emulateMedia({ media: "print" });
    const metrics = await page.locator(".expense-statement tbody td").first().evaluate((el) => {
      const style = getComputedStyle(el);
      return { font: parseFloat(style.fontSize), padding: parseFloat(style.paddingTop), height: el.getBoundingClientRect().height };
    });
    assert.ok(Math.abs(metrics.font - 14) < 0.1 && metrics.padding >= 4.4 && metrics.padding <= 4.7 && metrics.height >= 28, JSON.stringify(metrics));
    const pdf = await page.pdf({ path: `${out}/${file}.pdf`, preferCSSPageSize: true, printBackground: false, displayHeaderFooter: false });
    const pages = pdfPageTexts(pdf);
    assert.ok(pages.length > 0 && pages.every((p) => !p.blank));
    const text = pages.flatMap((p) => p.lines.map((line) => line.text)).join("").normalize("NFKC").replace(/\s/g, "");
    for (let i = 1; i <= count; i++) assert.ok(text.includes(`材料采购-${String(i).padStart(2, "0")}`), `PDF 缺第 ${i} 条`);
    assert.equal((text.match(/合计/g) || []).length, 1);
    const total = Array.from({ length: count }, (_, i) => sample(i + 1).amount).reduce((a, b) => a + b, 0).toFixed(2);
    assert.ok(text.includes(Number(total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })), `PDF 总金额应为 ${total}`);
    if (count === 45) {
      assert.ok(pages.length > 1);
      assert.ok(pages.every((p) => p.lines.map((l) => l.text).join("").normalize("NFKC").replace(/\s/g, "").includes("报销人")), "续页应重复单据抬头");
    } else assert.equal(pages.length, 1);
    report.push({ file, count, voucher, pages: pages.length, metrics, total });
    await page.emulateMedia({ media: "screen" });
  }
  for (const width of [1440, 375, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await load(4);
    assert.equal(await page.locator(".print-only").isVisible(), false);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}px 页面溢出`);
    await page.screenshot({ path: `${out}/screen-${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  await mkdir("output/pdf", { recursive: true });
  await copyFile(`${out}/sample.pdf`, "output/pdf/报销单打印样例-适中版.pdf");
  await writeFile(`${out}/result.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ cases: report, screenWidths: [1440, 375, 390], runtimeErrors: errors.length }, null, 2));
} finally { await browser.close(); }
