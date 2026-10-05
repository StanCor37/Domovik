import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button, EmptyRow, Field, FormCard, PageTitle, Table, TableWrap, Td, THead, Th, Tr } from "@/components/ui";
import {
  createSmenaPeriod,
  deleteSmenaPeriod,
  updateSmenaLength,
} from "../actions";

export const metadata: Metadata = { title: "Season & Smena" };

export default async function SmenaSettingsPage() {
  const [settings, periods, property] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.smenaPeriod.findMany({ orderBy: { startMonthDay: "asc" } }),
    prisma.property.findUnique({ where: { id: "singleton-property" } }),
  ]);

  // The season (Property settings) bounds the calendar and price list, so a
  // smena running outside it silently won't appear there — flag it. MM-DD
  // strings compare correctly as plain strings.
  const isOutsideSeason = (period: { startMonthDay: string; endMonthDay: string }) =>
    property !== null &&
    (period.startMonthDay < property.seasonStartMonthDay || period.endMonthDay > property.seasonEndMonthDay);
  const outside = periods.filter(isOutsideSeason);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Season & Smena"
        description="The smena is a recurring pattern, not a rigid calendar container — the calendar itself stays day-based."
      />

      {property && outside.length > 0 && (
        <p role="alert" className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {outside.map((p) => p.label).join(", ")} {outside.length === 1 ? "falls" : "fall"} outside the season
          ({property.seasonStartMonthDay} to {property.seasonEndMonthDay}), so {outside.length === 1 ? "it" : "they"}{" "}
          won&apos;t show on the calendar or accept prices.{" "}
          <Link href="/settings/property" className="font-medium underline">
            Adjust the season
          </Link>
          .
        </p>
      )}

      <FormCard title="Default smena length" action={updateSmenaLength} maxWidth="max-w-sm">
        <Field label="Nights">
          <input
            name="smenaLengthNights"
            type="number"
            min={1}
            defaultValue={settings?.smenaLengthNights ?? 9}
            required
            className="input"
          />
        </Field>
        <Button type="submit" className="self-start">
          Save
        </Button>
      </FormCard>

      <TableWrap>
        <Table>
          <THead>
            <Th>Label</Th>
            <Th>Start (MM-DD)</Th>
            <Th>End (MM-DD)</Th>
            <Th />
          </THead>
          <tbody>
            {periods.map((period) => (
              <Tr key={period.id}>
                <Td className="font-medium">
                  {period.label}
                  {isOutsideSeason(period) && (
                    <span className="ml-2 text-xs font-normal text-amber-700">outside season</span>
                  )}
                </Td>
                <Td className="text-zinc-500">{period.startMonthDay}</Td>
                <Td className="text-zinc-500">{period.endMonthDay}</Td>
                <Td>
                  <form action={deleteSmenaPeriod}>
                    <input type="hidden" name="id" value={period.id} />
                    <Button type="submit" variant="danger">
                      Delete
                    </Button>
                  </form>
                </Td>
              </Tr>
            ))}
            {periods.length === 0 && (
              <EmptyRow colSpan={4}>No smena periods yet. Add one below.</EmptyRow>
            )}
          </tbody>
        </Table>
      </TableWrap>

      <FormCard title="Add smena period" action={createSmenaPeriod} maxWidth="max-w-2xl">
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
        <Button type="submit" className="self-start">
          Add period
        </Button>
      </FormCard>
    </div>
  );
}
