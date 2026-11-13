import * as React from "react";
import { Check, ChevronDown, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Need, useCan, useCanSave } from "~/components/can";
import { YmPick, rangeLabel } from "~/components/ym-pick";
import { PersonQueryResults, TeamQueryResults } from "~/components/query-results";
import { QuerySheet } from "~/components/query-sheet";
import { PhotoSlot } from "~/components/photo-slot";
import { DocActions } from "~/components/doc-actions";
import { useApp } from "~/lib/store";
import { derivedYears } from "~/lib/dates";
import { parseOtRule, wageLabel } from "~/lib/wage";
import { buildQueryResults, buildQuerySlips, queryPrintResults, queryRange, queryTeamResults, type QueryContent, type QuerySlip } from "~/lib/query-data";
import { groupBuckets, inBucket } from "~/lib/buckets";
// 收款人判定（receiverOf / isProxyReceiver）与姓名比较键（nameKey / ownerKey）都只有一处实现
import { isProxyReceiver, nameKey, receiverOf } from "~/lib/payments-stats";
import { permLabel } from "~/lib/perms";
import { blockedWrite } from "~/lib/readonly";
import { overAgeLabel } from "~/lib/idcard";
import { money, copyText } from "~/lib/utils";

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

function groupSlips(slips: QuerySlip[], showMonths: boolean, showPays: boolean): QuerySlip[][] {
  const groups: QuerySlip[][] = [];
  const isBig = (s: QuerySlip) => {
    // 内容行数 = 月份数（打印工资时）+ 打款记录数（打印打款时），超过 8 行视为内容多，单人一张
    const lines = (showMonths ? s.months.length : 0) + (showPays ? s.pays.length : 0);
    return lines > 8;
  };
  let i = 0;
  while (i < slips.length) {
    const first = slips[i];
    if (isBig(first) || i + 1 >= slips.length) {
      groups.push([first]);
      i += 1;
    } else {
      const second = slips[i + 1];
      if (isBig(second)) {
        groups.push([first]);
        i += 1;
      } else {
        groups.push([first, second]);
        i += 2;
      }
    }
  }
  return groups;
}

