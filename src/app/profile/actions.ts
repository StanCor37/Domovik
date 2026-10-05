"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";

export async function setTheme(theme: Theme) {
  if (!THEMES.includes(theme)) return;
  (await cookies()).set(THEME_COOKIE, theme, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

export type ChangePasswordState = { ok: true } | { ok: false; error: string } | undefined;

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const { userId } = await verifySession();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Your account could not be found. Sign in again." };

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { ok: false, error: "The current password is not correct." };
  }
  if (next.length < 8) {
    return { ok: false, error: "The new password needs at least 8 characters, for example a short sentence." };
  }
  if (next !== confirm) {
    return { ok: false, error: "The new passwords don't match. Type the same password in both fields." };
  }
  if (next === current) {
    return { ok: false, error: "The new password is the same as the current one. Choose a different one." };
  }

  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true };
}
