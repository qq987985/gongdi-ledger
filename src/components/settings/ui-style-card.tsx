import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useApp } from "~/lib/store";

export function UiStyleCard() {
  const uiStyle = useApp((s) => s.uiStyle);
  const setUiStyle = useApp((s) => s.setUiStyle);
  const current = uiStyle === "v2" || uiStyle === "apple" || uiStyle === "movie" ? uiStyle : "classic";
  const [val, setVal] = React.useState<"classic" | "v2" | "apple" | "movie">(current);
  // stash rehydrate 竞态：存储恢复或已保存时同步下拉（不覆盖未保存的选择）
  React.useEffect(() => setVal(current), [current]);
  const NAMES: Record<string, string> = { classic: "原版界面", v2: "新版界面", apple: "苹果 Mac 风格", movie: "MOVIEPILOT 风格" };
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
          <option value="movie">MOVIEPILOT 风格</option>
        </select>
        <Button type="button" onClick={save} disabled={val === current}>
          保存
        </Button>
        {val !== current ? <span className="text-xs text-subtle">有未保存的更改</span> : null}
      </div>
      <p className="mt-3 text-xs text-subtle">原版：左侧完整菜单；新版：图标导航 + 仪表盘；苹果风：毛玻璃 + 系统蓝；MOVIEPILOT：白色底 + 粉紫蓝彩色渐变卡片。</p>
    </section>
  );
}

