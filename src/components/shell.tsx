import * as React from "react";
import {
  Banknote,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { authOp, authStatus, hashPassword, lockGate, unlockGate, gateUnlocked } from "~/lib/auth";
import { confirmRemoveYear, monthStatus, nextYear } from "~/lib/dates";
import { pullNasLedger, nasEnabled } from "~/lib/nas-sync";
import { can, NAV_PERM, setLivePerms, subscribePerms } from "~/lib/perms";
import { useApp } from "~/lib/store";
import { formatVersion } from "~/lib/changelog";

const APP_NAME = "台账";

const NAV = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/people", label: "人员", icon: Users },
  { to: "/attendance", label: "月度考勤", icon: CalendarDays },
  { to: "/payments", label: "发放记录", icon: Banknote },
  { to: "/contracts", label: "合同管理", icon: FileText },
  { to: "/expenses", label: "报销单", icon: FileText },
  { to: "/photos", label: "照片", icon: Camera },
  { to: "/files", label: "影像资料", icon: FolderOpen },
  { to: "/query", label: "个人查询", icon: ClipboardList },
  { to: "/audit", label: "操作记录", icon: History },
  { to: "/import", label: "导入导出", icon: Upload },
  { to: "/settings", label: "设置", icon: Settings },
];

const TABS = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/attendance", label: "考勤", icon: CalendarDays },
  { to: "/contracts", label: "合同", icon: FileText },
  { to: "/expenses", label: "报销", icon: FileText },
  { to: "/query", label: "查询", icon: ClipboardList },
];

function useHydrateStore() {
  React.useEffect(() => {
    (async () => {
      try {
        await (useApp as any).persist.rehydrate();
      } catch {}
      try {
        const { startNasSync } = await import("~/lib/nas-sync");
        await startNasSync();
      } catch {}
      const add = Number(new URLSearchParams(window.location.search).get("addYear") || 0);
      if (add >= 2e3 && add <= 2100) {
        useApp.getState().addYear(add);
        window.history.replaceState(null, "", window.location.pathname);
      }
    })();
  }, []);
}

export function YearSwitcher({ compact }: { compact?: boolean }) {
  const year = useApp((s) => s.year);
  const years = useApp((s) => s.years);
  const setYear = useApp((s) => s.setYear);
  const addYear = useApp((s) => s.addYear);
  const removeYear = useApp((s) => s.removeYear);
  const attendance = useApp((s) => s.attendance);
  const list = years?.length ? years : [year || 2026];
  const idx = Math.max(0, list.indexOf(year));
  const prev = list[idx - 1];
  const nxt = list[idx + 1];
  const upcoming = nextYear(list);
  function addNext() {
    const created = addYear(upcoming);
    toast.success(`${created} 年已展开`);
  }
  async function dropYear(y: number) {
    if (list.length <= 1) {
      toast.error("至少保留一年，不能删光");
      return;
    }
    const filled = Array.from({ length: 12 }, (_, i) => monthStatus(attendance, y, i + 1).filled > 0).filter(Boolean).length;
    if (!confirmRemoveYear(y, filled)) return;
    try {
      if (nasEnabled()) await pullNasLedger();
    } catch {}
    removeYear(y);
    toast.success(`已删除 ${y} 年考勤。人员、照片、发放记录都还在。`);
  }
  if (compact)
    return (
      <select
        className="field-select h-9 max-w-[8.5rem] shrink-0 text-sm"
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        aria-label="选择年度"
      >
        {list.map((y) => (
          <option value={y} key={y}>
            {y}年
          </option>
        ))}
      </select>
    );
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" disabled={!prev} type="button" onClick={() => prev && setYear(prev)}>
          <ChevronLeft className="size-4" />
        </Button>
        <select
          className="field-select h-9 min-w-0 flex-1"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label="选择年度"
        >
          {list.map((y) => (
            <option value={y} key={y}>
              {y} 年
            </option>
          ))}
        </select>
        <Button variant="ghost" size="icon" className="size-8" disabled={!nxt} type="button" onClick={() => nxt && setYear(nxt)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-accent hover:text-ink"
        onClick={addNext}
      >
        <Plus className="size-3.5" /> 新增 {upcoming} 年
      </button>
      {list.length > 1 ? (
        <button
          type="button"
          className="flex h-9 w-full items-center justify-center gap-1 rounded-sm border border-dashed border-line px-2 text-xs text-muted hover:border-danger hover:text-danger"
          onClick={() => dropYear(year)}
        >
          <Trash2 className="size-3.5" /> 删除 {year} 年
        </button>
      ) : null}
    </div>
  );
}

