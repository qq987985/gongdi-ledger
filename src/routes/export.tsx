import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Need } from "~/components/can";
import { YmPick } from "~/components/ym-pick";
import { useApp } from "~/lib/store";
import { derivedYears } from "~/lib/dates";

function exportHref(kind: string, scope: string, year: number, fromY: number, fromM: number, toY: number, toM: number) {
  const p = new URLSearchParams();
  p.set("scope", scope);
  if (scope === "year") p.set("year", String(year));
  if (scope === "range") {
    p.set("fromY", String(fromY));
    p.set("fromM", String(fromM));
    p.set("toY", String(toY));
    p.set("toM", String(toM));
  }
  const q = p.toString();
  return `/api/file/${kind}${q ? `?${q}` : ""}`;
}

function ExportPage() {
  const store = useApp();
  const years = derivedYears(store);
  const now = new Date();
  const [scope, setScope] = React.useState("year");
  const [year, setYear] = React.useState(store.year);
  const [fromY, setFromY] = React.useState(store.year);
  const [fromM, setFromM] = React.useState(1);
  const [toY, setToY] = React.useState(store.year);
  const [toM, setToM] = React.useState(store.year === now.getFullYear() ? now.getMonth() + 1 : 12);
  const yearList = years.includes(year) ? years : [...years, year].sort((a, b) => a - b);
  const rangeText =
    scope === "all"
      ? "全部年份"
      : scope === "year"
        ? `${year}年`
        : fromY === toY && fromM === toM
          ? `${fromY}年${fromM}月`
          : `${fromY}年${fromM}月至${toY}年${toM}月`;
  const href = (kind: string) => exportHref(kind, scope, year, fromY, fromM, toY, toM);
  const outline =
    "btn inline-flex items-center rounded-sm border border-line-strong bg-surface text-xs hover:bg-accent-soft";
  return (
    <Need perm="export.use">
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-2xl font-semibold">导出</h1>
          <p className="mt-1 text-sm text-muted">
            按台账里实际有的字段全部写出。先选范围，再点要导出的项。总台账含人员、各月考勤、发放、报销；合同单独一份；人员名单不按年份筛。
          </p>
        </header>
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">导出范围</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["all", "全部年份"],
              ["year", "按年"],
              ["range", "按区间"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setScope(k)}
                className={`h-11 rounded-full border px-3 text-sm ${scope === k ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {scope === "year" ? (
            <div className="mt-3">
              <select className="field-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearList.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </select>
            </div>
          ) : scope === "range" ? (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <YmPick label="从" years={yearList} y={fromY} m={fromM} onY={setFromY} onM={setFromM} />
              <span className="pb-2 text-sm text-muted">到</span>
              <YmPick label="到" years={yearList} y={toY} m={toM} onY={setToY} onM={setToM} />
            </div>
          ) : null}
          <p className="mt-3 text-sm text-muted">导出范围：{rangeText}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a className={outline} href={href("ledger-export")}>
              导出总台账
            </a>
            <a className={outline} href={href("attendance-export")}>
              导出考勤表
            </a>
            <a className={outline} href={href("payment-export")}>
              导出发放记录
            </a>
            <a className={outline} href={href("expense-export")}>
              导出一键报销
            </a>
            <a className={outline} href={href("contract-export")}>
              导出合同表
            </a>
            <a className={outline} href={href("people-export")}>
              导出人员名单
            </a>
          </div>
        </section>
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/export")({
  component: ExportPage,
});
