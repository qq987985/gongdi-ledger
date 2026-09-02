import { t as cn } from "./utils-CBhPqRT8.js";
import "react";
import { jsx } from "react/jsx-runtime";
function Badge({ className, tone = "neutral", ...props }) {
	return /* @__PURE__ */ jsx("span", {
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
export { Badge as t };
