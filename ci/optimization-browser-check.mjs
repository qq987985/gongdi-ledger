/** 综合优化的浏览器回归。只连接本机隔离测试服务，不要指向生产实例。
 * 先按 mobile-print-check.mjs seed 初始化临时 DATA_DIR，并创建 admin/12345678 测试账户；
 * 再运行 mobile-print-check.mjs print 生成 PDF 样本（最后的真实 PDF 预览用例会读取它）。
 * PORT=4698 PLAYWRIGHT_CORE=/path/to/playwright-core/index.js node ci/optimization-browser-check.mjs
 */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";

const base = `http://127.0.0.1:${Number(process.env.PORT || 4698)}`;
const pw = await import(process.env.PLAYWRIGHT_CORE || "playwright-core");
const chromium = pw.chromium || pw.default?.chromium;
const browser = await chromium.launch({ executablePath: process.env.E2E_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const results = [];
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
try {
  const login = await ctx.request.post(`${base}/api/auth`, { data: { op: "login", username: "admin", password: "12345678" } });
  assert.equal(login.status(), 200);
  // 上传隔离样本，readLedger 会补全合同扫描件名称，影像列表随即有「查看」入口。
  const upload = await ctx.request.put(`${base}/api/doc`, { multipart: {
    id: "c1", kind: "contract", replace: "1",
    file: { name: "预览验证.png", mimeType: "image/png", buffer: Buffer.from(PNG, "base64") },
  } });
  assert.equal(upload.status(), 200);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  async function goto(path) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("h1"));
  }
  await goto("/files");
  await page.evaluate(async (png) => {
    async function put(dbName, storeName, key, value) {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open(dbName, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(storeName);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    }
    await put("gongdi-docs", "docs", "contract::c1", { blob: new Blob(["旧台账文档"], { type: "text/plain" }), fileName: "旧台账.txt" });
    await put("gongdi-photos", "photos", "张建国::id", `data:image/png;base64,${png}`);
  }, PNG);

  // 与旧版同一份浏览器缓存：服务器拒绝时，不允许打开旧册文档/照片。
  let deniedDocs = 0;
  let deniedPhotos = 0;
  await page.route("**/api/doc?**", (route) => { deniedDocs++; return route.fulfill({ status: 403, body: "denied" }); });
  const docView = () => page.locator("tr").filter({ hasText: "预览验证.png" }).getByRole("button", { name: "查看", exact: true });
  await docView().click();
  await page.waitForTimeout(800);
  const leakedDoc = await page.locator('[data-modal="preview"]').count();
  await page.unroute("**/api/doc?**");
  await page.route("**/api/photo?**", (route) => { deniedPhotos++; return route.fulfill({ status: 403, contentType: "application/json", body: '{"error":"denied"}' }); });
  await page.route("**/api/photo-flags", (route) => route.fulfill({ status: 403, contentType: "application/json", body: '{"error":"denied"}' }));
  await goto("/photos");
  await page.getByRole("button", { name: "编辑", exact: true }).first().click();
  await page.waitForTimeout(800);
  const leakedPhoto = await page.locator('img[src^="data:"]').count();
  results.push({ check: "拒绝访问不回落旧册缓存", deniedDocs, deniedPhotos, leakedDoc, leakedPhoto });
  assert.ok(deniedDocs > 0 && deniedPhotos > 0, "请求拦截必须实际命中");
  assert.equal(leakedDoc, 0, "403 不应显示旧台账文档");
  assert.equal(leakedPhoto, 0, "403 不应显示旧台账照片");
  await page.unroute("**/api/photo?**");
  await page.unroute("**/api/photo-flags");

  if (!process.argv.includes("--cache-only")) {
    await goto("/people");
    // 存储写失败不应让拖动事件遗留，也不能阻碍本次调整。
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key.startsWith("ledger-colw:")) throw new DOMException("测试存储已满", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    const cell = page.locator(".wide-scroll thead th").nth(2);
    const rect = await cell.boundingBox();
    assert.ok(rect);
    await page.mouse.move(rect.x + rect.width - 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width + 40, rect.y + rect.height / 2);
    await page.mouse.up();
    assert.equal(await page.evaluate(() => document.body.style.cursor), "");
    assert.ok((await cell.boundingBox()).width > rect.width);
    const width = (await cell.boundingBox()).width;
    await page.mouse.move(rect.x + rect.width + 90, rect.y + rect.height / 2);
    assert.equal((await cell.boundingBox()).width, width, "松开鼠标后不能继续改变列宽");
    results.push({ check: "存储失败下调整列宽", passed: true });

    const routes = ["/", "/people", "/attendance", "/payments", "/contracts", "/expenses", "/insurance", "/photos", "/files", "/query", "/audit", "/import", "/export", "/settings"];
    for (const route of routes) {
      await goto(route);
      const over = await page.evaluate(() => {
        window.scrollTo(10000, 0);
        const x = window.scrollX;
        window.scrollTo(0, 0);
        return x;
      });
      assert.equal(over, 0, `${route} 桌面页面不应横向溢出`);
    }
    results.push({ check: "1440px 桌面布局", pages: routes.length, passed: true });

    // 首屏落在固定底栏后方的按钮应能滚到可操作位置；禁用按钮无需点击。
    for (const width of [375, 390]) {
      await page.setViewportSize({ width, height: width === 375 ? 667 : 844 });
      for (const path of ["/people", "/photos", "/expenses", "/query", "/export"]) {
        await goto(path);
        const buttons = page.locator("main button:visible:enabled, main a.btn:visible");
        const count = await buttons.count();
        assert.ok(count > 0, `${path} 必须找到可操作入口`);
        // trial 会滚动并检查实际命中位置，不执行编辑/打印/导出。
        for (const at of [...new Set([0, Math.floor(count / 2), count - 1])]) {
          await buttons.nth(at).click({ trial: true, timeout: 5000 });
        }
      }
    }
    results.push({ check: "手机底栏遮挡复核：滚动后入口可点击", sizes: [375, 390], pages: 5, passed: true });

    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: width === 375 ? 667 : 1000 });
      await goto("/files");
      const view = docView();
      await view.click();
      await page.getByRole("dialog").waitFor();
      assert.ok(await page.locator("[data-preview-close]").evaluate((el) => el === document.activeElement));
      await page.keyboard.press("Tab");
      assert.ok(await page.getByRole("dialog").getByRole("button", { name: "下载" }).evaluate((el) => el === document.activeElement));
      await page.keyboard.press("Shift+Tab");
      assert.ok(await page.locator("[data-preview-close]").evaluate((el) => el === document.activeElement));
      await mkdir("browser-screenshots/optimization", { recursive: true });
      await page.screenshot({ path: `browser-screenshots/optimization/preview-${width}.png` });
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
      assert.ok(await view.evaluate((el) => el === document.activeElement), "关闭预览后回到原查看按钮");
    }
    results.push({ check: "桌面与手机预览焦点、Tab、Esc", passed: true });

    // MIME 才是预览依据：显示名是 PDF，但真实响应是带脚本的 XML。
    await page.setViewportSize({ width: 1440, height: 1000 });
    let forgedLedgers = 0;
    let xmlPreviews = 0;
    await page.route("**/api/ledger", async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      data.contracts.find((c) => c.id === "c1").scanFileName = "伪装.pdf";
      forgedLedgers++;
      await route.fulfill({ response, json: data });
    });
    await goto("/files");
    await page.route("**/api/doc?**", (route) => {
      xmlPreviews++;
      return route.fulfill({ contentType: "application/xml", body: '<x xmlns="http://www.w3.org/1999/xhtml"><script>parent.__xmlPreviewExecuted = true</script></x>' });
    });
    await page.locator("tr").filter({ hasText: "伪装.pdf" }).getByRole("button", { name: "查看", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    assert.ok(forgedLedgers > 0 && xmlPreviews > 0);
    assert.equal(await page.getByRole("dialog").locator("iframe").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(window.__xmlPreviewExecuted)), false);
    await page.getByText("这类文件不能在页面里直接预览", { exact: false }).waitFor();
    await page.keyboard.press("Escape");
    await page.unroute("**/api/doc?**");
    await page.unroute("**/api/ledger");
    results.push({ check: "XML 伪装 PDF 不能创建 iframe 或运行脚本", passed: true });

    // 使用前一步打印检查生成的真 PDF；内置阅读器须另以截图视觉复核，iframe 存在不足以证明可读。
    const pdf = await readFile("browser-screenshots/print/payments-汇总-单人.pdf");
    await goto("/files");
    await page.route("**/api/doc?**", (route) => route.fulfill({ contentType: "application/pdf", body: pdf }));
    await docView().click();
    const frame = page.getByRole("dialog").locator("iframe");
    await frame.waitFor();
    assert.equal(await frame.getAttribute("sandbox"), null);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "browser-screenshots/optimization/pdf-preview.png" });
    results.push({ check: "真实 PDF 预览 iframe 已加载（另需视觉复核）", passed: true });
  }
  assert.deepEqual(errors, [], "浏览器不得出现未捕获异常");
  console.log(JSON.stringify(results, null, 2));
} catch (err) {
  console.log(JSON.stringify({ results, errors }, null, 2));
  throw err;
} finally {
  await browser.close();
}
