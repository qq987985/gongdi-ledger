/**
 * 「从备份恢复」入口的文案与门禁（工作包 C，业务评估 B4）。
 *
 * 背景：设置页一直只有「立即备份 Excel」，**没有恢复入口**，而 FAQ 第 5 / 10 节又把备份当成
 * 恢复依据 —— 用户误删数据、换机、换 NAS 时不知道该点哪里，只能自己猜「导入」页哪一项。
 *
 * 这里把「恢复入口」必须说清的三件事收在**一处**（页面只负责渲染，别再各写一段文案）：
 * ① **覆盖语义**：备份文件里有什么、会怎么合并进来、什么情况下才真的「覆盖」；
 * ② **不在 Excel 口径内的东西**（影像原文件、账号册、操作记录）与恢复后的人工核对清单；
 * ③ **门禁**：只读账号 / 缺权限时禁用并写明原因 —— 判据走 `lib/readonly.ts`（与服务端
 *    `withTenant(..., "ledger.manage")` 同口径），不然只读账号点进去导入一遍，服务端 403，
 *    界面却弹「整本导入完成」（与 A 组第 17 项是同一类假成功）。
 *
 * 恢复动作本身**复用既有的整本导入**（`导入 → 导入整本台账` = `FullBookImport`），不另写一套导入实现。
 */
import { canManageLedger, hasPerm, livePerms } from "./perms";
import { readonlyHint } from "./readonly";

/** 恢复入口需要的权限：导入页的门槛（`import.use`）+ 真能落盘（`ledger.manage` 口径） */
export const RESTORE_PERM = "import.use";

/** 直达路径：恢复入口指向的页面（复用整本导入，不新增导入实现） */
export const RESTORE_PATH = "/import";

export interface RestoreGate {
  ok: boolean;
  /** ok=false 时给用户看的原因（ok=true 时为空串） */
  reason: string;
}

/**
 * 恢复入口能不能用。**纯函数**：传权限列表即可判定（默认取当前会话权限），便于单测。
 * 两个条件缺一不可，与 `lib/readonly.ts` 的 `canSaveToServer("import.use")` 完全同源。
 */
export function restoreGate(perms: string[] = livePerms()): RestoreGate {
  if (!hasPerm(perms, RESTORE_PERM))
    return { ok: false, reason: readonlyHint("导入 / 导出 导入") };
  if (!canManageLedger(perms)) return { ok: false, reason: readonlyHint("整本台账写入") };
  return { ok: true, reason: "" };
}

/** 备份文件里**有**的实体（恢复会合并进来；与 lib/backup-book.ts 的 buildBackupWorkbook 同口径） */
export const RESTORE_COVERED = [
  "人员档案（含工资标准与调薪历史）",
  "考勤（备份里包含的各年各月，跨年也在）",
  "发放记录（含待发放 / 代发）",
  "报销单",
  "合同 + 报量 / 开票 / 收款明细",
  "保险保单 + 参保人（含组合险互挂）",
];

/** 备份文件里**没有**的东西（Excel 口径之外，恢复不会带来） */
export const RESTORE_NOT_COVERED = [
  "照片与影像原文件（人员证件照、合同扫描件、报销凭证、打款凭证）—— Excel 里只有文件名，恢复后文件不跟着回来",
  "账号、成员与权限（在 data/accounts.json 里，不在台账 Excel 内）",
  "操作记录（data/audit.json）与年度/界面偏好（如界面风格）",
];

/** 恢复前 / 恢复后要做的动作（页面上按这个顺序渲染） */
export const RESTORE_BEFORE = [
  "先点同一张卡片上的「立即备份 Excel」留一份当前状态（万一恢复方向错了还能回去）",
  "确认要恢复的是哪一份：data/backups/ 里固定名「考勤表.xlsx」是最新一份，带时间戳的是历次备份",
];

export const RESTORE_AFTER_CHECK = [
  "人员条数与工资标准（含调薪历史）",
  "最近一个月的考勤，以及跨年的那几年考勤在不在",
  "发放 / 报销的金额与条数，待发放那几笔还是「待发放」",
  "合同的报量 / 开票 / 收款明细（合同管理表上的合计要对得上）",
  "保单与参保人；证件照、合同扫描件这些影像文件能不能打开（影像不在 Excel 里）",
];

/**
 * 合并语义（页面上必须写清「覆盖」到底是什么意思）—— 与 `FullBookImport` 的实际行为一致：
 * 人员 / 保单 / 参保人 / 发放 / 报销 / 合同按内容键跳过（现有数据保留），
 * **同一人同一月的考勤以文件里那一行覆盖**；要整份「覆盖」得先清空台账或用分模块导入的「替换」模式。
 * （文案故意写细：只说「覆盖」会让用户以为导入即回滚，只说「合并」又解释不了考勤那一行的行为。）
 */
export const RESTORE_MERGE_NOTE =
  "恢复是「补齐」不是「抹掉重来」：同名人员、同保单号、重复的发放 / 报销 / 合同（年份+项目号+项目名称）" +
  "会被跳过，现有数据保留；同一人同一月的考勤会被备份里的那一行覆盖（等于把这个月回滚成备份时的数值）。" +
  "要从备份彻底覆盖当前台账，先清空台账（设置 → 清空全部数据）再恢复，或用分模块导入里的「替换」模式。";