export function BookSwitcher({ compact }: { compact?: boolean }) {
  const [books, setBooks] = React.useState<{ id: string; name: string }[]>([]);
  const [bookId, setBookId] = React.useState("");
  const [user, setUser] = React.useState<{ role?: string } | null>(null);
  const [name, setName] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [renameTo, setRenameTo] = React.useState("");
  async function load() {
    const s = await authStatus();
    if (!s.persist || !s.user) {
      setBooks([]);
      setUser(null);
      return;
    }
    setBooks(s.books);
    setBookId(s.bookId);
    setUser(s.user);
    const n = s.books.find((b: any) => b.id === s.bookId)?.name || "";
    window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
    setLivePerms(s.persist ? s.perms || [] : ["*"]);
  }
  React.useEffect(() => {
    load();
    const on = () => void load();
    window.addEventListener("gongdi-books", on);
    return () => window.removeEventListener("gongdi-books", on);
  }, []);
  if (!user || !books.length) return null;
  async function switchTo(id: string) {
    if (id === bookId) return;
    await authOp("useBook", { id });
    setBookId(id);
    const n = books.find((b) => b.id === id)?.name || id;
    window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
    const s = await authStatus();
    setLivePerms(s.persist ? s.perms || [] : ["*"]);
    await pullNasLedger();
    toast.success(`已切换到「${n}」`);
  }
  if (compact)
    return (
      <select
        className="field-select h-9 max-w-[9rem] text-sm"
        value={bookId}
        onChange={(e) => void switchTo(e.target.value)}
      >
        {books.map((b) => (
          <option value={b.id} key={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    );
  return (
    <div className="mt-3 space-y-2">
      <select
        className="field-select h-9 w-full text-sm"
        value={bookId}
        onChange={(e) => void switchTo(e.target.value)}
        aria-label="当前台账"
      >
        {books.map((b) => (
          <option value={b.id} key={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {user.role === "admin" ? <div className="text-[11px] text-muted">管理员可进入全部台账</div> : null}
      {renaming ? (
        <div className="flex gap-1">
          <Input className="h-9" value={renameTo} onChange={(e) => setRenameTo(e.target.value)} placeholder="台账名称" />
          <Button
            size="sm"
            type="button"
            onClick={async () => {
              const n = renameTo.trim();
              if (!n) return;
              try {
                await authOp("renameBook", { id: bookId, name: n });
                setRenaming(false);
                await load();
                window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
                toast.success(`已改成「${n}」`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "改名失败");
              }
            }}
          >
            保存
          </Button>
        </div>
      ) : adding ? (
        <div className="flex gap-1">
          <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="新台账名称" />
          <Button
            size="sm"
            type="button"
            onClick={async () => {
              if (!name.trim()) return;
              const r = await authOp("createBook", { name: name.trim() });
              setName("");
              setAdding(false);
              await load();
              if (r.bookId) {
                await pullNasLedger();
                toast.success("已新建空台账");
              }
            }}
          >
            建
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => setAdding(true)}>
            ＋ 新建一套台账
          </button>
          <button
            type="button"
            className="text-xs text-muted hover:text-ink"
            onClick={() => {
              setRenameTo(books.find((b) => b.id === bookId)?.name || "");
              setRenaming(true);
            }}
          >
            改名
          </button>
        </div>
      )}
    </div>
  );
}

function WhoCard({ who }: { who: { name: string; username: string; role: string } }) {
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface px-3 py-2">
      <div className="text-[10px] tracking-wide text-muted">当前账户</div>
      <div className="truncate font-medium">{who.name || who.username}</div>
      <div className="truncate text-[11px] text-muted">
        {who.username} {who.role === "admin" ? "· 管理员" : "· 用户"}
      </div>
    </div>
  );
}

export function WinUpdate({ compact }: { compact?: boolean }) {
  const [info, setInfo] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  async function load(fresh: boolean) {
    try {
      const d = await (
        await fetch(fresh ? "/api/update?fresh=1" : "/api/update", {
          cache: "no-store",
          signal: AbortSignal.timeout(2e4),
        })
      ).json();
      setInfo(d);
      return d;
    } catch {
      setInfo({ error: "检查失败" });
      return null;
    }
  }
  React.useEffect(() => {
    load(true);
  }, []);
  async function waitRestart() {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3e3));
      try {
        if ((await fetch("/api/version", { cache: "no-store" })).ok) {
          location.reload();
          return;
        }
      } catch {}
    }
    location.reload();
  }
  async function apply() {
    const docker = info?.mode === "docker";
    if (!confirm(docker ? "将拉取新镜像并重启容器。data 台账不会动。大约一两分钟。" : "将下载新版本并重启。data 台账不会动。")) return;
    setBusy(true);
    try {
      const r = await fetch("/api/update", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) });
      const d = await r.json();
      if (!r.ok || d.error) {
        toast.error(d.error || "更新失败");
        setBusy(false);
        return;
      }
      toast.success("正在更新并重启…");
      void waitRestart();
    } catch {
      toast.error("更新失败");
      setBusy(false);
    }
  }
  const desc =
    info?.mode === "windows"
      ? "从 GitHub 下载 Windows 包并替换程序。data 不覆盖。"
      : info?.mode === "docker"
        ? "GitHub 有新版时点更新，会拉镜像并重启。data 台账不会动。"
        : "GitHub 有新版会在这里提醒。飞牛第一次请先运行一次「一键拉取」，以后就能点更新。";
  const status = !info
    ? "检查中…"
    : info.error && !info.remote
      ? info.error
      : info.canApply
        ? ""
        : info.hint || info.error || (info.newer ? "有新版本，请先在飞牛运行一次一键拉取" : "已是最新");
  return (
    <div className={compact ? "mt-3" : "rounded-xl border border-line bg-surface p-5"}>
      {compact ? null : (
        <>
          <h2 className="font-semibold">软件更新</h2>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </>
      )}
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-3"}`}>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void load(true)}>
          检查更新
        </Button>
        {info?.canApply ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void apply()}>
            {busy ? "更新中…" : `更新到 ${formatVersion(info.remote)}`}
          </Button>
        ) : (
          <span className="text-xs text-muted">{status}</span>
        )}
      </div>
      {info?.hint && info.canApply ? <p className="mt-2 text-xs text-subtle">{info.hint}</p> : null}
      {info?.remote ? (
        <p className="mt-2 text-xs text-subtle">
          GitHub {formatVersion(info.remote)} · 本机 {formatVersion(info.local || "")}
        </p>
      ) : null}
    </div>
  );
}

