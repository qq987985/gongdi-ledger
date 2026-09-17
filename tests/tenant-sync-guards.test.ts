/**
 * A1 / A3 的**客户端**约定守卫（1.8.14）。
 *
 * `src/lib/nas-sync.ts` 是浏览器侧的同步状态机（fetch + localStorage + window.confirm），
 * 在 Node 里跑不了完整行为，所以这里按本仓库既有做法（tests/readonly-guards.test.ts 等）
 * 扫源码把「不许改回去」的几条钉住：
 *
 * 1. 拉取被拒（401/403/404）必须清本机缓存 **并** 锁住推送 —— 服务器说这本册子不可用，
 *    本机数据绝不能推回去（A1 的另一半：服务端不回落，客户端也不许乱写）；
 * 2. 404 的提示必须指向「重新选择台账」，不能写成「检查网络」（用户会一直重试）；
 * 3. 推送前必须检查 `bookBlocked`，且检查出现在第一次 `putLedger(` 之前；
 * 4. 上行 payload 里不再有 `accessHash`（A3：不再把它当同步/凭据字段）；
 * 5. 拉取合并时保留本机 `accessHash`（服务端已不保存它，丢掉就等于关掉本机开机口令）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expectMinHits, expectRegexCatches } from "./min-hits";

const src = await readFile(fileURLToPath(new URL("../src/lib/nas-sync.ts", import.meta.url)), "utf8");

/** 去掉注释，避免把注释里的说明当成真实代码 */
function stripComments(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

const code = stripComments(src);

test("A1 守卫：拉取失败（401/403/404）既清本机缓存、又锁住推送", () => {
  const at = code.indexOf("bookBlocked = true;");
  assert.equal(at > 0, true, "拉取被拒时必须置 bookBlocked");
  const near = code.slice(Math.max(0, at - 500), at + 200);
  for (const status of ["401", "403", "404"]) {
    assert.match(near, new RegExp(status), `bookBlocked 的分支必须覆盖 ${status}`);
  }
  assert.match(near, /dropLocalLedger\(/, "清掉本机那份（否则屏幕上还是上一本/上一个账号的数字）");
});

test("A1 守卫：404 的提示指向「重新选择台账」而不是「检查网络」", () => {
  const at = code.indexOf("async function reportPullFailure");
  assert.equal(at > 0, true);
  const body = code.slice(at, at + 900);
  assert.match(body, /r\.status === 404/, "必须单独处理 404");
  assert.match(body, /bookDenied/, "要读服务端的 bookDenied 标记");
  assert.match(body, /重新选择台账/, "要告诉用户怎么办（换台账/找管理员）");
  assert.match(body, /只保留在本机/, "要说明改动没地方存，别让人以为存上了");
});

test("A1 守卫：推送前检查 bookBlocked，且检查在第一次 putLedger 之前", () => {
  const start = code.indexOf("async function pushNasLedgerNow");
  assert.equal(start > 0, true);
  const body = code.slice(start, code.indexOf("function enqueuePush"));
  const guardAt = body.indexOf("if (bookBlocked)");
  const putAt = body.indexOf("await putLedger(");
  assert.equal(guardAt > 0, true, "推送函数里必须有 bookBlocked 的短路");
  assert.equal(putAt > 0, true, "推送函数里应能找到 putLedger");
  assert.equal(guardAt < putAt, true, "短路必须出现在真正发 PUT 之前（否则已经推出去了）");
  assert.match(body.slice(guardAt, guardAt + 400), /syncFailed\(|toast\.error\(/, "要告诉用户「只保留在本机」");
});

test("A3 守卫：上行 payload 不再带 accessHash", () => {
  const start = code.indexOf("function sliceState");
  const body = code.slice(start, code.indexOf("function confirmDiscardLocal"));
  // 负向守卫：命中 0 处也必须证明这条正则本身是好的（否则「假绿」）
  expectRegexCatches(/accessHash/, "accessHash: s.accessHash || \"\",", "sliceState 的 accessHash 正则");
  expectMinHits("sliceState 段长度（太短说明切段失败）", body.length, 200, "sliceState 函数体");
  assert.equal(/accessHash/.test(body), false, "sliceState 里不许再出现 accessHash（旧口令 hash 不再上传）");
});

test("A3 守卫：拉取合并时保留本机 accessHash（服务端已不保存它）", () => {
  const re = /accessHash: j\.accessHash \|\| useApp\.getState\(\)\.accessHash/;
  expectRegexCatches(re, "accessHash: j.accessHash || useApp.getState().accessHash,", "拉取合并的 accessHash 正则");
  expectMinHits("拉取合并的 accessHash 写法", [...code.matchAll(new RegExp(re.source, "g"))].length, 1);
  assert.match(
    code,
    re,
    "服务端没有这个字段时要保留本机的开机口令，否则每次拉取都把手机关掉",
  );
});
