import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { authOp, hashPassword, unlockGate } from "~/lib/auth";
import { useApp } from "~/lib/store";
import { APP_NAME } from "./nav";
import { themeClass } from "./theme";

export function LoginScreen({ accessHash, onOk }: { accessHash: string; onOk: () => void }) {
  const uiStyle = useApp((s) => s.uiStyle);
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
      className={cn("app-bg flex min-h-screen min-h-dvh items-center justify-center px-4", themeClass(uiStyle))}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-strong to-violet-500 text-xl text-white shadow-lg">
            🏗️
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold">{APP_NAME}</h1>
            <p className="text-xs text-muted">工地账目 · 一本台账说得清</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-muted">手机、电脑浏览器都可打开。已开密码时先登录。</p>
        <div className="mt-4">
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
        <Button className="btn-lg mt-6 w-full" type="submit" disabled={busy || !pwd}>
          进入台账
        </Button>
      </form>
    </div>
  );
}

export function SetupScreen({ onOk }: { onOk: () => void }) {
  const uiStyle = useApp((s) => s.uiStyle);
  const [username, setUsername] = React.useState("");
  const [name, setName] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [again, setAgain] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) {
      toast.error("密码至少 8 位");
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
    <div className={cn("app-bg flex min-h-screen min-h-dvh items-center justify-center px-4", themeClass(uiStyle))}>
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-strong to-violet-500 text-xl text-white shadow-lg">
            🏗️
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold">创建管理员</h1>
            <p className="text-xs text-muted">第一次使用</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">原来的数据会放进「默认台账」，不会丢。</p>
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
        <Button className="btn-lg mt-6 w-full" type="submit" disabled={busy}>
          创建并进入
        </Button>
      </form>
    </div>
  );
}

/**
 * 账户库损坏时的兜底页（D 项）。
 * 关键：绝不显示「创建管理员」——那会把损坏但可能可恢复的 accounts.json 覆盖成单账号。
 */
export function BrokenAccountsScreen() {
  const uiStyle = useApp((s) => s.uiStyle);
  return (
    <div className={cn("app-bg flex min-h-screen min-h-dvh items-center justify-center px-4", themeClass(uiStyle))}>
      <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 text-xl text-white shadow-lg">
            ⚠️
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold">账户数据读取失败</h1>
            <p className="text-xs text-muted">{APP_NAME} · 已停止自动修复</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          服务器上的 <code className="rounded bg-accent-soft px-1">data/accounts/accounts.json</code> 读不出来（文件损坏或权限问题）。
          为避免覆盖现有账号，系统已停止初始化与写入。
        </p>
        <p className="mt-3 text-sm text-muted">
          请用 <b>data/backups</b> 或备份的 accounts 目录恢复该文件后刷新；<b>不要</b>重新初始化管理员，也不要删除 data。
        </p>
        <Button className="btn-lg mt-6 w-full" type="button" variant="outline" onClick={() => window.location.reload()}>
          刷新重试
        </Button>
      </div>
    </div>
  );
}

export function NoBookScreen({ onOut }: { onOut: () => void }) {
  const uiStyle = useApp((s) => s.uiStyle);
  return (
    <div className={cn("app-bg flex min-h-screen min-h-dvh items-center justify-center px-4", themeClass(uiStyle))}>
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-strong to-violet-500 text-xl text-white shadow-lg">
            🏗️
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold">还没有台账</h1>
            <p className="text-xs text-muted">{APP_NAME} · 工地账目</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">这个账户没有自己的台账。请让管理员在「设置 → 这套台账的成员」里把你加进去。</p>
        <Button
          className="btn-lg mt-6 w-full"
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

export function AcctLogin({ onOk }: { onOk: () => void }) {
  const uiStyle = useApp((s) => s.uiStyle);
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
    <div className={cn("app-bg flex min-h-screen min-h-dvh items-center justify-center px-4", themeClass(uiStyle))}>
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-strong to-violet-500 text-xl text-white shadow-lg">
            🏗️
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold">{APP_NAME}</h1>
            <p className="text-xs text-muted">工地账目 · 一本台账说得清</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">每个账户各自的数据。以前设过总密码的，用户名填 admin，密码还是原来的。</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>用户名</Label>
            <Input className="mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
          </div>
          <div>
            <Label>密码</Label>
            <Input className="mt-1" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" />
          </div>
        </div>
        <Button className="btn-lg mt-6 w-full" type="submit" disabled={busy || !username || !pwd}>
          登录
        </Button>
      </form>
    </div>
  );
}
