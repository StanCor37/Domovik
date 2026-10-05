"use client";

import { useOptimistic, useTransition } from "react";
import { SegmentedButton } from "@/components/ui";
import { setTheme } from "./actions";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/** Light / Dark / System for this browser. The pill moves at once; the page
 * re-renders in the new theme as soon as the cookie is saved. */
export function ThemeSwitch({ theme }: { theme: Theme }) {
  const [shown, setShown] = useOptimistic(theme);
  const [, startTransition] = useTransition();

  return (
    <div role="radiogroup" aria-label="Theme" className="flex gap-1">
      {OPTIONS.map((o) => (
        <SegmentedButton
          key={o.value}
          role="radio"
          aria-checked={shown === o.value}
          active={shown === o.value}
          onClick={() =>
            startTransition(async () => {
              setShown(o.value);
              await setTheme(o.value);
            })
          }
        >
          {o.label}
        </SegmentedButton>
      ))}
    </div>
  );
}
