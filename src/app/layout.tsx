import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Domovik", template: "%s · Domovik" },
  description: "Hotel occupancy & reservation management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="sticky top-0 z-[100] border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Domovik
            </Link>
            <NavLinks />
            <UserMenu />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
