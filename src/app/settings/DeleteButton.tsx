"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";

export type DeleteResult = { ok: true } | { ok: false; error: string };

/** Delete button for actions that can be safely blocked (e.g. "still in use")
 * rather than always succeeding — shows the error inline instead of
 * crashing, since a thrown error from a plain <form action> has no graceful
 * display path. */
export function DeleteButton({
  action,
  id,
}: {
  action: (id: string) => Promise<DeleteResult>;
  id: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="danger"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await action(id);
            if (!result.ok) setError(result.error);
          });
        }}
        className="disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Delete"}
      </Button>
      {error && <p className="error-text max-w-56 text-xs">{error}</p>}
    </div>
  );
}
