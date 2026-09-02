import { encodeOtRule, parseOtRule } from "~/lib/wage";
import { Input } from "./ui/input";

export function PayTypePick({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: "day" | "month") => void;
}) {
  return (
    <select
      className="field-select w-full"
      value={value}
      onChange={(e) => onChange(e.target.value === "month" ? "month" : "day")}
    >
      <option value="day">按工天</option>
      <option value="month">按月</option>
    </select>
  );
}

export function OtRulePick({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const p = parseOtRule(value);
  const kind = p.kind;
  return (
    <div className="flex flex-wrap gap-2">
      <select
        className="field-select w-auto"
        value={kind}
        onChange={(e) => {
          const k = e.target.value;
          if (k === "none") onChange("");
          else onChange(encodeOtRule(k, p.param || (k === "hour" ? 25 : 8)));
        }}
      >
        <option value="none">不计加班</option>
        <option value="hour">按小时</option>
        <option value="fold">按折算</option>
      </select>
      {kind === "hour" ? (
        <label className="flex items-center gap-1 text-sm">
          <Input
            className="w-24"
            type="number"
            value={p.param || ""}
            onChange={(e) => onChange(encodeOtRule("hour", Number(e.target.value) || 0))}
          />
          元/小时
        </label>
      ) : null}
      {kind === "fold" ? (
        <label className="flex items-center gap-1 text-sm">
          <Input
            className="w-24"
            type="number"
            value={p.param || ""}
            onChange={(e) => onChange(encodeOtRule("fold", Number(e.target.value) || 0))}
          />
          小时折一天
        </label>
      ) : null}
    </div>
  );
}
