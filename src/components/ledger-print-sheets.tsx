/**
 * 三处新增打印入口的打印件（B16，1.8.15）：考勤月表 / 全年月表 / 年度工资汇总 / 人员名单。
 *
 * 它们和发放清单、报销单、合同对账单、保险清单共用一个打印协议
 * —— 规则只在 `src/styles.css` 的「打印分页协议」那一处写，组件里不许自己再写一套
 * （守卫：`tests/ui-guards.test.ts`）。本文件遵守的几条：
 *  · 屏幕内容由页面用 `.no-print` 包住，这些打印件是 `.print-only`（屏幕态 `display:none`），
 *    页面把它们渲染在 `.no-print` 包裹**之外**；
 *  · 表格必须有 `<thead>`（`.print-only thead { display: table-header-group }` → 第 2 页起照样有表头），
 *    合计只放 `<tfoot>`（1.8.11：`tfoot` 显式改成普通行组，否则整单合计会在每页页脚重复）；
 *  · **单据抬头写进 `<thead>` 第一行**（哪年哪月 / 哪一年度汇总 / 哪位人员名单）：
 *    表头跨页重复，用户把纸裁开分发时，续页也认得出这是哪张单；
 *  · 不许出现容器级 `break-inside-avoid`、不许 `break-before: page`、不许一屏高的容器；
 *    「一条 = 一个月份」的全年月表用 `.print-doc`（整块放得下就与上一块并排塞满、放不下才另起一页）；
 *  · **数据全部由页面传进来**：这里只做排版与 `money()`/`wageLabel()` 这类格式化，
 *    不做任何汇总计算（合计也是页面把 `monthTotals()` / `summarizeYear()` 的结果传进来）。
 */
import { localToday } from "~/lib/dates";
import { overAgeLabel } from "~/lib/idcard";
import { MONTH_SHEET_COLS, PAYROLL_COLS, ROSTER_COLS, YEAR_MONTHS_COLS } from "~/lib/print-cols";
import { parseOtRule, wageLabel } from "~/lib/wage";
import { money } from "~/lib/utils";
import type { MonthSheetTable, MonthTotals } from "~/lib/attendance-month";
import type { YearPersonRow } from "~/lib/attendance-summary";
import type { Person } from "~/lib/types";

/** 列宽百分比（colgroup 用）：不在 JSX 里写模板字符串，避免嵌套反引号 */
const PCT = (w: number): string => `${w}%`;

/** 纸上统一的格子样式（边框细、字号小：打印机上省纸 = 少分页，见 styles.css ②d/②e） */
const TD = "border border-black px-1 py-1";
const TH = `${TD} font-medium`;
/** 单据抬头那一行的格子（1.8.11：跨页重复，裁开也认得出） */
const CAPTION = `${TD} text-left font-semibold`;

/** 本月月表的行：与屏幕月表同列同值（屏幕页脚那份 `calcRows`，页面映射后传进来） */
export interface MonthSheetRow {
  name: string;
  team: string;
  days: number;
  otHours: number;
  allowance: number;
  deduction: number;
  remark: string;
  wageLabel: string;
  ot: number;
  meal: number;
  pay: number;
}

/** 页面交给打印件的整份月表数据（rows 与 totals 与屏幕同一份，`dirty` 用来在纸上写明「含未保存的修改」） */
export interface MonthSheetData {
  rows: MonthSheetRow[];
  totals: MonthTotals;
  dirty: boolean;
}

