/**
 * 操作记录「改动前 → 改动后」的**唯一序列化/截断实现**（业务评估 B17，1.8.15）。
 *
 * 问题（B17）：`store.ts` 里的操作记录只记「条数」或一句简短内容 ——
 * 「修改发放 3 条」「修改人员 张三」「保存月考勤 2026年8月 30人」。
 * 事后要回答「这笔钱当时是多少」「这个人的日工资从多少改成了多少」时**完全查不出来**：
 * 记了一个「改了」，但改前改后都没留下，误改误删无法凭记录重建。
 *
 * 口径（本文件是唯一实现，页面/组件**禁止**自己拼前后值字符串）：
 * - 只记**关键字段**（人员工资/班组/计薪方式/调薪历史条数、发放金额/日期/收款人、
 *   考勤出勤/加班/补助/扣款、合同金额/税率/状态、报销金额/数量/单价/状态…），不是整条 dump；
 * - 敏感字段（身份证、银行卡号）**只记「改过了」，不记值**（操作记录会被导出/分发）；
 * - 无变化时不写标记，`detail` 就是原来的摘要 —— 不产生噪音；
 * - 太长就截断并标注「…（另有 N 项）」，且总长受 `MAX_DIFF_CHARS` 约束：
 *   服务端 `POST /api/audit` 会把 detail 截到 400 字（`src/routes/api/audit.ts`），
 *   客户端先截到 300 字，避免在服务端被**拦腰截断**（那样最后一条会解析不出来）。
 *
 * 序列化格式（可读 + 可反解，`parseDetail` 是唯一反解实现）：
 *   `摘要⟪改动⟫金额：100.00 → 200.00；发放日期：待发放 → 2026-09-05`
 * 操作记录页（`src/routes/audit.tsx`）用 `parseDetail` 把它折成「改动前 → 改动后」明细。
 */
import { parseDateYmd } from "./dates";
import { money } from "./utils";
import { round2, wageLabel } from "./wage";
import type { ContractEntry, ContractRecord, Expense, Payment, Person } from "./types";

/** 改动明细的起始标记（唯一，操作记录页据此折叠展示） */
export const DIFF_MARK = "⟪改动⟫";
/** 一条改动内「前 → 后」的分隔符 */
export const DIFF_ARROW = " → ";
/** 字段之间 / 记录之间的分隔符 */
export const DIFF_GAP = "；";
/** 客户端截断上限：服务端 POST /api/audit 截 400 字，留足余量与摘要的空间 */
export const MAX_DIFF_CHARS = 300;

export interface FieldChange {
  /** 字段名（批量记录时带记录识别前缀，如「张三 金额」） */
  label: string;
  /** 改动前（已格式化；空值写成「（空）」） */
  before: string;
  /** 改动后 */
  after: string;
}

/* ＝＝ 格式化：金额/日期/文本各一处实现 ＝＝ */

/** 普通文本：空值写「（空）」，去掉换行与分号（否则会破坏反解） */
export function fmtText(v: unknown): string {
  const s = String(v ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/[；;]/g, "，")
    .trim();
  return s || "（空）";
}

/** 金额：先 round2 再千分位两位小数（与界面/打印同一口径） */
export function fmtMoney(v: unknown): string {
  const n = Number(v);
  return money(Number.isFinite(n) ? round2(n) : 0);
}

/** 日期：规范成 YYYY-MM-DD；空 = 待发放（发放日期专用） */
export function fmtDate(v: unknown): string {
  const raw = String(v ?? "").trim();
  if (!raw) return "待发放";
  return parseDateYmd(raw) || fmtText(raw);
}

/** 日期：空值写「（空）」（非发放日期用，例如合同明细日期 / 报销打款日期） */
export function fmtDateOrEmpty(v: unknown): string {
  const raw = String(v ?? "").trim();
  if (!raw) return "（空）";
  return parseDateYmd(raw) || fmtText(raw);
}

