/** "Stanislava Čajetinac" → "SČ"; a single word gives one letter. */
export function initialsOf(name: string, fallback = "?"): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toLocaleUpperCase();
}
