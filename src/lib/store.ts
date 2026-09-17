import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { uid } from "./utils";
import { numOrWarn } from "./num";
import { normalizeIdDate, parseIdCard } from "./idcard";
import { derivedYears, nextYear, localToday } from "./dates";
import { normalizeEntry, splitLegacyReceipts, type ContractEntry, type ContractRecord } from "./contracts";
import { logOp } from "./audit";
import { applyRenameToPeople, planRenamePerson, renameLogDetail, type RenameCounts } from "./rename-person";
import { runMuted } from "./sync-mute";
// 姓名比较键的唯一实现（A-1）：姓名是考勤 / 发放 / 人员表之间的关联键，**入库一律 trim** ——
// 否则「张三 」与「张三」在年度表里会变成两行（一行「未发 = 全额」、一行「未发 = 负数」）
import { nameKey } from "./receiver";
import type { AttendanceDoc, AttendanceRow, Expense, InsuranceMember, InsurancePolicy, LedgerState, Payment, Person } from "./types";
import { LEDGER_SCHEMA_VERSION } from "./types";

/**
 * 外部输入数值（表单 / Excel / 旧版持久化数据）统一入口：
 * 用 num.numOrWarn 容错解析（千分位、货币符号、全角数字、单位后缀、括号负数），
 * 读不出来才按 0，并 warn 留痕 —— 不再用 `Number(x) || 0` 把「1,200」静默写成 0。
 */
const numIn = (v: unknown, what: string): number => numOrWarn(v, 0, what);

export function emptyState(): LedgerState {
  const year = 2026;
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    year,
    years: [year],
    people: [],
    attendance: [],
    attendanceDocs: [],
    payments: [],
    contracts: [],
    contractEntries: [],
    expenses: [],
    insurancePolicies: [],
    insuranceMembers: [],
    accessHash: "",
    uiStyle: "classic",
  };
}

function person(partial: Partial<Person> & { name: string }): Person {
  const parsed = parseIdCard(partial.idCard || "");
  return {
    id: uid(),
    name: partial.name,
    team: partial.team || "",
    personNo: partial.personNo || "",
    idCard: partial.idCard || "",
    gender: parsed.gender || partial.gender || "",
    age: parsed.age,
    birthday: parsed.birthday || "",
    phone: partial.phone || "",
    dailyWage: partial.dailyWage || 0,
    monthWage: partial.monthWage || 0,
    payType: partial.payType === "month" ? "month" : "day",
    otRule: partial.otRule || "",
    mealAllowance: partial.mealAllowance || 0,
    wageHistory: [],
    bank: partial.bank || "",
    cardNo: partial.cardNo || "",
    address: partial.address || "",
    idIssuer: partial.idIssuer || "",
    idValidFrom: normalizeIdDate(partial.idValidFrom),
    idValidTo: normalizeIdDate(partial.idValidTo, true),
    remark: partial.remark || "示例人员，可删",
  };
}

function att(
  year: number,
  month: number,
  name: string,
  team: string,
  days: number,
  otHours: number,
  allowance = 0,
  deduction = 0,
): AttendanceRow {
  return { id: uid(), year, month, name, team, days, otHours, allowance, deduction, remark: "" };
}

function pay(
  owner: string,
  receiver: string,
  date: string,
  amount: number,
  source: string,
  remark: string,
): Payment {
  return { id: uid(), owner, receiver, date, amount, source, remark };
}

