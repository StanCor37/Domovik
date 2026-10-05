import type { Product } from "@/lib/products";
import type { PriceCategory, TaxCategory } from "@/lib/guestCategories";
import type { ReservationStatus } from "@/lib/reservations";

export type GuestInput = {
  priceCategory: PriceCategory;
  taxCategory: TaxCategory;
};

export type PricePreviewInput = {
  roomId: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  product: Product;
  guests: GuestInput[];
};

export type PricePreviewResult = {
  nightCount: number;
  baseAmount: number;
  taxAmount: number;
  missingPriceDates: string[];
};

export type ReservationInput = {
  roomId: string;
  guestName: string;
  guestContact: string | null;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  product: Product;
  guests: GuestInput[];
  discountPercent: number;
  discountAmount: number;
  finalAmountOverride: number | null;
  status: ReservationStatus;
  notes: string | null;
  // Only when switching to Partially Canceled (leaving early): charge just
  // the nights stayed, or keep the final amount for the user to adjust.
  earlyLeavePricing?: EarlyLeavePricing;
};

export type EarlyLeavePricing = "NIGHTS_STAYED" | "MANUAL";

export type ConflictInfo = {
  reservationNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
};

export type SaveReservationResult =
  | { ok: true; reservationId: string; reservationNumber: string }
  | { ok: false; error: string; conflict?: ConflictInfo };

export type PaymentRecord = {
  id: string;
  amount: number;
  method: string;
  date: string; // ISO date
  note: string | null;
};

export type PaymentInput = {
  amount: number;
  method: string;
  date: string; // ISO date
  note: string | null;
};

export type ReservationDetail = {
  id: string;
  reservationNumber: string;
  roomId: string;
  guestName: string;
  guestContact: string | null;
  checkIn: string;
  checkOut: string;
  product: Product;
  guests: GuestInput[];
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
  baseAmount: number;
  taxAmount: number;
  status: ReservationStatus;
  notes: string | null;
  payments: PaymentRecord[];
  // Partially canceled stays: the check-out originally booked (checkOut is
  // then the actual, earlier departure).
  originalCheckOut: string | null;
};
