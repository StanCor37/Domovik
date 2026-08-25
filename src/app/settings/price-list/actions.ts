"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isWithinSeason } from "@/lib/season";
import type { ImportState } from "./types";

const PROPERTY_ID = "singleton-property";
const CELL_NAME = /^price-(\d{4}-\d{2}-\d{2})-(.+)$/;

// --- Grid entry (per-month save) ---

export async function savePriceListMonth(formData: FormData) {
  const roomTypeId = String(formData.get("roomTypeId") ?? "");
  if (!roomTypeId) throw new Error("Room type is required.");

  const packages = await prisma.package.findMany({ select: { code: true } });
  const validCodes = new Set(packages.map((p) => p.code));

  const upserts: { date: Date; product: string; pricePerAdult: number }[] = [];
  const deletes: { date: Date; product: string }[] = [];

  for (const [key, value] of formData.entries()) {
    const match = CELL_NAME.exec(key);
    if (!match) continue;
    const [, iso, product] = match;
    if (!validCodes.has(product)) continue;
    const raw = typeof value === "string" ? value.trim() : "";
    const date = new Date(`${iso}T00:00:00.000Z`);

    if (raw === "") {
      deletes.push({ date, product });
      continue;
    }
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`Invalid price for ${iso} ${product}: "${raw}"`);
    }
    upserts.push({ date, product, pricePerAdult: price });
  }

  await prisma.$transaction([
    ...upserts.map((entry) =>
      prisma.priceListEntry.upsert({
        where: {
          date_product_roomTypeId: { date: entry.date, product: entry.product, roomTypeId },
        },
        update: { pricePerAdult: entry.pricePerAdult },
        create: { ...entry, roomTypeId },
      })
    ),
    ...deletes.map((entry) =>
      prisma.priceListEntry.deleteMany({
        where: { date: entry.date, product: entry.product, roomTypeId },
      })
    ),
  ]);

  revalidatePath("/settings/price-list");
}

// --- Excel import ---

function parseDateCell(value: ExcelJS.CellValue): Date | null {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
    );
  }
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (!match) return null;
    const [, y, m, d] = match;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "number") {
    // Excel serial date (days since 1899-12-30).
    const epoch = Date.UTC(1899, 11, 30);
    return new Date(epoch + value * 86400000);
  }
  return null;
}

function parsePriceCell(value: ExcelJS.CellValue): number | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(num) || num < 0) return "invalid";
  return num;
}

export async function importPriceList(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  const file = formData.get("file");
  const mode = formData.get("mode");
  const roomTypeId = formData.get("roomTypeId");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Please choose a file to upload." };
  }
  if (mode !== "replace" && mode !== "fill-gaps") {
    return { status: "error", message: "Please choose an import mode." };
  }
  if (typeof roomTypeId !== "string" || !roomTypeId) {
    return { status: "error", message: "Please choose a room type." };
  }

  const [property, roomType, packages] = await Promise.all([
    prisma.property.findUnique({ where: { id: PROPERTY_ID } }),
    prisma.roomType.findUnique({ where: { id: roomTypeId } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!property) {
    return { status: "error", message: "Configure the property first." };
  }
  if (!roomType) {
    return { status: "error", message: "That room type no longer exists." };
  }
  if (packages.length === 0) {
    return { status: "error", message: "Configure at least one package first." };
  }
  const packageCodes = packages.map((p) => p.code);

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return {
      status: "error",
      message: "Could not read that file — is it a valid .xlsx file?",
    };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { status: "error", message: "The uploaded file has no sheet." };
  }

  const headerRow = sheet.getRow(1);
  const columnIndex: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const label = String(cell.value ?? "").trim();
    if (label) columnIndex[label] = colNumber;
  });

  const missingHeaders = ["Date", ...packageCodes].filter(
    (h) => !(h in columnIndex)
  );
  if (missingHeaders.length > 0) {
    return {
      status: "error",
      message: `Missing column(s): ${missingHeaders.join(", ")}. Expected headers: Date, ${packageCodes.join(", ")}.`,
    };
  }

  const errors: string[] = [];
  const seenDates = new Set<string>();
  const entries: { date: Date; product: string; pricePerAdult: number }[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const dateCell = row.getCell(columnIndex["Date"]).value;
    if (dateCell === null || dateCell === undefined || dateCell === "") return; // blank row

    const date = parseDateCell(dateCell);
    if (!date) {
      errors.push(`Row ${rowNumber}: invalid date "${dateCell}"`);
      return;
    }
    const iso = date.toISOString().slice(0, 10);

    if (seenDates.has(iso)) {
      errors.push(`Row ${rowNumber}: duplicate date ${iso}`);
      return;
    }
    seenDates.add(iso);

    if (!isWithinSeason(date, property)) {
      errors.push(
        `Row ${rowNumber}: ${iso} is outside the configured season (${property.seasonStartMonthDay} to ${property.seasonEndMonthDay})`
      );
      return;
    }

    for (const product of packageCodes) {
      const cellValue = row.getCell(columnIndex[product]).value;
      const price = parsePriceCell(cellValue);
      if (price === "invalid") {
        errors.push(
          `Row ${rowNumber}: ${product} price "${cellValue}" is not a valid number`
        );
        continue;
      }
      if (price !== null) {
        entries.push({ date, product, pricePerAdult: price });
      }
    }
  });

  if (errors.length > 0) {
    return {
      status: "error",
      message: `Import failed with ${errors.length} error(s). Nothing was changed.`,
      errors: errors.slice(0, 20),
    };
  }

  if (entries.length === 0) {
    return { status: "error", message: "No valid price rows found in the file." };
  }

  if (mode === "replace") {
    await prisma.$transaction([
      prisma.priceListEntry.deleteMany({ where: { roomTypeId } }),
      prisma.priceListEntry.createMany({
        data: entries.map((e) => ({ ...e, roomTypeId })),
      }),
    ]);
  } else {
    const existing = await prisma.priceListEntry.findMany({
      where: { roomTypeId },
      select: { date: true, product: true },
    });
    const existingKeys = new Set(
      existing.map((e) => `${e.date.toISOString()}|${e.product}`)
    );
    const toCreate = entries
      .filter((e) => !existingKeys.has(`${e.date.toISOString()}|${e.product}`))
      .map((e) => ({ ...e, roomTypeId }));
    if (toCreate.length > 0) {
      await prisma.priceListEntry.createMany({ data: toCreate });
    }
  }

  revalidatePath("/settings/price-list");

  return {
    status: "success",
    message: `Imported ${entries.length} price entr${entries.length === 1 ? "y" : "ies"} for ${roomType.name} (${mode === "replace" ? "replaced all existing entries for this room type" : "filled gaps only"}).`,
  };
}
