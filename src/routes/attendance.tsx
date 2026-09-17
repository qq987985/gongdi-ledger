import * as React from "react";
import { ArrowLeft, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { WideTable } from "~/components/wide-table";
import { Can, Need, ReadonlyNotice, useCanSave } from "~/components/can";
// B16（1.8.15）打印入口：月表 / 全年月表 / 年度工资汇总的打印件（唯一实现在 components 里）
import { AttendanceMonthSheet, AttendanceMonthsYearSheet, PayrollYearSheet } from "~/components/ledger-print-sheets";
import type { MonthSheetData, MonthSheetRow } from "~/components/ledger-print-sheets";
import { FilePick } from "~/components/file-pick";
import { AttendanceImport, TplLink } from "~/components/excel-import";
import { DocActions, prepareNamedFile, setDoc, attendanceBase } from "~/components/doc-actions";
import { useApp } from "~/lib/store";
import { derivedYears, monthStatus, nextYear } from "~/lib/dates";
import { fallbackPayYear, summarizeYear } from "~/lib/attendance-summary";
// B-12②（1.8.14）：负出勤天数的判定与文案唯一实现 —— 页面只负责显示与拦截
import { canSaveMonthDays, negativeDayRows, negativeDaysNotice } from "~/lib/attendance-input";
import { monthPay, parseOtRule, wageLabel, getWageAt, round2 } from "~/lib/wage";
// 月表合计与「年度汇总 → 分月表」的唯一实现（屏幕页脚与打印表尾共用，见文件头）
import { monthPrintTables, monthTotals } from "~/lib/attendance-month";
import { permLabel } from "~/lib/perms";
import { blockedWrite } from "~/lib/readonly";
import { confirmLeaveUnsaved } from "~/lib/unsaved";
import { useUnsavedChanges } from "~/components/unsaved-guard";
import { money, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import type { AttendanceDoc } from "~/lib/types";

/** 唯一那句提示（F1 / A12）：离开会丢什么，说清楚 */
const UNSAVED_MSG = "本月考勤有未保存的修改，离开就会丢失";

function AttendancePage() {
  const store = useApp();
  const { year, people, attendance, saveAttendanceMonth, addYear } = store;
  const [month, setMonth] = React.useState<number | null>(null);
  const existing = attendance.filter((a) => a.year === year && a.month === (month || 0));
  const upcoming = nextYear(derivedYears(store));
  // 月表是本地编辑、「保存本月」才落盘：切月 / 返回总览 / 底部导航 / 浏览器返回 / 刷新关标签 /
  // 换台账 / 换年份，全部由这一处拦（lib/unsaved.ts + components/unsaved-guard.tsx）。
  // 只读账号存不下去，不拦（否则「改不了还弹确认」只会让人以为保存成功了）。
  const canEditMonth = useCanSave("attendance.edit");
  const [monthDirty, setMonthDirty] = React.useState(false);
  // 打印月表用的数据由 MonthTable 交上来（**与屏幕同一份 rows 与合计**，打印件自己不重算）
  const [monthSheet, setMonthSheet] = React.useState<MonthSheetData>({ rows: [], totals: monthTotals([]), dirty: false });
  useUnsavedChanges(monthDirty, UNSAVED_MSG, canEditMonth);
  const leaveMonth = (action: () => void) => {
    if (!confirmLeaveUnsaved()) return;
    action();
  };
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
        {/* 屏幕内容整体 no-print：打印只出下面的打印件（协议见 styles.css「打印分页协议」） */}
        <div className="no-print space-y-5">
        <ReadonlyNotice perm="attendance.edit" />
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <button type="button" className="mb-2 inline-flex items-center gap-1 text-xs text-muted hover:text-ink" onClick={() => leaveMonth(() => setMonth(null))}>
              <ArrowLeft className="size-3.5" /> 返回 {year} 年总览
            </button>
            <h1 className="font-display text-2xl font-semibold">
              {year}年{month}月考勤
            </h1>
            <p className="mt-1 text-sm text-muted">
              只填本月实际出勤的人。下面可上传几份考勤表照片或 PDF，以后在「影像资料」里查、下、复制、替换、删除。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* 打印是只读操作：入口只按 attendance.view（页面本身）控制，不看能不能编辑 */}
            <Button variant="outline" size="sm" type="button" disabled={!monthSheet.rows.length} onClick={() => window.print()}>
              打印月表
            </Button>
            <select className="field-select w-auto" value={month} onChange={(e) => leaveMonth(() => setMonth(Number(e.target.value)))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option value={m} key={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
        </header>
        <MonthFiles year={year} month={month} />
        <MonthTable
          year={year}
          month={month}
          people={people}
          existing={existing}
          onDirtyChange={(d) => {
            setMonthDirty(Boolean(d) && canEditMonth);
          }}
          onData={setMonthSheet}
          onSave={(rows) => {
            // 只读账号不落盘、也不弹「已保存」（A 组报告第 17 项同源）
            if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
            saveAttendanceMonth(year, month, rows);
            toast.success("本月考勤已保存");
          }}
          key={`${year}-${month}-${people.length}`}
        />
        </div>
        {/* 打印件必须渲染在 no-print 包裹**之外**：屏幕态隐藏（.print-only），只在打印时出现 */}
        <AttendanceMonthSheet
          year={year}
          month={month}
          rows={monthSheet.rows}
          totals={monthSheet.totals}
          dirty={monthSheet.dirty}
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
  const store = useApp();
  const { year, people, attendance, attendanceDocs = [], payments } = store;
  // 年度汇总与总览 KPI 走同一个纯函数（lib/attendance-summary.ts）：应发/已发/未发、
  // 「有内容」判定（含纯备注行）、无日期旧发放的归属年份都只有一套口径。
  const { rows, filledMonths, offRowsPaid, paid, proxyAmt, proxyCount, pendingAmt, should } = summarizeYear({
    people,
    attendance,
    payments,
    year,
    fallbackYear: fallbackPayYear(store),
  });
  const personRows = rows.map((r) => ({ p: r.person, ...r }));
  // 「本年无考勤记录」的补行只进工资汇总（决策二），工天加班表仍只列有出勤的人
  const workRows = personRows.filter((r) => !r.noAttendance);
  const [sumTab, setSumTab] = React.useState<"pay" | "work">("pay");
  // B16（1.8.15）两个打印入口：
  //  · 「打印年度工资汇总」= 屏幕这张年度表（12 个月应发列 + 全年/已发/未发），逐行与统计行的数字同源；
  //  · 「打印全年月表」= 把同一份年度行按月重排（每月一块，lib/attendance-month.ts 只搬运不重算）。
  // 打印件渲染在 .no-print 包裹**之外**，屏幕上隐藏（.print-only）；打印是只读操作，不看能不能编辑。
  const [printMode, setPrintMode] = React.useState<"pay" | "months">("pay");
  const monthTables = React.useMemo(() => monthPrintTables(rows), [rows]);
  // 未发合计 = 应发合计 − 已发放（两个数都来自 summarizeYear；金额取整统一走 round2）。
  // 屏幕与打印表尾用同一个值 —— 打印件里不许再算一遍。
  const unpaidTotal = round2(should - paid);
  function runPrint(mode: "pay" | "months") {
    if (mode === "pay") setSumTab("pay"); // 打印的就是屏幕这张表，先把页签切过去，别让屏幕和纸上不一样
    setPrintMode(mode);
    // 与发放页「打印明细/汇总」同一写法：先落模式再打印（setTimeout 让 DOM 先渲染出打印件）
    setTimeout(() => window.print(), 0);
  }
  return (
    <div className="space-y-6">
      {/* 屏幕内容整体 no-print：打印只出下面的打印件（协议见 styles.css「打印分页协议」） */}
      <div className="no-print space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{year}年考勤</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            和 Excel 一样，一年 12 个月。点某个月填写天数、加班、补助和扣款。加班规则在「人员」里设好，这里自动带入。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TplLink href={`/api/file/attendance-template?year=${year}`} filename={`${year}年考勤导入模板.xlsx`} />
          <Can perm="import.use">
            <AttendanceImport />
          </Can>
          <Button variant="outline" type="button" disabled={!personRows.length} onClick={() => runPrint("pay")}>
            打印年度工资汇总
          </Button>
          <Button variant="outline" type="button" disabled={!monthTables.length} onClick={() => runPrint("months")}>
            打印全年月表
          </Button>
          <Can perm="settings.year">
            <Button variant="outline" type="button" onClick={onAddYear}>
              <Plus className="size-4" /> 新增 {upcoming} 年
            </Button>
          </Can>
        </div>
      </header>
      <p className="text-sm text-muted">
        已录入 {filledMonths} / 12 个月 · 在册 {people.length} 人
      </p>
      <p className="text-xs text-muted">
        本年应发 ¥{money(should)} · 已发 ¥{money(paid)}（含代发
        {proxyAmt ? ` ¥${money(proxyAmt)}` : ""}）
        {pendingAmt ? ` · 待发放 ¥${money(pendingAmt)}` : ""} · 未发 ¥{money(unpaidTotal)}。已发按实际收款人计入（代发不减）；
        无日期的待发放记录按当前年份（{year}）显示，不计入已发。
      </p>
      {offRowsPaid.count > 0 ? (
        <p className="text-xs text-warn">
          另有 {offRowsPaid.count} 笔 ¥{money(offRowsPaid.amount)} 发给本年没有考勤记录的人（不列入下表；总览「已发放」含这部分，别对着差额找错账）。
        </p>
      ) : null}
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
                ? "只列出本年有出勤的人；本年收到「本人收款」却没有考勤记录的，补一行并在备注注明。加班规则没填时加班费按 0。"
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
                  <th className="p-3">备注</th>
                </tr>
              </thead>
              <tbody>
                {personRows.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="py-8 text-center text-sm text-muted">
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
                    <td className="p-3 text-xs text-warn">{r.remark}</td>
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
                {workRows.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-8 text-center text-sm text-muted">
                      这一年还没有人出勤。点上面某个月，把实际上班的人加进去。
                    </td>
                  </tr>
                ) : null}
                {workRows.map((r) => (
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
      {/* 打印件在 no-print 包裹之外、屏幕上隐藏：按 printMode 只渲染要印的那一份 */}
      {printMode === "pay" ? (
        <PayrollYearSheet
          year={year}
          rows={rows}
          peopleCount={people.length}
          filledMonths={filledMonths}
          should={should}
          paid={paid}
          proxyAmt={proxyAmt}
          proxyCount={proxyCount}
          pendingAmt={pendingAmt}
          unpaidTotal={unpaidTotal}
          offRows={offRowsPaid}
        />
      ) : null}
      {printMode === "months" ? (
        <AttendanceMonthsYearSheet year={year} tables={monthTables} peopleCount={people.length} filledMonths={filledMonths} />
      ) : null}
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
  onDirtyChange,
  onData,
  onSave,
}: {
  year: number;
  month: number;
  people: ReturnType<typeof useApp.getState>["people"];
  existing: ReturnType<typeof useApp.getState>["attendance"];
  onDirtyChange?: (dirty: boolean) => void;
  /** 把屏幕月表用的**同一份** rows / 合计交给父级渲染的打印件（打印件自己不重算，见 ledger-print-sheets.tsx） */
  onData?: (data: MonthSheetData) => void;
  onSave: (rows: MonthRow[]) => void;
}) {
  const byName = Object.fromEntries(existing.map((a) => [a.name, a]));
  // 只读账号：月表里的一切写入入口（保存/加人/删人/上传影像）都不出现
  const canEditMonth = useCanSave("attendance.edit");
  // 初始快照：与保存后的 store 数据同序同字段，保存成功后 dirty 会自动回到 false
  const initialRows: MonthRow[] = existing
    .filter((a) => a.name.trim())
    .map((a) => ({
      name: a.name,
      team: a.team || byName[a.name]?.team || "",
      days: a.days ?? 0,
      otHours: a.otHours ?? 0,
      allowance: a.allowance ?? 0,
      deduction: a.deduction ?? 0,
      remark: a.remark ?? "",
    }));
  const [rows, setRows] = React.useState<MonthRow[]>(() => initialRows);
  const dirty = JSON.stringify(rows) !== JSON.stringify(initialRows);
  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
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
    if (!name) return;
    if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
    // 与「删除所选」口径一致：确认后立即保存本月（避免行已消失但实际未删除）
    if (!confirm(`从本月考勤里去掉「${name}」？\n\n人员档案和发放记录不动，本月会立即保存。`)) return;
    const keep = rows.filter((_, idx) => idx !== i);
    setRows(keep);
    setSelected((s) => s.filter((n) => n !== name));
    onSave(keep);
    toast.success(`已从本月去掉 ${name}`);
  }
  function removeSelected() {
    if (!selected.length) return;
    if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
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
      // 班组：本行写的优先，缺了回落到人员档案 —— 屏幕列与打印件都用这一处，避免两边文案漂移
      teamLabel: r.team || p?.team || "",
      wageLabel: wageLabel(wage),
      rule: wage.otRule || "",
      ot: calc.ot,
      meal: calc.meal,
      pay: calc.pay,
      parsed: parseOtRule(wage.otRule || ""),
      known: Boolean(p),
      monthly: wage.payType === "month",
    };
  });
  // 月表合计只有这一个实现（屏幕页脚 + 打印月表表尾共用同一份 rows 过同一个函数）
  const totals = monthTotals(calcRows);
  const missingRule = calcRows.filter((r) => r.known && !r.rule).length;
  const unknown = calcRows.filter((r) => !r.known).length;
  const sheetRows: MonthSheetRow[] = calcRows.map((r) => ({
    name: r.name,
    team: r.teamLabel,
    days: r.days,
    otHours: r.otHours,
    allowance: r.allowance,
    deduction: r.deduction,
    remark: r.remark,
    wageLabel: r.wageLabel,
    ot: r.ot,
    meal: r.meal,
    pay: r.pay,
  }));
  const reportRef = React.useRef(onData);
  reportRef.current = onData;
  // 交给父级的打印件（依赖只写 rows/dirty：sheetRows 与 totals 都是由它们确定性派生的）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    reportRef.current?.({ rows: sheetRows, totals, dirty });
  }, [rows, dirty]);
  // B-12②：负出勤天数（自己填的或 Excel 导入的存量数据）—— 月表上方列名字，保存前拦住
  const negativeRows = negativeDayRows(rows);
  const negativeNotice = negativeDaysNotice(rows);
  function patch(i: number, key: keyof MonthRow, value: string | number) {
    if (key === "days" && Number(value) > 31)
      toast.warning(`${rows[i]?.name || ""} 的出勤天数填了 ${value}，一个月最多 31 天，请核对`);
    if (key === "days" && Number(value) < 0)
      toast.warning(`${rows[i]?.name || ""} 的出勤天数是负数（${value}）：会算成负工资，也不会被年度汇总算作有内容`);
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
      {/* B-12②：负出勤天数不能静默（月表页脚会出负工资、年度汇总还会漏掉这个人） */}
      {negativeRows.length > 0 ? <p className="text-sm text-warn">{negativeNotice}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            本月 <b className="tabular-nums">{totals.people}</b> 人
          </span>
          <span>
            出勤 <b className="tabular-nums">{totals.days}</b> 天
          </span>
          <span>
            加班费 <b className="tabular-nums">¥{money(totals.ot)}</b>
          </span>
          <span>
            餐补 <b className="tabular-nums">¥{money(totals.meal)}</b>
          </span>
          <span>
            补助 <b className="tabular-nums">¥{money(totals.allowance)}</b>
          </span>
          <span>
            扣款 <b className="tabular-nums">¥{money(totals.deduction)}</b>
          </span>
          <span>
            应发 <b className="tabular-nums">¥{money(totals.pay)}</b>
          </span>
          {selected.length > 0 ? (
            <Button variant="danger" size="sm" type="button" onClick={removeSelected}>
              删除所选（{selected.length}）
            </Button>
          ) : null}
        </div>
        {dirty ? <span className="text-xs text-warn">有未保存的修改</span> : null}
        {canEditMonth ? (
          <Button
            onClick={() => {
              // B-12②：负数天数的月份不落盘（先把数改对，或删掉那一行）——
              // 否则负工资会进台账，而且这条记录在年度汇总里等于不存在
              if (!canSaveMonthDays(rows)) {
                toast.error(negativeDaysNotice(rows));
                return;
              }
              onSave(rows);
            }}
          >
            保存本月
          </Button>
        ) : null}
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
              <th className="p-3">餐补</th>
              <th className="p-3">应发</th>
              <th className="p-3">备注</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {calcRows.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-sm text-muted">
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
                <td className="p-2 text-muted">{r.teamLabel || "—"}</td>
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
                <td className="p-2 tabular-nums">¥{money(r.meal)}</td>
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
  // 一批文件是逐份 await 上传的：请求期间禁用按钮，否则用户等不及再点一次会重复上传（1.8.1）
  const [uploading, setUploading] = React.useState(false);
  // 上传影像也要写台账（attendanceDocs）：只读账号不给上传入口
  const canUpload = useCanSave("attendance.edit");
  // 自动命名跟随**当前正在编辑的年月**（原提示写死「2026年3月」，
  // 编辑 2025-12 时也这么说 —— A 组报告第 64 项）
  const autoName = `考勤-${year}年${month}月`;
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">本月考勤影像资料</h2>
          <p className="mt-1 text-xs text-muted">
            可上传多份。自动命名为「{autoName}」。文件落在 data/photos/考勤影像。删除、替换前会确认。
          </p>
        </div>
        {canUpload ? (
        <FilePick
          kind="file"
          compact
          multiple
          disabled={uploading}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
          label={uploading ? "上传中…" : "上传影像"}
          hint="点击选择，或把文件拖到这里，可一次多份"
          onFiles={async (files) => {
            if (!files.length || uploading) return;
            if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
            setUploading(true);
            try {
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
            } catch (err) {
              // A11（专家评审）：原来只有 try/finally —— 上传失败（403 权限 / 413 文件太大）
              // 界面毫无反应，用户以为传上去了
              toast.error(err instanceof Error ? err.message : "上传失败，请检查网络后重试");
            } finally {
              setUploading(false);
            }
          }}
        />
        ) : null}
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
              readOnly={!canUpload}
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
