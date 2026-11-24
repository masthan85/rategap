# Rategap (MVP)

A UK savings app that shows where a saver's cash is underpaid, tracks FSCS exposure per banking licence, maturities and the ISA allowance across every provider, and links out to open a better account. Built from the *Savings Hub product specification* (November 2026); Savings Hub was the working name.

## Run it

```bash
git clone https://github.com/masthan85/rategap && cd rategap
bun install        # npm install also works
bun run dev        # http://localhost:5173
bun run test       # acceptance tests from the spec
bun run build      # type-check and production build into dist/
```

## End-to-end tests and Playwright agents

```bash
bun run test:e2e   # Playwright, desktop and phone sizes; starts the dev server itself
```

`.mcp.json` registers two MCP servers: `playwright` (browser control) and `playwright-test` (used by the agents). The planner, generator and healer agents in `.claude/agents/` write plans to `specs/` and tests to `tests/`, each starting from `seed.spec.ts`. The `playwright-cli` skill is in `.claude/skills/`. Claude Code asks you to approve the project MCP servers the first time you open the repo.

## What the MVP covers

| Spec feature | Where |
| --- | --- |
| Rate board: categories, amount, route and flexible-ISA filters, sort by AER or year-one interest, stale flag after 24 hours, bonus end conditions | `src/pages/Rates.tsx`, `src/lib/rates.ts` |
| Rate gap: balance × (best AER − current AER), rounded, never negative; fixed holdings compared at maturity; new-customer and bonus deals can be excluded | `src/lib/gap.ts` |
| FSCS exposure grouped by banking licence, warning at 85%, unprotected amount, platform hub cash against the hub bank | `src/lib/fscs.ts`, `src/data/licences.ts` |
| ISA allowance: £20,000 overall, £4,000 Lifetime ISA, £9,000 Junior ISA per child, transfers excluded, flexible withdrawals netted, warnings that never block | `src/lib/isa.ts`, `src/pages/Isas.tsx` |
| Fixed-term ladder: 2 to 5 rungs, best rate per term, different licence where £120,000 would be passed | `src/lib/ladder.ts` |
| Reminders: maturities, bonus ends, ISA year end, Bank of England decisions, tax changes; 14 and 2 days before; snooze and per-type switch-off; .ics export | `src/lib/reminders.ts`, `src/lib/ics.ts`, `src/pages/Alerts.tsx` |
| Savings tax estimate now and from April 2027 | `src/lib/tax.ts` |
| Onboarding, five tabs, Open interstitial (fee, not advice, confirm the rate) | `src/pages/*`, `src/components/` |

Tax, ISA, FSCS and reminder rules live in `src/config/rules.ts` so a Budget change is a config edit, not a release.

## Not yet production

- **Rate data is a snapshot** (17–20 November 2026) in `src/data/products.ts`. The licensed Moneyfacts or Defaqto feed plugs in behind `RateFeed` in `src/lib/feed.ts`. There are no 3- to 5-year or notice products in the snapshot.
- **Data stays in the browser** (localStorage). The `Repository` in `src/store/store.tsx` is the seam for a per-user, encrypted-at-rest backend and real sign-up; the email captured at onboarding is stored locally only.
- **Notifications** show when the app is opened (in-app and via the browser Notification API). True push needs the mobile app or a service worker with a server.
- **Licence table**: entries marked `verified: false` (app ISAs, platforms, hub banks) must be checked against the PRA register before launch.
- **Compliance**: the April 2027 savings tax rates (24/44/49%) and other figures come from the prototype's research and need sign-off, alongside the lawyer review of wording the spec calls for.
- Open Banking (release 2) and in-app opening (release 3) are shown as coming later.
