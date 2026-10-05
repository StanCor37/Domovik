import "server-only";

import { cookies } from "next/headers";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = "theme";

/** The colour theme chosen in this browser (Profile → Appearance). "system"
 * follows the OS setting via prefers-color-scheme. Kept in a cookie so the
 * server renders the right theme straight away, with no light flash. */
export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return (THEMES as readonly string[]).includes(value ?? "") ? (value as Theme) : "system";
}
