import * as React from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { WideTable, usePager } from "~/components/wide-table";
import { Need, useCan } from "~/components/can";
import { fetchAudit, logOp } from "~/lib/audit";
import { authStatus } from "~/lib/auth";
import type { AuditEntry } from "~/lib/types";

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function datePart(iso: string) {
  return fmt(iso).slice(0, 10);
}

function exportAudit(rows: AuditEntry[], from: string, to: string) {
  const aoa: unknown[][] = [
    ["操作记录"],
    ["序号", "时间", "操作人", "模块", "操作", "内容"],
  ];
  [...rows]
    .sort((a, b) => (a.at || "").localeCompare(b.at || ""))
    .forEach((e, i) => {
      aoa.push([i + 1, fmt(e.at), e.userName, e.module, e.action, e.detail]);
    });
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 50 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "操作记录");
  const name = from || to ? `操作记录_${from || "起始"}_${to || "至今"}.xlsx` : "操作记录_全部.xlsx";
  XLSX.writeFile(wb, name);
}

function AuditPage() {
  const [rows, setRows] = React.useState<AuditEntry[]>([]);
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [admin, setAdmin] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [edit, setEdit] = React.useState<AuditEntry | null>(null);
  const canView = useCan("audit.view");
  async function load() {
    setRows(await fetchAudit());
    const s = await authStatus();
    setAdmin(s.user?.role === "admin");
  }
  React.useEffect(() => {
    load();
  }, []);
  const list = React.useMemo(() => {
    const s = q.trim();
    let out = rows;
    if (from) out = out.filter((e) => datePart(e.at) >= from);
    if (to) out = out.filter((e) => datePart(e.at) <= to);
    if (s) out = out.filter((e) => [e.userName, e.action, e.detail, e.module, fmt(e.at)].some((x) => x.includes(s)));
    return out;
  }, [rows, q, from, to]);
  const pager = usePager("audit", list, [q, from, to].join("|"));
  const pageRows = pager.rows;
  function doExport() {
    if (!list.length) {
      toast.error("当前没有可导出的记录");
      return;
    }
    exportAudit(list, from, to);
  }
  return (
    <Need perm="audit.view">
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-2xl font-semibold">操作记录</h1>
          <p className="mt-1 text-sm text-muted">
            人员、考勤、发放、合同、登录、权限都会记下来。
            {admin ? "只有管理员能改或删记录。" : "不能改记录，有问题找管理员。"}
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="max-w-xs" placeholder="搜姓名 / 操作 / 内容" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input
            type="date"
            className="h-9 w-40"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="开始日期"
          />
          <span className="text-sm text-muted">至</span>
          <Input
            type="date"
            className="h-9 w-40"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="结束日期"
          />
          {(from || to) && (
            <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => { setFrom(""); setTo(""); }}>
              清除区间
            </button>
          )}
          <Button variant="outline" type="button" onClick={() => void load()}>
            刷新
          </Button>
          <Button type="button" onClick={doExport}>
            导出
          </Button>
        </div>
        {admin ? (
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-sm" placeholder="管理员补记一条说明" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button
              type="button"
              onClick={async () => {
                if (!note.trim()) return;
                await logOp("备注", note.trim(), "操作记录");
                setNote("");
                await load();
                toast.success("已记下");
              }}
            >
              补记
            </Button>
          </div>
        ) : null}
        <WideTable id="audit" pager={pager as any}>
          <table className="wide-table text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="p-3">时间</th>
                <th className="p-3">操作人</th>
                <th className="p-3">模块</th>
                <th className="p-3">操作</th>
                <th className="p-3">内容</th>
                {admin ? <th className="p-3">管理</th> : null}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="whitespace-nowrap p-3">{fmt(e.at)}</td>
                  <td className="p-3">{e.userName}</td>
                  <td className="p-3">{e.module}</td>
                  <td className="p-3">
                    {edit?.id === e.id ? (
                      <Input className="h-8" value={edit.action} onChange={(ev) => setEdit({ ...edit, action: ev.target.value })} />
                    ) : (
                      e.action
                    )}
                  </td>
                  <td className="p-3">
                    {edit?.id === e.id ? (
                      <Input className="h-8" value={edit.detail} onChange={(ev) => setEdit({ ...edit, detail: ev.target.value })} />
                    ) : (
                      e.detail
                    )}
                  </td>
                  {admin ? (
                    <td className="whitespace-nowrap p-3">
                      {edit?.id === e.id ? (
                        <>
                          <Button
                            size="sm"
                            type="button"
                            onClick={async () => {
                              await fetch("/api/audit", {
                                method: "PUT",
                                credentials: "include",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify(edit),
                              });
                              setEdit(null);
                              await load();
                              toast.success("已保存");
                            }}
                          >
                            保存
                          </Button>
                          <Button size="sm" variant="ghost" type="button" onClick={() => setEdit(null)}>
                            取消
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" type="button" onClick={() => setEdit(e)}>
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            type="button"
                            onClick={async () => {
                              if (!confirm("删除这条记录？")) return;
                              await fetch(`/api/audit?id=${encodeURIComponent(e.id)}`, { method: "DELETE", credentials: "include" });
                              await load();
                            }}
                          >
                            删除
                          </Button>
                        </>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <td colSpan={admin ? 6 : 5} className="py-8 text-center text-sm text-muted">
                    {canView ? "还没有记录" : ""}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </WideTable>
      </div>
    </Need>
  );
}

export const Route = createFileRoute("/audit")({
  component: AuditPage,
});
