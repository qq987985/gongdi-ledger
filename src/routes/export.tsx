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

const EXPORT_ITEMS = [
  { kind: "ledger-export", title: "总台账", desc: "人员、各月考勤、发放、报销合在一本。" },
  { kind: "attendance-export", title: "考勤表", desc: "按月列出出勤、加班、补助、扣款、餐补。" },
  { kind: "payment-export", title: "发放记录", desc: "实际收款人、金额、日期、发放方、收款人。" },
  { kind: "expense-export", title: "报销单", desc: "项目、金额、支付方式、报销人、打款账户。" },
  { kind: "contract-export", title: "合同表", desc: "报量、开票、收款，含应收应付明细。" },
  { kind: "people-export", title: "人员名单", desc: "不按年份筛，全部人员信息。" },
];

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
    "btn inline-flex cursor-pointer items-center rounded-sm border border-line bg-surface text-xs hover:bg-accent-soft";
  return (
    <Need perm="export.use">
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-2xl font-semibold">导出</h1>
          <p className="mt-1 text-sm text-muted">
            按台账里实际有的字段全部写出。先选范围，再点下面的项导出。
          </p>
        </header>
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">导出范围</h2>
          <p className="mt-1 text-sm text-muted">先选全部年份、某一年或起止月份，下面每一项都按这个范围导出。</p>
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
                className={`chip ${scope === k ? "on" : ""}`}
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
        </section>
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">导出内容</h2>
          <p className="mt-1 text-sm text-muted">按台账里实际有的字段全部写出。</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {EXPORT_ITEMS.map((it) => (
              <div key={it.kind} className="rounded-xl border border-line bg-surface p-5">
                <h3 className="font-semibold">{it.title}</h3>
                <p className="mt-1 text-sm text-muted">{it.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a className={outline} href={href(it.kind)}>
                    导出
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/export")({
  component: ExportPage,
});
