/**
 * Fills the calendar with realistic demo reservations, so the calendar,
 * ledger and dashboard can be tried out with a busy hotel. Demo data is laid
 * out per PERIOD (peak summer with every room busy, October half full).
 *
 *   npm run seed:demo           add demo reservations for every period not yet seeded
 *   npm run seed:demo -- --clean   remove every demo reservation again
 *
 * Every demo reservation's notes start with DEMO_TAG — that is how --clean
 * finds them, and how a re-run sees which periods already have demo data.
 * Existing (non-demo) reservations are never touched: demo stays are placed
 * around them.
 */
import { PrismaClient } from "@prisma/client";
import { PRICE_CATEGORY_MULTIPLIERS, type PriceCategory, type TaxCategory } from "../src/lib/guestCategories";
import { OCCUPYING_STATUSES } from "../src/lib/reservations";

const prisma = new PrismaClient();

const DEMO_TAG = "[DEMO]";
const YEAR = 2026;
const DAY = 86400000;

type Period = {
  key: string;
  start: Date;
  /** Stays begin before this date... */
  end: Date;
  /** ...and check out no later than this one. */
  lastCheckOut: Date;
  /** Share of the bookable rooms that get stays in this period. */
  roomShare: number;
  /** RNG seed, so each period regenerates identically after --clean. */
  seed: number;
};

const PERIODS: Period[] = [
  {
    key: "peak (late June – early September)",
    start: utc(`${YEAR}-06-24`),
    end: utc(`${YEAR}-09-06`),
    lastCheckOut: utc(`${YEAR}-09-12`),
    roomShare: 1,
    seed: 20260701,
  },
  {
    key: "October (half the rooms)",
    start: utc(`${YEAR}-09-29`),
    end: utc(`${YEAR}-10-26`),
    lastCheckOut: utc(`${YEAR}-10-26`), // season end — nothing may run past it
    roomShare: 0.5,
    seed: 20261001,
  },
];

// Booking and payment dates are never later than this, even for future stays.
const TODAY = utc(new Date().toISOString().slice(0, 10));

// Deterministic RNG (mulberry32), reseeded per period.
let rngState = 0;
function rand() {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
function weighted<T>(options: [T, number][]): T {
  let r = rand() * options.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of options) if ((r -= w) < 0) return v;
  return options[options.length - 1][0];
}
const round2 = (n: number) => Math.round(n * 100) / 100;

