/**
 * Docker 引擎交互：dockerReq 原始请求、镜像拉取/比对/清理、容器自省。
 * 从 update.server.ts 原样搬出，行为不变。
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { logServer } from "../log.server";
import { appendUpdateLog } from "./log";
import { DEFAULT_IMAGE, HELPER_NAME, SOCK } from "./consts";

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

export function dockerReq(
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

export async function selfContainer(): Promise<any> {
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

export async function pullImage(ref: string): Promise<void> {
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
export async function imageIdOf(ref: string): Promise<string> {
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

export function uniqueImages(list: unknown[]): string[] {
  const out: string[] = [];
  for (const x of list) {
    const s = String(x || "").trim();
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}
