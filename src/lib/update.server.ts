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
export async function readUpdateLog(): Promise<{ log: string; errorText: string; note: string }> {
  const root = dataDir();
  if (!root) return { log: "", errorText: "", note: "未开启 NAS 持久化，本机运行没有更新日志" };
  const [log, errorText] = await Promise.all([
    tailFile(join(root, "logs", "update.log")),
    tailFile(join(root, ".gongdi-update-error.txt")),
  ]);
  return { log, errorText, note: log || errorText ? "" : "还没有更新记录（data/logs/update.log 不存在）" };
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

async function hasDockerSock(): Promise<boolean> {
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
function docker(method,path,body){
  return new Promise((resolve,reject)=>{
    let data=body==null?null:typeof body==="string"?body:JSON.stringify(body);
    if(data==null&&method==="POST")data="{}";
    const req=http.request({socketPath:"/var/run/docker.sock",path,method,headers:data?{"Content-Type":"application/json","Content-Length":Buffer.byteLength(data)}:{}},res=>{
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
  const job=JSON.parse(fs.readFileSync("/data/.gongdi-next.json","utf8"));
  await new Promise(r=>setTimeout(r,2500));
  const nextName=job.name+"-next";
  try{await docker("DELETE","/containers/"+encodeURIComponent(nextName)+"?force=true")}catch(e){}
  // 先用临时名把新容器创建出来：镜像/挂载/配置有问题会在这一步失败，
  // 此时老容器还活着、业务不中断（原实现先删老容器，创建一失败就直接没服务了）。
  const created=await docker("POST","/containers/create?name="+encodeURIComponent(nextName),job.create);
  // 2) 停老容器（先不删，留着回滚），把端口让出来
  let oldStopped=false;
  try{await docker("POST","/containers/"+job.oldId+"/stop?t=12");oldStopped=true}catch(e){}
  // 3) 启动新容器；起不来就把老容器拉回来（回滚），保证业务不中断
  try{
    await docker("POST","/containers/"+created.Id+"/start");
  }catch(err){
    try{await docker("DELETE","/containers/"+created.Id+"?force=true")}catch(e){}
    if(oldStopped){try{await docker("POST","/containers/"+job.oldId+"/start")}catch(e){}}
    throw new Error("新容器启动失败，已回滚到原容器："+String((err&&err.message)||err));
  }
  // 4) 新容器已经在跑：移除老容器，再让新容器接管正式名字
  try{await docker("DELETE","/containers/"+job.oldId+"?force=true")}catch(e){}
  await docker("POST","/containers/"+created.Id+"/rename?name="+encodeURIComponent(job.name));
  try{fs.mkdirSync("/data/logs",{recursive:true})}catch(e){}
  try{fs.appendFileSync("/data/logs/update.log",new Date().toISOString()+" 更新成功，已启动 "+job.name+"\n")}catch(e){}
  try{fs.unlinkSync("/data/.gongdi-next.json")}catch(e){}
  try{fs.unlinkSync("/data/.gongdi-updater.cjs")}catch(e){}
})().catch(e=>{
  const msg=String((e&&e.message)||e);
  try{fs.writeFileSync("/data/.gongdi-update-error.txt",new Date().toISOString()+"\n"+msg+"\n"+String((e&&e.stack)||""))}catch(e){}
  try{fs.mkdirSync("/data/logs",{recursive:true})}catch(e){}
  try{fs.appendFileSync("/data/logs/update.log",new Date().toISOString()+" 更新失败: "+msg+"\n")}catch(e){}
  process.exit(1);
});
`;

async function applyDockerUpdate(): Promise<{ ok: boolean; error?: string; restarting?: boolean }> {
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
  const candidates = uniqueImages([
    process.env.GONGDI_IMAGE,
    /ghcr|gongdi-ledger/i.test(current) && current.includes("/")
      ? current.includes(":")
        ? current.replace(/:[^:]+$/, ":latest")
        : `${current}:latest`
      : "",
    DEFAULT_IMAGE,
    "ghcr.1ms.run/qq987985/gongdi-ledger:latest",
    "ghcr.io/qq987985/gongdi-ledger:latest",
  ]);
  let lastErr = "拉镜像失败";
  for (const ref of candidates) {
    try {
      await pullImage(ref);
      image = ref;
      lastErr = "";
      await logServer("info", "拉取镜像成功", { ref });
      await appendUpdateLog(`[应用] 已拉取镜像 ${ref}`);
      break;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      await logServer("warn", "拉取镜像失败", { ref, error: lastErr });
    }
  }
  if (!image)
    throw new Error(lastErr.slice(0, 500) || "拉镜像失败。请确认 Packages 是 Public，或到飞牛再运行一次「一键拉取」。");
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
  await writeFile("/data/.gongdi-next.json", JSON.stringify({ oldId: me.Id, name, create }));
  await writeFile("/data/.gongdi-updater.cjs", UPDATER_SCRIPT);
  try {
    await dockerReq("POST", "/containers/gongdi-updater/stop?t=2");
  } catch {}
  try {
    await dockerReq("DELETE", "/containers/gongdi-updater?force=true");
  } catch {}
  const helperBinds = binds.filter(
    (b: string) => String(b).includes(":/data") || String(b).includes("docker.sock"),
  );
  if (!helperBinds.some((b: string) => String(b).includes(":/data")))
    helperBinds.unshift("/vol1/1000/docker/attendance/data:/data");
  if (!helperBinds.some((b: string) => String(b).includes("docker.sock"))) helperBinds.push(`${SOCK}:${SOCK}`);
  const helper = await dockerReq("POST", "/containers/create?name=gongdi-updater", {
    body: {
      Image: image,
      Cmd: ["node", "/data/.gongdi-updater.cjs"],
      WorkingDir: "/data",
      HostConfig: { Binds: helperBinds, AutoRemove: true, RestartPolicy: { Name: "no" } },
    },
  });
  await dockerReq("POST", `/containers/${helper.Id}/start`);
  await logServer("info", "已启动更新容器，稍后自动替换", { image, helper: helper.Id });
  await appendUpdateLog(`[应用] 已启动更新容器，约 10 秒后替换 ${name}（镜像 ${image}）`);
  return { ok: true, restarting: true };
}

async function applyWindowsUpdate(): Promise<{ ok: boolean; error?: string; restarting?: boolean }> {
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

export async function applyUpdate(): Promise<{ ok: boolean; error?: string; restarting?: boolean }> {
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

let updateJobState: UpdateJobState = { running: false, startedAt: 0, doneAt: 0, ok: false, error: "", step: "" };

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
export function startUpdateJob(run: () => Promise<{ ok: boolean; error?: string; restarting?: boolean }> = applyUpdate): UpdateJobState {
  if (updateJobState.running) return updateJobStatus();
  updateJobState = { running: true, startedAt: Date.now(), doneAt: 0, ok: false, error: "", step: "正在更新（拉镜像/准备替换）" };
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
      };
      return logServer(r.ok ? "info" : "warn", r.ok ? "一键更新已受理" : "一键更新失败", { error: r.error || "" }).then(() =>
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