function utc(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const minDate = (a: Date, b: Date) => (a < b ? a : b);

const MALE = ["Marko", "Nikola", "Stefan", "Luka", "Milan", "Aleksandar", "Nemanja", "Dragan", "Zoran", "Miloš", "Dušan", "Vladimir", "Bojan", "Goran", "Ivan", "Đorđe", "Vuk", "Petar", "Uroš", "Branislav", "Dejan", "Željko", "Slobodan", "Miroslav", "Predrag", "Srđan", "Lazar", "Filip", "Ognjen", "Radovan"];
const FEMALE = ["Jelena", "Milica", "Ana", "Marija", "Jovana", "Ivana", "Snežana", "Dragana", "Tamara", "Katarina", "Teodora", "Sanja", "Gordana", "Vesna", "Nataša", "Biljana", "Mirjana", "Ljiljana", "Tijana", "Jasmina", "Svetlana", "Nevena", "Dušica", "Maja", "Branka", "Danijela", "Aleksandra", "Sara", "Anđela", "Višnja"];
const SURNAMES = ["Jovanović", "Petrović", "Nikolić", "Marković", "Đorđević", "Stojanović", "Ilić", "Stanković", "Pavlović", "Milošević", "Popović", "Kostić", "Živković", "Todorović", "Ristić", "Savić", "Mitrović", "Lazić", "Radovanović", "Vasić", "Simić", "Obradović", "Kovačević", "Tomić", "Janković", "Đurić", "Milenković", "Cvetković", "Vuković", "Pešić", "Božić", "Lukić", "Čolić", "Šarić", "Mladenović", "Babić", "Filipović", "Zdravković", "Gajić", "Matić"];

const TRANSLIT: Record<string, string> = { č: "c", ć: "c", š: "s", ž: "z", đ: "dj", Č: "C", Ć: "C", Š: "S", Ž: "Z", Đ: "Dj" };
const ascii = (s: string) => s.replace(/[čćšžđČĆŠŽĐ]/g, (c) => TRANSLIT[c]);

function guestContact(first: string, last: string) {
  if (rand() < 0.65) {
    return `+381 6${pick(["0", "1", "2", "3", "4", "5", "6", "9"])} ${int(100, 999)} ${int(1000, 9999)}`;
  }
  const domain = pick(["gmail.com", "gmail.com", "yahoo.com", "hotmail.com", "eunet.rs", "mts.rs"]);
  return `${ascii(first).toLowerCase()}.${ascii(last).toLowerCase()}${rand() < 0.4 ? int(1, 99) : ""}@${domain}`;
}

const NOTES = ["Dolazak kasno uveče", "Molim krevetac za bebu", "Stalni gosti", "Soba sa pogledom na more ako je moguće", "Vegetarijanska ishrana", "Dolaze kolima, potreban parking", "Rani dolazak oko 10h", "Alergija na orašaste plodove"];

function guestsFor(beds: number): { priceCategory: PriceCategory; taxCategory: TaxCategory }[] {
  const adults = beds === 1 || rand() < 0.08 ? 1 : 2;
  const maxKids = Math.max(0, beds - adults);
  const kids = maxKids === 0 ? 0 : weighted<number>([[0, 3], [1, 3], [2, 3], [3, 1]].filter(([k]) => k <= maxKids) as [number, number][]);
  const list: { priceCategory: PriceCategory; taxCategory: TaxCategory }[] = [];
  for (let i = 0; i < adults; i++) list.push({ priceCategory: "ADULT", taxCategory: "ADULT" });
  for (let i = 0; i < kids; i++) {
    list.push(
      weighted<{ priceCategory: PriceCategory; taxCategory: TaxCategory }>([
        [{ priceCategory: "CHILD_70", taxCategory: "CHILD_7_14" }, 4],
        [{ priceCategory: "CHILD_50", taxCategory: "OTHER_CHILD" }, 3],
        [{ priceCategory: "FREE", taxCategory: "OTHER_CHILD" }, 2],
        [{ priceCategory: "ADULT", taxCategory: "CHILD_7_14" }, 1],
      ])
    );
  }
  return list;
}

async function clean() {
  const { count } = await prisma.reservation.deleteMany({ where: { notes: { startsWith: DEMO_TAG } } });
  // Give the numbers back, so the next real reservation continues right after
  // the highest number still in use.
  const yy = String(YEAR).slice(-2);
  const remaining = await prisma.reservation.findMany({
    where: { reservationNumber: { endsWith: `/${yy}` } },
    select: { reservationNumber: true },
  });
  const highest = Math.max(0, ...remaining.map((r) => Number(r.reservationNumber.slice(2, -3)) || 0));
  await prisma.reservationSequence.updateMany({ where: { year: YEAR }, data: { lastNumber: highest } });
  console.log(`Removed ${count} demo reservations (their guests and payments went with them). Numbering continues after R-${String(highest).padStart(3, "0")}/${yy}.`);
}

async function seed() {
  const [allRooms, settings, prices, existing] = await Promise.all([
    prisma.room.findMany({ where: { active: true, availableForReservation: true }, orderBy: { number: "asc" } }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.priceListEntry.findMany({ where: { product: "FB" } }),
    prisma.reservation.findMany({ where: { status: { in: [...OCCUPYING_STATUSES] } } }),
  ]);
  const taxRates: Record<TaxCategory, number> = {
    ADULT: settings?.taxRateAdult ?? 1,
    CHILD_7_14: settings?.taxRateChild7to14 ?? 0.5,
    OTHER_CHILD: settings?.taxRateOtherChild ?? 0,
  };
  const paymentMethods = (settings?.paymentMethods ?? "Cash,Card,Bank Transfer").split(",").map((m) => m.trim()).filter(Boolean);
  const priceByRoomTypeDay = new Map(prices.map((p) => [`${p.roomTypeId}|${iso(p.date)}`, p.pricePerAdult]));
  // The price list may not cover every demo night (e.g. the late-June edge,
  // or October); price those nights at the room type's average instead of free.
  const avgByRoomType = new Map<string, number>();
  for (const rt of new Set(prices.map((p) => p.roomTypeId))) {
    const rtPrices = prices.filter((p) => p.roomTypeId === rt).map((p) => p.pricePerAdult);
    avgByRoomType.set(rt, round2(rtPrices.reduce((a, b) => a + b, 0) / rtPrices.length));
  }

  type Draft = {
    roomId: string;
    guestName: string;
    guestContact: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
    notes: string;
    guests: { priceCategory: PriceCategory; taxCategory: TaxCategory }[];
    baseAmount: number;
    discountPercent: number;
    discountAmount: number;
    finalAmount: number;
    taxAmount: number;
    payments: { amount: number; method: string; date: Date; note: string | null }[];
    createdAt: Date;
  };
  const drafts: Draft[] = [];

  for (const period of PERIODS) {
    const alreadySeeded = await prisma.reservation.count({
      where: { notes: { startsWith: DEMO_TAG }, checkIn: { gte: period.start, lt: period.end } },
    });
    if (alreadySeeded > 0) {
      console.log(`Skipping ${period.key}: ${alreadySeeded} demo reservations already there.`);
      continue;
    }
    rngState = period.seed;
    const before = drafts.length;

    // A partial period picks a random subset of rooms; the rest stay empty.
    let rooms = allRooms;
    if (period.roomShare < 1) {
      const shuffled = [...allRooms].sort(() => rand() - 0.5);
      rooms = shuffled.slice(0, Math.round(allRooms.length * period.roomShare));
    }

    for (const room of rooms) {
      const blocked = existing
        .filter((r) => r.roomId === room.id)
        .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
      let cursor = addDays(period.start, int(0, 6));

      while (cursor < period.end) {
        const nights = weighted<number>([[9, 30], [7, 25], [10, 8], [5, 10], [4, 9], [3, 8], [6, 7], [14, 3]]);
        const checkIn = cursor;
        const checkOut = addDays(checkIn, nights);
        if (checkOut > period.lastCheckOut) break;

        // Never overlap a real reservation — resume right after it instead.
        const clash = blocked.find((b) => b.checkIn < checkOut && b.checkOut > checkIn);
        if (clash) {
          cursor = addDays(clash.checkOut, int(0, 1));
          continue;
        }

        const first = rand() < 0.5 ? pick(MALE) : pick(FEMALE);
        const last = pick(SURNAMES);
        const guests = guestsFor(room.bedCount + room.extraBedCapacity);

        const multiplier = guests.reduce((s, g) => s + PRICE_CATEGORY_MULTIPLIERS[g.priceCategory], 0);
        let base = 0;
        for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
          const nightly = priceByRoomTypeDay.get(`${room.roomTypeId}|${iso(d)}`) ?? avgByRoomType.get(room.roomTypeId) ?? 0;
          base += nightly * multiplier;
        }
        const baseAmount = round2(base);
        const discountPercent = weighted<number>([[0, 80], [5, 10], [10, 8], [15, 2]]);
        const discountAmount = round2((baseAmount * discountPercent) / 100);
        const finalAmount = round2(baseAmount - discountAmount);
        const taxAmount = round2(nights * guests.reduce((s, g) => s + taxRates[g.taxCategory], 0));

        const status = weighted<string>([["BOOKED", 74], ["PREBOOKED", 21], ["CANCELED", 5]]);
        const createdAt = minDate(addDays(checkIn, -int(14, 150)), addDays(TODAY, -int(1, 5)));
        // Nothing can have been paid on a day that hasn't happened yet.
        const paidOn = (d: Date) => minDate(d, TODAY);
        const isFuture = checkIn > TODAY;

        const payments: Draft["payments"] = [];
        if (status === "BOOKED" && isFuture) {
          // Upcoming stays: a deposit at most, the rest is paid on arrival.
          if (rand() < 0.7) {
            payments.push({ amount: round2(finalAmount * pick([0.2, 0.3, 0.3, 0.5])), method: "Bank Transfer", date: paidOn(addDays(createdAt, int(1, 10))), note: "Avans" });
          }
        } else if (status === "BOOKED") {
          const plan = weighted<string>([["full", 45], ["deposit+rest", 25], ["deposit", 22], ["none", 8]]);
          const depositDate = addDays(createdAt, int(1, 10));
          const deposit = round2(finalAmount * pick([0.2, 0.3, 0.3, 0.5]));
          if (plan === "full") {
            payments.push({ amount: finalAmount, method: pick(paymentMethods), date: rand() < 0.5 ? depositDate : checkIn, note: null });
          } else if (plan === "deposit+rest") {
            payments.push({ amount: deposit, method: "Bank Transfer", date: depositDate, note: "Avans" });
            payments.push({ amount: round2(finalAmount - deposit), method: pick(paymentMethods), date: checkIn, note: null });
          } else if (plan === "deposit") {
            payments.push({ amount: deposit, method: "Bank Transfer", date: depositDate, note: "Avans" });
          }
        } else if (status === "PREBOOKED" && rand() < 0.25) {
          payments.push({ amount: round2(finalAmount * 0.2), method: "Bank Transfer", date: paidOn(addDays(createdAt, int(1, 7))), note: "Avans" });
        }
        for (const pay of payments) pay.date = paidOn(pay.date);

        drafts.push({
          roomId: room.id,
          guestName: `${first} ${last}`,
          guestContact: guestContact(first, last),
          checkIn,
          checkOut,
          status,
          notes: rand() < 0.2 ? `${DEMO_TAG} ${pick(NOTES)}` : DEMO_TAG,
          guests,
          baseAmount,
          discountPercent,
          discountAmount,
          finalAmount,
          taxAmount,
          payments,
          createdAt,
        });

        // Changeover: most rooms are turned around the same day, some sit empty a night or few.
        cursor = addDays(checkOut, weighted<number>([[0, 45], [1, 25], [2, 15], [3, 8], [5, 7]]));
      }
    }
    console.log(`Prepared ${drafts.length - before} demo reservations for ${period.key} across ${rooms.length} rooms.`);
  }

  if (drafts.length === 0) {
    console.log("Nothing to add — run with --clean first to regenerate.");
    return;
  }

  // Number them in booking order, like the app would have.
  drafts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const sequence = await prisma.reservationSequence.upsert({
    where: { year: YEAR },
    update: { lastNumber: { increment: drafts.length } },
    create: { year: YEAR, lastNumber: drafts.length },
  });
  let next = sequence.lastNumber - drafts.length + 1;

  const BATCH = 25;
  for (let i = 0; i < drafts.length; i += BATCH) {
    await prisma.$transaction(
      drafts.slice(i, i + BATCH).map((d) =>
        prisma.reservation.create({
          data: {
            reservationNumber: `R-${String(next++).padStart(3, "0")}/${String(YEAR).slice(-2)}`,
            roomId: d.roomId,
            guestName: d.guestName,
            guestContact: d.guestContact,
            checkIn: d.checkIn,
            checkOut: d.checkOut,
            product: "FB",
            baseAmount: d.baseAmount,
            discountPercent: d.discountPercent,
            discountAmount: d.discountAmount,
            finalAmount: d.finalAmount,
            taxAmount: d.taxAmount,
            status: d.status,
            notes: d.notes,
            createdAt: d.createdAt,
            guests: { create: d.guests },
            payments: { create: d.payments },
          },
        })
      )
    );
  }

  const byStatus = drafts.reduce<Record<string, number>>((acc, d) => ((acc[d.status] = (acc[d.status] ?? 0) + 1), acc), {});
  console.log(`Created ${drafts.length} demo reservations:`, byStatus);
}

(process.argv.includes("--clean") ? clean() : seed())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
