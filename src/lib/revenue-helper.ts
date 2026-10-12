export interface BookingFinancialRecord {
  id: string;
  created_at: Date | string;
  status: string;
  property?: {
    name: string;
    price_per_month: number;
    owner?: { name: string; whatsapp_number?: string } | null;
  } | null;
  room_type?: {
    name: string;
    price_per_month: number;
  } | null;
}

export const VALID_REVENUE_STATUSES = ["PAID", "ACCEPTED", "APPROVED"];

/**
 * Menghitung nominal tarif sewa booking:
 * Mengutamakan harga dari tipe kamar (room_type.price_per_month),
 * jika tidak tersedia, fallback ke harga properti (property.price_per_month).
 */
export function getBookingAmount(booking: BookingFinancialRecord): number {
  if (booking.room_type && typeof booking.room_type.price_per_month === "number") {
    return booking.room_type.price_per_month;
  }
  if (booking.property && typeof booking.property.price_per_month === "number") {
    return booking.property.price_per_month;
  }
  return 0;
}

/**
 * Memformat nominal angka ke format mata uang Rupiah Indonesia (cth: Rp 1.500.000)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Menghitung persentase pertumbuhan omzet bulan ini dibanding bulan sebelumnya.
 * Mengembalikan null jika bulan sebelumnya 0 dan bulan ini 0.
 */
export function calculateRevenueGrowth(
  currentMonthRevenue: number,
  previousMonthRevenue: number
): number | null {
  if (previousMonthRevenue === 0) {
    if (currentMonthRevenue === 0) return 0;
    return 100; // Pertumbuhan 100% dari nol
  }
  const growth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
  return Math.round(growth * 10) / 10;
}

export interface MonthlyRevenueData {
  month: string;
  monthKey: string;
  revenue: number;
  bookingsCount: number;
}

/**
 * Mengelompokkan riwayat booking ke dalam N bulan terakhir (default: 6 bulan).
 * Urutan kronologis dari bulan tertua hingga bulan berjalan.
 */
export function aggregateMonthlyRevenue(
  bookings: BookingFinancialRecord[],
  monthsCount: number = 6
): MonthlyRevenueData[] {
  const result: MonthlyRevenueData[] = [];
  const now = new Date();

  // Siapkan rentang bulan mundur
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    result.push({ month: monthLabel, monthKey, revenue: 0, bookingsCount: 0 });
  }

  // Akumulasikan nominal booking yang berstatus sukses
  for (const b of bookings) {
    if (!VALID_REVENUE_STATUSES.includes(b.status)) continue;
    const bDate = new Date(b.created_at);
    if (isNaN(bDate.getTime())) continue;

    const bKey = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}`;
    const target = result.find((r) => r.monthKey === bKey);
    if (target) {
      target.revenue += getBookingAmount(b);
      target.bookingsCount += 1;
    }
  }

  return result;
}
