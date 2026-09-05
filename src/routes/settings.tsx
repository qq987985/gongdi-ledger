import * as React from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { Can, useCan } from "~/components/can";
import { PayTypePick, OtRulePick } from "~/components/pay-fields";
import { WinUpdate } from "~/components/shell";
import { useApp } from "~/lib/store";
import { derivedYears, monthStatus, nextYear, confirmRemoveYear } from "~/lib/dates";
import { wageLabel, parseOtRule } from "~/lib/wage";
import { hashPassword, unlockGate, lockGate, authStatus, authOp } from "~/lib/auth";
import { nasEnabled, pushNasBackup, pullNasLedger } from "~/lib/nas-sync";
import { clearAllPhotos } from "~/lib/photos";
import { PERM_GROUPS, PRESETS } from "~/lib/perms";

function SettingsPage() {
  const store = useApp();
  const { year, setYear, addYear, removeYear, people, replacePeople, clearAll, attendance } = store;
  const years = derivedYears(store);
  const [custom, setCustom] = React.useState(nextYear(years));
  const [wage, setWage] = React.useState(0);
  const [monthWage, setMonthWage] = React.useState(0);
  const [payType, setPayType] = React.useState("day");
  const [rule, setRule] = React.useState("");
  const [clearPwd, setClearPwd] = React.useState("");
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  React.useEffect(() => {
    authStatus().then((s) => setIsAdmin(s.user?.role === "admin"));
  }, []);
  
  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold">设置</h1>
        <p className="mt-1 text-sm text-muted">年度、访问密码、批量工资。反代到公网请先设密码。</p>
      </header>
      <AccountsCard />
      <UiStyleCard />
      <MembersCard />
      <PasswordCard />
      <Can perm="settings.year">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">已展开的年度</h2>
          <p className="mt-1 text-sm text-muted">
            当前工作年 {year}。新增年份不会改人员。删除年份只去掉该年考勤，人员、照片、发放记录保留。至少留一年。
          </p>
          <ul className="mt-4 space-y-2">
            {years.map((y) => {
              const filled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, y, i + 1).filled > 0).filter(Boolean).length;
              return (
                <li key={y} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
                  <button type="button" className="text-left text-sm" onClick={() => setYear(y)}>
                    <span className="font-medium">{y} 年</span>
                    <span className="ml-2 text-xs text-muted">
                      {filled}/12 月已录{y === year ? " · 当前" : ""}
                    </span>
                  </button>
                  {years.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirmRemoveYear(y, filled)) return;
                        try {
                          if (nasEnabled()) await pushNasBackup();
                        } catch {}
                        removeYear(y);
                        toast.success(`已删除 ${y} 年考勤。人员与发放记录仍在。`);
                      }}
                    >
                      删除
                    </Button>
                  ) : (
                    <span className="text-xs text-subtle">至少留一年</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              type="number"
              className="w-28"
              value={custom}
              onChange={(e) => setCustom(Number(e.target.value))}
              aria-label="要新增的年份"
            />
            <Button
              onClick={() => {
                if (custom < 2000 || custom > 2100) {
                  toast.error("请输入 2000–2100 的年份");
                  return;
                }
                const created = addYear(custom);
                toast.success(`${created} 年已展开`);
                setCustom(created + 1);
              }}
            >
              展开该年
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const created = addYear();
                toast.success(`${created} 年已展开`);
                setCustom(created + 1);
              }}
            >
              新增下一年
            </Button>
          </div>
        </section>
      </Can>
      <Can perm="settings.rules">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">批量工资 / 加班规则</h2>
          <p className="mt-1 text-sm text-muted">勾选人再应用。计薪选按工天或按月。加班选按小时或按折算。</p>
          <BatchRules
            people={people}
            replacePeople={replacePeople}
            wage={wage}
            setWage={setWage}
            monthWage={monthWage}
            setMonthWage={setMonthWage}
            payType={payType}
            setPayType={setPayType}
            rule={rule}
            setRule={setRule}
          />
        </section>
      </Can>
      <Can perm="settings.data">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">数据</h2>
          <p className="mt-1 text-sm text-muted">
            {isAdmin 
              ? "清空全部数据后可用模板导入。示例数据请在「导入」页面下载模板查看。"
              : "示例数据请在「导入」页面下载模板查看。"}
            {nasEnabled()
              ? " 全部个人数据只在 NAS 的 data 目录：accounts、books、photos、backups、templates。软件删了重装，只要 data 还在就能恢复。"
              : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nasEnabled() ? (
              <Button
                type="button"
                onClick={async () => {
                  try {
                    const fname = await pushNasBackup();
                    toast.success(`已备份到 data/backups/${fname}`);
                  } catch {
                    toast.error("备份失败");
                  }
                }}
              >
                立即备份 Excel
              </Button>
            ) : null}
            {isAdmin && (
              !showClearConfirm ? (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                >
                  清空全部数据
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <span className="text-sm text-red-700">此操作不可恢复，请输入访问密码确认：</span>
                  <Input
                    type="password"
                    value={clearPwd}
                    onChange={(e) => setClearPwd(e.target.value)}
                    placeholder="输入访问密码"
                    className="w-40"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={async () => {
                      try {
                        const { user } = await authOp("verify", { password: clearPwd });
                        if (!user) {
                          toast.error("密码错误");
                          return;
                        }
                        if (user.role !== "admin") {
                          toast.error("只有管理员才能清空全部数据");
                          setShowClearConfirm(false);
                          setClearPwd("");
                          return;
                        }
                        if (!confirm("确定清空全部人员、考勤、发放和照片？此操作不可恢复！")) return;
                        clearAll();
                        await clearAllPhotos();
                        toast.success("已清空全部数据");
                        setShowClearConfirm(false);
                        setClearPwd("");
                      } catch (e: any) {
                        toast.error(e.message || "验证失败");
                      }
                    }}
                  >
                    确认清空
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setShowClearConfirm(false);
                      setClearPwd("");
                    }}
                  >
                    取消
                  </Button>
                </div>
              )
            )}
          </div>
        </section>
      </Can>
      {/* 软件更新放最底部 */}
      <WinUpdate compact />
    </div>
  );
}

