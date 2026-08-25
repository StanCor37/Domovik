import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings" };

const sections = [
  {
    href: "/settings/property",
    title: "Property",
    description: "Name, contact, currency, timezone, season dates.",
  },
  {
    href: "/settings/rooms",
    title: "Rooms",
    description: "Manage the room list, bed counts, and availability.",
  },
  {
    href: "/settings/room-types",
    title: "Room Types",
    description: "Categories like Single, Double, Suite — scopes the Price List.",
  },
  {
    href: "/settings/packages",
    title: "Packages",
    description: "Configurable board options (Full Board, Half Board, ...).",
  },
  {
    href: "/settings/smena",
    title: "Season & Smena",
    description: "Configure the recurring smena pattern and periods.",
  },
  {
    href: "/settings/price-list",
    title: "Price List",
    description: "Per-day pricing by product and room type — grid entry or Excel import.",
  },
  {
    href: "/settings/tax",
    title: "Tax",
    description: "Local tax rates per occupied night, by guest tax category.",
  },
  {
    href: "/settings/payment-methods",
    title: "Payment Methods",
    description: "The methods offered when logging a payment.",
  },
  {
    href: "/settings/users",
    title: "Users",
    description: "Staff accounts that can log in.",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            <h2 className="font-medium">{section.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
