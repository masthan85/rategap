import { useState, type FormEvent } from "react";
import { lookupLicence, PARTNER_PANEL, PLATFORM_NAMES, VARIES } from "../data/licences";
import { CATEGORY_LABEL, isFixedCategory } from "../lib/categories";
import { uid } from "../lib/format";
import type { Category, Holding } from "../lib/types";

const BRAND_SUGGESTIONS = [
  "HSBC", "first direct", "Barclays", "Lloyds", "Halifax", "Bank of Scotland", "NatWest", "Royal Bank of Scotland",
  "Santander", "Nationwide", "Chase UK", "Marcus", "Monzo", "Starling", "Kent Reliance", "Trading 212", "Chip", "Moneybox", "Plum",
];

const HOLDING_CATEGORIES: Category[] = ["easy", "notice", "regular", "fixed", "isa_easy", "isa_notice", "isa_fixed", "hub", "other"];

export function HoldingForm({ initial, onSave, onCancel, submitLabel = "Add account" }: {
  initial?: Holding;
  onSave: (h: Holding) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [f, setF] = useState({
    provider: initial?.provider ?? "",
    licence: initial?.licence ?? "",
    product: initial?.product ?? "",
    category: initial?.category ?? ("easy" as Category),
    termYears: String(initial?.termYears ?? 1),
    balance: initial ? String(initial.balance) : "",
    aer: initial ? String(initial.aer) : "",
    maturity: initial?.maturity ?? "",
    bonusEnd: initial?.bonusEnd ?? "",
    platform: initial?.platform ?? PLATFORM_NAMES[0],
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const known = lookupLicence(f.provider);
  const suggested = known && known.licence !== PARTNER_PANEL && known.licence !== VARIES ? known.licence : "";
  const fixed = isFixedCategory(f.category);
  const hub = f.category === "hub";

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? uid(),
      provider: f.provider.trim(),
      licence: f.licence.trim() || suggested,
      product: f.product.trim(),
      category: f.category,
      termYears: fixed ? Number(f.termYears) : undefined,
      balance: Math.max(0, Number(f.balance) || 0),
      aer: Math.max(0, Number(f.aer) || 0),
      maturity: fixed ? f.maturity || undefined : undefined,
      bonusEnd: f.bonusEnd || undefined,
      platform: hub ? f.platform : undefined,
      opened: initial?.opened,
      source: initial?.source ?? "manual",
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="field">
          Provider
          <input className="input" required list="brand-list" value={f.provider} onChange={set("provider")} placeholder="e.g. HSBC" autoComplete="off" />
          <datalist id="brand-list">{BRAND_SUGGESTIONS.map((b) => <option key={b} value={b} />)}</datalist>
        </label>
        <label className="field">
          Banking licence
          <input className="input" value={f.licence} onChange={set("licence")} placeholder={suggested || "Ask the provider if unsure"} />
        </label>
        <label className="field">
          Account name
          <input className="input" value={f.product} onChange={set("product")} placeholder="e.g. Flexible Saver" />
        </label>
        <label className="field">
          Type
          <select className="input" value={f.category} onChange={set("category")}>
            {HOLDING_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </label>
        {fixed && (
          <label className="field">
            Term
            <select className="input" value={f.termYears} onChange={set("termYears")}>
              {[1, 2, 3, 4, 5].map((t) => <option key={t} value={t}>{t} year{t > 1 ? "s" : ""}</option>)}
            </select>
          </label>
        )}
        {hub && (
          <label className="field">
            Platform
            <select className="input" value={f.platform} onChange={set("platform")}>
              {PLATFORM_NAMES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        )}
        <label className="field">
          Balance (£)
          <input className="input" type="number" inputMode="decimal" min="0" step="0.01" required value={f.balance} onChange={set("balance")} />
        </label>
        <label className="field">
          Interest rate (AER %)
          <input className="input" type="number" inputMode="decimal" min="0" max="20" step="0.01" required value={f.aer} onChange={set("aer")} />
        </label>
        {fixed && (
          <label className="field">
            Matures
            <input className="input" type="date" value={f.maturity} onChange={set("maturity")} />
          </label>
        )}
        <label className="field">
          Bonus rate ends
          <input className="input" type="date" value={f.bonusEnd} onChange={set("bonusEnd")} />
        </label>
      </div>
      {f.provider && !suggested && !f.licence && (
        <p className="text-[13px] text-muted">
          We don't know {f.provider}'s banking licence yet, so its FSCS bar will show on its own. Add the licence name if you know it.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="submit">{submitLabel}</button>
        {onCancel && <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
