import { test } from "node:test";
import assert from "node:assert/strict";
import { setNasEnabled } from "../src/lib/nas-flag";
import { getPhoto, listPhotoFlags } from "../src/lib/photos";

// 仅执行服务器分支（fetch mock），不调用任何 DOM / IndexedDB API。
// Node 没有 IndexedDB；错误回落到浏览器缓存会直接令测试失败。
for (const status of [401, 403, 404, 500]) {
  test(`服务器照片返回 ${status} 时不读取本机旧缓存`, async (t) => {
    setNasEnabled(true);
    t.after(() => setNasEnabled(false));
    t.mock.method(globalThis, "fetch", async () => Response.json({ error: "test" }, { status }));
    assert.equal(await getPhoto("张三", "id"), null);
    assert.deepEqual(await listPhotoFlags(["张三"]), {});
  });
}

test("断网或响应损坏时不回落到本机旧照片；空姓名清单不请求服务器", async (t) => {
  setNasEnabled(true);
  t.after(() => setNasEnabled(false));
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  assert.deepEqual(await listPhotoFlags([]), {});
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(await getPhoto("张三", "id"), null);
  assert.deepEqual(await listPhotoFlags(["张三"]), {});
  fetchMock.mock.mockImplementation(async () => new Response("not json"));
  assert.equal(await getPhoto("张三", "id"), null);
  assert.deepEqual(await listPhotoFlags(["张三"]), {});
});

test("服务器正常返回的照片地址和标记保持可用", async (t) => {
  setNasEnabled(true);
  t.after(() => setNasEnabled(false));
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({ url: "/api/photo-file?test=1" }));
  assert.equal(await getPhoto("张三", "id"), "/api/photo-file?test=1");
  const flags = { 张三: { id: true, idBack: false, bank: false, ic: false } };
  fetchMock.mock.mockImplementation(async () => Response.json({ flags }));
  assert.deepEqual(await listPhotoFlags(["张三"]), flags);
});
