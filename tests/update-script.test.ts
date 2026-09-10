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
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  buildImageCandidates,
  checkSameOrigin,
  dockerMessage,
  isPortable,
  parseImageVersion,
  pickRemovableImages,
  sameImageId,
  startUpdateJob,
  UPDATER_SCRIPT,
  updateJobStatus,
} from "../src/lib/update.server";

const D = String.fromCharCode(46); // ASCII "."
const H = String.fromCharCode(45); // ASCII "-"


/** 去掉注释再扫：源码注释里也会出现 `dockerReq(...)` 示例写法，不能当成真实调用 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .join("\n");
}

/**
 * 把源码里的 dockerReq(...) 调用切成参数列表（够用的括号/引号处理）。
 * 用途：锁住「第三参数必须写成 { body: … } 或 { stream: … }」这条约定——
 * 曾经把容器配置直接当第三参数传，被当成"没有请求体"补成 "{}"，
 * Docker 回 `config cannot be empty in order to create a container`，飞牛一键更新一直失败。
 */
function dockerReqCalls(src: string): string[][] {
  const out: string[][] = [];
  for (const m of src.matchAll(/dockerReq\(/g)) {
    let depth = 1; // 只统计 ( ) —— 参数的括号层级
    let inner = 0; // { } 与 [ ] 的层级：这些里面的逗号不是参数分隔符
    let inStr: string | null = null;
    const args: string[] = [];
    let cur = "";
    for (let i = m.index! + m[0].length; i < src.length; i++) {
      const ch = src[i];
      if (inStr) {
        cur += ch;
        if (ch === inStr && src[i - 1] !== "\\") inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inStr = ch;
        cur += ch;
        continue;
      }
      if (ch === "{" || ch === "[") inner++;
      if (ch === "}" || ch === "]") inner--;
      if (ch === "(") depth++;
      if (ch === ")") {
        depth--;
        if (depth === 0) break;
      }
      if (ch === "," && depth === 1 && inner === 0) {
        args.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    args.push(cur.trim());
    out.push(args);
  }
  return out;
}

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
  assert.equal(UPDATER_SCRIPT.includes(D + "gondi" + H + "update" + H + "error" + D + "txt"), true, "错误文件名必须在脚本里");
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

test("dockerReq 调用：第三参数必须写成 { body } / { stream }（防「请求体被丢掉」重演）", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/update.server.ts", import.meta.url)), "utf8");
  const calls = dockerReqCalls(stripComments(src));
  assert.equal(calls.length >= 8, true, `应能解析出 dockerReq 调用（实际 ${calls.length} 处）`);
  const bad = calls
    .filter((args) => args.length >= 3 && args[2].startsWith("{"))
    .filter((args) => !/(^|[{,\s])(body|stream)\s*:/.test(args[2]))
    .map((args) => args[2].slice(0, 80).replace(/\s+/g, " "));
  assert.deepEqual(bad, [], `这些 dockerReq 调用的第三参数会被当成「没有请求体」而丢掉：\n${bad.join("\n")}`);
});

test("dockerReq：容器配置直传（历史写法）也要能发出请求体", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/update.server.ts", import.meta.url)), "utf8");
  assert.match(src, /body === undefined && o\.stream === undefined && Object\.keys\(opts\)\.length > 0/);
});

test('dockerMessage：把 Docker 的 {"message":"…"} 取成一句话，别再给用户看整段 JSON', () => {
  assert.equal(
    dockerMessage('{"message":"config cannot be empty in order to create a container"}'),
    "config cannot be empty in order to create a container",
  );
  assert.equal(dockerMessage('{"message":"  No such container  "}'), "No such container");
  assert.equal(dockerMessage("pull access denied for x"), "pull access denied for x");
  assert.equal(dockerMessage(""), "");
});

test("镜像比对：忽略 sha256: 前缀与大小写；空值一律算不同（不能误拦正常更新）", () => {
  assert.equal(sameImageId("sha256:ABC123", "abc123"), true);
  assert.equal(sameImageId("abc123", "sha256:abc123"), true);
  assert.equal(sameImageId("sha256:abc", "sha256:def"), false);
  assert.equal(sameImageId("", "sha256:abc"), false);
  assert.equal(sameImageId("sha256:abc", undefined), false);
  assert.equal(sameImageId(undefined, undefined), false);
});

/** 「更新成功但版本没变」的根因之一：镜像站缓存了旧的 latest，拉到的就是当前这个镜像 */
test("pickRemovableImages：只挑本项目、没被任何容器引用、且不是当前镜像的那些", () => {
  const images = [
    { Id: "sha256:new", RepoTags: ["ghcr.1ms.run/qq987985/gongdi-ledger:latest"], Size: 300 },
    { Id: "sha256:old1", RepoTags: ["ghcr.1ms.run/qq987985/gongdi-ledger:sha-8cb28e6"], Size: 290 },
    { Id: "sha256:old2", RepoTags: null, Size: 280 },
    { Id: "sha256:inuse", RepoTags: ["ghcr.io/qq987985/gongdi-ledger:sha-aaaaaaa"], Size: 285 },
    { Id: "sha256:other", RepoTags: ["nginx:latest"], Size: 200 },
    { Id: "sha256:other2", RepoTags: ["postgres:16"], Size: 400 },
  ];
  const got = pickRemovableImages(images, ["sha256:inuse"], "sha256:new");
  assert.deepEqual(
    got.map((x) => x.id),
    ["sha256:old1"],
    "无标签的旧镜像（<none>）不主动删；别人的镜像、正在用的镜像、当前镜像一律不动",
  );
  assert.equal(got[0].size, 290);
});

test("pickRemovableImages：没有可删的就返回空（不报错、不误删）", () => {
  const only = [{ Id: "sha256:cur", RepoTags: ["ghcr.1ms.run/qq987985/gongdi-ledger:latest"], Size: 300 }];
  assert.deepEqual(pickRemovableImages(only, [], "sha256:cur"), []);
});

test("更新脚本：换新容器成功后顺手删掉上一个版本的镜像（容器已删，镜像没人用）", () => {
  const rename = UPDATER_SCRIPT.indexOf("/rename?name=");
  const delImg = UPDATER_SCRIPT.indexOf('/images/"+encodeURIComponent(oldImage)');
  assert.equal(delImg > rename, true, "删旧镜像必须在改名接管之后（新容器已经在跑）");
  assert.match(UPDATER_SCRIPT, /oldImage!==newImage/, "必须是「旧镜像 ≠ 新镜像」才删，否则会把正在用的镜像删掉");
  assert.match(UPDATER_SCRIPT, /已清理旧镜像/);
  assert.match(UPDATER_SCRIPT, /清理旧镜像失败（不影响本次更新）/, "删镜像失败不能影响更新结果");
});

test("更新脚本：下一个容器要带上老镜像 ID（否则不知道删哪份）", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/update.server.ts", import.meta.url)), "utf8");
  assert.match(src, /oldImage: String\(me\.Image \|\| ""\)/);
});

test("parseImageVersion：从 docker logs 里读出镜像里的版本号（含未开 TTY 的帧头垃圾）", () => {
  assert.equal(parseImageVersion("1.7.9\n"), "1.7.9");
  assert.equal(parseImageVersion("1.7.9"), "1.7.9");
  assert.equal(parseImageVersion("\u0001\u0000\u0000\u0000\u0000\u0000\u0000\u00061.7.9\n"), "1.7.9", "未开 TTY 时日志前有 8 字节帧头");
  assert.equal(parseImageVersion("v1.7.9\r\n"), "1.7.9");
  assert.equal(parseImageVersion(""), "");
  assert.equal(parseImageVersion("cat: /app/VERSION.txt: No such file or directory\n"), "");
});

/** 加速站不缓存 sha-<短sha>，所以「按提交拉」是绕开 latest 缓存最有效的一招 */
test("buildImageCandidates：优先按提交 sha 拉，latest 兜底，最后才用配置里的镜像", () => {
  const list = buildImageCandidates({
    current: "ghcr.1ms.run/qq987985/gongdi-ledger:latest",
    gongdiImage: "ghcr.1ms.run/qq987985/gongdi-ledger:latest",
    defaultImage: "ghcr.1ms.run/qq987985/gongdi-ledger:latest",
    shortSha: "9437636abc",
  });
  assert.equal(list[0], "ghcr.1ms.run/qq987985/gongdi-ledger:sha-9437636", "第一个候选必须是一次性 sha 标签");
  assert.equal(list.includes("ghcr.io/qq987985/gongdi-ledger:sha-9437636"), true, "也要能直接回源 ghcr.io");
  assert.equal(list.includes("ghcr.1ms.run/qq987985/gongdi-ledger:latest"), true, "latest 作为兜底");
  assert.equal(new Set(list).size, list.length, "候选不能重复");
  assert.equal(list.filter((x) => x.includes("sha-")).length >= 2, true);
});

test("buildImageCandidates：拿不到提交 sha 时只回 latest 系列，不能崩", () => {
  const list = buildImageCandidates({ current: "ghcr.io/qq987985/gongdi-ledger:latest" });
  assert.equal(list.every((x) => x.endsWith(":latest")), true);
  assert.equal(list.includes("ghcr.io/qq987985/gongdi-ledger:latest"), true);
});

test("后台更新任务：状态里带出「镜像内版本」，用于解释更新后版本没变", async () => {
  startUpdateJob(async () => ({ ok: true, imageVersion: "1.7.9" }));
  await new Promise((r) => setTimeout(r, 20));
  const st = updateJobStatus();
  assert.equal(st.ok, true);
  assert.equal(st.imageVersion, "1.7.9");
});


/**
 * 1.7.10 的核心回归防线。
 *
 * 更新脚本是「用模板字符串生成的一段 JS」。它曾经是**语法错误**的：
 * 模板字符串里的 \n 会被解释成真换行，于是生成的 .cjs 里字符串字面量跨了行，
 * node 在解析阶段就退出（stderr 没人看），容器又被 AutoRemove 删掉 ——
 * 界面只看到「更新已受理」，容器却没换，查了很久才找到。
 * 光用正则扫源码是扫不出来的，必须真的交给 JS 引擎解析一遍。
 */
test("更新脚本：必须能被 JS 引擎解析（语法错误会让更新变成静默空操作）", () => {
  assert.doesNotThrow(() => new Function(UPDATER_SCRIPT), "生成的更新脚本必须是合法 JS");
});

test("更新脚本：第一步就留痕（以前脚本没跑起来时一点记录都没有）", () => {
  assert.match(UPDATER_SCRIPT, /更新容器已启动/);
  assert.match(UPDATER_SCRIPT, /console\.log/, "同时写 stdout，docker logs gongdi-updater 能看到");
  assert.match(UPDATER_SCRIPT, /process\.env\.GONGDI_JOB/, "任务走环境变量，不依赖任何挂载");
  assert.match(UPDATER_SCRIPT, /更新成功，已启动/);
});

test("更新容器：脚本走 Cmd 内联 + 不再自动删除（失败后还能查到它的日志）", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/update.server.ts", import.meta.url)), "utf8");
  assert.match(src, /Cmd: \["node", "-e", UPDATER_SCRIPT\]/);
  assert.match(src, /Env: \[`GONGDI_JOB=\$\{JSON\.stringify\(job\)\}`/, "任务通过环境变量传进去");
  assert.match(src, /AutoRemove: false/, "不能再自动删除：否则失败后没有日志可查");
});

test("更新容器：启动两秒后要检查它是否已经退出（否则只剩一句「已受理」）", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/update.server.ts", import.meta.url)), "utf8");
  assert.match(src, /State\?\.Running === false/);
  assert.match(src, /更新容器启动后立即退出/);
  assert.match(src, /本次更新没有执行，容器与台账都没动/);
});

test("查看更新日志：要带上更新容器自己的日志与状态", async () => {
  const src = await readFile(fileURLToPath(new URL("../src/lib/update.server.ts", import.meta.url)), "utf8");
  assert.match(src, /helperReport/);
  assert.match(src, /\/containers\/\$\{encodeURIComponent\(id\)\}\/logs\?stdout=1&stderr=1/);
  assert.match(src, /更新容器：/, "面板里要能看到「更新容器：正在运行 / 已退出（exit N）」");
});
