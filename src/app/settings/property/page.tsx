import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Button, Field, FormCard, PageTitle } from "@/components/ui";
import { updateProperty } from "../actions";

export const metadata: Metadata = { title: "Property" };

export default async function PropertySettingsPage() {
  const property = await prisma.property.findUnique({
    where: { id: "singleton-property" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Property"
        description="Season dates are recurring (month-day only) — they apply every year."
      />

      <FormCard action={updateProperty} maxWidth="max-w-lg">
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
        <Button type="submit" className="self-start">
          Save
        </Button>
      </FormCard>
    </div>
  );
}
