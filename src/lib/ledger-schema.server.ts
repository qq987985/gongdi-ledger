/**
 * 台账写入的结构校验（B 中期）。
 *
 * 为什么要它：`PUT /api/ledger` 原来只查权限，之后直接把 body 当台账整本落盘——
 * 服务端不校验结构、不校验基本不变量。客户端一个 bug（或一份坏掉的本地数据）
 * 就能把整本台账写成 `{}` 或错形状，而服务端毫无察觉。
 *
 * 设计取舍：
 * - **只校验结构**，不校验业务规则（业务规则仍在客户端，见开发规范第 4 节）。
 * - 数值字段用 coerce：老数据/导入数据里出现 "300" 这种数字字符串是可能的，不能因此拒绝保存。
 * - 未知字段一律放行（`.passthrough()`），向后兼容：老版本客户端多发字段不该被拒。
 * - 校验只用于**拒绝明显坏掉的写入**；通过后写的仍是原始 body（不做转换，避免悄悄改数据）。
 */
import { z } from "zod";

/** coerce：接受数字或数字字符串，拒绝 "abc" / null / undefined */
const num = z.coerce.number().finite();
const str = z.string();

const person = z.object({ id: str, name: str }).passthrough();
const attendance = z.object({ name: str, year: num, month: num }).passthrough();
const attendanceDoc = z.object({ fileName: str }).passthrough();
const payment = z.object({ owner: str, amount: num }).passthrough();
const contract = z.object({ id: str, name: str }).passthrough();
const contractEntry = z
  .object({ contractId: str, kind: z.enum(["report", "invoice", "receipt"]) })
  .passthrough();
const expense = z.object({ name: str, amount: num }).passthrough();
const policy = z.object({ policyNo: str }).passthrough();
const member = z.object({ name: str }).passthrough();

/** 至少要有这些键之一，用来挡住 `{}` 这种「把整本台账清空」的写入 */
const TELLTALE_KEYS = [
  "year",
  "years",
  "people",
  "attendance",
  "payments",
  "contracts",
  "contractEntries",
  "expenses",
  "insurancePolicies",
  "insuranceMembers",
] as const;

export const ledgerPayloadSchema = z
  .object({
    schemaVersion: num.optional(),
    year: num.optional(),
    years: z.array(num).optional(),
    accessHash: str.optional(),
    people: z.array(person).optional(),
    attendance: z.array(attendance).optional(),
    attendanceDocs: z.array(attendanceDoc).optional(),
    payments: z.array(payment).optional(),
    contracts: z.array(contract).optional(),
    contractEntries: z.array(contractEntry).optional(),
    expenses: z.array(expense).optional(),
    insurancePolicies: z.array(policy).optional(),
    insuranceMembers: z.array(member).optional(),
  })
  .passthrough()
  .refine((v) => TELLTALE_KEYS.some((k) => k in v), {
    message: "内容不像台账（缺少全部台账字段），已拒绝写入以免清空数据",
  });

/** 校验台账写入体；通过返回 null，不通过返回给用户看的原因 */
export function validateLedgerPayload(body: unknown): string | null {
  const r = ledgerPayloadSchema.safeParse(body);
  if (r.success) return null;
  const first = r.error.issues[0];
  const where = first?.path.join(".") || "(根)";
  return `台账数据格式不对：${where} ${first?.message || ""}`.trim();
}

/** 给日志用的简短摘要（不打印整本台账，避免把身份证/银行卡写进日志） */
export function ledgerPayloadSummary(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return { type: typeof body };
  const o = body as Record<string, unknown>;
  const count = (v: unknown) => (Array.isArray(v) ? v.length : "-");
  return {
    schemaVersion: o.schemaVersion ?? "(无)",
    year: o.year ?? "-",
    people: count(o.people),
    attendance: count(o.attendance),
    payments: count(o.payments),
    contracts: count(o.contracts),
    contractEntries: count(o.contractEntries),
    expenses: count(o.expenses),
    insurancePolicies: count(o.insurancePolicies),
  };
}
