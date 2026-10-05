import Link from "next/link";
import type { ComponentProps } from "react";

// The MASTER's chips: fully rounded warm pills; the selected one is blue.
function segmentClasses(active: boolean) {
  return (
    "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border-[1.5px] px-4 text-[15px] transition-colors " +
    (active
      ? "border-primary bg-primary text-on-primary"
      : "border-zinc-50 bg-card text-zinc-900 hover:border-zinc-200")
  );
}

/** One pill in a segmented nav (month picker, room-type tabs) — solid dark
 * fill when active, outlined when not. Used instead of raw Link markup so
 * Calendar's and Price list's month tabs, and Price list's room-type tabs,
 * share one definition of "selected" vs "not". */
export function SegmentedLink({
  active,
  children,
  ...rest
}: { active: boolean; children: React.ReactNode } & Omit<ComponentProps<typeof Link>, "className">) {
  return (
    <Link data-active={active || undefined} className={segmentClasses(active)} {...rest}>
      {children}
    </Link>
  );
}

/** SegmentedLink's look for pills that act in place (e.g. scrolling the
 * calendar to a month) rather than navigating. */
export function SegmentedButton({
  active,
  children,
  ...rest
}: { active: boolean; children: React.ReactNode } & Omit<ComponentProps<"button">, "className">) {
  return (
    <button type="button" data-active={active || undefined} className={segmentClasses(active)} {...rest}>
      {children}
    </button>
  );
}
