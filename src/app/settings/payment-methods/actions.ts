"use server";

import { prisma } from "@/lib/prisma";
import { parsePaymentMethods, serializePaymentMethods } from "@/lib/paymentMethods";
import { revalidatePath } from "next/cache";

const SETTINGS_ID = "singleton";

export async function updatePaymentMethods(formData: FormData) {
  const raw = String(formData.get("paymentMethods") ?? "");
  const methods = parsePaymentMethods(raw);
  if (methods.length === 0) {
    throw new Error("At least one payment method is required.");
  }
  const paymentMethods = serializePaymentMethods(methods);

  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: { paymentMethods },
    create: { id: SETTINGS_ID, paymentMethods },
  });

  revalidatePath("/settings/payment-methods");
}
