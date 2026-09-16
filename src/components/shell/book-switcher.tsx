import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authOp, authStatus } from "~/lib/auth";
import { setLivePerms } from "~/lib/perms";
import { dropLocalLedger, flushPendingLedger, pullNasLedger, setCacheOwner } from "~/lib/nas-sync";

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
    // 先把当前台账还没保存的改动推上去，再切台账
    await flushPendingLedger();
    await authOp("useBook", { id });
    setBookId(id);
    const n = books.find((b) => b.id === id)?.name || id;
    window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
    const s = await authStatus();
    setLivePerms(s.persist ? s.perms || [] : ["*"]);
    // 换台账先丢掉上一本的残留：拉到新数据前屏幕上是空的，不是上一本的
    dropLocalLedger(`切换到台账 ${id}`);
    setCacheOwner(String(s.user?.id || ""), id);
    await pullNasLedger();
    toast.success(`已切换到「${n}」`);
  }
  if (compact)
    return (
      <select
        className="field-select h-9 max-w-[9rem] text-sm"
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
                window.dispatchEvent(new Event("gongdi-books"));
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
              // 先把当前台账还没保存的改动推上去，再新建（否则这批改动会落到新台账）
              await flushPendingLedger();
              try {
                const r = await authOp("createBook", { name: name.trim() });
                setName("");
                setAdding(false);
                await load();
                // 让其它台账下拉实例也立刻刷新（原来只有整页刷新才出现新台账）
                window.dispatchEvent(new Event("gongdi-books"));
                if (r.bookId) {
                  await pullNasLedger();
                  toast.success("已新建空台账");
                }
              } catch (err) {
                // 普通成员自建台账有数量上限：服务端 400 的文案要**原样**显示（1.8.9）
                toast.error(err instanceof Error ? err.message : "新建台账失败");
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