/** 计薪方式：day/month → 按天/按月 */
export function fmtPayType(v: unknown): string {
  return v === "month" ? "按月" : "按天";
}

/** 数量/条数这类数字 */
export function fmtNum(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "0";
}

/** 敏感字段（身份证 / 银行卡号）：**只记改过、不记值** */
export function fmtSensitive(v: unknown): string {
  return String(v ?? "").trim() ? "已填（值不记录）" : "（空）";
}

/** 数组类字段只记条数与最新一条的工资，避免整条 dump */
function fmtHistory(v: unknown): string {
  const list = Array.isArray(v) ? v : [];
  if (!list.length) return "0 条";
  const last = list[list.length - 1] as { dailyWage?: number; monthWage?: number } | undefined;
  const wage = last?.dailyWage ? `¥${fmtMoney(last.dailyWage)}/天` : last?.monthWage ? `¥${fmtMoney(last.monthWage)}/月` : "";
  return `${list.length} 条${wage ? `（最新 ${wage}）` : ""}`;
}

/* ＝＝ 对比：比较用**原始值**，显示用格式化值 ＝＝ */

export interface FieldSpec {
  key: string;
  label: string;
  /** 显示用格式化（默认 fmtText） */
  fmt?: (v: unknown) => string;
}

/** 原始值的比较键：数字按数值比（280 与 "280" 同值），其余按字符串 */
function rawKey(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v).trim();
}

/**
 * 按 spec 逐字段比较，**只返回变化的字段**（无变化 → 空数组，调用方据此不写标记）。
 * 比较用原始值（否则「280 → 280.4」格式化后都是 280.40，会被当成没改），显示用 fmt。
 */
export function compareFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  spec: readonly FieldSpec[],
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const f of spec) {
    const b = before?.[f.key];
    const a = after?.[f.key];
    if (rawKey(b) === rawKey(a)) continue;
    const fmt = f.fmt || fmtText;
    out.push({ label: f.label, before: fmt(b), after: fmt(a) });
  }
  return out;
}

/** 单条改动的文本：`金额：100.00 → 200.00` */
export function formatChange(c: FieldChange): string {
  return `${c.label}：${c.before}${DIFF_ARROW}${c.after}`;
}

/** 截断标注（写明还有几项没记进来） */
export function diffNote(dropped: number): string {
  return `…（另有 ${dropped} 项）`;
}

/**
 * 多条改动拼成一段文本；超出 `maxChars` 就截断并标注「…（另有 N 项）」。
 * 单条本身超长时按预算硬截断并标「…（已截断）」—— 绝不留一条**半截**的改动让人误读。
 */
export function formatChanges(changes: readonly FieldChange[], maxChars: number = MAX_DIFF_CHARS): string {
  if (!changes.length) return "";
  const parts: string[] = [];
  let used = 0;
  for (let i = 0; i < changes.length; i += 1) {
    let part = formatChange(changes[i]);
    const rest = changes.length - parts.length - 1;
    const budget = maxChars - (rest > 0 ? diffNote(rest).length + DIFF_GAP.length : 0);
    if (parts.length && used + part.length + DIFF_GAP.length > budget) {
      return parts.join(DIFF_GAP) + DIFF_GAP + diffNote(changes.length - parts.length);
    }
    if (part.length > budget) {
      part = `${part.slice(0, Math.max(0, budget - 6))}…（已截断）`;
      parts.push(part);
      return parts.join(DIFF_GAP);
    }
    parts.push(part);
    used += part.length + DIFF_GAP.length;
  }
  return parts.join(DIFF_GAP);
}

/**
 * 组装 `detail`：`摘要⟪改动⟫…`。
 * `changes` 为空 → 原样返回摘要（无变化时不产生噪音，也不写标记）。
 */
export function diffDetail(summary: string, changes: readonly FieldChange[], maxChars: number = MAX_DIFF_CHARS): string {
  const s = String(summary ?? "").trim();
  const body = formatChanges(changes, maxChars);
  return body ? `${s}${DIFF_MARK}${body}` : s;
}

