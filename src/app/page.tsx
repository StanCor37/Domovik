import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { compareNatural } from "@/lib/sort";
import { dateToIso, getSeasonRange, WEEKDAY_LABELS } from "@/lib/season";
import { formatCurrency } from "@/lib/currency";
import { OCCUPYING_STATUSES, type ReservationStatus } from "@/lib/reservations";
import { Button, PageHeader, StatCard, StatusTag, Table, TableWrap, Td, THead, Th, Tr } from "@/components/ui";

// Next.js doesn't apply the root layout's title template to a page at the
// same "/" segment (only to nested routes), so this needs the full string.
export const metadata: Metadata = { title: "Dashboard · Domovik" };

const PROPERTY_ID = "singleton-property";

type ReservationRow = {
  id: string;
  roomId: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
  room: { number: string };
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const property = await prisma.property.findUnique({
    where: { id: PROPERTY_ID },
  });

  if (!property) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Dashboard" />
        <p className="text-zinc-500">
          Configure the{" "}
          <Link href="/settings/property" className="underline">
            property
          </Link>{" "}
          before viewing the dashboard.
        </p>
      </div>
    );
  }

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayIso = dateToIso(today);
  const year = params.year ? Number(params.year) : now.getFullYear();

  const roomRows = await prisma.room.findMany({ where: { active: true } });
  const rooms = roomRows.sort((a, b) => compareNatural(a.number, b.number));
  const activeRoomIds = rooms.map((r) => r.id);
  const roomCount = rooms.length;

  // --- Today + next 7 days ---
  const weekEnd = new Date(today.getTime() + 7 * 86400000);
  const weekReservations: ReservationRow[] =
    activeRoomIds.length > 0
      ? await prisma.reservation.findMany({
          where: {
            roomId: { in: activeRoomIds },
            status: { in: OCCUPYING_STATUSES },
            checkIn: { lt: weekEnd },
            // gte (not gt): a reservation departing exactly "today" must still
            // show up for the departures list, even though today is its free
            // hotel-night (it's no longer "occupied" today).
            checkOut: { gte: today },
          },
          include: { room: { select: { number: true } } },
          orderBy: { checkIn: "asc" },
        })
      : [];

  const arrivalsToday = weekReservations.filter((r) => dateToIso(r.checkIn) === todayIso);
  const departuresToday = weekReservations.filter((r) => dateToIso(r.checkOut) === todayIso);
  const occupiedTodayIds = new Set(
    weekReservations.filter((r) => r.checkIn <= today && r.checkOut > today).map((r) => r.roomId)
  );
  const occupiedTodayCount = occupiedTodayIds.size;
  const freeTodayCount = roomCount - occupiedTodayCount;

  const forecast = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 86400000);
    const iso = dateToIso(d);
    const arrivals = weekReservations.filter((r) => dateToIso(r.checkIn) === iso).length;
    const departures = weekReservations.filter((r) => dateToIso(r.checkOut) === iso).length;
    const occupied = weekReservations.filter((r) => r.checkIn <= d && r.checkOut > d).length;
    return {
      iso,
      weekday: WEEKDAY_LABELS[d.getUTCDay()],
      dayOfMonth: d.getUTCDate(),
      arrivals,
      departures,
      occupied,
      free: roomCount - occupied,
    };
  });

  // --- Season occupancy % (selected year) ---
  const { start: seasonStart, end: seasonEnd } = getSeasonRange(property, year);
  const seasonRangeEnd = new Date(seasonEnd.getTime() + 86400000);
  const seasonDayCount = Math.round(
    (seasonRangeEnd.getTime() - seasonStart.getTime()) / 86400000
  );
  const totalRoomNights = roomCount * seasonDayCount;

  const seasonReservations =
    activeRoomIds.length > 0
      ? await prisma.reservation.findMany({
          where: {
            roomId: { in: activeRoomIds },
            status: { in: OCCUPYING_STATUSES },
            checkIn: { lt: seasonRangeEnd },
            checkOut: { gt: seasonStart },
          },
          select: { checkIn: true, checkOut: true },
        })
      : [];

  const occupiedRoomNights = seasonReservations.reduce((sum, r) => {
    const start = r.checkIn > seasonStart ? r.checkIn : seasonStart;
    const end = r.checkOut < seasonRangeEnd ? r.checkOut : seasonRangeEnd;
    return sum + Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
  }, 0);
  const occupancyPercent = totalRoomNights > 0 ? (occupiedRoomNights / totalRoomNights) * 100 : 0;

  // --- Revenue snapshot (reservations starting in the selected calendar year) ---
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const yearReservations = await prisma.reservation.findMany({
    where: {
      checkIn: { gte: yearStart, lt: yearEnd },
      status: { not: "CANCELED" },
    },
    include: { payments: { select: { amount: true } } },
  });
  const totalBooked = yearReservations.reduce(
    (sum, r) => sum + r.finalAmount + r.taxAmount,
    0
  );
  const totalCollected = yearReservations.reduce(
    (sum, r) => sum + r.payments.reduce((s, p) => s + p.amount, 0),
    0
  );
  const outstanding = totalBooked - totalCollected;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" />

      {roomCount === 0 && (
        <p className="text-zinc-500">
          No active rooms configured yet. Add rooms in{" "}
          <Link href="/settings/rooms" className="underline">
            Settings
          </Link>
          .
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard tone="info" label="Occupied today" value={`${occupiedTodayCount} / ${roomCount}`} />
        <StatCard tone="success" label="Free today" value={String(freeTodayCount)} />
        <StatCard tone="info" label="Arrivals today" value={String(arrivalsToday.length)} />
        <StatCard tone="warning" label="Departures today" value={String(departuresToday.length)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReservationList
          title="Arrivals today"
          reservations={arrivalsToday}
          emptyText="No arrivals today."
        />
        <ReservationList
          title="Departures today (cleaning list)"
          reservations={departuresToday}
          emptyText="No departures today."
        />
      </div>

      <div>
        <h2 className="mb-2 font-medium">Next 7 days</h2>
        <TableWrap>
          <Table>
            <THead>
              <Th>Date</Th>
              <Th>Arrivals</Th>
              <Th>Departures</Th>
              <Th>Occupied</Th>
              <Th>Free</Th>
            </THead>
            <tbody>
              {forecast.map((day) => (
                <Tr key={day.iso}>
                  <Td className="font-medium">
                    {day.weekday} {day.dayOfMonth}
                  </Td>
                  <Td>{day.arrivals}</Td>
                  <Td>{day.departures}</Td>
                  <Td>{day.occupied}</Td>
                  <Td>{day.free}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-500">Season stats:</span>
        <Button href={`/?year=${year - 1}`} variant="secondary">
          ← {year - 1}
        </Button>
        <span className="font-medium">{year}</span>
        <Button href={`/?year=${year + 1}`} variant="secondary">
          {year + 1} →
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          tone="info"
          label={`Season occupancy (${year})`}
          value={`${occupancyPercent.toFixed(1)}%`}
        />
        <StatCard label="Total booked" value={formatCurrency(totalBooked, property.currency)} />
        <StatCard
          tone="success"
          label="Collected"
          value={formatCurrency(totalCollected, property.currency)}
        />
        <StatCard
          tone={outstanding > 0 ? "danger" : undefined}
          label="Outstanding"
          value={formatCurrency(outstanding, property.currency)}
          dot={outstanding > 0}
        />
      </div>
    </div>
  );
}

function ReservationList({
  title,
  reservations,
  emptyText,
}: {
  title: string;
  reservations: ReservationRow[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="mb-2 font-medium">{title}</h2>
      {reservations.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {reservations.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-primary/5"
            >
              <span>
                Room {r.room.number} · {r.guestName}
              </span>
              <StatusTag status={r.status as ReservationStatus} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
