import { RULES } from "../config/rules";

/** All dates are handled as ISO "YYYY-MM-DD" strings in local time. */
export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(now: Date = new Date()): string {
  return toIso(now);
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function addMonths(iso: string, months: number): string {
  const d = parseIso(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toIso(d);
}

export function daysBetween(fromIso: string, toIsoDate: string): number {
  return Math.round((parseIso(toIsoDate).getTime() - parseIso(fromIso).getTime()) / 86_400_000);
}

/** UK tax year containing the date: runs 6 April to 5 April. */
export function taxYearOf(iso: string): { label: string; start: string; end: string } {
  const d = parseIso(iso);
  const { taxYearStartMonth: m, taxYearStartDay: day } = RULES.isa;
  const startYear =
    d.getMonth() + 1 > m || (d.getMonth() + 1 === m && d.getDate() >= day)
      ? d.getFullYear()
      : d.getFullYear() - 1;
  const start = toIso(new Date(startYear, m - 1, day));
  const end = toIso(new Date(startYear + 1, m - 1, day - 1));
  return { label: `${startYear}/${String(startYear + 1).slice(2)}`, start, end };
}
