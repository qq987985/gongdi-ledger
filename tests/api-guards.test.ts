/**
 * 约定守卫（1.7.13）。
 *
 * 这一轮全量走查抓到的问题里，有一类是「两边名字/口径不一致」或「少写一句兜底」，
 * 单元测试测不到、构建也不会报错，只能靠约定守卫钉住：
 *
 * 1. 导出页写出的 kind，服务端必须认识（曾经导出页发 ledger-export、服务端只认 export → 点「总台账」404）
 * 2. 新建账户必须尊重显式传入的 perms（曾经完全忽略它，一律套 preset → 想给"只看考勤"实际给了整套只读）
 * 3. 成员权限接口必须挡住「给自己提权」和「授予自己没有的权限」
 * 4. 所有读 body 的接口都要有 try/catch（非 JSON / 非 form 的请求不能变成 500）
 * 5. 启动器必须有请求体上限 + 未捕获异常落盘（否则 NAS 上按日期翻日志什么都没有）
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repo = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const src = (p: string) => readFile(repo(p), "utf8");

/** 去掉注释，避免把注释里的示例当成真实代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

test("约定：导出页写的每个 kind，服务端都要认识（防止「总台账」404 重演）", async () => {
  const page = await src("src/routes/export.tsx");
  const server = await src("src/routes/api/file/$kind.ts");
  const kinds = [...page.matchAll(/kind:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.equal(kinds.length >= 5, true, `导出页应列出多项导出，实际解析到 ${kinds.length}`);
  const missing = kinds.filter((k) => !server.includes(`"${k}"`));
  assert.deepEqual(missing, [], `这些 kind 客户端会请求、服务端却没有任何分支：${missing.join("、")}`);
});

test("约定：新建账户要读显式 perms（曾经忽略 perms，一律套 preset）", async () => {
  const s = stripComments(await src("src/lib/accounts.server.ts"));
  const start = s.indexOf('op === "createUser"');
  assert.equal(start > 0, true);
  const branch = s.slice(start, start + 1600);
  assert.match(branch, /body\.perms/, "createUser 分支必须读 body.perms");
  assert.match(branch, /ALL_PERMS/, "显式 perms 要经过白名单过滤");
});

test("约定：成员权限接口要挡住自我提权与越权授予", async () => {
  const s = stripComments(await src("src/lib/accounts.server.ts"));
  const start = s.indexOf('op === "addMember" || op === "setMember"');
  assert.equal(start > 0, true);
  const branch = s.slice(start, start + 2200);
  assert.match(branch, /不能修改自己的权限/, "必须拒绝给自己改权限");
  assert.match(branch, /不能授予自己没有的权限/, "普通成员不能授予自己没有的权限");
});

test("约定：所有读 body 的接口都要有 try/catch（非 JSON 不该变成 500）", async () => {
  const files = [
    "src/routes/api/ledger.ts",
    "src/routes/api/audit.ts",
    "src/routes/api/photo.ts",
    "src/routes/api/doc.ts",
    "src/routes/api/year.ts",
    "src/lib/accounts.server.ts",
  ];
  const bad: string[] = [];
  for (const f of files) {
    const s = stripComments(await src(f));
    for (const m of s.matchAll(/await request\.(json|formData)\(\)/g)) {
      const before = s.slice(Math.max(0, (m.index ?? 0) - 220), m.index ?? 0);
      if (!/\btry\s*\{/.test(before)) bad.push(`${f}: ${m[0]}`);
    }
  }
  assert.deepEqual(bad, [], `这些地方直接 await 解析 body，非 JSON 请求会 500：\n${bad.join("\n")}`);
});

test("约定：启动器要有请求体上限与未捕获异常落盘", async () => {
  const s = await src("scripts/app-server-index.mjs");
  assert.match(s, /MAX_BODY_BYTES/, "必须有请求体上限");
  assert.match(s, /uncaughtException/, "未捕获异常要写日志");
  assert.match(s, /unhandledRejection/, "未处理的 Promise 拒绝也要写日志");
  assert.match(s, /logs/, "日志要落到 data/logs");
});
