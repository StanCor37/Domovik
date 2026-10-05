-- Partially canceled stays keep the originally booked check-out here.
ALTER TABLE "reservations" ADD COLUMN "originalCheckOut" TIMESTAMP(3);