/** 两个完整示例，方便核对人员 / 考勤 / 代收 / 查询 */
export function demoState(): LedgerState {
  const people = [
    person({
      name: "张三",
      team: "一班",
      personNo: "DEMO001",
      idCard: "110101199001011210",
      phone: "13800001234",
      dailyWage: 280,
      otRule: "按小时:25",
      bank: "中国工商银行北京分行",
      cardNo: "6222021234567890123",
      address: "北京市东城区示例路1号",
      remark: "虚构示例，可删",
    }),
    person({
      name: "李四",
      team: "二班",
      personNo: "DEMO002",
      idCard: "320106198506154512",
      phone: "13900005678",
      dailyWage: 260,
      otRule: "折算:8",
      bank: "中国农业银行上海分行",
      cardNo: "6228481234567890123",
      address: "上海市浦东新区示例路8号",
      remark: "虚构示例，可删",
    }),
  ];
  const attendance = [
    att(2026, 3, "张三", "一班", 26, 12, 200, 0),
    att(2026, 3, "李四", "二班", 22, 8, 0, 50),
    att(2026, 4, "张三", "一班", 24, 8, 150, 0),
    att(2026, 4, "李四", "二班", 20, 4, 0, 0),
    att(2026, 7, "张三", "一班", 27, 14.5, 300, 80),
    att(2026, 7, "李四", "二班", 27, 10, 0, 100),
  ];
  const payments = [
    pay("张三", "张三", "2026-04-28", 1e4, "示例工程4月请款", "本人"),
    pay("李四", "张三", "2026-04-28", 8e3, "示例工程4月请款", "张三代收"),
    pay("张三", "张三", "2026-07-21", 5e3, "示例工程7月请款", "本人"),
    pay("李四", "李四", "2026-07-21", 5e3, "示例工程7月请款", "本人"),
  ];
  const contracts: ContractRecord[] = [
    {
      id: "c-demo-a",
      year: 2026,
      code: "DEMO-A-2026",
      name: "示例住宅A区",
      contractor: "示例建设集团",
      subcontractor: "示例劳务公司",
      contractAmount: 12e5,
      taxRate: 9,
      reportTaxMode: "excl",
      payRatio: 80,
      warrantyStart: "",
      warrantyEnd: "",
      hasDeposit: true,
      depositAmount: 5e4,
      manager: "王经营",
      status: "在建",
      prelimAmount: 0,
      settleReceivable: 0,
      remark: "虚构示例，可删",
    },
    {
      id: "c-demo-b",
      year: 2026,
      code: "DEMO-B-2026",
      name: "示例市政道路",
      contractor: "示例建设集团",
      subcontractor: "示例市政公司",
      contractAmount: 8e5,
      taxRate: 9,
      reportTaxMode: "incl",
      payRatio: 85,
      warrantyStart: "2026-06-01",
      warrantyEnd: "2028-05-31",
      hasDeposit: false,
      depositAmount: 0,
      manager: "李经营",
      status: "分包结算",
      prelimAmount: 78e4,
      settleReceivable: 12e4,
      remark: "虚构示例，可删",
    },
  ];
  const contractEntries: ContractEntry[] = [
    {
      id: uid(), contractId: "c-demo-a", kind: "report", date: "2026-03-31", amount: 18e4,
      amountExcl: 0, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "", no: "2026-03",
      remark: "3月报量", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-a", kind: "report", date: "2026-04-30", amount: 16e4,
      amountExcl: 0, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "", no: "2026-04",
      remark: "4月报量", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-a", kind: "invoice", date: "2026-04-12", amount: 2e5,
      amountExcl: 183486.24, taxRate: 9, workerPay: 0, workerPayDate: "", payTo: "", no: "1100000001",
      remark: "", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-a", kind: "receipt", date: "2026-04-15", amount: 8e4,
      amountExcl: 0, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "worker", no: "",
      remark: "总包代付农民工", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-a", kind: "receipt", date: "2026-04-28", amount: 7e4,
      amountExcl: 0, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "sub", no: "",
      remark: "到分包公司", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-b", kind: "report", date: "2026-02-28", amount: 8e5,
      amountExcl: 0, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "", no: "完工报量",
      remark: "", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-b", kind: "invoice", date: "2026-03-05", amount: 8e5,
      amountExcl: 733944.95, taxRate: 9, workerPay: 0, workerPayDate: "", payTo: "", no: "1100000002",
      remark: "", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-b", kind: "receipt", date: "2026-03-10", amount: 2e5,
      amountExcl: 0, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "worker", no: "",
      remark: "总包代付农民工", fileName: "", workerFileName: "",
    },
    {
      id: uid(), contractId: "c-demo-b", kind: "receipt", date: "2026-03-25", amount: 48e4,
      amountExcl: 0, taxRate: 0, workerPay: 0, workerPayDate: "", payTo: "sub", no: "",
      remark: "到分包公司", fileName: "", workerFileName: "",
    },
  ];
  const year = 2026;
  return {
    year,
    years: derivedYears({ year, years: [year], attendance }),
    people,
    attendance,
    attendanceDocs: [],
    payments,
    contracts,
    contractEntries,
    expenses: [],
    insurancePolicies: [],
    insuranceMembers: [],
    accessHash: "",
    uiStyle: "classic",
  };
}

const emptyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface AppActions {
  resetToSeed: () => void;
  clearAll: () => void;
  setYear: (year: number) => void;
  addYear: (y?: number) => number;
  removeYear: (y: number) => void;
  upsertPerson: (p: Person) => void;
  /**
   * 人员改名（事务式）：姓名是考勤/发放的关联键，改名必须与这些记录一起改（F3 / A14）。
   * 同名冲突 / 空姓名时返回 `ok:false`，且**什么都不改**。
   */
  renamePerson: (id: string, name: string) => { ok: boolean; error?: string; counts?: RenameCounts };
  addPerson: (p: Partial<Person> & { name: string }) => void;
  removePeople: (ids: string[]) => void;
  replacePeople: (people: Person[]) => void;
  saveAttendanceMonth: (year: number, month: number, rows: Partial<AttendanceRow>[]) => void;
  replaceAttendance: (attendance: AttendanceRow[]) => void;
  addAttendanceDoc: (d: Partial<AttendanceDoc>) => void;
  patchAttendanceDoc: (id: string, patch: Partial<AttendanceDoc>) => void;
  removeAttendanceDocs: (ids: string[]) => void;
  addPayment: (p: Omit<Payment, "id"> & { id?: string }) => void;
  patchPayments: (ids: string[], patch: Partial<Payment>) => void;
  replacePayments: (payments: Payment[]) => void;
  removePayment: (id: string) => void;
  removePayments: (ids: string[]) => void;
  upsertContract: (c: ContractRecord) => void;
  removeContracts: (ids: string[]) => void;
  addContractEntry: (e: Parameters<typeof normalizeEntry>[0]) => void;
  updateContractEntry: (e: ContractEntry) => void;
  patchContractEntry: (id: string, patch: Partial<ContractEntry>) => void;
  removeContractEntries: (ids: string[]) => void;
  replaceContracts: (contracts: ContractRecord[], entries?: ContractEntry[]) => void;
  upsertExpense: (row: Partial<Expense> & { name: string }) => void;
  removeExpenses: (ids: string[]) => void;
  replaceExpenses: (expenses: Expense[]) => void;
  upsertPolicy: (p: InsurancePolicy) => void;
  removePolicies: (ids: string[]) => void;
  upsertMember: (m: Partial<InsuranceMember> & { name: string }) => void;
  removeMembers: (ids: string[]) => void;
  setInsuranceMembers: (members: InsuranceMember[]) => void;
  replaceMembers: (members: InsuranceMember[]) => void;
  setAccessHash: (accessHash: string) => void;
  setUiStyle: (uiStyle: "classic" | "v2" | "apple" | "movie") => void;
  setAll: (s: LedgerState) => void;
}

export type AppStore = LedgerState & AppActions;

