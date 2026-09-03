import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { t as cn } from "./utils-DPLvt0U2.js";
require_react();
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function Badge({ className, tone = "neutral", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", {
			neutral: "bg-bg text-muted border-line",
			ok: "bg-ok-bg text-ok border-transparent",
			warn: "bg-warn-bg text-warn border-transparent",
			danger: "bg-danger-bg text-danger border-transparent",
			accent: "bg-accent text-accent-fg border-transparent"
		}[tone], className),
		...props
	});
}
export { Badge as t };
