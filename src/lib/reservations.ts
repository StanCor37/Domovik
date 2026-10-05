export const RESERVATION_STATUSES = [
  "PREBOOKED",
  "BOOKED",
  "CANCELED",
  "PARTIALLY_CANCELED",
  "COMPLETED",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

// Per the product plan: Prebooked, Booked, and (the remaining dates of a)
// Partially Canceled reservation occupy the calendar. Canceled/Completed don't.
export const OCCUPYING_STATUSES: ReservationStatus[] = [
  "PREBOOKED",
  "BOOKED",
  "PARTIALLY_CANCELED",
];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  PREBOOKED: "Prebooked",
  BOOKED: "Booked",
  CANCELED: "Canceled",
  PARTIALLY_CANCELED: "Partially canceled",
  COMPLETED: "Completed",
};

// Tailwind classes for the calendar block background per status. Prebooked
// and Booked carry the brand primary (a translucent wash vs. a solid
// gradient) instead of plain grayscale; the rest stay neutral. No per-cell
// borders: adjacent same-status day cells must stay visually seamless to
// read as one connected bar, see CalendarGrid.
//
// The gradient direction matters here: CalendarGrid renders one <div> per
// *day*, not one spanning element per reservation, relying on adjacent
// cells sitting flush to read as a single bar. A diagonal gradient
// (to-br) restarts its own top-left-to-bottom-right sweep inside every
// cell, which is invisible for a 1-night stay but tiles into an obvious
// sawtooth of seams for 3+ nights. A vertical gradient (to-b) has no
// horizontal component, so every cell (same height) paints an identical
// slice and the seam disappears regardless of how many nights a stay
// spans.
export const STATUS_BLOCK_CLASSES: Record<ReservationStatus, string> = {
  // Flat, opaque fills (MedConnect keeps gradients for the header band only).
  // Opaque also matters here: day pieces overlap by 1px to hide sub-pixel
  // seams, and a translucent fill would double up into a line per day.
  PREBOOKED: "bg-primary-soft text-primary font-medium",
  BOOKED: "bg-booked text-on-booked font-bold",
  CANCELED: "bg-zinc-50 text-zinc-400",
  PARTIALLY_CANCELED: "bg-zinc-300 text-zinc-900 font-medium",
  COMPLETED: "bg-zinc-100 text-zinc-500",
};

// StatusTag tone per status (ledger, dashboard). Prebooked = nothing paid
// yet, so it needs attention (warn); Booked is the normal state (info).
export const STATUS_TONES: Record<ReservationStatus, "success" | "warn" | "danger" | "info" | "secondary"> = {
  PREBOOKED: "warn",
  BOOKED: "info",
  CANCELED: "danger",
  PARTIALLY_CANCELED: "secondary",
  COMPLETED: "success",
};

// --- Payment-driven status -------------------------------------------------
// Prebooked = made but nothing paid yet; any payment makes it Booked (and
// removing every payment makes it Prebooked again). The other statuses are
// set by hand and never change on their own.
const PAYMENT_DRIVEN: ReservationStatus[] = ["PREBOOKED", "BOOKED"];

export function statusForPayments(status: ReservationStatus, paymentCount: number): ReservationStatus {
  if (!PAYMENT_DRIVEN.includes(status)) return status;
  return paymentCount > 0 ? "BOOKED" : "PREBOOKED";
}

export function isPaymentDriven(status: ReservationStatus): boolean {
  return PAYMENT_DRIVEN.includes(status);
}

// How much of the total due (final amount + tourist tax, as in the ledger's
// balance) the payments cover. A cent of tolerance absorbs float rounding.
export type PaymentState = "UNPAID" | "PARTIAL" | "PAID";

export function paymentStateOf(paid: number, totalDue: number): PaymentState {
  if (paid <= 0) return "UNPAID";
  return paid >= totalDue - 0.005 ? "PAID" : "PARTIAL";
}

// Calendar bar for a Booked stay that is fully paid — the success green, in
// the same flat treatment as partly paid Booked (navy).
const BOOKED_PAID_BLOCK_CLASSES = "bg-success text-on-primary font-bold";

export function calendarBlockClasses(status: ReservationStatus, paymentState: PaymentState): string {
  if (status === "BOOKED" && paymentState === "PAID") return BOOKED_PAID_BLOCK_CLASSES;
  return STATUS_BLOCK_CLASSES[status];
}

export function calendarStatusLabel(status: ReservationStatus, paymentState: PaymentState): string {
  if (status !== "BOOKED") return STATUS_LABELS[status];
  return paymentState === "PAID" ? "Booked · fully paid" : "Booked · partly paid";
}
