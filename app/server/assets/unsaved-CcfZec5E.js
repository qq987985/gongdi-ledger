const LEAVE_CONFIRM_HINT = "确定＝丢弃并离开，取消＝继续编辑";
var owner = null;
var message = "";
function armUnsaved(token, msg) {
	owner = token;
	message = msg;
}
function clearUnsaved(token) {
	if (token && owner !== token) return;
	owner = null;
	message = "";
}
function hasUnsavedChanges() {
	return owner !== null;
}
function leaveQuestion(extra = "") {
	return [message || "有未保存的改动", extra].filter(Boolean).join("；") + `\n\n${LEAVE_CONFIRM_HINT}`;
}
function confirmLeaveUnsaved(extra = "") {
	if (!hasUnsavedChanges()) return true;
	const ask = globalThis.confirm;
	if (typeof ask !== "function") return true;
	if (!ask(leaveQuestion(extra))) return false;
	clearUnsaved();
	return true;
}
export { hasUnsavedChanges as i, clearUnsaved as n, confirmLeaveUnsaved as r, armUnsaved as t };
