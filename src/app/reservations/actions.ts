"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dateToIso, isoToDate } from "@/lib/season";
import { computeBaseAmount, computeTaxAmount, getOccupiedNights } from "@/lib/pricing";
import { isPriceCategory, isTaxCategory } from "@/lib/guestCategories";
import { OCCUPYING_STATUSES, RESERVATION_STATUSES, type ReservationStatus } from "@/lib/reservations";
import { generateReservationNumber } from "@/lib/reservationNumber";
import type {
  ConflictInfo,
  GuestInput,
  PaymentInput,
  PricePreviewInput,
  PricePreviewResult,
  ReservationDetail,
  ReservationInput,
  SaveReservationResult,
} from "./types";

const SETTINGS_ID = "singleton";

function validateGuests(guests: GuestInput[]) {
  if (guests.length === 0) throw new Error("At least one guest is required.");
  for (const g of guests) {
    if (!isPriceCategory(g.priceCategory)) {
      throw new Error(`Invalid price category: ${g.priceCategory}`);
    }
    if (!isTaxCategory(g.taxCategory)) {
      throw new Error(`Invalid tax category: ${g.taxCategory}`);
    }
  }
}

async function isValidPackageCode(code: string): Promise<boolean> {
  const pkg = await prisma.package.findUnique({ where: { code } });
  return pkg !== null;
}

async function loadPriceByIso(
  product: string,
  roomTypeId: string,
  nights: Date[]
): Promise<Map<string, number>> {
  if (nights.length === 0) return new Map();
  const rows = await prisma.priceListEntry.findMany({
    where: {
      product,
      roomTypeId,
      date: { gte: nights[0], lte: nights[nights.length - 1] },
    },
  });
  const map = new Map<string, number>();
  for (const row of rows) map.set(dateToIso(row.date), row.pricePerAdult);
  return map;
}

export async function previewPrice(
  input: PricePreviewInput
): Promise<PricePreviewResult> {
  if (!(await isValidPackageCode(input.product))) {
    throw new Error(`Invalid package: ${input.product}`);
  }
  validateGuests(input.guests);

  const checkIn = isoToDate(input.checkIn);
  const checkOut = isoToDate(input.checkOut);
  if (checkOut <= checkIn) {
    return { nightCount: 0, baseAmount: 0, taxAmount: 0, missingPriceDates: [] };
  }

  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
  if (!room) throw new Error("Room not found.");

  const nights = getOccupiedNights(checkIn, checkOut);
  const priceByIso = await loadPriceByIso(input.product, room.roomTypeId, nights);
  const { baseAmount, missingPriceDates } = computeBaseAmount({
    nights,
    priceByIso,
    guests: input.guests,
    isoOf: dateToIso,
  });

  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  const taxAmount = computeTaxAmount({
    nightCount: nights.length,
    guests: input.guests,
    taxRates: {
      ADULT: settings?.taxRateAdult ?? 1,
      CHILD_7_14: settings?.taxRateChild7to14 ?? 0.5,
      OTHER_CHILD: settings?.taxRateOtherChild ?? 0,
    },
  });

  return { nightCount: nights.length, baseAmount, taxAmount, missingPriceDates };
}

async function findConflict(params: {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  excludeReservationId?: string;
}) {
  return prisma.reservation.findFirst({
    where: {
      roomId: params.roomId,
      status: { in: OCCUPYING_STATUSES },
      id: params.excludeReservationId ? { not: params.excludeReservationId } : undefined,
      checkIn: { lt: params.checkOut },
      checkOut: { gt: params.checkIn },
    },
  });
}

function conflictInfo(reservation: {
  reservationNumber: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
}): ConflictInfo {
  return {
    reservationNumber: reservation.reservationNumber,
    guestName: reservation.guestName,
    checkIn: dateToIso(reservation.checkIn),
    checkOut: dateToIso(reservation.checkOut),
  };
}

async function validateAndPrice(input: ReservationInput) {
  if (!input.guestName.trim()) throw new Error("Guest name is required.");
  if (!(await isValidPackageCode(input.product))) {
    throw new Error(`Invalid package: ${input.product}`);
  }
  if (!RESERVATION_STATUSES.includes(input.status)) {
    throw new Error(`Invalid status: ${input.status}`);
  }
  validateGuests(input.guests);

  const checkIn = isoToDate(input.checkIn);
  const checkOut = isoToDate(input.checkOut);
  if (checkOut <= checkIn) throw new Error("Check-out must be after check-in.");

  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
  if (!room) throw new Error("Room not found.");

  const nights = getOccupiedNights(checkIn, checkOut);
  const priceByIso = await loadPriceByIso(input.product, room.roomTypeId, nights);
  const { baseAmount } = computeBaseAmount({
    nights,
    priceByIso,
    guests: input.guests,
    isoOf: dateToIso,
  });

  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  const taxAmount = computeTaxAmount({
    nightCount: nights.length,
    guests: input.guests,
    taxRates: {
      ADULT: settings?.taxRateAdult ?? 1,
      CHILD_7_14: settings?.taxRateChild7to14 ?? 0.5,
      OTHER_CHILD: settings?.taxRateOtherChild ?? 0,
    },
  });

  const finalAmount = input.finalAmountOverride ?? baseAmount - input.discountAmount;

  return { checkIn, checkOut, baseAmount, taxAmount, finalAmount };
}

