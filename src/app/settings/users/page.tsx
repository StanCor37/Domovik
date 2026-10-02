import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button, EmptyRow, Field, FormCard, PageTitle, Table, TableWrap, Td, THead, Th, Tr } from "@/components/ui";
import { DeleteButton } from "../DeleteButton";
import { createUser, deleteUser } from "./actions";

export const metadata: Metadata = { title: "Users" };

export default async function UsersSettingsPage() {
  await verifySession();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Users"
        description="Staff accounts that can log in. Every account has the same access level."
      />

      <TableWrap>
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th />
          </THead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td className="font-medium">{u.name}</Td>
                <Td className="text-zinc-500">{u.email}</Td>
                <Td>
                  <DeleteButton action={deleteUser} id={u.id} />
                </Td>
              </Tr>
            ))}
            {users.length === 0 && <EmptyRow colSpan={3}>No users yet.</EmptyRow>}
          </tbody>
        </Table>
      </TableWrap>

      <FormCard title="Add user" action={createUser} maxWidth="max-w-md">
        <Field label="Name">
          <input name="name" required className="input" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required className="input" />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required minLength={8} className="input" />
        </Field>
        <Button type="submit" className="self-start">
          Add user
        </Button>
      </FormCard>
    </div>
  );
}
