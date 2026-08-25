import { PRICE_CATEGORY_MULTIPLIERS, type PriceCategory, type TaxCategory } from "@/lib/guestCategories";

/** Occupied nights for a stay: checkIn inclusive, checkOut exclusive (hotel-night logic). */
export function getOccupiedNights(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  for (
    let d = new Date(checkIn);
    d < checkOut;
    d = new Date(d.getTime() + 86400000)
  ) {
    nights.push(new Date(d));
  }
  return nights;
}

export type PriceBreakdownNight = {
  iso: string;
  nightlyAdultPrice: number | null;
  nightTotal: number;
};

export type PriceBreakdown = {
  nights: PriceBreakdownNight[];
  baseAmount: number;
  missingPriceDates: string[];
};

/**
 * Sums, per night, (nightly adult price for the product) x (per-guest price
 * multiplier), across all guests. Nights with no Price List entry contribute
 * 0 to baseAmount and are reported in missingPriceDates so the caller can
 * flag them rather than silently pricing as free.
 */
export function computeBaseAmount(params: {
  nights: Date[];
  priceByIso: Map<string, number>;
  guests: { priceCategory: PriceCategory }[];
  isoOf: (d: Date) => string;
}): PriceBreakdown {
  const { nights, priceByIso, guests, isoOf } = params;
  const multiplierSum = guests.reduce(
    (sum, g) => sum + PRICE_CATEGORY_MULTIPLIERS[g.priceCategory],
    0
  );

  const missingPriceDates: string[] = [];
  const nightBreakdown: PriceBreakdownNight[] = nights.map((night) => {
    const iso = isoOf(night);
    const nightlyAdultPrice = priceByIso.get(iso) ?? null;
    if (nightlyAdultPrice === null) missingPriceDates.push(iso);
    const nightTotal = (nightlyAdultPrice ?? 0) * multiplierSum;
    return { iso, nightlyAdultPrice, nightTotal };
  });

  const baseAmount = nightBreakdown.reduce((sum, n) => sum + n.nightTotal, 0);
  return { nights: nightBreakdown, baseAmount, missingPriceDates };
}

export type TaxRates = {
  ADULT: number;
  CHILD_7_14: number;
  OTHER_CHILD: number;
};

export function computeTaxAmount(params: {
  nightCount: number;
  guests: { taxCategory: TaxCategory }[];
  taxRates: TaxRates;
}): number {
  const { nightCount, guests, taxRates } = params;
  const perNightRateSum = guests.reduce(
    (sum, g) => sum + taxRates[g.taxCategory],
    0
  );
  return nightCount * perNightRateSum;
}
