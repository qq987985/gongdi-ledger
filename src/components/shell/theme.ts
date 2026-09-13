import { cn } from "~/lib/utils";

export function themeClass(uiStyle: "classic" | "v2" | "apple" | "movie"): string {
  return cn(uiStyle === "classic" && "theme-classic", uiStyle === "apple" && "theme-apple", uiStyle === "movie" && "theme-movie");
}
