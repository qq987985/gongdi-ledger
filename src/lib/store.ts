import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { uid } from "./utils";
import { normalizeIdDate, parseIdCard } from "./idcard";
import { derivedYears, nextYear } from "./dates";
import { normalizeEntry, splitLegacyReceipts, type ContractEntry, type ContractRecord } from "./contracts";
import { logOp } from "./audit";
import type { AttendanceDoc, AttendanceRow, Expense, InsuranceMember, InsurancePolicy, LedgerState, Payment, Person } from "./types";

export function emptyState(): LedgerState {
  const year = 2026;
  return {
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
        set({ year, years: derivedYears({ ...get(), year }) });
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
          idValidFrom: normalizeIdDate(p.idValidFrom),
          idValidTo: normalizeIdDate(p.idValidTo, true),
        };
        // 只按 id 匹配，避免编辑改名撞到重名者时覆盖他人档案
        const i = nextP.id ? people.findIndex((x) => x.id === nextP.id) : -1;
        if (i >= 0) {
          const next = people.slice();
          next[i] = { ...nextP, id: people[i].id };
          set({ people: next });
          logOp("修改人员", nextP.name, "人员");
        } else {
          set({ people: [...people, { ...nextP, id: nextP.id || uid() }] });
          logOp("新增人员", nextP.name, "人员");
        }
      },
      addPerson: (p) => {
        set({
          people: [
            ...get().people,
            {
              ...p,
              id: uid(),
              idValidFrom: normalizeIdDate(p.idValidFrom),
              idValidTo: normalizeIdDate(p.idValidTo, true),
            } as Person,
          ],
        });
        logOp("新增人员", p.name, "人员");
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
            allowance: Number(r.allowance) || 0,
            deduction: Number(r.deduction) || 0,
            id: uid(),
            year,
            month,
          }) as AttendanceRow);
        const attendance = [...rest, ...next];
        set({ attendance, years: derivedYears({ ...get(), attendance, year }) });
        logOp("保存月考勤", `${year}年${month}月 ${next.length}人`, "考勤");
      },
      replaceAttendance: (attendance) => {
        set({ attendance, years: derivedYears({ ...get(), attendance }) });
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
      removePayment: (id) => set({ payments: get().payments.filter((p) => p.id !== id) }),
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
      addContractEntry: (e) => set({ contractEntries: [...get().contractEntries, normalizeEntry(e)] }),
      patchContractEntry: (id, patch) =>
        set({
          contractEntries: get().contractEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }),
      removeContractEntries: (ids) =>
        set({ contractEntries: get().contractEntries.filter((e) => !ids.includes(e.id)) }),
      replaceContracts: (contracts, entries) =>
        set({ contracts, contractEntries: entries ?? get().contractEntries }),
      upsertExpense: (row) => {
        const list = get().expenses || [];
        const i = list.findIndex((x) => x.id === row.id);
        const next = {
          ...row,
          id: row.id || uid(),
          qty: Number(row.qty) || 0,
          price: Number(row.price) || 0,
          amount: Number(row.amount) || 0,
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
              ? row.reimbursedAt || row.payoutDate || new Date().toISOString().slice(0, 10)
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
      replaceExpenses: (expenses) => set({ expenses }),
      upsertPolicy: (p) => {
        const list = get().insurancePolicies || [];
        const i = list.findIndex((x) => x.id === p.id);
        const next: InsurancePolicy = {
          ...p,
          id: p.id || uid(),
          policyNo: (p.policyNo || "").trim(),
          buyer: p.buyer || "",
          name: p.name || "",
          company: p.company || "",
          premiumPerPerson: Number(p.premiumPerPerson) || 0,
          headcount: Number(p.headcount) || 0,
          coverage: Number(p.coverage) || 0,
          periodStart: p.periodStart || "",
          periodEnd: p.periodEnd || "",
          linkedPolicyId: p.linkedPolicyId || "",
          contracts: Array.isArray(p.contracts) ? p.contracts : [],
          remark: p.remark || "",
        };
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
        const s = persisted as LedgerState;
        const attendance = (s.attendance || []).map((a) => ({
          ...a,
          allowance: Number(a.allowance) || 0,
          deduction: Number(a.deduction) || 0,
        }));
        const contracts = (s.contracts || []).map((c) => ({
          ...c,
          reportTaxMode: c.reportTaxMode === "incl" ? "incl" : "excl",
        }));
        const contractEntries = splitLegacyReceipts(
          (s.contractEntries || []).map((e) => ({
            ...e,
            amountExcl: Number(e.amountExcl) || 0,
            taxRate: Number(e.taxRate) || 0,
            workerPay: Number(e.workerPay) || 0,
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
          monthWage: Number(p.monthWage) || 0,
          dailyWage: Number(p.dailyWage) || 0,
        }));
        return {
          ...s,
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
        };
      },
      partialize: (s) => ({
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
      }),
    },
  ),
);
