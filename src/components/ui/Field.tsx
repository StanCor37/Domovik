import type { ReactNode } from "react";

/** Label + control wrapper used by every form in the app: the label above
 * in the MASTER's label style (Arial uppercase, tracked, mute). */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={"flex flex-col gap-1.5 text-[15px]" + (className ? " " + className : "")}>
      <span className="text-label text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
