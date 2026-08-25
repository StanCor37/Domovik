"use client";

import { useActionState } from "react";
import { importPriceList } from "./actions";
import { initialImportState } from "./types";

export function ImportForm({
  roomTypes,
  defaultRoomTypeId,
}: {
  roomTypes: { id: string; name: string }[];
  defaultRoomTypeId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    importPriceList,
    initialImportState
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <h2 className="font-medium">Import from Excel</h2>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Room type</span>
          <select name="roomTypeId" defaultValue={defaultRoomTypeId} className="input">
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">File (.xlsx)</span>
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="text-sm"
          />
        </label>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="font-medium text-zinc-700">Mode</legend>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="mode" value="fill-gaps" defaultChecked />
            Fill gaps only
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="mode" value="replace" />
            Replace all
          </label>
        </fieldset>
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Importing…" : "Import"}
        </button>
      </div>

      {state.status === "success" && (
        <p className="flex items-center gap-1.5 text-sm text-zinc-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <div className="rounded-md border border-zinc-900 bg-white p-3 text-sm font-medium text-zinc-900">
          <p>{state.message}</p>
          {state.errors && state.errors.length > 0 && (
            <ul className="mt-1 list-inside list-disc font-normal">
              {state.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
