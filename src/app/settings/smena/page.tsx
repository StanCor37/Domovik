import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  createSmenaPeriod,
  deleteSmenaPeriod,
  updateSmenaLength,
} from "../actions";

export const metadata: Metadata = { title: "Season & Smena" };

export default async function SmenaSettingsPage() {
  const [settings, periods] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.smenaPeriod.findMany({ orderBy: { startMonthDay: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Season & Smena
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          The smena is a recurring pattern, not a rigid calendar container —
          the calendar itself stays day-based.
        </p>
      </div>

      <form
        action={updateSmenaLength}
        className="flex max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <h2 className="font-medium">Default smena length</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Nights</span>
          <input
            name="smenaLengthNights"
            type="number"
            min={1}
            defaultValue={settings?.smenaLengthNights ?? 9}
            required
            className="input"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Save
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Start (MM-DD)</th>
              <th className="px-4 py-3">End (MM-DD)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr
                key={period.id}
                className="border-b border-zinc-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium">{period.label}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {period.startMonthDay}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {period.endMonthDay}
                </td>
                <td className="px-4 py-3">
                  <form action={deleteSmenaPeriod}>
                    <input type="hidden" name="id" value={period.id} />
                    <button type="submit" className="btn-danger">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  No smena periods yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action={createSmenaPeriod}
        className="flex max-w-2xl flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <h2 className="font-medium">Add smena period</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Label">
            <input name="label" required className="input" placeholder="Smena 1" />
          </Field>
          <Field label="Start (MM-DD)">
            <input
              name="startMonthDay"
              pattern="\d{2}-\d{2}"
              placeholder="05-01"
              required
              className="input"
            />
          </Field>
          <Field label="End (MM-DD)">
            <input
              name="endMonthDay"
              pattern="\d{2}-\d{2}"
              placeholder="05-09"
              required
              className="input"
            />
          </Field>
        </div>
        <button type="submit" className="btn-primary self-start">
          Add period
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
