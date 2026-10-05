import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Button, EmptyRow, Field, FormCard, PageTitle, Table, TableWrap, Td, THead, Th, Tr } from "@/components/ui";
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
      <PageTitle
        title="Room Types"
        description={
          <>
            Categories like Single, Double, or Suite. The Price List is scoped
            per room type, since different types can carry different prices for
            the same date and package. Assign each room to a type in{" "}
            <span className="font-medium">Settings → Rooms</span>.
          </>
        }
      />

      <TableWrap>
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Rooms</Th>
            <Th />
          </THead>
          <tbody>
            {roomTypes.map((rt) => (
              <Tr key={rt.id}>
                <Td>
                  <form action={renameRoomType} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={rt.id} />
                    <input
                      name="name"
                      defaultValue={rt.name}
                      required
                      className="input w-48"
                    />
                    <Button type="submit" variant="secondary">
                      Save
                    </Button>
                  </form>
                </Td>
                <Td className="text-zinc-500">{rt._count.rooms}</Td>
                <Td>
                  <DeleteButton action={deleteRoomType} id={rt.id} />
                </Td>
              </Tr>
            ))}
            {roomTypes.length === 0 && (
              <EmptyRow colSpan={3}>No room types yet. Add one below.</EmptyRow>
            )}
          </tbody>
        </Table>
      </TableWrap>

      <FormCard title="Add room type" action={createRoomType} maxWidth="max-w-sm">
        <Field label="Name">
          <input name="name" required className="input" placeholder="Suite" />
        </Field>
        <Button type="submit" className="self-start">
          Add room type
        </Button>
      </FormCard>
    </div>
  );
}
