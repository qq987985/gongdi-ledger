/**
 * A3（专家评审 20260917）：台账里的 `accessHash` 不能再当管理员凭据。
 *
 * 复现的缺陷：`adminFromOldLedger()` 直接
 *   `return { id: "admin", username: "admin", hash: raw.accessHash, role: "admin" };`
 * 而 `accessHash` = `sha256("gongdi-ledger::" + 开机口令)`，且 `verifyStoredHash` 的旧分支
 * 正是拿这个公式比对 —— 于是**任何能读到 ledger.json 的人**（people.view 就能读）都能用
 * 「台账里的那一串」直接登录成管理员（CWE-916/759/522）。
 *
 * 现在：① 写入时丢弃、读视图也不再返回该字段；② 首启不再由它建管理员（改为前端「创建管理员」）；
 * ③ 旧 hash 的**兼容登录**保留（已是旧 hash 的账号照常登录，成功后静默升级为加盐 scrypt）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";

const root = await mkdtemp(join(tmpdir(), "gongdi-legacy-accesshash-"));
process.env.DATA_DIR = root;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("~/")) {
      const base = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try {
          return nextResolve(base + ext, context);
        } catch {}
      }
    }
    return nextResolve(specifier, context);
  },
});

const A = await import("../src/lib/accounts.server");
const LEDGER = await import("../src/routes/api/ledger");

type Handler = (ctx: { request: Request }) => Promise<Response>;
const handlers = LEDGER.Route.options.server!.handlers as unknown as { GET: Handler; PUT: Handler };

const OLD_PASSWORD = "laokouling888";
const legacyHash = createHash("sha256").update(`gongdi-ledger::${OLD_PASSWORD}`).digest("hex");

const bookDir = join(root, "books", "default");
const ledgerFile = join(bookDir, "ledger.json");
await mkdir(bookDir, { recursive: true });
await writeFile(
  ledgerFile,
  JSON.stringify(
    {
      schemaVersion: 2,
      year: 2026,
      years: [2026],
      people: [{ id: "p1", name: "张三" }],
      attendance: [],
      payments: [],
      // 老版本留下的「开机口令」hash —— 也是这次要拔掉的凭据链
      accessHash: legacyHash,
    },
    null,
    2,
  ),
  "utf8",
);

async function authPost(body: Record<string, unknown>, cookie = ""): Promise<Response> {
  return A.handleAuthPost(
    new Request("http://local/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
}

async function cookieOf(res: Response): Promise<string> {
  return (res.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

test("A3：首启不再由台账 accessHash 造管理员（accounts 里不得出现能用该口令登录的账号）", async () => {
  const t = await A.resolveTenant(new Request("http://local/api/auth"));
  assert.equal(t.needSetup, true, "没有账号时进「创建管理员」流程");
  assert.equal(t.user, null);

  const accountsFile = join(root, "accounts", "accounts.json");
  const users = existsSync(accountsFile)
    ? ((JSON.parse(await readFile(accountsFile, "utf8")) as { users?: { username: string; hash: string }[] }).users ?? [])
    : [];
  assert.deepEqual(users, [], "不允许凭空出现管理员账号");
});

test("A3：拿「台账里的那一串」当密码登录 → 401（该口令不再具备凭据效力）", async () => {
  const r = await authPost({ op: "login", username: "admin", password: OLD_PASSWORD });
  assert.equal(r.status, 401, "旧 accessHash 不能当登录口令");
});

test("A3：读视图不再返回 accessHash（people.view 读不到凭据）", async () => {
  const setup = await authPost({ op: "setup", username: "admin", password: "12345678", name: "管理员" });
  assert.equal(setup.status, 200, "前置：显式创建管理员");
  const cookie = await cookieOf(setup);

  const get = await handlers.GET({ request: new Request("http://local/api/ledger", { headers: { cookie } }) });
  assert.equal(get.status, 200);
  const j = (await get.json()) as Record<string, unknown>;
  assert.equal("accessHash" in j, false, "读视图里不许出现 accessHash（老文件还在，但不再外发）");
  assert.deepEqual((j.people as { name: string }[])[0]?.name, "张三", "其余数据不受影响");
});

test("A3：写盘后文件里不再有 accessHash（老客户端带着它发也不落盘、也不 400）", async () => {
  const setup = await authPost({ op: "login", username: "admin", password: "12345678" });
  assert.equal(setup.status, 200);
  const cookie = await cookieOf(setup);

  const before = await handlers.GET({ request: new Request("http://local/api/ledger", { headers: { cookie } }) });
  assert.equal(before.status, 200);
  const rev = before.headers.get("x-ledger-revision") || "";
  await before.arrayBuffer();

  const put = await handlers.PUT({
    request: new Request("http://local/api/ledger", {
      method: "PUT",
      headers: { cookie, "content-type": "application/json", "if-match": rev },
      body: JSON.stringify({
        year: 2026,
        years: [2026],
        people: [{ id: "p1", name: "张三" }],
        attendance: [],
        payments: [],
        // 老客户端 / 老缓存里的 sliceState 会带着这个字段：必须放行（不 400），但写盘时丢弃
        accessHash: legacyHash,
      }),
    }),
  });
  assert.equal(put.status, 200, "老客户端多发一个字段不该让保存失败");

  const onDisk = JSON.parse(await readFile(ledgerFile, "utf8")) as Record<string, unknown>;
  assert.equal("accessHash" in onDisk, false, "写盘后台账里不许再留 accessHash");
  assert.equal((await readFile(ledgerFile, "utf8")).includes(legacyHash), false, "连值都不能留在文件里");
});

test("A3：结构校验仍然放行带 accessHash 的老 payload（向后兼容，不 400）", async () => {
  const { validateLedgerPayload } = await import("../src/lib/ledger-schema.server");
  const bad = validateLedgerPayload({
    schemaVersion: 2,
    year: 2026,
    people: [],
    attendance: [],
    payments: [],
    accessHash: legacyHash,
  });
  assert.equal(bad, null, "老客户端多发字段必须能存（丢弃由写盘层负责）");
});

test("A3：已是旧 hash 的账号仍能登录（兼容路径保留），且登录后静默升级为加盐 hash", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gongdi-legacy-account-"));
  const prev = process.env.DATA_DIR;
  process.env.DATA_DIR = dir;
  try {
    const accountsDir = join(dir, "accounts");
    await mkdir(accountsDir, { recursive: true });
    await writeFile(
      join(accountsDir, "accounts.json"),
      JSON.stringify({
        users: [{ id: "u1", username: "admin", name: "管理员", role: "admin", hash: legacyHash, tokenSalt: "t1" }],
        books: [{ id: "default", name: "默认台账", ownerId: "u1", members: [{ userId: "u1", perms: ["*"] }] }],
      }),
      "utf8",
    );

    const login = await authPost({ op: "login", username: "admin", password: OLD_PASSWORD });
    assert.equal(login.status, 200, "老账号（旧 hash）必须还能登录 —— 否则老用户被锁在门外");

    const users = (
      JSON.parse(await readFile(join(accountsDir, "accounts.json"), "utf8")) as { users: { hash: string }[] }
    ).users;
    assert.match(users[0].hash, /^scrypt\$/, "登录成功后要静默升级成加盐 scrypt");
  } finally {
    process.env.DATA_DIR = prev;
  }
});
