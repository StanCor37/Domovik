import { TONE_TEXT_CLASSES, type CardTone } from "./Card";

/** A labelled figure tile — the dashboard's KPI row: a warm card with an
 * Arial uppercase label and the figure as a stat (Carlito, regular, large).
 * The tone only colours the figure, so status colour stays semantic. */
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
    <div className="rounded-lg border-[1.5px] border-zinc-200 bg-card p-5">
      <p className="text-label flex items-center gap-1.5 text-zinc-500">
        {label}
        {dot && <span className="h-2 w-2 rounded-full bg-accent" />}
      </p>
      <p className={"mt-2 font-mono text-[32px] leading-none " + (tone ? TONE_TEXT_CLASSES[tone] : "text-zinc-900")}>
        {value}
      </p>
    </div>
  );
}
