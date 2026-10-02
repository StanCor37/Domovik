import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { compareNatural } from "@/lib/sort";
import {
  Badge,
  Button,
  EmptyRow,
  Field,
  FormCard,
  PageTitle,
  Table,
  TableWrap,
  Td,
  THead,
  Th,
  Tr,
} from "@/components/ui";
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
      <PageTitle
        title="Rooms"
        description={
          <>
            {rooms.length} room{rooms.length === 1 ? "" : "s"} configured. Room
            37 defaults to unavailable for reservation — toggle it on when
            ready. Manage the type list itself in{" "}
            <Link href="/settings/room-types" className="underline">
              Room Types
            </Link>
            .
          </>
        }
      />

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
          <TableWrap>
            <Table>
              <THead>
                <Th>Number</Th>
                <Th>Type</Th>
                <Th>Floor</Th>
                <Th>Beds</Th>
                <Th>Extra beds</Th>
                <Th>Description</Th>
                <Th>Active</Th>
                <Th>Available for reservation</Th>
                <Th />
              </THead>
              <tbody>
                {rooms.map((room) => (
                  <Tr key={room.id}>
                    <Td className="font-medium">{room.number}</Td>
                    <Td>
                      <form action={updateRoomType} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={room.id} />
                        <select name="roomTypeId" defaultValue={room.roomTypeId} className="input">
                          {roomTypes.map((rt) => (
                            <option key={rt.id} value={rt.id}>
                              {rt.name}
                            </option>
                          ))}
                        </select>
                        <Button type="submit" variant="secondary">
                          Save
                        </Button>
                      </form>
                    </Td>
                    <Td className="text-zinc-500">{room.floor ?? "—"}</Td>
                    <Td className="text-zinc-500">{room.bedCount}</Td>
                    <Td className="text-zinc-500">{room.extraBedCapacity}</Td>
                    <Td className="text-zinc-500">{room.description ?? "—"}</Td>
                    <Td>
                      <form action={toggleRoomActive}>
                        <input type="hidden" name="id" value={room.id} />
                        <Badge as="button" on={room.active} onLabel="Active" offLabel="Inactive" />
                      </form>
                    </Td>
                    <Td>
                      <form action={toggleRoomAvailability}>
                        <input type="hidden" name="id" value={room.id} />
                        <Badge
                          as="button"
                          on={room.availableForReservation}
                          onLabel="Available"
                          offLabel="Unavailable"
                          italic
                        />
                      </form>
                    </Td>
                    <Td>
                      <form action={deleteRoom}>
                        <input type="hidden" name="id" value={room.id} />
                        <Button type="submit" variant="danger">
                          Delete
                        </Button>
                      </form>
                    </Td>
                  </Tr>
                ))}
                {rooms.length === 0 && (
                  <EmptyRow colSpan={9}>No rooms yet. Add your first room below.</EmptyRow>
                )}
              </tbody>
            </Table>
          </TableWrap>

          <FormCard title="Add room" action={createRoom} maxWidth="max-w-2xl">
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
            <Button type="submit" className="self-start">
              Add room
            </Button>
          </FormCard>
        </>
      )}
    </div>
  );
}
