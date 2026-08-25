import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "../DeleteButton";
import { createPackage, deletePackage, renamePackage } from "./actions";

export const metadata: Metadata = { title: "Packages" };

export default async function PackagesSettingsPage() {
  const packages = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The board/package options offered on a reservation (e.g. Full
          Board, Half Board). The code is fixed once created — it&apos;s the
          identifier stored on reservations and the Price List — but the
          label can be renamed anytime.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 font-medium">{p.code}</td>
                <td className="px-4 py-3">
                  <form action={renamePackage} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="label"
                      defaultValue={p.label}
                      required
                      className="input w-56"
                    />
                    <button type="submit" className="btn-secondary">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <DeleteButton action={deletePackage} id={p.id} />
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                  No packages yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action={createPackage}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <h2 className="font-medium">Add package</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Code</span>
            <input
              name="code"
              required
              className="input uppercase"
              placeholder="AI"
              maxLength={12}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Label</span>
            <input name="label" required className="input" placeholder="All Inclusive" />
          </label>
        </div>
        <button type="submit" className="btn-primary self-start">
          Add package
        </button>
      </form>
    </div>
  );
}
