import { RULES } from "../config/rules";
import { licenceFor } from "./fscs";
import type { Holding, Product } from "./types";
import { addMonths } from "./dates";
import { fitsAmount } from "./rates";

export interface LadderInput {
  total: number;
  rungs: number;
  start: string;
  isa: boolean;
  /** Rates the saver typed, by term in years; override the feed. */
  manualRates: Record<number, number | undefined>;
}

export interface Rung {
  years: number;
  amount: number;
  maturity: string;
  product: Product | null;
  /** Rate used, from the product or the saver's own entry. */
  aer: number | null;
  licence: string | null;
  interest: number | null;
  /** The top-rate product was skipped to keep a licence within the FSCS limit. */
  movedForFscs: boolean;
  /** Even the chosen product leaves this licence over the limit. */
  overLimit: boolean;
}

/** Compound interest over the term at the AER: amount × ((1 + AER)^years − 1). */
export function compoundInterest(amount: number, aerPct: number, years: number): number {
  return amount * (Math.pow(1 + aerPct / 100, years) - 1);
}

export function splitAmount(total: number, rungs: number): number[] {
  const each = Math.floor(total / rungs);
  return Array.from({ length: rungs }, (_, i) => (i === rungs - 1 ? total - each * (rungs - 1) : each));
}

export function planLadder(input: LadderInput, products: Product[], holdings: Holding[]): Rung[] {
  const rungs = Math.min(5, Math.max(2, Math.round(input.rungs)));
  const amounts = splitAmount(Math.max(0, input.total), rungs);
  const category = input.isa ? "isa_fixed" : "fixed";
  const { limit } = RULES.fscs;

  // Running totals per licence, starting from what the saver already holds.
  const totals = new Map<string, number>();
  for (const h of holdings) {
    const { licence } = licenceFor(h);
    totals.set(licence, (totals.get(licence) ?? 0) + h.balance);
  }

  return amounts.map((amount, i) => {
    const years = i + 1;
    const maturity = addMonths(input.start, 12 * years);
    const manual = input.manualRates[years];

    const candidates = products
      .filter((p) => !p.benchmark && p.category === category && p.termYears === years && fitsAmount(p, amount))
      .sort((a, b) => b.aer - a.aer);

    let product: Product | null = null;
    let licence: string | null = null;
    let movedForFscs = false;
    let overLimit = false;

    if (candidates.length) {
      const withLicence = candidates.map((p) => ({
        p,
        licence: licenceFor({ provider: p.brand, licence: "", category: p.category }).licence,
      }));
      const fit = withLicence.find((c) => (totals.get(c.licence) ?? 0) + amount <= limit);
      const chosen = fit ?? withLicence[0];
      product = chosen.p;
      licence = chosen.licence;
      movedForFscs = !!fit && fit !== withLicence[0];
      overLimit = !fit;
      totals.set(licence, (totals.get(licence) ?? 0) + amount);
    } else if (amount > limit) {
      overLimit = true;
    }

    const aer = manual ?? product?.aer ?? null;
    return {
      years,
      amount,
      maturity,
      product,
      aer,
      licence,
      interest: aer == null ? null : compoundInterest(amount, aer, years),
      movedForFscs,
      overLimit,
    };
  });
}

export function rungToHolding(r: Rung, isa: boolean, start: string, id: string): Holding {
  return {
    id,
    provider: r.product?.brand ?? "To choose",
    licence: r.licence ?? "",
    product: r.product?.name ?? `${r.years}-year fixed ${isa ? "cash ISA" : "bond"}`,
    category: isa ? "isa_fixed" : "fixed",
    termYears: r.years,
    balance: r.amount,
    aer: r.aer ?? 0,
    opened: start,
    maturity: r.maturity,
    source: "manual",
  };
}
