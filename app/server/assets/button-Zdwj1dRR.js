import { t as cn } from "./utils-CBhPqRT8.js";
import "react";
import { jsx } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
var buttonVariants = cva("btn inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-sm text-xs font-medium transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			outline: "border border-line-strong bg-surface text-ink hover:bg-accent-soft",
			ghost: "text-ink hover:bg-accent-soft",
			danger: "bg-danger text-danger-fg hover:opacity-90"
		},
		size: {
			default: "",
			sm: "btn-sm",
			lg: "btn-lg",
			icon: "btn-icon"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, ...props }) {
	return /* @__PURE__ */ jsx("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
export { Button as t };
