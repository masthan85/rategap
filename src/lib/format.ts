import { parseIso } from "./dates";

export const gbp = (v: number, dp = 0) =>
  "£" +
  Number(v || 0).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });

export const pct = (v: number) => `${Number(v).toFixed(2)}%`;

export function fmtDate(iso?: string): string {
  if (!iso) return "";
  return parseIso(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(isoTs: string): string {
  return new Date(isoTs).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeDays(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${-days} days ago`;
  return `in ${days} days`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
