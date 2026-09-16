/**
 * 只读账号写入守卫（1.8.7，对应 A 组逐项测试报告第 17 / 30b 项）。
 *
 * 复现到的缺陷：只读账号 `u_read` 在人员页点「编辑」改电话 → 界面弹**「已保存」**、
 * 表格立刻显示新号码，而服务端 `PUT /api/ledger` 回 403 —— 改动只在本机内存里，刷新即丢。
 *
 * 修法：写入入口统一走 `blockedWrite()`（判据与服务端 `ledger.manage` 完全一致：
 * `canManageLedger` **且** 该模块的 `.edit`），拦下时不弹任何成功提示。
 * 这里把「哪些账号算只读 / 哪些能存」钉死，免得下次又把「本机改了一下」渲染成成功。
 *
 * 注意：读 / 判行为由 `canSaveToServer()` 决定，测试不去断言 toast 文案，
 * 免得改一句提示就红（文案在页面里由 ReadonlyNotice 统一渲染）。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { setLivePerms } from "../src/lib/perms";
import { blockedWrite, canSaveToServer, isReadOnlyAccount, readonlyHint, READONLY_MSG } from "../src/lib/readonly";

/** PRESETS 里各预设的权限（与 src/lib/perms.ts 的 PRESETS 同源，测试里手抄一份防「改声明忘改测试」） */
const ALL = ["*"];
const READ_ONLY = [
  "people.view",
  "attendance.view",
  "payments.view",
  "contracts.view",
  "expenses.view",
  "photos.view",
  "files.view",
  "insurance.view",
  "query.view",
  "query.print",
  "contracts.print",
  "expenses.print",
  "export.use",
  "audit.view",
];
const HR = [
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
];
const CONTRACT = [
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
];

test("只读账号：任何模块都存不下去（不能显示「已保存」）", () => {
  setLivePerms(READ_ONLY);
  assert.equal(isReadOnlyAccount(), true);
  for (const perm of ["people.edit", "attendance.edit", "payments.edit", "contracts.edit", "expenses.edit", "insurance.edit", "photos.edit", "files.edit"]) {
    assert.equal(canSaveToServer(perm), false, `只读账号不该能保存 ${perm}`);
  }
  // blockedWrite 返回 true = 已拦下（调用方必须 return，不许再弹成功提示）
  assert.equal(blockedWrite("people.edit", "人员 新增/修改"), true);
});

test("考勤发放账号（u_hr）：人员/考勤能存；合同报销不能", () => {
  setLivePerms(HR);
  assert.equal(isReadOnlyAccount(), false);
  assert.equal(canSaveToServer("people.edit"), true);
  assert.equal(canSaveToServer("attendance.edit"), true);
  assert.equal(canSaveToServer("payments.edit"), true, "u_hr 有 people.edit，整本台账可写，发放也能存");
  assert.equal(canSaveToServer("contracts.edit"), false, "没有 contracts.edit");
  assert.equal(canSaveToServer("expenses.edit"), false, "没有 expenses.edit");
});

/**
 * 合同财务账号（u_contract）是这轮最容易被忽略的一种「假保存」：
 * 他有 `contracts.edit` / `expenses.edit` / `files.edit`，但**没有** `people.edit`/`attendance.edit`/`settings.*`，
 * 于是 `canManageLedger()` 为 false，PUT /api/ledger 一样 403 —— 合同/报销改了也只在本机。
 * 守卫必须按「整本台账写权限 + 模块 .edit」两个条件同时成立才放行。
 */
test("合同财务账号：模块有 .edit 也不等于能存（整本台账写权限缺了）", () => {
  setLivePerms(CONTRACT);
  assert.equal(isReadOnlyAccount(), true, "canManageLedger 为 false = 落不了盘");
  assert.equal(canSaveToServer("contracts.edit"), false, "有 contracts.edit 但整本台账写不了，仍必须拦");
  assert.equal(canSaveToServer("expenses.edit"), false);
  assert.equal(canSaveToServer("files.edit"), false);
  assert.equal(blockedWrite("contracts.edit", "合同 新增/修改"), true);
});

test("管理员（*）与最小权限账号：放行 / 拦下都对", () => {
  setLivePerms(ALL);
  assert.equal(isReadOnlyAccount(), false);
  assert.equal(canSaveToServer("people.edit"), true);
  assert.equal(blockedWrite("people.edit", "人员 新增/修改"), false);

  setLivePerms(["attendance.view", "attendance.edit"]);
  assert.equal(canSaveToServer("attendance.edit"), true);
  assert.equal(canSaveToServer("people.edit"), false, "没有 people.edit");
});

test("权限为空（未登录/没拿到权限）一律按只读处理，绝不误放行", () => {
  setLivePerms([]);
  assert.equal(isReadOnlyAccount(), true);
  assert.equal(canSaveToServer("people.edit"), false);
  assert.equal(blockedWrite("people.edit", "人员 新增/修改"), true);
});

test("提示文案：只读提示必须写清「改动不会保存」", () => {
  assert.match(READONLY_MSG, /只读账号/);
  assert.match(READONLY_MSG, /不会保存/);
  assert.match(readonlyHint("人员 新增/修改"), /人员 新增\/修改/);
});
