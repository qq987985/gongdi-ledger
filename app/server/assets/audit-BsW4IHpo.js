async function logOp(action, detail = "", module = "") {
	try {
		await fetch("/api/audit", {
			method: "POST",
			credentials: "include",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				action,
				detail,
				module
			})
		});
	} catch {}
}
async function fetchAudit() {
	const r = await fetch("/api/audit", { credentials: "include" });
	if (!r.ok) return [];
	return (await r.json()).entries || [];
}
export { logOp as n, fetchAudit as t };
