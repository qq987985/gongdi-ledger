/**
 * 影像资料页的数据整理（1.8.8 D2 / D3）。
 *
 * D2：保单里上传的「保险合同」PDF 在影像资料页看不到、也筛不出（页面漏收集 `insurancePolicies[].contracts`）。
 * D3：缺 `year/month` 的考勤影像归属显示 `undefined年undefined月考勤`。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { attendanceDocBelong, insuranceContractFiles } from "../src/lib/file-list";
import type { InsurancePolicy } from "../src/lib/types";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function policy(over: Partial<InsurancePolicy> = {}): InsurancePolicy {
  return {
    id: "i1",
    policyNo: "PICC-2026-0001",
    buyer: "示例公司",
    name: "团体意外险",
    company: "人保",
    premiumPerPerson: 365,
    headcount: 6,
    coverage: 0,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    linkedPolicyId: "",
    contracts: [],
    remark: "",
    ...over,
  };
}

test("D3 考勤影像归属：年月齐全正常显示，缺任一都不出现 undefined", () => {
  assert.equal(attendanceDocBelong({ year: 2026, month: 3 }), "2026年3月考勤");
  assert.equal(attendanceDocBelong({ year: 2025, month: 12 }), "2025年12月考勤");
  assert.equal(attendanceDocBelong({ fileName: "无年月考勤表.xlsx" } as any), "未标注年月");
  assert.equal(attendanceDocBelong({ year: 2026 } as any), "未标注年月");
  assert.equal(attendanceDocBelong({ month: 3 } as any), "未标注年月");
  assert.equal(attendanceDocBelong(null), "未标注年月");
  assert.equal(attendanceDocBelong({ year: 0, month: 0 } as any), "未标注年月");
  assert.equal(attendanceDocBelong({ year: 2026, month: 13 } as any), "未标注年月");
  for (const v of [attendanceDocBelong({} as any), attendanceDocBelong({ year: 1 } as any), attendanceDocBelong({ year: 2026, month: NaN } as any)])
    assert.ok(!String(v).includes("undefined"), `归属文案不得含 undefined：${v}`);
});

test("D2 保险合同文件被摊平进影像资料列表（文件名/保单号/保险期都在）", () => {
  const list = insuranceContractFiles([
    policy({ contracts: [{ id: "ic1", fileName: "保险合同-PICC-2026-0001-A.pdf" }] }),
    policy({ id: "i2", policyNo: "PICC-2026-0002", name: "组合险", periodStart: "2026-03-01", periodEnd: "2026-06-30", contracts: [{ id: "ic2", fileName: "保险合同-PICC-2026-0002.pdf" }] }),
  ]);
  assert.equal(list.length, 2);
  assert.deepEqual(list.map((c) => c.id), ["ic1", "ic2"]);
  assert.equal(list[0].fileName, "保险合同-PICC-2026-0001-A.pdf");
  assert.equal(list[0].policyNo, "PICC-2026-0001");
  assert.equal(list[1].periodStart, "2026-03-01");
});

test("D2 异常数据不炸：没有 contracts / 空文件名 / 缺 id 都跳过，重复 id 只出一条", () => {
  assert.deepEqual(insuranceContractFiles(undefined), []);
  assert.deepEqual(insuranceContractFiles([policy({ contracts: undefined as any })]), []);
  const list = insuranceContractFiles([
    policy({
      contracts: [
        { id: "", fileName: "无id.pdf" },
        { id: "x1", fileName: "   " },
        { id: "x2", fileName: "真合同.pdf" },
        { id: "x2", fileName: "重复挂同一份.pdf" },
      ],
    }),
  ]);
  assert.deepEqual(list.map((c) => c.fileName), ["真合同.pdf"]);
});

test("D2/D3 影像资料页真的接上了：类型下拉含「保险合同」、列表收集保单合同、归属不再拼 undefined", async () => {
  const src = await readFile(join(repoRoot, "src/routes/files.tsx"), "utf8");
  assert.match(src, /<option value="insurance">保险合同<\/option>/, "类型下拉缺「保险合同」");
  assert.match(src, /insuranceContractFiles\(insurancePolicies\)/, "列表没有收集保单里的保险合同");
  assert.match(src, /attendanceDocBelong\(d\)/, "考勤归属没有走兜底函数");
  assert.ok(!/\$\{d\.year\}年\$\{d\.month\}月考勤/.test(src), "旧的 undefined 拼接必须删掉");
  // 保险合同条目的替换/删除必须落到保单上（不能掉进合同明细的 else 分支）
  assert.match(src, /r\.source === "insurance"/, "缺少保险合同条目的替换/删除分支");
});
