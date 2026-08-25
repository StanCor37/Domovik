import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateToIso, getSeasonRange } from "@/lib/season";

const PROPERTY_ID = "singleton-property";

export async function GET(request: NextRequest) {
  const [property, packages] = await Promise.all([
    prisma.property.findUnique({ where: { id: PROPERTY_ID } }),
    prisma.package.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!property) {
    return NextResponse.json(
      { error: "Configure the property first." },
      { status: 400 }
    );
  }
  if (packages.length === 0) {
    return NextResponse.json(
      { error: "Configure at least one package first." },
      { status: 400 }
    );
  }

  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Price List");
  sheet.columns = [
    { header: "Date", key: "date", width: 14 },
    ...packages.map((p) => ({ header: p.code, key: p.code, width: 10 })),
  ];

  const { start, end } = getSeasonRange(property, year);
  for (
    let d = new Date(start);
    d <= end;
    d = new Date(d.getTime() + 86400000)
  ) {
    sheet.addRow({ date: dateToIso(d) });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="price-list-template-${year}.xlsx"`,
    },
  });
}
