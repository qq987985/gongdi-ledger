import * as React from "react";
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { WideTable } from "~/components/wide-table";
import { Need } from "~/components/can";
import { FilePick } from "~/components/file-pick";
import { AttendanceImport, TplLink } from "~/components/excel-import";
import { DocActions, prepareNamedFile, setDoc, attendanceBase } from "~/components/doc-actions";
import { useApp } from "~/lib/store";
import { derivedYears, monthStatus, nextYear, paymentsInYear } from "~/lib/dates";
import { hasWork, monthPay, parseOtRule, wageLabel, getWageAt } from "~/lib/wage";
import { money, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import type { AttendanceDoc } from "~/lib/types";

function AttendancePage() {
  const store = useApp();
  const { year, people, attendance, saveAttendanceMonth, addYear } = store;
  const [month, setMonth] = React.useState<number | null>(null);
  const existing = attendance.filter((a) => a.year === year && a.month === (month || 0));
  const upcoming = nextYear(derivedYears(store));
  if (month == null)
    return (
      <YearOverview
        onOpen={setMonth}
        onAddYear={() => {
          const created = addYear(upcoming);
          toast.success(`${created} 年已展开，12 个月空表已铺好`);
        }}
        upcoming={upcoming}
      />
    );
  return (
    <Need perm="attendance.view">
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <button type="button" className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink" onClick={() => setMonth(null)}>
              <ArrowLeft className="size-3.5" /> 返回 {year} 年总览
            </button>
            <h1 className="font-display text-2xl font-semibold">
              {year}年{month}月考勤
            </h1>
            <p className="mt-1 text-sm text-muted">
              只填本月实际出勤的人。下面可上传几份考勤表照片或 PDF，以后在「影像资料」里查、下、复制、替换、删除。
            </p>
          </div>
          <select className="field-select w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option value={m} key={m}>
                {m}月
              </option>
            ))}
          </select>
        </header>
        <MonthFiles year={year} month={month} />
        <MonthTable
          year={year}
          month={month}
          people={people}
          existing={existing}
          onSave={(rows) => {
            saveAttendanceMonth(year, month, rows);
            toast.success("本月考勤已保存");
          }}
          key={`${year}-${month}-${people.length}`}
        />
      </div>
    </Need>
  );
}

