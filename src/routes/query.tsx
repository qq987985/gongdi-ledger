import * as React from "react";
import { Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Need } from "~/components/can";
import { YmPick, ymKey, monthsInRange, rangeLabel } from "~/components/ym-pick";
import { PhotoSlot } from "~/components/photo-slot";
import { DocActions } from "~/components/doc-actions";
import { useApp } from "~/lib/store";
import { derivedYears } from "~/lib/dates";
import { monthPay, parseOtRule, wageLabel, hasWork } from "~/lib/wage";
import { overAgeLabel } from "~/lib/idcard";
import { money, copyText } from "~/lib/utils";
import type { Person, Payment, Attendance, MonthAttendance } from "~/lib/types";

function CopyField({ label, value, mono = false }: { label: string; value: string | number | undefined; mono?: boolean }) {
  const text = value == null || value === "" ? "" : String(value);
  const [ok, setOk] = React.useState(false);
  function onCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!text) {
      toast.error(`${label}是空的，没有可复制的内容`);
      return;
    }
    if (copyText(text)) {
      setOk(true);
      toast.success(`已复制${label}：${text}`);
      window.setTimeout(() => setOk(false), 1600);
    } else toast.error("复制失败，请长按文字手动选择");
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`复制${label}`}
      title={text ? `复制${label}` : `${label}为空`}
      className="flex w-full items-start justify-between gap-3 rounded-md border border-line bg-bg-elevated px-3 py-2 text-left hover:border-accent"
    >
      <div className="min-w-0">
        <div className="text-xs font-medium tracking-wide text-muted">{label}</div>
        <div className={`mt-0.5 break-all text-sm ${mono ? "font-mono tabular-nums" : ""}`}>{text || "—"}</div>
      </div>
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-ink">
        {ok ? <Check className="size-4" /> : <Copy className="size-4" />}
      </span>
    </button>
  );
}

function buildSlips({
  people,
  names,
  span,
  attendance,
  payments,
}: {
  people: Person[];
  names: string[];
  span: { year: number; month: number }[];
  attendance: Attendance[];
  payments: Payment[];
}) {
  return names
    .map((name) => {
      const p = people.find((x) => x.name === name);
      if (!p) return null;
      const months: any[] = [];
      for (const { year, month } of span) {
        const a = attendance.find((x) => x.year === year && x.month === month && x.name === name);
        if (!hasWork(a)) continue;
        const calc = monthPay(a as MonthAttendance, p);
        months.push({
          year,
          month,
          days: calc.days,
          base: calc.base,
          otHours: calc.otHours,
          ot: calc.ot,
          allowance: calc.allowance,
          deduction: calc.deduction,
          pay: calc.pay,
          remark: a?.remark || "",
        });
      }
      const pays = payments
        .filter((x) => x.owner === name && x.date)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((x) => ({
          date: x.date,
          amount: x.amount || 0,
          receiver: x.receiver || x.owner,
          source: x.source || "",
          remark: x.remark || "",
        }));
      if (!months.length && !pays.length) return null;
      return {
        person: p,
        months,
        total: months.reduce((s, m) => s + m.pay, 0),
        pays,
        paid: pays.reduce((s, x) => s + x.amount, 0),
      };
    })
    .filter(Boolean);
}

