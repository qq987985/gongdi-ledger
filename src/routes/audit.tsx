import * as React from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { WideTable } from "~/components/wide-table";
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

function AuditPage() {
  const [rows, setRows] = React.useState<AuditEntry[]>([]);
  const [q, setQ] = React.useState("");
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
    if (!s) return rows;
    return rows.filter((e) => [e.userName, e.action, e.detail, e.module, fmt(e.at)].some((x) => x.includes(s)));
  }, [rows, q]);
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
        <div className="flex flex-wrap gap-2">
          <Input className="max-w-xs" placeholder="搜姓名 / 操作 / 内容" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="outline" type="button" onClick={() => void load()}>
            刷新
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
        <WideTable id="audit">
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
              {list.map((e) => (
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
                            改
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
                            删
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
