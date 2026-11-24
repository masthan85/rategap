import { useState, type FormEvent } from "react";
import { Kpi, Meter, Note, OpenInterstitial, Panel, Empty, Toggle } from "../components/ui";
import { useStore } from "../store/store";
import { checkEntry, ISA_TYPE_LABEL, isaUsage } from "../lib/isa";
import { daysBetween, taxYearOf } from "../lib/dates";
import { fmtDate, gbp, uid } from "../lib/format";
import { RULES } from "../config/rules";
import { ISA_TYPES, SS_PLATFORMS } from "../data/isaInfo";
import type { IsaEntry, IsaType, Product } from "../lib/types";

export function IsasPage() {
  const { state, today, update } = useStore();
  const ty = taxYearOf(today);
  const u = isaUsage(state.isa, ty.label);
  const { overall, lifetime, junior } = RULES.isa;
  const entries = state.isa.filter((e) => e.taxYear === ty.label);
  const [opening, setOpening] = useState<Product | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`grid gap-1.5 rounded-xl border p-3.5 ${u.remaining < 0 ? "border-crit bg-crit-soft" : "border-line bg-card"}`}>
          <span className="text-[13px] text-muted">Used of £{overall.toLocaleString("en-GB")}</span>
          <b className="num text-2xl font-semibold">{gbp(u.used)}</b>
          <Meter ratio={u.used / overall} tone={u.remaining < 0 ? "crit" : u.used / overall > 0.85 ? "warn" : undefined} label="ISA allowance used" />
        </div>
        <Kpi label={u.remaining < 0 ? "Over the allowance by" : "Allowance left"} value={gbp(Math.abs(u.remaining))} sub={ty.label} tone={u.remaining < 0 ? "crit" : "good"} />
        <Kpi label="Lifetime ISA" value={gbp(u.lifetime)} sub={`of £${lifetime.toLocaleString("en-GB")}${u.lifetime ? `, bonus ${gbp(u.lifetimeBonus)}` : ""}`} tone={u.lifetime > lifetime ? "crit" : undefined} />
        <Kpi label="Days to use it" value={Math.max(0, daysBetween(today, ty.end))} sub={`Resets after ${fmtDate(ty.end)}`} />
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[3fr_2fr]">
        <Panel title="ISA payments this tax year" hint={`Tax year ${ty.label}: ${fmtDate(ty.start)} to ${fmtDate(ty.end)}`}>
          <IsaForm taxYear={ty.label} entries={state.isa} onSave={(e) => update((s) => ({ ...s, isa: [...s.isa, e] }))} />
          {entries.length ? (
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Provider</th><th>Type</th><th className="n">Amount</th><th /></tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td>{e.provider} {e.example && <span className="pill pill-plain">Example</span>}{e.child && <span className="block text-[13px] text-muted">For {e.child}</span>}</td>
                      <td className="text-sm">
                        {ISA_TYPE_LABEL[e.type]}
                        <span className="block text-[13px] text-muted">
                          {e.transfer ? "Transfer in (no allowance used)" : e.kind === "withdrawal" ? (e.flexible ? "Flexible withdrawal (can be replaced)" : "Withdrawal (allowance not returned)") : "Payment"}
                        </span>
                      </td>
                      <td className="n">{e.kind === "withdrawal" ? "−" : ""}{gbp(e.amount)}</td>
                      <td><button className="link" onClick={() => update((s) => ({ ...s, isa: s.isa.filter((x) => x.id !== e.id) }))}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No ISA payments recorded for {ty.label}.</Empty>
          )}
          {Object.keys(u.junior).length > 0 && (
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold">Junior ISAs</h3>
              {Object.entries(u.junior).map(([child, amt]) => (
                <div key={child} className="grid gap-1 text-sm">
                  <div className="flex justify-between"><span>{child}</span><span className="num">{gbp(amt)} of £{junior.toLocaleString("en-GB")}</span></div>
                  <Meter ratio={amt / junior} tone={amt > junior ? "crit" : undefined} label={`${child}'s Junior ISA`} />
                </div>
              ))}
            </div>
          )}
          <Note>Transfers between providers never use allowance. Since April 2024 you can pay into several ISAs of the same type in one year, but only one Lifetime ISA. Money taken from a flexible ISA can be put back in the same tax year without using more allowance.</Note>
        </Panel>

        <Panel title={`ISA types for ${ty.label}`}>
          <div className="grid gap-2.5">
            {ISA_TYPES.map(([name, limit, note]) => (
              <div key={name} className="grid gap-1 rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2"><strong className="text-sm">{name}</strong><span className="pill">{limit}</span></div>
                <p className="text-[13px] text-muted">{note}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Stocks & shares ISA platforms" hint="Platform fees from 2026 comparisons; check each provider's current tariff">
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Provider</th><th>Platform fee</th><th>Notes</th><th /></tr></thead>
            <tbody>
              {SS_PLATFORMS.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.brand}</strong></td>
                  <td className="text-sm">{p.fee}</td>
                  <td className="text-[13px] text-muted">{p.terms}</td>
                  <td><button className="btn btn-sm btn-ghost" onClick={() => setOpening(p)}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>Investing puts your capital at risk: the value of investments can fall as well as rise, and you may get back less than you put in. Past performance is not a guide to the future.</Note>
      </Panel>
      <OpenInterstitial product={opening} onClose={() => setOpening(null)} />
    </>
  );
}

function IsaForm({ taxYear, entries, onSave }: { taxYear: string; entries: IsaEntry[]; onSave: (e: IsaEntry) => void }) {
  const [provider, setProvider] = useState("");
  const [type, setType] = useState<IsaType>("cash");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"payment" | "withdrawal" | "transfer">("payment");
  const [flexible, setFlexible] = useState(true);
  const [child, setChild] = useState("");
  const [pendingWarnings, setPendingWarnings] = useState<string[]>([]);

  const build = (): IsaEntry => ({
    id: uid(),
    taxYear,
    provider: provider.trim(),
    type,
    amount: Math.max(0, Number(amount) || 0),
    kind: kind === "withdrawal" ? "withdrawal" : "payment",
    transfer: kind === "transfer" || undefined,
    flexible: kind === "withdrawal" ? flexible : undefined,
    child: type === "junior" ? child.trim() || undefined : undefined,
  });

  const commit = (e: IsaEntry) => {
    onSave(e);
    setAmount("");
    setPendingWarnings([]);
  };

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const e = build();
    const w = checkEntry(entries, e);
    if (w.length && !pendingWarnings.length) {
      setPendingWarnings(w);
      return;
    }
    commit(e);
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
        <label className="field col-span-2 sm:col-span-1">Provider<input className="input" required value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Trading 212" /></label>
        <label className="field">ISA type
          <select className="input" value={type} onChange={(e) => { setType(e.target.value as IsaType); setPendingWarnings([]); }}>
            {(Object.keys(ISA_TYPE_LABEL) as IsaType[]).map((t) => <option key={t} value={t}>{ISA_TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="field">Entry
          <select className="input" value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setPendingWarnings([]); }}>
            <option value="payment">Payment in</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer in</option>
          </select>
        </label>
        {type === "junior" && <label className="field">Child<input className="input" required value={child} onChange={(e) => setChild(e.target.value)} placeholder="First name" /></label>}
        <label className="field">Amount (£)<input className="input sm:w-28" type="number" min={0} step={50} required value={amount} onChange={(e) => { setAmount(e.target.value); setPendingWarnings([]); }} /></label>
        <button className="btn col-span-2 sm:col-span-1" type="submit">{pendingWarnings.length ? "Save anyway" : "Add"}</button>
      </div>
      {kind === "withdrawal" && <Toggle checked={flexible} onChange={setFlexible} label="This is a flexible ISA" hint="Flexible ISAs let you replace withdrawals in the same tax year without using allowance." />}
      {pendingWarnings.length > 0 && (
        <div role="alert" className="grid gap-1 rounded-lg border border-warn bg-warn-soft p-3 text-sm">
          {pendingWarnings.map((w) => <p key={w}>{w}</p>)}
          <p className="text-[13px] text-muted">Nothing is blocked. Check with your provider, then save if the figure is right.</p>
        </div>
      )}
    </form>
  );
}
