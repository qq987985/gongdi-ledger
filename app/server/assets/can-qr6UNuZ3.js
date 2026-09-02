import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { a as can, u as subscribePerms } from "./perms-CYLuVN7r.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function useCan(perm) {
	const [, bump] = import_react.useState(0);
	import_react.useEffect(() => subscribePerms(() => bump((n) => n + 1)), []);
	return can(perm);
}
function Can({ perm, children }) {
	if (!useCan(perm)) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function Need({ perm, children }) {
	if (!useCan(perm)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "没有此项权限。请让管理员或这套台账的创建人给你开通。"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
export { Need as n, useCan as r, Can as t };
