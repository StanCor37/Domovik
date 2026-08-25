"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function requireString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

export async function createPackage(formData: FormData) {
  const code = requireString(formData, "code").toUpperCase();
  const label = requireString(formData, "label");
  const count = await prisma.package.count();

  await prisma.package.create({
    data: { code, label, sortOrder: count },
  });

  revalidatePath("/settings/packages");
}

export async function renamePackage(formData: FormData) {
  const id = requireString(formData, "id");
  const label = requireString(formData, "label");

  await prisma.package.update({
    where: { id },
    data: { label },
  });

  revalidatePath("/settings/packages");
}

export async function deletePackage(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pkg = await prisma.package.findUniqueOrThrow({ where: { id } });

  const [reservationCount, priceCount] = await Promise.all([
    prisma.reservation.count({ where: { product: pkg.code } }),
    prisma.priceListEntry.count({ where: { product: pkg.code } }),
  ]);
  if (reservationCount > 0 || priceCount > 0) {
    return {
      ok: false,
      error: `Can't delete: ${reservationCount} reservation(s) and ${priceCount} price list entr${priceCount === 1 ? "y" : "ies"} still use "${pkg.code}".`,
    };
  }

  await prisma.package.delete({ where: { id } });
  revalidatePath("/settings/packages");
  return { ok: true };
}
