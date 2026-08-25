"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

function requireString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

export async function createUser(formData: FormData) {
  await verifySession();

  const name = requireString(formData, "name");
  const email = requireString(formData, "email").toLowerCase();
  const password = requireString(formData, "password");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });

  revalidatePath("/settings/users");
}

export async function deleteUser(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await verifySession();

  if (id === userId) {
    return { ok: false, error: "You can't delete your own account while logged in." };
  }

  const totalUsers = await prisma.user.count();
  if (totalUsers <= 1) {
    return { ok: false, error: "Can't delete the last remaining account." };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings/users");
  return { ok: true };
}
