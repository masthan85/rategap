import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router";
import { Bell, Home, LineChart, PiggyBank, Wallet, X } from "lucide-react";
import { useStore } from "../store/store";
import { buildReminders, dueNotifications } from "../lib/reminders";
import { fmtDate, relativeDays } from "../lib/format";
import { daysBetween } from "../lib/dates";

const TABS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/rates", label: "Rates", icon: LineChart },
  { to: "/money", label: "My money", icon: Wallet },
  { to: "/isas", label: "ISAs", icon: PiggyBank },
  { to: "/alerts", label: "Alerts", icon: Bell },
];

export function AppShell() {
  const { state, update, today, feedLive } = useStore();
  const reminders = useMemo(() => buildReminders(state.holdings, today), [state.holdings, today]);
  const due = useMemo(() => dueNotifications(reminders, state.reminders, today), [reminders, state.reminders, today]);
  const [shown, setShown] = useState(due);

  // Show each due notification once: in the app, and through the browser if allowed.
  useEffect(() => {
    if (!due.length) return;
    setShown((s) => [...s, ...due.filter((d) => !s.some((x) => x.key === d.key))]);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const d of due) new Notification(d.reminder.title, { body: `${fmtDate(d.reminder.date)}: ${d.reminder.detail}`, tag: d.key });
    }
    update((s) => ({ ...s, reminders: { ...s.reminders, notified: [...s.reminders.notified, ...due.map((d) => d.key)] } }));
  }, [due, update]);

  if (!state.profile.onboarded) return <Navigate to="/welcome" replace />;

  return (
    <div className="min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-10 border-b border-line bg-card">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-3 sm:px-5">
          <h1 className="text-[22px]">Rategap</h1>
          <span className="hidden text-[13px] text-muted sm:inline">Cash savings, ISAs and FSCS limits in one view</span>
          {!feedLive && <span className="pill pill-warn ml-auto">Snapshot rates, not a live feed</span>}
        </div>
        <nav aria-label="Sections" className="mx-auto hidden max-w-[1180px] gap-1 px-5 pt-2 md:flex">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-2 font-medium no-underline ${isActive ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="h-3 md:h-0" />
      </header>

      {shown.length > 0 && (
        <div className="mx-auto grid max-w-[1180px] gap-2 px-4 pt-4 sm:px-5" role="status">
          {shown.map((n) => (
            <div key={n.key} className="flex items-start justify-between gap-3 rounded-xl border border-warn bg-warn-soft px-4 py-3 text-sm">
              <span>
                <strong>{n.reminder.title}</strong> {relativeDays(daysBetween(today, n.reminder.date)).toLowerCase()}, on {fmtDate(n.reminder.date)}.
              </span>
              <button className="link no-underline" aria-label="Dismiss" onClick={() => setShown((s) => s.filter((x) => x.key !== n.key))}>
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <main className="mx-auto grid max-w-[1180px] gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-[1180px] px-4 pb-8 text-xs text-muted sm:px-5">
        Rates and rules as reported 17–20 November 2026. Figures change often; confirm with the provider before acting. Rategap provides information, not financial advice. We may earn a fee when you open an account through a link.
      </footer>

      <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => `grid justify-items-center gap-0.5 py-2 text-[11px] font-medium no-underline ${isActive ? "text-accent" : "text-muted"}`}
          >
            <t.icon size={22} aria-hidden />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
