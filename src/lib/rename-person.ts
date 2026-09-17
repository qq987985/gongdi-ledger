import type { AttendanceRow, Expense, InsuranceMember, Payment, Person } from "./types";
// 姓名比较键的唯一实现（A-1，1.8.14）：改名判断「同名冲突」等比较都走 nameKey，
// 不在本文件再养一份 trim()（同一套口径两处实现正是 A-1 的根因）
import { nameKey } from "./receiver";

/**
 * 「人员改名」的**唯一实现**（F3 / A14）。
 *
 * 出问题的现状：`store.upsertPerson` 只改了 `people` 数组里的姓名，而考勤
 * （`attendance.name`）、发放（`payments.owner`，以及 `receiver` 恰好写成旧名的代收）
 * 都是**按姓名**关联的。改完名字这两处就和新姓名脱钩：年度表该人应发变 0、
 * 多出一行「未发 = -已发」的负数、工资条里按姓名也查不到人。
 *
 * 所以改名是一个**事务**：姓名 + 所有按姓名键控的记录一起改，或者全都不改（同名冲突时拒绝）。
 * 只动结构化姓名字段，**不碰 remark 等自由文本**（那句「和张三一起干」不该跟着改）。
 */

export interface RenameCounts {
  /** 跟着改名的考勤行数 */
  attendance: number;
  /** 跟着改名的发放笔数（owner 或 receiver 命中旧名） */
  payments: number;
  /** 其中靠 receiver 命中（代收 = 旧名）的笔数 */
  receivers: number;
  /** 跟着改名的参保人（保险清单与保费按人统计，ins成员 .name） */
  insuranceMembers: number;
  /** 跟着改名的报销人（expenses.claimant；**不动** expenses.name = 报销物品名） */
  expenses: number;
}

export interface RenamePlan {
  ok: boolean;
  /** 失败原因（同名冲突 / 姓名空 / 人员不存在），成功时为空 */
  error?: string;
  oldName: string;
  newName: string;
  counts: RenameCounts;
  /** 改名后的考勤（未改动时是原数组本身） */
  attendance: AttendanceRow[];
  /** 改名后的发放（未改动时是原数组本身） */
  payments: Payment[];
  /** 改名后的参保人（未改动时是原数组本身） */
  insuranceMembers: InsuranceMember[];
  /** 改名后的报销（只改了 claimant；未改动时是原数组本身） */
  expenses: Expense[];
}

export interface RenameInput {
  people: Person[];
  attendance: AttendanceRow[];
  payments: Payment[];
  /** 可选：保险参保人（按姓名关联） */
  insuranceMembers?: InsuranceMember[];
  /** 可选：报销（只按 claimant = 报销人 关联） */
  expenses?: Expense[];
}

const NO_COUNTS: RenameCounts = { attendance: 0, payments: 0, receivers: 0, insuranceMembers: 0, expenses: 0 };

function fail(error: string, oldName = "", newName = "", input?: RenameInput): RenamePlan {
  return {
    ok: false,
    error,
    oldName,
    newName,
    counts: { ...NO_COUNTS },
    attendance: input ? input.attendance : [],
    payments: input ? input.payments : [],
    insuranceMembers: input?.insuranceMembers || [],
    expenses: input?.expenses || [],
  };
}

export function planRenamePerson(input: RenameInput, id: string, rawName: string): RenamePlan {
  const target = input.people.find((p) => p.id === id);
  const newName = nameKey(rawName);
  if (!target) return fail("人员不存在（可能已被删除），没有改动任何数据", "", newName, input);
  const oldName = nameKey(target.name);
  if (!newName) return fail("姓名不能为空，没有改动任何数据", oldName, newName, input);
  if (newName === oldName)
    return {
      ok: true,
      oldName,
      newName,
      counts: { ...NO_COUNTS },
      attendance: input.attendance,
      payments: input.payments,
      insuranceMembers: input.insuranceMembers || [],
      expenses: input.expenses || [],
    };
  // 同名冲突必须拦住：姓名是考勤/发放/参保人/报销人的关联键，重名会把两个人的记录混成一份
  const clash = input.people.some((p) => p.id !== id && nameKey(p.name) === newName);
  if (clash)
    return fail(
      `已有同名人员「${newName}」，改名已取消（考勤、发放、参保人、报销人里的姓名都没动）。请先给另一人改名，或换一个名字。`,
      oldName,
      newName,
      input,
    );

  let attendanceCount = 0;
  const attendance = input.attendance.map((a) => {
    if (nameKey(a.name) !== oldName) return a;
    attendanceCount += 1;
    return { ...a, name: newName };
  });
  let payments = 0;
  let receivers = 0;
  const nextPayments = input.payments.map((p) => {
    const ownerHit = nameKey(p.owner) === oldName;
    const receiverHit = nameKey(p.receiver) === oldName;
    if (!ownerHit && !receiverHit) return p;
    payments += 1;
    if (receiverHit) receivers += 1;
    return { ...p, owner: ownerHit ? newName : p.owner, receiver: receiverHit ? newName : p.receiver };
  });

  // 参保人（保险清单 / 保费按人统计）：姓名按人关联，改名必须一起改
  const membersIn = input.insuranceMembers || [];
  let memberCount = 0;
  const nextMembers = membersIn.map((m) => {
    if (nameKey(m.name) !== oldName) return m;
    memberCount += 1;
    return { ...m, name: newName };
  });
  // 报销人（expenses.claimant）。注意：expenses.name 是**报销物品名**，不是人，绝不能动
  const expensesIn = input.expenses || [];
  let expenseCount = 0;
  const nextExpenses = expensesIn.map((e) => {
    if (nameKey(e.claimant) !== oldName) return e;
    expenseCount += 1;
    return { ...e, claimant: newName };
  });

  return {
    ok: true,
    oldName,
    newName,
    counts: { attendance: attendanceCount, payments, receivers, insuranceMembers: memberCount, expenses: expenseCount },
    attendance: attendanceCount ? attendance : input.attendance,
    payments: payments ? nextPayments : input.payments,
    insuranceMembers: memberCount ? nextMembers : membersIn,
    expenses: expenseCount ? nextExpenses : expensesIn,
  };
}

/** 改名后的人员数组（其它字段原样保留） */
export function applyRenameToPeople(people: Person[], id: string, newName: string): Person[] {
  return people.map((p) => (p.id === id ? { ...p, name: nameKey(newName) } : p));
}

/** 操作记录里那句「张三 → 张三丰（同步 3 条考勤 / 2 笔发放 / 1 位参保人 / 2 条报销人）」 */
export function renameLogDetail(plan: RenamePlan): string {
  const parts = [`同步 ${plan.counts.attendance} 条考勤`, `${plan.counts.payments} 笔发放`];
  if (plan.counts.receivers) parts.push(`其中 ${plan.counts.receivers} 笔是代收人`);
  if (plan.counts.insuranceMembers) parts.push(`${plan.counts.insuranceMembers} 位参保人`);
  if (plan.counts.expenses) parts.push(`${plan.counts.expenses} 条报销人`);
  return `${plan.oldName} → ${plan.newName}（${parts.join(" / ")}）`;
}
