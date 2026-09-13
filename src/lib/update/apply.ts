/**
 * 更新执行与后台任务编排：Docker / Windows 两条应用路径、任务单飞状态机、同源校验。
 * 从 update.server.ts 原样搬出，行为不变。
 */
import { join } from "node:path";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { logServer } from "../log.server";
import { dataDir } from "../paths.server";
import { HELPER_NAME, REPO, SOCK, DEFAULT_IMAGE } from "./consts";
import { appendUpdateLog, readContainerLogs } from "./log";
import {
  buildImageCandidates,
  checkUpdate,
  hasDockerSock,
  imageVersionOf,
  isNewerVersion,
  isPortable,
  latestCommitShort,
  localVersion,
  portableHome,
} from "./version";
import { dockerReq, imageIdOf, pullImage, sameImageId, selfContainer, uniqueImages } from "./docker";
import { UPDATER_SCRIPT } from "./updater-script";

async function applyDockerUpdate(): Promise<{ ok: boolean; error?: string; restarting?: boolean; imageVersion?: string }> {
  if (!(await hasDockerSock())) {
    await appendUpdateLog("[应用] 放弃自动更新：没有 /var/run/docker.sock（容器未挂载）");
    return { ok: false, error: "还不能自动更新。请到飞牛运行一次「一键拉取」，以后就能在软件里点更新。" };
  }
  const me = await selfContainer();
  await logServer("info", "开始一键更新（Docker）", { currentImage: String(me.Config?.Image || "") });
  const name = String(me.Name || "/attendance-app").replace(/^\//, "") || "attendance-app";
  const current = String(me.Config?.Image || "");
  await appendUpdateLog(`[应用] 开始更新（Docker）：当前镜像 ${current || "(未知)"}`);
  let image = "";
  const local = await localVersion();
  const shortSha = await latestCommitShort();
  const candidates = buildImageCandidates({
    current,
    gongdiImage: process.env.GONGDI_IMAGE,
    defaultImage: DEFAULT_IMAGE,
    shortSha,
  });
  if (shortSha) await appendUpdateLog(`[应用] 本次优先按提交 ${shortSha} 的标签拉取（绕开 latest 的缓存）`);
  let lastErr = "拉镜像失败";
  let pickedVersion = "";
  const stale: string[] = [];
  const currentId = await imageIdOf(current || image);
  for (const ref of candidates) {
    try {
      await pullImage(ref);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      await logServer("warn", "拉取镜像失败", { ref, error: lastErr });
      continue;
    }
    // 「拉取成功」不等于「拉到新版本」：加速站按标签缓存，刚发版时 `latest` 可能还是上一版，
    // 换了容器等于白换（现场现象就是「更新说成功、重启后版本没变」）。
    // 先把镜像里的 VERSION.txt 读出来比对（最准），读不到再退回镜像 ID 比对。
    const ver = await imageVersionOf(ref);
    const id = await imageIdOf(ref);
    if (local && ver && !isNewerVersion(ver, local)) {
      stale.push(`${ref}（镜像是 ${ver}）`);
      lastErr = "";
      await logServer("warn", "拉到的镜像不比本机新", { ref, imageVersion: ver, local });
      await appendUpdateLog(`[应用] ${ref} 里的版本是 ${ver}，不比本机 ${local} 新，改试下一个源`);
      continue;
    }
    if (!ver && sameImageId(id, currentId)) {
      stale.push(ref);
      lastErr = "";
      await logServer("warn", "拉到的镜像与当前运行的完全相同（镜像站缓存未刷新）", { ref, id });
      await appendUpdateLog(`[应用] ${ref} 仍是当前版本（读不到镜像内版本号，按镜像 ID 判定），改试下一个源`);
      continue;
    }
    image = ref;
    pickedVersion = ver;
    lastErr = "";
    await logServer("info", "拉取镜像成功", { ref, id: id || "(未知)", imageVersion: ver || "(未知)" });
    await appendUpdateLog(`[应用] 已拉取镜像 ${ref}（镜像内版本 ${ver || "未知"}）`);
    break;
  }
  if (!image) {
    if (stale.length)
      throw new Error(
        `镜像站返回的还是当前版本（${stale.join("、")}），没有可替换的新镜像。已停止更新，容器和台账都没有改动。` +
          `通常是镜像加速站缓存还没刷新，等 5–10 分钟再点一次即可；急用可把 compose 里的镜像换成 ghcr.io/qq987985/gongdi-ledger:latest 后运行一次「一键拉取」。`,
      );
    throw new Error(lastErr.slice(0, 500) || "拉镜像失败。请确认 Packages 是 Public，或到飞牛再运行一次「一键拉取」。");
  }
  const binds = [...(me.HostConfig?.Binds || [])];
  if (!binds.some((b: string) => String(b).includes("docker.sock"))) binds.push(`${SOCK}:${SOCK}`);
  const hostConfig: Record<string, unknown> = { ...me.HostConfig, Binds: binds };
  delete hostConfig.Mounts;
  const env = [...(me.Config?.Env || [])];
  if (!env.some((e: string) => String(e).startsWith("GONGDI_IMAGE="))) env.push(`GONGDI_IMAGE=${image}`);
  // 网络只按名字重新挂：把 inspect 出来的整份 EndpointsConfig（含 IPAddress / IPAMConfig /
  // MacAddress / Aliases）原样喂回 /containers/create，在不少 Docker 版本上会直接报
  // 「invalid endpoint settings」之类错误——这正是「手动 compose 能重建、应用内重建失败」的常见原因。
  const endpoints: Record<string, Record<string, never>> = {};
  for (const n of Object.keys(me.NetworkSettings?.Networks || {})) endpoints[n] = {};
  const create = {
    Image: image,
    Env: env,
    Labels: me.Config?.Labels,
    ExposedPorts: me.Config?.ExposedPorts,
    WorkingDir: me.Config?.WorkingDir,
    Cmd: me.Config?.Cmd,
    Entrypoint: me.Config?.Entrypoint,
    HostConfig: hostConfig,
    NetworkingConfig: { EndpointsConfig: endpoints },
  };
  const job = { oldId: me.Id, oldImage: String(me.Image || ""), name, create };
  // 数据目录必须走 DATA_DIR（容器内挂载点不一定是 /data，自定义挂载时写死 /data 会丢任务、更新静默失败）。
  // .cjs 文件是 1.7.10 之前「写脚本文件再挂载执行」的残留，现在脚本走 Cmd 内联 + GONGDI_JOB 环境变量，
  // 不再生成；更新容器成功后也会顺手删掉旧版本留下的这个文件。
  const dataPath = dataDir() || "/data";
  await writeFile(join(dataPath, ".gondi-next.json"), JSON.stringify(job));
  try {
    await dockerReq("POST", `/containers/${HELPER_NAME}/stop?t=2`);
  } catch {}
  try {
    await dockerReq("DELETE", `/containers/${HELPER_NAME}?force=true`);
  } catch {}
  // 更新容器只需要两个挂载：docker.sock（换容器）和数据目录（往 data/logs/update.log 写进展）。
  // 数据挂载按「容器内路径 === DATA_DIR」识别；找不到时**不再猜宿主路径**
  // （以前会写死一个飞牛默认路径做兜底，换个 NAS/目录就挂错），只记警告——
  // 换容器靠 GONGDI_JOB 环境变量，不依赖任何挂载，更新照样执行，只是进展不落盘。
  const containerPathOf = (b: string) => String(b).split(":")[1] || "";
  const helperBinds = binds.filter(
    (b: string) => containerPathOf(b) === dataPath || String(b).includes("docker.sock"),
  );
  if (!helperBinds.some((b: string) => containerPathOf(b) === dataPath))
    await logServer("warn", "更新容器缺少数据挂载（找不到容器内路径等于 DATA_DIR 的挂载），更新进展不会写入 update.log", {
      dataPath,
    });
  if (!helperBinds.some((b: string) => String(b).includes("docker.sock"))) helperBinds.push(`${SOCK}:${SOCK}`);
  const helper = await dockerReq("POST", `/containers/create?name=${HELPER_NAME}`, {
    body: {
      Image: image,
      Entrypoint: [],
      Cmd: ["node", "-e", UPDATER_SCRIPT],
      WorkingDir: "/",
      Env: [`GONGDI_JOB=${JSON.stringify(job)}`, `DATA_DIR=${dataPath}`],
      HostConfig: { Binds: helperBinds, AutoRemove: false, RestartPolicy: { Name: "no" } },
    },
  });
  await dockerReq("POST", `/containers/${helper.Id}/start`);
  // 更新容器必须是真的在跑：以前它因脚本语法错误/挂载不对而瞬间退出，应用侧却回「已受理」，
  // 用户看到的就是「更新说成功、什么都没变」。这里等两秒看它是否还活着，顺便带回它自己的日志。
  await new Promise((r) => setTimeout(r, 2000));
  const helperState = await dockerReq("GET", `/containers/${helper.Id}/json`).catch(() => null);
  if (helperState?.State?.Running === false) {
    const code = String(helperState.State.ExitCode ?? "?");
    const logs = await readContainerLogs(helper.Id).catch(() => "");
    await logServer("error", "更新容器启动后立即退出", { exitCode: code, image, logs: logs.slice(-800) });
    await appendUpdateLog(`[应用] 更新容器启动后立即退出（exit ${code}）：${logs.slice(-400) || "(没有任何输出)"}`);
    await dockerReq("DELETE", `/containers/${helper.Id}?force=true`).catch(() => {});
    throw new Error(
      `更新容器启动后立刻退出了（exit ${code}），本次更新没有执行，容器与台账都没动。原因：` +
        `${logs.slice(-300) || "更新容器没有任何输出"}`
    );
  }
  await logServer("info", "已启动更新容器，稍后自动替换", { image, helper: helper.Id });
  await appendUpdateLog(`[应用] 已启动更新容器，约 10 秒后替换 ${name}（镜像 ${image}）`);
  return { ok: true, restarting: true, imageVersion: pickedVersion };
}

async function applyWindowsUpdate(): Promise<{ ok: boolean; error?: string; restarting?: boolean; imageVersion?: string }> {
  const home = portableHome();
  if (!home) return { ok: false, error: "找不到 Windows 安装目录" };
  const info = await checkUpdate();
  if (!info.url) return { ok: false, error: info.hint || info.error || "没有 Windows 下载地址" };
  const tmp = join(tmpdir(), "gongdi-upd");
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  const zipPath = join(tmp, "gongdi-windows.zip");
  const urls = uniqueImages([
    info.url,
    `https://github.com/${REPO}/releases/latest/download/gongdi-windows.zip`,
    `https://gh-proxy.com/https://github.com/${REPO}/releases/latest/download/gongdi-windows.zip`,
    `https://ghfast.top/https://github.com/${REPO}/releases/latest/download/gongdi-windows.zip`,
  ]);
  let buf: Buffer | null = null;
  let last = "下载失败";
  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: { "User-Agent": "gongdi-ledger", Accept: "application/octet-stream" },
        redirect: "follow",
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        last = `下载失败 ${res.status}`;
        continue;
      }
      buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 1024) break;
      last = "下载内容太小";
      buf = null;
    } catch (e) {
      last = e instanceof Error ? e.message : String(e);
    }
  }
  if (!buf) return { ok: false, error: last };
  await writeFile(zipPath, buf);
  try {
    await stat(home);
  } catch {
    return { ok: false, error: "安装目录不存在" };
  }
  const { spawn } = await import("node:child_process");
  // 安装目录会被原样拼进 .bat（批处理对 & | < > ^ % ! 等字符是语法），路径里带这些字符会生成坏脚本。
  // 只防不转：把特殊字符的情況明确拒掉，比转义规则写错安全。
  if (/[&|<>\r\n^%!@()"]/.test(home))
    return { ok: false, error: `安装目录含批处理特殊字符（& | < > ^ % ! " 等）：${home}。请把软件放到简单路径（如 D:\\gongdi）后再更新。` };
  const bat = join(home, "正在更新.bat");
  const unpack = join(tmp, "out");
  const script = `@echo off
chcp 65001 >nul
cd /d "${home.replace(/"/g, "")}"
timeout /t 2 /nobreak >nul
if exist "${unpack}" rd /s /q "${unpack}"
mkdir "${unpack}"
tar -xf "${zipPath}" -C "${unpack}"
if exist "${unpack}\\Windows解压即用" (
  set SRC=${unpack}\\Windows解压即用
) else if exist "${unpack}\\app" (
  set SRC=${unpack}
) else (
  for /d %%D in ("${unpack}\\*") do set SRC=%%D
)
if not defined SRC set SRC=${unpack}
xcopy /E /Y /I "%SRC%\\app" "app\\" >nul
if exist "%SRC%\\node\\node.exe" xcopy /E /Y /I "%SRC%\\node" "node\\" >nul
if exist "%SRC%\\启动.bat" copy /Y "%SRC%\\启动.bat" "启动.bat" >nul
if exist "%SRC%\\停止.bat" copy /Y "%SRC%\\停止.bat" "停止.bat" >nul
if exist "%SRC%\\VERSION.txt" copy /Y "%SRC%\\VERSION.txt" "VERSION.txt" >nul
start "" "%~dp0启动.bat"
del /q "%~f0"
`;
  await writeFile(bat, script.replace(/\n/g, "\r\n"), "utf8");
  await logServer("info", "开始 Windows 更新", { home, url: info.url });
  await appendUpdateLog(`[应用] 开始更新（Windows）：下载 ${info.url}`);
  spawn("cmd.exe", ["/c", bat], { detached: true, stdio: "ignore", cwd: home, windowsHide: false }).unref();
  // 先让 HTTP 响应发回浏览器再退出：原来 800ms 就 process.exit，
  // 响应常常还没落地 → 浏览器看到「网络中断」→ 误报「更新失败」，而更新其实已经开始。
  setTimeout(() => process.exit(0), 4000);
  return { ok: true, restarting: true };
}

export async function applyUpdate(): Promise<{ ok: boolean; error?: string; restarting?: boolean; imageVersion?: string }> {
  if (isPortable()) return applyWindowsUpdate();
  if (await hasDockerSock()) return applyDockerUpdate();
  return { ok: false, error: "飞牛请先运行一次「一键拉取」。Windows 请用解压版点更新。" };
}

export interface UpdateJobState {
  running: boolean;
  startedAt: number;
  doneAt: number;
  ok: boolean;
  error: string;
  step: string;
  /** 本次拉到的镜像里的版本号（用来解释「更新后版本没变」这类问题） */
  imageVersion: string;
}

/**
 * 同源校验：请求带 Origin/Referer 且与本站不同源时拒绝（防跨站触发更新）。
 * 兼容反向代理：反代常把 Host 改写成内网地址，真正的对外域名在 X-Forwarded-Host 里，
 * 只比 Host 会把「反代 + 域名访问」的合法更新请求误判成 403（来源不一致）。
 */
export function checkSameOrigin(headers: { get(name: string): string | null }): boolean {
  const origin = headers.get("origin") || headers.get("referer");
  if (!origin) return true; // 非浏览器上下文（脚本）时依赖登录态
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const candidates = [headers.get("host"), headers.get("x-forwarded-host")]
    .filter((h): h is string => Boolean(h))
    .flatMap((h) => h.split(","))
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return candidates.includes(host);
}

let updateJobState: UpdateJobState = { running: false, startedAt: 0, doneAt: 0, ok: false, error: "", step: "", imageVersion: "" };

export function updateJobStatus(): UpdateJobState {
  return { ...updateJobState };
}

/**
 * 后台执行更新，立刻返回。
 *
 * 为什么必须异步：拉镜像动辄 1~5 分钟，而这个 POST 在外面通常还要经过反代
 * （nginx 默认 proxy_read_timeout 60s）。同步等待的结果就是反代 60 秒后掐断并回 HTML 504，
 * 前端 `r.json()` 失败 → 显示兜底的「更新失败」，而服务端其实还在拉镜像——
 * 「手动一键拉取能成、应用内更新不行」很大程度上就是这个原因。
 *
 * 用轮询 `GET /api/update?status=1` 看进度；重复点击不会起第二个更新
 * （第二次只返回当前状态，避免同时冒出两个更新容器）。
 */
export function startUpdateJob(
  run: () => Promise<{ ok: boolean; error?: string; restarting?: boolean; imageVersion?: string }> = applyUpdate,
): UpdateJobState {
  if (updateJobState.running) return updateJobStatus();
  updateJobState = { running: true, startedAt: Date.now(), doneAt: 0, ok: false, error: "", step: "正在更新（拉镜像/准备替换）", imageVersion: "" };
  void logServer("info", "开始一键更新（后台任务）", {});
  void run()
    .then((r) => {
      updateJobState = {
        ...updateJobState,
        running: false,
        doneAt: Date.now(),
        ok: Boolean(r.ok),
        error: r.error || "",
        step: r.ok ? "已受理，容器即将被替换" : "失败",
        imageVersion: r.imageVersion || updateJobState.imageVersion,
      };
      return logServer(r.ok ? "info" : "warn", r.ok ? "一键更新已受理" : "一键更新失败", {
        error: r.error || "",
        imageVersion: r.imageVersion || "",
      }).then(() =>
        appendUpdateLog(r.ok ? "[应用] 更新已受理，等待容器替换" : `[应用] 更新失败：${r.error || "未说明原因"}`),
      );
    })
    .catch((e: unknown) => {
      const error = e instanceof Error && e.message ? e.message : "更新过程出错（详情见 data/logs）";
      updateJobState = { ...updateJobState, running: false, doneAt: Date.now(), ok: false, error, step: "异常" };
      return logServer("error", "一键更新异常", { error }).then(() => appendUpdateLog(`[应用] 更新异常：${error}`));
    });
  return updateJobStatus();
}
