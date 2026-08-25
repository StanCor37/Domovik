export function parsePaymentMethods(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializePaymentMethods(methods: string[]): string {
  return methods.join(",");
}
