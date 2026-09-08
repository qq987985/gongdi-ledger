import { F as require_react, V as __toESM, c as require_jsx_runtime } from "../server.js";
import { s as clsx, t as cn } from "./utils-DPLvt0U2.js";
var falsyToString = (value) => typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;
const cx = clsx;
const cva = (base, config) => (props) => {
	var _config_compoundVariants;
	if ((config === null || config === void 0 ? void 0 : config.variants) == null) return cx(base, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
	const { variants, defaultVariants } = config;
	const getVariantClassNames = Object.keys(variants).map((variant) => {
		const variantProp = props === null || props === void 0 ? void 0 : props[variant];
		const defaultVariantProp = defaultVariants === null || defaultVariants === void 0 ? void 0 : defaultVariants[variant];
		if (variantProp === null) return null;
		const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
		return variants[variant][variantKey];
	});
	const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param) => {
		let [key, value] = param;
		if (value === void 0) return acc;
		acc[key] = value;
		return acc;
	}, {});
	return cx(base, getVariantClassNames, config === null || config === void 0 ? void 0 : (_config_compoundVariants = config.compoundVariants) === null || _config_compoundVariants === void 0 ? void 0 : _config_compoundVariants.reduce((acc, param) => {
		let { class: cvClass, className: cvClassName, ...compoundVariantOptions } = param;
		return Object.entries(compoundVariantOptions).every((param$1) => {
			let [key, value] = param$1;
			return Array.isArray(value) ? value.includes({
				...defaultVariants,
				...propsWithoutUndefined
			}[key]) : {
				...defaultVariants,
				...propsWithoutUndefined
			}[key] === value;
		}) ? [
			...acc,
			cvClass,
			cvClassName
		] : acc;
	}, []), props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
};
require_react();
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var buttonVariants = cva("btn inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg shadow-sm hover:bg-accent-strong hover:shadow-md",
			outline: "border border-line-strong bg-surface text-ink hover:border-accent hover:bg-accent-soft hover:text-accent",
			ghost: "text-ink hover:bg-accent-soft hover:text-accent",
			danger: "bg-danger text-danger-fg shadow-sm hover:opacity-90 hover:shadow-md"
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
export { Button as t };
