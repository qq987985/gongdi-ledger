import * as React from "react";
import { LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { authOp, authStatus, gateUnlocked, lockGate } from "~/lib/auth";
import { can, NAV_PERM, setLivePerms, subscribePerms } from "~/lib/perms";
import { useApp } from "~/lib/store";
import { APP_NAME, NAV, TABS } from "./shell/nav";
import { Brand, NavLink } from "./shell/brand";
import { BookSwitcher } from "./shell/book-switcher";
import { YearSwitcher } from "./shell/year-switcher";
import { VersionLog } from "./shell/version-log";
import { SyncUnsyncedBanner } from "./shell/sync-banner";
import { AcctLogin, BrokenAccountsScreen, LoginScreen, NoBookScreen, SetupScreen } from "./shell/screens";

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

export function AppShell() {
  useHydrateStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const year = useApp((s) => s.year);
  const uiStyle = useApp((s) => s.uiStyle);
  const accessHash = useApp((s) => s.accessHash);
  // 主题类同步到 <html>：body 底色、滚动条、overscroll 区域跟随所选风格
  React.useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("theme-classic", "theme-apple", "theme-movie");
    if (uiStyle !== "v2")
      el.classList.add(uiStyle === "classic" ? "theme-classic" : uiStyle === "apple" ? "theme-apple" : "theme-movie");
    return () => el.classList.remove("theme-classic", "theme-apple", "theme-movie");
  }, [uiStyle]);
  const [open, setOpen] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(() => !accessHash);
  const [gate, setGate] = React.useState<"boot" | "setup" | "login" | "nobook" | "broken" | "app">("boot");
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
      else if (s.broken) setGate("broken");
      else if (s.needSetup) setGate("setup");
      else if (!s.user) setGate("login");
      else if (!s.books.length) setGate("nobook");
      else {
        setGate("app");
        try {
          const { detectNas, pullNasLedger, checkCacheOwner, setCacheOwner, dropLocalLedger } = await import("~/lib/nas-sync");
          // 换过账号 / 换过台账：本机还留着上一份，必须先丢掉再拉 —— 否则没有 people.view 的
          // 账号会在总览看到上一个账号的在册人数与工资（A 组报告第 30 项）。
          const owner = String(s.user.id || s.user.username || "");
          if (checkCacheOwner(owner, String(s.bookId || "")) === "changed") {
            dropLocalLedger(`账号或台账变了（${owner}::${s.bookId}）`);
          }
          setCacheOwner(owner, String(s.bookId || ""));
          await detectNas();
          // 登录后第一次进当前台账：允许把本机旧数据升级上去（空台账时）
          await pullNasLedger({ seed: true });
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
  if (gate === "broken") return <BrokenAccountsScreen />;
  if (gate === "setup") return <SetupScreen onOk={() => void refreshGate()} />;
  if (gate === "login") return <AcctLogin onOk={() => void refreshGate()} />;
  if (gate === "nobook") return <NoBookScreen onOut={() => void refreshGate()} />;
  if (accessHash && !unlocked && gate === "app" && !acct) return <LoginScreen accessHash={accessHash} onOk={() => setUnlocked(true)} />;
  const visNav = NAV.filter((item) => {
    const p = NAV_PERM[item.to];
    return !p || can(p);
  });
  const visTabs = TABS.filter((item) => {
    const p = NAV_PERM[item.to];
    return !p || can(p);
  });
  const tabHit = visTabs.some((t) => (t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(t.to)));
  const logout = () => {
    if (acct) {
      authOp("logout").finally(() => {
        lockGate();
        // 退出登录就把本机这份台账清掉：下一个在这台机器上登录的账号
        // 不能看到上一个账号的人员/工资数字（A 组报告第 30 项）
        void import("~/lib/nas-sync").then((m) => m.dropLocalLedger("退出登录"));
        setGate("login");
        toast.success("已退出登录");
      });
      return;
    }
    lockGate();
    setUnlocked(false);
    toast.success("已退出登录");
  };
  return (
    <div className={cn("app-bg min-h-screen min-h-dvh overflow-x-hidden text-ink", uiStyle === "classic" && "theme-classic", uiStyle === "apple" && "theme-apple", uiStyle === "movie" && "theme-movie")}>
      <div className={uiStyle === "classic" ? "mx-auto flex max-w-7xl" : "flex"}>
        {uiStyle === "classic" ? (
          /* 经典：原版宽侧栏 */
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
              <button type="button" className="mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-ink" onClick={logout}>
                <LogOut className="size-3.5" /> 退出登录
              </button>
            ) : null}
            <div className="mt-6">
              <VersionLog />
            </div>
          </aside>
        ) : (
          /* 新版/苹果：左侧图标导航（苹果为毛玻璃材质） */
          <aside
            className={cn(
              "no-print sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col items-center gap-1 border-r py-4 md:flex",
              uiStyle === "apple"
                ? "border-white/50 bg-white/55 backdrop-blur-2xl"
                : uiStyle === "movie"
                  ? "border-white/50 bg-white/60 backdrop-blur-2xl"
                  : "border-line bg-surface/90 backdrop-blur",
            )}
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-strong to-violet-500 text-lg text-white shadow-lg">
              🏗️
            </div>
            {visNav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload={false}
                  title={item.label}
                  className={cn(
                    "flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] transition-colors duration-150",
                    active ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-accent-soft/60 hover:text-ink",
                  )}
                >
                  <item.icon className="size-[18px]" />
                  {item.label}
                </Link>
              );
            })}
            <div className="flex-1" />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-violet-500 text-sm font-semibold text-white">
              {(who?.name || "账").slice(0, 1)}
            </div>
            {who ? <div className="w-14 truncate text-center text-[10px] text-muted">{who.name}</div> : null}
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {uiStyle !== "classic" ? (
            /* 新版/苹果顶部栏（台账/年份/退出；检查更新在设置页底部） */
            <header
              className={cn(
                "no-print sticky top-0 z-30 hidden items-center gap-3 border-b px-6 py-3 backdrop-blur md:flex",
                uiStyle === "apple"
                  ? "border-white/50 bg-white/50 backdrop-blur-2xl"
                  : uiStyle === "movie"
                    ? "border-white/50 bg-white/60 backdrop-blur-2xl"
                    : "border-line bg-surface/80",
              )}
            >
              <Brand year={year} pathname={pathname} />
              <div className="min-w-0 flex-1" />
              <BookSwitcher compact />
              <YearSwitcher compact />
              {accessHash || acct ? (
                <button
                  type="button"
                  title="退出登录"
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 text-xs text-muted transition-colors hover:border-danger hover:text-danger"
                  onClick={logout}
                >
                  <LogOut className="size-3.5" /> 退出
                </button>
              ) : null}
            </header>
          ) : null}
          <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-2 overflow-x-auto border-b border-line bg-bg/95 px-3 py-2 backdrop-blur md:hidden" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
            <Brand year={year} compact pathname={pathname} />
            <div className="flex min-w-0 items-center gap-1 [&_select]:shrink-0">
              {who ? (
                <div className="mr-1 hidden min-w-0 text-right min-[400px]:block">
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
                <button type="button" className="flex h-11 w-full items-center gap-2 rounded-sm px-3 text-sm text-muted" onClick={logout}>
                  <LogOut className="size-4" /> 退出登录
                </button>
              ) : null}
            </nav>
          ) : null}
          {/* 「有改动没存到服务器」时持续显示（B2）：全应用只挂这一处，失败一次就出现，
              保存成功 / 换账号换台账自动收掉；打印态不印（组件内 no-print） */}
          <SyncUnsyncedBanner />
          {/* 手机端底部有一条 fixed 导航（min-h-12 + 安全区）：主内容必须留出等高下内边距，
              否则最后一行内容会永久压在导航下面点不到（1.8.4 移动端复测实测） */}
          <main className="mx-auto w-full max-w-7xl px-3 pt-4 pb-20 md:px-8 md:pt-6 md:pb-6">
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
          aria-label="菜单"
          aria-expanded={open}
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
