// Natural sort so room numbers like "2", "10", "37" order numerically
// instead of lexicographically ("10" before "2").
export function compareNatural(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
