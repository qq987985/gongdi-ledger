import { createFileRoute } from "@tanstack/react-router";
import {
  buildContractWorkbook,
  buildExpenseWorkbook,
  buildFullWorkbook,
  buildPaymentWorkbook,
  buildPeopleWorkbook,
  contractTemplateWb,
  expenseTemplateWb,
  attendanceTemplateWb,
  paymentTemplateWb,
  peopleTemplateWb,
} from "~/lib/excel";
import { hasWork } from "~/lib/wage";
import { writeCenteredXlsx } from "~/lib/xlsx-center";
import { persistOn, readLedger } from "~/lib/nas-fs.server";
import { withTenant } from "~/lib/accounts.server";
import { parseDateYmd, dateYear, nextYear } from "~/lib/dates";

function ymKey(y: number, m: number): number {
  return y * 12 + m;
}

function ymdParts(value: string | number) {
  const t = parseDateYmd(value);
  if (!t) return null;
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

function parseExportRange(url: URL, fallbackYear: number) {
  const sp = url.searchParams;
  const scopeRaw = (sp.get("scope") || "").trim();
  const yearRaw = sp.get("year");
  const yearNum = Number(yearRaw || fallbackYear || 2026);
  const year = yearNum >= 2e3 && yearNum <= 2100 ? yearNum : fallbackYear || 2026;
  const yearMode = () => ({ scope: "year", year, fromY: year, fromM: 1, toY: year, toM: 12, lo: ymKey(year, 1), hi: ymKey(year, 12), stamp: `${year}年` });
  const allMode = () => ({ scope: "all", year, fromY: 2e3, fromM: 1, toY: 2100, toM: 12, lo: 0, hi: 99999, stamp: "全部" });
  if (scopeRaw === "range") {
    let fromY = Number(sp.get("fromY") || year);
    let fromM = Number(sp.get("fromM") || 1);
    let toY = Number(sp.get("toY") || year);
    let toM = Number(sp.get("toM") || 12);
    if (!(fromY >= 2e3 && fromY <= 2100)) fromY = year;
    if (!(toY >= 2e3 && toY <= 2100)) toY = year;
    if (!(fromM >= 1 && fromM <= 12)) fromM = 1;
    if (!(toM >= 1 && toM <= 12)) toM = 12;
    let lo = ymKey(fromY, fromM);
    let hi = ymKey(toY, toM);
    if (lo > hi) {
      [lo, hi] = [hi, lo];
      [fromY, fromM, toY, toM] = [toY, toM, fromY, fromM];
    }
    const stamp = fromY === toY && fromM === toM ? `${fromY}年${fromM}月` : `${fromY}年${fromM}月至${toY}年${toM}月`;
    return { scope: "range", year: fromY, fromY, fromM, toY, toM, lo, hi, stamp };
  }
  if (scopeRaw === "all") return allMode();
  if (scopeRaw === "year") return yearMode();
  if (yearRaw != null && yearRaw !== "") return yearMode();
  return allMode();
}

function monthsOfRange(range: any) {
  if (range.scope === "year") return Array.from({ length: 12 }, (_, i) => ({ year: range.year, month: i + 1 }));
  const out: { year: number; month: number }[] = [];
  for (let k = range.lo; k <= range.hi; k++) {
    const year = Math.floor((k - 1) / 12);
    const month = ((k - 1) % 12) + 1;
    out.push({ year, month });
  }
  return out;
}

function monthsFromAttendance(attendance: any[]) {
  const seen = new Set<number>();
  const out: { year: number; month: number; k: number }[] = [];
  for (const a of attendance || []) {
    if (!hasWork(a)) continue;
    const y = a.year;
    const m = a.month;
    if (!(y >= 2e3 && y <= 2100) || !(m >= 1 && m <= 12)) continue;
    const k = ymKey(y, m);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ year: y, month: m, k });
  }
  out.sort((a, b) => a.k - b.k);
  return out.map(({ year, month }) => ({ year, month }));
}

function inExportRange(y: number, m: number, range: any) {
  if (range.scope === "all") return true;
  const k = ymKey(y, m);
  return k >= range.lo && k <= range.hi;
}

function filterAttendanceExport(attendance: any[], range: any) {
  if (range.scope === "all") return attendance || [];
  return (attendance || []).filter((a) => inExportRange(a.year, a.month, range));
}

