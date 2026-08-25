"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { STATUS_LABELS, type ReservationStatus } from "@/lib/reservations";
import { ReservationModal, type ModalTarget, type PackageOption, type RoomOption } from "../reservations/ReservationModal";

export type LedgerRow = {
  id: string;
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  totalDue: number;
  paid: number;
  balance: number;
};

export function LedgerTable({
  rows,
  rooms,
  packages,
  paymentMethods,
  currency,
}: {
  rows: LedgerRow[];
  rooms: RoomOption[];
  packages: PackageOption[];
  paymentMethods: string[];
  currency: string;
}) {
  const [target, setTarget] = useState<ModalTarget | null>(null);
  const money = (amount: number) => formatCurrency(amount, currency);

  const totals = rows.reduce(
    (acc, r) => ({
      finalAmount: acc.finalAmount + r.finalAmount,
      taxAmount: acc.taxAmount + r.taxAmount,
      totalDue: acc.totalDue + r.totalDue,
      paid: acc.paid + r.paid,
      balance: acc.balance + r.balance,
    }),
    { finalAmount: 0, taxAmount: 0, totalDue: 0, paid: 0, balance: 0 }
  );

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <Th sticky>Reservation #</Th>
              <Th>Guest</Th>
              <Th>Room</Th>
              <Th>Check-in</Th>
              <Th>Check-out</Th>
              <Th>Status</Th>
              <Th align="right">Base</Th>
              <Th align="right">Discount</Th>
              <Th align="right">Tax</Th>
              <Th align="right">Final</Th>
              <Th align="right">Due</Th>
              <Th align="right">Paid</Th>
              <Th align="right">Balance</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setTarget({ mode: "edit", reservationId: r.id })}
                className="group cursor-pointer"
              >
                <td className="sticky left-0 z-10 border-b border-zinc-100 bg-white px-4 py-2 font-medium group-hover:bg-zinc-50">
                  {r.reservationNumber}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 group-hover:bg-zinc-50">
                  {r.guestName}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 group-hover:bg-zinc-50">
                  {r.roomNumber}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 whitespace-nowrap group-hover:bg-zinc-50">
                  {r.checkIn}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 whitespace-nowrap group-hover:bg-zinc-50">
                  {r.checkOut}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 group-hover:bg-zinc-50">
                  {STATUS_LABELS[r.status]}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 text-right group-hover:bg-zinc-50">
                  {money(r.baseAmount)}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 text-right group-hover:bg-zinc-50">
                  {money(r.discountAmount)}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 text-right group-hover:bg-zinc-50">
                  {money(r.taxAmount)}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 text-right group-hover:bg-zinc-50">
                  {money(r.finalAmount)}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 text-right group-hover:bg-zinc-50">
                  {money(r.totalDue)}
                </td>
                <td className="border-b border-zinc-100 px-4 py-2 text-right group-hover:bg-zinc-50">
                  {money(r.paid)}
                </td>
                <td
                  className={
                    "border-b border-zinc-100 px-4 py-2 text-right group-hover:bg-zinc-50 " +
                    (r.balance > 0 ? "font-semibold text-zinc-900" : "font-normal text-zinc-500")
                  }
                >
                  {money(r.balance)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-6 text-center text-zinc-500">
                  No reservations match these filters.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-zinc-50 font-medium">
                <td className="sticky left-0 z-10 border-t border-zinc-200 bg-zinc-50 px-4 py-2" colSpan={9}>
                  Totals
                </td>
                <td className="border-t border-zinc-200 px-4 py-2 text-right">
                  {money(totals.finalAmount)}
                </td>
                <td className="border-t border-zinc-200 px-4 py-2 text-right">
                  {money(totals.totalDue)}
                </td>
                <td className="border-t border-zinc-200 px-4 py-2 text-right">
                  {money(totals.paid)}
                </td>
                <td className="border-t border-zinc-200 px-4 py-2 text-right">
                  {money(totals.balance)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {target && (
        <ReservationModal
          target={target}
          rooms={rooms}
          packages={packages}
          paymentMethods={paymentMethods}
          currency={currency}
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}

function Th({
  children,
  align = "left",
  sticky = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  sticky?: boolean;
}) {
  return (
    <th
      className={
        "border-b border-zinc-200 px-4 py-2 whitespace-nowrap " +
        (align === "right" ? "text-right " : "text-left ") +
        (sticky ? "sticky left-0 z-20 bg-zinc-50" : "")
      }
    >
      {children}
    </th>
  );
}
