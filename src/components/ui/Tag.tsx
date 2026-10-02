import {
  STATUS_LABELS,
  STATUS_PILL_CLASSES,
  STATUS_TAG_CLASSES,
  type ReservationStatus,
} from "@/lib/reservations";

/** Dot + label tag for a list row (dashboard arrivals/departures). */
export function StatusTag({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold " +
        STATUS_TAG_CLASSES[status]
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Flat rounded pill for a table cell (ledger status column). */
export function StatusPill({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium " +
        STATUS_PILL_CLASSES[status]
      }
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Generic on/off state badge — success-tinted with a dot when on, neutral
 * gray when off (e.g. Settings → Rooms' Active/Available toggles). Renders
 * as a `<button type="submit">` when it's the control for a toggle form,
 * or a plain `<span>` when it's just a status readout. */
export function Badge({
  on,
  onLabel,
  offLabel,
  italic,
  as = "span",
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  italic?: boolean;
  as?: "span" | "button";
}) {
  const classes =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " +
    (on ? "bg-success-wash text-success" : "bg-zinc-50 text-zinc-400" + (italic ? " italic" : ""));
  const content = (
    <>
      {on && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {on ? onLabel : offLabel}
    </>
  );
  if (as === "button") {
    return (
      <button type="submit" className={classes}>
        {content}
      </button>
    );
  }
  return <span className={classes}>{content}</span>;
}
