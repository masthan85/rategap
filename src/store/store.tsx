import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { snapshotFeed } from "../lib/feed";
import { addMonths, taxYearOf, todayIso } from "../lib/dates";
import { uid } from "../lib/format";
import type { AppState, Holding, IsaEntry, Product } from "../lib/types";

/**
 * Local-first store. The MVP keeps each saver's data in their own browser;
 * the Repository seam below is where the per-user, encrypted-at-rest backend
 * plugs in.
 */
interface Repository {
  load(): AppState | null;
  save(s: AppState): void;
  clear(): void;
}

const KEY = "rategap.state.v1";
/** Data saved before the rename to Rategap; read once, then saved under KEY. */
const LEGACY_KEY = "savingsHub.state.v1";
const localRepo: Repository = {
  load() {
    try {
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as AppState;
      return s && s.version === 1 && Array.isArray(s.holdings) ? s : null;
    } catch {
      return null;
    }
  },
  save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage blocked: keep working in memory */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  },
};

export function emptyState(): AppState {
  return {
    version: 1,
    profile: { band: "basic", onboarded: false },
    holdings: [],
    isa: [],
    reminders: {
      enabled: { maturity: true, bonus: true, isa: true, boe: true, tax: true },
      snoozed: {},
      notified: [],
    },
    comparison: { excludeNewCustomer: false, excludeBonus: false },
  };
}

export function exampleHoldings(today: string): { holdings: Holding[]; isa: IsaEntry[] } {
  const ty = taxYearOf(today).label;
  return {
    holdings: [
      { id: uid(), provider: "HSBC", licence: "HSBC UK Bank plc", product: "Flexible Saver", category: "easy", balance: 25_000, aer: 1.1, source: "manual", example: true },
      { id: uid(), provider: "Chase UK", licence: "J.P. Morgan Europe Limited", product: "Chase Saver", category: "easy", balance: 8_000, aer: 2.5, source: "manual", example: true },
      { id: uid(), provider: "Moneybox", licence: "", product: "Cash ISA", category: "isa_easy", balance: 12_000, aer: 4.86, bonusEnd: addMonths(today, 7), source: "manual", example: true },
      { id: uid(), provider: "HSBC", licence: "HSBC UK Bank plc", product: "Fixed Rate Saver, 1 year", category: "fixed", termYears: 1, balance: 15_000, aer: 4.6, maturity: addMonths(today, 4), source: "manual", example: true },
    ],
    isa: [
      { id: uid(), taxYear: ty, provider: "Moneybox", type: "cash", amount: 12_000, kind: "payment", example: true },
      { id: uid(), taxYear: ty, provider: "Vanguard Investor", type: "ss", amount: 3_000, kind: "payment", example: true },
    ],
  };
}

interface Store {
  state: AppState;
  products: Product[];
  feedName: string;
  feedLive: boolean;
  today: string;
  update: (fn: (s: AppState) => AppState) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => localRepo.load() ?? emptyState());
  const [products, setProducts] = useState<Product[]>([]);
  const today = todayIso();

  useEffect(() => {
    snapshotFeed.load().then(setProducts);
  }, []);

  useEffect(() => {
    localRepo.save(state);
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);
  const reset = useCallback(() => {
    localRepo.clear();
    setState(emptyState());
  }, []);

  const value = useMemo(
    () => ({ state, products, feedName: snapshotFeed.name, feedLive: snapshotFeed.live, today, update, reset }),
    [state, products, today, update, reset],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
