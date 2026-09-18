/** 持久化模式的浏览器回归：所有 /api 请求均被 mock，不登录、不修改服务器数据。
 * 先构建并启动隔离服务，再运行：
 * PORT=4698 PLAYWRIGHT_CORE=/path/to/playwright-core/index.js node ci/nas-mode-browser-check.mjs
 */
import assert from "node:assert/strict";
const base = `http://127.0.0.1:${Number(process.env.PORT || 4698)}`;
const pw = await import(process.env.PLAYWRIGHT_CORE || "playwright-core");
const chromium = pw.chromium || pw.default?.chromium;
const browser = await chromium.launch({ executablePath: process.env.E2E_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
const ledger = { schemaVersion: 2, year: 2026, years: [2026], accessHash: "", uiStyle: "classic", people: [{ id: "fixture-person", name: "缓存隔离测试", team: "测试班组", dailyWage: 0, monthWage: 0, payType: "day", wageHistory: [] }], attendance: [], attendanceDocs: [{ id: "fixture-doc", year: 2026, month: 1, fileName: "旧册影像.png" }], payments: [], contracts: [], contractEntries: [], expenses: [], insurancePolicies: [], insuranceMembers: [] };
const auth = { persist: true, needSetup: false, user: { id: "fixture-user", username: "fixture", name: "隔离测试", role: "admin" }, books: [{ id: "fixture-book", name: "隔离台账" }], bookId: "fixture-book", users: [], members: [], perms: ["*"] };
const results = [];
async function fixture(mode) {
  const context = await browser.newContext();
  context.setDefaultTimeout(8000);
  const page = await context.newPage();
  const hits = { auth: 0, health: 0, ledger: 0, photo: 0, doc: 0, photoPut: 0, ledgerPut: 0 };
  const state = { mode };
  const startupRace = mode === "identitySlow" || mode === "sameIdentity";
  let releaseAuth;
  const authReady = new Promise((resolve) => { releaseAuth = resolve; });
  const puts = [];
  await page.route("**/__nas_mode_fixture", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>fixture</title>" }));
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/auth") {
      hits.auth++;
      if (state.mode === "auth500") return json({ persist: false }, 500);
      if (state.mode === "authMalformed") return json({});
      if (state.mode === "local") return json({ persist: false, user: null, books: [] });
      if (startupRace) await authReady;
      return json(auth);
    }
    if (path === "/api/health") {
      hits.health++;
      if (state.mode !== "local") return route.abort("failed");
      return json({ persist: false });
    }
    if (path === "/api/ledger") {
      hits.ledger++;
      if (route.request().method() === "PUT") {
        hits.ledgerPut++;
        let body = route.request().postDataBuffer();
        if (route.request().headers()["content-encoding"] === "gzip") {
          const { gunzipSync } = await import("node:zlib");
          body = gunzipSync(body);
        }
        puts.push(JSON.parse(body.toString("utf8")));
        return json({ ok: true });
      }
      return json(startupRace ? { empty: true } : ledger);
    }
    if (path === "/api/photo") {
      hits.photo++;
      if (route.request().method() === "PUT") { hits.photoPut++; return json({ error: "上传失败测试" }, 500); }
      return json({ error: "无权访问旧照片" }, 403);
    }
    if (path === "/api/photo-flags") return json({ error: "无权访问旧标记" }, 403);
    if (path === "/api/doc") { hits.doc++; return json({ error: "无权访问旧文档" }, 403); }
    // 不允许任何未声明的 API 请求落到真实服务，包括后台审计/自动保存。
    return json({ ok: false }, 400);
  });
  await page.goto(`${base}/__nas_mode_fixture`);
  await page.evaluate(async ({ ledger, PNG }) => {
    localStorage.setItem("gongdi-ledger-v5", JSON.stringify({ version: 10, state: ledger }));
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
    await put("gongdi-photos", "photos", "缓存隔离测试::id", `data:image/png;base64,${PNG}`);
    await put("gongdi-docs", "docs", "attendance::fixture-doc", { blob: new Blob([Uint8Array.from(atob(PNG), (c) => c.charCodeAt(0))], { type: "image/png" }), fileName: "旧册影像.png" });
  }, { ledger, PNG });
  if (startupRace) await page.evaluate((owner) => localStorage.setItem("gongdi-ledger-v5-owner", owner), mode === "sameIdentity" ? "fixture-user::fixture-book" : "old-user::old-book");
  return { context, page, hits, state, puts, releaseAuth };
}
try {
  for (const mode of ["auth500", "authMalformed"]) {
    const f = await fixture(mode);
    try {
      await f.page.goto(`${base}/photos`, { waitUntil: "networkidle" });
      await f.page.getByRole("button", { name: "重新连接", exact: true }).waitFor();
      assert.equal(await f.page.locator("main").count(), 0, "鉴权错误时不挂业务页面");
      assert.ok(f.hits.auth > 0, "错误注入必须命中实际身份请求");
      assert.equal(f.hits.health + f.hits.ledger, 0, "身份失败不得提前探测/读取/seed台账");
      const before = f.hits.auth;
      f.state.mode = "local";
      await f.page.getByRole("button", { name: "重新连接", exact: true }).click();
      await f.page.getByRole("heading", { name: "照片管理", exact: true }).waitFor();
      assert.ok(f.hits.auth > before, "重新连接必须重新请求身份接口");
      results.push({ check: mode, retry: true, ...f.hits });
    } finally { await f.context.close(); }
  }
  for (const mode of ["local", "serverHealthFailed"]) {
    const f = await fixture(mode);
    try {
      await f.page.goto(`${base}/photos`, { waitUntil: "networkidle" });
      await f.page.getByRole("button", { name: "编辑", exact: true }).first().click();
      await f.page.waitForTimeout(300);
      const photos = await f.page.locator('img[src^="data:"]').count();
      assert.equal(photos > 0, mode === "local", "只有明确本地模式可以显示旧照片");
      if (mode !== "local") {
        await f.page.locator('input[type="file"]').first().setInputFiles({ name: "upload.png", mimeType: "image/png", buffer: Buffer.from(PNG, "base64") });
        await f.page.getByText("照片上传失败（500）", { exact: true }).waitFor();
        assert.ok(f.hits.photoPut > 0, "健康探测失败后上传仍必须命中服务器并呈现失败");
      }
      await f.page.goto(`${base}/files`, { waitUntil: "networkidle" });
      await f.page.locator("tr").filter({ hasText: "旧册影像.png" }).getByRole("button", { name: "查看", exact: true }).click();
      await f.page.waitForTimeout(300);
      const docs = await f.page.locator('[data-modal="preview"]').count();
      assert.equal(docs > 0, mode === "local", "只有明确本地模式可以显示旧文档");
      assert.ok(f.hits.auth > 0, "身份模式探测必须实际命中");
      if (mode !== "local") assert.ok(f.hits.health > 0 && f.hits.photo > 0 && f.hits.doc > 0, "拒绝响应必须实际命中健康和影像接口");
      else assert.equal(f.hits.photo + f.hits.doc, 0, "明确本地模式不请求服务器影像");
      results.push({ check: mode, photos, docs, ...f.hits });
    } finally { await f.context.close(); }
  }
  for (const mode of ["identitySlow", "sameIdentity"]) {
    const f = await fixture(mode);
    try {
      await f.page.goto(`${base}/photos`, { waitUntil: "domcontentloaded" });
      await assert.doesNotReject(async () => {
        for (let i = 0; i < 80 && f.hits.auth === 0; i++) await f.page.waitForTimeout(100);
        assert.ok(f.hits.auth > 0, "必须实际发起且挂起身份请求");
      });
      await f.page.waitForTimeout(650); // 跨过自动保存500ms窗口，旧缓存仍不得上传。
      assert.equal(f.hits.health + f.hits.ledger, 0, "身份未返回前不能用旧缓存启动同步");
      assert.equal(await f.page.locator("main").count(), 0, "身份未确认时不挂业务页面");
      f.releaseAuth();
      await f.page.getByRole("heading", { name: "照片管理", exact: true }).waitFor();
      await f.page.waitForTimeout(650);
      assert.ok(f.hits.health > 0 && f.hits.ledger > 0, "确认身份后才真正启动健康配置和台账读取");
      assert.equal(f.hits.ledgerPut, mode === "sameIdentity" ? 1 : 0, "只有同归属缓存可以在身份确认后首次seed");
      if (mode === "sameIdentity") assert.equal(f.puts[0].people[0].name, "缓存隔离测试");
      else assert.equal(await f.page.getByRole("button", { name: "编辑", exact: true }).count(), 0, "换身份后旧缓存已清空");
      results.push({ check: mode, ...f.hits });
    } finally { f.releaseAuth(); await f.context.close(); }
  }
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally { await browser.close(); }
