import { dataDir, readVersionText } from "./nas-fs.server";
import { logServer } from "./log.server";
import { join } from "node:path";
import { access, appendFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import http from "node:http";

const REPO = (process.env.UPDATE_REPO || "qq987985/gongdi-ledger").trim();
const DEFAULT_IMAGE = (process.env.GONGDI_IMAGE || "ghcr.1ms.run/qq987985/gongdi-ledger:latest").trim();
const SOCK = "/var/run/docker.sock";
const HELPER_NAME = "gongdi-updater"; // 专门跑替换容器的临时容器名

let updateLogQueue: Promise<void> = Promise.resolve();

/**
 * 追加一行到 `data/logs/update.log`（和更新容器写的是同一个文件）。
 *
 * 为什么单独记一份：更新失败后旧容器还活着，但一旦重启，内存里的更新状态就没了，
 * 只有落盘能回答「上次更新到底怎么了」。界面上的「查看更新日志」读的就是这个文件。
 * 自身失败绝不抛出：日志不能反过来把更新搞砸。
 */
export function appendUpdateLog(text: string): Promise<void> {
  const root = dataDir();
  if (!root) return Promise.resolve();
  const line = `${new Date().toISOString()} ${text}\n`;
  updateLogQueue = updateLogQueue.then(
    async () => {
      try {
        await mkdir(join(root, "logs"), { recursive: true });
        await appendFile(join(root, "logs", "update.log"), line, "utf8");
      } catch {
        /* 写不进去就放弃 */
      }
    },
    () => {},
  );
  return updateLogQueue;
}

const LOG_TAIL_LINES = 120;
const LOG_TAIL_BYTES = 64 * 1024;

/** 取文件尾部若干行；文件不存在返回空串（正常情况），其它错误原样带出便于排查 */
async function tailFile(path: string): Promise<string> {
  try {
    const raw = await readFile(path, "utf8");
    let text = raw;
    if (raw.length > LOG_TAIL_BYTES) {
      const cut = raw.slice(-LOG_TAIL_BYTES);
      const nl = cut.indexOf("\n");
      text = nl >= 0 ? cut.slice(nl + 1) : cut; // 丢掉被截断的半行
    }
    const lines = text.trimEnd().split("\n");
    return lines.slice(Math.max(0, lines.length - LOG_TAIL_LINES)).join("\n");
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === "ENOENT") return "";
    return `[读取失败] ${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * 读回更新现场：`data/logs/update.log`（应用 + 更新容器都写这个文件）与
 * `data/.gongdi-update-error.txt`（更新容器失败时写的最后一份错误）。
 * 供界面上的「查看更新日志」使用，只读、不抛。
 */
export async function readUpdateLog(): Promise<{ log: string; errorText: string; note: string; helper: string }> {
  const root = dataDir();
  if (!root) return { log: "", errorText: "", note: "未开启 NAS 持久化，本机运行没有更新日志", helper: "" };
  const [log, errorText, helper] = await Promise.all([
    tailFile(join(root, "logs", "update.log")),
    tailFile(join(root, ".gondi-update-error.txt")),
    helperReport(),
  ]);
  return {
    log,
    errorText,
    helper,
    note: log || errorText || helper ? "" : "还没有更新记录（data/logs/update.log 不存在）",
  };
}

/**
 * 更新容器（gongdi-updater）自己的状态与日志。
 *
 * 为什么要看它：换容器是它干的，应用侧只看到「已启动更新容器」。它一声不响地退出
 * （脚本语法错误、挂载不对、镜像有问题）时，界面以前完全看不出来。现在更新容器不再
 * 自动删除（AutoRemove:false），所以随时能读到它的 docker logs。
 */
async function helperReport(): Promise<string> {
  try {
    const j = await dockerReq("GET", `/containers/${HELPER_NAME}/json`);
    const st = (j?.State || {}) as { Running?: boolean; ExitCode?: number; StartedAt?: string; FinishedAt?: string };
    const when = (t?: string) => (t && !t.startsWith("0001") ? String(t).slice(11, 19) : "");
    const head = st.Running
      ? `更新容器：正在运行（${when(st.StartedAt)} 启动）`
      : `更新容器：已退出（exit ${st.ExitCode ?? "?"}${when(st.FinishedAt) ? `，${when(st.FinishedAt)}` : ""}）`;
    const logs = await readContainerLogs(HELPER_NAME, 80);
    return `${head}\n${logs || "（更新容器没有任何输出）"}`;
  } catch {
    return ""; // 没挂 docker.sock / 还没跑过更新
  }
}

/** 读某个容器的 stdout+stderr；未开 TTY 时日志带二进制帧头，清掉再给人看 */
async function readContainerLogs(id: string, tail = 120): Promise<string> {
  const r = await dockerReq("GET", `/containers/${encodeURIComponent(id)}/logs?stdout=1&stderr=1&tail=${tail}`);
  const raw = typeof r === "string" ? r : String((r as { raw?: string })?.raw || "");
  return raw
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\r\n/g, "\n")
    .trimEnd();
}

let cache: { at: number; data: RemoteInfo | null } = { at: 0, data: null };

function portableHome(): string {
  const h = process.env.GONGDI_HOME?.trim();
  if (h) return h;
  if (process.env.GONGDI_PORTABLE === "1") return process.cwd();
  return "";
}

export function isPortable(): boolean {
  if (process.env.GONGDI_PORTABLE === "1") return true;
  return process.platform === "win32" && Boolean(portableHome());
}

function parseRemoteTag(s: unknown): string {
  return (
    String(s || "")
      .trim()
      .replace(/^win-/, "")
      .replace(/^v/i, "")
      .replace(/\s+\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s*$/, "")
      .split(/\s+/)[0] || ""
  );
}

function normalizeVersion(v: unknown): string {
  const n = parseRemoteTag(v);
  if (/^\d+$/.test(n)) return Number(n) >= 10 ? `0.0.${n}` : `${n}.0.0`;
  return n || "0.0.0";
}

function isNewerVersion(remote: string, local: string): boolean {
  const a = normalizeVersion(remote).split(".").map((x) => parseInt(x, 10) || 0);
  const b = normalizeVersion(local).split(".").map((x) => parseInt(x, 10) || 0);
  while (a.length < 3) a.push(0);
  while (b.length < 3) b.push(0);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

function ghHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "gongdi-ledger",
    ...extra,
  };
  const tok = (process.env.UPDATE_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  if (tok) h.Authorization = `Bearer ${tok}`;
  return h;
}

/** 有没有挂载 docker.sock（有才能重建容器 / 清理镜像） */
export async function hasDockerSock(): Promise<boolean> {
  try {
    await access(SOCK, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function localVersion(): Promise<string> {
  const text = await readVersionText();
  const first = String(text || "").split(/\r?\n/).find((l) => l.trim()) || "1.0.2";
  return parseRemoteTag(first);
}

async function fetchWithTimeout(url: string, headers: Record<string, string> = {}, ms = 4500): Promise<Response> {
  return fetch(url, {
    headers: { "User-Agent": "gongdi-ledger", ...headers },
    redirect: "follow",
    signal: AbortSignal.timeout(ms),
  });
}

function firstVersionLine(text: string): string {
  return parseRemoteTag(String(text || "").split(/\r?\n/).find((l) => l.trim()) || "");
}

function pickNewer(a: string, b: string): string {
  if (!a) return b || "";
  if (!b) return a;
  return isNewerVersion(b, a) ? b : a;
}

interface RemoteInfo {
  remote: string;
  url?: string;
  name?: string;
  size?: number;
  notes?: string;
  page?: string;
}

async function versionFromResponse(res: Response): Promise<RemoteInfo> {
  if (!res.ok) throw new Error(String(res.status));
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed);
      if (data.content && data.encoding === "base64")
        return { remote: firstVersionLine(Buffer.from(data.content, "base64").toString("utf8")) } as RemoteInfo;
      let tag = parseRemoteTag(data.tag_name || data.name || "");
      if (!/\d+(?:\.\d+)*/.test(tag)) {
        const m = String(data.body || "").match(/\d+\.\d+\.\d+/);
        if (m) tag = m[0];
      }
      if (tag)
        return {
          remote: tag,
          url:
            (
              (data.assets || []).find((a: any) => /windows/i.test(a.name) && a.name.endsWith(".zip")) ||
              (data.assets || []).find((a: any) => a.name.endsWith(".zip"))
            )?.browser_download_url || "",
          name:
            (
              (data.assets || []).find((a: any) => /windows/i.test(a.name) && a.name.endsWith(".zip")) ||
              (data.assets || []).find((a: any) => a.name.endsWith(".zip"))
            )?.name || "",
          size:
            (
              (data.assets || []).find((a: any) => /windows/i.test(a.name) && a.name.endsWith(".zip")) ||
              (data.assets || []).find((a: any) => a.name.endsWith(".zip"))
            )?.size || 0,
          notes: data.body || "",
          page: data.html_url || "",
        };
    } catch {}
  }
  if (trimmed.startsWith("<")) throw new Error("html");
  const remote = firstVersionLine(text);
  if (!remote) throw new Error("empty");
  return { remote };
}

async function raceSources(urls: string[], headersFor: (url: string) => Record<string, string>): Promise<RemoteInfo | null> {
  return await new Promise((resolve) => {
    let left = urls.length;
    let best: RemoteInfo | null = null;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(best);
    };
    if (!urls.length) return finish();
    for (const url of urls) {
      fetchWithTimeout(url, headersFor(url))
        .then(versionFromResponse)
        .then((hit) => {
          if (!(hit && hit.remote)) return;
          best = best
            ? {
                ...best,
                ...hit,
                remote: pickNewer(best.remote, hit.remote),
                url: hit.url || best.url,
                name: hit.name || best.name,
                size: hit.size || best.size,
                notes: hit.notes || best.notes,
                page: hit.page || best.page,
              }
            : { url: "", name: "", size: 0, notes: "", page: "", ...hit };
          setTimeout(finish, 500);
        })
        .catch(() => {})
        .finally(() => {
          left--;
          if (left <= 0) finish();
        });
    }
    setTimeout(finish, 5500);
  });
}

/**
 * GitHub 上 main 分支当前提交的短 sha（7 位）——CI 会用 `sha-<短 sha>` 给镜像打第二个标签。
 * 加速站不会缓存这种一次性标签，所以「按 sha 拉」能绕开 `latest` 的缓存。
 * 拿不到就返回空串（调用方只会少一个候选，不影响更新）。
 */
let shaCache: { at: number; sha: string } = { at: 0, sha: "" };
async function latestCommitShort(): Promise<string> {
  if (shaCache.sha && Date.now() - shaCache.at < 10 * 60 * 1000) return shaCache.sha;
  const urls = [
    `https://api.github.com/repos/${REPO}/commits/main`,
    `https://gh-proxy.com/https://api.github.com/repos/${REPO}/commits/main`,
    `https://ghfast.top/https://api.github.com/repos/${REPO}/commits/main`,
  ];
  for (const u of urls) {
    try {
      const res = await fetchWithTimeout(u, u.includes("api.github.com") ? ghHeaders() : { "User-Agent": "gongdi-ledger" });
      if (!res.ok) continue;
      const j = (await res.json()) as { sha?: string };
      const sha = String(j?.sha || "").replace(/[^0-9a-f]/gi, "").slice(0, 7);
      if (sha) {
        shaCache = { at: Date.now(), sha };
        return sha;
      }
    } catch {
      /* 换下一个源 */
    }
  }
  return "";
}

