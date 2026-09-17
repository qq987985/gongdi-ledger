/**
 * 「按应发生成待发放」的唯一实现（业务评估 B15，1.8.15）。
 *
 * 现场：30 个人发工资现在要开 30 次「新增发放」弹窗 + 30 次确认 ——
 * 而每个人的应发金额**系统已经算好了**（考勤 × 工资口径），用户只是要把这些金额
 * 一条条登记成「待发放」（日期留空），发钱时再补日期。
 *
 * ## 口径（全是复用，页面不许自己再算一遍）
 * - **应发**：`attendance-summary.ts` 的 `summarizeYear()` 里那一行 `yearPayAmt`
 *   （= 总览「应发合计」KPI、考勤页年度汇总逐行「全年」的同一份数字；工资金额走 wage.ts）；
 * - **已发**：同一行的 `paid`（本年所有填了发放日期的记录，按**实际收款人**计入、**含代发**，
 *   判定走 payments-stats.ts 的 `isPaid`，1.8.6 口径）；
 * - **本次要生成多少**：`应发 − 已发`（= 年度表的「未发」列）。这不是新算法，
 *   是把年度表那一行「未发」搬成待发放记录；
 * - **跳过**：① 该人该年**已经有待发放记录**（幂等 —— 重复点不会重复生成）；
 *   ② 「应发 − 已发 ≤ 0」（已结清 / 没有可发的）；③ 本年应发为 0（没录考勤或没设工资）。
 *
 * ## 年份归属
 * 无日期的待发放记录按**当前工作年**归集（`fallbackPayYear`，1.8.5 决策一），
 * 所以「该人该年有没有待发放」也按同一口径判断 —— 否则同一条记录两处看法不同。
 */
import { summarizeYear } from "./attendance-summary";
import { paymentsInYear } from "./dates";
import { isPending, nameKey, ownerKey } from "./payments-stats";
import { round2 } from "./wage";
import type { AttendanceRow, Payment, Person } from "./types";

/** 生成出来的待发放记录，默认不写备注（打印件上不该多出一句系统话） */
export interface PendingBatchItem {
  /** 实际收款人（= 人员姓名，入库前已 trim） */
  owner: string;
  /** 班组（预览里好认人） */
  team: string;
  /** 本年应发（= 年度表该行「全年」） */
  should: number;
  /** 本年已发（按实际收款人，含代发） */
  paid: number;
  /** 本次生成的待发放金额 = round2(should − paid) */
  amount: number;
}

export interface PendingBatchPlan {
  /** 依据的年份（= 当前工作年） */
  year: number;
  /** 将新增的记录（按人员表顺序） */
  items: PendingBatchItem[];
  /** 将新增的合计金额 */
  total: number;
  /** 该年已有待发放记录的人（幂等跳过） */
  hasPending: string[];
  /** 应发 − 已发 ≤ 0：已结清 / 没有可发的（跳过） */
  settled: string[];
  /** 本年应发为 0：没录考勤或没设工资（跳过） */
  noShould: string[];
  /** 被当前搜索（关键词）排除在外的人 */
  filteredOut: number;
  /** 参与判定的人数（items + hasPending + settled + noShould + filteredOut） */
  headcount: number;
}

export interface PendingBatchInput {
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  /** 依据的年份（当前工作年） */
  year: number;
  /** 无日期记录的归集年份（= 当前工作年；与 `fallbackPayYear` 同口径） */
  fallbackYear?: number;
  /** 当前搜索关键词：非空时只生成姓名包含它的人（与列表筛选同口径：`includes`） */
  q?: string;
  /** 差额小于等于这个数就算已结清（分以下视为 0，避免浮点尾数生成 0.0001 元的记录） */
  minAmount?: number;
}

/**
 * 出「按应发生成待发放」的预览计划（**纯函数**，不写任何数据）。
 * 页面拿它渲染预览，确认后才调 store 落盘。
 */
export function planPendingBatch(input: PendingBatchInput): PendingBatchPlan {
  const { people, attendance, payments, year } = input;
  const fallbackYear = input.fallbackYear ?? year;
  const q = (input.q || "").trim();
  const minAmount = Number.isFinite(input.minAmount) ? Number(input.minAmount) : 0.005;

  // 应发/已发一行一处实现：与总览 KPI、考勤页年度表共用 summarizeYear
  const summary = summarizeYear({ people, attendance, payments, year, fallbackYear });
  const rowByName = new Map(summary.rows.map((r) => [nameKey(r.person.name), r]));
  // 该年「已经有待发放记录」的人（无日期 → 按 fallbackYear 归集，与上面同口径）
  const pendingOwners = new Set(
    paymentsInYear(payments, year, fallbackYear)
      .filter(isPending)
      .map((p) => ownerKey(p))
      .filter(Boolean),
  );

  const plan: PendingBatchPlan = {
    year,
    items: [],
    total: 0,
    hasPending: [],
    settled: [],
    noShould: [],
    filteredOut: 0,
    headcount: 0,
  };

  // 同名只算一次：重名在 store 层是被拒绝的，但 Excel 导入的脏数据可能带进来 ——
  // 真出现重名时按名字生成两次，等于把这笔钱记两遍（宁可少一条也不重复记账）。
  const seen = new Set<string>();
  for (const person of people) {
    const name = nameKey(person.name);
    if (!name) continue; // 空姓名（脏数据）：跳过，不生成无名记录
    if (seen.has(name)) continue;
    seen.add(name);
    if (q && !name.includes(q)) {
      plan.filteredOut += 1;
      continue;
    }
    plan.headcount += 1;
    const row = rowByName.get(name);
    const should = row ? row.yearPayAmt : 0;
    const paid = row ? row.paid : 0;
    if (should <= 0) {
      plan.noShould.push(name);
      continue;
    }
    if (pendingOwners.has(name)) {
      plan.hasPending.push(name);
      continue;
    }
    const amount = round2(should - paid);
    if (amount <= minAmount) {
      plan.settled.push(name);
      continue;
    }
    plan.items.push({ owner: name, team: person.team || "", should, paid, amount });
  }

  plan.total = round2(plan.items.reduce((s, x) => s + x.amount, 0));
  return plan;
}

/** 计划里需要如实告知用户的跳过原因（预览与「已生成」提示共用同一句，不许各写一套） */
export function planSkipNote(plan: PendingBatchPlan): string {
  const parts: string[] = [];
  if (plan.hasPending.length) parts.push(`已有待发放记录 ${plan.hasPending.length} 人（不重复生成）`);
  if (plan.settled.length) parts.push(`应发已结清 ${plan.settled.length} 人`);
  if (plan.noShould.length) parts.push(`本年无应发 ${plan.noShould.length} 人`);
  if (plan.filteredOut) parts.push(`不在当前搜索范围 ${plan.filteredOut} 人`);
  return parts.join(" · ");
}

/** 把计划转成待落盘的发放记录（日期留空 = 待发放；金额已 round2） */
export function pendingPaymentsOf(
  plan: PendingBatchPlan,
  opts: { source?: string; remark?: string } = {},
): { owner: string; receiver: string; date: string; amount: number; source: string; remark: string }[] {
  const source = (opts.source || "").trim();
  const remark = (opts.remark || "").trim();
  return plan.items.map((it) => ({
    owner: it.owner,
    receiver: it.owner, // 待发放还没定谁领：收款人先按本人（与「空则同实际收款人」同口径，写死更好核对）
    date: "", // 留空 = 待发放
    amount: it.amount,
    source,
    remark,
  }));
}
