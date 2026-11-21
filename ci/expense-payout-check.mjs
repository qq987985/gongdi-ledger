/** 多笔报销收款与解除/撤销回归；只允许专用合成 DATA_DIR。
 * 准备：DATA_DIR=/tmp/gongdi-expense-payout.XXXX node ci/mobile-print-check.mjs seed
 * 启动构建产物后，设置 DATA_DIR、PORT（默认4699）、PLAYWRIGHT_CORE、E2E_CHROME 执行。
 * 不与其他写入脚本共用同一临时目录并跑。
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

assert.ok(process.env.DATA_DIR && resolve(process.env.DATA_DIR).startsWith("/tmp/gongdi-expense-payout."), "仅允许专用临时数据目录");
assert.ok(process.env.PLAYWRIGHT_CORE && process.env.E2E_CHROME, "请指定已有浏览器工具路径");
const driver = await import(process.env.PLAYWRIGHT_CORE);
const browser = await (driver.chromium || driver.default?.chromium).launch({ executablePath: process.env.E2E_CHROME, headless: true });
const baseURL = `http://127.0.0.1:${process.env.PORT || 4699}`;
const ctx = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const out = process.env.E2E_OUTPUT_DIR || "browser-screenshots/expense-payout-20261121";
await mkdir(out, { recursive: true });
const report = [];
const errors = [];
const dialogs = [];
let dismissNextDialog = false;
const routeFailures = [];
let ledgerWrites = 0;
let docWrites = 0;
let docDeletes = 0;
let atomicPair = null;
const halfBatches = [];
const clean = (s) => String(s).normalize("NFKC").replace(/\s/g, "");
const receipt = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", async (dialog) => {
  dialogs.push({ type: dialog.type(), message: dialog.message() });
  if (dismissNextDialog) { dismissNextDialog = false; await dialog.dismiss(); }
  else await dialog.accept();
});
page.on("request", (request) => {
  const url = new URL(request.url());
  if (url.pathname === "/api/doc" && request.method() === "PUT") docWrites++;
  if (url.pathname === "/api/doc" && request.method() === "DELETE") docDeletes++;
  if (url.pathname !== "/api/ledger" || request.method() !== "PUT") return;
  ledgerWrites++;
  if (!atomicPair) return;
  try {
    let body = request.postDataBuffer();
    if (request.headers()["content-encoding"] === "gzip") body = gunzipSync(body);
    const rows = JSON.parse(body.toString("utf8")).expenses;
    const pair = atomicPair.map((id) => rows.find((row) => row.id === id));
    if (pair.some((row) => !row) || pair[0].payoutId !== pair[1].payoutId || pair[0].status !== pair[1].status || pair[0].payoutFileName !== pair[1].payoutFileName) halfBatches.push({ ids: [...atomicPair], reason: "同批字段只写入了一部分" });
  } catch (error) { halfBatches.push({ reason: `无法核对批量请求：${error.message}` }); }
});
const modal = () => page.getByRole("dialog", { name: "登记报销收款", exact: true });
const buttonCount = (label, count) => page.getByRole("button", { name: new RegExp(`^${label}[（(]${count}\\s*笔[）)]$`) });
async function authOp(op, data = {}) {
  const response = await ctx.request.post("/api/auth", { data: { op, ...data } });
  assert.equal(response.status(), 200, await response.text());
  return response.json();
}
async function ledger() {
  const response = await ctx.request.get("/api/ledger");
  assert.equal(response.status(), 200);
  return response.json();
}
async function put(data) {
  const old = await ctx.request.get("/api/ledger");
  const response = await ctx.request.put("/api/ledger", { headers: { "if-match": old.headers()["x-ledger-revision"] || "" }, data });
  assert.equal(response.status(), 200, await response.text());
}
async function persisted(check, message) {
  const until = Date.now() + 12000;
  let last;
  while (Date.now() < until) {
    last = await ledger();
    if (check(last)) return last;
    await page.waitForTimeout(100);
  }
  assert.fail(message || "等待批量结果保存到服务器超时");
}
async function details() { await page.getByRole("button", { name: "报销明细", exact: true }).click(); }
async function batches() { await page.getByRole("button", { name: "收款批次", exact: true }).click(); }
async function closeModal() {
  await modal().getByRole("button", { name: "关闭", exact: true }).click();
  await modal().waitFor({ state: "hidden" });
}
async function clearSelection() {
  const clear = page.getByRole("button", { name: "清空选择", exact: true });
  if (await clear.count()) await clear.click();
}
async function selectNames(names) {
  await details(); await clearSelection();
  for (const name of names) await page.getByRole("checkbox", { name: `选择 ${name}`, exact: true }).check();
  await buttonCount("办理所选", names.length).click();
  await modal().waitFor();
}
async function openBatch(id) {
  await batches();
  await page.locator(`[data-payout-id="${id}"]`).getByRole("button", { name: "查看批次", exact: true }).click();
  await modal().waitFor();
}
async function fillAccount({ payee = "收款新甲", bank = "合成银行新支行", card = "0000000000003333", method = "转账", paid = false, claimant = "" } = {}) {
  const dialog = modal();
  if (!await dialog.getByLabel("收款人", { exact: true }).isVisible()) await dialog.getByRole("button", { name: "提前填写收款资料（选填）", exact: true }).click();
  await dialog.getByLabel("收款人", { exact: true }).fill(payee);
  await dialog.getByLabel("收款方式", { exact: true }).selectOption(method);
  if (method !== "现金") {
    await dialog.getByLabel("开户行", { exact: true }).fill(bank);
    await dialog.getByLabel("收款账户", { exact: true }).fill(card);
  }
  const reporter = dialog.getByLabel("报销人（补未填写的明细）", { exact: true });
  if (claimant) await reporter.fill(claimant);
  await dialog.getByRole("button", { name: paid ? "已收到报销款" : "待收款", exact: true }).click();
  if (paid) await dialog.getByLabel("收款日期", { exact: true }).fill("2026-11-20");
}
async function save(paid = false) {
  await modal().getByRole("button", { name: paid ? "确认收款并保存" : "保存待收款批次", exact: true }).click();
}
function byIds(data, ids) { return data.expenses.filter((row) => ids.includes(row.id)).sort((a, b) => a.id.localeCompare(b.id)); }
function unchanged(actual, before, ids, message) { assert.deepEqual(byIds(actual, ids), byIds(before, ids), message); }
async function exposePull() {
  await page.evaluate(async () => {
    const src = [...document.scripts].find((script) => /\/assets\/index-[^/]+\.js/.test(script.src))?.src;
    if (!src) throw Error("找不到构建入口");
    const mod = await import(src);
    const functions = Object.values(mod).filter((value) => typeof value === "function" && /\.seed/.test(value.toString()) && /\.then/.test(value.toString()) && /\.catch/.test(value.toString()));
    if (functions.length !== 1) throw Error(`同步入口识别失败 ${functions.length}`);
    window.__expensePayoutPull = functions[0];
  });
}
async function holdDoc({ passthrough = false } = {}) {
  let release, reached, finished;
  const gate = new Promise((resolve) => { release = resolve; });
  const requested = new Promise((resolve) => { reached = resolve; });
  const completed = new Promise((resolve) => { finished = resolve; });
  const active = new Set();
  const failures = [];
  const handler = (route) => {
    const isPut = route.request().method() === "PUT";
    const task = (async () => {
      try {
        if (!isPut) return await route.continue();
        reached(); await gate;
        if (passthrough) await route.continue();
        else await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ fileName: "合成延迟收款回单.png" }) });
      } catch (error) {
        // 路由回调不能产生未处理拒绝，必须经 remove() 回到主流程写出 failure.txt。
        const detail = `${route.request().method()} /api/doc：${error.stack || error}`;
        failures.push(detail); routeFailures.push(detail);
      } finally { if (isPut) finished(); }
    })();
    active.add(task);
    void task.then(() => active.delete(task), () => active.delete(task));
    return task;
  };
  await page.route("**/api/doc", handler);
  return {
    requested, release,
    remove: async () => {
      // release() 只打开闸门；fulfill/continue 真正完成前不能 unroute，否则会二次处理同一请求。
      await completed;
      while (active.size) await Promise.all([...active]);
      await page.unroute("**/api/doc", handler);
      assert.deepEqual(failures, [], "阻塞上传的路由处理失败");
    },
  };
}

