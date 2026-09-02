import { A as hasKeys, C as removeTrailingSlash, D as deepEqual, F as require_react, V as __toESM, a as useStore, c as require_jsx_runtime, g as isServer, h as useIntersectionObserver, j as isDangerousProtocol, k as functionalUpdate, m as useForwardedRef, o as useRouter, s as useHydrated, x as exactPathTest } from "../server.js";
var preloadWarning = "Error preloading route! ☝️";
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
require_jsx_runtime();
function useValueStable(value) {
	const ref = import_react.useRef(value);
	if (!deepEqual(ref.current, value, { ignoreUndefined: false })) ref.current = value;
	return ref.current;
}
function compareLinkState(a, b) {
	return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
function resolveExternalLink(hrefOption, to, protocolAllowlist) {
	if (hrefOption?.external) {
		if (isDangerousProtocol(hrefOption.href, protocolAllowlist)) return;
		return hrefOption.href;
	}
	if (isSafeInternal(to)) return;
	if (typeof to !== "string" || to.indexOf(":") === -1) return;
	try {
		new URL(to);
		if (isDangerousProtocol(to, protocolAllowlist)) return;
		return to;
	} catch {}
}
function resolveIsActive(location, next, activeOptions, basepath, isHydrated, isExternal) {
	if (isExternal) return false;
	if (activeOptions?.exact) {
		if (!exactPathTest(location.pathname, next.pathname, basepath)) return false;
	} else {
		const currentPathSplit = removeTrailingSlash(location.pathname, basepath);
		const nextPathSplit = removeTrailingSlash(next.pathname, basepath);
		if (!(currentPathSplit.startsWith(nextPathSplit) && (currentPathSplit.length === nextPathSplit.length || currentPathSplit[nextPathSplit.length] === "/"))) return false;
	}
	if (activeOptions?.includeSearch ?? true) {
		if (!deepEqual(location.search, next.search, {
			partial: !activeOptions?.exact,
			ignoreUndefined: !activeOptions?.explicitUndefined
		})) return false;
	}
	if (activeOptions?.includeHash) return isHydrated && location.hash === next.hash;
	return true;
}
function useLinkProps(options, forwardedRef) {
	const router = useRouter();
	const innerRef = useForwardedRef(forwardedRef);
	const { activeProps, inactiveProps, activeOptions, to, preload: userPreload, preloadDelay: userPreloadDelay, preloadIntentProximity: _preloadIntentProximity, hashScrollIntoView, replace, startTransition, resetScroll, viewTransition, children, target, disabled, style, className, onClick, onBlur, onFocus, onMouseEnter, onMouseLeave, onTouchStart, ignoreBlocker, params: _params, search: _search, hash: _hash, state: _state, mask: _mask, reloadDocument: _reloadDocument, unsafeRelative: _unsafeRelative, from: _from, _fromLocation, ...propsSafeToSpread } = options;
	{
		const safeInternal = isSafeInternal(to);
		if (typeof to === "string" && !safeInternal && to.indexOf(":") > -1) try {
			new URL(to);
			if (isDangerousProtocol(to, router.protocolAllowlist)) return {
				...propsSafeToSpread,
				ref: innerRef,
				href: void 0,
				...children && { children },
				...target && { target },
				...disabled && { disabled },
				...style && { style },
				...className && { className }
			};
			return {
				...propsSafeToSpread,
				ref: innerRef,
				href: to,
				...children && { children },
				...target && { target },
				...disabled && { disabled },
				...style && { style },
				...className && { className }
			};
		} catch {}
		const next = router.buildLocation({
			...options,
			from: options.from
		});
		const hrefOption = getHrefOption(next.maskedLocation ? next.maskedLocation.publicHref : next.publicHref, next.maskedLocation ? next.maskedLocation.external : next.external, router.history, disabled);
		const externalLink$1 = (() => {
			if (hrefOption?.external) {
				if (isDangerousProtocol(hrefOption.href, router.protocolAllowlist)) return;
				return hrefOption.href;
			}
			if (safeInternal) return void 0;
			if (typeof to === "string" && to.indexOf(":") > -1) try {
				new URL(to);
				if (isDangerousProtocol(to, router.protocolAllowlist)) return;
				return to;
			} catch {}
		})();
		const isActive$1 = (() => {
			if (externalLink$1) return false;
			const currentLocation = router.stores.location.get();
			const exact = activeOptions?.exact ?? false;
			if (exact) {
				if (!exactPathTest(currentLocation.pathname, next.pathname, router.basepath)) return false;
			} else {
				const currentPathSplit = removeTrailingSlash(currentLocation.pathname, router.basepath);
				const nextPathSplit = removeTrailingSlash(next.pathname, router.basepath);
				if (!(currentPathSplit.startsWith(nextPathSplit) && (currentPathSplit.length === nextPathSplit.length || currentPathSplit[nextPathSplit.length] === "/"))) return false;
			}
			if (activeOptions?.includeSearch ?? true) {
				if (currentLocation.search !== next.search) {
					const currentSearchEmpty = !currentLocation.search || typeof currentLocation.search === "object" && !hasKeys(currentLocation.search);
					const nextSearchEmpty = !next.search || typeof next.search === "object" && !hasKeys(next.search);
					if (!(currentSearchEmpty && nextSearchEmpty)) {
						if (!deepEqual(currentLocation.search, next.search, {
							partial: !exact,
							ignoreUndefined: !activeOptions?.explicitUndefined
						})) return false;
					}
				}
			}
			if (activeOptions?.includeHash) return false;
			return true;
		})();
		if (externalLink$1) return {
			...propsSafeToSpread,
			ref: innerRef,
			href: externalLink$1,
			...children && { children },
			...target && { target },
			...disabled && { disabled },
			...style && { style },
			...className && { className }
		};
		const resolvedActiveProps$1 = isActive$1 ? functionalUpdate(activeProps, {}) ?? STATIC_ACTIVE_OBJECT : STATIC_EMPTY_OBJECT;
		const resolvedInactiveProps$1 = isActive$1 ? STATIC_EMPTY_OBJECT : functionalUpdate(inactiveProps, {}) ?? STATIC_EMPTY_OBJECT;
		const resolvedStyle$1 = (() => {
			const baseStyle = style;
			const activeStyle = resolvedActiveProps$1.style;
			const inactiveStyle = resolvedInactiveProps$1.style;
			if (!baseStyle && !activeStyle && !inactiveStyle) return;
			if (baseStyle && !activeStyle && !inactiveStyle) return baseStyle;
			if (!baseStyle && activeStyle && !inactiveStyle) return activeStyle;
			if (!baseStyle && !activeStyle && inactiveStyle) return inactiveStyle;
			return {
				...baseStyle,
				...activeStyle,
				...inactiveStyle
			};
		})();
		const resolvedClassName$1 = (() => {
			const baseClassName = className;
			const activeClassName = resolvedActiveProps$1.className;
			const inactiveClassName = resolvedInactiveProps$1.className;
			if (!baseClassName && !activeClassName && !inactiveClassName) return "";
			let out = "";
			if (baseClassName) out = baseClassName;
			if (activeClassName) out = out ? `${out} ${activeClassName}` : activeClassName;
			if (inactiveClassName) out = out ? `${out} ${inactiveClassName}` : inactiveClassName;
			return out;
		})();
		return {
			...propsSafeToSpread,
			...resolvedActiveProps$1,
			...resolvedInactiveProps$1,
			href: hrefOption?.href,
			ref: innerRef,
			disabled: !!disabled,
			target,
			...resolvedStyle$1 && { style: resolvedStyle$1 },
			...resolvedClassName$1 && { className: resolvedClassName$1 },
			...disabled && STATIC_DISABLED_PROPS,
			...isActive$1 && STATIC_ACTIVE_PROPS
		};
	}
	const isHydrated = useHydrated();
	const stableSearch = useValueStable(options.search);
	const stableParams = useValueStable(options.params);
	const stableActiveOptions = useValueStable(activeOptions);
	const _options = import_react.useMemo(() => options, [
		router,
		options.from,
		options._fromLocation,
		options.hash,
		options.to,
		stableSearch,
		stableParams,
		options.state,
		options.mask,
		options.unsafeRelative
	]);
	const selectLinkState = import_react.useCallback((location) => {
		const next = router.buildLocation({
			_fromLocation: location,
			..._options
		});
		const hrefOption = getHrefOption(next.maskedLocation ? next.maskedLocation.publicHref : next.publicHref, next.maskedLocation ? next.maskedLocation.external : next.external, router.history, disabled);
		const externalLink$1 = resolveExternalLink(hrefOption, to, router.protocolAllowlist);
		return [
			hrefOption?.href,
			externalLink$1,
			resolveIsActive(location, next, stableActiveOptions, router.basepath, isHydrated, externalLink$1 !== void 0)
		];
	}, [
		stableActiveOptions,
		disabled,
		isHydrated,
		_options,
		router,
		to
	]);
	const [href, externalLink, isActive] = useStore(router.stores.location, selectLinkState, compareLinkState);
	const resolvedActiveProps = isActive ? functionalUpdate(activeProps, {}) ?? STATIC_ACTIVE_OBJECT : STATIC_EMPTY_OBJECT;
	const resolvedInactiveProps = isActive ? STATIC_EMPTY_OBJECT : functionalUpdate(inactiveProps, {}) ?? STATIC_EMPTY_OBJECT;
	const resolvedClassName = [
		className,
		resolvedActiveProps.className,
		resolvedInactiveProps.className
	].filter(Boolean).join(" ");
	const resolvedStyle = (style || resolvedActiveProps.style || resolvedInactiveProps.style) && {
		...style,
		...resolvedActiveProps.style,
		...resolvedInactiveProps.style
	};
	const hasRenderFetched = import_react.useRef(false);
	const preload = options.reloadDocument || externalLink || disabled ? false : userPreload ?? router.options.defaultPreload;
	const preloadDelay = userPreloadDelay ?? router.options.defaultPreloadDelay ?? 0;
	const doPreload = import_react.useCallback(() => {
		router.preloadRoute(_options).catch((err) => {
			console.warn(err);
			console.warn(preloadWarning);
		});
	}, [router, _options]);
	const enqueuePreload = import_react.useCallback((e) => {
		if (!e) {
			cancelPreload(innerRef);
			return;
		}
		if (!(e.isIntersecting ?? preload === "intent")) {
			if (e.isIntersecting === false) cancelPreload(innerRef);
			return;
		}
		if (!preloadDelay) {
			doPreload();
			return;
		}
		if (timeoutMap.has(innerRef)) return;
		timeoutMap.set(innerRef, setTimeout(() => {
			timeoutMap.delete(innerRef);
			doPreload();
		}, preloadDelay));
	}, [
		doPreload,
		innerRef,
		preload,
		preloadDelay
	]);
	useIntersectionObserver(innerRef, enqueuePreload, preload !== "viewport");
	import_react.useEffect(() => {
		if (hasRenderFetched.current) return;
		if (preload === "render") {
			doPreload();
			hasRenderFetched.current = true;
		}
	}, [doPreload, preload]);
	const handleClick = (e) => {
		const elementTarget = e.currentTarget.getAttribute("target");
		const effectiveTarget = target !== void 0 ? target : elementTarget;
		if (!disabled && !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) && !e.defaultPrevented && (!effectiveTarget || effectiveTarget === "_self") && e.button === 0) {
			e.preventDefault();
			router.navigate({
				..._options,
				replace,
				resetScroll,
				hashScrollIntoView,
				startTransition,
				viewTransition,
				ignoreBlocker
			});
		}
	};
	if (externalLink) return {
		...propsSafeToSpread,
		ref: innerRef,
		href: externalLink,
		...children && { children },
		...target && { target },
		...disabled && { disabled },
		...style && { style },
		...className && { className },
		...onClick && { onClick },
		...onBlur && { onBlur },
		...onFocus && { onFocus },
		...onMouseEnter && { onMouseEnter },
		...onMouseLeave && { onMouseLeave },
		...onTouchStart && { onTouchStart }
	};
	const handleTouchStart = () => {
		if (preload !== "intent") return;
		doPreload();
	};
	const handleLeave = () => {
		if (preload === "intent") cancelPreload(innerRef);
	};
	return {
		...propsSafeToSpread,
		...resolvedActiveProps,
		...resolvedInactiveProps,
		href,
		ref: innerRef,
		onClick: composeHandlers([onClick, handleClick]),
		onBlur: composeHandlers([onBlur, handleLeave]),
		onFocus: composeHandlers([onFocus, enqueuePreload]),
		onMouseEnter: composeHandlers([onMouseEnter, enqueuePreload]),
		onMouseLeave: composeHandlers([onMouseLeave, handleLeave]),
		onTouchStart: composeHandlers([onTouchStart, handleTouchStart]),
		disabled: !!disabled,
		target,
		...resolvedStyle && { style: resolvedStyle },
		...resolvedClassName && { className: resolvedClassName },
		...disabled && STATIC_DISABLED_PROPS,
		...isActive && STATIC_ACTIVE_PROPS
	};
}
var STATIC_EMPTY_OBJECT = {};
var STATIC_ACTIVE_OBJECT = { className: "active" };
var STATIC_DISABLED_PROPS = {
	role: "link",
	"aria-disabled": true
};
var STATIC_ACTIVE_PROPS = {
	"data-status": "active",
	"aria-current": "page"
};
var timeoutMap = /* @__PURE__ */ new WeakMap();
var cancelPreload = (eventTarget) => {
	clearTimeout(timeoutMap.get(eventTarget));
	timeoutMap.delete(eventTarget);
};
var composeHandlers = (handlers) => (e) => {
	for (const handler of handlers) {
		if (!handler) continue;
		if (e.defaultPrevented) return;
		handler(e);
	}
};
function getHrefOption(publicHref, external, history, disabled) {
	if (disabled) return void 0;
	if (external) return {
		href: publicHref,
		external: true
	};
	return {
		href: history.createHref(publicHref) || "/",
		external: false
	};
}
function isSafeInternal(to) {
	if (typeof to !== "string") return false;
	const zero = to.charCodeAt(0);
	if (zero === 47) return to.charCodeAt(1) !== 47;
	return zero === 46;
}
var Link = import_react.forwardRef((props, ref) => {
	const { _asChild, ...rest } = props;
	const { type: _type, ...linkProps } = useLinkProps(rest, ref);
	const children = typeof rest.children === "function" ? rest.children({ isActive: linkProps["data-status"] === "active" }) : rest.children;
	if (!_asChild) {
		const { disabled: _, ...rest$1 } = linkProps;
		return import_react.createElement("a", rest$1, children);
	}
	return import_react.createElement(_asChild, linkProps, children);
});
export { Link as t };
