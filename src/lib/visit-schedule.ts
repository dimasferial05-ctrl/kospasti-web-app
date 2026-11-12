import { getWibDayRange, WIB_OFFSET_MS } from "@/lib/date-utils";

export const VISIT_TIME_SLOTS = [
  { value: "09:00 - 11:00", label: "Pagi (09:00 - 11:00)" },
  { value: "11:00 - 13:00", label: "Siang Awal (11:00 - 13:00)" },
  { value: "13:00 - 15:00", label: "Siang (13:00 - 15:00)" },
  { value: "15:00 - 17:00", label: "Sore (15:00 - 17:00)" },
  { value: "17:00 - 19:00", label: "Petang (17:00 - 19:00)" },
] as const;

export const VALID_VISIT_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
] as const;

export type VisitStatus = (typeof VALID_VISIT_STATUSES)[number];

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  PENDING: "Menunggu Konfirmasi",
  ACCEPTED: "Disetujui Pemilik",
  REJECTED: "Ditolak",
  RESCHEDULED: "Dijadwalkan Ulang",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Survei Selesai",
};

export const INDONESIAN_WA_REGEX = /^(?:\+62|62|0)8[0-9]{8,11}$/;

/**
 * Memvalidasi format nomor WhatsApp Indonesia (+628..., 628..., atau 08...).
 */
export function isValidIndonesianWhatsApp(phone: string): boolean {
  const cleaned = phone.trim();
  if (!cleaned || cleaned.length > 15) return false;
  return INDONESIAN_WA_REGEX.test(cleaned);
}

/**
 * Mengurai string tanggal ("YYYY-MM-DD" atau ISO string) tanpa pergeseran hari akibat zona waktu.
 * Tanggal kalender murni disimpan pada pukul 12:00 WIB (05:00 UTC) agar konsisten di WIB & UTC.
 */
export function parseVisitDateInput(rawDate: string): Date | null {
  const trimmed = rawDate.trim();
  if (!trimmed) return null;

  const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    const candidate = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0));

    // Pastikan tanggal valid dan tidak mengalami rollover (misal 2026-02-30)
    if (
      candidate.getUTCFullYear() !== year ||
      candidate.getUTCMonth() !== month - 1 ||
      candidate.getUTCDate() !== day
    ) {
      return null;
    }
    return candidate;
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Mengecek apakah tanggal kunjungan lebih awal dari hari ini di zona waktu WIB (UTC+7).
 */
export function isPastVisitDate(visitDate: Date, referenceDate: Date = new Date()): boolean {
  const { startOfToday } = getWibDayRange(referenceDate);
  return visitDate.getTime() < startOfToday.getTime();
}

/**
 * Mengembalikan string tanggal hari ini ("YYYY-MM-DD") dalam zona waktu WIB (UTC+7).
 */
export function getTodayWibDateString(referenceDate: Date = new Date()): string {
  const wib = new Date(referenceDate.getTime() + WIB_OFFSET_MS);
  const year = wib.getUTCFullYear();
  const month = String(wib.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wib.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Mengembalikan string tanggal maksimal pengajuan survei ("YYYY-MM-DD") N hari ke depan (WIB).
 */
export function getMaxVisitWibDateString(
  daysAhead = 30,
  referenceDate: Date = new Date()
): string {
  const future = new Date(referenceDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return getTodayWibDateString(future);
}

/**
 * Memformat tanggal survei menjadi string Bahasa Indonesia lengkap pada zona waktu WIB.
 */
export function formatVisitDateId(dateInput: Date | string): string {
  const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(dateObj.getTime())) return "-";
  return dateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

