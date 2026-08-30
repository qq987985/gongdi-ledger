import { readVersionText } from "./nas-fs.server-huEdTgug.mjs";
import { join } from "node:path";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import http from "node:http";

var REPO = (process.env.UPDATE_REPO || "qq987985/gongdi-ledger").trim();
var DEFAULT_IMAGE = (process.env.GONGDI_IMAGE || "ghcr.1ms.run/qq987985/gongdi-ledger:latest").trim();
var SOCK = "/var/run/docker.sock";
var cache = {
	at: 0,
	data: null
};

function portableHome() {
	const h = process.env.GONGDI_HOME?.trim();
	if (h) return h;
	if (process.env.GONGDI_PORTABLE === "1") return process.cwd();
	return "";
}
function isPortable() {
	if (process.env.GONGDI_PORTABLE === "1") return true;
	return process.platform === "win32" && Boolean(portableHome());
}
function parseRemoteTag(s) {
	return String(s || "").trim().replace(/^win-/, "").replace(/^v/i, "");
}
function normalizeVersion(v) {
	const n = parseRemoteTag(v);
	if (/^\d+$/.test(n)) return Number(n) >= 10 ? `0.0.${n}` : `${n}.0.0`;
	return n || "0.0.0";
}
function isNewerVersion(remote, local) {
	const a = normalizeVersion(remote).split(".").map((x) => parseInt(x, 10) || 0);
	const b = normalizeVersion(local).split(".").map((x) => parseInt(x, 10) || 0);
	while (a.length < 3) a.push(0);
	while (b.length < 3) b.push(0);
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return false;
}
function ghHeaders(extra = {}) {
	const h = {
		Accept: "application/vnd.github+json",
		"User-Agent": "gongdi-ledger",
		...extra
	};
	const tok = (process.env.UPDATE_TOKEN || process.env.GITHUB_TOKEN || "").trim();
	if (tok) h.Authorization = `Bearer ${tok}`;
	return h;
}
async function hasDockerSock() {
	try {
		await access(SOCK, fsConstants.R_OK);
		return true;
	} catch {
		return false;
	}
}
async function localVersion() {
	const text = await readVersionText();
	const first = String(text || "").split(/\r?\n/).find((l) => l.trim()) || "1.0.2";
	return parseRemoteTag(first);
}
async function fetchGithub() {
	if (cache.data && Date.now() - cache.at < 8 * 60 * 1000) return cache.data;
	const out = {
		remote: "",
		url: "",
		name: "",
		size: 0,
		notes: "",
		page: ""
	};
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: ghHeaders() });
		if (res.ok) {
			const data = await res.json();
			const asset = (data.assets || []).find((a) => /windows/i.test(a.name) && a.name.endsWith(".zip")) || (data.assets || []).find((a) => a.name.endsWith(".zip"));
			out.remote = parseRemoteTag(data.tag_name || data.name || "");
			if (!/\d+(?:\.\d+)*/.test(out.remote)) {
				const m = String(data.body || "").match(/\d+\.\d+\.\d+/);
				if (m) out.remote = m[0];
			}
			out.url = asset?.browser_download_url || "";
			out.name = asset?.name || "";
			out.size = asset?.size || 0;
			out.notes = data.body || "";
			out.page = data.html_url || "";
		}
	} catch {}
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}/contents/VERSION.txt`, { headers: ghHeaders({ Accept: "application/vnd.github.raw" }) });
		if (res.ok) {
			const first = (await res.text()).split(/\r?\n/).find((l) => l.trim()) || "";
			const raw = parseRemoteTag(first);
			if (raw && (!out.remote || isNewerVersion(raw, out.remote))) out.remote = raw;
		}
	} catch {}
	if (!out.remote) try {
		const res = await fetch(`https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`, { headers: { "User-Agent": "gongdi-ledger" } });
		if (res.ok) {
			const first = (await res.text()).split(/\r?\n/).find((l) => l.trim()) || "";
			const raw = parseRemoteTag(first);
			if (raw && (!out.remote || isNewerVersion(raw, out.remote))) out.remote = raw;
		}
	} catch {}
	cache = {
		at: Date.now(),
		data: out
	};
	return out;
}
async function checkUpdate() {
	const local = await localVersion();
	const portable = isPortable();
	const docker = await hasDockerSock();
	const latest = await fetchGithub();
	const remote = latest.remote || "";
	const newer = remote ? isNewerVersion(remote, local) : false;
	let mode = "manual";
	if (portable) mode = "windows";
	else if (docker) mode = "docker";
	const canApply = newer && ((mode === "windows" && Boolean(latest.url)) || mode === "docker");
	let error = "";
	let hint = "";
	if (!remote) error = "暂时连不上 GitHub。请把仓库设成 Public，和 Packages 一样。只公开镜像不够。";
	else if (mode === "windows" && newer && !latest.url) {
		error = "";
		hint = "GitHub 已有新版本，Windows 安装包还在打包，稍后再点更新";
	} else if (mode === "manual" && newer) hint = "飞牛请先运行一次「一键拉取」，这次会打开自动更新。以后 GitHub 出新版就能在软件里点更新。";
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
		hint
	};
}
function dockerReq(method, path, opts = {}) {
	return new Promise((resolve, reject) => {
		const data = opts.body == null ? null : typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
		const req = http.request({
			socketPath: SOCK,
			path,
			method,
			headers: data ? {
				"Content-Type": "application/json",
				"Content-Length": Buffer.byteLength(data)
			} : {}
		}, (res) => {
			const chunks = [];
			res.on("data", (c) => chunks.push(c));
			res.on("end", () => {
				const raw = Buffer.concat(chunks).toString("utf8");
				if (res.statusCode >= 300) return reject(new Error(raw.slice(0, 400) || String(res.statusCode)));
				if (opts.stream) {
					for (const line of raw.split("\n").filter(Boolean)) try {
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
		});
		req.on("error", reject);
		if (data) req.write(data);
		req.end();
	});
}
function splitImage(ref) {
	const s = String(ref || "").trim();
	const i = s.lastIndexOf(":");
	if (i <= 0 || s.slice(i).includes("/")) return {
		repo: s || DEFAULT_IMAGE,
		tag: "latest"
	};
	return {
		repo: s.slice(0, i),
		tag: s.slice(i + 1)
	};
}
async function selfContainer() {
	const host = (process.env.HOSTNAME || "").trim();
	if (host) try {
		return await dockerReq("GET", `/containers/${encodeURIComponent(host)}/json`);
	} catch {}
	try {
		const cg = await readFile("/proc/self/cgroup", "utf8");
		const m = cg.match(/([0-9a-f]{64})/) || cg.match(/docker[-/]([0-9a-f]{12,})/i);
		if (m) return await dockerReq("GET", `/containers/${m[1]}/json`);
	} catch {}
	const list = await dockerReq("GET", "/containers/json");
	const mine = (list || []).find((c) => (c.Names || []).some((n) => n.replace(/^\//, "") === "attendance-app"));
	if (mine) return await dockerReq("GET", `/containers/${mine.Id}/json`);
	throw new Error("找不到当前容器");
}
async function pullImage(ref) {
	const { repo, tag } = splitImage(ref);
	await dockerReq("POST", `/images/create?fromImage=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`, { stream: true });
}
const HELPER = `const http=require("node:http");
const fs=require("node:fs");
function docker(method,path,body){
  return new Promise((resolve,reject)=>{
    const data=body==null?null:JSON.stringify(body);
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
  try{await docker("POST","/containers/"+job.oldId+"/stop?t=12")}catch(e){}
  try{await docker("DELETE","/containers/"+job.oldId+"?force=true")}catch(e){}
  const created=await docker("POST","/containers/create?name="+encodeURIComponent(job.name),job.create);
  await docker("POST","/containers/"+created.Id+"/start");
  try{fs.unlinkSync("/data/.gongdi-next.json")}catch(e){}
  try{fs.unlinkSync("/data/.gongdi-updater.cjs")}catch(e){}
})().catch(e=>{
  try{fs.writeFileSync("/data/.gongdi-update-error.txt",String(e&&e.stack||e))}catch(e){}
  process.exit(1);
});
`;
async function applyDockerUpdate() {
	if (!await hasDockerSock()) return {
		ok: false,
		error: "还不能自动更新。请到飞牛运行一次「一键拉取」，以后就能在软件里点更新。"
	};
	const me = await selfContainer();
	const name = String(me.Name || "/attendance-app").replace(/^\//, "") || "attendance-app";
	let image = DEFAULT_IMAGE;
	const current = String(me.Config?.Image || "");
	if (/ghcr|gongdi-ledger/i.test(current) && current.includes("/")) image = current.includes(":") ? current.replace(/:[^:]+$/, ":latest") : `${current}:latest`;
	if (/^gongdi-ledger:/.test(current)) image = DEFAULT_IMAGE;
	if (process.env.GONGDI_IMAGE) image = process.env.GONGDI_IMAGE.trim();
	try {
		await pullImage(image);
	} catch (e) {
		if (image !== DEFAULT_IMAGE) {
			image = DEFAULT_IMAGE;
			await pullImage(image);
		} else throw e;
	}
	const binds = [...(me.HostConfig?.Binds || [])];
	if (!binds.some((b) => String(b).includes("docker.sock"))) binds.push(`${SOCK}:${SOCK}`);
	const hostConfig = {
		...me.HostConfig,
		Binds: binds
	};
	delete hostConfig.Mounts;
	const env = [...(me.Config?.Env || [])];
	if (!env.some((e) => String(e).startsWith("GONGDI_IMAGE="))) env.push(`GONGDI_IMAGE=${image}`);
	const create = {
		Image: image,
		Env: env,
		Labels: me.Config?.Labels,
		ExposedPorts: me.Config?.ExposedPorts,
		WorkingDir: me.Config?.WorkingDir,
		Cmd: me.Config?.Cmd,
		Entrypoint: me.Config?.Entrypoint,
		HostConfig: hostConfig,
		NetworkingConfig: { EndpointsConfig: me.NetworkSettings?.Networks || {} }
	};
	await writeFile("/data/.gongdi-next.json", JSON.stringify({
		oldId: me.Id,
		name,
		create
	}));
	await writeFile("/data/.gongdi-updater.cjs", HELPER);
	try {
		await dockerReq("POST", "/containers/gongdi-updater/stop?t=2");
	} catch {}
	try {
		await dockerReq("DELETE", "/containers/gongdi-updater?force=true");
	} catch {}
	const helperBinds = binds.filter((b) => String(b).includes(":/data") || String(b).includes("docker.sock"));
	if (!helperBinds.some((b) => String(b).includes(":/data"))) helperBinds.unshift("/vol1/1000/docker/attendance/data:/data");
	if (!helperBinds.some((b) => String(b).includes("docker.sock"))) helperBinds.push(`${SOCK}:${SOCK}`);
	const helper = await dockerReq("POST", "/containers/create?name=gongdi-updater", {
		Image: image,
		Cmd: ["node", "/data/.gongdi-updater.cjs"],
		WorkingDir: "/data",
		HostConfig: {
			Binds: helperBinds,
			AutoRemove: true,
			RestartPolicy: { Name: "no" }
		}
	});
	await dockerReq("POST", `/containers/${helper.Id}/start`);
	return {
		ok: true,
		restarting: true
	};
}
async function applyWindowsUpdate() {
	const home = portableHome();
	if (!home) return {
		ok: false,
		error: "找不到 Windows 安装目录"
	};
	const info = await checkUpdate();
	if (!info.url) return {
		ok: false,
		error: info.hint || info.error || "没有 Windows 下载地址"
	};
	const tmp = join(tmpdir(), "gongdi-upd");
	await rm(tmp, {
		recursive: true,
		force: true
	});
	await mkdir(tmp, { recursive: true });
	const zipPath = join(tmp, "gongdi-windows.zip");
	const res = await fetch(info.url, {
		headers: {
			"User-Agent": "gongdi-ledger",
			Accept: "application/octet-stream"
		},
		redirect: "follow"
	});
	if (!res.ok) return {
		ok: false,
		error: `下载失败 ${res.status}`
	};
	await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
	try {
		await stat(home);
	} catch {
		return {
			ok: false,
			error: "安装目录不存在"
		};
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
	spawn("cmd.exe", ["/c", bat], {
		detached: true,
		stdio: "ignore",
		cwd: home,
		windowsHide: false
	}).unref();
	setTimeout(() => process.exit(0), 800);
	return {
		ok: true,
		restarting: true
	};
}
async function applyUpdate() {
	if (isPortable()) return applyWindowsUpdate();
	if (await hasDockerSock()) return applyDockerUpdate();
	return {
		ok: false,
		error: "飞牛请先运行一次「一键拉取」。Windows 请用解压版点更新。"
	};
}
export { applyUpdate, checkUpdate, isPortable };
