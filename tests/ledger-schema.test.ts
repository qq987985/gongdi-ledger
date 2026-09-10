/**
 * 台账写入结构校验测试（B 中期）。
 *
 * 服务端过去只查权限、不看 body 内容，`{}` 或错形状都能整本落盘；
 * 这里锁住「明显坏掉的写入必须被拒，正常/老数据必须放行」这条边界。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLedgerPayload } from "../src/lib/ledger-schema.server";
import { LEDGER_SCHEMA_VERSION } from "../src/lib/types";

const ok = { schemaVersion: LEDGER_SCHEMA_VERSION, year: 2026, years: [2026], people: [], attendance: [], payments: [] };

test("正常台账体通过校验", () => {
  assert.equal(validateLedgerPayload(ok), null);
});

test("完整的空台账（客户端 sliceState 的形状）通过校验", () => {
  assert.equal(
    validateLedgerPayload({
      schemaVersion: LEDGER_SCHEMA_VERSION,
      year: 2026,
      years: [2025, 2026],
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
    }),
    null,
  );
});

test("拒绝 {}：不能靠一次空写入把整本台账清掉", () => {
  assert.match(String(validateLedgerPayload({})), /不像台账/);
});

test("拒绝错形状：people 不是数组、名字不是字符串", () => {
  assert.match(String(validateLedgerPayload({ ...ok, people: { 张三: true } })), /people/);
  assert.match(String(validateLedgerPayload({ ...ok, people: [{ id: "p1", name: 123 }] })), /people/);
});

test("拒绝坏的明细类型（合同流水 kind 必须是三种之一）", () => {
  assert.match(
    String(validateLedgerPayload({ ...ok, contractEntries: [{ contractId: "c1", kind: "乱写" }] })),
    /contractEntries/,
  );
  assert.equal(validateLedgerPayload({ ...ok, contractEntries: [{ contractId: "c1", kind: "report" }] }), null);
});

test("数字字符串放行（老数据/Excel 导入历史），非数字拒绝", () => {
  assert.equal(validateLedgerPayload({ ...ok, payments: [{ owner: "张三", amount: "10000" }] }), null);
  assert.match(String(validateLedgerPayload({ ...ok, payments: [{ owner: "张三", amount: "abc" }] })), /payments/);
});

test("未知字段放行（向后兼容：老客户端多发字段不能被拒）", () => {
  assert.equal(validateLedgerPayload({ ...ok, 未来字段: { a: 1 } }), null);
});

test("人员/考勤/报销/保单的基本字段都要在", () => {
  assert.equal(validateLedgerPayload({ ...ok, attendance: [{ name: "张三", year: 2026, month: 4 }] }), null);
  assert.match(String(validateLedgerPayload({ ...ok, attendance: [{ name: "张三" }] })), /attendance/);
  assert.equal(validateLedgerPayload({ ...ok, expenses: [{ name: "办公用品", amount: 500 }] }), null);
  assert.match(String(validateLedgerPayload({ ...ok, insurancePolicies: [{ 没保单号: 1 }] })), /insurancePolicies/);
});
