import type { TaxBand } from "../config/rules";

/** Product and holding categories from the spec's rate board. */
export type Category =
  | "easy"
  | "notice"
  | "regular"
  | "fixed"
  | "isa_easy"
  | "isa_notice"
  | "isa_fixed"
  | "hub"
  | "other";

export type Route = "direct" | "platform";

export interface Product {
  id: string;
  /** Brand as the saver sees it; mapped to a banking licence for FSCS. */
  brand: string;
  name: string;
  category: Category;
  /** Fixed products only: term in whole years (1 to 5). */
  termYears?: number;
  /** Headline AER including any bonus, in percent. */
  aer: number;
  /** Rate once a bonus ends, in percent. Present only for bonus-led deals. */
  baseAer?: number;
  /** Plain-English rule for when the bonus ends. Required when baseAer is set. */
  bonusEnds?: string;
  minDeposit?: number;
  maxDeposit?: number;
  /** Regular savers: maximum monthly payment. */
  monthlyCap?: number;
  flexibleIsa?: boolean;
  newCustomerOnly?: boolean;
  route: Route;
  /** Platform name when route is "platform". */
  platform?: string;
  terms: string;
  /** Where the Open button leads (affiliate link in production). */
  url: string;
  /** Market averages are shown for context but never ranked or compared. */
  benchmark?: boolean;
  /** Timestamp of the feed record (ISO 8601). */
  asOf: string;
}

export interface Holding {
  id: string;
  provider: string;
  /** Banking licence; defaults from the brand table when known. */
  licence: string;
  product: string;
  category: Category;
  termYears?: number;
  balance: number;
  aer: number;
  opened?: string;
  maturity?: string;
  bonusEnd?: string;
  /** For platform hub cash: the platform name, used to find the hub bank. */
  platform?: string;
  source: "manual" | "openBanking";
  example?: boolean;
}

export type IsaType = "cash" | "ss" | "lisa" | "ifisa" | "junior";

export interface IsaEntry {
  id: string;
  /** Tax year label, e.g. "2026/27". */
  taxYear: string;
  provider: string;
  type: IsaType;
  /** Positive amount in pounds. */
  amount: number;
  /** "payment" uses allowance; "withdrawal" from a flexible ISA can be replaced. */
  kind: "payment" | "withdrawal";
  /** Transfers between providers are recorded but never use allowance. */
  transfer?: boolean;
  /** Withdrawals only: whether the ISA is flexible. */
  flexible?: boolean;
  /** Junior ISAs: which child the payment is for. */
  child?: string;
  date?: string;
  example?: boolean;
}

export type ReminderType = "maturity" | "bonus" | "isa" | "boe" | "tax";

export interface Reminder {
  id: string;
  type: ReminderType;
  date: string;
  title: string;
  detail: string;
  holdingId?: string;
}

export interface Profile {
  email?: string;
  band: TaxBand;
  onboarded: boolean;
}

export interface ReminderSettings {
  enabled: Record<ReminderType, boolean>;
  /** Reminder id → ISO date until which it is snoozed. */
  snoozed: Record<string, string>;
  /** Keys of notifications already shown, "reminderId@leadDays". */
  notified: string[];
}

export interface ComparisonSettings {
  excludeNewCustomer: boolean;
  excludeBonus: boolean;
}

export interface AppState {
  version: 1;
  profile: Profile;
  holdings: Holding[];
  isa: IsaEntry[];
  reminders: ReminderSettings;
  comparison: ComparisonSettings;
}