/**
 * 反解 `detail`（唯一实现，操作记录页用它折叠展示）。
 * 没有标记 → `changes` 为空数组（兼容历史上只写摘要的旧记录）。
 */
export function parseDetail(detail: string): { summary: string; changes: FieldChange[] } {
  const raw = String(detail ?? "");
  const i = raw.indexOf(DIFF_MARK);
  if (i < 0) return { summary: raw, changes: [] };
  const summary = raw.slice(0, i);
  const changes: FieldChange[] = [];
  for (const part of raw.slice(i + DIFF_MARK.length).split(DIFF_GAP)) {
    const colon = part.indexOf("：");
    const arrow = part.indexOf(DIFF_ARROW);
    // 截断标注（「…（另有 N 项）」）没有箭头 → 不是一条改动，跳过（别把它当成字段）
    if (colon < 0 || arrow < 0 || arrow < colon) continue;
    changes.push({
      label: part.slice(0, colon).trim(),
      before: part.slice(colon + 1, arrow),
      after: part.slice(arrow + DIFF_ARROW.length),
    });
  }
  return { summary, changes };
}

/** 这条记录里有没有前后值（界面用：有才折成「改动前 → 改动后」） */
export function hasDiff(detail: string): boolean {
  return parseDetail(detail).changes.length > 0;
}

/**
 * 导出/纯文本场景的人话版本：`摘要｜金额 100.00→200.00；发放日期 待发放→2026-09-05`。
 * 导出的是给别人看的凭据，不该带序列化标记（标记只有写/读两端认识）。
 */
export function detailPlain(detail: string): string {
  const { summary, changes } = parseDetail(detail);
  if (!changes.length) return summary;
  return `${summary}｜${changes.map((c) => `${c.label} ${c.before}→${c.after}`).join(DIFF_GAP)}`;
}

/* ＝＝ 各实体的关键字段表（写操作记录时用；只列关键字段，不整条 dump） ＝＝ */

export const PERSON_SPEC: readonly FieldSpec[] = [
  { key: "name", label: "姓名" },
  { key: "team", label: "班组" },
  { key: "personNo", label: "工号" },
  { key: "payType", label: "计薪方式", fmt: fmtPayType },
  { key: "dailyWage", label: "日工资", fmt: fmtMoney },
  { key: "monthWage", label: "月工资", fmt: fmtMoney },
  { key: "otRule", label: "加班规则" },
  { key: "mealAllowance", label: "餐补/天", fmt: fmtMoney },
  { key: "wageHistory", label: "调薪历史", fmt: fmtHistory },
  { key: "phone", label: "电话" },
  // 敏感字段只记「改过了」，不记值：操作记录会被导出，也会给只读账号看
  { key: "idCard", label: "身份证", fmt: fmtSensitive },
  { key: "bank", label: "开户行" },
  { key: "cardNo", label: "银行卡号", fmt: fmtSensitive },
];

export const PAYMENT_SPEC: readonly FieldSpec[] = [
  { key: "amount", label: "金额", fmt: fmtMoney },
  { key: "date", label: "发放日期", fmt: fmtDate },
  { key: "receiver", label: "收款人" },
  { key: "owner", label: "实际收款人" },
  { key: "source", label: "发放方" },
];

export const CONTRACT_SPEC: readonly FieldSpec[] = [
  { key: "code", label: "合同编号" },
  { key: "name", label: "合同名称" },
  { key: "contractAmount", label: "合同金额", fmt: fmtMoney },
  { key: "taxRate", label: "税率%", fmt: fmtNum },
  { key: "reportTaxMode", label: "报量口径" },
  { key: "payRatio", label: "付款比例%", fmt: fmtNum },
  { key: "status", label: "状态" },
  { key: "prelimAmount", label: "初步结算金额", fmt: fmtMoney },
  { key: "settleReceivable", label: "结算应收", fmt: fmtMoney },
  { key: "depositAmount", label: "保证金金额", fmt: fmtMoney },
  { key: "manager", label: "项目经理" },
];

