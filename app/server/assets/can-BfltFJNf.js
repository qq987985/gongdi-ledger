import { a as can, u as subscribePerms } from "./perms-DQTE-mZW.js";
import * as React from "react";
import { Fragment, jsx } from "react/jsx-runtime";
function useCan(perm) {
	const [, bump] = React.useState(0);
	React.useEffect(() => subscribePerms(() => bump((n) => n + 1)), []);
	return can(perm);
}
function Can({ perm, children }) {
	if (!useCan(perm)) return null;
	return /* @__PURE__ */ jsx(Fragment, { children });
}
function Need({ perm, children }) {
	if (!useCan(perm)) return /* @__PURE__ */ jsx("p", {
		className: "text-sm text-muted",
		children: "没有此项权限。请让管理员或这套台账的创建人给你开通。"
	});
	return /* @__PURE__ */ jsx(Fragment, { children });
}
export { Need as n, useCan as r, Can as t };
