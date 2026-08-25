import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { compareNatural } from "@/lib/sort";
import {
  createRoom,
  deleteRoom,
  toggleRoomActive,
  toggleRoomAvailability,
  updateRoomType,
} from "../actions";

export const metadata: Metadata = { title: "Rooms" };

export default async function RoomsSettingsPage() {
  const [roomRows, roomTypes] = await Promise.all([
    prisma.room.findMany({ include: { roomType: true } }),
    prisma.roomType.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const rooms = roomRows.sort((a, b) => compareNatural(a.number, b.number));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {rooms.length} room{rooms.length === 1 ? "" : "s"} configured. Room
          37 defaults to unavailable for reservation — toggle it on when
          ready. Manage the type list itself in{" "}
          <Link href="/settings/room-types" className="underline">
            Room Types
          </Link>
          .
        </p>
      </div>

      {roomTypes.length === 0 ? (
        <p className="text-zinc-500">
          No room types configured yet. Add at least one in{" "}
          <Link href="/settings/room-types" className="underline">
            Room Types
          </Link>{" "}
          before adding rooms.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Beds</th>
                  <th className="px-4 py-3">Extra beds</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Available for reservation</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{room.number}</td>
                    <td className="px-4 py-3">
                      <form action={updateRoomType} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={room.id} />
                        <select name="roomTypeId" defaultValue={room.roomTypeId} className="input">
                          {roomTypes.map((rt) => (
                            <option key={rt.id} value={rt.id}>
                              {rt.name}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="btn-secondary">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{room.floor ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-500">{room.bedCount}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {room.extraBedCapacity}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {room.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleRoomActive}>
                        <input type="hidden" name="id" value={room.id} />
                        <button
                          type="submit"
                          className={
                            room.active
                              ? "inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-900"
                              : "inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-400"
                          }
                        >
                          {room.active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                          {room.active ? "Active" : "Inactive"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={toggleRoomAvailability}>
                        <input type="hidden" name="id" value={room.id} />
                        <button
                          type="submit"
                          className={
                            room.availableForReservation
                              ? "inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-900"
                              : "inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-400 italic"
                          }
                        >
                          {room.availableForReservation && (
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          )}
                          {room.availableForReservation
                            ? "Available"
                            : "Unavailable"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={deleteRoom}>
                        <input type="hidden" name="id" value={room.id} />
                        <button type="submit" className="btn-danger">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-zinc-500">
                      No rooms yet. Add your first room below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form
            action={createRoom}
            className="flex max-w-2xl flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
          >
            <h2 className="font-medium">Add room</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Number">
                <input name="number" required className="input" />
              </Field>
              <Field label="Type">
                <select name="roomTypeId" required className="input">
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Floor">
                <input name="floor" className="input" />
              </Field>
              <Field label="Beds">
                <input
                  name="bedCount"
                  type="number"
                  min={1}
                  defaultValue={2}
                  required
                  className="input"
                />
              </Field>
              <Field label="Extra beds">
                <input
                  name="extraBedCapacity"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="input"
                />
              </Field>
            </div>
            <Field label="Description">
              <input name="description" className="input" />
            </Field>
            <button type="submit" className="btn-primary self-start">
              Add room
            </button>
          </form>
        </>
      )}
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
