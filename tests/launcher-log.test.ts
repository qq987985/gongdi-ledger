/**
 * 生产启动器（`scripts/app-server-index.mjs` → 构建后 `app/server/index.mjs`）的日志行为回归（1.8.14）。
 *
 * 为什么必须测启动器这条路径：启动器原来自己复刻了一套日志（与应用侧 `src/lib/log.server.ts` 分叉），
 * 于是线上「慢请求 / 5xx / 服务启动」这些只走启动器的事件在两件事上与文档不符：
 *
 *   A9 · `SLOW_MS` 未设置时被解析成 **0**（`Number("") === 0` 且判据写成 `n >= 0`）→
 *        **每个请求**（含静态资源）都写一条「慢请求」：46ms 的 /api/health 也记 warn，
 *        日志被请求流水灌满、每请求多一次写盘（文档写的是 2000ms）。
 *   B1 · 单文件到上限后启动器**停写当天文件**（且认不出 `.log.N`、不参与保留策略），
 *        而应用侧 1.8.4 起是**滚动** `YYYY-MM-DD.log.N`；AGENTS.md / 开发规范 / 使用说明书
 *        都写「1.8.4 起不再停写」→ 线上慢请求与 5xx 到 8MB 后当天不再留证。
 *
 * 这里用「真启动器 + 真日志核心 + 桩 server.js」起一个进程做端到端验证（不需要构建产物，
 * 也就能在 `pnpm test` 里跑）：断言默认阈值是 2000、快请求不记「慢请求」、
 * 小上限下**一条不丢**且确实滚动出 `.log.N`。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LAUNCHER = join(ROOT, "scripts", "app-server-index.mjs");
const LOG_CORE = join(ROOT, "scripts", "log-core.mjs");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Launcher {
  dataDir: string;
  port: number;
  stop: () => Promise<void>;
  stdout: () => string;
}

/**
 * 起一个「缩小版 app/」：真启动器 + 真 log-core + 桩 server.js（任何请求都回 200）。
 * 端口随机，撞了就换一个重试。
 */
async function startLauncher(env: Record<string, string | undefined>): Promise<Launcher> {
  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const dir = await mkdtemp(join(tmpdir(), "gongdi-launcher-"));
    const serverDir = join(dir, "app", "server");
    await mkdir(serverDir, { recursive: true });
    await copyFile(LAUNCHER, join(serverDir, "index.mjs"));
    await copyFile(LOG_CORE, join(serverDir, "log-core.mjs"));
    await writeFile(
      join(serverDir, "server.js"),
      // 每个请求故意慢 5ms：不然「慢请求」这条观测会因 ms=0 而根本不触发（阈值最小也是 1ms），
      // 测的就不是日志实现而是「这一跳多久」了。
      'export default { fetch: async () => { await new Promise((r) => setTimeout(r, 5)); return new Response("ok"); } };\n',
      "utf8",
    );
    await mkdir(join(dir, "app", "public"), { recursive: true });
    await writeFile(join(dir, "app", "public", "index.html"), "<html>ok</html>\n", "utf8");

    const dataDir = join(dir, "data");
    const port = 20000 + Math.floor(Math.random() * 20000);
    const childEnv: Record<string, string> = {};
    for (const [k, v] of Object.entries({ ...process.env, ...env, DATA_DIR: dataDir, PORT: String(port) })) {
      if (v !== undefined) childEnv[k] = v;
    }
    delete childEnv.NITRO_PORT;
    const child = spawn(process.execPath, [join(serverDir, "index.mjs")], {
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stdout += d.toString()));

    const stop = async (): Promise<void> => {
      if (child.exitCode !== null || child.signalCode !== null) return; // 已经退出了：别等 3 秒兜底
      child.kill("SIGTERM");
      await Promise.race([
        new Promise<void>((r) => child.once("exit", () => r())),
        sleep(3000).then(() => {
          child.kill("SIGKILL");
        }),
      ]);
    };

    // 等 /api/health 通（启动器把请求交给桩 handler，一律 200）
    const deadline = Date.now() + 10_000;
    let up = false;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (res.status === 200) {
          up = true;
          break;
        }
      } catch {
        /* 还没起来 */
      }
      await sleep(100);
    }
    if (up) return { dataDir, port, stop, stdout: () => stdout };
    lastErr = stdout;
    await stop();
  }
  throw new Error(`启动器没起来：${lastErr}`);
}

/**
 * 发出 n 个请求（每个都是独立请求，结束时会各记一条观测日志）。
 * 每个请求用**不同的路径**，这样断言「一条都没丢」时可以按路径数点，不会被启动探针多出的那一行干扰
 * （safePath 会丢掉查询串，所以只能用路径区分）。
 */
async function hit(port: number, n: number, tag = "probe"): Promise<string[]> {
  const paths: string[] = [];
  for (let i = 0; i < n; i++) {
    const path = `/${tag}/${i}`;
    // connection: close —— 不让 keep-alive 的空闲连接拖住退出（否则退出要等 5 秒兜底）
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers: { connection: "close" } });
    await res.text();
    paths.push(path);
  }
  // 日志是异步落盘的（不挡请求），给它一点时间
  await sleep(500);
  return paths;
}

