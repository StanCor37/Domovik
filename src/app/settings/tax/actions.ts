"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const SETTINGS_ID = "singleton";

function requireNonNegativeNumber(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a non-negative number`);
  }
  return value;
}

export async function updateTaxRates(formData: FormData) {
  const taxRateAdult = requireNonNegativeNumber(formData, "taxRateAdult");
  const taxRateChild7to14 = requireNonNegativeNumber(formData, "taxRateChild7to14");
  const taxRateOtherChild = requireNonNegativeNumber(formData, "taxRateOtherChild");

  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: { taxRateAdult, taxRateChild7to14, taxRateOtherChild },
    create: { id: SETTINGS_ID, taxRateAdult, taxRateChild7to14, taxRateOtherChild },
  });

  revalidatePath("/settings/tax");
}
