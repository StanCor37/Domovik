import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Button, EmptyRow, Field, FormCard, PageTitle, Table, TableWrap, Td, THead, Th, Tr } from "@/components/ui";
import { DeleteButton } from "../DeleteButton";
import { createPackage, deletePackage, renamePackage } from "./actions";

export const metadata: Metadata = { title: "Packages" };

export default async function PackagesSettingsPage() {
  const packages = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Packages"
        description="The board/package options offered on a reservation (e.g. Full Board, Half Board). The code is fixed once created — it's the identifier stored on reservations and the Price list — but the label can be renamed anytime."
      />

      <TableWrap>
        <Table>
          <THead>
            <Th>Code</Th>
            <Th>Label</Th>
            <Th />
          </THead>
          <tbody>
            {packages.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium">{p.code}</Td>
                <Td>
                  <form action={renamePackage} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="label"
                      defaultValue={p.label}
                      required
                      className="input w-56"
                    />
                    <Button type="submit" variant="secondary">
                      Save
                    </Button>
                  </form>
                </Td>
                <Td>
                  <DeleteButton action={deletePackage} id={p.id} />
                </Td>
              </Tr>
            ))}
            {packages.length === 0 && (
              <EmptyRow colSpan={3}>No packages yet. Add one below.</EmptyRow>
            )}
          </tbody>
        </Table>
      </TableWrap>

      <FormCard title="Add package" action={createPackage} maxWidth="max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code">
            <input
              name="code"
              required
              className="input uppercase"
              placeholder="AI"
              maxLength={12}
            />
          </Field>
          <Field label="Label">
            <input name="label" required className="input" placeholder="All Inclusive" />
          </Field>
        </div>
        <Button type="submit" className="self-start">
          Add package
        </Button>
      </FormCard>
    </div>
  );
}
