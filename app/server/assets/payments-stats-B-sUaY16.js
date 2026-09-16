import { N as ymKey, j as parseDateYmd, p as round2 } from "./contracts-BxZHWnH3.js";
import { n as receiverOf } from "./receiver-BxQOI1ff.js";
import { n as groupBuckets, r as inBucket, t as ALL_BUCKETS } from "./buckets-CVtUoKqY.js";
function isPaid(p) {
	return Boolean(p.date);
}
function isPending(p) {
	return !p.date;
}
function isPaidSelf(p) {
	return Boolean(p.date) && (p.owner || "").trim() === receiverOf(p);
}
function isProxyPaid(p) {
	return Boolean(p.date) && !isPaidSelf(p);
}
const PENDING_LABEL = "待发放";
const PROXY_INLINE_LABEL = "其中代发";
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
	const paid = rows.filter(isPaid);
	const proxy = rows.filter(isProxyPaid);
	const pending = rows.filter(isPending);
	return {
		count: rows.length,
		total: sumAmount(rows),
		paidCount: paid.length,
		paidAmt: sumAmount(paid),
		proxyCount: proxy.length,
		proxyAmt: sumAmount(proxy),
		pendingCount: pending.length,
		pendingAmt: sumAmount(pending)
	};
}
function byOwnerRows(rows) {
	const map = /* @__PURE__ */ new Map();
	for (const p of rows) {
		if (!isPaid(p)) continue;
		const owner = (p.owner || "").trim();
		const cur = map.get(owner) || {
			owner,
			kind: "person",
			count: 0,
			amount: 0,
			proxyCount: 0,
			proxyAmt: 0
		};
		cur.count += 1;
		cur.amount += p.amount || 0;
		if (isProxyPaid(p)) {
			cur.proxyCount += 1;
			cur.proxyAmt += p.amount || 0;
		}
		map.set(owner, cur);
	}
	const out = [...map.values()];
	for (const r of out) {
		r.amount = round2(r.amount);
		r.proxyAmt = round2(r.proxyAmt);
	}
	return out.sort((a, b) => b.amount - a.amount || a.owner.localeCompare(b.owner, "zh"));
}
function scopeRows(rows, owner) {
	return owner === "__all__" ? rows : rows.filter((p) => inBucket((p.owner || "").trim(), owner));
}
function appendPending(persons, scope) {
	const out = [...persons];
	const pending = scope.filter(isPending);
	if (pending.length) out.push({
		owner: PENDING_LABEL,
		kind: "pending",
		count: pending.length,
		amount: sumAmount(pending),
		proxyCount: 0,
		proxyAmt: 0
	});
	return out;
}
function printSummary(rows, owner) {
	const scope = scopeRows(rows, owner);
	return appendPending(byOwnerRows(scope), scope);
}
function panelRows(rows) {
	return printSummary(rows, ALL_BUCKETS);
}
function sourceBuckets(ranged) {
	return groupBuckets(ranged.map((p) => p.source), "未填发放方");
}
function printOwnerBuckets(rows) {
	return groupBuckets(rows.map((p) => (p.owner || "").trim()), "（未填实际收款人）");
}
function byDateThenId(a, b) {
	if (!a.date && b.date) return 1;
	if (a.date && !b.date) return -1;
	return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id);
}
function detailSections(rows, owner) {
	const scope = scopeRows(rows, owner);
	const groups = /* @__PURE__ */ new Map();
	for (const p of scope) {
		const key = (p.owner || "").trim();
		const list = groups.get(key);
		if (list) list.push(p);
		else groups.set(key, [p]);
	}
	return [...groups.entries()].map(([owner$1, mine]) => {
		const sorted = mine.slice().sort(byDateThenId);
		const paid = sorted.filter(isPaid);
		const pending = sorted.filter(isPending);
		const proxy = paid.filter(isProxyPaid);
		return {
			owner: owner$1,
			rows: sorted,
			count: sorted.length,
			amount: sumAmount(sorted),
			paidCount: paid.length,
			paidAmt: sumAmount(paid),
			pendingCount: pending.length,
			pendingAmt: sumAmount(pending),
			proxyCount: proxy.length,
			proxyAmt: sumAmount(proxy)
		};
	}).sort((a, b) => b.paidAmt - a.paidAmt || b.pendingAmt - a.pendingAmt || a.owner.localeCompare(b.owner, "zh"));
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
const PRINT_CALIBER_NOTE_DETAIL = "明细清单：已填发放日期的按实际收款人计入已发；待发放也列入实际收款人名下，逐笔标注「已发 / 待发」，小计拆「已发小计 / 待发小计」；代发（收款人非本人）已计入实际收款人名下，小计单列「其中代发」。";
const PRINT_CALIBER_NOTE_SUMMARY = "汇总清单：已发 = 只计已填发放日期的记录，按实际收款人计入（含代发，单列「其中代发」）；待发放单列一组，不计入已发。";
function printCaliberNote(mode) {
	return mode === "detail" ? PRINT_CALIBER_NOTE_DETAIL : PRINT_CALIBER_NOTE_SUMMARY;
}
export { sectionTotals as _, isPaidSelf as a, ownerTotals as c, paymentsInRange as d, printCaliberNote as f, scopeRows as g, printTotals as h, isPaid as i, panelRows as l, printSummary as m, detailSections as n, isPending as o, printOwnerBuckets as p, filterPayments as r, isProxyPaid as s, PROXY_INLINE_LABEL as t, paymentSummary as u, sourceBuckets as v };
