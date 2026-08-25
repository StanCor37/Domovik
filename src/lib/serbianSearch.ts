// Normalizes Serbian Latin diacritics so search is accent-insensitive:
// č/ć -> c, š -> s, ž -> z. đ is ambiguous — it's commonly transliterated
// either as the digraph "dj" (e.g. Đorđe -> Djordje) or as a bare "d"
// (naive diacritic stripping, since đ is literally "d" with a stroke).
// Both conventions are supported: djVariant picks which one this call uses.
function normalize(text: string, djVariant: "dj" | "d"): string {
  return text
    .toLowerCase()
    .replace(/đ/g, djVariant)
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z");
}

/**
 * True if `query` appears in `text`, ignoring case and Serbian Latin
 * diacritics, and matching either đ-transliteration convention.
 */
export function matchesSearch(text: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return (
    normalize(text, "dj").includes(normalize(q, "dj")) ||
    normalize(text, "d").includes(normalize(q, "d"))
  );
}
