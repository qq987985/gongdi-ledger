import * as React from "react";
import { cn } from "~/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        {
          neutral: "bg-bg text-muted border-line",
          ok: "bg-ok-bg text-ok border-transparent",
          warn: "bg-warn-bg text-warn border-transparent",
          danger: "bg-danger-bg text-danger border-transparent",
          accent: "bg-accent text-accent-fg border-transparent",
        }[tone],
        className,
      )}
      {...props}
    />
  );
}