function UiStyleCard() {
  const uiStyle = useApp((s) => s.uiStyle);
  const setUiStyle = useApp((s) => s.setUiStyle);
  const current = uiStyle === "v2" || uiStyle === "apple" || uiStyle === "movie" ? uiStyle : "classic";
  const [val, setVal] = React.useState<"classic" | "v2" | "apple" | "movie">(current);
  const NAMES: Record<string, string> = { classic: "原版界面", v2: "新版界面", apple: "苹果 Mac 风格", movie: "MOVIEPILOT 暗黑风格" };
  function save() {
    setUiStyle(val);
    toast.success(`已切换到${NAMES[val]}`);
  }
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-semibold">界面风格</h2>
      <p className="mt-1 text-sm text-muted">选好后点「保存」才生效；只影响显示，不动数据。</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          className="field-select h-9 w-64 min-w-0 text-sm"
          value={val}
          onChange={(e) => setVal(e.target.value as "classic" | "v2" | "apple" | "movie")}
          aria-label="界面风格"
        >
          <option value="classic">原版界面（默认）</option>
          <option value="v2">新版界面</option>
          <option value="apple">苹果 Mac 风格</option>
          <option value="movie">MOVIEPILOT 暗黑风格</option>
        </select>
        <Button type="button" onClick={save} disabled={val === current}>
          保存
        </Button>
        {val !== current ? <span className="text-xs text-subtle">有未保存的更改</span> : null}
      </div>
      <p className="mt-3 text-xs text-subtle">原版：左侧完整菜单；新版：图标导航 + 仪表盘；苹果风：毛玻璃 + 系统蓝；MOVIEPILOT：暗黑玻璃 + 霓虹紫蓝渐变发光。</p>
    </section>
  );
}

