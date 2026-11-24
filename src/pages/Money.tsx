import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { HoldingForm } from "../components/HoldingForm";
import { Empty, Meter, Note, Panel, Toggle } from "../components/ui";
import { useStore } from "../store/store";
import { rateGap } from "../lib/gap";
import { fscsExposure } from "../lib/fscs";
import { planLadder, rungToHolding } from "../lib/ladder";
import { categoryLabel } from "../lib/categories";
import { fmtDate, gbp, pct, uid } from "../lib/format";
import { RULES } from "../config/rules";
import type { Holding } from "../lib/types";

export function MoneyPage() {
  const { state, products, update } = useStore();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
  const { holdings, comparison } = state;
  const total = holdings.reduce((s, h) => s + h.balance, 0);

  const save = (h: Holding) => {
    update((s) => ({
      ...s,
      holdings: s.holdings.some((x) => x.id === h.id) ? s.holdings.map((x) => (x.id === h.id ? { ...h, example: false } : x)) : [...s.holdings, h],
    }));
    setAdding(false);
    setEditing(null);
  };

  return (
    <>
      <Panel
        title="My money"
        hint={`${holdings.length} account${holdings.length === 1 ? "" : "s"}, ${gbp(total)}`}
        action={!adding && !editing && <button className="btn btn-sm" onClick={() => setAdding(true)}><Plus size={16} /> Add account</button>}
      >
        {(adding || editing) && (
          <div className="rounded-lg border border-line bg-paper p-4">
            <h3 className="mb-3 font-semibold">{editing ? `Edit ${editing.provider}` : "Add an account you hold"}</h3>
            <HoldingForm key={editing?.id ?? "new"} initial={editing ?? undefined} submitLabel={editing ? "Save changes" : "Add account"} onSave={save} onCancel={() => { setAdding(false); setEditing(null); }} />
          </div>
        )}

        {holdings.length ? (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Provider</th><th>Type</th><th className="n">Balance</th><th className="n">Rate</th><th className="n">Best on board</th><th className="n">Gap a year</th><th>Dates</th><th /></tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const g = rateGap(h, products, comparison);
                  return (
                    <tr key={h.id}>
                      <td>
                        <strong>{h.provider}</strong> {h.example && <span className="pill pill-plain">Example</span>}
                        <span className="block text-[13px] text-muted">{h.product}</span>
                      </td>
                      <td className="text-sm">{categoryLabel(h.category, h.termYears)}</td>
                      <td className="n">{gbp(h.balance)}</td>
                      <td className="n font-mono">{pct(h.aer)}</td>
                      <td className="n">{g ? <><span className="font-mono">{pct(g.best.aer)}</span><span className="block text-[13px] text-muted">{g.best.brand}</span></> : <span className="text-[13px] text-muted">No match</span>}</td>
                      <td className="n">
                        {!g ? "–" : g.annual === 0 ? <span className="pill pill-good">Best rate</span> : g.timing === "atMaturity" ? <span className="pill pill-plain">{gbp(g.annual)} at maturity</span> : <span className={`pill ${g.annual > 200 ? "pill-crit" : "pill-warn"}`}>{gbp(g.annual)}</span>}
                      </td>
                      <td className="text-[13px] text-muted">
                        {h.maturity && <span className="block">Matures {fmtDate(h.maturity)}</span>}
                        {h.bonusEnd && <span className="block">Bonus ends {fmtDate(h.bonusEnd)}</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        <button className="link" onClick={() => { setAdding(false); setEditing(h); }}>Edit</button> ·{" "}
                        <button className="link" onClick={() => update((s) => ({ ...s, holdings: s.holdings.filter((x) => x.id !== h.id) }))}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !adding && <Empty>No accounts yet. Add one to see its rate gap and FSCS position.</Empty>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3">
          <Toggle checked={comparison.excludeNewCustomer} onChange={(v) => update((s) => ({ ...s, comparison: { ...s.comparison, excludeNewCustomer: v } }))} label="Leave out new-customer-only deals" />
          <Toggle checked={comparison.excludeBonus} onChange={(v) => update((s) => ({ ...s, comparison: { ...s.comparison, excludeBonus: v } }))} label="Leave out bonus-led deals" />
        </div>
      </Panel>

      <FscsPanel holdings={holdings} />
      <LadderPanel />
    </>
  );
}

function FscsPanel({ holdings }: { holdings: Holding[] }) {
  const ex = fscsExposure(holdings);
  const { limit, warnRatio } = RULES.fscs;
  return (
    <Panel title="FSCS protection by banking licence" hint={`£${limit.toLocaleString("en-GB")} per person per licence. Brands sharing a licence share one limit. Warning from ${Math.round(warnRatio * 100)}%.`}>
      {ex.length ? (
        <div className="grid gap-3">
          {ex.map((e) => (
            <div key={e.licence} className="grid gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span>
                  <strong>{e.licence}</strong>
                  <span className="block text-[13px] text-muted">{e.holdings.map((h) => h.provider + (h.category === "hub" ? " hub cash" : "")).join(", ")}</span>
                </span>
                <span className="num">
                  {gbp(e.total)}{" "}
                  {e.status === "over" && <span className="pill pill-crit">{gbp(e.unprotected)} unprotected</span>}
                  {e.status === "warn" && <span className="pill pill-warn">{Math.round(e.ratio * 100)}% of limit</span>}
                </span>
              </div>
              <Meter ratio={e.ratio} tone={e.status === "over" ? "crit" : e.status === "warn" ? "warn" : "good"} label={`${e.licence}: ${Math.round(e.ratio * 100)}% of the limit`} />
              {!e.confirmed && <p className="text-[13px] text-muted">Licence not confirmed. Apps and platforms often place money with partner banks; check which, and edit the account.</p>}
            </div>
          ))}
        </div>
      ) : (
        <Empty>Add accounts to see your exposure.</Empty>
      )}
      <Note>Cash waiting in a platform's hub account counts against the hub bank: ClearBank for Raisin, HSBC for Flagstone, Barclays for Hargreaves Lansdown. Temporary high balances, such as house sale proceeds, can have extra protection for up to six months.</Note>
    </Panel>
  );
}

function LadderPanel() {
  const { state, products, today, update } = useStore();
  const [total, setTotal] = useState(30_000);
  const [rungs, setRungs] = useState(3);
  const [start, setStart] = useState(today);
  const [isa, setIsa] = useState(false);
  const [manual, setManual] = useState<Record<number, number | undefined>>({});
  const [msg, setMsg] = useState("");

  const plan = useMemo(() => planLadder({ total, rungs, start, isa, manualRates: manual }, products, state.holdings), [total, rungs, start, isa, manual, products, state.holdings]);
  const interest = plan.reduce((s, r) => s + (r.interest ?? 0), 0);
  const missing = plan.filter((r) => r.aer == null).length;

  function addRungs() {
    const hs = plan.map((r) => rungToHolding(r, isa, start, uid()));
    update((s) => ({ ...s, holdings: [...s.holdings, ...hs] }));
    setMsg(`Added ${hs.length} rungs to My money with maturity reminders.`);
  }

  return (
    <Panel title="Fixed-term ladder" hint="Split a lump sum so part of it matures each year, using the best current rate for each term">
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
        <label className="field">Total (£)<input className="input sm:w-32" type="number" min={0} step={500} value={total} onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))} /></label>
        <label className="field">Rungs
          <select className="input" value={rungs} onChange={(e) => setRungs(Number(e.target.value))}>{[2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
        <label className="field">Start<input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value || today)} /></label>
        <label className="field">Wrapper
          <select className="input" value={isa ? "isa" : "bond"} onChange={(e) => setIsa(e.target.value === "isa")}>
            <option value="bond">Fixed bonds</option>
            <option value="isa">Fixed cash ISAs</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Rung</th><th className="n">Amount</th><th>Product</th><th className="n">Rate (AER %)</th><th>Matures</th><th className="n">Interest by maturity</th></tr></thead>
          <tbody>
            {plan.map((r) => (
              <tr key={r.years}>
                <td>{r.years} year{r.years > 1 ? "s" : ""}</td>
                <td className="n">{gbp(r.amount)}</td>
                <td className="text-sm">
                  {r.product ? <>{r.product.brand}<span className="block text-[13px] text-muted">{r.licence}</span></> : <span className="text-[13px] text-muted">No {r.years}-year product in the snapshot</span>}
                  {r.movedForFscs && <span className="pill pill-warn mt-1">Different licence to stay within FSCS</span>}
                  {r.overLimit && <span className="pill pill-crit mt-1">Licence over £{RULES.fscs.limit.toLocaleString("en-GB")}</span>}
                </td>
                <td className="n">
                  <input
                    className="input w-24 text-right"
                    type="number"
                    step={0.01}
                    min={0}
                    aria-label={`Rate for the ${r.years}-year rung`}
                    placeholder={r.product ? String(r.product.aer) : "Enter"}
                    value={manual[r.years] ?? ""}
                    onChange={(e) => setManual({ ...manual, [r.years]: e.target.value === "" ? undefined : Number(e.target.value) })}
                  />
                </td>
                <td className="text-sm">{fmtDate(r.maturity)}</td>
                <td className="n">{r.interest == null ? <span className="text-[13px] text-muted">Needs a rate</span> : gbp(r.interest)}</td>
              </tr>
            ))}
            <tr>
              <td><strong>Total</strong></td>
              <td className="n"><strong>{gbp(plan.reduce((s, r) => s + r.amount, 0))}</strong></td>
              <td /><td /><td />
              <td className="n"><strong>{gbp(interest)}</strong>{missing > 0 && <span className="block text-[13px] text-muted">excludes {missing} rung{missing > 1 ? "s" : ""} without a rate</span>}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" onClick={addRungs} disabled={!total || missing > 0}>Add these rungs to My money</button>
        {missing > 0 && <span className="text-[13px] text-muted">Enter a rate for each rung first.</span>}
        {msg && <span className="text-[13px] text-good" role="status">{msg}</span>}
      </div>
      <Note>Interest assumes annual compounding at the stated AER: amount × ((1 + AER)^years − 1). Where a rung would take a banking licence past the FSCS limit, including what you already hold there, the planner picks the next-best product at a different licence.</Note>
    </Panel>
  );
}
