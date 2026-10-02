import Link from "next/link";
import type { ComponentProps } from "react";

/** One pill in a segmented nav (month picker, room-type tabs) — solid dark
 * fill when active, outlined when not. Used instead of raw Link markup so
 * Calendar's and Price List's month tabs, and Price List's room-type tabs,
 * share one definition of "selected" vs "not". */
export function SegmentedLink({
  active,
  children,
  ...rest
}: { active: boolean; children: React.ReactNode } & Omit<ComponentProps<typeof Link>, "className">) {
  return (
    <Link
      className={
        active
          ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
          : "rounded-md border border-zinc-400 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      }
      {...rest}
    >
      {children}
    </Link>
  );
}