function YearOverview({
  onOpen,
  onAddYear,
  upcoming,
}: {
  onOpen: (m: number) => void;
  onAddYear: () => void;
  upcoming: number;
}) {
  const { year, people, attendance, attendanceDocs = [], payments } = useApp();
  const fallbackYear = derivedYears({ year, years: [year], attendance, payments })[0] || year;
  const yearPay = paymentsInYear(payments, year, fallbackYear);
  const personRows = people
    .map((p) => {
      const months = Array.from({ length: 12 }, (_, i) => {
        const a = attendance.find((x) => x.year === year && x.month === i + 1 && x.name === p.name);
        const wage = getWageAt(p, year, i + 1);
        const calc = monthPay(a, wage);
        return { days: calc.days, pay: calc.pay, otHours: calc.otHours, allowance: calc.allowance, deduction: calc.deduction };
      });
      const yearPayAmt = months.reduce((s, m) => s + m.pay, 0);
      const yearDays = months.reduce((s, m) => s + m.days, 0);
      const yearOt = months.reduce((s, m) => s + m.otHours, 0);
      const paid = yearPay.filter((x) => x.owner === p.name && x.date).reduce((s, x) => s + x.amount, 0);
      const worked = months.some((m) => hasWork(m));
      return { p, months, yearPayAmt, yearDays, yearOt, paid, unpaid: yearPayAmt - paid, worked };
    })
    .filter((r) => r.worked);
  const filledMonths = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, year, i + 1).filled > 0).filter(Boolean).length;
  const [sumTab, setSumTab] = React.useState<"pay" | "work">("pay");
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{year}年考勤</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            和 Excel 一样，一年 12 个月。点某个月填写天数、加班、补助和扣款。加班规则在「人员」里设好，这里自动带入。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TplLink href={`/api/file/attendance-template?year=${year}`} filename={`${year}年考勤导入模板.xlsx`} />
          <AttendanceImport />
          <Button variant="outline" type="button" onClick={onAddYear}>
            <Plus className="size-4" /> 新增 {upcoming} 年
          </Button>
        </div>
      </header>
      <p className="text-sm text-muted">
        已录入 {filledMonths} / 12 个月 · 在册 {people.length} 人
      </p>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const st = monthStatus(attendance, year, m);
          const filled = st.filled > 0;
          const files = attendanceDocs.filter((d: AttendanceDoc) => d.year === year && d.month === m).length;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onOpen(m)}
              className="rounded-xl border border-line bg-surface p-4 text-left shadow-panel transition-colors duration-150 hover:border-accent"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-semibold">{m}月</span>
                <span className={`text-xs ${filled ? "text-ok" : "text-subtle"}`}>{filled ? "已录入" : "空表"}</span>
              </div>
              <div className="mt-3 text-xs text-muted">
                {filled ? (
                  <>
                    {st.filled} 人 · 出勤 {st.days} 天{files ? ` · ${files} 份影像` : ""}
                  </>
                ) : files ? (
                  `${files} 份影像，点此补录出勤`
                ) : (
                  "点此填写实际出勤"
                )}
              </div>
            </button>
          );
        })}
      </section>
      <section className="rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {year}年度{sumTab === "pay" ? "工资汇总" : "工天加班汇总"}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {sumTab === "pay"
                ? "只列出本年有出勤的人。没上班的不显示。加班规则没填时加班费按 0。"
                : "每月工天和加班小时。只显示本年有出勤的人。"}
            </p>
          </div>
          <div className="flex rounded-full border border-line p-0.5 text-xs">
            <button
              type="button"
              className={`h-8 rounded-full px-3 ${sumTab === "pay" ? "bg-accent text-accent-fg" : "text-muted"}`}
              onClick={() => setSumTab("pay")}
            >
              工资
            </button>
            <button
              type="button"
              className={`h-8 rounded-full px-3 ${sumTab === "work" ? "bg-accent text-accent-fg" : "text-muted"}`}
              onClick={() => setSumTab("work")}
            >
              工天加班
            </button>
          </div>
        </div>
        {sumTab === "pay" ? (
          <WideTable id="attendance-year" className="rounded-none border-0">
            <table className="wide-table text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="p-3">姓名</th>
                  <th className="p-3">班组</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th className="p-3" key={i}>
                      {i + 1}月
                    </th>
                  ))}
                  <th className="p-3">全年</th>
                  <th className="p-3">已发</th>
                  <th className="p-3">未发</th>
                </tr>
              </thead>
              <tbody>
                {personRows.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-4 text-muted">
                      这一年还没有人出勤。点上面某个月，把实际上班的人加进去。
                    </td>
                  </tr>
                ) : null}
                {personRows.map((r) => (
                  <tr className="border-t border-line" key={r.p.id}>
                    <td className="p-3 font-medium">{r.p.name}</td>
                    <td className="p-3 text-muted">{r.p.team}</td>
                    {r.months.map((m, i) => (
                      <td className="p-3 text-right tabular-nums text-muted" key={i}>
                        {m.pay ? money(m.pay) : "—"}
                      </td>
                    ))}
                    <td className="p-3 text-right font-medium tabular-nums">{money(r.yearPayAmt)}</td>
                    <td className="p-3 text-right tabular-nums">{money(r.paid)}</td>
                    <td className="p-3 text-right tabular-nums">{money(r.unpaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </WideTable>
        ) : (
          <WideTable id="attendance-year-work" className="rounded-none border-0">
            <table className="wide-table text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="p-3">姓名</th>
                  <th className="p-3">班组</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th className="p-3" key={i}>
                      {i + 1}月
                    </th>
                  ))}
                  <th className="p-3">全年工天</th>
                  <th className="p-3">全年加班</th>
                </tr>
              </thead>
              <tbody>
                {personRows.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-4 text-muted">
                      这一年还没有人出勤。点上面某个月，把实际上班的人加进去。
                    </td>
                  </tr>
                ) : null}
                {personRows.map((r) => (
                  <tr className="border-t border-line" key={r.p.id}>
                    <td className="p-3 font-medium">{r.p.name}</td>
                    <td className="p-3 text-muted">{r.p.team}</td>
                    {r.months.map((m, i) => (
                      <td className="p-3 text-right tabular-nums" key={i}>
                        {m.days || m.otHours ? (
                          <div>
                            <div>{m.days || "—"}</div>
                            <div className="text-[11px] text-muted">{m.otHours ? `${m.otHours}时` : "—"}</div>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 text-right font-medium tabular-nums">{r.yearDays || "—"}</td>
                    <td className="p-3 text-right tabular-nums">{r.yearOt ? `${r.yearOt}时` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </WideTable>
        )}
      </section>
    </div>
  );
}

interface MonthRow {
  name: string;
  team: string;
  days: number;
  otHours: number;
  allowance: number;
  deduction: number;
  remark: string;
}

function MonthTable({
  year,
  month,
  people,
  existing,
  onSave,
}: {
  year: number;
  month: number;
  people: ReturnType<typeof useApp.getState>["people"];
  existing: ReturnType<typeof useApp.getState>["attendance"];
  onSave: (rows: MonthRow[]) => void;
}) {
  const byName = Object.fromEntries(existing.map((a) => [a.name, a]));
  const [rows, setRows] = React.useState<MonthRow[]>(() =>
    existing
      .filter((a) => a.name.trim())
      .map((a) => ({
        name: a.name,
        team: a.team || byName[a.name]?.team || "",
        days: a.days ?? 0,
        otHours: a.otHours ?? 0,
        allowance: a.allowance ?? 0,
        deduction: a.deduction ?? 0,
        remark: a.remark ?? "",
      })),
  );
  const [pick, setPick] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const pmap = Object.fromEntries(people.map((p) => [p.name, p]));
  const used = new Set(rows.map((r) => r.name));
  const unused = people.filter((p) => p.name && !used.has(p.name));
  function addNames(names: string[]) {
    setRows((prev) => {
      const have = new Set(prev.map((r) => r.name));
      const extra = names
        .filter((n) => n && !have.has(n))
        .map((n) => {
          const p = pmap[n];
          const old = byName[n];
          return {
            name: n,
            team: old?.team || p?.team || "",
            days: old?.days ?? 0,
            otHours: old?.otHours ?? 0,
            allowance: old?.allowance ?? 0,
            deduction: old?.deduction ?? 0,
            remark: old?.remark ?? "",
          };
        });
      return extra.length ? [...prev, ...extra] : prev;
    });
  }
  function removeAt(i: number) {
    const name = rows[i]?.name;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    if (name) setSelected((s) => s.filter((n) => n !== name));
  }
  function removeSelected() {
    if (!selected.length) return;
    if (!confirmBatchDelete("本月考勤", selected.length, "只从本月名单里去掉这些人。人员档案和发放记录不动。保存后生效。")) return;
    const keep = rows.filter((r) => !selected.includes(r.name));
    setRows(keep);
    setSelected([]);
    onSave(keep);
    toast.success(`已从本月去掉 ${selected.length} 人`);
  }
  const calcRows = rows.map((r) => {
    const p = pmap[r.name];
    const wage = getWageAt(p, year, month);
    const calc = monthPay(r, wage);
    return {
      ...r,
      wageLabel: wageLabel(wage),
      rule: wage.otRule || "",
      ot: calc.ot,
      pay: calc.pay,
      parsed: parseOtRule(wage.otRule || ""),
      known: Boolean(p),
      monthly: wage.payType === "month",
    };
  });
  const totalPay = calcRows.reduce((s, r) => s + r.pay, 0);
  const totalOt = calcRows.reduce((s, r) => s + r.ot, 0);
  const totalDays = calcRows.reduce((s, r) => s + r.days, 0);
  const totalAllowance = calcRows.reduce((s, r) => s + (r.allowance || 0), 0);
  const totalDeduction = calcRows.reduce((s, r) => s + (r.deduction || 0), 0);
  const missingRule = calcRows.filter((r) => r.known && !r.rule).length;
  const unknown = calcRows.filter((r) => !r.known).length;
  function patch(i: number, key: keyof MonthRow, value: string | number) {
    setRows((prev) => {
      const next = prev.slice();
      const row = { ...next[i] };
      if (key === "remark") (row as any)[key] = value;
      else (row as any)[key] = Number(value) || 0;
      next[i] = row;
      return next;
    });
  }
  return (
    <>
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface px-4 py-3">
        <div className="min-w-40 flex-1">
          <div className="text-xs text-muted">从人员表加入本月出勤</div>
          <select className="field-select mt-1 w-full" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">{unused.length ? "选择姓名" : "在册人员都已加入"}</option>
            {unused.map((p) => (
              <option value={p.name} key={p.id}>
                {p.name} {p.team ? ` · ${p.team}` : ""}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (!pick) return;
            addNames([pick]);
            setPick("");
          }}
          disabled={!pick}
        >
          <UserPlus className="size-4" /> 加入
        </Button>
        <Button variant="outline" onClick={() => addNames(unused.map((p) => p.name))} disabled={!unused.length}>
          加入全部在册
        </Button>
      </div>
      {missingRule > 0 ? (
        <p className="text-sm text-warn">
          有 {missingRule} 人还没在人员表设加班规则，加班费会算成 0。到「人员」里填「按小时:25」或「折算:8」。
        </p>
      ) : null}
      {unknown > 0 ? <p className="text-sm text-warn">有 {unknown} 人不在人员表，无法带入加班规则。请先在人员里添加。</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            本月 <b className="tabular-nums">{rows.length}</b> 人
          </span>
          <span>
            出勤 <b className="tabular-nums">{totalDays}</b> 天
          </span>
          <span>
            加班费 <b className="tabular-nums">¥{money(totalOt)}</b>
          </span>
          <span>
            补助 <b className="tabular-nums">¥{money(totalAllowance)}</b>
          </span>
          <span>
            扣款 <b className="tabular-nums">¥{money(totalDeduction)}</b>
          </span>
          <span>
            应发 <b className="tabular-nums">¥{money(totalPay)}</b>
          </span>
          {selected.length > 0 ? (
            <Button variant="danger" size="sm" type="button" onClick={removeSelected}>
              删除所选（{selected.length}）
            </Button>
          ) : null}
        </div>
        <Button onClick={() => onSave(rows)}>保存本月</Button>
      </div>
      <WideTable id="attendance-month">
        <table className="wide-table text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={rows.length > 0 && rows.every((r) => selected.includes(r.name))}
                  onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.name) : [])}
                  aria-label="全选本月考勤"
                />
              </th>
              <th className="p-3">姓名</th>
              <th className="p-3">班组</th>
              <th className="p-3">出勤天数</th>
              <th className="p-3">加班小时</th>
              <th className="p-3">补助</th>
              <th className="p-3">扣款</th>
              <th className="p-3">工资（人员表）</th>
              <th className="p-3">加班规则（人员表）</th>
              <th className="p-3">加班费</th>
              <th className="p-3">应发</th>
              <th className="p-3">备注</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {calcRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-6 text-muted">
                  本月还没人。从上方人员表把实际出勤的人加进来，填出勤天数、加班小时、补助、扣款。
                </td>
              </tr>
            ) : null}
            {calcRows.map((r, i) => (
              <tr className="border-b border-line last:border-0" key={r.name}>
                <td className="p-2">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={selected.includes(r.name)}
                    onChange={(e) => setSelected((s) => toggleSel(s, r.name, e.target.checked))}
                    aria-label={`选择 ${r.name}`}
                  />
                </td>
                <td className="p-2 font-medium">{r.name}</td>
                <td className="p-2 text-muted">{r.team || pmap[r.name]?.team || "—"}</td>
                <td className="p-2">
                  <Input className="h-9 w-24" type="number" step="0.5" value={r.days} onChange={(e) => patch(i, "days", e.target.value)} />
                </td>
                <td className="p-2">
                  <Input className="h-9 w-24" type="number" step="0.5" value={r.otHours} onChange={(e) => patch(i, "otHours", e.target.value)} />
                </td>
                <td className="p-2">
                  <Input
                    className="h-9 w-24"
                    type="number"
                    step="0.01"
                    value={r.allowance}
                    onChange={(e) => patch(i, "allowance", e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <Input
                    className="h-9 w-24"
                    type="number"
                    step="0.01"
                    value={r.deduction}
                    onChange={(e) => patch(i, "deduction", e.target.value)}
                  />
                </td>
                <td className="p-2 tabular-nums">{r.wageLabel}</td>
                <td className="p-2 text-xs">{r.parsed.label || "未设"}</td>
                <td className="p-2 tabular-nums">¥{money(r.ot)}</td>
                <td className="p-2 font-medium tabular-nums">¥{money(r.pay)}</td>
                <td className="p-2">
                  <Input className="h-9 w-36" value={r.remark} onChange={(e) => patch(i, "remark", e.target.value)} />
                </td>
                <td className="p-2">
                  <Button variant="ghost" size="icon" className="size-9" onClick={() => removeAt(i)} aria-label={`移出 ${r.name}`}>
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WideTable>
    </>
  );
}

function MonthFiles({ year, month }: { year: number; month: number }) {
  const docs = useApp((s) => s.attendanceDocs || []);
  const add = useApp((s) => s.addAttendanceDoc);
  const patch = useApp((s) => s.patchAttendanceDoc);
  const remove = useApp((s) => s.removeAttendanceDocs);
  const list = docs.filter((d: AttendanceDoc) => d.year === year && d.month === month);
  const [remark, setRemark] = React.useState("");
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">本月考勤影像资料</h2>
          <p className="mt-1 text-xs text-muted">
            可上传多份。自动命名为「考勤-2026年3月」。文件落在 data/photos/考勤影像。删除、替换前会确认。
          </p>
        </div>
        <FilePick
          kind="file"
          compact
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
          label="上传影像"
          hint="点击选择，或把文件拖到这里，可一次多份"
          onFiles={async (files) => {
            if (!files.length) return;
            const taken = docs.map((d: AttendanceDoc) => d.fileName);
            let uploaded = 0;
            for (const file of files) {
              const id = uid();
              const pack = await prepareNamedFile(file, attendanceBase(year, month), taken, "");
              if (!pack) continue;
              const saved = (await setDoc(id, "attendance", pack.file, { replace: pack.replace })) || pack.file.name;
              taken.push(saved);
              add({ id, year, month, fileName: saved, remark });
              uploaded += 1;
            }
            setRemark("");
            if (uploaded) toast.success(`已上传 ${uploaded} 份`);
          }}
        />
      </div>
      <Input className="mt-3" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="备注（选填，会写在接下来上传的文件上）" />
      {list.length === 0 ? <p className="mt-3 text-sm text-muted">还没有影像资料。</p> : null}
      <ul className="mt-3 space-y-2">
        {list.map((d: AttendanceDoc) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-bg-elevated px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{d.fileName}</div>
              {d.remark ? <div className="text-xs text-muted">{d.remark}</div> : null}
            </div>
            <DocActions
              id={d.id}
              kind="attendance"
              fileName={d.fileName}
              suggest={attendanceBase(year, month)}
              taken={docs.map((x: AttendanceDoc) => x.fileName)}
              onReplaced={(name) => patch(d.id, { fileName: name })}
              onDeleted={() => remove([d.id])}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});