/** 本月考勤月表（考勤页 → 某个月 →「打印月表」） */
export function AttendanceMonthSheet({
  year,
  month,
  rows,
  totals,
  dirty,
}: {
  year: number;
  month: number;
  rows: MonthSheetRow[];
  totals: MonthTotals;
  dirty: boolean;
}) {
  if (!rows.length) return null;
  const today = localToday();
  const heads = [
    "序号",
    "姓名",
    "班组",
    "出勤天数",
    "加班小时",
    "补助",
    "扣款",
    "工资（人员表）",
    "加班费",
    "餐补",
    "应发",
    "备注",
  ];
  return (
    <div className="print-only text-black">
      <article className="statement border border-black p-4">
        <header className="border-b border-black pb-2 text-center">
          <div className="text-xl font-semibold tracking-widest">
            {year} 年 {month} 月考勤月表
          </div>
          <div className="mt-1 text-[11px]">
            与屏幕「{year}年{month}月考勤」月表同一份数据{dirty ? "（含未保存的修改）" : ""}：
            出勤天数、加班小时、补助、扣款、工资（人员表）与应发都取自同一套计算。
            加班规则（按小时 / 折算）请看屏幕月表或人员表 —— 这一格文字长、上纸只会把整张表挤到第二页。
          </div>
        </header>
        <table className="mt-3 w-full table-fixed border-collapse text-center text-[10px]">
          {/* 列宽必须加满 100% 且不许溢出纸面（打印纸不能横向滚动）：lib/print-cols.ts 一处定义 */}
          <colgroup>
            {MONTH_SHEET_COLS.map((w, i) => (
              <col key={i} style={{ width: PCT(w) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={CAPTION} colSpan={heads.length}>
                {year}年{month}月 · 本表 {totals.people} 人
              </th>
            </tr>
            <tr>
              {heads.map((h) => (
                <th key={h} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.name}__${i}`}>
                <td className={TD}>{i + 1}</td>
                <td className={TD}>{r.name}</td>
                <td className={TD}>{r.team || "—"}</td>
                <td className={TD}>{r.days}</td>
                <td className={TD}>{r.otHours}</td>
                <td className={TD}>{money(r.allowance)}</td>
                <td className={TD}>{money(r.deduction)}</td>
                <td className={TD}>{r.wageLabel}</td>
                <td className={TD}>{money(r.ot)}</td>
                <td className={TD}>{money(r.meal)}</td>
                <td className={`${TD} font-medium`}>{money(r.pay)}</td>
                <td className={`${TD} text-left`}>{r.remark || ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className={TD} colSpan={3}>
                合计 {totals.people} 人
              </td>
              <td className={TD}>{totals.days}</td>
              <td className={TD} />
              <td className={TD}>{money(totals.allowance)}</td>
              <td className={TD}>{money(totals.deduction)}</td>
              <td className={TD} />
              <td className={TD}>{money(totals.ot)}</td>
              <td className={TD}>{money(totals.meal)}</td>
              <td className={TD}>{money(totals.pay)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}

/** 全年月表（考勤页 → 年度总览 →「打印全年月表」）：每月一块，只搬年度汇总里的数字 */
export function AttendanceMonthsYearSheet({
  year,
  tables,
  peopleCount,
  filledMonths,
}: {
  year: number;
  tables: MonthSheetTable[];
  peopleCount: number;
  filledMonths: number;
}) {
  if (!tables.length) return null;
  const today = localToday();
  const heads = ["序号", "姓名", "班组", "出勤天数", "加班小时", "应发（元）"];
  return (
    <div className="print-only text-black">
      <article className="statement border border-black p-4">
        <header className="border-b border-black pb-2 text-center">
          <div className="text-xl font-semibold tracking-widest">{year} 年 · 全年月表（分月）</div>
          <div className="mt-1 text-sm">
            在册 {peopleCount} 人 · 已录入 {filledMonths} / 12 个月
          </div>
          <div className="mt-0.5 text-[11px]">
            每月一块，只列该月有出勤/加班记录的人；出勤天数、加班小时、应发与屏幕「{year}年度工资汇总 / 工天加班汇总」
            是同一份数据，纸上不另算。
          </div>
        </header>
        {/* 「一条 = 一个月」：整块放得下就与上一块并排塞满，放不下才整块去下一页（.print-doc，1.8.12 口径）；
            某个月的人特别多时允许这一块自己跨页续排，表头（含月份抬头）每页重复。 */}
        {tables.map((t) => (
          <section key={t.month} className="mt-3 print-doc">
            <table className="w-full table-fixed border-collapse text-center text-xs">
              <colgroup>
                {YEAR_MONTHS_COLS.map((w, i) => (
                  <col key={i} style={{ width: PCT(w) }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className={CAPTION} colSpan={heads.length}>
                    {year}年{t.month}月 · 考勤月表 · 本表 {t.rows.length} 人
                  </th>
                </tr>
                <tr>
                  {heads.map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, i) => (
                  <tr key={`${r.name}__${i}`}>
                    <td className={TD}>{i + 1}</td>
                    <td className={TD}>{r.name}</td>
                    <td className={TD}>{r.team || "—"}</td>
                    <td className={TD}>{r.days}</td>
                    <td className={TD}>{r.otHours}</td>
                    <td className={TD}>{money(r.pay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}

/**
 * 年度工资汇总（考勤页 → 年度总览 →「打印年度工资汇总」）。
 * 每一项都由页面从 `summarizeYear()` 的结果传进来（与屏幕同一份）：
 * 逐行 全年应发 / 已发（含代发）/ 未发 / 备注，表尾合计 = 屏幕统计行里的应发合计、已发放、未发。
 * 12 个月的应发明细在屏幕上是横向滚动表（A4 竖版放不下 12 列，硬塞会把数字折成两行），
 * 要按月看请用「打印全年月表」—— 抬头里也写了这句。
 */
export function PayrollYearSheet({
  year,
  rows,
  peopleCount,
  filledMonths,
  should,
  paid,
  proxyAmt,
  proxyCount,
  pendingAmt,
  unpaidTotal,
  offRows,
}: {
  year: number;
  rows: YearPersonRow[];
  peopleCount: number;
  filledMonths: number;
  /** 应发合计（summarizeYear.should，屏幕统计行） */
  should: number;
  /** 已发放（含代发，summarizeYear.paid，屏幕统计行） */
  paid: number;
  /** 其中代发（已发的子集，不减已发） */
  proxyAmt: number;
  proxyCount: number;
  /** 待发放（不计入已发） */
  pendingAmt: number;
  /** 未发合计 = 应发合计 − 已发放（屏幕统计行同值） */
  unpaidTotal: number;
  /** 发给本年没有考勤记录的人（屏幕上的提示，决策二的安全网） */
  offRows: { count: number; amount: number };
}) {
  if (!rows.length) return null;
  const today = localToday();
  const heads = ["序号", "姓名", "班组", "全年应发（元）", "已发（元）", "未发（元）", "备注"];
  return (
    <div className="print-only text-black">
      <article className="statement border border-black p-4">
        <header className="border-b border-black pb-2 text-center">
          <div className="text-xl font-semibold tracking-widest">{year} 年度工资汇总</div>
          <div className="mt-1 text-sm">
            {peopleCount} 人在册 · 已录入 {filledMonths} / 12 个月
          </div>
          <div className="mt-0.5 text-[11px] font-medium">
            本年应发 ¥{money(should)} · 已发放 ¥{money(paid)}（含代发
            {proxyCount ? `，其中代发 ¥${money(proxyAmt)}（${proxyCount} 笔）` : ""}） · 未发 ¥{money(unpaidTotal)} ·
            待发放 ¥{money(pendingAmt)}
          </div>
          <div className="mt-0.5 text-[11px]">
            口径与屏幕「{year}年度工资汇总」一致：已发按实际收款人计入、含代发；待发放不计入已发。
            12 个月的应发明细在屏幕上是横向表，要按月看请用考勤页的「打印全年月表」。
          </div>
          {offRows.count ? (
            <div className="mt-0.5 text-[11px]">
              另有 {offRows.count} 笔 ¥{money(offRows.amount)} 发给本年没有考勤记录的人（不列入下表）。
            </div>
          ) : null}
        </header>
        <table className="mt-3 w-full table-fixed border-collapse text-center text-xs">
          <colgroup>
            {PAYROLL_COLS.map((w, i) => (
              <col key={i} style={{ width: PCT(w) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={CAPTION} colSpan={heads.length}>
                {year} 年 · 应发 / 已发 / 未发 汇总 · 本表 {rows.length} 人
              </th>
            </tr>
            <tr>
              {heads.map((h) => (
                <th key={h} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.person.id}>
                <td className={TD}>{i + 1}</td>
                <td className={TD}>{r.person.name}</td>
                <td className={TD}>{r.person.team || "—"}</td>
                <td className={TD}>{money(r.yearPayAmt)}</td>
                <td className={TD}>{money(r.paid)}</td>
                <td className={TD}>{money(r.unpaid)}</td>
                <td className={`${TD} text-left`}>{r.remark || ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className={TD} colSpan={3}>
                合计 {rows.length} 人
              </td>
              <td className={TD}>{money(should)}</td>
              <td className={TD}>{money(paid)}</td>
              <td className={TD}>{money(unpaidTotal)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}

/**
 * 人员名单（人员页 →「打印人员名单」）。
 * 列与屏幕人员表一致（计薪 / 工资 / 加班规则 / 餐补 / 年龄都走同一批 lib 函数：wageLabel、
 * parseOtRule、overAgeLabel），筛选条件与人数写在抬头里。
 * **故意不印身份证号、银行卡号与证件照份数**：纸面会贴墙、会交出去流转，敏感字段不上纸
 * （名单里给名字 + 工号 + 电话足够现场认人）；屏幕上有的数字也没少印在别处，只是不放进这份名单。
 */
export function PeopleRosterSheet({
  rows,
  filterText,
  total,
}: {
  rows: Person[];
  filterText: string;
  total: number;
}) {
  if (!rows.length) return null;
  const today = localToday();
  const heads = ["序号", "姓名", "工号", "班组", "计薪", "工资", "加班", "餐补", "年龄", "电话", "备注"];
  return (
    <div className="print-only text-black">
      <article className="statement border border-black p-4">
        <header className="border-b border-black pb-2 text-center">
          <div className="text-xl font-semibold tracking-widest">人员名单</div>
          <div className="mt-1 text-sm">
            范围：{filterText} · 共 {total} 人
          </div>
          <div className="mt-0.5 text-[11px]">
            计薪/工资/加班规则/餐补/年龄取自人员档案（与屏幕同一套显示口径）；男 ≥55、女 ≥45 岁在备注标「超龄」。
            本表不含身份证号与银行卡号。
          </div>
        </header>
        <table className="mt-3 w-full table-fixed border-collapse text-center text-[10px]">
          <colgroup>
            {ROSTER_COLS.map((w, i) => (
              <col key={i} style={{ width: PCT(w) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={CAPTION} colSpan={heads.length}>
                人员名单 · {filterText} · 共 {total} 人
              </th>
            </tr>
            <tr>
              {heads.map((h) => (
                <th key={h} className={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id}>
                <td className={TD}>{i + 1}</td>
                <td className={TD}>{p.name}</td>
                <td className={TD}>{p.personNo || "—"}</td>
                <td className={TD}>{p.team || "—"}</td>
                <td className={TD}>{p.payType === "month" ? "按月" : "按工天"}</td>
                <td className={TD}>{wageLabel(p)}</td>
                <td className={TD}>{parseOtRule(p.otRule).label}</td>
                <td className={TD}>{p.mealAllowance ? `¥${p.mealAllowance}/天` : "—"}</td>
                <td className={TD}>{p.age ?? "—"}</td>
                <td className={TD}>{p.phone || "—"}</td>
                <td className={`${TD} text-left`}>{overAgeLabel(p.age, p.gender) === "超龄" ? "超龄" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-right text-xs">打印日期 {today}</p>
      </article>
    </div>
  );
}
