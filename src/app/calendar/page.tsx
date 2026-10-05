import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getDefaultSeasonYearMonth,
  getMonthDaysInSeason,
  getSeasonMonths,
  MONTH_LABELS,
  WEEKDAY_LABELS,
  dateToIso,
  monthDayToDate,
} from "@/lib/season";
import { compareNatural } from "@/lib/sort";
import { parsePaymentMethods } from "@/lib/paymentMethods";
import {
  OCCUPYING_STATUSES,
  STATUS_BLOCK_CLASSES,
  calendarBlockClasses,
  paymentStateOf,
  type ReservationStatus,
} from "@/lib/reservations";
import { Button } from "@/components/ui";
import { CalendarGrid, type CellInfo, type DayInfo, type MonthInfo, type ReservationSummary } from "./CalendarGrid";

export const metadata: Metadata = { title: "Calendar" };

const SETTINGS_ID = "singleton";

const PROPERTY_ID = "singleton-property";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const property = await prisma.property.findUnique({
    where: { id: PROPERTY_ID },
  });

  if (!property) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-zinc-500">
          Configure the{" "}
          <Link href="/settings/property" className="underline">
            property
          </Link>{" "}
          (including season dates) before viewing the calendar.
        </p>
      </div>
    );
  }

  const defaults = getDefaultSeasonYearMonth(property, new Date());
  const year = params.year ? Number(params.year) : defaults.year;
  const seasonMonths = getSeasonMonths(property, year);
  const month = params.month ? Number(params.month) : defaults.month;

  // The grid is one continuous strip across the whole season (rendered a
  // month or so at a time as the user scrolls), so stays that cross a month
  // boundary read as one bar instead of being cut at the month edge.
  const months: MonthInfo[] = [];
  const monthDays: Date[] = [];
  for (const m of seasonMonths) {
    const mDays = getMonthDaysInSeason(property, year, m);
    if (mDays.length === 0) continue;
    months.push({ month: m, label: `${MONTH_LABELS[m - 1]} ${year}`, dayCount: mDays.length });
    monthDays.push(...mDays);
  }
  const todayIso = dateToIso(new Date());

  const [roomRows, smenaPeriods, settings, packageRows] = await Promise.all([
    prisma.room.findMany({ where: { active: true } }),
    prisma.smenaPeriod.findMany(),
    prisma.settings.findUnique({ where: { id: SETTINGS_ID } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const paymentMethods = parsePaymentMethods(settings?.paymentMethods ?? "Cash,Card,Bank Transfer");
  const packages = packageRows.map((p) => ({ code: p.code, label: p.label }));
  const sortedRooms = roomRows.sort((a, b) => compareNatural(a.number, b.number));
  const rooms = sortedRooms.map((r) => ({
    id: r.id,
    number: r.number,
    availableForReservation: r.availableForReservation,
  }));

  const smenaStartsByIso = new Map<string, string>();
  for (const sp of smenaPeriods) {
    smenaStartsByIso.set(dateToIso(monthDayToDate(year, sp.startMonthDay)), sp.label);
  }

  const days: DayInfo[] = monthDays.map((d) => {
    const iso = dateToIso(d);
    return {
      iso,
      weekday: WEEKDAY_LABELS[d.getUTCDay()],
      dayOfMonth: d.getUTCDate(),
      month: d.getUTCMonth() + 1,
      isToday: iso === todayIso,
      smenaLabel: smenaStartsByIso.get(iso),
    };
  });

  let reservations: {
    id: string;
    reservationNumber: string;
    roomId: string;
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
    finalAmount: number;
    taxAmount: number;
    payments: { amount: number }[];
    guests: { taxCategory: string }[];
  }[] = [];

  if (monthDays.length > 0 && sortedRooms.length > 0) {
    const rangeStart = monthDays[0];
    const rangeEnd = new Date(monthDays[monthDays.length - 1].getTime() + 86400000);
    reservations = await prisma.reservation.findMany({
      where: {
        roomId: { in: sortedRooms.map((r) => r.id) },
        status: { in: OCCUPYING_STATUSES },
        checkIn: { lt: rangeEnd },
        checkOut: { gt: rangeStart },
      },
      include: { payments: { select: { amount: true } }, guests: { select: { taxCategory: true } } },
    });
  }

  const cells: Record<string, CellInfo> = {};
  // What the bar label and hover card show for each stay.
  const summaries: Record<string, ReservationSummary> = {};
  for (const r of reservations) {
    const paid = r.payments.reduce((sum, p) => sum + p.amount, 0);
    // Adults vs children by tax category, which is age-based (the price
    // category is just what the family asked for).
    const adults = r.guests.filter((g) => g.taxCategory === "ADULT").length;
    summaries[r.id] = {
      reservationNumber: r.reservationNumber,
      guestName: r.guestName,
      status: r.status as ReservationStatus,
      checkIn: dateToIso(r.checkIn),
      checkOut: dateToIso(r.checkOut),
      nights: Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 86400000),
      adults,
      children: r.guests.length - adults,
      totalDue: r.finalAmount + r.taxAmount,
      paid,
      paymentCount: r.payments.length,
    };

    // Isos this reservation occupies within the season, in order —
    // a contiguous run since a room can't have two overlapping reservations.
    const runIsos: string[] = [];
    for (
      let d = new Date(Math.max(r.checkIn.getTime(), monthDays[0]?.getTime() ?? 0));
      d < r.checkOut;
      d = new Date(d.getTime() + 86400000)
    ) {
      runIsos.push(dateToIso(d));
    }
    if (runIsos.length === 0) continue;

    // isStart/isEnd mark the reservation's *actual* edges (not just where the
    // season happens to cut off), so a stay continuing past it renders with
    // a flat edge rather than a false end cap.
    const checkInIso = dateToIso(r.checkIn);
    const lastNightIso = dateToIso(new Date(r.checkOut.getTime() - 86400000));
    // Paid vs. the total due (final amount + tourist tax), as in the ledger.
    const paymentState = paymentStateOf(paid, r.finalAmount + r.taxAmount);

    for (const iso of runIsos) {
      cells[`${r.roomId}|${iso}`] = {
        reservationId: r.id,
        guestName: r.guestName,
        status: r.status as ReservationStatus,
        paymentState,
        isStart: iso === checkInIso,
        isEnd: iso === lastNightIso,
      };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Button href={`?year=${year - 1}&month=${month}`} variant="secondary">
            ← {year - 1}
          </Button>
          <span className="font-medium">{year}</span>
          <Button href={`?year=${year + 1}&month=${month}`} variant="secondary">
            {year + 1} →
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <LegendSwatch className="bg-white ring-1 ring-inset ring-zinc-400" label="Free" />
          <LegendSwatch className={STATUS_BLOCK_CLASSES.PREBOOKED} label="Prebooked (unpaid)" />
          <LegendSwatch className={calendarBlockClasses("BOOKED", "PARTIAL")} label="Booked · partly paid" />
          <LegendSwatch className={calendarBlockClasses("BOOKED", "PAID")} label="Booked · fully paid" />
          <LegendSwatch className={STATUS_BLOCK_CLASSES.PARTIALLY_CANCELED} label="Partially canceled" />
        </div>
      </div>

      {rooms.length === 0 ? (
        <p className="text-zinc-500">
          No active rooms configured yet. Add rooms in{" "}
          <Link href="/settings/rooms" className="underline">
            Settings
          </Link>
          .
        </p>
      ) : days.length === 0 ? (
        <p className="text-zinc-500">
          No days in {year} fall within the configured season.
        </p>
      ) : (
        <CalendarGrid
          key={`${year}-${month}`}
          rooms={rooms}
          days={days}
          months={months}
          initialMonth={months.some((m) => m.month === month) ? month : months[0].month}
          cells={cells}
          summaries={summaries}
          packages={packages}
          paymentMethods={paymentMethods}
          currency={property.currency}
        />
      )}
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={"h-3 w-3 rounded-sm " + className} />
      {label}
    </span>
  );
}
