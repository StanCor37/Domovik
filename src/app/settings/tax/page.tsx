import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { updateTaxRates } from "./actions";

export const metadata: Metadata = { title: "Tax" };

export default async function TaxSettingsPage() {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tax
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Local tax is calculated per occupied night, per guest, based on
          each guest&apos;s tax category (independent of their price
          category).
        </p>
      </div>

      <form
        action={updateTaxRates}
        className="flex max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <Field label="Adult — per night">
          <input
            name="taxRateAdult"
            type="number"
            step="0.01"
            min={0}
            defaultValue={settings?.taxRateAdult ?? 1}
            required
            className="input"
          />
        </Field>
        <Field label="Child (7-14) — per night">
          <input
            name="taxRateChild7to14"
            type="number"
            step="0.01"
            min={0}
            defaultValue={settings?.taxRateChild7to14 ?? 0.5}
            required
            className="input"
          />
        </Field>
        <Field label="Other child — per night">
          <input
            name="taxRateOtherChild"
            type="number"
            step="0.01"
            min={0}
            defaultValue={settings?.taxRateOtherChild ?? 0}
            required
            className="input"
          />
        </Field>
        <button type="submit" className="btn-primary self-start">
          Save
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
