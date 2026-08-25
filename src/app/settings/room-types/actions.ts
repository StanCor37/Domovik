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

export async function createRoomType(formData: FormData) {
  const name = requireString(formData, "name");
  const count = await prisma.roomType.count();

  await prisma.roomType.create({
    data: { name, sortOrder: count },
  });

  revalidatePath("/settings/room-types");
}

export async function renameRoomType(formData: FormData) {
  const id = requireString(formData, "id");
  const name = requireString(formData, "name");

  await prisma.roomType.update({
    where: { id },
    data: { name },
  });

  revalidatePath("/settings/room-types");
}

export async function deleteRoomType(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [roomCount, priceCount] = await Promise.all([
    prisma.room.count({ where: { roomTypeId: id } }),
    prisma.priceListEntry.count({ where: { roomTypeId: id } }),
  ]);
  if (roomCount > 0 || priceCount > 0) {
    return {
      ok: false,
      error: `Can't delete: ${roomCount} room(s) and ${priceCount} price list entr${priceCount === 1 ? "y" : "ies"} still use this room type. Reassign them first.`,
    };
  }

  await prisma.roomType.delete({ where: { id } });
  revalidatePath("/settings/room-types");
  return { ok: true };
}
