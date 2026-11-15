import type { QueryMonth, QueryTotals } from "~/lib/query-data";
import { QUERY_PAYSLIP_WAGE_COLS, QUERY_PERSON_WAGE_COLS } from "~/lib/print-cols";
import { queryWageAdditions } from "~/lib/query-wage";
import { money } from "~/lib/utils";
import { WageAdjustmentHeader, WagePrintRemark, WageStandardCaption } from "./wage-calculation";

/** 每人/每月一张完整表：工资备注在 caption，列标题与金额相邻，续页重复表头。 */
export function WagePrintTable({ title, standardTitle, subjectLabel, subject, row, ambiguous = false, layout = "query", footer }: {
  title: string;
  standardTitle: string;
  subjectLabel: string;
  subject: string;
  row: QueryMonth;
  ambiguous?: boolean;
  layout?: "query" | "slip";
  footer?: { label: string; totals: QueryTotals };
}) {
  const cell = "border border-black px-1 py-1";
  const fields = ["subject", "days", "otHours", "base", "ot", "additions", "deduction", "pay", "remark"] as const;
  const labels = {
    subject: subjectLabel, days: "出勤天数", otHours: "加班小时", base: "出勤工资",
    additions: <WageAdjustmentHeader kind="additions" />, deduction: <WageAdjustmentHeader kind="deduction" />,
    ot: "加班工资", pay: "应发", remark: "备注",
  };
  function amountRow(values: QueryTotals, label: string, remark = "", uncertain = false, total = false) {
    return <tr className={total ? "font-medium" : "query-wage-amount"}>{fields.map((field) => {
      const numeric = field !== "subject" && field !== "remark";
      const value = field === "subject" ? label : field === "remark"
        ? uncertain ? "姓名重复，历史记录待核对" : <WagePrintRemark remark={remark} totals={values} />
        : uncertain ? "—" : field === "days" || field === "otHours" ? values[field]
        : money(field === "additions" ? queryWageAdditions(values) : values[field]);
      return <td key={field} className={`${cell}${numeric ? " query-number" : ""}${field === "pay" ? " font-medium" : ""}`}>{value}</td>;
    })}</tr>;
  }
  return <table className="query-wage-table w-full table-fixed border-collapse text-left text-xs">
    <WageStandardCaption title={standardTitle} calculation={ambiguous ? undefined : row.calculation} />
    <colgroup>{(layout === "slip" ? QUERY_PAYSLIP_WAGE_COLS : QUERY_PERSON_WAGE_COLS).map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
    <thead>
      <tr><th className={`${cell} text-left`} colSpan={9}>{title}</th></tr>
      <tr className="query-wage-columns">{fields.map((field) => <th key={field} scope="col" className={cell}>{labels[field]}</th>)}</tr>
    </thead>
    <tbody>{amountRow(row, subject, row.remark, ambiguous)}</tbody>
    {footer ? <tfoot>{amountRow(footer.totals, footer.label, "", false, true)}</tfoot> : null}
  </table>;
}
