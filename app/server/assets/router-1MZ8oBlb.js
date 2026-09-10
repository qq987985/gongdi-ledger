import { t as Link } from "./link-C8A9580o.js";
import { i as parseChangelog, t as AppShell } from "./shell-yX8LwMcL.js";
import { D as deepEqual, E as invariant, F as require_react, M as isModuleNotFoundError, N as redirect, O as escapeHtml, P as rootRouteId, S as joinPaths, T as trimPathRight, V as __toESM, _ as _getAssetMatches, a as useStore, b as createNonReactiveReadonlyStore, c as require_jsx_runtime, d as getScriptPreloadAttrs, f as resolveManifestCssLink, g as isServer, l as appendUniqueUserTags, o as useRouter, p as reactUse, r as useMatch, s as useHydrated, u as getAssetCrossOrigin, v as RouterCore, w as trimPathLeft, y as createNonReactiveMutableStore } from "../server.js";
import { C as savePhoto, D as writeLedger, O as logServer, S as saveDoc, T as writeAudit, _ as removeDocFile, a as findPhotoPath, c as ledgerUnreadable, d as photoFlags, f as readAudit, h as readVersionText, i as findDoc, m as readLedger, n as appendAudit, s as ledgerRevisionValue, t as adoptLegacyAssets, u as persistOn, v as removePhoto, w as scanPhotoFolder, x as saveBackup } from "./nas-fs.server-Ye-Ou_mg.js";
import "./perms-h8QMmoTS.js";
import { c as withTenant, i as handleAuthPost, r as ensureAccounts, s as resolveTenant } from "./accounts.server-CPhAIE9v.js";
import { C as hasWork, p as dateYear, y as parseDateYmd } from "./contracts-DonCYL5F.js";
import { D as paymentTemplateWb, O as peopleTemplateWb, c as buildExpenseWorkbook, d as buildPeopleWorkbook, g as insuranceMemberTemplateWb, h as expenseTemplateWb, l as buildFullWorkbook, o as attendanceTemplateWb, p as contractTemplateWb, s as buildContractWorkbook, u as buildPaymentWorkbook } from "./excel-Dqb16tM-.js";
import { n as useApp } from "./store-DKxfgXiP.js";
import { r as Toaster } from "./audit-BAusgva9.js";
import "./nas-sync-Bwi78ByE.js";
import { t as writeCenteredXlsx } from "./xlsx-center-DkOE4ptH.js";
import "./button-BRe1hAcl.js";
import "./input-IsycmYDi.js";
import nodeHTTP from "node:http";
import { constants } from "node:fs";
import { join } from "node:path";
import { access, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
var BaseRoute = class {
	get to() {
		return this._to;
	}
	get id() {
		return this._id;
	}
	get path() {
		return this._path;
	}
	get fullPath() {
		return this._fullPath;
	}
	constructor(options) {
		this.init = (opts) => {
			this.originalIndex = opts.originalIndex;
			const options$1 = this.options;
			const isRoot = !options$1?.path && !options$1?.id;
			this.parentRoute = this.options.getParentRoute?.();
			if (isRoot) this._path = rootRouteId;
			else if (!this.parentRoute) invariant();
			let path = isRoot ? rootRouteId : options$1?.path;
			if (path && path !== "/") path = trimPathLeft(path);
			const customId = options$1?.id || path;
			let id = isRoot ? rootRouteId : joinPaths([this.parentRoute.id === "__root__" ? "" : this.parentRoute.id, customId]);
			if (path === "__root__") path = "/";
			if (id !== "__root__") id = joinPaths(["/", id]);
			const fullPath = id === "__root__" ? "/" : joinPaths([this.parentRoute.fullPath, path]);
			this._path = path;
			this._id = id;
			this._fullPath = fullPath;
			this._to = trimPathRight(fullPath);
		};
		this.addChildren = (children) => {
			return this._addFileChildren(children);
		};
		this._addFileChildren = (children) => {
			if (Array.isArray(children)) this.children = children;
			if (typeof children === "object" && children !== null) this.children = Object.values(children);
			return this;
		};
		this._addFileTypes = () => {
			return this;
		};
		this.updateLoader = (options$1) => {
			Object.assign(this.options, options$1);
			return this;
		};
		this.update = (options$1) => {
			Object.assign(this.options, options$1);
			return this;
		};
		this.lazy = (lazyFn) => {
			this.lazyFn = lazyFn;
			return this;
		};
		this.redirect = (opts) => redirect({
			from: this.fullPath,
			...opts
		});
		this.options = options || {};
		this.isRoot = !options?.getParentRoute;
		if (options?.id && options?.path) throw new Error(`Route cannot have both an 'id' and a 'path' option.`);
	}
};
var BaseRootRoute = class extends BaseRoute {
	constructor(options) {
		super(options);
	}
};
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
	ReactiveFlags2[ReactiveFlags2["None"] = 0] = "None";
	ReactiveFlags2[ReactiveFlags2["Mutable"] = 1] = "Mutable";
	ReactiveFlags2[ReactiveFlags2["Watching"] = 2] = "Watching";
	ReactiveFlags2[ReactiveFlags2["RecursedCheck"] = 4] = "RecursedCheck";
	ReactiveFlags2[ReactiveFlags2["Recursed"] = 8] = "Recursed";
	ReactiveFlags2[ReactiveFlags2["Dirty"] = 16] = "Dirty";
	ReactiveFlags2[ReactiveFlags2["Pending"] = 32] = "Pending";
	return ReactiveFlags2;
})(ReactiveFlags || {});
/* @__NO_SIDE_EFFECTS__ */
function createReactiveSystem({ update, notify, unwatched }) {
	return {
		link: link$1,
		unlink: unlink$1,
		propagate: propagate$1,
		checkDirty: checkDirty$1,
		shallowPropagate: shallowPropagate$1
	};
	function link$1(dep, sub, version$1) {
		const prevDep = sub.depsTail;
		if (prevDep !== void 0 && prevDep.dep === dep) return;
		const nextDep = prevDep !== void 0 ? prevDep.nextDep : sub.deps;
		if (nextDep !== void 0 && nextDep.dep === dep) {
			nextDep.version = version$1;
			sub.depsTail = nextDep;
			return;
		}
		const prevSub = dep.subsTail;
		if (prevSub !== void 0 && prevSub.version === version$1 && prevSub.sub === sub) return;
		const newLink = sub.depsTail = dep.subsTail = {
			version: version$1,
			dep,
			sub,
			prevDep,
			nextDep,
			prevSub,
			nextSub: void 0
		};
		if (nextDep !== void 0) nextDep.prevDep = newLink;
		if (prevDep !== void 0) prevDep.nextDep = newLink;
		else sub.deps = newLink;
		if (prevSub !== void 0) prevSub.nextSub = newLink;
		else dep.subs = newLink;
	}
	function unlink$1(link2, sub = link2.sub) {
		const dep = link2.dep;
		const prevDep = link2.prevDep;
		const nextDep = link2.nextDep;
		const nextSub = link2.nextSub;
		const prevSub = link2.prevSub;
		if (nextDep !== void 0) nextDep.prevDep = prevDep;
		else sub.depsTail = prevDep;
		if (prevDep !== void 0) prevDep.nextDep = nextDep;
		else sub.deps = nextDep;
		if (nextSub !== void 0) nextSub.prevSub = prevSub;
		else dep.subsTail = prevSub;
		if (prevSub !== void 0) prevSub.nextSub = nextSub;
		else if ((dep.subs = nextSub) === void 0) unwatched(dep);
		return nextDep;
	}
	function propagate$1(link2) {
		let next = link2.nextSub;
		let stack;
		top: do {
			const sub = link2.sub;
			let flags = sub.flags;
			if (!(flags & 60)) sub.flags = flags | 32;
			else if (!(flags & 12)) flags = 0;
			else if (!(flags & 4)) sub.flags = flags & -9 | 32;
			else if (!(flags & 48) && isValidLink(link2, sub)) {
				sub.flags = flags | 40;
				flags &= 1;
			} else flags = 0;
			if (flags & 2) notify(sub);
			if (flags & 1) {
				const subSubs = sub.subs;
				if (subSubs !== void 0) {
					const nextSub = (link2 = subSubs).nextSub;
					if (nextSub !== void 0) {
						stack = {
							value: next,
							prev: stack
						};
						next = nextSub;
					}
					continue;
				}
			}
			if ((link2 = next) !== void 0) {
				next = link2.nextSub;
				continue;
			}
			while (stack !== void 0) {
				link2 = stack.value;
				stack = stack.prev;
				if (link2 !== void 0) {
					next = link2.nextSub;
					continue top;
				}
			}
			break;
		} while (true);
	}
	function checkDirty$1(link2, sub) {
		let stack;
		let checkDepth = 0;
		let dirty = false;
		top: do {
			const dep = link2.dep;
			const flags = dep.flags;
			if (sub.flags & 16) dirty = true;
			else if ((flags & 17) === 17) {
				if (update(dep)) {
					const subs = dep.subs;
					if (subs.nextSub !== void 0) shallowPropagate$1(subs);
					dirty = true;
				}
			} else if ((flags & 33) === 33) {
				if (link2.nextSub !== void 0 || link2.prevSub !== void 0) stack = {
					value: link2,
					prev: stack
				};
				link2 = dep.deps;
				sub = dep;
				++checkDepth;
				continue;
			}
			if (!dirty) {
				const nextDep = link2.nextDep;
				if (nextDep !== void 0) {
					link2 = nextDep;
					continue;
				}
			}
			while (checkDepth--) {
				const firstSub = sub.subs;
				const hasMultipleSubs = firstSub.nextSub !== void 0;
				if (hasMultipleSubs) {
					link2 = stack.value;
					stack = stack.prev;
				} else link2 = firstSub;
				if (dirty) {
					if (update(sub)) {
						if (hasMultipleSubs) shallowPropagate$1(firstSub);
						sub = link2.sub;
						continue;
					}
					dirty = false;
				} else sub.flags &= -33;
				sub = link2.sub;
				const nextDep = link2.nextDep;
				if (nextDep !== void 0) {
					link2 = nextDep;
					continue top;
				}
			}
			return dirty;
		} while (true);
	}
	function shallowPropagate$1(link2) {
		do {
			const sub = link2.sub;
			const flags = sub.flags;
			if ((flags & 48) === 32) {
				sub.flags = flags | 16;
				if ((flags & 6) === 2) notify(sub);
			}
		} while ((link2 = link2.nextSub) !== void 0);
	}
	function isValidLink(checkLink, sub) {
		let link2 = sub.depsTail;
		while (link2 !== void 0) {
			if (link2 === checkLink) return true;
			link2 = link2.prevDep;
		}
		return false;
	}
}
var queuedEffects = [];
var { link, unlink, propagate, checkDirty, shallowPropagate } = /* @__PURE__ */ createReactiveSystem({
	update(atom) {
		return atom._update();
	},
	notify(effect2) {
		queuedEffects[queuedEffectsLength++] = effect2;
		effect2.flags &= ~ReactiveFlags.Watching;
	},
	unwatched(atom) {
		if (atom.depsTail !== void 0) {
			atom.depsTail = void 0;
			atom.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty;
			purgeDeps(atom);
		}
	}
});
var queuedEffectsLength = 0;
function purgeDeps(sub) {
	const depsTail = sub.depsTail;
	let dep = depsTail !== void 0 ? depsTail.nextDep : sub.deps;
	while (dep !== void 0) dep = unlink(dep, sub);
}
function useLoaderData(opts) {
	return useMatch({
		from: opts.from,
		strict: opts.strict,
		structuralSharing: opts.structuralSharing,
		select: (match) => {
			return opts.select ? opts.select(match.loaderData) : match.loaderData;
		}
	});
}
function useLoaderDeps(opts) {
	const { select, ...rest } = opts;
	return useMatch({
		...rest,
		select: (match) => {
			return select ? select(match.loaderDeps) : match.loaderDeps;
		}
	});
}
function useParams(opts) {
	return useMatch({
		from: opts.from,
		shouldThrow: opts.shouldThrow,
		structuralSharing: opts.structuralSharing,
		strict: opts.strict,
		select: (match) => {
			const params = opts.strict === false ? match.params : match._strictParams;
			return opts.select ? opts.select(params) : params;
		}
	});
}
function useSearch(opts) {
	return useMatch({
		from: opts.from,
		strict: opts.strict,
		shouldThrow: opts.shouldThrow,
		structuralSharing: opts.structuralSharing,
		select: (match) => {
			return opts.select ? opts.select(match.search) : match.search;
		}
	});
}
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function useNavigate(_defaultOpts) {
	const router = useRouter();
	return import_react.useCallback((options) => {
		return router.navigate({
			...options,
			from: options.from ?? _defaultOpts?.from
		});
	}, [_defaultOpts?.from, router]);
}
function useRouteContext(opts) {
	return useMatch({
		...opts,
		select: (match) => opts.select ? opts.select(match.context) : match.context
	});
}
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime(), 1);
var Route$30 = class extends BaseRoute {
	constructor(options) {
		super(options);
		this.useMatch = (opts) => {
			return useMatch({
				select: opts?.select,
				from: this.id,
				structuralSharing: opts?.structuralSharing
			});
		};
		this.useRouteContext = (opts) => {
			return useRouteContext({
				...opts,
				from: this.id
			});
		};
		this.useSearch = (opts) => {
			return useSearch({
				select: opts?.select,
				structuralSharing: opts?.structuralSharing,
				from: this.id
			});
		};
		this.useParams = (opts) => {
			return useParams({
				select: opts?.select,
				structuralSharing: opts?.structuralSharing,
				from: this.id
			});
		};
		this.useLoaderDeps = (opts) => {
			return useLoaderDeps({
				...opts,
				from: this.id
			});
		};
		this.useLoaderData = (opts) => {
			return useLoaderData({
				...opts,
				from: this.id
			});
		};
		this.useNavigate = () => {
			return useNavigate({ from: this.fullPath });
		};
		this.Link = import_react.forwardRef((props, ref) => {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				ref,
				from: this.fullPath,
				...props
			});
		});
	}
};
function createRoute(options) {
	return new Route$30(options);
}
var RootRoute = class extends BaseRootRoute {
	constructor(options) {
		super(options);
		this.useMatch = (opts) => {
			return useMatch({
				select: opts?.select,
				from: this.id,
				structuralSharing: opts?.structuralSharing
			});
		};
		this.useRouteContext = (opts) => {
			return useRouteContext({
				...opts,
				from: this.id
			});
		};
		this.useSearch = (opts) => {
			return useSearch({
				select: opts?.select,
				structuralSharing: opts?.structuralSharing,
				from: this.id
			});
		};
		this.useParams = (opts) => {
			return useParams({
				select: opts?.select,
				structuralSharing: opts?.structuralSharing,
				from: this.id
			});
		};
		this.useLoaderDeps = (opts) => {
			return useLoaderDeps({
				...opts,
				from: this.id
			});
		};
		this.useLoaderData = (opts) => {
			return useLoaderData({
				...opts,
				from: this.id
			});
		};
		this.useNavigate = () => {
			return useNavigate({ from: this.fullPath });
		};
		this.Link = import_react.forwardRef((props, ref) => {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				ref,
				from: this.fullPath,
				...props
			});
		});
	}
};
function createRootRoute(options) {
	return new RootRoute(options);
}
function createFileRoute(path) {
	return (options) => {
		const route = createRoute(options);
		route.isRoot = false;
		return route;
	};
}
function lazyRouteComponent(importer, exportName) {
	let loadPromise;
	let comp;
	let error$1;
	const load = () => {
		if (!loadPromise) {
			error$1 = void 0;
			loadPromise = importer().then((res) => {
				comp = res[exportName ?? "default"];
			}).catch((err) => {
				loadPromise = void 0;
				error$1 = err;
			});
		}
		return loadPromise;
	};
	const lazyComp = function Lazy(props) {
		if (error$1) {
			if (isModuleNotFoundError(error$1) && false);
			throw error$1;
		}
		if (!comp) if (reactUse) reactUse(load());
		else throw load();
		return import_react.createElement(comp, props);
	};
	lazyComp.preload = load;
	return lazyComp;
}
var getStoreFactory = (opts) => {
	return {
		createMutableStore: createNonReactiveMutableStore,
		createReadonlyStore: createNonReactiveReadonlyStore,
		batch: (fn) => fn()
	};
};
var createRouter = (options) => {
	return new Router(options);
};
var Router = class extends RouterCore {
	constructor(options) {
		super(options, getStoreFactory);
	}
};
var noopScriptHandler = () => {};
function setScriptAttrs(script, attrs) {
	if (!attrs) return;
	for (const [key, value] of Object.entries(attrs)) if (key !== "suppressHydrationWarning" && value !== void 0 && value !== false) script.setAttribute(key, typeof value === "boolean" ? "" : String(value));
}
function Asset(asset) {
	const { attrs, children, nonce, preventScriptHoist } = asset;
	switch (asset.tag) {
		case "title": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", {
			...attrs,
			suppressHydrationWarning: true,
			children
		});
		case "meta": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meta", {
			...attrs,
			suppressHydrationWarning: true
		});
		case "link": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("link", {
			...attrs,
			precedence: attrs?.precedence ?? (attrs?.rel === "stylesheet" ? "default" : void 0),
			nonce,
			suppressHydrationWarning: true
		});
		case "style":
			if (asset.inlineCss && false);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", {
				...attrs,
				dangerouslySetInnerHTML: { __html: children },
				nonce
			});
		case "script": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Script, {
			attrs,
			preventScriptHoist,
			children
		});
		default: return null;
	}
}
function Script({ attrs, children, preventScriptHoist }) {
	useRouter();
	useHydrated();
	const dataScript = typeof attrs?.type === "string" && attrs.type !== "" && attrs.type !== "text/javascript" && attrs.type !== "module";
	import_react.useEffect(() => {
		if (dataScript) return;
		if (attrs?.src) {
			const normSrc = (() => {
				try {
					const base = document.baseURI || window.location.href;
					return new URL(attrs.src, base).href;
				} catch {
					return attrs.src;
				}
			})();
			for (const el of document.querySelectorAll("script[src]")) if (el.src === normSrc) return;
			const script = document.createElement("script");
			setScriptAttrs(script, attrs);
			document.head.appendChild(script);
			return () => script.remove();
		}
		if (typeof children === "string") {
			const typeAttr = typeof attrs?.type === "string" ? attrs.type : "text/javascript";
			const nonceAttr = typeof attrs?.nonce === "string" ? attrs.nonce : void 0;
			for (const el of document.querySelectorAll("script:not([src])")) {
				if (!(el instanceof HTMLScriptElement)) continue;
				const sType = el.getAttribute("type") ?? "text/javascript";
				const sNonce = el.getAttribute("nonce") ?? void 0;
				if (el.textContent === children && sType === typeAttr && sNonce === nonceAttr) return;
			}
			const script = document.createElement("script");
			script.textContent = children;
			setScriptAttrs(script, attrs);
			document.head.appendChild(script);
			return () => script.remove();
		}
	}, [
		attrs,
		children,
		dataScript
	]);
	if (attrs?.src) {
		if (!preventScriptHoist) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
			...attrs,
			suppressHydrationWarning: true
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
			...attrs,
			onLoad: noopScriptHandler,
			suppressHydrationWarning: true
		});
	}
	if (typeof children === "string") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
		...attrs,
		dangerouslySetInnerHTML: { __html: children },
		suppressHydrationWarning: true
	});
	return null;
}
function buildTagsFromMatches(router, nonce, matches, assetCrossOrigin) {
	matches = _getAssetMatches(matches);
	const routeMeta = matches.map((match) => match.meta).filter((meta$2) => meta$2 !== void 0);
	const resultMeta = [];
	const metaByAttribute = {};
	let title;
	for (let i = routeMeta.length - 1; i >= 0; i--) {
		const metas = routeMeta[i];
		for (let j = metas.length - 1; j >= 0; j--) {
			const m = metas[j];
			if (!m) continue;
			if (m.title) {
				if (!title) title = {
					tag: "title",
					children: m.title
				};
			} else if ("script:ld+json" in m) try {
				const json = JSON.stringify(m["script:ld+json"]);
				resultMeta.push({
					tag: "script",
					attrs: { type: "application/ld+json" },
					children: escapeHtml(json)
				});
			} catch {}
			else {
				const attribute = m.name ?? m.property;
				if (attribute) if (metaByAttribute[attribute]) continue;
				else metaByAttribute[attribute] = true;
				resultMeta.push({
					tag: "meta",
					attrs: {
						...m,
						nonce
					}
				});
			}
		}
	}
	if (title) resultMeta.push(title);
	if (nonce) resultMeta.push({
		tag: "meta",
		attrs: {
			property: "csp-nonce",
			content: nonce
		}
	});
	resultMeta.reverse();
	const constructedLinks = matches.flatMap((match) => match.links ?? []).filter((link$1) => link$1 !== void 0).map((link$1) => ({
		tag: "link",
		attrs: {
			...link$1,
			nonce
		}
	}));
	const manifest = router.ssr?.manifest;
	const manifestCssTags = [];
	if (manifest) {
		matches.forEach((match) => {
			(manifest.routes[match.routeId]?.css)?.forEach((link$1) => {
				const resolvedLink = resolveManifestCssLink(link$1);
				manifestCssTags.push({
					tag: "link",
					attrs: {
						rel: "stylesheet",
						...resolvedLink,
						crossOrigin: getAssetCrossOrigin(assetCrossOrigin, "stylesheet") ?? resolvedLink.crossOrigin,
						suppressHydrationWarning: true,
						nonce
					}
				});
			});
		});
		if (manifest.inlineStyle) manifestCssTags.push({
			tag: "style",
			attrs: {
				...manifest.inlineStyle.attrs,
				nonce
			},
			children: manifest.inlineStyle.children,
			inlineCss: true
		});
	}
	const preloadLinks = [];
	if (manifest) matches.forEach((match) => {
		manifest.routes[match.routeId]?.preloads?.forEach((preload) => {
			preloadLinks.push({
				tag: "link",
				attrs: {
					...getScriptPreloadAttrs(manifest, preload, assetCrossOrigin),
					nonce
				}
			});
		});
	});
	const styles = matches.flatMap((match) => match.styles ?? []).filter((style) => style !== void 0).map(({ children, ...attrs }) => ({
		tag: "style",
		attrs: {
			...attrs,
			nonce
		},
		children
	}));
	const headScripts = matches.flatMap((match) => match.headScripts ?? []).filter((script) => script !== void 0).map(({ children, ...script }) => ({
		tag: "script",
		attrs: {
			...script,
			nonce
		},
		children
	}));
	const tags = [];
	appendUniqueUserTags(tags, resultMeta);
	tags.push(...preloadLinks);
	appendUniqueUserTags(tags, constructedLinks);
	tags.push(...manifestCssTags);
	appendUniqueUserTags(tags, styles);
	appendUniqueUserTags(tags, headScripts);
	return tags;
}
var useTags = (assetCrossOrigin) => {
	const router = useRouter();
	const nonce = router.options.ssr?.nonce;
	return buildTagsFromMatches(router, nonce, router.stores.matches.get(), assetCrossOrigin);
};
function HeadContent(props) {
	const tags = useTags(props.assetCrossOrigin);
	const nonce = useRouter().options.ssr?.nonce;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: tags.map((tag) => /* @__PURE__ */ (0, import_react.createElement)(Asset, {
		...tag,
		key: `tsr-meta-${JSON.stringify(tag)}`,
		nonce
	})) });
}
var Scripts = () => {
	const router = useRouter();
	const nonce = router.options.ssr?.nonce;
	const getScripts = (matches) => {
		matches = _getAssetMatches(matches);
		const scripts = matches.flatMap((match) => match.scripts ?? []).filter(Boolean).map(({ children, ...script }) => ({
			tag: "script",
			attrs: {
				...script,
				suppressHydrationWarning: true,
				nonce
			},
			children
		}));
		const manifest = router.ssr?.manifest;
		if (!manifest) return scripts;
		for (const match of matches) {
			const manifestScripts = manifest.routes[match.routeId]?.scripts;
			if (!manifestScripts) continue;
			for (const asset of manifestScripts) scripts.push({
				tag: "script",
				attrs: {
					...asset.attrs,
					nonce
				},
				children: asset.children,
				...typeof asset.attrs?.src === "string" ? { preventScriptHoist: true } : {}
			});
		}
		return scripts;
	};
	return renderScripts(router, getScripts(router.stores.matches.get()));
};
function renderScripts(router, scripts) {
	if (router.serverSsr) {
		const serverBufferedScript = router.serverSsr.takeBufferedScripts();
		if (serverBufferedScript) scripts.unshift(serverBufferedScript);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: scripts.map((asset, i) => /* @__PURE__ */ (0, import_react.createElement)(Asset, {
		...asset,
		key: `tsr-scripts-${asset.tag}-${i}`
	})) });
}
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
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-CN",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeColor, {})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("noscript", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				style: {
					padding: 16,
					textAlign: "center"
				},
				children: "本系统需要浏览器允许脚本。请关闭拦截后刷新。"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				richColors: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