async function fetchGithub(fresh = false): Promise<RemoteInfo> {
  if (!fresh && cache.data && cache.data.remote && Date.now() - cache.at < 2 * 60 * 1000) return cache.data;
  const out: Required<RemoteInfo> = { remote: "", url: "", name: "", size: 0, notes: "", page: "" };
  const versionUrls = [
    `https://api.github.com/repos/${REPO}/contents/VERSION.txt`,
    `https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
    `https://gh-proxy.com/https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
    `https://ghfast.top/https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
    `https://gh.ddlc.top/https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
    `https://cdn.jsdelivr.net/gh/${REPO}@main/VERSION.txt`,
    `https://fastly.jsdelivr.net/gh/${REPO}@main/VERSION.txt`,
    `https://cdn.jsdmirror.com/gh/${REPO}@main/VERSION.txt`,
  ];
  const releaseUrls = [
    `https://api.github.com/repos/${REPO}/releases/latest`,
    `https://gh-proxy.com/https://api.github.com/repos/${REPO}/releases/latest`,
    `https://ghfast.top/https://api.github.com/repos/${REPO}/releases/latest`,
  ];
  const headersFor = (url: string): Record<string, string> => {
    if (url.includes("api.github.com") && url.includes("/contents/"))
      return ghHeaders({ Accept: "application/vnd.github.raw" });
    if (url.includes("api.github.com")) return ghHeaders();
    return { "User-Agent": "gongdi-ledger" };
  };
  const [fromFile, fromRelease] = await Promise.all([
    raceSources(versionUrls, headersFor),
    raceSources(releaseUrls, headersFor),
  ]);
  for (const hit of [fromRelease, fromFile]) {
    if (!hit) continue;
    out.remote = pickNewer(out.remote, hit.remote);
    if (hit.url) out.url = hit.url;
    if (hit.name) out.name = hit.name;
    if (hit.size) out.size = hit.size;
    if (hit.notes) out.notes = hit.notes;
    if (hit.page) out.page = hit.page;
  }
  if (out.remote && !out.url) {
    out.url = `https://github.com/${REPO}/releases/latest/download/gongdi-windows.zip`;
    out.name = out.name || "gongdi-windows.zip";
  }
  if (!out.page) out.page = `https://github.com/${REPO}/releases/latest`;
  if (out.remote) cache = { at: Date.now(), data: out };
  else cache = { at: 0, data: null };
  return out;
}

