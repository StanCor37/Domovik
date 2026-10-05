"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/** A single-line horizontally scrollable strip — used for the month picker
 * so a season's worth of months scrolls in place instead of wrapping onto
 * several lines. Scrolls its active item (the child carrying
 * `data-active`, e.g. SegmentedLink) into view on mount, since the
 * selected month may start off-screen. */
export function ScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.querySelector("[data-active]")?.scrollIntoView({
      behavior: "instant",
      inline: "center",
      block: "nearest",
    });
  }, []);

  return (
    <div
      ref={ref}
      className={
        "scroll-row flex gap-1 overflow-x-auto scroll-smooth" + (className ? " " + className : "")
      }
    >
      {children}
    </div>
  );
}
