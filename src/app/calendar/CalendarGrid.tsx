"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STATUS_BLOCK_CLASSES, STATUS_LABELS, type ReservationStatus } from "@/lib/reservations";
import { ReservationModal, type ModalTarget, type PackageOption, type RoomOption } from "../reservations/ReservationModal";

export type DayInfo = {
  iso: string;
  weekday: string;
  dayOfMonth: number;
  isToday: boolean;
  smenaLabel?: string;
};

export type CellInfo = {
  reservationId: string;
  guestName: string;
  status: ReservationStatus;
  // Actual edges of the reservation (not just where the visible month cuts
  // off) — a stay continuing past the visible range gets a flat edge here.
  isStart: boolean;
  isEnd: boolean;
  // True only on the middle day of the *visible* run, so the guest name
  // reads as centered across the bar rather than pinned to its left edge.
  showLabel: boolean;
} | null;

export function CalendarGrid({
  rooms,
  days,
  cells,
  packages,
  paymentMethods,
  currency,
}: {
  rooms: RoomOption[];
  days: DayInfo[];
  cells: Record<string, CellInfo>;
  packages: PackageOption[];
  paymentMethods: string[];
  currency: string;
}) {
  const [target, setTarget] = useState<ModalTarget | null>(null);
  const todayHeaderRef = useRef<HTMLTableCellElement | null>(null);

  // Jump the grid's horizontal scroll to today's column on load, since a
  // month can be wider than the viewport and today may be off to the right.
  useEffect(() => {
    todayHeaderRef.current?.scrollIntoView({
      behavior: "instant",
      inline: "center",
      block: "nearest",
    });
  }, []);

  function openCreate(roomId: string, iso: string) {
    const checkOutDate = new Date(`${iso}T00:00:00.000Z`);
    checkOutDate.setUTCDate(checkOutDate.getUTCDate() + 1);
    setTarget({
      mode: "create",
      roomId,
      checkIn: iso,
      checkOut: checkOutDate.toISOString().slice(0, 10),
    });
  }

  const now = new Date();
  const todayHref = `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const firstAvailable = rooms.find((r) => r.availableForReservation) ?? rooms[0];
            if (firstAvailable && days[0]) openCreate(firstAvailable.id, days[0].iso);
          }}
          className="btn-primary"
        >
          + New Reservation
        </button>
        <Link href={todayHref} className="btn-secondary">
          Today
        </Link>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table className="border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 w-20 min-w-20 border-b border-r border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left font-medium text-zinc-500">
                Room
              </th>
              {days.map((day) => (
                <th
                  key={day.iso}
                  ref={day.isToday ? todayHeaderRef : undefined}
                  className={
                    "sticky top-0 z-10 min-w-9 px-1 py-1.5 text-center font-medium " +
                    (day.isToday
                      ? "border-b-2 border-b-accent bg-zinc-50 text-zinc-900 font-semibold"
                      : "border-b border-zinc-200 bg-zinc-50 text-zinc-500") +
                    (day.smenaLabel ? " border-l-2 border-l-zinc-900" : "")
                  }
                  title={day.smenaLabel ? `Smena starts: ${day.smenaLabel}` : undefined}
                >
                  <div className="text-[10px] uppercase text-zinc-500">{day.weekday}</div>
                  <div>{day.dayOfMonth}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="sticky left-0 z-10 w-20 min-w-20 border-b border-r border-zinc-200 bg-white px-2 py-1 font-medium">
                  {room.number}
                  {!room.availableForReservation && (
                    <span className="ml-1 text-[10px] font-normal text-zinc-500 italic">n/a</span>
                  )}
                </td>
                {days.map((day) => {
                  const cell = cells[`${room.id}|${day.iso}`] ?? null;
                  const borderL = day.smenaLabel ? "border-l-2 border-l-zinc-900" : "";

                  if (!cell) {
                    return (
                      <td
                        key={day.iso}
                        className={
                          "h-8 min-w-9 cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 " +
                          (day.isToday ? "bg-gradient-to-b from-accent/12 to-accent/3" : "") +
                          " " +
                          borderL
                        }
                        onClick={() => openCreate(room.id, day.iso)}
                      />
                    );
                  }

                  return (
                    <td
                      key={day.iso}
                      className={
                        "h-8 min-w-9 cursor-pointer border-b border-zinc-100 " +
                        (cell.isStart ? "pl-1" : "") +
                        (cell.isEnd ? " pr-1" : "") +
                        (day.isToday ? " ring-1 ring-inset ring-accent/25" : "") +
                        " " +
                        borderL
                      }
                      onClick={() =>
                        setTarget({ mode: "edit", reservationId: cell.reservationId })
                      }
                    >
                      <div
                        title={`${cell.guestName} — ${STATUS_LABELS[cell.status]}`}
                        className={
                          "h-6 truncate text-center text-[10px] leading-6 " +
                          STATUS_BLOCK_CLASSES[cell.status] +
                          (cell.isStart ? " rounded-l-lg" : "") +
                          (cell.isEnd ? " rounded-r-lg" : "")
                        }
                      >
                        {cell.showLabel ? cell.guestName : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
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
    </div>
  );
}
