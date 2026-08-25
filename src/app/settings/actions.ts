"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const PROPERTY_ID = "singleton-property";
const SETTINGS_ID = "singleton";
const MONTH_DAY = /^\d{2}-\d{2}$/;

function requireString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function optionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

function requireMonthDay(formData: FormData, key: string): string {
  const value = requireString(formData, key);
  if (!MONTH_DAY.test(value)) {
    throw new Error(`${key} must be in MM-DD format`);
  }
  return value;
}

// --- Property ---

export async function updateProperty(formData: FormData) {
  const name = requireString(formData, "name");
  const contactInfo = optionalString(formData, "contactInfo");
  const currency = requireString(formData, "currency");
  const timezone = requireString(formData, "timezone");
  const seasonStartMonthDay = requireMonthDay(formData, "seasonStartMonthDay");
  const seasonEndMonthDay = requireMonthDay(formData, "seasonEndMonthDay");

  await prisma.property.upsert({
    where: { id: PROPERTY_ID },
    update: {
      name,
      contactInfo,
      currency,
      timezone,
      seasonStartMonthDay,
      seasonEndMonthDay,
    },
    create: {
      id: PROPERTY_ID,
      name,
      contactInfo,
      currency,
      timezone,
      seasonStartMonthDay,
      seasonEndMonthDay,
    },
  });

  revalidatePath("/settings/property");
}

// --- Rooms ---

export async function createRoom(formData: FormData) {
  const number = requireString(formData, "number");
  const roomTypeId = requireString(formData, "roomTypeId");
  const floor = optionalString(formData, "floor");
  const bedCount = Number(requireString(formData, "bedCount"));
  const extraBedCapacity = Number(formData.get("extraBedCapacity") ?? 0) || 0;
  const description = optionalString(formData, "description");

  await prisma.room.create({
    data: {
      number,
      roomTypeId,
      floor,
      bedCount,
      extraBedCapacity,
      description,
      // Business rule: room 37 defaults to not available for reservation.
      availableForReservation: number !== "37",
    },
  });

  revalidatePath("/settings/rooms");
}

export async function updateRoomType(formData: FormData) {
  const id = requireString(formData, "id");
  const roomTypeId = requireString(formData, "roomTypeId");

  await prisma.room.update({
    where: { id },
    data: { roomTypeId },
  });

  revalidatePath("/settings/rooms");
}

export async function updateRoom(formData: FormData) {
  const id = requireString(formData, "id");
  const number = requireString(formData, "number");
  const floor = optionalString(formData, "floor");
  const bedCount = Number(requireString(formData, "bedCount"));
  const extraBedCapacity = Number(formData.get("extraBedCapacity") ?? 0) || 0;
  const description = optionalString(formData, "description");

  await prisma.room.update({
    where: { id },
    data: { number, floor, bedCount, extraBedCapacity, description },
  });

  revalidatePath("/settings/rooms");
}

export async function toggleRoomActive(formData: FormData) {
  const id = requireString(formData, "id");
  const room = await prisma.room.findUniqueOrThrow({ where: { id } });
  await prisma.room.update({
    where: { id },
    data: { active: !room.active },
  });
  revalidatePath("/settings/rooms");
}

export async function toggleRoomAvailability(formData: FormData) {
  const id = requireString(formData, "id");
  const room = await prisma.room.findUniqueOrThrow({ where: { id } });
  await prisma.room.update({
    where: { id },
    data: { availableForReservation: !room.availableForReservation },
  });
  revalidatePath("/settings/rooms");
}

export async function deleteRoom(formData: FormData) {
  const id = requireString(formData, "id");
  await prisma.room.delete({ where: { id } });
  revalidatePath("/settings/rooms");
}

// --- Smena periods & pattern ---

export async function updateSmenaLength(formData: FormData) {
  const smenaLengthNights = Number(requireString(formData, "smenaLengthNights"));

  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: { smenaLengthNights },
    create: { id: SETTINGS_ID, smenaLengthNights },
  });

  revalidatePath("/settings/smena");
}

export async function createSmenaPeriod(formData: FormData) {
  const label = requireString(formData, "label");
  const startMonthDay = requireMonthDay(formData, "startMonthDay");
  const endMonthDay = requireMonthDay(formData, "endMonthDay");

  await prisma.smenaPeriod.create({
    data: { label, startMonthDay, endMonthDay },
  });

  revalidatePath("/settings/smena");
}

export async function updateSmenaPeriod(formData: FormData) {
  const id = requireString(formData, "id");
  const label = requireString(formData, "label");
  const startMonthDay = requireMonthDay(formData, "startMonthDay");
  const endMonthDay = requireMonthDay(formData, "endMonthDay");

  await prisma.smenaPeriod.update({
    where: { id },
    data: { label, startMonthDay, endMonthDay },
  });

  revalidatePath("/settings/smena");
}

export async function deleteSmenaPeriod(formData: FormData) {
  const id = requireString(formData, "id");
  await prisma.smenaPeriod.delete({ where: { id } });
  revalidatePath("/settings/smena");
}
