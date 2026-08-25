"use client";

import { useState, useTransition } from "react";

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
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await action(id);
            if (!result.ok) setError(result.error);
          });
        }}
        className="btn-danger disabled:opacity-60"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="max-w-56 text-xs font-medium text-zinc-900">{error}</p>}
    </div>
  );
}
