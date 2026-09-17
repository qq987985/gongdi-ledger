import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authOp, authStatus } from "~/lib/auth";
import { setLivePerms } from "~/lib/perms";
import { createBookAndEnter, switchBook } from "~/lib/nas-sync";
import { confirmLeaveUnsaved } from "~/lib/unsaved";

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
    // 换台账会把内存里这本整本换掉：月表里没保存的改动要先问一句（F1 / A12，文案唯一在 lib/unsaved.ts）
    if (!confirmLeaveUnsaved("切换到别的台账前，先把本月考勤保存一下")) return;
    const n = books.find((b) => b.id === id)?.name || id;
    // G1/G3：切册的整套顺序（flush → 作废在途拉取 → 清本机 → 拉新册）唯一实现在 `nas-sync.switchBook`，
    // 这里只负责界面（提示 + 广播台账名）；本机改动推不上去时 switchBook 会拦下并问用户。
    const r = await switchBook(id, { action: `切换到「${n}」` });
    if (r.status === "cancelled") return;
    if (r.status === "failed") {
      toast.error(r.reason);
      return;
    }
    setBookId(id);
    window.dispatchEvent(new CustomEvent("gongdi-book", { detail: n }));
    await load();
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
              // 新建后本机这本会被空台账替换：同样先问一句（F1 / A12）
              if (!confirmLeaveUnsaved("新建台账后，先把本月考勤保存一下")) return;
              // G1/G3：新建的整套顺序（flush → createBook → 作废在途拉取 → 清本机 → 拉空册）
              // 唯一实现在 `nas-sync.createBookAndEnter`。服务端 400（自建数量上限）的文案原样显示。
              const r = await createBookAndEnter(name.trim(), { action: "新建台账" });
              if (r.status === "cancelled") return;
              if (r.status === "failed") {
                toast.error(r.reason);
                return;
              }
              setName("");
              setAdding(false);
              await load();
              // 让其它台账下拉实例也立刻刷新（原来只有整页刷新才出现新台账）
              window.dispatchEvent(new Event("gongdi-books"));
              toast.success("已新建空台账");
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
