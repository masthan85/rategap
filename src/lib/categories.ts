import type { Category } from "./types";

export const CATEGORY_LABEL: Record<Category, string> = {
  easy: "Easy access",
  notice: "Notice account",
  regular: "Regular saver",
  fixed: "Fixed bond",
  isa_easy: "Easy-access cash ISA",
  isa_notice: "Notice cash ISA",
  isa_fixed: "Fixed cash ISA",
  hub: "Platform hub cash",
  other: "Other",
};

export const isIsaCategory = (c: Category) => c.startsWith("isa_");
export const isFixedCategory = (c: Category) => c === "fixed" || c === "isa_fixed";

export function categoryLabel(c: Category, termYears?: number): string {
  if (isFixedCategory(c) && termYears) {
    return c === "fixed" ? `${termYears}-year fixed bond` : `${termYears}-year fixed cash ISA`;
  }
  return CATEGORY_LABEL[c];
}

/** Rate board chips, in the order the spec lists them. */
export const BOARD_CHIPS: { id: string; label: string; category: Category; termYears?: number }[] = [
  { id: "easy", label: "Easy access", category: "easy" },
  { id: "notice", label: "Notice", category: "notice" },
  { id: "regular", label: "Regular saver", category: "regular" },
  ...[1, 2, 3, 4, 5].map((t) => ({ id: `fixed${t}`, label: `${t}-yr fixed`, category: "fixed" as Category, termYears: t })),
  { id: "isa_easy", label: "Cash ISA, easy", category: "isa_easy" },
  { id: "isa_notice", label: "Cash ISA, notice", category: "isa_notice" },
  ...[1, 2, 3, 4, 5].map((t) => ({ id: `isa_fixed${t}`, label: `Cash ISA, ${t}-yr`, category: "isa_fixed" as Category, termYears: t })),
];
