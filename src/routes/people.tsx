import * as React from "react";
import { CalendarDays, History } from "lucide-react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, usePager } from "~/components/wide-table";
import { Can, Need } from "~/components/can";
import { PeopleImport, TplLink } from "~/components/excel-import";
import { PhotoSlot, ScanPhotosButton, usePhotoFlags } from "~/components/photo-slot";
import { PayTypePick, OtRulePick } from "~/components/pay-fields";
import { parseIdCard, validateIdCard, normalizeIdDate } from "~/lib/idcard";
import { parseDateYmd } from "~/lib/dates";
import { wageLabel, parseOtRule } from "~/lib/wage";
import { overAgeLabel } from "~/lib/idcard";
import { confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import { useGuardedClose } from "~/lib/confirm-close";
import { useApp } from "~/lib/store";
import type { Person, WageHistory } from "~/lib/types";

function emptyWageHistory(): WageHistory {
  return {
    id: uid(),
    fromDate: "",
    payType: "day",
    dailyWage: 0,
    monthWage: 0,
    otRule: "",
    mealAllowance: 0,
    remark: "",
  };
}

function emptyPerson(): Person {
  return {
    id: uid(),
    name: "",
    team: "",
    personNo: "",
    idCard: "",
    gender: "",
    age: null,
    birthday: "",
    phone: "",
    dailyWage: 0,
    monthWage: 0,
    payType: "day",
    otRule: "",
    mealAllowance: 0,
    wageHistory: [],
    bank: "",
    cardNo: "",
    address: "",
    idIssuer: "",
    idValidFrom: "",
    idValidTo: "",
    remark: "",
  };
}

function PeoplePage() {
  const people = useApp((s) => s.people);
  const upsert = useApp((s) => s.upsertPerson);
  const addPerson = useApp((s) => s.addPerson);
  const removePeople = useApp((s) => s.removePeople);
  const [q, setQ] = React.useState("");
  const [team, setTeam] = React.useState("全部");
  const [editing, setEditing] = React.useState<Person | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [photoTick, setPhotoTick] = React.useState(0);
  const names = React.useMemo(() => people.map((p) => p.name), [people]);
  const flags = usePhotoFlags(names, photoTick);
  const teams = React.useMemo(() => ["全部", ...new Set(people.map((p) => p.team).filter(Boolean))], [people]);
  const filtered = people.filter((p) => {
    if (team !== "全部" && p.team !== team) return false;
    if (!q.trim()) return true;
    const s = q.trim();
    return [p.name, p.team, p.idCard, p.phone, p.personNo].some((x) => String(x).includes(s));
  });
  const pager = usePager("people", filtered, [q, team].join("|"));
  const pageRows = pager.rows;
  function closeEditor() {
    setEditing(null);
    setCreating(false);
    setPhotoTick((n) => n + 1);
  }
  return (
    <Need perm="people.view">
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">人员管理</h1>
            <p className="mt-1 text-sm text-muted">带 * 的必须填：姓名、班组。日工资可以填 0。按月计薪才必须填月工资。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScanPhotosButton names={people.map((p) => p.name)} onDone={() => setPhotoTick((n) => n + 1)} />
            <TplLink href="/api/file/people-template" filename="人员导入模板.xlsx" />
            <a
              className="btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft"
              href="/api/file/people-export"
            >
              导出人员名单
            </a>
            <Can perm="import.use">
              <PeopleImport />
            </Can>
            <Can perm="people.edit">
              <Button
                onClick={() => {
                  setCreating(true);
                  setEditing(emptyPerson());
                }}
              >
                新增人员
              </Button>
            </Can>
          </div>
        </header>
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="搜索姓名 / 身份证 / 电话"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="field-select" value={team} onChange={(e) => setTeam(e.target.value)}>
            {teams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {selected.length > 0 ? (
            <Can perm="people.delete">
              <Button
                variant="danger"
                onClick={() => {
                  if (!confirmBatchDelete("人员", selected.length, "只删人员档案。考勤、发放记录里的名字还在，照片文件仍在目录里。")) return;
                  removePeople(selected);
                  setSelected([]);
                  toast.success(`已删除 ${selected.length} 人`);
                }}
              >
                删除所选（{selected.length}）
              </Button>
            </Can>
          ) : (
            <span className="text-xs text-muted">勾选左侧方框可多选删除</span>
          )}
        </div>
        <WideTable id="people" pager={pager as any}>
          <table className="wide-table text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={pageRows.length > 0 && pageRows.every((p) => selected.includes(p.id))}
                    onChange={(e) => {
                      const ids = pageRows.map((p) => p.id);
                      setSelected((s) => (e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id))));
                    }}
                    aria-label="全选人员"
                  />
                </th>
                <th className="p-3">操作</th>
                <th className="p-3">序号</th>
                <th className="p-3">
                  姓名 <span className="text-danger">*</span>
                </th>
                <th className="p-3">
                  班组 <span className="text-danger">*</span>
                </th>
                <th className="p-3">计薪</th>
                <th className="p-3">
                  工资 <span className="text-danger">*</span>
                </th>
                <th className="p-3">加班</th>
                <th className="p-3">餐补</th>
                <th className="p-3">年龄</th>
                <th className="p-3">电话</th>
                <th className="p-3">照片</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-sm text-muted">
                    没有匹配的人员
                  </td>
                </tr>
              ) : null}
              {pageRows.map((p, i) => {
                const f = flags[p.name];
                const n = (f?.id ? 1 : 0) + (f?.idBack ? 1 : 0) + (f?.bank ? 1 : 0) + (f?.ic ? 1 : 0);
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-line last:border-0 hover:bg-accent-soft ${selected.includes(p.id) || editing?.id === p.id ? "bg-accent-soft" : ""}`}
                    onClick={() => setSelected((s) => toggleSel(s, p.id, !s.includes(p.id)))}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={selected.includes(p.id)}
                        onChange={(e) => setSelected((s) => toggleSel(s, p.id, e.target.checked))}
                      />
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" type="button" onClick={() => setEditing(p)}>
                        编辑
                      </Button>
                    </td>
                    <td className="p-3 tabular-nums text-muted">{(pager.page - 1) * pager.size + i + 1}</td>
                    <td className="p-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-subtle">{p.personNo}</div>
                    </td>
                    <td className="p-3 text-muted">{p.team}</td>
                    <td className="p-3 text-muted">{p.payType === "month" ? "按月" : "按工天"}</td>
                    <td className="p-3 tabular-nums">{wageLabel(p)}</td>
                    <td className="p-3">{parseOtRule(p.otRule).label}</td>
                    <td className="p-3 tabular-nums">{p.mealAllowance ? `¥${p.mealAllowance}/天` : "—"}</td>
                    <td className="p-3">
                      <span className="tabular-nums">{p.age ?? "—"}</span>{" "}
                      {overAgeLabel(p.age, p.gender) === "超龄" ? <Badge tone="warn">超龄</Badge> : null}
                    </td>
                    <td className="p-3 tabular-nums">{p.phone || "—"}</td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button className="text-left text-xs text-accent" type="button" onClick={() => setEditing(p)}>
                        {n}/4 已上传
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </WideTable>
        {editing ? (
          <PersonEditor
            person={editing}
            creating={creating}
            refresh={photoTick}
            onClose={closeEditor}
            onChanged={() => setPhotoTick((n) => n + 1)}
            onSave={(p) => {
              if (creating) {
                if (people.some((x) => x.name === p.name)) {
                  toast.error("已有同名人员，请改名或直接编辑原记录");
                  return;
                }
                addPerson(p);
                toast.success("已添加");
              } else {
                upsert(p);
                toast.success("已保存");
              }
              closeEditor();
            }}
            onDelete={() => {
              if (!confirmBatchDelete("人员", 1, `将删除 ${editing.name} 的档案。考勤和发放记录里的名字还在。`)) return;
              removePeople([editing.id]);
              setSelected((s) => s.filter((id) => id !== editing.id));
              toast.success(`已删除 ${editing.name}`);
              closeEditor();
            }}
          />
        ) : null}
      </div>
    </Need>
  );
}

function confirmEdits(kind: string, name: string, creating: boolean, before: any, after: any, labels: Record<string, string>) {
  if (typeof window === "undefined") return true;
  if (creating) return window.confirm(`确认新增${kind}「${name || "未命名"}」？`);
  const lines: string[] = [];
  for (const key of Object.keys(labels)) {
    let a = before?.[key],
      b = after?.[key];
    if (a === true) a = "是";
    else if (a === false) a = "否";
    if (b === true) b = "是";
    else if (b === false) b = "否";
    if (a === "day") a = "按工天";
    if (b === "day") b = "按工天";
    if (a === "month") a = "按月";
    if (b === "month") b = "按月";
    const as = a == null || a === "" ? "（空）" : String(a);
    const bs = b == null || b === "" ? "（空）" : String(b);
    if (as === bs) continue;
    lines.push(`${labels[key]}：${as} → ${bs}`);
  }
  if (!lines.length) return window.confirm(`没有改动。仍要保存${kind}「${name}」？`);
  const show = lines.slice(0, 8);
  const extra = lines.length > 8 ? `\n…另有 ${lines.length - 8} 项` : "";
  return window.confirm(`确认保存${kind}「${name}」？\n\n改了 ${lines.length} 项：\n${show.join("\n")}${extra}`);
}

function PersonEditor({
  person,
  creating,
  refresh = 0,
  onClose,
  onSave,
  onDelete,
  onChanged,
}: {
  person: Person;
  creating: boolean;
  refresh?: number;
  onClose: () => void;
  onSave: (p: Person) => void;
  onDelete?: () => void;
  onChanged?: () => void;
}) {
  const [form, setForm] = React.useState<Person>(() => ({
    ...person,
    idValidFrom: normalizeIdDate(person.idValidFrom),
    idValidTo: normalizeIdDate(person.idValidTo, true),
  }));
  const [tried, setTried] = React.useState(false);
  const [idErr, setIdErr] = React.useState("");
  const { markDirty, requestClose } = useGuardedClose(onClose);
  function set<K extends keyof Person>(k: K, v: Person[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function onId(idCard: string) {
    const parsed = parseIdCard(idCard);
    setIdErr(validateIdCard(idCard));
    setForm((f) => ({ ...f, idCard, gender: parsed.gender || f.gender, age: parsed.age, birthday: parsed.birthday || f.birthday }));
  }
  const errors = {
    name: !form.name.trim() ? "请填写姓名" : "",
    team: !form.team.trim() ? "请填写班组" : "",
    monthWage: form.payType === "month" && (!form.monthWage || form.monthWage <= 0) ? "请填写月工资" : "",
  };
  const missing = Object.values(errors).filter(Boolean);
  function save() {
    setTried(true);
    if (missing.length) {
      toast.error(
        `必填未完成：${[errors.name && "姓名", errors.team && "班组", errors.monthWage && "月工资"].filter(Boolean).join("、")}`,
      );
      return;
    }
    if (idErr) {
      toast.error(`身份证号有误：${idErr}`);
      return;
    }
    const badWage = (form.wageHistory || []).find((h) => !(h.fromDate || "").trim());
    if (badWage) {
      toast.error("工资记录的「生效日期」必填，否则历史月份会算错工资");
      return;
    }
    const next: Person = {
      ...form,
      idValidFrom: normalizeIdDate(form.idValidFrom),
      idValidTo: normalizeIdDate(form.idValidTo, true),
    };
    if (
      !confirmEdits("人员", next.name, creating, person, next, {
        name: "姓名",
        team: "班组",
        payType: "计薪",
        dailyWage: "日工资",
        monthWage: "月工资",
        otRule: "加班",
        mealAllowance: "餐补",
        idCard: "身份证号",
        idIssuer: "签发机关",
        idValidFrom: "有效期起",
        idValidTo: "有效期止",
        phone: "电话",
        personNo: "IC卡号",
        bank: "开户行",
        cardNo: "银行卡号",
        address: "户籍地址",
        remark: "备注",
      })
    )
      return;
    onSave(next);
  }
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 md:items-center md:p-6" onClick={requestClose}>
      <div
        className="max-h-screen w-full max-w-3xl overflow-y-auto rounded-t-xl bg-surface p-5 shadow-panel md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onChange={markDirty}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{creating ? "新增人员" : form.name}</h2>
          <div className="flex items-center gap-2">
            {!creating ? (
              <Button variant="danger" size="sm" onClick={() => onDelete?.()}>
                删除
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button size="sm" onClick={save}>
              保存
            </Button>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-sm text-xl leading-none text-muted hover:bg-accent-soft hover:text-ink"
              aria-label="关闭"
              title="关闭（Esc）"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="姓名" required error={tried ? errors.name : ""}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} aria-required />
          </Field>
          <Field label="班组" required error={tried ? errors.team : ""}>
            <Input value={form.team} onChange={(e) => set("team", e.target.value)} aria-required />
          </Field>
          <Field label="计薪方式" hint="大多数人选按工天。按月的人当月有出勤就发月工资，缺勤用扣款。">
            <PayTypePick value={form.payType === "month" ? "month" : "day"} onChange={(v) => set("payType", v)} />
          </Field>
          {form.payType === "month" ? (
            <Field label="月工资" required error={tried ? errors.monthWage : ""}>
              <Input
                type="number"
                value={form.monthWage || ""}
                onChange={(e) => set("monthWage", Number(e.target.value) || 0)}
                aria-required
              />
            </Field>
          ) : (
            <Field label="日工资" hint="可以填 0">
              <Input type="number" min={0} value={form.dailyWage} onChange={(e) => set("dailyWage", Number(e.target.value) || 0)} />
            </Field>
          )}
          <Field label="加班规则" hint="选按小时填元/小时；选按折算填几小时算一天。可不计加班。">
            <OtRulePick value={form.otRule} onChange={(s) => set("otRule", s)} />
          </Field>
          <Field label="餐补/天" hint="按正常出勤天数算，加班折算的工天不算。填0表示没有餐补。">
            <Input type="number" min={0} value={form.mealAllowance || ""} onChange={(e) => set("mealAllowance", Number(e.target.value) || 0)} />
          </Field>
          <Field label="身份证号（自动生成性别年龄生日）" error={idErr}>
            <Input value={form.idCard} onChange={(e) => onId(e.target.value)} />
          </Field>
          <Field label="身份证签发机关">
            <Input value={form.idIssuer} onChange={(e) => set("idIssuer", e.target.value)} placeholder="如 某某县公安局" />
          </Field>
          <Field label="身份证有效期开始" hint="一个框：手填或点右边日历，保存成 2007-04-29">
            <DateFill value={form.idValidFrom} onChange={(v) => set("idValidFrom", v)} />
          </Field>
          <Field label="身份证有效期结束" hint="手填、点日历，或点长期">
            <DateFill value={form.idValidTo} onChange={(v) => set("idValidTo", v)} allowLong />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="性别">
              <Input value={form.gender} readOnly />
            </Field>
            <Field label="年龄">
              <Input value={form.age ?? ""} readOnly />
            </Field>
            <Field label="生日">
              <Input value={form.birthday} readOnly />
            </Field>
          </div>
          <Field label="联系电话">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="IC卡号">
            <Input value={form.personNo} onChange={(e) => set("personNo", e.target.value)} />
          </Field>
          <Field label="开户行">
            <Input value={form.bank} onChange={(e) => set("bank", e.target.value)} />
          </Field>
          <Field label="银行卡号">
            <Input value={form.cardNo} onChange={(e) => set("cardNo", e.target.value)} />
          </Field>
          <Field label="户籍地址" className="md:col-span-2">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="备注" className="md:col-span-2">
            <Input value={form.remark} onChange={(e) => set("remark", e.target.value)} />
          </Field>
        </div>
        {/* 工资历史管理 */}
        <div className="mt-6 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <History className="size-4" />
              工资变更历史
              <span className="text-xs font-normal text-muted">（可选，用于记录工资调整）</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const history = [...(form.wageHistory || []), emptyWageHistory()];
                setForm((f) => ({ ...f, wageHistory: history }));
              }}
            >
              添加工资记录
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            设置后，考勤会自动按生效日期匹配对应的工资。不填则一直使用当前工资。
          </p>
          {(form.wageHistory || []).length > 0 ? (
            <div className="mt-3 space-y-2">
              {(form.wageHistory || []).map((h, i) => (
                <div key={h.id} className="flex flex-wrap items-end gap-2 rounded-md border border-line bg-accent-soft/30 p-3">
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs">生效日期</Label>
                    <Input
                      type="date"
                      className="mt-1 h-9"
                      value={h.fromDate}
                      onChange={(e) => {
                        const history = [...(form.wageHistory || [])];
                        history[i] = { ...h, fromDate: e.target.value };
                        setForm((f) => ({ ...f, wageHistory: history }));
                      }}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">计薪</Label>
                    <PayTypePick
                      value={h.payType}
                      onChange={(v) => {
                        const history = [...(form.wageHistory || [])];
                        history[i] = { ...h, payType: v };
                        setForm((f) => ({ ...f, wageHistory: history }));
                      }}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">{h.payType === "month" ? "月工资" : "日工资"}</Label>
                    <Input
                      type="number"
                      className="mt-1 h-9"
                      value={h.payType === "month" ? h.monthWage || "" : h.dailyWage || ""}
                      onChange={(e) => {
                        const history = [...(form.wageHistory || [])];
                        const val = Number(e.target.value) || 0;
                        history[i] = { ...h, [h.payType === "month" ? "monthWage" : "dailyWage"]: val };
                        setForm((f) => ({ ...f, wageHistory: history }));
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <Label className="text-xs">加班规则</Label>
                    <OtRulePick
                      value={h.otRule}
                      onChange={(s) => {
                        const history = [...(form.wageHistory || [])];
                        history[i] = { ...h, otRule: s };
                        setForm((f) => ({ ...f, wageHistory: history }));
                      }}
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">餐补/天</Label>
                    <Input
                      type="number"
                      className="mt-1 h-9"
                      value={h.mealAllowance || ""}
                      onChange={(e) => {
                        const history = [...(form.wageHistory || [])];
                        history[i] = { ...h, mealAllowance: Number(e.target.value) || 0 };
                        setForm((f) => ({ ...f, wageHistory: history }));
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-xs">备注</Label>
                    <Input
                      className="mt-1 h-9"
                      value={h.remark}
                      placeholder="如：涨薪、调岗"
                      onChange={(e) => {
                        const history = [...(form.wageHistory || [])];
                        history[i] = { ...h, remark: e.target.value };
                        setForm((f) => ({ ...f, wageHistory: history }));
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => {
                      const history = (form.wageHistory || []).filter((_, idx) => idx !== i);
                      setForm((f) => ({ ...f, wageHistory: history }));
                    }}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        {form.name ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <PhotoSlot key={`id-${refresh}`} name={form.name} kind="id" onChanged={onChanged} />
            <PhotoSlot key={`bank-${refresh}`} name={form.name} kind="bank" onChanged={onChanged} />
            <PhotoSlot key={`ic-${refresh}`} name={form.name} kind="ic" onChanged={onChanged} />
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted">
            先填姓名再上传。身份证格子只显示正面，边上可点「查看反面」。也可直接拷到 NAS：data/photos/id，文件名「张三-身份证-正面.jpg」「张三-身份证-反面.jpg」。
          </p>
        )}
      </div>
    </div>
  );
}

function DateFill({ value, onChange, allowLong }: { value: string; onChange: (v: string) => void; allowLong?: boolean }) {
  const shown = value === "长期" ? "长期" : normalizeIdDate(value) || value;
  const iso = parseDateYmd(value);
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Input
          className="pr-10"
          value={shown}
          placeholder={allowLong ? "2007-04-29 或 长期" : "2007-04-29"}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (allowLong && /长期/.test(v)) onChange("长期");
            else onChange(v);
          }}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (!v) return;
            if (allowLong && /长期/.test(v)) {
              onChange("长期");
              return;
            }
            const n = normalizeIdDate(v);
            if (n && n !== v) onChange(n);
          }}
        />
        <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted hover:text-ink" title="选日期">
          <CalendarDays className="size-4" />
          <input
            type="date"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={iso}
            onChange={(e) => onChange(e.target.value)}
            aria-label="选日期"
          />
        </label>
      </div>
      {allowLong ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange("长期")}>
          长期
        </Button>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  className,
  required,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </Label>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const Route = createFileRoute("/people")({
  component: PeoplePage,
});
