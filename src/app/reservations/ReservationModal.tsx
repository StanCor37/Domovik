"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
  TAX_CATEGORIES,
  TAX_CATEGORY_LABELS,
  type PriceCategory,
  type TaxCategory,
} from "@/lib/guestCategories";
import type { Product } from "@/lib/products";
import { formatCurrency } from "@/lib/currency";
import { RESERVATION_STATUSES, STATUS_LABELS, type ReservationStatus } from "@/lib/reservations";
import { Button, Field } from "@/components/ui";
import {
  addPayment,
  cancelReservation,
  createReservation,
  deletePayment,
  getReservation,
  previewPrice,
  updateReservation,
} from "./actions";
import type { ConflictInfo, GuestInput, PaymentRecord, PricePreviewResult } from "./types";

export type RoomOption = { id: string; number: string; availableForReservation: boolean };
export type PackageOption = { code: string; label: string };

export type ModalTarget =
  | { mode: "create"; roomId: string; checkIn: string; checkOut: string }
  | { mode: "edit"; reservationId: string };

function newGuest(priceCategory: PriceCategory = "ADULT", taxCategory: TaxCategory = "ADULT"): GuestInput {
  return { priceCategory, taxCategory };
}

export function ReservationModal({
  target,
  rooms,
  packages,
  paymentMethods,
  currency = "EUR",
  onClose,
}: {
  target: ModalTarget;
  rooms: RoomOption[];
  packages: PackageOption[];
  paymentMethods: string[];
  currency?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const money = (amount: number) => formatCurrency(amount, currency);
  const [loading, setLoading] = useState(target.mode === "edit");
  const reservationId = target.mode === "edit" ? target.reservationId : null;
  const [reservationNumber, setReservationNumber] = useState<string | null>(null);

  const [roomId, setRoomId] = useState(target.mode === "create" ? target.roomId : "");
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [checkIn, setCheckIn] = useState(target.mode === "create" ? target.checkIn : "");
  const [checkOut, setCheckOut] = useState(target.mode === "create" ? target.checkOut : "");
  const [product, setProduct] = useState<Product>(packages[0]?.code ?? "");
  const [guests, setGuests] = useState<GuestInput[]>([newGuest()]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [finalAmountManual, setFinalAmountManual] = useState(false);
  const [status, setStatus] = useState<ReservationStatus>("PREBOOKED");
  const [notes, setNotes] = useState("");

  const [preview, setPreview] = useState<PricePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [isSaving, startSaving] = useTransition();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] ?? "");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSavingPayment, startSavingPayment] = useTransition();

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isCanceling, startCanceling] = useTransition();

  async function refetchReservation() {
    if (!reservationId) return;
    const r = await getReservation(reservationId);
    if (r) setPayments(r.payments);
  }

  useEffect(() => {
    if (target.mode !== "edit") return;
    let cancelled = false;
    getReservation(target.reservationId).then((r) => {
      if (cancelled || !r) return;
      setRoomId(r.roomId);
      setGuestName(r.guestName);
      setGuestContact(r.guestContact ?? "");
      setCheckIn(r.checkIn);
      setCheckOut(r.checkOut);
      setProduct(r.product);
      setGuests(r.guests.length > 0 ? r.guests : [newGuest()]);
      setDiscountPercent(r.discountPercent);
      setDiscountAmount(r.discountAmount);
      setFinalAmount(r.finalAmount);
      setFinalAmountManual(true);
      setStatus(r.status);
      setNotes(r.notes ?? "");
      setReservationNumber(r.reservationNumber);
      setPayments(r.payments);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  // Live price preview whenever pricing-relevant fields change. Room matters
  // now too — the price list is scoped per room type.
  useEffect(() => {
    if (!roomId || !checkIn || !checkOut || guests.length === 0) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-dependency-change loading flag
    setPreviewLoading(true);
    previewPrice({ roomId, checkIn, checkOut, product, guests })
      .then((result) => {
        if (cancelled) return;
        setPreview(result);
        if (!finalAmountManual) {
          setFinalAmount(result.baseAmount - discountAmount);
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, checkIn, checkOut, product, JSON.stringify(guests)]);

  function handleDiscountPercentChange(value: number) {
    setDiscountPercent(value);
    const base = preview?.baseAmount ?? 0;
    const amount = Math.round(base * (value / 100) * 100) / 100;
    setDiscountAmount(amount);
    if (!finalAmountManual) setFinalAmount(base - amount);
  }

  function handleDiscountAmountChange(value: number) {
    setDiscountAmount(value);
    const base = preview?.baseAmount ?? 0;
    const percent = base > 0 ? Math.round((value / base) * 100 * 100) / 100 : 0;
    setDiscountPercent(percent);
    if (!finalAmountManual) setFinalAmount(base - value);
  }

  function handleFinalAmountChange(value: number) {
    setFinalAmount(value);
    setFinalAmountManual(true);
  }

  function updateGuest(index: number, patch: Partial<GuestInput>) {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function removeGuest(index: number) {
    setGuests((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setError(null);
    setConflict(null);

    if (!roomId) {
      setError("Please choose a room.");
      return;
    }

    const input = {
      roomId,
      guestName,
      guestContact: guestContact || null,
      checkIn,
      checkOut,
      product,
      guests,
      discountPercent,
      discountAmount,
      finalAmountOverride: finalAmount,
      status,
      notes: notes || null,
    };

    startSaving(async () => {
      const result =
        target.mode === "edit" && reservationId
          ? await updateReservation(reservationId, input)
          : await createReservation(input);

      if (!result.ok) {
        setError(result.error);
        if (result.conflict) setConflict(result.conflict);
        return;
      }

      router.refresh();
      onClose();
    });
  }

  function handleAddPayment() {
    setPaymentError(null);
    if (!reservationId) return;

    const amount = Number(paymentAmount);
    if (!(amount > 0)) {
      setPaymentError("Enter a payment amount greater than 0.");
      return;
    }
    if (!paymentMethod) {
      setPaymentError("Choose a payment method.");
      return;
    }

    startSavingPayment(async () => {
      const result = await addPayment(reservationId, {
        amount,
        method: paymentMethod,
        date: paymentDate,
        note: paymentNote || null,
      });
      if (!result.ok) {
        setPaymentError(result.error);
        return;
      }
      setPaymentAmount("");
      setPaymentNote("");
      await refetchReservation();
    });
  }

  function handleDeletePayment(paymentId: string) {
    startSavingPayment(async () => {
      await deletePayment(paymentId);
      await refetchReservation();
    });
  }

  function handleCancelReservation() {
    if (!reservationId) return;
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    startCanceling(async () => {
      const result = await cancelReservation(reservationId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDue = finalAmount + (preview?.taxAmount ?? 0);
  const balanceDue = totalDue - totalPaid;

  const roomOptions =
    target.mode === "edit" && roomId && !rooms.some((r) => r.id === roomId)
      ? rooms
      : rooms.filter((r) => r.availableForReservation || r.id === roomId);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative z-[300] flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {target.mode === "edit" ? "Edit Reservation" : "New Reservation"}
            {reservationNumber && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                {reservationNumber}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Room">
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="input"
                >
                  <option value="">Select a room</option>
                  {roomOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.number}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Package">
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="input"
                >
                  {packages.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Guest name">
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Contact">
                <input
                  value={guestContact}
                  onChange={(e) => setGuestContact(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Check-in">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Check-out">
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReservationStatus)}
                  className="input"
                >
                  {RESERVATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Guests</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setGuests((prev) => [...prev, newGuest()])}
                >
                  + Add guest
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {guests.map((guest, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={guest.priceCategory}
                      onChange={(e) =>
                        updateGuest(index, { priceCategory: e.target.value as PriceCategory })
                      }
                      className="input flex-1"
                    >
                      {PRICE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {PRICE_CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={guest.taxCategory}
                      onChange={(e) =>
                        updateGuest(index, { taxCategory: e.target.value as TaxCategory })
                      }
                      className="input flex-1"
                    >
                      {TAX_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          Tax: {TAX_CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeGuest(index)}
                      disabled={guests.length === 1}
                      className="disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm">
              {previewLoading ? (
                <p className="text-zinc-500">Calculating…</p>
              ) : preview ? (
                <div className="flex flex-col gap-1">
                  <p>
                    {preview.nightCount} night{preview.nightCount === 1 ? "" : "s"} · base{" "}
                    {money(preview.baseAmount)} · tax {money(preview.taxAmount)}
                  </p>
                  {preview.missingPriceDates.length > 0 && (
                    <p className="flex items-start gap-1.5 font-medium text-warning-ink">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                      No price entered for: {preview.missingPriceDates.join(", ")}. Those
                      nights priced as 0 — set the final amount manually or fill in the{" "}
                      Price List.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-zinc-500">Set check-in/check-out to see pricing.</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Discount %">
                <input
                  type="number"
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => handleDiscountPercentChange(Number(e.target.value))}
                  className="input"
                />
              </Field>
              <Field label="Discount amount">
                <input
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => handleDiscountAmountChange(Number(e.target.value))}
                  className="input"
                />
              </Field>
              <Field label="Final amount">
                <input
                  type="number"
                  step="0.01"
                  value={finalAmount}
                  onChange={(e) => handleFinalAmountChange(Number(e.target.value))}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input"
              />
            </Field>

            {reservationId ? (
              <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">Payments</span>
                  <span className="text-sm text-zinc-500">
                    Due {money(totalDue)} · Paid {money(totalPaid)} ·{" "}
                    <span className={balanceDue > 0 ? "font-semibold text-danger-ink" : "font-normal text-zinc-500"}>
                      Balance {money(balanceDue)}
                    </span>
                  </span>
                </div>

                {payments.length > 0 && (
                  <ul className="flex flex-col gap-1 text-sm">
                    {payments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span>
                          {p.date} · {money(p.amount)} · {p.method}
                          {p.note ? ` · ${p.note}` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p.id)}
                          disabled={isSavingPayment}
                          className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500">Amount</span>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input w-24"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500">Method</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-zinc-500">Date</span>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="input"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1 text-xs">
                    <span className="text-zinc-500">Note</span>
                    <input
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="deposit / balance / tax"
                      className="input"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddPayment}
                    disabled={isSavingPayment}
                    className="disabled:opacity-60"
                  >
                    {isSavingPayment ? "Saving…" : "+ Add payment"}
                  </Button>
                </div>
                {paymentError && <p className="error-text">{paymentError}</p>}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Save the reservation before recording payments.
              </p>
            )}

            {error && (
              <div className="error-box">
                <p>{error}</p>
                {conflict && (
                  <p className="mt-1">
                    Conflicts with {conflict.reservationNumber} ({conflict.guestName}),{" "}
                    {conflict.checkIn} to {conflict.checkOut}.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <div>
                {reservationId && status !== "CANCELED" && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleCancelReservation}
                      disabled={isCanceling}
                      className="disabled:opacity-60"
                    >
                      {isCanceling
                        ? "Canceling…"
                        : confirmingCancel
                          ? "Click again to confirm"
                          : "Cancel Reservation"}
                    </Button>
                    {confirmingCancel && !isCanceling && (
                      <button
                        type="button"
                        onClick={() => setConfirmingCancel(false)}
                        className="text-xs text-zinc-500 hover:underline"
                      >
                        Never mind
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
