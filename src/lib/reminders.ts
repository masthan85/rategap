import { RULES } from "../config/rules";
import { addDays, daysBetween, taxYearOf } from "./dates";
import { gbp, pct } from "./format";
import type { Holding, Reminder, ReminderSettings, ReminderType } from "./types";

export const REMINDER_TYPE_LABEL: Record<ReminderType, string> = {
  maturity: "Fixed-term maturities",
  bonus: "Bonus rate end dates",
  isa: "ISA year end",
  boe: "Bank of England decisions",
  tax: "Tax-rule changes",
};

/** Every reminder implied by the saver's holdings and the rules, from `fromIso` on. */
export function buildReminders(holdings: Holding[], fromIso: string): Reminder[] {
  const out: Reminder[] = [];
  for (const h of holdings) {
    const name = `${h.provider} ${h.product}`.trim();
    if (h.maturity) {
      out.push({
        id: `maturity:${h.id}:${h.maturity}`,
        type: "maturity",
        date: h.maturity,
        holdingId: h.id,
        title: `${name} matures`,
        detail: `${gbp(h.balance)} at ${pct(h.aer)}. Compare rates before this date so the money does not roll into a low default rate.`,
      });
    }
    if (h.bonusEnd) {
      out.push({
        id: `bonus:${h.id}:${h.bonusEnd}`,
        type: "bonus",
        date: h.bonusEnd,
        holdingId: h.id,
        title: `${name}: bonus rate ends`,
        detail: `The rate on ${gbp(h.balance)} drops after this date. ISA money should move by ISA transfer, not withdrawal, to keep its tax-free status.`,
      });
    }
  }

  const ty = taxYearOf(fromIso);
  out.push({
    id: `isa:${ty.end}`,
    type: "isa",
    date: ty.end,
    title: `ISA allowance for ${ty.label} ends`,
    detail: `Any unused part of the £${RULES.isa.overall.toLocaleString("en-GB")} allowance is lost after 5 April.`,
  });

  for (const d of RULES.boeDecisions) {
    out.push({
      id: `boe:${d}`,
      type: "boe",
      date: d,
      title: "Bank of England rate decision",
      detail: `Bank Rate is ${RULES.bankRate.rate.toFixed(2)}%. Variable savings rates often move within days of a change.`,
    });
  }
  for (const c of RULES.ruleChanges) {
    out.push({ id: `tax:${c.date}`, type: "tax", date: c.date, title: c.title, detail: c.detail });
  }

  return out.filter((r) => r.date >= addDays(fromIso, -7)).sort((a, b) => a.date.localeCompare(b.date));
}

export function activeReminders(all: Reminder[], settings: ReminderSettings, todayIso: string): Reminder[] {
  return all.filter((r) => settings.enabled[r.type] && !(settings.snoozed[r.id] && settings.snoozed[r.id] > todayIso));
}

export interface DueNotification {
  key: string;
  reminder: Reminder;
  leadDays: number;
}

/**
 * Notifications whose send date (event minus 14 or 2 days) has arrived and
 * that have not already been shown. Only the closest lead time is returned,
 * so a saver opening the app late gets one notice, not two.
 */
export function dueNotifications(reminders: Reminder[], settings: ReminderSettings, todayIso: string): DueNotification[] {
  const out: DueNotification[] = [];
  for (const r of activeReminders(reminders, settings, todayIso)) {
    const daysLeft = daysBetween(todayIso, r.date);
    if (daysLeft < 0) continue;
    const leads = [...RULES.reminderLeadDays].sort((a, b) => a - b);
    const lead = leads.find((l) => daysLeft <= l);
    if (lead === undefined) continue;
    const key = `${r.id}@${lead}`;
    if (!settings.notified.includes(key)) out.push({ key, reminder: r, leadDays: lead });
  }
  return out;
}
