import dayjs from "dayjs";

/**
 * Date utilities for journal operations
 * All dates are returned in ISO date format (YYYY-MM-DD)
 */

const DATE_FORMAT = "YYYY-MM-DD";

/** Get today's date in YYYY-MM-DD format */
export function today(): string {
  return dayjs().format(DATE_FORMAT);
}

/** Get a date N days ago in YYYY-MM-DD format */
export function daysAgo(days: number): string {
  return dayjs().subtract(days, "day").format(DATE_FORMAT);
}

/** Format a date for display (e.g., "Jan 05, 2026") */
export function formatDate(date: Date | string): string {
  return dayjs(date).format("MMM DD, YYYY");
}

/** Get current ISO timestamp */
export function nowISO(): string {
  return dayjs().toISOString();
}

/** Format a timestamp for display (e.g., "Jan 05, 2026") */
export function formatTimestamp(timestamp: Date | string): string {
  return dayjs(timestamp).format("MMM DD, YYYY");
}

/** Check if two dates are the same day */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return dayjs(date1).isSame(dayjs(date2), "day");
}

/** Get a Set of date strings for streak calculation */
export function getDateSet(entries: { entry_date: string }[]): Set<string> {
  return new Set(entries.map((e) => e.entry_date));
}

/** Calculate streak from a set of entry dates */
export function calculateStreak(dates: Set<string>): number {
  let streak = 0;
  let checkDate = dayjs();

  while (dates.has(checkDate.format(DATE_FORMAT))) {
    streak++;
    checkDate = checkDate.subtract(1, "day");
  }

  return streak;
}
