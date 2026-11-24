import type { Product } from "../lib/types";

/**
 * Snapshot of the rate board, 17–20 November 2026, taken from Moneyfacts,
 * Which? and provider sites for the prototype. In production this module is
 * replaced by the licensed Moneyfacts or Defaqto feed behind the RateFeed
 * interface (src/lib/feed.ts); no figure here is a live rate.
 */
const MF = "https://moneyfactscompare.co.uk/";
const HSBC = "https://www.hsbc.co.uk/savings/";
const CHASE = "https://www.chase.co.uk/gb/en/product/chase-saver-account/";
const SNAP = "2026-11-20T08:00:00Z";
const AVG = "2026-11-05T08:00:00Z";

export const SNAPSHOT_PRODUCTS: Product[] = [
  // Easy access
  { id: "mf-easy-top", brand: "Moneyfacts best buy", name: "Top easy access", category: "easy", aer: 4.89, route: "direct", terms: "Provider varies; check the current best buy", url: MF, asOf: SNAP },
  { id: "chase-saver-boost", brand: "Chase UK", name: "Chase Saver, boosted", category: "easy", aer: 4.75, baseAer: 2.5, bonusEnds: "12 months after opening, then the standard rate", newCustomerOnly: true, route: "direct", terms: "New customers who open within 31 days", url: CHASE, asOf: SNAP },
  { id: "hsbc-online-bonus", brand: "HSBC", name: "Online Bonus Saver", category: "easy", aer: 3.75, baseAer: 1.1, bonusEnds: "Any month with a withdrawal earns 1.10%", route: "direct", terms: "Bonus rate only in months with no withdrawals", url: HSBC, asOf: SNAP },
  { id: "chase-saver", brand: "Chase UK", name: "Chase Saver", category: "easy", aer: 2.5, route: "direct", terms: "Tracks 1.50 points below Bank Rate", url: CHASE, asOf: SNAP },
  { id: "hsbc-flexible", brand: "HSBC", name: "Flexible Saver", category: "easy", aer: 1.1, route: "direct", terms: "Standard variable rate", url: HSBC, asOf: SNAP },
  { id: "avg-easy", brand: "Market average", name: "Average easy access", category: "easy", aer: 2.54, route: "direct", terms: "Moneyfacts, early November 2026", url: MF, benchmark: true, asOf: AVG },

  // Notice
  { id: "avg-notice-isa", brand: "Market average", name: "Average notice ISA", category: "isa_notice", aer: 3.42, route: "direct", terms: "Moneyfacts, early November 2026", url: MF, benchmark: true, asOf: AVG },

  // Regular saver
  { id: "chase-regular", brand: "Chase UK", name: "Regular Saver", category: "regular", aer: 6.5, monthlyCap: 300, route: "direct", terms: "Fixed rate for 12 months; up to £300 a month", url: "https://www.chase.co.uk/gb/en/support/interest-rates-explained/our-savings-rates/", asOf: SNAP },

  // Fixed bonds
  { id: "mf-fixed1-top", brand: "Moneyfacts best buy", name: "Top 1-year fixed bond", category: "fixed", termYears: 1, aer: 5.21, route: "direct", terms: "Direct-only deal; provider varies", url: MF, asOf: SNAP },
  { id: "prosper-fixed1", brand: "Prosper", name: "Top 1-year fixed", category: "fixed", termYears: 1, aer: 5.2, route: "platform", platform: "Prosper", terms: "Introductory rate; partner bank named at opening", url: MF, asOf: SNAP },
  { id: "flagstone-fixed1", brand: "Flagstone", name: "Top 1-year fixed", category: "fixed", termYears: 1, aer: 5.13, minDeposit: 10_000, route: "platform", platform: "Flagstone", terms: "Introductory rate; £10,000 platform minimum", url: "https://www.flagstoneim.com/personal/how-it-works", asOf: SNAP },
  { id: "raisin-fixed1", brand: "Raisin UK", name: "Top 1-year fixed", category: "fixed", termYears: 1, aer: 5.07, route: "platform", platform: "Raisin UK", terms: "Reported by Which?, 30 October 2026", url: "https://www.raisin.com/en-gb/", asOf: "2026-10-30T08:00:00Z" },
  { id: "hsbc-fixed1", brand: "HSBC", name: "Fixed Rate Saver, 1 year", category: "fixed", termYears: 1, aer: 4.6, minDeposit: 2_000, route: "direct", terms: "£2,000 minimum", url: HSBC, asOf: SNAP },
  { id: "avg-fixed1", brand: "Market average", name: "Average 1-year fixed", category: "fixed", termYears: 1, aer: 4.51, route: "direct", terms: "Moneyfacts, early November 2026", url: MF, benchmark: true, asOf: AVG },
  { id: "hsbc-fixed2", brand: "HSBC", name: "Fixed Rate Saver, 2 years", category: "fixed", termYears: 2, aer: 5.0, minDeposit: 2_000, route: "direct", terms: "£2,000 minimum", url: HSBC, asOf: SNAP },

  // Easy-access cash ISAs
  { id: "t212-isa", brand: "Trading 212", name: "Cash ISA", category: "isa_easy", aer: 4.9, baseAer: 3.85, bonusEnds: "12 months after opening", flexibleIsa: true, route: "direct", terms: "No transfers in", url: "https://www.trading212.com/", asOf: SNAP },
  { id: "chip-isa", brand: "Chip", name: "Cash ISA", category: "isa_easy", aer: 4.87, baseAer: 3.81, bonusEnds: "12 months after opening", minDeposit: 1, route: "direct", terms: "£1 minimum; full transfers in only", url: "https://www.getchip.uk/", asOf: SNAP },
  { id: "moneybox-isa", brand: "Moneybox", name: "Cash ISA", category: "isa_easy", aer: 4.86, baseAer: 3.75, bonusEnds: "12 months after opening", flexibleIsa: false, minDeposit: 500, route: "direct", terms: "£500 minimum; lower rate after 3 or more withdrawals a year", url: "https://www.moneyboxapp.com/", asOf: SNAP },
  { id: "plum-isa", brand: "Plum", name: "Cash ISA", category: "isa_easy", aer: 4.85, baseAer: 2.57, bonusEnds: "12 months after opening", flexibleIsa: true, route: "direct", terms: "", url: "https://withplum.com/", asOf: SNAP },
  { id: "avg-isa-easy", brand: "Market average", name: "Average easy-access ISA", category: "isa_easy", aer: 2.76, route: "direct", terms: "Moneyfacts, early November 2026", url: MF, benchmark: true, asOf: AVG },

  // Fixed cash ISAs
  { id: "kr-isa-fixed1", brand: "Kent Reliance", name: "1-year fixed cash ISA", category: "isa_fixed", termYears: 1, aer: 5.06, minDeposit: 1_000, route: "direct", terms: "£1,000 minimum; direct only", url: "https://www.kentreliance.co.uk/", asOf: SNAP },
  { id: "hsbc-isa-fixed1", brand: "HSBC", name: "Fixed Rate Cash ISA (up to 13 months)", category: "isa_fixed", termYears: 1, aer: 4.4, route: "direct", terms: "", url: HSBC, asOf: SNAP },
  { id: "hrbs-isa-fixed2", brand: "Hinckley & Rugby BS", name: "2-year fixed cash ISA", category: "isa_fixed", termYears: 2, aer: 5.2, route: "direct", terms: "", url: "https://www.hrbs.co.uk/", asOf: SNAP },
  { id: "kr-isa-fixed2", brand: "Kent Reliance", name: "2-year fixed cash ISA", category: "isa_fixed", termYears: 2, aer: 5.2, route: "direct", terms: "", url: "https://www.kentreliance.co.uk/", asOf: SNAP },
];
