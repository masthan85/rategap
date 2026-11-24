import { useMemo } from "react";
import { Link } from "react-router";
import { Kpi, Meter, Note, Panel } from "../components/ui";
import { useStore } from "../store/store";
import { rateGap } from "../lib/gap";
import { fscsExposure } from "../lib/fscs";
import { isaUsage } from "../lib/isa";
import { activeReminders, buildReminders } from "../lib/reminders";
import { savingsTax } from "../lib/tax";
import { daysBetween, taxYearOf } from "../lib/dates";
import { fmtDate, gbp, pct, relativeDays } from "../lib/format";
import { categoryLabel } from "../lib/categories";
import { RULES, type TaxBand } from "../config/rules";

export function HomePage() {
  const { state, products, today, update } = useStore();
  const { holdings, comparison } = state;

  const total = holdings.reduce((s, h) => s + h.balance, 0);
  const interest = holdings.reduce((s, h) => s + (h.balance * h.aer) / 100, 0);
  const avg = total ? (interest / total) * 100 : 0;

  const gaps = useMemo(
    () =>
      holdings
        .map((h) => ({ h, g: rateGap(h, products, comparison) }))
        .filter((x): x is { h: typeof x.h; g: NonNullable<typeof x.g> } => !!x.g && x.g.annual > 0)
        .sort((a, b) => (a.g.timing === b.g.timing ? b.g.annual - a.g.annual : a.g.timing === "now" ? -1 : 1)),
    [holdings, products, comparison],
  );
  const missed = gaps.filter((x) => x.g.timing === "now").reduce((s, x) => s + x.g.annual, 0);

  const fscs = fscsExposure(holdings);
  const over = fscs.filter((e) => e.status === "over");
  const near = fscs.filter((e) => e.status === "warn");

  const ty = taxYearOf(today);
  const isa = isaUsage(state.isa, ty.label);
  const next = activeReminders(buildReminders(holdings, today), state.reminders, today).filter((r) => r.date >= today).slice(0, 3);
  const tax = savingsTax(holdings, state.profile.band, today);
  const hasExamples = holdings.some((h) => h.example) || state.isa.some((i) => i.example);

  return (
    <>
      {hasExamples && (
        <div className="rounded-xl bg-accent-soft px-4 py-3 text-sm">
          These are example accounts. Replace them with your own on <Link to="/money">My money</Link>, or{" "}
          <button className="link" onClick={() => update((s) => ({ ...s, holdings: s.holdings.filter((h) => !h.example), isa: s.isa.filter((i) => !i.example) }))}>
            clear the examples
          </button>
          .
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Total saved" value={gbp(total)} sub={`${holdings.length} account${holdings.length === 1 ? "" : "s"}`} />
        <Kpi label="Average rate" value={pct(avg)} sub={`${gbp(interest)} a year`} />
        <Kpi label="Missed interest a year" value={gbp(missed)} sub="on accounts you can move now" tone={missed > 0 ? "warn" : holdings.length ? "good" : undefined} />
        <Kpi
          label="FSCS protection"
          value={over.length ? `${over.length} over limit` : near.length ? `${near.length} near limit` : holdings.length ? "All covered" : "–"}
          sub={`${fscs.length} banking licence${fscs.length === 1 ? "" : "s"}`}
          tone={over.length ? "crit" : near.length ? "warn" : holdings.length ? "good" : undefined}
        />
        <Kpi label="ISA allowance left" value={gbp(Math.max(0, isa.remaining))} sub={`until ${fmtDate(ty.end)}`} tone={isa.remaining < 0 ? "crit" : undefined} />
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[3fr_2fr]">
        <Panel title="Where you are underpaid" hint="Each account against the best rate on the board for the same kind of account">
          {!holdings.length ? (
            <p className="text-sm text-muted">
              <Link to="/money">Add an account</Link> to see its rate gap.
            </p>
          ) : gaps.length ? (
            <ul className="grid gap-2">
              {gaps.map(({ h, g }) => (
                <li key={h.id} className={`flex flex-wrap items-baseline justify-between gap-3 rounded-lg border border-l-4 border-line px-3 py-2.5 ${g.timing === "atMaturity" ? "border-l-accent" : g.annual > 200 ? "border-l-crit" : "border-l-warn"}`}>
                  <div className="min-w-0">
                    <strong>{h.provider} {h.product}</strong>
                    <p className="text-[13px] text-muted">
                      {pct(h.aer)} on {gbp(h.balance)}. Best {categoryLabel(g.best.category, g.best.termYears).toLowerCase()} on the board: {g.best.brand} at {pct(g.best.aer)}
                      {g.best.newCustomerOnly ? " (new customers only)" : ""}
                      {g.best.baseAer !== undefined ? ` (includes a bonus; ${pct(g.best.baseAer)} after)` : ""}.
                    </p>
                  </div>
                  <span className="num whitespace-nowrap">
                    {g.timing === "now" ? <><strong>{gbp(g.annual)}</strong> a year</> : <span className="pill pill-plain">{gbp(g.annual)} a year, review at maturity</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-l-4 border-line border-l-good px-3 py-2.5 text-sm">Every account is at or above the best rate on the board for its type.</p>
          )}
          <Link to="/rates" className="text-sm">Compare all rates</Link>
        </Panel>

        <Panel title="Next dates" action={<Link to="/alerts" className="text-[13px]">All alerts</Link>}>
          <ul className="grid gap-2">
            {next.map((r) => {
              const d = daysBetween(today, r.date);
              return (
                <li key={r.id} className={`flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-l-4 border-line px-3 py-2.5 ${d <= 14 ? "border-l-warn" : "border-l-accent"}`}>
                  <span>
                    <strong className="text-sm">{r.title}</strong>
                    <span className="block text-[13px] text-muted">{fmtDate(r.date)}</span>
                  </span>
                  <span className={`pill ${d <= 14 ? "pill-warn" : "pill-plain"}`}>{relativeDays(d)}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Panel title="FSCS protection" hint={`£${RULES.fscs.limit.toLocaleString("en-GB")} per person, per banking licence`} action={<Link to="/money" className="text-[13px]">Details</Link>}>
          {fscs.length ? (
            <div className="grid gap-2.5">
              {fscs.slice(0, 5).map((e) => (
                <div key={e.licence} className="grid gap-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="truncate">{e.licence}</span>
                    <span className="num">{gbp(e.total)}</span>
                  </div>
                  <Meter ratio={e.ratio} tone={e.status === "over" ? "crit" : e.status === "warn" ? "warn" : "good"} label={`${e.licence}: ${Math.round(e.ratio * 100)}% of the limit`} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Add accounts to see your exposure.</p>
          )}
        </Panel>

        <Panel
          title="Tax on interest outside ISAs"
          action={
            <label className="field">
              Tax band
              <select className="input" value={state.profile.band} onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, band: e.target.value as TaxBand } }))}>
                <option value="basic">Basic rate</option>
                <option value="higher">Higher rate</option>
                <option value="additional">Additional rate</option>
              </select>
            </label>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Kpi label="Interest a year" value={gbp(tax.interest)} sub={`Allowance ${gbp(tax.allowance)}`} />
            <Kpi label={`Tax now (${tax.rateNow}%)`} value={gbp(tax.taxNow)} />
            {tax.change && <Kpi label={`From ${fmtDate(tax.change.from)} (${tax.change.rate}%)`} value={gbp(tax.change.tax)} sub={tax.taxable > 0 ? "ISA interest is not taxed" : "Within your allowance"} />}
          </div>
          <Note>Estimate on a year's interest at today's balances and rates. The starting rate for savings is not modelled.</Note>
        </Panel>
      </div>
    </>
  );
}
