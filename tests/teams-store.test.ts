import { test } from "node:test";
import assert from "node:assert/strict";
import type { LedgerState } from "../src/lib/types";

const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
};
Object.assign(globalThis, { localStorage: storage, window: { localStorage: storage, setTimeout, clearTimeout, confirm: () => true } });
const { useApp, emptyState, demoState } = await import("../src/lib/store");
const sync = await import("../src/lib/nas-sync");
const { setNasEnabled } = await import("../src/lib/nas-flag");
const { setLedgerGzip } = await import("../src/lib/ledger-gzip-flag");
const { setLivePerms } = await import("../src/lib/perms");

test("旧缓存迁移不改人员原班组，创建空班组持久化并审计，重复名不写入", async (t) => {
  const audits: { action: string; detail: string }[] = [];
  t.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    audits.push(JSON.parse(String(init?.body)));
    return Response.json({ ok: true });
  });
  setNasEnabled(false);
  const old = demoState();
  delete (old as Partial<LedgerState>).teams;
  old.people[0].team = " 旧班组 ";
  memory.set("gongdi-ledger-v5", JSON.stringify({ state: old, version: 10 }));
  await useApp.persist.rehydrate();
  assert.deepEqual(useApp.getState().teams, []);
  assert.equal(useApp.getState().people[0].team, " 旧班组 ");
  assert.equal(useApp.getState().addTeam("旧班组").ok, false);
  const created = useApp.getState().addTeam(" 待进场 ");
  assert.equal(created.ok, true);
  assert.ok(created.team?.id);
  assert.equal(created.team?.name, "待进场");
  assert.equal(useApp.getState().addTeam("待进场").ok, false);
  assert.deepEqual(useApp.getState().teams, [created.team]);
  assert.deepEqual(audits, [{ action: "新增班组", detail: "待进场", module: "人员" }]);
  const persisted = JSON.parse(memory.get("gongdi-ledger-v5")!);
  assert.deepEqual(persisted.state.teams, [created.team]);
  assert.equal(persisted.version, 11);
  const migrate = useApp.persist.getOptions().migrate!;
  const once = await migrate(old, 10);
  assert.deepEqual(await migrate(once, 10), once, "缺列表的旧册迁移幂等");
});

test("仅有空班组的册子可以上传、清缓存、拉回；旧册与新空册不会继承上一册班组", async (t) => {
  const puts: any[] = [];
  let remote: unknown = { ...emptyState(), teams: [{ id: "a-team", name: "甲册空班组" }] };
  t.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    if (String(url) === "/api/audit") return Response.json({ ok: true });
    if (String(url) === "/api/ledger" && init?.method === "PUT") {
      puts.push(JSON.parse(String(init.body)));
      return Response.json({ ok: true }, { headers: { "x-ledger-revision": "saved" } });
    }
    if (String(url) === "/api/ledger") return Response.json(remote, { headers: { "x-ledger-revision": "read" } });
    throw new Error(`测试未定义的请求 ${url}`);
  });
  setNasEnabled(true);
  setLedgerGzip(false);
  setLivePerms(["*"]);
  sync.resumeNasSync();
  t.after(() => sync.pauseNasSync());
  sync.dropLocalLedger("班组用例重置");
  await sync.pullNasLedger({ discardLocal: true });
  assert.equal(useApp.getState().teams[0].name, "甲册空班组");
  assert.equal(useApp.getState().people.length, 0);
  const created = useApp.getState().addTeam("甲册第二班组");
  await sync.pushNasLedger();
  assert.deepEqual(puts[0].teams, [{ id: "a-team", name: "甲册空班组" }, created.team]);
  remote = puts[0];
  sync.dropLocalLedger("模拟切册后返回甲册");
  assert.deepEqual(useApp.getState().teams, []);
  await sync.pullNasLedger({ discardLocal: true });
  assert.deepEqual(useApp.getState().teams, puts[0].teams);
  remote = { year: 2026, people: [], attendance: [], payments: [] };
  await sync.pullNasLedger({ discardLocal: true });
  assert.deepEqual(useApp.getState().teams, [], "旧册缺列表时不能沿用上册班组");
  remote = { empty: true };
  await sync.pullNasLedger({ seed: false, discardLocal: true });
  assert.deepEqual(useApp.getState().teams, [], "新空册班组必须为空");
});
