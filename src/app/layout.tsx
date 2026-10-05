import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { getTheme } from "@/lib/theme";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import "./globals.css";

// MedConnect MASTER type: Carlito (Calibri metrics) for headings and body;
// Arimo backs up Arial for labels where Arial isn't installed.
const carlito = localFont({
  variable: "--font-carlito",
  src: [
    { path: "../fonts/carlito-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/carlito-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/carlito-700.woff2", weight: "700", style: "normal" },
  ],
});

const arimo = localFont({
  variable: "--font-arimo",
  src: [{ path: "../fonts/arimo-400.woff2", weight: "400", style: "normal" }],
});

export const metadata: Metadata = {
  title: { default: "Domovik", template: "%s · Domovik" },
  description: "Hotel occupancy & reservation management",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getTheme();
  return (
    <html
      lang="en"
      // "system" leaves the attribute off, so the CSS follows the OS setting.
      data-theme={theme === "system" ? undefined : theme}
      className={`${carlito.variable} ${arimo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-zinc-900">
        <header className="sticky top-0 z-[100] border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-6">
            <Link href="/" className="text-[22px] leading-none text-zinc-900">
              Domovik
            </Link>
            <NavLinks />
            <UserMenu />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
