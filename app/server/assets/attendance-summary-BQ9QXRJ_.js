import { a as round2, g as paymentsInYear, n as getWageAt, p as monthStatus, r as monthPay, u as derivedYears, v as hasContent } from "./wage-BVBIWt51.js";
import { h as ownerKey, m as nameKey } from "./contracts-FU2UPdFm.js";
import { n as groupBuckets } from "./buckets-DTFLM3XC.js";
import { i as isPaid, o as isPending, s as isProxyPaid } from "./payments-stats-DhA_CEas.js";
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
	const mine = attendance.filter((a) => a.year === year && nameKey(a.name) === nameKey(person.name));
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
	const paidRows = yearPay.filter(isPaid);
	const attendanceByName = /* @__PURE__ */ new Map();
	for (const a of attendance) {
		if (a.year !== year) continue;
		const key = nameKey(a.name);
		const bucket = attendanceByName.get(key);
		if (bucket) bucket.push(a);
		else attendanceByName.set(key, [a]);
	}
	const paidByName = /* @__PURE__ */ new Map();
	for (const p of paidRows) {
		const key = ownerKey(p);
		paidByName.set(key, (paidByName.get(key) ?? 0) + p.amount);
	}
	const peopleByName = /* @__PURE__ */ new Map();
	for (const p of people) {
		const key = nameKey(p.name);
		if (!peopleByName.has(key)) peopleByName.set(key, p);
	}
	const rows = [];
	for (const person of people) {
		const key = nameKey(person.name);
		const mine = attendanceByName.get(key) ?? [];
		const worked = mine.some(hasContent);
		if (!worked) continue;
		const months = personMonths(person, mine, year);
		const yearPayAmt = months.reduce((s, m) => s + m.pay, 0);
		const yearDays = months.reduce((s, m) => s + m.days, 0);
		const yearOt = months.reduce((s, m) => s + m.otHours, 0);
		const paid = paidByName.get(key) ?? 0;
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
	const rowNames = new Set(rows.map((r) => nameKey(r.person.name)));
	const orphans = /* @__PURE__ */ new Map();
	for (const p of paidRows) {
		const name = ownerKey(p);
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
			person: peopleByName.get(name) ?? {
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
	const paidTotal = round2(paidRows.reduce((s, p) => s + p.amount, 0));
	const includedNames = new Set(rows.map((r) => nameKey(r.person.name)));
	const offRows = paidRows.filter((p) => !includedNames.has(ownerKey(p)));
	const proxyRows = paidRows.filter(isProxyPaid);
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
	const counts = /* @__PURE__ */ new Map();
	for (const p of people) {
		const key = String(p.team ?? "").trim();
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return groupBuckets(people.map((p) => p.team), "未分班组").map((b) => ({
		team: b.label,
		count: counts.get(b.value) ?? 0
	})).sort((a, b) => b.count - a.count || a.team.localeCompare(b.team, "zh"));
}
export { summarizeYear as n, teamRows as r, fallbackPayYear as t };
