/**
 * 权限声明表一致性测试（C1）。
 *
 * 目的：权限 id 只允许在 PERM_GROUPS 里声明一次。类型系统已经能挡住「页面/接口写字面量写错」，
 * 这个测试再补三件类型系统看不到的事：
 *   1) 声明表本身自洽（不重复、NAV_PERM / PRESETS 只用已声明的 id）
 *   2) 源码里出现的权限字符串（含未来可能动态拼出来的）都在声明表内
 *   3) 两个「是否可写整本台账」的判据与服务端口径一致（避免客户端以为能存、服务端拒绝）
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_PERMS,
  NAV_PERM,
  PERM_GROUPS,
  PRESETS,
  canManageLedger,
  canWriteLedger,
  hasPerm,
  type PermId,
} from "../src/lib/perms";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith(".gen.ts")) out.push(p);
  }
  return out;
}

const declared = new Set<string>(ALL_PERMS);
const SPECIAL = new Set(["ledger.manage", "ledger.write"]);
/** 只有这些前缀的字符串才按「权限 id」检查，避免把正文/依赖名误判 */
const PERM_PREFIX = /^(people|attendance|payments|contracts|expenses|insurance|photos|files|query|import|export|settings|audit|members)\./;
/** 形如 x.y 才算权限 id；再排掉文件名这类同形字符串（如 audit.json、report.pdf） */
const PERM_SHAPE = /^[a-z]+\.[a-z]+$/;
const NOT_PERM_SUFFIX = /\.(json|tmp|log|txt|ts|tsx|xlsx|pdf|jpg|jpeg|png|webp|name)$/;

test("声明表自洽：id 不重复，PERM_GROUPS 与 ALL_PERMS 一致", () => {
  const ids = PERM_GROUPS.flatMap((g) => g.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length, "权限 id 不能重复声明");
  assert.deepEqual([...ALL_PERMS].sort(), [...ids].sort());
  assert.equal(ids.length > 25, true, "权限数量明显变少说明声明表被破坏");
});

test("NAV_PERM 与 PRESETS 只用已声明的权限", () => {
  for (const [path, need] of Object.entries(NAV_PERM)) {
    if (!need) continue;
    assert.equal(declared.has(need), true, `NAV_PERM["${path}"] 指向未声明的权限 ${need}`);
  }
  for (const preset of PRESETS) {
    for (const p of preset.perms) {
      assert.equal(
        declared.has(p) || p === "*",
        true,
        `预设「${preset.label}」里有未声明的权限 ${p}`,
      );
    }
  }
});

test("源码里的权限字符串都在声明表内（防止字面量写错或漏声明）", async () => {
  const files = await walk(SRC);
  const bad: string[] = [];
  for (const f of files) {
    const text = await readFile(f, "utf8");
    // <Can perm="x.y"> / <Need perm="x.y">
    for (const m of text.matchAll(/perm="([^"]+)"/g)) {
      const id = m[1];
      if (!PERM_SHAPE.test(id)) continue; // 文档里的示例 perm="…" 跳过
      if (!declared.has(id)) bad.push(`${f.replace(SRC, "src")}: perm="${id}"`);
    }
    // 接口鉴权：withTenant 的第三个参数（含数组形式）以及 need = "x.y"
    for (const m of text.matchAll(/"([a-z]+\.[a-z]+)"/g)) {
      const id = m[1];
      if (!PERM_PREFIX.test(id) || !PERM_SHAPE.test(id) || NOT_PERM_SUFFIX.test(id)) continue;
      if (declared.has(id) || SPECIAL.has(id)) continue;
      bad.push(`${f.replace(SRC, "src")}: "${id}"`);
    }
  }
  assert.deepEqual(bad, [], `发现未声明的权限 id：\n${bad.join("\n")}`);
});

test("hasPerm：* 通吃、精确匹配、以及 .view 的前缀继承", () => {
  assert.equal(hasPerm(["*"], "people.view"), true);
  assert.equal(hasPerm(["people.view"], "people.view"), true);
  assert.equal(hasPerm(["people.edit"], "people.view"), true, "任何 people.* 都满足 people.view（历史行为，勿依赖）");
  assert.equal(hasPerm(["attendance.view"], "people.view"), false);
  assert.equal(hasPerm([], "people.view"), false);
  assert.equal(hasPerm(undefined, "people.view"), false);
});

test("客户端与服务端『能否写整本台账』的判据一致（避免假保存成功）", () => {
  // 服务端 PUT /api/ledger 用 ledger.manage = canManageLedger；客户端 pushNasLedgerNow 也用同一个
  const cases: PermId[][] = [
    ["people.edit"],
    ["attendance.edit"],
    ["settings.people"],
    ["contracts.edit"],
    ["expenses.edit"],
    ["files.edit"],
    ["photos.edit"],
    [],
  ];
  for (const perms of cases) {
    // 两者必须同为「写整本台账」的判据：能写整本 → 必然也能视为「有写权限」
    if (canManageLedger(perms)) assert.equal(canWriteLedger(perms), true, `${perms} 应同时满足两个判据`);
  }
  assert.equal(canManageLedger(["contracts.edit"]), false, "只给合同权限不应能覆盖整本台账（含身份证/银行卡）");
  assert.equal(canManageLedger(["*"]), true, "管理员/创建人可以");
  assert.equal(canWriteLedger(["*"]), true);
});
