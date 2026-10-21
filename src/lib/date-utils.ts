/**
 * Utility functions for handling Indonesian timezones (WIB / UTC+7).
 */

export const WIB_OFFSET_HOURS = 7;
export const WIB_OFFSET_MS = WIB_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Menghitung rentang waktu awal hari (00:00:00.000 WIB) dan akhir hari (23:59:59.999 WIB)
 * dikonversikan ke representasi Date UTC untuk kueri perbandingan database (Prisma).
 *
 * @param referenceDate Tanggal acuan (default: new Date())
 * @returns Objek dengan startOfToday dan endOfToday dalam Date UTC
 */
export function getWibDayRange(referenceDate: Date = new Date()): {
  startOfToday: Date;
  endOfToday: Date;
} {
  // Geser waktu acuan ke representasi waktu WIB
  const wibTime = new Date(referenceDate.getTime() + WIB_OFFSET_MS);

  // Ambil tahun, bulan, tanggal dalam zona WIB menggunakan method UTC
  const year = wibTime.getUTCFullYear();
  const month = wibTime.getUTCMonth();
  const date = wibTime.getUTCDate();

  // Awal hari WIB (00:00:00.000 WIB) dikonversikan kembali ke waktu UTC absolut
  const startOfToday = new Date(Date.UTC(year, month, date, 0, 0, 0, 0) - WIB_OFFSET_MS);

  // Akhir hari WIB (23:59:59.999 WIB) dikonversikan kembali ke waktu UTC absolut
  const endOfToday = new Date(Date.UTC(year, month, date, 23, 59, 59, 999) - WIB_OFFSET_MS);

  return { startOfToday, endOfToday };
}
