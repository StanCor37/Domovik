import { STATUS_LABELS, STATUS_TONES, type ReservationStatus } from "@/lib/reservations";

/** StatusTag (MedConnect): the word in small caps with a coloured dot, in a
 * glass pill tinted with the status tone. Pass the word in sentence case;
 * the style uppercases it. */
export function StatusTag({ status }: { status: ReservationStatus }) {
  return <span className={"status-tag status-tag--" + STATUS_TONES[status]}>{STATUS_LABELS[status]}</span>;
}

/** Same tag in a table cell (ledger status column). */
export const StatusPill = StatusTag;

/** Generic on/off state badge — a success tag when on, a muted one when off
 * (e.g. Settings → Rooms' Active/Available toggles). Renders as a
 * `<button type="submit">` when it's the control for a toggle form, or a
 * plain `<span>` when it's just a status readout. */
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
    "status-tag " + (on ? "status-tag--success" : "status-tag--secondary" + (italic ? " italic" : ""));
  const label = on ? onLabel : offLabel;
  if (as === "button") {
    return (
      <button type="submit" className={classes + " cursor-pointer hover:brightness-95"}>
        {label}
      </button>
    );
  }
  return <span className={classes}>{label}</span>;
}