export interface UpdateInfo {
  portable: boolean;
  docker: boolean;
  mode: "windows" | "docker" | "manual";
  canApply: boolean;
  local: string;
  remote: string;
  newer: boolean;
  url?: string;
  name?: string;
  size?: number;
  notes?: string;
  page?: string;
  error: string;
  hint: string;
}

/**
 * 从 `docker logs` 的输出里取出镜像里的版本号。
 *
 * 为什么要读镜像里的 VERSION.txt：镜像加速站按标签缓存，`latest` 可能还是上一版，
 * 「拉取成功」并不等于「拉到了新版本」。只有把镜像内容读出来才知道真相。
 * 容器日志未开 TTY 时会带 8 字节帧头（不可打印字节），所以先滤掉再匹配。
 */
export function parseImageVersion(rawLog: string): string {
  const text = String(rawLog || "").replace(/[^\x20-\x7e\r\n]/g, "\n");
  const m = text.match(/(?:^|\n)\s*v?(\d+\.\d+\.\d+)\s*(?:\r?\n|$)/);
  return m ? m[1] : "";
}

/** 把镜像内容里的版本读出来：用一个「只跑 cat」的临时容器，读完立刻删掉，不留痕迹 */
async function imageVersionOf(ref: string): Promise<string> {
  let id = "";
  try {
    const created = await dockerReq("POST", "/containers/create", {
      body: {
        Image: ref,
        Entrypoint: [],
        Cmd: ["cat", "/app/VERSION.txt"],
        WorkingDir: "/app",
        Tty: true,
        HostConfig: { NetworkMode: "none", AutoRemove: false },
      },
    });
    id = String(created?.Id || "");
    if (!id) return "";
    await dockerReq("POST", `/containers/${encodeURIComponent(id)}/start`);
    const logs = await dockerReq("GET", `/containers/${encodeURIComponent(id)}/logs?stdout=1&stderr=1`);
    const raw = typeof logs === "string" ? logs : String(logs?.raw || "");
    return parseImageVersion(raw);
  } catch {
    return "";
  } finally {
    if (id)
      try {
        await dockerReq("DELETE", `/containers/${encodeURIComponent(id)}?force=1`);
      } catch {}
  }
}

