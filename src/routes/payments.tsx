import * as React from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { WideTable, usePager } from "~/components/wide-table";
import { Need } from "~/components/can";
import { PaymentImport, TplLink } from "~/components/excel-import";
import { YmPick, ymKey, monthsInRange, rangeLabel } from "~/components/ym-pick";
import { useApp } from "~/lib/store";
import { dateYear, derivedYears, parseDateYmd } from "~/lib/dates";
import { money, confirmBatchDelete, toggleSel, uid } from "~/lib/utils";
import type { Payment } from "~/lib/types";

function emptyPayment(): Payment {
  return { id: "", owner: "", receiver: "", date: "", amount: 0, source: "", remark: "" };
}

function PaymentsPage() {
  const store = useApp();
  const { year, people, payments, addPayment, patchPayments, removePayments } = store;
  const names = people.map((p) => p.name);
  const years = derivedYears(store);
  const [q, setQ] = React.useState("");
  const [fromY, setFromY] = React.useState(year);
  const [fromM, setFromM] = React.useState(1);
  const [toY, setToY] = React.useState(year);
  const [toM, setToM] = React.useState(12);
  const [status, setStatus] = React.useState<"all" | "pending" | "paid">("all");
  const [batch, setBatch] = React.useState("all");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<Payment | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [fillDate, setFillDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const yearOpts = React.useMemo(() => {
    const set = new Set([...years, year, fromY, toY]);
    for (const p of payments) {
      const y = dateYear(p.date);
      if (y) set.add(y);
    }
    return [...set].sort((a, b) => a - b);
  }, [years, year, fromY, toY, payments]);
  const span = React.useMemo(() => monthsInRange(fromY, fromM, toY, toM), [fromY, fromM, toY, toM]);
  const lo = ymKey(span[0].year, span[0].month);
  const hi = ymKey(span[span.length - 1].year, span[span.length - 1].month);
  const label = rangeLabel(fromY, fromM, toY, toM);
  const ranged = React.useMemo(() => {
    return payments.filter((p) => {
      const d = parseDateYmd(p.date) || p.date;
      if (!d) return true;
      const y = Number(d.slice(0, 4));
      const m = Number(d.slice(5, 7));
      if (!y || !m) return true;
      const k = ymKey(y, m);
      return k >= lo && k <= hi;
    });
  }, [payments, lo, hi]);
  const batches = React.useMemo(() => [...new Set(ranged.map((p) => p.source).filter(Boolean))], [ranged]);
  const filtered = React.useMemo(() => {
    let list = ranged;
    if (status === "pending") list = list.filter((p) => !p.date);
    if (status === "paid") list = list.filter((p) => Boolean(p.date));
    if (batch !== "all") list = list.filter((p) => p.source === batch);
    if (q.trim()) {
      const s = q.trim();
      list = list.filter((p) => [p.owner, p.receiver].some((x) => (x || "").includes(s)));
    }
    return list;
  }, [ranged, batch, q, status]);
  const pager = usePager("payments", filtered, [status, batch, q, lo, hi].join("|"));
  const pageRows = pager.rows;
  const pendingCount = ranged.filter((p) => !p.date).length;
  const pendingAmt = ranged.filter((p) => !p.date).reduce((s, p) => s + p.amount, 0);
  const paidAmt = filtered.filter((p) => p.date).reduce((s, p) => s + p.amount, 0);
  const total = filtered.reduce((s, p) => s + p.amount, 0);
  const proxyCount = filtered.filter((p) => p.owner !== p.receiver).length;
  const ownerNames = [...new Set([...names, ...payments.map((p) => p.owner)].filter(Boolean))];
  const receiverNames = [...new Set([...names, ...payments.map((p) => p.receiver)].filter(Boolean))];
  const sources = [...new Set(payments.map((p) => p.source).filter(Boolean))];
  const allChecked = pageRows.length > 0 && pageRows.every((p) => selected.includes(p.id));
  const byOwner = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const p of filtered.filter((x) => x.date)) m.set(p.owner, (m.get(p.owner) || 0) + p.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  function dropIds(ids: string[], hint: string) {
    if (!ids.length) return;
    if (!confirmBatchDelete("发放记录", ids.length, "只删发放流水。人员档案和考勤不动。")) return;
    removePayments(ids);
    setSelected((s) => s.filter((id) => !ids.includes(id)));
    toast.success(hint);
  }
  function applyDate(ids: string[], raw: string) {
    if (!ids.length) return;
    const d = parseDateYmd(raw) || raw.trim();
    if (!d) {
      toast.error("请选择或填写发放日期");
      return;
    }
    patchPayments(ids, { date: d } as any);
    setSelected([]);
    toast.success(`已给 ${ids.length} 笔补上日期 ${d}`);
  }
  return (
    <Need perm="payments.view">
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">发放记录</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">点「更改」弹出编辑。点一行是勾选。点遮罩或 Esc 关闭。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TplLink href="/api/file/payment-template" filename="发放记录导入模板.xlsx" />
            <a className="btn inline-flex items-center rounded-sm border border-line text-xs hover:bg-accent-soft" href="/api/file/payment-export">
              导出全部发放
            </a>
            <PaymentImport />
            <Button
              type="button"
              onClick={() => {
                setCreating(true);
                setEditing(emptyPayment());
              }}
            >
              新增发放
            </Button>
          </div>
        </header>
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-4">
          <YmPick label="从" years={yearOpts} y={fromY} m={fromM} onY={setFromY} onM={setFromM} />
          <span className="pb-2 text-sm text-muted">到</span>
          <YmPick label="到" years={yearOpts} y={toY} m={toM} onY={setToY} onM={setToM} />
          <p className="w-full text-xs text-muted">
            当前查询：{label} · 共 {span.length} 个月。待发放没有日期，会一直显示在列表里。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input className="max-w-xs" placeholder="搜索实际收款人 / 收款人" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field-select w-auto max-w-xs" value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value="all">全部发放方</option>
            {batches.map((b) => (
              <option value={b} key={b}>
                {b}
              </option>
            ))}
          </select>
          <div className="flex rounded-full border border-line p-0.5 text-xs">
            {[
              ["all", "全部"],
              ["pending", `待发放${pendingCount ? ` ${pendingCount}` : ""}`],
              ["paid", "已发放"],
            ].map(([k, label]) => (
              <button
                type="button"
                key={k}
                className={`h-8 rounded-full px-3 ${status === k ? "bg-accent text-accent-fg" : "text-muted"}`}
                onClick={() => setStatus(k as any)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted">
            {filtered.length} 笔 · 合计 ¥{money(total)}
            {status === "all" ? ` · 待发放 ¥${money(pendingAmt)}` : ""}
            {status === "paid" ? ` · 已发 ¥${money(paidAmt)}` : ""} · 代收 {proxyCount} 笔
          </span>
          {selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input type="date" className="w-40" value={fillDate} onChange={(e) => setFillDate(e.target.value)} />
              <Button size="sm" type="button" onClick={() => applyDate(selected, fillDate)}>
                给所选补日期（{selected.length}）
              </Button>
              <Button variant="danger" size="sm" type="button" onClick={() => dropIds(selected, `已删除 ${selected.length} 笔发放`)}>
                删除所选（{selected.length}）
              </Button>
            </div>
          ) : null}
        </div>
        <WideTable id="payments" pager={pager as any}>
          <table className="wide-table text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={allChecked}
                    onChange={(e) => {
                      const ids = pageRows.map((p) => p.id);
                      setSelected((s) => (e.target.checked ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id))));
                    }}
                    aria-label="全选发放记录"
                  />
                </th>
                <th className="p-3">操作</th>
                <th className="p-3">序号</th>
                <th className="p-3">实际收款人</th>
                <th className="p-3">发放日期</th>
                <th className="p-3">发放金额（元）</th>
                <th className="p-3">发放方</th>
                <th className="p-3">收款人</th>
                <th className="p-3">备注</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted">
                    暂无发放记录
                  </td>
                </tr>
              ) : null}
              {pageRows.map((p, i) => (
                <tr
                  key={p.id}
                  className={`group border-b border-line last:border-0 hover:bg-accent-soft ${editing?.id === p.id || selected.includes(p.id) ? "bg-accent-soft" : ""}`}
                  onClick={() => setSelected((s) => toggleSel(s, p.id, !s.includes(p.id)))}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={selected.includes(p.id)}
                      onChange={(e) => setSelected((s) => toggleSel(s, p.id, e.target.checked))}
                      aria-label={`选择 ${p.owner} ${p.date}`}
                    />
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setCreating(false);
                          setEditing(p);
                        }}
                      >
                        更改
                      </Button>
                      <Button variant="ghost" size="sm" type="button" onClick={() => dropIds([p.id], "已删除 1 笔发放")}>
                        删除
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 tabular-nums text-muted">{(pager.page - 1) * pager.size + i + 1}</td>
                  <td className="p-3 font-medium">{p.owner}</td>
                  <td className="p-3">{p.date || <Badge tone="warn">待发放</Badge>}</td>
                  <td className="p-3 tabular-nums">¥{money(p.amount)}</td>
                  <td className="p-3 text-muted">{p.source}</td>
                  <td className="p-3">
                    {p.receiver}
                    {p.owner !== p.receiver ? (
                      <Badge tone="warn" className="ml-2">
                        代收
                      </Badge>
                    ) : (
                      <Badge className="ml-2">本人</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted">{p.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </WideTable>
        {editing ? (
          <PaymentEditor
            draft={editing}
            creating={creating}
            ownerNames={ownerNames}
            receiverNames={receiverNames}
            sources={sources}
            onCancel={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSave={(row) => {
              if (creating) {
                addPayment({
                  owner: row.owner,
                  receiver: row.receiver,
                  date: row.date,
                  amount: row.amount,
                  source: row.source,
                  remark: row.remark,
                });
                toast.success(
                  row.date
                    ? row.receiver !== row.owner
                      ? `已记到 ${row.owner} 头上，${row.receiver} 代收`
                      : `已记到 ${row.owner} 头上`
                    : `已上报 ${row.owner}，待发放`,
                );
                setEditing(null);
                setCreating(false);
                return;
              }
              patchPayments([row.id], {
                owner: row.owner,
                receiver: row.receiver,
                date: row.date,
                amount: row.amount,
                source: row.source,
                remark: row.remark,
              });
              setEditing(row);
              toast.success("发放已保存");
            }}
            onDelete={() => {
              dropIds([editing.id], "已删除 1 笔发放");
              setEditing(null);
              setCreating(false);
            }}
          />
        ) : null}
        {byOwner.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <div className="border-b border-line px-4 py-2 text-xs text-muted">按实际收款人入账（只计已填日期的；待发放不算已发）</div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="p-3">实际收款人</th>
                  <th className="p-3">已入账金额</th>
                </tr>
              </thead>
              <tbody>
                {byOwner.slice(0, 12).map(([name, amt]) => (
                  <tr className="border-t border-line" key={name}>
                    <td className="p-3">{name}</td>
                    <td className="p-3 text-right tabular-nums">¥{money(amt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Need>
  );
}

function PaymentEditor({
  draft,
  creating,
  ownerNames,
  receiverNames,
  sources,
  onCancel,
  onSave,
  onDelete,
}: {
  draft: Payment;
  creating: boolean;
  ownerNames: string[];
  receiverNames: string[];
  sources: string[];
  onCancel: () => void;
  onSave: (row: Payment) => void;
  onDelete: () => void;
}) {
  const [c, setC] = React.useState<Payment>(() => ({ ...draft }));
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  React.useEffect(() => {
    setC({ ...draft });
  }, [draft.id]);
  function patch(key: keyof Payment, value: any) {
    setC((prev) => {
      const next = { ...prev, [key]: value } as Payment;
      if (key === "owner" && (!prev.receiver || prev.receiver === prev.owner)) next.receiver = value;
      return next;
    });
  }
  function save() {
    const who = (c.owner || "").trim();
    if (!who || !(Number(c.amount) > 0)) {
      toast.error("请填写实际收款人和金额");
      return;
    }
    const recv = (c.receiver || "").trim() || who;
    const date = parseDateYmd(c.date) || (c.date || "").trim();
    const next: Payment = {
      ...c,
      owner: who,
      receiver: recv,
      date,
      amount: Number(c.amount) || 0,
      source: (c.source || "").trim(),
      remark: (c.remark || "").trim(),
    };
    if (creating) {
      if (!confirm(`确认新增发放给「${who}」¥${next.amount}？`)) return;
      onSave(next);
      return;
    }
    const lines: string[] = [];
    if (next.owner !== draft.owner) lines.push(`实际收款人：「${draft.owner}」→「${next.owner}」`);
    if (next.receiver !== (draft.receiver || "")) lines.push(`收款人：「${draft.receiver || ""}」→「${next.receiver}」`);
    if ((next.date || "") !== (draft.date || "")) lines.push(`发放日期：「${draft.date || "待发放"}」→「${next.date || "待发放"}」`);
    if (Number(next.amount) !== Number(draft.amount)) lines.push(`金额：${draft.amount} → ${next.amount}`);
    if (next.source !== (draft.source || "")) lines.push(`发放方：「${draft.source || ""}」→「${next.source}」`);
    if (next.remark !== (draft.remark || "")) lines.push("备注已改");
    if (!lines.length) {
      toast.success("没有改动");
      return;
    }
    if (!confirm(`确认保存这些修改？\n${lines.join("\n")}`)) return;
    onSave(next);
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6"
      onClick={onCancel}
    >
      <section
        id="payment-editor"
        className="max-h-screen w-full max-w-5xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-6 shadow-panel md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
          <h2 className="font-display text-lg font-semibold">{creating ? "新增发放" : c.owner ? `编辑发放 · ${c.owner}` : "编辑发放"}</h2>
          <div className="btn-row">
            <Button variant="outline" type="button" onClick={onCancel}>
              关闭
            </Button>
            {!creating ? (
              <Button variant="danger" type="button" onClick={onDelete}>
                删除
              </Button>
            ) : null}
            <Button type="button" onClick={save}>
              {creating ? "确认新增" : "保存发放信息"}
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <Label>实际收款人（入账）</Label>
            <Input className="mt-2 h-11" list="pay-edit-owners" value={c.owner} placeholder="工资记在谁头上" onChange={(e) => patch("owner", e.target.value)} />
            <datalist id="pay-edit-owners">
              {ownerNames.map((n) => (
                <option value={n} key={n} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>收款人（代收可填别人）</Label>
            <Input className="mt-2 h-11" list="pay-edit-receivers" value={c.receiver} placeholder="空则同实际收款人" onChange={(e) => patch("receiver", e.target.value)} />
            <datalist id="pay-edit-receivers">
              {receiverNames.map((n) => (
                <option value={n} key={n} />
              ))}
            </datalist>
          </div>
          <div>
            <Label>发放日期（空=待发放）</Label>
            <Input className="mt-2 h-11" type="date" value={parseDateYmd(c.date) || c.date || ""} onChange={(e) => patch("date", e.target.value)} />
          </div>
          <div>
            <Label>发放金额（元）</Label>
            <Input className="mt-2 h-11" type="number" value={c.amount || ""} onChange={(e) => patch("amount", Number(e.target.value) || 0)} />
          </div>
          <div className="md:col-span-2">
            <Label>发放方</Label>
            <Input
              className="mt-2 h-11"
              list="pay-edit-sources"
              value={c.source}
              placeholder="如：五冶条钢-钻孔切割8月请款"
              onChange={(e) => patch("source", e.target.value)}
            />
            <datalist id="pay-edit-sources">
              {sources.map((n) => (
                <option value={n} key={n} />
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2">
            <Label>备注</Label>
            <Input className="mt-2 h-11" value={c.remark} onChange={(e) => patch("remark", e.target.value)} />
          </div>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});
