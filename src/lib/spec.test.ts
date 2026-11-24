import { describe, expect, it } from "vitest";
import { SNAPSHOT_PRODUCTS } from "../data/products";
import { lookupLicence } from "../data/licences";
import { RULES, savingsTaxRatesOn } from "../config/rules";
import { annualGap, missedInterestNow, rateGap } from "./gap";
import { boardRows, isStale, yearOneInterest } from "./rates";
import { fscsExposure, licenceFor } from "./fscs";
import { checkEntry, isaUsage } from "./isa";
import { compoundInterest, planLadder, splitAmount } from "./ladder";
import { buildReminders, dueNotifications } from "./reminders";
import { buildIcs } from "./ics";
import { savingsTax } from "./tax";
import { taxYearOf } from "./dates";
import type { Holding, IsaEntry, ReminderSettings } from "./types";

const NO_EXCLUSIONS = { excludeNewCustomer: false, excludeBonus: false };
const h = (over: Partial<Holding>): Holding => ({
  id: "h1", provider: "HSBC", licence: "", product: "Flexible Saver", category: "easy",
  balance: 10_000, aer: 1.1, source: "manual", ...over,
});

describe("rate board", () => {
  it("every bonus-led product states when its bonus ends", () => {
    for (const p of SNAPSHOT_PRODUCTS.filter((p) => p.baseAer !== undefined)) {
      expect(p.bonusEnds, p.id).toBeTruthy();
    }
  });
  it("marks products older than 24 hours as stale", () => {
    const p = { ...SNAPSHOT_PRODUCTS[0], asOf: "2026-11-20T08:00:00Z" };
    expect(isStale(p, new Date("2026-11-21T07:59:00Z"))).toBe(false);
    expect(isStale(p, new Date("2026-11-21T08:01:00Z"))).toBe(true);
  });
  it("filters by amount and sorts by year-one interest", () => {
    const rows = boardRows(SNAPSHOT_PRODUCTS, {
      category: "fixed", termYears: 1, amount: 5_000, route: "all",
      flexibleIsaOnly: false, showBenchmarks: false, sort: "yearOne",
    });
    expect(rows.find((r) => r.id === "flagstone-fixed1")).toBeUndefined(); // £10,000 minimum
    expect(rows[0].id).toBe("mf-fixed1-top");
  });
  it("caps regular saver interest at the monthly limit", () => {
    const chase = SNAPSHOT_PRODUCTS.find((p) => p.id === "chase-regular")!;
    expect(Math.round(yearOneInterest(chase, 100_000))).toBe(Math.round((300 * 78 * 6.5) / 1200));
  });
});

describe("rate gap", () => {
  it("is balance × (best − current), rounded to the pound, never negative", () => {
    expect(annualGap(10_000, 4.89, 1.1)).toBe(379);
    expect(annualGap(12_345, 4.0, 3.333)).toBe(82);
    expect(annualGap(10_000, 3, 5)).toBe(0);
  });
  it("matches the spec's example: about £380 a year lost per £10,000 at HSBC", () => {
    const g = rateGap(h({}), SNAPSHOT_PRODUCTS, NO_EXCLUSIONS)!;
    expect(g.best.id).toBe("mf-easy-top");
    expect(g.annual).toBe(379);
    expect(g.timing).toBe("now");
  });
  it("can exclude new-customer-only and bonus-led deals", () => {
    const g = rateGap(h({}), SNAPSHOT_PRODUCTS, { excludeNewCustomer: true, excludeBonus: true })!;
    expect(g.best.newCustomerOnly).toBeFalsy();
    expect(g.best.baseAer).toBeUndefined();
  });
  it("compares fixed holdings with the same term, at maturity", () => {
    const g = rateGap(h({ category: "fixed", termYears: 2, aer: 4.6, balance: 15_000 }), SNAPSHOT_PRODUCTS, NO_EXCLUSIONS)!;
    expect(g.best.termYears).toBe(2);
    expect(g.timing).toBe("atMaturity");
  });
  it("respects product minimums", () => {
    const g = rateGap(h({ category: "fixed", termYears: 1, balance: 1_500, aer: 4 }), SNAPSHOT_PRODUCTS, NO_EXCLUSIONS)!;
    expect(g.best.minDeposit ?? 0).toBeLessThanOrEqual(1_500);
  });
  it("totals only variable accounts as missed now", () => {
    const total = missedInterestNow(
      [h({}), h({ id: "f", category: "fixed", termYears: 1, aer: 1 })],
      SNAPSHOT_PRODUCTS,
      NO_EXCLUSIONS,
    );
    expect(total).toBe(379);
  });
});

