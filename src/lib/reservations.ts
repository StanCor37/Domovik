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

// Tailwind classes for the calendar block background per status. Prebooked
// and Booked carry the brand primary (a translucent wash vs. a solid
// gradient) instead of plain grayscale; the rest stay neutral. No per-cell
// borders: adjacent same-status day cells must stay visually seamless to
// read as one connected bar, see CalendarGrid.
export const STATUS_BLOCK_CLASSES: Record<ReservationStatus, string> = {
  PREBOOKED: "bg-gradient-to-br from-primary/16 to-primary/8 text-primary",
  BOOKED:
    "bg-gradient-to-br from-primary to-[#0a5693] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
  CANCELED: "bg-zinc-50 text-zinc-400",
  PARTIALLY_CANCELED: "bg-zinc-300 text-zinc-900 font-medium",
  COMPLETED: "bg-zinc-100 text-zinc-500",
};

// Rounded status pill for a table cell (ledger) — a flatter, more compact
// treatment than the calendar's occupancy bar, same status→color mapping.
export const STATUS_PILL_CLASSES: Record<ReservationStatus, string> = {
  PREBOOKED: "bg-zinc-100 text-zinc-700",
  BOOKED: "bg-primary text-white",
  CANCELED: "bg-zinc-50 text-zinc-400 ring-1 ring-inset ring-zinc-200",
  PARTIALLY_CANCELED: "bg-zinc-300 text-zinc-900",
  COMPLETED: "bg-zinc-100 text-zinc-500",
};

// Status dot+label tag for a list row (dashboard arrivals/departures). Only
// the occupying statuses realistically show up here.
export const STATUS_TAG_CLASSES: Record<ReservationStatus, string> = {
  PREBOOKED: "bg-warning-wash text-warning-ink",
  BOOKED: "bg-info-wash text-primary",
  CANCELED: "bg-zinc-100 text-zinc-500",
  PARTIALLY_CANCELED: "bg-zinc-100 text-zinc-700",
  COMPLETED: "bg-zinc-100 text-zinc-500",
};
