-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reservationId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "smenaLengthNights" INTEGER NOT NULL DEFAULT 9,
    "taxRateAdult" REAL NOT NULL DEFAULT 1,
    "taxRateChild7to14" REAL NOT NULL DEFAULT 0.5,
    "taxRateOtherChild" REAL NOT NULL DEFAULT 0,
    "paymentMethods" TEXT NOT NULL DEFAULT 'Cash,Card,Bank Transfer',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_settings" ("id", "smenaLengthNights", "taxRateAdult", "taxRateChild7to14", "taxRateOtherChild", "updatedAt") SELECT "id", "smenaLengthNights", "taxRateAdult", "taxRateChild7to14", "taxRateOtherChild", "updatedAt" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
