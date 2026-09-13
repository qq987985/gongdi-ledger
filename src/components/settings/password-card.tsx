import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { useApp } from "~/lib/store";
import { hashPassword, unlockGate, lockGate } from "~/lib/auth";

export function PasswordCard() {
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
              if (next.trim().length < 8) {
                toast.error("密码至少 8 位");
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

