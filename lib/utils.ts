/**
 * lib/utils.ts – Shared utilities (cn helper, formatters, etc.)
 * Clean Bootstrap-style helpers with zero emojis.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string or timestamp to Indonesian locale */
export function formatDate(dateStr: string | number): string {
  try {
    const date =
      typeof dateStr === "number" ? new Date(dateStr) : new Date(dateStr);
    return format(date, "dd MMMM yyyy", { locale: idLocale });
  } catch {
    return String(dateStr);
  }
}

/** Format a timestamp to relative time ("2 hari lalu") */
export function timeAgo(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: idLocale,
  });
}

/** Return badge CSS class for item type */
export function typeBadgeClass(type: "Lost" | "Found"): string {
  return type === "Lost" ? "badge-lost" : "badge-found";
}

/** Return badge CSS class for status */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "Open":
      return "badge-status-open";
    case "Under Review":
      return "badge-status-review";
    case "Menuju Pos Admin":
      return "badge-status-review"; // Reuse review badge class or create new one later
    case "Sudah di Pos Admin":
      return "badge-status-open";
    case "Returned":
      return "badge-status-returned";
    case "Closed":
      return "badge-status-closed";
    default:
      return "badge-status-closed";
  }
}

/** Indonesian labels for status */
export function statusLabel(status: string): string {
  switch (status) {
    case "Open":
      return "Aktif";
    case "Under Review":
      return "Dalam Tinjauan";
    case "Menuju Pos Admin":
      return "Menuju Pos Admin";
    case "Sudah di Pos Admin":
      return "Di Pos Admin";
    case "Returned":
      return "Dikembalikan";
    case "Closed":
      return "Ditutup";
    default:
      return status;
  }
}

/** Indonesian labels for item type */
export function typeLabel(type: "Lost" | "Found"): string {
  return type === "Lost" ? "Hilang" : "Ditemukan";
}

/** Truncate text to n characters */
export function truncate(text: string, n: number): string {
  return text.length > n ? text.slice(0, n) + "…" : text;
}

/** Session token key in localStorage */
export const SESSION_TOKEN_KEY = "unklab_lnf_token";
