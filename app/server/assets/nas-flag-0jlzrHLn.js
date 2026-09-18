var nas;
function setNasEnabled(v) {
	nas = Boolean(v);
}
function nasEnabled() {
	return nas !== false;
}
export { setNasEnabled as n, nasEnabled as t };
