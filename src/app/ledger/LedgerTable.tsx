"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { type ReservationStatus } from "@/lib/reservations";
import { StatusPill, Table, TableWrap, Td, THead, Th, Tr } from "@/components/ui";
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
      <TableWrap>
        <Table className="border-separate border-spacing-0">
          {/* This table uses border-separate (for the sticky first column), where
              a <tr>'s own border doesn't render — every cell carries its border. */}
          <THead>
            <Th sticky className="border-b border-zinc-200">Reservation #</Th>
            <Th className="border-b border-zinc-200">Guest</Th>
            <Th className="border-b border-zinc-200">Room</Th>
            <Th className="border-b border-zinc-200">Check-in</Th>
            <Th className="border-b border-zinc-200">Check-out</Th>
            <Th className="border-b border-zinc-200">Status</Th>
            <Th align="right" className="border-b border-zinc-200">Base</Th>
            <Th align="right" className="border-b border-zinc-200">Discount</Th>
            <Th align="right" className="border-b border-zinc-200">Tax</Th>
            <Th align="right" className="border-b border-zinc-200">Final</Th>
            <Th align="right" className="border-b border-zinc-200">Due</Th>
            <Th align="right" className="border-b border-zinc-200">Paid</Th>
            <Th align="right" className="border-b border-zinc-200">Balance</Th>
          </THead>
          <tbody>
            {rows.map((r) => (
              <Tr
                key={r.id}
                onClick={() => setTarget({ mode: "edit", reservationId: r.id })}
                className="group cursor-pointer"
              >
                <Td className="sticky left-0 z-10 whitespace-nowrap border-b border-zinc-100 bg-white font-medium group-hover:bg-primary/5">
                  {r.reservationNumber}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 group-hover:bg-primary/5">
                  {r.guestName}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 group-hover:bg-primary/5">
                  {r.roomNumber}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 group-hover:bg-primary/5">
                  {r.checkIn}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 group-hover:bg-primary/5">
                  {r.checkOut}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 group-hover:bg-primary/5">
                  <StatusPill status={r.status} />
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 text-right font-mono group-hover:bg-primary/5">
                  {money(r.baseAmount)}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 text-right font-mono group-hover:bg-primary/5">
                  {money(r.discountAmount)}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 text-right font-mono group-hover:bg-primary/5">
                  {money(r.taxAmount)}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 text-right font-mono group-hover:bg-primary/5">
                  {money(r.finalAmount)}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 text-right font-mono group-hover:bg-primary/5">
                  {money(r.totalDue)}
                </Td>
                <Td className="whitespace-nowrap border-b border-zinc-100 text-right font-mono group-hover:bg-primary/5">
                  {money(r.paid)}
                </Td>
                <Td
                  className={
                    "whitespace-nowrap border-b border-zinc-100 text-right font-mono group-hover:bg-primary/5 " +
                    (r.balance > 0 ? "font-semibold text-danger-ink" : "font-normal text-zinc-500")
                  }
                >
                  {money(r.balance)}
                </Td>
              </Tr>
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
                <td className="border-t border-zinc-200 px-4 py-2 text-right font-mono">
                  {money(totals.finalAmount)}
                </td>
                <td className="border-t border-zinc-200 px-4 py-2 text-right font-mono">
                  {money(totals.totalDue)}
                </td>
                <td className="border-t border-zinc-200 px-4 py-2 text-right font-mono">
                  {money(totals.paid)}
                </td>
                <td className="border-t border-zinc-200 px-4 py-2 text-right font-mono">
                  {money(totals.balance)}
                </td>
              </tr>
            </tfoot>
          )}
        </Table>
      </TableWrap>

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
