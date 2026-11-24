import type { ComparisonSettings, Holding, Product } from "./types";
import { isFixedCategory } from "./categories";
import { fitsAmount, sameType } from "./rates";

export interface RateGap {
  best: Product;
  /** Percentage points between the best eligible AER and the holding's AER. */
  diffPts: number;
  /** balance × (best AER − current AER), rounded to the pound, never negative. */
  annual: number;
  /** Variable accounts can act now; fixed accounts are compared at maturity. */
  timing: "now" | "atMaturity";
}

/** Holding categories compared, and which product categories count as "the same type". */
function comparableTypes(h: Holding): { category: Holding["category"]; termYears?: number }[] {
  switch (h.category) {
    case "easy":
      return [{ category: "easy" }];
    // Easy access is at least as accessible as notice, so it is a fair comparison.
    case "notice":
      return [{ category: "notice" }, { category: "easy" }];
    case "isa_easy":
      return [{ category: "isa_easy" }];
    case "isa_notice":
      return [{ category: "isa_notice" }, { category: "isa_easy" }];
    case "fixed":
    case "isa_fixed":
      return h.termYears ? [{ category: h.category, termYears: h.termYears }] : [];
    case "hub":
      return [{ category: "easy" }];
    default:
      return [];
  }
}

export function annualGap(balance: number, bestAer: number, currentAer: number): number {
  return Math.max(0, Math.round((balance * (bestAer - currentAer)) / 100));
}

export function bestEligible(
  products: Product[],
  h: Pick<Holding, "category" | "termYears" | "balance">,
  settings: ComparisonSettings,
): Product | null {
  const types = comparableTypes(h as Holding);
  const pool = products.filter(
    (p) =>
      !p.benchmark &&
      types.some((t) => sameType(p, t.category, t.termYears)) &&
      fitsAmount(p, h.balance) &&
      !(settings.excludeNewCustomer && p.newCustomerOnly) &&
      !(settings.excludeBonus && p.baseAer !== undefined),
  );
  if (!pool.length) return null;
  return pool.reduce((a, b) => (b.aer > a.aer ? b : a));
}

export function rateGap(
  h: Holding,
  products: Product[],
  settings: ComparisonSettings,
): RateGap | null {
  const best = bestEligible(products, h, settings);
  if (!best) return null;
  return {
    best,
    diffPts: Math.max(0, best.aer - h.aer),
    annual: annualGap(h.balance, best.aer, h.aer),
    timing: isFixedCategory(h.category) ? "atMaturity" : "now",
  };
}

/** Total interest lost a year on accounts the saver can move today. */
export function missedInterestNow(
  holdings: Holding[],
  products: Product[],
  settings: ComparisonSettings,
): number {
  return holdings.reduce((sum, h) => {
    const g = rateGap(h, products, settings);
    return g && g.timing === "now" ? sum + g.annual : sum;
  }, 0);
}
