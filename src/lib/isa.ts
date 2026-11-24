import { RULES } from "../config/rules";
import type { IsaEntry, IsaType } from "./types";

export const ISA_TYPE_LABEL: Record<IsaType, string> = {
  cash: "Cash ISA",
  ss: "Stocks & shares ISA",
  lisa: "Lifetime ISA",
  ifisa: "Innovative Finance ISA",
  junior: "Junior ISA",
};

export interface IsaUsage {
  taxYear: string;
  byType: Record<Exclude<IsaType, "junior">, number>;
  /** Net subscriptions against the £20,000 overall allowance. */
  used: number;
  remaining: number;
  lifetime: number;
  lifetimeBonus: number;
  /** Junior ISA subscriptions per child, against each child's own allowance. */
  junior: Record<string, number>;
  transfers: number;
}

/**
 * Net subscriptions for a tax year. Transfers never count. Withdrawals from a
 * flexible ISA reduce the count, so money replaced in the same year is netted.
 * Withdrawals from a non-flexible ISA do not give allowance back.
 */
export function isaUsage(entries: IsaEntry[], taxYear: string): IsaUsage {
  const year = entries.filter((e) => e.taxYear === taxYear);
  const byType = { cash: 0, ss: 0, lisa: 0, ifisa: 0 };
  const junior: Record<string, number> = {};
  let transfers = 0;

  for (const e of year) {
    if (e.transfer) {
      transfers += e.amount;
      continue;
    }
    const sign = e.kind === "payment" ? 1 : e.flexible ? -1 : 0;
    if (e.type === "junior") {
      const child = e.child?.trim() || "Unnamed child";
      junior[child] = (junior[child] ?? 0) + sign * e.amount;
    } else {
      byType[e.type] += sign * e.amount;
    }
  }
  for (const k of Object.keys(byType) as (keyof typeof byType)[]) byType[k] = Math.max(0, byType[k]);
  for (const c of Object.keys(junior)) junior[c] = Math.max(0, junior[c]);

  const used = byType.cash + byType.ss + byType.lisa + byType.ifisa;
  return {
    taxYear,
    byType,
    used,
    remaining: RULES.isa.overall - used,
    lifetime: byType.lisa,
    lifetimeBonus: Math.min(byType.lisa, RULES.isa.lifetime) * RULES.isa.lifetimeBonusRate,
    junior,
    transfers,
  };
}

/**
 * Warnings for an entry before it is saved. Never blocks: the saver may know
 * something we don't, such as a payment already refunded.
 */
export function checkEntry(entries: IsaEntry[], candidate: IsaEntry): string[] {
  if (candidate.transfer || candidate.kind !== "payment") return [];
  const after = isaUsage([...entries, candidate], candidate.taxYear);
  const warnings: string[] = [];
  const { overall, lifetime, junior } = RULES.isa;

  if (candidate.type === "junior") {
    const child = candidate.child?.trim() || "Unnamed child";
    if ((after.junior[child] ?? 0) > junior) {
      warnings.push(
        `This takes ${child}'s Junior ISA to £${(after.junior[child] ?? 0).toLocaleString("en-GB")}, over the £${junior.toLocaleString("en-GB")} limit.`,
      );
    }
    return warnings;
  }
  if (after.used > overall) {
    warnings.push(
      `This takes your ISA payments to £${after.used.toLocaleString("en-GB")} for ${candidate.taxYear}, £${(after.used - overall).toLocaleString("en-GB")} over the £${overall.toLocaleString("en-GB")} allowance. HMRC may void the excess.`,
    );
  }
  if (candidate.type === "lisa" && after.lifetime > lifetime) {
    warnings.push(
      `Lifetime ISA payments would reach £${after.lifetime.toLocaleString("en-GB")}, over the £${lifetime.toLocaleString("en-GB")} limit. The bonus is paid only on the first £${lifetime.toLocaleString("en-GB")}.`,
    );
  }
  return warnings;
}
