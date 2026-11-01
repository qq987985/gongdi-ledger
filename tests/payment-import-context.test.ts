import { test } from "node:test";
import assert from "node:assert/strict";

const memory = new Map<string, string>();
const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); }, removeItem: (k: string) => { memory.delete(k); } };
Object.assign(globalThis, { localStorage: storage, window: { localStorage: storage, setTimeout, clearTimeout } });
const sync = await import("../src/lib/nas-sync");
const { useApp, emptyState } = await import("../src/lib/store");
const { setNasEnabled } = await import("../src/lib/nas-flag");
const { setLivePerms } = await import("../src/lib/perms");

for (const action of ["switch", "create", "delete"] as const) {
  test(`发放导入上下文：${action} 发起即失效，cookie已变但旧数组尚在时仍禁止确认`, async (t) => {
    sync.pauseNasSync();
    sync.dropLocalLedger("隔离测试重置");
    setNasEnabled(true);
    setLivePerms(["*"]);
    useApp.setState({ ...emptyState(), payments: [{ id: "A-1", owner: "合成甲", receiver: "合成甲", amount: 100, date: "2026-11-01", source: "", remark: "" }] });
    sync.resumeNasSync();
    const before = sync.ledgerContextSnapshot();
    const base = useApp.getState().payments;
    let changedCookie = false;
    let authReached!: () => void;
    let releaseAuth!: () => void;
    const reached = new Promise<void>((resolve) => { authReached = resolve; });
    const gate = new Promise<void>((resolve) => { releaseAuth = resolve; });
    let puts = 0;
    let notifications = 0;
    const unsubscribe = sync.subscribeLedgerContext(() => { notifications++; });
    t.after(() => { unsubscribe(); sync.pauseNasSync(); });
    t.mock.method(globalThis, "fetch", async (url: any, init: RequestInit = {}) => {
      if (String(url) === "/api/auth" && init.method === "POST") { changedCookie = true; return Response.json({ ok: true }); }
      if (String(url) === "/api/auth") {
        if (changedCookie) { authReached(); await gate; }
        return Response.json({ persist: true, bookId: changedCookie ? "B" : "A", user: { id: "synthetic-admin" }, perms: ["*"] });
      }
      if (init.method === "PUT") { puts++; return Response.json({ ok: true }); }
      return Response.json({ empty: true });
    });
    const pending = action === "switch" ? sync.switchBook("B") : action === "create" ? sync.createBookAndEnter("B") : sync.deleteBook("A");
    assert.equal(sync.ledgerContextSnapshot(), null, "必须在第一个 await 前禁用预览");
    await reached;
    assert.equal(changedCookie, true);
    assert.equal(useApp.getState().payments, base, "复现关键窗口：旧数组引用尚未改变");
    assert.equal(sync.ledgerContextSnapshot(), null);
    assert.notEqual(sync.ledgerContextSnapshot(), before, "应用前相同上下文校验必须失败");
    assert.ok(notifications > 0, "界面必须收到变更通知");
    releaseAuth();
    assert.equal((await pending).status, "ok");
    assert.notEqual(sync.ledgerContextSnapshot(), null);
    assert.notEqual(sync.ledgerContextSnapshot(), before);
    assert.equal(puts, 0);
  });
}

test("发放导入上下文：切册失败会解除忙状态但旧预览不复活；本地模式可正常使用", async (t) => {
  setNasEnabled(true);
  sync.resumeNasSync();
  const before = sync.ledgerContextSnapshot();
  t.mock.method(globalThis, "fetch", async () => { throw new Error("合成网络失败"); });
  assert.equal((await sync.switchBook("B")).status, "failed");
  assert.notEqual(sync.ledgerContextSnapshot(), null);
  assert.notEqual(sync.ledgerContextSnapshot(), before);
  sync.pauseNasSync();
  assert.equal(sync.ledgerContextSnapshot(), null);
  setNasEnabled(false);
  assert.notEqual(sync.ledgerContextSnapshot(), null, "本地模式不能被服务器身份门禁误锁");
});
