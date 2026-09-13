var nas = false;
function setNasEnabled(v) {
	nas = Boolean(v);
}
function nasEnabled() {
	return nas;
}
export { setNasEnabled as n, nasEnabled as t };
