import { F as require_react, V as __toESM } from "../server.js";
var import_react = /* @__PURE__ */ __toESM(require_react());
function useGuardedClose(onClose) {
	const dirtyRef = import_react.useRef(false);
	const requestClose = import_react.useCallback(() => {
		if (dirtyRef.current && typeof window !== "undefined" && !window.confirm("有未保存的更改，确定关闭吗？已填内容会丢失。")) return;
		onClose();
	}, [onClose]);
	return {
		markDirty: import_react.useCallback(() => {
			dirtyRef.current = true;
		}, []),
		requestClose
	};
}
export { useGuardedClose as t };
