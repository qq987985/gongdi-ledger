import * as XLSX from "xlsx";
import { buildFullWorkbook, insuranceMemberTemplateWb, parseFullAttendanceWorkbook, parseInsuranceMembersSheet } from "../../src/lib/excel";
import { check, eq, okv } from "./harness";
import { buf, member, person, policy } from "./fixtures";

function roundtrip(policies: any[], members: any[]) {
  const wb = buildFullWorkbook({
    year: 2026, people: [person()], attendance: [], payments: [],
    insurancePolicies: policies, insuranceMembers: members,
    months: [{ year: 2026, month: 4 }],
  });
  return parseFullAttendanceWorkbook(buf(wb), 2026);
}

export function runInsurance() {
  check("保险", "保单字段往返：保单号/名称/购买公司/保险公司/每人保费/人数/保额/保险期/备注", () => {
    const p = policy();
    const parsed = roundtrip([p], []);
    okv(parsed.policies.length === 1, `保单数 ${parsed.policies.length}`);
    const b = parsed.policies[0];
    eq(
      {
        policyNo: b.policyNo, name: b.name, buyer: b.buyer, company: b.company,
        premiumPerPerson: b.premiumPerPerson, headcount: b.headcount, coverage: b.coverage,
        periodStart: b.periodStart, periodEnd: b.periodEnd, remark: b.remark,
      },
      {
        policyNo: "P-2026-001", name: "示例住宅A区团意险", buyer: "示例建设集团", company: "平安保险",
        premiumPerPerson: 300, headcount: 20, coverage: 1000000,
        periodStart: "2026-03-01", periodEnd: "2027-02-28", remark: "保单备注",
      },
      "保单字段",
    );
  });

  check("保险", "保险合同文件名（policy.contracts）往返保留", () => {
    const parsed = roundtrip([policy()], []);
    eq((parsed.policies[0].contracts || []).map((c) => c.fileName), ["团意险保单.pdf"], "保险合同文件");
  });

  check("保险", "被保人往返：姓名/队长/开始日期/结束日期/备注，并挂回对应保单", () => {
    const p = policy();
    const parsed = roundtrip([p], [member({ policyId: p.id, endDate: "2026-06-30" })]);
    okv(parsed.members.length === 1, `被保人数 ${parsed.members.length}`);
    const m = parsed.members[0];
    eq([m.name, m.leader, m.startDate, m.endDate, m.remark], ["张三", "王队长", "2026-03-01", "2026-06-30", "成员备注"], "被保人字段");
    eq(m.policyId, parsed.policies[0].id, "被保人挂回的保单");
  });

  check("保险", "在保成员（结束日期为空）往返后仍为空（空=在保，不能被写成「在保」字符串让状态变「已结束」）", () => {
    const p = policy();
    const parsed = roundtrip([p], [member({ policyId: p.id, endDate: "" })]);
    // 再导出一次，看状态列：在保成员应仍是「在保」
    const wb2 = buildFullWorkbook({
      year: 2026, people: [person()], attendance: [], payments: [],
      insurancePolicies: parsed.policies, insuranceMembers: parsed.members,
      months: [{ year: 2026, month: 4 }],
    });
    const aoa = XLSX.utils.sheet_to_json(wb2.Sheets["保险人员"], { header: 1, defval: "" }) as unknown[][];
    const hi = aoa.findIndex((r) => r.some((c) => String(c).trim() === "姓名"));
    const headers = aoa[hi].map((c) => String(c).trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, String(aoa[hi + 1][i] ?? "")]));
    // 结束日期为空 = 在保：日期列必须留空（不能再写「在保」字符串，那正是把状态读成「已结束」的病根），
    // 状态由「状态」列表达，二次导出仍是「在保」。
    eq([parsed.members[0].endDate, row["结束日期"], row["状态"]], ["", "", "在保"], "结束日期/二次导出的状态");
  });

  check("保险", "组合保单号（linkedPolicyId）往返保留", () => {
    const a = policy({ policyNo: "P-A" });
    const b = policy({ policyNo: "P-B", name: "雇主责任险" });
    a.linkedPolicyId = b.id;
    b.linkedPolicyId = a.id;
    const parsed = roundtrip([a, b], []);
    const A = parsed.policies.find((x) => x.policyNo === "P-A")!;
    const B = parsed.policies.find((x) => x.policyNo === "P-B")!;
    eq([A.linkedPolicyId === B.id, B.linkedPolicyId === A.id], [true, true], "组合险互挂");
  });

  check("保险", "保险人员模板可导入（2 人）", () => {
    const ms = parseInsuranceMembersSheet(buf(insuranceMemberTemplateWb()));
    eq(ms.map((m) => m.name), ["张三", "李四"], "模板人员");
  });
}
