/**
 * 一键更新的两个不可回退的保证（都是线上踩过的坑）：
 *
 * 1) **先创建新容器，再停/删老容器**。原实现先删老容器再创建，配置/挂载一有问题就
 *    「旧容器没了、新容器起不来」，直接没服务（且只能人工上 NAS 救）。
 * 2) 失败要留下可查的原因：`data/.gongdi-update-error.txt` + `data/logs/update.log`。
 *    客户端原来只能看到没头没脑的「更新失败」。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSameOrigin, isPortable, startUpdateJob, UPDATER_SCRIPT, updateJobStatus } from "../src/lib/update.server";

test("更新脚本：先创建新容器，再停/删老容器（配置有问题时老容器还在）", () => {
  const create = UPDATER_SCRIPT.indexOf("/containers/create?name=");
  const stop = UPDATER_SCRIPT.indexOf("/stop?t=12");
  assert.equal(create > 0, true, "脚本里必须有创建新容器这一步");
  assert.equal(stop > 0, true, "脚本里必须有停老容器这一步");
  assert.equal(create < stop, true, "创建新容器必须排在停老容器之前（否则失败即停服）");
});

test("更新脚本：老容器要等新容器「启动成功」之后才删除（失败可回滚）", () => {
  const startNext = UPDATER_SCRIPT.indexOf('created.Id+"/start"');
  const removeOld = UPDATER_SCRIPT.indexOf('job.oldId+"?force=true"');
  assert.equal(startNext > 0, true, "必须启动新容器");
  assert.equal(removeOld > startNext, true, "删除老容器必须排在新容器启动之后，否则起不来就没得回滚");
});

test("更新脚本：新容器启动失败时把老容器拉回来（回滚），并把原因写进错误文件", () => {
  const startNext = UPDATER_SCRIPT.indexOf('created.Id+"/start"');
  const rollback = UPDATER_SCRIPT.indexOf('job.oldId+"/start"');
  assert.equal(rollback > startNext, true, "失败分支里必须重启老容器");
  assert.match(UPDATER_SCRIPT, /已回滚到原容器/);
});

test("更新脚本：新容器先用临时名创建，老容器删掉后再改名接管", () => {
  assert.match(UPDATER_SCRIPT, /job\.name\+"-next"/, "先按临时名创建，避开名字占用");
  const rename = UPDATER_SCRIPT.indexOf("/rename?name=");
  const removeOld = UPDATER_SCRIPT.indexOf('job.oldId+"?force=true"');
  assert.equal(rename > removeOld, true, "改名必须在老容器移除之后（否则名字还被占用）");
});

test("更新脚本：失败时写错误文件并追加 update.log", () => {
  assert.match(UPDATER_SCRIPT, /\.gongdi-update-error\.txt/);
  assert.match(UPDATER_SCRIPT, /logs\/update\.log/);
  assert.match(UPDATER_SCRIPT, /更新失败/);
  assert.match(UPDATER_SCRIPT, /更新成功/);
});

test("更新脚本：仍需等待 2.5s 再动手，让 HTTP 响应先回到浏览器", () => {
  assert.match(UPDATER_SCRIPT, /setTimeout\(r,2500\)/);
});

test("isPortable：非 win32 且未显式声明时不是解压版（避免在服务器上走 Windows 分支）", () => {
  const prev = process.env.GONGDI_PORTABLE;
  delete process.env.GONGDI_PORTABLE;
  delete process.env.GONGDI_HOME;
  try {
    assert.equal(isPortable(), false);
    process.env.GONGDI_PORTABLE = "1";
    assert.equal(isPortable(), true, "显式 GONGDI_PORTABLE=1 时按解压版处理");
  } finally {
    if (prev === undefined) delete process.env.GONGDI_PORTABLE;
    else process.env.GONGDI_PORTABLE = prev;
  }
});

/** 反代场景：外网用域名访问，反代可能改写 Host —— 只比 Host 会把合法更新误判 403 */
test("同源校验：兼容反向代理（X-Forwarded-Host）", () => {
  const h = (m: Record<string, string>) => ({ get: (k: string) => m[k.toLowerCase()] ?? null });
  assert.equal(checkSameOrigin(h({ host: "nas:8501", origin: "http://nas:8501" })), true, "直连");
  assert.equal(
    checkSameOrigin(h({ host: "127.0.0.1:8501", "x-forwarded-host": "ledger.example.com", origin: "https://ledger.example.com" })),
    true,
    "反代把 Host 改成内网、但透传了 X-Forwarded-Host（最常见配置）",
  );
  assert.equal(
    checkSameOrigin(h({ host: "ledger.example.com", "x-forwarded-host": "ledger.example.com", origin: "https://ledger.example.com" })),
    true,
    "反代原样透传 Host",
  );
  assert.equal(
    checkSameOrigin(h({ host: "10.0.0.5:8501", "x-forwarded-host": "ledger.example.com, 10.0.0.5:8501", origin: "https://ledger.example.com" })),
    true,
    "X-Forwarded-Host 是逗号列表",
  );
  assert.equal(checkSameOrigin(h({ host: "nas:8501", origin: "https://evil.example.com" })), false, "真正的跨站要拒绝");
  assert.equal(checkSameOrigin(h({ host: "nas:8501" })), true, "无 Origin（脚本/curl）时依赖登录态");
});

test("后台更新任务：单飞（重复点不起第二个）+ 结果可查", async () => {
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const runner = async () => {
    calls += 1;
    await gate;
    return { ok: true };
  };
  const first = startUpdateJob(runner);
  const second = startUpdateJob(runner);
  assert.equal(first.running, true);
  assert.equal(second.running, true, "第二次调用应返回「正在运行」而不是再起一个");
  assert.equal(calls, 1, "重复点击不能起第二个更新任务（否则会冒出两个更新容器）");
  release();
  await new Promise((r) => setTimeout(r, 20));
  const done = updateJobStatus();
  assert.equal(done.running, false);
  assert.equal(done.ok, true);
});

test("后台更新任务：抛异常时状态里带出原因（前端据此提示）", async () => {
  startUpdateJob(async () => {
    throw new Error("拉取镜像失败：unauthorized");
  });
  await new Promise((r) => setTimeout(r, 20));
  const st = updateJobStatus();
  assert.equal(st.running, false);
  assert.equal(st.ok, false);
  assert.match(st.error, /unauthorized/);
});
