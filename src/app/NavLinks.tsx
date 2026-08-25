"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/ledger", label: "Ledger" },
  { href: "/settings", label: "Settings" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              "border-b-2 pb-0.5 text-sm " +
              (isActive
                ? "border-accent font-medium text-zinc-950"
                : "border-transparent text-zinc-500 hover:text-zinc-950")
            }
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
