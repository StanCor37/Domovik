import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Button, Field, FormCard, PageTitle } from "@/components/ui";
import { updatePaymentMethods } from "./actions";

export const metadata: Metadata = { title: "Payment methods" };

export default async function PaymentMethodsSettingsPage() {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Payment methods"
        description="Comma-separated list. These appear as options when logging a payment against a reservation."
      />

      <FormCard action={updatePaymentMethods} maxWidth="max-w-md">
        <Field label="Methods">
          <input
            name="paymentMethods"
            defaultValue={settings?.paymentMethods ?? "Cash,Card,Bank Transfer"}
            required
            className="input"
            placeholder="Cash,Card,Bank Transfer"
          />
        </Field>
        <Button type="submit" className="self-start">
          Save
        </Button>
      </FormCard>
    </div>
  );
}
