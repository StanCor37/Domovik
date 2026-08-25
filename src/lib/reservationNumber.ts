import type { Prisma } from "@prisma/client";

/** R-XXX/YY, sequential per the year the reservation is created (not the stay year). */
export async function generateReservationNumber(
  tx: Prisma.TransactionClient,
  year: number
): Promise<string> {
  const sequence = await tx.reservationSequence.upsert({
    where: { year },
    update: { lastNumber: { increment: 1 } },
    create: { year, lastNumber: 1 },
  });
  const yy = String(year).slice(-2);
  const xxx = String(sequence.lastNumber).padStart(3, "0");
  return `R-${xxx}/${yy}`;
}
