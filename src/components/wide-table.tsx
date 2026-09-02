import * as React from "react";
import { cn } from "~/lib/utils";

const PREFIX = "ledger-colw:";
const MIN_W = 48;
const PAGE_SIZES = [10, 20, 30, 40, 50];
const PAGE_KEY = "ledger-pagesize:";

function readPageSize(id: string): number {
  try {
    const n = Number(localStorage.getItem(PAGE_KEY + id));
    return PAGE_SIZES.includes(n) ? n : 20;
  } catch {
    return 20;
  }
}

export interface Pager<T> {
  size: number;
  setSize: (n: number) => void;
  page: number;
  setPage: (n: number) => void;
  pages: number;
  rows: T[];
  total: number;
}

export function usePager<T>(id: string, list: T[], resetKey?: unknown): Pager<T> {
  const [size, setSize] = React.useState(() => readPageSize(id));
  const [page, setPage] = React.useState(1);
  const key = resetKey == null ? String(list.length) : String(resetKey);
  React.useEffect(() => {
    setPage(1);
  }, [key, size]);
  function changeSize(n: number) {
    setSize(n);
    try {
      localStorage.setItem(PAGE_KEY + id, String(n));
    } catch {}
  }
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / size) || 1);
  const p = Math.min(Math.max(1, page), pages);
  return { size, setSize: changeSize, page: p, setPage, pages, rows: list.slice((p - 1) * size, p * size), total };
}

export function PageBar({
  size,
  onSize,
  page,
  onPage,
  pages,
  total,
}: {
  size: number;
  onSize: (n: number) => void;
  page: number;
  onPage: (n: number) => void;
  pages: number;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2">
      <label className="flex items-center gap-1.5 text-sm">
        <span className="text-xs text-muted">每页</span>
        <select
          className="field-select w-auto min-w-[7rem]"
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
          aria-label="每页条数"
        >
          {PAGE_SIZES.map((n) => (
            <option value={n} key={n}>{`${n} 条/页`}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs tabular-nums text-muted">共 {total} 条</span>
        <button type="button" className="btn" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))}>
          上一页
        </button>
        <span className="text-xs tabular-nums text-muted">
          {page} / {Math.max(1, pages)}
        </span>
        <button type="button" className="btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          下一页
        </button>
      </div>
    </div>
  );
}

function readWidths(id: string): number[] {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map((n) => Number(n) || 0) : [];
  } catch {
    return [];
  }
}

function writeWidths(id: string, host: HTMLElement) {
  const ths = [...host.querySelectorAll("thead th")] as HTMLElement[];
  if (!ths.length) return;
  localStorage.setItem(
    PREFIX + id,
    JSON.stringify(ths.map((th) => Math.round(th.getBoundingClientRect().width))),
  );
}

function applyWidths(host: HTMLElement, widths: number[]) {
  const ths = [...host.querySelectorAll("thead th")] as HTMLElement[];
  if (!widths.length || widths.length !== ths.length) return;
  ths.forEach((th, i) => {
    if (th.dataset.colLock) return;
    const w = widths[i];
    if (w >= MIN_W) {
      th.style.width = `${w}px`;
      th.style.minWidth = `${w}px`;
      th.style.maxWidth = `${w}px`;
    }
  });
}

function setThWidth(th: HTMLElement, w: number) {
  if (th.dataset.colLock) return;
  const n = Math.max(MIN_W, w);
  th.style.width = `${n}px`;
  th.style.minWidth = `${n}px`;
  th.style.maxWidth = `${n}px`;
}

function onResizer(e: MouseEvent, host: HTMLElement): HTMLElement | null {
  const th = (e.target as HTMLElement).closest("th") as HTMLElement | null;
  if (!th || !host.contains(th)) return null;
  if (th.dataset.colLock) return null;
  if (th.getBoundingClientRect().right - e.clientX > 10) return null;
  return th;
}

export function ThHint({
  children,
  hint,
  className,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("p-3 text-center", className)}>
      <div className="th-title w-full text-center">{children}</div>
      {hint ? <div className="th-hint w-full text-center">{hint}</div> : null}
    </th>
  );
}

export function WideTable({
  id,
  children,
  className,
  pager,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  pager?: Pager<unknown>;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const host = node;
    applyWidths(host, readWidths(id));
    function down(e: MouseEvent) {
      const th = onResizer(e, host);
      if (!th) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = th.getBoundingClientRect().width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const move = (ev: MouseEvent) => setThWidth(th, startW + ev.clientX - startX);
      const up = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        writeWidths(id, host);
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    }
    function dbl(e: MouseEvent) {
      const th = onResizer(e, host);
      if (!th) return;
      e.preventDefault();
      e.stopPropagation();
      setThWidth(th, MIN_W);
      writeWidths(id, host);
    }
    host.addEventListener("mousedown", down);
    host.addEventListener("dblclick", dbl);
    return () => {
      host.removeEventListener("mousedown", down);
      host.removeEventListener("dblclick", dbl);
    };
  }, [id]);
  return (
    <div className="space-y-2">
      {pager ? (
        <PageBar size={pager.size} onSize={pager.setSize} page={pager.page} onPage={pager.setPage} pages={pager.pages} total={pager.total} />
      ) : null}
      <p className="mb-1 hidden text-[11px] text-muted md:block">
        底部左右滑动；拖表头右边线调列宽，双击收至最窄。调完会记住。
      </p>
      <p className="mb-1 text-[11px] text-muted md:hidden">宽表请左右滑动。「更改」在勾选框右边。点一行是勾选。</p>
      <div ref={ref} className={cn("wide-scroll overflow-x-scroll rounded-xl border border-line bg-surface", className)}>
        {children}
      </div>
      {pager ? (
        <PageBar size={pager.size} onSize={pager.setSize} page={pager.page} onPage={pager.setPage} pages={pager.pages} total={pager.total} />
      ) : null}
    </div>
  );
}
