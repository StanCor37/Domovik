import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { compareNatural } from "@/lib/sort";
import { dateToIso, getSeasonRange, WEEKDAY_LABELS } from "@/lib/season";
import { formatCurrency } from "@/lib/currency";
import { OCCUPYING_STATUSES, STATUS_LABELS, type ReservationStatus } from "@/lib/reservations";

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
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
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
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

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
        <StatCard label="Occupied today" value={`${occupiedTodayCount} / ${roomCount}`} />
        <StatCard label="Free today" value={String(freeTodayCount)} />
        <StatCard label="Arrivals today" value={String(arrivalsToday.length)} />
        <StatCard label="Departures today" value={String(departuresToday.length)} />
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
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Arrivals</th>
                <th className="px-4 py-2">Departures</th>
                <th className="px-4 py-2">Occupied</th>
                <th className="px-4 py-2">Free</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((day) => (
                <tr key={day.iso} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 font-medium">
                    {day.weekday} {day.dayOfMonth}
                  </td>
                  <td className="px-4 py-2">{day.arrivals}</td>
                  <td className="px-4 py-2">{day.departures}</td>
                  <td className="px-4 py-2">{day.occupied}</td>
                  <td className="px-4 py-2">{day.free}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-500">Season stats:</span>
        <Link href={`/?year=${year - 1}`} className="btn-secondary">
          ← {year - 1}
        </Link>
        <span className="font-medium">{year}</span>
        <Link href={`/?year=${year + 1}`} className="btn-secondary">
          {year + 1} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label={`Season occupancy (${year})`}
          value={`${occupancyPercent.toFixed(1)}%`}
        />
        <StatCard label="Total booked" value={formatCurrency(totalBooked, property.currency)} />
        <StatCard label="Collected" value={formatCurrency(totalCollected, property.currency)} />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding, property.currency)}
          highlight={outstanding > 0}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border bg-white p-4 " +
        (highlight ? "border-zinc-200 border-l-2 border-l-accent" : "border-zinc-200")
      }
    >
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-zinc-500">
        {label}
        {highlight && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </p>
      <p className="mt-1 text-xl font-semibold text-zinc-900">{value}</p>
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
            <li key={r.id} className="flex items-center justify-between gap-2">
              <span>
                Room {r.room.number} · {r.guestName}
              </span>
              <span className="text-xs text-zinc-500">
                {STATUS_LABELS[r.status as ReservationStatus]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
