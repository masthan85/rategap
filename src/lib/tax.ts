import { nextSavingsTaxChange, RULES, savingsTaxRatesOn, type TaxBand } from "../config/rules";
import { isIsaCategory } from "./categories";
import type { Holding } from "./types";

export interface TaxEstimate {
  interest: number;
  allowance: number;
  taxable: number;
  rateNow: number;
  taxNow: number;
  /** Next scheduled change, if any. */
  change: { from: string; rate: number; tax: number } | null;
}

/**
 * Estimated tax on a year's interest outside ISAs, at today's rates and from
 * the next scheduled change. The starting rate for savings is not modelled.
 */
export function savingsTax(holdings: Holding[], band: TaxBand, onIso: string): TaxEstimate {
  const interest = holdings
    .filter((h) => !isIsaCategory(h.category))
    .reduce((s, h) => s + (h.balance * h.aer) / 100, 0);
  const allowance = RULES.personalSavingsAllowance[band];
  const taxable = Math.max(0, interest - allowance);
  const rateNow = savingsTaxRatesOn(onIso)[band];
  const next = nextSavingsTaxChange(onIso);
  return {
    interest,
    allowance,
    taxable,
    rateNow,
    taxNow: (taxable * rateNow) / 100,
    change: next ? { from: next.from, rate: next.rates[band], tax: (taxable * next.rates[band]) / 100 } : null,
  };
}
