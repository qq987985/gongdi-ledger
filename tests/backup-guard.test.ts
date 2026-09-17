/**
 * 「备份接口不许把最新备份覆盖成空文件」回归测试（1.8.4）。
 *
 * 用户报的现象（本轮尾巴清理第 3 条）：`POST /api/backup` 收到 0 字节 / 缺 body 时
 * 会一路走到 `saveBackup()`，于是**同时**写下：
 *   - `data/backups/<时间戳>_考勤表.xlsx`（0 字节）
 *   - `data/backups/考勤表.xlsx` ← 「最新备份」的固定名，被清成 0 字节
 * 一次失败的请求就把用户手上唯一一份「最新备份」毁掉，而且接口还回 `{ok:true}`。
 *
 * 现在：路由在写盘前就 400，`saveBackup()` 里再兜一层（0 字节直接不写）。
 * 这里用真实的 Route handler + 真实登录跑一遍，并逐个字节比对 backups 目录。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerHooks } from "node:module";
import * as XLSX from "xlsx";

const root = await mkdtemp(join(tmpdir(), "gongdi-backup-guard-"));
process.env.DATA_DIR = root;

// 源码里用 `~/*` 别名（打包器习惯），node 直接跑测试要映射到 src/ 并补扩展名
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("~/")) {
      const base = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try {
          return nextResolve(base + ext, context);
        } catch {
          // 试下一个后缀
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

const A = await import("../src/lib/accounts.server");
const { Route } = await import("../src/routes/api/backup");

type Handler = (ctx: { request: Request }) => Promise<Response>;
const post = (Route.options.server!.handlers as unknown as { POST: Handler }).POST;

const setupRes = await A.handleAuthPost(
  new Request("http://local/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "setup", username: "admin", password: "12345678", name: "管理员" }),
  }),
);
assert.equal(setupRes.status, 200, "测试前置：建管理员必须成功");
const cookie = (setupRes.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";")[0])
  .filter(Boolean)
  .join("; ");
assert.ok(cookie, "测试前置：setup 必须返回会话 cookie");

function call(body?: Buffer | Uint8Array, headers: Record<string, string> = {}): Promise<Response> {
  const init: RequestInit = { method: "POST", headers: { cookie, ...headers } };
  if (body !== undefined) init.body = body as BodyInit;
  return post({ request: new Request("http://local/api/backup", init) });
}

/** backups 目录快照：文件名 → 字节数 + 内容指纹（用来断言「一个字节都没变」） */
async function snapshot(): Promise<Record<string, string>> {
  const dir = join(root, "backups");
  if (!existsSync(dir)) return {};
  const out: Record<string, string> = {};
  for (const name of (await readdir(dir)).sort()) {
    const p = join(dir, name);
    const buf = await readFile(p);
    out[name] = `${buf.byteLength}:${createHash("sha256").update(buf).digest("hex")}`;
  }
  return out;
}

/** 一份真 xlsx（库里的 xlsx 依赖，不需要引新依赖） */
function tinyXlsx(label: string): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["姓名", "金额"], [label, 100]]), "考勤");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

