/**
 * 「考勤未保存」拦截的真实浏览器复核（F1 / A12，**开发用脚本，不参与构建、不引依赖**）。
 *
 * 为什么要有它：这条问题的现场就是「手指在手机上点了一下底部导航，输入的那一列数静默没了」。
 * 静态守卫只能证明「接线在」，证明不了「点了真的会弹、弹了选继续编辑真的留在原页」——
 * 那需要真浏览器 + 真路由 + 真 dialog。所以照 `ci/mobile-print-check.mjs` 的做法写一个脚本，
 * 用本机已有的 Chrome 与 playwright-core 跑，**不写进 `pnpm test`**（那边只跑零依赖静态守卫）。
 *
 * 用法（在仓库根目录）：
 *   # 1) 起一个跑**当前源码**的服务（dev 或新构建，别用仓库里过期的 app/）
 *   #    DATA_DIR=/tmp/gongdi-f1 PORT=4601 pnpm dev     # vite dev 会读 DATA_DIR
 *   #    或：DATA_DIR=/tmp/gongdi-f1 PORT=4601 node app/server/index.mjs   （刚 build 过才用）
 *   # 2) 跑检查（390×844 手机尺寸）
 *   DATA_DIR=/tmp/gongdi-f1 PORT=4601 node ci/unsaved-guard-check.mjs
 *
 * 检查内容（任一不通过 → 退出码 1）：
 *   ① 打开 2026 年 1 月月表、填一个出勤数 → 点底部导航「总览」：**必须弹确认**；
 *   ② 选「继续编辑」（取消）：留在原页，刚填的数字还在；
 *   ③ 选「丢弃并离开」（确定）：才真的跳到总览；
 *   ④ 附加：刷新页面（beforeunload）也要被拦。
 * 环境变量：`PORT`（默认 4601）、`BASE`、`DATA_DIR`（seed 要用）、
 *           `E2E_CHROME`、`PLAYWRIGHT_CORE`（默认找几个常见位置）。
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PORT = Number(process.env.PORT || 4601);
const BASE = process.env.BASE || `http://127.0.0.1:${PORT}`;
const DATA_DIR = process.env.DATA_DIR;
const CHROME =
  process.env.E2E_CHROME ||
  ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => existsSync(p)) ||
  "google-chrome";
const PW =
  process.env.PLAYWRIGHT_CORE ||
  ["/Users/wsir/.dsh/profiles/web/node_modules/playwright-core/index.js", join(process.cwd(), "node_modules/playwright-core/index.js")].find((p) => existsSync(p)) ||
  "playwright-core";

const ADMIN = { username: "admin", password: "12345678" };
const YEAR = 2026;

function person(id, name, team, dailyWage) {
  return {
    id,
    name,
    team,
    personNo: id,
    idCard: "110101199001010011",
    gender: "男",
    age: 35,
    birthday: "1990-01-01",
    phone: "",
    dailyWage,
    monthWage: 0,
    payType: "day",
    otRule: "平时1.5倍/周末2倍",
    mealAllowance: 0,
    wageHistory: [],
    bank: "",
    cardNo: "",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
  };
}

const ledger = {
  schemaVersion: 2,
  year: YEAR,
  years: [YEAR],
  people: [person("p1", "张三", "一班", 300), person("p2", "李四", "一班", 320)],
  attendance: [
    { id: "a1", year: YEAR, month: 1, name: "张三", team: "一班", days: 5, otHours: 0, allowance: 0, deduction: 0, remark: "" },
  ],
  attendanceDocs: [],
  payments: [],
  contracts: [],
  contractEntries: [],
  expenses: [],
  insurancePolicies: [],
  insuranceMembers: [],
  accessHash: "",
  uiStyle: "classic",
};

/** 建管理员（幂等）+ 写一份最小台账，避免跑到生产数据目录 */
async function seed() {
  if (!DATA_DIR) throw new Error("seed 需要 DATA_DIR（指向临时目录，别指 data/）");
  const dir = join(DATA_DIR, "books", "default");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "ledger.json"), JSON.stringify(ledger, null, 2), "utf8");
  console.log(`已写入 ${join(dir, "ledger.json")}：${ledger.people.length} 人 / ${ledger.attendance.length} 条考勤`);
}

