"use client";

import { useEffect, useLayoutEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  calendarBlockClasses,
  calendarStatusLabel,
  type PaymentState,
  type ReservationStatus,
} from "@/lib/reservations";
import { Button, Icon, ScrollRow, SegmentedButton, StatusTag, type IconName } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { ReservationModal, type ModalTarget, type PackageOption, type RoomOption } from "../reservations/ReservationModal";
import { deleteReservation, moveReservationToRoom } from "../reservations/actions";

export type DayInfo = {
  iso: string;
  weekday: string;
  dayOfMonth: number;
  month: number;
  isToday: boolean;
  smenaLabel?: string;
};

/** Per stay: what the bar label and the hover card show. */
export type ReservationSummary = {
  reservationNumber: string;
  guestName: string;
  status: ReservationStatus;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  nights: number;
  adults: number;
  children: number;
  totalDue: number; // final amount + tourist tax
  paid: number;
  paymentCount: number;
};

export type MonthInfo = {
  month: number;
  label: string;
  dayCount: number;
};

export type CellInfo = {
  reservationId: string;
  guestName: string;
  status: ReservationStatus;
  // Drives the Booked color: navy while partly paid, green once fully paid.
  paymentState: PaymentState;
  // Actual edges of the reservation (not just where the season cuts off) —
  // a stay continuing past the season gets a flat edge here.
  isStart: boolean;
  isEnd: boolean;
} | null;

// How close (px) to either end of the rendered strip the user can scroll
// before the neighbouring month is rendered in.
const EDGE_PX = 400;

// Fixed column widths (px) — the table uses a fixed layout so a long guest
// name can never stretch its day column and throw the days out of line.
const ROOM_COL_PX = 80;
const DAY_COL_PX = 36;

// Today's column tint. Deliberately flat: a per-cell gradient would restart
// in every room row and stripe the column instead of reading as one band.
const TODAY_CELL = " bg-accent/8";

type Move = { reservationId: string; toRoomId: string };

type Notice =
  | { kind: "moved"; text: string; undo: Move }
  | { kind: "info"; text: string }
  | { kind: "error"; text: string };

// Hover card: anchored under (or above, near the bottom of the window) the
// day piece the pointer entered first; width in px for edge clamping.
const HOVER_CARD_WIDTH = 330;
type Hover = { id: string; left: number; top: number; above: boolean };

/** Every reservation's room and in-season nights, rebuilt from the cell map. */
function spansOf(cells: Record<string, CellInfo>) {
  const spans = new Map<string, { roomId: string; isos: string[]; guestName: string }>();
  for (const [key, cell] of Object.entries(cells)) {
    if (!cell) continue;
    const [roomId, iso] = key.split("|");
    const span = spans.get(cell.reservationId);
    if (span) span.isos.push(iso);
    else spans.set(cell.reservationId, { roomId, isos: [iso], guestName: cell.guestName });
  }
  return spans;
}

/** The cell map with one reservation shifted to another room (same nights). */
function applyMove(cells: Record<string, CellInfo>, move: Move) {
  const span = spansOf(cells).get(move.reservationId);
  if (!span) return cells;
  const next = { ...cells };
  for (const iso of span.isos) delete next[`${span.roomId}|${iso}`];
  for (const iso of span.isos) next[`${move.toRoomId}|${iso}`] = cells[`${span.roomId}|${iso}`];
  return next;
}

type PendingScroll =
  | { type: "prepend"; prevScrollWidth: number }
  | { type: "jump"; month: number }
  | { type: "today" };

