import { useState } from "react";
import { Dialog, Empty, Note, OpenInterstitial, Panel, Toggle } from "../components/ui";
import { useStore } from "../store/store";
import { BOARD_CHIPS, isIsaCategory } from "../lib/categories";
import { boardRows, isStale, yearOneInterest, type BoardFilter } from "../lib/rates";
import { fmtDateTime, gbp, pct } from "../lib/format";
import { RULES } from "../config/rules";
import type { Product } from "../lib/types";

export function RatesPage() {
  const { products, feedName } = useStore();
  const [chip, setChip] = useState("easy");
  const [amount, setAmount] = useState(10_000);
  const [route, setRoute] = useState<BoardFilter["route"]>("all");
  const [flexOnly, setFlexOnly] = useState(false);
  const [bench, setBench] = useState(false);
  const [sort, setSort] = useState<BoardFilter["sort"]>("aer");
  const [detail, setDetail] = useState<Product | null>(null);
  const [opening, setOpening] = useState<Product | null>(null);

  const c = BOARD_CHIPS.find((x) => x.id === chip)!;
  const rows = boardRows(products, { category: c.category, termYears: c.termYears, amount, route, flexibleIsaOnly: flexOnly, showBenchmarks: bench, sort });
  const top = rows.find((r) => !r.benchmark);
  const anyBonus = rows.some((r) => r.baseAer !== undefined);
  const isa = isIsaCategory(c.category);

  return (
    <>
      <Panel
        title="Rate board"
        hint={`${feedName}. Bank Rate ${RULES.bankRate.rate.toFixed(2)}%. Ranked only by the sort you choose.`}
      >
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Account type">
          {BOARD_CHIPS.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === chip}
              onClick={() => setChip(x.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[13px] ${x.id === chip ? "border-accent bg-accent text-accent-ink" : "border-line bg-card text-ink"}`}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <label className="field">
            Amount (£)
            <input className="input sm:w-32" type="number" inputMode="numeric" min={0} step={500} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <label className="field">
            Open via
            <select className="input" value={route} onChange={(e) => setRoute(e.target.value as BoardFilter["route"])}>
              <option value="all">Direct or platform</option>
              <option value="direct">Direct with the provider</option>
              <option value="platform">Savings platform</option>
            </select>
          </label>
          <label className="field">
            Sort by
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value as BoardFilter["sort"])}>
              <option value="aer">AER</option>
              <option value="yearOne">Interest in year one</option>
            </select>
          </label>
          <div className="col-span-2 flex flex-wrap gap-4 pb-1">
            {isa && <Toggle checked={flexOnly} onChange={setFlexOnly} label="Flexible ISAs only" />}
            <Toggle checked={bench} onChange={setBench} label="Show market averages" />
          </div>
        </div>

        {rows.length ? (
          <>
            {/* Cards on phones, table from tablet width */}
            <ul className="grid gap-2 md:hidden">
              {rows.map((p) => (
                <li key={p.id} className="grid gap-1 rounded-lg border border-line p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <strong>{p.brand}</strong>
                    <span className="font-mono text-lg">{pct(p.aer)}</span>
                  </div>
                  <span className="text-sm">{p.name}</span>
                  <Badges p={p} isTop={p === top} />
                  {!p.benchmark && (
                    <div className="flex items-center justify-between gap-2 pt-1 text-sm">
                      <span className="num text-muted">{gbp(yearOneInterest(p, amount))} in year one</span>
                      <button className="btn btn-sm btn-ghost" onClick={() => setDetail(p)}>Details</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Account</th>
                    <th className="n">AER</th>
                    {anyBonus && <th className="n">After bonus</th>}
                    <th className="n">Year one on {gbp(amount)}</th>
                    <th className="n">Minimum</th>
                    <th>Route</th>
                    <th>As of</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.brand}</strong>
                        <div className="mt-1"><Badges p={p} isTop={p === top} hideRoute /></div>
                      </td>
                      <td>{p.name}{p.bonusEnds && <span className="block text-[13px] text-muted">Bonus: {p.bonusEnds}</span>}</td>
                      <td className="n font-mono">{pct(p.aer)}</td>
                      {anyBonus && <td className="n font-mono">{p.baseAer !== undefined ? pct(p.baseAer) : "–"}</td>}
                      <td className="n">{p.benchmark ? "–" : gbp(yearOneInterest(p, amount))}{p.monthlyCap && <span className="block text-[13px] text-muted">£{p.monthlyCap} a month</span>}</td>
                      <td className="n">{p.minDeposit ? gbp(p.minDeposit) : "–"}</td>
                      <td>{p.benchmark ? "" : p.route === "platform" ? <span className="pill">{p.platform ?? "Platform"}</span> : <span className="pill pill-plain">Direct</span>}</td>
                      <td className="text-[13px] text-muted">{fmtDateTime(p.asOf)}</td>
                      <td>{!p.benchmark && <button className="btn btn-sm btn-ghost" onClick={() => setDetail(p)}>Details</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Empty>
            {c.category === "fixed" || c.category === "isa_fixed"
              ? `The snapshot has no ${c.label.toLowerCase()} products. The licensed feed will fill this category.`
              : "No products match these filters. Try a different amount or route."}
          </Empty>
        )}
        <Note>
          Rates older than {RULES.staleAfterHours} hours are marked stale. Headline rates on some app ISAs include a 12-month bonus; the after-bonus column shows what remains. Confirm the live rate and terms with the provider before opening.
        </Note>
      </Panel>

      <ProductDetail product={detail} amount={amount} onClose={() => setDetail(null)} onOpen={(p) => { setDetail(null); setOpening(p); }} />
      <OpenInterstitial product={opening} onClose={() => setOpening(null)} />
    </>
  );
}

function Badges({ p, isTop, hideRoute }: { p: Product; isTop: boolean; hideRoute?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {isTop && <span className="pill pill-good">Highest shown</span>}
      {p.benchmark && <span className="pill pill-plain">Market average</span>}
      {p.newCustomerOnly && <span className="pill pill-warn">New customers</span>}
      {p.baseAer !== undefined && <span className="pill pill-warn">Bonus</span>}
      {p.flexibleIsa && <span className="pill">Flexible ISA</span>}
      {!hideRoute && !p.benchmark && (p.route === "platform" ? <span className="pill">{p.platform ?? "Platform"}</span> : <span className="pill pill-plain">Direct</span>)}
      {isStale(p) && <span className="pill pill-crit">Stale</span>}
    </div>
  );
}


function ProductDetail({ product: p, amount, onClose, onOpen }: { product: Product | null; amount: number; onClose: () => void; onOpen: (p: Product) => void }) {
  return (
    <Dialog open={!!p} onClose={onClose} title={p ? `${p.brand}: ${p.name}` : ""}>
      {p && (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">AER</dt><dd className="font-mono">{pct(p.aer)}</dd>
            {p.baseAer !== undefined && (<><dt className="text-muted">After bonus</dt><dd><span className="font-mono">{pct(p.baseAer)}</span>. {p.bonusEnds}</dd></>)}
            <dt className="text-muted">Year one on {gbp(amount)}</dt><dd className="num">{gbp(yearOneInterest(p, amount))}</dd>
            <dt className="text-muted">Minimum</dt><dd>{p.minDeposit ? gbp(p.minDeposit) : "None stated"}</dd>
            {p.monthlyCap && (<><dt className="text-muted">Monthly limit</dt><dd>{gbp(p.monthlyCap)}</dd></>)}
            <dt className="text-muted">Opens</dt><dd>{p.route === "platform" ? `Through ${p.platform ?? "a savings platform"}` : "Direct with the provider"}</dd>
            {p.flexibleIsa !== undefined && (<><dt className="text-muted">Flexible ISA</dt><dd>{p.flexibleIsa ? "Yes" : "No"}</dd></>)}
            {p.terms && (<><dt className="text-muted">Terms</dt><dd>{p.terms}</dd></>)}
            <dt className="text-muted">Rate as of</dt><dd>{fmtDateTime(p.asOf)}{isStale(p) && <span className="pill pill-crit ml-2">Stale</span>}</dd>
          </dl>
          <div className="flex justify-end">
            <button className="btn" onClick={() => onOpen(p)}>Open</button>
          </div>
        </>
      )}
    </Dialog>
  );
}
