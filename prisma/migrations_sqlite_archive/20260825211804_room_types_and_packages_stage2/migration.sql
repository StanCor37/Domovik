/*
  Warnings:

  - Made the column `roomTypeId` on table `price_list_entries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `roomTypeId` on table `rooms` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_price_list_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "product" TEXT NOT NULL,
    "pricePerAdult" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    CONSTRAINT "price_list_entries_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_price_list_entries" ("date", "id", "pricePerAdult", "product", "roomTypeId", "updatedAt") SELECT "date", "id", "pricePerAdult", "product", "roomTypeId", "updatedAt" FROM "price_list_entries";
DROP TABLE "price_list_entries";
ALTER TABLE "new_price_list_entries" RENAME TO "price_list_entries";
CREATE UNIQUE INDEX "price_list_entries_date_product_roomTypeId_key" ON "price_list_entries"("date", "product", "roomTypeId");
CREATE TABLE "new_rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "floor" TEXT,
    "bedCount" INTEGER NOT NULL DEFAULT 2,
    "extraBedCapacity" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "availableForReservation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_rooms" ("active", "availableForReservation", "bedCount", "createdAt", "description", "extraBedCapacity", "floor", "id", "number", "roomTypeId", "updatedAt") SELECT "active", "availableForReservation", "bedCount", "createdAt", "description", "extraBedCapacity", "floor", "id", "number", "roomTypeId", "updatedAt" FROM "rooms";
DROP TABLE "rooms";
ALTER TABLE "new_rooms" RENAME TO "rooms";
CREATE UNIQUE INDEX "rooms_number_key" ON "rooms"("number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
