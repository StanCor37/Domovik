import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { updatePaymentMethods } from "./actions";

export const metadata: Metadata = { title: "Payment Methods" };

export default async function PaymentMethodsSettingsPage() {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Payment Methods
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Comma-separated list. These appear as options when logging a
          payment against a reservation.
        </p>
      </div>

      <form
        action={updatePaymentMethods}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Methods</span>
          <input
            name="paymentMethods"
            defaultValue={settings?.paymentMethods ?? "Cash,Card,Bank Transfer"}
            required
            className="input"
            placeholder="Cash,Card,Bank Transfer"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Save
        </button>
      </form>
    </div>
  );
}
