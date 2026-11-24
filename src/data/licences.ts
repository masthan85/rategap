/**
 * Brand-to-banking-licence table. FSCS protection is £120,000 per person per
 * licence, so brands sharing a licence share one limit.
 *
 * "verified: false" marks entries that still need checking against the PRA's
 * register and the FSCS protection checker before launch. The table is
 * reviewed monthly (see LICENCE_TABLE_REVIEWED).
 */
export interface LicenceEntry {
  licence: string;
  verified: boolean;
  note?: string;
}

export const LICENCE_TABLE_REVIEWED = "2026-11-20";

export const PARTNER_PANEL = "Partner bank (named at opening)";
export const VARIES = "Varies by provider";

const TABLE: Record<string, LicenceEntry> = {
  hsbc: { licence: "HSBC UK Bank plc", verified: true },
  "first direct": { licence: "HSBC UK Bank plc", verified: true },
  "chase uk": { licence: "J.P. Morgan Europe Limited", verified: true },
  chase: { licence: "J.P. Morgan Europe Limited", verified: true },
  "kent reliance": { licence: "OneSavings Bank plc", verified: true },
  "hinckley & rugby bs": { licence: "Hinckley & Rugby Building Society", verified: true },
  barclays: { licence: "Barclays Bank UK PLC", verified: true },
  lloyds: { licence: "Lloyds Bank plc", verified: true },
  halifax: { licence: "Bank of Scotland plc", verified: true },
  "bank of scotland": { licence: "Bank of Scotland plc", verified: true },
  "intelligent finance": { licence: "Bank of Scotland plc", verified: true },
  natwest: { licence: "National Westminster Bank Plc", verified: true },
  "royal bank of scotland": { licence: "The Royal Bank of Scotland plc", verified: true },
  santander: { licence: "Santander UK plc", verified: true },
  cahoot: { licence: "Santander UK plc", verified: true },
  nationwide: { licence: "Nationwide Building Society", verified: true },
  marcus: { licence: "Goldman Sachs International Bank", verified: true },
  monzo: { licence: "Monzo Bank Ltd", verified: true },
  starling: { licence: "Starling Bank Limited", verified: true },

  // Apps and platforms that place money with partner banks.
  "trading 212": { licence: PARTNER_PANEL, verified: false, note: "Cash held with partner banks; check which" },
  chip: { licence: PARTNER_PANEL, verified: false, note: "Cash held with partner banks; check which" },
  moneybox: { licence: PARTNER_PANEL, verified: false, note: "Cash held with partner banks; check which" },
  plum: { licence: PARTNER_PANEL, verified: false, note: "Cash held with partner banks; check which" },
  prosper: { licence: PARTNER_PANEL, verified: false },
  flagstone: { licence: PARTNER_PANEL, verified: false },
  "raisin uk": { licence: PARTNER_PANEL, verified: false },

  // Feed placeholders.
  "moneyfacts best buy": { licence: VARIES, verified: false },
  "market average": { licence: VARIES, verified: false, note: "Benchmark, not a product" },
};

/** Banks holding uninvested cash in each platform's hub account. */
export const PLATFORM_HUB_BANKS: Record<string, LicenceEntry> = {
  "raisin uk": { licence: "ClearBank Limited", verified: false },
  flagstone: { licence: "HSBC UK Bank plc", verified: false },
  "hargreaves lansdown": { licence: "Barclays Bank UK PLC", verified: false },
};

const key = (s: string) => s.trim().toLowerCase();

export function lookupLicence(brand: string): LicenceEntry | undefined {
  return TABLE[key(brand)];
}

export function lookupHubBank(platform: string): LicenceEntry | undefined {
  return PLATFORM_HUB_BANKS[key(platform)];
}

export function knownBrands(): string[] {
  return Object.keys(TABLE);
}

export const PLATFORM_NAMES = ["Raisin UK", "Flagstone", "Hargreaves Lansdown"];
