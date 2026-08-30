globalThis.__nitro_main__ = import.meta.url;
import { a as toEventHandler, c as serve, i as defineLazyEventHandler, n as HTTPError, r as defineHandler, s as NodeResponse, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.svg": {
		"type": "image/svg+xml",
		"etag": "\"17a-AwgJ5Ogqafo52y+nGzvI7ltKbFY\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 378,
		"path": "../public/favicon.svg"
	},
	"/__grok/icon-180.png": {
		"type": "image/png",
		"etag": "\"834-Xk8vfS0DTFn7ggtkfEduWTcNWGE\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 2100,
		"path": "../public/__grok/icon-180.png"
	},
	"/assets/attendance-Cqa5TCAh.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4666-0dPz12a11KgNOdBPuyPPemKFkDU\"",
		"mtime": "2026-08-29T03:55:43.000Z",
		"size": 18022,
		"path": "../public/assets/attendance-Cqa5TCAh.js"
	},

	"/assets/audit-B4-GxOrP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"f10-7DjTUs0AJ+8xQ6czHozShBvoeKw\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 3856,
		"path": "../public/assets/audit-B4-GxOrP.js"
	},
	"/assets/audit-K39-jiKA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1eb7-g0Y2A/QNLSqh2LsWGIKc5ASWl8E\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 7863,
		"path": "../public/assets/audit-K39-jiKA.js"
	},
	"/assets/badge-_ctqz85I.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20b-BwMObS2eCrcK+H1sGnvCiqMhkgU\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 523,
		"path": "../public/assets/badge-_ctqz85I.js"
	},
	"/assets/can-9AzYldNF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"231-A1XFRPDJNG/uitIbL5KFiqqPq20\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 561,
		"path": "../public/assets/can-9AzYldNF.js"
	},
	"/assets/contracts-D6qZj01d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1ba1-PxMnhPXf6IMqzj+bSf7avNOe5dU\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 7073,
		"path": "../public/assets/contracts-D6qZj01d.js"
	},
	"/assets/contracts-DXZapWfC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"104dc-oVJFPhMjHbzPBZ51xIWcnTMmR3M\"",
		"mtime": "2026-08-29T18:04:37.000Z",
		"size": 66780,
		"path": "../public/assets/contracts-DXZapWfC.js"
	},

	"/assets/doc-actions-CmcTaqrK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a05-hHmeAttPRdQn/UgNOgAMuDD10YA\"",
		"mtime": "2026-08-29T03:55:43.000Z",
		"size": 6661,
		"path": "../public/assets/doc-actions-CmcTaqrK.js"
	},

	"/assets/download-DJvM19iB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b2-pOCdb7do90nMif3P6NFD7o90JG8\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 434,
		"path": "../public/assets/download-DJvM19iB.js"
	},
	"/assets/excel-BYSb_v_l.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"44d4-IPhaJRlw7K3CboLYCdqDqL1otGM\"",
		"mtime": "2026-08-30T03:22:59.754Z",
		"size": 17620,
		"path": "../public/assets/excel-BYSb_v_l.js"
	},
	"/assets/excel-import-CV73N9jL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2122-Tv6CBXJP7jvoIk8+m9fOvwpb0Qs\"",
		"mtime": "2026-08-30T03:22:57.622Z",
		"size": 8482,
		"path": "../public/assets/excel-import-CV73N9jL.js"
	},

	"/assets/expenses-TEST.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d6d2-Qps/0nrzkrqRRVw+Vags/vRhSaE\"",
		"mtime": "2026-08-30T03:22:42.902Z",
		"size": 54994,
		"path": "../public/assets/expenses-TEST.js"
	},

	"/assets/file-pick-Sh_I8IQI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e8d-KjW9/0LsY+JpD1by4rCa9yOIUGU\"",
		"mtime": "2026-08-29T06:39:17.000Z",
		"size": 3725,
		"path": "../public/assets/file-pick-Sh_I8IQI.js"
	},

	"/assets/files-HkeknFqy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c36-ijpxu4J01XDw3Hfyp434IZ/0I/g\"",
		"mtime": "2026-08-28T07:57:45.000Z",
		"size": 7222,
		"path": "../public/assets/files-HkeknFqy.js"
	},
	"/assets/import-_RtBCtwy.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"169b-UupER2TiqQpSiwh3oPDsQY6/DBo\"",
		"mtime": "2026-08-30T03:20:12.602Z",
		"size": 5787,
		"path": "../public/assets/import-_RtBCtwy.js"
	},

	"/assets/index-ghxum7yZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"70dc8-0r7dZ7K0IE7BEWU0gdRmUzYQ7Pw\"",
		"mtime": "2026-08-29T06:43:49.000Z",
		"size": 462280,
		"path": "../public/assets/index-ghxum7yZ.js"
	},

	"/assets/jsx-runtime-DREnUpxT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b3-9G7HVVwlvE7bzvgv8pu/0O+IfBw\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 435,
		"path": "../public/assets/jsx-runtime-DREnUpxT.js"
	},
	"/assets/pay-fields-D-N8mT1B.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"540-NoKpZXhqK1jKbR9LmEqYHt6ZFbw\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 1344,
		"path": "../public/assets/pay-fields-D-N8mT1B.js"
	},
	"/assets/payments-BBP-7-1d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6498-VMIrdc3Y5dBy/ZwGg2G9R831y6U\"",
		"mtime": "2026-08-30T03:22:27.530Z",
		"size": 25752,
		"path": "../public/assets/payments-BBP-7-1d.js"
	},

	"/assets/people-CUFknR2e.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6e74-I4k3yG8fFvQ/MBOQYLqinrYYbM8\"",
		"mtime": "2026-08-30T03:22:21.678Z",
		"size": 28276,
		"path": "../public/assets/people-CUFknR2e.js"
	},

	"/assets/photo-slot-D71m3Ysb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"30f4-ayOiV01ooMVCrHjvQUx5cwLTgpY\"",
		"mtime": "2026-08-29T06:39:17.000Z",
		"size": 12532,
		"path": "../public/assets/photo-slot-D71m3Ysb.js"
	},

	"/assets/photos-CjObQgDK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10f4-WymocAOUyyzDZifH181fcL/4F6o\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 4340,
		"path": "../public/assets/photos-CjObQgDK.js"
	},
	"/assets/photos-Dvrk1SxO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fda-1/nim4GBJj8Qby/wFnrENb7fTbg\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 4058,
		"path": "../public/assets/photos-Dvrk1SxO.js"
	},
	"/assets/query-B0ed1tcP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4304-lxu8eQITORmKnpQyHu0Z20VUZ+0\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 17156,
		"path": "../public/assets/query-B0ed1tcP.js"
	},
	"/assets/rolldown-runtime-Dd_uD5pT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"452-sZl5y+VnYZJIxKNwHO0DTqczPH0\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 1106,
		"path": "../public/assets/rolldown-runtime-Dd_uD5pT.js"
	},
	"/assets/routes-CGEpqByO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"137d-0weD8lL4G26R3x40TsoKHZ7N86o\"",
		"mtime": "2026-08-29T17:56:50.000Z",
		"size": 4989,
		"path": "../public/assets/routes-CGEpqByO.js"
	},
	"/assets/settings-CriQKq2d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5638-WvgHI5Opa1s7T6dWl+pECdspsLk\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 22072,
		"path": "../public/assets/settings-CriQKq2d.js"
	},
	"/assets/styles-DIWCajj9.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"bcd1-QhUe/XbxtpC4IvOakeg9CzvCQGk\"",
		"mtime": "2026-08-29T18:09:23.000Z",
		"size": 48337,
		"path": "../public/assets/styles-DIWCajj9.css"
	},

	"/assets/utils-BSPq25aB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7058-5p7Th3SwjqtYHQAJFGk6w8zBWiQ\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 28760,
		"path": "../public/assets/utils-BSPq25aB.js"
	},
	"/assets/wide-table-BtpzsvMP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1c56-KDpeJaFU4kgQ7CC4eEkZDiMao5g\"",
		"mtime": "2026-08-29T09:53:04.000Z",
		"size": 7254,
		"path": "../public/assets/wide-table-BtpzsvMP.js"
	},

	"/assets/xlsx-Cul4fuIT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"665ce-rY4UFCvbVI5v1Xhp6rvMB35BhvU\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 419278,
		"path": "../public/assets/xlsx-Cul4fuIT.js"
	},
	"/assets/ym-pick-DyiGGoH2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47f-ISpRrrPbI9s1Bl5ljOYXrYd3eiI\"",
		"mtime": "2026-08-28T01:32:09.000Z",
		"size": 1151,
		"path": "../public/assets/ym-pick-DyiGGoH2.js"
	},
	"/templates/attendance.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"164e-6J2uW1fFhGN2oUj2kdccrA54qAI\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 5710,
		"path": "../public/templates/attendance.xlsx"
	},
	"/templates/contracts.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"213c-NRPr/aCs/Cidaj1an6i2Bf9248k\"",
		"mtime": "2026-08-28T05:08:00.000Z",
		"size": 8508,
		"path": "../public/templates/contracts.xlsx"
	},
	"/templates/payments.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"40cd-zkmoU1WqENNSbFBXbpfrl1k5gb4\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 16589,
		"path": "../public/templates/payments.xlsx"
	},
	"/templates/people.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"496e-bTua3Wl9EgZvbzTdp0WjSPij/DE\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 18798,
		"path": "../public/templates/people.xlsx"
	},
	"/__grok/install/styles.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1a3d-VUsWOMAheo1/P30EqU5qaIkyvIQ\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 6717,
		"path": "../public/__grok/install/styles.css"
	},
	"/__grok/install/assets/homescreen/glass-puzzle.svg": {
		"type": "image/svg+xml",
		"etag": "\"713-AP2wG8KChAGjse1Fn+f/+vDN+sQ\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 1811,
		"path": "../public/__grok/install/assets/homescreen/glass-puzzle.svg"
	},
	"/__grok/install/assets/homescreen/glass-share.svg": {
		"type": "image/svg+xml",
		"etag": "\"954-jb3ATcKjqgMOYrA/4w1v21j0Jvg\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 2388,
		"path": "../public/__grok/install/assets/homescreen/glass-share.svg"
	},
	"/__grok/install/assets/homescreen/logo-grok.svg": {
		"type": "image/svg+xml",
		"etag": "\"423-5mXO+yh9KW40jM3to5JlWPhxNK8\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 1059,
		"path": "../public/__grok/install/assets/homescreen/logo-grok.svg"
	},
	"/__grok/install/assets/homescreen/ob-ipad.png": {
		"type": "image/png",
		"etag": "\"18dd3-wlRwrpmBImStuiu+4poVz7ANin4\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 101843,
		"path": "../public/__grok/install/assets/homescreen/ob-ipad.png"
	},
	"/__grok/install/assets/homescreen/ob-phone.png": {
		"type": "image/png",
		"etag": "\"194bc-oZradWHIHO68q2glHU0Gk5ttpWA\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 103612,
		"path": "../public/__grok/install/assets/homescreen/ob-phone.png"
	},
	"/__grok/install/assets/homescreen/plus.svg": {
		"type": "image/svg+xml",
		"etag": "\"961-sSBPunx/13vbMNAlPxb7UeO3l3A\"",
		"mtime": "2026-08-27T01:12:58.671Z",
		"size": 2401,
		"path": "../public/__grok/install/assets/homescreen/plus.svg"
	},
	"/assets/xlsx-center-nSN794kD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e3284-DiE1fQryJz1NsYinfaboQ1wcjxE\"",
		"mtime": "2026-08-27T01:12:57.427Z",
		"size": 930436,
		"path": "../public/assets/xlsx-center-nSN794kD.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_IO091Z = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_IO091Z
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
var globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
var port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