function filterPaymentsExport(payments: any[], range: any) {
  if (range.scope === "all") return payments || [];
  return (payments || []).filter((p: any) => {
    if (!p.date) return true;
    const parts = ymdParts(p.date);
    if (!parts) {
      const y = dateYear(p.date);
      if (y == null) return true;
      return y >= range.fromY && y <= range.toY;
    }
    return inExportRange(parts.year, parts.month, range);
  });
}

function filterExpensesExport(expenses: any[], range: any) {
  if (range.scope === "all") return expenses || [];
  return (expenses || []).filter((e: any) => {
    const parts = ymdParts(e.date) || ymdParts(e.period) || ymdParts(e.payoutDate);
    if (parts) return inExportRange(parts.year, parts.month, range);
    const y = Number(e.year) || dateYear(e.date) || dateYear(e.period);
    if (y >= 2e3) return y >= range.fromY && y <= range.toY;
    return true;
  });
}

function filterContractsExport(contracts: any[], entries: any[], range: any) {
  if (range.scope === "all") return { contracts: contracts || [], entries: entries || [] };
  const filtered = (contracts || []).filter((c) => {
    const y = Number(c.year);
    if (!(y >= 2e3)) return true;
    return y >= range.fromY && y <= range.toY;
  });
  const ids = new Set(filtered.map((c) => c.id));
  return { contracts: filtered, entries: (entries || []).filter((e) => ids.has(e.contractId)) };
}

function fileStamp(range: any, kind: string) {
  const labels: Record<string, string> = { full: "总台账", att: "考勤", pay: "发放记录", exp: "报销单", con: "合同明细", people: "人员名单" };
  const label = labels[kind] || "导出";
  if (kind === "people") return "人员名单.xlsx";
  if (range.scope === "all") return `${label}.xlsx`;
  return `${range.stamp}${label}.xlsx`;
}

async function xlsxFile(wb: any, filename: string) {
  const data = await writeCenteredXlsx(wb);
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_");
  return new Response(data, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/file/$kind")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const year = Number(url.searchParams.get("year") || "2026") || 2026;
        const kind = params.kind;
        if (kind === "people-template") return xlsxFile(peopleTemplateWb(), "人员导入模板.xlsx");
        if (kind === "attendance-template") return xlsxFile(attendanceTemplateWb(year), `${year}年考勤导入模板.xlsx`);
        if (kind === "payment-template") return xlsxFile(paymentTemplateWb(), "发放记录导入模板.xlsx");
        if (kind === "expense-template") return xlsxFile(expenseTemplateWb(), "报销单导入模板.xlsx");
        if (kind === "contract-template") return xlsxFile(contractTemplateWb(), "合同导入模板.xlsx");
        if (
          kind === "contract-export" ||
          kind === "export" ||
          kind === "payment-export" ||
          kind === "expense-export" ||
          kind === "people-export" ||
          kind === "attendance-export"
        ) {
          const run = async () => {
            const range = parseExportRange(url, year);
            const data = persistOn() ? await readLedger() : { empty: true };
            const rec = "empty" in data && data.empty ? {} : data;
            if (kind === "contract-export") {
              const { contracts, entries } = filterContractsExport(rec.contracts || [], rec.contractEntries || [], range);
              return xlsxFile(buildContractWorkbook({ contracts, entries }), fileStamp(range, "con"));
            }
            if (kind === "people-export") return xlsxFile(buildPeopleWorkbook(rec.people || []), fileStamp(range, "people"));
            const people = rec.people || [];
            const attendance = filterAttendanceExport(rec.attendance || [], range);
            const payments = filterPaymentsExport(rec.payments || [], range);
            const expenses = filterExpensesExport(rec.expenses || [], range);
            if (kind === "payment-export") return xlsxFile(buildPaymentWorkbook(payments), fileStamp(range, "pay"));
            if (kind === "expense-export") return xlsxFile(buildExpenseWorkbook(expenses), fileStamp(range, "exp"));
            let months = range.scope === "all" ? monthsFromAttendance(attendance) : monthsOfRange(range);
            if (!months.length) months = Array.from({ length: 12 }, (_, i) => ({ year: range.year, month: i + 1 }));
            const skip = kind === "attendance-export";
            return xlsxFile(
              buildFullWorkbook({ year: range.year, people, attendance, payments, expenses, months, skipPeople: skip, skipPay: skip, skipExp: skip }),
              fileStamp(range, skip ? "att" : "full"),
            );
          };
          if (persistOn()) return withTenant(request, run);
          return run();
        }
        return new Response("not found", { status: 404 });
      },
    },
  },
});
