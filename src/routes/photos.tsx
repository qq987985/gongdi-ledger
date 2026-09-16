import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Need, Can, ReadonlyNotice, useCanSave } from "~/components/can";
import { PhotoSlot, PhotoFlag, ScanPhotosButton, usePhotoFlags } from "~/components/photo-slot";
import { permLabel } from "~/lib/perms";
import { blockedWrite } from "~/lib/readonly";
import { useApp } from "~/lib/store";

function PhotosPage() {
  const people = useApp((s) => s.people);
  // 只读账号：照片页不给「编辑/上传」入口（照片写入同样要落台账）
  const canEditPhoto = useCanSave("photos.edit");
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [picked, setPicked] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const names = React.useMemo(() => people.map((p) => p.name), [people]);
  const flags = usePhotoFlags(names, tick);
  const filtered = people.filter((p) => {
    if (q && !p.name.includes(q) && !p.team.includes(q)) return false;
    const f = flags[p.name] || { id: false, idBack: false, bank: false, ic: false };
    if (filter === "missing") return !(f.id && f.idBack && f.bank && f.ic);
    if (filter === "id") return !f.id;
    if (filter === "idBack") return !f.idBack;
    if (filter === "bank") return !f.bank;
    if (filter === "ic") return !f.ic;
    return true;
  });
  const pickedPerson = people.find((p) => p.name === picked);
  return (
    <Need perm="photos.view">
      <div className="space-y-5">
        <ReadonlyNotice perm="photos.edit" />
        <header>
          <h1 className="font-display text-2xl font-semibold">照片管理</h1>
          <p className="mt-1 text-sm text-muted">
            点「编辑」弹出编辑。点遮罩或 Esc 关闭。人员照片：张三-身份证-正面.jpg、张三-身份证-反面.jpg。
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <Input className="max-w-sm" placeholder="筛选姓名或班组" value={q} onChange={(e) => setQ(e.target.value)} />
          <Can perm="photos.edit">
            <ScanPhotosButton names={names} onDone={() => setTick((n) => n + 1)} />
          </Can>
          {[
            ["all", "全部"],
            ["missing", "缺任意"],
            ["id", "缺正面"],
            ["idBack", "缺反面"],
            ["bank", "缺银行卡"],
            ["ic", "缺IC卡"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`chip ${filter === k ? "on" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="fit-table min-w-ledger text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="p-3">操作</th>
                <th className="p-3">姓名</th>
                <th className="p-3">班组</th>
                <th className="p-3">身份证正面</th>
                <th className="p-3">身份证反面</th>
                <th className="p-3">银行卡</th>
                <th className="p-3">IC卡</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted">
                    {people.length === 0
                      ? "还没有人员。先在「人员」里建档，或到「导入」导入人员名单。"
                      : q
                        ? "没有匹配的人员"
                        : filter === "missing"
                          ? "人员照片都齐了。"
                          : "没有匹配的人员"}
                  </td>
                </tr>
              ) : null}
              {filtered.map((p) => {
                const f = flags[p.name] || { id: false, idBack: false, bank: false, ic: false };
                const on = picked === p.name;
                return (
                  <tr key={p.id} className={`border-b border-line last:border-0 hover:bg-accent-soft ${on ? "bg-accent-soft" : ""}`}>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={!canEditPhoto}
                        title={canEditPhoto ? undefined : `你是只读账号（缺「${permLabel("photos.edit")}」权限），改动不会保存。`}
                        onClick={() => {
                          if (blockedWrite("photos.edit", permLabel("photos.edit"))) return;
                          setPicked(p.name);
                        }}
                      >
                        编辑
                      </Button>
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted">{p.team}</td>
                    <td className="p-3">
                      <PhotoFlag ok={f.id} />
                    </td>
                    <td className="p-3">
                      <PhotoFlag ok={f.idBack} />
                    </td>
                    <td className="p-3">
                      <PhotoFlag ok={f.bank} />
                    </td>
                    <td className="p-3">
                      <PhotoFlag ok={f.ic} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pickedPerson ? (
          <PhotoEditor person={pickedPerson} tick={tick} onClose={() => setPicked(null)} onChanged={() => setTick((n) => n + 1)} />
        ) : null}
      </div>
    </Need>
  );
}

function PhotoEditor({
  person,
  tick,
  onClose,
  onChanged,
}: {
  person: ReturnType<typeof useApp.getState>["people"][number];
  tick: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector("[data-modal]")) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-0 print:hidden md:items-center md:p-6" onClick={onClose}>
      <section
        className="max-h-[calc(100dvh-4rem)] w-full max-w-5xl overflow-y-auto rounded-t-xl border border-accent bg-surface p-6 shadow-panel md:max-h-[calc(100dvh-3rem)] md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold">编辑照片 · {person.name}</h2>
            <Badge>{person.team}</Badge>
          </div>
          <div className="btn-row">
            <Button variant="outline" type="button" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <PhotoSlot key={`id-${tick}`} name={person.name} kind="id" onChanged={onChanged} />
          <PhotoSlot key={`bank-${tick}`} name={person.name} kind="bank" onChanged={onChanged} />
          <PhotoSlot key={`ic-${tick}`} name={person.name} kind="ic" onChanged={onChanged} />
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/photos")({
  component: PhotosPage,
});
