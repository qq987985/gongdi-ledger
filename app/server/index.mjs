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
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 378,
		"path": "../public/favicon.svg"
	},
	"/__grok/icon-180.png": {
		"type": "image/png",
		"etag": "\"834-Xk8vfS0DTFn7ggtkfEduWTcNWGE\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 2100,
		"path": "../public/__grok/icon-180.png"
	},
	"/assets/attendance-DfRUQinP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"463b-6+x/xxm0qx1DMlieTDx44G88aeQ\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 17979,
		"path": "../public/assets/attendance-DfRUQinP.js"
	},
	"/assets/audit-BpisZUop.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ee9-Y46nyKDKblHiPwhQXFWDjeCWMpE\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 3817,
		"path": "../public/assets/audit-BpisZUop.js"
	},
	"/assets/audit-K39-jiKA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1eb7-g0Y2A/QNLSqh2LsWGIKc5ASWl8E\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 7863,
		"path": "../public/assets/audit-K39-jiKA.js"
	},
	"/assets/badge-BFTnvJtE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20a-/iZ4b20mKTJnTjWSgiGtOlf9jLg\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 522,
		"path": "../public/assets/badge-BFTnvJtE.js"
	},
	"/assets/can-C3N1FA_K.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"20a-cCn3fEblyzOZk0UdcRXMuc+mvgg\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 522,
		"path": "../public/assets/can-C3N1FA_K.js"
	},
	"/assets/contracts-D6qZj01d.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b08-wUEtAOAilyEfJW9GNevM8XnEbtA\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 6920,
		"path": "../public/assets/contracts-D6qZj01d.js"
	},
	"/assets/contracts-DgS-3ZKO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"79b6-QuhZ9vGTj6jm6Es76MVeOsd5QfQ\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 31158,
		"path": "../public/assets/contracts-DgS-3ZKO.js"
	},
	"/assets/doc-actions-C3xAKAsE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"18ff-BCZW1WCOjofukilDNwVv0twN5JU\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 6399,
		"path": "../public/assets/doc-actions-C3xAKAsE.js"
	},
	"/assets/download-DTX8ya6j.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b2-9xW531EkHuEk9yPaXYnouANRcUI\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 434,
		"path": "../public/assets/download-DTX8ya6j.js"
	},
	"/assets/excel-BYSb_v_l.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3d76-+L4Dt513tnD3zYKzVtEt1awmP2U\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 15734,
		"path": "../public/assets/excel-BYSb_v_l.js"
	},
	"/assets/file-pick-inzuKqoA.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b74-PeTPaFvHdns971dGTQaMl0Xw51o\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 2932,
		"path": "../public/assets/file-pick-inzuKqoA.js"
	},
	"/assets/excel-import-DnmSzTSM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1e95-0E6ACdBXMtmyeGXSuqwMqhrS6f4\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 7829,
		"path": "../public/assets/excel-import-DnmSzTSM.js"
	},
	"/assets/files-DQjKC4iY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12c8-FBEHHda9tTliZGWCpbSAF1UTb7Q\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 4808,
		"path": "../public/assets/files-DQjKC4iY.js"
	},
	"/assets/import-5e2eXRvN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7ea-+Q7aqYbHRJWfGoNELJi6H8AFJAs\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 2026,
		"path": "../public/assets/import-5e2eXRvN.js"
	},
	"/assets/index-oOLc9ldg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"700ef-lFBKWN/ijVNjHyRNb/KY5wo+Ha8\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 458991,
		"path": "../public/assets/index-oOLc9ldg.js"
	},
	"/assets/pay-fields-D5DAQH81.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"519-+5Z04+s6YzZ7nav+vz/f7/3mgsY\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 1305,
		"path": "../public/assets/pay-fields-D5DAQH81.js"
	},
	"/assets/payments-BG34Y8hx.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"29ae-Hl65HF0C4jZkn9G9Pg2g4sJfvbo\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 10670,
		"path": "../public/assets/payments-BG34Y8hx.js"
	},
	"/assets/people-DxZRi7VU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"311e-7SCv2dslQeVJQl5R3K8ydtjzzOo\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 12574,
		"path": "../public/assets/people-DxZRi7VU.js"
	},
	"/assets/photo-slot-Qaf_tgPE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1b63-q+Q6epAwqUhbRZncAe1MezMKka4\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 7011,
		"path": "../public/assets/photo-slot-Qaf_tgPE.js"
	},
	"/assets/photos-4Mwyjytt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e95-xmnlTLSadqVBzc8EtrDCzt3ai8g\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 3733,
		"path": "../public/assets/photos-4Mwyjytt.js"
	},
	"/assets/photos-DhaI2xN_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10ab-xIrx3ah8IiIS1UfKkldCjCcYh8A\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 4267,
		"path": "../public/assets/photos-DhaI2xN_.js"
	},
	"/assets/query-DoAkN42N.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"42e2-efIrnxDc+qmHE5dtGvfI5ah4xGs\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 17122,
		"path": "../public/assets/query-DoAkN42N.js"
	},
	"/assets/rolldown-runtime-Dd_uD5pT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"452-sZl5y+VnYZJIxKNwHO0DTqczPH0\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 1106,
		"path": "../public/assets/rolldown-runtime-Dd_uD5pT.js"
	},
	"/assets/routes-Bw5XDSFg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1276-q4T5ZcASlePMGx8BRZFv05yjwcw\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 4726,
		"path": "../public/assets/routes-Bw5XDSFg.js"
	},
	"/assets/settings-DQUg9mRP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"55ff-vBK64vfhRVrA6AvA5g0aUJTSMUs\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 22015,
		"path": "../public/assets/settings-DQUg9mRP.js"
	},
	"/assets/styles-DIWCajj9.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"b99f-LO9Eg4LDj7kJVsYkPe0HRPiQtSI\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 47519,
		"path": "../public/assets/styles-DIWCajj9.css"
	},
	"/assets/utils-BSPq25aB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7058-5p7Th3SwjqtYHQAJFGk6w8zBWiQ\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 28760,
		"path": "../public/assets/utils-BSPq25aB.js"
	},
	"/assets/wide-table-BybfOB3E.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9fd-Co+M9hIoYJfQPLEjVuNxa4RuMac\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 2557,
		"path": "../public/assets/wide-table-BybfOB3E.js"
	},
	"/assets/xlsx-Cul4fuIT.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"665ce-rY4UFCvbVI5v1Xhp6rvMB35BhvU\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 419278,
		"path": "../public/assets/xlsx-Cul4fuIT.js"
	},
	"/assets/ym-pick-PybF5aWO.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"479-hMNIGRd5pf6Ca1SfjyUiAj50xe0\"",
		"mtime": "2026-08-25T03:14:26.363Z",
		"size": 1145,
		"path": "../public/assets/ym-pick-PybF5aWO.js"
	},
	"/templates/attendance.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"164e-6J2uW1fFhGN2oUj2kdccrA54qAI\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 5710,
		"path": "../public/templates/attendance.xlsx"
	},
	"/templates/contracts.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"1544-g/SGFXwfY4DMmkGJ4AMoRXAZHvs\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 5444,
		"path": "../public/templates/contracts.xlsx"
	},
	"/templates/payments.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"40cd-zkmoU1WqENNSbFBXbpfrl1k5gb4\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 16589,
		"path": "../public/templates/payments.xlsx"
	},
	"/templates/people.xlsx": {
		"type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"etag": "\"496e-bTua3Wl9EgZvbzTdp0WjSPij/DE\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 18798,
		"path": "../public/templates/people.xlsx"
	},
	"/__grok/install/styles.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1a3d-VUsWOMAheo1/P30EqU5qaIkyvIQ\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 6717,
		"path": "../public/__grok/install/styles.css"
	},
	"/__grok/install/assets/homescreen/glass-puzzle.svg": {
		"type": "image/svg+xml",
		"etag": "\"713-AP2wG8KChAGjse1Fn+f/+vDN+sQ\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 1811,
		"path": "../public/__grok/install/assets/homescreen/glass-puzzle.svg"
	},
	"/__grok/install/assets/homescreen/glass-share.svg": {
		"type": "image/svg+xml",
		"etag": "\"954-jb3ATcKjqgMOYrA/4w1v21j0Jvg\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 2388,
		"path": "../public/__grok/install/assets/homescreen/glass-share.svg"
	},
	"/__grok/install/assets/homescreen/logo-grok.svg": {
		"type": "image/svg+xml",
		"etag": "\"423-5mXO+yh9KW40jM3to5JlWPhxNK8\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 1059,
		"path": "../public/__grok/install/assets/homescreen/logo-grok.svg"
	},
	"/__grok/install/assets/homescreen/ob-ipad.png": {
		"type": "image/png",
		"etag": "\"18dd3-wlRwrpmBImStuiu+4poVz7ANin4\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 101843,
		"path": "../public/__grok/install/assets/homescreen/ob-ipad.png"
	},
	"/__grok/install/assets/homescreen/ob-phone.png": {
		"type": "image/png",
		"etag": "\"194bc-oZradWHIHO68q2glHU0Gk5ttpWA\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 103612,
		"path": "../public/__grok/install/assets/homescreen/ob-phone.png"
	},
	"/__grok/install/assets/homescreen/plus.svg": {
		"type": "image/svg+xml",
		"etag": "\"961-sSBPunx/13vbMNAlPxb7UeO3l3A\"",
		"mtime": "2026-08-25T03:14:27.555Z",
		"size": 2401,
		"path": "../public/__grok/install/assets/homescreen/plus.svg"
	},
	"/assets/xlsx-center-nSN794kD.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e3284-DiE1fQryJz1NsYinfaboQ1wcjxE\"",
		"mtime": "2026-08-25T03:14:26.363Z",
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