/**
 * 拉镜像的候选顺序。
 *
 * 放在最前面的是 `sha-<short>` 这种**一次性标签**：加速站不会缓存它，
 * 只能回源拉取，所以基本一定是最新构建；`latest` 排在后面兜底。
 * 仓库目前只发布 `latest` 与 `sha-<sha>` 两种标签（版本号标签没有），见 AGENTS.md。
 */
export function buildImageCandidates(opts: {
  current?: string;
  gongdiImage?: string;
  defaultImage?: string;
  shortSha?: string;
}): string[] {
  const repoOf = (ref?: string) => {
    const s = String(ref || "").trim();
    if (!s || !s.includes("/")) return "";
    const i = s.lastIndexOf(":");
    const repo = i > s.lastIndexOf("/") ? s.slice(0, i) : s;
    return repo ? repo.replace(/^https?:\/\//, "").replace(/\/+$/, "") : "";
  };
  const mine = repoOf(opts.current) || repoOf(opts.gongdiImage) || DEFAULT_IMAGE.split(":")[0];
  const short = String(opts.shortSha || "").replace(/[^0-9a-f]/gi, "").slice(0, 7);
  const repos = uniqueImages([mine, "ghcr.1ms.run/qq987985/gongdi-ledger", "ghcr.io/qq987985/gongdi-ledger"]);
  const out: string[] = [];
  if (short) for (const r of repos) out.push(`${r}:sha-${short}`);
  for (const r of repos) out.push(`${r}:latest`);
  return uniqueImages([...out, opts.gongdiImage, opts.defaultImage]);
}

export async function checkUpdate(fresh = false): Promise<UpdateInfo> {
  const local = await localVersion();
  const portable = isPortable();
  const docker = await hasDockerSock();
  const latest = await fetchGithub(fresh);
  const remote = latest.remote || "";
  const newer = remote ? isNewerVersion(remote, local) : false;
  let mode: UpdateInfo["mode"] = "manual";
  if (portable) mode = "windows";
  else if (docker) mode = "docker";
  const canApply = newer && ((mode === "windows" && Boolean(latest.url)) || mode === "docker");
  let error = "";
  let hint = "";
  if (!remote)
    error = "暂时连不上 GitHub。仓库已经公开的话，多半是飞牛访问 GitHub 被拦了，点「检查更新」再试一次。";
  else if (mode === "windows" && newer && !latest.url) {
    error = "";
    hint = "GitHub 已有新版本，Windows 安装包还在打包，稍后再点更新";
  } else if (mode === "manual" && newer)
    hint = "飞牛请先运行一次「一键拉取」，这次会打开自动更新。以后 GitHub 出新版就能在软件里点更新。";
  return {
    portable,
    docker,
    mode,
    canApply,
    local,
    remote,
    newer,
    url: latest.url,
    name: latest.name,
    size: latest.size,
    notes: latest.notes,
    page: latest.page,
    error,
    hint,
  };
}

/**
 * 把 Docker 的 `{"message":"..."}` 错误体取成一句话给人看（原来直接把整段 JSON 抛出去，
 * 界面上就是 `{"message":"config cannot be empty..."}` 这种半成品）。
 */
export function dockerMessage(raw: string): string {
  const t = (raw || "").trim();
  if (!t) return "";
  try {
    const j = JSON.parse(t) as { message?: unknown };
    if (j && typeof j.message === "string" && j.message.trim()) return j.message.trim();
  } catch {}
  return t.slice(0, 400);
}

function dockerReq(
  method: string,
  path: string,
  opts: { body?: unknown; stream?: boolean } | Record<string, unknown> = {},
): Promise<any> {
  return new Promise((resolve, reject) => {
    // 第三参数有两种写法，必须都认：
    //   ① dockerReq("POST", path, { body: {…} })          ← 推荐
    //   ② dockerReq("POST", path, { Image, Cmd, … })      ← 直接把容器配置当第三参数（历史写法）
    // 曾经只认 ①，写法 ② 被当成「没有请求体」补成 "{}"，Docker 于是报
    // 「config cannot be empty in order to create a container」——飞牛「一键更新」一直失败就是它。
    const o = opts as { body?: unknown; stream?: boolean };
    let body = o.body;
    if (body === undefined && o.stream === undefined && Object.keys(opts).length > 0) body = opts;
    let data = body == null ? null : typeof body === "string" ? body : JSON.stringify(body);
    // Docker 对「POST 且无请求体」的调用会报 invalid JSON: got EOF while reading request body，
    // 统一补一个最小的空 JSON 对象 {}（stop/start/images/create 都接受）。
    if (data == null && method.toUpperCase() === "POST") data = "{}";
    const req = http.request(
      {
        socketPath: SOCK,
        path,
        method,
        headers: data
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
          : {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          if ((res.statusCode || 0) >= 300)
            return reject(new Error(dockerMessage(raw) || String(res.statusCode)));
          if (opts.stream) {
            for (const line of raw.split("\n").filter(Boolean))
              try {
                const j = JSON.parse(line);
                if (j.error) return reject(new Error(j.error));
              } catch {}
            return resolve(raw);
          }
          if (!raw) return resolve({});
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve({ raw });
          }
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function splitImage(ref: string): { repo: string; tag: string } {
  const s = String(ref || "").trim();
  const i = s.lastIndexOf(":");
  if (i <= 0 || s.slice(i).includes("/")) return { repo: s || DEFAULT_IMAGE, tag: "latest" };
  return { repo: s.slice(0, i), tag: s.slice(i + 1) };
}

async function selfContainer(): Promise<any> {
  const host = (process.env.HOSTNAME || "").trim();
  if (host) {
    try {
      return await dockerReq("GET", `/containers/${encodeURIComponent(host)}/json`);
    } catch {}
  }
  try {
    const cg = await readFile("/proc/self/cgroup", "utf8");
    const m = cg.match(/([0-9a-f]{64})/) || cg.match(/docker[-/]([0-9a-f]{12,})/i);
    if (m) return await dockerReq("GET", `/containers/${m[1]}/json`);
  } catch {}
  const list = await dockerReq("GET", "/containers/json");
  const mine = (list || []).find((c: any) =>
    (c.Names || []).some((n: string) => n.replace(/^\//, "") === "attendance-app"),
  );
  if (mine) return await dockerReq("GET", `/containers/${mine.Id}/json`);
  throw new Error("找不到当前容器");
}

async function pullImage(ref: string): Promise<void> {
  const { repo, tag } = splitImage(ref);
  const full = `${repo}:${tag}`;
  const errors: string[] = [];
  for (const path of [
    `/images/create?fromImage=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`,
    `/images/create?fromImage=${encodeURIComponent(full)}`,
  ]) {
    try {
      await dockerReq("POST", path, { stream: true });
      return;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`${ref} 拉取失败：${errors.join("；").slice(0, 400) || "未知原因"}`);
}

/**
 * 两个镜像 ID 是不是同一个（忽略 `sha256:` 前缀与大小写）。
 * 空值一律算「不同」，免得因为查不到 ID 就把正常的更新拦下来。
 */
export function sameImageId(a: string | undefined, b: string | undefined): boolean {
  const norm = (x: string | undefined) => String(x || "").trim().toLowerCase().replace(/^sha256:/, "");
  const x = norm(a);
  const y = norm(b);
  return Boolean(x && y && x === y);
}

/** 查某个镜像引用当前的镜像 ID；查不到返回空串（不抛） */
async function imageIdOf(ref: string): Promise<string> {
  if (!ref) return "";
  try {
    const j = await dockerReq("GET", `/images/${encodeURIComponent(ref)}/json`);
    return String(j?.Id || "");
  } catch {
    return "";
  }
}

export interface LocalImage {
  id: string;
  tags: string[];
  size: number;
}

/**
 * 从 `/images/json` 的结果里挑出「可以安全删掉的历史镜像」。
 *
 * 只认我们自己仓库的镜像（名字里带 gongdi-ledger），并且必须同时满足：
 * - 不是当前正在运行的这个镜像
 * - 没有被任何容器（含已停止的）引用 —— 别人的镜像、正在用的镜像一律不动
 */
export function pickRemovableImages(
  images: { Id?: string; RepoTags?: (string | null)[] | null; Size?: number; Containers?: number }[],
  usedImageIds: string[],
  currentImageId: string,
): LocalImage[] {
  const used = new Set(usedImageIds.map((x) => String(x || "").toLowerCase().replace(/^sha256:/, "")).filter(Boolean));
  const out: LocalImage[] = [];
  for (const img of images || []) {
    const id = String(img?.Id || "");
    const tags = (img?.RepoTags || []).filter((t): t is string => Boolean(t) && t !== "<none>:<none>");
    const mine = tags.some((t) => /gongdi-ledger/i.test(t));
    if (!mine) continue;
    const norm = id.toLowerCase().replace(/^sha256:/, "");
    if (!norm) continue;
    if (sameImageId(id, currentImageId)) continue;
    if (used.has(norm)) continue;
    out.push({ id, tags, size: Number(img?.Size || 0) });
  }
  return out;
}

/**
 * 从容器列表里算出「真正占住镜像」的镜像 ID。
 *
 * 为什么要挑出来：更新容器（`gongdi-updater`）是一次性的，跑完就退出、也已经没人再用它，
 * 但它作为「已停止的容器」仍会被 Docker 记着，于是它那个镜像永远删不掉（几百 MB）。
 * 规则：正在跑的容器一律算占用；已退出的更新容器不算占用（它随时可以被删）。
 */
export function usedImageIdsOf(containers: { ImageID?: string; Image?: string; State?: string; Names?: string[] }[]): string[] {
  const out: string[] = [];
  for (const c of containers || []) {
    const names = (c?.Names || []).map((n) => String(n || "").replace(/^\//, ""));
    const isHelper = names.includes(HELPER_NAME);
    if (isHelper && String(c?.State || "") !== "running") continue; // 已退出的更新容器不占镜像
    const id = String(c?.ImageID || c?.Image || "");
    if (id) out.push(id);
  }
  return out;
}

/** 本地是否有一个已经退出、可以随手删掉的更新容器 */
export async function staleHelperContainer(): Promise<boolean> {
  try {
    const j = await dockerReq("GET", `/containers/${HELPER_NAME}/json`);
    return Boolean(j?.State) && j.State.Running === false;
  } catch {
    return false;
  }
}

/** 列出本地属于本项目的镜像（用于界面提示）与其中可清理的部分 */
export async function listLocalImages(): Promise<{ images: LocalImage[]; removable: LocalImage[]; totalBytes: number }> {
  const [raw, containers, me] = await Promise.all([
    dockerReq("GET", "/images/json?all=1"),
    dockerReq("GET", "/containers/json?all=1"),
    selfContainer().catch(() => null),
  ]);
  const usedIds = usedImageIdsOf(containers || []);
  const currentId = String(me?.Image || "");
  const all: LocalImage[] = (raw || [])
    .filter((img: any) => (img?.RepoTags || []).some((t: string) => t && /gongdi-ledger/i.test(t)))
    .map((img: any) => ({
      id: String(img.Id || ""),
      tags: (img.RepoTags || []).filter((t: string) => t && t !== "<none>:<none>"),
      size: Number(img.Size || 0),
    }));
  const removable = pickRemovableImages(raw || [], usedIds, currentId);
  return { images: all, removable, totalBytes: removable.reduce((s, x) => s + x.size, 0) };
}

/**
 * 删掉不再使用的历史镜像，返回释放的字节数与失败原因。
 * 安全性由 `pickRemovableImages` 保证：动不到当前镜像，也动不到任何容器在用的镜像。
 */
export async function pruneLocalImages(): Promise<{
  removed: LocalImage[];
  freed: number;
  errors: string[];
  helperRemoved: boolean;
}> {
  // 更新容器（gongdi-updater）是一次性的：跑完就退出，留着只为方便查日志。
  // 清理镜像时顺手把它删掉，否则它会把「上一次更新用的那个镜像」一直占住。
  let helperRemoved = false;
  try {
    const j = await dockerReq("GET", `/containers/${HELPER_NAME}/json`);
    if (j?.State && j.State.Running === false) {
      await dockerReq("DELETE", `/containers/${HELPER_NAME}?force=true`);
      helperRemoved = true;
      await appendUpdateLog("[应用] 已删除更新容器 gongdi-updater（它只是一次性的临时容器）");
    }
  } catch {
    /* 没有这个容器就跳过 */
  }
  const { removable } = await listLocalImages();
  const removed: LocalImage[] = [];
  const errors: string[] = [];
  let freed = 0;
  for (const img of removable) {
    try {
      await dockerReq("DELETE", `/images/${encodeURIComponent(img.id)}?force=1&noprune=1`);
      removed.push(img);
      freed += img.size;
    } catch (e) {
      errors.push(`${img.tags[0] || img.id.slice(7, 19)}：${e instanceof Error ? e.message : String(e)}`);
    }
  }
  await logServer("info", "清理旧镜像", { count: removed.length, freed, errors: errors.length });
  await appendUpdateLog(
    removed.length
      ? `[应用] 已清理 ${removed.length} 个旧镜像，释放约 ${(freed / 1048576).toFixed(0)} MB`
      : "[应用] 清理旧镜像：没有可清理的镜像",
  );
  return { removed, freed, errors, helperRemoved };
}

function uniqueImages(list: unknown[]): string[] {
  const out: string[] = [];
  for (const x of list) {
    const s = String(x || "").trim();
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

export const UPDATER_SCRIPT = `const http=require("node:http");
const fs=require("node:fs");
const nodePath=require("node:path");
const DATA_DIR=process.env.DATA_DIR||"/data";
// 进展既写 stdout（docker logs gongdi-updater 能看到），也追加到 data/logs/update.log。
// 教训（1.7.10）：这段脚本以前是**语法错误**的 —— 模板字符串里的 \\n 变成了真换行，
// 生成的 .cjs 里字符串字面量跨行，node 直接 SyntaxError 退出，容器又被 AutoRemove 删掉，
// 于是「更新已受理」之后再无任何痕迹、容器也没换。第一步就先落一行「我起来了」。
function log(msg){
  const line=new Date().toISOString()+" "+msg;
  try{console.log(line)}catch(e){}
  try{fs.mkdirSync(nodePath.join(DATA_DIR,"logs"),{recursive:true})}catch(e){}
  try{fs.appendFileSync(nodePath.join(DATA_DIR,"logs","update.log"),line+"\\n")}catch(e){}
}
function fail(msg){
  log("更新失败: "+msg);
  try{fs.writeFileSync(nodePath.join(DATA_DIR,".gondi-update-error.txt"),new Date().toISOString()+"\\n"+msg+"\\n")}catch(e){}
}
function docker(method,apiPath,body){
  return new Promise((resolve,reject)=>{
    let data=body==null?null:typeof body==="string"?body:JSON.stringify(body);
    if(data==null&&method==="POST")data="{}";
    const req=http.request({socketPath:"/var/run/docker.sock",path:apiPath,method,headers:data?{"Content-Type":"application/json","Content-Length":Buffer.byteLength(data)}:{}},res=>{
      const chunks=[];
      res.on("data",c=>chunks.push(c));
      res.on("end",()=>{
        const raw=Buffer.concat(chunks).toString("utf8");
        if(res.statusCode>=300) return reject(new Error(raw.slice(0,400)||String(res.statusCode)));
        if(!raw) return resolve({});
        try{resolve(JSON.parse(raw))}catch{resolve({raw})}
      });
    });
    req.on("error",reject);
    if(data) req.write(data);
    req.end();
  });
}
(async()=>{
  // 任务优先从环境变量拿（不依赖任何挂载）；兼容旧写法：读 data/.gondi-next.json
  let job=null;
  if(process.env.GONGDI_JOB){
    try{job=JSON.parse(process.env.GONGDI_JOB)}catch(e){throw new Error("更新任务解析失败："+String((e&&e.message)||e))}
  }
  if(!job) job=JSON.parse(fs.readFileSync(nodePath.join(DATA_DIR,".gondi-next.json"),"utf8"));
  if(!job||!job.create) throw new Error("更新任务为空（缺少容器配置）");
  log("更新容器已启动：新镜像 "+String(job.create.Image||"")+"，待替换容器 "+String(job.oldId||"").slice(0,12));
  await new Promise(r=>setTimeout(r,2500));
  const nextName=job.name+"-next";
  try{await docker("DELETE","/containers/"+encodeURIComponent(nextName)+"?force=true")}catch(e){}
  // 先用临时名把新容器创建出来：镜像/挂载/配置有问题会在这一步失败，
  // 此时老容器还活着、业务不中断（原实现先删老容器，创建一失败就直接没服务了）。
  const created=await docker("POST","/containers/create?name="+encodeURIComponent(nextName),job.create);
  log("新容器已创建 "+String(created.Id||"").slice(0,12)+"（临时名 "+nextName+"）");
  // 2) 停老容器（先不删，留着回滚），把端口让出来
  let oldStopped=false;
  try{await docker("POST","/containers/"+job.oldId+"/stop?t=12");oldStopped=true;log("老容器已停止")}catch(e){log("停老容器失败（继续尝试启动新容器）："+String((e&&e.message)||e))}
  // 3) 启动新容器；起不来就把老容器拉回来（回滚），保证业务不中断
  try{
    await docker("POST","/containers/"+created.Id+"/start");
    log("新容器已启动");
  }catch(err){
    try{await docker("DELETE","/containers/"+created.Id+"?force=true")}catch(e){}
    if(oldStopped){try{await docker("POST","/containers/"+job.oldId+"/start")}catch(e){log("回滚启动老容器也失败了")}}
    throw new Error("新容器启动失败，已回滚到原容器："+String((err&&err.message)||err));
  }
  // 4) 新容器已经在跑：移除老容器，再让新容器接管正式名字
  try{await docker("DELETE","/containers/"+job.oldId+"?force=true")}catch(e){}
  await docker("POST","/containers/"+created.Id+"/rename?name="+encodeURIComponent(job.name));
  log("已接管名称 "+job.name);
  // 5) 顺手清掉上一个版本的镜像：老容器已经删了，这份镜像再没人用，
  //    留着只会让 NAS 每更新一次就多占几百 MB。删错了也不会影响新容器（层是共享的、按引用计数）。
  try{
    const oldImage=job.oldImage||"";
    const newImage=(await docker("GET","/images/"+encodeURIComponent(job.create.Image)+"/json")).Id||"";
    if(oldImage&&(!newImage||oldImage!==newImage)){
      const r=await docker("DELETE","/images/"+encodeURIComponent(oldImage)+"?force=1&noprune=1");
      const mb=Math.round(((r&&r.Size)||0)/1048576);
      log("已清理旧镜像 "+(oldImage+"").slice(0,19)+(mb?"（约 "+mb+" MB）":""));
    }
  }catch(e){
    log("清理旧镜像失败（不影响本次更新）: "+String((e&&e.message)||e));
  }
  log("更新成功，已启动 "+job.name);
  try{fs.unlinkSync(nodePath.join(DATA_DIR,".gondi-next.json"))}catch(e){}
  try{fs.unlinkSync(nodePath.join(DATA_DIR,".gondi-updater.cjs"))}catch(e){}
})().catch(e=>{
  fail(String((e&&e.message)||e));
  process.exit(1);
});
`;

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
  await writeFile("/data/.gondi-next.json", JSON.stringify(job));
  await writeFile("/data/.gongdi-updater.cjs", UPDATER_SCRIPT);
  try {
    await dockerReq("POST", `/containers/${HELPER_NAME}/stop?t=2`);
  } catch {}
  try {
    await dockerReq("DELETE", `/containers/${HELPER_NAME}?force=true`);
  } catch {}
  const helperBinds = binds.filter(
    (b: string) => String(b).includes(":/data") || String(b).includes("docker.sock"),
  );
  if (!helperBinds.some((b: string) => String(b).includes(":/data")))
    helperBinds.unshift("/vol1/1000/docker/attendance/data:/data");
  if (!helperBinds.some((b: string) => String(b).includes("docker.sock"))) helperBinds.push(`${SOCK}:${SOCK}`);
  const helper = await dockerReq("POST", `/containers/create?name=${HELPER_NAME}`, {
    body: {
      Image: image,
      Entrypoint: [],
      Cmd: ["node", "-e", UPDATER_SCRIPT],
      WorkingDir: "/",
      Env: [`GONGDI_JOB=${JSON.stringify(job)}`, "DATA_DIR=/data"],
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
