import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
};
Object.assign(globalThis, { localStorage: storage, window: { localStorage: storage, setTimeout, clearTimeout, confirm: () => false } });
const sync = await import("../src/lib/nas-sync");
const { useApp, emptyState } = await import("../src/lib/store");
const { setNasEnabled } = await import("../src/lib/nas-flag");
const { setLivePerms } = await import("../src/lib/perms");
const { setLedgerGzip } = await import("../src/lib/ledger-gzip-flag");
const oldData = () => ({ ...emptyState(), people: [{ id: "old-person", name: "甲账号旧台账" }] as any });

function setup(t: TestContext) {
  sync.pauseNasSync();
  sync.dropLocalLedger("启动用例重置");
  memory.clear();
  setNasEnabled(true);
  setLivePerms(["*"]); // 复现历史默认权限；必须靠身份就绪门禁挡住，不能靠测试预设无权限遮掩。
  setLedgerGzip(false);
  const puts: any[] = [];
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: any, init: RequestInit = {}) => {
    calls.push(`${init.method || "GET"} ${url}`);
    if (String(url) === "/api/health") throw new Error("health offline");
    if (String(url) === "/api/ledger" && init.method === "PUT") {
      puts.push(JSON.parse(String(init.body)));
      return Response.json({ ok: true }, { headers: { "x-ledger-revision": "new" } });
    }
    if (String(url) === "/api/ledger") return Response.json({ empty: true });
    throw new Error(`意外请求 ${url}`);
  });
  t.after(() => sync.pauseNasSync());
  return { puts, calls };
}

test("身份尚未确认：startNasSync 只安装一次订阅，health失败与迟到hydration均不能seed或自动PUT", async (t) => {
  const { puts, calls } = setup(t);
  const sub = t.mock.method(useApp, "subscribe");
  storage.setItem("gongdi-ledger-v5", JSON.stringify({ state: oldData(), version: 10 }));
  sync.setCacheOwner("user-A", "book-A");
  await sync.startNasSync();
  await sync.startNasSync();
  assert.equal(sub.mock.callCount(), 1, "启动/重试不能安装多个订阅");
  assert.deepEqual(calls, [], "仅安装订阅不应发起健康探测或台账seed");
  await sync.detectNas();
  await useApp.persist.rehydrate();
  assert.equal(useApp.getState().people[0].name, "甲账号旧台账");
  await sync.pullNasLedger({ seed: true });
  await sync.pushNasLedger();
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.deepEqual(puts, [], "auth仍在等待时，旧缓存不能上传至当前cookie对应的空册");
  assert.deepEqual(calls, ["GET /api/health"], "未知身份连seed读取都不应启动");
});

test("身份确认为其他账号/台账：先清旧缓存再拉空册，绝不能seed旧册", async (t) => {
  const { puts } = setup(t);
  useApp.setState(oldData());
  sync.setCacheOwner("user-A", "book-A");
  const owner = sync.checkCacheOwner("user-B", "book-B");
  assert.equal(owner, "changed");
  sync.dropLocalLedger("身份已切换");
  sync.setCacheOwner("user-B", "book-B");
  sync.resumeNasSync();
  await sync.pullNasLedger({ seed: owner !== "changed" });
  assert.deepEqual(puts, []);
  assert.equal(useApp.getState().people.length, 0);
});

test("同一身份确认后仍允许旧版本缓存首次seed；暂停再恢复不执行旧队列任务", async (t) => {
  const { puts } = setup(t);
  useApp.setState(oldData());
  sync.setCacheOwner("user-A", "book-A");
  assert.equal(sync.checkCacheOwner("user-A", "book-A"), "same");
  sync.resumeNasSync();
  await sync.pullNasLedger({ seed: true });
  assert.equal(puts.length, 1);
  assert.equal(puts[0].people[0].name, "甲账号旧台账");
  const queued = sync.pushNasLedger();
  sync.pauseNasSync();
  sync.resumeNasSync();
  await queued;
  assert.equal(puts.length, 1, "重试开放新身份也不能复活旧身份的排队写入");
});

test("已安装订阅在退出/重试暂停后，不得自动保存后来恢复的旧缓存", async (t) => {
  const { puts } = setup(t);
  await sync.startNasSync();
  sync.resumeNasSync();
  useApp.setState(oldData()); // 安排一次500ms自动保存
  sync.pauseNasSync();
  useApp.setState({ year: 2027 }); // 模拟重新hydrate，不能安排新任务
  await new Promise((resolve) => setTimeout(resolve, 600));
  await sync.pushNasLedger();
  assert.deepEqual(puts, []);
});
