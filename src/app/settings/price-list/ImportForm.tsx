"use client";

import { useActionState } from "react";
import { Button, Field, FormCard } from "@/components/ui";
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
    <FormCard action={formAction} title="Import from Excel">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Room type">
          <select name="roomTypeId" defaultValue={defaultRoomTypeId} className="input">
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="File (.xlsx)">
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="text-sm"
          />
        </Field>
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="text-label text-zinc-500">Mode</legend>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="mode" value="fill-gaps" defaultChecked />
            Fill gaps only
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="mode" value="replace" />
            Replace all
          </label>
        </fieldset>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Importing…" : "Import"}
        </Button>
      </div>

      {state.status === "success" && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <div className="error-box">
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
    </FormCard>
  );
}