function ThemeColor() {
	const uiStyle = useApp((s) => s.uiStyle);
	const colors = {
		classic: "#1e56a0",
		v2: "#4f6bf5",
		apple: "#0a84ff",
		movie: "#7c3aed"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meta", {
		name: "theme-color",
		content: uiStyle === "classic" ? colors.classic : colors[uiStyle] || colors.v2
	});
}
var $$splitComponentImporter$13 = () => import("./routes-C-1w2aYi.js");
const Route$1 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$13, "component") });
var $$splitComponentImporter$12 = () => import("./attendance-Cd0VZXlp.js");
const Route$2 = createFileRoute("/attendance")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
var $$splitComponentImporter$11 = () => import("./audit-DJPdB8xY.js");
const Route$3 = createFileRoute("/audit")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
var $$splitComponentImporter$10 = () => import("./contracts-BlhsB79b.js");
const Route$4 = createFileRoute("/contracts")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./expenses-DZX_XDwr.js");
const Route$5 = createFileRoute("/expenses")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./export-PMXzk-cY.js");
const Route$6 = createFileRoute("/export")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./files-Bxm04_rY.js");
const Route$7 = createFileRoute("/files")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./import-Db42EuTF.js");
const Route$8 = createFileRoute("/import")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./insurance-DptBXlp8.js");
const Route$9 = createFileRoute("/insurance")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./payments-DpWCQ9xb.js");
const Route$10 = createFileRoute("/payments")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./people-BgHjO13E.js");
const Route$11 = createFileRoute("/people")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./photos-6mK_D5Jg.js");
const Route$12 = createFileRoute("/photos")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./query-DmNwcQLs.js");
const Route$13 = createFileRoute("/query")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./settings-Bckna2ZS.js");
const Route$14 = createFileRoute("/settings")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
const Route$15 = createFileRoute("/api/audit")({ server: { handlers: {
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
			try {
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
			} catch (err) {
				await logServer("error", "操作记录写入失败", {
					action: body.action,
					error: String(err)
				});
				return Response.json({ error: "操作记录写入失败，请检查 data 目录权限" }, { status: 500 });
			}
		}, "ledger.write");
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if ((await resolveTenant(request)).user?.role !== "admin") return Response.json({ error: "只有管理员能改操作记录" }, { status: 403 });
		const body = await request.json();
		if (!body.id) return Response.json({ error: "缺少 id" }, { status: 400 });
		return withTenant(request, async () => {
			const list = await readAudit();
			if (!list.length) return Response.json({ error: "读取操作记录失败，已拒绝写入（避免清空历史）" }, { status: 409 });
			await writeAudit(list.map((e) => e.id === body.id ? {
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
			const list = await readAudit();
			if (!list.length) return Response.json({ error: "读取操作记录失败，已拒绝写入（避免清空历史）" }, { status: 409 });
			await writeAudit(list.filter((e) => !ids.includes(e.id)));
			return Response.json({ ok: true });
		});
	}
} } });
const Route$16 = createFileRoute("/api/auth")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({
			persist: false,
			needSetup: false,
			user: null,
			books: []
		});
		const data = await ensureAccounts();
		const { resolveTenant: resolveTenant$1, publicUser, memberList, accountsUnreadable, ACCOUNTS_BROKEN_MSG } = await import("./accounts.server-D8tGGNba.js");
		const { hasPerm } = await import("./perms-BPNdcH7Z.js");
		const t = await resolveTenant$1(request);
		if (accountsUnreadable()) return Response.json({
			persist: true,
			broken: true,
			needSetup: false,
			user: null,
			books: [],
			error: ACCOUNTS_BROKEN_MSG
		}, { status: 503 });
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
const Route$17 = createFileRoute("/api/backup")({ server: { handlers: { POST: async ({ request }) => {
	if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
	if (Number(request.headers.get("content-length") || 0) > 50 * 1024 * 1024) return Response.json({ error: "备份太大" }, { status: 413 });
	const buf = Buffer.from(await request.arrayBuffer());
	if (buf.length > 50 * 1024 * 1024) return Response.json({ error: "备份太大" }, { status: 413 });
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
	}, "export.use");
} } } });
function kindOf$2(v) {
	if (v === "report" || v === "invoice" || v === "receipt" || v === "attendance" || v === "contract" || v === "expense" || v === "payout" || v === "insurance") return v;
	return null;
}
function kindView(kind) {
	if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract") return "contracts.view";
	if (kind === "expense" || kind === "payout") return "expenses.view";
	if (kind === "insurance") return "insurance.view";
	return "attendance.view";
}
function kindEdit(kind) {
	if (kind === "report" || kind === "invoice" || kind === "receipt" || kind === "contract") return "contracts.edit";
	if (kind === "expense" || kind === "payout") return "expenses.edit";
	if (kind === "insurance") return "insurance.edit";
	return "attendance.edit";
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
const Route$18 = createFileRoute("/api/doc")({ server: { handlers: {
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
				"Content-Disposition": `inline; filename="${encodeURIComponent(hit.fileName.replace(/[\r\n]/g, ""))}"`,
				"Cache-Control": "no-store"
			} });
		}, kindView(kind));
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if (Number(request.headers.get("content-length") || 0) > 50 * 1024 * 1024) return Response.json({ error: "文件太大，最大 50MB" }, { status: 413 });
		const form = await request.formData();
		const id = String(form.get("id") || "");
		const kind = kindOf$2(String(form.get("kind") || ""));
		const file = form.get("file");
		if (!id || !kind || !(file instanceof File)) return Response.json({ ok: false }, { status: 400 });
		if (file.size > 50 * 1024 * 1024) return Response.json({ error: "文件太大，最大 50MB" }, { status: 413 });
		const buf = Buffer.from(await file.arrayBuffer());
		const replace = String(form.get("replace") || "") === "1";
		return withTenant(request, async () => {
			const saved = await saveDoc(id, kind, buf, file.name, { replace });
			return Response.json({
				ok: true,
				fileName: saved || file.name
			});
		}, kindEdit(kind));
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
		}, kindEdit(kind));
	}
} } });
const Route$19 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => Response.json({
	persist: persistOn(),
	ok: true
}) } } });
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array$1, separator = "|") {
	return array$1.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
function cached(getter) {
	return { get value() {
		{
			const value = getter();
			Object.defineProperty(this, "value", { value });
			return value;
		}
		throw new Error("cached value already set");
	} };
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const ratio = val / step;
	const roundedRatio = Math.round(ratio);
	const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
	if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
	return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function esc(str$1) {
	return JSON.stringify(str$1);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = /* @__PURE__ */ cached(() => {
	if (globalConfig.jitless) return false;
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	if (o instanceof Map) return new Map(o);
	if (o instanceof Set) return new Set(o);
	return o;
}
const propertyKeyTypes = /* @__PURE__ */ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str$1) {
	return str$1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = {};
			for (const key of Reflect.ownKeys(mask)) {
				if (!Object.prototype.hasOwnProperty.call(currDef.shape, key)) throw new Error(`Unrecognized key: "${String(key)}"`);
				if (!mask[key]) continue;
				assignProp(newShape, key, currDef.shape[key]);
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = { ...schema._zod.def.shape };
			for (const key of Reflect.ownKeys(mask)) {
				if (!Object.prototype.hasOwnProperty.call(currDef.shape, key)) throw new Error(`Unrecognized key: "${String(key)}"`);
				if (!mask[key]) continue;
				delete newShape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = schema._zod.def.shape;
		for (const key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function merge(a, b) {
	if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
	if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
	return clone(a, mergeDefs(a._zod.def, {
		get shape() {
			const _shape = {
				...a._zod.def.shape,
				...b._zod.def.shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: b._zod.def.checks ?? []
	}));
}
function partial(Class, schema, mask, name = "partial") {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const oldShape = schema._zod.def.shape;
			const shape = { ...oldShape };
			if (mask) for (const key of Reflect.ownKeys(mask)) {
				if (!Object.prototype.hasOwnProperty.call(oldShape, key)) throw new Error(`Unrecognized key: "${String(key)}"`);
				if (!mask[key]) continue;
				shape[key] = Class ? new Class({
					type: "optional",
					innerType: oldShape[key]
				}) : oldShape[key];
			}
			else for (const key of Reflect.ownKeys(oldShape)) shape[key] = Class ? new Class({
				type: "optional",
				innerType: oldShape[key]
			}) : oldShape[key];
			assignProp(this, "shape", shape);
			return shape;
		},
		checks: []
	}));
}
function required(Class, schema, mask) {
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const oldShape = schema._zod.def.shape;
		const shape = { ...oldShape };
		if (mask) for (const key of Reflect.ownKeys(mask)) {
			if (!Object.prototype.hasOwnProperty.call(shape, key)) throw new Error(`Unrecognized key: "${String(key)}"`);
			if (!mask[key]) continue;
			shape[key] = new Class({
				type: "nonoptional",
				innerType: oldShape[key]
			});
		}
		else for (const key of Reflect.ownKeys(oldShape)) shape[key] = new Class({
			type: "nonoptional",
			innerType: oldShape[key]
		});
		assignProp(this, "shape", shape);
		return shape;
	} }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a$2;
		(_a$2 = iss).path ?? (_a$2.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
	var _a$2;
	for (let i = start; i < issues.length; i++) (_a$2 = issues[i]).schema ?? (_a$2.schema = inst);
}
function finalizeIssue(iss, ctx, config$1) {
	var _a$2;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) if (traits.has("$ZodCheck")) (_a$2 = iss).schema ?? (_a$2.schema = iss.inst);
	else iss.schema = iss.inst;
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config$1.customError?.(iss)) ?? unwrapMessage(config$1.localeError?.(iss)) ?? "Invalid input";
	const { inst: _inst, schema: _schema, continue: _continue, input: _input, ...rest } = iss;
	rest.path ?? (rest.path = []);
	rest.message = message;
	if (ctx?.reportInput) rest.input = _input;
	return rest;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str$1) {
	const units = str$1.length;
	if (!highSurrogate.test(str$1)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str$1.charCodeAt(i) & 64512) === 55296 && (str$1.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
const CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
	const fn = () => value;
	fn[CONSTANT_CATCH] = true;
	return fn;
}
var _a$1;
var _zodDesc$1 = {
	value: void 0,
	enumerable: false
};
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
function $constructor(name, initializer$2, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc$1.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc$1);
			} finally {
				_zodDesc$1.value = void 0;
			}
		}
		if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer$2(inst, def);
		if (initialized) {
			const own$1 = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own$1;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own$1;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto$1 = _.prototype;
		for (const k in proto$1) {
			if (!Object.prototype.hasOwnProperty.call(proto$1, k)) continue;
			if (!(k in inst)) inst[k] = proto$1[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
const globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
var _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
var _zodDesc = {
	value: void 0,
	enumerable: false
};
var _issuesDesc = {
	value: void 0,
	enumerable: false
};
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	_zodDesc.value = inst._zod;
	Object.defineProperty(inst, "_zod", _zodDesc);
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_zodDesc.value = void 0;
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, void 0, { Parent: Error });
function node(obj, key, make) {
	if (!Object.prototype.hasOwnProperty.call(obj, key)) if (key === "__proto__") Object.defineProperty(obj, key, {
		value: make(),
		writable: true,
		enumerable: true,
		configurable: true
	});
	else obj[key] = make();
	return obj[key];
}
function flattenError(error$1, mapper = (issue$1) => issue$1.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error$1.issues) if (sub.path.length > 0) node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
	else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error$1, mapper = (issue$1) => issue$1.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error$2, path = []) => {
		for (const issue$1 of error$2.issues) if (issue$1.code === "invalid_union" && issue$1.errors.length) issue$1.errors.map((issues) => processError({ issues }, [...path, ...issue$1.path]));
		else if (issue$1.code === "invalid_key") processError({ issues: issue$1.issues }, [...path, ...issue$1.path]);
		else if (issue$1.code === "invalid_element") processError({ issues: issue$1.issues }, [...path, ...issue$1.path]);
		else {
			const fullpath = [...path, ...issue$1.path];
			if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue$1));
			else {
				let curr = fieldErrors;
				let i = 0;
				while (i < fullpath.length) {
					const el = fullpath[i];
					const terminal = i === fullpath.length - 1;
					if (el === "_errors") {
						if (terminal) curr._errors.push(mapper(issue$1));
						i++;
						continue;
					}
					if (!Object.prototype.hasOwnProperty.call(curr, el)) Object.defineProperty(curr, el, {
						value: { _errors: [] },
						enumerable: true,
						writable: true,
						configurable: true
					});
					const node$1 = curr[el];
					if (terminal) node$1._errors.push(mapper(issue$1));
					curr = node$1;
					i++;
				}
			}
		}
	};
	processError(error$1);
	return fieldErrors;
}
function finalizeParams(callee, params) {
	return {
		callee: params?.callee ?? callee,
		Err: params?.Err
	};
}
const _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? {
		success: false,
		error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParse$1 = /* @__PURE__ */ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? {
		success: false,
		error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParseAsync$1 = /* @__PURE__ */ _safeParseAsync($ZodRealError);
const _encode = (_Err) => {
	const parse$2 = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse$2(schema, value, _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" }, finalizeParams(fn, _params));
	};
	return fn;
};
const _decode = (_Err) => {
	const parse$2 = _parse(_Err);
	const fn = (schema, value, _ctx, _params) => {
		return parse$2(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _encodeAsync = (_Err) => {
	const parseAsync$2 = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync$2(schema, value, _ctx ? {
			..._ctx,
			direction: "backward"
		} : { direction: "backward" }, finalizeParams(fn, _params));
	};
	return fn;
};
const _decodeAsync = (_Err) => {
	const parseAsync$2 = _parseAsync(_Err);
	const fn = async (schema, value, _ctx, _params) => {
		return await parseAsync$2(schema, value, _ctx, finalizeParams(fn, _params));
	};
	return fn;
};
const _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
const _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		direction: "backward"
	} : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
const cuid = /^[cC][0-9a-z]{6,}$/;
const cuid2 = /^[0-9a-z]+$/;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
const xid = /^[0-9a-vA-V]{20}$/;
const ksuid = /^[A-Za-z0-9]{27}$/;
const nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
	return /* @__PURE__ */ new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
const uuid = (version$1) => {
	if (!version$1) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return /* @__PURE__ */ new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version$1}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji$1 = `^[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
	return new RegExp(_emoji$1, "u");
}
const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url = /^[A-Za-z0-9_-]*$/;
const httpProtocol = /^https?$/;
const e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source) {
	return /* @__PURE__ */ new RegExp(`^${source}$`);
}
const date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time(args) {
	return /* @__PURE__ */ new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
	const opts = ["Z"];
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const qualified = `${timeSource({
		precision: args.precision,
		seconds: true
	})}(?:${opts.join("|")})`;
	const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
	return /* @__PURE__ */ new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const string$1 = (params) => {
	const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
	return /* @__PURE__ */ new RegExp(`^${regex}$`);
};
const integer = /^-?\d+$/;
const number$1 = /^-?\d+(?:\.\d+)?$/;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
	var _a$2;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a$2 = inst._zod).onattach ?? (_a$2.onattach = []);
});
var _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
		if (def.value < curr) if (def.inclusive) bag.maximum = def.value;
		else bag.exclusiveMaximum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
		if (def.value > curr) if (def.inclusive) bag.minimum = def.value;
		else bag.exclusiveMinimum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst$1) => {
		var _a$2;
		(_a$2 = inst$1._zod.bag).multipleOf ?? (_a$2.multipleOf = def.value);
	});
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.format = def.format;
		bag.minimum = minimum;
		bag.maximum = maximum;
		if (isInt) bag.pattern = integer;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a$2;
	$ZodCheck.init(inst, def);
	(_a$2 = inst._zod.def).when ?? (_a$2.when = _whenHasLength);
	inst._zod.onattach.push((inst$1) => {
		const curr = inst$1._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
		if (def.maximum < curr) inst$1._zod.bag.maximum = def.maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a$2;
	$ZodCheck.init(inst, def);
	(_a$2 = inst._zod.def).when ?? (_a$2.when = _whenHasLength);
	inst._zod.onattach.push((inst$1) => {
		const curr = inst$1._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
		if (def.minimum > curr) inst$1._zod.bag.minimum = def.minimum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a$2;
	$ZodCheck.init(inst, def);
	(_a$2 = inst._zod.def).when ?? (_a$2.when = _whenHasLength);
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.minimum = def.length;
		bag.maximum = def.length;
		bag.length = def.length;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a$2, _b;
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.format = def.format;
		if (def.pattern) {
			bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
			bag.patterns.add(def.pattern);
		}
	});
	if (def.pattern) (_a$2 = inst._zod).check ?? (_a$2.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
const $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
	def.pattern = pattern;
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = /* @__PURE__ */ new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = /* @__PURE__ */ new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst$1) => {
		const bag = inst$1._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});
var Doc = class {
	constructor(args = [], closed = {}) {
		this.content = [];
		this.indent = 0;
		this.args = args;
		this.closed = closed;
	}
	indented(fn) {
		this.indent += 1;
		fn(this);
		this.indent -= 1;
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const content = this?.content ?? [``];
		return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {\n${content.join("\n")}\n};`)(...Object.values(this.closed));
	}
};
const version = {
	major: 4,
	minor: 5,
	patch: 4
};
const $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
	var _a$2;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a$2 = inst._zod).deferred ?? (_a$2.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks$1, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks$1) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult$1) => inst._zod.parse(checkResult$1, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary$1) => {
					return handleCanaryResult(canary$1, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result$1) => runChecks(result$1, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
var toStandardResult = (r) => r.success ? { value: r.data } : { issues: r.error?.issues };
function standardProps(inst) {
	return {
		validate: (value) => {
			try {
				return toStandardResult(safeParse$1(inst, value));
			} catch (_) {
				return safeParseAsync$1(inst, value).then(toStandardResult);
			}
		},
		vendor: "zod",
		version: 1
	};
}
const $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_$1) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid(v));
	} else def.pattern ?? (def.pattern = uuid());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email);
	$ZodStringFormat.init(inst, def);
});
function parseURLObject(trimmed, def) {
	if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return 1;
	try {
		return new URL(trimmed);
	} catch {
		return 2;
	}
}
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
	return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
	hostname.lastIndex = 0;
	return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
	protocol.lastIndex = 0;
	return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
