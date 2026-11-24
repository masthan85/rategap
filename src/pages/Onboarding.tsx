import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { Landmark, Lock } from "lucide-react";
import { HoldingForm } from "../components/HoldingForm";
import { exampleHoldings, useStore } from "../store/store";
import { categoryLabel } from "../lib/categories";
import { gbp, pct } from "../lib/format";
import type { TaxBand } from "../config/rules";
import type { Holding } from "../lib/types";

const MAX_ACCOUNTS = 3;

export function Onboarding() {
  const { state, update, today } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState<Holding[]>([]);
  const [band, setBand] = useState<TaxBand>("basic");

  function finish(useExamples = false) {
    const ex = useExamples ? exampleHoldings(today) : { holdings: [], isa: [] };
    update((s) => ({
      ...s,
      profile: { email: email.trim() || undefined, band, onboarded: true },
      holdings: [...accounts, ...ex.holdings],
      isa: [...s.isa, ...ex.isa],
    }));
    nav("/", { replace: true });
  }

  if (state.profile.onboarded) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto grid min-h-dvh max-w-[640px] content-start gap-5 px-4 py-8 sm:py-12">
      <div className="grid gap-2">
        <p className="text-[13px] font-medium text-muted">Step {step} of 3</p>
        <h1 className="text-3xl">
          {step === 1 && "See where your savings are underpaid"}
          {step === 2 && "Add the accounts you hold"}
          {step === 3 && "Your income tax band"}
        </h1>
        <p className="text-muted">
          {step === 1 && "Rategap compares each of your accounts with the best rate for the same kind of account, and tracks FSCS limits, maturity dates and your ISA allowance across every provider."}
          {step === 2 && `Add up to ${MAX_ACCOUNTS} accounts now; you can add the rest later. Balance and rate are on your banking app or statement.`}
          {step === 3 && "This sets your Personal Savings Allowance and the tax estimate on interest held outside ISAs."}
        </p>
      </div>

      {step === 1 && (
        <form
          className="grid gap-4 rounded-xl border border-line bg-card p-5"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <label className="field">
            Email address
            <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <p className="text-[13px] text-muted">In this version your details stay in this browser. Account sync arrives with sign-in.</p>
          <button className="btn justify-self-start" type="submit">Continue</button>
        </form>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <button type="button" disabled className="flex items-center gap-3 rounded-xl border border-line bg-card p-4 text-left opacity-70">
            <Landmark size={22} aria-hidden />
            <span className="grid">
              <strong>Connect your bank with Open Banking</strong>
              <span className="text-[13px] text-muted">Coming in a later release. Read-only access, reconfirmed every 90 days.</span>
            </span>
            <Lock size={16} className="ml-auto" aria-hidden />
          </button>

          {accounts.length > 0 && (
            <ul className="grid gap-2">
              {accounts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-line bg-card px-4 py-3 text-sm">
                  <span>
                    <strong>{a.provider}</strong> {a.product} <span className="text-muted">· {categoryLabel(a.category, a.termYears)}</span>
                  </span>
                  <span className="num">
                    {gbp(a.balance)} at {pct(a.aer)}{" "}
                    <button className="link ml-2" onClick={() => setAccounts(accounts.filter((x) => x.id !== a.id))}>Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {accounts.length < MAX_ACCOUNTS ? (
            <div className="rounded-xl border border-line bg-card p-5">
              <HoldingForm key={accounts.length} onSave={(h) => setAccounts([...accounts, h])} submitLabel={accounts.length ? "Add another" : "Add account"} />
            </div>
          ) : (
            <p className="text-sm text-muted">That's three. Add more from My money once you're in.</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn" onClick={() => setStep(3)} disabled={!accounts.length}>Continue</button>
            <button className="link" onClick={() => setStep(3)}>Skip for now</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4 rounded-xl border border-line bg-card p-5">
          <fieldset className="grid gap-2">
            <legend className="sr-only">Tax band</legend>
            {(
              [
                ["basic", "Basic rate", "Taxable income up to £50,270. £1,000 of interest tax-free."],
                ["higher", "Higher rate", "£50,271 to £125,140. £500 of interest tax-free."],
                ["additional", "Additional rate", "Over £125,140. No Personal Savings Allowance."],
              ] as [TaxBand, string, string][]
            ).map(([v, label, hint]) => (
              <label key={v} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${band === v ? "border-accent bg-accent-soft" : "border-line"}`}>
                <input type="radio" name="band" value={v} checked={band === v} onChange={() => setBand(v)} className="mt-1 accent-[var(--accent)]" />
                <span className="grid">
                  <strong className="text-sm">{label}</strong>
                  <span className="text-[13px] text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn" onClick={() => finish(false)}>See my savings</button>
            {accounts.length === 0 && <button className="link" onClick={() => finish(true)}>Explore with example accounts instead</button>}
          </div>
        </div>
      )}
    </div>
  );
}
