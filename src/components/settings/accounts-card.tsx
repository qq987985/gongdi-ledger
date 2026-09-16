import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { authStatus, authOp } from "~/lib/auth";
import { dropLocalLedger, pullNasLedger, flushPendingLedger, setCacheOwner } from "~/lib/nas-sync";
import { PRESETS } from "~/lib/perms";

export function AccountsCard() {
  const [ready, setReady] = React.useState(false);
  const [persist, setPersist] = React.useState(false);
  const [me, setMe] = React.useState<any>(null);
  const [books, setBooks] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [bookName, setBookName] = React.useState("");
  const [renaming, setRenaming] = React.useState("");
  const [renameTo, setRenameTo] = React.useState("");
  const [uName, setUName] = React.useState("");
  const [uUser, setUUser] = React.useState("");
  const [uPwd, setUPwd] = React.useState("");
  const [joinCur, setJoinCur] = React.useState(true);
  const [joinPreset, setJoinPreset] = React.useState("read");
  const [resets, setResets] = React.useState<Record<string, string>>({});
  const [edits, setEdits] = React.useState<Record<string, { name: string; username: string }>>({});
  const [oldPwd, setOldPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  // 新建类操作请求期间禁用按钮：网络慢时用户会连点两下，
  // 「新建台账」连点会建出两本同名台账、「新建账户」会重复提交一次（1.8.1）
  const [creating, setCreating] = React.useState(false);
  async function load() {
    const s = await authStatus();
    setPersist(s.persist);
    setMe(s.user);
    setBooks(s.books);
    setUsers(s.users || []);
    setEdits(
      Object.fromEntries(
        (s.users || []).map((u: any) => [
          u.id,
          { name: u.name, username: u.username },
        ]),
      ),
    );
    setReady(true);
  }
  React.useEffect(() => {
    load();
  }, []);
  if (!ready || !persist || !me) return null;
  return (
    // min-w-0：网格/弹性子项的默认 min-width:auto 会让「台账名 + 一排按钮」把卡片撑到
    // 比列宽还宽（手机端外框 overflow-x-hidden 一裁，右边的字就看不见了）
    <section className="min-w-0 space-y-5">
      <div className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-semibold">{me.role === "admin" ? "全部台账" : "我的台账"}</h2>
        <p className="mt-1 text-sm text-muted">
          {me.role === "admin" ? "管理员能看见并进入任何一套，改数据、改名都可以。" : "一套台账一套数据。"}
          当前登录：{me.name}（{me.username}）
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {books.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
              {renaming === b.id ? (
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <Input className="h-9 max-w-xs" value={renameTo} onChange={(e) => setRenameTo(e.target.value)} />
                  <Button
                    size="sm"
                    type="button"
                    onClick={async () => {
                      try {
                        const name = renameTo.trim();
                        if (!name) return;
                        await authOp("renameBook", { id: b.id, name });
                        setRenaming("");
                        await load();
                        window.dispatchEvent(new CustomEvent("gongdi-book", { detail: name }));
                        window.dispatchEvent(new Event("gongdi-books"));
                        toast.success(`已改成「${name}」`);
                      } catch (err: any) {
                        toast.error(err instanceof Error ? err.message : "改名失败");
                      }
                    }}
                  >
                    保存
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setRenaming("")}>
                    取消
                  </Button>
                </div>
              ) : (
                <>
                  <span>
                    {b.name}
                    {b.id === "default" ? " · 原数据" : ""}
                    {me.role === "admin" && b.ownerId && b.ownerId !== me.id ? (
                      <span className="ml-1 text-xs text-muted">· {users.find((u) => u.id === b.ownerId)?.name || "他人"}</span>
                    ) : null}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={async () => {
                        await flushPendingLedger();
                        await authOp("useBook", { id: b.id });
                        window.dispatchEvent(new CustomEvent("gongdi-book", { detail: b.name }));
                        window.dispatchEvent(new Event("gongdi-books"));
                        // 换台账先丢掉上一本的残留（拉到之前屏幕上是空的，不是上一本的）
                        dropLocalLedger(`切换到台账 ${b.id}`);
                        setCacheOwner(String(me.id || ""), b.id);
                        await pullNasLedger();
                        toast.success(`已进入「${b.name}」`);
                      }}
                    >
                      进入
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setRenaming(b.id);
                        setRenameTo(b.name);
                      }}
                    >
                      改名
                    </Button>
                    {b.id !== "default" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={async () => {
                          // 确认文案要写明影像资料也一起删（级联删除本来就是这么做的，
                          // 原来只说「该套数据会删掉」，用户不知道证件照/合同扫描件也没了）
                          if (
                            !confirm(
                              `删除台账「${b.name}」？\n\n该套数据会删掉，该台账的影像资料（证件照、银行卡、合同扫描件、考勤影像等）也会一起删除。\n\n删除后无法恢复，确定继续？`,
                            )
                          )
                            return;
                          try {
                            await flushPendingLedger();
                            await authOp("deleteBook", { id: b.id });
                            await load();
                            window.dispatchEvent(new Event("gongdi-books"));
                            await pullNasLedger();
                            toast.success("已删除这套台账");
                          } catch (err: any) {
                            toast.error(err instanceof Error ? err.message : "删除失败");
                          }
                        }}
                      >
                        删除
                      </Button>
                    ) : null}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            placeholder="新台账名称，如 二工地"
          />
          <Button
            type="button"
            disabled={creating}
            onClick={async () => {
              if (!bookName.trim() || creating) return;
              setCreating(true);
              try {
                await flushPendingLedger();
                await authOp("createBook", { name: bookName.trim() });
                setBookName("");
                await load();
                // 新建台账后左侧下拉要立刻出现这本（原来 createBook 分支漏发事件，
                // 必须刷新整页才看到 —— A 组报告第 32 项）
                window.dispatchEvent(new Event("gongdi-books"));
                await pullNasLedger();
                toast.success("已新建空台账，可在左侧切换");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "新建台账失败");
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "新建中…" : "新建台账"}
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-semibold">修改我的密码</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>当前密码</Label>
            <Input className="mt-1" type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
          </div>
          <div>
            <Label>新密码</Label>
            <Input className="mt-1" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
        </div>
        <Button
          className="mt-3"
          type="button"
          onClick={async () => {
            // authOp 在服务端拒绝时抛错（如「当前密码不对」）。原来这里没有 catch，
            // 只留下一条 unhandledrejection，界面**什么都不显示**（A 组报告第 12 项）。
            try {
              await authOp("changePassword", { old: oldPwd, password: newPwd });
            } catch (err: any) {
              toast.error(err instanceof Error ? err.message : "改密码失败");
              return;
            }
            setOldPwd("");
            setNewPwd("");
            toast.success("密码已改");
          }}
        >
          保存新密码
        </Button>
      </div>
      {me.role === "admin" ? (
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">账户</h2>
          <p className="mt-1 text-sm text-muted">新建账户默认不给自己的空台账。勾选后加入你当前这套，也可以之后在「成员」里加。</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <Label>显示名</Label>
              <Input className="mt-1" value={uName} onChange={(e) => setUName(e.target.value)} />
            </div>
            <div>
              <Label>登录名</Label>
              <Input className="mt-1" value={uUser} onChange={(e) => setUUser(e.target.value)} />
            </div>
            <div>
              <Label>初始密码</Label>
              <Input className="mt-1" type="password" value={uPwd} onChange={(e) => setUPwd(e.target.value)} />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={joinCur} onChange={(e) => setJoinCur(e.target.checked)} /> 同时加入当前这套台账
          </label>
          {joinCur ? (
            <select className="field-select mt-2 h-10 max-w-xs" value={joinPreset} onChange={(e) => setJoinPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.label}（{p.hint}）
                </option>
              ))}
            </select>
          ) : null}
          <Button
            className="mt-3"
            type="button"
            disabled={creating}
            onClick={async () => {
              try {
                if (!uUser.trim() || uPwd.trim().length < 8) {
                  toast.error("登录名必填，密码至少 8 位");
                  return;
                }
                if (creating) return;
                setCreating(true);
                const r = await authOp("createUser", {
                  name: uName || uUser,
                  username: uUser,
                  password: uPwd,
                  joinCurrent: joinCur ? "1" : "0",
                  preset: joinPreset,
                });
                setUsers(r.users || []);
                setUName("");
                setUUser("");
                setUPwd("");
                toast.success(joinCur ? "账户已建，并加入当前台账" : "账户已建，还没有台账，需要在成员里加");
              } catch (err: any) {
                toast.error(err instanceof Error ? err.message : "新建失败");
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "新建中…" : "新建账户"}
          </Button>
          {users.length ? (
            <ul className="mt-4 space-y-3">
              {users.map((u) => {
                const ed = edits[u.id] || { name: u.name, username: u.username };
                return (
                  <li key={u.id} className="space-y-2 rounded-md border border-line px-3 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted">{u.role === "admin" ? "管理员" : "用户"}</span>
                      {u.disabled ? <span className="text-xs text-muted">已停用</span> : null}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Label>显示名</Label>
                        <Input
                          className="mt-1 h-9"
                          value={ed.name}
                          onChange={(e) =>
                            setEdits((s) => ({
                              ...s,
                              [u.id]: { ...ed, name: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label>登录名</Label>
                        <Input
                          className="mt-1 h-9"
                          value={ed.username}
                          onChange={(e) =>
                            setEdits((s) => ({
                              ...s,
                              [u.id]: { ...ed, username: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={async () => {
                          try {
                            await authOp("updateUser", { id: u.id, name: ed.name, username: ed.username });
                            await load();
                            toast.success("资料已保存");
                          } catch (err: any) {
                            toast.error(err instanceof Error ? err.message : "保存失败");
                          }
                        }}
                      >
                        保存资料
                      </Button>
                      {u.id !== me.id ? (
                        <>
                          <Input
                            className="h-9 max-w-36"
                            type="password"
                            placeholder="新密码"
                            value={resets[u.id] || ""}
                            onChange={(e) => setResets((s) => ({ ...s, [u.id]: e.target.value }))}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={async () => {
                              const password = (resets[u.id] || "").trim();
                              if (password.length < 8) {
                                toast.error("新密码至少 8 位");
                                return;
                              }
                              try {
                                await authOp("resetPassword", { id: u.id, password });
                                setResets((s) => ({ ...s, [u.id]: "" }));
                                toast.success(`已重置 ${ed.name || u.name} 的密码`);
                              } catch (err: any) {
                                toast.error(err instanceof Error ? err.message : "失败");
                              }
                            }}
                          >
                            重置密码
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={async () => {
                              try {
                                await authOp("setDisabled", { id: u.id, disabled: u.disabled ? "0" : "1" });
                                await load();
                                toast.success(u.disabled ? "已启用" : "已停用");
                              } catch (err: any) {
                                toast.error(err instanceof Error ? err.message : "失败");
                              }
                            }}
                          >
                            {u.disabled ? "启用" : "停用"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={async () => {
                              if (!confirm(`删除账户「${u.name}」？他名下自建的台账也会删（默认台账保留）。`)) return;
                              try {
                                await authOp("deleteUser", { id: u.id });
                                await load();
                                toast.success("账户已删除");
                              } catch (err: any) {
                                toast.error(err instanceof Error ? err.message : "删除失败");
                              }
                            }}
                          >
                            删除
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-subtle">自己的密码在上面改</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">还没有列出其他账户。新建后会出现在这里。</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

