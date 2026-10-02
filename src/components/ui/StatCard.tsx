import { CARD_TONE_CLASSES, TONE_TEXT_CLASSES, type CardTone } from "./Card";

/** A labelled number tile — the dashboard's KPI row, tone-colored by
 * semantic meaning (info/success/warning/danger) or left neutral. */
export function StatCard({
  label,
  value,
  tone,
  dot,
}: {
  label: string;
  value: string;
  tone?: CardTone;
  dot?: boolean;
}) {
  return (
    <div className={"rounded-lg border p-4 " + (tone ? CARD_TONE_CLASSES[tone] : "border-zinc-200 bg-white")}>
      <p
        className={
          "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide " +
          (tone ? TONE_TEXT_CLASSES[tone] : "text-zinc-500")
        }
      >
        {label}
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </p>
      <p className={"mt-1 font-mono text-xl font-semibold " + (tone ? TONE_TEXT_CLASSES[tone] : "text-zinc-900")}>
        {value}
      </p>
    </div>
  );
}