export function CalendarGrid({
  rooms,
  days,
  months,
  initialMonth,
  cells,
  summaries,
  packages,
  paymentMethods,
  currency,
}: {
  rooms: RoomOption[];
  days: DayInfo[];
  months: MonthInfo[];
  initialMonth: number;
  cells: Record<string, CellInfo>;
  summaries: Record<string, ReservationSummary>;
  packages: PackageOption[];
  paymentMethods: string[];
  currency: string;
}) {
  const [target, setTarget] = useState<ModalTarget | null>(null);
  const router = useRouter();

  // Hover card with the stay's details and view / edit / delete actions.
  // Opens on entering a bar, survives the short trip from the bar into the
  // card, and closes when the pointer leaves both, on scroll or on drag.
  const [hover, setHover] = useState<Hover | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function cancelHoverClose() {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = null;
  }
  function scheduleHoverClose() {
    cancelHoverClose();
    hoverCloseTimer.current = setTimeout(() => setHover(null), 150);
  }
  function openHover(id: string, el: HTMLElement) {
    cancelHoverClose();
    if (hover?.id === id) return; // moving along the same bar: stay put
    const rect = el.getBoundingClientRect();
    const above = rect.bottom + 280 > window.innerHeight;
    setHover({
      id,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - HOVER_CARD_WIDTH - 8)),
      top: above ? rect.top - 6 : rect.bottom + 6,
      above,
    });
  }
  function openFromHover(mode: "view" | "edit", reservationId: string) {
    setHover(null);
    setTarget({ mode, reservationId });
  }

  // Drag and drop between rooms: the bar moves at once (optimistically) and
  // the server confirms; on failure the optimistic state simply falls away.
  const [shownCells, addOptimisticMove] = useOptimistic(cells, applyMove);
  const spans = useMemo(() => spansOf(shownCells), [shownCells]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropRoomId, setDropRoomId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  // A drop only proposes the move; it happens once confirmed in the modal.
  const [confirmMove, setConfirmMove] = useState<Move | null>(null);
  const [, startMoving] = useTransition();
  const today = days.find((d) => d.isToday);
  const lastIdx = months.length - 1;
  const initialIdx = Math.max(0, months.findIndex((m) => m.month === initialMonth));

  // The season is one continuous strip, but only the months in [start, end]
  // are rendered; more are added as the user scrolls toward either end.
  // The previous month starts rendered too, so a day early in the month
  // (e.g. today on the 5th) has room on its left to be scrolled to center.
  const [range, setRange] = useState({
    start: Math.max(initialIdx - 1, 0),
    end: Math.min(initialIdx + 1, lastIdx),
  });
  const [activeMonth, setActiveMonth] = useState(months[initialIdx]?.month);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const roomHeaderRef = useRef<HTMLTableCellElement | null>(null);
  const todayHeaderRef = useRef<HTMLTableCellElement | null>(null);
  const monthStartRefs = useRef(new Map<number, HTMLTableCellElement>());
  const pending = useRef<PendingScroll | null>(
    today?.month === initialMonth ? { type: "today" } : { type: "jump", month: initialMonth }
  );

  const visibleMonths = months.slice(range.start, range.end + 1);
  const visibleMonthSet = new Set(visibleMonths.map((m) => m.month));
  const visibleDays = days.filter((d) => visibleMonthSet.has(d.month));

  function roomColWidth() {
    return roomHeaderRef.current?.offsetWidth ?? 0;
  }

  // The month in the middle of the visible days (right of the sticky Room
  // column) — highlighted in the month picker. Middle rather than left edge,
  // so with today centered the picker names today's month.
  function updateActiveMonth(el: HTMLDivElement) {
    const viewCenter = el.scrollLeft + roomColWidth() + (el.clientWidth - roomColWidth()) / 2;
    let current = visibleMonths[0]?.month;
    for (const m of visibleMonths) {
      const th = monthStartRefs.current.get(m.month);
      if (th && th.offsetLeft <= viewCenter) current = m.month;
    }
    // A short partial month at either end of the season (e.g. May 26–31) may
    // never reach the middle, so at the very start/end highlight it instead.
    if (range.start === 0 && el.scrollLeft <= 1 && visibleMonths[0]) current = visibleMonths[0].month;
    const last = visibleMonths[visibleMonths.length - 1];
    const lastTh = last && range.end === lastIdx ? monthStartRefs.current.get(last.month) : undefined;
    if (lastTh && el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && lastTh.offsetLeft < el.scrollLeft + el.clientWidth) {
      current = last.month;
    }
    setActiveMonth(current);
  }

  function extendIfNearEdge(el: HTMLDivElement) {
    if (el.scrollLeft + el.clientWidth > el.scrollWidth - EDGE_PX && range.end < lastIdx) {
      setRange((r) => ({ ...r, end: Math.min(r.end + 1, lastIdx) }));
    } else if (el.scrollLeft < EDGE_PX && range.start > 0) {
      // Prepending widens the strip on the left; remember the old width so
      // the scroll position can be shifted to keep the same days in view.
      pending.current = { type: "prepend", prevScrollWidth: el.scrollWidth };
      setRange((r) => ({ ...r, start: Math.max(r.start - 1, 0) }));
    }
  }

  // Runs after each render of a new range, before paint, so prepends and
  // jumps never show a flash of the wrong scroll position.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const p = pending.current;
    pending.current = null;
    if (p?.type === "prepend") {
      el.scrollLeft += el.scrollWidth - p.prevScrollWidth;
    } else if (p?.type === "jump" || p?.type === "today") {
      const th = p.type === "jump" ? monthStartRefs.current.get(p.month) : todayHeaderRef.current;
      if (th) {
        const targetLeft =
          p.type === "jump"
            ? th.offsetLeft - roomColWidth()
            : th.offsetLeft - (el.clientWidth + roomColWidth() - th.offsetWidth) / 2;
        el.scrollLeft = targetLeft;
        // The strip may still be too narrow to scroll that far (the browser
        // clamps it): render the next month and retry the same jump.
        if (el.scrollLeft < targetLeft - 1 && range.end < lastIdx) {
          pending.current = p;
          setRange((r) => ({ ...r, end: Math.min(r.end + 1, lastIdx) }));
          return;
        }
      }
    }
    updateActiveMonth(el);
    extendIfNearEdge(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // A mouse wheel scrolls through the days (horizontally) rather than the
  // rooms, since moving through dates is what the calendar is for; Shift +
  // wheel scrolls the rooms instead. Trackpad sideways swipes (deltaX) pass
  // through untouched. Attached natively because React's wheel listener is
  // passive and can't preventDefault the browser's vertical scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      e.preventDefault();
      if (e.shiftKey) el!.scrollTop += delta;
      else el!.scrollLeft += delta;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function jumpTo(monthIdx: number, scroll: PendingScroll) {
    pending.current = scroll;
    setRange((r) => ({
      start: Math.min(r.start, monthIdx),
      end: Math.max(r.end, Math.min(monthIdx + 1, lastIdx)),
    }));
  }

  // A room accepts the dragged stay if it's bookable and free on all of the
  // stay's nights. The server re-checks this (including nights outside the
  // loaded season) before saving.
  function canDropOn(roomId: string) {
    const span = dragging ? spans.get(dragging) : undefined;
    const room = rooms.find((r) => r.id === roomId);
    if (!span || !room || !room.availableForReservation || roomId === span.roomId) return false;
    return span.isos.every((iso) => {
      const other = shownCells[`${roomId}|${iso}`];
      return !other || other.reservationId === dragging;
    });
  }

  function move(m: Move, isUndo = false) {
    const span = spans.get(m.reservationId);
    const fromRoomId = span?.roomId;
    const toRoom = rooms.find((r) => r.id === m.toRoomId);
    setNotice(null);
    startMoving(async () => {
      addOptimisticMove(m);
      const result = await moveReservationToRoom(m.reservationId, m.toRoomId);
      if (!result.ok) {
        setNotice({ kind: "error", text: result.error });
        return;
      }
      router.refresh();
      if (!isUndo && fromRoomId) {
        setNotice({
          kind: "moved",
          text: `Moved ${span?.guestName} (${result.reservationNumber}) to room ${toRoom?.number}.`,
          undo: { reservationId: m.reservationId, toRoomId: fromRoomId },
        });
      }
    });
  }

  function removeReservation(reservationId: string) {
    const summary = summaries[reservationId];
    setConfirmDelete(null);
    setNotice(null);
    startMoving(async () => {
      const result = await deleteReservation(reservationId);
      if (!result.ok) {
        setNotice({ kind: "error", text: result.error });
        return;
      }
      router.refresh();
      setNotice({ kind: "info", text: `Deleted ${summary?.guestName ?? "the reservation"} (${result.reservationNumber}).` });
    });
  }

  function endDrag() {
    setDragging(null);
    setDropRoomId(null);
  }

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

  // A thin line marks where one month ends and the next begins; a smena start
  // gets the heavier line. Neither is drawn through a reservation bar, so a
  // stay crossing the boundary stays one continuous bar.
  function dividerClass(day: DayInfo, i: number) {
    if (day.smenaLabel) return " border-l-2 border-l-rule-strong";
    if (day.dayOfMonth === 1 && i > 0) return " border-l border-l-zinc-300";
    return "";
  }

  return (
    <div className="flex flex-col gap-3">
      <ScrollRow className="min-w-0" activeKey={activeMonth}>
        {months.map((m, idx) => (
          <SegmentedButton
            key={m.month}
            active={m.month === activeMonth}
            onClick={() => jumpTo(idx, { type: "jump", month: m.month })}
          >
            {m.label.split(" ")[0]}
          </SegmentedButton>
        ))}
      </ScrollRow>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => {
            const firstAvailable = rooms.find((r) => r.availableForReservation) ?? rooms[0];
            const iso = today?.iso ?? visibleDays[0]?.iso;
            if (firstAvailable && iso) openCreate(firstAvailable.id, iso);
          }}
        >
          + New reservation
        </Button>
        {today ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => jumpTo(months.findIndex((m) => m.month === today.month), { type: "today" })}
          >
            Today
          </Button>
        ) : (
          <Button href={todayHref} variant="secondary">
            Today
          </Button>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className={
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm " +
            (notice.kind === "error" ? "bg-red-50 text-red-800" : "bg-zinc-100 text-zinc-800")
          }
        >
          <span className="flex-1">{notice.text}</span>
          {notice.kind === "moved" && (
            <button type="button" className="font-medium underline" onClick={() => move(notice.undo, true)}>
              Undo
            </button>
          )}
          <button type="button" aria-label="Dismiss" className="text-zinc-500" onClick={() => setNotice(null)}>
            ✕
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (hover) setHover(null);
          updateActiveMonth(e.currentTarget);
          extendIfNearEdge(e.currentTarget);
        }}
        className="relative max-h-[70vh] overflow-auto rounded-lg border-[1.5px] border-zinc-200 bg-white"
      >
        <table
          className="table-fixed border-separate border-spacing-0 text-xs"
          style={{ width: ROOM_COL_PX + visibleDays.length * DAY_COL_PX }}
        >
          <colgroup>
            <col style={{ width: ROOM_COL_PX }} />
            {visibleDays.map((day) => (
              <col key={day.iso} style={{ width: DAY_COL_PX }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                ref={roomHeaderRef}
                rowSpan={2}
                className="sticky top-0 left-0 z-30 w-20 min-w-20 border-b border-r border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left align-bottom text-label font-normal text-zinc-500"
              >
                Room
              </th>
              {visibleMonths.map((m, i) => (
                <th
                  key={m.month}
                  colSpan={m.dayCount}
                  className={
                    "sticky top-0 z-10 h-7 border-b border-zinc-200 bg-zinc-50 p-0 text-left text-[15px] font-bold text-zinc-900" +
                    (i > 0 ? " border-l border-l-zinc-300" : "")
                  }
                >
                  {/* Sticks just right of the Room column so the month name
                      stays readable while scrolling through that month. */}
                  <span className="sticky left-20 inline-block px-2">{m.label}</span>
                </th>
              ))}
            </tr>
            <tr>
              {visibleDays.map((day, i) => (
                <th
                  key={day.iso}
                  ref={(el) => {
                    if (day.isToday) todayHeaderRef.current = el;
                    if (i === 0 || day.dayOfMonth === 1 || day.month !== visibleDays[i - 1].month) {
                      if (el) monthStartRefs.current.set(day.month, el);
                      else monthStartRefs.current.delete(day.month);
                    }
                  }}
                  className={
                    "sticky top-7 z-10 min-w-9 px-1 py-1.5 text-center font-medium " +
                    (day.isToday
                      ? "border-b-2 border-b-accent bg-zinc-50 text-zinc-900 font-semibold"
                      : "border-b border-zinc-200 bg-zinc-50 text-zinc-500") +
                    dividerClass(day, i)
                  }
                  title={day.smenaLabel ? `Smena starts: ${day.smenaLabel}` : undefined}
                >
                  <div className="text-[10px] text-zinc-500">{day.weekday}</div>
                  <div>{day.dayOfMonth}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.id}
                onDragOver={(e) => {
                  if (!dragging) return;
                  setDropRoomId(room.id);
                  if (canDropOn(room.id)) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragging && canDropOn(room.id)) setConfirmMove({ reservationId: dragging, toRoomId: room.id });
                  endDrag();
                }}
              >
                <td className="sticky left-0 z-10 w-20 min-w-20 border-b border-r border-zinc-200 bg-white px-2 py-1 font-medium">
                  {room.number}
                  {!room.availableForReservation && (
                    <span className="ml-1 text-[10px] font-normal text-zinc-500 italic">n/a</span>
                  )}
                </td>
                {visibleDays.map((day, i) => {
                  const cell = shownCells[`${room.id}|${day.iso}`] ?? null;
                  // While dragging, the nights the stay would land on in the
                  // hovered room are tinted green (free) or red (blocked).
                  const dragSpan = dragging ? spans.get(dragging) : undefined;
                  const isDropPreview =
                    dropRoomId === room.id &&
                    dragSpan !== undefined &&
                    dragSpan.roomId !== room.id &&
                    dragSpan.isos.includes(day.iso);
                  const dropTint = isDropPreview ? (canDropOn(room.id) ? " bg-success-wash" : " bg-danger-wash") : "";

                  // The guest name is drawn once per bar, from the bar's first
                  // *rendered* day, exactly as wide as the bar's visible days —
                  // so it centers on the bar and ends in "…" when too long.
                  let labelWidth = 0;
                  if (cell && shownCells[`${room.id}|${visibleDays[i - 1]?.iso}`]?.reservationId !== cell.reservationId) {
                    let last = i;
                    while (
                      last + 1 < visibleDays.length &&
                      shownCells[`${room.id}|${visibleDays[last + 1].iso}`]?.reservationId === cell.reservationId
                    ) {
                      last++;
                    }
                    const lastCell = shownCells[`${room.id}|${visibleDays[last].iso}`];
                    // Minus the 4px inset (pl-1/pr-1) at a real check-in/out end.
                    labelWidth = (last - i + 1) * DAY_COL_PX - (cell.isStart ? 4 : 0) - (lastCell?.isEnd ? 4 : 0);
                  }

                  if (!cell) {
                    return (
                      <td
                        key={day.iso}
                        className={
                          "h-8 min-w-9 cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 " +
                          (day.isToday && !dropTint ? TODAY_CELL : "") +
                          dropTint +
                          dividerClass(day, i)
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
                          (day.isToday && !dropTint ? TODAY_CELL : "") +
                          (day.smenaLabel ? " border-l-2 border-l-rule-strong" : "") +
                          dropTint
                        }
                        onClick={() =>
                          setTarget({ mode: "edit", reservationId: cell.reservationId })
                        }
                      >
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", cell.reservationId);
                            setNotice(null);
                            setHover(null);
                            setDragging(cell.reservationId);
                          }}
                          onDragEnd={endDrag}
                          onMouseEnter={(e) => {
                            if (!dragging) openHover(cell.reservationId, e.currentTarget);
                          }}
                          onMouseLeave={scheduleHoverClose}
                          aria-label={`${cell.guestName}, ${calendarStatusLabel(cell.status, cell.paymentState)}`}
                          className={
                            // Squared-off bars with just a slight round on the
                            // stay's real check-in and check-out ends.
                            "relative h-6 cursor-grab text-center text-[10px] leading-6 active:cursor-grabbing " +
                            (dragging === cell.reservationId ? "opacity-40 " : "") +
                            calendarBlockClasses(cell.status, cell.paymentState) +
                            (cell.isStart ? " rounded-l-[3px]" : "") +
                            // Each day's piece reaches 1px under the next day's,
                            // so at fractional display scaling (e.g. 150%) the
                            // anti-aliased cell edges can't show as seams.
                            (cell.isEnd ? " rounded-r-[3px]" : " -mr-px")
                          }
                        >
                          {/* Name in capitals for quick reading, then the number of
                              guests; the name gives way ("…") before the count.
                              Raised above the bar's later day pieces, and click-
                              through so dragging/clicking still hits the bar. */}
                          {labelWidth > 0 && (
                            <span
                              className="pointer-events-none absolute inset-y-0 left-0 z-[5] flex items-center justify-center gap-1 px-1.5 tracking-[0.02em] uppercase"
                              style={{ width: labelWidth }}
                            >
                              <span className="min-w-0 truncate">{cell.guestName}</span>
                              {summaries[cell.reservationId] && (
                                <span className="shrink-0 opacity-85">
                                  · {summaries[cell.reservationId].adults + summaries[cell.reservationId].children}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hover && !dragging && !target && summaries[hover.id] && (
        <ReservationHoverCard
          summary={summaries[hover.id]}
          currency={currency}
          style={{
            left: hover.left,
            top: hover.top,
            width: HOVER_CARD_WIDTH,
            transform: hover.above ? "translateY(-100%)" : undefined,
          }}
          onMouseEnter={cancelHoverClose}
          onMouseLeave={scheduleHoverClose}
          onView={() => openFromHover("view", hover.id)}
          onEdit={() => openFromHover("edit", hover.id)}
          onDelete={() => {
            setConfirmDelete(hover.id);
            setHover(null);
          }}
        />
      )}

      {confirmDelete && summaries[confirmDelete] && (
        <ConfirmDeleteModal
          summary={summaries[confirmDelete]}
          currency={currency}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => removeReservation(confirmDelete)}
        />
      )}

      {confirmMove && (
        <ConfirmMoveModal
          guestName={spans.get(confirmMove.reservationId)?.guestName ?? ""}
          isos={spans.get(confirmMove.reservationId)?.isos ?? []}
          fromRoom={rooms.find((r) => r.id === spans.get(confirmMove.reservationId)?.roomId)?.number ?? ""}
          toRoom={rooms.find((r) => r.id === confirmMove.toRoomId)?.number ?? ""}
          onCancel={() => setConfirmMove(null)}
          onConfirm={() => {
            move(confirmMove);
            setConfirmMove(null);
          }}
        />
      )}

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

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function ConfirmMoveModal({
  guestName,
  isos,
  fromRoom,
  toRoom,
  onCancel,
  onConfirm,
}: {
  guestName: string;
  isos: string[];
  fromRoom: string;
  toRoom: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const nights = [...isos].sort();
  const checkIn = nights[0] ? new Date(`${nights[0]}T00:00:00.000Z`) : null;
  const checkOut = nights.length
    ? new Date(new Date(`${nights[nights.length - 1]}T00:00:00.000Z`).getTime() + 86400000)
    : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-deep-tide/50 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-move-title"
        className="relative z-[300] w-full max-w-md rounded-lg border-[1.5px] border-zinc-200 bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-move-title" className="mb-4 title-section">
          Change room?
        </h2>
        <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-500">Guest</dt>
          <dd className="font-medium">{guestName}</dd>
          <dt className="text-zinc-500">Stay</dt>
          <dd>
            {checkIn && checkOut ? `${DATE_FORMAT.format(checkIn)} → ${DATE_FORMAT.format(checkOut)}` : "—"}
            <span className="text-zinc-500">
              {" "}
              ({nights.length} {nights.length === 1 ? "night" : "nights"})
            </span>
          </dd>
          <dt className="text-zinc-500">Room</dt>
          <dd>
            <span className="text-zinc-500 line-through">{fromRoom}</span>
            <span className="mx-2">→</span>
            <span className="font-medium text-primary">{toRoom}</span>
          </dd>
        </dl>
        <p className="mb-6 text-sm text-zinc-500">Dates and price stay the same — only the room changes.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} autoFocus>
            Change room
          </Button>
        </div>
      </div>
    </div>
  );
}

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function shortDate(iso: string) {
  return SHORT_DATE.format(new Date(`${iso}T00:00:00.000Z`));
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** The stay at a glance: dates, guests split into adults and children, the
 * full price (stay + tourist tax) against what's been paid, and actions. */
function ReservationHoverCard({
  summary,
  currency,
  style,
  onMouseEnter,
  onMouseLeave,
  onView,
  onEdit,
  onDelete,
}: {
  summary: ReservationSummary;
  currency: string;
  style: React.CSSProperties;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const balance = summary.totalDue - summary.paid;
  const money = (n: number) => formatCurrency(n, currency);

  return (
    <div
      role="dialog"
      aria-label={`${summary.guestName}, ${summary.reservationNumber}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      className="fixed z-[180] rounded-lg border-[1.5px] border-zinc-200 bg-white p-4 text-[14px] leading-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[16px] leading-5 font-bold tracking-[0.02em] text-zinc-900 uppercase">
            {summary.guestName}
          </p>
          <p className="font-mono text-[13px] text-zinc-500">{summary.reservationNumber}</p>
        </div>
        <StatusTag status={summary.status} />
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-label self-center text-zinc-500">Stay</dt>
        <dd>
          {shortDate(summary.checkIn)} → {shortDate(summary.checkOut)}
          <span className="text-zinc-500"> · {plural(summary.nights, "night", "nights")}</span>
        </dd>
        <dt className="text-label self-center text-zinc-500">Guests</dt>
        <dd>
          {plural(summary.adults, "adult", "adults")}
          {summary.children > 0 && ` · ${plural(summary.children, "child", "children")}`}
        </dd>
        <dt className="text-label self-center text-zinc-500">Full price</dt>
        <dd className="font-mono">{money(summary.totalDue)}</dd>
        <dt className="text-label self-center text-zinc-500">Paid</dt>
        <dd className="font-mono">
          {money(summary.paid)}
          {balance > 0.005 && <span className="text-danger-ink"> · {money(balance)} due</span>}
          {balance < -0.005 && <span className="text-warning-ink"> · {money(-balance)} overpaid</span>}
        </dd>
      </dl>

      <div className="mt-3 flex justify-end gap-1 border-t-[1.5px] border-zinc-200 pt-3">
        <HoverAction icon="eye" label="View" onClick={onView} />
        <HoverAction icon="pen" label="Edit" onClick={onEdit} />
        <HoverAction icon="trash" label="Delete" onClick={onDelete} danger />
      </div>
    </div>
  );
}

function HoverAction({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-transparent text-zinc-500 transition-colors hover:border-zinc-200 " +
        (danger ? "hover:bg-danger-wash hover:text-danger-ink" : "hover:bg-zinc-50 hover:text-zinc-900")
      }
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

/** Permanent delete, confirmed: names the stay and warns when payments go
 * with it (Cancel would keep the record). */
function ConfirmDeleteModal({
  summary,
  currency,
  onCancel,
  onConfirm,
}: {
  summary: ReservationSummary;
  currency: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-deep-tide/50 p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="relative z-[300] w-full max-w-md rounded-lg border-[1.5px] border-zinc-200 bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-delete-title" className="title-section mb-3">
          Delete this reservation?
        </h2>
        <p className="text-[15px] leading-5">
          <span className="font-bold uppercase">{summary.guestName}</span> ({summary.reservationNumber}),{" "}
          {shortDate(summary.checkIn)} → {shortDate(summary.checkOut)}, is removed for good.
        </p>
        {summary.paymentCount > 0 && (
          <p className="mt-2 text-[15px] leading-5 text-danger-ink">
            Its {plural(summary.paymentCount, "payment", "payments")} ({formatCurrency(summary.paid, currency)}) will be
            deleted too.
          </p>
        )}
        <p className="mt-2 text-[14px] leading-5 text-zinc-500">
          To keep the record, open the reservation and cancel it instead.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} autoFocus>
            Keep
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-label inline-flex h-9 items-center rounded-full border-[1.5px] border-danger bg-danger px-5 font-bold text-white hover:brightness-95"
          >
            Delete reservation
          </button>
        </div>
      </div>
    </div>
  );
}
