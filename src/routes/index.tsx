import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "~/lib/store";
import { derivedYears, monthStatus } from "~/lib/dates";
import { monthPay } from "~/lib/wage";
import { paymentsInYear } from "~/lib/dates";
import { overAgeLabel } from "~/lib/idcard";
import { contractRollup } from "~/lib/contracts";
import { money } from "~/lib/utils";

function Home() {
  const store = useApp();
  const { year, people, attendance, payments, contracts, contractEntries, setYear } = store;
  const years = derivedYears(store);
  const fallbackYear = years[0] || year;
  const yearAtt = attendance.filter((a) => a.year === year);
  const yearPays = paymentsInYear(payments, year, fallbackYear);
  const map = Object.fromEntries(people.map((p) => [p.name, p]));
  let should = 0;
  for (const a of yearAtt) {
    const p = map[a.name];
    should += monthPay(a, p).pay;
  }
  const paid = yearPays.filter((p) => p.date).reduce((s, p) => s + p.amount, 0);
  const pendingAmt = yearPays.filter((p) => !p.date).reduce((s, p) => s + p.amount, 0);
  const proxy = yearPays.filter((p) => p.date && p.owner !== p.receiver).length;
  const teams = [...new Set(people.map((p) => p.team).filter(Boolean))];
  const over = people.filter((p) => overAgeLabel(p.age, p.gender) === "超龄").length;
  const noWage = people.filter((p) => p.payType === "month" && !p.monthWage).length;
  const monthsFilled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, year, i + 1).filled > 0).filter(Boolean).length;
  const contractPay = contracts
    .filter((c) => c.year === year)
    .reduce((s, c) => s + contractRollup(c, contractEntries).payable, 0);
  const teamRows = teams.map((t) => ({ team: t, count: people.filter((p) => p.team === t).length }));
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium tracking-widest text-muted">{year} 年</p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">台账</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {people.length
            ? `当前工作年 ${year}。人员共用；考勤、发放、合同都按年查看。要加新年到「月度考勤」里点新增年。`
            : "还没有人员。到各模块下载模板导入，或到「导入导出」导入整本。"}
        </p>
      </header>
      <section className="flex flex-wrap items-center gap-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            className={`h-9 rounded-sm px-3 text-sm transition-colors duration-150 ${y === year ? "bg-accent text-accent-fg" : "border border-line bg-surface text-muted hover:text-ink"}`}
          >
            {y}年
          </button>
        ))}
      </section>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="在册人员" value={String(people.length)} hint={`${teams.length} 个班组 · 各年共用`} />
        <Stat label="已录月份" value={`${monthsFilled} / 12`} hint={`${year} 年`} />
        <Stat label="应发合计" value={`¥${money(should)}`} hint={noWage ? `${noWage} 人未设工资` : "已按规则计算"} />
        <Stat
          label="已发放"
          value={`¥${money(paid)}`}
          hint={pendingAmt ? `待发放 ¥${money(pendingAmt)} · 代收 ${proxy} 笔` : `代收 ${proxy} 笔 · 记在实际收款人头上`}
        />
        <Stat label={`${year} 年应收`} value={`¥${money(contractPay)}`} hint="含税报量 × 合同比例" />
      </section>
      {noWage > 0 ? (
        <div className="rounded-lg border border-line bg-warn-bg px-4 py-3 text-sm text-warn">
          还有 {noWage} 人没设工资，会算成 0。到「人员」填写，或在「设置」里批量设置。加班选按小时或按折算。
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-sm font-semibold">班组</h2>
          <ul className="mt-4 space-y-2">
            {teamRows.map((r) => (
              <li key={r.team} className="flex items-center justify-between text-sm">
                <span>{r.team}</span>
                <span className="tabular-nums text-muted">{r.count} 人</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-sm font-semibold">快捷入口</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Quick to="/people" title="人员管理" desc="增减人员、设工资规则、上传证件照" />
            <Quick to="/attendance" title="月度考勤" desc="12 个月格子，点进去录入" />
            <Quick to="/payments" title="发放记录" desc="实际收款人入账，收款人只是代收" />
            <Quick to="/contracts" title="合同管理" desc="报量、开票、收款分开记，保证金独立" />
            <Quick to="/expenses" title="报销单" desc="未报销可勾选打印，现金不用传凭证" />
            <Quick to="/import" title="导入导出" desc="按年导出整本 Excel，WPS 可打开" />
          </div>
          {over > 0 ? <p className="mt-4 text-xs text-warn">超龄提醒：{over} 人（男≥55 / 女≥45）</p> : null}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-subtle">{hint}</div>
    </div>
  );
}

function Quick({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to as any}
      className="rounded-md border border-line bg-bg-elevated p-3 transition-colors duration-150 hover:border-accent"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted">{desc}</div>
    </Link>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
