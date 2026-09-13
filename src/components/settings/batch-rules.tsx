import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { PayTypePick, OtRulePick } from "~/components/pay-fields";
import { uid } from "~/lib/utils";
import { localToday } from "~/lib/dates";
import { wageLabel, parseOtRule } from "~/lib/wage";
import { useApp } from "~/lib/store";
import type { Person, WageHistory } from "~/lib/types";

export function BatchRules({
  people,
  replacePeople,
  wage,
  setWage,
  monthWage,
  setMonthWage,
  payType,
  setPayType,
  rule,
  setRule,
}: {
  people: ReturnType<typeof useApp.getState>["people"];
  replacePeople: ReturnType<typeof useApp.getState>["replacePeople"];
  wage: number;
  setWage: (v: number) => void;
  monthWage: number;
  setMonthWage: (v: number) => void;
  payType: string;
  setPayType: (v: string) => void;
  rule: string;
  setRule: (v: string) => void;
}) {
  const teams = React.useMemo(() => ["全部", ...new Set(people.map((p) => p.team).filter(Boolean))], [people]);
  const [team, setTeam] = React.useState("全部");
  const [q, setQ] = React.useState("");
  const [ids, setIds] = React.useState<string[]>([]);
  const visible = people.filter((p) => {
    if (team !== "全部" && p.team !== team) return false;
    if (q.trim() && !p.name.includes(q.trim()) && !p.team.includes(q.trim())) return false;
    return true;
  });
  const visibleIds = visible.map((p) => p.id);
  const selectedVisible = ids.filter((id) => visibleIds.includes(id));
  const [asHistory, setAsHistory] = React.useState(true);
  /**
   * 把本次改动记入工资历史（今天生效），或替换今天已有的记录；不勾选则只改当前字段（历史月份会追溯重算）。
   * prev 是改动前的人（取旧工资），next 是算好新工资的人：只有这样才能给没有历史的人补一条基准，
   * 否则 getWageAt 匹配不到今天之前的历史就会回退到「当前工资」= 新工资，过去月份照样被追溯重算。
   */
  function withHistory(prev: Person, next: Person, nextPayType: "day" | "month"): Person {
    const today = localToday();
    const entry: WageHistory = {
      id: uid(),
      fromDate: today,
      payType: nextPayType,
      dailyWage: nextPayType === "month" ? prev.dailyWage : wage,
      monthWage: nextPayType === "month" ? monthWage : 0,
      otRule: rule,
      mealAllowance: prev.mealAllowance || 0,
      remark: "批量设置",
    };
    const rest = (prev.wageHistory || []).filter((h) => h.fromDate !== today);
    const hasPast = rest.some((h) => (h.fromDate || "").trim() !== "" && h.fromDate < today);
    const baseline: WageHistory[] = hasPast
      ? []
      : [
          {
            id: uid(),
            fromDate: "2000-01-01",
            payType: prev.payType,
            dailyWage: prev.dailyWage,
            monthWage: prev.monthWage,
            otRule: prev.otRule,
            mealAllowance: prev.mealAllowance || 0,
            remark: "调薪前基准（批量设置自动补录）",
          },
        ];
    return { ...next, wageHistory: [...baseline, ...rest, entry] };
  }
  function apply(idsToUse: string[], onlyBlank: boolean) {
    if (!idsToUse.length) {
      toast.error("请先勾选人员");
      return;
    }
    const isAll = idsToUse.length >= people.length;
    const scope = isAll ? `全部 ${people.length} 人` : `所选 ${idsToUse.length} 人`;
    const desc =
      payType === "month"
        ? `按月 · 月薪 ${monthWage || 0}${rule ? ` · ${rule}` : ""}`
        : `按工天 · 日薪 ${wage || 0}${rule ? ` · ${rule}` : ""}`;
    const warn =
      onlyBlank
        ? `只填「${scope}」的空白工资（已填过的不动）。${
            asHistory
              ? "且会为本次填写的人记一条今天生效的工资历史（过去月份保持原工资，不追溯重算）。"
              : ""
          }\n\n确定？`
        : `将把「${scope}」的计薪方式/工资/加班规则改成：${desc}\n\n${
            asHistory
              ? "勾选了「记为工资历史（今天生效）」：过去月份保持原工资，不会追溯重算。"
              : "未记工资历史：没有调薪记录的人员，历史月份会按新工资重算（旧工资条、查询会变）。"
          }\n\n确定？`;
    if (!confirm(warn)) return;
    const set = new Set(idsToUse);
    const nextPayType: "day" | "month" = payType === "month" ? "month" : "day";
    let n = 0;
    replacePeople(
      people.map((p: Person): Person => {
        if (!set.has(p.id)) return p;
        if (onlyBlank) {
          // 只填空白：只补工资数额，不动计薪方式和加班规则
          if (payType === "month" ? p.monthWage : p.dailyWage) return p;
          n += 1;
          const blanked: Person = nextPayType === "month" ? { ...p, monthWage } : { ...p, dailyWage: wage };
          return asHistory ? withHistory(p, blanked, nextPayType) : blanked;
        }
        n += 1;
        const next: Person =
          nextPayType === "month" ? { ...p, payType: "month", monthWage, otRule: rule } : { ...p, payType: "day", dailyWage: wage, otRule: rule };
        return asHistory ? withHistory(p, next, nextPayType) : next;
      }),
    );
    toast.success(`已更新 ${n} 人`);
  }
  return (
    <div className="mt-3 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>计薪方式</Label>
          <div className="mt-1">
            <PayTypePick value={payType} onChange={setPayType} />
          </div>
        </div>
        <div>
          <Label>{payType === "month" ? "月工资" : "日工资"}</Label>
          {payType === "month" ? (
            <Input className="mt-1" type="number" value={monthWage} onChange={(e) => setMonthWage(Number(e.target.value) || 0)} />
          ) : (
            <Input className="mt-1" type="number" value={wage} onChange={(e) => setWage(Number(e.target.value) || 0)} />
          )}
        </div>
        <div className="sm:col-span-2">
          <Label>加班规则</Label>
          <div className="mt-1">
            <OtRulePick value={rule} onChange={setRule} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="搜索姓名" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field-select w-auto" value={team} onChange={(e) => setTeam(e.target.value)}>
          {teams.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={() => setIds([...new Set([...ids, ...visibleIds])])}>
          全选当前列表
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setIds(ids.filter((id) => !visibleIds.includes(id)))}>
          取消当前列表
        </Button>
      </div>
      <div className="max-h-56 overflow-auto rounded-md border border-line">
        {visible.length === 0 ? (
          <p className="p-3 text-sm text-muted">没有人员。先在人员表添加或导入。</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {visible.map((p) => (
              <li key={p.id} className="flex items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={ids.includes(p.id)}
                  onChange={(e) => setIds((s) => (e.target.checked ? [...s, p.id] : s.filter((id) => id !== p.id)))}
                />
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-muted">{p.team || "无班组"}</span>
                <span className="ml-auto tabular-nums text-xs text-muted">
                  {wageLabel(p)} · {parseOtRule(p.otRule).label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted">
        已选 {ids.length} 人（当前列表中 {selectedVisible.length} 人）
      </p>
      <label className="flex items-start gap-2 rounded-lg bg-bg-elevated px-3 py-2 text-xs text-muted">
        <input
          type="checkbox"
          className="mt-0.5 size-4"
          checked={asHistory}
          onChange={(e) => setAsHistory(e.target.checked)}
        />
        <span>
          同时记为工资历史（今天生效）——过去月份保持原工资，不会追溯重算；不勾选则只改当前工资，
          有调薪记录的人员历史月份会按新工资算。
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => apply(ids, false)}>
          应用到所选
        </Button>
        <Button type="button" variant="outline" onClick={() => apply(ids, true)}>
          只填所选里的空白
        </Button>
        <Button type="button" variant="outline" onClick={() => apply(people.map((p) => p.id), false)}>
          应用到所有人
        </Button>
      </div>
    </div>
  );
}
