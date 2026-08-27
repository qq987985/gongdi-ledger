import { z as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { dt as cn } from "./router-DxdzlCp3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-U3vNDWCk.js
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "neutral", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", {
			neutral: "bg-bg text-muted border-line",
			ok: "bg-accent-soft text-ok border-transparent",
			warn: "bg-warn-bg text-warn border-transparent",
			danger: "bg-danger-bg text-danger border-transparent",
			accent: "bg-accent text-accent-fg border-transparent"
		}[tone], className),
		...props
	});
}
//#endregion
export { Badge as t };