export async function createReservation(
  input: ReservationInput
): Promise<SaveReservationResult> {
  try {
    const { checkIn, checkOut, baseAmount, taxAmount, finalAmount } =
      await validateAndPrice(input);

    const conflict = await findConflict({ roomId: input.roomId, checkIn, checkOut });
    if (conflict) {
      return { ok: false, error: "This room is already booked for one or more of these nights.", conflict: conflictInfo(conflict) };
    }

    const year = new Date().getFullYear();
    const result = await prisma.$transaction(async (tx) => {
      const reservationNumber = await generateReservationNumber(tx, year);
      return tx.reservation.create({
        data: {
          reservationNumber,
          roomId: input.roomId,
          guestName: input.guestName.trim(),
          guestContact: input.guestContact?.trim() || null,
          checkIn,
          checkOut,
          product: input.product,
          discountPercent: input.discountPercent,
          discountAmount: input.discountAmount,
          baseAmount,
          taxAmount,
          finalAmount,
          status: input.status,
          notes: input.notes?.trim() || null,
          guests: {
            create: input.guests.map((g) => ({
              priceCategory: g.priceCategory,
              taxCategory: g.taxCategory,
            })),
          },
        },
      });
    });

    revalidatePath("/calendar");
    return { ok: true, reservationId: result.id, reservationNumber: result.reservationNumber };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save reservation." };
  }
}

export async function updateReservation(
  id: string,
  input: ReservationInput
): Promise<SaveReservationResult> {
  try {
    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Reservation not found." };

    const { checkIn, checkOut, baseAmount, taxAmount, finalAmount } =
      await validateAndPrice(input);

    const conflict = await findConflict({
      roomId: input.roomId,
      checkIn,
      checkOut,
      excludeReservationId: id,
    });
    if (conflict) {
      return { ok: false, error: "This room is already booked for one or more of these nights.", conflict: conflictInfo(conflict) };
    }

    await prisma.$transaction([
      prisma.guest.deleteMany({ where: { reservationId: id } }),
      prisma.reservation.update({
        where: { id },
        data: {
          roomId: input.roomId,
          guestName: input.guestName.trim(),
          guestContact: input.guestContact?.trim() || null,
          checkIn,
          checkOut,
          product: input.product,
          discountPercent: input.discountPercent,
          discountAmount: input.discountAmount,
          baseAmount,
          taxAmount,
          finalAmount,
          status: input.status,
          notes: input.notes?.trim() || null,
          guests: {
            create: input.guests.map((g) => ({
              priceCategory: g.priceCategory,
              taxCategory: g.taxCategory,
            })),
          },
        },
      }),
    ]);

    revalidatePath("/calendar");
    return { ok: true, reservationId: id, reservationNumber: existing.reservationNumber };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save reservation." };
  }
}

export async function getReservation(id: string): Promise<ReservationDetail | null> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { guests: true, payments: { orderBy: { date: "asc" } } },
  });
  if (!reservation) return null;

  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    roomId: reservation.roomId,
    guestName: reservation.guestName,
    guestContact: reservation.guestContact,
    checkIn: dateToIso(reservation.checkIn),
    checkOut: dateToIso(reservation.checkOut),
    product: reservation.product as ReservationDetail["product"],
    guests: reservation.guests.map((g) => ({
      priceCategory: g.priceCategory as GuestInput["priceCategory"],
      taxCategory: g.taxCategory as GuestInput["taxCategory"],
    })),
    discountPercent: reservation.discountPercent,
    discountAmount: reservation.discountAmount,
    finalAmount: reservation.finalAmount,
    baseAmount: reservation.baseAmount,
    taxAmount: reservation.taxAmount,
    status: reservation.status as ReservationStatus,
    notes: reservation.notes,
    payments: reservation.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      date: dateToIso(p.date),
      note: p.note,
    })),
  };
}

// Cancellation never deletes the reservation — only changes status. The
// room frees up immediately since CANCELED is not an occupying status.
export async function cancelReservation(id: string): Promise<SaveReservationResult> {
  try {
    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELED" },
    });
    revalidatePath("/calendar");
    return { ok: true, reservationId: id, reservationNumber: reservation.reservationNumber };
  } catch {
    return { ok: false, error: "Failed to cancel reservation." };
  }
}

export async function addPayment(
  reservationId: string,
  input: PaymentInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!(input.amount > 0)) throw new Error("Payment amount must be greater than 0.");
    if (!input.method.trim()) throw new Error("Payment method is required.");

    await prisma.payment.create({
      data: {
        reservationId,
        amount: input.amount,
        method: input.method.trim(),
        date: isoToDate(input.date),
        note: input.note?.trim() || null,
      },
    });
    revalidatePath("/calendar");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to add payment." };
  }
}

export async function deletePayment(
  paymentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.payment.delete({ where: { id: paymentId } });
    revalidatePath("/calendar");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete payment." };
  }
}