export const useApp = create<AppStore>()(
  persist(
    (set, get) => ({
      ...emptyState(),
      resetToSeed: () => {
        set({ ...demoState(), accessHash: get().accessHash });
        logOp("恢复示例数据", "", "设置");
      },
      clearAll: () => {
        set({ ...emptyState(), accessHash: get().accessHash });
        logOp("清空全部数据", "", "设置");
      },
      setYear: (year) => {
        // 切年份只是**看**哪一年，不是改台账数据（B3）：静音执行 —— 不置 dirty、不触发整本上传，
        // 只读账号也就不会因为切年份收到「没有保存整本台账的权限」。
        runMuted(() => set({ year, years: derivedYears({ ...get(), year }) }));
      },
      addYear: (y) => {
        const existing = derivedYears(get());
        const next = y && y >= 2e3 && y <= 2100 ? Math.round(y) : nextYear(existing);
        set({
          years: existing.includes(next) ? existing : [...existing, next].sort((a, b) => a - b),
          year: next,
        });
        logOp("新增年度", String(next), "设置");
        return next;
      },
      removeYear: (y) => {
        const restYears = (get().years || []).filter((x) => x !== y);
        const attendance = get().attendance.filter((a) => a.year !== y);
        if (!restYears.length && !attendance.length) return;
        const fallback =
          restYears.length > 0
            ? restYears[restYears.length - 1]
            : attendance[0]?.year || new Date().getFullYear();
        const years = derivedYears({ ...get(), attendance, years: restYears, year: fallback }).filter(
          (x) => x !== y,
        );
        set({
          years: years.length ? years : [fallback],
          attendance,
          year: get().year === y ? fallback : get().year,
        });
        logOp("删除年度", String(y), "设置");
      },
      upsertPerson: (p) => {
        const people = get().people;
        const nextP = {
          ...p,
          // 入库统一 trim 姓名（A-1）：姓名是考勤/发放的关联键
          name: nameKey(p.name),
          idValidFrom: normalizeIdDate(p.idValidFrom),
          idValidTo: normalizeIdDate(p.idValidTo, true),
        };
        // 只按 id 匹配，避免编辑改名撞到重名者时覆盖他人档案
        const pid = nextP.id?.trim();
        const i = pid ? people.findIndex((x) => x.id === pid) : -1;
        if (i >= 0) {
          // 改名是**跨实体事务**：考勤/发放/参保人/报销人都按姓名关联，只改 people 会让它们脱钩
          // （F3 / A14）。与 renamePerson 动作共用 lib/rename-person.ts，一处实现。
          const plan = planRenamePerson(
            {
              people,
              attendance: get().attendance,
              payments: get().payments,
              insuranceMembers: get().insuranceMembers || [],
              expenses: get().expenses || [],
            },
            people[i].id,
            nextP.name,
          );
          if (!plan.ok) {
            // 同名冲突（或姓名为空）：整笔保存都不落 —— 宁可什么都不改，
            // 也不能让考勤/发放挂在一个不存在的人名下
            console.warn("[store] 改名被拒绝：", plan.error);
            return;
          }
          const next = people.slice();
          next[i] = { ...nextP, id: people[i].id, name: plan.newName };
          set({
            people: next,
            attendance: plan.attendance,
            payments: plan.payments,
            insuranceMembers: plan.insuranceMembers,
            expenses: plan.expenses,
          });
          logOp(
            plan.oldName === plan.newName ? "修改人员" : "人员改名",
            plan.oldName === plan.newName ? nextP.name : renameLogDetail(plan),
            "人员",
          );
        } else {
          set({ people: [...people, { ...nextP, id: pid || uid() }] });
          logOp("新增人员", nextP.name, "人员");
        }
      },
      renamePerson: (id, name) => {
        const plan = planRenamePerson(
          {
            people: get().people,
            attendance: get().attendance,
            payments: get().payments,
            insuranceMembers: get().insuranceMembers || [],
            expenses: get().expenses || [],
          },
          id,
          name,
        );
        if (!plan.ok) return { ok: false, error: plan.error };
        if (plan.oldName !== plan.newName) {
          set({
            people: applyRenameToPeople(get().people, id, plan.newName),
            attendance: plan.attendance,
            payments: plan.payments,
            insuranceMembers: plan.insuranceMembers,
            expenses: plan.expenses,
          });
          logOp("人员改名", renameLogDetail(plan), "人员");
        }
        return { ok: true, counts: plan.counts };
      },
      addPerson: (p) => {
        set({
          people: [
            ...get().people,
            {
              ...p,
              name: nameKey(p.name), // 入库统一 trim（A-1）
              id: uid(),
              idValidFrom: normalizeIdDate(p.idValidFrom),
              idValidTo: normalizeIdDate(p.idValidTo, true),
            } as Person,
          ],
        });
        logOp("新增人员", nameKey(p.name), "人员");
      },
      removePeople: (ids) => {
        const names = get()
          .people.filter((p) => ids.includes(p.id))
          .map((p) => p.name)
          .join("、");
        set({ people: get().people.filter((p) => !ids.includes(p.id)) });
        logOp("删除人员", names || `${ids.length}人`, "人员");
      },
      replacePeople: (people) => {
        set({
          people: people.map(
            (p) =>
              ({
                ...p,
                name: nameKey(p.name), // Excel 导入 / 整本替换也统一 trim（A-1）
                idValidFrom: normalizeIdDate(p.idValidFrom),
                idValidTo: normalizeIdDate(p.idValidTo, true),
              }) as Person,
          ),
        });
        logOp("导入/替换人员", `${people.length}人`, "人员");
      },
      saveAttendanceMonth: (year, month, rows) => {
        const rest = get().attendance.filter((r) => !(r.year === year && r.month === month));
        const next = rows
          .filter((r) => (r.name || "").trim())
          .map((r) => ({
            ...r,
            name: nameKey(r.name), // 考勤姓名入库统一 trim（A-1）：否则年度表按姓名匹配不到这个人
            allowance: numIn(r.allowance, "考勤.补助"),
            deduction: numIn(r.deduction, "考勤.扣款"),
            id: uid(),
            year,
            month,
          }) as AttendanceRow);
        const attendance = [...rest, ...next];
        set({ attendance, years: derivedYears({ ...get(), attendance, year }) });
        logOp("保存月考勤", `${year}年${month}月 ${next.length}人`, "考勤");
      },
      replaceAttendance: (attendance) => {
        // 整本导入的考勤姓名同样入库 trim（A-1）：不然与人员表的干净姓名对不上
        const next = attendance.map((r) => ({ ...r, name: nameKey(r.name) }) as AttendanceRow);
        set({ attendance: next, years: derivedYears({ ...get(), attendance: next }) });
        logOp("导入/替换考勤", `${attendance.length}条`, "考勤");
      },
      addAttendanceDoc: (d) =>
        set({
          attendanceDocs: [
            ...(get().attendanceDocs || []),
            { ...d, id: d.id || uid(), fileName: d.fileName || "", remark: d.remark || "" } as AttendanceDoc,
          ],
        }),
      patchAttendanceDoc: (id, patch) =>
        set({
          attendanceDocs: (get().attendanceDocs || []).map((d) =>
            d.id === id ? { ...d, ...patch } : d,
          ),
        }),
      removeAttendanceDocs: (ids) =>
        set({ attendanceDocs: (get().attendanceDocs || []).filter((d) => !ids.includes(d.id)) }),
      addPayment: (p) => {
        set({ payments: [...get().payments, { ...p, id: uid() }] });
        logOp("新增发放", `${p.owner} ${p.amount}`, "发放");
      },
      patchPayments: (ids, patch) => {
        const idset = new Set(ids);
        set({
          payments: get().payments.map((p) => (idset.has(p.id) ? { ...p, ...patch, id: p.id } : p)),
        });
        logOp("修改发放", `${ids.length}条`, "发放");
      },
      replacePayments: (payments) => {
        set({ payments });
        logOp("导入/替换发放", `${payments.length}条`, "发放");
      },
      removePayment: (id) => {
        const p = get().payments.find((x) => x.id === id);
        set({ payments: get().payments.filter((x) => x.id !== id) });
        logOp("删除发放", p ? `${p.owner} ${p.amount}` : id, "发放");
      },
      removePayments: (ids) => {
        set({ payments: get().payments.filter((p) => !ids.includes(p.id)) });
        logOp("删除发放", `${ids.length}条`, "发放");
      },
      upsertContract: (c) => {
        const list = get().contracts;
        const i = list.findIndex(
          (x) => x.id === c.id || (c.code && x.code === c.code && x.year === c.year && x.name === c.name),
        );
        if (i >= 0) {
          const next = list.slice();
          next[i] = { ...c, id: list[i].id };
          set({ contracts: next });
          logOp("修改合同", c.name, "合同");
        } else {
          set({ contracts: [...list, { ...c, id: c.id || uid() }] });
          logOp("新增合同", c.name, "合同");
        }
      },
      removeContracts: (ids) => {
        set({
          contracts: get().contracts.filter((c) => !ids.includes(c.id)),
          contractEntries: get().contractEntries.filter((e) => !ids.includes(e.contractId)),
        });
        logOp("删除合同", `${ids.length}份`, "合同");
      },
      addContractEntry: (e) => {
        const entry = normalizeEntry(e);
        set({ contractEntries: [...get().contractEntries, entry] });
        logOp("新增合同明细", `${entry.kind} ${entry.amount}`, "合同");
      },
      updateContractEntry: (row) => {
        // 编辑一条已有明细（合同三类明细的「改」入口）。
        // 与新增走同一个 normalizeEntry，金额/不含税/税率口径不许在编辑路径分叉；
        // id 不变（normalizeEntry 用 e.id || uid()），影像文件挂接关系保持。
        const entry = normalizeEntry(row);
        set({ contractEntries: get().contractEntries.map((e) => (e.id === entry.id ? entry : e)) });
        logOp("修改合同明细", `${entry.kind} ${entry.amount}`, "合同");
      },
      patchContractEntry: (id, patch) => {
        set({
          contractEntries: get().contractEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        });
        logOp("修改合同明细", id, "合同");
      },
      removeContractEntries: (ids) => {
        set({ contractEntries: get().contractEntries.filter((e) => !ids.includes(e.id)) });
        logOp("删除合同明细", `${ids.length}条`, "合同");
      },
      replaceContracts: (contracts, entries) => {
        // 与 removeContracts 口径一致：旧合同被替换时，其条目一并清理，避免孤儿数据
        const keepIds = new Set(contracts.map((c) => c.id));
        const nextEntries = (entries ?? get().contractEntries).filter((e) => keepIds.has(e.contractId));
        set({ contracts, contractEntries: nextEntries });
        logOp("导入/替换合同", `${contracts.length}份 / ${nextEntries.length}条明细`, "合同");
      },
      upsertExpense: (row) => {
        const list = get().expenses || [];
        const i = list.findIndex((x) => x.id === row.id);
        const next = {
          ...row,
          id: row.id || uid(),
          qty: numIn(row.qty, "报销.数量"),
          price: numIn(row.price, "报销.单价"),
          amount: numIn(row.amount, "报销.金额"),
          status: (row.status === "已报销" ? "已报销" : "未报销") as Expense["status"],
          payMethod: row.payMethod || "现金",
          voucherId: row.voucherId || "",
          voucherFileName: row.voucherFileName || "",
          claimant: row.claimant || "",
          forWhom: row.forWhom || "",
          payBank: row.payBank || "",
          payCardNo: row.payCardNo || "",
          payAccount:
            [row.payBank, row.payCardNo].map((s) => (s || "").trim()).filter(Boolean).join(" ") ||
            row.payAccount ||
            "",
          payoutId: row.payoutId || "",
          payoutFileName: row.payoutFileName || "",
          payoutDate: row.status === "已报销" ? row.payoutDate || "" : "",
          payoutMethod: row.payoutMethod || "",
          reimbursedAt:
            row.status === "已报销"
              ? row.reimbursedAt || row.payoutDate || localToday()
              : "",
        } as Expense;
        if (i >= 0) {
          const copy = list.slice();
          copy[i] = next;
          set({ expenses: copy });
          logOp("修改报销", next.name, "报销");
        } else {
          set({ expenses: [...list, next] });
          logOp("新增报销", next.name, "报销");
        }
      },
      removeExpenses: (ids) => {
        set({ expenses: (get().expenses || []).filter((e) => !ids.includes(e.id)) });
        logOp("删除报销", `${ids.length}笔`, "报销");
      },
      replaceExpenses: (expenses) => {
        set({ expenses });
        logOp("导入/替换报销", `${expenses.length}笔`, "报销");
      },
      upsertPolicy: (p) => {
        const list = get().insurancePolicies || [];
        const next: InsurancePolicy = {
          ...p,
          id: p.id || uid(),
          policyNo: (p.policyNo || "").trim(),
          buyer: p.buyer || "",
          name: p.name || "",
          company: p.company || "",
          premiumPerPerson: numIn(p.premiumPerPerson, "保单.每人保费"),
          headcount: numIn(p.headcount, "保单.人数"),
          coverage: numIn(p.coverage, "保单.保额"),
          periodStart: p.periodStart || "",
          periodEnd: p.periodEnd || "",
          linkedPolicyId: p.linkedPolicyId || "",
          contracts: Array.isArray(p.contracts) ? p.contracts : [],
          remark: p.remark || "",
        };
        // 优先按 id；无论是否有 id，同名保单号都按「同一张保单」处理（新增同名合并修改，避免重复建档）
        let i = list.findIndex((x) => x.id === p.id);
        if (i < 0) i = list.findIndex((x) => x.policyNo && x.policyNo === next.policyNo);
        if (i >= 0) {
          const copy = list.slice();
          copy[i] = { ...next, id: list[i].id };
          set({ insurancePolicies: copy });
          logOp("修改保单", next.policyNo, "团体保险");
        } else {
          set({ insurancePolicies: [...list, next] });
          logOp("新增保单", next.policyNo, "团体保险");
        }
      },
      removePolicies: (ids) => {
        const deleted = new Set(ids);
        set({
          // 删除保单的同时，清理其它保单指向它的组合险挂接，避免孤儿成员增殖
          insurancePolicies: (get().insurancePolicies || [])
            .filter((p) => !deleted.has(p.id))
            .map((p) => (deleted.has(p.linkedPolicyId) ? { ...p, linkedPolicyId: "" } : p)),
          insuranceMembers: (get().insuranceMembers || []).filter((m) => !deleted.has(m.policyId)),
        });
        logOp("删除保单", `${ids.length}份`, "团体保险");
      },
      upsertMember: (m) => {
        const list = get().insuranceMembers || [];
        const i = list.findIndex((x) => x.id === m.id);
        const next = {
          ...m,
          id: m.id || uid(),
          name: (m.name || "").trim(),
          policyId: m.policyId || "",
          leader: m.leader || "",
          startDate: m.startDate || "",
          endDate: m.endDate || "",
          remark: m.remark || "",
        } as InsuranceMember;
        if (i >= 0) {
          const copy = list.slice();
          copy[i] = { ...next, id: list[i].id };
          set({ insuranceMembers: copy });
          logOp("修改被保人", next.name, "团体保险");
        } else {
          set({ insuranceMembers: [...list, next] });
          logOp("新增被保人", next.name, "团体保险");
        }
      },
      removeMembers: (ids) => {
        set({ insuranceMembers: (get().insuranceMembers || []).filter((m) => !ids.includes(m.id)) });
        logOp("删除被保人", `${ids.length}人`, "团体保险");
      },
      replaceMembers: (members) => {
        set({ insuranceMembers: members });
        logOp("导入被保人", `${members.length}人`, "团体保险");
      },
      setInsuranceMembers: (members) => set({ insuranceMembers: members }),
      setAccessHash: (accessHash) => set({ accessHash }),
      // 界面风格是**本机偏好**（不进 sliceState，也不上传）：同样静音，别为换主题推一次整本台账（B3）
      setUiStyle: (uiStyle) => runMuted(() => set({ uiStyle })),
      setAll: (s) => set({ ...s, years: derivedYears(s) }),
    }),
    {
      name: "gongdi-ledger-v5",
      version: 10,
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? emptyStorage : localStorage,
      ),
      migrate: (persisted, _version) => {
        // 旧版 localStorage 里的数据也是「外部输入」：同样容错解析 + 留痕
        const s = persisted as LedgerState;
        const attendance = (s.attendance || []).map((a) => ({
          ...a,
          allowance: numIn(a.allowance, "旧数据.考勤补助"),
          deduction: numIn(a.deduction, "旧数据.考勤扣款"),
        }));
        const contracts = (s.contracts || []).map((c) => ({
          ...c,
          reportTaxMode: c.reportTaxMode === "incl" ? "incl" : "excl",
        }));
        const contractEntries = splitLegacyReceipts(
          (s.contractEntries || []).map((e) => ({
            ...e,
            amountExcl: numIn(e.amountExcl, "旧数据.合同不含税金额"),
            taxRate: numIn(e.taxRate, "旧数据.合同税率"),
            workerPay: numIn(e.workerPay, "旧数据.合同代付金额"),
            workerPayDate: e.workerPayDate || "",
            payTo: e.payTo === "worker" || e.payTo === "sub" ? e.payTo : "",
            fileName: e.fileName || "",
            workerFileName: e.workerFileName || "",
          })) as Parameters<typeof splitLegacyReceipts>[0],
        );
        const attendanceDocs = s.attendanceDocs || [];
        const people = (s.people || []).map((p) => ({
          ...p,
          payType: p.payType === "month" ? ("month" as const) : ("day" as const),
          monthWage: numIn(p.monthWage, "旧数据.月工资"),
          dailyWage: numIn(p.dailyWage, "旧数据.日工资"),
        }));
        return {
          ...s,
          schemaVersion: LEDGER_SCHEMA_VERSION,
          people,
          attendance,
          contracts,
          contractEntries,
          attendanceDocs,
          expenses: s.expenses || [],
          insurancePolicies: s.insurancePolicies || [],
          insuranceMembers: s.insuranceMembers || [],
          years: derivedYears({ ...s, attendance, years: s.years || [] }),
          accessHash: s.accessHash || "",
          // 默认原版界面；显式选过其他风格的保持
          uiStyle: s.uiStyle === "v2" || s.uiStyle === "apple" || s.uiStyle === "movie" ? s.uiStyle : "classic",
        };
      },
      partialize: (s) => ({
        schemaVersion: LEDGER_SCHEMA_VERSION,
        year: s.year,
        years: s.years,
        people: s.people,
        attendance: s.attendance,
        attendanceDocs: s.attendanceDocs || [],
        payments: s.payments,
        contracts: s.contracts || [],
        contractEntries: s.contractEntries || [],
        expenses: s.expenses || [],
        insurancePolicies: s.insurancePolicies || [],
        insuranceMembers: s.insuranceMembers || [],
        accessHash: s.accessHash || "",
        uiStyle: s.uiStyle === "v2" || s.uiStyle === "apple" || s.uiStyle === "movie" ? s.uiStyle : "classic",
      }),
    },
  ),
);
