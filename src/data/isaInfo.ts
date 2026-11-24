import type { Product } from "../lib/types";

/** ISA types for 2026/27, from the November 2026 research. */
export const ISA_TYPES: [string, string, string][] = [
  ["Cash ISA", "Up to £20,000", "The planned cut to £12,000 for under-65s was dropped at the 28 October 2026 Budget."],
  ["Stocks & shares ISA", "Up to £20,000", "Gains and dividends are tax-free. Your capital is at risk."],
  ["Lifetime ISA", "£4,000, inside the £20,000", "Open aged 18 to 39; the government adds 25%. Withdrawal penalties apply except for a first home or after 60."],
  ["Innovative Finance ISA", "Up to £20,000", "Peer-to-peer lending. Higher risk and not FSCS deposit-protected."],
  ["Junior ISA", "£9,000 per child", "A separate allowance for each child, not part of yours."],
];

const SNAP = "2026-11-20T08:00:00Z";
const ss = (id: string, brand: string, fee: string, notes: string, url: string): Product & { fee: string } => ({
  id, brand, name: "Stocks & shares ISA", category: "other", aer: 0, route: "direct", terms: notes, url, asOf: SNAP, fee,
});

/** Stocks and shares ISA platforms; fees from 2026 comparisons. */
export const SS_PLATFORMS = [
  ss("t212-ss", "Trading 212", "£0", "0.15% FX fee; shares and ETFs", "https://www.trading212.com/"),
  ss("investengine-ss", "InvestEngine", "£0 (DIY)", "ETFs only", "https://investengine.com/"),
  ss("freetrade-ss", "Freetrade Basic", "£0", "0.99% FX fee", "https://freetrade.io/"),
  ss("vanguard-ss", "Vanguard Investor", "0.15% (min £4 a month, cap £375)", "Vanguard funds only", "https://www.vanguardinvestor.co.uk/"),
  ss("ajbell-ss", "AJ Bell", "0.25%", "Shares and ETF custody capped at £42", "https://www.ajbell.co.uk/"),
  ss("hl-ss", "Hargreaves Lansdown", "0.35%", "£6.95 share deal; £150 cap for shares in the ISA", "https://www.hl.co.uk/"),
  ss("ii-ss", "interactive investor", "£5.99 a month", "Flat fee, cheaper for large pots", "https://www.ii.co.uk/"),
];
