import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useCan } from "~/components/can";
import { authStatus, authOp } from "~/lib/auth";
import { PERM_GROUPS, PRESETS } from "~/lib/perms";

export interface Member {
  userId: string;
  name: string;
  username: string;
  isOwner?: boolean;
  perms: string[];
}

export function MembersCard() {
  const [ready, setReady] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [me, setMe] = React.useState<any>(null);
  const [bookId, setBookId] = React.useState("");
  const [pick, setPick] = React.useState("");
  const [preset, setPreset] = React.useState("read");
  const [editId, setEditId] = React.useState("");
  const [checks, setChecks] = React.useState<string[]>([]);
  const managePerm = useCan("members.manage");
  async function load() {
    const s = await authStatus();
    setMe(s.user);
    setBookId(s.bookId);
    setMembers((s.members || []) as Member[]);
    setUsers(s.users || []);
    setReady(true);
  }
  React.useEffect(() => {
    load();
  }, []);
  if (!ready || !me) return null;
  const canManage = me.role === "admin" || members.some((m) => m.isOwner && m.userId === me.id) || managePerm;
  if (!canManage) return null;
  const others = users.filter((u) => !members.some((m) => m.userId === u.id));
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-semibold">这套台账的成员</h2>
      <p className="mt-1 text-sm text-muted">管理员和创建人可以把别人加进来一起管。权限尽量勾细：只能看、能改、能删分开。</p>
      <ul className="mt-3 space-y-2">
        {members.map((m) => (
          <li key={m.userId} className="rounded-md border border-line px-3 py-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                {m.name || m.username} · {m.username}
                {m.isOwner ? <span className="ml-1 text-xs text-muted">创建人</span> : null}
              </span>
              {!m.isOwner ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setEditId(m.userId);
                      setChecks(
                        m.perms.includes("*") ? [...PERM_GROUPS.flatMap((g) => g.items.map((i) => i.id))] : m.perms,
                      );
                    }}
                  >
                    编辑权限
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={async () => {
                      if (!confirm(`把 ${m.name} 移出这套台账？`)) return;
                      await authOp("removeMember", { id: bookId, userId: m.userId });
                      await load();
                      toast.success("已移除");
                    }}
                  >
                    删除
                  </Button>
                </div>
              ) : null}
            </div>
            {editId === m.userId ? (
              <MemberChecks
                checks={checks}
                setChecks={setChecks}
                onSave={async () => {
                  await authOp("setMember", { id: bookId, userId: m.userId, perms: checks.join(",") });
                  setEditId("");
                  await load();
                  toast.success("权限已保存");
                }}
                onCancel={() => setEditId("")}
              />
            ) : (
              <div className="mt-1 text-xs text-muted">
                {m.isOwner || m.perms.includes("*") ? "全部权限" : m.perms.length ? m.perms.join("、") : "无"}
              </div>
            )}
          </li>
        ))}
      </ul>
      {/* grid-cols-1：手机单列时用显式 1fr 轨道，否则隐式 auto 轨道按 max-content 撑开、
          右侧被外层 overflow-x-hidden 裁掉（1.8.4 手机实测） */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select className="field-select h-10" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">选择用户加入</option>
          {others.map((u) => (
            <option value={u.id} key={u.id}>
              {u.name} · {u.username}
            </option>
          ))}
        </select>
        <select className="field-select h-10" value={preset} onChange={(e) => setPreset(e.target.value)}>
          {PRESETS.map((p) => (
            <option value={p.id} key={p.id}>
              {p.label}（{p.hint}）
            </option>
          ))}
        </select>
        <Button
          type="button"
          onClick={async () => {
            if (!pick) return;
            await authOp("addMember", { id: bookId, userId: pick, preset });
            setPick("");
            await load();
            toast.success("已加入这套台账");
          }}
        >
          加入
        </Button>
      </div>
    </section>
  );
}

export function MemberChecks({
  checks,
  setChecks,
  onSave,
  onCancel,
}: {
  checks: string[];
  setChecks: (v: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      {PERM_GROUPS.map((g) => (
        <div key={g.key}>
          <div className="text-xs font-medium text-muted">{g.label}</div>
          <div className="mt-1 flex flex-wrap gap-3">
            {g.items.map((i) => (
              <label key={i.id} className="inline-flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={checks.includes(i.id)}
                  onChange={(e) => {
                    setChecks(e.target.checked ? [...checks, i.id] : checks.filter((x) => x !== i.id));
                  }}
                />
                {i.label}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button size="sm" type="button" onClick={onSave}>
          保存权限
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}

