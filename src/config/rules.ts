/**
 * Regulatory and tax rules, held as configuration so a Budget or FCA change
 * needs a config edit rather than a code release. Owned by compliance.
 *
 * Figures reflect the November 2026 research behind the product spec and the
 * 28 October 2026 Budget as reported at the time. Compliance must confirm each
 * value before launch.
 */
export type TaxBand = "basic" | "higher" | "additional";

export interface SavingsTaxPeriod {
  /** First day the rates apply (ISO date, inclusive). */
  from: string;
  rates: Record<TaxBand, number>;
}

export const RULES = {
  reviewedOn: "2026-11-20",

  fscs: {
    limit: 120_000,
    /** Warn once a licence holds this share of the limit. */
    warnRatio: 0.85,
  },

  isa: {
    overall: 20_000,
    lifetime: 4_000,
    lifetimeBonusRate: 0.25,
    junior: 9_000,
    /** Tax year starts on 6 April. */
    taxYearStartMonth: 4,
    taxYearStartDay: 6,
  },

  personalSavingsAllowance: {
    basic: 1_000,
    higher: 500,
    additional: 0,
  } satisfies Record<TaxBand, number>,

  savingsTax: [
    { from: "2026-04-06", rates: { basic: 20, higher: 40, additional: 45 } },
    { from: "2027-04-06", rates: { basic: 24, higher: 44, additional: 49 } },
  ] satisfies SavingsTaxPeriod[],

  bankRate: { rate: 4.0, since: "2026-11-05" },

  /** Announced Monetary Policy Committee decision dates still to come. */
  boeDecisions: ["2026-12-17"],

  /** Dated rule changes users get a reminder for. */
  ruleChanges: [
    {
      date: "2027-04-06",
      title: "Savings tax rises by 4 points",
      detail:
        "Interest above the Personal Savings Allowance is taxed at 24%, 44% or 49%. Interest inside an ISA stays tax-free.",
    },
  ],

  /** Product data older than this is flagged as stale. */
  staleAfterHours: 24,

  /** Reminder lead times, in days before the event. */
  reminderLeadDays: [14, 2],
} as const;

export function savingsTaxRatesOn(isoDate: string): SavingsTaxPeriod["rates"] {
  const periods = [...RULES.savingsTax].sort((a, b) => a.from.localeCompare(b.from));
  let current = periods[0].rates;
  for (const p of periods) if (p.from <= isoDate) current = p.rates;
  return current;
}

export function nextSavingsTaxChange(isoDate: string): SavingsTaxPeriod | null {
  return (
    [...RULES.savingsTax]
      .sort((a, b) => a.from.localeCompare(b.from))
      .find((p) => p.from > isoDate) ?? null
  );
}
