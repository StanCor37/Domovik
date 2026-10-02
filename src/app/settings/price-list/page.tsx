import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getDefaultSeasonYearMonth,
  getMonthDaysInSeason,
  getSeasonMonths,
  MONTH_LABELS,
  dateToIso,
} from "@/lib/season";
import { Button, FormCard, PageTitle, SegmentedLink } from "@/components/ui";
import { savePriceListMonth } from "./actions";
import { ImportForm } from "./ImportForm";

export const metadata: Metadata = { title: "Price List" };

const PROPERTY_ID = "singleton-property";

export default async function PriceListPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; roomTypeId?: string }>;
}) {
  const params = await searchParams;
  const [property, roomTypes, packages] = await Promise.all([
    prisma.property.findUnique({ where: { id: PROPERTY_ID } }),
    prisma.roomType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!property) {
    return (
      <div className="flex flex-col gap-4">
        <PageTitle title="Price List" />
        <p className="text-zinc-500">
          Configure the{" "}
          <Link href="/settings/property" className="underline">
            property
          </Link>{" "}
          (including season dates) before setting up the price list.
        </p>
      </div>
    );
  }

  if (roomTypes.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <PageTitle title="Price List" />
        <p className="text-zinc-500">
          The Price List is scoped per room type. Add at least one in{" "}
          <Link href="/settings/room-types" className="underline">
            Room Types
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }
  if (packages.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <PageTitle title="Price List" />
        <p className="text-zinc-500">
          No packages configured yet. Add at least one in{" "}
          <Link href="/settings/packages" className="underline">
            Packages
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  const roomTypeId =
    params.roomTypeId && roomTypes.some((rt) => rt.id === params.roomTypeId)
      ? params.roomTypeId
      : roomTypes[0].id;

  const defaults = getDefaultSeasonYearMonth(property, new Date());
  const year = params.year ? Number(params.year) : defaults.year;
  const seasonMonths = getSeasonMonths(property, year);
  const month = params.month ? Number(params.month) : defaults.month;

  const days = getMonthDaysInSeason(property, year, month);
  const entries = await prisma.priceListEntry.findMany({
    where: {
      roomTypeId,
      date: {
        gte: new Date(Date.UTC(year, month - 1, 1)),
        lt: new Date(Date.UTC(year, month, 1)),
      },
    },
  });
  const priceMap = new Map<string, number>();
  for (const entry of entries) {
    priceMap.set(`${dateToIso(entry.date)}|${entry.product}`, entry.pricePerAdult);
  }

  const qs = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams({
      year: String(year),
      month: String(month),
      roomTypeId,
      ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])),
    });
    return `?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title="Price List"
        description="One price per day per package per room type, per adult. Guest-category multipliers apply on top at booking time."
        action={
          <Button href={`/api/price-list/template?year=${year}`} variant="secondary">
            Download template ({year})
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1">
        {roomTypes.map((rt) => (
          <SegmentedLink key={rt.id} href={qs({ roomTypeId: rt.id })} active={rt.id === roomTypeId}>
            {rt.name}
          </SegmentedLink>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Button href={qs({ year: year - 1 })} variant="secondary">
            ← {year - 1}
          </Button>
          <span className="font-medium">{year}</span>
          <Button href={qs({ year: year + 1 })} variant="secondary">
            {year + 1} →
          </Button>
          <Button href={`?roomTypeId=${roomTypeId}`} variant="secondary">
            Today
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {seasonMonths.map((m) => (
            <SegmentedLink key={m} href={qs({ month: m })} active={m === month}>
              {MONTH_LABELS[m - 1]}
            </SegmentedLink>
          ))}
        </div>
      </div>

      {days.length === 0 ? (
        <p className="text-zinc-500">
          No days in {MONTH_LABELS[month - 1]} {year} fall within the
          configured season.
        </p>
      ) : (
        <FormCard action={savePriceListMonth}>
          <input type="hidden" name="roomTypeId" value={roomTypeId} />
          <div className="max-h-[60vh] overflow-auto rounded-md border border-zinc-200">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
                    Date
                  </th>
                  {packages.map((p) => (
                    <th key={p.code} className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
                      {p.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const iso = dateToIso(day);
                  return (
                    <tr key={iso}>
                      <td className="whitespace-nowrap border-b border-zinc-100 px-3 py-1.5 font-medium">
                        {iso}
                      </td>
                      {packages.map((p) => (
                        <td key={p.code} className="border-b border-zinc-100 px-3 py-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            name={`price-${iso}-${p.code}`}
                            defaultValue={priceMap.get(`${iso}|${p.code}`) ?? ""}
                            placeholder="—"
                            className="input w-24"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button type="submit" className="self-start">
            Save {MONTH_LABELS[month - 1]}
          </Button>
        </FormCard>
      )}

      <ImportForm
        roomTypes={roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
        defaultRoomTypeId={roomTypeId}
      />
    </div>
  );
}