const $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = parseURLObject(trimmed, def);
			if (url === 1) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid URL format",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (url === 2) {
				payload.issues.push({
					code: "invalid_format",
					format: "url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
				return;
			}
			if (def.hostname && !urlHostnameOk(url, def.hostname)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid hostname",
				pattern: def.hostname.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			if (def.protocol && !urlProtocolOk(url, def.protocol)) payload.issues.push({
				code: "invalid_format",
				format: "url",
				note: "Invalid protocol",
				pattern: def.protocol.source,
				input: payload.value,
				inst,
				continue: !def.abort
			});
			payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
	if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
	def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime(def));
	$ZodStringFormat.init(inst, def);
	if (def.local || def.precision === -1) {
		inst._zod.bag.laxFormat = true;
		inst._zod.onattach.push((s) => {
			s._zod.bag.laxFormat = true;
		});
	}
});
const $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv4`;
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
	if (!ipv6Alphabet.test(value)) return false;
	try {
		new URL(`http://[${value}]`);
		return true;
	} catch {
		return false;
	}
}
const $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv6`;
	inst._zod.check = (payload) => {
		if (!isValidIPv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "ipv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4);
	$ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
	const parts = value.split("/");
	if (parts.length !== 2) return false;
	const [address, prefix] = parts;
	if (!prefix) return false;
	const prefixNum = Number(prefix);
	if (`${prefixNum}` !== prefix) return false;
	if (prefixNum < 0 || prefixNum > 128) return false;
	return isValidIPv6(address);
}
const $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (!isValidCIDRv6(payload.value)) payload.issues.push({
			code: "invalid_format",
			format: "cidrv6",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (/\s/.test(data)) return false;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64";
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64URL(data) {
	if (!base64url.test(data)) return false;
	const base64$1 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64$1.padEnd(Math.ceil(base64$1.length / 4) * 4, "="));
}
const $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64url);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64url";
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo$1 = globalConfig.memoizer;
	memo$1?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo$1 ? memo$1.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result$1) => handleArrayResult(result$1, payload, i)));
			else handleArrayResult(result, payload, i);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	for (const key in input) {
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r$1) => handlePropertyResult(r$1, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
var propShapes = /* @__PURE__ */ new WeakMap();
const $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
		const sh = def.shape;
		propShapes.set(def, sh);
		Object.defineProperty(def, "shape", { get: () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			propShapes.set(def, newSh);
			return newSh;
		} });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	const memo$1 = globalConfig.memoizer;
	memo$1?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo$1 ? memo$1.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		for (const key of value.allKeys) {
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r$1) => handlePropertyResult(r$1, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
	};
});
const $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const memo$1 = globalConfig.memoizer;
	const generateFastpass = (shape) => {
		const normalized = _normalized.value;
		const syms = normalized.symbolKeys;
		const doc = new Doc(["payload", "ctx"], {
			shape,
			inst,
			memo: memo$1,
			syms
		});
		const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		const prefixStr = (id, k) => `
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
          }`;
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.allKeys) ids[key] = `key_${counter++}`;
		doc.write(memo$1 ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
		for (const key of normalized.allKeys) {
			if (key === "__proto__") continue;
			const id = ids[key];
			const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
			const isPresent = `${k} in input`;
			const schema = shape[key];
			const optin = schema?._zod?.optin;
			const isOptionalIn = optin !== void 0;
			const isOptionalOut = schema?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(k)};`);
			if (isOptionalIn && isOptionalOut) {
				const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
				doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
			} else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
			else doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        
        if (${id}.value === undefined) {
          if (${isPresent}) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }

      `);
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		return doc.compile();
	};
	let fastpass;
	const isObject$1 = isObject;
	const jit = !globalConfig.jitless;
	const fastEnabled = jit && allowsEval.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
	defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazyInternal(inst, "values", (zod) => {
		if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		if (zod.def.options.every((o) => o._zod.pattern)) {
			const patterns = zod.def.options.map((o) => o._zod.pattern);
			return /* @__PURE__ */ new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const first = def.options.length === 1 ? def.options[0]._zod.run : null;
	inst._zod.parse = (payload, ctx) => {
		if (first) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results$1) => {
			return handleUnionResults(results$1, payload, inst, ctx);
		});
	};
});
const $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left$1, right$1]) => {
			return handleIntersectionResults(payload, left$1, right$1);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		if (Object.prototype.hasOwnProperty.call(newObj, "__proto__")) delete newObj.__proto__;
		for (const key of sharedKeys) {
			if (key === "__proto__") continue;
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	const keyIssues = /* @__PURE__ */ new Map();
	const collect = (iss, side) => {
		let keys;
		if (iss.code === "unrecognized_keys" && !iss.path?.length) {
			unrecIssue ?? (unrecIssue = iss);
			keys = iss.keys;
		} else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
			const k = String(iss.path[0]);
			if (!keyIssues.has(k)) keyIssues.set(k, iss);
			keys = [k];
		} else return false;
		for (const k of keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k)[side] = true;
		}
		return true;
	};
	for (const iss of left.issues) if (!collect(iss, "l")) result.issues.push(iss);
	for (const iss of right.issues) if (!collect(iss, "r")) result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length) {
		const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
		if (aggregated.length) result.issues.push({
			...unrecIssue,
			keys: aggregated
		});
		for (const k of bothKeys) if (!aggregated.includes(k) && keyIssues.has(k)) result.issues.push(keyIssues.get(k));
	}
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) {
		if (aborted(result)) return result;
		throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	}
	result.value = merged.data;
	return result;
}
const $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	const patternValues = values.filter((k) => propertyKeyTypes.has(typeof k));
	inst._zod.pattern = /* @__PURE__ */ new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	globalConfig.memoizer.guard(inst);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
const $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? /* @__PURE__ */ new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result$1) => handleOptionalResult(payload, result$1));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? /* @__PURE__ */ new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result$1) => handleDefaultResult(result$1, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "defaulted";
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => {
		const v = zod.def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result$1) => handleNonOptionalResult(result$1, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
function handleCatchResult(payload, result, def, ctx) {
	if (!result.issues.length) {
		payload.value = result.value;
		if (result.memo) payload.memo = true;
		return payload;
	}
	payload.value = def.catchValue({
		...result,
		value: payload.value,
		error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
		input: payload.value
	});
	return payload;
}
const $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run({
			value: payload.value,
			issues: []
		}, ctx);
		if (result instanceof Promise) return result.then((result$1) => handleCatchResult(payload, result$1, def, ctx));
		return handleCatchResult(payload, result, def, ctx);
	};
});
const $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right$1) => handlePipeResult(right$1, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left$1) => handlePipeResult(left$1, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
	defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	if (!payload.memo) payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r$1) => handleRefineResult(r$1, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}
var $ZodCyclicError = class extends Error {
	constructor() {
		super(`Cannot parse a reference cycle that closes through a transform`);
		this.name = "ZodCyclicError";
	}
};
var STATE = "~memo";
var NO_ISSUES = [];
function cloneIssues(issues) {
	return issues.map((iss) => iss.path ? {
		...iss,
		path: iss.path.slice()
	} : { ...iss });
}
var recursive = /* @__PURE__ */ new WeakMap();
function isRecursive(inst, stack) {
	const cached$1 = recursive.get(inst);
	if (cached$1 !== void 0) return cached$1;
	if (stack.has(inst)) return true;
	stack.add(inst);
	let result = false;
	const check = (child) => {
		if (!result && child?._zod && isRecursive(child, stack)) result = true;
	};
	const def = inst._zod.def;
	switch (def.type) {
		case "object":
			for (const key of Reflect.ownKeys(def.shape)) check(def.shape[key]);
			check(def.catchall);
			break;
		case "array":
			check(def.element);
			break;
		case "tuple":
			for (const el of def.items) check(el);
			check(def.rest);
			break;
		case "record":
		case "map":
			check(def.keyType);
			check(def.valueType);
			break;
		case "set":
			check(def.valueType);
			break;
		case "union":
			for (const el of def.options) check(el);
			break;
		case "intersection":
			check(def.left);
			check(def.right);
			break;
		case "optional":
		case "nullable":
		case "default":
		case "prefault":
		case "catch":
		case "readonly":
		case "nonoptional":
		case "promise":
		case "success":
			check(def.innerType);
			break;
		case "pipe":
			check(def.in);
			check(def.out);
			break;
		case "function":
			check(def.input);
			check(def.output);
			break;
		case "lazy":
			check(inst._zod.innerType);
			break;
		case "template_literal":
		case "string":
		case "number":
		case "int":
		case "boolean":
		case "bigint":
		case "symbol":
		case "undefined":
		case "null":
		case "void":
		case "never":
		case "any":
		case "unknown":
		case "date":
		case "nan":
		case "enum":
		case "literal":
		case "file":
		case "transform":
		case "custom": break;
		default: for (const key in def) {
			const desc = Object.getOwnPropertyDescriptor(def, key);
			if (!desc || desc.get) continue;
			const value = desc.value;
			if (!value || typeof value !== "object") continue;
			if (value._zod) check(value);
			else if (Array.isArray(value)) for (const el of value) check(el);
		}
	}
	stack.delete(inst);
	recursive.set(inst, result);
	return result;
}
function bucketFor(state, inst) {
	let bucket = state.buckets.get(inst);
	if (!bucket) {
		bucket = /* @__PURE__ */ new Map();
		state.buckets.set(inst, bucket);
	}
	return bucket;
}
var handoff;
var open = [];
var memo = {
	alloc(_inst, payload, empty) {
		const bucket = handoff;
		if (!bucket) return empty;
		handoff = void 0;
		const entry = {
			value: empty,
			issues: null
		};
		bucket.set(payload.value, entry);
		open.push(entry);
		return empty;
	},
	guard(inst) {
		var _a$2;
		(_a$2 = inst._zod).deferred ?? (_a$2.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
				return base(payload, ctx);
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	},
	attach(inst) {
		var _a$2;
		let isRecursiveInst;
		let lastCtx;
		let lastBucket;
		(_a$2 = inst._zod).deferred ?? (_a$2.deferred = []);
		inst._zod.deferred.push(() => {
			const base = inst._zod.parse;
			const wrapped = (payload, ctx) => {
				if (isRecursiveInst === void 0) {
					isRecursiveInst = isRecursive(inst, /* @__PURE__ */ new Set());
					if (!isRecursiveInst) {
						inst._zod.parse = base;
						if (inst._zod.run === wrapped) inst._zod.run = base;
						return base(payload, ctx);
					}
				}
				const input = payload.value;
				if (input === null || typeof input !== "object") return base(payload, ctx);
				let state = ctx[STATE];
				if (!state) {
					state = {
						buckets: /* @__PURE__ */ new Map(),
						backEdges: void 0
					};
					ctx[STATE] = state;
				}
				let bucket;
				if (lastCtx === ctx) bucket = lastBucket;
				else {
					bucket = bucketFor(state, inst);
					lastCtx = ctx;
					lastBucket = bucket;
				}
				const hit = bucket.get(input);
				if (hit) {
					payload.value = hit.value;
					if (hit.issues) {
						if (hit.issues.length) payload.issues.push(...cloneIssues(hit.issues));
					} else {
						payload.memo = true;
						state.backEdges ?? (state.backEdges = /* @__PURE__ */ new Set());
						state.backEdges.add(hit.value);
					}
					return payload;
				}
				handoff = bucket;
				const depth = open.length;
				const result = base(payload, ctx);
				handoff = void 0;
				const entry = open.length > depth ? open.pop() : void 0;
				if (result instanceof Promise) return result.then((r) => {
					if (entry) entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
					return r;
				});
				if (entry) entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
				return result;
			};
			inst._zod.parse = wrapped;
			if (inst._zod.run === base) inst._zod.run = wrapped;
		});
	}
};
function memoizer() {
	return memo;
}
function isBackEdge(ctx, value) {
	const backEdges = ctx[STATE]?.backEdges;
	return backEdges !== void 0 && value !== null && typeof value === "object" && backEdges.has(value);
}
var error = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		credit_card: "credit card number",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	function getTypeName(type, input) {
		if (type === "number" && typeof input === "number" && !Number.isFinite(input)) return String(input);
		return TypeDictionary[type] ?? type;
	}
	return (issue$1) => {
		switch (issue$1.code) {
			case "invalid_type": return `Invalid input: expected ${getTypeName(issue$1.expected)}, received ${getTypeName(parsedType(issue$1.input), issue$1.input)}`;
			case "invalid_value":
				if (issue$1.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue$1.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue$1.values, "|")}`;
			case "too_big": {
				const adj = issue$1.exact ? "exactly " : issue$1.inclusive ? "<=" : "<";
				const sizing = getSizing(issue$1.origin);
				if (sizing) return `Too big: expected ${issue$1.origin ?? "value"} to have ${adj}${issue$1.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue$1.origin ?? "value"} to be ${adj}${issue$1.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue$1.exact ? "exactly " : issue$1.inclusive ? ">=" : ">";
				const sizing = getSizing(issue$1.origin);
				if (sizing) return `Too small: expected ${issue$1.origin} to have ${adj}${issue$1.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue$1.origin} to be ${adj}${issue$1.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue$1;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue$1.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue$1.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue$1.keys.length > 1 ? "s" : ""}: ${joinValues(issue$1.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue$1.origin}`;
			case "invalid_union":
				if (issue$1.options && Array.isArray(issue$1.options) && issue$1.options.length > 0) return `Invalid discriminator value. Expected ${issue$1.options.map((o) => `'${o}'`).join(" | ")}`;
				if (issue$1.inclusive === false) return "Invalid input: more than one option matched";
				return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue$1.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error() };
}
var _a;
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta$2 = _meta[0];
		this._map.set(schema, meta$2);
		if (meta$2 && typeof meta$2 === "object" && "id" in meta$2) this._idmap.set(meta$2.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta$2 = this._map.get(schema);
		if (meta$2 && typeof meta$2 === "object" && "id" in meta$2) this._idmap.delete(meta$2.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;
/* @__NO_SIDE_EFFECTS__ */
function _string(Class, params) {
	return new Class({
		type: "string",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _coercedNumber(Class, params) {
	return new Class({
		type: "number",
		coerce: true,
		checks: [],
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
/* @__NO_SIDE_EFFECTS__ */
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
/* @__NO_SIDE_EFFECTS__ */
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
/* @__NO_SIDE_EFFECTS__ */
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
/* @__NO_SIDE_EFFECTS__ */
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _superRefine(fn, params) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	}, params);
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
function assignProps(target, ...sources) {
	for (const source of sources) for (const key of Reflect.ownKeys(source)) if (Object.prototype.propertyIsEnumerable.call(source, key)) assignProp(target, key, source[key]);
	return target;
}
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		sharedDefsExtractedFor: void 0,
		sharedEmitDoneFor: void 0,
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		intersections: [],
		deferred: [],
		external: params?.external ?? void 0
	};
}
function handleUnrepresentable(schema, ctx, json, params, message) {
	const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({
		zodSchema: schema,
		path: params.path,
		message
	}) : ctx.unrepresentable;
	if (result === "any") return false;
	if (result === void 0 || result === "throw") throw new Error(message);
	Object.assign(json, result);
	return true;
}
function process$1(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a$2;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	ctx.sharedDefsExtractedFor = void 0;
	ctx.sharedEmitDoneFor = void 0;
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			process$1(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta$2 = ctx.metadataRegistry.get(schema);
	if (meta$2) assignProps(result.schema, meta$2);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && "_prefault" in result.schema) (_a$2 = result.schema).default ?? (_a$2.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function encodeJSONPointerSegment(segment) {
	return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id$1) => id$1);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}`
			};
		}
		const uriPrefix = `#`;
		const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
		if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + encodeJSONPointerSegment(defId)
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema$1 = seen.schema;
		for (const key in schema$1) delete schema$1[key];
		schema$1.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") {
				extractToDef(entry);
				continue;
			}
		}
	}
	if (ctx.external) ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
	const options = schema.anyOf;
	if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
	const types = [];
	for (const option of options) {
		if (!option || typeof option !== "object") return;
		compactTypeUnion(option);
		const keys = Object.keys(option);
		if (keys.length !== 1 || keys[0] !== "type") return;
		const type = option.type;
		for (const member$1 of Array.isArray(type) ? type : [type]) {
			if (typeof member$1 !== "string") return;
			if (!types.includes(member$1)) types.push(member$1);
		}
	}
	delete schema.anyOf;
	schema.type = types.length === 1 ? types[0] : types;
}
var FOLDABLE_KEYS = new Set([
	"type",
	"properties",
	"required",
	"additionalProperties"
]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member$1) {
	const extra = member$1.additionalProperties;
	if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null) return null;
	return Object.keys(extra).length ? extra : null;
}
function foldObjects(members$1) {
	const objects = [];
	for (const member$1 of members$1) {
		if (typeof member$1 !== "object" || member$1.type !== "object") return null;
		for (const key in member$1) if (!FOLDABLE_KEYS.has(key)) return null;
		objects.push(member$1);
	}
	const properties = {};
	const required$1 = /* @__PURE__ */ new Set();
	for (const object$1 of objects) {
		for (const key in object$1.properties) {
			if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
			const parts = [];
			for (const other of objects) {
				const part = other.properties?.[key] ?? undeclaredConstraint(other);
				if (part === null || part === void 0) continue;
				if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part))) parts.push(part);
			}
			assignProp(properties, key, parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts });
		}
		for (const key of object$1.required ?? []) required$1.add(key);
	}
	const folded = {
		type: "object",
		properties
	};
	if (required$1.size) folded.required = [...required$1];
	if (objects.every((object$1) => object$1.additionalProperties === false)) folded.additionalProperties = false;
	else {
		const constraints = [];
		for (const object$1 of objects) {
			const constraint = undeclaredConstraint(object$1);
			if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint))) constraints.push(constraint);
		}
		if (constraints.length === 1) folded.additionalProperties = constraints[0];
		else if (constraints.length > 1) folded.additionalProperties = { allOf: constraints };
	}
	return folded;
}
function foldIntersection(json) {
	const allOf = json.allOf;
	if (!Array.isArray(allOf) || allOf.length < 2) return;
	for (const key of FOLDABLE_KEYS) if (key in json) return;
	const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
	let folded = null;
	if (!unions.length) folded = foldObjects(allOf);
	else {
		const union$1 = unions[0];
		const keyword = UNION_KEYS.find((k) => Array.isArray(union$1[k]));
		if (Object.keys(union$1).length !== 1) return;
		const rest = allOf.filter((m) => m !== union$1);
		const branches = union$1[keyword].map((branch) => foldObjects([...rest, branch]));
		if (branches.some((b) => !b)) return;
		folded = { [keyword]: branches };
	}
	if (!folded) return;
	delete json.allOf;
	assignProps(json, folded);
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema$1 = seen.def ?? seen.schema;
		const _cached = { ...schema$1 };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema$1.allOf = schema$1.allOf ?? [];
				schema$1.allOf.push(refSchema);
			} else assignProps(schema$1, refSchema);
			assignProps(schema$1, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema$1) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema$1[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema$1) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema$1[key]) === JSON.stringify(refSeen.def[key])) delete schema$1[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema$1.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema$1) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema$1[key]) === JSON.stringify(parentSeen.def[key])) delete schema$1[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema$1,
			path: seen.path ?? []
		});
	};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
		for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
		if (ctx.target !== "openapi-3.0") for (const entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
		for (const rewrite of ctx.deferred) rewrite();
		if (ctx.intersections.length) {
			const carriers = /* @__PURE__ */ new Map();
			for (const seen of ctx.seen.values()) for (const json of [seen.schema, seen.def]) {
				const allOf = json?.allOf;
				if (!Array.isArray(allOf)) continue;
				const existing = carriers.get(allOf);
				if (existing) existing.push(json);
				else carriers.set(allOf, [json]);
			}
			for (const allOf of ctx.intersections) for (const json of carriers.get(allOf) ?? []) foldIntersection(json);
		}
	}
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
	const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
	if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
	const defs = ctx.external?.defs ?? {};
	if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) {
			if (seen.def.id === seen.defId) delete seen.def.id;
			assignProp(defs, seen.defId, seen.def);
		}
	}
	if (ctx.external) ctx.sharedEmitDoneFor = ctx.external;
	if (ctx.external) {} else if (Object.keys(defs).length > 0) if (ctx.target === "draft-2020-12") result.$defs = defs;
	else result.definitions = defs;
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") {
		if (_schema._zod.traits.has("$ZodCodec")) return true;
		return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	}
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
var formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
const stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = schema._zod.bag;
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time" || laxFormat) delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const patternList = [...patterns];
		if (patternList.length === 1) json.pattern = patternList[0].source;
		else if (patternList.length > 1) json.allOf = [...patternList.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
const numberProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
	if (typeof format === "string" && format.includes("int")) json.type = "integer";
	else json.type = "number";
	const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
	const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
	const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
	if (exMin) if (legacy) {
		json.minimum = exclusiveMinimum;
		json.exclusiveMinimum = true;
	} else json.exclusiveMinimum = exclusiveMinimum;
	else if (typeof minimum === "number") json.minimum = minimum;
	if (exMax) if (legacy) {
		json.maximum = exclusiveMaximum;
		json.exclusiveMaximum = true;
	} else json.exclusiveMaximum = exclusiveMaximum;
	else if (typeof maximum === "number") json.maximum = maximum;
	if (typeof multipleOf === "number") if (Number.isFinite(multipleOf) && multipleOf !== 0) json.multipleOf = Math.abs(multipleOf);
	else handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${multipleOf} cannot be represented in JSON Schema`);
};
const neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
const unknownProcessor = (_schema, _ctx, _json, _params) => {};
const enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.length === 0) {
		json.not = {};
		return;
	}
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
const customProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
const transformProcessor = (schema, ctx, json, params) => {
	handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = process$1(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
function inputOptin(schema) {
	const def = schema._zod.def;
	if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) return inputOptin(def.out);
	if (def.type === "catch") return inputOptin(def.innerType);
	return schema._zod.optin;
}
const objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const shape = def.shape;
	if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
	json.type = "object";
	json.properties = {};
	for (const key in shape) assignProp(json.properties, key, process$1(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	}));
	const allKeys = new Set(Object.keys(shape));
	const requiredKeys = new Set([...allKeys].filter((key) => {
		const field = def.shape[key];
		if (ctx.io === "input") return inputOptin(field) === void 0;
		else return field._zod.optout === void 0;
	}));
	if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = process$1(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
const unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => process$1(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = process$1(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = process$1(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	const allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
	json.allOf = allOf;
	ctx.intersections.push(allOf);
};
const nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
var UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
	let unrepresentable = false;
	const serialized = JSON.stringify(value, (_, val) => {
		if (typeof val !== "bigint") return val;
		unrepresentable = true;
		return null;
	});
	if (!unrepresentable) return JSON.parse(serialized);
	handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
	return UNREPRESENTABLE_DEFAULT;
}
const defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json.default = value;
};
const prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io !== "input") return;
	const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
	if (value !== UNREPRESENTABLE_DEFAULT) json._prefault = value;
};
const catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
		return;
	}
	json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const inIsTransform = def.in._zod.traits.has("$ZodTransform");
	const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
	process$1(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
const optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
	Object.defineProperty(proto, key, {
		configurable: true,
		enumerable: false,
		get() {
			const value = make(this);
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
			return value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				value,
				configurable: true,
				writable: true
			});
		}
	});
}
var initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	const proto = Object.getPrototypeOf(inst);
	if (_installedErrorProtos.has(proto)) return;
	_installedErrorProtos.add(proto);
	_lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
	_lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
	_lazyMethod(proto, "addIssue", (self) => (issue$1) => {
		self.issues.push(issue$1);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	_lazyMethod(proto, "addIssues", (self) => (issues$1) => {
		self.issues.push(...issues$1);
		self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
	});
	Object.defineProperty(proto, "isEmpty", {
		configurable: true,
		enumerable: false,
		get() {
			return this.issues.length === 0;
		}
	});
};
const ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer, void 0, { Parent: Error });
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
function _ensureDefaultLocale() {
	if (!globalConfig.localeError) config(en_default());
}
function _ensureDefaultMemoizer() {
	if (!globalConfig.memoizer) config({ memoizer: memoizer() });
}
const ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
	_ensureDefaultLocale();
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
	return inst;
}, {
	check(...chks) {
		const def = this.def;
		return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	},
	with(...chks) {
		return this.check(...chks);
	},
	clone(def, params) {
		return clone(this, def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta$2) {
		reg.add(this, meta$2);
		return this;
	},
	refine(check, params) {
		return this.check(refine(check, params));
	},
	superRefine(refinement, params) {
		return this.check(superRefine(refinement, params));
	},
	overwrite(fn) {
		return this.check(/* @__PURE__ */ _overwrite(fn));
	},
	optional() {
		return optional(this);
	},
	exactOptional() {
		return exactOptional(this);
	},
	nullable() {
		return nullable(this);
	},
	nullish() {
		return optional(nullable(this));
	},
	nonoptional(params) {
		return nonoptional(this, params);
	},
	array() {
		return array(this);
	},
	or(arg) {
		return union([this, arg]);
	},
	and(arg) {
		return intersection(this, arg);
	},
	transform(tx) {
		return pipe(this, transform(tx));
	},
	default(d) {
		return _default(this, d);
	},
	prefault(d) {
		return prefault(this, d);
	},
	catch(params) {
		return _catch(this, params);
	},
	pipe(target) {
		return pipe(this, target);
	},
	readonly() {
		return readonly(this);
	},
	describe(description) {
		const cl = this.clone();
		globalRegistry.add(cl, { description });
		return cl;
	},
	meta(...args) {
		if (args.length === 0) return globalRegistry.get(this);
		const cl = this.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	},
	isOptional() {
		return this.safeParse(void 0).success;
	},
	isNullable() {
		return this.safeParse(null).success;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	},
	get "~standard"() {
		return hide(this, "~standard", {
			...standardProps(this),
			jsonSchema: {
				input: createStandardJSONSchemaMethod(this, "input"),
				output: createStandardJSONSchemaMethod(this, "output")
			}
		});
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	},
	parse: function _parse$1(data, params) {
		return parse(this, data, params, { callee: _parse$1 });
	},
	parseAsync: async function _parseAsync$1(data, params) {
		return await parseAsync(this, data, params, { callee: _parseAsync$1 });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	async safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	get spa() {
		return this?.safeParseAsync;
	},
	set spa(value) {
		own(this, "spa", value);
	},
	encode: function _encode$1(data, params) {
		return encode(this, data, params, { callee: _encode$1 });
	},
	decode: function _decode$1(data, params) {
		return decode(this, data, params, { callee: _decode$1 });
	},
	encodeAsync: async function _encodeAsync$1(data, params) {
		return await encodeAsync(this, data, params, { callee: _encodeAsync$1 });
	},
	decodeAsync: async function _decodeAsync$1(data, params) {
		return await decodeAsync(this, data, params, { callee: _decodeAsync$1 });
	},
	safeEncode(data, params) {
		return safeEncode(this, data, params);
	},
	safeDecode(data, params) {
		return safeDecode(this, data, params);
	},
	async safeEncodeAsync(data, params) {
		return safeEncodeAsync(this, data, params);
	},
	async safeDecodeAsync(data, params) {
		return safeDecodeAsync(this, data, params);
	},
	toJSONSchema(params) {
		return createToJSONSchemaMethod(this, {})(params);
	},
	get description() {
		return globalRegistry.get(this)?.description;
	},
	get _def() {
		return this._zod.def;
	}
});
const _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
	const bag = inst._zod.bag;
	inst.format = bag.format ?? null;
	inst.minLength = bag.minimum ?? null;
	inst.maxLength = bag.maximum ?? null;
}, {
	regex(...args) {
		return this.check(/* @__PURE__ */ _regex(...args));
	},
	includes(...args) {
		return this.check(/* @__PURE__ */ _includes(...args));
	},
	startsWith(...args) {
		return this.check(/* @__PURE__ */ _startsWith(...args));
	},
	endsWith(...args) {
		return this.check(/* @__PURE__ */ _endsWith(...args));
	},
	min(...args) {
		return this.check(/* @__PURE__ */ _minLength(...args));
	},
	max(...args) {
		return this.check(/* @__PURE__ */ _maxLength(...args));
	},
	length(...args) {
		return this.check(/* @__PURE__ */ _length(...args));
	},
	nonempty(...args) {
		return this.check(/* @__PURE__ */ _minLength(1, ...args));
	},
	lowercase(params) {
		return this.check(/* @__PURE__ */ _lowercase(params));
	},
	uppercase(params) {
		return this.check(/* @__PURE__ */ _uppercase(params));
	},
	trim() {
		return this.check(/* @__PURE__ */ _trim());
	},
	normalize(...args) {
		return this.check(/* @__PURE__ */ _normalize(...args));
	},
	toLowerCase() {
		return this.check(/* @__PURE__ */ _toLowerCase());
	},
	toUpperCase() {
		return this.check(/* @__PURE__ */ _toUpperCase());
	},
	slugify() {
		return this.check(/* @__PURE__ */ _slugify());
	}
});
const ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
}, {
	email(params) {
		return this.check(/* @__PURE__ */ _email(ZodEmail, params));
	},
	url(params) {
		return this.check(/* @__PURE__ */ _url(ZodURL, params));
	},
	jwt(params) {
		return this.check(/* @__PURE__ */ _jwt(ZodJWT, params));
	},
	emoji(params) {
		return this.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
	},
	guid(params) {
		return this.check(/* @__PURE__ */ _guid(ZodGUID, params));
	},
	uuid(params) {
		return this.check(/* @__PURE__ */ _uuid(ZodUUID, params));
	},
	uuidv4(params) {
		return this.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
	},
	uuidv6(params) {
		return this.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
	},
	uuidv7(params) {
		return this.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
	},
	nanoid(params) {
		return this.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
	},
	cuid(params) {
		return this.check(/* @__PURE__ */ _cuid(ZodCUID, params));
	},
	cuid2(params) {
		return this.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
	},
	ulid(params) {
		return this.check(/* @__PURE__ */ _ulid(ZodULID, params));
	},
	base64(params) {
		return this.check(/* @__PURE__ */ _base64(ZodBase64, params));
	},
	base64url(params) {
		return this.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
	},
	xid(params) {
		return this.check(/* @__PURE__ */ _xid(ZodXID, params));
	},
	ksuid(params) {
		return this.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
	},
	ipv4(params) {
		return this.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
	},
	ipv6(params) {
		return this.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
	},
	cidrv4(params) {
		return this.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
	},
	cidrv6(params) {
		return this.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
	},
	e164(params) {
		return this.check(/* @__PURE__ */ _e164(ZodE164, params));
	},
	datetime(params) {
		return this.check(/* @__PURE__ */ _isoDateTime(ZodISODateTime, params));
	},
	date(params) {
		return this.check(/* @__PURE__ */ _isoDate(ZodISODate, params));
	},
	time(params) {
		return this.check(/* @__PURE__ */ _isoTime(ZodISOTime, params));
	},
	duration(params) {
		return this.check(/* @__PURE__ */ _isoDuration(ZodISODuration, params));
	}
});
function string(params) {
	return /* @__PURE__ */ _string(ZodString, params);
}
const ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
const ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	const bag = inst._zod.bag;
	inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
	inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
	inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
	inst.isFinite = true;
	inst.format = bag.format ?? null;
}, {
	gt(value, params) {
		return this.check(/* @__PURE__ */ _gt(value, params));
	},
	gte(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	min(value, params) {
		return this.check(/* @__PURE__ */ _gte(value, params));
	},
	lt(value, params) {
		return this.check(/* @__PURE__ */ _lt(value, params));
	},
	lte(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	max(value, params) {
		return this.check(/* @__PURE__ */ _lte(value, params));
	},
	int(params) {
		return this.check(int(params));
	},
	safe(params) {
		return this.check(int(params));
	},
	positive(params) {
		return this.check(/* @__PURE__ */ _gt(0, params));
	},
	nonnegative(params) {
		return this.check(/* @__PURE__ */ _gte(0, params));
	},
	negative(params) {
		return this.check(/* @__PURE__ */ _lt(0, params));
	},
	nonpositive(params) {
		return this.check(/* @__PURE__ */ _lte(0, params));
	},
	multipleOf(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	step(value, params) {
		return this.check(/* @__PURE__ */ _multipleOf(value, params));
	},
	finite() {
		return this;
	}
});
const ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodNumberFormat, params);
}
const ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
	return /* @__PURE__ */ _unknown(ZodUnknown);
}
const ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return /* @__PURE__ */ _never(ZodNever, params);
}
const ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
}, {
	min(n, params) {
		return this.check(/* @__PURE__ */ _minLength(n, params));
	},
	nonempty(params) {
		return this.check(/* @__PURE__ */ _minLength(1, params));
	},
	max(n, params) {
		return this.check(/* @__PURE__ */ _maxLength(n, params));
	},
	length(n, params) {
		return this.check(/* @__PURE__ */ _length(n, params));
	},
	unwrap() {
		return this.element;
	}
});
function array(element, params) {
	return /* @__PURE__ */ _array(ZodArray, element, params);
}
const ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
	keyof() {
		return _enum(Object.keys(this._zod.def.shape));
	},
	catchall(catchall) {
		return this.clone({
			...this._zod.def,
			catchall
		});
	},
	passthrough() {
		return this.clone({
			...this._zod.def,
			catchall: unknown()
		});
	},
	loose() {
		return this.clone({
			...this._zod.def,
			catchall: unknown()
		});
	},
	strict() {
		return this.clone({
			...this._zod.def,
			catchall: never()
		});
	},
	strip() {
		return this.clone({
			...this._zod.def,
			catchall: void 0
		});
	},
	extend(incoming) {
		return extend(this, incoming);
	},
	safeExtend(incoming) {
		return safeExtend(this, incoming);
	},
	merge(other) {
		return merge(this, other);
	},
	pick(mask) {
		return pick(this, mask);
	},
	omit(mask) {
		return omit(this, mask);
	},
	partial(...args) {
		return partial(ZodOptional, this, args[0]);
	},
	exactPartial(...args) {
		return partial(ZodExactOptional, this, args[0], "exactPartial");
	},
	required(...args) {
		return required(ZodNonOptional, this, args[0]);
	}
});
function object(shape, params) {
	return new ZodObject({
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	});
}
const ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
const ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = Object.values(def.entries);
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	return new ZodEnum({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
const ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
	_ensureDefaultMemoizer();
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				if (!("input" in _issue)) _issue.input = payload.value;
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output$1) => {
			payload.value = output$1;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
const ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
const ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
	});
}
const ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
const ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
	return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
	return /* @__PURE__ */ _superRefine(fn, params);
}
function number(params) {
	return /* @__PURE__ */ _coercedNumber(ZodNumber, params);
}
var num = number().finite();
var str = string();
var person = object({
	id: str,
	name: str
}).passthrough();
var attendance = object({
	name: str,
	year: num,
	month: num
}).passthrough();
var attendanceDoc = object({ fileName: str }).passthrough();
var payment = object({
	owner: str,
	amount: num
}).passthrough();
var contract = object({
	id: str,
	name: str
}).passthrough();
var contractEntry = object({
	contractId: str,
	kind: _enum([
		"report",
		"invoice",
		"receipt"
	])
}).passthrough();
var expense = object({
	name: str,
	amount: num
}).passthrough();
var policy = object({ policyNo: str }).passthrough();
var member = object({ name: str }).passthrough();
var TELLTALE_KEYS = [
	"year",
	"years",
	"people",
	"attendance",
	"payments",
	"contracts",
	"contractEntries",
	"expenses",
	"insurancePolicies",
	"insuranceMembers"
];
const ledgerPayloadSchema = object({
	schemaVersion: num.optional(),
	year: num.optional(),
	years: array(num).optional(),
	accessHash: str.optional(),
	people: array(person).optional(),
	attendance: array(attendance).optional(),
	attendanceDocs: array(attendanceDoc).optional(),
	payments: array(payment).optional(),
	contracts: array(contract).optional(),
	contractEntries: array(contractEntry).optional(),
	expenses: array(expense).optional(),
	insurancePolicies: array(policy).optional(),
	insuranceMembers: array(member).optional()
}).passthrough().refine((v) => TELLTALE_KEYS.some((k) => k in v), { message: "内容不像台账（缺少全部台账字段），已拒绝写入以免清空数据" });
function validateLedgerPayload(body) {
	const r = ledgerPayloadSchema.safeParse(body);
	if (r.success) return null;
	const first = r.error.issues[0];
	return `台账数据格式不对：${first?.path.join(".") || "(根)"} ${first?.message || ""}`.trim();
}
function ledgerPayloadSummary(body) {
	if (!body || typeof body !== "object") return { type: typeof body };
	const o = body;
	const count = (v) => Array.isArray(v) ? v.length : "-";
	return {
		schemaVersion: o.schemaVersion ?? "(无)",
		year: o.year ?? "-",
		people: count(o.people),
		attendance: count(o.attendance),
		payments: count(o.payments),
		contracts: count(o.contracts),
		contractEntries: count(o.contractEntries),
		expenses: count(o.expenses),
		insurancePolicies: count(o.insurancePolicies)
	};
}
var CORRUPT_MSG = "服务器上的台账文件读取失败，已拒绝读写。请从 data/backups 恢复或联系管理员（不要手动清空 data）。";
const Route$20 = createFileRoute("/api/ledger")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({
			persist: false,
			empty: true
		});
		return withTenant(request, async () => {
			const data = await readLedger();
			if (ledgerUnreadable(data)) return Response.json({
				error: CORRUPT_MSG,
				corrupt: true
			}, { status: 503 });
			const response = Response.json({
				persist: true,
				...data
			});
			response.headers.set("X-Ledger-Revision", ledgerRevisionValue(data));
			return response;
		}, "people.view");
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ persist: false }, { status: 400 });
		const body = await request.json();
		const bad = validateLedgerPayload(body);
		if (bad) {
			await logServer("error", "台账写入被拒：结构不合法", {
				reason: bad,
				payload: ledgerPayloadSummary(body)
			});
			return Response.json({
				error: bad,
				invalid: true
			}, { status: 400 });
		}
		return withTenant(request, async () => {
			const expected = request.headers.get("if-match");
			const result = await writeLedger(body, expected === null ? void 0 : expected);
			if (result === "unreadable") {
				await logServer("error", "拒绝覆盖损坏的台账文件", {});
				return Response.json({
					error: CORRUPT_MSG,
					corrupt: true
				}, { status: 503 });
			}
			if (result === "conflict") {
				await logServer("warn", "台账保存冲突", { payload: ledgerPayloadSummary(body) });
				return Response.json({
					error: "台账已被其他设备修改，请重新加载后再保存",
					conflict: true
				}, { status: 409 });
			}
			const response = Response.json({ ok: true });
			response.headers.set("X-Ledger-Revision", ledgerRevisionValue(body));
			return response;
		}, "ledger.manage");
	}
} } });
function kindOf$1(v) {
	if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
	return null;
}
const Route$21 = createFileRoute("/api/photo")({ server: { handlers: {
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
		}, "people.view");
	},
	PUT: async ({ request }) => {
		if (!persistOn()) return Response.json({ ok: false }, { status: 400 });
		if (Number(request.headers.get("content-length") || 0) > 20 * 1024 * 1024) return Response.json({ error: "照片太大，最大 20MB" }, { status: 413 });
		const body = await request.json();
		const kind = kindOf$1(body.kind || null);
		if (!body.name || !kind || !body.dataUrl) return Response.json({ ok: false }, { status: 400 });
		if (body.dataUrl.length > 20 * 1024 * 1024) return Response.json({ error: "照片太大，最大 20MB" }, { status: 413 });
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
const Route$22 = createFileRoute("/api/photo-adopt")({ server: { handlers: { POST: async ({ request }) => {
	if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
	return withTenant(request, async () => Response.json({
		ok: true,
		...await adoptLegacyAssets()
	}), ["photos.edit", "files.edit"]);
} } } });
function kindOf(v) {
	if (v === "id" || v === "idFront" || v === "idBack" || v === "bank" || v === "ic") return v === "idFront" ? "id" : v;
	return null;
}
const Route$23 = createFileRoute("/api/photo-file")({ server: { handlers: { GET: async ({ request }) => {
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
	}, "people.view");
} } } });
async function namesFrom(request) {
	const q = (new URL(request.url).searchParams.get("names") || "").split("\n").filter(Boolean);
	if (request.method === "GET") return q;
	const body = await request.json().catch(() => ({}));
	if (Array.isArray(body.names) && body.names.length) return body.names.map(String).filter(Boolean);
	return q;
}
const Route$24 = createFileRoute("/api/photo-flags")({ server: { handlers: {
	GET: async ({ request }) => {
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }), "people.view");
	},
	POST: async ({ request }) => {
		if (!persistOn()) return Response.json({ flags: {} });
		const names = await namesFrom(request);
		return withTenant(request, async () => Response.json({ flags: await photoFlags(names) }), "people.view");
	}
} } });
var MAX_NAMES = 500;
const Route$25 = createFileRoute("/api/photo-scan")({ server: { handlers: { POST: async ({ request }) => {
	if (!persistOn()) return Response.json({ error: "未开持久化" }, { status: 400 });
	const body = await request.json().catch(() => ({}));
	const given = Array.isArray(body.names) ? body.names.map(String).filter(Boolean).slice(0, MAX_NAMES) : [];
	return withTenant(request, async () => {
		let names = given;
		if (!names.length) {
			const led = await readLedger();
			if (ledgerUnreadable(led)) return Response.json({ error: "台账文件读取失败" }, { status: 503 });
			names = (Array.isArray(led.people) ? led.people : []).map((p) => String(p.name || "").trim()).filter(Boolean).slice(0, MAX_NAMES);
		}
		return Response.json(await scanPhotoFolder(names));
	}, given.length ? "photos.view" : ["photos.view", "people.view"]);
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
	let error$1 = "";
	let hint = "";
	if (!remote) error$1 = "暂时连不上 GitHub。仓库已经公开的话，多半是飞牛访问 GitHub 被拦了，点「检查更新」再试一次。";
	else if (mode === "windows" && newer && !latest.url) {
		error$1 = "";
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
		error: error$1,
		hint
	};
}
function dockerMessage(raw) {
	const t = (raw || "").trim();
	if (!t) return "";
	try {
		const j = JSON.parse(t);
		if (j && typeof j.message === "string" && j.message.trim()) return j.message.trim();
	} catch {}
	return t.slice(0, 400);
}
function dockerReq(method, path, opts = {}) {
	return new Promise((resolve, reject) => {
		const o = opts;
		let body = o.body;
		if (body === void 0 && o.stream === void 0 && Object.keys(opts).length > 0) body = opts;
		let data = body == null ? null : typeof body === "string" ? body : JSON.stringify(body);
		if (data == null && method.toUpperCase() === "POST") data = "{}";
		const req = nodeHTTP.request({
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
				if ((res.statusCode || 0) >= 300) return reject(new Error(dockerMessage(raw) || String(res.statusCode)));
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
	const full = `${repo}:${tag}`;
	const errors = [];
	for (const path of [`/images/create?fromImage=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`, `/images/create?fromImage=${encodeURIComponent(full)}`]) try {
		await dockerReq("POST", path, { stream: true });
		return;
	} catch (e) {
		errors.push(e instanceof Error ? e.message : String(e));
	}
	throw new Error(`${ref} 拉取失败：${errors.join("；").slice(0, 400) || "未知原因"}`);
}
function uniqueImages(list) {
	const out = [];
	for (const x of list) {
		const s = String(x || "").trim();
		if (s && !out.includes(s)) out.push(s);
	}
	return out;
}
const UPDATER_SCRIPT = `const http=require("node:http");
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
async function applyDockerUpdate() {
	if (!await hasDockerSock()) return {
		ok: false,
		error: "还不能自动更新。请到飞牛运行一次「一键拉取」，以后就能在软件里点更新。"
	};
	const me = await selfContainer();
	await logServer("info", "开始一键更新（Docker）", { currentImage: String(me.Config?.Image || "") });
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
		await logServer("info", "拉取镜像成功", { ref });
		break;
	} catch (e) {
		lastErr = e instanceof Error ? e.message : String(e);
		await logServer("warn", "拉取镜像失败", {
			ref,
			error: lastErr
		});
	}
	if (!image) throw new Error(lastErr.slice(0, 500) || "拉镜像失败。请确认 Packages 是 Public，或到飞牛再运行一次「一键拉取」。");
	const binds = [...me.HostConfig?.Binds || []];
	if (!binds.some((b) => String(b).includes("docker.sock"))) binds.push(`${SOCK}:${SOCK}`);
	const hostConfig = {
		...me.HostConfig,
		Binds: binds
	};
	delete hostConfig.Mounts;
	const env = [...me.Config?.Env || []];
	if (!env.some((e) => String(e).startsWith("GONGDI_IMAGE="))) env.push(`GONGDI_IMAGE=${image}`);
	const endpoints = {};
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
		NetworkingConfig: { EndpointsConfig: endpoints }
	};
	await writeFile("/data/.gongdi-next.json", JSON.stringify({
		oldId: me.Id,
		name,
		create
	}));
	await writeFile("/data/.gongdi-updater.cjs", UPDATER_SCRIPT);
	try {
		await dockerReq("POST", "/containers/gongdi-updater/stop?t=2");
	} catch {}
	try {
		await dockerReq("DELETE", "/containers/gongdi-updater?force=true");
	} catch {}
	const helperBinds = binds.filter((b) => String(b).includes(":/data") || String(b).includes("docker.sock"));
	if (!helperBinds.some((b) => String(b).includes(":/data"))) helperBinds.unshift("/vol1/1000/docker/attendance/data:/data");
	if (!helperBinds.some((b) => String(b).includes("docker.sock"))) helperBinds.push(`${SOCK}:${SOCK}`);
	const helper = await dockerReq("POST", "/containers/create?name=gongdi-updater", { body: {
		Image: image,
		Cmd: ["node", "/data/.gongdi-updater.cjs"],
		WorkingDir: "/data",
		HostConfig: {
			Binds: helperBinds,
			AutoRemove: true,
			RestartPolicy: { Name: "no" }
		}
	} });
	await dockerReq("POST", `/containers/${helper.Id}/start`);
	await logServer("info", "已启动更新容器，稍后自动替换", {
		image,
		helper: helper.Id
	});
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
	await logServer("info", "开始 Windows 更新", {
		home,
		url: info.url
	});
	spawn("cmd.exe", ["/c", bat], {
		detached: true,
		stdio: "ignore",
		cwd: home,
		windowsHide: false
	}).unref();
	setTimeout(() => process.exit(0), 4e3);
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
function checkSameOrigin(headers) {
	const origin = headers.get("origin") || headers.get("referer");
	if (!origin) return true;
	let host;
	try {
		host = new URL(origin).host.toLowerCase();
	} catch {
		return false;
	}
	return [headers.get("host"), headers.get("x-forwarded-host")].filter((h) => Boolean(h)).flatMap((h) => h.split(",")).map((h) => h.trim().toLowerCase()).filter(Boolean).includes(host);
}
var updateJobState = {
	running: false,
	startedAt: 0,
	doneAt: 0,
	ok: false,
	error: "",
	step: ""
};
function updateJobStatus() {
	return { ...updateJobState };
}
function startUpdateJob(run = applyUpdate) {
	if (updateJobState.running) return updateJobStatus();
	updateJobState = {
		running: true,
		startedAt: Date.now(),
		doneAt: 0,
		ok: false,
		error: "",
		step: "正在更新（拉镜像/准备替换）"
	};
	logServer("info", "开始一键更新（后台任务）", {});
	run().then((r) => {
		updateJobState = {
			...updateJobState,
			running: false,
			doneAt: Date.now(),
			ok: Boolean(r.ok),
			error: r.error || "",
			step: r.ok ? "已受理，容器即将被替换" : "失败"
		};
		return logServer(r.ok ? "info" : "warn", r.ok ? "一键更新已受理" : "一键更新失败", { error: r.error || "" });
	}).catch((e) => {
		const error$1 = e instanceof Error && e.message ? e.message : "更新过程出错（详情见 data/logs）";
		updateJobState = {
			...updateJobState,
			running: false,
			doneAt: Date.now(),
			ok: false,
			error: error$1,
			step: "异常"
		};
		return logServer("error", "一键更新异常", { error: error$1 });
	});
	return updateJobStatus();
}
const Route$26 = createFileRoute("/api/update")({ server: { handlers: {
	GET: async ({ request }) => {
		try {
			const t = await resolveTenant(request);
			if (persistOn() && !t.user) return Response.json({
				portable: false,
				error: "请先登录"
			}, { status: 401 });
			const url = new URL(request.url);
			if (url.searchParams.has("status")) return Response.json({ status: updateJobStatus() });
			const info = await checkUpdate(url.searchParams.has("fresh"));
			return Response.json({
				...info,
				portable: isPortable(),
				status: updateJobStatus()
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
			try {
				await request.json();
			} catch {}
			if (!checkSameOrigin(request.headers)) {
				await logServer("warn", "更新请求被同源校验拒绝", {
					origin: request.headers.get("origin") || request.headers.get("referer") || "",
					host: request.headers.get("host") || "",
					forwardedHost: request.headers.get("x-forwarded-host") || ""
				});
				return Response.json({ error: "来源不一致，已拒绝。若通过反向代理访问，请让代理透传 Host（或设置 X-Forwarded-Host）。" }, { status: 403 });
			}
			const t = await resolveTenant(request);
			if (!t.user) return Response.json({ error: "请先登录" }, { status: 401 });
			if (t.user.role !== "admin") return Response.json({ error: "只有管理员能更新" }, { status: 403 });
			const status = startUpdateJob();
			return Response.json({
				ok: true,
				started: true,
				accepted: true,
				status
			});
		} catch (e) {
			const msg = e instanceof Error && e.message ? e.message : "更新过程出错（详情见 data/logs/ 或 data/.gongdi-update-error.txt）";
			await logServer("error", "一键更新异常", { error: msg });
			return Response.json({ error: msg }, { status: 500 });
		}
	}
} } });
const Route$27 = createFileRoute("/api/version")({ server: { handlers: { GET: async () => {
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
	if (ledgerUnreadable(data)) return Response.json({ error: "台账文件读取失败，已拒绝写入" }, { status: 503 });
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
	const result = await writeLedger({
		...rec,
		years,
		year
	}, ledgerRevisionValue(data));
	if (result !== "ok") {
		await logServer("warn", "新增年份写入被拒", {
			year,
			result
		});
		return Response.json({ error: "台账已被其他设备修改，请重新打开页面后再试" }, { status: 409 });
	}
	return Response.redirect(new URL(back, request.url), 303);
}
const Route$28 = createFileRoute("/api/year")({ server: { handlers: {
	GET: async () => Response.json({ error: "请在月度考勤里新增年份" }, { status: 405 }),
	POST: async ({ request }) => {
		const form = await request.formData();
		const year = Number(form.get("year") || form.get("add") || 0);
		return withTenant(request, () => addYearAndRedirect(request, year), "settings.year");
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
function monthsFromAttendance(attendance$1) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const a of attendance$1 || []) {
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
function filterAttendanceExport(attendance$1, range) {
	if (range.scope === "all") return attendance$1 || [];
	return (attendance$1 || []).filter((a) => inExportRange(a.year, a.month, range));
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
		const y = Number(e.year) || dateYear(e.date) || dateYear(e.period) || 0;
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
var EXPORT_VIEW_PERM = {
	"people-export": "people.view",
	export: "people.view",
	"attendance-export": "people.view",
	"payment-export": "people.view",
	"contract-export": "contracts.view",
	"expense-export": "expenses.view"
};
const Route$29 = createFileRoute("/api/file/$kind")({ server: { handlers: { GET: async ({ params, request }) => {
	const url = new URL(request.url);
	const year = Number(url.searchParams.get("year") || String((/* @__PURE__ */ new Date()).getFullYear())) || (/* @__PURE__ */ new Date()).getFullYear();
	const kind = params.kind;
	const viewPerm = EXPORT_VIEW_PERM[kind];
	const need = kind.endsWith("-template") ? "import.use" : viewPerm ? ["export.use", viewPerm] : "export.use";
	const handle = async () => {
		if (kind === "people-template") return xlsxFile(peopleTemplateWb(), "人员导入模板.xlsx");
		if (kind === "attendance-template") return xlsxFile(attendanceTemplateWb(year), `${year}年考勤导入模板.xlsx`);
		if (kind === "payment-template") return xlsxFile(paymentTemplateWb(), "发放记录导入模板.xlsx");
		if (kind === "expense-template") return xlsxFile(expenseTemplateWb(), "报销单导入模板.xlsx");
		if (kind === "contract-template") return xlsxFile(contractTemplateWb(), "合同导入模板.xlsx");
		if (kind === "insurance-member-template") return xlsxFile(insuranceMemberTemplateWb(), "保险人员导入模板.xlsx");
		if (kind === "contract-export" || kind === "export" || kind === "payment-export" || kind === "expense-export" || kind === "people-export" || kind === "attendance-export") {
			const range = parseExportRange(url, year);
			const data = persistOn() ? await readLedger() : { empty: true };
			if (ledgerUnreadable(data)) return Response.json({ error: "服务器上的台账文件损坏，已拒绝导出。请从 data/backups 恢复。" }, { status: 503 });
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
			const attendance$1 = filterAttendanceExport(rec.attendance || [], range);
			const payments = filterPaymentsExport(rec.payments || [], range);
			const expenses = filterExpensesExport(rec.expenses || [], range);
			if (kind === "payment-export") return xlsxFile(buildPaymentWorkbook(payments), fileStamp(range, "pay"));
			if (kind === "expense-export") return xlsxFile(buildExpenseWorkbook(expenses), fileStamp(range, "exp"));
			let months = range.scope === "all" ? monthsFromAttendance(attendance$1) : monthsOfRange(range);
			if (!months.length) months = Array.from({ length: 12 }, (_, i) => ({
				year: range.year,
				month: i + 1
			}));
			const skip = kind === "attendance-export";
			return xlsxFile(buildFullWorkbook({
				year: range.year,
				people,
				attendance: attendance$1,
				payments,
				expenses,
				insurancePolicies: rec.insurancePolicies || [],
				insuranceMembers: rec.insuranceMembers || [],
				months,
				skipPeople: skip,
				skipPay: skip,
				skipExp: skip
			}), fileStamp(range, skip ? "att" : "full"));
		}
		return new Response("not found", { status: 404 });
	};
	if (persistOn()) return withTenant(request, handle, need);
	return handle();
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
	ExportRoute: Route$6.update({
		id: "/export",
		path: "/export",
		getParentRoute: () => Route
	}),
	FilesRoute: Route$7.update({
		id: "/files",
		path: "/files",
		getParentRoute: () => Route
	}),
	ImportRoute: Route$8.update({
		id: "/import",
		path: "/import",
		getParentRoute: () => Route
	}),
	InsuranceRoute: Route$9.update({
		id: "/insurance",
		path: "/insurance",
		getParentRoute: () => Route
	}),
	PaymentsRoute: Route$10.update({
		id: "/payments",
		path: "/payments",
		getParentRoute: () => Route
	}),
	PeopleRoute: Route$11.update({
		id: "/people",
		path: "/people",
		getParentRoute: () => Route
	}),
	PhotosRoute: Route$12.update({
		id: "/photos",
		path: "/photos",
		getParentRoute: () => Route
	}),
	QueryRoute: Route$13.update({
		id: "/query",
		path: "/query",
		getParentRoute: () => Route
	}),
	SettingsRoute: Route$14.update({
		id: "/settings",
		path: "/settings",
		getParentRoute: () => Route
	}),
	ApiAuditRoute: Route$15.update({
		id: "/api/audit",
		path: "/api/audit",
		getParentRoute: () => Route
	}),
	ApiAuthRoute: Route$16.update({
		id: "/api/auth",
		path: "/api/auth",
		getParentRoute: () => Route
	}),
	ApiBackupRoute: Route$17.update({
		id: "/api/backup",
		path: "/api/backup",
		getParentRoute: () => Route
	}),
	ApiDocRoute: Route$18.update({
		id: "/api/doc",
		path: "/api/doc",
		getParentRoute: () => Route
	}),
	ApiHealthRoute: Route$19.update({
		id: "/api/health",
		path: "/api/health",
		getParentRoute: () => Route
	}),
	ApiLedgerRoute: Route$20.update({
		id: "/api/ledger",
		path: "/api/ledger",
		getParentRoute: () => Route
	}),
	ApiPhotoRoute: Route$21.update({
		id: "/api/photo",
		path: "/api/photo",
		getParentRoute: () => Route
	}),
	ApiPhotoAdoptRoute: Route$22.update({
		id: "/api/photo-adopt",
		path: "/api/photo-adopt",
		getParentRoute: () => Route
	}),
	ApiPhotoFileRoute: Route$23.update({
		id: "/api/photo-file",
		path: "/api/photo-file",
		getParentRoute: () => Route
	}),
	ApiPhotoFlagsRoute: Route$24.update({
		id: "/api/photo-flags",
		path: "/api/photo-flags",
		getParentRoute: () => Route
	}),
	ApiPhotoScanRoute: Route$25.update({
		id: "/api/photo-scan",
		path: "/api/photo-scan",
		getParentRoute: () => Route
	}),
	ApiUpdateRoute: Route$26.update({
		id: "/api/update",
		path: "/api/update",
		getParentRoute: () => Route
	}),
	ApiVersionRoute: Route$27.update({
		id: "/api/version",
		path: "/api/version",
		getParentRoute: () => Route
	}),
	ApiYearRoute: Route$28.update({
		id: "/api/year",
		path: "/api/year",
		getParentRoute: () => Route
	}),
	ApiFileKindRoute: Route$29.update({
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