function PasswordCard() {
  const accessHash = useApp((s) => s.accessHash);
  const setAccessHash = useApp((s) => s.setAccessHash);
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [again, setAgain] = React.useState("");
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-semibold">访问密码</h2>
      <p className="mt-1 text-sm text-muted">
        第一次到「设置」里设密码。设好后打开页面要登录；勾了「本机记住」就不用每次输。以后要换密码：先填当前密码，再填新密码两次，点「修改密码」。
        {accessHash ? " 当前已开启。" : " 当前未设，任何人打开链接都能进。"}
      </p>
      <div className="mt-4 grid gap-3">
        {accessHash ? (
          <div>
            <Label htmlFor="gate-current">当前密码</Label>
            <Input id="gate-current" className="mt-1" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
        ) : null}
        <div>
          <Label htmlFor="gate-next">{accessHash ? "新密码" : "设置密码"}</Label>
          <Input id="gate-next" className="mt-1" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="gate-again">再输一次</Label>
          <Input id="gate-again" className="mt-1" type="password" value={again} onChange={(e) => setAgain(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={async () => {
              if (accessHash) {
                if ((await hashPassword(current)) !== accessHash) {
                  toast.error("当前密码不对");
                  return;
                }
              }
              if (next.trim().length < 4) {
                toast.error("密码至少 4 位");
                return;
              }
              if (next !== again) {
                toast.error("两次输入不一致");
                return;
              }
              const hash = await hashPassword(next);
              setAccessHash(hash);
              unlockGate(hash, true);
              toast.success("访问密码已保存");
              setCurrent("");
              setNext("");
              setAgain("");
            }}
          >
            {accessHash ? "修改密码" : "开启密码"}
          </Button>
          {accessHash ? (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if ((await hashPassword(current)) !== accessHash) {
                  toast.error("关闭前请输入当前密码");
                  return;
                }
                setAccessHash("");
                lockGate();
                toast.success("已关闭访问密码");
                setCurrent("");
              }}
            >
              关闭密码
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface Member {
  userId: string;
  name: string;
  username: string;
  isOwner?: boolean;
  perms: string[];
}

function MembersCard() {
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
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
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

function MemberChecks({
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

function AccountsCard() {
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
    <section className="space-y-5">
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
                        await authOp("useBook", { id: b.id });
                        window.dispatchEvent(new CustomEvent("gongdi-book", { detail: b.name }));
                        window.dispatchEvent(new Event("gongdi-books"));
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
                          if (!confirm(`删除台账「${b.name}」？该套数据会删掉。`)) return;
                          await authOp("deleteBook", { id: b.id });
                          await load();
                          window.dispatchEvent(new Event("gongdi-books"));
                          await pullNasLedger();
                          toast.success("已删除这套台账");
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
            onClick={async () => {
              if (!bookName.trim()) return;
              await authOp("createBook", { name: bookName.trim() });
              setBookName("");
              await load();
              await pullNasLedger();
              toast.success("已新建空台账，可在左侧切换");
            }}
          >
            新建台账
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
            await authOp("changePassword", { old: oldPwd, password: newPwd });
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
            onClick={async () => {
              try {
                if (!uUser.trim() || uPwd.trim().length < 4) {
                  toast.error("登录名必填，密码至少 4 位");
                  return;
                }
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
              }
            }}
          >
            新建账户
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
                              if (password.length < 4) {
                                toast.error("新密码至少 4 位");
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

function BatchRules({
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
  function apply(idsToUse: string[], onlyBlank: boolean) {
    if (!idsToUse.length) {
      toast.error("请先勾选人员");
      return;
    }
    const set = new Set(idsToUse);
    let n = 0;
    replacePeople(
      people.map((p) => {
        if (!set.has(p.id)) return p;
        if (onlyBlank) {
          // 只填空白：只补工资数额，不动计薪方式和加班规则
          if (payType === "month" ? p.monthWage : p.dailyWage) return p;
          n += 1;
          return payType === "month" ? { ...p, monthWage } : { ...p, dailyWage: wage };
        }
        n += 1;
        return payType === "month"
          ? { ...p, payType: "month", monthWage, otRule: rule }
          : { ...p, payType: "day", dailyWage: wage, otRule: rule };
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

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});
