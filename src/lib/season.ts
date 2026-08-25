const MONTH_DAY = /^(\d{2})-(\d{2})$/;

export function monthDayToDate(year: number, monthDay: string): Date {
  const match = MONTH_DAY.exec(monthDay);
  if (!match) throw new Error(`Invalid MM-DD value: ${monthDay}`);
  const [, month, day] = match;
  return new Date(Date.UTC(year, Number(month) - 1, Number(day)));
}

export function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isoToDate(iso: string): Date {
  if (!ISO_DATE.test(iso)) throw new Error(`Invalid ISO date: ${iso}`);
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Season is assumed not to wrap the calendar year (e.g. May-Oct, not Nov-Mar). */
export function getSeasonRange(
  season: { seasonStartMonthDay: string; seasonEndMonthDay: string },
  year: number
): { start: Date; end: Date } {
  return {
    start: monthDayToDate(year, season.seasonStartMonthDay),
    end: monthDayToDate(year, season.seasonEndMonthDay),
  };
}

export function isWithinSeason(
  date: Date,
  season: { seasonStartMonthDay: string; seasonEndMonthDay: string }
): boolean {
  const { start, end } = getSeasonRange(season, date.getUTCFullYear());
  return date >= start && date <= end;
}

/** Months (1-12) that the season touches, in order, for a given year. */
export function getSeasonMonths(
  season: { seasonStartMonthDay: string; seasonEndMonthDay: string },
  year: number
): number[] {
  const { start, end } = getSeasonRange(season, year);
  const months: number[] = [];
  for (let m = start.getUTCMonth(); m <= end.getUTCMonth(); m++) {
    months.push(m + 1);
  }
  return months;
}

/** Days within the given month (1-12) that also fall within the season, for a given year. */
export function getMonthDaysInSeason(
  season: { seasonStartMonthDay: string; seasonEndMonthDay: string },
  year: number,
  month: number
): Date[] {
  const { start, end } = getSeasonRange(season, year);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month, 0));
  const rangeStart = firstOfMonth > start ? firstOfMonth : start;
  const rangeEnd = lastOfMonth < end ? lastOfMonth : end;

  const days: Date[] = [];
  for (
    let d = new Date(rangeStart);
    d <= rangeEnd;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
  ) {
    days.push(new Date(d));
  }
  return days;
}

/** Current year/month if "now" falls in-season, otherwise the season's first month. */
export function getDefaultSeasonYearMonth(
  season: { seasonStartMonthDay: string; seasonEndMonthDay: string },
  now: Date
): { year: number; month: number } {
  const year = now.getFullYear();
  const seasonMonths = getSeasonMonths(season, year);
  const currentMonth = now.getMonth() + 1;
  const month = seasonMonths.includes(currentMonth)
    ? currentMonth
    : seasonMonths[0];
  return { year, month };
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
