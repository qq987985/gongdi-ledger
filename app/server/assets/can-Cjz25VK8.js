import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { a as can, c as hasPerm, f as subscribePerms, l as livePerms, o as canManageLedger, u as permLabel } from "./perms-D5IsG1Md.js";
import { v as toast } from "./audit-diff-BCw9WhZ-.js";
function canSaveToServer(perm) {
	const perms = livePerms();
	return canManageLedger(perms) && hasPerm(perms, perm);
}
function blockedWrite(perm, what) {
	if (canSaveToServer(perm)) return false;
	toast.error(`你是只读账号（缺「${what}」权限），改动不会保存。请联系管理员开通权限。`);
	return true;
}
function readonlyHint(what) {
	return `你是只读账号（缺「${what}」权限），改动不会保存。请联系管理员开通权限。`;
}
function blockedImport() {
	return blockedWrite("import.use", permLabel("import.use"));
}
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function useCan(perm) {
	const [, bump] = import_react.useState(0);
	import_react.useEffect(() => subscribePerms(() => bump((n) => n + 1)), []);
	return can(perm);
}
function useCanSave(perm) {
	const [, bump] = import_react.useState(0);
	import_react.useEffect(() => subscribePerms(() => bump((n) => n + 1)), []);
	return canSaveToServer(perm);
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
function ReadonlyNotice({ perm }) {
	if (useCanSave(perm)) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-lg border border-line bg-warn-bg px-3 py-2 text-sm text-warn",
		children: readonlyHint(permLabel(perm))
	});
}
export { useCanSave as a, readonlyHint as c, useCan as i, Need as n, blockedImport as o, ReadonlyNotice as r, blockedWrite as s, Can as t };