export const ENTRY_SPEC: readonly FieldSpec[] = [
  { key: "kind", label: "明细类型" },
  { key: "date", label: "日期", fmt: fmtDateOrEmpty },
  { key: "amount", label: "金额", fmt: fmtMoney },
  { key: "amountExcl", label: "不含税金额", fmt: fmtMoney },
  { key: "taxRate", label: "税率%", fmt: fmtNum },
  { key: "workerPay", label: "代付金额", fmt: fmtMoney },
  { key: "no", label: "单号" },
];

export const EXPENSE_SPEC: readonly FieldSpec[] = [
  { key: "name", label: "报销物品" },
  { key: "qty", label: "数量", fmt: fmtNum },
  { key: "price", label: "单价", fmt: fmtMoney },
  { key: "amount", label: "金额", fmt: fmtMoney },
  { key: "status", label: "状态" },
  { key: "claimant", label: "报销人" },
  { key: "payoutDate", label: "打款日期", fmt: fmtDateOrEmpty },
  { key: "payoutMethod", label: "打款方式" },
];

/* ＝＝ 记录级/批量级的快捷入口（store.ts 只调这些，不自己拼字符串） ＝＝ */

const asRow = (v: unknown): Record<string, unknown> => v as unknown as Record<string, unknown>;

export function personChanges(before: Person, after: Person): FieldChange[] {
  return compareFields(asRow(before), asRow(after), PERSON_SPEC);
}

export function paymentChanges(before: Payment, after: Payment): FieldChange[] {
  return compareFields(asRow(before), asRow(after), PAYMENT_SPEC);
}

export function contractChanges(before: ContractRecord, after: ContractRecord): FieldChange[] {
  return compareFields(asRow(before), asRow(after), CONTRACT_SPEC);
}

export function entryChanges(before: ContractEntry, after: ContractEntry): FieldChange[] {
  return compareFields(asRow(before), asRow(after), ENTRY_SPEC);
}

export function expenseChanges(before: Expense, after: Expense): FieldChange[] {
  return compareFields(asRow(before), asRow(after), EXPENSE_SPEC);
}

/** 给一批改动加记录识别前缀（如「张三 金额」），一条记录改了多个字段时能看出是谁改的 */
function prefixChanges(prefix: string, changes: FieldChange[]): FieldChange[] {
  if (!prefix) return changes;
  return changes.map((c) => ({ label: `${prefix} ${c.label}`, before: c.before, after: c.after }));
}

/**
 * 一批记录的前后对比（发放多选改写、按应发生成待发放…）：
 * 只保留**真的变了**的记录，label 带记录识别名（发放 = 实际收款人、考勤 = 姓名）。
 * 无任何变化 → 空数组（调用方写成纯摘要，不产生噪音）。
 */
export function batchChanges<T>(
  pairs: readonly { before: T; after: T }[],
  changesOf: (before: T, after: T) => FieldChange[],
  nameOf: (row: T) => string,
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const { before, after } of pairs) {
    out.push(...prefixChanges(nameOf(before), changesOf(before, after)));
  }
  return out;
}

/**
 * 删除类操作：**只记改动前**的关键信息（误删时凭这条记录知道删了什么、值是多少）。
 * 每条被删记录一条改动：`张三 2026-08-05：¥5,000.00 → 已删除`。
 */
export function deletedChanges<T>(
  rows: readonly T[],
  labelOf: (row: T) => string,
  valueOf: (row: T) => string,
): FieldChange[] {
  return rows.map((row) => ({ label: labelOf(row), before: valueOf(row), after: "已删除" }));
}

/** 发放记录的删除摘要（label = 实际收款人 + 日期，before = 金额） */
export function paymentDeletedChanges(rows: readonly Payment[]): FieldChange[] {
  return deletedChanges(
    rows,
    (p) => `${fmtText(p.owner)} ${p.date ? fmtDate(p.date) : "待发放"}`,
    (p) => `¥${fmtMoney(p.amount)}`,
  );
}

