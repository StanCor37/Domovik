"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/** A single-line horizontally scrollable strip — used for the month picker
 * so a season's worth of months scrolls in place instead of wrapping onto
 * several lines. Centers its active item (the child carrying `data-active`,
 * e.g. SegmentedLink) on mount and whenever `activeKey` changes, since the
 * selected month may be off-screen. Scrolls only the strip itself (not via
 * scrollIntoView), so it never yanks the page while the user is elsewhere. */
export function ScrollRow({
  children,
  className,
  activeKey,
}: {
  children: ReactNode;
  className?: string;
  activeKey?: string | number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const row = ref.current;
    const active = row?.querySelector<HTMLElement>("[data-active]");
    if (!row || !active) return;
    row.scrollLeft = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
  }, [activeKey]);

  return (
    <div
      ref={ref}
      className={
        "scroll-row relative flex gap-1 overflow-x-auto scroll-smooth" + (className ? " " + className : "")
      }
    >
      {children}
    </div>
  );
}
