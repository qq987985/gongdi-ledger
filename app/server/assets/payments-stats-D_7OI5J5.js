import { A as parseDateYmd, M as ymKey, f as round2 } from "./contracts-EeNrOMGH.js";
import { n as groupBuckets, r as inBucket, t as ALL_BUCKETS } from "./buckets-Bkm2eutI.js";
function receiverOf(p) {
	return (p.receiver || "").trim() || (p.owner || "").trim();
}
function isPaidSelf(p) {
	return Boolean(p.date) && (p.owner || "").trim() === receiverOf(p);
}
function isProxyPaid(p) {
	return Boolean(p.date) && !isPaidSelf(p);
}
function isPending(p) {
	return !p.date;
}
const PROXY_LABEL = "代发";
const PENDING_LABEL = "待发放";
function paymentsInRange(payments, lo, hi) {
	return payments.filter((p) => {
		const d = parseDateYmd(p.date) || p.date;
		if (!d) return true;
		const y = Number(d.slice(0, 4));
		const m = Number(d.slice(5, 7));
		if (!y || !m) return true;
		const k = ymKey(y, m);
		return k >= lo && k <= hi;
	});
}
function filterPayments(ranged, f) {
	let list = ranged;
	if (f.status === "pending") list = list.filter((p) => !p.date);
	if (f.status === "paid") list = list.filter((p) => Boolean(p.date));
	if (f.source !== "__all__") list = list.filter((p) => inBucket(p.source, f.source));
	if (f.q.trim()) {
		const s = f.q.trim();
		list = list.filter((p) => [p.owner, p.receiver].some((x) => (x || "").includes(s)));
	}
	return list;
}
function sumAmount(rows) {
	return round2(rows.reduce((s, p) => s + (p.amount || 0), 0));
}
function paymentSummary(rows) {
	const self = rows.filter(isPaidSelf);
	const proxy = rows.filter(isProxyPaid);
	const pending = rows.filter(isPending);
	return {
		count: rows.length,
		total: sumAmount(rows),
		selfCount: self.length,
		selfAmt: sumAmount(self),
		proxyCount: proxy.length,
		proxyAmt: sumAmount(proxy),
		pendingCount: pending.length,
		pendingAmt: sumAmount(pending)
	};
}
function byOwnerRows(rows) {
	const map = /* @__PURE__ */ new Map();
	const proxySeen = /* @__PURE__ */ new Map();
	for (const p of rows) {
		const owner = (p.owner || "").trim();
		if (isPaidSelf(p)) {
			const cur = map.get(owner) || {
				owner,
				kind: "person",
				count: 0,
				amount: 0,
				proxyCount: 0
			};
			cur.count += 1;
			cur.amount += p.amount || 0;
			map.set(owner, cur);
		} else if (isProxyPaid(p)) proxySeen.set(owner, (proxySeen.get(owner) || 0) + 1);
	}
	const out = [...map.values()];
	for (const r of out) {
		r.amount = round2(r.amount);
		r.proxyCount = proxySeen.get(r.owner) || 0;
	}
	return out.sort((a, b) => b.amount - a.amount || a.owner.localeCompare(b.owner, "zh"));
}
function scopeRows(rows, owner) {
	return owner === "__all__" ? rows : rows.filter((p) => inBucket((p.owner || "").trim(), owner));
}
function appendGroups(persons, scope) {
	const out = [...persons];
	const proxy = scope.filter(isProxyPaid);
	if (proxy.length) out.push({
		owner: PROXY_LABEL,
		kind: "proxy",
		count: proxy.length,
		amount: sumAmount(proxy),
		proxyCount: 0
	});
	const pending = scope.filter(isPending);
	if (pending.length) out.push({
		owner: PENDING_LABEL,
		kind: "pending",
		count: pending.length,
		amount: sumAmount(pending),
		proxyCount: 0
	});
	return out;
}
function printSummary(rows, owner) {
	const scope = scopeRows(rows, owner);
	return appendGroups(byOwnerRows(scope), scope);
}
function panelRows(rows) {
	return printSummary(rows, ALL_BUCKETS);
}
function sourceBuckets(ranged) {
	return groupBuckets(ranged.map((p) => p.source), "未填发放方");
}
function printOwnerBuckets(rows) {
	return groupBuckets(byOwnerRows(rows).map((r) => r.owner), "（未填实际收款人）");
}
function byDateThenId(a, b) {
	return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id);
}
function detailSections(rows, owner) {
	const scope = scopeRows(rows, owner);
	const byOwner = byOwnerRows(scope);
	const order = new Map(byOwner.map((r, i) => [r.owner, i]));
	const sections = byOwner.map((r) => {
		const mine = scope.filter((p) => isPaidSelf(p) && (p.owner || "").trim() === r.owner).slice().sort(byDateThenId);
		return {
			owner: r.owner,
			kind: "person",
			rows: mine,
			count: mine.length,
			amount: sumAmount(mine),
			proxyCount: r.proxyCount
		};
	}).filter((s) => s.rows.length > 0).sort((a, b) => (order.get(a.owner) ?? 0) - (order.get(b.owner) ?? 0));
	const proxy = scope.filter(isProxyPaid).slice().sort(byDateThenId);
	if (proxy.length) sections.push({
		owner: PROXY_LABEL,
		kind: "proxy",
		rows: proxy,
		count: proxy.length,
		amount: sumAmount(proxy),
		proxyCount: 0
	});
	const pending = scope.filter(isPending).slice().sort(byDateThenId);
	if (pending.length) sections.push({
		owner: PENDING_LABEL,
		kind: "pending",
		rows: pending,
		count: pending.length,
		amount: sumAmount(pending),
		proxyCount: 0
	});
	return sections;
}
function printTotals(rows, owner = ALL_BUCKETS) {
	const scope = scopeRows(rows, owner);
	return {
		count: scope.length,
		amount: sumAmount(scope)
	};
}
function sectionTotals(sections) {
	return {
		count: sections.reduce((s, x) => s + x.count, 0),
		amount: round2(sections.reduce((s, x) => s + x.amount, 0))
	};
}
function ownerTotals(rows) {
	return {
		count: rows.reduce((s, x) => s + x.count, 0),
		amount: round2(rows.reduce((s, x) => s + x.amount, 0))
	};
}
const PRINT_CALIBER_NOTE = "只计已填发放日期的记录；代收（收款人非本人）不计入已发，单列代发；待发放不算已发。";
export { sourceBuckets as _, isPaidSelf as a, ownerTotals as c, paymentsInRange as d, printOwnerBuckets as f, sectionTotals as g, scopeRows as h, filterPayments as i, panelRows as l, printTotals as m, PROXY_LABEL as n, isPending as o, printSummary as p, detailSections as r, isProxyPaid as s, PRINT_CALIBER_NOTE as t, paymentSummary as u };