/** 读 data/logs 里当天的全部日志（含滚动件），返回按文件名排序的行数组 */
async function readAllLogs(dataDir: string): Promise<{ names: string[]; lines: string[] }> {
  const dir = join(dataDir, "logs");
  const names = (await readdir(dir)).filter((n) => n.endsWith(".log") || /\.log\.\d+$/.test(n)).sort();
  const lines: string[] = [];
  for (const n of names) {
    const text = await readFile(join(dir, n), "utf8");
    for (const line of text.split("\n")) if (line.trim()) lines.push(line);
  }
  return { names, lines };
}

test("启动器：SLOW_MS 未设置时门槛是 2000ms，快请求不再被记成「慢请求」（A9）", async () => {
  const env = { ...process.env };
  assert.equal(env.SLOW_MS, undefined, "这个用例要求本机没设 SLOW_MS（设了就测不到默认值兜底）");
  const app = await startLauncher({ SLOW_MS: undefined, LOG_LEVEL: undefined });
  try {
    await hit(app.port, 3);
    const { lines } = await readAllLogs(app.dataDir);
    const start = lines.map((l) => JSON.parse(l)).find((r) => r.event === "服务启动");
    assert.ok(start, `启动行必须落盘（实际 ${lines.length} 行）`);
    assert.equal(start.slowMs, 2000, "启动行自报的慢阈值必须是文档写的 2000ms，而不是 0");
    assert.equal(start.logLevel, "info");
    const slow = lines.filter((l) => l.includes("慢请求"));
    assert.deepEqual(slow, [], `未设 SLOW_MS 时快请求不能被记成慢请求（实际 ${slow.length} 条）`);
    assert.match(app.stdout(), /"event":"服务启动"/, "stdout 仍要有（docker logs 用它）");
  } finally {
    await app.stop();
  }
});

test("启动器：SLOW_MS=1 时慢请求照记（门槛生效，不是把这条观测关掉了）", async () => {
  const app = await startLauncher({ SLOW_MS: "1", LOG_LEVEL: undefined });
  try {
    const paths = await hit(app.port, 2, "slow");
    const { lines } = await readAllLogs(app.dataDir);
    for (const p of paths) {
      const hitLines = lines.filter((l) => l.includes(`"path":"${p}"`) && l.includes("慢请求"));
      assert.equal(hitLines.length, 1, `${p} 超过 1ms，应记一条「慢请求」（实际 ${hitLines.length} 条）`);
    }
  } finally {
    await app.stop();
  }
});

test("启动器：到单文件上限就滚动 .log.N，一条日志都不丢（B1，与应用侧同口径）", async () => {
  // 524 字节：每行约 150 字节 → 两三行就滚一次
  const app = await startLauncher({ SLOW_MS: "1", LOG_MAX_MB: "0.0005", LOG_LEVEL: undefined });
  try {
    const paths = await hit(app.port, 12);
    const { names, lines } = await readAllLogs(app.dataDir);
    const missing = paths.filter((p) => !lines.some((l) => l.includes(`"path":"${p}"`)));
    assert.deepEqual(missing, [], `12 个请求必须一条不丢地落盘（丢的：${missing.join(" ")}）`);
    assert.equal(
      names.some((n) => /\.log\.\d+$/.test(n)),
      true,
      `必须滚动出 .log.N（实际文件：${names.join(" / ")}）`,
    );
    assert.equal(
      app.stdout().includes("已滚动到下一份"),
      true,
      "滚动时要留一条 stdout 痕迹（与应用侧同一句）",
    );
    assert.equal(app.stdout().includes("今天不再写文件"), false, "不能再出现「停写」那条老提示");
  } finally {
    await app.stop();
  }
});

test("启动器：收到 SIGTERM 要优雅退出（先把日志落完再退，B5 的另一半）", async () => {
  const app = await startLauncher({ SLOW_MS: "1", LOG_LEVEL: undefined });
  try {
    await hit(app.port, 2, "term");
    await app.stop(); // 发 SIGTERM 并等它自己退出
    const { lines } = await readAllLogs(app.dataDir);
    assert.equal(
      lines.some((l) => l.includes("收到退出信号")),
      true,
      "SIGTERM 必须被接住（Dockerfile 的 exec 让 PID 1 是 node，信号才到得了这里）",
    );
    assert.equal(
      lines.filter((l) => l.includes('"path":"/term/')).length,
      2,
      "退出前要把在飞的日志排干，不能丢最后几条",
    );
  } finally {
    await app.stop();
  }
});

test("守卫：启动器必须 import 共用的 log-core，不许再自带一套上限/滚动逻辑", async () => {
  const src = await readFile(LAUNCHER, "utf8");
  assert.match(src, /from "\.\/log-core\.mjs"/, "启动器要从同一份日志核心 import");
  assert.match(src, /enqueueLogLine\(logsDir, line\)/, "落盘必须走 log-core 的串行写（含滚动）");
  // 这些是「第二套实现」的特征：出现任何一个都说明有人又把逻辑抄回来了
  for (const forbidden of ["logState", "capped", "appendFileSync", "nextRotationName(", "keepDays"]) {
    assert.equal(
      src.includes(forbidden),
      false,
      `启动器里不该出现 ${forbidden} —— 日志逻辑唯一实现在 scripts/log-core.mjs`,
    );
  }
  assert.equal(existsSync(LOG_CORE), true);
});
