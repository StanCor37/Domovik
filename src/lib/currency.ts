const formatterCache = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currencyCode: string = "EUR"): string {
  let formatter = formatterCache.get(currencyCode);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    });
    formatterCache.set(currencyCode, formatter);
  }
  return formatter.format(amount);
}
