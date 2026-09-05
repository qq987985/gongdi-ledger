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
  const years = derivedYears(store);
  const fallbackYear = years[0] || year;
  const yearAtt = attendance.filter((a) => a.year === year);
  const yearPays = paymentsInYear(payments, year, fallbackYear);
  const map = Object.fromEntries(people.map((p) => [p.name, p]));
  let should = 0;
  let otSum = 0;
  let allowanceSum = 0;
  let mealSum = 0;
  let deductionSum = 0;
  for (const a of yearAtt) {
    const p = map[a.name];
    if (!p) continue; // 已删除人员不参与应发合计，与考勤汇总口径一致
    const wage = getWageAt(p, a.year, a.month);
    const pay = monthPay(a, wage);
    should += pay.pay;
    otSum += pay.ot;
    allowanceSum += a.allowance || 0;
    mealSum += pay.meal || 0;
    deductionSum += a.deduction || 0;
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
  const teamRows = teams
    .map((t) => ({ team: t, count: people.filter((p) => p.team === t).length }))
    .sort((a, b) => b.count - a.count);
  const maxTeam = Math.max(1, ...teamRows.map((r) => r.count));

  // 月度应发 / 已发（折线图）
  const monthEarn = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    let s = 0;
    for (const a of yearAtt.filter((x) => x.month === m)) {
      const p = map[a.name];
      if (!p) continue;
      s += monthPay(a, getWageAt(p, a.year, a.month)).pay;
    }
    return s;
  });
  const monthPaid = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return yearPays.filter((p) => p.date && Number(p.date.slice(5, 7)) === m).reduce((s, p) => s + p.amount, 0);
  });
  const baseSum = Math.max(0, should - otSum - allowanceSum - mealSum + deductionSum);

  const unavailable = monthsFilled < 12 ? `${12 - monthsFilled} 个月没录` : "全年录齐";
  const heroes = [
    { to: "/attendance", label: "📅 录入考勤" },
    { to: "/payments", label: "💰 新增发放" },
    { to: "/export", label: "⬇️ 导出台账" },
  ];
  return (
    <div className="space-y-5">
      {/* 渐变横幅 */}
      <section className="rounded-xl bg-gradient-to-r from-accent-strong via-accent to-violet-500 p-5 text-white shadow-panel">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold">{year} 年 · 总览</h1>
            <p className="mt-1 text-sm text-white/85">
              {people.length ? `在册 ${people.length} 人 · ${teams.length} 个班组 · ${unavailable}${pendingAmt ? ` · 待发放 ¥${money(pendingAmt)}` : ""}` : "还没有人员。到「导入」下载模板导入吧。"}
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

      {/* 年份切换 */}
      <section className="flex flex-wrap items-center gap-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            className={cn("chip", y === year && "on")}
          >
            {y}年
          </button>
        ))}
      </section>

      {/* KPI 卡 */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="在册人员" value={String(people.length)} hint={`${teams.length} 个班组 · 各年共用`} icon="👥" tone="bg-pink-100 text-pink-600" />
        <Kpi label="已录月份" value={`${monthsFilled} / 12`} hint={`${year} 年`} icon="📆" tone="bg-cyan-100 text-cyan-600" />
        <Kpi label="应发合计" value={`¥${money(should)}`} hint={noWage ? `${noWage} 人未设工资` : "已按规则计算"} icon="¥" tone="bg-green-100 text-green-600" />
        <Kpi label="已发放" value={`¥${money(paid)}`} hint={pendingAmt ? `待发 ¥${money(pendingAmt)} · 代收 ${proxy} 笔` : `代收 ${proxy} 笔`} icon="💸" tone="bg-orange-100 text-orange-600" />
        <Kpi label={`${year} 年应收`} value={`¥${money(contractPay)}`} hint="含税报量 × 合同比例" icon="📄" tone="bg-violet-100 text-violet-600" />
      </section>

      {noWage > 0 ? (
        <section className="rounded-xl border border-warn-bg bg-warn-bg px-4 py-3 text-sm text-warn">
          还有 {noWage} 人没设工资，会算成 0。到「人员」填写，或在「设置」里批量设置。加班选按小时或按折算。
        </section>
      ) : null}

      {/* 图表区 */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">月度应发与发放</h2>
            <div className="flex gap-4 text-xs text-muted">
              <span><i className="mr-1.5 inline-block size-2 rounded-sm bg-accent" />应发合计</span>
              <span><i className="mr-1.5 inline-block size-2 rounded-sm bg-orange-400" />已发放</span>
            </div>
          </div>
          <TrendLines earn={monthEarn} paid={monthPaid} />
        </div>
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-sm font-semibold">今年应发构成</h2>
          <Donut
            total={money(should)}
            parts={[
              { label: "工资 / 工日", value: baseSum, color: "#4f6bf5" },
              { label: "加班费", value: otSum, color: "#18b26b" },
              { label: "补助", value: allowanceSum, color: "#f0437c" },
              { label: "餐补", value: mealSum, color: "#f59e0b" },
            ]}
            deduction={deductionSum}
          />
        </div>
      </section>

      {/* 班组 / 快捷入口 */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-sm font-semibold">班组</h2>
          <ul className="mt-4 space-y-3">
            {teamRows.map((r, i) => (
              <li key={r.team}>
                <div className="flex items-center justify-between text-sm">
                  <span>{r.team}</span>
                  <span className="tabular-nums text-muted">{r.count} 人</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-elevated">
                  <i className="block h-full rounded-full bg-accent" style={{ width: `${Math.round((r.count / maxTeam) * 100)}%` }} />
                </div>
              </li>
            ))}
            {!teamRows.length ? <li className="text-sm text-muted">还没有班组。到「人员」给人员填班组。</li> : null}
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
          {over > 0 ? (
            <p className="mt-4 rounded-lg bg-warn-bg px-3 py-2 text-xs text-warn">超龄提醒：{over} 人（男≥55 / 女≥45）</p>
          ) : null}
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

function TrendLines({ earn, paid }: { earn: number[]; paid: number[] }) {
  const W = 640;
  const H = 200;
  const padL = 36;
  const padR = 12;
  const padT = 14;
  const padB = 26;
  const maxV = Math.max(1, ...earn, ...paid) * 1.15;
  const x = (i: number) => padL + (i / 11) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB);
  const pts = (arr: number[]) => arr.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const gridY = [0.25, 0.5, 0.75, 1].map((r) => padT + (1 - r) * (H - padT - padB));
  const labels = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const lastFilled = earn.reduce((acc, v, i) => (v > 0 ? i : acc), -1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="月度应发与已发放趋势">
      {gridY.map((gy, i) => (
        <line key={i} x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="#eef1f7" strokeWidth="1" />
      ))}
      <polyline fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts(earn)} />
      <polyline fill="none" stroke="#fb923c" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" points={pts(paid)} />
      {earn.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === lastFilled ? 4 : 2.5} fill="#fff" stroke="var(--color-accent)" strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#93a0b5">
          {l}
        </text>
      ))}
    </svg>
  );
}

