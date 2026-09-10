/**
 * 账户库自保与审计并发测试（D2 坏库不当空库 / D3 写队列）。
 *
 * 背景：readFileShape 原来把「解析失败」当成「还没有账户」，
 * 于是前端会显示「创建管理员」，一点就把损坏但可能可恢复的 accounts.json 覆盖成单账号——
 * owner 和所有凭据一起丢。这是整条数据红线里最危险的一条。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = await mkdtemp(join(tmpdir(), "gongdi-accounts-test-"));
process.env.DATA_DIR = root;

const A = await import("../src/lib/accounts.server");
const F = await import("../src/lib/nas-fs.server");

const accountsDir = join(root, "accounts");
const accountsFile = join(accountsDir, "accounts.json");

async function writeAccounts(value: unknown): Promise<void> {
  await mkdir(accountsDir, { recursive: true });
  await writeFile(accountsFile, typeof value === "string" ? value : JSON.stringify(value, null, 2), "utf8");
}

test("坏账户库：判为 unreadable，不补 tokenSalt、不写盘、不进入初始化", async () => {
  const broken = "{ 这不是合法 JSON";
  await writeAccounts(broken);

  const data = await A.ensureAccounts();
  assert.equal(A.accountsUnreadable(), true);
  assert.deepEqual(data.users, []);
  assert.equal(await readFile(accountsFile, "utf8"), broken, "坏库必须原样保留，不能被空结构覆盖");
});

test("坏账户库：setup 被拒绝（否则会把真库覆盖成单账号）", async () => {
  const broken = "{ 这不是合法 JSON";
  await writeAccounts(broken);

  const req = new Request("http://local/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "setup", username: "admin", password: "12345678", name: "管理员" }),
  });
  const res = await A.handleAuthPost(req);
  assert.equal(res.status, 503);
  assert.match(String((await res.json()).error), /账户/);
  assert.equal(await readFile(accountsFile, "utf8"), broken, "被拒绝的 setup 不能写盘");
});

test("账户库修好后恢复正常（能读到账号，broken 复位）", async () => {
  await writeAccounts({ users: [{ id: "u1", username: "admin", name: "管理员", role: "admin", hash: "scrypt$1$2$3$aa$bb", tokenSalt: "t1" }], books: [{ id: "default", name: "默认台账", ownerId: "u1", members: [{ userId: "u1", perms: ["*"] }] }] });
  const data = await A.ensureAccounts();
  assert.equal(A.accountsUnreadable(), false);
  assert.equal(data.users.length, 1);
  assert.equal(data.users[0].username, "admin");
});

test("完全没有 accounts.json ≠ 损坏（全新安装仍应进入初始化）", async () => {
  const prev = process.env.DATA_DIR;
  process.env.DATA_DIR = await mkdtemp(join(tmpdir(), "gongzi-fresh-"));
  try {
    await A.ensureAccounts();
    assert.equal(A.accountsUnreadable(), false);
  } finally {
    process.env.DATA_DIR = prev;
  }
});

test("D3：审计并发写入不丢条目（读—改—写必须排队）", async () => {
  await F.writeAudit([]);
  await Promise.all(Array.from({ length: 25 }, (_, i) => F.appendAudit({ action: `动作${i}`, module: "测试" })));
  const list = await F.readAudit();
  assert.equal(list.length, 25, "并发 appendAudit 不能丢记录");
  assert.equal(new Set(list.map((e) => e.action)).size, 25, "25 条应各不相同");
});

test("操作记录：旧版本放在 data/audit.json 的记录仍能看到，并在下次写入时并入", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gongdi-audit-legacy-"));
  const prev = process.env.DATA_DIR;
  process.env.DATA_DIR = dir;
  try {
    // 旧位置：根目录 audit.json（数组格式），本台账还没有 audit.json
    await writeFile(
      join(dir, "audit.json"),
      JSON.stringify([{ id: "old1", at: "2026-01-01T00:00:00.000Z", userId: "u", userName: "管理员", action: "登录", detail: "", module: "账户" }]),
      "utf8",
    );
    const rows = await F.readAudit();
    assert.equal(rows.length, 1, "旧位置的记录必须还能看到（否则用户会以为记录丢了）");
    assert.equal(rows[0].id, "old1");

    // 追加一条：旧记录应被并入本台账文件，之后不再依赖回落
    await F.appendAudit({ action: "新增人员", module: "人员" });
    const after = await F.readAudit();
    assert.equal(after.length, 2);
    assert.equal(after.some((e) => e.id === "old1"), true, "旧记录要一并保留");
  } finally {
    process.env.DATA_DIR = prev;
  }
});
