import { r as contractRollup } from "./contracts-CNGvTFF_.js";
function sumContractRollups(list, entries) {
	return list.reduce((acc, c) => {
		const r = contractRollup(c, entries);
		acc.amount += c.contractAmount || 0;
		acc.report += r.report;
		acc.reportIncl += r.reportIncl;
		acc.reportExcl += r.reportExcl;
		acc.invoice += r.invoice;
		acc.invoiceExcl += r.invoiceExcl;
		acc.receipt += r.receipt;
		acc.workerPay += r.workerPay;
		acc.subPay += r.subPay;
		acc.remain += r.remain;
		acc.payable += r.payable;
		acc.dueRemain += r.dueRemain;
		return acc;
	}, {
		amount: 0,
		report: 0,
		reportIncl: 0,
		reportExcl: 0,
		invoice: 0,
		invoiceExcl: 0,
		receipt: 0,
		workerPay: 0,
		subPay: 0,
		remain: 0,
		payable: 0,
		dueRemain: 0
	});
}
function contractPayable(list, entries) {
	return list.reduce((s, c) => s + contractRollup(c, entries).payable, 0);
}
export { sumContractRollups as n, contractPayable as t };
