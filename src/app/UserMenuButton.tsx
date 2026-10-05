"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui";
import { ThemeSwitch } from "./profile/ThemeSwitch";

/** Initials circle in the header; opens a small menu with who is signed in,
 * Profile, the theme switch and Log out. Closes on Escape or outside click. */
export function UserMenuButton({
  name,
  email,
  theme,
  logout,
}: {
  name: string;
  email: string;
  theme: "light" | "dark" | "system";
  logout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        title={name}
        onClick={() => setOpen((v) => !v)}
        className="grid rounded-full outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Avatar name={name} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-[150] w-64 rounded-lg border-[1.5px] border-zinc-200 bg-white p-1"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={name} />
            <div className="min-w-0">
              <p className="truncate text-[17px] leading-6 text-zinc-900">{name}</p>
              <p className="truncate text-[13px] leading-4 text-zinc-500">{email}</p>
            </div>
          </div>
          <div className="my-1 border-t border-zinc-200" />
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-sm px-3 py-2 text-zinc-900 hover:bg-zinc-50"
          >
            Profile
          </Link>
          <div className="px-3 py-2">
            <p className="text-label mb-2 text-zinc-500">Theme</p>
            <ThemeSwitch theme={theme} />
          </div>
          <div className="my-1 border-t border-zinc-200" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full rounded-sm px-3 py-2 text-left text-zinc-900 hover:bg-zinc-50"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