describe("FSCS exposure", () => {
  it("maps every brand in the rate feed to a licence entry", () => {
    for (const p of SNAPSHOT_PRODUCTS) expect(lookupLicence(p.brand), p.brand).toBeDefined();
  });
  it("groups brands sharing a licence and warns at 85%", () => {
    const ex = fscsExposure([
      h({ id: "a", provider: "Halifax", balance: 60_000 }),
      h({ id: "b", provider: "Bank of Scotland", balance: 45_000 }),
    ]);
    expect(ex).toHaveLength(1);
    expect(ex[0].licence).toBe("Bank of Scotland plc");
    expect(ex[0].status).toBe("warn");
  });
  it("shows the unprotected amount above £120,000", () => {
    const [e] = fscsExposure([h({ balance: 130_000 })]);
    expect(e.status).toBe("over");
    expect(e.unprotected).toBe(10_000);
  });
  it("counts platform hub cash against the hub bank", () => {
    expect(licenceFor({ provider: "Flagstone", licence: "", category: "hub", platform: "Flagstone" }).licence).toBe("HSBC UK Bank plc");
    const ex = fscsExposure([
      h({ id: "a", balance: 100_000 }),
      h({ id: "b", provider: "Flagstone", category: "hub", platform: "Flagstone", balance: 25_000 }),
    ]);
    expect(ex[0].total).toBe(125_000);
  });
  it("does not pool apps whose partner bank is unknown", () => {
    const ex = fscsExposure([h({ id: "a", provider: "Chip" }), h({ id: "b", provider: "Plum" })]);
    expect(ex).toHaveLength(2);
    expect(ex.every((e) => !e.confirmed)).toBe(true);
  });
});

describe("ISA allowance", () => {
  const e = (over: Partial<IsaEntry>): IsaEntry => ({
    id: Math.random().toString(), taxYear: "2026/27", provider: "X", type: "cash", amount: 0, kind: "payment", ...over,
  });
  it("runs 6 April to 5 April", () => {
    expect(taxYearOf("2026-04-05").label).toBe("2025/26");
    expect(taxYearOf("2026-04-06").label).toBe("2026/27");
    expect(taxYearOf("2026-11-21").end).toBe("2027-04-05");
  });
  it("excludes transfers and nets flexible withdrawals", () => {
    const u = isaUsage([
      e({ amount: 15_000 }),
      e({ amount: 50_000, transfer: true }),
      e({ amount: 5_000, kind: "withdrawal", flexible: true }),
      e({ amount: 2_000, kind: "withdrawal", flexible: false }),
    ], "2026/27");
    expect(u.used).toBe(10_000);
    expect(u.transfers).toBe(50_000);
  });
  it("tracks Junior ISAs per child outside the overall allowance", () => {
    const u = isaUsage([e({ type: "junior", child: "Amy", amount: 9_000 }), e({ amount: 20_000 })], "2026/27");
    expect(u.junior.Amy).toBe(9_000);
    expect(u.used).toBe(20_000);
  });
  it("warns, without blocking, when an entry would exceed a limit", () => {
    const existing = [e({ amount: 18_000 }), e({ type: "lisa", amount: 1_000 })];
    expect(checkEntry(existing, e({ amount: 1_000 }))).toHaveLength(0);
    expect(checkEntry(existing, e({ amount: 2_000 }))[0]).toMatch(/over the £20,000/);
    expect(checkEntry(existing, e({ type: "lisa", amount: 3_500 })).length).toBe(2);
    expect(checkEntry([], e({ type: "junior", child: "Sam", amount: 9_001 }))[0]).toMatch(/Junior/);
  });
  it("holds the limits in configuration", () => {
    expect(RULES.isa).toMatchObject({ overall: 20_000, lifetime: 4_000, junior: 9_000 });
  });
});

