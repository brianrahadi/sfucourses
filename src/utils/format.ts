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
    }).format(date) + " PST"
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
