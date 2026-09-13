import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { authStatus } from "~/lib/auth";
import { APP_NAME, NAV } from "./nav";

export function Brand({ year, compact, pathname }: { year: number; compact?: boolean; pathname: string }) {
  const section = (NAV.find((n) => n.to === pathname) || NAV.find((n) => n.to !== "/" && pathname.startsWith(n.to)))?.label || "总览";
  const [book, setBook] = React.useState("");
  React.useEffect(() => {
    function apply(name: string) {
      setBook(name);
    }
    authStatus().then((s) => {
      apply(s.books.find((b: any) => b.id === s.bookId)?.name || "");
    });
    const on = (e: any) => apply(e.detail || "");
    window.addEventListener("gongdi-book", on);
    return () => window.removeEventListener("gongdi-book", on);
  }, []);
  return (
    <div className="min-w-0">
      <div className={cn("font-display truncate font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>
        {book || APP_NAME}
      </div>
      {!compact ? (
        <div className="mt-0.5 truncate text-xs text-muted">
          {year} · {section}
        </div>
      ) : null}
    </div>
  );
}

export function NavLink({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      preload={false}
      className={cn(
        "flex h-9 items-center gap-1 rounded-sm px-2.5 text-xs transition-colors duration-150 md:h-8",
        active ? "bg-accent text-accent-fg" : "text-muted hover:bg-accent-soft hover:text-ink",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
