-- CreateTable
CREATE TABLE "price_list_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "product" TEXT NOT NULL,
    "pricePerAdult" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "price_list_entries_date_product_key" ON "price_list_entries"("date", "product");
