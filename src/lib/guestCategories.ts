// Price-category multipliers are fixed by the confirmed spec (not configurable):
// adult 100% / child-70% 70% / child-50% 50% / free child 0%.
export const PRICE_CATEGORIES = ["ADULT", "CHILD_70", "CHILD_50", "FREE"] as const;
export type PriceCategory = (typeof PRICE_CATEGORIES)[number];

export const PRICE_CATEGORY_LABELS: Record<PriceCategory, string> = {
  ADULT: "Adult (100%)",
  CHILD_70: "Child (70%)",
  CHILD_50: "Child (50%)",
  FREE: "Free child (0%)",
};

export const PRICE_CATEGORY_MULTIPLIERS: Record<PriceCategory, number> = {
  ADULT: 1,
  CHILD_70: 0.7,
  CHILD_50: 0.5,
  FREE: 0,
};

// Tax category is age-based and tracked independently from price category
// (a guest's price category is "what the family requested", not their age).
export const TAX_CATEGORIES = ["ADULT", "CHILD_7_14", "OTHER_CHILD"] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  ADULT: "Adult",
  CHILD_7_14: "Child (7-14)",
  OTHER_CHILD: "Other child",
};

export function isPriceCategory(value: string): value is PriceCategory {
  return (PRICE_CATEGORIES as readonly string[]).includes(value);
}

export function isTaxCategory(value: string): value is TaxCategory {
  return (TAX_CATEGORIES as readonly string[]).includes(value);
}