try {
  const status = await (await ctx.request.get("/api/auth")).json();
  const logged = await authOp(status.needSetup ? "setup" : "login", { username: "admin", password: "12345678", name: "合成报销批次回归" });
  const baseBook = logged.bookId || status.bookId || "default";
  const seed = await ledger();
  function expense(id, name, amount, extra = {}) {
    return { id, name, year: 2026, period: "2026-11-19", date: "2026-11-19", unit: "项", qty: 1, price: amount, amount,
      status: "未报销", payMethod: "现金", voucherId: `voucher-${id}`, voucherFileName: `合成购买凭证-${id}.png`, claimant: "报销甲", forWhom: "", payBank: "", payCardNo: "", payAccount: "",
      payoutId: "", payoutFileName: "", payoutDate: "", payoutMethod: "转账", reimbursedAt: "", remark: "独立合成资料", ...extra };
  }
  const oldA = { payoutId: "old-a", payoutFileName: "合成旧批一回单.png", status: "已报销", forWhom: "旧收款甲", payBank: "合成银行甲", payCardNo: "0000000000001111", payAccount: "合成银行甲 0000000000001111", payoutDate: "2026-11-01", reimbursedAt: "2026-11-01" };
  const oldB = { payoutId: "old-b", payoutFileName: "", forWhom: "旧收款乙", payBank: "合成银行乙", payCardNo: "0000000000002222", payAccount: "合成银行乙 0000000000002222" };
  const rows = [expense("a1", "旧批甲材料", 100, oldA), expense("a2", "旧批甲运费", 200, { ...oldA, claimant: "报销乙" }),
    expense("b1", "旧批乙材料", 300, oldB), expense("b2", "旧批乙运费", 400, oldB),
    expense("n1", "新材料甲", 10.1), expense("n2", "新运费乙", 20.2, { claimant: "报销乙" }), expense("n0", "零金额核对", 0, { qty: 2, price: 50, claimant: "" })];
  const fixture = { ...seed, year: 2026, expenses: rows };
  async function load(data = fixture) {
    atomicPair = null;
    await page.goto("about:blank"); await put(data);
    await page.goto("/expenses", { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "报销单", exact: true }).waitFor();
    return ledger();
  }
  let before = await load();
  atomicPair = ["n1", "n0"];
  await selectNames(["新材料甲", "零金额核对"]);
  assert.equal(await modal().getByLabel("收款人", { exact: true }).isVisible(), false, "待收款可先不填收款资料");
  await save();
  const pending = await persisted((data) => data.expenses.find((e) => e.id === "n1")?.payoutId);
  const pendingRows = byIds(pending, ["n1", "n0"]);
  assert.ok(pendingRows.every((e) => e.payoutId === pendingRows[0].payoutId && e.status === "未报销" && !e.payoutDate && !e.forWhom && !e.payBank && !e.payCardNo));
  const blank = pendingRows.find((e) => e.id === "n0");
  assert.equal(blank.claimant, ""); assert.equal(blank.amount, 0); assert.equal(blank.qty, 2); assert.equal(blank.price, 50);
  unchanged(pending, before, ["a1", "a2", "b1", "b2", "n2"], "整理待收款不能影响其他批次");
  await openBatch(pendingRows[0].payoutId);
  await modal().getByRole("button", { name: "已收到报销款", exact: true }).click();
  await save(true);
  await modal().getByRole("alert").filter({ hasText: "请填写收款人" }).waitFor();
  assert.deepEqual(await ledger(), pending, "收款资料不完整不能登记已收款");
  await closeModal();
  report.push({ scenario: "minimal-pending-batch-needs-complete-details-before-marking-paid", passed: true });
  before = await load();
  atomicPair = ["n1", "n2"];
  await selectNames(["新材料甲", "新运费乙"]);
  assert.equal(await modal().getByLabel("开户行", { exact: true }).inputValue(), "", "新批不能继承最后一次银行");
  assert.equal(await modal().getByLabel("收款账户", { exact: true }).inputValue(), "", "新批不能继承最后一次账号");
  await fillAccount(); await save();
  let current = await persisted((data) => data.expenses.find((e) => e.id === "n1")?.payoutId, "新批未保存");
  const firstId = current.expenses.find((e) => e.id === "n1").payoutId;
  assert.ok(firstId && !["old-a", "old-b"].includes(firstId));
  assert.equal(current.expenses.find((e) => e.id === "n2").payoutId, firstId);
  assert.deepEqual(byIds(current, ["n1", "n2"]).map((e) => e.claimant), ["报销甲", "报销乙"], "合批不能把原报销人都改成同一人");
  assert.ok(byIds(current, ["n1", "n2"]).every((e) => e.status === "未报销" && !e.payoutDate));
  unchanged(current, before, ["a1", "a2", "b1", "b2"], "新建不得吞并其他旧批");
  before = current; atomicPair = null;
  await selectNames(["零金额核对"]);
  assert.equal(await modal().getByLabel("开户行", { exact: true }).inputValue(), "");
  assert.equal(await modal().getByLabel("收款账户", { exact: true }).inputValue(), "");
  await fillAccount({ payee: "现金收款丙", method: "现金", paid: true, claimant: "补填报销丙" }); await save(true);
  current = await persisted((data) => data.expenses.find((e) => e.id === "n0")?.status === "已报销");
  const zero = current.expenses.find((e) => e.id === "n0");
  assert.ok(zero.payoutId && ![firstId, "old-a", "old-b"].includes(zero.payoutId));
  assert.equal(zero.amount, 0); assert.equal(zero.qty, 2); assert.equal(zero.price, 50); assert.equal(zero.claimant, "补填报销丙");
  assert.equal(zero.payoutDate, "2026-11-20");
  unchanged(current, before, ["a1", "a2", "b1", "b2", "n1", "n2"], "第二次新建不能改写第一批及旧批");
  report.push({ scenario: "two-new-batches-keep-ids-accounts-claimants-and-zero-amount", passed: true });

  const zeroBefore = current;
  await openBatch(zero.payoutId); await modal().getByRole("button", { name: "解除本批合并", exact: true }).click();
  current = await persisted((data) => !data.expenses.find((e) => e.id === "n0")?.payoutId);
  assert.deepEqual(current.expenses.find((e) => e.id === "n0"), { ...zero, payoutId: "", payoutFileName: "" }, "解除只改关联，零金额和收款状态不能改变");
  await page.getByRole("button", { name: "撤销上次批次操作", exact: true }).click();
  current = await persisted((data) => data.expenses.find((e) => e.id === "n0")?.payoutId === zero.payoutId);
  assert.deepEqual(current.expenses, zeroBefore.expenses, "本次撤销必须完整恢复原快照");
  report.push({ scenario: "dissolve-zero-amount-batch-and-exact-undo", passed: true });

  before = current;
  await selectNames(["旧批甲材料"]);
  const members = modal().getByTestId("expense-payout-members");
  assert.equal(await members.locator('[data-expense-id="a1"]').count(), 1);
  assert.equal(await members.locator('[data-expense-id="a2"]').count(), 1, "只选旧批一笔也必须打开整批");
  await modal().getByRole("button", { name: "解除本批合并", exact: true }).click();
  assert.ok(dialogs.at(-1).message.includes("2") && dialogs.at(-1).message.includes("300"), "整批解除确认须展示数量与金额");
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => !e.payoutId));
  for (const old of byIds(before, ["a1", "a2"])) assert.deepEqual(current.expenses.find((e) => e.id === old.id), { ...old, payoutId: "", payoutFileName: "" });
  unchanged(current, before, ["b1", "b2", "n1", "n2", "n0"]);
  await page.getByRole("button", { name: "撤销上次批次操作", exact: true }).click();
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.payoutId === "old-a"));
  assert.deepEqual(current.expenses, before.expenses);
  await openBatch("old-a"); await modal().getByRole("button", { name: "撤销本批收款", exact: true }).click();
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.status === "未报销" && !e.payoutId));
  for (const old of byIds(before, ["a1", "a2"])) assert.deepEqual(current.expenses.find((e) => e.id === old.id), { ...old, status: "未报销", payoutId: "", payoutFileName: "", payoutDate: "", reimbursedAt: "" });
  unchanged(current, before, ["b1", "b2", "n1", "n2", "n0"]);
  await page.getByRole("button", { name: "撤销上次批次操作", exact: true }).click();
  await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.payoutId === "old-a"));
  report.push({ scenario: "one-row-selection-opens-whole-batch-dissolve-and-reset-paid-are-distinct", passed: true });

  before = await load(); await openBatch("old-a");
  await modal().getByRole("button", { name: "待收款", exact: true }).click();
  const downgradeWrites = { ledger: ledgerWrites, doc: docWrites };
  dismissNextDialog = true; await save();
  assert.ok(dialogs.at(-1).message.includes("2") && dialogs.at(-1).message.includes("300") && dialogs.at(-1).message.includes("清除收款日期"));
  assert.ok(await modal().isVisible(), "取消退回待收款应保留窗口");
  assert.deepEqual({ ledger: ledgerWrites, doc: docWrites }, downgradeWrites, "取消确认不能先上传或写入");
  assert.deepEqual((await ledger()).expenses, before.expenses, "取消退回待收款不得改变已收款记录");
  await save();
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.payoutId === "old-a" && e.status === "未报销" && !e.payoutDate && !e.reimbursedAt));
  unchanged(current, before, ["b1", "b2", "n1", "n2", "n0"]);
  await page.getByRole("button", { name: "撤销上次批次操作", exact: true }).click();
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.status === "已报销"));
  assert.deepEqual(current.expenses, before.expenses);
  report.push({ scenario: "paid-to-pending-confirm-cancel-preserves-data-and-accept-clears-date-with-undo", passed: true });

  before = await load(); atomicPair = ["n1", "n2"];
  await selectNames(["新材料甲", "新运费乙"]); await fillAccount({ paid: true });
  const writesBeforeStage = { ledger: ledgerWrites, doc: docWrites };
  await modal().getByLabel("选择收款凭证", { exact: true }).setInputFiles({ name: "合成收款回单.png", mimeType: "image/png", buffer: receipt });
  await page.waitForTimeout(250);
  assert.deepEqual({ ledger: ledgerWrites, doc: docWrites }, writesBeforeStage, "选文件仅暂存，不应提前上传或保存");
  const failUpload = async (route) => route.request().method() === "PUT" ? route.fulfill({ status: 503, body: "合成上传失败" }) : route.continue();
  await page.route("**/api/doc", failUpload); await save(true);
  await page.getByText(/文件上传失败|上传失败|503/).first().waitFor();
  assert.ok(await modal().isVisible(), "上传失败保留表单");
  assert.ok((await modal().innerText()).includes("合成收款回单.png"), "上传失败保留选中的文件");
  assert.equal(await modal().getByLabel("收款人", { exact: true }).inputValue(), "收款新甲");
  assert.deepEqual((await ledger()).expenses, before.expenses, "上传失败不得产生半批或提前改变收款状态");
  await page.unroute("**/api/doc", failUpload); await save(true);
  current = await persisted((data) => byIds(data, ["n1", "n2"]).every((e) => e.status === "已报销" && e.payoutFileName));
  assert.equal(current.expenses.find((e) => e.id === "n1").payoutId, current.expenses.find((e) => e.id === "n2").payoutId);
  unchanged(current, before, ["a1", "a2", "b1", "b2", "n0"]); atomicPair = null;
  report.push({ scenario: "file-staging-failure-keeps-draft-and-retry-saves-whole-batch", passed: true });

  before = await load();
  const originalUpload = await ctx.request.put("/api/doc", { multipart: { id: "old-a", kind: "payout", file: { name: oldA.payoutFileName, mimeType: "image/png", buffer: receipt } } });
  assert.equal(originalUpload.status(), 200);
  const oldFile = await ctx.request.get("/api/doc?id=old-a&kind=payout"); assert.equal(oldFile.status(), 200);
  const oldBytes = await oldFile.body();
  await openBatch("old-a");
  await modal().getByLabel("选择收款凭证", { exact: true }).setInputFiles({ name: "合成替换回单.png", mimeType: "image/png", buffer: receipt });
  await save(true);
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.payoutId && e.payoutId !== "old-a"));
  const replacement = current.expenses.find((e) => e.id === "a1").payoutId;
  assert.equal(current.expenses.find((e) => e.id === "a2").payoutId, replacement);
  assert.deepEqual(await (await ctx.request.get("/api/doc?id=old-a&kind=payout")).body(), oldBytes, "新回单不得先覆盖撤销所需旧文件");
  await page.getByRole("button", { name: "撤销上次批次操作", exact: true }).click();
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.payoutId === "old-a"));
  assert.deepEqual(current.expenses, before.expenses);
  assert.deepEqual(await (await ctx.request.get("/api/doc?id=old-a&kind=payout")).body(), oldBytes);
  report.push({ scenario: "replace-receipt-moves-whole-batch-and-undo-keeps-old-file", passed: true });

  const mixed = { ...fixture, expenses: rows.map((row) => row.id === "a2" ? { ...row, status: "未报销", payoutDate: "", reimbursedAt: "" } : row) };
  before = await load(mixed); await openBatch("old-a");
  assert.ok((await modal().innerText()).includes("状态不一致"));
  const mixedSave = modal().getByRole("button", { name: /保存待收款批次|确认收款并保存/ });
  assert.ok(await mixedSave.isDisabled(), "混合状态不能未确认就改写原收款状态");
  assert.deepEqual((await ledger()).expenses, before.expenses);
  await modal().getByRole("button", { name: "已收到报销款", exact: true }).click();
  await modal().getByLabel("收款日期", { exact: true }).fill("2026-11-20");
  await save(true);
  current = await persisted((data) => byIds(data, ["a1", "a2"]).every((e) => e.status === "已报销" && e.payoutDate === "2026-11-20"));
  unchanged(current, before, ["b1", "b2", "n1", "n2", "n0"]);
  report.push({ scenario: "mixed-status-requires-explicit-target", passed: true });

  // 单条购买凭证上传在等待时锁住费用，重复 change 也不能再次上传旧快照。
  before = await load();
  await details();
  await page.getByRole("row").filter({ has: page.getByRole("checkbox", { name: "选择 零金额核对", exact: true }) }).getByRole("button", { name: "编辑", exact: true }).click();
  const expenseEditor = page.locator("#expense-editor");
  const amount = expenseEditor.getByLabel("金额", { exact: true });
  const voucherInput = expenseEditor.locator('input[type="file"]');
  const purchaseGate = await holdDoc({ passthrough: true });
  const purchaseRequests = docWrites;
  await voucherInput.setInputFiles({ name: "合成慢速购买凭证.png", mimeType: "image/png", buffer: receipt });
  await purchaseGate.requested;
  assert.ok(await amount.isDisabled(), "上传购买凭证时金额必须锁定");
  for (const label of ["保存报销信息", "关闭", "删除"]) {
    const controls = await expenseEditor.getByRole("button", { name: label, exact: true }).all();
    assert.ok(controls.length, `${label} 控件必须存在`);
    for (const control of controls) assert.ok(await control.isDisabled(), `上传期间所有 ${label} 必须禁用`);
  }
  assert.ok(await voucherInput.isDisabled(), "上传中不能再次选择购买凭证");
  await page.keyboard.press("Escape"); assert.ok(await expenseEditor.isVisible(), "上传中不能用Esc关闭费用编辑器");
  // 覆盖在禁用状态发布前已排队的重复事件；这里只模拟选择，不直接调用业务上传函数。
  await voucherInput.evaluate((input, contents) => {
    const files = new DataTransfer();
    files.items.add(new File([Uint8Array.from(atob(contents), (char) => char.charCodeAt(0))], "合成重复购买凭证.png", { type: "image/png" }));
    input.files = files.files; input.dispatchEvent(new Event("change", { bubbles: true }));
  }, receipt.toString("base64"));
  await page.waitForTimeout(250);
  assert.equal(docWrites, purchaseRequests + 1, "同一购买凭证上传未完成时不得产生第二次请求");
  assert.equal(await amount.inputValue(), "0", "锁定期间保留合法零金额");
  await page.screenshot({ path: `${out}/purchase-upload-busy.png` });
  purchaseGate.release(); await purchaseGate.remove();
  current = await persisted((data) => data.expenses.find((e) => e.id === "n0")?.voucherFileName !== before.expenses.find((e) => e.id === "n0").voucherFileName, "慢速购买凭证未完成保存");
  const savedZero = current.expenses.find((e) => e.id === "n0");
  assert.equal(savedZero.amount, 0); assert.equal(savedZero.qty, 2); assert.equal(savedZero.price, 50);
  unchanged(current, before, ["a1", "a2", "b1", "b2", "n1", "n2"], "单条购买凭证不得覆盖其他费用");
  assert.ok(!(await amount.isDisabled()));
  for (const label of ["保存报销信息", "关闭", "删除"]) {
    const controls = await expenseEditor.getByRole("button", { name: label, exact: true }).all();
    assert.ok(controls.length, `${label} 控件必须存在`);
    for (const control of controls) assert.equal(await control.isDisabled(), false, `上传结束应恢复所有 ${label}`);
  }
  assert.equal(await amount.inputValue(), "0");
  await expenseEditor.getByRole("button", { name: "关闭", exact: true }).click();
  report.push({ scenario: "purchase-upload-locks-editing-and-duplicate-selection-until-complete", passed: true });

  before = await load(); await exposePull();
  await selectNames(["新材料甲", "新运费乙"]); await fillAccount({ paid: true });
  await modal().getByLabel("选择收款凭证", { exact: true }).setInputFiles({ name: "合成迟到回单.png", mimeType: "image/png", buffer: receipt });
  let held = await holdDoc(); await save(true); await held.requested;
  const removed = { ...before, expenses: before.expenses.filter((row) => row.id !== "n1") };
  await put(removed); await page.evaluate(() => window.__expensePayoutPull({ discardLocal: true }));
  const afterRefreshWrites = ledgerWrites;
  held.release(); await held.remove(); await page.waitForTimeout(350);
  assert.equal(ledgerWrites, afterRefreshWrites, "迟到上传不得把刷新前单据写回");
  assert.deepEqual((await ledger()).expenses, removed.expenses, "已删单据不得被旧批次操作复活");
  report.push({ scenario: "late-upload-after-refresh-and-delete-does-not-resurrect-expenses", passed: true });

  await page.goto("about:blank");
  const newBook = (await authOp("createBook", { name: `合成报销批次隔离-${Date.now()}` })).bookId;
  await authOp("useBook", { id: baseBook }); await load();
  await selectNames(["新材料甲", "新运费乙"]); await fillAccount({ paid: true });
  await modal().getByLabel("选择收款凭证", { exact: true }).setInputFiles({ name: "合成切册回单.png", mimeType: "image/png", buffer: receipt });
  held = await holdDoc(); await save(true); await held.requested;
  await page.getByLabel("当前台账", { exact: true }).first().selectOption(newBook, { force: true });
  await page.waitForFunction((id) => document.querySelector('select[aria-label="当前台账"]')?.value === id, newBook);
  const switched = await persisted((data) => !(data.expenses || []).length);
  held.release(); await held.remove(); await page.waitForTimeout(350);
  assert.deepEqual((await ledger()).expenses, switched.expenses, "切册后迟到结果不能把前册报销写入空册");
  await page.goto("about:blank"); await authOp("useBook", { id: baseBook });
  assert.deepEqual((await ledger()).expenses, fixture.expenses, "旧册未完成的批次不得提前保存");
  report.push({ scenario: "late-upload-after-book-switch-does-not-cross-ledgers", passed: true });

  for (const width of [1440, 375, 390]) {
    await page.setViewportSize({ width, height: 900 }); await load();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}px 页面横向溢出`);
    await buttonCount("全选待收款", 3).click();
    await page.screenshot({ path: `${out}/selection-${width}.png` });
    await buttonCount("办理所选", 3).click(); await fillAccount({ claimant: "补填报销丙" });
    assert.ok(clean(await modal().getByTestId("expense-payout-total").innerText()).includes("30.30"));
    const bounds = await modal().boundingBox(); assert.ok(bounds && bounds.y >= -1 && bounds.y + bounds.height <= 901, `${width}px 弹窗应在可视高度内`);
    const submit = modal().getByRole("button", { name: "保存待收款批次", exact: true }); await submit.scrollIntoViewIfNeeded();
    const button = await submit.boundingBox(); assert.ok(button && button.y >= 0 && button.y + button.height <= 901, `${width}px 保存按钮可达`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}px 弹窗横向溢出`);
    await page.screenshot({ path: `${out}/modal-${width}.png` }); await closeModal();
    await batches(); await page.locator('[data-payout-id="old-a"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/batches-${width}.png` });
  }
  report.push({ scenario: "selection-modal-and-batch-list-at-1440-375-390", passed: true });

  await page.setViewportSize({ width: 1440, height: 1000 }); before = await load();
  const username = `expense-readonly-${Date.now()}`;
  await authOp("createUser", { username, password: "12345678", perms: "people.view expenses.view" });
  const readonly = await browser.newContext({ baseURL, viewport: { width: 375, height: 900 } });
  assert.equal((await readonly.request.post("/api/auth", { data: { op: "login", username, password: "12345678" } })).status(), 200);
  const readPage = await readonly.newPage(); let readonlyWrites = 0;
  readPage.on("pageerror", (error) => errors.push(error.message));
  readPage.on("request", (request) => { if (["PUT", "POST", "DELETE"].includes(request.method()) && /\/api\/(ledger|doc)(\?|$)/.test(request.url())) readonlyWrites++; });
  await readPage.goto("/expenses", { waitUntil: "networkidle" });
  const register = readPage.getByRole("button", { name: "登记收款", exact: true });
  assert.ok(await register.count() === 0 || await register.isDisabled(), "只读不能登记收款");
  await readPage.getByRole("button", { name: "收款批次", exact: true }).click();
  await readPage.locator('[data-payout-id="old-a"]').getByRole("button", { name: "查看批次", exact: true }).click();
  const readModal = readPage.getByRole("dialog", { name: "登记报销收款", exact: true });
  assert.ok((await readModal.innerText()).includes("旧批甲材料") && (await readModal.innerText()).includes("旧批甲运费"));
  for (const label of ["保存待收款批次", "确认收款并保存", "解除本批合并", "撤销本批收款"]) {
    const action = readModal.getByRole("button", { name: label, exact: true });
    assert.ok(await action.count() === 0 || await action.isDisabled(), `只读不能执行 ${label}`);
  }
  const fileInput = readModal.getByLabel("选择收款凭证", { exact: true });
  assert.ok(await fileInput.count() === 0 || await fileInput.isDisabled(), "只读不能上传凭证");
  assert.equal(readonlyWrites, 0);
  assert.equal((await readonly.request.put("/api/ledger", { data: before })).status(), 403);
  await readPage.screenshot({ path: `${out}/readonly-375.png` }); await readonly.close();
  report.push({ scenario: "readonly-can-view-whole-batch-but-cannot-write", passed: true });

  assert.deepEqual(halfBatches, [], "任何提交都不得发送半批关系或收款状态");
  assert.deepEqual(routeFailures, [], "路由回调不能有未处理的上传异常");
  assert.equal(docDeletes, 0, "解除/撤销不应删除旧凭证文件");
  assert.deepEqual(errors, [], "浏览器运行时不能有未处理异常");
  await writeFile(`${out}/result.json`, JSON.stringify({ scenarios: report, screenWidths: [1440, 375, 390], runtimeErrors: errors.length, halfBatches: halfBatches.length, docDeletes }, null, 2));
  console.log(JSON.stringify({ scenarios: report, screenWidths: [1440, 375, 390], runtimeErrors: errors.length, halfBatches: halfBatches.length, docDeletes }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true }).catch(() => {});
  await writeFile(`${out}/failure.txt`, [String(error.stack || error), routeFailures.length ? `路由回调异常：\n${routeFailures.join("\n")}` : ""].filter(Boolean).join("\n\n"));
  throw error;
} finally { await browser.close(); }
