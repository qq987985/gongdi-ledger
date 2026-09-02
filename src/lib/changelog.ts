const VER = /^\[?(v?\d+(?:\.\d+){0,3})\]?\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})?\s*$/i;

export function normalizeVersion(v: unknown): string {
  const s =
    String(v || "")
      .trim()
      .replace(/^v/i, "")
      .replace(/\s+\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s*$/, "")
      .split(/\s+/)[0] || "";
  if (!s) return "0.0.0";
  if (/^\d+$/.test(s)) return Number(s) >= 10 ? `0.0.${s}` : `${s}.0.0`;
  return s;
}

export function formatVersion(v: unknown): string {
  const n = normalizeVersion(v);
  if (n.startsWith("0.0.") && Number(n.slice(4)) >= 10) return n.slice(4);
  return n;
}

export function formatReleaseDate(s: unknown): string {
  const m = String(s || "").match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

export function isNewerVersion(remote: string, local: string): boolean {
  const a = normalizeVersion(remote).split(".").map((x) => parseInt(x, 10) || 0);
  const b = normalizeVersion(local).split(".").map((x) => parseInt(x, 10) || 0);
  while (a.length < 3) a.push(0);
  while (b.length < 3) b.push(0);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

export interface Changelog {
  current: string;
  date: string;
  entries: ChangelogEntry[];
}

export function parseChangelog(text: string): Changelog {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const entries: ChangelogEntry[] = [];
  let current = "";
  let currentDate = "";
  let block: ChangelogEntry | null = null;
  let sawCurrentLine = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("当前")) continue;
    const m = line.match(VER);
    if (m && line.length < 36) {
      const version = normalizeVersion(m[1]);
      const date = formatReleaseDate(m[2] || "");
      const bracket = line.startsWith("[");
      if (!current) current = version;
      if (date && !currentDate) currentDate = date;
      if (!bracket && !sawCurrentLine) {
        sawCurrentLine = true;
        if (date && !currentDate) currentDate = date;
        continue;
      }
      sawCurrentLine = true;
      if (block && block.version === version) {
        if (date && !block.date) block.date = date;
        continue;
      }
      if (block) entries.push(block);
      block = { version, date, items: [] };
      continue;
    }
    if (!block) {
      if (!current) current = line;
      continue;
    }
    block.items.push(line.replace(/^[-*·]\s*/, ""));
  }
  if (block) entries.push(block);
  const merged: ChangelogEntry[] = [];
  for (const e of entries) {
    const last = merged[merged.length - 1];
    if (last && last.version === e.version) {
      last.items.push(...e.items);
      if (e.date && !last.date) last.date = e.date;
    } else merged.push({ version: e.version, date: e.date || "", items: [...e.items] });
  }
  if (!current && merged[0]) current = merged[0].version;
  if (!currentDate && merged[0]) currentDate = merged[0].date || "";
  return { current: current || "1.0.2", date: currentDate, entries: merged };
}
