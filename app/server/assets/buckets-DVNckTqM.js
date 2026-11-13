const ALL_BUCKETS = "__all__";
var BUCKET_ESCAPE = "__bucket__:";
function bucketValue(value) {
	return value === "__all__" || value.startsWith(BUCKET_ESCAPE) ? BUCKET_ESCAPE + value : value;
}
function bucketRaw(value) {
	return value.startsWith(BUCKET_ESCAPE) ? value.slice(11) : value;
}
function groupBuckets(values, emptyLabel) {
	const seen = /* @__PURE__ */ new Set();
	let hasEmpty = false;
	for (const raw of values) {
		const v = String(raw ?? "").trim();
		if (!v) hasEmpty = true;
		else seen.add(v);
	}
	const out = [...seen].sort((a, b) => a.localeCompare(b, "zh")).map((value) => ({
		value: bucketValue(value),
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
	return String(value ?? "").trim() === bucketRaw(bucket);
}
export { inBucket as i, bucketRaw as n, groupBuckets as r, ALL_BUCKETS as t };