function PayslipSheets({
  slips,
  rangeLabel: label,
  printMode,
}: {
  slips: QuerySlip[];
  rangeLabel: string;
  printMode: "wage" | "both" | "pays";
}) {
  const showMonths = printMode !== "pays";
  const showPays = printMode !== "wage";
  const groups = React.useMemo(() => groupSlips(slips, showMonths, showPays), [slips, showMonths, showPays]);
  return (
    <div className="print-only text-black">
      {groups.map((group, gi) => (
        <div key={gi} className="payslip-page">
          {group.map((s) => (
            <article key={s.person.id} className="payslip border border-black p-4">
              <header className="border-b border-black pb-2 text-center">
                <div className="text-lg font-semibold tracking-widest">{printMode === "pays" ? "台账 · 打款记录" : "台账 · 工资条"}</div>
                <div className="mt-1 text-sm">{label}</div>
              </header>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-4">
                <div>姓名：{s.person.name}</div>
                <div>班组：{s.person.team || "—"}</div>
                {printMode === "pays" ? null : (
                  <>
                    <div>工资：{s.hasHistory ? "按各月生效工资（见明细）" : wageLabel(s.person)}</div>
                    <div>加班：{parseOtRule(s.person.otRule).label || "—"}</div>
                  </>
                )}
              </div>
          {showMonths ? (s.months.length ? (
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
                {s.months.map((m) => (
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
                  <td className="border border-black px-1 py-1">{s.totals.days}</td>
                  <td className="border border-black px-1 py-1">{money(s.totals.base)}</td>
                  <td className="border border-black px-1 py-1">{s.totals.otHours || ""}</td>
                  <td className="border border-black px-1 py-1">{money(s.totals.ot)}</td>
                  <td className="border border-black px-1 py-1">{money(s.totals.allowance)}</td>
                  <td className="border border-black px-1 py-1">{money(s.totals.deduction)}</td>
                  <td className="border border-black px-1 py-1 font-semibold">{money(s.total)}</td>
                  <td className="border border-black px-1 py-1" />
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-xs">本区间无出勤记录。</p>
          )) : null}
          {showMonths ? (
            <p className="mt-2 text-xs">
              {s.person.payType === "month" ? "按月：当月有出勤发月工资 + 加班费 + 补助 − 扣款。" : "按工天：应发 = 出勤×日工资 + 加班费 + 补助 − 扣款。"}
              本区间应发合计 ¥{money(s.total)}。
            </p>
          ) : null}
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
                    {s.pays.map((x, i) => (
                      <tr key={`${x.date}-${i}`}>
                        <td className="border border-black px-1 py-1">{x.date}</td>
                        <td className="border border-black px-1 py-1">{money(x.amount)}</td>
                        <td className="border border-black px-1 py-1">{receiverOf(x) === nameKey(s.person.name) ? "本人" : `${receiverOf(x)}代收`}</td>
                        <td className="border border-black px-1 py-1">{x.source}</td>
                        <td className="border border-black px-1 py-1 text-left">{x.remark}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="border border-black px-1 py-1 font-medium">已打款合计（本人）</td>
                      <td className="border border-black px-1 py-1 font-semibold">{money(s.paid)}</td>
                      <td className="border border-black px-1 py-1" colSpan={3}>
                        {showMonths ? `未打款 ¥${money(s.unpaidSelf)}` : ""}
                      </td>
                    </tr>
                    {s.collected ? (
                      <tr>
                        <td className="border border-black px-1 py-1" colSpan={5}>
                          另代收他人 ¥{money(s.collected)}，不计入本人应发、也不算本人已打款。
                        </td>
                      </tr>
                    ) : null}
                    {s.proxyOut ? (
                      <tr>
                        <td className="border border-black px-1 py-1" colSpan={5}>
                          其中本人名下 ¥{money(s.proxyOut)} 由他人代领（收款人非本人），按口径不算本人已打款，单列。
                        </td>
                      </tr>
                    ) : null}
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
      ))}
    </div>
  );
}

function QueryPage() {
  const store = useApp();
  const { year, people, attendance, attendanceDocs, payments, patchAttendanceDoc, removeAttendanceDocs } = store;
  const years = derivedYears(store);
  const yearOpts = years.length ? years : [year];
  const canEditPhotos = useCanSave("photos.edit");
  const canEditDocs = useCanSave("attendance.edit");
  const canPrint = useCan("query.print");
  const [scope, setScope] = React.useState<"person" | "team">("person");
  const [content, setContent] = React.useState<QueryContent>("attendance");
  const [team, setTeam] = React.useState("");
  const [name, setName] = React.useState("");
  const [selectedId, setSelectedId] = React.useState("");
  const [printIds, setPrintIds] = React.useState<string[]>([]);
  const [printMode, setPrintMode] = React.useState<"wage" | "both" | "pays">("both");
  const [showPicker, setShowPicker] = React.useState(false);
  const [printKind, setPrintKind] = React.useState<"query" | "slips">("query");
  const [printRequest, setPrintRequest] = React.useState(0);
  React.useEffect(() => { if (printRequest) window.print(); }, [printRequest]);
  const [fromY, setFromY] = React.useState(year);
  const [fromM, setFromM] = React.useState(1);
  const [fromD, setFromD] = React.useState(1);
  const [toY, setToY] = React.useState(year);
  const [toM, setToM] = React.useState(12);
  const [toD, setToD] = React.useState(31);
  const range = React.useMemo(() => queryRange(
    { year: fromY, month: fromM, day: fromD }, { year: toY, month: toM, day: toD },
  ), [fromY, fromM, fromD, toY, toM, toD]);
  const { span, startDate, endDate, swapped } = range;
  const rangeLabelText = rangeLabel(fromY, fromM, toY, toM);
  const paymentRangeLabel = `${startDate} 至 ${endDate}`;
  const results = React.useMemo(() => buildQueryResults({ people, attendance, payments, range }), [people, attendance, payments, range]);
  const matches = results.filter((row) => nameKey(row.person.name) === nameKey(name));
  const result = (selectedId ? matches.find((row) => row.person.id === selectedId) : undefined) || (matches.length === 1 ? matches[0] : undefined);
  const p = result?.person;
  const pays = result?.pays || [];
  const teams = groupBuckets(people.map((person) => person.team), "未分班组");
  const activeTeam = teams.some((bucket) => bucket.value === team) ? team : teams[0]?.value ?? "";
  const teamLabel = teams.find((bucket) => bucket.value === activeTeam)?.label || "未分班组";
  const teamSummary = React.useMemo(() => queryTeamResults(results, activeTeam, range.span), [results, activeTeam, range.span]);
  const printablePeople = scope === "team" ? teamSummary.members : results;
  const printableSelection = queryPrintResults(results, printIds, scope === "team" ? activeTeam : undefined);
  const slips = React.useMemo(() => buildQuerySlips(printableSelection), [printableSelection]);
  const effectiveSlips = slips.filter((slip) => printMode === "pays" ? slip.pays.length > 0 : printMode === "wage" ? slip.months.length > 0 : true);
  const selectedCount = printableSelection.length;
  function chooseScope(next: "person" | "team") {
    setScope(next);
    setPrintKind("query");
    setPrintIds([]);
    setShowPicker(false);
  }
  function showPerson(id: string) {
    const row = results.find((item) => item.person.id === id);
    if (!row) return;
    setName(row.person.name);
    setSelectedId(id);
    chooseScope("person");
  }
  return (
    <Need perm="query.view">
      <div className="space-y-6">
        <div className="no-print space-y-6">
          <header className="space-y-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">查询</h1>
              <p className="mt-1 text-sm text-muted">按个人或班组查询区间考勤、工资。考勤按整月统计，发放按起止日期筛选。</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-sm">
                <span className="block text-xs text-muted">查询方式</span>
                <select className="field-select w-auto" aria-label="查询方式" value={scope} onChange={(e) => chooseScope(e.target.value as "person" | "team")}>
                  <option value="person">按个人</option><option value="team">按班组</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="block text-xs text-muted">查询内容</span>
                <select className="field-select w-auto" aria-label="查询内容" value={content} onChange={(e) => { setContent(e.target.value as QueryContent); setPrintKind("query"); setShowPicker(false); }}>
                  <option value="attendance">考勤</option><option value="wage">工资</option>
                </select>
              </label>
              {scope === "team" ? (
                <label className="min-w-0 space-y-1 text-sm">
                  <span className="block text-xs text-muted">班组</span>
                  <select className="field-select max-w-full" aria-label="查询班组" value={activeTeam} onChange={(e) => { setTeam(e.target.value); setPrintKind("query"); setPrintIds([]); }}>
                    {teams.map((bucket) => <option key={bucket.value} value={bucket.value}>{bucket.label}</option>)}
                    {!teams.length ? <option value="">未分班组</option> : null}
                  </select>
                </label>
              ) : (
                <div className="flex min-w-0 max-w-full items-center gap-2">
                  <input list="query-people-list" aria-label="查询姓名" className="field-select min-w-0 w-48 max-w-full" value={name} placeholder="输入或选择姓名" onChange={(e) => { setName(e.target.value); setSelectedId(""); setPrintKind("query"); }} />
                  <datalist id="query-people-list">{people.map((person) => <option key={person.id} value={person.name}>{person.team || "未分班组"}</option>)}</datalist>
                  {name ? <Button variant="ghost" size="icon" className="size-9 shrink-0" type="button" onClick={() => { setName(""); setSelectedId(""); }} aria-label="清空姓名"><X className="size-4" /></Button> : null}
                </div>
              )}
            </div>
          </header>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
            <YmPick label="从" years={yearOpts} y={fromY} m={fromM} d={fromD} onY={setFromY} onM={setFromM} onD={content === "wage" ? setFromD : undefined} />
            <span className="pb-2 text-sm text-muted">到</span>
            <YmPick label="到" years={yearOpts} y={toY} m={toM} d={toD} onY={setToY} onM={setToM} onD={content === "wage" ? setToD : undefined} />
            <p className="w-full text-xs text-muted">考勤：{rangeLabelText}，按整月统计，共 {span.length} 个月{swapped ? "（起止已自动对调）" : ""}。{content === "wage" ? `发放：${paymentRangeLabel}，含起止当日。` : ""}</p>
          </div>
          {canPrint ? <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" type="button" disabled={scope === "team" ? !teamSummary.members.length : !result || result.ambiguous} onClick={() => { setPrintKind("query"); setPrintRequest((value) => value + 1); }}>打印查询结果</Button>
            <span className="text-xs text-muted">仅打印当前{scope === "team" ? `班组「${teamLabel}」` : "个人"}的{content === "wage" ? "工资" : "考勤"}核对清单。</span>
          </div> : null}
          {content === "wage" && canPrint ? (
            <section className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><h2 className="text-sm font-semibold">打印工资条</h2><p className="mt-1 text-xs text-muted">考勤 {rangeLabelText}；打款 {paymentRangeLabel}。{scope === "team" ? `仅限当前班组「${teamLabel}」。` : "可勾选人员与打印内容。"}</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowPicker((value) => !value)}>选择人员{selectedCount ? `（已选 ${selectedCount}）` : ""}<ChevronDown className={`size-3.5 transition-transform ${showPicker ? "rotate-180" : ""}`} /></Button>
                  <label className="inline-flex items-center gap-1.5 text-sm">打印<select className="field-select w-auto px-2 py-1.5" aria-label="工资条打印内容" value={printMode} onChange={(e) => setPrintMode(e.target.value as "wage" | "both" | "pays")}><option value="both">工资 + 打款记录</option><option value="wage">仅工资</option><option value="pays">仅打款记录</option></select></label>
                  <Button size="sm" type="button" onClick={() => {
                    if (!selectedCount) { toast.error("先勾选要打印的人"); return; }
                    if (!effectiveSlips.length) { toast.error(printMode === "pays" ? "所选人在该区间没有打款记录" : "所选人在该区间没有出勤或打款，没有工资条"); return; }
                    setPrintKind("slips");
                    setPrintRequest((value) => value + 1);
                  }}>打印工资条 {effectiveSlips.length} 张</Button>
                </div>
              </div>
              {showPicker ? <div className="mt-3 rounded-lg border border-line bg-bg-elevated p-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setPrintIds(printablePeople.filter((row) => !row.ambiguous).map((row) => row.person.id))}>全选{scope === "team" ? "本班组" : ""}</Button>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setPrintIds([])}>清空</Button>
                  {scope === "person" ? teams.map((bucket) => <Button key={bucket.value} variant="ghost" size="sm" type="button" onClick={() => setPrintIds(results.filter((row) => !row.ambiguous && inBucket(row.person.team, bucket.value)).map((row) => row.person.id))}>{bucket.label}</Button>) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {printablePeople.map((row) => <label key={row.person.id} className="inline-flex items-center gap-1.5"><input type="checkbox" className="size-4" disabled={row.ambiguous} checked={printableSelection.some((item) => item.person.id === row.person.id)} onChange={(e) => setPrintIds((ids) => e.target.checked ? [...new Set([...ids, row.person.id])] : ids.filter((id) => id !== row.person.id))} />{row.person.name}{row.ambiguous ? "（同名待核对）" : ""}</label>)}
                </div>
              </div> : null}
            </section>
          ) : null}
          {scope === "team" ? <TeamQueryResults summary={teamSummary} label={rangeLabelText} teamLabel={teamLabel} content={content} onPerson={showPerson} /> : p && result ? (
            <>
              {content === "wage" && !result.ambiguous ? <>
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
                <PhotoSlot name={p.name} kind="id" readOnly={!canEditPhotos} />
                <PhotoSlot name={p.name} kind="bank" readOnly={!canEditPhotos} />
                <PhotoSlot name={p.name} kind="ic" readOnly={!canEditPhotos} />
              </div>
              </> : <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-xl font-semibold">{p.name}</h2><Badge>{p.team?.trim() || "未分班组"}</Badge></div>}
              <PersonQueryResults result={result} label={rangeLabelText} content={content} />
              {content === "wage" && !result.ambiguous ? <>
              <section className="rounded-xl border border-line bg-surface p-4">
                <h3 className="text-sm font-semibold">{paymentRangeLabel} 相关发放</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {pays.length === 0 ? <li className="text-muted">该区间暂无</li> : null}
                  {pays.map((x) => (
                    <li key={x.id} className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
                      <span>
                        {x.date} · 实际收款人 {x.owner}
                        {isProxyReceiver(x) ? ` · ${receiverOf(x)}代收` : " · 本人收"}
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
                          readOnly={!canEditDocs}
                          suggest={`考勤-${d.year}年${d.month}月`}
                          taken={(attendanceDocs || []).map((x) => x.fileName)}
                          onReplaced={(name) => {
                            // 兜底（与人员页同写法）：DocActions 在只读账号下已隐藏「替换」，
                            // 万一 readOnly 传错也绝不让它一路写到服务端（那里必回 403）
                            if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
                            patchAttendanceDoc(d.id, { fileName: name });
                          }}
                          onDeleted={() => {
                            if (blockedWrite("attendance.edit", permLabel("attendance.edit"))) return;
                            removeAttendanceDocs([d.id]);
                          }}
                        />
                      </li>
                    ))}
                  {(attendanceDocs || []).filter((d) => span.some((x) => x.year === d.year && x.month === d.month)).length === 0 ? (
                    <li className="text-muted">该区间没有考勤影像。到「月度考勤」里上传。</li>
                  ) : null}
                </ul>
              </section>
              </> : null}
            </>
          ) : people.length === 0 ? <p className="text-sm text-muted">还没有人员。先在「人员」里添加。</p> : matches.length > 1 ? <p className="text-sm text-warn">人员档案存在同名，历史记录无法按姓名可靠区分。请先核对人员档案及历史记录。</p> : <p className="text-sm text-muted">{name ? "未找到该姓名，请选择已有人员。" : content === "attendance" ? "选择人员后显示出勤天数、加班小时和备注。" : "选择人员后显示工资、考勤、发放和影像；也可先选择人员打印工资条。"}</p>}
        </div>
        {canPrint && (printKind === "query" || content === "attendance") ? <QuerySheet content={content} label={rangeLabelText} paymentLabel={paymentRangeLabel} person={scope === "person" ? result : undefined} team={scope === "team" ? teamSummary : undefined} teamLabel={teamLabel} /> : null}
        {content === "wage" && canPrint && printKind === "slips" ? <PayslipSheets slips={effectiveSlips} rangeLabel={`考勤：${rangeLabelText}；打款：${paymentRangeLabel}`} printMode={printMode} /> : null}
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/query")({ component: QueryPage });
