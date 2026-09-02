export function ymKey(y: number, m: number): number {
  return y * 12 + m;
}

export function monthsInRange(
  fromY: number,
  fromM: number,
  toY: number,
  toM: number,
): { year: number; month: number }[] {
  let a = ymKey(fromY, fromM);
  let b = ymKey(toY, toM);
  if (a > b) [a, b] = [b, a];
  const out: { year: number; month: number }[] = [];
  for (let k = a; k <= b; k++) {
    const year = Math.floor((k - 1) / 12);
    const month = ((k - 1) % 12) + 1;
    out.push({ year, month });
  }
  return out;
}

export function rangeLabel(fromY: number, fromM: number, toY: number, toM: number): string {
  const span = monthsInRange(fromY, fromM, toY, toM);
  const start = span[0];
  const end = span[span.length - 1];
  if (!start || !end) return "";
  if (start.year === end.year && start.month === end.month) return `${start.year}年${start.month}月`;
  return `${start.year}年${start.month}月 至 ${end.year}年${end.month}月`;
}

export function YmPick({
  label,
  years,
  y,
  m,
  d,
  onY,
  onM,
  onD,
}: {
  label: string;
  years: number[];
  y: number;
  m: number;
  d?: number;
  onY: (n: number) => void;
  onM: (n: number) => void;
  onD?: (n: number) => void;
}) {
  const extra = years.includes(y) ? years : [...years, y].sort((a, b) => a - b);
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex gap-1">
        <select
          className="field-select w-auto"
          value={y}
          onChange={(e) => onY(Number(e.target.value))}
          aria-label={`${label}年`}
        >
          {extra.map((n) => (
            <option value={n} key={n}>
              {n}年
            </option>
          ))}
        </select>
        <select
          className="field-select w-auto"
          value={m}
          onChange={(e) => onM(Number(e.target.value))}
          aria-label={`${label}月`}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option value={n} key={n}>
              {n}月
            </option>
          ))}
        </select>
        {onD ? (
          <select
            className="field-select w-auto"
            value={d || 1}
            onChange={(e) => onD(Number(e.target.value))}
            aria-label={`${label}日`}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
              <option value={n} key={n}>
                {n}日
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}
