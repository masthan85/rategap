import { RULES } from "../config/rules";
import { lookupHubBank, lookupLicence, PARTNER_PANEL, VARIES } from "../data/licences";
import type { Holding } from "./types";

export interface LicenceExposure {
  licence: string;
  /** False when we could not confirm the licence, so the bar is per provider. */
  confirmed: boolean;
  total: number;
  holdings: Holding[];
  ratio: number;
  status: "ok" | "warn" | "over";
  unprotected: number;
}

const UNRESOLVED = new Set([PARTNER_PANEL, VARIES, ""]);

/** The banking licence a holding counts against. */
export function licenceFor(h: Pick<Holding, "provider" | "licence" | "category" | "platform">): {
  licence: string;
  confirmed: boolean;
} {
  if (h.category === "hub" && h.platform) {
    const hub = lookupHubBank(h.platform);
    if (hub) return { licence: hub.licence, confirmed: true };
  }
  const typed = (h.licence || "").trim();
  if (typed && !UNRESOLVED.has(typed)) return { licence: typed, confirmed: true };
  const known = lookupLicence(h.provider);
  if (known && !UNRESOLVED.has(known.licence)) return { licence: known.licence, confirmed: true };
  return { licence: `${h.provider.trim() || "Unknown"} (licence to confirm)`, confirmed: false };
}

export function fscsExposure(holdings: Holding[]): LicenceExposure[] {
  const groups = new Map<string, { confirmed: boolean; holdings: Holding[] }>();
  for (const h of holdings) {
    const { licence, confirmed } = licenceFor(h);
    const g = groups.get(licence) ?? { confirmed, holdings: [] };
    g.holdings.push(h);
    groups.set(licence, g);
  }
  const { limit, warnRatio } = RULES.fscs;
  return [...groups.entries()]
    .map(([licence, g]) => {
      const total = g.holdings.reduce((s, h) => s + Number(h.balance || 0), 0);
      const ratio = total / limit;
      return {
        licence,
        confirmed: g.confirmed,
        total,
        holdings: g.holdings,
        ratio,
        status: total > limit ? "over" : ratio >= warnRatio ? "warn" : "ok",
        unprotected: Math.max(0, total - limit),
      } satisfies LicenceExposure;
    })
    .sort((a, b) => b.total - a.total);
}

export function licenceTotals(holdings: Holding[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of fscsExposure(holdings)) m.set(e.licence, e.total);
  return m;
}
