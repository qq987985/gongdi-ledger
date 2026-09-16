function receiverOf(p) {
	return (p.receiver || "").trim() || (p.owner || "").trim();
}
function isProxyReceiver(p) {
	return receiverOf(p) !== (p.owner || "").trim();
}
export { receiverOf as n, isProxyReceiver as t };