function Donut({
  total,
  parts,
  deduction,
}: {
  total: string;
  parts: { label: string; value: number; color: string }[];
  deduction: number;
}) {
  const sum = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  let acc = 0;
  const stops: string[] = [];
  if (sum > 0) {
    for (const p of parts) {
      const v = Math.max(0, p.value);
      if (!v) continue;
      const from = (acc / sum) * 360;
      acc += v;
      const to = (acc / sum) * 360;
      stops.push(`${p.color} ${from.toFixed(1)}deg ${to.toFixed(1)}deg`);
    }
  } else {
    stops.push("#eef1f7 0deg 360deg");
  }
  return (
    <div className="mt-4 flex items-center gap-4">
      <div
        className="relative h-32 w-32 flex-none rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="font-display text-sm font-semibold">{total}</span>
          <span className="text-[10px] text-subtle">应发合计</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs text-muted">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <i className="size-2.5 flex-none rounded-full" style={{ background: p.color }} />
            <span className="truncate">{p.label}</span>
            <span className="ml-auto tabular-nums text-ink">{money(p.value)}</span>
          </li>
        ))}
        {deduction > 0 ? (
          <li className="flex items-center gap-2">
            <i className="size-2.5 flex-none rounded-full bg-danger" />
            <span className="truncate">扣款</span>
            <span className="ml-auto tabular-nums text-danger">-{money(deduction)}</span>
          </li>
        ) : null}
      </ul>
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
