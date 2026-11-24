import { RULES } from "../config/rules";
import { addDays } from "./dates";
import type { Reminder } from "./types";

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 characters, as RFC 5545 requires. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(" " + line.slice(i, i + 74));
  return parts.join("\r\n");
}

export function buildIcs(reminders: Reminder[], now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rategap//Reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const r of reminders) {
    const start = r.date.replace(/-/g, "");
    const end = addDays(r.date, 1).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${r.id.replace(/[^A-Za-z0-9:-]/g, "-")}@rategap`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeText(r.title)}`,
      `DESCRIPTION:${escapeText(r.detail)}`,
    );
    for (const lead of RULES.reminderLeadDays) {
      lines.push("BEGIN:VALARM", `TRIGGER:-P${lead}D`, "ACTION:DISPLAY", `DESCRIPTION:${escapeText(r.title)}`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
