const ALL_BUCKETS = "__all__";
function groupBuckets(values, emptyLabel) {
	const seen = /* @__PURE__ */ new Set();
	let hasEmpty = false;
	for (const raw of values) {
		const v = String(raw ?? "").trim();
		if (!v) hasEmpty = true;
		else seen.add(v);
	}
	const out = [...seen].sort((a, b) => a.localeCompare(b, "zh")).map((value) => ({
		value,
		label: value,
		empty: false
	}));
	if (hasEmpty) out.push({
		value: "",
		label: emptyLabel,
		empty: true
	});
	return out;
}
function inBucket(value, bucket) {
	if (bucket === "__all__") return true;
	return String(value ?? "").trim() === bucket;
}
export { groupBuckets as n, inBucket as r, ALL_BUCKETS as t };
