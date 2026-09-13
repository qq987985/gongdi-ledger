/**
 * 版本检查：本地版本、GitHub 远端版本竞速、镜像内版本读取、拉取候选排序。
 * 从 update.server.ts 原样搬出，行为不变。
 */
import { readVersionText } from "../nas-fs.server";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { DEFAULT_IMAGE, REPO, SOCK } from "./consts";
import { dockerReq, uniqueImages } from "./docker";

let cache: { at: number; data: RemoteInfo | null } = { at: 0, data: null };

export function portableHome(): string {
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

export function isNewerVersion(remote: string, local: string): boolean {
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

export async function localVersion(): Promise<string> {
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
export async function latestCommitShort(): Promise<string> {
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
export async function imageVersionOf(ref: string): Promise<string> {
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
