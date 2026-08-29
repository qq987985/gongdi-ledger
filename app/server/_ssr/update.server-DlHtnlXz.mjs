import { readVersionText } from "./nas-fs.server-huEdTgug.mjs";
import { _ as isNewerVersion, v as parseChangelog } from "./router-DxdzlCp3.mjs";
import { join } from "node:path";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
//#region node_modules/.nitro/vite/services/ssr/assets/update.server-DlHtnlXz.js
var REPO = (process.env.UPDATE_REPO || "qq987985/gongdi-ledger").trim();
function portableHome() {
	const h = process.env.GONGDI_HOME?.trim();
	if (h) return h;
	if (process.env.GONGDI_PORTABLE === "1") return process.cwd();
	return "";
}
function isPortable() {
	return Boolean(portableHome());
}
async function localVersion() {
	const text = await readVersionText();
	return parseChangelog(text || "1.0.2").current;
}
async function fetchLatest() {
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": "gongdi-ledger"
		} });
		if (res.status === 404) return { error: "GitHub 上还没有 Windows 安装包（需要先发一次 Release）" };
		if (!res.ok) return { error: `GitHub ${res.status}` };
		const data = await res.json();
		const asset = (data.assets || []).find((a) => /windows/i.test(a.name) && a.name.endsWith(".zip")) || (data.assets || []).find((a) => a.name.endsWith(".zip"));
		let remote = String(data.tag_name || data.name || "").replace(/^win-/, "");
		if (!/v?\d+(?:\.\d+)*/.test(remote)) {
			const m = String(data.body || "").match(/\d+\.\d+\.\d+/) || String(data.body || "").match(/v?\d+/);
			if (m) remote = m[0];
		}
		return {
			remote: remote || "latest",
			url: asset?.browser_download_url || "",
			name: asset?.name || "",
			size: asset?.size || 0,
			notes: data.body || "",
			page: data.html_url || ""
		};
	} catch {
		return { error: "无法连接 GitHub，稍后再试" };
	}
}
async function checkUpdate() {
	const local = await localVersion();
	if (!isPortable()) return {
		portable: false,
		local,
		remote: "",
		newer: false,
		error: ""
	};
	const latest = await fetchLatest();
	if ("error" in latest && latest.error) return {
		portable: true,
		local,
		remote: "",
		newer: false,
		error: latest.error
	};
	const remote = "remote" in latest ? String(latest.remote || "") : "";
	const url = "url" in latest ? String(latest.url || "") : "";
	return {
		portable: true,
		local,
		remote,
		newer: isNewerVersion(remote, local),
		url,
		name: "name" in latest ? latest.name : "",
		size: "size" in latest ? latest.size : 0,
		notes: "notes" in latest ? latest.notes : "",
		page: "page" in latest ? latest.page : "",
		error: url ? "" : "Release 里没有 Windows zip"
	};
}
async function applyUpdate() {
	const home = portableHome();
	if (!home) return {
		ok: false,
		error: "只有 Windows 解压版能点更新。NAS 请用安装包重新部署。"
	};
	const info = await checkUpdate();
	if (info.error || !info.url) return {
		ok: false,
		error: info.error || "没有下载地址"
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
	return { ok: true };
}
//#endregion
export { applyUpdate, checkUpdate, isPortable };