const FALLBACK = {
  current: "1.0.2",
  entries: [{ version: "1.0.2", items: ["点此查看更新记录"] }],
};

export function VersionLog() {
  const [log, setLog] = React.useState<{ current: string; date?: string; entries: { version: string; date?: string; items: string[] }[] }>(FALLBACK as any);
  const [open, setOpen] = React.useState(false);
  const [hasNew, setHasNew] = React.useState(false);
  React.useEffect(() => {
    fetch("/api/version")
      .then((r) => r.json())
      .then((d) => {
        if (d?.current) setLog(d);
      })
      .catch(() => void 0);
    fetch("/api/update", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.newer) setHasNew(true);
      })
      .catch(() => void 0);
  }, []);
  return (
    <>
      <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => setOpen(true)}>
        版本号：
        <span className="tabular-nums">
          {formatVersion(log.current)} {log.date ? ` ${log.date}` : ""}
        </span>
        {hasNew ? <span className="ml-2 text-xs font-normal text-ok">有新版本</span> : null}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-auto rounded-xl border border-line bg-surface p-5 shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">更新记录</h2>
              <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => setOpen(false)}>
                关闭
              </button>
            </div>
            <WinUpdate compact />
            <ol className="mt-4 space-y-4">
              {log.entries.slice(0, 10).map((e, i) => (
                <li key={`${e.version}-${i}`}>
                  <div className="text-sm font-semibold">
                    {formatVersion(e.version)} {e.date ? ` ${e.date}` : ""}
                    {e.version === log.current ? <span className="ml-2 text-xs font-normal text-ok">当前</span> : null}
                  </div>
                  {e.items.length ? (
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                      {e.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-subtle">（无说明）</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Brand({ year, compact, pathname }: { year: number; compact?: boolean; pathname: string }) {
  const section = (NAV.find((n) => n.to === pathname) || NAV.find((n) => n.to !== "/" && pathname.startsWith(n.to)))?.label || "总览";
  const [book, setBook] = React.useState("");
  React.useEffect(() => {
    function apply(name: string) {
      setBook(name);
    }
    authStatus().then((s) => {
      apply(s.books.find((b: any) => b.id === s.bookId)?.name || "");
    });
    const on = (e: any) => apply(e.detail || "");
    window.addEventListener("gongdi-book", on);
    return () => window.removeEventListener("gongdi-book", on);
  }, []);
  return (
    <div className="min-w-0">
      <div className={cn("font-display truncate font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>
        {book || APP_NAME}
      </div>
      {!compact ? (
        <div className="mt-0.5 truncate text-xs text-muted">
          {year} · {section}
        </div>
      ) : null}
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      preload={false}
      className={cn(
        "flex h-9 items-center gap-1 rounded-sm px-2.5 text-xs transition-colors duration-150 md:h-8",
        active ? "bg-accent text-accent-fg" : "text-muted hover:bg-accent-soft hover:text-ink",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function LoginScreen({ accessHash, onOk }: { accessHash: string; onOk: () => void }) {
  const [pwd, setPwd] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if ((await hashPassword(pwd)) !== accessHash) {
        toast.error("密码不对");
        return;
      }
      unlockGate(accessHash, remember);
      onOk();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel">
        <h1 className="font-display text-xl font-semibold">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted">手机、电脑浏览器都可打开。已开密码时先登录。</p>
        <div className="mt-5">
          <Label htmlFor="gate-login">访问密码</Label>
          <Input
            id="gate-login"
            className="mt-1"
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="done"
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="size-4" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> 本机记住，下次不用再输
        </label>
        <Button className="btn-lg mt-5 w-full" type="submit" disabled={busy || !pwd}>
          进入
        </Button>
      </form>
    </div>
  );
}

function SetupScreen({ onOk }: { onOk: () => void }) {
  const [username, setUsername] = React.useState("admin");
  const [name, setName] = React.useState("管理员");
  const [pwd, setPwd] = React.useState("");
  const [again, setAgain] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 4) {
      toast.error("密码至少 4 位");
      return;
    }
    if (pwd !== again) {
      toast.error("两次密码不一致");
      return;
    }
    setBusy(true);
    try {
      await authOp("setup", { username, password: pwd, name });
      toast.success("管理员已创建");
      onOk();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel">
        <h1 className="font-display text-xl font-semibold">创建管理员</h1>
        <p className="mt-1 text-sm text-muted">第一次使用。原来的数据会放进「默认台账」，不会丢。</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>显示名</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>登录名</Label>
            <Input className="mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <Label>密码</Label>
            <Input className="mt-1" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <Label>再输一次</Label>
            <Input className="mt-1" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        <Button className="btn-lg mt-5 w-full" type="submit" disabled={busy}>
          创建并进入
        </Button>
      </form>
    </div>
  );
}

function NoBookScreen({ onOut }: { onOut: () => void }) {
  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel">
        <h1 className="font-display text-xl font-semibold">还没有台账</h1>
        <p className="mt-2 text-sm text-muted">这个账户没有自己的台账。请让管理员在「设置 → 这套台账的成员」里把你加进去。</p>
        <Button
          className="btn-lg mt-5 w-full"
          type="button"
          variant="outline"
          onClick={() => {
            authOp("logout").finally(() => onOut());
          }}
        >
          退出登录
        </Button>
      </div>
    </div>
  );
}

function AcctLogin({ onOk }: { onOk: () => void }) {
  const [username, setUsername] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await authOp("login", { username, password: pwd });
      onOk();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-bg px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-panel">
        <h1 className="font-display text-xl font-semibold">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-muted">每个账户各自的数据。以前设过总密码的，用户名填 admin，密码还是原来的。</p>
        <div className="mt-5">
          <Label>用户名</Label>
          <Input className="mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        </div>
        <div className="mt-3">
          <Label>密码</Label>
          <Input className="mt-1" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" />
        </div>
        <Button className="btn-lg mt-5 w-full" type="submit" disabled={busy || !username || !pwd}>
          登录
        </Button>
      </form>
    </div>
  );
}

function PreviewHostBridge() {
  return null;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function AppShell() {
  useHydrateStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const year = useApp((s) => s.year);
  const accessHash = useApp((s) => s.accessHash);
  const [open, setOpen] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(() => !accessHash);
  const [gate, setGate] = React.useState<"boot" | "setup" | "login" | "nobook" | "app">("boot");
  const [acct, setAcct] = React.useState("");
  const [who, setWho] = React.useState<{ name: string; username: string; role: string } | null>(null);
  const [, setPermTick] = React.useState(0);
  React.useEffect(() => subscribePerms(() => setPermTick((n) => n + 1)), []);
  async function refreshGate() {
    try {
      const s = (await authStatus()) as any;
      setAcct(String(s.user?.name || s.user?.username || ""));
      setWho(s.user ? { name: String(s.user.name), username: String(s.user.username), role: String(s.user.role) } : null);
      setLivePerms(s.persist ? s.perms || [] : ["*"]);
      if (!s.persist) setGate("app");
      else if (s.needSetup) setGate("setup");
      else if (!s.user) setGate("login");
      else if (!s.books.length) setGate("nobook");
      else {
        setGate("app");
        try {
          const { detectNas, pullNasLedger } = await import("~/lib/nas-sync");
          await detectNas();
          await pullNasLedger();
        } catch {}
      }
    } catch {
      setGate("app");
    }
  }
  React.useEffect(() => {
    refreshGate();
  }, []);
  React.useEffect(() => {
    setUnlocked(!accessHash || gateUnlocked(accessHash));
  }, [accessHash]);
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);
  if (gate === "boot") return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">加载中…</div>;
  if (gate === "setup") return <SetupScreen onOk={() => void refreshGate()} />;
  if (gate === "login") return <AcctLogin onOk={() => void refreshGate()} />;
  if (gate === "nobook") return <NoBookScreen onOut={() => void refreshGate()} />;
  if (accessHash && !unlocked && gate === "app" && !acct) return <LoginScreen accessHash={accessHash} onOk={() => setUnlocked(true)} />;
  const visNav = NAV.filter((item) => {
    if (item.to === "/import") return can("import.use") || can("export.use");
    const p = NAV_PERM[item.to];
    return !p || can(p);
  });
  const visTabs = TABS.filter((item) => {
    const p = NAV_PERM[item.to];
    return !p || can(p);
  });
  const tabHit = visTabs.some((t) => (t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(t.to)));
  return (
    <div className="min-h-screen min-h-dvh overflow-x-hidden bg-bg text-ink">
      <div className="mx-auto flex max-w-7xl">
        <aside className="no-print hidden w-56 shrink-0 flex-col border-r border-line bg-bg-elevated px-4 py-6 md:flex">
          <Brand year={year} pathname={pathname} />
          <BookSwitcher />
          <YearSwitcher />
          <nav className="mt-6 flex flex-col gap-1">
            {visNav.map((item) => (
              <NavLink key={item.to} {...item} active={pathname === item.to} />
            ))}
          </nav>
          {who ? <WhoCard who={who} /> : null}
          {accessHash || acct ? (
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-ink"
              onClick={() => {
                if (acct) {
                  authOp("logout").finally(() => {
                    lockGate();
                    setGate("login");
                    toast.success("已退出登录");
                  });
                  return;
                }
                lockGate();
                setUnlocked(false);
                toast.success("已退出登录");
              }}
            >
              <LogOut className="size-3.5" /> 退出登录
            </button>
          ) : null}
          <div className="mt-6">
            <VersionLog />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-bg/95 px-3 py-2 backdrop-blur md:hidden" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
            <Brand year={year} compact pathname={pathname} />
            <div className="flex min-w-0 items-center gap-1">
              {who ? (
                <div className="mr-1 min-w-0 text-right">
                  <div className="truncate text-xs font-medium">{who.name}</div>
                  <div className="truncate text-[10px] text-muted">{who.role === "admin" ? "管理员" : who.username}</div>
                </div>
              ) : null}
              <BookSwitcher compact />
              <YearSwitcher compact />
            </div>
          </header>
          {open ? (
            <nav className="no-print space-y-1 border-b border-line bg-surface p-3 md:hidden">
              {visNav.map((item) => (
                <NavLink key={item.to} {...item} active={pathname === item.to} onClick={() => setOpen(false)} />
              ))}
              {who ? <WhoCard who={who} /> : null}
              {accessHash || acct ? (
                <button
                  type="button"
                  className="flex h-11 w-full items-center gap-2 rounded-sm px-3 text-sm text-muted"
                  onClick={() => {
                    if (acct) {
                      authOp("logout").finally(() => {
                        lockGate();
                        setGate("login");
                        toast.success("已退出登录");
                      });
                      return;
                    }
                    lockGate();
                    setUnlocked(false);
                    toast.success("已退出登录");
                  }}
                >
                  <LogOut className="size-4" /> 退出登录
                </button>
              ) : null}
            </nav>
          ) : null}
          <main className="px-3 py-4 md:px-8 md:py-8">
            <Outlet />
            <div className="no-print mt-10 md:hidden">
              <VersionLog />
            </div>
          </main>
        </div>
      </div>
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 backdrop-blur md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          gridTemplateColumns: `repeat(${visTabs.length + 1}, minmax(0, 1fr))`,
        }}
      >
        {visTabs.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              preload={false}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]",
                active ? "text-accent" : "text-muted",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px]", open || !tabHit ? "text-accent" : "text-muted")}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />} 菜单
        </button>
      </nav>
    </div>
  );
}

// Need Outlet in scope for createRootRoute but imported at route file.
