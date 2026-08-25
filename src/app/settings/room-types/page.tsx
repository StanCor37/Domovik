import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "../DeleteButton";
import { createRoomType, deleteRoomType, renameRoomType } from "./actions";

export const metadata: Metadata = { title: "Room Types" };

export default async function RoomTypesSettingsPage() {
  const roomTypes = await prisma.roomType.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { rooms: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Room Types</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Categories like Single, Double, or Suite. The Price List is scoped
          per room type, since different types can carry different prices for
          the same date and package. Assign each room to a type in{" "}
          <span className="font-medium">Settings → Rooms</span>.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Rooms</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((rt) => (
              <tr key={rt.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <form action={renameRoomType} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={rt.id} />
                    <input
                      name="name"
                      defaultValue={rt.name}
                      required
                      className="input w-48"
                    />
                    <button type="submit" className="btn-secondary">
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-zinc-500">{rt._count.rooms}</td>
                <td className="px-4 py-3">
                  <DeleteButton action={deleteRoomType} id={rt.id} />
                </td>
              </tr>
            ))}
            {roomTypes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                  No room types yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action={createRoomType}
        className="flex max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <h2 className="font-medium">Add room type</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Name</span>
          <input name="name" required className="input" placeholder="Suite" />
        </label>
        <button type="submit" className="btn-primary self-start">
          Add room type
        </button>
      </form>
    </div>
  );
}
