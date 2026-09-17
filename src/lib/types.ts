/**
 * 合同（含三类明细）的类型定义放**这里**，不放 `contracts.ts`（G2 / 专家评审 A2）。
 *
 * 为什么搬：`contracts.ts` 要用 `wage.ts` 的 `round2()`（值导入），`wage.ts` 要用本文件的
 * `Person`（类型导入），而本文件原来又要 `contracts.ts` 的合同类型 —— 三者互相指，形成
 * `types ↔ contracts ↔ wage` 的 import 环（§12「禁止循环依赖」；实测 `pnpm test`/`tsc` 都发现不了）。
 * 根因是「类型定义长在实现模块里」：把这三个类型下沉到**叶子模块**（本文件不 import 任何东西）后，
 * `contracts → types`（类型）、`contracts → wage`（值）、`wage → types`（类型）全是单向的。
 * `contracts.ts` 仍原样再导出它们，历史调用点（`~/lib/contracts`）不用改。
 *
 * 回归守卫：`tests/structure-guards.test.ts`（断言本文件是叶子 + 环清单只剩 §12.3 允许的那一条）。
 */
export interface ContractRecord {
  id: string;
  year: number;
  code: string;
  name: string;
  contractor: string;
  subcontractor: string;
  contractAmount: number;
  taxRate: number;
  reportTaxMode: string;
  payRatio: number;
  warrantyStart: string;
  warrantyEnd: string;
  hasDeposit: boolean;
  depositAmount: number;
  manager: string;
  status: string;
  prelimAmount: number;
  settleReceivable: number;
  remark: string;
  hasPaper?: boolean;
  noContractReason?: string;
  scanFileName?: string;
}

export type EntryKind = "report" | "invoice" | "receipt";

export interface ContractEntry {
  id: string;
  contractId: string;
  kind: EntryKind;
  date: string;
  amount: number;
  amountExcl: number;
  taxRate: number;
  workerPay: number;
  workerPayDate: string;
  payTo: "" | "worker" | "sub";
  no: string;
  remark: string;
  fileName: string;
  workerFileName: string;
}

export interface WageHistory {
  id: string;
  fromDate: string; // 生效日期，格式 YYYY-MM-DD
  payType: "day" | "month";
  dailyWage: number;
  monthWage: number;
  otRule: string;
  mealAllowance: number; // 餐补/天，按正常出勤天数算
  remark: string;
}

export interface Person {
  id: string;
  name: string;
  team: string;
  personNo: string;
  idCard: string;
  gender: string;
  age: number | null;
  birthday: string;
  phone: string;
  // 兼容旧数据：保留当前工资字段作为最新值
  dailyWage: number;
  monthWage: number;
  payType: "day" | "month";
  otRule: string;
  mealAllowance: number; // 餐补/天
  // 工资历史记录
  wageHistory?: WageHistory[];
  bank: string;
  cardNo: string;
  address: string;
  idIssuer: string;
  idValidFrom: string;
  idValidTo: string;
  remark: string;
}

export interface AttendanceRow {
  id: string;
  year: number;
  month: number;
  name: string;
  team: string;
  days: number;
  otHours: number;
  allowance: number;
  deduction: number;
  remark: string;
}

export interface AttendanceDoc {
  id: string;
  year?: number;
  month?: number;
  fileName: string;
  remark: string;
}

export interface Payment {
  id: string;
  owner: string;
  receiver: string;
  date: string;
  amount: number;
  source: string;
  remark: string;
}

export interface Expense {
  id: string;
  name: string;
  year?: number;
  period?: string;
  unit?: string;
  qty: number;
  price: number;
  amount: number;
  status: "已报销" | "未报销";
  payMethod: string;
  voucherId: string;
  voucherFileName: string;
  claimant: string;
  forWhom: string;
  payBank: string;
  payCardNo: string;
  payAccount: string;
  payoutId: string;
  payoutFileName: string;
  payoutDate: string;
  payoutMethod: string;
  reimbursedAt: string;
  /** 购买时间等其余字段随数据保留 */
  date?: string;
  remark?: string;
}

/**
 * 台账数据格式版本（写进 ledger.json，跟着数据走，和软件版本无关）。
 * 用途：服务端能判断「这份数据是什么年代的格式」，客户端 migrate 也有个锚点。
 * 改动 LedgerState 的结构（加/删/改字段语义）时要 +1。
 */
export const LEDGER_SCHEMA_VERSION = 2;

export interface LedgerState {
  /** 数据格式版本，见 LEDGER_SCHEMA_VERSION；旧数据可能没有这个字段 */
  schemaVersion?: number;
  year: number;
  years: number[];
  people: Person[];
  attendance: AttendanceRow[];
  attendanceDocs: AttendanceDoc[];
  payments: Payment[];
  contracts: ContractRecord[];
  contractEntries: ContractEntry[];
  expenses: Expense[];
  insurancePolicies: InsurancePolicy[];
  insuranceMembers: InsuranceMember[];
  accessHash: string;
  /** 界面风格：classic = 原版，v2 = 新版仪表盘，apple = 苹果 Mac 风格，movie = MOVIEPILOT 白底彩色渐变 */
  uiStyle: "classic" | "v2" | "apple" | "movie";
}

/**
 * 台账读取结果：empty = 还没有台账文件；unreadable = 文件在但读不出来（损坏/权限/IO）。
 *
 * 定义放本文件（叶子）而不是 `nas-fs.server.ts`（G2 / 专家评审 A2）：影像层 `assets.server.ts`
 * 需要这个类型（`adoptLegacyAssets` 的入参），而台账存储层又要影像层的 `reconcileContractScans`
 * —— 两边互指就是一个 import 环，并且违反 §12.2「影像层不 import 台账存储」。
 * 类型下沉到叶子后，`assets → types`、`nas-fs → assets`、`nas-fs → types` 全单向。
 * `nas-fs.server.ts` 仍再导出一次，历史调用点不受影响。
 */
export interface LedgerRead extends Partial<LedgerState> {
  empty?: boolean;
  unreadable?: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  module: string;
}

export interface InsuranceContract {
  id: string;
  fileName: string;
}

export interface InsurancePolicy {
  id: string;
  policyNo: string; // 保单号
  buyer: string; // 购买保险的公司
  name: string; // 团体/项目名称
  company: string; // 保险公司
  premiumPerPerson: number; // 每人保费（元）
  headcount: number; // 人数
  coverage: number; // 保额/额度（每人，元）
  periodStart: string; // 保险期开始 YYYY-MM-DD
  periodEnd: string; // 保险期结束 YYYY-MM-DD
  linkedPolicyId: string; // 挂钩的保单 id（人员同步），空 = 不挂钩
  contracts: InsuranceContract[]; // 保险合同文件（可多份）
  remark: string;
}

export interface InsuranceMember {
  id: string;
  policyId: string; // 所属保单
  name: string; // 姓名
  leader: string; // 队长
  startDate: string; // 开始日期
  endDate: string; // 结束日期，空 = 仍在保
  remark: string;
}
