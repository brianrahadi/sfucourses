import { createHash } from "crypto";

export function getDarkColorFromHash(input: string): string {
  const hash = createHash("sha256").update(input).digest("hex");

  const hex = hash.substring(0, 6);

  const r = parseInt(hex.substring(0, 2), 16) % 128; // Limit to 0-127
  const g = parseInt(hex.substring(2, 4), 16) % 128;
  const b = parseInt(hex.substring(4, 6), 16) % 128;

  const darkHexColor = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  return darkHexColor;
}

export function formatTime(hour: number, minute: number = 0): string {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(
  date: string | Date,
  withYear: boolean = false
) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  });
}

export function formatShortDescriptiveDate(date: Date) {
  return (
    Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(date)
      .toLowerCase() + " pst"
  );
}

export function capitalize(str: string) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export function numberWithCommas(str: number) {
  return str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toTermCode(term: string) {
  return term.toLowerCase().split(" ").reverse().join("-");
}

/**
 * Formats a date to ISO format for iCalendar
 * @param date The date to format
 * @param includeTime Whether to include time in the formatted string
 * @returns Formatted date string for iCalendar
 */
export function formatISODate(date: Date, includeTime: boolean): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  if (!includeTime) {
    return `${year}${month}${day}`;
  }

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Converts day abbreviation to day of week number (0-6, Sunday is 0)
 * @param day Day abbreviation (Mo, Tu, We, Th, Fr, Sa, Su)
 * @returns Day number 0-6 or null if invalid
 */
export function getDayOfWeek(day: string): number | null {
  const dayMap: Record<string, number> = {
    Su: 0,
    Mo: 1,
    Tu: 2,
    We: 3,
    Th: 4,
    Fr: 5,
    Sa: 6,
  };

  return dayMap[day] !== undefined ? dayMap[day] : null;
}