/** 人员记录的删除摘要（label = 姓名，before = 班组 + 工资） */
export function personDeletedChanges(rows: readonly Person[]): FieldChange[] {
  return deletedChanges(
    rows,
    (p) => fmtText(p.name),
    (p) => `${p.team || "未分班组"} ${wageLabel(p)}`,
  );
}

/** 报销记录的删除摘要（label = 报销物品，before = 报销人 + 金额 + 状态） */
export function expenseDeletedChanges(rows: readonly Expense[]): FieldChange[] {
  return deletedChanges(
    rows,
    (e) => fmtText(e.name),
    (e) => `${e.claimant || "未填报销人"} ¥${fmtMoney(e.amount)} ${e.status || ""}`.trim(),
  );
}

/* ＝＝ 考勤：一次保存是整月替换，只对比「同一个人同一个月」的变化 ＝＝ */

/** 考勤行的关键字段（按姓名关联；同月同一人可能有多行，先按姓名聚合成一个人的合计） */
export interface AttendanceDigest {
  name: string;
  days: number;
  otHours: number;
  allowance: number;
  deduction: number;
}

export type AttendanceLike = {
  name?: string;
  days?: number;
  otHours?: number;
  allowance?: number;
  deduction?: number;
};

const ATT_SPEC: readonly FieldSpec[] = [
  { key: "days", label: "出勤", fmt: fmtNum },
  { key: "otHours", label: "加班(小时)", fmt: fmtNum },
  { key: "allowance", label: "补助", fmt: fmtMoney },
  { key: "deduction", label: "扣款", fmt: fmtMoney },
];

/** 把一个月里的考勤行按姓名聚合成「一个人的合计」（同月多行与本项目其余口径一致：累加） */
export function digestAttendance(rows: readonly AttendanceLike[]): AttendanceDigest[] {
  const map = new Map<string, AttendanceDigest>();
  for (const r of rows) {
    const name = String(r.name ?? "").trim();
    if (!name) continue;
    const cur = map.get(name) || { name, days: 0, otHours: 0, allowance: 0, deduction: 0 };
    cur.days += Number(r.days) || 0;
    cur.otHours += Number(r.otHours) || 0;
    cur.allowance += Number(r.allowance) || 0;
    cur.deduction += Number(r.deduction) || 0;
    map.set(name, cur);
  }
  return [...map.values()];
}

/**
 * 月考勤的前后对比。
 * - **首次录入**（改动前一行都没有）→ 空数组：整月新增几十人不需要逐个记「（空）→ 26」，
 *   摘要里的「N 人」已经说明白了（没有对比基准时不产生噪音）；
 * - 之后每次保存：只列**真的变了**的人与字段；被删掉的人写「已删除」；新加的人写「（未录入）→ …」。
 */
export function attendanceChanges(
  beforeRows: readonly AttendanceLike[],
  afterRows: readonly AttendanceLike[],
): FieldChange[] {
  const before = digestAttendance(beforeRows);
  if (!before.length) return [];
  const after = digestAttendance(afterRows);
  const afterMap = new Map(after.map((r) => [r.name, r]));
  const out: FieldChange[] = [];
  for (const b of before) {
    const a = afterMap.get(b.name);
    if (!a) {
      out.push({
        label: b.name,
        before: `出勤 ${fmtNum(b.days)} / 加班 ${fmtNum(b.otHours)}`,
        after: "已删除",
      });
      continue;
    }
    out.push(...prefixChanges(b.name, compareFields(asRow(b), asRow(a), ATT_SPEC)));
  }
  const known = new Set(before.map((b) => b.name));
  for (const a of after) {
    if (known.has(a.name)) continue;
    out.push({
      label: a.name,
      before: "（未录入）",
      after: `出勤 ${fmtNum(a.days)} / 加班 ${fmtNum(a.otHours)}`,
    });
  }
  return out;
}
