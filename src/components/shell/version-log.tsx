import * as React from "react";
import { formatVersion } from "~/lib/changelog";
import { WinUpdate } from "./win-update";

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
