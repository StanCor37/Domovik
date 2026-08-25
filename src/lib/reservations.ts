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
  PARTIALLY_CANCELED: "Partially Canceled",
  COMPLETED: "Completed",
};

// Tailwind classes for the calendar block background per status. Monochrome
// by design — statuses are differentiated by gray intensity and text weight
// alone (no per-cell borders: adjacent same-status day cells must stay
// visually seamless to read as one connected bar, see CalendarGrid).
export const STATUS_BLOCK_CLASSES: Record<ReservationStatus, string> = {
  PREBOOKED: "bg-zinc-100 text-zinc-700",
  BOOKED: "bg-zinc-900 text-white font-semibold",
  CANCELED: "bg-zinc-50 text-zinc-400",
  PARTIALLY_CANCELED: "bg-zinc-300 text-zinc-900 font-medium",
  COMPLETED: "bg-zinc-100 text-zinc-500",
};