test("前置：正常 xlsx 备份 → 200，带时间戳的那份与固定名「考勤表.xlsx」都落盘", async () => {
  const before = await snapshot();
  assert.deepEqual(before, {}, "测试前置：backups 目录应还是空的");
  const body = tinyXlsx("正常备份");
  const r = await call(body, { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  assert.equal(r.status, 200);
  const j = (await r.json()) as { ok?: boolean; filename?: string; path?: string };
  assert.equal(j.ok, true);
  assert.match(String(j.filename), /^\d{8}_\d{6}_考勤表\.xlsx$/);
  const after = await snapshot();
  assert.equal(after["考勤表.xlsx"] !== undefined, true, "固定名「最新备份」必须写上");
  const stamped = Object.keys(after).filter((n) => n !== "考勤表.xlsx");
  assert.equal(stamped.length, 1, `应恰好落一份带时间戳的备份，实际：${Object.keys(after).join("、")}`);
  assert.equal(after["考勤表.xlsx"], after[stamped[0]], "两份内容必须一致");
  // 内容真的是那份 xlsx（能被解析回来）
  const onDisk = await readFile(join(root, "backups", "考勤表.xlsx"));
  const back = XLSX.read(onDisk, { type: "buffer" });
  assert.deepEqual(
    XLSX.utils.sheet_to_json(back.Sheets[back.SheetNames[0]], { header: 1 }),
    [["姓名", "金额"], ["正常备份", 100]],
  );
});

test("空 body（0 字节）→ 400，且 backups 目录一个字节都没变（不许覆盖「最新备份」）", async () => {
  const before = await snapshot();
  assert.ok(Object.keys(before).length > 0, "前置：上一用例已有一份备份");

  const r = await call(Buffer.alloc(0));
  assert.equal(r.status, 400, "0 字节不是备份，必须 400（不是 ok:true）");
  const j = (await r.json()) as { error?: string; invalid?: boolean };
  assert.match(String(j.error), /空|0 字节/, "要给用户可读原因");
  assert.equal(j.invalid, true);

  assert.deepEqual(await snapshot(), before, "空 body 绝不能改动任何备份文件（尤其是固定名那份）");
});

test("完全没有 body → 400，同样不动任何文件", async () => {
  const before = await snapshot();
  const r = await call(undefined);
  assert.equal(r.status, 400);
  assert.match(String(((await r.json()) as { error?: string }).error), /空|0 字节/);
  assert.deepEqual(await snapshot(), before);
});

test("兜底：saveBackup(0 字节) 自己不写盘（将来多一个调用方也不会漏）", async () => {
  const N = await import("../src/lib/nas-fs.server");
  const before = await snapshot();
  const ret = await N.saveBackup(Buffer.alloc(0), "20260916_120000_考勤表.xlsx");
  assert.equal(ret, "", "0 字节应返回空路径（= 没写）");
  assert.deepEqual(await snapshot(), before);
  // 正向对照：非空才写
  const p = await N.saveBackup(tinyXlsx("对照"), "20260916_120001_考勤表.xlsx");
  assert.ok(p && existsSync(p), "非空 buffer 应正常落盘");
  assert.ok((await stat(join(root, "backups", "考勤表.xlsx"))).size > 0);
});

/* ── B-12③（1.8.14）：非空垃圾内容同样不许覆盖「最新备份」 ── */

test("B-12③ 内容不是 xlsx（JSON / HTML 错误页 / 纯文本）→ 400，且 backups 一个字节都没变", async () => {
  const before = await snapshot();
  assert.ok(Object.keys(before).length > 0, "前置：已有备份");
  for (const junk of [
    Buffer.from('{"ok":true,"data":[]}'),
    Buffer.from("<!doctype html><html><body>502 Bad Gateway</body></html>"),
    Buffer.from("随便一段文本"),
  ]) {
    const r = await call(junk);
    assert.equal(r.status, 400, `${junk.subarray(0, 16).toString()} 不是 xlsx，必须 400（不是 ok:true）`);
    const j = (await r.json()) as { error?: string; invalid?: boolean };
    assert.match(String(j.error), /xlsx/, "要给用户可读原因");
    assert.equal(j.invalid, true);
    assert.deepEqual(await snapshot(), before, "垃圾内容绝不许覆盖固定名「最新备份」");
  }
});

test("B-12③ 传输中断被截断的 xlsx（只有前 200 字节）→ 400；完整的那份照样能写", async () => {
  const before = await snapshot();
  const full = tinyXlsx("会被截断");
  const r = await call(Buffer.from(full.subarray(0, 200)));
  assert.equal(r.status, 400, "截断的 xlsx 不是完整备份，必须 400");
  assert.match(String(((await r.json()) as { error?: string }).error), /截断|损坏|xlsx/);
  assert.deepEqual(await snapshot(), before, "截断内容不许覆盖最新备份");
  // 正向对照：判据不误伤正常文件
  const ok = await call(full);
  assert.equal(ok.status, 200);
  const after = await snapshot();
  assert.notEqual(after["考勤表.xlsx"], before["考勤表.xlsx"], "完整 xlsx 应正常更新最新备份");
});

test("B-12③ backupRejectReason 判据：正常 xlsx 放行，各类坏输入都有可读原因", async () => {
  const { backupRejectReason } = await import("../src/lib/backup-check");
  assert.match(backupRejectReason(Buffer.alloc(0)), /空|0 字节/, "0 字节文案与 1.8.4 一致（老测试仍匹配）");
  assert.match(backupRejectReason(null), /空|0 字节/);
  assert.equal(backupRejectReason(tinyXlsx("正常")), "", "正常 xlsx 必须放行");
  const zipNoXl = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from("hello.txt"),
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
  ]);
  assert.match(backupRejectReason(zipNoXl), /xl\//, "是 zip 但不是 xlsx（没有 xl/ 目录）");
  assert.match(backupRejectReason(Buffer.from(tinyXlsx("截断").subarray(0, 200))), /截断|损坏/);
});
