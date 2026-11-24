import { RULES } from "../config/rules";
import type { Category, Product, Route } from "./types";

export interface BoardFilter {
  category: Category;
  termYears?: number;
  /** Amount the saver wants to place; hides products whose min/max exclude it. */
  amount: number;
  route: "all" | Route;
  flexibleIsaOnly: boolean;
  showBenchmarks: boolean;
  sort: "aer" | "yearOne";
}

export function isStale(p: Product, now: Date = new Date()): boolean {
  return now.getTime() - new Date(p.asOf).getTime() > RULES.staleAfterHours * 3_600_000;
}

/**
 * Interest in the first year on `amount`. Regular savers assume the full
 * monthly payment each month, so the average balance is 6.5 payments.
 */
export function yearOneInterest(p: Product, amount: number): number {
  if (p.monthlyCap) {
    const monthly = Math.min(p.monthlyCap, amount / 12);
    return (monthly * 78 * p.aer) / 100 / 12;
  }
  return (amount * p.aer) / 100;
}

export function fitsAmount(p: Product, amount: number): boolean {
  if (p.minDeposit && amount < p.minDeposit) return false;
  if (p.maxDeposit && amount > p.maxDeposit) return false;
  return true;
}

export function sameType(p: Product, category: Category, termYears?: number): boolean {
  if (p.category !== category) return false;
  if (category === "fixed" || category === "isa_fixed") return p.termYears === termYears;
  return true;
}

export function boardRows(products: Product[], f: BoardFilter): Product[] {
  return products
    .filter((p) => sameType(p, f.category, f.termYears))
    .filter((p) => f.showBenchmarks || !p.benchmark)
    .filter((p) => p.benchmark || f.route === "all" || p.route === f.route)
    .filter((p) => p.benchmark || !f.flexibleIsaOnly || p.flexibleIsa === true)
    .filter((p) => p.benchmark || fitsAmount(p, f.amount))
    .sort((a, b) =>
      f.sort === "yearOne"
        ? yearOneInterest(b, f.amount) - yearOneInterest(a, f.amount)
        : b.aer - a.aer,
    );
}
