import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { confirmRemoveYear, monthStatus, nextYear } from "~/lib/dates";
import { nasEnabled } from "~/lib/nas-flag";
import { pullNasLedger } from "~/lib/nas-sync";
import { permLabel } from "~/lib/perms";
import { blockedWrite } from "~/lib/readonly";
import { useApp } from "~/lib/store";
import { Can } from "~/components/can";

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
    // 只读账号不该出现「新增年度」：服务端 /api/year 要 settings.year，
    // 本机改了也只留在本机（A 组报告 30b）
    if (blockedWrite("settings.year", permLabel("settings.year"))) return;
    const created = addYear(upcoming);
    toast.success(`${created} 年已展开`);
  }
  async function dropYear(y: number) {
    if (blockedWrite("settings.year", permLabel("settings.year"))) return;
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
      <Can perm="settings.year">
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
      </Can>
    </div>
  );
}
