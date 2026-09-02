import { t as cn } from "./utils-CBhPqRT8.js";
import "react";
import { jsx } from "react/jsx-runtime";
function Input({ className, ...props }) {
	return /* @__PURE__ */ jsx("input", {
		className: cn("h-11 w-full rounded-sm border border-line bg-surface px-3 text-base text-ink placeholder:text-subtle outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 md:h-10 md:text-sm", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ jsx("label", {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
export { Label as n, Input as t };
