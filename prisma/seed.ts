import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.property.upsert({
    where: { id: "singleton-property" },
    update: {},
    create: {
      id: "singleton-property",
      name: "My Hotel",
      currency: "EUR",
      timezone: "Europe/Belgrade",
      seasonStartMonthDay: "05-01",
      seasonEndMonthDay: "10-31",
    },
  });

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      smenaLengthNights: 9,
    },
  });

  console.log("Seeded Property and Settings. Add rooms via Settings > Rooms.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
