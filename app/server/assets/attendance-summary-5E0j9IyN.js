import { N as hasContent, O as monthStatus, T as derivedYears, j as paymentsInYear, l as getWageAt, u as monthPay } from "./contracts-EeNrOMGH.js";
import { n as groupBuckets } from "./buckets-Bkm2eutI.js";
function fallbackPayYear(s) {
	return derivedYears(s)[0] ?? (/* @__PURE__ */ new Date()).getFullYear();
}
function filledMonthsOf(attendance, year) {
	return Array.from({ length: 12 }, (_, i) => monthStatus(attendance, year, i + 1).filled > 0).filter(Boolean).length;
}
function personMonths(person, attendance, year) {
	const mine = attendance.filter((a) => a.year === year && a.name === person.name);
	return Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		const rows = mine.filter((a) => a.month === month);
		if (!rows.length) return {
			days: 0,
			pay: 0,
			otHours: 0,
			allowance: 0,
			deduction: 0
		};
		const wage = getWageAt(person, year, month);
		return rows.reduce((acc, a) => {
			const calc = monthPay(a, wage);
			return {
				days: acc.days + calc.days,
				pay: acc.pay + calc.pay,
				otHours: acc.otHours + calc.otHours,
				allowance: acc.allowance + calc.allowance,
				deduction: acc.deduction + calc.deduction
			};
		}, {
			days: 0,
			pay: 0,
			otHours: 0,
			allowance: 0,
			deduction: 0
		});
	});
}
function summarizeYear(args) {
	const { people, attendance, payments, year, fallbackYear } = args;
	const yearPay = paymentsInYear(payments, year, fallbackYear);
	const rows = [];
	for (const person of people) {
		const months = personMonths(person, attendance, year);
		const yearPayAmt = months.reduce((s, m) => s + m.pay, 0);
		const yearDays = months.reduce((s, m) => s + m.days, 0);
		const yearOt = months.reduce((s, m) => s + m.otHours, 0);
		const paid = yearPay.filter((x) => x.owner === person.name && x.date).reduce((s, x) => s + x.amount, 0);
		const worked = attendance.some((a) => a.year === year && a.name === person.name && hasContent(a));
		if (!worked) continue;
		rows.push({
			person,
			months,
			yearPayAmt,
			yearDays,
			yearOt,
			paid,
			unpaid: yearPayAmt - paid,
			worked
		});
	}
	const rowsPaidSum = rows.reduce((s, r) => s + r.paid, 0);
	const paidRows = yearPay.filter((p) => p.date);
	const paidTotal = paidRows.reduce((s, p) => s + p.amount, 0);
	const offRows = paidRows.filter((p) => !rows.some((r) => r.person.name === p.owner));
	return {
		rows,
		should: rows.reduce((s, r) => s + r.yearPayAmt, 0),
		paid: paidTotal,
		rowsPaidSum,
		offRowsPaid: {
			count: offRows.length,
			amount: offRows.reduce((s, p) => s + p.amount, 0)
		},
		pendingAmt: yearPay.filter((p) => !p.date).reduce((s, p) => s + p.amount, 0),
		proxyCount: yearPay.filter((p) => p.date && p.owner !== p.receiver).length,
		filledMonths: filledMonthsOf(attendance, year)
	};
}
function teamRows(people) {
	return groupBuckets(people.map((p) => p.team), "未分班组").map((b) => ({
		team: b.label,
		count: people.filter((p) => String(p.team ?? "").trim() === b.value).length
	})).sort((a, b) => b.count - a.count || a.team.localeCompare(b.team, "zh"));
}
export { summarizeYear as n, teamRows as r, fallbackPayYear as t };