async function ensureAdmin() {
  for (const op of ["setup", "login"]) {
    const res = await fetch(`${BASE}/api/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op, ...ADMIN }),
    });
    const body = await res.json();
    if (body.token) return body;
  }
  throw new Error("建管理员 / 登录都失败了，请检查服务是否用了同一个 DATA_DIR");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await ensureAdmin().catch(() => null);
  if (DATA_DIR) await seed();

  const mod = await import(PW);
  const chromium = mod.chromium || mod.default?.chromium;
  const auth = await ensureAdmin();
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addCookies([
    { name: "gongdi_u", value: ADMIN.username, domain: "127.0.0.1", path: "/" },
    { name: "gongdi_t", value: auth.token, domain: "127.0.0.1", path: "/" },
    { name: "gongdi_b", value: auth.bookId || "default", domain: "127.0.0.1", path: "/" },
  ]);
  const page = await ctx.newPage();
  const failed = [];
  const ok = (m) => console.log(`  ✔ ${m}`);
  const bad = (m) => {
    console.log(`  ✖ ${m}`);
    failed.push(m);
  };

  async function openDirtyMonth() {
    await page.goto(`${BASE}/attendance`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /1月/ }).first().click();
    const days = page.locator('input[type="number"]').first();
    await days.waitFor({ state: "visible", timeout: 8000 });
    await days.fill("15");
    return days;
  }

  /**
   * 点一下会弹 window.confirm 的东西：**必须先挂 dialog 处理**再点，
   * 否则浏览器在确认框上阻塞渲染，click 永远不返回（超时误报成「没弹」）。
   */
  async function clickWithDialog(locator, decision) {
    let seen = null;
    const onDialog = async (d) => {
      seen = d;
      try {
        await (decision === "accept" ? d.accept() : d.dismiss());
      } catch {}
    };
    page.once("dialog", onDialog);
    await locator.click({ timeout: 8000 }).catch(() => null);
    await sleep(500);
    return seen;
  }

  console.log("F1 手机端未保存拦截：底部导航（390×844）");
  const days = await openDirtyMonth();
  const navHome = page.locator('nav.fixed a[href="/"]').last();
  {
    const dialog = await clickWithDialog(navHome, "dismiss"); // 继续编辑
    if (!dialog) bad("点底部导航「总览」没有弹确认（未保存的改动会被静默丢掉）");
    else {
      ok(`点底部导航弹出了 ${dialog.type()} 确认：${dialog.message().split("\n")[0]}`);
      if (/\/attendance/.test(page.url())) ok("选「继续编辑」留在考勤页");
      else bad(`选「继续编辑」却离开了（现在在 ${page.url()}）`);
      if ((await days.inputValue()) === "15") ok("刚填的出勤天数还在（没被静默丢掉）");
      else bad("离开后填的数字丢了");
    }
  }

  console.log("F1 手机端未保存拦截：选「丢弃并离开」才跳走");
  {
    const dialog = await clickWithDialog(navHome, "accept"); // 丢弃并离开
    if (!dialog) bad("第二次点「总览」没有弹确认");
    else {
      await page.waitForURL((u) => !/\/attendance/.test(u.pathname), { timeout: 8000 }).catch(() => null);
      if (!/\/attendance/.test(page.url())) ok(`选「丢弃并离开」后跳走了（${new URL(page.url()).pathname}）`);
      else bad("选「丢弃并离开」之后还被留在考勤页");
    }
  }

  console.log("F1 附加：浏览器返回");
  {
    // 先经**页内导航**（底部导航）进考勤，才有一段 SPA 历史可回退 ——
    // 直接用 page.goto 打开时，返回是「换文档」，那是 beforeunload 的活（headless 下浏览器自己放行）。
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.locator('nav.fixed a[href="/attendance"]').last().click();
    await page.waitForURL(/attendance/, { timeout: 8000 }).catch(() => null);
    await page.getByRole("button", { name: /1月/ }).first().click();
    const dirtyDays = page.locator('input[type="number"]').first();
    await dirtyDays.waitFor({ state: "visible", timeout: 8000 });
    await dirtyDays.click();
    await dirtyDays.fill("15");
    await sleep(500);
    const d = await (async () => {
      let seen = null;
      page.once("dialog", async (x) => {
        seen = x;
        try {
          await x.dismiss(); // 继续编辑
        } catch {}
      });
      await page.goBack({ timeout: 8000 }).catch(() => null);
      await sleep(700);
      return seen;
    })();
    if (!d) bad("按浏览器返回没有弹确认（整月输入会被静默丢掉）");
    else {
      ok(`浏览器返回弹出了 ${d.type()} 确认`);
      if (/\/attendance/.test(page.url())) ok("选「继续编辑」后仍在考勤页");
      else bad(`选「继续编辑」却离开了（${page.url()}）`);
      if ((await dirtyDays.inputValue()) === "15") ok("返回被拦后填的数字还在");
    }
  }

  console.log("F1 附加：刷新 / 关标签（beforeunload）");
  {
    // 真实 reload 时 Chrome 对 beforeunload 弹窗有「必须先有用户手势」的策略，
    // headless 下常常直接放行（看不到对话框不代表没接线）。所以这里换一种**确定性的查法**：
    // 派发一个可取消的 beforeunload 事件，看有没有人 preventDefault（= 注册了拦截）。
    const probeBeforeUnload = () =>
      page.evaluate(() => {
        const e = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(e);
        return e.defaultPrevented;
      });
    await page.goto(`${BASE}/attendance`, { waitUntil: "networkidle" });
    const clean = await probeBeforeUnload();
    if (clean) bad("没有未保存改动时也拦刷新（不该拦）");
    else ok("没有未保存改动时不拦刷新");
    await openDirtyMonth();
    await sleep(600); // 等 React 把 dirty 冒上来并登记（fill → onChange → effect → armUnsaved）
    const dirtyBlocked = await probeBeforeUnload();
    if (dirtyBlocked) ok("有未保存改动时 beforeunload 被拦（刷新 / 关标签会问一句）");
    else bad("有未保存改动时刷新不被拦（F5 会静默丢掉整月输入）");
  }

  await browser.close();
  console.log(failed.length ? `\n=== 未通过 ${failed.length} 项 ===` : "\n=== 全部通过 ===");
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("脚本出错：", e.message);
  process.exit(1);
});
