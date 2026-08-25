import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { updateProperty } from "../actions";

export const metadata: Metadata = { title: "Property" };

export default async function PropertySettingsPage() {
  const property = await prisma.property.findUnique({
    where: { id: "singleton-property" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Property</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Season dates are recurring (month-day only) — they apply every year.
        </p>
      </div>

      <form
        action={updateProperty}
        className="flex max-w-lg flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <Field label="Name">
          <input
            name="name"
            defaultValue={property?.name ?? ""}
            required
            className="input"
          />
        </Field>
        <Field label="Contact info">
          <input
            name="contactInfo"
            defaultValue={property?.contactInfo ?? ""}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency">
            <input
              name="currency"
              defaultValue={property?.currency ?? "EUR"}
              required
              className="input"
            />
          </Field>
          <Field label="Timezone">
            <input
              name="timezone"
              defaultValue={property?.timezone ?? "Europe/Belgrade"}
              required
              className="input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Season start (MM-DD)">
            <input
              name="seasonStartMonthDay"
              defaultValue={property?.seasonStartMonthDay ?? "05-01"}
              pattern="\d{2}-\d{2}"
              placeholder="05-01"
              required
              className="input"
            />
          </Field>
          <Field label="Season end (MM-DD)">
            <input
              name="seasonEndMonthDay"
              defaultValue={property?.seasonEndMonthDay ?? "10-31"}
              pattern="\d{2}-\d{2}"
              placeholder="10-31"
              required
              className="input"
            />
          </Field>
        </div>
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
