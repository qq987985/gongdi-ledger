import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { nasEnabled, setNasEnabled } from "../src/lib/nas-flag";
import { detectNas } from "../src/lib/nas-sync";
import { getPhoto, listPhotoFlags, setPhoto } from "../src/lib/photos";
import { authStatus } from "../src/lib/auth";

// 只提供探测计时器；不提供 IndexedDB。误读旧缓存或本地写入会直接报错。
function withTimers(t: TestContext) {
  const old = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { setTimeout, clearTimeout } });
  t.after(() => {
    if (old) Object.defineProperty(globalThis, "window", old);
    else Reflect.deleteProperty(globalThis, "window");
  });
}

test("启动模式未知：health 失败不能读旧照片或把上传当成本地成功", async (t) => {
  withTimers(t);
  // 首次导入的默认值，尚未经过任何 setNasEnabled。
  assert.equal(nasEnabled(), true);
  t.mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  assert.equal(await detectNas(), true);
  assert.equal(await getPhoto("旧账号人员", "id"), null);
  assert.deepEqual(await listPhotoFlags(["旧账号人员"]), {});
  await assert.rejects(setPhoto("旧账号人员", "id", "data:image/png;base64,YQ=="), /offline/);
});

for (const [label, response] of [
  ["500（即使错误体写了 false）", () => Response.json({ persist: false }, { status: 500 })],
  ["缺少 persist", () => Response.json({})],
  ["persist 类型错误", () => Response.json({ persist: "false" })],
  ["JSON 损坏", () => new Response("not json")],
] as const) {
  test(`已确认服务器模式：health ${label} 时保留服务器路径`, async (t) => {
    withTimers(t);
    setNasEnabled(true);
    t.mock.method(globalThis, "fetch", async () => response());
    assert.equal(await detectNas(), true);
    assert.equal(nasEnabled(), true);
    assert.equal(await getPhoto("旧账号人员", "id"), null);
  });
}

test("明确 persist:false 保留本地模式，临时断网不改变已确认模式", async (t) => {
  withTimers(t);
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({ persist: false }));
  assert.equal(await detectNas(), false);
  assert.equal(nasEnabled(), false);
  fetchMock.mock.mockImplementation(async () => { throw new Error("offline"); });
  assert.equal(await detectNas(), false);
  fetchMock.mock.mockImplementation(async () => Response.json({ persist: true }));
  assert.equal(await detectNas(), true);
});

for (const [label, response] of [
  ["500", () => Response.json({ persist: false }, { status: 500 })],
  ["缺少模式", () => Response.json({})],
  ["模式不是 boolean", () => Response.json({ persist: "false" })],
] as const) {
  test(`auth ${label} 必须拒绝，不能伪装为本地模式`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => response());
    await assert.rejects(authStatus());
  });
}

test("auth 保留明确本地模式与账户损坏专用响应", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({ persist: false }));
  assert.equal((await authStatus()).persist, false);
  fetchMock.mock.mockImplementation(async () => Response.json({ persist: true, broken: true }, { status: 503 }));
  const broken = await authStatus();
  assert.equal(broken.persist, true);
  assert.equal(broken.broken, true);
});
