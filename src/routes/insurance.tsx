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
import { DocActions, setDoc, renameFile } from "~/components/doc-actions";
import { useGuardedClose } from "~/lib/confirm-close";
import type { InsuranceMember, InsurancePolicy } from "~/lib/types";

function today() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function datePart(dt: string): string {
  return (dt || "").slice(0, 10);
}

function safeFileBase(s: string): string {
  return (s || "").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim();
}

function memberDays(m: InsuranceMember, clampTo?: { start: string; end: string }): number {
  let start = m.startDate;
  let end = m.endDate || today();
  if (clampTo) {
    // 手填或残留日期越出保单期的部分不计，避免结算超过保费本身
    if (clampTo.start && (!start || start < clampTo.start)) start = clampTo.start;
    if (clampTo.end && (!end || end > clampTo.end)) end = clampTo.end;
  }
  if (start && end && start > end) return 0;
  return daysBetween(start, end);
}

/** 是否仍在保：没有结束日期，或结束日期还没到今天。 */
function isActive(m: InsuranceMember): boolean {
  if (!m.endDate) return true;
  const end = datePart(m.endDate);
  return end ? end >= today() : true;
}

/** 给定某天，返回前一天 23:59（用于被替换人的结束时间）。 */
function prevDayEnd(dt: string): string {
  const d = datePart(dt);
  if (!d) return "";
  const t = new Date(`${d}T00:00:00`);
  t.setDate(t.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} 23:59`;
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
    periodStart: `${today()} 00:00`,
    periodEnd: "",
    linkedPolicyId: "",
    contracts: [],
    remark: "",
  };
}

function emptyMember(policyId: string): InsuranceMember {
  return { id: "", policyId, name: "", leader: "", startDate: `${today()} 00:00`, endDate: "", remark: "" };
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

function DateTimeField({
  label,
  value,
  defaultTime,
  onChange,
  required,
}: {
  label: string;
  value: string;
  defaultTime: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const date = datePart(value);
  return (
    <Field label={label} required={required}>
      <Input
        type="date"
        value={date}
        onChange={(e) => {
          const d = e.target.value;
          onChange(d ? `${d} ${defaultTime}` : "");
        }}
      />
    </Field>
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
  const replaceMembers = useApp((s) => s.replaceMembers);
  const canEdit = useCan("insurance.edit");

  // 挂钩的保单共用一套名单：把某个保单的人员清单同步到所有与之挂钩的保单（双向）
  function syncLinked(fromPolicyId: string) {
    const st = useApp.getState();
    const all = st.insurancePolicies || [];
    const members = st.insuranceMembers || [];
    const fromMembers = members.filter((m) => m.policyId === fromPolicyId);
    const targets = new Set<string>();
    const from = all.find((p) => p.id === fromPolicyId);
    if (from?.linkedPolicyId && from.linkedPolicyId !== fromPolicyId) targets.add(from.linkedPolicyId);
    for (const p of all) {
      if (p.linkedPolicyId === fromPolicyId && p.id !== fromPolicyId) targets.add(p.id);
    }
    if (!targets.size) return;
    const others = members.filter((m) => m.policyId !== fromPolicyId && !targets.has(m.policyId));
    // 保留来源保单的成员，再把副本同步到挂钩保单
    const result = [...others, ...fromMembers];
    for (const linkedId of targets) {
      for (const m of fromMembers) result.push({ ...m, id: uid(), policyId: linkedId });
    }
    st.setInsuranceMembers(result);
  }

  const [selectedId, setSelectedId] = React.useState("");
  const [leader, setLeader] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
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
  const shownMembers = React.useMemo(() => {
    let list = policyMembers;
    if (leader) list = list.filter((m) => m.leader === leader);
    if (statusFilter === "active") list = list.filter((m) => isActive(m));
    if (statusFilter === "ended") list = list.filter((m) => !isActive(m));
    return list;
  }, [policyMembers, leader, statusFilter]);
  const memberPager = usePager("insurance-members", shownMembers, [selId, leader, statusFilter].join("|"));

  const periodDays = selected ? daysBetween(selected.periodStart, selected.periodEnd) : 0;
  const premiumPerPerson = selected?.premiumPerPerson || 0;
  const headcount = selected?.headcount || 0;
  const coverage = selected?.coverage || 0;
  const totalPremium = premiumPerPerson * headcount;
  const perPersonDaily = periodDays > 0 ? premiumPerPerson / periodDays : 0;
  // 使用天数统一夹紧到保单期，手填越界不参与结算
  const clamp = { start: selected?.periodStart || "", end: selected?.periodEnd || "" };
  const md = (m: InsuranceMember) => memberDays(m, clamp);
  const settleOf = (m: InsuranceMember) => Math.round(perPersonDaily * md(m) * 100) / 100;
  const activeCount = policyMembers.filter((m) => isActive(m)).length;
  const shownPersonDays = shownMembers.reduce((s, m) => s + md(m), 0);
  const shownSettle = shownMembers.reduce((s, m) => s + settleOf(m), 0);

  // 打印清单下边的按班组（队长）汇总：人数 / 累计人天 / 保费金额
  const leaderSummary = (() => {
    const map = new Map<string, { count: number; days: number; settle: number }>();
    for (const m of shownMembers) {
      const k = (m.leader || "").trim() || "未分班组";
      const cur = map.get(k) ?? { count: 0, days: 0, settle: 0 };
      cur.count += 1;
      cur.days += md(m);
      cur.settle += settleOf(m);
      map.set(k, cur);
    }
    return [...map.entries()]
      .map(([leader, v]) => ({ leader, ...v }))
      .sort((a, b) => {
        if (a.leader === "未分班组") return 1;
        if (b.leader === "未分班组") return -1;
        return a.leader.localeCompare(b.leader, "zh");
      });
  })();

  function savePolicy() {
    if (!policyEdit) return;
    if (!policyEdit.policyNo.trim()) {
      toast.error("保单号必填");
      return;
    }
    const pno = policyEdit.policyNo.trim();
    // 保单号重复拦截：新增或改号撞车都拒绝，避免静默覆盖已有保单
    const dup = (useApp.getState().insurancePolicies || []).find(
      (p) => p.policyNo && p.policyNo === pno && p.id !== policyEdit.id,
    );
    if (dup) {
      toast.error(`保单号「${pno}」已经用在另一张保单上（${dup.company || dup.name || "未命名"}）。要用它请直接改那张保单，或换一个号。`);
      return;
    }
    const id = policyEdit.id || uid();
    const linkedId = policyEdit.linkedPolicyId || "";
    upsertPolicy({ ...policyEdit, id, policyNo: pno, linkedPolicyId: linkedId });
    // 组合险互相挂：只在一个保单上选一次，另一个保单自动反向挂上
    const st = useApp.getState();
    const all = st.insurancePolicies || [];
    for (const p of all) {
      if (p.id !== id && p.linkedPolicyId === id && p.id !== linkedId) {
        st.upsertPolicy({ ...p, linkedPolicyId: "" });
      }
    }
    if (linkedId) {
      const target = all.find((p) => p.id === linkedId);
      if (target && target.linkedPolicyId !== id) {
        st.upsertPolicy({ ...target, linkedPolicyId: id });
      }
    }
    setSelectedId(id);
    setPolicyEdit(null);
    toast.success(linkedId ? "已保存保单，两张保单已互相挂钩为组合险" : "已保存保单");
  }

  function saveMember() {
    if (!memberEdit) return;
    if (!memberEdit.name.trim()) {
      toast.error("姓名必填");
      return;
    }
    upsertMember({ ...memberEdit, id: memberEdit.id || uid(), policyId: selId });
    syncLinked(selId);
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
    const startDay = datePart(replaceState.startDate);
    const policy = policies.find((p) => p.id === target.policyId);
    const newEnd = prevDayEnd(replaceState.startDate);
    const origEnd = target.endDate || "";
    // 已结束（或结束早于替换日）的人员不延长保险段：结束时间取「原结束」和「替换日前一天 23:59」中较早者
    const endDate = origEnd && origEnd < newEnd ? origEnd : newEnd;
    if (origEnd && origEnd.slice(0, 10) < startDay) {
      toast.warning(`「${target.name}」已于 ${datePart(origEnd)} 结束保险，本次替换不会延长其保险段；新人员从 ${startDay} 起算。`);
    }
    // 被替换人：结束 = 前一天 23:59（不晚于原结束时间）
    upsertMember({ ...target, endDate });
    // 替换人：开始 = 当天 00:00，结束 = 保险到期时间
    upsertMember({
      id: uid(),
      policyId: target.policyId,
      name: replaceState.name.trim(),
      leader: replaceState.leader,
      startDate: `${startDay} 00:00`,
      endDate: policy?.periodEnd || "",
      remark: replaceState.remark,
    });
    syncLinked(target.policyId);
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
    syncLinked(m.policyId);
    toast.success("已删除");
  }

  return (
    <Need perm="insurance.view">
      <div className="no-print space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">团体保险</h1>
            <p className="mt-1 text-sm text-muted">
              保单、被保人、替换与天数统计。这里的人员与「人员」模块完全隔离。
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">保单</h2>
              <p className="mt-1 text-sm text-muted">点一张保单查看它的被保人。一个保单一个保险期，天数 = 结束 − 开始 + 1。</p>
            </div>
            <Can perm="insurance.edit">
              <Button size="sm" type="button" onClick={() => setPolicyEdit(emptyPolicy())}>
                ＋ 新增保单
              </Button>
            </Can>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {policies.map((p) => {
              const pm = members.filter((m) => m.policyId === p.id);
              const active = pm.filter((m) => isActive(m)).length;
              const ended = pm.length - active;
              const polActive = p.periodEnd ? p.periodEnd.slice(0, 10) >= today() : true;
              return (
                <div
                  key={p.id}
                  className={`cursor-pointer rounded-xl border bg-surface p-5 transition-colors ${selId === p.id ? "border-accent bg-accent-soft/50" : "border-line hover:border-accent"}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="icon-c flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg" style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-strong)" }}>
                      🛡️
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold">{p.policyNo}</div>
                      <div className="mt-0.5 truncate text-xs text-muted">{p.company || p.name || "未命名保单"}</div>
                    </div>
                    <span className={`pill ${polActive ? "pill-ok" : "pill-gray"}`}>{polActive ? "在保" : "已结束"}</span>
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-muted">
                    <div>
                      保险期 <b className="tabular-nums text-ink">{datePart(p.periodStart) || "—"} → {datePart(p.periodEnd) || "—"}</b> · <b className="tabular-nums text-ink">{daysBetween(p.periodStart, p.periodEnd) || "-"}</b> 天
                    </div>
                    <div>
                      每人保费 <b className="tabular-nums text-ink">{money(p.premiumPerPerson || 0)}</b> × <b className="tabular-nums text-ink">{p.headcount || 0}</b> 人 = 总保费 <b className="tabular-nums text-ink">{money((p.premiumPerPerson || 0) * (p.headcount || 0))}</b>
                    </div>
                    <div>
                      在保 <b className="tabular-nums text-ink">{active}</b> 人 · 已结束 <b className="tabular-nums text-ink">{ended}</b> 人 · 累计人天 <b className="tabular-nums text-ink">{pm.reduce((s, m) => s + memberDays(m, { start: p.periodStart, end: p.periodEnd }), 0) || 0}</b>
                    </div>
                    {p.linkedPolicyId ? (
                      <div className="text-xs text-subtle">
                        ↔ 组合险：{policies.find((x) => x.id === p.linkedPolicyId)?.policyNo || "已解除"}
                      </div>
                    ) : null}
                  </div>
                  <Can perm="insurance.edit">
                    <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="flex-1" type="button" onClick={() => setPolicyEdit(p)}>
                        编辑
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1" type="button" onClick={() => delPolicy(p)}>
                        删除
                      </Button>
                    </div>
                  </Can>
                </div>
              );
            })}
            {!policies.length ? (
              <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted md:col-span-2">
                还没有保单。点「新增保单」开始。
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          {selected ? (
            <>
              <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
                <span>保险期天数 <b className="tabular-nums text-ink">{periodDays || "—"}</b></span>
                <span>每人保费 <b className="tabular-nums text-ink">{money(premiumPerPerson)}</b> 元</span>
                <span>人数 <b className="tabular-nums text-ink">{headcount}</b></span>
                <span>保额/人 <b className="tabular-nums text-ink">{money(coverage)}</b> 元</span>
                <span>总保费 <b className="tabular-nums text-ink">{money(totalPremium)}</b> 元</span>
                <span>每人每天 <b className="tabular-nums text-ink">{money(Math.round(perPersonDaily * 100) / 100)}</b> 元</span>
                <span>在保 <b className="tabular-nums text-ink">{activeCount}</b> 人 · 已结束 <b className="tabular-nums text-ink">{policyMembers.length - activeCount}</b> 人</span>
                <span>累计人天 <b className="tabular-nums text-ink">{Math.round(shownPersonDays * 100) / 100}</b></span>
                <span>保费合计 <b className="tabular-nums text-ink">{money(Math.round(shownSettle * 100) / 100)}</b> 元</span>
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
                <select className="field-select h-9 w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="按在保状态筛选">
                  <option value="">全部状态</option>
                  <option value="active">在保</option>
                  <option value="ended">已结束</option>
                </select>
                <Button size="sm" variant="outline" type="button" onClick={() => window.print()}>
                  打印清单
                </Button>
                <Can perm="insurance.edit">
                  <Button size="sm" variant="outline" type="button" onClick={() => setMemberEdit(emptyMember(selId))}>
                    新增人员
                  </Button>
                  <TplLink href="/api/file/insurance-member-template" filename="保险人员导入模板.xlsx" />
                  <InsuranceMemberImport policyId={selId} onImported={() => syncLinked(selId)} />
                </Can>
              </div>
              <h3 className="mt-4 font-semibold">参保人员（保单号：{selected.policyNo}）</h3>
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
                        <td className="p-3 whitespace-nowrap">{datePart(m.startDate) || "—"}</td>
                        <td className="p-3 whitespace-nowrap">
                          {m.endDate ? (
                            <>
                              {datePart(m.endDate)}
                              {isActive(m) ? <span className="ml-1 text-ok">在保</span> : null}
                            </>
                          ) : (
                            <span className="text-ok">在保</span>
                          )}
                        </td>
                        <td className="p-3 tabular-nums">{md(m) || ""}</td>
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
              <Field label="组合险保单（选一次即互相挂钩，换人一起换）">
                <select
                  className="field-select w-full"
                  value={policyEdit.linkedPolicyId}
                  onChange={(e) => setPolicyEdit({ ...policyEdit, linkedPolicyId: e.target.value })}
                >
                  <option value="">不组合（单独保单）</option>
                  {policies
                    .filter((p) => p.id !== policyEdit.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.policyNo}{p.name ? ` · ${p.name}` : ""}
                      </option>
                    ))}
                </select>
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
              <DateTimeField
                label="保险期开始"
                value={policyEdit.periodStart}
                defaultTime="00:00"
                onChange={(v) => setPolicyEdit({ ...policyEdit, periodStart: v })}
              />
              <DateTimeField
                label="保险期结束"
                value={policyEdit.periodEnd}
                defaultTime="23:59"
                onChange={(v) => setPolicyEdit({ ...policyEdit, periodEnd: v })}
              />
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
                        const parts = [policyEdit.policyNo, policyEdit.buyer, datePart(policyEdit.periodStart).replace(/-/g, "")]
                          .map((s) => safeFileBase(s))
                          .filter(Boolean);
                        const base = parts.join("-") || "保险合同";
                        const named = renameFile(f, base);
                        const id = uid();
                        const saved = (await setDoc(id, "insurance", named)) || named.name;
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
              <DateTimeField
                label="开始日期"
                value={memberEdit.startDate}
                defaultTime="00:00"
                onChange={(v) => setMemberEdit({ ...memberEdit, startDate: v })}
                required
              />
              <DateTimeField
                label="结束日期（空=在保）"
                value={memberEdit.endDate}
                defaultTime="23:59"
                onChange={(v) => setMemberEdit({ ...memberEdit, endDate: v })}
              />
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
              新加入的人从「{replaceState.startDate || "所选日期"} 00:00」起保，到保险到期结束；原「{replaceState.target.name}」的结束时间自动填成前一天 23:59。
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
              <Field label="替换生效日期（当天 00:00 起）" required>
                <Input
                  type="date"
                  value={datePart(replaceState.startDate)}
                  onChange={(e) => setReplaceState({ ...replaceState, startDate: e.target.value })}
                />
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

      {selected ? (
        <div className="print-only text-black">
          <article className="p-2">
            <header className="border-b-2 border-black pb-2 text-center">
              <div className="text-xl font-semibold">团体保险人员清单</div>
              <div className="mt-1 text-sm">
                {selected.policyNo}
                {selected.name ? ` · ${selected.name}` : ""}
                {leader ? ` · 队长：${leader}` : ""}
                {statusFilter === "active" ? " · 在保" : statusFilter === "ended" ? " · 已结束" : ""}
              </div>
            </header>
            <table className="mt-3 w-full border-collapse text-center text-sm">
              <thead>
                <tr>
                  {["序号", "姓名", "队长", "开始日期", "结束日期", "使用天数", "保费(元)"].map((h) => (
                    <th key={h} className="border border-black px-2 py-1 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...shownMembers]
                  .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "") || a.name.localeCompare(b.name, "zh"))
                  .map((m, i) => (
                    <tr key={m.id}>
                      <td className="border border-black px-2 py-1">{i + 1}</td>
                      <td className="border border-black px-2 py-1">{m.name}</td>
                      <td className="border border-black px-2 py-1">{m.leader}</td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">{datePart(m.startDate) || "—"}</td>
                      <td className="border border-black px-2 py-1 whitespace-nowrap">{datePart(m.endDate) || "在保"}</td>
                      <td className="border border-black px-2 py-1">{md(m) || ""}</td>
                      <td className="border border-black px-2 py-1">{money(settleOf(m))}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="border border-black px-2 py-1 text-right" colSpan={5}>
                    合计
                  </td>
                  <td className="border border-black px-2 py-1">{Math.round(shownPersonDays * 100) / 100}</td>
                  <td className="border border-black px-2 py-1">{money(Math.round(shownSettle * 100) / 100)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-6 break-inside-avoid">
              <div className="text-center text-sm font-semibold">按班组汇总（保费）</div>
              <table className="mt-2 w-full border-collapse text-center text-sm">
                <thead>
                  <tr>
                    {["班组（队长）", "人数", "累计人天", "保费(元)"].map((h) => (
                      <th key={h} className="border border-black px-2 py-0.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderSummary.map((g) => (
                    <tr key={g.leader}>
                      <td className="border border-black px-2 py-0.5">{g.leader}</td>
                      <td className="border border-black px-2 py-0.5">{g.count}</td>
                      <td className="border border-black px-2 py-0.5">{Math.round(g.days * 100) / 100}</td>
                      <td className="border border-black px-2 py-0.5">{money(Math.round(g.settle * 100) / 100)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="border border-black px-2 py-0.5 text-right">合计</td>
                    <td className="border border-black px-2 py-0.5">{leaderSummary.reduce((s, g) => s + g.count, 0)}</td>
                    <td className="border border-black px-2 py-0.5">{Math.round(shownPersonDays * 100) / 100}</td>
                    <td className="border border-black px-2 py-0.5">{money(Math.round(shownSettle * 100) / 100)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </article>
        </div>
      ) : null}
    </Need>
  );
}

export const Route = createFileRoute("/insurance")({
  component: InsurancePage,
});
