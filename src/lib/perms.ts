export interface PermItem {
  id: string;
  label: string;
}

export interface PermGroup {
  key: string;
  label: string;
  items: PermItem[];
}

/**
 * 权限声明表 —— **唯一来源**。
 *
 * 约束（C1）：
 * - 权限 id 只能在这里出现一次；页面用 `<Can perm="…">`、接口用 `withTenant(…, "…")` 时，
 *   由下面的 `PermId` 联合类型在编译期校验，写错一个字母就编译不过（以前是裸字符串，写错只会静默不生效）。
 * - `PERM_GROUPS`（设置页勾选）、`ALL_PERMS`、`NAV_PERM`、`PRESETS`、服务端 `need` 全部从这张表派生。
 * - 灰度/历史数据里可能存着已废弃的 id：运行期判断（hasPerm）仍按字符串处理，不做强校验。
 */
const PERM_TABLE = [
  {
    key: "people",
    label: "人员",
    items: [
      { id: "people.view", label: "查看" },
      { id: "people.edit", label: "新增/修改" },
      { id: "people.delete", label: "删除" },
    ],
  },
  {
    key: "attendance",
    label: "月度考勤",
    items: [
      { id: "attendance.view", label: "查看" },
      { id: "attendance.edit", label: "录入/修改" },
      { id: "attendance.delete", label: "删除" },
    ],
  },
  {
    key: "payments",
    label: "发放记录",
    items: [
      { id: "payments.view", label: "查看" },
      { id: "payments.edit", label: "新增/修改" },
      { id: "payments.delete", label: "删除" },
    ],
  },
  {
    key: "contracts",
    label: "合同",
    items: [
      { id: "contracts.view", label: "查看" },
      { id: "contracts.edit", label: "新增/修改" },
      { id: "contracts.delete", label: "删除" },
      { id: "contracts.print", label: "打印对账单" },
    ],
  },
  {
    key: "expenses",
    label: "报销单",
    items: [
      { id: "expenses.view", label: "查看" },
      { id: "expenses.edit", label: "新增/修改" },
      { id: "expenses.delete", label: "删除" },
      { id: "expenses.print", label: "打印报销单" },
    ],
  },
  {
    key: "photos",
    label: "照片",
    items: [
      { id: "photos.view", label: "查看" },
      { id: "photos.edit", label: "上传/删除" },
    ],
  },
  {
    key: "files",
    label: "影像资料",
    items: [
      { id: "files.view", label: "查看" },
      { id: "files.edit", label: "上传/删除" },
    ],
  },
  {
    key: "insurance",
    label: "团体保险",
    items: [
      { id: "insurance.view", label: "查看" },
      { id: "insurance.edit", label: "新增/修改" },
    ],
  },
  {
    key: "query",
    label: "个人查询",
    items: [
      { id: "query.view", label: "查看" },
      { id: "query.print", label: "打印工资条" },
    ],
  },
  {
    key: "io",
    label: "导入 / 导出",
    items: [
      { id: "import.use", label: "导入" },
      { id: "export.use", label: "导出" },
    ],
  },
  {
    key: "settings",
    label: "设置",
    items: [
      { id: "settings.year", label: "增减年度" },
      { id: "settings.rules", label: "批量工资规则" },
      { id: "settings.data", label: "清空/示例数据" },
    ],
  },
  {
    key: "audit",
    label: "操作记录",
    items: [{ id: "audit.view", label: "查看" }],
  },
  {
    key: "members",
    label: "成员",
    items: [{ id: "members.manage", label: "分配权限" }],
  },
];

/** 权限 id 联合类型：由声明表推导，页面/接口传错 id 会编译报错 */
export type PermId = (typeof PERM_TABLE)[number]["items"][number]["id"];

/** 服务端 withTenant 可以要求的权限：普通权限，或两个特殊位 */
export type NeedId = PermId | "ledger.manage" | "ledger.write";

export const PERM_GROUPS: PermGroup[] = PERM_TABLE.map((g) => ({
  key: g.key,
  label: g.label,
  items: g.items.map((i) => ({ id: i.id, label: i.label })),
}));

export const ALL_PERMS: PermId[] = PERM_TABLE.flatMap((g) => g.items.map((i) => i.id));

export interface PermPreset {
  id: string;
  label: string;
  hint: string;
  perms: NeedId[];
}

export const PRESETS: PermPreset[] = [
  {
    id: "all",
    label: "全部权限",
    hint: "和创建人一样",
    perms: [...ALL_PERMS],
  },
  {
    id: "read",
    label: "只读",
    hint: "只能看，不能改",
    perms: ALL_PERMS.filter(
      (p) => p.endsWith(".view") || p === "query.print" || p === "contracts.print" || p === "expenses.print" || p === "export.use" || p === "audit.view",
    ),
  },
  {
    id: "hr",
    label: "考勤发放",
    hint: "人员、考勤、发放、照片、查询",
    perms: [
      "people.view",
      "people.edit",
      "people.delete",
      "attendance.view",
      "attendance.edit",
      "attendance.delete",
      "payments.view",
      "payments.edit",
      "payments.delete",
      "photos.view",
      "photos.edit",
      "query.view",
      "query.print",
      "import.use",
      "export.use",
      "audit.view",
    ],
  },
  {
    id: "contract",
    label: "合同财务",
    hint: "合同、报销、影像、导出",
    perms: [
      "contracts.view",
      "contracts.edit",
      "contracts.delete",
      "contracts.print",
      "expenses.view",
      "expenses.edit",
      "expenses.delete",
      "expenses.print",
      "files.view",
      "files.edit",
      "export.use",
      "audit.view",
    ],
  },
];

export function hasPerm(perms: string[] | undefined | null, id: string): boolean {
  const list = perms || [];
  if (!list.length) return false;
  if (list.includes("*")) return true;
  if (list.includes(id)) return true;
  if (id.endsWith(".view")) {
    const prefix = id.slice(0, -5);
    if (list.some((p) => p.startsWith(prefix))) return true;
  }
  return false;
}

export function canWriteLedger(perms: string[] | undefined | null): boolean {
  const list = perms || [];
  if (list.includes("*")) return true;
  return list.some(
    (p) =>
      p.endsWith(".edit") ||
      p.endsWith(".delete") ||
      p === "import.use" ||
      p.startsWith("settings.") ||
      p === "photos.edit" ||
      p === "files.edit" ||
      p === "expenses.edit",
  );
}

/** 全量台账写权限：管理员或人员/考勤编辑/设置类权限（收窄版：仅照片/文件编辑不能覆盖整本台账） */
export function canManageLedger(perms: string[] | undefined | null): boolean {
  const list = perms || [];
  if (list.includes("*")) return true;
  return list.some((p) => p === "people.edit" || p === "attendance.edit" || p.startsWith("settings."));
}

export const NAV_PERM: Record<string, PermId | ""> = {
  "/": "",
  "/people": "people.view",
  "/attendance": "attendance.view",
  "/payments": "payments.view",
  "/contracts": "contracts.view",
  "/expenses": "expenses.view",
  "/photos": "photos.view",
  "/files": "files.view",
  "/insurance": "insurance.view",
  "/query": "query.view",
  "/audit": "audit.view",
  "/import": "import.use",
  "/export": "export.use",
  "/settings": "",
};

let live: string[] = ["*"];
const listeners = new Set<() => void>();

export function setLivePerms(perms: string[]) {
  live = perms.length ? perms : [];
  listeners.forEach((fn) => fn());
}

export function livePerms(): string[] {
  return live;
}

export function subscribePerms(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function can(id: string): boolean {
  if (!id) return true;
  return hasPerm(live, id);
}
