import { useMemo, useState } from "react";
import { CalendarPlus, BellRing } from "lucide-react";
import { Empty, Note, Panel, Toggle } from "../components/ui";
import { useStore } from "../store/store";
import { activeReminders, buildReminders, REMINDER_TYPE_LABEL } from "../lib/reminders";
import { buildIcs } from "../lib/ics";
import { addDays, daysBetween } from "../lib/dates";
import { fmtDate, relativeDays } from "../lib/format";
import { RULES } from "../config/rules";
import type { ReminderType } from "../lib/types";

export function AlertsPage() {
  const { state, today, update } = useStore();
  const all = useMemo(() => buildReminders(state.holdings, today), [state.holdings, today]);
  const active = activeReminders(all, state.reminders, today);
  const snoozed = all.filter((r) => state.reminders.enabled[r.type] && state.reminders.snoozed[r.id] > today);
  const [perm, setPerm] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);

  const snooze = (id: string, until: string) => update((s) => ({ ...s, reminders: { ...s.reminders, snoozed: { ...s.reminders.snoozed, [id]: until } } }));
  const unsnooze = (id: string) =>
    update((s) => {
      const { [id]: _drop, ...rest } = s.reminders.snoozed;
      void _drop;
      return { ...s, reminders: { ...s.reminders, snoozed: rest } };
    });
  const setType = (t: ReminderType, v: boolean) => update((s) => ({ ...s, reminders: { ...s.reminders, enabled: { ...s.reminders.enabled, [t]: v } } }));

  function downloadIcs() {
    const blob = new Blob([buildIcs(active.filter((r) => r.date >= today))], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rategap-reminders.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <>
      <Panel
        title="Dates to act on"
        hint={`Notifications ${RULES.reminderLeadDays.join(" and ")} days before each date`}
        action={<button className="btn btn-sm" onClick={downloadIcs} disabled={!active.length}><CalendarPlus size={16} /> Add to calendar</button>}
      >
        {active.length ? (
          <ul className="grid gap-2">
            {active.map((r) => {
              const d = daysBetween(today, r.date);
              const tone = d < 0 ? "border-l-crit" : d <= 14 ? "border-l-warn" : "border-l-accent";
              const snoozeTo = d > 2 ? addDays(r.date, -2) : addDays(today, 1);
              return (
                <li key={r.id} className={`grid gap-1.5 rounded-lg border border-l-4 border-line px-3 py-2.5 ${tone}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm">{r.title}</strong>
                    <span className={`pill ${d < 0 ? "pill-crit" : d <= 14 ? "pill-warn" : "pill-plain"}`}>{fmtDate(r.date)} · {relativeDays(d)}</span>
                  </div>
                  <p className="text-[13px] text-muted">{r.detail}</p>
                  <div className="flex flex-wrap gap-3 text-[13px] text-muted">
                    <span>{REMINDER_TYPE_LABEL[r.type]}</span>
                    <button className="link" onClick={() => snooze(r.id, snoozeTo)}>Snooze until {fmtDate(snoozeTo)}</button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No reminders. Add fixed-term or bonus dates on My money, or switch reminder types back on below.</Empty>
        )}
        {snoozed.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted">{snoozed.length} snoozed</summary>
            <ul className="mt-2 grid gap-1">
              {snoozed.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2">
                  <span>{r.title} <span className="text-muted">until {fmtDate(state.reminders.snoozed[r.id])}</span></span>
                  <button className="link" onClick={() => unsnooze(r.id)}>Unsnooze</button>
                </li>
              ))}
            </ul>
          </details>
        )}
        <Note>The calendar file (.ics) imports into Outlook, Google Calendar and Apple Calendar, with alerts {RULES.reminderLeadDays.join(" and ")} days before each date.</Note>
      </Panel>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Panel title="Notification settings">
          <div className="grid gap-3">
            {(Object.keys(REMINDER_TYPE_LABEL) as ReminderType[]).map((t) => (
              <Toggle key={t} checked={state.reminders.enabled[t]} onChange={(v) => setType(t, v)} label={REMINDER_TYPE_LABEL[t]} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
            {perm === "granted" ? (
              <span className="text-sm text-good">Browser notifications are on.</span>
            ) : perm === "denied" ? (
              <span className="text-sm text-muted">Browser notifications are blocked in your browser settings.</span>
            ) : perm === "unsupported" ? (
              <span className="text-sm text-muted">This browser does not support notifications.</span>
            ) : (
              <button className="btn btn-sm btn-ghost" onClick={() => Notification.requestPermission().then(setPerm)}><BellRing size={16} /> Turn on browser notifications</button>
            )}
          </div>
          <Note>In this version, notifications appear when you open Rategap. Push notifications while the app is closed arrive with the mobile app.</Note>
        </Panel>

        <Panel title="Rate-change alerts" hint="Coming in a later release">
          <p className="text-sm text-muted">
            Once your accounts are linked through Open Banking, Rategap will alert you when your rate falls or a better rate for the same type of account appears. Until then, the rate gap on Home updates whenever the rate board does.
          </p>
        </Panel>
      </div>
    </>
  );
}
