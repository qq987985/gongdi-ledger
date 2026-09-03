import { createRequire } from "node:module";
import { ReadableStream as ReadableStream$1 } from "node:stream/web";
import { PassThrough, Readable } from "node:stream";
import { AsyncLocalStorage } from "node:async_hooks";
import nodeHTTP from "node:http";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (all, symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __require = /* @__PURE__ */ createRequire(import.meta.url);
/**
* @license React
* react.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE$3 = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE$3 = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE$3 = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE$2 = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE$2 = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE$2 = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE$2 = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE$2 = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE$2 = Symbol.for("react.suspense"), REACT_MEMO_TYPE$2 = Symbol.for("react.memo"), REACT_LAZY_TYPE$2 = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE$2 = Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL$2 = Symbol.iterator;
	function getIteratorFn$2(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL$2 && maybeIterable[MAYBE_ITERATOR_SYMBOL$2] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var ReactNoopUpdateQueue = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, assign$2 = Object.assign, emptyObject = {};
	function Component(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	Component.prototype.isReactComponent = {};
	Component.prototype.setState = function(partialState, callback) {
		if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, partialState, callback, "setState");
	};
	Component.prototype.forceUpdate = function(callback) {
		this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
	};
	function ComponentDummy() {}
	ComponentDummy.prototype = Component.prototype;
	function PureComponent(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
	pureComponentPrototype.constructor = PureComponent;
	assign$2(pureComponentPrototype, Component.prototype);
	pureComponentPrototype.isPureReactComponent = !0;
	var isArrayImpl$2 = Array.isArray;
	function noop$5() {}
	var ReactSharedInternals$3 = {
		H: null,
		A: null,
		T: null,
		S: null
	}, hasOwnProperty$2 = Object.prototype.hasOwnProperty;
	function ReactElement(type, key, props) {
		var refProp = props.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE$3,
			type,
			key,
			ref: void 0 !== refProp ? refProp : null,
			props
		};
	}
	function cloneAndReplaceKey(oldElement, newKey) {
		return ReactElement(oldElement.type, newKey, oldElement.props);
	}
	function isValidElement(object) {
		return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE$3;
	}
	function escape(key) {
		var escaperLookup = {
			"=": "=0",
			":": "=2"
		};
		return "$" + key.replace(/[=:]/g, function(match) {
			return escaperLookup[match];
		});
	}
	var userProvidedKeyEscapeRegex = /\/+/g;
	function getElementKey(element, index) {
		return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
	}
	function resolveThenable(thenable) {
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default: switch ("string" === typeof thenable.status ? thenable.then(noop$5, noop$5) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
				"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
			}, function(error) {
				"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			})), thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
			}
		}
		throw thenable;
	}
	function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
		var type = typeof children;
		if ("undefined" === type || "boolean" === type) children = null;
		var invokeCallback = !1;
		if (null === children) invokeCallback = !0;
		else switch (type) {
			case "bigint":
			case "string":
			case "number":
				invokeCallback = !0;
				break;
			case "object": switch (children.$$typeof) {
				case REACT_ELEMENT_TYPE$3:
				case REACT_PORTAL_TYPE$3:
					invokeCallback = !0;
					break;
				case REACT_LAZY_TYPE$2: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
			}
		}
		if (invokeCallback) return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl$2(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
			return c;
		})) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
		invokeCallback = 0;
		var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
		if (isArrayImpl$2(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if (i = getIteratorFn$2(children), "function" === typeof i) for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if ("object" === type) {
			if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
			array = String(children);
			throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
		}
		return invokeCallback;
	}
	function mapChildren(children, func, context) {
		if (null == children) return children;
		var result = [], count = 0;
		mapIntoArray(children, result, "", "", function(child) {
			return func.call(context, child, count++);
		});
		return result;
	}
	function lazyInitializer(payload) {
		if (-1 === payload._status) {
			var ctor = payload._result;
			ctor = ctor();
			ctor.then(function(moduleObject) {
				if (0 === payload._status || -1 === payload._status) payload._status = 1, payload._result = moduleObject;
			}, function(error) {
				if (0 === payload._status || -1 === payload._status) payload._status = 2, payload._result = error;
			});
			-1 === payload._status && (payload._status = 0, payload._result = ctor);
		}
		if (1 === payload._status) return payload._result.default;
		throw payload._result;
	}
	var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
		if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
			var event = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
				error
			});
			if (!window.dispatchEvent(event)) return;
		} else if ("object" === typeof process && "function" === typeof process.emit) {
			process.emit("uncaughtException", error);
			return;
		}
		console.error(error);
	}, Children = {
		map: mapChildren,
		forEach: function(children, forEachFunc, forEachContext) {
			mapChildren(children, function() {
				forEachFunc.apply(this, arguments);
			}, forEachContext);
		},
		count: function(children) {
			var n = 0;
			mapChildren(children, function() {
				n++;
			});
			return n;
		},
		toArray: function(children) {
			return mapChildren(children, function(child) {
				return child;
			}) || [];
		},
		only: function(children) {
			if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
			return children;
		}
	};
	exports.Activity = REACT_ACTIVITY_TYPE$2;
	exports.Children = Children;
	exports.Component = Component;
	exports.Fragment = REACT_FRAGMENT_TYPE$3;
	exports.Profiler = REACT_PROFILER_TYPE$2;
	exports.PureComponent = PureComponent;
	exports.StrictMode = REACT_STRICT_MODE_TYPE$2;
	exports.Suspense = REACT_SUSPENSE_TYPE$2;
	exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals$3;
	exports.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(size) {
			return ReactSharedInternals$3.H.useMemoCache(size);
		}
	};
	exports.cache = function(fn) {
		return function() {
			return fn.apply(null, arguments);
		};
	};
	exports.cacheSignal = function() {
		return null;
	};
	exports.cloneElement = function(element, config, children) {
		if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
		var props = assign$2({}, element.props), key = element.key;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) !hasOwnProperty$2.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
		var propName = arguments.length - 2;
		if (1 === propName) props.children = children;
		else if (1 < propName) {
			for (var childArray = Array(propName), i = 0; i < propName; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		return ReactElement(element.type, key, props);
	};
	exports.createContext = function(defaultValue) {
		defaultValue = {
			$$typeof: REACT_CONTEXT_TYPE$2,
			_currentValue: defaultValue,
			_currentValue2: defaultValue,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		};
		defaultValue.Provider = defaultValue;
		defaultValue.Consumer = {
			$$typeof: REACT_CONSUMER_TYPE$2,
			_context: defaultValue
		};
		return defaultValue;
	};
	exports.createElement = function(type, config, children) {
		var propName, props = {}, key = null;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) hasOwnProperty$2.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
		var childrenLength = arguments.length - 2;
		if (1 === childrenLength) props.children = children;
		else if (1 < childrenLength) {
			for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === props[propName] && (props[propName] = childrenLength[propName]);
		return ReactElement(type, key, props);
	};
	exports.createRef = function() {
		return { current: null };
	};
	exports.forwardRef = function(render) {
		return {
			$$typeof: REACT_FORWARD_REF_TYPE$2,
			render
		};
	};
	exports.isValidElement = isValidElement;
	exports.lazy = function(ctor) {
		return {
			$$typeof: REACT_LAZY_TYPE$2,
			_payload: {
				_status: -1,
				_result: ctor
			},
			_init: lazyInitializer
		};
	};
	exports.memo = function(type, compare) {
		return {
			$$typeof: REACT_MEMO_TYPE$2,
			type,
			compare: void 0 === compare ? null : compare
		};
	};
	exports.startTransition = function(scope) {
		var prevTransition = ReactSharedInternals$3.T, currentTransition = {};
		ReactSharedInternals$3.T = currentTransition;
		try {
			var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals$3.S;
			null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
			"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop$5, reportGlobalError);
		} catch (error) {
			reportGlobalError(error);
		} finally {
			null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals$3.T = prevTransition;
		}
	};
	exports.unstable_useCacheRefresh = function() {
		return ReactSharedInternals$3.H.useCacheRefresh();
	};
	exports.use = function(usable) {
		return ReactSharedInternals$3.H.use(usable);
	};
	exports.useActionState = function(action, initialState, permalink) {
		return ReactSharedInternals$3.H.useActionState(action, initialState, permalink);
	};
	exports.useCallback = function(callback, deps) {
		return ReactSharedInternals$3.H.useCallback(callback, deps);
	};
	exports.useContext = function(Context) {
		return ReactSharedInternals$3.H.useContext(Context);
	};
	exports.useDebugValue = function() {};
	exports.useDeferredValue = function(value, initialValue) {
		return ReactSharedInternals$3.H.useDeferredValue(value, initialValue);
	};
	exports.useEffect = function(create, deps) {
		return ReactSharedInternals$3.H.useEffect(create, deps);
	};
	exports.useEffectEvent = function(callback) {
		return ReactSharedInternals$3.H.useEffectEvent(callback);
	};
	exports.useId = function() {
		return ReactSharedInternals$3.H.useId();
	};
	exports.useImperativeHandle = function(ref, create, deps) {
		return ReactSharedInternals$3.H.useImperativeHandle(ref, create, deps);
	};
	exports.useInsertionEffect = function(create, deps) {
		return ReactSharedInternals$3.H.useInsertionEffect(create, deps);
	};
	exports.useLayoutEffect = function(create, deps) {
		return ReactSharedInternals$3.H.useLayoutEffect(create, deps);
	};
	exports.useMemo = function(create, deps) {
		return ReactSharedInternals$3.H.useMemo(create, deps);
	};
	exports.useOptimistic = function(passthrough, reducer) {
		return ReactSharedInternals$3.H.useOptimistic(passthrough, reducer);
	};
	exports.useReducer = function(reducer, initialArg, init) {
		return ReactSharedInternals$3.H.useReducer(reducer, initialArg, init);
	};
	exports.useRef = function(initialValue) {
		return ReactSharedInternals$3.H.useRef(initialValue);
	};
	exports.useState = function(initialState) {
		return ReactSharedInternals$3.H.useState(initialState);
	};
	exports.useSyncExternalStore = function(subscribe$1, getSnapshot, getServerSnapshot) {
		return ReactSharedInternals$3.H.useSyncExternalStore(subscribe$1, getSnapshot, getServerSnapshot);
	};
	exports.useTransition = function() {
		return ReactSharedInternals$3.H.useTransition();
	};
	exports.version = "19.2.8";
}));
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_production();
}));
function isNotFound(obj) {
	return obj?.isNotFound === true;
}
var rootRouteId = "__root__";
function redirect(opts) {
	opts.statusCode = opts.statusCode || opts.code || 307;
	if (!opts.reloadDocument && typeof opts.href === "string") try {
		new URL(opts.href);
		opts.reloadDocument = true;
	} catch {}
	const headers = new Headers(opts.headers);
	if (opts.href && headers.get("Location") === null) headers.set("Location", opts.href);
	const response = new Response(null, {
		status: opts.statusCode,
		headers
	});
	response.options = opts;
	if (opts.throw) throw response;
	return response;
}
function isRedirect(obj) {
	return obj instanceof Response && !!obj.options;
}
function isResolvedRedirect(obj) {
	return isRedirect(obj) && !!obj.options.href;
}
function dehydrateSsrMatchId(id) {
	return id.replaceAll("~", "~~").replaceAll("\0", "~0").replaceAll("�", "~r").replaceAll("/", "\0");
}
function last(arr) {
	return arr[arr.length - 1];
}
function functionalUpdate(updater, previous) {
	if (typeof updater === "function") return updater(previous);
	return updater;
}
var hasOwn = Object.prototype.hasOwnProperty;
Object.prototype.propertyIsEnumerable;
function hasKeys(obj) {
	for (const key in obj) if (hasOwn.call(obj, key)) return true;
	return false;
}
var createNull = () => Object.create(null);
var nullReplaceEqualDeep = (prev, next) => replaceEqualDeep(prev, next, createNull);
function replaceEqualDeep(prev, _next, _makeObj = () => ({}), _depth = 0) {
	return _next;
}
function isPlainObject(o) {
	if (!hasObjectPrototype(o)) return false;
	const ctor = o.constructor;
	if (typeof ctor === "undefined") return true;
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) return false;
	if (!prot.hasOwnProperty("isPrototypeOf")) return false;
	return true;
}
function hasObjectPrototype(o) {
	return Object.prototype.toString.call(o) === "[object Object]";
}
function deepEqual(a, b, opts) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0, l$1 = a.length; i < l$1; i++) if (!deepEqual(a[i], b[i], opts)) return false;
		return true;
	}
	if (isPlainObject(a) && isPlainObject(b)) {
		const ignoreUndefined = opts?.ignoreUndefined ?? true;
		if (opts?.partial) {
			for (const k in b) if (!ignoreUndefined || b[k] !== void 0) {
				if (!deepEqual(a[k], b[k], opts)) return false;
			}
			return true;
		}
		let aCount = 0;
		if (!ignoreUndefined) aCount = Object.keys(a).length;
		else for (const k in a) if (a[k] !== void 0) aCount++;
		let bCount = 0;
		for (const k in b) if (!ignoreUndefined || b[k] !== void 0) {
			bCount++;
			if (bCount > aCount || !deepEqual(a[k], b[k], opts)) return false;
		}
		return aCount === bCount;
	}
	return false;
}
function isModuleNotFoundError(error) {
	if (typeof error?.message !== "string") return false;
	return error.message.startsWith("Failed to fetch dynamically imported module") || error.message.startsWith("error loading dynamically imported module") || error.message.startsWith("Importing a module script failed");
}
var PATH_UNSAFE_RE = /[\x00-\x1f\x7f"<>`{}]/g;
function sanitizePathSegment(segment) {
	return segment.replace(PATH_UNSAFE_RE, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
}
function decodeSegment(segment) {
	let decoded;
	try {
		decoded = decodeURI(segment);
	} catch {
		decoded = segment.replaceAll(/%[0-9A-F]{2}/gi, (match) => {
			try {
				return decodeURI(match);
			} catch {
				return match;
			}
		});
	}
	return sanitizePathSegment(decoded);
}
var DEFAULT_PROTOCOL_ALLOWLIST = [
	"http:",
	"https:",
	"mailto:",
	"tel:"
];
function isDangerousProtocol(url, allowlist) {
	if (!url) return false;
	try {
		const parsed = new URL(url);
		return !allowlist.has(parsed.protocol);
	} catch {
		return false;
	}
}
var HTML_ESCAPE_LOOKUP = {
	"&": "\\u0026",
	">": "\\u003e",
	"<": "\\u003c",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
};
var HTML_ESCAPE_REGEX = /[&><\u2028\u2029]/g;
function escapeHtml(str) {
	return str.replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_LOOKUP[match]);
}
function decodePath(path) {
	if (!path) return {
		path,
		handledProtocolRelativeURL: false
	};
	if (!/[%\\\x00-\x1f\x7f]/.test(path) && !path.startsWith("//")) return {
		path,
		handledProtocolRelativeURL: false
	};
	const re = /%25|%5C/gi;
	let cursor = 0;
	let result = "";
	let match;
	while (null !== (match = re.exec(path))) {
		result += decodeSegment(path.slice(cursor, match.index)) + match[0];
		cursor = re.lastIndex;
	}
	result = result + decodeSegment(cursor ? path.slice(cursor) : path);
	let handledProtocolRelativeURL = false;
	if (result.startsWith("//")) {
		handledProtocolRelativeURL = true;
		result = "/" + result.replace(/^\/+/, "");
	}
	return {
		path: result,
		handledProtocolRelativeURL
	};
}
function encodePathLikeUrl(path) {
	if (!/\s|[^\u0000-\u007F]/.test(path)) return path;
	return path.replace(/\s|[^\u0000-\u007F]/gu, encodeURIComponent);
}
function arraysEqual(a, b) {
	if (a === b) return true;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}
function createLRUCache(max) {
	const cache = /* @__PURE__ */ new Map();
	let oldest;
	let newest;
	const touch = (entry) => {
		if (!entry.next) return;
		if (!entry.prev) {
			entry.next.prev = void 0;
			oldest = entry.next;
			entry.next = void 0;
			if (newest) {
				entry.prev = newest;
				newest.next = entry;
			}
		} else {
			entry.prev.next = entry.next;
			entry.next.prev = entry.prev;
			entry.next = void 0;
			if (newest) {
				newest.next = entry;
				entry.prev = newest;
			}
		}
		newest = entry;
	};
	return {
		get(key) {
			const entry = cache.get(key);
			if (!entry) return void 0;
			touch(entry);
			return entry.value;
		},
		set(key, value) {
			if (cache.size >= max && oldest) {
				const toDelete = oldest;
				cache.delete(toDelete.key);
				if (toDelete.next) {
					oldest = toDelete.next;
					toDelete.next.prev = void 0;
				}
				if (toDelete === newest) newest = void 0;
			}
			const existing = cache.get(key);
			if (existing) {
				existing.value = value;
				touch(existing);
			} else {
				const entry = {
					key,
					value,
					prev: newest
				};
				if (newest) newest.next = entry;
				newest = entry;
				if (!oldest) oldest = entry;
				cache.set(key, entry);
			}
		},
		clear() {
			cache.clear();
			oldest = void 0;
			newest = void 0;
		}
	};
}
function invariant() {
	throw new Error("Invariant failed");
}
var SEGMENT_TYPE_INDEX = 4;
var SEGMENT_TYPE_PATHLESS = 5;
function parseSegment(path, start, output = new Uint16Array(6)) {
	const next = path.indexOf("/", start);
	const end = next === -1 ? path.length : next;
	const part = path.substring(start, end);
	if (!part || !part.includes("$")) {
		output[0] = 0;
		output[1] = start;
		output[2] = start;
		output[3] = end;
		output[4] = end;
		output[5] = end;
		return output;
	}
	if (part === "$") {
		const total = path.length;
		output[0] = 2;
		output[1] = start;
		output[2] = start;
		output[3] = total;
		output[4] = total;
		output[5] = total;
		return output;
	}
	if (part.charCodeAt(0) === 36) {
		output[0] = 1;
		output[1] = start;
		output[2] = start + 1;
		output[3] = end;
		output[4] = end;
		output[5] = end;
		return output;
	}
	const openBrace = part.indexOf("{");
	let closeBrace;
	if (openBrace !== -1 && openBrace + 1 < part.length && (closeBrace = part.indexOf("}", openBrace)) !== -1) {
		const firstChar = part.charCodeAt(openBrace + 1);
		if (firstChar === 45) {
			if (openBrace + 2 < part.length && part.charCodeAt(openBrace + 2) === 36) {
				const paramStart = openBrace + 3;
				const paramEnd = closeBrace;
				if (paramStart < paramEnd) {
					output[0] = 3;
					output[1] = start + openBrace;
					output[2] = start + paramStart;
					output[3] = start + paramEnd;
					output[4] = start + closeBrace + 1;
					output[5] = end;
					return output;
				}
			}
		} else if (firstChar === 36) {
			const dollarPos = openBrace + 1;
			const afterDollar = openBrace + 2;
			if (afterDollar === closeBrace) {
				output[0] = 2;
				output[1] = start + openBrace;
				output[2] = start + dollarPos;
				output[3] = start + afterDollar;
				output[4] = start + closeBrace + 1;
				output[5] = path.length;
				return output;
			}
			output[0] = 1;
			output[1] = start + openBrace;
			output[2] = start + afterDollar;
			output[3] = start + closeBrace;
			output[4] = start + closeBrace + 1;
			output[5] = end;
			return output;
		}
	}
	output[0] = 0;
	output[1] = start;
	output[2] = start;
	output[3] = end;
	output[4] = end;
	output[5] = end;
	return output;
}
function parseSegments(defaultCaseSensitive, data, route, start, node, depth, dynamicListsToSort, onRoute) {
	onRoute?.(route);
	let cursor = start;
	{
		const path = route.fullPath ?? route.from;
		const options = route.options;
		const length = path.length;
		const caseSensitive = options?.caseSensitive ?? defaultCaseSensitive;
		const parseParams = options?.params?.parse ?? options?.parseParams;
		while (cursor < length) {
			const segment = parseSegment(path, cursor, data);
			let nextNode;
			const start$1 = cursor;
			const end = segment[5];
			cursor = end + 1;
			depth++;
			const kind = segment[0];
			switch (kind) {
				case 0: {
					const value = path.substring(segment[2], segment[3]);
					let name = value;
					let staticChildren;
					if (caseSensitive) staticChildren = node.static ??= /* @__PURE__ */ new Map();
					else {
						name = value.toLowerCase();
						staticChildren = node.staticInsensitive ??= /* @__PURE__ */ new Map();
					}
					const existingNode = staticChildren.get(name);
					if (existingNode) nextNode = existingNode;
					else {
						const next = createStaticNode(path);
						next.parent = node;
						next.depth = depth;
						nextNode = next;
						staticChildren.set(name, next);
					}
					break;
				}
				case 1:
				case 3:
				case 2: {
					let prefix$2 = path.substring(start$1, segment[1]);
					let suffix$2 = path.substring(segment[4], end);
					const actuallyCaseSensitive = caseSensitive && !!(prefix$2 || suffix$2);
					if (!caseSensitive) {
						prefix$2 = prefix$2.toLowerCase();
						suffix$2 = suffix$2.toLowerCase();
					}
					const siblings = kind === 1 ? node.dynamic : kind === 3 ? node.optional : node.wildcard;
					const existingNode = kind !== 2 && !parseParams && siblings?.find((s$1) => !s$1.parse && s$1.caseSensitive === actuallyCaseSensitive && s$1.prefix === prefix$2 && s$1.suffix === suffix$2);
					if (existingNode) nextNode = existingNode;
					else {
						const next = createDynamicNode(kind, path, actuallyCaseSensitive, prefix$2, suffix$2);
						nextNode = next;
						next.parent = node;
						next.depth = depth;
						let nodes;
						if (kind === 1) nodes = node.dynamic ??= [];
						else if (kind === 3) nodes = node.optional ??= [];
						else nodes = node.wildcard ??= [];
						nodes.push(next);
						if (nodes.length === 2) dynamicListsToSort?.push(nodes);
					}
					break;
				}
			}
			node = nextNode;
		}
		if (parseParams && route.children && !route.isRoot && route.id && route.id.charCodeAt(route.id.lastIndexOf("/") + 1) === 95) {
			const pathlessNode = createStaticNode(path);
			pathlessNode.kind = SEGMENT_TYPE_PATHLESS;
			pathlessNode.parent = node;
			depth++;
			pathlessNode.depth = depth;
			node.pathless ??= [];
			node.pathless.push(pathlessNode);
			node = pathlessNode;
		}
		const isLeaf = (route.path || !route.children) && !route.isRoot;
		if (isLeaf && path.endsWith("/")) {
			const indexNode = createStaticNode(path);
			indexNode.kind = SEGMENT_TYPE_INDEX;
			indexNode.parent = node;
			depth++;
			indexNode.depth = depth;
			node.index = indexNode;
			node = indexNode;
		}
		node.parse = parseParams ?? null;
		node.priority = options?.params?.priority ?? 0;
		if (isLeaf && !node.route) {
			node.route = route;
			node.fullPath = path;
		}
	}
	if (route.children) for (const child of route.children) parseSegments(defaultCaseSensitive, data, child, cursor, node, depth, dynamicListsToSort, onRoute);
}
function sortDynamic(a, b) {
	if (a.parse && !b.parse) return -1;
	if (!a.parse && b.parse) return 1;
	if (a.parse && b.parse && (a.priority || b.priority)) return b.priority - a.priority;
	if (a.prefix && b.prefix && a.prefix !== b.prefix) {
		if (a.prefix.startsWith(b.prefix)) return -1;
		if (b.prefix.startsWith(a.prefix)) return 1;
	}
	if (a.suffix && b.suffix && a.suffix !== b.suffix) {
		if (a.suffix.endsWith(b.suffix)) return -1;
		if (b.suffix.endsWith(a.suffix)) return 1;
	}
	if (a.prefix && !b.prefix) return -1;
	if (!a.prefix && b.prefix) return 1;
	if (a.suffix && !b.suffix) return -1;
	if (!a.suffix && b.suffix) return 1;
	if (a.caseSensitive && !b.caseSensitive) return -1;
	if (!a.caseSensitive && b.caseSensitive) return 1;
	return 0;
}
function createStaticNode(fullPath) {
	return {
		kind: 0,
		depth: 0,
		pathless: null,
		index: null,
		static: null,
		staticInsensitive: null,
		dynamic: null,
		optional: null,
		wildcard: null,
		route: null,
		fullPath,
		parent: null,
		parse: null,
		priority: 0
	};
}
function createDynamicNode(kind, fullPath, caseSensitive, prefix$2, suffix$2) {
	return {
		kind,
		depth: 0,
		pathless: null,
		index: null,
		static: null,
		staticInsensitive: null,
		dynamic: null,
		optional: null,
		wildcard: null,
		route: null,
		fullPath,
		parent: null,
		parse: null,
		priority: 0,
		caseSensitive,
		prefix: prefix$2,
		suffix: suffix$2
	};
}
function processRouteMasks(routeList, processedTree) {
	const segmentTree = createStaticNode("/");
	const data = new Uint16Array(6);
	const dynamicListsToSort = [];
	for (const route of routeList) parseSegments(false, data, route, 1, segmentTree, 0, dynamicListsToSort);
	for (const nodes of dynamicListsToSort) nodes.sort(sortDynamic);
	processedTree.masksTree = segmentTree;
	processedTree.flatCache = createLRUCache(1e3);
}
function findFlatMatch(path, processedTree) {
	path ||= "/";
	const cached = processedTree.flatCache.get(path);
	if (cached !== void 0) return cached;
	const result = findMatch(path, processedTree.masksTree);
	processedTree.flatCache.set(path, result);
	return result;
}
function findSingleMatch(from, caseSensitive, fuzzy, path, processedTree) {
	from ||= "/";
	path ||= "/";
	const key = caseSensitive ? `case\0${from}` : from;
	let tree = processedTree.singleCache.get(key);
	if (!tree) {
		tree = createStaticNode("/");
		parseSegments(caseSensitive, new Uint16Array(6), { from }, 1, tree, 0);
		processedTree.singleCache.set(key, tree);
	}
	return findMatch(path, tree, fuzzy);
}
function findRouteMatch(path, processedTree, fuzzy = false) {
	const key = fuzzy ? path : `nofuzz\0${path}`;
	const cached = processedTree.matchCache.get(key);
	if (cached !== void 0) return cached;
	path ||= "/";
	let result;
	try {
		result = findMatch(path, processedTree.segmentTree, fuzzy);
	} catch (err) {
		if (err instanceof URIError) result = null;
		else throw err;
	}
	if (result) result.branch = buildRouteBranch(result.route);
	processedTree.matchCache.set(key, result);
	return result;
}
function trimPathRight$1(path) {
	return path === "/" ? path : path.replace(/\/{1,}$/, "");
}
function processRouteTree(routeTree, caseSensitive = false, initRoute) {
	const segmentTree = createStaticNode(routeTree.fullPath);
	const data = new Uint16Array(6);
	const dynamicListsToSort = [];
	const routesById = {};
	const routesByPath = {};
	let index = 0;
	parseSegments(caseSensitive, data, routeTree, 1, segmentTree, 0, dynamicListsToSort, (route) => {
		initRoute?.(route, index);
		if (route.id in routesById) invariant();
		routesById[route.id] = route;
		if (index !== 0 && route.path) {
			const trimmedFullPath = trimPathRight$1(route.fullPath);
			if (!routesByPath[trimmedFullPath] || route.fullPath.endsWith("/")) routesByPath[trimmedFullPath] = route;
		}
		index++;
	});
	for (const nodes of dynamicListsToSort) nodes.sort(sortDynamic);
	return {
		processedTree: {
			segmentTree,
			singleCache: createLRUCache(1e3),
			matchCache: createLRUCache(1e3),
			flatCache: null,
			masksTree: null
		},
		routesById,
		routesByPath
	};
}
function findMatch(path, segmentTree, fuzzy = false) {
	const parts = path.split("/");
	const leaf = getNodeMatch(path, parts, segmentTree, fuzzy);
	if (!leaf) return null;
	const [rawParams] = extractParams(path, parts, leaf);
	return {
		route: leaf.node.route,
		rawParams
	};
}
function extractParams(path, parts, leaf) {
	const list = buildBranch(leaf.node);
	let nodeParts = null;
	const rawParams = Object.create(null);
	let partIndex = leaf.extract?.part ?? 0;
	let nodeIndex = leaf.extract?.node ?? 0;
	let pathIndex = leaf.extract?.path ?? 0;
	let segmentCount = leaf.extract?.segment ?? 0;
	for (; nodeIndex < list.length; partIndex++, nodeIndex++, pathIndex++, segmentCount++) {
		const node = list[nodeIndex];
		if (node.kind === SEGMENT_TYPE_INDEX) break;
		if (node.kind === SEGMENT_TYPE_PATHLESS) {
			segmentCount--;
			partIndex--;
			pathIndex--;
			continue;
		}
		const part = parts[partIndex];
		const currentPathIndex = pathIndex;
		if (part) pathIndex += part.length;
		if (node.kind === 1) {
			nodeParts ??= leaf.node.fullPath.split("/");
			const nodePart = nodeParts[segmentCount];
			const preLength = node.prefix.length;
			if (nodePart.charCodeAt(preLength) === 123) {
				const sufLength = node.suffix.length;
				const name = nodePart.substring(preLength + 2, nodePart.length - sufLength - 1);
				const value = part.substring(preLength, part.length - sufLength);
				rawParams[name] = decodeURIComponent(value);
			} else {
				const name = nodePart.substring(1);
				rawParams[name] = decodeURIComponent(part);
			}
		} else if (node.kind === 3) {
			if (leaf.skipped & 1 << nodeIndex) {
				partIndex--;
				pathIndex = currentPathIndex - 1;
				continue;
			}
			nodeParts ??= leaf.node.fullPath.split("/");
			const nodePart = nodeParts[segmentCount];
			const preLength = node.prefix.length;
			const sufLength = node.suffix.length;
			const name = nodePart.substring(preLength + 3, nodePart.length - sufLength - 1);
			const value = node.suffix || node.prefix ? part.substring(preLength, part.length - sufLength) : part;
			if (value) rawParams[name] = decodeURIComponent(value);
		} else if (node.kind === 2) {
			const n = node;
			const value = path.substring(currentPathIndex + n.prefix.length, path.length - n.suffix.length);
			const splat = decodeURIComponent(value);
			rawParams["*"] = splat;
			rawParams._splat = splat;
			break;
		}
	}
	if (leaf.rawParams) Object.assign(rawParams, leaf.rawParams);
	return [rawParams, {
		part: partIndex,
		node: nodeIndex,
		path: pathIndex,
		segment: segmentCount
	}];
}
function buildRouteBranch(route) {
	const list = [route];
	while (route.parentRoute) {
		route = route.parentRoute;
		list.push(route);
	}
	list.reverse();
	return list;
}
function buildBranch(node) {
	const list = Array(node.depth + 1);
	do {
		list[node.depth] = node;
		node = node.parent;
	} while (node);
	return list;
}
function getNodeMatch(path, parts, segmentTree, fuzzy) {
	if (path === "/" && segmentTree.index) return {
		node: segmentTree.index,
		skipped: 0
	};
	const trailingSlash = !last(parts);
	const pathIsIndex = trailingSlash && path !== "/";
	const partsLength = parts.length - (trailingSlash ? 1 : 0);
	const stack = [{
		node: segmentTree,
		index: 1,
		skipped: 0,
		statics: 0,
		dynamics: 0,
		optionals: 0
	}];
	let bestFuzzy = null;
	let bestMatch = null;
	while (stack.length) {
		const frame = stack.pop();
		const { node, index, skipped, statics, dynamics, optionals } = frame;
		let { extract, rawParams } = frame;
		if (node.kind === 2 && node.route && !isFrameMoreSpecific(bestMatch, frame)) continue;
		if (node.parse) {
			if (!validateParseParams(path, parts, frame)) continue;
			rawParams = frame.rawParams;
			extract = frame.extract;
		}
		if (fuzzy && node.route && node.kind !== SEGMENT_TYPE_INDEX && isFrameMoreSpecific(bestFuzzy, frame)) bestFuzzy = frame;
		const isBeyondPath = index === partsLength;
		if (isBeyondPath) {
			if (node.route && (!pathIsIndex || node.kind === SEGMENT_TYPE_INDEX || node.kind === 2) && isFrameMoreSpecific(bestMatch, frame)) bestMatch = frame;
			if (!node.optional && !node.wildcard && !node.index && !node.pathless) continue;
		}
		const part = isBeyondPath ? void 0 : parts[index];
		let lowerPart;
		if (isBeyondPath && node.index) {
			const indexFrame = {
				node: node.index,
				index,
				skipped,
				statics,
				dynamics,
				optionals,
				extract,
				rawParams
			};
			let indexValid = true;
			if (node.index.parse) {
				if (!validateParseParams(path, parts, indexFrame)) indexValid = false;
			}
			if (indexValid) {
				if (!dynamics && !optionals && !skipped && isPerfectStaticMatch(statics, partsLength)) return indexFrame;
				if (isFrameMoreSpecific(bestMatch, indexFrame)) bestMatch = indexFrame;
			}
		}
		if (node.wildcard) for (let i = node.wildcard.length - 1; i >= 0; i--) {
			const segment = node.wildcard[i];
			const { prefix: prefix$2, suffix: suffix$2 } = segment;
			if (prefix$2) {
				if (isBeyondPath) continue;
				if (!(segment.caseSensitive ? part : lowerPart ??= part.toLowerCase()).startsWith(prefix$2)) continue;
			}
			if (suffix$2) {
				if (isBeyondPath) continue;
				const end = parts.slice(index).join("/");
				const suffixPart = end.slice(-suffix$2.length);
				if ((segment.caseSensitive ? suffixPart : suffixPart.toLowerCase()) !== suffix$2 || end.length - suffix$2.length < prefix$2.length) continue;
			}
			stack.push({
				node: segment,
				index: partsLength,
				skipped,
				statics,
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
		if (node.optional) {
			const nextSkipped = skipped | 1 << node.depth + 1;
			for (let i = node.optional.length - 1; i >= 0; i--) {
				const segment = node.optional[i];
				stack.push({
					node: segment,
					index,
					skipped: nextSkipped,
					statics,
					dynamics,
					optionals,
					extract,
					rawParams
				});
			}
			if (!isBeyondPath) for (let i = node.optional.length - 1; i >= 0; i--) {
				const segment = node.optional[i];
				const { prefix: prefix$2, suffix: suffix$2 } = segment;
				if (prefix$2 || suffix$2) {
					const casePart = segment.caseSensitive ? part : lowerPart ??= part.toLowerCase();
					if (prefix$2 && !casePart.startsWith(prefix$2)) continue;
					if (suffix$2 && casePart.indexOf(suffix$2, casePart.length - suffix$2.length) < prefix$2.length) continue;
				}
				stack.push({
					node: segment,
					index: index + 1,
					skipped,
					statics,
					dynamics,
					optionals: optionals + segmentScore(partsLength, index),
					extract,
					rawParams
				});
			}
		}
		if (!isBeyondPath && node.dynamic && part) for (let i = node.dynamic.length - 1; i >= 0; i--) {
			const segment = node.dynamic[i];
			const { prefix: prefix$2, suffix: suffix$2 } = segment;
			if (prefix$2 || suffix$2) {
				const casePart = segment.caseSensitive ? part : lowerPart ??= part.toLowerCase();
				if (prefix$2 && !casePart.startsWith(prefix$2)) continue;
				if (suffix$2 && casePart.indexOf(suffix$2, casePart.length - suffix$2.length) < prefix$2.length) continue;
			}
			stack.push({
				node: segment,
				index: index + 1,
				skipped,
				statics,
				dynamics: dynamics + segmentScore(partsLength, index),
				optionals,
				extract,
				rawParams
			});
		}
		if (!isBeyondPath && node.staticInsensitive) {
			const match = node.staticInsensitive.get(lowerPart ??= part.toLowerCase());
			if (match) stack.push({
				node: match,
				index: index + 1,
				skipped,
				statics: statics + segmentScore(partsLength, index),
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
		if (!isBeyondPath && node.static) {
			const match = node.static.get(part);
			if (match) stack.push({
				node: match,
				index: index + 1,
				skipped,
				statics: statics + segmentScore(partsLength, index),
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
		if (node.pathless) for (let i = node.pathless.length - 1; i >= 0; i--) {
			const segment = node.pathless[i];
			stack.push({
				node: segment,
				index,
				skipped,
				statics,
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
	}
	if (bestMatch) return bestMatch;
	if (fuzzy && bestFuzzy) {
		let sliceIndex = bestFuzzy.index;
		for (let i = 0; i < bestFuzzy.index; i++) sliceIndex += parts[i].length;
		const splat = sliceIndex === path.length ? "/" : path.slice(sliceIndex);
		bestFuzzy.rawParams ??= Object.create(null);
		bestFuzzy.rawParams["**"] = decodeURIComponent(splat);
		return bestFuzzy;
	}
	return null;
}
function segmentScore(partsLength, index) {
	return 2 ** (partsLength - index - 1);
}
function isPerfectStaticMatch(statics, partsLength) {
	return statics === 2 ** (partsLength - 1) - 1;
}
function validateParseParams(path, parts, frame) {
	let rawParams;
	let state;
	try {
		[rawParams, state] = extractParams(path, parts, frame);
	} catch {
		return null;
	}
	frame.rawParams = rawParams;
	frame.extract = state;
	if (!frame.node.parse) return true;
	try {
		if (frame.node.parse(rawParams) === false) return null;
	} catch {}
	return true;
}
function isFrameMoreSpecific(prev, next) {
	if (!prev) return true;
	return next.statics > prev.statics || next.statics === prev.statics && (next.dynamics > prev.dynamics || next.dynamics === prev.dynamics && (next.optionals > prev.optionals || next.optionals === prev.optionals && ((next.node.kind === SEGMENT_TYPE_INDEX) > (prev.node.kind === SEGMENT_TYPE_INDEX) || next.node.kind === SEGMENT_TYPE_INDEX === (prev.node.kind === SEGMENT_TYPE_INDEX) && next.node.depth > prev.node.depth)));
}
function joinPaths(paths) {
	return cleanPath(paths.filter((val) => {
		return val !== void 0;
	}).join("/"));
}
function cleanPath(path) {
	return path.replace(/\/{2,}/g, "/");
}
function trimPathLeft(path) {
	return path === "/" ? path : path.replace(/^\/{1,}/, "");
}
function trimPathRight(path) {
	const len = path.length;
	return len > 1 && path[len - 1] === "/" ? path.replace(/\/{1,}$/, "") : path;
}
function trimPath(path) {
	return trimPathRight(trimPathLeft(path));
}
function removeTrailingSlash(value, basepath) {
	if (value?.endsWith("/") && value !== "/" && value !== `${basepath}/`) return value.slice(0, -1);
	return value;
}
function exactPathTest(pathName1, pathName2, basepath) {
	return removeTrailingSlash(pathName1, basepath) === removeTrailingSlash(pathName2, basepath);
}
function resolvePath({ base, to, trailingSlash = "never", cache }) {
	if (to.includes("//")) to = cleanPath(to);
	if (to.startsWith("/")) {
		if (to.length === 1 || trailingSlash === "preserve") return to;
		if (trailingSlash === "always") return to.endsWith("/") ? to : `${to}/`;
		return to.endsWith("/") ? to.slice(0, -1) : to;
	}
	const isBase = to === ".";
	let key;
	if (cache) {
		key = isBase ? base : base + "\0" + to;
		const cached = cache.get(key);
		if (cached) return cached;
	}
	let baseSegments;
	if (isBase) baseSegments = base.split("/");
	else {
		if (base.includes("//")) base = cleanPath(base);
		baseSegments = base.split("/");
		while (baseSegments.length > 1 && last(baseSegments) === "") baseSegments.pop();
		const toSegments = to.split("/");
		for (let index = 0, length = toSegments.length; index < length; index++) {
			const value = toSegments[index];
			if (value === "") {
				if (!index) baseSegments = [value];
				else if (index === length - 1) baseSegments.push(value);
			} else if (value === "..") if (baseSegments.length > 1) baseSegments.pop();
			else baseSegments = [""];
			else if (value === ".") {} else baseSegments.push(value);
		}
	}
	if (baseSegments.length > 1) {
		if (last(baseSegments) === "") {
			if (trailingSlash === "never") baseSegments.pop();
		} else if (trailingSlash === "always") baseSegments.push("");
	}
	const joined = baseSegments.join("/");
	const result = (isBase ? cleanPath(joined) : joined) || "/";
	if (key && cache) cache.set(key, result);
	return result;
}
function compileDecodeCharMap(pathParamsAllowedCharacters) {
	const charMap = new Map(pathParamsAllowedCharacters.map((char) => [encodeURIComponent(char), char]));
	const pattern$1 = Array.from(charMap.keys()).map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
	const regex = new RegExp(pattern$1, "g");
	return (encoded) => encoded.replace(regex, (match) => charMap.get(match) ?? match);
}
function encodeParam(key, params, decoder) {
	const value = params[key];
	if (typeof value !== "string") return value;
	if (key === "_splat") {
		if (/^[a-zA-Z0-9\-._~!/]*$/.test(value)) return value;
		return value.split("/").map((segment) => encodePathParam(segment, decoder)).join("/");
	} else return encodePathParam(value, decoder);
}
function interpolatePath({ path, params, decoder, ...rest }) {
	let isMissingParams = false;
	const usedParams = Object.create(null);
	if (!path || path === "/") return {
		interpolatedPath: "/",
		usedParams,
		isMissingParams
	};
	if (!path.includes("$")) return {
		interpolatedPath: path,
		usedParams,
		isMissingParams
	};
	if (path.indexOf("{") === -1) {
		const length$1 = path.length;
		let cursor$1 = 0;
		let joined$1 = "";
		while (cursor$1 < length$1) {
			while (cursor$1 < length$1 && path.charCodeAt(cursor$1) === 47) cursor$1++;
			if (cursor$1 >= length$1) break;
			const start = cursor$1;
			let end = path.indexOf("/", cursor$1);
			if (end === -1) end = length$1;
			cursor$1 = end;
			const part = path.substring(start, end);
			if (!part) continue;
			if (part.charCodeAt(0) === 36) if (part.length === 1) {
				const splat = params._splat;
				usedParams._splat = splat;
				usedParams["*"] = splat;
				if (!splat) {
					isMissingParams = true;
					continue;
				}
				const value = encodeParam("_splat", params, decoder);
				joined$1 += "/" + value;
			} else {
				const key = part.substring(1);
				if (!isMissingParams && !(key in params)) isMissingParams = true;
				usedParams[key] = params[key];
				const value = encodeParam(key, params, decoder) ?? "undefined";
				joined$1 += "/" + value;
			}
			else joined$1 += "/" + part;
		}
		if (path.endsWith("/")) joined$1 += "/";
		return {
			usedParams,
			interpolatedPath: joined$1 || "/",
			isMissingParams
		};
	}
	const length = path.length;
	let cursor = 0;
	let segment;
	let joined = "";
	while (cursor < length) {
		const start = cursor;
		segment = parseSegment(path, start, segment);
		const end = segment[5];
		cursor = end + 1;
		if (start === end) continue;
		const kind = segment[0];
		if (kind === 0) {
			joined += "/" + path.substring(start, end);
			continue;
		}
		if (kind === 2) {
			const splat = params._splat;
			usedParams._splat = splat;
			usedParams["*"] = splat;
			const prefix$2 = path.substring(start, segment[1]);
			const suffix$2 = path.substring(segment[4], end);
			if (!splat) {
				isMissingParams = true;
				if (prefix$2 || suffix$2) joined += "/" + prefix$2 + suffix$2;
				continue;
			}
			const value = encodeParam("_splat", params, decoder);
			joined += "/" + prefix$2 + value + suffix$2;
			continue;
		}
		if (kind === 1) {
			const key = path.substring(segment[2], segment[3]);
			if (!isMissingParams && !(key in params)) isMissingParams = true;
			usedParams[key] = params[key];
			const prefix$2 = path.substring(start, segment[1]);
			const suffix$2 = path.substring(segment[4], end);
			const value = encodeParam(key, params, decoder) ?? "undefined";
			joined += "/" + prefix$2 + value + suffix$2;
			continue;
		}
		if (kind === 3) {
			const key = path.substring(segment[2], segment[3]);
			const valueRaw = params[key];
			if (valueRaw == null) continue;
			usedParams[key] = valueRaw;
			const prefix$2 = path.substring(start, segment[1]);
			const suffix$2 = path.substring(segment[4], end);
			const value = encodeParam(key, params, decoder) ?? "";
			joined += "/" + prefix$2 + value + suffix$2;
			continue;
		}
	}
	if (path.endsWith("/")) joined += "/";
	return {
		usedParams,
		interpolatedPath: joined || "/",
		isMissingParams
	};
}
function encodePathParam(value, decoder) {
	const encoded = encodeURIComponent(value);
	return decoder?.(encoded) ?? encoded;
}
function getSafeSessionStorage() {
	try {
		return sessionStorage;
	} catch {
		return;
	}
}
var storageKey = "tsr-scroll-restoration-v1_3";
getSafeSessionStorage();
var defaultGetScrollRestorationKey = (location) => {
	return location.state.__TSR_key || location.href;
};
function encode(obj, stringify = String) {
	const result = new URLSearchParams();
	for (const key in obj) {
		const val = obj[key];
		if (val !== void 0) result.set(key, stringify(val));
	}
	return result.toString();
}
function toValue(str) {
	if (!str) return "";
	if (str === "false") return false;
	if (str === "true") return true;
	return +str * 0 === 0 && +str + "" === str ? +str : str;
}
function decode(str) {
	const searchParams = new URLSearchParams(str);
	const result = Object.create(null);
	for (const [key, value] of searchParams.entries()) {
		const previousValue = result[key];
		if (previousValue == null) result[key] = toValue(value);
		else if (Array.isArray(previousValue)) previousValue.push(toValue(value));
		else result[key] = [previousValue, toValue(value)];
	}
	return result;
}
var jsonStart = /^(?:\s|["[{\d-]|fa|nu|tr)/;
var defaultParseSearch = parseSearchWith(JSON.parse);
var defaultStringifySearch = stringifySearchWith(JSON.stringify, JSON.parse);
function parseSearchWith(parser) {
	return (searchStr) => {
		if (searchStr[0] === "?") searchStr = searchStr.substring(1);
		const query = decode(searchStr);
		for (const key in query) {
			const value = query[key];
			if (typeof value === "string") try {
				query[key] = parser(value);
			} catch (_err) {}
		}
		return query;
	};
}
function stringifySearchWith(stringify, parser) {
	const isJsonParser = parser === JSON.parse;
	function stringifyValue(val) {
		if (val && typeof val === "object") try {
			return stringify(val);
		} catch (_err) {}
		else if (parser && typeof val === "string") {
			if (isJsonParser && !jsonStart.test(val)) return val;
			try {
				parser(val);
				return stringify(val);
			} catch (_err) {}
		}
		return val;
	}
	return (search) => {
		const searchStr = encode(search, stringifyValue);
		return searchStr ? `?${searchStr}` : "";
	};
}
function composeRewrites(rewrites) {
	return {
		input: ({ url }) => {
			for (const rewrite of rewrites) url = executeRewriteInput(rewrite, url);
			return url;
		},
		output: ({ url }) => {
			for (let i = rewrites.length - 1; i >= 0; i--) url = executeRewriteOutput(rewrites[i], url);
			return url;
		}
	};
}
function rewriteBasepath(opts) {
	const trimmedBasepath = trimPath(opts.basepath);
	const normalizedBasepath = `/${trimmedBasepath}`;
	const checkBasepath = opts.caseSensitive ? normalizedBasepath : normalizedBasepath.toLowerCase();
	const checkBasepathWithSlash = `${checkBasepath}/`;
	return {
		input: ({ url }) => {
			const pathname = opts.caseSensitive ? url.pathname : url.pathname.toLowerCase();
			if (pathname === checkBasepath) url.pathname = "/";
			else if (pathname.startsWith(checkBasepathWithSlash)) url.pathname = url.pathname.slice(normalizedBasepath.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = joinPaths([
				"/",
				trimmedBasepath,
				url.pathname
			]);
			return url;
		}
	};
}
function executeRewriteInput(rewrite, url) {
	const res = rewrite?.input?.({ url });
	if (res) {
		if (typeof res === "string") return new URL(res);
		else if (res instanceof URL) return res;
	}
	return url;
}
function executeRewriteOutput(rewrite, url) {
	const res = rewrite?.output?.({ url });
	if (res) {
		if (typeof res === "string") return new URL(res);
		else if (res instanceof URL) return res;
	}
	return url;
}
function createNonReactiveMutableStore(initialValue) {
	let value = initialValue;
	return {
		get() {
			return value;
		},
		set(nextOrUpdater) {
			value = functionalUpdate(nextOrUpdater, value);
		}
	};
}
function createNonReactiveReadonlyStore(read) {
	return { get() {
		return read();
	} };
}
function createRouterStores(initialLocation, config) {
	const { createMutableStore, createReadonlyStore, batch } = config;
	const byRoute = /* @__PURE__ */ new Map();
	const status = createMutableStore("idle");
	const location = createMutableStore(initialLocation);
	const resolvedLocation = createMutableStore(void 0);
	const ids = createMutableStore([]);
	const matches = createReadonlyStore(() => ids.get().map((id) => byRoute.get(id).get()));
	const __store = createReadonlyStore(() => ({
		status: status.get(),
		isLoading: status.get() === "pending",
		matches: matches.get(),
		location: location.get(),
		resolvedLocation: resolvedLocation.get()
	}));
	function getMatchStore(routeId) {
		let matchStore = byRoute.get(routeId);
		if (!matchStore) {
			matchStore = createMutableStore(void 0);
			byRoute.set(routeId, matchStore);
		}
		return matchStore;
	}
	const store = {
		status,
		location,
		resolvedLocation,
		ids,
		matches,
		byRoute,
		__store,
		getMatchStore,
		setMatches
	};
	function setMatches(nextMatches) {
		const previousIds = ids.get();
		const nextIds = nextMatches.map((match) => match.routeId);
		batch(() => {
			if (!arraysEqual(previousIds, nextIds)) ids.set(nextIds);
			for (const id of previousIds) if (!nextIds.includes(id)) byRoute.get(id).set(() => void 0);
			for (const nextMatch of nextMatches) {
				const matchStore = getMatchStore(nextMatch.routeId);
				if (matchStore.get() !== nextMatch) matchStore.set(nextMatch);
			}
		});
	}
	return store;
}
var stateIndexKey = "__TSR_index";
function createHistory(opts) {
	let location = opts.getLocation();
	const subscribers = /* @__PURE__ */ new Set();
	const notify = (action) => {
		location = opts.getLocation();
		subscribers.forEach((subscriber) => subscriber({
			location,
			action
		}));
	};
	const handleIndexChange = (action) => {
		if (opts.notifyOnIndexChange ?? true) notify(action);
		else location = opts.getLocation();
	};
	const tryNavigation = async ({ task, navigateOpts, ...actionInfo }) => {
		if (navigateOpts?.ignoreBlocker ?? false) {
			task();
			return;
		}
		const blockers = opts.getBlockers?.() ?? [];
		const isPushOrReplace = actionInfo.type === "PUSH" || actionInfo.type === "REPLACE";
		if (typeof document !== "undefined" && blockers.length && isPushOrReplace) for (const blocker of blockers) {
			const nextLocation = parseHref(actionInfo.path, actionInfo.state);
			if (await blocker.blockerFn({
				currentLocation: location,
				nextLocation,
				action: actionInfo.type
			})) {
				opts.onBlocked?.();
				return;
			}
		}
		task();
	};
	return {
		get location() {
			return location;
		},
		get length() {
			return opts.getLength();
		},
		subscribers,
		subscribe: (cb) => {
			subscribers.add(cb);
			return () => {
				subscribers.delete(cb);
			};
		},
		push: (path, state, navigateOpts) => {
			const currentIndex = location.state[stateIndexKey];
			state = assignKeyAndIndex(currentIndex + 1, state);
			tryNavigation({
				task: () => {
					opts.pushState(path, state);
					notify({ type: "PUSH" });
				},
				navigateOpts,
				type: "PUSH",
				path,
				state
			});
		},
		replace: (path, state, navigateOpts) => {
			const currentIndex = location.state[stateIndexKey];
			state = assignKeyAndIndex(currentIndex, state);
			tryNavigation({
				task: () => {
					opts.replaceState(path, state);
					notify({ type: "REPLACE" });
				},
				navigateOpts,
				type: "REPLACE",
				path,
				state
			});
		},
		go: (index, navigateOpts) => {
			tryNavigation({
				task: () => {
					opts.go(index);
					handleIndexChange({
						type: "GO",
						index
					});
				},
				navigateOpts,
				type: "GO"
			});
		},
		back: (navigateOpts) => {
			tryNavigation({
				task: () => {
					opts.back(navigateOpts?.ignoreBlocker ?? false);
					handleIndexChange({ type: "BACK" });
				},
				navigateOpts,
				type: "BACK"
			});
		},
		forward: (navigateOpts) => {
			tryNavigation({
				task: () => {
					opts.forward(navigateOpts?.ignoreBlocker ?? false);
					handleIndexChange({ type: "FORWARD" });
				},
				navigateOpts,
				type: "FORWARD"
			});
		},
		canGoBack: () => location.state[stateIndexKey] !== 0,
		createHref: (str) => opts.createHref(str),
		block: (blocker) => {
			if (!opts.setBlockers) return () => {};
			const blockers = opts.getBlockers?.() ?? [];
			opts.setBlockers([...blockers, blocker]);
			return () => {
				const blockers$1 = opts.getBlockers?.() ?? [];
				opts.setBlockers?.(blockers$1.filter((b) => b !== blocker));
			};
		},
		flush: () => opts.flush?.(),
		destroy: () => opts.destroy?.(),
		notify
	};
}
function assignKeyAndIndex(index, state) {
	if (!state) state = {};
	const key = createRandomKey();
	return {
		...state,
		key,
		__TSR_key: key,
		[stateIndexKey]: index
	};
}
function createMemoryHistory(opts = { initialEntries: ["/"] }) {
	const entries = opts.initialEntries;
	let index = opts.initialIndex ? Math.min(Math.max(opts.initialIndex, 0), entries.length - 1) : entries.length - 1;
	const states = entries.map((_entry, index$1) => assignKeyAndIndex(index$1, void 0));
	const getLocation = () => parseHref(entries[index], states[index]);
	let blockers = [];
	const _getBlockers = () => blockers;
	const _setBlockers = (newBlockers) => blockers = newBlockers;
	return createHistory({
		getLocation,
		getLength: () => entries.length,
		pushState: (path, state) => {
			if (index < entries.length - 1) {
				entries.splice(index + 1);
				states.splice(index + 1);
			}
			states.push(state);
			entries.push(path);
			index = Math.max(entries.length - 1, 0);
		},
		replaceState: (path, state) => {
			states[index] = state;
			entries[index] = path;
		},
		back: () => {
			index = Math.max(index - 1, 0);
		},
		forward: () => {
			index = Math.min(index + 1, entries.length - 1);
		},
		go: (n) => {
			index = Math.min(Math.max(index + n, 0), entries.length - 1);
		},
		createHref: (path) => path,
		getBlockers: _getBlockers,
		setBlockers: _setBlockers
	});
}
function sanitizePath(path) {
	let sanitized = path.replace(/[\x00-\x1f\x7f]/g, "");
	if (sanitized.startsWith("//")) sanitized = "/" + sanitized.replace(/^\/+/, "");
	return sanitized;
}
function parseHref(href, state) {
	const sanitizedHref = sanitizePath(href);
	const hashIndex = sanitizedHref.indexOf("#");
	const searchIndex = sanitizedHref.indexOf("?");
	const addedKey = createRandomKey();
	return {
		href: sanitizedHref,
		pathname: sanitizedHref.substring(0, hashIndex > 0 ? searchIndex > 0 ? Math.min(hashIndex, searchIndex) : hashIndex : searchIndex > 0 ? searchIndex : sanitizedHref.length),
		hash: hashIndex > -1 ? sanitizedHref.substring(hashIndex) : "",
		search: searchIndex > -1 ? sanitizedHref.slice(searchIndex, hashIndex === -1 ? void 0 : hashIndex) : "",
		state: state || {
			[stateIndexKey]: 0,
			key: addedKey,
			__TSR_key: addedKey
		}
	};
}
function createRandomKey() {
	return (Math.random() + 1).toString(36).substring(7);
}
function routeNeedsLoad(route) {
	return route.options.loader || route.options.beforeLoad || route.lazyFn || route.options.component?.preload || route.options.pendingComponent?.preload;
}
function getLocationChangeInfo(location, resolvedLocation) {
	return {
		fromLocation: resolvedLocation,
		toLocation: location,
		pathChanged: resolvedLocation?.pathname !== location.pathname,
		hrefChanged: resolvedLocation?.href !== location.href,
		hashChanged: resolvedLocation?.hash !== location.hash
	};
}
function _getUserHistoryState({ key: _key, __TSR_key: _tsrKey, __TSR_index: _tsrIndex, __hashScrollIntoViewOptions: _hashScroll, ...state }) {
	return state;
}
function runRouteLifecycle(router, previous, matches, owner) {
	for (const match of previous) {
		if (owner && router._tx !== owner) return;
		if (!matches.some((candidate) => candidate.routeId === match.routeId)) router.routesById[match.routeId].options.onLeave?.(match);
	}
	for (const match of matches) {
		if (owner && router._tx !== owner) return;
		router.routesById[match.routeId].options[previous.some((candidate) => candidate.routeId === match.routeId) ? "onStay" : "onEnter"]?.(match);
	}
}
var RouterCore = class {
	constructor(options, getStoreConfig) {
		this.tempLocationKey = `${Math.round(Math.random() * 1e7)}`;
		this._scroll = { next: true };
		this.subscribers = /* @__PURE__ */ new Set();
		this._cache = /* @__PURE__ */ new Map();
		this._committed = [];
		this.routeBranchCache = /* @__PURE__ */ new WeakMap();
		this.lightweightCache = /* @__PURE__ */ new WeakMap();
		this.startTransition = async (fn) => {
			fn();
			return false;
		};
		this.update = (newOptions) => {
			const prevOptions = this.options;
			const prevBasepath = this.basepath ?? prevOptions?.basepath ?? "/";
			const basepathWasUnset = this.basepath === void 0;
			const prevRewriteOption = prevOptions?.rewrite;
			this.options = {
				...prevOptions,
				...newOptions
			};
			this.isServer = this.options.isServer ?? true ?? typeof document === "undefined";
			this.protocolAllowlist = new Set(this.options.protocolAllowlist);
			if (this.options.pathParamsAllowedCharacters) this.pathParamsDecoder = compileDecodeCharMap(this.options.pathParamsAllowedCharacters);
			if (!this.history || this.options.history && this.options.history !== this.history) if (!this.options.history) {} else this.history = this.options.history;
			this.origin = this.options.origin;
			if (!this.origin) this.origin = "http://localhost";
			if (this.history) this.updateLatestLocation();
			if (this.options.routeTree !== this.routeTree) {
				this.routeTree = this.options.routeTree;
				let processRouteTreeResult;
				if (globalThis.__TSR_CACHE__ && globalThis.__TSR_CACHE__.routeTree === this.routeTree) {
					const cached = globalThis.__TSR_CACHE__;
					this.resolvePathCache = cached.resolvePathCache;
					processRouteTreeResult = cached.processRouteTreeResult;
				} else {
					this.resolvePathCache = createLRUCache(1e3);
					processRouteTreeResult = this.buildRouteTree();
					if (globalThis.__TSR_CACHE__ === void 0) globalThis.__TSR_CACHE__ = {
						routeTree: this.routeTree,
						processRouteTreeResult,
						resolvePathCache: this.resolvePathCache
					};
				}
				this.setRoutes(processRouteTreeResult);
			}
			if (!this.stores && this.latestLocation) {
				const config = this.getStoreConfig(this);
				this.batch = config.batch;
				this.stores = createRouterStores(this.latestLocation, config);
			}
			const nextBasepath = this.options.basepath ?? "/";
			const nextRewriteOption = this.options.rewrite;
			if (basepathWasUnset || prevBasepath !== nextBasepath || prevRewriteOption !== nextRewriteOption) {
				this.basepath = nextBasepath;
				const rewrites = [];
				const trimmed = trimPath(nextBasepath);
				if (trimmed && trimmed !== "/") rewrites.push(rewriteBasepath({ basepath: nextBasepath }));
				if (nextRewriteOption) rewrites.push(nextRewriteOption);
				this.rewrite = rewrites.length === 0 ? void 0 : rewrites.length === 1 ? rewrites[0] : composeRewrites(rewrites);
				if (this.history) this.updateLatestLocation();
				if (this.stores) this.stores.location.set(this.latestLocation);
			}
		};
		this.updateLatestLocation = () => {
			this.latestLocation = this.parseLocation(this.history.location, this.latestLocation);
		};
		this.buildRouteTree = () => {
			const result = processRouteTree(this.routeTree, this.options.caseSensitive, (route, i) => {
				route.init({ originalIndex: i });
			});
			if (this.options.routeMasks) processRouteMasks(this.options.routeMasks, result.processedTree);
			return result;
		};
		this.subscribe = (eventType, fn) => {
			const listener = {
				eventType,
				fn
			};
			this.subscribers.add(listener);
			return () => {
				this.subscribers.delete(listener);
			};
		};
		this.emit = (routerEvent) => {
			for (const listener of this.subscribers) if (listener.eventType === routerEvent.type) try {
				listener.fn(routerEvent);
			} catch (e) {
				console.error(e);
			}
		};
		this.parseLocation = (locationToParse, previousLocation) => {
			const parse = ({ pathname, search, hash, href, state }) => {
				if (!this.rewrite && !/[ \x00-\x1f\x7f\u0080-\uffff]/.test(pathname)) {
					const parsedSearch$1 = this.options.parseSearch(search);
					const searchStr$1 = this.options.stringifySearch(parsedSearch$1);
					return {
						href: pathname + searchStr$1 + hash,
						publicHref: pathname + searchStr$1 + hash,
						pathname: decodePath(pathname).path,
						external: false,
						searchStr: searchStr$1,
						search: nullReplaceEqualDeep(previousLocation?.search, parsedSearch$1),
						hash: decodePath(hash.slice(1)).path,
						state: replaceEqualDeep(previousLocation?.state, state)
					};
				}
				const fullUrl = new URL(href, this.origin);
				const url = executeRewriteInput(this.rewrite, fullUrl);
				const parsedSearch = this.options.parseSearch(url.search);
				const searchStr = this.options.stringifySearch(parsedSearch);
				url.search = searchStr;
				return {
					href: url.href.replace(url.origin, ""),
					publicHref: href,
					pathname: decodePath(url.pathname).path,
					external: !!this.rewrite && url.origin !== this.origin,
					searchStr,
					search: nullReplaceEqualDeep(previousLocation?.search, parsedSearch),
					hash: decodePath(url.hash.slice(1)).path,
					state: replaceEqualDeep(previousLocation?.state, state)
				};
			};
			const location = parse(locationToParse);
			const { __tempLocation, __tempKey } = location.state;
			if (__tempLocation && (!__tempKey || __tempKey === this.tempLocationKey)) {
				const parsedTempLocation = parse(__tempLocation);
				parsedTempLocation.state.key = location.state.key;
				parsedTempLocation.state.__TSR_key = location.state.__TSR_key;
				delete parsedTempLocation.state.__tempLocation;
				return {
					...parsedTempLocation,
					maskedLocation: location
				};
			}
			return location;
		};
		this.resolvePathWithBase = (from, path) => {
			return resolvePath({
				base: from,
				to: path,
				trailingSlash: this.options.trailingSlash,
				cache: this.resolvePathCache
			});
		};
		this.matchRoutes = (pathnameOrNext, locationSearchOrOpts, opts) => {
			if (typeof pathnameOrNext === "string") return this.matchRoutesInternal({
				pathname: pathnameOrNext,
				search: locationSearchOrOpts
			}, opts);
			return this.matchRoutesInternal(pathnameOrNext, locationSearchOrOpts);
		};
		this.getMatchedRoutes = (pathname) => {
			const rawParams = Object.create(null);
			const match = findRouteMatch(trimPathRight(pathname), this.processedTree, true);
			if (match) Object.assign(rawParams, match.rawParams);
			return [
				match?.branch || [this.routesById["__root__"]],
				rawParams,
				match?.route
			];
		};
		this.buildLocation = (opts) => {
			const build = (dest = {}) => {
				if (dest.href) {
					const parsed = parseHref(dest.href, {});
					dest = {
						...dest,
						to: executeRewriteInput(this.rewrite, new URL(parsed.pathname, this.origin)).pathname,
						search: this.options.parseSearch(parsed.search),
						hash: parsed.hash.slice(1)
					};
				}
				const currentLocation = dest._fromLocation || this._pendingLocation || this.latestLocation;
				const lightweightResult = this.matchRoutesLightweight(currentLocation);
				if (dest.from && false);
				const defaultedFromPath = dest.unsafeRelative === "path" ? currentLocation.pathname : dest.from ?? lightweightResult[1];
				const fromSearch = lightweightResult[2];
				const fromParams = lightweightResult[3];
				const nextTo = this.resolvePathWithBase(defaultedFromPath, dest.to ? `${dest.to}` : ".");
				let nextParams = resolveNextParams(dest.params, fromParams);
				const destRoute = this.routesByPath[trimPathRight(nextTo)];
				let destRoutes;
				if (destRoute) destRoutes = this.getRouteBranch(destRoute);
				else if (nextTo.includes("$")) destRoutes = [];
				else {
					const [matchedRoutes, rawParams, foundRoute] = this.getMatchedRoutes(nextTo);
					destRoutes = matchedRoutes;
					if (this.options.notFoundRoute && (!foundRoute || foundRoute.path !== "/" && rawParams["**"])) destRoutes = [...destRoutes, this.options.notFoundRoute];
				}
				if (destRoutes.length && hasKeys(nextParams)) for (const route of destRoutes) {
					const fn = route.options.params?.stringify ?? route.options.stringifyParams;
					if (fn) {
						if (nextParams === fromParams) nextParams = Object.assign(Object.create(null), nextParams);
						try {
							Object.assign(nextParams, fn(nextParams));
						} catch {}
					}
				}
				const nextPathname = opts.leaveParams ? nextTo : decodePath(interpolatePath({
					path: nextTo,
					params: nextParams,
					decoder: this.pathParamsDecoder,
					server: this.isServer
				}).interpolatedPath).path;
				let nextSearch = fromSearch;
				if (opts._includeValidateSearch && this.options.search?.strict) {
					const validatedSearch = {};
					destRoutes.forEach((route) => {
						if (route.options.validateSearch) try {
							Object.assign(validatedSearch, validateSearch(route.options.validateSearch, {
								...validatedSearch,
								...nextSearch
							}));
						} catch {}
					});
					nextSearch = validatedSearch;
				}
				nextSearch = applySearchMiddleware(nextSearch, dest, destRoutes, opts._includeValidateSearch);
				nextSearch = nullReplaceEqualDeep(fromSearch, nextSearch);
				const searchStr = this.options.stringifySearch(nextSearch);
				const hash = dest.hash === true ? currentLocation.hash : dest.hash ? functionalUpdate(dest.hash, currentLocation.hash) : void 0;
				const hashStr = hash ? `#${hash}` : "";
				let nextState = dest.state === true ? currentLocation.state : dest.state ? functionalUpdate(dest.state, currentLocation.state) : {};
				if (dest.state) nextState = replaceEqualDeep(currentLocation.state, nextState);
				const fullPath = `${nextPathname}${searchStr}${hashStr}`;
				let href;
				let publicHref;
				let external = false;
				if (this.rewrite) {
					const url = new URL(fullPath, this.origin);
					const rewrittenUrl = executeRewriteOutput(this.rewrite, url);
					href = url.href.replace(url.origin, "");
					if (rewrittenUrl.origin !== this.origin) {
						publicHref = rewrittenUrl.href;
						external = true;
					} else publicHref = rewrittenUrl.pathname + rewrittenUrl.search + rewrittenUrl.hash;
				} else {
					href = encodePathLikeUrl(fullPath);
					publicHref = href;
				}
				return {
					publicHref,
					href,
					pathname: nextPathname,
					search: nextSearch,
					searchStr,
					state: nextState,
					hash: hash ?? "",
					external,
					unmaskOnReload: dest.unmaskOnReload
				};
			};
			const next = build(opts);
			if (opts.mask) next.maskedLocation = build({
				from: opts.from,
				...opts.mask
			});
			else if (this.options.routeMasks) {
				const match = findFlatMatch(next.pathname, this.processedTree);
				if (match) {
					const params = Object.assign(Object.create(null), match.rawParams);
					const { from: _from, params: maskParams, ...maskProps } = match.route;
					const nextParams = resolveNextParams(maskParams, params);
					next.maskedLocation = build({
						from: opts.from,
						...maskProps,
						params: nextParams
					});
				}
			}
			return next;
		};
		this.commitLocation = async ({ viewTransition, ignoreBlocker, ...next }) => {
			let historyAction;
			const isSameLocation = trimPathRight(this.latestLocation.href) === trimPathRight(next.href) && deepEqual(_getUserHistoryState(next.state), _getUserHistoryState(this.latestLocation.state));
			const previousCommitPromise = this._commitPromise;
			let resolve;
			const commitPromise = new Promise((done) => {
				resolve = done;
			});
			commitPromise.resolve = () => {
				resolve();
				previousCommitPromise?.resolve();
			};
			this._commitPromise = commitPromise;
			if (isSameLocation) this.load();
			else {
				let { maskedLocation, hashScrollIntoView, ...nextHistory } = next;
				if (maskedLocation) {
					nextHistory = {
						...maskedLocation,
						state: {
							...maskedLocation.state,
							__tempKey: void 0,
							__tempLocation: {
								...nextHistory,
								search: nextHistory.searchStr,
								state: {
									...nextHistory.state,
									__tempKey: void 0,
									__tempLocation: void 0,
									__TSR_key: void 0,
									key: void 0
								}
							}
						}
					};
					if (nextHistory.unmaskOnReload ?? this.options.unmaskOnReload ?? false) nextHistory.state.__tempKey = this.tempLocationKey;
				}
				nextHistory.state.__hashScrollIntoViewOptions = hashScrollIntoView ?? this.options.defaultHashScrollIntoView ?? true;
				this.shouldViewTransition = viewTransition;
				historyAction = next.replace ? "REPLACE" : "PUSH";
				this.history[historyAction === "REPLACE" ? "replace" : "push"](nextHistory.publicHref, nextHistory.state, { ignoreBlocker });
				if (!this.history.subscribers.size) this.load({ action: { type: historyAction } });
			}
			this._scroll.next = next.resetScroll ?? true;
			return this._commitPromise;
		};
		this.buildAndCommitLocation = ({ replace, resetScroll, hashScrollIntoView, viewTransition, ignoreBlocker, ...rest } = {}) => {
			const location = this.buildLocation({
				...rest,
				_includeValidateSearch: true
			});
			this._pendingLocation = location;
			const commitPromise = this.commitLocation({
				...location,
				viewTransition,
				replace,
				resetScroll,
				hashScrollIntoView,
				ignoreBlocker
			});
			queueMicrotask(() => {
				if (this._pendingLocation === location) this._pendingLocation = void 0;
			});
			return commitPromise;
		};
		this.navigate = async ({ to, reloadDocument, href, publicHref, ...rest }) => {
			let hrefIsUrl = false;
			if (href) try {
				new URL(`${href}`);
				hrefIsUrl = true;
			} catch {}
			if (hrefIsUrl && !reloadDocument) reloadDocument = true;
			if (reloadDocument) {
				if (to !== void 0 || !href) {
					const location = this.buildLocation({
						to,
						...rest
					});
					href = href ?? location.publicHref;
					publicHref = publicHref ?? location.publicHref;
				}
				const reloadHref = !hrefIsUrl && publicHref ? publicHref : href;
				if (isDangerousProtocol(reloadHref, this.protocolAllowlist)) return;
				if (!rest.ignoreBlocker) {
					const blockers = this.history.getBlockers?.() ?? [];
					for (const blocker of blockers) if (blocker?.blockerFn) {
						if (await blocker.blockerFn({
							currentLocation: this.latestLocation,
							nextLocation: this.latestLocation,
							action: "PUSH"
						})) return;
					}
				}
				if (rest.replace) window.location.replace(reloadHref);
				else window.location.href = reloadHref;
				return;
			}
			return this.buildAndCommitLocation({
				...rest,
				href,
				to,
				_isNavigate: true
			});
		};
		this.load = async (opts) => {
			return loadServerRoute(this, opts);
		};
		this.startViewTransition = (fn) => {
			this.shouldViewTransition ?? this.options.defaultViewTransition;
			this.shouldViewTransition = void 0;
			return fn();
		};
		this.invalidate = (opts) => {
			const committedMatches = this._committed;
			const filter = opts?.filter;
			const preloads = this._preloads;
			const invalidIds = new Set([
				...committedMatches,
				...this._cache.values(),
				...[...preloads?.values() ?? []].flat(),
				...this._tx?.[3] ?? []
			].filter((match) => !filter || filter(match)).map((match) => match.id));
			const discardedPreloads = [];
			for (const [controller, matches] of preloads ?? []) if (matches.some((match) => invalidIds.has(match.id))) {
				preloads.delete(controller);
				discardedPreloads.push(controller);
			}
			const invalidate = (d) => {
				if (invalidIds.has(d.id)) {
					const route = this.routesById[d.routeId];
					const next = {
						...d,
						invalid: true,
						...(opts?.forcePending || d.status === "error" || d.status === "notFound") && routeNeedsLoad(route) ? {
							status: "pending",
							error: void 0
						} : void 0
					};
					d._flight = void 0;
					return next;
				}
				return d;
			};
			this._committed = committedMatches.map(invalidate);
			for (const [id, match] of this._cache) if (invalidIds.has(id)) {
				match.invalid = true;
				if (opts?.forcePending) match.status = "pending";
			}
			for (const id of invalidIds) this._flights?.delete(id);
			for (const controller of discardedPreloads) controller.abort();
			this.shouldViewTransition = false;
			return this.load({ sync: opts?.sync });
		};
		this.resolveRedirect = (redirect$1) => {
			const locationHeader = redirect$1.headers.get("Location");
			if (!redirect$1.options.href) {
				const href = this.buildLocation(redirect$1.options).publicHref || "/";
				redirect$1.options.href = href;
				redirect$1.headers.set("Location", href);
			} else if (locationHeader) try {
				const url = new URL(locationHeader);
				if (this.origin && url.origin === this.origin) {
					const href = url.pathname + url.search + url.hash;
					redirect$1.options.href = href;
					redirect$1.headers.set("Location", href);
				}
			} catch {}
			if (redirect$1.options.href && isDangerousProtocol(redirect$1.options.href, this.protocolAllowlist)) throw new Error("Redirect blocked: unsafe protocol");
			if (!redirect$1.headers.get("Location")) redirect$1.headers.set("Location", redirect$1.options.href);
			return redirect$1;
		};
		this.clearCache = (opts) => {
			const cached = this._cache;
			const preloads = this._preloads;
			const filter = opts?.filter;
			const discarded = [];
			const discardedIds = [];
			for (const [id, match] of cached) if (!filter || filter(match)) {
				discardedIds.push(id);
				discarded.push(match);
			}
			const abort$2 = [];
			for (const [controller, matches] of preloads ?? []) if (!filter || matches.some(filter)) {
				abort$2.push(controller);
				discarded.push(...matches);
			}
			for (const id of discardedIds) cached.delete(id);
			for (const controller of abort$2) preloads.delete(controller);
			for (const match of discarded) {
				const flight = match._flight;
				match._flight = void 0;
				if (flight && !--flight[2]) {
					if (this._flights?.get(match.id) === flight) this._flights.delete(match.id);
					abort$2.push(flight[1]);
				}
			}
			for (const controller of abort$2) controller.abort();
		};
		this.loadRouteChunk = loadRouteChunk;
		this.preloadRoute = (opts) => preloadClientRoute(this, opts);
		this.matchRoute = (location, opts) => {
			const matchLocation = {
				...location,
				to: location.to ? this.resolvePathWithBase(location.from || "", location.to) : void 0,
				params: location.params || {},
				leaveParams: true
			};
			const next = this.buildLocation(matchLocation);
			const isPending = this.stores.status.get() === "pending";
			if (opts?.pending && !isPending) return false;
			const baseLocation = opts?.pending ?? !isPending ? this.latestLocation : this.stores.resolvedLocation.get() || this.stores.location.get();
			const match = findSingleMatch(next.pathname, opts?.caseSensitive ?? false, opts?.fuzzy ?? false, baseLocation.pathname, this.processedTree);
			if (!match) return false;
			if (location.params) {
				if (!deepEqual(match.rawParams, location.params, { partial: true })) return false;
			}
			if (opts?.includeSearch ?? true) return deepEqual(baseLocation.search, next.search, { partial: true }) ? match.rawParams : false;
			return match.rawParams;
		};
		this.getStoreConfig = getStoreConfig;
		this.update({
			defaultPreloadDelay: 50,
			defaultPendingMs: 1e3,
			defaultPendingMinMs: 500,
			context: void 0,
			...options,
			caseSensitive: options.caseSensitive ?? false,
			notFoundMode: options.notFoundMode ?? "fuzzy",
			stringifySearch: options.stringifySearch ?? defaultStringifySearch,
			parseSearch: options.parseSearch ?? defaultParseSearch,
			protocolAllowlist: options.protocolAllowlist ?? DEFAULT_PROTOCOL_ALLOWLIST
		});
	}
	isShell() {
		return !!this.options.isShell;
	}
	get state() {
		return this.stores.__store.get();
	}
	setRoutes({ routesById, routesByPath, processedTree }) {
		this.routesById = routesById;
		this.routesByPath = routesByPath;
		this.processedTree = processedTree;
		const notFoundRoute = this.options.notFoundRoute;
		if (notFoundRoute) {
			notFoundRoute.init({ originalIndex: 99999999999 });
			this.routesById[notFoundRoute.id] = notFoundRoute;
		}
	}
	getRouteBranch(route) {
		let branch = this.routeBranchCache.get(route);
		if (!branch) {
			branch = buildRouteBranch(route);
			this.routeBranchCache.set(route, branch);
		}
		return branch;
	}
	matchRoutesInternal(next, opts) {
		const [initialMatchedRoutes, rawParams, foundRoute] = this.getMatchedRoutes(next.pathname);
		let matchedRoutes = initialMatchedRoutes;
		let isGlobalNotFound = false;
		if (foundRoute ? foundRoute.path !== "/" && rawParams["**"] : trimPathRight(next.pathname)) if (this.options.notFoundRoute) matchedRoutes = [...matchedRoutes, this.options.notFoundRoute];
		else isGlobalNotFound = true;
		const _notFoundRouteId = isGlobalNotFound ? findGlobalNotFoundRouteId(this.options.notFoundMode, matchedRoutes) : void 0;
		const matches = new Array(matchedRoutes.length);
		const committed = this._committed;
		const previousAt = (route, index) => {
			const match = committed[index];
			return match?.routeId === route.id ? match : route === this.options.notFoundRoute ? committed.find((candidate) => candidate.routeId === route.id) : void 0;
		};
		let strictParams;
		for (let index = 0; index < matchedRoutes.length; index++) {
			const route = matchedRoutes[index];
			const parentMatch = matches[index - 1];
			let preMatchSearch;
			let strictMatchSearch;
			let searchError;
			{
				const parentSearch = parentMatch?.search ?? next.search;
				const parentStrictSearch = parentMatch?._strictSearch ?? void 0;
				try {
					const strictSearch = validateSearch(route.options.validateSearch, { ...parentSearch }) ?? void 0;
					preMatchSearch = {
						...parentSearch,
						...strictSearch
					};
					strictMatchSearch = {
						...parentStrictSearch,
						...strictSearch
					};
				} catch (err) {
					let searchParamError = err;
					if (!(err instanceof SearchParamError)) searchParamError = new SearchParamError(err.message, { cause: err });
					if (opts?.throwOnError) throw searchParamError;
					preMatchSearch = parentSearch;
					strictMatchSearch = {};
					searchError = searchParamError;
				}
			}
			let loaderDeps = "";
			let loaderDepsHash = "";
			try {
				loaderDeps = route.options.loaderDeps?.({ search: preMatchSearch }) ?? "";
				loaderDepsHash = loaderDeps ? JSON.stringify(loaderDeps) || "" : "";
			} catch (cause$1) {
				if (opts?.throwOnError) throw cause$1;
				searchError ??= cause$1;
			}
			const { interpolatedPath, usedParams } = interpolatePath({
				path: route.fullPath,
				params: rawParams,
				decoder: this.pathParamsDecoder,
				server: this.isServer
			});
			const matchId = route.id + interpolatedPath + loaderDepsHash;
			const previousMatch = previousAt(route, index);
			const existingMatch = this._cache.get(matchId) ?? (previousMatch?.id === matchId ? previousMatch : void 0);
			strictParams = existingMatch?._strictParams ?? Object.assign(usedParams, strictParams);
			let paramsError;
			if (!existingMatch) try {
				extractStrictParams(route, strictParams);
			} catch (err) {
				if (isNotFound(err) || isRedirect(err)) paramsError = err;
				else paramsError = new PathParamError(err.message, { cause: err });
				if (opts?.throwOnError) throw paramsError;
			}
			const cause = previousMatch ? "stay" : "enter";
			let match;
			if (existingMatch) match = {
				...existingMatch,
				cause,
				search: previousMatch ? nullReplaceEqualDeep(previousMatch.search, preMatchSearch) : nullReplaceEqualDeep(existingMatch.search, preMatchSearch),
				_strictSearch: strictMatchSearch,
				searchError
			};
			else {
				const status = routeNeedsLoad(route) ? "pending" : "success";
				match = {
					id: matchId,
					ssr: void 0,
					index,
					routeId: route.id,
					params: previousMatch?.params ?? strictParams,
					_strictParams: strictParams,
					pathname: interpolatedPath,
					updatedAt: Date.now(),
					search: previousMatch ? nullReplaceEqualDeep(previousMatch.search, preMatchSearch) : preMatchSearch,
					_strictSearch: strictMatchSearch,
					searchError,
					status,
					isFetching: false,
					error: void 0,
					paramsError,
					context: {},
					abortController: opts?._controller ?? new AbortController(),
					cause,
					loaderDeps: previousMatch ? replaceEqualDeep(previousMatch.loaderDeps, loaderDeps) : loaderDeps,
					invalid: false,
					preload: false,
					staticData: route.options.staticData || {},
					fullPath: route.fullPath
				};
			}
			const _notFound = _notFoundRouteId === route.id;
			if (match._notFound && !_notFound) match.error = void 0;
			match._notFound = _notFound;
			matches[index] = match;
		}
		for (let index = 0; index < matches.length; index++) {
			const match = matches[index];
			match.params = match.cause === "stay" ? nullReplaceEqualDeep(match.params, strictParams) : strictParams;
			if (opts?._controller) match.context = {};
		}
		return matches;
	}
	matchRoutesLightweight(location) {
		const lastRouteId = last(this.stores.ids.get());
		const lastStateMatch = lastRouteId ? this.stores.byRoute.get(lastRouteId).get() : void 0;
		const lastStateMatchId = lastStateMatch?.id;
		const cached = this.lightweightCache.get(location);
		if (cached && cached[0] === lastStateMatchId) return cached[1];
		const [matchedRoutes, rawParams] = this.getMatchedRoutes(location.pathname);
		const lastRoute = last(matchedRoutes);
		const accumulatedSearch = { ...location.search };
		for (const route of matchedRoutes) try {
			Object.assign(accumulatedSearch, validateSearch(route.options.validateSearch, accumulatedSearch));
		} catch {}
		const canReuseParams = lastStateMatch && lastStateMatch.routeId === lastRoute.id && lastStateMatch.pathname === location.pathname;
		let params;
		if (canReuseParams) params = lastStateMatch.params;
		else {
			const strictParams = Object.assign(Object.create(null), rawParams);
			for (const route of matchedRoutes) try {
				extractStrictParams(route, strictParams);
			} catch {}
			params = strictParams;
		}
		const result = [
			matchedRoutes,
			lastRoute.fullPath,
			accumulatedSearch,
			params
		];
		this.lightweightCache.set(location, [lastStateMatchId, result]);
		return result;
	}
};
var SearchParamError = class extends Error {};
var PathParamError = class extends Error {};
function validateSearch(validateSearch$1, input) {
	if (validateSearch$1 == null) return {};
	if ("~standard" in validateSearch$1) {
		const result = validateSearch$1["~standard"].validate(input);
		if (result instanceof Promise) throw new SearchParamError("Async validation not supported");
		if (result.issues) throw new SearchParamError(JSON.stringify(result.issues, void 0, 2), { cause: result });
		return result.value;
	}
	if ("parse" in validateSearch$1) return validateSearch$1.parse(input);
	if (typeof validateSearch$1 === "function") return validateSearch$1(input);
	return {};
}
function applySearchMiddleware(search, dest, destRoutes, includeValidateSearch) {
	const middlewares = [];
	for (const route of destRoutes) {
		const routeOptions = route.options;
		if ("search" in routeOptions) {
			if (routeOptions.search?.middlewares) middlewares.push(...routeOptions.search.middlewares);
		} else if (routeOptions.preSearchFilters || routeOptions.postSearchFilters) {
			const legacyMiddleware = ({ search: search$1, next }) => {
				const result = next(routeOptions.preSearchFilters ? routeOptions.preSearchFilters.reduce((prev, next$1) => next$1(prev), search$1) : search$1);
				return routeOptions.postSearchFilters ? routeOptions.postSearchFilters.reduce((prev, next$1) => next$1(prev), result) : result;
			};
			middlewares.push(legacyMiddleware);
		}
		const routeValidateSearch = routeOptions.validateSearch;
		if (includeValidateSearch && routeValidateSearch) {
			const validate = ({ search: search$1, next, meta }) => {
				const result = next(search$1);
				try {
					const validated = validateSearch(routeValidateSearch, result);
					if (meta && validated) {
						for (const key in validated) if (!(key in result)) (meta.defaulted ||= /* @__PURE__ */ new Map()).set(key, validated[key]);
					}
					return {
						...result,
						...validated
					};
				} catch {}
				return result;
			};
			middlewares.push(validate);
		}
	}
	const applyNext = (index, currentSearch, meta) => {
		if (index >= middlewares.length) {
			if (!dest.search) return {};
			if (dest.search === true) return currentSearch;
			const result = functionalUpdate(dest.search, currentSearch);
			if (meta) meta.explicit = result;
			return result;
		}
		const next = (newSearch, collectMeta) => {
			if (collectMeta) {
				const nextMeta = meta || {};
				return {
					search: applyNext(index + 1, newSearch, nextMeta),
					meta: nextMeta
				};
			}
			return applyNext(index + 1, newSearch, meta);
		};
		return middlewares[index]({
			search: currentSearch,
			next,
			meta
		});
	};
	return applyNext(0, search);
}
function findGlobalNotFoundRouteId(notFoundMode, routes) {
	if (notFoundMode !== "root") {
		let fallback;
		for (let i = routes.length - 1; i >= 0; i--) {
			const route = routes[i];
			if (route.options.notFoundComponent) return route.id;
			fallback ||= route.children && route.id;
		}
		if (fallback) return fallback;
	}
	return rootRouteId;
}
function resolveNextParams(spec, base) {
	if (spec === false || spec === null) return Object.create(null);
	if ((spec ?? true) === true) return base;
	const next = Object.assign(Object.create(null), base);
	return Object.assign(next, functionalUpdate(spec, next));
}
function extractStrictParams(route, accumulatedParams) {
	const parseParams = route.options.params?.parse ?? route.options.parseParams;
	if (parseParams) Object.assign(accumulatedParams, parseParams(accumulatedParams));
}
function preloadComponent(route, type) {
	return route.options[type]?.preload?.();
}
function loadComponents(route, onPendingReady) {
	const component = preloadComponent(route, "component");
	let pending = preloadComponent(route, "pendingComponent");
	if (onPendingReady) if (pending) pending = pending.then(onPendingReady);
	else onPendingReady();
	if (component && pending) return Promise.all([component, pending]).then(() => {});
	return component ?? pending;
}
function loadRouteChunk(route, componentType, onPendingReady) {
	const afterLazy = () => componentType === false ? void 0 : componentType ? preloadComponent(route, componentType) : loadComponents(route, onPendingReady);
	const current = route._lazy;
	if (current) return current === true ? afterLazy() : current.then(afterLazy);
	if (!route.lazyFn) return afterLazy();
	const promise = route.lazyFn().then((lazyRoute) => {
		{
			const { id: _id, ...options } = lazyRoute.options;
			Object.assign(route.options, options);
			route._lazy = true;
		}
	}, (error) => {
		route._lazy = void 0;
		throw error;
	});
	route._lazy = promise;
	return promise.then(afterLazy);
}
function _getRenderedMatches(matches) {
	const end = matches.findIndex((match) => match.status !== "success" || match._notFound) + 1;
	return end && end < matches.length ? matches.slice(0, end) : matches;
}
function _getAssetMatches(matches) {
	let end = matches.length;
	for (let index = 0; index < end; index++) {
		const match = matches[index];
		if (match._assetEnd !== void 0) {
			end = Math.min(end, Math.max(index + 1, match._assetEnd));
			continue;
		}
		if (match.status !== "success" || match._notFound) {
			end = index + 1;
			break;
		}
	}
	return end < matches.length ? matches.slice(0, end) : matches;
}
var SUCCESS$1 = 0;
var ERROR$1 = 1;
var NOT_FOUND$1 = 2;
var REDIRECTED$1 = 3;
var CANCELED_OUTCOME = [4];
function isControl(result) {
	return typeof result[0] === "number";
}
function waitFor$1(value, signal) {
	if (signal.aborted) return Promise.race([Promise.reject(signal), value]);
	return new Promise((resolve, reject) => {
		const abort$2 = () => reject(signal);
		signal.addEventListener("abort", abort$2, { once: true });
		Promise.resolve(value).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort$2));
	});
}
function getRoute$1(router, match) {
	return router.routesById[match.routeId];
}
function normalize$1(value, rejected, routeId) {
	if (isRedirect(value)) return [REDIRECTED$1, value];
	if (isNotFound(value)) {
		value.routeId ||= routeId;
		return [NOT_FOUND$1, value];
	}
	if (!rejected) return [SUCCESS$1, value];
	if (typeof value?.then === "function") value = new Error("A Promise was thrown", { cause: value });
	return [ERROR$1, value];
}
function normalizeError$1(route, cause) {
	let outcome = normalize$1(cause, true, route.id);
	if (outcome[0] !== ERROR$1) return outcome;
	try {
		route.options.onError?.(outcome[1]);
	} catch (onErrorCause) {
		outcome = normalize$1(onErrorCause, true, route.id);
	}
	return outcome;
}
function normalizeLaneError(router, lane, route, cause, options) {
	if (options[0].signal.aborted) return CANCELED_OUTCOME;
	return materializeRedirect$1(router, lane, route, normalizeError$1(route, cause), options);
}
async function contextualize$1(router, lane, options, end, planSuccessfulLane, retainedEnd) {
	const [location, matches] = lane;
	const signal = options[0].signal;
	const preload$2 = !!options[3];
	for (let index = options[6] ?? 0; index < end; index++) {
		const match = matches[index];
		const route = getRoute$1(router, match);
		match.abortController = options[0];
		const parentContext = matches[index - 1]?.context ?? router.options.context ?? {};
		const common = {
			params: match.params,
			location,
			navigate: (opts) => router.navigate({
				...opts,
				_fromLocation: location
			}),
			buildLocation: router.buildLocation,
			cause: preload$2 ? "preload" : match.cause,
			abortController: options[0],
			preload: preload$2,
			matches,
			routeId: route.id
		};
		try {
			const routeContext = match._ctx ||= route.options.context ? route.options.context({
				...common,
				deps: match.loaderDeps,
				context: parentContext
			}) || {} : void 0;
			match.context = {
				...parentContext,
				...routeContext
			};
		} catch (cause) {
			releaseFlight(router, match);
			return [index, normalizeLaneError(router, lane, route, cause, options)];
		}
		if (signal.aborted) return [index, CANCELED_OUTCOME];
		const validationError = match.paramsError ?? match.searchError;
		if (validationError !== void 0) {
			releaseFlight(router, match);
			return [index, normalizeLaneError(router, lane, route, validationError, options)];
		}
		const beforeLoad = route.options.beforeLoad;
		if (!beforeLoad) continue;
		const previousStatus = match.status;
		if (index >= retainedEnd) {
			match.status = "pending";
			options[7]?.();
		}
		try {
			setFetching(router, match, "beforeLoad", options[0]);
			const result = await waitFor$1(beforeLoad({
				...common,
				search: match.search,
				context: match.context,
				...router.options.additionalContext
			}), signal);
			if (signal.aborted) return [index, CANCELED_OUTCOME];
			const outcome = materializeRedirect$1(router, lane, route, normalize$1(result, false, route.id), options);
			if (outcome[0] !== SUCCESS$1) {
				releaseFlight(router, match);
				return [index, outcome];
			}
			match.context = {
				...match.context,
				...result
			};
		} catch (cause) {
			releaseFlight(router, match);
			return [index, normalizeLaneError(router, lane, route, cause, options)];
		} finally {
			match.status = previousStatus;
			setFetching(router, match, false, options[0]);
		}
	}
	planSuccessfulLane();
}
function releaseOwnedFlight(router, match, flight) {
	if (!flight || --flight[2]) return;
	if (router._flights?.get(match.id) === flight) {
		const current = router._tx;
		if (current && !current[0].signal.aborted && !current[3].includes(match) && current[3].some((candidate) => candidate.id === match.id) && current[3].some((candidate) => candidate.isFetching === "beforeLoad")) return;
		router._flights.delete(match.id);
	}
	return flight[1];
}
function releaseFlight(router, match) {
	const flight = match._flight;
	match._flight = void 0;
	releaseOwnedFlight(router, match, flight)?.abort();
}
function transferMatchResources(router, previous, next, deferSameIdFlight) {
	const abort$2 = [];
	for (const match of previous) if (!next?.includes(match)) {
		const flight = match._flight;
		match._flight = void 0;
		if (deferSameIdFlight && flight?.[2] === 1 && router._flights?.get(match.id) === flight && next?.some((candidate) => candidate.id === match.id)) flight[2] = 0;
		else {
			const controller = releaseOwnedFlight(router, match, flight);
			if (controller) abort$2.push(controller);
		}
	}
	for (const controller of abort$2) controller.abort();
}
function acquireMatchResources(matches) {
	for (const match of matches) {
		const flight = match._flight;
		if (flight) flight[2]++;
	}
}
function setFetching(router, match, value, owner) {
	match.isFetching = value;
	if (owner && router._tx?.[0] !== owner) return;
	const store = router.stores.byRoute.get(match.routeId);
	const presented = store?.get();
	if (presented?.id === match.id) store.set({
		...presented,
		isFetching: value
	});
}
function getLoaderContext$1(router, lane, match, route, controller, parentMatchPromise, preload$2) {
	const location = lane[0];
	return {
		params: match.params,
		location,
		navigate: (opts) => router.navigate({
			...opts,
			_fromLocation: location
		}),
		cause: preload$2 ? "preload" : match.cause,
		abortController: controller,
		preload: preload$2,
		deps: match.loaderDeps,
		parentMatchPromise,
		context: match.context,
		route,
		...router.options.additionalContext
	};
}
async function loadResource(router, lane, match, route, loader, parentMatchPromise, options) {
	const owner = options[0];
	const signal = owner.signal;
	if (signal.aborted) return CANCELED_OUTCOME;
	if (!loader) return [SUCCESS$1, void 0];
	let flight = match._flight;
	setFetching(router, match, "loader", owner);
	try {
		if (!flight) {
			const controller = new AbortController();
			flight = [
				Promise.resolve().then(() => loader(getLoaderContext$1(router, lane, match, route, controller, parentMatchPromise, !!options[3]))).then((value) => normalize$1(value, false, route.id), (cause) => normalize$1(cause, true, route.id)).then((result) => {
					if (result[0] !== SUCCESS$1 && router._flights?.get(match.id) === flight) {
						router._flights.delete(match.id);
						if (!flight[2]) controller.abort();
					}
					return result[0] === ERROR$1 && flight[2] ? normalizeError$1(route, result[1]) : result;
				}),
				controller,
				1
			];
			(router._flights ??= /* @__PURE__ */ new Map()).set(match.id, flight);
		}
		match._flight = flight;
		match.abortController = flight[1];
		return materializeRedirect$1(router, lane, route, await waitFor$1(flight[0], signal), options);
	} catch (cause) {
		if (cause !== signal || !signal.aborted) throw cause;
		releaseFlight(router, match);
		return CANCELED_OUTCOME;
	} finally {
		setFetching(router, match, false, owner);
	}
}
function settleInto(match, result, preload$2) {
	if (result[0] === REDIRECTED$1) return;
	match.status = "success";
	match.error = void 0;
	if (result[0] === SUCCESS$1) {
		match.loaderData = result[1];
		match.invalid = false;
		match.updatedAt = Date.now();
		match.preload = preload$2;
	} else match.invalid = true;
}
function cacheLoaderMatch(router, match, planned) {
	const current = router._cache.get(match.id);
	if (current !== planned || router._committed.some((candidate) => candidate.id === match.id && candidate._flight === match._flight)) return;
	const cached = {
		...match,
		_notFound: void 0,
		context: {}
	};
	if (cached._flight) cached._flight[2]++;
	router._cache.set(match.id, cached);
	if (current) releaseFlight(router, current);
}
function getParentSnapshot(match, outcome) {
	if (outcome[0] === ERROR$1 || outcome[0] === NOT_FOUND$1) return {
		...match,
		status: outcome[0] === ERROR$1 ? "error" : "notFound",
		error: outcome[1],
		_flight: void 0
	};
	return match;
}
function createLoaderTask$1(router, lane, index, tasks, semanticParent, options, retainedEnd) {
	const match = lane[1][index];
	const route = getRoute$1(router, match);
	const preload$2 = !!options[3];
	const plannedCacheMatch = router._cache.get(match.id);
	let configured;
	let reload = false;
	let reloadFailure;
	try {
		if (match.status === "success") {
			configured = route.options.shouldReload;
			if (typeof configured === "function") configured = configured(getLoaderContext$1(router, lane, match, route, options[0], semanticParent, preload$2));
			if (options[0].signal.aborted) reloadFailure = CANCELED_OUTCOME;
		}
		if (!reloadFailure) if (match.status !== "success") reload = true;
		else {
			const staleAge = preload$2 || match.preload ? route.options.preloadStaleTime ?? router.options.defaultPreloadStaleTime ?? 3e4 : route.options.staleTime ?? router.options.defaultStaleTime ?? 0;
			reload = !!(match.invalid || configured || configured === void 0 && Date.now() - match.updatedAt >= staleAge && (options[5] || match.cause === "enter" || options[2].some((candidate$1) => candidate$1.routeId === match.routeId && candidate$1.id !== match.id)));
		}
	} catch (cause) {
		match.invalid = true;
		releaseFlight(router, match);
		reloadFailure = normalizeLaneError(router, lane, route, cause, options);
	}
	const routeLoader = route.options.loader;
	const isLoaderFn = typeof routeLoader === "function";
	const loader = isLoaderFn ? routeLoader : routeLoader?.handler;
	const preloadable = !preload$2 || route.options.preload !== false;
	let donor = preloadable && routeLoader && true ? router._flights?.get(match.id) : void 0;
	if (donor === match._flight || reloadFailure) donor = void 0;
	else if (donor && !reload && !preload$2 && configured === void 0) reload = true;
	else if (!reload) donor = void 0;
	const background = !!(routeLoader && reload && match.status === "success" && !preload$2 && !options[4] && ((isLoaderFn ? void 0 : routeLoader.staleReloadMode) ?? router.options.defaultStaleReloadMode) !== "blocking");
	const loaded = reload && preloadable;
	const blocking = loaded && !background && (match.status !== "success" || !!routeLoader);
	const onReady = index >= retainedEnd ? options[7] : void 0;
	const onLazyReady = route.lazyFn && route._lazy !== true ? onReady : void 0;
	if (loaded && !routeLoader) {
		match.invalid = false;
		match.updatedAt = Date.now();
	}
	if (donor) donor[2]++;
	if (blocking) {
		const acceptedFlight = match._flight;
		match._flight = donor;
		releaseOwnedFlight(router, match, acceptedFlight)?.abort();
		if (index >= retainedEnd) match.status = "pending";
		onReady?.();
	}
	if (!loaded) match.isFetching = false;
	const outcome = (reloadFailure ? Promise.resolve(reloadFailure) : !blocking ? Promise.resolve([SUCCESS$1, match.loaderData]) : loadResource(router, lane, match, route, loader, semanticParent, options)).then((result) => {
		if (blocking) {
			settleInto(match, result, preload$2);
			if (result[0] === SUCCESS$1) {
				if (routeLoader && !options[0].signal.aborted) cacheLoaderMatch(router, match, plannedCacheMatch);
				if (index >= retainedEnd) match.status = "pending";
			}
		}
		return result;
	});
	const chunkFailure = waitFor$1(Promise.resolve().then(() => loadRouteChunk(route, void 0, onLazyReady)), options[0].signal).then(() => void 0, (cause) => lane[1].some((candidate$1, candidateIndex) => candidateIndex <= index && (candidate$1.status === "error" || candidate$1.status === "notFound" || candidate$1._notFound)) ? void 0 : [index, normalizeLaneError(router, lane, route, cause, options)]).then((failure) => outcome.then((result) => {
		if (blocking && !failure && result[0] === SUCCESS$1 && match.status === "pending" && !options[0].signal.aborted) {
			match.status = "success";
			onReady?.();
		}
		return failure;
	}));
	tasks.push([
		index,
		outcome,
		chunkFailure
	]);
	if (!background) return outcome.then((result) => getParentSnapshot(match, result));
	const candidate = {
		...match,
		status: "pending",
		preload: false,
		_flight: donor
	};
	match.invalid = false;
	match.isFetching = "loader";
	const backgroundOutcome = loadResource(router, lane, candidate, route, loader, semanticParent, options).then((result) => {
		match.isFetching = false;
		settleInto(candidate, result, false);
		return result;
	});
	(lane[2] ??= []).push([
		index,
		backgroundOutcome,
		chunkFailure,
		candidate
	]);
	return backgroundOutcome.then((result) => getParentSnapshot(candidate, result));
}
async function getNotFoundBoundary$1(router, matches, indexed, signal, fallback = 0) {
	const cause = indexed?.[1][1];
	let index = cause?.routeId ? matches.findIndex((match) => match.routeId === cause.routeId) : indexed?.[0] ?? matches.length - 1;
	if (index < 0) index = 0;
	for (let i = index; i >= 0; i--) {
		const route = getRoute$1(router, matches[i]);
		try {
			const loading = loadRouteChunk(route, false);
			if (loading) await waitFor$1(loading, signal);
		} catch (cause$1) {
			if (cause$1 === signal && signal.aborted) throw cause$1;
		}
		if (route.options.notFoundComponent) return i;
	}
	return cause?.routeId ? index : fallback;
}
function discardBackground(router, lane) {
	if (lane[2]) {
		transferMatchResources(router, lane[2].map((task) => task[3]));
		lane[2] = void 0;
	}
}
async function settleTasks(tasks, serialFailure, redirectTasks, gate) {
	let loaderFailure;
	try {
		await Promise.all(tasks.map((task) => task[1].then(async (outcome) => {
			const taskIndex = task[0];
			if (gate && taskIndex >= await gate) return;
			if (outcome[0] >= REDIRECTED$1) throw [taskIndex, outcome];
			if (!loaderFailure && outcome[0] !== SUCCESS$1) {
				loaderFailure = [taskIndex, outcome];
				await Promise.all((redirectTasks ?? []).map((nextTask) => {
					if (nextTask[0] <= taskIndex) return;
					return nextTask[1].then((nextOutcome) => {
						if (nextOutcome[0] === REDIRECTED$1) throw [nextTask[0], nextOutcome];
					});
				}));
			}
		})));
	} catch (cause) {
		return cause;
	}
	return serialFailure ?? loaderFailure;
}
function materializeRedirect$1(router, lane, route, outcome, options, failed) {
	while (outcome[0] === REDIRECTED$1) {
		const redirect$1 = outcome[1];
		const redirectOptions = redirect$1.options;
		if (redirectOptions.reloadDocument ? options[3] : options[1] >= 20) return outcome;
		try {
			if (redirectOptions.href && redirectOptions.reloadDocument) {
				router.resolveRedirect(redirect$1);
				return outcome;
			}
			return [
				REDIRECTED$1,
				redirect$1,
				router.buildLocation({
					...redirectOptions,
					_fromLocation: lane[0],
					_includeValidateSearch: true
				})
			];
		} catch (cause) {
			outcome = failed ? [ERROR$1, cause] : normalizeError$1(route, cause);
			failed = true;
		}
	}
	return outcome;
}
async function reduceLane(router, lane, tasks, controller, settlement, onReady) {
	const matches = lane[1];
	let failure = await settlement;
	let redirectLimitExceeded = false;
	const plannedBoundary = matches.findIndex((match) => match._notFound);
	const boundaryOf = (found) => found[1][0] === NOT_FOUND$1 ? getNotFoundBoundary$1(router, matches, found, controller.signal) : found[0];
	let readinessEnd = plannedBoundary < 0 ? matches.length : plannedBoundary;
	if ((failure?.[1][0] ?? 0) >= REDIRECTED$1) readinessEnd = 0;
	else if (failure) {
		readinessEnd = failure[2] ??= await boundaryOf(failure);
		for (const task of tasks) {
			if (task[0] >= readinessEnd) break;
			const outcome = await task[1];
			if (outcome[0] !== SUCCESS$1 && outcome[0] < REDIRECTED$1 && !("loaderData" in matches[task[0]])) {
				failure = [task[0], outcome];
				readinessEnd = failure[2] = await boundaryOf(failure);
				break;
			}
		}
	}
	for (const task of tasks) {
		if (task[0] >= readinessEnd) break;
		const chunkFailure = await task[2];
		if (!chunkFailure) continue;
		failure = chunkFailure;
		break;
	}
	if ((failure?.[1][0] ?? 0) >= REDIRECTED$1) {
		const outcome = failure[1];
		if (outcome[0] !== REDIRECTED$1 || outcome[1].options.reloadDocument || outcome[2]) {
			discardBackground(router, lane);
			return outcome;
		}
		redirectLimitExceeded = true;
		failure = [0, [ERROR$1, /* @__PURE__ */ new Error("Too many redirects")]];
	}
	const boundary = failure ? failure[2] ?? await boundaryOf(failure) : plannedBoundary;
	if (boundary >= 0) {
		const outcome = failure?.[1];
		const kind = outcome?.[0];
		const match = matches[boundary];
		const cause = outcome?.[1];
		const install = () => {
			if (outcome) {
				match._notFound = void 0;
				if (kind === ERROR$1) match.status = "error";
				else {
					cause.routeId = match.routeId;
					if (match.routeId === router.routeTree.id) {
						match.status = "success";
						match._notFound = true;
					} else match.status = "notFound";
				}
				match.error = cause;
				match.isFetching = false;
			}
		};
		install();
		if (!outcome) onReady?.();
		const route = getRoute$1(router, match);
		try {
			await waitFor$1(outcome ? Promise.resolve().then(() => loadRouteChunk(route, kind === ERROR$1 ? "errorComponent" : "notFoundComponent")) : Promise.all([loadRouteChunk(route), loadRouteChunk(route, "notFoundComponent")]), controller.signal);
		} catch (cause$1) {
			if (cause$1 === controller.signal && controller.signal.aborted) {
				discardBackground(router, lane);
				return CANCELED_OUTCOME;
			}
		}
		if (!outcome) match.status = "success";
		else if (redirectLimitExceeded) {
			controller.abort();
			await Promise.all([
				...tasks.map((task) => task[1]),
				...tasks.map((task) => task[2]),
				...(lane[2] ?? []).map((task) => task[1])
			]);
			discardBackground(router, lane);
			transferMatchResources(router, matches);
			install();
		}
	}
	return lane;
}
async function projectLane$1(router, lane, signal, start = 0, end = lane[1].length) {
	const matches = lane[1];
	for (let index = start; index < end; index++) {
		const match = matches[index];
		const routeOptions = getRoute$1(router, match).options;
		if (routeOptions.head || routeOptions.scripts) try {
			const context = {
				ssr: router.options.ssr,
				matches,
				match,
				params: match.params,
				loaderData: match.loaderData
			};
			const [head, scripts] = await waitFor$1(Promise.all([routeOptions.head?.(context), routeOptions.scripts?.(context)]), signal);
			match.meta = head?.meta;
			match.links = head?.links;
			match.headScripts = head?.scripts;
			match.styles = head?.styles;
			match.scripts = scripts;
		} catch (cause) {
			if (cause === signal && signal.aborted) break;
			console.error(cause);
		}
		if (match.status !== "success" || match._notFound) break;
	}
	return lane;
}
async function executeClientLane(router, location, matches, options) {
	const matched = [location, matches];
	const signal = options[0].signal;
	let reduced;
	try {
		const presented = router.stores.matches.get();
		let plannedBoundary = matches.findIndex((match) => match._notFound);
		if (router.options.notFoundMode !== "root" && plannedBoundary >= 0) {
			const boundary = await getNotFoundBoundary$1(router, matches, void 0, signal, plannedBoundary);
			matches[plannedBoundary]._notFound = void 0;
			matches[boundary]._notFound = true;
			plannedBoundary = boundary;
		}
		let end = plannedBoundary < 0 ? matches.length : plannedBoundary + 1;
		let retainedEnd = 0;
		while (retainedEnd < end && retainedEnd !== plannedBoundary) {
			const match = matches[retainedEnd];
			const committed = options[2][retainedEnd];
			const visible = presented[retainedEnd];
			if (committed?.id !== match.id || committed.status !== "success" || committed._notFound || match.preload || visible?.id !== match.id || visible.status !== "success" || visible._notFound) break;
			retainedEnd++;
		}
		const tasks = [];
		const start = options[6] ?? 0;
		let semanticParent = start ? Promise.resolve(matches[start - 1]) : void 0;
		const planSuccessfulLane = () => {
			for (let index = start; index < end; index++) {
				if (signal.aborted) break;
				semanticParent = createLoaderTask$1(router, matched, index, tasks, semanticParent, options, retainedEnd);
			}
		};
		const failure = await contextualize$1(router, matched, options, end, planSuccessfulLane, retainedEnd);
		if (failure) {
			options[4] = true;
			end = failure[0];
			if (failure[1][0] === NOT_FOUND$1) {
				const boundary = await getNotFoundBoundary$1(router, matches, failure, signal);
				failure[2] = boundary;
				end = Math.min(end, boundary + 1);
			} else if (failure[1][0] >= REDIRECTED$1) end = 0;
			planSuccessfulLane();
		}
		if (!signal.aborted && !options[3]) {
			const abort$2 = [];
			for (const [id, flight] of router._flights ?? []) if (!flight[2]) {
				router._flights.delete(id);
				abort$2.push(flight[1]);
			}
			for (const controller of abort$2) controller.abort();
		}
		const reduction = reduceLane(router, matched, tasks, options[0], settleTasks(tasks, failure, matched[2]), options[7]);
		if (matched[2]?.length) matched[3] = settleTasks(matched[2], void 0, void 0, reduction.then((foreground) => isControl(foreground) ? 0 : _getRenderedMatches(matches).length, () => 0));
		reduced = await reduction;
	} catch (cause) {
		discardBackground(router, matched);
		if (cause === signal && signal.aborted) return CANCELED_OUTCOME;
		throw cause;
	}
	if (isControl(reduced)) return reduced;
	return projectLane$1(router, reduced, signal, options[6] === matches.length ? options[6] : 0);
}
function offerPending(router, tx) {
	if (router._tx !== tx) return;
	const matches = tx[3];
	const presented = router.stores.matches.get();
	let session = router._pending;
	for (let index = 0; index < matches.length; index++) {
		const match = matches[index];
		const success = match.status === "success" && !match._notFound;
		const presentedPending = presented[index]?.id === match.id && presented[index]?.status === "pending";
		if (success && !presentedPending) continue;
		const route = getRoute$1(router, match);
		const delay = success || match.invalid ? 0 : route.options.pendingMs ?? router.options.defaultPendingMs;
		const component = route.options.pendingComponent ?? router.options.defaultPendingComponent;
		if (!component || typeof delay !== "number" || delay === Infinity) {
			if (session) {
				session[0] = tx;
				session[2] = 0;
				session[4] = true;
			}
			return;
		}
		const min = route.options.pendingMinMs ?? router.options.defaultPendingMinMs ?? 0;
		let tookOver = false;
		if (session?.[1] === match.id) {
			tookOver = session[0] !== tx;
			session[0] = tx;
		} else {
			clearTimeout(session?.[3]);
			router._pending = session = void 0;
		}
		if (!session) router._pending = session = [
			tx,
			match.id,
			presentedPending ? Date.now() + min : tx[4] + delay,
			void 0,
			presentedPending || void 0,
			component
		];
		if (session[4] && !tookOver && session[5] === component) return;
		session[5] = component;
		if (!session[4]) {
			clearTimeout(session[3]);
			const remaining = session[2] - Date.now();
			if (remaining > 0) {
				session[3] = setTimeout(() => offerPending(router, tx), remaining);
				return;
			}
			session[2] = 0;
		}
		const offered = matches.map((match$1) => ({
			...match$1,
			_flight: void 0
		}));
		offered[index].status = "pending";
		const ack = session[4] = router.startTransition(() => router.stores.setMatches(offered), offered).then((rendered) => {
			if (rendered && router._pending === session && session[4] === ack && !session[2]) session[2] = Date.now() + min;
			return rendered;
		});
		return;
	}
}
async function preloadClientRoute(router, opts) {
	let location = router.buildLocation(opts);
	for (let redirects = 0;; redirects++) {
		const base = router._committed;
		const controller = new AbortController();
		let matches;
		let active;
		let result;
		try {
			try {
				matches = router.matchRoutes(location, { _controller: controller });
				acquireMatchResources(matches);
				active = (router._preloads ??= /* @__PURE__ */ new Map()).set(controller, matches);
				result = await executeClientLane(router, location, matches, [
					controller,
					redirects,
					base,
					true
				]);
			} finally {
				if (active) {
					active = active.delete(controller);
					transferMatchResources(router, matches);
				}
				controller.abort();
			}
			if (!isControl(result)) return result[1];
			if (!active || result.length < 3 || false) return;
			location = result[2];
		} catch (cause) {
			if (!isNotFound(cause)) console.error(cause);
			return;
		}
	}
}
function waitForReason(value, signal, onLate) {
	const promise = Promise.resolve(value);
	if (signal.aborted) {
		if (!onLate) return Promise.race([Promise.reject(signal.reason), promise]);
		promise.then(onLate, () => {});
		return Promise.reject(signal.reason);
	}
	return new Promise((resolve, reject) => {
		const abort$2 = () => reject(signal.reason);
		signal.addEventListener("abort", abort$2, { once: true });
		promise.then((result) => {
			if (signal.aborted) onLate?.(result);
			else resolve(result);
		}, reject).finally(() => signal.removeEventListener("abort", abort$2));
	});
}
var SUCCESS = 0;
var ERROR = 1;
var NOT_FOUND = 2;
var REDIRECTED = 3;
var SKIPPED = 4;
function getRoute(router, match) {
	return router.routesById[match.routeId];
}
function normalize(value, rejected) {
	if (isRedirect(value)) return [REDIRECTED, value];
	if (isNotFound(value)) return [NOT_FOUND, value];
	if (rejected && typeof value?.then === "function") value = new Error("A Promise was thrown", { cause: value });
	return rejected ? [ERROR, value] : [SUCCESS, value];
}
function normalizeError(router, lane, route, cause, signal, notify = true) {
	signal?.throwIfAborted();
	let outcome = normalize(cause, true);
	if (outcome[0] !== ERROR) return materializeRedirect(router, lane, route, outcome, signal, notify);
	try {
		route.options.onError?.(outcome[1]);
	} catch (onErrorCause) {
		outcome = normalize(onErrorCause, true);
	}
	signal?.throwIfAborted();
	return materializeRedirect(router, lane, route, outcome, signal, notify);
}
function materializeRedirect(router, lane, route, outcome, signal, notify = true) {
	if (outcome[0] !== REDIRECTED) return outcome;
	signal?.throwIfAborted();
	try {
		outcome[1].options._fromLocation = lane.location;
		router.resolveRedirect(outcome[1]);
		signal?.throwIfAborted();
		return outcome;
	} catch (cause) {
		signal?.throwIfAborted();
		return notify ? normalizeError(router, lane, route, cause, signal, false) : [ERROR, cause];
	}
}
function maybe(value, cause) {
	if (cause !== void 0) return {
		status: "error",
		error: cause
	};
	return {
		status: "success",
		value
	};
}
function navigateFrom(router, location) {
	return (options) => router.navigate({
		...options,
		_fromLocation: location
	});
}
function waitFor(value, signal) {
	return signal ? waitForReason(value, signal) : value;
}
async function resolveSsr(router, lane, index) {
	const match = lane.matches[index];
	const route = getRoute(router, match);
	const parentSsr = lane.matches[index - 1]?.ssr;
	if (router.isShell()) return route.id === rootRouteId;
	if (parentSsr === false) return false;
	const inherit = (value) => {
		return value === true && parentSsr === "data-only" ? "data-only" : value;
	};
	const defaultSsr = router.options.defaultSsr ?? true;
	const inheritedDefault = inherit(defaultSsr);
	match.ssr = inheritedDefault;
	const option = route.options.ssr;
	if (option === void 0) return inheritedDefault;
	if (typeof option !== "function") return inherit(option);
	return inherit(await option({
		search: maybe(match.search, match.searchError),
		params: maybe(match.params, match.paramsError),
		location: lane.location,
		matches: lane.matches.map((candidate) => ({
			index: candidate.index,
			pathname: candidate.pathname,
			fullPath: candidate.fullPath,
			staticData: candidate.staticData,
			id: candidate.id,
			routeId: candidate.routeId,
			search: maybe(candidate.search, candidate.searchError),
			params: maybe(candidate.params, candidate.paramsError),
			ssr: candidate.ssr
		}))
	}) ?? defaultSsr);
}
function stampNotFound(match, outcome) {
	if (outcome[0] === NOT_FOUND && !outcome[1].routeId) outcome[1].routeId = match.routeId;
	return outcome;
}
async function contextualize(router, lane, signal) {
	const globalBoundary = lane.matches.findIndex((match) => match._notFound);
	let end = globalBoundary < 0 ? lane.matches.length : globalBoundary + 1;
	let failure;
	let parentContext = { ...router.options.context ?? {} };
	for (let index = 0; index < end; index++) {
		const match = lane.matches[index];
		const route = getRoute(router, match);
		try {
			match.ssr = await resolveSsr(router, lane, index);
		} catch (cause) {
			signal?.throwIfAborted();
			failure = [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
			end = index;
		}
		signal?.throwIfAborted();
		if (failure?.[1][0] === REDIRECTED) break;
		match.__beforeLoadContext = void 0;
		let context = parentContext;
		try {
			let routeContext;
			if (route.options.context) {
				const routeContextOptions = {
					deps: match.loaderDeps,
					params: match.params,
					context: parentContext,
					location: lane.location,
					navigate: navigateFrom(router, lane.location),
					buildLocation: router.buildLocation,
					cause: match.cause,
					abortController: match.abortController,
					preload: false,
					matches: lane.matches,
					routeId: route.id
				};
				routeContext = route.options.context(routeContextOptions) ?? void 0;
			}
			context = {
				...parentContext,
				...routeContext
			};
			match.context = context;
		} catch (cause) {
			signal?.throwIfAborted();
			if (!failure) failure = [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
			end = index;
			break;
		}
		signal?.throwIfAborted();
		if (failure) break;
		const validationError = match.paramsError ?? match.searchError;
		if (validationError !== void 0) {
			failure = [index, stampNotFound(match, normalizeError(router, lane, route, validationError, signal))];
			end = index;
			break;
		}
		signal?.throwIfAborted();
		if (match.ssr === false || !route.options.beforeLoad) {
			parentContext = context;
			continue;
		}
		const abortController = match.abortController;
		const options = {
			search: match.search,
			abortController,
			params: match.params,
			preload: false,
			context,
			location: lane.location,
			navigate: navigateFrom(router, lane.location),
			buildLocation: router.buildLocation,
			cause: match.cause,
			matches: lane.matches,
			routeId: route.id,
			...router.options.additionalContext
		};
		try {
			const beforeLoadContext = await route.options.beforeLoad(options);
			signal?.throwIfAborted();
			const outcome = stampNotFound(match, materializeRedirect(router, lane, route, normalize(beforeLoadContext, false), signal));
			if (outcome[0] !== SUCCESS) {
				failure = [index, outcome];
				end = index;
				break;
			}
			match.__beforeLoadContext = beforeLoadContext;
			match.context = {
				...context,
				...beforeLoadContext
			};
			parentContext = match.context;
		} catch (cause) {
			signal?.throwIfAborted();
			failure = [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
			end = index;
			break;
		}
	}
	return {
		location: lane.location,
		matches: lane.matches,
		end,
		failure
	};
}
function getLoaderContext(router, lane, match, route, index, tasks) {
	return {
		params: match.params,
		deps: match.loaderDeps,
		preload: false,
		parentMatchPromise: tasks[index - 1]?.match,
		abortController: match.abortController,
		context: match.context,
		location: lane.location,
		navigate: navigateFrom(router, lane.location),
		cause: match.cause,
		route,
		...router.options.additionalContext
	};
}
function createLoaderTask(router, lane, index, tasks, signal) {
	const match = lane.matches[index];
	const route = getRoute(router, match);
	let outcome;
	if (match.ssr === false) outcome = Promise.resolve([SKIPPED]);
	else {
		const routeLoader = route.options.loader;
		const loader = typeof routeLoader === "function" ? routeLoader : routeLoader?.handler;
		if (!loader) outcome = Promise.resolve([SUCCESS, void 0]);
		else outcome = Promise.resolve().then(() => loader(getLoaderContext(router, lane, match, route, index, tasks))).then((result) => normalize(result, false), (cause) => normalize(cause, true)).then((result) => {
			if (signal?.aborted || match.abortController.signal.reason === lane) return [SKIPPED];
			if (result[0] === ERROR) result = normalizeError(router, lane, route, result[1], signal);
			else result = materializeRedirect(router, lane, route, result, signal);
			return stampNotFound(match, result);
		});
	}
	const parentMatch = outcome.then((result) => {
		const snapshot = { ...match };
		if (result[0] === SUCCESS) {
			snapshot.loaderData = result[1];
			snapshot.status = "success";
			snapshot.error = void 0;
			snapshot.invalid = false;
			snapshot.isFetching = false;
		} else if (result[0] === ERROR) {
			snapshot.status = "error";
			snapshot.error = result[1];
		} else if (result[0] === NOT_FOUND) {
			snapshot.status = "notFound";
			snapshot.error = result[1];
		}
		return snapshot;
	});
	return {
		index,
		outcome,
		match: parentMatch
	};
}
async function getNotFoundBoundary(router, matches, indexed, signal, fallback = 0) {
	const cause = indexed?.[1][1];
	let index = cause?.routeId ? matches.findIndex((match) => match.routeId === cause.routeId) : indexed?.[0] ?? matches.length - 1;
	if (index < 0) index = 0;
	for (let candidate = index; candidate >= 0; candidate--) {
		const route = getRoute(router, matches[candidate]);
		try {
			const loading = loadRouteChunk(route, false);
			if (loading) await loading;
		} catch {
			signal?.throwIfAborted();
		}
		signal?.throwIfAborted();
		if (route.options.notFoundComponent) return candidate;
	}
	return cause?.routeId ? index : fallback;
}
function abortMatches(matches, start = 0, reason) {
	for (let index = start; index < matches.length; index++) matches[index].abortController.abort(reason);
}
async function applyFailure(router, lane, indexed, signal) {
	if (!indexed) {
		const boundary$1 = lane.matches.findIndex((match$1) => match$1._notFound);
		if (boundary$1 >= 0) {
			abortMatches(lane.matches, boundary$1 + 1);
			return {
				status: 404,
				boundary: boundary$1,
				kind: NOT_FOUND
			};
		}
		return { status: 200 };
	}
	const [index, outcome] = indexed;
	if (outcome[0] === ERROR) {
		const match$1 = lane.matches[index];
		match$1._notFound = void 0;
		match$1.status = "error";
		match$1.error = outcome[1];
		match$1.isFetching = false;
		abortMatches(lane.matches, index + 1);
		return {
			status: 500,
			boundary: index,
			kind: ERROR
		};
	}
	const boundary = indexed[2] ?? await getNotFoundBoundary(router, lane.matches, indexed, signal);
	const match = lane.matches[boundary];
	const cause = outcome[1];
	cause.routeId = match.routeId;
	match._notFound = void 0;
	if (match.routeId === router.routeTree.id) {
		match.status = "success";
		match._notFound = true;
		match.error = cause;
	} else {
		match.status = "notFound";
		match.error = cause;
	}
	match.isFetching = false;
	abortMatches(lane.matches, boundary + 1);
	return {
		status: 404,
		boundary,
		kind: NOT_FOUND
	};
}
async function loadNormalChunks(router, lane, end, signal) {
	const chunks = [];
	for (let index = 0; index < lane.matches.length; index++) {
		const match = lane.matches[index];
		if (index >= end || match.ssr !== true || match.status !== "success") continue;
		const route = getRoute(router, match);
		try {
			const loading = loadRouteChunk(route);
			if (loading) {
				const chunk = loading.then(() => {
					signal?.throwIfAborted();
				}, (cause) => {
					signal?.throwIfAborted();
					return [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
				});
				chunk.catch(() => {});
				chunks.push(chunk);
			}
		} catch (cause) {
			signal?.throwIfAborted();
			chunks.push([index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))]);
		}
	}
	for (const chunk of chunks) {
		const indexed = Array.isArray(chunk) ? chunk : await chunk;
		if (indexed) return indexed;
	}
}
async function projectLane(router, lane, signal) {
	for (const match of lane.matches) {
		const routeOptions = getRoute(router, match).options;
		if (routeOptions.head || routeOptions.scripts || routeOptions.headers) {
			const context = {
				ssr: router.options.ssr,
				matches: lane.matches,
				match,
				params: match.params,
				loaderData: match.loaderData
			};
			try {
				const [head, scripts, headers] = await Promise.all([
					routeOptions.head?.(context),
					routeOptions.scripts?.(context),
					routeOptions.headers?.(context)
				]);
				signal?.throwIfAborted();
				match.meta = head?.meta;
				match.links = head?.links;
				match.headScripts = head?.scripts;
				match.styles = head?.styles;
				match.scripts = scripts;
				match.headers = headers;
			} catch (cause) {
				signal?.throwIfAborted();
				console.error(cause);
			}
		}
		if (match.ssr === false || match.status !== "success" || match._notFound) break;
	}
}
async function executeServerLane(router, location, matchedMatches, signal) {
	const matched = {
		location,
		matches: matchedMatches.map((match) => ({
			...match,
			__beforeLoadContext: void 0,
			context: {},
			isFetching: false,
			abortController: new AbortController()
		}))
	};
	const abortLane = () => abortMatches(matched.matches, 0, signal?.reason);
	if (signal?.aborted) {
		abortLane();
		signal.throwIfAborted();
	}
	signal?.addEventListener("abort", abortLane, { once: true });
	try {
		const plannedGlobalBoundary = matched.matches.findIndex((match) => match._notFound);
		if (router.options.notFoundMode !== "root" && plannedGlobalBoundary >= 0) {
			const boundary = await getNotFoundBoundary(router, matched.matches, void 0, signal, plannedGlobalBoundary);
			if (boundary !== plannedGlobalBoundary) {
				matched.matches[plannedGlobalBoundary]._notFound = void 0;
				matched.matches[boundary]._notFound = true;
			}
		}
		const lane = await contextualize(router, matched, signal);
		signal?.throwIfAborted();
		let loaderEnd = lane.end;
		if (lane.failure?.[1][0] === REDIRECTED) loaderEnd = 0;
		else if (lane.failure?.[1][0] === NOT_FOUND) {
			lane.failure[2] = await getNotFoundBoundary(router, lane.matches, lane.failure, signal);
			loaderEnd = Math.min(loaderEnd, lane.failure[2] + 1);
		}
		const tasks = [];
		for (let index = 0; index < loaderEnd; index++) {
			const task = createLoaderTask(router, lane, index, tasks, signal);
			tasks.push(task);
		}
		let loaderFailure;
		let control = lane.failure?.[1][0] === REDIRECTED ? lane.failure : void 0;
		try {
			await Promise.all(tasks.map((task) => task.outcome.then((loadedOutcome) => {
				const match = lane.matches[task.index];
				const outcome = loadedOutcome;
				if (outcome[0] === SUCCESS) {
					match.loaderData = outcome[1];
					match.status = "success";
					match.error = void 0;
					match.invalid = false;
					match.isFetching = false;
					match.updatedAt = Date.now();
				} else if (outcome[0] === REDIRECTED) {
					control = [task.index, outcome];
					throw control;
				} else {
					if (match.ssr !== false) {
						match.status = "success";
						match.error = void 0;
						match.invalid = true;
						match.isFetching = false;
					}
					if (!loaderFailure && outcome[0] !== SKIPPED) loaderFailure = [task.index, outcome];
				}
			})));
		} catch (cause) {
			if (!Array.isArray(cause)) throw cause;
			control = cause;
		}
		signal?.throwIfAborted();
		if (control?.[1][0] === REDIRECTED) {
			abortMatches(lane.matches, 0, lane);
			return {
				type: "redirect",
				redirect: control[1][1]
			};
		}
		let failure = lane.failure ?? loaderFailure;
		const plannedBoundary = lane.matches.findIndex((match) => match._notFound);
		let readinessEnd;
		if (failure) {
			const outcomeEnd = failure[2] ??= failure[1][0] === NOT_FOUND ? await getNotFoundBoundary(router, lane.matches, failure, signal) : failure[0];
			for (const task of tasks) {
				if (task.index >= outcomeEnd) break;
				const outcome = await task.outcome;
				if (outcome[0] !== SUCCESS && outcome[0] < REDIRECTED && !("loaderData" in lane.matches[task.index])) {
					failure = [task.index, outcome];
					failure[2] = outcome[0] === NOT_FOUND ? await getNotFoundBoundary(router, lane.matches, failure, signal) : task.index;
					break;
				}
			}
			readinessEnd = failure[2];
		} else readinessEnd = plannedBoundary < 0 ? lane.matches.length : plannedBoundary;
		const requiredFailure = await loadNormalChunks(router, lane, readinessEnd, signal);
		signal?.throwIfAborted();
		if (requiredFailure) {
			if (requiredFailure[1][0] === REDIRECTED) {
				abortMatches(lane.matches);
				return {
					type: "redirect",
					redirect: requiredFailure[1][1]
				};
			}
			failure = requiredFailure;
		}
		const terminal = await applyFailure(router, lane, failure, signal);
		if (terminal.boundary !== void 0) {
			const match = lane.matches[terminal.boundary];
			if (match.ssr === true) {
				const route = getRoute(router, match);
				try {
					if (terminal.kind === ERROR) await loadRouteChunk(route, "errorComponent");
					else if (match._notFound) await Promise.all([loadRouteChunk(route), loadRouteChunk(route, "notFoundComponent")]);
					else await loadRouteChunk(route, "notFoundComponent");
				} catch {}
				signal?.throwIfAborted();
			}
		}
		signal?.throwIfAborted();
		await projectLane(router, {
			location: lane.location,
			matches: lane.matches
		}, signal);
		signal?.throwIfAborted();
		router.serverSsr?.onCleanup(abortLane);
		return {
			type: "render",
			status: terminal.status,
			matches: lane.matches
		};
	} finally {
		signal?.removeEventListener("abort", abortLane);
	}
}
async function loadServerRoute(router, opts) {
	router.updateLatestLocation();
	const next = router.latestLocation;
	const previous = router._committed;
	let result;
	try {
		const canonical = router.buildLocation({
			to: next.pathname,
			search: true,
			params: true,
			hash: true,
			state: true,
			_includeValidateSearch: true
		});
		if (next.publicHref !== canonical.publicHref) throw redirect({ href: canonical.publicHref || "/" });
		const changeInfo = getLocationChangeInfo(next, router.stores.resolvedLocation.get());
		router.emit({
			type: "onBeforeNavigate",
			...changeInfo
		});
		router.emit({
			type: "onBeforeLoad",
			...changeInfo
		});
		opts?._signal?.throwIfAborted();
		result = await waitFor(executeServerLane(router, next, router.matchRoutes(next), opts?._signal), opts?._signal);
		opts?._signal?.throwIfAborted();
	} catch (cause) {
		opts?._signal?.throwIfAborted();
		if (!isRedirect(cause)) throw cause;
		cause.options._fromLocation = next;
		result = {
			type: "redirect",
			redirect: router.resolveRedirect(cause)
		};
	}
	router._serverResult = result;
	router.batch(() => {
		router.stores.location.set(next);
		router.stores.status.set("idle");
		if (result.type === "render") {
			router.stores.setMatches(result.matches);
			router.stores.resolvedLocation.set(next);
		}
	});
	if (result.type === "render") {
		router._committed = result.matches;
		runRouteLifecycle(router, previous, result.matches);
	}
	router._commitPromise?.resolve();
	router._commitPromise = void 0;
}
var isServer = true;
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var reactUse = import_react.use;
var useLayoutEffect = import_react.useEffect;
function useIntersectionObserver(ref, callback, disabled) {
	import_react.useEffect(() => {
		if (!ref.current || disabled || typeof IntersectionObserver !== "function") return () => callback();
		const observer = new IntersectionObserver((entries) => {
			callback(entries.pop());
		}, { rootMargin: "100px" });
		observer.observe(ref.current);
		return () => {
			observer.disconnect();
			callback();
		};
	}, [
		callback,
		disabled,
		ref
	]);
}
function useForwardedRef(ref) {
	const innerRef = import_react.useRef(null);
	import_react.useImperativeHandle(ref, () => innerRef.current, []);
	return innerRef;
}
function getAssetCrossOrigin(assetCrossOrigin, kind) {
	if (!assetCrossOrigin) return;
	if (typeof assetCrossOrigin === "string") return assetCrossOrigin;
	return assetCrossOrigin[kind];
}
function getManifestScriptFormat(manifest$1) {
	return manifest$1?.scriptFormat ?? "module";
}
function getScriptPreloadAttrs(manifest$1, link, assetCrossOrigin) {
	const preloadLink = resolveManifestAssetLink(link);
	const crossOrigin = getAssetCrossOrigin(assetCrossOrigin, "script") ?? preloadLink.crossOrigin;
	return {
		...getManifestScriptFormat(manifest$1) === "iife" ? {
			rel: "preload",
			as: "script"
		} : { rel: "modulepreload" },
		href: preloadLink.href,
		...crossOrigin ? { crossOrigin } : {}
	};
}
function resolveManifestAssetLink(link) {
	if (typeof link === "string") return {
		href: link,
		crossOrigin: void 0
	};
	return link;
}
function appendUniqueUserTags(target, tags) {
	if (tags.length === 0) return;
	if (tags.length === 1) {
		target.push(tags[0]);
		return;
	}
	const seen = /* @__PURE__ */ new Set();
	for (const tag of tags) {
		const key = JSON.stringify(tag);
		if (seen.has(key)) continue;
		seen.add(key);
		target.push(tag);
	}
}
function getStylesheetHref(asset) {
	return resolveManifestCssLink(asset).href;
}
function resolveManifestCssLink(link) {
	if (typeof link === "string") return {
		href: link,
		crossOrigin: void 0
	};
	return link;
}
function createInlineCssStyleAsset(css) {
	return {
		attrs: { suppressHydrationWarning: true },
		children: css
	};
}
function createInlineCssPlaceholderAsset() {
	return { attrs: { suppressHydrationWarning: true } };
}
var GLOBAL_TSR = "$_TSR";
var TSR_SCRIPT_BARRIER_ID = "$tsr-stream-barrier";
var SYM_ASYNC_ITERATOR = Symbol.asyncIterator;
var SYM_HAS_INSTANCE = Symbol.hasInstance;
var SYM_IS_CONCAT_SPREADABLE = Symbol.isConcatSpreadable;
var SYM_ITERATOR = Symbol.iterator;
var SYM_MATCH = Symbol.match;
var SYM_MATCH_ALL = Symbol.matchAll;
var SYM_REPLACE = Symbol.replace;
var SYM_SEARCH = Symbol.search;
var SYM_SPECIES = Symbol.species;
var SYM_SPLIT = Symbol.split;
var SYM_TO_PRIMITIVE = Symbol.toPrimitive;
var SYM_TO_STRING_TAG = Symbol.toStringTag;
var SYM_UNSCOPABLES = Symbol.unscopables;
var SYMBOL_STRING = {
	[0]: "Symbol.asyncIterator",
	[1]: "Symbol.hasInstance",
	[2]: "Symbol.isConcatSpreadable",
	[3]: "Symbol.iterator",
	[4]: "Symbol.match",
	[5]: "Symbol.matchAll",
	[6]: "Symbol.replace",
	[7]: "Symbol.search",
	[8]: "Symbol.species",
	[9]: "Symbol.split",
	[10]: "Symbol.toPrimitive",
	[11]: "Symbol.toStringTag",
	[12]: "Symbol.unscopables"
};
var INV_SYMBOL_REF = {
	[SYM_ASYNC_ITERATOR]: 0,
	[SYM_HAS_INSTANCE]: 1,
	[SYM_IS_CONCAT_SPREADABLE]: 2,
	[SYM_ITERATOR]: 3,
	[SYM_MATCH]: 4,
	[SYM_MATCH_ALL]: 5,
	[SYM_REPLACE]: 6,
	[SYM_SEARCH]: 7,
	[SYM_SPECIES]: 8,
	[SYM_SPLIT]: 9,
	[SYM_TO_PRIMITIVE]: 10,
	[SYM_TO_STRING_TAG]: 11,
	[SYM_UNSCOPABLES]: 12
};
var SYMBOL_REF = {
	[0]: SYM_ASYNC_ITERATOR,
	[1]: SYM_HAS_INSTANCE,
	[2]: SYM_IS_CONCAT_SPREADABLE,
	[3]: SYM_ITERATOR,
	[4]: SYM_MATCH,
	[5]: SYM_MATCH_ALL,
	[6]: SYM_REPLACE,
	[7]: SYM_SEARCH,
	[8]: SYM_SPECIES,
	[9]: SYM_SPLIT,
	[10]: SYM_TO_PRIMITIVE,
	[11]: SYM_TO_STRING_TAG,
	[12]: SYM_UNSCOPABLES
};
var CONSTANT_STRING = {
	[2]: "!0",
	[3]: "!1",
	[1]: "void 0",
	[0]: "null",
	[4]: "-0",
	[5]: "1/0",
	[6]: "-1/0",
	[7]: "0/0"
};
var CONSTANT_VAL = {
	[2]: true,
	[3]: false,
	[1]: void 0,
	[0]: null,
	[4]: -0,
	[5]: Number.POSITIVE_INFINITY,
	[6]: Number.NEGATIVE_INFINITY,
	[7]: NaN
};
var ERROR_CONSTRUCTOR_STRING = {
	[0]: "Error",
	[1]: "EvalError",
	[2]: "RangeError",
	[3]: "ReferenceError",
	[4]: "SyntaxError",
	[5]: "TypeError",
	[6]: "URIError"
};
var ERROR_CONSTRUCTOR = {
	[0]: Error,
	[1]: EvalError,
	[2]: RangeError,
	[3]: ReferenceError,
	[4]: SyntaxError,
	[5]: TypeError,
	[6]: URIError
};
function createSerovalNode(t, i, s$1, c, m, p, e, a, f, b, o, l$1) {
	return {
		t,
		i,
		s: s$1,
		c,
		m,
		p,
		e,
		a,
		f,
		b,
		o,
		l: l$1
	};
}
function createConstantNode(value) {
	return createSerovalNode(2, void 0, value, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
var TRUE_NODE = /* @__PURE__ */ createConstantNode(2);
var FALSE_NODE = /* @__PURE__ */ createConstantNode(3);
var UNDEFINED_NODE = /* @__PURE__ */ createConstantNode(1);
var NULL_NODE = /* @__PURE__ */ createConstantNode(0);
var NEG_ZERO_NODE = /* @__PURE__ */ createConstantNode(4);
var INFINITY_NODE = /* @__PURE__ */ createConstantNode(5);
var NEG_INFINITY_NODE = /* @__PURE__ */ createConstantNode(6);
var NAN_NODE = /* @__PURE__ */ createConstantNode(7);
function serializeChar(str) {
	switch (str) {
		case "\"": return "\\\"";
		case "\\": return "\\\\";
		case "\n": return "\\n";
		case "\r": return "\\r";
		case "\b": return "\\b";
		case "	": return "\\t";
		case "\f": return "\\f";
		case "<": return "\\x3C";
		case "\u2028": return "\\u2028";
		case "\u2029": return "\\u2029";
		default: return;
	}
}
function serializeString(str) {
	let result = "";
	let lastPos = 0;
	let replacement;
	for (let i = 0, len = str.length; i < len; i++) {
		replacement = serializeChar(str[i]);
		if (replacement) {
			result += str.slice(lastPos, i) + replacement;
			lastPos = i + 1;
		}
	}
	if (lastPos === 0) result = str;
	else result += str.slice(lastPos);
	return result;
}
function deserializeReplacer(str) {
	switch (str) {
		case "\\\\": return "\\";
		case "\\\"": return "\"";
		case "\\n": return "\n";
		case "\\r": return "\r";
		case "\\b": return "\b";
		case "\\t": return "	";
		case "\\f": return "\f";
		case "\\x3C": return "<";
		case "\\u2028": return "\u2028";
		case "\\u2029": return "\u2029";
		default: return str;
	}
}
function deserializeString(str) {
	return str.replace(/(\\\\|\\"|\\n|\\r|\\b|\\t|\\f|\\u2028|\\u2029|\\x3C)/g, deserializeReplacer);
}
var { toString: objectToString } = Object.prototype;
var STEP_ERROR_CODES = {
	parsing: 1,
	serialization: 2,
	deserialization: 3
};
function getErrorMessageProd(type) {
	return `Seroval Error (step: ${STEP_ERROR_CODES[type]})`;
}
var getErrorMessage = (type, cause) => getErrorMessageProd(type);
var SerovalError = class extends Error {
	constructor(type, cause) {
		super(getErrorMessage(type, cause));
		this.cause = cause;
	}
};
var SerovalParserError = class extends SerovalError {
	constructor(cause) {
		super("parsing", cause);
	}
};
var SerovalDeserializationError = class extends SerovalError {
	constructor(cause) {
		super("deserialization", cause);
	}
};
function getSpecificErrorMessage(code) {
	return `Seroval Error (specific: ${code})`;
}
var SerovalUnsupportedTypeError = class extends Error {
	constructor(value) {
		super(getSpecificErrorMessage(1));
		this.value = value;
	}
};
var SerovalUnsupportedNodeError = class extends Error {
	constructor(node) {
		super(getSpecificErrorMessage(2));
	}
};
var SerovalMissingPluginError = class extends Error {
	constructor(tag) {
		super(getSpecificErrorMessage(3));
	}
};
var SerovalMissingInstanceError = class extends Error {
	constructor(tag) {
		super(getSpecificErrorMessage(4));
	}
};
var SerovalMissingReferenceError = class extends Error {
	constructor(value) {
		super(getSpecificErrorMessage(5));
		this.value = value;
	}
};
var SerovalMissingReferenceForIdError = class extends Error {
	constructor(id) {
		super(getSpecificErrorMessage(6));
	}
};
var SerovalUnknownTypedArrayError = class extends Error {
	constructor(name) {
		super(getSpecificErrorMessage(7));
	}
};
var SerovalMalformedNodeError = class extends Error {
	constructor(node) {
		super(getSpecificErrorMessage(8));
	}
};
var SerovalDepthLimitError = class extends Error {
	constructor(limit) {
		super(getSpecificErrorMessage(9));
	}
};
var REFERENCES_KEY = "__SEROVAL_REFS__";
var GLOBAL_CONTEXT_R = `self.\$R`;
function getCrossReferenceHeader(id) {
	if (id == null) return `${GLOBAL_CONTEXT_R}=${GLOBAL_CONTEXT_R}||[]`;
	return `(${GLOBAL_CONTEXT_R}=${GLOBAL_CONTEXT_R}||{})["${serializeString(id)}"]=[]`;
}
var REFERENCE = /* @__PURE__ */ new Map();
var INV_REFERENCE = /* @__PURE__ */ new Map();
function hasReferenceID(value) {
	return REFERENCE.has(value);
}
function hasReference(id) {
	return INV_REFERENCE.has(id);
}
function getReferenceID(value) {
	if (hasReferenceID(value)) return REFERENCE.get(value);
	throw new SerovalMissingReferenceError(value);
}
function getReference(id) {
	if (hasReference(id)) return INV_REFERENCE.get(id);
	throw new SerovalMissingReferenceForIdError(id);
}
if (typeof globalThis !== "undefined") Object.defineProperty(globalThis, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof window !== "undefined") Object.defineProperty(window, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof self !== "undefined") Object.defineProperty(self, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
else if (typeof global !== "undefined") Object.defineProperty(global, REFERENCES_KEY, {
	value: INV_REFERENCE,
	configurable: true,
	writable: false,
	enumerable: false
});
function getErrorConstructor(error) {
	if (error instanceof EvalError) return 1;
	if (error instanceof RangeError) return 2;
	if (error instanceof ReferenceError) return 3;
	if (error instanceof SyntaxError) return 4;
	if (error instanceof TypeError) return 5;
	if (error instanceof URIError) return 6;
	return 0;
}
function getInitialErrorOptions(error) {
	const construct = ERROR_CONSTRUCTOR_STRING[getErrorConstructor(error)];
	if (error.name !== construct) return { name: error.name };
	if (error.constructor.name !== construct) return { name: error.constructor.name };
	return {};
}
function getErrorOptions(error, features) {
	let options = getInitialErrorOptions(error);
	const names = Object.getOwnPropertyNames(error);
	for (let i = 0, len = names.length, name; i < len; i++) {
		name = names[i];
		if (name !== "name" && name !== "message") if (name === "stack") {
			if (features & 4) {
				options = options || {};
				options[name] = error[name];
			}
		} else {
			options = options || {};
			options[name] = error[name];
		}
	}
	return options;
}
function getObjectFlag(obj) {
	if (Object.isFrozen(obj)) return 3;
	if (Object.isSealed(obj)) return 2;
	if (Object.isExtensible(obj)) return 0;
	return 1;
}
function createNumberNode(value) {
	switch (value) {
		case Number.POSITIVE_INFINITY: return INFINITY_NODE;
		case Number.NEGATIVE_INFINITY: return NEG_INFINITY_NODE;
	}
	if (value !== value) return NAN_NODE;
	if (Object.is(value, -0)) return NEG_ZERO_NODE;
	return createSerovalNode(0, void 0, value, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createStringNode(value) {
	return createSerovalNode(1, void 0, serializeString(value), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createBigIntNode(current) {
	return createSerovalNode(3, void 0, "" + current, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createIndexedValueNode(id) {
	return createSerovalNode(4, id, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createDateNode(id, current) {
	const timestamp = current.valueOf();
	return createSerovalNode(5, id, timestamp !== timestamp ? "" : current.toISOString(), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createTemporalNode(id, type, current) {
	return createSerovalNode(36, id, current.toString(), type, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createRegExpNode(id, current) {
	return createSerovalNode(6, id, void 0, serializeString(current.source), current.flags, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createWKSymbolNode(id, current) {
	return createSerovalNode(17, id, INV_SYMBOL_REF[current], void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createReferenceNode(id, ref) {
	return createSerovalNode(18, id, serializeString(getReferenceID(ref)), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createPluginNode(id, tag, value) {
	return createSerovalNode(25, id, value, serializeString(tag), void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createArrayNode(id, current, parsedItems) {
	return createSerovalNode(9, id, void 0, void 0, void 0, void 0, void 0, parsedItems, void 0, void 0, getObjectFlag(current), void 0);
}
function createBoxedNode(id, boxed) {
	return createSerovalNode(21, id, void 0, void 0, void 0, void 0, void 0, void 0, boxed, void 0, void 0, void 0);
}
var MAX_TYPED_ARRAY_LENGTH = 1e6;
function createTypedArrayNode(id, current, buffer) {
	if (current.length > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(15, id, void 0, current.constructor.name, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.length);
}
function createBigIntTypedArrayNode(id, current, buffer) {
	if (current.length > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(16, id, void 0, current.constructor.name, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.length);
}
function createDataViewNode(id, current, buffer) {
	if (current.byteLength > MAX_TYPED_ARRAY_LENGTH) throw new SerovalUnsupportedTypeError(current);
	return createSerovalNode(20, id, void 0, void 0, void 0, void 0, void 0, void 0, buffer, current.byteOffset, void 0, current.byteLength);
}
function createErrorNode(id, current, options) {
	return createSerovalNode(13, id, getErrorConstructor(current), void 0, serializeString(current.message), options, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createAggregateErrorNode(id, current, options) {
	return createSerovalNode(14, id, getErrorConstructor(current), void 0, serializeString(current.message), options, void 0, void 0, void 0, void 0, void 0, void 0);
}
function createSetNode(id, items) {
	return createSerovalNode(7, id, void 0, void 0, void 0, void 0, void 0, items, void 0, void 0, void 0, void 0);
}
function createIteratorFactoryInstanceNode(factory, items) {
	return createSerovalNode(28, void 0, void 0, void 0, void 0, void 0, void 0, [factory, items], void 0, void 0, void 0, void 0);
}
function createAsyncIteratorFactoryInstanceNode(factory, items) {
	return createSerovalNode(30, void 0, void 0, void 0, void 0, void 0, void 0, [factory, items], void 0, void 0, void 0, void 0);
}
function createStreamConstructorNode(id, factory, sequence) {
	return createSerovalNode(31, id, void 0, void 0, void 0, void 0, void 0, sequence, factory, void 0, void 0, void 0);
}
function createStreamNextNode(id, parsed) {
	return createSerovalNode(32, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createStreamThrowNode(id, parsed) {
	return createSerovalNode(33, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createStreamReturnNode(id, parsed) {
	return createSerovalNode(34, id, void 0, void 0, void 0, void 0, void 0, void 0, parsed, void 0, void 0, void 0);
}
function createSequenceNode(id, sequence, throwAt, doneAt) {
	return createSerovalNode(35, id, throwAt, void 0, void 0, void 0, void 0, sequence, void 0, void 0, void 0, doneAt);
}
var OpaqueReference = class {
	constructor(value, replacement) {
		this.value = value;
		this.replacement = replacement;
	}
};
var PROMISE_CONSTRUCTOR = () => {
	const resolver = {
		p: 0,
		s: 0,
		f: 0
	};
	resolver.p = new Promise((resolve, reject) => {
		resolver.s = resolve;
		resolver.f = reject;
	});
	return resolver;
};
var PROMISE_SUCCESS = (resolver, data) => {
	resolver.s(data);
	resolver.p.s = 1;
	resolver.p.v = data;
};
var PROMISE_FAILURE = (resolver, data) => {
	resolver.f(data);
	resolver.p.s = 2;
	resolver.p.v = data;
};
var SERIALIZED_PROMISE_CONSTRUCTOR = /* @__PURE__ */ PROMISE_CONSTRUCTOR.toString();
var SERIALIZED_PROMISE_SUCCESS = /* @__PURE__ */ PROMISE_SUCCESS.toString();
var SERIALIZED_PROMISE_FAILURE = /* @__PURE__ */ PROMISE_FAILURE.toString();
var STREAM_CONSTRUCTOR = () => {
	const buffer = [];
	const listeners = [];
	let alive = true;
	let success = false;
	let count = 0;
	const internal = {
		flush(value, mode, x) {
			for (x = 0; x < count; x++) if (listeners[x]) listeners[x][mode](value);
		},
		up(listener, x, z, current) {
			for (x = 0, z = buffer.length; x < z; x++) {
				current = buffer[x];
				if (!alive && x === z - 1) listener[success ? "return" : "throw"](current);
				else listener.next(current);
			}
		},
		on(listener, temp) {
			if (alive) {
				temp = count++;
				listeners[temp] = listener;
			}
			internal.up(listener);
			return () => {
				if (alive) {
					listeners[temp] = listeners[count];
					listeners[count--] = void 0;
				}
			};
		}
	};
	return {
		__SEROVAL_STREAM__: true,
		on(listener) {
			return internal.on(listener);
		},
		next(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "next");
			}
		},
		throw(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "throw");
				alive = false;
				success = false;
				listeners.length = 0;
			}
		},
		return(value) {
			if (alive) {
				buffer.push(value);
				internal.flush(value, "return");
				alive = false;
				success = true;
				listeners.length = 0;
			}
		}
	};
};
var SERIALIZED_STREAM_CONSTRUCTOR = /* @__PURE__ */ STREAM_CONSTRUCTOR.toString();
var ITERATOR_CONSTRUCTOR = (symbol) => (sequence) => () => {
	let index = 0;
	const instance = {
		[symbol]() {
			return instance;
		},
		next() {
			if (index > sequence.d) return {
				done: true,
				value: void 0
			};
			const currentIndex = index++;
			const data = sequence.v[currentIndex];
			if (currentIndex === sequence.t) throw data;
			return {
				done: currentIndex === sequence.d,
				value: data
			};
		}
	};
	return instance;
};
var SERIALIZED_ITERATOR_CONSTRUCTOR = /* @__PURE__ */ ITERATOR_CONSTRUCTOR.toString();
var ASYNC_ITERATOR_CONSTRUCTOR = (symbol, createPromise) => (stream$1) => () => {
	let count = 0;
	let doneAt = -1;
	let isThrow = false;
	const buffer = [];
	const pending = [];
	const internal = { finalize(i = 0, len = pending.length) {
		for (; i < len; i++) pending[i].s({
			done: true,
			value: void 0
		});
	} };
	stream$1.on({
		next(value) {
			const temp = pending.shift();
			if (temp) temp.s({
				done: false,
				value
			});
			buffer.push(value);
		},
		throw(value) {
			const temp = pending.shift();
			if (temp) temp.f(value);
			internal.finalize();
			doneAt = buffer.length;
			isThrow = true;
			buffer.push(value);
		},
		return(value) {
			const temp = pending.shift();
			if (temp) temp.s({
				done: true,
				value
			});
			internal.finalize();
			doneAt = buffer.length;
			buffer.push(value);
		}
	});
	const instance = {
		[symbol]() {
			return instance;
		},
		next() {
			if (doneAt === -1) {
				const index$1 = count++;
				if (index$1 >= buffer.length) {
					const temp = createPromise();
					pending.push(temp);
					return temp.p;
				}
				return {
					done: false,
					value: buffer[index$1]
				};
			}
			if (count > doneAt) return {
				done: true,
				value: void 0
			};
			const index = count++;
			const value = buffer[index];
			if (index !== doneAt) return {
				done: false,
				value
			};
			if (isThrow) throw value;
			return {
				done: true,
				value
			};
		}
	};
	return instance;
};
var SERIALIZED_ASYNC_ITERATOR_CONSTRUCTOR = /* @__PURE__ */ ASYNC_ITERATOR_CONSTRUCTOR.toString();
var ARRAY_BUFFER_CONSTRUCTOR = (b64) => {
	const decoded = atob(b64);
	const length = decoded.length;
	const arr = new Uint8Array(length);
	for (let i = 0; i < length; i++) arr[i] = decoded.charCodeAt(i);
	return arr.buffer;
};
var SERIALIZED_ARRAY_BUFFER_CONSTRUCTOR = /* @__PURE__ */ ARRAY_BUFFER_CONSTRUCTOR.toString();
function isSequence(value) {
	return "__SEROVAL_SEQUENCE__" in value;
}
function createSequence(values, throwAt, doneAt) {
	return {
		__SEROVAL_SEQUENCE__: true,
		v: values,
		t: throwAt,
		d: doneAt
	};
}
function createSequenceFromIterable(source) {
	const values = [];
	let throwsAt = -1;
	let doneAt = -1;
	const iterator = source[SYM_ITERATOR]();
	while (true) try {
		const value = iterator.next();
		values.push(value.value);
		if (value.done) {
			doneAt = values.length - 1;
			break;
		}
	} catch (error) {
		throwsAt = values.length;
		values.push(error);
	}
	return createSequence(values, throwsAt, doneAt);
}
var createIterator = ITERATOR_CONSTRUCTOR(SYM_ITERATOR);
function sequenceToIterator(sequence) {
	return createIterator(sequence);
}
var ITERATOR = {};
var ASYNC_ITERATOR = {};
var SPECIAL_REFS = {
	[0]: {},
	[1]: {},
	[2]: {},
	[3]: {},
	[4]: {},
	[5]: {}
};
var SPECIAL_REF_STRING = {
	[0]: "[]",
	[1]: SERIALIZED_PROMISE_CONSTRUCTOR,
	[2]: SERIALIZED_PROMISE_SUCCESS,
	[3]: SERIALIZED_PROMISE_FAILURE,
	[4]: SERIALIZED_STREAM_CONSTRUCTOR,
	[5]: SERIALIZED_ARRAY_BUFFER_CONSTRUCTOR
};
function isStream(value) {
	return "__SEROVAL_STREAM__" in value;
}
function createStream() {
	return STREAM_CONSTRUCTOR();
}
function createStreamFromAsyncIterable(iterable) {
	const stream$1 = createStream();
	const iterator = iterable[SYM_ASYNC_ITERATOR]();
	async function push() {
		try {
			const value = await iterator.next();
			if (value.done) stream$1.return(value.value);
			else {
				stream$1.next(value.value);
				await push();
			}
		} catch (error) {
			stream$1.throw(error);
		}
	}
	push().catch(() => {});
	return stream$1;
}
var createAsyncIterable = ASYNC_ITERATOR_CONSTRUCTOR(SYM_ASYNC_ITERATOR, PROMISE_CONSTRUCTOR);
function streamToAsyncIterable(stream$1) {
	return createAsyncIterable(stream$1);
}
async function promiseToResult(current) {
	try {
		return [1, await current];
	} catch (e) {
		return [0, e];
	}
}
function createBaseParserContext(mode, options) {
	return {
		plugins: options.plugins,
		mode,
		marked: /* @__PURE__ */ new Set(),
		features: 127 ^ (options.disabledFeatures || 0),
		refs: options.refs || /* @__PURE__ */ new Map(),
		depthLimit: options.depthLimit || 1e3
	};
}
function markParserRef(ctx, id) {
	ctx.marked.add(id);
}
function createIndexForValue(ctx, current) {
	const id = ctx.refs.size;
	ctx.refs.set(current, id);
	return id;
}
function getNodeForIndexedValue(ctx, current) {
	const registeredId = ctx.refs.get(current);
	if (registeredId != null) {
		markParserRef(ctx, registeredId);
		return {
			type: 1,
			value: createIndexedValueNode(registeredId)
		};
	}
	return {
		type: 0,
		value: createIndexForValue(ctx, current)
	};
}
function getReferenceNode(ctx, current) {
	const indexed = getNodeForIndexedValue(ctx, current);
	if (indexed.type === 1) return indexed;
	if (hasReferenceID(current)) return {
		type: 2,
		value: createReferenceNode(indexed.value, current)
	};
	return indexed;
}
function parseWellKnownSymbol(ctx, current) {
	const ref = getReferenceNode(ctx, current);
	if (ref.type !== 0) return ref.value;
	if (current in INV_SYMBOL_REF) return createWKSymbolNode(ref.value, current);
	throw new SerovalUnsupportedTypeError(current);
}
function parseSpecialReference(ctx, ref) {
	const result = getNodeForIndexedValue(ctx, SPECIAL_REFS[ref]);
	if (result.type === 1) return result.value;
	return createSerovalNode(26, result.value, ref, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0);
}
function parseIteratorFactory(ctx) {
	const result = getNodeForIndexedValue(ctx, ITERATOR);
	if (result.type === 1) return result.value;
	return createSerovalNode(27, result.value, void 0, void 0, void 0, void 0, void 0, void 0, parseWellKnownSymbol(ctx, SYM_ITERATOR), void 0, void 0, void 0);
}
function parseAsyncIteratorFactory(ctx) {
	const result = getNodeForIndexedValue(ctx, ASYNC_ITERATOR);
	if (result.type === 1) return result.value;
	return createSerovalNode(29, result.value, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(ctx, 1), parseWellKnownSymbol(ctx, SYM_ASYNC_ITERATOR)], void 0, void 0, void 0, void 0);
}
function createObjectNode(id, current, empty, record) {
	return createSerovalNode(empty ? 11 : 10, id, void 0, void 0, void 0, record, void 0, void 0, void 0, void 0, getObjectFlag(current), void 0);
}
function createMapNode(ctx, id, k, v) {
	return createSerovalNode(8, id, void 0, void 0, void 0, void 0, {
		k,
		v
	}, void 0, parseSpecialReference(ctx, 0), void 0, void 0, void 0);
}
function createPromiseConstructorNode(ctx, id, resolver) {
	return createSerovalNode(22, id, resolver, void 0, void 0, void 0, void 0, void 0, parseSpecialReference(ctx, 1), void 0, void 0, void 0);
}
function createArrayBufferNode(ctx, id, current) {
	const bytes = new Uint8Array(current);
	let result = "";
	for (let i = 0, len = bytes.length; i < len; i++) result += String.fromCharCode(bytes[i]);
	return createSerovalNode(19, id, serializeString(btoa(result)), void 0, void 0, void 0, void 0, void 0, parseSpecialReference(ctx, 5), void 0, void 0, void 0);
}
function createAsyncParserContext(mode, options) {
	return {
		base: createBaseParserContext(mode, options),
		child: void 0
	};
}
var AsyncParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseAsync(this._p, this.depth, current);
	}
};
async function parseItems$1(ctx, depth, current) {
	const nodes = [];
	for (let i = 0, len = current.length; i < len; i++) if (i in current) nodes[i] = await parseAsync(ctx, depth, current[i]);
	else nodes[i] = 0;
	return nodes;
}
async function parseArray$1(ctx, depth, id, current) {
	return createArrayNode(id, current, await parseItems$1(ctx, depth, current));
}
async function parseProperties$1(ctx, depth, properties) {
	const entries = Object.entries(properties);
	const keyNodes = [];
	const valueNodes = [];
	for (let i = 0, len = entries.length; i < len; i++) {
		keyNodes.push(serializeString(entries[i][0]));
		valueNodes.push(await parseAsync(ctx, depth, entries[i][1]));
	}
	if (SYM_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ITERATOR));
		valueNodes.push(createIteratorFactoryInstanceNode(parseIteratorFactory(ctx.base), await parseAsync(ctx, depth, createSequenceFromIterable(properties))));
	}
	if (SYM_ASYNC_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ASYNC_ITERATOR));
		valueNodes.push(createAsyncIteratorFactoryInstanceNode(parseAsyncIteratorFactory(ctx.base), await parseAsync(ctx, depth, createStreamFromAsyncIterable(properties))));
	}
	if (SYM_TO_STRING_TAG in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_TO_STRING_TAG));
		valueNodes.push(createStringNode(properties[SYM_TO_STRING_TAG]));
	}
	if (SYM_IS_CONCAT_SPREADABLE in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_IS_CONCAT_SPREADABLE));
		valueNodes.push(properties[SYM_IS_CONCAT_SPREADABLE] ? TRUE_NODE : FALSE_NODE);
	}
	return {
		k: keyNodes,
		v: valueNodes
	};
}
async function parsePlainObject$1(ctx, depth, id, current, empty) {
	return createObjectNode(id, current, empty, await parseProperties$1(ctx, depth, current));
}
async function parseBoxed$1(ctx, depth, id, current) {
	return createBoxedNode(id, await parseAsync(ctx, depth, current.valueOf()));
}
async function parseTypedArray$1(ctx, depth, id, current) {
	return createTypedArrayNode(id, current, await parseAsync(ctx, depth, current.buffer));
}
async function parseBigIntTypedArray$1(ctx, depth, id, current) {
	return createBigIntTypedArrayNode(id, current, await parseAsync(ctx, depth, current.buffer));
}
async function parseDataView$1(ctx, depth, id, current) {
	return createDataViewNode(id, current, await parseAsync(ctx, depth, current.buffer));
}
async function parseError$1(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createErrorNode(id, current, options ? await parseProperties$1(ctx, depth, options) : void 0);
}
async function parseAggregateError$1(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createAggregateErrorNode(id, current, options ? await parseProperties$1(ctx, depth, options) : void 0);
}
async function parseMap$1(ctx, depth, id, current) {
	const keyNodes = [];
	const valueNodes = [];
	for (const [key, value] of current.entries()) {
		keyNodes.push(await parseAsync(ctx, depth, key));
		valueNodes.push(await parseAsync(ctx, depth, value));
	}
	return createMapNode(ctx.base, id, keyNodes, valueNodes);
}
async function parseSet$1(ctx, depth, id, current) {
	const items = [];
	for (const item of current.keys()) items.push(await parseAsync(ctx, depth, item));
	return createSetNode(id, items);
}
async function parsePlugin$1(ctx, depth, id, current) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.async && plugin.test(current)) return createPluginNode(id, plugin.tag, await plugin.parse.async(current, new AsyncParsePluginContext(ctx, depth), { id }));
	}
}
async function parsePromise$1(ctx, depth, id, current) {
	const [status, result] = await promiseToResult(current);
	return createSerovalNode(12, id, status, void 0, void 0, void 0, void 0, void 0, await parseAsync(ctx, depth, result), void 0, void 0, void 0);
}
function parseStreamHandle(depth, id, current, resolve, reject) {
	const sequence = [];
	const cleanup = current.on({
		next: (value) => {
			markParserRef(this.base, id);
			parseAsync(this, depth, value).then((data) => {
				sequence.push(createStreamNextNode(id, data));
			}, (data) => {
				reject(data);
				cleanup();
			});
		},
		throw: (value) => {
			markParserRef(this.base, id);
			parseAsync(this, depth, value).then((data) => {
				sequence.push(createStreamThrowNode(id, data));
				resolve(sequence);
				cleanup();
			}, (data) => {
				reject(data);
				cleanup();
			});
		},
		return: (value) => {
			markParserRef(this.base, id);
			parseAsync(this, depth, value).then((data) => {
				sequence.push(createStreamReturnNode(id, data));
				resolve(sequence);
				cleanup();
			}, (data) => {
				reject(data);
				cleanup();
			});
		}
	});
}
async function parseStream$1(ctx, depth, id, current) {
	return createStreamConstructorNode(id, parseSpecialReference(ctx.base, 4), await new Promise(parseStreamHandle.bind(ctx, depth, id, current)));
}
async function parseSequence$1(ctx, depth, id, current) {
	const nodes = [];
	for (let i = 0, len = current.v.length; i < len; i++) nodes[i] = await parseAsync(ctx, depth, current.v[i]);
	return createSequenceNode(id, nodes, current.t, current.d);
}
async function parseObjectAsync(ctx, depth, id, current) {
	if (Array.isArray(current)) return parseArray$1(ctx, depth, id, current);
	if (isStream(current)) return parseStream$1(ctx, depth, id, current);
	if (isSequence(current)) return parseSequence$1(ctx, depth, id, current);
	let currentClass = current.constructor;
	if (currentClass !== void 0 && typeof currentClass !== "function") {
		const proto = Object.getPrototypeOf(current);
		currentClass = proto === null ? void 0 : proto.constructor;
	}
	if (currentClass === OpaqueReference) return parseAsync(ctx, depth, current.replacement);
	const parsed = await parsePlugin$1(ctx, depth, id, current);
	if (parsed) return parsed;
	switch (currentClass) {
		case Object: return parsePlainObject$1(ctx, depth, id, current, false);
		case void 0: return parsePlainObject$1(ctx, depth, id, current, true);
		case Date: return createDateNode(id, current);
		case Error:
		case EvalError:
		case RangeError:
		case ReferenceError:
		case SyntaxError:
		case TypeError:
		case URIError: return parseError$1(ctx, depth, id, current);
		case Number:
		case Boolean:
		case String:
		case BigInt: return parseBoxed$1(ctx, depth, id, current);
		case ArrayBuffer: return createArrayBufferNode(ctx.base, id, current);
		case Int8Array:
		case Int16Array:
		case Int32Array:
		case Uint8Array:
		case Uint16Array:
		case Uint32Array:
		case Uint8ClampedArray:
		case Float32Array:
		case Float64Array: return parseTypedArray$1(ctx, depth, id, current);
		case DataView: return parseDataView$1(ctx, depth, id, current);
		case Map: return parseMap$1(ctx, depth, id, current);
		case Set: return parseSet$1(ctx, depth, id, current);
	}
	if (currentClass === Promise || current instanceof Promise) return parsePromise$1(ctx, depth, id, current);
	const currentFeatures = ctx.base.features;
	if (currentFeatures & 32 && currentClass === RegExp) return createRegExpNode(id, current);
	if (currentFeatures & 16) switch (currentClass) {
		case BigInt64Array:
		case BigUint64Array: return parseBigIntTypedArray$1(ctx, depth, id, current);
	}
	if (currentFeatures & 1 && typeof AggregateError !== "undefined" && (currentClass === AggregateError || current instanceof AggregateError)) return parseAggregateError$1(ctx, depth, id, current);
	if (currentFeatures & 64 && typeof Temporal !== "undefined") switch (currentClass) {
		case Temporal.Instant: return createTemporalNode(id, 0, current);
		case Temporal.Duration: return createTemporalNode(id, 1, current);
		case Temporal.PlainDate: return createTemporalNode(id, 2, current);
		case Temporal.PlainDateTime: return createTemporalNode(id, 3, current);
		case Temporal.PlainMonthDay: return createTemporalNode(id, 4, current);
		case Temporal.PlainTime: return createTemporalNode(id, 5, current);
		case Temporal.PlainYearMonth: return createTemporalNode(id, 6, current);
		case Temporal.ZonedDateTime: return createTemporalNode(id, 7, current);
	}
	if (current instanceof Error) return parseError$1(ctx, depth, id, current);
	if (SYM_ITERATOR in current || SYM_ASYNC_ITERATOR in current) return parsePlainObject$1(ctx, depth, id, current, !!currentClass);
	throw new SerovalUnsupportedTypeError(current);
}
async function parseFunctionAsync(ctx, depth, current) {
	const ref = getReferenceNode(ctx.base, current);
	if (ref.type !== 0) return ref.value;
	const plugin = await parsePlugin$1(ctx, depth, ref.value, current);
	if (plugin) return plugin;
	throw new SerovalUnsupportedTypeError(current);
}
async function parseAsync(ctx, depth, current) {
	if (depth >= ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	switch (typeof current) {
		case "boolean": return current ? TRUE_NODE : FALSE_NODE;
		case "undefined": return UNDEFINED_NODE;
		case "string": return createStringNode(current);
		case "number": return createNumberNode(current);
		case "bigint": return createBigIntNode(current);
		case "object":
			if (current) {
				const ref = getReferenceNode(ctx.base, current);
				return ref.type === 0 ? await parseObjectAsync(ctx, depth + 1, ref.value, current) : ref.value;
			}
			return NULL_NODE;
		case "symbol": return parseWellKnownSymbol(ctx.base, current);
		case "function": return parseFunctionAsync(ctx, depth, current);
		default: throw new SerovalUnsupportedTypeError(current);
	}
}
async function parseTopAsync(ctx, current) {
	try {
		return await parseAsync(ctx, 0, current);
	} catch (error) {
		throw error instanceof SerovalParserError ? error : new SerovalParserError(error);
	}
}
function createPlugin(plugin) {
	return plugin;
}
function dedupePlugins(deduped, plugins) {
	for (let i = 0, len = plugins.length; i < len; i++) {
		const current = plugins[i];
		if (!deduped.has(current)) {
			deduped.add(current);
			if (current.extends) dedupePlugins(deduped, current.extends);
		}
	}
}
function resolvePlugins(plugins) {
	if (plugins) {
		const deduped = /* @__PURE__ */ new Set();
		dedupePlugins(deduped, plugins);
		return [...deduped];
	}
}
function getTypedArrayConstructor(name) {
	switch (name) {
		case "Int8Array": return Int8Array;
		case "Int16Array": return Int16Array;
		case "Int32Array": return Int32Array;
		case "Uint8Array": return Uint8Array;
		case "Uint16Array": return Uint16Array;
		case "Uint32Array": return Uint32Array;
		case "Uint8ClampedArray": return Uint8ClampedArray;
		case "Float32Array": return Float32Array;
		case "Float64Array": return Float64Array;
		case "BigInt64Array": return BigInt64Array;
		case "BigUint64Array": return BigUint64Array;
		default: throw new SerovalUnknownTypedArrayError(name);
	}
}
function isValidKey(key) {
	switch (key) {
		case "constructor":
		case "__proto__":
		case "prototype":
		case "__defineGetter__":
		case "__defineSetter__":
		case "__lookupGetter__":
		case "__lookupSetter__": return false;
		default: return true;
	}
}
function isValidSymbol(symbol) {
	switch (symbol) {
		case SYM_ASYNC_ITERATOR:
		case SYM_IS_CONCAT_SPREADABLE:
		case SYM_TO_STRING_TAG:
		case SYM_ITERATOR: return true;
		default: return false;
	}
}
var MAX_BASE64_LENGTH = 1e6;
var MAX_BIGINT_LENGTH = 1e4;
var MAX_REGEXP_SOURCE_LENGTH = 2e4;
function applyObjectFlag(obj, flag) {
	switch (flag) {
		case 3: return Object.freeze(obj);
		case 1: return Object.preventExtensions(obj);
		case 2: return Object.seal(obj);
		default: return obj;
	}
}
var DEFAULT_DEPTH_LIMIT = 1e3;
function createBaseDeserializerContext(mode, options) {
	var _options$features;
	const refs = options.refs || /* @__PURE__ */ new Map();
	if (!("types" in refs)) Object.assign(refs, { types: /* @__PURE__ */ new Map() });
	return {
		mode,
		plugins: options.plugins,
		refs,
		features: (_options$features = options.features) !== null && _options$features !== void 0 ? _options$features : 127 ^ (options.disabledFeatures || 0),
		depthLimit: options.depthLimit || DEFAULT_DEPTH_LIMIT
	};
}
function createVanillaDeserializerContext(options) {
	return {
		mode: 1,
		base: createBaseDeserializerContext(1, options),
		child: void 0,
		state: { marked: new Set(options.markedRefs) }
	};
}
var DeserializePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	deserialize(node) {
		return deserialize$1(this._p, this.depth, node);
	}
};
function guardIndexedValue(ctx, id) {
	if (id < 0 || !Number.isFinite(id) || !Number.isInteger(id)) throw new SerovalMalformedNodeError({
		t: 4,
		i: id
	});
	if (ctx.refs.has(id)) throw new Error("Conflicted ref id: " + id);
}
function isThennable(value) {
	return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
function assignIndexedValueVanilla(ctx, id, value) {
	guardIndexedValue(ctx.base, id);
	if (ctx.state.marked.has(id)) ctx.base.refs.set(id, value);
	return value;
}
function assignIndexedValueCross(ctx, id, value) {
	guardIndexedValue(ctx.base, id);
	ctx.base.refs.set(id, value);
	return value;
}
function assignIndexedValue$1(ctx, id, value) {
	return ctx.mode === 1 ? assignIndexedValueVanilla(ctx, id, value) : assignIndexedValueCross(ctx, id, value);
}
function deserializeKnownValue(node, record, key) {
	if (Object.hasOwn(record, key)) return record[key];
	throw new SerovalMalformedNodeError(node);
}
function deserializeReference(ctx, node) {
	return assignIndexedValue$1(ctx, node.i, getReference(deserializeString(node.s)));
}
function deserializeArray(ctx, depth, node) {
	const items = node.a;
	const len = items.length;
	const result = assignIndexedValue$1(ctx, node.i, new Array(len));
	for (let i = 0, item; i < len; i++) {
		item = items[i];
		if (item) result[i] = deserialize$1(ctx, depth, item);
	}
	applyObjectFlag(result, node.o);
	return result;
}
function assignStringProperty(object, key, value) {
	if (isValidKey(key)) object[key] = value;
	else Object.defineProperty(object, key, {
		value,
		configurable: true,
		enumerable: true,
		writable: true
	});
}
function assignProperty(ctx, depth, object, key, value) {
	if (typeof key === "string") assignStringProperty(object, deserializeString(key), deserialize$1(ctx, depth, value));
	else {
		const actual = deserialize$1(ctx, depth, key);
		switch (typeof actual) {
			case "string":
				assignStringProperty(object, actual, deserialize$1(ctx, depth, value));
				break;
			case "symbol":
				if (isValidSymbol(actual)) object[actual] = deserialize$1(ctx, depth, value);
				break;
			default: throw new SerovalMalformedNodeError(key);
		}
	}
}
function assignNodeType(ctx, id, type) {
	ctx.base.refs.types.set(id, type);
}
function validateNodeType(ctx, node, id, type) {
	if (ctx.base.refs.types.get(id) !== type) throw new SerovalMalformedNodeError(node);
}
function deserializeProperties(ctx, depth, node, result) {
	const keys = node.k;
	if (keys.length > 0) for (let i = 0, vals = node.v, len = keys.length; i < len; i++) assignProperty(ctx, depth, result, keys[i], vals[i]);
	return result;
}
function deserializeObject(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, node.t === 10 ? {} : Object.create(null));
	deserializeProperties(ctx, depth, node.p, result);
	applyObjectFlag(result, node.o);
	return result;
}
function deserializeDate(ctx, node) {
	return assignIndexedValue$1(ctx, node.i, new Date(node.s));
}
function deserializeTemporal(ctx, node) {
	if (!(ctx.base.features & 64)) throw new SerovalUnsupportedNodeError(node);
	let value;
	switch (node.c) {
		case 0:
			value = Temporal.Instant.from(node.s);
			break;
		case 1:
			value = Temporal.Duration.from(node.s);
			break;
		case 2:
			value = Temporal.PlainDate.from(node.s);
			break;
		case 3:
			value = Temporal.PlainDateTime.from(node.s);
			break;
		case 4:
			value = Temporal.PlainMonthDay.from(node.s);
			break;
		case 5:
			value = Temporal.PlainTime.from(node.s);
			break;
		case 6:
			value = Temporal.PlainYearMonth.from(node.s);
			break;
		case 7:
			value = Temporal.ZonedDateTime.from(node.s);
			break;
		default: throw new SerovalMalformedNodeError(node);
	}
	return assignIndexedValue$1(ctx, node.i, value);
}
function deserializeRegExp(ctx, node) {
	if (ctx.base.features & 32) {
		const source = deserializeString(node.c);
		if (source.length > MAX_REGEXP_SOURCE_LENGTH) throw new SerovalMalformedNodeError(node);
		return assignIndexedValue$1(ctx, node.i, new RegExp(source, node.m));
	}
	throw new SerovalUnsupportedNodeError(node);
}
function deserializeSet(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, /* @__PURE__ */ new Set());
	for (let i = 0, items = node.a, len = items.length; i < len; i++) result.add(deserialize$1(ctx, depth, items[i]));
	return result;
}
function deserializeMap(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, /* @__PURE__ */ new Map());
	for (let i = 0, keys = node.e.k, vals = node.e.v, len = keys.length; i < len; i++) result.set(deserialize$1(ctx, depth, keys[i]), deserialize$1(ctx, depth, vals[i]));
	return result;
}
function deserializeArrayBuffer(ctx, node) {
	if (node.s.length > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, ARRAY_BUFFER_CONSTRUCTOR(deserializeString(node.s)));
}
function deserializeTypedArray(ctx, depth, node) {
	var _node$b;
	const construct = getTypedArrayConstructor(node.c);
	const source = deserialize$1(ctx, depth, node.f);
	if (!(source instanceof ArrayBuffer)) throw new SerovalMalformedNodeError(node);
	const offset = (_node$b = node.b) !== null && _node$b !== void 0 ? _node$b : 0;
	if (offset < 0 || offset > source.byteLength || node.l > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, new construct(source, offset, node.l));
}
function deserializeDataView(ctx, depth, node) {
	var _node$b2;
	const source = deserialize$1(ctx, depth, node.f);
	if (!(source instanceof ArrayBuffer)) throw new SerovalMalformedNodeError(node);
	const offset = (_node$b2 = node.b) !== null && _node$b2 !== void 0 ? _node$b2 : 0;
	if (offset < 0 || offset > source.byteLength || node.l > MAX_BASE64_LENGTH) throw new SerovalMalformedNodeError(node);
	return assignIndexedValue$1(ctx, node.i, new DataView(source, offset, node.l));
}
function deserializeDictionary(ctx, depth, node, result) {
	if (node.p) {
		const fields = deserializeProperties(ctx, depth, node.p, {});
		Object.defineProperties(result, Object.getOwnPropertyDescriptors(fields));
	}
	return result;
}
function deserializeAggregateError(ctx, depth, node) {
	return deserializeDictionary(ctx, depth, node, assignIndexedValue$1(ctx, node.i, new AggregateError([], deserializeString(node.m))));
}
function deserializeError(ctx, depth, node) {
	const construct = deserializeKnownValue(node, ERROR_CONSTRUCTOR, node.s);
	return deserializeDictionary(ctx, depth, node, assignIndexedValue$1(ctx, node.i, new construct(deserializeString(node.m))));
}
function deserializePromise(ctx, depth, node) {
	const deferred = PROMISE_CONSTRUCTOR();
	const result = assignIndexedValue$1(ctx, node.i, deferred.p);
	const deserialized = deserialize$1(ctx, depth, node.f);
	if (isThennable(deserialized)) throw new SerovalMalformedNodeError(node.f);
	if (node.s) deferred.s(deserialized);
	else deferred.f(deserialized);
	return result;
}
function deserializeBoxed(ctx, depth, node) {
	return assignIndexedValue$1(ctx, node.i, Object(deserialize$1(ctx, depth, node.f)));
}
function deserializePlugin(ctx, depth, node) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) {
		const tag = deserializeString(node.c);
		for (let i = 0, len = currentPlugins.length; i < len; i++) {
			const plugin = currentPlugins[i];
			if (plugin.tag === tag) return assignIndexedValue$1(ctx, node.i, plugin.deserialize(node.s, new DeserializePluginContext(ctx, depth), { id: node.i }));
		}
	}
	throw new SerovalMissingPluginError(node.c);
}
function deserializePromiseConstructor(ctx, node) {
	const value = assignIndexedValue$1(ctx, node.i, assignIndexedValue$1(ctx, node.s, PROMISE_CONSTRUCTOR()).p);
	assignNodeType(ctx, node.s, 22);
	return value;
}
function deserializePromiseFulfill(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 22);
		const deserialized = deserialize$1(ctx, depth, node.a[1]);
		if (isThennable(deserialized)) throw new SerovalMalformedNodeError(node.a[1]);
		if (node.t === 23) deferred.s(deserialized);
		else deferred.f(deserialized);
		return;
	}
	throw new SerovalMissingInstanceError("Promise");
}
function deserializeIteratorFactoryInstance(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[0]);
	const source = deserialize$1(ctx, depth, node.a[1]);
	if (!source || typeof source !== "object" || !isSequence(source)) throw new SerovalMalformedNodeError(node.a[1]);
	return sequenceToIterator(source);
}
function deserializeAsyncIteratorFactoryInstance(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[0]);
	const source = deserialize$1(ctx, depth, node.a[1]);
	if (!source || typeof source !== "object" || !isStream(source)) throw new SerovalMalformedNodeError(node.a[1]);
	return streamToAsyncIterable(source);
}
function deserializeStreamConstructor(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, createStream());
	assignNodeType(ctx, node.i, 31);
	const items = node.a;
	const len = items.length;
	if (len) for (let i = 0; i < len; i++) deserialize$1(ctx, depth, items[i]);
	return result;
}
function deserializeStreamNext(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.next(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeStreamThrow(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.throw(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeStreamReturn(ctx, depth, node) {
	const deferred = ctx.base.refs.get(node.i);
	if (deferred) {
		validateNodeType(ctx, node, node.i, 31);
		deferred.return(deserialize$1(ctx, depth, node.f));
		return;
	}
	throw new SerovalMissingInstanceError("Stream");
}
function deserializeIteratorFactory(ctx, depth, node) {
	deserialize$1(ctx, depth, node.f);
}
function deserializeAsyncIteratorFactory(ctx, depth, node) {
	deserialize$1(ctx, depth, node.a[1]);
}
function deserializeSequence(ctx, depth, node) {
	const result = assignIndexedValue$1(ctx, node.i, createSequence([], node.s, node.l));
	for (let i = 0, len = node.a.length; i < len; i++) result.v[i] = deserialize$1(ctx, depth, node.a[i]);
	return result;
}
function deserialize$1(ctx, depth, node) {
	if (depth > ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	depth += 1;
	switch (node.t) {
		case 2: return deserializeKnownValue(node, CONSTANT_VAL, node.s);
		case 0: return Number(node.s);
		case 1: return deserializeString(String(node.s));
		case 3:
			if (String(node.s).length > MAX_BIGINT_LENGTH) throw new SerovalMalformedNodeError(node);
			return BigInt(node.s);
		case 4: return ctx.base.refs.get(node.i);
		case 18: return deserializeReference(ctx, node);
		case 9: return deserializeArray(ctx, depth, node);
		case 10:
		case 11: return deserializeObject(ctx, depth, node);
		case 5: return deserializeDate(ctx, node);
		case 6: return deserializeRegExp(ctx, node);
		case 7: return deserializeSet(ctx, depth, node);
		case 8: return deserializeMap(ctx, depth, node);
		case 19: return deserializeArrayBuffer(ctx, node);
		case 16:
		case 15: return deserializeTypedArray(ctx, depth, node);
		case 20: return deserializeDataView(ctx, depth, node);
		case 14: return deserializeAggregateError(ctx, depth, node);
		case 13: return deserializeError(ctx, depth, node);
		case 12: return deserializePromise(ctx, depth, node);
		case 17: return deserializeKnownValue(node, SYMBOL_REF, node.s);
		case 21: return deserializeBoxed(ctx, depth, node);
		case 25: return deserializePlugin(ctx, depth, node);
		case 22: return deserializePromiseConstructor(ctx, node);
		case 23:
		case 24: return deserializePromiseFulfill(ctx, depth, node);
		case 28: return deserializeIteratorFactoryInstance(ctx, depth, node);
		case 30: return deserializeAsyncIteratorFactoryInstance(ctx, depth, node);
		case 31: return deserializeStreamConstructor(ctx, depth, node);
		case 32: return deserializeStreamNext(ctx, depth, node);
		case 33: return deserializeStreamThrow(ctx, depth, node);
		case 34: return deserializeStreamReturn(ctx, depth, node);
		case 27: return deserializeIteratorFactory(ctx, depth, node);
		case 29: return deserializeAsyncIteratorFactory(ctx, depth, node);
		case 35: return deserializeSequence(ctx, depth, node);
		case 36: return deserializeTemporal(ctx, node);
		default: throw new SerovalUnsupportedNodeError(node);
	}
}
function deserializeTop(ctx, node) {
	try {
		return deserialize$1(ctx, 0, node);
	} catch (error) {
		throw new SerovalDeserializationError(error);
	}
}
var RETURN = () => T;
var SERIALIZED_RETURN = /* @__PURE__ */ RETURN.toString();
var IS_MODERN = /* @__PURE__ */ /=>/.test(SERIALIZED_RETURN);
function createFunction(parameters, body) {
	if (IS_MODERN) return (parameters.length === 1 ? parameters[0] : "(" + parameters.join(",") + ")") + "=>" + (body.startsWith("{") ? "(" + body + ")" : body);
	return "function(" + parameters.join(",") + "){return " + body + "}";
}
function createEffectfulFunction(parameters, body) {
	if (IS_MODERN) return (parameters.length === 1 ? parameters[0] : "(" + parameters.join(",") + ")") + "=>{" + body + "}";
	return "function(" + parameters.join(",") + "){" + body + "}";
}
var REF_START_CHARS = "hjkmoquxzABCDEFGHIJKLNPQRTUVWXYZ$_";
var REF_START_CHARS_LEN = 34;
var REF_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$_";
var REF_CHARS_LEN = 64;
function getIdentifier(index) {
	let mod = index % REF_START_CHARS_LEN;
	let ref = REF_START_CHARS[mod];
	index = (index - mod) / REF_START_CHARS_LEN;
	while (index > 0) {
		mod = index % REF_CHARS_LEN;
		ref += REF_CHARS[mod];
		index = (index - mod) / REF_CHARS_LEN;
	}
	return ref;
}
var IDENTIFIER_CHECK = /^[$A-Z_][0-9A-Z_$]*$/i;
function isValidIdentifier(name) {
	const char = name[0];
	return (char === "$" || char === "_" || char >= "A" && char <= "Z" || char >= "a" && char <= "z") && IDENTIFIER_CHECK.test(name);
}
function getAssignmentExpression(assignment) {
	switch (assignment.t) {
		case 0: return assignment.s + "=" + assignment.v;
		case 2: return assignment.s + ".set(" + assignment.k + "," + assignment.v + ")";
		case 1: return assignment.s + ".add(" + assignment.v + ")";
		case 3: return assignment.s + ".delete(" + assignment.k + ")";
		case 4: return "Object.defineProperty(" + assignment.s + ",\"__proto__\",{value:" + assignment.k + ",configurable:!0,enumerable:!0,writable:!0})";
	}
}
function mergeAssignments(assignments) {
	const newAssignments = [];
	let current = assignments[0];
	for (let i = 1, len = assignments.length, item, prev = current; i < len; i++) {
		item = assignments[i];
		if (item.t === 0 && item.v === prev.v) current = {
			t: 0,
			s: item.s,
			k: void 0,
			v: getAssignmentExpression(current)
		};
		else if (item.t === 2 && item.s === prev.s) current = {
			t: 2,
			s: getAssignmentExpression(current),
			k: item.k,
			v: item.v
		};
		else if (item.t === 1 && item.s === prev.s) current = {
			t: 1,
			s: getAssignmentExpression(current),
			k: void 0,
			v: item.v
		};
		else if (item.t === 3 && item.s === prev.s) current = {
			t: 3,
			s: getAssignmentExpression(current),
			k: item.k,
			v: void 0
		};
		else {
			newAssignments.push(current);
			current = item;
		}
		prev = item;
	}
	newAssignments.push(current);
	return newAssignments;
}
function resolveAssignments(assignments) {
	if (assignments.length) {
		let result = "";
		const merged = mergeAssignments(assignments);
		for (let i = 0, len = merged.length; i < len; i++) result += getAssignmentExpression(merged[i]) + ",";
		return result;
	}
}
var NULL_CONSTRUCTOR = "Object.create(null)";
var SET_CONSTRUCTOR = "new Set";
var MAP_CONSTRUCTOR = "new Map";
var PROMISE_RESOLVE = "Promise.resolve";
var PROMISE_REJECT = "Promise.reject";
var OBJECT_FLAG_CONSTRUCTOR = {
	[3]: "Object.freeze",
	[2]: "Object.seal",
	[1]: "Object.preventExtensions",
	[0]: void 0
};
function createBaseSerializerContext(mode, options) {
	return {
		mode,
		plugins: options.plugins,
		features: options.features,
		marked: new Set(options.markedRefs),
		stack: [],
		flags: [],
		assignments: []
	};
}
function createCrossSerializerContext(options) {
	return {
		mode: 2,
		base: createBaseSerializerContext(2, options),
		state: options,
		child: void 0
	};
}
var SerializePluginContext = class {
	constructor(_p) {
		this._p = _p;
	}
	serialize(node) {
		return serialize$1(this._p, node);
	}
};
function getVanillaRefParam(state, index) {
	let actualIndex = state.valid.get(index);
	if (actualIndex == null) {
		actualIndex = state.valid.size;
		state.valid.set(index, actualIndex);
	}
	let identifier = state.vars[actualIndex];
	if (identifier == null) {
		identifier = getIdentifier(actualIndex);
		state.vars[actualIndex] = identifier;
	}
	return identifier;
}
function getCrossRefParam(id) {
	return "$R[" + id + "]";
}
function getRefParam(ctx, id) {
	return ctx.mode === 1 ? getVanillaRefParam(ctx.state, id) : getCrossRefParam(id);
}
function markSerializerRef(ctx, id) {
	ctx.marked.add(id);
}
function isSerializerRefMarked(ctx, id) {
	return ctx.marked.has(id);
}
function pushObjectFlag(ctx, flag, id) {
	if (flag !== 0) {
		markSerializerRef(ctx.base, id);
		ctx.base.flags.push({
			type: flag,
			value: getRefParam(ctx, id)
		});
	}
}
function resolveFlags(ctx) {
	let result = "";
	for (let i = 0, current = ctx.flags, len = current.length; i < len; i++) {
		const flag = current[i];
		result += OBJECT_FLAG_CONSTRUCTOR[flag.type] + "(" + flag.value + "),";
	}
	return result;
}
function resolvePatches(ctx) {
	const assignments = resolveAssignments(ctx.assignments);
	const flags = resolveFlags(ctx);
	if (assignments) {
		if (flags) return assignments + flags;
		return assignments;
	}
	return flags;
}
function createAssignment(ctx, source, value) {
	ctx.assignments.push({
		t: 0,
		s: source,
		k: void 0,
		v: value
	});
}
function createAddAssignment(ctx, ref, value) {
	ctx.base.assignments.push({
		t: 1,
		s: getRefParam(ctx, ref),
		k: void 0,
		v: value
	});
}
function createSetAssignment(ctx, ref, key, value) {
	ctx.base.assignments.push({
		t: 2,
		s: getRefParam(ctx, ref),
		k: key,
		v: value
	});
}
function createDeleteAssignment(ctx, ref, key) {
	ctx.base.assignments.push({
		t: 3,
		s: getRefParam(ctx, ref),
		k: key,
		v: void 0
	});
}
function createArrayAssign(ctx, ref, index, value) {
	createAssignment(ctx.base, getRefParam(ctx, ref) + "[" + index + "]", value);
}
function createObjectAssign(ctx, ref, key, value) {
	if (!isValidKey(key)) {
		ctx.base.assignments.push({
			t: 4,
			s: getRefParam(ctx, ref),
			k: value,
			v: void 0
		});
		return;
	}
	createAssignment(ctx.base, getRefParam(ctx, ref) + "." + key, value);
}
function createSequenceAssign(ctx, ref, index, value) {
	createAssignment(ctx.base, getRefParam(ctx, ref) + ".v[" + index + "]", value);
}
function isIndexedValueInStack(ctx, node) {
	return node.t === 4 && ctx.stack.includes(node.i);
}
function assignIndexedValue(ctx, index, value) {
	if (ctx.mode === 1 && !isSerializerRefMarked(ctx.base, index)) return value;
	return getRefParam(ctx, index) + "=" + value;
}
function serializeReference(node) {
	return "__SEROVAL_REFS__.get(\"" + node.s + "\")";
}
function serializeArrayItem(ctx, id, item, index) {
	if (item) {
		if (isIndexedValueInStack(ctx.base, item)) {
			markSerializerRef(ctx.base, id);
			createArrayAssign(ctx, id, index, getRefParam(ctx, item.i));
			return "";
		}
		return serialize$1(ctx, item);
	}
	return "";
}
function serializeArray(ctx, node) {
	const id = node.i;
	const list = node.a;
	const len = list.length;
	if (len > 0) {
		ctx.base.stack.push(id);
		let values = serializeArrayItem(ctx, id, list[0], 0);
		let isHoley = values === "";
		for (let i = 1, item; i < len; i++) {
			item = serializeArrayItem(ctx, id, list[i], i);
			values += "," + item;
			isHoley = item === "";
		}
		ctx.base.stack.pop();
		pushObjectFlag(ctx, node.o, node.i);
		return "[" + values + (isHoley ? ",]" : "]");
	}
	return "[]";
}
function serializeProperty(ctx, source, key, val) {
	if (typeof key === "string") {
		const check = Number(key);
		const isIdentifier = check >= 0 && check.toString() === key || isValidIdentifier(key);
		if (isIndexedValueInStack(ctx.base, val)) {
			const refParam = getRefParam(ctx, val.i);
			markSerializerRef(ctx.base, source.i);
			if (isIdentifier && check !== check) createObjectAssign(ctx, source.i, key, refParam);
			else createArrayAssign(ctx, source.i, isIdentifier ? key : "\"" + key + "\"", refParam);
			return "";
		}
		if (isValidKey(key)) return (isIdentifier ? key : "\"" + key + "\"") + ":" + serialize$1(ctx, val);
		return "[\"" + key + "\"]:" + serialize$1(ctx, val);
	}
	return "[" + serialize$1(ctx, key) + "]:" + serialize$1(ctx, val);
}
function serializeProperties(ctx, source, record) {
	const keys = record.k;
	const len = keys.length;
	if (len > 0) {
		const values = record.v;
		ctx.base.stack.push(source.i);
		let result = serializeProperty(ctx, source, keys[0], values[0]);
		for (let i = 1, item = result; i < len; i++) {
			item = serializeProperty(ctx, source, keys[i], values[i]);
			result += (item && result && ",") + item;
		}
		ctx.base.stack.pop();
		return "{" + result + "}";
	}
	return "{}";
}
function serializeObject(ctx, node) {
	pushObjectFlag(ctx, node.o, node.i);
	return serializeProperties(ctx, node, node.p);
}
function serializeWithObjectAssign(ctx, source, value, serialized) {
	const fields = serializeProperties(ctx, source, value);
	if (fields !== "{}") return "Object.assign(" + serialized + "," + fields + ")";
	return serialized;
}
function serializeStringKeyAssignment(ctx, source, mainAssignments, key, value) {
	const base = ctx.base;
	const serialized = serialize$1(ctx, value);
	const check = Number(key);
	const isIdentifier = check >= 0 && check.toString() === key || isValidIdentifier(key);
	if (isIndexedValueInStack(base, value)) if (isIdentifier && check !== check) createObjectAssign(ctx, source.i, key, serialized);
	else createArrayAssign(ctx, source.i, isIdentifier ? key : "\"" + key + "\"", serialized);
	else {
		const parentAssignment = base.assignments;
		base.assignments = mainAssignments;
		if (isIdentifier && check !== check) createObjectAssign(ctx, source.i, key, serialized);
		else createArrayAssign(ctx, source.i, isIdentifier ? key : "\"" + key + "\"", serialized);
		base.assignments = parentAssignment;
	}
}
function serializeAssignment(ctx, source, mainAssignments, key, value) {
	if (typeof key === "string") serializeStringKeyAssignment(ctx, source, mainAssignments, key, value);
	else {
		const base = ctx.base;
		const parent = base.stack;
		base.stack = [];
		const serialized = serialize$1(ctx, value);
		base.stack = parent;
		const parentAssignment = base.assignments;
		base.assignments = mainAssignments;
		createArrayAssign(ctx, source.i, serialize$1(ctx, key), serialized);
		base.assignments = parentAssignment;
	}
}
function serializeAssignments(ctx, source, node) {
	const keys = node.k;
	const len = keys.length;
	if (len > 0) {
		const mainAssignments = [];
		const values = node.v;
		ctx.base.stack.push(source.i);
		for (let i = 0; i < len; i++) serializeAssignment(ctx, source, mainAssignments, keys[i], values[i]);
		ctx.base.stack.pop();
		return resolveAssignments(mainAssignments);
	}
}
function serializeDictionary(ctx, node, init) {
	if (node.p) {
		const base = ctx.base;
		if (base.features & 8) init = serializeWithObjectAssign(ctx, node, node.p, init);
		else {
			markSerializerRef(base, node.i);
			const assignments = serializeAssignments(ctx, node, node.p);
			if (assignments) return "(" + assignIndexedValue(ctx, node.i, init) + "," + assignments + getRefParam(ctx, node.i) + ")";
		}
	}
	return init;
}
function serializeNullConstructor(ctx, node) {
	pushObjectFlag(ctx, node.o, node.i);
	return serializeDictionary(ctx, node, NULL_CONSTRUCTOR);
}
function serializeDate(node) {
	return "new Date(\"" + node.s + "\")";
}
var TEMPORAL_CONSTRUCTOR = {
	[0]: "Temporal.Instant",
	[1]: "Temporal.Duration",
	[2]: "Temporal.PlainDate",
	[3]: "Temporal.PlainDateTime",
	[4]: "Temporal.PlainMonthDay",
	[5]: "Temporal.PlainTime",
	[6]: "Temporal.PlainYearMonth",
	[7]: "Temporal.ZonedDateTime"
};
function serializeTemporal(ctx, node) {
	if (ctx.base.features & 64) return TEMPORAL_CONSTRUCTOR[node.c] + ".from(\"" + node.s + "\")";
	throw new SerovalUnsupportedNodeError(node);
}
function serializeRegExp(ctx, node) {
	if (ctx.base.features & 32) return "/" + deserializeString(node.c) + "/" + node.m;
	throw new SerovalUnsupportedNodeError(node);
}
function serializeSetItem(ctx, id, item) {
	const base = ctx.base;
	if (isIndexedValueInStack(base, item)) {
		markSerializerRef(base, id);
		createAddAssignment(ctx, id, getRefParam(ctx, item.i));
		return "";
	}
	return serialize$1(ctx, item);
}
function serializeSet(ctx, node) {
	let serialized = SET_CONSTRUCTOR;
	const items = node.a;
	const size = items.length;
	const id = node.i;
	if (size > 0) {
		ctx.base.stack.push(id);
		let result = serializeSetItem(ctx, id, items[0]);
		for (let i = 1, item = result; i < size; i++) {
			item = serializeSetItem(ctx, id, items[i]);
			result += (item && result && ",") + item;
		}
		ctx.base.stack.pop();
		if (result) serialized += "([" + result + "])";
	}
	return serialized;
}
function serializeMapEntry(ctx, id, key, val, sentinel) {
	const base = ctx.base;
	if (isIndexedValueInStack(base, key)) {
		const keyRef = getRefParam(ctx, key.i);
		markSerializerRef(base, id);
		if (isIndexedValueInStack(base, val)) {
			createSetAssignment(ctx, id, keyRef, getRefParam(ctx, val.i));
			return "";
		}
		if (val.t !== 4 && val.i != null && isSerializerRefMarked(base, val.i)) {
			const serialized = "(" + serialize$1(ctx, val) + ",[" + sentinel + "," + sentinel + "])";
			createSetAssignment(ctx, id, keyRef, getRefParam(ctx, val.i));
			createDeleteAssignment(ctx, id, sentinel);
			return serialized;
		}
		const parent = base.stack;
		base.stack = [];
		createSetAssignment(ctx, id, keyRef, serialize$1(ctx, val));
		base.stack = parent;
		return "";
	}
	if (isIndexedValueInStack(base, val)) {
		const valueRef = getRefParam(ctx, val.i);
		markSerializerRef(base, id);
		if (key.t !== 4 && key.i != null && isSerializerRefMarked(base, key.i)) {
			const serialized = "(" + serialize$1(ctx, key) + ",[" + sentinel + "," + sentinel + "])";
			createSetAssignment(ctx, id, getRefParam(ctx, key.i), valueRef);
			createDeleteAssignment(ctx, id, sentinel);
			return serialized;
		}
		const parent = base.stack;
		base.stack = [];
		createSetAssignment(ctx, id, serialize$1(ctx, key), valueRef);
		base.stack = parent;
		return "";
	}
	return "[" + serialize$1(ctx, key) + "," + serialize$1(ctx, val) + "]";
}
function serializeMap(ctx, node) {
	let serialized = MAP_CONSTRUCTOR;
	const keys = node.e.k;
	const size = keys.length;
	const id = node.i;
	const sentinel = node.f;
	const sentinelId = getRefParam(ctx, sentinel.i);
	const base = ctx.base;
	if (size > 0) {
		const vals = node.e.v;
		base.stack.push(id);
		let result = serializeMapEntry(ctx, id, keys[0], vals[0], sentinelId);
		for (let i = 1, item = result; i < size; i++) {
			item = serializeMapEntry(ctx, id, keys[i], vals[i], sentinelId);
			result += (item && result && ",") + item;
		}
		base.stack.pop();
		if (result) serialized += "([" + result + "])";
	}
	if (sentinel.t === 26) {
		markSerializerRef(base, sentinel.i);
		serialized = "(" + serialize$1(ctx, sentinel) + "," + serialized + ")";
	}
	return serialized;
}
function serializeArrayBuffer(ctx, node) {
	return getConstructor(ctx, node.f) + "(\"" + node.s + "\")";
}
function serializeTypedArray(ctx, node) {
	return "new " + node.c + "(" + serialize$1(ctx, node.f) + "," + node.b + "," + node.l + ")";
}
function serializeDataView(ctx, node) {
	return "new DataView(" + serialize$1(ctx, node.f) + "," + node.b + "," + node.l + ")";
}
function serializeAggregateError(ctx, node) {
	const id = node.i;
	ctx.base.stack.push(id);
	const serialized = serializeDictionary(ctx, node, "new AggregateError([],\"" + node.m + "\")");
	ctx.base.stack.pop();
	return serialized;
}
function serializeError(ctx, node) {
	return serializeDictionary(ctx, node, "new " + ERROR_CONSTRUCTOR_STRING[node.s] + "(\"" + node.m + "\")");
}
function serializePromise(ctx, node) {
	let serialized;
	const fulfilled = node.f;
	const id = node.i;
	const promiseConstructor = node.s ? PROMISE_RESOLVE : PROMISE_REJECT;
	const base = ctx.base;
	if (isIndexedValueInStack(base, fulfilled)) {
		const ref = getRefParam(ctx, fulfilled.i);
		serialized = promiseConstructor + (node.s ? "().then(" + createFunction([], ref) + ")" : "().catch(" + createEffectfulFunction([], "throw " + ref) + ")");
	} else {
		base.stack.push(id);
		const result = serialize$1(ctx, fulfilled);
		base.stack.pop();
		serialized = promiseConstructor + "(" + result + ")";
	}
	return serialized;
}
function serializeBoxed(ctx, node) {
	return "Object(" + serialize$1(ctx, node.f) + ")";
}
function getConstructor(ctx, node) {
	const current = serialize$1(ctx, node);
	return node.t === 4 ? current : "(" + current + ")";
}
function serializePromiseConstructor(ctx, node) {
	if (ctx.mode === 1) throw new SerovalUnsupportedNodeError(node);
	return "(" + assignIndexedValue(ctx, node.s, getConstructor(ctx, node.f) + "()") + ").p";
}
function serializePromiseResolve(ctx, node) {
	if (ctx.mode === 1) throw new SerovalUnsupportedNodeError(node);
	return getConstructor(ctx, node.a[0]) + "(" + getRefParam(ctx, node.i) + "," + serialize$1(ctx, node.a[1]) + ")";
}
function serializePromiseReject(ctx, node) {
	if (ctx.mode === 1) throw new SerovalUnsupportedNodeError(node);
	return getConstructor(ctx, node.a[0]) + "(" + getRefParam(ctx, node.i) + "," + serialize$1(ctx, node.a[1]) + ")";
}
function serializePlugin(ctx, node) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.tag === node.c) {
			if (ctx.child == null) ctx.child = new SerializePluginContext(ctx);
			return plugin.serialize(node.s, ctx.child, { id: node.i });
		}
	}
	throw new SerovalMissingPluginError(node.c);
}
function serializeIteratorFactory(ctx, node) {
	let result = "";
	let initialized = false;
	if (node.f.t !== 4) {
		markSerializerRef(ctx.base, node.f.i);
		result = "(" + serialize$1(ctx, node.f) + ",";
		initialized = true;
	}
	result += assignIndexedValue(ctx, node.i, "(" + SERIALIZED_ITERATOR_CONSTRUCTOR + ")(" + getRefParam(ctx, node.f.i) + ")");
	if (initialized) result += ")";
	return result;
}
function serializeIteratorFactoryInstance(ctx, node) {
	return getConstructor(ctx, node.a[0]) + "(" + serialize$1(ctx, node.a[1]) + ")";
}
function serializeAsyncIteratorFactory(ctx, node) {
	const promise = node.a[0];
	const symbol = node.a[1];
	const base = ctx.base;
	let result = "";
	if (promise.t !== 4) {
		markSerializerRef(base, promise.i);
		result += "(" + serialize$1(ctx, promise);
	}
	if (symbol.t !== 4) {
		markSerializerRef(base, symbol.i);
		result += (result ? "," : "(") + serialize$1(ctx, symbol);
	}
	if (result) result += ",";
	const iterator = assignIndexedValue(ctx, node.i, "(" + SERIALIZED_ASYNC_ITERATOR_CONSTRUCTOR + ")(" + getRefParam(ctx, symbol.i) + "," + getRefParam(ctx, promise.i) + ")");
	if (result) return result + iterator + ")";
	return iterator;
}
function serializeAsyncIteratorFactoryInstance(ctx, node) {
	return getConstructor(ctx, node.a[0]) + "(" + serialize$1(ctx, node.a[1]) + ")";
}
function serializeStreamConstructor(ctx, node) {
	const result = assignIndexedValue(ctx, node.i, getConstructor(ctx, node.f) + "()");
	const len = node.a.length;
	if (len) {
		let values = serialize$1(ctx, node.a[0]);
		for (let i = 1; i < len; i++) values += "," + serialize$1(ctx, node.a[i]);
		return "(" + result + "," + values + "," + getRefParam(ctx, node.i) + ")";
	}
	return result;
}
function serializeStreamNext(ctx, node) {
	return getRefParam(ctx, node.i) + ".next(" + serialize$1(ctx, node.f) + ")";
}
function serializeStreamThrow(ctx, node) {
	return getRefParam(ctx, node.i) + ".throw(" + serialize$1(ctx, node.f) + ")";
}
function serializeStreamReturn(ctx, node) {
	return getRefParam(ctx, node.i) + ".return(" + serialize$1(ctx, node.f) + ")";
}
function serializeSequenceItem(ctx, id, index, item) {
	const base = ctx.base;
	if (isIndexedValueInStack(base, item)) {
		markSerializerRef(base, id);
		createSequenceAssign(ctx, id, index, getRefParam(ctx, item.i));
		return "";
	}
	return serialize$1(ctx, item);
}
function serializeSequence(ctx, node) {
	const items = node.a;
	const size = items.length;
	const id = node.i;
	if (size > 0) {
		ctx.base.stack.push(id);
		let result = serializeSequenceItem(ctx, id, 0, items[0]);
		for (let i = 1, item = result; i < size; i++) {
			item = serializeSequenceItem(ctx, id, i, items[i]);
			result += (item && result && ",") + item;
		}
		ctx.base.stack.pop();
		if (result) return "{__SEROVAL_SEQUENCE__:!0,v:[" + result + "],t:" + node.s + ",d:" + node.l + "}";
	}
	return "{__SEROVAL_SEQUENCE__:!0,v:[],t:-1,d:0}";
}
function serializeAssignable(ctx, node) {
	switch (node.t) {
		case 17: return SYMBOL_STRING[node.s];
		case 18: return serializeReference(node);
		case 9: return serializeArray(ctx, node);
		case 10: return serializeObject(ctx, node);
		case 11: return serializeNullConstructor(ctx, node);
		case 5: return serializeDate(node);
		case 6: return serializeRegExp(ctx, node);
		case 7: return serializeSet(ctx, node);
		case 8: return serializeMap(ctx, node);
		case 19: return serializeArrayBuffer(ctx, node);
		case 16:
		case 15: return serializeTypedArray(ctx, node);
		case 20: return serializeDataView(ctx, node);
		case 14: return serializeAggregateError(ctx, node);
		case 13: return serializeError(ctx, node);
		case 12: return serializePromise(ctx, node);
		case 21: return serializeBoxed(ctx, node);
		case 22: return serializePromiseConstructor(ctx, node);
		case 25: return serializePlugin(ctx, node);
		case 26: return SPECIAL_REF_STRING[node.s];
		case 35: return serializeSequence(ctx, node);
		case 36: return serializeTemporal(ctx, node);
		default: throw new SerovalUnsupportedNodeError(node);
	}
}
function serialize$1(ctx, node) {
	switch (node.t) {
		case 2: return CONSTANT_STRING[node.s];
		case 0: return "" + node.s;
		case 1: return "\"" + node.s + "\"";
		case 3: return node.s + "n";
		case 4: return getRefParam(ctx, node.i);
		case 23: return serializePromiseResolve(ctx, node);
		case 24: return serializePromiseReject(ctx, node);
		case 27: return serializeIteratorFactory(ctx, node);
		case 28: return serializeIteratorFactoryInstance(ctx, node);
		case 29: return serializeAsyncIteratorFactory(ctx, node);
		case 30: return serializeAsyncIteratorFactoryInstance(ctx, node);
		case 31: return serializeStreamConstructor(ctx, node);
		case 32: return serializeStreamNext(ctx, node);
		case 33: return serializeStreamThrow(ctx, node);
		case 34: return serializeStreamReturn(ctx, node);
		default: return assignIndexedValue(ctx, node.i, serializeAssignable(ctx, node));
	}
}
function serializeTopCross(ctx, tree) {
	const result = serialize$1(ctx, tree);
	const id = tree.i;
	if (id == null) return result;
	const patches = resolvePatches(ctx.base);
	const ref = getRefParam(ctx, id);
	const scopeId = ctx.state.scopeId;
	const params = scopeId == null ? "" : "$R";
	const body = patches ? "(" + result + "," + patches + ref + ")" : result;
	if (params === "") {
		if (tree.t === 10 && !patches) return "(" + body + ")";
		return body;
	}
	const args = scopeId == null ? "()" : "($R[\"" + serializeString(scopeId) + "\"])";
	return "(" + createFunction([params], body) + ")" + args;
}
var SyncParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseSOS(this._p, this.depth, current);
	}
};
var StreamParsePluginContext = class {
	constructor(_p, depth) {
		this._p = _p;
		this.depth = depth;
	}
	parse(current) {
		return parseSOS(this._p, this.depth, current);
	}
	parseWithError(current) {
		return parseWithError(this._p, this.depth, current);
	}
	isAlive() {
		return this._p.state.alive;
	}
	pushPendingState() {
		pushPendingState(this._p);
	}
	popPendingState() {
		popPendingState(this._p);
	}
	onParse(node) {
		onParse(this._p, node);
	}
	onError(error) {
		onError$1(this._p, error);
	}
	addCleanup(callback) {
		this._p.state.cleanups.push(callback);
	}
};
function createStreamParserState(options) {
	return {
		alive: true,
		pending: 0,
		initial: true,
		buffer: [],
		onParse: options.onParse,
		onError: options.onError,
		onDone: options.onDone,
		cleanups: []
	};
}
function createStreamParserContext(options) {
	return {
		type: 2,
		base: createBaseParserContext(2, options),
		state: createStreamParserState(options)
	};
}
function parseItems(ctx, depth, current) {
	const nodes = [];
	for (let i = 0, len = current.length; i < len; i++) if (i in current) nodes[i] = parseSOS(ctx, depth, current[i]);
	else nodes[i] = 0;
	return nodes;
}
function parseArray(ctx, depth, id, current) {
	return createArrayNode(id, current, parseItems(ctx, depth, current));
}
function parseProperties(ctx, depth, properties) {
	const entries = Object.entries(properties);
	const keyNodes = [];
	const valueNodes = [];
	for (let i = 0, len = entries.length; i < len; i++) {
		keyNodes.push(serializeString(entries[i][0]));
		valueNodes.push(parseSOS(ctx, depth, entries[i][1]));
	}
	if (SYM_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ITERATOR));
		valueNodes.push(createIteratorFactoryInstanceNode(parseIteratorFactory(ctx.base), parseSOS(ctx, depth, createSequenceFromIterable(properties))));
	}
	if (SYM_ASYNC_ITERATOR in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_ASYNC_ITERATOR));
		valueNodes.push(createAsyncIteratorFactoryInstanceNode(parseAsyncIteratorFactory(ctx.base), parseSOS(ctx, depth, ctx.type === 1 ? createStream() : createStreamFromAsyncIterable(properties))));
	}
	if (SYM_TO_STRING_TAG in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_TO_STRING_TAG));
		valueNodes.push(createStringNode(properties[SYM_TO_STRING_TAG]));
	}
	if (SYM_IS_CONCAT_SPREADABLE in properties) {
		keyNodes.push(parseWellKnownSymbol(ctx.base, SYM_IS_CONCAT_SPREADABLE));
		valueNodes.push(properties[SYM_IS_CONCAT_SPREADABLE] ? TRUE_NODE : FALSE_NODE);
	}
	return {
		k: keyNodes,
		v: valueNodes
	};
}
function parsePlainObject(ctx, depth, id, current, empty) {
	return createObjectNode(id, current, empty, parseProperties(ctx, depth, current));
}
function parseBoxed(ctx, depth, id, current) {
	return createBoxedNode(id, parseSOS(ctx, depth, current.valueOf()));
}
function parseTypedArray(ctx, depth, id, current) {
	return createTypedArrayNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseBigIntTypedArray(ctx, depth, id, current) {
	return createBigIntTypedArrayNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseDataView(ctx, depth, id, current) {
	return createDataViewNode(id, current, parseSOS(ctx, depth, current.buffer));
}
function parseError(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createErrorNode(id, current, options ? parseProperties(ctx, depth, options) : void 0);
}
function parseAggregateError(ctx, depth, id, current) {
	const options = getErrorOptions(current, ctx.base.features);
	return createAggregateErrorNode(id, current, options ? parseProperties(ctx, depth, options) : void 0);
}
function parseMap(ctx, depth, id, current) {
	const keyNodes = [];
	const valueNodes = [];
	for (const [key, value] of current.entries()) {
		keyNodes.push(parseSOS(ctx, depth, key));
		valueNodes.push(parseSOS(ctx, depth, value));
	}
	return createMapNode(ctx.base, id, keyNodes, valueNodes);
}
function parseSet(ctx, depth, id, current) {
	const items = [];
	for (const item of current.keys()) items.push(parseSOS(ctx, depth, item));
	return createSetNode(id, items);
}
function parseStream(ctx, depth, id, current) {
	const result = createStreamConstructorNode(id, parseSpecialReference(ctx.base, 4), []);
	if (ctx.type === 1) return result;
	pushPendingState(ctx);
	current.on({
		next: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamNextNode(id, parsed));
			}
		},
		throw: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamThrowNode(id, parsed));
			}
			popPendingState(ctx);
		},
		return: (value) => {
			if (ctx.state.alive) {
				const parsed = parseWithError(ctx, depth, value);
				if (parsed) onParse(ctx, createStreamReturnNode(id, parsed));
			}
			popPendingState(ctx);
		}
	});
	return result;
}
function handlePromiseSuccess(id, depth, data) {
	if (this.state.alive) {
		const parsed = parseWithError(this, depth, data);
		if (parsed) onParse(this, createSerovalNode(23, id, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(this.base, 2), parsed], void 0, void 0, void 0, void 0));
		popPendingState(this);
	}
}
function handlePromiseFailure(id, depth, data) {
	if (this.state.alive) {
		const parsed = parseWithError(this, depth, data);
		if (parsed) onParse(this, createSerovalNode(24, id, void 0, void 0, void 0, void 0, void 0, [parseSpecialReference(this.base, 3), parsed], void 0, void 0, void 0, void 0));
	}
	popPendingState(this);
}
function parsePromise(ctx, depth, id, current) {
	const resolver = createIndexForValue(ctx.base, {});
	if (ctx.type === 2) {
		pushPendingState(ctx);
		current.then(handlePromiseSuccess.bind(ctx, resolver, depth), handlePromiseFailure.bind(ctx, resolver, depth));
	}
	return createPromiseConstructorNode(ctx.base, id, resolver);
}
function parsePluginSync(ctx, depth, id, current, currentPlugins) {
	for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.sync && plugin.test(current)) return createPluginNode(id, plugin.tag, plugin.parse.sync(current, new SyncParsePluginContext(ctx, depth), { id }));
	}
}
function parsePluginStream(ctx, depth, id, current, currentPlugins) {
	for (let i = 0, len = currentPlugins.length; i < len; i++) {
		const plugin = currentPlugins[i];
		if (plugin.parse.stream && plugin.test(current)) return createPluginNode(id, plugin.tag, plugin.parse.stream(current, new StreamParsePluginContext(ctx, depth), { id }));
	}
}
function parsePlugin(ctx, depth, id, current) {
	const currentPlugins = ctx.base.plugins;
	if (currentPlugins) return ctx.type === 1 ? parsePluginSync(ctx, depth, id, current, currentPlugins) : parsePluginStream(ctx, depth, id, current, currentPlugins);
}
function parseSequence(ctx, depth, id, current) {
	const nodes = [];
	for (let i = 0, len = current.v.length; i < len; i++) nodes[i] = parseSOS(ctx, depth, current.v[i]);
	return createSequenceNode(id, nodes, current.t, current.d);
}
function parseObjectPhase2(ctx, depth, id, current, currentClass) {
	switch (currentClass) {
		case Object: return parsePlainObject(ctx, depth, id, current, false);
		case void 0: return parsePlainObject(ctx, depth, id, current, true);
		case Date: return createDateNode(id, current);
		case Error:
		case EvalError:
		case RangeError:
		case ReferenceError:
		case SyntaxError:
		case TypeError:
		case URIError: return parseError(ctx, depth, id, current);
		case Number:
		case Boolean:
		case String:
		case BigInt: return parseBoxed(ctx, depth, id, current);
		case ArrayBuffer: return createArrayBufferNode(ctx.base, id, current);
		case Int8Array:
		case Int16Array:
		case Int32Array:
		case Uint8Array:
		case Uint16Array:
		case Uint32Array:
		case Uint8ClampedArray:
		case Float32Array:
		case Float64Array: return parseTypedArray(ctx, depth, id, current);
		case DataView: return parseDataView(ctx, depth, id, current);
		case Map: return parseMap(ctx, depth, id, current);
		case Set: return parseSet(ctx, depth, id, current);
	}
	if (currentClass === Promise || current instanceof Promise) return parsePromise(ctx, depth, id, current);
	const currentFeatures = ctx.base.features;
	if (currentFeatures & 32 && currentClass === RegExp) return createRegExpNode(id, current);
	if (currentFeatures & 16) switch (currentClass) {
		case BigInt64Array:
		case BigUint64Array: return parseBigIntTypedArray(ctx, depth, id, current);
	}
	if (currentFeatures & 1 && typeof AggregateError !== "undefined" && (currentClass === AggregateError || current instanceof AggregateError)) return parseAggregateError(ctx, depth, id, current);
	if (currentFeatures & 64 && typeof Temporal !== "undefined") switch (currentClass) {
		case Temporal.Instant: return createTemporalNode(id, 0, current);
		case Temporal.Duration: return createTemporalNode(id, 1, current);
		case Temporal.PlainDate: return createTemporalNode(id, 2, current);
		case Temporal.PlainDateTime: return createTemporalNode(id, 3, current);
		case Temporal.PlainMonthDay: return createTemporalNode(id, 4, current);
		case Temporal.PlainTime: return createTemporalNode(id, 5, current);
		case Temporal.PlainYearMonth: return createTemporalNode(id, 6, current);
		case Temporal.ZonedDateTime: return createTemporalNode(id, 7, current);
	}
	if (current instanceof Error) return parseError(ctx, depth, id, current);
	if (SYM_ITERATOR in current || SYM_ASYNC_ITERATOR in current) return parsePlainObject(ctx, depth, id, current, !!currentClass);
	throw new SerovalUnsupportedTypeError(current);
}
function parseObject(ctx, depth, id, current) {
	if (Array.isArray(current)) return parseArray(ctx, depth, id, current);
	if (isStream(current)) return parseStream(ctx, depth, id, current);
	if (isSequence(current)) return parseSequence(ctx, depth, id, current);
	let currentClass = current.constructor;
	if (currentClass !== void 0 && typeof currentClass !== "function") {
		const proto = Object.getPrototypeOf(current);
		currentClass = proto === null ? void 0 : proto.constructor;
	}
	if (currentClass === OpaqueReference) return parseSOS(ctx, depth, current.replacement);
	const parsed = parsePlugin(ctx, depth, id, current);
	if (parsed) return parsed;
	return parseObjectPhase2(ctx, depth, id, current, currentClass);
}
function parseFunction(ctx, depth, current) {
	const ref = getReferenceNode(ctx.base, current);
	if (ref.type !== 0) return ref.value;
	const plugin = parsePlugin(ctx, depth, ref.value, current);
	if (plugin) return plugin;
	throw new SerovalUnsupportedTypeError(current);
}
function parseSOS(ctx, depth, current) {
	if (depth >= ctx.base.depthLimit) throw new SerovalDepthLimitError(ctx.base.depthLimit);
	switch (typeof current) {
		case "boolean": return current ? TRUE_NODE : FALSE_NODE;
		case "undefined": return UNDEFINED_NODE;
		case "string": return createStringNode(current);
		case "number": return createNumberNode(current);
		case "bigint": return createBigIntNode(current);
		case "object":
			if (current) {
				const ref = getReferenceNode(ctx.base, current);
				return ref.type === 0 ? parseObject(ctx, depth + 1, ref.value, current) : ref.value;
			}
			return NULL_NODE;
		case "symbol": return parseWellKnownSymbol(ctx.base, current);
		case "function": return parseFunction(ctx, depth, current);
		default: throw new SerovalUnsupportedTypeError(current);
	}
}
function onParse(ctx, node) {
	if (ctx.state.initial) ctx.state.buffer.push(node);
	else onParseInternal(ctx, node, false);
}
function onError$1(ctx, error) {
	if (ctx.state.onError) ctx.state.onError(error);
	else throw error instanceof SerovalParserError ? error : new SerovalParserError(error);
}
function onDone(ctx) {
	if (ctx.state.onDone) ctx.state.onDone();
	for (let i = 0, len = ctx.state.cleanups.length; i < len; i++) ctx.state.cleanups[i]();
}
function onParseInternal(ctx, node, initial) {
	try {
		ctx.state.onParse(node, initial);
	} catch (error) {
		onError$1(ctx, error);
	}
}
function pushPendingState(ctx) {
	ctx.state.pending++;
}
function popPendingState(ctx) {
	if (--ctx.state.pending <= 0) onDone(ctx);
}
function parseWithError(ctx, depth, current) {
	try {
		return parseSOS(ctx, depth, current);
	} catch (err) {
		onError$1(ctx, err);
		return;
	}
}
function startStreamParse(ctx, current) {
	const parsed = parseWithError(ctx, 0, current);
	if (parsed) {
		onParseInternal(ctx, parsed, true);
		ctx.state.initial = false;
		flushStreamParse(ctx, ctx.state);
		if (ctx.state.pending <= 0) destroyStreamParse(ctx);
	}
}
function flushStreamParse(ctx, state) {
	for (let i = 0, len = state.buffer.length; i < len; i++) onParseInternal(ctx, state.buffer[i], false);
}
function destroyStreamParse(ctx) {
	if (ctx.state.alive) {
		onDone(ctx);
		ctx.state.alive = false;
	}
}
async function toCrossJSONAsync(source, options = {}) {
	return await parseTopAsync(createAsyncParserContext(2, {
		plugins: resolvePlugins(options.plugins),
		disabledFeatures: options.disabledFeatures,
		refs: options.refs
	}), source);
}
function crossSerializeStream(source, options) {
	const plugins = resolvePlugins(options.plugins);
	const ctx = createStreamParserContext({
		plugins,
		refs: options.refs,
		disabledFeatures: options.disabledFeatures,
		onParse(node, initial) {
			const serial = createCrossSerializerContext({
				plugins,
				features: ctx.base.features,
				scopeId: options.scopeId,
				markedRefs: ctx.base.marked
			});
			let serialized;
			try {
				serialized = serializeTopCross(serial, node);
			} catch (err) {
				if (options.onError) options.onError(err);
				return;
			}
			options.onSerialize(serialized, initial);
		},
		onError: options.onError,
		onDone: options.onDone
	});
	startStreamParse(ctx, source);
	return destroyStreamParse.bind(null, ctx);
}
function toCrossJSONStream(source, options) {
	const ctx = createStreamParserContext({
		plugins: resolvePlugins(options.plugins),
		refs: options.refs,
		disabledFeatures: options.disabledFeatures,
		depthLimit: options.depthLimit,
		onParse: options.onParse,
		onError: options.onError,
		onDone: options.onDone
	});
	startStreamParse(ctx, source);
	return destroyStreamParse.bind(null, ctx);
}
function fromJSON(source, options = {}) {
	var _source$f;
	const plugins = resolvePlugins(options.plugins);
	const disabledFeatures = options.disabledFeatures || 0;
	const sourceFeatures = (_source$f = source.f) !== null && _source$f !== void 0 ? _source$f : 127;
	return deserializeTop(createVanillaDeserializerContext({
		plugins,
		markedRefs: source.m,
		features: sourceFeatures & ~disabledFeatures,
		disabledFeatures
	}), source.t);
}
function createSerializationAdapter(opts) {
	return opts;
}
/* @__NO_SIDE_EFFECTS__ */
function makeSsrSerovalPlugin(serializationAdapter, options) {
	return /* @__PURE__ */ createPlugin({
		tag: "$TSR/t/" + serializationAdapter.key,
		test: serializationAdapter.test,
		parse: { stream(value, ctx, _data) {
			return { v: ctx.parse(serializationAdapter.toSerializable(value)) };
		} },
		serialize(node, ctx, _data) {
			options.didRun = true;
			return GLOBAL_TSR + ".t.get(\"" + serializationAdapter.key + "\")(" + ctx.serialize(node.v) + ")";
		},
		deserialize: void 0
	});
}
/* @__NO_SIDE_EFFECTS__ */
function makeSerovalPlugin(serializationAdapter) {
	return /* @__PURE__ */ createPlugin({
		tag: "$TSR/t/" + serializationAdapter.key,
		test: serializationAdapter.test,
		parse: {
			sync(value, ctx, _data) {
				return { v: ctx.parse(serializationAdapter.toSerializable(value)) };
			},
			async async(value, ctx, _data) {
				return { v: await ctx.parse(serializationAdapter.toSerializable(value)) };
			},
			stream(value, ctx, _data) {
				return { v: ctx.parse(serializationAdapter.toSerializable(value)) };
			}
		},
		serialize: void 0,
		deserialize(node, ctx, _data) {
			return serializationAdapter.fromSerializable(ctx.deserialize(node.v));
		}
	});
}
var RawStream = class {
	constructor(stream$1, options) {
		this.stream = stream$1;
		this.hint = options?.hint ?? "binary";
	}
};
var BufferCtor = globalThis.Buffer;
var hasNodeBuffer = !!BufferCtor && typeof BufferCtor.from === "function";
function uint8ArrayToBase64(bytes) {
	if (bytes.length === 0) return "";
	if (hasNodeBuffer) return BufferCtor.from(bytes).toString("base64");
	const CHUNK_SIZE = 32768;
	const chunks = [];
	for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
		const chunk = bytes.subarray(i, i + CHUNK_SIZE);
		chunks.push(String.fromCharCode.apply(null, chunk));
	}
	return btoa(chunks.join(""));
}
function base64ToUint8Array(base64) {
	if (base64.length === 0) return new Uint8Array(0);
	if (hasNodeBuffer) {
		const buf = BufferCtor.from(base64, "base64");
		return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
var RAW_STREAM_FACTORY_BINARY = Object.create(null);
var RAW_STREAM_FACTORY_TEXT = Object.create(null);
var RAW_STREAM_FACTORY_CONSTRUCTOR_BINARY = (stream$1) => new ReadableStream({ start(controller) {
	stream$1.on({
		next(base64) {
			try {
				controller.enqueue(base64ToUint8Array(base64));
			} catch {}
		},
		throw(error) {
			controller.error(error);
		},
		return() {
			try {
				controller.close();
			} catch {}
		}
	});
} });
var textEncoderForFactory = new TextEncoder();
var RAW_STREAM_FACTORY_CONSTRUCTOR_TEXT = (stream$1) => {
	return new ReadableStream({ start(controller) {
		stream$1.on({
			next(value) {
				try {
					if (typeof value === "string") controller.enqueue(textEncoderForFactory.encode(value));
					else controller.enqueue(base64ToUint8Array(value.$b64));
				} catch {}
			},
			throw(error) {
				controller.error(error);
			},
			return() {
				try {
					controller.close();
				} catch {}
			}
		});
	} });
};
var FACTORY_BINARY = `(s=>new ReadableStream({start(c){s.on({next(b){try{const d=atob(b),a=new Uint8Array(d.length);for(let i=0;i<d.length;i++)a[i]=d.charCodeAt(i);c.enqueue(a)}catch(_){}},throw(e){c.error(e)},return(){try{c.close()}catch(_){}}})}}))`;
var FACTORY_TEXT = `(s=>{const e=new TextEncoder();return new ReadableStream({start(c){s.on({next(v){try{if(typeof v==='string'){c.enqueue(e.encode(v))}else{const d=atob(v.$b64),a=new Uint8Array(d.length);for(let i=0;i<d.length;i++)a[i]=d.charCodeAt(i);c.enqueue(a)}}catch(_){}},throw(x){c.error(x)},return(){try{c.close()}catch(_){}}})}})})`;
function toBinaryStream(readable) {
	const stream$1 = createStream();
	const reader = readable.getReader();
	(async () => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					stream$1.return(void 0);
					break;
				}
				stream$1.next(uint8ArrayToBase64(value));
			}
		} catch (error) {
			stream$1.throw(error);
		} finally {
			reader.releaseLock();
		}
	})();
	return stream$1;
}
function toTextStream(readable) {
	const stream$1 = createStream();
	const reader = readable.getReader();
	const decoder = new TextDecoder("utf-8", { fatal: true });
	(async () => {
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					try {
						const remaining = decoder.decode();
						if (remaining.length > 0) stream$1.next(remaining);
					} catch {}
					stream$1.return(void 0);
					break;
				}
				try {
					const text = decoder.decode(value, { stream: true });
					if (text.length > 0) stream$1.next(text);
				} catch {
					stream$1.next({ $b64: uint8ArrayToBase64(value) });
				}
			}
		} catch (error) {
			stream$1.throw(error);
		} finally {
			reader.releaseLock();
		}
	})();
	return stream$1;
}
var RawStreamSSRPlugin = /* @__PURE__ */ createPlugin({
	tag: "tss/RawStream",
	extends: [/* @__PURE__ */ createPlugin({
		tag: "tss/RawStreamFactory",
		test(value) {
			return value === RAW_STREAM_FACTORY_BINARY;
		},
		parse: {
			sync(_value, _ctx, _data) {
				return {};
			},
			async async(_value, _ctx, _data) {
				return {};
			},
			stream(_value, _ctx, _data) {
				return {};
			}
		},
		serialize(_node, _ctx, _data) {
			return FACTORY_BINARY;
		},
		deserialize(_node, _ctx, _data) {
			return RAW_STREAM_FACTORY_BINARY;
		}
	}), /* @__PURE__ */ createPlugin({
		tag: "tss/RawStreamFactoryText",
		test(value) {
			return value === RAW_STREAM_FACTORY_TEXT;
		},
		parse: {
			sync(_value, _ctx, _data) {
				return {};
			},
			async async(_value, _ctx, _data) {
				return {};
			},
			stream(_value, _ctx, _data) {
				return {};
			}
		},
		serialize(_node, _ctx, _data) {
			return FACTORY_TEXT;
		},
		deserialize(_node, _ctx, _data) {
			return RAW_STREAM_FACTORY_TEXT;
		}
	})],
	test(value) {
		return value instanceof RawStream;
	},
	parse: {
		sync(value, ctx, _data) {
			const factory = value.hint === "text" ? RAW_STREAM_FACTORY_TEXT : RAW_STREAM_FACTORY_BINARY;
			return {
				hint: ctx.parse(value.hint),
				factory: ctx.parse(factory),
				stream: ctx.parse(createStream())
			};
		},
		async async(value, ctx, _data) {
			const factory = value.hint === "text" ? RAW_STREAM_FACTORY_TEXT : RAW_STREAM_FACTORY_BINARY;
			const encodedStream = value.hint === "text" ? toTextStream(value.stream) : toBinaryStream(value.stream);
			return {
				hint: await ctx.parse(value.hint),
				factory: await ctx.parse(factory),
				stream: await ctx.parse(encodedStream)
			};
		},
		stream(value, ctx, _data) {
			const factory = value.hint === "text" ? RAW_STREAM_FACTORY_TEXT : RAW_STREAM_FACTORY_BINARY;
			const encodedStream = value.hint === "text" ? toTextStream(value.stream) : toBinaryStream(value.stream);
			return {
				hint: ctx.parse(value.hint),
				factory: ctx.parse(factory),
				stream: ctx.parse(encodedStream)
			};
		}
	},
	serialize(node, ctx, _data) {
		return "(" + ctx.serialize(node.factory) + ")(" + ctx.serialize(node.stream) + ")";
	},
	deserialize(node, ctx, _data) {
		const stream$1 = ctx.deserialize(node.stream);
		return ctx.deserialize(node.hint) === "text" ? RAW_STREAM_FACTORY_CONSTRUCTOR_TEXT(stream$1) : RAW_STREAM_FACTORY_CONSTRUCTOR_BINARY(stream$1);
	}
});
/* @__NO_SIDE_EFFECTS__ */
function createRawStreamRPCPlugin(onRawStream) {
	let nextStreamId = 1;
	return /* @__PURE__ */ createPlugin({
		tag: "tss/RawStream",
		test(value) {
			return value instanceof RawStream;
		},
		parse: {
			async async(value, ctx, _data) {
				const streamId = nextStreamId++;
				onRawStream(streamId, value.stream);
				return { streamId: await ctx.parse(streamId) };
			},
			stream(value, ctx, _data) {
				const streamId = nextStreamId++;
				onRawStream(streamId, value.stream);
				return { streamId: ctx.parse(streamId) };
			}
		},
		serialize() {
			throw new Error("RawStreamRPCPlugin.serialize should not be called. RPC uses JSON serialization, not JS code generation.");
		},
		deserialize() {
			throw new Error("RawStreamRPCPlugin.deserialize should not be called. Use createRawStreamDeserializePlugin on client.");
		}
	});
}
var ShallowErrorPlugin = /* @__PURE__ */ createPlugin({
	tag: "$TSR/Error",
	test(value) {
		return value instanceof Error;
	},
	parse: {
		sync(value, ctx) {
			return { message: ctx.parse(value.message) };
		},
		async async(value, ctx) {
			return { message: await ctx.parse(value.message) };
		},
		stream(value, ctx) {
			return { message: ctx.parse(value.message) };
		}
	},
	serialize(node, ctx) {
		return "new Error(" + ctx.serialize(node.message) + ")";
	},
	deserialize(node, ctx) {
		return new Error(ctx.deserialize(node.message));
	}
});
var READABLE_STREAM_FACTORY = {};
var READABLE_STREAM_FACTORY_CONSTRUCTOR = (stream$1) => new ReadableStream({ start(controller) {
	stream$1.on({
		next(value) {
			try {
				controller.enqueue(value);
			} catch (_error) {}
		},
		throw(value) {
			controller.error(value);
		},
		return() {
			try {
				controller.close();
			} catch (_error) {}
		}
	});
} });
var ReadableStreamFactoryPlugin = /* @__PURE__ */ createPlugin({
	tag: "seroval-plugins/web/ReadableStreamFactory",
	test(value) {
		return value === READABLE_STREAM_FACTORY;
	},
	parse: {
		sync() {
			return READABLE_STREAM_FACTORY;
		},
		async async() {
			return await Promise.resolve(READABLE_STREAM_FACTORY);
		},
		stream() {
			return READABLE_STREAM_FACTORY;
		}
	},
	serialize() {
		return READABLE_STREAM_FACTORY_CONSTRUCTOR.toString();
	},
	deserialize() {
		return READABLE_STREAM_FACTORY;
	}
});
async function drainStream(stream$1, reader) {
	try {
		const result = await reader.read();
		if (result.done) {
			stream$1.return(result.value);
			reader.releaseLock();
		} else {
			stream$1.next(result.value);
			await drainStream(stream$1, reader);
		}
	} catch (error) {
		stream$1.throw(error);
	}
}
function cleanupStream(reader) {
	reader.cancel().catch(() => {});
	reader.releaseLock();
}
function toStream(value) {
	const stream$1 = createStream();
	const reader = value.getReader();
	const cleanup = cleanupStream.bind(null, reader);
	drainStream(stream$1, reader).catch(cleanup);
	return [stream$1, cleanup];
}
var defaultSerovalPlugins = [
	ShallowErrorPlugin,
	RawStreamSSRPlugin,
	/* @__PURE__ */ createPlugin({
		tag: "seroval/plugins/web/ReadableStream",
		extends: [ReadableStreamFactoryPlugin],
		test(value) {
			if (typeof ReadableStream === "undefined") return false;
			return value instanceof ReadableStream;
		},
		parse: {
			sync(_value, ctx) {
				return {
					factory: ctx.parse(READABLE_STREAM_FACTORY),
					stream: ctx.parse(createStream())
				};
			},
			async async(value, ctx) {
				return {
					factory: await ctx.parse(READABLE_STREAM_FACTORY),
					stream: await ctx.parse(toStream(value)[0])
				};
			},
			stream(value, ctx) {
				const [stream$1, cleanup] = toStream(value);
				ctx.addCleanup(cleanup);
				return {
					factory: ctx.parse(READABLE_STREAM_FACTORY),
					stream: ctx.parse(stream$1)
				};
			}
		},
		serialize(node, ctx) {
			return "(" + ctx.serialize(node.factory) + ")(" + ctx.serialize(node.stream) + ")";
		},
		deserialize(node, ctx) {
			return READABLE_STREAM_FACTORY_CONSTRUCTOR(ctx.deserialize(node.stream));
		}
	})
];
/**
* @license React
* react-jsx-runtime.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE$2 = Symbol.for("react.transitional.element"), REACT_FRAGMENT_TYPE$2 = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE$2,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE$2;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_production();
}));
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime(), 1);
var CatchBoundary = class extends import_react.Component {
	constructor(..._args) {
		super(..._args);
		this.state = { error: null };
		this.reset = () => {
			this.setState({ error: null });
		};
	}
	static getDerivedStateFromProps(props, state) {
		const resetKey = props.getResetKey();
		if (state.error && state.resetKey !== resetKey) return {
			resetKey,
			error: null
		};
		return { resetKey };
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, errorInfo) {
		this.props.onCatch?.(error, errorInfo);
	}
	render() {
		const error = this.state.error;
		if (error) return import_react.createElement(this.props.errorComponent ?? ErrorComponent, {
			error,
			reset: this.reset
		});
		return this.props.children;
	}
};
function ErrorComponent({ error }) {
	const [show, setShow] = import_react.useState(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: {
			padding: ".5rem",
			maxWidth: "100%"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: ".5rem"
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
					style: { fontSize: "1rem" },
					children: "Something went wrong!"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					style: {
						appearance: "none",
						fontSize: ".6em",
						border: "1px solid currentColor",
						padding: ".1rem .2rem",
						fontWeight: "bold",
						borderRadius: ".25rem"
					},
					onClick: () => setShow((d) => !d),
					children: show ? "Hide Error" : "Show Error"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: ".25rem" } }),
			show ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				style: {
					fontSize: ".7em",
					border: "1px solid red",
					borderRadius: ".25rem",
					padding: ".3rem",
					color: "red",
					overflow: "auto"
				},
				children: error.message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: error.message }) : null
			}) }) : null
		]
	});
}
function ClientOnly({ children, fallback = null }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: useHydrated() ? children : fallback });
}
function useHydrated() {
	return import_react.useSyncExternalStore(subscribe, () => true, () => false);
}
function subscribe() {
	return () => {};
}
var routerContext = import_react.createContext(null);
function useRouter(opts) {
	return import_react.useContext(routerContext);
}
var matchContext = import_react.createContext(void 0);
var dummyMatchContext = import_react.createContext(void 0);
/**
* @license React
* use-sync-external-store-shim.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_use_sync_external_store_shim_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React$4 = require_react();
	function is$3(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs$3 = "function" === typeof Object.is ? Object.is : is$3, useState = React$4.useState, useEffect$1 = React$4.useEffect, useLayoutEffect$1 = React$4.useLayoutEffect, useDebugValue$1 = React$4.useDebugValue;
	function useSyncExternalStore$2(subscribe$1, getSnapshot) {
		var value = getSnapshot(), _useState = useState({ inst: {
			value,
			getSnapshot
		} }), inst = _useState[0].inst, forceUpdate = _useState[1];
		useLayoutEffect$1(function() {
			inst.value = value;
			inst.getSnapshot = getSnapshot;
			checkIfSnapshotChanged(inst) && forceUpdate({ inst });
		}, [
			subscribe$1,
			value,
			getSnapshot
		]);
		useEffect$1(function() {
			checkIfSnapshotChanged(inst) && forceUpdate({ inst });
			return subscribe$1(function() {
				checkIfSnapshotChanged(inst) && forceUpdate({ inst });
			});
		}, [subscribe$1]);
		useDebugValue$1(value);
		return value;
	}
	function checkIfSnapshotChanged(inst) {
		var latestGetSnapshot = inst.getSnapshot;
		inst = inst.value;
		try {
			var nextValue = latestGetSnapshot();
			return !objectIs$3(inst, nextValue);
		} catch (error) {
			return !0;
		}
	}
	function useSyncExternalStore$1(subscribe$1, getSnapshot) {
		return getSnapshot();
	}
	var shim$1 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
	exports.useSyncExternalStore = void 0 !== React$4.useSyncExternalStore ? React$4.useSyncExternalStore : shim$1;
}));
var require_shim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_use_sync_external_store_shim_production();
}));
/**
* @license React
* use-sync-external-store-shim/with-selector.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_with_selector_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React$3 = require_react(), shim = require_shim();
	function is$2(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs$2 = "function" === typeof Object.is ? Object.is : is$2, useSyncExternalStore = shim.useSyncExternalStore, useRef = React$3.useRef, useEffect = React$3.useEffect, useMemo$2 = React$3.useMemo, useDebugValue = React$3.useDebugValue;
	exports.useSyncExternalStoreWithSelector = function(subscribe$1, getSnapshot, getServerSnapshot, selector, isEqual) {
		var instRef = useRef(null);
		if (null === instRef.current) {
			var inst = {
				hasValue: !1,
				value: null
			};
			instRef.current = inst;
		} else inst = instRef.current;
		instRef = useMemo$2(function() {
			function memoizedSelector(nextSnapshot) {
				if (!hasMemo) {
					hasMemo = !0;
					memoizedSnapshot = nextSnapshot;
					nextSnapshot = selector(nextSnapshot);
					if (void 0 !== isEqual && inst.hasValue) {
						var currentSelection = inst.value;
						if (isEqual(currentSelection, nextSnapshot)) return memoizedSelection = currentSelection;
					}
					return memoizedSelection = nextSnapshot;
				}
				currentSelection = memoizedSelection;
				if (objectIs$2(memoizedSnapshot, nextSnapshot)) return currentSelection;
				var nextSelection = selector(nextSnapshot);
				if (void 0 !== isEqual && isEqual(currentSelection, nextSelection)) return memoizedSnapshot = nextSnapshot, currentSelection;
				memoizedSnapshot = nextSnapshot;
				return memoizedSelection = nextSelection;
			}
			var hasMemo = !1, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
			return [function() {
				return memoizedSelector(getSnapshot());
			}, null === maybeGetServerSnapshot ? void 0 : function() {
				return memoizedSelector(maybeGetServerSnapshot());
			}];
		}, [
			getSnapshot,
			getServerSnapshot,
			selector,
			isEqual
		]);
		var value = useSyncExternalStore(subscribe$1, instRef[0], instRef[1]);
		useEffect(function() {
			inst.hasValue = !0;
			inst.value = value;
		}, [value]);
		useDebugValue(value);
		return value;
	};
}));
var import_with_selector = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_with_selector_production();
})))();
function defaultCompare(a, b) {
	return a === b;
}
function useStore(atom, selector, compare = defaultCompare) {
	const subscribe$1 = (0, import_react.useCallback)((handleStoreChange) => {
		if (!atom) return () => {};
		const { unsubscribe } = atom.subscribe(handleStoreChange);
		return unsubscribe;
	}, [atom]);
	const boundGetSnapshot = (0, import_react.useCallback)(() => atom?.get(), [atom]);
	return (0, import_with_selector.useSyncExternalStoreWithSelector)(subscribe$1, boundGetSnapshot, boundGetSnapshot, selector, compare);
}
var dummyMatch = {};
function useStructuralSharing(opts, router) {
	const previousResult = import_react.useRef();
	return (slice) => {
		const selected = opts?.select ? opts.select(slice) : slice;
		if (opts?.structuralSharing ?? router.options.defaultStructuralSharing) return previousResult.current = replaceEqualDeep(previousResult.current, selected);
		return selected;
	};
}
function useMatch(opts) {
	const router = useRouter();
	const nearestRouteId = import_react.useContext(opts.from ? dummyMatchContext : matchContext);
	const routeId = opts.from ?? nearestRouteId;
	const matchStore = router.stores.getMatchStore(routeId);
	{
		const match = matchStore.get();
		if (!match) {
			if (opts.shouldThrow ?? true) invariant();
			return;
		}
		return opts.select ? opts.select(match) : match;
	}
	const selector = useStructuralSharing(opts, router);
	const matchSelection = useStore(matchStore, (match) => match ? selector(match) : dummyMatch);
	if (matchSelection !== dummyMatch) return matchSelection;
	if (opts.shouldThrow ?? true) invariant();
}
function CatchNotFound(props) {
	const router = useRouter();
	{
		const resetKey$1 = `not-found-${router.stores.location.get().pathname}-${router.stores.status.get()}`;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatchBoundary, {
			getResetKey: () => resetKey$1,
			onCatch: (error, errorInfo) => {
				if (isNotFound(error)) props.onCatch?.(error, errorInfo);
				else throw error;
			},
			errorComponent: ({ error }) => {
				if (isNotFound(error)) return props.fallback?.(error);
				else throw error;
			},
			children: props.children
		});
	}
	const resetKey = `not-found-${useStore(router.stores.location, (location) => location.pathname)}-${useStore(router.stores.status, (status) => status)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatchBoundary, {
		getResetKey: () => resetKey,
		onCatch: (error, errorInfo) => {
			if (isNotFound(error)) props.onCatch?.(error, errorInfo);
			else throw error;
		},
		errorComponent: ({ error }) => {
			if (isNotFound(error)) return props.fallback?.(error);
			else throw error;
		},
		children: props.children
	});
}
function DefaultGlobalNotFound() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Not Found" });
}
function ScriptOnce({ children }) {
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
		nonce: router.options.ssr?.nonce,
		dangerouslySetInnerHTML: { __html: children + ";document.currentScript.remove()" }
	});
}
function SafeFragment(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: props.children });
}
function renderRouteNotFound(router, route, data) {
	if (!route.options.notFoundComponent) {
		if (router.options.defaultNotFoundComponent) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(router.options.defaultNotFoundComponent, { ...data });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DefaultGlobalNotFound, {});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(route.options.notFoundComponent, { ...data });
}
var scroll_restoration_inline_default = "function(a,f){let l;try{l=JSON.parse(sessionStorage.getItem(a)||\"{}\")}catch{return}const n=l?.[f||history.state?.__TSR_key];let c=!1;for(const t in n){const e=n[t],o=e?.scrollX,s=e?.scrollY;if(Number.isFinite(o)&&Number.isFinite(s)){if(t===\"window\")scrollTo(o,s),c=!0;else if(t)try{const r=document.querySelector(t);r&&(r.scrollLeft=o,r.scrollTop=s)}catch{}}}if(c)return;const i=location.hash.slice(1);if(i){const t=history.state?.__hashScrollIntoViewOptions??!0;if(t){const e=document.getElementById(i);e&&e.scrollIntoView(t)}return}scrollTo(0,0)}";
var defaultInlineScrollRestorationScript = `(${scroll_restoration_inline_default})(${escapeHtml(JSON.stringify(storageKey))})`;
function getScrollRestorationScript(key) {
	if (key === void 0) return defaultInlineScrollRestorationScript;
	return `(${scroll_restoration_inline_default})(${escapeHtml(JSON.stringify(storageKey))},${escapeHtml(JSON.stringify(key))})`;
}
function getScrollRestorationScriptForRouter(router) {
	if (typeof router.options.scrollRestoration === "function" && !router.options.scrollRestoration({ location: router.latestLocation })) return null;
	const getKey = router.options.getScrollRestorationKey;
	if (!getKey) return defaultInlineScrollRestorationScript;
	const location = router.latestLocation;
	const userKey = getKey(location);
	if (userKey === defaultGetScrollRestorationKey(location)) return defaultInlineScrollRestorationScript;
	return getScrollRestorationScript(userKey);
}
function ScrollRestoration() {
	const script = getScrollRestorationScriptForRouter(useRouter());
	if (!script) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScriptOnce, { children: script });
}
function renderPending(router, route) {
	const PendingComponent = route?.options.pendingComponent ?? router.options.defaultPendingComponent;
	if (!PendingComponent) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingComponent, {});
}
var canWrapInSuspense = (router, route, ssr) => !route.isRoot || route.options.shellComponent || route.options.wrapInSuspense || ssr === false || ssr === "data-only" || false;
var Match = import_react.memo(function MatchImpl({ routeId }) {
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchView, {
		router,
		match: router.stores.byRoute.get(routeId).get()
	});
});
function MatchView({ router, match }) {
	const route = router.routesById[match.routeId];
	const pendingElement = renderPending(router, route);
	const routeErrorComponent = route.options.errorComponent ?? router.options.defaultErrorComponent;
	const routeOnCatch = route.options.onCatch ?? router.options.defaultOnCatch;
	const routeNotFoundComponent = route.isRoot ? route.options.notFoundComponent ?? router.options.notFoundRoute?.options.component : route.options.notFoundComponent;
	const resolvedNoSsr = match.ssr === false || match.ssr === "data-only";
	const ResolvedSuspenseBoundary = canWrapInSuspense(router, route, match.ssr) && (route.options.wrapInSuspense ?? pendingElement ?? (route.options.errorComponent?.preload || resolvedNoSsr)) ? import_react.Suspense : SafeFragment;
	const ResolvedCatchBoundary = routeErrorComponent ? CatchBoundary : SafeFragment;
	const ResolvedNotFoundBoundary = routeNotFoundComponent ? CatchNotFound : SafeFragment;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(route.isRoot ? route.options.shellComponent ?? SafeFragment : SafeFragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(matchContext.Provider, {
		value: match.routeId,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResolvedSuspenseBoundary, {
			fallback: pendingElement,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResolvedCatchBoundary, {
				getResetKey: () => match,
				errorComponent: routeErrorComponent,
				onCatch: (error, errorInfo) => {
					if (isNotFound(error)) {
						error.routeId ??= match.routeId;
						throw error;
					}
					routeOnCatch?.(error, errorInfo);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResolvedNotFoundBoundary, {
					fallback: (error) => {
						error.routeId ??= match.routeId;
						if (error.routeId !== match.routeId) throw error;
						return import_react.createElement(routeNotFoundComponent, error);
					},
					children: resolvedNoSsr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnly, {
						fallback: pendingElement,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchInner, { match })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchInner, { match })
				})
			})
		})
	}), route.parentRoute?.id === "__root__" && router.options.scrollRestoration ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollRestoration, {}) : null] });
}
var MatchInner = import_react.memo(function MatchInnerImpl({ match }) {
	const router = useRouter();
	const routeId = match.routeId;
	const route = router.routesById[routeId];
	const key = import_react.useMemo(() => {
		const remountDeps = (route.options.remountDeps ?? router.options.defaultRemountDeps)?.({
			routeId,
			loaderDeps: match.loaderDeps,
			params: match._strictParams,
			search: match._strictSearch
		});
		return remountDeps ? JSON.stringify(remountDeps) : void 0;
	}, [
		routeId,
		match.loaderDeps,
		match._strictParams,
		match._strictSearch,
		route.options.remountDeps,
		router.options.defaultRemountDeps
	]);
	const out = import_react.useMemo(() => {
		const Comp = route.options.component ?? router.options.defaultComponent;
		return Comp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, {}, key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
	}, [
		key,
		route.options.component,
		router.options.defaultComponent
	]);
	if (match.status === "pending") {
		if (router.ssr && !canWrapInSuspense(router, route, match.ssr)) return out;
		if (router._tx) throw router._tx[5];
		return renderPending(router, route);
	}
	if (match.status === "notFound") return renderRouteNotFound(router, route, match.error);
	if (match.status === "error") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)((route.options.errorComponent ?? router.options.defaultErrorComponent) || ErrorComponent, {
		error: match.error,
		reset: void 0,
		info: { componentStack: "" }
	});
	return out;
});
var Outlet = import_react.memo(function OutletImpl() {
	const router = useRouter();
	const routeId = import_react.useContext(matchContext);
	let parentGlobalNotFound;
	let parentNotFoundError;
	let childRouteId;
	{
		const matches = router.stores.matches.get();
		const parentIndex = matches.findIndex((match) => match.routeId === routeId);
		const parentMatch = matches[parentIndex];
		parentGlobalNotFound = !!parentMatch._notFound;
		parentNotFoundError = parentMatch.error;
		childRouteId = matches[parentIndex + 1]?.routeId;
	}
	if (parentGlobalNotFound) return renderRouteNotFound(router, router.routesById[routeId], parentNotFoundError);
	if (!childRouteId) return null;
	const nextMatch = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Match, { routeId: childRouteId });
	if (routeId === "__root__") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
		fallback: renderPending(router),
		children: nextMatch
	});
	return nextMatch;
});
function settleOwner(owner, rendered) {
	const settle = owner[1];
	owner.length = 0;
	settle?.(rendered);
}
function Matches() {
	const router = useRouter();
	const rootRoute = router.routesById[rootRouteId];
	const pendingElement = renderPending(router, rootRoute);
	const ResolvedSuspense = SafeFragment;
	const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [false, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResolvedSuspense, {
		fallback: pendingElement,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MatchesInner, {})
	})] });
	return router.options.InnerWrap ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(router.options.InnerWrap, { children: inner }) : inner;
}
function MatchesInner() {
	const router = useRouter();
	const acknowledgement = router._rendered;
	const matches = router.stores.matches.get();
	const match = matches[0];
	const routeId = match?.routeId;
	useLayoutEffect(() => {
		if (acknowledgement[0] === matches) settleOwner(acknowledgement, true);
	}, [acknowledgement, matches]);
	const matchComponent = routeId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Match, { routeId }) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(matchContext.Provider, {
		value: routeId,
		children: router.options.disableGlobalCatchBoundary ? matchComponent : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatchBoundary, {
			getResetKey: () => match,
			onCatch: void 0,
			children: matchComponent
		})
	});
}
function RouterContextProvider({ router, children, ...rest }) {
	if (hasKeys(rest)) router.update({
		...router.options,
		...rest,
		context: {
			...router.options.context,
			...rest.context
		}
	});
	const provider = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(routerContext.Provider, {
		value: router,
		children
	});
	if (router.options.Wrap) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(router.options.Wrap, { children: provider });
	return provider;
}
function RouterProvider({ router, ...rest }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouterContextProvider, {
		router,
		...rest,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Matches, {})
	});
}
function StartServer(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouterProvider, { router: props.router });
}
/**
* @license React
* react-dom.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_dom_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React$2 = require_react();
	function formatProdErrorMessage(code) {
		var url = "https://react.dev/errors/" + code;
		if (1 < arguments.length) {
			url += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var i = 2; i < arguments.length; i++) url += "&args[]=" + encodeURIComponent(arguments[i]);
		}
		return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function noop$4() {}
	var Internals = {
		d: {
			f: noop$4,
			r: function() {
				throw Error(formatProdErrorMessage(522));
			},
			D: noop$4,
			C: noop$4,
			L: noop$4,
			m: noop$4,
			X: noop$4,
			S: noop$4,
			M: noop$4
		},
		p: 0,
		findDOMNode: null
	}, REACT_PORTAL_TYPE$2 = Symbol.for("react.portal");
	function createPortal$1(children, containerInfo, implementation) {
		var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
		return {
			$$typeof: REACT_PORTAL_TYPE$2,
			key: null == key ? null : "" + key,
			children,
			containerInfo,
			implementation
		};
	}
	var ReactSharedInternals$2 = React$2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function getCrossOriginStringAs(as, input) {
		if ("font" === as) return "";
		if ("string" === typeof input) return "use-credentials" === input ? input : "";
	}
	exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
	exports.createPortal = function(children, container) {
		var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
		if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType) throw Error(formatProdErrorMessage(299));
		return createPortal$1(children, container, null, key);
	};
	exports.flushSync = function(fn) {
		var previousTransition = ReactSharedInternals$2.T, previousUpdatePriority = Internals.p;
		try {
			if (ReactSharedInternals$2.T = null, Internals.p = 2, fn) return fn();
		} finally {
			ReactSharedInternals$2.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
		}
	};
	exports.preconnect = function(href, options) {
		"string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
	};
	exports.prefetchDNS = function(href) {
		"string" === typeof href && Internals.d.D(href);
	};
	exports.preinit = function(href, options) {
		if ("string" === typeof href && options && "string" === typeof options.as) {
			var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
			"style" === as ? Internals.d.S(href, "string" === typeof options.precedence ? options.precedence : void 0, {
				crossOrigin,
				integrity,
				fetchPriority
			}) : "script" === as && Internals.d.X(href, {
				crossOrigin,
				integrity,
				fetchPriority,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0
			});
		}
	};
	exports.preinitModule = function(href, options) {
		if ("string" === typeof href) if ("object" === typeof options && null !== options) {
			if (null == options.as || "script" === options.as) {
				var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
				Internals.d.M(href, {
					crossOrigin,
					integrity: "string" === typeof options.integrity ? options.integrity : void 0,
					nonce: "string" === typeof options.nonce ? options.nonce : void 0
				});
			}
		} else options ?? Internals.d.M(href);
	};
	exports.preload = function(href, options) {
		if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
			var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin);
			Internals.d.L(href, as, {
				crossOrigin,
				integrity: "string" === typeof options.integrity ? options.integrity : void 0,
				nonce: "string" === typeof options.nonce ? options.nonce : void 0,
				type: "string" === typeof options.type ? options.type : void 0,
				fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
				referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
				imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
				imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
				media: "string" === typeof options.media ? options.media : void 0
			});
		}
	};
	exports.preloadModule = function(href, options) {
		if ("string" === typeof href) if (options) {
			var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
			Internals.d.m(href, {
				as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
				crossOrigin,
				integrity: "string" === typeof options.integrity ? options.integrity : void 0
			});
		} else Internals.d.m(href);
	};
	exports.requestFormReset = function(form) {
		Internals.d.r(form);
	};
	exports.unstable_batchedUpdates = function(fn, a) {
		return fn(a);
	};
	exports.useFormState = function(action, initialState, permalink) {
		return ReactSharedInternals$2.H.useFormState(action, initialState, permalink);
	};
	exports.useFormStatus = function() {
		return ReactSharedInternals$2.H.useHostTransitionStatus();
	};
	exports.version = "19.2.8";
}));
var require_react_dom = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function checkDCE() {
		if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") return;
		try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
		} catch (err) {
			console.error(err);
		}
	}
	checkDCE();
	module.exports = require_react_dom_production();
}));
/**
* @license React
* react-dom-server-legacy.node.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_dom_server_legacy_node_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var React$1 = require_react(), ReactDOM$1 = require_react_dom(), REACT_ELEMENT_TYPE$1 = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE$1 = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE$1 = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE$1 = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE$1 = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE$1 = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE$1 = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE$1 = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE$1 = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE$1 = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE$1 = Symbol.for("react.memo"), REACT_LAZY_TYPE$1 = Symbol.for("react.lazy"), REACT_SCOPE_TYPE$1 = Symbol.for("react.scope"), REACT_ACTIVITY_TYPE$1 = Symbol.for("react.activity"), REACT_LEGACY_HIDDEN_TYPE$1 = Symbol.for("react.legacy_hidden"), REACT_MEMO_CACHE_SENTINEL$1 = Symbol.for("react.memo_cache_sentinel"), REACT_VIEW_TRANSITION_TYPE$1 = Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL$1 = Symbol.iterator;
	function getIteratorFn$1(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL$1 && maybeIterable[MAYBE_ITERATOR_SYMBOL$1] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var isArrayImpl$1 = Array.isArray;
	function murmurhash3_32_gc(key, seed) {
		var remainder = key.length & 3;
		var bytes = key.length - remainder;
		var h1 = seed;
		for (seed = 0; seed < bytes;) {
			var k1 = key.charCodeAt(seed) & 255 | (key.charCodeAt(++seed) & 255) << 8 | (key.charCodeAt(++seed) & 255) << 16 | (key.charCodeAt(++seed) & 255) << 24;
			++seed;
			k1 = 3432918353 * (k1 & 65535) + ((3432918353 * (k1 >>> 16) & 65535) << 16) & 4294967295;
			k1 = k1 << 15 | k1 >>> 17;
			k1 = 461845907 * (k1 & 65535) + ((461845907 * (k1 >>> 16) & 65535) << 16) & 4294967295;
			h1 ^= k1;
			h1 = h1 << 13 | h1 >>> 19;
			h1 = 5 * (h1 & 65535) + ((5 * (h1 >>> 16) & 65535) << 16) & 4294967295;
			h1 = (h1 & 65535) + 27492 + (((h1 >>> 16) + 58964 & 65535) << 16);
		}
		k1 = 0;
		switch (remainder) {
			case 3: k1 ^= (key.charCodeAt(seed + 2) & 255) << 16;
			case 2: k1 ^= (key.charCodeAt(seed + 1) & 255) << 8;
			case 1: k1 ^= key.charCodeAt(seed) & 255, k1 = 3432918353 * (k1 & 65535) + ((3432918353 * (k1 >>> 16) & 65535) << 16) & 4294967295, k1 = k1 << 15 | k1 >>> 17, h1 ^= 461845907 * (k1 & 65535) + ((461845907 * (k1 >>> 16) & 65535) << 16) & 4294967295;
		}
		h1 ^= key.length;
		h1 ^= h1 >>> 16;
		h1 = 2246822507 * (h1 & 65535) + ((2246822507 * (h1 >>> 16) & 65535) << 16) & 4294967295;
		h1 ^= h1 >>> 13;
		h1 = 3266489909 * (h1 & 65535) + ((3266489909 * (h1 >>> 16) & 65535) << 16) & 4294967295;
		return (h1 ^ h1 >>> 16) >>> 0;
	}
	var assign$1 = Object.assign, hasOwnProperty$1 = Object.prototype.hasOwnProperty, VALID_ATTRIBUTE_NAME_REGEX$1 = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), illegalAttributeNameCache$1 = {}, validatedAttributeNameCache$1 = {};
	function isAttributeNameSafe$1(attributeName) {
		if (hasOwnProperty$1.call(validatedAttributeNameCache$1, attributeName)) return !0;
		if (hasOwnProperty$1.call(illegalAttributeNameCache$1, attributeName)) return !1;
		if (VALID_ATTRIBUTE_NAME_REGEX$1.test(attributeName)) return validatedAttributeNameCache$1[attributeName] = !0;
		illegalAttributeNameCache$1[attributeName] = !0;
		return !1;
	}
	var unitlessNumbers$1 = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" ")), aliases$1 = new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), matchHtmlRegExp$1 = /["'&<>]/;
	function escapeTextForBrowser$1(text) {
		if ("boolean" === typeof text || "number" === typeof text || "bigint" === typeof text) return "" + text;
		text = "" + text;
		var match = matchHtmlRegExp$1.exec(text);
		if (match) {
			var html = "", index, lastIndex = 0;
			for (index = match.index; index < text.length; index++) {
				switch (text.charCodeAt(index)) {
					case 34:
						match = "&quot;";
						break;
					case 38:
						match = "&amp;";
						break;
					case 39:
						match = "&#x27;";
						break;
					case 60:
						match = "&lt;";
						break;
					case 62:
						match = "&gt;";
						break;
					default: continue;
				}
				lastIndex !== index && (html += text.slice(lastIndex, index));
				lastIndex = index + 1;
				html += match;
			}
			text = lastIndex !== index ? html + text.slice(lastIndex, index) : html;
		}
		return text;
	}
	var uppercasePattern$1 = /([A-Z])/g, msPattern$1 = /^ms-/, isJavaScriptProtocol$1 = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function sanitizeURL$1(url) {
		return isJavaScriptProtocol$1.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
	}
	var ReactSharedInternals$1 = React$1.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ReactDOMSharedInternals$1 = ReactDOM$1.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, sharedNotPendingObject$1 = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, previousDispatcher$1 = ReactDOMSharedInternals$1.d;
	ReactDOMSharedInternals$1.d = {
		f: previousDispatcher$1.f,
		r: previousDispatcher$1.r,
		D: prefetchDNS$1,
		C: preconnect$1,
		L: preload$1,
		m: preloadModule$1,
		X: preinitScript$1,
		S: preinitStyle$1,
		M: preinitModuleScript$1
	};
	var PRELOAD_NO_CREDS$1 = [], currentlyFlushingRenderState$1 = null, scriptRegex$1 = /(<\/|<)(s)(cript)/gi;
	function scriptReplacer$1(match, prefix$2, s$1, suffix$2) {
		return "" + prefix$2 + ("s" === s$1 ? "\\u0073" : "\\u0053") + suffix$2;
	}
	function createResumableState$1(identifierPrefix, externalRuntimeConfig, bootstrapScriptContent, bootstrapScripts, bootstrapModules) {
		return {
			idPrefix: void 0 === identifierPrefix ? "" : identifierPrefix,
			nextFormID: 0,
			streamingFormat: 0,
			bootstrapScriptContent,
			bootstrapScripts,
			bootstrapModules,
			instructions: 0,
			hasBody: !1,
			hasHtml: !1,
			unknownResources: {},
			dnsResources: {},
			connectResources: {
				default: {},
				anonymous: {},
				credentials: {}
			},
			imageResources: {},
			styleResources: {},
			scriptResources: {},
			moduleUnknownResources: {},
			moduleScriptResources: {}
		};
	}
	function createFormatContext$1(insertionMode, selectedValue, tagScope, viewTransition) {
		return {
			insertionMode,
			selectedValue,
			tagScope,
			viewTransition
		};
	}
	function getChildFormatContext$1(parentContext, type, props) {
		var subtreeScope = parentContext.tagScope & -25;
		switch (type) {
			case "noscript": return createFormatContext$1(2, null, subtreeScope | 1, null);
			case "select": return createFormatContext$1(2, null != props.value ? props.value : props.defaultValue, subtreeScope, null);
			case "svg": return createFormatContext$1(4, null, subtreeScope, null);
			case "picture": return createFormatContext$1(2, null, subtreeScope | 2, null);
			case "math": return createFormatContext$1(5, null, subtreeScope, null);
			case "foreignObject": return createFormatContext$1(2, null, subtreeScope, null);
			case "table": return createFormatContext$1(6, null, subtreeScope, null);
			case "thead":
			case "tbody":
			case "tfoot": return createFormatContext$1(7, null, subtreeScope, null);
			case "colgroup": return createFormatContext$1(9, null, subtreeScope, null);
			case "tr": return createFormatContext$1(8, null, subtreeScope, null);
			case "head":
				if (2 > parentContext.insertionMode) return createFormatContext$1(3, null, subtreeScope, null);
				break;
			case "html": if (0 === parentContext.insertionMode) return createFormatContext$1(1, null, subtreeScope, null);
		}
		return 6 <= parentContext.insertionMode || 2 > parentContext.insertionMode ? createFormatContext$1(2, null, subtreeScope, null) : parentContext.tagScope !== subtreeScope ? createFormatContext$1(parentContext.insertionMode, parentContext.selectedValue, subtreeScope, null) : parentContext;
	}
	function getSuspenseViewTransition$1(parentViewTransition) {
		return null === parentViewTransition ? null : {
			update: parentViewTransition.update,
			enter: "none",
			exit: "none",
			share: parentViewTransition.update,
			name: parentViewTransition.autoName,
			autoName: parentViewTransition.autoName,
			nameIdx: 0
		};
	}
	function getSuspenseFallbackFormatContext$1(resumableState, parentContext) {
		parentContext.tagScope & 32 && (resumableState.instructions |= 128);
		return createFormatContext$1(parentContext.insertionMode, parentContext.selectedValue, parentContext.tagScope | 12, getSuspenseViewTransition$1(parentContext.viewTransition));
	}
	function getSuspenseContentFormatContext$1(resumableState, parentContext) {
		resumableState = getSuspenseViewTransition$1(parentContext.viewTransition);
		var subtreeScope = parentContext.tagScope | 16;
		null !== resumableState && "none" !== resumableState.share && (subtreeScope |= 64);
		return createFormatContext$1(parentContext.insertionMode, parentContext.selectedValue, subtreeScope, resumableState);
	}
	var styleNameCache$1 = /* @__PURE__ */ new Map();
	function pushStyleAttribute$1(target, style) {
		if ("object" !== typeof style) throw Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
		var isFirst = !0, styleName;
		for (styleName in style) if (hasOwnProperty$1.call(style, styleName)) {
			var styleValue = style[styleName];
			if (null != styleValue && "boolean" !== typeof styleValue && "" !== styleValue) {
				if (0 === styleName.indexOf("--")) {
					var nameChunk = escapeTextForBrowser$1(styleName);
					styleValue = escapeTextForBrowser$1(("" + styleValue).trim());
				} else nameChunk = styleNameCache$1.get(styleName), void 0 === nameChunk && (nameChunk = escapeTextForBrowser$1(styleName.replace(uppercasePattern$1, "-$1").toLowerCase().replace(msPattern$1, "-ms-")), styleNameCache$1.set(styleName, nameChunk)), styleValue = "number" === typeof styleValue ? 0 === styleValue || unitlessNumbers$1.has(styleName) ? "" + styleValue : styleValue + "px" : escapeTextForBrowser$1(("" + styleValue).trim());
				isFirst ? (isFirst = !1, target.push(" style=\"", nameChunk, ":", styleValue)) : target.push(";", nameChunk, ":", styleValue);
			}
		}
		isFirst || target.push("\"");
	}
	function pushBooleanAttribute$1(target, name, value) {
		value && "function" !== typeof value && "symbol" !== typeof value && target.push(" ", name, "=\"\"");
	}
	function pushStringAttribute$1(target, name, value) {
		"function" !== typeof value && "symbol" !== typeof value && "boolean" !== typeof value && target.push(" ", name, "=\"", escapeTextForBrowser$1(value), "\"");
	}
	var actionJavaScriptURL$1 = escapeTextForBrowser$1("javascript:throw new Error('React form unexpectedly submitted.')");
	function pushAdditionalFormField$1(value, key) {
		this.push("<input type=\"hidden\"");
		validateAdditionalFormField$1(value);
		pushStringAttribute$1(this, "name", key);
		pushStringAttribute$1(this, "value", value);
		this.push("/>");
	}
	function validateAdditionalFormField$1(value) {
		if ("string" !== typeof value) throw Error("File/Blob fields are not yet supported in progressive forms. Will fallback to client hydration.");
	}
	function getCustomFormFields$1(resumableState, formAction) {
		if ("function" === typeof formAction.$$FORM_ACTION) {
			var id = resumableState.nextFormID++;
			resumableState = resumableState.idPrefix + id;
			try {
				var customFields = formAction.$$FORM_ACTION(resumableState);
				if (customFields) customFields.data?.forEach(validateAdditionalFormField$1);
				return customFields;
			} catch (x) {
				if ("object" === typeof x && null !== x && "function" === typeof x.then) throw x;
			}
		}
		return null;
	}
	function pushFormActionAttribute$1(target, resumableState, renderState, formAction, formEncType, formMethod, formTarget, name) {
		var formData = null;
		if ("function" === typeof formAction) {
			var customFields = getCustomFormFields$1(resumableState, formAction);
			null !== customFields ? (name = customFields.name, formAction = customFields.action || "", formEncType = customFields.encType, formMethod = customFields.method, formTarget = customFields.target, formData = customFields.data) : (target.push(" ", "formAction", "=\"", actionJavaScriptURL$1, "\""), formTarget = formMethod = formEncType = formAction = name = null, injectFormReplayingRuntime$1(resumableState, renderState));
		}
		null != name && pushAttribute$1(target, "name", name);
		null != formAction && pushAttribute$1(target, "formAction", formAction);
		null != formEncType && pushAttribute$1(target, "formEncType", formEncType);
		null != formMethod && pushAttribute$1(target, "formMethod", formMethod);
		null != formTarget && pushAttribute$1(target, "formTarget", formTarget);
		return formData;
	}
	function pushAttribute$1(target, name, value) {
		switch (name) {
			case "className":
				pushStringAttribute$1(target, "class", value);
				break;
			case "tabIndex":
				pushStringAttribute$1(target, "tabindex", value);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				pushStringAttribute$1(target, name, value);
				break;
			case "style":
				pushStyleAttribute$1(target, value);
				break;
			case "src":
			case "href": if ("" === value) break;
			case "action":
			case "formAction":
				if (null == value || "function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) break;
				value = sanitizeURL$1("" + value);
				target.push(" ", name, "=\"", escapeTextForBrowser$1(value), "\"");
				break;
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "ref": break;
			case "autoFocus":
			case "multiple":
			case "muted":
				pushBooleanAttribute$1(target, name.toLowerCase(), value);
				break;
			case "xlinkHref":
				if ("function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) break;
				value = sanitizeURL$1("" + value);
				target.push(" ", "xlink:href", "=\"", escapeTextForBrowser$1(value), "\"");
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				"function" !== typeof value && "symbol" !== typeof value && target.push(" ", name, "=\"", escapeTextForBrowser$1(value), "\"");
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				value && "function" !== typeof value && "symbol" !== typeof value && target.push(" ", name, "=\"\"");
				break;
			case "capture":
			case "download":
				!0 === value ? target.push(" ", name, "=\"\"") : !1 !== value && "function" !== typeof value && "symbol" !== typeof value && target.push(" ", name, "=\"", escapeTextForBrowser$1(value), "\"");
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				"function" !== typeof value && "symbol" !== typeof value && !isNaN(value) && 1 <= value && target.push(" ", name, "=\"", escapeTextForBrowser$1(value), "\"");
				break;
			case "rowSpan":
			case "start":
				"function" === typeof value || "symbol" === typeof value || isNaN(value) || target.push(" ", name, "=\"", escapeTextForBrowser$1(value), "\"");
				break;
			case "xlinkActuate":
				pushStringAttribute$1(target, "xlink:actuate", value);
				break;
			case "xlinkArcrole":
				pushStringAttribute$1(target, "xlink:arcrole", value);
				break;
			case "xlinkRole":
				pushStringAttribute$1(target, "xlink:role", value);
				break;
			case "xlinkShow":
				pushStringAttribute$1(target, "xlink:show", value);
				break;
			case "xlinkTitle":
				pushStringAttribute$1(target, "xlink:title", value);
				break;
			case "xlinkType":
				pushStringAttribute$1(target, "xlink:type", value);
				break;
			case "xmlBase":
				pushStringAttribute$1(target, "xml:base", value);
				break;
			case "xmlLang":
				pushStringAttribute$1(target, "xml:lang", value);
				break;
			case "xmlSpace":
				pushStringAttribute$1(target, "xml:space", value);
				break;
			default: if (!(2 < name.length) || "o" !== name[0] && "O" !== name[0] || "n" !== name[1] && "N" !== name[1]) {
				if (name = aliases$1.get(name) || name, isAttributeNameSafe$1(name)) {
					switch (typeof value) {
						case "function":
						case "symbol": return;
						case "boolean":
							var prefix$8 = name.toLowerCase().slice(0, 5);
							if ("data-" !== prefix$8 && "aria-" !== prefix$8) return;
					}
					target.push(" ", name, "=\"", escapeTextForBrowser$1(value), "\"");
				}
			}
		}
	}
	function pushInnerHTML$1(target, innerHTML, children) {
		if (null != innerHTML) {
			if (null != children) throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
			if ("object" !== typeof innerHTML || !("__html" in innerHTML)) throw Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://react.dev/link/dangerously-set-inner-html for more information.");
			innerHTML = innerHTML.__html;
			null !== innerHTML && void 0 !== innerHTML && target.push("" + innerHTML);
		}
	}
	function flattenOptionChildren$1(children) {
		var content = "";
		React$1.Children.forEach(children, function(child) {
			null != child && (content += child);
		});
		return content;
	}
	function injectFormReplayingRuntime$1(resumableState, renderState) {
		if (0 === (resumableState.instructions & 16)) {
			resumableState.instructions |= 16;
			var preamble = renderState.preamble, bootstrapChunks = renderState.bootstrapChunks;
			(preamble.htmlChunks || preamble.headChunks) && 0 === bootstrapChunks.length ? (bootstrapChunks.push(renderState.startInlineScript), pushCompletedShellIdAttribute$1(bootstrapChunks, resumableState), bootstrapChunks.push(">", "addEventListener(\"submit\",function(a){if(!a.defaultPrevented){var c=a.target,d=a.submitter,e=c.action,b=d;if(d){var f=d.getAttribute(\"formAction\");null!=f&&(e=f,b=null)}\"javascript:throw new Error('React form unexpectedly submitted.')\"===e&&(a.preventDefault(),b?(a=document.createElement(\"input\"),a.name=b.name,a.value=b.value,b.parentNode.insertBefore(a,b),b=new FormData(c),a.parentNode.removeChild(a)):b=new FormData(c),a=c.ownerDocument||c,(a.$$reactFormReplay=a.$$reactFormReplay||[]).push(c,d,b))}});", "<\/script>")) : bootstrapChunks.unshift(renderState.startInlineScript, ">", "addEventListener(\"submit\",function(a){if(!a.defaultPrevented){var c=a.target,d=a.submitter,e=c.action,b=d;if(d){var f=d.getAttribute(\"formAction\");null!=f&&(e=f,b=null)}\"javascript:throw new Error('React form unexpectedly submitted.')\"===e&&(a.preventDefault(),b?(a=document.createElement(\"input\"),a.name=b.name,a.value=b.value,b.parentNode.insertBefore(a,b),b=new FormData(c),a.parentNode.removeChild(a)):b=new FormData(c),a=c.ownerDocument||c,(a.$$reactFormReplay=a.$$reactFormReplay||[]).push(c,d,b))}});", "<\/script>");
		}
	}
	function pushLinkImpl$1(target, props) {
		target.push(startChunkForTag$1("link"));
		for (var propKey in props) if (hasOwnProperty$1.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
				case "dangerouslySetInnerHTML": throw Error("link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
				default: pushAttribute$1(target, propKey, propValue);
			}
		}
		target.push("/>");
		return null;
	}
	var styleRegex$1 = /(<\/|<)(s)(tyle)/gi;
	function styleReplacer$1(match, prefix$2, s$1, suffix$2) {
		return "" + prefix$2 + ("s" === s$1 ? "\\73 " : "\\53 ") + suffix$2;
	}
	function pushSelfClosing$1(target, props, tag) {
		target.push(startChunkForTag$1(tag));
		for (var propKey in props) if (hasOwnProperty$1.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
				case "dangerouslySetInnerHTML": throw Error(tag + " is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
				default: pushAttribute$1(target, propKey, propValue);
			}
		}
		target.push("/>");
		return null;
	}
	function pushTitleImpl$1(target, props) {
		target.push(startChunkForTag$1("title"));
		var children = null, innerHTML = null, propKey;
		for (propKey in props) if (hasOwnProperty$1.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					children = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute$1(target, propKey, propValue);
			}
		}
		target.push(">");
		props = Array.isArray(children) ? 2 > children.length ? children[0] : null : children;
		"function" !== typeof props && "symbol" !== typeof props && null !== props && void 0 !== props && target.push(escapeTextForBrowser$1("" + props));
		pushInnerHTML$1(target, innerHTML, children);
		target.push(endChunkForTag$1("title"));
		return null;
	}
	function pushScriptImpl$1(target, props) {
		target.push(startChunkForTag$1("script"));
		var children = null, innerHTML = null, propKey;
		for (propKey in props) if (hasOwnProperty$1.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					children = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute$1(target, propKey, propValue);
			}
		}
		target.push(">");
		pushInnerHTML$1(target, innerHTML, children);
		"string" === typeof children && target.push(("" + children).replace(scriptRegex$1, scriptReplacer$1));
		target.push(endChunkForTag$1("script"));
		return null;
	}
	function pushStartSingletonElement$1(target, props, tag) {
		target.push(startChunkForTag$1(tag));
		var innerHTML = tag = null, propKey;
		for (propKey in props) if (hasOwnProperty$1.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					tag = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute$1(target, propKey, propValue);
			}
		}
		target.push(">");
		pushInnerHTML$1(target, innerHTML, tag);
		return tag;
	}
	function pushStartGenericElement$1(target, props, tag) {
		target.push(startChunkForTag$1(tag));
		var innerHTML = tag = null, propKey;
		for (propKey in props) if (hasOwnProperty$1.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					tag = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute$1(target, propKey, propValue);
			}
		}
		target.push(">");
		pushInnerHTML$1(target, innerHTML, tag);
		return "string" === typeof tag ? (target.push(escapeTextForBrowser$1(tag)), null) : tag;
	}
	var VALID_TAG_REGEX$1 = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/, validatedTagCache$1 = /* @__PURE__ */ new Map();
	function startChunkForTag$1(tag) {
		var tagStartChunk = validatedTagCache$1.get(tag);
		if (void 0 === tagStartChunk) {
			if (!VALID_TAG_REGEX$1.test(tag)) throw Error("Invalid tag: " + tag);
			tagStartChunk = "<" + tag;
			validatedTagCache$1.set(tag, tagStartChunk);
		}
		return tagStartChunk;
	}
	function pushStartInstance$1(target$jscomp$0, type, props, resumableState, renderState, preambleState, hoistableState, formatContext, textEmbedded) {
		switch (type) {
			case "div":
			case "span":
			case "svg":
			case "path": break;
			case "a":
				target$jscomp$0.push(startChunkForTag$1("a"));
				var children = null, innerHTML = null, propKey;
				for (propKey in props) if (hasOwnProperty$1.call(props, propKey)) {
					var propValue = props[propKey];
					if (null != propValue) switch (propKey) {
						case "children":
							children = propValue;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML = propValue;
							break;
						case "href":
							"" === propValue ? pushStringAttribute$1(target$jscomp$0, "href", "") : pushAttribute$1(target$jscomp$0, propKey, propValue);
							break;
						default: pushAttribute$1(target$jscomp$0, propKey, propValue);
					}
				}
				target$jscomp$0.push(">");
				pushInnerHTML$1(target$jscomp$0, innerHTML, children);
				if ("string" === typeof children) {
					target$jscomp$0.push(escapeTextForBrowser$1(children));
					var JSCompiler_inline_result = null;
				} else JSCompiler_inline_result = children;
				return JSCompiler_inline_result;
			case "g":
			case "p":
			case "li": break;
			case "select":
				target$jscomp$0.push(startChunkForTag$1("select"));
				var children$jscomp$0 = null, innerHTML$jscomp$0 = null, propKey$jscomp$0;
				for (propKey$jscomp$0 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$0)) {
					var propValue$jscomp$0 = props[propKey$jscomp$0];
					if (null != propValue$jscomp$0) switch (propKey$jscomp$0) {
						case "children":
							children$jscomp$0 = propValue$jscomp$0;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$0 = propValue$jscomp$0;
							break;
						case "defaultValue":
						case "value": break;
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$0, propValue$jscomp$0);
					}
				}
				target$jscomp$0.push(">");
				pushInnerHTML$1(target$jscomp$0, innerHTML$jscomp$0, children$jscomp$0);
				return children$jscomp$0;
			case "option":
				var selectedValue = formatContext.selectedValue;
				target$jscomp$0.push(startChunkForTag$1("option"));
				var children$jscomp$1 = null, value = null, selected = null, innerHTML$jscomp$1 = null, propKey$jscomp$1;
				for (propKey$jscomp$1 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$1)) {
					var propValue$jscomp$1 = props[propKey$jscomp$1];
					if (null != propValue$jscomp$1) switch (propKey$jscomp$1) {
						case "children":
							children$jscomp$1 = propValue$jscomp$1;
							break;
						case "selected":
							selected = propValue$jscomp$1;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$1 = propValue$jscomp$1;
							break;
						case "value": value = propValue$jscomp$1;
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$1, propValue$jscomp$1);
					}
				}
				if (null != selectedValue) {
					var stringValue = null !== value ? "" + value : flattenOptionChildren$1(children$jscomp$1);
					if (isArrayImpl$1(selectedValue)) {
						for (var i = 0; i < selectedValue.length; i++) if ("" + selectedValue[i] === stringValue) {
							target$jscomp$0.push(" selected=\"\"");
							break;
						}
					} else "" + selectedValue === stringValue && target$jscomp$0.push(" selected=\"\"");
				} else selected && target$jscomp$0.push(" selected=\"\"");
				target$jscomp$0.push(">");
				pushInnerHTML$1(target$jscomp$0, innerHTML$jscomp$1, children$jscomp$1);
				return children$jscomp$1;
			case "textarea":
				target$jscomp$0.push(startChunkForTag$1("textarea"));
				var value$jscomp$0 = null, defaultValue = null, children$jscomp$2 = null, propKey$jscomp$2;
				for (propKey$jscomp$2 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$2)) {
					var propValue$jscomp$2 = props[propKey$jscomp$2];
					if (null != propValue$jscomp$2) switch (propKey$jscomp$2) {
						case "children":
							children$jscomp$2 = propValue$jscomp$2;
							break;
						case "value":
							value$jscomp$0 = propValue$jscomp$2;
							break;
						case "defaultValue":
							defaultValue = propValue$jscomp$2;
							break;
						case "dangerouslySetInnerHTML": throw Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$2, propValue$jscomp$2);
					}
				}
				null === value$jscomp$0 && null !== defaultValue && (value$jscomp$0 = defaultValue);
				target$jscomp$0.push(">");
				if (null != children$jscomp$2) {
					if (null != value$jscomp$0) throw Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
					if (isArrayImpl$1(children$jscomp$2)) {
						if (1 < children$jscomp$2.length) throw Error("<textarea> can only have at most one child.");
						value$jscomp$0 = "" + children$jscomp$2[0];
					}
					value$jscomp$0 = "" + children$jscomp$2;
				}
				"string" === typeof value$jscomp$0 && "\n" === value$jscomp$0[0] && target$jscomp$0.push("\n");
				null !== value$jscomp$0 && target$jscomp$0.push(escapeTextForBrowser$1("" + value$jscomp$0));
				return null;
			case "input":
				target$jscomp$0.push(startChunkForTag$1("input"));
				var name = null, formAction = null, formEncType = null, formMethod = null, formTarget = null, value$jscomp$1 = null, defaultValue$jscomp$0 = null, checked = null, defaultChecked = null, propKey$jscomp$3;
				for (propKey$jscomp$3 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$3)) {
					var propValue$jscomp$3 = props[propKey$jscomp$3];
					if (null != propValue$jscomp$3) switch (propKey$jscomp$3) {
						case "children":
						case "dangerouslySetInnerHTML": throw Error("input is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
						case "name":
							name = propValue$jscomp$3;
							break;
						case "formAction":
							formAction = propValue$jscomp$3;
							break;
						case "formEncType":
							formEncType = propValue$jscomp$3;
							break;
						case "formMethod":
							formMethod = propValue$jscomp$3;
							break;
						case "formTarget":
							formTarget = propValue$jscomp$3;
							break;
						case "defaultChecked":
							defaultChecked = propValue$jscomp$3;
							break;
						case "defaultValue":
							defaultValue$jscomp$0 = propValue$jscomp$3;
							break;
						case "checked":
							checked = propValue$jscomp$3;
							break;
						case "value":
							value$jscomp$1 = propValue$jscomp$3;
							break;
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$3, propValue$jscomp$3);
					}
				}
				var formData = pushFormActionAttribute$1(target$jscomp$0, resumableState, renderState, formAction, formEncType, formMethod, formTarget, name);
				null !== checked ? pushBooleanAttribute$1(target$jscomp$0, "checked", checked) : null !== defaultChecked && pushBooleanAttribute$1(target$jscomp$0, "checked", defaultChecked);
				null !== value$jscomp$1 ? pushAttribute$1(target$jscomp$0, "value", value$jscomp$1) : null !== defaultValue$jscomp$0 && pushAttribute$1(target$jscomp$0, "value", defaultValue$jscomp$0);
				target$jscomp$0.push("/>");
				formData?.forEach(pushAdditionalFormField$1, target$jscomp$0);
				return null;
			case "button":
				target$jscomp$0.push(startChunkForTag$1("button"));
				var children$jscomp$3 = null, innerHTML$jscomp$2 = null, name$jscomp$0 = null, formAction$jscomp$0 = null, formEncType$jscomp$0 = null, formMethod$jscomp$0 = null, formTarget$jscomp$0 = null, propKey$jscomp$4;
				for (propKey$jscomp$4 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$4)) {
					var propValue$jscomp$4 = props[propKey$jscomp$4];
					if (null != propValue$jscomp$4) switch (propKey$jscomp$4) {
						case "children":
							children$jscomp$3 = propValue$jscomp$4;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$2 = propValue$jscomp$4;
							break;
						case "name":
							name$jscomp$0 = propValue$jscomp$4;
							break;
						case "formAction":
							formAction$jscomp$0 = propValue$jscomp$4;
							break;
						case "formEncType":
							formEncType$jscomp$0 = propValue$jscomp$4;
							break;
						case "formMethod":
							formMethod$jscomp$0 = propValue$jscomp$4;
							break;
						case "formTarget":
							formTarget$jscomp$0 = propValue$jscomp$4;
							break;
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$4, propValue$jscomp$4);
					}
				}
				var formData$jscomp$0 = pushFormActionAttribute$1(target$jscomp$0, resumableState, renderState, formAction$jscomp$0, formEncType$jscomp$0, formMethod$jscomp$0, formTarget$jscomp$0, name$jscomp$0);
				target$jscomp$0.push(">");
				formData$jscomp$0?.forEach(pushAdditionalFormField$1, target$jscomp$0);
				pushInnerHTML$1(target$jscomp$0, innerHTML$jscomp$2, children$jscomp$3);
				if ("string" === typeof children$jscomp$3) {
					target$jscomp$0.push(escapeTextForBrowser$1(children$jscomp$3));
					var JSCompiler_inline_result$jscomp$0 = null;
				} else JSCompiler_inline_result$jscomp$0 = children$jscomp$3;
				return JSCompiler_inline_result$jscomp$0;
			case "form":
				target$jscomp$0.push(startChunkForTag$1("form"));
				var children$jscomp$4 = null, innerHTML$jscomp$3 = null, formAction$jscomp$1 = null, formEncType$jscomp$1 = null, formMethod$jscomp$1 = null, formTarget$jscomp$1 = null, propKey$jscomp$5;
				for (propKey$jscomp$5 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$5)) {
					var propValue$jscomp$5 = props[propKey$jscomp$5];
					if (null != propValue$jscomp$5) switch (propKey$jscomp$5) {
						case "children":
							children$jscomp$4 = propValue$jscomp$5;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$3 = propValue$jscomp$5;
							break;
						case "action":
							formAction$jscomp$1 = propValue$jscomp$5;
							break;
						case "encType":
							formEncType$jscomp$1 = propValue$jscomp$5;
							break;
						case "method":
							formMethod$jscomp$1 = propValue$jscomp$5;
							break;
						case "target":
							formTarget$jscomp$1 = propValue$jscomp$5;
							break;
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$5, propValue$jscomp$5);
					}
				}
				var formData$jscomp$1 = null, formActionName = null;
				if ("function" === typeof formAction$jscomp$1) {
					var customFields = getCustomFormFields$1(resumableState, formAction$jscomp$1);
					null !== customFields ? (formAction$jscomp$1 = customFields.action || "", formEncType$jscomp$1 = customFields.encType, formMethod$jscomp$1 = customFields.method, formTarget$jscomp$1 = customFields.target, formData$jscomp$1 = customFields.data, formActionName = customFields.name) : (target$jscomp$0.push(" ", "action", "=\"", actionJavaScriptURL$1, "\""), formTarget$jscomp$1 = formMethod$jscomp$1 = formEncType$jscomp$1 = formAction$jscomp$1 = null, injectFormReplayingRuntime$1(resumableState, renderState));
				}
				null != formAction$jscomp$1 && pushAttribute$1(target$jscomp$0, "action", formAction$jscomp$1);
				null != formEncType$jscomp$1 && pushAttribute$1(target$jscomp$0, "encType", formEncType$jscomp$1);
				null != formMethod$jscomp$1 && pushAttribute$1(target$jscomp$0, "method", formMethod$jscomp$1);
				null != formTarget$jscomp$1 && pushAttribute$1(target$jscomp$0, "target", formTarget$jscomp$1);
				target$jscomp$0.push(">");
				null !== formActionName && (target$jscomp$0.push("<input type=\"hidden\""), pushStringAttribute$1(target$jscomp$0, "name", formActionName), target$jscomp$0.push("/>"), formData$jscomp$1?.forEach(pushAdditionalFormField$1, target$jscomp$0));
				pushInnerHTML$1(target$jscomp$0, innerHTML$jscomp$3, children$jscomp$4);
				if ("string" === typeof children$jscomp$4) {
					target$jscomp$0.push(escapeTextForBrowser$1(children$jscomp$4));
					var JSCompiler_inline_result$jscomp$1 = null;
				} else JSCompiler_inline_result$jscomp$1 = children$jscomp$4;
				return JSCompiler_inline_result$jscomp$1;
			case "menuitem":
				target$jscomp$0.push(startChunkForTag$1("menuitem"));
				for (var propKey$jscomp$6 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$6)) {
					var propValue$jscomp$6 = props[propKey$jscomp$6];
					if (null != propValue$jscomp$6) switch (propKey$jscomp$6) {
						case "children":
						case "dangerouslySetInnerHTML": throw Error("menuitems cannot have `children` nor `dangerouslySetInnerHTML`.");
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$6, propValue$jscomp$6);
					}
				}
				target$jscomp$0.push(">");
				return null;
			case "object":
				target$jscomp$0.push(startChunkForTag$1("object"));
				var children$jscomp$5 = null, innerHTML$jscomp$4 = null, propKey$jscomp$7;
				for (propKey$jscomp$7 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$7)) {
					var propValue$jscomp$7 = props[propKey$jscomp$7];
					if (null != propValue$jscomp$7) switch (propKey$jscomp$7) {
						case "children":
							children$jscomp$5 = propValue$jscomp$7;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$4 = propValue$jscomp$7;
							break;
						case "data":
							var sanitizedValue = sanitizeURL$1("" + propValue$jscomp$7);
							if ("" === sanitizedValue) break;
							target$jscomp$0.push(" ", "data", "=\"", escapeTextForBrowser$1(sanitizedValue), "\"");
							break;
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$7, propValue$jscomp$7);
					}
				}
				target$jscomp$0.push(">");
				pushInnerHTML$1(target$jscomp$0, innerHTML$jscomp$4, children$jscomp$5);
				if ("string" === typeof children$jscomp$5) {
					target$jscomp$0.push(escapeTextForBrowser$1(children$jscomp$5));
					var JSCompiler_inline_result$jscomp$2 = null;
				} else JSCompiler_inline_result$jscomp$2 = children$jscomp$5;
				return JSCompiler_inline_result$jscomp$2;
			case "title":
				var noscriptTagInScope = formatContext.tagScope & 1, isFallback = formatContext.tagScope & 4;
				if (4 === formatContext.insertionMode || noscriptTagInScope || null != props.itemProp) var JSCompiler_inline_result$jscomp$3 = pushTitleImpl$1(target$jscomp$0, props);
				else isFallback ? JSCompiler_inline_result$jscomp$3 = null : (pushTitleImpl$1(renderState.hoistableChunks, props), JSCompiler_inline_result$jscomp$3 = void 0);
				return JSCompiler_inline_result$jscomp$3;
			case "link":
				var noscriptTagInScope$jscomp$0 = formatContext.tagScope & 1, isFallback$jscomp$0 = formatContext.tagScope & 4, rel = props.rel, href = props.href, precedence = props.precedence;
				if (4 === formatContext.insertionMode || noscriptTagInScope$jscomp$0 || null != props.itemProp || "string" !== typeof rel || "string" !== typeof href || "" === href) {
					pushLinkImpl$1(target$jscomp$0, props);
					var JSCompiler_inline_result$jscomp$4 = null;
				} else if ("stylesheet" === props.rel) if ("string" !== typeof precedence || null != props.disabled || props.onLoad || props.onError) JSCompiler_inline_result$jscomp$4 = pushLinkImpl$1(target$jscomp$0, props);
				else {
					var styleQueue = renderState.styles.get(precedence), resourceState = resumableState.styleResources.hasOwnProperty(href) ? resumableState.styleResources[href] : void 0;
					if (null !== resourceState) {
						resumableState.styleResources[href] = null;
						styleQueue || (styleQueue = {
							precedence: escapeTextForBrowser$1(precedence),
							rules: [],
							hrefs: [],
							sheets: /* @__PURE__ */ new Map()
						}, renderState.styles.set(precedence, styleQueue));
						var resource = {
							state: 0,
							props: assign$1({}, props, {
								"data-precedence": props.precedence,
								precedence: null
							})
						};
						if (resourceState) {
							2 === resourceState.length && adoptPreloadCredentials$1(resource.props, resourceState);
							var preloadResource = renderState.preloads.stylesheets.get(href);
							preloadResource && 0 < preloadResource.length ? preloadResource.length = 0 : resource.state = 1;
						}
						styleQueue.sheets.set(href, resource);
						hoistableState && hoistableState.stylesheets.add(resource);
					} else if (styleQueue) {
						var resource$9 = styleQueue.sheets.get(href);
						resource$9 && hoistableState && hoistableState.stylesheets.add(resource$9);
					}
					textEmbedded && target$jscomp$0.push("<!-- -->");
					JSCompiler_inline_result$jscomp$4 = null;
				}
				else props.onLoad || props.onError ? JSCompiler_inline_result$jscomp$4 = pushLinkImpl$1(target$jscomp$0, props) : (textEmbedded && target$jscomp$0.push("<!-- -->"), JSCompiler_inline_result$jscomp$4 = isFallback$jscomp$0 ? null : pushLinkImpl$1(renderState.hoistableChunks, props));
				return JSCompiler_inline_result$jscomp$4;
			case "script":
				var noscriptTagInScope$jscomp$1 = formatContext.tagScope & 1, asyncProp = props.async;
				if ("string" !== typeof props.src || !props.src || !asyncProp || "function" === typeof asyncProp || "symbol" === typeof asyncProp || props.onLoad || props.onError || 4 === formatContext.insertionMode || noscriptTagInScope$jscomp$1 || null != props.itemProp) var JSCompiler_inline_result$jscomp$5 = pushScriptImpl$1(target$jscomp$0, props);
				else {
					var key = props.src;
					if ("module" === props.type) {
						var resources = resumableState.moduleScriptResources;
						var preloads = renderState.preloads.moduleScripts;
					} else resources = resumableState.scriptResources, preloads = renderState.preloads.scripts;
					var resourceState$jscomp$0 = resources.hasOwnProperty(key) ? resources[key] : void 0;
					if (null !== resourceState$jscomp$0) {
						resources[key] = null;
						var scriptProps = props;
						if (resourceState$jscomp$0) {
							2 === resourceState$jscomp$0.length && (scriptProps = assign$1({}, props), adoptPreloadCredentials$1(scriptProps, resourceState$jscomp$0));
							var preloadResource$jscomp$0 = preloads.get(key);
							preloadResource$jscomp$0 && (preloadResource$jscomp$0.length = 0);
						}
						var resource$jscomp$0 = [];
						renderState.scripts.add(resource$jscomp$0);
						pushScriptImpl$1(resource$jscomp$0, scriptProps);
					}
					textEmbedded && target$jscomp$0.push("<!-- -->");
					JSCompiler_inline_result$jscomp$5 = null;
				}
				return JSCompiler_inline_result$jscomp$5;
			case "style":
				var noscriptTagInScope$jscomp$2 = formatContext.tagScope & 1, precedence$jscomp$0 = props.precedence, href$jscomp$0 = props.href, nonce = props.nonce;
				if (4 === formatContext.insertionMode || noscriptTagInScope$jscomp$2 || null != props.itemProp || "string" !== typeof precedence$jscomp$0 || "string" !== typeof href$jscomp$0 || "" === href$jscomp$0) {
					target$jscomp$0.push(startChunkForTag$1("style"));
					var children$jscomp$6 = null, innerHTML$jscomp$5 = null, propKey$jscomp$8;
					for (propKey$jscomp$8 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$8)) {
						var propValue$jscomp$8 = props[propKey$jscomp$8];
						if (null != propValue$jscomp$8) switch (propKey$jscomp$8) {
							case "children":
								children$jscomp$6 = propValue$jscomp$8;
								break;
							case "dangerouslySetInnerHTML":
								innerHTML$jscomp$5 = propValue$jscomp$8;
								break;
							default: pushAttribute$1(target$jscomp$0, propKey$jscomp$8, propValue$jscomp$8);
						}
					}
					target$jscomp$0.push(">");
					var child = Array.isArray(children$jscomp$6) ? 2 > children$jscomp$6.length ? children$jscomp$6[0] : null : children$jscomp$6;
					"function" !== typeof child && "symbol" !== typeof child && null !== child && void 0 !== child && target$jscomp$0.push(("" + child).replace(styleRegex$1, styleReplacer$1));
					pushInnerHTML$1(target$jscomp$0, innerHTML$jscomp$5, children$jscomp$6);
					target$jscomp$0.push(endChunkForTag$1("style"));
					var JSCompiler_inline_result$jscomp$6 = null;
				} else {
					var styleQueue$jscomp$0 = renderState.styles.get(precedence$jscomp$0);
					if (null !== (resumableState.styleResources.hasOwnProperty(href$jscomp$0) ? resumableState.styleResources[href$jscomp$0] : void 0)) {
						resumableState.styleResources[href$jscomp$0] = null;
						styleQueue$jscomp$0 || (styleQueue$jscomp$0 = {
							precedence: escapeTextForBrowser$1(precedence$jscomp$0),
							rules: [],
							hrefs: [],
							sheets: /* @__PURE__ */ new Map()
						}, renderState.styles.set(precedence$jscomp$0, styleQueue$jscomp$0));
						var nonceStyle = renderState.nonce.style;
						if (!nonceStyle || nonceStyle === nonce) {
							styleQueue$jscomp$0.hrefs.push(escapeTextForBrowser$1(href$jscomp$0));
							var target = styleQueue$jscomp$0.rules, children$jscomp$7 = null, innerHTML$jscomp$6 = null, propKey$jscomp$9;
							for (propKey$jscomp$9 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$9)) {
								var propValue$jscomp$9 = props[propKey$jscomp$9];
								if (null != propValue$jscomp$9) switch (propKey$jscomp$9) {
									case "children":
										children$jscomp$7 = propValue$jscomp$9;
										break;
									case "dangerouslySetInnerHTML": innerHTML$jscomp$6 = propValue$jscomp$9;
								}
							}
							var child$jscomp$0 = Array.isArray(children$jscomp$7) ? 2 > children$jscomp$7.length ? children$jscomp$7[0] : null : children$jscomp$7;
							"function" !== typeof child$jscomp$0 && "symbol" !== typeof child$jscomp$0 && null !== child$jscomp$0 && void 0 !== child$jscomp$0 && target.push(("" + child$jscomp$0).replace(styleRegex$1, styleReplacer$1));
							pushInnerHTML$1(target, innerHTML$jscomp$6, children$jscomp$7);
						}
					}
					styleQueue$jscomp$0 && hoistableState && hoistableState.styles.add(styleQueue$jscomp$0);
					textEmbedded && target$jscomp$0.push("<!-- -->");
					JSCompiler_inline_result$jscomp$6 = void 0;
				}
				return JSCompiler_inline_result$jscomp$6;
			case "meta":
				var noscriptTagInScope$jscomp$3 = formatContext.tagScope & 1, isFallback$jscomp$1 = formatContext.tagScope & 4;
				if (4 === formatContext.insertionMode || noscriptTagInScope$jscomp$3 || null != props.itemProp) var JSCompiler_inline_result$jscomp$7 = pushSelfClosing$1(target$jscomp$0, props, "meta");
				else textEmbedded && target$jscomp$0.push("<!-- -->"), JSCompiler_inline_result$jscomp$7 = isFallback$jscomp$1 ? null : "string" === typeof props.charSet ? pushSelfClosing$1(renderState.charsetChunks, props, "meta") : "viewport" === props.name ? pushSelfClosing$1(renderState.viewportChunks, props, "meta") : pushSelfClosing$1(renderState.hoistableChunks, props, "meta");
				return JSCompiler_inline_result$jscomp$7;
			case "listing":
			case "pre":
				target$jscomp$0.push(startChunkForTag$1(type));
				var children$jscomp$8 = null, innerHTML$jscomp$7 = null, propKey$jscomp$10;
				for (propKey$jscomp$10 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$10)) {
					var propValue$jscomp$10 = props[propKey$jscomp$10];
					if (null != propValue$jscomp$10) switch (propKey$jscomp$10) {
						case "children":
							children$jscomp$8 = propValue$jscomp$10;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$7 = propValue$jscomp$10;
							break;
						default: pushAttribute$1(target$jscomp$0, propKey$jscomp$10, propValue$jscomp$10);
					}
				}
				target$jscomp$0.push(">");
				if (null != innerHTML$jscomp$7) {
					if (null != children$jscomp$8) throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
					if ("object" !== typeof innerHTML$jscomp$7 || !("__html" in innerHTML$jscomp$7)) throw Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://react.dev/link/dangerously-set-inner-html for more information.");
					var html = innerHTML$jscomp$7.__html;
					null !== html && void 0 !== html && ("string" === typeof html && 0 < html.length && "\n" === html[0] ? target$jscomp$0.push("\n", html) : target$jscomp$0.push("" + html));
				}
				"string" === typeof children$jscomp$8 && "\n" === children$jscomp$8[0] && target$jscomp$0.push("\n");
				return children$jscomp$8;
			case "img":
				var pictureOrNoScriptTagInScope = formatContext.tagScope & 3, src = props.src, srcSet = props.srcSet;
				if (!("lazy" === props.loading || !src && !srcSet || "string" !== typeof src && null != src || "string" !== typeof srcSet && null != srcSet || "low" === props.fetchPriority || pictureOrNoScriptTagInScope) && ("string" !== typeof src || ":" !== src[4] || "d" !== src[0] && "D" !== src[0] || "a" !== src[1] && "A" !== src[1] || "t" !== src[2] && "T" !== src[2] || "a" !== src[3] && "A" !== src[3]) && ("string" !== typeof srcSet || ":" !== srcSet[4] || "d" !== srcSet[0] && "D" !== srcSet[0] || "a" !== srcSet[1] && "A" !== srcSet[1] || "t" !== srcSet[2] && "T" !== srcSet[2] || "a" !== srcSet[3] && "A" !== srcSet[3])) {
					null !== hoistableState && formatContext.tagScope & 64 && (hoistableState.suspenseyImages = !0);
					var sizes = "string" === typeof props.sizes ? props.sizes : void 0, key$jscomp$0 = srcSet ? srcSet + "\n" + (sizes || "") : src, promotablePreloads = renderState.preloads.images, resource$jscomp$1 = promotablePreloads.get(key$jscomp$0);
					if (resource$jscomp$1) {
						if ("high" === props.fetchPriority || 10 > renderState.highImagePreloads.size) promotablePreloads.delete(key$jscomp$0), renderState.highImagePreloads.add(resource$jscomp$1);
					} else if (!resumableState.imageResources.hasOwnProperty(key$jscomp$0)) {
						resumableState.imageResources[key$jscomp$0] = PRELOAD_NO_CREDS$1;
						var input = props.crossOrigin;
						var JSCompiler_inline_result$jscomp$8 = "string" === typeof input ? "use-credentials" === input ? input : "" : void 0;
						var headers = renderState.headers, header;
						headers && 0 < headers.remainingCapacity && "string" !== typeof props.srcSet && ("high" === props.fetchPriority || 500 > headers.highImagePreloads.length) && (header = getPreloadAsHeader$1(src, "image", {
							imageSrcSet: props.srcSet,
							imageSizes: props.sizes,
							crossOrigin: JSCompiler_inline_result$jscomp$8,
							integrity: props.integrity,
							nonce: props.nonce,
							type: props.type,
							fetchPriority: props.fetchPriority,
							referrerPolicy: props.refererPolicy
						}), 0 <= (headers.remainingCapacity -= header.length + 2)) ? (renderState.resets.image[key$jscomp$0] = PRELOAD_NO_CREDS$1, headers.highImagePreloads && (headers.highImagePreloads += ", "), headers.highImagePreloads += header) : (resource$jscomp$1 = [], pushLinkImpl$1(resource$jscomp$1, {
							rel: "preload",
							as: "image",
							href: srcSet ? void 0 : src,
							imageSrcSet: srcSet,
							imageSizes: sizes,
							crossOrigin: JSCompiler_inline_result$jscomp$8,
							integrity: props.integrity,
							type: props.type,
							fetchPriority: props.fetchPriority,
							referrerPolicy: props.referrerPolicy
						}), "high" === props.fetchPriority || 10 > renderState.highImagePreloads.size ? renderState.highImagePreloads.add(resource$jscomp$1) : (renderState.bulkPreloads.add(resource$jscomp$1), promotablePreloads.set(key$jscomp$0, resource$jscomp$1)));
					}
				}
				return pushSelfClosing$1(target$jscomp$0, props, "img");
			case "base":
			case "area":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "param":
			case "source":
			case "track":
			case "wbr": return pushSelfClosing$1(target$jscomp$0, props, type);
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": break;
			case "head":
				if (2 > formatContext.insertionMode) {
					var preamble = preambleState || renderState.preamble;
					if (preamble.headChunks) throw Error("The `<head>` tag may only be rendered once.");
					null !== preambleState && target$jscomp$0.push("<!--head-->");
					preamble.headChunks = [];
					var JSCompiler_inline_result$jscomp$9 = pushStartSingletonElement$1(preamble.headChunks, props, "head");
				} else JSCompiler_inline_result$jscomp$9 = pushStartGenericElement$1(target$jscomp$0, props, "head");
				return JSCompiler_inline_result$jscomp$9;
			case "body":
				if (2 > formatContext.insertionMode) {
					var preamble$jscomp$0 = preambleState || renderState.preamble;
					if (preamble$jscomp$0.bodyChunks) throw Error("The `<body>` tag may only be rendered once.");
					null !== preambleState && target$jscomp$0.push("<!--body-->");
					preamble$jscomp$0.bodyChunks = [];
					var JSCompiler_inline_result$jscomp$10 = pushStartSingletonElement$1(preamble$jscomp$0.bodyChunks, props, "body");
				} else JSCompiler_inline_result$jscomp$10 = pushStartGenericElement$1(target$jscomp$0, props, "body");
				return JSCompiler_inline_result$jscomp$10;
			case "html":
				if (0 === formatContext.insertionMode) {
					var preamble$jscomp$1 = preambleState || renderState.preamble;
					if (preamble$jscomp$1.htmlChunks) throw Error("The `<html>` tag may only be rendered once.");
					null !== preambleState && target$jscomp$0.push("<!--html-->");
					preamble$jscomp$1.htmlChunks = [""];
					var JSCompiler_inline_result$jscomp$11 = pushStartSingletonElement$1(preamble$jscomp$1.htmlChunks, props, "html");
				} else JSCompiler_inline_result$jscomp$11 = pushStartGenericElement$1(target$jscomp$0, props, "html");
				return JSCompiler_inline_result$jscomp$11;
			default: if (-1 !== type.indexOf("-")) {
				target$jscomp$0.push(startChunkForTag$1(type));
				var children$jscomp$9 = null, innerHTML$jscomp$8 = null, propKey$jscomp$11;
				for (propKey$jscomp$11 in props) if (hasOwnProperty$1.call(props, propKey$jscomp$11)) {
					var propValue$jscomp$11 = props[propKey$jscomp$11];
					if (null != propValue$jscomp$11) {
						var attributeName = propKey$jscomp$11;
						switch (propKey$jscomp$11) {
							case "children":
								children$jscomp$9 = propValue$jscomp$11;
								break;
							case "dangerouslySetInnerHTML":
								innerHTML$jscomp$8 = propValue$jscomp$11;
								break;
							case "style":
								pushStyleAttribute$1(target$jscomp$0, propValue$jscomp$11);
								break;
							case "suppressContentEditableWarning":
							case "suppressHydrationWarning":
							case "ref": break;
							case "className": attributeName = "class";
							default: if (isAttributeNameSafe$1(propKey$jscomp$11) && "function" !== typeof propValue$jscomp$11 && "symbol" !== typeof propValue$jscomp$11 && !1 !== propValue$jscomp$11) {
								if (!0 === propValue$jscomp$11) propValue$jscomp$11 = "";
								else if ("object" === typeof propValue$jscomp$11) continue;
								target$jscomp$0.push(" ", attributeName, "=\"", escapeTextForBrowser$1(propValue$jscomp$11), "\"");
							}
						}
					}
				}
				target$jscomp$0.push(">");
				pushInnerHTML$1(target$jscomp$0, innerHTML$jscomp$8, children$jscomp$9);
				return children$jscomp$9;
			}
		}
		return pushStartGenericElement$1(target$jscomp$0, props, type);
	}
	var endTagCache$1 = /* @__PURE__ */ new Map();
	function endChunkForTag$1(tag) {
		var chunk = endTagCache$1.get(tag);
		void 0 === chunk && (chunk = "</" + tag + ">", endTagCache$1.set(tag, chunk));
		return chunk;
	}
	function hoistPreambleState$1(renderState, preambleState) {
		renderState = renderState.preamble;
		null === renderState.htmlChunks && preambleState.htmlChunks && (renderState.htmlChunks = preambleState.htmlChunks);
		null === renderState.headChunks && preambleState.headChunks && (renderState.headChunks = preambleState.headChunks);
		null === renderState.bodyChunks && preambleState.bodyChunks && (renderState.bodyChunks = preambleState.bodyChunks);
	}
	function writeBootstrap$1(destination, renderState) {
		renderState = renderState.bootstrapChunks;
		for (var i = 0; i < renderState.length - 1; i++) destination.push(renderState[i]);
		return i < renderState.length ? (i = renderState[i], renderState.length = 0, destination.push(i)) : !0;
	}
	function writeStartPendingSuspenseBoundary$1(destination, renderState, id) {
		destination.push("<!--$?--><template id=\"");
		if (null === id) throw Error("An ID must have been assigned before we can complete the boundary.");
		destination.push(renderState.boundaryPrefix);
		renderState = id.toString(16);
		destination.push(renderState);
		return destination.push("\"></template>");
	}
	function writeStartSegment$1(destination, renderState, formatContext, id) {
		switch (formatContext.insertionMode) {
			case 0:
			case 1:
			case 3:
			case 2: return destination.push("<div hidden id=\""), destination.push(renderState.segmentPrefix), renderState = id.toString(16), destination.push(renderState), destination.push("\">");
			case 4: return destination.push("<svg aria-hidden=\"true\" style=\"display:none\" id=\""), destination.push(renderState.segmentPrefix), renderState = id.toString(16), destination.push(renderState), destination.push("\">");
			case 5: return destination.push("<math aria-hidden=\"true\" style=\"display:none\" id=\""), destination.push(renderState.segmentPrefix), renderState = id.toString(16), destination.push(renderState), destination.push("\">");
			case 6: return destination.push("<table hidden id=\""), destination.push(renderState.segmentPrefix), renderState = id.toString(16), destination.push(renderState), destination.push("\">");
			case 7: return destination.push("<table hidden><tbody id=\""), destination.push(renderState.segmentPrefix), renderState = id.toString(16), destination.push(renderState), destination.push("\">");
			case 8: return destination.push("<table hidden><tr id=\""), destination.push(renderState.segmentPrefix), renderState = id.toString(16), destination.push(renderState), destination.push("\">");
			case 9: return destination.push("<table hidden><colgroup id=\""), destination.push(renderState.segmentPrefix), renderState = id.toString(16), destination.push(renderState), destination.push("\">");
			default: throw Error("Unknown insertion mode. This is a bug in React.");
		}
	}
	function writeEndSegment$1(destination, formatContext) {
		switch (formatContext.insertionMode) {
			case 0:
			case 1:
			case 3:
			case 2: return destination.push("</div>");
			case 4: return destination.push("</svg>");
			case 5: return destination.push("</math>");
			case 6: return destination.push("</table>");
			case 7: return destination.push("</tbody></table>");
			case 8: return destination.push("</tr></table>");
			case 9: return destination.push("</colgroup></table>");
			default: throw Error("Unknown insertion mode. This is a bug in React.");
		}
	}
	var regexForJSStringsInInstructionScripts$1 = /[<\u2028\u2029]/g;
	function escapeJSStringsForInstructionScripts$1(input) {
		return JSON.stringify(input).replace(regexForJSStringsInInstructionScripts$1, function(match) {
			switch (match) {
				case "<": return "\\u003c";
				case "\u2028": return "\\u2028";
				case "\u2029": return "\\u2029";
				default: throw Error("escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
			}
		});
	}
	var regexForJSStringsInScripts$1 = /[&><\u2028\u2029]/g;
	function escapeJSObjectForInstructionScripts$1(input) {
		return JSON.stringify(input).replace(regexForJSStringsInScripts$1, function(match) {
			switch (match) {
				case "&": return "\\u0026";
				case ">": return "\\u003e";
				case "<": return "\\u003c";
				case "\u2028": return "\\u2028";
				case "\u2029": return "\\u2029";
				default: throw Error("escapeJSObjectForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
			}
		});
	}
	var currentlyRenderingBoundaryHasStylesToHoist$1 = !1, destinationHasCapacity$2 = !0;
	function flushStyleTagsLateForBoundary$1(styleQueue) {
		var rules = styleQueue.rules, hrefs = styleQueue.hrefs, i = 0;
		if (hrefs.length) {
			this.push(currentlyFlushingRenderState$1.startInlineStyle);
			this.push(" media=\"not all\" data-precedence=\"");
			this.push(styleQueue.precedence);
			for (this.push("\" data-href=\""); i < hrefs.length - 1; i++) this.push(hrefs[i]), this.push(" ");
			this.push(hrefs[i]);
			this.push("\">");
			for (i = 0; i < rules.length; i++) this.push(rules[i]);
			destinationHasCapacity$2 = this.push("</style>");
			currentlyRenderingBoundaryHasStylesToHoist$1 = !0;
			rules.length = 0;
			hrefs.length = 0;
		}
	}
	function hasStylesToHoist$1(stylesheet) {
		return 2 !== stylesheet.state ? currentlyRenderingBoundaryHasStylesToHoist$1 = !0 : !1;
	}
	function writeHoistablesForBoundary$1(destination, hoistableState, renderState) {
		currentlyRenderingBoundaryHasStylesToHoist$1 = !1;
		destinationHasCapacity$2 = !0;
		currentlyFlushingRenderState$1 = renderState;
		hoistableState.styles.forEach(flushStyleTagsLateForBoundary$1, destination);
		currentlyFlushingRenderState$1 = null;
		hoistableState.stylesheets.forEach(hasStylesToHoist$1);
		currentlyRenderingBoundaryHasStylesToHoist$1 && (renderState.stylesToHoist = !0);
		return destinationHasCapacity$2;
	}
	function flushResource$1(resource) {
		for (var i = 0; i < resource.length; i++) this.push(resource[i]);
		resource.length = 0;
	}
	var stylesheetFlushingQueue$1 = [];
	function flushStyleInPreamble$1(stylesheet) {
		pushLinkImpl$1(stylesheetFlushingQueue$1, stylesheet.props);
		for (var i = 0; i < stylesheetFlushingQueue$1.length; i++) this.push(stylesheetFlushingQueue$1[i]);
		stylesheetFlushingQueue$1.length = 0;
		stylesheet.state = 2;
	}
	function flushStylesInPreamble$1(styleQueue) {
		var hasStylesheets = 0 < styleQueue.sheets.size;
		styleQueue.sheets.forEach(flushStyleInPreamble$1, this);
		styleQueue.sheets.clear();
		var rules = styleQueue.rules, hrefs = styleQueue.hrefs;
		if (!hasStylesheets || hrefs.length) {
			this.push(currentlyFlushingRenderState$1.startInlineStyle);
			this.push(" data-precedence=\"");
			this.push(styleQueue.precedence);
			styleQueue = 0;
			if (hrefs.length) {
				for (this.push("\" data-href=\""); styleQueue < hrefs.length - 1; styleQueue++) this.push(hrefs[styleQueue]), this.push(" ");
				this.push(hrefs[styleQueue]);
			}
			this.push("\">");
			for (styleQueue = 0; styleQueue < rules.length; styleQueue++) this.push(rules[styleQueue]);
			this.push("</style>");
			rules.length = 0;
			hrefs.length = 0;
		}
	}
	function preloadLateStyle$1(stylesheet) {
		if (0 === stylesheet.state) {
			stylesheet.state = 1;
			var props = stylesheet.props;
			pushLinkImpl$1(stylesheetFlushingQueue$1, {
				rel: "preload",
				as: "style",
				href: stylesheet.props.href,
				crossOrigin: props.crossOrigin,
				fetchPriority: props.fetchPriority,
				integrity: props.integrity,
				media: props.media,
				hrefLang: props.hrefLang,
				referrerPolicy: props.referrerPolicy
			});
			for (stylesheet = 0; stylesheet < stylesheetFlushingQueue$1.length; stylesheet++) this.push(stylesheetFlushingQueue$1[stylesheet]);
			stylesheetFlushingQueue$1.length = 0;
		}
	}
	function preloadLateStyles$1(styleQueue) {
		styleQueue.sheets.forEach(preloadLateStyle$1, this);
		styleQueue.sheets.clear();
	}
	function pushCompletedShellIdAttribute$1(target, resumableState) {
		0 === (resumableState.instructions & 32) && (resumableState.instructions |= 32, target.push(" id=\"", escapeTextForBrowser$1("_" + resumableState.idPrefix + "R_"), "\""));
	}
	function writeStyleResourceDependenciesInJS$1(destination, hoistableState) {
		destination.push("[");
		var nextArrayOpenBrackChunk = "[";
		hoistableState.stylesheets.forEach(function(resource) {
			if (2 !== resource.state) if (3 === resource.state) destination.push(nextArrayOpenBrackChunk), resource = escapeJSObjectForInstructionScripts$1("" + resource.props.href), destination.push(resource), destination.push("]"), nextArrayOpenBrackChunk = ",[";
			else {
				destination.push(nextArrayOpenBrackChunk);
				var precedence = resource.props["data-precedence"], props = resource.props, coercedHref = sanitizeURL$1("" + resource.props.href);
				coercedHref = escapeJSObjectForInstructionScripts$1(coercedHref);
				destination.push(coercedHref);
				precedence = "" + precedence;
				destination.push(",");
				precedence = escapeJSObjectForInstructionScripts$1(precedence);
				destination.push(precedence);
				for (var propKey in props) if (hasOwnProperty$1.call(props, propKey) && (precedence = props[propKey], null != precedence)) switch (propKey) {
					case "href":
					case "rel":
					case "precedence":
					case "data-precedence": break;
					case "children":
					case "dangerouslySetInnerHTML": throw Error("link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
					default: writeStyleResourceAttributeInJS$1(destination, propKey, precedence);
				}
				destination.push("]");
				nextArrayOpenBrackChunk = ",[";
				resource.state = 3;
			}
		});
		destination.push("]");
	}
	function writeStyleResourceAttributeInJS$1(destination, name, value) {
		var attributeName = name.toLowerCase();
		switch (typeof value) {
			case "function":
			case "symbol": return;
		}
		switch (name) {
			case "innerHTML":
			case "dangerouslySetInnerHTML":
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "style":
			case "ref": return;
			case "className":
				attributeName = "class";
				name = "" + value;
				break;
			case "hidden":
				if (!1 === value) return;
				name = "";
				break;
			case "src":
			case "href":
				value = sanitizeURL$1(value);
				name = "" + value;
				break;
			default:
				if (2 < name.length && ("o" === name[0] || "O" === name[0]) && ("n" === name[1] || "N" === name[1]) || !isAttributeNameSafe$1(name)) return;
				name = "" + value;
		}
		destination.push(",");
		attributeName = escapeJSObjectForInstructionScripts$1(attributeName);
		destination.push(attributeName);
		destination.push(",");
		attributeName = escapeJSObjectForInstructionScripts$1(name);
		destination.push(attributeName);
	}
	function createHoistableState$1() {
		return {
			styles: /* @__PURE__ */ new Set(),
			stylesheets: /* @__PURE__ */ new Set(),
			suspenseyImages: !1
		};
	}
	function prefetchDNS$1(href) {
		var request = currentRequest$1 ? currentRequest$1 : null;
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if ("string" === typeof href && href) {
				if (!resumableState.dnsResources.hasOwnProperty(href)) {
					resumableState.dnsResources[href] = null;
					resumableState = renderState.headers;
					var header, JSCompiler_temp;
					if (JSCompiler_temp = resumableState && 0 < resumableState.remainingCapacity) JSCompiler_temp = (header = "<" + ("" + href).replace(regexForHrefInLinkHeaderURLContext$1, escapeHrefForLinkHeaderURLContextReplacer$1) + ">; rel=dns-prefetch", 0 <= (resumableState.remainingCapacity -= header.length + 2));
					JSCompiler_temp ? (renderState.resets.dns[href] = null, resumableState.preconnects && (resumableState.preconnects += ", "), resumableState.preconnects += header) : (header = [], pushLinkImpl$1(header, {
						href,
						rel: "dns-prefetch"
					}), renderState.preconnects.add(header));
				}
				enqueueFlush$1(request);
			}
		} else previousDispatcher$1.D(href);
	}
	function preconnect$1(href, crossOrigin) {
		var request = currentRequest$1 ? currentRequest$1 : null;
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if ("string" === typeof href && href) {
				var bucket = "use-credentials" === crossOrigin ? "credentials" : "string" === typeof crossOrigin ? "anonymous" : "default";
				if (!resumableState.connectResources[bucket].hasOwnProperty(href)) {
					resumableState.connectResources[bucket][href] = null;
					resumableState = renderState.headers;
					var header, JSCompiler_temp;
					if (JSCompiler_temp = resumableState && 0 < resumableState.remainingCapacity) {
						JSCompiler_temp = "<" + ("" + href).replace(regexForHrefInLinkHeaderURLContext$1, escapeHrefForLinkHeaderURLContextReplacer$1) + ">; rel=preconnect";
						if ("string" === typeof crossOrigin) {
							var escapedCrossOrigin = ("" + crossOrigin).replace(regexForLinkHeaderQuotedParamValueContext$1, escapeStringForLinkHeaderQuotedParamValueContextReplacer$1);
							JSCompiler_temp += "; crossorigin=\"" + escapedCrossOrigin + "\"";
						}
						JSCompiler_temp = (header = JSCompiler_temp, 0 <= (resumableState.remainingCapacity -= header.length + 2));
					}
					JSCompiler_temp ? (renderState.resets.connect[bucket][href] = null, resumableState.preconnects && (resumableState.preconnects += ", "), resumableState.preconnects += header) : (bucket = [], pushLinkImpl$1(bucket, {
						rel: "preconnect",
						href,
						crossOrigin
					}), renderState.preconnects.add(bucket));
				}
				enqueueFlush$1(request);
			}
		} else previousDispatcher$1.C(href, crossOrigin);
	}
	function preload$1(href, as, options) {
		var request = currentRequest$1 ? currentRequest$1 : null;
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (as && href) {
				switch (as) {
					case "image":
						if (options) {
							var imageSrcSet = options.imageSrcSet;
							var imageSizes = options.imageSizes;
							var fetchPriority = options.fetchPriority;
						}
						var key = imageSrcSet ? imageSrcSet + "\n" + (imageSizes || "") : href;
						if (resumableState.imageResources.hasOwnProperty(key)) return;
						resumableState.imageResources[key] = PRELOAD_NO_CREDS$1;
						resumableState = renderState.headers;
						var header;
						resumableState && 0 < resumableState.remainingCapacity && "string" !== typeof imageSrcSet && "high" === fetchPriority && (header = getPreloadAsHeader$1(href, as, options), 0 <= (resumableState.remainingCapacity -= header.length + 2)) ? (renderState.resets.image[key] = PRELOAD_NO_CREDS$1, resumableState.highImagePreloads && (resumableState.highImagePreloads += ", "), resumableState.highImagePreloads += header) : (resumableState = [], pushLinkImpl$1(resumableState, assign$1({
							rel: "preload",
							href: imageSrcSet ? void 0 : href,
							as
						}, options)), "high" === fetchPriority ? renderState.highImagePreloads.add(resumableState) : (renderState.bulkPreloads.add(resumableState), renderState.preloads.images.set(key, resumableState)));
						break;
					case "style":
						if (resumableState.styleResources.hasOwnProperty(href)) return;
						imageSrcSet = [];
						pushLinkImpl$1(imageSrcSet, assign$1({
							rel: "preload",
							href,
							as
						}, options));
						resumableState.styleResources[href] = !options || "string" !== typeof options.crossOrigin && "string" !== typeof options.integrity ? PRELOAD_NO_CREDS$1 : [options.crossOrigin, options.integrity];
						renderState.preloads.stylesheets.set(href, imageSrcSet);
						renderState.bulkPreloads.add(imageSrcSet);
						break;
					case "script":
						if (resumableState.scriptResources.hasOwnProperty(href)) return;
						imageSrcSet = [];
						renderState.preloads.scripts.set(href, imageSrcSet);
						renderState.bulkPreloads.add(imageSrcSet);
						pushLinkImpl$1(imageSrcSet, assign$1({
							rel: "preload",
							href,
							as
						}, options));
						resumableState.scriptResources[href] = !options || "string" !== typeof options.crossOrigin && "string" !== typeof options.integrity ? PRELOAD_NO_CREDS$1 : [options.crossOrigin, options.integrity];
						break;
					default:
						if (resumableState.unknownResources.hasOwnProperty(as)) {
							if (imageSrcSet = resumableState.unknownResources[as], imageSrcSet.hasOwnProperty(href)) return;
						} else imageSrcSet = {}, resumableState.unknownResources[as] = imageSrcSet;
						imageSrcSet[href] = PRELOAD_NO_CREDS$1;
						if ((resumableState = renderState.headers) && 0 < resumableState.remainingCapacity && "font" === as && (key = getPreloadAsHeader$1(href, as, options), 0 <= (resumableState.remainingCapacity -= key.length + 2))) renderState.resets.font[href] = PRELOAD_NO_CREDS$1, resumableState.fontPreloads && (resumableState.fontPreloads += ", "), resumableState.fontPreloads += key;
						else switch (resumableState = [], href = assign$1({
							rel: "preload",
							href,
							as
						}, options), pushLinkImpl$1(resumableState, href), as) {
							case "font":
								renderState.fontPreloads.add(resumableState);
								break;
							default: renderState.bulkPreloads.add(resumableState);
						}
				}
				enqueueFlush$1(request);
			}
		} else previousDispatcher$1.L(href, as, options);
	}
	function preloadModule$1(href, options) {
		var request = currentRequest$1 ? currentRequest$1 : null;
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (href) {
				var as = options && "string" === typeof options.as ? options.as : "script";
				switch (as) {
					case "script":
						if (resumableState.moduleScriptResources.hasOwnProperty(href)) return;
						as = [];
						resumableState.moduleScriptResources[href] = !options || "string" !== typeof options.crossOrigin && "string" !== typeof options.integrity ? PRELOAD_NO_CREDS$1 : [options.crossOrigin, options.integrity];
						renderState.preloads.moduleScripts.set(href, as);
						break;
					default:
						if (resumableState.moduleUnknownResources.hasOwnProperty(as)) {
							var resources = resumableState.unknownResources[as];
							if (resources.hasOwnProperty(href)) return;
						} else resources = {}, resumableState.moduleUnknownResources[as] = resources;
						as = [];
						resources[href] = PRELOAD_NO_CREDS$1;
				}
				pushLinkImpl$1(as, assign$1({
					rel: "modulepreload",
					href
				}, options));
				renderState.bulkPreloads.add(as);
				enqueueFlush$1(request);
			}
		} else previousDispatcher$1.m(href, options);
	}
	function preinitStyle$1(href, precedence, options) {
		var request = currentRequest$1 ? currentRequest$1 : null;
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (href) {
				precedence = precedence || "default";
				var styleQueue = renderState.styles.get(precedence), resourceState = resumableState.styleResources.hasOwnProperty(href) ? resumableState.styleResources[href] : void 0;
				null !== resourceState && (resumableState.styleResources[href] = null, styleQueue || (styleQueue = {
					precedence: escapeTextForBrowser$1(precedence),
					rules: [],
					hrefs: [],
					sheets: /* @__PURE__ */ new Map()
				}, renderState.styles.set(precedence, styleQueue)), precedence = {
					state: 0,
					props: assign$1({
						rel: "stylesheet",
						href,
						"data-precedence": precedence
					}, options)
				}, resourceState && (2 === resourceState.length && adoptPreloadCredentials$1(precedence.props, resourceState), (renderState = renderState.preloads.stylesheets.get(href)) && 0 < renderState.length ? renderState.length = 0 : precedence.state = 1), styleQueue.sheets.set(href, precedence), enqueueFlush$1(request));
			}
		} else previousDispatcher$1.S(href, precedence, options);
	}
	function preinitScript$1(src, options) {
		var request = currentRequest$1 ? currentRequest$1 : null;
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (src) {
				var resourceState = resumableState.scriptResources.hasOwnProperty(src) ? resumableState.scriptResources[src] : void 0;
				null !== resourceState && (resumableState.scriptResources[src] = null, options = assign$1({
					src,
					async: !0
				}, options), resourceState && (2 === resourceState.length && adoptPreloadCredentials$1(options, resourceState), src = renderState.preloads.scripts.get(src)) && (src.length = 0), src = [], renderState.scripts.add(src), pushScriptImpl$1(src, options), enqueueFlush$1(request));
			}
		} else previousDispatcher$1.X(src, options);
	}
	function preinitModuleScript$1(src, options) {
		var request = currentRequest$1 ? currentRequest$1 : null;
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (src) {
				var resourceState = resumableState.moduleScriptResources.hasOwnProperty(src) ? resumableState.moduleScriptResources[src] : void 0;
				null !== resourceState && (resumableState.moduleScriptResources[src] = null, options = assign$1({
					src,
					type: "module",
					async: !0
				}, options), resourceState && (2 === resourceState.length && adoptPreloadCredentials$1(options, resourceState), src = renderState.preloads.moduleScripts.get(src)) && (src.length = 0), src = [], renderState.scripts.add(src), pushScriptImpl$1(src, options), enqueueFlush$1(request));
			}
		} else previousDispatcher$1.M(src, options);
	}
	function adoptPreloadCredentials$1(target, preloadState) {
		target.crossOrigin ??= preloadState[0];
		target.integrity ??= preloadState[1];
	}
	function getPreloadAsHeader$1(href, as, params) {
		href = ("" + href).replace(regexForHrefInLinkHeaderURLContext$1, escapeHrefForLinkHeaderURLContextReplacer$1);
		as = ("" + as).replace(regexForLinkHeaderQuotedParamValueContext$1, escapeStringForLinkHeaderQuotedParamValueContextReplacer$1);
		as = "<" + href + ">; rel=preload; as=\"" + as + "\"";
		for (var paramName in params) hasOwnProperty$1.call(params, paramName) && (href = params[paramName], "string" === typeof href && (as += "; " + paramName.toLowerCase() + "=\"" + ("" + href).replace(regexForLinkHeaderQuotedParamValueContext$1, escapeStringForLinkHeaderQuotedParamValueContextReplacer$1) + "\""));
		return as;
	}
	var regexForHrefInLinkHeaderURLContext$1 = /[<>\r\n]/g;
	function escapeHrefForLinkHeaderURLContextReplacer$1(match) {
		switch (match) {
			case "<": return "%3C";
			case ">": return "%3E";
			case "\n": return "%0A";
			case "\r": return "%0D";
			default: throw Error("escapeLinkHrefForHeaderContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
		}
	}
	var regexForLinkHeaderQuotedParamValueContext$1 = /["';,\r\n]/g;
	function escapeStringForLinkHeaderQuotedParamValueContextReplacer$1(match) {
		switch (match) {
			case "\"": return "%22";
			case "'": return "%27";
			case ";": return "%3B";
			case ",": return "%2C";
			case "\n": return "%0A";
			case "\r": return "%0D";
			default: throw Error("escapeStringForLinkHeaderQuotedParamValueContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
		}
	}
	function hoistStyleQueueDependency$1(styleQueue) {
		this.styles.add(styleQueue);
	}
	function hoistStylesheetDependency$1(stylesheet) {
		this.stylesheets.add(stylesheet);
	}
	function hoistHoistables$1(parentState, childState) {
		childState.styles.forEach(hoistStyleQueueDependency$1, parentState);
		childState.stylesheets.forEach(hoistStylesheetDependency$1, parentState);
		childState.suspenseyImages && (parentState.suspenseyImages = !0);
	}
	function createRenderState$1(resumableState, generateStaticMarkup) {
		var idPrefix = resumableState.idPrefix, bootstrapChunks = [], bootstrapScriptContent = resumableState.bootstrapScriptContent, bootstrapScripts = resumableState.bootstrapScripts, bootstrapModules = resumableState.bootstrapModules;
		void 0 !== bootstrapScriptContent && (bootstrapChunks.push("<script"), pushCompletedShellIdAttribute$1(bootstrapChunks, resumableState), bootstrapChunks.push(">", ("" + bootstrapScriptContent).replace(scriptRegex$1, scriptReplacer$1), "<\/script>"));
		bootstrapScriptContent = idPrefix + "P:";
		var JSCompiler_object_inline_segmentPrefix_1673 = idPrefix + "S:";
		idPrefix += "B:";
		var JSCompiler_object_inline_preconnects_1687 = /* @__PURE__ */ new Set(), JSCompiler_object_inline_fontPreloads_1688 = /* @__PURE__ */ new Set(), JSCompiler_object_inline_highImagePreloads_1689 = /* @__PURE__ */ new Set(), JSCompiler_object_inline_styles_1690 = /* @__PURE__ */ new Map(), JSCompiler_object_inline_bootstrapScripts_1691 = /* @__PURE__ */ new Set(), JSCompiler_object_inline_scripts_1692 = /* @__PURE__ */ new Set(), JSCompiler_object_inline_bulkPreloads_1693 = /* @__PURE__ */ new Set(), JSCompiler_object_inline_preloads_1694 = {
			images: /* @__PURE__ */ new Map(),
			stylesheets: /* @__PURE__ */ new Map(),
			scripts: /* @__PURE__ */ new Map(),
			moduleScripts: /* @__PURE__ */ new Map()
		};
		if (void 0 !== bootstrapScripts) for (var i = 0; i < bootstrapScripts.length; i++) {
			var scriptConfig = bootstrapScripts[i], src, crossOrigin = void 0, integrity = void 0, props = {
				rel: "preload",
				as: "script",
				fetchPriority: "low",
				nonce: void 0
			};
			"string" === typeof scriptConfig ? props.href = src = scriptConfig : (props.href = src = scriptConfig.src, props.integrity = integrity = "string" === typeof scriptConfig.integrity ? scriptConfig.integrity : void 0, props.crossOrigin = crossOrigin = "string" === typeof scriptConfig || null == scriptConfig.crossOrigin ? void 0 : "use-credentials" === scriptConfig.crossOrigin ? "use-credentials" : "");
			scriptConfig = resumableState;
			var href = src;
			scriptConfig.scriptResources[href] = null;
			scriptConfig.moduleScriptResources[href] = null;
			scriptConfig = [];
			pushLinkImpl$1(scriptConfig, props);
			JSCompiler_object_inline_bootstrapScripts_1691.add(scriptConfig);
			bootstrapChunks.push("<script src=\"", escapeTextForBrowser$1(src), "\"");
			"string" === typeof integrity && bootstrapChunks.push(" integrity=\"", escapeTextForBrowser$1(integrity), "\"");
			"string" === typeof crossOrigin && bootstrapChunks.push(" crossorigin=\"", escapeTextForBrowser$1(crossOrigin), "\"");
			pushCompletedShellIdAttribute$1(bootstrapChunks, resumableState);
			bootstrapChunks.push(" async=\"\"><\/script>");
		}
		if (void 0 !== bootstrapModules) for (bootstrapScripts = 0; bootstrapScripts < bootstrapModules.length; bootstrapScripts++) props = bootstrapModules[bootstrapScripts], crossOrigin = src = void 0, integrity = {
			rel: "modulepreload",
			fetchPriority: "low",
			nonce: void 0
		}, "string" === typeof props ? integrity.href = i = props : (integrity.href = i = props.src, integrity.integrity = crossOrigin = "string" === typeof props.integrity ? props.integrity : void 0, integrity.crossOrigin = src = "string" === typeof props || null == props.crossOrigin ? void 0 : "use-credentials" === props.crossOrigin ? "use-credentials" : ""), props = resumableState, scriptConfig = i, props.scriptResources[scriptConfig] = null, props.moduleScriptResources[scriptConfig] = null, props = [], pushLinkImpl$1(props, integrity), JSCompiler_object_inline_bootstrapScripts_1691.add(props), bootstrapChunks.push("<script type=\"module\" src=\"", escapeTextForBrowser$1(i), "\""), "string" === typeof crossOrigin && bootstrapChunks.push(" integrity=\"", escapeTextForBrowser$1(crossOrigin), "\""), "string" === typeof src && bootstrapChunks.push(" crossorigin=\"", escapeTextForBrowser$1(src), "\""), pushCompletedShellIdAttribute$1(bootstrapChunks, resumableState), bootstrapChunks.push(" async=\"\"><\/script>");
		return {
			placeholderPrefix: bootstrapScriptContent,
			segmentPrefix: JSCompiler_object_inline_segmentPrefix_1673,
			boundaryPrefix: idPrefix,
			startInlineScript: "<script",
			startInlineStyle: "<style",
			preamble: {
				htmlChunks: null,
				headChunks: null,
				bodyChunks: null
			},
			externalRuntimeScript: null,
			bootstrapChunks,
			importMapChunks: [],
			onHeaders: void 0,
			headers: null,
			resets: {
				font: {},
				dns: {},
				connect: {
					default: {},
					anonymous: {},
					credentials: {}
				},
				image: {},
				style: {}
			},
			charsetChunks: [],
			viewportChunks: [],
			hoistableChunks: [],
			preconnects: JSCompiler_object_inline_preconnects_1687,
			fontPreloads: JSCompiler_object_inline_fontPreloads_1688,
			highImagePreloads: JSCompiler_object_inline_highImagePreloads_1689,
			styles: JSCompiler_object_inline_styles_1690,
			bootstrapScripts: JSCompiler_object_inline_bootstrapScripts_1691,
			scripts: JSCompiler_object_inline_scripts_1692,
			bulkPreloads: JSCompiler_object_inline_bulkPreloads_1693,
			preloads: JSCompiler_object_inline_preloads_1694,
			nonce: {
				script: void 0,
				style: void 0
			},
			stylesToHoist: !1,
			generateStaticMarkup
		};
	}
	function pushTextInstance$1(target, text, renderState, textEmbedded) {
		if (renderState.generateStaticMarkup) return target.push(escapeTextForBrowser$1(text)), !1;
		"" === text ? target = textEmbedded : (textEmbedded && target.push("<!-- -->"), target.push(escapeTextForBrowser$1(text)), target = !0);
		return target;
	}
	function pushSegmentFinale(target, renderState, lastPushedText, textEmbedded) {
		renderState.generateStaticMarkup || lastPushedText && textEmbedded && target.push("<!-- -->");
	}
	var bind$1 = Function.prototype.bind, REACT_CLIENT_REFERENCE$1 = Symbol.for("react.client.reference");
	function getComponentNameFromType$1(type) {
		if (null == type) return null;
		if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE$1 ? null : type.displayName || type.name || null;
		if ("string" === typeof type) return type;
		switch (type) {
			case REACT_FRAGMENT_TYPE$1: return "Fragment";
			case REACT_PROFILER_TYPE$1: return "Profiler";
			case REACT_STRICT_MODE_TYPE$1: return "StrictMode";
			case REACT_SUSPENSE_TYPE$1: return "Suspense";
			case REACT_SUSPENSE_LIST_TYPE$1: return "SuspenseList";
			case REACT_ACTIVITY_TYPE$1: return "Activity";
		}
		if ("object" === typeof type) switch (type.$$typeof) {
			case REACT_PORTAL_TYPE$1: return "Portal";
			case REACT_CONTEXT_TYPE$1: return type.displayName || "Context";
			case REACT_CONSUMER_TYPE$1: return (type._context.displayName || "Context") + ".Consumer";
			case REACT_FORWARD_REF_TYPE$1:
				var innerType = type.render;
				type = type.displayName;
				type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
				return type;
			case REACT_MEMO_TYPE$1: return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType$1(type.type) || "Memo";
			case REACT_LAZY_TYPE$1:
				innerType = type._payload;
				type = type._init;
				try {
					return getComponentNameFromType$1(type(innerType));
				} catch (x) {}
		}
		return null;
	}
	var emptyContextObject$1 = {}, currentActiveSnapshot$1 = null;
	function popToNearestCommonAncestor$1(prev, next) {
		if (prev !== next) {
			prev.context._currentValue2 = prev.parentValue;
			prev = prev.parent;
			var parentNext = next.parent;
			if (null === prev) {
				if (null !== parentNext) throw Error("The stacks must reach the root at the same time. This is a bug in React.");
			} else {
				if (null === parentNext) throw Error("The stacks must reach the root at the same time. This is a bug in React.");
				popToNearestCommonAncestor$1(prev, parentNext);
			}
			next.context._currentValue2 = next.value;
		}
	}
	function popAllPrevious$1(prev) {
		prev.context._currentValue2 = prev.parentValue;
		prev = prev.parent;
		null !== prev && popAllPrevious$1(prev);
	}
	function pushAllNext$1(next) {
		var parentNext = next.parent;
		null !== parentNext && pushAllNext$1(parentNext);
		next.context._currentValue2 = next.value;
	}
	function popPreviousToCommonLevel$1(prev, next) {
		prev.context._currentValue2 = prev.parentValue;
		prev = prev.parent;
		if (null === prev) throw Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
		prev.depth === next.depth ? popToNearestCommonAncestor$1(prev, next) : popPreviousToCommonLevel$1(prev, next);
	}
	function popNextToCommonLevel$1(prev, next) {
		var parentNext = next.parent;
		if (null === parentNext) throw Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
		prev.depth === parentNext.depth ? popToNearestCommonAncestor$1(prev, parentNext) : popNextToCommonLevel$1(prev, parentNext);
		next.context._currentValue2 = next.value;
	}
	function switchContext$1(newSnapshot) {
		var prev = currentActiveSnapshot$1;
		prev !== newSnapshot && (null === prev ? pushAllNext$1(newSnapshot) : null === newSnapshot ? popAllPrevious$1(prev) : prev.depth === newSnapshot.depth ? popToNearestCommonAncestor$1(prev, newSnapshot) : prev.depth > newSnapshot.depth ? popPreviousToCommonLevel$1(prev, newSnapshot) : popNextToCommonLevel$1(prev, newSnapshot), currentActiveSnapshot$1 = newSnapshot);
	}
	var classComponentUpdater$1 = {
		enqueueSetState: function(inst, payload) {
			inst = inst._reactInternals;
			null !== inst.queue && inst.queue.push(payload);
		},
		enqueueReplaceState: function(inst, payload) {
			inst = inst._reactInternals;
			inst.replace = !0;
			inst.queue = [payload];
		},
		enqueueForceUpdate: function() {}
	}, emptyTreeContext$1 = {
		id: 1,
		overflow: ""
	};
	function pushTreeContext$1(baseContext, totalChildren, index) {
		var baseIdWithLeadingBit = baseContext.id;
		baseContext = baseContext.overflow;
		var baseLength = 32 - clz32$1(baseIdWithLeadingBit) - 1;
		baseIdWithLeadingBit &= ~(1 << baseLength);
		index += 1;
		var length = 32 - clz32$1(totalChildren) + baseLength;
		if (30 < length) {
			var numberOfOverflowBits = baseLength - baseLength % 5;
			length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
			baseIdWithLeadingBit >>= numberOfOverflowBits;
			baseLength -= numberOfOverflowBits;
			return {
				id: 1 << 32 - clz32$1(totalChildren) + baseLength | index << baseLength | baseIdWithLeadingBit,
				overflow: length + baseContext
			};
		}
		return {
			id: 1 << length | index << baseLength | baseIdWithLeadingBit,
			overflow: baseContext
		};
	}
	var clz32$1 = Math.clz32 ? Math.clz32 : clz32Fallback$1, log$1 = Math.log, LN2$1 = Math.LN2;
	function clz32Fallback$1(x) {
		x >>>= 0;
		return 0 === x ? 32 : 31 - (log$1(x) / LN2$1 | 0) | 0;
	}
	function noop$3() {}
	var SuspenseException$1 = Error("Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`.");
	function trackUsedThenable$1(thenableState$2, thenable, index) {
		index = thenableState$2[index];
		void 0 === index ? thenableState$2.push(thenable) : index !== thenable && (thenable.then(noop$3, noop$3), thenable = index);
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default:
				"string" === typeof thenable.status ? thenable.then(noop$3, noop$3) : (thenableState$2 = thenable, thenableState$2.status = "pending", thenableState$2.then(function(fulfilledValue) {
					if ("pending" === thenable.status) {
						var fulfilledThenable = thenable;
						fulfilledThenable.status = "fulfilled";
						fulfilledThenable.value = fulfilledValue;
					}
				}, function(error) {
					if ("pending" === thenable.status) {
						var rejectedThenable = thenable;
						rejectedThenable.status = "rejected";
						rejectedThenable.reason = error;
					}
				}));
				switch (thenable.status) {
					case "fulfilled": return thenable.value;
					case "rejected": throw thenable.reason;
				}
				suspendedThenable$1 = thenable;
				throw SuspenseException$1;
		}
	}
	var suspendedThenable$1 = null;
	function getSuspendedThenable$1() {
		if (null === suspendedThenable$1) throw Error("Expected a suspended thenable. This is a bug in React. Please file an issue.");
		var thenable = suspendedThenable$1;
		suspendedThenable$1 = null;
		return thenable;
	}
	function is$1(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs$1 = "function" === typeof Object.is ? Object.is : is$1, currentlyRenderingComponent$1 = null, currentlyRenderingTask$1 = null, currentlyRenderingRequest$1 = null, currentlyRenderingKeyPath$1 = null, firstWorkInProgressHook$1 = null, workInProgressHook$1 = null, isReRender$1 = !1, didScheduleRenderPhaseUpdate$1 = !1, localIdCounter$1 = 0, actionStateCounter$1 = 0, actionStateMatchingIndex$1 = -1, thenableIndexCounter$1 = 0, thenableState$1 = null, renderPhaseUpdates$1 = null, numberOfReRenders$1 = 0;
	function resolveCurrentlyRenderingComponent$1() {
		if (null === currentlyRenderingComponent$1) throw Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.");
		return currentlyRenderingComponent$1;
	}
	function createHook$1() {
		if (0 < numberOfReRenders$1) throw Error("Rendered more hooks than during the previous render");
		return {
			memoizedState: null,
			queue: null,
			next: null
		};
	}
	function createWorkInProgressHook$1() {
		null === workInProgressHook$1 ? null === firstWorkInProgressHook$1 ? (isReRender$1 = !1, firstWorkInProgressHook$1 = workInProgressHook$1 = createHook$1()) : (isReRender$1 = !0, workInProgressHook$1 = firstWorkInProgressHook$1) : null === workInProgressHook$1.next ? (isReRender$1 = !1, workInProgressHook$1 = workInProgressHook$1.next = createHook$1()) : (isReRender$1 = !0, workInProgressHook$1 = workInProgressHook$1.next);
		return workInProgressHook$1;
	}
	function getThenableStateAfterSuspending$1() {
		var state = thenableState$1;
		thenableState$1 = null;
		return state;
	}
	function resetHooksState$1() {
		currentlyRenderingKeyPath$1 = currentlyRenderingRequest$1 = currentlyRenderingTask$1 = currentlyRenderingComponent$1 = null;
		didScheduleRenderPhaseUpdate$1 = !1;
		firstWorkInProgressHook$1 = null;
		numberOfReRenders$1 = 0;
		workInProgressHook$1 = renderPhaseUpdates$1 = null;
	}
	function basicStateReducer$1(state, action) {
		return "function" === typeof action ? action(state) : action;
	}
	function useReducer$1(reducer, initialArg, init) {
		currentlyRenderingComponent$1 = resolveCurrentlyRenderingComponent$1();
		workInProgressHook$1 = createWorkInProgressHook$1();
		if (isReRender$1) {
			var queue = workInProgressHook$1.queue;
			initialArg = queue.dispatch;
			if (null !== renderPhaseUpdates$1 && (init = renderPhaseUpdates$1.get(queue), void 0 !== init)) {
				renderPhaseUpdates$1.delete(queue);
				queue = workInProgressHook$1.memoizedState;
				do
					queue = reducer(queue, init.action), init = init.next;
				while (null !== init);
				workInProgressHook$1.memoizedState = queue;
				return [queue, initialArg];
			}
			return [workInProgressHook$1.memoizedState, initialArg];
		}
		reducer = reducer === basicStateReducer$1 ? "function" === typeof initialArg ? initialArg() : initialArg : void 0 !== init ? init(initialArg) : initialArg;
		workInProgressHook$1.memoizedState = reducer;
		reducer = workInProgressHook$1.queue = {
			last: null,
			dispatch: null
		};
		reducer = reducer.dispatch = dispatchAction$1.bind(null, currentlyRenderingComponent$1, reducer);
		return [workInProgressHook$1.memoizedState, reducer];
	}
	function useMemo$1(nextCreate, deps) {
		currentlyRenderingComponent$1 = resolveCurrentlyRenderingComponent$1();
		workInProgressHook$1 = createWorkInProgressHook$1();
		deps = void 0 === deps ? null : deps;
		if (null !== workInProgressHook$1) {
			var prevState = workInProgressHook$1.memoizedState;
			if (null !== prevState && null !== deps) {
				var prevDeps = prevState[1];
				a: if (null === prevDeps) prevDeps = !1;
				else {
					for (var i = 0; i < prevDeps.length && i < deps.length; i++) if (!objectIs$1(deps[i], prevDeps[i])) {
						prevDeps = !1;
						break a;
					}
					prevDeps = !0;
				}
				if (prevDeps) return prevState[0];
			}
		}
		nextCreate = nextCreate();
		workInProgressHook$1.memoizedState = [nextCreate, deps];
		return nextCreate;
	}
	function dispatchAction$1(componentIdentity, queue, action) {
		if (25 <= numberOfReRenders$1) throw Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
		if (componentIdentity === currentlyRenderingComponent$1) if (didScheduleRenderPhaseUpdate$1 = !0, componentIdentity = {
			action,
			next: null
		}, null === renderPhaseUpdates$1 && (renderPhaseUpdates$1 = /* @__PURE__ */ new Map()), action = renderPhaseUpdates$1.get(queue), void 0 === action) renderPhaseUpdates$1.set(queue, componentIdentity);
		else {
			for (queue = action; null !== queue.next;) queue = queue.next;
			queue.next = componentIdentity;
		}
	}
	function throwOnUseEffectEventCall$1() {
		throw Error("A function wrapped in useEffectEvent can't be called during rendering.");
	}
	function unsupportedStartTransition$1() {
		throw Error("startTransition cannot be called during server rendering.");
	}
	function unsupportedSetOptimisticState$1() {
		throw Error("Cannot update optimistic state while rendering.");
	}
	function useActionState$1(action, initialState, permalink) {
		resolveCurrentlyRenderingComponent$1();
		var actionStateHookIndex = actionStateCounter$1++, request = currentlyRenderingRequest$1;
		if ("function" === typeof action.$$FORM_ACTION) {
			var nextPostbackStateKey = null, componentKeyPath = currentlyRenderingKeyPath$1;
			request = request.formState;
			var isSignatureEqual = action.$$IS_SIGNATURE_EQUAL;
			if (null !== request && "function" === typeof isSignatureEqual) {
				var postbackKey = request[1];
				isSignatureEqual.call(action, request[2], request[3]) && (nextPostbackStateKey = void 0 !== permalink ? "p" + permalink : "k" + murmurhash3_32_gc(JSON.stringify([
					componentKeyPath,
					null,
					actionStateHookIndex
				]), 0), postbackKey === nextPostbackStateKey && (actionStateMatchingIndex$1 = actionStateHookIndex, initialState = request[0]));
			}
			var boundAction = action.bind(null, initialState);
			action = function(payload) {
				boundAction(payload);
			};
			"function" === typeof boundAction.$$FORM_ACTION && (action.$$FORM_ACTION = function(prefix$2) {
				prefix$2 = boundAction.$$FORM_ACTION(prefix$2);
				void 0 !== permalink && (permalink += "", prefix$2.action = permalink);
				var formData = prefix$2.data;
				formData && (null === nextPostbackStateKey && (nextPostbackStateKey = void 0 !== permalink ? "p" + permalink : "k" + murmurhash3_32_gc(JSON.stringify([
					componentKeyPath,
					null,
					actionStateHookIndex
				]), 0)), formData.append("$ACTION_KEY", nextPostbackStateKey));
				return prefix$2;
			});
			return [
				initialState,
				action,
				!1
			];
		}
		var boundAction$22 = action.bind(null, initialState);
		return [
			initialState,
			function(payload) {
				boundAction$22(payload);
			},
			!1
		];
	}
	function unwrapThenable$1(thenable) {
		var index = thenableIndexCounter$1;
		thenableIndexCounter$1 += 1;
		null === thenableState$1 && (thenableState$1 = []);
		return trackUsedThenable$1(thenableState$1, thenable, index);
	}
	function unsupportedRefresh$1() {
		throw Error("Cache cannot be refreshed during server rendering.");
	}
	var HooksDispatcher$1 = {
		readContext: function(context) {
			return context._currentValue2;
		},
		use: function(usable) {
			if (null !== usable && "object" === typeof usable) {
				if ("function" === typeof usable.then) return unwrapThenable$1(usable);
				if (usable.$$typeof === REACT_CONTEXT_TYPE$1) return usable._currentValue2;
			}
			throw Error("An unsupported type was passed to use(): " + String(usable));
		},
		useContext: function(context) {
			resolveCurrentlyRenderingComponent$1();
			return context._currentValue2;
		},
		useMemo: useMemo$1,
		useReducer: useReducer$1,
		useRef: function(initialValue) {
			currentlyRenderingComponent$1 = resolveCurrentlyRenderingComponent$1();
			workInProgressHook$1 = createWorkInProgressHook$1();
			var previousRef = workInProgressHook$1.memoizedState;
			return null === previousRef ? (initialValue = { current: initialValue }, workInProgressHook$1.memoizedState = initialValue) : previousRef;
		},
		useState: function(initialState) {
			return useReducer$1(basicStateReducer$1, initialState);
		},
		useInsertionEffect: noop$3,
		useLayoutEffect: noop$3,
		useCallback: function(callback, deps) {
			return useMemo$1(function() {
				return callback;
			}, deps);
		},
		useImperativeHandle: noop$3,
		useEffect: noop$3,
		useDebugValue: noop$3,
		useDeferredValue: function(value, initialValue) {
			resolveCurrentlyRenderingComponent$1();
			return void 0 !== initialValue ? initialValue : value;
		},
		useTransition: function() {
			resolveCurrentlyRenderingComponent$1();
			return [!1, unsupportedStartTransition$1];
		},
		useId: function() {
			var JSCompiler_inline_result = currentlyRenderingTask$1.treeContext;
			var overflow = JSCompiler_inline_result.overflow;
			JSCompiler_inline_result = JSCompiler_inline_result.id;
			JSCompiler_inline_result = (JSCompiler_inline_result & ~(1 << 32 - clz32$1(JSCompiler_inline_result) - 1)).toString(32) + overflow;
			var resumableState = currentResumableState$1;
			if (null === resumableState) throw Error("Invalid hook call. Hooks can only be called inside of the body of a function component.");
			overflow = localIdCounter$1++;
			JSCompiler_inline_result = "_" + resumableState.idPrefix + "R_" + JSCompiler_inline_result;
			0 < overflow && (JSCompiler_inline_result += "H" + overflow.toString(32));
			return JSCompiler_inline_result + "_";
		},
		useSyncExternalStore: function(subscribe$1, getSnapshot, getServerSnapshot) {
			if (void 0 === getServerSnapshot) throw Error("Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering.");
			return getServerSnapshot();
		},
		useOptimistic: function(passthrough) {
			resolveCurrentlyRenderingComponent$1();
			return [passthrough, unsupportedSetOptimisticState$1];
		},
		useActionState: useActionState$1,
		useFormState: useActionState$1,
		useHostTransitionStatus: function() {
			resolveCurrentlyRenderingComponent$1();
			return sharedNotPendingObject$1;
		},
		useMemoCache: function(size) {
			for (var data = Array(size), i = 0; i < size; i++) data[i] = REACT_MEMO_CACHE_SENTINEL$1;
			return data;
		},
		useCacheRefresh: function() {
			return unsupportedRefresh$1;
		},
		useEffectEvent: function() {
			return throwOnUseEffectEventCall$1;
		}
	}, currentResumableState$1 = null, DefaultAsyncDispatcher$1 = {
		getCacheForType: function() {
			throw Error("Not implemented.");
		},
		cacheSignal: function() {
			throw Error("Not implemented.");
		}
	}, prefix$1, suffix$1;
	function describeBuiltInComponentFrame$1(name) {
		if (void 0 === prefix$1) try {
			throw Error();
		} catch (x) {
			var match = x.stack.trim().match(/\n( *(at )?)/);
			prefix$1 = match && match[1] || "";
			suffix$1 = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + prefix$1 + name + suffix$1;
	}
	var reentry$1 = !1;
	function describeNativeComponentFrame$1(fn, construct) {
		if (!fn || reentry$1) return "";
		reentry$1 = !0;
		var previousPrepareStackTrace = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var RunInRootFrame = { DetermineComponentFrameRoot: function() {
				try {
					if (construct) {
						var Fake = function() {
							throw Error();
						};
						Object.defineProperty(Fake.prototype, "props", { set: function() {
							throw Error();
						} });
						if ("object" === typeof Reflect && Reflect.construct) {
							try {
								Reflect.construct(Fake, []);
							} catch (x) {
								var control = x;
							}
							Reflect.construct(fn, [], Fake);
						} else {
							try {
								Fake.call();
							} catch (x$24) {
								control = x$24;
							}
							fn.call(Fake.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (x$25) {
							control = x$25;
						}
						(Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {});
					}
				} catch (sample) {
					if (sample && control && "string" === typeof sample.stack) return [sample.stack, control.stack];
				}
				return [null, null];
			} };
			RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, "name");
			namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
			if (sampleStack && controlStack) {
				var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
				for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot");) RunInRootFrame++;
				for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes("DetermineComponentFrameRoot");) namePropDescriptor++;
				if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length) for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor];) namePropDescriptor--;
				for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--) if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
					if (1 !== RunInRootFrame || 1 !== namePropDescriptor) do
						if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
							var frame = "\n" + sampleLines[RunInRootFrame].replace(" at new ", " at ");
							fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName));
							return frame;
						}
					while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
					break;
				}
			}
		} finally {
			reentry$1 = !1, Error.prepareStackTrace = previousPrepareStackTrace;
		}
		return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame$1(previousPrepareStackTrace) : "";
	}
	function describeComponentStackByType$1(type) {
		if ("string" === typeof type) return describeBuiltInComponentFrame$1(type);
		if ("function" === typeof type) return type.prototype && type.prototype.isReactComponent ? describeNativeComponentFrame$1(type, !0) : describeNativeComponentFrame$1(type, !1);
		if ("object" === typeof type && null !== type) {
			switch (type.$$typeof) {
				case REACT_FORWARD_REF_TYPE$1: return describeNativeComponentFrame$1(type.render, !1);
				case REACT_MEMO_TYPE$1: return describeNativeComponentFrame$1(type.type, !1);
				case REACT_LAZY_TYPE$1:
					var lazyComponent = type, payload = lazyComponent._payload;
					lazyComponent = lazyComponent._init;
					try {
						type = lazyComponent(payload);
					} catch (x) {
						return describeBuiltInComponentFrame$1("Lazy");
					}
					return describeComponentStackByType$1(type);
			}
			if ("string" === typeof type.name) {
				a: {
					payload = type.name;
					lazyComponent = type.env;
					var location = type.debugLocation;
					if (null != location && (type = Error.prepareStackTrace, Error.prepareStackTrace = void 0, location = location.stack, Error.prepareStackTrace = type, location.startsWith("Error: react-stack-top-frame\n") && (location = location.slice(29)), type = location.indexOf("\n"), -1 !== type && (location = location.slice(type + 1)), type = location.indexOf("react_stack_bottom_frame"), -1 !== type && (type = location.lastIndexOf("\n", type)), type = -1 !== type ? location = location.slice(0, type) : "", location = type.lastIndexOf("\n"), type = -1 === location ? type : type.slice(location + 1), -1 !== type.indexOf(payload))) {
						payload = "\n" + type;
						break a;
					}
					payload = describeBuiltInComponentFrame$1(payload + (lazyComponent ? " [" + lazyComponent + "]" : ""));
				}
				return payload;
			}
		}
		switch (type) {
			case REACT_SUSPENSE_LIST_TYPE$1: return describeBuiltInComponentFrame$1("SuspenseList");
			case REACT_SUSPENSE_TYPE$1: return describeBuiltInComponentFrame$1("Suspense");
		}
		return "";
	}
	function isEligibleForOutlining$1(request, boundary) {
		return (500 < boundary.byteSize || !1) && null === boundary.contentPreamble;
	}
	function defaultErrorHandler$1(error) {
		if ("object" === typeof error && null !== error && "string" === typeof error.environmentName) {
			var JSCompiler_inline_result = error.environmentName;
			error = [error].slice(0);
			"string" === typeof error[0] ? error.splice(0, 1, "[%s] " + error[0], " " + JSCompiler_inline_result + " ") : error.splice(0, 0, "[%s]", " " + JSCompiler_inline_result + " ");
			error.unshift(console);
			JSCompiler_inline_result = bind$1.apply(console.error, error);
			JSCompiler_inline_result();
		} else console.error(error);
		return null;
	}
	function RequestInstance$1(resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, formState) {
		var abortSet = /* @__PURE__ */ new Set();
		this.destination = null;
		this.flushScheduled = !1;
		this.resumableState = resumableState;
		this.renderState = renderState;
		this.rootFormatContext = rootFormatContext;
		this.progressiveChunkSize = void 0 === progressiveChunkSize ? 12800 : progressiveChunkSize;
		this.status = 10;
		this.fatalError = null;
		this.pendingRootTasks = this.allPendingTasks = this.nextSegmentId = 0;
		this.completedPreambleSegments = this.completedRootSegment = null;
		this.byteSize = 0;
		this.abortableTasks = abortSet;
		this.pingedTasks = [];
		this.clientRenderedBoundaries = [];
		this.completedBoundaries = [];
		this.partialBoundaries = [];
		this.trackedPostpones = null;
		this.onError = void 0 === onError$2 ? defaultErrorHandler$1 : onError$2;
		this.onPostpone = void 0 === onPostpone ? noop$3 : onPostpone;
		this.onAllReady = void 0 === onAllReady ? noop$3 : onAllReady;
		this.onShellReady = void 0 === onShellReady ? noop$3 : onShellReady;
		this.onShellError = void 0 === onShellError ? noop$3 : onShellError;
		this.onFatalError = void 0 === onFatalError ? noop$3 : onFatalError;
		this.formState = void 0 === formState ? null : formState;
	}
	function createRequest$1(children, resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, formState) {
		resumableState = new RequestInstance$1(resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, formState);
		renderState = createPendingSegment$1(resumableState, 0, null, rootFormatContext, !1, !1);
		renderState.parentFlushed = !0;
		children = createRenderTask$1(resumableState, null, children, -1, null, renderState, null, null, resumableState.abortableTasks, null, rootFormatContext, null, emptyTreeContext$1, null, null);
		pushComponentStack$1(children);
		resumableState.pingedTasks.push(children);
		return resumableState;
	}
	var currentRequest$1 = null;
	function pingTask$1(request, task) {
		request.pingedTasks.push(task);
		1 === request.pingedTasks.length && (request.flushScheduled = null !== request.destination, performWork$1(request));
	}
	function createSuspenseBoundary$1(request, row, fallbackAbortableTasks, contentPreamble, fallbackPreamble) {
		fallbackAbortableTasks = {
			status: 0,
			rootSegmentID: -1,
			parentFlushed: !1,
			pendingTasks: 0,
			row,
			completedSegments: [],
			byteSize: 0,
			fallbackAbortableTasks,
			errorDigest: null,
			contentState: createHoistableState$1(),
			fallbackState: createHoistableState$1(),
			contentPreamble,
			fallbackPreamble,
			trackedContentKeyPath: null,
			trackedFallbackNode: null
		};
		null !== row && (row.pendingTasks++, contentPreamble = row.boundaries, null !== contentPreamble && (request.allPendingTasks++, fallbackAbortableTasks.pendingTasks++, contentPreamble.push(fallbackAbortableTasks)), request = row.inheritedHoistables, null !== request && hoistHoistables$1(fallbackAbortableTasks.contentState, request));
		return fallbackAbortableTasks;
	}
	function createRenderTask$1(request, thenableState$2, node, childIndex, blockedBoundary, blockedSegment, blockedPreamble, hoistableState, abortSet, keyPath, formatContext, context, treeContext, row, componentStack) {
		request.allPendingTasks++;
		null === blockedBoundary ? request.pendingRootTasks++ : blockedBoundary.pendingTasks++;
		null !== row && row.pendingTasks++;
		var task = {
			replay: null,
			node,
			childIndex,
			ping: function() {
				return pingTask$1(request, task);
			},
			blockedBoundary,
			blockedSegment,
			blockedPreamble,
			hoistableState,
			abortSet,
			keyPath,
			formatContext,
			context,
			treeContext,
			row,
			componentStack,
			thenableState: thenableState$2
		};
		abortSet.add(task);
		return task;
	}
	function createReplayTask$1(request, thenableState$2, replay, node, childIndex, blockedBoundary, hoistableState, abortSet, keyPath, formatContext, context, treeContext, row, componentStack) {
		request.allPendingTasks++;
		null === blockedBoundary ? request.pendingRootTasks++ : blockedBoundary.pendingTasks++;
		null !== row && row.pendingTasks++;
		replay.pendingTasks++;
		var task = {
			replay,
			node,
			childIndex,
			ping: function() {
				return pingTask$1(request, task);
			},
			blockedBoundary,
			blockedSegment: null,
			blockedPreamble: null,
			hoistableState,
			abortSet,
			keyPath,
			formatContext,
			context,
			treeContext,
			row,
			componentStack,
			thenableState: thenableState$2
		};
		abortSet.add(task);
		return task;
	}
	function createPendingSegment$1(request, index, boundary, parentFormatContext, lastPushedText, textEmbedded) {
		return {
			status: 0,
			parentFlushed: !1,
			id: -1,
			index,
			chunks: [],
			children: [],
			preambleChildren: [],
			parentFormatContext,
			boundary,
			lastPushedText,
			textEmbedded
		};
	}
	function pushComponentStack$1(task) {
		var node = task.node;
		if ("object" === typeof node && null !== node) switch (node.$$typeof) {
			case REACT_ELEMENT_TYPE$1: task.componentStack = {
				parent: task.componentStack,
				type: node.type
			};
		}
	}
	function replaceSuspenseComponentStackWithSuspenseFallbackStack$1(componentStack) {
		return null === componentStack ? null : {
			parent: componentStack.parent,
			type: "Suspense Fallback"
		};
	}
	function getThrownInfo$1(node$jscomp$0) {
		var errorInfo = {};
		node$jscomp$0 && Object.defineProperty(errorInfo, "componentStack", {
			configurable: !0,
			enumerable: !0,
			get: function() {
				try {
					var info = "", node = node$jscomp$0;
					do
						info += describeComponentStackByType$1(node.type), node = node.parent;
					while (node);
					var JSCompiler_inline_result = info;
				} catch (x) {
					JSCompiler_inline_result = "\nError generating stack: " + x.message + "\n" + x.stack;
				}
				Object.defineProperty(errorInfo, "componentStack", { value: JSCompiler_inline_result });
				return JSCompiler_inline_result;
			}
		});
		return errorInfo;
	}
	function logRecoverableError$1(request, error, errorInfo) {
		request = request.onError;
		error = request(error, errorInfo);
		if (null == error || "string" === typeof error) return error;
	}
	function fatalError$1(request, error) {
		var onShellError = request.onShellError, onFatalError = request.onFatalError;
		onShellError(error);
		onFatalError(error);
		null !== request.destination ? (request.status = 14, request.destination.destroy(error)) : (request.status = 13, request.fatalError = error);
	}
	function finishSuspenseListRow$1(request, row) {
		unblockSuspenseListRow$1(request, row.next, row.hoistables);
	}
	function unblockSuspenseListRow$1(request, unblockedRow, inheritedHoistables) {
		for (; null !== unblockedRow;) {
			null !== inheritedHoistables && (hoistHoistables$1(unblockedRow.hoistables, inheritedHoistables), unblockedRow.inheritedHoistables = inheritedHoistables);
			var unblockedBoundaries = unblockedRow.boundaries;
			if (null !== unblockedBoundaries) {
				unblockedRow.boundaries = null;
				for (var i = 0; i < unblockedBoundaries.length; i++) {
					var unblockedBoundary = unblockedBoundaries[i];
					null !== inheritedHoistables && hoistHoistables$1(unblockedBoundary.contentState, inheritedHoistables);
					finishedTask$1(request, unblockedBoundary, null, null);
				}
			}
			unblockedRow.pendingTasks--;
			if (0 < unblockedRow.pendingTasks) break;
			inheritedHoistables = unblockedRow.hoistables;
			unblockedRow = unblockedRow.next;
		}
	}
	function tryToResolveTogetherRow$1(request, togetherRow) {
		var boundaries = togetherRow.boundaries;
		if (null !== boundaries && togetherRow.pendingTasks === boundaries.length) {
			for (var allCompleteAndInlinable = !0, i = 0; i < boundaries.length; i++) {
				var rowBoundary = boundaries[i];
				if (1 !== rowBoundary.pendingTasks || rowBoundary.parentFlushed || isEligibleForOutlining$1(request, rowBoundary)) {
					allCompleteAndInlinable = !1;
					break;
				}
			}
			allCompleteAndInlinable && unblockSuspenseListRow$1(request, togetherRow, togetherRow.hoistables);
		}
	}
	function createSuspenseListRow$1(previousRow) {
		var newRow = {
			pendingTasks: 1,
			boundaries: null,
			hoistables: createHoistableState$1(),
			inheritedHoistables: null,
			together: !1,
			next: null
		};
		null !== previousRow && 0 < previousRow.pendingTasks && (newRow.pendingTasks++, newRow.boundaries = [], previousRow.next = newRow);
		return newRow;
	}
	function renderSuspenseListRows$1(request, task, keyPath, rows, revealOrder) {
		var prevKeyPath = task.keyPath, prevTreeContext = task.treeContext, prevRow = task.row;
		task.keyPath = keyPath;
		keyPath = rows.length;
		var previousSuspenseListRow = null;
		if (null !== task.replay) {
			var resumeSlots = task.replay.slots;
			if (null !== resumeSlots && "object" === typeof resumeSlots) for (var n = 0; n < keyPath; n++) {
				var i = "backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder ? n : keyPath - 1 - n, node = rows[i];
				task.row = previousSuspenseListRow = createSuspenseListRow$1(previousSuspenseListRow);
				task.treeContext = pushTreeContext$1(prevTreeContext, keyPath, i);
				var resumeSegmentID = resumeSlots[i];
				"number" === typeof resumeSegmentID ? (resumeNode$1(request, task, resumeSegmentID, node, i), delete resumeSlots[i]) : renderNode$1(request, task, node, i);
				0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow$1(request, previousSuspenseListRow);
			}
			else for (resumeSlots = 0; resumeSlots < keyPath; resumeSlots++) n = "backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder ? resumeSlots : keyPath - 1 - resumeSlots, i = rows[n], task.row = previousSuspenseListRow = createSuspenseListRow$1(previousSuspenseListRow), task.treeContext = pushTreeContext$1(prevTreeContext, keyPath, n), renderNode$1(request, task, i, n), 0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow$1(request, previousSuspenseListRow);
		} else if ("backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder) for (revealOrder = 0; revealOrder < keyPath; revealOrder++) resumeSlots = rows[revealOrder], task.row = previousSuspenseListRow = createSuspenseListRow$1(previousSuspenseListRow), task.treeContext = pushTreeContext$1(prevTreeContext, keyPath, revealOrder), renderNode$1(request, task, resumeSlots, revealOrder), 0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow$1(request, previousSuspenseListRow);
		else {
			revealOrder = task.blockedSegment;
			resumeSlots = revealOrder.children.length;
			n = revealOrder.chunks.length;
			for (i = keyPath - 1; 0 <= i; i--) {
				node = rows[i];
				task.row = previousSuspenseListRow = createSuspenseListRow$1(previousSuspenseListRow);
				task.treeContext = pushTreeContext$1(prevTreeContext, keyPath, i);
				resumeSegmentID = createPendingSegment$1(request, n, null, task.formatContext, 0 === i ? revealOrder.lastPushedText : !0, !0);
				revealOrder.children.splice(resumeSlots, 0, resumeSegmentID);
				task.blockedSegment = resumeSegmentID;
				try {
					renderNode$1(request, task, node, i), pushSegmentFinale(resumeSegmentID.chunks, request.renderState, resumeSegmentID.lastPushedText, resumeSegmentID.textEmbedded), resumeSegmentID.status = 1, 0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow$1(request, previousSuspenseListRow);
				} catch (thrownValue) {
					throw resumeSegmentID.status = 12 === request.status ? 3 : 4, thrownValue;
				}
			}
			task.blockedSegment = revealOrder;
			revealOrder.lastPushedText = !1;
		}
		null !== prevRow && null !== previousSuspenseListRow && 0 < previousSuspenseListRow.pendingTasks && (prevRow.pendingTasks++, previousSuspenseListRow.next = prevRow);
		task.treeContext = prevTreeContext;
		task.row = prevRow;
		task.keyPath = prevKeyPath;
	}
	function renderWithHooks$1(request, task, keyPath, Component$1, props, secondArg) {
		var prevThenableState = task.thenableState;
		task.thenableState = null;
		currentlyRenderingComponent$1 = {};
		currentlyRenderingTask$1 = task;
		currentlyRenderingRequest$1 = request;
		currentlyRenderingKeyPath$1 = keyPath;
		actionStateCounter$1 = localIdCounter$1 = 0;
		actionStateMatchingIndex$1 = -1;
		thenableIndexCounter$1 = 0;
		thenableState$1 = prevThenableState;
		for (request = Component$1(props, secondArg); didScheduleRenderPhaseUpdate$1;) didScheduleRenderPhaseUpdate$1 = !1, actionStateCounter$1 = localIdCounter$1 = 0, actionStateMatchingIndex$1 = -1, thenableIndexCounter$1 = 0, numberOfReRenders$1 += 1, workInProgressHook$1 = null, request = Component$1(props, secondArg);
		resetHooksState$1();
		return request;
	}
	function finishFunctionComponent$1(request, task, keyPath, children, hasId, actionStateCount, actionStateMatchingIndex$2) {
		var didEmitActionStateMarkers = !1;
		if (0 !== actionStateCount && null !== request.formState) {
			var segment = task.blockedSegment;
			if (null !== segment) {
				didEmitActionStateMarkers = !0;
				segment = segment.chunks;
				for (var i = 0; i < actionStateCount; i++) i === actionStateMatchingIndex$2 ? segment.push("<!--F!-->") : segment.push("<!--F-->");
			}
		}
		actionStateCount = task.keyPath;
		task.keyPath = keyPath;
		hasId ? (keyPath = task.treeContext, task.treeContext = pushTreeContext$1(keyPath, 1, 0), renderNode$1(request, task, children, -1), task.treeContext = keyPath) : didEmitActionStateMarkers ? renderNode$1(request, task, children, -1) : renderNodeDestructive$1(request, task, children, -1);
		task.keyPath = actionStateCount;
	}
	function renderElement$1(request, task, keyPath, type, props, ref) {
		if ("function" === typeof type) if (type.prototype && type.prototype.isReactComponent) {
			var newProps = props;
			if ("ref" in props) {
				newProps = {};
				for (var propName in props) "ref" !== propName && (newProps[propName] = props[propName]);
			}
			var defaultProps = type.defaultProps;
			if (defaultProps) {
				newProps === props && (newProps = assign$1({}, newProps, props));
				for (var propName$43 in defaultProps) void 0 === newProps[propName$43] && (newProps[propName$43] = defaultProps[propName$43]);
			}
			props = newProps;
			newProps = emptyContextObject$1;
			defaultProps = type.contextType;
			"object" === typeof defaultProps && null !== defaultProps && (newProps = defaultProps._currentValue2);
			newProps = new type(props, newProps);
			var initialState = void 0 !== newProps.state ? newProps.state : null;
			newProps.updater = classComponentUpdater$1;
			newProps.props = props;
			newProps.state = initialState;
			defaultProps = {
				queue: [],
				replace: !1
			};
			newProps._reactInternals = defaultProps;
			ref = type.contextType;
			newProps.context = "object" === typeof ref && null !== ref ? ref._currentValue2 : emptyContextObject$1;
			ref = type.getDerivedStateFromProps;
			"function" === typeof ref && (ref = ref(props, initialState), initialState = null === ref || void 0 === ref ? initialState : assign$1({}, initialState, ref), newProps.state = initialState);
			if ("function" !== typeof type.getDerivedStateFromProps && "function" !== typeof newProps.getSnapshotBeforeUpdate && ("function" === typeof newProps.UNSAFE_componentWillMount || "function" === typeof newProps.componentWillMount)) if (type = newProps.state, "function" === typeof newProps.componentWillMount && newProps.componentWillMount(), "function" === typeof newProps.UNSAFE_componentWillMount && newProps.UNSAFE_componentWillMount(), type !== newProps.state && classComponentUpdater$1.enqueueReplaceState(newProps, newProps.state, null), null !== defaultProps.queue && 0 < defaultProps.queue.length) if (type = defaultProps.queue, ref = defaultProps.replace, defaultProps.queue = null, defaultProps.replace = !1, ref && 1 === type.length) newProps.state = type[0];
			else {
				defaultProps = ref ? type[0] : newProps.state;
				initialState = !0;
				for (ref = ref ? 1 : 0; ref < type.length; ref++) propName$43 = type[ref], propName$43 = "function" === typeof propName$43 ? propName$43.call(newProps, defaultProps, props, void 0) : propName$43, null != propName$43 && (initialState ? (initialState = !1, defaultProps = assign$1({}, defaultProps, propName$43)) : assign$1(defaultProps, propName$43));
				newProps.state = defaultProps;
			}
			else defaultProps.queue = null;
			type = newProps.render();
			if (12 === request.status) throw null;
			props = task.keyPath;
			task.keyPath = keyPath;
			renderNodeDestructive$1(request, task, type, -1);
			task.keyPath = props;
		} else {
			type = renderWithHooks$1(request, task, keyPath, type, props, void 0);
			if (12 === request.status) throw null;
			finishFunctionComponent$1(request, task, keyPath, type, 0 !== localIdCounter$1, actionStateCounter$1, actionStateMatchingIndex$1);
		}
		else if ("string" === typeof type) if (newProps = task.blockedSegment, null === newProps) newProps = props.children, defaultProps = task.formatContext, initialState = task.keyPath, task.formatContext = getChildFormatContext$1(defaultProps, type, props), task.keyPath = keyPath, renderNode$1(request, task, newProps, -1), task.formatContext = defaultProps, task.keyPath = initialState;
		else {
			initialState = pushStartInstance$1(newProps.chunks, type, props, request.resumableState, request.renderState, task.blockedPreamble, task.hoistableState, task.formatContext, newProps.lastPushedText);
			newProps.lastPushedText = !1;
			defaultProps = task.formatContext;
			ref = task.keyPath;
			task.keyPath = keyPath;
			if (3 === (task.formatContext = getChildFormatContext$1(defaultProps, type, props)).insertionMode) {
				keyPath = createPendingSegment$1(request, 0, null, task.formatContext, !1, !1);
				newProps.preambleChildren.push(keyPath);
				task.blockedSegment = keyPath;
				try {
					keyPath.status = 6, renderNode$1(request, task, initialState, -1), pushSegmentFinale(keyPath.chunks, request.renderState, keyPath.lastPushedText, keyPath.textEmbedded), keyPath.status = 1;
				} finally {
					task.blockedSegment = newProps;
				}
			} else renderNode$1(request, task, initialState, -1);
			task.formatContext = defaultProps;
			task.keyPath = ref;
			a: {
				task = newProps.chunks;
				request = request.resumableState;
				switch (type) {
					case "title":
					case "style":
					case "script":
					case "area":
					case "base":
					case "br":
					case "col":
					case "embed":
					case "hr":
					case "img":
					case "input":
					case "keygen":
					case "link":
					case "meta":
					case "param":
					case "source":
					case "track":
					case "wbr": break a;
					case "body":
						if (1 >= defaultProps.insertionMode) {
							request.hasBody = !0;
							break a;
						}
						break;
					case "html":
						if (0 === defaultProps.insertionMode) {
							request.hasHtml = !0;
							break a;
						}
						break;
					case "head": if (1 >= defaultProps.insertionMode) break a;
				}
				task.push(endChunkForTag$1(type));
			}
			newProps.lastPushedText = !1;
		}
		else {
			switch (type) {
				case REACT_LEGACY_HIDDEN_TYPE$1:
				case REACT_STRICT_MODE_TYPE$1:
				case REACT_PROFILER_TYPE$1:
				case REACT_FRAGMENT_TYPE$1:
					type = task.keyPath;
					task.keyPath = keyPath;
					renderNodeDestructive$1(request, task, props.children, -1);
					task.keyPath = type;
					return;
				case REACT_ACTIVITY_TYPE$1:
					type = task.blockedSegment;
					null === type ? "hidden" !== props.mode && (type = task.keyPath, task.keyPath = keyPath, renderNode$1(request, task, props.children, -1), task.keyPath = type) : "hidden" !== props.mode && (request.renderState.generateStaticMarkup || type.chunks.push("<!--&-->"), type.lastPushedText = !1, newProps = task.keyPath, task.keyPath = keyPath, renderNode$1(request, task, props.children, -1), task.keyPath = newProps, request.renderState.generateStaticMarkup || type.chunks.push("<!--/&-->"), type.lastPushedText = !1);
					return;
				case REACT_SUSPENSE_LIST_TYPE$1:
					a: {
						type = props.children;
						props = props.revealOrder;
						if ("forwards" === props || "backwards" === props || "unstable_legacy-backwards" === props) {
							if (isArrayImpl$1(type)) {
								renderSuspenseListRows$1(request, task, keyPath, type, props);
								break a;
							}
							if (newProps = getIteratorFn$1(type)) {
								if (newProps = newProps.call(type)) {
									defaultProps = newProps.next();
									if (!defaultProps.done) {
										do
											defaultProps = newProps.next();
										while (!defaultProps.done);
										renderSuspenseListRows$1(request, task, keyPath, type, props);
									}
									break a;
								}
							}
						}
						"together" === props ? (props = task.keyPath, newProps = task.row, defaultProps = task.row = createSuspenseListRow$1(null), defaultProps.boundaries = [], defaultProps.together = !0, task.keyPath = keyPath, renderNodeDestructive$1(request, task, type, -1), 0 === --defaultProps.pendingTasks && finishSuspenseListRow$1(request, defaultProps), task.keyPath = props, task.row = newProps, null !== newProps && 0 < defaultProps.pendingTasks && (newProps.pendingTasks++, defaultProps.next = newProps)) : (props = task.keyPath, task.keyPath = keyPath, renderNodeDestructive$1(request, task, type, -1), task.keyPath = props);
					}
					return;
				case REACT_VIEW_TRANSITION_TYPE$1:
				case REACT_SCOPE_TYPE$1: throw Error("ReactDOMServer does not yet support scope components.");
				case REACT_SUSPENSE_TYPE$1:
					a: if (null !== task.replay) {
						type = task.keyPath;
						newProps = task.formatContext;
						defaultProps = task.row;
						task.keyPath = keyPath;
						task.formatContext = getSuspenseContentFormatContext$1(request.resumableState, newProps);
						task.row = null;
						keyPath = props.children;
						try {
							renderNode$1(request, task, keyPath, -1);
						} finally {
							task.keyPath = type, task.formatContext = newProps, task.row = defaultProps;
						}
					} else {
						type = task.keyPath;
						ref = task.formatContext;
						var prevRow = task.row, parentBoundary = task.blockedBoundary;
						propName$43 = task.blockedPreamble;
						var parentHoistableState = task.hoistableState;
						propName = task.blockedSegment;
						var fallback = props.fallback;
						props = props.children;
						var fallbackAbortSet = /* @__PURE__ */ new Set();
						var newBoundary = createSuspenseBoundary$1(request, task.row, fallbackAbortSet, null, null);
						null !== request.trackedPostpones && (newBoundary.trackedContentKeyPath = keyPath);
						var boundarySegment = createPendingSegment$1(request, propName.chunks.length, newBoundary, task.formatContext, !1, !1);
						propName.children.push(boundarySegment);
						propName.lastPushedText = !1;
						var contentRootSegment = createPendingSegment$1(request, 0, null, task.formatContext, !1, !1);
						contentRootSegment.parentFlushed = !0;
						if (null !== request.trackedPostpones) {
							newProps = task.componentStack;
							defaultProps = [
								keyPath[0],
								"Suspense Fallback",
								keyPath[2]
							];
							initialState = [
								defaultProps[1],
								defaultProps[2],
								[],
								null
							];
							request.trackedPostpones.workingMap.set(defaultProps, initialState);
							newBoundary.trackedFallbackNode = initialState;
							task.blockedSegment = boundarySegment;
							task.blockedPreamble = newBoundary.fallbackPreamble;
							task.keyPath = defaultProps;
							task.formatContext = getSuspenseFallbackFormatContext$1(request.resumableState, ref);
							task.componentStack = replaceSuspenseComponentStackWithSuspenseFallbackStack$1(newProps);
							boundarySegment.status = 6;
							try {
								renderNode$1(request, task, fallback, -1), pushSegmentFinale(boundarySegment.chunks, request.renderState, boundarySegment.lastPushedText, boundarySegment.textEmbedded), boundarySegment.status = 1;
							} catch (thrownValue) {
								throw boundarySegment.status = 12 === request.status ? 3 : 4, thrownValue;
							} finally {
								task.blockedSegment = propName, task.blockedPreamble = propName$43, task.keyPath = type, task.formatContext = ref;
							}
							task = createRenderTask$1(request, null, props, -1, newBoundary, contentRootSegment, newBoundary.contentPreamble, newBoundary.contentState, task.abortSet, keyPath, getSuspenseContentFormatContext$1(request.resumableState, task.formatContext), task.context, task.treeContext, null, newProps);
							pushComponentStack$1(task);
							request.pingedTasks.push(task);
						} else {
							task.blockedBoundary = newBoundary;
							task.blockedPreamble = newBoundary.contentPreamble;
							task.hoistableState = newBoundary.contentState;
							task.blockedSegment = contentRootSegment;
							task.keyPath = keyPath;
							task.formatContext = getSuspenseContentFormatContext$1(request.resumableState, ref);
							task.row = null;
							contentRootSegment.status = 6;
							try {
								if (renderNode$1(request, task, props, -1), pushSegmentFinale(contentRootSegment.chunks, request.renderState, contentRootSegment.lastPushedText, contentRootSegment.textEmbedded), contentRootSegment.status = 1, queueCompletedSegment$1(newBoundary, contentRootSegment), 0 === newBoundary.pendingTasks && 0 === newBoundary.status) {
									if (newBoundary.status = 1, !isEligibleForOutlining$1(request, newBoundary)) {
										null !== prevRow && 0 === --prevRow.pendingTasks && finishSuspenseListRow$1(request, prevRow);
										0 === request.pendingRootTasks && task.blockedPreamble && preparePreamble$1(request);
										break a;
									}
								} else null !== prevRow && prevRow.together && tryToResolveTogetherRow$1(request, prevRow);
							} catch (thrownValue$30) {
								newBoundary.status = 4, 12 === request.status ? (contentRootSegment.status = 3, newProps = request.fatalError) : (contentRootSegment.status = 4, newProps = thrownValue$30), defaultProps = getThrownInfo$1(task.componentStack), initialState = logRecoverableError$1(request, newProps, defaultProps), newBoundary.errorDigest = initialState, untrackBoundary$1(request, newBoundary);
							} finally {
								task.blockedBoundary = parentBoundary, task.blockedPreamble = propName$43, task.hoistableState = parentHoistableState, task.blockedSegment = propName, task.keyPath = type, task.formatContext = ref, task.row = prevRow;
							}
							task = createRenderTask$1(request, null, fallback, -1, parentBoundary, boundarySegment, newBoundary.fallbackPreamble, newBoundary.fallbackState, fallbackAbortSet, [
								keyPath[0],
								"Suspense Fallback",
								keyPath[2]
							], getSuspenseFallbackFormatContext$1(request.resumableState, task.formatContext), task.context, task.treeContext, task.row, replaceSuspenseComponentStackWithSuspenseFallbackStack$1(task.componentStack));
							pushComponentStack$1(task);
							request.pingedTasks.push(task);
						}
					}
					return;
			}
			if ("object" === typeof type && null !== type) switch (type.$$typeof) {
				case REACT_FORWARD_REF_TYPE$1:
					if ("ref" in props) for (fallback in newProps = {}, props) "ref" !== fallback && (newProps[fallback] = props[fallback]);
					else newProps = props;
					type = renderWithHooks$1(request, task, keyPath, type.render, newProps, ref);
					finishFunctionComponent$1(request, task, keyPath, type, 0 !== localIdCounter$1, actionStateCounter$1, actionStateMatchingIndex$1);
					return;
				case REACT_MEMO_TYPE$1:
					renderElement$1(request, task, keyPath, type.type, props, ref);
					return;
				case REACT_CONTEXT_TYPE$1:
					defaultProps = props.children;
					newProps = task.keyPath;
					props = props.value;
					initialState = type._currentValue2;
					type._currentValue2 = props;
					ref = currentActiveSnapshot$1;
					currentActiveSnapshot$1 = type = {
						parent: ref,
						depth: null === ref ? 0 : ref.depth + 1,
						context: type,
						parentValue: initialState,
						value: props
					};
					task.context = type;
					task.keyPath = keyPath;
					renderNodeDestructive$1(request, task, defaultProps, -1);
					request = currentActiveSnapshot$1;
					if (null === request) throw Error("Tried to pop a Context at the root of the app. This is a bug in React.");
					request.context._currentValue2 = request.parentValue;
					request = currentActiveSnapshot$1 = request.parent;
					task.context = request;
					task.keyPath = newProps;
					return;
				case REACT_CONSUMER_TYPE$1:
					props = props.children;
					type = props(type._context._currentValue2);
					props = task.keyPath;
					task.keyPath = keyPath;
					renderNodeDestructive$1(request, task, type, -1);
					task.keyPath = props;
					return;
				case REACT_LAZY_TYPE$1:
					newProps = type._init;
					type = newProps(type._payload);
					if (12 === request.status) throw null;
					renderElement$1(request, task, keyPath, type, props, ref);
					return;
			}
			throw Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + ((null == type ? type : typeof type) + "."));
		}
	}
	function resumeNode$1(request, task, segmentId, node, childIndex) {
		var prevReplay = task.replay, blockedBoundary = task.blockedBoundary, resumedSegment = createPendingSegment$1(request, 0, null, task.formatContext, !1, !1);
		resumedSegment.id = segmentId;
		resumedSegment.parentFlushed = !0;
		try {
			task.replay = null, task.blockedSegment = resumedSegment, renderNode$1(request, task, node, childIndex), resumedSegment.status = 1, null === blockedBoundary ? request.completedRootSegment = resumedSegment : (queueCompletedSegment$1(blockedBoundary, resumedSegment), blockedBoundary.parentFlushed && request.partialBoundaries.push(blockedBoundary));
		} finally {
			task.replay = prevReplay, task.blockedSegment = null;
		}
	}
	function renderNodeDestructive$1(request, task, node, childIndex) {
		null !== task.replay && "number" === typeof task.replay.slots ? resumeNode$1(request, task, task.replay.slots, node, childIndex) : (task.node = node, task.childIndex = childIndex, node = task.componentStack, pushComponentStack$1(task), retryNode$1(request, task), task.componentStack = node);
	}
	function retryNode$1(request, task) {
		var node = task.node, childIndex = task.childIndex;
		if (null !== node) {
			if ("object" === typeof node) {
				switch (node.$$typeof) {
					case REACT_ELEMENT_TYPE$1:
						var type = node.type, key = node.key, props = node.props;
						node = props.ref;
						var ref = void 0 !== node ? node : null, name = getComponentNameFromType$1(type), keyOrIndex = null == key ? -1 === childIndex ? 0 : childIndex : key;
						key = [
							task.keyPath,
							name,
							keyOrIndex
						];
						if (null !== task.replay) a: {
							var replay = task.replay;
							childIndex = replay.nodes;
							for (node = 0; node < childIndex.length; node++) {
								var node$jscomp$0 = childIndex[node];
								if (keyOrIndex === node$jscomp$0[1]) {
									if (4 === node$jscomp$0.length) {
										if (null !== name && name !== node$jscomp$0[0]) throw Error("Expected the resume to render <" + node$jscomp$0[0] + "> in this slot but instead it rendered <" + name + ">. The tree doesn't match so React will fallback to client rendering.");
										var childNodes = node$jscomp$0[2];
										name = node$jscomp$0[3];
										keyOrIndex = task.node;
										task.replay = {
											nodes: childNodes,
											slots: name,
											pendingTasks: 1
										};
										try {
											renderElement$1(request, task, key, type, props, ref);
											if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
											task.replay.pendingTasks--;
										} catch (x) {
											if ("object" === typeof x && null !== x && (x === SuspenseException$1 || "function" === typeof x.then)) throw task.node === keyOrIndex ? task.replay = replay : childIndex.splice(node, 1), x;
											task.replay.pendingTasks--;
											props = getThrownInfo$1(task.componentStack);
											key = request;
											request = task.blockedBoundary;
											type = x;
											props = logRecoverableError$1(key, type, props);
											abortRemainingReplayNodes$1(key, request, childNodes, name, type, props);
										}
										task.replay = replay;
									} else {
										if (type !== REACT_SUSPENSE_TYPE$1) throw Error("Expected the resume to render <Suspense> in this slot but instead it rendered <" + (getComponentNameFromType$1(type) || "Unknown") + ">. The tree doesn't match so React will fallback to client rendering.");
										b: {
											replay = void 0;
											type = node$jscomp$0[5];
											ref = node$jscomp$0[2];
											name = node$jscomp$0[3];
											keyOrIndex = null === node$jscomp$0[4] ? [] : node$jscomp$0[4][2];
											node$jscomp$0 = null === node$jscomp$0[4] ? null : node$jscomp$0[4][3];
											var prevKeyPath = task.keyPath, prevContext = task.formatContext, prevRow = task.row, previousReplaySet = task.replay, parentBoundary = task.blockedBoundary, parentHoistableState = task.hoistableState, content = props.children, fallback = props.fallback, fallbackAbortSet = /* @__PURE__ */ new Set();
											props = createSuspenseBoundary$1(request, task.row, fallbackAbortSet, null, null);
											props.parentFlushed = !0;
											props.rootSegmentID = type;
											task.blockedBoundary = props;
											task.hoistableState = props.contentState;
											task.keyPath = key;
											task.formatContext = getSuspenseContentFormatContext$1(request.resumableState, prevContext);
											task.row = null;
											task.replay = {
												nodes: ref,
												slots: name,
												pendingTasks: 1
											};
											try {
												renderNode$1(request, task, content, -1);
												if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
												task.replay.pendingTasks--;
												if (0 === props.pendingTasks && 0 === props.status) {
													props.status = 1;
													request.completedBoundaries.push(props);
													break b;
												}
											} catch (error) {
												props.status = 4, childNodes = getThrownInfo$1(task.componentStack), replay = logRecoverableError$1(request, error, childNodes), props.errorDigest = replay, task.replay.pendingTasks--, request.clientRenderedBoundaries.push(props);
											} finally {
												task.blockedBoundary = parentBoundary, task.hoistableState = parentHoistableState, task.replay = previousReplaySet, task.keyPath = prevKeyPath, task.formatContext = prevContext, task.row = prevRow;
											}
											childNodes = createReplayTask$1(request, null, {
												nodes: keyOrIndex,
												slots: node$jscomp$0,
												pendingTasks: 0
											}, fallback, -1, parentBoundary, props.fallbackState, fallbackAbortSet, [
												key[0],
												"Suspense Fallback",
												key[2]
											], getSuspenseFallbackFormatContext$1(request.resumableState, task.formatContext), task.context, task.treeContext, task.row, replaceSuspenseComponentStackWithSuspenseFallbackStack$1(task.componentStack));
											pushComponentStack$1(childNodes);
											request.pingedTasks.push(childNodes);
										}
									}
									childIndex.splice(node, 1);
									break a;
								}
							}
						}
						else renderElement$1(request, task, key, type, props, ref);
						return;
					case REACT_PORTAL_TYPE$1: throw Error("Portals are not currently supported by the server renderer. Render them conditionally so that they only appear on the client render.");
					case REACT_LAZY_TYPE$1:
						childNodes = node._init;
						node = childNodes(node._payload);
						if (12 === request.status) throw null;
						renderNodeDestructive$1(request, task, node, childIndex);
						return;
				}
				if (isArrayImpl$1(node)) {
					renderChildrenArray$1(request, task, node, childIndex);
					return;
				}
				if (childNodes = getIteratorFn$1(node)) {
					if (childNodes = childNodes.call(node)) {
						node = childNodes.next();
						if (!node.done) {
							props = [];
							do
								props.push(node.value), node = childNodes.next();
							while (!node.done);
							renderChildrenArray$1(request, task, props, childIndex);
						}
						return;
					}
				}
				if ("function" === typeof node.then) return task.thenableState = null, renderNodeDestructive$1(request, task, unwrapThenable$1(node), childIndex);
				if (node.$$typeof === REACT_CONTEXT_TYPE$1) return renderNodeDestructive$1(request, task, node._currentValue2, childIndex);
				childIndex = Object.prototype.toString.call(node);
				throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === childIndex ? "object with keys {" + Object.keys(node).join(", ") + "}" : childIndex) + "). If you meant to render a collection of children, use an array instead.");
			}
			if ("string" === typeof node) childIndex = task.blockedSegment, null !== childIndex && (childIndex.lastPushedText = pushTextInstance$1(childIndex.chunks, node, request.renderState, childIndex.lastPushedText));
			else if ("number" === typeof node || "bigint" === typeof node) childIndex = task.blockedSegment, null !== childIndex && (childIndex.lastPushedText = pushTextInstance$1(childIndex.chunks, "" + node, request.renderState, childIndex.lastPushedText));
		}
	}
	function renderChildrenArray$1(request, task, children, childIndex) {
		var prevKeyPath = task.keyPath;
		if (-1 !== childIndex && (task.keyPath = [
			task.keyPath,
			"Fragment",
			childIndex
		], null !== task.replay)) {
			for (var replay = task.replay, replayNodes = replay.nodes, j = 0; j < replayNodes.length; j++) {
				var node = replayNodes[j];
				if (node[1] === childIndex) {
					childIndex = node[2];
					node = node[3];
					task.replay = {
						nodes: childIndex,
						slots: node,
						pendingTasks: 1
					};
					try {
						renderChildrenArray$1(request, task, children, -1);
						if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
						task.replay.pendingTasks--;
					} catch (x) {
						if ("object" === typeof x && null !== x && (x === SuspenseException$1 || "function" === typeof x.then)) throw x;
						task.replay.pendingTasks--;
						children = getThrownInfo$1(task.componentStack);
						var boundary = task.blockedBoundary, error = x;
						children = logRecoverableError$1(request, error, children);
						abortRemainingReplayNodes$1(request, boundary, childIndex, node, error, children);
					}
					task.replay = replay;
					replayNodes.splice(j, 1);
					break;
				}
			}
			task.keyPath = prevKeyPath;
			return;
		}
		replay = task.treeContext;
		replayNodes = children.length;
		if (null !== task.replay && (j = task.replay.slots, null !== j && "object" === typeof j)) {
			for (childIndex = 0; childIndex < replayNodes; childIndex++) node = children[childIndex], task.treeContext = pushTreeContext$1(replay, replayNodes, childIndex), boundary = j[childIndex], "number" === typeof boundary ? (resumeNode$1(request, task, boundary, node, childIndex), delete j[childIndex]) : renderNode$1(request, task, node, childIndex);
			task.treeContext = replay;
			task.keyPath = prevKeyPath;
			return;
		}
		for (j = 0; j < replayNodes; j++) childIndex = children[j], task.treeContext = pushTreeContext$1(replay, replayNodes, j), renderNode$1(request, task, childIndex, j);
		task.treeContext = replay;
		task.keyPath = prevKeyPath;
	}
	function trackPostponedBoundary$1(request, trackedPostpones, boundary) {
		boundary.status = 5;
		boundary.rootSegmentID = request.nextSegmentId++;
		request = boundary.trackedContentKeyPath;
		if (null === request) throw Error("It should not be possible to postpone at the root. This is a bug in React.");
		var fallbackReplayNode = boundary.trackedFallbackNode, children = [], boundaryNode = trackedPostpones.workingMap.get(request);
		if (void 0 === boundaryNode) return boundary = [
			request[1],
			request[2],
			children,
			null,
			fallbackReplayNode,
			boundary.rootSegmentID
		], trackedPostpones.workingMap.set(request, boundary), addToReplayParent$1(boundary, request[0], trackedPostpones), boundary;
		boundaryNode[4] = fallbackReplayNode;
		boundaryNode[5] = boundary.rootSegmentID;
		return boundaryNode;
	}
	function trackPostpone$1(request, trackedPostpones, task, segment) {
		segment.status = 5;
		var keyPath = task.keyPath, boundary = task.blockedBoundary;
		if (null === boundary) segment.id = request.nextSegmentId++, trackedPostpones.rootSlots = segment.id, null !== request.completedRootSegment && (request.completedRootSegment.status = 5);
		else {
			if (null !== boundary && 0 === boundary.status) {
				var boundaryNode = trackPostponedBoundary$1(request, trackedPostpones, boundary);
				if (boundary.trackedContentKeyPath === keyPath && -1 === task.childIndex) {
					-1 === segment.id && (segment.id = segment.parentFlushed ? boundary.rootSegmentID : request.nextSegmentId++);
					boundaryNode[3] = segment.id;
					return;
				}
			}
			-1 === segment.id && (segment.id = segment.parentFlushed && null !== boundary ? boundary.rootSegmentID : request.nextSegmentId++);
			if (-1 === task.childIndex) null === keyPath ? trackedPostpones.rootSlots = segment.id : (task = trackedPostpones.workingMap.get(keyPath), void 0 === task ? (task = [
				keyPath[1],
				keyPath[2],
				[],
				segment.id
			], addToReplayParent$1(task, keyPath[0], trackedPostpones)) : task[3] = segment.id);
			else {
				if (null === keyPath) {
					if (request = trackedPostpones.rootSlots, null === request) request = trackedPostpones.rootSlots = {};
					else if ("number" === typeof request) throw Error("It should not be possible to postpone both at the root of an element as well as a slot below. This is a bug in React.");
				} else if (boundary = trackedPostpones.workingMap, boundaryNode = boundary.get(keyPath), void 0 === boundaryNode) request = {}, boundaryNode = [
					keyPath[1],
					keyPath[2],
					[],
					request
				], boundary.set(keyPath, boundaryNode), addToReplayParent$1(boundaryNode, keyPath[0], trackedPostpones);
				else if (request = boundaryNode[3], null === request) request = boundaryNode[3] = {};
				else if ("number" === typeof request) throw Error("It should not be possible to postpone both at the root of an element as well as a slot below. This is a bug in React.");
				request[task.childIndex] = segment.id;
			}
		}
	}
	function untrackBoundary$1(request, boundary) {
		request = request.trackedPostpones;
		null !== request && (boundary = boundary.trackedContentKeyPath, null !== boundary && (boundary = request.workingMap.get(boundary), void 0 !== boundary && (boundary.length = 4, boundary[2] = [], boundary[3] = null)));
	}
	function spawnNewSuspendedReplayTask$1(request, task, thenableState$2) {
		return createReplayTask$1(request, thenableState$2, task.replay, task.node, task.childIndex, task.blockedBoundary, task.hoistableState, task.abortSet, task.keyPath, task.formatContext, task.context, task.treeContext, task.row, task.componentStack);
	}
	function spawnNewSuspendedRenderTask$1(request, task, thenableState$2) {
		var segment = task.blockedSegment, newSegment = createPendingSegment$1(request, segment.chunks.length, null, task.formatContext, segment.lastPushedText, !0);
		segment.children.push(newSegment);
		segment.lastPushedText = !1;
		return createRenderTask$1(request, thenableState$2, task.node, task.childIndex, task.blockedBoundary, newSegment, task.blockedPreamble, task.hoistableState, task.abortSet, task.keyPath, task.formatContext, task.context, task.treeContext, task.row, task.componentStack);
	}
	function renderNode$1(request, task, node, childIndex) {
		var previousFormatContext = task.formatContext, previousContext = task.context, previousKeyPath = task.keyPath, previousTreeContext = task.treeContext, previousComponentStack = task.componentStack, segment = task.blockedSegment;
		if (null === segment) {
			segment = task.replay;
			try {
				return renderNodeDestructive$1(request, task, node, childIndex);
			} catch (thrownValue) {
				if (resetHooksState$1(), node = thrownValue === SuspenseException$1 ? getSuspendedThenable$1() : thrownValue, 12 !== request.status && "object" === typeof node && null !== node) {
					if ("function" === typeof node.then) {
						childIndex = thrownValue === SuspenseException$1 ? getThenableStateAfterSuspending$1() : null;
						request = spawnNewSuspendedReplayTask$1(request, task, childIndex).ping;
						node.then(request, request);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						task.replay = segment;
						switchContext$1(previousContext);
						return;
					}
					if ("Maximum call stack size exceeded" === node.message) {
						node = thrownValue === SuspenseException$1 ? getThenableStateAfterSuspending$1() : null;
						node = spawnNewSuspendedReplayTask$1(request, task, node);
						request.pingedTasks.push(node);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						task.replay = segment;
						switchContext$1(previousContext);
						return;
					}
				}
			}
		} else {
			var childrenLength = segment.children.length, chunkLength = segment.chunks.length;
			try {
				return renderNodeDestructive$1(request, task, node, childIndex);
			} catch (thrownValue$62) {
				if (resetHooksState$1(), segment.children.length = childrenLength, segment.chunks.length = chunkLength, node = thrownValue$62 === SuspenseException$1 ? getSuspendedThenable$1() : thrownValue$62, 12 !== request.status && "object" === typeof node && null !== node) {
					if ("function" === typeof node.then) {
						segment = node;
						node = thrownValue$62 === SuspenseException$1 ? getThenableStateAfterSuspending$1() : null;
						request = spawnNewSuspendedRenderTask$1(request, task, node).ping;
						segment.then(request, request);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						switchContext$1(previousContext);
						return;
					}
					if ("Maximum call stack size exceeded" === node.message) {
						segment = thrownValue$62 === SuspenseException$1 ? getThenableStateAfterSuspending$1() : null;
						segment = spawnNewSuspendedRenderTask$1(request, task, segment);
						request.pingedTasks.push(segment);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						switchContext$1(previousContext);
						return;
					}
				}
			}
		}
		task.formatContext = previousFormatContext;
		task.context = previousContext;
		task.keyPath = previousKeyPath;
		task.treeContext = previousTreeContext;
		switchContext$1(previousContext);
		throw node;
	}
	function abortTaskSoft$1(task) {
		var boundary = task.blockedBoundary, segment = task.blockedSegment;
		null !== segment && (segment.status = 3, finishedTask$1(this, boundary, task.row, segment));
	}
	function abortRemainingReplayNodes$1(request$jscomp$0, boundary, nodes, slots, error, errorDigest$jscomp$0) {
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (4 === node.length) abortRemainingReplayNodes$1(request$jscomp$0, boundary, node[2], node[3], error, errorDigest$jscomp$0);
			else {
				node = node[5];
				var request = request$jscomp$0, errorDigest = errorDigest$jscomp$0, resumedBoundary = createSuspenseBoundary$1(request, null, /* @__PURE__ */ new Set(), null, null);
				resumedBoundary.parentFlushed = !0;
				resumedBoundary.rootSegmentID = node;
				resumedBoundary.status = 4;
				resumedBoundary.errorDigest = errorDigest;
				resumedBoundary.parentFlushed && request.clientRenderedBoundaries.push(resumedBoundary);
			}
		}
		nodes.length = 0;
		if (null !== slots) {
			if (null === boundary) throw Error("We should not have any resumable nodes in the shell. This is a bug in React.");
			4 !== boundary.status && (boundary.status = 4, boundary.errorDigest = errorDigest$jscomp$0, boundary.parentFlushed && request$jscomp$0.clientRenderedBoundaries.push(boundary));
			if ("object" === typeof slots) for (var index in slots) delete slots[index];
		}
	}
	function abortTask$1(task, request, error) {
		var boundary = task.blockedBoundary, segment = task.blockedSegment;
		if (null !== segment) {
			if (6 === segment.status) return;
			segment.status = 3;
		}
		var errorInfo = getThrownInfo$1(task.componentStack);
		if (null === boundary) {
			if (13 !== request.status && 14 !== request.status) {
				boundary = task.replay;
				if (null === boundary) {
					null !== request.trackedPostpones && null !== segment ? (boundary = request.trackedPostpones, logRecoverableError$1(request, error, errorInfo), trackPostpone$1(request, boundary, task, segment), finishedTask$1(request, null, task.row, segment)) : (logRecoverableError$1(request, error, errorInfo), fatalError$1(request, error));
					return;
				}
				boundary.pendingTasks--;
				0 === boundary.pendingTasks && 0 < boundary.nodes.length && (segment = logRecoverableError$1(request, error, errorInfo), abortRemainingReplayNodes$1(request, null, boundary.nodes, boundary.slots, error, segment));
				request.pendingRootTasks--;
				0 === request.pendingRootTasks && completeShell$1(request);
			}
		} else {
			var trackedPostpones$63 = request.trackedPostpones;
			if (4 !== boundary.status) {
				if (null !== trackedPostpones$63 && null !== segment) return logRecoverableError$1(request, error, errorInfo), trackPostpone$1(request, trackedPostpones$63, task, segment), boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
					return abortTask$1(fallbackTask, request, error);
				}), boundary.fallbackAbortableTasks.clear(), finishedTask$1(request, boundary, task.row, segment);
				boundary.status = 4;
				segment = logRecoverableError$1(request, error, errorInfo);
				boundary.status = 4;
				boundary.errorDigest = segment;
				untrackBoundary$1(request, boundary);
				boundary.parentFlushed && request.clientRenderedBoundaries.push(boundary);
			}
			boundary.pendingTasks--;
			segment = boundary.row;
			null !== segment && 0 === --segment.pendingTasks && finishSuspenseListRow$1(request, segment);
			boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
				return abortTask$1(fallbackTask, request, error);
			});
			boundary.fallbackAbortableTasks.clear();
		}
		task = task.row;
		null !== task && 0 === --task.pendingTasks && finishSuspenseListRow$1(request, task);
		request.allPendingTasks--;
		0 === request.allPendingTasks && completeAll$1(request);
	}
	function safelyEmitEarlyPreloads$1(request, shellComplete) {
		try {
			var renderState = request.renderState, onHeaders = renderState.onHeaders;
			if (onHeaders) {
				var headers = renderState.headers;
				if (headers) {
					renderState.headers = null;
					var linkHeader = headers.preconnects;
					headers.fontPreloads && (linkHeader && (linkHeader += ", "), linkHeader += headers.fontPreloads);
					headers.highImagePreloads && (linkHeader && (linkHeader += ", "), linkHeader += headers.highImagePreloads);
					if (!shellComplete) {
						var queueIter = renderState.styles.values(), queueStep = queueIter.next();
						b: for (; 0 < headers.remainingCapacity && !queueStep.done; queueStep = queueIter.next()) for (var sheetIter = queueStep.value.sheets.values(), sheetStep = sheetIter.next(); 0 < headers.remainingCapacity && !sheetStep.done; sheetStep = sheetIter.next()) {
							var sheet = sheetStep.value, props = sheet.props, key = props.href, props$jscomp$0 = sheet.props, header = getPreloadAsHeader$1(props$jscomp$0.href, "style", {
								crossOrigin: props$jscomp$0.crossOrigin,
								integrity: props$jscomp$0.integrity,
								nonce: props$jscomp$0.nonce,
								type: props$jscomp$0.type,
								fetchPriority: props$jscomp$0.fetchPriority,
								referrerPolicy: props$jscomp$0.referrerPolicy,
								media: props$jscomp$0.media
							});
							if (0 <= (headers.remainingCapacity -= header.length + 2)) renderState.resets.style[key] = PRELOAD_NO_CREDS$1, linkHeader && (linkHeader += ", "), linkHeader += header, renderState.resets.style[key] = "string" === typeof props.crossOrigin || "string" === typeof props.integrity ? [props.crossOrigin, props.integrity] : PRELOAD_NO_CREDS$1;
							else break b;
						}
					}
					linkHeader ? onHeaders({ Link: linkHeader }) : onHeaders({});
				}
			}
		} catch (error) {
			logRecoverableError$1(request, error, {});
		}
	}
	function completeShell$1(request) {
		null === request.trackedPostpones && safelyEmitEarlyPreloads$1(request, !0);
		null === request.trackedPostpones && preparePreamble$1(request);
		request.onShellError = noop$3;
		request = request.onShellReady;
		request();
	}
	function completeAll$1(request) {
		safelyEmitEarlyPreloads$1(request, null === request.trackedPostpones ? !0 : null === request.completedRootSegment || 5 !== request.completedRootSegment.status);
		preparePreamble$1(request);
		request = request.onAllReady;
		request();
	}
	function queueCompletedSegment$1(boundary, segment) {
		if (0 === segment.chunks.length && 1 === segment.children.length && null === segment.children[0].boundary && -1 === segment.children[0].id) {
			var childSegment = segment.children[0];
			childSegment.id = segment.id;
			childSegment.parentFlushed = !0;
			1 !== childSegment.status && 3 !== childSegment.status && 4 !== childSegment.status || queueCompletedSegment$1(boundary, childSegment);
		} else boundary.completedSegments.push(segment);
	}
	function finishedTask$1(request, boundary, row, segment) {
		null !== row && (0 === --row.pendingTasks ? finishSuspenseListRow$1(request, row) : row.together && tryToResolveTogetherRow$1(request, row));
		request.allPendingTasks--;
		if (null === boundary) {
			if (null !== segment && segment.parentFlushed) {
				if (null !== request.completedRootSegment) throw Error("There can only be one root segment. This is a bug in React.");
				request.completedRootSegment = segment;
			}
			request.pendingRootTasks--;
			0 === request.pendingRootTasks && completeShell$1(request);
		} else if (boundary.pendingTasks--, 4 !== boundary.status) if (0 === boundary.pendingTasks) {
			if (0 === boundary.status && (boundary.status = 1), null !== segment && segment.parentFlushed && (1 === segment.status || 3 === segment.status) && queueCompletedSegment$1(boundary, segment), boundary.parentFlushed && request.completedBoundaries.push(boundary), 1 === boundary.status) row = boundary.row, null !== row && hoistHoistables$1(row.hoistables, boundary.contentState), isEligibleForOutlining$1(request, boundary) || (boundary.fallbackAbortableTasks.forEach(abortTaskSoft$1, request), boundary.fallbackAbortableTasks.clear(), null !== row && 0 === --row.pendingTasks && finishSuspenseListRow$1(request, row)), 0 === request.pendingRootTasks && null === request.trackedPostpones && null !== boundary.contentPreamble && preparePreamble$1(request);
			else if (5 === boundary.status && (boundary = boundary.row, null !== boundary)) {
				if (null !== request.trackedPostpones) {
					row = request.trackedPostpones;
					var postponedRow = boundary.next;
					if (null !== postponedRow && (segment = postponedRow.boundaries, null !== segment)) for (postponedRow.boundaries = null, postponedRow = 0; postponedRow < segment.length; postponedRow++) {
						var postponedBoundary = segment[postponedRow];
						trackPostponedBoundary$1(request, row, postponedBoundary);
						finishedTask$1(request, postponedBoundary, null, null);
					}
				}
				0 === --boundary.pendingTasks && finishSuspenseListRow$1(request, boundary);
			}
		} else null === segment || !segment.parentFlushed || 1 !== segment.status && 3 !== segment.status || (queueCompletedSegment$1(boundary, segment), 1 === boundary.completedSegments.length && boundary.parentFlushed && request.partialBoundaries.push(boundary)), boundary = boundary.row, null !== boundary && boundary.together && tryToResolveTogetherRow$1(request, boundary);
		0 === request.allPendingTasks && completeAll$1(request);
	}
	function performWork$1(request$jscomp$2) {
		if (14 !== request$jscomp$2.status && 13 !== request$jscomp$2.status) {
			var prevContext = currentActiveSnapshot$1, prevDispatcher = ReactSharedInternals$1.H;
			ReactSharedInternals$1.H = HooksDispatcher$1;
			var prevAsyncDispatcher = ReactSharedInternals$1.A;
			ReactSharedInternals$1.A = DefaultAsyncDispatcher$1;
			var prevRequest = currentRequest$1;
			currentRequest$1 = request$jscomp$2;
			var prevResumableState = currentResumableState$1;
			currentResumableState$1 = request$jscomp$2.resumableState;
			try {
				var pingedTasks = request$jscomp$2.pingedTasks, i;
				for (i = 0; i < pingedTasks.length; i++) {
					var task = pingedTasks[i], request = request$jscomp$2, segment = task.blockedSegment;
					if (null === segment) {
						var request$jscomp$0 = request;
						if (0 !== task.replay.pendingTasks) {
							switchContext$1(task.context);
							try {
								"number" === typeof task.replay.slots ? resumeNode$1(request$jscomp$0, task, task.replay.slots, task.node, task.childIndex) : retryNode$1(request$jscomp$0, task);
								if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
								task.replay.pendingTasks--;
								task.abortSet.delete(task);
								finishedTask$1(request$jscomp$0, task.blockedBoundary, task.row, null);
							} catch (thrownValue) {
								resetHooksState$1();
								var x = thrownValue === SuspenseException$1 ? getSuspendedThenable$1() : thrownValue;
								if ("object" === typeof x && null !== x && "function" === typeof x.then) {
									var ping = task.ping;
									x.then(ping, ping);
									task.thenableState = thrownValue === SuspenseException$1 ? getThenableStateAfterSuspending$1() : null;
								} else {
									task.replay.pendingTasks--;
									task.abortSet.delete(task);
									var errorInfo = getThrownInfo$1(task.componentStack);
									request = void 0;
									var request$jscomp$1 = request$jscomp$0, boundary = task.blockedBoundary, error$jscomp$0 = 12 === request$jscomp$0.status ? request$jscomp$0.fatalError : x, replayNodes = task.replay.nodes, resumeSlots = task.replay.slots;
									request = logRecoverableError$1(request$jscomp$1, error$jscomp$0, errorInfo);
									abortRemainingReplayNodes$1(request$jscomp$1, boundary, replayNodes, resumeSlots, error$jscomp$0, request);
									request$jscomp$0.pendingRootTasks--;
									0 === request$jscomp$0.pendingRootTasks && completeShell$1(request$jscomp$0);
									request$jscomp$0.allPendingTasks--;
									0 === request$jscomp$0.allPendingTasks && completeAll$1(request$jscomp$0);
								}
							}
						}
					} else if (request$jscomp$0 = void 0, request$jscomp$1 = segment, 0 === request$jscomp$1.status) {
						request$jscomp$1.status = 6;
						switchContext$1(task.context);
						var childrenLength = request$jscomp$1.children.length, chunkLength = request$jscomp$1.chunks.length;
						try {
							retryNode$1(request, task), pushSegmentFinale(request$jscomp$1.chunks, request.renderState, request$jscomp$1.lastPushedText, request$jscomp$1.textEmbedded), task.abortSet.delete(task), request$jscomp$1.status = 1, finishedTask$1(request, task.blockedBoundary, task.row, request$jscomp$1);
						} catch (thrownValue) {
							resetHooksState$1();
							request$jscomp$1.children.length = childrenLength;
							request$jscomp$1.chunks.length = chunkLength;
							var x$jscomp$0 = thrownValue === SuspenseException$1 ? getSuspendedThenable$1() : 12 === request.status ? request.fatalError : thrownValue;
							if (12 === request.status && null !== request.trackedPostpones) {
								var trackedPostpones = request.trackedPostpones, thrownInfo = getThrownInfo$1(task.componentStack);
								task.abortSet.delete(task);
								logRecoverableError$1(request, x$jscomp$0, thrownInfo);
								trackPostpone$1(request, trackedPostpones, task, request$jscomp$1);
								finishedTask$1(request, task.blockedBoundary, task.row, request$jscomp$1);
							} else if ("object" === typeof x$jscomp$0 && null !== x$jscomp$0 && "function" === typeof x$jscomp$0.then) {
								request$jscomp$1.status = 0;
								task.thenableState = thrownValue === SuspenseException$1 ? getThenableStateAfterSuspending$1() : null;
								var ping$jscomp$0 = task.ping;
								x$jscomp$0.then(ping$jscomp$0, ping$jscomp$0);
							} else {
								var errorInfo$jscomp$0 = getThrownInfo$1(task.componentStack);
								task.abortSet.delete(task);
								request$jscomp$1.status = 4;
								var boundary$jscomp$0 = task.blockedBoundary, row = task.row;
								null !== row && 0 === --row.pendingTasks && finishSuspenseListRow$1(request, row);
								request.allPendingTasks--;
								request$jscomp$0 = logRecoverableError$1(request, x$jscomp$0, errorInfo$jscomp$0);
								if (null === boundary$jscomp$0) fatalError$1(request, x$jscomp$0);
								else if (boundary$jscomp$0.pendingTasks--, 4 !== boundary$jscomp$0.status) {
									boundary$jscomp$0.status = 4;
									boundary$jscomp$0.errorDigest = request$jscomp$0;
									untrackBoundary$1(request, boundary$jscomp$0);
									var boundaryRow = boundary$jscomp$0.row;
									null !== boundaryRow && 0 === --boundaryRow.pendingTasks && finishSuspenseListRow$1(request, boundaryRow);
									boundary$jscomp$0.parentFlushed && request.clientRenderedBoundaries.push(boundary$jscomp$0);
									0 === request.pendingRootTasks && null === request.trackedPostpones && null !== boundary$jscomp$0.contentPreamble && preparePreamble$1(request);
								}
								0 === request.allPendingTasks && completeAll$1(request);
							}
						}
					}
				}
				pingedTasks.splice(0, i);
				null !== request$jscomp$2.destination && flushCompletedQueues$1(request$jscomp$2, request$jscomp$2.destination);
			} catch (error) {
				logRecoverableError$1(request$jscomp$2, error, {}), fatalError$1(request$jscomp$2, error);
			} finally {
				currentResumableState$1 = prevResumableState, ReactSharedInternals$1.H = prevDispatcher, ReactSharedInternals$1.A = prevAsyncDispatcher, prevDispatcher === HooksDispatcher$1 && switchContext$1(prevContext), currentRequest$1 = prevRequest;
			}
		}
	}
	function preparePreambleFromSubtree$1(request, segment, collectedPreambleSegments) {
		segment.preambleChildren.length && collectedPreambleSegments.push(segment.preambleChildren);
		for (var pendingPreambles = !1, i = 0; i < segment.children.length; i++) pendingPreambles = preparePreambleFromSegment$1(request, segment.children[i], collectedPreambleSegments) || pendingPreambles;
		return pendingPreambles;
	}
	function preparePreambleFromSegment$1(request, segment, collectedPreambleSegments) {
		var boundary = segment.boundary;
		if (null === boundary) return preparePreambleFromSubtree$1(request, segment, collectedPreambleSegments);
		var preamble = boundary.contentPreamble, fallbackPreamble = boundary.fallbackPreamble;
		if (null === preamble || null === fallbackPreamble) return !1;
		switch (boundary.status) {
			case 1:
				hoistPreambleState$1(request.renderState, preamble);
				request.byteSize += boundary.byteSize;
				segment = boundary.completedSegments[0];
				if (!segment) throw Error("A previously unvisited boundary must have exactly one root segment. This is a bug in React.");
				return preparePreambleFromSubtree$1(request, segment, collectedPreambleSegments);
			case 5: if (null !== request.trackedPostpones) return !0;
			case 4: if (1 === segment.status) return hoistPreambleState$1(request.renderState, fallbackPreamble), preparePreambleFromSubtree$1(request, segment, collectedPreambleSegments);
			default: return !0;
		}
	}
	function preparePreamble$1(request) {
		if (request.completedRootSegment && null === request.completedPreambleSegments) {
			var collectedPreambleSegments = [], originalRequestByteSize = request.byteSize, hasPendingPreambles = preparePreambleFromSegment$1(request, request.completedRootSegment, collectedPreambleSegments), preamble = request.renderState.preamble;
			!1 === hasPendingPreambles || preamble.headChunks && preamble.bodyChunks ? request.completedPreambleSegments = collectedPreambleSegments : request.byteSize = originalRequestByteSize;
		}
	}
	function flushSubtree$1(request, destination, segment, hoistableState) {
		segment.parentFlushed = !0;
		switch (segment.status) {
			case 0: segment.id = request.nextSegmentId++;
			case 5: return hoistableState = segment.id, segment.lastPushedText = !1, segment.textEmbedded = !1, request = request.renderState, destination.push("<template id=\""), destination.push(request.placeholderPrefix), request = hoistableState.toString(16), destination.push(request), destination.push("\"></template>");
			case 1:
				segment.status = 2;
				var r = !0, chunks = segment.chunks, chunkIdx = 0;
				segment = segment.children;
				for (var childIdx = 0; childIdx < segment.length; childIdx++) {
					for (r = segment[childIdx]; chunkIdx < r.index; chunkIdx++) destination.push(chunks[chunkIdx]);
					r = flushSegment$1(request, destination, r, hoistableState);
				}
				for (; chunkIdx < chunks.length - 1; chunkIdx++) destination.push(chunks[chunkIdx]);
				chunkIdx < chunks.length && (r = destination.push(chunks[chunkIdx]));
				return r;
			case 3: return !0;
			default: throw Error("Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React.");
		}
	}
	var flushedByteSize$1 = 0;
	function flushSegment$1(request, destination, segment, hoistableState) {
		var boundary = segment.boundary;
		if (null === boundary) return flushSubtree$1(request, destination, segment, hoistableState);
		boundary.parentFlushed = !0;
		if (4 === boundary.status) {
			var row = boundary.row;
			null !== row && 0 === --row.pendingTasks && finishSuspenseListRow$1(request, row);
			request.renderState.generateStaticMarkup || (boundary = boundary.errorDigest, destination.push("<!--$!-->"), destination.push("<template"), boundary && (destination.push(" data-dgst=\""), boundary = escapeTextForBrowser$1(boundary), destination.push(boundary), destination.push("\"")), destination.push("></template>"));
			flushSubtree$1(request, destination, segment, hoistableState);
			request = request.renderState.generateStaticMarkup ? !0 : destination.push("<!--/$-->");
			return request;
		}
		if (1 !== boundary.status) return 0 === boundary.status && (boundary.rootSegmentID = request.nextSegmentId++), 0 < boundary.completedSegments.length && request.partialBoundaries.push(boundary), writeStartPendingSuspenseBoundary$1(destination, request.renderState, boundary.rootSegmentID), hoistableState && hoistHoistables$1(hoistableState, boundary.fallbackState), flushSubtree$1(request, destination, segment, hoistableState), destination.push("<!--/$-->");
		if (!flushingPartialBoundaries$1 && isEligibleForOutlining$1(request, boundary) && flushedByteSize$1 + boundary.byteSize > request.progressiveChunkSize) return boundary.rootSegmentID = request.nextSegmentId++, request.completedBoundaries.push(boundary), writeStartPendingSuspenseBoundary$1(destination, request.renderState, boundary.rootSegmentID), flushSubtree$1(request, destination, segment, hoistableState), destination.push("<!--/$-->");
		flushedByteSize$1 += boundary.byteSize;
		hoistableState && hoistHoistables$1(hoistableState, boundary.contentState);
		segment = boundary.row;
		null !== segment && isEligibleForOutlining$1(request, boundary) && 0 === --segment.pendingTasks && finishSuspenseListRow$1(request, segment);
		request.renderState.generateStaticMarkup || destination.push("<!--$-->");
		segment = boundary.completedSegments;
		if (1 !== segment.length) throw Error("A previously unvisited boundary must have exactly one root segment. This is a bug in React.");
		flushSegment$1(request, destination, segment[0], hoistableState);
		request = request.renderState.generateStaticMarkup ? !0 : destination.push("<!--/$-->");
		return request;
	}
	function flushSegmentContainer$1(request, destination, segment, hoistableState) {
		writeStartSegment$1(destination, request.renderState, segment.parentFormatContext, segment.id);
		flushSegment$1(request, destination, segment, hoistableState);
		return writeEndSegment$1(destination, segment.parentFormatContext);
	}
	function flushCompletedBoundary$1(request, destination, boundary) {
		flushedByteSize$1 = boundary.byteSize;
		for (var completedSegments = boundary.completedSegments, i = 0; i < completedSegments.length; i++) flushPartiallyCompletedSegment$1(request, destination, boundary, completedSegments[i]);
		completedSegments.length = 0;
		completedSegments = boundary.row;
		null !== completedSegments && isEligibleForOutlining$1(request, boundary) && 0 === --completedSegments.pendingTasks && finishSuspenseListRow$1(request, completedSegments);
		writeHoistablesForBoundary$1(destination, boundary.contentState, request.renderState);
		completedSegments = request.resumableState;
		request = request.renderState;
		i = boundary.rootSegmentID;
		boundary = boundary.contentState;
		var requiresStyleInsertion = request.stylesToHoist;
		request.stylesToHoist = !1;
		destination.push(request.startInlineScript);
		destination.push(">");
		requiresStyleInsertion ? (0 === (completedSegments.instructions & 4) && (completedSegments.instructions |= 4, destination.push("$RX=function(b,c,d,e,f){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data=\"$!\",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),f&&(a.cstck=f),b._reactRetry&&b._reactRetry())};")), 0 === (completedSegments.instructions & 2) && (completedSegments.instructions |= 2, destination.push("$RB=[];$RV=function(a){$RT=performance.now();for(var b=0;b<a.length;b+=2){var c=a[b],e=a[b+1];null!==e.parentNode&&e.parentNode.removeChild(e);var f=c.parentNode;if(f){var g=c.previousSibling,h=0;do{if(c&&8===c.nodeType){var d=c.data;if(\"/$\"===d||\"/&\"===d)if(0===h)break;else h--;else\"$\"!==d&&\"$?\"!==d&&\"$~\"!==d&&\"$!\"!==d&&\"&\"!==d||h++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;e.firstChild;)f.insertBefore(e.firstChild,c);g.data=\"$\";g._reactRetry&&requestAnimationFrame(g._reactRetry)}}a.length=0};\n$RC=function(a,b){if(b=document.getElementById(b))(a=document.getElementById(a))?(a.previousSibling.data=\"$~\",$RB.push(a,b),2===$RB.length&&(\"number\"!==typeof $RT?requestAnimationFrame($RV.bind(null,$RB)):(a=performance.now(),setTimeout($RV.bind(null,$RB),2300>a&&2E3<a?2300-a:$RT+300-a)))):b.parentNode.removeChild(b)};")), 0 === (completedSegments.instructions & 8) ? (completedSegments.instructions |= 8, destination.push("$RM=new Map;$RR=function(n,w,p){function u(q){this._p=null;q()}for(var r=new Map,t=document,h,b,e=t.querySelectorAll(\"link[data-precedence],style[data-precedence]\"),v=[],k=0;b=e[k++];)\"not all\"===b.getAttribute(\"media\")?v.push(b):(\"LINK\"===b.tagName&&$RM.set(b.getAttribute(\"href\"),b),r.set(b.dataset.precedence,h=b));e=0;b=[];var l,a;for(k=!0;;){if(k){var f=p[e++];if(!f){k=!1;e=0;continue}var c=!1,m=0;var d=f[m++];if(a=$RM.get(d)){var g=a._p;c=!0}else{a=t.createElement(\"link\");a.href=d;a.rel=\n\"stylesheet\";for(a.dataset.precedence=l=f[m++];g=f[m++];)a.setAttribute(g,f[m++]);g=a._p=new Promise(function(q,x){a.onload=u.bind(a,q);a.onerror=u.bind(a,x)});$RM.set(d,a)}d=a.getAttribute(\"media\");!g||d&&!matchMedia(d).matches||b.push(g);if(c)continue}else{a=v[e++];if(!a)break;l=a.getAttribute(\"data-precedence\");a.removeAttribute(\"media\")}c=r.get(l)||h;c===h&&(h=a);r.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=t.head,c.insertBefore(a,c.firstChild))}if(p=document.getElementById(n))p.previousSibling.data=\n\"$~\";Promise.all(b).then($RC.bind(null,n,w),$RX.bind(null,n,\"CSS failed to load\"))};$RR(\"")) : destination.push("$RR(\"")) : (0 === (completedSegments.instructions & 2) && (completedSegments.instructions |= 2, destination.push("$RB=[];$RV=function(a){$RT=performance.now();for(var b=0;b<a.length;b+=2){var c=a[b],e=a[b+1];null!==e.parentNode&&e.parentNode.removeChild(e);var f=c.parentNode;if(f){var g=c.previousSibling,h=0;do{if(c&&8===c.nodeType){var d=c.data;if(\"/$\"===d||\"/&\"===d)if(0===h)break;else h--;else\"$\"!==d&&\"$?\"!==d&&\"$~\"!==d&&\"$!\"!==d&&\"&\"!==d||h++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;e.firstChild;)f.insertBefore(e.firstChild,c);g.data=\"$\";g._reactRetry&&requestAnimationFrame(g._reactRetry)}}a.length=0};\n$RC=function(a,b){if(b=document.getElementById(b))(a=document.getElementById(a))?(a.previousSibling.data=\"$~\",$RB.push(a,b),2===$RB.length&&(\"number\"!==typeof $RT?requestAnimationFrame($RV.bind(null,$RB)):(a=performance.now(),setTimeout($RV.bind(null,$RB),2300>a&&2E3<a?2300-a:$RT+300-a)))):b.parentNode.removeChild(b)};")), destination.push("$RC(\""));
		completedSegments = i.toString(16);
		destination.push(request.boundaryPrefix);
		destination.push(completedSegments);
		destination.push("\",\"");
		destination.push(request.segmentPrefix);
		destination.push(completedSegments);
		requiresStyleInsertion ? (destination.push("\","), writeStyleResourceDependenciesInJS$1(destination, boundary)) : destination.push("\"");
		boundary = destination.push(")<\/script>");
		return writeBootstrap$1(destination, request) && boundary;
	}
	function flushPartiallyCompletedSegment$1(request, destination, boundary, segment) {
		if (2 === segment.status) return !0;
		var hoistableState = boundary.contentState, segmentID = segment.id;
		if (-1 === segmentID) {
			if (-1 === (segment.id = boundary.rootSegmentID)) throw Error("A root segment ID must have been assigned by now. This is a bug in React.");
			return flushSegmentContainer$1(request, destination, segment, hoistableState);
		}
		if (segmentID === boundary.rootSegmentID) return flushSegmentContainer$1(request, destination, segment, hoistableState);
		flushSegmentContainer$1(request, destination, segment, hoistableState);
		boundary = request.resumableState;
		request = request.renderState;
		destination.push(request.startInlineScript);
		destination.push(">");
		0 === (boundary.instructions & 1) ? (boundary.instructions |= 1, destination.push("$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};$RS(\"")) : destination.push("$RS(\"");
		destination.push(request.segmentPrefix);
		segmentID = segmentID.toString(16);
		destination.push(segmentID);
		destination.push("\",\"");
		destination.push(request.placeholderPrefix);
		destination.push(segmentID);
		destination = destination.push("\")<\/script>");
		return destination;
	}
	var flushingPartialBoundaries$1 = !1;
	function flushCompletedQueues$1(request, destination) {
		try {
			if (!(0 < request.pendingRootTasks)) {
				var i, completedRootSegment = request.completedRootSegment;
				if (null !== completedRootSegment) {
					if (5 === completedRootSegment.status) return;
					var completedPreambleSegments = request.completedPreambleSegments;
					if (null === completedPreambleSegments) return;
					flushedByteSize$1 = request.byteSize;
					var resumableState = request.resumableState, renderState = request.renderState, preamble = renderState.preamble, htmlChunks = preamble.htmlChunks, headChunks = preamble.headChunks, i$jscomp$0;
					if (htmlChunks) {
						for (i$jscomp$0 = 0; i$jscomp$0 < htmlChunks.length; i$jscomp$0++) destination.push(htmlChunks[i$jscomp$0]);
						if (headChunks) for (i$jscomp$0 = 0; i$jscomp$0 < headChunks.length; i$jscomp$0++) destination.push(headChunks[i$jscomp$0]);
						else {
							var chunk = startChunkForTag$1("head");
							destination.push(chunk);
							destination.push(">");
						}
					} else if (headChunks) for (i$jscomp$0 = 0; i$jscomp$0 < headChunks.length; i$jscomp$0++) destination.push(headChunks[i$jscomp$0]);
					var charsetChunks = renderState.charsetChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < charsetChunks.length; i$jscomp$0++) destination.push(charsetChunks[i$jscomp$0]);
					charsetChunks.length = 0;
					renderState.preconnects.forEach(flushResource$1, destination);
					renderState.preconnects.clear();
					var viewportChunks = renderState.viewportChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < viewportChunks.length; i$jscomp$0++) destination.push(viewportChunks[i$jscomp$0]);
					viewportChunks.length = 0;
					renderState.fontPreloads.forEach(flushResource$1, destination);
					renderState.fontPreloads.clear();
					renderState.highImagePreloads.forEach(flushResource$1, destination);
					renderState.highImagePreloads.clear();
					currentlyFlushingRenderState$1 = renderState;
					renderState.styles.forEach(flushStylesInPreamble$1, destination);
					currentlyFlushingRenderState$1 = null;
					var importMapChunks = renderState.importMapChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < importMapChunks.length; i$jscomp$0++) destination.push(importMapChunks[i$jscomp$0]);
					importMapChunks.length = 0;
					renderState.bootstrapScripts.forEach(flushResource$1, destination);
					renderState.scripts.forEach(flushResource$1, destination);
					renderState.scripts.clear();
					renderState.bulkPreloads.forEach(flushResource$1, destination);
					renderState.bulkPreloads.clear();
					resumableState.instructions |= 32;
					var hoistableChunks = renderState.hoistableChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < hoistableChunks.length; i$jscomp$0++) destination.push(hoistableChunks[i$jscomp$0]);
					for (resumableState = hoistableChunks.length = 0; resumableState < completedPreambleSegments.length; resumableState++) {
						var segments = completedPreambleSegments[resumableState];
						for (renderState = 0; renderState < segments.length; renderState++) flushSegment$1(request, destination, segments[renderState], null);
					}
					var preamble$jscomp$0 = request.renderState.preamble, headChunks$jscomp$0 = preamble$jscomp$0.headChunks;
					if (preamble$jscomp$0.htmlChunks || headChunks$jscomp$0) {
						var chunk$jscomp$0 = endChunkForTag$1("head");
						destination.push(chunk$jscomp$0);
					}
					var bodyChunks = preamble$jscomp$0.bodyChunks;
					if (bodyChunks) for (completedPreambleSegments = 0; completedPreambleSegments < bodyChunks.length; completedPreambleSegments++) destination.push(bodyChunks[completedPreambleSegments]);
					flushSegment$1(request, destination, completedRootSegment, null);
					request.completedRootSegment = null;
					var renderState$jscomp$0 = request.renderState;
					if (0 !== request.allPendingTasks || 0 !== request.clientRenderedBoundaries.length || 0 !== request.completedBoundaries.length || null !== request.trackedPostpones && (0 !== request.trackedPostpones.rootNodes.length || null !== request.trackedPostpones.rootSlots)) {
						var resumableState$jscomp$0 = request.resumableState;
						if (0 === (resumableState$jscomp$0.instructions & 64)) {
							resumableState$jscomp$0.instructions |= 64;
							destination.push(renderState$jscomp$0.startInlineScript);
							if (0 === (resumableState$jscomp$0.instructions & 32)) {
								resumableState$jscomp$0.instructions |= 32;
								var shellId = "_" + resumableState$jscomp$0.idPrefix + "R_";
								destination.push(" id=\"");
								var chunk$jscomp$1 = escapeTextForBrowser$1(shellId);
								destination.push(chunk$jscomp$1);
								destination.push("\"");
							}
							destination.push(">");
							destination.push("requestAnimationFrame(function(){$RT=performance.now()});");
							destination.push("<\/script>");
						}
					}
					writeBootstrap$1(destination, renderState$jscomp$0);
				}
				var renderState$jscomp$1 = request.renderState;
				completedRootSegment = 0;
				var viewportChunks$jscomp$0 = renderState$jscomp$1.viewportChunks;
				for (completedRootSegment = 0; completedRootSegment < viewportChunks$jscomp$0.length; completedRootSegment++) destination.push(viewportChunks$jscomp$0[completedRootSegment]);
				viewportChunks$jscomp$0.length = 0;
				renderState$jscomp$1.preconnects.forEach(flushResource$1, destination);
				renderState$jscomp$1.preconnects.clear();
				renderState$jscomp$1.fontPreloads.forEach(flushResource$1, destination);
				renderState$jscomp$1.fontPreloads.clear();
				renderState$jscomp$1.highImagePreloads.forEach(flushResource$1, destination);
				renderState$jscomp$1.highImagePreloads.clear();
				renderState$jscomp$1.styles.forEach(preloadLateStyles$1, destination);
				renderState$jscomp$1.scripts.forEach(flushResource$1, destination);
				renderState$jscomp$1.scripts.clear();
				renderState$jscomp$1.bulkPreloads.forEach(flushResource$1, destination);
				renderState$jscomp$1.bulkPreloads.clear();
				var hoistableChunks$jscomp$0 = renderState$jscomp$1.hoistableChunks;
				for (completedRootSegment = 0; completedRootSegment < hoistableChunks$jscomp$0.length; completedRootSegment++) destination.push(hoistableChunks$jscomp$0[completedRootSegment]);
				hoistableChunks$jscomp$0.length = 0;
				var clientRenderedBoundaries = request.clientRenderedBoundaries;
				for (i = 0; i < clientRenderedBoundaries.length; i++) {
					var boundary = clientRenderedBoundaries[i];
					renderState$jscomp$1 = destination;
					var resumableState$jscomp$1 = request.resumableState, renderState$jscomp$2 = request.renderState, id = boundary.rootSegmentID, errorDigest = boundary.errorDigest;
					renderState$jscomp$1.push(renderState$jscomp$2.startInlineScript);
					renderState$jscomp$1.push(">");
					0 === (resumableState$jscomp$1.instructions & 4) ? (resumableState$jscomp$1.instructions |= 4, renderState$jscomp$1.push("$RX=function(b,c,d,e,f){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data=\"$!\",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),f&&(a.cstck=f),b._reactRetry&&b._reactRetry())};;$RX(\"")) : renderState$jscomp$1.push("$RX(\"");
					renderState$jscomp$1.push(renderState$jscomp$2.boundaryPrefix);
					var chunk$jscomp$2 = id.toString(16);
					renderState$jscomp$1.push(chunk$jscomp$2);
					renderState$jscomp$1.push("\"");
					if (errorDigest) {
						renderState$jscomp$1.push(",");
						var chunk$jscomp$3 = escapeJSStringsForInstructionScripts$1(errorDigest || "");
						renderState$jscomp$1.push(chunk$jscomp$3);
					}
					var JSCompiler_inline_result = renderState$jscomp$1.push(")<\/script>");
					if (!JSCompiler_inline_result) {
						request.destination = null;
						i++;
						clientRenderedBoundaries.splice(0, i);
						return;
					}
				}
				clientRenderedBoundaries.splice(0, i);
				var completedBoundaries = request.completedBoundaries;
				for (i = 0; i < completedBoundaries.length; i++) if (!flushCompletedBoundary$1(request, destination, completedBoundaries[i])) {
					request.destination = null;
					i++;
					completedBoundaries.splice(0, i);
					return;
				}
				completedBoundaries.splice(0, i);
				flushingPartialBoundaries$1 = !0;
				var partialBoundaries = request.partialBoundaries;
				for (i = 0; i < partialBoundaries.length; i++) {
					var boundary$69 = partialBoundaries[i];
					a: {
						clientRenderedBoundaries = request;
						boundary = destination;
						flushedByteSize$1 = boundary$69.byteSize;
						var completedSegments = boundary$69.completedSegments;
						for (JSCompiler_inline_result = 0; JSCompiler_inline_result < completedSegments.length; JSCompiler_inline_result++) if (!flushPartiallyCompletedSegment$1(clientRenderedBoundaries, boundary, boundary$69, completedSegments[JSCompiler_inline_result])) {
							JSCompiler_inline_result++;
							completedSegments.splice(0, JSCompiler_inline_result);
							var JSCompiler_inline_result$jscomp$0 = !1;
							break a;
						}
						completedSegments.splice(0, JSCompiler_inline_result);
						var row = boundary$69.row;
						null !== row && row.together && 1 === boundary$69.pendingTasks && (1 === row.pendingTasks ? unblockSuspenseListRow$1(clientRenderedBoundaries, row, row.hoistables) : row.pendingTasks--);
						JSCompiler_inline_result$jscomp$0 = writeHoistablesForBoundary$1(boundary, boundary$69.contentState, clientRenderedBoundaries.renderState);
					}
					if (!JSCompiler_inline_result$jscomp$0) {
						request.destination = null;
						i++;
						partialBoundaries.splice(0, i);
						return;
					}
				}
				partialBoundaries.splice(0, i);
				flushingPartialBoundaries$1 = !1;
				var largeBoundaries = request.completedBoundaries;
				for (i = 0; i < largeBoundaries.length; i++) if (!flushCompletedBoundary$1(request, destination, largeBoundaries[i])) {
					request.destination = null;
					i++;
					largeBoundaries.splice(0, i);
					return;
				}
				largeBoundaries.splice(0, i);
			}
		} finally {
			flushingPartialBoundaries$1 = !1, 0 === request.allPendingTasks && 0 === request.clientRenderedBoundaries.length && 0 === request.completedBoundaries.length && (request.flushScheduled = !1, i = request.resumableState, i.hasBody && (partialBoundaries = endChunkForTag$1("body"), destination.push(partialBoundaries)), i.hasHtml && (i = endChunkForTag$1("html"), destination.push(i)), request.status = 14, destination.push(null), request.destination = null);
		}
	}
	function enqueueFlush$1(request) {
		if (!1 === request.flushScheduled && 0 === request.pingedTasks.length && null !== request.destination) {
			request.flushScheduled = !0;
			var destination = request.destination;
			destination ? flushCompletedQueues$1(request, destination) : request.flushScheduled = !1;
		}
	}
	function startFlowing$1(request, destination) {
		if (13 === request.status) request.status = 14, destination.destroy(request.fatalError);
		else if (14 !== request.status && null === request.destination) {
			request.destination = destination;
			try {
				flushCompletedQueues$1(request, destination);
			} catch (error) {
				logRecoverableError$1(request, error, {}), fatalError$1(request, error);
			}
		}
	}
	function abort$1(request, reason) {
		if (11 === request.status || 10 === request.status) request.status = 12;
		try {
			var abortableTasks = request.abortableTasks;
			if (0 < abortableTasks.size) {
				var error = void 0 === reason ? Error("The render was aborted by the server without a reason.") : "object" === typeof reason && null !== reason && "function" === typeof reason.then ? Error("The render was aborted by the server with a promise.") : reason;
				request.fatalError = error;
				abortableTasks.forEach(function(task) {
					return abortTask$1(task, request, error);
				});
				abortableTasks.clear();
			}
			null !== request.destination && flushCompletedQueues$1(request, request.destination);
		} catch (error$71) {
			logRecoverableError$1(request, error$71, {}), fatalError$1(request, error$71);
		}
	}
	function addToReplayParent$1(node, parentKeyPath, trackedPostpones) {
		if (null === parentKeyPath) trackedPostpones.rootNodes.push(node);
		else {
			var workingMap = trackedPostpones.workingMap, parentNode = workingMap.get(parentKeyPath);
			void 0 === parentNode && (parentNode = [
				parentKeyPath[1],
				parentKeyPath[2],
				[],
				null
			], workingMap.set(parentKeyPath, parentNode), addToReplayParent$1(parentNode, parentKeyPath[0], trackedPostpones));
			parentNode[2].push(node);
		}
	}
	function onError() {}
	function renderToStringImpl(children, options, generateStaticMarkup, abortReason) {
		var didFatal = !1, fatalError$2 = null, result = "", readyToStream = !1;
		options = createResumableState$1(options ? options.identifierPrefix : void 0);
		children = createRequest$1(children, options, createRenderState$1(options, generateStaticMarkup), createFormatContext$1(0, null, 0, null), Infinity, onError, void 0, function() {
			readyToStream = !0;
		}, void 0, void 0, void 0);
		children.flushScheduled = null !== children.destination;
		performWork$1(children);
		10 === children.status && (children.status = 11);
		null === children.trackedPostpones && safelyEmitEarlyPreloads$1(children, 0 === children.pendingRootTasks);
		abort$1(children, abortReason);
		startFlowing$1(children, {
			push: function(chunk) {
				null !== chunk && (result += chunk);
				return !0;
			},
			destroy: function(error) {
				didFatal = !0;
				fatalError$2 = error;
			}
		});
		if (didFatal && fatalError$2 !== abortReason) throw fatalError$2;
		if (!readyToStream) throw Error("A component suspended while responding to synchronous input. This will cause the UI to be replaced with a loading indicator. To fix, updates that suspend should be wrapped with startTransition.");
		return result;
	}
	exports.renderToStaticMarkup = function(children, options) {
		return renderToStringImpl(children, options, !0, "The server used \"renderToStaticMarkup\" which does not support Suspense. If you intended to have the server wait for the suspended component please switch to \"renderToPipeableStream\" which supports Suspense on the server");
	};
	exports.renderToString = function(children, options) {
		return renderToStringImpl(children, options, !1, "The server used \"renderToString\" which does not support Suspense. If you intended for this Suspense boundary to render the fallback content on the server consider throwing an Error somewhere within the Suspense boundary. If you intended to have the server wait for the suspended component please switch to \"renderToPipeableStream\" which supports Suspense on the server");
	};
	exports.version = "19.2.8";
}));
/**
* @license React
* react-dom-server.node.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_dom_server_node_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var util = __require("util"), crypto$1 = __require("crypto"), async_hooks = __require("async_hooks"), React = require_react(), ReactDOM = require_react_dom(), stream = __require("stream"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_SCOPE_TYPE = Symbol.for("react.scope"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"), REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	function getIteratorFn(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var isArrayImpl = Array.isArray, scheduleMicrotask = queueMicrotask;
	function flushBuffered(destination) {
		"function" === typeof destination.flush && destination.flush();
	}
	var currentView = null, writtenBytes = 0, destinationHasCapacity$1 = !0;
	function writeChunk(destination, chunk) {
		if ("string" === typeof chunk) {
			if (0 !== chunk.length) if (2048 < 3 * chunk.length) 0 < writtenBytes && (writeToDestination(destination, currentView.subarray(0, writtenBytes)), currentView = new Uint8Array(2048), writtenBytes = 0), writeToDestination(destination, chunk);
			else {
				var target = currentView;
				0 < writtenBytes && (target = currentView.subarray(writtenBytes));
				target = textEncoder$2.encodeInto(chunk, target);
				var read = target.read;
				writtenBytes += target.written;
				read < chunk.length && (writeToDestination(destination, currentView.subarray(0, writtenBytes)), currentView = new Uint8Array(2048), writtenBytes = textEncoder$2.encodeInto(chunk.slice(read), currentView).written);
				2048 === writtenBytes && (writeToDestination(destination, currentView), currentView = new Uint8Array(2048), writtenBytes = 0);
			}
		} else 0 !== chunk.byteLength && (2048 < chunk.byteLength ? (0 < writtenBytes && (writeToDestination(destination, currentView.subarray(0, writtenBytes)), currentView = new Uint8Array(2048), writtenBytes = 0), writeToDestination(destination, chunk)) : (target = currentView.length - writtenBytes, target < chunk.byteLength && (0 === target ? writeToDestination(destination, currentView) : (currentView.set(chunk.subarray(0, target), writtenBytes), writtenBytes += target, writeToDestination(destination, currentView), chunk = chunk.subarray(target)), currentView = new Uint8Array(2048), writtenBytes = 0), currentView.set(chunk, writtenBytes), writtenBytes += chunk.byteLength, 2048 === writtenBytes && (writeToDestination(destination, currentView), currentView = new Uint8Array(2048), writtenBytes = 0)));
	}
	function writeToDestination(destination, view) {
		destination = destination.write(view);
		destinationHasCapacity$1 = destinationHasCapacity$1 && destination;
	}
	function writeChunkAndReturn(destination, chunk) {
		writeChunk(destination, chunk);
		return destinationHasCapacity$1;
	}
	function completeWriting(destination) {
		currentView && 0 < writtenBytes && destination.write(currentView.subarray(0, writtenBytes));
		currentView = null;
		writtenBytes = 0;
		destinationHasCapacity$1 = !0;
	}
	var textEncoder$2 = new util.TextEncoder();
	function stringToPrecomputedChunk(content) {
		return textEncoder$2.encode(content);
	}
	function byteLengthOfChunk(chunk) {
		return "string" === typeof chunk ? Buffer.byteLength(chunk, "utf8") : chunk.byteLength;
	}
	var assign = Object.assign, hasOwnProperty = Object.prototype.hasOwnProperty, VALID_ATTRIBUTE_NAME_REGEX = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), illegalAttributeNameCache = {}, validatedAttributeNameCache = {};
	function isAttributeNameSafe(attributeName) {
		if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) return !0;
		if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) return !1;
		if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) return validatedAttributeNameCache[attributeName] = !0;
		illegalAttributeNameCache[attributeName] = !0;
		return !1;
	}
	var unitlessNumbers = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" ")), aliases = new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), matchHtmlRegExp = /["'&<>]/;
	function escapeTextForBrowser(text) {
		if ("boolean" === typeof text || "number" === typeof text || "bigint" === typeof text) return "" + text;
		text = "" + text;
		var match = matchHtmlRegExp.exec(text);
		if (match) {
			var html = "", index, lastIndex = 0;
			for (index = match.index; index < text.length; index++) {
				switch (text.charCodeAt(index)) {
					case 34:
						match = "&quot;";
						break;
					case 38:
						match = "&amp;";
						break;
					case 39:
						match = "&#x27;";
						break;
					case 60:
						match = "&lt;";
						break;
					case 62:
						match = "&gt;";
						break;
					default: continue;
				}
				lastIndex !== index && (html += text.slice(lastIndex, index));
				lastIndex = index + 1;
				html += match;
			}
			text = lastIndex !== index ? html + text.slice(lastIndex, index) : html;
		}
		return text;
	}
	var uppercasePattern = /([A-Z])/g, msPattern = /^ms-/, isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function sanitizeURL(url) {
		return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
	}
	var ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ReactDOMSharedInternals = ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, sharedNotPendingObject = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, previousDispatcher = ReactDOMSharedInternals.d;
	ReactDOMSharedInternals.d = {
		f: previousDispatcher.f,
		r: previousDispatcher.r,
		D: prefetchDNS,
		C: preconnect,
		L: preload,
		m: preloadModule,
		X: preinitScript,
		S: preinitStyle,
		M: preinitModuleScript
	};
	var PRELOAD_NO_CREDS = [], currentlyFlushingRenderState = null;
	stringToPrecomputedChunk("\"></template>");
	var startInlineScript = stringToPrecomputedChunk("<script"), endInlineScript = stringToPrecomputedChunk("<\/script>"), startScriptSrc = stringToPrecomputedChunk("<script src=\""), startModuleSrc = stringToPrecomputedChunk("<script type=\"module\" src=\""), scriptNonce = stringToPrecomputedChunk(" nonce=\""), scriptIntegirty = stringToPrecomputedChunk(" integrity=\""), scriptCrossOrigin = stringToPrecomputedChunk(" crossorigin=\""), endAsyncScript = stringToPrecomputedChunk(" async=\"\"><\/script>"), startInlineStyle = stringToPrecomputedChunk("<style"), scriptRegex = /(<\/|<)(s)(cript)/gi;
	function scriptReplacer(match, prefix$2, s$1, suffix$2) {
		return "" + prefix$2 + ("s" === s$1 ? "\\u0073" : "\\u0053") + suffix$2;
	}
	var importMapScriptStart = stringToPrecomputedChunk("<script type=\"importmap\">"), importMapScriptEnd = stringToPrecomputedChunk("<\/script>");
	function createRenderState(resumableState, nonce, externalRuntimeConfig, importMap, onHeaders, maxHeadersLength) {
		externalRuntimeConfig = "string" === typeof nonce ? nonce : nonce && nonce.script;
		var inlineScriptWithNonce = void 0 === externalRuntimeConfig ? startInlineScript : stringToPrecomputedChunk("<script nonce=\"" + escapeTextForBrowser(externalRuntimeConfig) + "\""), nonceStyle = "string" === typeof nonce ? void 0 : nonce && nonce.style, inlineStyleWithNonce = void 0 === nonceStyle ? startInlineStyle : stringToPrecomputedChunk("<style nonce=\"" + escapeTextForBrowser(nonceStyle) + "\""), idPrefix = resumableState.idPrefix, bootstrapChunks = [], bootstrapScriptContent = resumableState.bootstrapScriptContent, bootstrapScripts = resumableState.bootstrapScripts, bootstrapModules = resumableState.bootstrapModules;
		void 0 !== bootstrapScriptContent && (bootstrapChunks.push(inlineScriptWithNonce), pushCompletedShellIdAttribute(bootstrapChunks, resumableState), bootstrapChunks.push(endOfStartTag, ("" + bootstrapScriptContent).replace(scriptRegex, scriptReplacer), endInlineScript));
		bootstrapScriptContent = [];
		void 0 !== importMap && (bootstrapScriptContent.push(importMapScriptStart), bootstrapScriptContent.push(("" + JSON.stringify(importMap)).replace(scriptRegex, scriptReplacer)), bootstrapScriptContent.push(importMapScriptEnd));
		importMap = onHeaders ? {
			preconnects: "",
			fontPreloads: "",
			highImagePreloads: "",
			remainingCapacity: 2 + ("number" === typeof maxHeadersLength ? maxHeadersLength : 2e3)
		} : null;
		onHeaders = {
			placeholderPrefix: stringToPrecomputedChunk(idPrefix + "P:"),
			segmentPrefix: stringToPrecomputedChunk(idPrefix + "S:"),
			boundaryPrefix: stringToPrecomputedChunk(idPrefix + "B:"),
			startInlineScript: inlineScriptWithNonce,
			startInlineStyle: inlineStyleWithNonce,
			preamble: createPreambleState(),
			externalRuntimeScript: null,
			bootstrapChunks,
			importMapChunks: bootstrapScriptContent,
			onHeaders,
			headers: importMap,
			resets: {
				font: {},
				dns: {},
				connect: {
					default: {},
					anonymous: {},
					credentials: {}
				},
				image: {},
				style: {}
			},
			charsetChunks: [],
			viewportChunks: [],
			hoistableChunks: [],
			preconnects: /* @__PURE__ */ new Set(),
			fontPreloads: /* @__PURE__ */ new Set(),
			highImagePreloads: /* @__PURE__ */ new Set(),
			styles: /* @__PURE__ */ new Map(),
			bootstrapScripts: /* @__PURE__ */ new Set(),
			scripts: /* @__PURE__ */ new Set(),
			bulkPreloads: /* @__PURE__ */ new Set(),
			preloads: {
				images: /* @__PURE__ */ new Map(),
				stylesheets: /* @__PURE__ */ new Map(),
				scripts: /* @__PURE__ */ new Map(),
				moduleScripts: /* @__PURE__ */ new Map()
			},
			nonce: {
				script: externalRuntimeConfig,
				style: nonceStyle
			},
			hoistableState: null,
			stylesToHoist: !1
		};
		if (void 0 !== bootstrapScripts) for (importMap = 0; importMap < bootstrapScripts.length; importMap++) idPrefix = bootstrapScripts[importMap], nonceStyle = inlineScriptWithNonce = void 0, inlineStyleWithNonce = {
			rel: "preload",
			as: "script",
			fetchPriority: "low",
			nonce
		}, "string" === typeof idPrefix ? inlineStyleWithNonce.href = maxHeadersLength = idPrefix : (inlineStyleWithNonce.href = maxHeadersLength = idPrefix.src, inlineStyleWithNonce.integrity = nonceStyle = "string" === typeof idPrefix.integrity ? idPrefix.integrity : void 0, inlineStyleWithNonce.crossOrigin = inlineScriptWithNonce = "string" === typeof idPrefix || null == idPrefix.crossOrigin ? void 0 : "use-credentials" === idPrefix.crossOrigin ? "use-credentials" : ""), idPrefix = resumableState, bootstrapScriptContent = maxHeadersLength, idPrefix.scriptResources[bootstrapScriptContent] = null, idPrefix.moduleScriptResources[bootstrapScriptContent] = null, idPrefix = [], pushLinkImpl(idPrefix, inlineStyleWithNonce), onHeaders.bootstrapScripts.add(idPrefix), bootstrapChunks.push(startScriptSrc, escapeTextForBrowser(maxHeadersLength), attributeEnd), externalRuntimeConfig && bootstrapChunks.push(scriptNonce, escapeTextForBrowser(externalRuntimeConfig), attributeEnd), "string" === typeof nonceStyle && bootstrapChunks.push(scriptIntegirty, escapeTextForBrowser(nonceStyle), attributeEnd), "string" === typeof inlineScriptWithNonce && bootstrapChunks.push(scriptCrossOrigin, escapeTextForBrowser(inlineScriptWithNonce), attributeEnd), pushCompletedShellIdAttribute(bootstrapChunks, resumableState), bootstrapChunks.push(endAsyncScript);
		if (void 0 !== bootstrapModules) for (nonce = 0; nonce < bootstrapModules.length; nonce++) nonceStyle = bootstrapModules[nonce], maxHeadersLength = importMap = void 0, inlineScriptWithNonce = {
			rel: "modulepreload",
			fetchPriority: "low",
			nonce: externalRuntimeConfig
		}, "string" === typeof nonceStyle ? inlineScriptWithNonce.href = bootstrapScripts = nonceStyle : (inlineScriptWithNonce.href = bootstrapScripts = nonceStyle.src, inlineScriptWithNonce.integrity = maxHeadersLength = "string" === typeof nonceStyle.integrity ? nonceStyle.integrity : void 0, inlineScriptWithNonce.crossOrigin = importMap = "string" === typeof nonceStyle || null == nonceStyle.crossOrigin ? void 0 : "use-credentials" === nonceStyle.crossOrigin ? "use-credentials" : ""), nonceStyle = resumableState, inlineStyleWithNonce = bootstrapScripts, nonceStyle.scriptResources[inlineStyleWithNonce] = null, nonceStyle.moduleScriptResources[inlineStyleWithNonce] = null, nonceStyle = [], pushLinkImpl(nonceStyle, inlineScriptWithNonce), onHeaders.bootstrapScripts.add(nonceStyle), bootstrapChunks.push(startModuleSrc, escapeTextForBrowser(bootstrapScripts), attributeEnd), externalRuntimeConfig && bootstrapChunks.push(scriptNonce, escapeTextForBrowser(externalRuntimeConfig), attributeEnd), "string" === typeof maxHeadersLength && bootstrapChunks.push(scriptIntegirty, escapeTextForBrowser(maxHeadersLength), attributeEnd), "string" === typeof importMap && bootstrapChunks.push(scriptCrossOrigin, escapeTextForBrowser(importMap), attributeEnd), pushCompletedShellIdAttribute(bootstrapChunks, resumableState), bootstrapChunks.push(endAsyncScript);
		return onHeaders;
	}
	function createResumableState(identifierPrefix, externalRuntimeConfig, bootstrapScriptContent, bootstrapScripts, bootstrapModules) {
		return {
			idPrefix: void 0 === identifierPrefix ? "" : identifierPrefix,
			nextFormID: 0,
			streamingFormat: 0,
			bootstrapScriptContent,
			bootstrapScripts,
			bootstrapModules,
			instructions: 0,
			hasBody: !1,
			hasHtml: !1,
			unknownResources: {},
			dnsResources: {},
			connectResources: {
				default: {},
				anonymous: {},
				credentials: {}
			},
			imageResources: {},
			styleResources: {},
			scriptResources: {},
			moduleUnknownResources: {},
			moduleScriptResources: {}
		};
	}
	function createPreambleState() {
		return {
			htmlChunks: null,
			headChunks: null,
			bodyChunks: null
		};
	}
	function createFormatContext(insertionMode, selectedValue, tagScope, viewTransition) {
		return {
			insertionMode,
			selectedValue,
			tagScope,
			viewTransition
		};
	}
	function createRootFormatContext(namespaceURI) {
		return createFormatContext("http://www.w3.org/2000/svg" === namespaceURI ? 4 : "http://www.w3.org/1998/Math/MathML" === namespaceURI ? 5 : 0, null, 0, null);
	}
	function getChildFormatContext(parentContext, type, props) {
		var subtreeScope = parentContext.tagScope & -25;
		switch (type) {
			case "noscript": return createFormatContext(2, null, subtreeScope | 1, null);
			case "select": return createFormatContext(2, null != props.value ? props.value : props.defaultValue, subtreeScope, null);
			case "svg": return createFormatContext(4, null, subtreeScope, null);
			case "picture": return createFormatContext(2, null, subtreeScope | 2, null);
			case "math": return createFormatContext(5, null, subtreeScope, null);
			case "foreignObject": return createFormatContext(2, null, subtreeScope, null);
			case "table": return createFormatContext(6, null, subtreeScope, null);
			case "thead":
			case "tbody":
			case "tfoot": return createFormatContext(7, null, subtreeScope, null);
			case "colgroup": return createFormatContext(9, null, subtreeScope, null);
			case "tr": return createFormatContext(8, null, subtreeScope, null);
			case "head":
				if (2 > parentContext.insertionMode) return createFormatContext(3, null, subtreeScope, null);
				break;
			case "html": if (0 === parentContext.insertionMode) return createFormatContext(1, null, subtreeScope, null);
		}
		return 6 <= parentContext.insertionMode || 2 > parentContext.insertionMode ? createFormatContext(2, null, subtreeScope, null) : parentContext.tagScope !== subtreeScope ? createFormatContext(parentContext.insertionMode, parentContext.selectedValue, subtreeScope, null) : parentContext;
	}
	function getSuspenseViewTransition(parentViewTransition) {
		return null === parentViewTransition ? null : {
			update: parentViewTransition.update,
			enter: "none",
			exit: "none",
			share: parentViewTransition.update,
			name: parentViewTransition.autoName,
			autoName: parentViewTransition.autoName,
			nameIdx: 0
		};
	}
	function getSuspenseFallbackFormatContext(resumableState, parentContext) {
		parentContext.tagScope & 32 && (resumableState.instructions |= 128);
		return createFormatContext(parentContext.insertionMode, parentContext.selectedValue, parentContext.tagScope | 12, getSuspenseViewTransition(parentContext.viewTransition));
	}
	function getSuspenseContentFormatContext(resumableState, parentContext) {
		resumableState = getSuspenseViewTransition(parentContext.viewTransition);
		var subtreeScope = parentContext.tagScope | 16;
		null !== resumableState && "none" !== resumableState.share && (subtreeScope |= 64);
		return createFormatContext(parentContext.insertionMode, parentContext.selectedValue, subtreeScope, resumableState);
	}
	var textSeparator = stringToPrecomputedChunk("<!-- -->");
	function pushTextInstance(target, text, renderState, textEmbedded) {
		if ("" === text) return textEmbedded;
		textEmbedded && target.push(textSeparator);
		target.push(escapeTextForBrowser(text));
		return !0;
	}
	var styleNameCache = /* @__PURE__ */ new Map(), styleAttributeStart = stringToPrecomputedChunk(" style=\""), styleAssign = stringToPrecomputedChunk(":"), styleSeparator = stringToPrecomputedChunk(";");
	function pushStyleAttribute(target, style) {
		if ("object" !== typeof style) throw Error("The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.");
		var isFirst = !0, styleName;
		for (styleName in style) if (hasOwnProperty.call(style, styleName)) {
			var styleValue = style[styleName];
			if (null != styleValue && "boolean" !== typeof styleValue && "" !== styleValue) {
				if (0 === styleName.indexOf("--")) {
					var nameChunk = escapeTextForBrowser(styleName);
					styleValue = escapeTextForBrowser(("" + styleValue).trim());
				} else nameChunk = styleNameCache.get(styleName), void 0 === nameChunk && (nameChunk = stringToPrecomputedChunk(escapeTextForBrowser(styleName.replace(uppercasePattern, "-$1").toLowerCase().replace(msPattern, "-ms-"))), styleNameCache.set(styleName, nameChunk)), styleValue = "number" === typeof styleValue ? 0 === styleValue || unitlessNumbers.has(styleName) ? "" + styleValue : styleValue + "px" : escapeTextForBrowser(("" + styleValue).trim());
				isFirst ? (isFirst = !1, target.push(styleAttributeStart, nameChunk, styleAssign, styleValue)) : target.push(styleSeparator, nameChunk, styleAssign, styleValue);
			}
		}
		isFirst || target.push(attributeEnd);
	}
	var attributeSeparator = stringToPrecomputedChunk(" "), attributeAssign = stringToPrecomputedChunk("=\""), attributeEnd = stringToPrecomputedChunk("\""), attributeEmptyString = stringToPrecomputedChunk("=\"\"");
	function pushBooleanAttribute(target, name, value) {
		value && "function" !== typeof value && "symbol" !== typeof value && target.push(attributeSeparator, name, attributeEmptyString);
	}
	function pushStringAttribute(target, name, value) {
		"function" !== typeof value && "symbol" !== typeof value && "boolean" !== typeof value && target.push(attributeSeparator, name, attributeAssign, escapeTextForBrowser(value), attributeEnd);
	}
	var actionJavaScriptURL = stringToPrecomputedChunk(escapeTextForBrowser("javascript:throw new Error('React form unexpectedly submitted.')")), startHiddenInputChunk = stringToPrecomputedChunk("<input type=\"hidden\"");
	function pushAdditionalFormField(value, key) {
		this.push(startHiddenInputChunk);
		validateAdditionalFormField(value);
		pushStringAttribute(this, "name", key);
		pushStringAttribute(this, "value", value);
		this.push(endOfStartTagSelfClosing);
	}
	function validateAdditionalFormField(value) {
		if ("string" !== typeof value) throw Error("File/Blob fields are not yet supported in progressive forms. Will fallback to client hydration.");
	}
	function getCustomFormFields(resumableState, formAction) {
		if ("function" === typeof formAction.$$FORM_ACTION) {
			var id = resumableState.nextFormID++;
			resumableState = resumableState.idPrefix + id;
			try {
				var customFields = formAction.$$FORM_ACTION(resumableState);
				if (customFields) customFields.data?.forEach(validateAdditionalFormField);
				return customFields;
			} catch (x) {
				if ("object" === typeof x && null !== x && "function" === typeof x.then) throw x;
			}
		}
		return null;
	}
	function pushFormActionAttribute(target, resumableState, renderState, formAction, formEncType, formMethod, formTarget, name) {
		var formData = null;
		if ("function" === typeof formAction) {
			var customFields = getCustomFormFields(resumableState, formAction);
			null !== customFields ? (name = customFields.name, formAction = customFields.action || "", formEncType = customFields.encType, formMethod = customFields.method, formTarget = customFields.target, formData = customFields.data) : (target.push(attributeSeparator, "formAction", attributeAssign, actionJavaScriptURL, attributeEnd), formTarget = formMethod = formEncType = formAction = name = null, injectFormReplayingRuntime(resumableState, renderState));
		}
		null != name && pushAttribute(target, "name", name);
		null != formAction && pushAttribute(target, "formAction", formAction);
		null != formEncType && pushAttribute(target, "formEncType", formEncType);
		null != formMethod && pushAttribute(target, "formMethod", formMethod);
		null != formTarget && pushAttribute(target, "formTarget", formTarget);
		return formData;
	}
	function pushAttribute(target, name, value) {
		switch (name) {
			case "className":
				pushStringAttribute(target, "class", value);
				break;
			case "tabIndex":
				pushStringAttribute(target, "tabindex", value);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				pushStringAttribute(target, name, value);
				break;
			case "style":
				pushStyleAttribute(target, value);
				break;
			case "src":
			case "href": if ("" === value) break;
			case "action":
			case "formAction":
				if (null == value || "function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) break;
				value = sanitizeURL("" + value);
				target.push(attributeSeparator, name, attributeAssign, escapeTextForBrowser(value), attributeEnd);
				break;
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "ref": break;
			case "autoFocus":
			case "multiple":
			case "muted":
				pushBooleanAttribute(target, name.toLowerCase(), value);
				break;
			case "xlinkHref":
				if ("function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) break;
				value = sanitizeURL("" + value);
				target.push(attributeSeparator, "xlink:href", attributeAssign, escapeTextForBrowser(value), attributeEnd);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				"function" !== typeof value && "symbol" !== typeof value && target.push(attributeSeparator, name, attributeAssign, escapeTextForBrowser(value), attributeEnd);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				value && "function" !== typeof value && "symbol" !== typeof value && target.push(attributeSeparator, name, attributeEmptyString);
				break;
			case "capture":
			case "download":
				!0 === value ? target.push(attributeSeparator, name, attributeEmptyString) : !1 !== value && "function" !== typeof value && "symbol" !== typeof value && target.push(attributeSeparator, name, attributeAssign, escapeTextForBrowser(value), attributeEnd);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				"function" !== typeof value && "symbol" !== typeof value && !isNaN(value) && 1 <= value && target.push(attributeSeparator, name, attributeAssign, escapeTextForBrowser(value), attributeEnd);
				break;
			case "rowSpan":
			case "start":
				"function" === typeof value || "symbol" === typeof value || isNaN(value) || target.push(attributeSeparator, name, attributeAssign, escapeTextForBrowser(value), attributeEnd);
				break;
			case "xlinkActuate":
				pushStringAttribute(target, "xlink:actuate", value);
				break;
			case "xlinkArcrole":
				pushStringAttribute(target, "xlink:arcrole", value);
				break;
			case "xlinkRole":
				pushStringAttribute(target, "xlink:role", value);
				break;
			case "xlinkShow":
				pushStringAttribute(target, "xlink:show", value);
				break;
			case "xlinkTitle":
				pushStringAttribute(target, "xlink:title", value);
				break;
			case "xlinkType":
				pushStringAttribute(target, "xlink:type", value);
				break;
			case "xmlBase":
				pushStringAttribute(target, "xml:base", value);
				break;
			case "xmlLang":
				pushStringAttribute(target, "xml:lang", value);
				break;
			case "xmlSpace":
				pushStringAttribute(target, "xml:space", value);
				break;
			default: if (!(2 < name.length) || "o" !== name[0] && "O" !== name[0] || "n" !== name[1] && "N" !== name[1]) {
				if (name = aliases.get(name) || name, isAttributeNameSafe(name)) {
					switch (typeof value) {
						case "function":
						case "symbol": return;
						case "boolean":
							var prefix$8 = name.toLowerCase().slice(0, 5);
							if ("data-" !== prefix$8 && "aria-" !== prefix$8) return;
					}
					target.push(attributeSeparator, name, attributeAssign, escapeTextForBrowser(value), attributeEnd);
				}
			}
		}
	}
	var endOfStartTag = stringToPrecomputedChunk(">"), endOfStartTagSelfClosing = stringToPrecomputedChunk("/>");
	function pushInnerHTML(target, innerHTML, children) {
		if (null != innerHTML) {
			if (null != children) throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
			if ("object" !== typeof innerHTML || !("__html" in innerHTML)) throw Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://react.dev/link/dangerously-set-inner-html for more information.");
			innerHTML = innerHTML.__html;
			null !== innerHTML && void 0 !== innerHTML && target.push("" + innerHTML);
		}
	}
	function flattenOptionChildren(children) {
		var content = "";
		React.Children.forEach(children, function(child) {
			null != child && (content += child);
		});
		return content;
	}
	var selectedMarkerAttribute = stringToPrecomputedChunk(" selected=\"\""), formReplayingRuntimeScript = stringToPrecomputedChunk("addEventListener(\"submit\",function(a){if(!a.defaultPrevented){var c=a.target,d=a.submitter,e=c.action,b=d;if(d){var f=d.getAttribute(\"formAction\");null!=f&&(e=f,b=null)}\"javascript:throw new Error('React form unexpectedly submitted.')\"===e&&(a.preventDefault(),b?(a=document.createElement(\"input\"),a.name=b.name,a.value=b.value,b.parentNode.insertBefore(a,b),b=new FormData(c),a.parentNode.removeChild(a)):b=new FormData(c),a=c.ownerDocument||c,(a.$$reactFormReplay=a.$$reactFormReplay||[]).push(c,d,b))}});");
	function injectFormReplayingRuntime(resumableState, renderState) {
		if (0 === (resumableState.instructions & 16)) {
			resumableState.instructions |= 16;
			var preamble = renderState.preamble, bootstrapChunks = renderState.bootstrapChunks;
			(preamble.htmlChunks || preamble.headChunks) && 0 === bootstrapChunks.length ? (bootstrapChunks.push(renderState.startInlineScript), pushCompletedShellIdAttribute(bootstrapChunks, resumableState), bootstrapChunks.push(endOfStartTag, formReplayingRuntimeScript, endInlineScript)) : bootstrapChunks.unshift(renderState.startInlineScript, endOfStartTag, formReplayingRuntimeScript, endInlineScript);
		}
	}
	var formStateMarkerIsMatching = stringToPrecomputedChunk("<!--F!-->"), formStateMarkerIsNotMatching = stringToPrecomputedChunk("<!--F-->");
	function pushLinkImpl(target, props) {
		target.push(startChunkForTag("link"));
		for (var propKey in props) if (hasOwnProperty.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
				case "dangerouslySetInnerHTML": throw Error("link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
				default: pushAttribute(target, propKey, propValue);
			}
		}
		target.push(endOfStartTagSelfClosing);
		return null;
	}
	var styleRegex = /(<\/|<)(s)(tyle)/gi;
	function styleReplacer(match, prefix$2, s$1, suffix$2) {
		return "" + prefix$2 + ("s" === s$1 ? "\\73 " : "\\53 ") + suffix$2;
	}
	function pushSelfClosing(target, props, tag) {
		target.push(startChunkForTag(tag));
		for (var propKey in props) if (hasOwnProperty.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
				case "dangerouslySetInnerHTML": throw Error(tag + " is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
				default: pushAttribute(target, propKey, propValue);
			}
		}
		target.push(endOfStartTagSelfClosing);
		return null;
	}
	function pushTitleImpl(target, props) {
		target.push(startChunkForTag("title"));
		var children = null, innerHTML = null, propKey;
		for (propKey in props) if (hasOwnProperty.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					children = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute(target, propKey, propValue);
			}
		}
		target.push(endOfStartTag);
		props = Array.isArray(children) ? 2 > children.length ? children[0] : null : children;
		"function" !== typeof props && "symbol" !== typeof props && null !== props && void 0 !== props && target.push(escapeTextForBrowser("" + props));
		pushInnerHTML(target, innerHTML, children);
		target.push(endChunkForTag("title"));
		return null;
	}
	var headPreambleContributionChunk = stringToPrecomputedChunk("<!--head-->"), bodyPreambleContributionChunk = stringToPrecomputedChunk("<!--body-->"), htmlPreambleContributionChunk = stringToPrecomputedChunk("<!--html-->");
	function pushScriptImpl(target, props) {
		target.push(startChunkForTag("script"));
		var children = null, innerHTML = null, propKey;
		for (propKey in props) if (hasOwnProperty.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					children = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute(target, propKey, propValue);
			}
		}
		target.push(endOfStartTag);
		pushInnerHTML(target, innerHTML, children);
		"string" === typeof children && target.push(("" + children).replace(scriptRegex, scriptReplacer));
		target.push(endChunkForTag("script"));
		return null;
	}
	function pushStartSingletonElement(target, props, tag) {
		target.push(startChunkForTag(tag));
		var innerHTML = tag = null, propKey;
		for (propKey in props) if (hasOwnProperty.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					tag = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute(target, propKey, propValue);
			}
		}
		target.push(endOfStartTag);
		pushInnerHTML(target, innerHTML, tag);
		return tag;
	}
	function pushStartGenericElement(target, props, tag) {
		target.push(startChunkForTag(tag));
		var innerHTML = tag = null, propKey;
		for (propKey in props) if (hasOwnProperty.call(props, propKey)) {
			var propValue = props[propKey];
			if (null != propValue) switch (propKey) {
				case "children":
					tag = propValue;
					break;
				case "dangerouslySetInnerHTML":
					innerHTML = propValue;
					break;
				default: pushAttribute(target, propKey, propValue);
			}
		}
		target.push(endOfStartTag);
		pushInnerHTML(target, innerHTML, tag);
		return "string" === typeof tag ? (target.push(escapeTextForBrowser(tag)), null) : tag;
	}
	var leadingNewline = stringToPrecomputedChunk("\n"), VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/, validatedTagCache = /* @__PURE__ */ new Map();
	function startChunkForTag(tag) {
		var tagStartChunk = validatedTagCache.get(tag);
		if (void 0 === tagStartChunk) {
			if (!VALID_TAG_REGEX.test(tag)) throw Error("Invalid tag: " + tag);
			tagStartChunk = stringToPrecomputedChunk("<" + tag);
			validatedTagCache.set(tag, tagStartChunk);
		}
		return tagStartChunk;
	}
	var doctypeChunk = stringToPrecomputedChunk("<!DOCTYPE html>");
	function pushStartInstance(target$jscomp$0, type, props, resumableState, renderState, preambleState, hoistableState, formatContext, textEmbedded) {
		switch (type) {
			case "div":
			case "span":
			case "svg":
			case "path": break;
			case "a":
				target$jscomp$0.push(startChunkForTag("a"));
				var children = null, innerHTML = null, propKey;
				for (propKey in props) if (hasOwnProperty.call(props, propKey)) {
					var propValue = props[propKey];
					if (null != propValue) switch (propKey) {
						case "children":
							children = propValue;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML = propValue;
							break;
						case "href":
							"" === propValue ? pushStringAttribute(target$jscomp$0, "href", "") : pushAttribute(target$jscomp$0, propKey, propValue);
							break;
						default: pushAttribute(target$jscomp$0, propKey, propValue);
					}
				}
				target$jscomp$0.push(endOfStartTag);
				pushInnerHTML(target$jscomp$0, innerHTML, children);
				if ("string" === typeof children) {
					target$jscomp$0.push(escapeTextForBrowser(children));
					var JSCompiler_inline_result = null;
				} else JSCompiler_inline_result = children;
				return JSCompiler_inline_result;
			case "g":
			case "p":
			case "li": break;
			case "select":
				target$jscomp$0.push(startChunkForTag("select"));
				var children$jscomp$0 = null, innerHTML$jscomp$0 = null, propKey$jscomp$0;
				for (propKey$jscomp$0 in props) if (hasOwnProperty.call(props, propKey$jscomp$0)) {
					var propValue$jscomp$0 = props[propKey$jscomp$0];
					if (null != propValue$jscomp$0) switch (propKey$jscomp$0) {
						case "children":
							children$jscomp$0 = propValue$jscomp$0;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$0 = propValue$jscomp$0;
							break;
						case "defaultValue":
						case "value": break;
						default: pushAttribute(target$jscomp$0, propKey$jscomp$0, propValue$jscomp$0);
					}
				}
				target$jscomp$0.push(endOfStartTag);
				pushInnerHTML(target$jscomp$0, innerHTML$jscomp$0, children$jscomp$0);
				return children$jscomp$0;
			case "option":
				var selectedValue = formatContext.selectedValue;
				target$jscomp$0.push(startChunkForTag("option"));
				var children$jscomp$1 = null, value = null, selected = null, innerHTML$jscomp$1 = null, propKey$jscomp$1;
				for (propKey$jscomp$1 in props) if (hasOwnProperty.call(props, propKey$jscomp$1)) {
					var propValue$jscomp$1 = props[propKey$jscomp$1];
					if (null != propValue$jscomp$1) switch (propKey$jscomp$1) {
						case "children":
							children$jscomp$1 = propValue$jscomp$1;
							break;
						case "selected":
							selected = propValue$jscomp$1;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$1 = propValue$jscomp$1;
							break;
						case "value": value = propValue$jscomp$1;
						default: pushAttribute(target$jscomp$0, propKey$jscomp$1, propValue$jscomp$1);
					}
				}
				if (null != selectedValue) {
					var stringValue = null !== value ? "" + value : flattenOptionChildren(children$jscomp$1);
					if (isArrayImpl(selectedValue)) {
						for (var i = 0; i < selectedValue.length; i++) if ("" + selectedValue[i] === stringValue) {
							target$jscomp$0.push(selectedMarkerAttribute);
							break;
						}
					} else "" + selectedValue === stringValue && target$jscomp$0.push(selectedMarkerAttribute);
				} else selected && target$jscomp$0.push(selectedMarkerAttribute);
				target$jscomp$0.push(endOfStartTag);
				pushInnerHTML(target$jscomp$0, innerHTML$jscomp$1, children$jscomp$1);
				return children$jscomp$1;
			case "textarea":
				target$jscomp$0.push(startChunkForTag("textarea"));
				var value$jscomp$0 = null, defaultValue = null, children$jscomp$2 = null, propKey$jscomp$2;
				for (propKey$jscomp$2 in props) if (hasOwnProperty.call(props, propKey$jscomp$2)) {
					var propValue$jscomp$2 = props[propKey$jscomp$2];
					if (null != propValue$jscomp$2) switch (propKey$jscomp$2) {
						case "children":
							children$jscomp$2 = propValue$jscomp$2;
							break;
						case "value":
							value$jscomp$0 = propValue$jscomp$2;
							break;
						case "defaultValue":
							defaultValue = propValue$jscomp$2;
							break;
						case "dangerouslySetInnerHTML": throw Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
						default: pushAttribute(target$jscomp$0, propKey$jscomp$2, propValue$jscomp$2);
					}
				}
				null === value$jscomp$0 && null !== defaultValue && (value$jscomp$0 = defaultValue);
				target$jscomp$0.push(endOfStartTag);
				if (null != children$jscomp$2) {
					if (null != value$jscomp$0) throw Error("If you supply `defaultValue` on a <textarea>, do not pass children.");
					if (isArrayImpl(children$jscomp$2)) {
						if (1 < children$jscomp$2.length) throw Error("<textarea> can only have at most one child.");
						value$jscomp$0 = "" + children$jscomp$2[0];
					}
					value$jscomp$0 = "" + children$jscomp$2;
				}
				"string" === typeof value$jscomp$0 && "\n" === value$jscomp$0[0] && target$jscomp$0.push(leadingNewline);
				null !== value$jscomp$0 && target$jscomp$0.push(escapeTextForBrowser("" + value$jscomp$0));
				return null;
			case "input":
				target$jscomp$0.push(startChunkForTag("input"));
				var name = null, formAction = null, formEncType = null, formMethod = null, formTarget = null, value$jscomp$1 = null, defaultValue$jscomp$0 = null, checked = null, defaultChecked = null, propKey$jscomp$3;
				for (propKey$jscomp$3 in props) if (hasOwnProperty.call(props, propKey$jscomp$3)) {
					var propValue$jscomp$3 = props[propKey$jscomp$3];
					if (null != propValue$jscomp$3) switch (propKey$jscomp$3) {
						case "children":
						case "dangerouslySetInnerHTML": throw Error("input is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
						case "name":
							name = propValue$jscomp$3;
							break;
						case "formAction":
							formAction = propValue$jscomp$3;
							break;
						case "formEncType":
							formEncType = propValue$jscomp$3;
							break;
						case "formMethod":
							formMethod = propValue$jscomp$3;
							break;
						case "formTarget":
							formTarget = propValue$jscomp$3;
							break;
						case "defaultChecked":
							defaultChecked = propValue$jscomp$3;
							break;
						case "defaultValue":
							defaultValue$jscomp$0 = propValue$jscomp$3;
							break;
						case "checked":
							checked = propValue$jscomp$3;
							break;
						case "value":
							value$jscomp$1 = propValue$jscomp$3;
							break;
						default: pushAttribute(target$jscomp$0, propKey$jscomp$3, propValue$jscomp$3);
					}
				}
				var formData = pushFormActionAttribute(target$jscomp$0, resumableState, renderState, formAction, formEncType, formMethod, formTarget, name);
				null !== checked ? pushBooleanAttribute(target$jscomp$0, "checked", checked) : null !== defaultChecked && pushBooleanAttribute(target$jscomp$0, "checked", defaultChecked);
				null !== value$jscomp$1 ? pushAttribute(target$jscomp$0, "value", value$jscomp$1) : null !== defaultValue$jscomp$0 && pushAttribute(target$jscomp$0, "value", defaultValue$jscomp$0);
				target$jscomp$0.push(endOfStartTagSelfClosing);
				formData?.forEach(pushAdditionalFormField, target$jscomp$0);
				return null;
			case "button":
				target$jscomp$0.push(startChunkForTag("button"));
				var children$jscomp$3 = null, innerHTML$jscomp$2 = null, name$jscomp$0 = null, formAction$jscomp$0 = null, formEncType$jscomp$0 = null, formMethod$jscomp$0 = null, formTarget$jscomp$0 = null, propKey$jscomp$4;
				for (propKey$jscomp$4 in props) if (hasOwnProperty.call(props, propKey$jscomp$4)) {
					var propValue$jscomp$4 = props[propKey$jscomp$4];
					if (null != propValue$jscomp$4) switch (propKey$jscomp$4) {
						case "children":
							children$jscomp$3 = propValue$jscomp$4;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$2 = propValue$jscomp$4;
							break;
						case "name":
							name$jscomp$0 = propValue$jscomp$4;
							break;
						case "formAction":
							formAction$jscomp$0 = propValue$jscomp$4;
							break;
						case "formEncType":
							formEncType$jscomp$0 = propValue$jscomp$4;
							break;
						case "formMethod":
							formMethod$jscomp$0 = propValue$jscomp$4;
							break;
						case "formTarget":
							formTarget$jscomp$0 = propValue$jscomp$4;
							break;
						default: pushAttribute(target$jscomp$0, propKey$jscomp$4, propValue$jscomp$4);
					}
				}
				var formData$jscomp$0 = pushFormActionAttribute(target$jscomp$0, resumableState, renderState, formAction$jscomp$0, formEncType$jscomp$0, formMethod$jscomp$0, formTarget$jscomp$0, name$jscomp$0);
				target$jscomp$0.push(endOfStartTag);
				formData$jscomp$0?.forEach(pushAdditionalFormField, target$jscomp$0);
				pushInnerHTML(target$jscomp$0, innerHTML$jscomp$2, children$jscomp$3);
				if ("string" === typeof children$jscomp$3) {
					target$jscomp$0.push(escapeTextForBrowser(children$jscomp$3));
					var JSCompiler_inline_result$jscomp$0 = null;
				} else JSCompiler_inline_result$jscomp$0 = children$jscomp$3;
				return JSCompiler_inline_result$jscomp$0;
			case "form":
				target$jscomp$0.push(startChunkForTag("form"));
				var children$jscomp$4 = null, innerHTML$jscomp$3 = null, formAction$jscomp$1 = null, formEncType$jscomp$1 = null, formMethod$jscomp$1 = null, formTarget$jscomp$1 = null, propKey$jscomp$5;
				for (propKey$jscomp$5 in props) if (hasOwnProperty.call(props, propKey$jscomp$5)) {
					var propValue$jscomp$5 = props[propKey$jscomp$5];
					if (null != propValue$jscomp$5) switch (propKey$jscomp$5) {
						case "children":
							children$jscomp$4 = propValue$jscomp$5;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$3 = propValue$jscomp$5;
							break;
						case "action":
							formAction$jscomp$1 = propValue$jscomp$5;
							break;
						case "encType":
							formEncType$jscomp$1 = propValue$jscomp$5;
							break;
						case "method":
							formMethod$jscomp$1 = propValue$jscomp$5;
							break;
						case "target":
							formTarget$jscomp$1 = propValue$jscomp$5;
							break;
						default: pushAttribute(target$jscomp$0, propKey$jscomp$5, propValue$jscomp$5);
					}
				}
				var formData$jscomp$1 = null, formActionName = null;
				if ("function" === typeof formAction$jscomp$1) {
					var customFields = getCustomFormFields(resumableState, formAction$jscomp$1);
					null !== customFields ? (formAction$jscomp$1 = customFields.action || "", formEncType$jscomp$1 = customFields.encType, formMethod$jscomp$1 = customFields.method, formTarget$jscomp$1 = customFields.target, formData$jscomp$1 = customFields.data, formActionName = customFields.name) : (target$jscomp$0.push(attributeSeparator, "action", attributeAssign, actionJavaScriptURL, attributeEnd), formTarget$jscomp$1 = formMethod$jscomp$1 = formEncType$jscomp$1 = formAction$jscomp$1 = null, injectFormReplayingRuntime(resumableState, renderState));
				}
				null != formAction$jscomp$1 && pushAttribute(target$jscomp$0, "action", formAction$jscomp$1);
				null != formEncType$jscomp$1 && pushAttribute(target$jscomp$0, "encType", formEncType$jscomp$1);
				null != formMethod$jscomp$1 && pushAttribute(target$jscomp$0, "method", formMethod$jscomp$1);
				null != formTarget$jscomp$1 && pushAttribute(target$jscomp$0, "target", formTarget$jscomp$1);
				target$jscomp$0.push(endOfStartTag);
				null !== formActionName && (target$jscomp$0.push(startHiddenInputChunk), pushStringAttribute(target$jscomp$0, "name", formActionName), target$jscomp$0.push(endOfStartTagSelfClosing), formData$jscomp$1?.forEach(pushAdditionalFormField, target$jscomp$0));
				pushInnerHTML(target$jscomp$0, innerHTML$jscomp$3, children$jscomp$4);
				if ("string" === typeof children$jscomp$4) {
					target$jscomp$0.push(escapeTextForBrowser(children$jscomp$4));
					var JSCompiler_inline_result$jscomp$1 = null;
				} else JSCompiler_inline_result$jscomp$1 = children$jscomp$4;
				return JSCompiler_inline_result$jscomp$1;
			case "menuitem":
				target$jscomp$0.push(startChunkForTag("menuitem"));
				for (var propKey$jscomp$6 in props) if (hasOwnProperty.call(props, propKey$jscomp$6)) {
					var propValue$jscomp$6 = props[propKey$jscomp$6];
					if (null != propValue$jscomp$6) switch (propKey$jscomp$6) {
						case "children":
						case "dangerouslySetInnerHTML": throw Error("menuitems cannot have `children` nor `dangerouslySetInnerHTML`.");
						default: pushAttribute(target$jscomp$0, propKey$jscomp$6, propValue$jscomp$6);
					}
				}
				target$jscomp$0.push(endOfStartTag);
				return null;
			case "object":
				target$jscomp$0.push(startChunkForTag("object"));
				var children$jscomp$5 = null, innerHTML$jscomp$4 = null, propKey$jscomp$7;
				for (propKey$jscomp$7 in props) if (hasOwnProperty.call(props, propKey$jscomp$7)) {
					var propValue$jscomp$7 = props[propKey$jscomp$7];
					if (null != propValue$jscomp$7) switch (propKey$jscomp$7) {
						case "children":
							children$jscomp$5 = propValue$jscomp$7;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$4 = propValue$jscomp$7;
							break;
						case "data":
							var sanitizedValue = sanitizeURL("" + propValue$jscomp$7);
							if ("" === sanitizedValue) break;
							target$jscomp$0.push(attributeSeparator, "data", attributeAssign, escapeTextForBrowser(sanitizedValue), attributeEnd);
							break;
						default: pushAttribute(target$jscomp$0, propKey$jscomp$7, propValue$jscomp$7);
					}
				}
				target$jscomp$0.push(endOfStartTag);
				pushInnerHTML(target$jscomp$0, innerHTML$jscomp$4, children$jscomp$5);
				if ("string" === typeof children$jscomp$5) {
					target$jscomp$0.push(escapeTextForBrowser(children$jscomp$5));
					var JSCompiler_inline_result$jscomp$2 = null;
				} else JSCompiler_inline_result$jscomp$2 = children$jscomp$5;
				return JSCompiler_inline_result$jscomp$2;
			case "title":
				var noscriptTagInScope = formatContext.tagScope & 1, isFallback = formatContext.tagScope & 4;
				if (4 === formatContext.insertionMode || noscriptTagInScope || null != props.itemProp) var JSCompiler_inline_result$jscomp$3 = pushTitleImpl(target$jscomp$0, props);
				else isFallback ? JSCompiler_inline_result$jscomp$3 = null : (pushTitleImpl(renderState.hoistableChunks, props), JSCompiler_inline_result$jscomp$3 = void 0);
				return JSCompiler_inline_result$jscomp$3;
			case "link":
				var noscriptTagInScope$jscomp$0 = formatContext.tagScope & 1, isFallback$jscomp$0 = formatContext.tagScope & 4, rel = props.rel, href = props.href, precedence = props.precedence;
				if (4 === formatContext.insertionMode || noscriptTagInScope$jscomp$0 || null != props.itemProp || "string" !== typeof rel || "string" !== typeof href || "" === href) {
					pushLinkImpl(target$jscomp$0, props);
					var JSCompiler_inline_result$jscomp$4 = null;
				} else if ("stylesheet" === props.rel) if ("string" !== typeof precedence || null != props.disabled || props.onLoad || props.onError) JSCompiler_inline_result$jscomp$4 = pushLinkImpl(target$jscomp$0, props);
				else {
					var styleQueue = renderState.styles.get(precedence), resourceState = resumableState.styleResources.hasOwnProperty(href) ? resumableState.styleResources[href] : void 0;
					if (null !== resourceState) {
						resumableState.styleResources[href] = null;
						styleQueue || (styleQueue = {
							precedence: escapeTextForBrowser(precedence),
							rules: [],
							hrefs: [],
							sheets: /* @__PURE__ */ new Map()
						}, renderState.styles.set(precedence, styleQueue));
						var resource = {
							state: 0,
							props: assign({}, props, {
								"data-precedence": props.precedence,
								precedence: null
							})
						};
						if (resourceState) {
							2 === resourceState.length && adoptPreloadCredentials(resource.props, resourceState);
							var preloadResource = renderState.preloads.stylesheets.get(href);
							preloadResource && 0 < preloadResource.length ? preloadResource.length = 0 : resource.state = 1;
						}
						styleQueue.sheets.set(href, resource);
						hoistableState && hoistableState.stylesheets.add(resource);
					} else if (styleQueue) {
						var resource$9 = styleQueue.sheets.get(href);
						resource$9 && hoistableState && hoistableState.stylesheets.add(resource$9);
					}
					textEmbedded && target$jscomp$0.push(textSeparator);
					JSCompiler_inline_result$jscomp$4 = null;
				}
				else props.onLoad || props.onError ? JSCompiler_inline_result$jscomp$4 = pushLinkImpl(target$jscomp$0, props) : (textEmbedded && target$jscomp$0.push(textSeparator), JSCompiler_inline_result$jscomp$4 = isFallback$jscomp$0 ? null : pushLinkImpl(renderState.hoistableChunks, props));
				return JSCompiler_inline_result$jscomp$4;
			case "script":
				var noscriptTagInScope$jscomp$1 = formatContext.tagScope & 1, asyncProp = props.async;
				if ("string" !== typeof props.src || !props.src || !asyncProp || "function" === typeof asyncProp || "symbol" === typeof asyncProp || props.onLoad || props.onError || 4 === formatContext.insertionMode || noscriptTagInScope$jscomp$1 || null != props.itemProp) var JSCompiler_inline_result$jscomp$5 = pushScriptImpl(target$jscomp$0, props);
				else {
					var key = props.src;
					if ("module" === props.type) {
						var resources = resumableState.moduleScriptResources;
						var preloads = renderState.preloads.moduleScripts;
					} else resources = resumableState.scriptResources, preloads = renderState.preloads.scripts;
					var resourceState$jscomp$0 = resources.hasOwnProperty(key) ? resources[key] : void 0;
					if (null !== resourceState$jscomp$0) {
						resources[key] = null;
						var scriptProps = props;
						if (resourceState$jscomp$0) {
							2 === resourceState$jscomp$0.length && (scriptProps = assign({}, props), adoptPreloadCredentials(scriptProps, resourceState$jscomp$0));
							var preloadResource$jscomp$0 = preloads.get(key);
							preloadResource$jscomp$0 && (preloadResource$jscomp$0.length = 0);
						}
						var resource$jscomp$0 = [];
						renderState.scripts.add(resource$jscomp$0);
						pushScriptImpl(resource$jscomp$0, scriptProps);
					}
					textEmbedded && target$jscomp$0.push(textSeparator);
					JSCompiler_inline_result$jscomp$5 = null;
				}
				return JSCompiler_inline_result$jscomp$5;
			case "style":
				var noscriptTagInScope$jscomp$2 = formatContext.tagScope & 1, precedence$jscomp$0 = props.precedence, href$jscomp$0 = props.href, nonce = props.nonce;
				if (4 === formatContext.insertionMode || noscriptTagInScope$jscomp$2 || null != props.itemProp || "string" !== typeof precedence$jscomp$0 || "string" !== typeof href$jscomp$0 || "" === href$jscomp$0) {
					target$jscomp$0.push(startChunkForTag("style"));
					var children$jscomp$6 = null, innerHTML$jscomp$5 = null, propKey$jscomp$8;
					for (propKey$jscomp$8 in props) if (hasOwnProperty.call(props, propKey$jscomp$8)) {
						var propValue$jscomp$8 = props[propKey$jscomp$8];
						if (null != propValue$jscomp$8) switch (propKey$jscomp$8) {
							case "children":
								children$jscomp$6 = propValue$jscomp$8;
								break;
							case "dangerouslySetInnerHTML":
								innerHTML$jscomp$5 = propValue$jscomp$8;
								break;
							default: pushAttribute(target$jscomp$0, propKey$jscomp$8, propValue$jscomp$8);
						}
					}
					target$jscomp$0.push(endOfStartTag);
					var child = Array.isArray(children$jscomp$6) ? 2 > children$jscomp$6.length ? children$jscomp$6[0] : null : children$jscomp$6;
					"function" !== typeof child && "symbol" !== typeof child && null !== child && void 0 !== child && target$jscomp$0.push(("" + child).replace(styleRegex, styleReplacer));
					pushInnerHTML(target$jscomp$0, innerHTML$jscomp$5, children$jscomp$6);
					target$jscomp$0.push(endChunkForTag("style"));
					var JSCompiler_inline_result$jscomp$6 = null;
				} else {
					var styleQueue$jscomp$0 = renderState.styles.get(precedence$jscomp$0);
					if (null !== (resumableState.styleResources.hasOwnProperty(href$jscomp$0) ? resumableState.styleResources[href$jscomp$0] : void 0)) {
						resumableState.styleResources[href$jscomp$0] = null;
						styleQueue$jscomp$0 || (styleQueue$jscomp$0 = {
							precedence: escapeTextForBrowser(precedence$jscomp$0),
							rules: [],
							hrefs: [],
							sheets: /* @__PURE__ */ new Map()
						}, renderState.styles.set(precedence$jscomp$0, styleQueue$jscomp$0));
						var nonceStyle = renderState.nonce.style;
						if (!nonceStyle || nonceStyle === nonce) {
							styleQueue$jscomp$0.hrefs.push(escapeTextForBrowser(href$jscomp$0));
							var target = styleQueue$jscomp$0.rules, children$jscomp$7 = null, innerHTML$jscomp$6 = null, propKey$jscomp$9;
							for (propKey$jscomp$9 in props) if (hasOwnProperty.call(props, propKey$jscomp$9)) {
								var propValue$jscomp$9 = props[propKey$jscomp$9];
								if (null != propValue$jscomp$9) switch (propKey$jscomp$9) {
									case "children":
										children$jscomp$7 = propValue$jscomp$9;
										break;
									case "dangerouslySetInnerHTML": innerHTML$jscomp$6 = propValue$jscomp$9;
								}
							}
							var child$jscomp$0 = Array.isArray(children$jscomp$7) ? 2 > children$jscomp$7.length ? children$jscomp$7[0] : null : children$jscomp$7;
							"function" !== typeof child$jscomp$0 && "symbol" !== typeof child$jscomp$0 && null !== child$jscomp$0 && void 0 !== child$jscomp$0 && target.push(("" + child$jscomp$0).replace(styleRegex, styleReplacer));
							pushInnerHTML(target, innerHTML$jscomp$6, children$jscomp$7);
						}
					}
					styleQueue$jscomp$0 && hoistableState && hoistableState.styles.add(styleQueue$jscomp$0);
					textEmbedded && target$jscomp$0.push(textSeparator);
					JSCompiler_inline_result$jscomp$6 = void 0;
				}
				return JSCompiler_inline_result$jscomp$6;
			case "meta":
				var noscriptTagInScope$jscomp$3 = formatContext.tagScope & 1, isFallback$jscomp$1 = formatContext.tagScope & 4;
				if (4 === formatContext.insertionMode || noscriptTagInScope$jscomp$3 || null != props.itemProp) var JSCompiler_inline_result$jscomp$7 = pushSelfClosing(target$jscomp$0, props, "meta");
				else textEmbedded && target$jscomp$0.push(textSeparator), JSCompiler_inline_result$jscomp$7 = isFallback$jscomp$1 ? null : "string" === typeof props.charSet ? pushSelfClosing(renderState.charsetChunks, props, "meta") : "viewport" === props.name ? pushSelfClosing(renderState.viewportChunks, props, "meta") : pushSelfClosing(renderState.hoistableChunks, props, "meta");
				return JSCompiler_inline_result$jscomp$7;
			case "listing":
			case "pre":
				target$jscomp$0.push(startChunkForTag(type));
				var children$jscomp$8 = null, innerHTML$jscomp$7 = null, propKey$jscomp$10;
				for (propKey$jscomp$10 in props) if (hasOwnProperty.call(props, propKey$jscomp$10)) {
					var propValue$jscomp$10 = props[propKey$jscomp$10];
					if (null != propValue$jscomp$10) switch (propKey$jscomp$10) {
						case "children":
							children$jscomp$8 = propValue$jscomp$10;
							break;
						case "dangerouslySetInnerHTML":
							innerHTML$jscomp$7 = propValue$jscomp$10;
							break;
						default: pushAttribute(target$jscomp$0, propKey$jscomp$10, propValue$jscomp$10);
					}
				}
				target$jscomp$0.push(endOfStartTag);
				if (null != innerHTML$jscomp$7) {
					if (null != children$jscomp$8) throw Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
					if ("object" !== typeof innerHTML$jscomp$7 || !("__html" in innerHTML$jscomp$7)) throw Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://react.dev/link/dangerously-set-inner-html for more information.");
					var html = innerHTML$jscomp$7.__html;
					null !== html && void 0 !== html && ("string" === typeof html && 0 < html.length && "\n" === html[0] ? target$jscomp$0.push(leadingNewline, html) : target$jscomp$0.push("" + html));
				}
				"string" === typeof children$jscomp$8 && "\n" === children$jscomp$8[0] && target$jscomp$0.push(leadingNewline);
				return children$jscomp$8;
			case "img":
				var pictureOrNoScriptTagInScope = formatContext.tagScope & 3, src = props.src, srcSet = props.srcSet;
				if (!("lazy" === props.loading || !src && !srcSet || "string" !== typeof src && null != src || "string" !== typeof srcSet && null != srcSet || "low" === props.fetchPriority || pictureOrNoScriptTagInScope) && ("string" !== typeof src || ":" !== src[4] || "d" !== src[0] && "D" !== src[0] || "a" !== src[1] && "A" !== src[1] || "t" !== src[2] && "T" !== src[2] || "a" !== src[3] && "A" !== src[3]) && ("string" !== typeof srcSet || ":" !== srcSet[4] || "d" !== srcSet[0] && "D" !== srcSet[0] || "a" !== srcSet[1] && "A" !== srcSet[1] || "t" !== srcSet[2] && "T" !== srcSet[2] || "a" !== srcSet[3] && "A" !== srcSet[3])) {
					null !== hoistableState && formatContext.tagScope & 64 && (hoistableState.suspenseyImages = !0);
					var sizes = "string" === typeof props.sizes ? props.sizes : void 0, key$jscomp$0 = srcSet ? srcSet + "\n" + (sizes || "") : src, promotablePreloads = renderState.preloads.images, resource$jscomp$1 = promotablePreloads.get(key$jscomp$0);
					if (resource$jscomp$1) {
						if ("high" === props.fetchPriority || 10 > renderState.highImagePreloads.size) promotablePreloads.delete(key$jscomp$0), renderState.highImagePreloads.add(resource$jscomp$1);
					} else if (!resumableState.imageResources.hasOwnProperty(key$jscomp$0)) {
						resumableState.imageResources[key$jscomp$0] = PRELOAD_NO_CREDS;
						var input = props.crossOrigin;
						var JSCompiler_inline_result$jscomp$8 = "string" === typeof input ? "use-credentials" === input ? input : "" : void 0;
						var headers = renderState.headers, header;
						headers && 0 < headers.remainingCapacity && "string" !== typeof props.srcSet && ("high" === props.fetchPriority || 500 > headers.highImagePreloads.length) && (header = getPreloadAsHeader(src, "image", {
							imageSrcSet: props.srcSet,
							imageSizes: props.sizes,
							crossOrigin: JSCompiler_inline_result$jscomp$8,
							integrity: props.integrity,
							nonce: props.nonce,
							type: props.type,
							fetchPriority: props.fetchPriority,
							referrerPolicy: props.refererPolicy
						}), 0 <= (headers.remainingCapacity -= header.length + 2)) ? (renderState.resets.image[key$jscomp$0] = PRELOAD_NO_CREDS, headers.highImagePreloads && (headers.highImagePreloads += ", "), headers.highImagePreloads += header) : (resource$jscomp$1 = [], pushLinkImpl(resource$jscomp$1, {
							rel: "preload",
							as: "image",
							href: srcSet ? void 0 : src,
							imageSrcSet: srcSet,
							imageSizes: sizes,
							crossOrigin: JSCompiler_inline_result$jscomp$8,
							integrity: props.integrity,
							type: props.type,
							fetchPriority: props.fetchPriority,
							referrerPolicy: props.referrerPolicy
						}), "high" === props.fetchPriority || 10 > renderState.highImagePreloads.size ? renderState.highImagePreloads.add(resource$jscomp$1) : (renderState.bulkPreloads.add(resource$jscomp$1), promotablePreloads.set(key$jscomp$0, resource$jscomp$1)));
					}
				}
				return pushSelfClosing(target$jscomp$0, props, "img");
			case "base":
			case "area":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "param":
			case "source":
			case "track":
			case "wbr": return pushSelfClosing(target$jscomp$0, props, type);
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": break;
			case "head":
				if (2 > formatContext.insertionMode) {
					var preamble = preambleState || renderState.preamble;
					if (preamble.headChunks) throw Error("The `<head>` tag may only be rendered once.");
					null !== preambleState && target$jscomp$0.push(headPreambleContributionChunk);
					preamble.headChunks = [];
					var JSCompiler_inline_result$jscomp$9 = pushStartSingletonElement(preamble.headChunks, props, "head");
				} else JSCompiler_inline_result$jscomp$9 = pushStartGenericElement(target$jscomp$0, props, "head");
				return JSCompiler_inline_result$jscomp$9;
			case "body":
				if (2 > formatContext.insertionMode) {
					var preamble$jscomp$0 = preambleState || renderState.preamble;
					if (preamble$jscomp$0.bodyChunks) throw Error("The `<body>` tag may only be rendered once.");
					null !== preambleState && target$jscomp$0.push(bodyPreambleContributionChunk);
					preamble$jscomp$0.bodyChunks = [];
					var JSCompiler_inline_result$jscomp$10 = pushStartSingletonElement(preamble$jscomp$0.bodyChunks, props, "body");
				} else JSCompiler_inline_result$jscomp$10 = pushStartGenericElement(target$jscomp$0, props, "body");
				return JSCompiler_inline_result$jscomp$10;
			case "html":
				if (0 === formatContext.insertionMode) {
					var preamble$jscomp$1 = preambleState || renderState.preamble;
					if (preamble$jscomp$1.htmlChunks) throw Error("The `<html>` tag may only be rendered once.");
					null !== preambleState && target$jscomp$0.push(htmlPreambleContributionChunk);
					preamble$jscomp$1.htmlChunks = [doctypeChunk];
					var JSCompiler_inline_result$jscomp$11 = pushStartSingletonElement(preamble$jscomp$1.htmlChunks, props, "html");
				} else JSCompiler_inline_result$jscomp$11 = pushStartGenericElement(target$jscomp$0, props, "html");
				return JSCompiler_inline_result$jscomp$11;
			default: if (-1 !== type.indexOf("-")) {
				target$jscomp$0.push(startChunkForTag(type));
				var children$jscomp$9 = null, innerHTML$jscomp$8 = null, propKey$jscomp$11;
				for (propKey$jscomp$11 in props) if (hasOwnProperty.call(props, propKey$jscomp$11)) {
					var propValue$jscomp$11 = props[propKey$jscomp$11];
					if (null != propValue$jscomp$11) {
						var attributeName = propKey$jscomp$11;
						switch (propKey$jscomp$11) {
							case "children":
								children$jscomp$9 = propValue$jscomp$11;
								break;
							case "dangerouslySetInnerHTML":
								innerHTML$jscomp$8 = propValue$jscomp$11;
								break;
							case "style":
								pushStyleAttribute(target$jscomp$0, propValue$jscomp$11);
								break;
							case "suppressContentEditableWarning":
							case "suppressHydrationWarning":
							case "ref": break;
							case "className": attributeName = "class";
							default: if (isAttributeNameSafe(propKey$jscomp$11) && "function" !== typeof propValue$jscomp$11 && "symbol" !== typeof propValue$jscomp$11 && !1 !== propValue$jscomp$11) {
								if (!0 === propValue$jscomp$11) propValue$jscomp$11 = "";
								else if ("object" === typeof propValue$jscomp$11) continue;
								target$jscomp$0.push(attributeSeparator, attributeName, attributeAssign, escapeTextForBrowser(propValue$jscomp$11), attributeEnd);
							}
						}
					}
				}
				target$jscomp$0.push(endOfStartTag);
				pushInnerHTML(target$jscomp$0, innerHTML$jscomp$8, children$jscomp$9);
				return children$jscomp$9;
			}
		}
		return pushStartGenericElement(target$jscomp$0, props, type);
	}
	var endTagCache = /* @__PURE__ */ new Map();
	function endChunkForTag(tag) {
		var chunk = endTagCache.get(tag);
		void 0 === chunk && (chunk = stringToPrecomputedChunk("</" + tag + ">"), endTagCache.set(tag, chunk));
		return chunk;
	}
	function hoistPreambleState(renderState, preambleState) {
		renderState = renderState.preamble;
		null === renderState.htmlChunks && preambleState.htmlChunks && (renderState.htmlChunks = preambleState.htmlChunks);
		null === renderState.headChunks && preambleState.headChunks && (renderState.headChunks = preambleState.headChunks);
		null === renderState.bodyChunks && preambleState.bodyChunks && (renderState.bodyChunks = preambleState.bodyChunks);
	}
	function writeBootstrap(destination, renderState) {
		renderState = renderState.bootstrapChunks;
		for (var i = 0; i < renderState.length - 1; i++) writeChunk(destination, renderState[i]);
		return i < renderState.length ? (i = renderState[i], renderState.length = 0, writeChunkAndReturn(destination, i)) : !0;
	}
	var shellTimeRuntimeScript = stringToPrecomputedChunk("requestAnimationFrame(function(){$RT=performance.now()});"), placeholder1 = stringToPrecomputedChunk("<template id=\""), placeholder2 = stringToPrecomputedChunk("\"></template>"), startActivityBoundary = stringToPrecomputedChunk("<!--&-->"), endActivityBoundary = stringToPrecomputedChunk("<!--/&-->"), startCompletedSuspenseBoundary = stringToPrecomputedChunk("<!--$-->"), startPendingSuspenseBoundary1 = stringToPrecomputedChunk("<!--$?--><template id=\""), startPendingSuspenseBoundary2 = stringToPrecomputedChunk("\"></template>"), startClientRenderedSuspenseBoundary = stringToPrecomputedChunk("<!--$!-->"), endSuspenseBoundary = stringToPrecomputedChunk("<!--/$-->"), clientRenderedSuspenseBoundaryError1 = stringToPrecomputedChunk("<template"), clientRenderedSuspenseBoundaryErrorAttrInterstitial = stringToPrecomputedChunk("\""), clientRenderedSuspenseBoundaryError1A = stringToPrecomputedChunk(" data-dgst=\"");
	stringToPrecomputedChunk(" data-msg=\"");
	stringToPrecomputedChunk(" data-stck=\"");
	stringToPrecomputedChunk(" data-cstck=\"");
	var clientRenderedSuspenseBoundaryError2 = stringToPrecomputedChunk("></template>");
	function writeStartPendingSuspenseBoundary(destination, renderState, id) {
		writeChunk(destination, startPendingSuspenseBoundary1);
		if (null === id) throw Error("An ID must have been assigned before we can complete the boundary.");
		writeChunk(destination, renderState.boundaryPrefix);
		writeChunk(destination, id.toString(16));
		return writeChunkAndReturn(destination, startPendingSuspenseBoundary2);
	}
	var startSegmentHTML = stringToPrecomputedChunk("<div hidden id=\""), startSegmentHTML2 = stringToPrecomputedChunk("\">"), endSegmentHTML = stringToPrecomputedChunk("</div>"), startSegmentSVG = stringToPrecomputedChunk("<svg aria-hidden=\"true\" style=\"display:none\" id=\""), startSegmentSVG2 = stringToPrecomputedChunk("\">"), endSegmentSVG = stringToPrecomputedChunk("</svg>"), startSegmentMathML = stringToPrecomputedChunk("<math aria-hidden=\"true\" style=\"display:none\" id=\""), startSegmentMathML2 = stringToPrecomputedChunk("\">"), endSegmentMathML = stringToPrecomputedChunk("</math>"), startSegmentTable = stringToPrecomputedChunk("<table hidden id=\""), startSegmentTable2 = stringToPrecomputedChunk("\">"), endSegmentTable = stringToPrecomputedChunk("</table>"), startSegmentTableBody = stringToPrecomputedChunk("<table hidden><tbody id=\""), startSegmentTableBody2 = stringToPrecomputedChunk("\">"), endSegmentTableBody = stringToPrecomputedChunk("</tbody></table>"), startSegmentTableRow = stringToPrecomputedChunk("<table hidden><tr id=\""), startSegmentTableRow2 = stringToPrecomputedChunk("\">"), endSegmentTableRow = stringToPrecomputedChunk("</tr></table>"), startSegmentColGroup = stringToPrecomputedChunk("<table hidden><colgroup id=\""), startSegmentColGroup2 = stringToPrecomputedChunk("\">"), endSegmentColGroup = stringToPrecomputedChunk("</colgroup></table>");
	function writeStartSegment(destination, renderState, formatContext, id) {
		switch (formatContext.insertionMode) {
			case 0:
			case 1:
			case 3:
			case 2: return writeChunk(destination, startSegmentHTML), writeChunk(destination, renderState.segmentPrefix), writeChunk(destination, id.toString(16)), writeChunkAndReturn(destination, startSegmentHTML2);
			case 4: return writeChunk(destination, startSegmentSVG), writeChunk(destination, renderState.segmentPrefix), writeChunk(destination, id.toString(16)), writeChunkAndReturn(destination, startSegmentSVG2);
			case 5: return writeChunk(destination, startSegmentMathML), writeChunk(destination, renderState.segmentPrefix), writeChunk(destination, id.toString(16)), writeChunkAndReturn(destination, startSegmentMathML2);
			case 6: return writeChunk(destination, startSegmentTable), writeChunk(destination, renderState.segmentPrefix), writeChunk(destination, id.toString(16)), writeChunkAndReturn(destination, startSegmentTable2);
			case 7: return writeChunk(destination, startSegmentTableBody), writeChunk(destination, renderState.segmentPrefix), writeChunk(destination, id.toString(16)), writeChunkAndReturn(destination, startSegmentTableBody2);
			case 8: return writeChunk(destination, startSegmentTableRow), writeChunk(destination, renderState.segmentPrefix), writeChunk(destination, id.toString(16)), writeChunkAndReturn(destination, startSegmentTableRow2);
			case 9: return writeChunk(destination, startSegmentColGroup), writeChunk(destination, renderState.segmentPrefix), writeChunk(destination, id.toString(16)), writeChunkAndReturn(destination, startSegmentColGroup2);
			default: throw Error("Unknown insertion mode. This is a bug in React.");
		}
	}
	function writeEndSegment(destination, formatContext) {
		switch (formatContext.insertionMode) {
			case 0:
			case 1:
			case 3:
			case 2: return writeChunkAndReturn(destination, endSegmentHTML);
			case 4: return writeChunkAndReturn(destination, endSegmentSVG);
			case 5: return writeChunkAndReturn(destination, endSegmentMathML);
			case 6: return writeChunkAndReturn(destination, endSegmentTable);
			case 7: return writeChunkAndReturn(destination, endSegmentTableBody);
			case 8: return writeChunkAndReturn(destination, endSegmentTableRow);
			case 9: return writeChunkAndReturn(destination, endSegmentColGroup);
			default: throw Error("Unknown insertion mode. This is a bug in React.");
		}
	}
	var completeSegmentScript1Full = stringToPrecomputedChunk("$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};$RS(\""), completeSegmentScript1Partial = stringToPrecomputedChunk("$RS(\""), completeSegmentScript2 = stringToPrecomputedChunk("\",\""), completeSegmentScriptEnd = stringToPrecomputedChunk("\")<\/script>");
	stringToPrecomputedChunk("<template data-rsi=\"\" data-sid=\"");
	stringToPrecomputedChunk("\" data-pid=\"");
	var completeBoundaryScriptFunctionOnly = stringToPrecomputedChunk("$RB=[];$RV=function(a){$RT=performance.now();for(var b=0;b<a.length;b+=2){var c=a[b],e=a[b+1];null!==e.parentNode&&e.parentNode.removeChild(e);var f=c.parentNode;if(f){var g=c.previousSibling,h=0;do{if(c&&8===c.nodeType){var d=c.data;if(\"/$\"===d||\"/&\"===d)if(0===h)break;else h--;else\"$\"!==d&&\"$?\"!==d&&\"$~\"!==d&&\"$!\"!==d&&\"&\"!==d||h++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;e.firstChild;)f.insertBefore(e.firstChild,c);g.data=\"$\";g._reactRetry&&requestAnimationFrame(g._reactRetry)}}a.length=0};\n$RC=function(a,b){if(b=document.getElementById(b))(a=document.getElementById(a))?(a.previousSibling.data=\"$~\",$RB.push(a,b),2===$RB.length&&(\"number\"!==typeof $RT?requestAnimationFrame($RV.bind(null,$RB)):(a=performance.now(),setTimeout($RV.bind(null,$RB),2300>a&&2E3<a?2300-a:$RT+300-a)))):b.parentNode.removeChild(b)};"), completeBoundaryScript1Partial = stringToPrecomputedChunk("$RC(\""), completeBoundaryWithStylesScript1FullPartial = stringToPrecomputedChunk("$RM=new Map;$RR=function(n,w,p){function u(q){this._p=null;q()}for(var r=new Map,t=document,h,b,e=t.querySelectorAll(\"link[data-precedence],style[data-precedence]\"),v=[],k=0;b=e[k++];)\"not all\"===b.getAttribute(\"media\")?v.push(b):(\"LINK\"===b.tagName&&$RM.set(b.getAttribute(\"href\"),b),r.set(b.dataset.precedence,h=b));e=0;b=[];var l,a;for(k=!0;;){if(k){var f=p[e++];if(!f){k=!1;e=0;continue}var c=!1,m=0;var d=f[m++];if(a=$RM.get(d)){var g=a._p;c=!0}else{a=t.createElement(\"link\");a.href=d;a.rel=\n\"stylesheet\";for(a.dataset.precedence=l=f[m++];g=f[m++];)a.setAttribute(g,f[m++]);g=a._p=new Promise(function(q,x){a.onload=u.bind(a,q);a.onerror=u.bind(a,x)});$RM.set(d,a)}d=a.getAttribute(\"media\");!g||d&&!matchMedia(d).matches||b.push(g);if(c)continue}else{a=v[e++];if(!a)break;l=a.getAttribute(\"data-precedence\");a.removeAttribute(\"media\")}c=r.get(l)||h;c===h&&(h=a);r.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=t.head,c.insertBefore(a,c.firstChild))}if(p=document.getElementById(n))p.previousSibling.data=\n\"$~\";Promise.all(b).then($RC.bind(null,n,w),$RX.bind(null,n,\"CSS failed to load\"))};$RR(\""), completeBoundaryWithStylesScript1Partial = stringToPrecomputedChunk("$RR(\""), completeBoundaryScript2 = stringToPrecomputedChunk("\",\""), completeBoundaryScript3a = stringToPrecomputedChunk("\","), completeBoundaryScript3b = stringToPrecomputedChunk("\""), completeBoundaryScriptEnd = stringToPrecomputedChunk(")<\/script>");
	stringToPrecomputedChunk("<template data-rci=\"\" data-bid=\"");
	stringToPrecomputedChunk("<template data-rri=\"\" data-bid=\"");
	stringToPrecomputedChunk("\" data-sid=\"");
	stringToPrecomputedChunk("\" data-sty=\"");
	var clientRenderScriptFunctionOnly = stringToPrecomputedChunk("$RX=function(b,c,d,e,f){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data=\"$!\",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),f&&(a.cstck=f),b._reactRetry&&b._reactRetry())};"), clientRenderScript1Full = stringToPrecomputedChunk("$RX=function(b,c,d,e,f){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data=\"$!\",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),f&&(a.cstck=f),b._reactRetry&&b._reactRetry())};;$RX(\""), clientRenderScript1Partial = stringToPrecomputedChunk("$RX(\""), clientRenderScript1A = stringToPrecomputedChunk("\""), clientRenderErrorScriptArgInterstitial = stringToPrecomputedChunk(","), clientRenderScriptEnd = stringToPrecomputedChunk(")<\/script>");
	stringToPrecomputedChunk("<template data-rxi=\"\" data-bid=\"");
	stringToPrecomputedChunk("\" data-dgst=\"");
	stringToPrecomputedChunk("\" data-msg=\"");
	stringToPrecomputedChunk("\" data-stck=\"");
	stringToPrecomputedChunk("\" data-cstck=\"");
	var regexForJSStringsInInstructionScripts = /[<\u2028\u2029]/g;
	function escapeJSStringsForInstructionScripts(input) {
		return JSON.stringify(input).replace(regexForJSStringsInInstructionScripts, function(match) {
			switch (match) {
				case "<": return "\\u003c";
				case "\u2028": return "\\u2028";
				case "\u2029": return "\\u2029";
				default: throw Error("escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
			}
		});
	}
	var regexForJSStringsInScripts = /[&><\u2028\u2029]/g;
	function escapeJSObjectForInstructionScripts(input) {
		return JSON.stringify(input).replace(regexForJSStringsInScripts, function(match) {
			switch (match) {
				case "&": return "\\u0026";
				case ">": return "\\u003e";
				case "<": return "\\u003c";
				case "\u2028": return "\\u2028";
				case "\u2029": return "\\u2029";
				default: throw Error("escapeJSObjectForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
			}
		});
	}
	var lateStyleTagResourceOpen1 = stringToPrecomputedChunk(" media=\"not all\" data-precedence=\""), lateStyleTagResourceOpen2 = stringToPrecomputedChunk("\" data-href=\""), lateStyleTagResourceOpen3 = stringToPrecomputedChunk("\">"), lateStyleTagTemplateClose = stringToPrecomputedChunk("</style>"), currentlyRenderingBoundaryHasStylesToHoist = !1, destinationHasCapacity = !0;
	function flushStyleTagsLateForBoundary(styleQueue) {
		var rules = styleQueue.rules, hrefs = styleQueue.hrefs, i = 0;
		if (hrefs.length) {
			writeChunk(this, currentlyFlushingRenderState.startInlineStyle);
			writeChunk(this, lateStyleTagResourceOpen1);
			writeChunk(this, styleQueue.precedence);
			for (writeChunk(this, lateStyleTagResourceOpen2); i < hrefs.length - 1; i++) writeChunk(this, hrefs[i]), writeChunk(this, spaceSeparator);
			writeChunk(this, hrefs[i]);
			writeChunk(this, lateStyleTagResourceOpen3);
			for (i = 0; i < rules.length; i++) writeChunk(this, rules[i]);
			destinationHasCapacity = writeChunkAndReturn(this, lateStyleTagTemplateClose);
			currentlyRenderingBoundaryHasStylesToHoist = !0;
			rules.length = 0;
			hrefs.length = 0;
		}
	}
	function hasStylesToHoist(stylesheet) {
		return 2 !== stylesheet.state ? currentlyRenderingBoundaryHasStylesToHoist = !0 : !1;
	}
	function writeHoistablesForBoundary(destination, hoistableState, renderState) {
		currentlyRenderingBoundaryHasStylesToHoist = !1;
		destinationHasCapacity = !0;
		currentlyFlushingRenderState = renderState;
		hoistableState.styles.forEach(flushStyleTagsLateForBoundary, destination);
		currentlyFlushingRenderState = null;
		hoistableState.stylesheets.forEach(hasStylesToHoist);
		currentlyRenderingBoundaryHasStylesToHoist && (renderState.stylesToHoist = !0);
		return destinationHasCapacity;
	}
	function flushResource(resource) {
		for (var i = 0; i < resource.length; i++) writeChunk(this, resource[i]);
		resource.length = 0;
	}
	var stylesheetFlushingQueue = [];
	function flushStyleInPreamble(stylesheet) {
		pushLinkImpl(stylesheetFlushingQueue, stylesheet.props);
		for (var i = 0; i < stylesheetFlushingQueue.length; i++) writeChunk(this, stylesheetFlushingQueue[i]);
		stylesheetFlushingQueue.length = 0;
		stylesheet.state = 2;
	}
	var styleTagResourceOpen1 = stringToPrecomputedChunk(" data-precedence=\""), styleTagResourceOpen2 = stringToPrecomputedChunk("\" data-href=\""), spaceSeparator = stringToPrecomputedChunk(" "), styleTagResourceOpen3 = stringToPrecomputedChunk("\">"), styleTagResourceClose = stringToPrecomputedChunk("</style>");
	function flushStylesInPreamble(styleQueue) {
		var hasStylesheets = 0 < styleQueue.sheets.size;
		styleQueue.sheets.forEach(flushStyleInPreamble, this);
		styleQueue.sheets.clear();
		var rules = styleQueue.rules, hrefs = styleQueue.hrefs;
		if (!hasStylesheets || hrefs.length) {
			writeChunk(this, currentlyFlushingRenderState.startInlineStyle);
			writeChunk(this, styleTagResourceOpen1);
			writeChunk(this, styleQueue.precedence);
			styleQueue = 0;
			if (hrefs.length) {
				for (writeChunk(this, styleTagResourceOpen2); styleQueue < hrefs.length - 1; styleQueue++) writeChunk(this, hrefs[styleQueue]), writeChunk(this, spaceSeparator);
				writeChunk(this, hrefs[styleQueue]);
			}
			writeChunk(this, styleTagResourceOpen3);
			for (styleQueue = 0; styleQueue < rules.length; styleQueue++) writeChunk(this, rules[styleQueue]);
			writeChunk(this, styleTagResourceClose);
			rules.length = 0;
			hrefs.length = 0;
		}
	}
	function preloadLateStyle(stylesheet) {
		if (0 === stylesheet.state) {
			stylesheet.state = 1;
			var props = stylesheet.props;
			pushLinkImpl(stylesheetFlushingQueue, {
				rel: "preload",
				as: "style",
				href: stylesheet.props.href,
				crossOrigin: props.crossOrigin,
				fetchPriority: props.fetchPriority,
				integrity: props.integrity,
				media: props.media,
				hrefLang: props.hrefLang,
				referrerPolicy: props.referrerPolicy
			});
			for (stylesheet = 0; stylesheet < stylesheetFlushingQueue.length; stylesheet++) writeChunk(this, stylesheetFlushingQueue[stylesheet]);
			stylesheetFlushingQueue.length = 0;
		}
	}
	function preloadLateStyles(styleQueue) {
		styleQueue.sheets.forEach(preloadLateStyle, this);
		styleQueue.sheets.clear();
	}
	stringToPrecomputedChunk("<link rel=\"expect\" href=\"#");
	stringToPrecomputedChunk("\" blocking=\"render\"/>");
	var completedShellIdAttributeStart = stringToPrecomputedChunk(" id=\"");
	function pushCompletedShellIdAttribute(target, resumableState) {
		0 === (resumableState.instructions & 32) && (resumableState.instructions |= 32, target.push(completedShellIdAttributeStart, escapeTextForBrowser("_" + resumableState.idPrefix + "R_"), attributeEnd));
	}
	var arrayFirstOpenBracket = stringToPrecomputedChunk("["), arraySubsequentOpenBracket = stringToPrecomputedChunk(",["), arrayInterstitial = stringToPrecomputedChunk(","), arrayCloseBracket = stringToPrecomputedChunk("]");
	function writeStyleResourceDependenciesInJS(destination, hoistableState) {
		writeChunk(destination, arrayFirstOpenBracket);
		var nextArrayOpenBrackChunk = arrayFirstOpenBracket;
		hoistableState.stylesheets.forEach(function(resource) {
			if (2 !== resource.state) if (3 === resource.state) writeChunk(destination, nextArrayOpenBrackChunk), writeChunk(destination, escapeJSObjectForInstructionScripts("" + resource.props.href)), writeChunk(destination, arrayCloseBracket), nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
			else {
				writeChunk(destination, nextArrayOpenBrackChunk);
				var precedence = resource.props["data-precedence"], props = resource.props;
				writeChunk(destination, escapeJSObjectForInstructionScripts(sanitizeURL("" + resource.props.href)));
				precedence = "" + precedence;
				writeChunk(destination, arrayInterstitial);
				writeChunk(destination, escapeJSObjectForInstructionScripts(precedence));
				for (var propKey in props) if (hasOwnProperty.call(props, propKey) && (precedence = props[propKey], null != precedence)) switch (propKey) {
					case "href":
					case "rel":
					case "precedence":
					case "data-precedence": break;
					case "children":
					case "dangerouslySetInnerHTML": throw Error("link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`.");
					default: writeStyleResourceAttributeInJS(destination, propKey, precedence);
				}
				writeChunk(destination, arrayCloseBracket);
				nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
				resource.state = 3;
			}
		});
		writeChunk(destination, arrayCloseBracket);
	}
	function writeStyleResourceAttributeInJS(destination, name, value) {
		var attributeName = name.toLowerCase();
		switch (typeof value) {
			case "function":
			case "symbol": return;
		}
		switch (name) {
			case "innerHTML":
			case "dangerouslySetInnerHTML":
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "style":
			case "ref": return;
			case "className":
				attributeName = "class";
				name = "" + value;
				break;
			case "hidden":
				if (!1 === value) return;
				name = "";
				break;
			case "src":
			case "href":
				value = sanitizeURL(value);
				name = "" + value;
				break;
			default:
				if (2 < name.length && ("o" === name[0] || "O" === name[0]) && ("n" === name[1] || "N" === name[1]) || !isAttributeNameSafe(name)) return;
				name = "" + value;
		}
		writeChunk(destination, arrayInterstitial);
		writeChunk(destination, escapeJSObjectForInstructionScripts(attributeName));
		writeChunk(destination, arrayInterstitial);
		writeChunk(destination, escapeJSObjectForInstructionScripts(name));
	}
	function createHoistableState() {
		return {
			styles: /* @__PURE__ */ new Set(),
			stylesheets: /* @__PURE__ */ new Set(),
			suspenseyImages: !1
		};
	}
	function prefetchDNS(href) {
		var request = resolveRequest();
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if ("string" === typeof href && href) {
				if (!resumableState.dnsResources.hasOwnProperty(href)) {
					resumableState.dnsResources[href] = null;
					resumableState = renderState.headers;
					var header, JSCompiler_temp;
					if (JSCompiler_temp = resumableState && 0 < resumableState.remainingCapacity) JSCompiler_temp = (header = "<" + ("" + href).replace(regexForHrefInLinkHeaderURLContext, escapeHrefForLinkHeaderURLContextReplacer) + ">; rel=dns-prefetch", 0 <= (resumableState.remainingCapacity -= header.length + 2));
					JSCompiler_temp ? (renderState.resets.dns[href] = null, resumableState.preconnects && (resumableState.preconnects += ", "), resumableState.preconnects += header) : (header = [], pushLinkImpl(header, {
						href,
						rel: "dns-prefetch"
					}), renderState.preconnects.add(header));
				}
				enqueueFlush(request);
			}
		} else previousDispatcher.D(href);
	}
	function preconnect(href, crossOrigin) {
		var request = resolveRequest();
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if ("string" === typeof href && href) {
				var bucket = "use-credentials" === crossOrigin ? "credentials" : "string" === typeof crossOrigin ? "anonymous" : "default";
				if (!resumableState.connectResources[bucket].hasOwnProperty(href)) {
					resumableState.connectResources[bucket][href] = null;
					resumableState = renderState.headers;
					var header, JSCompiler_temp;
					if (JSCompiler_temp = resumableState && 0 < resumableState.remainingCapacity) {
						JSCompiler_temp = "<" + ("" + href).replace(regexForHrefInLinkHeaderURLContext, escapeHrefForLinkHeaderURLContextReplacer) + ">; rel=preconnect";
						if ("string" === typeof crossOrigin) {
							var escapedCrossOrigin = ("" + crossOrigin).replace(regexForLinkHeaderQuotedParamValueContext, escapeStringForLinkHeaderQuotedParamValueContextReplacer);
							JSCompiler_temp += "; crossorigin=\"" + escapedCrossOrigin + "\"";
						}
						JSCompiler_temp = (header = JSCompiler_temp, 0 <= (resumableState.remainingCapacity -= header.length + 2));
					}
					JSCompiler_temp ? (renderState.resets.connect[bucket][href] = null, resumableState.preconnects && (resumableState.preconnects += ", "), resumableState.preconnects += header) : (bucket = [], pushLinkImpl(bucket, {
						rel: "preconnect",
						href,
						crossOrigin
					}), renderState.preconnects.add(bucket));
				}
				enqueueFlush(request);
			}
		} else previousDispatcher.C(href, crossOrigin);
	}
	function preload(href, as, options) {
		var request = resolveRequest();
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (as && href) {
				switch (as) {
					case "image":
						if (options) {
							var imageSrcSet = options.imageSrcSet;
							var imageSizes = options.imageSizes;
							var fetchPriority = options.fetchPriority;
						}
						var key = imageSrcSet ? imageSrcSet + "\n" + (imageSizes || "") : href;
						if (resumableState.imageResources.hasOwnProperty(key)) return;
						resumableState.imageResources[key] = PRELOAD_NO_CREDS;
						resumableState = renderState.headers;
						var header;
						resumableState && 0 < resumableState.remainingCapacity && "string" !== typeof imageSrcSet && "high" === fetchPriority && (header = getPreloadAsHeader(href, as, options), 0 <= (resumableState.remainingCapacity -= header.length + 2)) ? (renderState.resets.image[key] = PRELOAD_NO_CREDS, resumableState.highImagePreloads && (resumableState.highImagePreloads += ", "), resumableState.highImagePreloads += header) : (resumableState = [], pushLinkImpl(resumableState, assign({
							rel: "preload",
							href: imageSrcSet ? void 0 : href,
							as
						}, options)), "high" === fetchPriority ? renderState.highImagePreloads.add(resumableState) : (renderState.bulkPreloads.add(resumableState), renderState.preloads.images.set(key, resumableState)));
						break;
					case "style":
						if (resumableState.styleResources.hasOwnProperty(href)) return;
						imageSrcSet = [];
						pushLinkImpl(imageSrcSet, assign({
							rel: "preload",
							href,
							as
						}, options));
						resumableState.styleResources[href] = !options || "string" !== typeof options.crossOrigin && "string" !== typeof options.integrity ? PRELOAD_NO_CREDS : [options.crossOrigin, options.integrity];
						renderState.preloads.stylesheets.set(href, imageSrcSet);
						renderState.bulkPreloads.add(imageSrcSet);
						break;
					case "script":
						if (resumableState.scriptResources.hasOwnProperty(href)) return;
						imageSrcSet = [];
						renderState.preloads.scripts.set(href, imageSrcSet);
						renderState.bulkPreloads.add(imageSrcSet);
						pushLinkImpl(imageSrcSet, assign({
							rel: "preload",
							href,
							as
						}, options));
						resumableState.scriptResources[href] = !options || "string" !== typeof options.crossOrigin && "string" !== typeof options.integrity ? PRELOAD_NO_CREDS : [options.crossOrigin, options.integrity];
						break;
					default:
						if (resumableState.unknownResources.hasOwnProperty(as)) {
							if (imageSrcSet = resumableState.unknownResources[as], imageSrcSet.hasOwnProperty(href)) return;
						} else imageSrcSet = {}, resumableState.unknownResources[as] = imageSrcSet;
						imageSrcSet[href] = PRELOAD_NO_CREDS;
						if ((resumableState = renderState.headers) && 0 < resumableState.remainingCapacity && "font" === as && (key = getPreloadAsHeader(href, as, options), 0 <= (resumableState.remainingCapacity -= key.length + 2))) renderState.resets.font[href] = PRELOAD_NO_CREDS, resumableState.fontPreloads && (resumableState.fontPreloads += ", "), resumableState.fontPreloads += key;
						else switch (resumableState = [], href = assign({
							rel: "preload",
							href,
							as
						}, options), pushLinkImpl(resumableState, href), as) {
							case "font":
								renderState.fontPreloads.add(resumableState);
								break;
							default: renderState.bulkPreloads.add(resumableState);
						}
				}
				enqueueFlush(request);
			}
		} else previousDispatcher.L(href, as, options);
	}
	function preloadModule(href, options) {
		var request = resolveRequest();
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (href) {
				var as = options && "string" === typeof options.as ? options.as : "script";
				switch (as) {
					case "script":
						if (resumableState.moduleScriptResources.hasOwnProperty(href)) return;
						as = [];
						resumableState.moduleScriptResources[href] = !options || "string" !== typeof options.crossOrigin && "string" !== typeof options.integrity ? PRELOAD_NO_CREDS : [options.crossOrigin, options.integrity];
						renderState.preloads.moduleScripts.set(href, as);
						break;
					default:
						if (resumableState.moduleUnknownResources.hasOwnProperty(as)) {
							var resources = resumableState.unknownResources[as];
							if (resources.hasOwnProperty(href)) return;
						} else resources = {}, resumableState.moduleUnknownResources[as] = resources;
						as = [];
						resources[href] = PRELOAD_NO_CREDS;
				}
				pushLinkImpl(as, assign({
					rel: "modulepreload",
					href
				}, options));
				renderState.bulkPreloads.add(as);
				enqueueFlush(request);
			}
		} else previousDispatcher.m(href, options);
	}
	function preinitStyle(href, precedence, options) {
		var request = resolveRequest();
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (href) {
				precedence = precedence || "default";
				var styleQueue = renderState.styles.get(precedence), resourceState = resumableState.styleResources.hasOwnProperty(href) ? resumableState.styleResources[href] : void 0;
				null !== resourceState && (resumableState.styleResources[href] = null, styleQueue || (styleQueue = {
					precedence: escapeTextForBrowser(precedence),
					rules: [],
					hrefs: [],
					sheets: /* @__PURE__ */ new Map()
				}, renderState.styles.set(precedence, styleQueue)), precedence = {
					state: 0,
					props: assign({
						rel: "stylesheet",
						href,
						"data-precedence": precedence
					}, options)
				}, resourceState && (2 === resourceState.length && adoptPreloadCredentials(precedence.props, resourceState), (renderState = renderState.preloads.stylesheets.get(href)) && 0 < renderState.length ? renderState.length = 0 : precedence.state = 1), styleQueue.sheets.set(href, precedence), enqueueFlush(request));
			}
		} else previousDispatcher.S(href, precedence, options);
	}
	function preinitScript(src, options) {
		var request = resolveRequest();
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (src) {
				var resourceState = resumableState.scriptResources.hasOwnProperty(src) ? resumableState.scriptResources[src] : void 0;
				null !== resourceState && (resumableState.scriptResources[src] = null, options = assign({
					src,
					async: !0
				}, options), resourceState && (2 === resourceState.length && adoptPreloadCredentials(options, resourceState), src = renderState.preloads.scripts.get(src)) && (src.length = 0), src = [], renderState.scripts.add(src), pushScriptImpl(src, options), enqueueFlush(request));
			}
		} else previousDispatcher.X(src, options);
	}
	function preinitModuleScript(src, options) {
		var request = resolveRequest();
		if (request) {
			var resumableState = request.resumableState, renderState = request.renderState;
			if (src) {
				var resourceState = resumableState.moduleScriptResources.hasOwnProperty(src) ? resumableState.moduleScriptResources[src] : void 0;
				null !== resourceState && (resumableState.moduleScriptResources[src] = null, options = assign({
					src,
					type: "module",
					async: !0
				}, options), resourceState && (2 === resourceState.length && adoptPreloadCredentials(options, resourceState), src = renderState.preloads.moduleScripts.get(src)) && (src.length = 0), src = [], renderState.scripts.add(src), pushScriptImpl(src, options), enqueueFlush(request));
			}
		} else previousDispatcher.M(src, options);
	}
	function adoptPreloadCredentials(target, preloadState) {
		target.crossOrigin ??= preloadState[0];
		target.integrity ??= preloadState[1];
	}
	function getPreloadAsHeader(href, as, params) {
		href = ("" + href).replace(regexForHrefInLinkHeaderURLContext, escapeHrefForLinkHeaderURLContextReplacer);
		as = ("" + as).replace(regexForLinkHeaderQuotedParamValueContext, escapeStringForLinkHeaderQuotedParamValueContextReplacer);
		as = "<" + href + ">; rel=preload; as=\"" + as + "\"";
		for (var paramName in params) hasOwnProperty.call(params, paramName) && (href = params[paramName], "string" === typeof href && (as += "; " + paramName.toLowerCase() + "=\"" + ("" + href).replace(regexForLinkHeaderQuotedParamValueContext, escapeStringForLinkHeaderQuotedParamValueContextReplacer) + "\""));
		return as;
	}
	var regexForHrefInLinkHeaderURLContext = /[<>\r\n]/g;
	function escapeHrefForLinkHeaderURLContextReplacer(match) {
		switch (match) {
			case "<": return "%3C";
			case ">": return "%3E";
			case "\n": return "%0A";
			case "\r": return "%0D";
			default: throw Error("escapeLinkHrefForHeaderContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
		}
	}
	var regexForLinkHeaderQuotedParamValueContext = /["';,\r\n]/g;
	function escapeStringForLinkHeaderQuotedParamValueContextReplacer(match) {
		switch (match) {
			case "\"": return "%22";
			case "'": return "%27";
			case ";": return "%3B";
			case ",": return "%2C";
			case "\n": return "%0A";
			case "\r": return "%0D";
			default: throw Error("escapeStringForLinkHeaderQuotedParamValueContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React");
		}
	}
	function hoistStyleQueueDependency(styleQueue) {
		this.styles.add(styleQueue);
	}
	function hoistStylesheetDependency(stylesheet) {
		this.stylesheets.add(stylesheet);
	}
	function hoistHoistables(parentState, childState) {
		childState.styles.forEach(hoistStyleQueueDependency, parentState);
		childState.stylesheets.forEach(hoistStylesheetDependency, parentState);
		childState.suspenseyImages && (parentState.suspenseyImages = !0);
	}
	function hasSuspenseyContent(hoistableState) {
		return 0 < hoistableState.stylesheets.size || hoistableState.suspenseyImages;
	}
	var bind = Function.prototype.bind, requestStorage = new async_hooks.AsyncLocalStorage(), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
	function getComponentNameFromType(type) {
		if (null == type) return null;
		if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
		if ("string" === typeof type) return type;
		switch (type) {
			case REACT_FRAGMENT_TYPE: return "Fragment";
			case REACT_PROFILER_TYPE: return "Profiler";
			case REACT_STRICT_MODE_TYPE: return "StrictMode";
			case REACT_SUSPENSE_TYPE: return "Suspense";
			case REACT_SUSPENSE_LIST_TYPE: return "SuspenseList";
			case REACT_ACTIVITY_TYPE: return "Activity";
		}
		if ("object" === typeof type) switch (type.$$typeof) {
			case REACT_PORTAL_TYPE: return "Portal";
			case REACT_CONTEXT_TYPE: return type.displayName || "Context";
			case REACT_CONSUMER_TYPE: return (type._context.displayName || "Context") + ".Consumer";
			case REACT_FORWARD_REF_TYPE:
				var innerType = type.render;
				type = type.displayName;
				type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
				return type;
			case REACT_MEMO_TYPE: return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
			case REACT_LAZY_TYPE:
				innerType = type._payload;
				type = type._init;
				try {
					return getComponentNameFromType(type(innerType));
				} catch (x) {}
		}
		return null;
	}
	var emptyContextObject = {}, currentActiveSnapshot = null;
	function popToNearestCommonAncestor(prev, next) {
		if (prev !== next) {
			prev.context._currentValue = prev.parentValue;
			prev = prev.parent;
			var parentNext = next.parent;
			if (null === prev) {
				if (null !== parentNext) throw Error("The stacks must reach the root at the same time. This is a bug in React.");
			} else {
				if (null === parentNext) throw Error("The stacks must reach the root at the same time. This is a bug in React.");
				popToNearestCommonAncestor(prev, parentNext);
			}
			next.context._currentValue = next.value;
		}
	}
	function popAllPrevious(prev) {
		prev.context._currentValue = prev.parentValue;
		prev = prev.parent;
		null !== prev && popAllPrevious(prev);
	}
	function pushAllNext(next) {
		var parentNext = next.parent;
		null !== parentNext && pushAllNext(parentNext);
		next.context._currentValue = next.value;
	}
	function popPreviousToCommonLevel(prev, next) {
		prev.context._currentValue = prev.parentValue;
		prev = prev.parent;
		if (null === prev) throw Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
		prev.depth === next.depth ? popToNearestCommonAncestor(prev, next) : popPreviousToCommonLevel(prev, next);
	}
	function popNextToCommonLevel(prev, next) {
		var parentNext = next.parent;
		if (null === parentNext) throw Error("The depth must equal at least at zero before reaching the root. This is a bug in React.");
		prev.depth === parentNext.depth ? popToNearestCommonAncestor(prev, parentNext) : popNextToCommonLevel(prev, parentNext);
		next.context._currentValue = next.value;
	}
	function switchContext(newSnapshot) {
		var prev = currentActiveSnapshot;
		prev !== newSnapshot && (null === prev ? pushAllNext(newSnapshot) : null === newSnapshot ? popAllPrevious(prev) : prev.depth === newSnapshot.depth ? popToNearestCommonAncestor(prev, newSnapshot) : prev.depth > newSnapshot.depth ? popPreviousToCommonLevel(prev, newSnapshot) : popNextToCommonLevel(prev, newSnapshot), currentActiveSnapshot = newSnapshot);
	}
	var classComponentUpdater = {
		enqueueSetState: function(inst, payload) {
			inst = inst._reactInternals;
			null !== inst.queue && inst.queue.push(payload);
		},
		enqueueReplaceState: function(inst, payload) {
			inst = inst._reactInternals;
			inst.replace = !0;
			inst.queue = [payload];
		},
		enqueueForceUpdate: function() {}
	}, emptyTreeContext = {
		id: 1,
		overflow: ""
	};
	function pushTreeContext(baseContext, totalChildren, index) {
		var baseIdWithLeadingBit = baseContext.id;
		baseContext = baseContext.overflow;
		var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
		baseIdWithLeadingBit &= ~(1 << baseLength);
		index += 1;
		var length = 32 - clz32(totalChildren) + baseLength;
		if (30 < length) {
			var numberOfOverflowBits = baseLength - baseLength % 5;
			length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
			baseIdWithLeadingBit >>= numberOfOverflowBits;
			baseLength -= numberOfOverflowBits;
			return {
				id: 1 << 32 - clz32(totalChildren) + baseLength | index << baseLength | baseIdWithLeadingBit,
				overflow: length + baseContext
			};
		}
		return {
			id: 1 << length | index << baseLength | baseIdWithLeadingBit,
			overflow: baseContext
		};
	}
	var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback, log = Math.log, LN2 = Math.LN2;
	function clz32Fallback(x) {
		x >>>= 0;
		return 0 === x ? 32 : 31 - (log(x) / LN2 | 0) | 0;
	}
	function noop$2() {}
	var SuspenseException = Error("Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`.");
	function trackUsedThenable(thenableState$2, thenable, index) {
		index = thenableState$2[index];
		void 0 === index ? thenableState$2.push(thenable) : index !== thenable && (thenable.then(noop$2, noop$2), thenable = index);
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default:
				"string" === typeof thenable.status ? thenable.then(noop$2, noop$2) : (thenableState$2 = thenable, thenableState$2.status = "pending", thenableState$2.then(function(fulfilledValue) {
					if ("pending" === thenable.status) {
						var fulfilledThenable = thenable;
						fulfilledThenable.status = "fulfilled";
						fulfilledThenable.value = fulfilledValue;
					}
				}, function(error) {
					if ("pending" === thenable.status) {
						var rejectedThenable = thenable;
						rejectedThenable.status = "rejected";
						rejectedThenable.reason = error;
					}
				}));
				switch (thenable.status) {
					case "fulfilled": return thenable.value;
					case "rejected": throw thenable.reason;
				}
				suspendedThenable = thenable;
				throw SuspenseException;
		}
	}
	var suspendedThenable = null;
	function getSuspendedThenable() {
		if (null === suspendedThenable) throw Error("Expected a suspended thenable. This is a bug in React. Please file an issue.");
		var thenable = suspendedThenable;
		suspendedThenable = null;
		return thenable;
	}
	function is(x, y) {
		return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
	}
	var objectIs = "function" === typeof Object.is ? Object.is : is, currentlyRenderingComponent = null, currentlyRenderingTask = null, currentlyRenderingRequest = null, currentlyRenderingKeyPath = null, firstWorkInProgressHook = null, workInProgressHook = null, isReRender = !1, didScheduleRenderPhaseUpdate = !1, localIdCounter = 0, actionStateCounter = 0, actionStateMatchingIndex = -1, thenableIndexCounter = 0, thenableState = null, renderPhaseUpdates = null, numberOfReRenders = 0;
	function resolveCurrentlyRenderingComponent() {
		if (null === currentlyRenderingComponent) throw Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.");
		return currentlyRenderingComponent;
	}
	function createHook() {
		if (0 < numberOfReRenders) throw Error("Rendered more hooks than during the previous render");
		return {
			memoizedState: null,
			queue: null,
			next: null
		};
	}
	function createWorkInProgressHook() {
		null === workInProgressHook ? null === firstWorkInProgressHook ? (isReRender = !1, firstWorkInProgressHook = workInProgressHook = createHook()) : (isReRender = !0, workInProgressHook = firstWorkInProgressHook) : null === workInProgressHook.next ? (isReRender = !1, workInProgressHook = workInProgressHook.next = createHook()) : (isReRender = !0, workInProgressHook = workInProgressHook.next);
		return workInProgressHook;
	}
	function getThenableStateAfterSuspending() {
		var state = thenableState;
		thenableState = null;
		return state;
	}
	function resetHooksState() {
		currentlyRenderingKeyPath = currentlyRenderingRequest = currentlyRenderingTask = currentlyRenderingComponent = null;
		didScheduleRenderPhaseUpdate = !1;
		firstWorkInProgressHook = null;
		numberOfReRenders = 0;
		workInProgressHook = renderPhaseUpdates = null;
	}
	function basicStateReducer(state, action) {
		return "function" === typeof action ? action(state) : action;
	}
	function useReducer(reducer, initialArg, init) {
		currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
		workInProgressHook = createWorkInProgressHook();
		if (isReRender) {
			var queue = workInProgressHook.queue;
			initialArg = queue.dispatch;
			if (null !== renderPhaseUpdates && (init = renderPhaseUpdates.get(queue), void 0 !== init)) {
				renderPhaseUpdates.delete(queue);
				queue = workInProgressHook.memoizedState;
				do
					queue = reducer(queue, init.action), init = init.next;
				while (null !== init);
				workInProgressHook.memoizedState = queue;
				return [queue, initialArg];
			}
			return [workInProgressHook.memoizedState, initialArg];
		}
		reducer = reducer === basicStateReducer ? "function" === typeof initialArg ? initialArg() : initialArg : void 0 !== init ? init(initialArg) : initialArg;
		workInProgressHook.memoizedState = reducer;
		reducer = workInProgressHook.queue = {
			last: null,
			dispatch: null
		};
		reducer = reducer.dispatch = dispatchAction.bind(null, currentlyRenderingComponent, reducer);
		return [workInProgressHook.memoizedState, reducer];
	}
	function useMemo(nextCreate, deps) {
		currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
		workInProgressHook = createWorkInProgressHook();
		deps = void 0 === deps ? null : deps;
		if (null !== workInProgressHook) {
			var prevState = workInProgressHook.memoizedState;
			if (null !== prevState && null !== deps) {
				var prevDeps = prevState[1];
				a: if (null === prevDeps) prevDeps = !1;
				else {
					for (var i = 0; i < prevDeps.length && i < deps.length; i++) if (!objectIs(deps[i], prevDeps[i])) {
						prevDeps = !1;
						break a;
					}
					prevDeps = !0;
				}
				if (prevDeps) return prevState[0];
			}
		}
		nextCreate = nextCreate();
		workInProgressHook.memoizedState = [nextCreate, deps];
		return nextCreate;
	}
	function dispatchAction(componentIdentity, queue, action) {
		if (25 <= numberOfReRenders) throw Error("Too many re-renders. React limits the number of renders to prevent an infinite loop.");
		if (componentIdentity === currentlyRenderingComponent) if (didScheduleRenderPhaseUpdate = !0, componentIdentity = {
			action,
			next: null
		}, null === renderPhaseUpdates && (renderPhaseUpdates = /* @__PURE__ */ new Map()), action = renderPhaseUpdates.get(queue), void 0 === action) renderPhaseUpdates.set(queue, componentIdentity);
		else {
			for (queue = action; null !== queue.next;) queue = queue.next;
			queue.next = componentIdentity;
		}
	}
	function throwOnUseEffectEventCall() {
		throw Error("A function wrapped in useEffectEvent can't be called during rendering.");
	}
	function unsupportedStartTransition() {
		throw Error("startTransition cannot be called during server rendering.");
	}
	function unsupportedSetOptimisticState() {
		throw Error("Cannot update optimistic state while rendering.");
	}
	function createPostbackActionStateKey(permalink, componentKeyPath, hookIndex) {
		if (void 0 !== permalink) return "p" + permalink;
		permalink = JSON.stringify([
			componentKeyPath,
			null,
			hookIndex
		]);
		componentKeyPath = crypto$1.createHash("md5");
		componentKeyPath.update(permalink);
		return "k" + componentKeyPath.digest("hex");
	}
	function useActionState(action, initialState, permalink) {
		resolveCurrentlyRenderingComponent();
		var actionStateHookIndex = actionStateCounter++, request = currentlyRenderingRequest;
		if ("function" === typeof action.$$FORM_ACTION) {
			var nextPostbackStateKey = null, componentKeyPath = currentlyRenderingKeyPath;
			request = request.formState;
			var isSignatureEqual = action.$$IS_SIGNATURE_EQUAL;
			if (null !== request && "function" === typeof isSignatureEqual) {
				var postbackKey = request[1];
				isSignatureEqual.call(action, request[2], request[3]) && (nextPostbackStateKey = createPostbackActionStateKey(permalink, componentKeyPath, actionStateHookIndex), postbackKey === nextPostbackStateKey && (actionStateMatchingIndex = actionStateHookIndex, initialState = request[0]));
			}
			var boundAction = action.bind(null, initialState);
			action = function(payload) {
				boundAction(payload);
			};
			"function" === typeof boundAction.$$FORM_ACTION && (action.$$FORM_ACTION = function(prefix$2) {
				prefix$2 = boundAction.$$FORM_ACTION(prefix$2);
				void 0 !== permalink && (permalink += "", prefix$2.action = permalink);
				var formData = prefix$2.data;
				formData && (null === nextPostbackStateKey && (nextPostbackStateKey = createPostbackActionStateKey(permalink, componentKeyPath, actionStateHookIndex)), formData.append("$ACTION_KEY", nextPostbackStateKey));
				return prefix$2;
			});
			return [
				initialState,
				action,
				!1
			];
		}
		var boundAction$22 = action.bind(null, initialState);
		return [
			initialState,
			function(payload) {
				boundAction$22(payload);
			},
			!1
		];
	}
	function unwrapThenable(thenable) {
		var index = thenableIndexCounter;
		thenableIndexCounter += 1;
		null === thenableState && (thenableState = []);
		return trackUsedThenable(thenableState, thenable, index);
	}
	function unsupportedRefresh() {
		throw Error("Cache cannot be refreshed during server rendering.");
	}
	var HooksDispatcher = {
		readContext: function(context) {
			return context._currentValue;
		},
		use: function(usable) {
			if (null !== usable && "object" === typeof usable) {
				if ("function" === typeof usable.then) return unwrapThenable(usable);
				if (usable.$$typeof === REACT_CONTEXT_TYPE) return usable._currentValue;
			}
			throw Error("An unsupported type was passed to use(): " + String(usable));
		},
		useContext: function(context) {
			resolveCurrentlyRenderingComponent();
			return context._currentValue;
		},
		useMemo,
		useReducer,
		useRef: function(initialValue) {
			currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
			workInProgressHook = createWorkInProgressHook();
			var previousRef = workInProgressHook.memoizedState;
			return null === previousRef ? (initialValue = { current: initialValue }, workInProgressHook.memoizedState = initialValue) : previousRef;
		},
		useState: function(initialState) {
			return useReducer(basicStateReducer, initialState);
		},
		useInsertionEffect: noop$2,
		useLayoutEffect: noop$2,
		useCallback: function(callback, deps) {
			return useMemo(function() {
				return callback;
			}, deps);
		},
		useImperativeHandle: noop$2,
		useEffect: noop$2,
		useDebugValue: noop$2,
		useDeferredValue: function(value, initialValue) {
			resolveCurrentlyRenderingComponent();
			return void 0 !== initialValue ? initialValue : value;
		},
		useTransition: function() {
			resolveCurrentlyRenderingComponent();
			return [!1, unsupportedStartTransition];
		},
		useId: function() {
			var JSCompiler_inline_result = currentlyRenderingTask.treeContext;
			var overflow = JSCompiler_inline_result.overflow;
			JSCompiler_inline_result = JSCompiler_inline_result.id;
			JSCompiler_inline_result = (JSCompiler_inline_result & ~(1 << 32 - clz32(JSCompiler_inline_result) - 1)).toString(32) + overflow;
			var resumableState = currentResumableState;
			if (null === resumableState) throw Error("Invalid hook call. Hooks can only be called inside of the body of a function component.");
			overflow = localIdCounter++;
			JSCompiler_inline_result = "_" + resumableState.idPrefix + "R_" + JSCompiler_inline_result;
			0 < overflow && (JSCompiler_inline_result += "H" + overflow.toString(32));
			return JSCompiler_inline_result + "_";
		},
		useSyncExternalStore: function(subscribe$1, getSnapshot, getServerSnapshot) {
			if (void 0 === getServerSnapshot) throw Error("Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering.");
			return getServerSnapshot();
		},
		useOptimistic: function(passthrough) {
			resolveCurrentlyRenderingComponent();
			return [passthrough, unsupportedSetOptimisticState];
		},
		useActionState,
		useFormState: useActionState,
		useHostTransitionStatus: function() {
			resolveCurrentlyRenderingComponent();
			return sharedNotPendingObject;
		},
		useMemoCache: function(size) {
			for (var data = Array(size), i = 0; i < size; i++) data[i] = REACT_MEMO_CACHE_SENTINEL;
			return data;
		},
		useCacheRefresh: function() {
			return unsupportedRefresh;
		},
		useEffectEvent: function() {
			return throwOnUseEffectEventCall;
		}
	}, currentResumableState = null, DefaultAsyncDispatcher = {
		getCacheForType: function() {
			throw Error("Not implemented.");
		},
		cacheSignal: function() {
			throw Error("Not implemented.");
		}
	};
	function prepareStackTrace(error, structuredStackTrace) {
		error = (error.name || "Error") + ": " + (error.message || "");
		for (var i = 0; i < structuredStackTrace.length; i++) error += "\n    at " + structuredStackTrace[i].toString();
		return error;
	}
	var prefix, suffix;
	function describeBuiltInComponentFrame(name) {
		if (void 0 === prefix) try {
			throw Error();
		} catch (x) {
			var match = x.stack.trim().match(/\n( *(at )?)/);
			prefix = match && match[1] || "";
			suffix = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + prefix + name + suffix;
	}
	var reentry = !1;
	function describeNativeComponentFrame(fn, construct) {
		if (!fn || reentry) return "";
		reentry = !0;
		var previousPrepareStackTrace = Error.prepareStackTrace;
		Error.prepareStackTrace = prepareStackTrace;
		try {
			var RunInRootFrame = { DetermineComponentFrameRoot: function() {
				try {
					if (construct) {
						var Fake = function() {
							throw Error();
						};
						Object.defineProperty(Fake.prototype, "props", { set: function() {
							throw Error();
						} });
						if ("object" === typeof Reflect && Reflect.construct) {
							try {
								Reflect.construct(Fake, []);
							} catch (x) {
								var control = x;
							}
							Reflect.construct(fn, [], Fake);
						} else {
							try {
								Fake.call();
							} catch (x$24) {
								control = x$24;
							}
							fn.call(Fake.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (x$25) {
							control = x$25;
						}
						(Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {});
					}
				} catch (sample) {
					if (sample && control && "string" === typeof sample.stack) return [sample.stack, control.stack];
				}
				return [null, null];
			} };
			RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, "name");
			namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
			if (sampleStack && controlStack) {
				var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
				for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot");) RunInRootFrame++;
				for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes("DetermineComponentFrameRoot");) namePropDescriptor++;
				if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length) for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor];) namePropDescriptor--;
				for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--) if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
					if (1 !== RunInRootFrame || 1 !== namePropDescriptor) do
						if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
							var frame = "\n" + sampleLines[RunInRootFrame].replace(" at new ", " at ");
							fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName));
							return frame;
						}
					while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
					break;
				}
			}
		} finally {
			reentry = !1, Error.prepareStackTrace = previousPrepareStackTrace;
		}
		return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
	}
	function describeComponentStackByType(type) {
		if ("string" === typeof type) return describeBuiltInComponentFrame(type);
		if ("function" === typeof type) return type.prototype && type.prototype.isReactComponent ? describeNativeComponentFrame(type, !0) : describeNativeComponentFrame(type, !1);
		if ("object" === typeof type && null !== type) {
			switch (type.$$typeof) {
				case REACT_FORWARD_REF_TYPE: return describeNativeComponentFrame(type.render, !1);
				case REACT_MEMO_TYPE: return describeNativeComponentFrame(type.type, !1);
				case REACT_LAZY_TYPE:
					var lazyComponent = type, payload = lazyComponent._payload;
					lazyComponent = lazyComponent._init;
					try {
						type = lazyComponent(payload);
					} catch (x) {
						return describeBuiltInComponentFrame("Lazy");
					}
					return describeComponentStackByType(type);
			}
			if ("string" === typeof type.name) {
				a: {
					payload = type.name;
					lazyComponent = type.env;
					var location = type.debugLocation;
					if (null != location && (type = Error.prepareStackTrace, Error.prepareStackTrace = prepareStackTrace, location = location.stack, Error.prepareStackTrace = type, location.startsWith("Error: react-stack-top-frame\n") && (location = location.slice(29)), type = location.indexOf("\n"), -1 !== type && (location = location.slice(type + 1)), type = location.indexOf("react_stack_bottom_frame"), -1 !== type && (type = location.lastIndexOf("\n", type)), type = -1 !== type ? location = location.slice(0, type) : "", location = type.lastIndexOf("\n"), type = -1 === location ? type : type.slice(location + 1), -1 !== type.indexOf(payload))) {
						payload = "\n" + type;
						break a;
					}
					payload = describeBuiltInComponentFrame(payload + (lazyComponent ? " [" + lazyComponent + "]" : ""));
				}
				return payload;
			}
		}
		switch (type) {
			case REACT_SUSPENSE_LIST_TYPE: return describeBuiltInComponentFrame("SuspenseList");
			case REACT_SUSPENSE_TYPE: return describeBuiltInComponentFrame("Suspense");
		}
		return "";
	}
	function isEligibleForOutlining(request, boundary) {
		return (500 < boundary.byteSize || hasSuspenseyContent(boundary.contentState)) && null === boundary.contentPreamble;
	}
	function defaultErrorHandler(error) {
		if ("object" === typeof error && null !== error && "string" === typeof error.environmentName) {
			var JSCompiler_inline_result = error.environmentName;
			error = [error].slice(0);
			"string" === typeof error[0] ? error.splice(0, 1, "\x1B[0m\x1B[7m%c%s\x1B[0m%c " + error[0], "background: #e6e6e6;background: light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.25));color: #000000;color: light-dark(#000000, #ffffff);border-radius: 2px", " " + JSCompiler_inline_result + " ", "") : error.splice(0, 0, "\x1B[0m\x1B[7m%c%s\x1B[0m%c", "background: #e6e6e6;background: light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.25));color: #000000;color: light-dark(#000000, #ffffff);border-radius: 2px", " " + JSCompiler_inline_result + " ", "");
			error.unshift(console);
			JSCompiler_inline_result = bind.apply(console.error, error);
			JSCompiler_inline_result();
		} else console.error(error);
		return null;
	}
	function RequestInstance(resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, formState) {
		var abortSet = /* @__PURE__ */ new Set();
		this.destination = null;
		this.flushScheduled = !1;
		this.resumableState = resumableState;
		this.renderState = renderState;
		this.rootFormatContext = rootFormatContext;
		this.progressiveChunkSize = void 0 === progressiveChunkSize ? 12800 : progressiveChunkSize;
		this.status = 10;
		this.fatalError = null;
		this.pendingRootTasks = this.allPendingTasks = this.nextSegmentId = 0;
		this.completedPreambleSegments = this.completedRootSegment = null;
		this.byteSize = 0;
		this.abortableTasks = abortSet;
		this.pingedTasks = [];
		this.clientRenderedBoundaries = [];
		this.completedBoundaries = [];
		this.partialBoundaries = [];
		this.trackedPostpones = null;
		this.onError = void 0 === onError$2 ? defaultErrorHandler : onError$2;
		this.onPostpone = void 0 === onPostpone ? noop$2 : onPostpone;
		this.onAllReady = void 0 === onAllReady ? noop$2 : onAllReady;
		this.onShellReady = void 0 === onShellReady ? noop$2 : onShellReady;
		this.onShellError = void 0 === onShellError ? noop$2 : onShellError;
		this.onFatalError = void 0 === onFatalError ? noop$2 : onFatalError;
		this.formState = void 0 === formState ? null : formState;
	}
	function createRequest(children, resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, formState) {
		resumableState = new RequestInstance(resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, formState);
		renderState = createPendingSegment(resumableState, 0, null, rootFormatContext, !1, !1);
		renderState.parentFlushed = !0;
		children = createRenderTask(resumableState, null, children, -1, null, renderState, null, null, resumableState.abortableTasks, null, rootFormatContext, null, emptyTreeContext, null, null);
		pushComponentStack(children);
		resumableState.pingedTasks.push(children);
		return resumableState;
	}
	function createPrerenderRequest(children, resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone) {
		children = createRequest(children, resumableState, renderState, rootFormatContext, progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, void 0);
		children.trackedPostpones = {
			workingMap: /* @__PURE__ */ new Map(),
			rootNodes: [],
			rootSlots: null
		};
		return children;
	}
	function resumeRequest(children, postponedState, renderState, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone) {
		renderState = new RequestInstance(postponedState.resumableState, renderState, postponedState.rootFormatContext, postponedState.progressiveChunkSize, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone, null);
		renderState.nextSegmentId = postponedState.nextSegmentId;
		if ("number" === typeof postponedState.replaySlots) return onError$2 = createPendingSegment(renderState, 0, null, postponedState.rootFormatContext, !1, !1), onError$2.parentFlushed = !0, children = createRenderTask(renderState, null, children, -1, null, onError$2, null, null, renderState.abortableTasks, null, postponedState.rootFormatContext, null, emptyTreeContext, null, null), pushComponentStack(children), renderState.pingedTasks.push(children), renderState;
		children = createReplayTask(renderState, null, {
			nodes: postponedState.replayNodes,
			slots: postponedState.replaySlots,
			pendingTasks: 0
		}, children, -1, null, null, renderState.abortableTasks, null, postponedState.rootFormatContext, null, emptyTreeContext, null, null);
		pushComponentStack(children);
		renderState.pingedTasks.push(children);
		return renderState;
	}
	function resumeAndPrerenderRequest(children, postponedState, renderState, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone) {
		children = resumeRequest(children, postponedState, renderState, onError$2, onAllReady, onShellReady, onShellError, onFatalError, onPostpone);
		children.trackedPostpones = {
			workingMap: /* @__PURE__ */ new Map(),
			rootNodes: [],
			rootSlots: null
		};
		return children;
	}
	var currentRequest = null;
	function resolveRequest() {
		if (currentRequest) return currentRequest;
		var store = requestStorage.getStore();
		return store ? store : null;
	}
	function pingTask(request, task) {
		request.pingedTasks.push(task);
		1 === request.pingedTasks.length && (request.flushScheduled = null !== request.destination, null !== request.trackedPostpones || 10 === request.status ? scheduleMicrotask(function() {
			return performWork(request);
		}) : setImmediate(function() {
			return performWork(request);
		}));
	}
	function createSuspenseBoundary(request, row, fallbackAbortableTasks, contentPreamble, fallbackPreamble) {
		fallbackAbortableTasks = {
			status: 0,
			rootSegmentID: -1,
			parentFlushed: !1,
			pendingTasks: 0,
			row,
			completedSegments: [],
			byteSize: 0,
			fallbackAbortableTasks,
			errorDigest: null,
			contentState: createHoistableState(),
			fallbackState: createHoistableState(),
			contentPreamble,
			fallbackPreamble,
			trackedContentKeyPath: null,
			trackedFallbackNode: null
		};
		null !== row && (row.pendingTasks++, contentPreamble = row.boundaries, null !== contentPreamble && (request.allPendingTasks++, fallbackAbortableTasks.pendingTasks++, contentPreamble.push(fallbackAbortableTasks)), request = row.inheritedHoistables, null !== request && hoistHoistables(fallbackAbortableTasks.contentState, request));
		return fallbackAbortableTasks;
	}
	function createRenderTask(request, thenableState$2, node, childIndex, blockedBoundary, blockedSegment, blockedPreamble, hoistableState, abortSet, keyPath, formatContext, context, treeContext, row, componentStack) {
		request.allPendingTasks++;
		null === blockedBoundary ? request.pendingRootTasks++ : blockedBoundary.pendingTasks++;
		null !== row && row.pendingTasks++;
		var task = {
			replay: null,
			node,
			childIndex,
			ping: function() {
				return pingTask(request, task);
			},
			blockedBoundary,
			blockedSegment,
			blockedPreamble,
			hoistableState,
			abortSet,
			keyPath,
			formatContext,
			context,
			treeContext,
			row,
			componentStack,
			thenableState: thenableState$2
		};
		abortSet.add(task);
		return task;
	}
	function createReplayTask(request, thenableState$2, replay, node, childIndex, blockedBoundary, hoistableState, abortSet, keyPath, formatContext, context, treeContext, row, componentStack) {
		request.allPendingTasks++;
		null === blockedBoundary ? request.pendingRootTasks++ : blockedBoundary.pendingTasks++;
		null !== row && row.pendingTasks++;
		replay.pendingTasks++;
		var task = {
			replay,
			node,
			childIndex,
			ping: function() {
				return pingTask(request, task);
			},
			blockedBoundary,
			blockedSegment: null,
			blockedPreamble: null,
			hoistableState,
			abortSet,
			keyPath,
			formatContext,
			context,
			treeContext,
			row,
			componentStack,
			thenableState: thenableState$2
		};
		abortSet.add(task);
		return task;
	}
	function createPendingSegment(request, index, boundary, parentFormatContext, lastPushedText, textEmbedded) {
		return {
			status: 0,
			parentFlushed: !1,
			id: -1,
			index,
			chunks: [],
			children: [],
			preambleChildren: [],
			parentFormatContext,
			boundary,
			lastPushedText,
			textEmbedded
		};
	}
	function pushComponentStack(task) {
		var node = task.node;
		if ("object" === typeof node && null !== node) switch (node.$$typeof) {
			case REACT_ELEMENT_TYPE: task.componentStack = {
				parent: task.componentStack,
				type: node.type
			};
		}
	}
	function replaceSuspenseComponentStackWithSuspenseFallbackStack(componentStack) {
		return null === componentStack ? null : {
			parent: componentStack.parent,
			type: "Suspense Fallback"
		};
	}
	function getThrownInfo(node$jscomp$0) {
		var errorInfo = {};
		node$jscomp$0 && Object.defineProperty(errorInfo, "componentStack", {
			configurable: !0,
			enumerable: !0,
			get: function() {
				try {
					var info = "", node = node$jscomp$0;
					do
						info += describeComponentStackByType(node.type), node = node.parent;
					while (node);
					var JSCompiler_inline_result = info;
				} catch (x) {
					JSCompiler_inline_result = "\nError generating stack: " + x.message + "\n" + x.stack;
				}
				Object.defineProperty(errorInfo, "componentStack", { value: JSCompiler_inline_result });
				return JSCompiler_inline_result;
			}
		});
		return errorInfo;
	}
	function logRecoverableError(request, error, errorInfo) {
		request = request.onError;
		error = request(error, errorInfo);
		if (null == error || "string" === typeof error) return error;
	}
	function fatalError(request, error) {
		var onShellError = request.onShellError, onFatalError = request.onFatalError;
		onShellError(error);
		onFatalError(error);
		null !== request.destination ? (request.status = 14, request.destination.destroy(error)) : (request.status = 13, request.fatalError = error);
	}
	function finishSuspenseListRow(request, row) {
		unblockSuspenseListRow(request, row.next, row.hoistables);
	}
	function unblockSuspenseListRow(request, unblockedRow, inheritedHoistables) {
		for (; null !== unblockedRow;) {
			null !== inheritedHoistables && (hoistHoistables(unblockedRow.hoistables, inheritedHoistables), unblockedRow.inheritedHoistables = inheritedHoistables);
			var unblockedBoundaries = unblockedRow.boundaries;
			if (null !== unblockedBoundaries) {
				unblockedRow.boundaries = null;
				for (var i = 0; i < unblockedBoundaries.length; i++) {
					var unblockedBoundary = unblockedBoundaries[i];
					null !== inheritedHoistables && hoistHoistables(unblockedBoundary.contentState, inheritedHoistables);
					finishedTask(request, unblockedBoundary, null, null);
				}
			}
			unblockedRow.pendingTasks--;
			if (0 < unblockedRow.pendingTasks) break;
			inheritedHoistables = unblockedRow.hoistables;
			unblockedRow = unblockedRow.next;
		}
	}
	function tryToResolveTogetherRow(request, togetherRow) {
		var boundaries = togetherRow.boundaries;
		if (null !== boundaries && togetherRow.pendingTasks === boundaries.length) {
			for (var allCompleteAndInlinable = !0, i = 0; i < boundaries.length; i++) {
				var rowBoundary = boundaries[i];
				if (1 !== rowBoundary.pendingTasks || rowBoundary.parentFlushed || isEligibleForOutlining(request, rowBoundary)) {
					allCompleteAndInlinable = !1;
					break;
				}
			}
			allCompleteAndInlinable && unblockSuspenseListRow(request, togetherRow, togetherRow.hoistables);
		}
	}
	function createSuspenseListRow(previousRow) {
		var newRow = {
			pendingTasks: 1,
			boundaries: null,
			hoistables: createHoistableState(),
			inheritedHoistables: null,
			together: !1,
			next: null
		};
		null !== previousRow && 0 < previousRow.pendingTasks && (newRow.pendingTasks++, newRow.boundaries = [], previousRow.next = newRow);
		return newRow;
	}
	function renderSuspenseListRows(request, task, keyPath, rows, revealOrder) {
		var prevKeyPath = task.keyPath, prevTreeContext = task.treeContext, prevRow = task.row;
		task.keyPath = keyPath;
		keyPath = rows.length;
		var previousSuspenseListRow = null;
		if (null !== task.replay) {
			var resumeSlots = task.replay.slots;
			if (null !== resumeSlots && "object" === typeof resumeSlots) for (var n = 0; n < keyPath; n++) {
				var i = "backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder ? n : keyPath - 1 - n, node = rows[i];
				task.row = previousSuspenseListRow = createSuspenseListRow(previousSuspenseListRow);
				task.treeContext = pushTreeContext(prevTreeContext, keyPath, i);
				var resumeSegmentID = resumeSlots[i];
				"number" === typeof resumeSegmentID ? (resumeNode(request, task, resumeSegmentID, node, i), delete resumeSlots[i]) : renderNode(request, task, node, i);
				0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow(request, previousSuspenseListRow);
			}
			else for (resumeSlots = 0; resumeSlots < keyPath; resumeSlots++) n = "backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder ? resumeSlots : keyPath - 1 - resumeSlots, i = rows[n], task.row = previousSuspenseListRow = createSuspenseListRow(previousSuspenseListRow), task.treeContext = pushTreeContext(prevTreeContext, keyPath, n), renderNode(request, task, i, n), 0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow(request, previousSuspenseListRow);
		} else if ("backwards" !== revealOrder && "unstable_legacy-backwards" !== revealOrder) for (revealOrder = 0; revealOrder < keyPath; revealOrder++) resumeSlots = rows[revealOrder], task.row = previousSuspenseListRow = createSuspenseListRow(previousSuspenseListRow), task.treeContext = pushTreeContext(prevTreeContext, keyPath, revealOrder), renderNode(request, task, resumeSlots, revealOrder), 0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow(request, previousSuspenseListRow);
		else {
			revealOrder = task.blockedSegment;
			resumeSlots = revealOrder.children.length;
			n = revealOrder.chunks.length;
			for (i = keyPath - 1; 0 <= i; i--) {
				node = rows[i];
				task.row = previousSuspenseListRow = createSuspenseListRow(previousSuspenseListRow);
				task.treeContext = pushTreeContext(prevTreeContext, keyPath, i);
				resumeSegmentID = createPendingSegment(request, n, null, task.formatContext, 0 === i ? revealOrder.lastPushedText : !0, !0);
				revealOrder.children.splice(resumeSlots, 0, resumeSegmentID);
				task.blockedSegment = resumeSegmentID;
				try {
					renderNode(request, task, node, i), resumeSegmentID.lastPushedText && resumeSegmentID.textEmbedded && resumeSegmentID.chunks.push(textSeparator), resumeSegmentID.status = 1, finishedSegment(request, task.blockedBoundary, resumeSegmentID), 0 === --previousSuspenseListRow.pendingTasks && finishSuspenseListRow(request, previousSuspenseListRow);
				} catch (thrownValue) {
					throw resumeSegmentID.status = 12 === request.status ? 3 : 4, thrownValue;
				}
			}
			task.blockedSegment = revealOrder;
			revealOrder.lastPushedText = !1;
		}
		null !== prevRow && null !== previousSuspenseListRow && 0 < previousSuspenseListRow.pendingTasks && (prevRow.pendingTasks++, previousSuspenseListRow.next = prevRow);
		task.treeContext = prevTreeContext;
		task.row = prevRow;
		task.keyPath = prevKeyPath;
	}
	function renderWithHooks(request, task, keyPath, Component$1, props, secondArg) {
		var prevThenableState = task.thenableState;
		task.thenableState = null;
		currentlyRenderingComponent = {};
		currentlyRenderingTask = task;
		currentlyRenderingRequest = request;
		currentlyRenderingKeyPath = keyPath;
		actionStateCounter = localIdCounter = 0;
		actionStateMatchingIndex = -1;
		thenableIndexCounter = 0;
		thenableState = prevThenableState;
		for (request = Component$1(props, secondArg); didScheduleRenderPhaseUpdate;) didScheduleRenderPhaseUpdate = !1, actionStateCounter = localIdCounter = 0, actionStateMatchingIndex = -1, thenableIndexCounter = 0, numberOfReRenders += 1, workInProgressHook = null, request = Component$1(props, secondArg);
		resetHooksState();
		return request;
	}
	function finishFunctionComponent(request, task, keyPath, children, hasId, actionStateCount, actionStateMatchingIndex$2) {
		var didEmitActionStateMarkers = !1;
		if (0 !== actionStateCount && null !== request.formState) {
			var segment = task.blockedSegment;
			if (null !== segment) {
				didEmitActionStateMarkers = !0;
				segment = segment.chunks;
				for (var i = 0; i < actionStateCount; i++) i === actionStateMatchingIndex$2 ? segment.push(formStateMarkerIsMatching) : segment.push(formStateMarkerIsNotMatching);
			}
		}
		actionStateCount = task.keyPath;
		task.keyPath = keyPath;
		hasId ? (keyPath = task.treeContext, task.treeContext = pushTreeContext(keyPath, 1, 0), renderNode(request, task, children, -1), task.treeContext = keyPath) : didEmitActionStateMarkers ? renderNode(request, task, children, -1) : renderNodeDestructive(request, task, children, -1);
		task.keyPath = actionStateCount;
	}
	function renderElement(request, task, keyPath, type, props, ref) {
		if ("function" === typeof type) if (type.prototype && type.prototype.isReactComponent) {
			var newProps = props;
			if ("ref" in props) {
				newProps = {};
				for (var propName in props) "ref" !== propName && (newProps[propName] = props[propName]);
			}
			var defaultProps = type.defaultProps;
			if (defaultProps) {
				newProps === props && (newProps = assign({}, newProps, props));
				for (var propName$44 in defaultProps) void 0 === newProps[propName$44] && (newProps[propName$44] = defaultProps[propName$44]);
			}
			props = newProps;
			newProps = emptyContextObject;
			defaultProps = type.contextType;
			"object" === typeof defaultProps && null !== defaultProps && (newProps = defaultProps._currentValue);
			newProps = new type(props, newProps);
			var initialState = void 0 !== newProps.state ? newProps.state : null;
			newProps.updater = classComponentUpdater;
			newProps.props = props;
			newProps.state = initialState;
			defaultProps = {
				queue: [],
				replace: !1
			};
			newProps._reactInternals = defaultProps;
			ref = type.contextType;
			newProps.context = "object" === typeof ref && null !== ref ? ref._currentValue : emptyContextObject;
			ref = type.getDerivedStateFromProps;
			"function" === typeof ref && (ref = ref(props, initialState), initialState = null === ref || void 0 === ref ? initialState : assign({}, initialState, ref), newProps.state = initialState);
			if ("function" !== typeof type.getDerivedStateFromProps && "function" !== typeof newProps.getSnapshotBeforeUpdate && ("function" === typeof newProps.UNSAFE_componentWillMount || "function" === typeof newProps.componentWillMount)) if (type = newProps.state, "function" === typeof newProps.componentWillMount && newProps.componentWillMount(), "function" === typeof newProps.UNSAFE_componentWillMount && newProps.UNSAFE_componentWillMount(), type !== newProps.state && classComponentUpdater.enqueueReplaceState(newProps, newProps.state, null), null !== defaultProps.queue && 0 < defaultProps.queue.length) if (type = defaultProps.queue, ref = defaultProps.replace, defaultProps.queue = null, defaultProps.replace = !1, ref && 1 === type.length) newProps.state = type[0];
			else {
				defaultProps = ref ? type[0] : newProps.state;
				initialState = !0;
				for (ref = ref ? 1 : 0; ref < type.length; ref++) propName$44 = type[ref], propName$44 = "function" === typeof propName$44 ? propName$44.call(newProps, defaultProps, props, void 0) : propName$44, null != propName$44 && (initialState ? (initialState = !1, defaultProps = assign({}, defaultProps, propName$44)) : assign(defaultProps, propName$44));
				newProps.state = defaultProps;
			}
			else defaultProps.queue = null;
			type = newProps.render();
			if (12 === request.status) throw null;
			props = task.keyPath;
			task.keyPath = keyPath;
			renderNodeDestructive(request, task, type, -1);
			task.keyPath = props;
		} else {
			type = renderWithHooks(request, task, keyPath, type, props, void 0);
			if (12 === request.status) throw null;
			finishFunctionComponent(request, task, keyPath, type, 0 !== localIdCounter, actionStateCounter, actionStateMatchingIndex);
		}
		else if ("string" === typeof type) if (newProps = task.blockedSegment, null === newProps) newProps = props.children, defaultProps = task.formatContext, initialState = task.keyPath, task.formatContext = getChildFormatContext(defaultProps, type, props), task.keyPath = keyPath, renderNode(request, task, newProps, -1), task.formatContext = defaultProps, task.keyPath = initialState;
		else {
			initialState = pushStartInstance(newProps.chunks, type, props, request.resumableState, request.renderState, task.blockedPreamble, task.hoistableState, task.formatContext, newProps.lastPushedText);
			newProps.lastPushedText = !1;
			defaultProps = task.formatContext;
			ref = task.keyPath;
			task.keyPath = keyPath;
			if (3 === (task.formatContext = getChildFormatContext(defaultProps, type, props)).insertionMode) {
				keyPath = createPendingSegment(request, 0, null, task.formatContext, !1, !1);
				newProps.preambleChildren.push(keyPath);
				task.blockedSegment = keyPath;
				try {
					keyPath.status = 6, renderNode(request, task, initialState, -1), keyPath.lastPushedText && keyPath.textEmbedded && keyPath.chunks.push(textSeparator), keyPath.status = 1, finishedSegment(request, task.blockedBoundary, keyPath);
				} finally {
					task.blockedSegment = newProps;
				}
			} else renderNode(request, task, initialState, -1);
			task.formatContext = defaultProps;
			task.keyPath = ref;
			a: {
				task = newProps.chunks;
				request = request.resumableState;
				switch (type) {
					case "title":
					case "style":
					case "script":
					case "area":
					case "base":
					case "br":
					case "col":
					case "embed":
					case "hr":
					case "img":
					case "input":
					case "keygen":
					case "link":
					case "meta":
					case "param":
					case "source":
					case "track":
					case "wbr": break a;
					case "body":
						if (1 >= defaultProps.insertionMode) {
							request.hasBody = !0;
							break a;
						}
						break;
					case "html":
						if (0 === defaultProps.insertionMode) {
							request.hasHtml = !0;
							break a;
						}
						break;
					case "head": if (1 >= defaultProps.insertionMode) break a;
				}
				task.push(endChunkForTag(type));
			}
			newProps.lastPushedText = !1;
		}
		else {
			switch (type) {
				case REACT_LEGACY_HIDDEN_TYPE:
				case REACT_STRICT_MODE_TYPE:
				case REACT_PROFILER_TYPE:
				case REACT_FRAGMENT_TYPE:
					type = task.keyPath;
					task.keyPath = keyPath;
					renderNodeDestructive(request, task, props.children, -1);
					task.keyPath = type;
					return;
				case REACT_ACTIVITY_TYPE:
					type = task.blockedSegment;
					null === type ? "hidden" !== props.mode && (type = task.keyPath, task.keyPath = keyPath, renderNode(request, task, props.children, -1), task.keyPath = type) : "hidden" !== props.mode && (type.chunks.push(startActivityBoundary), type.lastPushedText = !1, newProps = task.keyPath, task.keyPath = keyPath, renderNode(request, task, props.children, -1), task.keyPath = newProps, type.chunks.push(endActivityBoundary), type.lastPushedText = !1);
					return;
				case REACT_SUSPENSE_LIST_TYPE:
					a: {
						type = props.children;
						props = props.revealOrder;
						if ("forwards" === props || "backwards" === props || "unstable_legacy-backwards" === props) {
							if (isArrayImpl(type)) {
								renderSuspenseListRows(request, task, keyPath, type, props);
								break a;
							}
							if (newProps = getIteratorFn(type)) {
								if (newProps = newProps.call(type)) {
									defaultProps = newProps.next();
									if (!defaultProps.done) {
										do
											defaultProps = newProps.next();
										while (!defaultProps.done);
										renderSuspenseListRows(request, task, keyPath, type, props);
									}
									break a;
								}
							}
						}
						"together" === props ? (props = task.keyPath, newProps = task.row, defaultProps = task.row = createSuspenseListRow(null), defaultProps.boundaries = [], defaultProps.together = !0, task.keyPath = keyPath, renderNodeDestructive(request, task, type, -1), 0 === --defaultProps.pendingTasks && finishSuspenseListRow(request, defaultProps), task.keyPath = props, task.row = newProps, null !== newProps && 0 < defaultProps.pendingTasks && (newProps.pendingTasks++, defaultProps.next = newProps)) : (props = task.keyPath, task.keyPath = keyPath, renderNodeDestructive(request, task, type, -1), task.keyPath = props);
					}
					return;
				case REACT_VIEW_TRANSITION_TYPE:
				case REACT_SCOPE_TYPE: throw Error("ReactDOMServer does not yet support scope components.");
				case REACT_SUSPENSE_TYPE:
					a: if (null !== task.replay) {
						type = task.keyPath;
						newProps = task.formatContext;
						defaultProps = task.row;
						task.keyPath = keyPath;
						task.formatContext = getSuspenseContentFormatContext(request.resumableState, newProps);
						task.row = null;
						keyPath = props.children;
						try {
							renderNode(request, task, keyPath, -1);
						} finally {
							task.keyPath = type, task.formatContext = newProps, task.row = defaultProps;
						}
					} else {
						type = task.keyPath;
						ref = task.formatContext;
						var prevRow = task.row;
						propName$44 = task.blockedBoundary;
						propName = task.blockedPreamble;
						var parentHoistableState = task.hoistableState, parentSegment = task.blockedSegment, fallback = props.fallback;
						props = props.children;
						var fallbackAbortSet = /* @__PURE__ */ new Set();
						var newBoundary = 2 > task.formatContext.insertionMode ? createSuspenseBoundary(request, task.row, fallbackAbortSet, createPreambleState(), createPreambleState()) : createSuspenseBoundary(request, task.row, fallbackAbortSet, null, null);
						null !== request.trackedPostpones && (newBoundary.trackedContentKeyPath = keyPath);
						var boundarySegment = createPendingSegment(request, parentSegment.chunks.length, newBoundary, task.formatContext, !1, !1);
						parentSegment.children.push(boundarySegment);
						parentSegment.lastPushedText = !1;
						var contentRootSegment = createPendingSegment(request, 0, null, task.formatContext, !1, !1);
						contentRootSegment.parentFlushed = !0;
						if (null !== request.trackedPostpones) {
							newProps = task.componentStack;
							defaultProps = [
								keyPath[0],
								"Suspense Fallback",
								keyPath[2]
							];
							initialState = [
								defaultProps[1],
								defaultProps[2],
								[],
								null
							];
							request.trackedPostpones.workingMap.set(defaultProps, initialState);
							newBoundary.trackedFallbackNode = initialState;
							task.blockedSegment = boundarySegment;
							task.blockedPreamble = newBoundary.fallbackPreamble;
							task.keyPath = defaultProps;
							task.formatContext = getSuspenseFallbackFormatContext(request.resumableState, ref);
							task.componentStack = replaceSuspenseComponentStackWithSuspenseFallbackStack(newProps);
							boundarySegment.status = 6;
							try {
								renderNode(request, task, fallback, -1), boundarySegment.lastPushedText && boundarySegment.textEmbedded && boundarySegment.chunks.push(textSeparator), boundarySegment.status = 1, finishedSegment(request, propName$44, boundarySegment);
							} catch (thrownValue) {
								throw boundarySegment.status = 12 === request.status ? 3 : 4, thrownValue;
							} finally {
								task.blockedSegment = parentSegment, task.blockedPreamble = propName, task.keyPath = type, task.formatContext = ref;
							}
							task = createRenderTask(request, null, props, -1, newBoundary, contentRootSegment, newBoundary.contentPreamble, newBoundary.contentState, task.abortSet, keyPath, getSuspenseContentFormatContext(request.resumableState, task.formatContext), task.context, task.treeContext, null, newProps);
							pushComponentStack(task);
							request.pingedTasks.push(task);
						} else {
							task.blockedBoundary = newBoundary;
							task.blockedPreamble = newBoundary.contentPreamble;
							task.hoistableState = newBoundary.contentState;
							task.blockedSegment = contentRootSegment;
							task.keyPath = keyPath;
							task.formatContext = getSuspenseContentFormatContext(request.resumableState, ref);
							task.row = null;
							contentRootSegment.status = 6;
							try {
								if (renderNode(request, task, props, -1), contentRootSegment.lastPushedText && contentRootSegment.textEmbedded && contentRootSegment.chunks.push(textSeparator), contentRootSegment.status = 1, finishedSegment(request, newBoundary, contentRootSegment), queueCompletedSegment(newBoundary, contentRootSegment), 0 === newBoundary.pendingTasks && 0 === newBoundary.status) {
									if (newBoundary.status = 1, !isEligibleForOutlining(request, newBoundary)) {
										null !== prevRow && 0 === --prevRow.pendingTasks && finishSuspenseListRow(request, prevRow);
										0 === request.pendingRootTasks && task.blockedPreamble && preparePreamble(request);
										break a;
									}
								} else null !== prevRow && prevRow.together && tryToResolveTogetherRow(request, prevRow);
							} catch (thrownValue$31) {
								newBoundary.status = 4, 12 === request.status ? (contentRootSegment.status = 3, newProps = request.fatalError) : (contentRootSegment.status = 4, newProps = thrownValue$31), defaultProps = getThrownInfo(task.componentStack), initialState = logRecoverableError(request, newProps, defaultProps), newBoundary.errorDigest = initialState, untrackBoundary(request, newBoundary);
							} finally {
								task.blockedBoundary = propName$44, task.blockedPreamble = propName, task.hoistableState = parentHoistableState, task.blockedSegment = parentSegment, task.keyPath = type, task.formatContext = ref, task.row = prevRow;
							}
							task = createRenderTask(request, null, fallback, -1, propName$44, boundarySegment, newBoundary.fallbackPreamble, newBoundary.fallbackState, fallbackAbortSet, [
								keyPath[0],
								"Suspense Fallback",
								keyPath[2]
							], getSuspenseFallbackFormatContext(request.resumableState, task.formatContext), task.context, task.treeContext, task.row, replaceSuspenseComponentStackWithSuspenseFallbackStack(task.componentStack));
							pushComponentStack(task);
							request.pingedTasks.push(task);
						}
					}
					return;
			}
			if ("object" === typeof type && null !== type) switch (type.$$typeof) {
				case REACT_FORWARD_REF_TYPE:
					if ("ref" in props) for (parentSegment in newProps = {}, props) "ref" !== parentSegment && (newProps[parentSegment] = props[parentSegment]);
					else newProps = props;
					type = renderWithHooks(request, task, keyPath, type.render, newProps, ref);
					finishFunctionComponent(request, task, keyPath, type, 0 !== localIdCounter, actionStateCounter, actionStateMatchingIndex);
					return;
				case REACT_MEMO_TYPE:
					renderElement(request, task, keyPath, type.type, props, ref);
					return;
				case REACT_CONTEXT_TYPE:
					defaultProps = props.children;
					newProps = task.keyPath;
					props = props.value;
					initialState = type._currentValue;
					type._currentValue = props;
					ref = currentActiveSnapshot;
					currentActiveSnapshot = type = {
						parent: ref,
						depth: null === ref ? 0 : ref.depth + 1,
						context: type,
						parentValue: initialState,
						value: props
					};
					task.context = type;
					task.keyPath = keyPath;
					renderNodeDestructive(request, task, defaultProps, -1);
					request = currentActiveSnapshot;
					if (null === request) throw Error("Tried to pop a Context at the root of the app. This is a bug in React.");
					request.context._currentValue = request.parentValue;
					request = currentActiveSnapshot = request.parent;
					task.context = request;
					task.keyPath = newProps;
					return;
				case REACT_CONSUMER_TYPE:
					props = props.children;
					type = props(type._context._currentValue);
					props = task.keyPath;
					task.keyPath = keyPath;
					renderNodeDestructive(request, task, type, -1);
					task.keyPath = props;
					return;
				case REACT_LAZY_TYPE:
					newProps = type._init;
					type = newProps(type._payload);
					if (12 === request.status) throw null;
					renderElement(request, task, keyPath, type, props, ref);
					return;
			}
			throw Error("Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " + ((null == type ? type : typeof type) + "."));
		}
	}
	function resumeNode(request, task, segmentId, node, childIndex) {
		var prevReplay = task.replay, blockedBoundary = task.blockedBoundary, resumedSegment = createPendingSegment(request, 0, null, task.formatContext, !1, !1);
		resumedSegment.id = segmentId;
		resumedSegment.parentFlushed = !0;
		try {
			task.replay = null, task.blockedSegment = resumedSegment, renderNode(request, task, node, childIndex), resumedSegment.status = 1, finishedSegment(request, blockedBoundary, resumedSegment), null === blockedBoundary ? request.completedRootSegment = resumedSegment : (queueCompletedSegment(blockedBoundary, resumedSegment), blockedBoundary.parentFlushed && request.partialBoundaries.push(blockedBoundary));
		} finally {
			task.replay = prevReplay, task.blockedSegment = null;
		}
	}
	function renderNodeDestructive(request, task, node, childIndex) {
		null !== task.replay && "number" === typeof task.replay.slots ? resumeNode(request, task, task.replay.slots, node, childIndex) : (task.node = node, task.childIndex = childIndex, node = task.componentStack, pushComponentStack(task), retryNode(request, task), task.componentStack = node);
	}
	function retryNode(request, task) {
		var node = task.node, childIndex = task.childIndex;
		if (null !== node) {
			if ("object" === typeof node) {
				switch (node.$$typeof) {
					case REACT_ELEMENT_TYPE:
						var type = node.type, key = node.key, props = node.props;
						node = props.ref;
						var ref = void 0 !== node ? node : null, name = getComponentNameFromType(type), keyOrIndex = null == key ? -1 === childIndex ? 0 : childIndex : key;
						key = [
							task.keyPath,
							name,
							keyOrIndex
						];
						if (null !== task.replay) a: {
							var replay = task.replay;
							childIndex = replay.nodes;
							for (node = 0; node < childIndex.length; node++) {
								var node$jscomp$0 = childIndex[node];
								if (keyOrIndex === node$jscomp$0[1]) {
									if (4 === node$jscomp$0.length) {
										if (null !== name && name !== node$jscomp$0[0]) throw Error("Expected the resume to render <" + node$jscomp$0[0] + "> in this slot but instead it rendered <" + name + ">. The tree doesn't match so React will fallback to client rendering.");
										var childNodes = node$jscomp$0[2];
										name = node$jscomp$0[3];
										keyOrIndex = task.node;
										task.replay = {
											nodes: childNodes,
											slots: name,
											pendingTasks: 1
										};
										try {
											renderElement(request, task, key, type, props, ref);
											if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
											task.replay.pendingTasks--;
										} catch (x) {
											if ("object" === typeof x && null !== x && (x === SuspenseException || "function" === typeof x.then)) throw task.node === keyOrIndex ? task.replay = replay : childIndex.splice(node, 1), x;
											task.replay.pendingTasks--;
											props = getThrownInfo(task.componentStack);
											key = request;
											request = task.blockedBoundary;
											type = x;
											props = logRecoverableError(key, type, props);
											abortRemainingReplayNodes(key, request, childNodes, name, type, props);
										}
										task.replay = replay;
									} else {
										if (type !== REACT_SUSPENSE_TYPE) throw Error("Expected the resume to render <Suspense> in this slot but instead it rendered <" + (getComponentNameFromType(type) || "Unknown") + ">. The tree doesn't match so React will fallback to client rendering.");
										b: {
											replay = void 0;
											type = node$jscomp$0[5];
											ref = node$jscomp$0[2];
											name = node$jscomp$0[3];
											keyOrIndex = null === node$jscomp$0[4] ? [] : node$jscomp$0[4][2];
											node$jscomp$0 = null === node$jscomp$0[4] ? null : node$jscomp$0[4][3];
											var prevKeyPath = task.keyPath, prevContext = task.formatContext, prevRow = task.row, previousReplaySet = task.replay, parentBoundary = task.blockedBoundary, parentHoistableState = task.hoistableState, content = props.children, fallback = props.fallback, fallbackAbortSet = /* @__PURE__ */ new Set();
											props = 2 > task.formatContext.insertionMode ? createSuspenseBoundary(request, task.row, fallbackAbortSet, createPreambleState(), createPreambleState()) : createSuspenseBoundary(request, task.row, fallbackAbortSet, null, null);
											props.parentFlushed = !0;
											props.rootSegmentID = type;
											task.blockedBoundary = props;
											task.hoistableState = props.contentState;
											task.keyPath = key;
											task.formatContext = getSuspenseContentFormatContext(request.resumableState, prevContext);
											task.row = null;
											task.replay = {
												nodes: ref,
												slots: name,
												pendingTasks: 1
											};
											try {
												renderNode(request, task, content, -1);
												if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
												task.replay.pendingTasks--;
												if (0 === props.pendingTasks && 0 === props.status) {
													props.status = 1;
													request.completedBoundaries.push(props);
													break b;
												}
											} catch (error) {
												props.status = 4, childNodes = getThrownInfo(task.componentStack), replay = logRecoverableError(request, error, childNodes), props.errorDigest = replay, task.replay.pendingTasks--, request.clientRenderedBoundaries.push(props);
											} finally {
												task.blockedBoundary = parentBoundary, task.hoistableState = parentHoistableState, task.replay = previousReplaySet, task.keyPath = prevKeyPath, task.formatContext = prevContext, task.row = prevRow;
											}
											childNodes = createReplayTask(request, null, {
												nodes: keyOrIndex,
												slots: node$jscomp$0,
												pendingTasks: 0
											}, fallback, -1, parentBoundary, props.fallbackState, fallbackAbortSet, [
												key[0],
												"Suspense Fallback",
												key[2]
											], getSuspenseFallbackFormatContext(request.resumableState, task.formatContext), task.context, task.treeContext, task.row, replaceSuspenseComponentStackWithSuspenseFallbackStack(task.componentStack));
											pushComponentStack(childNodes);
											request.pingedTasks.push(childNodes);
										}
									}
									childIndex.splice(node, 1);
									break a;
								}
							}
						}
						else renderElement(request, task, key, type, props, ref);
						return;
					case REACT_PORTAL_TYPE: throw Error("Portals are not currently supported by the server renderer. Render them conditionally so that they only appear on the client render.");
					case REACT_LAZY_TYPE:
						childNodes = node._init;
						node = childNodes(node._payload);
						if (12 === request.status) throw null;
						renderNodeDestructive(request, task, node, childIndex);
						return;
				}
				if (isArrayImpl(node)) {
					renderChildrenArray(request, task, node, childIndex);
					return;
				}
				if (childNodes = getIteratorFn(node)) {
					if (childNodes = childNodes.call(node)) {
						node = childNodes.next();
						if (!node.done) {
							props = [];
							do
								props.push(node.value), node = childNodes.next();
							while (!node.done);
							renderChildrenArray(request, task, props, childIndex);
						}
						return;
					}
				}
				if ("function" === typeof node.then) return task.thenableState = null, renderNodeDestructive(request, task, unwrapThenable(node), childIndex);
				if (node.$$typeof === REACT_CONTEXT_TYPE) return renderNodeDestructive(request, task, node._currentValue, childIndex);
				childIndex = Object.prototype.toString.call(node);
				throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === childIndex ? "object with keys {" + Object.keys(node).join(", ") + "}" : childIndex) + "). If you meant to render a collection of children, use an array instead.");
			}
			if ("string" === typeof node) childIndex = task.blockedSegment, null !== childIndex && (childIndex.lastPushedText = pushTextInstance(childIndex.chunks, node, request.renderState, childIndex.lastPushedText));
			else if ("number" === typeof node || "bigint" === typeof node) childIndex = task.blockedSegment, null !== childIndex && (childIndex.lastPushedText = pushTextInstance(childIndex.chunks, "" + node, request.renderState, childIndex.lastPushedText));
		}
	}
	function renderChildrenArray(request, task, children, childIndex) {
		var prevKeyPath = task.keyPath;
		if (-1 !== childIndex && (task.keyPath = [
			task.keyPath,
			"Fragment",
			childIndex
		], null !== task.replay)) {
			for (var replay = task.replay, replayNodes = replay.nodes, j = 0; j < replayNodes.length; j++) {
				var node = replayNodes[j];
				if (node[1] === childIndex) {
					childIndex = node[2];
					node = node[3];
					task.replay = {
						nodes: childIndex,
						slots: node,
						pendingTasks: 1
					};
					try {
						renderChildrenArray(request, task, children, -1);
						if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
						task.replay.pendingTasks--;
					} catch (x) {
						if ("object" === typeof x && null !== x && (x === SuspenseException || "function" === typeof x.then)) throw x;
						task.replay.pendingTasks--;
						children = getThrownInfo(task.componentStack);
						var boundary = task.blockedBoundary, error = x;
						children = logRecoverableError(request, error, children);
						abortRemainingReplayNodes(request, boundary, childIndex, node, error, children);
					}
					task.replay = replay;
					replayNodes.splice(j, 1);
					break;
				}
			}
			task.keyPath = prevKeyPath;
			return;
		}
		replay = task.treeContext;
		replayNodes = children.length;
		if (null !== task.replay && (j = task.replay.slots, null !== j && "object" === typeof j)) {
			for (childIndex = 0; childIndex < replayNodes; childIndex++) node = children[childIndex], task.treeContext = pushTreeContext(replay, replayNodes, childIndex), boundary = j[childIndex], "number" === typeof boundary ? (resumeNode(request, task, boundary, node, childIndex), delete j[childIndex]) : renderNode(request, task, node, childIndex);
			task.treeContext = replay;
			task.keyPath = prevKeyPath;
			return;
		}
		for (j = 0; j < replayNodes; j++) childIndex = children[j], task.treeContext = pushTreeContext(replay, replayNodes, j), renderNode(request, task, childIndex, j);
		task.treeContext = replay;
		task.keyPath = prevKeyPath;
	}
	function trackPostponedBoundary(request, trackedPostpones, boundary) {
		boundary.status = 5;
		boundary.rootSegmentID = request.nextSegmentId++;
		request = boundary.trackedContentKeyPath;
		if (null === request) throw Error("It should not be possible to postpone at the root. This is a bug in React.");
		var fallbackReplayNode = boundary.trackedFallbackNode, children = [], boundaryNode = trackedPostpones.workingMap.get(request);
		if (void 0 === boundaryNode) return boundary = [
			request[1],
			request[2],
			children,
			null,
			fallbackReplayNode,
			boundary.rootSegmentID
		], trackedPostpones.workingMap.set(request, boundary), addToReplayParent(boundary, request[0], trackedPostpones), boundary;
		boundaryNode[4] = fallbackReplayNode;
		boundaryNode[5] = boundary.rootSegmentID;
		return boundaryNode;
	}
	function trackPostpone(request, trackedPostpones, task, segment) {
		segment.status = 5;
		var keyPath = task.keyPath, boundary = task.blockedBoundary;
		if (null === boundary) segment.id = request.nextSegmentId++, trackedPostpones.rootSlots = segment.id, null !== request.completedRootSegment && (request.completedRootSegment.status = 5);
		else {
			if (null !== boundary && 0 === boundary.status) {
				var boundaryNode = trackPostponedBoundary(request, trackedPostpones, boundary);
				if (boundary.trackedContentKeyPath === keyPath && -1 === task.childIndex) {
					-1 === segment.id && (segment.id = segment.parentFlushed ? boundary.rootSegmentID : request.nextSegmentId++);
					boundaryNode[3] = segment.id;
					return;
				}
			}
			-1 === segment.id && (segment.id = segment.parentFlushed && null !== boundary ? boundary.rootSegmentID : request.nextSegmentId++);
			if (-1 === task.childIndex) null === keyPath ? trackedPostpones.rootSlots = segment.id : (task = trackedPostpones.workingMap.get(keyPath), void 0 === task ? (task = [
				keyPath[1],
				keyPath[2],
				[],
				segment.id
			], addToReplayParent(task, keyPath[0], trackedPostpones)) : task[3] = segment.id);
			else {
				if (null === keyPath) {
					if (request = trackedPostpones.rootSlots, null === request) request = trackedPostpones.rootSlots = {};
					else if ("number" === typeof request) throw Error("It should not be possible to postpone both at the root of an element as well as a slot below. This is a bug in React.");
				} else if (boundary = trackedPostpones.workingMap, boundaryNode = boundary.get(keyPath), void 0 === boundaryNode) request = {}, boundaryNode = [
					keyPath[1],
					keyPath[2],
					[],
					request
				], boundary.set(keyPath, boundaryNode), addToReplayParent(boundaryNode, keyPath[0], trackedPostpones);
				else if (request = boundaryNode[3], null === request) request = boundaryNode[3] = {};
				else if ("number" === typeof request) throw Error("It should not be possible to postpone both at the root of an element as well as a slot below. This is a bug in React.");
				request[task.childIndex] = segment.id;
			}
		}
	}
	function untrackBoundary(request, boundary) {
		request = request.trackedPostpones;
		null !== request && (boundary = boundary.trackedContentKeyPath, null !== boundary && (boundary = request.workingMap.get(boundary), void 0 !== boundary && (boundary.length = 4, boundary[2] = [], boundary[3] = null)));
	}
	function spawnNewSuspendedReplayTask(request, task, thenableState$2) {
		return createReplayTask(request, thenableState$2, task.replay, task.node, task.childIndex, task.blockedBoundary, task.hoistableState, task.abortSet, task.keyPath, task.formatContext, task.context, task.treeContext, task.row, task.componentStack);
	}
	function spawnNewSuspendedRenderTask(request, task, thenableState$2) {
		var segment = task.blockedSegment, newSegment = createPendingSegment(request, segment.chunks.length, null, task.formatContext, segment.lastPushedText, !0);
		segment.children.push(newSegment);
		segment.lastPushedText = !1;
		return createRenderTask(request, thenableState$2, task.node, task.childIndex, task.blockedBoundary, newSegment, task.blockedPreamble, task.hoistableState, task.abortSet, task.keyPath, task.formatContext, task.context, task.treeContext, task.row, task.componentStack);
	}
	function renderNode(request, task, node, childIndex) {
		var previousFormatContext = task.formatContext, previousContext = task.context, previousKeyPath = task.keyPath, previousTreeContext = task.treeContext, previousComponentStack = task.componentStack, segment = task.blockedSegment;
		if (null === segment) {
			segment = task.replay;
			try {
				return renderNodeDestructive(request, task, node, childIndex);
			} catch (thrownValue) {
				if (resetHooksState(), node = thrownValue === SuspenseException ? getSuspendedThenable() : thrownValue, 12 !== request.status && "object" === typeof node && null !== node) {
					if ("function" === typeof node.then) {
						childIndex = thrownValue === SuspenseException ? getThenableStateAfterSuspending() : null;
						request = spawnNewSuspendedReplayTask(request, task, childIndex).ping;
						node.then(request, request);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						task.replay = segment;
						switchContext(previousContext);
						return;
					}
					if ("Maximum call stack size exceeded" === node.message) {
						node = thrownValue === SuspenseException ? getThenableStateAfterSuspending() : null;
						node = spawnNewSuspendedReplayTask(request, task, node);
						request.pingedTasks.push(node);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						task.replay = segment;
						switchContext(previousContext);
						return;
					}
				}
			}
		} else {
			var childrenLength = segment.children.length, chunkLength = segment.chunks.length;
			try {
				return renderNodeDestructive(request, task, node, childIndex);
			} catch (thrownValue$63) {
				if (resetHooksState(), segment.children.length = childrenLength, segment.chunks.length = chunkLength, node = thrownValue$63 === SuspenseException ? getSuspendedThenable() : thrownValue$63, 12 !== request.status && "object" === typeof node && null !== node) {
					if ("function" === typeof node.then) {
						segment = node;
						node = thrownValue$63 === SuspenseException ? getThenableStateAfterSuspending() : null;
						request = spawnNewSuspendedRenderTask(request, task, node).ping;
						segment.then(request, request);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						switchContext(previousContext);
						return;
					}
					if ("Maximum call stack size exceeded" === node.message) {
						segment = thrownValue$63 === SuspenseException ? getThenableStateAfterSuspending() : null;
						segment = spawnNewSuspendedRenderTask(request, task, segment);
						request.pingedTasks.push(segment);
						task.formatContext = previousFormatContext;
						task.context = previousContext;
						task.keyPath = previousKeyPath;
						task.treeContext = previousTreeContext;
						task.componentStack = previousComponentStack;
						switchContext(previousContext);
						return;
					}
				}
			}
		}
		task.formatContext = previousFormatContext;
		task.context = previousContext;
		task.keyPath = previousKeyPath;
		task.treeContext = previousTreeContext;
		switchContext(previousContext);
		throw node;
	}
	function abortTaskSoft(task) {
		var boundary = task.blockedBoundary, segment = task.blockedSegment;
		null !== segment && (segment.status = 3, finishedTask(this, boundary, task.row, segment));
	}
	function abortRemainingReplayNodes(request$jscomp$0, boundary, nodes, slots, error, errorDigest$jscomp$0) {
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			if (4 === node.length) abortRemainingReplayNodes(request$jscomp$0, boundary, node[2], node[3], error, errorDigest$jscomp$0);
			else {
				node = node[5];
				var request = request$jscomp$0, errorDigest = errorDigest$jscomp$0, resumedBoundary = createSuspenseBoundary(request, null, /* @__PURE__ */ new Set(), null, null);
				resumedBoundary.parentFlushed = !0;
				resumedBoundary.rootSegmentID = node;
				resumedBoundary.status = 4;
				resumedBoundary.errorDigest = errorDigest;
				resumedBoundary.parentFlushed && request.clientRenderedBoundaries.push(resumedBoundary);
			}
		}
		nodes.length = 0;
		if (null !== slots) {
			if (null === boundary) throw Error("We should not have any resumable nodes in the shell. This is a bug in React.");
			4 !== boundary.status && (boundary.status = 4, boundary.errorDigest = errorDigest$jscomp$0, boundary.parentFlushed && request$jscomp$0.clientRenderedBoundaries.push(boundary));
			if ("object" === typeof slots) for (var index in slots) delete slots[index];
		}
	}
	function abortTask(task, request, error) {
		var boundary = task.blockedBoundary, segment = task.blockedSegment;
		if (null !== segment) {
			if (6 === segment.status) return;
			segment.status = 3;
		}
		var errorInfo = getThrownInfo(task.componentStack);
		if (null === boundary) {
			if (13 !== request.status && 14 !== request.status) {
				boundary = task.replay;
				if (null === boundary) {
					null !== request.trackedPostpones && null !== segment ? (boundary = request.trackedPostpones, logRecoverableError(request, error, errorInfo), trackPostpone(request, boundary, task, segment), finishedTask(request, null, task.row, segment)) : (logRecoverableError(request, error, errorInfo), fatalError(request, error));
					return;
				}
				boundary.pendingTasks--;
				0 === boundary.pendingTasks && 0 < boundary.nodes.length && (segment = logRecoverableError(request, error, errorInfo), abortRemainingReplayNodes(request, null, boundary.nodes, boundary.slots, error, segment));
				request.pendingRootTasks--;
				0 === request.pendingRootTasks && completeShell(request);
			}
		} else {
			var trackedPostpones$64 = request.trackedPostpones;
			if (4 !== boundary.status) {
				if (null !== trackedPostpones$64 && null !== segment) return logRecoverableError(request, error, errorInfo), trackPostpone(request, trackedPostpones$64, task, segment), boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
					return abortTask(fallbackTask, request, error);
				}), boundary.fallbackAbortableTasks.clear(), finishedTask(request, boundary, task.row, segment);
				boundary.status = 4;
				segment = logRecoverableError(request, error, errorInfo);
				boundary.status = 4;
				boundary.errorDigest = segment;
				untrackBoundary(request, boundary);
				boundary.parentFlushed && request.clientRenderedBoundaries.push(boundary);
			}
			boundary.pendingTasks--;
			segment = boundary.row;
			null !== segment && 0 === --segment.pendingTasks && finishSuspenseListRow(request, segment);
			boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
				return abortTask(fallbackTask, request, error);
			});
			boundary.fallbackAbortableTasks.clear();
		}
		task = task.row;
		null !== task && 0 === --task.pendingTasks && finishSuspenseListRow(request, task);
		request.allPendingTasks--;
		0 === request.allPendingTasks && completeAll(request);
	}
	function safelyEmitEarlyPreloads(request, shellComplete) {
		try {
			var renderState = request.renderState, onHeaders = renderState.onHeaders;
			if (onHeaders) {
				var headers = renderState.headers;
				if (headers) {
					renderState.headers = null;
					var linkHeader = headers.preconnects;
					headers.fontPreloads && (linkHeader && (linkHeader += ", "), linkHeader += headers.fontPreloads);
					headers.highImagePreloads && (linkHeader && (linkHeader += ", "), linkHeader += headers.highImagePreloads);
					if (!shellComplete) {
						var queueIter = renderState.styles.values(), queueStep = queueIter.next();
						b: for (; 0 < headers.remainingCapacity && !queueStep.done; queueStep = queueIter.next()) for (var sheetIter = queueStep.value.sheets.values(), sheetStep = sheetIter.next(); 0 < headers.remainingCapacity && !sheetStep.done; sheetStep = sheetIter.next()) {
							var sheet = sheetStep.value, props = sheet.props, key = props.href, props$jscomp$0 = sheet.props, header = getPreloadAsHeader(props$jscomp$0.href, "style", {
								crossOrigin: props$jscomp$0.crossOrigin,
								integrity: props$jscomp$0.integrity,
								nonce: props$jscomp$0.nonce,
								type: props$jscomp$0.type,
								fetchPriority: props$jscomp$0.fetchPriority,
								referrerPolicy: props$jscomp$0.referrerPolicy,
								media: props$jscomp$0.media
							});
							if (0 <= (headers.remainingCapacity -= header.length + 2)) renderState.resets.style[key] = PRELOAD_NO_CREDS, linkHeader && (linkHeader += ", "), linkHeader += header, renderState.resets.style[key] = "string" === typeof props.crossOrigin || "string" === typeof props.integrity ? [props.crossOrigin, props.integrity] : PRELOAD_NO_CREDS;
							else break b;
						}
					}
					linkHeader ? onHeaders({ Link: linkHeader }) : onHeaders({});
				}
			}
		} catch (error) {
			logRecoverableError(request, error, {});
		}
	}
	function completeShell(request) {
		null === request.trackedPostpones && safelyEmitEarlyPreloads(request, !0);
		null === request.trackedPostpones && preparePreamble(request);
		request.onShellError = noop$2;
		request = request.onShellReady;
		request();
	}
	function completeAll(request) {
		safelyEmitEarlyPreloads(request, null === request.trackedPostpones ? !0 : null === request.completedRootSegment || 5 !== request.completedRootSegment.status);
		preparePreamble(request);
		request = request.onAllReady;
		request();
	}
	function queueCompletedSegment(boundary, segment) {
		if (0 === segment.chunks.length && 1 === segment.children.length && null === segment.children[0].boundary && -1 === segment.children[0].id) {
			var childSegment = segment.children[0];
			childSegment.id = segment.id;
			childSegment.parentFlushed = !0;
			1 !== childSegment.status && 3 !== childSegment.status && 4 !== childSegment.status || queueCompletedSegment(boundary, childSegment);
		} else boundary.completedSegments.push(segment);
	}
	function finishedSegment(request, boundary, segment) {
		if (null !== byteLengthOfChunk) {
			segment = segment.chunks;
			for (var segmentByteSize = 0, i = 0; i < segment.length; i++) segmentByteSize += byteLengthOfChunk(segment[i]);
			null === boundary ? request.byteSize += segmentByteSize : boundary.byteSize += segmentByteSize;
		}
	}
	function finishedTask(request, boundary, row, segment) {
		null !== row && (0 === --row.pendingTasks ? finishSuspenseListRow(request, row) : row.together && tryToResolveTogetherRow(request, row));
		request.allPendingTasks--;
		if (null === boundary) {
			if (null !== segment && segment.parentFlushed) {
				if (null !== request.completedRootSegment) throw Error("There can only be one root segment. This is a bug in React.");
				request.completedRootSegment = segment;
			}
			request.pendingRootTasks--;
			0 === request.pendingRootTasks && completeShell(request);
		} else if (boundary.pendingTasks--, 4 !== boundary.status) if (0 === boundary.pendingTasks) {
			if (0 === boundary.status && (boundary.status = 1), null !== segment && segment.parentFlushed && (1 === segment.status || 3 === segment.status) && queueCompletedSegment(boundary, segment), boundary.parentFlushed && request.completedBoundaries.push(boundary), 1 === boundary.status) row = boundary.row, null !== row && hoistHoistables(row.hoistables, boundary.contentState), isEligibleForOutlining(request, boundary) || (boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request), boundary.fallbackAbortableTasks.clear(), null !== row && 0 === --row.pendingTasks && finishSuspenseListRow(request, row)), 0 === request.pendingRootTasks && null === request.trackedPostpones && null !== boundary.contentPreamble && preparePreamble(request);
			else if (5 === boundary.status && (boundary = boundary.row, null !== boundary)) {
				if (null !== request.trackedPostpones) {
					row = request.trackedPostpones;
					var postponedRow = boundary.next;
					if (null !== postponedRow && (segment = postponedRow.boundaries, null !== segment)) for (postponedRow.boundaries = null, postponedRow = 0; postponedRow < segment.length; postponedRow++) {
						var postponedBoundary = segment[postponedRow];
						trackPostponedBoundary(request, row, postponedBoundary);
						finishedTask(request, postponedBoundary, null, null);
					}
				}
				0 === --boundary.pendingTasks && finishSuspenseListRow(request, boundary);
			}
		} else null === segment || !segment.parentFlushed || 1 !== segment.status && 3 !== segment.status || (queueCompletedSegment(boundary, segment), 1 === boundary.completedSegments.length && boundary.parentFlushed && request.partialBoundaries.push(boundary)), boundary = boundary.row, null !== boundary && boundary.together && tryToResolveTogetherRow(request, boundary);
		0 === request.allPendingTasks && completeAll(request);
	}
	function performWork(request$jscomp$2) {
		if (14 !== request$jscomp$2.status && 13 !== request$jscomp$2.status) {
			var prevContext = currentActiveSnapshot, prevDispatcher = ReactSharedInternals.H;
			ReactSharedInternals.H = HooksDispatcher;
			var prevAsyncDispatcher = ReactSharedInternals.A;
			ReactSharedInternals.A = DefaultAsyncDispatcher;
			var prevRequest = currentRequest;
			currentRequest = request$jscomp$2;
			var prevResumableState = currentResumableState;
			currentResumableState = request$jscomp$2.resumableState;
			try {
				var pingedTasks = request$jscomp$2.pingedTasks, i;
				for (i = 0; i < pingedTasks.length; i++) {
					var task = pingedTasks[i], request = request$jscomp$2, segment = task.blockedSegment;
					if (null === segment) {
						var request$jscomp$0 = request;
						if (0 !== task.replay.pendingTasks) {
							switchContext(task.context);
							try {
								"number" === typeof task.replay.slots ? resumeNode(request$jscomp$0, task, task.replay.slots, task.node, task.childIndex) : retryNode(request$jscomp$0, task);
								if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length) throw Error("Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering.");
								task.replay.pendingTasks--;
								task.abortSet.delete(task);
								finishedTask(request$jscomp$0, task.blockedBoundary, task.row, null);
							} catch (thrownValue) {
								resetHooksState();
								var x = thrownValue === SuspenseException ? getSuspendedThenable() : thrownValue;
								if ("object" === typeof x && null !== x && "function" === typeof x.then) {
									var ping = task.ping;
									x.then(ping, ping);
									task.thenableState = thrownValue === SuspenseException ? getThenableStateAfterSuspending() : null;
								} else {
									task.replay.pendingTasks--;
									task.abortSet.delete(task);
									var errorInfo = getThrownInfo(task.componentStack);
									request = void 0;
									var request$jscomp$1 = request$jscomp$0, boundary = task.blockedBoundary, error$jscomp$0 = 12 === request$jscomp$0.status ? request$jscomp$0.fatalError : x, replayNodes = task.replay.nodes, resumeSlots = task.replay.slots;
									request = logRecoverableError(request$jscomp$1, error$jscomp$0, errorInfo);
									abortRemainingReplayNodes(request$jscomp$1, boundary, replayNodes, resumeSlots, error$jscomp$0, request);
									request$jscomp$0.pendingRootTasks--;
									0 === request$jscomp$0.pendingRootTasks && completeShell(request$jscomp$0);
									request$jscomp$0.allPendingTasks--;
									0 === request$jscomp$0.allPendingTasks && completeAll(request$jscomp$0);
								}
							}
						}
					} else if (request$jscomp$0 = void 0, request$jscomp$1 = segment, 0 === request$jscomp$1.status) {
						request$jscomp$1.status = 6;
						switchContext(task.context);
						var childrenLength = request$jscomp$1.children.length, chunkLength = request$jscomp$1.chunks.length;
						try {
							retryNode(request, task), request$jscomp$1.lastPushedText && request$jscomp$1.textEmbedded && request$jscomp$1.chunks.push(textSeparator), task.abortSet.delete(task), request$jscomp$1.status = 1, finishedSegment(request, task.blockedBoundary, request$jscomp$1), finishedTask(request, task.blockedBoundary, task.row, request$jscomp$1);
						} catch (thrownValue) {
							resetHooksState();
							request$jscomp$1.children.length = childrenLength;
							request$jscomp$1.chunks.length = chunkLength;
							var x$jscomp$0 = thrownValue === SuspenseException ? getSuspendedThenable() : 12 === request.status ? request.fatalError : thrownValue;
							if (12 === request.status && null !== request.trackedPostpones) {
								var trackedPostpones = request.trackedPostpones, thrownInfo = getThrownInfo(task.componentStack);
								task.abortSet.delete(task);
								logRecoverableError(request, x$jscomp$0, thrownInfo);
								trackPostpone(request, trackedPostpones, task, request$jscomp$1);
								finishedTask(request, task.blockedBoundary, task.row, request$jscomp$1);
							} else if ("object" === typeof x$jscomp$0 && null !== x$jscomp$0 && "function" === typeof x$jscomp$0.then) {
								request$jscomp$1.status = 0;
								task.thenableState = thrownValue === SuspenseException ? getThenableStateAfterSuspending() : null;
								var ping$jscomp$0 = task.ping;
								x$jscomp$0.then(ping$jscomp$0, ping$jscomp$0);
							} else {
								var errorInfo$jscomp$0 = getThrownInfo(task.componentStack);
								task.abortSet.delete(task);
								request$jscomp$1.status = 4;
								var boundary$jscomp$0 = task.blockedBoundary, row = task.row;
								null !== row && 0 === --row.pendingTasks && finishSuspenseListRow(request, row);
								request.allPendingTasks--;
								request$jscomp$0 = logRecoverableError(request, x$jscomp$0, errorInfo$jscomp$0);
								if (null === boundary$jscomp$0) fatalError(request, x$jscomp$0);
								else if (boundary$jscomp$0.pendingTasks--, 4 !== boundary$jscomp$0.status) {
									boundary$jscomp$0.status = 4;
									boundary$jscomp$0.errorDigest = request$jscomp$0;
									untrackBoundary(request, boundary$jscomp$0);
									var boundaryRow = boundary$jscomp$0.row;
									null !== boundaryRow && 0 === --boundaryRow.pendingTasks && finishSuspenseListRow(request, boundaryRow);
									boundary$jscomp$0.parentFlushed && request.clientRenderedBoundaries.push(boundary$jscomp$0);
									0 === request.pendingRootTasks && null === request.trackedPostpones && null !== boundary$jscomp$0.contentPreamble && preparePreamble(request);
								}
								0 === request.allPendingTasks && completeAll(request);
							}
						}
					}
				}
				pingedTasks.splice(0, i);
				null !== request$jscomp$2.destination && flushCompletedQueues(request$jscomp$2, request$jscomp$2.destination);
			} catch (error) {
				logRecoverableError(request$jscomp$2, error, {}), fatalError(request$jscomp$2, error);
			} finally {
				currentResumableState = prevResumableState, ReactSharedInternals.H = prevDispatcher, ReactSharedInternals.A = prevAsyncDispatcher, prevDispatcher === HooksDispatcher && switchContext(prevContext), currentRequest = prevRequest;
			}
		}
	}
	function preparePreambleFromSubtree(request, segment, collectedPreambleSegments) {
		segment.preambleChildren.length && collectedPreambleSegments.push(segment.preambleChildren);
		for (var pendingPreambles = !1, i = 0; i < segment.children.length; i++) pendingPreambles = preparePreambleFromSegment(request, segment.children[i], collectedPreambleSegments) || pendingPreambles;
		return pendingPreambles;
	}
	function preparePreambleFromSegment(request, segment, collectedPreambleSegments) {
		var boundary = segment.boundary;
		if (null === boundary) return preparePreambleFromSubtree(request, segment, collectedPreambleSegments);
		var preamble = boundary.contentPreamble, fallbackPreamble = boundary.fallbackPreamble;
		if (null === preamble || null === fallbackPreamble) return !1;
		switch (boundary.status) {
			case 1:
				hoistPreambleState(request.renderState, preamble);
				request.byteSize += boundary.byteSize;
				segment = boundary.completedSegments[0];
				if (!segment) throw Error("A previously unvisited boundary must have exactly one root segment. This is a bug in React.");
				return preparePreambleFromSubtree(request, segment, collectedPreambleSegments);
			case 5: if (null !== request.trackedPostpones) return !0;
			case 4: if (1 === segment.status) return hoistPreambleState(request.renderState, fallbackPreamble), preparePreambleFromSubtree(request, segment, collectedPreambleSegments);
			default: return !0;
		}
	}
	function preparePreamble(request) {
		if (request.completedRootSegment && null === request.completedPreambleSegments) {
			var collectedPreambleSegments = [], originalRequestByteSize = request.byteSize, hasPendingPreambles = preparePreambleFromSegment(request, request.completedRootSegment, collectedPreambleSegments), preamble = request.renderState.preamble;
			!1 === hasPendingPreambles || preamble.headChunks && preamble.bodyChunks ? request.completedPreambleSegments = collectedPreambleSegments : request.byteSize = originalRequestByteSize;
		}
	}
	function flushSubtree(request, destination, segment, hoistableState) {
		segment.parentFlushed = !0;
		switch (segment.status) {
			case 0: segment.id = request.nextSegmentId++;
			case 5: return hoistableState = segment.id, segment.lastPushedText = !1, segment.textEmbedded = !1, request = request.renderState, writeChunk(destination, placeholder1), writeChunk(destination, request.placeholderPrefix), request = hoistableState.toString(16), writeChunk(destination, request), writeChunkAndReturn(destination, placeholder2);
			case 1:
				segment.status = 2;
				var r = !0, chunks = segment.chunks, chunkIdx = 0;
				segment = segment.children;
				for (var childIdx = 0; childIdx < segment.length; childIdx++) {
					for (r = segment[childIdx]; chunkIdx < r.index; chunkIdx++) writeChunk(destination, chunks[chunkIdx]);
					r = flushSegment(request, destination, r, hoistableState);
				}
				for (; chunkIdx < chunks.length - 1; chunkIdx++) writeChunk(destination, chunks[chunkIdx]);
				chunkIdx < chunks.length && (r = writeChunkAndReturn(destination, chunks[chunkIdx]));
				return r;
			case 3: return !0;
			default: throw Error("Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React.");
		}
	}
	var flushedByteSize = 0;
	function flushSegment(request, destination, segment, hoistableState) {
		var boundary = segment.boundary;
		if (null === boundary) return flushSubtree(request, destination, segment, hoistableState);
		boundary.parentFlushed = !0;
		if (4 === boundary.status) {
			var row = boundary.row;
			null !== row && 0 === --row.pendingTasks && finishSuspenseListRow(request, row);
			boundary = boundary.errorDigest;
			writeChunkAndReturn(destination, startClientRenderedSuspenseBoundary);
			writeChunk(destination, clientRenderedSuspenseBoundaryError1);
			boundary && (writeChunk(destination, clientRenderedSuspenseBoundaryError1A), writeChunk(destination, escapeTextForBrowser(boundary)), writeChunk(destination, clientRenderedSuspenseBoundaryErrorAttrInterstitial));
			writeChunkAndReturn(destination, clientRenderedSuspenseBoundaryError2);
			flushSubtree(request, destination, segment, hoistableState);
		} else if (1 !== boundary.status) 0 === boundary.status && (boundary.rootSegmentID = request.nextSegmentId++), 0 < boundary.completedSegments.length && request.partialBoundaries.push(boundary), writeStartPendingSuspenseBoundary(destination, request.renderState, boundary.rootSegmentID), hoistableState && hoistHoistables(hoistableState, boundary.fallbackState), flushSubtree(request, destination, segment, hoistableState);
		else if (!flushingPartialBoundaries && isEligibleForOutlining(request, boundary) && (flushedByteSize + boundary.byteSize > request.progressiveChunkSize || hasSuspenseyContent(boundary.contentState))) boundary.rootSegmentID = request.nextSegmentId++, request.completedBoundaries.push(boundary), writeStartPendingSuspenseBoundary(destination, request.renderState, boundary.rootSegmentID), flushSubtree(request, destination, segment, hoistableState);
		else {
			flushedByteSize += boundary.byteSize;
			hoistableState && hoistHoistables(hoistableState, boundary.contentState);
			segment = boundary.row;
			null !== segment && isEligibleForOutlining(request, boundary) && 0 === --segment.pendingTasks && finishSuspenseListRow(request, segment);
			writeChunkAndReturn(destination, startCompletedSuspenseBoundary);
			segment = boundary.completedSegments;
			if (1 !== segment.length) throw Error("A previously unvisited boundary must have exactly one root segment. This is a bug in React.");
			flushSegment(request, destination, segment[0], hoistableState);
		}
		return writeChunkAndReturn(destination, endSuspenseBoundary);
	}
	function flushSegmentContainer(request, destination, segment, hoistableState) {
		writeStartSegment(destination, request.renderState, segment.parentFormatContext, segment.id);
		flushSegment(request, destination, segment, hoistableState);
		return writeEndSegment(destination, segment.parentFormatContext);
	}
	function flushCompletedBoundary(request, destination, boundary) {
		flushedByteSize = boundary.byteSize;
		for (var completedSegments = boundary.completedSegments, i = 0; i < completedSegments.length; i++) flushPartiallyCompletedSegment(request, destination, boundary, completedSegments[i]);
		completedSegments.length = 0;
		completedSegments = boundary.row;
		null !== completedSegments && isEligibleForOutlining(request, boundary) && 0 === --completedSegments.pendingTasks && finishSuspenseListRow(request, completedSegments);
		writeHoistablesForBoundary(destination, boundary.contentState, request.renderState);
		completedSegments = request.resumableState;
		request = request.renderState;
		i = boundary.rootSegmentID;
		boundary = boundary.contentState;
		var requiresStyleInsertion = request.stylesToHoist;
		request.stylesToHoist = !1;
		writeChunk(destination, request.startInlineScript);
		writeChunk(destination, endOfStartTag);
		requiresStyleInsertion ? (0 === (completedSegments.instructions & 4) && (completedSegments.instructions |= 4, writeChunk(destination, clientRenderScriptFunctionOnly)), 0 === (completedSegments.instructions & 2) && (completedSegments.instructions |= 2, writeChunk(destination, completeBoundaryScriptFunctionOnly)), 0 === (completedSegments.instructions & 8) ? (completedSegments.instructions |= 8, writeChunk(destination, completeBoundaryWithStylesScript1FullPartial)) : writeChunk(destination, completeBoundaryWithStylesScript1Partial)) : (0 === (completedSegments.instructions & 2) && (completedSegments.instructions |= 2, writeChunk(destination, completeBoundaryScriptFunctionOnly)), writeChunk(destination, completeBoundaryScript1Partial));
		completedSegments = i.toString(16);
		writeChunk(destination, request.boundaryPrefix);
		writeChunk(destination, completedSegments);
		writeChunk(destination, completeBoundaryScript2);
		writeChunk(destination, request.segmentPrefix);
		writeChunk(destination, completedSegments);
		requiresStyleInsertion ? (writeChunk(destination, completeBoundaryScript3a), writeStyleResourceDependenciesInJS(destination, boundary)) : writeChunk(destination, completeBoundaryScript3b);
		boundary = writeChunkAndReturn(destination, completeBoundaryScriptEnd);
		return writeBootstrap(destination, request) && boundary;
	}
	function flushPartiallyCompletedSegment(request, destination, boundary, segment) {
		if (2 === segment.status) return !0;
		var hoistableState = boundary.contentState, segmentID = segment.id;
		if (-1 === segmentID) {
			if (-1 === (segment.id = boundary.rootSegmentID)) throw Error("A root segment ID must have been assigned by now. This is a bug in React.");
			return flushSegmentContainer(request, destination, segment, hoistableState);
		}
		if (segmentID === boundary.rootSegmentID) return flushSegmentContainer(request, destination, segment, hoistableState);
		flushSegmentContainer(request, destination, segment, hoistableState);
		boundary = request.resumableState;
		request = request.renderState;
		writeChunk(destination, request.startInlineScript);
		writeChunk(destination, endOfStartTag);
		0 === (boundary.instructions & 1) ? (boundary.instructions |= 1, writeChunk(destination, completeSegmentScript1Full)) : writeChunk(destination, completeSegmentScript1Partial);
		writeChunk(destination, request.segmentPrefix);
		segmentID = segmentID.toString(16);
		writeChunk(destination, segmentID);
		writeChunk(destination, completeSegmentScript2);
		writeChunk(destination, request.placeholderPrefix);
		writeChunk(destination, segmentID);
		destination = writeChunkAndReturn(destination, completeSegmentScriptEnd);
		return destination;
	}
	var flushingPartialBoundaries = !1;
	function flushCompletedQueues(request, destination) {
		currentView = new Uint8Array(2048);
		writtenBytes = 0;
		destinationHasCapacity$1 = !0;
		try {
			if (!(0 < request.pendingRootTasks)) {
				var i, completedRootSegment = request.completedRootSegment;
				if (null !== completedRootSegment) {
					if (5 === completedRootSegment.status) return;
					var completedPreambleSegments = request.completedPreambleSegments;
					if (null === completedPreambleSegments) return;
					flushedByteSize = request.byteSize;
					var resumableState = request.resumableState, renderState = request.renderState, preamble = renderState.preamble, htmlChunks = preamble.htmlChunks, headChunks = preamble.headChunks, i$jscomp$0;
					if (htmlChunks) {
						for (i$jscomp$0 = 0; i$jscomp$0 < htmlChunks.length; i$jscomp$0++) writeChunk(destination, htmlChunks[i$jscomp$0]);
						if (headChunks) for (i$jscomp$0 = 0; i$jscomp$0 < headChunks.length; i$jscomp$0++) writeChunk(destination, headChunks[i$jscomp$0]);
						else writeChunk(destination, startChunkForTag("head")), writeChunk(destination, endOfStartTag);
					} else if (headChunks) for (i$jscomp$0 = 0; i$jscomp$0 < headChunks.length; i$jscomp$0++) writeChunk(destination, headChunks[i$jscomp$0]);
					var charsetChunks = renderState.charsetChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < charsetChunks.length; i$jscomp$0++) writeChunk(destination, charsetChunks[i$jscomp$0]);
					charsetChunks.length = 0;
					renderState.preconnects.forEach(flushResource, destination);
					renderState.preconnects.clear();
					var viewportChunks = renderState.viewportChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < viewportChunks.length; i$jscomp$0++) writeChunk(destination, viewportChunks[i$jscomp$0]);
					viewportChunks.length = 0;
					renderState.fontPreloads.forEach(flushResource, destination);
					renderState.fontPreloads.clear();
					renderState.highImagePreloads.forEach(flushResource, destination);
					renderState.highImagePreloads.clear();
					currentlyFlushingRenderState = renderState;
					renderState.styles.forEach(flushStylesInPreamble, destination);
					currentlyFlushingRenderState = null;
					var importMapChunks = renderState.importMapChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < importMapChunks.length; i$jscomp$0++) writeChunk(destination, importMapChunks[i$jscomp$0]);
					importMapChunks.length = 0;
					renderState.bootstrapScripts.forEach(flushResource, destination);
					renderState.scripts.forEach(flushResource, destination);
					renderState.scripts.clear();
					renderState.bulkPreloads.forEach(flushResource, destination);
					renderState.bulkPreloads.clear();
					htmlChunks || headChunks || (resumableState.instructions |= 32);
					var hoistableChunks = renderState.hoistableChunks;
					for (i$jscomp$0 = 0; i$jscomp$0 < hoistableChunks.length; i$jscomp$0++) writeChunk(destination, hoistableChunks[i$jscomp$0]);
					for (resumableState = hoistableChunks.length = 0; resumableState < completedPreambleSegments.length; resumableState++) {
						var segments = completedPreambleSegments[resumableState];
						for (renderState = 0; renderState < segments.length; renderState++) flushSegment(request, destination, segments[renderState], null);
					}
					var preamble$jscomp$0 = request.renderState.preamble, headChunks$jscomp$0 = preamble$jscomp$0.headChunks;
					(preamble$jscomp$0.htmlChunks || headChunks$jscomp$0) && writeChunk(destination, endChunkForTag("head"));
					var bodyChunks = preamble$jscomp$0.bodyChunks;
					if (bodyChunks) for (completedPreambleSegments = 0; completedPreambleSegments < bodyChunks.length; completedPreambleSegments++) writeChunk(destination, bodyChunks[completedPreambleSegments]);
					flushSegment(request, destination, completedRootSegment, null);
					request.completedRootSegment = null;
					var renderState$jscomp$0 = request.renderState;
					if (0 !== request.allPendingTasks || 0 !== request.clientRenderedBoundaries.length || 0 !== request.completedBoundaries.length || null !== request.trackedPostpones && (0 !== request.trackedPostpones.rootNodes.length || null !== request.trackedPostpones.rootSlots)) {
						var resumableState$jscomp$0 = request.resumableState;
						if (0 === (resumableState$jscomp$0.instructions & 64)) {
							resumableState$jscomp$0.instructions |= 64;
							writeChunk(destination, renderState$jscomp$0.startInlineScript);
							if (0 === (resumableState$jscomp$0.instructions & 32)) {
								resumableState$jscomp$0.instructions |= 32;
								var shellId = "_" + resumableState$jscomp$0.idPrefix + "R_";
								writeChunk(destination, completedShellIdAttributeStart);
								writeChunk(destination, escapeTextForBrowser(shellId));
								writeChunk(destination, attributeEnd);
							}
							writeChunk(destination, endOfStartTag);
							writeChunk(destination, shellTimeRuntimeScript);
							writeChunkAndReturn(destination, endInlineScript);
						}
					}
					writeBootstrap(destination, renderState$jscomp$0);
				}
				var renderState$jscomp$1 = request.renderState;
				completedRootSegment = 0;
				var viewportChunks$jscomp$0 = renderState$jscomp$1.viewportChunks;
				for (completedRootSegment = 0; completedRootSegment < viewportChunks$jscomp$0.length; completedRootSegment++) writeChunk(destination, viewportChunks$jscomp$0[completedRootSegment]);
				viewportChunks$jscomp$0.length = 0;
				renderState$jscomp$1.preconnects.forEach(flushResource, destination);
				renderState$jscomp$1.preconnects.clear();
				renderState$jscomp$1.fontPreloads.forEach(flushResource, destination);
				renderState$jscomp$1.fontPreloads.clear();
				renderState$jscomp$1.highImagePreloads.forEach(flushResource, destination);
				renderState$jscomp$1.highImagePreloads.clear();
				renderState$jscomp$1.styles.forEach(preloadLateStyles, destination);
				renderState$jscomp$1.scripts.forEach(flushResource, destination);
				renderState$jscomp$1.scripts.clear();
				renderState$jscomp$1.bulkPreloads.forEach(flushResource, destination);
				renderState$jscomp$1.bulkPreloads.clear();
				var hoistableChunks$jscomp$0 = renderState$jscomp$1.hoistableChunks;
				for (completedRootSegment = 0; completedRootSegment < hoistableChunks$jscomp$0.length; completedRootSegment++) writeChunk(destination, hoistableChunks$jscomp$0[completedRootSegment]);
				hoistableChunks$jscomp$0.length = 0;
				var clientRenderedBoundaries = request.clientRenderedBoundaries;
				for (i = 0; i < clientRenderedBoundaries.length; i++) {
					var boundary = clientRenderedBoundaries[i];
					renderState$jscomp$1 = destination;
					var resumableState$jscomp$1 = request.resumableState, renderState$jscomp$2 = request.renderState, id = boundary.rootSegmentID, errorDigest = boundary.errorDigest;
					writeChunk(renderState$jscomp$1, renderState$jscomp$2.startInlineScript);
					writeChunk(renderState$jscomp$1, endOfStartTag);
					0 === (resumableState$jscomp$1.instructions & 4) ? (resumableState$jscomp$1.instructions |= 4, writeChunk(renderState$jscomp$1, clientRenderScript1Full)) : writeChunk(renderState$jscomp$1, clientRenderScript1Partial);
					writeChunk(renderState$jscomp$1, renderState$jscomp$2.boundaryPrefix);
					writeChunk(renderState$jscomp$1, id.toString(16));
					writeChunk(renderState$jscomp$1, clientRenderScript1A);
					errorDigest && (writeChunk(renderState$jscomp$1, clientRenderErrorScriptArgInterstitial), writeChunk(renderState$jscomp$1, escapeJSStringsForInstructionScripts(errorDigest || "")));
					var JSCompiler_inline_result = writeChunkAndReturn(renderState$jscomp$1, clientRenderScriptEnd);
					if (!JSCompiler_inline_result) {
						request.destination = null;
						i++;
						clientRenderedBoundaries.splice(0, i);
						return;
					}
				}
				clientRenderedBoundaries.splice(0, i);
				var completedBoundaries = request.completedBoundaries;
				for (i = 0; i < completedBoundaries.length; i++) if (!flushCompletedBoundary(request, destination, completedBoundaries[i])) {
					request.destination = null;
					i++;
					completedBoundaries.splice(0, i);
					return;
				}
				completedBoundaries.splice(0, i);
				completeWriting(destination);
				currentView = new Uint8Array(2048);
				writtenBytes = 0;
				flushingPartialBoundaries = destinationHasCapacity$1 = !0;
				var partialBoundaries = request.partialBoundaries;
				for (i = 0; i < partialBoundaries.length; i++) {
					var boundary$70 = partialBoundaries[i];
					a: {
						clientRenderedBoundaries = request;
						boundary = destination;
						flushedByteSize = boundary$70.byteSize;
						var completedSegments = boundary$70.completedSegments;
						for (JSCompiler_inline_result = 0; JSCompiler_inline_result < completedSegments.length; JSCompiler_inline_result++) if (!flushPartiallyCompletedSegment(clientRenderedBoundaries, boundary, boundary$70, completedSegments[JSCompiler_inline_result])) {
							JSCompiler_inline_result++;
							completedSegments.splice(0, JSCompiler_inline_result);
							var JSCompiler_inline_result$jscomp$0 = !1;
							break a;
						}
						completedSegments.splice(0, JSCompiler_inline_result);
						var row = boundary$70.row;
						null !== row && row.together && 1 === boundary$70.pendingTasks && (1 === row.pendingTasks ? unblockSuspenseListRow(clientRenderedBoundaries, row, row.hoistables) : row.pendingTasks--);
						JSCompiler_inline_result$jscomp$0 = writeHoistablesForBoundary(boundary, boundary$70.contentState, clientRenderedBoundaries.renderState);
					}
					if (!JSCompiler_inline_result$jscomp$0) {
						request.destination = null;
						i++;
						partialBoundaries.splice(0, i);
						return;
					}
				}
				partialBoundaries.splice(0, i);
				flushingPartialBoundaries = !1;
				var largeBoundaries = request.completedBoundaries;
				for (i = 0; i < largeBoundaries.length; i++) if (!flushCompletedBoundary(request, destination, largeBoundaries[i])) {
					request.destination = null;
					i++;
					largeBoundaries.splice(0, i);
					return;
				}
				largeBoundaries.splice(0, i);
			}
		} finally {
			flushingPartialBoundaries = !1, 0 === request.allPendingTasks && 0 === request.clientRenderedBoundaries.length && 0 === request.completedBoundaries.length ? (request.flushScheduled = !1, i = request.resumableState, i.hasBody && writeChunk(destination, endChunkForTag("body")), i.hasHtml && writeChunk(destination, endChunkForTag("html")), completeWriting(destination), flushBuffered(destination), request.status = 14, destination.end(), request.destination = null) : (completeWriting(destination), flushBuffered(destination));
		}
	}
	function startWork(request) {
		request.flushScheduled = null !== request.destination;
		scheduleMicrotask(function() {
			return requestStorage.run(request, performWork, request);
		});
		setImmediate(function() {
			10 === request.status && (request.status = 11);
			null === request.trackedPostpones && requestStorage.run(request, enqueueEarlyPreloadsAfterInitialWork, request);
		});
	}
	function enqueueEarlyPreloadsAfterInitialWork(request) {
		safelyEmitEarlyPreloads(request, 0 === request.pendingRootTasks);
	}
	function enqueueFlush(request) {
		!1 === request.flushScheduled && 0 === request.pingedTasks.length && null !== request.destination && (request.flushScheduled = !0, setImmediate(function() {
			var destination = request.destination;
			destination ? flushCompletedQueues(request, destination) : request.flushScheduled = !1;
		}));
	}
	function startFlowing(request, destination) {
		if (13 === request.status) request.status = 14, destination.destroy(request.fatalError);
		else if (14 !== request.status && null === request.destination) {
			request.destination = destination;
			try {
				flushCompletedQueues(request, destination);
			} catch (error) {
				logRecoverableError(request, error, {}), fatalError(request, error);
			}
		}
	}
	function abort(request, reason) {
		if (11 === request.status || 10 === request.status) request.status = 12;
		try {
			var abortableTasks = request.abortableTasks;
			if (0 < abortableTasks.size) {
				var error = void 0 === reason ? Error("The render was aborted by the server without a reason.") : "object" === typeof reason && null !== reason && "function" === typeof reason.then ? Error("The render was aborted by the server with a promise.") : reason;
				request.fatalError = error;
				abortableTasks.forEach(function(task) {
					return abortTask(task, request, error);
				});
				abortableTasks.clear();
			}
			null !== request.destination && flushCompletedQueues(request, request.destination);
		} catch (error$72) {
			logRecoverableError(request, error$72, {}), fatalError(request, error$72);
		}
	}
	function addToReplayParent(node, parentKeyPath, trackedPostpones) {
		if (null === parentKeyPath) trackedPostpones.rootNodes.push(node);
		else {
			var workingMap = trackedPostpones.workingMap, parentNode = workingMap.get(parentKeyPath);
			void 0 === parentNode && (parentNode = [
				parentKeyPath[1],
				parentKeyPath[2],
				[],
				null
			], workingMap.set(parentKeyPath, parentNode), addToReplayParent(parentNode, parentKeyPath[0], trackedPostpones));
			parentNode[2].push(node);
		}
	}
	function getPostponedState(request) {
		var trackedPostpones = request.trackedPostpones;
		if (null === trackedPostpones || 0 === trackedPostpones.rootNodes.length && null === trackedPostpones.rootSlots) return request.trackedPostpones = null;
		if (null === request.completedRootSegment || 5 !== request.completedRootSegment.status && null !== request.completedPreambleSegments) {
			var nextSegmentId = request.nextSegmentId;
			var replaySlots = trackedPostpones.rootSlots;
			var resumableState = request.resumableState;
			resumableState.bootstrapScriptContent = void 0;
			resumableState.bootstrapScripts = void 0;
			resumableState.bootstrapModules = void 0;
		} else {
			nextSegmentId = 0;
			replaySlots = -1;
			resumableState = request.resumableState;
			var renderState = request.renderState;
			resumableState.nextFormID = 0;
			resumableState.hasBody = !1;
			resumableState.hasHtml = !1;
			resumableState.unknownResources = { font: renderState.resets.font };
			resumableState.dnsResources = renderState.resets.dns;
			resumableState.connectResources = renderState.resets.connect;
			resumableState.imageResources = renderState.resets.image;
			resumableState.styleResources = renderState.resets.style;
			resumableState.scriptResources = {};
			resumableState.moduleUnknownResources = {};
			resumableState.moduleScriptResources = {};
			resumableState.instructions = 0;
		}
		return {
			nextSegmentId,
			rootFormatContext: request.rootFormatContext,
			progressiveChunkSize: request.progressiveChunkSize,
			resumableState: request.resumableState,
			replayNodes: trackedPostpones.rootNodes,
			replaySlots
		};
	}
	function ensureCorrectIsomorphicReactVersion() {
		var isomorphicReactPackageVersion = React.version;
		if ("19.2.8" !== isomorphicReactPackageVersion) throw Error("Incompatible React versions: The \"react\" and \"react-dom\" packages must have the exact same version. Instead got:\n  - react:      " + (isomorphicReactPackageVersion + "\n  - react-dom:  19.2.8\nLearn more: https://react.dev/warnings/version-mismatch"));
	}
	ensureCorrectIsomorphicReactVersion();
	function createDrainHandler(destination, request) {
		return function() {
			return startFlowing(request, destination);
		};
	}
	function createCancelHandler(request, reason) {
		return function() {
			request.destination = null;
			abort(request, Error(reason));
		};
	}
	function createRequestImpl(children, options) {
		var resumableState = createResumableState(options ? options.identifierPrefix : void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.bootstrapScriptContent : void 0, options ? options.bootstrapScripts : void 0, options ? options.bootstrapModules : void 0);
		return createRequest(children, resumableState, createRenderState(resumableState, options ? options.nonce : void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.importMap : void 0, options ? options.onHeaders : void 0, options ? options.maxHeadersLength : void 0), createRootFormatContext(options ? options.namespaceURI : void 0), options ? options.progressiveChunkSize : void 0, options ? options.onError : void 0, options ? options.onAllReady : void 0, options ? options.onShellReady : void 0, options ? options.onShellError : void 0, void 0, options ? options.onPostpone : void 0, options ? options.formState : void 0);
	}
	function createFakeWritableFromReadableStreamController$1(controller) {
		return {
			write: function(chunk) {
				"string" === typeof chunk && (chunk = textEncoder$2.encode(chunk));
				controller.enqueue(chunk);
				return !0;
			},
			end: function() {
				controller.close();
			},
			destroy: function(error) {
				"function" === typeof controller.error ? controller.error(error) : controller.close();
			}
		};
	}
	function resumeRequestImpl(children, postponedState, options) {
		return resumeRequest(children, postponedState, createRenderState(postponedState.resumableState, options ? options.nonce : void 0, void 0, void 0, void 0, void 0), options ? options.onError : void 0, options ? options.onAllReady : void 0, options ? options.onShellReady : void 0, options ? options.onShellError : void 0, void 0, options ? options.onPostpone : void 0);
	}
	ensureCorrectIsomorphicReactVersion();
	function createFakeWritableFromReadableStreamController(controller) {
		return {
			write: function(chunk) {
				"string" === typeof chunk && (chunk = textEncoder$2.encode(chunk));
				controller.enqueue(chunk);
				return !0;
			},
			end: function() {
				controller.close();
			},
			destroy: function(error) {
				"function" === typeof controller.error ? controller.error(error) : controller.close();
			}
		};
	}
	function createFakeWritableFromReadable(readable) {
		return {
			write: function(chunk) {
				return readable.push(chunk);
			},
			end: function() {
				readable.push(null);
			},
			destroy: function(error) {
				readable.destroy(error);
			}
		};
	}
	exports.prerender = function(children, options) {
		return new Promise(function(resolve, reject) {
			var onHeaders = options ? options.onHeaders : void 0, onHeadersImpl;
			onHeaders && (onHeadersImpl = function(headersDescriptor) {
				onHeaders(new Headers(headersDescriptor));
			});
			var resources = createResumableState(options ? options.identifierPrefix : void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.bootstrapScriptContent : void 0, options ? options.bootstrapScripts : void 0, options ? options.bootstrapModules : void 0), request = createPrerenderRequest(children, resources, createRenderState(resources, void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.importMap : void 0, onHeadersImpl, options ? options.maxHeadersLength : void 0), createRootFormatContext(options ? options.namespaceURI : void 0), options ? options.progressiveChunkSize : void 0, options ? options.onError : void 0, function() {
				var writable, stream$1 = new ReadableStream({
					type: "bytes",
					start: function(controller) {
						writable = createFakeWritableFromReadableStreamController(controller);
					},
					pull: function() {
						startFlowing(request, writable);
					},
					cancel: function(reason) {
						request.destination = null;
						abort(request, reason);
					}
				}, { highWaterMark: 0 });
				stream$1 = {
					postponed: getPostponedState(request),
					prelude: stream$1
				};
				resolve(stream$1);
			}, void 0, void 0, reject, options ? options.onPostpone : void 0);
			if (options && options.signal) {
				var signal = options.signal;
				if (signal.aborted) abort(request, signal.reason);
				else {
					var listener = function() {
						abort(request, signal.reason);
						signal.removeEventListener("abort", listener);
					};
					signal.addEventListener("abort", listener);
				}
			}
			startWork(request);
		});
	};
	exports.prerenderToNodeStream = function(children, options) {
		return new Promise(function(resolve, reject) {
			var resumableState = createResumableState(options ? options.identifierPrefix : void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.bootstrapScriptContent : void 0, options ? options.bootstrapScripts : void 0, options ? options.bootstrapModules : void 0), request = createPrerenderRequest(children, resumableState, createRenderState(resumableState, void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.importMap : void 0, options ? options.onHeaders : void 0, options ? options.maxHeadersLength : void 0), createRootFormatContext(options ? options.namespaceURI : void 0), options ? options.progressiveChunkSize : void 0, options ? options.onError : void 0, function() {
				var readable = new stream.Readable({ read: function() {
					startFlowing(request, writable);
				} }), writable = createFakeWritableFromReadable(readable);
				readable = {
					postponed: getPostponedState(request),
					prelude: readable
				};
				resolve(readable);
			}, void 0, void 0, reject, options ? options.onPostpone : void 0);
			if (options && options.signal) {
				var signal = options.signal;
				if (signal.aborted) abort(request, signal.reason);
				else {
					var listener = function() {
						abort(request, signal.reason);
						signal.removeEventListener("abort", listener);
					};
					signal.addEventListener("abort", listener);
				}
			}
			startWork(request);
		});
	};
	exports.renderToPipeableStream = function(children, options) {
		var request = createRequestImpl(children, options), hasStartedFlowing = !1;
		startWork(request);
		return {
			pipe: function(destination) {
				if (hasStartedFlowing) throw Error("React currently only supports piping to one writable stream.");
				hasStartedFlowing = !0;
				safelyEmitEarlyPreloads(request, null === request.trackedPostpones ? 0 === request.pendingRootTasks : null === request.completedRootSegment ? 0 === request.pendingRootTasks : 5 !== request.completedRootSegment.status);
				startFlowing(request, destination);
				destination.on("drain", createDrainHandler(destination, request));
				destination.on("error", createCancelHandler(request, "The destination stream errored while writing data."));
				destination.on("close", createCancelHandler(request, "The destination stream closed early."));
				return destination;
			},
			abort: function(reason) {
				abort(request, reason);
			}
		};
	};
	exports.renderToReadableStream = function(children, options) {
		return new Promise(function(resolve, reject) {
			var onFatalError, onAllReady, allReady = new Promise(function(res, rej) {
				onAllReady = res;
				onFatalError = rej;
			}), onHeaders = options ? options.onHeaders : void 0, onHeadersImpl;
			onHeaders && (onHeadersImpl = function(headersDescriptor) {
				onHeaders(new Headers(headersDescriptor));
			});
			var resumableState = createResumableState(options ? options.identifierPrefix : void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.bootstrapScriptContent : void 0, options ? options.bootstrapScripts : void 0, options ? options.bootstrapModules : void 0), request = createRequest(children, resumableState, createRenderState(resumableState, options ? options.nonce : void 0, options ? options.unstable_externalRuntimeSrc : void 0, options ? options.importMap : void 0, onHeadersImpl, options ? options.maxHeadersLength : void 0), createRootFormatContext(options ? options.namespaceURI : void 0), options ? options.progressiveChunkSize : void 0, options ? options.onError : void 0, onAllReady, function() {
				var writable, stream$1 = new ReadableStream({
					type: "bytes",
					start: function(controller) {
						writable = createFakeWritableFromReadableStreamController$1(controller);
					},
					pull: function() {
						startFlowing(request, writable);
					},
					cancel: function(reason) {
						request.destination = null;
						abort(request, reason);
					}
				}, { highWaterMark: 0 });
				stream$1.allReady = allReady;
				resolve(stream$1);
			}, function(error) {
				allReady.catch(function() {});
				reject(error);
			}, onFatalError, options ? options.onPostpone : void 0, options ? options.formState : void 0);
			if (options && options.signal) {
				var signal = options.signal;
				if (signal.aborted) abort(request, signal.reason);
				else {
					var listener = function() {
						abort(request, signal.reason);
						signal.removeEventListener("abort", listener);
					};
					signal.addEventListener("abort", listener);
				}
			}
			startWork(request);
		});
	};
	exports.resume = function(children, postponedState, options) {
		return new Promise(function(resolve, reject) {
			var onFatalError, onAllReady, allReady = new Promise(function(res, rej) {
				onAllReady = res;
				onFatalError = rej;
			}), request = resumeRequest(children, postponedState, createRenderState(postponedState.resumableState, options ? options.nonce : void 0, void 0, void 0, void 0, void 0), options ? options.onError : void 0, onAllReady, function() {
				var writable, stream$1 = new ReadableStream({
					type: "bytes",
					start: function(controller) {
						writable = createFakeWritableFromReadableStreamController$1(controller);
					},
					pull: function() {
						startFlowing(request, writable);
					},
					cancel: function(reason) {
						request.destination = null;
						abort(request, reason);
					}
				}, { highWaterMark: 0 });
				stream$1.allReady = allReady;
				resolve(stream$1);
			}, function(error) {
				allReady.catch(function() {});
				reject(error);
			}, onFatalError, options ? options.onPostpone : void 0);
			if (options && options.signal) {
				var signal = options.signal;
				if (signal.aborted) abort(request, signal.reason);
				else {
					var listener = function() {
						abort(request, signal.reason);
						signal.removeEventListener("abort", listener);
					};
					signal.addEventListener("abort", listener);
				}
			}
			startWork(request);
		});
	};
	exports.resumeAndPrerender = function(children, postponedState, options) {
		return new Promise(function(resolve, reject) {
			var request = resumeAndPrerenderRequest(children, postponedState, createRenderState(postponedState.resumableState, void 0, void 0, void 0, void 0, void 0), options ? options.onError : void 0, function() {
				var writable, stream$1 = new ReadableStream({
					type: "bytes",
					start: function(controller) {
						writable = createFakeWritableFromReadableStreamController(controller);
					},
					pull: function() {
						startFlowing(request, writable);
					},
					cancel: function(reason) {
						request.destination = null;
						abort(request, reason);
					}
				}, { highWaterMark: 0 });
				stream$1 = {
					postponed: getPostponedState(request),
					prelude: stream$1
				};
				resolve(stream$1);
			}, void 0, void 0, reject, options ? options.onPostpone : void 0);
			if (options && options.signal) {
				var signal = options.signal;
				if (signal.aborted) abort(request, signal.reason);
				else {
					var listener = function() {
						abort(request, signal.reason);
						signal.removeEventListener("abort", listener);
					};
					signal.addEventListener("abort", listener);
				}
			}
			startWork(request);
		});
	};
	exports.resumeAndPrerenderToNodeStream = function(children, postponedState, options) {
		return new Promise(function(resolve, reject) {
			var request = resumeAndPrerenderRequest(children, postponedState, createRenderState(postponedState.resumableState, void 0, void 0, void 0, void 0, void 0), options ? options.onError : void 0, function() {
				var readable = new stream.Readable({ read: function() {
					startFlowing(request, writable);
				} }), writable = createFakeWritableFromReadable(readable);
				readable = {
					postponed: getPostponedState(request),
					prelude: readable
				};
				resolve(readable);
			}, void 0, void 0, reject, options ? options.onPostpone : void 0);
			if (options && options.signal) {
				var signal = options.signal;
				if (signal.aborted) abort(request, signal.reason);
				else {
					var listener = function() {
						abort(request, signal.reason);
						signal.removeEventListener("abort", listener);
					};
					signal.addEventListener("abort", listener);
				}
			}
			startWork(request);
		});
	};
	exports.resumeToPipeableStream = function(children, postponedState, options) {
		var request = resumeRequestImpl(children, postponedState, options), hasStartedFlowing = !1;
		startWork(request);
		return {
			pipe: function(destination) {
				if (hasStartedFlowing) throw Error("React currently only supports piping to one writable stream.");
				hasStartedFlowing = !0;
				startFlowing(request, destination);
				destination.on("drain", createDrainHandler(destination, request));
				destination.on("error", createCancelHandler(request, "The destination stream errored while writing data."));
				destination.on("close", createCancelHandler(request, "The destination stream closed early."));
				return destination;
			},
			abort: function(reason) {
				abort(request, reason);
			}
		};
	};
	exports.version = "19.2.8";
}));
var require_server_node = /* @__PURE__ */ __commonJSMin(((exports) => {
	var l = require_react_dom_server_legacy_node_production(), s = require_react_dom_server_node_production();
	exports.version = l.version;
	exports.renderToString = l.renderToString;
	exports.renderToStaticMarkup = l.renderToStaticMarkup;
	exports.renderToPipeableStream = s.renderToPipeableStream;
	exports.renderToReadableStream = s.renderToReadableStream;
	exports.resumeToPipeableStream = s.resumeToPipeableStream;
	exports.resume = s.resume;
}));
var tsrScript_default = "self.$_TSR={h(){this.hydrated=!0,this.c()},e(){this.streamEnded=!0,this.c()},c(){this.hydrated&&this.streamEnded&&(delete self.$_TSR,delete self.$R.tsr)},p(e){this.initialized?e():this.buffer.push(e)},buffer:[]}";
var SCOPE_ID = "tsr";
var TSR_PREFIX = GLOBAL_TSR + ".router=";
var P_PREFIX = GLOBAL_TSR + ".p(()=>";
var P_SUFFIX = ")";
function dehydrateMatch(match) {
	const dehydratedMatch = {
		i: dehydrateSsrMatchId(match.id),
		u: match.updatedAt,
		s: match.status
	};
	for (const [key, shorthand] of [
		["__beforeLoadContext", "b"],
		["loaderData", "l"],
		["error", "e"],
		["ssr", "ssr"]
	]) if (match[key] !== void 0) dehydratedMatch[shorthand] = match[key];
	if (match._notFound) dehydratedMatch.g = true;
	return dehydratedMatch;
}
var INITIAL_SCRIPTS = [getCrossReferenceHeader(SCOPE_ID), tsrScript_default];
var ScriptBuffer = class {
	constructor(injectScript) {
		this._scriptBarrierLifted = false;
		this._cleanedUp = false;
		this._microtaskVersion = 0;
		this._pendingMicrotaskVersion = 0;
		this.injectScript = injectScript;
		this._queue = INITIAL_SCRIPTS.slice();
	}
	enqueue(script) {
		if (this._cleanedUp) return;
		this._queue.push(script);
		if (this._scriptBarrierLifted) this.scheduleInjectBufferedScripts();
	}
	liftBarrier() {
		if (this._scriptBarrierLifted || this._cleanedUp) return;
		this._scriptBarrierLifted = true;
		if (this._queue.length > 0) this.scheduleInjectBufferedScripts();
	}
	scheduleInjectBufferedScripts() {
		if (this._pendingMicrotaskVersion !== 0) return;
		const pendingVersion = ++this._microtaskVersion;
		this._pendingMicrotaskVersion = pendingVersion;
		queueMicrotask(() => {
			if (this._pendingMicrotaskVersion !== pendingVersion) return;
			this._pendingMicrotaskVersion = 0;
			this.injectBufferedScripts();
		});
	}
	clearPendingMicrotask() {
		if (this._pendingMicrotaskVersion === 0) return;
		this._pendingMicrotaskVersion = 0;
		this._microtaskVersion++;
	}
	flush() {
		if (!this._scriptBarrierLifted) return;
		if (this._cleanedUp) return;
		this.clearPendingMicrotask();
		this.injectBufferedScripts();
	}
	takeAll() {
		return this.takeScripts(this._queue.length);
	}
	takeScripts(count) {
		if (count <= 0) return void 0;
		const bufferedScripts = this._queue.splice(0, count);
		if (bufferedScripts.length === 0) return;
		if (bufferedScripts.length === 1) return bufferedScripts[0] + ";document.currentScript.remove()";
		return bufferedScripts.join(";") + ";document.currentScript.remove()";
	}
	hasPending() {
		return this._queue.length > 0;
	}
	injectBufferedScripts() {
		if (this._cleanedUp) return;
		if (this._queue.length === 0) return;
		const scriptsToInject = this.takeAll();
		if (scriptsToInject) this.injectScript?.(scriptsToInject);
	}
	cleanup() {
		this._cleanedUp = true;
		this.clearPendingMicrotask();
		this._queue = [];
		this.injectScript = void 0;
	}
};
var MANIFEST_CACHE_SIZE = 100;
var manifestCaches = /* @__PURE__ */ new WeakMap();
function getManifestCache(manifest$1) {
	const cache = manifestCaches.get(manifest$1);
	if (cache) return cache;
	const newCache = createLRUCache(MANIFEST_CACHE_SIZE);
	manifestCaches.set(manifest$1, newCache);
	return newCache;
}
function getInlineCssForPreparedRoutes(manifest$1, preparedRoutes) {
	if (preparedRoutes.inlineCss !== void 0) return preparedRoutes.inlineCss;
	const styles = manifest$1.inlineCss?.styles;
	const hrefs = preparedRoutes.inlineCssHrefs;
	if (!styles || !hrefs?.length) return void 0;
	let css = "";
	for (const href of hrefs) css += styles[href];
	preparedRoutes.inlineCss = css;
	return css;
}
function getInlineCssAssetForPreparedRoutes(manifest$1, preparedRoutes) {
	const css = getInlineCssForPreparedRoutes(manifest$1, preparedRoutes);
	return css === void 0 ? void 0 : createInlineCssStyleAsset(css);
}
function getMatchedRoutesCacheKey(matches) {
	let cacheKey = "";
	for (let i = 0; i < matches.length; i++) cacheKey += (i === 0 ? "" : "\0") + matches[i].routeId;
	return cacheKey;
}
function getPreparedMatchedManifestRoutes(manifest$1, matches, cacheKey) {
	{
		const cached = getManifestCache(manifest$1).get(cacheKey);
		if (cached) return cached;
	}
	const preparedRoutes = prepareMatchedManifestRoutes(manifest$1, matches);
	getManifestCache(manifest$1).set(cacheKey, preparedRoutes);
	return preparedRoutes;
}
function prepareMatchedManifestRoutes(manifest$1, matches) {
	const inlineStyles = manifest$1.inlineCss?.styles;
	const routes = {};
	if (!inlineStyles) {
		for (const match of matches) {
			const route = manifest$1.routes[match.routeId];
			if (route) routes[match.routeId] = route;
		}
		return {
			routes,
			hasStrippedRoutes: false
		};
	}
	const inlineCssHrefs = [];
	const seenInlineCssHrefs = /* @__PURE__ */ new Set();
	let hasStrippedRoutes = false;
	for (const match of matches) {
		const routeId = match.routeId;
		const route = manifest$1.routes[routeId];
		if (!route) continue;
		const nextRoute = stripInlinedStylesheetAssetsFromRoute(inlineStyles, route, inlineCssHrefs, seenInlineCssHrefs);
		if (nextRoute !== route) hasStrippedRoutes = true;
		routes[routeId] = nextRoute;
	}
	return {
		routes,
		hasStrippedRoutes,
		...inlineCssHrefs.length ? { inlineCssHrefs } : {}
	};
}
function stripInlinedStylesheetAssetsFromRoute(inlineStyles, route, inlineCssHrefs, seenInlineCssHrefs) {
	const css = route.css;
	if (!css) return route;
	if (css.length === 0) {
		const nextRoute$1 = { ...route };
		delete nextRoute$1.css;
		return nextRoute$1;
	}
	let cssLinks;
	for (let i = 0; i < css.length; i++) {
		const link = css[i];
		const href = getStylesheetHref(link);
		if (inlineStyles[href] === void 0) {
			if (cssLinks) cssLinks.push(link);
			continue;
		}
		if (!seenInlineCssHrefs.has(href)) {
			seenInlineCssHrefs.add(href);
			inlineCssHrefs.push(href);
		}
		if (!cssLinks) cssLinks = css.slice(0, i);
	}
	if (!cssLinks) return route;
	if (cssLinks.length > 0) return {
		...route,
		css: cssLinks
	};
	const nextRoute = { ...route };
	delete nextRoute.css;
	return nextRoute;
}
function hasRouteAssets(route) {
	return !!route.scripts?.length || !!route.css?.length;
}
function hasRequestAssets(assets) {
	return !!assets && (!!assets.preloads?.length || hasRouteAssets(assets));
}
function mergeRequestAssetsIntoRootRoute(rootRoute, requestAssets) {
	const preloads = requestAssets?.preloads?.length ? [...requestAssets.preloads, ...rootRoute?.preloads ?? []] : rootRoute?.preloads;
	const scripts = requestAssets?.scripts?.length ? [...requestAssets.scripts, ...rootRoute?.scripts ?? []] : rootRoute?.scripts;
	const cssLinks = requestAssets?.css?.length ? [...requestAssets.css, ...rootRoute?.css ?? []] : rootRoute?.css;
	return {
		...rootRoute ?? {},
		...preloads?.length ? { preloads } : {},
		...scripts?.length ? { scripts } : {},
		...cssLinks?.length ? { css: cssLinks } : {}
	};
}
function attachRouterServerSsrUtils({ router, manifest: manifest$1, getRequestAssets }) {
	router.ssr = { get manifest() {
		if (!manifest$1) return manifest$1;
		const requestAssets = getRequestAssets?.();
		const matches = _getRenderedMatches(router.stores.matches.get());
		const hasAssets = hasRequestAssets(requestAssets);
		if (!hasAssets && !manifest$1.inlineCss) return manifest$1;
		let inlineCssAsset;
		let routes = manifest$1.routes;
		if (manifest$1.inlineCss) {
			const preparedManifest = getPreparedMatchedManifestRoutes(manifest$1, matches, getMatchedRoutesCacheKey(matches));
			inlineCssAsset = getInlineCssAssetForPreparedRoutes(manifest$1, preparedManifest);
			if (preparedManifest.hasStrippedRoutes) routes = {
				...manifest$1.routes,
				...preparedManifest.routes
			};
		}
		if (!hasAssets) return {
			...manifest$1.scriptFormat ? { scriptFormat: manifest$1.scriptFormat } : {},
			...inlineCssAsset ? { inlineStyle: inlineCssAsset } : {},
			routes
		};
		const rootRoute = routes[rootRouteId];
		return {
			...manifest$1.scriptFormat ? { scriptFormat: manifest$1.scriptFormat } : {},
			...inlineCssAsset ? { inlineStyle: inlineCssAsset } : {},
			routes: {
				...routes,
				[rootRouteId]: mergeRequestAssetsIntoRootRoute(rootRoute, requestAssets)
			}
		};
	} };
	let _dehydrated = false;
	let _serializationFinished = false;
	let streamFastPathReserved = false;
	const renderFinishedListeners = [];
	const injectedHtmlListeners = [];
	const serializationFinishedListeners = [];
	const cleanupListeners = [];
	let cleanupStarted = false;
	let injectedHtmlBuffer = "";
	const callListeners = (listeners, errorPrefix) => {
		const snapshot = listeners.slice();
		for (const l$1 of snapshot) try {
			l$1();
		} catch (err) {
			console.error(`${errorPrefix}:`, err);
		}
	};
	const removeListener = (listeners, listener) => {
		const index = listeners.indexOf(listener);
		if (index >= 0) listeners.splice(index, 1);
	};
	const scriptBuffer = new ScriptBuffer((script) => {
		serverSsr.injectScript(script);
	});
	const serverSsr = {
		injectHtml: (html) => {
			if (!html || cleanupStarted) return;
			injectedHtmlBuffer += html;
			callListeners(injectedHtmlListeners, "SSR injected HTML listener error");
		},
		injectScript: (script) => {
			if (!script || cleanupStarted) return;
			const html = `<script${router.options.ssr?.nonce ? ` nonce='${router.options.ssr.nonce}'` : ""}>${script}<\/script>`;
			serverSsr.injectHtml(html);
		},
		dehydrate: async (opts) => {
			if (_dehydrated) invariant();
			let matchesToDehydrate = _getRenderedMatches(router.stores.matches.get());
			if (router.isShell()) matchesToDehydrate = matchesToDehydrate.slice(0, 1);
			const matches = matchesToDehydrate.map(dehydrateMatch);
			let manifestToDehydrate = void 0;
			if (manifest$1) {
				const cacheKey = getMatchedRoutesCacheKey(matchesToDehydrate);
				const preparedManifest = getPreparedMatchedManifestRoutes(manifest$1, matchesToDehydrate, cacheKey);
				manifestToDehydrate = {
					...manifest$1.scriptFormat ? { scriptFormat: manifest$1.scriptFormat } : {},
					...preparedManifest.inlineCssHrefs ? { inlineStyle: createInlineCssPlaceholderAsset() } : {},
					routes: preparedManifest.routes
				};
				const requestAssets = opts?.requestAssets;
				if (hasRequestAssets(requestAssets)) {
					const existingRoot = manifestToDehydrate.routes[rootRouteId];
					manifestToDehydrate.routes = {
						...manifestToDehydrate.routes,
						[rootRouteId]: mergeRequestAssetsIntoRootRoute(existingRoot, requestAssets)
					};
				}
			}
			const dehydratedRouter = {
				manifest: manifestToDehydrate,
				matches
			};
			const dehydratedData = await router.options.dehydrate?.();
			if (cleanupStarted) return;
			if (dehydratedData) dehydratedRouter.dehydratedData = dehydratedData;
			_dehydrated = true;
			const trackPlugins = { didRun: false };
			const serializationAdapters = router.options.serializationAdapters;
			const plugins = serializationAdapters ? serializationAdapters.map((t) => /* @__PURE__ */ makeSsrSerovalPlugin(t, trackPlugins)).concat(defaultSerovalPlugins) : defaultSerovalPlugins;
			let serializationCompleteSignaled = false;
			const signalSerializationComplete = () => {
				if (serializationCompleteSignaled || cleanupStarted) return;
				serializationCompleteSignaled = true;
				_serializationFinished = true;
				const listeners = serializationFinishedListeners.slice();
				serializationFinishedListeners.length = 0;
				for (const l$1 of listeners) try {
					l$1();
				} catch (err) {
					console.error("Serialization listener error:", err);
				}
			};
			const finishScriptSerialization = () => {
				if (serializationCompleteSignaled || cleanupStarted) return;
				scriptBuffer.enqueue(GLOBAL_TSR + ".e()");
				scriptBuffer.flush();
				signalSerializationComplete();
			};
			crossSerializeStream(dehydratedRouter, {
				refs: /* @__PURE__ */ new Map(),
				plugins,
				onSerialize: (data, initial) => {
					let serialized = initial ? TSR_PREFIX + data : data;
					if (trackPlugins.didRun) serialized = P_PREFIX + serialized + P_SUFFIX;
					scriptBuffer.enqueue(serialized);
				},
				onError: (err) => {
					console.error("Serialization error:", err);
					if (err && err.stack) console.error(err.stack);
					finishScriptSerialization();
				},
				scopeId: SCOPE_ID,
				onDone: () => {
					finishScriptSerialization();
				}
			});
		},
		isDehydrated() {
			return _dehydrated;
		},
		isSerializationFinished() {
			return _serializationFinished;
		},
		reserveStreamFastPath() {
			if (!cleanupStarted && _serializationFinished && !streamFastPathReserved && renderFinishedListeners.length === 0 && !injectedHtmlBuffer && !scriptBuffer.hasPending()) {
				streamFastPathReserved = true;
				return true;
			}
			return false;
		},
		onInjectedHtml: (listener) => {
			if (cleanupStarted) return () => {};
			injectedHtmlListeners.push(listener);
			return () => removeListener(injectedHtmlListeners, listener);
		},
		onRenderFinished: (listener) => {
			if (cleanupStarted || streamFastPathReserved) return;
			renderFinishedListeners.push(listener);
		},
		onSerializationFinished: (listener) => {
			if (cleanupStarted) return () => {};
			if (_serializationFinished && !cleanupStarted) {
				try {
					listener();
				} catch (err) {
					console.error("Serialization listener error:", err);
				}
				return () => {};
			}
			serializationFinishedListeners.push(listener);
			return () => removeListener(serializationFinishedListeners, listener);
		},
		onCleanup: (listener) => {
			if (cleanupStarted) return;
			cleanupListeners.push(listener);
		},
		setRenderFinished: () => {
			if (cleanupStarted) return;
			scriptBuffer.liftBarrier();
			const listeners = renderFinishedListeners.slice();
			renderFinishedListeners.length = 0;
			for (const l$1 of listeners) try {
				l$1();
			} catch (err) {
				console.error("Error in render finished listener:", err);
			}
			if (_serializationFinished) scriptBuffer.flush();
		},
		takeBufferedScripts() {
			const scripts = scriptBuffer.takeAll();
			if (!scripts) return void 0;
			return {
				tag: "script",
				attrs: {
					nonce: router.options.ssr?.nonce,
					className: "$tsr",
					id: TSR_SCRIPT_BARRIER_ID
				},
				children: scripts
			};
		},
		liftScriptBarrier() {
			scriptBuffer.liftBarrier();
		},
		takeBufferedHtml() {
			if (!injectedHtmlBuffer) return;
			const buffered = injectedHtmlBuffer;
			injectedHtmlBuffer = "";
			return buffered;
		},
		cleanup() {
			if (cleanupStarted) return;
			cleanupStarted = true;
			const listeners = cleanupListeners.slice();
			cleanupListeners.length = 0;
			for (const l$1 of listeners) try {
				l$1();
			} catch (err) {
				console.error("Error in SSR cleanup listener:", err);
			}
			renderFinishedListeners.length = 0;
			injectedHtmlListeners.length = 0;
			serializationFinishedListeners.length = 0;
			injectedHtmlBuffer = "";
			scriptBuffer.cleanup();
			router.serverSsr = void 0;
		}
	};
	router.serverSsr = serverSsr;
	for (const listener of router.serverSsrLifecycle?.onServerSsrAttach ?? []) try {
		listener(serverSsr);
	} catch (err) {
		console.error("SSR attach listener error:", err);
	}
}
function getOrigin(request) {
	try {
		return new URL(request.url).origin;
	} catch {}
	return "http://localhost";
}
function getNormalizedURL(url, base) {
	if (typeof url === "string") url = url.replace("\\", "%5C");
	const rawUrl = new URL(url, base);
	const { path: decodedPathname, handledProtocolRelativeURL } = decodePath(rawUrl.pathname);
	const searchParams = new URLSearchParams(rawUrl.search);
	const normalizedHref = decodedPathname + (searchParams.size > 0 ? "?" : "") + searchParams.toString() + rawUrl.hash;
	return {
		url: new URL(normalizedHref, rawUrl.origin),
		handledProtocolRelativeURL
	};
}
function isSsrResponse(value) {
	return typeof value === "object" && value !== null && "response" in value && "serverSsrCleanup" in value;
}
function normalizeSsrResponse(result) {
	return isSsrResponse(result) ? result : {
		response: result,
		serverSsrCleanup: "none"
	};
}
function disposeSsrResponse(response, reason) {
	if (response.serverSsrCleanup !== "stream") return Promise.resolve();
	try {
		return Promise.resolve(response.dispose(reason));
	} catch (error) {
		return Promise.reject(error);
	}
}
function disposeSsrResponseDetached(result, reason, onError$2 = console.error) {
	const ssrResponse = normalizeSsrResponse(result);
	if (ssrResponse.serverSsrCleanup === "stream") {
		disposeSsrResponse(ssrResponse, reason).catch(onError$2);
		return;
	}
	if (ssrResponse.response.body) try {
		ssrResponse.response.body.cancel(reason).catch(onError$2);
	} catch (error) {
		onError$2(error);
	}
}
function createSsrStreamResponse(router, response) {
	if (!response.body) throw new Error("Invariant failed: SSR stream response requires a body");
	let disposed = false;
	return {
		response,
		serverSsrCleanup: "stream",
		async dispose(reason) {
			if (disposed) return;
			disposed = true;
			router.serverSsr?.cleanup();
			try {
				await response.body.cancel(reason);
			} catch {}
		}
	};
}
function bindSsrResponseToRequest(router, result, signal) {
	const ssrResponse = normalizeSsrResponse(result);
	if (ssrResponse.serverSsrCleanup !== "stream") {
		if (signal.aborted) disposeSsrResponseDetached(result, signal.reason);
		return ssrResponse;
	}
	const failed = (error) => {
		router?.serverSsr?.cleanup();
		console.error(error);
	};
	const abort$2 = () => {
		disposeSsrResponseDetached(ssrResponse, signal.reason, failed);
	};
	if (signal.aborted) {
		abort$2();
		return ssrResponse;
	}
	signal.addEventListener("abort", abort$2, { once: true });
	router?.serverSsr?.onCleanup(() => {
		signal.removeEventListener("abort", abort$2);
	});
	return ssrResponse;
}
async function replaceSsrResponse(result, response, reason) {
	await disposeSsrResponse(normalizeSsrResponse(result), reason);
	return {
		response,
		serverSsrCleanup: "none"
	};
}
async function stripSsrResponseBody(result, reason) {
	const ssrResponse = normalizeSsrResponse(result);
	await disposeSsrResponse(ssrResponse, reason);
	return {
		response: new Response(null, ssrResponse.response),
		serverSsrCleanup: "none"
	};
}
function defineHandlerCallback(handler) {
	return handler;
}
function splitSetCookieString(cookiesString) {
	if (Array.isArray(cookiesString)) return cookiesString.flatMap((c) => splitSetCookieString(c));
	if (typeof cookiesString !== "string") return [];
	const cookiesStrings = [];
	let pos = 0;
	let start;
	let ch;
	let lastComma;
	let nextStart;
	let cookiesSeparatorFound;
	const skipWhitespace = () => {
		while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) pos += 1;
		return pos < cookiesString.length;
	};
	const notSpecialChar = () => {
		ch = cookiesString.charAt(pos);
		return ch !== "=" && ch !== ";" && ch !== ",";
	};
	while (pos < cookiesString.length) {
		start = pos;
		cookiesSeparatorFound = false;
		while (skipWhitespace()) {
			ch = cookiesString.charAt(pos);
			if (ch === ",") {
				lastComma = pos;
				pos += 1;
				skipWhitespace();
				nextStart = pos;
				while (pos < cookiesString.length && notSpecialChar()) pos += 1;
				if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
					cookiesSeparatorFound = true;
					pos = nextStart;
					cookiesStrings.push(cookiesString.slice(start, lastComma));
					start = pos;
				} else pos = lastComma + 1;
			} else pos += 1;
		}
		if (!cookiesSeparatorFound || pos >= cookiesString.length) cookiesStrings.push(cookiesString.slice(start));
	}
	return cookiesStrings;
}
function toHeadersInstance(init) {
	if (init instanceof Headers) return init;
	else if (Array.isArray(init)) return new Headers(init);
	else if (typeof init === "object") return new Headers(init);
	else return null;
}
function mergeHeaders(...headers) {
	return headers.reduce((acc, header) => {
		const headersInstance = toHeadersInstance(header);
		if (!headersInstance) return acc;
		for (const [key, value] of headersInstance.entries()) if (key === "set-cookie") splitSetCookieString(value).forEach((cookie) => acc.append("set-cookie", cookie));
		else acc.set(key, value);
		return acc;
	}, new Headers());
}
var requestWaiters = /* @__PURE__ */ new WeakMap();
function removeRequestWaiter(waiters, index, reject) {
	if (waiters[index] !== reject) return;
	if (index !== waiters.length - 1) {
		waiters[index] = void 0;
		return;
	}
	waiters.pop();
	while (waiters.length && waiters[waiters.length - 1] === void 0) waiters.pop();
}
function waitForRequest(value, signal, onLate) {
	const promise = Promise.resolve(value);
	if (signal.aborted) {
		promise.then(onLate, () => {});
		return Promise.reject(signal.reason);
	}
	return new Promise((resolve, reject) => {
		let waiters = requestWaiters.get(signal);
		let index;
		if (waiters) index = waiters.push(reject) - 1;
		else {
			const newWaiters = [reject];
			waiters = newWaiters;
			index = 0;
			requestWaiters.set(signal, newWaiters);
			signal.addEventListener("abort", () => {
				requestWaiters.delete(signal);
				for (const rejectWaiter of newWaiters) rejectWaiter?.(signal.reason);
				newWaiters.length = 0;
			}, { once: true });
		}
		promise.then((result) => {
			removeRequestWaiter(waiters, index, reject);
			if (signal.aborted) onLate?.(result);
			else resolve(result);
		}, (error) => {
			removeRequestWaiter(waiters, index, reject);
			reject(error);
		});
	});
}
function transformReadableStreamWithRouter(router, routerStream, opts) {
	return transformStreamWithRouter(router, routerStream, opts);
}
function transformPipeableStreamWithRouter(router, routerStream, opts) {
	return Readable.fromWeb(transformStreamWithRouter(router, Readable.toWeb(routerStream), opts));
}
var MIN_CLOSING_TAG_LENGTH = 4;
var DEFAULT_SERIALIZATION_TIMEOUT_MS = 6e4;
var DEFAULT_LIFETIME_TIMEOUT_MS = DEFAULT_SERIALIZATION_TIMEOUT_MS * 2;
var MAX_LEFTOVER_CHARS = 2048;
var MAX_TAIL_CHARS = 64 * 1024;
var MAX_ROUTER_HTML_CHARS = 16 * 1024 * 1024;
var MAX_PENDING_WRITE_CHARS = 16 * 1024 * 1024;
var MergeState = {
	ReadingBody: 0,
	HoldingTail: 1,
	AppDone: 2,
	Draining: 3,
	Done: 4
};
var textEncoder$1 = new TextEncoder();
var noop$1 = () => {};
var resolvedPromise = Promise.resolve();
function findHtmlBoundary(str) {
	let lastClosingTagEnd = -1;
	let searchFrom = str.length - MIN_CLOSING_TAG_LENGTH;
	while (searchFrom >= 0) {
		const openSlash = str.lastIndexOf("</", searchFrom);
		if (openSlash === -1) break;
		if ((str.charCodeAt(openSlash + 2) | 32) === 98 && (str.charCodeAt(openSlash + 3) | 32) === 111 && (str.charCodeAt(openSlash + 4) | 32) === 100 && (str.charCodeAt(openSlash + 5) | 32) === 121 && str.charCodeAt(openSlash + 6) === 62) return -openSlash - 2;
		if (lastClosingTagEnd === -1) {
			let i = openSlash + 2;
			const startCode = str.charCodeAt(i);
			if (startCode >= 97 && startCode <= 122 || startCode >= 65 && startCode <= 90) {
				i++;
				while (i < str.length) {
					const code = str.charCodeAt(i);
					if (code >= 97 && code <= 122 || code >= 65 && code <= 90 || code >= 48 && code <= 57 || code === 95 || code === 58 || code === 46 || code === 45) i++;
					else break;
				}
				if (str.charCodeAt(i) === 62) lastClosingTagEnd = i + 1;
			}
		}
		searchFrom = openSlash - 1;
	}
	return lastClosingTagEnd;
}
function safeReleaseReader(reader) {
	try {
		reader.releaseLock();
		return true;
	} catch {
		return false;
	}
}
function safeCancelReader(reader, reason) {
	let cancelPromise;
	try {
		cancelPromise = reader.cancel(reason);
	} catch {}
	if (!safeReleaseReader(reader) && cancelPromise) return cancelPromise.then(noop$1, noop$1).then(() => {
		safeReleaseReader(reader);
	});
	return cancelPromise ? cancelPromise.then(noop$1, noop$1) : resolvedPromise;
}
function createReaderState(appStream) {
	const reader = appStream.getReader();
	let released = false;
	return {
		reader,
		cancel: (reason) => {
			if (released) return resolvedPromise;
			released = true;
			return safeCancelReader(reader, reason);
		},
		release: () => {
			if (released) return;
			released = true;
			safeReleaseReader(reader);
		}
	};
}
function createAbortNotifier(opts) {
	let abortNotified = false;
	return (reason) => {
		if (abortNotified) return;
		abortNotified = true;
		try {
			opts?.onAbort?.(reason);
		} catch {}
	};
}
function listenToAbort(signal, onAbort) {
	if (!signal) return;
	if (signal.aborted) {
		onAbort(signal.reason);
		return;
	}
	const listener = () => onAbort(signal.reason);
	signal.addEventListener("abort", listener, { once: true });
	return () => signal.removeEventListener("abort", listener);
}
function transformStreamWithRouter(router, appStream, opts) {
	const serverSsr = router.serverSsr;
	if (!serverSsr) throw new Error("Invariant failed: router.serverSsr is required");
	if (serverSsr.reserveStreamFastPath()) return makeFastPathStream(appStream, opts, serverSsr);
	return makeMainStream(serverSsr, appStream, opts);
}
function makeFastPathStream(appStream, opts, serverSsr) {
	let cleanedUp = false;
	let controller;
	let state = MergeState.ReadingBody;
	let lifetimeTimeoutHandle;
	let stopListeningToAbort;
	let stopListeningToInjectedHtml;
	const readerState = createReaderState(appStream);
	const notifyAbort = createAbortNotifier(opts);
	const isDone = () => state === MergeState.Done;
	let renderFinished = false;
	const finishSsrRendering = () => {
		if (!serverSsr || renderFinished) return true;
		renderFinished = true;
		try {
			serverSsr.setRenderFinished();
			return true;
		} catch (error) {
			safeError(error);
			cleanup(error);
			return false;
		}
	};
	const cleanup = (reason, cancelReader = true) => {
		if (cleanedUp) return resolvedPromise;
		cleanedUp = true;
		if (lifetimeTimeoutHandle !== void 0) {
			clearTimeout(lifetimeTimeoutHandle);
			lifetimeTimeoutHandle = void 0;
		}
		stopListeningToAbort?.();
		stopListeningToAbort = void 0;
		try {
			stopListeningToInjectedHtml?.();
		} catch {}
		stopListeningToInjectedHtml = void 0;
		if (cancelReader) notifyAbort(reason);
		const readerDone = cancelReader ? readerState.cancel(reason) : (readerState.release(), resolvedPromise);
		if (serverSsr) try {
			serverSsr.cleanup();
		} catch (error) {
			console.error("Error in SSR cleanup:", error);
		}
		return readerDone;
	};
	const safeClose = () => {
		if (isDone()) return;
		state = MergeState.Done;
		try {
			controller?.close();
		} catch {}
	};
	const safeError = (error) => {
		if (isDone()) return;
		state = MergeState.Done;
		try {
			controller?.error(error);
		} catch {}
	};
	if (serverSsr) stopListeningToInjectedHtml = serverSsr.onInjectedHtml(() => {
		const err = /* @__PURE__ */ new Error("SSR router HTML injected during fast path");
		safeError(err);
		cleanup(err);
	});
	const lifetimeMs = opts?.lifetimeMs ?? DEFAULT_LIFETIME_TIMEOUT_MS;
	lifetimeTimeoutHandle = setTimeout(() => {
		if (!cleanedUp && !isDone()) {
			const err = /* @__PURE__ */ new Error("Stream lifetime exceeded");
			console.warn(`SSR stream transform exceeded maximum lifetime (${lifetimeMs}ms), forcing cleanup`);
			safeError(err);
			cleanup(err);
		}
	}, lifetimeMs);
	const stream$1 = new ReadableStream$1({
		start(c) {
			controller = c;
		},
		async pull(c) {
			if (cleanedUp || isDone()) return;
			try {
				const { done, value } = await readerState.reader.read();
				if (!done) {
					if (!cleanedUp && !isDone()) c.enqueue(value);
					return;
				}
				if (cleanedUp || isDone()) return;
				if (!finishSsrRendering()) return;
				safeClose();
				return cleanup(void 0, false);
			} catch (error) {
				if (cleanedUp) return;
				console.error("Error reading appStream:", error);
				if (state < MergeState.AppDone) try {
					serverSsr?.setRenderFinished();
				} catch {}
				safeError(error);
				return cleanup(error);
			} finally {
				if (cleanedUp || isDone()) readerState.release();
			}
		},
		cancel(reason) {
			state = MergeState.Done;
			return cleanup(reason);
		}
	});
	stopListeningToAbort = listenToAbort(opts?.signal, (reason) => {
		safeError(reason);
		cleanup(reason);
	});
	return stream$1;
}
function makeMainStream(serverSsr, appStream, opts) {
	let stopListeningToInjectedHtml;
	let stopListeningToSerializationFinished;
	let serializationTimeoutHandle;
	let lifetimeTimeoutHandle;
	let stopListeningToAbort;
	let cleanedUp = false;
	let controller;
	let closeWhenDrained = false;
	let state = MergeState.ReadingBody;
	const readerState = createReaderState(appStream);
	const notifyAbort = createAbortNotifier(opts);
	const pendingWrites = [];
	let pendingWriteHead = 0;
	let pendingWriteChars = 0;
	function clearPending() {
		pendingWrites.length = 0;
		pendingWriteHead = 0;
		pendingWriteChars = 0;
	}
	let drainResolve = null;
	const waitForDrain = () => new Promise((r) => {
		drainResolve = r;
	});
	const signalDrain = () => {
		if (drainResolve) {
			const r = drainResolve;
			drainResolve = null;
			r();
		}
	};
	const isDone = () => state === MergeState.Done;
	function drainPending() {
		if (!controller || isDone()) return;
		while (pendingWriteHead < pendingWrites.length) {
			const ds = controller.desiredSize;
			if (ds !== null && ds <= 0) return;
			const next = pendingWrites[pendingWriteHead];
			pendingWrites[pendingWriteHead] = "";
			pendingWriteHead++;
			pendingWriteChars -= next.length;
			try {
				controller.enqueue(textEncoder$1.encode(next));
			} catch (error) {
				safeError(error);
				cleanup(error);
				return;
			}
		}
		if (pendingWriteHead >= pendingWrites.length) {
			pendingWrites.length = 0;
			pendingWriteHead = 0;
		}
		if (closeWhenDrained && pendingWriteHead >= pendingWrites.length) {
			closeWhenDrained = false;
			safeClose();
			cleanup(void 0, false);
		}
	}
	function writeChunk$1(chunk) {
		if (cleanedUp || isDone()) return;
		if (!chunk.length) return;
		if (pendingWriteChars + chunk.length > MAX_PENDING_WRITE_CHARS) {
			const err = /* @__PURE__ */ new Error("SSR stream pending output exceeded maximum buffer");
			safeError(err);
			cleanup(err);
			return;
		}
		pendingWrites.push(chunk);
		pendingWriteChars += chunk.length;
		drainPending();
	}
	function safeClose() {
		if (isDone()) return;
		state = MergeState.Done;
		try {
			controller?.close();
		} catch {}
	}
	function safeError(error) {
		if (isDone()) return;
		state = MergeState.Done;
		try {
			controller?.error(error);
		} catch {}
	}
	function cleanup(reason, cancelReader = true) {
		if (cleanedUp) return resolvedPromise;
		cleanedUp = true;
		try {
			stopListeningToInjectedHtml?.();
			stopListeningToSerializationFinished?.();
		} catch {}
		stopListeningToInjectedHtml = void 0;
		stopListeningToSerializationFinished = void 0;
		stopListeningToAbort?.();
		stopListeningToAbort = void 0;
		if (serializationTimeoutHandle !== void 0) {
			clearTimeout(serializationTimeoutHandle);
			serializationTimeoutHandle = void 0;
		}
		if (lifetimeTimeoutHandle !== void 0) {
			clearTimeout(lifetimeTimeoutHandle);
			lifetimeTimeoutHandle = void 0;
		}
		clearPendingRouterHtml();
		leftover = "";
		pendingTail = "";
		clearPending();
		if (cancelReader) notifyAbort(reason);
		const readerDone = cancelReader ? readerState.cancel(reason) : (readerState.release(), resolvedPromise);
		signalDrain();
		try {
			serverSsr.cleanup();
		} catch (error) {
			console.error("Error in SSR cleanup:", error);
		}
		return readerDone;
	}
	const textDecoder = new TextDecoder();
	const pendingRouterHtml = [];
	let pendingRouterHtmlChars = 0;
	let leftover = "";
	let pendingTail = "";
	let streamBarrierLifted = false;
	let streamBarrierMarkerSeen = false;
	let serializationFinished = false;
	function noteBarrierMarker(chunk) {
		if (streamBarrierMarkerSeen) return;
		if (chunk.includes("$tsr-stream-barrier")) streamBarrierMarkerSeen = true;
	}
	function liftBarrierAfterBoundary() {
		if (streamBarrierLifted) return;
		if (!streamBarrierMarkerSeen) return;
		streamBarrierLifted = true;
		serverSsr.liftScriptBarrier();
	}
	const stream$1 = new ReadableStream$1({
		start(c) {
			controller = c;
			drainPending();
		},
		pull() {
			drainPending();
			signalDrain();
		},
		cancel(reason) {
			state = MergeState.Done;
			return cleanup(reason);
		}
	});
	function drainRouterHtml() {
		if (cleanedUp || isDone()) return;
		let html;
		try {
			html = serverSsr.takeBufferedHtml();
		} catch (error) {
			safeError(error);
			cleanup(error);
			return;
		}
		if (!html) return;
		if (state >= MergeState.Draining) {
			const err = /* @__PURE__ */ new Error("SSR router HTML injected after stream finalization");
			safeError(err);
			cleanup(err);
			return;
		}
		if (state === MergeState.HoldingTail) {
			flushPendingRouterHtml();
			writeChunk$1(html);
		} else {
			if (pendingRouterHtmlChars + html.length > MAX_ROUTER_HTML_CHARS) {
				const err = /* @__PURE__ */ new Error("SSR router HTML exceeded maximum buffer");
				safeError(err);
				cleanup(err);
				return;
			}
			pendingRouterHtml.push(html);
			pendingRouterHtmlChars += html.length;
		}
	}
	function flushPendingRouterHtml() {
		if (!pendingRouterHtml.length) return;
		for (const html of pendingRouterHtml) writeChunk$1(html);
		clearPendingRouterHtml();
	}
	function clearPendingRouterHtml() {
		pendingRouterHtml.length = 0;
		pendingRouterHtmlChars = 0;
	}
	function appendTail(chunk) {
		pendingTail += chunk;
		if (pendingTail.length > MAX_TAIL_CHARS) throw new Error("SSR stream tail exceeded maximum buffer");
	}
	function waitForBackpressure() {
		return !!(controller && controller.desiredSize !== null && controller.desiredSize <= 0);
	}
	function startSerializationTimeout() {
		if (cleanedUp || isDone()) return;
		if (serializationTimeoutHandle !== void 0) return;
		const timeoutMs$1 = opts?.timeoutMs ?? DEFAULT_SERIALIZATION_TIMEOUT_MS;
		serializationTimeoutHandle = setTimeout(() => {
			if (!cleanedUp && !isDone()) {
				const err = /* @__PURE__ */ new Error("Serialization timeout after app render finished");
				console.error("Serialization timeout after app render finished");
				safeError(err);
				cleanup(err);
			}
		}, timeoutMs$1);
	}
	function tryFinish() {
		if (state !== MergeState.AppDone || !serializationFinished) return;
		if (cleanedUp || isDone()) return;
		if (serializationTimeoutHandle !== void 0) {
			clearTimeout(serializationTimeoutHandle);
			serializationTimeoutHandle = void 0;
		}
		drainRouterHtml();
		if (cleanedUp || isDone()) return;
		const decoderRemainder = textDecoder.decode();
		if (leftover) writeChunk$1(leftover);
		if (cleanedUp || isDone()) return;
		if (decoderRemainder) writeChunk$1(decoderRemainder);
		if (cleanedUp || isDone()) return;
		flushPendingRouterHtml();
		if (cleanedUp || isDone()) return;
		if (pendingTail) writeChunk$1(pendingTail);
		if (cleanedUp || isDone()) return;
		leftover = "";
		pendingTail = "";
		state = MergeState.Draining;
		closeWhenDrained = true;
		drainPending();
	}
	function finishAppRendering() {
		if (state >= MergeState.AppDone) return;
		state = MergeState.AppDone;
		try {
			serverSsr.setRenderFinished();
		} catch (error) {
			safeError(error);
			cleanup(error);
			return;
		}
		drainRouterHtml();
		if (cleanedUp || isDone()) return;
		serializationFinished = serializationFinished || serverSsr.isSerializationFinished();
		if (serializationFinished) tryFinish();
		else startSerializationTimeout();
	}
	const timeoutMs = opts?.timeoutMs ?? DEFAULT_SERIALIZATION_TIMEOUT_MS;
	const lifetimeMs = opts?.lifetimeMs ?? timeoutMs * 2;
	lifetimeTimeoutHandle = setTimeout(() => {
		if (!cleanedUp && !isDone()) {
			const err = /* @__PURE__ */ new Error("Stream lifetime exceeded");
			console.warn(`SSR stream transform exceeded maximum lifetime (${lifetimeMs}ms), forcing cleanup`);
			safeError(err);
			cleanup(err);
		}
	}, lifetimeMs);
	stopListeningToInjectedHtml = serverSsr.onInjectedHtml(() => {
		drainRouterHtml();
	});
	stopListeningToSerializationFinished = serverSsr.onSerializationFinished(() => {
		serializationFinished = true;
		drainRouterHtml();
		tryFinish();
	});
	drainRouterHtml();
	if (cleanedUp || isDone()) return stream$1;
	serializationFinished = serializationFinished || serverSsr.isSerializationFinished();
	if (serializationFinished) {
		drainRouterHtml();
		if (cleanedUp || isDone()) return stream$1;
	}
	stopListeningToAbort = listenToAbort(opts?.signal, (reason) => {
		safeError(reason);
		cleanup(reason);
	});
	if (cleanedUp || isDone()) return stream$1;
	(async () => {
		try {
			while (true) {
				if (waitForBackpressure()) {
					await waitForDrain();
					if (cleanedUp || isDone()) return;
				}
				const { done, value } = await readerState.reader.read();
				if (done) break;
				if (cleanedUp || isDone()) return;
				const text = typeof value === "string" ? value : textDecoder.decode(value, { stream: true });
				const chunkString = leftover ? leftover + text : text;
				if (state >= MergeState.HoldingTail) {
					appendTail(chunkString);
					leftover = "";
					continue;
				}
				const boundary = findHtmlBoundary(chunkString);
				if (boundary < -1) {
					const bodyEndIndex = -boundary - 2;
					state = MergeState.HoldingTail;
					appendTail(chunkString.slice(bodyEndIndex));
					const bodyChunk = chunkString.slice(0, bodyEndIndex);
					writeChunk$1(bodyChunk);
					if (cleanedUp || isDone()) return;
					noteBarrierMarker(bodyChunk);
					liftBarrierAfterBoundary();
					if (cleanedUp || isDone()) return;
					flushPendingRouterHtml();
					leftover = "";
					continue;
				}
				const lastClosingTagEnd = boundary;
				if (lastClosingTagEnd > 0) {
					const safeChunk = chunkString.slice(0, lastClosingTagEnd);
					writeChunk$1(safeChunk);
					if (cleanedUp || isDone()) return;
					noteBarrierMarker(safeChunk);
					liftBarrierAfterBoundary();
					if (cleanedUp || isDone()) return;
					flushPendingRouterHtml();
					leftover = chunkString.slice(lastClosingTagEnd);
					if (leftover.length > MAX_LEFTOVER_CHARS) {
						noteBarrierMarker(leftover);
						writeChunk$1(leftover.slice(0, leftover.length - MAX_LEFTOVER_CHARS));
						leftover = leftover.slice(-2048);
					}
				} else {
					const combined = chunkString;
					if (combined.length > MAX_LEFTOVER_CHARS) {
						noteBarrierMarker(combined);
						const flushUpto = combined.length - MAX_LEFTOVER_CHARS;
						writeChunk$1(combined.slice(0, flushUpto));
						leftover = combined.slice(flushUpto);
					} else leftover = combined;
				}
			}
			if (cleanedUp || isDone()) return;
			finishAppRendering();
		} catch (error) {
			if (cleanedUp) return;
			console.error("Error reading appStream:", error);
			if (state < MergeState.AppDone) try {
				serverSsr.setRenderFinished();
			} catch {}
			safeError(error);
			cleanup(error);
		} finally {
			readerState.release();
		}
	})().catch((error) => {
		if (cleanedUp) return;
		console.error("Error in stream transform:", error);
		safeError(error);
		cleanup(error);
	});
	return stream$1;
}
var fullPattern = " daum[ /]| deusu/|(?:^|[^g])news(?!sapphire)|(?<! channel/|google/)google(?!(?:wv|app|/google| pixel))|(?<! cu)bots?(?:\\b|_)|(?<!cam)scan|(?<!lib)http|24x7|;\\s\\w+;$|@[a-z][\\w-]+\\.|\\(\\)|\\.com\\b|\\b\\w+/1\\.0;|\\bbw/|\\bdlc\\b|\\bort/|\\bperl\\b|\\btime/|\\||^[<\\(;]|^[\\w \\.\\-\\(?:\\):%]+(?:/v?\\d+(?:\\.\\d+)?(?:\\.\\d{1,10})*?)?(?:,|$)|^[\\w\\-]+/[\\w]+$|^[^ ]{50,}$|^\\d+\\b|^\\w*search\\b|^\\w+/[\\w\\(\\)]*$|^\\w+/\\d\\.\\d\\s\\([\\w@]+\\)$|^active|^ad muncher|^amaya|^apache/|^avsdevicesdk/|^azure|^biglotron|^blackbox exporter|^bot|^clamav[ /]|^claude-code/|^client/|^cobweb/|^custom|^ddg[_-]android|^discourse|^dispatch/\\d|^downcast/|^duckduckgo|^email|^exodusmovement|^facebook|^getright/|^gozilla/|^hobbit|^hotzonu|^hwcdn/|^igetter/|^jeode/|^jetty/|^jigsaw|^microsoft bits|^movabletype|^mozilla/\\d\\.\\d\\s[\\w\\.-]+$|^mozilla/\\d\\.\\d\\s\\((?:compatible;)?(?:\\s?[\\w\\d-.]+\\/\\d+\\.\\d+)?\\)$|^navermailapp|^netsurf|^offline|^openai/|^owler|^php|^postman|^ps_daily/|^python|^rank|^read|^reed|^remove\\.bg/|^rest|^rss|^snapchat|^sora |^space bison|^stape/|^svn|^swcd |^taringa|^thumbor/|^track|^w3c|^webbandit/|^webcopier|^wget|^whatsapp|^wordpress|^xenu link sleuth|^yahoo|^yandex|^zdm/\\d|^zoom marketplace/|abuse|advisor|agent\\b|analyzer|archive|ask jeeves/teoma|attracta|audit|bluecoat drtr|browsex|burpcollaborator|capture|catch|check\\b|checker|chrome-lighthouse|chromeframe|classifier|cloudflare|collapsify\\b|convertify|cookiehubverify/|crawl|cursor/|cypress/|dareboost|datanyze|dejaclick|detect|discovery|dmbrowser|download|exaleadcloudview|feed|firephp|foregenix|functionize|grab|hardenize\\b|headless|hotjar|httrack|hubspot marketing grader|ibisbrowser|infrawatch|insight|inspect|iplabel|java(?!;)|library|linkcheck|linktiger|mail\\.ru/|manager|manus-user/|marketgoo/|measure|monitor\\b|neustar wpm|node\\b|nutch|offbyone|openvas|optimize|pageburst|pagespeed|parser|phantomjs|pingdom|playwright|powermarks|preview|productfinder|prospectingstudio|proxy|ptst[ /]\\d|radar|readable/|retriever|rexx;|rigor|rss\\b|scrape|securityheaders|selenium|server|silktide|sindup/|sogou|sparkler/|speedcurve|spider|splash|statuscake|supercleaner|synapse|synthetic|testlocally|tools|torrent|transcoder|url|validator|virtuoso|wappalyzer|watchtowr|webglance|webkit2png|whatcms/|xtate/";
var naivePattern = /bot|crawl|http|lighthouse|scan|search|spider/i;
var pattern;
function getPattern() {
	if (pattern instanceof RegExp) return pattern;
	try {
		pattern = new RegExp(fullPattern, "i");
	} catch (error) {
		pattern = naivePattern;
	}
	return pattern;
}
var isNonEmptyString = (value) => typeof value === "string" && value !== "";
function isBot(userAgent) {
	return isNonEmptyString(userAgent) && getPattern().test(userAgent);
}
var isbot = isBot;
var import_server_node = /* @__PURE__ */ __toESM(require_server_node(), 1);
var noop = () => {};
async function waitForReadyOrAbort(ready, signal) {
	let cleanup = noop;
	try {
		await Promise.race([ready, new Promise((resolve) => {
			const onAbort = () => resolve();
			cleanup = () => signal.removeEventListener("abort", onAbort);
			signal.addEventListener("abort", onAbort, { once: true });
			if (signal.aborted) resolve();
		})]);
	} finally {
		cleanup();
	}
}
var isAbortError = (request, error) => request.signal.aborted && error === request.signal.reason || error instanceof Error && error.name === "AbortError";
var renderRouterToStream = async ({ request, router, responseHeaders, children }) => {
	if (typeof import_server_node.renderToReadableStream === "function") {
		const stream$1 = await import_server_node.renderToReadableStream(children, {
			signal: request.signal,
			nonce: router.options.ssr?.nonce,
			progressiveChunkSize: Number.POSITIVE_INFINITY,
			onError: (error, info) => {
				if (!isAbortError(request, error)) console.error("Error in renderToReadableStream:", error, info);
			}
		});
		if (isbot(request.headers.get("User-Agent"))) await waitForReadyOrAbort(stream$1.allReady, request.signal);
		const responseStream = transformReadableStreamWithRouter(router, stream$1, {
			signal: request.signal,
			onAbort: () => stream$1.cancel().catch(() => {})
		});
		return createSsrStreamResponse(router, new Response(responseStream, {
			status: router._serverResult?.type === "render" ? router._serverResult.status : 200,
			headers: responseHeaders
		}));
	}
	if (typeof import_server_node.renderToPipeableStream === "function") {
		const reactAppPassthrough = new PassThrough();
		let pipeable;
		let responseAttached = false;
		let aborted = false;
		let endedBeforeAttach = false;
		let pendingAbortReason;
		const toError = (reason) => reason instanceof Error ? reason : new Error(String(reason ?? "SSR aborted"));
		const destroyError = (reason) => reason === void 0 ? void 0 : toError(reason);
		const pendingDestroyError = () => pendingAbortReason === void 0 ? toError(pendingAbortReason) : destroyError(pendingAbortReason);
		const finishPassThrough = (reason, opts) => {
			if (reactAppPassthrough.destroyed) return;
			if (responseAttached) reactAppPassthrough.destroy(opts?.defaultError ? toError(reason) : destroyError(reason));
			else endedBeforeAttach = true;
		};
		const abortPipeable = (reason, opts) => {
			if (aborted) return;
			aborted = true;
			pendingAbortReason = reason;
			const err = toError(reason);
			try {
				pipeable?.abort(err);
			} catch {}
			finishPassThrough(reason, opts);
		};
		if (request.signal.aborted) abortPipeable(request.signal.reason);
		else {
			const onRequestAbort = () => abortPipeable(request.signal.reason);
			request.signal.addEventListener("abort", onRequestAbort, { once: true });
			router.serverSsr?.onCleanup(() => {
				request.signal.removeEventListener("abort", onRequestAbort);
			});
		}
		try {
			pipeable = import_server_node.renderToPipeableStream(children, {
				nonce: router.options.ssr?.nonce,
				progressiveChunkSize: Number.POSITIVE_INFINITY,
				...isbot(request.headers.get("User-Agent")) ? { onAllReady() {
					pipeable.pipe(reactAppPassthrough);
				} } : { onShellReady() {
					pipeable.pipe(reactAppPassthrough);
				} },
				onError: (error, info) => {
					if (!isAbortError(request, error)) console.error("Error in renderToPipeableStream:", error, info);
					abortPipeable(error, { defaultError: true });
				}
			});
		} catch (e) {
			console.error("Error in renderToPipeableStream:", e);
			router.serverSsr?.cleanup();
			throw e;
		}
		const responseStream = transformPipeableStreamWithRouter(router, reactAppPassthrough, {
			signal: request.signal,
			onAbort: abortPipeable
		});
		responseAttached = true;
		if (endedBeforeAttach) reactAppPassthrough.destroy(pendingDestroyError());
		if (aborted && pipeable) try {
			pipeable.abort(toError(pendingAbortReason));
		} catch {}
		return createSsrStreamResponse(router, new Response(responseStream, {
			status: router._serverResult?.type === "render" ? router._serverResult.status : 200,
			headers: responseHeaders
		}));
	}
	throw new Error("No renderToReadableStream or renderToPipeableStream found in react-dom/server. Ensure you are using a version of react-dom that supports streaming.");
};
var defaultStreamHandler = defineHandlerCallback(({ request, router, responseHeaders }) => renderRouterToStream({
	request,
	router,
	responseHeaders,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartServer, { router })
}));
var NullProtoObj = /* @__PURE__ */ (() => {
	const e = function() {};
	return e.prototype = Object.create(null), Object.freeze(e.prototype), e;
})();
function lazyInherit(target, source, sourceKey) {
	for (const key of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
		if (key === "constructor") continue;
		const targetDesc = Object.getOwnPropertyDescriptor(target, key);
		const desc = Object.getOwnPropertyDescriptor(source, key);
		let modified = false;
		if (desc.get) {
			modified = true;
			desc.get = targetDesc?.get || function() {
				return this[sourceKey][key];
			};
		}
		if (desc.set) {
			modified = true;
			desc.set = targetDesc?.set || function(value) {
				this[sourceKey][key] = value;
			};
		}
		if (!targetDesc?.value && typeof desc.value === "function") {
			modified = true;
			desc.value = function(...args) {
				return this[sourceKey][key](...args);
			};
		}
		if (modified) Object.defineProperty(target, key, desc);
	}
}
var _needsNormRE = /(?:(?:^|\/)(?:\.|\.\.|%2e|%2e\.|\.%2e|%2e%2e)(?:\/|$))|[\\^#"<>{}`\x80-\uffff]/i;
var _searchNeedsNormRE = /[#"'<>]/;
var FastURL = /* @__PURE__ */ (() => {
	const NativeURL = globalThis.URL;
	const FastURL$1 = class URL$1 {
		#url;
		#href;
		#protocol;
		#host;
		#pathname;
		#search;
		#searchParams;
		#pos;
		constructor(url) {
			if (typeof url === "string") {
				const isOriginForm = url[0] === "/";
				if (isOriginForm && !_searchNeedsNormRE.test(url)) this.#href = url;
				else this.#url = new NativeURL(isOriginForm ? `http://localhost${url}` : url);
			} else if (_needsNormRE.test(url.pathname) || url.search && _searchNeedsNormRE.test(url.search)) this.#url = new NativeURL(`${url.protocol || "http:"}//${url.host || "localhost"}${url.pathname}${url.search || ""}`);
			else {
				this.#protocol = url.protocol;
				this.#host = url.host;
				this.#pathname = url.pathname;
				this.#search = url.search;
			}
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeURL;
		}
		get _url() {
			if (this.#url) return this.#url;
			this.#url = new NativeURL(this.href);
			this.#href = void 0;
			this.#protocol = void 0;
			this.#host = void 0;
			this.#pathname = void 0;
			this.#search = void 0;
			this.#searchParams = void 0;
			this.#pos = void 0;
			return this.#url;
		}
		get href() {
			if (this.#url) return this.#url.href;
			if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
			return this.#href;
		}
		#getPos() {
			if (!this.#pos) {
				const url = this.href;
				const protoIndex = url.indexOf("://");
				const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
				this.#pos = [
					protoIndex,
					pathnameIndex,
					pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex)
				];
			}
			return this.#pos;
		}
		get pathname() {
			if (this.#url) return this.#url.pathname;
			if (this.#pathname === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.pathname;
				this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
			}
			return this.#pathname;
		}
		get search() {
			if (this.#url) return this.#url.search;
			if (this.#search === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.search;
				const url = this.href;
				this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
			}
			return this.#search;
		}
		get searchParams() {
			if (this.#url) return this.#url.searchParams;
			if (!this.#searchParams) this.#searchParams = new URLSearchParams(this.search);
			return this.#searchParams;
		}
		get protocol() {
			if (this.#url) return this.#url.protocol;
			if (this.#protocol === void 0) {
				const [protocolIndex] = this.#getPos();
				if (protocolIndex === -1) return this._url.protocol;
				this.#protocol = this.href.slice(0, protocolIndex + 1);
			}
			return this.#protocol;
		}
		toString() {
			return this.href;
		}
		toJSON() {
			return this.href;
		}
	};
	lazyInherit(FastURL$1.prototype, NativeURL.prototype, "_url");
	Object.setPrototypeOf(FastURL$1.prototype, NativeURL.prototype);
	Object.setPrototypeOf(FastURL$1, NativeURL);
	return FastURL$1;
})();
var NodeResponse = /* @__PURE__ */ (() => {
	const NativeResponse = globalThis.Response;
	const STATUS_CODES = globalThis.process?.getBuiltinModule?.("node:http")?.STATUS_CODES || {};
	class NodeResponse$1 {
		#body;
		#init;
		#headers;
		#response;
		constructor(body, init) {
			this.#body = body;
			this.#init = init;
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeResponse;
		}
		get status() {
			return this.#response?.status || this.#init?.status || 200;
		}
		get statusText() {
			return this.#response?.statusText || this.#init?.statusText || STATUS_CODES[this.status] || "";
		}
		get headers() {
			if (this.#response) return this.#response.headers;
			if (this.#headers) return this.#headers;
			const initHeaders = this.#init?.headers;
			return this.#headers = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders);
		}
		get ok() {
			if (this.#response) return this.#response.ok;
			const status = this.status;
			return status >= 200 && status < 300;
		}
		get _response() {
			if (this.#response) return this.#response;
			let body = this.#body;
			if (body && typeof body.pipe === "function" && !(body instanceof Readable)) {
				const stream$1 = new PassThrough();
				body.pipe(stream$1);
				const abort$2 = body.abort;
				if (abort$2) stream$1.once("close", () => abort$2());
				body = stream$1;
			}
			this.#response = new NativeResponse(body, this.#headers ? {
				...this.#init,
				headers: this.#headers
			} : this.#init);
			this.#init = void 0;
			this.#headers = void 0;
			this.#body = void 0;
			return this.#response;
		}
		_toNodeResponse() {
			const status = this.status;
			const statusText = this.statusText;
			let body;
			let contentType;
			let contentLength;
			if (this.#response) body = this.#response.body;
			else if (this.#body) if (this.#body instanceof ReadableStream) body = this.#body;
			else if (typeof this.#body === "string") {
				body = this.#body;
				contentType = "text/plain; charset=UTF-8";
				contentLength = Buffer.byteLength(this.#body);
			} else if (this.#body instanceof ArrayBuffer) {
				body = Buffer.from(this.#body);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Uint8Array) {
				body = this.#body;
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof DataView) {
				body = Buffer.from(this.#body.buffer);
				contentLength = this.#body.byteLength;
			} else if (this.#body instanceof Blob) {
				body = this.#body.stream();
				contentType = this.#body.type;
				contentLength = this.#body.size;
			} else if (typeof this.#body.pipe === "function") body = this.#body;
			else body = this._response.body;
			const headers = [];
			const initHeaders = this.#init?.headers;
			const headerEntries = this.#response?.headers || this.#headers || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : initHeaders?.entries ? initHeaders.entries() : Object.entries(initHeaders) : void 0);
			let hasContentTypeHeader;
			let hasContentLength;
			if (headerEntries) for (const [key, value] of headerEntries) {
				const lowerKey = typeof key === "string" ? key.toLowerCase() : String(key);
				if (Array.isArray(value)) for (const v of value) headers.push(lowerKey, v);
				else headers.push(lowerKey, value);
				if (lowerKey === "content-type") hasContentTypeHeader = true;
				else if (lowerKey === "content-length") hasContentLength = true;
			}
			if (contentType && !hasContentTypeHeader) headers.push("content-type", contentType);
			if (contentLength && !hasContentLength) headers.push("content-length", String(contentLength));
			this.#init = void 0;
			this.#headers = void 0;
			this.#response = void 0;
			this.#body = void 0;
			return {
				status,
				statusText,
				headers,
				body
			};
		}
	}
	lazyInherit(NodeResponse$1.prototype, NativeResponse.prototype, "_response");
	Object.setPrototypeOf(NodeResponse$1, NativeResponse);
	Object.setPrototypeOf(NodeResponse$1.prototype, NativeResponse.prototype);
	return NodeResponse$1;
})();
function decodePathname(pathname) {
	return decodeURI(pathname.includes("%25") ? pathname.replace(/%25/g, "%2525") : pathname);
}
var kEventNS = "h3.internal.event.";
var kEventRes = /* @__PURE__ */ Symbol.for(`${kEventNS}res`);
var kEventResHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.headers`);
var kEventResErrHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.err.headers`);
var H3Event = class {
	app;
	req;
	url;
	context;
	static __is_event__ = true;
	constructor(req, context, app) {
		this.context = context || req.context || new NullProtoObj();
		this.req = req;
		this.app = app;
		const _url = req._url;
		const url = _url && _url instanceof URL ? _url : new FastURL(req.url);
		if (url.pathname.includes("%")) url.pathname = decodePathname(url.pathname);
		this.url = url;
	}
	get res() {
		return this[kEventRes] ||= new H3EventResponse();
	}
	get runtime() {
		return this.req.runtime;
	}
	waitUntil(promise) {
		this.req.waitUntil?.(promise);
	}
	toString() {
		return `[${this.req.method}] ${this.req.url}`;
	}
	toJSON() {
		return this.toString();
	}
	get node() {
		return this.req.runtime?.node;
	}
	get headers() {
		return this.req.headers;
	}
	get path() {
		return this.url.pathname + this.url.search;
	}
	get method() {
		return this.req.method;
	}
};
var H3EventResponse = class {
	status;
	statusText;
	get headers() {
		return this[kEventResHeaders] ||= new Headers();
	}
	get errHeaders() {
		return this[kEventResErrHeaders] ||= new Headers();
	}
};
var DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
	return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
	if (!statusCode) return defaultStatusCode;
	if (typeof statusCode === "string") statusCode = +statusCode;
	if (statusCode < 100 || statusCode > 599) return defaultStatusCode;
	return statusCode;
}
var HTTPError = class HTTPError$1 extends Error {
	get name() {
		return "HTTPError";
	}
	status;
	statusText;
	headers;
	cause;
	data;
	body;
	unhandled;
	static isError(input) {
		return input instanceof Error && input?.name === "HTTPError";
	}
	static status(status, statusText, details) {
		return new HTTPError$1({
			...details,
			statusText,
			status
		});
	}
	constructor(arg1, arg2) {
		let messageInput;
		let details;
		if (typeof arg1 === "string") {
			messageInput = arg1;
			details = arg2;
		} else details = arg1;
		const status = sanitizeStatusCode(details?.status || details?.statusCode || (details?.cause)?.status || (details?.cause)?.statusCode, 500);
		const statusText = sanitizeStatusMessage(details?.statusText || details?.statusMessage || (details?.cause)?.statusText || (details?.cause)?.statusMessage);
		const message = messageInput || details?.message || (details?.cause)?.message || details?.statusText || details?.statusMessage || [
			"HTTPError",
			status,
			statusText
		].filter(Boolean).join(" ");
		super(message, { cause: details });
		this.cause = details;
		this.status = status;
		this.statusText = statusText || void 0;
		const rawHeaders = details?.headers || (details?.cause)?.headers;
		this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
		this.unhandled = details?.unhandled ?? (details?.cause)?.unhandled ?? void 0;
		this.data = details?.data;
		this.body = details?.body;
	}
	get statusCode() {
		return this.status;
	}
	get statusMessage() {
		return this.statusText;
	}
	toJSON() {
		const unhandled = this.unhandled;
		return {
			status: this.status,
			statusText: this.statusText,
			unhandled,
			message: unhandled ? "HTTPError" : this.message,
			data: unhandled ? void 0 : this.data,
			...unhandled ? void 0 : this.body
		};
	}
};
function isJSONSerializable(value, _type) {
	if (value === null || value === void 0) return true;
	if (_type !== "object") return _type === "boolean" || _type === "number" || _type === "string";
	if (typeof value.toJSON === "function") return true;
	if (Array.isArray(value)) return true;
	if (typeof value.pipe === "function" || typeof value.pipeTo === "function") return false;
	if (value instanceof NullProtoObj) return true;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
var kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
var kHandled = /* @__PURE__ */ Symbol.for("h3.handled");
function toResponse(val, event, config = {}) {
	if (typeof val?.then === "function") return (val.catch?.((error) => error) || Promise.resolve(val)).then((resolvedVal) => toResponse(resolvedVal, event, config));
	const response = prepareResponse(val, event, config);
	if (typeof response?.then === "function") return toResponse(response, event, config);
	const { onResponse } = config;
	return onResponse ? Promise.resolve(onResponse(response, event)).then(() => response) : response;
}
var HTTPResponse = class {
	#headers;
	#init;
	body;
	constructor(body, init) {
		this.body = body;
		this.#init = init;
	}
	get status() {
		return this.#init?.status || 200;
	}
	get statusText() {
		return this.#init?.statusText || "OK";
	}
	get headers() {
		return this.#headers ||= new Headers(this.#init?.headers);
	}
};
function prepareResponse(val, event, config, nested) {
	if (val === kHandled) return new NodeResponse(null);
	if (val === kNotFound) val = new HTTPError({
		status: 404,
		message: `Cannot find any route matching [${event.req.method}] ${event.url}`
	});
	if (val && val instanceof Error) {
		const isHTTPError = HTTPError.isError(val);
		const error = isHTTPError ? val : new HTTPError(val);
		if (!isHTTPError) {
			error.unhandled = true;
			if (val?.stack) error.stack = val.stack;
		}
		if (error.unhandled && !config.silent) console.error(error);
		const { onError: onError$2 } = config;
		const errHeaders = event[kEventRes]?.[kEventResErrHeaders];
		return onError$2 && !nested ? Promise.resolve(onError$2(error, event)).catch((error$1) => error$1).then((newVal) => prepareResponse(newVal ?? val, event, config, true)) : errorResponse(error, config.debug, errHeaders);
	}
	const preparedRes = event[kEventRes];
	const preparedHeaders = preparedRes?.[kEventResHeaders];
	event[kEventRes] = void 0;
	if (!(val instanceof Response)) {
		const res = prepareResponseBody(val, event, config);
		const status = res.status || preparedRes?.status;
		return new NodeResponse(nullBody(event.req.method, status) ? null : res.body, {
			status,
			statusText: res.statusText || preparedRes?.statusText,
			headers: res.headers && preparedHeaders ? mergeHeaders$1(res.headers, preparedHeaders) : res.headers || preparedHeaders
		});
	}
	if (!preparedHeaders || nested || !val.ok) return val;
	try {
		mergeHeaders$1(val.headers, preparedHeaders, val.headers);
		return val;
	} catch {
		return new NodeResponse(nullBody(event.req.method, val.status) ? null : val.body, {
			status: val.status,
			statusText: val.statusText,
			headers: mergeHeaders$1(val.headers, preparedHeaders)
		});
	}
}
function mergeHeaders$1(base, overrides, target = new Headers(base)) {
	for (const [name, value] of overrides) if (name === "set-cookie") target.append(name, value);
	else target.set(name, value);
	return target;
}
var frozen = (name) => (...args) => {
	throw new Error(`Headers are frozen (${name} ${args.join(", ")})`);
};
var FrozenHeaders = class extends Headers {
	set = frozen("set");
	append = frozen("append");
	delete = frozen("delete");
};
var emptyHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-length": "0" });
var jsonHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-type": "application/json;charset=UTF-8" });
function prepareResponseBody(val, event, config) {
	if (val === null || val === void 0) return {
		body: "",
		headers: emptyHeaders
	};
	const valType = typeof val;
	if (valType === "string") return { body: val };
	if (val instanceof Uint8Array) {
		event.res.headers.set("content-length", val.byteLength.toString());
		return { body: val };
	}
	if (val instanceof HTTPResponse || val?.constructor?.name === "HTTPResponse") return val;
	if (isJSONSerializable(val, valType)) return {
		body: JSON.stringify(val, void 0, config.debug ? 2 : void 0),
		headers: jsonHeaders
	};
	if (valType === "bigint") return {
		body: val.toString(),
		headers: jsonHeaders
	};
	if (val instanceof Blob) {
		const headers = new Headers({
			"content-type": val.type,
			"content-length": val.size.toString()
		});
		let filename = val.name;
		if (filename) {
			filename = encodeURIComponent(filename);
			headers.set("content-disposition", `filename="${filename}"; filename*=UTF-8''${filename}`);
		}
		return {
			body: val.stream(),
			headers
		};
	}
	if (valType === "symbol") return { body: val.toString() };
	if (valType === "function") return { body: `${val.name}()` };
	return { body: val };
}
function nullBody(method, status) {
	return method === "HEAD" || status === 100 || status === 101 || status === 102 || status === 204 || status === 205 || status === 304;
}
function errorResponse(error, debug, errHeaders) {
	let headers = error.headers ? mergeHeaders$1(jsonHeaders, error.headers) : new Headers(jsonHeaders);
	if (errHeaders) headers = mergeHeaders$1(headers, errHeaders);
	return new NodeResponse(JSON.stringify({
		...error.toJSON(),
		stack: debug && error.stack ? error.stack.split("\n").map((l$1) => l$1.trim()) : void 0
	}, void 0, debug ? 2 : void 0), {
		status: error.status,
		statusText: error.statusText,
		headers
	});
}
var GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
var globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_EVENT_STORAGE_KEY]) globalObj$1[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj$1[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
	return typeof value.then === "function";
}
function getSetCookieValues(headers) {
	const headersWithSetCookie = headers;
	if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
	const value = headers.get("set-cookie");
	return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
	if (response.ok) return;
	const eventSetCookies = getSetCookieValues(event.res.headers);
	if (eventSetCookies.length === 0) return;
	const responseSetCookies = getSetCookieValues(response.headers);
	response.headers.delete("set-cookie");
	for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
	for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function attachResponseHeaders(value, event) {
	if (isPromiseLike(value)) return value.then((resolved) => {
		if (resolved instanceof Response) mergeEventResponseHeaders(resolved, event);
		return resolved;
	});
	if (value instanceof Response) mergeEventResponseHeaders(value, event);
	return value;
}
function requestHandler(handler) {
	return (request, requestOpts) => {
		let h3Event;
		try {
			h3Event = new H3Event(request);
		} catch (error) {
			if (error instanceof URIError) return new Response(null, {
				status: 400,
				statusText: "Bad Request"
			});
			throw error;
		}
		return toResponse(attachResponseHeaders(eventStorage.run({ h3Event }, () => handler(request, requestOpts)), h3Event), h3Event);
	};
}
function getH3Event() {
	const event = eventStorage.getStore();
	if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return event.h3Event;
}
function getResponse() {
	return getH3Event().res;
}
var HEADERS = { TSS_SHELL: "X-TSS_SHELL" };
async function getStartManifest(matchedRoutes) {
	const { tsrStartManifest } = await import("./assets/_tanstack-start-manifest_v-_KCP1TJe.js");
	const startManifest = tsrStartManifest();
	let routes = startManifest.routes;
	routes[rootRouteId];
	const manifestRoutes = {};
	for (const k in routes) {
		const v = routes[k];
		const result = {};
		if (v.preloads && v.preloads.length > 0) result.preloads = v.preloads;
		if (v.scripts && v.scripts.length > 0) result.scripts = v.scripts;
		if (v.css?.length) result.css = v.css;
		if (result.preloads || result.scripts || result.css) manifestRoutes[k] = result;
	}
	return {
		...startManifest.scriptFormat ? { scriptFormat: startManifest.scriptFormat } : {},
		...startManifest.inlineCss ? { inlineCss: startManifest.inlineCss } : {},
		routes: manifestRoutes
	};
}
var manifest = {};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
var TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
var TSS_SERVER_FUNCTION = Symbol.for("TSS_SERVER_FUNCTION");
var X_TSS_SERIALIZED = "x-tss-serialized";
var X_TSS_RAW_RESPONSE = "x-tss-raw";
var TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
var FrameType = {
	JSON: 0,
	CHUNK: 1,
	END: 2,
	ERROR: 3
};
var TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=1`;
function isSafeKey(key) {
	return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
function safeObjectMerge(target, source) {
	const result = Object.create(null);
	if (target) {
		for (const key of Object.keys(target)) if (isSafeKey(key)) result[key] = target[key];
	}
	if (source && typeof source === "object") {
		for (const key of Object.keys(source)) if (isSafeKey(key)) result[key] = source[key];
	}
	return result;
}
function createNullProtoObject(source) {
	if (!source) return Object.create(null);
	const obj = Object.create(null);
	for (const key of Object.keys(source)) if (isSafeKey(key)) obj[key] = source[key];
	return obj;
}
var GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
	return startStorage.run(context, fn);
}
function getStartContext(opts) {
	const context = startStorage.getStore();
	if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return context;
}
var getStartOptions = () => getStartContext().startOptions;
function flattenMiddlewares(middlewares, maxDepth = 100) {
	const seen = /* @__PURE__ */ new Set();
	const flattened = [];
	const recurse = (middleware, depth) => {
		if (depth > maxDepth) throw new Error(`Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`);
		middleware.forEach((m) => {
			if (m.options.middleware) recurse(m.options.middleware, depth + 1);
			if (!seen.has(m)) {
				seen.add(m);
				flattened.push(m);
			}
		});
	};
	recurse(middlewares, 0);
	return flattened;
}
var createMiddleware = (options, __opts) => {
	const resolvedOptions = {
		type: "request",
		...__opts || options
	};
	const setValidator = (validator) => {
		return createMiddleware({}, Object.assign(resolvedOptions, {
			validator,
			inputValidator: validator
		}));
	};
	return {
		options: resolvedOptions,
		middleware: (middleware) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { middleware }));
		},
		validator: setValidator,
		inputValidator: setValidator,
		client: (client) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { client }));
		},
		server: (server) => {
			return createMiddleware({}, Object.assign(resolvedOptions, { server }));
		}
	};
};
var innerCreateCsrfMiddleware = (opts = {}) => {
	return createMiddleware().server(async (ctx) => {
		const csrfCtx = ctx;
		if (opts.filter && !await opts.filter(csrfCtx)) return ctx.next();
		if (await isCsrfRequestAllowed(opts, csrfCtx)) return ctx.next();
		return getFailureResponse(opts, csrfCtx);
	});
};
var createCsrfMiddleware = innerCreateCsrfMiddleware;
async function isCsrfRequestAllowed(opts, ctx) {
	const result = await getCsrfRequestValidationResult(opts, ctx);
	return result === true || result === void 0 && opts.allowRequestsWithoutOriginCheck === true;
}
async function getCsrfRequestValidationResult(opts, ctx) {
	const fetchSite = ctx.request.headers.get("Sec-Fetch-Site");
	if (fetchSite !== null) return matchValue(opts.secFetchSite ?? "same-origin", fetchSite, ctx);
	const origin = ctx.request.headers.get("Origin");
	if (origin !== null) {
		if (opts.origin) return matchValue(opts.origin, origin, ctx);
		return origin === new URL(ctx.request.url).origin;
	}
	const referer = ctx.request.headers.get("Referer");
	if (referer === null || opts.referer === false) return;
	if (typeof opts.referer === "function") return opts.referer(referer, ctx);
	if (opts.origin) {
		const refererOrigin = getOriginFromUrl(referer);
		return refererOrigin !== void 0 && matchValue(opts.origin, refererOrigin, ctx);
	}
	return isRefererSameOrigin(referer, new URL(ctx.request.url).origin);
}
async function matchValue(matcher, value, ctx) {
	if (typeof matcher === "function") return matcher(value, ctx);
	if (Array.isArray(matcher)) return matcher.includes(value);
	return value === matcher;
}
function getOriginFromUrl(url) {
	try {
		return new URL(url).origin;
	} catch {
		return;
	}
}
function isRefererSameOrigin(referer, requestOrigin) {
	if (referer === requestOrigin) return true;
	if (!referer.startsWith(requestOrigin)) return false;
	if (referer.length === requestOrigin.length) return true;
	const code = referer.charCodeAt(requestOrigin.length);
	return code === 47 || code === 63 || code === 35;
}
async function getFailureResponse(opts, ctx) {
	if (typeof opts.failureResponse === "function") return opts.failureResponse(ctx);
	return opts.failureResponse?.clone() ?? new Response("Forbidden", { status: 403 });
}
function getDefaultSerovalPlugins() {
	return [...(getStartOptions()?.serializationAdapters)?.map(makeSerovalPlugin) ?? [], ...defaultSerovalPlugins];
}
var textEncoder = new TextEncoder();
var EMPTY_PAYLOAD = new Uint8Array(0);
function encodeFrame(type, streamId, payload) {
	const frame = new Uint8Array(9 + payload.length);
	frame[0] = type;
	frame[1] = streamId >>> 24 & 255;
	frame[2] = streamId >>> 16 & 255;
	frame[3] = streamId >>> 8 & 255;
	frame[4] = streamId & 255;
	frame[5] = payload.length >>> 24 & 255;
	frame[6] = payload.length >>> 16 & 255;
	frame[7] = payload.length >>> 8 & 255;
	frame[8] = payload.length & 255;
	frame.set(payload, 9);
	return frame;
}
function encodeJSONFrame(json) {
	return encodeFrame(FrameType.JSON, 0, textEncoder.encode(json));
}
function encodeChunkFrame(streamId, chunk) {
	return encodeFrame(FrameType.CHUNK, streamId, chunk);
}
function encodeEndFrame(streamId) {
	return encodeFrame(FrameType.END, streamId, EMPTY_PAYLOAD);
}
function encodeErrorFrame(streamId, error) {
	const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
	return encodeFrame(FrameType.ERROR, streamId, textEncoder.encode(message));
}
function createMultiplexedStream(jsonStream, rawStreams, lateStreamSource) {
	let controller;
	let cancelled = false;
	const readers = [];
	const enqueue = (frame) => {
		if (cancelled) return false;
		try {
			controller.enqueue(frame);
			return true;
		} catch {
			return false;
		}
	};
	const errorOutput = (error) => {
		if (cancelled) return;
		cancelled = true;
		try {
			controller.error(error);
		} catch {}
		for (const reader of readers) reader.cancel().catch(() => {});
	};
	async function pumpRawStream(streamId, stream$1) {
		const reader = stream$1.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) {
					enqueue(encodeEndFrame(streamId));
					return;
				}
				if (!enqueue(encodeChunkFrame(streamId, value))) return;
			}
		} catch (error) {
			enqueue(encodeErrorFrame(streamId, error));
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpJSON() {
		const reader = jsonStream.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) return;
				if (!enqueue(encodeJSONFrame(value))) return;
			}
		} catch (error) {
			errorOutput(error);
			throw error;
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpLateStreams() {
		if (!lateStreamSource) return [];
		const lateStreamPumps = [];
		const reader = lateStreamSource.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) break;
				lateStreamPumps.push(pumpRawStream(value.id, value.stream));
			}
		} finally {
			reader.releaseLock();
		}
		return lateStreamPumps;
	}
	return new ReadableStream({
		async start(ctrl) {
			controller = ctrl;
			const pumps = [pumpJSON()];
			for (const [streamId, stream$1] of rawStreams) pumps.push(pumpRawStream(streamId, stream$1));
			if (lateStreamSource) pumps.push(pumpLateStreams());
			try {
				const latePumps = (await Promise.all(pumps)).find(Array.isArray);
				if (latePumps && latePumps.length > 0) await Promise.all(latePumps);
				if (!cancelled) try {
					controller.close();
				} catch {}
			} catch {}
		},
		cancel() {
			cancelled = true;
			for (const reader of readers) reader.cancel().catch(() => {});
			readers.length = 0;
		}
	});
}
var serovalPlugins = void 0;
var FORM_DATA_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
var MAX_PAYLOAD_SIZE = 1e6;
var handleServerAction = async ({ request, context, serverFnId }) => {
	const methodUpper = request.method.toUpperCase();
	const url = new URL(request.url);
	const action = await getServerFnById(serverFnId, { origin: "client" });
	if (action.method && methodUpper !== action.method) return new Response(`expected ${action.method} method. Got ${methodUpper}`, {
		status: 405,
		headers: { Allow: action.method }
	});
	const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
	if (!serovalPlugins) serovalPlugins = getDefaultSerovalPlugins();
	const contentType = request.headers.get("Content-Type");
	function parsePayload(payload) {
		return fromJSON(payload, { plugins: serovalPlugins });
	}
	return await (async () => {
		try {
			let res = await (async () => {
				if (FORM_DATA_CONTENT_TYPES.some((type) => contentType && contentType.includes(type))) {
					if (methodUpper === "GET") invariant();
					const formData = await request.formData();
					const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
					formData.delete(TSS_FORMDATA_CONTEXT);
					const params = {
						context,
						data: formData,
						method: methodUpper
					};
					if (typeof serializedContext === "string") try {
						const deserializedContext = fromJSON(JSON.parse(serializedContext), { plugins: serovalPlugins });
						if (typeof deserializedContext === "object" && deserializedContext) params.context = safeObjectMerge(deserializedContext, context);
					} catch (e) {}
					return await action(params);
				}
				if (methodUpper === "GET") {
					const payloadParam = url.searchParams.get("payload");
					if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) throw new Error("Payload too large");
					const payload$1 = payloadParam ? parsePayload(JSON.parse(payloadParam)) : {};
					payload$1.context = safeObjectMerge(payload$1.context, context);
					payload$1.method = methodUpper;
					return await action(payload$1);
				}
				let jsonPayload;
				if (contentType?.includes("application/json")) jsonPayload = await request.json();
				const payload = jsonPayload ? parsePayload(jsonPayload) : {};
				payload.context = safeObjectMerge(payload.context, context);
				payload.method = methodUpper;
				return await action(payload);
			})();
			const unwrapped = res.result || res.error;
			if (isNotFound(res)) res = isNotFoundResponse(res);
			if (!isServerFn) return unwrapped;
			if (unwrapped instanceof Response) {
				if (isRedirect(unwrapped)) return unwrapped;
				unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
				return unwrapped;
			}
			return serializeResult(res);
			function serializeResult(res$1) {
				let nonStreamingBody = void 0;
				const alsResponse = getResponse();
				if (res$1 !== void 0) {
					const rawStreams = /* @__PURE__ */ new Map();
					let initialPhase = true;
					let lateStreamWriter;
					let lateStreamReadable = void 0;
					const pendingLateStreams = [];
					const plugins = [/* @__PURE__ */ createRawStreamRPCPlugin((id, stream$1) => {
						if (initialPhase) {
							rawStreams.set(id, stream$1);
							return;
						}
						if (lateStreamWriter) {
							lateStreamWriter.write({
								id,
								stream: stream$1
							}).catch(() => {});
							return;
						}
						pendingLateStreams.push({
							id,
							stream: stream$1
						});
					}), ...serovalPlugins || []];
					let done = false;
					const callbacks = {
						onParse: (value) => {
							nonStreamingBody = value;
						},
						onDone: () => {
							done = true;
						},
						onError: (error) => {
							throw error;
						}
					};
					toCrossJSONStream(res$1, {
						refs: /* @__PURE__ */ new Map(),
						plugins,
						onParse(value) {
							callbacks.onParse(value);
						},
						onDone() {
							callbacks.onDone();
						},
						onError: (error) => {
							callbacks.onError(error);
						}
					});
					initialPhase = false;
					if (done && rawStreams.size === 0) return new Response(nonStreamingBody ? JSON.stringify(nonStreamingBody) : void 0, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": "application/json",
							[X_TSS_SERIALIZED]: "true"
						}
					});
					const { readable, writable } = new TransformStream();
					lateStreamReadable = readable;
					lateStreamWriter = writable.getWriter();
					for (const registration of pendingLateStreams) lateStreamWriter.write(registration).catch(() => {});
					pendingLateStreams.length = 0;
					const multiplexedStream = createMultiplexedStream(new ReadableStream({
						start(controller) {
							callbacks.onParse = (value) => {
								controller.enqueue(JSON.stringify(value) + "\n");
							};
							callbacks.onDone = () => {
								try {
									controller.close();
								} catch {}
								lateStreamWriter?.close().catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							callbacks.onError = (error) => {
								controller.error(error);
								lateStreamWriter?.abort(error).catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							if (nonStreamingBody !== void 0) callbacks.onParse(nonStreamingBody);
							if (done) callbacks.onDone();
						},
						cancel() {
							lateStreamWriter?.abort().catch(() => {});
							lateStreamWriter = void 0;
						}
					}), rawStreams, lateStreamReadable);
					return new Response(multiplexedStream, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
							[X_TSS_SERIALIZED]: "true"
						}
					});
				}
				return new Response(void 0, {
					status: alsResponse.status,
					statusText: alsResponse.statusText
				});
			}
		} catch (error) {
			if (error instanceof Response) return error;
			if (isNotFound(error)) return isNotFoundResponse(error);
			console.info();
			console.info("Server Fn Error!");
			console.info();
			console.error(error);
			console.info();
			const serializedError = JSON.stringify(await Promise.resolve(toCrossJSONAsync(error, {
				refs: /* @__PURE__ */ new Map(),
				plugins: serovalPlugins
			})));
			const response = getResponse();
			return new Response(serializedError, {
				status: response.status ?? 500,
				statusText: response.statusText,
				headers: {
					"Content-Type": "application/json",
					[X_TSS_SERIALIZED]: "true"
				}
			});
		}
	})();
};
function isNotFoundResponse(error) {
	const { headers, ...rest } = error;
	return new Response(JSON.stringify(rest), {
		status: 404,
		headers: {
			"Content-Type": "application/json",
			...headers || {}
		}
	});
}
var LINK_PARAM_TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PRELOAD_AS_VALUES = new Set([
	"fetch",
	"font",
	"image",
	"script",
	"style",
	"track"
]);
function buildLinkParam(name, value) {
	if (value === void 0) return name;
	if (LINK_PARAM_TOKEN_RE.test(value)) return `${name}=${value}`;
	return `${name}=${JSON.stringify(value)}`;
}
function serializeEarlyHint(hint) {
	const parts = [`<${hint.href}>`, buildLinkParam("rel", hint.rel)];
	if (hint.as) parts.push(buildLinkParam("as", hint.as));
	if (hint.crossOrigin !== void 0) parts.push(buildLinkParam("crossorigin", hint.crossOrigin || void 0));
	if (hint.type) parts.push(buildLinkParam("type", hint.type));
	if (hint.integrity) parts.push(buildLinkParam("integrity", hint.integrity));
	if (hint.referrerPolicy) parts.push(buildLinkParam("referrerpolicy", hint.referrerPolicy));
	if (hint.fetchPriority) parts.push(buildLinkParam("fetchpriority", hint.fetchPriority));
	return parts.join("; ");
}
function getStringAttr(attrs, name, fallbackName) {
	const value = attrs?.[name] ?? (fallbackName ? attrs?.[fallbackName] : void 0);
	return typeof value === "string" ? value : void 0;
}
function getPreloadAs(attrs) {
	const as = getStringAttr(attrs, "as");
	return as && PRELOAD_AS_VALUES.has(as) ? as : void 0;
}
function addEarlyHintFetchAttrs(hint, attrs) {
	const crossOrigin = getStringAttr(attrs, "crossOrigin", "crossorigin");
	const type = getStringAttr(attrs, "type");
	const integrity = getStringAttr(attrs, "integrity");
	const referrerPolicy = getStringAttr(attrs, "referrerPolicy", "referrerpolicy");
	const fetchPriority = getStringAttr(attrs, "fetchPriority", "fetchpriority");
	if (crossOrigin !== void 0) hint.crossOrigin = crossOrigin;
	if (type) hint.type = type;
	if (integrity) hint.integrity = integrity;
	if (referrerPolicy) hint.referrerPolicy = referrerPolicy;
	if (fetchPriority) hint.fetchPriority = fetchPriority;
}
function linkAttrsToEarlyHint(attrs) {
	const href = getStringAttr(attrs, "href");
	const rel = getStringAttr(attrs, "rel");
	if (!href || !rel) return void 0;
	const relTokens = rel.split(/\s+/);
	let hintRel;
	let hintAs;
	if (relTokens.includes("modulepreload")) {
		hintRel = "modulepreload";
		hintAs = "script";
	} else if (relTokens.includes("stylesheet")) {
		hintRel = "preload";
		hintAs = "style";
	} else if (relTokens.includes("preload")) {
		hintAs = getPreloadAs(attrs);
		if (!hintAs) return void 0;
		hintRel = "preload";
	} else if (relTokens.includes("preconnect")) {
		hintRel = "preconnect";
		hintAs = void 0;
	} else if (relTokens.includes("dns-prefetch")) {
		hintRel = "dns-prefetch";
		hintAs = void 0;
	}
	if (!hintRel) return void 0;
	const hint = {
		href,
		rel: hintRel
	};
	if (hintAs) hint.as = hintAs;
	addEarlyHintFetchAttrs(hint, attrs);
	return hint;
}
function collectStaticHintsFromManifest(manifest$1, matchedRoutes) {
	const hints = [];
	for (const route of matchedRoutes) {
		const routeManifest = manifest$1.routes[route.id];
		if (!routeManifest) continue;
		for (const link of routeManifest.preloads ?? []) {
			const attrs = getScriptPreloadAttrs(manifest$1, link);
			const hint = {
				href: attrs.href,
				rel: attrs.rel,
				as: "script"
			};
			if (attrs.crossOrigin !== void 0) hint.crossOrigin = attrs.crossOrigin;
			hints.push(hint);
		}
		for (const link of routeManifest.css ?? []) {
			const stylesheetHref = getStylesheetHref(link);
			if (manifest$1.inlineCss?.styles[stylesheetHref] !== void 0) continue;
			const resolvedLink = resolveManifestCssLink(link);
			const hint = {
				href: stylesheetHref,
				rel: "preload",
				as: "style"
			};
			if (resolvedLink.crossOrigin !== void 0) hint.crossOrigin = resolvedLink.crossOrigin;
			hints.push(hint);
		}
	}
	return hints;
}
function collectDynamicHintsFromMatches(matches) {
	const hints = [];
	for (const match of matches) {
		const links = match.links;
		if (!Array.isArray(links)) continue;
		for (const link of links) {
			const hint = linkAttrsToEarlyHint(link);
			if (hint) hints.push(hint);
		}
	}
	return hints;
}
function createEarlyHintsEvent(opts) {
	const nextHints = [];
	const nextLinks = [];
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.sentHints.push(hint);
		nextHints.push(hint);
		nextLinks.push(link);
	}
	if (!nextHints.length && opts.phase !== "dynamic") return void 0;
	return {
		phase: opts.phase,
		hints: nextHints,
		links: nextLinks,
		allHints: opts.sentHints.slice(),
		allLinks: Array.from(opts.sentLinks)
	};
}
function createResponseLinkHeaderEntries(opts) {
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.entries.push({
			phase: opts.phase,
			hint,
			link
		});
	}
}
function getResponseLinkHeaderEntries(opts) {
	if (!opts.filter) return opts.entries.map((entry) => entry.link);
	try {
		const links = [];
		for (const entry of opts.entries) if (opts.filter(entry)) links.push(entry.link);
		return links;
	} catch (err) {
		console.error("Error filtering response Link headers:", err);
		return [];
	}
}
function notifyEarlyHints(phase, event, onEarlyHints) {
	try {
		const result = onEarlyHints(event);
		if (result) Promise.resolve(result).catch((err) => {
			console.error(`Error sending ${phase} early hints:`, err);
		});
	} catch (err) {
		console.error(`Error sending ${phase} early hints:`, err);
	}
}
function getResponseLinkHeaderFilter(responseLinkHeader) {
	if (typeof responseLinkHeader !== "object") return;
	return responseLinkHeader.filter;
}
function appendResponseLinkHeaders(opts) {
	for (const link of getResponseLinkHeaderEntries(opts)) opts.responseHeaders.append("Link", link);
}
function collectResponseLinkHeaderEntries(opts) {
	for (let index = 0; index < opts.event.hints.length; index++) opts.entries.push({
		phase: opts.phase,
		hint: opts.event.hints[index],
		link: opts.event.links[index]
	});
}
function collectEarlyHintsPhase(opts) {
	const event = opts.onEarlyHints ? createEarlyHintsEvent({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		sentHints: opts.sentHints
	}) : void 0;
	if (event) notifyEarlyHints(opts.phase, event, opts.onEarlyHints);
	if (!opts.responseLinkHeaderEntries) return;
	if (event) {
		collectResponseLinkHeaderEntries({
			phase: opts.phase,
			event,
			entries: opts.responseLinkHeaderEntries
		});
		return;
	}
	createResponseLinkHeaderEntries({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		entries: opts.responseLinkHeaderEntries
	});
}
function createEarlyHintsCollector(opts) {
	if (!opts?.onEarlyHints && !opts?.responseLinkHeader) return;
	const sentLinks = /* @__PURE__ */ new Set();
	const sentHints = opts.onEarlyHints ? new Array() : void 0;
	const responseLinkHeaderEntries = opts.responseLinkHeader ? new Array() : void 0;
	const responseLinkHeaderFilter = getResponseLinkHeaderFilter(opts.responseLinkHeader);
	return {
		collectStatic: ({ manifest: manifest$1, matchedRoutes }) => {
			if (!matchedRoutes?.length) return;
			collectEarlyHintsPhase({
				phase: "static",
				hints: collectStaticHintsFromManifest(manifest$1, matchedRoutes),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		collectDynamic: (matches) => {
			collectEarlyHintsPhase({
				phase: "dynamic",
				hints: collectDynamicHintsFromMatches(matches),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		appendResponseHeaders: (headers) => {
			if (!responseLinkHeaderEntries?.length) return;
			appendResponseLinkHeaders({
				responseHeaders: headers,
				entries: responseLinkHeaderEntries,
				filter: responseLinkHeaderFilter
			});
		}
	};
}
function normalizeTransformAssetResult(result) {
	if (typeof result === "string") return { href: result };
	return result;
}
function escapeCssString(value) {
	return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\a ").replace(/\r/g, "\\d ").replace(/\f/g, "\\c ");
}
async function transformInlineCssTemplate(options) {
	const { strings, urls } = options.template;
	if (strings.length !== urls.length + 1) throw new Error(`TanStack Start inlineCss template for ${options.stylesheetHref} is invalid`);
	let css = strings[0];
	for (let index = 0; index < urls.length; index++) {
		const transformed = normalizeTransformAssetResult(await options.transformFn({
			kind: "css-url",
			url: urls[index],
			stylesheetHref: options.stylesheetHref
		}));
		css += escapeCssString(transformed.href) + strings[index + 1];
	}
	return css;
}
async function transformInlineCssStyles(inlineCss, transformFn) {
	const transformedStyles = {};
	const transformedEntries = await Promise.all(Object.entries(inlineCss.styles).map(async ([stylesheetHref, css]) => {
		const template = inlineCss.templates?.[stylesheetHref];
		return [stylesheetHref, template ? await transformInlineCssTemplate({
			stylesheetHref,
			template,
			transformFn
		}) : css];
	}));
	for (const [stylesheetHref, css] of transformedEntries) transformedStyles[stylesheetHref] = css;
	return {
		styles: transformedStyles,
		...inlineCss.templates ? { templates: inlineCss.templates } : {}
	};
}
function resolveTransformAssetsCrossOrigin(config, kind) {
	if (!config) return void 0;
	if (typeof config === "string") return config;
	return config[kind];
}
function isObjectShorthand(transform) {
	return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
	if (typeof transform === "string") {
		const prefix$2 = transform;
		return {
			type: "transform",
			transformFn: ({ url }) => ({ href: `${prefix$2}${url}` }),
			cache: true
		};
	}
	if (typeof transform === "function") return {
		type: "transform",
		transformFn: transform,
		cache: true
	};
	if (isObjectShorthand(transform)) {
		const { prefix: prefix$2, crossOrigin } = transform;
		return {
			type: "transform",
			transformFn: ({ url, kind }) => {
				const href = `${prefix$2}${url}`;
				if (kind === "css-url") return { href };
				const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
				return co ? {
					href,
					crossOrigin: co
				} : { href };
			},
			cache: true
		};
	}
	if ("createTransform" in transform && transform.createTransform) return {
		type: "createTransform",
		createTransform: transform.createTransform,
		cache: transform.cache !== false
	};
	return {
		type: "transform",
		transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
		cache: transform.cache !== false
	};
}
function assignManifestLink(link, next) {
	if (typeof link === "string") return next.crossOrigin ? next : next.href;
	const nextLink = {
		...link,
		href: next.href
	};
	if (next.crossOrigin) nextLink.crossOrigin = next.crossOrigin;
	else delete nextLink.crossOrigin;
	return nextLink;
}
async function transformManifestAssets(source, transformFn, _opts) {
	const manifest$1 = structuredClone(source);
	const inlineCssEnabled = _opts?.inlineCss !== false;
	const scriptTransforms = /* @__PURE__ */ new Map();
	const transformScript = (url) => {
		const cached = scriptTransforms.get(url);
		if (cached) return cached;
		const transformed = Promise.resolve(transformFn({
			url,
			kind: "script"
		})).then(normalizeTransformAssetResult);
		scriptTransforms.set(url, transformed);
		return transformed;
	};
	if (!inlineCssEnabled) delete manifest$1.inlineCss;
	else if (manifest$1.inlineCss) manifest$1.inlineCss = await transformInlineCssStyles(manifest$1.inlineCss, transformFn);
	for (const route of Object.values(manifest$1.routes)) {
		if (route.preloads?.length) route.preloads = await Promise.all(route.preloads.map(async (link) => {
			const result = await transformScript(resolveManifestAssetLink(link).href);
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.css?.length && !manifest$1.inlineCss) route.css = await Promise.all(route.css.map(async (link) => {
			const result = normalizeTransformAssetResult(await transformFn({
				url: resolveManifestCssLink(link).href,
				kind: "stylesheet"
			}));
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.scripts?.length) for (const script of route.scripts) {
			const src = script.attrs?.src;
			if (typeof src !== "string") continue;
			const result = await transformScript(src);
			script.attrs = {
				...script.attrs,
				src: result.href
			};
			if (result.crossOrigin) script.attrs.crossOrigin = result.crossOrigin;
			else delete script.attrs.crossOrigin;
		}
	}
	return manifest$1;
}
function buildManifest(source, opts) {
	return {
		...source.scriptFormat ? { scriptFormat: source.scriptFormat } : {},
		...opts?.inlineCss !== false && source.inlineCss ? { inlineCss: structuredClone(source.inlineCss) } : {},
		routes: { ...source.routes }
	};
}
function getStaticHandlerInlineCssDefault(handlerInlineCss) {
	if (typeof handlerInlineCss === "function") return;
	return handlerInlineCss ?? true;
}
async function resolveInlineCssForRequest(opts) {
	if (opts.requestInlineCss !== void 0) return opts.requestInlineCss;
	if (typeof opts.handlerInlineCss === "function") return await opts.handlerInlineCss({ request: opts.request });
	return opts.handlerInlineCss ?? true;
}
function createCachedBaseManifestLoader(loadBaseManifest) {
	let baseManifestPromise;
	return () => {
		if (!baseManifestPromise) baseManifestPromise = loadBaseManifest().catch((error) => {
			baseManifestPromise = void 0;
			throw error;
		});
		return baseManifestPromise;
	};
}
function createFinalManifestTransformResolver(transformAssets, opts) {
	const transformConfig = transformAssets !== void 0 ? resolveTransformAssetsConfig(transformAssets) : void 0;
	const cache = transformConfig ? transformConfig.cache : true;
	const warmup = !!transformAssets && typeof transformAssets === "object" && "warmup" in transformAssets && transformAssets.warmup === true;
	let cachedCreateTransformPromise;
	const clearCachedCreateTransform = () => {
		cachedCreateTransformPromise = void 0;
	};
	return {
		cache,
		warmup,
		clearCachedCreateTransform,
		getTransformFn: async (ctx) => {
			if (!transformConfig) return void 0;
			if (transformConfig.type !== "createTransform") return transformConfig.transformFn;
			if (!cache || !opts.cacheCreateTransform) return transformConfig.createTransform(ctx);
			if (!cachedCreateTransformPromise) cachedCreateTransformPromise = Promise.resolve(transformConfig.createTransform(ctx)).catch((error) => {
				clearCachedCreateTransform();
				throw error;
			});
			return cachedCreateTransformPromise;
		}
	};
}
function createFinalManifestResolver(opts) {
	const finalManifestCache = /* @__PURE__ */ new Map();
	const transformResolver = createFinalManifestTransformResolver(opts.transformAssets, { cacheCreateTransform: opts.cacheCreateTransform });
	const handlerDefaultInlineCss = getStaticHandlerInlineCssDefault(opts.inlineCss);
	const getRequestManifestOptions = async (requestOpts) => {
		const transformFn = await transformResolver.getTransformFn({
			warmup: false,
			request: requestOpts.request
		});
		const inlineCss = await resolveInlineCssForRequest({
			request: requestOpts.request,
			handlerInlineCss: opts.inlineCss,
			requestInlineCss: requestOpts.requestInlineCss
		});
		return {
			getBaseManifest: requestOpts.getBaseManifest,
			transformFn,
			cache: transformResolver.cache,
			inlineCss
		};
	};
	const resolveRequest$1 = async (requestOpts, cache) => {
		return resolveFinalManifest({
			...await getRequestManifestOptions(requestOpts),
			finalManifestCache: cache
		});
	};
	return {
		warmup: ({ getBaseManifest: getBaseManifest$1 }) => warmupFinalManifest({
			enabled: transformResolver.warmup,
			handlerDefaultInlineCss,
			cache: transformResolver.cache,
			finalManifestCache,
			getBaseManifest: getBaseManifest$1,
			getTransformFn: () => transformResolver.getTransformFn({ warmup: true }),
			onError: transformResolver.clearCachedCreateTransform
		}),
		resolveCached: (requestOpts) => resolveRequest$1(requestOpts, finalManifestCache),
		resolveUncached: (requestOpts) => resolveRequest$1(requestOpts, void 0)
	};
}
function getFinalManifestCacheKey(inlineCss) {
	return inlineCss ? "inline-css" : "linked-css";
}
function cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, promise) {
	const cachedFinalManifestPromise = promise.catch((error) => {
		if (cachedFinalManifestPromises.get(cacheKey) === cachedFinalManifestPromise) cachedFinalManifestPromises.delete(cacheKey);
		throw error;
	});
	cachedFinalManifestPromises.set(cacheKey, cachedFinalManifestPromise);
	return cachedFinalManifestPromise;
}
function getOrCreateCachedFinalManifestPromise(cachedFinalManifestPromises, cacheKey, computeFinalManifest) {
	const cachedFinalManifestPromise = cachedFinalManifestPromises.get(cacheKey);
	if (cachedFinalManifestPromise) return cachedFinalManifestPromise;
	return cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, Promise.resolve().then(computeFinalManifest));
}
async function buildFinalManifest(opts) {
	return opts.transformFn ? await transformManifestAssets(opts.base, opts.transformFn, { inlineCss: opts.inlineCss }) : buildManifest(opts.base, { inlineCss: opts.inlineCss });
}
async function resolveFinalManifest(opts) {
	const computeFinalManifest = async () => {
		return buildFinalManifest({
			base: await opts.getBaseManifest(),
			transformFn: opts.transformFn,
			inlineCss: opts.inlineCss
		});
	};
	if (opts.finalManifestCache && (!opts.transformFn || opts.cache)) return getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(opts.inlineCss), computeFinalManifest);
	return computeFinalManifest();
}
function warmupFinalManifest(opts) {
	if (!opts.enabled || opts.handlerDefaultInlineCss === void 0 || !opts.cache) return;
	const inlineCss = opts.handlerDefaultInlineCss;
	const warmupPromise = getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(inlineCss), async () => {
		const [base, transformFn] = await Promise.all([opts.getBaseManifest(), opts.getTransformFn()]);
		return buildFinalManifest({
			base,
			transformFn,
			inlineCss
		});
	});
	if (opts.onError) warmupPromise.catch(opts.onError);
	return warmupPromise;
}
var ServerFunctionSerializationAdapter = createSerializationAdapter({
	key: "$TSS/serverfn",
	test: (v) => {
		if (typeof v !== "function") return false;
		if (!(TSS_SERVER_FUNCTION in v)) return false;
		return !!v[TSS_SERVER_FUNCTION];
	},
	toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
	fromSerializable: ({ functionId }) => {
		const fn = async (opts, signal) => {
			return (await (await getServerFnById(functionId, { origin: "client" }))(opts ?? {}, signal)).result;
		};
		return fn;
	}
});
function getStartResponseHeaders(opts) {
	return mergeHeaders({ "Content-Type": "text/html; charset=utf-8" }, ..._getRenderedMatches(opts.router.stores.matches.get()).map((match) => {
		return match.headers;
	}));
}
var entriesPromise;
var defaultCsrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
var getCachedBaseManifest = createCachedBaseManifestLoader(() => getStartManifest());
var getProdBaseManifest = () => getCachedBaseManifest();
var getBaseManifest = getProdBaseManifest;
var createEarlyHintsForRequest = createEarlyHintsCollector;
async function loadEntries() {
	const [routerEntry, startEntry, pluginAdapters] = await Promise.all([
		import("./assets/router-viHoTCx5.js"),
		import("./assets/start-DrkP5wg-.js"),
		import("./assets/empty-plugin-adapters-CoiSQxsC.js")
	]);
	return {
		routerEntry,
		startEntry,
		pluginAdapters
	};
}
function getEntries() {
	if (!entriesPromise) entriesPromise = loadEntries();
	return entriesPromise;
}
var ROUTER_BASEPATH = "/";
var SERVER_FN_BASE = "/_serverFn/";
var IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
var IS_SHELL_ENV = process.env.TSS_SHELL === "true";
var IS_DEV = false;
var ERR_NO_RESPONSE = IS_DEV ? `It looks like you forgot to return a response from your server route handler. If you want to defer to the app router, make sure to have a component set in this route.` : "Internal Server Error";
var ERR_NO_DEFER = IS_DEV ? `You cannot defer to the app router if there is no component defined on this route.` : "Internal Server Error";
function throwRouteHandlerError() {
	throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
	throw new Error(ERR_NO_DEFER);
}
function isSpecialResponse(value) {
	return value instanceof Response || isRedirect(value);
}
function handleCtxResult(result) {
	if (isSsrResponse(result) || isSpecialResponse(result)) return { response: result };
	return result;
}
function disposeLateResponse(result, signal) {
	const response = handleCtxResult(result)?.response;
	if (isSsrResponse(response) || isSpecialResponse(response)) disposeSsrResponseDetached(response, signal.reason);
}
function isSignalAborted(signal) {
	return signal.aborted;
}
async function executeMiddleware(middlewares, ctx, signal) {
	let index = -1;
	let streamResponse;
	let retiredStreamIdentities;
	const isResponseAlias = (candidate, response) => candidate === response || candidate instanceof Response && response.body !== null && candidate.body === response.body;
	const setResponse = (response) => {
		if (isSsrResponse(response)) {
			if (response.serverSsrCleanup === "stream") streamResponse = response;
			ctx.response = response.response;
			return;
		}
		ctx.response = response;
	};
	const disposeStreamResponse = async (reason) => {
		const response = streamResponse;
		if (!response) return;
		streamResponse = void 0;
		retiredStreamIdentities ??= /* @__PURE__ */ new WeakSet();
		retiredStreamIdentities.add(response.response);
		if (response.response.body) retiredStreamIdentities.add(response.response.body);
		const currentResponse = ctx.response;
		if (isResponseAlias(currentResponse, response.response)) ctx.response = void 0;
		await response.dispose(reason);
	};
	const disposeAbandonedResult = (result) => {
		const exposed = handleCtxResult(result)?.response;
		const response = isSsrResponse(exposed) ? exposed.response : exposed;
		if (streamResponse && isResponseAlias(response, streamResponse.response)) {
			disposeStreamResponse(signal.reason).catch(console.error);
			return;
		}
		if (response instanceof Response && retiredStreamIdentities && (retiredStreamIdentities.has(response) || response.body !== null && retiredStreamIdentities.has(response.body))) return;
		disposeLateResponse(result, signal);
	};
	const getFinalResponse = async () => {
		const response = ctx.response;
		if (!response) throwRouteHandlerError();
		if (!streamResponse) return response;
		if (response === streamResponse.response) return streamResponse;
		if (streamResponse.response.body !== null && response.body === streamResponse.response.body) return {
			...streamResponse,
			response
		};
		await disposeStreamResponse("middleware response replaced");
		return response;
	};
	let nextPromise;
	function next(nextCtx) {
		const result = runNext(nextCtx);
		nextPromise = result;
		return result;
	}
	async function runNext(nextCtx) {
		if (signal.aborted) throw signal.reason;
		if (nextCtx) {
			if (nextCtx.context) ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
			for (const key of Object.keys(nextCtx)) if (key === "response") setResponse(nextCtx.response);
			else if (key !== "context") ctx[key] = nextCtx[key];
		}
		index++;
		const middleware = middlewares[index];
		if (!middleware) return ctx;
		let result;
		try {
			const pending = middleware({
				...ctx,
				next
			});
			if (pending === nextPromise) {
				nextPromise = void 0;
				result = await pending;
				if (isSignalAborted(signal)) {
					disposeAbandonedResult(result);
					throw signal.reason;
				}
			} else result = await waitForRequest(pending, signal, disposeAbandonedResult);
		} catch (err) {
			if (isSignalAborted(signal)) throw signal.reason;
			if (isSpecialResponse(err)) {
				setResponse(err);
				return ctx;
			}
			throw err;
		}
		const normalized = handleCtxResult(result);
		if (normalized) {
			if (normalized.response !== void 0) setResponse(normalized.response);
			if (normalized.context) ctx.context = safeObjectMerge(ctx.context, normalized.context);
		}
		return ctx;
	}
	try {
		await runNext();
		const response = await waitForRequest(getFinalResponse(), signal, disposeAbandonedResult);
		if (signal.aborted) {
			disposeAbandonedResult(response);
			throw signal.reason;
		}
		return {
			ctx,
			response
		};
	} catch (err) {
		const disposal = disposeStreamResponse(signal.aborted ? signal.reason : err);
		if (signal.aborted) disposal.catch(console.error);
		else await disposal;
		throw err;
	}
}
function handlerToMiddleware(handler, mayDefer = false) {
	if (mayDefer) return handler;
	return async (ctx) => {
		const response = await handler({
			...ctx,
			next: throwIfMayNotDefer
		});
		if (!response) throwRouteHandlerError();
		return response;
	};
}
function createStartHandler(cbOrOptions) {
	const handlerOptions = typeof cbOrOptions === "function" ? {} : cbOrOptions;
	const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
	const finalManifestResolver = createFinalManifestResolver({
		...handlerOptions,
		cacheCreateTransform: true
	});
	const resolveManifestForRequest = finalManifestResolver.resolveCached;
	finalManifestResolver.warmup({ getBaseManifest: () => getBaseManifest(void 0) });
	const startRequestResolver = async (request, requestOpts) => {
		let router = null;
		let responseOwnsCleanup = false;
		try {
			request.signal.throwIfAborted();
			const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
			const href = url.pathname + url.search + url.hash;
			const origin = getOrigin(request);
			if (handledProtocolRelativeURL) return Response.redirect(url, 308);
			const entries = await waitForRequest(getEntries(), request.signal);
			const hasStartInstance = !!entries.startEntry.startInstance;
			const startOptions = await waitForRequest(entries.startEntry.startInstance?.getOptions(), request.signal) || {};
			const { hasPluginAdapters, pluginSerializationAdapters } = entries.pluginAdapters;
			const serializationAdapters = [
				...startOptions.serializationAdapters || [],
				...hasPluginAdapters ? pluginSerializationAdapters : [],
				ServerFunctionSerializationAdapter
			];
			const requestStartOptions = {
				...startOptions,
				requestMiddleware: hasStartInstance ? startOptions.requestMiddleware : [defaultCsrfMiddleware],
				serializationAdapters
			};
			const flattenedRequestMiddlewares = requestStartOptions.requestMiddleware ? flattenMiddlewares(requestStartOptions.requestMiddleware) : [];
			const executedRequestMiddlewares = new Set(flattenedRequestMiddlewares);
			const getRouter = async () => {
				if (router) return router;
				router = await waitForRequest(entries.routerEntry.getRouter(), request.signal);
				let isShell = IS_SHELL_ENV;
				if (IS_PRERENDERING && !isShell) isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
				const history$1 = createMemoryHistory({ initialEntries: [href] });
				router.update({
					history: history$1,
					isShell,
					isPrerendering: IS_PRERENDERING,
					origin: router.options.origin ?? origin,
					defaultSsr: requestStartOptions.defaultSsr,
					serializationAdapters: [...requestStartOptions.serializationAdapters, ...router.options.serializationAdapters || []],
					basepath: ROUTER_BASEPATH
				});
				return router;
			};
			if (SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE)) {
				const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
				if (!serverFnId) throw new Error("Invalid server action param for serverFnId");
				const serverFnHandler = async ({ context }) => {
					return runWithStartContext({
						getRouter,
						startOptions: requestStartOptions,
						contextAfterGlobalMiddlewares: context,
						request,
						executedRequestMiddlewares,
						handlerType: "serverFn"
					}, () => handleServerAction({
						request,
						context: requestOpts?.context,
						serverFnId
					}));
				};
				const { response: middlewareResponse$1 } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), serverFnHandler], {
					request,
					pathname: url.pathname,
					handlerType: "serverFn",
					context: createNullProtoObject(requestOpts?.context)
				}, request.signal);
				const result = await handleRedirectResponse(middlewareResponse$1, request, getRouter, request.signal);
				bindSsrResponseToRequest(router ?? void 0, result, request.signal);
				request.signal.throwIfAborted();
				responseOwnsCleanup = result.serverSsrCleanup === "stream";
				return result.response;
			}
			const executeRouter = async (serverContext, matchedRoutes) => {
				const acceptParts = (request.headers.get("Accept") || "*/*").split(",");
				if (!["*/*", "text/html"].some((mimeType) => acceptParts.some((part) => part.trim().startsWith(mimeType)))) return normalizeSsrResponse(Response.json({ error: "Only HTML requests are supported here" }, { status: 500 }));
				const manifest$1 = await waitForRequest(resolveManifestForRequest({
					request,
					requestInlineCss: requestOpts?.inlineCss,
					getBaseManifest: () => getBaseManifest(matchedRoutes)
				}), request.signal);
				const earlyHints = createEarlyHintsForRequest({
					onEarlyHints: requestOpts?.onEarlyHints,
					responseLinkHeader: requestOpts?.responseLinkHeader
				});
				earlyHints?.collectStatic({
					manifest: manifest$1,
					matchedRoutes
				});
				const routerInstance = await getRouter();
				attachRouterServerSsrUtils({
					router: routerInstance,
					manifest: manifest$1,
					getRequestAssets: () => getStartContext({ throwIfNotFound: false })?.requestAssets
				});
				routerInstance.options.additionalContext = { serverContext };
				await routerInstance.load({ _signal: request.signal });
				request.signal.throwIfAborted();
				if (routerInstance._serverResult?.type === "redirect") return normalizeSsrResponse(routerInstance._serverResult.redirect);
				earlyHints?.collectDynamic(_getRenderedMatches(routerInstance.stores.matches.get()));
				const ctx = getStartContext({ throwIfNotFound: false });
				await waitForRequest(routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets }), request.signal);
				request.signal.throwIfAborted();
				const responseHeaders = getStartResponseHeaders({ router: routerInstance });
				earlyHints?.appendResponseHeaders(responseHeaders);
				request.signal.throwIfAborted();
				return normalizeSsrResponse(await waitForRequest(cb({
					request,
					router: routerInstance,
					responseHeaders
				}), request.signal, (late) => disposeLateResponse(late, request.signal)));
			};
			const requestHandlerMiddleware = async ({ context }) => {
				return runWithStartContext({
					getRouter,
					startOptions: requestStartOptions,
					contextAfterGlobalMiddlewares: context,
					request,
					executedRequestMiddlewares,
					handlerType: "router"
				}, async () => {
					try {
						return await handleServerRoutes({
							getRouter,
							request,
							url,
							executeRouter,
							context,
							executedRequestMiddlewares
						});
					} catch (err) {
						if (err instanceof Response) return err;
						throw err;
					}
				});
			};
			const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), requestHandlerMiddleware], {
				request,
				pathname: url.pathname,
				handlerType: "router",
				context: createNullProtoObject(requestOpts?.context)
			}, request.signal);
			const response = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
			bindSsrResponseToRequest(router ?? void 0, response, request.signal);
			request.signal.throwIfAborted();
			responseOwnsCleanup = response.serverSsrCleanup === "stream";
			return response.response;
		} finally {
			if (router?.serverSsr && !responseOwnsCleanup) router.serverSsr.cleanup();
			router = null;
		}
	};
	return requestHandler(startRequestResolver);
}
async function handleRedirectResponse(response, request, getRouter, signal) {
	signal.throwIfAborted();
	const ssrResponse = normalizeSsrResponse(response);
	if (!isRedirect(ssrResponse.response)) return ssrResponse;
	if (isResolvedRedirect(ssrResponse.response)) {
		if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
			...ssrResponse.response.options,
			isSerializedRedirect: true
		}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
		return ssrResponse;
	}
	const opts = ssrResponse.response.options;
	if (opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) throw new Error(`Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`);
	if ([
		"params",
		"search",
		"hash"
	].some((d) => typeof opts[d] === "function")) throw new Error(`Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(opts).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`);
	signal.throwIfAborted();
	const router = await waitForRequest(getRouter(), signal);
	signal.throwIfAborted();
	const redirect$1 = router.resolveRedirect(ssrResponse.response);
	if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
		...ssrResponse.response.options,
		isSerializedRedirect: true
	}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
	return waitForRequest(replaceSsrResponse(ssrResponse, redirect$1, "redirect response replaced"), signal);
}
async function handleServerRoutes({ getRouter, request, url, executeRouter, context, executedRequestMiddlewares }) {
	const router = await getRouter();
	const pathname = executeRewriteInput(router.rewrite, url).pathname;
	const [matchedRoutes, rawParams, foundRoute] = router.getMatchedRoutes(pathname);
	const isExactMatch = foundRoute && rawParams["**"] === void 0;
	const routeMiddlewares = [];
	for (const route of matchedRoutes) {
		const serverMiddleware = route.options.server?.middleware;
		if (serverMiddleware) {
			const flattened = flattenMiddlewares(serverMiddleware);
			for (const m of flattened) if (!executedRequestMiddlewares.has(m)) routeMiddlewares.push(m.options.server);
		}
	}
	const server = foundRoute?.options.server;
	let isHeadFallback = false;
	if (server?.handlers && isExactMatch) {
		const handlers = typeof server.handlers === "function" ? server.handlers({ createHandlers: (d) => d }) : server.handlers;
		const requestMethod = request.method.toUpperCase();
		const handler = requestMethod === "HEAD" ? handlers["HEAD"] ?? handlers["GET"] ?? handlers["ANY"] : handlers[requestMethod] ?? handlers["ANY"];
		isHeadFallback = requestMethod === "HEAD" && handler !== void 0 && !handlers["HEAD"];
		if (handler) {
			const mayDefer = !!foundRoute.options.component;
			if (typeof handler === "function") routeMiddlewares.push(handlerToMiddleware(handler, mayDefer));
			else {
				if (handler.middleware?.length) {
					const handlerMiddlewares = flattenMiddlewares(handler.middleware);
					for (const m of handlerMiddlewares) routeMiddlewares.push(m.options.server);
				}
				if (handler.handler) routeMiddlewares.push(handlerToMiddleware(handler.handler, mayDefer));
			}
		}
	}
	routeMiddlewares.push(((ctx$1) => executeRouter(ctx$1.context, matchedRoutes)));
	const { ctx, response } = await executeMiddleware(routeMiddlewares, {
		request,
		context,
		params: rawParams,
		pathname,
		handlerType: "router"
	}, request.signal);
	if (isHeadFallback) {
		if (!ctx.response) throwRouteHandlerError();
		return waitForRequest(stripSsrResponseBody(await handleRedirectResponse(response, request, getRouter, request.signal), "HEAD body stripped"), request.signal);
	}
	return normalizeSsrResponse(response);
}
var fetch$1 = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
	return { async fetch(...args) {
		return await entry.fetch(...args);
	} };
}
var server_default = createServerEntry({ fetch: fetch$1 });
export { hasKeys as A, __toCommonJS as B, removeTrailingSlash as C, deepEqual as D, invariant as E, require_react as F, __commonJSMin as I, __esmMin as L, isModuleNotFoundError as M, redirect as N, escapeHtml as O, rootRouteId as P, __export as R, joinPaths as S, trimPathRight as T, __toESM as V, _getAssetMatches as _, useStore as a, createNonReactiveReadonlyStore as b, require_jsx_runtime as c, createServerEntry, getScriptPreloadAttrs as d, server_default as default, resolveManifestCssLink as f, isServer as g, useIntersectionObserver as h, useStructuralSharing as i, isDangerousProtocol as j, functionalUpdate as k, appendUniqueUserTags as l, useForwardedRef as m, Outlet as n, useRouter as o, reactUse as p, useMatch as r, useHydrated as s, require_react_dom as t, getAssetCrossOrigin as u, RouterCore as v, trimPathLeft as w, exactPathTest as x, createNonReactiveMutableStore as y, __require as z };
