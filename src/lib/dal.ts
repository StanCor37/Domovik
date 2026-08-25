import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

export const verifySession = cache(async () => {
  const payload = await getSessionPayload();
  if (!payload?.userId) {
    redirect("/login");
  }
  return { userId: payload.userId as string };
});

export const getCurrentUser = cache(async () => {
  const payload = await getSessionPayload();
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { id: true, email: true, name: true },
  });
  return user;
});
