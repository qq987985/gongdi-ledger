import { C as writeLedger, _ as saveBackup, b as scanPhotoFolder, c as readAudit, d as readVersionText, i as findPhotoPath, m as removePhoto, o as persistOn, p as removeDocFile, r as findDoc, s as photoFlags, t as appendAudit, u as readLedger, v as saveDoc, x as writeAudit, y as savePhoto } from "./nas-fs.server-BfxLYYRi.js";
import "./perms-DQTE-mZW.js";
import "./utils-CBhPqRT8.js";
import { a as resolveTenant, n as handleAuthPost, o as withTenant, t as ensureAccounts } from "./accounts.server-BkJv6gkQ.js";
import { f as dateYear, g as parseDateYmd, y as hasWork } from "./contracts-BSLoZOKY.js";
import { E as peopleTemplateWb, T as paymentTemplateWb, c as buildExpenseWorkbook, d as buildPeopleWorkbook, h as expenseTemplateWb, l as buildFullWorkbook, o as attendanceTemplateWb, p as contractTemplateWb, s as buildContractWorkbook, u as buildPaymentWorkbook } from "./excel-D3rRBCuB.js";
import "./store-CJN683BW.js";
import "./nas-sync-Y5Puwv5e.js";
import { t as writeCenteredXlsx } from "./xlsx-center-Cbsb08Y4.js";
import "./button-Zdwj1dRR.js";
import "./input-D73Q2_mj.js";
import { r as parseChangelog, t as AppShell } from "./shell-lLQgYICS.js";
import { HeadContent, Scripts, createFileRoute, createRootRoute, createRouter, lazyRouteComponent } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { constants } from "node:fs";
import { join } from "node:path";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { Toaster } from "sonner";
import { tmpdir } from "node:os";
import http from "node:http";
var APP_NAME = "台账";
const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#2a4a40"
			},
			{
				name: "description",
				content: "人员考勤、工资发放与合同台账"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-title",
				content: APP_NAME
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			}
		],
		links: [{
			rel: "icon",
			type: "image/svg+xml",
			href: "/favicon.svg"
		}]
	}),
	component: () => /* @__PURE__ */ jsxs("html", {
		lang: "zh-CN",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [
			/* @__PURE__ */ jsx("noscript", { children: /* @__PURE__ */ jsx("p", {
				style: {
					padding: 16,
					textAlign: "center"
				},
				children: "本系统需要浏览器允许脚本。请关闭拦截后刷新。"
			}) }),
			/* @__PURE__ */ jsx(AppShell, {}),
			/* @__PURE__ */ jsx(Toaster, {
				position: "top-center",
				richColors: true
			}),
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$11 = () => import("./routes-DHsps3Se.js");
const Route$1 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./attendance-Cq3JOSfw.js");
const Route$2 = createFileRoute("/attendance")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./audit-B1XbO4sl.js");
const Route$3 = createFileRoute("/audit")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./contracts-BL7MNvND.js");
const Route$4 = createFileRoute("/contracts")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./expenses-7rJIBGbG.js");
const Route$5 = createFileRoute("/expenses")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./files-BlMc4Cv6.js");
const Route$6 = createFileRoute("/files")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./import-C0qEs4j3.js");
const Route$7 = createFileRoute("/import")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./payments-DFDbNhE7.js");
const Route$8 = createFileRoute("/payments")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./people-CpenFcuL.js");
const Route$9 = createFileRoute("/people")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./photos-BWlWTn0e.js");
const Route$10 = createFileRoute("/photos")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./query-BhOXFvDH.js");
const Route$11 = createFileRoute("/query")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./settings-BFOwNnJ0.js");
const Route$12 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
const Route$13 = createFileRoute("/api/audit")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({ entries: [] });
		return withTenant(request, async () => Response.json({ entries: await readAudit() }), "audit.view");
	},
	POST: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const body = await request.json();
		if (!body.action?.trim()) return Response.json({ error: "缺少操作" }, { status: 400 });
		const t = await resolveTenant(request);
		return withTenant(request, async () => {
			const entry = await appendAudit({
				userId: t.user?.id || "",
				userName: t.user?.name || t.user?.username || "",
				action: body.action.trim().slice(0, 80),
				detail: String(body.detail || "").slice(0, 400),
				module: String(body.module || "").slice(0, 40)
			});
			return Response.json({
				ok: true,
				entry
			});
		});
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if ((await resolveTenant(request)).user?.role !== "admin") return Response.json({ error: "只有管理员能改操作记录" }, { status: 403 });
		const body = await request.json();
		if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
		return withTenant(request, async () => {
			await writeAudit((await readAudit()).map((e) => e.id === body.id ? {
				...e,
				action: body.action != null ? String(body.action).slice(0, 80) : e.action,
				detail: body.detail != null ? String(body.detail).slice(0, 400) : e.detail,
				module: body.module != null ? String(body.module).slice(0, 40) : e.module
			} : e));
			return Response.json({ ok: true });
		});
	},
	DELETE: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if ((await resolveTenant(request)).user?.role !== "admin") return Response.json({ error: "只有管理员能删操作记录" }, { status: 403 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const ids = (url.searchParams.get("ids") || id).split(",").filter(Boolean);
		return withTenant(request, async () => {
			await writeAudit((await readAudit()).filter((e) => !ids.includes(e.id)));
			return Response.json({ ok: true });
		});
	}
} } });
const Route$14 = createFileRoute("/api/auth")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({
			persist: false,
			needSetup: false,
			user: null,
			books: []
		});
		const data = await ensureAccounts();
		const { resolveTenant: resolveTenant$1, publicUser, memberList } = await import("./accounts.server-D-oapyL6.js");
		const { hasPerm } = await import("./perms-C_VMNqih.js");
		const t = await resolveTenant$1(request);
		const manage = Boolean(t.user && (t.user.role === "admin" || t.book?.ownerId === t.user.id || hasPerm(t.perms, "members.manage")));
		return Response.json({
			persist: true,
			needSetup: t.needSetup,
			user: t.user ? publicUser(t.user) : null,
			books: t.books,
			bookId: t.bookId,
			perms: t.perms,
			members: t.book ? memberList(t.book, data.users) : [],
			users: t.user && (t.user.role === "admin" || manage) ? data.users.map(publicUser) : []
		});
	},
	POST: async ({ request }) => {
		if (!persistOn()) return Response.json({ error: "未开启 NAS 持久化" }, { status: 400 });
		return handleAuthPost(request);
	}
} } });
const Route$15 = createFileRoute("/api/backup")({ server: { handlers: { POST: async ({ request }) => {
	if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
	const buf = Buffer.from(await request.arrayBuffer());
	return withTenant(request, async () => {
		const stamp = /* @__PURE__ */ new Date();
		const pad = (n) => String(n).padStart(2, "0");
		const fname = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}_考勤表.xlsx`;
		const path = await saveBackup(buf, fname);
		return Response.json({
			ok: true,
			filename: fname,
			path
		});
	});
} } } });
function kindOf$2(v) {
	if (v === "report" || v === "invoice" || v === "receipt" || v === "attendance" || v === "contract" || v === "expense" || v === "payout") return v;
	return null;
}
var MIME = {
	".pdf": "application/pdf",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".xml": "application/xml",
	".ofd": "application/ofd",
	".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".xls": "application/vnd.ms-excel"
};
const Route$16 = createFileRoute("/api/doc")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return new Response("not found", { status: 404 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const kind = kindOf$2(url.searchParams.get("kind"));
		if (!id || !kind) return new Response("bad request", { status: 400 });
		return withTenant(request, async () => {
			const hit = await findDoc(id, kind);
			if (!hit) return new Response("not found", { status: 404 });
			const mime = MIME[`.${(hit.fileName.split(".").pop() || "").toLowerCase()}`] || "application/octet-stream";
			return new Response(new Uint8Array(hit.buf), { headers: {
				"Content-Type": mime,
				"Content-Disposition": `inline; filename="${encodeURIComponent(hit.fileName)}"`,
				"Cache-Control": "no-store"
			} });
		});
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const form = await request.formData();
		const id = String(form.get("id") || "");
		const kind = kindOf$2(String(form.get("kind") || ""));
		const file = form.get("file");
		if (!id || !kind || !(file instanceof File)) return Response.json({ ok: false }, { status: 400 });
		const buf = Buffer.from(await file.arrayBuffer());
		const replace = String(form.get("replace") || "") === "1";
		return withTenant(request, async () => {
			const saved = await saveDoc(id, kind, buf, file.name, { replace });
			return Response.json({
				ok: true,
				fileName: saved || file.name
			});
		}, "files.edit");
	},
	DELETE: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const url = new URL(request.url);
		const id = url.searchParams.get("id") || "";
		const kind = kindOf$2(url.searchParams.get("kind"));
		if (!id || !kind) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await removeDocFile(id, kind);
			return Response.json({ ok: true });
		}, "files.edit");
	}
} } });
const Route$17 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => Response.json({
	persist: persistOn(),
	ok: true
}) } } });
const Route$18 = createFileRoute("/api/ledger")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({
			persist: false,
			empty: true
		});
		return withTenant(request, async () => {
			const data = await readLedger();
			return Response.json({
				persist: true,
				...data
			});
		});
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ persist: false }, { status: 400 });
		const body = await request.json();
		return withTenant(request, async () => {
			await writeLedger(body);
			return Response.json({ ok: true });
		}, "ledger.write");
	}
} } });
function kindOf$1(v) {
	if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
	return null;
}
const Route$19 = createFileRoute("/api/photo")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({ url: null });
		const url = new URL(request.url);
		const name = url.searchParams.get("name") || "";
		const kind = kindOf$1(url.searchParams.get("kind"));
		if (!name || !kind) return Response.json({ url: null });
		return withTenant(request, async () => {
			const hit = await findPhotoPath(name, kind);
			if (!hit) return Response.json({
				url: null,
				file: null
			});
			return Response.json({
				url: `/api/photo-file?name=${encodeURIComponent(name)}&kind=${kind}&v=${encodeURIComponent(hit.file)}`,
				file: hit.file
			});
		});
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const body = await request.json();
		const kind = kindOf$1(body.kind || null);
		if (!body.name || !kind || !body.dataUrl) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await savePhoto(body.name, kind, body.dataUrl);
			return Response.json({ ok: true });
		}, "photos.edit");
	},
	DELETE: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		const url = new URL(request.url);
		const name = url.searchParams.get("name") || "";
		const kind = kindOf$1(url.searchParams.get("kind"));
		if (!name || !kind) return Response.json({ ok: false }, { status: 400 });
		return withTenant(request, async () => {
			await removePhoto(name, kind);
			return Response.json({ ok: true });
		}, "photos.edit");
	}
} } });
function kindOf(v) {
	if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
	return null;
}
const Route$20 = createFileRoute("/api/photo-file")({ server: { handlers: { GET: async ({ request }) => {
	if (!persistOn()) return new Response("no", { status: 404 });
	const url = new URL(request.url);
	const name = url.searchParams.get("name") || "";
	const kind = kindOf(url.searchParams.get("kind"));
	if (!name || !kind) return new Response("no", { status: 404 });
	return withTenant(request, async () => {
		const hit = await findPhotoPath(name, kind);
		if (!hit) return new Response("no", { status: 404 });
		const buf = await readFile(hit.path);
		return new Response(buf, { headers: {
			"content-type": hit.mime,
			"cache-control": "private, max-age=30",
			"content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(hit.file)}`
		} });
	});
} } } });
async function namesFrom(request) {
	const q = (new URL(request.url).searchParams.get("names") || "").split("\n").filter(Boolean);
	if (request.method === "GET") return q;
	const body = await request.json().catch(() => ({}));
	if (Array.isArray(body.names) && body.names.length) return body.names.map(String).filter(Boolean);
	return q;
}
const Route$21 = createFileRoute("/api/photo-flags")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
	},
	POST: async ({ request }) => {
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }));
	}
} } });
const Route$22 = createFileRoute("/api/photo-scan")({ server: { handlers: { POST: async ({ request }) => {
	if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
	const body = await request.json().catch(() => ({}));
	return withTenant(request, async () => {
		let names = Array.isArray(body.names) ? body.names.map(String).filter(Boolean) : [];
		if (!names.length) {
			const led = await readLedger();
			names = (Array.isArray(led.people) ? led.people : []).map((p) => String(p.name || "").trim()).filter(Boolean);
		}
		return Response.json(await scanPhotoFolder(names));
	});
} } } });
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
	return String(s || "").trim().replace(/^win-/, "").replace(/^v/i, "").replace(/\s+\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s*$/, "").split(/\s+/)[0] || "";
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
		await access(SOCK, constants.R_OK);
		return true;
	} catch {
		return false;
	}
}
async function localVersion() {
	const text = await readVersionText();
	return parseRemoteTag(String(text || "").split(/\r?\n/).find((l) => l.trim()) || "1.0.2");
}
async function fetchWithTimeout(url, headers = {}, ms = 4500) {
	return fetch(url, {
		headers: {
			"User-Agent": "gongdi-ledger",
			...headers
		},
		redirect: "follow",
		signal: AbortSignal.timeout(ms)
	});
}
function firstVersionLine(text) {
	return parseRemoteTag(String(text || "").split(/\r?\n/).find((l) => l.trim()) || "");
}
function pickNewer(a, b) {
	if (!a) return b || "";
	if (!b) return a;
	return isNewerVersion(b, a) ? b : a;
}
async function versionFromResponse(res) {
	if (!res.ok) throw new Error(String(res.status));
	const text = await res.text();
	const trimmed = text.trim();
	if (trimmed.startsWith("{")) try {
		const data = JSON.parse(trimmed);
		if (data.content && data.encoding === "base64") return { remote: firstVersionLine(Buffer.from(data.content, "base64").toString("utf8")) };
		let tag = parseRemoteTag(data.tag_name || data.name || "");
		if (!/\d+(?:\.\d+)*/.test(tag)) {
			const m = String(data.body || "").match(/\d+\.\d+\.\d+/);
			if (m) tag = m[0];
		}
		if (tag) return {
			remote: tag,
			url: ((data.assets || []).find((a) => /windows/i.test(a.name) && a.name.endsWith(".zip")) || (data.assets || []).find((a) => a.name.endsWith(".zip")))?.browser_download_url || "",
			name: ((data.assets || []).find((a) => /windows/i.test(a.name) && a.name.endsWith(".zip")) || (data.assets || []).find((a) => a.name.endsWith(".zip")))?.name || "",
			size: ((data.assets || []).find((a) => /windows/i.test(a.name) && a.name.endsWith(".zip")) || (data.assets || []).find((a) => a.name.endsWith(".zip")))?.size || 0,
			notes: data.body || "",
			page: data.html_url || ""
		};
	} catch {}
	if (trimmed.startsWith("<")) throw new Error("html");
	const remote = firstVersionLine(text);
	if (!remote) throw new Error("empty");
	return { remote };
}
async function raceSources(urls, headersFor) {
	return await new Promise((resolve) => {
		let left = urls.length;
		let best = null;
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			resolve(best);
		};
		if (!urls.length) return finish();
		for (const url of urls) fetchWithTimeout(url, headersFor(url)).then(versionFromResponse).then((hit) => {
			if (!(hit && hit.remote)) return;
			best = best ? {
				...best,
				...hit,
				remote: pickNewer(best.remote, hit.remote),
				url: hit.url || best.url,
				name: hit.name || best.name,
				size: hit.size || best.size,
				notes: hit.notes || best.notes,
				page: hit.page || best.page
			} : {
				url: "",
				name: "",
				size: 0,
				notes: "",
				page: "",
				...hit
			};
			setTimeout(finish, 500);
		}).catch(() => {}).finally(() => {
			left--;
			if (left <= 0) finish();
		});
		setTimeout(finish, 5500);
	});
}
async function fetchGithub(fresh = false) {
	if (!fresh && cache.data && cache.data.remote && Date.now() - cache.at < 120 * 1e3) return cache.data;
	const out = {
		remote: "",
		url: "",
		name: "",
		size: 0,
		notes: "",
		page: ""
	};
	const versionUrls = [
		`https://api.github.com/repos/${REPO}/contents/VERSION.txt`,
		`https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
		`https://gh-proxy.com/https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
		`https://ghfast.top/https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
		`https://gh.ddlc.top/https://raw.githubusercontent.com/${REPO}/main/VERSION.txt`,
		`https://cdn.jsdelivr.net/gh/${REPO}@main/VERSION.txt`,
		`https://fastly.jsdelivr.net/gh/${REPO}@main/VERSION.txt`,
		`https://cdn.jsdmirror.com/gh/${REPO}@main/VERSION.txt`
	];
	const releaseUrls = [
		`https://api.github.com/repos/${REPO}/releases/latest`,
		`https://gh-proxy.com/https://api.github.com/repos/${REPO}/releases/latest`,
		`https://ghfast.top/https://api.github.com/repos/${REPO}/releases/latest`
	];
	const headersFor = (url) => {
		if (url.includes("api.github.com") && url.includes("/contents/")) return ghHeaders({ Accept: "application/vnd.github.raw" });
		if (url.includes("api.github.com")) return ghHeaders();
		return { "User-Agent": "gongdi-ledger" };
	};
	const [fromFile, fromRelease] = await Promise.all([raceSources(versionUrls, headersFor), raceSources(releaseUrls, headersFor)]);
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
	if (out.remote) cache = {
		at: Date.now(),
		data: out
	};
	else cache = {
		at: 0,
		data: null
	};
	return out;
}
async function checkUpdate(fresh = false) {
	const local = await localVersion();
	const portable = isPortable();
	const docker = await hasDockerSock();
	const latest = await fetchGithub(fresh);
	const remote = latest.remote || "";
	const newer = remote ? isNewerVersion(remote, local) : false;
	let mode = "manual";
	if (portable) mode = "windows";
	else if (docker) mode = "docker";
	const canApply = newer && (mode === "windows" && Boolean(latest.url) || mode === "docker");
	let error = "";
	let hint = "";
	if (!remote) error = "暂时连不上 GitHub。仓库已经公开的话，多半是飞牛访问 GitHub 被拦了，点「检查更新」再试一次。";
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
				if ((res.statusCode || 0) >= 300) return reject(new Error(raw.slice(0, 400) || String(res.statusCode)));
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
	const mine = (await dockerReq("GET", "/containers/json") || []).find((c) => (c.Names || []).some((n) => n.replace(/^\//, "") === "attendance-app"));
	if (mine) return await dockerReq("GET", `/containers/${mine.Id}/json`);
	throw new Error("找不到当前容器");
}
async function pullImage(ref) {
	const { repo, tag } = splitImage(ref);
	await dockerReq("POST", `/images/create?fromImage=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`, { stream: true });
}
function uniqueImages(list) {
	const out = [];
	for (const x of list) {
		const s = String(x || "").trim();
		if (s && !out.includes(s)) out.push(s);
	}
	return out;
}
var HELPER = `const http=require("node:http");
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
	const current = String(me.Config?.Image || "");
	let image = "";
	const candidates = uniqueImages([
		process.env.GONGDI_IMAGE,
		/ghcr|gongdi-ledger/i.test(current) && current.includes("/") ? current.includes(":") ? current.replace(/:[^:]+$/, ":latest") : `${current}:latest` : "",
		DEFAULT_IMAGE,
		"ghcr.1ms.run/qq987985/gongdi-ledger:latest",
		"ghcr.io/qq987985/gongdi-ledger:latest"
	]);
	let lastErr = "拉镜像失败";
	for (const ref of candidates) try {
		await pullImage(ref);
		image = ref;
		lastErr = "";
		break;
	} catch (e) {
		lastErr = e instanceof Error ? e.message : String(e);
	}
	if (!image) throw new Error(lastErr.slice(0, 180) || "拉镜像失败。请确认 Packages 是 Public，或到飞牛再运行一次「一键拉取」。");
	const binds = [...me.HostConfig?.Binds || []];
	if (!binds.some((b) => String(b).includes("docker.sock"))) binds.push(`${SOCK}:${SOCK}`);
	const hostConfig = {
		...me.HostConfig,
		Binds: binds
	};
	delete hostConfig.Mounts;
	const env = [...me.Config?.Env || []];
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
	await dockerReq("POST", `/containers/${(await dockerReq("POST", "/containers/create?name=gongdi-updater", {
		Image: image,
		Cmd: ["node", "/data/.gongdi-updater.cjs"],
		WorkingDir: "/data",
		HostConfig: {
			Binds: helperBinds,
			AutoRemove: true,
			RestartPolicy: { Name: "no" }
		}
	})).Id}/start`);
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
	const urls = uniqueImages([
		info.url,
		`https://github.com/${REPO}/releases/latest/download/gongdi-windows.zip`,
		`https://gh-proxy.com/https://github.com/${REPO}/releases/latest/download/gongdi-windows.zip`,
		`https://ghfast.top/https://github.com/${REPO}/releases/latest/download/gongdi-windows.zip`
	]);
	let buf = null;
	let last = "下载失败";
	for (const u of urls) try {
		const res = await fetch(u, {
			headers: {
				"User-Agent": "gongdi-ledger",
				Accept: "application/octet-stream"
			},
			redirect: "follow",
			signal: AbortSignal.timeout(12e4)
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
	if (!buf) return {
		ok: false,
		error: last
	};
	await writeFile(zipPath, buf);
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
	await writeFile(bat, `@echo off
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
`.replace(/\n/g, "\r\n"), "utf8");
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
const Route$23 = createFileRoute("/api/update")({ server: { handlers: {
	GET: async ({ request }) => {
		try {
			const info = await checkUpdate(new URL(request.url).searchParams.has("fresh"));
			return Response.json({
				...info,
				portable: isPortable()
			});
		} catch (e) {
			return Response.json({
				portable: false,
				error: e instanceof Error ? e.message : "检查失败"
			}, { status: 200 });
		}
	},
	POST: async ({ request }) => {
		try {
			if (!(await resolveTenant(request)).user) return Response.json({ error: "请先登录" }, { status: 401 });
			const result = await applyUpdate();
			return Response.json(result, { status: result.ok ? 200 : 400 });
		} catch (e) {
			return Response.json({ error: e instanceof Error ? e.message : "更新失败" }, { status: 500 });
		}
	}
} } });
const Route$24 = createFileRoute("/api/version")({ server: { handlers: { GET: async () => {
	const text = await readVersionText();
	return Response.json(parseChangelog(text || "1.0.2\n\n[1.0.2]\n左下角点版本号查看更新记录"));
} } } });
async function addYearAndRedirect(request, year) {
	const referer = request.headers.get("referer");
	let back = "/";
	try {
		if (referer) back = new URL(referer).pathname || "/";
	} catch {
		back = "/";
	}
	if (year < 2e3 || year > 2100) return Response.redirect(new URL(back, request.url), 303);
	if (!persistOn()) {
		const url = new URL(back, request.url);
		url.searchParams.set("addYear", String(year));
		return Response.redirect(url, 303);
	}
	const data = await readLedger();
	const rec = !("empty" in data && data.empty) ? data : {
		year: 2026,
		years: [2026],
		people: [],
		attendance: [],
		payments: [],
		accessHash: ""
	};
	const years = Array.isArray(rec.years) ? [...rec.years] : [2026];
	if (!years.includes(year)) years.push(year);
	years.sort((a, b) => a - b);
	await writeLedger({
		...rec,
		years,
		year
	});
	return Response.redirect(new URL(back, request.url), 303);
}
const Route$25 = createFileRoute("/api/year")({ server: { handlers: {
	GET: async () => Response.json({ error: "请在月度考勤里新增年份" }, { status: 405 }),
	POST: async ({ request }) => {
		const form = await request.formData();
		return addYearAndRedirect(request, Number(form.get("year") || form.get("add") || 0));
	}
} } });
function ymKey(y, m) {
	return y * 12 + m;
}
function ymdParts(value) {
	const t = parseDateYmd(value);
	if (!t) return null;
	const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	return {
		year: Number(m[1]),
		month: Number(m[2])
	};
}
function parseExportRange(url, fallbackYear) {
	const sp = url.searchParams;
	const scopeRaw = (sp.get("scope") || "").trim();
	const yearRaw = sp.get("year");
	const yearNum = Number(yearRaw || fallbackYear || 2026);
	const year = yearNum >= 2e3 && yearNum <= 2100 ? yearNum : fallbackYear || 2026;
	const yearMode = () => ({
		scope: "year",
		year,
		fromY: year,
		fromM: 1,
		toY: year,
		toM: 12,
		lo: ymKey(year, 1),
		hi: ymKey(year, 12),
		stamp: `${year}年`
	});
	const allMode = () => ({
		scope: "all",
		year,
		fromY: 2e3,
		fromM: 1,
		toY: 2100,
		toM: 12,
		lo: 0,
		hi: 99999,
		stamp: "全部"
	});
	if (scopeRaw === "range") {
		let fromY = Number(sp.get("fromY") || year);
		let fromM = Number(sp.get("fromM") || 1);
		let toY = Number(sp.get("toY") || year);
		let toM = Number(sp.get("toM") || 12);
		if (!(fromY >= 2e3 && fromY <= 2100)) fromY = year;
		if (!(toY >= 2e3 && toY <= 2100)) toY = year;
		if (!(fromM >= 1 && fromM <= 12)) fromM = 1;
		if (!(toM >= 1 && toM <= 12)) toM = 12;
		let lo = ymKey(fromY, fromM);
		let hi = ymKey(toY, toM);
		if (lo > hi) {
			[lo, hi] = [hi, lo];
			[fromY, fromM, toY, toM] = [
				toY,
				toM,
				fromY,
				fromM
			];
		}
		const stamp = fromY === toY && fromM === toM ? `${fromY}年${fromM}月` : `${fromY}年${fromM}月至${toY}年${toM}月`;
		return {
			scope: "range",
			year: fromY,
			fromY,
			fromM,
			toY,
			toM,
			lo,
			hi,
			stamp
		};
	}
	if (scopeRaw === "all") return allMode();
	if (scopeRaw === "year") return yearMode();
	if (yearRaw != null && yearRaw !== "") return yearMode();
	return allMode();
}
function monthsOfRange(range) {
	if (range.scope === "year") return Array.from({ length: 12 }, (_, i) => ({
		year: range.year,
		month: i + 1
	}));
	const out = [];
	for (let k = range.lo; k <= range.hi; k++) {
		const year = Math.floor((k - 1) / 12);
		const month = (k - 1) % 12 + 1;
		out.push({
			year,
			month
		});
	}
	return out;
}
function monthsFromAttendance(attendance) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const a of attendance || []) {
		if (!hasWork(a)) continue;
		const y = a.year;
		const m = a.month;
		if (!(y >= 2e3 && y <= 2100) || !(m >= 1 && m <= 12)) continue;
		const k = ymKey(y, m);
		if (seen.has(k)) continue;
		seen.add(k);
		out.push({
			year: y,
			month: m,
			k
		});
	}
	out.sort((a, b) => a.k - b.k);
	return out.map(({ year, month }) => ({
		year,
		month
	}));
}
function inExportRange(y, m, range) {
	if (range.scope === "all") return true;
	const k = ymKey(y, m);
	return k >= range.lo && k <= range.hi;
}
function filterAttendanceExport(attendance, range) {
	if (range.scope === "all") return attendance || [];
	return (attendance || []).filter((a) => inExportRange(a.year, a.month, range));
}
function filterPaymentsExport(payments, range) {
	if (range.scope === "all") return payments || [];
	return (payments || []).filter((p) => {
		if (!p.date) return true;
		const parts = ymdParts(p.date);
		if (!parts) {
			const y = dateYear(p.date);
			if (y == null) return true;
			return y >= range.fromY && y <= range.toY;
		}
		return inExportRange(parts.year, parts.month, range);
	});
}
function filterExpensesExport(expenses, range) {
	if (range.scope === "all") return expenses || [];
	return (expenses || []).filter((e) => {
		const parts = ymdParts(e.date) || ymdParts(e.period) || ymdParts(e.payoutDate);
		if (parts) return inExportRange(parts.year, parts.month, range);
		const y = Number(e.year) || dateYear(e.date) || dateYear(e.period);
		if (y >= 2e3) return y >= range.fromY && y <= range.toY;
		return true;
	});
}
function filterContractsExport(contracts, entries, range) {
	if (range.scope === "all") return {
		contracts: contracts || [],
		entries: entries || []
	};
	const filtered = (contracts || []).filter((c) => {
		const y = Number(c.year);
		if (!(y >= 2e3)) return true;
		return y >= range.fromY && y <= range.toY;
	});
	const ids = new Set(filtered.map((c) => c.id));
	return {
		contracts: filtered,
		entries: (entries || []).filter((e) => ids.has(e.contractId))
	};
}
function fileStamp(range, kind) {
	const label = {
		full: "总台账",
		att: "考勤",
		pay: "发放记录",
		exp: "报销单",
		con: "合同明细",
		people: "人员名单"
	}[kind] || "导出";
	if (kind === "people") return "人员名单.xlsx";
	if (range.scope === "all") return `${label}.xlsx`;
	return `${range.stamp}${label}.xlsx`;
}
async function xlsxFile(wb, filename) {
	const data = await writeCenteredXlsx(wb);
	const ascii = filename.replace(/[^\x20-\x7e]/g, "_");
	return new Response(data, { headers: {
		"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
		"Cache-Control": "no-store"
	} });
}
const Route$26 = createFileRoute("/api/file/$kind")({ server: { handlers: { GET: async ({ params, request }) => {
	const url = new URL(request.url);
	const year = Number(url.searchParams.get("year") || "2026") || 2026;
	const kind = params.kind;
	if (kind === "people-template") return xlsxFile(peopleTemplateWb(), "人员导入模板.xlsx");
	if (kind === "attendance-template") return xlsxFile(attendanceTemplateWb(year), `${year}年考勤导入模板.xlsx`);
	if (kind === "payment-template") return xlsxFile(paymentTemplateWb(), "发放记录导入模板.xlsx");
	if (kind === "expense-template") return xlsxFile(expenseTemplateWb(), "报销单导入模板.xlsx");
	if (kind === "contract-template") return xlsxFile(contractTemplateWb(), "合同导入模板.xlsx");
	if (kind === "contract-export" || kind === "export" || kind === "payment-export" || kind === "expense-export" || kind === "people-export" || kind === "attendance-export") {
		const run = async () => {
			const range = parseExportRange(url, year);
			const data = persistOn() ? await readLedger() : { empty: true };
			const rec = "empty" in data && data.empty ? {} : data;
			if (kind === "contract-export") {
				const { contracts, entries } = filterContractsExport(rec.contracts || [], rec.contractEntries || [], range);
				return xlsxFile(buildContractWorkbook({
					contracts,
					entries
				}), fileStamp(range, "con"));
			}
			if (kind === "people-export") return xlsxFile(buildPeopleWorkbook(rec.people || []), fileStamp(range, "people"));
			const people = rec.people || [];
			const attendance = filterAttendanceExport(rec.attendance || [], range);
			const payments = filterPaymentsExport(rec.payments || [], range);
			const expenses = filterExpensesExport(rec.expenses || [], range);
			if (kind === "payment-export") return xlsxFile(buildPaymentWorkbook(payments), fileStamp(range, "pay"));
			if (kind === "expense-export") return xlsxFile(buildExpenseWorkbook(expenses), fileStamp(range, "exp"));
			let months = range.scope === "all" ? monthsFromAttendance(attendance) : monthsOfRange(range);
			if (!months.length) months = Array.from({ length: 12 }, (_, i) => ({
				year: range.year,
				month: i + 1
			}));
			const skip = kind === "attendance-export";
			return xlsxFile(buildFullWorkbook({
				year: range.year,
				people,
				attendance,
				payments,
				expenses,
				months,
				skipPeople: skip,
				skipPay: skip,
				skipExp: skip
			}), fileStamp(range, skip ? "att" : "full"));
		};
		if (persistOn()) return withTenant(request, run);
		return run();
	}
	return new Response("not found", { status: 404 });
} } } });
var rootRouteChildren = {
	IndexRoute: Route$1.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route
	}),
	AttendanceRoute: Route$2.update({
		id: "/attendance",
		path: "/attendance",
		getParentRoute: () => Route
	}),
	AuditRoute: Route$3.update({
		id: "/audit",
		path: "/audit",
		getParentRoute: () => Route
	}),
	ContractsRoute: Route$4.update({
		id: "/contracts",
		path: "/contracts",
		getParentRoute: () => Route
	}),
	ExpensesRoute: Route$5.update({
		id: "/expenses",
		path: "/expenses",
		getParentRoute: () => Route
	}),
	FilesRoute: Route$6.update({
		id: "/files",
		path: "/files",
		getParentRoute: () => Route
	}),
	ImportRoute: Route$7.update({
		id: "/import",
		path: "/import",
		getParentRoute: () => Route
	}),
	PaymentsRoute: Route$8.update({
		id: "/payments",
		path: "/payments",
		getParentRoute: () => Route
	}),
	PeopleRoute: Route$9.update({
		id: "/people",
		path: "/people",
		getParentRoute: () => Route
	}),
	PhotosRoute: Route$10.update({
		id: "/photos",
		path: "/photos",
		getParentRoute: () => Route
	}),
	QueryRoute: Route$11.update({
		id: "/query",
		path: "/query",
		getParentRoute: () => Route
	}),
	SettingsRoute: Route$12.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route
	}),
	ApiAuditRoute: Route$13.update({
		id: "/api/audit",
		path: "/api/audit",
		getParentRoute: () => Route
	}),
	ApiAuthRoute: Route$14.update({
		id: "/api/auth",
		path: "/api/auth",
		getParentRoute: () => Route
	}),
	ApiBackupRoute: Route$15.update({
		id: "/api/backup",
		path: "/api/backup",
		getParentRoute: () => Route
	}),
	ApiDocRoute: Route$16.update({
		id: "/api/doc",
		path: "/api/doc",
		getParentRoute: () => Route
	}),
	ApiHealthRoute: Route$17.update({
		id: "/api/health",
		path: "/api/health",
		getParentRoute: () => Route
	}),
	ApiLedgerRoute: Route$18.update({
		id: "/api/ledger",
		path: "/api/ledger",
		getParentRoute: () => Route
	}),
	ApiPhotoRoute: Route$19.update({
		id: "/api/photo",
		path: "/api/photo",
		getParentRoute: () => Route
	}),
	ApiPhotoFileRoute: Route$20.update({
		id: "/api/photo-file",
		path: "/api/photo-file",
		getParentRoute: () => Route
	}),
	ApiPhotoFlagsRoute: Route$21.update({
		id: "/api/photo-flags",
		path: "/api/photo-flags",
		getParentRoute: () => Route
	}),
	ApiPhotoScanRoute: Route$22.update({
		id: "/api/photo-scan",
		path: "/api/photo-scan",
		getParentRoute: () => Route
	}),
	ApiUpdateRoute: Route$23.update({
		id: "/api/update",
		path: "/api/update",
		getParentRoute: () => Route
	}),
	ApiVersionRoute: Route$24.update({
		id: "/api/version",
		path: "/api/version",
		getParentRoute: () => Route
	}),
	ApiYearRoute: Route$25.update({
		id: "/api/year",
		path: "/api/year",
		getParentRoute: () => Route
	}),
	ApiFileKindRoute: Route$26.update({
		id: "/api/file/$kind",
		path: "/api/file/$kind",
		getParentRoute: () => Route
	})
};
const routeTree = Route._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true
	});
}
export { getRouter };
