import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { it as can, ut as subscribePerms } from "./router-DxdzlCp3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/can-gkGWV5bu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useCan(perm) {
	const [, bump] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => subscribePerms(() => bump((n) => n + 1)), []);
	return can(perm);
}
function Can({ perm, children }) {
	if (!useCan(perm)) return null;
	return children;
}
function Need({ perm, children }) {
	if (!useCan(perm)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "没有此项权限。请让管理员或这套台账的创建人给你开通。"
	});
	return children;
}
//#endregion
export { Need as n, useCan as r, Can as t };
