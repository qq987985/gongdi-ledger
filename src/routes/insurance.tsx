import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { WideTable, usePager } from "~/components/wide-table";
import { Need, Can, useCan } from "~/components/can";
import { useApp } from "~/lib/store";
import { daysBetween } from "~/lib/dates";
import { uid, money } from "~/lib/utils";
import { TplLink, InsuranceMemberImport } from "~/components/excel-import";
import { DocActions, setDoc } from "~/components/doc-actions";
import { useGuardedClose } from "~/lib/confirm-close";
import type { InsuranceMember, InsurancePolicy } from "~/lib/types";

function today() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function memberDays(m: InsuranceMember): number {
  return daysBetween(m.startDate, m.endDate || today());
}

function emptyPolicy(): InsurancePolicy {
  return {
    id: "",
    policyNo: "",
    buyer: "",
    name: "",
    company: "",
    premiumPerPerson: 0,
    headcount: 0,
    coverage: 0,
    periodStart: today(),
    periodEnd: "",
    contracts: [],
    remark: "",
  };
}

function emptyMember(policyId: string): InsuranceMember {
  return { id: "", policyId, name: "", leader: "", startDate: today(), endDate: "", remark: "" };
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { markDirty, requestClose } = useGuardedClose(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={requestClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel"
        onClick={(e) => e.stopPropagation()}
        onChange={markDirty}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button type="button" className="text-sm text-muted hover:text-ink" onClick={onClose}>
            关闭
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InsurancePage() {
  const policies = useApp((s) => s.insurancePolicies || []);
  const members = useApp((s) => s.insuranceMembers || []);
  const upsertPolicy = useApp((s) => s.upsertPolicy);
  const removePolicies = useApp((s) => s.removePolicies);
  const upsertMember = useApp((s) => s.upsertMember);
  const removeMembers = useApp((s) => s.removeMembers);
  const canEdit = useCan("insurance.edit");

  const [selectedId, setSelectedId] = React.useState("");
  const [leader, setLeader] = React.useState("");
  const [policyEdit, setPolicyEdit] = React.useState<InsurancePolicy | null>(null);
  const [memberEdit, setMemberEdit] = React.useState<InsuranceMember | null>(null);
  const [replaceState, setReplaceState] = React.useState<{ target: InsuranceMember; name: string; leader: string; startDate: string; remark: string } | null>(null);

  const selected = policies.find((p) => p.id === selectedId) || policies[0] || null;
  const selId = selected?.id || "";

  const policyMembers = React.useMemo(() => members.filter((m) => m.policyId === selId), [members, selId]);
  const leaders = React.useMemo(
    () => [...new Set(members.map((m) => m.leader).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh")),
    [members],
  );
  const shownMembers = React.useMemo(
    () => (leader ? policyMembers.filter((m) => m.leader === leader) : policyMembers),
    [policyMembers, leader],
  );
  const memberPager = usePager("insurance-members", shownMembers, [selId, leader].join("|"));

  const periodDays = selected ? daysBetween(selected.periodStart, selected.periodEnd) : 0;
  const premiumPerPerson = selected?.premiumPerPerson || 0;
  const headcount = selected?.headcount || 0;
  const coverage = selected?.coverage || 0;
  const totalPremium = premiumPerPerson * headcount;
  const perPersonDaily = periodDays > 0 ? premiumPerPerson / periodDays : 0;
  const activeCount = policyMembers.filter((m) => !m.endDate).length;
  const totalPersonDays = policyMembers.reduce((s, m) => s + memberDays(m), 0);
  const totalSettle = policyMembers.reduce((s, m) => s + (perPersonDaily * memberDays(m)), 0);
  const settleOf = (m: InsuranceMember) => Math.round(perPersonDaily * memberDays(m) * 100) / 100;

  function savePolicy() {
    if (!policyEdit) return;
    if (!policyEdit.policyNo.trim()) {
      toast.error("保单号必填");
      return;
    }
    const id = policyEdit.id || uid();
    upsertPolicy({ ...policyEdit, id, policyNo: policyEdit.policyNo.trim() });
    setSelectedId(id);
    setPolicyEdit(null);
    toast.success("已保存保单");
  }

  function saveMember() {
    if (!memberEdit) return;
    if (!memberEdit.name.trim()) {
      toast.error("姓名必填");
      return;
    }
    upsertMember({ ...memberEdit, id: memberEdit.id || uid(), policyId: selId });
    setMemberEdit(null);
    toast.success("已保存人员");
  }

  function confirmReplace() {
    if (!replaceState) return;
    if (!replaceState.name.trim()) {
      toast.error("新姓名必填");
      return;
    }
    if (!replaceState.startDate) {
      toast.error("开始日期必填");
      return;
    }
    const { target } = replaceState;
    upsertMember({ ...target, endDate: replaceState.startDate });
    upsertMember({
      id: uid(),
      policyId: target.policyId,
      name: replaceState.name.trim(),
      leader: replaceState.leader,
      startDate: replaceState.startDate,
      endDate: "",
      remark: replaceState.remark,
    });
    setReplaceState(null);
    toast.success(`已用「${replaceState.name.trim()}」替换「${target.name}」`);
  }

  function delPolicy(p: InsurancePolicy) {
    if (!confirm(`删除保单「${p.policyNo}」？\n\n会同时删除该保单下的所有保险人员。`)) return;
    removePolicies([p.id]);
    toast.success("已删除保单");
  }

  function delMember(m: InsuranceMember) {
    if (!confirm(`删除被保人「${m.name}」？`)) return;
    removeMembers([m.id]);
    toast.success("已删除");
  }

  return (
    <Need perm="insurance.view">
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">团体保险</h1>
            <p className="mt-1 text-sm text-muted">
              保单、被保人、替换与天数统计。这里的人员与「人员」模块完全隔离。
            </p>
          </div>
          <Can perm="insurance.edit">
            <Button type="button" onClick={() => setPolicyEdit(emptyPolicy())}>
              新增保单
            </Button>
          </Can>
        </header>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">保单</h2>
          <p className="mt-1 text-sm text-muted">点一行查看该保单下的被保人。一个保单一个保险期，天数 = 结束 − 开始 + 1。</p>
          <WideTable id="insurance-policies">
            <table className="wide-table text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th className="p-3">序号</th>
                  <th className="p-3">保单号</th>
                  <th className="p-3">名称</th>
                  <th className="p-3">保险公司</th>
                  <th className="p-3">保险期</th>
                  <th className="p-3">天数</th>
                  <th className="p-3">总保费</th>
                  <th className="p-3">在保/总</th>
                  <th className="p-3">备注</th>
                  <Can perm="insurance.edit">
                    <th className="p-3">操作</th>
                  </Can>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => {
                  const pm = members.filter((m) => m.policyId === p.id);
                  const active = pm.filter((m) => !m.endDate).length;
                  return (
                    <tr
                      key={p.id}
                      className={`cursor-pointer border-b border-line last:border-0 hover:bg-accent-soft ${selId === p.id ? "bg-accent-soft" : ""}`}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <td className="p-3 tabular-nums text-muted">{i + 1}</td>
                      <td className="p-3 font-medium">{p.policyNo}</td>
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">{p.company}</td>
                      <td className="p-3 whitespace-nowrap">
                        {p.periodStart || "—"} ~ {p.periodEnd || "—"}
                      </td>
                      <td className="p-3 tabular-nums">{daysBetween(p.periodStart, p.periodEnd) || ""}</td>
                      <td className="p-3 tabular-nums">{(p.premiumPerPerson || 0) * (p.headcount || 0) ? money((p.premiumPerPerson || 0) * (p.headcount || 0)) : ""}</td>
                      <td className="p-3 tabular-nums">
                        {active} / {pm.length}
                      </td>
                      <td className="p-3 text-muted">{p.remark}</td>
                      <Can perm="insurance.edit">
                        <td className="whitespace-nowrap p-3" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" type="button" onClick={() => setPolicyEdit(p)}>
                            编辑
                          </Button>
                          <Button size="sm" variant="ghost" type="button" onClick={() => delPolicy(p)}>
                            删除
                          </Button>
                        </td>
                      </Can>
                    </tr>
                  );
                })}
                {!policies.length ? (
                  <tr>
                    <td colSpan={canEdit ? 10 : 9} className="py-8 text-center text-sm text-muted">
                      还没有保单。点右上角「新增保单」。
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </WideTable>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">被保人{selected ? ` · ${selected.policyNo}` : ""}</h2>
          {selected ? (
            <>
              <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
                <span>保险期天数 <b className="tabular-nums text-ink">{periodDays || "—"}</b></span>
                <span>每人保费 <b className="tabular-nums text-ink">{money(premiumPerPerson)}</b> 元</span>
                <span>人数 <b className="tabular-nums text-ink">{headcount}</b></span>
                <span>保额/人 <b className="tabular-nums text-ink">{money(coverage)}</b> 元</span>
                <span>总保费 <b className="tabular-nums text-ink">{money(totalPremium)}</b> 元</span>
                <span>每人每天 <b className="tabular-nums text-ink">{money(Math.round(perPersonDaily * 100) / 100)}</b> 元</span>
                <span>在保 <b className="tabular-nums text-ink">{activeCount}</b> / {policyMembers.length}</span>
                <span>累计人天 <b className="tabular-nums text-ink">{totalPersonDays}</b></span>
                <span>保费合计 <b className="tabular-nums text-ink">{money(Math.round(totalSettle * 100) / 100)}</b> 元</span>
              </div>
              <p className="mt-1 text-xs text-subtle">
                每人每天 = 每人保费 ÷ 保险期天数；每人保费 = 每人每天 × 使用天数。
              </p>
              <p className="mt-1 text-xs text-subtle">
                同一人被替换后又回来会分成多段，各段实际天数、保费自动累加（下表按段显示）。
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select className="field-select h-9 w-auto" value={leader} onChange={(e) => setLeader(e.target.value)} aria-label="按队长筛选">
                  <option value="">全部队长</option>
                  {leaders.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <Can perm="insurance.edit">
                  <Button size="sm" variant="outline" type="button" onClick={() => setMemberEdit(emptyMember(selId))}>
                    新增人员
                  </Button>
                  <TplLink href="/api/file/insurance-member-template" filename="保险人员导入模板.xlsx" />
                  <InsuranceMemberImport policyId={selId} />
                </Can>
              </div>
              <WideTable id="insurance-members" pager={memberPager as any}>
                <table className="wide-table text-sm">
                  <thead className="border-b border-line text-xs text-muted">
                    <tr>
                      <th className="p-3">序号</th>
                      <th className="p-3">姓名</th>
                      <th className="p-3">队长</th>
                      <th className="p-3">开始日期</th>
                      <th className="p-3">结束日期</th>
                      <th className="p-3">使用天数</th>
                      <th className="p-3">保费(元)</th>
                      <th className="p-3">备注</th>
                      <Can perm="insurance.edit">
                        <th className="p-3">操作</th>
                      </Can>
                    </tr>
                  </thead>
                  <tbody>
                    {memberPager.rows.map((m: InsuranceMember, i: number) => (
                      <tr key={m.id} className="border-b border-line last:border-0">
                        <td className="p-3 tabular-nums text-muted">{(memberPager.page - 1) * memberPager.size + i + 1}</td>
                        <td className="p-3 font-medium">{m.name}</td>
                        <td className="p-3">{m.leader}</td>
                        <td className="p-3 whitespace-nowrap">{m.startDate || "—"}</td>
                        <td className="p-3 whitespace-nowrap">{m.endDate || <span className="text-ok">在保</span>}</td>
                        <td className="p-3 tabular-nums">{memberDays(m) || ""}</td>
                        <td className="p-3 tabular-nums">{money(settleOf(m))}</td>
                        <td className="p-3 text-muted">{m.remark}</td>
                        <Can perm="insurance.edit">
                          <td className="whitespace-nowrap p-3">
                            <Button size="sm" variant="outline" type="button" onClick={() => setMemberEdit(m)}>
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => setReplaceState({ target: m, name: "", leader: m.leader, startDate: today(), remark: "" })}
                            >
                              替换
                            </Button>
                            <Button size="sm" variant="ghost" type="button" onClick={() => delMember(m)}>
                              删除
                            </Button>
                          </td>
                        </Can>
                      </tr>
                    ))}
                    {!shownMembers.length ? (
                      <tr>
                        <td colSpan={canEdit ? 9 : 8} className="py-8 text-center text-sm text-muted">
                          {leader ? "这个队长下面还没有人" : "还没有被保人。点「新增人员」或「导入人员」。"}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </WideTable>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">先新增保单，再往保单里加被保人。</p>
          )}
        </section>

        {policyEdit ? (
          <Modal title={policyEdit.id ? "编辑保单" : "新增保单"} onClose={() => setPolicyEdit(null)}>
            <div className="space-y-3">
              <Field label="保单号" required>
                <Input value={policyEdit.policyNo} onChange={(e) => setPolicyEdit({ ...policyEdit, policyNo: e.target.value })} />
              </Field>
              <Field label="购买保险的公司">
                <Input value={policyEdit.buyer} onChange={(e) => setPolicyEdit({ ...policyEdit, buyer: e.target.value })} />
              </Field>
              <Field label="名称（团体/项目）">
                <Input value={policyEdit.name} onChange={(e) => setPolicyEdit({ ...policyEdit, name: e.target.value })} />
              </Field>
              <Field label="保险公司">
                <Input value={policyEdit.company} onChange={(e) => setPolicyEdit({ ...policyEdit, company: e.target.value })} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="每人保费(元)">
                  <Input type="number" min={0} value={policyEdit.premiumPerPerson || ""} onChange={(e) => setPolicyEdit({ ...policyEdit, premiumPerPerson: Number(e.target.value) })} />
                </Field>
                <Field label="人数">
                  <Input type="number" min={0} value={policyEdit.headcount || ""} onChange={(e) => setPolicyEdit({ ...policyEdit, headcount: Number(e.target.value) })} />
                </Field>
                <Field label="保额/人(元)">
                  <Input type="number" min={0} value={policyEdit.coverage || ""} onChange={(e) => setPolicyEdit({ ...policyEdit, coverage: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="保险期开始">
                  <Input type="date" value={policyEdit.periodStart} onChange={(e) => setPolicyEdit({ ...policyEdit, periodStart: e.target.value })} />
                </Field>
                <Field label="保险期结束">
                  <Input type="date" value={policyEdit.periodEnd} onChange={(e) => setPolicyEdit({ ...policyEdit, periodEnd: e.target.value })} />
                </Field>
              </div>
              <Field label="保险合同（可多份）">
                <div className="space-y-2">
                  {policyEdit.contracts.map((c) => (
                    <DocActions
                      key={c.id}
                      id={c.id}
                      kind="insurance"
                      fileName={c.fileName}
                      onDeleted={() =>
                        setPolicyEdit({ ...policyEdit, contracts: policyEdit.contracts.filter((x) => x.id !== c.id) })
                      }
                      onReplaced={(saved) =>
                        setPolicyEdit({
                          ...policyEdit,
                          contracts: policyEdit.contracts.map((x) => (x.id === c.id ? { ...x, fileName: saved } : x)),
                        })
                      }
                    />
                  ))}
                  <label className="btn inline-flex cursor-pointer items-center rounded-sm border border-line bg-surface text-xs hover:bg-accent-soft">
                    上传合同
                    <input
                      type="file"
                      accept=".pdf,.ofd,.xml,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        const id = uid();
                        const saved = (await setDoc(id, "insurance", f)) || f.name;
                        setPolicyEdit({ ...policyEdit, contracts: [...policyEdit.contracts, { id, fileName: saved }] });
                        toast.success(`已上传 ${saved}`);
                      }}
                    />
                  </label>
                </div>
              </Field>
              <Field label="备注">
                <Input value={policyEdit.remark} onChange={(e) => setPolicyEdit({ ...policyEdit, remark: e.target.value })} />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" type="button" onClick={() => setPolicyEdit(null)}>
                  取消
                </Button>
                <Button type="button" onClick={savePolicy}>
                  保存
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}

        {memberEdit ? (
          <Modal title={memberEdit.id ? "编辑被保人" : "新增被保人"} onClose={() => setMemberEdit(null)}>
            <div className="space-y-3">
              <Field label="姓名" required>
                <Input value={memberEdit.name} onChange={(e) => setMemberEdit({ ...memberEdit, name: e.target.value })} />
              </Field>
              <Field label="队长">
                <Input list="ins-leader-list" value={memberEdit.leader} onChange={(e) => setMemberEdit({ ...memberEdit, leader: e.target.value })} />
                <datalist id="ins-leader-list">
                  {leaders.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="开始日期">
                  <Input type="date" value={memberEdit.startDate} onChange={(e) => setMemberEdit({ ...memberEdit, startDate: e.target.value })} />
                </Field>
                <Field label="结束日期（空=在保）">
                  <Input type="date" value={memberEdit.endDate} onChange={(e) => setMemberEdit({ ...memberEdit, endDate: e.target.value })} />
                </Field>
              </div>
              <Field label="备注">
                <Input value={memberEdit.remark} onChange={(e) => setMemberEdit({ ...memberEdit, remark: e.target.value })} />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" type="button" onClick={() => setMemberEdit(null)}>
                  取消
                </Button>
                <Button type="button" onClick={saveMember}>
                  保存
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}

        {replaceState ? (
          <Modal title={`替换「${replaceState.target.name}」`} onClose={() => setReplaceState(null)}>
            <p className="text-sm text-muted">
              新加入的人从 {replaceState.startDate || "所选日期"} 起保；原「{replaceState.target.name}」的结束日期会自动填成这一天。
            </p>
            <div className="mt-3 space-y-3">
              <Field label="新姓名" required>
                <Input value={replaceState.name} onChange={(e) => setReplaceState({ ...replaceState, name: e.target.value })} />
              </Field>
              <Field label="队长">
                <Input list="ins-leader-list" value={replaceState.leader} onChange={(e) => setReplaceState({ ...replaceState, leader: e.target.value })} />
                <datalist id="ins-leader-list">
                  {leaders.map((l) => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
              </Field>
              <Field label="开始日期（也是原人员的结束日期）" required>
                <Input type="date" value={replaceState.startDate} onChange={(e) => setReplaceState({ ...replaceState, startDate: e.target.value })} />
              </Field>
              <Field label="备注">
                <Input value={replaceState.remark} onChange={(e) => setReplaceState({ ...replaceState, remark: e.target.value })} />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" type="button" onClick={() => setReplaceState(null)}>
                  取消
                </Button>
                <Button type="button" onClick={confirmReplace}>
                  确认替换
                </Button>
              </div>
            </div>
          </Modal>
        ) : null}
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/insurance")({
  component: InsurancePage,
});
