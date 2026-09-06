import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "~/lib/store";
import { derivedYears, monthStatus, paymentsInYear } from "~/lib/dates";
import { monthPay, getWageAt } from "~/lib/wage";
import { overAgeLabel } from "~/lib/idcard";
import { contractRollup } from "~/lib/contracts";
import { money, cn } from "~/lib/utils";

function Home() {
  const store = useApp();
  const { year, people, attendance, payments, contracts, contractEntries, setYear } = store;
  const uiStyle = useApp((s) => s.uiStyle);
  const years = derivedYears(store);
  const fallbackYear = years[0] || year;
  const yearAtt = attendance.filter((a) => a.year === year);
  const yearPays = paymentsInYear(payments, year, fallbackYear);
  const map = Object.fromEntries(people.map((p) => [p.name, p]));
  let should = 0;
  for (const a of yearAtt) {
    const p = map[a.name];
    if (!p) continue; // 已删除人员不参与应发合计，与考勤汇总口径一致
    const wage = getWageAt(p, a.year, a.month);
    should += monthPay(a, wage).pay;
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

  return uiStyle === "classic" ? (
    <ClassicHome
      year={year}
      years={years}
      peopleCount={people.length}
      teamCount={teams.length}
      monthsFilled={monthsFilled}
      should={should}
      noWage={noWage}
      paid={paid}
      pendingAmt={pendingAmt}
      proxy={proxy}
      contractPay={contractPay}
      teamRows={teams
        .map((t) => ({ team: t, count: people.filter((p) => p.team === t).length }))
        .sort((a, b) => b.count - a.count)}
      over={over}
      onYear={setYear}
    />
  ) : (
    <NewHome
      year={year}
      years={years}
      peopleCount={people.length}
      teamCount={teams.length}
      monthsFilled={monthsFilled}
      should={should}
      noWage={noWage}
      paid={paid}
      pendingAmt={pendingAmt}
      proxy={proxy}
      contractPay={contractPay}
      maxTeam={Math.max(1, ...teams.map((t) => people.filter((p) => p.team === t).length))}
      teamRows={teams
        .map((t) => ({ team: t, count: people.filter((p) => p.team === t).length }))
        .sort((a, b) => b.count - a.count)}
      over={over}
      onYear={setYear}
    />
  );
}

type HomeProps = {
  year: number;
  years: number[];
  peopleCount: number;
  teamCount: number;
  monthsFilled: number;
  should: number;
  noWage: number;
  paid: number;
  pendingAmt: number;
  proxy: number;
  contractPay: number;
  over: number;
  teamRows: { team: string; count: number }[];
  maxTeam?: number;
  onYear: (y: number) => void;
};

/* ＝＝ 新版（仪表盘）总览 ＝＝ */
function NewHome(p: HomeProps) {
  const unavailable = p.monthsFilled < 12 ? `${12 - p.monthsFilled} 个月没录` : "全年录齐";
  const heroes = [
    { to: "/attendance", label: "📅 录入考勤" },
    { to: "/payments", label: "💰 新增发放" },
    { to: "/export", label: "⬇️ 导出台账" },
  ];
  return (
    <div className="space-y-5">
      <section className="hero-banner rounded-xl bg-gradient-to-r from-accent-strong via-accent to-violet-500 p-5 text-white shadow-panel">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold">{p.year} 年 · 总览</h1>
            <p className="mt-1 text-sm text-white/85">
              {p.peopleCount
                ? `在册 ${p.peopleCount} 人 · ${p.teamCount} 个班组 · ${unavailable}${p.pendingAmt ? ` · 待发放 ¥${money(p.pendingAmt)}` : ""}`
                : "还没有人员。到「导入」下载模板导入吧。"}
            </p>
          </div>
          <div className="min-w-0 flex-1" />
          <div className="flex flex-wrap gap-2">
            {heroes.map((h) => (
              <Link
                key={h.to}
                to={h.to as any}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-sm text-white transition-colors hover:bg-white/25"
              >
                {h.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {p.years.map((y) => (
          <button key={y} type="button" onClick={() => p.onYear(y)} className={cn("chip", y === p.year && "on")}>
            {y}年
          </button>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="在册人员" value={String(p.peopleCount)} hint={`${p.teamCount} 个班组 · 各年共用`} icon="👥" tone="bg-pink-100 text-pink-600" />
        <Kpi label="已录月份" value={`${p.monthsFilled} / 12`} hint={`${p.year} 年`} icon="📆" tone="bg-cyan-100 text-cyan-600" />
        <Kpi label="应发合计" value={`¥${money(p.should)}`} hint={p.noWage ? `${p.noWage} 人未设工资` : "已按规则计算"} icon="¥" tone="bg-green-100 text-green-600" />
        <Kpi label="已发放" value={`¥${money(p.paid)}`} hint={p.pendingAmt ? `待发 ¥${money(p.pendingAmt)} · 代收 ${p.proxy} 笔` : `代收 ${p.proxy} 笔`} icon="💸" tone="bg-orange-100 text-orange-600" />
        <Kpi label={`${p.year} 年应收`} value={`¥${money(p.contractPay)}`} hint="含税报量 × 合同比例" icon="📄" tone="bg-violet-100 text-violet-600" />
      </section>

      {p.noWage > 0 ? (
        <section className="rounded-xl border border-warn-bg bg-warn-bg px-4 py-3 text-sm text-warn">
          还有 {p.noWage} 人没设工资，会算成 0。到「人员」填写，或在「设置」里批量设置。加班选按小时或按折算。
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-sm font-semibold">班组</h2>
          <ul className="mt-4 space-y-3">
            {p.teamRows.map((r) => (
              <li key={r.team}>
                <div className="flex items-center justify-between text-sm">
                  <span>{r.team}</span>
                  <span className="tabular-nums text-muted">{r.count} 人</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-elevated">
                  <i className="block h-full rounded-full bg-accent" style={{ width: `${Math.round((r.count / (p.maxTeam || 1)) * 100)}%` }} />
                </div>
              </li>
            ))}
            {!p.teamRows.length ? <li className="text-sm text-muted">还没有班组。到「人员」给人员填班组。</li> : null}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel lg:col-span-2">
          <h2 className="text-sm font-semibold">快捷入口</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Quick to="/people" title="人员管理" desc="增减人员、设工资规则、上传证件照" />
            <Quick to="/attendance" title="月度考勤" desc="12 个月格子，点进去录入" />
            <Quick to="/payments" title="发放记录" desc="实际收款人入账，收款人只是代收" />
            <Quick to="/contracts" title="合同管理" desc="报量、开票、收款分开记，保证金独立" />
            <Quick to="/expenses" title="报销单" desc="未报销可勾选打印，现金不用传凭证" />
            <Quick to="/export" title="导出" desc="按年导出整本 Excel，WPS 可打开" />
          </div>
          {p.over > 0 ? (
            <p className="mt-4 rounded-lg bg-warn-bg px-3 py-2 text-xs text-warn">超龄提醒：{p.over} 人（男≥55 / 女≥45）</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

/* ＝＝ 经典（原版）总览 ＝＝ */
function ClassicHome(p: HomeProps) {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium tracking-widest text-muted">{p.year} 年</p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">台账</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {p.peopleCount
            ? `当前工作年 ${p.year}。人员共用；考勤、发放、合同都按年查看。要加新年到「月度考勤」里点新增年。`
            : "还没有人员。到各模块下载模板导入，或到「导入」导入整本。"}
        </p>
      </header>
      <section className="flex flex-wrap items-center gap-2">
        {p.years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => p.onYear(y)}
            className={`h-9 rounded-sm px-3 text-sm transition-colors duration-150 ${y === p.year ? "bg-accent text-accent-fg" : "border border-line bg-surface text-muted hover:text-ink"}`}
          >
            {y}年
          </button>
        ))}
      </section>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="在册人员" value={String(p.peopleCount)} hint={`${p.teamCount} 个班组 · 各年共用`} />
        <Stat label="已录月份" value={`${p.monthsFilled} / 12`} hint={`${p.year} 年`} />
        <Stat label="应发合计" value={`¥${money(p.should)}`} hint={p.noWage ? `${p.noWage} 人未设工资` : "已按规则计算"} />
        <Stat label="已发放" value={`¥${money(p.paid)}`} hint={p.pendingAmt ? `待发放 ¥${money(p.pendingAmt)} · 代收 ${p.proxy} 笔` : `代收 ${p.proxy} 笔 · 记在实际收款人头上`} />
      </section>
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Stat label={`${p.year} 年应收`} value={`¥${money(p.contractPay)}`} hint="含税报量 × 合同比例" />
      </section>
      {p.noWage > 0 ? (
        <div className="rounded-lg border border-line bg-warn-bg px-4 py-3 text-sm text-warn">
          还有 {p.noWage} 人没设工资，会算成 0。到「人员」填写，或在「设置」里批量设置。加班选按小时或按折算。
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-sm font-semibold">班组</h2>
          <ul className="mt-4 space-y-2">
            {p.teamRows.map((r) => (
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
            <Quick to="/export" title="导出" desc="按年导出整本 Excel，WPS 可打开" />
          </div>
          {p.over > 0 ? <p className="mt-4 text-xs text-warn">超龄提醒：{p.over} 人（男≥55 / 女≥45）</p> : null}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, icon, tone }: { label: string; value: string; hint: string; icon: string; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm", tone)}>{icon}</span>
      </div>
      <div className="mt-2 font-display text-xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-subtle">{hint}</div>
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
      className="rounded-xl border border-line bg-bg-elevated p-3 transition-colors duration-150 hover:border-accent hover:bg-accent-soft"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-muted">{desc}</div>
    </Link>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