function PayslipSheets({
  slips,
  rangeLabel: label,
  showPays,
}: {
  slips: NonNullable<ReturnType<typeof buildSlips>>;
  rangeLabel: string;
  showPays: boolean;
}) {
  return (
    <div className="print-only space-y-8 text-black">
      {slips.map((s: any) => (
        <article key={s.person.id} className="payslip border border-black p-4">
          <header className="border-b border-black pb-2 text-center">
            <div className="text-lg font-semibold tracking-widest">台账 · 工资条</div>
            <div className="mt-1 text-sm">{label}</div>
          </header>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
            <div>姓名：{s.person.name}</div>
            <div>班组：{s.person.team || "—"}</div>
            <div>工资：{wageLabel(s.person)}</div>
            <div>加班：{parseOtRule(s.person.otRule).label || "—"}</div>
          </div>
          {s.months.length ? (
            <table className="mt-3 w-full border-collapse text-center text-xs">
              <thead>
                <tr>
                  {["年月", "出勤", "底薪", "加班小时", "加班费", "补助", "扣款", "应发", "备注"].map((h) => (
                    <th key={h} className="border border-black px-1 py-1 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.months.map((m: any) => (
                  <tr key={`${m.year}-${m.month}`}>
                    <td className="border border-black px-1 py-1">
                      {m.year}年{m.month}月
                    </td>
                    <td className="border border-black px-1 py-1">{m.days}</td>
                    <td className="border border-black px-1 py-1">{money(m.base)}</td>
                    <td className="border border-black px-1 py-1">{m.otHours || ""}</td>
                    <td className="border border-black px-1 py-1">{m.ot ? money(m.ot) : ""}</td>
                    <td className="border border-black px-1 py-1">{m.allowance ? money(m.allowance) : ""}</td>
                    <td className="border border-black px-1 py-1">{m.deduction ? money(m.deduction) : ""}</td>
                    <td className="border border-black px-1 py-1 font-medium">{money(m.pay)}</td>
                    <td className="border border-black px-1 py-1 text-left">{m.remark}</td>
                  </tr>
                ))}
                <tr>
                  <td className="border border-black px-1 py-1 font-medium">合计</td>
                  <td className="border border-black px-1 py-1">{s.months.reduce((n: number, m: any) => n + m.days, 0)}</td>
                  <td className="border border-black px-1 py-1">{money(s.months.reduce((n: number, m: any) => n + m.base, 0))}</td>
                  <td className="border border-black px-1 py-1">{s.months.reduce((n: number, m: any) => n + m.otHours, 0) || ""}</td>
                  <td className="border border-black px-1 py-1">{money(s.months.reduce((n: number, m: any) => n + m.ot, 0))}</td>
                  <td className="border border-black px-1 py-1">{money(s.months.reduce((n: number, m: any) => n + m.allowance, 0))}</td>
                  <td className="border border-black px-1 py-1">{money(s.months.reduce((n: number, m: any) => n + m.deduction, 0))}</td>
                  <td className="border border-black px-1 py-1 font-semibold">{money(s.total)}</td>
                  <td className="border border-black px-1 py-1" />
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-xs">本区间无出勤记录。</p>
          )}
          <p className="mt-2 text-xs">
            {s.person.payType === "month" ? "按月：当月有出勤发月工资 + 加班费 + 补助 − 扣款。" : "按工天：应发 = 出勤×日工资 + 加班费 + 补助 − 扣款。"}
            本区间应发合计 ¥{money(s.total)}。
          </p>
          {showPays ? (
            <section className="mt-4">
              <div className="text-sm font-medium">打款记录</div>
              {s.pays.length ? (
                <table className="mt-1 w-full border-collapse text-center text-xs">
                  <thead>
                    <tr>
                      {["日期", "金额", "收款人", "来源", "备注"].map((h) => (
                        <th key={h} className="border border-black px-1 py-1 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.pays.map((x: any, i: number) => (
                      <tr key={`${x.date}-${i}`}>
                        <td className="border border-black px-1 py-1">{x.date}</td>
                        <td className="border border-black px-1 py-1">{money(x.amount)}</td>
                        <td className="border border-black px-1 py-1">{x.receiver === s.person.name ? "本人" : `${x.receiver}代收`}</td>
                        <td className="border border-black px-1 py-1">{x.source}</td>
                        <td className="border border-black px-1 py-1 text-left">{x.remark}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="border border-black px-1 py-1 font-medium">已打款合计</td>
                      <td className="border border-black px-1 py-1 font-semibold">{money(s.paid)}</td>
                      <td className="border border-black px-1 py-1" colSpan={3}>
                        未打款 ¥{money(s.total - s.paid)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="mt-1 text-xs">
                  本区间无打款记录。已打款 ¥0 · 未打款 ¥{money(s.total)}
                </p>
              )}
            </section>
          ) : null}
          <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
            <div>领款人签字：________________</div>
            <div>日期：______年____月____日</div>
          </div>
        </article>
      ))}
    </div>
  );
}

function QueryPage() {
  const store = useApp();
  const { year, people, attendance, attendanceDocs, payments, patchAttendanceDoc, removeAttendanceDocs } = store;
  const years = derivedYears(store);
  const yearOpts = years.length ? years : [year];
  const [name, setName] = React.useState(people[0]?.name || "");
  const [printNames, setPrintNames] = React.useState<string[]>(people[0]?.name ? [people[0].name] : []);
  const [printPays, setPrintPays] = React.useState(true);
  const [fromY, setFromY] = React.useState(year);
  const [fromM, setFromM] = React.useState(1);
  const [toY, setToY] = React.useState(year);
  const [toM, setToM] = React.useState(12);
  const p = people.find((x) => x.name === name);
  const span = React.useMemo(() => monthsInRange(fromY, fromM, toY, toM), [fromY, fromM, toY, toM]);
  const swapped = ymKey(fromY, fromM) > ymKey(toY, toM);
  const rows = span.map(({ year: y, month: m }) => {
    const a = attendance.find((x) => x.year === y && x.month === m && x.name === name);
    const calc = monthPay(a, p);
    return {
      year: y,
      month: m,
      days: calc.days,
      otHours: calc.otHours,
      allowance: calc.allowance,
      deduction: calc.deduction,
      ot: calc.ot,
      pay: calc.pay,
      remark: a?.remark || "",
    };
  });
  const should = rows.reduce((s, r) => s + r.pay, 0);
  const start = span[0];
  const end = span[span.length - 1];
  const pays = payments.filter((x) => {
    if (x.owner !== name && x.receiver !== name) return false;
    const y = Number(String(x.date || "").slice(0, 4));
    const m = Number(String(x.date || "").slice(5, 7));
    if (!y || !m) return false;
    const k = ymKey(y, m);
    return k >= ymKey(start.year, start.month) && k <= ymKey(end.year, end.month);
  });
  const paidAsOwner = pays.filter((x) => x.owner === name).reduce((s, x) => s + x.amount, 0);
  const rangeLabelText = rangeLabel(fromY, fromM, toY, toM);
  const slips = React.useMemo(
    () => buildSlips({ people, names: printNames, span, attendance, payments }),
    [people, printNames, span, attendance, payments],
  );
  const teams = [...new Set(people.map((x) => x.team).filter(Boolean))];
  return (
    <Need perm="query.view">
      <div className="space-y-6">
        <div className="no-print space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">个人查询</h1>
              <p className="mt-1 text-sm text-muted">按月份区间查。查单月就把起止设成同一个月，例如 7月到7月。</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                list="query-people-list"
                className="field-select w-auto min-w-[8rem]"
                value={name}
                placeholder="输入或选择姓名"
                onChange={(e) => setName(e.target.value)}
              />
              <datalist id="query-people-list">
                {people.map((x) => (
                  <option key={x.id} value={x.name} />
                ))}
              </datalist>
              {name ? (
                <Button variant="ghost" size="icon" className="size-9" type="button" onClick={() => setName("")} aria-label="清空">
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </header>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
            <YmPick label="从" years={yearOpts} y={fromY} m={fromM} onY={setFromY} onM={setFromM} />
            <span className="pb-2 text-sm text-muted">到</span>
            <YmPick label="到" years={yearOpts} y={toY} m={toM} onY={setToY} onM={setToM} />
            <p className="w-full text-xs text-muted">
              当前查询：{rangeLabelText}
              {swapped ? "（起止已自动对调）" : ""} · 共 {span.length} 个月
            </p>
          </div>
          <section className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">打印工资条</h2>
                <p className="mt-1 text-xs text-muted">
                  按上面查的 {rangeLabelText} 生成，每人一张。可勾选是否附带打款记录。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setPrintNames(people.map((x) => x.name))}>
                  全选
                </Button>
                <Button variant="outline" size="sm" type="button" onClick={() => setPrintNames([])}>
                  清空
                </Button>
                {teams.map((t) => (
                  <Button key={t} variant="outline" size="sm" type="button" onClick={() => setPrintNames(people.filter((x) => x.team === t).map((x) => x.name))}>
                    {t}
                  </Button>
                ))}
                <label className="inline-flex items-center gap-1.5 text-sm">
                  <input type="checkbox" className="size-4" checked={printPays} onChange={(e) => setPrintPays(e.target.checked)} /> 打印打款记录
                </label>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (!printNames.length) {
                      toast.error("先勾选要打印的人");
                      return;
                    }
                    if (!slips.length) {
                      toast.error("所选人在该区间没有出勤或打款，没有工资条");
                      return;
                    }
                    window.print();
                  }}
                >
                  打印 {slips.length} 张
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {people.map((x) => (
                <label key={x.id} className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={printNames.includes(x.name)}
                    onChange={(e) =>
                      setPrintNames((s) =>
                        e.target.checked ? [...new Set([...s, x.name])] : s.filter((n) => n !== x.name),
                      )
                    }
                  />
                  {x.name}
                  <span className="text-xs text-muted">{x.team}</span>
                </label>
              ))}
            </div>
          </section>
          {p ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold">{p.name}</h2>
                <Badge>{p.team}</Badge>
                {overAgeLabel(p.age, p.gender) === "超龄" ? <Badge tone="warn">超龄</Badge> : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <CopyField label="身份证号" value={p.idCard} mono />
                <CopyField label="身份证签发机关" value={p.idIssuer} />
                <CopyField label="身份证有效期开始" value={p.idValidFrom} />
                <CopyField label="身份证有效期结束" value={p.idValidTo} />
                <CopyField label="联系电话" value={p.phone} mono />
                <CopyField label="开户行" value={p.bank} />
                <CopyField label="银行卡号" value={p.cardNo} mono />
                <CopyField label="户籍地址" value={p.address} />
                <CopyField label="IC卡号" value={p.personNo} mono />
                <CopyField label="计薪方式" value={p.payType === "month" ? "按月" : "按工天"} />
                <CopyField label="工资" value={wageLabel(p)} />
                <CopyField label="加班规则" value={parseOtRule(p.otRule).label} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <PhotoSlot name={p.name} kind="id" />
                <PhotoSlot name={p.name} kind="bank" />
                <PhotoSlot name={p.name} kind="ic" />
              </div>
              <section className="rounded-xl border border-line bg-surface p-4">
                <h3 className="text-sm font-semibold">
                  {rangeLabelText} 考勤
                </h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-muted">
                      <tr>
                        <th className="py-2">年月</th>
                        <th>出勤</th>
                        <th>加班小时</th>
                        <th>补助</th>
                        <th>扣款</th>
                        <th>加班费</th>
                        <th>应发</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr className="border-t border-line" key={`${r.year}-${r.month}`}>
                          <td className="py-2">
                            {r.year}年{r.month}月
                          </td>
                          <td className="tabular-nums">{r.days || "—"}</td>
                          <td className="tabular-nums">{r.otHours || "—"}</td>
                          <td className="tabular-nums">{r.allowance ? `¥${money(r.allowance)}` : "—"}</td>
                          <td className="tabular-nums">{r.deduction ? `¥${money(r.deduction)}` : "—"}</td>
                          <td className="tabular-nums">{r.ot ? `¥${money(r.ot)}` : "—"}</td>
                          <td className="tabular-nums">{r.pay ? `¥${money(r.pay)}` : "—"}</td>
                          <td className="text-muted">{r.remark}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-line font-medium">
                        <td className="py-2">合计</td>
                        <td className="tabular-nums">{rows.reduce((s, r) => s + r.days, 0)}</td>
                        <td className="tabular-nums">{rows.reduce((s, r) => s + r.otHours, 0)}</td>
                        <td className="tabular-nums">¥{money(rows.reduce((s, r) => s + r.allowance, 0))}</td>
                        <td className="tabular-nums">¥{money(rows.reduce((s, r) => s + r.deduction, 0))}</td>
                        <td className="tabular-nums">¥{money(rows.reduce((s, r) => s + r.ot, 0))}</td>
                        <td className="tabular-nums">¥{money(should)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm">
                  应发合计 ¥{money(should)} · 已记入实际收款人 ¥{money(paidAsOwner)} · 差额 ¥{money(should - paidAsOwner)}
                </p>
              </section>
              <section className="rounded-xl border border-line bg-surface p-4">
                <h3 className="text-sm font-semibold">{rangeLabelText} 相关发放</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {pays.length === 0 ? <li className="text-muted">该区间暂无</li> : null}
                  {pays.map((x) => (
                    <li key={x.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                      <span>
                        {x.date} · 实际收款人 {x.owner}
                        {x.receiver !== x.owner ? ` · ${x.receiver}代收` : " · 本人收"}
                        {x.source ? ` · ${x.source}` : ""}
                      </span>
                      <span className="tabular-nums">¥{money(x.amount)}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-xl border border-line bg-surface p-4">
                <h3 className="text-sm font-semibold">{rangeLabelText} 考勤影像资料</h3>
                <p className="mt-1 text-xs text-muted">月份上的现场考勤表/文件，可查看、下载、复制、替换、删除。</p>
                <ul className="mt-3 space-y-2">
                  {(attendanceDocs || [])
                    .filter((d) => span.some((x) => x.year === d.year && x.month === d.month))
                    .map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 text-sm"
                      >
                        <div>
                          {d.year}年{d.month}月 · {d.fileName}
                          {d.remark ? ` · ${d.remark}` : ""}
                        </div>
                        <DocActions
                          id={d.id}
                          kind="attendance"
                          fileName={d.fileName}
                          suggest={`考勤-${d.year}年${d.month}月`}
                          taken={(attendanceDocs || []).map((x) => x.fileName)}
                          onReplaced={(name) => patchAttendanceDoc(d.id, { fileName: name })}
                          onDeleted={() => removeAttendanceDocs([d.id])}
                        />
                      </li>
                    ))}
                  {(attendanceDocs || []).filter((d) => span.some((x) => x.year === d.year && x.month === d.month)).length === 0 ? (
                    <li className="text-muted">该区间没有考勤影像。到「月度考勤」里上传。</li>
                  ) : null}
                </ul>
              </section>
            </>
          ) : (
            <p className="text-sm text-muted">暂无人员</p>
          )}
        </div>
        <PayslipSheets slips={slips as any} rangeLabel={rangeLabelText} showPays={printPays} />
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/query")({
  component: QueryPage,
});
