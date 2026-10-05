import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { compareNatural } from "@/lib/sort";
import { dateToIso } from "@/lib/season";
import { parsePaymentMethods } from "@/lib/paymentMethods";
import { matchesSearch } from "@/lib/serbianSearch";
import { RESERVATION_STATUSES, STATUS_LABELS, type ReservationStatus } from "@/lib/reservations";
import { Button, Field } from "@/components/ui";
import { LedgerTable, type LedgerRow } from "./LedgerTable";
import type { RoomOption } from "../reservations/ReservationModal";

export const metadata: Metadata = { title: "Ledger" };

const SETTINGS_ID = "singleton";
const PROPERTY_ID = "singleton-property";

const SORT_KEYS = [
  "reservationNumber",
  "guestName",
  "checkIn",
  "status",
  "finalAmount",
  "totalDue",
  "balance",
] as const;
type SortKey = (typeof SORT_KEYS)[number];

const SORT_LABELS: Record<SortKey, string> = {
  reservationNumber: "Reservation #",
  guestName: "Guest",
  checkIn: "Check-in",
  status: "Status",
  finalAmount: "Final",
  totalDue: "Due",
  balance: "Balance",
};

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const statusFilter =
    params.status && RESERVATION_STATUSES.includes(params.status as ReservationStatus)
      ? (params.status as ReservationStatus)
      : null;
  const sortKey: SortKey = (SORT_KEYS as readonly string[]).includes(params.sort ?? "")
    ? (params.sort as SortKey)
    : "checkIn";
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";

  const [reservations, roomRows, settings, property, packageRows] = await Promise.all([
    prisma.reservation.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: {
        room: { select: { number: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.room.findMany(),
    prisma.settings.findUnique({ where: { id: SETTINGS_ID } }),
    prisma.property.findUnique({ where: { id: PROPERTY_ID } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const currency = property?.currency ?? "EUR";
  const packages = packageRows.map((p) => ({ code: p.code, label: p.label }));

  const rooms: RoomOption[] = roomRows
    .sort((a, b) => compareNatural(a.number, b.number))
    .map((r) => ({ id: r.id, number: r.number, availableForReservation: r.availableForReservation }));
  const paymentMethods = parsePaymentMethods(
    settings?.paymentMethods ?? "Cash,Card,Bank Transfer"
  );

  let rows: LedgerRow[] = reservations.map((r) => {
    const paid = r.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = r.finalAmount + r.taxAmount;
    return {
      id: r.id,
      reservationNumber: r.reservationNumber,
      guestName: r.guestName,
      roomNumber: r.room.number,
      checkIn: dateToIso(r.checkIn),
      checkOut: dateToIso(r.checkOut),
      status: r.status as ReservationStatus,
      baseAmount: r.baseAmount,
      discountAmount: r.discountAmount,
      taxAmount: r.taxAmount,
      finalAmount: r.finalAmount,
      totalDue,
      paid,
      balance: totalDue - paid,
    };
  });

  if (q) {
    rows = rows.filter(
      (r) =>
        matchesSearch(r.guestName, q) ||
        matchesSearch(r.reservationNumber, q) ||
        matchesSearch(r.roomNumber, q)
    );
  }

  rows.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "reservationNumber":
        cmp = a.reservationNumber.localeCompare(b.reservationNumber);
        break;
      case "guestName":
        cmp = a.guestName.localeCompare(b.guestName);
        break;
      case "checkIn":
        cmp = a.checkIn.localeCompare(b.checkIn);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "finalAmount":
        cmp = a.finalAmount - b.finalAmount;
        break;
      case "totalDue":
        cmp = a.totalDue - b.totalDue;
        break;
      case "balance":
        cmp = a.balance - b.balance;
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });

  function sortHref(key: SortKey) {
    const nextDir = sortKey === key && dir === "asc" ? "desc" : "asc";
    const qp = new URLSearchParams();
    if (q) qp.set("q", q);
    if (statusFilter) qp.set("status", statusFilter);
    qp.set("sort", key);
    qp.set("dir", nextDir);
    return `?${qp.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-wrap items-end gap-3" action="/ledger" method="get">
        <input type="hidden" name="sort" value={sortKey} />
        <input type="hidden" name="dir" value={dir} />
        <Field label="Search">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Guest, reservation #, room"
            className="input w-64"
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={statusFilter ?? ""} className="input">
            <option value="">All statuses</option>
            {RESERVATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit">Filter</Button>
        {(q || statusFilter) && (
          <Button href="/ledger" variant="secondary">
            Clear
          </Button>
        )}
      </form>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>Sort:</span>
        {SORT_KEYS.map((key) => (
          <Link
            key={key}
            href={sortHref(key)}
            className={sortKey === key ? "font-medium text-zinc-900 underline" : "hover:underline"}
          >
            {SORT_LABELS[key]}
            {sortKey === key ? (dir === "asc" ? " ▲" : " ▼") : ""}
          </Link>
        ))}
      </div>

      <LedgerTable
        rows={rows}
        rooms={rooms}
        packages={packages}
        paymentMethods={paymentMethods}
        currency={currency}
      />
    </div>
  );
}
