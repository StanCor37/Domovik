import type { ReactNode } from "react";

/** Label + control wrapper used by every form in the app — the one place
 * that defines "what a field label looks like". */
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
    <label className={"flex flex-col gap-1 text-sm" + (className ? " " + className : "")}>
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