describe("fixed-term ladder", () => {
  it("uses amount × ((1 + AER)^years − 1)", () => {
    expect(compoundInterest(10_000, 5, 2)).toBeCloseTo(1_025, 6);
  });
  it("splits the lump sum and keeps the remainder in the last rung", () => {
    expect(splitAmount(10_000, 3)).toEqual([3_333, 3_333, 3_334]);
  });
  it("matures rungs a year apart, using the best rate per term", () => {
    const rungs = planLadder({ total: 30_000, rungs: 3, start: "2026-11-21", isa: false, manualRates: { 3: 4.5 } }, SNAPSHOT_PRODUCTS, []);
    expect(rungs.map((r) => r.maturity)).toEqual(["2027-11-21", "2028-11-21", "2029-11-21"]);
    expect(rungs[0].product?.id).toBe("mf-fixed1-top");
    expect(rungs[1].product?.id).toBe("hsbc-fixed2");
    expect(rungs[2].product).toBeNull();
    expect(rungs[2].aer).toBe(4.5);
  });
  it("moves a rung to another licence when the existing balance would pass £120,000", () => {
    const rungs = planLadder(
      { total: 40_000, rungs: 2, start: "2026-11-21", isa: true, manualRates: {} },
      SNAPSHOT_PRODUCTS,
      [h({ provider: "Kent Reliance", balance: 110_000 })],
    );
    expect(rungs[0].product?.brand).not.toBe("Kent Reliance");
    expect(rungs[0].movedForFscs).toBe(true);
    expect(rungs[1].product?.brand).toBe("Hinckley & Rugby BS");
    expect(rungs[1].movedForFscs).toBe(false); // ties with Kent Reliance at 5.20% and already ranks first
  });
});

describe("reminders", () => {
  const settings: ReminderSettings = {
    enabled: { maturity: true, bonus: true, isa: true, boe: true, tax: true }, snoozed: {}, notified: [],
  };
  it("creates a reminder for every holding with a date", () => {
    const hs = [h({ id: "a", maturity: "2027-03-01" }), h({ id: "b", bonusEnd: "2027-06-01" }), h({ id: "c" })];
    const rs = buildReminders(hs, "2026-11-21");
    expect(rs.filter((r) => r.holdingId === "a")).toHaveLength(1);
    expect(rs.filter((r) => r.holdingId === "b")).toHaveLength(1);
    expect(rs.some((r) => r.type === "isa" && r.date === "2027-04-05")).toBe(true);
  });
  it("notifies 14 and 2 days before, and respects snooze and switch-off", () => {
    const rs = buildReminders([h({ id: "a", maturity: "2026-12-05" })], "2026-11-21");
    const m = rs.find((r) => r.type === "maturity")!;
    expect(dueNotifications([m], settings, "2026-11-20")).toHaveLength(0);
    expect(dueNotifications([m], settings, "2026-11-21")[0].leadDays).toBe(14);
    expect(dueNotifications([m], settings, "2026-12-03")[0].leadDays).toBe(2);
    expect(dueNotifications([m], { ...settings, snoozed: { [m.id]: "2026-12-04" } }, "2026-12-03")).toHaveLength(0);
    expect(dueNotifications([m], { ...settings, enabled: { ...settings.enabled, maturity: false } }, "2026-12-03")).toHaveLength(0);
    expect(dueNotifications([m], { ...settings, notified: [`${m.id}@14`] }, "2026-11-22")).toHaveLength(0);
  });
  it("exports a valid calendar file with two alarms per event", () => {
    const ics = buildIcs(buildReminders([h({ maturity: "2027-03-01" })], "2026-11-21"), new Date("2026-11-21T10:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20270301");
    expect(ics).toContain("TRIGGER:-P14D");
    expect(ics).toContain("TRIGGER:-P2D");
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
});

describe("savings tax", () => {
  it("uses today's rates and the April 2027 rates", () => {
    expect(savingsTaxRatesOn("2027-04-05").basic).toBe(20);
    expect(savingsTaxRatesOn("2027-04-06").basic).toBe(24);
    const t = savingsTax([h({ balance: 50_000, aer: 4 }), h({ id: "i", category: "isa_easy", balance: 20_000, aer: 5 })], "basic", "2026-11-21");
    expect(t.interest).toBe(2_000);
    expect(t.taxable).toBe(1_000);
    expect(t.taxNow).toBe(200);
    expect(t.change?.tax).toBe(240);
  });
});
