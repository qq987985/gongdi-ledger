import * as React from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCanSave } from "./can";
import { useGuardedClose } from "~/lib/confirm-close";
import { ledgerIdentitySnapshot, subscribeLedgerContext } from "~/lib/nas-sync";
import { blockedWrite } from "~/lib/readonly";
import { TEAM_NAME_LIMIT } from "~/lib/teams";
import { useApp } from "~/lib/store";

export function TeamEditor({ identity, onClose }: { identity: string; onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const currentIdentity = React.useSyncExternalStore(subscribeLedgerContext, ledgerIdentitySnapshot, () => null);
  const canSave = useCanSave("people.edit") && currentIdentity === identity;
  const { markDirty, resetDirty, requestClose } = useGuardedClose(onClose);
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (blockedWrite("people.edit", "人员 新增/修改")) return;
    if (ledgerIdentitySnapshot() !== identity) { toast.error("台账正在切换或加载，请稍后重试"); return; }
    const result = useApp.getState().addTeam(name);
    if (!result.ok) { setError(result.error || "班组未保存"); return; }
    resetDirty();
    toast.success("已创建班组");
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 md:items-center md:p-6" onClick={requestClose}>
      <form role="dialog" aria-modal="true" aria-labelledby="team-editor-title" onSubmit={save}
        className="max-h-[calc(100dvh-3rem)] w-full max-w-md overflow-y-auto rounded-t-xl bg-surface p-5 shadow-panel md:rounded-xl"
        onClick={(event) => event.stopPropagation()}>
        <h2 id="team-editor-title" className="font-display text-lg font-semibold">创建班组</h2>
        <p className="mt-1 text-sm text-muted">创建后即可在新增或编辑人员时选择，暂时没有人员也会保留。</p>
        <label htmlFor="team-name" className="mt-4 block text-sm">班组名称 <span className="text-danger">*</span></label>
        <Input id="team-name" className="mt-1" autoFocus maxLength={TEAM_NAME_LIMIT} value={name} aria-required aria-invalid={Boolean(error)}
          onChange={(event) => { setName(event.target.value); setError(""); markDirty(); }} />
        {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={requestClose}>取消</Button>
          <Button type="submit" disabled={!canSave}>创建班组</Button>
        </div>
      </form>
    </div>
  );
}
