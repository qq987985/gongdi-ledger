import { N as hasContent, O as monthStatus, T as derivedYears, f as round2, j as paymentsInYear, l as getWageAt, u as monthPay } from "./contracts-EeNrOMGH.js";
import { n as groupBuckets } from "./buckets-Bkm2eutI.js";
import { a as isPaidSelf, o as isPending, s as isProxyPaid } from "./payments-stats-D_7OI5J5.js";
const NO_ATTENDANCE_REMARK = "本年无考勤记录";
function fallbackPayYear(s) {
	const y = Number(s.year);
	if (y >= 2e3 && y <= 2100) return y;
	const years = derivedYears(s);
	return years[years.length - 1] ?? (/* @__PURE__ */ new Date()).getFullYear();
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
	const selfPay = yearPay.filter(isPaidSelf);
	const rows = [];
	for (const person of people) {
		const months = personMonths(person, attendance, year);
		const yearPayAmt = months.reduce((s, m) => s + m.pay, 0);
		const yearDays = months.reduce((s, m) => s + m.days, 0);
		const yearOt = months.reduce((s, m) => s + m.otHours, 0);
		const paid = selfPay.filter((x) => (x.owner || "").trim() === person.name).reduce((s, x) => s + x.amount, 0);
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
			worked,
			noAttendance: false,
			remark: ""
		});
	}
	const rowNames = new Set(rows.map((r) => r.person.name));
	const orphans = /* @__PURE__ */ new Map();
	for (const p of selfPay) {
		const name = (p.owner || "").trim();
		if (rowNames.has(name)) continue;
		orphans.set(name, (orphans.get(name) || 0) + (p.amount || 0));
	}
	const zeroMonths = () => Array.from({ length: 12 }, () => ({
		days: 0,
		pay: 0,
		otHours: 0,
		allowance: 0,
		deduction: 0
	}));
	const orphanRows = [...orphans.entries()].map(([name, amount]) => {
		const paid = round2(amount);
		return {
			person: people.find((p) => p.name === name) ?? {
				id: `pay-only:${name}`,
				name,
				team: "",
				personNo: "",
				idCard: "",
				gender: "",
				age: 0,
				birthday: "",
				phone: "",
				dailyWage: 0,
				monthWage: 0,
				payType: "day",
				otRule: "",
				mealAllowance: 0,
				bank: "",
				cardNo: "",
				address: "",
				idIssuer: "",
				idValidFrom: "",
				idValidTo: "",
				remark: ""
			},
			months: zeroMonths(),
			yearPayAmt: 0,
			yearDays: 0,
			yearOt: 0,
			paid,
			unpaid: -paid,
			worked: false,
			noAttendance: true,
			remark: NO_ATTENDANCE_REMARK
		};
	}).sort((a, b) => b.paid - a.paid || a.person.name.localeCompare(b.person.name, "zh"));
	rows.push(...orphanRows);
	const rowsPaidSum = round2(rows.reduce((s, r) => s + r.paid, 0));
	const paidTotal = round2(selfPay.reduce((s, p) => s + p.amount, 0));
	const offRows = selfPay.filter((p) => !rows.some((r) => r.person.name === (p.owner || "").trim()));
	const proxyRows = yearPay.filter(isProxyPaid);
	return {
		rows,
		should: round2(rows.reduce((s, r) => s + r.yearPayAmt, 0)),
		paid: paidTotal,
		rowsPaidSum,
		offRowsPaid: {
			count: offRows.length,
			amount: round2(offRows.reduce((s, p) => s + p.amount, 0))
		},
		proxyAmt: round2(proxyRows.reduce((s, p) => s + p.amount, 0)),
		proxyCount: proxyRows.length,
		pendingAmt: round2(yearPay.filter(isPending).reduce((s, p) => s + p.amount, 0)),
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
